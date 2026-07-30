/**
 * Economic Group — i18n Engine
 * Handles instant language switching (no page refresh), RTL/LTR,
 * persistence via localStorage, and binds any element with a
 * data-i18n="key.path" attribute to the active translation dictionary.
 *
 * Usage in HTML:
 *   <span data-i18n="nav.home">Home</span>
 *   <input data-i18n-placeholder="header.search_placeholder" placeholder="Search…">
 */

(function () {
  const dictionaries = {};
  let currentLang = null;
  let basePath = '';

  function getInitialLang() {
    const stored = localStorage.getItem(window.STOCK_CONFIG.LANG_STORAGE_KEY);
    if (stored && window.STOCK_CONFIG.SUPPORTED_LANGS.includes(stored)) return stored;
    return window.STOCK_CONFIG.DEFAULT_LANG;
  }

  function resolveKey(dict, key) {
    return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), dict);
  }

  function t(key) {
    const dict = dictionaries[currentLang];
    if (!dict) return key;
    const value = resolveKey(dict, key);
    return value !== null ? value : key;
  }

  function applyTranslations() {
    const dict = dictionaries[currentLang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = resolveKey(dict, key);
      if (value !== null) el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const value = resolveKey(dict, key);
      if (value !== null) el.setAttribute('placeholder', value);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label');
      const value = resolveKey(dict, key);
      if (value !== null) el.setAttribute('aria-label', value);
    });

    const pageKey = document.body.getAttribute('data-page');
    const metaTitle = (pageKey && resolveKey(dict, `pages.${pageKey}.title`)) || resolveKey(dict, 'meta.title');
    const metaDesc = (pageKey && resolveKey(dict, `pages.${pageKey}.description`)) || resolveKey(dict, 'meta.description');
    if (metaTitle) document.title = metaTitle;
    if (metaDesc) {
      const metaTag = document.querySelector('meta[name="description"]');
      if (metaTag) metaTag.setAttribute('content', metaDesc);
    }
  }

  function applyDirection(lang) {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
  }

  function updateLangSwitchUI(lang) {
    document.querySelectorAll('[data-lang-option]').forEach((btn) => {
      const isActive = btn.getAttribute('data-lang-option') === lang;
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  function loadDictionary(lang) {
    if (dictionaries[lang]) return Promise.resolve(dictionaries[lang]);
    return fetch(`${basePath}translations/${lang}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load translation file: ' + lang);
        return res.json();
      })
      .then((data) => {
        dictionaries[lang] = data;
        return data;
      });
  }

  /**
   * Switches the active language, updates the DOM, persists the choice,
   * and dispatches a "stock:langchange" event so other modules
   * (market data, news, etc.) can re-render dynamic content.
   */
  function setLanguage(lang) {
    if (!window.STOCK_CONFIG.SUPPORTED_LANGS.includes(lang)) return Promise.reject(new Error('Unsupported language: ' + lang));

    return loadDictionary(lang).then(() => {
      currentLang = lang;
      localStorage.setItem(window.STOCK_CONFIG.LANG_STORAGE_KEY, lang);
      applyDirection(lang);
      applyTranslations();
      updateLangSwitchUI(lang);
      document.dispatchEvent(new CustomEvent('stock:langchange', { detail: { lang } }));
    });
  }

  function getLanguage() {
    return currentLang;
  }

  function init(pathPrefix = '') {
    basePath = pathPrefix;
    const initialLang = getInitialLang();
    return setLanguage(initialLang);
  }

  window.I18n = { init, setLanguage, getLanguage, t };
})();
