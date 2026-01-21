'use client';

import { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import GrowthAnalysisCard from '@/components/GrowthAnalysisCard';
import { useAssetData } from '@/hooks/useAssetData';
import { useI18n } from '@/i18n';
import { Currency } from '@/types';
import { analyzeGrowthSources } from '@/utils/calculations';

export default function AnalysisPage() {
  const { snapshots, isLoaded } = useAssetData();
  const { t } = useI18n();
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');

  // Calculate growth analysis for the most recent period
  const growthAnalysis = useMemo(() => {
    if (snapshots.length < 2) return null;

    const sortedSnapshots = [...snapshots].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Compare latest snapshot with previous one
    const latestSnapshot = sortedSnapshots[0];
    const previousSnapshot = sortedSnapshots[1];

    return analyzeGrowthSources(previousSnapshot, latestSnapshot);
  }, [snapshots]);

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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.analysis.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t.analysis.subtitle}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">{t.common.currency}:</label>
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
              className="select w-24"
            >
              <option value="TWD">TWD</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Growth Analysis */}
        <GrowthAnalysisCard analysis={growthAnalysis} currency={displayCurrency} />
      </main>
    </div>
  );
}
