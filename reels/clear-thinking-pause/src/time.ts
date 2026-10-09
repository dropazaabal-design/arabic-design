import { Easing, interpolate } from 'remotion';
import timeline from '../timeline.json';
import words from './words.json';

export const TL = timeline;
export const FPS = timeline.fps;
export const sec = (s: number) => Math.round(s * FPS);

type Word = { seg: string; i: number; w: string; start: number; end: number };
const word = (seg: string, i: number) => {
  const hit = (words as Word[]).find((x) => x.seg === seg && x.i === i);
  if (!hit) throw new Error(`no word ${i} in ${seg}`);
  return hit;
};
/** Frame where word i of a line is spoken; `check` guards against re-keying to the wrong word. */
export const at = (seg: string, i: number, check?: string) => {
  const w = word(seg, i);
  if (check && !w.w.replace(/[«»،.:؟…]/g, '').startsWith(check)) throw new Error(`word ${i} of ${seg} is ${w.w}, not ${check}`);
  return sec(w.start);
};
export const atEnd = (seg: string, i: number) => sec(word(seg, i).end);
export const segStart = (id: string) => sec(timeline.segments.find((s) => s.id === id)!.start);
export const segEnd = (id: string) => sec(timeline.segments.find((s) => s.id === id)!.end);
export const sceneStart = (id: string) => sec(timeline.scenes.find((s) => s.sceneId === id)!.start);

export const ease = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
};
/** 0→1 between two frames, clamped and eased. */
export const prog = (f: number, from: number, dur: number, easing = ease.out) =>
  interpolate(f, [from, from + Math.max(1, dur)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** In at `from`, out ending at `to`. */
export const life = (f: number, from: number, to: number, fin = sec(0.3), fout = sec(0.3)) =>
  Math.min(prog(f, from, fin, ease.inOut), 1 - prog(f, to - fout, fout, ease.inOut));
export const mixColor = (a: string, b: string, p: number) => {
  const h = (c: string) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
  const [x, y] = [h(a), h(b)];
  return `rgb(${x.map((v, k) => Math.round(mix(v, y[k], p))).join(',')})`;
};
