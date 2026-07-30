/**
 * Economic Group — Google Sheets API Client
 *
 * Talks to the Apps Script Web App using JSONP (a <script> tag),
 * which avoids CORS entirely since no XHR/fetch preflight is involved.
 * Falls back to a local sample-data.json file when STOCK_CONFIG.USE_SAMPLE_DATA
 * is true, so the site is fully demoable without a live deployment.
 */

(function () {
  let jsonpCounter = 0;
  let cachedSampleData = null;

  function loadSampleData() {
    if (cachedSampleData) return Promise.resolve(cachedSampleData);
    return fetch(window.STOCK_CONFIG.SAMPLE_DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load sample data');
        return res.json();
      })
      .then((data) => {
        cachedSampleData = data;
        return data;
      });
  }

  /**
   * Fetches a single sheet by name.
   * @param {string} sheetName
   * @returns {Promise<Array<Object>>}
   */
  function fetchSheet(sheetName) {
    if (window.STOCK_CONFIG.USE_SAMPLE_DATA) {
      return loadSampleData().then((data) => data[sheetName] || []);
    }
    return jsonpRequest({ sheet: sheetName }).then((res) => res.rows || []);
  }

  /**
   * Fetches multiple sheets in a single round trip.
   * @param {string[]} sheetNames
   * @returns {Promise<Object<string, Array<Object>>>}
   */
  function fetchSheets(sheetNames) {
    if (window.STOCK_CONFIG.USE_SAMPLE_DATA) {
      return loadSampleData().then((data) => {
        const result = {};
        sheetNames.forEach((name) => {
          result[name] = data[name] || [];
        });
        return result;
      });
    }
    return jsonpRequest({ sheets: sheetNames.join(',') }).then((res) => res.data || {});
  }

  /**
   * Submits a form payload (order, newsletter, contact) to a target sheet.
   * @param {string} target - e.g. "OrderSubmissions" | "NewsletterSignups" | "ContactSubmissions"
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  function submitToSheet(target, payload) {
    if (window.STOCK_CONFIG.USE_SAMPLE_DATA) {
      // Demo mode: simulate a network round trip and success response.
      return new Promise((resolve) => {
        setTimeout(() => {
          console.info('[Demo mode] Would submit to sheet:', target, payload);
          resolve({ success: true, message: 'Saved to ' + target });
        }, 500);
      });
    }
    return jsonpRequest({
      action: 'submit',
      target,
      payload: JSON.stringify(payload)
    });
  }

  /**
   * Submits a new-account signup. Distinct from submitToSheet because the
   * backend also sends a notification email to the admin and a confirmation
   * email to the client (see docs/APPS_SCRIPT_BACKEND.md — handleSignup).
   * Writes to the "New Clients" sheet tab.
   * @param {Object} payload - { Name, Email, Phone, Address, Language }
   * @returns {Promise<Object>}
   */
  function submitSignup(payload) {
    if (window.STOCK_CONFIG.USE_SAMPLE_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.info('[Demo mode] Would add row to "New Clients" and email admin + client:', payload);
          resolve({ success: true, message: 'Signup received' });
        }, 500);
      });
    }
    return jsonpRequest({
      action: 'signup',
      payload: JSON.stringify(payload)
    });
  }

  /**
   * Core JSONP request helper.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  function jsonpRequest(params) {
    return new Promise((resolve, reject) => {
      const callbackName = 'stockJsonp_' + Date.now() + '_' + jsonpCounter++;
      const script = document.createElement('script');
      let settled = false;

      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('Sheets API request timed out: ' + JSON.stringify(params)));
      }, window.STOCK_CONFIG.JSONP_TIMEOUT_MS);

      function cleanup() {
        clearTimeout(timeoutId);
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = function (response) {
        if (settled) return;
        settled = true;
        cleanup();
        if (response && response.success === false) {
          reject(new Error(response.error || 'Sheets API returned an error'));
        } else {
          resolve(response);
        }
      };

      const query = new URLSearchParams({ ...params, callback: callbackName });
      script.src = window.STOCK_CONFIG.SHEETS_API_URL + '?' + query.toString();
      script.onerror = function () {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('Failed to load Sheets API script for: ' + JSON.stringify(params)));
      };

      document.head.appendChild(script);
    });
  }

  window.SheetsAPI = {
    fetchSheet,
    fetchSheets,
    submitToSheet,
    submitSignup
  };
})();
