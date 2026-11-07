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
// Half-unit precision keeps the sprite small; lettering needs the finer grid, or small text distorts.
const fmt = (n) => (Math.round(n * 2) / 2).toString();
const fmtFine = (n) => (Math.round(n * 10) / 10).toString();
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
function line(points, w = 4, { tipA = 0.3, tipB = 0.3, min = 0.08, steps = 3 } = {}) {
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
    const dx = (q[0] - p[0]) / (len || 1);
    const dy = (q[1] - p[1]) / (len || 1);
    // Doubled corner points keep the quadratic smoothing from rounding them off.
    out.push(p, p);
    for (let k = 1; k < n; k += 1) {
      const t = k / n;
      out.push([p[0] + (q[0] - p[0]) * t - dy * between(-0.8, 0.8), p[1] + (q[1] - p[1]) * t + dx * between(-0.8, 0.8)]);
    }
  });
  return out;
}
function shape(points, color, w = 5, { vary = 0.5, steps = 3, poly = false } = {}) {
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

const stickers = {};

// ---- Heraldic crest: white engraving on the page colour, drawn for this site alone ----
let crestFont = null;
try {
  const opentype = require('opentype.js');
  if (process.argv[2]) {
    const b = fs.readFileSync(process.argv[2]);
    crestFont = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  }
} catch (error) {
  console.warn(`Crest lettering skipped: ${error.message}`);
}

// Sets capitals along a curve, centred on it, one outline per letter.
function textOn(text, size, points, { track = 0, color = null, align = 'centre' } = {}) {
  if (!crestFont) return '';
  const c = catmull(points, false, 24);
  const lengths = [0];
  for (let i = 1; i < c.length; i += 1) lengths.push(lengths[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]));
  const total = lengths[lengths.length - 1];
  const scale = size / crestFont.unitsPerEm;
  const widths = [...text].map((ch) => crestFont.charToGlyph(ch).advanceWidth * scale + track);
  const run = widths.reduce((sum, w) => sum + w, 0) - track;
  const cap = size * 0.711;
  const at = (s) => {
    let i = 1;
    while (i < c.length - 1 && lengths[i] < s) i += 1;
    const t = (s - lengths[i - 1]) / ((lengths[i] - lengths[i - 1]) || 1);
    return [[c[i - 1][0] + (c[i][0] - c[i - 1][0]) * t, c[i - 1][1] + (c[i][1] - c[i - 1][1]) * t], Math.atan2(c[i][1] - c[i - 1][1], c[i][0] - c[i - 1][0])];
  };
  let s = align === 'start' ? 0 : (total - run) / 2;
  let d = '';
  [...text].forEach((ch, i) => {
    const w = widths[i] - track;
    const [p, rot] = at(s + w / 2);
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const tx = (px, py) => `${fmtFine(p[0] + (px - w / 2) * cos - (py + cap / 2) * sin)} ${fmtFine(p[1] + (px - w / 2) * sin + (py + cap / 2) * cos)}`;
    for (const k of crestFont.charToGlyph(ch).getPath(0, 0, size).commands) {
      if (k.type === 'M' || k.type === 'L') d += `${k.type}${tx(k.x, k.y)}`;
      else if (k.type === 'Q') d += `Q${tx(k.x1, k.y1)} ${tx(k.x, k.y)}`;
      else if (k.type === 'C') d += `C${tx(k.x1, k.y1)} ${tx(k.x2, k.y2)} ${tx(k.x, k.y)}`;
      else if (k.type === 'Z') d += 'Z';
    }
    s += widths[i];
  });
  return color ? fill(d, color) : ink(d);
}

const toWhite = (markup) => markup.replaceAll(`fill="${INK}"`, `style="fill:var(${C.white})"`);
const mirrorCrest = (markup) => `<g transform="translate(1880 0) scale(-1 1)">${markup}</g>`;
const whiteLine = (points, w, opts) => toWhite(line(points, w, opts));
const whiteSolid = (points, steps) => toWhite(solid(points, steps));

function spiral(x, y, r, turns, direction, startAngle = 0) {
  const points = [];
  const n = Math.round(turns * 10);
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const a = startAngle + direction * t * turns * 6.283;
    points.push([x + Math.cos(a) * r * (1 - t * 0.86), y + Math.sin(a) * r * (1 - t * 0.86)]);
  }
  return points;
}
// A scroll of foliage: a white stem rolling into a volute, its centre line cut in black.
function curl(x, y, r, direction, startAngle, w = 13) {
  const coil = spiral(x, y, r, 1.6, direction, startAngle);
  return whiteLine(coil, w, { tipA: 0.04, tipB: 0.18, min: 0.34 }) + line(coil, w * 0.2, { tipA: 0.1, tipB: 0.1 });
}
function crestLeaf(p, angle, length) {
  const tip = [p[0] + Math.cos(angle) * length, p[1] + Math.sin(angle) * length];
  const m = [(p[0] + tip[0]) / 2, (p[1] + tip[1]) / 2];
  const nx = Math.cos(angle + 1.57) * length * 0.22;
  const ny = Math.sin(angle + 1.57) * length * 0.22;
  return shape([p, [m[0] + nx, m[1] + ny], tip, [m[0] - nx, m[1] - ny]], C.white, 2.2, { steps: 4 })
    + line([p, m, [m[0] * 0.2 + tip[0] * 0.8, m[1] * 0.2 + tip[1] * 0.8]], 1.8);
}
function crestStar(x, y, r) {
  return whiteSolid([[x, y - r], [x + r * 0.2, y - r * 0.2], [x + r, y], [x + r * 0.2, y + r * 0.2], [x, y + r], [x - r * 0.2, y + r * 0.2], [x - r, y], [x - r * 0.2, y - r * 0.2]], 2);
}

// One side's ribbon, folded twice and ending in a swallowtail. The other side is its mirror.
function crestRibbon() {
  let o = '';
  // Tail, furthest back.
  o += shape([[250, 268], [168, 296], [96, 318], [8, 316], [62, 348], [16, 386], [108, 376], [186, 352], [262, 322]], C.white, 3, { steps: 4, vary: 0.3 });
  o += hatch([[44, 330], [70, 348]], [[108, 330], [116, 356]], 3, 1.8);
  o += hatch([[214, 288], [216, 338]], [[176, 304], [178, 346]], 7, 2.4);
  // Middle band, running back under the main one.
  o += solid([[252, 262], [214, 268], [226, 318], [270, 322]], 2);
  o += shape([[418, 158], [352, 192], [282, 228], [196, 252], [206, 310], [296, 290], [372, 256], [430, 226]], C.white, 3, { steps: 4, vary: 0.3 });
  o += hatch([[222, 254], [230, 306]], [[276, 238], [286, 288]], 8, 2.4);
  o += hatch([[396, 178], [404, 232]], [[352, 200], [362, 254]], 7, 2.4);
  // Underside at the fold.
  o += solid([[372, 138], [424, 152], [434, 232], [392, 216]], 2);
  // Main band, carrying the name.
  o += shape([[668, 236], [600, 230], [522, 208], [440, 164], [378, 128], [372, 204], [430, 244], [510, 280], [590, 300], [668, 304]], C.white, 3.4, { steps: 4, vary: 0.3 });
  o += hatch([[372, 136], [370, 198]], [[404, 150], [402, 216]], 6, 2.2);
  return o;
}

// One column: an Ionic order with a laurel branch climbing its outer side.
function crestColumn() {
  const cx = 668;
  let o = '';
  const stem = [[622, 398], [604, 330], [596, 250], [606, 172], [634, 104]];
  const c = catmull(stem, false, 10);
  o += whiteLine(stem, 5, { tipA: 0.02, tipB: 0.25, min: 0.4 });
  for (let i = 3; i < c.length - 1; i += 4) {
    const a = Math.atan2(c[i + 1][1] - c[i][1], c[i + 1][0] - c[i][0]);
    o += crestLeaf(c[i], a - 0.72, 30 - (i / c.length) * 8);
    o += crestLeaf(c[i], a + 0.72, 30 - (i / c.length) * 8);
  }
  // Shaft, narrowing slightly towards the top, with flutes and a shaded side.
  o += shape([[cx - 28, 374], [cx - 24, 96], [cx + 24, 96], [cx + 28, 374]], C.white, 3, { poly: true, vary: 0.25 });
  [-16, -8, 0, 8, 16].forEach((x) => { o += line([[cx + x * 1.08, 368], [cx + x, 230], [cx + x * 0.92, 102]], 3, { tipA: 0.06, tipB: 0.06, min: 0.5 }); });
  o += hatch([[cx + 18, 110], [cx + 18, 360]], [[cx + 26, 110], [cx + 27, 360]], 24, 1.8);
  // Capital: echinus, abacus and two volutes.
  o += shape([[cx - 34, 96], [cx - 40, 78], [cx + 40, 78], [cx + 34, 96]], C.white, 3, { poly: true, vary: 0.25 });
  o += hatch([[cx - 30, 82], [cx - 26, 94]], [[cx + 30, 82], [cx + 26, 94]], 12, 1.8);
  o += shape([[cx - 46, 62], [cx + 46, 62], [cx + 46, 76], [cx - 46, 76]], C.white, 3, { poly: true, vary: 0.25 });
  o += curl(cx - 40, 92, 15, -1, 3.2, 8) + curl(cx + 40, 92, 15, 1, 0, 8);
  // Base: two rings and a plinth.
  o += shape([[cx - 34, 374], [cx + 34, 374], [cx + 38, 384], [cx - 38, 384]], C.white, 3, { poly: true, vary: 0.25 });
  o += shape([[cx - 44, 386], [cx + 44, 386], [cx + 48, 402], [cx - 48, 402]], C.white, 3, { poly: true, vary: 0.25 });
  o += hatch([[cx + 18, 389], [cx + 22, 399]], [[cx + 40, 389], [cx + 44, 399]], 6, 1.6);
  return o;
}

function crestSword() {
  let o = '';
  // Runs from the point at upper left to the pommel at lower right, passing behind the shield.
  o += shape([[744, 46], [770, 62], [1150, 402], [1136, 416], [756, 76]], C.white, 3, { poly: true, vary: 0.25 });
  o += line([[754, 60], [900, 192]], 2.4, { tipA: 0.1, tipB: 0.1 });
  o += line([[1050, 330], [1120, 394]], 2.2, { tipA: 0.1, tipB: 0.1 });
  return o;
}

function crestShield() {
  let o = '';
  const outline = [[788, 150], [862, 146], [940, 126], [1018, 146], [1092, 150], [1096, 262], [1064, 330], [1004, 374], [940, 406], [876, 374], [816, 330], [784, 262]];
  o += shape(outline, C.white, 5, { steps: 5, vary: 0.3 });
  o += ink(smooth(catmull([[800, 160], [864, 156], [940, 138], [1016, 156], [1080, 160], [1084, 262], [1054, 324], [1000, 364], [940, 394], [880, 364], [826, 324], [796, 262]], true, 5)).replace(/$/, smooth(catmull([[804, 164], [864, 160], [940, 142], [1016, 160], [1076, 164], [1080, 262], [1050, 321], [998, 360], [940, 389], [882, 360], [830, 321], [800, 262]], true, 5))), true);
  // Counterchanged fields: upper left and lower right are black, with white charges.
  o += ink(smooth(polyline([[808, 168], [866, 164], [932, 148], [932, 252], [806, 252]])));
  o += ink(smooth(polyline([[948, 266], [1074, 266], [1046, 318], [996, 356], [948, 380]])));
  o += line([[940, 142], [940, 388]], 5, { tipA: 0.02, tipB: 0.02, min: 0.6 });
  o += line([[800, 259], [1080, 259]], 5, { tipA: 0.02, tipB: 0.02, min: 0.6 });

  // Upper left: a rocket climbing through stars.
  let rocket = '';
  rocket += shape([[0, -46], [12, -24], [14, 20], [-14, 20], [-12, -24]], C.white, 2, { steps: 4, vary: 0.2 });
  rocket += circle(0, -10, 5.5, '--ink,#000', 1.8);
  rocket += shape([[-14, 4], [-28, 28], [-14, 22]], C.white, 2, { poly: true, vary: 0.2 });
  rocket += shape([[14, 4], [28, 28], [14, 22]], C.white, 2, { poly: true, vary: 0.2 });
  rocket += whiteSolid([[-8, 24], [0, 52], [8, 24]], 3);
  rocket += line([[-13, 12], [13, 12]], 2, { tipA: 0.1, tipB: 0.1 });
  o += `<g transform="translate(872 204) rotate(28)">${rocket}</g>`;
  o += crestStar(826, 186, 8) + crestStar(832, 232, 5) + crestStar(912, 172, 6) + crestStar(920, 232, 4);

  // Upper right: a CubeSat with its panels out.
  o += `<g transform="rotate(-10 1012 206)">`;
  o += shape([[990, 184], [1034, 184], [1034, 228], [990, 228]], C.white, 3, { poly: true, vary: 0.2 });
  o += line([[990, 199], [1034, 199]], 1.8) + line([[990, 213], [1034, 213]], 1.8) + line([[1005, 184], [1005, 228]], 1.8) + line([[1019, 184], [1019, 228]], 1.8);
  o += circle(1012, 206, 7, C.white, 2) + dot(1012, 206, 2.6);
  for (const side of [[956, 978], [1046, 1068]]) {
    o += shape([[side[0], 190], [side[1], 190], [side[1], 222], [side[0], 222]], C.white, 2.4, { poly: true, vary: 0.2 });
    o += hatch([[side[0] + 3, 192], [side[1] - 3, 192]], [[side[0] + 3, 220], [side[1] - 3, 220]], 5, 1.5);
  }
  o += line([[978, 206], [990, 206]], 2.4) + line([[1034, 206], [1046, 206]], 2.4);
  o += line([[1012, 184], [1014, 168]], 2) + dot(1014, 166, 3);
  o += `</g>`;

  // Lower left: a small neural network.
  const layers = [[[836, 280], [836, 306]], [[872, 272], [872, 298], [872, 324]], [[908, 286], [908, 314]]];
  for (let k = 0; k < layers.length - 1; k += 1) {
    for (const a of layers[k]) for (const b of layers[k + 1]) o += line([a, b], 1.6, { tipA: 0.04, tipB: 0.04, min: 0.6 });
  }
  for (const layer of layers) for (const n of layer) o += dot(n[0], n[1], 6.2);

  // Lower right: code brackets.
  o += whiteLine([[978, 288], [960, 306], [978, 324]], 8, { tipA: 0.04, tipB: 0.04, min: 0.7, steps: 1 });
  o += whiteLine([[1034, 288], [1052, 306], [1034, 324]], 8, { tipA: 0.04, tipB: 0.04, min: 0.7, steps: 1 });
  o += whiteLine([[1016, 282], [996, 332]], 7, { tipA: 0.04, tipB: 0.04, min: 0.7, steps: 1 });

  // Engraved shading on the white fields.
  o += hatch([[1046, 168], [1078, 170]], [[1060, 180], [1076, 186]], 6, 1.6);
  o += hatch([[812, 268], [826, 330]], [[806, 268], [812, 312]], 6, 1.6);

  // Boss at the crossing.
  o += circle(940, 259, 21, C.white, 3);
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * 6.283;
    o += line([[940 + Math.cos(a) * 5, 259 + Math.sin(a) * 5], [940 + Math.cos(a) * 15, 259 + Math.sin(a) * 15]], i % 2 ? 2.2 : 3.6, { tipA: 0.04, tipB: 0.5 });
  }
  return o;
}

// Mantling: scrolls of foliage either side of the shield.
function crestMantling() {
  let o = '';
  o += curl(762, 176, 26, -1, 0.4) + curl(756, 262, 22, 1, 3.4) + curl(778, 348, 24, -1, 5.2);
  o += whiteLine([[786, 200], [752, 216], [738, 240]], 8, { tipA: 0.05, tipB: 0.4 });
  o += crestLeaf([768, 214], 2.7, 34) + crestLeaf([762, 310], 2.5, 36) + crestLeaf([794, 374], 2.7, 40) + crestLeaf([776, 136], 3.6, 30);
  return o;
}

function crestHelmet() {
  let o = '';
  // Horsehair fan.
  o += shape([[850, 92], [850, 54], [886, 22], [940, 8], [994, 22], [1030, 54], [1030, 92], [996, 70], [940, 58], [884, 70]], C.white, 3.4, { steps: 4, vary: 0.3 });
  for (let i = 0; i <= 24; i += 1) {
    const a = 3.5 + (i / 24) * 2.42;
    o += line([[940 + Math.cos(a) * 62, 96 + Math.sin(a) * 42], [940 + Math.cos(a) * 92, 96 + Math.sin(a) * 82]], 2.2, { tipA: 0.2, tipB: 0.2 });
  }
  // Bowl and cheek guards.
  const half = [[940, 50], [972, 58], [992, 90], [994, 124], [984, 146], [962, 160], [950, 138], [945, 128]];
  const whole = [...half, ...half.slice(1).reverse().map(([x, y]) => [1880 - x, y])];
  o += shape(whole, C.white, 3.6, { steps: 4, vary: 0.3 });
  // Brow and T-shaped opening.
  o += line([[896, 96], [922, 86], [940, 92], [958, 86], [984, 96]], 3, { tipA: 0.2, tipB: 0.2 });
  // Almond eye slits either side of a long nose guard, and a narrow mouth gap between the cheek plates.
  o += solid([[898, 112], [916, 103], [934, 104], [935, 112], [920, 117], [904, 118]], 3);
  o += solid([[982, 112], [964, 103], [946, 104], [945, 112], [960, 117], [976, 118]], 3);
  o += solid([[937, 134], [943, 134], [944, 160], [936, 160]], 2);
  o += line([[936, 96], [935, 130]], 1.8, { tipA: 0.2, tipB: 0.2 }) + line([[944, 96], [945, 130]], 1.8, { tipA: 0.2, tipB: 0.2 });
  o += hatch([[896, 72], [886, 110]], [[908, 66], [898, 96]], 5, 1.8);
  o += hatch([[984, 72], [994, 110]], [[972, 66], [982, 96]], 5, 1.8);
  o += line([[900, 126], [912, 138], [928, 142]], 2) + line([[980, 126], [968, 138], [952, 142]], 2);
  o += dot(906, 94, 1.8) + dot(974, 94, 1.8) + dot(898, 134, 1.8) + dot(982, 134, 1.8);
  // Rays and stars behind it.
  for (let i = 0; i < 20; i += 1) {
    const a = 3.0 + (i / 19) * 3.42;
    if (a > 3.95 && a < 5.47) continue;
    o = whiteLine([[940 + Math.cos(a) * 118, 90 + Math.sin(a) * 74], [940 + Math.cos(a) * (150 + (i % 2) * 22), 90 + Math.sin(a) * (92 + (i % 2) * 14)]], i % 2 ? 2.4 : 3.8, { tipA: 0.04, tipB: 0.6 }) + o;
  }
  o = crestStar(812, 40, 8) + crestStar(1068, 40, 8) + crestStar(838, 16, 4.5) + crestStar(1042, 16, 4.5) + crestStar(778, 92, 4.5) + crestStar(1102, 92, 4.5) + o;
  return o;
}

function crestMotto() {
  let o = '';
  // Curled ends, then the band, then its lettering.
  const tail = shape([[770, 386], [712, 412], [730, 446], [800, 438], [828, 416]], C.white, 3, { steps: 4, vary: 0.3 })
    + hatch([[760, 400], [778, 436]], [[790, 402], [804, 430]], 5, 1.8)
    + curl(732, 430, 14, 1, 2.2, 7);
  o += tail + mirrorCrest(tail);
  o += shape([[786, 392], [860, 414], [940, 424], [1020, 414], [1094, 392], [1104, 428], [1024, 450], [940, 458], [856, 450], [776, 428]], C.white, 3.4, { steps: 5, vary: 0.3 });
  o += textOn('FUNDAMENTALS & CREATIVE THINKING', 22, [[796, 416], [860, 434], [940, 442], [1020, 434], [1084, 416]], { track: 1 });
  return o;
}

// Three separate symbols on one canvas, so the page can slide and shake the ribbons without touching the body.
const crestBox = [0, 0, 1880, 460];
let crestSide = null;
const sharedRibbon = () => { crestSide ??= crestRibbon(); return crestSide; };
stickers['crest-left'] = { box: crestBox, draw() {
  return sharedRibbon() + textOn('ALEXANDER', 36, [[404, 174], [452, 202], [510, 234], [568, 258]], { track: 2.5 });
} };
stickers['crest-right'] = { box: crestBox, draw() {
  return mirrorCrest(sharedRibbon()) + textOn('MAKEDONSKIY', 36, [[1312, 258], [1370, 234], [1428, 202], [1476, 174]], { track: 2.5 });
} };
stickers['crest-body'] = { box: crestBox, draw() {
  let o = '';
  const column = crestColumn();
  o += column + mirrorCrest(column);
  const sword = crestSword();
  o += sword + mirrorCrest(sword);
  const mantling = crestMantling();
  o += mantling + mirrorCrest(mantling);
  o += crestShield();
  o += crestHelmet();
  o += crestMotto();
  return o;
} };

// ---- The detailed illustrations, section by section ----
const art = {
  C, INK, shape, line, solid, dot, circle, ink, fill, catmull, smooth, hatch, between, textOn,
};
const tools = require('./sticker-art/tools.cjs')(art);
for (const section of ['hero', 'about', 'floors', 'cases', 'finly', 'skills', 'education']) require(`./sticker-art/${section}.cjs`)(stickers, art, tools);

// ---- Output ----
const rendered = {};
for (const name of Object.keys(stickers)) rendered[name] = stickers[name].draw();

const symbols = Object.entries(rendered).map(([name, body]) => `<symbol id="s-${name}" viewBox="${stickers[name].box.join(' ')}">${body}</symbol>`).join('\n');
const output = path.resolve(__dirname, '..', 'assets', 'stickers.svg');
fs.writeFileSync(output, `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols}\n</svg>\n`);
console.log(Object.entries(rendered).map(([name, body]) => `${name} ${(body.length / 1024).toFixed(1)}KB`).join(', '));
console.log(`assets/stickers.svg ${(fs.statSync(output).size / 1024).toFixed(0)}KB`);
