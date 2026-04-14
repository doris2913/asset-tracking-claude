'use client';

import { useState } from 'react';
import { WishlistGroup, GROUP_COLORS, GROUP_ICONS } from '@/types/wishlist';

interface GroupManagerProps {
  groups: WishlistGroup[];
  onAddGroup: (group: Omit<WishlistGroup, 'id' | 'dateCreated'>) => void;
  onUpdateGroup: (id: string, updates: Partial<Omit<WishlistGroup, 'id' | 'dateCreated'>>) => void;
  onDeleteGroup: (id: string) => void;
  onClose: () => void;
}

export default function GroupManager({
  groups,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onClose,
}: GroupManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(GROUP_COLORS[0]);
  const [icon, setIcon] = useState(GROUP_ICONS[0]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setColor(GROUP_COLORS[0]);
    setIcon(GROUP_ICONS[0]);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    if (editingId) {
      onUpdateGroup(editingId, {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon,
      });
    } else {
      onAddGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon,
      });
    }

    resetForm();
  };

  const handleEdit = (group: WishlistGroup) => {
    setEditingId(group.id);
    setName(group.name);
    setDescription(group.description || '');
    setColor(group.color);
    setIcon(group.icon || GROUP_ICONS[0]);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這個群組嗎？群組內的項目不會被刪除。')) {
      onDeleteGroup(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              需求群組管理
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            建立群組來歸類想要的物品，例如「客廳影音」、「2025冬季保暖」等。
          </p>

          {/* Add/Edit Form */}
          {isAdding ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                {editingId ? '編輯群組' : '新增群組'}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    群組名稱 *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：客廳影音設備"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    描述（選填）
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="描述這個需求或痛點"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    圖示
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GROUP_ICONS.map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIcon(i)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                          icon === i
                            ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    顏色
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GROUP_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {editingId ? '儲存變更' : '新增群組'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full px-4 py-3 mb-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              ➕ 新增群組
            </button>
          )}

          {/* Group List */}
          <div className="space-y-2">
            {groups.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">📁</div>
                <p>尚未建立任何群組</p>
              </div>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: group.color + '20' }}
                  >
                    {group.icon || '📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {group.name}
                    </div>
                    {group.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {group.description}
                      </div>
                    )}
                  </div>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(group)}
                      className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                      title="編輯"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      title="刪除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Close Button */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
