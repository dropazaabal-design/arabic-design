// Render check for any reel that registers Reel (its fps) and Reel30 (the same scene at 30 fps): real headless stills,
// decoded pixels compared by sha256 (shared version of reels/idea-flight/tools/render-tests.mjs).
//   order  a frame rendered before and after other frames is identical (GSAP timelines are sought, not played)
//   fps    the scene at second t is identical at the reel's fps and at 30 fps
//   mp4    output/final_reel.mp4 decodes with no errors
// usage: cd reels/<slug> && node ../tools/render_check.mjs [t1 t2 …]   → output/qa-render-tests.json; exit 1 on a failure
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const req = createRequire(path.join(root, 'package.json'));
const { bundle } = req('@remotion/bundler');
const { renderStill, selectComposition } = req('@remotion/renderer');
const { webpackOverride } = await import(pathToFileURL(path.join(root, 'webpack-override.mjs')).href);
const tl = JSON.parse(readFileSync(path.join(root, 'timeline.json'), 'utf8'));
const times = process.argv.slice(2).map(Number);
const at = times.length ? times : [0.2, 0.37, 0.62, 0.9].map((k) => +(tl.totalSeconds * k).toFixed(2));
const tmp = mkdtempSync(path.join(os.tmpdir(), 'render-check-'));
const browserExecutable = process.env.REMOTION_CHROME;
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/video/index.ts'), publicDir: path.join(root, 'assets'), webpackOverride });
const comps = {};
const comp = async (id) => (comps[id] ??= await selectComposition({ serveUrl, id, browserExecutable }));
let n = 0;
const still = async (id, frame) => {
  const output = path.join(tmp, `${id}-${frame}-${n++}.png`);
  await renderStill({ serveUrl, composition: await comp(id), frame, output, browserExecutable, imageFormat: 'png', overwrite: true });
  return createHash('sha256').update(execFileSync('ffmpeg', ['-v', 'error', '-i', output, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 })).digest('hex').slice(0, 16);
};
const results = [];
const check = async (name, fn) => {
  try { const detail = await fn(); results.push({ name, ok: true, detail }); console.log(`PASS  ${name}  ${JSON.stringify(detail)}`); }
  catch (e) { results.push({ name, ok: false, detail: String(e.message ?? e) }); console.log(`FAIL  ${name}  ${e.message ?? e}`); }
};
const same = (a, b, w) => { if (a !== b) throw new Error(`${w}: ${a} ≠ ${b}`); return a; };
const f = (t) => Math.round(t * tl.fps);

await check(`order: Reel frame ${f(at[1])} before and after frames ${f(at[3])} and ${f(at[0])}`, async () => {
  const a = await still('Reel', f(at[1])); await still('Reel', f(at[3])); await still('Reel', f(at[0]));
  return { sha: same(a, await still('Reel', f(at[1])), 'order') };
});
for (const t of at) await check(`fps: Reel @${tl.fps} and Reel30 @30 identical at t=${t} s`, async () => ({ sha: same(await still('Reel', f(t)), await still('Reel30', Math.round(t * 30)), `t=${t}`) }));
const mp4 = path.join(root, 'output/final_reel.mp4');
if (existsSync(mp4)) await check('mp4: output/final_reel.mp4 decodes with no errors', async () => {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', mp4, '-f', 'null', '-'], { encoding: 'utf8' });
  if (r.status !== 0 || r.stderr.trim()) throw new Error(r.stderr.trim().slice(0, 300) || `exit ${r.status}`);
  return { decoded: true, bytes: readFileSync(mp4).length };
});
const failed = results.filter((r) => !r.ok).length;
writeFileSync(path.join(root, 'output/qa-render-tests.json'), JSON.stringify({ tool: 'reels/tools/render_check.mjs', passed: results.length - failed, failed, results }, null, 1) + '\n');
console.log(failed ? `${failed} FAILED` : `ALL ${results.length} RENDER CHECKS PASS`);
process.exit(failed ? 1 : 0);
