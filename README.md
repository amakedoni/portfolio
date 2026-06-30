# Alexander Makedonskiy Portfolio

Static personal portfolio for [amakedoni.com](https://amakedoni.com/). The site is intentionally dependency-free: it can be served by GitHub Pages, Nginx, or any static file host.

## Structure

- `index.html` - active one-page portfolio, including the current CSS, UI translations, and page behavior.
- `404.html` - localized not-found page.
- `sw.js` - service worker for basic offline support and cache refreshes.
- `manifest.json` - PWA metadata.
- `assets/` - icons and profile images.
- `resume.pdf`, `resume.docx` - downloadable resume files.
- `docs/superpowers/` - implementation notes and historical change plans.

The older `css/` and some `js/` files are kept for compatibility with the 404 page and previous iterations. Check `index.html` before editing them, because the main page currently uses inline styles and scripts.

## Local Preview

From the repository root:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/`.

Use a local server instead of opening `index.html` directly, because the service worker, root-relative asset URLs, and manifest are designed for an HTTP origin.

## Maintenance Notes

- Bump `CACHE_NAME` in `sw.js` whenever cached files change.
- Keep `urlsToCache` aligned with files actually used by `index.html` and `404.html`.
- Update both resume files together so PDF and DOCX downloads stay consistent.
- The contact form opens a prepared email draft with the visitor's message; there is no backend inbox endpoint in this repository.
