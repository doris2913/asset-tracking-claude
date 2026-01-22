'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { AssetSummary, Currency } from '@/types';
import { formatCurrency, formatNumber } from '@/utils/calculations';
import { useI18n } from '@/i18n';

ChartJS.register(ArcElement, Tooltip, Legend);

interface AssetBreakdownChartProps {
  breakdown: AssetSummary[];
  currency: Currency;
  excludeLiabilities?: boolean;
}

const ASSET_TYPE_COLORS: Record<string, string> = {
  cash_twd: '#22c55e',
  cash_usd: '#16a34a',
  stock_tw: '#3b82f6',
  stock_us: '#6366f1',
  liability: '#ef4444',
  us_tbills: '#8b5cf6',
};

export default function AssetBreakdownChart({
  breakdown,
  currency,
  excludeLiabilities = true,
}: AssetBreakdownChartProps) {
  const { t } = useI18n();

  // Filter out liabilities if excludeLiabilities is true
  const filteredBreakdown = excludeLiabilities
    ? breakdown.filter(item => item.type !== 'liability')
    : breakdown;

  // Recalculate percentages based on filtered breakdown (excluding liabilities)
  const totalFiltered = filteredBreakdown.reduce(
    (sum, item) => sum + (currency === 'TWD' ? item.totalTWD : item.totalUSD),
    0
  );

  const adjustedBreakdown = filteredBreakdown.map(item => ({
    ...item,
    percentage: totalFiltered > 0
      ? ((currency === 'TWD' ? item.totalTWD : item.totalUSD) / totalFiltered) * 100
      : 0,
  }));

  if (adjustedBreakdown.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-4xl mb-4">🥧</p>
          <p>{t.dashboard.noBreakdownData}</p>
        </div>
      </div>
    );
  }

  const data = {
    labels: adjustedBreakdown.map((item) => t.assetTypes[item.type]),
    datasets: [
      {
        data: adjustedBreakdown.map((item) =>
          currency === 'TWD' ? item.totalTWD : item.totalUSD
        ),
        backgroundColor: adjustedBreakdown.map((item) => ASSET_TYPE_COLORS[item.type]),
        borderWidth: 2,
        borderColor: 'white',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels && data.datasets.length) {
              return data.labels.map((label: string, i: number) => ({
                text: `${label} (${formatNumber(adjustedBreakdown[i].percentage, 1)}%)`,
                fillStyle: data.datasets[0].backgroundColor[i],
                hidden: false,
                index: i,
              }));
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.raw as number;
            const percentage = adjustedBreakdown[context.dataIndex].percentage;
            return `${formatCurrency(value, currency)} (${formatNumber(percentage, 1)}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
}
