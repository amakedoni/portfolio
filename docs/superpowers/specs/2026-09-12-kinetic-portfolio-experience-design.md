# Kinetic Portfolio Experience Design

**Date:** 2026-09-12

**Status:** Approved for implementation planning

**Primary audience:** Technical recruiters, engineering leads, and technically sophisticated clients

## Summary

Evolve the existing portfolio into a polished kinetic editorial experience without changing its established visual identity. The monochrome palette, Gothic display typography, monospaced metadata, restrained radii, strong borders, and physical offset shadows remain the core language. The improvement comes from better visual hierarchy, richer component detail, and a coherent motion system that guides visitors from introduction to contact.

The chosen direction is **kinetic editorial**: the page should feel like a high-end interactive engineering magazine rather than a generic animated portfolio or a WebGL experiment.

## Goals

- Make the first visit memorable while keeping projects and contact details easy to scan.
- Give every section a distinct moment without making the page feel like a collection of unrelated effects.
- Create one consistent motion language for scrolling, hovering, pressing, filtering, theme changes, and content reveals.
- Add visual depth and technical detail while preserving the current color, typography, border, and shadow system.
- Keep the site fast, dependency-free, keyboard accessible, and comfortable on mobile and reduced-motion devices.
- Ensure failures in decorative JavaScript never hide content or break core interactions.

## Non-goals

- No redesign into a different aesthetic.
- No new bright accent palette, glassmorphism, or soft SaaS-style components.
- No scroll hijacking, custom inertial page scrolling, audio, WebGL, canvas-heavy effects, or artificial loading delay.
- No runtime animation libraries.
- No conversion of non-linked project cards into false links.
- No content-management system or backend changes.

## Experience Principles

### 1. Motion communicates hierarchy

Large structural movement belongs to section entrances and page navigation. Component movement belongs to hover, focus, filtering, and state changes. Decorative movement stays subtle and stops when it is not visible.

### 2. Physical behavior remains consistent

Interactive surfaces use the existing upward-left lift and stronger offset shadow. Pressed states move toward the original shadow. Inner details may move at smaller distances, but they must reinforce the same physical direction.

### 3. One page, one rhythm

Use shared motion tokens and a small set of easing curves. Entrance sequences use staggered timing; interaction feedback is faster; ambient movement is slower. Section-specific choreography may vary, but its timing and direction must feel related.

### 4. Progressive enhancement first

HTML is readable and usable before JavaScript runs. Elements become revealable only after a `motion-ready` class is applied. If a motion controller fails, the affected content remains visible and all links, navigation, filters, theme controls, language controls, and contact actions continue to work.

## Visual Layer

### Background and page frame

- Add a very low-contrast grain or paper texture with CSS, not an image download.
- Add sparse technical registration marks or grid intersections at selected section boundaries.
- Add a thin top scroll-progress rule that uses existing ink and line tokens.
- Avoid persistent decoration behind dense text areas.

### Navigation

- Indicate the active section using the existing underline language.
- Animate the underline between states rather than abruptly toggling it.
- Pair the active state with a compact section index that updates as the visitor scrolls.
- Keep the sticky header compact and preserve current responsive behavior.

### Cursor and interaction labels

- Keep the existing custom cursor concept on fine pointers only.
- Add short context labels such as `VIEW`, `OPEN`, `FILTER`, and `SEND` for genuinely interactive targets.
- Do not show action labels on secondary project cards because they are not links.
- Disable cursor enhancement for touch input and reduced motion.

## Motion System

### Motion levels

1. **Macro:** page progress, active-section state, hero entrance, section choreography.
2. **Component:** cards, project device, skills filtering, timeline, GitHub cells, contact form.
3. **Micro:** buttons, links, icons, focus rings, field borders, cursor labels.

### Tokens

Retain and extend the current token model:

- fast feedback: approximately 160-200 ms;
- ordinary UI transitions: approximately 260-340 ms;
- component reveals: approximately 500-700 ms;
- section choreography: approximately 700-950 ms;
- one expressive ease-out curve for entrances and physical lifts;
- one restrained ease-in-out curve for theme and state transitions.

Exact values may be tuned during browser verification, but equivalent interactions must share tokens rather than use arbitrary durations.

### Motion constraints

- Prefer `transform`, `opacity`, and CSS custom properties.
- Run continuous pointer and scroll work through one scheduled animation-frame loop.
- Pause ambient effects when their section is outside the viewport.
- Do not animate large blur filters or properties that cause repeated layout.
- Limit pointer parallax to a few pixels and card rotation to less than one degree.

## Section Choreography

### Hero

- Reveal heading rows through clipped vertical masks with a short stagger.
- Bring in metadata, lede, role rotator, and CTAs in a deliberate reading order.
- Add a restrained pointer response to the accent word without compromising text readability.
- Keep the opening fast: animation begins as soon as the document is ready and never delays access.

### Technology marquee

- Preserve the infinite strip.
- Add mild velocity response to scroll direction and speed, with a gradual return to its baseline.
- Pause or simplify it for reduced motion and when it is well outside the viewport.

### About

- Reveal the portrait with a monochrome graphical shutter.
- Allow the photo to move subtly inside its fixed frame on fine pointers.
- Stagger counters rather than starting all values simultaneously.
- Keep the quote and text stable; typography should remain the primary visual anchor.

### Featured project

- Give the Finly device shallow pointer depth while the containing card retains its existing physical lift.
- Draw the chart line when the project first enters the viewport.
- Reveal the balance and transaction rows in sequence.
- Add small motion to chips and action arrows only during direct interaction.

### Secondary projects and recognition

- Preserve the restored card hover lift on both secondary cards.
- Animate internal number, divider, and stack details without implying that the cards are clickable.
- Give recognition rows a restrained directional hover and focus response only where an actual link is introduced; otherwise use entrance choreography only.

### Skills

- Use FLIP-style position transitions when filtering categories so the container does not jump.
- Add monochrome proficiency tracks that fill when the section first enters view.
- Keep the numeric values visible and do not imply false precision beyond the existing content.
- Animate selected tab state through border, background, and a small physical press response.

### Education

- Connect cards with a responsive timeline rule.
- Draw the rule as the section enters the viewport, followed by staggered card entrances.
- Collapse the rule into a vertical mobile timeline without changing document order.

### GitHub activity

- Populate contribution cells in a short wave rather than simultaneous independent pops.
- Provide a compact tooltip on hover or keyboard focus containing the cell label and illustrative activity level.
- Preserve the existing disclosure that the graph is an illustrative snapshot.

### Contact

- Animate field borders and labels on focus without moving surrounding layout.
- Give contact-channel arrows directional movement and keep their full keyboard focus state.
- Provide clear submit feedback before opening the prepared email draft.
- End the page with a restrained footer entrance rather than a new visual climax.

### Theme and language changes

- Replace the generic theme crossfade with a short transition originating near the toggle when View Transitions are supported.
- Fall back to immediate token changes when unsupported or when reduced motion is enabled.
- Keep language changes stable: text must not animate in a way that makes translated content hard to follow or causes prolonged layout instability.

## Technical Architecture

Create `js/motion.js` as the single entry point for decorative motion. It coordinates small controllers with explicit responsibilities:

- `MotionPreferences`: reads reduced-motion, pointer precision, viewport size, and page visibility.
- `RevealController`: registers reveal groups and applies stagger indices.
- `ScrollDirector`: calculates normalized page progress, active section, and marquee velocity.
- `PointerController`: supplies normalized pointer coordinates for magnetic controls and shallow parallax.
- Section adapters: initialize hero, about, projects, skills, education, GitHub, and contact behaviors only when their required elements exist.

The controllers communicate through DOM state and CSS custom properties instead of importing a framework. Existing language, theme, menu, and contact behavior remain independent. Decorative controllers must tolerate missing elements and may be initialized more than once without duplicating listeners.

## Data and State Flow

1. On DOM readiness, `MotionPreferences` determines the active capability profile.
2. The document receives capability classes and `motion-ready` only after content-safe initialization.
3. Intersection observers activate section scenes once and pause ambient scenes when hidden.
4. Scroll and pointer listeners record input values; one animation-frame scheduler writes CSS variables.
5. Theme and language events trigger only the recalculations needed by affected motion components.
6. Visibility changes pause continuous work and resume it without replaying completed entrances.

No decorative state is persisted. Existing theme and language preferences remain the only local storage values used by the experience.

## Accessibility and Fallbacks

- `prefers-reduced-motion: reduce` removes parallax, magnetic movement, animated cursor labels, marquee velocity response, stagger delays, and counting animation.
- Reduced-motion users receive immediate final visual states rather than near-zero-duration multi-step sequences.
- Hover enhancements have equivalent visible `:focus-visible` states where the element is interactive.
- Tooltips are available on keyboard focus and do not contain essential information.
- Touch devices receive tap feedback but no hover-only meaning.
- Page content remains visible with JavaScript disabled.
- The existing skip link, menu Escape handling, focus restoration, labels, and semantic headings remain intact.

## Performance Requirements

- Add no runtime dependencies and no additional remote assets.
- Keep continuous animation work to one `requestAnimationFrame` coordinator.
- Do not perform layout reads after layout writes in the same animation frame.
- Avoid continuous work on touch-only devices and hidden tabs.
- Keep the document free from horizontal overflow at 360 px and above.
- Preserve a responsive experience at representative widths of 360, 390, 768, 1280, and 1600 px.

## Testing and Verification

Extend `tests/portfolio-ui.test.cjs` to cover:

- content visibility when decorative motion is unavailable;
- active navigation and scroll-progress updates;
- reduced-motion final states and absence of decorative JavaScript motion;
- fine-pointer-only cursor labels, magnetic controls, and parallax;
- stable skills layout and state during filtering;
- secondary project cards retaining their shared physical lift and non-link affordance;
- mobile overflow, menu operation, and touch-safe motion;
- theme and language switching after the new motion initialization;
- no page errors during initial load and representative interactions.

Perform visual browser checks in light and dark themes on desktop and mobile. Validate the hero, featured project, secondary projects, skills, education, GitHub, and contact scenes at rest and during interaction.

## Acceptance Criteria

- The site still reads immediately as the same portfolio and visual brand.
- Every major section has intentional visual choreography without competing for attention.
- Repeated interaction types use the same motion direction, duration class, and easing.
- All essential content and controls work when decorative motion is disabled or fails.
- Reduced-motion and touch experiences feel designed, not merely switched off.
- No new console errors, keyboard traps, false link affordances, or horizontal overflow are introduced.
- The existing browser test suite and the new motion regression tests pass.
- The service-worker cache version is updated for changed production assets.

## Implementation Boundary

This work may modify `index.html`, `js/cursor.js`, add `js/motion.js`, update `sw.js`, and extend `tests/portfolio-ui.test.cjs`. Changes to `404.html` are limited to shared motion-token consistency if required. Content wording, project claims, contact destinations, resume files, and the overall information architecture remain unchanged unless a concrete implementation issue requires a separately approved correction.
