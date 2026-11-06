// Shared drawing tools for the detailed illustrations, built on the brush marks in build-stickers.cjs.
module.exports = (kit) => {
  const { C, INK, shape, line, solid, dot, circle, ink, catmull, between } = kit;
  const toWhite = (markup) => markup.replaceAll(`fill="${INK}"`, `style="fill:var(${C.white})"`);
  const toColor = (markup, color) => markup.replaceAll(`fill="${INK}"`, `style="fill:var(${color})"`);

  // Crisp-edged shape for anything manufactured.
  const box = (points, color, w = 3) => shape(points, color, w, { poly: true, vary: 0.18 });
  // A straight ruled line, even in weight.
  const rule = (a, b, w = 2) => line([a, b], w, { tipA: 0.03, tipB: 0.03, min: 0.75, steps: 1 });
  const wrap = (transform, markup) => `<g transform="${transform}">${markup}</g>`;
  const rot = (deg, x, y, markup) => wrap(`rotate(${deg} ${x} ${y})`, markup);
  const flipX = (x, markup) => wrap(`translate(${2 * x} 0) scale(-1 1)`, markup);

  const arcPts = (cx, cy, rx, ry, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });
  const arc = (cx, cy, r, a0, a1, w = 2, opts = {}) => line(arcPts(cx, cy, r, r, a0, a1, Math.max(4, Math.round(Math.abs(a1 - a0) * 5))), w, { tipA: 0.08, tipB: 0.08, min: 0.5, ...opts });
  const ticks = (cx, cy, r0, r1, n, w = 2, a0 = 0, a1 = 6.283) => {
    let o = '';
    for (let i = 0; i < n; i += 1) {
      const a = a0 + ((a1 - a0) * i) / n;
      o += rule([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1], w);
    }
    return o;
  };
  // A slotted screw head.
  const bolt = (x, y, r, color = C.white, angle = between(0, 3.14)) => circle(x, y, r, color, Math.max(1.6, r * 0.28))
    + rule([x - Math.cos(angle) * r * 0.62, y - Math.sin(angle) * r * 0.62], [x + Math.cos(angle) * r * 0.62, y + Math.sin(angle) * r * 0.62], Math.max(1.2, r * 0.26));
  const gear = (cx, cy, outer, inner, teeth, color, w = 4) => {
    const points = [];
    const step = 6.283 / teeth;
    for (let i = 0; i < teeth; i += 1) {
      const a = i * step;
      [[outer, -0.32], [outer, 0.32], [inner, 0.5]].forEach(([r, f]) => {
        points.push([cx + Math.cos(a + f * step) * r, cy + Math.sin(a + f * step) * r]);
      });
    }
    return box(points, color, w);
  };
  // A big, characterful eye: ring, spoked iris, pupil, catch-light.
  const bigEye = (x, y, r, lookX = 0.2, lookY = 0.1, iris = C.blue, w = Math.max(2.4, r * 0.14)) => {
    const ix = x + r * lookX;
    const iy = y + r * lookY;
    const rIris = r * 0.6;
    return circle(x, y, r, C.white, w) + circle(ix, iy, rIris, iris, Math.max(1.8, r * 0.08))
      + (r > 16 ? ticks(ix, iy, rIris * 0.52, rIris * 0.9, Math.round(r), Math.max(1, r * 0.035)) : '')
      + dot(ix, iy, rIris * 0.46) + toWhite(dot(ix - rIris * 0.28, iy - rIris * 0.3, rIris * 0.2));
  };
  // Point on a four-cornered face: lets a grid sit correctly on anything drawn in perspective.
  const onQuad = (q, u, v) => {
    const top = [q[0][0] + (q[1][0] - q[0][0]) * u, q[0][1] + (q[1][1] - q[0][1]) * u];
    const bottom = [q[3][0] + (q[2][0] - q[3][0]) * u, q[3][1] + (q[2][1] - q[3][1]) * u];
    return [top[0] + (bottom[0] - top[0]) * v, top[1] + (bottom[1] - top[1]) * v];
  };
  const quadGrid = (q, nu, nv, w = 1.8) => {
    let o = '';
    for (let i = 1; i < nu; i += 1) o += rule(onQuad(q, i / nu, 0), onQuad(q, i / nu, 1), w);
    for (let i = 1; i < nv; i += 1) o += rule(onQuad(q, 0, i / nv), onQuad(q, 1, i / nv), w);
    return o;
  };
  // Brush strands running from one curve to another: hair, feathers, ribs.
  const strands = (from, to, n, w = 2, opts = {}) => {
    const a = catmull(from, false, 12);
    const b = catmull(to, false, 12);
    let o = '';
    for (let i = 0; i < n; i += 1) {
      const t = (i + 0.5) / n;
      const p = a[Math.round(t * (a.length - 1))];
      const q = b[Math.round(t * (b.length - 1))];
      o += line([p, [(p[0] + q[0]) / 2 + between(-1, 1), (p[1] + q[1]) / 2 + between(-1, 1)], q], w * between(0.8, 1.15), { tipA: 0.2, tipB: 0.4, ...opts });
    }
    return o;
  };
  // Engraver's stipple, thinning towards the edge of an ellipse.
  const stipple = (cx, cy, rx, ry, n, r = 1.4) => {
    let o = '';
    for (let i = 0; i < n; i += 1) {
      const a = between(0, 6.283);
      const d = Math.sqrt(between(0, 1));
      o += dot(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, r * (1.2 - d * 0.7));
    }
    return o;
  };
  const star = (x, y, r, color = C.white) => toColor(solid([[x, y - r], [x + r * 0.2, y - r * 0.2], [x + r, y], [x + r * 0.2, y + r * 0.2], [x, y + r], [x - r * 0.2, y + r * 0.2], [x - r, y], [x - r * 0.2, y - r * 0.2]], 2), color);
  // Rounded rectangle.
  const rrPoints = (x0, y0, x1, y1, r) => {
    const points = [];
    for (const [cx, cy, a0] of [[x1 - r, y0 + r, -1.571], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 1.571], [x0 + r, y0 + r, 3.142]]) {
      const n = r > 12 ? 6 : 3;
      for (let i = 0; i <= n; i += 1) { const a = a0 + (i / n) * 1.571; points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    }
    return points;
  };
  const rr = (x0, y0, x1, y1, r, color, w = 3) => shape(rrPoints(x0, y0, x1, y1, r), color, w, { poly: true, vary: 0.14 });
  const inkRect = (x0, y0, x1, y1, r = 2) => solid(rrPoints(x0, y0, x1, y1, r), 2);
  // A capsule pill, two colours split across the middle, any angle.
  const capsule = (x, y, length, thick, angle, a, b, w = 3) => {
    const half = length / 2;
    const r = thick / 2;
    const end = (cx, a0) => Array.from({ length: 9 }, (_, i) => { const u = a0 + (i / 8) * 3.1416; return [cx + Math.cos(u) * r, y + Math.sin(u) * r]; });
    const body = rot(angle, x, y,
      shape([...end(x - half + r, 1.5708), [x, y - r], [x, y + r]], a, w, { poly: true, vary: 0.14 })
      + shape([...end(x + half - r, -1.5708), [x, y + r], [x, y - r]], b, w, { poly: true, vary: 0.14 })
      + toWhite(rule([x - half * 0.72, y - r * 0.45], [x - half * 0.2, y - r * 0.45], Math.max(1.4, thick * 0.1))));
    return body;
  };
  const check = (x, y, s, w = 4) => rule([x - s, y], [x - s * 0.25, y + s * 0.7], w) + rule([x - s * 0.25, y + s * 0.7], [x + s, y - s * 0.7], w);
  // A sine wave along a line, for signals.
  const wave = (x0, y0, x1, y1, cycles, amp, w = 3, n = 40) => {
    const points = [];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    for (let i = 0; i <= n; i += 1) {
      const u = i / n;
      const s = Math.sin(u * cycles * 6.283) * amp;
      points.push([x0 + dx * u - (dy / len) * s, y0 + dy * u + (dx / len) * s]);
    }
    return line(points, w, { tipA: 0.04, tipB: 0.04, min: 0.7, steps: 1 });
  };
  return { rrPoints, rr, inkRect, capsule, check, wave, toWhite, toColor, box, rule, wrap, rot, flipX, arcPts, arc, ticks, bolt, gear, bigEye, onQuad, quadGrid, strands, stipple, star };
};
