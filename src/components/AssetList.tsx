'use client';

import { Asset, AssetType } from '@/types';
import { formatCurrency, getEffectiveValue } from '@/utils/calculations';
import { useI18n } from '@/i18n';

const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  cash_twd: '💵',
  cash_usd: '💲',
  stock_tw: '📈',
  stock_us: '📊',
  liability: '💳',
  us_tbills: '🏛️',
};

interface AssetListProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

export default function AssetList({ assets, onEdit, onDelete }: AssetListProps) {
  const { t } = useI18n();

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-4xl mb-4">📦</p>
        <p>{t.assets.noAssets}</p>
      </div>
    );
  }

  // Group assets by type
  const groupedAssets = assets.reduce(
    (acc, asset) => {
      if (!acc[asset.type]) {
        acc[asset.type] = [];
      }
      acc[asset.type].push(asset);
      return acc;
    },
    {} as Record<string, Asset[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedAssets).map(([type, typeAssets]) => {
        const assetType = type as AssetType;
        return (
          <div key={type}>
            <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
              <span className="mr-2">{ASSET_TYPE_ICONS[assetType]}</span>
              {t.assetTypes[assetType]}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({typeAssets.length})
              </span>
            </h3>
            <div className="space-y-2">
              {typeAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {asset.name}
                      {asset.symbol && (
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({asset.symbol})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {asset.shares && (
                        <span className="mr-3">{asset.shares.toLocaleString()} {t.assets.shares}</span>
                      )}
                      <span>{t.assets.updated}: {new Date(asset.lastUpdated).toLocaleDateString()}</span>
                    </div>
                    {asset.notes && (
                      <div className="text-xs text-gray-400 mt-1">{asset.notes}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold text-lg ${asset.type === 'liability' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {formatCurrency(getEffectiveValue(asset), asset.currency)}
                    </div>
                    {asset.expectedReturn !== undefined && asset.expectedReturn !== 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        🎯 {asset.expectedReturn >= 0 ? '+' : ''}{asset.expectedReturn}%
                      </div>
                    )}
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => onEdit(asset)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {t.common.edit}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t.assets.confirmDelete)) {
                            onDelete(asset.id);
                          }
                        }}
                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        {t.common.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
