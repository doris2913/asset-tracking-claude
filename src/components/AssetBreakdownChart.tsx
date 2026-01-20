'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { AssetSummary, ASSET_TYPE_CONFIG, Currency } from '@/types';
import { formatCurrency, formatNumber } from '@/utils/calculations';

ChartJS.register(ArcElement, Tooltip, Legend);

interface AssetBreakdownChartProps {
  breakdown: AssetSummary[];
  currency: Currency;
}

export default function AssetBreakdownChart({
  breakdown,
  currency,
}: AssetBreakdownChartProps) {
  if (breakdown.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-4xl mb-4">🥧</p>
          <p>No assets to display breakdown.</p>
        </div>
      </div>
    );
  }

  const data = {
    labels: breakdown.map((item) => ASSET_TYPE_CONFIG[item.type].label),
    datasets: [
      {
        data: breakdown.map((item) =>
          currency === 'TWD' ? item.totalTWD : item.totalUSD
        ),
        backgroundColor: breakdown.map((item) => ASSET_TYPE_CONFIG[item.type].color),
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
