# Alexander Makedonskiy Portfolio

Static personal portfolio for [amakedoni.com](https://amakedoni.com/). The site has no build step and loads nothing from third parties: it can be served by GitHub Pages, Nginx, or any static file host.

## Structure

- `index.html` - one-page portfolio markup.
- `css/site.css` - all styles, including the self-hosted `@font-face` rules. `404.html` shares it.
- `js/ui.js` - menu, contact form, skills filter, GitHub panel.
- `js/motion.js` - scroll scenes, letter-built titles and stickers. Everything it hides or pins is keyed on `.motion-ready`, so content is complete without it.
- `js/vendor/lenis.js` - vendored [Lenis](https://github.com/darkroomengineering/lenis) smooth scrolling (MIT). Named without `.min` because `.gitignore` excludes `*.min.js`.
- `js/theme.js` - theme persistence.
- `assets/stickers.svg` - generated illustration sprite. The crest is in `scripts/build-stickers.cjs`; every other drawing is in `scripts/sticker-art/`, one file per site section.
- `assets/videos/reel.mp4` - the reel, generated with Gemini. The video stream is the untouched original (`-c:v copy -an -movflags +faststart`): do not re-encode it. `assets/images/reel-poster.jpg` is its still.
- `assets/logo.svg` - the helmet mark.
- `assets/data/github.json` - generated GitHub statistics.
- `assets/` also holds icons, images and `fonts/` (SIL OFL, see `assets/fonts/LICENSES.txt`).
- `scripts/` - generators for the three files above.
- `.github/workflows/github-stats.yml` - refreshes the GitHub statistics every Monday.
- `sw.js`, `manifest.json` - offline support and PWA metadata.
- `resume.pdf`, `resume.docx` - downloadable resume files.
- `tests/portfolio-ui.test.cjs` - browser test suite.
- `docs/superpowers/` - design specs and historical change plans.

## Local Preview

From the repository root:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/`.

Use a local server instead of opening `index.html` directly, because the service worker, root-relative asset URLs, and manifest are designed for an HTTP origin.

## Tests

```bash
npm i --no-save playwright   # uses your installed Chrome, no browser download needed
node --test tests/portfolio-ui.test.cjs
```

Set `PORTFOLIO_CHROME_PATH` if Chrome is not at the default macOS location.

## Regenerating assets

```bash
node scripts/update-github-stats.mjs   # needs GITHUB_TOKEN or a logged-in gh CLI

# The next two need opentype.js and the @fontsource WOFF files, outside this repo:
NODE_PATH=<dir>/node_modules node scripts/build-stickers.cjs <roboto-flex-instance.ttf>
```

## Maintenance Notes

- Bump `CACHE_NAME` in `sw.js` whenever cached files change.
- Stickers on titles are configured in `STICKERS` at the top of `js/motion.js`, with offsets in em so they scale with the type.
- Floor text sits on saturated colour: check contrast when changing a floor's palette. The test suite enforces 4.5:1.
- Keep `urlsToCache` aligned with files actually used by `index.html` and `404.html`.
- Update both resume files together so PDF and DOCX downloads stay consistent.
- The contact form opens a prepared email draft with the visitor's message; there is no backend inbox endpoint in this repository.
