# Alexander Makedonskiy Portfolio

Static personal portfolio for [amakedoni.com](https://amakedoni.com/). The classic page is dependency-free. The new 3D island at `/world/` uses a locally bundled Three.js runtime. Both can be served by GitHub Pages, Nginx, or any static file host without a build step.

## Structure

- `index.html` - active one-page portfolio, including the current CSS, UI translations, and page behavior.
- `404.html` - localized not-found page.
- `sw.js` - service worker for basic offline support and cache refreshes.
- `manifest.json` - PWA metadata.
- `assets/` - icons and profile images.
- `world/` - the staged 3D portfolio, currently at the visual-island milestone.
- `docs/island-stages.md` - stage boundaries, accepted design, and verification notes.
- `resume.pdf`, `resume.docx` - downloadable resume files.
- `docs/superpowers/` - implementation notes and historical change plans.

The older `css/` and some `js/` files are kept for compatibility with the 404 page and previous iterations. Check `index.html` before editing them, because the main page currently uses inline styles and scripts.

## Local Preview

From the repository root:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/`.

To preview the archipelago, open `http://localhost:8000/world/`. The first view focuses the main island so its signs and objects stay readable. Drag to inspect the scene and use the wheel to zoom. The World map sign (or `/world/#map`) reveals five islands connected by six suspension bridges, with alternate routes through the observatory, playground and energy station. Actual ground area is about twice the previous two-island version; the home island is only about 5% larger. Physical signs and keyboard focus controls select individual districts. Portfolio signs link to the classic sections; player driving and in-world portfolio panels are subsequent milestones.

The rover, desks, chair, equipment racks, radio desk, antennas and CubeSat use the revised rounded, stylized model set. The test range's Start / Stop console runs the blue rover through its checkpoints. Observe starts or stops the telescope and orrery. Power on toggles the wind turbines and battery charge display. On the playground, arrow signs move the ball's starting position; Throw / Reset launches a ball, counts fallen pins and resets the lane for the next attempt. The lightweight collision simulation has a fixed time step and the same result in reduced-motion mode.

The garden pond beside the pergola has a clickable sonar buoy and feeds a recessed creek, garden footbridge and waterfall over the cliff. Click the buoy, water, or Sonar sign to send ripples across the pond. Fish, water, foliage and the flag move gently in the background; equipment has subtle idle animation. Raised workshop terraces and a low rover pad break up the courtyard. The test range has a rotating anemometer and a lap-progress indicator. Direction signs smoothly move the camera between districts. Keyboard controls, including Reduce motion, appear on focus.

Surfaces use local procedural colour, relief and roughness maps. The current art pass uses warm sunlight, violet cast shadows, green foliage shadows and distance haze, informed by a source-first review of Bruno Simon's portfolio. A perspective camera brings individual districts closer; map mode fits all five islands. Fine faceted leaves, grass meadows and a central rock garden soften the paved areas while keeping the driving lanes clear. A lightweight bloom and edge-focus pass adds lamp glow and slight depth of field; a procedural lavender sky replaces the original cloud bitmap. Sun shadows follow moving objects, and ambient occlusion adds contact. Static pieces are combined per district, animation is capped at 30 fps, and render resolution adapts downward if sustained performance is low. The scene respects reduced motion and suspends its animation loop when the document is hidden.

The geometry, framing, bridge connectivity and bowling tests run with `node --test world/tests/*.test.js`. Runtime dependencies are already in `world/vendor/`; no package installation is needed for a local preview.

Use a local server instead of opening `index.html` directly, because the service worker, root-relative asset URLs, and manifest are designed for an HTTP origin.

## Maintenance Notes

- Bump `CACHE_NAME` in `sw.js` whenever cached files change.
- Keep `urlsToCache` aligned with files actually used by `index.html` and `404.html`.
- Update both resume files together so PDF and DOCX downloads stay consistent.
- The contact form opens a prepared email draft with the visitor's message; there is no backend inbox endpoint in this repository.
