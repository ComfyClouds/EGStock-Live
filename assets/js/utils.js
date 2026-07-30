/**
 * Economic Group — Shared Utilities
 */

(function () {
  /**
   * Formats a number with locale-aware thousands separators.
   * Uses Arabic-Indic digits automatically when lang is "ar" via toLocaleString.
   */
  function formatNumber(value, lang, options = {}) {
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    return Number(value).toLocaleString(locale, options);
  }

  function formatPrice(value, lang) {
    return formatNumber(value, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatPercent(value, lang) {
    const sign = value > 0 ? '+' : '';
    return sign + formatNumber(value, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  }

  function formatDate(dateStr, lang) {
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function directionOf(value) {
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'flat';
  }

  function debounce(fn, wait = 250) {
    let timeoutId;
    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function qs(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function qsa(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function truncate(str, max = 160) {
    if (!str || str.length <= max) return str || '';
    return str.slice(0, max).trim() + '…';
  }

  /**
   * Builds a wa.me link pre-filled with an order message.
   * @param {string} number - digits only, with country code, no "+"
   * @param {string} message
   */
  function buildWhatsAppLink(number, message) {
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function trapFocus(container) {
    const focusable = qsa(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    );
    if (!focusable.length) return () => {};
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKeydown(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', handleKeydown);
    first.focus();
    return () => container.removeEventListener('keydown', handleKeydown);
  }

  window.StockUtils = {
    formatNumber,
    formatPrice,
    formatPercent,
    formatDate,
    directionOf,
    debounce,
    qs,
    qsa,
    escapeHtml,
    truncate,
    buildWhatsAppLink,
    isValidEmail,
    trapFocus
  };
})();
