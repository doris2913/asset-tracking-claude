'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import AssetList from '@/components/AssetList';
import AssetForm from '@/components/AssetForm';
import Modal from '@/components/Modal';
import { useAssetData } from '@/hooks/useAssetData';
import { useStockPrices, fetchExchangeRate } from '@/lib/yahooFinance';
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
    setPriceUpdateStatus('Fetching stock prices...');

    try {
      // Get all stock symbols
      const stockAssets = currentAssets.assets.filter(
        (a) => a.symbol && (a.type === 'stock_tw' || a.type === 'stock_us')
      );

      if (stockAssets.length === 0) {
        setPriceUpdateStatus('No stocks with symbols to update.');
        return;
      }

      const symbols = stockAssets.map((a) => a.symbol!);
      const prices = await fetchPrices(symbols);

      if (Object.keys(prices).length > 0) {
        updateStockPrices(prices);
        setPriceUpdateStatus(
          `Updated ${Object.keys(prices).length} stock price(s) successfully!`
        );
      } else {
        setPriceUpdateStatus('Could not fetch any stock prices. API might be unavailable.');
      }
    } catch (error) {
      setPriceUpdateStatus('Failed to update stock prices.');
      console.error(error);
    } finally {
      setIsUpdatingPrices(false);
      setTimeout(() => setPriceUpdateStatus(''), 5000);
    }
  };

  const handleUpdateExchangeRate = async () => {
    setIsUpdatingPrices(true);
    setPriceUpdateStatus('Fetching exchange rate...');

    try {
      const rate = await fetchExchangeRate();
      if (rate) {
        updateExchangeRate(rate);
        setPriceUpdateStatus(`Exchange rate updated to ${rate.toFixed(2)} TWD/USD`);
      } else {
        setPriceUpdateStatus('Could not fetch exchange rate.');
      }
    } catch (error) {
      setPriceUpdateStatus('Failed to update exchange rate.');
      console.error(error);
    } finally {
      setIsUpdatingPrices(false);
      setTimeout(() => setPriceUpdateStatus(''), 5000);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assets</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your current assets
            </p>
          </div>
          <button onClick={handleAddAsset} className="btn btn-primary">
            + Add Asset
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total (TWD)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalTWD, 'TWD')}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total (USD)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalUSD, 'USD')}
            </p>
          </div>
        </div>

        {/* Price Update Actions */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Update Prices
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleUpdateStockPrices}
              disabled={isUpdatingPrices}
              className="btn btn-secondary"
            >
              {isUpdatingPrices ? 'Updating...' : 'Update Stock Prices'}
            </button>
            <button
              onClick={handleUpdateExchangeRate}
              disabled={isUpdatingPrices}
              className="btn btn-secondary"
            >
              {isUpdatingPrices ? 'Updating...' : 'Update Exchange Rate'}
            </button>
          </div>
          {priceUpdateStatus && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {priceUpdateStatus}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
            Stock prices are fetched from Yahoo Finance. Exchange rate: {currentAssets.exchangeRate.toFixed(2)} TWD/USD
          </p>
        </div>

        {/* Asset List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Current Assets
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date(currentAssets.lastModified).toLocaleString()}
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
        title={editingAsset ? 'Edit Asset' : 'Add Asset'}
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
