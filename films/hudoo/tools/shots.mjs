// Render shot stills from the silent film: node tools/shots.mjs key|review FIRST-LAST
//   key    → previews/shots/NNN.png, one per shot at its key frame (timing/shots.json, made by tools/shots.py)
//   review → previews/review/NNN-a|b|c.png, three frames per shot (start, middle, end) for the batch review
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [mode, range] = process.argv.slice(2);
const [a, b] = range.split('-').map(Number);
const shots = JSON.parse(fs.readFileSync('timing/shots.json', 'utf8')).filter((s) => s.id >= a && s.id <= (b || a));
const out = mode === 'key' ? 'previews/shots' : 'previews/review';
fs.mkdirSync(out, { recursive: true });
const webpackOverride = (c) => ({ ...c, resolve: { ...c.resolve, modules: [path.resolve('node_modules'), 'node_modules'] } });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), webpackOverride });
const pw = '/opt/pw-browsers';
const local = fs.existsSync(pw) ? fs.readdirSync(pw).filter((d) => d.startsWith('chromium_headless_shell')).map((d) => path.join(pw, d, 'chrome-linux/headless_shell')).find((f) => fs.existsSync(f)) : null;
const browserExecutable = process.env.REMOTION_CHROME || local || null;
const composition = await selectComposition({ serveUrl, id: 'FilmSilent', browserExecutable });
for (const s of shots) {
  const frames = mode === 'key' ? [['', s.key]] : s.review.map((f, i) => [`-${'abc'[i]}`, f]);
  for (const [tag, frame] of frames) {
    const file = path.join(out, `${String(s.id).padStart(3, '0')}${tag}.png`);
    await renderStill({ composition, serveUrl, frame, output: file, browserExecutable, imageFormat: 'png' });
  }
  console.log(s.id);
}
