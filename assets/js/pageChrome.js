/**
 * Economic Group — Page Chrome
 * Lightweight boot helper for standalone pages (outside index.html) that
 * still need language switching + i18n, but don't use the full header/footer
 * partials or homepage section modules.
 */

(function () {
  function initLangSwitch() {
    document.querySelectorAll('[data-lang-option]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.I18n.setLanguage(btn.getAttribute('data-lang-option'));
      });
    });
  }

  /**
   * @param {string} basePath - relative path prefix to the site root,
   *   e.g. '../' when called from a page inside /pages/.
   */
  function init(basePath = '') {
    initLangSwitch();
    return window.I18n.init(basePath);
  }

  window.StockPageChrome = { init };
})();
