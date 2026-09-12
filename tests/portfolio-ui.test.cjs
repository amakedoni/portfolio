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
  });
  const page = await context.newPage();
  await page.goto(`${origin}${options.path || '/'}`, { waitUntil: 'domcontentloaded' });
  if (!options.keepLoader && options.javaScriptEnabled !== false) {
    await page.addStyleTag({ content: '.loading-screen{display:none!important}' });
  }
  return { context, page };
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

function translation(transform) {
  if (!transform || transform === 'none') return { x: 0, y: 0 };
  const values = transform.match(/matrix(?:3d)?\(([^)]+)\)/)?.[1].split(',').map(Number);
  if (!values) throw new Error(`Unexpected transform: ${transform}`);
  return values.length === 6 ? { x: values[4], y: values[5] } : { x: values[12], y: values[13] };
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

test('the loader releases the page without an artificial delay', { timeout: 20000 }, async () => {
  const { context, page } = await openPage({ keepLoader: true });
  const started = Date.now();
  await page.locator('.loading-screen').waitFor({ state: 'hidden', timeout: 1000 });
  assert.ok(Date.now() - started < 1000, 'The loading screen should disappear within one second of DOM readiness');
  await context.close();
});

test('service worker caches the motion entry point with a new cache version', () => {
  const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(source, /portfolio-v1\.6\.1/);
  assert.match(source, /['"]\/js\/motion\.js['"]/);
});

test('reveal observer keeps the viewport bottom inside its root', () => {
  const source = fs.readFileSync(path.join(root, 'js', 'motion.js'), 'utf8');
  assert.match(source, /rootMargin:\s*'0px'/);
});

test('motion layout stays inside representative viewport widths', async () => {
  for (const width of [360, 390, 768, 1280, 1600]) {
    const { context, page } = await openPage({ viewport: { width, height: 900 }, hasTouch: width <= 768 });
    await page.locator('#contact').scrollIntoViewIfNeeded();
    const sizes = await page.evaluate(() => ({
      viewport: innerWidth,
      document: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    }));
    assert.ok(sizes.document <= sizes.viewport, `${width}px viewport overflowed to ${sizes.document}px`);
    await context.close();
  }
});

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

test('footer content reveals at the end of the document', async () => {
  const { context, page } = await openPage({ viewport: { width: 1280, height: 720 } });
  await page.waitForFunction(() => document.querySelectorAll('.git-cell').length > 0);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    document.querySelector('.foot').classList.remove('in');
    window.PortfolioMotion.refresh();
  });
  await page.waitForTimeout(500);

  const footer = page.locator('.foot');
  assert.equal(await footer.evaluate((element) => element.classList.contains('in')), true);
  assert.equal(await footer.evaluate((element) => getComputedStyle(element).opacity), '1');
  await context.close();
});

test('contact section uses one closing spacing interval before the footer', async () => {
  const { context, page } = await openPage({ viewport: { width: 1280, height: 720 } });
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  const gap = await page.evaluate(() => {
    const contactGrid = document.querySelector('.contact-grid').getBoundingClientRect();
    const footer = document.querySelector('footer').getBoundingClientRect();
    return footer.top - contactGrid.bottom;
  });

  assert.ok(gap <= 128, `Contact-to-footer gap should be one spacing interval, received ${gap}px`);
  await context.close();
});

test('scroll progress and active navigation follow the visible section', async () => {
  const { context, page } = await openPage();
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => document.querySelector('a[href="#projects"]')?.getAttribute('aria-current') === 'location',
    null,
    { timeout: 1500 },
  );

  const state = await page.evaluate(() => ({
    progress: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scroll-progress')),
    section: document.querySelector('[data-section-current]')?.textContent,
  }));

  assert.ok(state.progress > 0.1 && state.progress < 0.9);
  assert.equal(state.section, '02');
  await context.close();
});

test('hero and about scenes settle into their final state', async () => {
  const { context, page } = await openPage();
  await page.waitForFunction(() => document.documentElement.classList.contains('hero-in'), null, { timeout: 1500 });
  assert.equal(await page.locator('#hero h1 .row').first().evaluate((el) => getComputedStyle(el).opacity), '1');

  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#about')?.classList.contains('about-in'), null, { timeout: 1500 });
  await page.waitForFunction(() => {
    const values = [...document.querySelectorAll('[data-count]')]
      .map((item) => item.childNodes[0]?.textContent.trim());
    return JSON.stringify(values) === JSON.stringify(['5', '5', '4', '3']);
  }, null, { timeout: 2500 });
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

test('dark theme keeps hero and graph accents readable during the switch', async () => {
  const { context, page } = await openPage();
  await page.locator('.controls .theme-toggle').click();
  await page.waitForTimeout(30);

  const switchingColors = await page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    heading: getComputedStyle(document.querySelector('#hero h1')).color,
  }));
  assert.ok(contrast(parseColor(switchingColors.body), parseColor(switchingColors.heading)) >= 7, 'Heading contrast should remain strong while switching themes');

  await page.waitForFunction(() => document.body.classList.contains('dark-theme'));
  const colors = await page.evaluate(() => {
    const bodyStyle = getComputedStyle(document.body);
    const accent = getComputedStyle(document.querySelector('#hero .accent')).getPropertyValue('--hero-accent-mid').trim();
    const screen = getComputedStyle(document.querySelector('.dscreen')).backgroundColor;
    const graph = getComputedStyle(document.querySelector('.app-graph path[stroke]')).stroke;
    return { body: bodyStyle.backgroundColor, accent, screen, graph };
  });

  assert.ok(colors.accent, 'Hero accent should be driven by a theme token');
  assert.ok(contrast(parseColor(colors.body), parseColor(colors.accent)) >= 3, 'Dark-theme hero accent should remain visible');
  assert.ok(contrast(parseColor(colors.screen), parseColor(colors.graph)) >= 3, 'The Finly graph should remain visible in dark mode');
  await context.close();
});

test('the contact section never overflows a 360px viewport', async () => {
  const { context, page } = await openPage({ viewport: { width: 360, height: 800 } });
  await page.locator('#contact').scrollIntoViewIfNeeded();
  const layout = await page.evaluate(() => {
    const channel = document.querySelector('.channels .ch');
    const rect = channel.getBoundingClientRect();
    const scrollButton = document.querySelector('.scroll-to-top').getBoundingClientRect();
    return {
      viewport: window.innerWidth,
      documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      channelRight: rect.right,
      scrollButtonWidth: scrollButton.width,
    };
  });
  assert.ok(layout.documentWidth <= layout.viewport, `Document is ${layout.documentWidth}px wide in a ${layout.viewport}px viewport`);
  assert.ok(layout.channelRight <= layout.viewport, 'Contact channels should stay inside the viewport');
  assert.ok(layout.scrollButtonWidth <= 52, 'Back-to-top should collapse to an icon-sized control on narrow screens');
  await context.close();
});

test('desktop and mobile menus animate, close on Escape, and restore focus', async () => {
  const desktop = await openPage();
  const resumeButton = desktop.page.locator('.resume-toggle');
  await resumeButton.click();
  assert.equal(await resumeButton.getAttribute('aria-expanded'), 'true');
  assert.notEqual(await desktop.page.locator('.resume-menu').evaluate((el) => getComputedStyle(el).transitionDuration), '0s');
  await desktop.page.keyboard.press('Escape');
  await desktop.page.waitForTimeout(350);
  assert.equal(await resumeButton.getAttribute('aria-expanded'), 'false');
  assert.equal(await desktop.page.evaluate(() => document.activeElement?.classList.contains('resume-toggle')), true);
  await desktop.context.close();

  const mobile = await openPage({ viewport: { width: 390, height: 844 } });
  const menuButton = mobile.page.locator('.mobile-menu-toggle');
  await menuButton.click();
  assert.equal(await menuButton.getAttribute('aria-expanded'), 'true');
  await mobile.page.keyboard.press('Escape');
  await mobile.page.waitForTimeout(350);
  assert.equal(await menuButton.getAttribute('aria-expanded'), 'false');
  assert.equal(await mobile.page.evaluate(() => document.activeElement?.classList.contains('mobile-menu-toggle')), true);
  await mobile.context.close();
});

test('reduced motion disables decorative JavaScript animation', { timeout: 10000 }, async () => {
  const { context, page } = await openPage({ reducedMotion: 'reduce' });
  const cursorDisplay = await page.locator('.cursor-pixel-overlay').evaluate((el) => getComputedStyle(el).display);
  const firstRole = await page.locator('#rotator').textContent();
  await page.waitForTimeout(2600);
  const laterRole = await page.locator('#rotator').textContent();

  assert.equal(cursorDisplay, 'none', 'Pixel cursor should be disabled for reduced motion');
  assert.equal(laterRole, firstRole, 'Role text should not rotate for reduced motion');

  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.waitForTimeout(50);
  assert.equal(await page.locator('[data-count="5"]').first().textContent(), '5');
  await context.close();
});

test('skill tabs animate complete groups and expose proficiency tracks', async () => {
  const { context, page } = await openPage();
  const section = page.locator('#skills');
  await section.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#skills')?.classList.contains('skills-in'), null, { timeout: 1500 });

  const python = page.locator('.sk').filter({ hasText: 'Python' }).first();
  assert.equal(await python.evaluate((el) => getComputedStyle(el).getPropertyValue('--skill-level').trim()), '0.9');

  const backend = page.locator('.skills-tabs .tab[data-cat="back"]');
  await backend.click();
  await page.waitForTimeout(420);

  assert.equal(await backend.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.skcat:not([hidden])').count(), 1);
  assert.equal(await page.locator('.skcat[data-cat="back"]').isVisible(), true);
  assert.equal(
    await page.locator('.skcat[hidden]').evaluateAll((groups) => groups.every((group) => getComputedStyle(group).display === 'none')),
    true,
  );
  assert.equal(await page.locator('.skills-categories').getAttribute('data-animating'), null);
  await context.close();
});

test('Russian mode fully localizes prominent portfolio copy', async () => {
  const { context, page } = await openPage();
  await page.locator('.controls .lang-toggle').click();

  const copy = await page.evaluate(() => ({
    hero: document.querySelector('#hero h1').textContent,
    titles: [...document.querySelectorAll('.s-title')].map((el) => el.textContent),
    project: document.querySelector('.proj-grid .pc-title').textContent,
    education: document.querySelector('.ecard .edegree').textContent,
    contact: document.querySelector('.cleft h3').textContent,
  }));
  const combined = [copy.hero, ...copy.titles, copy.project, copy.education, copy.contact].join(' ');
  assert.match(copy.hero, /[А-Яа-яЁё]/);
  assert.doesNotMatch(combined, /Engineering|builder|Flagship|Tools of the trade|Recognition|Applied Mathematics|Got a project/i);
  await context.close();
});

test('contact fields have persistent accessible labels', async () => {
  const { context, page } = await openPage();
  const labelCounts = await page.locator('#contact-form input, #contact-form textarea').evaluateAll((fields) => fields.map((field) => field.labels?.length || 0));
  assert.deepEqual(labelCounts, [1, 1, 1]);
  const labelVisibility = await page.locator('#contact-form label').evaluateAll((labels) => labels.map((label) => {
    const style = getComputedStyle(label);
    return style.display !== 'none' && style.visibility !== 'hidden' && label.getBoundingClientRect().height > 1;
  }));
  assert.deepEqual(labelVisibility, [true, true, true]);
  await context.close();
});

test('featured project draws its graph and uses shallow device depth', async () => {
  const { context, page } = await openPage();
  const project = page.locator('.proj-feat');
  await project.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#projects')?.classList.contains('projects-in'), null, { timeout: 1500 });

  const line = page.locator('.app-graph .graph-line');
  assert.equal(await line.count(), 1);
  await page.waitForFunction(() => {
    const graphLine = document.querySelector('.app-graph .graph-line');
    return graphLine && Math.abs(Number.parseFloat(getComputedStyle(graphLine).strokeDashoffset)) < 1;
  }, null, { timeout: 2500 });

  const mock = page.locator('.pf-mock');
  const box = await mock.boundingBox();
  const before = await page.locator('.device').evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2);
  await page.waitForTimeout(100);
  const after = await page.locator('.device').evaluate((el) => getComputedStyle(el).transform);
  assert.notEqual(after, before);
  await context.close();
});

test('education timeline and GitHub grid expose their completed scenes', async () => {
  const { context, page } = await openPage();
  await page.locator('#education').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#education')?.classList.contains('education-in'), null, { timeout: 1500 });
  assert.equal(await page.locator('#education').evaluate((el) => getComputedStyle(el).getPropertyValue('--timeline-progress').trim()), '1');

  await page.locator('#github').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#github')?.classList.contains('github-in'), null, { timeout: 1500 });
  assert.equal(await page.locator('#git-cells').getAttribute('role'), 'grid');

  const first = page.locator('.git-cell').first();
  await first.focus();
  assert.equal(await first.getAttribute('tabindex'), '0');
  assert.equal(await page.locator('#git-tooltip').isVisible(), true);
  const tooltipBox = await page.locator('#git-tooltip').boundingBox();
  assert.ok(tooltipBox && tooltipBox.x >= 0 && tooltipBox.y >= 0);
  assert.ok(tooltipBox.x + tooltipBox.width <= 1280 && tooltipBox.y + tooltipBox.height <= 900);
  await first.press('ArrowRight');
  assert.equal(await page.locator('.git-cell').nth(7).getAttribute('tabindex'), '0');
  await context.close();
});

test('fine-pointer interactions expose contextual labels and magnetic offsets', async () => {
  const { context, page } = await openPage();
  const button = page.locator('#hero .btn.primary');
  const box = await button.boundingBox();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
  await page.waitForTimeout(80);
  assert.equal(await page.locator('.cursor-context-label').textContent({ timeout: 1500 }), 'VIEW');
  const magneticX = await button.evaluate((el) => getComputedStyle(el).getPropertyValue('--magnetic-x').trim());
  assert.notEqual(Number.parseFloat(magneticX), 0);
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

test('secondary project cards share the same hover lift without link affordances', async () => {
  const { context, page } = await openPage();
  const cards = page.locator('.pcard');
  await cards.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('.pc-arrow').count(), 0);

  for (let index = 0; index < await cards.count(); index += 1) {
    const card = cards.nth(index);
    await card.hover();
    await page.waitForTimeout(350);
    const cardMotion = translation(await card.evaluate((el) => getComputedStyle(el).transform));
    assert.deepEqual(
      { x: Math.round(cardMotion.x), y: Math.round(cardMotion.y) },
      { x: -4, y: -4 },
      `Project card ${index + 1} should lift upward on hover`,
    );
    assert.notEqual(await card.evaluate((el) => getComputedStyle(el).transitionDuration), '0s');
  }
  await context.close();
});

test('button hover motion follows one upward lift direction on every page', async () => {
  const main = await openPage();
  const mainButton = main.page.locator('#hero .btn.primary');
  await mainButton.hover();
  await main.page.waitForTimeout(350);
  const mainMotion = translation(await mainButton.evaluate((el) => getComputedStyle(el).transform));
  assert.ok(mainMotion.y < 0, `Main-page button moved down by ${mainMotion.y}px`);
  await main.context.close();

  const notFound = await openPage({ path: '/404.html' });
  const notFoundButton = notFound.page.locator('.btn.primary');
  await notFoundButton.hover();
  await notFound.page.waitForTimeout(350);
  const notFoundMotion = translation(await notFoundButton.evaluate((el) => getComputedStyle(el).transform));
  assert.ok(notFoundMotion.y < 0, `404 button moved down by ${notFoundMotion.y}px`);
  await notFound.context.close();
});
