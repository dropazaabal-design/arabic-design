import { Easing, interpolate } from 'remotion';
import timeline from './timeline.json';
import words from './words.json';

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
/** A frame inside a segment, at fraction p of its spoken length. */
export const segAt = (id: string, p: number) => sec(seg(id).start + seg(id).duration * p);

const scene = (n: number) => {
  const s = timeline.scenes.find((x) => x.n === n);
  if (!s) throw new Error(`no scene ${n}`);
  return s;
};
export const sceneStart = (n: number) => sec(scene(n).start);
export const sceneEnd = (n: number) => sec(scene(n).end);

export const ease = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
};

/** 0→1 progress between two frames, clamped, eased. */
export const prog = (frame: number, from: number, dur: number, easing = ease.out) =>
  interpolate(frame, [from, from + Math.max(1, dur)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** Visible window with fade in/out, for layers that overlap scene edges. */
export const windowOpacity = (frame: number, from: number, to: number, fadeIn = 8, fadeOut = 8) =>
  Math.min(prog(frame, from, fadeIn, ease.inOut), 1 - prog(frame, to - fadeOut, fadeOut, ease.inOut));

/** The frame where the n-th spoken word of a line that starts with `w` begins (punctuation ignored). */
export const wordAt = (seg: string, w: string, n = 0) => {
  const hit = words.filter((x) => x.seg === seg && x.w.replace(/[،.:؟…!]/g, '').startsWith(w))[n];
  if (!hit) throw new Error(`no word ${w} in ${seg}`);
  return sec(hit.start);
};
