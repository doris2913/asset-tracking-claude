'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import ImportExport from '@/components/ImportExport';
import { useAssetData } from '@/hooks/useAssetData';
import { Currency } from '@/types';

export default function SettingsPage() {
  const {
    settings,
    currentAssets,
    updateSettings,
    updateExchangeRate,
    exportData,
    importData,
    clearAllData,
    isLoaded,
  } = useAssetData();

  const [snapshotInterval, setSnapshotInterval] = useState(settings.snapshotIntervalDays);
  const [exchangeRate, setExchangeRate] = useState(currentAssets.exchangeRate);
  const [defaultCurrency, setDefaultCurrency] = useState(settings.defaultCurrency);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const handleSaveSettings = () => {
    updateSettings({
      snapshotIntervalDays: snapshotInterval,
      defaultCurrency,
    });
    updateExchangeRate(exchangeRate);
    setSaveStatus('Settings saved!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure your asset tracker preferences
          </p>
        </div>

        {/* General Settings */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            General Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Snapshot Interval (days)</label>
              <input
                type="number"
                value={snapshotInterval}
                onChange={(e) => setSnapshotInterval(parseInt(e.target.value) || 30)}
                min={1}
                max={365}
                className="input w-32"
              />
              <p className="text-xs text-gray-500 mt-1">
                How often you want to be reminded to create a snapshot.
                When updating assets after this interval, a snapshot will be auto-created.
              </p>
            </div>

            <div>
              <label className="label">Default Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value as Currency)}
                className="select w-32"
              >
                <option value="TWD">TWD</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="label">Exchange Rate (USD to TWD)</label>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 31.5)}
                step={0.01}
                min={1}
                className="input w-32"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for converting between USD and TWD. Update this regularly for accurate totals.
              </p>
            </div>

            <div className="pt-4">
              <button onClick={handleSaveSettings} className="btn btn-primary">
                Save Settings
              </button>
              {saveStatus && (
                <span className="ml-3 text-green-600 dark:text-green-400">{saveStatus}</span>
              )}
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Data Management
          </h2>
          <ImportExport
            onExport={exportData}
            onImport={importData}
            onClear={clearAllData}
          />
        </div>

        {/* About */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Asset Tracker</strong> - Track your asset growth over time
            </p>
            <p>
              Version: 1.0.0
            </p>
            <p>
              This application stores all data locally in your browser using localStorage.
              No data is sent to any server. Use the export feature to backup your data.
            </p>
            <p className="pt-2">
              <strong>Features:</strong>
            </p>
            <ul className="list-disc list-inside pl-2">
              <li>Track multiple asset types (Cash, Stocks, T-Bills, Rent)</li>
              <li>Support for TWD and USD currencies</li>
              <li>Automatic stock price updates via Yahoo Finance</li>
              <li>Monthly snapshots for historical tracking</li>
              <li>Growth visualization with moving averages</li>
              <li>Import/Export for data portability</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
