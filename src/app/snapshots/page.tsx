'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import SnapshotList from '@/components/SnapshotList';
import Modal from '@/components/Modal';
import { useAssetData } from '@/hooks/useAssetData';
import { useI18n } from '@/i18n';
import { Snapshot, Currency, AssetType } from '@/types';
import { formatCurrency, isSnapshotNeeded, getLatestSnapshotDate } from '@/utils/calculations';

const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  cash_twd: '💵',
  cash_usd: '💲',
  stock_tw: '📈',
  stock_us: '📊',
  liability: '💳',
  us_tbills: '🏛️',
};

export default function SnapshotsPage() {
  const {
    currentAssets,
    snapshots,
    settings,
    createManualSnapshot,
    deleteSnapshot,
    isLoaded,
  } = useAssetData();

  const { t, language } = useI18n();

  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingSnapshot, setViewingSnapshot] = useState<Snapshot | null>(null);
  const [snapshotNotes, setSnapshotNotes] = useState('');

  const latestSnapshotDate = getLatestSnapshotDate(snapshots);
  const needsSnapshot = isSnapshotNeeded(latestSnapshotDate, settings.snapshotIntervalDays);
  const dateLocale = language === 'zh-TW' ? 'zh-TW' : 'en-US';

  const handleCreateSnapshot = () => {
    createManualSnapshot(snapshotNotes || undefined);
    setSnapshotNotes('');
    setIsCreateModalOpen(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.snapshots.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t.snapshots.subtitle}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
              className="select w-24"
            >
              <option value="TWD">TWD</option>
              <option value="USD">USD</option>
            </select>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={currentAssets.assets.length === 0}
              className="btn btn-primary"
            >
              {t.snapshots.createSnapshot}
            </button>
          </div>
        </div>

        {/* Snapshot Status */}
        {needsSnapshot && currentAssets.assets.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⏰</span>
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  {t.snapshots.timeForSnapshot}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {t.snapshots.snapshotReminder.replace('{days}', settings.snapshotIntervalDays.toString())}
                  {latestSnapshotDate && (
                    <span>
                      {' '}
                      {t.snapshots.lastSnapshot}: {new Date(latestSnapshotDate).toLocaleDateString(dateLocale)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.snapshots.snapshotInterval}: <strong>{settings.snapshotIntervalDays} {t.snapshots.days}</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.snapshots.totalSnapshots}: <strong>{snapshots.length}</strong>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.snapshots.currentAssetsValue}:
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(
                  displayCurrency === 'TWD'
                    ? currentAssets.assets.reduce(
                        (sum, a) =>
                          sum +
                          (a.currency === 'TWD'
                            ? a.value
                            : a.value * currentAssets.exchangeRate),
                        0
                      )
                    : currentAssets.assets.reduce(
                        (sum, a) =>
                          sum +
                          (a.currency === 'USD'
                            ? a.value
                            : a.value / currentAssets.exchangeRate),
                        0
                      ),
                  displayCurrency
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Snapshot List */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.snapshots.snapshotHistory}
          </h2>
          <SnapshotList
            snapshots={snapshots}
            currency={displayCurrency}
            onDelete={deleteSnapshot}
            onView={(snapshot) => setViewingSnapshot(snapshot)}
          />
        </div>
      </main>

      {/* Create Snapshot Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t.snapshots.createSnapshotTitle}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            {t.snapshots.createSnapshotDesc}
          </p>
          <div>
            <label className="label">{t.common.notes} ({t.common.optional})</label>
            <textarea
              value={snapshotNotes}
              onChange={(e) => setSnapshotNotes(e.target.value)}
              className="input"
              rows={2}
              placeholder={t.snapshots.notesPlaceholder}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="btn btn-secondary"
            >
              {t.common.cancel}
            </button>
            <button onClick={handleCreateSnapshot} className="btn btn-primary">
              {t.snapshots.createSnapshot.replace('+ ', '')}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Snapshot Modal */}
      <Modal
        isOpen={!!viewingSnapshot}
        onClose={() => setViewingSnapshot(null)}
        title={`${t.snapshots.snapshotDate}: ${viewingSnapshot ? new Date(viewingSnapshot.date).toLocaleDateString(dateLocale) : ''}`}
      >
        {viewingSnapshot && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{t.assets.totalTWD}</p>
                <p className="font-semibold">
                  {formatCurrency(viewingSnapshot.totalValueTWD, 'TWD')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.assets.totalUSD}</p>
                <p className="font-semibold">
                  {formatCurrency(viewingSnapshot.totalValueUSD, 'USD')}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {t.snapshots.rate}: {viewingSnapshot.exchangeRate.toFixed(2)} TWD/USD
              </p>
            </div>
            {viewingSnapshot.notes && (
              <div>
                <p className="text-sm text-gray-500">{t.common.notes}:</p>
                <p className="text-gray-700 dark:text-gray-300">{viewingSnapshot.notes}</p>
              </div>
            )}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {t.snapshots.assets} ({viewingSnapshot.assets.length})
              </h4>
              <div className="space-y-2">
                {viewingSnapshot.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded p-2"
                  >
                    <div>
                      <span className="mr-2">{ASSET_TYPE_ICONS[asset.type]}</span>
                      <span className="text-sm">{asset.name}</span>
                      {asset.symbol && (
                        <span className="text-xs text-gray-400 ml-1">({asset.symbol})</span>
                      )}
                      {asset.shares && (
                        <span className="text-xs text-gray-500 ml-2">
                          {asset.shares.toLocaleString()} {t.assets.shares}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(asset.value, asset.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
