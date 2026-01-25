// Life aspect categories
export type LifeAspect =
  | 'exercise'          // 運動
  | 'entertainment'     // 娛樂
  | 'social'           // 社交
  | 'work_efficiency'  // 工作效率
  | 'health'           // 健康
  | 'education'        // 學習
  | 'comfort'          // 舒適度
  | 'appearance'       // 外觀
  | 'home_appliances'; // 家電

export const LIFE_ASPECT_CONFIG: Record<LifeAspect, { label: string; labelZh: string; icon: string; color: string }> = {
  exercise: { label: 'Exercise', labelZh: '運動', icon: '🏃', color: '#22c55e' },
  entertainment: { label: 'Entertainment', labelZh: '娛樂', icon: '🎮', color: '#8b5cf6' },
  social: { label: 'Social', labelZh: '社交', icon: '👥', color: '#ec4899' },
  work_efficiency: { label: 'Work Efficiency', labelZh: '工作效率', icon: '💼', color: '#3b82f6' },
  health: { label: 'Health', labelZh: '健康', icon: '❤️', color: '#ef4444' },
  education: { label: 'Education', labelZh: '學習', icon: '📚', color: '#f59e0b' },
  comfort: { label: 'Comfort', labelZh: '舒適度', icon: '🛋️', color: '#06b6d4' },
  appearance: { label: 'Appearance', labelZh: '外觀', icon: '✨', color: '#a855f7' },
  home_appliances: { label: 'Home Appliances', labelZh: '家電', icon: '🏠', color: '#10b981' },
};

// Predefined categories with Chinese labels
export const CATEGORY_OPTIONS = [
  { value: '3C產品', label: '3C產品', icon: '💻' },
  { value: '家電', label: '家電', icon: '🏠' },
  { value: '家具', label: '家具', icon: '🛋️' },
  { value: '服飾', label: '服飾', icon: '👔' },
  { value: '運動用品', label: '運動用品', icon: '⚽' },
  { value: '遊戲', label: '遊戲', icon: '🎮' },
  { value: '書籍', label: '書籍', icon: '📚' },
  { value: '生活用品', label: '生活用品', icon: '🛒' },
  { value: '美妝保養', label: '美妝保養', icon: '💄' },
  { value: '食品', label: '食品', icon: '🍔' },
  { value: '旅遊', label: '旅遊', icon: '✈️' },
  { value: '訂閱服務', label: '訂閱服務', icon: '📱' },
  { value: '課程', label: '課程', icon: '🎓' },
  { value: '其他', label: '其他', icon: '📦' },
];

// Want frequency tracking entry
export interface WantEntry {
  id: string;
  date: string;           // ISO date string
  intensity: 1 | 2 | 3 | 4 | 5;  // 1=mild, 5=urgent
  notes?: string;
}

// Alternative option for comparison
export interface AlternativeOption {
  name: string;
  price: number;
  brand?: string;
  webLink?: string;
  pros: string;
  cons: string;
  customFields?: Record<string, string>; // For user-customizable comparison fields
}

// Wish list item
export interface WishItem {
  id: string;
  name: string;
  category: string;       // User-defined or predefined categories

  // Purchase details
  estimatedPrice: number;
  specifications?: string;
  alternativeOptions?: AlternativeOption[];

  // Analysis
  isNeed: boolean;        // Want vs Need
  lifeAspects: LifeAspect[];  // Can affect multiple aspects
  aspectImportance: Partial<Record<LifeAspect, number>>; // 1-10 scale
  currentSatisfaction: Partial<Record<LifeAspect, number>>; // 1-10 scale
  expectedImprovement: Partial<Record<LifeAspect, number>>; // 1-10 scale

  // Tracking
  wantHistory: WantEntry[];  // Track when/how often wanted

  // Metadata
  dateAdded: string;
  priority: 'low' | 'medium' | 'high';
  status: 'wishlist' | 'purchased' | 'rejected';
  purchaseDate?: string;
  notes?: string;
  imageUrl?: string;
  links?: string[];       // Product links, reviews, etc.
}

// Satisfaction rating entry
export interface SatisfactionRating {
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

// Purchased item tracking
export interface PurchasedItem {
  id: string;
  name: string;
  originalWishItemId?: string;  // Link to wish item if existed

  // Purchase info
  actualPrice: number;
  purchaseDate: string;
  store?: string;

  // Classification
  category: string;
  type: 'daily_necessity' | 'one_time_purchase';

  // Satisfaction tracking
  satisfactionRatings: SatisfactionRating[];

  // Repurchase
  wouldRepurchase: boolean | null;
  repurchaseNotes?: string;

  // ROI
  lifeAspects: LifeAspect[];
  actualImprovement: Partial<Record<LifeAspect, number>>; // 1-10 scale

  // Metadata
  dateAdded: string;
  notes?: string;
  imageUrl?: string;
}

// Wish list settings
export interface WishListSettings {
  // Budget settings
  budgetType: 'fixed' | 'percentage';  // Fixed amount or % of total assets
  monthlyBudget: number;  // Used when budgetType is 'fixed'
  budgetPercentage: number;  // Used when budgetType is 'percentage' (0-100)

  // Other settings
  defaultWantIntensity: 1 | 2 | 3 | 4 | 5;
  autoArchiveAfterYears: number;
  showAssetImpact: boolean;
}

// Analytics data
export interface WishListAnalytics {
  totalWishItems: number;
  totalValue: number;
  percentageOfAssets: number;
  needVsWant: { needs: number; wants: number };
  topLifeAspects: Array<{ aspect: LifeAspect; count: number }>;
  averageSatisfactionByCategory: Record<string, number>;
  mostWantedItems: Array<{ item: WishItem; frequency: number; lastWantedDays: number }>;
  priorityDistribution: { low: number; medium: number; high: number };
  categoryDistribution: Record<string, number>;
}

// Complete wish list data structure
export interface WishListData {
  wishItems: WishItem[];
  purchasedItems: PurchasedItem[];
  settings: WishListSettings;
  version: string;
}

// Default settings
export const DEFAULT_WISHLIST_SETTINGS: WishListSettings = {
  budgetType: 'fixed',
  monthlyBudget: 10000,
  budgetPercentage: 5,  // 5% of total assets
  defaultWantIntensity: 3,
  autoArchiveAfterYears: 6,
  showAssetImpact: true,
};

// Default wish list data
export const DEFAULT_WISHLIST_DATA: WishListData = {
  wishItems: [],
  purchasedItems: [],
  settings: DEFAULT_WISHLIST_SETTINGS,
  version: '1.0.0',
};
