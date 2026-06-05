# Sword Animation Upgrade — Design Spec
**Date:** 2026-06-05  
**Status:** Approved

## Summary

Upgrade the portfolio hero sword animation from pure-CSS to a CSS+Canvas hybrid. Direction: "Slash Drama" — arc trail, canvas particle bursts, impact flash, screen shake. S2 (bottom strike) reworked from a broken double-bounce uppercut to a clean lateral sweep (wide windup right → slash upper-left), with all effects mirrored to match its direction.

---

## 1. S2 Animation Rework (CSS)

### Problem
Current S2 keyframes have a double-bounce bug: at 80% the sword moves *back up* (`-14px, -18deg`) after already settling at 77% (`-8px, -8deg`), creating an unnatural jerk.

### New S2 Keyframes (replaces 49%–100% in `swordTimeline`)

| % | translate | rotate | note |
|---|-----------|--------|------|
| 49%, 50% | (0, 0) | 0° | neutral |
| 57% | (+4px, +6px) | +20° | windup starts right |
| 65% | (+10px, +14px) | +48° | blade drops right-down |
| 71% | (+12px, +18px) | +68° | MAX windup |
| 78% | (+6px, +6px) | +38° | slash begins |
| 84% | (-2px, -8px) | -2° | passes center |
| 88% | (-6px, -22px) | -24° | **PEAK** ← JS trigger here |
| 92% | (-4px, -14px) | -14° | recoil — monotonically decreasing |
| 96% | (-1px, -3px) | -3° | settling |
| 100% | (0, 0) | 0° | done |

Rule: every recoil keyframe has strictly smaller magnitude than the previous. No reversals.

### Shadow Timeline S2 updates
- Windup: shadow shifts right `drop-shadow(+8px, +4px, ...)`
- Peak: shadow goes upper-left `drop-shadow(-10px, -14px, 0, rgba(0,0,0,.4))`
- Recovery: returns to base `drop-shadow(4px, 4px, 0, rgba(0,0,0,.15))`

---

## 2. Speed Lines

### S1 (overhand — unchanged, already good)
- sl1–sl3: left side of stage, `transform-origin: right`, angles `-5° / +3° / +8°`
- Trigger: 8%–24% of 8s loop

### S2 (lateral uppercut — updated angles and positions)
- sl4–sl6: **right side** of stage (`left: 70–80px`), `transform-origin: left`
- Angles: `-62° / -68° / -74°` (steeper than current to match upper-left trajectory)
- Trigger: 78%–90% of 8s loop

---

## 3. Arc Trail (SVG + CSS)

Two `<svg class="sword-arc-s1">` / `<svg class="sword-arc-s2">` elements, absolutely positioned inside `.sword-stage`, `pointer-events: none`, `z-index: 1`.

Each arc has two `<path>` layers:
- Primary: `stroke-width: 2.5`, opacity peaks at `0.5`
- Secondary: `stroke-width: 1.5`, opacity peaks at `0.22`

Both use `stroke: var(--ink)` — auto dark theme.

**S1 arc path**: curves top-left → bottom-right  
`M 20 5 Q 130 60 80 115` (approximately — tune at impl time)  
Trigger: 14%–26% of 8s loop, `stroke-dashoffset` draw animation

**S2 arc path**: curves bottom-right → top-left (mirror of S1)  
`M 115 115 Q 5 60 50 5` (approximately)  
Trigger: 78%–90% of 8s loop

---

## 4. Canvas Particle System

### Structure
```html
<canvas class="sword-canvas" aria-hidden="true"></canvas>
```
- `position: absolute; top: -30px; left: -30px` (30px overflow to catch scatter outside stage bounds)
- `width: calc(100% + 60px); height: calc(100% + 60px)`
- `pointer-events: none`, `z-index: 5`

### JS Module: `SwordFX` (in `js/script.js`)

**Timing sync:**
```
animationstart on .sword-group → t₀ = 0
S1 burst: t₀ + 1760ms  (22% × 8000ms)
S2 burst: t₀ + 7040ms  (88% × 8000ms)
repeat every 8000ms
```

**Per burst: 14 particles**

| Property | Value |
|----------|-------|
| Count | 14 |
| Size | 2–6px, random (mix square / circle) |
| Initial speed | 2.5–6 px/frame |
| Gravity | +0.15 px/frame² |
| Fade | opacity 1→0 linear over 400ms |
| Color | `getComputedStyle(root).getPropertyValue('--ink')` at burst time |

**S1 burst direction** (overhand — sword peaks going right-down):
- Origin: near upper-right of sword at peak position
- Scatter fan: ±65° around `+45°` (right-downward)

**S2 burst direction** (lateral uppercut — sword peaks going upper-left):
- Origin: near upper-left of sword at peak position
- Scatter fan: ±65° around `-135°` (upper-leftward)
- Mirrors S1 exactly in logic, different vector and origin

**`prefers-reduced-motion`:** check `matchMedia('(prefers-reduced-motion: reduce)')` before each burst; skip if true.

**Dark theme:** color read at burst time — automatically correct even if user toggles theme mid-loop.

---

## 5. Impact Flash

```html
<div class="sword-flash" aria-hidden="true"></div>
```
- `position: absolute`, `inset: 0`, `border-radius: var(--r-md)`
- `background: var(--bg)`, `opacity: 0`, `pointer-events: none`, `z-index: 20`
- CSS transition: `opacity 180ms ease-out`

JS: add class `.active` (sets `opacity: 0.45`) at burst time, remove after 180ms.

---

## 6. Screen Shake

```css
@keyframes sword-stage-shake {
  0%, 100% { transform: translate(0, 0) }
  20%       { transform: translate(-2px, 0) }
  40%       { transform: translate(2px, 0) }
  60%       { transform: translate(-1px, 0) }
  80%       { transform: translate(1px, 0) }
}
.sword-stage--shake {
  animation: sword-stage-shake 280ms ease-out forwards;
}
```

JS: add `.sword-stage--shake` at burst time, remove on `animationend`.

---

## 7. Files Modified

| File | Change |
|------|--------|
| `index.html` | Add `<canvas>`, 2× `<svg>` arcs, `<div>` flash inside `.sword-stage`; remove 16 `.sword-spark` divs |
| `css/style.css` | New rules: arc SVGs, flash, shake (~35 lines); updated S2 speed line angles |
| `js/script.js` | `SwordFX` module: canvas loop, timing sync, burst logic (~80 lines) |

---

## 8. What Does NOT Change

- `swordTimeline` S1 (0%–48%) — untouched
- `shadowTimeline` S1 — untouched  
- Speed lines S1 (sl1–sl3) — untouched
- Forge entrance animation (`forgeReveal`, forge sparks)
- Dark theme CSS rules for SVG fills
- `prefers-reduced-motion` global CSS rule
- Mobile responsive rules
