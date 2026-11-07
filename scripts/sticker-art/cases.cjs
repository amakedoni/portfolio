// Project files: one icon for each thing a project actually does, shown at about 70px on a coloured plate,
// so they are drawn bold, in ink and white. Rosettes for the olympiads carry no logos.
module.exports = (stickers, kit, t) => {
  const { C, shape, line, solid, dot, circle, textOn } = kit;
  const { toWhite, box, rule, rot, arc, arcPts, ticks, rr, inkRect, check } = t;
  const label = (text, size, x, y) => textOn(text, size, [[x - 200, y], [x + 200, y]]);
  const icon = (name, draw) => { stickers[`i-${name}`] = { box: [0, 0, 120, 120], draw }; };
  const W = C.white;

  // ---- Finly ----
  icon('offline', () => {
    let o = '';
    // Device storage stacked under a dead signal.
    [80, 62].forEach((y) => { o += shape([[28, y], [92, y], [92, y + 18], [28, y + 18]], W, 4.4, { poly: true, vary: 0.1 }) + dot(40, y + 9, 3.4) + dot(52, y + 9, 3.4) + rule([66, y + 9], [84, y + 9], 3.4); });
    [18, 32].forEach((r) => { o += arc(60, 50, r, -2.5, -0.64, 5); });
    o += dot(60, 49, 4.4) + rule([24, 14], [96, 54], 6);
    return o;
  });
  icon('ml', () => {
    let o = rr(28, 28, 92, 92, 7, W, 5);
    for (const v of [42, 60, 78]) o += rule([14, v], [28, v], 4.4) + rule([92, v], [106, v], 4.4) + rule([v, 14], [v, 28], 4.4) + rule([v, 92], [v, 106], 4.4);
    const nodes = [[44, 46], [44, 74], [76, 46], [76, 74], [60, 60]];
    nodes.slice(0, 4).forEach((n) => { o += rule(n, nodes[4], 2.8); });
    nodes.forEach(([x, y]) => { o += dot(x, y, 5.4); });
    return o;
  });
  icon('chat', () => {
    let o = shape([[14, 22], [106, 22], [106, 80], [58, 80], [34, 104], [36, 80], [14, 80]], W, 5, { poly: true, vary: 0.1 });
    o += solid([[60, 32], [65, 46], [79, 51], [65, 56], [60, 70], [55, 56], [41, 51], [55, 46]], 2);
    o += dot(88, 36, 3.4) + dot(30, 66, 3.4);
    return o;
  });
  icon('receipt', () => {
    let o = shape([[26, 12], [94, 12], [94, 108], [83, 100], [71, 108], [60, 100], [49, 108], [37, 100], [26, 108]], W, 5, { poly: true, vary: 0.1 });
    o += inkRect(36, 22, 56, 42, 1.5) + toWhite(inkRect(41, 27, 51, 37, 1)) + inkRect(44, 30, 48, 34, 0.5);
    for (const [x, y] of [[64, 22], [74, 22], [64, 32], [82, 32], [74, 38]]) o += inkRect(x, y, x + 6, y + 6, 0.5);
    o += rule([36, 56], [84, 56], 4) + rule([36, 70], [70, 70], 4) + rule([36, 84], [84, 84], 4);
    return o;
  });
  icon('fingerprint', () => {
    let o = '';
    [10, 20, 30, 40, 50].forEach((r, i) => { o += arc(60, 64, r, i % 2 ? -3.3 : -3.6, i % 2 ? 0.3 : 0.1, 5, { tipA: 0.12, tipB: 0.12 }); });
    o += line([[60, 58], [62, 82], [72, 104]], 5, { tipA: 0.1, tipB: 0.1, min: 0.6 });
    o += line([[40, 70], [42, 92], [52, 108]], 5, { tipA: 0.1, tipB: 0.1, min: 0.6 });
    o += line([[80, 72], [82, 90], [88, 100]], 5, { tipA: 0.1, tipB: 0.1, min: 0.6 });
    return o;
  });
  icon('voice', () => {
    let o = rr(46, 14, 74, 70, 14, W, 5);
    [30, 42, 54].forEach((y) => { o += rule([52, y], [68, y], 3); });
    o += arc(60, 50, 28, 0.1, 3.04, 5) + rule([60, 78], [60, 100], 5.4) + rule([42, 104], [78, 104], 6);
    o += rule([12, 40], [12, 60], 4.4) + rule([22, 32], [22, 68], 4.4) + rule([108, 40], [108, 60], 4.4) + rule([98, 32], [98, 68], 4.4);
    return o;
  });
  icon('analytics', () => {
    let o = rule([16, 14], [16, 104], 5) + rule([16, 104], [108, 104], 5);
    [[28, 74], [50, 58], [72, 66], [94, 36]].forEach(([x, y]) => { o += box([[x, y], [x + 15, y], [x + 15, 103], [x, 103]], W, 4); });
    o += line([[28, 50], [52, 34], [72, 44], [100, 14]], 4.6, { tipA: 0.04, tipB: 0.04, min: 0.8, steps: 1 }) + dot(72, 44, 5.4);
    return o;
  });
  icon('export', () => {
    let o = shape([[24, 10], [70, 10], [96, 36], [96, 110], [24, 110]], W, 5, { poly: true, vary: 0.1 });
    o += rule([70, 10], [70, 36], 4) + rule([70, 36], [96, 36], 4);
    o += label('CSV', 27, 60, 54);
    o += rule([60, 70], [60, 98], 6) + rule([46, 84], [60, 100], 6) + rule([74, 84], [60, 100], 6);
    return o;
  });

  // ---- MAI Tablets ----
  icon('sync', () => {
    let o = '';
    o += arc(60, 60, 36, -2.7, -0.3, 7, { tipA: 0.02, tipB: 0.02, min: 0.85 }) + arc(60, 60, 36, 0.44, 2.84, 7, { tipA: 0.02, tipB: 0.02, min: 0.85 });
    o += solid([[88, 28], [108, 46], [84, 52]], 1) + solid([[32, 92], [12, 74], [36, 68]], 1);
    o += shape([[42, 66], [44, 52], [56, 48], [68, 46], [76, 56], [80, 66]], W, 3.6, { poly: true, vary: 0.1 });
    o += rule([40, 44], [82, 76], 5);
    return o;
  });
  icon('pair', () => {
    let o = rr(12, 12, 76, 76, 5, W, 5);
    for (const [x, y] of [[20, 20], [52, 20], [20, 52]]) o += inkRect(x, y, x + 16, y + 16, 1.5) + toWhite(inkRect(x + 4, y + 4, x + 12, y + 12, 0.5)) + inkRect(x + 6.5, y + 6.5, x + 9.5, y + 9.5, 0.2);
    for (const [x, y] of [[42, 22], [42, 34], [40, 44], [52, 44], [62, 42], [42, 56], [56, 56], [64, 62], [50, 64]]) o += inkRect(x, y, x + 7, y + 7, 0.5);
    // A short-lived code: the clock beside it is running.
    o += circle(84, 84, 26, W, 5) + ticks(84, 84, 19, 23, 12, 2) + rule([84, 84], [84, 68], 4.4) + rule([84, 84], [96, 90], 4.4);
    return o;
  });
  icon('push', () => {
    let o = shape([[22, 88], [32, 74], [32, 46], [60, 18], [88, 46], [88, 74], [98, 88]], W, 5, { poly: false, steps: 3, vary: 0.1 });
    o += rule([60, 10], [60, 18], 6) + arc(60, 92, 12, 0.2, 2.94, 5);
    o += rule([16, 104], [104, 104], 4.4) + circle(74, 104, 7, W, 3.4);
    o += arc(92, 26, 12, -1.3, 0.1, 4.4) + arc(92, 26, 22, -1.3, 0.1, 4.4);
    return o;
  });
  icon('privacy', () => {
    let o = shape([[60, 8], [106, 22], [102, 64], [60, 112], [18, 64], [14, 22]], W, 5.5, { poly: true, vary: 0.1 });
    o += arc(60, 46, 13, 3.14, 6.283, 5.4, { tipA: 0.01, tipB: 0.01, min: 0.9 }) + rule([47, 46], [47, 52], 5.4) + rule([73, 46], [73, 52], 5.4);
    o += inkRect(40, 50, 80, 80, 3) + toWhite(dot(60, 62, 5)) + toWhite(rule([60, 62], [60, 73], 4.4));
    return o;
  });

  // ---- CubeSat ----
  icon('receive', () => {
    let o = rot(-30, 54, 62, shape(arcPts(54, 62, 24, 40, 0, 6.1, 12), W, 5, { poly: true, vary: 0.1 }) + rule([54, 26], [54, 98], 2.6) + rule([34, 62], [74, 62], 2.6));
    o += rule([70, 94], [84, 112], 6) + rule([46, 112], [100, 112], 6) + rule([60, 76], [84, 44], 3.6) + dot(86, 42, 5);
    for (const r of [14, 26]) o += arc(88, 30, r, -1.3, 0.3, 4.6);
    return o;
  });
  icon('decode', () => {
    let o = rr(10, 22, 110, 98, 7, W, 5);
    o += label('A5 7F', 32, 60, 46);
    o += rule([20, 66], [100, 66], 3);
    for (const [x, b] of [[24, 1], [36, 0], [48, 1], [60, 1], [72, 0], [84, 1], [96, 0]]) o += b ? inkRect(x - 3, 74, x + 3, 90, 0.5) : rule([x - 3, 88], [x + 3, 88], 3.4);
    return o;
  });
  icon('relay', () => {
    let o = box([[52, 40], [68, 40], [82, 112], [38, 112]], W, 4.6);
    o += rule([50, 62], [71, 62], 3) + rule([46, 84], [75, 84], 3) + rule([50, 62], [75, 84], 3) + rule([71, 62], [46, 84], 3);
    o += circle(60, 32, 9, W, 4.4);
    for (const r of [22, 36, 50]) o += arc(60, 32, r, -0.8, 0.8, 4.8) + arc(60, 32, r, 2.34, 3.94, 4.8);
    return o;
  });
  icon('encode', () => {
    let o = rr(36, 30, 84, 90, 5, W, 5);
    for (const y of [42, 60, 78]) o += rule([26, y], [36, y], 4) + rule([84, y], [94, y], 4);
    o += label('C', 34, 60, 60);
    const left = ['1', '0', '1'];
    left.forEach((b, i) => { o += label(b, 20, 12, 42 + i * 18); });
    ['0', '1', '1'].forEach((b, i) => { o += label(b, 20, 108, 42 + i * 18); });
    o += rule([44, 18], [76, 18], 4) + rule([44, 102], [76, 102], 4);
    return o;
  });

  // ---- Recognition: a rosette for each olympiad ----
  const rosette = (name, ribbonA, ribbonB, plate, centre) => {
    stickers[`r-${name}`] = { box: [0, 0, 240, 300], draw() {
      let o = '';
      o += shape([[86, 150], [52, 288], [84, 268], [108, 296], [132, 176]], ribbonA, 4.6, { poly: true, vary: 0.14 });
      o += shape([[154, 150], [188, 288], [156, 268], [132, 296], [108, 176]], ribbonB, 4.6, { poly: true, vary: 0.14 });
      o += rule([92, 188], [74, 262], 2.6) + rule([148, 188], [166, 262], 2.6);
      const frill = [];
      for (let i = 0; i < 48; i += 1) { const a = (i / 48) * 6.283; const r = i % 2 ? 94 : 112; frill.push([120 + Math.cos(a) * r, 114 + Math.sin(a) * r]); }
      o += box(frill, C.yellow, 4.6);
      o += circle(120, 114, 86, plate, 4.6) + ticks(120, 114, 72, 82, 48, 2);
      return o + centre();
    } };
  };
  rosette('itmo', C.blue, C.white, C.white, () => {
    // Computer science: a terminal with a prompt.
    let o = rr(78, 76, 162, 136, 6, C.blue, 4.6);
    o += toWhite(rule([90, 90], [106, 104], 5) + rule([106, 104], [90, 118], 5) + rule([112, 120], [136, 120], 5));
    o += box([[108, 136], [132, 136], [138, 150], [102, 150]], C.white, 3.6);
    return o;
  });
  rosette('rosatom', C.mint, C.orange, C.white, () => {
    // Mathematics and the atom.
    let o = '';
    for (const a of [0, 60, 120]) o += rot(a, 120, 114, line(arcPts(120, 114, 56, 21, 0, 6.283, 22), 3.8, { tipA: 0.01, tipB: 0.01, min: 0.85 }));
    o += circle(120, 114, 11, C.pink, 3.4) + circle(176, 114, 6, C.mint, 2.6) + circle(92, 66, 6, C.mint, 2.6) + circle(92, 162, 6, C.mint, 2.6);
    return o;
  });
  rosette('aero', C.pink, C.violet, C.white, () => {
    // The aerospace track: a rocket climbing.
    let r = shape([[120, 54], [136, 78], [138, 134], [102, 134], [104, 78]], C.white, 4, { steps: 3, vary: 0.12 });
    r += shape([[120, 54], [135, 76], [105, 76]], C.pink, 3.6, { steps: 2, vary: 0.12 });
    r += circle(120, 100, 10, C.blue, 3) + box([[102, 112], [84, 146], [104, 136]], C.blue, 3) + box([[138, 112], [156, 146], [136, 136]], C.blue, 3);
    r += box([[108, 136], [132, 136], [120, 166]], C.orange, 3);
    return rot(30, 120, 114, r);
  });
};
