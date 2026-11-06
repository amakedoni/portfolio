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
  assert.ok(files.length > 10);
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

test('layout stays inside representative viewport widths in both languages', { timeout: 60000 }, async () => {
  for (const width of [360, 390, 768, 1280, 1600]) {
    for (const lang of ['en', 'ru']) {
      const { context, page } = await openPage({
        viewport: { width, height: 800 },
        hasTouch: width <= 768,
        init: `localStorage.setItem('language', '${lang}')`,
      });
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (const fraction of [0, 0.35, 0.7, 1]) {
        await jumpTo(page, height * fraction);
        const sizes = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          document: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        }));
        assert.ok(sizes.document <= sizes.viewport, `${width}px ${lang} overflowed to ${sizes.document}px at ${fraction}`);
      }
      await context.close();
    }
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

test('swapping letter faces never changes the width of a line', { timeout: 15000 }, async () => {
  const { context, page } = await openPage();
  const widths = () => page.evaluate(() => [...document.querySelectorAll('.hero-title .line-vis')]
    .map((line) => Math.round([...line.children].reduce((sum, cell) => sum + cell.getBoundingClientRect().width, 0))));
  await page.waitForFunction(() => document.querySelectorAll('.hero-title .ltr.is-alt').length > 0);
  const during = await widths();
  await page.evaluate(() => document.querySelectorAll('.ltr.is-alt').forEach((cell) => cell.classList.remove('is-alt')));
  assert.deepEqual(during, await widths());
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
  await page.waitForFunction(() => Math.abs(document.querySelector('.dock').getBoundingClientRect().top - 64) < 2);
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

test('cut letters stay put, sit on eligible letters, and never under a sticker', { timeout: 15000 }, async () => {
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
  assert.ok(state.lines.every((count) => count <= 1), `One cut per line, got ${state.lines}`);
  assert.equal(state.under, 0);
  for (const char of state.chars) assert.match(char, /[BDEHNRUCGOQS]/, `${char} should not be cut`);
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

test('Russian mode localizes prominent copy and survives switching back', async () => {
  const { context, page } = await openPage();
  await page.locator('.lang-toggle').click();
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'ru');
  const spoken = (await page.locator('h1 .sr-only').allTextContents()).map((text) => text.trim());
  assert.deepEqual(spoken, ['Проектирую', 'интерфейсы', 'будущего.']);
  assert.equal(await page.locator('.fp-kicker .sr-only').first().textContent(), 'Верхний этаж: интерфейс');
  assert.match(await page.locator('#about .scrub .sr-only').textContent(), /Сильные технические решения/);
  assert.match(await page.locator('#contact .panel-title').textContent(), /Создадим/);
  assert.match(await page.locator('.ticket .mq-track').first().textContent(), /Языки/);
  assert.match(await page.locator('[data-reel-text]').first().textContent(), /разработчик/);
  assert.match(await page.locator('#contact-message').getAttribute('placeholder'), /Расскажите о проекте/);
  // Titles with no translation rebuild from their source text, not from duplicated letters.
  assert.equal((await page.locator('.fp--finly .fp-title .sr-only').textContent()).trim(), 'Finly');
  await page.locator('.lang-toggle').click();
  assert.deepEqual((await page.locator('h1 .sr-only').allTextContents()).map((text) => text.trim()), ['Engineering', "tomorrow's", 'interfaces.']);
  assert.equal(await page.locator('.fp--finly .fp-title .ltr').count(), 5);
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

test('the 404 page keeps its language toggle and links home', async () => {
  const { context, page } = await openPage({ path: '/404.html' });
  assert.equal(await page.locator('.lost-actions a').getAttribute('href'), '/');
  await page.evaluate(() => localStorage.setItem('language', 'ru'));
  await page.reload({ waitUntil: 'load' });
  await page.locator('.lang-toggle').click();
  assert.equal(await page.locator('h1').textContent(), 'Page Not Found');
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
  await page.locator('.lang-toggle').click();
  await page.locator('.lang-toggle').click();
  await page.locator('.menu-toggle').click();
  await page.keyboard.press('Escape');
  await page.locator('.tab[data-cat="ops"]').click();
  await page.waitForTimeout(800);
  assert.deepEqual(errors, []);
  await context.close();
});
