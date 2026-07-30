/**
 * Economic Group — Header Module
 * Renders navigation from the Navigation sheet, wires up the sticky
 * scroll state, dropdown menus, language switcher, search overlay,
 * and the mobile drawer.
 */

(function () {
  const { qs, qsa, debounce, escapeHtml } = window.StockUtils;
  let navData = [];
  let newsCache = [];
  // Lets the mobile drawer and search overlay close each other, since both
  // are reachable simultaneously (the search button isn't hidden while the
  // drawer is open) and sharing z-index/focus-trap/body-scroll-lock would
  // otherwise conflict if both were open at once.
  let closeMobileDrawer = () => {};
  let closeSearchOverlay = () => {};

  function initStickyHeader() {
    const header = qs('#site-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function buildNavTree(rows) {
    const top = rows.filter((r) => !r.ParentID).sort((a, b) => a.Order - b.Order);
    const children = rows.filter((r) => r.ParentID);
    return top.map((item) => ({
      ...item,
      children: children.filter((c) => c.ParentID === item.ID).sort((a, b) => a.Order - b.Order)
    }));
  }

  function renderDesktopNav(tree, lang) {
    const nav = qs('#primary-nav');
    if (!nav) return;
    nav.innerHTML = tree
      .map((item) => {
        const label = lang === 'ar' ? item.LabelAR : item.LabelEN;
        if (!item.children.length) {
          return `<div class="nav-item"><a class="nav-link" href="${escapeHtml(item.Url)}">${escapeHtml(label)}</a></div>`;
        }
        const dropdownLinks = item.children
          .map((c) => {
            const cLabel = lang === 'ar' ? c.LabelAR : c.LabelEN;
            return `<a class="nav-dropdown-link" href="${escapeHtml(c.Url)}">${escapeHtml(cLabel)}</a>`;
          })
          .join('');
        return `
          <div class="nav-item">
            <button type="button" class="nav-link" aria-expanded="false">
              <span>${escapeHtml(label)}</span>
              <span class="chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div class="nav-dropdown">${dropdownLinks}</div>
          </div>`;
      })
      .join('');

    qsa('.nav-item', nav).forEach((item) => {
      const trigger = qs('button.nav-link', item);
      if (!trigger) return;
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        qsa('.nav-item', nav).forEach((i) => {
          i.classList.remove('is-open');
          const t = qs('button.nav-link', i);
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) {
        qsa('.nav-item', nav).forEach((i) => i.classList.remove('is-open'));
      }
    });
  }

  function renderMobileNav(tree, lang) {
    const nav = qs('#mobile-nav');
    if (!nav) return;
    nav.innerHTML = tree
      .map((item, index) => {
        const label = lang === 'ar' ? item.LabelAR : item.LabelEN;
        if (!item.children.length) {
          return `<a class="mobile-nav-link" href="${escapeHtml(item.Url)}" data-close-drawer>${escapeHtml(label)}</a>`;
        }
        const subLinks = item.children
          .map((c) => {
            const cLabel = lang === 'ar' ? c.LabelAR : c.LabelEN;
            return `<a class="mobile-nav-sublink" href="${escapeHtml(c.Url)}" data-close-drawer>${escapeHtml(cLabel)}</a>`;
          })
          .join('');
        return `
          <div>
            <button type="button" class="mobile-nav-link" data-mobile-toggle="${index}" aria-expanded="false">
              <span>${escapeHtml(label)}</span>
              <span class="chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div class="mobile-nav-submenu" data-mobile-submenu="${index}">${subLinks}</div>
          </div>`;
      })
      .join('');

    qsa('[data-mobile-toggle]', nav).forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-mobile-toggle');
        const submenu = qs(`[data-mobile-submenu="${id}"]`, nav);
        const isOpen = submenu.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    });
  }

  function renderNav(lang) {
    const tree = buildNavTree(navData);
    renderDesktopNav(tree, lang);
    renderMobileNav(tree, lang);
  }

  function initMobileDrawer() {
    const drawer = qs('#mobile-drawer');
    const backdrop = qs('#mobile-drawer-backdrop');
    const toggle = qs('#menu-toggle');
    const closeBtn = qs('#mobile-drawer-close');
    if (!drawer || !toggle) return;

    let releaseFocusTrap = () => {};

    function open() {
      closeSearchOverlay();
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      releaseFocusTrap = window.StockUtils.trapFocus(drawer);
    }

    function close() {
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      releaseFocusTrap();
      toggle.focus();
    }

    closeMobileDrawer = () => {
      if (drawer.classList.contains('is-open')) close();
    };

    toggle.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-drawer]')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });
  }

  function initLangSwitch() {
    qsa('[data-lang-option]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang-option');
        window.I18n.setLanguage(lang);
      });
    });
  }

  function initSearchOverlay() {
    const overlay = qs('#search-overlay');
    const toggle = qs('#search-toggle');
    const closeBtn = qs('#search-close');
    const input = qs('#search-input');
    const results = qs('#search-results');
    if (!overlay || !toggle) return;

    let releaseFocusTrap = () => {};

    function open() {
      closeMobileDrawer();
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      releaseFocusTrap = window.StockUtils.trapFocus(overlay);
      renderResults('');
    }

    function close() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      releaseFocusTrap();
      toggle.focus();
      input.value = '';
    }

    closeSearchOverlay = () => {
      if (overlay.classList.contains('is-open')) close();
    };

    function renderResults(query) {
      const lang = window.I18n.getLanguage();
      const q = query.trim().toLowerCase();

      if (!q) {
        results.innerHTML = `<p class="search-empty">${escapeHtml(window.I18n.t('header.search_placeholder'))}</p>`;
        return;
      }

      const matchedNews = newsCache
        .filter((n) => {
          const title = (lang === 'ar' ? n.TitleAR : n.TitleEN) || '';
          return title.toLowerCase().includes(q);
        })
        .slice(0, 8);

      if (!matchedNews.length) {
        results.innerHTML = `<p class="search-empty">${escapeHtml(window.I18n.t('header.search_no_results'))}</p>`;
        return;
      }

      let html = '';
      if (matchedNews.length) {
        html += `<div class="search-results-group"><strong style="font-size:12px;color:var(--color-text-muted);">${escapeHtml(window.I18n.t('header.search_news_label'))}</strong>`;
        html += matchedNews
          .map((n) => {
            const title = lang === 'ar' ? n.TitleAR : n.TitleEN;
            return `<a class="search-result-item" href="index.html#news" data-open-news-search="${escapeHtml(n.ID)}"><span>${escapeHtml(title)}</span></a>`;
          })
          .join('');
        html += `</div>`;
      }
      results.innerHTML = html;
    }

    toggle.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
    input?.addEventListener(
      'input',
      debounce((e) => renderResults(e.target.value), 150)
    );

    results.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-news-search]');
      if (trigger) {
        e.preventDefault();
        close();
        const id = trigger.getAttribute('data-open-news-search');
        // Pass the item directly: header.js fetches News eagerly, but the
        // News section itself (news.js) only loads it lazily on scroll, so
        // it may not have this item cached yet if the user searches first.
        const item = newsCache.find((n) => String(n.ID) === String(id));
        document.dispatchEvent(new CustomEvent('stock:opennews', { detail: { id, item } }));
      } else if (e.target.closest('.search-result-item')) {
        close();
      }
    });
  }

  function renderMarketStatus(statusRows, lang) {
    if (!statusRows || !statusRows.length) return;
    const status = statusRows[0];
    const dot = qs('#market-status-dot');
    const label = qs('#market-status-label');
    if (dot) {
      dot.classList.toggle('is-open', !!status.IsOpen);
      dot.classList.toggle('is-closed', !status.IsOpen);
    }
    if (label) label.textContent = lang === 'ar' ? status.StatusAR : status.StatusEN;
  }

  function init() {
    initStickyHeader();
    initMobileDrawer();
    initLangSwitch();
    initSearchOverlay();

    document.addEventListener('stock:langchange', (e) => {
      renderNav(e.detail.lang);
      renderMarketStatus(window.__stockData?.MarketStatus, e.detail.lang);
      window.TradingViewWidgets.renderTickerTape('tv-ticker-tape', e.detail.lang);
    });

    window.SheetsAPI.fetchSheets(['Navigation', 'MarketStatus', 'News']).then((data) => {
      navData = (data.Navigation || []).filter((r) => r.Published !== false);
      newsCache = (data.News || []).filter((r) => r.Published !== false);
      window.__stockData = window.__stockData || {};
      window.__stockData.MarketStatus = data.MarketStatus || [];
      const lang = window.I18n.getLanguage() || window.STOCK_CONFIG.DEFAULT_LANG;
      renderNav(lang);
      renderMarketStatus(data.MarketStatus, lang);
    });
  }

  window.StockHeader = { init };
})();
