'use client';

import { StockQuote, Currency } from '@/types';
import { parseStockSymbol } from '@/utils/calculations';

// Yahoo Finance query endpoint (using a CORS proxy for client-side requests)
const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Alternative: Use a CORS proxy service for client-side requests
const CORS_PROXY = 'https://corsproxy.io/?';

interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        currency: string;
        previousClose: number;
      };
    }>;
    error: null | { code: string; description: string };
  };
}

// Fetch stock quote from Yahoo Finance
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const { cleanSymbol } = parseStockSymbol(symbol);
    const url = `${CORS_PROXY}${encodeURIComponent(`${YAHOO_FINANCE_BASE}/${cleanSymbol}`)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: YahooFinanceResponse = await response.json();

    if (data.chart.error || !data.chart.result?.[0]) {
      console.error('Yahoo Finance error:', data.chart.error);
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
    const url = `${CORS_PROXY}${encodeURIComponent(`${YAHOO_FINANCE_BASE}/USDTWD=X`)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: YahooFinanceResponse = await response.json();

    if (data.chart.error || !data.chart.result?.[0]) {
      console.error('Failed to fetch exchange rate');
      return null;
    }

    return data.chart.result[0].meta.regularMarketPrice;
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    return null;
  }
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

  return { fetchPrices, fetchExchangeRate };
}
