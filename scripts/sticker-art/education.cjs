// Education, GitHub and contact: the closing sections. Diamonds crop to |dx| + |dy| <= 230 around the centre.
module.exports = (stickers, kit, t) => {
  const { C, shape, line, solid, dot, circle, hatch, between, textOn } = kit;
  const { toWhite, toColor, box, rule, rot, arc, arcPts, ticks, bolt, gear, bigEye, onQuad, quadGrid, stipple, star, rr, inkRect, check } = t;
  const label = (text, size, x, y, opts = {}) => textOn(text, size, [[x - 400, y], [x + 400, y]], opts);
  const whiteLabel = (text, size, x, y) => label(text, size, x, y, { color: C.white });

  // Applied Mathematics & Computer Science.
  stickers.compass = { box: [0, 0, 460, 460], draw() {
    let o = '';
    // The circle it has just drawn, with its centre mark and radius.
    o += toWhite(line(arcPts(230, 352, 100, 44, -0.2, 3.34, 40), 4, { tipA: 0.02, tipB: 0.02, min: 0.8, steps: 1 }));
    o += toColor(rule([230, 352], [330, 352], 2.6), C.yellow);
    o += toWhite(rule([222, 352], [238, 352], 2.6) + rule([230, 344], [230, 360], 2.6));
    o += toColor(textOn('r', 22, [[260, 340], [300, 340]]), C.yellow);
    // Integral, left. Matrix, right. Both in chalk.
    o += toWhite(line([[106, 190], [96, 176], [84, 188], [84, 262], [72, 276], [62, 262]], 6.5, { tipA: 0.08, tipB: 0.08, min: 0.5 }));
    o += whiteLabel('F(X) DX', 21, 128, 230);
    o += toWhite(rule([310, 182], [298, 182], 3.6) + rule([298, 182], [298, 266], 3.6) + rule([298, 266], [310, 266], 3.6));
    o += toWhite(rule([392, 182], [404, 182], 3.6) + rule([404, 182], [404, 266], 3.6) + rule([404, 266], [392, 266], 3.6));
    [[320, 204, '1'], [352, 204, '0'], [384, 204, '2'], [320, 246, '3'], [352, 246, '1'], [384, 246, '0']].forEach(([x, y, n]) => { o += whiteLabel(n, 26, x, y); });
    // A computing-system chip between the legs.
    o += rr(190, 196, 270, 276, 5, C.mint, 3.8);
    o += rr(206, 212, 254, 260, 3, C.white, 2.6) + label('CPU', 20, 230, 236);
    for (let i = 0; i < 5; i += 1) {
      const u = 202 + i * 14;
      o += toWhite(rule([u, 186], [u, 196], 3) + rule([u, 276], [u, 286], 3) + rule([180, u], [190, u], 3) + rule([270, u], [280, u], 3));
    }
    // Needle leg.
    o += box([[218, 76], [234, 82], [176, 296], [162, 292]], C.white, 4.4);
    o += rule([212, 110], [172, 262], 2.2);
    o += box([[176, 290], [162, 286], [158, 310], [172, 314]], C.yellow, 3.4);
    o += toWhite(line([[165, 312], [228, 350]], 5, { tipA: 0.02, tipB: 0.5, min: 0.3 }));
    // Pencil leg: barrel, band, sharpened cone, lead on the paper.
    o += box([[242, 76], [226, 82], [284, 296], [298, 292]], C.white, 4.4);
    o += rule([248, 110], [288, 262], 2.2);
    o += box([[276, 280], [304, 272], [322, 334], [300, 340]], C.yellow, 3.8);
    o += rule([282, 298], [306, 290], 2.2) + rule([286, 312], [312, 304], 2.2);
    o += box([[300, 340], [322, 334], [330, 356]], C.white, 3);
    o += dot(329, 353, 3.4);
    // Hinge and knurled head.
    o += circle(230, 78, 25, C.yellow, 4.6) + ticks(230, 78, 16, 23, 22, 1.8) + bolt(230, 78, 8);
    o += box([[220, 26], [240, 26], [240, 56], [220, 56]], C.orange, 3.4);
    [33, 41, 49].forEach((y) => { o += rule([222, y], [238, y], 2); });
    // Fine-adjust screw between the legs.
    o += toWhite(rule([196, 160], [264, 160], 4.4));
    o += box([[222, 148], [238, 148], [238, 172], [222, 172]], C.pink, 2.8);
    [226, 231, 236].forEach((x) => { o += rule([x, 150], [x, 170], 1.4); });
    return o;
  } };

  // Machine Learning & Data Analysis: Random Forest, K-Means, plots.
  stickers.robot = { box: [0, 0, 460, 460], draw() {
    let o = '';
    // A real random forest, either side: each tree a different shape.
    [[92, 300, 62, C.mint], [132, 322, 44, C.white], [368, 300, 62, C.mint], [328, 322, 44, C.white]].forEach(([x, base, h, c]) => {
      o += box([[x - 4, base], [x + 4, base], [x + 4, base + 22], [x - 4, base + 22]], C.orange, 2.6);
      o += box([[x - h * 0.5, base], [x, base - h * 0.8], [x + h * 0.5, base]], c, 3.2);
      o += box([[x - h * 0.4, base - h * 0.42], [x, base - h * 1.2], [x + h * 0.4, base - h * 0.42]], c, 3.2);
      o += hatch([[x + h * 0.1, base - 6], [x + h * 0.34, base - 6]], [[x + h * 0.06, base - h * 0.42], [x + h * 0.2, base - h * 0.34]], 3, 1.6);
    });
    // K-Means clusters overhead, with centroids.
    [[92, 176, C.pink, [[-14, -8], [10, -14], [14, 8], [-8, 12], [0, -1]]], [368, 176, C.yellow, [[-14, 8], [12, -10], [14, 12], [-6, -14], [1, 2]]]].forEach(([x, y, c, pts]) => {
      pts.forEach(([dx, dy]) => { o += circle(x + dx, y + dy, 4.8, c, 1.6); });
      o += toWhite(line(arcPts(x, y, 30, 28, 0, 6.283, 16), 2, { tipA: 0.01, tipB: 0.01, min: 0.8 }));
    });
    // Legs and feet.
    o += box([[194, 324], [216, 324], [214, 386], [196, 386]], C.yellow, 3.8) + box([[244, 324], [266, 324], [264, 386], [246, 386]], C.yellow, 3.8);
    [342, 360].forEach((y) => { o += rule([196, y], [215, y], 2.2) + rule([245, y], [265, y], 2.2); });
    o += box([[184, 386], [222, 386], [226, 410], [180, 410]], C.pink, 3.8) + box([[238, 386], [276, 386], [280, 410], [234, 410]], C.pink, 3.8);
    // Arms: one holding a magnifier over the data.
    o += box([[140, 206], [158, 206], [152, 276], [134, 272]], C.yellow, 3.8);
    o += circle(142, 286, 13, C.white, 3.4);
    o += box([[302, 206], [320, 206], [356, 244], [342, 258]], C.yellow, 3.8);
    o += circle(352, 258, 12, C.white, 3.4);
    o += circle(372, 226, 22, C.white, 4.2) + toColor(arc(372, 226, 14, 3.4, 4.8, 3), C.blue) + rule([358, 244], [352, 254], 5);
    // Torso, with a plot on its chest: bars and a fitted regression line.
    o += box([[156, 188], [304, 188], [312, 326], [148, 326]], C.orange, 5);
    o += box([[172, 206], [288, 206], [288, 294], [172, 294]], C.white, 3.6);
    o += rule([182, 216], [182, 284], 2.2) + rule([182, 284], [280, 284], 2.2);
    [[192, 262, C.mint], [210, 250, C.pink], [228, 240, C.blue], [246, 226, C.yellow], [264, 220, C.violet]].forEach(([x, y, c]) => { o += box([[x, y], [x + 13, y], [x + 13, 283], [x, 283]], c, 2); });
    o += rule([186, 268], [278, 216], 2.6);
    [[168, 308], [186, 308], [204, 308]].forEach(([x, y], i) => { o += circle(x, y, 5.4, [C.mint, C.yellow, C.white][i], 2); });
    for (let x = 226; x < 296; x += 10) o += rule([x, 302], [x, 316], 2);
    [[162, 196], [298, 196], [158, 318], [302, 318]].forEach(([x, y]) => { o += dot(x, y, 2.6); });
    // Neck, head, antenna.
    o += box([[212, 168], [248, 168], [248, 190], [212, 190]], C.white, 3.6);
    [174, 182].forEach((y) => { o += rule([214, y], [246, y], 2); });
    o += box([[160, 74], [300, 74], [306, 172], [154, 172]], C.blue, 5);
    o += rule([230, 74], [230, 40], 4) + circle(230, 34, 11, C.pink, 3.4);
    o += box([[144, 104], [156, 104], [156, 142], [144, 142]], C.white, 3) + box([[304, 104], [316, 104], [316, 142], [304, 142]], C.white, 3);
    o += bigEye(196, 114, 28, 0.14, 0.1) + bigEye(264, 114, 28, 0.14, 0.1);
    o += box([[194, 148], [266, 148], [266, 164], [194, 164]], C.white, 2.8);
    [206, 218, 230, 242, 254].forEach((x) => { o += rule([x, 149], [x, 163], 1.8); });
    return o;
  } };

  // Pre-University Programme: the foundation, in three books.
  stickers.books = { box: [0, 0, 460, 460], draw() {
    let o = '';
    const book = (x0, y0, x1, y1, color, title) => {
      let b = '';
      // Page block, then cover and spine bands.
      b += box([[x1 - 74, y0 + 7], [x1, y0 + 7], [x1, y1 - 7], [x1 - 74, y1 - 7]], C.white, 3);
      for (let y = y0 + 13; y < y1 - 9; y += 6) b += rule([x1 - 72, y], [x1 - 2, y], 1.3);
      b += rr(x0, y0, x1 - 66, y1, 5, color, 4.6);
      b += rule([x0 + 22, y0 + 3], [x0 + 22, y1 - 3], 2.6) + rule([x0 + 30, y0 + 3], [x0 + 30, y1 - 3], 1.6);
      b += rule([x1 - 88, y0 + 3], [x1 - 88, y1 - 3], 2.6);
      b += whiteLabel(title, Math.min(30, (y1 - y0) * 0.66), (x0 + 30 + x1 - 88) / 2, (y0 + y1) / 2);
      return b;
    };
    o += book(100, 306, 362, 350, C.blue, 'MATHS');
    o += rot(-1.5, 230, 280, book(118, 262, 348, 306, C.pink, 'PHYSICS'));
    o += rot(1.5, 230, 240, book(106, 220, 340, 262, C.violet, 'C.S.'));
    // Bookmark, pencil and apple.
    o += box([[318, 350], [334, 350], [334, 378], [326, 370], [318, 378]], C.yellow, 2.8);
    o += rot(-6, 170, 372, box([[108, 366], [214, 366], [214, 380], [108, 380]], C.yellow, 3) + box([[214, 366], [236, 373], [214, 380]], C.white, 2.6) + dot(233, 373, 2.2) + box([[96, 366], [108, 366], [108, 380], [96, 380]], C.pink, 2.6) + rule([110, 373], [212, 373], 1.6));
    // Atom, for the physics it stands on.
    for (const a of [0, 60, 120]) o += rot(a, 360, 150, toWhite(line(arcPts(360, 150, 46, 17, 0, 6.283, 22), 2.6, { tipA: 0.01, tipB: 0.01, min: 0.8 })));
    o += circle(360, 150, 8, C.pink, 2.6);
    o += circle(406, 150, 4.4, C.yellow, 1.6) + circle(337, 110, 4.4, C.yellow, 1.6) + circle(337, 190, 4.4, C.yellow, 1.6);
    // Pi and a sum, in chalk, for the maths.
    o += toWhite(rule([76, 138], [132, 138], 5) + line([[92, 138], [90, 166], [82, 184]], 5, { tipA: 0.1 }) + line([[116, 138], [114, 170], [124, 184]], 5, { tipA: 0.1 }));
    // The owl, on top, capped.
    o += shape([[162, 150], [166, 104], [196, 76], [264, 76], [294, 104], [298, 150], [288, 200], [254, 222], [206, 222], [172, 200]], C.orange, 5, { vary: 0.16 });
    for (let row = 0; row < 3; row += 1) {
      for (let i = 0; i < 6 - row; i += 1) {
        const x = 192 + row * 7 + i * 15;
        const y = 180 + row * 12;
        o += arc(x, y, 7, 0.2, 2.9, 2);
      }
    }
    o += shape([[176, 150], [160, 176], [172, 202], [186, 190]], C.yellow, 3.6, { vary: 0.2 }) + shape([[284, 150], [300, 176], [288, 202], [274, 190]], C.yellow, 3.6, { vary: 0.2 });
    o += bigEye(204, 124, 28, 0.12, 0.1) + bigEye(256, 124, 28, 0.12, 0.1);
    o += box([[218, 146], [242, 146], [230, 168]], C.yellow, 3);
    [[196, 222], [212, 224], [248, 224], [264, 222]].forEach(([x, y]) => { o += rule([x, y - 4], [x, y + 8], 4.4); });
    // Mortarboard.
    o += box([[230, 34], [316, 66], [230, 94], [144, 66]], C.white, 4.6);
    o += box([[192, 78], [268, 78], [262, 100], [198, 100]], C.white, 3.8);
    o += rule([230, 62], [300, 76], 2.6) + rule([300, 76], [300, 106], 2.6);
    o += box([[294, 106], [306, 106], [308, 122], [292, 122]], C.yellow, 2.4);
    // Scaled in so the stack's corners stay inside the diamond.
    return `<g transform="translate(34 44) scale(.85)">${o}</g>`;
  } };

  // Open-source pulse: a friendly bug, wearing its contribution graph.
  stickers.bug = { box: [0, 0, 420, 420], draw() {
    let o = '';
    // Six jointed legs.
    for (const f of [1, -1]) {
      const X = (x) => 210 + f * (x - 210);
      [[[292, 188], [348, 150], [394, 96]], [[310, 248], [372, 248], [410, 222]], [[292, 316], [354, 346], [386, 404]]].forEach(([a, b, c]) => {
        o += toWhite(line([[X(a[0]), a[1]], [X(b[0]), b[1]]], 8, { tipA: 0.05, tipB: 0.05, min: 0.8 }) + line([[X(b[0]), b[1]], [X(c[0]), c[1]]], 5, { tipA: 0.05, tipB: 0.4, min: 0.4 }));
        o += circle(X(b[0]), b[1], 6, C.yellow, 2.4);
      });
    }
    // Antennae.
    for (const f of [1, -1]) {
      const X = (x) => 210 + f * (x - 210);
      o += toWhite(line([[X(232), 66], [X(262), 34], [X(304), 26]], 4.4, { tipA: 0.04, tipB: 0.1, min: 0.5 })) + circle(X(308), 26, 6, C.pink, 2.4);
    }
    // Thorax with a branch graph on it.
    o += shape([[126, 138], [150, 106], [270, 106], [294, 138], [290, 170], [130, 170]], C.yellow, 4.6, { vary: 0.14 });
    o += rule([168, 144], [252, 144], 3.4) + line([[186, 144], [204, 124], [234, 124], [250, 144]], 3, { tipA: 0.04, tipB: 0.04, min: 0.8 });
    [[168, 144], [204, 124], [234, 124], [252, 144]].forEach(([x, y]) => { o += circle(x, y, 6, C.white, 2.2); });
    // Wing cases: the contribution grid, lit like a real year.
    o += shape([[208, 168], [132, 168], [108, 222], [108, 310], [140, 374], [208, 396]], C.white, 5.5, { vary: 0.12 });
    o += shape([[212, 168], [288, 168], [312, 222], [312, 310], [280, 374], [212, 396]], C.white, 5.5, { vary: 0.12 });
    const greens = [C.white, C.mint, C.mint, C.yellow, C.blue];
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const y = 184 + row * 24;
        const inset = Math.max(0, (y - 300) * 0.42);
        const xs = [126 + col * 14 + inset * (1 - col / 6) * 1.1, 224 + col * 14 - inset * (col / 6) * 1.1];
        xs.forEach((x, side) => {
          if ((side === 0 && x + 12 > 204) || (side === 1 && x > 288 - inset * 0.8)) return;
          const v = (row * 3 + col * 5 + side * 7) % 5;
          o += box([[x, y], [x + 11.5, y], [x + 11.5, y + 19], [x, y + 19]], greens[v], 1.8);
        });
      }
    }
    // Head.
    o += shape([[150, 110], [156, 72], [186, 50], [234, 50], [264, 72], [270, 110], [240, 122], [180, 122]], C.orange, 5, { vary: 0.14 });
    o += bigEye(180, 84, 22, 0.1, 0.12) + bigEye(240, 84, 22, 0.1, 0.12);
    o += line([[196, 110], [210, 116], [224, 110]], 3.4);
    return o;
  } };

  // Let's build something: a plane folded from a letter addressed to the visitor's next project.
  stickers.plane = { box: [0, 0, 520, 340], draw() {
    let o = '';
    // Flight path: a loop behind it, then a fold-line through the clouds.
    const trail = [[12, 300], [76, 318], [132, 284], [108, 240], [66, 262], [96, 306], [176, 300], [236, 240]];
    const c = kit.catmull(trail, false, 12);
    for (let i = 0; i < c.length - 1; i += 7) o += rule(c[i], c[Math.min(c.length - 1, i + 3)], 4);
    // Clouds.
    [[408, 280, 1], [46, 124, 0.8]].forEach(([x, y, k]) => {
      o += shape([[x - 60 * k, y + 16 * k], [x - 56 * k, y - 8 * k], [x - 26 * k, y - 14 * k], [x - 10 * k, y - 32 * k], [x + 26 * k, y - 26 * k], [x + 42 * k, y - 8 * k], [x + 64 * k, y + 2 * k], [x + 60 * k, y + 18 * k]], C.white, 3.4, { steps: 3, vary: 0.2 });
      o += rule([x - 34 * k, y + 8 * k], [x + 30 * k, y + 8 * k], 2);
    });
    // Far wing and keel, in shadow.
    o += box([[508, 16], [204, 226], [264, 318], [290, 240]], C.blue, 5);
    o += hatch([[260, 234], [290, 214]], [[272, 276], [288, 238]], 7, 1.8);
    // Keel fold.
    o += box([[508, 16], [290, 240], [264, 318], [352, 196]], C.yellow, 5);
    o += hatch([[440, 92], [370, 158]], [[452, 88], [388, 160]], 6, 1.8);
    // Near wing: the letter itself, with its address, stamp and postmark.
    const wing = [[508, 16], [34, 150], [204, 226], [290, 240]];
    o += box(wing, C.white, 5.5);
    const on = (u, v) => [34 + (508 - 34) * u + (204 - 34) * v * (1 - u), 150 + (16 - 150) * u + (226 - 150) * v * (1 - u)];
    for (const [v, a, b] of [[0.5, 0.12, 0.5], [0.72, 0.16, 0.56], [0.94, 0.2, 0.46]]) o += rule(on(a, v), on(b, v), 3);
    o += textOn("LET'S BUILD", 26, [on(0.12, 0.2), on(0.56, 0.2)], { align: 'start' });
    // Stamp.
    const sx = 332;
    const sy = 92;
    o += rot(-16, sx, sy, box([[sx - 26, sy - 30], [sx + 26, sy - 30], [sx + 26, sy + 30], [sx - 26, sy + 30]], C.pink, 2.8)
      + star(sx, sy - 2, 18, C.yellow)
      + rule([sx - 16, sy + 22], [sx + 16, sy + 22], 2));
    o += rot(-16, 286, 106, line(arcPts(286, 106, 30, 30, 0, 6.283, 18), 2.2, { tipA: 0.01, tipB: 0.01, min: 0.7 }) + line(arcPts(286, 106, 22, 22, 0, 6.283, 14), 1.6, { tipA: 0.01, tipB: 0.01, min: 0.7 }) + rule([262, 106], [310, 106], 1.8));
    // The centre crease.
    o += line([[506, 18], [290, 240]], 3.4, { tipA: 0.01, tipB: 0.01, min: 0.8 });
    return o;
  } };
};
