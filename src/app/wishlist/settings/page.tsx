'use client';

import { useState } from 'react';
import { useWishListData } from '@/hooks/useWishListData';
import { useAssetData } from '@/hooks/useAssetData';
import { formatCurrency } from '@/utils/calculations';
import Link from 'next/link';

export default function WishListSettingsPage() {
  const assetData = useAssetData();
  const wishListData = useWishListData({ totalAssets: assetData.totalTWD });

  const [budgetType, setBudgetType] = useState<'fixed' | 'percentage'>(
    wishListData.settings.budgetType
  );
  const [monthlyBudget, setMonthlyBudget] = useState(wishListData.settings.monthlyBudget);
  const [budgetPercentage, setBudgetPercentage] = useState(wishListData.settings.budgetPercentage);
  const [autoArchiveAfterYears, setAutoArchiveAfterYears] = useState(
    wishListData.settings.autoArchiveAfterYears
  );

  const handleSave = () => {
    wishListData.updateSettings({
      budgetType,
      monthlyBudget,
      budgetPercentage,
      autoArchiveAfterYears,
    });
    alert('願望清單設定已儲存！');
  };

  const actualBudget = budgetType === 'percentage'
    ? (assetData.totalTWD * budgetPercentage) / 100
    : monthlyBudget;

  if (!wishListData.isLoaded || !assetData.isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">載入中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">願望清單設定</h1>
        <p className="text-gray-600">設定預算、自動歸檔和其他偏好</p>
      </div>

      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/wishlist"
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          ← 返回願望清單
        </Link>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Budget Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">預算設定</h2>

          {/* Budget Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              預算類型
            </label>
            <div className="space-y-3">
              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                <input
                  type="radio"
                  value="fixed"
                  checked={budgetType === 'fixed'}
                  onChange={(e) => setBudgetType(e.target.value as 'fixed')}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">固定金額</div>
                  <div className="text-sm text-gray-600 mt-1">
                    每月固定的預算金額，不隨資產變動
                  </div>
                  {budgetType === 'fixed' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        每月預算 (TWD)
                      </label>
                      <input
                        type="number"
                        value={monthlyBudget}
                        onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                      />
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50">
                <input
                  type="radio"
                  value="percentage"
                  checked={budgetType === 'percentage'}
                  onChange={(e) => setBudgetType(e.target.value as 'percentage')}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">總資產百分比</div>
                  <div className="text-sm text-gray-600 mt-1">
                    預算隨著總資產變動，更靈活的管理方式
                  </div>
                  {budgetType === 'percentage' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        預算百分比 (%)
                      </label>
                      <input
                        type="number"
                        value={budgetPercentage}
                        onChange={(e) => setBudgetPercentage(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <div className="mt-2 text-sm text-gray-600">
                        目前總資產: {formatCurrency(assetData.totalTWD, 'TWD')}
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Calculated Budget Display */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-700 mb-1">實際每月預算</div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(actualBudget, 'TWD')}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {budgetType === 'percentage'
                ? `${budgetPercentage}% × ${formatCurrency(assetData.totalTWD, 'TWD')}`
                : '固定金額'}
            </div>
          </div>
        </div>

        {/* Archive Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">自動歸檔設定</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              自動歸檔年限
            </label>
            <input
              type="number"
              value={autoArchiveAfterYears}
              onChange={(e) => setAutoArchiveAfterYears(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="1"
              max="20"
            />
            <p className="text-sm text-gray-600 mt-2">
              「已拒絕」狀態的項目會在 {autoArchiveAfterYears} 年後自動刪除
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            儲存設定
          </button>
          <Link
            href="/wishlist"
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors text-center"
          >
            取消
          </Link>
        </div>
      </div>
    </div>
  );
}
