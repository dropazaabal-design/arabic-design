// Builds src/timeline.json from script.json and the measured voice files.
// Segment durations come from ffprobe on public/voice/<id>.wav; a missing file
// falls back to an estimate and is marked `estimated`, never passed off as measured.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const script = JSON.parse(readFileSync(root + 'script.json', 'utf8'));
const FPS = 30;
const LEAD = 0.25;       // first word after frame 0, so the hook reads first
const GAP_IN = 0.15;     // pause between segments of one scene
const GAP_OUT = 0.22;      // pause between scenes
const TAIL = 1.6;         // closing line stays readable after the voice ends
const WPS = 2.5;          // estimate only, when a file is missing

const probe = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

let t = LEAD;
let prevScene = null;
const segments = script.segments.map((s) => {
  const file = `${root}public/voice/${s.id}.wav`;
  const measured = existsSync(file);
  const words = s.text.split(/\s+/).filter(Boolean).length;
  const duration = measured ? probe(file) : +(0.4 + words / WPS).toFixed(3);
  if (prevScene !== null) t += s.scene === prevScene ? GAP_IN : GAP_OUT;
  prevScene = s.scene;
  const seg = { id: s.id, scene: s.scene, start: +t.toFixed(3), duration: +duration.toFixed(3), measured, file: measured ? `voice/${s.id}.wav` : null };
  t += duration;
  return seg;
});
const total = +(t + TAIL).toFixed(3);

const sceneIds = [...new Set(segments.map((s) => s.scene))];
const scenes = sceneIds.map((n, i) => {
  const first = segments.find((s) => s.scene === n);
  const start = i === 0 ? 0 : Math.max(0, first.start - 0.25);
  return { n, start: +start.toFixed(3) };
});
scenes.forEach((s, i) => { s.end = i + 1 < scenes.length ? scenes[i + 1].start : total; s.seconds = +(s.end - s.start).toFixed(3); });

const out = { fps: FPS, width: 1080, height: 1920, totalSeconds: total, durationInFrames: Math.round(total * FPS), measured: segments.every((s) => s.measured), segments, scenes };
writeFileSync(root + 'src/timeline.json', JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ totalSeconds: total, measured: out.measured, scenes: scenes.map((s) => [s.n, s.start, s.seconds]) }));
