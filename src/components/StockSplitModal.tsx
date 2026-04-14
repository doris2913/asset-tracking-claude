'use client';

import { useState, useMemo } from 'react';
import { Asset } from '@/types';
import { useI18n } from '@/i18n';
import { formatNumber } from '@/utils/calculations';

interface StockSplitModalProps {
  asset: Asset;
  onApply: (assetId: string, ratioFrom: number, ratioTo: number, notes?: string) => void;
  onCancel: () => void;
}

export default function StockSplitModal({ asset, onApply, onCancel }: StockSplitModalProps) {
  const { t } = useI18n();
  const [ratioFrom, setRatioFrom] = useState('1');
  const [ratioTo, setRatioTo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const currentShares = asset.shares || 0;

  const newShares = useMemo(() => {
    const from = parseFloat(ratioFrom);
    const to = parseFloat(ratioTo);
    if (!from || !to || from <= 0 || to <= 0) return null;
    return currentShares * (to / from);
  }, [ratioFrom, ratioTo, currentShares]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const from = parseFloat(ratioFrom);
    const to = parseFloat(ratioTo);

    if (!from || !to || from <= 0 || to <= 0) {
      setError(t.stockSplit.invalidRatio);
      return;
    }

    if (currentShares <= 0) {
      setError(t.stockSplit.noShares);
      return;
    }

    onApply(asset.id, from, to, notes || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t.stockSplit.description}
      </p>

      {/* Asset info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {asset.name}
          {asset.symbol && (
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              ({asset.symbol})
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t.stockSplit.currentShares}: {formatNumber(currentShares, 4)}
        </div>
      </div>

      {/* Split ratio */}
      <div>
        <label className="label">{t.stockSplit.splitRatio}</label>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              {t.stockSplit.from}
            </label>
            <input
              type="number"
              value={ratioFrom}
              onChange={(e) => setRatioFrom(e.target.value)}
              className="input"
              placeholder="1"
              step="any"
              min="0.0001"
              required
            />
          </div>
          <span className="text-2xl text-gray-400 mt-4">:</span>
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              {t.stockSplit.to}
            </label>
            <input
              type="number"
              value={ratioTo}
              onChange={(e) => setRatioTo(e.target.value)}
              className="input"
              placeholder="4"
              step="any"
              min="0.0001"
              required
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t.stockSplit.example}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t.stockSplit.reverseExample}
        </p>
      </div>

      {/* Preview */}
      {newShares !== null && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
            {t.stockSplit.newShares}: {formatNumber(newShares, 4)}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {formatNumber(currentShares, 4)} → {formatNumber(newShares, 4)}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="label">{t.common.notes} ({t.common.optional})</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          placeholder={`${ratioFrom}:${ratioTo || '?'} stock split`}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          {t.common.cancel}
        </button>
        <button type="submit" className="btn btn-primary">
          {t.stockSplit.apply}
        </button>
      </div>
    </form>
  );
}
