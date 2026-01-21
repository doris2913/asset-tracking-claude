/**
 * Migration script to convert database.json to the web app's import format (AppData)
 *
 * Usage: Run this script with ts-node or copy to browser console
 * The output can be imported via Settings > Import Data
 */

import { AppData, Asset, Snapshot, AssetType, Currency } from '@/types';

// Old database.json structure
interface OldCashEntry {
  id: string;
  date: string;
  type: string;
  amount: number;
  note: string;
}

interface OldStockTWEntry {
  id: string;
  date: string;
  symbol: string;
  shares: number;
  costBasis: number;
  currentValue: number;
  name: string;
  note: string;
}

interface OldStockUSDEntry {
  id: string;
  date: string;
  symbol: string;
  shares: number;
  costBasisUSD: number;
  currentValueUSD: number;
  name: string;
  note: string;
}

interface OldSnapshot {
  id: string;
  date: string;
  cashTWD: number;
  stockTWD: number;
  cashUSD: number;
  stockUSD: number;
  usdToTwdRate: number;
  totalTWD: number;
  rent: number;
  netAssetTWD: number;
}

interface OldDatabase {
  cashTWD: OldCashEntry[];
  cashUSD: OldCashEntry[];
  stockTWD: OldStockTWEntry[];
  stockUSD: OldStockUSDEntry[];
  rent: unknown[];
  snapshots: OldSnapshot[];
  stockPrices: unknown[];
  exchangeRate: {
    usdToTwd: number;
    lastUpdated: string;
  };
}

// Parse date format: "YYYY/MM/DD" to ISO date
function parseDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('/');
  return new Date(`${year}-${month}-${day}`).toISOString();
}

// Get the latest entry for each unique key (type or symbol)
function getLatestEntriesByKey<T extends { date: string }>(
  entries: T[],
  getKey: (entry: T) => string
): T[] {
  const latestByKey = new Map<string, T>();

  for (const entry of entries) {
    const key = getKey(entry);
    const existing = latestByKey.get(key);

    if (!existing) {
      latestByKey.set(key, entry);
    } else {
      const entryDate = new Date(entry.date.replace(/\//g, '-'));
      const existingDate = new Date(existing.date.replace(/\//g, '-'));
      if (entryDate > existingDate) {
        latestByKey.set(key, entry);
      }
    }
  }

  return Array.from(latestByKey.values());
}

// Convert old data to new AppData format
export function migrateDatabase(oldData: OldDatabase): AppData {
  const now = new Date().toISOString();
  const assets: Asset[] = [];

  // Migrate cash TWD - get latest entry for each account type
  const latestCashTWD = getLatestEntriesByKey(oldData.cashTWD, c => c.type);
  for (const cash of latestCashTWD) {
    assets.push({
      id: `cash_twd_${cash.id}`,
      name: cash.type,
      type: 'cash_twd',
      value: cash.amount,
      currency: 'TWD',
      notes: cash.note || undefined,
      lastUpdated: parseDate(cash.date),
    });
  }

  // Migrate cash USD - get latest entry for each account type
  const latestCashUSD = getLatestEntriesByKey(oldData.cashUSD, c => c.type);
  for (const cash of latestCashUSD) {
    assets.push({
      id: `cash_usd_${cash.id}`,
      name: cash.type,
      type: 'cash_usd',
      value: cash.amount,
      currency: 'USD',
      notes: cash.note || undefined,
      lastUpdated: parseDate(cash.date),
    });
  }

  // Migrate TW stocks - get latest entry for each symbol
  const latestStockTW = getLatestEntriesByKey(oldData.stockTWD, s => s.symbol);
  for (const stock of latestStockTW) {
    if (stock.shares > 0) {
      assets.push({
        id: `stock_tw_${stock.id}`,
        name: stock.name,
        type: 'stock_tw',
        value: stock.currentValue,
        currency: 'TWD',
        symbol: stock.symbol,
        shares: stock.shares,
        notes: stock.note || undefined,
        lastUpdated: parseDate(stock.date),
      });
    }
  }

  // Migrate US stocks - get latest entry for each symbol
  const latestStockUS = getLatestEntriesByKey(oldData.stockUSD, s => s.symbol);
  for (const stock of latestStockUS) {
    assets.push({
      id: `stock_us_${stock.id}`,
      name: stock.name,
      type: 'stock_us',
      value: stock.currentValueUSD,
      currency: 'USD',
      symbol: stock.symbol,
      shares: stock.shares,
      notes: stock.note || undefined,
      lastUpdated: parseDate(stock.date),
    });
  }

  // Migrate snapshots
  // Old snapshots only have aggregated totals, so we'll create synthetic assets for each snapshot
  const snapshots: Snapshot[] = oldData.snapshots.map((oldSnapshot) => {
    const snapshotAssets: Asset[] = [];
    const snapshotDate = parseDate(oldSnapshot.date);

    // Find assets at this snapshot date or create aggregated ones
    const snapshotDateStr = oldSnapshot.date;

    // Get cash TWD entries for this date
    const cashTWDEntries = oldData.cashTWD.filter(c => c.date === snapshotDateStr);
    if (cashTWDEntries.length > 0) {
      for (const cash of cashTWDEntries) {
        snapshotAssets.push({
          id: `snap_cash_twd_${cash.id}`,
          name: cash.type,
          type: 'cash_twd',
          value: cash.amount,
          currency: 'TWD',
          lastUpdated: snapshotDate,
        });
      }
    } else if (oldSnapshot.cashTWD > 0) {
      // Fallback: create aggregated entry if no detailed data
      snapshotAssets.push({
        id: `snap_cash_twd_${oldSnapshot.id}`,
        name: 'Cash TWD (aggregated)',
        type: 'cash_twd',
        value: oldSnapshot.cashTWD,
        currency: 'TWD',
        lastUpdated: snapshotDate,
      });
    }

    // Get cash USD entries for this date
    const cashUSDEntries = oldData.cashUSD.filter(c => c.date === snapshotDateStr);
    if (cashUSDEntries.length > 0) {
      for (const cash of cashUSDEntries) {
        snapshotAssets.push({
          id: `snap_cash_usd_${cash.id}`,
          name: cash.type,
          type: 'cash_usd',
          value: cash.amount,
          currency: 'USD',
          lastUpdated: snapshotDate,
        });
      }
    } else if (oldSnapshot.cashUSD > 0) {
      snapshotAssets.push({
        id: `snap_cash_usd_${oldSnapshot.id}`,
        name: 'Cash USD (aggregated)',
        type: 'cash_usd',
        value: oldSnapshot.cashUSD,
        currency: 'USD',
        lastUpdated: snapshotDate,
      });
    }

    // Get stock TW entries for this date
    const stockTWEntries = oldData.stockTWD.filter(s => s.date === snapshotDateStr);
    if (stockTWEntries.length > 0) {
      for (const stock of stockTWEntries) {
        if (stock.shares > 0) {
          snapshotAssets.push({
            id: `snap_stock_tw_${stock.id}`,
            name: stock.name,
            type: 'stock_tw',
            value: stock.currentValue,
            currency: 'TWD',
            symbol: stock.symbol,
            shares: stock.shares,
            lastUpdated: snapshotDate,
          });
        }
      }
    } else if (oldSnapshot.stockTWD > 0) {
      snapshotAssets.push({
        id: `snap_stock_tw_${oldSnapshot.id}`,
        name: 'TW Stocks (aggregated)',
        type: 'stock_tw',
        value: oldSnapshot.stockTWD,
        currency: 'TWD',
        lastUpdated: snapshotDate,
      });
    }

    // Get stock USD entries for this date
    const stockUSEntries = oldData.stockUSD.filter(s => s.date === snapshotDateStr);
    if (stockUSEntries.length > 0) {
      for (const stock of stockUSEntries) {
        snapshotAssets.push({
          id: `snap_stock_us_${stock.id}`,
          name: stock.name,
          type: 'stock_us',
          value: stock.currentValueUSD,
          currency: 'USD',
          symbol: stock.symbol,
          shares: stock.shares,
          lastUpdated: snapshotDate,
        });
      }
    } else if (oldSnapshot.stockUSD > 0) {
      snapshotAssets.push({
        id: `snap_stock_us_${oldSnapshot.id}`,
        name: 'US Stocks (aggregated)',
        type: 'stock_us',
        value: oldSnapshot.stockUSD,
        currency: 'USD',
        lastUpdated: snapshotDate,
      });
    }

    // Calculate totals
    const totalValueTWD = oldSnapshot.totalTWD;
    const totalValueUSD = totalValueTWD / oldSnapshot.usdToTwdRate;

    return {
      id: oldSnapshot.id,
      date: snapshotDate,
      assets: snapshotAssets,
      totalValueTWD,
      totalValueUSD,
      exchangeRate: oldSnapshot.usdToTwdRate,
    };
  });

  // Create the new AppData
  const appData: AppData = {
    currentAssets: {
      assets,
      lastModified: now,
      exchangeRate: oldData.exchangeRate.usdToTwd,
    },
    snapshots,
    settings: {
      snapshotIntervalDays: 30,
      defaultCurrency: 'TWD',
      exchangeRate: oldData.exchangeRate.usdToTwd,
    },
    stockPrices: {},
    version: '1.0.0',
  };

  return appData;
}

// Browser/Node-compatible execution
export function runMigration(jsonData: string): string {
  const oldData = JSON.parse(jsonData) as OldDatabase;
  const newData = migrateDatabase(oldData);
  return JSON.stringify(newData, null, 2);
}
