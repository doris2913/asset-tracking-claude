'use client';

import { useWishListData } from '@/hooks/useWishListData';
import { useAssetData } from '@/hooks/useAssetData';
import { LIFE_ASPECT_CONFIG } from '@/types/wishlist';
import { formatCurrency } from '@/utils/calculations';
import { calculatePriorityScore, calculateMonthlySpending, calculateYearlySpending } from '@/utils/wishlistCalculations';
import Link from 'next/link';

export default function AnalyticsPage() {
  const assetData = useAssetData();
  const wishListData = useWishListData({ totalAssets: assetData.totalTWD });

  if (!wishListData.isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">載入中...</div>
      </div>
    );
  }

  const { analytics, recommendations } = wishListData;
  const monthlySpending = calculateMonthlySpending(wishListData.purchasedItems);
  const yearlySpending = calculateYearlySpending(wishListData.purchasedItems);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/assets"
            className="text-gray-600 hover:text-gray-900 transition-colors"
            title="回到資產"
          >
            ← 回到資產
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-3xl font-bold text-gray-900">分析報告</h1>
        </div>
        <p className="text-gray-600">願望清單的深入分析和購買建議</p>
      </div>

      {/* Navigation Tabs - Mobile optimized */}
      <div className="flex gap-1 sm:gap-4 mb-6 border-b overflow-x-auto">
        <Link
          href="/wishlist"
          className="px-3 sm:px-4 py-3 sm:py-2 font-medium text-gray-600 hover:text-gray-900 active:bg-gray-100 whitespace-nowrap min-h-[44px] flex items-center"
        >
          願望清單
        </Link>
        <Link
          href="/wishlist/purchased"
          className="px-3 sm:px-4 py-3 sm:py-2 font-medium text-gray-600 hover:text-gray-900 active:bg-gray-100 whitespace-nowrap min-h-[44px] flex items-center"
        >
          已購買
        </Link>
        <Link
          href="/wishlist/analytics"
          className="px-3 sm:px-4 py-3 sm:py-2 font-medium text-blue-600 border-b-2 border-blue-600 whitespace-nowrap min-h-[44px] flex items-center"
        >
          分析報告
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">總願望數</div>
          <div className="text-3xl font-bold text-gray-900">{analytics.totalWishItems}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">總價值</div>
          <div className="text-3xl font-bold text-purple-600">
            {formatCurrency(analytics.totalValue, 'TWD')}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">佔總資產</div>
          <div className="text-3xl font-bold text-orange-600">
            {analytics.percentageOfAssets.toFixed(1)}%
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">需要比例</div>
          <div className="text-3xl font-bold text-green-600">
            {analytics.totalWishItems > 0
              ? ((analytics.needVsWant.needs / analytics.totalWishItems) * 100).toFixed(0)
              : 0}
            %
          </div>
        </div>
      </div>

      {/* Need vs Want */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">需要 vs 想要</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-600 font-medium">
                需要 ({analytics.needVsWant.needs})
              </span>
              <span className="text-gray-500">
                {analytics.totalWishItems > 0
                  ? ((analytics.needVsWant.needs / analytics.totalWishItems) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
            <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${
                    analytics.totalWishItems > 0
                      ? (analytics.needVsWant.needs / analytics.totalWishItems) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-blue-600 font-medium">
                想要 ({analytics.needVsWant.wants})
              </span>
              <span className="text-gray-500">
                {analytics.totalWishItems > 0
                  ? ((analytics.needVsWant.wants / analytics.totalWishItems) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
            <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{
                  width: `${
                    analytics.totalWishItems > 0
                      ? (analytics.needVsWant.wants / analytics.totalWishItems) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">優先級分布</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-red-600 font-medium">
                高優先 ({analytics.priorityDistribution.high})
              </span>
              <span className="text-gray-500">
                {analytics.totalWishItems > 0
                  ? ((analytics.priorityDistribution.high / analytics.totalWishItems) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
            <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500"
                style={{
                  width: `${
                    analytics.totalWishItems > 0
                      ? (analytics.priorityDistribution.high / analytics.totalWishItems) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-yellow-600 font-medium">
                中優先 ({analytics.priorityDistribution.medium})
              </span>
              <span className="text-gray-500">
                {analytics.totalWishItems > 0
                  ? ((analytics.priorityDistribution.medium / analytics.totalWishItems) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
            <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500"
                style={{
                  width: `${
                    analytics.totalWishItems > 0
                      ? (analytics.priorityDistribution.medium / analytics.totalWishItems) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 font-medium">
                低優先 ({analytics.priorityDistribution.low})
              </span>
              <span className="text-gray-500">
                {analytics.totalWishItems > 0
                  ? ((analytics.priorityDistribution.low / analytics.totalWishItems) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
            <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-500"
                style={{
                  width: `${
                    analytics.totalWishItems > 0
                      ? (analytics.priorityDistribution.low / analytics.totalWishItems) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Life Aspects */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">主要生活面向</h2>
        {analytics.topLifeAspects.length > 0 ? (
          <div className="space-y-3">
            {analytics.topLifeAspects.map((data) => (
              <div key={data.aspect} className="flex items-center gap-3">
                <div className="w-32 flex items-center gap-2">
                  <span>{LIFE_ASPECT_CONFIG[data.aspect].icon}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {LIFE_ASPECT_CONFIG[data.aspect].labelZh}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full flex items-center justify-end pr-3 text-white text-sm font-medium"
                      style={{
                        width: `${(data.count / analytics.totalWishItems) * 100}%`,
                        backgroundColor: LIFE_ASPECT_CONFIG[data.aspect].color,
                        minWidth: '60px',
                      }}
                    >
                      {data.count} 項
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">暫無資料</p>
        )}
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">類別分布</h2>
        {Object.keys(analytics.categoryDistribution).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(analytics.categoryDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div key={category} className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium text-gray-700">{category}</div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 flex items-center justify-end pr-3 text-white text-sm font-medium"
                        style={{
                          width: `${(count / analytics.totalWishItems) * 100}%`,
                          minWidth: '60px',
                        }}
                      >
                        {count} 項
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500">暫無資料</p>
        )}
      </div>

      {/* Most Wanted Items */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">最常想要的物品</h2>
        {analytics.mostWantedItems.length > 0 ? (
          <div className="space-y-3">
            {analytics.mostWantedItems.map((data, index) => (
              <div key={data.item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{data.item.name}</div>
                  <div className="text-sm text-gray-600">
                    {data.frequency.toFixed(1)} 次/週 • {data.lastWantedDays} 天前想要
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-purple-600">
                    {formatCurrency(data.item.estimatedPrice, 'TWD')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">暫無想要記錄</p>
        )}
      </div>

      {/* Purchase Recommendations */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">購買建議</h2>
        <p className="text-sm text-gray-600 mb-4">
          基於預算、優先級和生活品質 ROI 的購買建議
        </p>
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((item) => {
              const priorityScore = calculatePriorityScore(item, assetData.totalTWD);
              return (
                <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(item.estimatedPrice, 'TWD')}
                      </div>
                      <div className="text-sm text-gray-500">優先分數: {priorityScore}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {item.isNeed && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                        需要
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        item.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : item.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.priority === 'high' && '高優先'}
                      {item.priority === 'medium' && '中優先'}
                      {item.priority === 'low' && '低優先'}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">建議總花費</span>
                <span className="text-xl font-bold text-purple-600">
                  {formatCurrency(
                    recommendations.reduce((sum, item) => sum + item.estimatedPrice, 0),
                    'TWD'
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-gray-500">
              {wishListData.remainingBudget <= 0
                ? '本月預算已用盡，請等待下個月'
                : '目前沒有符合條件的購買建議'}
            </p>
          </div>
        )}
      </div>

      {/* Average Satisfaction by Category */}
      {Object.keys(analytics.averageSatisfactionByCategory).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">各類別平均滿意度</h2>
          <div className="space-y-3">
            {Object.entries(analytics.averageSatisfactionByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, satisfaction]) => (
                <div key={category} className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium text-gray-700">{category}</div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 flex items-center justify-end pr-3 text-white text-sm font-medium"
                        style={{ width: `${(satisfaction / 5) * 100}%`, minWidth: '60px' }}
                      >
                        {satisfaction.toFixed(1)} / 5
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Monthly Spending Trend */}
      {monthlySpending.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">每月消費趨勢 (近12個月)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">月份</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">消費金額</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">購買數量</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">平均單價</th>
                </tr>
              </thead>
              <tbody>
                {monthlySpending.map((data, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{data.month}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(data.totalSpent, 'TWD')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {data.itemCount} 項
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {data.itemCount > 0
                        ? formatCurrency(data.totalSpent / data.itemCount, 'TWD')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900">總計</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {formatCurrency(
                      monthlySpending.reduce((sum, d) => sum + d.totalSpent, 0),
                      'TWD'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {monthlySpending.reduce((sum, d) => sum + d.itemCount, 0)} 項
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {formatCurrency(
                      monthlySpending.reduce((sum, d) => sum + d.totalSpent, 0) /
                        monthlySpending.reduce((sum, d) => sum + d.itemCount, 0) || 0,
                      'TWD'
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Yearly Spending Summary */}
      {yearlySpending.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">年度消費統計</h2>
          <div className="space-y-4">
            {yearlySpending.map((data) => (
              <div key={data.year} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{data.year} 年</h3>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(data.totalSpent, 'TWD')}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600 mb-1">購買數量</div>
                    <div className="text-lg font-semibold text-gray-900">{data.itemCount} 項</div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600 mb-1">平均單價</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(data.averageItemPrice, 'TWD')}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600 mb-1">必需品</div>
                    <div className="text-lg font-semibold text-green-600">
                      {data.needVsWant.needs} 項
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600 mb-1">想要品</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {data.needVsWant.wants} 項
                    </div>
                  </div>
                </div>
                {Object.keys(data.categoryBreakdown).length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">類別消費分布</div>
                    <div className="space-y-2">
                      {Object.entries(data.categoryBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([category, amount]) => (
                          <div key={category} className="flex items-center gap-2">
                            <div className="w-24 text-xs text-gray-600">{category}</div>
                            <div className="flex-1">
                              <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 flex items-center justify-end pr-2 text-white text-xs font-medium"
                                  style={{
                                    width: `${(amount / data.totalSpent) * 100}%`,
                                    minWidth: '60px',
                                  }}
                                >
                                  {formatCurrency(amount, 'TWD')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
