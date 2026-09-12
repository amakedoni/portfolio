(function () {
  'use strict';

  const root = document.documentElement;
  const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
  let revealObserver = null;
  let scheduler = null;
  let scrollDirector = null;
  let pointerController = null;

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
      if (!element.style.getPropertyValue('--reveal-delay')) {
        element.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 70}ms`);
      }
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

  function createPointerController(frameScheduler) {
    const targets = new Set();
    const subscribers = new Set();
    let clientX = innerWidth / 2;
    let clientY = innerHeight / 2;
    let dirty = false;

    function register(element, writer) {
      targets.add({ element, writer });
    }

    function render() {
      if (!dirty || !preferences.finePointer || preferences.reducedMotion) return false;
      dirty = false;
      targets.forEach(({ element, writer }) => {
        const rect = element.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width - 0.5) * 2));
        const y = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height - 0.5) * 2));
        writer(element, x, y);
      });
      subscribers.forEach((writer) => writer(clientX, clientY));
      return false;
    }

    window.addEventListener('pointermove', (event) => {
      clientX = event.clientX;
      clientY = event.clientY;
      dirty = true;
      frameScheduler.request();
    }, { passive: true });

    frameScheduler.add(render);
    return {
      register,
      subscribe(writer) {
        subscribers.add(writer);
        return () => subscribers.delete(writer);
      },
    };
  }

  function initHero(pointer) {
    [...document.querySelectorAll('#hero [data-motion]')].forEach((element, index) => {
      element.style.setProperty('--intro-delay', `${90 + index * 75}ms`);
    });
    const accent = document.querySelector('#hero .accent');
    if (accent) {
      pointer.register(accent, (element, x, y) => {
        element.style.setProperty('--pointer-x', x.toFixed(3));
        element.style.setProperty('--pointer-y', y.toFixed(3));
      });
    }
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('hero-in')));
  }

  function setCounterValue(element, value) {
    const suffix = element.querySelector('.u');
    if (!suffix) {
      element.textContent = value;
      return;
    }
    let textNode = element.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      textNode = document.createTextNode('');
      element.insertBefore(textNode, suffix);
    }
    textNode.nodeValue = value;
  }

  function animateCounter(element, duration, delay, frameScheduler) {
    const target = Number.parseInt(element.dataset.count || '0', 10);
    if (duration === 0) {
      setCounterValue(element, String(target));
      return;
    }

    setCounterValue(element, '0');
    let start = null;
    let removeJob = null;
    removeJob = frameScheduler.add((time) => {
      if (start === null) start = time + delay;
      if (time < start) return true;
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounterValue(element, String(Math.round(target * eased)));
      if (progress < 1) return true;
      removeJob();
      return false;
    });
    frameScheduler.request();
  }

  function initAbout(pointer, frameScheduler) {
    const section = document.querySelector('#about');
    const profile = document.querySelector('.profile');
    if (!section || !profile) return;

    pointer.register(profile, (element, x, y) => {
      element.style.setProperty('--portrait-x', x.toFixed(3));
      element.style.setProperty('--portrait-y', y.toFixed(3));
    });

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      section.classList.add('about-in');
      document.querySelectorAll('[data-count]').forEach((element, index) => {
        animateCounter(element, preferences.reducedMotion ? 0 : 900, index * 90, frameScheduler);
      });
      observer.disconnect();
    }, { threshold: 0.25 });
    observer.observe(section);
  }

  function initMarquee(frameScheduler) {
    const marquee = document.querySelector('.marquee');
    const track = document.querySelector('.mtrack');
    if (!marquee || !track) return;

    let visible = false;
    let offset = 0;
    let lastTime = 0;
    let lastScrollY = window.scrollY;
    let impulse = 0;

    window.addEventListener('scroll', () => {
      const nextScrollY = window.scrollY;
      impulse = Math.max(-60, Math.min(60, (nextScrollY - lastScrollY) * 2.4));
      lastScrollY = nextScrollY;
      frameScheduler.request();
    }, { passive: true });

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) frameScheduler.request();
    }).observe(marquee);

    frameScheduler.add((time) => {
      if (!visible || preferences.reducedMotion) {
        lastTime = time;
        return false;
      }
      const delta = Math.min(40, lastTime ? time - lastTime : 16) / 1000;
      lastTime = time;
      impulse *= 0.92;
      offset -= (18 + impulse) * delta;
      const halfWidth = Math.max(1, track.scrollWidth / 2);
      if (offset <= -halfWidth) offset += halfWidth;
      if (offset > 0) offset -= halfWidth;
      track.style.setProperty('--marquee-x', `${offset.toFixed(2)}px`);
      return true;
    });
  }

  function initProjects(pointer) {
    const section = document.querySelector('#projects');
    const mock = document.querySelector('.pf-mock');
    if (!section) return;

    if (mock) {
      const device = mock.querySelector('.device');
      device?.style.setProperty('--device-x', '0');
      device?.style.setProperty('--device-y', '0');
    }

    if (preferences.reducedMotion) {
      section.classList.add('projects-in');
      return;
    }

    if (mock) {
      pointer.register(mock, (element, x, y) => {
        const device = element.querySelector('.device');
        if (!device) return;
        device.style.setProperty('--device-x', x.toFixed(3));
        device.style.setProperty('--device-y', y.toFixed(3));
      });
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      section.classList.add('projects-in');
      observer.disconnect();
    }, { threshold: 0.14 });
    observer.observe(section);
  }

  function captureSkillLayout() {
    const container = document.querySelector('.skills-categories');
    if (!container || preferences.reducedMotion) return null;
    return {
      height: container.getBoundingClientRect().height,
      positions: new Map([...container.querySelectorAll('.skcat:not([hidden])')].map((item) => [
        item,
        item.getBoundingClientRect(),
      ])),
    };
  }

  function animateSkillLayout(snapshot) {
    const container = document.querySelector('.skills-categories');
    if (!container) return;
    if (!snapshot || preferences.reducedMotion) {
      scrollDirector?.refresh();
      return;
    }

    const finalHeight = container.getBoundingClientRect().height;
    container.dataset.animating = 'true';
    container.style.height = `${snapshot.height}px`;

    container.querySelectorAll('.skcat:not([hidden])').forEach((item) => {
      const first = snapshot.positions.get(item);
      const last = item.getBoundingClientRect();
      const start = first
        ? { transform: `translate(${first.left - last.left}px,${first.top - last.top}px)`, opacity: 0.7 }
        : { transform: 'translateY(10px)', opacity: 0 };
      item.animate([
        start,
        { transform: 'translate(0,0)', opacity: 1 },
      ], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
    });

    requestAnimationFrame(() => {
      container.style.transition = 'height 360ms var(--ease-out)';
      container.style.height = `${finalHeight}px`;
    });
    window.setTimeout(() => {
      container.style.height = '';
      container.style.transition = '';
      delete container.dataset.animating;
      scrollDirector?.refresh();
    }, 380);
  }

  function initSkills() {
    const section = document.querySelector('#skills');
    if (!section) return;

    section.querySelectorAll('.sk').forEach((skill) => {
      const level = Number.parseInt(skill.querySelector('.lv')?.textContent || '0', 10) / 100;
      skill.style.setProperty('--skill-level', String(Math.max(0, Math.min(1, level))));
    });

    const activate = () => section.classList.add('skills-in');
    if (preferences.reducedMotion) {
      activate();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      activate();
      observer.disconnect();
    }, { threshold: 0.2 });
    observer.observe(section);
  }

  function initEducation() {
    const section = document.querySelector('#education');
    if (!section) return;
    section.querySelectorAll('.ecard').forEach((card, index) => {
      card.style.setProperty('--reveal-delay', `${index * 90}ms`);
    });

    const activate = () => {
      section.style.setProperty('--timeline-progress', '1');
      section.classList.add('education-in');
    };
    if (preferences.reducedMotion) {
      activate();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      activate();
      observer.disconnect();
    }, { threshold: 0.2 });
    observer.observe(section);
  }

  function moveGridFocus(cell, delta) {
    const cells = [...document.querySelectorAll('.git-cell')];
    const current = Number.parseInt(cell.dataset.index || '0', 10);
    const next = cells[Math.max(0, Math.min(cells.length - 1, current + delta))];
    if (!next) return;
    cells.forEach((item) => { item.tabIndex = item === next ? 0 : -1; });
    next.focus();
  }

  function initGitHubGridInteractions() {
    const section = document.querySelector('#github');
    const grid = document.querySelector('#git-cells');
    const tooltip = document.querySelector('#git-tooltip');
    if (!section || !grid || !tooltip) return;

    function positionTooltip(x, y) {
      const left = Math.max(8, Math.min(innerWidth - tooltip.offsetWidth - 18, x));
      const top = Math.max(8, Math.min(innerHeight - tooltip.offsetHeight - 18, y));
      tooltip.style.left = `${Math.round(left)}px`;
      tooltip.style.top = `${Math.round(top)}px`;
    }

    function showTooltip(cell, x, y) {
      tooltip.textContent = cell.dataset.tooltip || '';
      tooltip.hidden = false;
      positionTooltip(x, y);
    }

    function hideTooltip() {
      tooltip.hidden = true;
    }

    grid.addEventListener('pointerover', (event) => {
      const cell = event.target.closest('.git-cell');
      if (cell) showTooltip(cell, event.clientX, event.clientY);
    });
    grid.addEventListener('pointermove', (event) => {
      if (!tooltip.hidden) positionTooltip(event.clientX, event.clientY);
    }, { passive: true });
    grid.addEventListener('pointerout', hideTooltip);
    grid.addEventListener('focusin', (event) => {
      const cell = event.target.closest('.git-cell');
      if (!cell) return;
      const rect = cell.getBoundingClientRect();
      showTooltip(cell, rect.right, rect.bottom);
    });
    grid.addEventListener('focusout', hideTooltip);
    grid.addEventListener('keydown', (event) => {
      const cell = event.target.closest('.git-cell');
      if (!cell) return;
      const deltas = { ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 };
      const delta = deltas[event.key];
      if (!delta) return;
      event.preventDefault();
      moveGridFocus(cell, delta);
    });

    const activate = () => section.classList.add('github-in');
    if (preferences.reducedMotion) {
      activate();
    } else {
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        activate();
        observer.disconnect();
      }, { threshold: 0.18 });
      observer.observe(section);
    }
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
    pointerController = safeInit('pointer', () => createPointerController(scheduler));
    safeInit('hero', () => initHero(pointerController));
    safeInit('about', () => initAbout(pointerController, scheduler));
    safeInit('marquee', () => initMarquee(scheduler));
    safeInit('projects', () => initProjects(pointerController));
    safeInit('skills', initSkills);
    safeInit('education', initEducation);
    safeInit('github', initGitHubGridInteractions);
    refresh();
    requestAnimationFrame(() => root.classList.add('motion-ready'));
  }

  reducedMotionMedia.addEventListener('change', refresh);
  finePointerMedia.addEventListener('change', syncCapabilityClasses);
  document.addEventListener('visibilitychange', syncCapabilityClasses);

  window.PortfolioMotion = { preferences, refresh, safeInit };
  Object.assign(window.PortfolioMotion, {
    captureSkillLayout,
    animateSkillLayout,
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
