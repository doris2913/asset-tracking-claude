'use client';

import { useState, useEffect } from 'react';
import { Asset, AssetType, Currency, ASSET_TYPE_CONFIG } from '@/types';

interface AssetFormProps {
  asset?: Asset;
  onSubmit: (asset: Omit<Asset, 'id' | 'lastUpdated'>) => void;
  onCancel: () => void;
}

export default function AssetForm({ asset, onSubmit, onCancel }: AssetFormProps) {
  const [name, setName] = useState(asset?.name || '');
  const [type, setType] = useState<AssetType>(asset?.type || 'cash_twd');
  const [value, setValue] = useState(asset?.value?.toString() || '');
  const [currency, setCurrency] = useState<Currency>(asset?.currency || 'TWD');
  const [symbol, setSymbol] = useState(asset?.symbol || '');
  const [shares, setShares] = useState(asset?.shares?.toString() || '');
  const [notes, setNotes] = useState(asset?.notes || '');

  // Auto-set currency based on asset type
  useEffect(() => {
    if (type === 'cash_twd' || type === 'stock_tw') {
      setCurrency('TWD');
    } else if (type === 'cash_usd' || type === 'stock_us' || type === 'us_tbills') {
      setCurrency('USD');
    }
  }, [type]);

  const isStockType = type === 'stock_tw' || type === 'stock_us';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const assetData: Omit<Asset, 'id' | 'lastUpdated'> = {
      name,
      type,
      value: parseFloat(value) || 0,
      currency,
      ...(isStockType && symbol ? { symbol } : {}),
      ...(isStockType && shares ? { shares: parseFloat(shares) } : {}),
      ...(notes ? { notes } : {}),
    };

    onSubmit(assetData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Asset Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="e.g., Bank A Savings, AAPL Shares"
          required
        />
      </div>

      <div>
        <label className="label">Asset Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AssetType)}
          className="select"
        >
          {Object.entries(ASSET_TYPE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.icon} {config.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Value</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input"
            placeholder="0"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div>
          <label className="label">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="select"
          >
            <option value="TWD">TWD</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {isStockType && (
        <>
          <div>
            <label className="label">Stock Symbol (for auto-price update)</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="input"
              placeholder="e.g., AAPL, 0050.TW, 2330.TW"
            />
            <p className="text-xs text-gray-500 mt-1">
              TW stocks: use .TW suffix (e.g., 2330.TW). US stocks: use symbol directly (e.g., AAPL)
            </p>
          </div>

          <div>
            <label className="label">Number of Shares</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="input"
              placeholder="0"
              step="0.0001"
              min="0"
            />
          </div>
        </>
      )}

      <div>
        <label className="label">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          rows={2}
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {asset ? 'Update' : 'Add'} Asset
        </button>
      </div>
    </form>
  );
}
