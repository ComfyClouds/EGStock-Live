/**
 * Economic Group — App Teaser Page
 * Wires up the "notify me" newsletter form (writes to the same
 * NewsletterSignups sheet target used by the site footer).
 */

(function () {
  const { qs, isValidEmail } = window.StockUtils;

  function initNewsletterForm() {
    const form = qs('#teaser-notify-form');
    const status = qs('#teaser-notify-status');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailField = qs('#teaser-notify-email', form);
      const email = emailField.value.trim();
      const lang = window.I18n.getLanguage();

      if (!isValidEmail(email)) {
        status.textContent = window.I18n.t('contact_form.invalid_email');
        status.className = 'teaser-notify-status error';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> ${window.I18n.t('app_teaser.newsletter_submit')}`;

      window.SheetsAPI.submitToSheet('NewsletterSignups', {
        Email: email,
        Language: lang,
        Source: 'App Teaser Page'
      })
        .then((res) => {
          status.textContent = res && res.alreadySubscribed
            ? window.I18n.t('app_teaser.newsletter_already')
            : window.I18n.t('app_teaser.newsletter_success');
          status.className = 'teaser-notify-status success';
          form.reset();
        })
        .catch(() => {
          status.textContent = window.I18n.t('app_teaser.newsletter_error');
          status.className = 'teaser-notify-status error';
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        });
    });
  }

  function init() {
    window.StockPageChrome.init('../').then(initNewsletterForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
