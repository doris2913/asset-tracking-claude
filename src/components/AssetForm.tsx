'use client';

import { useState, useEffect } from 'react';
import { Asset, AssetType, Currency } from '@/types';
import { useI18n } from '@/i18n';

const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  cash_twd: '💵',
  cash_usd: '💲',
  stock_tw: '📈',
  stock_us: '📊',
  rent: '🏠',
  us_tbills: '🏛️',
};

interface AssetFormProps {
  asset?: Asset;
  onSubmit: (asset: Omit<Asset, 'id' | 'lastUpdated'>) => void;
  onCancel: () => void;
}

export default function AssetForm({ asset, onSubmit, onCancel }: AssetFormProps) {
  const { t } = useI18n();
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

  const assetTypes: AssetType[] = ['cash_twd', 'cash_usd', 'stock_tw', 'stock_us', 'rent', 'us_tbills'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">{t.assetForm.assetName}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder={t.assetForm.assetNamePlaceholder}
          required
        />
      </div>

      <div>
        <label className="label">{t.assetForm.assetType}</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AssetType)}
          className="select"
        >
          {assetTypes.map((assetType) => (
            <option key={assetType} value={assetType}>
              {ASSET_TYPE_ICONS[assetType]} {t.assetTypes[assetType]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t.assetForm.value}</label>
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
          <label className="label">{t.common.currency}</label>
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
            <label className="label">{t.assetForm.stockSymbol}</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="input"
              placeholder={t.assetForm.stockSymbolPlaceholder}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t.assetForm.stockSymbolHint}
            </p>
          </div>

          <div>
            <label className="label">{t.assetForm.numberOfShares}</label>
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
        <label className="label">{t.common.notes} ({t.common.optional})</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          rows={2}
          placeholder={t.assetForm.notesPlaceholder}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          {t.common.cancel}
        </button>
        <button type="submit" className="btn btn-primary">
          {asset ? t.common.update : t.common.add} {t.nav.assets.slice(0, -1)}
        </button>
      </div>
    </form>
  );
}
