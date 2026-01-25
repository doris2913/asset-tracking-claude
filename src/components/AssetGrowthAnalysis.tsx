'use client';

import { useState, useMemo } from 'react';
import { Snapshot, Currency, Asset } from '@/types';
import { formatCurrency, toTWD, toUSD } from '@/utils/calculations';
import { useI18n } from '@/i18n';

interface AssetGrowthAnalysisProps {
  snapshots: Snapshot[];
  currency: Currency;
}

interface GrowthBreakdown {
  period: string;
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  totalGrowth: number;
  newCapital: number;
  investmentReturns: number;
  newCapitalPercentage: number;
  investmentReturnsPercentage: number;
}

function analyzeGrowthBetweenSnapshots(
  startSnapshot: Snapshot,
  endSnapshot: Snapshot,
  currency: Currency
): GrowthBreakdown {
  const startValue = currency === 'TWD' ? startSnapshot.totalValueTWD : startSnapshot.totalValueUSD;
  const endValue = currency === 'TWD' ? endSnapshot.totalValueTWD : endSnapshot.totalValueUSD;
  const totalGrowth = endValue - startValue;

  // Build maps of assets by symbol/name for comparison
  const startAssetMap = new Map<string, Asset>();
  const endAssetMap = new Map<string, Asset>();

  startSnapshot.assets.forEach(asset => {
    const key = asset.symbol || asset.name;
    startAssetMap.set(key, asset);
  });

  endSnapshot.assets.forEach(asset => {
    const key = asset.symbol || asset.name;
    endAssetMap.set(key, asset);
  });

  let newCapital = 0;
  let investmentReturns = 0;

  // Helper function to get value in target currency
  const getValue = (asset: Asset, exchangeRate: number) => {
    return currency === 'TWD'
      ? toTWD(asset.value, asset.currency, exchangeRate)
      : toUSD(asset.value, asset.currency, exchangeRate);
  };

  // Analyze each asset in end snapshot
  endAssetMap.forEach((endAsset, key) => {
    const startAsset = startAssetMap.get(key);
    const endAssetValue = getValue(endAsset, endSnapshot.exchangeRate);

    if (!startAsset) {
      // New asset - all value is new capital
      newCapital += endAssetValue;
    } else {
      const startAssetValue = getValue(startAsset, startSnapshot.exchangeRate);

      // Check if it's a stock with shares
      if (endAsset.type === 'stock_tw' || endAsset.type === 'stock_us') {
        const startShares = startAsset.shares || 0;
        const endShares = endAsset.shares || 0;
        const sharesDiff = endShares - startShares;

        if (sharesDiff !== 0 && endShares > 0) {
          // Calculate average price per share at end
          const pricePerShare = endAsset.value / endShares;

          // New capital from buying/selling shares
          const capitalFromShares = sharesDiff * (currency === 'TWD'
            ? toTWD(pricePerShare, endAsset.currency, endSnapshot.exchangeRate)
            : toUSD(pricePerShare, endAsset.currency, endSnapshot.exchangeRate));

          if (sharesDiff > 0) {
            newCapital += capitalFromShares;
          } else {
            // Selling shares - reduce new capital (or could be considered withdrawal)
            newCapital += capitalFromShares;
          }

          // The rest is investment return (price appreciation)
          const valueDiff = endAssetValue - startAssetValue;
          investmentReturns += valueDiff - capitalFromShares;
        } else {
          // Same number of shares - all difference is investment returns
          investmentReturns += endAssetValue - startAssetValue;
        }
      } else if (endAsset.type === 'cash_twd' || endAsset.type === 'cash_usd' || endAsset.type === 'us_tbills') {
        // Cash and T-Bills - increase is new capital, decrease could be investment elsewhere
        const diff = endAssetValue - startAssetValue;
        if (diff > 0) {
          newCapital += diff;
        } else {
          // Decrease in cash could be used to buy other assets - track as negative capital
          newCapital += diff;
        }
      } else if (endAsset.type === 'liability') {
        // Liabilities - increase is more borrowing (negative capital), decrease is paying off (positive capital used)
        const diff = endAssetValue - startAssetValue;
        // Liability changes affect overall value but aren't "new capital" or "returns"
        // They are changes in debt - treat increase as negative capital, decrease as positive capital flow
        newCapital -= diff;
      }
    }
  });

  // Check for assets that were removed (sold completely)
  startAssetMap.forEach((startAsset, key) => {
    if (!endAssetMap.has(key)) {
      const startAssetValue = getValue(startAsset, startSnapshot.exchangeRate);
      // Asset was sold/removed - reduce capital
      newCapital -= startAssetValue;
    }
  });

  // Adjust if calculations don't add up perfectly
  const calculatedTotal = newCapital + investmentReturns;
  if (Math.abs(calculatedTotal - totalGrowth) > 1) {
    // Adjust investment returns to make it balance
    investmentReturns = totalGrowth - newCapital;
  }

  // Calculate percentages
  const absTotal = Math.abs(newCapital) + Math.abs(investmentReturns);
  const newCapitalPercentage = absTotal > 0 ? (Math.abs(newCapital) / absTotal) * 100 : 0;
  const investmentReturnsPercentage = absTotal > 0 ? (Math.abs(investmentReturns) / absTotal) * 100 : 0;

  // Format period string
  const startDate = new Date(startSnapshot.date);
  const endDate = new Date(endSnapshot.date);
  const period = `${startDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short' })}`;

  return {
    period,
    startDate: startSnapshot.date,
    endDate: endSnapshot.date,
    startValue,
    endValue,
    totalGrowth,
    newCapital,
    investmentReturns,
    newCapitalPercentage,
    investmentReturnsPercentage,
  };
}

export default function AssetGrowthAnalysis({
  snapshots,
  currency,
}: AssetGrowthAnalysisProps) {
  const { language } = useI18n();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('total');

  const labels = {
    title: language === 'zh-TW' ? '資產成長分析' : 'Asset Growth Analysis',
    subtitle: language === 'zh-TW' ? '區分新資金投入與投資報酬' : 'Distinguish between new capital and investment returns',
    period: language === 'zh-TW' ? '期間' : 'Period',
    totalPeriod: language === 'zh-TW' ? '全部期間' : 'Total Period',
    startValue: language === 'zh-TW' ? '期初資產' : 'Starting Value',
    endValue: language === 'zh-TW' ? '期末資產' : 'Ending Value',
    totalGrowth: language === 'zh-TW' ? '總成長' : 'Total Growth',
    newCapital: language === 'zh-TW' ? '新資金投入' : 'New Capital',
    investmentReturns: language === 'zh-TW' ? '投資報酬' : 'Investment Returns',
    newCapitalDesc: language === 'zh-TW' ? '包含薪資存入、儲蓄、新增投資等' : 'Includes salary deposits, savings, new investments',
    investmentReturnsDesc: language === 'zh-TW' ? '來自股價上漲等投資收益' : 'From stock price appreciation and investment gains',
    noData: language === 'zh-TW' ? '需要至少2個快照才能進行分析' : 'Need at least 2 snapshots for analysis',
    contribution: language === 'zh-TW' ? '貢獻比例' : 'Contribution',
  };

  // Sort snapshots by date (oldest first)
  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [snapshots]);

  // Generate period options
  const periodOptions = useMemo(() => {
    if (sortedSnapshots.length < 2) return [];

    const options: { value: string; label: string; analysis: GrowthBreakdown }[] = [];

    // Total period option
    const totalAnalysis = analyzeGrowthBetweenSnapshots(
      sortedSnapshots[0],
      sortedSnapshots[sortedSnapshots.length - 1],
      currency
    );
    options.push({
      value: 'total',
      label: labels.totalPeriod,
      analysis: totalAnalysis,
    });

    // Individual period options (between consecutive snapshots)
    for (let i = 1; i < sortedSnapshots.length; i++) {
      const analysis = analyzeGrowthBetweenSnapshots(
        sortedSnapshots[i - 1],
        sortedSnapshots[i],
        currency
      );
      options.push({
        value: `period_${i}`,
        label: analysis.period,
        analysis,
      });
    }

    return options;
  }, [sortedSnapshots, currency, labels.totalPeriod]);

  // Get current analysis
  const currentAnalysis = useMemo(() => {
    const option = periodOptions.find(opt => opt.value === selectedPeriod);
    return option?.analysis || null;
  }, [periodOptions, selectedPeriod]);

  if (sortedSnapshots.length < 2) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-4xl mb-4">📊</p>
        <p>{labels.noData}</p>
      </div>
    );
  }

  if (!currentAnalysis) return null;

  const growthIsPositive = currentAnalysis.totalGrowth >= 0;
  const capitalIsPositive = currentAnalysis.newCapital >= 0;
  const returnsIsPositive = currentAnalysis.investmentReturns >= 0;

  return (
    <div>
      {/* Period Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {labels.period}
        </label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="select w-full max-w-xs"
        >
          {periodOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels.startValue}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(currentAnalysis.startValue, currency)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels.endValue}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(currentAnalysis.endValue, currency)}
          </p>
        </div>
        <div className={`rounded-lg p-4 ${growthIsPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels.totalGrowth}</p>
          <p className={`text-xl font-bold ${growthIsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {growthIsPositive ? '+' : ''}{formatCurrency(currentAnalysis.totalGrowth, currency)}
          </p>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* New Capital Card */}
        <div className={`rounded-lg p-4 border-2 ${capitalIsPositive ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20' : 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-2xl mr-2">💰</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">{labels.newCapital}</h3>
            </div>
            <span className={`text-2xl font-bold ${capitalIsPositive ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {capitalIsPositive ? '+' : ''}{formatCurrency(currentAnalysis.newCapital, currency)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels.newCapitalDesc}</p>
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">{labels.contribution}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {currentAnalysis.newCapitalPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${capitalIsPositive ? 'bg-blue-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(currentAnalysis.newCapitalPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Investment Returns Card */}
        <div className={`rounded-lg p-4 border-2 ${returnsIsPositive ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-2xl mr-2">📈</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">{labels.investmentReturns}</h3>
            </div>
            <span className={`text-2xl font-bold ${returnsIsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {returnsIsPositive ? '+' : ''}{formatCurrency(currentAnalysis.investmentReturns, currency)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels.investmentReturnsDesc}</p>
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">{labels.contribution}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {currentAnalysis.investmentReturnsPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${returnsIsPositive ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(currentAnalysis.investmentReturnsPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Breakdown Bar */}
      {Math.abs(currentAnalysis.totalGrowth) > 0.01 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {language === 'zh-TW' ? '成長組成' : 'Growth Composition'}
          </p>
          <div className="flex h-8 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            {currentAnalysis.newCapitalPercentage > 0 && (
              <div
                className={`flex items-center justify-center text-white text-sm font-medium ${capitalIsPositive ? 'bg-blue-500' : 'bg-orange-500'}`}
                style={{ width: `${currentAnalysis.newCapitalPercentage}%` }}
                title={`${labels.newCapital}: ${capitalIsPositive ? '+' : ''}${formatCurrency(currentAnalysis.newCapital, currency)}`}
              >
                {currentAnalysis.newCapitalPercentage > 15 && `${currentAnalysis.newCapitalPercentage.toFixed(0)}%`}
              </div>
            )}
            {currentAnalysis.investmentReturnsPercentage > 0 && (
              <div
                className={`flex items-center justify-center text-white text-sm font-medium ${returnsIsPositive ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${currentAnalysis.investmentReturnsPercentage}%` }}
                title={`${labels.investmentReturns}: ${returnsIsPositive ? '+' : ''}${formatCurrency(currentAnalysis.investmentReturns, currency)}`}
              >
                {currentAnalysis.investmentReturnsPercentage > 15 && `${currentAnalysis.investmentReturnsPercentage.toFixed(0)}%`}
              </div>
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className={capitalIsPositive ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}>
              {labels.newCapital} {capitalIsPositive ? '↑' : '↓'}
            </span>
            <span className={returnsIsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {labels.investmentReturns} {returnsIsPositive ? '↑' : '↓'}
            </span>
          </div>
          {(!capitalIsPositive || !returnsIsPositive) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {language === 'zh-TW'
                ? '* 長條圖以絕對值顯示各項目佔比，箭頭表示增減方向'
                : '* Bar shows relative contribution by absolute value, arrows indicate direction'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
