// Skills: "Tools of the trade." Each card's poster shows what its tools actually do, at about 300px.
// Original drawings throughout: no product logos.
module.exports = (stickers, kit, t) => {
  const { C, shape, line, solid, dot, circle, hatch, between, textOn, catmull } = kit;
  const { toWhite, toColor, box, rule, rot, arc, arcPts, ticks, bolt, bigEye, onQuad, quadGrid, stipple, star, rr, inkRect, check, wave } = t;
  const label = (text, size, x, y, opts = {}) => textOn(text, size, [[x - 400, y], [x + 400, y]], opts);
  const whiteLabel = (text, size, x, y) => label(text, size, x, y, { color: C.white });

  // A ribbon body along a curve, with cross-bands: for snakes and cables.
  const tube = (points, width, color, { bands = 0, spots = null } = {}) => {
    const c = catmull(points, false, 10);
    const n = c.length;
    const normal = (i) => {
      const a = c[Math.max(0, i - 1)];
      const b = c[Math.min(n - 1, i + 1)];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    };
    const half = (i) => (width / 2) * Math.min(1, 0.25 + Math.min(i, n - i) / 16);
    const left = c.map((p, i) => [p[0] + normal(i)[0] * half(i), p[1] + normal(i)[1] * half(i)]);
    const right = c.map((p, i) => [p[0] - normal(i)[0] * half(i), p[1] - normal(i)[1] * half(i)]).reverse();
    let o = shape([...left, ...right].filter((_, i) => i % 3 === 0), color, 4.6, { steps: 2, vary: 0.2 });
    if (bands) {
      for (let i = 3; i < n - 3; i += bands) {
        const [nx, ny] = normal(i);
        const h = half(i);
        o += rule([c[i][0] + nx * h * 0.92, c[i][1] + ny * h * 0.92], [c[i][0] - nx * h * 0.92, c[i][1] - ny * h * 0.92], 2.2);
        if (spots) o += circle(c[i + Math.floor(bands / 2)][0], c[i + Math.floor(bands / 2)][1], h * 0.22, spots, 1.8);
      }
    }
    return o;
  };

  stickers.snake = { box: [0, 0, 460, 460], draw() {
    let o = '';
    // Terminal behind the coil.
    o += rr(70, 62, 400, 340, 14, C.white, 5.5);
    o += rr(70, 62, 400, 100, 14, C.yellow, 4);
    o += circle(96, 81, 7, C.pink, 2.6) + circle(118, 81, 7, C.white, 2.6) + circle(140, 81, 7, C.mint, 2.6);
    o += label('MAIN.PY', 17, 300, 81);
    const code = [['>>> def build():', 118], ['...   ship()', 148], ['>>> build()', 178], ['DONE', 208]];
    code.forEach(([text, y]) => { o += textOn(text.toUpperCase(), 21, [[92, y], [392, y]], { align: 'start' }); });
    o += inkRect(142, 199, 154, 217, 1);
    o += rule([92, 240], [276, 240], 2.6) + rule([92, 262], [230, 262], 2.6) + rule([92, 284], [254, 284], 2.6);
    // Tiles for the other two languages.
    o += rot(-8, 74, 368, rr(16, 322, 132, 414, 9, C.blue, 4.6) + whiteLabel('C/C++', 34, 74, 368));
    o += rot(7, 392, 396, rr(342, 354, 444, 446, 9, C.yellow, 4.6) + label('TS', 54, 393, 400));
    // The python, around the terminal.
    o += tube([[92, 444], [160, 424], [250, 438], [320, 410], [352, 356], [326, 306], [250, 300], [170, 322], [130, 280], [172, 244], [262, 250], [340, 230], [376, 178], [356, 128]], 42, C.mint, { bands: 6, spots: C.yellow });
    // Head: jaw, eye, tongue.
    o += shape([[334, 134], [326, 92], [352, 58], [398, 48], [434, 72], [438, 104], [404, 126], [366, 140]], C.mint, 5, { vary: 0.18 });
    o += bigEye(382, 86, 22, 0.2, 0);
    o += line([[432, 100], [410, 110], [380, 114]], 3.2, { tipA: 0.1 });
    o += toColor(rule([434, 102], [454, 112], 4), C.pink) + toColor(rule([454, 112], [458, 104], 3), C.pink) + toColor(rule([454, 112], [460, 120], 3), C.pink);
    o += dot(424, 80, 2.6);
    o += hatch([[346, 74], [336, 118]], [[358, 66], [352, 124]], 3, 2.2);
    return o;
  } };

  stickers.database = { box: [0, 0, 460, 460], draw() {
    let o = '';
    // Request arriving: a bolt for the fast API layer, with routes.
    o += box([[232, 8], [176, 86], [222, 86], [196, 146], [274, 62], [226, 62], [262, 8]], C.yellow, 4.6);
    [[60, 42, 'GET'], [60, 88, 'POST']].forEach(([x, y, m]) => {
      o += rr(x - 44, y - 17, x + 44, y + 17, 5, C.white, 3.2) + label(m, 22, x, y);
      o += rule([x + 44, y], [172, 80], 4);
    });
    o += box([[166, 72], [180, 80], [166, 88]], C.white, 2.4);
    // Disks, top to bottom: each with a rack of status lights.
    const disk = (y, h, color, lit) => {
      let d = '';
      const rx = 124;
      const ry = 28;
      const bodyPts = [...arcPts(230, y, rx, ry, 3.1416, 0, 12).reverse().reverse()];
      d += shape([[230 - rx, y], [230 - rx, y + h], ...arcPts(230, y + h, rx, ry, 3.1416, 0, 16).slice(1, -1), [230 + rx, y + h], [230 + rx, y], ...arcPts(230, y, rx, ry, 0, 3.1416, 16).slice(1, -1)], color, 5.5, { poly: true, vary: 0.12 });
      for (let i = 0; i < 5; i += 1) d += circle(130 + i * 22, y + h * 0.55 + Math.abs(i - 2) * -2 + 12, 6, i < lit ? C.mint : C.white, 2.2);
      d += rule([262, y + h * 0.55 + 6], [336, y + h * 0.55 - 2], 3) + rule([262, y + h * 0.55 + 20], [326, y + h * 0.55 + 13], 3);
      d += hatch([[318, y + 18], [344, y + 8]], [[318, y + h + 18], [344, y + h + 2]], 3, 2);
      return d;
    };
    o += disk(362, 56, C.violet, 2);
    o += disk(290, 56, C.pink, 4);
    o += disk(218, 56, C.blue, 3);
    // Top face: the live table.
    const top = arcPts(230, 218, 124, 34, 0, 6.2, 32);
    o += shape(top, C.white, 5.5, { poly: true, vary: 0.12 });
    o += line(arcPts(230, 218, 84, 22, 0, 6.283, 28), 2, { tipA: 0.01, tipB: 0.01, min: 0.7 });
    o += line(arcPts(230, 218, 44, 11, 0, 6.283, 20), 2, { tipA: 0.01, tipB: 0.01, min: 0.7 });
    // Two eyes on the top disk, watching the query come in.
    o += bigEye(182, 180, 24, 0.2, 0.12) + bigEye(248, 176, 24, 0.2, 0.12);
    // Query card, going in; rows, coming out.
    o += rot(5, 390, 150, rr(322, 90, 456, 206, 8, C.white, 4) + label('SELECT *', 22, 389, 112) + rule([334, 132], [442, 132], 2.2));
    for (let row = 0; row < 3; row += 1) { o += rot(5, 390, 150, rule([334, 150 + row * 18], [376, 150 + row * 18], 3) + rule([386, 150 + row * 18], [442, 150 + row * 18], 3)); }
    o += line([[372, 214], [372, 252], [354, 264]], 4, { tipA: 0.02, tipB: 0.02, min: 0.8 });
    o += line([[40, 124], [48, 240], [100, 306]], 4, { tipA: 0.02, tipB: 0.02, min: 0.8 });
    o += box([[100, 296], [114, 312], [94, 318]], C.white, 2.4);
    return o;
  } };

  stickers.container = { box: [0, 0, 460, 460], draw() {
    let o = '';
    // Sky: the branch graph flying from the mast.
    o += toWhite(rule([54, 170], [54, 40], 5));
    o += toWhite(rule([54, 44], [282, 44], 3) + rule([54, 44], [282, 132], 2.4));
    o += toWhite(line([[54, 74], [110, 74], [150, 104], [232, 104], [262, 74], [306, 74]], 5, { tipA: 0.02, tipB: 0.02, min: 0.8 }));
    o += toWhite(rule([54, 74], [420, 74], 5));
    for (const [x, y, c] of [[110, 74, C.mint], [190, 104, C.pink], [232, 104, C.pink], [306, 74, C.yellow], [360, 74, C.mint], [420, 74, C.yellow]]) o += circle(x, y, 11, c, 3.4);
    o += circle(150, 104, 8, C.pink, 2.8);
    // Containers, three rows, each one identical and portable: that is the point.
    const unit = (x, y, w, h, c) => {
      let b = box([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c, 3.8);
      for (let vx = x + 8; vx < x + w - 4; vx += 8) b += rule([vx, y + 5], [vx, y + h - 5], 1.6);
      b += box([[x + w * 0.62, y + 8], [x + w - 6, y + 8], [x + w - 6, y + h - 8], [x + w * 0.62, y + h - 8]], C.white, 2);
      b += rule([x + w * 0.81, y + 8], [x + w * 0.81, y + h - 8], 1.6);
      [[x + 4, y + 4], [x + w - 4, y + 4], [x + 4, y + h - 4], [x + w - 4, y + h - 4]].forEach(([a, e]) => { b += dot(a, e, 2.2); });
      return b;
    };
    const colors = [C.orange, C.pink, C.yellow, C.mint, C.violet, C.white];
    [[110, 126, 3], [86, 172, 4], [64, 218, 5]].forEach(([x0, y, n], row) => {
      for (let i = 0; i < n; i += 1) o += unit(x0 + i * 66, y, 64, 44, colors[(row * 2 + i) % 5]);
    });
    // Bridge with a lit porthole and a blinking status.
    o += box([[396, 150], [432, 150], [440, 262], [388, 262]], C.white, 4.4);
    o += box([[402, 164], [426, 164], [426, 180], [402, 180]], C.yellow, 2.6);
    [204, 234].forEach((y) => { o += bigEye(414, y, 12, 0.1, 0); });
    o += box([[408, 124], [422, 124], [424, 150], [406, 150]], C.pink, 3.2);
    // Hull, plimsoll marks, waterline.
    o += shape([[22, 262], [444, 262], [424, 340], [52, 340]], C.white, 6, { poly: true, vary: 0.12 });
    o += box([[30, 296], [434, 296], [424, 340], [52, 340]], C.pink, 4.4);
    for (let x = 70; x < 420; x += 44) o += dot(x, 278, 3.4);
    o += rule([72, 318], [130, 318], 3) + label('DEPLOY', 30, 228, 318) + rule([330, 318], [400, 318], 3);
    // Sea.
    for (const [y, phase, w] of [[352, 0, 6], [384, 40, 5], [416, 18, 4.4], [444, 62, 3.6]]) {
      const pts = [];
      for (let x = -10; x <= 470; x += 12) pts.push([x, y + Math.sin((x + phase) / 26) * 7]);
      o += toWhite(line(pts, w, { tipA: 0.02, tipB: 0.02, min: 0.7, steps: 1 }));
    }
    return o;
  } };

  stickers.brain = { box: [0, 0, 460, 460], draw() {
    let o = '';
    // Left lobe: flesh and folds. Right lobe: the same shape, as a network.
    o += shape([[230, 44], [180, 22], [122, 34], [78, 72], [50, 124], [54, 190], [78, 240], [130, 276], [180, 284], [230, 268]], C.pink, 5.5, { vary: 0.22 });
    [[[216, 66], [172, 56], [130, 80], [150, 106], [196, 98]], [[122, 110], [84, 128], [84, 170], [122, 168], [150, 142]], [[214, 126], [176, 138], [168, 176], [204, 192]], [[100, 196], [124, 226], [166, 222], [176, 248]], [[214, 214], [190, 234], [212, 256]], [[104, 62], [90, 92]], [[140, 180], [120, 200]]].forEach((fold) => { o += line(fold, 5, { tipA: 0.15, tipB: 0.2 }); });
    o += hatch([[66, 160], [76, 226]], [[82, 150], [94, 216]], 7, 2.2);
    o += shape([[230, 44], [280, 22], [338, 34], [382, 72], [410, 124], [406, 190], [382, 240], [330, 276], [280, 284], [230, 268]], C.white, 5.5, { vary: 0.22 });
    o += rule([230, 44], [230, 268], 4.4);
    const nodes = [[254, 70], [298, 56], [344, 76], [376, 116], [262, 120], [312, 116], [376, 170], [266, 176], [320, 174], [352, 224], [264, 234], [306, 248]];
    const links = [[0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 5], [3, 5], [4, 5], [3, 6], [5, 6], [4, 7], [5, 8], [6, 8], [7, 8], [6, 9], [8, 9], [7, 10], [8, 11], [10, 11], [9, 11], [5, 7]];
    links.forEach(([a, b]) => { o += rule(nodes[a], nodes[b], 2.4); });
    nodes.forEach(([x, y], i) => { o += circle(x, y, 9, [C.blue, C.mint, C.orange, C.violet][i % 4], 2.8); });
    // Stem into the data.
    o += rule([118, 300], [344, 300], 5) + rule([118, 298], [118, 314], 5) + rule([344, 298], [344, 314], 5);
    o += box([[214, 276], [246, 276], [240, 304], [220, 304]], C.pink, 4.4);
    // Scatter plot with clusters, left.
    o += rr(18, 310, 216, 450, 8, C.white, 4.4);
    o += rule([40, 330], [40, 430], 3) + rule([40, 430], [202, 430], 3);
    [[70, 400], [82, 386], [64, 382], [92, 408], [78, 416], [96, 392]].forEach(([x, y]) => { o += circle(x, y, 5, C.blue, 1.8); });
    [[136, 354], [150, 344], [158, 362], [172, 350], [146, 368], [166, 336]].forEach(([x, y]) => { o += circle(x, y, 5, C.pink, 1.8); });
    [[176, 410], [158, 402], [186, 396]].forEach(([x, y]) => { o += circle(x, y, 5, C.mint, 1.8); });
    o += line(arcPts(80, 398, 34, 28, 0, 6.283, 18), 1.8, { tipA: 0.01, tipB: 0.01, min: 0.7 }) + line(arcPts(154, 352, 32, 28, 0, 6.283, 18), 1.8, { tipA: 0.01, tipB: 0.01, min: 0.7 });
    o += rule([44, 424], [198, 338], 2.2);
    // Decision tree, right.
    o += rr(244, 310, 444, 450, 8, C.white, 4.4);
    const tree = [[344, 334], [294, 382], [394, 382], [266, 426], [320, 426], [370, 426], [420, 426]];
    [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]].forEach(([a, b]) => { o += rule(tree[a], tree[b], 2.6); });
    tree.forEach(([x, y], i) => {
      if (i < 3) o += box([[x - 22, y - 13], [x + 22, y - 13], [x + 22, y + 13], [x - 22, y + 13]], i ? C.yellow : C.orange, 2.6);
      else o += circle(x, y, 11, i % 2 ? C.mint : C.pink, 2.6);
    });
    o += label('X<3', 18, 344, 334) + label('Y>1', 16, 294, 382) + label('Z<7', 16, 394, 382);
    return o;
  } };

  stickers.cursor = { box: [0, 0, 460, 460], draw() {
    let o = '';
    // Browser: tabs, address, wireframe of a real layout.
    o += rr(14, 28, 386, 318, 12, C.white, 5.5);
    o += rr(14, 28, 386, 66, 12, C.yellow, 4);
    o += circle(36, 47, 6.5, C.pink, 2.4) + circle(56, 47, 6.5, C.white, 2.4) + circle(76, 47, 6.5, C.mint, 2.4);
    o += rr(100, 37, 330, 57, 6, C.white, 2.4) + rule([112, 47], [244, 47], 2.6);
    o += box([[30, 80], [150, 80], [150, 96], [30, 96]], C.blue, 2.4) + rule([240, 88], [272, 88], 3) + rule([284, 88], [316, 88], 3) + rule([328, 88], [368, 88], 3);
    o += rr(30, 108, 210, 212, 6, C.pink, 3);
    o += label('HELLO', 44, 120, 160);
    o += rule([226, 118], [368, 118], 4) + rule([226, 136], [352, 136], 2.6) + rule([226, 152], [362, 152], 2.6) + rule([226, 168], [330, 168], 2.6);
    o += rr(226, 182, 296, 212, 5, C.mint, 2.6) + rr(304, 182, 368, 212, 5, C.white, 2.6);
    [[30, 226], [146, 226], [262, 226]].forEach(([x, y], i) => {
      o += rr(x, y, x + 106, y + 76, 5, [C.yellow, C.mint, C.violet][i], 2.6);
      o += circle(x + 22, y + 22, 9, C.white, 2.2) + rule([x + 40, y + 18], [x + 92, y + 18], 2.2) + rule([x + 40, y + 30], [x + 80, y + 30], 2.2);
      o += rule([x + 12, y + 50], [x + 94, y + 50], 2.2) + rule([x + 12, y + 62], [x + 72, y + 62], 2.2);
    });
    // The installed app: same layout, on a phone, working offline.
    o += rot(5, 372, 310, rr(306, 186, 442, 442, 18, C.violet, 5)
      + rr(315, 197, 433, 431, 12, C.white, 3)
      + inkRect(354, 203, 394, 213, 5)
      + rr(323, 222, 425, 272, 5, C.pink, 2.4)
      + rule([323, 284], [425, 284], 3.4) + rule([323, 298], [404, 298], 2.2) + rule([323, 310], [414, 310], 2.2)
      // Offline toggle, on.
      + rr(323, 326, 376, 352, 13, C.mint, 2.6) + circle(363, 339, 10, C.white, 2.4)
      + label('OFFLINE', 15, 402, 339)
      + rr(323, 366, 425, 416, 6, C.yellow, 2.4)
      + box([[374, 374], [374, 396], [364, 396], [374, 408], [384, 396], [374, 396]], C.white, 2));
    // The pointer: hand, cuff and the moment of the click.
    o += ticks(136, 322, 30, 54, 9, 4.8, 3.3, 6.2);
    o += shape([[120, 332], [136, 314], [152, 332], [154, 388], [172, 376], [188, 388], [206, 382], [222, 396], [238, 394], [254, 412], [252, 448], [224, 458], [134, 458], [106, 430], [72, 400], [84, 378], [118, 398]], C.white, 5.5, { steps: 3, vary: 0.14 });
    o += rule([154, 390], [154, 424], 3.4) + rule([188, 390], [188, 424], 3.4) + rule([222, 398], [222, 426], 3.4);
    o += arc(136, 336, 9, 3.6, 5.8, 2.6);
    o += hatch([[138, 440], [244, 438]], [[144, 454], [244, 450]], 9, 2);
    return o;
  } };
};
