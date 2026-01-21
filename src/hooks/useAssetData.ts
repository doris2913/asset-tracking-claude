'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  AppData,
  Asset,
  Snapshot,
  DEFAULT_APP_DATA,
  CurrentAssets,
  AppSettings,
  StockPrice,
} from '@/types';
import {
  generateId,
  calculateTotalTWD,
  calculateTotalUSD,
  isSnapshotNeeded,
  getLatestSnapshotDate,
  createSnapshot,
} from '@/utils/calculations';

const STORAGE_KEY = 'asset-tracker-data';

export function useAssetData() {
  const [data, setData] = useLocalStorage<AppData>(STORAGE_KEY, DEFAULT_APP_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if we're in the browser
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Add a new asset
  const addAsset = useCallback(
    (asset: Omit<Asset, 'id' | 'lastUpdated'>) => {
      const newAsset: Asset = {
        ...asset,
        id: generateId(),
        lastUpdated: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        currentAssets: {
          ...prev.currentAssets,
          assets: [...prev.currentAssets.assets, newAsset],
          lastModified: new Date().toISOString(),
        },
      }));

      return newAsset;
    },
    [setData]
  );

  // Update an existing asset
  const updateAsset = useCallback(
    (id: string, updates: Partial<Omit<Asset, 'id'>>) => {
      setData((prev) => {
        const assetIndex = prev.currentAssets.assets.findIndex((a) => a.id === id);
        if (assetIndex === -1) return prev;

        const updatedAssets = [...prev.currentAssets.assets];
        updatedAssets[assetIndex] = {
          ...updatedAssets[assetIndex],
          ...updates,
          lastUpdated: new Date().toISOString(),
        };

        // Check if we need to create a snapshot
        const latestSnapshotDate = getLatestSnapshotDate(prev.snapshots);
        const needsSnapshot = isSnapshotNeeded(
          latestSnapshotDate,
          prev.settings.snapshotIntervalDays
        );

        let newSnapshots = prev.snapshots;
        if (needsSnapshot && prev.currentAssets.assets.length > 0) {
          // Create snapshot from PREVIOUS state (before update)
          const snapshot = createSnapshot(
            prev.currentAssets.assets,
            prev.currentAssets.exchangeRate,
            'Auto-created snapshot'
          );
          newSnapshots = [...prev.snapshots, snapshot];
        }

        return {
          ...prev,
          currentAssets: {
            ...prev.currentAssets,
            assets: updatedAssets,
            lastModified: new Date().toISOString(),
          },
          snapshots: newSnapshots,
        };
      });
    },
    [setData]
  );

  // Delete an asset
  const deleteAsset = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        currentAssets: {
          ...prev.currentAssets,
          assets: prev.currentAssets.assets.filter((a) => a.id !== id),
          lastModified: new Date().toISOString(),
        },
      }));
    },
    [setData]
  );

  // Update stock prices (batch update for stocks)
  const updateStockPrices = useCallback(
    (prices: Record<string, { price: number; currency: 'TWD' | 'USD' }>) => {
      setData((prev) => {
        const updatedAssets = prev.currentAssets.assets.map((asset) => {
          if (asset.symbol && prices[asset.symbol]) {
            const { price } = prices[asset.symbol];
            const newValue = asset.shares ? price * asset.shares : price;
            return {
              ...asset,
              value: newValue,
              lastUpdated: new Date().toISOString(),
            };
          }
          return asset;
        });

        return {
          ...prev,
          currentAssets: {
            ...prev.currentAssets,
            assets: updatedAssets,
            lastModified: new Date().toISOString(),
          },
        };
      });
    },
    [setData]
  );

  // Helper function to find the closest historical price for a date
  const findClosestPrice = (
    historicalPrices: Record<string, number>,
    targetDate: string
  ): number | null => {
    const targetDateStr = targetDate.split('T')[0]; // Normalize to YYYY-MM-DD

    // First try exact match
    if (historicalPrices[targetDateStr]) {
      return historicalPrices[targetDateStr];
    }

    // Find the closest date (within 7 days before or after)
    const targetTime = new Date(targetDateStr).getTime();
    let closestPrice: number | null = null;
    let closestDiff = Infinity;

    for (const [dateStr, price] of Object.entries(historicalPrices)) {
      const diff = Math.abs(new Date(dateStr).getTime() - targetTime);
      const daysDiff = diff / (1000 * 60 * 60 * 24);

      if (daysDiff <= 7 && diff < closestDiff) {
        closestDiff = diff;
        closestPrice = price;
      }
    }

    return closestPrice;
  };

  // Update stock prices with moving averages
  const updateStockPricesWithMA = useCallback(
    (prices: Record<string, StockPrice>) => {
      setData((prev) => {
        // Update asset values based on current prices
        const updatedAssets = prev.currentAssets.assets.map((asset) => {
          if (asset.symbol && prices[asset.symbol]) {
            const { currentPrice } = prices[asset.symbol];
            const newValue = asset.shares ? currentPrice * asset.shares : currentPrice;
            return {
              ...asset,
              value: newValue,
              lastUpdated: new Date().toISOString(),
            };
          }
          return asset;
        });

        // Update historical snapshot values using historical prices
        const updatedSnapshots = prev.snapshots.map((snapshot) => {
          let snapshotUpdated = false;
          const updatedSnapshotAssets = snapshot.assets.map((asset) => {
            // Only update stock assets that have shares and historical price data
            if (
              asset.symbol &&
              asset.shares &&
              prices[asset.symbol]?.historicalPrices
            ) {
              const historicalPrice = findClosestPrice(
                prices[asset.symbol].historicalPrices!,
                snapshot.date
              );

              if (historicalPrice !== null) {
                snapshotUpdated = true;
                const newValue = asset.shares * historicalPrice;
                return {
                  ...asset,
                  value: newValue,
                };
              }
            }
            return asset;
          });

          if (snapshotUpdated) {
            // Recalculate snapshot totals
            let totalTWD = 0;
            let totalUSD = 0;

            for (const asset of updatedSnapshotAssets) {
              if (asset.currency === 'TWD') {
                totalTWD += asset.value;
                totalUSD += asset.value / snapshot.exchangeRate;
              } else {
                totalUSD += asset.value;
                totalTWD += asset.value * snapshot.exchangeRate;
              }
            }

            return {
              ...snapshot,
              assets: updatedSnapshotAssets,
              totalValueTWD: totalTWD,
              totalValueUSD: totalUSD,
            };
          }

          return snapshot;
        });

        return {
          ...prev,
          currentAssets: {
            ...prev.currentAssets,
            assets: updatedAssets,
            lastModified: new Date().toISOString(),
          },
          snapshots: updatedSnapshots,
          stockPrices: {
            ...prev.stockPrices,
            ...prices,
          },
        };
      });
    },
    [setData]
  );

  // Create a manual snapshot
  const createManualSnapshot = useCallback(
    (notes?: string) => {
      setData((prev) => {
        const snapshot = createSnapshot(
          prev.currentAssets.assets,
          prev.currentAssets.exchangeRate,
          notes
        );
        return {
          ...prev,
          snapshots: [...prev.snapshots, snapshot],
        };
      });
    },
    [setData]
  );

  // Delete a snapshot
  const deleteSnapshot = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        snapshots: prev.snapshots.filter((s) => s.id !== id),
      }));
    },
    [setData]
  );

  // Update settings
  const updateSettings = useCallback(
    (settings: Partial<AppSettings>) => {
      setData((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...settings },
      }));
    },
    [setData]
  );

  // Update exchange rate
  const updateExchangeRate = useCallback(
    (rate: number) => {
      setData((prev) => ({
        ...prev,
        currentAssets: {
          ...prev.currentAssets,
          exchangeRate: rate,
        },
        settings: {
          ...prev.settings,
          exchangeRate: rate,
        },
      }));
    },
    [setData]
  );

  // Export data as JSON
  const exportData = useCallback((): string => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  // Import data from JSON
  const importData = useCallback(
    (jsonString: string): boolean => {
      try {
        const imported = JSON.parse(jsonString) as AppData;
        // Basic validation
        if (!imported.currentAssets || !imported.snapshots || !imported.settings) {
          throw new Error('Invalid data format');
        }
        setData(imported);
        return true;
      } catch (error) {
        console.error('Failed to import data:', error);
        return false;
      }
    },
    [setData]
  );

  // Clear all data
  const clearAllData = useCallback(() => {
    setData(DEFAULT_APP_DATA);
  }, [setData]);

  // Calculate totals
  const totalTWD = calculateTotalTWD(
    data.currentAssets.assets,
    data.currentAssets.exchangeRate
  );
  const totalUSD = calculateTotalUSD(
    data.currentAssets.assets,
    data.currentAssets.exchangeRate
  );

  return {
    // Data
    currentAssets: data.currentAssets,
    snapshots: data.snapshots,
    settings: data.settings,
    stockPrices: data.stockPrices || {},
    isLoaded,

    // Calculated values
    totalTWD,
    totalUSD,

    // Asset operations
    addAsset,
    updateAsset,
    deleteAsset,
    updateStockPrices,
    updateStockPricesWithMA,

    // Snapshot operations
    createManualSnapshot,
    deleteSnapshot,

    // Settings operations
    updateSettings,
    updateExchangeRate,

    // Import/Export
    exportData,
    importData,
    clearAllData,
  };
}
