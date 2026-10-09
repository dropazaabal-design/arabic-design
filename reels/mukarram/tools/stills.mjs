// Render chosen frames (or seconds with an "s" suffix) to PNG with one bundle, then tile them 5 per row.
// Adapted from reels/save-advice/tools/stills.mjs (public folder = assets/).
// usage: REMOTION_CHROME=… node tools/stills.mjs OUTDIR NAME 0 1.5s 120 ...
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const [out, name, ...list] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const root = path.resolve(new URL('..', import.meta.url).pathname);
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/video/index.ts'), publicDir: path.join(root, 'assets') });
const browserExecutable = process.env.REMOTION_CHROME;
const comp = await selectComposition({ serveUrl, id: process.env.COMP || 'Reel', browserExecutable });
const frames = list.map((x) => (x.endsWith('s') ? Math.round(parseFloat(x) * comp.fps) : parseInt(x, 10)));
for (const frame of frames) {
  await renderStill({ serveUrl, composition: comp, frame, output: `${out}/f${frame}.png`, browserExecutable, overwrite: true });
}
const cols = Math.min(5, frames.length);
const ins = frames.flatMap((f) => ['-i', `${out}/f${f}.png`]);
const fil = frames.map((f, i) => `[${i}]scale=270:480,drawtext=text='${(f / comp.fps).toFixed(2)}s':x=6:y=6:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.6[s${i}]`).join(';');
const lay = frames.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|');
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...ins, '-filter_complex', frames.length > 1 ? `${fil};${frames.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${frames.length}:layout=${lay}:fill=black` : fil.replace('[s0]', ''), `${out}/${name}.png`]);
console.log(`${out}/${name}.png`);
