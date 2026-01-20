import { Asset, Snapshot, AssetSummary, ChartDataPoint, Currency, AssetType, ASSET_TYPE_CONFIG } from '@/types';

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Convert asset value to TWD
export function toTWD(value: number, currency: Currency, exchangeRate: number): number {
  return currency === 'TWD' ? value : value * exchangeRate;
}

// Convert asset value to USD
export function toUSD(value: number, currency: Currency, exchangeRate: number): number {
  return currency === 'USD' ? value : value / exchangeRate;
}

// Calculate total value of assets in TWD
export function calculateTotalTWD(assets: Asset[], exchangeRate: number): number {
  return assets.reduce((total, asset) => {
    return total + toTWD(asset.value, asset.currency, exchangeRate);
  }, 0);
}

// Calculate total value of assets in USD
export function calculateTotalUSD(assets: Asset[], exchangeRate: number): number {
  return assets.reduce((total, asset) => {
    return total + toUSD(asset.value, asset.currency, exchangeRate);
  }, 0);
}

// Get asset summary by type
export function getAssetSummary(assets: Asset[], exchangeRate: number): AssetSummary[] {
  const totalTWD = calculateTotalTWD(assets, exchangeRate);
  const summaryMap: Map<AssetType, AssetSummary> = new Map();

  // Initialize all types
  Object.keys(ASSET_TYPE_CONFIG).forEach((type) => {
    summaryMap.set(type as AssetType, {
      type: type as AssetType,
      totalTWD: 0,
      totalUSD: 0,
      count: 0,
      percentage: 0,
    });
  });

  // Calculate totals per type
  assets.forEach((asset) => {
    const summary = summaryMap.get(asset.type)!;
    const valueTWD = toTWD(asset.value, asset.currency, exchangeRate);
    const valueUSD = toUSD(asset.value, asset.currency, exchangeRate);
    summary.totalTWD += valueTWD;
    summary.totalUSD += valueUSD;
    summary.count += 1;
  });

  // Calculate percentages
  summaryMap.forEach((summary) => {
    summary.percentage = totalTWD > 0 ? (summary.totalTWD / totalTWD) * 100 : 0;
  });

  return Array.from(summaryMap.values()).filter((s) => s.count > 0);
}

// Calculate simple moving average
export function calculateMovingAverage(
  data: ChartDataPoint[],
  windowSize: number
): ChartDataPoint[] {
  if (data.length < windowSize) {
    return data.map((point) => ({ ...point }));
  }

  return data.map((point, index) => {
    if (index < windowSize - 1) {
      // Not enough data points yet, use available average
      const slice = data.slice(0, index + 1);
      const avg = slice.reduce((sum, p) => sum + p.value, 0) / slice.length;
      return { ...point, value: avg };
    }
    const slice = data.slice(index - windowSize + 1, index + 1);
    const avg = slice.reduce((sum, p) => sum + p.value, 0) / windowSize;
    return { ...point, value: avg };
  });
}

// Convert snapshots to chart data points
export function snapshotsToChartData(snapshots: Snapshot[], currency: Currency = 'TWD'): ChartDataPoint[] {
  return snapshots
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((snapshot) => ({
      date: snapshot.date,
      value: currency === 'TWD' ? snapshot.totalValueTWD : snapshot.totalValueUSD,
      label: formatDate(snapshot.date),
    }));
}

// Format date for display
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}

// Format currency
export function formatCurrency(value: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat(currency === 'TWD' ? 'zh-TW' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
}

// Format number with commas
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Calculate growth rate between two values
export function calculateGrowthRate(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// Calculate months between two dates
export function monthsBetween(startDate: Date, endDate: Date): number {
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
  return months + endDate.getMonth() - startDate.getMonth();
}

// Check if snapshot is needed (more than N days since last snapshot)
export function isSnapshotNeeded(lastSnapshotDate: string | null, intervalDays: number): boolean {
  if (!lastSnapshotDate) return true;

  const last = new Date(lastSnapshotDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= intervalDays;
}

// Get the latest snapshot date
export function getLatestSnapshotDate(snapshots: Snapshot[]): string | null {
  if (snapshots.length === 0) return null;

  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return sorted[0].date;
}

// Create a new snapshot from current assets
export function createSnapshot(
  assets: Asset[],
  exchangeRate: number,
  notes?: string
): Snapshot {
  const now = new Date();
  return {
    id: generateId(),
    date: now.toISOString().split('T')[0],
    assets: JSON.parse(JSON.stringify(assets)), // Deep clone
    totalValueTWD: calculateTotalTWD(assets, exchangeRate),
    totalValueUSD: calculateTotalUSD(assets, exchangeRate),
    exchangeRate,
    notes,
  };
}

// Parse stock symbol to determine if it's TW or US
export function parseStockSymbol(symbol: string): { isTW: boolean; cleanSymbol: string } {
  const twSuffixes = ['.TW', '.TWO'];
  const upperSymbol = symbol.toUpperCase();

  for (const suffix of twSuffixes) {
    if (upperSymbol.endsWith(suffix)) {
      return { isTW: true, cleanSymbol: symbol };
    }
  }

  // Check if it looks like a Taiwan stock code (4-6 digits)
  if (/^\d{4,6}$/.test(symbol)) {
    return { isTW: true, cleanSymbol: `${symbol}.TW` };
  }

  return { isTW: false, cleanSymbol: symbol };
}
