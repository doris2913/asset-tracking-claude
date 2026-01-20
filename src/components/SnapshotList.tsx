'use client';

import { Snapshot, Currency } from '@/types';
import { formatCurrency, calculateGrowthRate } from '@/utils/calculations';
import { useI18n } from '@/i18n';

interface SnapshotListProps {
  snapshots: Snapshot[];
  currency: Currency;
  onDelete: (id: string) => void;
  onView: (snapshot: Snapshot) => void;
}

export default function SnapshotList({
  snapshots,
  currency,
  onDelete,
  onView,
}: SnapshotListProps) {
  const { t, language } = useI18n();

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-4xl mb-4">📸</p>
        <p>{t.snapshots.noSnapshots}</p>
      </div>
    );
  }

  // Sort snapshots by date (newest first)
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const dateLocale = language === 'zh-TW' ? 'zh-TW' : 'en-US';

  return (
    <div className="space-y-4">
      {sortedSnapshots.map((snapshot, index) => {
        const previousSnapshot = sortedSnapshots[index + 1];
        const currentValue =
          currency === 'TWD' ? snapshot.totalValueTWD : snapshot.totalValueUSD;
        const previousValue = previousSnapshot
          ? currency === 'TWD'
            ? previousSnapshot.totalValueTWD
            : previousSnapshot.totalValueUSD
          : null;
        const growthRate =
          previousValue !== null ? calculateGrowthRate(previousValue, currentValue) : null;

        return (
          <div
            key={snapshot.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(snapshot.date).toLocaleDateString(dateLocale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  {growthRate !== null && (
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        growthRate >= 0
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {growthRate >= 0 ? '+' : ''}
                      {growthRate.toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {snapshot.assets.length} {t.snapshots.assets} | {t.snapshots.rate}: {snapshot.exchangeRate.toFixed(2)} TWD/USD
                </p>
                {snapshot.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">
                    {snapshot.notes}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(currentValue, currency)}
                </p>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => onView(snapshot)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    {t.snapshots.viewDetails}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t.snapshots.confirmDelete)) {
                        onDelete(snapshot.id);
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
                  >
                    {t.common.delete}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
