/**
 * Economic Group — Hero Module
 * Renders the homepage hero slider (from Sliders sheet), the market
 * open/closed status (from MarketStatus), the "Live Snapshot" panel (a
 * TradingView Symbol Overview widget — see tradingViewWidgets.js), and the
 * scrolling announcements ticker (from Announcements sheet).
 */

(function () {
  const { qs, qsa, escapeHtml } = window.StockUtils;
  let slidesData = [];
  let announcementsData = [];
  let statusData = [];
  let currentSlide = 0;
  let slideTimer = null;

  function renderSlides(lang) {
    const container = qs('#hero-slides');
    if (!container) return;

    container.innerHTML = slidesData
      .map((slide, i) => {
        const headline = lang === 'ar' ? slide.HeadlineAR : slide.HeadlineEN;
        const subtext = lang === 'ar' ? slide.SubtextAR : slide.SubtextEN;
        const ctaLabel = lang === 'ar' ? slide.CTALabelAR : slide.CTALabelEN;
        return `
          <div class="hero-slide ${i === 0 ? 'is-active' : ''}" data-slide-index="${i}">
            <span class="hero-badge glass" data-i18n="hero.badge">${escapeHtml(window.I18n.t('hero.badge'))}</span>
            <h1 class="hero-headline">${escapeHtml(headline)}</h1>
            <p class="hero-subtext">${escapeHtml(subtext)}</p>
            <div class="hero-cta-row">
              <a href="${escapeHtml(slide.CTAUrl)}" class="btn btn-primary">${escapeHtml(ctaLabel)}</a>
              <a href="market" class="btn btn-outline" data-i18n="hero.cta_secondary">${escapeHtml(window.I18n.t('hero.cta_secondary'))}</a>
            </div>
          </div>`;
      })
      .join('');

    const dots = qs('#hero-dots');
    if (dots) {
      dots.innerHTML = slidesData
        .map((_, i) => `<button type="button" class="hero-dot" data-dot-index="${i}" aria-current="${i === 0}" aria-label="Slide ${i + 1}"></button>`)
        .join('');
      qsa('[data-dot-index]', dots).forEach((dot) => {
        dot.addEventListener('click', () => goToSlide(Number(dot.getAttribute('data-dot-index'))));
      });
    }

    currentSlide = 0;
    startAutoRotate();
  }

  function goToSlide(index) {
    const slides = qsa('.hero-slide');
    const dots = qsa('[data-dot-index]');
    if (!slides.length) return;
    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === currentSlide));
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === currentSlide)));
  }

  function startAutoRotate() {
    clearInterval(slideTimer);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || slidesData.length < 2) return;
    slideTimer = setInterval(() => goToSlide(currentSlide + 1), 6000);
  }

  function renderStatus(lang) {
    const statusLabel = qs('#hero-status-label');
    const statusDot = qs('#hero-status-dot');

    if (statusData.length) {
      const status = statusData[0];
      if (statusLabel) statusLabel.textContent = lang === 'ar' ? status.StatusAR : status.StatusEN;
      if (statusDot) {
        statusDot.classList.toggle('is-open', !!status.IsOpen);
        statusDot.classList.toggle('is-closed', !status.IsOpen);
      }
    }
  }

  function renderTicker(lang) {
    const track = qs('#ticker-track');
    if (!track) return;
    const items = announcementsData
      .map(
        (a) => `
        <a class="ticker-item" href="${escapeHtml(a.LinkURL || '#')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>${escapeHtml(lang === 'ar' ? a.TitleAR : a.TitleEN)}</span>
        </a>`
      )
      .join('');
    // Duplicate the list so the CSS scroll animation loops seamlessly.
    track.innerHTML = items + items;
  }

  /**
   * Re-fetches and re-renders just the market open/closed status. The
   * "Live Snapshot" panel itself is now a TradingView widget (see
   * tradingViewWidgets.js), which fetches and updates its own data
   * internally — nothing for us to refresh there. Deliberately skips
   * Sliders and Announcements too — those are marketing/editorial content,
   * not live market data, so there's no need to re-fetch them on every
   * refresh cycle.
   */
  function refresh() {
    window.SheetsAPI.fetchSheet('MarketStatus').then((rows) => {
      statusData = rows || [];
      renderStatus(window.I18n.getLanguage());
    });
  }

  function init() {
    document.addEventListener('stock:langchange', (e) => {
      if (slidesData.length) renderSlides(e.detail.lang);
      renderStatus(e.detail.lang);
      renderTicker(e.detail.lang);
      window.TradingViewWidgets.renderHeroSnapshot('hero-tv-widget', e.detail.lang);
    });

    window.SheetsAPI.fetchSheets(['Sliders', 'Announcements', 'MarketStatus']).then((data) => {
      slidesData = (data.Sliders || []).filter((r) => r.Published !== false).sort((a, b) => a.Order - b.Order);
      announcementsData = (data.Announcements || []).filter((r) => r.Published !== false).sort((a, b) => a.Order - b.Order);
      statusData = data.MarketStatus || [];

      const lang = window.I18n.getLanguage() || window.STOCK_CONFIG.DEFAULT_LANG;
      renderSlides(lang);
      renderStatus(lang);
      renderTicker(lang);
      window.TradingViewWidgets.renderHeroSnapshot('hero-tv-widget', lang);
    });
  }

  window.StockHero = { init, refresh };
})();
