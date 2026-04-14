'use client';

import { useState, useEffect } from 'react';
import { LifeAspect, LIFE_ASPECT_CONFIG, CATEGORY_OPTIONS, PurchasedItem } from '@/types/wishlist';

interface PurchasedItemFormData {
  name: string;
  category: string;
  estimatedPrice: number;
  actualPrice: number;
  lifeAspects: LifeAspect[];
  isNeed: boolean;
  priority: 'low' | 'medium' | 'high';
  purchaseDate: string;
  store?: string;
  link?: string;
  notes?: string;
  type: 'daily_necessity' | 'one_time_purchase';
}

interface PurchasedItemFormProps {
  item?: PurchasedItem;  // If provided, form is in edit mode
  onSubmit: (data: PurchasedItemFormData) => void;
  onCancel: () => void;
}

export default function PurchasedItemForm({ item, onSubmit, onCancel }: PurchasedItemFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const isEditMode = !!item;

  const [formData, setFormData] = useState<PurchasedItemFormData>({
    name: '',
    category: '',
    estimatedPrice: 0,
    actualPrice: 0,
    lifeAspects: [],
    isNeed: false,
    priority: 'medium',
    purchaseDate: today,
    store: '',
    link: '',
    notes: '',
    type: 'one_time_purchase',
  });

  // Initialize form with item data when in edit mode
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        estimatedPrice: 0,
        actualPrice: item.actualPrice,
        lifeAspects: item.lifeAspects,
        isNeed: false,
        priority: 'medium',
        purchaseDate: item.purchaseDate,
        store: item.store || '',
        link: item.link || '',
        notes: item.notes || '',
        type: item.type,
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || formData.actualPrice <= 0) {
      alert('請填寫必填欄位');
      return;
    }
    onSubmit(formData);
  };

  const toggleLifeAspect = (aspect: LifeAspect) => {
    setFormData(prev => ({
      ...prev,
      lifeAspects: prev.lifeAspects.includes(aspect)
        ? prev.lifeAspects.filter(a => a !== aspect)
        : [...prev.lifeAspects, aspect],
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="例如：AirPods Pro 2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          類別 *
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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

      {/* Prices */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            原價估算
          </label>
          <input
            type="number"
            value={formData.estimatedPrice || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedPrice: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="0"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            實際購買價格 *
          </label>
          <input
            type="number"
            value={formData.actualPrice || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, actualPrice: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="0"
            min="0"
            required
          />
        </div>
      </div>

      {/* Purchase Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            購買日期 *
          </label>
          <input
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            購買商店（選填）
          </label>
          <input
            type="text"
            value={formData.store}
            onChange={(e) => setFormData(prev => ({ ...prev, store: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="例如：Apple Store"
          />
        </div>
      </div>

      {/* Product Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          產品連結（選填）
        </label>
        <input
          type="url"
          value={formData.link}
          onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="https://..."
        />
        <p className="text-xs text-gray-500 mt-1">購買頁面、評測文章或相關連結</p>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          物品類型 *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="one_time_purchase"
              checked={formData.type === 'one_time_purchase'}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">一次性購買（不會重複購買）</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="daily_necessity"
              checked={formData.type === 'daily_necessity'}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">日常用品（可能重複購買）</span>
          </label>
        </div>
      </div>

      {/* Is Need */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isNeed"
          checked={formData.isNeed}
          onChange={(e) => setFormData(prev => ({ ...prev, isNeed: e.target.checked }))}
          className="rounded"
        />
        <label htmlFor="isNeed" className="text-sm font-medium text-gray-700">
          這是必需品（非想要）
        </label>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          當時的優先級
        </label>
        <div className="flex gap-3">
          {(['low', 'medium', 'high'] as const).map((priority) => (
            <button
              key={priority}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, priority }))}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                formData.priority === priority
                  ? priority === 'high'
                    ? 'bg-red-100 text-red-700'
                    : priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {priority === 'high' && '高優先'}
              {priority === 'medium' && '中優先'}
              {priority === 'low' && '低優先'}
            </button>
          ))}
        </div>
      </div>

      {/* Life Aspects */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          影響的生活面向（選填）
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LIFE_ASPECT_CONFIG) as LifeAspect[]).map((aspect) => (
            <button
              key={aspect}
              type="button"
              onClick={() => toggleLifeAspect(aspect)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
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

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          備註（選填）
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={3}
          placeholder="購買心得、使用情況等"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          {isEditMode ? '儲存變更' : '新增購買記錄'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}
