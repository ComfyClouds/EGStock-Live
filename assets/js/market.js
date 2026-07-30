/**
 * Economic Group — Market Module
 * Renders: Market Overview (EGX 30/70/100), Top Gainers & Losers, and the
 * full Stocks list — all via official TradingView widgets (see
 * tradingViewWidgets.js), since that's the only legitimate source of real
 * EGX-specific data. The Currencies/Commodities ticker tabs remain our own
 * custom UI, but are now fully live-fetched (see liveMarketData.js) —
 * Currencies and Commodities (Gold/Silver only) both come straight from
 * Frankfurter with no Google Sheet involved. Oil/Natural Gas rows were
 * dropped from the Commodities tab since Frankfurter has no data for them
 * and there's no other free, CORS-enabled, keyless source to replace the
 * old sheet with.
 * Data fetches are deferred until each section scrolls into view.
 */

(function () {
  const { qs, qsa } = window.StockUtils;

  let currenciesData = [];
  let commoditiesData = [];
  let activeTickerTab = 'currencies';
  let dataLoaded = { overview: false, tickers: false, movers: false, stocks: false };

  /* ---------- Market Overview (TradingView) ---------- */

  function loadOverview() {
    if (dataLoaded.overview) return;
    dataLoaded.overview = true;
    window.TradingViewWidgets.renderIndices('tv-indices-widget', window.I18n.getLanguage());
  }

  /* ---------- Ticker Tabs (Currencies / Commodities — still custom UI) ---------- */

  function renderTickerTab(lang) {
    const grid = qs('#ticker-grid');
    if (!grid) return;
    window.StockSkeleton.clearBusy(grid);

    const dataMap = { currencies: currenciesData, commodities: commoditiesData };
    const rows = dataMap[activeTickerTab] || [];
    grid.innerHTML = rows.map((item) => window.StockComponents.miniTickerCard(item, lang, activeTickerTab)).join('');
    window.StockLazy.initRevealObserver();
  }

  function initTickerTabs() {
    const tabs = qsa('[data-ticker-tab]');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
        tab.setAttribute('aria-selected', 'true');
        activeTickerTab = tab.getAttribute('data-ticker-tab');
        renderTickerTab(window.I18n.getLanguage());
      });
    });
  }

  function loadTickers() {
    if (dataLoaded.tickers) return;
    dataLoaded.tickers = true;
    const grid = qs('#ticker-grid');
    window.StockSkeleton.renderSkeletonCards(grid, 4, 'row');

    Promise.all([
      window.LiveMarketData.fetchCurrencies(),
      window.LiveMarketData.fetchMetals()
    ]).then(([liveCurrencies, liveMetals]) => {
      currenciesData = liveCurrencies; // fully live — no Google Sheet involved
      commoditiesData = [...liveMetals].sort((a, b) => a.Order - b.Order); // fully live — Gold/Silver only
      renderTickerTab(window.I18n.getLanguage());
    });
  }

  /**
   * Re-fetches and re-renders only the ticker tabs, if already loaded. Kept
   * on its own, slower cadence (see autoRefresh.js) since Frankfurter's
   * underlying rates only update once a day — polling it every 30 seconds
   * like the rest of the page would be pointless and inconsiderate of a
   * free public API.
   */
  function refreshTickers() {
    if (!dataLoaded.tickers) return;
    const lang = window.I18n.getLanguage();

    Promise.all([
      window.LiveMarketData.fetchCurrencies(),
      window.LiveMarketData.fetchMetals()
    ]).then(([liveCurrencies, liveMetals]) => {
      currenciesData = liveCurrencies;
      commoditiesData = [...liveMetals].sort((a, b) => a.Order - b.Order);
      renderTickerTab(lang);
    });
  }

  /* ---------- Top Gainers / Losers (TradingView) ---------- */

  function loadMovers() {
    if (dataLoaded.movers) return;
    dataLoaded.movers = true;
    window.TradingViewWidgets.renderMovers('tv-movers-widget', window.I18n.getLanguage());
  }

  /* ---------- Stocks List (TradingView) ---------- */

  function loadStocksTable() {
    if (dataLoaded.stocks) return;
    dataLoaded.stocks = true;
    window.TradingViewWidgets.renderStocks('tv-stocks-widget', window.I18n.getLanguage());
  }

  /* ---------- Init ---------- */

  /**
   * Re-fetches and re-renders the Sheet-backed ticker tabs only — Market
   * Overview/Movers/Stocks are TradingView widgets now, which fetch and
   * refresh their own data internally and need no action from us here.
   */
  function refresh() {
    // Intentionally empty: nothing Sheet-backed left on the fast cycle.
    // Kept as a stable no-op so autoRefresh.js doesn't need to know that.
  }

  function init() {
    initTickerTabs();

    document.addEventListener('stock:langchange', (e) => {
      if (dataLoaded.overview) window.TradingViewWidgets.renderIndices('tv-indices-widget', e.detail.lang);
      if (dataLoaded.tickers) renderTickerTab(e.detail.lang);
      if (dataLoaded.movers) window.TradingViewWidgets.renderMovers('tv-movers-widget', e.detail.lang);
      if (dataLoaded.stocks) window.TradingViewWidgets.renderStocks('tv-stocks-widget', e.detail.lang);
    });

    const overviewSection = qs('#markets');
    const moversSection = qs('#movers');
    const stocksSection = qs('#stocks');

    window.StockLazy.onEnterViewport(overviewSection, () => {
      loadOverview();
      loadTickers();
    });
    window.StockLazy.onEnterViewport(moversSection, loadMovers);
    window.StockLazy.onEnterViewport(stocksSection, loadStocksTable);
  }

  window.StockMarket = { init, refresh, refreshTickers };
})();
