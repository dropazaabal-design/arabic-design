// Render review stills at given seconds (or frame numbers with an "f" suffix).
// usage: REMOTION_CHROME=/path/to/chromium node tools/stills.mjs OUTDIR [--guides] 0 2.5 10f …
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const args = process.argv.slice(2);
const out = args.shift();
const guides = args.includes('--guides');
const times = args.filter((a) => a !== '--guides');
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browserExecutable = process.env.REMOTION_CHROME || null;
const composition = await selectComposition({ serveUrl, id: 'Reel', inputProps: { guides }, browserExecutable });
for (const t of times) {
  const frame = t.endsWith('f') ? Number(t.slice(0, -1)) : Math.round(Number(t) * composition.fps);
  const file = path.join(out, `f${String(frame).padStart(4, '0')}${guides ? '-g' : ''}.png`);
  await renderStill({ composition, serveUrl, frame, output: file, inputProps: { guides }, browserExecutable });
  console.log(file);
}
