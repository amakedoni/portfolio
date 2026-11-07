const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORTFOLIO_TEST_PORT || 41739);
const origin = `http://127.0.0.1:${port}`;
const chromePath = process.env.PORTFOLIO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let server;
let browser;

function waitForServer(timeoutMs = 5000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    function probe() {
      const request = http.get(origin, (response) => {
        response.resume();
        resolve();
      });
      request.on('error', () => {
        if (Date.now() - started >= timeoutMs) {
          reject(new Error(`Local test server did not start at ${origin}`));
          return;
        }
        setTimeout(probe, 50);
      });
    }
    probe();
  });
}

async function openPage(options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1280, height: 900 },
    reducedMotion: options.reducedMotion || 'no-preference',
    colorScheme: 'light',
    javaScriptEnabled: options.javaScriptEnabled !== false,
    hasTouch: options.hasTouch || false,
    serviceWorkers: 'block',
  });
  if (options.init) await context.addInitScript(options.init);
  const page = await context.newPage();
  await page.goto(`${origin}${options.path || '/'}`, { waitUntil: 'load' });
  if (options.javaScriptEnabled !== false && options.reducedMotion !== 'reduce' && !options.path) {
    await page.waitForFunction(() => document.documentElement.classList.contains('motion-ready'));
  }
  return { context, page };
}

// Jumps without smoothing, then lets one paint pass run so scroll-driven state is current.
async function jumpTo(page, y) {
  await page.evaluate((target) => {
    if (window.lenis) window.lenis.scrollTo(target, { immediate: true, force: true });
    else window.scrollTo(0, target);
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, y);
}

function docTop(page, selector) {
  return page.evaluate((sel) => Math.round(document.querySelector(sel).getBoundingClientRect().top + window.scrollY), selector);
}

function parseColor(value) {
  const hex = value.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (hex) {
    const normalized = hex.length === 3 ? [...hex].map((channel) => channel + channel).join('') : hex;
    return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16));
  }
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  assert.ok(channels?.length === 3, `Expected a CSS color, received: ${value}`);
  return channels;
}

function luminance(rgb) {
  const linear = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

before(async () => {
  server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
    cwd: root,
    stdio: 'ignore',
  });
  await waitForServer();
  browser = await chromium.launch({ headless: true, executablePath: chromePath });
});

after(async () => {
  await browser?.close();
  server?.kill('SIGTERM');
});

test('every file the service worker precaches exists, under a new cache version', () => {
  const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(source, /portfolio-v2\./);
  const list = source.match(/urlsToCache = \[([\s\S]*?)\]/)[1].match(/'\/[^']*'/g).map((entry) => entry.slice(1, -1));
  for (const required of ['/css/site.css', '/js/ui.js', '/js/motion.js', '/js/vendor/lenis.js']) {
    assert.ok(list.includes(required), `${required} should be precached`);
  }
  for (const file of list.filter((entry) => entry !== '/')) {
    assert.ok(fs.existsSync(path.join(root, file)), `Precached file is missing: ${file}`);
  }
});

test('fonts are self-hosted and every declared file exists', () => {
  for (const page of ['index.html', '404.html']) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/, `${page} should not depend on a font CDN`);
  }
  const css = fs.readFileSync(path.join(root, 'css', 'site.css'), 'utf8');
  const files = [...css.matchAll(/url\('\/(assets\/fonts\/[^']+)'\)/g)].map((match) => match[1]);
  assert.ok(files.length >= 4);
  for (const file of files) assert.ok(fs.existsSync(path.join(root, file)), `Missing font file: ${file}`);
});

test('the page does not wait on any third-party host', { timeout: 15000 }, async () => {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  const external = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) external.push(request.url());
  });
  await page.goto(`${origin}/`, { waitUntil: 'load' });
  assert.deepEqual(external, []);
  await context.close();
});

test('layout stays inside representative viewport widths', { timeout: 60000 }, async () => {
  for (const width of [360, 390, 768, 1280, 1600, 2560]) {
    const { context, page } = await openPage({ viewport: { width, height: 800 }, hasTouch: width <= 768 });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (const fraction of [0, 0.35, 0.7, 1]) {
      await jumpTo(page, height * fraction);
      const sizes = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      }));
      assert.ok(sizes.document <= sizes.viewport, `${width}px overflowed to ${sizes.document}px at ${fraction}`);
    }
    await context.close();
  }
});

test('the interface scales with the screen like the reference', async () => {
  for (const [width, height, pillH, image] of [[1440, 900, 50, 480], [1920, 1080, 60, 640], [2560, 1440, 80, 853]]) {
    const { context, page } = await openPage({ viewport: { width, height } });
    const pill = await page.locator('.bar-row').boundingBox();
    const media = await page.locator('.fp-media--finly').boundingBox();
    assert.ok(Math.abs(pill.height - pillH) <= 1, `${width}px pill was ${pill.height}`);
    assert.ok(Math.abs(media.width - image) <= 1, `${width}px image was ${media.width}`);
    await context.close();
  }
});

test('essential content stays visible without JavaScript', async () => {
  const { context, page } = await openPage({ javaScriptEnabled: false });
  for (const selector of ['h1', '#about .scrub', '.fp-title', '.case', '.ticket', '.edu', '#contact-form', '.foot-word']) {
    assert.ok(await page.locator(selector).first().isVisible(), `${selector} should be visible`);
  }
  assert.match(await page.locator('h1').innerText(), /ENGINEERING/i);
  await context.close();
});

test('a failure in the motion script leaves content visible', async () => {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.route('**/js/motion.js', (route) => route.abort());
  await page.goto(`${origin}/`, { waitUntil: 'load' });
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('motion-ready')), false);
  assert.ok(await page.locator('h1').isVisible());
  const opacity = await page.locator('h1 .line').first().evaluate((el) => getComputedStyle(el).opacity);
  assert.equal(opacity, '1');
  await context.close();
});

test('hero and floor titles keep their real text for assistive technology', async () => {
  const { context, page } = await openPage();
  const spoken = await page.locator('h1 .sr-only').allTextContents();
  assert.deepEqual(spoken.map((text) => text.trim()), ['Engineering', "tomorrow's", 'interfaces.']);
  assert.equal(await page.locator('h1 .line-vis').first().getAttribute('aria-hidden'), 'true');
  await context.close();
});

test('swapped letters never spill past their own cell', { timeout: 15000 }, async () => {
  const { context, page } = await openPage();
  await page.waitForFunction(() => document.querySelectorAll('.hero-title .ltr.is-alt').length > 0);
  await page.evaluate(() => document.fonts.ready);
  const overlaps = await page.evaluate(() => [...document.querySelectorAll('.hero-title .ltr.is-alt')].map((cell) => {
    const box = cell.getBoundingClientRect();
    const glyph = cell.querySelector('.ltr-base').getBoundingClientRect();
    return Math.round(Math.max(box.left - glyph.left, glyph.right - box.right));
  }));
  for (const overlap of overlaps) assert.ok(overlap <= 0, `Swapped letter spills ${overlap}px past its cell`);
  await context.close();
});

test('the footer word finishes revealing at the end of the document', async () => {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const { context, page } = await openPage({ viewport });
    await jumpTo(page, await page.evaluate(() => document.documentElement.scrollHeight));
    await page.waitForFunction(() => {
      const all = document.querySelectorAll('.foot-word .ch-s');
      return all.length > 0 && document.querySelectorAll('.foot-word .ch-s.on').length === all.length;
    }, null, { timeout: 2000 });
    await context.close();
  }
});

test('the dock starts at the bottom and parks under the navigation', async () => {
  const { context, page } = await openPage();
  const reelTop = await docTop(page, '[data-reel]');
  await jumpTo(page, 0);
  await page.waitForFunction(() => document.querySelector('.dock').getBoundingClientRect().bottom > window.innerHeight - 20);
  await jumpTo(page, reelTop);
  await page.waitForFunction(() => Math.abs(document.querySelector('.dock').getBoundingClientRect().top - document.querySelector('.bar-row').getBoundingClientRect().bottom) < 2);
  await context.close();
});

test('floors share one pinned stage: colour and content swap as each image crosses', async () => {
  const { context, page } = await openPage();
  const floors = await page.evaluate(() => {
    const el = document.querySelector('[data-floors]');
    return { top: el.getBoundingClientRect().top + window.scrollY, height: el.offsetHeight, vh: window.innerHeight };
  });
  const step = (floors.height - floors.vh) / 4;
  const seen = [];
  for (let index = 0; index < 4; index += 1) {
    await jumpTo(page, floors.top + step * (index + 0.5));
    await page.waitForTimeout(650);
    seen.push(await page.evaluate(() => {
      const sticky = document.querySelector('[data-floors-sticky]');
      const active = document.querySelectorAll('.fp.is-active');
      const media = active[0].querySelector('[data-panel-media]').getBoundingClientRect();
      return {
        pinned: Math.abs(sticky.getBoundingClientRect().top) < 1,
        activeCount: active.length,
        live: document.querySelectorAll('.fp.is-live').length,
        title: active[0].querySelector('.fp-title .sr-only').textContent.trim(),
        shown: active[0].querySelectorAll('.fp-piece.show').length === active[0].querySelectorAll('.fp-piece').length,
        colour: getComputedStyle(sticky).backgroundColor,
        mediaInView: media.top < window.innerHeight && media.bottom > 0,
      };
    }));
  }
  assert.deepEqual(seen.map((item) => item.title), ['Finly', 'MAI', 'CubeSat', 'Recognition']);
  for (const item of seen) {
    assert.ok(item.pinned && item.activeCount === 1 && item.live === 1 && item.shown && item.mediaInView, JSON.stringify(item));
  }
  assert.equal(new Set(seen.map((item) => item.colour)).size, 4, 'Each floor has its own colour');
  // Scrolling back returns to the earlier floor.
  await jumpTo(page, floors.top + step * 0.5);
  await page.waitForTimeout(650);
  assert.equal((await page.locator('.fp.is-active .fp-title .sr-only').first().textContent()).trim(), 'Finly');
  await context.close();
});

test('the image travels from below the stage to above it within its floor', async () => {
  const { context, page } = await openPage();
  const floors = await page.evaluate(() => {
    const el = document.querySelector('[data-floors]');
    return { top: el.getBoundingClientRect().top + window.scrollY, height: el.offsetHeight, vh: window.innerHeight };
  });
  const step = (floors.height - floors.vh) / 4;
  const media = page.locator('.fp--finly [data-panel-media]');
  await jumpTo(page, floors.top + 1);
  const start = await media.boundingBox();
  await jumpTo(page, floors.top + step * 0.995);
  const end = await media.boundingBox();
  assert.ok(start.y >= floors.vh * 0.95, `Should start below the stage, was at ${start.y}`);
  assert.ok(end.y + end.height <= 12, `Should finish above the stage, ended at ${end.y + end.height}`);
  await context.close();
});

test('swapped letters stay put, sit on eligible letters, and never under a sticker', { timeout: 15000 }, async () => {
  const { context, page } = await openPage();
  await page.waitForFunction(() => document.querySelectorAll('.hero-title .ltr.is-alt').length > 0);
  const snapshot = () => page.evaluate(() => [...document.querySelectorAll('.hero-title .ltr')].map((cell) => cell.classList.contains('is-alt')).join());
  const first = await snapshot();
  await page.waitForTimeout(1600);
  assert.equal(await snapshot(), first, 'Letters must not cycle on a timer');
  const state = await page.evaluate(() => {
    const lines = [...document.querySelectorAll('.hero-title .line-vis')].map((line) => line.querySelectorAll('.ltr.is-alt').length);
    const chars = [...document.querySelectorAll('.hero-title .ltr.is-alt')].map((cell) => cell.dataset.char);
    return { lines, chars, under: document.querySelectorAll('.ltr.is-alt.ltr-over').length };
  });
  assert.ok(state.lines.every((count) => count <= 1), `One swap per line, got ${state.lines}`);
  assert.equal(state.under, 0);
  for (const char of state.chars) assert.match(char, /[A-HKLN-VX-Z]/, `${char} should not be swapped`);
  await context.close();
});

test('anchor links land with the heading clear of the fixed navigation', async () => {
  const { context, page } = await openPage();
  for (const [link, heading] of [['.dock a[href="#projects"]', '.fp--finly .fp-kicker'], ['.dock a[href="#contact"]', '#contact .panel-title']]) {
    await page.locator(link).click();
    await page.waitForFunction((selector) => {
      const top = document.querySelector(selector).getBoundingClientRect().top;
      const dock = document.querySelector('.dock').getBoundingClientRect().bottom;
      return top >= dock && top < window.innerHeight;
    }, heading, { timeout: 5000 });
    await page.mouse.move(0, 400);
  }
  await context.close();
});

test('floor text meets contrast minimums on its own colour', async () => {
  const { context, page } = await openPage({ reducedMotion: 'reduce' });
  const pairs = await page.evaluate(() => [...document.querySelectorAll('.fp')].map((floor) => {
    const styles = getComputedStyle(floor);
    return { bg: styles.backgroundColor, text: styles.color, ink: getComputedStyle(floor.querySelector('.fp-kicker')).color };
  }));
  assert.equal(pairs.length, 4);
  for (const { bg, text, ink } of pairs) {
    assert.ok(contrast(parseColor(text), parseColor(bg)) >= 4.5, `Body ${text} on ${bg}`);
    assert.ok(contrast(parseColor(ink), parseColor(bg)) >= 4.5, `Kicker ${ink} on ${bg}`);
  }
  await context.close();
});

test('menu opens in stages, is keyboard-hidden when closed, closes on Escape and restores focus', async () => {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const { context, page } = await openPage({ viewport });
    const toggle = page.locator('.menu-toggle');
    const firstLink = page.locator('.bar-panel a').first();
    assert.equal(await firstLink.evaluate((el) => getComputedStyle(el).visibility), 'hidden');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    // Rows wait for the panel, then arrive one after another.
    const early = await page.evaluate(() => getComputedStyle(document.querySelector('.mi')).opacity);
    assert.ok(Number(early) < 0.5, `Rows should still be hidden just after opening, opacity was ${early}`);
    await page.waitForFunction(() => {
      const rows = [...document.querySelectorAll('.mi')];
      return rows.every((row) => getComputedStyle(row).opacity === '1');
    }, null, { timeout: 2500 });
    assert.equal(await page.evaluate(() => document.querySelector('.bar-panel').style.height), 'auto');
    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('menu-toggle')), true);
    await context.close();
  }
});

test('menu rows flip on hover and sections open as a one-at-a-time accordion', async () => {
  const { context, page } = await openPage();
  await page.locator('.menu-toggle').click();
  await page.waitForFunction(() => document.querySelector('.bar-panel').style.height === 'auto');
  const row = page.locator('.mi-row[aria-controls="m-work"]');
  await page.locator('a.mi-row[href="#about"]').hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('a.mi-row[href="#about"] .mi-box')).transform !== 'none'
    && Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('a.mi-row[href="#about"] .mi-box')).transform).m22) < 0.1);
  await row.click();
  assert.equal(await row.getAttribute('aria-expanded'), 'true');
  await page.waitForFunction(() => document.getElementById('m-work').getBoundingClientRect().height > 60);
  const resume = page.locator('.mi-row[aria-controls="m-resume"]');
  await resume.click();
  assert.equal(await row.getAttribute('aria-expanded'), 'false', 'Opening one section closes the other');
  assert.equal(await resume.getAttribute('aria-expanded'), 'true');
  await page.locator('#m-resume a').first().waitFor({ state: 'visible' });
  assert.equal(await page.locator('#m-resume a').first().getAttribute('href'), 'resume.pdf');
  await context.close();
});

test('reduced motion gets final states with nothing animating', { timeout: 10000 }, async () => {
  const { context, page } = await openPage({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => window.PortfolioMotion);
  const state = await page.evaluate(() => ({
    ready: document.documentElement.classList.contains('motion-ready'),
    lenis: Boolean(window.lenis),
    running: document.getAnimations().filter((animation) => animation.playState === 'running').length,
    letters: document.querySelectorAll('h1 .ltr').length,
    media: getComputedStyle(document.querySelector('.fp-media')).position,
  }));
  assert.equal(state.ready, false);
  assert.equal(state.lenis, false);
  assert.equal(state.running, 0);
  assert.ok(state.letters > 0, 'Stickers still sit on the type');
  assert.equal(state.media, 'relative');
  const visible = await page.locator('.ltr-sticker').first().evaluate((el) => getComputedStyle(el).visibility);
  assert.equal(visible, 'visible');
  await context.close();
});

test('skill tabs filter tickets and report their pressed state', async () => {
  const { context, page } = await openPage();
  const shown = () => page.locator('.ticket:visible').count();
  assert.equal(await shown(), 5);
  await page.locator('.tab[data-cat="ml"]').click();
  assert.equal(await page.locator('.tab[data-cat="ml"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.tab[data-cat="all"]').getAttribute('aria-pressed'), 'false');
  assert.equal(await shown(), 1);
  assert.equal(await page.locator('.ticket:visible').getAttribute('data-cat'), 'ml');
  await page.locator('.tab[data-cat="all"]').click();
  assert.equal(await shown(), 5);
  const meters = await page.locator('.ticket meter').count();
  assert.equal(meters, 15);
  await context.close();
});

test('education cards fill with colour and bring in their marquee on hover', async () => {
  const { context, page } = await openPage();
  const card = page.locator('.edu').first();
  const poster = card.locator('.edu-poster');
  await jumpTo(page, await docTop(page, '#education'));
  const before = await poster.evaluate((el) => getComputedStyle(el).backgroundColor);
  await poster.hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.edu .mq')).opacity === '1');
  const background = await poster.evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.notEqual(background, before);
  assert.equal(parseColor(background).join(), parseColor('#ff3d8b').join());
  await context.close();
});

test('every slot on the page has its own illustration', async () => {
  const { context, page } = await openPage();
  const ids = await page.evaluate(() => [...document.querySelectorAll('main use[href*="stickers.svg"], footer use[href*="stickers.svg"]')]
    .map((use) => use.getAttribute('href').split('#')[1]));
  // Laurels are a mirrored pair; everything else appears once.
  const counts = {};
  ids.filter((id) => id !== 's-laurel').forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
  const repeated = Object.entries(counts).filter(([, n]) => n > 1);
  assert.deepEqual(repeated, [], `Repeated stickers: ${JSON.stringify(repeated)}`);
  assert.ok(ids.length >= 26, `Expected at least 26 placed illustrations, found ${ids.length}`);
  await context.close();
});

test('the reel video is muted, loops, waits until it is near, and stays still for reduced motion', { timeout: 20000 }, async () => {
  const file = path.join(root, 'assets', 'videos', 'reel.mp4');
  assert.ok(fs.existsSync(file));
  assert.ok(fs.existsSync(path.join(root, 'assets', 'images', 'reel-poster.jpg')));

  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  const state = () => page.locator('[data-reel-video]').evaluate((v) => ({ muted: v.muted, loop: v.loop, inline: v.playsInline, paused: v.paused, time: v.currentTime, audio: v.mozHasAudio ?? v.webkitAudioDecodedByteCount ?? 0 }));
  const atTop = await state();
  assert.ok(atTop.muted && atTop.loop && atTop.inline);
  await jumpTo(page, await docTop(page, '[data-reel]') - 200);
  await page.waitForFunction(() => { const v = document.querySelector('[data-reel-video]'); return !v.paused && v.currentTime > 0.2; }, null, { timeout: 8000 });
  assert.equal((await state()).audio, 0, 'The encoded reel should have no audio');
  await jumpTo(page, await docTop(page, '#skills'));
  await page.waitForFunction(() => document.querySelector('[data-reel-video]').paused, null, { timeout: 3000 });
  await context.close();

  const reduced = await openPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await reduced.page.locator('[data-reel-video]').scrollIntoViewIfNeeded();
  await reduced.page.waitForTimeout(500);
  assert.equal(await reduced.page.locator('[data-reel-video]').evaluate((v) => v.paused && v.readyState === 0), true);
  await reduced.context.close();
});

test('the crest ribbons slide out with scroll and shake, while its body stays still', { timeout: 15000 }, async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  const ribbons = () => page.evaluate(() => [...document.querySelectorAll('[data-crest-ribbon]')].map((el) => ({
    x: Math.abs(parseFloat(el.firstElementChild.getAttribute('transform')?.match(/translate\(([-\d.]+)/)?.[1])),
    rotate: el.getAttribute('transform'),
  })));
  await page.waitForFunction(() => document.querySelector('[data-crest-ribbon] g')?.getAttribute('transform'));
  const start = await ribbons();
  assert.ok(start.every(({ x }) => x > 600), `Ribbons should start tucked in, got ${start.map(({ x }) => x)}`);

  const top = await page.evaluate(() => document.querySelector('.crest').getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => window.scrollTo(0, y), top - 200);
  await page.waitForFunction(() => {
    const x = parseFloat(document.querySelector('[data-crest-ribbon] g').getAttribute('transform').match(/translate\(([-\d.]+)/)[1]);
    return x < 300;
  });

  const angles = new Set();
  for (let i = 0; i < 12; i += 1) {
    for (const { rotate } of await ribbons()) if (rotate) angles.add(rotate.match(/rotate\(([-\d.]+)/)[1]);
    await page.waitForTimeout(120);
  }
  assert.ok(angles.size > 1, 'Ribbons should shake');
  for (const angle of angles) assert.ok(['-0.5', '0', '0.5'].includes(angle), `Unexpected angle ${angle}`);

  const body = await page.locator('.crest > use').getAttribute('transform');
  assert.equal(body, null, 'The body must not move with the ribbons');
  await context.close();
});

test('the bio is a bust breaking out of its card, with the name split around it', async () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    const { context, page } = await openPage({ viewport });
    const top = await page.evaluate(() => document.querySelector('.bio').getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => window.scrollTo(0, y), top - viewport.height * 0.3);
    await page.waitForFunction(() => document.querySelector('.bio-title').classList.contains('revealed'));
    await page.waitForFunction(() => document.querySelector('.bio-print img').complete);
    const layout = await page.evaluate(() => {
      const box = (s) => document.querySelector(s).getBoundingClientRect();
      return {
        bio: box('.bio').toJSON(),
        print: box('.bio-print').toJSON(),
        lines: [...document.querySelectorAll('.bio-title .line-vis')].map((line) => {
          const cells = [...line.children].map((cell) => cell.getBoundingClientRect());
          return { left: Math.min(...cells.map((c) => c.left)), right: Math.max(...cells.map((c) => c.right)) };
        }),
        spoken: document.querySelector('.bio-title').getAttribute('aria-label'),
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    assert.ok(layout.print.top < layout.bio.top, `The bust should break out of the card at ${viewport.width}px`);
    for (const line of layout.lines) {
      assert.ok(line.left >= layout.bio.left && line.right <= layout.bio.right, `The name should stay inside the card at ${viewport.width}px`);
    }
    assert.equal(layout.spoken, 'Alexander, Moscow');
    assert.equal(layout.overflow, 0);
    await context.close();
  }
});

test('the bio always swaps the X, and project files keep their spec card in view', { timeout: 15000 }, async () => {
  for (let load = 0; load < 3; load += 1) {
    const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
    const swapped = await page.evaluate(() => [...document.querySelectorAll('.bio-title .is-alt')].map((cell) => cell.dataset.char));
    assert.deepEqual(swapped, ['X']);
    await context.close();
  }
  const { context, page } = await openPage({ viewport: { width: 1600, height: 900 } });
  const place = await page.evaluate(async () => {
    const file = document.querySelector('#case-finly');
    window.scrollTo(0, file.getBoundingClientRect().top + scrollY + 200);
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { spec: file.querySelector('.case-spec').getBoundingClientRect().top, panel: file.querySelector('.case-file').getBoundingClientRect().top };
  });
  assert.ok(place.spec > place.panel + 100, `The spec card should stay in view, got ${JSON.stringify(place)}`);
  await context.close();
});

test('MAI Tablets links to both of its repositories', async () => {
  const { context, page } = await openPage();
  const links = await page.locator('#case-tablets .case-actions a').evaluateAll((items) => items.map((a) => [a.textContent.trim(), a.href, a.rel]));
  assert.deepEqual(links.map(([, href]) => href), ['https://github.com/programx-dev/MAI-tablets', 'https://github.com/programx-dev/MAI-tablets-client']);
  for (const [, , rel] of links) assert.match(rel, /noopener/);
  await context.close();
});

test('the crest and quote hold still together, then the bio fades in over them', { timeout: 60000 }, async () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 640 }, { width: 390, height: 844 }]) {
    const { context, page } = await openPage({ viewport });
    const read = () => page.evaluate(() => {
      const quote = document.querySelector('.scrub');
      return {
        share: document.querySelectorAll('.scrub .ch-s.on').length / document.querySelectorAll('.scrub .ch-s').length,
        y: scrollY,
        top: quote.getBoundingClientRect().top,
        crest: document.querySelector('.crest').getBoundingClientRect().top,
        quoteBottom: quote.getBoundingClientRect().bottom,
        vh: innerHeight,
        ribbon: Math.abs(parseFloat(document.querySelector('[data-crest-ribbon] g').getAttribute('transform').match(/translate\(([-\d.]+)/)[1])),
        text: Number(getComputedStyle(document.querySelector('.about-stack')).opacity),
        bio: Number(getComputedStyle(document.querySelector('.bio')).opacity),
        dock: document.querySelector('.dock').getBoundingClientRect().bottom,
        bar: document.querySelector('.bar-row').getBoundingClientRect().bottom,
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    const start = await page.evaluate(() => document.querySelector('.scrub').getBoundingClientRect().top + scrollY);
    assert.equal((await read()).bio, 0, 'The bio is hidden to begin with');
    const states = [];
    for (let y = start - viewport.height; y < start + viewport.height * 2.4; y += 40) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await page.waitForTimeout(170);
      states.push(await read());
    }
    const done = states.find((state) => state.share === 1);
    assert.ok(done, 'The quote must finish');
    assert.equal(done.bio, 0, 'The bio must not have started when the quote finishes');
    const barLine = viewport.width > 640 ? done.dock : done.bar;
    assert.ok(done.crest >= barLine - 1, `The crest should sit clear of the bar, top ${done.crest}, bar ${barLine}`);
    assert.ok(done.quoteBottom <= done.vh, `The quote should fit on screen, bottom ${done.quoteBottom}`);
    assert.ok(done.ribbon < 1, `The ribbons should be fully out while holding, still ${done.ribbon} in`);
    const held = states.filter((state) => state.share === 1 && state.text === 1);
    assert.ok(held.at(-1).y - done.y >= viewport.height * 0.15, `The finished text should be held for a while, got ${held.at(-1).y - done.y}px`);
    const tops = held.map((state) => state.top);
    assert.ok(Math.max(...tops) - Math.min(...tops) < 2, `The text must not move while held, moved ${Math.max(...tops) - Math.min(...tops)}px`);
    const crests = held.map((state) => state.crest);
    assert.ok(Math.max(...crests) - Math.min(...crests) < 2, `The crest must not move while held, moved ${Math.max(...crests) - Math.min(...crests)}px`);
    // The bio fades, rather than jumping, and is fully there by the end.
    const fading = states.filter((state) => state.bio > 0 && state.bio < 1);
    assert.ok(fading.length >= 4, `The bio should fade over several steps, got ${fading.length}`);
    assert.equal(states.at(-1).bio, 1);
    assert.equal(states.at(-1).text, 0, 'The text has gone once the bio has arrived');
    assert.equal(states.at(-1).overflow, 0);
    await context.close();
  }
});

test('a parked button flips in front of the top bar', async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  await page.evaluate(() => window.scrollTo(0, 1600));
  await page.waitForFunction(() => {
    const bar = document.querySelector('.bar-row').getBoundingClientRect();
    return document.querySelector('.dock').getBoundingClientRect().top - bar.bottom < 2;
  });
  const order = () => page.evaluate(() => [getComputedStyle(document.querySelector('.dock')).zIndex, getComputedStyle(document.querySelector('.bar')).zIndex].map(Number));
  await page.locator('.dock .flip').first().hover();
  const [dock, bar] = await order();
  assert.ok(dock > bar, `Dock ${dock} should sit above bar ${bar} while a button flips`);
  await page.mouse.move(5, 500);
  const [restDock, restBar] = await order();
  assert.ok(restDock < restBar, 'The open menu must still cover the dock at rest');
  await context.close();
});

test('the whole video frame is shown, fading into the page, with the crest only on the fade', async () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }]) {
    const { context, page } = await openPage({ viewport });
    const layout = await page.evaluate(() => {
      const box = (s) => document.querySelector(s).getBoundingClientRect();
      const reel = box('.reel');
      const fade = getComputedStyle(document.querySelector('.reel'), '::after');
      const video = getComputedStyle(document.querySelector('[data-reel-video]'));
      return { reelBottom: reel.bottom, reelH: reel.height, aboutTop: box('.about').top, crestTop: box('.crest').top, w: box('[data-reel-video]').width, h: box('[data-reel-video]').height, scale: video.scale, fadeH: parseFloat(fade.height), fadeImg: fade.backgroundImage };
    });
    assert.ok(Math.abs(layout.w / layout.h - 16 / 9) < 0.01, `Frame was ${layout.w}x${layout.h}`);
    assert.equal(layout.w, viewport.width, 'The video should span the full width');
    assert.equal(layout.scale, 'none', 'The video should not be zoomed');
    assert.ok(Math.abs(layout.aboutTop - layout.reelBottom) < 1, 'The next section should start below the video');
    assert.ok(Math.abs(layout.fadeH / layout.reelH - 0.5) < 0.01, 'The fade should cover the bottom half');
    assert.match(layout.fadeImg, /linear-gradient/);
    const overlap = (layout.reelBottom - layout.crestTop) / layout.reelH;
    assert.ok(overlap > 0 && overlap < 0.25, `The crest should sit only on the dark end of the fade, overlap was ${overlap}`);
    await context.close();
  }
});

test('the site is English only, with a logo where the language button was', async () => {
  const { context, page } = await openPage();
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  assert.equal(await page.locator('.lang-toggle').count(), 0);
  assert.equal(await page.locator('[data-i18n]').count(), 0);
  const logo = page.locator('.bar-row .bar-logo svg');
  assert.ok(await logo.isVisible());
  const box = await logo.boundingBox();
  assert.ok(box.width > 15 && box.height > 15, 'The logo should render at a visible size');
  // Only the schema.org alternate spelling of the name may contain Cyrillic.
  for (const file of ['index.html', '404.html', 'js/ui.js', 'js/motion.js', 'manifest.json']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8').replace('"alternateName":"Александр Македонский"', '');
    assert.doesNotMatch(source, /[\u0400-\u04FF]/, `${file} still has Cyrillic text`);
  }
  assert.ok(!fs.existsSync(path.join(root, 'js', 'translations.js')));
  assert.ok(!fs.existsSync(path.join(root, 'js', 'lang.js')));
  await context.close();
});

test('contact fields have persistent labels and submitting shows a state', async () => {
  const { context, page } = await openPage();
  for (const id of ['contact-name', 'contact-email', 'contact-message']) {
    assert.equal(await page.locator(`label[for="${id}"]`).count(), 1, `${id} needs a label`);
  }
  await page.locator('#contact-name').fill('Test');
  await page.locator('#contact-email').fill('test@example.com');
  await page.locator('#contact-message').fill('Hello');
  await page.evaluate(() => document.getElementById('contact-form').requestSubmit());
  assert.equal(await page.locator('#contact-form').getAttribute('data-submitting'), 'true');
  assert.equal(await page.locator('#contact-form [data-submit-label]').first().textContent(), 'Opening email...');
  await context.close();
});

test('the site opens black whatever the OS prefers, and a light choice persists', async () => {
  const { context, page } = await openPage();
  await page.waitForFunction(() => document.body.classList.contains('dark-theme'));
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(11, 11, 11)');
  await page.evaluate(() => { document.querySelector('.theme-toggle').click(); });
  await page.waitForFunction(() => !document.body.classList.contains('dark-theme'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('motion-ready'));
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(255, 255, 255)');
  const ink = await page.evaluate(() => getComputedStyle(document.querySelector('.hero-title')).color);
  assert.ok(contrast(parseColor(ink), [255, 255, 255]) >= 7);
  await context.close();
});

test('buttons flip toward the visitor on hover and keyboard focus, on every page', async () => {
  for (const [pathName, selector] of [['/', '.dock .flip'], ['/404.html', '.lost-actions .flip']]) {
    const { context, page } = await openPage({ path: pathName === '/' ? undefined : pathName });
    const flip = page.locator(selector).first();
    const on = () => flip.evaluate((el) => getComputedStyle(el).getPropertyValue('--on').trim());
    assert.equal(await on(), '');
    await flip.hover();
    assert.equal(await on(), '1');
    await page.mouse.move(0, 0);
    assert.equal(await on(), '');
    // Tab to a flip button: :focus-visible only matches keyboard focus.
    let focused = false;
    for (let press = 0; press < 12 && !focused; press += 1) {
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => document.activeElement?.classList.contains('flip') ?? false);
    }
    assert.ok(focused, 'A flip button should be reachable by keyboard');
    assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).getPropertyValue('--on').trim()), '1');
    await context.close();
  }
});

test('the 404 page is in English and links home', async () => {
  const { context, page } = await openPage({ path: '/404.html' });
  assert.equal(await page.locator('.lost-actions a').getAttribute('href'), '/');
  assert.equal(await page.locator('h1').textContent(), 'Page Not Found');
  assert.equal(await page.locator('.lang-toggle').count(), 0);
  await context.close();
});

test('the GitHub panel shows the generated data, not invented numbers', async () => {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'data', 'github.json'), 'utf8'));
  const { context, page } = await openPage();
  await page.waitForFunction(() => document.querySelectorAll('.git-cell').length > 0);
  for (const key of ['publicRepos', 'commitsThisYear', 'activeDaysPastYear', 'longestStreakPastYear']) {
    assert.equal(await page.locator(`[data-git="${key}"]`).textContent(), String(data[key]), key);
  }
  const days = data.weeks.flat();
  assert.equal(await page.locator('.git-cell').count(), days.length);
  assert.equal(days.filter((day) => day.count > 0).length, data.activeDaysPastYear);
  assert.match(await page.locator('.git-info').textContent(), /GitHub API/);
  assert.doesNotMatch(await page.locator('#github').textContent(), /Illustrative|Randomized/i);
  assert.equal(await page.locator('#git-langs li').count(), 4);
  assert.equal(await page.locator('#git-cells').evaluate((el) => el.classList.contains('in')), false);
  await jumpTo(page, await docTop(page, '#github'));
  await page.waitForFunction(() => document.getElementById('git-cells').classList.contains('in'));
  await context.close();
});

test('a tour of the page produces no script errors', { timeout: 20000 }, async () => {
  const errors = [];
  const { context, page } = await openPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 900) {
    await jumpTo(page, y);
    await page.waitForTimeout(60);
  }
  await page.locator('.menu-toggle').click();
  await page.keyboard.press('Escape');
  await page.locator('.tab[data-cat="ops"]').click();
  await page.waitForTimeout(800);
  assert.deepEqual(errors, []);
  await context.close();
});
