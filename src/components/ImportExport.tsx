'use client';

import { useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import { saveToDropbox, generateBackupFilename } from '@/lib/dropboxSaver';

interface ImportExportProps {
  onExport: () => string;
  onImport: (data: string) => boolean;
  onClear: () => void;
  dropboxAppKey?: string;
}

// Convert sharing URLs to direct download URLs for supported services
function convertToDirectUrl(url: string): string {
  // Dropbox: change www.dropbox.com to dl.dropboxusercontent.com and ensure dl=1
  if (url.includes('dropbox.com')) {
    let directUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    // Remove dl=0 if present and ensure dl=1
    directUrl = directUrl.replace(/[?&]dl=0/, '');
    if (!directUrl.includes('dl=1')) {
      directUrl += (directUrl.includes('?') ? '&' : '?') + 'dl=1';
    }
    return directUrl;
  }

  // GitHub Gist: convert to raw URL if needed
  if (url.includes('gist.github.com') && !url.includes('gist.githubusercontent.com')) {
    // Convert gist.github.com/user/id to raw format
    const gistMatch = url.match(/gist\.github\.com\/([^/]+)\/([^/]+)/);
    if (gistMatch) {
      return `https://gist.githubusercontent.com/${gistMatch[1]}/${gistMatch[2]}/raw`;
    }
  }

  return url;
}

export default function ImportExport({ onExport, onImport, onClear, dropboxAppKey }: ImportExportProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [isSavingToDropbox, setIsSavingToDropbox] = useState(false);

  const handleExport = () => {
    const data = onExport();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asset-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setImportStatus('success');
    setStatusMessage(t.settings.dataExported);
    setTimeout(() => setImportStatus('idle'), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = onImport(text);

      if (success) {
        setImportStatus('success');
        setStatusMessage(t.settings.dataImported);
      } else {
        setImportStatus('error');
        setStatusMessage(t.settings.importFailed);
      }
    } catch (error) {
      setImportStatus('error');
      setStatusMessage(t.settings.readFileFailed);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => setImportStatus('idle'), 3000);
  };

  const handleClear = () => {
    if (confirm(t.settings.clearDataConfirm)) {
      onClear();
      setImportStatus('success');
      setStatusMessage(t.settings.dataCleared);
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const handleLoadFromUrl = async () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) {
      setImportStatus('error');
      setStatusMessage(t.settings.invalidUrl);
      setTimeout(() => setImportStatus('idle'), 3000);
      return;
    }

    // Basic URL validation
    try {
      new URL(trimmedUrl);
    } catch {
      setImportStatus('error');
      setStatusMessage(t.settings.invalidUrl);
      setTimeout(() => setImportStatus('idle'), 3000);
      return;
    }

    setIsLoadingUrl(true);

    try {
      // Convert sharing URLs to direct download format
      const downloadUrl = convertToDirectUrl(trimmedUrl);

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const text = await response.text();
      const success = onImport(text);

      if (success) {
        setImportStatus('success');
        setStatusMessage(t.settings.dataImported);
        setUrlInput('');
      } else {
        setImportStatus('error');
        setStatusMessage(t.settings.importFailed);
      }
    } catch (error) {
      console.error('Failed to load from URL:', error);
      setImportStatus('error');
      setStatusMessage(t.settings.urlLoadFailed);
    } finally {
      setIsLoadingUrl(false);
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const handleSaveToDropbox = async () => {
    if (!dropboxAppKey) {
      setImportStatus('error');
      setStatusMessage(t.settings.dropboxNotConfigured);
      setTimeout(() => setImportStatus('idle'), 3000);
      return;
    }

    setIsSavingToDropbox(true);

    try {
      const data = onExport();
      const filename = generateBackupFilename();
      await saveToDropbox(data, filename, dropboxAppKey);

      setImportStatus('success');
      setStatusMessage(t.settings.dropboxSaveSuccess);
    } catch (error) {
      if (error instanceof Error && error.message === 'cancelled') {
        setImportStatus('error');
        setStatusMessage(t.settings.dropboxSaveCancelled);
      } else if (error instanceof Error && error.message.includes('not supported')) {
        setImportStatus('error');
        setStatusMessage(t.settings.dropboxBrowserNotSupported);
      } else {
        console.error('Dropbox save error:', error);
        setImportStatus('error');
        setStatusMessage(t.settings.dropboxSaveFailed);
      }
    } finally {
      setIsSavingToDropbox(false);
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const handleLoadDemoData = async () => {
    setIsLoadingDemo(true);

    try {
      // Construct URL with basePath for GitHub Pages
      const basePath = process.env.NODE_ENV === 'production'
        ? '/asset-tracking-claude'
        : '';
      const demoUrl = `${basePath}/mock.json`;

      const response = await fetch(demoUrl);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const text = await response.text();
      const success = onImport(text);

      if (success) {
        setImportStatus('success');
        setStatusMessage(t.settings.demoDataLoaded);
      } else {
        setImportStatus('error');
        setStatusMessage(t.settings.importFailed);
      }
    } catch (error) {
      console.error('Failed to load demo data:', error);
      setImportStatus('error');
      setStatusMessage(t.settings.demoLoadFailed);
    } finally {
      setIsLoadingDemo(false);
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button onClick={handleExport} className="btn btn-primary">
          {t.settings.exportData}
        </button>
        <button onClick={handleImportClick} className="btn btn-secondary">
          {t.settings.importData}
        </button>
        {dropboxAppKey && (
          <button
            onClick={handleSaveToDropbox}
            disabled={isSavingToDropbox}
            className="btn btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L6.5 6.5L12 11L17.5 6.5L12 2Z"/>
              <path d="M6.5 6.5L1 11L6.5 15.5L12 11L6.5 6.5Z"/>
              <path d="M17.5 6.5L12 11L17.5 15.5L23 11L17.5 6.5Z"/>
              <path d="M6.5 15.5L12 20L17.5 15.5L12 11L6.5 15.5Z"/>
            </svg>
            {isSavingToDropbox ? t.settings.savingToDropbox : t.settings.saveToDropbox}
          </button>
        )}
        <button onClick={handleClear} className="btn btn-danger">
          {t.settings.clearAllData}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Demo Data Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t.settings.tryDemoData}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t.settings.demoDataDesc}
            </p>
          </div>
          <button
            onClick={handleLoadDemoData}
            disabled={isLoadingDemo}
            className="btn btn-secondary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingDemo ? t.settings.loadingDemo : t.settings.loadDemoData}
          </button>
        </div>
      </div>

      {/* URL Import Section */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder={t.settings.urlPlaceholder}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoadingUrl}
        />
        <button
          onClick={handleLoadFromUrl}
          disabled={isLoadingUrl || !urlInput.trim()}
          className="btn btn-secondary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingUrl ? t.settings.loadingFromUrl : t.settings.loadFromUrl}
        </button>
      </div>

      {importStatus !== 'idle' && (
        <div
          className={`p-3 rounded-lg ${
            importStatus === 'success'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {statusMessage}
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t.settings.dataNote}
      </p>
    </div>
  );
}
