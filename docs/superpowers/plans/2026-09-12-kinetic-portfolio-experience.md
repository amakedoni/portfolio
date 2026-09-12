# Kinetic Portfolio Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing static portfolio into a coherent kinetic editorial experience while preserving its monochrome neo-brutalist identity, accessibility, and dependency-free delivery.

**Architecture:** Add one dependency-free `js/motion.js` entry point that owns decorative capability detection, reveal choreography, shared animation-frame scheduling, scroll state, and pointer effects. Existing language, menu, theme, filtering, and contact behaviors remain functional without the motion module and communicate with it only through optional APIs or DOM events.

**Tech Stack:** Semantic HTML, inline CSS, vanilla JavaScript, CSS custom properties, IntersectionObserver, requestAnimationFrame, View Transitions API with fallback, Node.js test runner, Playwright, Python static server.

**Spec:** `docs/superpowers/specs/2026-09-12-kinetic-portfolio-experience-design.md`

## Global Constraints

- Add no runtime dependencies and no additional remote assets.
- Keep the existing monochrome palette, Gothic display typography, monospaced metadata, restrained radii, strong borders, and physical offset shadows.
- No scroll hijacking, custom inertial page scrolling, audio, WebGL, canvas-heavy effects, or artificial loading delay.
- Prefer `transform`, `opacity`, and CSS custom properties.
- Keep continuous animation work to one `requestAnimationFrame` coordinator outside the existing event-driven pixel-cursor renderer.
- Disable parallax, magnetic movement, animated cursor labels, marquee velocity response, stagger delays, and counting animation when `prefers-reduced-motion: reduce` matches.
- Do not run fine-pointer effects on touch-only devices.
- Keep the document free from horizontal overflow at 360 px and above.
- Preserve current content wording, project claims, contact destinations, resume files, navigation semantics, language switching, theme switching, and service-worker behavior.
- Bump `CACHE_NAME` and add every new production asset to `urlsToCache`.

## File Structure

- Create `js/motion.js`: capability profile, shared frame scheduler, reveals, scroll state, pointer state, section choreography, and optional public diagnostics API.
- Modify `index.html`: safe no-JavaScript boot marker, motion-related markup hooks, visual CSS, event bridges, and the new deferred script.
- Modify `js/cursor.js`: integrate context-label visibility with the existing fine-pointer/reduced-motion lifecycle without changing its pixel-trail drawing behavior.
- Modify `js/theme.js`: record the toggle origin and apply the radial View Transition when supported.
- Modify `tests/portfolio-ui.test.cjs`: add progressive-enhancement, motion, accessibility, responsive, and error-regression coverage.
- Modify `sw.js`: cache `js/motion.js` and increment the cache version.
- Modify `404.html` only if the final shared motion-token audit finds a real mismatch.

---

### Task 1: Progressive-Enhancement Motion Foundation

**Files:**
- Create: `js/motion.js`
- Modify: `index.html:1-5`
- Modify: `index.html:87-129`
- Modify: `index.html:596-615`
- Modify: `index.html:1686-1689`
- Modify: `index.html:1841-1843`
- Test: `tests/portfolio-ui.test.cjs:36-48`
- Test: `tests/portfolio-ui.test.cjs:95`

**Interfaces:**
- Consumes: `window.matchMedia`, `IntersectionObserver`, elements with `.reveal`.
- Produces: `window.PortfolioMotion.preferences`, `window.PortfolioMotion.refresh()`, root classes `js`, `motion-ready`, `has-fine-pointer`, and `reduce-motion`.

- [ ] **Step 1: Write the failing no-JavaScript and motion-bootstrap tests**

Update the test context helper so JavaScript can be disabled:

```js
async function openPage(options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1280, height: 900 },
    reducedMotion: options.reducedMotion || 'no-preference',
    colorScheme: 'light',
    javaScriptEnabled: options.javaScriptEnabled !== false,
    hasTouch: options.hasTouch || false,
  });
  const page = await context.newPage();
  await page.goto(`\${origin}\${options.path || '/'}`, { waitUntil: 'domcontentloaded' });
  if (!options.keepLoader && options.javaScriptEnabled !== false) {
    await page.addStyleTag({ content: '.loading-screen{display:none!important}' });
  }
  return { context, page };
}

test('essential content stays visible without JavaScript', async () => {
  const { context, page } = await openPage({ javaScriptEnabled: false, keepLoader: true });
  assert.equal(await page.locator('.loading-screen').evaluate((el) => getComputedStyle(el).display), 'none');
  assert.equal(await page.locator('#hero h1').isVisible(), true);
  assert.equal(await page.locator('#contact-form').isVisible(), true);
  await context.close();
});

test('motion bootstrap publishes a capability profile without hiding content', async () => {
  const { context, page } = await openPage();
  await page.waitForFunction(() => document.documentElement.classList.contains('motion-ready'));
  assert.equal(await page.evaluate(() => Boolean(window.PortfolioMotion?.preferences)), true);
  assert.equal(await page.locator('#hero h1').isVisible(), true);
  await context.close();
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-name-pattern="essential content|motion bootstrap" tests/portfolio-ui.test.cjs
```

Expected: FAIL because the loader covers the no-JavaScript page and `window.PortfolioMotion` does not exist.

- [ ] **Step 3: Add the safe boot marker and progressive CSS contract**

Change the document start and add the early class switch inside `<head>`:

```html
<html lang="en" class="no-js">
<head>
<script>document.documentElement.classList.replace('no-js', 'js');</script>
```

Add the loader fallback and scope hidden reveal states to `motion-ready`:

```css
.no-js .loading-screen{display:none}
.reveal{opacity:1;transform:none}
.motion-ready .reveal{
  opacity:0;
  transform:translateY(42px);
  transition:
    opacity var(--motion-reveal) var(--ease-out),
    transform var(--motion-reveal) var(--ease-out);
  transition-delay:var(--reveal-delay,0ms)
}
.motion-ready .reveal.in{opacity:1;transform:none}
```

Delete the old inline reveal observer at `index.html:1686-1689`, because the new controller owns it.

- [ ] **Step 4: Create the capability and reveal controller**

Create `js/motion.js` with this initial implementation:

```js
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
      element.style.setProperty('--reveal-delay', `\${Math.min(index % 3, 2) * 70}ms`);
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
      console.warn(`Portfolio motion: \${name} disabled`, error);
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
```

Load it before the existing cursor script:

```html
<script src="js/motion.js" defer></script>
<script src="js/cursor.js" defer></script>
```

- [ ] **Step 5: Run the focused tests and the existing regression suite**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/portfolio-ui.test.cjs
```

Expected: all tests PASS, including the two new progressive-enhancement tests.

- [ ] **Step 6: Commit the foundation**

```bash
git add index.html js/motion.js tests/portfolio-ui.test.cjs
git commit -m "feat: add progressive motion foundation"
```

---

### Task 2: Scroll Director, Page Progress, and Active Navigation

**Files:**
- Modify: `index.html:131-223`
- Modify: `index.html:735-787`
- Modify: `js/motion.js`
- Test: `tests/portfolio-ui.test.cjs`

**Interfaces:**
- Consumes: sections with IDs `hero`, `about`, `projects`, `skills`, `education`, `github`, `contact`; navigation anchors with hash links.
- Produces: `createFrameScheduler()`, `ScrollDirector.refresh()`, CSS property `--scroll-progress`, `aria-current="location"`, and `[data-section-current]` text.

- [ ] **Step 1: Write the failing scroll-state test**

```js
test('scroll progress and active navigation follow the visible section', async () => {
  const { context, page } = await openPage();
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('a[href="#projects"]')?.getAttribute('aria-current') === 'location');

  const state = await page.evaluate(() => ({
    progress: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scroll-progress')),
    section: document.querySelector('[data-section-current]')?.textContent,
  }));

  assert.ok(state.progress > 0.1 && state.progress < 0.9);
  assert.equal(state.section, '02');
  await context.close();
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-name-pattern="scroll progress" tests/portfolio-ui.test.cjs
```

Expected: FAIL because the progress variable, section counter, and active-link state do not exist.

- [ ] **Step 3: Add progress and section-status markup**

Insert after the loading screen:

```html
<div class="scroll-progress" aria-hidden="true"><span></span></div>
```

Insert at the start of the desktop controls:

```html
<span class="section-status" aria-hidden="true">
  <span data-section-current>00</span><span class="section-status-sep">/</span><span>06</span>
</span>
```

Add CSS:

```css
.scroll-progress{
  position:fixed;inset:0 0 auto;z-index:220;height:2px;
  background:transparent;pointer-events:none
}
.scroll-progress span{
  display:block;width:100%;height:100%;background:var(--ink);
  transform:scaleX(var(--scroll-progress,0));transform-origin:left center;
  will-change:transform
}
.section-status{
  display:inline-flex;align-items:center;gap:4px;margin-right:4px;
  font-family:var(--mono);font-size:.65rem;letter-spacing:.12em;color:var(--ink-3)
}
.section-status-sep{opacity:.5}
.nav-links a[aria-current="location"]{color:var(--ink)}
.nav-links a[aria-current="location"]::after{width:100%}
body::before{
  content:"";position:fixed;inset:0;z-index:210;pointer-events:none;opacity:.018;
  background:repeating-radial-gradient(circle at 0 0,var(--ink) 0 1px,transparent 1px 4px);
  mix-blend-mode:multiply
}
body.dark-theme::before{mix-blend-mode:screen;opacity:.014}
section:not(#hero)::after{
  content:"+";position:absolute;right:max(20px,5vw);top:-9px;
  color:var(--line);font-family:var(--mono);font-size:18px;line-height:1;
  pointer-events:none
}
```

- [ ] **Step 4: Add the shared scheduler and ScrollDirector**

Extend `js/motion.js`:

```js
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

function createScrollDirector(scheduler) {
  const sections = [...document.querySelectorAll('section[id]')];
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const current = document.querySelector('[data-section-current]');
  let dirty = true;

  function render() {
    if (!dirty) return false;
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
      const isActive = link.hash === `#\${active.id}`;
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    return false;
  }

  function markDirty() {
    dirty = true;
    scheduler.request();
  }

  window.addEventListener('scroll', markDirty, { passive: true });
  window.addEventListener('resize', markDirty);
  scheduler.add(render);
  markDirty();

  return { refresh: markDirty };
}
```

Create one scheduler during `init()`, initialize the director through `safeInit('scroll', () => createScrollDirector(scheduler))`, and have the existing public `refresh()` call `scrollDirector?.refresh()`. Initialize every later section adapter through `safeInit` so one decorative failure cannot block the rest of the page.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/portfolio-ui.test.cjs
```

Expected: all tests PASS; the scroll-state test observes section `02` at Projects.

- [ ] **Step 6: Commit the scroll director**

```bash
git add index.html js/motion.js tests/portfolio-ui.test.cjs
git commit -m "feat: direct scroll progress and navigation"
```

---

### Task 3: Hero, Marquee, and About Choreography

**Files:**
- Modify: `index.html:224-370`
- Modify: `index.html:790-875`
- Modify: `index.html:1647-1721`
- Modify: `js/motion.js`
- Test: `tests/portfolio-ui.test.cjs`

**Interfaces:**
- Consumes: the Task 2 scheduler, `MotionPreferences`, hero rows, `.mtrack`, `.profile`, and `[data-count]`.
- Produces: `createPointerController(scheduler)`, CSS variables `--pointer-x`, `--pointer-y`, `--marquee-x`, `--portrait-x`, `--portrait-y`, and scene classes `hero-in`, `about-in`.

- [ ] **Step 1: Write failing choreography and pointer-capability tests**

```js
test('hero and about scenes settle into their final state', async () => {
  const { context, page } = await openPage();
  await page.waitForFunction(() => document.documentElement.classList.contains('hero-in'));
  assert.equal(await page.locator('#hero h1 .row').first().evaluate((el) => getComputedStyle(el).opacity), '1');

  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#about')?.classList.contains('about-in'));
  assert.deepEqual(await page.locator('[data-count]').evaluateAll((items) => items.map((item) => item.childNodes[0].textContent.trim())), ['5', '5', '4', '3']);
  await context.close();
});

test('portrait parallax only responds to a fine pointer', async () => {
  const desktop = await openPage();
  await desktop.page.locator('.profile').scrollIntoViewIfNeeded();
  const box = await desktop.page.locator('.profile').boundingBox();
  await desktop.page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
  await desktop.page.waitForTimeout(80);
  assert.notEqual(await desktop.page.locator('.profile').evaluate((el) => getComputedStyle(el).getPropertyValue('--portrait-x').trim()), '');
  await desktop.context.close();

  const touch = await openPage({ hasTouch: true, viewport: { width: 390, height: 844 } });
  assert.equal(await touch.page.evaluate(() => document.documentElement.classList.contains('has-fine-pointer')), false);
  await touch.context.close();
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-name-pattern="hero and about|portrait parallax" tests/portfolio-ui.test.cjs
```

Expected: FAIL because the scene classes and portrait variables are missing.

- [ ] **Step 3: Add semantic motion hooks and final-state-first CSS**

Add `data-motion="hero-row"` to each heading row, `data-motion="hero-detail"` to the metadata, lede, role rotator, and CTA row, and `data-pointer="portrait"` to `.profile`.

Add CSS:

```css
.motion-ready #hero [data-motion="hero-row"],
.motion-ready #hero [data-motion="hero-detail"]{
  opacity:0;transform:translateY(34px);
  transition:opacity 720ms var(--ease-out),transform 820ms var(--ease-out);
  transition-delay:var(--intro-delay,0ms)
}
.motion-ready.hero-in #hero [data-motion]{opacity:1;transform:none}
.motion-ready #hero h1 .row{overflow:hidden}
.motion-ready #hero h1 .accent{
  translate:calc(var(--pointer-x,0) * 4px) calc(var(--pointer-y,0) * 3px)
}
.profile picture{
  transform:translate(
    calc(var(--portrait-x,0) * 7px),
    calc(var(--portrait-y,0) * 7px)
  ) scale(1.035);
  transition:transform 180ms ease-out
}
.profile::after{
  content:"";position:absolute;inset:14px;background:var(--ink);z-index:4;
  transform:scaleY(0);transform-origin:bottom;
  pointer-events:none
}
.motion-ready #about:not(.about-in) .profile::after{transform:scaleY(1)}
.motion-ready #about.about-in .profile::after{
  transform:scaleY(0);transition:transform 700ms var(--ease-out)
}
.mtrack{animation:none;transform:translate3d(var(--marquee-x,0px),0,0);will-change:transform}
```

- [ ] **Step 4: Implement shared pointer state, hero entrance, marquee inertia, and staggered counters**

Add the following controller interfaces to `js/motion.js`:

```js
function createPointerController(scheduler) {
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
    scheduler.request();
  }, { passive: true });

  scheduler.add(render);
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
    element.style.setProperty('--intro-delay', `\${90 + index * 75}ms`);
  });
  const accent = document.querySelector('#hero .accent');
  if (accent) {
    pointer.register(accent, (element, x, y) => {
      element.style.setProperty('--pointer-x', x.toFixed(3));
      element.style.setProperty('--pointer-y', y.toFixed(3));
    });
  }
  requestAnimationFrame(() => root.classList.add('hero-in'));
}

function initAbout(pointer, scheduler) {
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
      animateCounter(element, preferences.reducedMotion ? 0 : 900, index * 90, scheduler);
    });
    observer.disconnect();
  }, { threshold: 0.25 });
  observer.observe(section);
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

function animateCounter(element, duration, delay, scheduler) {
  const target = Number.parseInt(element.dataset.count || '0', 10);
  if (duration === 0) {
    setCounterValue(element, String(target));
    return;
  }

  let start = null;
  let removeJob = null;
  removeJob = scheduler.add((time) => {
    if (start === null) start = time + delay;
    if (time < start) return true;
    const progress = Math.min(1, (time - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    setCounterValue(element, String(Math.round(target * eased)));
    if (progress < 1) return true;
    removeJob();
    return false;
  });
  scheduler.request();
}

function initMarquee(scheduler) {
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
    scheduler.request();
  }, { passive: true });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) scheduler.request();
  }).observe(marquee);

  scheduler.add((time) => {
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
    track.style.setProperty('--marquee-x', `\${offset.toFixed(2)}px`);
    return true;
  });
}
```

Delete the old inline counter block after moving its behavior. Call `initAbout(pointer, scheduler)` and `initMarquee(scheduler)` from the motion initializer. The marquee now measures half the repeated track width, advances at an 18 px/s baseline, adds a clamped contribution from the latest scroll delta, wraps at half-width, and remains active only while visible.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/portfolio-ui.test.cjs
```

Expected: all tests PASS; reduced motion still shows final counter values immediately.

- [ ] **Step 6: Commit the opening choreography**

```bash
git add index.html js/motion.js tests/portfolio-ui.test.cjs
git commit -m "feat: choreograph portfolio opening scenes"
```

---

### Task 4: Featured and Secondary Project Motion

**Files:**
- Modify: `index.html:372-468`
- Modify: `index.html:878-960`
- Modify: `js/motion.js`
- Test: `tests/portfolio-ui.test.cjs:228-248`

**Interfaces:**
- Consumes: Task 3 `PointerController.register(element, writer)`, `.proj-feat`, `.device`, the graph line, transaction rows, and secondary `.pcard` elements.
- Produces: `projects-in`, `--device-x`, and `--device-y`.

- [ ] **Step 1: Write the failing featured-project scene test**

```js
test('featured project draws its graph and uses shallow device depth', async () => {
  const { context, page } = await openPage();
  const project = page.locator('.proj-feat');
  await project.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#projects')?.classList.contains('projects-in'));

  const line = page.locator('.app-graph .graph-line');
  assert.equal(await line.count(), 1);
  assert.equal(Math.round(Number.parseFloat(await line.evaluate((el) => getComputedStyle(el).strokeDashoffset))), 0);

  const mock = page.locator('.pf-mock');
  const box = await mock.boundingBox();
  const before = await page.locator('.device').evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2);
  await page.waitForTimeout(100);
  const after = await page.locator('.device').evaluate((el) => getComputedStyle(el).transform);
  assert.notEqual(after, before);
  await context.close();
});
```

Keep the existing secondary-project test unchanged; it is the regression gate for the shared `translate(-4px,-4px)` lift and absent link affordance.

- [ ] **Step 2: Run the focused project tests and verify the new one fails**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-name-pattern="featured project|secondary project" tests/portfolio-ui.test.cjs
```

Expected: the featured-project test FAILS because `.graph-line` and `projects-in` do not exist; the secondary-card regression remains green.

- [ ] **Step 3: Add project scene hooks and CSS**

Add `data-pointer="device"` to `.pf-mock`, `class="graph-line"` to the open graph path, and `style="--item-index:0"` through `2` to the transaction rows.

Replace the existing `.device` and `.proj-feat:hover .device` transform declarations with:

```css
.device{
  transform:
    perspective(900px)
    rotateX(calc(var(--device-y,0) * -1.2deg))
    rotateY(calc(var(--device-x,0) * 1.6deg))
    rotateZ(calc(-3deg + var(--device-x,0) * .35deg))
    translate3d(
      calc(var(--device-x,0) * 4px),
      calc(var(--device-y,0) * 4px),
      0
    )
}
.proj-feat:hover .device{
  transform:
    perspective(900px)
    rotateX(calc(var(--device-y,0) * -1.2deg))
    rotateY(calc(var(--device-x,0) * 1.6deg))
    rotateZ(calc(var(--device-x,0) * .35deg))
    translate3d(
      calc(var(--device-x,0) * 4px),
      calc(var(--device-y,0) * 4px),
      0
    )
}
.projects-in .graph-line{
  stroke-dasharray:340;
  stroke-dashoffset:0;
  transition:stroke-dashoffset 900ms var(--ease-out) 160ms
}
.motion-ready #projects:not(.projects-in) .graph-line{stroke-dashoffset:340}
.motion-ready #projects:not(.projects-in) .app-bal,
.motion-ready #projects:not(.projects-in) .tx{opacity:0;transform:translateY(12px)}
.projects-in .app-bal,
.projects-in .tx{
  opacity:1;transform:none;
  transition:opacity 420ms ease,transform 520ms var(--ease-out);
  transition-delay:calc(240ms + var(--item-index,0) * 85ms)
}
.pcard .pc-num,
.pcard .pc-stack{
  transition:transform var(--motion-ui) var(--ease-out),color var(--motion-fast) ease
}
.pcard:hover .pc-num{transform:translate(3px,-3px)}
.pcard:hover .pc-stack{transform:translateX(4px);color:var(--ink-2)}
.motion-ready .ach:not(.in) .ach-item{opacity:0;transform:translateX(18px)}
.ach.in .ach-item{
  opacity:1;transform:none;
  transition:opacity 360ms ease,transform 460ms var(--ease-out);
  transition-delay:calc(var(--item-index,0) * 80ms)
}
```

Set `--item-index:0`, `1`, and `2` on the three recognition rows so their entrance is deterministic.

- [ ] **Step 4: Initialize the featured project adapter**

Add:

```js
function initProjects(pointer) {
  const section = document.querySelector('#projects');
  const mock = document.querySelector('.pf-mock');
  if (!section) return;

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
```

When reduced motion is active, set `projects-in` immediately and keep `--device-x` and `--device-y` at `0`.

- [ ] **Step 5: Run the full browser suite**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/portfolio-ui.test.cjs
```

Expected: all tests PASS, including both secondary cards and the featured scene.

- [ ] **Step 6: Commit project motion**

```bash
git add index.html js/motion.js tests/portfolio-ui.test.cjs
git commit -m "feat: add depth to portfolio projects"
```

---

### Task 5: Stable Skills Filtering and Proficiency Tracks

**Files:**
- Modify: `index.html:469-509`
- Modify: `index.html:964-1027`
- Modify: `index.html:1723-1749`
- Modify: `js/motion.js`
- Test: `tests/portfolio-ui.test.cjs:185-197`

**Interfaces:**
- Consumes: `showSkillCategory(cat)`, `.skills-categories`, `.skcat`, `.sk`, and numeric `.lv` text.
- Produces: `PortfolioMotion.captureSkillLayout()`, `PortfolioMotion.animateSkillLayout(snapshot)`, `skills-in`, and CSS property `--skill-level`.

- [ ] **Step 1: Extend the skill regression test so it fails on missing visual state**

Replace the current skills test with:

```js
test('skill tabs animate complete groups and expose proficiency tracks', async () => {
  const { context, page } = await openPage();
  const section = page.locator('#skills');
  await section.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#skills')?.classList.contains('skills-in'));

  const python = page.locator('.sk').filter({ hasText: 'Python' }).first();
  assert.equal(await python.evaluate((el) => getComputedStyle(el).getPropertyValue('--skill-level').trim()), '0.9');

  const backend = page.locator('.skills-tabs .tab[data-cat="back"]');
  await backend.click();
  await page.waitForTimeout(420);
  assert.equal(await backend.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.skcat:not([hidden])').count(), 1);
  assert.equal(await page.locator('.skcat[data-cat="back"]').isVisible(), true);
  assert.equal(await page.locator('.skills-categories').getAttribute('data-animating'), null);
  await context.close();
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-name-pattern="skill tabs" tests/portfolio-ui.test.cjs
```

Expected: FAIL because `skills-in` and `--skill-level` are not present.

- [ ] **Step 3: Add monochrome tracks and filter transition CSS**

```css
.sk{overflow:hidden;isolation:isolate}
.sk::before{
  content:"";position:absolute;inset:auto 0 0;height:2px;background:var(--line-soft);
  z-index:-2
}
.sk::after{
  content:"";position:absolute;inset:auto 0 0;height:2px;background:var(--ink);
  transform:scaleX(0);transform-origin:left;
  transition:transform 700ms var(--ease-out);z-index:-1
}
#skills.skills-in .sk::after{transform:scaleX(var(--skill-level,0))}
.skills-categories{height:auto;overflow:clip}
.skills-categories[data-animating="true"]{pointer-events:none}
.skcat{transition:transform 360ms var(--ease-out),opacity 220ms ease}
```

- [ ] **Step 4: Implement the optional FLIP bridge**

Expose these exact methods from `js/motion.js`:

```js
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
  if (!container || !snapshot || preferences.reducedMotion) return;
  const finalHeight = container.getBoundingClientRect().height;
  container.dataset.animating = 'true';
  container.style.height = `\${snapshot.height}px`;

  snapshot.positions.forEach((first, item) => {
    if (item.hidden) return;
    const last = item.getBoundingClientRect();
    item.animate([
      { transform: `translate(\${first.left - last.left}px,\${first.top - last.top}px)`, opacity: 0.7 },
      { transform: 'translate(0,0)', opacity: 1 },
    ], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
  });

  requestAnimationFrame(() => {
    container.style.transition = 'height 360ms var(--ease-out)';
    container.style.height = `\${finalHeight}px`;
  });
  window.setTimeout(() => {
    container.style.height = '';
    container.style.transition = '';
    delete container.dataset.animating;
  }, 380);
}
```

Initialize skill levels and the entrance observer:

```js
document.querySelectorAll('.sk').forEach((skill) => {
  const level = Number.parseInt(skill.querySelector('.lv')?.textContent || '0', 10) / 100;
  skill.style.setProperty('--skill-level', String(Math.max(0, Math.min(1, level))));
});

function initSkills() {
  const section = document.querySelector('#skills');
  if (!section) return;
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

Object.assign(window.PortfolioMotion, {
  captureSkillLayout,
  animateSkillLayout,
});
```

In `showSkillCategory(cat)`, capture before changing `hidden`, make the existing state change, and then animate:

```js
function showSkillCategory(cat) {
  const snapshot = window.PortfolioMotion?.captureSkillLayout?.();
  document.querySelectorAll('.skcat').forEach((group) => {
    group.hidden = cat !== 'all' && group.dataset.cat !== cat;
  });
  skillCategories?.classList.toggle('filtered', cat !== 'all');
  window.PortfolioMotion?.animateSkillLayout?.(snapshot);
}
```

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/portfolio-ui.test.cjs
```

Expected: all tests PASS and only one complete category remains visible after filtering.

- [ ] **Step 6: Commit the skills interaction**

```bash
git add index.html js/motion.js tests/portfolio-ui.test.cjs
git commit -m "feat: animate portfolio skill filtering"
```

---

### Task 6: Education Timeline and Accessible GitHub Wave

**Files:**
- Modify: `index.html:437-465`
- Modify: `index.html:683-730`
- Modify: `index.html:1029-1146`
- Modify: `index.html:1767-1840`
- Modify: `js/motion.js`
- Test: `tests/portfolio-ui.test.cjs`

**Interfaces:**
- Consumes: `.edu-grid`, `.ecard`, `#git-cells`, generated `.git-cell` nodes, and the custom `portfolio:github-grid-rendered` event.
- Produces: `education-in`, `github-in`, roving `tabindex`, `role="grid"`, `role="gridcell"`, and `#git-tooltip`.

- [ ] **Step 1: Write failing timeline and GitHub keyboard tests**

```js
test('education timeline and GitHub grid expose their completed scenes', async () => {
  const { context, page } = await openPage();
  await page.locator('#education').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#education')?.classList.contains('education-in'));
  assert.equal(await page.locator('#education').evaluate((el) => getComputedStyle(el).getPropertyValue('--timeline-progress').trim()), '1');

  await page.locator('#github').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#github')?.classList.contains('github-in'));
  assert.equal(await page.locator('#git-cells').getAttribute('role'), 'grid');

  const first = page.locator('.git-cell').first();
  await first.focus();
  assert.equal(await first.getAttribute('tabindex'), '0');
  assert.equal(await page.locator('#git-tooltip').isVisible(), true);
  await first.press('ArrowRight');
  assert.equal(await page.locator('.git-cell').nth(7).getAttribute('tabindex'), '0');
  await context.close();
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-name-pattern="education timeline" tests/portfolio-ui.test.cjs
```

Expected: FAIL because the scene classes, timeline property, grid roles, and tooltip do not exist.

- [ ] **Step 3: Add the responsive timeline and GitHub tooltip styles**

```css
.edu-grid::before{
  content:"";position:absolute;left:0;right:0;top:18px;height:2px;background:var(--ink);
  transform:scaleX(var(--timeline-progress,0));transform-origin:left;
  transition:transform 850ms var(--ease-out)
}
.edu-grid{position:relative;padding-top:38px}
.ecard::before{
  content:"";position:absolute;top:-27px;left:24px;width:10px;height:10px;
  background:var(--bg-2);border:2px solid var(--ink)
}
.git-tooltip{
  position:fixed;z-index:240;max-width:220px;padding:7px 9px;
  border:1px solid var(--ink);background:var(--bg-2);color:var(--ink);
  box-shadow:var(--shadow-sm);font-family:var(--mono);font-size:.65rem;
  pointer-events:none;transform:translate(10px,10px)
}
.git-tooltip[hidden]{display:none}
@media (max-width:768px){
  .edu-grid{padding-top:0;padding-left:28px}
  .edu-grid::before{
    left:5px;right:auto;top:0;bottom:0;width:2px;height:auto;
    transform:scaleY(var(--timeline-progress,0));transform-origin:top
  }
  .ecard::before{left:-28px;top:24px}
}
```

Insert after `#git-cells`:

```html
<div class="git-tooltip" id="git-tooltip" role="tooltip" hidden></div>
```

- [ ] **Step 4: Enrich generated cells without creating hundreds of tab stops**

In `initGitHubGrid()`, set the grid role, give each cell a stable index and accessible label, use roving tabindex, and announce regeneration:

```js
gridEl.setAttribute('role', 'grid');
gridEl.setAttribute('aria-label', lang === 'ru' ? 'Снимок активности GitHub' : 'GitHub activity snapshot');

cell.setAttribute('role', 'gridcell');
cell.setAttribute('aria-label', tooltipText);
cell.dataset.index = String(c * rows + r);
cell.dataset.tooltip = tooltipText;
cell.tabIndex = c === 0 && r === 0 ? 0 : -1;

document.dispatchEvent(new CustomEvent('portfolio:github-grid-rendered'));
```

Place the final event dispatch after the two generation loops, not inside them.

- [ ] **Step 5: Add education and GitHub adapters**

Add these adapters to `js/motion.js`:

```js
function initEducation() {
  const section = document.querySelector('#education');
  if (!section) return;
  section.querySelectorAll('.ecard').forEach((card, index) => {
    card.style.setProperty('--reveal-delay', `\${index * 90}ms`);
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

  function showTooltip(cell, x, y) {
    tooltip.textContent = cell.dataset.tooltip || '';
    tooltip.hidden = false;
    tooltip.style.left = `\${Math.round(x)}px`;
    tooltip.style.top = `\${Math.round(y)}px`;
  }

  function hideTooltip() {
    tooltip.hidden = true;
  }

  grid.addEventListener('pointerover', (event) => {
    const cell = event.target.closest('.git-cell');
    if (cell) showTooltip(cell, event.clientX, event.clientY);
  });
  grid.addEventListener('pointermove', (event) => {
    if (!tooltip.hidden) {
      tooltip.style.left = `\${Math.round(event.clientX)}px`;
      tooltip.style.top = `\${Math.round(event.clientY)}px`;
    }
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
```

Call both adapters from the motion initializer. The tooltip must never add claims beyond the existing illustrative values, and the custom grid-rendered event remains available for a future adapter refresh if the grid container itself is replaced.

- [ ] **Step 6: Run focused and full tests**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/portfolio-ui.test.cjs
```

Expected: all tests PASS; the GitHub grid exposes one keyboard entry point and arrow navigation.

- [ ] **Step 7: Commit timeline and GitHub interaction**

```bash
git add index.html js/motion.js tests/portfolio-ui.test.cjs
git commit -m "feat: animate timeline and GitHub activity"
```

---

### Task 7: Context Cursor, Magnetic Controls, Contact, and Theme Transition

**Files:**
- Modify: `index.html:103-112`
- Modify: `index.html:141-289`
- Modify: `index.html:510-578`
- Modify: `index.html:1148-1179`
- Modify: `index.html:1190-1200`
- Modify: `index.html:1622-1645`
- Modify: `js/cursor.js`
- Modify: `js/motion.js`
- Modify: `js/theme.js`
- Test: `tests/portfolio-ui.test.cjs`

**Interfaces:**
- Consumes: Task 3 pointer controller, elements with `data-cursor` and `data-magnetic`, contact form controls, and theme-toggle click coordinates.
- Produces: `.cursor-context-label`, `--magnetic-x`, `--magnetic-y`, `--theme-x`, `--theme-y`, and `data-submitting`.

- [ ] **Step 1: Write failing cursor, contact, and theme-origin tests**

```js
test('fine-pointer interactions expose contextual labels and magnetic offsets', async () => {
  const { context, page } = await openPage();
  const button = page.locator('#hero .btn.primary');
  await button.hover();
  await page.waitForTimeout(80);
  assert.equal(await page.locator('.cursor-context-label').textContent(), 'VIEW');
  assert.notEqual(await button.evaluate((el) => getComputedStyle(el).getPropertyValue('--magnetic-x').trim()), '');
  await context.close();
});

test('theme transition records its origin and contact submit has a state', async () => {
  const { context, page } = await openPage();
  await page.locator('.controls .theme-toggle').click({ position: { x: 10, y: 10 } });
  assert.match(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--theme-x').trim()), /px$/);

  const form = page.locator('#contact-form');
  await form.locator('input[name="name"]').fill('Test');
  await form.locator('input[name="email"]').fill('test@example.com');
  await form.locator('textarea').fill('Portfolio test');
  await form.evaluate((el) => el.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true })));
  assert.equal(await form.getAttribute('data-submitting'), 'true');
  await context.close();
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-name-pattern="contextual labels|theme transition" tests/portfolio-ui.test.cjs
```

Expected: FAIL because cursor labels, magnetic variables, theme-origin variables, and submitting state are absent.

- [ ] **Step 3: Add explicit cursor and magnetic hooks**

Add `data-cursor="VIEW"` and `data-magnetic` to project CTAs, `data-cursor="OPEN"` to external channel links, `data-cursor="FILTER"` to skill tabs, and `data-cursor="SEND"` plus `data-magnetic` to the contact submit button. Add `data-magnetic` to primary `.btn` elements only; do not add cursor labels to secondary non-linked project cards.

Add the existing `reveal` class to `.foot` so the footer uses the shared observer without gaining a separate animation system:

```html
<div class="wrap foot reveal">
```

Add:

```css
.cursor-context-label{
  position:fixed;z-index:260;left:0;top:0;padding:4px 6px;
  border:1px solid var(--ink);background:var(--bg-2);color:var(--ink);
  font-family:var(--mono);font-size:.58rem;letter-spacing:.12em;
  opacity:0;transform:translate3d(-100px,-100px,0);
  transition:opacity var(--motion-fast) ease;pointer-events:none
}
.cursor-context-label.visible{opacity:1}
[data-magnetic]{
  --magnetic-x:0px;--magnetic-y:0px;
}
.has-fine-pointer [data-magnetic]:not(:hover){
  translate:var(--magnetic-x) var(--magnetic-y)
}
.has-fine-pointer [data-magnetic]:hover{
  translate:var(--magnetic-x) var(--magnetic-y)
}
.cform input:focus,.cform textarea:focus{
  border-color:var(--ink);
  box-shadow:4px 4px 0 1px var(--ink);
  transform:translate(-2px,-2px)
}
.field-label{transition:color var(--motion-fast) ease,transform var(--motion-fast) ease}
.field-label:has(+ input:focus),
.field-label:has(+ textarea:focus){color:var(--ink);transform:translateX(4px)}
.cform[data-submitting="true"] button{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink)}
```

- [ ] **Step 4: Extend the pointer controller and cursor lifecycle**

Create the label node in `js/cursor.js` next to the existing canvas:

```js
var contextLabel = document.createElement('div');
contextLabel.className = 'cursor-context-label';
contextLabel.setAttribute('aria-hidden', 'true');
wrapper.appendChild(contextLabel);
```

Expose lifecycle methods without changing pixel drawing:

```js
window.PortfolioPixelCursor = {
  showLabel: function (text) {
    contextLabel.textContent = text;
    contextLabel.classList.toggle('visible', Boolean(text));
  },
  moveLabel: function (x, y) {
    contextLabel.style.transform = 'translate3d(' + (x + 16) + 'px,' + (y + 16) + 'px,0)';
  },
};
```

In `js/motion.js`, add:

```js
function initContextualPointer(pointer) {
  if (!preferences.finePointer || preferences.reducedMotion) return;
  pointer.subscribe((x, y) => window.PortfolioPixelCursor?.moveLabel(x, y));

  document.addEventListener('pointerover', (event) => {
    const target = event.target.closest('[data-cursor]');
    window.PortfolioPixelCursor?.showLabel(target?.dataset.cursor || '');
  });
  document.addEventListener('pointerout', (event) => {
    const leaving = event.target.closest('[data-cursor]');
    const entering = event.relatedTarget?.closest?.('[data-cursor]');
    if (leaving && leaving !== entering) window.PortfolioPixelCursor?.showLabel('');
  });

  document.querySelectorAll('[data-magnetic]').forEach((element) => {
    pointer.register(element, (target, x, y) => {
      if (!target.matches(':hover')) return;
      target.style.setProperty('--magnetic-x', `\${(x * 4).toFixed(2)}px`);
      target.style.setProperty('--magnetic-y', `\${(y * 4).toFixed(2)}px`);
    });
    element.addEventListener('pointerleave', () => {
      element.style.setProperty('--magnetic-x', '0px');
      element.style.setProperty('--magnetic-y', '0px');
    });
  });
}
```

Call `initContextualPointer(pointer)` after both scripts have initialized. The `translate` longhand composes magnetic offsets with existing `transform` hover lifts instead of replacing them.

- [ ] **Step 5: Implement theme origin and contact submit state**

In `js/theme.js`, pass the click event to the toggle handler and set:

```js
const x = event.clientX || window.innerWidth / 2;
const y = event.clientY || window.innerHeight / 2;
document.documentElement.style.setProperty('--theme-x', `\${x}px`);
document.documentElement.style.setProperty('--theme-y', `\${y}px`);
```

Use these CSS rules:

```css
::view-transition-new(root){
  animation:themeReveal var(--motion-theme) var(--ease-out)
}
@keyframes themeReveal{
  from{clip-path:circle(0 at var(--theme-x,50%) var(--theme-y,50%))}
  to{clip-path:circle(150vmax at var(--theme-x,50%) var(--theme-y,50%))}
}
```

Add `aria-live="polite"` to the submit button so its translated status text is announced. Update the synchronous submit feedback:

```js
contactForm.dataset.submitting = 'true';
updateButtonTextWithIcon(button, t.contactSubmitDone);
window.location.href = `mailto:aleximlord@gmail.com?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}`;

setTimeout(() => {
  updateButtonTextWithIcon(button, t.contactSubmit);
  delete contactForm.dataset.submitting;
}, 1600);
```

- [ ] **Step 6: Run focused and full tests**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/portfolio-ui.test.cjs
```

Expected: all tests PASS; existing theme contrast and contact-label regressions remain green.

- [ ] **Step 7: Commit interaction polish**

```bash
git add index.html js/cursor.js js/motion.js js/theme.js tests/portfolio-ui.test.cjs
git commit -m "feat: polish portfolio microinteractions"
```

---

### Task 8: Responsive, Reduced-Motion, Cache, and Final Verification

**Files:**
- Modify: `index.html:611-681`
- Modify: `js/motion.js`
- Modify: `sw.js:1-18`
- Modify: `tests/portfolio-ui.test.cjs`
- Modify if verification proves necessary: `404.html:14-85`

**Interfaces:**
- Consumes: every motion class and property from Tasks 1-7.
- Produces: final mobile/reduced-motion overrides, cache `portfolio-v1.6.0`, cached `/js/motion.js`, and a full browser regression gate.

- [ ] **Step 1: Write failing cache and representative-width tests**

Add `fs` at the top:

```js
const fs = require('node:fs');
```

Add:

```js
test('service worker caches the motion entry point with a new cache version', () => {
  const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(source, /portfolio-v1\.6\.0/);
  assert.match(source, /['"]\/js\/motion\.js['"]/);
});

test('motion layout stays inside representative viewport widths', async () => {
  for (const width of [360, 390, 768, 1280, 1600]) {
    const { context, page } = await openPage({ viewport: { width, height: 900 }, hasTouch: width <= 768 });
    await page.locator('#contact').scrollIntoViewIfNeeded();
    const sizes = await page.evaluate(() => ({
      viewport: innerWidth,
      document: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    }));
    assert.ok(sizes.document <= sizes.viewport, `\${width}px viewport overflowed to \${sizes.document}px`);
    await context.close();
  }
});
```

- [ ] **Step 2: Run the focused tests and verify the cache test fails**

Run:

```bash
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-name-pattern="service worker caches|representative viewport" tests/portfolio-ui.test.cjs
```

Expected: the cache test FAILS because the service worker still uses `portfolio-v1.5.0` and does not list `/js/motion.js`.

- [ ] **Step 3: Add final responsive and reduced-motion overrides**

Use explicit final-state overrides:

```css
@media (prefers-reduced-motion:reduce){
  .motion-ready [data-motion],
  .motion-ready .reveal,
  .motion-ready .app-bal,
  .motion-ready .tx,
  .motion-ready .ach-item{
    opacity:1!important;transform:none!important;transition:none!important
  }
  .mtrack{transform:none!important}
  .device,.profile picture{transform:none!important}
  .cursor-context-label{display:none!important}
  .edu-grid::before{transform:none!important}
  .git-cell{transform:scale(1)!important;animation:none!important}
}
@media (hover:none),(pointer:coarse){
  [data-magnetic]{--magnetic-x:0px!important;--magnetic-y:0px!important}
  .device,.profile picture{transform:none}
  .cursor-context-label{display:none}
}
@media (max-width:768px){
  .section-status{display:none}
  .scroll-progress{height:1px}
  .git-tooltip{display:none}
}
```

Review every transform composition so reduced-motion rules do not accidentally remove essential layout transforms such as the role rotator's baseline positioning.

- [ ] **Step 4: Update the service worker**

Change:

```js
const CACHE_NAME = 'portfolio-v1.6.0';
```

Add:

```js
'/js/motion.js',
```

Keep the existing same-origin GET filtering and network-first behavior unchanged.

- [ ] **Step 5: Add a console-error regression and run syntax checks**

Add:

```js
test('representative motion interactions produce no console errors', async () => {
  const { context, page } = await openPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.locator('.pf-mock').hover();
  await page.locator('#skills').scrollIntoViewIfNeeded();
  await page.locator('.tab[data-cat="back"]').click();
  await page.locator('#github').scrollIntoViewIfNeeded();
  await page.locator('#contact').scrollIntoViewIfNeeded();
  assert.deepEqual(errors, []);
  await context.close();
});
```

Run:

```bash
/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check js/motion.js
/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check js/cursor.js
/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check js/theme.js
NODE_PATH=/Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/makedoni/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/portfolio-ui.test.cjs
git diff --check
```

Expected: syntax checks exit 0, all browser tests PASS with zero failures, and `git diff --check` prints no errors.

- [ ] **Step 6: Perform visual browser verification**

Start:

```bash
python3 -m http.server 41740 --bind 127.0.0.1
```

Check in a real browser at `http://127.0.0.1:41740/`:

- desktop 1600×1000, light and dark themes;
- desktop 1280×900, every section entrance and hover state;
- mobile 390×844 and 360×800, navigation, filtering, timeline, GitHub scroll, and contact;
- reduced-motion mode, ensuring all content is immediately visible;
- keyboard-only navigation through header, skill tabs, GitHub grid, contact form, and footer;
- hero, featured device, both secondary cards, skills, education, GitHub, and contact at rest and during interaction.

Record concrete console and layout findings. Fix only regressions within this specification, then rerun Step 5 in full.

- [ ] **Step 7: Commit the verified experience**

```bash
git add index.html js/motion.js js/cursor.js js/theme.js sw.js tests/portfolio-ui.test.cjs 404.html
git commit -m "feat: complete kinetic portfolio experience"
```

- [ ] **Step 8: Verify the final repository state**

Run:

```bash
git status --short
git log -8 --oneline
```

Expected: the working tree is clean and the eight implementation commits appear after the design and plan history.
