'use client';

import { GrowthAnalysis, Currency } from '@/types';
import { formatCurrency, formatDate } from '@/utils/calculations';
import { useI18n } from '@/i18n';
import GrowthSourceChart from './GrowthSourceChart';

interface GrowthAnalysisCardProps {
  analysis: GrowthAnalysis | null;
  currency: Currency;
}

export default function GrowthAnalysisCard({
  analysis,
  currency,
}: GrowthAnalysisCardProps) {
  const { language } = useI18n();

  if (!analysis) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {language === 'zh-TW' ? '資產成長來源分析' : 'Asset Growth Source Analysis'}
        </h2>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-4xl mb-4">📈</p>
            <p>{language === 'zh-TW' ? '需要至少兩個快照才能分析成長來源' : 'Need at least 2 snapshots to analyze growth'}</p>
          </div>
        </div>
      </div>
    );
  }

  const growthData = currency === 'TWD' ? analysis.growthTWD : analysis.growthUSD;
  const isPositiveGrowth = growthData.totalGrowth >= 0;

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {language === 'zh-TW' ? '資產成長來源分析' : 'Asset Growth Source Analysis'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(analysis.period.start)} → {formatDate(analysis.period.end)}
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {language === 'zh-TW' ? '總成長' : 'Total Growth'}
          </p>
          <p className={`text-2xl font-bold ${isPositiveGrowth ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositiveGrowth ? '+' : ''}{formatCurrency(growthData.totalGrowth, currency)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {formatCurrency(analysis.startValue, 'TWD')} → {formatCurrency(analysis.endValue, 'TWD')}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {language === 'zh-TW' ? '新資金投入' : 'New Capital'}
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {growthData.newCapital >= 0 ? '+' : ''}{formatCurrency(growthData.newCapital, currency)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {growthData.newCapitalPercentage.toFixed(1)}% {language === 'zh-TW' ? '貢獻' : 'of growth'}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {language === 'zh-TW' ? '投資報酬' : 'Investment Returns'}
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {growthData.investmentReturns >= 0 ? '+' : ''}{formatCurrency(growthData.investmentReturns, currency)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {growthData.investmentReturnsPercentage.toFixed(1)}% {language === 'zh-TW' ? '貢獻' : 'of growth'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <GrowthSourceChart analysis={analysis} currency={currency} />
      </div>

      {/* Stock Contributions */}
      {analysis.stockContributions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
            {language === 'zh-TW' ? '股票貢獻明細' : 'Stock Contributions'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 px-3 text-left text-gray-600 dark:text-gray-400">
                    {language === 'zh-TW' ? '股票' : 'Stock'}
                  </th>
                  <th className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                    {language === 'zh-TW' ? '價格變動' : 'Price Change'}
                  </th>
                  <th className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                    {language === 'zh-TW' ? '持股變動' : 'Shares Change'}
                  </th>
                  <th className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                    {language === 'zh-TW' ? '總貢獻' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {analysis.stockContributions.map((contribution, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {contribution.symbol}
                      </div>
                      <div className="text-xs text-gray-500">{contribution.name}</div>
                    </td>
                    <td className={`py-2 px-3 text-right ${contribution.priceReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {contribution.priceReturn >= 0 ? '+' : ''}{formatCurrency(contribution.priceReturn, 'TWD')}
                    </td>
                    <td className={`py-2 px-3 text-right ${contribution.quantityChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {contribution.quantityChange >= 0 ? '+' : ''}{formatCurrency(contribution.quantityChange, 'TWD')}
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${contribution.totalContribution >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {contribution.totalContribution >= 0 ? '+' : ''}{formatCurrency(contribution.totalContribution, 'TWD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {language === 'zh-TW' ? (
            <>
              <strong>💡 說明：</strong>此分析將資產成長拆解為兩個來源：
              <br />• <strong>新資金投入</strong>：薪資收入、存款等新增的資金
              <br />• <strong>投資報酬</strong>：現有股票的價格上漲帶來的增值
            </>
          ) : (
            <>
              <strong>💡 Explanation:</strong> This analysis breaks down asset growth into two sources:
              <br />• <strong>New Capital</strong>: Salary deposits, new savings, etc.
              <br />• <strong>Investment Returns</strong>: Appreciation of existing stock holdings
            </>
          )}
        </p>
      </div>
    </div>
  );
}
