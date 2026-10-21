// Render review stills: node tools/stills.mjs COMPOSITION OUTDIR [--guides] 12.5 40 …  (seconds)
// REMOTION_CHROME=/path/to/headless_shell picks the browser.
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [id, out, ...rest] = process.argv.slice(2);
const guides = rest.includes('--guides');
const times = rest.filter((a) => a !== '--guides').map(Number);
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browserExecutable = process.env.REMOTION_CHROME || null;
const inputProps = guides ? { guides } : {};
const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable });
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps));
  const file = path.join(out, `${id}-${String(t.toFixed(1)).padStart(6, '0')}${guides ? '-g' : ''}.png`);
  await renderStill({ composition, serveUrl, frame, output: file, inputProps: { ...composition.defaultProps, ...inputProps }, browserExecutable });
  console.log(file);
}
