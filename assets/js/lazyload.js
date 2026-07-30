/**
 * Economic Group — Lazy Loading & Reveal Animations
 * Uses IntersectionObserver for both native lazy-loaded images
 * (loading="lazy" is primary; this is a progressive-enhancement layer
 * for browsers that need a fade-in once loaded) and scroll-reveal
 * animations on elements marked with [data-reveal].
 */

(function () {
  function initImageFadeIn() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach((img) => {
      if (img.complete) {
        img.classList.add('is-loaded');
        return;
      }
      img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
    });
  }

  function initRevealObserver() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('reveal'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /**
   * Observes a container and calls onVisible() the first time it enters
   * the viewport. Used to defer fetching section data (Market, News, etc.)
   * until the section is about to be seen.
   */
  function onEnterViewport(el, onVisible, options = {}) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      onVisible();
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onVisible();
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '200px 0px', ...options }
    );
    observer.observe(el);
  }

  window.StockLazy = { initImageFadeIn, initRevealObserver, onEnterViewport };
})();
