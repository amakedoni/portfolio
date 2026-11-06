// Project floors. The floor scenes and case cards show at 300-530px, so these carry the finest work.
// Title stickers render white on the floor colour, so their detail is all in the ink.
module.exports = (stickers, kit, t) => {
  const { C, shape, line, solid, dot, circle, hatch, between, textOn } = kit;
  const { toWhite, toColor, box, rule, rot, arc, arcPts, ticks, bolt, gear, bigEye, onQuad, quadGrid, strands, stipple, star, rr, inkRect, capsule, check, wave } = t;
  const label = (text, size, x, y, opts = {}) => textOn(text, size, [[x - 400, y], [x + 400, y]], opts);
  const whiteLabel = (text, size, x, y, opts = {}) => textOn(text, size, [[x - 400, y], [x + 400, y]], { color: C.white, ...opts });

  // ---- Finly: offline-first finance with on-device ML ----
  stickers.piggy = { box: [0, 0, 380, 300], draw() {
    let o = '';
    // Coin dropping in.
    o += circle(186, 30, 24, C.yellow, 4) + ticks(186, 30, 15, 22, 18, 1.6) + rule([186, 20], [186, 40], 3);
    // Trotters behind, then the body.
    [[96, 214], [146, 226], [226, 226], [276, 214]].forEach(([x, y]) => {
      o += shape([[x - 18, y], [x + 18, y], [x + 16, y + 52], [x - 16, y + 52]], C.orange, 4, { poly: true, vary: 0.2 });
      o += rule([x - 16, y + 38], [x + 15, y + 38], 2.6) + rule([x, y + 40], [x, y + 52], 2.4);
    });
    o += shape([[66, 138], [96, 86], [160, 62], [232, 62], [296, 90], [336, 146], [326, 206], [270, 242], [170, 248], [96, 232], [62, 190]], C.pink, 5.5, { vary: 0.25 });
    // Curled tail.
    o += line([[334, 136], [364, 116], [368, 92], [346, 92], [352, 116]], 5, { tipA: 0.04, tipB: 0.2 });
    // Ear, snout with nostrils, eye and smile.
    o += shape([[112, 80], [104, 34], [146, 50], [158, 72]], C.pink, 4.4, { vary: 0.2 });
    o += line([[120, 72], [116, 50], [138, 62]], 2.4);
    o += shape([[30, 130], [60, 118], [86, 130], [92, 168], [66, 186], [34, 180], [18, 156]], C.yellow, 4.6, { vary: 0.22 });
    o += dot(46, 150, 6.5) + dot(68, 150, 6.5) + arc(56, 158, 22, 0.5, 2.6, 2.4);
    o += bigEye(124, 118, 21, -0.2, 0.05);
    o += line([[92, 196], [114, 208], [138, 206]], 3.4);
    // Slot, then a neural net on the flank: the on-device model.
    o += inkRect(150, 66, 224, 74, 3);
    const net = [[[196, 128], [196, 172]], [[240, 114], [240, 150], [240, 186]], [[284, 150]]];
    for (let k = 0; k < 2; k += 1) for (const a of net[k]) for (const b of net[k + 1]) o += rule(a, b, 2);
    net.flat().forEach(([x, y]) => { o += circle(x, y, 8, C.white, 2.6); });
    o += hatch([[296, 186], [316, 150]], [[266, 214], [290, 204]], 7, 2.4);
    o += hatch([[86, 212], [120, 226]], [[82, 200], [114, 214]], 4, 2.2);
    return o;
  } };

  stickers.coin = { box: [0, 0, 280, 340], draw() {
    let o = '';
    // Legs and shoes.
    o += box([[92, 230], [112, 230], [106, 296], [86, 296]], C.white, 3.6) + box([[168, 230], [188, 230], [194, 296], [174, 296]], C.white, 3.6);
    o += shape([[56, 292], [108, 290], [112, 322], [44, 324], [38, 310]], C.pink, 4, { vary: 0.22 });
    o += shape([[172, 290], [224, 292], [242, 310], [236, 324], [168, 322]], C.pink, 4, { vary: 0.22 });
    [52, 66, 80, 94, 186, 200, 214, 228].forEach((x) => { o += rule([x, 316], [x, 324], 2.6); });
    // Reeded rim, inner bead, face.
    o += circle(140, 130, 122, C.yellow, 6);
    o += ticks(140, 130, 104, 120, 72, 2.2);
    o += circle(140, 130, 100, C.orange, 4.4);
    for (let i = 0; i < 36; i += 1) { const a = (i / 36) * 6.283; o += dot(140 + Math.cos(a) * 90, 130 + Math.sin(a) * 90, 2); }
    o += bigEye(108, 100, 25, 0.15, 0.1) + bigEye(172, 100, 25, 0.15, 0.1);
    o += shape([[88, 150], [140, 158], [192, 150], [176, 190], [140, 200], [104, 190]], C.white, 4, { vary: 0.2 });
    [108, 124, 140, 156, 172].forEach((x) => { o += rule([x, 156], [x, 190], 2.2); });
    o += rule([92, 172], [188, 172], 2.2);
    return o;
  } };

  // ---- MAI Tablets: medication adherence ----
  stickers.phone = { box: [0, 0, 300, 520], draw() {
    let o = '';
    o += rr(6, 4, 294, 516, 42, C.violet, 5);
    o += rule([296, 120], [296, 172], 4) + rule([4, 110], [4, 140], 4) + rule([4, 150], [4, 186], 4);
    o += rr(18, 16, 282, 504, 32, C.white, 3.6);
    o += inkRect(112, 26, 188, 46, 10);
    o += dot(174, 36, 3.4);
    o += label('9:41', 16, 54, 37);
    o += inkRect(226, 32, 230, 42, 0.5) + inkRect(233, 29, 237, 42, 0.5) + inkRect(240, 26, 244, 42, 0.5);
    // Reminder banner, as it arrives.
    o += rr(28, 56, 272, 110, 13, C.yellow, 3);
    o += shape([[50, 96], [58, 88], [58, 74], [66, 66], [74, 74], [74, 88], [82, 96]], C.orange, 2.6, { vary: 0.2 }) + dot(66, 100, 3.4);
    o += label('TIME FOR YOUR DOSE', 15, 172, 74);
    o += label('EVENING  20:00', 13, 172, 94);
    // Today, and a ring showing doses taken.
    o += label('TODAY', 32, 78, 140);
    o += arc(236, 142, 22, 0, 6.283, 7, { tipA: 0.001, tipB: 0.001, min: 1 });
    o += toColor(arc(236, 142, 22, -1.571, 3.14, 7.4, { tipA: 0.01, tipB: 0.01, min: 1 }), C.mint);
    o += label('3/4', 13, 236, 142);
    // The day's doses.
    const rows = [['08:00', 'MORNING DOSE', C.pink, C.white, true], ['13:00', 'MIDDAY DOSE', C.blue, C.yellow, true], ['20:00', 'EVENING DOSE', C.mint, C.white, true], ['23:00', 'NIGHT DOSE', C.orange, C.white, false]];
    rows.forEach(([time, name, a, b, done], i) => {
      const y = 176 + i * 58;
      o += rr(28, y, 272, y + 50, 10, done ? C.white : C.yellow, 2.8);
      o += capsule(58, y + 25, 38, 17, -32, a, b, 2.4);
      o += label(time, 16, 116, y + 15) + label(name, 12.5, 124, y + 35);
      if (done) { o += circle(246, y + 25, 13, C.mint, 2.6) + check(246, y + 25, 6.5, 3); } else { o += circle(246, y + 25, 13, C.white, 2.6); }
    });
    // Bottom bar: QR pairing, reminders, privacy.
    o += rule([28, 416], [272, 416], 2.2);
    for (const [i, j] of [[0, 0], [0, 1], [1, 0], [2, 0], [2, 2], [0, 2], [1, 2], [1, 1]]) o += inkRect(70 + i * 9, 430 + j * 9, 77 + i * 9, 437 + j * 9, 0.8);
    o += shape([[150, 456], [158, 448], [158, 434], [166, 426], [174, 434], [174, 448], [182, 456]], C.white, 2.6, { vary: 0.2 });
    o += shape([[240, 426], [264, 432], [262, 448], [240, 462], [218, 448], [216, 432]], C.mint, 2.6, { poly: true, vary: 0.2 }) + check(240, 443, 7, 2.6);
    o += label('PAIR', 11.5, 84, 472) + label('REMIND', 11.5, 166, 472) + label('PRIVATE', 11.5, 240, 472);
    o += inkRect(106, 484, 194, 490, 3);
    return o;
  } };

  stickers.alarm = { box: [0, 0, 320, 370], draw() {
    let o = '';
    // Ringing marks.
    [[[40, 76], [14, 48]], [[62, 46], [46, 14]], [[280, 76], [306, 48]], [[258, 46], [274, 14]], [[22, 118], [4, 112]], [[298, 118], [316, 112]]].forEach(([a, b]) => { o += rule(a, b, 5); });
    // Feet, hammer, bells.
    o += box([[82, 306], [106, 318], [76, 362], [52, 354]], C.white, 4) + box([[238, 306], [214, 318], [244, 362], [268, 354]], C.white, 4);
    o += box([[154, 22], [166, 22], [166, 66], [154, 66]], C.white, 3.4) + box([[138, 8], [182, 8], [182, 26], [138, 26]], C.white, 3.4);
    for (const flip of [1, -1]) {
      const X = (x) => 160 + flip * (x - 160);
      o += shape([[X(42), 110], [X(50), 64], [X(86), 34], [X(128), 40], [X(134), 62], [X(70), 118]], C.yellow, 5, { vary: 0.22 });
      o += hatch([[X(66), 74], [X(92), 54]], [[X(62), 98], [X(100), 70]], 5, 2.4);
    }
    // Case, then the dial: hours, minutes, numerals, two eyes for a worrying grin.
    o += circle(160, 196, 134, C.orange, 7);
    o += circle(160, 196, 112, C.white, 5);
    o += ticks(160, 196, 100, 108, 60, 1.8) + ticks(160, 196, 94, 108, 12, 4.4);
    [['12', 160, 106], ['3', 248, 196], ['6', 160, 286], ['9', 72, 196]].forEach(([n, x, y]) => { o += label(n, 24, x, y); });
    o += bigEye(124, 164, 25, 0.15, 0.12) + bigEye(196, 164, 25, 0.15, 0.12);
    o += shape([[104, 216], [160, 226], [216, 216], [196, 258], [160, 268], [124, 258]], C.white, 4.4, { vary: 0.2 });
    o += solid([[110, 220], [160, 230], [210, 220], [192, 254], [160, 262], [128, 254]], 3);
    for (let i = 0; i < 5; i += 1) { const x = 124 + i * 18; o += toWhite(solid([[x - 7, 225 + (i === 2 ? 3 : 0)], [x + 7, 225 + (i === 2 ? 3 : 0)], [x, 240]], 1)); }
    for (let i = 0; i < 4; i += 1) { const x = 133 + i * 18; o += toWhite(solid([[x - 6, 258], [x + 6, 258], [x, 244]], 1)); }
    o += hatch([[258, 112], [288, 170]], [[238, 104], [264, 150]], 6, 2.6);
    return o;
  } };

  stickers.bottle = { box: [0, 0, 260, 380], draw() {
    let o = '';
    // Spilled pills at the foot.
    o += capsule(38, 346, 56, 24, -30, C.pink, C.white, 3.2) + capsule(214, 350, 56, 24, 24, C.blue, C.white, 3.2);
    o += circle(76, 366, 12, C.yellow, 3) + rule([68, 366], [84, 366], 2.2) + circle(186, 366, 11, C.mint, 3) + rule([180, 372], [192, 360], 2.2);
    // Bottle: cap with ridges, neck, body, shoulder highlights.
    o += box([[44, 8], [216, 8], [222, 66], [38, 66]], C.white, 5);
    for (let x = 52; x < 212; x += 10) o += rule([x, 12], [x - 1, 62], 2.6);
    o += box([[60, 66], [200, 66], [200, 88], [60, 88]], C.white, 4);
    o += shape([[60, 88], [200, 88], [226, 118], [228, 334], [212, 352], [48, 352], [32, 334], [34, 118]], C.orange, 5.5, { poly: true, vary: 0.18 });
    // Pills visible through the glass above and below the label.
    [[64, 112], [100, 104], [136, 112], [174, 106], [206, 116]].forEach(([x, y], i) => { o += circle(x, y, 13, [C.pink, C.yellow, C.mint, C.white, C.blue][i], 2.8); });
    [[60, 326], [96, 334], [134, 326], [170, 334], [204, 326]].forEach(([x, y], i) => { o += circle(x, y, 13, [C.white, C.blue, C.pink, C.yellow, C.mint][i], 2.8); });
    // Label: a face, a schedule, a rule.
    o += box([[34, 134], [228, 134], [228, 304], [34, 304]], C.white, 4.6);
    o += bigEye(94, 180, 25, 0.12, 0.1) + bigEye(168, 180, 25, 0.12, 0.1);
    o += line([[102, 222], [132, 232], [162, 222]], 4);
    o += rule([50, 246], [212, 246], 2.4);
    o += label('1 CAPSULE DAILY', 17, 131, 262);
    o += rule([50, 278], [168, 278], 2.2) + rule([50, 290], [132, 290], 2.2);
    o += check(194, 284, 9, 3.4);
    o += hatch([[212, 104], [216, 128]], [[204, 104], [208, 128]], 2, 2);
    return o;
  } };

  // Blister pack for the week, with the app's trust features beside it.
  stickers.pillpack = { box: [0, 0, 660, 520], draw() {
    let o = '';
    // Blister card.
    let card = '';
    card += rr(40, 70, 420, 470, 18, C.white, 6);
    ['MON', 'TUE', 'WED', 'THU'].forEach((d, i) => { card += label(d, 22, 112 + i * 84, 100); });
    card += rule([70, 118], [392, 118], 2.4);
    for (let row = 0; row < 4; row += 1) {
      card += textOn(['AM', 'NOON', 'PM', 'LATE'][row], 12, [[56, 168 + row * 78 + 60], [56, 168 + row * 78 - 60]]);
      for (let col = 0; col < 4; col += 1) {
        const x = 112 + col * 84;
        const y = 168 + row * 78;
        const popped = (row === 0 && col < 3) || (row === 1 && col === 0);
        card += circle(x, y, 33, popped ? C.white : C.yellow, 3.4);
        card += arc(x, y, 27, 2.6, 4.4, 2.2);
        if (popped) {
          // Empty and torn foil.
          card += solid([[x - 16, y - 12], [x - 2, y - 20], [x + 16, y - 10], [x + 20, y + 8], [x + 4, y + 18], [x - 14, y + 14]], 2);
          card += check(x, y - 1, 9, 3.6).replaceAll('fill="#000"', `style="fill:var(${C.white})"`);
        } else if ((row + col) % 2) {
          card += capsule(x, y, 42, 20, -35 + col * 20, [C.pink, C.blue, C.mint, C.violet][col], C.white, 2.6);
        } else {
          card += circle(x, y, 17, [C.mint, C.pink, C.blue, C.orange][col], 2.8) + rot(col * 25 - 30, x, y, rule([x - 11, y], [x + 11, y], 2.4));
          card += toWhite(arc(x, y, 11, 3.4, 4.6, 2.2));
        }
      }
    }
    o += rot(-6, 230, 270, card);

    // QR pairing, time-bound: code, countdown.
    o += rot(5, 540, 150, rr(442, 28, 640, 268, 16, C.white, 5)
      + (() => {
        const n = 13;
        const cell = 11.4;
        const x0 = 467;
        const y0 = 46;
        let qr = '';
        const finder = (cx, cy) => inkRect(x0 + cx * cell, y0 + cy * cell, x0 + (cx + 3) * cell, y0 + (cy + 3) * cell, 2);
        qr += finder(0, 0) + finder(10, 0) + finder(0, 10);
        qr += toWhite(inkRect(x0 + 0.6 * cell, y0 + 0.6 * cell, x0 + 2.4 * cell, y0 + 2.4 * cell, 1) + inkRect(x0 + 10.6 * cell, y0 + 0.6 * cell, x0 + 12.4 * cell, y0 + 2.4 * cell, 1) + inkRect(x0 + 0.6 * cell, y0 + 10.6 * cell, x0 + 2.4 * cell, y0 + 12.4 * cell, 1));
        qr += inkRect(x0 + cell, y0 + cell, x0 + 2 * cell, y0 + 2 * cell, 0.5) + inkRect(x0 + 11 * cell, y0 + cell, x0 + 12 * cell, y0 + 2 * cell, 0.5) + inkRect(x0 + cell, y0 + 11 * cell, x0 + 2 * cell, y0 + 12 * cell, 0.5);
        for (let i = 0; i < n; i += 1) {
          for (let j = 0; j < n; j += 1) {
            const inFinder = (i < 4 && j < 4) || (i > 8 && j < 4) || (i < 4 && j > 8);
            if (!inFinder && ((i * 7 + j * 13 + i * j) % 3 === 0)) qr += inkRect(x0 + i * cell, y0 + j * cell, x0 + (i + 1) * cell - 1, y0 + (j + 1) * cell - 1, 0.5);
          }
        }
        return qr;
      })()
      + label('EXPIRES 04:59', 19, 541, 215) + rule([470, 232], [612, 232], 5) + toColor(rule([470, 232], [560, 232], 5), C.pink));
    // A link from the code to two med-friends.
    o += line([[516, 292], [508, 312], [492, 322]], 3, { tipA: 0.1, tipB: 0.1 }) + line([[580, 292], [592, 312], [606, 322]], 3, { tipA: 0.1, tipB: 0.1 });
    for (const [x, c] of [[470, C.mint], [622, C.pink]]) {
      o += circle(x, 340, 22, c, 4) + dot(x - 8, 336, 2.6) + dot(x + 8, 336, 2.6) + arc(x, 340, 12, 0.5, 2.6, 2.4);
      o += shape([[x - 30, 410], [x - 26, 372], [x, 362], [x + 26, 372], [x + 30, 410]], c, 4, { vary: 0.2 });
    }
    o += shape([[546, 388], [514, 358], [520, 334], [546, 344], [572, 334], [578, 358]], C.pink, 4, { vary: 0.2 });
    o += rule([498, 356], [514, 352], 3) + rule([594, 356], [578, 352], 3);
    // Reminder bell and privacy shield.
    o += rot(-10, 490, 462, shape([[452, 490], [464, 474], [464, 442], [490, 418], [516, 442], [516, 474], [528, 490]], C.yellow, 4.4, { vary: 0.2 }) + circle(490, 498, 9, C.orange, 3) + hatch([[502, 442], [506, 474]], [[494, 438], [496, 474]], 3, 2));
    o += shape([[596, 426], [640, 438], [636, 476], [596, 510], [556, 476], [552, 438]], C.mint, 4.4, { poly: true, vary: 0.2 }) + check(596, 464, 15, 5);
    return o;
  } };

  // ---- CubeSat: receives, decodes and relays telemetry ----
  stickers.rocket = { box: [0, 0, 260, 420], draw() {
    let o = '';
    // Layered exhaust.
    o += shape([[96, 330], [130, 420], [164, 330]], C.orange, 4, { steps: 3, vary: 0.25 }) + shape([[110, 330], [130, 390], [150, 330]], C.yellow, 3, { steps: 3, vary: 0.25 });
    [[70, 360], [190, 360], [56, 392], [204, 392], [90, 402], [172, 402]].forEach(([x, y]) => { o += circle(x, y, 4 + (x % 3), C.white, 2.4); });
    // Fins with stripes.
    o += shape([[72, 210], [20, 300], [28, 340], [78, 298]], C.blue, 5, { vary: 0.18 });
    o += shape([[188, 210], [240, 300], [232, 340], [182, 298]], C.blue, 5, { vary: 0.18 });
    o += rule([44, 280], [66, 268], 3) + rule([38, 300], [66, 284], 3) + rule([216, 280], [194, 268], 3) + rule([222, 300], [194, 284], 3);
    // Nozzle, body panels, nose.
    o += box([[92, 306], [168, 306], [178, 340], [82, 340]], C.yellow, 4.6);
    [106, 122, 138, 154].forEach((x) => { o += rule([x, 310], [x - 2, 336], 2.4); });
    o += shape([[130, 12], [176, 78], [192, 170], [186, 270], [172, 310], [88, 310], [74, 270], [68, 170], [84, 78]], C.white, 5.5, { vary: 0.18 });
    o += shape([[130, 12], [174, 76], [130, 92], [86, 76]], C.pink, 5, { vary: 0.16 });
    o += hatch([[150, 44], [168, 74]], [[138, 60], [146, 84]], 4, 2.2);
    o += rule([70, 214], [190, 214], 3.2) + rule([76, 280], [184, 280], 3.2) + rule([86, 90], [174, 90], 3.2);
    [90, 110, 130, 150, 170].forEach((x) => { o += dot(x, 222, 2.6) + dot(x, 272, 2.6); });
    for (const y of [102, 118, 134, 150, 166, 182, 198]) { o += dot(78 + Math.abs(y - 150) * 0.1, y, 2.2) + dot(182 - Math.abs(y - 150) * 0.1, y, 2.2); }
    // Porthole with an eye.
    o += circle(130, 150, 44, C.yellow, 5) + ticks(130, 150, 36, 42, 24, 2) + bigEye(130, 150, 30, 0.1, 0.05);
    // Serial panel.
    o += rule([100, 240], [160, 240], 2.8) + rule([100, 254], [146, 254], 2.8);
    o += hatch([[172, 110], [180, 200]], [[160, 106], [168, 206]], 6, 2.4);
    return o;
  } };

  // A packet coming home: the tail is its bits.
  stickers.comet = { box: [0, 0, 420, 280], draw() {
    let o = '';
    const bits = '1011010011100101';
    [...bits].forEach((b, i) => {
      const u = i / bits.length;
      const size = 34 - u * 22;
      o += label(b, size, 150 + u * 262, 94 + Math.sin(u * 9) * 8 - u * 62);
      if (i % 2) o += label(bits[(i + 3) % bits.length], size * 0.8, 150 + u * 248, 176 + Math.cos(u * 7) * 10 + u * 40);
      o += label(bits[(i + 7) % bits.length], size * 0.9, 150 + u * 270, 136 + Math.sin(u * 6 + 1) * 8);
    });
    o += shape([[110, 66], [200, 58], [270, 30], [214, 96], [300, 104], [212, 134], [270, 186], [196, 168], [106, 204]], C.orange, 5, { steps: 3, vary: 0.3 });
    o += strands([[140, 84], [150, 138], [140, 186]], [[230, 72], [262, 126], [226, 170]], 14, 2.6);
    o += circle(100, 136, 88, C.yellow, 6);
    [[50, 90, 18], [138, 74, 13], [150, 186, 16], [62, 196, 11]].forEach(([x, y, r]) => { o += circle(x, y, r, C.orange, 3.4) + arc(x, y, r * 0.65, 3.6, 5.2, 2); });
    o += stipple(100, 136, 76, 76, 40, 1.6);
    o += bigEye(96, 134, 38, -0.15, 0.05);
    return o;
  } };

  // Floor scene, cropped to a hexagon on black: the satellite over Earth, talking to the ground.
  stickers.orbit = { box: [0, 0, 640, 640], draw() {
    let o = '';
    for (let i = 0; i < 90; i += 1) {
      const x = between(60, 580);
      const y = between(40, 460);
      o += toWhite(dot(x, y, between(0.8, 2.2)));
    }
    [[150, 180, 10], [120, 300, 7], [470, 110, 11], [540, 320, 8], [330, 70, 8], [230, 100, 6]].forEach(([x, y, r]) => { o += star(x, y, r); });
    // A moon with craters, far off.
    o += circle(150, 110, 34, C.white, 3.4);
    [[140, 100, 7], [162, 120, 5], [158, 92, 3.6], [132, 124, 4]].forEach(([x, y, r]) => { o += circle(x, y, r, C.yellow, 1.8); });
    // Earth.
    const ex = 320;
    const ey = 560;
    const er = 280;
    o += toColor(arc(ex, ey, er + 22, 3.3, 6.12, 4, { tipA: 0.05, tipB: 0.05 }), C.mint);
    o += toColor(arc(ex, ey, er + 12, 3.3, 6.12, 3, { tipA: 0.05, tipB: 0.05 }), C.blue);
    o += circle(ex, ey, er, C.blue, 5);
    // Graticule, drawn as ellipses so the planet reads round.
    [0.3, 0.55, 0.8].forEach((k) => { o += line(arcPts(ex, ey, er * k, er, -2.8, -0.34, 24), 1.8, { tipA: 0.04, tipB: 0.04, min: 0.6 }); });
    o += rule([ex, ey - er], [ex, ey - 10], 1.8);
    [0.25, 0.5, 0.74].forEach((k) => { const r = er * Math.cos(Math.asin(k)); o += line(arcPts(ex, ey - er * k, r, r * 0.18, 3.14, 6.283, 24), 1.8, { tipA: 0.04, tipB: 0.04, min: 0.6 }); });
    // Continents, coast-hatched.
    const lands = [
      [[120, 412], [168, 372], [224, 356], [256, 382], [244, 416], [204, 422], [196, 462], [160, 490], [118, 470]],
      [[282, 340], [336, 330], [398, 346], [436, 380], [424, 414], [376, 406], [352, 436], [318, 430], [300, 396], [274, 374]],
      [[462, 420], [508, 410], [538, 440], [530, 490], [492, 500], [466, 468]],
      [[238, 470], [296, 462], [324, 492], [306, 540], [258, 548], [232, 510]],
    ];
    lands.forEach((land) => { o += shape(land, C.mint, 3.4, { steps: 4, vary: 0.35 }); });
    o += hatch([[130, 430], [160, 400]], [[150, 450], [186, 420]], 5, 1.8) + hatch([[316, 356], [376, 356]], [[316, 392], [366, 382]], 8, 1.8) + hatch([[260, 486], [296, 482]], [[258, 530], [296, 524]], 5, 1.8);
    // Cloud bands.
    [[90, 460], [330, 470], [440, 372]].forEach(([x, y]) => { o += toWhite(line([[x, y], [x + 30, y - 6], [x + 66, y + 2]], 7, { tipA: 0.3, tipB: 0.3 })); });
    // The orbit, dashed.
    const orbit = arcPts(ex, ey, er + 112, er + 62, 3.36, 6.07, 44);
    for (let i = 0; i < orbit.length - 1; i += 2) o += toWhite(rule(orbit[i], orbit[i + 1], 3));
    // Ground station on the limb, looking up.
    o += rot(-14, 208, 322, box([[194, 312], [222, 312], [226, 344], [190, 344]], C.white, 3) + shape([[172, 300], [208, 276], [244, 300], [208, 318]], C.white, 3.4, { vary: 0.2 }) + rule([208, 300], [214, 258], 2.4) + dot(214, 256, 3));
    // Downlink: a sine and the packet bytes along the beam.
    o += toColor(wave(232, 268, 396, 224, 6, 8, 3.4), C.yellow);
    [['A5', 226, 236], ['5A', 268, 226], ['01', 310, 216]].forEach(([b, x, y]) => {
      o += rot(-16, x, y, rr(x - 18, y - 12, x + 18, y + 12, 3, C.white, 2.4) + label(b, 18, x, y));
    });
    // The satellite: three-unit body, panels, whip antennas.
    const sat = (() => {
      let s = '';
      const panelL = [[358, 124], [424, 148], [424, 196], [358, 172]];
      const panelR = [[494, 148], [560, 124], [560, 172], [494, 196]];
      for (const q of [panelL, panelR]) { s += box(q, C.blue, 3.4) + quadGrid(q, 5, 3, 1.5); }
      const front = [[430, 132], [466, 146], [466, 212], [430, 198]];
      const side = [[466, 146], [492, 132], [492, 198], [466, 212]];
      const top = [[430, 132], [456, 118], [492, 132], [466, 146]];
      s += box(top, C.yellow, 3.4) + box(front, C.white, 3.4) + box(side, C.pink, 3.4);
      s += circle(...onQuad(front, 0.5, 0.42), 11, C.blue, 2.4) + dot(...onQuad(front, 0.5, 0.42), 4.4);
      for (let v = 0.72; v < 0.95; v += 0.1) s += rule(onQuad(front, 0.2, v), onQuad(front, 0.8, v), 1.6);
      for (let v = 0.14; v < 0.9; v += 0.12) s += rule(onQuad(side, 0.2, v), onQuad(side, 0.8, v), 1.6);
      s += toWhite(rule([448, 124], [434, 88], 2.2) + rule([474, 126], [492, 90], 2.2));
      return s;
    })();
    o += `<g transform="translate(-30 16)">${sat}${[16, 30, 44].map((r) => toColor(arc(458, 100, r, -2.3, -0.84, 3), C.pink)).join('')}</g>`;
    return o;
  } };

  // Case card: dish receives, the rack decodes, the mast relays.
  stickers.dish = { box: [0, 0, 680, 520], draw() {
    let o = '';
    [[40, 40, 8], [300, 30, 10], [440, 60, 6], [640, 40, 9], [190, 22, 5], [560, 110, 5]].forEach(([x, y, r]) => { o += star(x, y, r, C.white); });
    // Incoming signal.
    [[380, 26], [418, 56]].forEach(([x, y]) => { o += toColor(wave(x, y, x - 128, y + 62, 3, 8, 3.8), C.yellow); });
    // Ground.
    o += toWhite(rule([0, 484], [680, 484], 5));
    o += hatch([[20, 492], [660, 492]], [[4, 516], [644, 516]], 40, 2).replaceAll('fill="#000"', `style="fill:var(${C.white})"`);
    // Lattice tower.
    o += box([[92, 484], [114, 340], [142, 340], [174, 484]], C.white, 4);
    for (let i = 0; i < 5; i += 1) {
      const u = i / 5;
      const v = (i + 1) / 5;
      const lx = (k) => 92 + 22 * k;
      const rx = (k) => 174 - 32 * k;
      const y = (k) => 484 - 144 * k;
      o += rule([lx(u), y(u)], [rx(v), y(v)], 2.4) + rule([rx(u), y(u)], [lx(v), y(v)], 2.4) + rule([lx(v), y(v)], [rx(v), y(v)], 2.4);
    }
    o += circle(128, 340, 20, C.yellow, 3.6) + bolt(128, 340, 7);
    // The dish, seen from the front and tilted up: rim, ribs, mesh rings.
    o += rot(-30, 128, 216,
      shape(arcPts(128, 216, 112, 138, 0, 6.15, 18), C.white, 5.5, { steps: 2, vary: 0.2 })
      + [0.33, 0.58, 0.82].map((k) => line(arcPts(128, 216, 112 * k, 138 * k, 0, 6.283, 22), 2, { tipA: 0.01, tipB: 0.01, min: 0.7 })).join('')
      + Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * 6.283; return rule([128 + Math.cos(a) * 16, 216 + Math.sin(a) * 20], [128 + Math.cos(a) * 110, 216 + Math.sin(a) * 136], 1.8); }).join('')
      + hatch([[182, 150], [226, 216]], [[168, 158], [206, 222]], 8, 1.8));
    // Feed horn on three struts.
    o += rule([60, 150], [234, 96], 3) + rule([196, 296], [234, 96], 3) + rule([128, 216], [234, 96], 3);
    o += rot(-30, 234, 96, box([[220, 68], [248, 68], [242, 110], [226, 110]], C.pink, 3.4) + rule([224, 80], [244, 80], 2));
    // Coax to the rack.
    o += line([[150, 344], [210, 380], [250, 340], [292, 330]], 5, { tipA: 0.01, tipB: 0.01, min: 0.8 });
    // Decoder rack.
    o += box([[282, 170], [492, 170], [492, 484], [282, 484]], C.pink, 5.5);
    // Oscilloscope: raw signal.
    o += rr(298, 186, 476, 262, 6, '--s-c,#0a6ee0', 3.4);
    o += toWhite(wave(306, 224, 468, 224, 5, 22, 2.8));
    // Decoded bytes.
    o += rr(298, 272, 476, 330, 6, C.white, 3.4);
    o += label('A5 5A 01 7F', 28, 387, 292);
    o += label('DECODED', 13, 387, 317);
    // Controls and status.
    [[320, 362], [370, 362]].forEach(([x, y]) => { o += circle(x, y, 18, C.yellow, 3.4) + rule([x, y], [x + 8, y - 14], 3); });
    for (let i = 0; i < 5; i += 1) o += circle(410 + i * 16, 354, 5.5, i < 3 ? C.mint : C.white, 2.2);
    o += rule([408, 374], [476, 374], 2.8);
    for (let y = 400; y < 470; y += 11) o += rule([300, y], [474, y], 3.4);
    [[292, 180], [482, 180], [292, 474], [482, 474]].forEach(([x, y]) => { o += bolt(x, y, 4.4); });
    // Relay: cable, mast, outgoing arcs.
    o += line([[492, 440], [530, 460], [566, 440]], 5, { tipA: 0.01, tipB: 0.01, min: 0.8 });
    o += box([[540, 484], [558, 190], [576, 190], [594, 484]], C.yellow, 4.4);
    for (let i = 0; i < 6; i += 1) {
      const u = i / 6;
      const v = (i + 1) / 6;
      const lx = (k) => 540 + 18 * k;
      const rx = (k) => 594 - 18 * k;
      const y = (k) => 484 - 294 * k;
      o += rule([lx(u), y(u)], [rx(v), y(v)], 2.4) + rule([lx(v), y(v)], [rx(v), y(v)], 2.4);
    }
    o += circle(567, 176, 15, C.white, 4) + dot(567, 176, 5);
    [30, 54, 78].forEach((r) => { o += toColor(arc(567, 176, r, -0.9, 0.9, 4.4), C.yellow) + toColor(arc(567, 176, r, 2.24, 4.04, 4.4), C.yellow); });
    return o;
  } };

  // ---- Recognition ----
  stickers.trophy = { box: [0, 0, 340, 460], draw() {
    let o = '';
    // Handles, then the cup.
    o += line([[70, 60], [10, 62], [14, 136], [86, 186]], 18, { tipA: 0.02, tipB: 0.02, min: 0.9 }) + toColor(line([[70, 60], [10, 62], [14, 136], [86, 186]], 10, { tipA: 0.02, tipB: 0.02, min: 0.9 }), C.yellow);
    o += line([[270, 60], [330, 62], [326, 136], [254, 186]], 18, { tipA: 0.02, tipB: 0.02, min: 0.9 }) + toColor(line([[270, 60], [330, 62], [326, 136], [254, 186]], 10, { tipA: 0.02, tipB: 0.02, min: 0.9 }), C.yellow);
    o += shape([[58, 22], [282, 22], [276, 110], [250, 180], [200, 228], [140, 228], [90, 180], [64, 110]], C.yellow, 6, { vary: 0.16 });
    o += shape([[50, 10], [290, 10], [286, 36], [54, 36]], C.orange, 5, { poly: true, vary: 0.16 });
    for (let x = 66; x < 284; x += 13) o += rule([x, 14], [x, 32], 2.2);
    // Star on an engraved medallion, with laurel either side.
    o += circle(170, 112, 56, C.white, 4.4) + ticks(170, 112, 46, 53, 40, 1.6);
    const starPts = [];
    for (let i = 0; i < 10; i += 1) { const a = -1.571 + (i / 10) * 6.283; const r = i % 2 ? 17 : 40; starPts.push([170 + Math.cos(a) * r, 112 + Math.sin(a) * r]); }
    o += box(starPts, C.pink, 3.6);
    for (const f of [1, -1]) {
      for (let i = 0; i < 6; i += 1) {
        const a = 0.2 + i * 0.28;
        const x = 170 + f * Math.cos(a) * 80;
        const y = 120 + Math.sin(a) * 74;
        o += rot(f * (a * 57 + 80), x, y, shape([[x, y - 13], [x + 6, y], [x, y + 13], [x - 6, y]], C.mint, 2.4, { vary: 0.2 }) + rule([x, y - 10], [x, y + 10], 1.4));
      }
    }
    o += hatch([[258, 44], [242, 150]], [[236, 42], [226, 146]], 10, 2.4);
    o += toWhite(line([[84, 48], [92, 118], [110, 164]], 7, { tipA: 0.2, tipB: 0.4 }));
    // Stem and knop.
    o += box([[146, 226], [194, 226], [186, 262], [154, 262]], C.yellow, 4.6);
    o += shape([[136, 268], [170, 256], [204, 268], [196, 288], [170, 296], [144, 288]], C.orange, 4.6, { vary: 0.18 });
    o += box([[152, 292], [188, 292], [204, 322], [136, 322]], C.yellow, 4.6);
    o += hatch([[180, 232], [178, 256]], [[172, 232], [172, 256]], 3, 2);
    // Plinth, naming the real olympiads.
    o += box([[100, 322], [240, 322], [248, 350], [92, 350]], C.white, 4.6);
    o += label('ITMO', 24, 170, 337);
    o += box([[74, 350], [266, 350], [274, 382], [66, 382]], C.white, 4.6);
    o += label('ROSATOM', 24, 170, 367);
    o += box([[44, 382], [296, 382], [304, 420], [36, 420]], C.white, 4.6);
    o += label('AEROSPACE', 26, 170, 402);
    o += box([[26, 420], [314, 420], [320, 448], [20, 448]], C.violet, 4.6);
    [[46, 434], [294, 434]].forEach(([x, y]) => { o += bolt(x, y, 5); });
    return o;
  } };

  stickers.laurel = { box: [0, 0, 190, 400], draw() {
    let o = '';
    const stem = [[146, 392], [108, 330], [74, 250], [58, 166], [68, 86], [104, 14]];
    const c = kit.catmull(stem, false, 14);
    o += line(stem, 7, { tipA: 0.03, tipB: 0.3, min: 0.3 });
    for (let i = 3; i < c.length - 2; i += 5) {
      const p = c[i];
      const q = c[i + 1];
      const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
      const scale = 1 - (i / c.length) * 0.35;
      for (const side of [-1, 1]) {
        const len = between(56, 66) * scale;
        const dir = a + side * 0.72;
        const tip = [p[0] + Math.cos(dir) * len, p[1] + Math.sin(dir) * len];
        const m = [p[0] + Math.cos(dir) * len * 0.5, p[1] + Math.sin(dir) * len * 0.5];
        const nx = Math.cos(dir + 1.57) * len * 0.22;
        const ny = Math.sin(dir + 1.57) * len * 0.22;
        o += shape([p, [m[0] + nx, m[1] + ny], tip, [m[0] - nx, m[1] - ny]], (i + (side > 0 ? 0 : 3)) % 12 < 6 ? C.mint : C.yellow, 3.6, { vary: 0.2 });
        o += line([p, m, [tip[0] * 0.92 + m[0] * 0.08, tip[1] * 0.92 + m[1] * 0.08]], 2.2);
        // Side veins.
        for (const u of [0.35, 0.55, 0.72]) {
          const b = [p[0] + (tip[0] - p[0]) * u, p[1] + (tip[1] - p[1]) * u];
          o += rule(b, [b[0] + nx * 0.55 + Math.cos(dir) * len * 0.08, b[1] + ny * 0.55 + Math.sin(dir) * len * 0.08], 1.3);
          o += rule(b, [b[0] - nx * 0.55 + Math.cos(dir) * len * 0.08, b[1] - ny * 0.55 + Math.sin(dir) * len * 0.08], 1.3);
        }
      }
      if (i % 15 === 3) o += circle(p[0] + 8, p[1] + 4, 6, C.pink, 2.4);
    }
    return o;
  } };

  stickers.medal = { box: [0, 0, 260, 400], draw() {
    let o = '';
    o += shape([[34, 8], [104, 8], [150, 206], [108, 234]], C.blue, 5, { poly: true, vary: 0.16 });
    o += rule([56, 12], [124, 214], 3) + rule([80, 12], [138, 208], 3);
    o += shape([[226, 8], [156, 8], [110, 206], [152, 234]], C.pink, 5, { poly: true, vary: 0.16 });
    o += rule([204, 12], [136, 214], 3) + rule([180, 12], [122, 208], 3);
    o += box([[92, 196], [168, 196], [172, 232], [88, 232]], C.yellow, 4.4);
    for (let x = 100; x < 168; x += 11) o += rule([x, 200], [x, 228], 2);
    o += circle(130, 300, 94, C.yellow, 6) + ticks(130, 300, 80, 92, 60, 2);
    o += circle(130, 300, 76, C.orange, 4.4);
    for (const f of [1, -1]) {
      for (let i = 0; i < 7; i += 1) {
        const a = 0.3 + i * 0.3;
        const x = 130 + f * Math.cos(a) * 62;
        const y = 304 + Math.sin(a) * 58;
        o += rot(f * (a * 57 + 80), x, y, shape([[x, y - 11], [x + 5, y], [x, y + 11], [x - 5, y]], C.mint, 2.2, { vary: 0.2 }));
      }
    }
    const pts = [];
    for (let i = 0; i < 10; i += 1) { const a = -1.571 + (i / 10) * 6.283; const r = i % 2 ? 21 : 48; pts.push([130 + Math.cos(a) * r, 294 + Math.sin(a) * r]); }
    o += box(pts, C.white, 4);
    o += rule([130, 262], [130, 294], 2) + rule([100, 284], [130, 294], 2) + rule([160, 284], [130, 294], 2) + rule([112, 330], [130, 294], 2) + rule([148, 330], [130, 294], 2);
    o += arc(130, 300, 86, 3.6, 4.6, 3);
    return o;
  } };
};
