/**
 * Economic Group — Mini Ticker Card Component
 * Used for Indices / Currencies / Commodities tabs.
 */

(function () {
  function miniTickerCardTemplate(items, lang, kind) {
    const { escapeHtml, formatNumber, formatPercent } = window.StockUtils;

    // Handle single item object or array of items
    const itemList = Array.isArray(items) ? items : [items];

    const renderSingleCard = (item) => {
      const name = lang === 'ar' ? item.NameAR : item.NameEN;
      const code = item.Code || item.Pair;
      const value = item.Value !== undefined ? item.Value : item.Rate !== undefined ? item.Rate : item.Price;
      const direction = item.Direction || 'flat';

      return `
        <div class="card mini-ticker-card" data-reveal>
          <div class="mini-ticker-info">
            <span class="mini-ticker-code">${escapeHtml(code)}</span>
            <span class="mini-ticker-name">${escapeHtml(name)}</span>
          </div>
          <div class="mini-ticker-right">
            <div class="mini-ticker-value text-tabular">${escapeHtml(formatNumber(value, lang, { maximumFractionDigits: 2 }))}${kind === 'commodities' && item.Unit ? '/' + escapeHtml(item.Unit) : ''}</div>
            <div class="mini-ticker-percent ${direction} text-tabular">${escapeHtml(formatPercent(item.ChangePercent, lang))}</div>
          </div>
        </div>`;
    };

    const singleSet = itemList.map(renderSingleCard).join('');

    // Return two identical sets side-by-side for seamless infinite looping
    return singleSet + singleSet;
  }

  window.StockComponents = window.StockComponents || {};
  window.StockComponents.miniTickerCard = miniTickerCardTemplate;
})();
