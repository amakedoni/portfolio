#!/usr/bin/env node
// Prints resume/resume.html to resume.pdf (and, with --png <dir>, every page to <dir>/page-N.png for checking).
// Serves the repo over HTTP so the page can reach the shared sticker sprite, which Chrome won't load from file://.
// Needs Playwright on NODE_PATH and Chrome; PORTFOLIO_CHROME_PATH overrides where Chrome lives.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const chromePath = process.env.PORTFOLIO_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(0, async () => {
  const browser = await chromium.launch({ executablePath: chromePath });
  try {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${server.address().port}/resume/resume.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // Every page is a fixed A4 sheet that clips, so anything running past its margin would silently vanish.
    const over = await page.evaluate(() => [...document.querySelectorAll('.page')].flatMap((sheet, i) => {
      const limit = sheet.getBoundingClientRect().bottom - parseFloat(getComputedStyle(sheet).paddingBottom);
      const right = sheet.getBoundingClientRect().right - parseFloat(getComputedStyle(sheet).paddingRight);
      return [...sheet.children].filter(el => !el.matches('.bars') && (el.getBoundingClientRect().bottom > limit + 1 || el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().right > right + 1))
        .map(el => `page ${i + 1}: ${el.className || el.tagName} overflows by ${Math.round(Math.max(el.getBoundingClientRect().bottom - limit, el.scrollWidth - el.clientWidth))}px`);
    }));
    if (over.length) throw new Error(over.join('\n'));
    await page.pdf({ path: path.join(ROOT, 'resume.pdf'), preferCSSPageSize: true, printBackground: true });
    const png = process.argv.indexOf('--png');
    if (png > -1) {
      await page.emulateMedia({ media: 'print' });
      const pages = await page.locator('.page').all();
      for (const [i, el] of pages.entries()) await el.screenshot({ path: path.resolve(process.argv[png + 1], `page-${i + 1}.png`) });
    }
  } finally {
    await browser.close();
    server.close();
  }
});
