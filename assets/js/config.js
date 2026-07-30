/**
 * Economic Group — Global Configuration
 * Central place for endpoints, constants, and feature flags.
 */

window.STOCK_CONFIG = Object.freeze({
  // Replace with your deployed Google Apps Script Web App URL.
  // See docs/APPS_SCRIPT_BACKEND.md
  SHEETS_API_URL: 'https://script.google.com/macros/s/AKfycbz57fVmzQHLEBS52qofTGBnRnXg3qkE9_gwX9QMD-87AfDG9MGOJ2ZqSaaxNxl9YiGQUw/exec',

  // When true, falls back to /data/sample-data.json instead of calling
  // the live Apps Script endpoint. Useful for local development/demo.
  USE_SAMPLE_DATA: false,

  SAMPLE_DATA_URL: 'data/sample-data.json',

  DEFAULT_LANG: 'ar',
  SUPPORTED_LANGS: ['ar', 'en'],
  LANG_STORAGE_KEY: 'stock_lang',

  JSONP_TIMEOUT_MS: 8000,

  // Periodically re-fetches and re-renders live market data (the hero
  // snapshot panel — Market Overview/Movers/Stocks are TradingView widgets
  // now and refresh themselves) without a page reload. Pauses automatically
  // while the browser tab is in the background.
  AUTO_REFRESH_ENABLED: true,
  AUTO_REFRESH_INTERVAL_MS: 30000,

  // Currencies/Commodities (Gold, Silver) are fetched live, directly in the
  // browser, from Frankfurter (see assets/js/liveMarketData.js) — no
  // Google Sheet involved. Its underlying rates only update once daily, so
  // this runs on a much longer cadence than AUTO_REFRESH_INTERVAL_MS out of
  // consideration for a free public API, not out of any rate-limit
  // requirement.
  LIVE_DATA_REFRESH_INTERVAL_MS: 300000,

  WHATSAPP_NUMBER: '201558868380',

  TICKER_ANIMATION_DURATION_S: 38,

  SEARCH_MIN_CHARS: 1
});
