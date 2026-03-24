# Mobile CSS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `mobile.css` with targeted overrides that fix the portfolio layout on 390px screens without touching any existing files except adding one `<link>` tag to `index.html`.

**Architecture:** New standalone `mobile.css` file linked last in `index.html` (after `style.css` and `a11y.css`). All rules scoped to `@media (max-width: 480px)`. Where `style.css` uses `!important`, overrides also use `!important`.

**Tech Stack:** Plain CSS, no build tools, no dependencies.

---

## File Map

| File | Action |
|------|--------|
| `mobile.css` | **Create** — all mobile overrides |
| `index.html` | **Modify** — add one `<link>` tag after line with `a11y.css` |

---

### Task 1: Create mobile.css

**Files:**
- Create: `mobile.css`

- [ ] **Step 1: Create the file with all mobile overrides**

Create `/Users/alexander/Documents/portfolio/mobile.css` with this exact content:

```css
/* =====================================================
   mobile.css — Mobile overrides for 390px (iPhone 14)
   Loaded after style.css and a11y.css.
   All rules scoped to max-width: 480px.
   ===================================================== */

@media (max-width: 480px) {

  /* --- General layout --- */
  .container {
    padding: 0 1rem;
  }

  /* --- Hero section --- */
  .hero-typing-line,
  .hero-content .typing-text,
  .hero-content .typing-cursor {
    font-size: 1.5rem;
  }

  .hero-description {
    font-size: 1rem;
    line-height: 1.6;
  }

  .cta-button {
    width: 100% !important;
    font-size: 1.05rem;
    padding: 1.1rem;
    display: block;
    text-align: center;
  }

  /* --- About section --- */
  .about-image {
    height: 220px !important;
  }

  .profile-photo-wrapper {
    width: 100%;
  }

  /* --- Timeline list items --- */
  .timeline-item li,
  .timeline-item p {
    font-size: 0.9rem;
  }

  /* --- Contact section --- */
  /* Override the column layout set at 768px in style.css */
  .contact-item {
    flex-direction: row !important;
    align-items: center !important;
    text-align: left !important;
    gap: 1rem !important;
  }

  /* Contact form */
  .contact-form input,
  .contact-form textarea {
    width: 100%;
    padding: 0.75rem;
  }

  .contact-form button[type="submit"] {
    width: 100%;
    min-height: 44px;
  }

}
```

- [ ] **Step 2: Verify the file was created**

```bash
cat /Users/alexander/Documents/portfolio/mobile.css
```

Expected: file content printed, no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/alexander/Documents/portfolio
git add mobile.css
git commit -m "feat: add mobile.css with 390px overrides"
```

---

### Task 2: Link mobile.css in index.html

**Files:**
- Modify: `index.html` — find the line with `a11y.css` and add mobile.css after it

- [ ] **Step 1: Find the a11y.css line**

```bash
grep -n "a11y.css" /Users/alexander/Documents/portfolio/index.html
```

Expected output: something like `101:    <link rel="stylesheet" href="a11y.css">`

- [ ] **Step 2: Add the mobile.css link tag after a11y.css**

In `index.html`, after the line:
```html
    <link rel="stylesheet" href="a11y.css">
```

Add:
```html
    <link rel="stylesheet" href="mobile.css">
```

- [ ] **Step 3: Verify the link order**

```bash
grep -n "stylesheet" /Users/alexander/Documents/portfolio/index.html | grep -E "style|a11y|mobile"
```

Expected: three lines in order — `style.css`, `a11y.css`, `mobile.css`.

- [ ] **Step 4: Commit**

```bash
cd /Users/alexander/Documents/portfolio
git add index.html
git commit -m "feat: link mobile.css in index.html"
```

---

### Task 3: Manual verification

- [ ] **Step 1: Open the site in a browser**

Open `file:///Users/alexander/Documents/portfolio/index.html` in Chrome/Safari.

- [ ] **Step 2: Enable mobile emulation**

In DevTools (F12): toggle device toolbar → select **iPhone 14 Pro** (390×844) or set custom 390px width.

- [ ] **Step 3: Check each section**

Go through the page and verify:
- [ ] Hero: description text is readable, CTA button fills the width
- [ ] About: photo is 220px tall, not 300px or 380px
- [ ] Timeline: list item text is slightly smaller, fits without overflow
- [ ] Contact: items show icon on the LEFT, text on the RIGHT (horizontal, not stacked)
- [ ] No horizontal scroll at any section

- [ ] **Step 4: Check dark theme**

Toggle dark theme (moon icon) and repeat the visual check.

- [ ] **Step 5: If anything looks off, fix in mobile.css and reload**

No commit needed until satisfied.

- [ ] **Step 6: Final commit if any fixes were made**

```bash
cd /Users/alexander/Documents/portfolio
git add mobile.css
git commit -m "fix: adjust mobile.css after visual review"
```
