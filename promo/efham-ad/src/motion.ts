import { Easing } from 'remotion';

// Motion with weight: things start slowly, travel, and settle. Every value is a pure function of the frame.
export const ease = {
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1), // fast start, long settle
  in: Easing.bezier(0.55, 0, 0.9, 0.4),
  settle: Easing.bezier(0.3, 1.32, 0.5, 1), // a small overshoot, then rest (a weighted landing)
  lin: (t: number) => t,
};
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0..1 over [a, a + len] frames. */
export const p = (f: number, a: number, len = 20, e: (t: number) => number = ease.inOut) => e(clamp01((f - a) / Math.max(1, len)));
/** A value through keyframes [frame, value], eased between each pair. */
export const kf = (f: number, keys: [number, number][], e: (t: number) => number = ease.inOut) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i][0]) {
      const [a, va] = keys[i - 1], [b, vb] = keys[i];
      return mix(va, vb, e((f - a) / Math.max(1, b - a)));
    }
  }
  return keys[keys.length - 1][1];
};
/** In, hold, out: 0 → 1 over [a, a+inn], 1 → 0 over [b, b+out]. */
export const life = (f: number, a: number, b: number, inn = 16, out = 14) => Math.min(p(f, a, inn, ease.out), 1 - p(f, b, out, ease.in));
