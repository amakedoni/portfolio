#!/usr/bin/env node
// Splits assets/stickers.svg into assets/stickers/<id>.svg, one drawing per file, which is what the pages load.
// The sprite is 2.7MB; served whole, the first screen waited on every drawing to show its six. One file each
// lets a page fetch only what it shows, and lets drawings further down load as they come near (see js/ui.js).
// build-stickers.cjs runs this after drawing; run it by hand after editing the sprite.
const fs = require('node:fs');
const path = require('node:path');

const assets = path.resolve(__dirname, '..', 'assets');
const sprite = fs.readFileSync(path.join(assets, 'stickers.svg'), 'utf8');
const out = path.join(assets, 'stickers');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
let count = 0;
for (const [symbol, id] of sprite.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)) {
  fs.writeFileSync(path.join(out, `${id}.svg`), `<svg xmlns="http://www.w3.org/2000/svg">\n${symbol}\n</svg>\n`);
  count += 1;
}
console.log(`assets/stickers/ ${count} files`);
