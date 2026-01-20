'use client';

import { useEffect, useRef } from 'react';
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
  currentValues: ChartDataPoint[];
  movingAverage3M: ChartDataPoint[];
  movingAverage1Y: ChartDataPoint[];
  currency: Currency;
}

export default function DashboardChart({
  currentValues,
  movingAverage3M,
  movingAverage1Y,
  currency,
}: DashboardChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  if (currentValues.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-4xl mb-4">📊</p>
          <p>No snapshot data yet. Create snapshots to see your asset growth chart.</p>
        </div>
      </div>
    );
  }

  const labels = currentValues.map((point) => point.label || point.date);

  const data = {
    labels,
    datasets: [
      {
        label: 'Current Value',
        data: currentValues.map((point) => point.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: '3-Month Moving Average',
        data: movingAverage3M.map((point) => point.value),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
      {
        label: '1-Year Moving Average',
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
