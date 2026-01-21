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
}: AssetBreakdownChartProps) {
  const { t } = useI18n();

  if (breakdown.length === 0) {
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
    labels: breakdown.map((item) => t.assetTypes[item.type]),
    datasets: [
      {
        data: breakdown.map((item) =>
          currency === 'TWD' ? item.totalTWD : item.totalUSD
        ),
        backgroundColor: breakdown.map((item) => ASSET_TYPE_COLORS[item.type]),
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
                text: `${label} (${formatNumber(breakdown[i].percentage, 1)}%)`,
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
            const percentage = breakdown[context.dataIndex].percentage;
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
