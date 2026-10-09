import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import timeline from '../timeline.json';

export const TL = timeline;
export const FPS = timeline.fps;
export const sec = (s: number) => Math.round(s * FPS);

type Piece = { src: number[]; audio: number[]; out: number[] };
const piece = (k: number) => (TL.edl as Piece[])[k];
/** Frame (60 fps) at which source second `s` of EDL piece `k` is heard in the edited voice. Every beat in
 *  the scenes is written in source seconds (transcript/reviewed.json, audio/whisper-words.json) and mapped here. */
export const at = (s: number, k = 3) => sec(piece(k).audio[0] + s - piece(k).src[0]);
/** Source second shown at output frame `f` inside piece `k` (for the speaker's video). */
export const srcAt = (f: number, k: number) => piece(k).src[0] + f / FPS - piece(k).audio[0];

const scene = (id: string) => {
  const s = TL.scenes.find((x) => x.sceneId === id);
  if (!s) throw new Error(`no scene ${id}`);
  return s;
};
export const sceneOf = scene;
export const sceneStart = (id: string) => sec(scene(id).start);
export const sceneEnd = (id: string) => sec(scene(id).end);

export const ease = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
  linear: (x: number) => x,
};
/** 0→1 between two frames, clamped and eased. */
export const prog = (frame: number, from: number, dur: number, easing = ease.out) =>
  interpolate(frame, [from, from + Math.max(1, dur)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** Fade in at `from`, fade out ending at `to`. */
export const life = (f: number, from: number, to: number, fin = sec(0.35), fout = sec(0.35)) => Math.min(prog(f, from, fin, ease.inOut), 1 - prog(f, to - fout, fout, ease.inOut));

// Frames inside scenes are always reel frames (a scene rendered alone gets its start as the offset).
export const Offset = React.createContext(0);
export const useEpisodeFrame = () => useCurrentFrame() + React.useContext(Offset);
