import React from 'react';
import { BODY } from '../../fonts';
import { INK, LINE, PAL, hash, sketch, sketchRect } from '../style';

// Shared pieces for the places: hand-drawn boxes, rooms, windows, plants, glows, skylines.
export type Pt = [number, number];
/** Standing feet. */
export const FLOOR = 860;
/** Where a back wall meets the floor: furniture against the wall stands here, people stand a little in front. */
export const BASE = 820;
/** Cool lamp light (never amber). */
export const LIGHT = '#F6F8FC';
export const LIT = '#EEF2F8';

type Ink = { fill?: string; stroke?: string; sw?: number; seed?: number; wob?: number; o?: number };

export const Rect: React.FC<{ x: number; y: number; w: number; h: number } & Ink> = ({ x, y, w, h, fill = 'none', stroke = INK, sw = LINE.normal, seed = 1, wob = 1.4, o }) => (
  <path d={sketchRect(x, y, w, h, seed, wob)} fill={fill} stroke={sw ? stroke : 'none'} strokeWidth={sw} strokeLinejoin="round" opacity={o} />
);

export const Poly: React.FC<{ pts: Pt[]; open?: boolean } & Ink> = ({ pts, open, fill = 'none', stroke = INK, sw = LINE.normal, seed = 1, wob = 1.6, o }) => (
  <path d={sketch(pts, seed, wob, !open)} fill={open ? 'none' : fill} stroke={sw ? stroke : 'none'} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" opacity={o} />
);

/** A soft, slightly lumpy closed curve (tree crowns, clouds, cushions). */
export const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 9) => {
  const p = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + hash(seed + i * 3) * 0.3, k = 0.86 + hash(seed * 17 + i) * 0.28;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as Pt;
  });
  const m = (a: Pt, b: Pt) => `${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`;
  return `M${m(p[n - 1], p[0])}` + p.map((q, i) => ` Q${q[0].toFixed(1)} ${q[1].toFixed(1)} ${m(q, p[(i + 1) % n])}`).join('') + 'Z';
};

/** Back wall, floor, skirting and two faint floor seams. */
export const Room: React.FC<{ wall: string; floor?: string; seed?: number }> = ({ wall, floor = PAL.floor, seed = 1 }) => (
  <g>
    <rect width={1920} height={1080} fill={wall} />
    <rect y={BASE} width={1920} height={1080 - BASE} fill={floor} />
    <path d={sketch([[0, BASE + 74], [1920, BASE + 74]], seed + 2, 2)} stroke={INK} strokeWidth={LINE.far} opacity={0.1} fill="none" />
    <path d={sketch([[0, BASE + 190], [1920, BASE + 190]], seed + 3, 2)} stroke={INK} strokeWidth={LINE.far} opacity={0.08} fill="none" />
    <Rect x={-10} y={BASE - 16} w={1940} h={16} fill={PAL.paper} sw={LINE.fine} seed={seed} />
  </g>
);

/** A framed window; `children` (sky, skyline, moon) are clipped to the glass. */
export const Window: React.FC<{ x: number; y: number; w: number; h: number; id: string; sky: string; cols?: number; seed?: number; frame?: string; children?: React.ReactNode }> = ({ x, y, w, h, id, sky, cols = 2, seed = 1, frame = PAL.paper, children }) => (
  <g>
    <clipPath id={id}><rect x={x} y={y} width={w} height={h} /></clipPath>
    <rect x={x} y={y} width={w} height={h} fill={sky} />
    <g clipPath={`url(#${id})`}>
      {children}
      <path d={`M${x + w * 0.1} ${y + h} L${x + w * 0.38} ${y} L${x + w * 0.47} ${y} L${x + w * 0.19} ${y + h} Z`} fill="#FFFFFF" opacity={0.12} />
    </g>
    {Array.from({ length: cols - 1 }, (_, i) => <Rect key={i} x={x + (w * (i + 1)) / cols - 6} y={y} w={12} h={h} fill={frame} sw={LINE.fine} seed={seed + i + 1} />)}
    <path d={`${sketchRect(x - 14, y - 14, w + 28, h + 28, seed)} ${sketchRect(x, y, w, h, seed + 9, 1)}`} fill={frame} fillRule="evenodd" stroke={INK} strokeWidth={LINE.normal} strokeLinejoin="round" />
    <Rect x={x - 28} y={y + h + 12} w={w + 56} h={16} fill={frame} seed={seed + 5} />
  </g>
);

/** Night sky with a moon and a few stars, for windows. */
export const NightSky: React.FC<{ x: number; y: number; w: number; h: number; moon?: Pt; seed?: number }> = ({ x, y, w, h, moon = [x + w * 0.7, y + h * 0.28], seed = 1 }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={PAL.skyNight} />
    <rect x={x} y={y + h * 0.55} width={w} height={h * 0.45} fill={PAL.wallNight} opacity={0.6} />
    <Glow x={moon[0]} y={moon[1]} r={90} color="#DCE3F2" o={0.45} />
    <circle cx={moon[0]} cy={moon[1]} r={30} fill="#E8EDF2" />
    <circle cx={moon[0] + 14} cy={moon[1] - 8} r={27} fill={PAL.skyNight} />
    {Array.from({ length: 7 }, (_, i) => <circle key={i} cx={x + hash(seed * 5 + i) * w} cy={y + hash(seed * 9 + i) * h * 0.5} r={1.6 + hash(i + seed) * 1.6} fill="#E8EDF2" opacity={0.8} />)}
  </g>
);

/** Soft radial light. */
export const Glow: React.FC<{ x: number; y: number; r: number; ry?: number; color?: string; o?: number }> = ({ x, y, r, ry, color = LIGHT, o = 1 }) => {
  const id = `pl-glow-${color.slice(1)}`;
  return (
    <g opacity={o}>
      <radialGradient id={id}><stop offset="0" stopColor={color} stopOpacity={0.95} /><stop offset="0.4" stopColor={color} stopOpacity={0.4} /><stop offset="1" stopColor={color} stopOpacity={0} /></radialGradient>
      <ellipse cx={x} cy={y} rx={r} ry={ry ?? r} fill={`url(#${id})`} />
    </g>
  );
};

/** A potted plant standing at (x, y). */
export const Plant: React.FC<{ x: number; y: number; s?: number; seed?: number; pot?: string; n?: number }> = ({ x, y, s = 1, seed = 1, pot = PAL.paperShade, n = 9 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({ length: n }, (_, i) => {
      const a = -72 + (i * 144) / (n - 1) + (hash(seed + i) - 0.5) * 12;
      const l = 150 + hash(seed * 3 + i) * 80 - Math.abs(a) * 0.7, w = 36 + hash(seed * 5 + i) * 12;
      return <path key={i} transform={`translate(0 -86) rotate(${a.toFixed(1)})`} d={`M0 0 Q${w / 2} ${-l * 0.42} 0 ${-l} Q${-w / 2} ${-l * 0.42} 0 0 Z`} fill={i % 2 ? PAL.plant : PAL.plantDark} stroke={INK} strokeWidth={LINE.fine} strokeLinejoin="round" />;
    })}
    <Poly pts={[[-40, -88], [40, -88], [31, 0], [-31, 0]]} fill={pot} seed={seed} />
    <Rect x={-46} y={-100} w={92} h={16} fill={pot} sw={LINE.fine} seed={seed + 1} />
  </g>
);

/** A wall clock; the second hand ticks with t (seconds). */
export const Clock: React.FC<{ x: number; y: number; r: number; t?: number }> = ({ x, y, r, t = 0 }) => {
  const min = 50 * 6 + t * 0.1, hr = 10 * 30 + min / 12, sec = Math.floor(t) * 6;
  const hand = (deg: number, len: number, w: number, c: string) => <line x2={0} y2={-len} stroke={c} strokeWidth={w} strokeLinecap="round" transform={`rotate(${deg.toFixed(2)})`} />;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={PAL.paper} stroke={INK} strokeWidth={LINE.normal} />
      {[0, 90, 180, 270].map((a) => <line key={a} y1={-r + 6} y2={-r + 14} stroke={INK} strokeWidth={LINE.fine} transform={`rotate(${a})`} />)}
      {hand(hr, r * 0.48, LINE.normal, INK)}
      {hand(min, r * 0.72, LINE.fine, INK)}
      {hand(sec, r * 0.78, 1.6, PAL.provoke)}
      <circle r={3.5} fill={INK} />
    </g>
  );
};

/**
 * A door in the back wall, hinged on its left edge. `open` 0..1 swings the leaf toward the viewer (it narrows and its
 * free edge grows), showing `beyond` through the opening.
 */
export const Door: React.FC<{ x: number; w?: number; top?: number; leaf?: string; beyond?: string; open?: number; glass?: boolean; seed?: number; children?: React.ReactNode }> = ({ x, w = 200, top = 300, leaf = PAL.wood, beyond = PAL.wallNight, open = 0, glass, seed = 1, children }) => {
  const h = BASE - top, th = (open * 80 * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  const m = (u: number, v: number): Pt => [x + u * w * c, top - u * s * 22 + v * (h + 2 * u * s * 22)];
  const quad = (u0: number, v0: number, u1: number, v1: number): Pt[] => [m(u0, v0), m(u1, v0), m(u1, v1), m(u0, v1)];
  return (
    <g>
      <Rect x={x - 16} y={top - 16} w={w + 32} h={h + 16} fill={PAL.paper} seed={seed} />
      <rect x={x} y={top} width={w} height={h} fill={beyond} />
      {children}
      {open > 0.01 && <Poly pts={[m(1, 0), [m(1, 0)[0] + s * 14, m(1, 0)[1] + 2], [m(1, 1)[0] + s * 14, m(1, 1)[1] - 2], m(1, 1)]} fill={PAL.woodDark} sw={LINE.fine} seed={seed + 2} />}
      <Poly pts={quad(0, 0, 1, 1)} fill={leaf} seed={seed + 3} wob={1.2} />
      {glass
        ? <Poly pts={quad(0.32, 0.08, 0.68, 0.55)} fill={PAL.focusLight} sw={LINE.fine} seed={seed + 4} />
        : <><Poly pts={quad(0.16, 0.07, 0.84, 0.45)} sw={LINE.far} o={0.5} seed={seed + 4} /><Poly pts={quad(0.16, 0.53, 0.84, 0.93)} sw={LINE.far} o={0.5} seed={seed + 5} /></>}
      <circle cx={m(0.86, 0.52)[0]} cy={m(0.86, 0.52)[1]} r={7 * (1 + s * 0.3)} fill={PAL.metal} stroke={INK} strokeWidth={LINE.fine} />
    </g>
  );
};

/** Short Arabic text (signs, boards). Kept to a word or two. */
export const Arabic: React.FC<{ x: number; y: number; w: number; h: number; text: string; size: number; color?: string; align?: 'center' | 'right' }> = ({ x, y, w, h, text, size, color = INK, align = 'center' }) => (
  <foreignObject x={x} y={y} width={w} height={h}>
    <div dir="rtl" lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: size, lineHeight: 1.25, color, textAlign: align, width: '100%' }}>{text}</div>
  </foreignObject>
);

/**
 * A strip of building silhouettes as two path strings (bodies, lit windows) so a whole skyline is two elements.
 * Deterministic for a seed.
 */
export const city = (o: { x0: number; x1: number; base: number; seed: number; h: [number, number]; w: [number, number]; gap?: number; lit?: number; win?: number }) => {
  const { x0, x1, base, seed, h: [h0, h1], w: [w0, w1], gap = 6, lit = 0.25, win = 1 } = o;
  const bodies: string[] = [], lights: string[] = [];
  const cw = 10 * win, ch = 14 * win, gx = 22 * win, gy = 30 * win;
  for (let x = x0, k = 0; x < x1; k++) {
    const w = w0 + hash(seed + k * 3.1) * (w1 - w0), h = h0 + hash(seed * 7 + k * 7.7) * (h1 - h0);
    bodies.push(sketchRect(x, base - h, w, h + 60, seed + k, 1));
    if (hash(seed * 3 + k) < 0.35) bodies.push(sketchRect(x + w * 0.25, base - h - 28, w * 0.5, 40, seed + k + 50, 0.8));
    for (let wy = base - h + 18; wy < base - 24; wy += gy)
      for (let wx = x + 12; wx < x + w - cw - 8; wx += gx)
        if (hash(seed * 13 + wx * 0.37 + wy * 0.71) < lit) lights.push(`M${wx.toFixed(0)} ${wy.toFixed(0)}h${cw}v${ch}h${-cw}Z`);
    x += w + gap;
  }
  return { bodies: bodies.join(' '), lights: lights.join('') };
};

/** A faint seated/standing figure for behind glass or far away: head and shoulders only. */
export const Ghost: React.FC<{ x: number; y: number; s?: number; c?: string; o?: number }> = ({ x, y, s = 1, c = PAL.textSoft, o = 0.22 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} fill={c}>
    <circle cy={-118} r={34} />
    <path d="M-48 0 L-44 -58 Q-40 -78 -18 -80 L18 -80 Q40 -78 44 -58 L48 0 Z" />
  </g>
);
