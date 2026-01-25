'use client';

import { useState } from 'react';
import { WishItem, LifeAspect, LIFE_ASPECT_CONFIG, CATEGORY_OPTIONS } from '@/types/wishlist';

interface WishItemFormProps {
  item?: WishItem;
  onSubmit: (item: Omit<WishItem, 'id' | 'dateAdded' | 'wantHistory'>) => void;
  onCancel: () => void;
}

export default function WishItemForm({ item, onSubmit, onCancel }: WishItemFormProps) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || '',
    estimatedPrice: item?.estimatedPrice || 0,
    specifications: item?.specifications || '',
    isNeed: item?.isNeed || false,
    lifeAspects: item?.lifeAspects || [] as LifeAspect[],
    aspectImportance: item?.aspectImportance || {},
    currentSatisfaction: item?.currentSatisfaction || {},
    expectedImprovement: item?.expectedImprovement || {},
    priority: item?.priority || 'medium' as 'low' | 'medium' | 'high',
    notes: item?.notes || '',
    links: item?.links?.join('\n') || '',
    status: item?.status || 'wishlist' as 'wishlist' | 'purchased' | 'rejected',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: Omit<WishItem, 'id' | 'dateAdded' | 'wantHistory'> = {
      ...formData,
      links: formData.links ? formData.links.split('\n').filter(l => l.trim()) : [],
      alternativeOptions: item?.alternativeOptions || [],
      imageUrl: item?.imageUrl,
      purchaseDate: item?.purchaseDate,
    };

    onSubmit(submitData);
  };

  const toggleLifeAspect = (aspect: LifeAspect) => {
    const newAspects = formData.lifeAspects.includes(aspect)
      ? formData.lifeAspects.filter(a => a !== aspect)
      : [...formData.lifeAspects, aspect];

    setFormData(prev => ({
      ...prev,
      lifeAspects: newAspects,
    }));
  };

  const updateAspectValue = (
    aspect: LifeAspect,
    field: 'aspectImportance' | 'currentSatisfaction' | 'expectedImprovement',
    value: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [aspect]: value,
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          物品名稱 *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            類別 *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          >
            <option value="">選擇類別</option>
            {CATEGORY_OPTIONS.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            預估價格 (TWD) *
          </label>
          <input
            type="number"
            value={formData.estimatedPrice}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedPrice: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            min="0"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          規格說明
        </label>
        <textarea
          value={formData.specifications}
          onChange={(e) => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={3}
        />
      </div>

      {/* Want/Need Toggle */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isNeed}
            onChange={(e) => setFormData(prev => ({ ...prev, isNeed: e.target.checked }))}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">
            這是需要（而非想要）
          </span>
        </label>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          優先級
        </label>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as const).map(priority => (
            <button
              key={priority}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, priority }))}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                formData.priority === priority
                  ? priority === 'high'
                    ? 'bg-red-600 text-white'
                    : priority === 'medium'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {priority === 'high' && '高'}
              {priority === 'medium' && '中'}
              {priority === 'low' && '低'}
            </button>
          ))}
        </div>
      </div>

      {/* Life Aspects */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          影響的生活面向 *
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LIFE_ASPECT_CONFIG) as LifeAspect[]).map(aspect => (
            <button
              key={aspect}
              type="button"
              onClick={() => toggleLifeAspect(aspect)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                formData.lifeAspects.includes(aspect)
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: formData.lifeAspects.includes(aspect)
                  ? LIFE_ASPECT_CONFIG[aspect].color
                  : undefined,
              }}
            >
              {LIFE_ASPECT_CONFIG[aspect].icon} {LIFE_ASPECT_CONFIG[aspect].labelZh}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Details */}
      {formData.lifeAspects.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">各面向詳細評估</h3>
          {formData.lifeAspects.map(aspect => (
            <div key={aspect} className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: LIFE_ASPECT_CONFIG[aspect].color }}>
                  {LIFE_ASPECT_CONFIG[aspect].icon}
                </span>
                <span className="font-medium text-gray-900">
                  {LIFE_ASPECT_CONFIG[aspect].labelZh}
                </span>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  重要性 (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.aspectImportance[aspect] || 5}
                  onChange={(e) =>
                    updateAspectValue(aspect, 'aspectImportance', Number(e.target.value))
                  }
                  className="w-full"
                />
                <div className="text-right text-sm font-medium text-gray-700">
                  {formData.aspectImportance[aspect] || 5}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  目前滿意度 (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.currentSatisfaction[aspect] || 5}
                  onChange={(e) =>
                    updateAspectValue(aspect, 'currentSatisfaction', Number(e.target.value))
                  }
                  className="w-full"
                />
                <div className="text-right text-sm font-medium text-gray-700">
                  {formData.currentSatisfaction[aspect] || 5}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  預期改善程度 (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.expectedImprovement[aspect] || 5}
                  onChange={(e) =>
                    updateAspectValue(aspect, 'expectedImprovement', Number(e.target.value))
                  }
                  className="w-full"
                />
                <div className="text-right text-sm font-medium text-gray-700">
                  {formData.expectedImprovement[aspect] || 5}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          備註
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={3}
        />
      </div>

      {/* Links */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          相關連結（每行一個）
        </label>
        <textarea
          value={formData.links}
          onChange={(e) => setFormData(prev => ({ ...prev, links: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={3}
          placeholder="https://example.com/product"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
        >
          {item ? '更新' : '新增'} 願望清單
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}
