import { evolvePath, getLength, getPointAtLength, getTangentAtLength, interpolatePath } from '@remotion/paths';

// SVG path motion on Remotion's official path utilities (@remotion/paths) only: line drawing, motion along a path,
// shape morphs, hand-drawn highlights. Pure functions of a 0..1 progress; no DOM measuring, so they are safe in
// renders, in any frame order, at any fps.

const lengths = new Map<string, number>();
/** Path length, cached by the path string (paths in a reel are static strings). */
export const pathLength = (d: string) => {
  let l = lengths.get(d);
  if (l === undefined) {
    l = getLength(d);
    lengths.set(d, l);
  }
  return l;
};

const clamp01 = (p: number) => Math.max(0, Math.min(1, p));

/** Position and heading (degrees, SVG convention: 0 = +x, clockwise) at progress p along d. */
export const alongPath = (d: string, p: number) => {
  const at = clamp01(p) * pathLength(d);
  const pt = getPointAtLength(d, at), tg = getTangentAtLength(d, at);
  if (!pt || !tg) throw new Error(`alongPath: no point at ${at} on ${d.slice(0, 40)}…`);
  const { x, y } = pt;
  return { x, y, angle: (Math.atan2(tg.y, tg.x) * 180) / Math.PI };
};

/** strokeDasharray/strokeDashoffset that show the first p of the path (evolvePath), plus the tail's position for a
 *  pen nib or a spark. `from` > 0 also erases the start, for a travelling stroke (a trail). */
export const drawn = (d: string, p: number, from = 0) => {
  const e = evolvePath(clamp01(p), d);
  if (from <= 0) return e;
  const L = pathLength(d);
  const a = clamp01(from) * L, b = Math.max(a, clamp01(p) * L);
  return { strokeDasharray: `0 ${a} ${b - a} ${L}`, strokeDashoffset: 0 };
};

/** Shape morph between two paths (interpolatePath handles different command counts). */
export const morph = (p: number, a: string, b: string) => (p <= 0 ? a : p >= 1 ? b : interpolatePath(p, a, b));

/** A deterministic seeded wobble (no Math.random: same seed, same path, in every render process). */
const wob = (seed: number, i: number) => {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};

/** A hand-drawn loop around a thing (a highlighter circle): an ellipse traced `turns` times, overshooting its start,
 *  with a seeded wobble. Draw it with drawn(). */
export const scribbleLoop = (cx: number, cy: number, rx: number, ry: number, { turns = 1.18, seed = 1, wobble = 0.06, tilt = -8 } = {}) => {
  const n = Math.round(24 * turns);
  const a0 = (-100 * Math.PI) / 180, tl = (tilt * Math.PI) / 180;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * turns * Math.PI * 2;
    const k = 1 + wob(seed, i) * wobble * 2 + (i / n) * 0.06;
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    pts.push([cx + x * Math.cos(tl) - y * Math.sin(tl), cy + x * Math.sin(tl) + y * Math.cos(tl)]);
  }
  // Catmull-Rom → cubic Béziers: a smooth pen line through the points
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};
