'use client';

import { StockQuote, StockPrice, Currency, StockDataSource, AppSettings } from '@/types';
import { parseStockSymbol } from '@/utils/calculations';
import { fetchStockQuote, fetchStockQuoteWithMA, fetchExchangeRate as fetchYahooExchangeRate } from './yahooFinance';
import { fetchAlphaVantageQuote, fetchAlphaVantageExchangeRate, getCachedPrice, clearStockCache as clearAVCache, getCacheStats } from './stockApi';
import { fetchFinnhubQuote, fetchFinnhubExchangeRate } from './finnhubApi';
import { fetchFMPQuote, fetchFMPExchangeRate, fetchFMPQuoteWithMA } from './fmpApi';

// Unified interface for stock price fetching
export interface StockPriceResult {
  success: boolean;
  quote?: StockQuote;
  priceWithMA?: StockPrice;
  error?: string;
  source: StockDataSource;
}

export interface ExchangeRateResult {
  success: boolean;
  rate?: number;
  error?: string;
  source: StockDataSource;
}

// Progress callback for batch operations
export type ProgressCallback = (current: number, total: number, symbol: string, status: 'fetching' | 'cached' | 'success' | 'failed') => void;

// API source configuration
interface ApiSourceConfig {
  name: StockDataSource;
  requiresKey: boolean;
  freeLimit: string;
  supportsTW: boolean;
  supportsMA: boolean;
  rateLimitMs: number;
}

export const API_SOURCE_CONFIG: Record<StockDataSource, ApiSourceConfig> = {
  yahoo: {
    name: 'yahoo',
    requiresKey: false,
    freeLimit: 'Unlimited (with CORS proxy)',
    supportsTW: true,
    supportsMA: true,
    rateLimitMs: 500,
  },
  alphavantage: {
    name: 'alphavantage',
    requiresKey: true,
    freeLimit: '25 requests/day',
    supportsTW: true,
    supportsMA: false,
    rateLimitMs: 12000, // 5 requests/minute
  },
  finnhub: {
    name: 'finnhub',
    requiresKey: true,
    freeLimit: '60 requests/minute',
    supportsTW: false, // Limited TW support
    supportsMA: false,
    rateLimitMs: 200,
  },
  fmp: {
    name: 'fmp',
    requiresKey: true,
    freeLimit: '250 requests/day',
    supportsTW: true,
    supportsMA: true, // Has 50/200 day MA
    rateLimitMs: 300,
  },
};

// Get API key from settings
function getApiKey(settings: AppSettings, source: StockDataSource): string | undefined {
  switch (source) {
    case 'alphavantage':
      return settings.alphaVantageApiKey;
    case 'finnhub':
      return settings.finnhubApiKey;
    case 'fmp':
      return settings.fmpApiKey;
    default:
      return undefined;
  }
}

// Fetch single stock price
export async function fetchStockPrice(
  symbol: string,
  settings: AppSettings
): Promise<StockPriceResult> {
  const source = settings.stockDataSource || 'yahoo';
  const apiKey = getApiKey(settings, source);

  // Check if API key is required but not provided
  if (API_SOURCE_CONFIG[source].requiresKey && !apiKey) {
    return {
      success: false,
      error: `API key required for ${source}`,
      source,
    };
  }

  try {
    let quote: StockQuote | null = null;

    switch (source) {
      case 'yahoo':
        quote = await fetchStockQuote(symbol);
        break;
      case 'alphavantage':
        quote = await fetchAlphaVantageQuote(symbol, apiKey!);
        break;
      case 'finnhub':
        quote = await fetchFinnhubQuote(symbol, apiKey!);
        break;
      case 'fmp':
        quote = await fetchFMPQuote(symbol, apiKey!);
        break;
    }

    if (quote) {
      return {
        success: true,
        quote,
        source,
      };
    }

    return {
      success: false,
      error: 'No data returned',
      source,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source,
    };
  }
}

// Fetch stock price with moving averages
export async function fetchStockPriceWithMA(
  symbol: string,
  settings: AppSettings
): Promise<StockPriceResult> {
  const source = settings.stockDataSource || 'yahoo';
  const apiKey = getApiKey(settings, source);

  // Check if API key is required but not provided
  if (API_SOURCE_CONFIG[source].requiresKey && !apiKey) {
    return {
      success: false,
      error: `API key required for ${source}`,
      source,
    };
  }

  try {
    let priceWithMA: StockPrice | null = null;

    switch (source) {
      case 'yahoo':
        const yahooResult = await fetchStockQuoteWithMA(symbol);
        if (yahooResult) {
          priceWithMA = {
            symbol: yahooResult.symbol,
            currentPrice: yahooResult.currentPrice,
            movingAvg3M: yahooResult.movingAvg3M,
            movingAvg1Y: yahooResult.movingAvg1Y,
            currency: yahooResult.currency,
            lastUpdated: yahooResult.lastUpdated,
            historicalPrices: yahooResult.historicalPrices,
          };
        }
        break;

      case 'fmp':
        const fmpResult = await fetchFMPQuoteWithMA(symbol, apiKey!);
        if (fmpResult) {
          // FMP provides 50 and 200 day MAs, approximate to 3M and 1Y
          priceWithMA = {
            symbol: fmpResult.symbol,
            currentPrice: fmpResult.currentPrice,
            movingAvg3M: fmpResult.movingAvg50, // ~3 months
            movingAvg1Y: fmpResult.movingAvg200, // ~10 months
            currency: fmpResult.currency,
            lastUpdated: fmpResult.lastUpdated,
          };
        }
        break;

      case 'alphavantage':
      case 'finnhub':
        // These don't support MA in free tier, just get current price
        const quote = source === 'alphavantage'
          ? await fetchAlphaVantageQuote(symbol, apiKey!)
          : await fetchFinnhubQuote(symbol, apiKey!);

        if (quote) {
          priceWithMA = {
            symbol: quote.symbol,
            currentPrice: quote.price,
            movingAvg3M: quote.price,
            movingAvg1Y: quote.price,
            currency: quote.currency,
            lastUpdated: quote.lastUpdated,
          };
        }
        break;
    }

    if (priceWithMA) {
      return {
        success: true,
        priceWithMA,
        source,
      };
    }

    return {
      success: false,
      error: 'No data returned',
      source,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source,
    };
  }
}

// Fetch multiple stock prices with progress reporting
export async function fetchMultipleStockPrices(
  symbols: string[],
  settings: AppSettings,
  onProgress?: ProgressCallback
): Promise<Record<string, StockPrice>> {
  const source = settings.stockDataSource || 'yahoo';
  const apiKey = getApiKey(settings, source);
  const config = API_SOURCE_CONFIG[source];
  const results: Record<string, StockPrice> = {};

  // Check if API key is required but not provided
  if (config.requiresKey && !apiKey) {
    console.error(`API key required for ${source}`);
    return results;
  }

  // For Alpha Vantage, check cache first
  if (source === 'alphavantage') {
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const { cleanSymbol } = parseStockSymbol(symbol);
      const cached = getCachedPrice(cleanSymbol);

      if (cached) {
        onProgress?.(i + 1, symbols.length, cleanSymbol, 'cached');
        results[symbol] = {
          symbol: cleanSymbol,
          currentPrice: cached.price,
          movingAvg3M: cached.price,
          movingAvg1Y: cached.price,
          currency: cached.currency,
          lastUpdated: new Date().toISOString(),
        };
        continue;
      }

      onProgress?.(i + 1, symbols.length, cleanSymbol, 'fetching');
      const result = await fetchStockPriceWithMA(symbol, settings);

      if (result.success && result.priceWithMA) {
        results[symbol] = result.priceWithMA;
        onProgress?.(i + 1, symbols.length, cleanSymbol, 'success');
      } else {
        onProgress?.(i + 1, symbols.length, cleanSymbol, 'failed');
      }

      // Wait between requests for rate-limited APIs
      if (i < symbols.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, config.rateLimitMs));
      }
    }
  } else {
    // For other sources, batch fetch
    const batchSize = source === 'yahoo' ? 3 : 5;

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);

      const promises = batch.map(async (symbol, index) => {
        onProgress?.(i + index + 1, symbols.length, parseStockSymbol(symbol).cleanSymbol, 'fetching');
        const result = await fetchStockPriceWithMA(symbol, settings);

        if (result.success && result.priceWithMA) {
          results[symbol] = result.priceWithMA;
          onProgress?.(i + index + 1, symbols.length, parseStockSymbol(symbol).cleanSymbol, 'success');
        } else {
          onProgress?.(i + index + 1, symbols.length, parseStockSymbol(symbol).cleanSymbol, 'failed');
        }
      });

      await Promise.all(promises);

      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise((resolve) => setTimeout(resolve, config.rateLimitMs));
      }
    }
  }

  return results;
}

// Fetch exchange rate (USD to TWD)
export async function fetchExchangeRate(settings: AppSettings): Promise<ExchangeRateResult> {
  const source = settings.stockDataSource || 'yahoo';
  const apiKey = getApiKey(settings, source);

  // Try primary source first
  try {
    let rate: number | null = null;

    switch (source) {
      case 'yahoo':
        rate = await fetchYahooExchangeRate();
        break;
      case 'alphavantage':
        if (apiKey) {
          rate = await fetchAlphaVantageExchangeRate(apiKey);
        }
        break;
      case 'finnhub':
        if (apiKey) {
          rate = await fetchFinnhubExchangeRate(apiKey);
        }
        break;
      case 'fmp':
        if (apiKey) {
          rate = await fetchFMPExchangeRate(apiKey);
        }
        break;
    }

    if (rate) {
      return {
        success: true,
        rate,
        source,
      };
    }
  } catch (error) {
    console.error(`Failed to fetch exchange rate from ${source}:`, error);
  }

  // Fallback to Yahoo Finance if primary source fails
  if (source !== 'yahoo') {
    try {
      const rate = await fetchYahooExchangeRate();
      if (rate) {
        return {
          success: true,
          rate,
          source: 'yahoo',
        };
      }
    } catch (error) {
      console.error('Fallback to Yahoo Finance failed:', error);
    }
  }

  return {
    success: false,
    error: 'Could not fetch exchange rate from any source',
    source,
  };
}

// Export cache functions
export { clearAVCache as clearStockCache, getCacheStats };

// Test API connection
export async function testApiConnection(
  source: StockDataSource,
  apiKey?: string
): Promise<{ success: boolean; message: string }> {
  try {
    switch (source) {
      case 'yahoo':
        const yahooQuote = await fetchStockQuote('AAPL');
        return yahooQuote
          ? { success: true, message: `Yahoo Finance working. AAPL: $${yahooQuote.price.toFixed(2)}` }
          : { success: false, message: 'Yahoo Finance returned no data' };

      case 'alphavantage':
        if (!apiKey) return { success: false, message: 'API key required' };
        const avQuote = await fetchAlphaVantageQuote('AAPL', apiKey);
        return avQuote
          ? { success: true, message: `Alpha Vantage working. AAPL: $${avQuote.price.toFixed(2)}` }
          : { success: false, message: 'Alpha Vantage returned no data. Check API key.' };

      case 'finnhub':
        if (!apiKey) return { success: false, message: 'API key required' };
        const fhQuote = await fetchFinnhubQuote('AAPL', apiKey);
        return fhQuote
          ? { success: true, message: `Finnhub working. AAPL: $${fhQuote.price.toFixed(2)}` }
          : { success: false, message: 'Finnhub returned no data. Check API key.' };

      case 'fmp':
        if (!apiKey) return { success: false, message: 'API key required' };
        const fmpQuote = await fetchFMPQuote('AAPL', apiKey);
        return fmpQuote
          ? { success: true, message: `FMP working. AAPL: $${fmpQuote.price.toFixed(2)}` }
          : { success: false, message: 'FMP returned no data. Check API key.' };

      default:
        return { success: false, message: 'Unknown API source' };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}
