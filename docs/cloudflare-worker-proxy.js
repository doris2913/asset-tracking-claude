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
    const url = new URL(request.url);

    // 從查詢參數獲取目標 URL
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // 只允許特定的 API 網域（安全性）
    const allowedDomains = [
      'query1.finance.yahoo.com',
      'query2.finance.yahoo.com',
      'www.alphavantage.co',
      'finnhub.io',
      'financialmodelingprep.com',
    ];

    const targetHost = new URL(targetUrl).hostname;
    if (!allowedDomains.some(domain => targetHost.includes(domain))) {
      return new Response('Domain not allowed', { status: 403 });
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
      return new Response(`Proxy error: ${error.message}`, { status: 500 });
    }
  },
};
