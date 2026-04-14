'use client';

import { StockQuote, Currency } from '@/types';
import { parseStockSymbol } from '@/utils/calculations';

// Yahoo Finance query endpoint (v8 chart API)
const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Free CORS proxy services (fallback chain) - Updated 2024
// These proxies help bypass CORS restrictions for client-side requests
const DEFAULT_CORS_PROXIES = [
  '', // Try direct first (works in some environments like localhost)
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://proxy.cors.sh/',
  'https://thingproxy.freeboard.io/fetch/',
];

// Store custom proxy URL (can be set from settings)
let customCorsProxy: string | null = null;

// Set custom CORS proxy (e.g., from Cloudflare Worker)
export function setCustomCorsProxy(proxyUrl: string | undefined) {
  if (proxyUrl && proxyUrl.trim()) {
    // Normalize proxy URL - ensure it ends with ?url= for query parameter style
    let url = proxyUrl.trim();
    // Remove trailing slash if present
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    // Add ?url= if not present
    if (!url.endsWith('?url=') && !url.includes('?')) {
      url = `${url}/?url=`;
    } else if (url.endsWith('?')) {
      url = `${url}url=`;
    } else if (!url.endsWith('?url=')) {
      url = `${url}&url=`;
    }
    customCorsProxy = url;
    console.log('[Yahoo Finance] Custom CORS proxy set:', customCorsProxy);
  } else {
    customCorsProxy = null;
  }
}

// Get current custom proxy (for debugging)
export function getCustomCorsProxy(): string | null {
  return customCorsProxy;
}

// Get current CORS proxies (custom first if set)
function getCorsProxies(): string[] {
  if (customCorsProxy) {
    // If custom proxy is set, try it first, then fall back to defaults
    return [customCorsProxy, ...DEFAULT_CORS_PROXIES];
  }
  return DEFAULT_CORS_PROXIES;
}

// Track which proxy was used for the last successful request
let lastUsedProxy: string | null = null;

// Get the last used proxy (for debugging/display)
export function getLastUsedProxy(): string {
  if (lastUsedProxy === null) return 'None';
  if (lastUsedProxy === '') return 'Direct';
  if (lastUsedProxy === customCorsProxy) return 'Custom Proxy';
  return 'Public Proxy';
}

// Try fetching with different methods until one works
async function fetchWithProxy(targetUrl: string): Promise<Response> {
  let lastError: Error | null = null;
  const proxies = getCorsProxies();

  for (let i = 0; i < proxies.length; i++) {
    const proxy = proxies[i];
    const proxyName = proxy === '' ? 'direct' : (proxy === customCorsProxy ? 'custom proxy' : `public proxy ${i}`);

    try {
      const url = proxy ? `${proxy}${encodeURIComponent(targetUrl)}` : targetUrl;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      console.log(`[Yahoo Finance] Trying ${proxyName}...`);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: proxy ? {} : {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        lastUsedProxy = proxy;
        console.log(`[Yahoo Finance] Success with ${proxyName}`);
        return response;
      } else {
        console.log(`[Yahoo Finance] ${proxyName} returned status ${response.status}`);
      }
    } catch (error) {
      console.log(`[Yahoo Finance] ${proxyName} failed:`, (error as Error).message);
      lastError = error as Error;
      continue;
    }
  }

  throw lastError || new Error('All fetch methods failed');
}

interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        currency: string;
        previousClose: number;
      };
      timestamp?: number[];
      indicators?: {
        quote: Array<{
          close: (number | null)[];
        }>;
      };
    }>;
    error: null | { code: string; description: string };
  };
}

// Stock price with moving averages and historical data
export interface StockPriceWithMA {
  symbol: string;
  currentPrice: number;
  movingAvg3M: number;
  movingAvg1Y: number;
  currency: Currency;
  lastUpdated: string;
  historicalPrices: Record<string, number>;  // date string (YYYY-MM-DD) -> price
}

// Fetch stock quote from Yahoo Finance
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const { cleanSymbol } = parseStockSymbol(symbol);
    const targetUrl = `${YAHOO_FINANCE_BASE}/${cleanSymbol}`;

    const response = await fetchWithProxy(targetUrl);
    const data: YahooFinanceResponse = await response.json();

    if (data.chart?.error || !data.chart?.result?.[0]) {
      console.error('Yahoo Finance error:', data.chart?.error);
      return null;
    }

    const result = data.chart.result[0];
    const meta = result.meta;

    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    // Determine currency
    let currency: Currency = 'USD';
    if (meta.currency === 'TWD') {
      currency = 'TWD';
    }

    return {
      symbol: cleanSymbol,
      price,
      currency,
      change,
      changePercent,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

// Fetch multiple stock quotes
export async function fetchMultipleQuotes(
  symbols: string[]
): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();

  // Fetch in parallel with a small delay between batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map((symbol) => fetchStockQuote(symbol));
    const quotes = await Promise.all(promises);

    quotes.forEach((quote, index) => {
      if (quote) {
        results.set(batch[index], quote);
      }
    });

    // Small delay between batches
    if (i + batchSize < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

// Fetch exchange rate (USD to TWD)
export async function fetchExchangeRate(): Promise<number | null> {
  try {
    // Use Yahoo Finance to get USD/TWD exchange rate
    const targetUrl = `${YAHOO_FINANCE_BASE}/USDTWD=X`;

    const response = await fetchWithProxy(targetUrl);
    const data: YahooFinanceResponse = await response.json();

    if (data.chart?.error || !data.chart?.result?.[0]) {
      console.error('Failed to fetch exchange rate');
      return null;
    }

    return data.chart.result[0].meta.regularMarketPrice;
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    return null;
  }
}

// Fetch stock quote with moving averages (1Y of daily data)
export async function fetchStockQuoteWithMA(symbol: string): Promise<StockPriceWithMA | null> {
  try {
    const { cleanSymbol } = parseStockSymbol(symbol);
    // Request 1 year of daily data
    const targetUrl = `${YAHOO_FINANCE_BASE}/${cleanSymbol}?interval=1d&range=1y`;

    const response = await fetchWithProxy(targetUrl);
    const data: YahooFinanceResponse = await response.json();

    if (data.chart?.error || !data.chart?.result?.[0]) {
      console.error('Yahoo Finance error:', data.chart?.error);
      return null;
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const closePrices = result.indicators?.quote?.[0]?.close || [];

    // Build historical prices map (date -> price)
    const historicalPrices: Record<string, number> = {};
    const validPrices: number[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const price = closePrices[i];
      if (price !== null && price !== undefined) {
        validPrices.push(price);
        // Convert timestamp to date string (YYYY-MM-DD)
        const date = new Date(timestamps[i] * 1000);
        const dateStr = date.toISOString().split('T')[0];
        historicalPrices[dateStr] = price;
      }
    }

    if (validPrices.length === 0) {
      return null;
    }

    const currentPrice = meta.regularMarketPrice;

    // Calculate 3-month MA (approximately 63 trading days)
    const prices3M = validPrices.slice(-63);
    const movingAvg3M = prices3M.length > 0
      ? prices3M.reduce((sum, p) => sum + p, 0) / prices3M.length
      : currentPrice;

    // Calculate 1-year MA (all available data, up to ~252 trading days)
    const movingAvg1Y = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length;

    // Determine currency
    let currency: Currency = 'USD';
    if (meta.currency === 'TWD') {
      currency = 'TWD';
    }

    return {
      symbol: cleanSymbol,
      currentPrice,
      movingAvg3M,
      movingAvg1Y,
      currency,
      lastUpdated: new Date().toISOString(),
      historicalPrices,
    };
  } catch (error) {
    console.error(`Failed to fetch quote with MA for ${symbol}:`, error);
    return null;
  }
}

// Fetch multiple stock quotes with moving averages
export async function fetchMultipleQuotesWithMA(
  symbols: string[]
): Promise<Map<string, StockPriceWithMA>> {
  const results = new Map<string, StockPriceWithMA>();

  // Fetch in parallel with a small delay between batches to avoid rate limiting
  const batchSize = 3;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map((symbol) => fetchStockQuoteWithMA(symbol));
    const quotes = await Promise.all(promises);

    quotes.forEach((quote, index) => {
      if (quote) {
        results.set(batch[index], quote);
      }
    });

    // Small delay between batches
    if (i + batchSize < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

// Hook for fetching stock prices
export function useStockPrices() {
  const fetchPrices = async (
    symbols: string[]
  ): Promise<Record<string, { price: number; currency: Currency }>> => {
    const quotes = await fetchMultipleQuotes(symbols);
    const prices: Record<string, { price: number; currency: Currency }> = {};

    quotes.forEach((quote, symbol) => {
      prices[symbol] = {
        price: quote.price,
        currency: quote.currency,
      };
    });

    return prices;
  };

  // Fetch prices with moving averages
  const fetchPricesWithMA = async (
    symbols: string[]
  ): Promise<Record<string, StockPriceWithMA>> => {
    const quotes = await fetchMultipleQuotesWithMA(symbols);
    const prices: Record<string, StockPriceWithMA> = {};

    quotes.forEach((quote, symbol) => {
      prices[symbol] = quote;
    });

    return prices;
  };

  return { fetchPrices, fetchPricesWithMA, fetchExchangeRate };
}
