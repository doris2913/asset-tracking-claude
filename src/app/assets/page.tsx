'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import AssetList from '@/components/AssetList';
import AssetForm from '@/components/AssetForm';
import Modal from '@/components/Modal';
import { useAssetData } from '@/hooks/useAssetData';
import { fetchMultipleStockPrices, fetchExchangeRate, API_SOURCE_CONFIG, ProgressCallback } from '@/lib/stockPriceManager';
import { useI18n } from '@/i18n';
import { Asset } from '@/types';
import { formatCurrency } from '@/utils/calculations';

export default function AssetsPage() {
  const {
    currentAssets,
    totalTWD,
    totalUSD,
    settings,
    addAsset,
    updateAsset,
    deleteAsset,
    updateStockPricesWithMA,
    updateExchangeRate,
    isLoaded,
  } = useAssetData();

  const { t, language } = useI18n();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [priceUpdateStatus, setPriceUpdateStatus] = useState<string>('');
  const [hideAssets, setHideAssets] = useState(() => {
    // Load preference from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hideAssets') === 'true';
    }
    return false;
  });

  const toggleHideAssets = () => {
    setHideAssets(prev => {
      const newValue = !prev;
      localStorage.setItem('hideAssets', String(newValue));
      return newValue;
    });
  };

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

    const dataSource = settings.stockDataSource || 'yahoo';
    const sourceConfig = API_SOURCE_CONFIG[dataSource];

    setPriceUpdateStatus(
      language === 'zh-TW'
        ? `正在透過 ${dataSource === 'yahoo' ? 'Yahoo Finance' : dataSource.toUpperCase()} 取得股價...`
        : `Fetching stock prices via ${dataSource === 'yahoo' ? 'Yahoo Finance' : dataSource.toUpperCase()}...`
    );

    try {
      const stockAssets = currentAssets.assets.filter(
        (a) => a.symbol && (a.type === 'stock_tw' || a.type === 'stock_us')
      );

      if (stockAssets.length === 0) {
        setPriceUpdateStatus(language === 'zh-TW' ? '沒有需要更新的股票。' : 'No stocks with symbols to update.');
        return;
      }

      const symbols = stockAssets.map((a) => a.symbol!);

      // Progress callback for real-time updates
      const onProgress: ProgressCallback = (current, total, symbol, status) => {
        const statusText = status === 'cached'
          ? (language === 'zh-TW' ? '快取' : 'cached')
          : status === 'fetching'
          ? (language === 'zh-TW' ? '取得中' : 'fetching')
          : status === 'success'
          ? (language === 'zh-TW' ? '成功' : 'success')
          : (language === 'zh-TW' ? '失敗' : 'failed');

        setPriceUpdateStatus(
          language === 'zh-TW'
            ? `${symbol} ${statusText}... (${current}/${total})`
            : `${symbol} ${statusText}... (${current}/${total})`
        );
      };

      // Use unified stock price manager
      const prices = await fetchMultipleStockPrices(symbols, settings, onProgress);

      if (Object.keys(prices).length > 0) {
        updateStockPricesWithMA(prices);
        const successCount = Object.keys(prices).length;
        const failedCount = symbols.length - successCount;

        let statusMessage = language === 'zh-TW'
          ? `已更新 ${successCount} 檔股票`
          : `Updated ${successCount} stock(s)`;

        if (failedCount > 0) {
          statusMessage += language === 'zh-TW'
            ? `（${failedCount} 檔失敗）`
            : ` (${failedCount} failed)`;
        }

        if (sourceConfig.supportsMA) {
          statusMessage += language === 'zh-TW' ? '（含移動平均）' : ' with moving averages';
        }

        setPriceUpdateStatus(statusMessage);
      } else {
        setPriceUpdateStatus(
          language === 'zh-TW'
            ? '無法取得股價。請檢查 API 設定。'
            : 'Could not fetch any stock prices. Please check API settings.'
        );
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
      const result = await fetchExchangeRate(settings);

      if (result.success && result.rate) {
        updateExchangeRate(result.rate);
        const sourceLabel = result.source === 'yahoo' ? 'Yahoo Finance' : result.source.toUpperCase();
        setPriceUpdateStatus(
          language === 'zh-TW'
            ? `匯率已更新為 ${result.rate.toFixed(2)} TWD/USD（來源：${sourceLabel}）`
            : `Exchange rate updated to ${result.rate.toFixed(2)} TWD/USD (via ${sourceLabel})`
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t.assets.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
              {t.assets.subtitle}
            </p>
          </div>
          <button onClick={handleAddAsset} className="btn btn-primary w-full sm:w-auto">
            {t.assets.addAsset}
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.assets.totalTWD}</p>
              <button
                onClick={toggleHideAssets}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title={hideAssets ? (language === 'zh-TW' ? '顯示金額' : 'Show amounts') : (language === 'zh-TW' ? '隱藏金額' : 'Hide amounts')}
              >
                {hideAssets ? '👁️' : '🙈'}
              </button>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {hideAssets ? '＊＊＊＊＊＊' : formatCurrency(totalTWD, 'TWD')}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.assets.totalUSD}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {hideAssets ? '＊＊＊＊＊＊' : formatCurrency(totalUSD, 'USD')}
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.assets.currentAssets}
            </h2>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
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
