/**
 * Economic Group — Footer Module
 * Renders footer link columns and social icons from their sheets,
 * and wires up the newsletter signup form (writes to NewsletterSignups).
 */

(function () {
  const { qs, escapeHtml, isValidEmail } = window.StockUtils;
  let footerLinksData = [];
  let socialData = [];

  function renderSocial() {
    const mount = qs('#footer-social');
    if (!mount) return;
    mount.innerHTML = socialData
      .sort((a, b) => a.Order - b.Order)
      .map((s) => {
        const icon = window.StockIcons.icon(s.Platform) || window.StockIcons.icon('link');
        return `<a class="footer-social-link" href="${escapeHtml(s.Url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(s.Platform)}">${icon}</a>`;
      })
      .join('');
  }

  function renderLinkColumns(lang) {
    const mount = qs('#footer-links-columns');
    if (!mount) return;

    const columns = {};
    footerLinksData.forEach((link) => {
      const columnName = lang === 'ar' ? link.ColumnAR : link.ColumnEN;
      if (!columns[columnName]) columns[columnName] = [];
      columns[columnName].push(link);
    });

    mount.innerHTML = Object.entries(columns)
      .map(([columnName, links]) => {
        const items = links
          .sort((a, b) => a.Order - b.Order)
          .map((link) => {
            const label = lang === 'ar' ? link.LabelAR : link.LabelEN;
            return `<a class="footer-link" href="${escapeHtml(link.Url)}">${escapeHtml(label)}</a>`;
          })
          .join('');
        return `
          <div class="footer-col">
            <h4 class="footer-col-title">${escapeHtml(columnName)}</h4>
            <div class="footer-link-list">${items}</div>
          </div>`;
      })
      .join('');
  }

  function initNewsletterForm() {
    const form = qs('#newsletter-form');
    const status = qs('#newsletter-status');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = qs('#newsletter-email').value.trim();
      const lang = window.I18n.getLanguage();

      if (!isValidEmail(email)) {
        status.textContent = window.I18n.t('contact_form.invalid_email');
        status.className = 'form-status error';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      window.SheetsAPI.submitToSheet('NewsletterSignups', { Email: email, Language: lang })
        .then((res) => {
          status.textContent = res && res.alreadySubscribed
            ? window.I18n.t('newsletter.already_subscribed')
            : window.I18n.t('newsletter.success');
          status.className = 'form-status success';
          form.reset();
        })
        .catch(() => {
          status.textContent = window.I18n.t('contact_form.error');
          status.className = 'form-status error';
        })
        .finally(() => {
          submitBtn.disabled = false;
        });
    });
  }

  function setYear() {
    const yearEl = qs('#footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function init() {
    setYear();
    initNewsletterForm();

    document.addEventListener('stock:langchange', (e) => {
      renderLinkColumns(e.detail.lang);
    });

    window.SheetsAPI.fetchSheets(['FooterLinks', 'SocialLinks']).then((data) => {
      footerLinksData = (data.FooterLinks || []).filter((r) => r.Published !== false);
      socialData = (data.SocialLinks || []).filter((r) => r.Published !== false);
      renderSocial();
      renderLinkColumns(window.I18n.getLanguage() || window.STOCK_CONFIG.DEFAULT_LANG);
    });
  }

  window.StockFooter = { init };
})();
