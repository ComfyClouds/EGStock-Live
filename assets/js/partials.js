/**
 * Economic Group — Partial Loader
 * Fetches static HTML partials and injects them into the DOM before
 * any section module runs. Must be served over http(s), not file://,
 * since fetch() of local files requires a server (see README).
 */

(function () {
  function loadPartial(url, mountSelector) {
    return fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load partial: ' + url);
        return res.text();
      })
      .then((html) => {
        const mount = document.querySelector(mountSelector);
        if (mount) mount.innerHTML = html;
      });
  }

  function loadAllPartials() {
    return Promise.all([
      loadPartial('partials/header.html', '#header-mount'),
      loadPartial('partials/footer.html', '#footer-mount'),
      loadPartial('partials/news-modal.html', '#news-modal-mount')
    ]);
  }

  window.StockPartials = { loadAllPartials };
})();
