import { WishItem, PurchasedItem, WantEntry, SatisfactionRating } from '@/types/wishlist';

// Helper to create mock wish items
export const createMockWishItem = (overrides?: Partial<WishItem>): WishItem => ({
  id: 'wish-1',
  name: 'Test Wish Item',
  category: 'Electronics',
  estimatedPrice: 10000,
  specifications: 'Test specifications',
  alternativeOptions: [],
  isNeed: false,
  lifeAspects: ['entertainment'],
  aspectImportance: { entertainment: 7 },
  currentSatisfaction: { entertainment: 5 },
  expectedImprovement: { entertainment: 8 },
  wantHistory: [],
  dateAdded: '2024-01-15T00:00:00.000Z',
  priority: 'medium',
  status: 'wishlist',
  ...overrides,
});

// Mock want entries
export const mockWantEntry1: WantEntry = {
  id: 'want-1',
  date: '2024-01-10T00:00:00.000Z',
  intensity: 3,
  notes: 'Saw it online',
};

export const mockWantEntry2: WantEntry = {
  id: 'want-2',
  date: '2024-01-12T00:00:00.000Z',
  intensity: 4,
  notes: 'Really want this',
};

export const mockWantEntry3: WantEntry = {
  id: 'want-3',
  date: '2024-01-14T00:00:00.000Z',
  intensity: 5,
  notes: 'Must have!',
};

// Sample wish items
export const mockWishItemNeed: WishItem = {
  id: 'wish-need-1',
  name: 'New Laptop',
  category: 'Electronics',
  estimatedPrice: 35000,
  specifications: '16GB RAM, 512GB SSD, i7 processor',
  alternativeOptions: [
    {
      name: 'Budget Laptop',
      price: 25000,
      pros: 'Cheaper, still functional',
      cons: 'Lower specs',
    },
  ],
  isNeed: true,
  lifeAspects: ['work_efficiency', 'education'],
  aspectImportance: {
    work_efficiency: 9,
    education: 7,
  },
  currentSatisfaction: {
    work_efficiency: 4,
    education: 5,
  },
  expectedImprovement: {
    work_efficiency: 9,
    education: 8,
  },
  wantHistory: [mockWantEntry1, mockWantEntry2, mockWantEntry3],
  dateAdded: '2024-01-01T00:00:00.000Z',
  priority: 'high',
  status: 'wishlist',
  notes: 'Current laptop is too slow',
  links: ['https://example.com/laptop'],
};

export const mockWishItemWant: WishItem = {
  id: 'wish-want-1',
  name: 'Gaming Console',
  category: 'Gaming',
  estimatedPrice: 15000,
  specifications: 'Latest generation console',
  alternativeOptions: [],
  isNeed: false,
  lifeAspects: ['entertainment', 'social'],
  aspectImportance: {
    entertainment: 8,
    social: 6,
  },
  currentSatisfaction: {
    entertainment: 6,
    social: 5,
  },
  expectedImprovement: {
    entertainment: 9,
    social: 7,
  },
  wantHistory: [mockWantEntry1],
  dateAdded: '2024-01-05T00:00:00.000Z',
  priority: 'low',
  status: 'wishlist',
};

export const mockWishItemExercise: WishItem = {
  id: 'wish-exercise-1',
  name: 'Treadmill',
  category: 'Exercise Equipment',
  estimatedPrice: 25000,
  specifications: 'Foldable, max speed 12km/h',
  alternativeOptions: [],
  isNeed: false,
  lifeAspects: ['exercise', 'health'],
  aspectImportance: {
    exercise: 9,
    health: 8,
  },
  currentSatisfaction: {
    exercise: 3,
    health: 4,
  },
  expectedImprovement: {
    exercise: 8,
    health: 7,
  },
  wantHistory: [mockWantEntry1, mockWantEntry2],
  dateAdded: '2024-01-08T00:00:00.000Z',
  priority: 'medium',
  status: 'wishlist',
};

export const mockWishItemAppliance: WishItem = {
  id: 'wish-appliance-1',
  name: 'Air Purifier',
  category: 'Home Appliances',
  estimatedPrice: 8000,
  specifications: 'HEPA filter, covers 30 sqm',
  alternativeOptions: [],
  isNeed: true,
  lifeAspects: ['health', 'home_appliances', 'comfort'],
  aspectImportance: {
    health: 8,
    home_appliances: 7,
    comfort: 6,
  },
  currentSatisfaction: {
    health: 4,
    home_appliances: 5,
    comfort: 5,
  },
  expectedImprovement: {
    health: 8,
    home_appliances: 8,
    comfort: 7,
  },
  wantHistory: [],
  dateAdded: '2024-01-12T00:00:00.000Z',
  priority: 'medium',
  status: 'wishlist',
};

export const mockWishItemPurchased: WishItem = {
  id: 'wish-purchased-1',
  name: 'Wireless Headphones',
  category: 'Audio',
  estimatedPrice: 5000,
  specifications: 'Noise cancelling, 30h battery',
  alternativeOptions: [],
  isNeed: false,
  lifeAspects: ['entertainment', 'work_efficiency'],
  aspectImportance: {
    entertainment: 7,
    work_efficiency: 6,
  },
  currentSatisfaction: {
    entertainment: 5,
    work_efficiency: 5,
  },
  expectedImprovement: {
    entertainment: 8,
    work_efficiency: 7,
  },
  wantHistory: [mockWantEntry1, mockWantEntry2],
  dateAdded: '2023-12-20T00:00:00.000Z',
  priority: 'medium',
  status: 'purchased',
  purchaseDate: '2024-01-10T00:00:00.000Z',
};

export const mockWishItemRejected: WishItem = {
  id: 'wish-rejected-1',
  name: 'Expensive Watch',
  category: 'Accessories',
  estimatedPrice: 50000,
  specifications: 'Luxury brand',
  alternativeOptions: [],
  isNeed: false,
  lifeAspects: ['appearance'],
  aspectImportance: {
    appearance: 5,
  },
  currentSatisfaction: {
    appearance: 6,
  },
  expectedImprovement: {
    appearance: 7,
  },
  wantHistory: [mockWantEntry1],
  dateAdded: '2018-01-01T00:00:00.000Z',
  priority: 'low',
  status: 'rejected',
};

// Mock satisfaction ratings
export const mockSatisfactionRating1: SatisfactionRating = {
  date: '2024-01-11T00:00:00.000Z',
  rating: 5,
  notes: 'Excellent purchase',
};

export const mockSatisfactionRating2: SatisfactionRating = {
  date: '2024-01-15T00:00:00.000Z',
  rating: 4,
  notes: 'Still happy with it',
};

// Sample purchased items
export const mockPurchasedItemDaily: PurchasedItem = {
  id: 'purchased-daily-1',
  name: 'Coffee Beans',
  originalWishItemId: undefined,
  actualPrice: 500,
  purchaseDate: '2024-01-10T00:00:00.000Z',
  store: 'Coffee Shop',
  category: 'Food & Beverage',
  type: 'daily_necessity',
  satisfactionRatings: [
    {
      date: '2024-01-11T00:00:00.000Z',
      rating: 5,
      notes: 'Great flavor',
    },
    {
      date: '2024-01-14T00:00:00.000Z',
      rating: 5,
      notes: 'Will buy again',
    },
  ],
  wouldRepurchase: true,
  repurchaseNotes: 'My favorite coffee',
  lifeAspects: ['comfort', 'health'],
  actualImprovement: {
    comfort: 8,
    health: 6,
  },
  dateAdded: '2024-01-10T00:00:00.000Z',
};

export const mockPurchasedItemOneTime: PurchasedItem = {
  id: 'purchased-onetime-1',
  name: 'Wireless Headphones',
  originalWishItemId: 'wish-purchased-1',
  actualPrice: 4800,
  purchaseDate: '2024-01-10T00:00:00.000Z',
  store: 'Electronics Store',
  category: 'Audio',
  type: 'one_time_purchase',
  satisfactionRatings: [mockSatisfactionRating1, mockSatisfactionRating2],
  wouldRepurchase: true,
  lifeAspects: ['entertainment', 'work_efficiency'],
  actualImprovement: {
    entertainment: 8,
    work_efficiency: 7,
  },
  dateAdded: '2024-01-10T00:00:00.000Z',
  notes: 'Great sound quality',
};

export const mockPurchasedItemLowSatisfaction: PurchasedItem = {
  id: 'purchased-low-1',
  name: 'Cheap Keyboard',
  originalWishItemId: undefined,
  actualPrice: 800,
  purchaseDate: '2024-01-05T00:00:00.000Z',
  category: 'Accessories',
  type: 'one_time_purchase',
  satisfactionRatings: [
    {
      date: '2024-01-06T00:00:00.000Z',
      rating: 2,
      notes: 'Keys feel cheap',
    },
  ],
  wouldRepurchase: false,
  repurchaseNotes: 'Would not buy again',
  lifeAspects: ['work_efficiency'],
  actualImprovement: {
    work_efficiency: 3,
  },
  dateAdded: '2024-01-05T00:00:00.000Z',
};

// Collection of wish items
export const mockWishItems: WishItem[] = [
  mockWishItemNeed,
  mockWishItemWant,
  mockWishItemExercise,
  mockWishItemAppliance,
  mockWishItemPurchased,
  mockWishItemRejected,
];

// Collection of purchased items
export const mockPurchasedItems: PurchasedItem[] = [
  mockPurchasedItemDaily,
  mockPurchasedItemOneTime,
  mockPurchasedItemLowSatisfaction,
];

// Helper to create a wish item with specific want frequency
export function createWishItemWithWantHistory(
  baseItem: Partial<WishItem>,
  wantCount: number,
  daysAgo: number = 30
): WishItem {
  const wantHistory: WantEntry[] = [];
  const now = new Date();

  for (let i = 0; i < wantCount; i++) {
    const daysOffset = Math.floor(Math.random() * daysAgo);
    const date = new Date(now.getTime() - daysOffset * 24 * 60 * 60 * 1000);
    wantHistory.push({
      id: `want-${i}`,
      date: date.toISOString(),
      intensity: (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
    });
  }

  return createMockWishItem({
    ...baseItem,
    wantHistory,
  });
}
