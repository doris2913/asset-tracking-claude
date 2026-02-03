// Asset types supported by the application
export type AssetType =
  | 'cash_twd'      // Cash in TWD
  | 'cash_usd'      // Cash in USD
  | 'stock_tw'      // Taiwan stocks
  | 'stock_us'      // US stocks
  | 'liability'     // Liabilities (rent, loans, etc.)
  | 'us_tbills';    // US Treasury Bills

// Currency types
export type Currency = 'TWD' | 'USD';

// Individual asset entry
export interface Asset {
  id: string;
  name: string;              // e.g., "Bank A Savings", "AAPL", "0050.TW"
  type: AssetType;
  value: number;             // Current value in original currency
  currency: Currency;
  symbol?: string;           // Stock symbol for automatic price fetching (e.g., "AAPL", "0050.TW")
  shares?: number;           // Number of shares (for stocks)
  notes?: string;            // Optional notes
  lastUpdated: string;       // ISO date string
}

// Snapshot of all assets at a point in time
export interface Snapshot {
  id: string;
  date: string;              // ISO date string (YYYY-MM-DD)
  assets: Asset[];
  totalValueTWD: number;     // Total value converted to TWD
  totalValueUSD: number;     // Total value converted to USD
  exchangeRate: number;      // USD/TWD exchange rate at snapshot time
  notes?: string;
}

// Current/Latest assets state (working state)
export interface CurrentAssets {
  assets: Asset[];
  lastModified: string;      // ISO date string
  exchangeRate: number;      // Current USD/TWD exchange rate
}

// Stock price with moving averages and historical data
export interface StockPrice {
  symbol: string;
  currentPrice: number;
  movingAvg3M: number;
  movingAvg1Y: number;
  currency: Currency;
  lastUpdated: string;
  historicalPrices?: Record<string, number>;  // date string (YYYY-MM-DD) -> price
}

// Application data structure
export interface AppData {
  currentAssets: CurrentAssets;
  snapshots: Snapshot[];
  settings: AppSettings;
  stockPrices: Record<string, StockPrice>;  // Stock prices with MAs
  version: string;           // Data schema version for migrations
}

// Chart color theme type
export type ChartColorTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'monochrome';

// Stock price data source
export type StockDataSource = 'yahoo' | 'alphavantage' | 'finnhub' | 'fmp';

// Application settings
export interface AppSettings {
  snapshotIntervalDays: number;  // Default 30 (monthly)
  defaultCurrency: Currency;
  exchangeRate: number;          // Default USD/TWD rate
  targetAllocation?: Record<AssetType, number>;  // Target percentage for each asset type (0-100)
  chartColorTheme?: ChartColorTheme;  // Chart color theme (default: 'default')
  stockDataSource?: StockDataSource;  // Stock price data source (default: 'yahoo')
  alphaVantageApiKey?: string;  // Alpha Vantage API key (optional)
  finnhubApiKey?: string;  // Finnhub API key (optional)
  fmpApiKey?: string;  // Financial Modeling Prep API key (optional)
  customCorsProxy?: string;  // Custom CORS proxy URL (e.g., Cloudflare Worker)
  dropboxAppKey?: string;  // Dropbox App Key for Saver integration (optional)
}

// Stock quote from Yahoo Finance
export interface StockQuote {
  symbol: string;
  price: number;
  currency: Currency;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

// Chart data point
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// Asset summary by type
export interface AssetSummary {
  type: AssetType;
  totalTWD: number;
  totalUSD: number;
  count: number;
  percentage: number;
}

// Moving average types
export type MovingAverageType = '3M' | '1Y';

// Dashboard data
export interface DashboardData {
  currentTotal: ChartDataPoint[];
  movingAverage3M: ChartDataPoint[];
  movingAverage1Y: ChartDataPoint[];
  assetBreakdown: AssetSummary[];
  growthRate: {
    monthly: number;
    yearly: number;
  };
}

// Asset type display configuration
export const ASSET_TYPE_CONFIG: Record<AssetType, { label: string; color: string; icon: string }> = {
  cash_twd: { label: 'Cash (TWD)', color: '#22c55e', icon: '💵' },
  cash_usd: { label: 'Cash (USD)', color: '#16a34a', icon: '💲' },
  stock_tw: { label: 'TW Stocks', color: '#3b82f6', icon: '📈' },
  stock_us: { label: 'US Stocks', color: '#6366f1', icon: '📊' },
  liability: { label: 'Liability', color: '#ef4444', icon: '💳' },
  us_tbills: { label: 'US T-Bills', color: '#8b5cf6', icon: '🏛️' },
};

// Default exchange rate (can be updated)
export const DEFAULT_EXCHANGE_RATE = 31.5; // USD to TWD

// Default app data
export const DEFAULT_APP_DATA: AppData = {
  currentAssets: {
    assets: [],
    lastModified: new Date().toISOString(),
    exchangeRate: DEFAULT_EXCHANGE_RATE,
  },
  snapshots: [],
  settings: {
    snapshotIntervalDays: 30,
    defaultCurrency: 'TWD',
    exchangeRate: DEFAULT_EXCHANGE_RATE,
  },
  stockPrices: {},
  version: '1.0.0',
};
