// About: the printed bust's helmet and plinth, and three stickers taken from the bio itself.
module.exports = (stickers, kit, t) => {
  const { C, shape, line, dot, circle, hatch, textOn, catmull } = kit;
  const { toWhite, toColor, box, rule, rot, arc, arcPts, bolt, bigEye, rr, inkRect, check } = t;
  const label = (text, size, x, y, opts = {}) => textOn(text, size, [[x - 500, y], [x + 500, y]], opts);

  // The victor's laurel, sitting on the hair: two branches rising from the temples, nearly meeting at the top.
  stickers.wreath = { box: [0, 0, 500, 330], draw() {
    let o = '';
    const X = (x, f) => (f > 0 ? x : 500 - x);
    // Ribbon ends trailing from the back of the head.
    for (const f of [1, -1]) {
      o += shape([[X(52, f), 262], [X(18, f), 300], [X(30, f), 326], [X(44, f), 304], [X(70, f), 322], [X(84, f), 276]], C.pink, 3.6, { steps: 3, vary: 0.2 });
    }
    for (const f of [1, -1]) {
      const stem = [[X(66, f), 278], [X(46, f), 214], [X(60, f), 146], [X(106, f), 88], [X(168, f), 52], [X(232, f), 44]];
      const c = catmull(stem, false, 12);
      o += line(stem, 6, { tipA: 0.03, tipB: 0.25, min: 0.4 });
      for (let i = 2; i < c.length - 1; i += 4) {
        const p = c[i];
        const q = c[i + 1];
        const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
        const scale = 1 - (i / c.length) * 0.25;
        for (const side of [-1, 1]) {
          const len = 62 * scale;
          const dir = a + side * 0.62;
          const tip = [p[0] + Math.cos(dir) * len, p[1] + Math.sin(dir) * len];
          const m = [p[0] + Math.cos(dir) * len * 0.52, p[1] + Math.sin(dir) * len * 0.52];
          const nx = Math.cos(dir + 1.57) * len * 0.2;
          const ny = Math.sin(dir + 1.57) * len * 0.2;
          o += shape([p, [m[0] + nx, m[1] + ny], tip, [m[0] - nx, m[1] - ny]], (Math.round(i / 4) + (side > 0 ? 0 : 1)) % 2 ? C.yellow : C.mint, 3.8, { vary: 0.16 });
          o += line([p, m, [tip[0] * 0.9 + m[0] * 0.1, tip[1] * 0.9 + m[1] * 0.1]], 2.2);
          for (const u of [0.38, 0.6]) {
            const b = [p[0] + (tip[0] - p[0]) * u, p[1] + (tip[1] - p[1]) * u];
            o += rule(b, [b[0] + nx * 0.5 + Math.cos(dir) * len * 0.08, b[1] + ny * 0.5 + Math.sin(dir) * len * 0.08], 1.3);
            o += rule(b, [b[0] - nx * 0.5 + Math.cos(dir) * len * 0.08, b[1] - ny * 0.5 + Math.sin(dir) * len * 0.08], 1.3);
          }
        }
      }
    }
    return o;
  } };

  // The link from the crest to the text: a flourish grown down from the motto, and the pen that draws it.
  // The stem, carrying everything, narrowing towards the nib, with a knop where each pair of branches leaves it.
  stickers['crest-stem'] = { box: [0, 0, 600, 400], draw() {
    let o = toWhite(line([[300, 0], [300, 120], [300, 260], [300, 396]], 13, { tipA: 0.001, tipB: 0.5, min: 0.16, steps: 2 }));
    [[40, 11], [142, 9], [226, 7]].forEach(([y, r]) => { o += circle(300, y, r, C.white, 3); });
    return o;
  } };

  // The finished flourish, for anyone without scroll motion. With it, js/motion.js grows the same branches live.
  stickers['crest-flourish'] = { box: [0, 0, 600, 400], draw() {
    let o = '';
    const { curl, crestLeaf, crestStar, spiral } = kit;
    // A tendril leaving the stem, sweeping out and rolling into a volute.
    const tendril = (y, dir, reach, drop, r, w) => {
      const end = [300 + dir * reach, y + drop];
      const coil = spiral(end[0], end[1] - r, r, 1.5, -dir, dir > 0 ? 1.571 : 1.571);
      const path = [[300, y], [300 + dir * reach * 0.35, y + drop * 0.82], [300 + dir * reach * 0.72, y + drop * 1.04], ...coil];
      return toWhite(line(path, w, { tipA: 0.03, tipB: 0.14, min: 0.32, steps: 2 })) + line(path, w * 0.16, { tipA: 0.2, tipB: 0.1, steps: 2 });
    };
    for (const dir of [1, -1]) {
      o += tendril(40, dir, 196, 48, 25, 14);
      o += tendril(142, dir, 132, 42, 19, 12);
      o += tendril(226, dir, 76, 34, 13, 9);
      const X = (x) => 300 + dir * x;
      const a = (angle) => (dir > 0 ? angle : 3.1416 - angle);
      o += crestLeaf([X(66), 66], a(-0.75), 44) + crestLeaf([X(120), 84], a(-0.5), 40) + crestLeaf([X(64), 82], a(0.85), 38);
      o += crestLeaf([X(46), 162], a(-0.7), 34) + crestLeaf([X(86), 176], a(-0.45), 30) + crestLeaf([X(44), 178], a(0.9), 30);
      o += crestLeaf([X(26), 242], a(-0.6), 24) + crestLeaf([X(26), 254], a(0.9), 22);
      o += crestStar(X(238), 44, 8) + crestStar(X(172), 150, 6) + crestStar(X(108), 232, 5);
      for (const [x, y, r] of [[212, 118, 3], [240, 74, 2.4], [150, 216, 2.6], [120, 276, 2.2]]) o += toWhite(dot(X(x), y, r));
    }
    return o + stickers['crest-stem'].draw();
  } };

  stickers['crest-pen'] = { box: [0, 0, 120, 260], draw() {
    let o = '';
    // Holder, ferrule, then a nib with its slit and breather hole; its tip is at the bottom centre.
    o += shape([[50, 4], [70, 4], [76, 120], [44, 120]], C.white, 3.6, { steps: 2, vary: 0.12 });
    o += rule([60, 14], [60, 110], 2) + line([[52, 22], [50, 104]], 1.8);
    o += box([[42, 120], [78, 120], [76, 158], [44, 158]], C.white, 3.4);
    [128, 138, 148].forEach((y) => { o += rule([44, y], [76, y], 2); });
    o += shape([[46, 158], [74, 158], [82, 192], [60, 258], [38, 192]], C.white, 3.6, { poly: true, vary: 0.1 });
    o += circle(60, 186, 5.5, '--ink,#000', 1.6) + rule([60, 190], [60, 254], 2.2);
    o += rule([46, 170], [74, 170], 1.8);
    return o;
  } };

  // A carved plinth with the sitter's name and city.
  stickers.plinth = { box: [0, 0, 760, 170], draw() {
    let o = '';
    o += box([[14, 8], [746, 8], [730, 34], [30, 34]], C.white, 5);
    o += hatch([[34, 12], [726, 12]], [[44, 30], [716, 30]], 44, 1.8);
    o += box([[42, 34], [718, 34], [718, 128], [42, 128]], C.white, 5.5);
    o += box([[56, 46], [704, 46], [704, 116], [56, 116]], C.white, 2.8);
    o += label('ALEXANDER · MOSCOW', 52, 380, 81, { track: 4 });
    for (const x of [78, 682]) { o += bolt(x, 81, 7); }
    o += box([[24, 128], [736, 128], [750, 164], [10, 164]], C.white, 5);
    o += rule([40, 146], [720, 146], 2.6);
    for (let x = 34; x < 730; x += 40) o += rule([x, 150], [x - 6, 162], 2.2);
    return o;
  } };

  // "Outside of code I play guitar."
  stickers.guitar = { box: [0, 0, 500, 300], draw() {
    let o = '';
    // Neck, frets and inlays run up to the headstock.
    o += box([[176, 134], [420, 72], [424, 94], [180, 160]], C.white, 4.4);
    for (let i = 0; i < 14; i += 1) {
      const u = 196 + i * 16.5;
      const dy = (u - 176) * 0.255;
      o += rule([u, 132 - dy + 0], [u + 3, 158 - dy], 2);
    }
    [[262, 134], [296, 126], [330, 116], [378, 104]].forEach(([x, y]) => { o += circle(x, y, 3.8, C.yellow, 1.4); });
    // Headstock and tuners.
    o += shape([[416, 66], [486, 26], [498, 44], [478, 72], [428, 98]], C.yellow, 4.6, { poly: true, vary: 0.16 });
    [[440, 58, 428, 38], [464, 44, 454, 22], [448, 86, 460, 104], [472, 70, 488, 84]].forEach(([a, b, c, d]) => { o += rule([a, b], [c, d], 3) + circle(c, d, 6, C.white, 2.4); });
    // Body, in a double-cut.
    o += shape([[176, 112], [120, 74], [70, 88], [80, 122], [44, 132], [10, 174], [20, 240], [80, 278], [150, 266], [176, 220], [206, 200], [176, 170], [214, 148]], C.pink, 6, { steps: 4, vary: 0.2 });
    o += shape([[132, 126], [172, 116], [190, 148], [150, 176], [116, 170]], C.white, 3.4, { steps: 4, vary: 0.2 });
    // Pickups, bridge, knobs.
    for (const x of [94, 126]) {
      o += rot(-14, x, 190, box([[x - 9, 166], [x + 9, 166], [x + 9, 214], [x - 9, 214]], C.white, 3) + [174, 182, 190, 198, 206].map((y) => dot(x, y, 1.8)).join(''));
    }
    o += rot(-14, 58, 210, box([[50, 186], [66, 186], [66, 234], [50, 234]], C.yellow, 3));
    [[110, 248], [78, 252], [148, 236]].forEach(([x, y]) => { o += circle(x, y, 8, C.yellow, 2.6) + rule([x, y], [x, y - 7], 2); });
    // Strings, the full length.
    for (let i = 0; i < 6; i += 1) { o += rule([58, 192 + i * 7], [434, 72 + i * 4], 1.3); }
    o += hatch([[34, 186], [36, 234]], [[46, 180], [50, 234]], 5, 2.2);
    // A plectrum and two notes.
    o += rot(16, 280, 232, shape([[258, 214], [302, 214], [280, 258]], C.yellow, 3.4, { steps: 3, vary: 0.2 }));
    o += toWhite(dot(366, 196, 9) + rule([374, 196], [374, 150], 3.6) + rule([374, 150], [396, 158], 4.4));
    o += toWhite(dot(424, 214, 7) + rule([430, 214], [430, 176], 3));
    return o;
  } };

  // "...and lose evenings to ML papers."
  stickers.paper = { box: [0, 0, 340, 430], draw() {
    let o = '';
    o += box([[34, 26], [262, 14], [318, 66], [322, 406], [38, 416]], C.white, 5.5);
    o += box([[262, 14], [318, 66], [266, 70]], C.yellow, 3.6);
    o += textOn('ON LOSING EVENINGS', 26, [[56, 66], [262, 58]], { align: 'start' });
    o += textOn('TO MACHINE LEARNING', 19, [[58, 92], [292, 84]], { align: 'start' });
    o += rule([60, 110], [298, 102], 2.4);
    // Two columns of text.
    for (let i = 0; i < 6; i += 1) {
      o += rule([60, 126 + i * 13], [168, 122 + i * 13], 2) + rule([186, 121 + i * 13], [298, 117 + i * 13], 2);
    }
    // A loss curve, falling, with its validation twin wandering off at 3am.
    o += rr(60, 208, 298, 340, 4, C.white, 2.8);
    o += rule([76, 222], [76, 326], 2.2) + rule([76, 326], [288, 326], 2.2);
    o += toColor(line([[80, 228], [110, 280], [150, 304], [210, 314], [284, 318]], 4.4, { tipA: 0.02, tipB: 0.02, min: 0.8 }), C.pink);
    o += toColor(line([[80, 236], [114, 290], [160, 304], [210, 288], [284, 244]], 4.4, { tipA: 0.02, tipB: 0.02, min: 0.8 }), C.blue);
    o += textOn('3AM', 19, [[234, 232], [288, 232]]);
    // An equation and more text.
    o += textOn('L = -LOG P(Y|X)', 24, [[62, 368], [300, 368]]);
    o += rule([60, 390], [300, 388], 2);
    // Coffee ring, of course.
    o += toColor(line(arcPts(250, 170, 42, 42, 0.4, 5.6, 26), 5, { tipA: 0.15, tipB: 0.3, min: 0.4 }), C.orange);
    return o;
  } };

  // "...offline, sluggish networks, low-end devices."
  stickers.lowend = { box: [0, 0, 280, 420], draw() {
    let o = '';
    o += rr(24, 12, 256, 408, 26, C.mint, 6);
    o += rr(38, 46, 242, 356, 8, C.white, 4);
    o += inkRect(106, 26, 174, 33, 3);
    o += circle(140, 382, 15, C.white, 3.4);
    // Signal: one bar out of four.
    o += inkRect(52, 78, 60, 88, 1);
    [[64, 72], [76, 66], [88, 60]].forEach(([x, y]) => { o += box([[x, y], [x + 8, y], [x + 8, 88], [x, 88]], C.white, 1.8); });
    o += label('OFFLINE', 22, 180, 74);
    // Still running: the spinner has given up, the task has not.
    o += bigEye(100, 148, 28, 0.2, -0.25) + bigEye(180, 148, 28, -0.1, -0.25);
    o += line([[110, 198], [140, 206], [172, 194]], 4.4, { tipA: 0.2, tipB: 0.2 });
    o += rr(58, 226, 222, 254, 6, C.white, 3) + rr(62, 230, 118, 250, 4, C.pink, 1.8);
    o += label('STILL WORKS', 27, 140, 282);
    o += circle(140, 322, 20, C.yellow, 3.4) + check(140, 322, 10, 4);
    // A crack across the corner: it has been dropped, and it does not care.
    o += line([[242, 104], [214, 122], [226, 140], [196, 164]], 3, { tipA: 0.02, tipB: 0.6 }) + line([[214, 122], [200, 112]], 2.2) + line([[226, 140], [242, 150]], 2.2);
    // Failing signal.
    for (const r of [30, 52]) { o += toColor(arc(248, 34, r, -1.4, -0.1, 4.6), C.white); }
    return o;
  } };
};
