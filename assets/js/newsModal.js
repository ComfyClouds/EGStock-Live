/**
 * Economic Group — News Modal Module
 * Opens a responsive, keyboard-accessible modal with the full article
 * (large image, title, date, content) when a news card's "Read More"
 * is clicked.
 */

(function () {
  const { qs, escapeHtml, formatDate } = window.StockUtils;
  let releaseFocusTrap = () => {};
  let lastFocusedEl = null;

  function open(newsItem) {
    const overlay = qs('#news-modal-overlay');
    if (!overlay || !newsItem) return;

    const lang = window.I18n.getLanguage();
    lastFocusedEl = document.activeElement;

    qs('#news-modal-image').src = newsItem.Image;
    qs('#news-modal-image').alt = lang === 'ar' ? newsItem.TitleAR : newsItem.TitleEN;
    qs('#news-modal-category').textContent = lang === 'ar' ? newsItem.CategoryAR : newsItem.CategoryEN;
    qs('#news-modal-date').textContent = formatDate(newsItem.Date, lang);
    qs('#news-modal-date').setAttribute('datetime', newsItem.Date);
    qs('#news-modal-title').textContent = lang === 'ar' ? newsItem.TitleAR : newsItem.TitleEN;
    qs('#news-modal-content').innerHTML = lang === 'ar' ? newsItem.ContentAR : newsItem.ContentEN;

    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    releaseFocusTrap = window.StockUtils.trapFocus(qs('#news-modal'));
  }

  function close() {
    const overlay = qs('#news-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    releaseFocusTrap();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  function initTriggers() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-news]');
      if (trigger) {
        const id = trigger.getAttribute('data-open-news');
        const item = window.StockNews.getById(id);
        if (item) open(item);
      }
    });

    document.addEventListener('stock:opennews', (e) => {
      const item = e.detail.item || window.StockNews.getById(e.detail.id);
      if (item) open(item);
    });

    const overlay = qs('#news-modal-overlay');
    const closeBtn = qs('#news-modal-close');
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.classList.contains('is-open')) close();
    });
  }

  function init() {
    initTriggers();
  }

  window.StockNewsModal = { init, open, close };
})();
