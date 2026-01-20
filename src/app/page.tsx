'use client';

import { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import DashboardChart from '@/components/DashboardChart';
import AssetBreakdownChart from '@/components/AssetBreakdownChart';
import SummaryCard from '@/components/SummaryCard';
import { useAssetData } from '@/hooks/useAssetData';
import { useI18n } from '@/i18n';
import { Currency } from '@/types';
import {
  snapshotsToChartData,
  calculateMovingAverage,
  getAssetSummary,
  formatCurrency,
  calculateGrowthRate,
  getLatestSnapshotDate,
} from '@/utils/calculations';

export default function DashboardPage() {
  const {
    currentAssets,
    snapshots,
    totalTWD,
    totalUSD,
    isLoaded,
  } = useAssetData();

  const { t } = useI18n();
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');

  // Calculate chart data
  const chartData = useMemo(() => {
    const currentValues = snapshotsToChartData(snapshots, displayCurrency);
    // 3-month MA (assuming monthly snapshots, window = 3)
    const ma3M = calculateMovingAverage(currentValues, 3);
    // 1-year MA (assuming monthly snapshots, window = 12)
    const ma1Y = calculateMovingAverage(currentValues, 12);

    return { currentValues, ma3M, ma1Y };
  }, [snapshots, displayCurrency]);

  // Calculate asset breakdown
  const assetBreakdown = useMemo(() => {
    return getAssetSummary(currentAssets.assets, currentAssets.exchangeRate);
  }, [currentAssets]);

  // Calculate growth rates
  const growthStats = useMemo(() => {
    if (snapshots.length < 2) {
      return { monthlyGrowth: null, yearlyGrowth: null };
    }

    const sortedSnapshots = [...snapshots].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latest = sortedSnapshots[0];
    const prevMonth = sortedSnapshots[1];
    const prevYear = sortedSnapshots.find((s) => {
      const date = new Date(s.date);
      const latestDate = new Date(latest.date);
      const monthsDiff =
        (latestDate.getFullYear() - date.getFullYear()) * 12 +
        (latestDate.getMonth() - date.getMonth());
      return monthsDiff >= 11 && monthsDiff <= 13;
    });

    const latestValue = displayCurrency === 'TWD' ? latest.totalValueTWD : latest.totalValueUSD;
    const prevMonthValue =
      displayCurrency === 'TWD' ? prevMonth.totalValueTWD : prevMonth.totalValueUSD;
    const prevYearValue = prevYear
      ? displayCurrency === 'TWD'
        ? prevYear.totalValueTWD
        : prevYear.totalValueUSD
      : null;

    return {
      monthlyGrowth: calculateGrowthRate(prevMonthValue, latestValue),
      yearlyGrowth: prevYearValue ? calculateGrowthRate(prevYearValue, latestValue) : null,
    };
  }, [snapshots, displayCurrency]);

  // Get latest snapshot info
  const latestSnapshotDate = getLatestSnapshotDate(snapshots);

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.dashboard.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t.dashboard.subtitle}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title={t.dashboard.totalAssets}
            value={formatCurrency(displayCurrency === 'TWD' ? totalTWD : totalUSD, displayCurrency)}
            subtitle={`${currentAssets.assets.length} ${t.nav.assets.toLowerCase()}`}
            icon="💰"
            trend={
              growthStats.monthlyGrowth !== null
                ? {
                    value: growthStats.monthlyGrowth,
                    isPositive: growthStats.monthlyGrowth >= 0,
                  }
                : undefined
            }
            trendLabel={t.dashboard.vsLastMonth}
            color="blue"
          />
          <SummaryCard
            title={t.dashboard.exchangeRate}
            value={`${currentAssets.exchangeRate.toFixed(2)}`}
            subtitle="USD/TWD"
            icon="💱"
            color="green"
          />
          <SummaryCard
            title={t.dashboard.snapshots}
            value={snapshots.length.toString()}
            subtitle={latestSnapshotDate ? `${t.dashboard.latestSnapshot}: ${new Date(latestSnapshotDate).toLocaleDateString()}` : t.dashboard.noSnapshots}
            icon="📸"
            color="yellow"
          />
          <SummaryCard
            title={t.dashboard.yoyGrowth}
            value={
              growthStats.yearlyGrowth !== null
                ? `${growthStats.yearlyGrowth >= 0 ? '+' : ''}${growthStats.yearlyGrowth.toFixed(1)}%`
                : 'N/A'
            }
            subtitle={t.dashboard.yearOverYear}
            icon="📈"
            color="purple"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t.dashboard.assetGrowthChart}
            </h2>
            <DashboardChart
              currentValues={chartData.currentValues}
              movingAverage3M={chartData.ma3M}
              movingAverage1Y={chartData.ma1Y}
              currency={displayCurrency}
            />
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t.dashboard.assetAllocation}
            </h2>
            <AssetBreakdownChart breakdown={assetBreakdown} currency={displayCurrency} />
          </div>
        </div>

        {/* Asset Type Summary Table */}
        {assetBreakdown.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t.dashboard.assetSummary}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t.dashboard.type}
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t.dashboard.count}
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 text-right">
                      {t.dashboard.value} ({displayCurrency})
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 text-right">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assetBreakdown.map((summary) => (
                    <tr
                      key={summary.type}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {t.assetTypes[summary.type]}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {summary.count}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(
                          displayCurrency === 'TWD' ? summary.totalTWD : summary.totalUSD,
                          displayCurrency
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                        {summary.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
