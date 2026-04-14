import {
  WishItem,
  PurchasedItem,
  WishListAnalytics,
  LifeAspect,
  WantEntry
} from '@/types/wishlist';
import { generateId } from './calculations';

/**
 * Calculate want frequency (times per week)
 * @param wantHistory Array of want entries
 * @param weeks Number of weeks to analyze (default: 4)
 * @returns Average wants per week
 */
export function calculateWantFrequency(wantHistory: WantEntry[], weeks: number = 4): number {
  if (wantHistory.length === 0) return 0;

  const now = new Date();
  const weeksAgo = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

  const recentWants = wantHistory.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= weeksAgo && entryDate <= now;
  });

  return recentWants.length / weeks;
}

/**
 * Calculate want frequency for a specific time period (per month)
 * @param wantHistory Array of want entries
 * @param months Number of months to analyze (default: 3)
 * @returns Average wants per month
 */
export function calculateWantFrequencyMonthly(wantHistory: WantEntry[], months: number = 3): number {
  if (wantHistory.length === 0) return 0;

  const now = new Date();
  const monthsAgo = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());

  const recentWants = wantHistory.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= monthsAgo && entryDate <= now;
  });

  return recentWants.length / months;
}

/**
 * Calculate average want intensity
 * @param wantHistory Array of want entries
 * @returns Average intensity (1-5)
 */
export function calculateAverageIntensity(wantHistory: WantEntry[]): number {
  if (wantHistory.length === 0) return 0;

  const sum = wantHistory.reduce((total, entry) => total + entry.intensity, 0);
  return sum / wantHistory.length;
}

/**
 * Get days since last wanted
 * @param wantHistory Array of want entries
 * @returns Days since last want, or null if never wanted
 */
export function getDaysSinceLastWanted(wantHistory: WantEntry[]): number | null {
  if (wantHistory.length === 0) return null;

  const sortedHistory = [...wantHistory].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const lastWant = new Date(sortedHistory[0].date);
  const now = new Date();
  const diffTime = now.getTime() - lastWant.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calculate Life Quality ROI
 * Formula: Sum of (expectedImprovement × aspectImportance) / price
 * Higher is better
 * @param item Wish item
 * @returns ROI score (0-100 scale)
 */
export function calculateLifeQualityROI(item: WishItem): number {
  if (item.estimatedPrice === 0) return 0;

  let totalImpact = 0;
  let aspectCount = 0;

  item.lifeAspects.forEach(aspect => {
    const improvement = item.expectedImprovement[aspect] || 0;
    const importance = item.aspectImportance[aspect] || 0;
    totalImpact += improvement * importance;
    aspectCount++;
  });

  if (aspectCount === 0) return 0;

  // Normalize to 0-100 scale (assuming max improvement * importance = 100 per aspect)
  const maxPossibleImpact = aspectCount * 100; // 10 * 10
  const normalizedImpact = (totalImpact / maxPossibleImpact) * 100;

  // ROI: Quality improvement per 1000 TWD
  const roi = (normalizedImpact / item.estimatedPrice) * 1000;

  return Math.min(roi, 100); // Cap at 100 for display purposes
}

/**
 * Calculate asset impact percentage
 * @param itemPrice Price of the item
 * @param totalAssets Total value of current assets
 * @returns Percentage of total assets (0-100)
 */
export function calculateAssetImpact(itemPrice: number, totalAssets: number): number {
  if (totalAssets === 0) return 0;
  return (itemPrice / totalAssets) * 100;
}

/**
 * Calculate priority score for a wish item
 * Formula: (Want Frequency × 0.3) + (Life Quality ROI × 0.3) + (Is Need × 0.2) + (Affordability × 0.2)
 * @param item Wish item
 * @param totalAssets Total value of current assets
 * @returns Priority score (0-100)
 */
export function calculatePriorityScore(item: WishItem, totalAssets: number): number {
  // Want frequency (normalize to 0-10 scale, assuming max 10 wants per week)
  const frequency = calculateWantFrequency(item.wantHistory, 4);
  const frequencyScore = Math.min(frequency, 10) * 10; // 0-100

  // Life quality ROI (already 0-100)
  const roiScore = calculateLifeQualityROI(item);

  // Is need (0 or 100)
  const needScore = item.isNeed ? 100 : 0;

  // Affordability (inverse of asset impact, capped at 20%)
  const assetImpact = calculateAssetImpact(item.estimatedPrice, totalAssets);
  const affordabilityScore = assetImpact <= 20 ? 100 : Math.max(0, 100 - (assetImpact - 20) * 5);

  // Weighted sum
  const score = (frequencyScore * 0.3) + (roiScore * 0.3) + (needScore * 0.2) + (affordabilityScore * 0.2);

  return Math.round(score);
}

/**
 * Calculate average satisfaction for a purchased item
 * @param item Purchased item
 * @returns Average satisfaction rating (1-5)
 */
export function calculateAverageSatisfaction(item: PurchasedItem): number {
  if (item.satisfactionRatings.length === 0) return 0;

  const sum = item.satisfactionRatings.reduce((total, rating) => total + rating.rating, 0);
  return sum / item.satisfactionRatings.length;
}

/**
 * Generate wish list analytics
 * @param wishItems Array of wish items
 * @param purchasedItems Array of purchased items
 * @param totalAssets Total value of current assets
 * @returns Analytics object
 */
export function getWishListAnalytics(
  wishItems: WishItem[],
  purchasedItems: PurchasedItem[],
  totalAssets: number
): WishListAnalytics {
  // Active wish items only
  const activeWishItems = wishItems.filter(item => item.status === 'wishlist');

  // Total value
  const totalValue = activeWishItems.reduce((sum, item) => sum + item.estimatedPrice, 0);

  // Percentage of assets
  const percentageOfAssets = calculateAssetImpact(totalValue, totalAssets);

  // Need vs Want
  const needs = activeWishItems.filter(item => item.isNeed).length;
  const wants = activeWishItems.filter(item => !item.isNeed).length;

  // Top life aspects
  const aspectCounts: Partial<Record<LifeAspect, number>> = {};
  activeWishItems.forEach(item => {
    item.lifeAspects.forEach(aspect => {
      aspectCounts[aspect] = (aspectCounts[aspect] || 0) + 1;
    });
  });

  const topLifeAspects = Object.entries(aspectCounts)
    .map(([aspect, count]) => ({ aspect: aspect as LifeAspect, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Average satisfaction by category
  const categorySatisfaction: Record<string, { sum: number; count: number }> = {};
  purchasedItems.forEach(item => {
    const avgSat = calculateAverageSatisfaction(item);
    if (avgSat > 0) {
      if (!categorySatisfaction[item.category]) {
        categorySatisfaction[item.category] = { sum: 0, count: 0 };
      }
      categorySatisfaction[item.category].sum += avgSat;
      categorySatisfaction[item.category].count += 1;
    }
  });

  const averageSatisfactionByCategory: Record<string, number> = {};
  Object.entries(categorySatisfaction).forEach(([category, data]) => {
    averageSatisfactionByCategory[category] = data.sum / data.count;
  });

  // Most wanted items (by frequency and recency)
  const mostWantedItems = activeWishItems
    .map(item => ({
      item,
      frequency: calculateWantFrequency(item.wantHistory, 4),
      lastWantedDays: getDaysSinceLastWanted(item.wantHistory) || 999,
    }))
    .filter(data => data.frequency > 0)
    .sort((a, b) => {
      // Sort by frequency first, then by recency
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return a.lastWantedDays - b.lastWantedDays;
    })
    .slice(0, 10);

  // Priority distribution
  const priorityDistribution = {
    low: activeWishItems.filter(item => item.priority === 'low').length,
    medium: activeWishItems.filter(item => item.priority === 'medium').length,
    high: activeWishItems.filter(item => item.priority === 'high').length,
  };

  // Category distribution
  const categoryDistribution: Record<string, number> = {};
  activeWishItems.forEach(item => {
    categoryDistribution[item.category] = (categoryDistribution[item.category] || 0) + 1;
  });

  return {
    totalWishItems: activeWishItems.length,
    totalValue,
    percentageOfAssets,
    needVsWant: { needs, wants },
    topLifeAspects,
    averageSatisfactionByCategory,
    mostWantedItems,
    priorityDistribution,
    categoryDistribution,
  };
}

/**
 * Generate repurchase recommendations based on satisfaction
 * @param purchasedItems Array of purchased items
 * @returns Items recommended for repurchase
 */
export function generateRepurchaseRecommendations(purchasedItems: PurchasedItem[]): PurchasedItem[] {
  return purchasedItems
    .filter(item => item.type === 'daily_necessity')
    .filter(item => {
      const avgSat = calculateAverageSatisfaction(item);
      return avgSat >= 4; // 4+ star rating
    })
    .filter(item => item.wouldRepurchase !== false);
}

/**
 * Check if a wish item should be archived (older than specified years)
 * @param item Wish item
 * @param years Number of years for auto-archive
 * @returns True if should be archived
 */
export function shouldArchiveItem(item: WishItem, years: number): boolean {
  if (item.status !== 'rejected') return false;

  const dateAdded = new Date(item.dateAdded);
  const now = new Date();
  const yearsDiff = (now.getTime() - dateAdded.getTime()) / (1000 * 60 * 60 * 24 * 365);

  return yearsDiff >= years;
}

/**
 * Calculate total budget used this month
 * @param purchasedItems Array of purchased items
 * @returns Total spent this month
 */
export function calculateMonthlySpend(purchasedItems: PurchasedItem[]): number {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return purchasedItems
    .filter(item => {
      const purchaseDate = new Date(item.purchaseDate);
      return purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear;
    })
    .reduce((sum, item) => sum + item.actualPrice, 0);
}

/**
 * Get purchase recommendations based on priority and budget
 * @param wishItems Array of wish items
 * @param totalAssets Total value of current assets
 * @param monthlyBudget Monthly budget
 * @param currentSpend Current month spending
 * @returns Recommended items to purchase
 */
export function getPurchaseRecommendations(
  wishItems: WishItem[],
  totalAssets: number,
  monthlyBudget: number,
  currentSpend: number
): WishItem[] {
  const remainingBudget = monthlyBudget - currentSpend;
  if (remainingBudget <= 0) return [];

  const activeItems = wishItems.filter(item => item.status === 'wishlist');

  // Calculate priority scores
  const itemsWithScores = activeItems.map(item => ({
    item,
    score: calculatePriorityScore(item, totalAssets),
    roi: calculateLifeQualityROI(item),
  }));

  // Sort by priority score
  const sortedItems = itemsWithScores.sort((a, b) => b.score - a.score);

  // Select items that fit budget
  const recommended: WishItem[] = [];
  let budgetUsed = 0;

  for (const { item, score, roi } of sortedItems) {
    if (budgetUsed + item.estimatedPrice <= remainingBudget) {
      // Only recommend if score > 50 and ROI > 3
      if (score > 50 && roi > 3) {
        recommended.push(item);
        budgetUsed += item.estimatedPrice;
      }
    }
  }

  return recommended;
}

/**
 * Create a new want entry
 * @param intensity Intensity level (1-5)
 * @param notes Optional notes
 * @returns New want entry
 */
export function createWantEntry(intensity: 1 | 2 | 3 | 4 | 5, notes?: string): WantEntry {
  return {
    id: generateId(),
    date: new Date().toISOString(),
    intensity,
    notes,
  };
}

/**
 * Calculate spending by month for the past 12 months
 * @param purchasedItems Array of purchased items
 * @returns Array of monthly spending data
 */
export function calculateMonthlySpending(purchasedItems: PurchasedItem[]): Array<{
  month: string;
  year: number;
  totalSpent: number;
  itemCount: number;
  categoryBreakdown: Record<string, number>;
}> {
  const monthlyData: Record<string, {
    totalSpent: number;
    itemCount: number;
    categoryBreakdown: Record<string, number>;
  }> = {};

  const now = new Date();

  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = {
      totalSpent: 0,
      itemCount: 0,
      categoryBreakdown: {},
    };
  }

  // Aggregate purchased items
  purchasedItems.forEach(item => {
    const purchaseDate = new Date(item.purchaseDate);
    const key = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`;

    if (monthlyData[key]) {
      monthlyData[key].totalSpent += item.actualPrice;
      monthlyData[key].itemCount += 1;
      monthlyData[key].categoryBreakdown[item.category] =
        (monthlyData[key].categoryBreakdown[item.category] || 0) + item.actualPrice;
    }
  });

  // Convert to array
  return Object.entries(monthlyData).map(([key, data]) => {
    const [year, month] = key.split('-');
    return {
      month: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'short'
      }),
      year: parseInt(year),
      totalSpent: data.totalSpent,
      itemCount: data.itemCount,
      categoryBreakdown: data.categoryBreakdown,
    };
  });
}

/**
 * Calculate spending by year
 * @param purchasedItems Array of purchased items
 * @returns Array of yearly spending data
 */
export function calculateYearlySpending(purchasedItems: PurchasedItem[]): Array<{
  year: number;
  totalSpent: number;
  itemCount: number;
  averageItemPrice: number;
  categoryBreakdown: Record<string, number>;
  needVsWant: { needs: number; wants: number };
}> {
  const yearlyData: Record<number, {
    totalSpent: number;
    itemCount: number;
    categoryBreakdown: Record<string, number>;
    needCount: number;
    wantCount: number;
  }> = {};

  // Aggregate by year
  purchasedItems.forEach(item => {
    const purchaseDate = new Date(item.purchaseDate);
    const year = purchaseDate.getFullYear();

    if (!yearlyData[year]) {
      yearlyData[year] = {
        totalSpent: 0,
        itemCount: 0,
        categoryBreakdown: {},
        needCount: 0,
        wantCount: 0,
      };
    }

    yearlyData[year].totalSpent += item.actualPrice;
    yearlyData[year].itemCount += 1;
    yearlyData[year].categoryBreakdown[item.category] =
      (yearlyData[year].categoryBreakdown[item.category] || 0) + item.actualPrice;

    // Note: PurchasedItem doesn't have isNeed property
    // Consider using item.type === 'daily_necessity' as a proxy if needed
    // For now, we'll classify based on item type
    if (item.type === 'daily_necessity') {
      yearlyData[year].needCount += 1;
    } else {
      yearlyData[year].wantCount += 1;
    }
  });

  // Convert to array and sort by year descending
  return Object.entries(yearlyData)
    .map(([year, data]) => ({
      year: parseInt(year),
      totalSpent: data.totalSpent,
      itemCount: data.itemCount,
      averageItemPrice: data.itemCount > 0 ? data.totalSpent / data.itemCount : 0,
      categoryBreakdown: data.categoryBreakdown,
      needVsWant: {
        needs: data.needCount,
        wants: data.wantCount,
      },
    }))
    .sort((a, b) => b.year - a.year);
}
