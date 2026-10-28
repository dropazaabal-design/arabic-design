// Render tests for the motion stack, on real headless renders (not unit tests): every check renders PNG stills
// with Remotion and compares decoded pixels (ffmpeg → raw RGB → sha256).
//   order      the same frame rendered before and after other frames is identical (GSAP seek + Rive replay)
//   fps        the scene at second t is identical at 60 fps (Reel) and 30 fps (Reel30); same for the Probe
//   rive       the bird really draws (RiveProbe), a missing file draws the fallback, and without a fallback fails
//   mp4        output/final_reel.mp4 (if present) decodes with no errors
// usage: REMOTION_CHROME=… node tools/render-tests.mjs   → output/qa-render-tests.json; exit 1 on any failure
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { webpackOverride } from '../webpack-override.mjs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const tmp = mkdtempSync(path.join(os.tmpdir(), 'idea-flight-rt-'));
const browserExecutable = process.env.REMOTION_CHROME;
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/video/index.ts'), publicDir: path.join(root, 'assets'), webpackOverride });
const comps = {};
const comp = async (id) => (comps[id] ??= await selectComposition({ serveUrl, id, browserExecutable }));
let n = 0;
const still = async (id, frame) => {
  const output = path.join(tmp, `${id}-${frame}-${n++}.png`);
  await renderStill({ serveUrl, composition: await comp(id), frame, output, browserExecutable, imageFormat: 'png', overwrite: true });
  return output;
};
const rgb = (png) => execFileSync('ffmpeg', ['-v', 'error', '-i', png, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
const hash = (png) => createHash('sha256').update(rgb(png)).digest('hex').slice(0, 16);

const results = [];
const check = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`PASS  ${name}  ${JSON.stringify(detail)}`);
  } catch (e) {
    results.push({ name, ok: false, detail: String(e.message ?? e) });
    console.log(`FAIL  ${name}  ${e.message ?? e}`);
  }
};
const same = (a, b, what) => { if (a !== b) throw new Error(`${what}: ${a} ≠ ${b}`); return a; };

await check('order: Reel frame 330 (t=5.5 s, Rive input fired) before and after frames 744 and 60', async () => {
  const a = hash(await still('Reel', 330));
  hash(await still('Reel', 744)); hash(await still('Reel', 60));
  return { sha: same(a, hash(await still('Reel', 330)), 'frame 330') };
});
await check('order: Probe frame 150 before and after frame 30', async () => {
  const a = hash(await still('Probe', 150));
  hash(await still('Probe', 30));
  return { sha: same(a, hash(await still('Probe', 150)), 'frame 150') };
});
for (const t of [1.0, 4.6, 6.2, 8.8, 12.4]) {
  await check(`fps: Reel @60 and Reel30 @30 identical at t=${t} s`, async () => ({ sha: same(hash(await still('Reel', Math.round(t * 60))), hash(await still('Reel30', Math.round(t * 30))), `t=${t}`) }));
}
await check('fps: Probe @60 and Probe30 @30 identical at t=1.5 s', async () => ({ sha: same(hash(await still('Probe', 90)), hash(await still('Probe30', 45)), 't=1.5') }));
await check('gsap: Probe changes between t=0.5 and t=1.5 (the timeline is really sought)', async () => {
  const a = hash(await still('Probe', 30)), b = hash(await still('Probe', 90));
  if (a === b) throw new Error('identical frames: the GSAP/path/Rive layers did not move');
  return { a, b };
});
await check('rive: the bird draws (RiveProbe, > 8 % non-black pixels at t=1 s)', async () => {
  const px = rgb(await still('RiveProbe', 60));
  let lit = 0;
  for (let i = 0; i < px.length; i += 3) if (px[i] + px[i + 1] + px[i + 2] > 60) lit++;
  const share = lit / (px.length / 3);
  if (share < 0.08) throw new Error(`only ${(share * 100).toFixed(1)} % drawn`);
  return { drawnShare: +share.toFixed(3) };
});
await check('rive: a missing file renders the fallback (red square)', async () => {
  const px = rgb(await still('RiveFallbackProbe', 0));
  const mid = (120 * 240 + 120) * 3;
  if (!(px[mid] > 240 && px[mid + 1] < 20 && px[mid + 2] < 20)) throw new Error(`centre pixel ${px[mid]},${px[mid + 1]},${px[mid + 2]}`);
  return { centre: [px[mid], px[mid + 1], px[mid + 2]] };
});
await check('rive: a missing file without fallback fails the render', async () => {
  try { await still('RiveMissingProbe', 0); } catch (e) { return { error: String(e.message).split('\n')[0].slice(0, 120) }; }
  throw new Error('rendered without error');
});
const mp4 = path.join(root, 'output/final_reel.mp4');
if (existsSync(mp4)) {
  await check('mp4: output/final_reel.mp4 decodes with no errors', async () => {
    const r = spawnSync('ffmpeg', ['-v', 'error', '-i', mp4, '-f', 'null', '-'], { encoding: 'utf8' });
    if (r.status !== 0 || r.stderr.trim()) throw new Error(r.stderr.trim().slice(0, 300) || `exit ${r.status}`);
    return { decoded: true };
  });
}
const failed = results.filter((r) => !r.ok).length;
writeFileSync(path.join(root, 'output/qa-render-tests.json'), JSON.stringify({ tool: 'tools/render-tests.mjs', passed: results.length - failed, failed, results }, null, 1) + '\n');
console.log(failed ? `${failed} FAILED` : `ALL ${results.length} RENDER TESTS PASS`);
process.exit(failed ? 1 : 0);
