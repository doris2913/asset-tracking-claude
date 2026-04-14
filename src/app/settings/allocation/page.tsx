'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { useAssetData } from '@/hooks/useAssetData';
import { useI18n } from '@/i18n';
import { AssetType } from '@/types';

const ASSET_TYPES: AssetType[] = [
  'cash_twd',
  'cash_usd',
  'stock_tw',
  'stock_us',
  'us_tbills',
  // Note: 'liability' is intentionally excluded from allocation settings
];

export default function AllocationSettingsPage() {
  const { settings, updateSettings, isLoaded } = useAssetData();
  const { t } = useI18n();

  const [allocations, setAllocations] = useState<Record<AssetType, number>>(() => {
    const initial: Partial<Record<AssetType, number>> = {};
    ASSET_TYPES.forEach(type => {
      initial[type] = 0;
    });
    return (settings.targetAllocation || initial) as Record<AssetType, number>;
  });

  const [saveStatus, setSaveStatus] = useState<string>('');

  useEffect(() => {
    if (isLoaded && settings.targetAllocation) {
      setAllocations(settings.targetAllocation);
    }
  }, [isLoaded, settings.targetAllocation]);

  const handleAllocationChange = (type: AssetType, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAllocations((prev) => ({
      ...prev,
      [type]: Math.max(0, Math.min(100, numValue)), // Clamp between 0-100
    }));
  };

  const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  const handleSave = () => {
    updateSettings({ targetAllocation: allocations });
    setSaveStatus(t.settings.settingsSaved);
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleReset = () => {
    const reset: Partial<Record<AssetType, number>> = {};
    ASSET_TYPES.forEach(type => {
      reset[type] = 0;
    });
    setAllocations(reset as Record<AssetType, number>);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t.allocationSettings.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t.allocationSettings.subtitle}
          </p>
        </div>

        {/* Settings Card */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.allocationSettings.targetAllocation}
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {t.allocationSettings.description}
          </p>

          <div className="space-y-4">
            {ASSET_TYPES.map((type) => (
              <div key={type} className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.assetTypes[type]}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={allocations[type]}
                    onChange={(e) => handleAllocationChange(type, e.target.value)}
                    className="input w-24 text-right"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {t.allocationSettings.total}
              </span>
              <span
                className={`text-lg font-semibold ${
                  Math.abs(totalAllocation - 100) < 0.01
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {totalAllocation.toFixed(1)}%
              </span>
            </div>
            {Math.abs(totalAllocation - 100) > 0.01 && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                {t.allocationSettings.totalWarning}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex space-x-3">
            <button onClick={handleSave} className="btn btn-primary">
              {t.settings.saveSettings}
            </button>
            <button onClick={handleReset} className="btn btn-secondary">
              {t.allocationSettings.reset}
            </button>
          </div>

          {/* Save Status */}
          {saveStatus && (
            <div className="mt-4 p-3 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {saveStatus}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {t.allocationSettings.info}
          </p>
        </div>
      </main>
    </div>
  );
}
