# Mobile Adaptation Design — Alexander Makedonskiy Portfolio

**Date:** 2026-03-24
**Target:** 390px (iPhone 14 / mid-range Android), functional down to 360px
**Approach:** Separate `mobile.css` file — new overrides on top of `style.css` + `a11y.css`

---

## Approach

Create a new `mobile.css` file. Link it in `index.html` **after** `style.css` and `a11y.css`:

```html
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="a11y.css">
<link rel="stylesheet" href="mobile.css">  <!-- new -->
```

Rules in `mobile.css` are scoped to `@media (max-width: 480px)` unless noted, preventing bleed into tablet. Where `style.css` uses `!important`, `mobile.css` overrides must also use `!important`.

No changes to `style.css`, `a11y.css`, `script.js`, `lang.js`, `theme.js`, or `index.html` structure.

---

## What Already Works (no CSS needed)

These are handled correctly by existing `style.css` rules and require no overrides:

- `overflow-x: hidden` on `body` — global + `!important` at 480px
- `font-size: 16px !important` on `input, textarea, select, button` — at 480px (iOS auto-zoom prevention)
- `.skills-categories` 1-col layout — at 900px
- `.skill-category` and `.skill-card` padding — identical values already at 480px
- `.project-links` `flex-wrap: wrap` — set globally
- Social links 44px touch targets — set at multiple breakpoints
- Loading screen — handled at 768px and 480px
- Scroll-to-top button — handled at 768px and 480px
- Mobile menu slide-in panel — handled in existing JS + CSS
- Timeline `padding-left: 28px !important` — set at 480px
- Timeline h3 font-size `1.45rem !important` — set at 480px
- Timeline h4 font-size `1.15rem !important` — set at 480px

---

## New Rules for mobile.css (`@media (max-width: 480px)`)

### Navigation
- `.logo`: no truncation; rely on existing overflow handling
- Burger/lang/theme buttons already have 44px touch targets

### Hero
- `h1` font-size: already `2.375rem !important` in `style.css` — no override needed
- Typing line: `font-size: 1.5rem`
- Description `<p>`: `font-size: 1rem; line-height: 1.6`
- CTA button: `width: 100% !important; font-size: 1.05rem; padding: 1.1rem`
- Section padding: `section { padding: 4.5rem 0 !important }` — matches existing value, no change needed

### About
- Photo container: `height: 220px !important` (overrides `300px !important` in style.css)
- `width: 100%` for photo wrapper

### Projects & Education (Timeline)
- h3, h4, padding-left — already handled in `style.css` with `!important`; no override needed
- List item font-size inside timeline: `font-size: 0.9rem`

### Skills
- Already fully handled — no new rules

### Contact
- `.contact-item`: override column layout → `flex-direction: row !important; align-items: center !important; text-align: left !important; gap: 1rem`
- `.contact-icon`: keep existing `min-width: 48px !important; height: 48px !important` (already set — no override)
- Contact form inputs/textarea: already has `font-size: 16px !important`; add `width: 100%; padding: 0.75rem`
- Submit button: `width: 100%; min-height: 44px`

### General Layout
- `.container`: `padding: 0 1rem` (no existing rule at 480px; applies cleanly)
- Footer social icons: already 44px+ touch targets from existing rules

---

## Files Changed

| File | Change |
|------|--------|
| `mobile.css` | **New file** — targeted overrides for 390px |
| `index.html` | Add `<link rel="stylesheet" href="mobile.css">` after `a11y.css` |

---

## Out of Scope

- No desktop layout changes
- No JavaScript changes
- No HTML structural changes
- Tablet (481–1024px) — not a target
