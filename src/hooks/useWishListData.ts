'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  WishListData,
  WishItem,
  PurchasedItem,
  WishListSettings,
  WishListAnalytics,
  WantEntry,
  SatisfactionRating,
  DEFAULT_WISHLIST_DATA,
} from '@/types/wishlist';
import { generateId } from '@/utils/calculations';
import {
  getWishListAnalytics,
  calculateAssetImpact,
  shouldArchiveItem,
  calculateMonthlySpend,
  getPurchaseRecommendations,
  createWantEntry,
} from '@/utils/wishlistCalculations';

const STORAGE_KEY = 'wishlist-data';

interface UseWishListDataProps {
  totalAssets?: number; // For calculating asset impact percentage
}

export function useWishListData(props?: UseWishListDataProps) {
  const { totalAssets = 0 } = props || {};
  const [data, setData] = useLocalStorage<WishListData>(STORAGE_KEY, DEFAULT_WISHLIST_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if we're in the browser
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Auto-archive old rejected items
  useEffect(() => {
    if (!isLoaded) return;

    const itemsToArchive = data.wishItems.filter(item =>
      shouldArchiveItem(item, data.settings.autoArchiveAfterYears)
    );

    if (itemsToArchive.length > 0) {
      setData(prev => ({
        ...prev,
        wishItems: prev.wishItems.filter(item =>
          !shouldArchiveItem(item, prev.settings.autoArchiveAfterYears)
        ),
      }));
    }
  }, [isLoaded, data.wishItems, data.settings.autoArchiveAfterYears, setData]);

  // Add a new wish item
  const addWishItem = useCallback(
    (item: Omit<WishItem, 'id' | 'dateAdded' | 'wantHistory'>) => {
      const newItem: WishItem = {
        ...item,
        id: generateId(),
        dateAdded: new Date().toISOString(),
        wantHistory: [],
      };

      setData(prev => ({
        ...prev,
        wishItems: [...prev.wishItems, newItem],
      }));

      return newItem;
    },
    [setData]
  );

  // Update an existing wish item
  const updateWishItem = useCallback(
    (id: string, updates: Partial<Omit<WishItem, 'id' | 'dateAdded'>>) => {
      setData(prev => {
        const itemIndex = prev.wishItems.findIndex(item => item.id === id);
        if (itemIndex === -1) return prev;

        const updatedItems = [...prev.wishItems];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          ...updates,
        };

        return {
          ...prev,
          wishItems: updatedItems,
        };
      });
    },
    [setData]
  );

  // Delete a wish item
  const deleteWishItem = useCallback(
    (id: string) => {
      setData(prev => ({
        ...prev,
        wishItems: prev.wishItems.filter(item => item.id !== id),
      }));
    },
    [setData]
  );

  // Add want entry to a wish item
  const addWantEntry = useCallback(
    (itemId: string, intensity: 1 | 2 | 3 | 4 | 5, notes?: string) => {
      const entry = createWantEntry(intensity, notes);

      setData(prev => {
        const itemIndex = prev.wishItems.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return prev;

        const updatedItems = [...prev.wishItems];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          wantHistory: [...updatedItems[itemIndex].wantHistory, entry],
        };

        return {
          ...prev,
          wishItems: updatedItems,
        };
      });

      return entry;
    },
    [setData]
  );

  // Remove want entry from a wish item
  const removeWantEntry = useCallback(
    (itemId: string, entryId: string) => {
      setData(prev => {
        const itemIndex = prev.wishItems.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return prev;

        const updatedItems = [...prev.wishItems];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          wantHistory: updatedItems[itemIndex].wantHistory.filter(entry => entry.id !== entryId),
        };

        return {
          ...prev,
          wishItems: updatedItems,
        };
      });
    },
    [setData]
  );

  // Mark wish item as purchased (creates a purchased item)
  const markAsPurchased = useCallback(
    (
      wishItemId: string,
      actualPrice: number,
      store?: string,
      type: 'daily_necessity' | 'one_time_purchase' = 'one_time_purchase'
    ) => {
      const wishItem = data.wishItems.find(item => item.id === wishItemId);
      if (!wishItem) return null;

      const purchasedItem: PurchasedItem = {
        id: generateId(),
        name: wishItem.name,
        originalWishItemId: wishItemId,
        actualPrice,
        purchaseDate: new Date().toISOString(),
        store,
        category: wishItem.category,
        type,
        satisfactionRatings: [],
        wouldRepurchase: null,
        lifeAspects: wishItem.lifeAspects,
        actualImprovement: {},
        dateAdded: new Date().toISOString(),
        notes: wishItem.notes,
        imageUrl: wishItem.imageUrl,
      };

      setData(prev => ({
        ...prev,
        wishItems: prev.wishItems.map(item =>
          item.id === wishItemId
            ? { ...item, status: 'purchased', purchaseDate: purchasedItem.purchaseDate }
            : item
        ),
        purchasedItems: [...prev.purchasedItems, purchasedItem],
      }));

      return purchasedItem;
    },
    [data.wishItems, setData]
  );

  // Mark wish item as rejected
  const markAsRejected = useCallback(
    (wishItemId: string) => {
      setData(prev => ({
        ...prev,
        wishItems: prev.wishItems.map(item =>
          item.id === wishItemId ? { ...item, status: 'rejected' } : item
        ),
      }));
    },
    [setData]
  );

  // Add a purchased item manually (not from wish list)
  const addPurchasedItem = useCallback(
    (item: Omit<PurchasedItem, 'id' | 'dateAdded'>) => {
      const newItem: PurchasedItem = {
        ...item,
        id: generateId(),
        dateAdded: new Date().toISOString(),
      };

      setData(prev => ({
        ...prev,
        purchasedItems: [...prev.purchasedItems, newItem],
      }));

      return newItem;
    },
    [setData]
  );

  // Update a purchased item
  const updatePurchasedItem = useCallback(
    (id: string, updates: Partial<Omit<PurchasedItem, 'id' | 'dateAdded'>>) => {
      setData(prev => {
        const itemIndex = prev.purchasedItems.findIndex(item => item.id === id);
        if (itemIndex === -1) return prev;

        const updatedItems = [...prev.purchasedItems];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          ...updates,
        };

        return {
          ...prev,
          purchasedItems: updatedItems,
        };
      });
    },
    [setData]
  );

  // Delete a purchased item
  const deletePurchasedItem = useCallback(
    (id: string) => {
      setData(prev => ({
        ...prev,
        purchasedItems: prev.purchasedItems.filter(item => item.id !== id),
      }));
    },
    [setData]
  );

  // Add satisfaction rating to a purchased item
  const addSatisfactionRating = useCallback(
    (itemId: string, rating: 1 | 2 | 3 | 4 | 5, notes?: string) => {
      const ratingEntry: SatisfactionRating = {
        date: new Date().toISOString(),
        rating,
        notes,
      };

      setData(prev => {
        const itemIndex = prev.purchasedItems.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return prev;

        const updatedItems = [...prev.purchasedItems];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          satisfactionRatings: [...updatedItems[itemIndex].satisfactionRatings, ratingEntry],
        };

        return {
          ...prev,
          purchasedItems: updatedItems,
        };
      });

      return ratingEntry;
    },
    [setData]
  );

  // Update settings
  const updateSettings = useCallback(
    (settings: Partial<WishListSettings>) => {
      setData(prev => ({
        ...prev,
        settings: { ...prev.settings, ...settings },
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
        const imported = JSON.parse(jsonString) as WishListData;
        // Basic validation
        if (!imported.wishItems || !imported.purchasedItems || !imported.settings) {
          throw new Error('Invalid data format');
        }
        setData(imported);
        return true;
      } catch (error) {
        console.error('Failed to import wish list data:', error);
        return false;
      }
    },
    [setData]
  );

  // Clear all data
  const clearAllData = useCallback(() => {
    setData(DEFAULT_WISHLIST_DATA);
  }, [setData]);

  // Calculate actual monthly budget based on type
  const actualMonthlyBudget = data.settings.budgetType === 'percentage'
    ? (totalAssets * data.settings.budgetPercentage) / 100
    : data.settings.monthlyBudget;

  // Calculate analytics
  const analytics: WishListAnalytics = getWishListAnalytics(
    data.wishItems,
    data.purchasedItems,
    totalAssets
  );

  // Calculate monthly spend
  const monthlySpend = calculateMonthlySpend(data.purchasedItems);

  // Get purchase recommendations
  const recommendations = getPurchaseRecommendations(
    data.wishItems,
    totalAssets,
    actualMonthlyBudget,
    monthlySpend
  );

  // Calculate remaining budget
  const remainingBudget = actualMonthlyBudget - monthlySpend;

  // Get active wish items
  const activeWishItems = data.wishItems.filter(item => item.status === 'wishlist');
  const purchasedWishItems = data.wishItems.filter(item => item.status === 'purchased');
  const rejectedWishItems = data.wishItems.filter(item => item.status === 'rejected');

  return {
    // Data
    wishItems: data.wishItems,
    activeWishItems,
    purchasedWishItems,
    rejectedWishItems,
    purchasedItems: data.purchasedItems,
    settings: data.settings,
    isLoaded,

    // Analytics
    analytics,
    monthlySpend,
    actualMonthlyBudget,
    remainingBudget,
    recommendations,

    // Wish item operations
    addWishItem,
    updateWishItem,
    deleteWishItem,
    addWantEntry,
    removeWantEntry,
    markAsPurchased,
    markAsRejected,

    // Purchased item operations
    addPurchasedItem,
    updatePurchasedItem,
    deletePurchasedItem,
    addSatisfactionRating,

    // Settings operations
    updateSettings,

    // Import/Export
    exportData,
    importData,
    clearAllData,

    // Utilities
    calculateAssetImpact: (price: number) => calculateAssetImpact(price, totalAssets),
  };
}
