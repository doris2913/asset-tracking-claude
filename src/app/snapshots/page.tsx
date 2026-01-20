'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import SnapshotList from '@/components/SnapshotList';
import Modal from '@/components/Modal';
import { useAssetData } from '@/hooks/useAssetData';
import { Snapshot, Currency, ASSET_TYPE_CONFIG } from '@/types';
import { formatCurrency, isSnapshotNeeded, getLatestSnapshotDate } from '@/utils/calculations';

export default function SnapshotsPage() {
  const {
    currentAssets,
    snapshots,
    settings,
    createManualSnapshot,
    deleteSnapshot,
    isLoaded,
  } = useAssetData();

  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingSnapshot, setViewingSnapshot] = useState<Snapshot | null>(null);
  const [snapshotNotes, setSnapshotNotes] = useState('');

  const latestSnapshotDate = getLatestSnapshotDate(snapshots);
  const needsSnapshot = isSnapshotNeeded(latestSnapshotDate, settings.snapshotIntervalDays);

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
          <div className="text-gray-500">Loading...</div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Snapshots</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Historical snapshots of your assets
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
              + Create Snapshot
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
                  Time for a new snapshot!
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  It has been more than {settings.snapshotIntervalDays} days since your last snapshot.
                  {latestSnapshotDate && (
                    <span>
                      {' '}
                      Last snapshot: {new Date(latestSnapshotDate).toLocaleDateString()}
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
                Snapshot interval: <strong>{settings.snapshotIntervalDays} days</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total snapshots: <strong>{snapshots.length}</strong>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current assets value:
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
            Snapshot History
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
        title="Create Snapshot"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            This will create a snapshot of your current assets with today's values.
          </p>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              value={snapshotNotes}
              onChange={(e) => setSnapshotNotes(e.target.value)}
              className="input"
              rows={2}
              placeholder="e.g., Monthly snapshot, Received bonus..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleCreateSnapshot} className="btn btn-primary">
              Create Snapshot
            </button>
          </div>
        </div>
      </Modal>

      {/* View Snapshot Modal */}
      <Modal
        isOpen={!!viewingSnapshot}
        onClose={() => setViewingSnapshot(null)}
        title={`Snapshot: ${viewingSnapshot ? new Date(viewingSnapshot.date).toLocaleDateString() : ''}`}
      >
        {viewingSnapshot && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total (TWD)</p>
                <p className="font-semibold">
                  {formatCurrency(viewingSnapshot.totalValueTWD, 'TWD')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total (USD)</p>
                <p className="font-semibold">
                  {formatCurrency(viewingSnapshot.totalValueUSD, 'USD')}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Exchange Rate: {viewingSnapshot.exchangeRate.toFixed(2)} TWD/USD
              </p>
            </div>
            {viewingSnapshot.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes:</p>
                <p className="text-gray-700 dark:text-gray-300">{viewingSnapshot.notes}</p>
              </div>
            )}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Assets ({viewingSnapshot.assets.length})
              </h4>
              <div className="space-y-2">
                {viewingSnapshot.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded p-2"
                  >
                    <div>
                      <span className="mr-2">{ASSET_TYPE_CONFIG[asset.type].icon}</span>
                      <span className="text-sm">{asset.name}</span>
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
