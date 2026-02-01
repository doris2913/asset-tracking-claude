'use client';

import { StockQuote, Currency, StockDataSource } from '@/types';
import { parseStockSymbol } from '@/utils/calculations';

// Cache configuration
const CACHE_KEY = 'asset-tracker-stock-cache';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

interface CachedStockPrice {
  price: number;
  currency: Currency;
  timestamp: number;
}

interface StockCache {
  [symbol: string]: CachedStockPrice;
}

// Load cache from localStorage
function loadCache(): StockCache {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

// Save cache to localStorage
function saveCache(cache: StockCache): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

// Check if cached price is still valid
function isCacheValid(cached: CachedStockPrice): boolean {
  return Date.now() - cached.timestamp < CACHE_DURATION_MS;
}

// Get cached price if valid
export function getCachedPrice(symbol: string): { price: number; currency: Currency } | null {
  const cache = loadCache();
  const cached = cache[symbol];
  if (cached && isCacheValid(cached)) {
    return { price: cached.price, currency: cached.currency };
  }
  return null;
}

// Save price to cache
function setCachedPrice(symbol: string, price: number, currency: Currency): void {
  const cache = loadCache();
  cache[symbol] = { price, currency, timestamp: Date.now() };
  saveCache(cache);
}

// Alpha Vantage API
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

interface AlphaVantageQuote {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

// Fetch stock quote from Alpha Vantage
export async function fetchAlphaVantageQuote(
  symbol: string,
  apiKey: string
): Promise<StockQuote | null> {
  try {
    const { cleanSymbol, isTW } = parseStockSymbol(symbol);

    // Alpha Vantage uses different symbol formats for TW stocks
    // Try multiple formats: .TPE (preferred), .TWO (OTC), and original
    const symbolsToTry: string[] = [];

    if (isTW) {
      // Extract the numeric part for Taiwan stocks
      const numericPart = cleanSymbol.replace('.TW', '').replace('.TWO', '');
      symbolsToTry.push(`${numericPart}.TPE`);  // Main exchange
      symbolsToTry.push(`${numericPart}.TWO`);  // OTC market
      symbolsToTry.push(cleanSymbol);  // Original format
    } else {
      symbolsToTry.push(cleanSymbol);
    }

    for (const avSymbol of symbolsToTry) {
      const url = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(avSymbol)}&apikey=${apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        continue;
      }

      const data: AlphaVantageQuote = await response.json();

      // Check for rate limit error
      const dataObj = data as unknown as Record<string, unknown>;
      if ('Note' in dataObj || 'Information' in dataObj) {
        console.warn('Alpha Vantage: Rate limit reached');
        return null;
      }

      if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
        continue;  // Try next symbol format
      }

      const quote = data['Global Quote'];
      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change'] || '0');
      const changePercent = parseFloat((quote['10. change percent'] || '0%').replace('%', ''));

      // Determine currency based on symbol
      const currency: Currency = isTW ? 'TWD' : 'USD';

      // Cache the price
      setCachedPrice(cleanSymbol, price, currency);

      return {
        symbol: cleanSymbol,
        price,
        currency,
        change,
        changePercent,
        lastUpdated: new Date().toISOString(),
      };
    }

    console.error('Alpha Vantage: No data for symbol', symbol);
    return null;
  } catch (error) {
    console.error(`Failed to fetch Alpha Vantage quote for ${symbol}:`, error);
    return null;
  }
}

// Fetch exchange rate from Alpha Vantage
export async function fetchAlphaVantageExchangeRate(apiKey: string): Promise<number | null> {
  try {
    const url = `${ALPHA_VANTAGE_BASE}?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TWD&apikey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data['Realtime Currency Exchange Rate']) {
      console.error('Alpha Vantage: No exchange rate data');
      return null;
    }

    return parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
  } catch (error) {
    console.error('Failed to fetch Alpha Vantage exchange rate:', error);
    return null;
  }
}

// Fetch multiple quotes with caching (minimizes API calls)
export async function fetchMultipleQuotesWithCache(
  symbols: string[],
  dataSource: StockDataSource,
  apiKey?: string,
  fetchYahooQuote?: (symbol: string) => Promise<StockQuote | null>
): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  const symbolsToFetch: string[] = [];

  // Check cache first
  for (const symbol of symbols) {
    const { cleanSymbol } = parseStockSymbol(symbol);
    const cached = getCachedPrice(cleanSymbol);
    if (cached) {
      results.set(symbol, {
        symbol: cleanSymbol,
        price: cached.price,
        currency: cached.currency,
        change: 0,
        changePercent: 0,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      symbolsToFetch.push(symbol);
    }
  }

  // Fetch uncached symbols
  if (symbolsToFetch.length === 0) {
    return results;
  }

  if (dataSource === 'alphavantage' && apiKey) {
    // Alpha Vantage: fetch one by one with delay (rate limit: 5/min)
    for (let i = 0; i < symbolsToFetch.length; i++) {
      const symbol = symbolsToFetch[i];
      const quote = await fetchAlphaVantageQuote(symbol, apiKey);
      if (quote) {
        results.set(symbol, quote);
      }

      // Wait 12 seconds between requests (5 requests per minute limit)
      if (i < symbolsToFetch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 12000));
      }
    }
  } else if (fetchYahooQuote) {
    // Yahoo Finance: batch fetch
    const batchSize = 5;
    for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
      const batch = symbolsToFetch.slice(i, i + batchSize);
      const promises = batch.map(symbol => fetchYahooQuote(symbol));
      const quotes = await Promise.all(promises);

      quotes.forEach((quote, index) => {
        if (quote) {
          results.set(batch[index], quote);
          // Cache Yahoo Finance results too
          setCachedPrice(quote.symbol, quote.price, quote.currency);
        }
      });

      if (i + batchSize < symbolsToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  return results;
}

// Clear the stock price cache
export function clearStockCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
}

// Get cache statistics
export function getCacheStats(): { count: number; oldestAge: number } {
  const cache = loadCache();
  const entries = Object.values(cache);
  if (entries.length === 0) {
    return { count: 0, oldestAge: 0 };
  }

  const now = Date.now();
  const oldestTimestamp = Math.min(...entries.map(e => e.timestamp));
  const oldestAge = Math.floor((now - oldestTimestamp) / 1000 / 60); // in minutes

  return { count: entries.length, oldestAge };
}
