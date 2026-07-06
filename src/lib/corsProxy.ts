// Shared CORS-proxy fallback chain used by any client-side fetch to a
// third-party API that doesn't allow direct browser requests (Yahoo Finance,
// TW fund NAV sources, etc.). Extracted from yahooFinance.ts so it can be
// reused without duplicating the proxy list/logic.

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
    console.log('[CORS Proxy] Custom CORS proxy set:', customCorsProxy);
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
export async function fetchWithProxy(targetUrl: string): Promise<Response> {
  let lastError: Error | null = null;
  const proxies = getCorsProxies();

  for (let i = 0; i < proxies.length; i++) {
    const proxy = proxies[i];
    const proxyName = proxy === '' ? 'direct' : (proxy === customCorsProxy ? 'custom proxy' : `public proxy ${i}`);

    try {
      const url = proxy ? `${proxy}${encodeURIComponent(targetUrl)}` : targetUrl;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      console.log(`[CORS Proxy] Trying ${proxyName}...`);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: proxy ? {} : {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        lastUsedProxy = proxy;
        console.log(`[CORS Proxy] Success with ${proxyName}`);
        return response;
      } else {
        console.log(`[CORS Proxy] ${proxyName} returned status ${response.status}`);
      }
    } catch (error) {
      console.log(`[CORS Proxy] ${proxyName} failed:`, (error as Error).message);
      lastError = error as Error;
      continue;
    }
  }

  throw lastError || new Error('All fetch methods failed');
}
