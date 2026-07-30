/**
 * Economic Group — News Module
 * Renders the News grid from the News sheet, deferring the fetch
 * until the section scrolls into view.
 */

(function () {
  const { qs } = window.StockUtils;
  let newsData = [];
  let loaded = false;

  function render(lang) {
    const grid = qs('#news-grid');
    if (!grid) return;
    window.StockSkeleton.clearBusy(grid);
    grid.innerHTML = newsData.map((item) => window.StockComponents.newsCard(item, lang)).join('');
    window.StockLazy.initImageFadeIn();
    window.StockLazy.initRevealObserver();
  }

  function load() {
    if (loaded) return;
    loaded = true;
    const grid = qs('#news-grid');
    window.StockSkeleton.renderSkeletonCards(grid, 3, 'news');

    window.SheetsAPI.fetchSheet('News').then((rows) => {
      newsData = rows.filter((r) => r.Published !== false).sort((a, b) => (a.Order || 0) - (b.Order || 0));
      render(window.I18n.getLanguage());
    });
  }

  function getById(id) {
    return newsData.find((n) => String(n.ID) === String(id));
  }

  function init() {
    document.addEventListener('stock:langchange', (e) => {
      if (loaded) render(e.detail.lang);
    });

    window.StockLazy.onEnterViewport(qs('#news'), load);
  }

  window.StockNews = { init, getById };
})();
