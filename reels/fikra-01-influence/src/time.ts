import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import timeline from '../timeline.json';
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
const scene = (id: string) => {
  const s = timeline.scenes.find((x) => x.sceneId === id);
  if (!s) throw new Error(`no scene ${id}`);
  return s;
};
export const sceneStart = (id: string) => sec(scene(id).start);
export const sceneEnd = (id: string) => sec(scene(id).end);

/** Frame where the n-th word of a line that starts with `w` is spoken (punctuation and marks ignored). */
const clean = (x: string) => x.replace(/[«»،.:؟…!؛]/g, '').replace(/[ً-ْـ]/g, '');
export const wordAt = (segId: string, w: string, n = 0) => {
  const hit = (words as Array<{ seg: string; w: string; start: number }>).filter((x) => x.seg === segId && clean(x.w).startsWith(clean(w)))[n];
  if (!hit) throw new Error(`no word ${w} in ${segId}`);
  return sec(hit.start);
};

export const ease = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
};
/** 0→1 between two frames, clamped and eased. */
export const prog = (frame: number, from: number, dur: number, easing = ease.out) =>
  interpolate(frame, [from, from + Math.max(1, dur)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** Fade in at `from`, fade out ending at `to`. */
export const life = (f: number, from: number, to: number, fin = sec(0.35), fout = sec(0.35)) => Math.min(prog(f, from, fin, ease.inOut), 1 - prog(f, to - fout, fout, ease.inOut));

// A scene can be rendered inside the whole episode (offset 0) or alone in its own
// composition (offset = its start), so frames inside scenes are always episode frames.
export const Offset = React.createContext(0);
export const useEpisodeFrame = () => useCurrentFrame() + React.useContext(Offset);
