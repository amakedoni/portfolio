#!/usr/bin/env node
// Draws the site's sticker set into assets/stickers.svg.
// Every line is a filled, variable-width brush shape rather than a stroke, which is what makes
// them read as inked illustrations. Fills use custom properties so a floor can recolour them.
const fs = require('node:fs');
const path = require('node:path');

const C = { pink: '--s-a,#ff4f93', yellow: '--s-b,#ffe11a', blue: '--s-c,#0a6ee0', mint: '--s-e,#00d9ae', orange: '--s-f,#ff7300', violet: '--s-g,#9a45bc', white: '--s-w,#fff', red: '--s-h,#ff2a00' };
const INK = '#000';

// ---- Seeded randomness and low-frequency wobble ----
let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const between = (a, b) => a + (b - a) * rand();
function wobbleFn(freq = 3) {
  const a = [between(0, 6.28), between(0, 6.28), between(0, 6.28)];
  return (t) => (Math.sin(t * 6.283 * freq + a[0]) + 0.6 * Math.sin(t * 6.283 * freq * 2.3 + a[1]) + 0.35 * Math.sin(t * 6.283 * freq * 4.1 + a[2])) / 1.95;
}

// ---- Curves ----
function catmull(points, closed, steps = 7) {
  const n = points.length;
  const at = (i) => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  const out = [];
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i += 1) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  if (!closed) out.push(points[n - 1]);
  return out;
}
const fmt = (n) => (Math.round(n * 10) / 10).toString();
function smooth(poly, closed = true) {
  // Quadratics through edge midpoints keep the file small and the line soft.
  const n = poly.length;
  if (n < 3) return poly.map((p, i) => `${i ? 'L' : 'M'}${fmt(p[0])} ${fmt(p[1])}`).join('');
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = closed ? `M${mid(poly[n - 1], poly[0]).map(fmt).join(' ')}` : `M${poly[0].map(fmt).join(' ')}`;
  const last = closed ? n : n - 1;
  for (let i = closed ? 0 : 1; i < last; i += 1) {
    const m = mid(poly[i], poly[(i + 1) % n]);
    d += `Q${fmt(poly[i][0])} ${fmt(poly[i][1])} ${fmt(m[0])} ${fmt(m[1])}`;
  }
  return `${d}${closed ? 'Z' : ''}`;
}
function normals(poly, closed) {
  const n = poly.length;
  return poly.map((p, i) => {
    const a = poly[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const b = poly[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  });
}
function area(poly) {
  let sum = 0;
  poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; sum += p[0] * q[1] - q[0] * p[1]; });
  return sum / 2;
}

// ---- Brush marks ----
const fill = (d, color) => `<path d="${d}" style="fill:var(${color})"/>`;
const ink = (d, rule) => `<path d="${d}" fill="${INK}"${rule ? ' fill-rule="evenodd"' : ''}/>`;

// A tapered stroke: thin at both ends, swelling through the middle.
function line(points, w = 4, { tipA = 0.3, tipB = 0.3, min = 0.08, steps = 4 } = {}) {
  const c = catmull(points, false, steps);
  const nor = normals(c, false);
  const wob = wobbleFn(2);
  const width = (t) => {
    const a = Math.min(1, t / Math.max(tipA, 0.001));
    const b = Math.min(1, (1 - t) / Math.max(tipB, 0.001));
    const body = Math.sin((a * Math.PI) / 2) * Math.sin((b * Math.PI) / 2);
    return (w / 2) * Math.max(min, body) * (1 + 0.16 * wob(t));
  };
  const left = c.map((p, i) => [p[0] + nor[i][0] * width(i / (c.length - 1)), p[1] + nor[i][1] * width(i / (c.length - 1))]);
  const right = c.map((p, i) => [p[0] - nor[i][0] * width(i / (c.length - 1)), p[1] - nor[i][1] * width(i / (c.length - 1))]).reverse();
  return ink(smooth(left.concat(right)));
}
// A closed colour shape with a brush contour that thickens and thins around its perimeter.
// Straight-edged outline: edges stay straight with a hand tremor, and corners stay crisp.
function polyline(points) {
  const out = [];
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const n = Math.max(2, Math.round(len / 34));
    const dx = (q[0] - p[0]) / len;
    const dy = (q[1] - p[1]) / len;
    // Doubled corner points keep the quadratic smoothing from rounding them off.
    out.push(p, p);
    for (let k = 1; k < n; k += 1) {
      const t = k / n;
      out.push([p[0] + (q[0] - p[0]) * t - dy * between(-0.8, 0.8), p[1] + (q[1] - p[1]) * t + dx * between(-0.8, 0.8)]);
    }
  });
  return out;
}
function shape(points, color, w = 5, { vary = 0.5, steps = 4, poly = false } = {}) {
  const c = poly ? polyline(points) : catmull(points, true, steps);
  const orient = area(c) > 0 ? 1 : -1;
  const nor = normals(c, true);
  const wob = wobbleFn(2.5);
  const outer = c.map((p, i) => {
    const t = i / c.length;
    const width = (w / 2) * (1 + vary * wob(t));
    return [p[0] - orient * nor[i][0] * width, p[1] - orient * nor[i][1] * width];
  });
  const inner = c.map((p, i) => {
    const t = i / c.length;
    const width = (w / 2) * (1 + vary * wob(t));
    return [p[0] + orient * nor[i][0] * width, p[1] + orient * nor[i][1] * width];
  });
  return `${fill(smooth(c), color)}${ink(`${smooth(outer)}${smooth(inner)}`, true)}`;
}
const solid = (points, steps = 6) => ink(smooth(catmull(points, true, steps)));
const dot = (x, y, r) => solid([[x - r, y], [x, y - r], [x + r, y], [x, y + r]], 5);
function circle(x, y, r, color, w = 4) {
  const pts = [];
  for (let i = 0; i < 8; i += 1) { const a = (i / 8) * 6.283; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  return shape(pts, color, w, { vary: 0.35, steps: 5 });
}
function eye(x, y, r, lookX = 0.3, lookY = 0.1, iris = C.blue) {
  return circle(x, y, r, C.white, Math.max(3, r * 0.2))
    + circle(x + r * lookX, y + r * lookY, r * 0.52, iris, Math.max(2, r * 0.1))
    + dot(x + r * lookX * 1.2, y + r * lookY * 1.2, r * 0.25);
}
// Parallel brush marks along a path, like engraving.
function hatch(a, b, n, w = 2.6, jitter = 0.08) {
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const t = (i + 0.5) / n + between(-jitter, jitter) / n;
    const start = [a[0][0] + (a[1][0] - a[0][0]) * t, a[0][1] + (a[1][1] - a[0][1]) * t];
    const end = [b[0][0] + (b[1][0] - b[0][0]) * t, b[0][1] + (b[1][1] - b[0][1]) * t];
    const midpoint = [(start[0] + end[0]) / 2 + between(-1.5, 1.5), (start[1] + end[1]) / 2 + between(-1.5, 1.5)];
    out += line([start, midpoint, end], w * between(0.75, 1.15));
  }
  return out;
}

// ---- The set ----
const stickers = {};

stickers.helmet = { box: [0, 0, 320, 310], draw() {
  let o = '';
  // Horsehair crest with strands that fan around the arc.
  const crest = [[92, 84], [108, 40], [160, 12], [222, 18], [272, 56], [302, 118], [306, 188], [286, 240], [264, 196], [250, 138], [222, 96], [180, 70], [132, 68]];
  o += shape(crest, C.pink, 6);
  for (let i = 0; i < 17; i += 1) {
    const t = i / 16;
    const a = -2.75 + t * 3.1;
    const r0 = 88 + between(-6, 6);
    const r1 = 142 + between(-12, 6);
    const cx = 188;
    const cy = 150;
    o += line([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a + 0.06) * ((r0 + r1) / 2), cy + Math.sin(a + 0.06) * ((r0 + r1) / 2)], [cx + Math.cos(a + 0.1) * r1, cy + Math.sin(a + 0.1) * r1]], 3.4);
  }
  // Crest holder.
  o += shape([[84, 92], [122, 62], [176, 54], [226, 78], [256, 124], [240, 136], [212, 96], [170, 78], [126, 84], [96, 108]], C.orange, 5);
  o += hatch([[110, 82], [232, 112]], [[116, 92], [222, 124]], 11, 2.4);
  // Bowl, cheek guards and flared neck, all one beaten-bronze shape.
  const bowl = [[64, 142], [82, 104], [122, 80], [172, 76], [216, 96], [246, 140], [252, 196], [244, 236], [268, 276], [226, 282], [194, 250], [178, 218], [164, 232], [158, 276], [128, 298], [104, 276], [104, 238], [84, 232], [72, 204], [84, 176], [60, 164]];
  o += shape(bowl, C.yellow, 7, { vary: 0.55 });
  // Eye socket, almond and off-kilter, with the wearer peering out.
  o += solid([[56, 160], [84, 138], [122, 134], [148, 150], [134, 172], [108, 184], [88, 178], [74, 168]]);
  o += eye(104, 158, 17, -0.32, 0.1);
  // Nose guard and engraved brow.
  o += line([[60, 134], [94, 110], [140, 106], [184, 124]], 6, { tipA: 0.2, tipB: 0.5 });
  o += line([[152, 148], [186, 148], [220, 170]], 4.5);
  o += line([[146, 190], [168, 196], [196, 226]], 4.5);
  o += line([[116, 206], [122, 240], [118, 272]], 4);
  o += line([[138, 204], [146, 240], [140, 280]], 3.4);
  o += line([[210, 112], [230, 146], [236, 188]], 4);
  o += line([[194, 110], [212, 140], [216, 166]], 3);
  // Cheek spiral.
  o += line([[186, 176], [204, 170], [216, 184], [206, 200], [192, 194], [198, 184]], 3.6, { tipA: 0.5, tipB: 0.5 });
  for (const [x, y] of [[230, 214], [222, 240], [242, 258]]) o += dot(x, y, 3.2);
  return o;
} };

stickers.sun = { box: [0, 0, 300, 300], draw() {
  let o = '';
  const cx = 150;
  const cy = 150;
  // Fourteen flames, none quite the same.
  for (let i = 0; i < 14; i += 1) {
    const a = (i / 14) * 6.283;
    const len = (i % 2 ? 118 : 146) + between(-8, 8);
    const base = 76;
    const bend = (i % 2 ? 0.14 : -0.14) + between(-0.04, 0.04);
    const spread = 0.21;
    const pts = [
      [cx + Math.cos(a - spread) * base, cy + Math.sin(a - spread) * base],
      [cx + Math.cos(a - spread * 0.4 + bend * 0.4) * ((base + len) / 2), cy + Math.sin(a - spread * 0.4 + bend * 0.4) * ((base + len) / 2)],
      [cx + Math.cos(a + bend) * len, cy + Math.sin(a + bend) * len],
      [cx + Math.cos(a + spread * 0.5 + bend * 0.4) * ((base + len) / 2), cy + Math.sin(a + spread * 0.5 + bend * 0.4) * ((base + len) / 2)],
      [cx + Math.cos(a + spread) * base, cy + Math.sin(a + spread) * base],
    ];
    o += shape(pts, i % 2 ? C.orange : C.yellow, 5);
    o += line([[cx + Math.cos(a) * (base + 8), cy + Math.sin(a) * (base + 8)], [cx + Math.cos(a + bend * 0.7) * (len - 22), cy + Math.sin(a + bend * 0.7) * (len - 22)]], 2.8);
  }
  // Almond eye on a disc.
  o += circle(cx, cy, 84, C.yellow, 7);
  o += shape([[70, 150], [100, 112], [150, 96], [200, 112], [230, 150], [200, 186], [150, 202], [100, 186]], C.white, 6);
  o += circle(cx - 2, cy + 2, 46, C.blue, 5);
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * 6.283;
    o += line([[148 + Math.cos(a) * 24, 152 + Math.sin(a) * 24], [148 + Math.cos(a) * 42, 152 + Math.sin(a) * 42]], 2.6);
  }
  o += circle(cx - 2, cy + 2, 22, '--ink,#000', 2);
  o += circle(cx + 8, cy - 8, 7, C.white, 1.5);
  // Heavy upper lid and lashes.
  o += line([[62, 148], [98, 104], [150, 86], [204, 104], [238, 148]], 9, { tipA: 0.2, tipB: 0.2 });
  o += line([[84, 186], [120, 206], [150, 210], [190, 204], [218, 184]], 4.5);
  return o;
} };

stickers.guitar = { box: [0, 0, 460, 240], draw() {
  let o = '';
  // Headstock and neck.
  o += shape([[352, 70], [402, 40], [450, 18], [456, 40], [438, 58], [444, 78], [414, 92], [364, 108]], C.yellow, 5);
  for (const [x, y] of [[392, 56], [416, 44], [438, 32]]) { o += circle(x, y, 5.5, C.white, 2.6); }
  for (const [x, y] of [[372, 92], [396, 82], [420, 72]]) { o += circle(x, y, 5.5, C.white, 2.6); }
  o += shape([[168, 112], [362, 66], [368, 100], [176, 148]], C.white, 5, { poly: true, vary: 0.3 });
  for (let i = 0; i < 9; i += 1) {
    const t = i / 8;
    const x0 = 192 + t * 162;
    const y0 = 106 - t * 36;
    o += line([[x0, y0], [x0 + 5, y0 + 30]], 3.2, { tipA: 0.1, tipB: 0.1, min: 0.5 });
    if (i % 2) o += dot(x0 + 11, y0 + 11, 2.6);
  }
  // Offset body with two horns.
  const body = [[20, 150], [30, 104], [68, 88], [108, 96], [140, 74], [196, 34], [216, 50], [194, 96], [198, 136], [226, 160], [214, 188], [176, 182], [136, 210], [84, 226], [40, 208]];
  o += shape(body, C.pink, 7, { vary: 0.55 });
  // Pickguard.
  o += shape([[92, 120], [132, 100], [176, 80], [176, 108], [168, 150], [146, 174], [112, 186], [86, 164]], C.white, 4.5);
  // Pickups, bridge, knobs.
  o += shape([[120, 124], [140, 118], [148, 148], [128, 154]], '--ink,#000', 2, { steps: 2 });
  o += shape([[154, 110], [170, 106], [176, 132], [160, 138]], '--ink,#000', 2, { steps: 2 });
  o += shape([[78, 136], [92, 132], [100, 164], [86, 170]], C.mint, 3.5, { steps: 2 });
  o += circle(58, 176, 9, C.yellow, 3.2);
  o += circle(84, 196, 9, C.yellow, 3.2);
  // Strings run the whole length.
  o += line([[88, 142], [240, 104], [412, 54]], 1.8, { tipA: 0.01, tipB: 0.01, min: 1 });
  o += line([[90, 152], [244, 112], [408, 66]], 1.8, { tipA: 0.01, tipB: 0.01, min: 1 });
  o += line([[93, 162], [248, 120], [404, 78]], 1.8, { tipA: 0.01, tipB: 0.01, min: 1 });
  // Shadow engraving on the body.
  o += line([[34, 158], [44, 196], [82, 216]], 5);
  o += line([[46, 150], [54, 182], [78, 200]], 3);
  o += line([[156, 196], [190, 178], [212, 176]], 4);
  o += line([[52, 104], [40, 124], [36, 140]], 3.4);
  return o;
} };

stickers.cubesat = { box: [0, 0, 480, 340], draw() {
  let o = '';
  // Telemetry flying off, a little swarm of packets.
  for (const [x, y, r] of [[60, 40, -20], [108, 22, 10], [352, 18, 25], [412, 52, -15], [440, 100, 30], [30, 96, 15], [388, 12, -30], [150, 8, 35]]) {
    const a = (r * Math.PI) / 180;
    const dx = Math.cos(a) * 15;
    const dy = Math.sin(a) * 15;
    o += shape([[x - dx, y - dy], [x - dx * 0.2 - dy * 0.3, y - dy * 0.2 + dx * 0.3], [x + dx * 0.2 - dy * 0.3, y + dy * 0.2 + dx * 0.3], [x + dx, y + dy], [x + dx * 0.2 + dy * 0.3, y + dy * 0.2 - dx * 0.3], [x - dx * 0.2 + dy * 0.3, y - dy * 0.2 - dx * 0.3]], C.mint, 2.6, { steps: 3 });
    o += circle(x, y, 4, C.yellow, 2);
  }
  // Solar wings.
  const wing = (quad, cols) => {
    let s = shape(quad, C.blue, 6, { poly: true, vary: 0.4 });
    const [a, b, c, d] = quad;
    const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    for (let i = 1; i < cols; i += 1) { const t = i / cols; s += line([lerp(a, b, t), lerp(d, c, t)], 3.4, { tipA: 0.05, tipB: 0.05, min: 0.4 }); }
    for (let i = 1; i < 3; i += 1) { const t = i / 3; s += line([lerp(a, d, t), lerp(b, c, t)], 3.4, { tipA: 0.05, tipB: 0.05, min: 0.4 }); }
    for (let i = 0; i < cols; i += 1) { const t0 = (i + 0.18) / cols; const t1 = (i + 0.5) / cols; s += line([lerp(lerp(a, d, 0.1), lerp(b, c, 0.1), t0), lerp(lerp(a, d, 0.28), lerp(b, c, 0.28), t1)], 2.2); }
    return s;
  };
  o += wing([[14, 112], [142, 146], [146, 262], [22, 226]], 4);
  o += wing([[334, 146], [466, 112], [458, 226], [330, 262]], 4);
  // Antenna and dish.
  o += line([[240, 74], [240, 34]], 5, { tipA: 0.05, tipB: 0.05, min: 0.6 });
  o += shape([[206, 28], [240, 44], [274, 28], [260, 10], [240, 16], [220, 10]], C.pink, 4);
  // Gold-foil top.
  o += shape([[240, 70], [344, 120], [240, 172], [136, 120]], C.yellow, 6, { poly: true, vary: 0.4 });
  o += hatch([[190, 96], [290, 96]], [[196, 148], [284, 148]], 12, 2.4);
  // Faces.
  o += shape([[136, 122], [240, 172], [240, 318], [136, 266]], C.white, 6, { poly: true, vary: 0.4 });
  o += shape([[240, 172], [344, 122], [344, 266], [240, 318]], C.pink, 6, { poly: true, vary: 0.4 });
  // A single watching eye and a vent grille.
  o += eye(188, 214, 30, -0.2, 0.08);
  o += line([[150, 158], [184, 176], [226, 196]], 3, { tipA: 0.15, tipB: 0.5 });
  o += line([[150, 262], [192, 284], [226, 300]], 3.4, { tipA: 0.2, tipB: 0.2 });
  for (let i = 0; i < 5; i += 1) {
    o += line([[264, 202 + i * 18], [322, 174 + i * 18]], 5, { tipA: 0.12, tipB: 0.12 });
  }
  o += dot(258, 296, 4);
  o += dot(324, 262, 4);
  return o;
} };

stickers.capsule = { box: [0, 0, 280, 380], draw() {
  let o = '';
  // Legs behind the body.
  o += shape([[96, 244], [120, 250], [108, 296], [112, 332], [84, 332], [80, 292]], C.yellow, 5);
  o += shape([[150, 252], [174, 248], [190, 296], [184, 334], [156, 332], [160, 296]], C.yellow, 5);
  o += line([[92, 276], [102, 282], [114, 276]], 2.6);
  o += line([[160, 280], [172, 286], [184, 278]], 2.6);
  // Sneakers with toecaps and laces.
  o += shape([[80, 326], [116, 324], [122, 354], [64, 366], [38, 358], [46, 340]], C.mint, 5);
  o += shape([[150, 330], [186, 328], [212, 344], [234, 358], [216, 370], [158, 362]], C.mint, 5);
  o += line([[44, 354], [70, 356], [118, 346]], 3.2);
  o += line([[160, 354], [196, 360], [228, 358]], 3.2);
  for (const [x, y] of [[78, 336], [90, 334], [102, 332]]) o += line([[x, y], [x + 4, y + 12]], 2.6);
  for (const [x, y] of [[172, 338], [184, 340], [196, 346]]) o += line([[x, y], [x - 4, y + 12]], 2.6);
  // Waving arm.
  o += shape([[70, 150], [40, 128], [28, 96], [12, 100], [24, 142], [62, 174]], C.yellow, 5);
  o += shape([[10, 94], [8, 70], [20, 72], [24, 58], [34, 66], [40, 82], [32, 100]], C.white, 3.6);
  o += shape([[222, 170], [262, 188], [272, 232], [250, 234], [244, 204], [218, 194]], C.yellow, 5);
  o += circle(258, 240, 11, C.white, 3.6);
  // Body: slightly lopsided, tilted, two-tone.
  const top = [[58, 150], [58, 96], [84, 42], [136, 22], [192, 42], [216, 94], [228, 146]];
  o += shape([[...top[0]], ...top.slice(1), [144, 172]], C.pink, 7);
  o += shape([[56, 150], [142, 168], [230, 146], [226, 210], [196, 262], [136, 278], [84, 258], [58, 208]], C.white, 7);
  o += line([[54, 150], [100, 164], [146, 170], [190, 162], [232, 146]], 7, { tipA: 0.04, tipB: 0.04, min: 0.5 });
  // Gleam and shading.
  o += line([[84, 110], [90, 72], [122, 46]], 5.5);
  o += line([[100, 92], [104, 76], [116, 66]], 3);
  o += line([[204, 196], [192, 234], [160, 258]], 5.5);
  o += line([[186, 206], [176, 232], [156, 244]], 3);
  // Eyes on stalks and a toothy grin.
  o += line([[104, 112], [96, 88]], 9, { tipA: 0.04, tipB: 0.04, min: 0.7 });
  o += line([[164, 110], [176, 84]], 9, { tipA: 0.04, tipB: 0.04, min: 0.7 });
  o += eye(92, 74, 27, 0.26, 0.2);
  o += eye(180, 70, 31, -0.2, 0.22);
  o += solid([[90, 186], [140, 196], [196, 180], [188, 226], [146, 246], [106, 232]]);
  o += shape([[100, 192], [114, 195], [116, 208], [103, 208]], C.white, 1.8, { steps: 2 });
  o += shape([[120, 196], [136, 198], [136, 212], [120, 212]], C.white, 1.8, { steps: 2 });
  o += shape([[141, 198], [158, 195], [158, 209], [142, 212]], C.white, 1.8, { steps: 2 });
  o += shape([[163, 194], [180, 189], [176, 205], [163, 208]], C.white, 1.8, { steps: 2 });
  o += shape([[122, 226], [150, 220], [168, 224], [150, 240], [130, 238]], C.pink, 2.4);
  return o;
} };

stickers.receipt = { box: [0, 0, 240, 370], draw() {
  let o = '';
  // A long curling till receipt, torn along the bottom.
  const edge = [[30, 28], [66, 16], [106, 26], [150, 14], [196, 22], [210, 80], [204, 150], [214, 228], [206, 300]];
  const torn = [];
  for (let i = 0; i <= 8; i += 1) {
    const t = i / 8;
    torn.push([206 - t * 176, (i % 2 ? 340 : 318) + (i === 4 ? 10 : 0)]);
  }
  const left = [[24, 240], [34, 160], [22, 90]];
  o += shape([...edge, ...torn, ...left], C.mint, 6, { steps: 4, vary: 0.45 });
  // Printed lines and a total.
  for (const [y, end] of [[252, 150], [268, 188], [284, 120]]) o += line([[48, y], [(48 + end) / 2, y + 2], [end, y - 1]], 4.5, { tipA: 0.06, tipB: 0.16 });
  o += line([[160, 286], [190, 284]], 8, { tipA: 0.06, tipB: 0.06, min: 0.6 });
  // Curled corner.
  o += shape([[172, 18], [212, 14], [216, 58], [196, 48], [184, 34]], C.white, 4);
  // Bulging eyes.
  o += eye(78, 74, 32, 0.24, 0.16);
  o += eye(150, 76, 26, -0.26, 0.2);
  o += line([[44, 44], [76, 30], [110, 44]], 5);
  o += line([[128, 52], [150, 42], [176, 54]], 4.5);
  // A mouth too big for the paper.
  o += solid([[36, 124], [104, 134], [188, 118], [180, 186], [116, 226], [56, 196]]);
  const teethTop = [[44, 127], [66, 130], [88, 132], [110, 133], [132, 130], [156, 126], [180, 122]];
  for (let i = 0; i < teethTop.length - 1; i += 1) {
    const [a, b] = [teethTop[i], teethTop[i + 1]];
    o += shape([a, b, [(a[0] + b[0]) / 2 + between(-2, 2), a[1] + between(20, 28)]], C.white, 2, { steps: 2 });
  }
  const teethLow = [[62, 190], [84, 204], [108, 214], [132, 208], [156, 194]];
  for (let i = 0; i < teethLow.length - 1; i += 1) {
    const [a, b] = [teethLow[i], teethLow[i + 1]];
    o += shape([a, b, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - between(16, 22)]], C.white, 2, { steps: 2 });
  }
  o += shape([[92, 176], [128, 166], [154, 176], [134, 196], [106, 196]], C.pink, 3);
  o += line([[108, 178], [124, 182], [134, 178]], 2.6);
  return o;
} };

stickers.plane = { box: [0, 0, 420, 280], draw() {
  let o = '';
  // Dashed flight trail.
  const trail = [[8, 262], [46, 268], [84, 250], [110, 222]];
  const c = catmull(trail, false, 12);
  for (let i = 0; i + 4 < c.length; i += 7) o += line([c[i], c[i + 2], c[i + 4]], 4.5, { tipA: 0.3, tipB: 0.3 });
  o += shape([[408, 14], [120, 196], [150, 262], [214, 192]], C.blue, 6, { poly: true, vary: 0.45 });
  o += shape([[408, 14], [214, 192], [310, 236]], C.yellow, 6, { poly: true, vary: 0.45 });
  o += shape([[408, 14], [46, 146], [120, 196]], C.white, 6, { poly: true, vary: 0.45 });
  o += line([[392, 26], [240, 120], [130, 186]], 3.4, { tipA: 0.1, tipB: 0.2 });
  o += line([[390, 34], [262, 148], [168, 232]], 3, { tipA: 0.1, tipB: 0.3 });
  o += line([[110, 142], [150, 118], [196, 100]], 3);
  o += line([[286, 190], [320, 142], [352, 98]], 3);
  return o;
} };

stickers.bug = { box: [0, 0, 300, 300], draw() {
  let o = '';
  const legL = (pts) => { const [a, b, c, d] = pts; const off = 6; return shape([a, b, c, d, [c[0] + off, c[1] + off], [b[0] + off, b[1] + off], [a[0] + off, a[1] + off]], C.orange, 4.2); };
  for (const s of [1, -1]) {
    const m = (x) => 150 + (x - 150) * s;
    o += legL([[m(100), 124], [m(58), 96], [m(44), 58], [m(26), 42]]);
    o += legL([[m(92), 160], [m(46), 156], [m(18), 176], [m(8), 168]]);
    o += legL([[m(100), 204], [m(62), 226], [m(50), 268], [m(30), 288]]);
    o += shape([[m(136), 50], [m(116), 26], [m(88), 16], [m(68), 28], [m(90), 24], [m(112), 36]], C.yellow, 3.6);
    for (const [x, y] of [[m(48), 84], [m(30), 158], [m(52), 242]]) o += line([[x, y], [x + 8 * s, y + 8]], 2.4);
  }
  o += shape([[118, 46], [150, 32], [182, 46], [186, 74], [150, 86], [114, 74]], C.orange, 5);
  o += eye(130, 56, 12, -0.2, 0.2);
  o += eye(170, 56, 12, 0.2, 0.2);
  o += shape([[96, 96], [150, 76], [204, 96], [210, 122], [150, 134], [90, 122]], C.yellow, 5);
  o += hatch([[112, 96], [188, 96]], [[106, 118], [194, 118]], 9, 2.4);
  // Wing cases with curly braces engraved on them, because it is a bug.
  o += shape([[88, 124], [148, 128], [150, 282], [112, 268], [84, 216], [78, 164]], C.mint, 6);
  o += shape([[212, 124], [152, 128], [150, 282], [188, 268], [216, 216], [222, 164]], C.mint, 6);
  o += line([[124, 160], [108, 166], [114, 188], [98, 200], [114, 212], [108, 234], [124, 240]], 5, { tipA: 0.15, tipB: 0.15 });
  o += line([[176, 160], [192, 166], [186, 188], [202, 200], [186, 212], [192, 234], [176, 240]], 5, { tipA: 0.15, tipB: 0.15 });
  o += line([[92, 136], [86, 172], [98, 220]], 3);
  o += line([[208, 136], [214, 172], [202, 220]], 3);
  return o;
} };

stickers.laurel = { box: [0, 0, 170, 360], draw() {
  let o = '';
  const stem = [[132, 350], [98, 296], [66, 226], [52, 150], [62, 76], [96, 14]];
  const c = catmull(stem, false, 12);
  o += line(stem, 6, { tipA: 0.04, tipB: 0.3, min: 0.3 });
  for (let i = 4; i < c.length - 2; i += 6) {
    const p = c[i];
    const q = c[i + 1];
    const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
    for (const side of [-1, 1]) {
      const len = between(46, 58) * (1 - (i / c.length) * 0.3);
      const dir = a + side * 0.75;
      const tip = [p[0] + Math.cos(dir) * len, p[1] + Math.sin(dir) * len];
      const m = [p[0] + Math.cos(dir) * len * 0.5, p[1] + Math.sin(dir) * len * 0.5];
      const nx = Math.cos(dir + 1.57) * len * 0.2;
      const ny = Math.sin(dir + 1.57) * len * 0.2;
      o += shape([p, [m[0] + nx, m[1] + ny], tip, [m[0] - nx, m[1] - ny]], (i + (side > 0 ? 0 : 3)) % 12 < 6 ? C.mint : C.yellow, 3.6);
      o += line([p, m, [tip[0] * 0.9 + m[0] * 0.1, tip[1] * 0.9 + m[1] * 0.1]], 2.2);
    }
  }
  return o;
} };

stickers.sword = { box: [0, 0, 110, 400], draw() {
  let o = '';
  // Leaf-bladed xiphos.
  o += shape([[55, 6], [76, 70], [84, 150], [74, 230], [70, 280], [40, 280], [36, 230], [26, 150], [34, 70]], C.white, 5);
  o += line([[55, 34], [56, 150], [55, 272]], 5, { tipA: 0.1, tipB: 0.02, min: 0.5 });
  o += line([[66, 90], [70, 160], [62, 240]], 2.6);
  o += shape([[10, 282], [100, 278], [96, 300], [56, 306], [14, 302]], C.yellow, 5);
  o += hatch([[26, 286], [86, 284]], [[28, 298], [84, 296]], 8, 2);
  o += shape([[38, 304], [72, 304], [70, 366], [40, 366]], C.pink, 5, { steps: 2 });
  o += hatch([[40, 314], [40, 356]], [[70, 306], [70, 348]], 6, 3);
  o += circle(55, 380, 15, C.yellow, 4.5);
  return o;
} };

stickers.fist = { box: [0, 0, 420, 290], draw() {
  let o = '';
  // Wrist.
  o += shape([[150, 192], [230, 182], [252, 268], [136, 280]], C.violet, 6, { vary: 0.5 });
  o += line([[150, 266], [196, 270], [242, 258]], 4.5);
  o += line([[172, 212], [170, 240], [176, 256]], 3.6);
  o += line([[214, 206], [220, 234], [216, 254]], 3.6);
  // The sword runs behind the fingers.
  o += shape([[10, 104], [46, 92], [130, 84], [130, 132], [46, 122]], C.yellow, 5);
  o += hatch([[60, 96], [124, 90]], [[60, 118], [124, 124]], 7, 2.8);
  o += circle(12, 108, 11, C.pink, 4);
  o += shape([[126, 46], [146, 46], [150, 170], [130, 170]], C.pink, 5, { poly: true, vary: 0.35 });
  o += shape([[262, 78], [340, 62], [414, 84], [340, 110], [262, 124]], C.white, 6);
  o += line([[272, 100], [340, 88], [398, 84]], 4, { tipA: 0.05, tipB: 0.25 });
  o += line([[286, 86], [336, 76], [372, 76]], 2.4);
  const finger = (y) => shape([[118, y], [158, y - 16], [216, y - 22], [262, y - 14], [278, y + 2], [264, y + 18], [214, y + 22], [156, y + 26], [122, y + 22]], C.violet, 5);
  for (const y of [58, 92, 126, 160]) o += finger(y);
  for (const y of [58, 92, 126, 160]) {
    o += shape([[250, y - 12], [270, y - 8], [276, y + 2], [266, y + 10], [250, y + 6]], C.yellow, 3);
    o += line([[188, y - 12], [196, y], [190, y + 14]], 3);
    o += line([[150, y - 4], [156, y + 6], [152, y + 18]], 2.4);
  }
  // Thumb clamped over the grip.
  o += shape([[118, 176], [154, 134], [206, 94], [230, 96], [232, 118], [192, 156], [156, 196], [124, 200]], C.violet, 5.5);
  o += shape([[206, 96], [226, 94], [232, 110], [218, 118], [206, 110]], C.yellow, 3);
  o += line([[150, 150], [162, 160], [168, 176]], 3.2);
  return o;
} };

// Heraldic crest: reuses the other symbols, then adds an inked ribbon.
stickers.crest = { box: [0, 0, 1000, 640], draw() {
  const use = (name, x, y, w, h, extra = '') => `<use href="#s-${name}" x="${x}" y="${y}" width="${w}" height="${h}"${extra}/>`;
  let o = '';
  // Swords crossed behind everything, points up and out.
  o += `<g transform="rotate(-58 500 300)">${use('sword', 430, -80, 140, 560)}</g>`;
  o += `<g transform="rotate(58 500 300)">${use('sword', 430, -80, 140, 560)}</g>`;
  o += use('laurel', 170, 70, 180, 382);
  o += `<g transform="translate(1000 0) scale(-1 1)">${use('laurel', 170, 70, 180, 382)}</g>`;
  o += use('sun', 286, 0, 428, 428);
  o += use('helmet', 346, 56, 318, 308);
  return o;
} };

// ---- Output ----
const rendered = {};
for (const name of ['helmet', 'sun', 'guitar', 'cubesat', 'capsule', 'receipt', 'plane', 'bug', 'laurel', 'sword', 'fist']) {
  rendered[name] = stickers[name].draw();
}
rendered.crest = stickers.crest.draw();

// Ribbon and lettering are added by build step below so glyph outlines stay exact.
function ribbon() {
  let o = '';
  // Swallowtail ends, folded behind.
  o += shape([[34, 448], [186, 410], [206, 516], [58, 556], [96, 498]], C.white, 6, { steps: 3, vary: 0.45 });
  o += shape([[966, 448], [814, 410], [794, 516], [942, 556], [904, 498]], C.white, 6, { steps: 3, vary: 0.45 });
  o += shape([[170, 420], [206, 408], [204, 484], [186, 470]], '--ink,#000', 2, { steps: 2 });
  o += shape([[830, 420], [794, 408], [796, 484], [814, 470]], '--ink,#000', 2, { steps: 2 });
  o += line([[64, 470], [110, 462], [160, 450]], 3.4);
  o += line([[936, 470], [890, 462], [840, 450]], 3.4);
  // Main band.
  const top = [[150, 410], [330, 444], [500, 456], [670, 444], [850, 410]];
  const bottom = [[838, 504], [670, 544], [500, 556], [330, 544], [162, 504]];
  o += shape([...top, ...bottom], C.white, 7, { vary: 0.4 });
  return o;
}
let glyphBand = '';
try {
  const opentype = require('opentype.js');
  const file = process.argv[2];
  if (file) {
    const b = fs.readFileSync(file);
    const font = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
    const text = 'ALEXANDER MAKEDONSKIY';
    const size = 62;
    const scale = size / font.unitsPerEm;
    const widths = [...text].map((ch) => font.charToGlyph(ch).advanceWidth * scale + 3);
    const total = widths.reduce((sum, w) => sum + w, 0);
    // Follow the band's centre line: a shallow arc, 500 across at its lowest.
    let x = 500 - total / 2;
    let d = '';
    [...text].forEach((ch, i) => {
      const w = widths[i];
      const cx = x + w / 2;
      const u = (cx - 500) / 320;
      const y = 526 - 42 * u * u;
      const rot = Math.atan2(-84 * u / 320, 1);
      const glyph = font.charToGlyph(ch).getPath(-(w - 3) / 2, 0, size);
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const tx = (px, py) => `${fmt(cx + px * cos - py * sin)} ${fmt(y + px * sin + py * cos)}`;
      for (const c of glyph.commands) {
        if (c.type === 'M' || c.type === 'L') d += `${c.type}${tx(c.x, c.y)}`;
        else if (c.type === 'Q') d += `Q${tx(c.x1, c.y1)} ${tx(c.x, c.y)}`;
        else if (c.type === 'C') d += `C${tx(c.x1, c.y1)} ${tx(c.x2, c.y2)} ${tx(c.x, c.y)}`;
        else if (c.type === 'Z') d += 'Z';
      }
      x += w;
    });
    glyphBand = `<path d="${d}" fill="${INK}"/>`;
  }
} catch (error) {
  console.warn(`Crest lettering skipped: ${error.message}`);
}
rendered.crest += ribbon() + glyphBand;

const symbols = Object.entries(rendered).map(([name, body]) => `<symbol id="s-${name}" viewBox="${stickers[name].box.join(' ')}">${body}</symbol>`).join('\n');
const output = path.resolve(__dirname, '..', 'assets', 'stickers.svg');
fs.writeFileSync(output, `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols}\n</svg>\n`);
console.log(Object.entries(rendered).map(([name, body]) => `${name} ${(body.length / 1024).toFixed(1)}KB`).join(', '));
console.log(`assets/stickers.svg ${(fs.statSync(output).size / 1024).toFixed(0)}KB`);
