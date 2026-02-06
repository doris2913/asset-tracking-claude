'use client';

import { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import DashboardChart from '@/components/DashboardChart';
import AssetBreakdownChart from '@/components/AssetBreakdownChart';
import AllocationHistoryChart from '@/components/AllocationHistoryChart';
import AllocationComparisonChart from '@/components/AllocationComparisonChart';
import AllocationAdjustmentRecommendation from '@/components/AllocationAdjustmentRecommendation';
import AssetGrowthAnalysis from '@/components/AssetGrowthAnalysis';
import SummaryCard from '@/components/SummaryCard';
import { useAssetData } from '@/hooks/useAssetData';
import { fetchMultipleStockPrices, API_SOURCE_CONFIG, ProgressCallback } from '@/lib/stockPriceManager';
import { useI18n } from '@/i18n';
import { Currency, StockPrice, Asset } from '@/types';
import {
  snapshotsToChartData,
  getAssetSummary,
  formatCurrency,
  calculateGrowthRate,
  getLatestSnapshotDate,
  toTWD,
  toUSD,
  getEffectiveValue,
} from '@/utils/calculations';

// Calculate portfolio value with given price type (liabilities as negative)
function calculatePortfolioValue(
  assets: Asset[],
  stockPrices: Record<string, StockPrice>,
  exchangeRate: number,
  priceType: 'current' | 'ma3m' | 'ma1y',
  currency: Currency
): number {
  let total = 0;

  for (const asset of assets) {
    let assetValue = asset.value;

    // For stocks with price data, recalculate using the specified price type
    if (asset.symbol && asset.shares && stockPrices[asset.symbol]) {
      const priceData = stockPrices[asset.symbol];
      let price: number;

      switch (priceType) {
        case 'ma3m':
          price = priceData.movingAvg3M;
          break;
        case 'ma1y':
          price = priceData.movingAvg1Y;
          break;
        default:
          price = priceData.currentPrice;
      }

      assetValue = asset.shares * price;
    }

    // Apply negative sign for liabilities
    if (asset.type === 'liability') {
      assetValue = -Math.abs(assetValue);
    }

    // Convert to display currency
    if (currency === 'TWD') {
      total += toTWD(assetValue, asset.currency, exchangeRate);
    } else {
      total += toUSD(assetValue, asset.currency, exchangeRate);
    }
  }

  return total;
}

export default function DashboardPage() {
  const {
    currentAssets,
    snapshots,
    stockPrices,
    settings,
    totalTWD,
    totalUSD,
    updateStockPricesWithMA,
    isLoaded,
  } = useAssetData();

  const { t, language } = useI18n();
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [priceUpdateStatus, setPriceUpdateStatus] = useState<string>('');
  const [hideAssets, setHideAssets] = useState(() => {
    // Load preference from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hideAssets') === 'true';
    }
    return false;
  });

  const toggleHideAssets = () => {
    setHideAssets(prev => {
      const newValue = !prev;
      localStorage.setItem('hideAssets', String(newValue));
      return newValue;
    });
  };

  // Handle stock price update
  const handleUpdateStockPrices = async () => {
    setIsUpdatingPrices(true);

    const dataSource = settings.stockDataSource || 'yahoo';
    const sourceConfig = API_SOURCE_CONFIG[dataSource];

    setPriceUpdateStatus(
      language === 'zh-TW'
        ? `正在透過 ${dataSource === 'yahoo' ? 'Yahoo Finance' : dataSource.toUpperCase()} 取得股價...`
        : `Fetching stock prices via ${dataSource === 'yahoo' ? 'Yahoo Finance' : dataSource.toUpperCase()}...`
    );

    try {
      const stockAssets = currentAssets.assets.filter(
        (a) => a.symbol && (a.type === 'stock_tw' || a.type === 'stock_us')
      );

      if (stockAssets.length === 0) {
        setPriceUpdateStatus(language === 'zh-TW' ? '沒有需要更新的股票。' : 'No stocks with symbols to update.');
        return;
      }

      const symbols = stockAssets.map((a) => a.symbol!);

      // Progress callback for real-time updates
      const onProgress: ProgressCallback = (current, total, symbol, status) => {
        const statusText = status === 'cached'
          ? (language === 'zh-TW' ? '快取' : 'cached')
          : status === 'fetching'
          ? (language === 'zh-TW' ? '取得中' : 'fetching')
          : status === 'success'
          ? (language === 'zh-TW' ? '成功' : 'success')
          : (language === 'zh-TW' ? '失敗' : 'failed');

        setPriceUpdateStatus(
          language === 'zh-TW'
            ? `${symbol} ${statusText}... (${current}/${total})`
            : `${symbol} ${statusText}... (${current}/${total})`
        );
      };

      // Use unified stock price manager with settings (includes custom CORS proxy)
      const prices = await fetchMultipleStockPrices(symbols, settings, onProgress);

      if (Object.keys(prices).length > 0) {
        updateStockPricesWithMA(prices);
        const successCount = Object.keys(prices).length;
        const failedCount = symbols.length - successCount;

        let statusMessage = language === 'zh-TW'
          ? `已更新 ${successCount} 檔股票`
          : `Updated ${successCount} stock(s)`;

        if (failedCount > 0) {
          statusMessage += language === 'zh-TW'
            ? `（${failedCount} 檔失敗）`
            : ` (${failedCount} failed)`;
        }

        if (sourceConfig.supportsMA) {
          statusMessage += language === 'zh-TW' ? '（含移動平均）' : ' with moving averages';
        }

        setPriceUpdateStatus(statusMessage);
      } else {
        setPriceUpdateStatus(
          language === 'zh-TW'
            ? '無法取得股價。請檢查 API 設定。'
            : 'Could not fetch any stock prices. Please check API settings.'
        );
      }
    } catch (error) {
      setPriceUpdateStatus(language === 'zh-TW' ? '更新股價失敗。' : 'Failed to update stock prices.');
      console.error(error);
    } finally {
      setIsUpdatingPrices(false);
      setTimeout(() => setPriceUpdateStatus(''), 5000);
    }
  };

  // Calculate current portfolio values with different price bases
  const portfolioValues = useMemo(() => {
    const current = calculatePortfolioValue(
      currentAssets.assets,
      stockPrices,
      currentAssets.exchangeRate,
      'current',
      displayCurrency
    );
    const ma3m = calculatePortfolioValue(
      currentAssets.assets,
      stockPrices,
      currentAssets.exchangeRate,
      'ma3m',
      displayCurrency
    );
    const ma1y = calculatePortfolioValue(
      currentAssets.assets,
      stockPrices,
      currentAssets.exchangeRate,
      'ma1y',
      displayCurrency
    );

    return { current, ma3m, ma1y };
  }, [currentAssets.assets, stockPrices, currentAssets.exchangeRate, displayCurrency]);

  // Helper to parse date safely
  const parseSnapshotDate = (dateStr: string): Date => {
    return dateStr.includes('/')
      ? new Date(dateStr.replace(/\//g, '-'))
      : new Date(dateStr);
  };

  // Calculate chart data with 4 lines:
  // 1. Snapshot values (actual recorded history)
  // 2. Current price values (recalculated with current prices)
  // 3. 3M MA values (recalculated with 3M MA prices)
  // 4. 1Y MA values (recalculated with 1Y MA prices)
  const chartData = useMemo(() => {
    const hasStockPrices = Object.keys(stockPrices).length > 0;

    // Get sorted snapshots (oldest to newest)
    const sortedSnapshots = [...snapshots].sort(
      (a, b) => parseSnapshotDate(a.date).getTime() - parseSnapshotDate(b.date).getTime()
    );

    // Snapshot values - actual recorded history
    const snapshotValues = sortedSnapshots.map((snapshot) => ({
      date: snapshot.date,
      value: displayCurrency === 'TWD' ? snapshot.totalValueTWD : snapshot.totalValueUSD,
      label: parseSnapshotDate(snapshot.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
    }));

    if (!hasStockPrices) {
      // If no stock prices, all lines show snapshot values
      return {
        snapshotValues,
        currentValues: snapshotValues,
        ma3M: snapshotValues,
        ma1Y: snapshotValues
      };
    }

    // Recalculate each snapshot's value using current stock prices and MAs
    const recalculateSnapshotValue = (
      snapshot: typeof sortedSnapshots[0],
      priceType: 'current' | 'ma3m' | 'ma1y'
    ): number => {
      let total = 0;

      for (const asset of snapshot.assets) {
        let assetValue = asset.value;

        // For stocks with price data, recalculate using the specified price type
        if (asset.symbol && asset.shares && stockPrices[asset.symbol]) {
          const priceData = stockPrices[asset.symbol];
          let price: number;

          switch (priceType) {
            case 'ma3m':
              price = priceData.movingAvg3M;
              break;
            case 'ma1y':
              price = priceData.movingAvg1Y;
              break;
            default:
              price = priceData.currentPrice;
          }

          assetValue = asset.shares * price;
        }

        // Convert to display currency
        if (displayCurrency === 'TWD') {
          total += toTWD(assetValue, asset.currency, snapshot.exchangeRate);
        } else {
          total += toUSD(assetValue, asset.currency, snapshot.exchangeRate);
        }
      }

      return total;
    };

    // Calculate values for each snapshot using different price bases
    const currentValues = sortedSnapshots.map((snapshot) => ({
      date: snapshot.date,
      value: recalculateSnapshotValue(snapshot, 'current'),
      label: parseSnapshotDate(snapshot.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
    }));

    const ma3M = sortedSnapshots.map((snapshot) => ({
      date: snapshot.date,
      value: recalculateSnapshotValue(snapshot, 'ma3m'),
      label: parseSnapshotDate(snapshot.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
    }));

    const ma1Y = sortedSnapshots.map((snapshot) => ({
      date: snapshot.date,
      value: recalculateSnapshotValue(snapshot, 'ma1y'),
      label: parseSnapshotDate(snapshot.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
    }));

    // Always show current portfolio values as the latest point
    const today = new Date().toISOString().split('T')[0];
    const todayLabel = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

    const lastSnapshotDate = sortedSnapshots.length > 0
      ? sortedSnapshots[sortedSnapshots.length - 1].date.split('T')[0]
      : null;

    // If we have current assets, always update or append today's point
    if (currentAssets.assets.length > 0) {
      const todayPoint = {
        snapshotValue: { date: today, value: displayCurrency === 'TWD' ? totalTWD : totalUSD, label: todayLabel },
        currentValue: { date: today, value: portfolioValues.current, label: todayLabel },
        ma3MValue: { date: today, value: portfolioValues.ma3m, label: todayLabel },
        ma1YValue: { date: today, value: portfolioValues.ma1y, label: todayLabel },
      };

      if (lastSnapshotDate === today) {
        // Update the last point with current values (snapshot exists from today)
        const lastIndex = snapshotValues.length - 1;
        snapshotValues[lastIndex] = todayPoint.snapshotValue;
        currentValues[lastIndex] = todayPoint.currentValue;
        ma3M[lastIndex] = todayPoint.ma3MValue;
        ma1Y[lastIndex] = todayPoint.ma1YValue;
      } else {
        // Append new point (no snapshot from today)
        snapshotValues.push(todayPoint.snapshotValue);
        currentValues.push(todayPoint.currentValue);
        ma3M.push(todayPoint.ma3MValue);
        ma1Y.push(todayPoint.ma1YValue);
      }
    }

    return { snapshotValues, currentValues, ma3M, ma1Y };
  }, [snapshots, displayCurrency, stockPrices, currentAssets.assets, portfolioValues, totalTWD, totalUSD]);

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
      (a, b) => parseSnapshotDate(b.date).getTime() - parseSnapshotDate(a.date).getTime()
    );

    const latest = sortedSnapshots[0];
    const prevMonth = sortedSnapshots[1];
    const prevYear = sortedSnapshots.find((s) => {
      const date = parseSnapshotDate(s.date);
      const latestDate = parseSnapshotDate(latest.date);
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

  // Calculate weighted expected annual return (liabilities as negative)
  const weightedExpectedReturn = useMemo(() => {
    if (totalTWD === 0) return 0;

    let weightedSum = 0;
    for (const asset of currentAssets.assets) {
      const effectiveValue = getEffectiveValue(asset);
      const assetValueTWD = toTWD(effectiveValue, asset.currency, currentAssets.exchangeRate);
      const expectedReturn = asset.expectedReturn || 0;
      weightedSum += assetValueTWD * expectedReturn;
    }

    return weightedSum / totalTWD;
  }, [currentAssets.assets, currentAssets.exchangeRate, totalTWD]);

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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t.dashboard.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
              {t.dashboard.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={toggleHideAssets}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={hideAssets ? (language === 'zh-TW' ? '顯示金額' : 'Show amounts') : (language === 'zh-TW' ? '隱藏金額' : 'Hide amounts')}
            >
              {hideAssets ? '👁️' : '🙈'}
            </button>
            <button
              onClick={handleUpdateStockPrices}
              disabled={isUpdatingPrices}
              className="btn btn-secondary text-xs sm:text-sm"
              title={t.assets.updateStockPrices}
            >
              {isUpdatingPrices ? t.assets.updating : t.assets.updateStockPrices}
            </button>
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t.common.currency}:</label>
              <select
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
                className="select w-20 sm:w-24 text-sm"
              >
                <option value="TWD">TWD</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Price Update Status */}
        {priceUpdateStatus && (
          <div className="mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">{priceUpdateStatus}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <SummaryCard
            title={t.dashboard.totalAssets}
            value={hideAssets ? '＊＊＊＊＊＊' : formatCurrency(displayCurrency === 'TWD' ? totalTWD : totalUSD, displayCurrency)}
            subtitle={`${currentAssets.assets.length} ${t.nav.assets.toLowerCase()}`}
            icon="💰"
            trend={
              hideAssets ? undefined : (growthStats.monthlyGrowth !== null
                ? {
                    value: growthStats.monthlyGrowth,
                    isPositive: growthStats.monthlyGrowth >= 0,
                  }
                : undefined)
            }
            trendLabel={t.dashboard.vsLastMonth}
            color="blue"
          />
          <SummaryCard
            title={t.dashboard.expectedReturn}
            value={
              hideAssets
                ? '＊＊＊＊'
                : `${weightedExpectedReturn >= 0 ? '+' : ''}${weightedExpectedReturn.toFixed(1)}%`
            }
            subtitle={t.dashboard.weightedAnnualReturn}
            icon="🎯"
            color="green"
          />
          <SummaryCard
            title={t.dashboard.exchangeRate}
            value={`${currentAssets.exchangeRate.toFixed(2)}`}
            subtitle="USD/TWD"
            icon="💱"
            color="yellow"
          />
          <SummaryCard
            title={t.dashboard.snapshots}
            value={snapshots.length.toString()}
            subtitle={latestSnapshotDate ? `${t.dashboard.latestSnapshot}: ${new Date(latestSnapshotDate).toLocaleDateString()}` : t.dashboard.noSnapshots}
            icon="📸"
            color="orange"
          />
          <SummaryCard
            title={t.dashboard.yoyGrowth}
            value={
              hideAssets
                ? '＊＊＊＊'
                : growthStats.yearlyGrowth !== null
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
              snapshotValues={chartData.snapshotValues}
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

        {/* Asset Growth Analysis */}
        {snapshots.length >= 2 && (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {language === 'zh-TW' ? '資產成長分析' : 'Asset Growth Analysis'}
            </h2>
            <AssetGrowthAnalysis snapshots={snapshots} currency={displayCurrency} />
          </div>
        )}

        {/* Allocation History Chart */}
        {snapshots.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t.dashboard.allocationHistory}
            </h2>
            <AllocationHistoryChart snapshots={snapshots} currency={displayCurrency} />
          </div>
        )}

        {/* Allocation Comparison Chart */}
        {currentAssets.assets.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t.dashboard.allocationComparison}
            </h2>
            <AllocationComparisonChart
              assets={currentAssets.assets}
              exchangeRate={currentAssets.exchangeRate}
              currency={displayCurrency}
              targetAllocation={settings.targetAllocation}
            />

            {settings.targetAllocation && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t.allocationAdjustment.title}
                </h2>
                <AllocationAdjustmentRecommendation
                  assets={currentAssets.assets}
                  exchangeRate={currentAssets.exchangeRate}
                  currency={displayCurrency}
                  targetAllocation={settings.targetAllocation}
                />
              </>
            )}
          </div>
        )}

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
                        {hideAssets ? '＊＊＊＊＊＊' : formatCurrency(
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
