'use client';

import { useState } from 'react';
import { useWishListData } from '@/hooks/useWishListData';
import { useAssetData } from '@/hooks/useAssetData';
import { PurchasedItem } from '@/types/wishlist';
import { LIFE_ASPECT_CONFIG } from '@/types/wishlist';
import { formatCurrency } from '@/utils/calculations';
import { calculateAverageSatisfaction } from '@/utils/wishlistCalculations';
import PurchasedItemForm from '@/components/wishlist/PurchasedItemForm';
import Link from 'next/link';

export default function PurchasedItemsPage() {
  const assetData = useAssetData();
  const wishListData = useWishListData({ totalAssets: assetData.totalTWD });

  const [ratingModal, setRatingModal] = useState<string | null>(null);
  const [newRating, setNewRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [ratingNotes, setRatingNotes] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'daily_necessity' | 'one_time_purchase'>('all');
  const [sortBy, setSortBy] = useState<'purchaseDate' | 'satisfaction' | 'price'>('purchaseDate');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddRating = () => {
    if (ratingModal) {
      wishListData.addSatisfactionRating(ratingModal, newRating, ratingNotes);
      setRatingModal(null);
      setNewRating(5);
      setRatingNotes('');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這個已購買項目嗎？')) {
      wishListData.deletePurchasedItem(id);
    }
  };

  const handleToggleRepurchase = (id: string, current: boolean | null) => {
    wishListData.updatePurchasedItem(id, {
      wouldRepurchase: current === true ? false : true,
    });
  };

  const handleManualAdd = (data: any) => {
    wishListData.addPurchasedItem({
      ...data,
      satisfactionRatings: [],
    });
    setShowAddForm(false);
  };

  // Filter and sort
  let filteredItems = wishListData.purchasedItems;

  if (filterType !== 'all') {
    filteredItems = filteredItems.filter(item => item.type === filterType);
  }

  filteredItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'satisfaction':
        return calculateAverageSatisfaction(b) - calculateAverageSatisfaction(a);
      case 'price':
        return b.actualPrice - a.actualPrice;
      default: // purchaseDate
        return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
    }
  });

  if (!wishListData.isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">載入中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">已購買物品</h1>
        <p className="text-gray-600">追蹤購買後的滿意度和使用心得</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <Link
          href="/wishlist"
          className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900"
        >
          願望清單
        </Link>
        <Link
          href="/wishlist/purchased"
          className="px-4 py-2 font-medium text-green-600 border-b-2 border-green-600"
        >
          已購買
        </Link>
        <Link
          href="/wishlist/analytics"
          className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900"
        >
          分析報告
        </Link>
      </div>

      {/* Summary and Add Button */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">總購買數</div>
            <div className="text-2xl font-bold text-gray-900">
              {wishListData.purchasedItems.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">本月消費</div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(wishListData.monthlySpend, 'TWD')}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">平均滿意度</div>
            <div className="text-2xl font-bold text-green-600">
              {wishListData.purchasedItems.length > 0
                ? (
                    wishListData.purchasedItems.reduce(
                      (sum, item) => sum + calculateAverageSatisfaction(item),
                      0
                    ) / wishListData.purchasedItems.length
                  ).toFixed(1)
                : '0.0'}{' '}
              / 5
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full md:w-auto px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md"
        >
          ➕ 手動新增購買記錄
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">全部</option>
              <option value="daily_necessity">日常用品</option>
              <option value="one_time_purchase">一次性購買</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="purchaseDate">購買時間</option>
              <option value="satisfaction">滿意度</option>
              <option value="price">價格</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">🛍️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">還沒有購買記錄</h3>
          <p className="text-gray-600">購買物品後會在這裡顯示</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const avgSatisfaction = calculateAverageSatisfaction(item);
            return (
              <div key={item.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          item.type === 'daily_necessity'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {item.type === 'daily_necessity' ? '日常用品' : '一次性購買'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(item.actualPrice, 'TWD')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(item.purchaseDate).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                </div>

                {/* Life Aspects */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {item.lifeAspects.map((aspect) => (
                    <span
                      key={aspect}
                      className="px-2 py-1 text-xs rounded"
                      style={{
                        backgroundColor: `${LIFE_ASPECT_CONFIG[aspect].color}20`,
                        color: LIFE_ASPECT_CONFIG[aspect].color,
                      }}
                    >
                      {LIFE_ASPECT_CONFIG[aspect].icon} {LIFE_ASPECT_CONFIG[aspect].labelZh}
                    </span>
                  ))}
                </div>

                {/* Satisfaction */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">滿意度:</span>
                    <div className="flex items-center">
                      {avgSatisfaction > 0 ? (
                        <>
                          <span className="text-yellow-400 text-lg">
                            {'★'.repeat(Math.round(avgSatisfaction))}
                            {'☆'.repeat(5 - Math.round(avgSatisfaction))}
                          </span>
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {avgSatisfaction.toFixed(1)} / 5.0
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({item.satisfactionRatings.length} 次評分)
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">尚未評分</span>
                      )}
                    </div>
                  </div>

                  {/* Latest Rating */}
                  {item.satisfactionRatings.length > 0 && (
                    <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                      最近評分:{' '}
                      {item.satisfactionRatings[item.satisfactionRatings.length - 1].notes ||
                        '無備註'}
                    </div>
                  )}
                </div>

                {/* Store */}
                {item.store && (
                  <div className="text-sm text-gray-600 mb-4">
                    購買商店: {item.store}
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <p className="text-sm text-gray-600 mb-4 italic">{item.notes}</p>
                )}

                {/* Repurchase Status */}
                {item.type === 'daily_necessity' && (
                  <div className="mb-4">
                    <button
                      onClick={() => handleToggleRepurchase(item.id, item.wouldRepurchase)}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                        item.wouldRepurchase
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {item.wouldRepurchase ? '✓ 會再購買' : '不會再購買'}
                    </button>
                    {item.repurchaseNotes && (
                      <p className="text-sm text-gray-600 mt-2">{item.repurchaseNotes}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <button
                    onClick={() => setRatingModal(item.id)}
                    className="px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-50 rounded hover:bg-yellow-100 transition-colors"
                  >
                    ⭐ 評分
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
                  >
                    刪除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">新增滿意度評分</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">評分</label>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setNewRating(rating)}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      newRating === rating
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {rating}★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">備註（選填）</label>
              <textarea
                value={ratingNotes}
                onChange={(e) => setRatingNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows={3}
                placeholder="使用心得、優缺點等"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddRating}
                className="flex-1 px-4 py-2 bg-yellow-400 text-white font-medium rounded-lg hover:bg-yellow-500 transition-colors"
              >
                提交評分
              </button>
              <button
                onClick={() => {
                  setRatingModal(null);
                  setNewRating(5);
                  setRatingNotes('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Purchased Item Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">新增購買記錄</h2>
            <PurchasedItemForm
              onSubmit={handleManualAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
