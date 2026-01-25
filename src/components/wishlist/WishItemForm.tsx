'use client';

import { useState } from 'react';
import { WishItem, LifeAspect, LIFE_ASPECT_CONFIG, CATEGORY_OPTIONS, AlternativeOption } from '@/types/wishlist';

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

  const [alternativeOptions, setAlternativeOptions] = useState<AlternativeOption[]>(
    item?.alternativeOptions || []
  );

  const [newCustomFieldKey, setNewCustomFieldKey] = useState('');
  const [showAddCustomField, setShowAddCustomField] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: Omit<WishItem, 'id' | 'dateAdded' | 'wantHistory'> = {
      ...formData,
      links: formData.links ? formData.links.split('\n').filter(l => l.trim()) : [],
      alternativeOptions: alternativeOptions,
      imageUrl: item?.imageUrl,
      purchaseDate: item?.purchaseDate,
    };

    onSubmit(submitData);
  };

  const addAlternativeOption = () => {
    setAlternativeOptions([
      ...alternativeOptions,
      {
        name: '',
        price: 0,
        brand: '',
        webLink: '',
        pros: '',
        cons: '',
        customFields: {},
      },
    ]);
  };

  const removeAlternativeOption = (index: number) => {
    setAlternativeOptions(alternativeOptions.filter((_, i) => i !== index));
  };

  const updateAlternativeOption = (
    index: number,
    field: keyof AlternativeOption,
    value: any
  ) => {
    const updated = [...alternativeOptions];
    updated[index] = { ...updated[index], [field]: value };
    setAlternativeOptions(updated);
  };

  const addCustomField = (optionIndex: number) => {
    if (!newCustomFieldKey.trim()) return;

    const updated = [...alternativeOptions];
    updated[optionIndex] = {
      ...updated[optionIndex],
      customFields: {
        ...updated[optionIndex].customFields,
        [newCustomFieldKey]: '',
      },
    };
    setAlternativeOptions(updated);
    setNewCustomFieldKey('');
    setShowAddCustomField(null);
  };

  const updateCustomField = (
    optionIndex: number,
    fieldKey: string,
    value: string
  ) => {
    const updated = [...alternativeOptions];
    updated[optionIndex] = {
      ...updated[optionIndex],
      customFields: {
        ...updated[optionIndex].customFields,
        [fieldKey]: value,
      },
    };
    setAlternativeOptions(updated);
  };

  const removeCustomField = (optionIndex: number, fieldKey: string) => {
    const updated = [...alternativeOptions];
    const { [fieldKey]: _, ...remainingFields } = updated[optionIndex].customFields || {};
    updated[optionIndex] = {
      ...updated[optionIndex],
      customFields: remainingFields,
    };
    setAlternativeOptions(updated);
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

      {/* Alternative Options */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">替代選項比較</h3>
            <p className="text-sm text-gray-500 mt-1">
              新增不同的產品選擇以便比較（價格、品牌、規格等）
            </p>
          </div>
          <button
            type="button"
            onClick={addAlternativeOption}
            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            ➕ 新增選項
          </button>
        </div>

        {alternativeOptions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-gray-400 text-3xl mb-2">📋</div>
            <p className="text-gray-600">尚無替代選項</p>
            <p className="text-sm text-gray-500 mt-1">新增不同的產品選擇以便比較</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alternativeOptions.map((option, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">選項 {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeAlternativeOption(index)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    ✕ 移除
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      產品名稱 *
                    </label>
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) =>
                        updateAlternativeOption(index, 'name', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="例：iPhone 15 Pro"
                      required
                    />
                  </div>

                  {/* Price and Brand */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        價格 (TWD) *
                      </label>
                      <input
                        type="number"
                        value={option.price}
                        onChange={(e) =>
                          updateAlternativeOption(index, 'price', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        品牌
                      </label>
                      <input
                        type="text"
                        value={option.brand || ''}
                        onChange={(e) =>
                          updateAlternativeOption(index, 'brand', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="例：Apple"
                      />
                    </div>
                  </div>

                  {/* Web Link */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      網頁連結
                    </label>
                    <input
                      type="url"
                      value={option.webLink || ''}
                      onChange={(e) =>
                        updateAlternativeOption(index, 'webLink', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="https://..."
                    />
                  </div>

                  {/* Pros */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      優點/規格
                    </label>
                    <textarea
                      value={option.pros}
                      onChange={(e) =>
                        updateAlternativeOption(index, 'pros', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      rows={2}
                      placeholder="列出產品優點或重要規格"
                    />
                  </div>

                  {/* Cons */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      缺點
                    </label>
                    <textarea
                      value={option.cons}
                      onChange={(e) =>
                        updateAlternativeOption(index, 'cons', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      rows={2}
                      placeholder="列出產品缺點或限制"
                    />
                  </div>

                  {/* Custom Fields */}
                  {option.customFields && Object.keys(option.customFields).length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        自訂比較項目
                      </label>
                      <div className="space-y-2">
                        {Object.entries(option.customFields).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) =>
                                    updateCustomField(index, key, e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                  placeholder={key}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCustomField(index, key)}
                                  className="text-red-600 hover:text-red-700 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{key}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Custom Field */}
                  <div className="border-t pt-3">
                    {showAddCustomField === index ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCustomFieldKey}
                          onChange={(e) => setNewCustomFieldKey(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="輸入比較項目名稱（例：電池容量）"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomField(index);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => addCustomField(index)}
                          className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                        >
                          確認
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCustomField(null);
                            setNewCustomFieldKey('');
                          }}
                          className="px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddCustomField(index)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        + 新增自訂比較項目
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
