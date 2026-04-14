'use client';

import { useState } from 'react';
import { Asset } from '@/types';
import { useI18n } from '@/i18n';

interface StockSplitFormProps {
  asset: Asset;
  onSubmit: (assetId: string, ratio: number) => void;
  onCancel: () => void;
}

export default function StockSplitForm({ asset, onSubmit, onCancel }: StockSplitFormProps) {
  const { t } = useI18n();
  const [newShares, setNewShares] = useState<number>(1);
  const [oldShares, setOldShares] = useState<number>(1);

  const ratio = newShares / oldShares;
  const resultShares = asset.shares ? asset.shares * ratio : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ratio <= 0 || !isFinite(ratio)) return;
    onSubmit(asset.id, ratio);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Asset info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {asset.name} {asset.symbol && `(${asset.symbol})`}
        </div>
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {t.stockSplit.currentShares}: {asset.shares?.toLocaleString() ?? 0}
        </div>
      </div>

      {/* Split ratio input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.stockSplit.splitRatio}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            step="1"
            value={newShares}
            onChange={(e) => setNewShares(Number(e.target.value))}
            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center"
          />
          <span className="text-gray-500 dark:text-gray-400 font-medium">:</span>
          <input
            type="number"
            min="1"
            step="1"
            value={oldShares}
            onChange={(e) => setOldShares(Number(e.target.value))}
            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center"
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t.stockSplit.ratioHint}
        </p>
      </div>

      {/* Preview */}
      {asset.shares && ratio > 0 && isFinite(ratio) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            {t.stockSplit.preview}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-400">
            {asset.shares.toLocaleString()} → {resultShares.toLocaleString()} {t.assets.shares}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">
            {t.stockSplit.snapshotNote}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          {t.common.cancel}
        </button>
        <button
          type="submit"
          disabled={ratio <= 0 || !isFinite(ratio) || ratio === 1}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.stockSplit.apply}
        </button>
      </div>
    </form>
  );
}
