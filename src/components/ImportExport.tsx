'use client';

import { useRef, useState } from 'react';

interface ImportExportProps {
  onExport: () => string;
  onImport: (data: string) => boolean;
  onClear: () => void;
}

export default function ImportExport({ onExport, onImport, onClear }: ImportExportProps) {
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
    setStatusMessage('Data exported successfully!');
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
        setStatusMessage('Data imported successfully!');
      } else {
        setImportStatus('error');
        setStatusMessage('Failed to import data. Invalid format.');
      }
    } catch (error) {
      setImportStatus('error');
      setStatusMessage('Failed to read file.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => setImportStatus('idle'), 3000);
  };

  const handleClear = () => {
    if (
      confirm(
        'Are you sure you want to clear all data? This action cannot be undone. Please export your data first if you want to keep a backup.'
      )
    ) {
      onClear();
      setImportStatus('success');
      setStatusMessage('All data cleared.');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button onClick={handleExport} className="btn btn-primary">
          Export Data
        </button>
        <button onClick={handleImportClick} className="btn btn-secondary">
          Import Data
        </button>
        <button onClick={handleClear} className="btn btn-danger">
          Clear All Data
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
        Export your data to keep a backup. Import previously exported data to restore.
        Data is stored locally in your browser.
      </p>
    </div>
  );
}
