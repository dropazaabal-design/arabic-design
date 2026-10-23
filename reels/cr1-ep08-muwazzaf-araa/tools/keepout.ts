// The caption gate (CR1 practice since EP04): for every frame with a caption or the credit on screen, the caption
// area must not overlap any face, hand or card that carries the joke (the boxes each shot reports).
// usage: npx esbuild tools/keepout.ts --bundle --platform=node --format=esm --outfile=$TMP/keepout.mjs && node $TMP/keepout.mjs
import { writeFileSync } from 'node:fs';
import { CAPTION, CREDIT_FROM, captionAt } from '../src/Episode';
import { SHOTS, TOTAL, shotAt } from '../src/shots';

const hits: Record<string, number[]> = {};
let checked = 0;
for (let f = 0; f < TOTAL; f++) {
  if (!captionAt(f) && f < CREDIT_FROM) continue;
  checked++;
  const s = SHOTS[shotAt(f)];
  for (const g of s.render(f).guards) {
    const over = Math.min(g.x1, CAPTION.x1) - Math.max(g.x0, CAPTION.x0) > 0 && Math.min(g.y1, CAPTION.bottom) - Math.max(g.y0, CAPTION.top) > 0;
    if (over) (hits[`${s.id}:${g.what}`] ??= []).push(f);
  }
}
const report = { frames: TOTAL, checked, overlaps: Object.fromEntries(Object.entries(hits).map(([k, v]) => [k, { count: v.length, first: v[0], last: v[v.length - 1] }])) };
writeFileSync('qa/keepout.json', JSON.stringify(report, null, 1) + '\n');
console.log(JSON.stringify(report, null, 1));
process.exit(Object.keys(hits).length ? 1 : 0);
