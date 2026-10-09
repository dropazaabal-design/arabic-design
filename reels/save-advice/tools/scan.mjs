// Render one small frame every STEP frames across the episode (for stillness / empty-frame review).
// usage: node tools/scan.mjs OUTDIR [STEP=30] [SCALE=0.25]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [out, step = '30', scale = '0.25'] = process.argv.slice(2);
const root = path.resolve(new URL('..', import.meta.url).pathname);
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
const browserExecutable = process.env.REMOTION_CHROME;
const comp = await selectComposition({ serveUrl, id: 'Reel', browserExecutable });
for (let frame = 0; frame < comp.durationInFrames; frame += Number(step)) {
  await renderStill({ serveUrl, composition: comp, frame, output: `${out}/${String(frame).padStart(5, '0')}.png`, browserExecutable, overwrite: true, scale: Number(scale) });
}
console.log(out);
