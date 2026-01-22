'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ChartDataPoint, Currency } from '@/types';
import { formatCurrency } from '@/utils/calculations';
import { useI18n } from '@/i18n';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardChartProps {
  snapshotValues: ChartDataPoint[];
  currentValues: ChartDataPoint[];
  movingAverage3M: ChartDataPoint[];
  movingAverage1Y: ChartDataPoint[];
  currency: Currency;
}

export default function DashboardChart({
  snapshotValues,
  currentValues,
  movingAverage3M,
  movingAverage1Y,
  currency,
}: DashboardChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const { t } = useI18n();

  if (snapshotValues.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-4xl mb-4">📊</p>
          <p>{t.dashboard.noChartData}</p>
        </div>
      </div>
    );
  }

  const labels = snapshotValues.map((point) => point.label || point.date);
  // Store full dates for tooltip display
  const fullDates = snapshotValues.map((point) => point.date);

  const data = {
    labels,
    datasets: [
      {
        label: t.chart.snapshotValue,
        data: snapshotValues.map((point) => point.value),
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: t.chart.currentValue,
        data: currentValues.map((point) => point.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: t.chart.movingAverage3M,
        data: movingAverage3M.map((point) => point.value),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
      {
        label: t.chart.movingAverage1Y,
        data: movingAverage1Y.map((point) => point.value),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'transparent',
        borderDash: [10, 5],
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          title: function (context: any) {
            const index = context[0].dataIndex;
            const date = fullDates[index];
            if (date) {
              const d = new Date(date);
              return d.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
            }
            return context[0].label;
          },
          label: function (context: any) {
            const value = context.raw as number;
            return `${context.dataset.label}: ${formatCurrency(value, currency)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function (value: any) {
            return formatCurrency(value, currency);
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
