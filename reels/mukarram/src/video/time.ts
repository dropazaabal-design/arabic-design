import { Easing, interpolate } from 'remotion';
import timeline from '../../timeline.json';
import words from './words.json';

// Adapted from reels/save-advice/src/time.ts: every picture beat is keyed to a measured spoken word.
export const TL = timeline;
export const FPS = timeline.fps;
export const sec = (s: number) => Math.round(s * FPS);

const seg = (id: string) => {
  const s = timeline.segments.find((x) => x.id === id);
  if (!s) throw new Error(`no segment ${id}`);
  return s;
};
export const segStart = (id: string) => sec(seg(id).start);
export const segEnd = (id: string) => sec(seg(id).start + seg(id).duration);

/** Frame where the n-th word of a line that starts with `w` is spoken (punctuation and marks ignored). */
const clean = (x: string) => x.replace(/[«»،.:؟…!؛]/g, '').replace(/[ً-ْـ]/g, '');
type W = { seg: string; w: string; start: number; end: number };
const find = (segId: string, w: string, n = 0) => {
  const hit = (words as W[]).filter((x) => x.seg === segId && clean(x.w).startsWith(clean(w)))[n];
  if (!hit) throw new Error(`no word ${w} in ${segId}`);
  return hit;
};
export const wordAt = (segId: string, w: string, n = 0) => sec(find(segId, w, n).start);
export const wordEnd = (segId: string, w: string, n = 0) => sec(find(segId, w, n).end);

export const ease = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
  linear: (t: number) => t,
};
/** 0→1 between two frames, clamped and eased. */
export const prog = (frame: number, from: number, dur: number, easing = ease.out) =>
  interpolate(frame, [from, from + Math.max(1, dur)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** Keyframes [frame, value] with easing between them. */
export const keys = (f: number, k: Array<[number, number]>, easing = ease.inOut) => {
  if (f <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    if (f <= k[i + 1][0]) return mix(k[i][1], k[i + 1][1], easing((f - k[i][0]) / Math.max(1, k[i + 1][0] - k[i][0])));
  }
  return k[k.length - 1][1];
};
