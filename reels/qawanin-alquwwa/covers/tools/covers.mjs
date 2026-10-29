// Render the six covers with one bundle: node tools/covers.mjs [part ...]  → out/cover-0N.png (+ .jpg)
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const parts = (process.argv.slice(2).length ? process.argv.slice(2) : ['1', '2', '3', '4', '5', '6']).map(Number);
const browserExecutable = process.env.REMOTION_CHROME || '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
fs.mkdirSync('out', { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), webpackOverride: (c) => ({ ...c, resolve: { ...c.resolve, modules: [path.resolve('node_modules'), 'node_modules'] } }) });
for (const part of parts) {
  const inputProps = { part };
  const composition = await selectComposition({ serveUrl, id: 'Cover', inputProps, browserExecutable });
  const png = `out/cover-0${part}.png`;
  await renderStill({ serveUrl, composition, inputProps, output: png, browserExecutable, scale: Number(process.env.SCALE || 1) });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '2', png.replace('.png', '.jpg')]);
  console.log(png);
}
