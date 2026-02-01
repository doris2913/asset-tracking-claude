'use client';

import { StockQuote, Currency } from '@/types';
import { parseStockSymbol } from '@/utils/calculations';

// Finnhub API - Free tier: 60 calls/minute
// https://finnhub.io/docs/api
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

interface FinnhubQuoteResponse {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

interface FinnhubExchangeRateResponse {
  quote: {
    c: number;  // Current rate
  };
}

// Fetch stock quote from Finnhub
export async function fetchFinnhubQuote(
  symbol: string,
  apiKey: string
): Promise<StockQuote | null> {
  try {
    const { cleanSymbol, isTW } = parseStockSymbol(symbol);

    // Finnhub primarily supports US stocks
    // For TW stocks, we need to use different symbols or return null
    let finnhubSymbol = cleanSymbol;

    if (isTW) {
      // Finnhub doesn't have great TW stock support
      // Try with the numeric code directly or return null
      const numericPart = cleanSymbol.replace('.TW', '').replace('.TWO', '');
      // Some TW stocks might be available with different formatting
      finnhubSymbol = `${numericPart}.TW`;
    }

    const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FinnhubQuoteResponse = await response.json();

    // Check if we got valid data (c=0 means no data)
    if (!data.c || data.c === 0) {
      console.error('Finnhub: No data for symbol', symbol);
      return null;
    }

    // Determine currency based on symbol
    const currency: Currency = isTW ? 'TWD' : 'USD';

    return {
      symbol: cleanSymbol,
      price: data.c,
      currency,
      change: data.d || 0,
      changePercent: data.dp || 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to fetch Finnhub quote for ${symbol}:`, error);
    return null;
  }
}

// Fetch exchange rate from Finnhub (Forex)
export async function fetchFinnhubExchangeRate(apiKey: string): Promise<number | null> {
  try {
    // Finnhub forex endpoint
    const url = `${FINNHUB_BASE}/forex/rates?base=USD&token=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.quote && data.quote.TWD) {
      return data.quote.TWD;
    }

    // Fallback: Try forex symbol
    const symbolUrl = `${FINNHUB_BASE}/quote?symbol=USDTWD&token=${apiKey}`;
    const symbolResponse = await fetch(symbolUrl);
    if (symbolResponse.ok) {
      const symbolData: FinnhubQuoteResponse = await symbolResponse.json();
      if (symbolData.c && symbolData.c > 0) {
        return symbolData.c;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch Finnhub exchange rate:', error);
    return null;
  }
}

// Fetch multiple quotes from Finnhub
export async function fetchMultipleFinnhubQuotes(
  symbols: string[],
  apiKey: string
): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();

  // Finnhub allows 60 calls/min, so we can be more aggressive
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map((symbol) => fetchFinnhubQuote(symbol, apiKey));
    const quotes = await Promise.all(promises);

    quotes.forEach((quote, index) => {
      if (quote) {
        results.set(batch[index], quote);
      }
    });

    // Small delay between batches
    if (i + batchSize < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}
