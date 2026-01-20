'use client';

import { useRef, useState } from 'react';
import { useI18n } from '@/i18n';

interface ImportExportProps {
  onExport: () => string;
  onImport: (data: string) => boolean;
  onClear: () => void;
}

export default function ImportExport({ onExport, onImport, onClear }: ImportExportProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

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
