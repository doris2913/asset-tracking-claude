'use client';

import { WishItem, AlternativeOption } from '@/types/wishlist';
import { formatCurrency } from '@/utils/calculations';

interface ProductComparisonModalProps {
  item: WishItem;
  onClose: () => void;
}

export default function ProductComparisonModal({ item, onClose }: ProductComparisonModalProps) {
  if (!item.alternativeOptions || item.alternativeOptions.length === 0) {
    return null;
  }

  // Include the main item as one of the options
  const mainOption = {
    name: `${item.name} (主要選擇)`,
    price: item.estimatedPrice,
    brand: item.category,
    webLink: item.links?.[0],
    pros: item.specifications || '',
    cons: '',
    customFields: {},
  };

  const allOptions = [mainOption, ...item.alternativeOptions];

  // Get all unique custom field keys
  const customFieldKeys = new Set<string>();
  allOptions.forEach(option => {
    if (option.customFields) {
      Object.keys(option.customFields).forEach(key => customFieldKeys.add(key));
    }
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">產品比較</h2>
          <p className="text-gray-600">比較不同選項，選擇最適合你的</p>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 sticky left-0 bg-gray-50 z-10">
                    比較項目
                  </th>
                  {allOptions.map((option, index) => (
                    <th
                      key={index}
                      className={`px-4 py-3 text-left text-sm font-semibold border-b-2 border-gray-200 ${
                        index === 0 ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                      }`}
                    >
                      {option.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price Row */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200 sticky left-0 bg-white">
                    價格
                  </td>
                  {allOptions.map((option, index) => (
                    <td
                      key={index}
                      className={`px-4 py-3 text-sm border-b border-gray-200 ${
                        index === 0 ? 'bg-purple-50' : ''
                      }`}
                    >
                      <span className="font-bold text-purple-600">
                        {formatCurrency(option.price, 'TWD')}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Brand Row */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200 sticky left-0 bg-white">
                    品牌/類別
                  </td>
                  {allOptions.map((option, index) => (
                    <td
                      key={index}
                      className={`px-4 py-3 text-sm text-gray-900 border-b border-gray-200 ${
                        index === 0 ? 'bg-purple-50' : ''
                      }`}
                    >
                      {option.brand || '-'}
                    </td>
                  ))}
                </tr>

                {/* Web Link Row */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200 sticky left-0 bg-white">
                    網頁連結
                  </td>
                  {allOptions.map((option, index) => (
                    <td
                      key={index}
                      className={`px-4 py-3 text-sm border-b border-gray-200 ${
                        index === 0 ? 'bg-purple-50' : ''
                      }`}
                    >
                      {option.webLink ? (
                        <a
                          href={option.webLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          查看 🔗
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  ))}
                </tr>

                {/* Pros Row */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200 sticky left-0 bg-white">
                    優點/規格
                  </td>
                  {allOptions.map((option, index) => (
                    <td
                      key={index}
                      className={`px-4 py-3 text-sm text-gray-700 border-b border-gray-200 ${
                        index === 0 ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{option.pros || '-'}</div>
                    </td>
                  ))}
                </tr>

                {/* Cons Row */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200 sticky left-0 bg-white">
                    缺點
                  </td>
                  {allOptions.map((option, index) => (
                    <td
                      key={index}
                      className={`px-4 py-3 text-sm text-gray-700 border-b border-gray-200 ${
                        index === 0 ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{option.cons || '-'}</div>
                    </td>
                  ))}
                </tr>

                {/* Custom Fields Rows */}
                {Array.from(customFieldKeys).map((fieldKey) => (
                  <tr key={fieldKey} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200 sticky left-0 bg-white">
                      {fieldKey}
                    </td>
                    {allOptions.map((option, index) => (
                      <td
                        key={index}
                        className={`px-4 py-3 text-sm text-gray-700 border-b border-gray-200 ${
                          index === 0 ? 'bg-purple-50' : ''
                        }`}
                      >
                        {option.customFields?.[fieldKey] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Price Comparison Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">價格比較</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-blue-700">最低價</div>
                <div className="text-lg font-bold text-blue-900">
                  {formatCurrency(Math.min(...allOptions.map(o => o.price)), 'TWD')}
                </div>
              </div>
              <div>
                <div className="text-xs text-blue-700">最高價</div>
                <div className="text-lg font-bold text-blue-900">
                  {formatCurrency(Math.max(...allOptions.map(o => o.price)), 'TWD')}
                </div>
              </div>
              <div>
                <div className="text-xs text-blue-700">價差</div>
                <div className="text-lg font-bold text-blue-900">
                  {formatCurrency(
                    Math.max(...allOptions.map(o => o.price)) - Math.min(...allOptions.map(o => o.price)),
                    'TWD'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-6 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            關閉比較
          </button>
        </div>
      </div>
    </div>
  );
}
