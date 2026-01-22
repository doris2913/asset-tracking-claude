'use client';

import { useRef, useState } from 'react';
import { useI18n } from '@/i18n';

interface ImportExportProps {
  onExport: () => string;
  onImport: (data: string) => boolean;
  onClear: () => void;
}

// Convert Google Drive sharing URL to direct download URL
function convertGoogleDriveUrl(url: string): string {
  // Pattern 1: https://drive.google.com/file/d/{fileId}/view?usp=sharing
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
  }

  // Pattern 2: https://drive.google.com/open?id={fileId}
  const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openIdMatch) {
    return `https://drive.google.com/uc?export=download&id=${openIdMatch[1]}`;
  }

  // Not a Google Drive URL, return as-is
  return url;
}

export default function ImportExport({ onExport, onImport, onClear }: ImportExportProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

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
      // Convert Google Drive URLs to direct download format
      const downloadUrl = convertGoogleDriveUrl(trimmedUrl);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button onClick={handleExport} className="btn btn-primary">
          {t.settings.exportData}
        </button>
        <button onClick={handleImportClick} className="btn btn-secondary">
          {t.settings.importData}
        </button>
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
