'use client';

import { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import GrowthAnalysisCard from '@/components/GrowthAnalysisCard';
import { useAssetData } from '@/hooks/useAssetData';
import { useI18n } from '@/i18n';
import { Currency, GrowthAnalysis } from '@/types';
import { analyzeGrowthSources } from '@/utils/calculations';

export default function AnalysisPage() {
  const { snapshots, isLoaded } = useAssetData();
  const { t, language } = useI18n();
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('total');

  // Calculate growth analysis for ALL consecutive snapshot pairs
  const historicalAnalyses = useMemo(() => {
    if (snapshots.length < 2) return [];

    const sortedSnapshots = [...snapshots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Create analyses for each consecutive pair
    const analyses = [];
    for (let i = 0; i < sortedSnapshots.length - 1; i++) {
      const startSnapshot = sortedSnapshots[i];
      const endSnapshot = sortedSnapshots[i + 1];
      const analysis = analyzeGrowthSources(startSnapshot, endSnapshot);
      analyses.push(analysis);
    }

    // Return in reverse chronological order (most recent first)
    return analyses.reverse();
  }, [snapshots]);

  // Calculate total/overall growth analysis
  const totalAnalysis = useMemo((): GrowthAnalysis | null => {
    if (snapshots.length < 2) return null;

    const sortedSnapshots = [...snapshots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Compare first and last snapshot for total growth
    const firstSnapshot = sortedSnapshots[0];
    const lastSnapshot = sortedSnapshots[sortedSnapshots.length - 1];

    return analyzeGrowthSources(firstSnapshot, lastSnapshot);
  }, [snapshots]);

  // Get the selected analysis to display
  const displayedAnalysis = useMemo(() => {
    if (selectedPeriod === 'total') {
      return totalAnalysis;
    }
    const index = parseInt(selectedPeriod);
    return historicalAnalyses[index] || null;
  }, [selectedPeriod, historicalAnalyses, totalAnalysis]);

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
          <div className="flex items-center space-x-4">
            {/* Period Selector */}
            {historicalAnalyses.length > 0 && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'zh-TW' ? '期間:' : 'Period:'}
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="select w-40"
                >
                  <option value="total">
                    {language === 'zh-TW' ? '總成長' : 'Total Growth'}
                  </option>
                  {historicalAnalyses.map((analysis, index) => (
                    <option key={index} value={index.toString()}>
                      {language === 'zh-TW' ? `期間 ${historicalAnalyses.length - index}` : `Period ${historicalAnalyses.length - index}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Currency Selector */}
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
        </div>

        {/* Growth Analysis */}
        {historicalAnalyses.length === 0 ? (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t.analysis.title}
            </h2>
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-4">📈</p>
                <p>{language === 'zh-TW' ? '需要至少兩個快照才能分析成長來源' : 'Need at least 2 snapshots to analyze growth'}</p>
              </div>
            </div>
          </div>
        ) : (
          <GrowthAnalysisCard 
            analysis={displayedAnalysis} 
            currency={displayCurrency}
            showIndex={false}
            isTotal={selectedPeriod === 'total'}
          />
        )}
      </main>
    </div>
  );
}
