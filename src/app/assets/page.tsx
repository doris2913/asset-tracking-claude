'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import AssetList from '@/components/AssetList';
import AssetForm from '@/components/AssetForm';
import Modal from '@/components/Modal';
import { useAssetData } from '@/hooks/useAssetData';
import { useStockPrices, fetchExchangeRate } from '@/lib/yahooFinance';
import { useI18n } from '@/i18n';
import { Asset } from '@/types';
import { formatCurrency } from '@/utils/calculations';

export default function AssetsPage() {
  const {
    currentAssets,
    totalTWD,
    totalUSD,
    addAsset,
    updateAsset,
    deleteAsset,
    updateStockPrices,
    updateExchangeRate,
    isLoaded,
  } = useAssetData();

  const { t, language } = useI18n();
  const { fetchPrices } = useStockPrices();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [priceUpdateStatus, setPriceUpdateStatus] = useState<string>('');

  const handleAddAsset = () => {
    setEditingAsset(undefined);
    setIsModalOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleSubmitAsset = (assetData: Omit<Asset, 'id' | 'lastUpdated'>) => {
    if (editingAsset) {
      updateAsset(editingAsset.id, assetData);
    } else {
      addAsset(assetData);
    }
    setIsModalOpen(false);
  };

  const handleUpdateStockPrices = async () => {
    setIsUpdatingPrices(true);
    setPriceUpdateStatus(language === 'zh-TW' ? '正在取得股價...' : 'Fetching stock prices...');

    try {
      const stockAssets = currentAssets.assets.filter(
        (a) => a.symbol && (a.type === 'stock_tw' || a.type === 'stock_us')
      );

      if (stockAssets.length === 0) {
        setPriceUpdateStatus(language === 'zh-TW' ? '沒有需要更新的股票。' : 'No stocks with symbols to update.');
        return;
      }

      const symbols = stockAssets.map((a) => a.symbol!);
      const prices = await fetchPrices(symbols);

      if (Object.keys(prices).length > 0) {
        updateStockPrices(prices);
        setPriceUpdateStatus(
          language === 'zh-TW'
            ? `已成功更新 ${Object.keys(prices).length} 檔股票價格！`
            : `Updated ${Object.keys(prices).length} stock price(s) successfully!`
        );
      } else {
        setPriceUpdateStatus(language === 'zh-TW' ? '無法取得股價。API 可能暫時無法使用。' : 'Could not fetch any stock prices. API might be unavailable.');
      }
    } catch (error) {
      setPriceUpdateStatus(language === 'zh-TW' ? '更新股價失敗。' : 'Failed to update stock prices.');
      console.error(error);
    } finally {
      setIsUpdatingPrices(false);
      setTimeout(() => setPriceUpdateStatus(''), 5000);
    }
  };

  const handleUpdateExchangeRate = async () => {
    setIsUpdatingPrices(true);
    setPriceUpdateStatus(language === 'zh-TW' ? '正在取得匯率...' : 'Fetching exchange rate...');

    try {
      const rate = await fetchExchangeRate();
      if (rate) {
        updateExchangeRate(rate);
        setPriceUpdateStatus(
          language === 'zh-TW'
            ? `匯率已更新為 ${rate.toFixed(2)} TWD/USD`
            : `Exchange rate updated to ${rate.toFixed(2)} TWD/USD`
        );
      } else {
        setPriceUpdateStatus(language === 'zh-TW' ? '無法取得匯率。' : 'Could not fetch exchange rate.');
      }
    } catch (error) {
      setPriceUpdateStatus(language === 'zh-TW' ? '更新匯率失敗。' : 'Failed to update exchange rate.');
      console.error(error);
    } finally {
      setIsUpdatingPrices(false);
      setTimeout(() => setPriceUpdateStatus(''), 5000);
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.assets.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t.assets.subtitle}
            </p>
          </div>
          <button onClick={handleAddAsset} className="btn btn-primary">
            {t.assets.addAsset}
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.assets.totalTWD}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalTWD, 'TWD')}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.assets.totalUSD}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalUSD, 'USD')}
            </p>
          </div>
        </div>

        {/* Price Update Actions */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {t.assets.updatePrices}
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleUpdateStockPrices}
              disabled={isUpdatingPrices}
              className="btn btn-secondary"
            >
              {isUpdatingPrices ? t.assets.updating : t.assets.updateStockPrices}
            </button>
            <button
              onClick={handleUpdateExchangeRate}
              disabled={isUpdatingPrices}
              className="btn btn-secondary"
            >
              {isUpdatingPrices ? t.assets.updating : t.assets.updateExchangeRate}
            </button>
          </div>
          {priceUpdateStatus && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {priceUpdateStatus}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
            {t.assets.priceUpdateNote}: {currentAssets.exchangeRate.toFixed(2)} TWD/USD
          </p>
        </div>

        {/* Asset List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.assets.currentAssets}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t.assets.lastUpdated}: {new Date(currentAssets.lastModified).toLocaleString(dateLocale)}
            </span>
          </div>
          <AssetList
            assets={currentAssets.assets}
            onEdit={handleEditAsset}
            onDelete={deleteAsset}
          />
        </div>
      </main>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAsset ? t.assets.editAsset : t.assets.addAsset}
      >
        <AssetForm
          asset={editingAsset}
          onSubmit={handleSubmitAsset}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
