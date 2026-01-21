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
import { Snapshot, Currency, AssetType } from '@/types';
import { formatCurrency } from '@/utils/calculations';
import { useI18n } from '@/i18n';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AllocationHistoryChartProps {
  snapshots: Snapshot[];
  currency: Currency;
}

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  cash_twd: '#22c55e',
  cash_usd: '#16a34a',
  stock_tw: '#3b82f6',
  stock_us: '#6366f1',
  liability: '#ef4444',
  us_tbills: '#8b5cf6',
};

const ASSET_TYPES: AssetType[] = [
  'cash_twd',
  'cash_usd',
  'stock_tw',
  'stock_us',
  'us_tbills',
  'liability',
];

export default function AllocationHistoryChart({
  snapshots,
  currency,
}: AllocationHistoryChartProps) {
  const { t } = useI18n();

  if (snapshots.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-4xl mb-4">📊</p>
          <p>{t.dashboard.noChartData}</p>
        </div>
      </div>
    );
  }

  // Sort snapshots by date
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate allocation for each snapshot
  const calculateAllocation = (snapshot: Snapshot) => {
    const allocation: Record<AssetType, number> = {
      cash_twd: 0,
      cash_usd: 0,
      stock_tw: 0,
      stock_us: 0,
      liability: 0,
      us_tbills: 0,
    };

    for (const asset of snapshot.assets) {
      let value = asset.value;

      // Convert to display currency
      if (currency === 'TWD') {
        if (asset.currency === 'USD') {
          value = value * snapshot.exchangeRate;
        }
      } else {
        if (asset.currency === 'TWD') {
          value = value / snapshot.exchangeRate;
        }
      }

      allocation[asset.type] = (allocation[asset.type] || 0) + value;
    }

    return allocation;
  };

  // Create labels from snapshot dates
  const labels = sortedSnapshots.map((snapshot) =>
    new Date(snapshot.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    })
  );

  // Create datasets for each asset type
  const datasets = ASSET_TYPES.map((type) => ({
    label: t.assetTypes[type],
    data: sortedSnapshots.map((snapshot) => {
      const allocation = calculateAllocation(snapshot);
      return allocation[type] || 0;
    }),
    backgroundColor: ASSET_TYPE_COLORS[type],
    borderWidth: 1,
    borderColor: 'white',
  })).filter((dataset) => dataset.data.some((v) => v !== 0)); // Only show types with data

  const data = {
    labels,
    datasets,
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
            return `${context.dataset.label}: ${formatCurrency(value, currency)}`;
          },
          footer: function (tooltipItems: any[]) {
            const total = tooltipItems.reduce((sum, item) => sum + (item.raw as number), 0);
            return `Total: ${formatCurrency(total, currency)}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatCurrency(value, currency);
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
