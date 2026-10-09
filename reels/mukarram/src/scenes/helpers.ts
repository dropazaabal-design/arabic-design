import { BUILD, Build, Pose, handLocal } from '../characters/rig';

/** A hand's position in scene space, for a character drawn at (x, y) with scale s and facing. */
export const handWorld = (build: Partial<Build>, pose: Pose, side: -1 | 1, x: number, y: number, s: number, facing: 1 | -1): [number, number] => {
  const [lx, ly] = handLocal({ ...BUILD, ...build }, pose, side);
  return [x + lx * s * facing, y + ly * s];
};

/** A point along a thrown arc (parabola) between a and b, peaking `h` px above the straight line. */
export const arc = (a: [number, number], b: [number, number], t: number, h: number): [number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * h,
];

/** Walk: how far a character has walked (px) and the matching cycle phase (one cycle = two steps). */
export const walked = (f: number, from: number, to: number, x0: number, x1: number, step = 190) => {
  const t = Math.max(0, Math.min(1, (f - from) / Math.max(1, to - from)));
  const x = x0 + (x1 - x0) * t;
  return { x, phase: Math.abs(x - x0) / (step * 2), moving: f > from && f < to };
};
