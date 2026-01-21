'use client';

import { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import DashboardChart from '@/components/DashboardChart';
import AssetBreakdownChart from '@/components/AssetBreakdownChart';
import AllocationHistoryChart from '@/components/AllocationHistoryChart';
import AllocationComparisonChart from '@/components/AllocationComparisonChart';
import AllocationAdjustmentRecommendation from '@/components/AllocationAdjustmentRecommendation';
import SummaryCard from '@/components/SummaryCard';
import { useAssetData } from '@/hooks/useAssetData';
import { useStockPrices } from '@/lib/yahooFinance';
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
} from '@/utils/calculations';

// Calculate portfolio value with given price type
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
  const { fetchPricesWithMA } = useStockPrices();
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [priceUpdateStatus, setPriceUpdateStatus] = useState<string>('');

  // Handle stock price update
  const handleUpdateStockPrices = async () => {
    setIsUpdatingPrices(true);
    setPriceUpdateStatus(language === 'zh-TW' ? '正在取得股價與移動平均...' : 'Fetching stock prices with moving averages...');

    try {
      const stockAssets = currentAssets.assets.filter(
        (a) => a.symbol && (a.type === 'stock_tw' || a.type === 'stock_us')
      );

      if (stockAssets.length === 0) {
        setPriceUpdateStatus(language === 'zh-TW' ? '沒有需要更新的股票。' : 'No stocks with symbols to update.');
        return;
      }

      const symbols = stockAssets.map((a) => a.symbol!);
      const prices = await fetchPricesWithMA(symbols);

      if (Object.keys(prices).length > 0) {
        updateStockPricesWithMA(prices);
        setPriceUpdateStatus(
          language === 'zh-TW'
            ? `已成功更新 ${Object.keys(prices).length} 檔股票價格與移動平均！`
            : `Updated ${Object.keys(prices).length} stock price(s) with moving averages!`
        );
      } else {
        setPriceUpdateStatus(language === 'zh-TW' ? '無法取得股價。API 可能暫時無法使用。' : 'Could not fetch any stock prices. API might be unavailable.');
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

    // Add current portfolio as the latest point
    const today = new Date().toISOString().split('T')[0];
    const todayLabel = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

    // Only add today's point if it's different from the last snapshot
    const lastSnapshotDate = sortedSnapshots.length > 0
      ? sortedSnapshots[sortedSnapshots.length - 1].date.split('T')[0]
      : null;

    if (lastSnapshotDate !== today && currentAssets.assets.length > 0) {
      currentValues.push({ date: today, value: portfolioValues.current, label: todayLabel });
      ma3M.push({ date: today, value: portfolioValues.ma3m, label: todayLabel });
      ma1Y.push({ date: today, value: portfolioValues.ma1y, label: todayLabel });
      snapshotValues.push({
        date: today,
        value: displayCurrency === 'TWD' ? totalTWD : totalUSD,
        label: todayLabel
      });
    }

    return { snapshotValues, currentValues, ma3M, ma1Y };
  }, [snapshots, displayCurrency, stockPrices, currentAssets.assets, portfolioValues, totalTWD, totalUSD]);

  // Calculate asset breakdown (exclude liabilities)
  const assetBreakdown = useMemo(() => {
    return getAssetSummary(currentAssets.assets, currentAssets.exchangeRate, true);
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
    
    // Find the snapshot closest to 12 months ago for yearly growth
    const latestDate = parseSnapshotDate(latest.date);
    let prevYear = null;
    let minDiff = Infinity;
    
    for (const s of sortedSnapshots) {
      const date = parseSnapshotDate(s.date);
      const monthsDiff =
        (latestDate.getFullYear() - date.getFullYear()) * 12 +
        (latestDate.getMonth() - date.getMonth());
      
      // Look for snapshots between 11-13 months ago and find the one closest to 12 months
      if (monthsDiff >= 11 && monthsDiff <= 13) {
        const diff = Math.abs(monthsDiff - 12);
        if (diff < minDiff) {
          minDiff = diff;
          prevYear = s;
        }
      }
    }

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
          <div className="flex items-center space-x-3">
            <button
              onClick={handleUpdateStockPrices}
              disabled={isUpdatingPrices}
              className="btn btn-secondary text-sm"
              title={t.assets.updateStockPrices}
            >
              {isUpdatingPrices ? t.assets.updating : t.assets.updateStockPrices}
            </button>
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

        {/* Price Update Status */}
        {priceUpdateStatus && (
          <div className="mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">{priceUpdateStatus}</p>
          </div>
        )}

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
