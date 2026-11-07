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
      { line: 0, at: 0.92, id: 's-helmet', x: 0.04, y: -0.5, w: 0.58, h: 0.55 },
      { line: 1, at: 0, id: 's-gearhead', x: -0.9, y: -0.44, w: 0.9, h: 1.2, delay: -0.3 },
      { line: 1, at: 0.32, id: 's-sun', x: -0.26, y: -0.04, w: 1, h: 1, over: true, delay: -0.1 },
      { line: 1, at: 0.99, id: 's-bezier', x: 0.38, y: -0.12, w: 1.3, h: 0.89, delay: -0.8 },
      { line: 2, at: 0.6, id: 's-cubesat', x: -0.28, y: -0.14, w: 0.86, h: 0.6, over: true, delay: -0.45 },
      { line: 2, at: 0, id: 's-window', x: -0.5, y: 0.14, w: 0.48, h: 0.72, delay: -0.6 },
    ],
    finly: [
      { line: 0, at: 0, id: 's-piggy', x: -1.18, y: -0.1, w: 1.14, h: 0.9 },
      { line: 0, at: 0.99, id: 's-coin', x: 0.42, y: 0.02, w: 0.44, h: 0.54, delay: -0.5 },
    ],
    tablets: [
      { line: 0, at: 0.99, id: 's-alarm', x: 0.4, y: -0.3, w: 1.06, h: 1.22, delay: -0.3 },
      { line: 1, at: 0, id: 's-bottle', x: -0.46, y: 0.16, w: 0.4, h: 0.58, delay: -0.6 },
    ],
    cubesat: [
      { line: 0, at: 0, id: 's-rocket', x: -0.74, y: -0.34, w: 0.72, h: 1.16, delay: -0.2 },
      { line: 0, at: 0.99, id: 's-comet', x: 0.42, y: 0.0, w: 0.66, h: 0.44, delay: -0.7 },
    ],
    contact: [
      { line: 0, at: 0.99, id: 's-plane', x: 0.3, y: -0.6, w: 2.8, h: 1.83, delay: -0.4 },
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

  // Sticker specs were drawn against capitals 0.859em tall; the heading face's are 0.711em.
  const STICKER_EM = 0.8465;

  function createSticker(spec, n) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', `sticker ltr-sticker ltr-sticker--${spec.id}${spec.over ? ' ltr-sticker--over' : ''}`);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', `${STICKER_FILE}#${spec.id}`);
    svg.appendChild(use);
    svg.style.cssText = `left:${spec.x * STICKER_EM}em;top:${spec.y * STICKER_EM}em;width:${spec.w * STICKER_EM}em;height:${spec.h * STICKER_EM}em;`
      + `--delay:${spec.delay || 0}s;--n:${n};${spec.flip ? 'scale:-1 1;' : ''}`;
    return svg;
  }

  // ---- Swapped letters: the reference sets a few letters of each title in its special face ----
  // I and J are too narrow to read as a swap; M and W come out too wide.
  const SWAPPABLE = /^[A-HKLN-VX-Z]$/;
  const SPECIAL_SIZE = 1.02;

  // One letter per line, never one under a sticker, chosen once per render: they do not flicker.
  function chooseSwaps(lines, max) {
    let made = 0;
    for (const letters of shuffle(lines)) {
      if (made >= max) break;
      const cell = shuffle(letters).find((item) => SWAPPABLE.test(item.dataset.char) && !item.classList.contains('ltr-over'));
      if (cell) {
        cell.classList.add('is-alt');
        made += 1;
      }
    }
  }

  const titles = [];

  function fitTitle(title) {
    let widest = 0;
    title.querySelectorAll('.line-vis').forEach((line) => {
      widest = Math.max(widest, [...line.children].reduce((sum, cell) => sum + (cell.classList.contains('is-alt')
        ? advance(cell.dataset.char, 'Special') * SPECIAL_SIZE
        : advance(cell.dataset.char, 'Display')), 0));
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
    // A title can name its letter; a chance pick is fine for the rest.
    const pinned = byLine.flat().find((cell) => cell.dataset.char === title.dataset.swap);
    if (pinned) pinned.classList.add('is-alt');
    else chooseSwaps(byLine, title.closest('.hero') ? 3 : 1);
    fitTitle(title);
    titles.push(record);
    return record;
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

  // The ribbons shake on their own, in steps, as the reference's do: half a degree either way every 0.3s.
  function shakeCrestRibbons() {
    crestRibbons.forEach(({ crest, el, pivot }) => {
      let inView = true;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => { inView = entries[0].isIntersecting; }).observe(crest);
      }
      setTimeout(() => {
        setInterval(() => {
          if (inView) el.setAttribute('transform', `rotate(${[-0.5, 0, 0.5][Math.floor(Math.random() * 3)]} ${pivot} 230)`);
        }, 300);
      }, Math.random() * 500);
    });
  }

  // ---- Boot ----
  const bust = document.querySelector('[data-bust]');
  const crestRibbons = [...document.querySelectorAll('[data-crest-ribbon]')].map((el) => ({
    crest: el.closest('[data-crest]'),
    top: 0,
    el,
    slide: el.firstElementChild,
    offset: Number(el.dataset.crestRibbon),
    pivot: el.dataset.crestPivot,
  }));
  const dock = document.querySelector('[data-dock]');
  const scrubEl = document.querySelector('[data-scrub]');
  const footWord = document.querySelector('[data-foot-word]');

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
  let bustTop = 0;
  let bustHeight = 1;
  let footTop = 0;
  let dockH = 52;
  let dockParked = 66;
  let unit = 16;
  let lastY = -1;
  let lenis = null;

  function docTop(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  // ---- Entrances ----
  // Played by scroll position, as the floors and the quote are: the page is the playhead, so they run both ways.
  // Each has a playhead of 0 to 1000; `from` and `to` are where its top sits in the view, as fractions of its height,
  // when that playhead starts and ends. No fill past the end, so a finished entrance leaves the page's own styles in charge.
  // These elements move several times further than the page does, so locked to the scroll they cross the screen in a few
  // huge jumps and look like a low frame rate. The playhead follows the scroll on a critically damped spring instead.
  const entrances = [];
  const SPRING = 15;
  const EASE_SLIDE = 'cubic-bezier(.65,0,.35,1)';
  const EASE_LAND = 'cubic-bezier(.34,1.45,.64,1)';
  const range = (p, start, end) => clamp((p - start) / (end - start));
  // Starts squashed flat, expands past its size, then settles: the element itself moves, rather than being uncovered at a hidden edge.
  const stretch = (axis) => [
    { opacity: 0, transform: `scale${axis}(.04)`, offset: 0 },
    { opacity: 1, offset: 0.06 },
    { transform: `scale${axis}(1.03)`, offset: 0.85 },
    { opacity: 1, transform: 'none', offset: 1 },
  ];

  function track(el, keyframes, at, length, easing = EASE_SLIDE) {
    const animation = el.animate(keyframes, { delay: at, duration: length, easing, fill: 'backwards' });
    animation.pause();
    return animation;
  }

  function addEntrance(place, tracks, onProgress) {
    entrances.push({ place, tracks, onProgress, top: 0, from: 1, to: 0, p: -1, target: 0, x: 0, v: 0 });
  }

  function applyEntrance(entrance, p) {
    if (p === entrance.p) return;
    entrance.p = p;
    entrance.tracks.forEach((animation) => { animation.currentTime = p * 1000; });
    entrance.onProgress?.(p);
  }

  function stepEntrances(dt) {
    entrances.forEach((entrance) => {
      if (entrance.x === entrance.target && !entrance.v) return;
      const offset = entrance.x - entrance.target;
      const drift = entrance.v + SPRING * offset;
      const decay = Math.exp(-SPRING * dt);
      entrance.x = entrance.target + (offset + drift * dt) * decay;
      entrance.v = (drift - SPRING * (offset + drift * dt)) * decay;
      if (Math.abs(entrance.x - entrance.target) < 0.0005 && Math.abs(entrance.v) < 0.01) {
        entrance.x = entrance.target;
        entrance.v = 0;
      }
      applyEntrance(entrance, clamp(entrance.x));
    });
  }

  // Where an element sits in the page ignoring any entrance transform on it or its ancestors.
  function flowTop(el) {
    let top = 0;
    for (let node = el; node; node = node.offsetParent) top += node.offsetTop;
    return top;
  }

  // Each starts as it reaches the screen and is finished once it is wholly on it, left to right, so a stacked phone layout gets the same.
  function flipIn(el, icon, column) {
    addEntrance(() => {
      const end = Math.max(0.35, (vh - el.offsetHeight - 8) / vh);
      return { top: flowTop(el), from: end + 0.25 - column() * 0.04, to: end };
    }, [
      track(el, [
        { opacity: 0, transform: 'perspective(800px) rotateX(-80deg)', offset: 0 },
        { opacity: 1, offset: 0.3 },
        { opacity: 1, transform: 'none', offset: 1 },
      ], 0, 760),
      track(icon, [{ opacity: 0, transform: 'scale(.4) rotate(-14deg)' }, { opacity: 1, transform: 'none' }], 440, 559, EASE_LAND),
    ]);
  }

  function setupEntrances() {
    document.querySelectorAll('.case').forEach((file) => {
      const spec = file.querySelector('.case-spec');
      const panel = file.querySelector('.case-file');
      addEntrance(() => ({ top: docTop(file), from: 0.95, to: 0.45 }), spec ? [
        track(spec, [{ opacity: 0, transform: 'translateY(calc(1.5*var(--u))) rotate(-2.5deg) scale(.96)' }, { opacity: 1, transform: 'none' }], 0, 1000, EASE_LAND),
      ] : []);
      // The panel expands sideways out of its own centre.
      addEntrance(() => ({ top: docTop(panel), from: 0.95, to: 0.3 }), [track(panel, stretch('X'), 0, 700, 'linear')]);
      // Its cards flip down from their top edge, as the flip buttons do, then the icon lands.
      panel.querySelectorAll('.feat, .trophies li').forEach((card) => {
        const first = card.parentElement.firstElementChild;
        flipIn(card, card.querySelector('.feat-ico, .sticker'), () => Math.round((card.offsetLeft - first.offsetLeft) / Math.max(1, card.offsetWidth)));
      });
    });

    // The finale: the panel stretches down, then the plane takes off from its title.
    const finale = document.querySelector('.panel--pink');
    if (finale) {
      const plane = finale.querySelector('.contact-title .ltr-sticker');
      addEntrance(() => ({ top: flowTop(finale), from: 0.95, to: 0.3 }), [
        track(finale, stretch('Y'), 0, 460, 'linear'),
        ...(plane ? [track(plane, [
          { opacity: 0, transform: 'translate(-70%, 70%) scale(.45) rotate(-10deg)', offset: 0 },
          { opacity: 1, offset: 0.25 },
          { opacity: 1, transform: 'none', offset: 1 },
        ], 380, 619, 'cubic-bezier(.22,1,.36,1)')] : []),
      ]);
    }

    // The spines stretch up one by one like a shelf being stocked, then the open drawer slides out and pushes them along.
    const tools = document.querySelector('.tools');
    if (tools) {
      addEntrance(() => ({ top: docTop(tools), from: 0.95, to: 0.3 }), [...tools.querySelectorAll('.tool')].map((drawer, index) => track(
        drawer,
        stretch('Y'),
        index * 60,
        480,
        'linear',
      )), (p) => {
        const slide = range(p, 0.5, 0.85);
        tools.style.setProperty('--shelf', (slide * slide * (3 - 2 * slide)).toFixed(4));
        tools.style.setProperty('--art', range(p, 0.72, 0.92).toFixed(3));
        tools.style.setProperty('--rows', range(p, 0.78, 1).toFixed(3));
        tools.classList.toggle('is-scrubbing', p < 1);
      });
    }

    // Each step stretches up off the floor in turn, then its drawing drops down and lands on it. A phone stacks the steps, so each waits for its own turn.
    const stairs = document.querySelector('.edu-stairs');
    document.querySelectorAll('.edu').forEach((step, index) => {
      // Timed from the floor they stand on, not their tops: the first step starts as its own top comes on screen, and all three finish with the stairs in view.
      addEntrance(() => (vw > 820
        ? { top: docTop(stairs) + stairs.offsetHeight, from: 1.2 - index * 0.07, to: 0.93 - index * 0.07 }
        : { top: docTop(stairs) + step.offsetTop - stairs.offsetTop + step.offsetHeight, from: 1.1, to: 0.8 }), [
        track(step, stretch('Y'), 0, 760, 'linear'),
        track(step.querySelector('.edu-art'), [
          { opacity: 0, transform: 'translateY(-30%) rotate(-5deg)', offset: 0 },
          { opacity: 1, offset: 0.2 },
          { opacity: 1, transform: 'none', offset: 1 },
        ], 560, 439, EASE_LAND),
      ]);
    });
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
    crestRibbons.forEach((ribbon) => { ribbon.top = docTop(ribbon.crest); });
    entrances.forEach((entrance) => Object.assign(entrance, entrance.place()));
    if (bust) {
      bustTop = docTop(bust);
      bustHeight = bust.offsetHeight || 1;
    }
    if (footWord) footTop = docTop(footWord);
    if (rubber.bars.length) {
      rubber.top = docTop(rubber.space);
      rubber.height = rubber.space.offsetHeight;
      rubber.barHeight = rubber.bars[0].offsetHeight || 12;
      rubber.pull = Math.max((COARSE ? vh * 0.28 : rubber.height) - rubber.barHeight, 0);
    }
    if (dock) dockH = dock.offsetHeight || 52;
    unit = parseFloat(getComputedStyle(document.body).fontSize) || 16;
    dockParked = (document.querySelector('.bar-row')?.getBoundingClientRect().bottom ?? 66);
    // Lenis caches the page height; keep it honest whenever the layout changes.
    lenis?.resize();
    lastY = -1;
  }

  // ---- The rubberband at the very end of the page, from the reference's footer ----
  const COARSE = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const RELEASE_DELAY = 100;
  const rubber = { bars: [], strip: null, space: null, top: 0, height: 0, weights: [], pull: 0, barHeight: 12, shown: -1, timer: 0, returning: false, pulling: false, originY: 0, raf: 0 };

  function stretchBars(progress) {
    if (progress === rubber.shown) return;
    rubber.shown = progress;
    rubber.bars.forEach((bar, index) => {
      bar.style.transform = `scaleY(${(1 + (progress * rubber.pull * rubber.weights[index]) / rubber.barHeight).toFixed(3)})`;
    });
  }

  function springBack() {
    clearTimeout(rubber.timer);
    if (rubber.returning || window.scrollY + vh <= rubber.top + 1) return;
    rubber.returning = true;
    const done = () => { rubber.returning = false; };
    if (lenis) lenis.scrollTo(rubber.top - vh, { duration: 0.8, easing: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)), force: true, onComplete: done });
    else {
      window.scrollTo({ top: rubber.top - vh, behavior: 'smooth' });
      done();
    }
  }

  function atPageEnd() {
    return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  }

  // Touch has no room to scroll past the end, so a pull at the bottom stretches the bars with growing resistance.
  function bindTouchPull() {
    window.addEventListener('touchstart', (event) => {
      rubber.pulling = false;
      rubber.originY = event.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchmove', (event) => {
      const pulled = rubber.originY - event.touches[0].clientY;
      if (!rubber.pulling) {
        if (pulled <= 0 || !atPageEnd()) {
          rubber.originY = event.touches[0].clientY;
          return;
        }
        cancelAnimationFrame(rubber.raf);
        rubber.pulling = true;
        rubber.originY = event.touches[0].clientY;
        rubber.strip.setAttribute('data-pinned', '');
        return;
      }
      event.preventDefault();
      stretchBars(1 - Math.exp((-Math.max(pulled, 0) * 0.75) / Math.max(1, rubber.pull)));
    }, { passive: false });
    const release = () => {
      if (!rubber.pulling) return;
      rubber.pulling = false;
      const from = rubber.shown;
      const start = performance.now();
      const settle = (now) => {
        const t = Math.min(1, (now - start) / 900);
        stretchBars(t === 1 ? 0 : from * 2 ** (-10 * t) * Math.cos(t * 28));
        if (t < 1) rubber.raf = requestAnimationFrame(settle);
        else rubber.strip.removeAttribute('data-pinned');
      };
      rubber.raf = requestAnimationFrame(settle);
    };
    window.addEventListener('touchend', release, { passive: true });
    window.addEventListener('touchcancel', release, { passive: true });
  }

  function setupRubberband() {
    rubber.strip = document.querySelector('[data-foot-bars]');
    rubber.space = document.querySelector('[data-foot-space]');
    rubber.bars = rubber.strip ? [...rubber.strip.children] : [];
    if (!rubber.bars.length || !rubber.space) return;
    const middle = (rubber.bars.length - 1) / 2;
    rubber.weights = rubber.bars.map((bar, index) => 0.2 + 0.8 * (1 - Math.abs(index - middle) / middle));
    if (COARSE) {
      bindTouchPull();
      return;
    }
    const held = () => {
      rubber.returning = false;
      clearTimeout(rubber.timer);
      rubber.timer = setTimeout(springBack, RELEASE_DELAY);
    };
    window.addEventListener('wheel', held, { passive: true });
    window.addEventListener('keyup', springBack);
    window.addEventListener('pointerup', springBack);
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
    lastY = y;

    if (dock && vw > 640) {
      dock.style.setProperty('--dock-y', `${Math.max(dockParked, vh - dockH - unit - y)}px`);
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
    if (crestRibbons.length) {
      // Tucked in by their own width when the crest enters the view, power2.out from there. The reference runs on until
      // its crest has left; these ribbons carry the name, so they finish as the crest reaches the top and stay readable.
      crestRibbons.forEach(({ slide, offset, top }) => {
        const eased = 1 - (1 - clamp((y + vh - top) / vh)) ** 2;
        slide.setAttribute('transform', `translate(${(offset * (1 - eased)).toFixed(1)} 0)`);
      });
    }
    if (bust) {
      // The bust rises out of its plinth as it comes into view, settled by the time it nearly fills the screen.
      const risen = clamp((y + vh - bustTop) / (vh * 0.9));
      bust.style.setProperty('--bust-y', ((1 - risen) ** 3 * bustHeight * 0.55).toFixed(1));
    }
    if (scrubItems.length) {
      // From the text's top entering 15% up the view to its bottom reaching 55% down it. The reference ends this at 10% up
      // the view, which rushes text as small as ours; this also finishes with the first line still clear of the buttons.
      paintScrub(scrubItems, clamp((y + vh * 0.85 - scrubTop) / Math.max(1, scrubHeight + vh * 0.3)));
    }
    entrances.forEach((entrance) => {
      entrance.target = clamp((y + vh * entrance.from - entrance.top) / Math.max(1, vh * (entrance.from - entrance.to)));
    });
    // As the reference: on once its top is 30% up the view, and it plays back if you scroll away above that.
    if (footItems.length) setFootWord(y + vh * 0.7 > footTop);
    if (rubber.bars.length && !COARSE) {
      const progress = clamp((y + vh - rubber.top) / Math.max(1, rubber.height));
      rubber.strip.toggleAttribute('data-pinned', progress > 0);
      stretchBars(progress);
    }
  }

  let lastFrame = 0;
  function loop(time) {
    if (lenis) lenis.raf(time);
    paint();
    stepEntrances(Math.min(0.05, (time - lastFrame) / 1000));
    lastFrame = time;
    requestAnimationFrame(loop);
  }

  function observeScenes() {
    if (!('IntersectionObserver' in window)) return;
    const pause = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-off', !entry.isIntersecting));
    }, { rootMargin: '10% 0px' });
    document.querySelectorAll('.hero, .reel, .about, .floors-sticky, .creed, .cases, .skills, .education, .panel, .foot')
      .forEach((section) => pause.observe(section));

    const reveal = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(entry.target.matches('[data-kinetic-title]') ? 'revealed' : 'in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('[data-fade], [data-stagger]').forEach((el) => reveal.observe(el));
    document.querySelectorAll('.bio [data-kinetic-title]').forEach((el) => reveal.observe(el));
    document.querySelectorAll('[data-stagger]').forEach((el) => {
      [...el.children].forEach((child, index) => child.style.setProperty('--i', String(index)));
    });

    // Only fetch and play the reel near the viewport.
    const video = document.querySelector('[data-reel-video]');
    if (video) {
      new IntersectionObserver((entries) => {
        if (entries[entries.length - 1].isIntersecting) video.play().catch(() => {});
        else video.pause();
      }, { rootMargin: '30% 0px' }).observe(video);
    }

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

  function indexMenuRows() {
    document.querySelectorAll('.bar-list > .mi').forEach((item, index) => item.style.setProperty('--i', String(index)));
  }

  function boot() {
    indexMenuRows();
    document.querySelectorAll('[data-kinetic-title]').forEach((title) => setupTitle(title));
    if (footWord) fitFootWord(footWord, footWord.textContent);

    if (reduced) {
      document.querySelectorAll('[data-kinetic-title]').forEach((title) => title.classList.add('revealed'));
      window.PortfolioMotion = { active: false };
      return;
    }

    scrubItems = scrubEl ? buildChars(scrubEl) : [];
    footItems = footWord ? buildChars(footWord).map((item) => ({ span: item.span })) : [];
    setupFloors();
    setupEntrances();
    setupRubberband();
    root.classList.add('motion-ready');
    measure();
    paint();
    // Opening the page part-way down shows the entrances already at that point rather than playing them through.
    entrances.forEach((entrance) => {
      entrance.x = entrance.target;
      applyEntrance(entrance, entrance.target);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelector('.hero [data-kinetic-title]')?.classList.add('revealed');
      document.querySelectorAll('.fp [data-kinetic-title], .case [data-kinetic-title], .contact [data-kinetic-title]').forEach((title) => title.classList.add('revealed'));
    }));

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
    bindTilt();
    shakeCrestRibbons();

    window.addEventListener('resize', measure);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
    requestAnimationFrame(loop);
  }

  // Wait briefly for the display face so first measurements are right, but never hold the page for it.
  const baseFont = document.fonts?.load
    ? Promise.all([
      document.fonts.load('400 100px "Display"', 'A'),
      document.fonts.load('400 100px "Special"', 'A'),
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
