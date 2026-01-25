'use client';

import { WishItem } from '@/types/wishlist';
import { LIFE_ASPECT_CONFIG } from '@/types/wishlist';
import { formatCurrency } from '@/utils/calculations';
import {
  calculateWantFrequency,
  calculateLifeQualityROI,
  getDaysSinceLastWanted,
  calculateAverageIntensity,
} from '@/utils/wishlistCalculations';

interface WishItemCardProps {
  item: WishItem;
  assetImpact?: number;
  onEdit?: (item: WishItem) => void;
  onDelete?: (id: string) => void;
  onMarkPurchased?: (id: string) => void;
  onMarkRejected?: (id: string) => void;
  onAddWant?: (id: string) => void;
  onCompare?: (item: WishItem) => void;
}

export default function WishItemCard({
  item,
  assetImpact = 0,
  onEdit,
  onDelete,
  onMarkPurchased,
  onMarkRejected,
  onAddWant,
  onCompare,
}: WishItemCardProps) {
  const wantFrequency = calculateWantFrequency(item.wantHistory, 4);
  const roi = calculateLifeQualityROI(item);
  const daysSinceLastWanted = getDaysSinceLastWanted(item.wantHistory);
  const avgIntensity = calculateAverageIntensity(item.wantHistory);

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
            {item.isNeed && (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                需要
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{item.category}</p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${priorityColors[item.priority]}`}
        >
          {item.priority === 'high' && '高優先'}
          {item.priority === 'medium' && '中優先'}
          {item.priority === 'low' && '低優先'}
        </span>
      </div>

      {/* Price and Asset Impact */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(item.estimatedPrice, 'TWD')}
          </span>
          {assetImpact > 0 && (
            <span className="text-sm text-gray-500">
              ({assetImpact.toFixed(2)}% 資產)
            </span>
          )}
        </div>
      </div>

      {/* Life Aspects */}
      <div className="flex flex-wrap gap-1 mb-3">
        {item.lifeAspects.map((aspect) => (
          <span
            key={aspect}
            className="px-2 py-1 text-xs rounded"
            style={{
              backgroundColor: `${LIFE_ASPECT_CONFIG[aspect].color}20`,
              color: LIFE_ASPECT_CONFIG[aspect].color,
            }}
          >
            {LIFE_ASPECT_CONFIG[aspect].icon} {LIFE_ASPECT_CONFIG[aspect].labelZh}
          </span>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="bg-gray-50 rounded p-2">
          <div className="text-gray-500 text-xs mb-1">想要頻率</div>
          <div className="font-semibold text-gray-900">
            {wantFrequency.toFixed(1)} 次/週
          </div>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <div className="text-gray-500 text-xs mb-1">生活品質 ROI</div>
          <div className="font-semibold text-gray-900">{roi.toFixed(1)}</div>
        </div>
        {item.wantHistory.length > 0 && (
          <>
            <div className="bg-gray-50 rounded p-2">
              <div className="text-gray-500 text-xs mb-1">平均強度</div>
              <div className="font-semibold text-gray-900">
                {avgIntensity.toFixed(1)}/5
              </div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="text-gray-500 text-xs mb-1">上次想要</div>
              <div className="font-semibold text-gray-900">
                {daysSinceLastWanted !== null ? `${daysSinceLastWanted} 天前` : '從未'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Specifications */}
      {item.specifications && (
        <p className="text-sm text-gray-600 mb-3">{item.specifications}</p>
      )}

      {/* Notes */}
      {item.notes && (
        <p className="text-sm text-gray-500 mb-3 italic">{item.notes}</p>
      )}

      {/* Product options indicator */}
      {item.alternativeOptions && item.alternativeOptions.length > 0 && (
        <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
          📋 有 {item.alternativeOptions.length} 個產品選項
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {item.alternativeOptions && item.alternativeOptions.length > 0 && onCompare && (
          <button
            onClick={() => onCompare(item)}
            className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
          >
            📊 比較選項
          </button>
        )}
        {onAddWant && (
          <button
            onClick={() => onAddWant(item.id)}
            className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
          >
            ❤️ 我想要
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(item)}
            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
          >
            編輯
          </button>
        )}
        {onMarkPurchased && (
          <button
            onClick={() => onMarkPurchased(item.id)}
            className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
          >
            ✓ 已購買
          </button>
        )}
        {onMarkRejected && (
          <button
            onClick={() => onMarkRejected(item.id)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
          >
            ✕ 不買了
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
          >
            刪除
          </button>
        )}
      </div>
    </div>
  );
}
