'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  TravelData,
  TravelPlan,
  Flight,
  Hotel,
  Attraction,
  DailyItinerary,
  ItineraryItem,
  DEFAULT_TRAVEL_DATA,
  TravelCurrency,
  calculateNights,
  generateDateRange,
} from '@/types/travel';
import { generateId } from '@/utils/calculations';

const STORAGE_KEY = 'travel-data';

export function useTravelData() {
  const [data, setData] = useLocalStorage<TravelData>(STORAGE_KEY, DEFAULT_TRAVEL_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Get active plan
  const activePlan = useMemo(() => {
    if (!data.activePlanId) return null;
    return data.plans.find(p => p.id === data.activePlanId) || null;
  }, [data.plans, data.activePlanId]);

  // Set active plan
  const setActivePlan = useCallback((planId: string | null) => {
    setData(prev => ({ ...prev, activePlanId: planId }));
  }, [setData]);

  // Helper to update active plan
  const updateActivePlan = useCallback((updater: (plan: TravelPlan) => TravelPlan) => {
    setData(prev => {
      if (!prev.activePlanId) return prev;
      return {
        ...prev,
        plans: prev.plans.map(p =>
          p.id === prev.activePlanId
            ? { ...updater(p), lastModified: new Date().toISOString() }
            : p
        ),
      };
    });
  }, [setData]);

  // ========== Plan CRUD ==========

  const addPlan = useCallback((plan: Omit<TravelPlan, 'id' | 'dateCreated' | 'lastModified' | 'flights' | 'hotels' | 'dailyItineraries' | 'unconfirmedAttractions'>) => {
    const newPlan: TravelPlan = {
      ...plan,
      id: generateId(),
      flights: [],
      hotels: [],
      dailyItineraries: [],
      unconfirmedAttractions: [],
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    // Auto-generate daily itineraries for each day
    const dates = generateDateRange(plan.startDate, plan.endDate);
    newPlan.dailyItineraries = dates.map((date, index) => ({
      id: generateId(),
      date,
      title: `Day ${index + 1}`,
      items: [],
    }));

    setData(prev => ({
      ...prev,
      plans: [...prev.plans, newPlan],
      activePlanId: newPlan.id,
    }));

    return newPlan;
  }, [setData]);

  const updatePlan = useCallback((id: string, updates: Partial<Pick<TravelPlan, 'name' | 'destination' | 'startDate' | 'endDate' | 'defaultCurrency' | 'notes'>>) => {
    setData(prev => {
      const planIndex = prev.plans.findIndex(p => p.id === id);
      if (planIndex === -1) return prev;

      const plan = prev.plans[planIndex];
      const updatedPlan = { ...plan, ...updates, lastModified: new Date().toISOString() };

      // If dates changed, regenerate daily itineraries (preserving existing data)
      if (updates.startDate || updates.endDate) {
        const newStart = updates.startDate || plan.startDate;
        const newEnd = updates.endDate || plan.endDate;
        const newDates = generateDateRange(newStart, newEnd);

        const existingByDate = new Map(plan.dailyItineraries.map(d => [d.date, d]));
        updatedPlan.dailyItineraries = newDates.map((date, index) => {
          const existing = existingByDate.get(date);
          if (existing) return existing;
          return {
            id: generateId(),
            date,
            title: `Day ${index + 1}`,
            items: [],
          };
        });
      }

      const updatedPlans = [...prev.plans];
      updatedPlans[planIndex] = updatedPlan;

      return { ...prev, plans: updatedPlans };
    });
  }, [setData]);

  const deletePlan = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      plans: prev.plans.filter(p => p.id !== id),
      activePlanId: prev.activePlanId === id ? null : prev.activePlanId,
    }));
  }, [setData]);

  // ========== Flight CRUD ==========

  const addFlight = useCallback((flight: Omit<Flight, 'id'>) => {
    const newFlight: Flight = { ...flight, id: generateId() };
    updateActivePlan(plan => ({
      ...plan,
      flights: [...plan.flights, newFlight],
    }));
    return newFlight;
  }, [updateActivePlan]);

  const updateFlight = useCallback((id: string, updates: Partial<Omit<Flight, 'id'>>) => {
    updateActivePlan(plan => ({
      ...plan,
      flights: plan.flights.map(f => f.id === id ? { ...f, ...updates } : f),
    }));
  }, [updateActivePlan]);

  const deleteFlight = useCallback((id: string) => {
    updateActivePlan(plan => ({
      ...plan,
      flights: plan.flights.filter(f => f.id !== id),
    }));
  }, [updateActivePlan]);

  // ========== Hotel CRUD ==========

  const addHotel = useCallback((hotel: Omit<Hotel, 'id'>) => {
    const newHotel: Hotel = { ...hotel, id: generateId() };

    updateActivePlan(plan => {
      const updatedPlan = {
        ...plan,
        hotels: [...plan.hotels, newHotel],
      };
      // Auto-add hotel check-in/check-out to daily itineraries
      return autoAddHotelToItineraries(updatedPlan, newHotel);
    });

    return newHotel;
  }, [updateActivePlan]);

  const updateHotel = useCallback((id: string, updates: Partial<Omit<Hotel, 'id'>>) => {
    updateActivePlan(plan => {
      // Remove old hotel references from itineraries
      let updatedPlan = removeHotelFromItineraries(plan, id);
      // Update hotel
      updatedPlan = {
        ...updatedPlan,
        hotels: updatedPlan.hotels.map(h => h.id === id ? { ...h, ...updates } : h),
      };
      // Re-add hotel to itineraries with new dates
      const updatedHotel = updatedPlan.hotels.find(h => h.id === id);
      if (updatedHotel) {
        updatedPlan = autoAddHotelToItineraries(updatedPlan, updatedHotel);
      }
      return updatedPlan;
    });
  }, [updateActivePlan]);

  const deleteHotel = useCallback((id: string) => {
    updateActivePlan(plan => {
      const updatedPlan = removeHotelFromItineraries(plan, id);
      return {
        ...updatedPlan,
        hotels: updatedPlan.hotels.filter(h => h.id !== id),
      };
    });
  }, [updateActivePlan]);

  // ========== Unconfirmed Attraction CRUD ==========

  const addUnconfirmedAttraction = useCallback((attraction: Omit<Attraction, 'id'>) => {
    const newAttraction: Attraction = { ...attraction, id: generateId() };
    updateActivePlan(plan => ({
      ...plan,
      unconfirmedAttractions: [...plan.unconfirmedAttractions, newAttraction],
    }));
    return newAttraction;
  }, [updateActivePlan]);

  const updateUnconfirmedAttraction = useCallback((id: string, updates: Partial<Omit<Attraction, 'id'>>) => {
    updateActivePlan(plan => ({
      ...plan,
      unconfirmedAttractions: plan.unconfirmedAttractions.map(a =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  }, [updateActivePlan]);

  const deleteUnconfirmedAttraction = useCallback((id: string) => {
    updateActivePlan(plan => ({
      ...plan,
      unconfirmedAttractions: plan.unconfirmedAttractions.filter(a => a.id !== id),
    }));
  }, [updateActivePlan]);

  // Confirm an attraction and add it to a specific day's itinerary
  const confirmAttraction = useCallback((attractionId: string, dayDate: string) => {
    updateActivePlan(plan => {
      const attraction = plan.unconfirmedAttractions.find(a => a.id === attractionId);
      if (!attraction) return plan;

      const dayIndex = plan.dailyItineraries.findIndex(d => d.date === dayDate);
      if (dayIndex === -1) return plan;

      const newItem: ItineraryItem = {
        id: generateId(),
        type: 'attraction',
        referenceId: attraction.id,
        name: attraction.name,
        estimatedDuration: attraction.estimatedDuration,
        travelTimeToNext: 0,
        cost: attraction.cost,
        currency: attraction.currency,
        notes: attraction.notes,
        order: plan.dailyItineraries[dayIndex].items.length,
      };

      const updatedItineraries = [...plan.dailyItineraries];
      updatedItineraries[dayIndex] = {
        ...updatedItineraries[dayIndex],
        items: [...updatedItineraries[dayIndex].items, newItem],
      };

      return {
        ...plan,
        unconfirmedAttractions: plan.unconfirmedAttractions.filter(a => a.id !== attractionId),
        dailyItineraries: updatedItineraries,
      };
    });
  }, [updateActivePlan]);

  // ========== Daily Itinerary Operations ==========

  const updateDayTitle = useCallback((dayDate: string, title: string) => {
    updateActivePlan(plan => ({
      ...plan,
      dailyItineraries: plan.dailyItineraries.map(d =>
        d.date === dayDate ? { ...d, title } : d
      ),
    }));
  }, [updateActivePlan]);

  const updateDayNotes = useCallback((dayDate: string, notes: string) => {
    updateActivePlan(plan => ({
      ...plan,
      dailyItineraries: plan.dailyItineraries.map(d =>
        d.date === dayDate ? { ...d, notes } : d
      ),
    }));
  }, [updateActivePlan]);

  // Add a custom item to a day's itinerary
  const addItineraryItem = useCallback((dayDate: string, item: Omit<ItineraryItem, 'id' | 'order'>) => {
    const newItem: ItineraryItem = {
      ...item,
      id: generateId(),
      order: 0, // will be set below
    };

    updateActivePlan(plan => {
      const dayIndex = plan.dailyItineraries.findIndex(d => d.date === dayDate);
      if (dayIndex === -1) return plan;

      newItem.order = plan.dailyItineraries[dayIndex].items.length;

      const updatedItineraries = [...plan.dailyItineraries];
      updatedItineraries[dayIndex] = {
        ...updatedItineraries[dayIndex],
        items: [...updatedItineraries[dayIndex].items, newItem],
      };

      return { ...plan, dailyItineraries: updatedItineraries };
    });

    return newItem;
  }, [updateActivePlan]);

  // Update an itinerary item
  const updateItineraryItem = useCallback((dayDate: string, itemId: string, updates: Partial<Omit<ItineraryItem, 'id'>>) => {
    updateActivePlan(plan => ({
      ...plan,
      dailyItineraries: plan.dailyItineraries.map(d => {
        if (d.date !== dayDate) return d;
        return {
          ...d,
          items: d.items.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        };
      }),
    }));
  }, [updateActivePlan]);

  // Delete an itinerary item
  const deleteItineraryItem = useCallback((dayDate: string, itemId: string) => {
    updateActivePlan(plan => ({
      ...plan,
      dailyItineraries: plan.dailyItineraries.map(d => {
        if (d.date !== dayDate) return d;
        const filtered = d.items.filter(item => item.id !== itemId);
        return {
          ...d,
          items: filtered.map((item, index) => ({ ...item, order: index })),
        };
      }),
    }));
  }, [updateActivePlan]);

  // Reorder itinerary items (drag and drop)
  const reorderItineraryItems = useCallback((dayDate: string, fromIndex: number, toIndex: number) => {
    updateActivePlan(plan => ({
      ...plan,
      dailyItineraries: plan.dailyItineraries.map(d => {
        if (d.date !== dayDate) return d;
        const items = [...d.items].sort((a, b) => a.order - b.order);
        const [moved] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, moved);
        return {
          ...d,
          items: items.map((item, index) => ({ ...item, order: index })),
        };
      }),
    }));
  }, [updateActivePlan]);

  // ========== Cost Calculations ==========

  const costSummary = useMemo(() => {
    if (!activePlan) return { flights: 0, hotels: 0, attractions: 0, itineraryItems: 0, total: 0, byCurrency: {} as Record<string, number> };

    const byCurrency: Record<string, number> = {};

    const addCost = (amount: number, currency: TravelCurrency) => {
      if (amount > 0) {
        byCurrency[currency] = (byCurrency[currency] || 0) + amount;
      }
    };

    let flights = 0;
    let hotels = 0;
    let attractions = 0;
    let itineraryItems = 0;

    activePlan.flights.forEach(f => {
      flights += f.cost;
      addCost(f.cost, f.currency);
    });

    activePlan.hotels.forEach(h => {
      hotels += h.totalCost;
      addCost(h.totalCost, h.currency);
    });

    activePlan.unconfirmedAttractions.forEach(a => {
      attractions += a.cost;
      addCost(a.cost, a.currency);
    });

    activePlan.dailyItineraries.forEach(day => {
      day.items.forEach(item => {
        // Skip hotel items (already counted)
        if (item.type !== 'hotel_checkin' && item.type !== 'hotel_checkout' && item.type !== 'flight_departure' && item.type !== 'flight_arrival') {
          itineraryItems += item.cost;
          addCost(item.cost, item.currency);
        }
      });
    });

    return {
      flights,
      hotels,
      attractions,
      itineraryItems,
      total: flights + hotels + attractions + itineraryItems,
      byCurrency,
    };
  }, [activePlan]);

  // ========== Import/Export ==========

  const exportData = useCallback((): string => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const importData = useCallback((jsonString: string): boolean => {
    try {
      const imported = JSON.parse(jsonString) as TravelData;
      if (!imported.plans || !Array.isArray(imported.plans)) {
        throw new Error('Invalid travel data format');
      }
      setData(imported);
      return true;
    } catch (error) {
      console.error('Failed to import travel data:', error);
      return false;
    }
  }, [setData]);

  const clearAllData = useCallback(() => {
    setData(DEFAULT_TRAVEL_DATA);
  }, [setData]);

  return {
    // Data
    data,
    plans: data.plans,
    activePlan,
    isLoaded,

    // Plan operations
    addPlan,
    updatePlan,
    deletePlan,
    setActivePlan,

    // Flight operations
    addFlight,
    updateFlight,
    deleteFlight,

    // Hotel operations
    addHotel,
    updateHotel,
    deleteHotel,

    // Unconfirmed attraction operations
    addUnconfirmedAttraction,
    updateUnconfirmedAttraction,
    deleteUnconfirmedAttraction,
    confirmAttraction,

    // Itinerary operations
    updateDayTitle,
    updateDayNotes,
    addItineraryItem,
    updateItineraryItem,
    deleteItineraryItem,
    reorderItineraryItems,

    // Cost
    costSummary,

    // Import/Export
    exportData,
    importData,
    clearAllData,
  };
}

// ========== Helper Functions ==========

function autoAddHotelToItineraries(plan: TravelPlan, hotel: Hotel): TravelPlan {
  const updatedItineraries = plan.dailyItineraries.map(day => {
    const items = [...day.items];

    // Add check-in on check-in date
    if (day.date === hotel.checkInDate) {
      const hasCheckin = items.some(i => i.type === 'hotel_checkin' && i.referenceId === hotel.id);
      if (!hasCheckin) {
        items.push({
          id: generateId(),
          type: 'hotel_checkin',
          referenceId: hotel.id,
          name: `${hotel.name} (Check-in)`,
          estimatedDuration: 30,
          travelTimeToNext: 0,
          cost: 0,
          currency: hotel.currency,
          order: items.length,
        });
      }
    }

    // Add check-out on check-out date
    if (day.date === hotel.checkOutDate) {
      const hasCheckout = items.some(i => i.type === 'hotel_checkout' && i.referenceId === hotel.id);
      if (!hasCheckout) {
        items.unshift({
          id: generateId(),
          type: 'hotel_checkout',
          referenceId: hotel.id,
          name: `${hotel.name} (Check-out)`,
          estimatedDuration: 30,
          travelTimeToNext: 0,
          cost: 0,
          currency: hotel.currency,
          order: 0,
        });
        // Re-order remaining items
        for (let i = 1; i < items.length; i++) {
          items[i] = { ...items[i], order: i };
        }
      }
    }

    return { ...day, items };
  });

  return { ...plan, dailyItineraries: updatedItineraries };
}

function removeHotelFromItineraries(plan: TravelPlan, hotelId: string): TravelPlan {
  return {
    ...plan,
    dailyItineraries: plan.dailyItineraries.map(day => ({
      ...day,
      items: day.items
        .filter(item => item.referenceId !== hotelId || (item.type !== 'hotel_checkin' && item.type !== 'hotel_checkout'))
        .map((item, index) => ({ ...item, order: index })),
    })),
  };
}
