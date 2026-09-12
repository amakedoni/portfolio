(function () {
  'use strict';

  const root = document.documentElement;
  const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
  let revealObserver = null;

  const preferences = {
    get reducedMotion() {
      return reducedMotionMedia.matches;
    },
    get finePointer() {
      return finePointerMedia.matches;
    },
  };

  function syncCapabilityClasses() {
    root.classList.toggle('reduce-motion', preferences.reducedMotion);
    root.classList.toggle('has-fine-pointer', preferences.finePointer && !preferences.reducedMotion);
  }

  function revealImmediately() {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('in'));
  }

  function initReveals() {
    revealObserver?.disconnect();
    if (preferences.reducedMotion || !('IntersectionObserver' in window)) {
      revealImmediately();
      return;
    }

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px' });

    document.querySelectorAll('.reveal:not(.in)').forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 70}ms`);
      revealObserver.observe(element);
    });
  }

  function refresh() {
    syncCapabilityClasses();
    initReveals();
  }

  function safeInit(name, initializer) {
    try {
      return initializer();
    } catch (error) {
      console.warn(`Portfolio motion: ${name} disabled`, error);
      return null;
    }
  }

  function init() {
    if (root.dataset.motionInitialized === 'true') return;
    root.dataset.motionInitialized = 'true';
    refresh();
    requestAnimationFrame(() => root.classList.add('motion-ready'));
  }

  reducedMotionMedia.addEventListener('change', refresh);
  finePointerMedia.addEventListener('change', syncCapabilityClasses);
  document.addEventListener('visibilitychange', syncCapabilityClasses);

  window.PortfolioMotion = { preferences, refresh, safeInit };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
