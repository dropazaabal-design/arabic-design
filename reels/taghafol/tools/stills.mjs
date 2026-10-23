// Render chosen frames (or seconds with an "s" suffix) to PNG with one bundle, then tile them 3 per row.
// usage: node tools/stills.mjs OUTDIR NAME 0 1.5s 120 ...
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const [out, name, ...list] = process.argv.slice(2);
const root = path.resolve(new URL('..', import.meta.url).pathname);
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
const browserExecutable = process.env.REMOTION_CHROME;
const comp = await selectComposition({ serveUrl, id: process.env.COMP || 'Reel', browserExecutable });
const frames = list.map((x) => (x.endsWith('s') ? Math.round(parseFloat(x) * comp.fps) : parseInt(x, 10)));
for (const frame of frames) {
  await renderStill({ serveUrl, composition: comp, frame, output: `${out}/f${frame}.png`, browserExecutable, overwrite: true });
}
const ins = frames.flatMap((f) => ['-i', `${out}/f${f}.png`]);
const fil = frames.map((f, i) => `[${i}]scale=270:480,drawtext=text='${(f / comp.fps).toFixed(2)}s':x=6:y=6:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.6[s${i}]`).join(';');
const lay = frames.map((_, i) => `${(i % 5) * 270}_${Math.floor(i / 5) * 480}`).join('|');
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...ins, '-filter_complex', `${fil};${frames.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${frames.length}:layout=${lay}:fill=black`, `${out}/${name}.png`]);
console.log(`${out}/${name}.png`);
