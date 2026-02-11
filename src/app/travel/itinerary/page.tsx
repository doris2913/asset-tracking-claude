'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/i18n';
import { useTravelData } from '@/hooks/useTravelData';
import Modal from '@/components/Modal';
import Link from 'next/link';
import {
  ItineraryItem,
  TravelCurrency,
  TRAVEL_CURRENCIES,
  formatDuration,
} from '@/types/travel';

function ItineraryContent() {
  const searchParams = useSearchParams();
  const initialDate = searchParams.get('date');
  const { t, language } = useI18n();
  const travel = useTravelData();
  const plan = travel.activePlan;

  const [selectedDate, setSelectedDate] = useState<string>(initialDate || '');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  // Item form
  const [itemForm, setItemForm] = useState({
    type: 'attraction' as ItineraryItem['type'],
    name: '',
    startTime: '',
    estimatedDuration: 60,
    travelTimeToNext: 0,
    cost: 0,
    currency: 'TWD' as TravelCurrency,
    notes: '',
  });

  // Set initial date
  useEffect(() => {
    if (!selectedDate && plan?.dailyItineraries.length) {
      setSelectedDate(initialDate || plan.dailyItineraries[0].date);
    }
  }, [plan, selectedDate, initialDate]);

  const currentDay = plan?.dailyItineraries.find(d => d.date === selectedDate);
  const sortedItems = currentDay
    ? [...currentDay.items].sort((a, b) => a.order - b.order)
    : [];

  // ========== Drag and Drop ==========

  const handleDragStart = useCallback((index: number, e: React.DragEvent<HTMLDivElement>) => {
    setDragIndex(index);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Make it look like it's being dragged
    setTimeout(() => {
      if (dragNode.current) {
        dragNode.current.style.opacity = '0.4';
      }
    }, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) {
      dragNode.current.style.opacity = '1';
    }
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex && selectedDate) {
      travel.reorderItineraryItems(selectedDate, dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragNode.current = null;
  }, [dragIndex, dragOverIndex, selectedDate, travel]);

  const handleDragOver = useCallback((index: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex !== null && index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  }, [dragIndex, dragOverIndex]);

  // Touch drag support
  const touchStartY = useRef<number>(0);
  const touchItemIndex = useRef<number | null>(null);

  const handleTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchItemIndex.current = index;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchItemIndex.current === null || !selectedDate) return;

    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartY.current;
    const itemHeight = 80; // approximate height of each item

    if (Math.abs(diff) > itemHeight / 2) {
      const direction = diff > 0 ? 1 : -1;
      const newIndex = touchItemIndex.current + direction;
      if (newIndex >= 0 && newIndex < sortedItems.length) {
        travel.reorderItineraryItems(selectedDate, touchItemIndex.current, newIndex);
      }
    }

    touchItemIndex.current = null;
  }, [selectedDate, sortedItems.length, travel]);

  // Move up/down buttons for mobile
  const moveItem = useCallback((index: number, direction: 'up' | 'down') => {
    if (!selectedDate) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < sortedItems.length) {
      travel.reorderItineraryItems(selectedDate, index, newIndex);
    }
  }, [selectedDate, sortedItems.length, travel]);

  // ========== Item CRUD ==========

  const openNewItem = () => {
    setEditingItem(null);
    const defaultCurrency = plan?.defaultCurrency || 'TWD';
    setItemForm({
      type: 'attraction',
      name: '',
      startTime: '',
      estimatedDuration: 60,
      travelTimeToNext: 0,
      cost: 0,
      currency: defaultCurrency,
      notes: '',
    });
    setShowItemModal(true);
  };

  const openEditItem = (item: ItineraryItem) => {
    setEditingItem(item);
    setItemForm({
      type: item.type,
      name: item.name,
      startTime: item.startTime || '',
      estimatedDuration: item.estimatedDuration,
      travelTimeToNext: item.travelTimeToNext,
      cost: item.cost,
      currency: item.currency,
      notes: item.notes || '',
    });
    setShowItemModal(true);
  };

  const saveItem = () => {
    if (!itemForm.name || !selectedDate) return;

    if (editingItem) {
      travel.updateItineraryItem(selectedDate, editingItem.id, itemForm);
    } else {
      travel.addItineraryItem(selectedDate, itemForm);
    }
    setShowItemModal(false);
  };

  const deleteItem = (itemId: string) => {
    if (selectedDate) {
      travel.deleteItineraryItem(selectedDate, itemId);
    }
  };

  // ========== Title Editing ==========

  const startEditTitle = (date: string, currentTitle: string) => {
    setEditingTitle(date);
    setTitleInput(currentTitle);
  };

  const saveTitle = () => {
    if (editingTitle) {
      travel.updateDayTitle(editingTitle, titleInput);
      setEditingTitle(null);
    }
  };

  // ========== Time Calculations ==========

  const getAccumulatedTime = (items: ItineraryItem[], upToIndex: number) => {
    let total = 0;
    for (let i = 0; i <= upToIndex; i++) {
      total += items[i].estimatedDuration;
      if (i < upToIndex) {
        total += items[i].travelTimeToNext;
      }
    }
    return total;
  };

  const getCurrencySymbol = (currency: TravelCurrency) => {
    return TRAVEL_CURRENCIES.find(c => c.value === currency)?.symbol || currency;
  };

  const getItemTypeIcon = (type: ItineraryItem['type']) => {
    switch (type) {
      case 'hotel_checkin': return '🏨';
      case 'hotel_checkout': return '🏨';
      case 'flight_departure': return '✈️';
      case 'flight_arrival': return '✈️';
      case 'custom': return '📌';
      default: return '📍';
    }
  };

  if (!travel.isLoaded) {
    return <div className="p-4">{t.common.loading}</div>;
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="card p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t.travel.selectPlan}</p>
            <Link href="/travel" className="btn-primary mt-4 inline-block">
              {t.travel.backToOverview}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/travel" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                {t.travel.backToOverview}
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t.travel.itineraryDetail}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{plan.name}</p>
          </div>
        </div>

        {/* Day selector tabs */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
            {plan.dailyItineraries.map((day, index) => (
              <button
                key={day.id}
                onClick={() => setSelectedDate(day.date)}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDate === day.date
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm'
                }`}
              >
                <div>D{index + 1}</div>
                <div className="text-xs opacity-80">{day.date.slice(5)}</div>
              </button>
            ))}
          </div>
        </div>

        {currentDay && (
          <>
            {/* Day header */}
            <div className="card p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {editingTitle === currentDay.date ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        className="input flex-1"
                        value={titleInput}
                        onChange={e => setTitleInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveTitle();
                          if (e.key === 'Escape') setEditingTitle(null);
                        }}
                        autoFocus
                      />
                      <button onClick={saveTitle} className="btn-primary text-sm">{t.common.save}</button>
                      <button onClick={() => setEditingTitle(null)} className="btn text-sm">{t.common.cancel}</button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currentDay.title}
                      </h2>
                      <button
                        onClick={() => startEditTitle(currentDay.date, currentDay.title)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
                      >
                        {t.common.edit}
                      </button>
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {currentDay.date}
                </div>
              </div>

              {/* Day summary */}
              <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {sortedItems.length} {language === 'zh-TW' ? '個項目' : 'items'}
                </span>
                {sortedItems.length > 0 && (
                  <>
                    <span>|</span>
                    <span>
                      {t.travel.totalTime}: {formatDuration(
                        sortedItems.reduce((sum, item) => sum + item.estimatedDuration + item.travelTimeToNext, 0)
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Add item button */}
            <div className="mb-4">
              <button onClick={openNewItem} className="btn-primary text-sm">
                {t.travel.addItem}
              </button>
            </div>

            {/* Itinerary items list with drag-and-drop */}
            {sortedItems.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t.travel.noItems}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedItems.map((item, index) => {
                  const accumulated = getAccumulatedTime(sortedItems, index);
                  const isDragOver = dragOverIndex === index;

                  return (
                    <div key={item.id}>
                      <div
                        draggable
                        onDragStart={e => handleDragStart(index, e)}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => handleDragOver(index, e)}
                        onTouchStart={e => handleTouchStart(index, e)}
                        onTouchEnd={handleTouchEnd}
                        className={`card p-3 cursor-move transition-all ${
                          isDragOver
                            ? 'border-2 border-blue-400 dark:border-blue-500'
                            : 'border border-transparent'
                        } ${
                          dragIndex === index ? 'opacity-40' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Drag handle + order number */}
                          <div className="flex flex-col items-center gap-1 pt-1">
                            <div className="text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                            {/* Mobile move buttons */}
                            <div className="flex flex-col gap-0.5 md:hidden">
                              <button
                                onClick={() => moveItem(index, 'up')}
                                disabled={index === 0}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 p-0.5"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                onClick={() => moveItem(index, 'down')}
                                disabled={index === sortedItems.length - 1}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 p-0.5"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-lg">{getItemTypeIcon(item.type)}</span>
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {item.name}
                              </span>
                              {item.startTime && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                                  {item.startTime}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <span>
                                {language === 'zh-TW' ? '停留' : 'Stay'}: {formatDuration(item.estimatedDuration)}
                              </span>
                              {item.travelTimeToNext > 0 && (
                                <span>
                                  {language === 'zh-TW' ? '交通' : 'Travel'}: {formatDuration(item.travelTimeToNext)}
                                </span>
                              )}
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {t.travel.accumulatedTime}: {formatDuration(accumulated)}
                              </span>
                            </div>

                            {item.cost > 0 && (
                              <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mt-1">
                                {getCurrencySymbol(item.currency)} {item.cost.toLocaleString()}
                              </div>
                            )}

                            {item.notes && (
                              <div className="text-xs text-gray-400 mt-1">{item.notes}</div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => openEditItem(item)}
                              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Travel time indicator between items */}
                      {index < sortedItems.length - 1 && item.travelTimeToNext > 0 && (
                        <div className="flex items-center justify-center py-1">
                          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            <span>{formatDuration(item.travelTimeToNext)}</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Day total */}
            {sortedItems.length > 0 && (
              <div className="card p-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {t.travel.totalTime}
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatDuration(
                      sortedItems.reduce((sum, item) => sum + item.estimatedDuration + item.travelTimeToNext, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {t.travel.totalExpenses}
                  </span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {sortedItems
                      .filter(i => i.type !== 'hotel_checkin' && i.type !== 'hotel_checkout' && i.type !== 'flight_departure' && i.type !== 'flight_arrival')
                      .reduce((sum, item) => sum + item.cost, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Item Modal */}
      <Modal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        title={editingItem ? t.travel.editItem : t.travel.addItem}
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t.travel.itemName}</label>
            <input
              type="text"
              className="input"
              value={itemForm.name}
              onChange={e => setItemForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t.travel.itemType}</label>
            <select
              className="select"
              value={itemForm.type}
              onChange={e => setItemForm(prev => ({ ...prev, type: e.target.value as ItineraryItem['type'] }))}
            >
              <option value="attraction">{language === 'zh-TW' ? '景點' : 'Attraction'}</option>
              <option value="custom">{t.travel.custom}</option>
              <option value="hotel_checkin">{language === 'zh-TW' ? '飯店入住' : 'Hotel Check-in'}</option>
              <option value="hotel_checkout">{language === 'zh-TW' ? '飯店退房' : 'Hotel Check-out'}</option>
              <option value="flight_departure">{language === 'zh-TW' ? '航班出發' : 'Flight Departure'}</option>
              <option value="flight_arrival">{language === 'zh-TW' ? '航班抵達' : 'Flight Arrival'}</option>
            </select>
          </div>
          <div>
            <label className="label">{t.travel.startTime} ({t.common.optional})</label>
            <input
              type="time"
              className="input"
              value={itemForm.startTime}
              onChange={e => setItemForm(prev => ({ ...prev, startTime: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.travel.stayDuration}</label>
              <input
                type="number"
                className="input"
                value={itemForm.estimatedDuration}
                onChange={e => setItemForm(prev => ({ ...prev, estimatedDuration: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="label">{t.travel.travelTime}</label>
              <input
                type="number"
                className="input"
                value={itemForm.travelTimeToNext}
                onChange={e => setItemForm(prev => ({ ...prev, travelTimeToNext: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.travel.cost}</label>
              <input
                type="number"
                className="input"
                value={itemForm.cost || ''}
                onChange={e => setItemForm(prev => ({ ...prev, cost: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="label">{t.common.currency}</label>
              <select
                className="select"
                value={itemForm.currency}
                onChange={e => setItemForm(prev => ({ ...prev, currency: e.target.value as TravelCurrency }))}
              >
                {TRAVEL_CURRENCIES.map(c => (
                  <option key={c.value} value={c.value}>{c.symbol} {c.value}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t.common.notes} ({t.common.optional})</label>
            <textarea
              className="input"
              rows={2}
              value={itemForm.notes}
              onChange={e => setItemForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowItemModal(false)} className="btn">{t.common.cancel}</button>
            <button onClick={saveItem} className="btn-primary">{t.common.save}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ItineraryContent />
    </Suspense>
  );
}
