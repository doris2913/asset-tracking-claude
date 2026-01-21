'use client';

import { useState, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { useAssetData } from '@/hooks/useAssetData';
import { useI18n } from '@/i18n';
import { AppData, Asset, Snapshot } from '@/types';

// Migration function
function migrateOldDatabase(oldData: unknown): AppData | null {
  try {
    const data = oldData as {
      cashTWD?: Array<{ id: string; date: string; type: string; amount: number; note?: string }>;
      cashUSD?: Array<{ id: string; date: string; type: string; amount: number; note?: string }>;
      stockTWD?: Array<{ id: string; date: string; symbol: string; shares: number; currentValue: number; name: string; note?: string }>;
      stockUSD?: Array<{ id: string; date: string; symbol: string; shares: number; currentValueUSD: number; name: string; note?: string }>;
      snapshots?: Array<{
        id: string;
        date: string;
        cashTWD: number;
        stockTWD: number;
        cashUSD: number;
        stockUSD: number;
        usdToTwdRate: number;
        totalTWD: number;
      }>;
      exchangeRate?: { usdToTwd: number };
    };

    if (!data.snapshots || !data.exchangeRate) {
      return null;
    }

    const now = new Date().toISOString();
    const assets: Asset[] = [];

    // Helper to parse date
    const parseDate = (dateStr: string): string => {
      const [year, month, day] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}`).toISOString();
    };

    // Get the latest entry for each unique key (type or symbol)
    const getLatestEntriesByKey = <T extends { date: string }>(
      entries: T[],
      getKey: (entry: T) => string
    ): T[] => {
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
    };

    // Migrate cash TWD - get latest entry for each account type
    if (data.cashTWD && data.cashTWD.length > 0) {
      const latestEntries = getLatestEntriesByKey(data.cashTWD, c => c.type);
      for (const cash of latestEntries) {
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
    }

    // Migrate cash USD - get latest entry for each account type
    if (data.cashUSD && data.cashUSD.length > 0) {
      const latestEntries = getLatestEntriesByKey(data.cashUSD, c => c.type);
      for (const cash of latestEntries) {
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
    }

    // Migrate TW stocks - get latest entry for each symbol
    if (data.stockTWD && data.stockTWD.length > 0) {
      const latestEntries = getLatestEntriesByKey(data.stockTWD, s => s.symbol);
      for (const stock of latestEntries) {
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
    }

    // Migrate US stocks - get latest entry for each symbol
    if (data.stockUSD && data.stockUSD.length > 0) {
      const latestEntries = getLatestEntriesByKey(data.stockUSD, s => s.symbol);
      for (const stock of latestEntries) {
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
    }

    // Migrate snapshots
    const snapshots: Snapshot[] = data.snapshots.map((oldSnapshot) => {
      const snapshotDate = parseDate(oldSnapshot.date);
      const snapshotAssets: Asset[] = [];
      const snapshotDateStr = oldSnapshot.date;

      // Get cash TWD entries for this date
      const cashTWDEntries = data.cashTWD?.filter(c => c.date === snapshotDateStr) || [];
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
        snapshotAssets.push({
          id: `snap_cash_twd_${oldSnapshot.id}`,
          name: 'Cash TWD',
          type: 'cash_twd',
          value: oldSnapshot.cashTWD,
          currency: 'TWD',
          lastUpdated: snapshotDate,
        });
      }

      // Get cash USD entries for this date
      const cashUSDEntries = data.cashUSD?.filter(c => c.date === snapshotDateStr) || [];
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
          name: 'Cash USD',
          type: 'cash_usd',
          value: oldSnapshot.cashUSD,
          currency: 'USD',
          lastUpdated: snapshotDate,
        });
      }

      // Get stock TW entries for this date
      const stockTWEntries = data.stockTWD?.filter(s => s.date === snapshotDateStr) || [];
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
          name: 'TW Stocks',
          type: 'stock_tw',
          value: oldSnapshot.stockTWD,
          currency: 'TWD',
          lastUpdated: snapshotDate,
        });
      }

      // Get stock USD entries for this date
      const stockUSEntries = data.stockUSD?.filter(s => s.date === snapshotDateStr) || [];
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
          name: 'US Stocks',
          type: 'stock_us',
          value: oldSnapshot.stockUSD,
          currency: 'USD',
          lastUpdated: snapshotDate,
        });
      }

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

    return {
      currentAssets: {
        assets,
        lastModified: now,
        exchangeRate: data.exchangeRate.usdToTwd,
      },
      snapshots,
      settings: {
        snapshotIntervalDays: 30,
        defaultCurrency: 'TWD',
        exchangeRate: data.exchangeRate.usdToTwd,
      },
      stockPrices: {},
      version: '1.0.0',
    };
  } catch (error) {
    console.error('Migration error:', error);
    return null;
  }
}

export default function MigratePage() {
  const { importData } = useAssetData();
  const { t, language } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<AppData | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const oldData = JSON.parse(text);
      const migratedData = migrateOldDatabase(oldData);

      if (migratedData) {
        setPreview(migratedData);
        setStatus('idle');
        setMessage('');
      } else {
        setStatus('error');
        setMessage(language === 'zh-TW' ? '無法辨識舊資料格式' : 'Could not recognize old data format');
      }
    } catch (error) {
      setStatus('error');
      setMessage(language === 'zh-TW' ? '讀取檔案失敗' : 'Failed to read file');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    if (!preview) return;

    const success = importData(JSON.stringify(preview));
    if (success) {
      setStatus('success');
      setMessage(language === 'zh-TW' ? '資料匯入成功！' : 'Data imported successfully!');
      setPreview(null);
    } else {
      setStatus('error');
      setMessage(language === 'zh-TW' ? '匯入失敗' : 'Import failed');
    }
  };

  const labels = {
    title: language === 'zh-TW' ? '資料遷移' : 'Data Migration',
    subtitle: language === 'zh-TW' ? '從舊版 database.json 遷移資料' : 'Migrate data from old database.json format',
    selectFile: language === 'zh-TW' ? '選擇舊版 database.json 檔案' : 'Select old database.json file',
    preview: language === 'zh-TW' ? '預覽' : 'Preview',
    assets: language === 'zh-TW' ? '資產' : 'Assets',
    snapshots: language === 'zh-TW' ? '快照' : 'Snapshots',
    confirmImport: language === 'zh-TW' ? '確認匯入' : 'Confirm Import',
    cancel: language === 'zh-TW' ? '取消' : 'Cancel',
    warning: language === 'zh-TW'
      ? '警告：這將會覆蓋您目前的所有資料。請確認您已備份現有資料。'
      : 'Warning: This will overwrite all your current data. Please make sure you have backed up your existing data.',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{labels.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{labels.subtitle}</p>
        </div>

        <div className="card mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {labels.selectFile}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-blue-900/30 dark:file:text-blue-400"
              />
            </div>

            {status !== 'idle' && (
              <div
                className={`p-3 rounded-lg ${
                  status === 'success'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </div>

        {preview && (
          <>
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {labels.preview}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{labels.assets}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {preview.currentAssets.assets.length}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{labels.snapshots}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {preview.snapshots.length}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {labels.assets}:
                </h3>
                <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  {preview.currentAssets.assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">{asset.name}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {asset.currency === 'TWD' ? 'NT$' : '$'}
                        {asset.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{labels.warning}</p>
              </div>

              <div className="flex space-x-3">
                <button onClick={handleImport} className="btn btn-primary">
                  {labels.confirmImport}
                </button>
                <button onClick={() => setPreview(null)} className="btn btn-secondary">
                  {labels.cancel}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
