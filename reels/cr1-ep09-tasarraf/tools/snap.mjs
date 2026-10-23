// Render stills from several compositions with one bundle: node tools/snap.mjs OUTDIR Comp[@frame] …
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [out, ...items] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const webpackOverride = (c) => ({ ...c, resolve: { ...c.resolve, modules: [path.resolve('node_modules'), 'node_modules'] } });
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.ENTRY || 'src/index.ts'), webpackOverride });
const browserExecutable = process.env.REMOTION_CHROME || null;
for (const it of items) {
  const [id, fr] = it.split('@');
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  const frame = Math.min(composition.durationInFrames - 1, Number(fr ?? 0));
  const file = path.join(out, `${id}${fr ? '-' + String(frame).padStart(6, '0') : ''}.png`);
  await renderStill({ composition, serveUrl, frame, output: file, browserExecutable });
  console.log(file);
}
