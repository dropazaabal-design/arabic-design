import React, { useId } from 'react';
import { INK, LINE, hash } from '../style';

// Shared drawing helpers for the metaphors. Everything is a pure function of its inputs: no randomness, no state.
export type P = [number, number];
export const W = 1920, H = 1080;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const ease = (v: number) => { const x = clamp01(v); return x * x * (3 - 2 * x); };
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
/** Progress of v through the sub-range a..b, clamped to 0..1. */
export const seg = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const f = (n: number) => n.toFixed(1);

/** A smooth path through points (Catmull-Rom → cubic Bézier). */
export const smooth = (pts: P[], closed = false) => {
  const n = pts.length;
  if (n < 2) return '';
  const g = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + (closed ? ' Z' : '');
};

/** A lumpy ellipse (clouds, bushes, stones): the lumps are fixed by the seed. */
export const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 12, lump = 0.07): P[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, r = 1 + (hash(seed * 13.7 + i) - 0.5) * 2 * lump;
    return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r];
  });

/** A flame: round base at (cx, by), pointed tip at (cx + lean, by − h). */
export const flame = (cx: number, by: number, w: number, h: number, lean = 0) =>
  `M${f(cx)} ${f(by)} C${f(cx - w * 0.72)} ${f(by)} ${f(cx - w * 0.5 + lean * 0.2)} ${f(by - h * 0.5)} ${f(cx + lean)} ${f(by - h)} C${f(cx + w * 0.5 + lean * 0.2)} ${f(by - h * 0.5)} ${f(cx + w * 0.72)} ${f(by)} ${f(cx)} ${f(by)} Z`;

/** A heart centred on (cx, cy), width s. */
export const heart = (cx: number, cy: number, s: number) =>
  `M${f(cx)} ${f(cy + s * 0.42)} C${f(cx - s * 0.62)} ${f(cy)} ${f(cx - s * 0.5)} ${f(cy - s * 0.48)} ${f(cx)} ${f(cy - s * 0.2)} C${f(cx + s * 0.5)} ${f(cy - s * 0.48)} ${f(cx + s * 0.62)} ${f(cy)} ${f(cx)} ${f(cy + s * 0.42)} Z`;

/** Unique, url()-safe ids for gradients and clips, so two copies of a metaphor can share a page. */
export const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, '');

/** Soft union of round lumps with one ink outline around the whole (clouds, crowns, steam, foam). */
export const Puffs: React.FC<{ c: [number, number, number][]; fill: string; line?: number; seed?: number; o?: number; ink?: string }> = ({ c, fill, line = LINE.normal, seed = 1, o = 1, ink = INK }) => {
  const d = c.map(([x, y, r], i) => smooth(blob(x, y, r, r, seed * 7 + i, 10, 0.05), true));
  return (
    <g opacity={o}>
      {d.map((p, i) => <path key={`o${i}`} d={p} fill={ink} stroke={ink} strokeWidth={line * 2} strokeLinejoin="round" />)}
      {d.map((p, i) => <path key={`f${i}`} d={p} fill={fill} />)}
    </g>
  );
};

/** The full-frame canvas every metaphor draws into (works in HTML and nested inside another <svg>). */
export const Frame: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg }) => (
  <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block', overflow: 'hidden' }}>
    {bg && <rect width={W} height={H} fill={bg} />}
    {children}
  </svg>
);

/** Ink stroke props. */
export const ink = (w: number = LINE.normal) => ({ stroke: INK, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });
