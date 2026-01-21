'use client';

import { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { useAssetData } from '@/hooks/useAssetData';
import { useI18n } from '@/i18n';
import { Currency, AssetType } from '@/types';
import { formatCurrency, toTWD, toUSD } from '@/utils/calculations';

const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  cash_twd: '💵',
  cash_usd: '💲',
  stock_tw: '📈',
  stock_us: '📊',
  liability: '💳',
  us_tbills: '🏛️',
};

export default function DetailsPage() {
  const { currentAssets, totalTWD, totalUSD, isLoaded } = useAssetData();
  const { t, language } = useI18n();
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'value'>('type');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const labels = {
    title: language === 'zh-TW' ? '資產明細' : 'Asset Details',
    subtitle: language === 'zh-TW' ? '所有資產的詳細資訊' : 'Detailed information of all assets',
    name: language === 'zh-TW' ? '名稱' : 'Name',
    type: language === 'zh-TW' ? '類型' : 'Type',
    symbol: language === 'zh-TW' ? '代號' : 'Symbol',
    shares: language === 'zh-TW' ? '數量' : 'Shares',
    unitPrice: language === 'zh-TW' ? '單價' : 'Unit Price',
    totalValue: language === 'zh-TW' ? '總價值' : 'Total Value',
    percentage: language === 'zh-TW' ? '佔比' : '%',
    lastUpdated: language === 'zh-TW' ? '更新日期' : 'Last Updated',
    sortBy: language === 'zh-TW' ? '排序' : 'Sort by',
    noAssets: language === 'zh-TW' ? '尚無資產' : 'No assets yet',
    total: language === 'zh-TW' ? '總計' : 'Total',
  };

  const sortedAssets = useMemo(() => {
    const assets = [...currentAssets.assets];
    return assets.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          if (comparison === 0) {
            // Secondary sort by value within same type
            const aValue = toTWD(a.value, a.currency, currentAssets.exchangeRate);
            const bValue = toTWD(b.value, b.currency, currentAssets.exchangeRate);
            comparison = bValue - aValue;
          }
          break;
        case 'value':
          const aValue = toTWD(a.value, a.currency, currentAssets.exchangeRate);
          const bValue = toTWD(b.value, b.currency, currentAssets.exchangeRate);
          comparison = aValue - bValue;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [currentAssets.assets, currentAssets.exchangeRate, sortBy, sortOrder]);

  const getDisplayValue = (value: number, currency: Currency) => {
    if (displayCurrency === 'TWD') {
      return toTWD(value, currency, currentAssets.exchangeRate);
    }
    return toUSD(value, currency, currentAssets.exchangeRate);
  };

  const getUnitPrice = (asset: { value: number; shares?: number }) => {
    if (!asset.shares || asset.shares === 0) return null;
    return asset.value / asset.shares;
  };

  const getPercentage = (value: number, currency: Currency) => {
    const valueTWD = toTWD(value, currency, currentAssets.exchangeRate);
    if (totalTWD === 0) return 0;
    return (valueTWD / totalTWD) * 100;
  };

  const handleSort = (newSortBy: 'name' | 'type' | 'value') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'value' ? 'desc' : 'asc');
    }
  };

  const dateLocale = language === 'zh-TW' ? 'zh-TW' : 'en-US';

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{labels.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{labels.subtitle}</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
              className="select w-24"
            >
              <option value="TWD">TWD</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">{labels.total} (TWD)</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalTWD, 'TWD')}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">{labels.total} (USD)</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalUSD, 'USD')}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.dashboard.exchangeRate}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {currentAssets.exchangeRate.toFixed(2)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.nav.assets}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {currentAssets.assets.length}
            </p>
          </div>
        </div>

        {/* Asset Table */}
        <div className="card overflow-hidden">
          {currentAssets.assets.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-4xl mb-4">📦</p>
              <p>{labels.noAssets}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <th
                      className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200"
                      onClick={() => handleSort('name')}
                    >
                      {labels.name} {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200"
                      onClick={() => handleSort('type')}
                    >
                      {labels.type} {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {labels.symbol}
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 text-right">
                      {labels.shares}
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 text-right">
                      {labels.unitPrice}
                    </th>
                    <th
                      className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 text-right cursor-pointer hover:text-gray-900 dark:hover:text-gray-200"
                      onClick={() => handleSort('value')}
                    >
                      {labels.totalValue} {sortBy === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 text-right">
                      {labels.percentage}
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 text-right">
                      {labels.lastUpdated}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAssets.map((asset) => {
                    const unitPrice = getUnitPrice(asset);
                    const displayValue = getDisplayValue(asset.value, asset.currency);
                    const percentage = getPercentage(asset.value, asset.currency);

                    return (
                      <tr
                        key={asset.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {asset.name}
                          </div>
                          {asset.notes && (
                            <div className="text-xs text-gray-400 mt-0.5">{asset.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <span className="mr-1">{ASSET_TYPE_ICONS[asset.type]}</span>
                          {t.assetTypes[asset.type]}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-sm">
                          {asset.symbol || '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                          {asset.shares ? asset.shares.toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                          {unitPrice
                            ? formatCurrency(unitPrice, asset.currency)
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(displayValue, displayCurrency)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                          {percentage.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500 dark:text-gray-500 text-sm">
                          {new Date(asset.lastUpdated).toLocaleDateString(dateLocale)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                    <td colSpan={5} className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {labels.total}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-lg text-gray-900 dark:text-white">
                      {formatCurrency(displayCurrency === 'TWD' ? totalTWD : totalUSD, displayCurrency)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-600 dark:text-gray-400">
                      100%
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
