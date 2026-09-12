(function () {
  'use strict';

  const root = document.documentElement;
  const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
  let revealObserver = null;
  let scheduler = null;
  let scrollDirector = null;

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

  function createFrameScheduler() {
    const jobs = new Set();
    let frameId = null;

    function frame(time) {
      frameId = null;
      let keepRunning = false;
      jobs.forEach((job) => {
        keepRunning = job(time) === true || keepRunning;
      });
      if (keepRunning && !document.hidden) frameId = requestAnimationFrame(frame);
    }

    return {
      add(job) {
        jobs.add(job);
        return () => jobs.delete(job);
      },
      request() {
        if (frameId === null && !document.hidden) frameId = requestAnimationFrame(frame);
      },
      cancel() {
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
      },
    };
  }

  function createScrollDirector(frameScheduler) {
    const sections = [...document.querySelectorAll('section[id]')];
    const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
    const current = document.querySelector('[data-section-current]');
    let dirty = true;

    function render() {
      if (!dirty || !sections.length) return false;
      dirty = false;

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      root.style.setProperty('--scroll-progress', (scrollY / maxScroll).toFixed(4));

      const probe = scrollY + Math.min(innerHeight * 0.35, 260);
      const active = sections.reduce((match, section) => {
        return section.offsetTop <= probe ? section : match;
      }, sections[0]);

      const index = Math.max(0, sections.indexOf(active));
      if (current) current.textContent = String(index).padStart(2, '0');
      links.forEach((link) => {
        const isActive = link.hash === `#${active.id}`;
        if (isActive) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      return false;
    }

    function markDirty() {
      dirty = true;
      frameScheduler.request();
    }

    window.addEventListener('scroll', markDirty, { passive: true });
    window.addEventListener('resize', markDirty);
    frameScheduler.add(render);
    markDirty();

    return { refresh: markDirty };
  }

  function refresh() {
    syncCapabilityClasses();
    initReveals();
    scrollDirector?.refresh();
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
    scheduler = createFrameScheduler();
    scrollDirector = safeInit('scroll', () => createScrollDirector(scheduler));
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
