/**
 * Economic Group — Auto Refresh
 * Periodically re-fetches and re-renders live market data on two separate
 * cadences, with no page reload:
 *  - Fast cycle (AUTO_REFRESH_INTERVAL_MS): the market open/closed status
 *    dot in the hero panel (still Sheets-backed, via MarketStatus). The
 *    "Live Snapshot" numbers themselves are a TradingView widget now (see
 *    tradingViewWidgets.js) and refresh internally, same as Market
 *    Overview/Top Movers/Stocks — so hero.js's refresh() only touches
 *    MarketStatus, and market.js's own refresh() is a no-op.
 *  - Slow cycle (LIVE_DATA_REFRESH_INTERVAL_MS): the Currencies/Commodities
 *    ticker tabs, where Currencies and precious metals are fetched directly
 *    from a live API (see liveMarketData.js) whose underlying data only
 *    updates once a day — refreshing that every 30 seconds would be
 *    pointless and inconsiderate of a free public API.
 *
 * Both cycles only refresh sections that have already been loaded — they
 * respect the same lazy-load system used on first load, so neither ever
 * forces a section the user hasn't scrolled to yet. Both pause while the
 * browser tab is in the background (Page Visibility API) and do one
 * immediate catch-up refresh when the tab becomes visible again.
 *
 * In demo mode (STOCK_CONFIG.USE_SAMPLE_DATA = true) the hero panel's
 * Sheets-backed data never changes, so the fast cycle's numbers will look
 * identical — that's expected. The slow cycle's Currencies/Metals numbers
 * are real regardless of demo mode, since that fetch never touches Google
 * Sheets at all.
 */

(function () {
  let fastIntervalId = null;
  let slowIntervalId = null;

  function fastTick() {
    if (document.hidden) return;
    window.StockHero?.refresh?.();
    window.StockMarket?.refresh?.();
  }

  function slowTick() {
    if (document.hidden) return;
    window.StockMarket?.refreshTickers?.();
  }

  function start() {
    if (!window.STOCK_CONFIG.AUTO_REFRESH_ENABLED) return;
    stop();
    fastIntervalId = setInterval(fastTick, window.STOCK_CONFIG.AUTO_REFRESH_INTERVAL_MS);
    slowIntervalId = setInterval(slowTick, window.STOCK_CONFIG.LIVE_DATA_REFRESH_INTERVAL_MS);
  }

  function stop() {
    if (fastIntervalId) clearInterval(fastIntervalId);
    if (slowIntervalId) clearInterval(slowIntervalId);
    fastIntervalId = null;
    slowIntervalId = null;
  }

  function init() {
    start();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        fastTick();
        slowTick();
      }
    });
  }

  window.StockAutoRefresh = { init, start, stop };
})();
