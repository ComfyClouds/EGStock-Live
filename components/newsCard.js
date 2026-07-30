/**
 * Economic Group — News Card Component
 */

(function () {
  function newsCardTemplate(item, lang) {
    const { escapeHtml, truncate, formatDate } = window.StockUtils;
    const title = lang === 'ar' ? item.TitleAR : item.TitleEN;
    const summary = lang === 'ar' ? item.SummaryAR : item.SummaryEN;
    const category = lang === 'ar' ? item.CategoryAR : item.CategoryEN;
    const readMoreLabel = window.I18n.t('news.read_more');

    return `
      <article class="card card-hover news-card" data-reveal data-news-id="${escapeHtml(item.ID)}">
        <div class="news-card-media">
          <img src="${escapeHtml(item.Image)}" alt="${escapeHtml(title)}" loading="lazy" width="600" height="375">
          <span class="news-card-category">${escapeHtml(category)}</span>
        </div>
        <div class="news-card-body">
          <time class="news-card-date" datetime="${escapeHtml(item.Date)}">${escapeHtml(formatDate(item.Date, lang))}</time>
          <h3 class="news-card-title">${escapeHtml(title)}</h3>
          <p class="news-card-summary">${escapeHtml(truncate(summary, 140))}</p>
          <button type="button" class="news-card-readmore" data-open-news="${escapeHtml(item.ID)}">
            ${escapeHtml(readMoreLabel)}
            ${window.StockIcons.icon('arrow-end')}
          </button>
        </div>
      </article>`;
  }

  window.StockComponents = window.StockComponents || {};
  window.StockComponents.newsCard = newsCardTemplate;
})();
