'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import AssetList from '@/components/AssetList';
import AssetForm from '@/components/AssetForm';
import Modal from '@/components/Modal';
import { useAssetData } from '@/hooks/useAssetData';
import { useStockPrices, fetchExchangeRate } from '@/lib/yahooFinance';
import { fetchAlphaVantageQuote, getCachedPrice, fetchAlphaVantageExchangeRate } from '@/lib/stockApi';
import { useI18n } from '@/i18n';
import { Asset, StockPrice } from '@/types';
import { formatCurrency, parseStockSymbol } from '@/utils/calculations';

export default function AssetsPage() {
  const {
    currentAssets,
    totalTWD,
    totalUSD,
    stockPrices,
    settings,
    addAsset,
    updateAsset,
    deleteAsset,
    updateStockPrices,
    updateStockPricesWithMA,
    updateExchangeRate,
    isLoaded,
  } = useAssetData();

  const { t, language } = useI18n();
  const { fetchPrices, fetchPricesWithMA } = useStockPrices();

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

    const dataSource = settings.stockDataSource || 'yahoo';
    const apiKey = settings.alphaVantageApiKey;

    const isAlphaVantage = dataSource === 'alphavantage' && apiKey;

    setPriceUpdateStatus(
      language === 'zh-TW'
        ? (isAlphaVantage ? '正在透過 Alpha Vantage 取得股價...' : '正在取得股價與移動平均...')
        : (isAlphaVantage ? 'Fetching stock prices via Alpha Vantage...' : 'Fetching stock prices with moving averages...')
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

      if (isAlphaVantage) {
        // Use Alpha Vantage API with caching
        const prices: Record<string, StockPrice> = {};
        let fetchedCount = 0;
        let cachedCount = 0;

        for (let i = 0; i < symbols.length; i++) {
          const symbol = symbols[i];
          const { cleanSymbol, isTW } = parseStockSymbol(symbol);

          // Check cache first
          const cached = getCachedPrice(cleanSymbol);
          if (cached) {
            prices[symbol] = {
              symbol: cleanSymbol,
              currentPrice: cached.price,
              movingAvg3M: cached.price,
              movingAvg1Y: cached.price,
              currency: cached.currency,
              lastUpdated: new Date().toISOString(),
              historicalPrices: {},
            };
            cachedCount++;
            continue;
          }

          // Fetch from Alpha Vantage
          setPriceUpdateStatus(
            language === 'zh-TW'
              ? `正在取得 ${cleanSymbol} 的股價... (${i + 1}/${symbols.length})`
              : `Fetching ${cleanSymbol}... (${i + 1}/${symbols.length})`
          );

          const quote = await fetchAlphaVantageQuote(symbol, apiKey!);
          if (quote) {
            prices[symbol] = {
              symbol: quote.symbol,
              currentPrice: quote.price,
              movingAvg3M: quote.price, // Alpha Vantage free tier doesn't provide MA
              movingAvg1Y: quote.price,
              currency: quote.currency,
              lastUpdated: quote.lastUpdated,
              historicalPrices: {},
            };
            fetchedCount++;
          }

          // Wait between requests (Alpha Vantage rate limit: 5/min for free tier)
          if (i < symbols.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 12000));
          }
        }

        if (Object.keys(prices).length > 0) {
          updateStockPricesWithMA(prices);
          setPriceUpdateStatus(
            language === 'zh-TW'
              ? `已更新 ${Object.keys(prices).length} 檔股票（${fetchedCount} 新取得，${cachedCount} 來自快取）`
              : `Updated ${Object.keys(prices).length} stock(s) (${fetchedCount} fetched, ${cachedCount} from cache)`
          );
        } else {
          setPriceUpdateStatus(language === 'zh-TW' ? '無法取得股價。請檢查 API 金鑰是否正確。' : 'Could not fetch any stock prices. Please check your API key.');
        }
      } else {
        // Use Yahoo Finance (original behavior)
        const prices = await fetchPricesWithMA(symbols);

        if (Object.keys(prices).length > 0) {
          updateStockPricesWithMA(prices);
          setPriceUpdateStatus(
            language === 'zh-TW'
              ? `已成功更新 ${Object.keys(prices).length} 檔股票價格與移動平均！`
              : `Updated ${Object.keys(prices).length} stock price(s) with moving averages!`
          );
        } else {
          setPriceUpdateStatus(language === 'zh-TW' ? '無法取得股價。API 可能暫時無法使用。' : 'Could not fetch any stock prices. API might be unavailable.');
        }
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

    const dataSource = settings.stockDataSource || 'yahoo';
    const apiKey = settings.alphaVantageApiKey;
    const isAlphaVantage = dataSource === 'alphavantage' && apiKey;

    setPriceUpdateStatus(language === 'zh-TW' ? '正在取得匯率...' : 'Fetching exchange rate...');

    try {
      let rate: number | null = null;

      if (isAlphaVantage) {
        rate = await fetchAlphaVantageExchangeRate(apiKey!);
      }

      // Fallback to Yahoo Finance if Alpha Vantage fails or not selected
      if (!rate) {
        rate = await fetchExchangeRate();
      }

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
