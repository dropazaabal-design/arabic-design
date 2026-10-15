import { Easing, interpolate } from 'remotion';
import { FPS } from './theme';

export type Word = { seg: string; i: number; w: string; start: number; end: number };
export type Caption = { seg: string; text: string; start: number; end: number };
export type Program = {
  fps: number; totalSeconds: number; durationInFrames: number; audio: string;
  segments: { id: string; start: number; end: number }[]; words: Word[]; captions: Caption[];
};

// Compositions render at 60 fps; the draft preview renders the same timeline at 30 fps.
let runtimeFps = FPS;
export const setFps = (fps: number) => { runtimeFps = fps; };
export const sec = (s: number) => Math.round(s * runtimeFps);
const clean = (w: string) => w.replace(/[«»،.:؟…!؛]/g, '');

/** Word-keyed timing for one program (long or short). `check` guards against re-keying to the wrong word. */
export const timing = (p: Program) => {
  const word = (seg: string, i: number, check?: string) => {
    const w = p.words.find((x) => x.seg === seg && x.i === i);
    if (!w) throw new Error(`no word ${i} in ${seg}`);
    if (check && !clean(w.w).startsWith(check)) throw new Error(`word ${i} of ${seg} is ${w.w}, not ${check}`);
    return w;
  };
  const seg = (id: string) => {
    const s = p.segments.find((x) => x.id === id);
    if (!s) throw new Error(`no segment ${id}`);
    return s;
  };
  return {
    at: (s: string, i: number, check?: string) => sec(word(s, i, check).start),
    atEnd: (s: string, i: number, check?: string) => sec(word(s, i, check).end),
    segStart: (id: string) => sec(seg(id).start),
    segEnd: (id: string) => sec(seg(id).end),
    end: sec(p.totalSeconds),
  };
};
export type Timing = ReturnType<typeof timing>;

export const ease = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  back: Easing.bezier(0.34, 1.4, 0.64, 1),
};
/** 0→1 between two frames, clamped and eased. */
export const prog = (f: number, from: number, dur: number, easing = ease.out) =>
  interpolate(f, [from, from + Math.max(1, dur)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** In at `from`, out ending at `to`. */
export const life = (f: number, from: number, to: number, fin = sec(0.35), fout = sec(0.35)) =>
  Math.min(prog(f, from, fin, ease.inOut), 1 - prog(f, to - fout, fout, ease.inOut));
export const mixColor = (a: string, b: string, p: number) => {
  const h = (c: string) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
  const [x, y] = [h(a), h(b)];
  return `rgb(${x.map((v, k) => Math.round(mix(v, y[k], p))).join(',')})`;
};
