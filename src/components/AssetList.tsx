'use client';

import { Asset, ASSET_TYPE_CONFIG } from '@/types';
import { formatCurrency, formatDate } from '@/utils/calculations';

interface AssetListProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

export default function AssetList({ assets, onEdit, onDelete }: AssetListProps) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-4xl mb-4">📦</p>
        <p>No assets yet. Add your first asset to get started!</p>
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
        const config = ASSET_TYPE_CONFIG[type as keyof typeof ASSET_TYPE_CONFIG];
        return (
          <div key={type}>
            <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
              <span className="mr-2">{config.icon}</span>
              {config.label}
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
                        <span className="mr-3">{asset.shares.toLocaleString()} shares</span>
                      )}
                      <span>Updated: {new Date(asset.lastUpdated).toLocaleDateString()}</span>
                    </div>
                    {asset.notes && (
                      <div className="text-xs text-gray-400 mt-1">{asset.notes}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      {formatCurrency(asset.value, asset.currency)}
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => onEdit(asset)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this asset?')) {
                            onDelete(asset.id);
                          }
                        }}
                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        Delete
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
