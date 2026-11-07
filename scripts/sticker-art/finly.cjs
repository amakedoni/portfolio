// Finly's two scenes, drawn from what the app really shows: balance, categories, goals and budgets,
// with the figures from its own screens. Labels are in English to match the site.
module.exports = (stickers, kit, t) => {
  const { C, shape, line, dot, circle, hatch, textOn } = kit;
  const { toWhite, toColor, box, rule, rot, wrap, arc, ticks, rr, inkRect, star, check } = t;
  const label = (text, size, x, y, opts = {}) => textOn(text, size, [[x - 400, y], [x + 400, y]], opts);
  const left = (text, size, x, y, opts = {}) => textOn(text, size, [[x, y], [x + 800, y]], { align: 'start', ...opts });
  const stamp = (name, x, y, k) => wrap(`translate(${x} ${y}) scale(${k})`, stickers[`i-${name}`].draw());

  // The rouble sign, drawn, since the type has none.
  const rouble = (x, y, h, w = h * 0.15) => rule([x, y - h / 2], [x, y + h / 2], w)
    + line([[x, y - h / 2], [x + h * 0.42, y - h * 0.42], [x + h * 0.42, y - h * 0.08], [x, y + h * 0.02]], w, { tipA: 0.02, tipB: 0.02, min: 0.85 })
    + rule([x - h * 0.22, y + h * 0.02], [x + h * 0.2, y + h * 0.02], w * 0.85) + rule([x - h * 0.22, y + h * 0.24], [x + h * 0.2, y + h * 0.24], w * 0.85);
  const money = (text, size, x, y) => left(text, size, x, y) + rouble(x + text.length * size * 0.385 + size * 0.34, y, size * 0.72);

  const phone = (x0, y0, x1, y1, rim, body) => rr(x0, y0, x1, y1, 34, rim, 5.5)
    + rr(x0 + 11, y0 + 11, x1 - 11, y1 - 11, 25, C.white, 3.4)
    + inkRect((x0 + x1) / 2 - 34, y0 + 19, (x0 + x1) / 2 + 34, y0 + 37, 9)
    + rule([x1 + 3, y0 + 96], [x1 + 3, y0 + 146], 5) + rule([x0 - 3, y0 + 86], [x0 - 3, y0 + 116], 5) + rule([x0 - 3, y0 + 128], [x0 - 3, y0 + 164], 5)
    + body;

  // The bottom bar, with the app's AI button lifted in the middle.
  const tabBar = (x0, x1, y) => {
    const c = (x0 + x1) / 2;
    let o = rule([x0 + 20, y - 26], [x1 - 20, y - 26], 2);
    for (const x of [x0 + 36, x0 + 74, x1 - 74, x1 - 36]) o += rr(x - 10, y - 14, x + 10, y + 6, 4, C.white, 2.4);
    o += circle(c, y - 10, 25, C.violet, 3.6) + toWhite(kit.solid([[c, y - 26], [c + 4, y - 14], [c + 16, y - 10], [c + 4, y - 6], [c, y + 6], [c - 4, y - 6], [c - 16, y - 10], [c - 4, y - 14]], 2));
    return o;
  };

  // Top floor: a phone holding the whole month, with what makes the app unusual around it.
  stickers['finly-floor'] = { box: [0, 0, 640, 640], draw() {
    let o = '';
    // Rays and stars behind everything.
    for (let i = 0; i < 28; i += 1) {
      const a = (i / 28) * 6.283;
      o += toWhite(rule([320 + Math.cos(a) * 250, 320 + Math.sin(a) * 250], [320 + Math.cos(a) * (i % 2 ? 300 : 316), 320 + Math.sin(a) * (i % 2 ? 300 : 316)], i % 2 ? 2.4 : 4));
    }
    [[150, 118, 12], [500, 526, 12], [92, 318, 8], [552, 340, 8], [242, 44, 7], [420, 600, 7]].forEach(([x, y, r]) => { o += star(x, y, r, C.yellow); });

    // Receipt, curling in from the left, ready to be scanned.
    let receipt = shape([[56, 150], [176, 150], [176, 322], [156, 310], [136, 322], [116, 310], [96, 322], [76, 310], [56, 322]], C.white, 4.6, { poly: true, vary: 0.1 });
    receipt += inkRect(70, 166, 110, 206, 2) + toWhite(inkRect(79, 175, 101, 197, 1)) + inkRect(85, 181, 95, 191, 0.5);
    for (const [x, y] of [[122, 166], [140, 166], [158, 172], [122, 184], [146, 190], [122, 200]]) receipt += inkRect(x, y, x + 9, y + 9, 0.5);
    receipt += rule([70, 224], [162, 224], 3) + rule([70, 244], [140, 244], 3) + rule([70, 264], [162, 264], 3) + rule([70, 286], [122, 286], 5);
    o += rot(-13, 116, 236, receipt);

    // Coins on the way in.
    for (const [x, y, r] of [[106, 432, 48], [176, 492, 34], [84, 506, 26]]) {
      o += circle(x, y, r, C.yellow, 4.6) + ticks(x, y, r * 0.72, r * 0.92, Math.round(r * 0.8), 1.8) + rouble(x - r * 0.12, y, r * 0.8, r * 0.13);
    }

    // The phone: balance, this month's flow, categories.
    const px = 190;
    const py = 44;
    const x1 = 450;
    const y1 = 596;
    let s = '';
    s += left('9:41', 15, px + 28, py + 30) + inkRect(x1 - 52, py + 25, x1 - 47, py + 35, 0.5) + inkRect(x1 - 44, py + 22, x1 - 39, py + 35, 0.5) + inkRect(x1 - 36, py + 19, x1 - 31, py + 35, 0.5);
    s += left('BALANCE', 15, px + 26, py + 62);
    s += money('183 843', 50, px + 26, py + 96);
    // Income and spending.
    s += rr(px + 24, py + 128, px + 126, py + 186, 10, C.mint, 2.8) + left('INCOME', 11, px + 34, py + 142) + left('+85 000', 21, px + 34, py + 166);
    s += rr(px + 134, py + 128, x1 - 24, py + 186, 10, C.pink, 2.8) + left('SPENT', 11, px + 144, py + 142) + left('-11 558', 21, px + 144, py + 166);
    // Donut.
    const cx = 320;
    const cy = py + 268;
    const parts = [[-1.571, 0.7, C.mint], [0.7, 2.6, C.orange], [2.6, 3.9, C.violet], [3.9, 4.712, C.blue]];
    s += arc(cx, cy, 58, 0, 6.283, 28, { tipA: 0.001, tipB: 0.001, min: 1 });
    parts.forEach(([a, b, c]) => { s += toColor(arc(cx, cy, 58, a + 0.03, b - 0.03, 22, { tipA: 0.001, tipB: 0.001, min: 1 }), c); });
    s += label('8 470', 24, cx, cy - 7) + label('TOP 3', 11, cx, cy + 13);
    // Categories, each with its own share of the ring.
    [['GROCERIES', '3 420', C.mint], ['FOOD', '3 160', C.orange], ['SHOPPING', '1 890', C.violet]].forEach(([name, value, c], i) => {
      const y = py + 366 + i * 33;
      s += circle(px + 40, y, 8, c, 2.4) + left(name, 15, px + 58, y) + textOn(value, 16, [[x1 - 90, y], [x1 - 26, y]]);
      s += rule([px + 28, y + 16], [x1 - 28, y + 16], 1.4);
    });
    s += tabBar(px + 10, x1 - 10, y1 - 34);
    o += rot(-7, 320, 320, phone(px, py, x1, y1, C.blue, s));

    // What runs on the device, with no connection.
    o += rot(9, 526, 262, rr(466, 200, 586, 320, 14, C.yellow, 4.6) + stamp('ml', 478, 212, 0.8));
    o += wrap('translate(-14 36)', rot(-10, 492, 112, rr(436, 58, 548, 164, 14, C.mint, 4.6) + stamp('offline', 448, 66, 0.74)));
    o += rot(8, 520, 438, rr(462, 380, 578, 496, 14, C.white, 4.6) + stamp('fingerprint', 472, 390, 0.8));
    return o;
  } };

  // Project file: the savings goals and budgets, side by side, as in the app.
  stickers['finly-case'] = { box: [0, 0, 680, 544], draw() {
    let o = '';
    // A target: saving towards something.
    for (const [r, c] of [[74, C.pink], [52, C.white], [30, C.pink], [11, C.white]]) o += circle(84, 112, r, c, 4);
    o += rule([84, 112], [176, 24], 5) + box([[176, 24], [196, 6], [204, 26], [184, 34]], C.blue, 2.8);
    o += hatch([[34, 150], [60, 174]], [[20, 132], [44, 164]], 4, 2);

    // Coins stacked into a rising bar, the plan.
    [[40, 3], [86, 5], [132, 8]].forEach(([x, n]) => {
      for (let i = 0; i < n; i += 1) {
        const y = 516 - i * 19;
        o += rr(x - 2, y - 16, x + 44, y, 7, C.orange, 3.4);
        for (let v = x + 6; v < x + 42; v += 7) o += rule([v, y - 13], [v, y - 3], 1.5);
      }
    });
    o += rule([18, 520], [200, 520], 5);

    // Goals phone.
    {
      const x0 = 190; const y0 = 24; const x1 = 424; const y1 = 536;
      let s = left('GOALS', 34, x0 + 24, y0 + 74);
      s += rr(x0 + 22, y0 + 104, x1 - 22, y0 + 240, 12, C.white, 2.8);
      s += circle(x0 + 44, y0 + 128, 13, C.violet, 2.6) + toWhite(check(x0 + 44, y0 + 128, 6, 2.6));
      s += left('NEW MACBOOK', 18, x0 + 66, y0 + 128);
      s += money('112 000', 31, x0 + 34, y0 + 164);
      s += rr(x0 + 34, y0 + 184, x1 - 34, y0 + 194, 5, C.white, 2.2) + rr(x0 + 34, y0 + 184, x0 + 136, y0 + 194, 5, C.blue, 2.2);
      s += rr(x0 + 34, y0 + 204, x1 - 34, y0 + 232, 7, C.blue, 2.4) + label('ADD MONEY', 15, (x0 + x1) / 2, y0 + 218, { color: C.white });
      s += rr(x0 + 22, y0 + 250, x1 - 22, y0 + 386, 12, C.white, 2.8);
      s += circle(x0 + 44, y0 + 274, 13, C.mint, 2.6) + rule([x0 + 36, y0 + 278], [x0 + 52, y0 + 270], 3);
      s += left('VACATION', 18, x0 + 66, y0 + 274);
      s += money('64 000', 31, x0 + 34, y0 + 310);
      s += rr(x0 + 34, y0 + 330, x1 - 34, y0 + 340, 5, C.white, 2.2) + rr(x0 + 34, y0 + 330, x0 + 146, y0 + 340, 5, C.mint, 2.2);
      s += rr(x0 + 34, y0 + 350, x1 - 34, y0 + 378, 7, C.blue, 2.4) + label('ADD MONEY', 15, (x0 + x1) / 2, y0 + 364, { color: C.white });
      s += tabBar(x0 + 8, x1 - 8, y1 - 34);
      o += rot(-5, 307, 280, phone(x0, y0, x1, y1, C.pink, s));
    }
    // Budgets phone, in front.
    {
      const x0 = 434; const y0 = 12; const x1 = 662; const y1 = 524;
      let s = left('BUDGETS', 32, x0 + 24, y0 + 72);
      s += rr(x0 + 22, y0 + 94, x1 - 22, y0 + 130, 9, C.yellow, 2.6) + label('THIS MONTH', 15, (x0 + x1) / 2, y0 + 112);
      s += left('SPENT', 14, x0 + 26, y0 + 154);
      s += left('7 499', 30, x0 + 26, y0 + 182) + textOn('/ 52 000', 18, [[x0 + 104, y0 + 186], [x1 - 22, y0 + 186]], { align: 'start' });
      s += rr(x0 + 26, y0 + 204, x1 - 26, y0 + 214, 5, C.white, 2.2) + rr(x0 + 26, y0 + 204, x0 + 62, y0 + 214, 5, C.mint, 2.2);
      s += left('44 501 LEFT', 13, x0 + 26, y0 + 228);
      [['FOOD', '840 / 15 000', 0.06, C.orange], ['GROCERIES', '3 420 / 18 000', 0.19, C.mint], ['SHOPPING', '1 890 SPENT', 0.1, C.violet]].forEach(([name, value, share, c], i) => {
        const y = y0 + 248 + i * 58;
        s += rr(x0 + 22, y, x1 - 22, y + 50, 9, C.white, 2.4);
        s += circle(x0 + 42, y + 18, 8, c, 2.2) + left(name, 14, x0 + 56, y + 18);
        s += textOn(value, 11.5, [[x0 + 56, y + 36], [x1 - 34, y + 36]], { align: 'start' });
        s += rr(x1 - 66, y + 12, x1 - 32, y + 22, 4, C.white, 1.8);
        s += inkRect(x1 - 66, y + 12, x1 - 66 + 34 * share + 3, y + 22, 2);
      });
      s += tabBar(x0 + 8, x1 - 8, y1 - 34);
      o += rot(4, 548, 268, phone(x0, y0, x1, y1, C.violet, s));
    }
    return o;
  } };
};
