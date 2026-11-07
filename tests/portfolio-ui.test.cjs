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

test('each floor shape shows its own photo', async () => {
  const { context, page } = await openPage();
  const photos = await page.evaluate(() => [...document.querySelectorAll('.fp-media image')].map((image) => image.getAttribute('href')));
  assert.equal(photos.length, 4);
  assert.equal(new Set(photos).size, 4, 'No floor repeats a photo');
  for (const photo of photos) {
    const response = await page.request.get(`${origin}${photo}`);
    assert.ok(response.ok(), `${photo} should load`);
  }
  await context.close();
});

test('essential content stays visible without JavaScript', async () => {
  const { context, page } = await openPage({ javaScriptEnabled: false });
  for (const selector of ['h1', '.creed .scrub', '.fp-title', '.case', '.tool', '.edu', '#contact-form', '.foot-word']) {
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

test('tool drawers open one at a time and report their state', async () => {
  const { context, page } = await openPage();
  const expanded = () => page.locator('.tool-spine[aria-expanded="true"]').count();
  assert.equal(await page.locator('.tool').count(), 5);
  assert.equal(await page.locator('.tool-list > li').count(), 16);
  assert.equal(await expanded(), 1);
  await page.locator('.tool[data-cat="ml"] .tool-spine').click();
  assert.equal(await expanded(), 1);
  assert.equal(await page.locator('.tool[data-cat="ml"] .tool-spine').getAttribute('aria-expanded'), 'true');
  assert.ok(await page.locator('#tool-ml').isVisible());
  await page.waitForTimeout(800);
  assert.equal(await page.locator('#tool-lang').isVisible(), false);
  await context.close();
});

test('tools show where they were used rather than scores, and tags reach real case studies', async () => {
  const { context, page } = await openPage();
  const state = await page.evaluate(() => ({
    scores: document.querySelectorAll('.tool meter, .tool .mq').length,
    tags: [...document.querySelectorAll('.tool-tag')].map((tag) => Boolean(document.querySelector(tag.getAttribute('href')))),
    devops: [...document.querySelectorAll('.tool[data-cat="ops"] .tool-name')].map((name) => name.textContent),
    frontend: [...document.querySelectorAll('.tool[data-cat="fe"] .tool-name')].map((name) => name.textContent),
  }));
  assert.equal(state.scores, 0);
  assert.ok(state.tags.length > 0 && state.tags.every(Boolean), 'Every tag links to a case study on the page');
  assert.ok(!state.devops.includes('React Native') && state.devops.includes('GitHub Actions'));
  assert.ok(state.frontend.includes('React Native'));
  await context.close();
});

test('tool drawers stack on a phone and stay on screen', async () => {
  const { context, page } = await openPage({ viewport: { width: 390, height: 844 } });
  await page.locator('.tool[data-cat="back"] .tool-spine').click();
  assert.ok(await page.locator('#tool-back').isVisible());
  assert.equal(await page.locator('#tool-lang').isVisible(), false);
  const right = await page.locator('#tool-back').evaluate((el) => el.getBoundingClientRect().right);
  assert.ok(right <= 390, `The open drawer ran to ${right}`);
  await context.close();
});

test('education climbs as a staircase from the first study to today', async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  const steps = await page.locator('.edu').evaluateAll((items) => items.map((el) => {
    const box = el.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, colour: getComputedStyle(el).backgroundColor, degree: el.querySelector('.edu-degree').textContent };
  }));
  assert.equal(steps.length, 3);
  assert.match(steps[0].degree, /Pre-University/);
  assert.match(steps[2].degree, /Applied Mathematics/);
  assert.ok(steps[0].top > steps[1].top && steps[1].top > steps[2].top, 'Each step rises above the last');
  assert.ok(Math.abs(steps[0].bottom - steps[2].bottom) <= 1, 'The steps share a floor');
  assert.equal(new Set(steps.map((step) => step.colour)).size, 3, 'Each step has its own colour at rest');
  assert.equal(await page.locator('.mq').count(), 0);
  await context.close();
});

test('case files, tools and education follow the scroll position in both directions', { timeout: 20000 }, async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  const read = () => page.evaluate(() => ({
    panel: getComputedStyle(document.querySelector('.case-file')).transform,
    spine: getComputedStyle(document.querySelector('.tool:nth-child(3)')).opacity,
    shelf: document.querySelector('.tools').style.getPropertyValue('--shelf'),
    step: getComputedStyle(document.querySelector('.edu')).transform,
    art: getComputedStyle(document.querySelector('.edu-art')).opacity,
  }));
  const settle = () => page.waitForTimeout(900);
  const before = await read();
  assert.match(before.panel, /^matrix\(0\.3,/, 'The panel waits squashed sideways');
  assert.match(before.step, /^matrix\(1, 0, 0, 0\.3,/, 'The steps wait squashed');
  assert.equal(before.spine, '0');
  assert.equal(before.art, '0');

  const middle = await docTop(page, '.tools') - 900 * 0.6;
  await jumpTo(page, middle);
  await settle();
  const partway = await read();
  assert.ok(Number(partway.spine) >= 0 && Number(partway.shelf) < 1, `Tools should be mid-way, got ${JSON.stringify(partway)}`);

  await jumpTo(page, await docTop(page, '.edu-stairs'));
  await settle();
  const after = await read();
  assert.equal(after.panel, 'none', 'Finished entrances leave the page styles in charge');
  assert.equal(after.spine, '1');
  assert.equal(after.shelf, '1.0000');
  assert.equal(after.step, 'none');
  assert.equal(after.art, '1');

  await jumpTo(page, middle);
  await settle();
  assert.deepEqual(await read(), partway, 'Scrolling back returns to the same frame');
  await jumpTo(page, 0);
  await settle();
  assert.deepEqual(await read(), before, 'Scrolling all the way up plays them fully in reverse');
  await context.close();
});

test('project cards move into place with the scroll instead of snapping on and off', { timeout: 30000 }, async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  for (const selector of ['#case-finly .feat', '#case-recognition .trophies li']) {
    const top = await docTop(page, selector);
    const seen = [];
    for (const fraction of [1.05, 0.98, 0.92, 0.86, 0.8, 0.5]) {
      await jumpTo(page, top - 900 * fraction);
      await page.waitForTimeout(900);
      seen.push(await page.locator(selector).first().evaluate((el) => {
        const style = getComputedStyle(el);
        return `${style.opacity}|${style.transform}`;
      }));
    }
    assert.ok(new Set(seen).size >= 4, `${selector} should pass through in-between frames, got ${seen.join(' ; ')}`);
    assert.equal(seen[seen.length - 1], '1|none', `${selector} should finish in place`);
    await jumpTo(page, top - 900 * 0.92);
    await page.waitForTimeout(900);
    const back = await page.locator(selector).first().evaluate((el) => `${getComputedStyle(el).opacity}|${getComputedStyle(el).transform}`);
    assert.equal(back, seen[2], `${selector} should reverse to the same frame`);
  }
  await context.close();
});

test('the stairs start as the first step comes on screen and finish in view', async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  const box = await page.locator('.edu-stairs').evaluate((el) => ({ top: el.getBoundingClientRect().top + scrollY, height: el.offsetHeight }));
  const floor = box.top + box.height;
  const steps = () => page.locator('.edu').evaluateAll((items) => items.map((el) => getComputedStyle(el).opacity));
  await jumpTo(page, floor - 900 * 1.25);
  await page.waitForTimeout(900);
  assert.deepEqual(await steps(), ['0', '0', '0'], 'Nothing shows before the first step reaches the screen');
  await jumpTo(page, floor - 900 * 1.08);
  await page.waitForTimeout(900);
  assert.equal((await steps())[0], '1', 'The first step is rising while its top is on screen');
  await jumpTo(page, floor - 900 * 0.76);
  await page.waitForTimeout(900);
  const finished = await page.locator('.edu').evaluateAll((items) => items.map((el) => getComputedStyle(el).transform));
  assert.deepEqual(finished, ['none', 'none', 'none'], 'All three steps finish with the staircase on screen');
  await context.close();
});

test('big elements spread their motion over many small frames instead of jumping', { timeout: 20000 }, async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  await page.mouse.move(1420, 500);
  const box = await page.locator('.edu-stairs').evaluate((el) => ({ top: el.getBoundingClientRect().top + scrollY, height: el.offsetHeight }));
  await jumpTo(page, box.top + box.height - 900 * 1.3);
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const step = document.querySelector('.edu:nth-child(3)');
    window.recording = [];
    const tick = () => {
      if (!window.recording) return;
      window.recording.push({ top: step.getBoundingClientRect().top, y: window.scrollY });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  for (let notch = 0; notch < 5; notch += 1) {
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(140);
  }
  await page.waitForTimeout(1000);
  const frames = await page.evaluate(() => { const list = window.recording; window.recording = null; return list; });
  const moves = frames.slice(1).map((frame, index) => Math.abs(frame.top - frames[index].top + frame.y - frames[index].y)).filter((move) => move > 0.05);
  assert.ok(moves.length >= 25, `The step moved over only ${moves.length} frames`);
  assert.ok(Math.max(...moves) <= 60, `The step jumped ${Math.max(...moves).toFixed(0)}px in one frame`);
  await context.close();
});

test('a drawer can still be opened by hand once the shelf has finished entering', async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  await jumpTo(page, await docTop(page, '.tools') - 100);
  await page.waitForTimeout(900);
  await page.locator('.tool[data-cat="back"] .tool-spine').click();
  await page.waitForTimeout(900);
  const width = await page.locator('.tool[data-cat="back"]').evaluate((el) => el.getBoundingClientRect().width);
  const first = await page.locator('.tool[data-cat="lang"]').evaluate((el) => el.getBoundingClientRect().width);
  assert.ok(width > 500 && first < 120, `Backend should be open: ${width} against ${first}`);
  await context.close();
});

test('a resting pointer opens no drawer as the page scrolls, but moving it does', async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  const openNow = () => page.locator('.tool.open').getAttribute('data-cat');
  await page.mouse.move(720, 500);
  const top = await docTop(page, '.tools');
  for (let y = top - 900; y <= top - 100; y += 100) {
    await jumpTo(page, y);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(900);
  assert.equal(await openNow(), 'lang', 'Scrolling alone leaves the first drawer open');
  const backend = await page.locator('.tool[data-cat="back"]').boundingBox();
  await page.mouse.move(backend.x + backend.width / 2, backend.y + 300, { steps: 4 });
  await page.waitForTimeout(200);
  assert.equal(await openNow(), 'back');
  await context.close();
});

test('the GitHub panel appears without a GPU layer for every cell', async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  await page.waitForFunction(() => document.querySelectorAll('.git-cell').length > 0);
  const client = await context.newCDPSession(page);
  await client.send('DOM.enable');
  let layers = 0;
  let peak = 0;
  client.on('LayerTree.layerTreeDidChange', (event) => {
    if (!event.layers) return;
    layers = event.layers.length;
    peak = Math.max(peak, layers);
  });
  await client.send('LayerTree.enable');
  await jumpTo(page, await docTop(page, '#github') - 900 * 1.3);
  await page.waitForTimeout(800);
  const before = layers;
  peak = layers;
  await jumpTo(page, await docTop(page, '#github') - 300);
  await page.waitForFunction(() => document.getElementById('git-cells').classList.contains('in'));
  await page.waitForTimeout(700);
  assert.ok(peak - before < 30, `Layers went from ${before} to ${peak}`);
  await context.close();
});

test('the contact finale enters with the scroll and finishes in place', { timeout: 20000 }, async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  const read = () => page.evaluate(() => ({
    panel: getComputedStyle(document.querySelector('.panel--pink')).transform,
    plane: getComputedStyle(document.querySelector('.contact-title .ltr-sticker')).opacity,
    letter: getComputedStyle(document.querySelector('.contact-title .ltr-in')).transform,
    row: getComputedStyle(document.querySelector('.ch')).opacity,
    size: parseFloat(getComputedStyle(document.querySelector('.contact-title')).fontSize),
  }));
  const before = await read();
  assert.match(before.panel, /^matrix\(1, 0, 0, 0\.3,/);
  assert.equal(before.plane, '0');
  assert.equal(before.letter, 'none', 'The title letters do not animate on their own');
  assert.equal(before.row, '1', 'The rows do not animate on their own');
  assert.ok(before.size > 150, `The title should be giant, got ${before.size}px`);
  await jumpTo(page, await page.evaluate(() => document.documentElement.scrollHeight));
  await page.waitForTimeout(1000);
  const after = await read();
  assert.deepEqual({ panel: after.panel, plane: after.plane }, { panel: 'none', plane: '1' });
  await jumpTo(page, 0);
  await page.waitForTimeout(1000);
  assert.deepEqual(await read(), before, 'Scrolling back plays it in reverse');
  await context.close();
});

test('the footer ends on bars that stretch past the end of the page and spring back', { timeout: 20000 }, async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  const heights = () => page.locator('.foot-bars i').evaluateAll((bars) => bars.map((bar) => Math.round(bar.getBoundingClientRect().height)));
  assert.equal((await heights()).length, 7);
  const end = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await jumpTo(page, end - 160);
  await page.waitForTimeout(150);
  const stretched = await heights();
  assert.ok(stretched[3] > stretched[1] && stretched[1] > stretched[0], `The middle bar should be tallest: ${stretched}`);
  assert.equal(await page.locator('.foot-bars').evaluate((el) => getComputedStyle(el).position), 'fixed');
  const barBottom = await page.locator('.foot-bars').evaluate((el) => el.getBoundingClientRect().bottom);
  assert.equal(Math.round(barBottom), 900, 'Pinned to the bottom of the screen');
  await page.mouse.wheel(0, 40);
  await page.waitForTimeout(1500);
  const rest = await heights();
  assert.ok(rest.every((height) => height <= 14), `The bars should spring back: ${rest}`);
  const scrolled = await page.evaluate(() => scrollY + innerHeight - document.querySelector('.foot-space').getBoundingClientRect().top - scrollY);
  assert.ok(scrolled <= 2, 'The page returns to the top of the stretch room');
  await context.close();
});

test('reduced motion leaves the bars still with no extra scroll room', async () => {
  const { context, page } = await openPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  assert.equal(await page.locator('.foot-space').isVisible(), false);
  assert.equal(await page.locator('.foot-bars i').first().isVisible(), true);
  await context.close();
});

test('contact rows turn to a coloured face on hover, like the menu rows', async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  await jumpTo(page, await page.evaluate(() => document.querySelector('.channels').getBoundingClientRect().top + scrollY - 300));
  await page.waitForTimeout(900);
  for (const href of ['mailto:aleximlord@gmail.com', 'tel:+79255053027']) {
    await page.locator(`.ch[href="${href}"]`).hover();
    await page.waitForFunction((link) => {
      const box = document.querySelector(`.ch[href="${link}"] .ch-box`);
      return Math.abs(new DOMMatrix(getComputedStyle(box).transform).m22) < 0.1;
    }, href);
  }
  await context.close();
});

test('contact rows fit on small phones', async () => {
  for (const width of [320, 390]) {
    const { context, page } = await openPage({ viewport: { width, height: 800 } });
    const overflowing = await page.locator('.ch-face').evaluateAll((faces) => faces.filter((face) => face.scrollWidth > face.clientWidth + 1).map((face) => face.textContent));
    assert.deepEqual(overflowing, [], `${width}px`);
    await context.close();
  }
});

test('the big drawings keep moving while the page scrolls', async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  await page.evaluate(() => document.documentElement.classList.add('lenis-scrolling'));
  await jumpTo(page, await docTop(page, '.tools') - 100);
  const states = await page.evaluate(() => ['.tool.open .tool-art .sticker', '.edu-art .sticker', '.contact-title .ltr-sticker'].map((selector) => getComputedStyle(document.querySelector(selector)).animationPlayState));
  assert.deepEqual(states.slice(0, 1), ['running']);
  await jumpTo(page, await docTop(page, '.edu-stairs') - 300);
  assert.equal(await page.locator('.edu-art .sticker').first().evaluate((el) => getComputedStyle(el).animationPlayState), 'running');
  await jumpTo(page, await docTop(page, '#contact'));
  assert.equal(await page.locator('.contact-title .ltr-sticker').evaluate((el) => getComputedStyle(el).animationPlayState), 'running');
  await context.close();
});

test('reading text and labels stay at legible sizes', async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  const sizes = await page.evaluate(() => ({
    body: parseFloat(getComputedStyle(document.body).fontSize),
    labels: ['.case-fields dt', '.stats dt', '.git-stats dt', '.chips li', '.tool-tag', '.edu-tag', '.cform label', '.case-story dt'].map((selector) => parseFloat(getComputedStyle(document.querySelector(selector)).fontSize)),
  }));
  assert.ok(sizes.body >= 16, `Body text was ${sizes.body}px`);
  assert.ok(Math.min(...sizes.labels) >= 12, `Labels went down to ${Math.min(...sizes.labels)}px`);
  await context.close();
});

test('each built project tells its problem, decision and result', async () => {
  const { context, page } = await openPage();
  for (const id of ['case-finly', 'case-tablets', 'case-cubesat']) {
    assert.deepEqual(await page.locator(`#${id} .case-story dt`).allTextContents(), ['Problem', 'Decision', 'Result'], id);
  }
  await context.close();
});

test('the phone hero fills the width and keeps two big stickers beside its inline sun', async () => {
  const { context, page } = await openPage({ viewport: { width: 390, height: 844 } });
  const state = await page.evaluate(() => ({
    width: Math.max(...[...document.querySelectorAll('.hero-title .line-vis')].map((line) => line.getBoundingClientRect().width)),
    shown: [...document.querySelectorAll('.hero-title .ltr-sticker')].filter((el) => getComputedStyle(el).display !== 'none').length,
  }));
  assert.ok(state.width >= 340, `The title was ${state.width}px wide`);
  assert.equal(state.shown, 3);
  await context.close();
});

test('footer links are finger-sized on touch screens', async () => {
  const { context, page } = await openPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const heights = await page.locator('.foot-col a').evaluateAll((links) => links.map((link) => link.getBoundingClientRect().height));
  assert.ok(Math.min(...heights) >= 44, `Shortest link was ${Math.min(...heights)}px`);
  await context.close();
});

test('every drawing in the sprite is used somewhere', () => {
  const sprite = fs.readFileSync(path.join(root, 'assets', 'stickers.svg'), 'utf8');
  const pages = ['index.html', '404.html', 'js/motion.js'].map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('');
  const unused = [...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1]).filter((id) => !pages.includes(id));
  assert.deepEqual(unused, []);
});

test('reduced motion skips the entrances and shows the sections as they end', async () => {
  const { context, page } = await openPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const state = await page.evaluate(() => ({
    feat: getComputedStyle(document.querySelector('.case .feat')).visibility,
    clip: getComputedStyle(document.querySelector('.edu')).clipPath,
    art: getComputedStyle(document.querySelector('.edu-art')).opacity,
    tool: getComputedStyle(document.querySelector('.tool')).transform,
  }));
  assert.deepEqual(state, { feat: 'visible', clip: 'none', art: '1', tool: 'none' });
  await context.close();
});

test('every slot on the page has its own illustration', async () => {
  const { context, page } = await openPage();
  const ids = await page.evaluate(() => [...document.querySelectorAll('main use[href*="stickers.svg"], footer use[href*="stickers.svg"]')]
    .map((use) => use.getAttribute('href').split('#')[1]));
  // Laurels are a mirrored pair and the crest appears twice on purpose; everything else appears once.
  const counts = {};
  ids.filter((id) => id !== 's-laurel' && !id.startsWith('s-crest-')).forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
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

  const body = await page.locator('.crest > use').first().getAttribute('transform');
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

test('the crest appears alone after the reel, and again after the floors with the text', async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  const order = await page.evaluate(() => {
    const before = (a, b) => Boolean(document.querySelector(a).compareDocumentPosition(document.querySelector(b)) & Node.DOCUMENT_POSITION_FOLLOWING);
    const crests = document.querySelectorAll('.crest');
    return {
      count: crests.length,
      firstThenBio: crests[0].nextElementSibling.classList.contains('bio'),
      textInAbout: document.querySelectorAll('#about .kicker, #about .scrub').length,
      floorsThenCreed: before('[data-floors]', '.creed'),
      creedThenCases: before('.creed', '.cases'),
      creedOrder: [...document.querySelector('.creed').children].map((el) => el.classList[0]),
      ids: [...document.querySelectorAll('[id]')].map((el) => el.id),
      stack: document.querySelector('[data-about-stack]'),
    };
  });
  assert.equal(order.count, 2);
  assert.ok(order.firstThenBio, 'The bio follows the first crest directly');
  assert.equal(order.textInAbout, 0, 'No text follows the first crest');
  assert.ok(order.floorsThenCreed && order.creedThenCases, 'The second crest sits between the floors and the project files');
  assert.deepEqual(order.creedOrder, ['crest', 'about-head']);
  assert.equal(new Set(order.ids).size, order.ids.length, 'Ids must stay unique');
  assert.equal(order.stack, null);

  // Nothing holds, shrinks or fades any more, and both crests slide their ribbons out as they arrive.
  const places = await page.evaluate(() => [...document.querySelectorAll('.crest')].map((el) => el.getBoundingClientRect().top + scrollY));
  for (const [index, top] of places.entries()) {
    await page.evaluate((to) => window.scrollTo(0, to), top - 100);
    await page.waitForTimeout(1200);
    const state = await page.evaluate((i) => {
      const crest = document.querySelectorAll('.crest')[i];
      return {
        top: crest.getBoundingClientRect().top,
        ribbon: Math.abs(parseFloat(crest.querySelector('[data-crest-ribbon] g').getAttribute('transform').match(/translate\(([-\d.]+)/)[1])),
        bio: getComputedStyle(document.querySelector('.bio')).opacity,
      };
    }, index);
    assert.ok(Math.abs(state.top - 100) < 2, `Crest ${index} should scroll normally, top ${state.top}`);
    assert.ok(state.ribbon < 20, `Crest ${index} ribbons should be out, still ${state.ribbon} in`);
    assert.equal(state.bio, '1');
  }
  await context.close();
});

test('the quote fills in slowly, letter by letter, and finishes on screen', { timeout: 30000 }, async () => {
  const { context, page } = await openPage({ viewport: { width: 1440, height: 900 } });
  const read = () => page.evaluate(() => {
    const all = document.querySelectorAll('.scrub .ch-s').length;
    return { share: document.querySelectorAll('.scrub .ch-s.on').length / all, y: scrollY, top: document.querySelector('.scrub').getBoundingClientRect().top, dock: document.querySelector('.dock').getBoundingClientRect().bottom };
  });
  const start = await page.evaluate(() => document.querySelector('.scrub').getBoundingClientRect().top + scrollY);
  let first = null;
  let done = null;
  for (let y = start - 900; y < start + 400 && done === null; y += 30) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(250);
    const state = await read();
    if (state.share > 0 && first === null) first = state.y;
    if (state.share === 1) done = state;
  }
  assert.ok(done, 'The quote must finish');
  assert.ok(done.y - first >= 900 * 0.5, `The quote took only ${done.y - first}px of scroll`);
  assert.ok(done.top > done.dock, `The first line should still be clear of the buttons, top ${done.top}, buttons ${done.dock}`);
  assert.equal(await page.locator('.crest-link, [data-ink]').count(), 0, 'The pen, leaves and ink are gone');
  await context.close();
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
  assert.equal(await page.locator('[data-status-sent]').isVisible(), true, 'Submitting tells the visitor what happened and gives a fallback');
  assert.equal(await page.locator('[data-status-ready]').isVisible(), false);
  await context.close();
});

test('the site is always black, with no way to change it', async () => {
  const { context, page } = await openPage({ colorScheme: 'light' });
  await page.evaluate(() => localStorage.setItem('theme', 'light'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('motion-ready'));
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(11, 11, 11)', 'An old saved choice changes nothing');
  assert.equal(await page.locator('.theme-toggle').count(), 0);
  await page.goto(`${origin}/404.html`, { waitUntil: 'load' });
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(11, 11, 11)');
  assert.equal(await page.locator('.theme-toggle').count(), 0);
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
  await page.locator('.tool[data-cat="ops"] .tool-spine').click();
  await page.waitForTimeout(800);
  assert.deepEqual(errors, []);
  await context.close();
});
