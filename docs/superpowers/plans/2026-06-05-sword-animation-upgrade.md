# Sword Animation Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the hero sword animation to a CSS+Canvas hybrid — fix S2 lateral uppercut, add arc trails, canvas particle bursts, impact flash, and screen shake.

**Architecture:** All sword motion stays in CSS keyframes. A `<canvas>` overlay handles physics-based particle bursts at impact. SVG arc elements with CSS `stroke-dashoffset` animations provide slash trails. A `SwordFX` IIFE in `js/script.js` syncs burst/flash/shake timing to the 8s CSS loop via `animationstart` + `setTimeout`.

**Tech Stack:** Vanilla CSS, inline SVG, Canvas 2D API, vanilla JS — no dependencies.

---

## File Map

| File | What changes |
|------|-------------|
| `index.html` | CSS keyframes S2 fix; sl4–sl6 CSS; arc SVG elements; canvas + flash divs; remove 16 spark divs; add canvas/flash/shake CSS; remove dead spark CSS |
| `js/script.js` | Append `SwordFX` IIFE (~75 lines) |

All sword CSS is inline in `<style>` inside `index.html`.

---

### Task 1: Fix S2 keyframes, shadow, and speed lines

**Files:**
- Modify: `index.html` (lines 630–677)

- [ ] **Step 1: Replace S2 `swordTimeline` keyframes**

In `index.html`, find inside `@keyframes swordTimeline`:
```
  49%{transform:translate(0,0) rotate(0deg)}
  52%{transform:translate(2px,10px) rotate(12deg)}
  55%{transform:translate(4px,22px) rotate(28deg)}
  58%{transform:translate(6px,32px) rotate(42deg)}
  61%{transform:translate(5px,36px) rotate(52deg)}
  64%{transform:translate(2px,22px) rotate(32deg)}
  67%{transform:translate(-1px,2px) rotate(8deg)}
  70%{transform:translate(-3px,-16px) rotate(-8deg)}
  72%{transform:translate(-4px,-24px) rotate(-20deg)}
  74%{transform:translate(-3px,-20px) rotate(-16deg)}
  77%{transform:translate(-1px,-8px) rotate(-8deg)}
  80%{transform:translate(-2px,-14px) rotate(-18deg)}
  83%{transform:translate(0px,2px) rotate(-5deg)}
  87%{transform:translate(1px,-2px) rotate(2deg)}
  92%{transform:translate(-1px,1px) rotate(-1deg)}
  96%,100%{transform:translate(0,0) rotate(0deg)}
```

Replace with:
```
  49%,50%{transform:translate(0,0) rotate(0deg)}
  57%{transform:translate(4px,6px) rotate(20deg)}
  65%{transform:translate(10px,14px) rotate(48deg)}
  71%{transform:translate(12px,18px) rotate(68deg)}
  78%{transform:translate(6px,6px) rotate(38deg)}
  84%{transform:translate(-2px,-8px) rotate(-2deg)}
  88%{transform:translate(-6px,-22px) rotate(-24deg)}
  92%{transform:translate(-4px,-14px) rotate(-14deg)}
  96%{transform:translate(-1px,-3px) rotate(-3deg)}
  100%{transform:translate(0,0) rotate(0deg)}
```

- [ ] **Step 2: Replace S2 `shadowTimeline` keyframes**

In `index.html`, find inside `@keyframes shadowTimeline`:
```
  61%{filter:drop-shadow(6px -5px 0 rgba(0,0,0,.28)) brightness(1)}
  72%{filter:drop-shadow(3px -16px 0 rgba(0,0,0,.4)) brightness(1.06)}
  83%{filter:drop-shadow(5px -3px 0 rgba(0,0,0,.2)) brightness(1)}
  96%,100%{filter:drop-shadow(4px 4px 0 rgba(0,0,0,.15)) brightness(1)}
```

Replace with:
```
  65%{filter:drop-shadow(8px 4px 0 rgba(0,0,0,.22)) brightness(1)}
  71%{filter:drop-shadow(10px 6px 0 rgba(0,0,0,.28)) brightness(1)}
  88%{filter:drop-shadow(-10px -14px 0 rgba(0,0,0,.4)) brightness(1.06)}
  92%{filter:drop-shadow(-6px -8px 0 rgba(0,0,0,.22)) brightness(1)}
  96%,100%{filter:drop-shadow(4px 4px 0 rgba(0,0,0,.15)) brightness(1)}
```

- [ ] **Step 3: Update sl4/sl5/sl6 positions and delays**

Find:
```css
.sword-sl.sl4{width:36px;top:100px;left:68px;transform-origin:left center;animation:ssl4 8s 2.15s linear infinite}
.sword-sl.sl5{width:32px;top:85px;left:72px;transform-origin:left center;animation:ssl5 8s 2.18s linear infinite}
.sword-sl.sl6{width:34px;top:110px;left:70px;transform-origin:left center;animation:ssl6 8s 2.2s linear infinite}
```

Replace with:
```css
.sword-sl.sl4{width:38px;top:100px;left:72px;transform-origin:left center;animation:ssl4 8s 1.6s linear infinite}
.sword-sl.sl5{width:32px;top:112px;left:76px;transform-origin:left center;animation:ssl5 8s 1.6s linear infinite}
.sword-sl.sl6{width:36px;top:86px;left:70px;transform-origin:left center;animation:ssl6 8s 1.6s linear infinite}
```

- [ ] **Step 4: Update ssl4/ssl5/ssl6 keyframes (timing + angles)**

Find:
```css
@keyframes ssl4{0%,52%{opacity:0;transform:rotate(-55deg) scaleX(0)}60%{opacity:.3;transform:rotate(-55deg) scaleX(1)}74%{opacity:0;transform:rotate(-55deg) scaleX(0)}100%{opacity:0;transform:rotate(-55deg) scaleX(0)}}
@keyframes ssl5{0%,52%{opacity:0;transform:rotate(-48deg) scaleX(0)}60%{opacity:.3;transform:rotate(-48deg) scaleX(1)}74%{opacity:0;transform:rotate(-48deg) scaleX(0)}100%{opacity:0;transform:rotate(-48deg) scaleX(0)}}
@keyframes ssl6{0%,52%{opacity:0;transform:rotate(-60deg) scaleX(0)}60%{opacity:.3;transform:rotate(-60deg) scaleX(1)}74%{opacity:0;transform:rotate(-60deg) scaleX(0)}100%{opacity:0;transform:rotate(-60deg) scaleX(0)}}
```

Replace with:
```css
@keyframes ssl4{0%,76%{opacity:0;transform:rotate(-62deg) scaleX(0)}84%{opacity:.3;transform:rotate(-62deg) scaleX(1)}92%{opacity:0;transform:rotate(-62deg) scaleX(0)}100%{opacity:0;transform:rotate(-62deg) scaleX(0)}}
@keyframes ssl5{0%,76%{opacity:0;transform:rotate(-68deg) scaleX(0)}84%{opacity:.3;transform:rotate(-68deg) scaleX(1)}92%{opacity:0;transform:rotate(-68deg) scaleX(0)}100%{opacity:0;transform:rotate(-68deg) scaleX(0)}}
@keyframes ssl6{0%,76%{opacity:0;transform:rotate(-74deg) scaleX(0)}84%{opacity:.3;transform:rotate(-74deg) scaleX(1)}92%{opacity:0;transform:rotate(-74deg) scaleX(0)}100%{opacity:0;transform:rotate(-74deg) scaleX(0)}}
```

- [ ] **Step 5: Open index.html in a browser and verify S2 visually**

Watch the 8s loop. After the 4s mark:
- Sword leans right (rotates ~68° clockwise, drops to lower-right)
- Sword sweeps powerfully to upper-left
- Recovery is a single clean damped oscillation — no double-bounce
- Speed lines appear upper-right area, angled steeply upper-left (-62° to -74°)
- Shadow shifts right during windup, then upper-left at peak

If the windup or sweep angles look off, adjust the `rotate()` values in `swordTimeline` (larger windup angle = more dramatic lean; larger negative peak angle = more reach). If speed lines appear in the wrong position, adjust `top`/`left` on sl4–sl6.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "fix: rework S2 lateral uppercut — fix double-bounce recoil and sync speed lines"
```

---

### Task 2: Arc trails (SVG + CSS)

**Files:**
- Modify: `index.html` (HTML structure + CSS block)

- [ ] **Step 1: Insert arc SVG elements into `.sword-stage`**

Find in `index.html`:
```html
        <div class="sword-group">
```

Replace with:
```html
        <svg class="sword-arc sword-arc-s1" viewBox="0 0 150 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;overflow:visible;z-index:1">
          <path class="arc-main" d="M 25 18 Q 95 88 138 158" stroke="var(--ink)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="250" stroke-dashoffset="250"/>
          <path class="arc-soft" d="M 18 26 Q 86 92 128 162" stroke="var(--ink)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-dasharray="250" stroke-dashoffset="250"/>
        </svg>
        <svg class="sword-arc sword-arc-s2" viewBox="0 0 150 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;overflow:visible;z-index:1">
          <path class="arc-main" d="M 125 152 Q 55 82 12 12" stroke="var(--ink)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="250" stroke-dashoffset="250"/>
          <path class="arc-soft" d="M 132 158 Q 64 88 22 18" stroke="var(--ink)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-dasharray="250" stroke-dashoffset="250"/>
        </svg>
        <div class="sword-group">
```

- [ ] **Step 2: Add arc CSS after the speed-line block**

Find in `index.html`:
```css

/* sword sparks */
```

Insert before it:
```css
/* arc trails */
@keyframes arcS1{0%,11%{stroke-dashoffset:250;opacity:0}14%{stroke-dashoffset:250;opacity:.5}21%{stroke-dashoffset:0;opacity:.5}26%{stroke-dashoffset:0;opacity:0}100%{stroke-dashoffset:250;opacity:0}}
@keyframes arcS1soft{0%,11%{stroke-dashoffset:250;opacity:0}14%{stroke-dashoffset:250;opacity:.22}21%{stroke-dashoffset:0;opacity:.22}26%{stroke-dashoffset:0;opacity:0}100%{stroke-dashoffset:250;opacity:0}}
@keyframes arcS2{0%,77%{stroke-dashoffset:250;opacity:0}80%{stroke-dashoffset:250;opacity:.5}87%{stroke-dashoffset:0;opacity:.5}92%{stroke-dashoffset:0;opacity:0}100%{stroke-dashoffset:250;opacity:0}}
@keyframes arcS2soft{0%,77%{stroke-dashoffset:250;opacity:0}80%{stroke-dashoffset:250;opacity:.22}87%{stroke-dashoffset:0;opacity:.22}92%{stroke-dashoffset:0;opacity:0}100%{stroke-dashoffset:250;opacity:0}}
.sword-arc-s1 .arc-main{animation:arcS1 8s 1.6s linear infinite}
.sword-arc-s1 .arc-soft{animation:arcS1soft 8s 1.6s linear infinite}
.sword-arc-s2 .arc-main{animation:arcS2 8s 1.6s linear infinite}
.sword-arc-s2 .arc-soft{animation:arcS2soft 8s 1.6s linear infinite}

```

- [ ] **Step 3: Verify arcs in browser**

S1 arc (overhand): a curved streak should draw itself from top-left toward bottom-right at the moment of the overhand slash, then fade. S2 arc: mirror — bottom-right to top-left during the lateral sweep.

Both arcs should use the page's ink color (black on light theme, white on dark theme — they inherit `var(--ink)` via `stroke` attribute).

**Tuning arc path shape:** Each path is a quadratic Bezier: `M startX startY Q controlX controlY endX endY` (viewBox is 150×170px matching the stage). If the arc shape doesn't follow the blade trajectory:
- S1: move start toward upper-left, end toward lower-right; control point pulls the curve's belly
- S2: mirror — start lower-right, end upper-left

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add SVG arc trails for S1 overhand and S2 lateral uppercut"
```

---

### Task 3: Canvas + flash + shake infrastructure

**Files:**
- Modify: `index.html` (replace spark HTML + CSS)

- [ ] **Step 1: Replace 16 spark divs with canvas and flash elements**

Find in `index.html`:
```html
        <div class="sword-spark sq ss1a"></div><div class="sword-spark rnd ss1b"></div>
        <div class="sword-spark sq ss1c"></div><div class="sword-spark rnd ss1d"></div>
        <div class="sword-spark sq ss1e"></div><div class="sword-spark sq ss1f"></div>
        <div class="sword-spark rnd ss1g"></div><div class="sword-spark sq ss1h"></div>
        <div class="sword-spark sq ss2a"></div><div class="sword-spark rnd ss2b"></div>
        <div class="sword-spark sq ss2c"></div><div class="sword-spark rnd ss2d"></div>
        <div class="sword-spark sq ss2e"></div><div class="sword-spark sq ss2f"></div>
        <div class="sword-spark rnd ss2g"></div><div class="sword-spark sq ss2h"></div>
```

Replace with:
```html
        <canvas class="sword-canvas" aria-hidden="true"></canvas>
        <div class="sword-flash" aria-hidden="true"></div>
```

- [ ] **Step 2: Replace dead spark CSS with canvas/flash/shake CSS**

Find in `index.html`:
```css
/* sword sparks */
.sword-spark{position:absolute;background:var(--ink);pointer-events:none;z-index:5;opacity:0}
.sword-spark.sq{width:5px;height:5px;border-radius:1px}
.sword-spark.rnd{width:3px;height:3px;border-radius:50%}
.ss1a{top:10px;left:62px;animation:ssS1 8s 1.86s linear infinite;--dx:18px;--dy:14px}
.ss1b{top:25px;left:76px;animation:ssS1 8s 1.88s linear infinite;--dx:22px;--dy:10px}
.ss1c{top:50px;left:84px;animation:ssS1 8s 1.9s linear infinite;--dx:26px;--dy:2px}
.ss1d{top:72px;left:82px;animation:ssS1 8s 1.92s linear infinite;--dx:24px;--dy:-6px}
.ss1e{top:90px;left:72px;animation:ssS1 8s 1.94s linear infinite;--dx:16px;--dy:-12px}
.ss1f{top:8px;left:44px;animation:ssS1 8s 1.87s linear infinite;--dx:-16px;--dy:12px}
.ss1g{top:30px;left:30px;animation:ssS1 8s 1.89s linear infinite;--dx:-22px;--dy:4px}
.ss1h{top:55px;left:24px;animation:ssS1 8s 1.91s linear infinite;--dx:-26px;--dy:-4px}
.ss2a{top:80px;left:52px;animation:ssS2 8s 2.05s linear infinite;--ux:12px;--uy:-22px}
.ss2b{top:68px;left:68px;animation:ssS2 8s 2.07s linear infinite;--ux:18px;--uy:-18px}
.ss2c{top:52px;left:78px;animation:ssS2 8s 2.09s linear infinite;--ux:22px;--uy:-12px}
.ss2d{top:36px;left:80px;animation:ssS2 8s 2.11s linear infinite;--ux:18px;--uy:-8px}
.ss2e{top:20px;left:74px;animation:ssS2 8s 2.13s linear infinite;--ux:10px;--uy:-4px}
.ss2f{top:84px;left:38px;animation:ssS2 8s 2.06s linear infinite;--ux:-10px;--uy:-20px}
.ss2g{top:64px;left:30px;animation:ssS2 8s 2.08s linear infinite;--ux:-16px;--uy:-14px}
.ss2h{top:42px;left:26px;animation:ssS2 8s 2.1s linear infinite;--ux:-18px;--uy:-10px}
@keyframes ssS1{0%,8%{opacity:0;transform:translate(0,0) scale(0)}18%{opacity:1;transform:translate(var(--dx),var(--dy)) scale(1)}28%{opacity:0;transform:translate(calc(var(--dx)*2.5),calc(var(--dy)*2.5)) scale(0)}50%,100%{opacity:0}}
@keyframes ssS2{0%,58%{opacity:0;transform:translate(0,0) scale(0)}68%{opacity:1;transform:translate(var(--ux),var(--uy)) scale(1)}80%{opacity:0;transform:translate(calc(var(--ux)*2.5),calc(var(--uy)*2.5)) scale(0)}100%{opacity:0}}
```

Replace with:
```css
/* canvas overlay */
.sword-canvas{position:absolute;top:-30px;left:-30px;width:calc(100% + 60px);height:calc(100% + 60px);pointer-events:none;z-index:5}
/* impact flash */
.sword-flash{position:absolute;inset:0;background:var(--bg);opacity:0;pointer-events:none;z-index:20;transition:opacity 180ms ease-out}
.sword-flash.active{opacity:0.45}
/* screen shake */
@keyframes sword-stage-shake{0%,100%{transform:translate(0,0)}20%{transform:translate(-2px,0)}40%{transform:translate(2px,0)}60%{transform:translate(-1px,0)}80%{transform:translate(1px,0)}}
.sword-stage--shake{animation:sword-stage-shake 280ms ease-out forwards}
```

- [ ] **Step 3: Verify the page hasn't broken**

Open `index.html` in browser. The sword should still animate (S1 + S2). Arc trails should still work. No console errors. No spark particles visible yet (canvas is empty until JS wires it up in Task 4).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: swap CSS sparks for canvas+flash infrastructure, add shake keyframe"
```

---

### Task 4: SwordFX JS module

**Files:**
- Modify: `js/script.js` (append after line 522)

- [ ] **Step 1: Append SwordFX IIFE to end of `js/script.js`**

Add after the last line of `js/script.js`:

```javascript

// ============================================
// SWORD FX — canvas particles + flash + shake
// ============================================
(function () {
  'use strict';

  const stage  = document.querySelector('.sword-stage');
  const group  = document.querySelector('.sword-group');
  if (!stage || !group) return;

  const canvas = stage.querySelector('.sword-canvas');
  const ctx    = canvas.getContext('2d');
  const flash  = stage.querySelector('.sword-flash');
  let W, H;

  function resizeCanvas() {
    const r = stage.getBoundingClientRect();
    W = r.width  + 60;
    H = r.height + 60;
    canvas.width  = W;
    canvas.height = H;
  }
  resizeCanvas();
  new ResizeObserver(resizeCanvas).observe(stage);

  // ── Particle system ──
  const particles = [];
  let animating = false;

  function spawnBurst(cx, cy, baseAngleDeg, spreadDeg) {
    const ink = getComputedStyle(document.documentElement)
      .getPropertyValue('--ink').trim() || '#111';
    for (let i = 0; i < 14; i++) {
      const a = ((baseAngleDeg + (Math.random() - 0.5) * 2 * spreadDeg) * Math.PI) / 180;
      const spd = 2.5 + Math.random() * 3.5;
      particles.push({
        x: cx + 30, y: cy + 30,   // +30 = canvas top/left offset
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size:   2 + Math.random() * 4,
        square: Math.random() > 0.5,
        color:  ink,
        life:   1,
        decay:  0.028 + Math.random() * 0.018,
      });
    }
    if (!animating) { animating = true; requestAnimationFrame(tick); }
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy    += 0.15;           // gravity
      p.x     += p.vx;
      p.y     += p.vy;
      p.life  -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle   = p.color;
      if (p.square) {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (particles.length > 0) requestAnimationFrame(tick);
    else animating = false;
  }

  // ── Flash + shake ──
  function triggerImpact() {
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 180);
    stage.classList.remove('sword-stage--shake');
    void stage.offsetWidth;                              // force reflow to restart animation
    stage.classList.add('sword-stage--shake');
    stage.addEventListener('animationend',
      () => stage.classList.remove('sword-stage--shake'), { once: true });
  }

  // ── Burst configs (stage-space coords; spawnBurst adds +30 for canvas offset) ──
  // S1: overhand peak — blade tip is in upper-right area of stage
  // S2: lateral peak  — blade tip is in upper-left area of stage
  const BURSTS = [
    { cx: 92, cy: 48,  angle:  45,  spread: 65 },  // S1 right-downward
    { cx: 42, cy: 38,  angle: -135, spread: 65 },  // S2 upper-leftward (mirror)
  ];
  // 22% × 8000ms = 1760ms (S1 overhand peak)
  // 88% × 8000ms = 7040ms (S2 lateral peak)
  const OFFSETS = [1760, 7040];

  // ── Timing sync ──
  // animationstart fires after the 1.6s CSS delay, marking loop t=0.
  // Each scheduleLoop call covers exactly one 8s iteration.
  let timers = [];

  function scheduleLoop() {
    timers.forEach(clearTimeout);
    timers = [];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    OFFSETS.forEach((offset, i) => {
      timers.push(setTimeout(() => {
        if (reduced) return;
        spawnBurst(BURSTS[i].cx, BURSTS[i].cy, BURSTS[i].angle, BURSTS[i].spread);
        triggerImpact();
      }, offset));
    });
    timers.push(setTimeout(scheduleLoop, 8000));
  }

  group.addEventListener('animationstart', scheduleLoop, { once: true });
})();
```

- [ ] **Step 2: Open browser, watch full 8s cycle**

Verify:
- S1 (overhand, ~2s mark): burst of 14 particles scatter right-downward from upper-right area; flash briefly lights the stage; stage shakes 3 times
- S2 (lateral, ~7s mark): identical burst mechanics but particles scatter upper-leftward from upper-left area; same flash + shake
- Particles have mixed sizes (2–6px), some square, some round
- Particles fall with gravity (arc downward after initial burst)
- Dark theme: switch theme mid-cycle — particles on next burst should use the new ink color

**Particle position tuning:** `BURSTS[0].cx/cy` and `BURSTS[1].cx/cy` are in stage coordinates (origin = stage top-left). If particles appear to come from the wrong spot, adjust these. The sword pivot is at approximately (75, 121) in stage coordinates, and the blade tip at S1 peak is ~(92, 48), at S2 peak ~(42, 38).

**Particle spread tuning:** `spread: 65` means ±65° from `angle`. Wider spread = more explosion-like; narrower = more directional.

- [ ] **Step 3: Commit**

```bash
git add js/script.js
git commit -m "feat: add SwordFX canvas particles, impact flash, and screen shake"
```
