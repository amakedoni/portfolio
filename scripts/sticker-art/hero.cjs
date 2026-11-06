// Hero: "Engineering tomorrow's interfaces." Shown at 100-200px, so details stay bold enough to survive.
module.exports = (stickers, kit, t) => {
  const { C, shape, line, solid, dot, circle, hatch, between } = kit;
  const { toWhite, toColor, box, rule, rot, arc, ticks, bolt, gear, bigEye, onQuad, quadGrid, strands, star } = t;

  // The namesake: a Corinthian helmet, its bronze engraved with a circuit.
  stickers.helmet = { box: [0, 0, 340, 320], draw() {
    let o = '';
    const plumeOuter = [[78, 92], [84, 40], [140, 10], [216, 12], [282, 48], [324, 116], [330, 190], [312, 232]];
    const plumeInner = [[112, 70], [150, 54], [200, 56], [244, 80], [272, 124], [284, 178], [292, 214]];
    o += shape([...plumeOuter, ...[...plumeInner].reverse()], C.pink, 5, { vary: 0.3 });
    o += strands(plumeInner, plumeOuter, 26, 3.2);
    // Bowl, neck flare and cheek guard in one casting.
    o += shape([[58, 130], [80, 84], [126, 54], [188, 48], [242, 74], [270, 126], [274, 182], [284, 232], [310, 270], [264, 284], [228, 262], [206, 222], [184, 232], [166, 274], [130, 306], [94, 296], [84, 252], [98, 210], [88, 204], [76, 228], [60, 222], [54, 178]], C.yellow, 5.5, { vary: 0.25 });
    // Crest holder.
    o += shape([[92, 88], [128, 62], [186, 56], [236, 80], [252, 104], [226, 96], [186, 80], [132, 84], [104, 104]], C.orange, 3.6, { vary: 0.25 });
    // Brow ridge and eye slit.
    o += line([[50, 138], [100, 120], [160, 118], [206, 138]], 5, { tipA: 0.1, tipB: 0.4 });
    o += solid([[56, 150], [104, 134], [140, 146], [128, 174], [92, 182], [62, 178]], 4);
    o += bigEye(100, 158, 18, -0.2, 0.05);
    // Nose guard and the seam of the cheek plate.
    o += line([[92, 186], [84, 204]], 3, { tipA: 0.2 });
    o += line([[112, 204], [106, 250], [110, 288]], 3, { tipA: 0.2 });
    // Circuit traces across the cheek and temple: nodes and right-angled runs.
    const trace = (points) => points.slice(1).map((p, i) => rule(points[i], p, 2.8)).join('') + dot(points[points.length - 1][0], points[points.length - 1][1], 4.4);
    o += trace([[168, 146], [216, 146], [238, 168], [238, 204]]);
    o += trace([[168, 170], [204, 170], [214, 182], [214, 208]]);
    o += trace([[150, 196], [176, 196], [186, 206]]);
    o += trace([[136, 216], [136, 250], [126, 268]]);
    o += dot(168, 146, 4.4) + dot(168, 170, 4.4) + dot(150, 196, 4.4) + dot(136, 216, 4.4);
    // Rim of rivets along the neck.
    [[258, 150], [262, 178], [266, 206], [276, 238], [288, 262]].forEach(([x, y]) => { o += dot(x, y, 3.2); });
    o += hatch([[232, 92], [254, 124]], [[216, 104], [236, 130]], 5, 2.4);
    o += hatch([[232, 232], [254, 270]], [[214, 226], [236, 268]], 4, 2.2);
    return o;
  } };

  // Engineering: a gear that has become the engineer, in a hard hat, with wrench and rule.
  stickers.gearhead = { box: [0, 0, 300, 400], draw() {
    let o = '';
    // Legs and boots.
    [[112, 292, 94, 360], [190, 292, 208, 360]].forEach(([x0, y0, x1, y1]) => {
      o += shape([[x0 - 13, y0], [x0 + 13, y0], [x1 + 13, y1], [x1 - 13, y1]], C.blue, 4, { poly: true, vary: 0.2 });
      o += rule([x0 - 11, y0 + 26], [x0 + 13 + (x1 - x0) * 0.4, y0 + 26], 2.8);
    });
    o += shape([[66, 354], [116, 352], [120, 388], [50, 390], [46, 376]], C.orange, 4, { vary: 0.25 });
    o += shape([[186, 352], [234, 354], [256, 376], [252, 390], [182, 388]], C.orange, 4, { vary: 0.25 });
    [58, 72, 86, 100, 194, 208, 222, 236].forEach((x) => { o += rule([x, 382], [x, 390], 3); });
    // Arm up, gripping a wrench; arm down, holding a rule.
    o += shape([[236, 170], [268, 120], [282, 130], [252, 186]], C.yellow, 4, { vary: 0.2 });
    o += rot(16, 276, 70, box([[268, 58], [284, 58], [284, 132], [268, 132]], C.white, 3.6)
      + shape([[256, 58], [254, 28], [266, 16], [266, 40], [286, 40], [286, 16], [298, 28], [296, 58]], C.white, 3.6, { poly: true, vary: 0.2 })
      + rule([276, 74], [276, 118], 2.6));
    o += circle(274, 126, 16, C.yellow, 4);
    o += shape([[64, 182], [32, 226], [44, 238], [76, 204]], C.yellow, 4, { vary: 0.2 });
    o += rot(-12, 30, 286, box([[18, 216], [42, 216], [42, 340], [18, 340]], C.white, 3.6)
      + [226, 238, 250, 262, 274, 286, 298, 310, 322].map((y, i) => rule([18, y], [i % 2 ? 30 : 34, y], 2.4)).join(''));
    o += circle(40, 232, 15, C.yellow, 4);
    // The gear itself, with a bolted rim and a face in the hub.
    o += gear(150, 196, 118, 94, 14, C.pink, 5.5);
    o += arc(150, 196, 84, 0, 6.283, 3.4);
    for (let i = 0; i < 14; i += 1) {
      const a = (i / 14) * 6.283;
      o += bolt(150 + Math.cos(a) * 89 * 0.99, 196 + Math.sin(a) * 89 * 0.99, 4.2);
    }
    o += circle(150, 200, 70, C.white, 5);
    o += hatch([[92, 228], [112, 254]], [[84, 214], [100, 244]], 4, 2.2);
    o += bigEye(122, 186, 21, 0.18, 0.1) + bigEye(180, 186, 21, 0.18, 0.1);
    // Grin, teeth squared like a spec sheet.
    o += shape([[104, 222], [150, 228], [198, 220], [186, 252], [150, 262], [116, 254]], '--ink,#000', 3.2, { vary: 0.2 });
    o += box([[112, 226], [188, 224], [186, 238], [114, 240]], C.white, 2);
    [127, 142, 157, 172].forEach((x) => { o += rule([x, 225], [x, 239], 2); });
    // Hard hat.
    o += shape([[66, 118], [80, 66], [122, 38], [180, 38], [222, 66], [236, 118]], C.yellow, 5, { vary: 0.25 });
    o += shape([[132, 34], [170, 34], [176, 112], [126, 112]], C.orange, 3.6, { poly: true, vary: 0.2 });
    [50, 66, 82, 98].forEach((y) => { o += rule([136, y], [168, y], 2.4); });
    o += shape([[46, 118], [254, 118], [266, 134], [36, 134]], C.yellow, 4.6, { poly: true, vary: 0.2 });
    for (let x = 58; x < 248; x += 18) o += rule([x, 121], [x + 8, 132], 3.4);
    o += hatch([[92, 74], [84, 110]], [[112, 58], [106, 108]], 4, 2.4);
    return o;
  } };

  // Tomorrow: the sun as a clock face, an eye open on the day to come.
  stickers.sun = { box: [0, 0, 320, 320], draw() {
    let o = '';
    const cx = 160;
    const cy = 160;
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * 6.283 + 0.26;
      const b = a + 0.2;
      const c = a - 0.2;
      o += shape([[cx + Math.cos(b) * 100, cy + Math.sin(b) * 100], [cx + Math.cos(a) * (i % 2 ? 150 : 158), cy + Math.sin(a) * (i % 2 ? 150 : 158)], [cx + Math.cos(c) * 100, cy + Math.sin(c) * 100]], C.orange, 3.6, { poly: true, vary: 0.2 });
    }
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * 6.283;
      const b = a + 0.17;
      const c = a - 0.17;
      o += shape([[cx + Math.cos(b) * 100, cy + Math.sin(b) * 100], [cx + Math.cos(a) * 156, cy + Math.sin(a) * 156], [cx + Math.cos(c) * 100, cy + Math.sin(c) * 100]], C.yellow, 4, { poly: true, vary: 0.2 });
      o += rule([cx + Math.cos(a) * 112, cy + Math.sin(a) * 112], [cx + Math.cos(a) * 138, cy + Math.sin(a) * 138], 2.6);
    }
    o += circle(cx, cy, 106, C.yellow, 5.5);
    // The hours.
    o += ticks(cx, cy, 90, 102, 60, 1.6) + ticks(cx, cy, 84, 102, 12, 4.4);
    o += arc(cx, cy, 80, 0, 6.283, 3);
    // Almond eye with lashes.
    const lid = [[66, cy], [108, 108], [160, 92], [212, 108], [254, cy], [212, 212], [160, 228], [108, 212]];
    o += shape(lid, C.white, 5, { vary: 0.25 });
    o += circle(cx, cy, 58, C.blue, 4);
    o += ticks(cx, cy, 30, 54, 36, 2.2);
    o += dot(cx, cy, 26);
    o += toWhite(dot(cx - 13, cy - 14, 9)) + toWhite(dot(cx + 10, cy + 12, 3.6));
    return o;
  } };

  // Interfaces: a hand with a stylus, drawing a Bezier curve with its anchors and handles.
  stickers.bezier = { box: [0, 0, 440, 300], draw() {
    let o = '';
    // The curve being drawn, its control handles and anchors.
    const curve = [[18, 258], [64, 190], [136, 192], [190, 238]];
    o += line(curve, 13, { tipA: 0.02, tipB: 0.02, min: 0.85 }) + toColor(line(curve, 7, { tipA: 0.02, tipB: 0.02, min: 0.85 }), C.yellow);
    for (const [a, b] of [[[18, 258], [14, 176]], [[96, 186], [40, 150]], [[96, 186], [156, 214]]]) o += rule(a, b, 6) + toColor(rule(a, b, 2.6), C.white);
    o += box([[6, 248], [28, 248], [28, 268], [6, 268]], C.white, 3.4) + box([[86, 176], [106, 176], [106, 196], [86, 196]], C.mint, 3.4);
    o += circle(14, 172, 7, C.pink, 3) + circle(36, 148, 7, C.pink, 3) + circle(160, 216, 7, C.pink, 3);
    // Stylus: nib, grip, barrel, side button, cap.
    const q = [[186, 240], [226, 214], [430, 22], [416, 8]];
    o += box([[186, 240], [200, 200], [222, 222]], C.white, 3.4);
    o += box([[200, 200], [416, 8], [430, 22], [222, 222]], C.blue, 4);
    o += box(([[0.1, 0], [0.32, 0], [0.32, 1], [0.1, 1]]).map(([u, v]) => onQuad([q[1], q[2], q[3], [200, 200]], u, v)), C.yellow, 3);
    for (let i = 1; i < 6; i += 1) { const u = 0.1 + i * 0.037; o += rule(onQuad([q[1], q[2], q[3], [200, 200]], u, 0), onQuad([q[1], q[2], q[3], [200, 200]], u, 1), 2); }
    o += box(([[0.62, 0.3], [0.78, 0.3], [0.78, 0.7], [0.62, 0.7]]).map(([u, v]) => onQuad([q[1], q[2], q[3], [200, 200]], u, v)), C.white, 2.4);
    o += box(([[0.92, 0], [1, 0], [1, 1], [0.92, 1]]).map(([u, v]) => onQuad([q[1], q[2], q[3], [200, 200]], u, v)), C.pink, 3);
    // Sleeve and cuff.
    o += shape([[282, 296], [296, 214], [414, 198], [434, 290], [360, 298]], C.mint, 5, { vary: 0.2 });
    o += box([[284, 232], [426, 214], [432, 240], [278, 262]], C.white, 4);
    [300, 322, 344, 366, 388, 410].forEach((x) => { o += rule([x, 230 - (x - 300) * 0.12], [x - 4, 256 - (x - 300) * 0.14], 2.4); });
    o += rule([330, 268], [334, 292], 2.6) + rule([380, 264], [386, 290], 2.6);
    // The hand: palm, then fingers wrapping the barrel from behind, then the thumb over it.
    o += shape([[286, 240], [270, 176], [288, 124], [336, 106], [386, 124], [408, 176], [414, 226], [346, 246]], C.violet, 5, { vary: 0.25 });
    o += line([[338, 150], [354, 190], [346, 226]], 3, { tipA: 0.3 });
    o += line([[300, 210], [322, 216], [340, 214]], 2.6);
    [[[346, 118], [282, 152], [252, 176], [268, 192], [304, 178], [352, 150]], [[366, 142], [308, 176], [272, 200], [286, 216], [326, 200], [372, 170]], [[380, 168], [326, 204], [296, 226], [310, 240], [348, 224], [388, 194]]].forEach((finger) => { o += shape(finger, C.violet, 4.6, { vary: 0.25 }); });
    o += shape([[258, 174], [248, 172], [244, 184], [254, 194], [266, 190]], C.yellow, 3, { vary: 0.2 });
    o += shape([[278, 198], [268, 198], [264, 210], [274, 220], [286, 214]], C.yellow, 3, { vary: 0.2 });
    o += shape([[298, 224], [288, 226], [288, 238], [298, 244], [310, 238]], C.yellow, 3, { vary: 0.2 });
    o += shape([[330, 100], [276, 118], [230, 138], [226, 158], [246, 164], [302, 150], [352, 128]], C.violet, 5, { vary: 0.25 });
    o += shape([[236, 136], [222, 138], [216, 150], [224, 162], [240, 160]], C.yellow, 3, { vary: 0.2 });
    o += rule([268, 128], [276, 150], 2.2) + rule([280, 124], [288, 146], 2.2);
    o += hatch([[396, 170], [408, 216]], [[378, 180], [392, 226]], 5, 2.4);
    return o;
  } };

  // Interfaces again: an app window, alive, with its own controls for a face.
  stickers.window = { box: [0, 0, 260, 390], draw() {
    let o = '';
    // Feet on the screen edge.
    o += shape([[52, 330], [98, 330], [100, 368], [32, 370], [28, 356]], C.pink, 4, { vary: 0.25 });
    o += shape([[160, 330], [206, 330], [230, 356], [226, 370], [158, 368]], C.pink, 4, { vary: 0.25 });
    // Window.
    o += box([[14, 14], [246, 14], [246, 340], [14, 340]], C.mint, 6);
    o += box([[14, 14], [246, 14], [246, 56], [14, 56]], C.white, 5);
    o += circle(36, 35, 8, C.pink, 3) + circle(60, 35, 8, C.yellow, 3) + circle(84, 35, 8, C.blue, 3);
    o += box([[106, 25], [230, 25], [230, 45], [106, 45]], C.white, 2.8);
    o += rule([116, 35], [186, 35], 3.2);
    // Scrollbar.
    o += box([[222, 68], [238, 68], [238, 328], [222, 328]], C.white, 3);
    o += box([[225, 96], [235, 96], [235, 168], [225, 168]], C.violet, 2.6);
    // Eyes and a mouth built like a text field.
    o += bigEye(70, 112, 34, 0.16, 0.1) + bigEye(160, 112, 34, 0.16, 0.1);
    o += shape([[30, 160], [112, 172], [204, 158], [190, 220], [112, 238], [44, 222]], '--ink,#000', 4, { vary: 0.25 });
    o += box([[44, 170], [190, 168], [186, 190], [48, 192]], C.white, 2.4);
    [68, 92, 116, 140, 164].forEach((x) => { o += rule([x, 169], [x, 191], 2.2); });
    o += shape([[84, 206], [112, 198], [150, 206], [130, 226], [100, 226]], C.pink, 3, { vary: 0.25 });
    // Controls: slider, toggle, two buttons.
    o += rule([30, 262], [204, 262], 4.4);
    o += circle(134, 262, 12, C.yellow, 3.4);
    o += box([[30, 286], [84, 286], [84, 316], [30, 316]], C.white, 3);
    o += circle(68, 301, 10, C.blue, 3);
    o += box([[100, 286], [146, 286], [146, 316], [100, 316]], C.yellow, 3) + box([[156, 286], [204, 286], [204, 316], [156, 316]], C.orange, 3);
    return o;
  } };

  // The real thing: a CubeSat, panels out, relaying home.
  stickers.cubesat = { box: [0, 0, 500, 350], draw() {
    let o = '';
    const panels = [[[20, 120], [166, 152], [166, 262], [20, 230]], [[334, 152], [480, 120], [480, 230], [334, 262]]];
    panels.forEach((q) => {
      o += box(q, C.blue, 5);
      o += quadGrid(q, 6, 4, 2.2);
      for (const [u, v] of [[1, 1], [3, 2], [4, 0], [5, 3], [0, 2], [2, 3]]) {
        o += rule(onQuad(q, (u + 0.2) / 6, (v + 0.75) / 4), onQuad(q, (u + 0.7) / 6, (v + 0.25) / 4), 2.4).replaceAll('fill="#000"', `style="fill:var(${C.white})"`);
      }
    });
    o += rule([166, 200], [190, 206], 6) + rule([334, 200], [310, 206], 6);
    const front = [[176, 134], [262, 164], [262, 288], [176, 258]];
    const side = [[262, 164], [336, 134], [336, 258], [262, 288]];
    const top = [[176, 134], [250, 104], [336, 134], [262, 164]];
    o += box(top, C.yellow, 5) + box(front, C.white, 5) + box(side, C.pink, 5);
    // Top: patch antenna and whips.
    o += box([onQuad(top, 0.28, 0.28), onQuad(top, 0.72, 0.28), onQuad(top, 0.72, 0.72), onQuad(top, 0.28, 0.72)], C.orange, 3);
    o += quadGrid([onQuad(top, 0.28, 0.28), onQuad(top, 0.72, 0.28), onQuad(top, 0.72, 0.72), onQuad(top, 0.28, 0.72)], 3, 3, 1.6);
    o += toWhite(rule([230, 118], [196, 44], 3.4) + rule([282, 118], [316, 44], 3.4)) + circle(196, 42, 6, C.pink, 2.6) + circle(316, 42, 6, C.pink, 2.6);
    // Front: the lens, a blinking eye, and a data port.
    o += bigEye(219, 204, 30, -0.05, 0.1);
    [[186, 150], [252, 174], [186, 246], [252, 270]].forEach(([x, y]) => { o += dot(x, y, 3); });
    // Side: vents and status lights.
    for (let v = 0.14; v < 0.6; v += 0.09) o += rule(onQuad(side, 0.16, v), onQuad(side, 0.84, v), 2.8);
    o += circle(...onQuad(side, 0.3, 0.8), 6, C.mint, 2.4) + circle(...onQuad(side, 0.62, 0.8), 6, C.yellow, 2.4);
    // Telemetry going out, and stars.
    [[250, 30, 24], [250, 30, 44]].forEach(([x, y, r]) => { o += toColor(arc(x, y + 8, r, -2.5, -0.64, 4), C.yellow); });
    o += star(60, 70, 14, C.yellow) + star(440, 62, 12, C.mint) + star(120, 40, 7, C.white) + star(392, 30, 7, C.white) + star(92, 300, 9, C.mint) + star(420, 300, 9, C.yellow);
    return o;
  } };
};
