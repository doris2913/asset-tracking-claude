/**
 * Cloudflare Worker CORS Proxy
 *
 * 部署步驟：
 * 1. 到 https://dash.cloudflare.com/ 註冊帳號
 * 2. 進入 Workers & Pages
 * 3. 創建新的 Worker
 * 4. 貼上此代碼並部署
 * 5. 獲得網址如：https://your-worker.your-subdomain.workers.dev
 * 6. 在設定頁面輸入此網址作為自訂 CORS Proxy
 *
 * 免費額度：每天 100,000 次請求
 */

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);

    // 從查詢參數獲取目標 URL
    let targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 嘗試解碼 URL（處理可能的雙重編碼）
    try {
      // 如果 URL 看起來是編碼過的，嘗試解碼
      if (targetUrl.includes('%3A') || targetUrl.includes('%2F')) {
        targetUrl = decodeURIComponent(targetUrl);
      }
    } catch (e) {
      // 忽略解碼錯誤，使用原始值
    }

    // 只允許特定的 API 網域（安全性）
    const allowedDomains = [
      'query1.finance.yahoo.com',
      'query2.finance.yahoo.com',
      'www.alphavantage.co',
      'finnhub.io',
      'financialmodelingprep.com',
    ];

    let targetHost;
    try {
      targetHost = new URL(targetUrl).hostname;
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Invalid URL',
        received: targetUrl,
        hint: 'URL should be like: ?url=https://query1.finance.yahoo.com/v8/finance/chart/AAPL'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (!allowedDomains.some(domain => targetHost.includes(domain))) {
      return new Response(JSON.stringify({
        error: 'Domain not allowed',
        domain: targetHost,
        allowed: allowedDomains
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      // 轉發請求到目標 URL
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      // 創建新的 response 並添加 CORS headers
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');

      return newResponse;
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Proxy fetch failed',
        message: error.message,
        targetUrl: targetUrl
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
