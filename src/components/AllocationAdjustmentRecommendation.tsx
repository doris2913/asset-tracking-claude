'use client';

import { Asset, AssetType, Currency } from '@/types';
import { useI18n } from '@/i18n';

interface AllocationAdjustmentRecommendationProps {
  assets: Asset[];
  exchangeRate: number;
  currency: Currency;
  targetAllocation?: Record<AssetType, number>;
}

const ASSET_TYPES: AssetType[] = [
  'cash_twd',
  'cash_usd',
  'stock_tw',
  'stock_us',
  'us_tbills',
  'liability',
];

export default function AllocationAdjustmentRecommendation({
  assets,
  exchangeRate,
  currency,
  targetAllocation,
}: AllocationAdjustmentRecommendationProps) {
  const { t } = useI18n();

  if (!targetAllocation) {
    return null;
  }

  // Calculate total portfolio value in selected currency
  const calculateTotalValue = (): number => {
    let total = 0;
    for (const asset of assets) {
      let value = asset.value;
      if (currency === 'TWD') {
        if (asset.currency === 'USD') {
          value = value * exchangeRate;
        }
      } else {
        if (asset.currency === 'TWD') {
          value = value / exchangeRate;
        }
      }
      total += value;
    }
    return total;
  };

  // Calculate current allocation
  const calculateCurrentAllocation = (): Record<AssetType, number> => {
    const allocation: Record<AssetType, number> = {
      cash_twd: 0,
      cash_usd: 0,
      stock_tw: 0,
      stock_us: 0,
      liability: 0,
      us_tbills: 0,
    };

    for (const asset of assets) {
      let value = asset.value;
      if (currency === 'TWD') {
        if (asset.currency === 'USD') {
          value = value * exchangeRate;
        }
      } else {
        if (asset.currency === 'TWD') {
          value = value / exchangeRate;
        }
      }
      allocation[asset.type] += value;
    }

    return allocation;
  };

  const totalValue = calculateTotalValue();
  const currentAllocation = calculateCurrentAllocation();

  // Calculate differences
  const differences: Array<{
    type: AssetType;
    currentPercent: number;
    targetPercent: number;
    diffPercent: number;
    diffAmount: number;
  }> = [];

  for (const type of ASSET_TYPES) {
    const currentPercent = totalValue > 0 ? (currentAllocation[type] / totalValue) * 100 : 0;
    const targetPercent = targetAllocation[type] || 0;
    const diffPercent = currentPercent - targetPercent;
    const diffAmount = (diffPercent / 100) * totalValue;

    // Only include types that have a target or current value
    if (targetPercent > 0 || currentPercent > 0) {
      differences.push({
        type,
        currentPercent,
        targetPercent,
        diffPercent,
        diffAmount,
      });
    }
  }

  // Sort by absolute difference (largest discrepancies first)
  differences.sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent));

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (currency === 'TWD') {
      return `$${absValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else {
      return `$${absValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const hasSignificantDifference = differences.some((d) => Math.abs(d.diffPercent) > 0.5);

  if (!hasSignificantDifference) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-4xl mb-2">✅</p>
          <p className="font-medium">{t.allocationAdjustment.balanced}</p>
          <p className="text-sm mt-1">{t.allocationAdjustment.balancedDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {t.allocationAdjustment.description}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-2 font-semibold text-gray-900 dark:text-white">
                {t.dashboard.type}
              </th>
              <th className="text-right py-2 px-2 font-semibold text-gray-900 dark:text-white">
                {t.allocationAdjustment.current}
              </th>
              <th className="text-right py-2 px-2 font-semibold text-gray-900 dark:text-white">
                {t.allocationAdjustment.target}
              </th>
              <th className="text-right py-2 px-2 font-semibold text-gray-900 dark:text-white">
                {t.allocationAdjustment.difference}
              </th>
              <th className="text-left py-2 px-2 font-semibold text-gray-900 dark:text-white">
                {t.allocationAdjustment.action}
              </th>
            </tr>
          </thead>
          <tbody>
            {differences.map((diff) => {
              const isOverweight = diff.diffPercent > 0.5;
              const isUnderweight = diff.diffPercent < -0.5;
              const isBalanced = !isOverweight && !isUnderweight;

              return (
                <tr
                  key={diff.type}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 px-2 text-gray-900 dark:text-white">
                    {t.assetTypes[diff.type]}
                  </td>
                  <td className="text-right py-3 px-2 text-gray-700 dark:text-gray-300">
                    {diff.currentPercent.toFixed(1)}%
                  </td>
                  <td className="text-right py-3 px-2 text-gray-700 dark:text-gray-300">
                    {diff.targetPercent.toFixed(1)}%
                  </td>
                  <td
                    className={`text-right py-3 px-2 font-medium ${
                      isOverweight
                        ? 'text-orange-600 dark:text-orange-400'
                        : isUnderweight
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    {diff.diffPercent > 0 ? '+' : ''}
                    {diff.diffPercent.toFixed(1)}%
                  </td>
                  <td className="py-3 px-2">
                    {isOverweight && (
                      <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        <span>↓</span>
                        <span>
                          {t.allocationAdjustment.sell} {formatCurrency(diff.diffAmount)}
                        </span>
                      </div>
                    )}
                    {isUnderweight && (
                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <span>↑</span>
                        <span>
                          {t.allocationAdjustment.buy} {formatCurrency(diff.diffAmount)}
                        </span>
                      </div>
                    )}
                    {isBalanced && (
                      <span className="text-gray-400 dark:text-gray-600">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
        {t.allocationAdjustment.note}
      </div>
    </div>
  );
}
