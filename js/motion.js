// Scroll scenes, letter-built titles and stickers. Content is complete without this file:
// hidden and pinned states only apply once .motion-ready is on <html>, and that class is
// only added when the visitor allows motion.
(function () {
  'use strict';

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const STICKER_FILE = '/assets/stickers.svg';
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const shuffle = (list) => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  // Stickers hang off a letter so they follow the type at any size. `at` is a fraction of
  // the line length; x, y, w and h are in em; `over` sits the sticker on top of the letter.
  const STICKERS = {
    hero: [
      { line: 0, at: 0.92, id: 's-helmet', x: 0.02, y: -0.5, w: 0.62, h: 0.6 },
      { line: 1, at: 0, id: 's-capsule', x: -0.62, y: -0.1, w: 0.62, h: 0.84, delay: -0.3 },
      { line: 1, at: 0.32, id: 's-sun', x: -0.14, y: 0.1, w: 0.76, h: 0.76, over: true, delay: -0.1 },
      { line: 1, at: 0.99, id: 's-fist', x: 0.42, y: 0.02, w: 1.14, h: 0.79, delay: -0.8 },
      { line: 2, at: 0.6, id: 's-cubesat', x: -0.34, y: -0.22, w: 1, h: 0.71, over: true, delay: -0.45 },
      { line: 2, at: 0, id: 's-receipt', x: -0.5, y: 0.04, w: 0.5, h: 0.77, delay: -0.6 },
    ],
    finly: [
      { line: 0, at: 0, id: 's-receipt', x: -0.56, y: -0.08, w: 0.56, h: 0.86 },
      { line: 0, at: 0.99, id: 's-plane', x: 0.42, y: -0.22, w: 0.8, h: 0.53, delay: -0.5 },
    ],
    tablets: [
      { line: 0, at: 0.99, id: 's-capsule', x: 0.36, y: -0.08, w: 0.76, h: 1.03, delay: -0.3 },
      { line: 1, at: 0, id: 's-bug', x: -0.62, y: 0.1, w: 0.6, h: 0.6, delay: -0.6 },
    ],
    cubesat: [
      { line: 0, at: 0, id: 's-sun', x: -0.74, y: -0.12, w: 0.68, h: 0.68, delay: -0.2 },
      { line: 0, at: 0.99, id: 's-cubesat', x: 0.42, y: -0.18, w: 0.9, h: 0.64, delay: -0.7 },
    ],
    recognition: [
      { line: 0, at: 0, id: 's-laurel', x: -0.5, y: -0.02, w: 0.46, h: 0.96 },
      { line: 0, at: 0.99, id: 's-laurel', x: 0.44, y: -0.02, w: 0.46, h: 0.96, flip: true },
    ],
  };

  // ---- Metrics, read from canvas so measuring never forces layout ----
  const ctx = document.createElement('canvas').getContext('2d');
  const widthCache = new Map();
  function advance(char, family) {
    const key = `${family}|${char}`;
    if (widthCache.has(key)) return widthCache.get(key);
    ctx.font = `400 100px "${family}"`;
    const width = ctx.measureText(char).width / 100;
    widthCache.set(key, width);
    return width;
  }

  // ---- Letter-built titles ----
  function buildLetters(line, startIndex) {
    const text = line.textContent;
    line.dataset.source = text;
    line.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = `${text} `;
    const visual = document.createElement('span');
    visual.className = 'line-vis';
    visual.setAttribute('aria-hidden', 'true');
    let n = startIndex;
    const letters = [...text].map((char) => {
      const cell = document.createElement('span');
      cell.className = 'ltr';
      cell.dataset.char = char.toLocaleUpperCase();
      const lift = document.createElement('span');
      lift.className = 'ltr-in';
      lift.style.setProperty('--n', String(n));
      n += 1;
      const base = document.createElement('span');
      base.className = 'ltr-base';
      base.textContent = char === ' ' ? ' ' : char;
      lift.appendChild(base);
      cell.appendChild(lift);
      visual.appendChild(cell);
      return cell;
    });
    line.append(sr, visual);
    return { letters, next: n };
  }

  function createSticker(spec, n) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', `sticker ltr-sticker ltr-sticker--${spec.id}${spec.over ? ' ltr-sticker--over' : ''}`);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', `${STICKER_FILE}#${spec.id}`);
    svg.appendChild(use);
    svg.style.cssText = `left:${spec.x}em;top:${spec.y}em;width:${spec.w}em;height:${spec.h}em;`
      + `--delay:${spec.delay || 0}s;--n:${n};${spec.flip ? 'scale:-1 1;' : ''}`;
    return svg;
  }

  // ---- Cut letters: the base outline with shapes taken out by even-odd fill ----
  const ROUND = new Set([...'CGOQSСОЭЗЮФ']);
  // Bites only work where the corners are solid: over empty space even-odd adds stray ink,
  // and on diagonals they read as glitches.
  const STEMMED = new Set([...'BDEHNRUБВЕНПЦШЩЫ']);
  function cutFor(char, glyph, cap) {
    const w = glyph.w;
    if (ROUND.has(char)) {
      const rx = w * 0.56;
      const ry = cap * 0.55;
      const cx = w / 2;
      const cy = -cap / 2;
      return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}Z`;
    }
    // Opposite-corner bites keep the letter heavy and readable.
    const bite = (x0, inward) => `M${x0} ${-cap}C${x0 + inward * w * 0.46} ${-cap * 0.92} ${x0 + inward * w * 0.46} ${-cap * 0.58} ${x0} ${-cap * 0.5}Z`;
    const low = (x0, inward) => `M${x0} 0C${x0 + inward * w * 0.46} ${-cap * 0.08} ${x0 + inward * w * 0.46} ${-cap * 0.42} ${x0} ${-cap * 0.5}Z`;
    return Math.random() > 0.5 ? `${bite(-w * 0.04, 1)}${low(w * 1.04, -1)}` : `${bite(w * 1.04, -1)}${low(-w * 0.04, 1)}`;
  }

  function cutLetter(cell) {
    const data = window.ALT_GLYPHS;
    const char = cell.dataset.char;
    const glyph = data?.glyphs?.[char];
    // Narrow letters have nothing to cut into; they just look broken.
    if (!glyph || glyph.w < 380 || (!ROUND.has(char) && !STEMMED.has(char))) return false;
    const cap = /[A-Z]/.test(char) ? data.capLatin : data.capCyrillic;
    const lift = cell.querySelector('.ltr-in');
    const anchor = document.createElement('span');
    anchor.className = 'ltr-anchor';
    const svg = document.createElementNS(SVG_NS, 'svg');
    const pad = 100;
    svg.setAttribute('viewBox', `${-pad} -1200 ${glyph.w + pad * 2} 1400`);
    svg.style.width = `${(glyph.w + pad * 2) / 1000}em`;
    svg.style.left = `${-(glyph.w + pad) / 1000}em`;
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('d', `${glyph.d}${cutFor(char, glyph, cap)}`);
    svg.appendChild(path);
    anchor.appendChild(svg);
    lift.appendChild(anchor);
    cell.classList.add('is-alt');
    return true;
  }

  // One letter per line, never one under a sticker, chosen once per render: they do not flicker.
  function chooseCuts(lines, max) {
    let made = 0;
    for (const letters of shuffle(lines)) {
      if (made >= max) break;
      for (const cell of shuffle(letters)) {
        if (cell.classList.contains('ltr-over')) continue;
        if (cutLetter(cell)) {
          made += 1;
          break;
        }
      }
    }
  }

  const titles = [];

  function fitTitle(title) {
    let widest = 0;
    title.querySelectorAll('.line-vis').forEach((line) => {
      widest = Math.max(widest, [...line.children].reduce((sum, cell) => sum + advance(cell.dataset.char, 'Display'), 0));
    });
    if (widest > 0) title.style.setProperty('--fit', widest.toFixed(3));
  }

  function setupTitle(title) {
    const lines = [...title.querySelectorAll('.line')];
    const record = { el: title, letters: [] };
    const byLine = [];
    let n = 0;
    lines.forEach((line) => {
      const { letters, next } = buildLetters(line, n);
      n = next;
      record.letters.push(...letters);
      byLine.push(letters);
    });
    fitTitle(title);
    const specs = STICKERS[title.dataset.stickerSet] || [];
    specs.forEach((spec) => {
      const line = lines[spec.line];
      if (!line) return;
      const cells = [...line.querySelectorAll('.ltr')];
      if (!cells.length) return;
      const cell = cells[Math.min(cells.length - 1, Math.floor(cells.length * spec.at))];
      n += 1;
      cell.appendChild(createSticker(spec, n));
      if (spec.over) cell.classList.add('ltr-over');
    });
    chooseCuts(byLine, title.closest('.hero') ? 3 : 1);
    titles.push(record);
    return record;
  }

  function resetTitle(title) {
    title.querySelectorAll('.line').forEach((line) => {
      if (line.dataset.source != null && line.querySelector('.line-vis') && !line.hasAttribute('data-i18n')) {
        line.textContent = line.dataset.source;
      }
    });
  }

  // ---- Text split for scrubbing: every letter its own span, words kept whole ----
  function buildChars(el) {
    const text = el.textContent;
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    const chars = [];
    text.split(' ').forEach((word, index, words) => {
      const wd = document.createElement('span');
      wd.className = 'wd';
      [...word].forEach((char) => {
        const span = document.createElement('span');
        span.className = 'ch-s';
        span.textContent = char;
        chars.push(span);
        wd.appendChild(span);
      });
      visual.appendChild(wd);
      if (index < words.length - 1) visual.appendChild(document.createTextNode(' '));
    });
    el.textContent = '';
    el.append(sr, visual);
    // Random order, evenly spaced through the scroll.
    const order = shuffle(chars);
    return order.map((span, index) => ({ span, at: (index + 1) / order.length, on: false }));
  }

  function paintScrub(items, progress) {
    items.forEach((item) => {
      const on = progress >= item.at;
      if (on !== item.on) {
        item.on = on;
        item.span.classList.toggle('on', on);
      }
    });
  }

  // ---- Reel copy ----
  function fillReel() {
    const roles = window.PortfolioUI?.roles?.() || [];
    if (!roles.length) return;
    document.querySelectorAll('[data-reel-text]').forEach((track, index) => {
      const rotated = roles.slice(index % roles.length).concat(roles.slice(0, index % roles.length));
      const rowText = `${rotated.join(' ✺ ')} ✺ `.repeat(2);
      track.textContent = '';
      for (let copy = 0; copy < 2; copy += 1) {
        const span = document.createElement('span');
        span.style.whiteSpace = 'pre';
        span.textContent = rowText;
        track.appendChild(span);
      }
    });
  }

  function fitFootWord(el, text) {
    const width = [...text.toLocaleUpperCase()].reduce((sum, char) => sum + advance(char, 'Forum'), 0);
    if (width > 0) el.style.setProperty('--fit', (width * 1.02).toFixed(3));
  }

  // ---- Floors: one pinned stage, exactly as many steps as panels ----
  const floorsEl = document.querySelector('[data-floors]');
  const sticky = document.querySelector('[data-floors-sticky]');
  const panels = [...document.querySelectorAll('[data-panel]')].map((el) => ({
    el,
    media: el.querySelector('[data-panel-media]'),
    bg: el.dataset.bg,
    pieces: [],
    height: 1,
  }));
  let activeFloor = 0;
  let floorTimers = [];

  function splitWords(el) {
    const text = el.textContent.trim();
    el.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    el.appendChild(sr);
    const pieces = text.split(' ').map((word, index, words) => {
      const span = document.createElement('span');
      span.className = 'fp-word fp-piece';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = index < words.length - 1 ? `${word} ` : word;
      el.appendChild(span);
      return span;
    });
    return pieces;
  }

  function collectPieces(panel) {
    const pieces = [];
    panel.el.querySelectorAll('[data-piece-words]').forEach((el) => pieces.push(...splitWords(el)));
    panel.el.querySelectorAll('.fp-title .ltr, .fp-title .ltr-sticker').forEach((el) => {
      el.classList.add('fp-piece');
      pieces.push(el);
    });
    panel.el.querySelectorAll('.flip').forEach((el) => {
      el.classList.add('fp-piece');
      pieces.push(el);
    });
    panel.pieces = pieces;
  }

  // Letters and words blink on or off in a random order across 0.3s.
  function blink(pieces, show, delay = 0) {
    const order = shuffle(pieces);
    const step = 300 / Math.max(1, order.length);
    order.forEach((piece, index) => {
      floorTimers.push(setTimeout(() => piece.classList.toggle('show', show), delay + step * index));
    });
  }

  function goToFloor(next) {
    if (next === activeFloor) return;
    floorTimers.forEach(clearTimeout);
    floorTimers = [];
    // Settle anything still mid-transition before starting the new one.
    panels.forEach((panel, index) => {
      if (index !== activeFloor) {
        panel.pieces.forEach((piece) => piece.classList.remove('show'));
        panel.el.classList.remove('is-live', 'is-active');
      } else {
        panel.pieces.forEach((piece) => piece.classList.add('show'));
      }
    });
    const from = panels[activeFloor];
    const to = panels[next];
    activeFloor = next;
    to.el.classList.add('is-live', 'is-active');
    from.el.classList.remove('is-active');
    from.media?.classList.remove('show');
    to.media?.classList.add('show');
    sticky.style.setProperty('--floor-bg', to.bg);
    blink(from.pieces, false);
    blink(to.pieces, true, 210);
    floorTimers.push(setTimeout(() => from.el.classList.remove('is-live'), 560));
  }

  function setupFloors() {
    if (!floorsEl || !sticky || panels.length < 2) return;
    panels.forEach((panel, index) => {
      collectPieces(panel);
      panel.el.classList.toggle('is-live', index === 0);
      panel.el.classList.toggle('is-active', index === 0);
      panel.pieces.forEach((piece) => piece.classList.toggle('show', index === 0));
      panel.media?.classList.toggle('show', index === 0);
    });
    activeFloor = 0;
    sticky.style.setProperty('--floor-bg', panels[0].bg);
  }

  function bindTilt() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('[data-tilt]').forEach((inner) => {
      const host = inner.parentElement;
      host.addEventListener('pointerenter', () => inner.style.setProperty('--tz', '1.05'));
      host.addEventListener('pointermove', (event) => {
        const rect = host.getBoundingClientRect();
        inner.style.setProperty('--ry', `${((event.clientX - rect.left) / rect.width * 2 - 1) * 12}deg`);
        inner.style.setProperty('--rx', `${-((event.clientY - rect.top) / rect.height * 2 - 1) * 12}deg`);
      });
      host.addEventListener('pointerleave', () => {
        inner.style.setProperty('--ry', '0deg');
        inner.style.setProperty('--rx', '0deg');
        inner.style.setProperty('--tz', '1');
      });
    });
  }

  // ---- Boot ----
  const crest = document.querySelector('[data-crest]');
  const dock = document.querySelector('[data-dock]');
  const scrubEl = document.querySelector('[data-scrub]');
  const footWord = document.querySelector('[data-foot-word]');
  const ticker = document.querySelector('[data-ticker] .ticker-track');

  let scrubItems = [];
  let footItems = [];
  let footOn = false;
  let footTimers = [];
  let vh = window.innerHeight;
  let vw = window.innerWidth;
  let floorsTop = 0;
  let floorsHeight = 1;
  let scrubTop = 0;
  let scrubHeight = 1;
  let footTop = 0;
  let footHeight = 1;
  let dockH = 52;
  let lastY = -1;
  let tickerAnim = null;
  let tickerRate = 1;
  let lenis = null;

  function docTop(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  function measure() {
    vh = window.innerHeight;
    vw = window.innerWidth;
    if (floorsEl) {
      floorsTop = docTop(floorsEl);
      floorsHeight = floorsEl.offsetHeight;
    }
    panels.forEach((panel) => { panel.height = panel.media?.offsetHeight || 1; });
    if (scrubEl) {
      scrubTop = docTop(scrubEl);
      scrubHeight = scrubEl.offsetHeight;
    }
    if (footWord) {
      footTop = docTop(footWord);
      footHeight = footWord.offsetHeight || 1;
    }
    if (dock) dockH = dock.offsetHeight || 52;
    // Lenis caches the page height; keep it honest whenever the layout changes.
    lenis?.resize();
    lastY = -1;
  }

  function setFootWord(on) {
    if (on === footOn) return;
    footOn = on;
    footTimers.forEach(clearTimeout);
    footTimers = [];
    // 0.8s in total, random order, and it plays back if you scroll away.
    shuffle(footItems).forEach((item, index, list) => {
      footTimers.push(setTimeout(() => item.span.classList.toggle('on', on), (index / list.length) * 800));
    });
  }

  function paint() {
    const y = window.scrollY;
    if (y === lastY) return;
    const velocity = lastY < 0 ? 0 : y - lastY;
    lastY = y;

    if (dock && vw > 640) {
      dock.style.setProperty('--dock-y', `${Math.max(64, vh - dockH - 12 - y)}px`);
    }
    if (floorsEl && panels.length) {
      const progress = clamp((y - floorsTop) / Math.max(1, floorsHeight - vh));
      const position = clamp(progress * panels.length, 0, panels.length);
      const index = Math.min(panels.length - 1, Math.floor(position));
      const within = clamp(position - index);
      goToFloor(index);
      const panel = panels[index];
      if (panel.media) panel.media.style.setProperty('--y', String(-(vh + panel.height) * within));
    }
    if (scrubItems.length) {
      // From the text's top entering 15% up the view to its bottom clearing 10% up the view.
      paintScrub(scrubItems, clamp((y + vh * 0.85 - scrubTop) / Math.max(1, scrubHeight - vh * 0.05)));
    }
    // The word ends the document, so it must trigger within its own height or it never would.
    if (footItems.length) setFootWord(y + vh - Math.min(vh * 0.3, footHeight * 0.6) > footTop);

    if (tickerAnim) {
      const target = clamp(1 + Math.abs(velocity) * 0.25, 1, 9);
      tickerRate += (target - tickerRate) * 0.12;
      tickerAnim.playbackRate = tickerRate;
    }
  }

  function loop(time) {
    if (lenis) lenis.raf(time);
    paint();
    if (tickerAnim && tickerRate > 1.01 && window.scrollY === lastY) {
      tickerRate += (1 - tickerRate) * 0.08;
      tickerAnim.playbackRate = tickerRate;
    }
    requestAnimationFrame(loop);
  }

  function observeScenes() {
    if (!('IntersectionObserver' in window)) return;
    const pause = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-off', !entry.isIntersecting));
    }, { rootMargin: '10% 0px' });
    document.querySelectorAll('.hero, .reel, .about, .floors-sticky, .cases, .skills, .education, .panel, .foot')
      .forEach((section) => pause.observe(section));

    const reveal = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('[data-fade], [data-stagger]').forEach((el) => reveal.observe(el));
    document.querySelectorAll('[data-stagger]').forEach((el) => {
      [...el.children].forEach((child, index) => child.style.setProperty('--i', String(index)));
    });

    const cells = document.getElementById('git-cells');
    if (cells) {
      new IntersectionObserver((entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          cells.classList.add('in');
          observer.disconnect();
        }
      }, { threshold: 0.2 }).observe(cells);
    }
  }

  function startCuts() {
    const stage = document.querySelector('[data-reel-stage]');
    const reel = document.querySelector('[data-reel]');
    if (!stage) return;
    let cut = 0;
    setInterval(() => {
      if (document.hidden || reel?.classList.contains('is-off')) return;
      cut = (cut + 1) % 4;
      stage.dataset.cut = String(cut);
    }, 900);
  }

  function indexMenuRows() {
    document.querySelectorAll('.bar-list > .mi').forEach((item, index) => item.style.setProperty('--i', String(index)));
  }

  function rebuildForLanguage() {
    fillReel();
    titles.length = 0;
    document.querySelectorAll('[data-kinetic-title]').forEach((title) => {
      resetTitle(title);
      setupTitle(title);
      title.classList.add('revealed');
    });
    if (!reduced) {
      if (scrubEl) scrubItems = buildChars(scrubEl);
      panels.forEach(collectPiecesAfterLanguage);
    }
    measure();
  }

  function collectPiecesAfterLanguage(panel, index) {
    collectPieces(panel);
    panel.pieces.forEach((piece) => piece.classList.toggle('show', index === activeFloor));
  }

  function boot() {
    indexMenuRows();
    fillReel();
    document.querySelectorAll('[data-kinetic-title]').forEach((title) => setupTitle(title));
    if (footWord) fitFootWord(footWord, footWord.textContent);
    document.addEventListener('portfolio:language', rebuildForLanguage);

    if (reduced) {
      document.querySelectorAll('[data-kinetic-title]').forEach((title) => title.classList.add('revealed'));
      window.PortfolioMotion = { active: false };
      return;
    }

    scrubItems = scrubEl ? buildChars(scrubEl) : [];
    footItems = footWord ? buildChars(footWord).map((item) => ({ span: item.span })) : [];
    const stage = document.querySelector('[data-reel-stage]');
    if (stage) stage.dataset.cut = '0';
    setupFloors();
    root.classList.add('motion-ready');
    measure();
    paint();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelector('.hero [data-kinetic-title]')?.classList.add('revealed');
      document.querySelectorAll('.fp [data-kinetic-title]').forEach((title) => title.classList.add('revealed'));
    }));

    if (ticker?.getAnimations) tickerAnim = ticker.getAnimations()[0] || null;
    if (typeof window.Lenis === 'function') {
      lenis = new window.Lenis({ autoRaf: false, anchors: true, lerp: 0.11 });
      window.lenis = lenis;
      lenis.resize();
    }
    window.PortfolioMotion = {
      active: true,
      scrollTo: (target) => (lenis ? lenis.scrollTo(target) : window.scrollTo({ top: target, behavior: 'smooth' })),
    };

    observeScenes();
    startCuts();
    bindTilt();

    window.addEventListener('resize', measure);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
    requestAnimationFrame(loop);
  }

  // Wait briefly for the display face so first measurements are right, but never hold the page for it.
  const baseFont = document.fonts?.load
    ? Promise.all([
      document.fonts.load('400 100px "Display"', 'AБ'),
      document.fonts.load('400 40px "Forum"', 'A'),
    ]).catch(() => null)
    : Promise.resolve();
  let booted = false;

  Promise.race([baseFont, new Promise((resolve) => { setTimeout(resolve, 900); })]).then(() => {
    widthCache.clear();
    boot();
    booted = true;
  });

  baseFont.then(() => {
    if (!booted) return;
    widthCache.clear();
    document.querySelectorAll('[data-kinetic-title]').forEach(fitTitle);
    if (footWord) fitFootWord(footWord, footWord.textContent);
    measure();
  });
})();
