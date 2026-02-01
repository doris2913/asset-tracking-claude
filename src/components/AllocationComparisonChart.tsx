'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Asset, AssetType, Currency } from '@/types';
import { useI18n } from '@/i18n';
import { useChartTheme } from '@/contexts/ChartThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AllocationComparisonChartProps {
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

export default function AllocationComparisonChart({
  assets,
  exchangeRate,
  currency,
  targetAllocation,
}: AllocationComparisonChartProps) {
  const { t } = useI18n();
  const { theme } = useChartTheme();
  const assetColors = theme.assetColors;

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

    let total = 0;

    for (const asset of assets) {
      let value = asset.value;
      // Convert to unified currency for percentage calculation
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
      total += value;
    }

    // Convert to percentages
    if (total > 0) {
      for (const type of ASSET_TYPES) {
        allocation[type] = (allocation[type] / total) * 100;
      }
    }

    return allocation;
  };

  const currentAllocation = calculateCurrentAllocation();

  // Filter out types that have neither current nor target values
  const relevantTypes = ASSET_TYPES.filter(
    (type) => currentAllocation[type] > 0 || (targetAllocation && targetAllocation[type] > 0)
  );

  if (relevantTypes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-4xl mb-4">📊</p>
          <p>{t.dashboard.noBreakdownData}</p>
        </div>
      </div>
    );
  }

  const data = {
    labels: relevantTypes.map((type) => t.assetTypes[type]),
    datasets: [
      {
        label: t.allocationComparison.current,
        data: relevantTypes.map((type) => currentAllocation[type]),
        backgroundColor: relevantTypes.map((type) => assetColors[type]),
        borderWidth: 1,
        borderColor: '#fff',
      },
      ...(targetAllocation
        ? [
            {
              label: t.allocationComparison.target,
              data: relevantTypes.map((type) => targetAllocation[type] || 0),
              backgroundColor: relevantTypes.map((type) => assetColors[type] + '80'), // 50% opacity
              borderWidth: 2,
              borderColor: relevantTypes.map((type) => assetColors[type]),
              borderDash: [5, 5],
            },
          ]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.raw as number;
            return `${context.dataset.label}: ${value.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: any) {
            return value + '%';
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  );
}
