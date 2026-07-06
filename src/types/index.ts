// Asset types supported by the application
export type AssetType =
  | 'cash_twd'      // Cash in TWD
  | 'cash_usd'      // Cash in USD
  | 'stock_tw'      // Taiwan stocks
  | 'stock_us'      // US stocks
  | 'liability'     // Liabilities (rent, loans, etc.)
  | 'us_tbills'     // US Treasury Bills
  | 'fund_tw'       // Taiwan-domiciled funds
  | 'fund_us';      // Offshore/foreign funds

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
  expectedReturn?: number;   // Expected annual return rate in percentage (e.g., 7 for 7%)
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
  stockSplitEvents: StockSplitEvent[];      // Stock split history log
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

// Stock split event record
export interface StockSplitEvent {
  id: string;
  symbol: string;             // Stock symbol (e.g., "AAPL", "2330.TW")
  assetName: string;          // Asset name at the time of split
  date: string;               // ISO date string (YYYY-MM-DD) when split was applied
  ratio: number;              // Split ratio (e.g., 4 means 4-for-1 split; 0.5 means 1-for-2 reverse split)
  sharesBefore: number;       // Shares before split
  sharesAfter: number;        // Shares after split
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
  fund_tw: { label: 'TW Funds', color: '#0ea5e9', icon: '🏦' },
  fund_us: { label: 'Global Funds', color: '#a855f7', icon: '💹' },
};

// All asset types, derived from ASSET_TYPE_CONFIG (single source of truth)
export const ALL_ASSET_TYPES: AssetType[] = Object.keys(ASSET_TYPE_CONFIG) as AssetType[];

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
  stockSplitEvents: [],
  version: '1.0.0',
};
