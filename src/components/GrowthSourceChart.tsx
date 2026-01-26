'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { GrowthAnalysis, Currency } from '@/types';
import { formatCurrency, formatNumber } from '@/utils/calculations';
import { useI18n } from '@/i18n';

ChartJS.register(ArcElement, Tooltip, Legend);

interface GrowthSourceChartProps {
  analysis: GrowthAnalysis;
  currency: Currency;
}

export default function GrowthSourceChart({
  analysis,
  currency,
}: GrowthSourceChartProps) {
  const { t, language } = useI18n();

  const growthData = currency === 'TWD' ? analysis.growthTWD : analysis.growthUSD;
  
  // Handle case where there's no growth or negative growth
  if (Math.abs(growthData.totalGrowth) < 1) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-4xl mb-4">📊</p>
          <p>{language === 'zh-TW' ? '無顯著成長' : 'No significant growth'}</p>
        </div>
      </div>
    );
  }

  const labels = [
    language === 'zh-TW' ? '新資金投入' : 'New Capital',
    language === 'zh-TW' ? '投資報酬' : 'Investment Returns',
  ];

  const data = {
    labels,
    datasets: [
      {
        data: [
          Math.abs(growthData.newCapital),
          Math.abs(growthData.investmentReturns),
        ],
        backgroundColor: [
          '#10b981', // Green for new capital
          '#3b82f6', // Blue for investment returns
        ],
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
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = i === 0 ? growthData.newCapital : growthData.investmentReturns;
                const percentage = i === 0 ? growthData.newCapitalPercentage : growthData.investmentReturnsPercentage;
                return {
                  text: `${label} (${formatNumber(percentage, 1)}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const index = context.dataIndex;
            const value = index === 0 ? growthData.newCapital : growthData.investmentReturns;
            const percentage = index === 0 ? growthData.newCapitalPercentage : growthData.investmentReturnsPercentage;
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
