'use client';

// Best-effort NAV (淨值) fetcher for Taiwan-domiciled funds (fund_tw).
//
// Unlike Yahoo Finance (used for stocks and fund_us), there is no confirmed
// working data source wired up here yet. Candidate free/open sources
// researched:
//   - TDCC (集保結算所) OpenAPI, offshore-fund NAV dataset, documented at
//     https://openapi.tdcc.com.tw/tdcc-opendata-api-docs
//   - SITCA (投信投顧公會, sitca.org.tw), domestic fund NAV pages
//
// TODO(spike): the exact endpoint URL / JSON response shape below is an
// unverified best guess — this environment's network access could not reach
// either host to confirm the real contract (requests here got blocked at
// the network layer, not just CORS). Before relying on this in production,
// verify with real browser devtools against the endpoints above and adjust
// TDCC_NAV_ENDPOINT / parseNavResponse accordingly.
//
// This module must never throw and must never block the UI: any failure
// (network, parsing, unexpected shape) resolves to `null`, and manual value
// entry remains the guaranteed fallback for fund_tw assets (see AssetForm).

import { Currency } from '@/types';
import { fetchWithProxy } from './corsProxy';

const TDCC_NAV_ENDPOINT = 'https://openapi.tdcc.com.tw/opendata/data'; // TODO(spike): confirm real path

export interface TwFundNavResult {
  fundCode: string;
  price: number;
  currency: Currency; // always 'TWD'
  lastUpdated: string;
}

interface TdccNavRecord {
  基金代號?: string;
  fundCode?: string;
  淨值?: string | number;
  nav?: string | number;
  淨值日期?: string;
  navDate?: string;
}

function parseNavResponse(data: unknown, fundCode: string): TwFundNavResult | null {
  if (!Array.isArray(data)) return null;

  const record = (data as TdccNavRecord[]).find(
    (r) => r.基金代號 === fundCode || r.fundCode === fundCode
  );
  if (!record) return null;

  const rawNav = record.淨值 ?? record.nav;
  const price = typeof rawNav === 'number' ? rawNav : parseFloat(rawNav ?? '');
  if (!price || Number.isNaN(price)) return null;

  return {
    fundCode,
    price,
    currency: 'TWD',
    lastUpdated: new Date().toISOString(),
  };
}

// Fetch NAV for a single TW fund code. Returns null on any failure —
// callers should treat this as "auto-fetch unavailable", not an error.
export async function fetchTwFundNav(fundCode: string): Promise<TwFundNavResult | null> {
  if (!fundCode) return null;

  try {
    const targetUrl = `${TDCC_NAV_ENDPOINT}?fundCode=${encodeURIComponent(fundCode)}`;
    const response = await fetchWithProxy(targetUrl);
    const data = await response.json();
    return parseNavResponse(data, fundCode);
  } catch (error) {
    console.log(`[TW Fund NAV] Failed to fetch NAV for ${fundCode}:`, (error as Error).message);
    return null;
  }
}

// Fetch NAV for multiple TW fund codes. Best-effort per code — failures for
// one code don't affect the others, and the returned map simply omits any
// code that couldn't be resolved.
export async function fetchMultipleTwFundNav(
  fundCodes: string[]
): Promise<Map<string, TwFundNavResult>> {
  const results = new Map<string, TwFundNavResult>();

  for (const fundCode of fundCodes) {
    const result = await fetchTwFundNav(fundCode);
    if (result) {
      results.set(fundCode, result);
    }
    // Small delay to avoid hammering the (best-effort, possibly rate-limited) source
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return results;
}
