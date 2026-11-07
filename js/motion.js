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
    if (!crestRibbons.length) return;
    let inView = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { inView = entries[0].isIntersecting; }).observe(crest);
    }
    crestRibbons.forEach(({ el, pivot }) => {
      setTimeout(() => {
        setInterval(() => {
          if (inView) el.setAttribute('transform', `rotate(${[-0.5, 0, 0.5][Math.floor(Math.random() * 3)]} ${pivot} 230)`);
        }, 300);
      }, Math.random() * 500);
    });
  }

  // ---- The text under the flourish: ink spreading from the nib, through a mask ----
  function setupInk() {
    if (!inkBlock) return;
    const layer = document.createElement('div');
    layer.className = 'ink-layer';
    layer.append(...inkBlock.childNodes);
    inkBlock.append(layer);
    // Spare copies are plain and hidden from assistive technology, so the real headings stay the only ones.
    for (const name of ['dim', 'wet']) {
      const copy = document.createElement('div');
      copy.className = `ink-copy ink-copy--${name}`;
      copy.setAttribute('aria-hidden', 'true');
      [...layer.children].forEach((source) => {
        const line = document.createElement('div');
        line.className = source.className;
        line.textContent = source.textContent;
        copy.append(line);
      });
      inkBlock.append(copy);
    }
    new Image().src = '/assets/images/ink-blot.webp';
  }

  function setInk(progress) {
    inkBlock.classList.toggle('inked', progress >= 1);
    inkBlock.dataset.ink = progress.toFixed(3);
    inkBlock.style.setProperty('--ink-size', `${(progress * inkReach).toFixed(1)}px`);
    // The wet rim runs a little ahead, and is there from the first moment the ink touches the text.
    inkBlock.style.setProperty('--ink-wet', `${(Math.min(1, progress * 1.1 + (progress > 0 ? 0.015 : 0)) * inkReach).toFixed(1)}px`);
  }

  // ---- The flourish under the crest: fern fiddleheads that unroll from the stem as you scroll ----
  const smooth = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;
  const STEM_X = 300;
  const LEAF = 'M0 0Q.42 .3 1 0Q.42 -.3 0 0Z';
  const VEINS = 'M.06 0L.9 0M.3 0L.42 .12M.3 0L.42 -.12M.55 0L.66 .09M.55 0L.66 -.09';
  const BRANCH_TIERS = [
    { y: 40, length: 268, width: 15, leaf: 46, leaves: [[0.17, 1], [0.27, -1], [0.38, 1], [0.49, -1]], stars: [[238, 44, 8], [212, 118, 3], [240, 74, 2.4]] },
    { y: 142, length: 186, width: 12, leaf: 36, leaves: [[0.2, 1], [0.33, -1], [0.47, 1]], stars: [[172, 150, 6], [150, 216, 2.6]] },
    { y: 226, length: 118, width: 9, leaf: 25, leaves: [[0.24, 1], [0.42, -1]], stars: [[108, 232, 5], [120, 276, 2.2]] },
  ];

  // One centre line for a branch at openness t: 0 is a tight coil against the stem, 1 a long sweep ending in a small volute.
  function branchCurve(length, t) {
    const count = 64;
    const start = mix(1.3, 0.72, t);
    const flatten = 0.72 * t;
    const coil = mix(19, 9.4, t);
    const power = mix(1.35, 7.5, t);
    const points = [];
    let x = 0;
    let y = 0;
    for (let i = 0; i <= count; i += 1) {
      const u = i / count;
      const heading = start - flatten * Math.min(1, u * 1.6) - coil * u ** power;
      points.push({ x, y, heading, u });
      x += Math.cos(heading) * (length / count);
      y += Math.sin(heading) * (length / count);
    }
    return points;
  }

  function buildCrestBranches() {
    if (!crestBranchLayer) return;
    const make = (name, className) => {
      const el = document.createElementNS(SVG_NS, name);
      el.setAttribute('class', className);
      return el;
    };
    BRANCH_TIERS.forEach((tier, index) => {
      [1, -1].forEach((side) => {
        const branch = { tier, index, side, body: make('path', 'crest-link-body'), rib: make('path', 'crest-link-rib'), leaves: [], stars: [] };
        crestBranchLayer.append(branch.body, branch.rib);
        tier.leaves.forEach(([u, flank]) => {
          const group = make('g', 'crest-link-leaf-group');
          const blade = make('path', 'crest-link-leaf');
          const veins = make('path', 'crest-link-vein');
          blade.setAttribute('d', LEAF);
          veins.setAttribute('d', VEINS);
          group.append(blade, veins);
          crestBranchLayer.append(group);
          branch.leaves.push({ group, u, flank });
        });
        tier.stars.forEach(([x, y, r]) => {
          const star = make('path', 'crest-link-leaf');
          star.setAttribute('d', r > 4 ? 'M0 -1L.2 -.2L1 0L.2 .2L0 1L-.2 .2L-1 0L-.2 -.2Z' : 'M0 -1A1 1 0 0 1 0 1A1 1 0 0 1 0 -1Z');
          crestBranchLayer.append(star);
          branch.stars.push({ star, x: STEM_X + side * x, y, r });
        });
        crestBranches.push(branch);
      });
    });
    unfurlBranches(0);
  }

  // Everything comes from one number, so scrolling back rolls it all up again.
  function unfurlBranches(progress) {
    crestLink.dataset.unfurled = progress.toFixed(3);
    crestBranches.forEach(({ tier, index, side, body, rib, leaves, stars }) => {
      // The top tier leads, and the ones below follow it down the stem.
      const open = smooth(clamp((progress - index * 0.14) / 0.72));
      const curve = branchCurve(tier.length, open);
      const at = (p) => [STEM_X + side * p.x, tier.y + p.y];
      const widthAt = (u) => tier.width * mix(0.6, 1, open) * (1 - 0.74 * u) * Math.min(1, 0.45 + u * 9);
      const outer = [];
      const inner = [];
      curve.forEach((p) => {
        const half = widthAt(p.u) / 2;
        const [x, y] = at(p);
        const nx = -Math.sin(p.heading) * side;
        const ny = Math.cos(p.heading);
        outer.push(`${(x + nx * half).toFixed(1)} ${(y + ny * half).toFixed(1)}`);
        inner.unshift(`${(x - nx * half).toFixed(1)} ${(y - ny * half).toFixed(1)}`);
      });
      body.setAttribute('d', `M${outer.join('L')}L${inner.join('L')}Z`);
      rib.setAttribute('d', `M${curve.filter((p) => p.u > 0.03 && p.u < 0.97).map((p) => at(p).map((n) => n.toFixed(1)).join(' ')).join('L')}`);
      rib.setAttribute('stroke-width', (tier.width * 0.15).toFixed(2));
      // Leaves ride the stem and open in a wave from base to tip, folded along it until their turn.
      leaves.forEach(({ group, u, flank }) => {
        const leafOpen = smooth(clamp((open - u * 0.62) / 0.38));
        const p = curve[Math.round(u * (curve.length - 1))];
        const [x, y] = at(p);
        const angle = p.heading + flank * mix(0.1, 0.82, leafOpen);
        const direction = side > 0 ? angle : Math.PI - angle;
        const size = tier.leaf * mix(0.26, 1, leafOpen);
        const degrees = (direction * 180) / Math.PI;
        group.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${degrees.toFixed(1)}) scale(${size.toFixed(1)})`);
      });
      // Sparks only as a branch finishes opening.
      const spark = smooth(clamp((open - 0.72) / 0.28));
      stars.forEach(({ star, x, y, r }) => {
        star.setAttribute('transform', `translate(${x} ${y}) scale(${(r * spark).toFixed(2)})`);
      });
    });
  }

  // ---- Boot ----
  const crest = document.querySelector('[data-crest]');
  const bust = document.querySelector('[data-bust]');
  const crestRibbons = crest ? [...crest.querySelectorAll('[data-crest-ribbon]')].map((el) => ({
    el,
    slide: el.firstElementChild,
    offset: Number(el.dataset.crestRibbon),
    pivot: el.dataset.crestPivot,
  })) : [];
  const dock = document.querySelector('[data-dock]');
  const inkBlock = document.querySelector('[data-ink]');
  const inkStage = document.querySelector('[data-ink-stage]');
  const crestLink = document.querySelector('[data-crest-link]');
  const crestBranchLayer = crestLink?.querySelector('[data-crest-link-branches]');
  const crestBranches = [];
  const crestLinkPen = crestLink?.querySelector('[data-crest-link-pen]');
  const crestLinkDrop = crestLink?.querySelector('[data-crest-link-drop]');
  const footWord = document.querySelector('[data-foot-word]');
  const ticker = document.querySelector('[data-ticker] .ticker-track');

  let footItems = [];
  let footOn = false;
  let footTimers = [];
  let vh = window.innerHeight;
  let vw = window.innerWidth;
  let floorsTop = 0;
  let floorsHeight = 1;
  let inkStageTop = 0;
  let inkHold = 0;
  let inkReach = 1;
  let linkTop = 0;
  let linkHeight = 1;
  let crestTop = 0;
  let bustTop = 0;
  let bustHeight = 1;
  let footTop = 0;
  let footHeight = 1;
  let dockH = 52;
  let dockParked = 66;
  let unit = 16;
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
    if (inkBlock) {
      const box = inkBlock.getBoundingClientRect();
      inkStageTop = inkStage.getBoundingClientRect().top + window.scrollY;
      inkHold = parseFloat(getComputedStyle(inkStage).paddingBottom) || 0;
      // The side of the mask image at which its blot, an ellipse 0.46 wide and 0.93 tall, clears the block's far corners.
      inkReach = Math.hypot(box.width / 2 / 0.46, box.height / 0.93) / 0.8;
    }
    if (crestLink) {
      linkTop = docTop(crestLink);
      linkHeight = crestLink.getBoundingClientRect().height || 1;
    }
    if (crest) crestTop = docTop(crest);
    if (bust) {
      bustTop = docTop(bust);
      bustHeight = bust.offsetHeight || 1;
    }
    if (footWord) {
      footTop = docTop(footWord);
      footHeight = footWord.offsetHeight || 1;
    }
    if (dock) dockH = dock.offsetHeight || 52;
    unit = parseFloat(getComputedStyle(document.body).fontSize) || 16;
    dockParked = (document.querySelector('.bar-row')?.getBoundingClientRect().bottom ?? 66);
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
      const eased = 1 - (1 - clamp((y + vh - crestTop) / vh)) ** 2;
      crestRibbons.forEach(({ slide, offset }) => slide.setAttribute('transform', `translate(${(offset * (1 - eased)).toFixed(1)} 0)`));
    }
    if (bust) {
      // The bust rises out of its plinth as it comes into view, settled by the time it nearly fills the screen.
      const risen = clamp((y + vh - bustTop) / (vh * 0.9));
      bust.style.setProperty('--bust-y', ((1 - risen) ** 3 * bustHeight * 0.55).toFixed(1));
    }
    // One chain: the branches open as the pen slides in, a drop falls from the nib, then ink spreads through the text.
    const linkStart = linkTop - vh * 0.78;
    const linkEnd = linkTop + linkHeight - vh * 0.5;
    if (crestBranches.length) {
      const unfurled = clamp((y - linkStart) / Math.max(1, linkEnd - linkStart));
      unfurlBranches(unfurled);
      // The pen comes out from behind the crest, along the stem, and settles before the branches finish.
      const slid = 1 - (1 - clamp(unfurled / 0.62)) ** 3;
      crestLinkPen.setAttribute('transform', `translate(0 ${((slid - 1) * 400).toFixed(1)})`);
    }
    if (inkBlock) {
      // The text is held below the bar for the stage's extra height, and the ink finishes just as it lets go.
      const inkStick = inkStageTop - (vw > 640 ? dockParked + dockH : dockParked) - 16;
      const inkEnd = inkStick + inkHold;
      inkBlock.style.transform = `translateY(${clamp(y - inkStick, 0, inkHold).toFixed(1)}px)`;
      const inked = clamp((y - linkEnd) / Math.max(1, inkEnd - linkEnd));
      setInk(inked);
      if (crestLinkDrop) {
        const swell = clamp((y - (linkEnd - vh * 0.1)) / (vh * 0.1));
        const fall = clamp(inked / 0.05);
        crestLinkDrop.setAttribute('r', (5.5 * swell * (1 - fall)).toFixed(2));
        crestLinkDrop.setAttribute('cy', (403 + fall * fall * 36).toFixed(1));
      }
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
        entry.target.classList.add(entry.target.matches('[data-kinetic-title]') ? 'revealed' : 'in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('[data-fade], [data-stagger]').forEach((el) => reveal.observe(el));
    document.querySelectorAll('.bio [data-kinetic-title], .case [data-kinetic-title]').forEach((el) => reveal.observe(el));
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

    setupInk();
    buildCrestBranches();
    footItems = footWord ? buildChars(footWord).map((item) => ({ span: item.span })) : [];
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
