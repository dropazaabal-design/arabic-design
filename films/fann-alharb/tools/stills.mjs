// Render many stills with one bundle: node tools/stills.mjs OUTDIR FRAME [FRAME ...]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [out, ...frames] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browserExecutable = process.env.REMOTION_CHROME || '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), webpackOverride: (c) => ({ ...c, resolve: { ...c.resolve, modules: [path.resolve('node_modules'), 'node_modules'] } }) });
const composition = await selectComposition({ serveUrl, id: 'Film', browserExecutable });
for (const f of frames.map(Number)) {
  await renderStill({ serveUrl, composition, frame: f, output: path.join(out, `${String(f).padStart(6, '0')}.png`), browserExecutable, scale: 0.5 });
}
console.log(`${frames.length} stills → ${out}`);
