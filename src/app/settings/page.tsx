'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ImportExport from '@/components/ImportExport';
import { useAssetData } from '@/hooks/useAssetData';
import { useI18n } from '@/i18n';
import { Currency, ChartColorTheme } from '@/types';
import { useChartTheme } from '@/contexts/ChartThemeContext';
import { CHART_THEME_OPTIONS, CHART_THEMES } from '@/config/chartThemes';

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

  const { t } = useI18n();
  const { themeId, setThemeId } = useChartTheme();

  const [snapshotInterval, setSnapshotInterval] = useState(settings.snapshotIntervalDays);
  const [exchangeRate, setExchangeRate] = useState(currentAssets.exchangeRate);
  const [defaultCurrency, setDefaultCurrency] = useState(settings.defaultCurrency);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<ChartColorTheme>(themeId);

  const handleSaveSettings = () => {
    updateSettings({
      snapshotIntervalDays: snapshotInterval,
      defaultCurrency,
      chartColorTheme: selectedTheme,
    });
    updateExchangeRate(exchangeRate);
    setThemeId(selectedTheme);
    setSaveStatus(t.settings.settingsSaved);
    setTimeout(() => setSaveStatus(''), 3000);
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

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.settings.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t.settings.subtitle}
          </p>
        </div>

        {/* General Settings */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.settings.generalSettings}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">{t.settings.snapshotInterval}</label>
              <input
                type="number"
                value={snapshotInterval}
                onChange={(e) => setSnapshotInterval(parseInt(e.target.value) || 30)}
                min={1}
                max={365}
                className="input w-32"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t.settings.snapshotIntervalHint}
              </p>
            </div>

            <div>
              <label className="label">{t.settings.defaultCurrency}</label>
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
              <label className="label">{t.settings.exchangeRate}</label>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 31.5)}
                step={0.01}
                min={1}
                className="input w-32"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t.settings.exchangeRateHint}
              </p>
            </div>

            <div>
              <label className="label">{t.settings.chartColorTheme}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {CHART_THEME_OPTIONS.map((option) => {
                  const themeConfig = CHART_THEMES[option.id];
                  const isSelected = selectedTheme === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedTheme(option.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-2">
                        {Object.values(themeConfig.assetColors).slice(0, 4).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className={`text-sm font-medium ${
                        isSelected
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {t.settings.chartThemes[option.labelKey as keyof typeof t.settings.chartThemes]}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t.settings.chartColorThemeHint}
              </p>
            </div>

            <div className="pt-4">
              <button onClick={handleSaveSettings} className="btn btn-primary">
                {t.settings.saveSettings}
              </button>
              {saveStatus && (
                <span className="ml-3 text-green-600 dark:text-green-400">{saveStatus}</span>
              )}
            </div>
          </div>
        </div>

        {/* Target Allocation Link */}
        <Link href="/settings/allocation" className="block mb-6">
          <div className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {t.allocationSettings.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.allocationSettings.subtitle}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </Link>

        {/* Data Management */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.settings.dataManagement}
          </h2>
          <ImportExport
            onExport={exportData}
            onImport={importData}
            onClear={clearAllData}
          />
        </div>

        {/* About */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.settings.about}</h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>{t.nav.appName}</strong> - {t.dashboard.subtitle}
            </p>
            <p>
              {t.settings.version}: 1.0.0
            </p>
            <p>
              {t.settings.aboutDesc}
            </p>
            <p className="pt-2">
              <strong>{t.settings.features}:</strong>
            </p>
            <ul className="list-disc list-inside pl-2">
              <li>{t.settings.featureList.multiAsset}</li>
              <li>{t.settings.featureList.dualCurrency}</li>
              <li>{t.settings.featureList.stockPrices}</li>
              <li>{t.settings.featureList.snapshots}</li>
              <li>{t.settings.featureList.visualization}</li>
              <li>{t.settings.featureList.importExport}</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
