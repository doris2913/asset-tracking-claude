'use client';

import { useState, useEffect, useCallback } from 'react';
import { Asset, AssetType, Currency, ALL_ASSET_TYPES, ASSET_TYPE_CONFIG } from '@/types';
import { useI18n } from '@/i18n';
import { fetchStockQuote } from '@/lib/yahooFinance';
import { isMarketPricedType, isAutoFetchEligible, getMarketAssetKind } from '@/utils/calculations';

interface AssetFormProps {
  asset?: Asset;
  onSubmit: (asset: Omit<Asset, 'id' | 'lastUpdated'>) => void;
  onCancel: () => void;
}

export default function AssetForm({ asset, onSubmit, onCancel }: AssetFormProps) {
  const { t, language } = useI18n();
  const [name, setName] = useState(asset?.name || '');
  const [type, setType] = useState<AssetType>(asset?.type || 'cash_twd');
  const [value, setValue] = useState(asset?.value?.toString() || '');
  const [currency, setCurrency] = useState<Currency>(asset?.currency || 'TWD');
  const [symbol, setSymbol] = useState(asset?.symbol || '');
  const [shares, setShares] = useState(asset?.shares?.toString() || '');
  const [expectedReturn, setExpectedReturn] = useState(asset?.expectedReturn?.toString() || '');
  const [notes, setNotes] = useState(asset?.notes || '');
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [priceStatus, setPriceStatus] = useState<string>('');

  // Auto-set currency based on asset type
  useEffect(() => {
    if (type === 'cash_twd' || type === 'stock_tw' || type === 'fund_tw') {
      setCurrency('TWD');
    } else if (type === 'cash_usd' || type === 'stock_us' || type === 'us_tbills' || type === 'fund_us') {
      setCurrency('USD');
    }
  }, [type]);

  const isSharePriceTrackedType = isMarketPricedType(type);
  const marketAssetKind = getMarketAssetKind(type);
  const autoFetchEnabled = isAutoFetchEligible(type);

  // Auto-fetch stock/fund price when symbol changes
  const fetchPrice = useCallback(async (stockSymbol: string) => {
    if (!stockSymbol || !autoFetchEnabled) return;

    setIsFetchingPrice(true);
    setPriceStatus(language === 'zh-TW' ? '正在取得股價...' : 'Fetching price...');

    try {
      const quote = await fetchStockQuote(stockSymbol);
      if (quote) {
        const sharesNum = parseFloat(shares) || 1;
        const totalValue = quote.price * sharesNum;
        setValue(totalValue.toFixed(2));
        setPriceStatus(
          language === 'zh-TW'
            ? `股價: ${quote.price.toFixed(2)} ${quote.currency}`
            : `Price: ${quote.price.toFixed(2)} ${quote.currency}`
        );
      } else {
        setPriceStatus(language === 'zh-TW' ? '無法取得股價' : 'Could not fetch price');
      }
    } catch (error) {
      setPriceStatus(language === 'zh-TW' ? '取得股價失敗' : 'Failed to fetch price');
    } finally {
      setIsFetchingPrice(false);
    }
  }, [autoFetchEnabled, shares, language]);

  // Fetch price when symbol is entered and we have shares
  const handleFetchPrice = () => {
    if (symbol) {
      fetchPrice(symbol);
    }
  };

  // Update value when shares change and we have a price status (meaning we fetched a price)
  useEffect(() => {
    if (isSharePriceTrackedType && symbol && shares && priceStatus.includes('Price:') || priceStatus.includes('股價:')) {
      const priceMatch = priceStatus.match(/[\d.]+/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[0]);
        const sharesNum = parseFloat(shares) || 0;
        if (price > 0 && sharesNum > 0) {
          setValue((price * sharesNum).toFixed(2));
        }
      }
    }
  }, [shares, isSharePriceTrackedType, symbol, priceStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Default name to symbol if left blank for stock/fund types
    const assetName = name.trim() || (isSharePriceTrackedType && symbol ? symbol : '');

    const assetData: Omit<Asset, 'id' | 'lastUpdated'> = {
      name: assetName,
      type,
      value: parseFloat(value) || 0,
      currency,
      ...(isSharePriceTrackedType && symbol ? { symbol } : {}),
      ...(isSharePriceTrackedType && shares ? { shares: parseFloat(shares) } : {}),
      ...(expectedReturn ? { expectedReturn: parseFloat(expectedReturn) } : {}),
      ...(notes ? { notes } : {}),
    };

    onSubmit(assetData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">
          {t.assetForm.assetName}
          {isSharePriceTrackedType && <span className="text-gray-400 text-xs ml-1">({t.common.optional})</span>}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder={isSharePriceTrackedType ? (language === 'zh-TW' ? '留空則使用代號' : 'Leave blank to use symbol') : t.assetForm.assetNamePlaceholder}
          required={!isSharePriceTrackedType}
        />
      </div>

      <div>
        <label className="label">{t.assetForm.assetType}</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AssetType)}
          className="select"
        >
          {ALL_ASSET_TYPES.map((assetType) => (
            <option key={assetType} value={assetType}>
              {ASSET_TYPE_CONFIG[assetType].icon} {t.assetTypes[assetType]}
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

      {isSharePriceTrackedType && (
        <>
          <div>
            <label className="label">
              {marketAssetKind === 'fund' ? t.assetForm.fundCode : t.assetForm.stockSymbol}
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="input flex-1"
                placeholder={marketAssetKind === 'fund' ? t.assetForm.fundCodePlaceholder : t.assetForm.stockSymbolPlaceholder}
              />
              {autoFetchEnabled && (
                <button
                  type="button"
                  onClick={handleFetchPrice}
                  disabled={!symbol || isFetchingPrice}
                  className="btn btn-secondary whitespace-nowrap"
                >
                  {isFetchingPrice
                    ? (language === 'zh-TW' ? '取得中...' : 'Fetching...')
                    : (language === 'zh-TW' ? '取得股價' : 'Get Price')}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {marketAssetKind === 'fund' ? t.assetForm.fundCodeHint : t.assetForm.stockSymbolHint}
            </p>
            {priceStatus && (
              <p className={`text-xs mt-1 ${priceStatus.includes('Price:') || priceStatus.includes('股價:') ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                {priceStatus}
              </p>
            )}
          </div>

          <div>
            <label className="label">
              {marketAssetKind === 'fund' ? t.assetForm.numberOfUnits : t.assetForm.numberOfShares}
            </label>
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
        <label className="label">{t.assetForm.expectedReturn} ({t.common.optional})</label>
        <input
          type="number"
          value={expectedReturn}
          onChange={(e) => setExpectedReturn(e.target.value)}
          className="input"
          placeholder={t.assetForm.expectedReturnPlaceholder}
          step="0.1"
        />
        <p className="text-xs text-gray-500 mt-1">
          {t.assetForm.expectedReturnHint}
        </p>
      </div>

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
          {asset ? t.assets.editAsset : t.assets.addAsset.replace('+ ', '')}
        </button>
      </div>
    </form>
  );
}
