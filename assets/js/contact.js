/**
 * Economic Group — Contact Module
 * Renders contact information cards from the ContactInformation sheet
 * and handles inline-validated submission of the contact form
 * (writes to ContactSubmissions via the Sheets API).
 */

(function () {
  const { qs, qsa, escapeHtml, isValidEmail } = window.StockUtils;
  let contactInfoData = [];
  let loaded = false;

  function renderInfoCards(lang) {
    const list = qs('#contact-info-list');
    if (!list) return;
    window.StockSkeleton.clearBusy(list);

    list.innerHTML = contactInfoData
      .sort((a, b) => a.Order - b.Order)
      .map((item) => {
        const label = lang === 'ar' ? item.LabelAR : item.LabelEN;
        const value = lang === 'ar' ? item.ValueAR : item.ValueEN;
        const mapUrl = item.MapURL || item.GoogleMapsURL || item.MapLink;

        const valueHtml = mapUrl
          ? `<a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer" class="contact-info-link">${escapeHtml(value)}</a>`
          : escapeHtml(value);

        return `
          <div class="card contact-info-card" data-reveal>
            <span class="contact-info-icon">${window.StockIcons.icon(item.Icon || 'map-pin')}</span>
            <div>
              <div class="contact-info-label">${escapeHtml(label)}</div>
              <div class="contact-info-value">${valueHtml}</div>
            </div>
          </div>`;
      })
      .join('');
    window.StockLazy.initRevealObserver();
  }

  function load() {
    if (loaded) return;
    loaded = true;
    const list = qs('#contact-info-list');
    window.StockSkeleton.renderSkeletonCards(list, 4, 'row');

    window.SheetsAPI.fetchSheet('ContactInformation').then((rows) => {
      contactInfoData = rows;
      renderInfoCards(window.I18n.getLanguage());
    });
  }

  function showFieldError(field, message) {
    const errorEl = field.parentElement.querySelector('.form-error-msg');
    field.classList.add('has-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('is-visible');
    }
  }

  function clearFieldError(field) {
    const errorEl = field.parentElement.querySelector('.form-error-msg');
    field.classList.remove('has-error');
    if (errorEl) errorEl.classList.remove('is-visible');
  }

  function validateForm(form) {
    let isValid = true;
    const nameField = qs('#contact-name', form);
    const emailField = qs('#contact-email', form);
    const messageField = qs('#contact-message', form);
    const requiredMsg = window.I18n.t('contact_form.required_field');
    const emailMsg = window.I18n.t('contact_form.invalid_email');

    [nameField, messageField].forEach((field) => {
      if (!field.value.trim()) {
        showFieldError(field, requiredMsg);
        isValid = false;
      } else {
        clearFieldError(field);
      }
    });

    if (!emailField.value.trim()) {
      showFieldError(emailField, requiredMsg);
      isValid = false;
    } else if (!isValidEmail(emailField.value.trim())) {
      showFieldError(emailField, emailMsg);
      isValid = false;
    } else {
      clearFieldError(emailField);
    }

    return isValid;
  }

  function initForm() {
    const form = qs('#contact-form');
    if (!form) return;
    const statusEl = qs('#contact-form-status');

    qsa('input, textarea', form).forEach((field) => {
      field.addEventListener('blur', () => {
        if (field.hasAttribute('required') && !field.value.trim()) {
          showFieldError(field, window.I18n.t('contact_form.required_field'));
        } else if (field.type === 'email' && field.value.trim() && !isValidEmail(field.value.trim())) {
          showFieldError(field, window.I18n.t('contact_form.invalid_email'));
        } else {
          clearFieldError(field);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form)) {
        const firstError = qs('.has-error', form);
        firstError?.focus();
        return;
      }

      const submitBtn = qs('button[type="submit"]', form);
      const originalHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(window.I18n.t('contact_form.sending'))}`;

      const payload = {
        Name: qs('#contact-name', form).value.trim(),
        Email: qs('#contact-email', form).value.trim(),
        Phone: qs('#contact-phone', form).value.trim(),
        Subject: qs('#contact-subject', form).value.trim(),
        Message: qs('#contact-message', form).value.trim(),
        Language: window.I18n.getLanguage()
      };

      window.SheetsAPI.submitToSheet('ContactSubmissions', payload)
        .then(() => {
          statusEl.textContent = window.I18n.t('contact_form.success');
          statusEl.className = 'form-status success';
          form.reset();
        })
        .catch(() => {
          statusEl.textContent = window.I18n.t('contact_form.error');
          statusEl.className = 'form-status error';
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        });
    });
  }

  function init() {
    initForm();

    document.addEventListener('stock:langchange', (e) => {
      if (loaded) renderInfoCards(e.detail.lang);
    });

    window.StockLazy.onEnterViewport(qs('#contact'), load);
  }

  window.StockContact = { init };
})();
