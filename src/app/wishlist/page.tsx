'use client';

import { useState } from 'react';
import { useWishListData } from '@/hooks/useWishListData';
import { useAssetData } from '@/hooks/useAssetData';
import WishItemCard from '@/components/wishlist/WishItemCard';
import WishItemForm from '@/components/wishlist/WishItemForm';
import ProductComparisonModal from '@/components/wishlist/ProductComparisonModal';
import { WishItem } from '@/types/wishlist';
import { formatCurrency } from '@/utils/calculations';
import Link from 'next/link';

export default function WishListPage() {
  const assetData = useAssetData();
  const wishListData = useWishListData({ totalAssets: assetData.totalTWD });

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WishItem | undefined>(undefined);
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterType, setFilterType] = useState<'all' | 'need' | 'want'>('all');
  const [sortBy, setSortBy] = useState<'dateAdded' | 'price' | 'priority' | 'frequency'>('dateAdded');
  const [showWantModal, setShowWantModal] = useState<string | null>(null);
  const [wantIntensity, setWantIntensity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [comparisonItem, setComparisonItem] = useState<WishItem | null>(null);

  const handleExport = () => {
    const jsonData = wishListData.exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wishlist-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const success = wishListData.importData(content);
        if (success) {
          alert('願望清單資料匯入成功！');
        } else {
          alert('匯入失敗，請檢查檔案格式是否正確。');
        }
      };
      reader.onerror = () => {
        alert('讀取檔案失敗。');
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    if (confirm('確定要清除所有願望清單資料嗎？此操作無法復原。建議先匯出備份。')) {
      wishListData.clearAllData();
      alert('願望清單資料已清除。');
    }
  };

  const handleAddWishItem = (item: Omit<WishItem, 'id' | 'dateAdded' | 'wantHistory'>) => {
    if (editingItem) {
      wishListData.updateWishItem(editingItem.id, item);
    } else {
      wishListData.addWishItem(item);
    }
    setShowForm(false);
    setEditingItem(undefined);
  };

  const handleEdit = (item: WishItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這個願望清單項目嗎？')) {
      wishListData.deleteWishItem(id);
    }
  };

  const handleMarkPurchased = (id: string) => {
    const price = prompt('請輸入實際購買價格（TWD）:');
    if (price) {
      const actualPrice = Number(price);
      if (!isNaN(actualPrice) && actualPrice > 0) {
        const store = prompt('購買商店（選填）:') || undefined;
        wishListData.markAsPurchased(id, actualPrice, store);
      }
    }
  };

  const handleMarkRejected = (id: string) => {
    if (confirm('確定不買這個了嗎？')) {
      wishListData.markAsRejected(id);
    }
  };

  const handleAddWant = (id: string) => {
    setShowWantModal(id);
  };

  const handleCompare = (item: WishItem) => {
    setComparisonItem(item);
  };

  const submitWant = () => {
    if (showWantModal) {
      wishListData.addWantEntry(showWantModal, wantIntensity);
      setShowWantModal(null);
      setWantIntensity(3);
    }
  };

  // Filter and sort items
  let filteredItems = wishListData.activeWishItems;

  if (filterPriority !== 'all') {
    filteredItems = filteredItems.filter(item => item.priority === filterPriority);
  }

  if (filterType === 'need') {
    filteredItems = filteredItems.filter(item => item.isNeed);
  } else if (filterType === 'want') {
    filteredItems = filteredItems.filter(item => !item.isNeed);
  }

  // Sort items
  filteredItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.estimatedPrice - a.estimatedPrice;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'frequency':
        return b.wantHistory.length - a.wantHistory.length;
      default: // dateAdded
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
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
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/assets"
            className="text-gray-600 hover:text-gray-900 transition-colors"
            title="回到資產"
          >
            ← 回到資產
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-3xl font-bold text-gray-900">願望清單</h1>
        </div>
        <p className="text-gray-600">系統性記錄和分析你想要的物品</p>
      </div>

      {/* Navigation Tabs - Mobile optimized */}
      <div className="flex gap-1 sm:gap-4 mb-6 border-b overflow-x-auto">
        <Link
          href="/wishlist"
          className="px-3 sm:px-4 py-3 sm:py-2 font-medium text-purple-600 border-b-2 border-purple-600 whitespace-nowrap min-h-[44px] flex items-center"
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
          className="px-3 sm:px-4 py-3 sm:py-2 font-medium text-gray-600 hover:text-gray-900 active:bg-gray-100 whitespace-nowrap min-h-[44px] flex items-center"
        >
          分析報告
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">願望總數</div>
          <div className="text-2xl font-bold text-gray-900">
            {wishListData.analytics.totalWishItems}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">總價值</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(wishListData.analytics.totalValue, 'TWD')}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">佔總資產</div>
          <div className="text-2xl font-bold text-gray-900">
            {wishListData.analytics.percentageOfAssets.toFixed(2)}%
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">
            剩餘預算
            <Link
              href="/wishlist/settings"
              className="ml-1 text-xs text-purple-600 hover:text-purple-700"
            >
              ⚙️
            </Link>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(wishListData.remainingBudget, 'TWD')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            / {formatCurrency(wishListData.actualMonthlyBudget, 'TWD')}
          </div>
        </div>
      </div>

      {/* Need vs Want Summary - Mobile optimized */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm text-gray-600 mb-1">需要 vs 想要</div>
            <div className="flex gap-4">
              <div>
                <span className="text-green-600 font-bold">
                  {wishListData.analytics.needVsWant.needs}
                </span>{' '}
                需要
              </div>
              <div>
                <span className="text-blue-600 font-bold">
                  {wishListData.analytics.needVsWant.wants}
                </span>{' '}
                想要
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingItem(undefined);
              setShowForm(true);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors shadow-md min-h-[48px]"
          >
            ➕ 新增願望
          </button>
        </div>
      </div>

      {/* Filters, Sort, and Data Management - Mobile optimized */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 items-end">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">優先級</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base min-h-[44px] sm:min-h-0"
            >
              <option value="all">全部</option>
              <option value="high">高優先</option>
              <option value="medium">中優先</option>
              <option value="low">低優先</option>
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base min-h-[44px] sm:min-h-0"
            >
              <option value="all">全部</option>
              <option value="need">需要</option>
              <option value="want">想要</option>
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base min-h-[44px] sm:min-h-0"
            >
              <option value="dateAdded">新增時間</option>
              <option value="price">價格</option>
              <option value="priority">優先級</option>
              <option value="frequency">想要頻率</option>
            </select>
          </div>

          <div className="col-span-1 sm:ml-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:invisible">動作</label>
            <button
              onClick={() => setShowDataManagement(true)}
              className="w-full px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors min-h-[44px] sm:min-h-0"
            >
              📦 資料管理
            </button>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">還沒有願望清單項目</h3>
          <p className="text-gray-600 mb-6">開始記錄你想要的物品吧！</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            新增第一個願望
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <WishItemCard
              key={item.id}
              item={item}
              assetImpact={wishListData.calculateAssetImpact(item.estimatedPrice)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarkPurchased={handleMarkPurchased}
              onMarkRejected={handleMarkRejected}
              onAddWant={handleAddWant}
              onCompare={handleCompare}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingItem ? '編輯' : '新增'}願望清單項目
            </h2>
            <WishItemForm
              item={editingItem}
              onSubmit={handleAddWishItem}
              onCancel={() => {
                setShowForm(false);
                setEditingItem(undefined);
              }}
            />
          </div>
        </div>
      )}

      {/* Want Intensity Modal */}
      {showWantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">記錄想要程度</h3>
            <p className="text-gray-600 mb-4">這個物品現在有多想要？</p>
            <div className="space-y-2 mb-6">
              {([1, 2, 3, 4, 5] as const).map((intensity) => (
                <button
                  key={intensity}
                  onClick={() => setWantIntensity(intensity)}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                    wantIntensity === intensity
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {'❤️'.repeat(intensity)} {intensity} - {
                    intensity === 1 ? '有點想要' :
                    intensity === 2 ? '還算想要' :
                    intensity === 3 ? '蠻想要的' :
                    intensity === 4 ? '很想要' :
                    '超級想要！'
                  }
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={submitWant}
                className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                確認記錄
              </button>
              <button
                onClick={() => {
                  setShowWantModal(null);
                  setWantIntensity(3);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Management Modal */}
      {showDataManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">資料管理</h3>
            <p className="text-sm text-gray-600 mb-6">
              匯出資料以保留備份。匯入先前匯出的資料以還原。
            </p>

            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full px-4 py-3 text-left bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">📥</span>
                  <div>
                    <div className="font-semibold">匯出願望清單資料</div>
                    <div className="text-xs text-blue-600">下載 JSON 檔案備份</div>
                  </div>
                </div>
              </button>

              <label className="block">
                <div className="w-full px-4 py-3 text-left bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📤</span>
                    <div>
                      <div className="font-semibold">匯入願望清單資料</div>
                      <div className="text-xs text-green-600">從 JSON 檔案還原</div>
                    </div>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleClearData}
                className="w-full px-4 py-3 text-left bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🗑️</span>
                  <div>
                    <div className="font-semibold">清除所有資料</div>
                    <div className="text-xs text-red-600">此操作無法復原</div>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowDataManagement(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Comparison Modal */}
      {comparisonItem && (
        <ProductComparisonModal
          item={comparisonItem}
          onClose={() => setComparisonItem(null)}
        />
      )}
    </div>
  );
}
