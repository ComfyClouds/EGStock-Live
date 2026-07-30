/**
 * Economic Group — Skeleton Loading Helper
 * Renders/removes skeleton placeholder markup inside a container while
 * async Google Sheets data is being fetched.
 */

(function () {
  function renderSkeletonCards(container, count = 3, variant = 'card') {
    if (!container) return;
    const items = Array.from({ length: count })
      .map(() => skeletonTemplate(variant))
      .join('');
    container.innerHTML = items;
    container.setAttribute('aria-busy', 'true');
  }

  function skeletonTemplate(variant) {
    if (variant === 'news') {
      return `
        <div class="card skeleton-card" aria-hidden="true">
          <div class="skeleton skeleton-thumb"></div>
          <div class="skeleton skeleton-text skeleton-line short"></div>
          <div class="skeleton skeleton-text skeleton-title"></div>
          <div class="skeleton skeleton-text skeleton-line"></div>
          <div class="skeleton skeleton-text skeleton-line"></div>
        </div>`;
    }
    if (variant === 'tile') {
      return `
        <div class="card skeleton-card" aria-hidden="true">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-text skeleton-line short"></div>
          <div class="skeleton skeleton-text skeleton-title"></div>
        </div>`;
    }
    if (variant === 'row') {
      return `
        <div class="skeleton-card" aria-hidden="true" style="flex-direction:row;align-items:center;">
          <div class="skeleton skeleton-avatar"></div>
          <div style="flex:1;">
            <div class="skeleton skeleton-text skeleton-line short"></div>
            <div class="skeleton skeleton-text skeleton-line"></div>
          </div>
        </div>`;
    }
    return `
      <div class="card skeleton-card" aria-hidden="true">
        <div class="skeleton skeleton-text skeleton-title"></div>
        <div class="skeleton skeleton-text skeleton-line"></div>
        <div class="skeleton skeleton-text skeleton-line short"></div>
      </div>`;
  }

  function clearBusy(container) {
    if (container) container.removeAttribute('aria-busy');
  }

  window.StockSkeleton = { renderSkeletonCards, clearBusy };
})();
