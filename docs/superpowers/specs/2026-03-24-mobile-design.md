# Mobile Adaptation Design — Alexander Makedonskiy Portfolio

**Date:** 2026-03-24
**Target:** 390px (iPhone 14 / mid-range Android), functional down to 360px
**Approach:** Separate `mobile.css` file — overrides added on top of existing `style.css`

---

## Approach

Create a new `mobile.css` file containing all mobile-specific styles. Link it after `style.css` in `index.html`. The existing `@media` blocks in `style.css` stay in place; `mobile.css` overrides and extends them where needed.

**Why not inline in style.css?**
Keeps mobile styles isolated, easy to audit and revert without touching the desktop layout.

---

## Target Layout per Section (390px)

### Navigation
- Logo + [RU] [theme] [burger] in one row
- Logo text shortened: "Alexander M." → keeps full name visible if space allows
- Burger, lang, theme buttons: minimum 44×44px touch targets
- Mobile menu (slide-in panel) — already implemented in script.js, keep as-is

### Hero
- Font sizes: h1 → 28px, typing line → 18px, description → 13px
- CTA button: full width (100%), 14px text, 14px vertical padding
- Reduce vertical padding: 48px top, 44px bottom (desktop has excessive whitespace)
- Badge stays as-is

### About
- Photo stacked above text (column layout) — already triggered at 992px in style.css
- Photo container: width 100%, height 220px, border-radius maintained
- Text: 13px, 1.7 line-height

### Projects & Education (Timeline)
- padding-left: 28px (reduced from 35-40px)
- Item h3: 14px, h4: 12px
- List items inside timeline: 12px
- Project links (GitHub buttons): flex-wrap so they wrap if needed

### Skills
- `.skills-categories`: already 1-col at 900px, keep
- `.skill-category`: padding reduced to 1.25rem
- `.skill-card`: padding 0.625rem 0.875rem
- Skill category already collapses correctly — no major changes needed

### Contact
- Items already switch to column at 480px — keep, just verify padding
- Each contact item: horizontal layout (icon left, text right) on 390px
- Icon: 44×44px min touch target

### Footer
- Social icons: 40×40px, flex row centered
- Font size 11px

---

## General Mobile Rules

- `body`: `overflow-x: hidden` — prevent horizontal scroll from any overflowing element
- `.container`: `padding: 0 1rem` at ≤480px (currently may vary)
- `section`: `padding: 4rem 0` at ≤480px (reduce from 6rem)
- Particles background: disable animations on mobile (`animation: none`) for performance
- Font sizes reviewed: no element exceeds container width at 390px
- All interactive elements: `min-height: 44px`, `min-width: 44px` (touch targets)

---

## Files Changed

| File | Change |
|------|--------|
| `mobile.css` | **New file** — all mobile-specific CSS |
| `index.html` | Add `<link rel="stylesheet" href="mobile.css">` after style.css |

No changes to `style.css`, `script.js`, or any other file.

---

## Out of Scope

- No changes to desktop layout
- No JavaScript changes
- No new sections or content
- Tablet (768–1024px) — only fix obvious breaks, not a primary target
