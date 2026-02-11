// Currency type for travel expenses
export type TravelCurrency = 'TWD' | 'USD' | 'JPY' | 'EUR' | 'GBP' | 'KRW' | 'CNY' | 'THB' | 'VND' | 'SGD' | 'HKD' | 'AUD';

export const TRAVEL_CURRENCIES: { value: TravelCurrency; label: string; labelZh: string; symbol: string }[] = [
  { value: 'TWD', label: 'TWD', labelZh: '台幣', symbol: 'NT$' },
  { value: 'USD', label: 'USD', labelZh: '美元', symbol: '$' },
  { value: 'JPY', label: 'JPY', labelZh: '日圓', symbol: '¥' },
  { value: 'EUR', label: 'EUR', labelZh: '歐元', symbol: '€' },
  { value: 'GBP', label: 'GBP', labelZh: '英鎊', symbol: '£' },
  { value: 'KRW', label: 'KRW', labelZh: '韓元', symbol: '₩' },
  { value: 'CNY', label: 'CNY', labelZh: '人民幣', symbol: '¥' },
  { value: 'THB', label: 'THB', labelZh: '泰銖', symbol: '฿' },
  { value: 'VND', label: 'VND', labelZh: '越南盾', symbol: '₫' },
  { value: 'SGD', label: 'SGD', labelZh: '新加坡幣', symbol: 'S$' },
  { value: 'HKD', label: 'HKD', labelZh: '港幣', symbol: 'HK$' },
  { value: 'AUD', label: 'AUD', labelZh: '澳幣', symbol: 'A$' },
];

// Flight information
export interface Flight {
  id: string;
  type: 'departure' | 'arrival'; // outbound or inbound flight
  date: string; // ISO date string (YYYY-MM-DD)
  flightNumber: string; // e.g., "BR108", "CI123"
  airline?: string;
  departureAirport: string; // e.g., "TPE"
  arrivalAirport: string; // e.g., "NRT"
  departureTime?: string; // HH:mm
  arrivalTime?: string; // HH:mm
  cost: number;
  currency: TravelCurrency;
  notes?: string;
}

// Hotel information
export interface Hotel {
  id: string;
  name: string;
  checkInDate: string; // ISO date string (YYYY-MM-DD)
  checkOutDate: string; // ISO date string (YYYY-MM-DD)
  address?: string;
  costPerNight: number;
  totalCost: number;
  currency: TravelCurrency;
  confirmationNumber?: string;
  phone?: string;
  link?: string;
  notes?: string;
}

// Attraction/point of interest
export interface Attraction {
  id: string;
  name: string;
  category: AttractionCategory;
  address?: string;
  cost: number;
  currency: TravelCurrency;
  estimatedDuration: number; // in minutes
  notes?: string;
  link?: string;
  openingHours?: string;
}

export type AttractionCategory =
  | 'restaurant'
  | 'museum'
  | 'park'
  | 'shopping'
  | 'temple'
  | 'landmark'
  | 'entertainment'
  | 'transportation'
  | 'other';

export const ATTRACTION_CATEGORIES: { value: AttractionCategory; label: string; labelZh: string; icon: string }[] = [
  { value: 'restaurant', label: 'Restaurant', labelZh: '餐廳', icon: '🍽️' },
  { value: 'museum', label: 'Museum', labelZh: '博物館', icon: '🏛️' },
  { value: 'park', label: 'Park', labelZh: '公園', icon: '🌳' },
  { value: 'shopping', label: 'Shopping', labelZh: '購物', icon: '🛍️' },
  { value: 'temple', label: 'Temple/Shrine', labelZh: '寺廟/神社', icon: '⛩️' },
  { value: 'landmark', label: 'Landmark', labelZh: '地標', icon: '🗼' },
  { value: 'entertainment', label: 'Entertainment', labelZh: '娛樂', icon: '🎭' },
  { value: 'transportation', label: 'Transportation', labelZh: '交通', icon: '🚃' },
  { value: 'other', label: 'Other', labelZh: '其他', icon: '📍' },
];

// Itinerary item in daily schedule
export interface ItineraryItem {
  id: string;
  type: 'attraction' | 'hotel_checkin' | 'hotel_checkout' | 'flight_departure' | 'flight_arrival' | 'custom';
  referenceId?: string; // ID of linked attraction/hotel/flight
  name: string;
  startTime?: string; // HH:mm
  estimatedDuration: number; // minutes at this location
  travelTimeToNext: number; // minutes to travel to next location
  cost: number;
  currency: TravelCurrency;
  notes?: string;
  order: number; // for ordering (drag-and-drop)
}

// Daily itinerary
export interface DailyItinerary {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  title: string; // custom title for the day
  items: ItineraryItem[];
  notes?: string;
}

// Travel plan
export interface TravelPlan {
  id: string;
  name: string; // e.g., "2026 Japan Trip"
  destination?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  flights: Flight[];
  hotels: Hotel[];
  dailyItineraries: DailyItinerary[];
  unconfirmedAttractions: Attraction[];
  defaultCurrency: TravelCurrency;
  notes?: string;
  dateCreated: string;
  lastModified: string;
}

// Complete travel data structure
export interface TravelData {
  plans: TravelPlan[];
  activePlanId: string | null;
  version: string;
}

// Default travel data
export const DEFAULT_TRAVEL_DATA: TravelData = {
  plans: [],
  activePlanId: null,
  version: '1.0.0',
};

// Helper: get flight tracking URL
export function getFlightTrackingUrl(flightNumber: string, date: string): string {
  // Use Flightera for tracking - works without API key
  const cleanNumber = flightNumber.replace(/\s/g, '').toUpperCase();
  return `https://www.flightera.net/flight/${cleanNumber}/${date}`;
}

// Helper: calculate number of nights
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Helper: format minutes to hours and minutes display
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// Helper: generate dates between start and end (inclusive)
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
