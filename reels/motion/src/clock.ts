import { gsap } from 'gsap';
import { interpolate } from 'remotion';

// One clock for every layer: Remotion's frame. GSAP timelines are sought to frame / fps (@remotion/gsap), rig
// numbers are pure functions of the same seconds, Rive is stepped to the same seconds (rive.tsx). Authoring in
// seconds is what makes a scene identical at 30 and 60 fps.

export type Clock = {
  frame: number;
  fps: number;
  /** seconds since the composition (or Sequence) start */
  t: number;
  /** the same instant on a 30-fps frame grid, for the reels/mukarram helpers that count 30-fps frames
   *  (Shot's boil, poseTrack/exprTrack durations, blinkAt). Fractional at 60 fps; floor it where an index is needed. */
  f30: number;
};
export const clock = (frame: number, fps: number): Clock => ({ frame, fps, t: frame / fps, f30: (frame * 30) / fps });

const eases = new Map<string, (p: number) => number>();
/** A GSAP ease by name ('power2.inOut', 'back.out(1.7)', 'elastic.out(1,0.4)', 'steps(4)', …) as a pure function,
 *  so rig numbers and GSAP-driven elements share one easing vocabulary. Unknown names throw. */
export const ease = (name: string): ((p: number) => number) => {
  let e = eases.get(name);
  if (!e) {
    e = gsap.parseEase(name) as ((p: number) => number) | undefined;
    if (!e) throw new Error(`unknown ease: ${name}`);
    eases.set(name, e);
  }
  return e;
};

/** Remotion's interpolate on seconds with a GSAP ease; clamped at both ends. */
export const tween = (t: number, t0: number, t1: number, from: number, to: number, easing = 'power2.inOut') =>
  interpolate(t, [t0, Math.max(t1, t0 + 1e-6)], [from, to], { easing: ease(easing), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** Keyframes in seconds: [[t, value, ease into this key?], …]. Before the first key → first value, after the last → last. */
export const keys = (t: number, k: Array<[number, number, string?]>) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return tween(t, k[i - 1][0], k[i][0], k[i - 1][1], k[i][1], k[i][2]);
  return k[k.length - 1][1];
};
