/**
 * Economic Group — FAQ Item Component
 */

(function () {
  function faqItemTemplate(item, lang) {
    const { escapeHtml } = window.StockUtils;
    const question = lang === 'ar' ? item.QuestionAR : item.QuestionEN;
    const answer = lang === 'ar' ? item.AnswerAR : item.AnswerEN;

    return `
      <div class="faq-item" data-faq-category="${escapeHtml((lang === 'ar' ? item.CategoryAR : item.CategoryEN).toLowerCase())}" data-reveal>
        <button type="button" class="faq-question" aria-expanded="false">
          <span>${escapeHtml(question)}</span>
          <span class="plus-icon">${window.StockIcons.icon('plus')}</span>
        </button>
        <div class="faq-answer">
          <div class="faq-answer-inner">${answer}</div>
        </div>
      </div>`;
  }

  window.StockComponents = window.StockComponents || {};
  window.StockComponents.faqItem = faqItemTemplate;
})();
