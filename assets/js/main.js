/**
 * Economic Group — Main Entry Point
 * Boot order:
 *  1. Load HTML partials (header/footer/news-modal) into the DOM.
 *  2. Initialize i18n (loads translation dictionary, sets dir/lang).
 *  3. Initialize every section module (each defers its own data fetch
 *     until its section scrolls into view where relevant).
 *  4. Wire up global cross-cutting behavior (skip link focus, back-to-top,
 *     reveal-on-scroll for static sections).
 */

(function () {
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener(
      'scroll',
      () => {
        btn.classList.toggle('is-visible', window.scrollY > 600);
      },
      { passive: true }
    );
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function boot() {
    window.StockPartials.loadAllPartials().then(() => {
      // Header/footer markup now exists in the DOM — safe to wire up.
      window.StockHeader.init();
      window.StockFooter.init();
      window.StockNewsModal.init();

      return window.I18n.init();
    }).then(() => {
      window.StockHero.init();
      window.StockMarket.init();
      window.StockNews.init();
      window.StockFAQ.init();
      window.StockContact.init();

      initBackToTop();
      window.StockLazy.initRevealObserver();
      window.StockLazy.initImageFadeIn();
      window.StockAutoRefresh.init();
    }).catch((err) => {
      console.error('Economic Group — initialization error:', err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
