/**
 * Economic Group — FAQ Module
 * Renders category tabs and an accessible accordion from the FAQs sheet.
 */

(function () {
  const { qs, qsa, escapeHtml } = window.StockUtils;
  let faqData = [];
  let activeCategory = 'all';
  let loaded = false;

  function getCategories(lang) {
    const set = new Set();
    faqData.forEach((item) => set.add(lang === 'ar' ? item.CategoryAR : item.CategoryEN));
    return Array.from(set);
  }

  function renderTabs(lang) {
    const tabsEl = qs('#faq-tabs');
    if (!tabsEl) return;
    const categories = getCategories(lang);
    const allLabel = window.I18n.t('common.view_all');

    tabsEl.innerHTML =
      `<button type="button" class="faq-tab" data-faq-tab="all" aria-selected="true">${escapeHtml(allLabel)}</button>` +
      categories
        .map((c) => `<button type="button" class="faq-tab" data-faq-tab="${escapeHtml(c.toLowerCase())}" aria-selected="false">${escapeHtml(c)}</button>`)
        .join('');

    qsa('[data-faq-tab]', tabsEl).forEach((tab) => {
      tab.addEventListener('click', () => {
        qsa('[data-faq-tab]', tabsEl).forEach((t) => t.setAttribute('aria-selected', 'false'));
        tab.setAttribute('aria-selected', 'true');
        activeCategory = tab.getAttribute('data-faq-tab');
        applyFilter();
      });
    });
  }

  function renderList(lang) {
    const list = qs('#faq-list');
    if (!list) return;
    window.StockSkeleton.clearBusy(list);
    list.innerHTML = faqData.map((item) => window.StockComponents.faqItem(item, lang)).join('');
    initAccordionBehavior();
    applyFilter();
    window.StockLazy.initRevealObserver();
  }

  function applyFilter() {
    qsa('.faq-item').forEach((item) => {
      const matches = activeCategory === 'all' || item.getAttribute('data-faq-category') === activeCategory;
      item.style.display = matches ? '' : 'none';
    });
  }

  function initAccordionBehavior() {
    qsa('.faq-question').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const answer = item.querySelector('.faq-answer');
        const isOpen = item.classList.contains('is-open');

        item.classList.toggle('is-open', !isOpen);
        btn.setAttribute('aria-expanded', String(!isOpen));
        answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : '0px';
      });
    });
  }

  function load() {
    if (loaded) return;
    loaded = true;
    const list = qs('#faq-list');
    window.StockSkeleton.renderSkeletonCards(list, 4, 'default');

    window.SheetsAPI.fetchSheet('FAQs').then((rows) => {
      faqData = rows.filter((r) => r.Published !== false).sort((a, b) => (a.Order || 0) - (b.Order || 0));
      const lang = window.I18n.getLanguage();
      renderTabs(lang);
      renderList(lang);
    });
  }

  function init() {
    document.addEventListener('stock:langchange', (e) => {
      if (loaded) {
        activeCategory = 'all';
        renderTabs(e.detail.lang);
        renderList(e.detail.lang);
      }
    });

    window.StockLazy.onEnterViewport(qs('#faq'), load);
  }

  window.StockFAQ = { init };
})();
