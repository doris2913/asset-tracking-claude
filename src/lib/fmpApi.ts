'use client';

import { StockQuote, Currency } from '@/types';
import { parseStockSymbol } from '@/utils/calculations';

// Financial Modeling Prep API - Free tier: 250 calls/day
// https://site.financialmodelingprep.com/developer/docs
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

interface FMPQuoteResponse {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

interface FMPForexResponse {
  ticker: string;
  bid: number;
  ask: number;
  open: number;
  low: number;
  high: number;
  changes: number;
  date: string;
}

// Fetch stock quote from Financial Modeling Prep
export async function fetchFMPQuote(
  symbol: string,
  apiKey: string
): Promise<StockQuote | null> {
  try {
    const { cleanSymbol, isTW } = parseStockSymbol(symbol);

    // FMP supports various markets including some international stocks
    let fmpSymbol = cleanSymbol;

    if (isTW) {
      // FMP may support TW stocks with .TW suffix
      const numericPart = cleanSymbol.replace('.TW', '').replace('.TWO', '');
      // Try Taiwan Stock Exchange format
      fmpSymbol = `${numericPart}.TW`;
    }

    const url = `${FMP_BASE}/quote/${encodeURIComponent(fmpSymbol)}?apikey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FMPQuoteResponse[] = await response.json();

    if (!data || data.length === 0 || !data[0].price) {
      // If TW format didn't work, try without suffix for FMP's international listing
      if (isTW) {
        const numericPart = cleanSymbol.replace('.TW', '').replace('.TWO', '');
        const altUrl = `${FMP_BASE}/quote/${encodeURIComponent(numericPart)}.TWO?apikey=${apiKey}`;
        const altResponse = await fetch(altUrl);
        if (altResponse.ok) {
          const altData: FMPQuoteResponse[] = await altResponse.json();
          if (altData && altData.length > 0 && altData[0].price) {
            return {
              symbol: cleanSymbol,
              price: altData[0].price,
              currency: 'TWD',
              change: altData[0].change || 0,
              changePercent: altData[0].changesPercentage || 0,
              lastUpdated: new Date().toISOString(),
            };
          }
        }
      }
      console.error('FMP: No data for symbol', symbol);
      return null;
    }

    const quote = data[0];

    // Determine currency based on exchange
    let currency: Currency = 'USD';
    if (isTW || quote.exchange?.includes('Taiwan') || quote.exchange?.includes('TWS')) {
      currency = 'TWD';
    }

    return {
      symbol: cleanSymbol,
      price: quote.price,
      currency,
      change: quote.change || 0,
      changePercent: quote.changesPercentage || 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to fetch FMP quote for ${symbol}:`, error);
    return null;
  }
}

// Fetch exchange rate from FMP
export async function fetchFMPExchangeRate(apiKey: string): Promise<number | null> {
  try {
    const url = `${FMP_BASE}/fx/USDTWD?apikey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      // Try alternative forex endpoint
      const altUrl = `${FMP_BASE}/quote/USDTWD?apikey=${apiKey}`;
      const altResponse = await fetch(altUrl);
      if (altResponse.ok) {
        const altData: FMPForexResponse[] = await altResponse.json();
        if (altData && altData.length > 0) {
          return altData[0].bid || altData[0].ask;
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FMPForexResponse[] = await response.json();

    if (data && data.length > 0 && (data[0].bid || data[0].ask)) {
      return data[0].bid || data[0].ask;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch FMP exchange rate:', error);
    return null;
  }
}

// Fetch multiple quotes from FMP
// Note: FMP supports batch quotes which is more efficient
export async function fetchMultipleFMPQuotes(
  symbols: string[],
  apiKey: string
): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();

  // Separate TW and US stocks for different handling
  const twSymbols: string[] = [];
  const usSymbols: string[] = [];

  symbols.forEach((symbol) => {
    const { isTW } = parseStockSymbol(symbol);
    if (isTW) {
      twSymbols.push(symbol);
    } else {
      usSymbols.push(symbol);
    }
  });

  // Batch fetch US stocks (FMP supports comma-separated symbols)
  if (usSymbols.length > 0) {
    try {
      const cleanSymbols = usSymbols.map((s) => parseStockSymbol(s).cleanSymbol);
      const url = `${FMP_BASE}/quote/${cleanSymbols.join(',')}?apikey=${apiKey}`;
      const response = await fetch(url);

      if (response.ok) {
        const data: FMPQuoteResponse[] = await response.json();
        if (data && Array.isArray(data)) {
          data.forEach((quote) => {
            const originalSymbol = usSymbols.find(
              (s) => parseStockSymbol(s).cleanSymbol === quote.symbol
            );
            if (originalSymbol && quote.price) {
              results.set(originalSymbol, {
                symbol: quote.symbol,
                price: quote.price,
                currency: 'USD',
                change: quote.change || 0,
                changePercent: quote.changesPercentage || 0,
                lastUpdated: new Date().toISOString(),
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('FMP batch fetch error:', error);
    }
  }

  // Fetch TW stocks individually (may have different formats)
  for (const symbol of twSymbols) {
    const quote = await fetchFMPQuote(symbol, apiKey);
    if (quote) {
      results.set(symbol, quote);
    }
    // Small delay for rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

// Get stock with moving averages (FMP provides 50 and 200 day MA)
export interface FMPStockWithMA {
  symbol: string;
  currentPrice: number;
  movingAvg50: number;
  movingAvg200: number;
  currency: Currency;
  lastUpdated: string;
}

export async function fetchFMPQuoteWithMA(
  symbol: string,
  apiKey: string
): Promise<FMPStockWithMA | null> {
  try {
    const { cleanSymbol, isTW } = parseStockSymbol(symbol);

    let fmpSymbol = cleanSymbol;
    if (isTW) {
      const numericPart = cleanSymbol.replace('.TW', '').replace('.TWO', '');
      fmpSymbol = `${numericPart}.TW`;
    }

    const url = `${FMP_BASE}/quote/${encodeURIComponent(fmpSymbol)}?apikey=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data: FMPQuoteResponse[] = await response.json();

    if (!data || data.length === 0 || !data[0].price) {
      return null;
    }

    const quote = data[0];
    const currency: Currency = isTW ? 'TWD' : 'USD';

    return {
      symbol: cleanSymbol,
      currentPrice: quote.price,
      movingAvg50: quote.priceAvg50 || quote.price,
      movingAvg200: quote.priceAvg200 || quote.price,
      currency,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to fetch FMP quote with MA for ${symbol}:`, error);
    return null;
  }
}
