import React from 'react';
import { TITLE_FONT, BODY_FONT } from '../fonts';
import { draw, STROKE } from '../motion';
import { C } from '../theme';

// Shared doodle primitives (from episode 1): Arabic SVG text, speech bubble, hand-drawn arrow, paper grain.
// Episode objects live in ./world.tsx. Thick clean line, simple geometry, no people.
// Words placed on objects are SVG text with direction rtl (Chromium shapes Arabic in SVG).

export type P = { x: number; y: number; s?: number; o?: number; rot?: number };
export const G: React.FC<P & { children: React.ReactNode; filter?: string }> = ({ x, y, s = 1, o = 1, rot = 0, children, filter }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} filter={filter}>{children}</g>
);

export const ArText: React.FC<{ x?: number; y?: number; size: number; color?: string; weight?: number; children: string; font?: string; anchor?: 'middle' | 'start' | 'end' }> = ({ x = 0, y = 0, size, color = C.ink, weight = 800, children, font = TITLE_FONT, anchor = 'middle' }) => (
  <text x={x} y={y} direction="rtl" textAnchor={anchor} dominantBaseline="central" fontFamily={font} fontWeight={weight} fontSize={size} fill={color}>{children}</text>
);

export const Bubble: React.FC<P & { w?: number; h?: number; fill?: string; thought?: boolean; tail?: 1 | -1 }> = ({ w = 260, h = 140, fill = C.white, thought = false, tail = 1, ...g }) => (
  <G {...g}>
    {thought ? (
      <>
        <ellipse rx={w / 2} ry={h / 2} fill={fill} stroke={C.ink} strokeWidth={6} />
        <circle cx={tail * w * 0.32} cy={h / 2 + 26} r={16} fill={fill} stroke={C.ink} strokeWidth={5} />
        <circle cx={tail * w * 0.42} cy={h / 2 + 58} r={9} fill={fill} stroke={C.ink} strokeWidth={4} />
      </>
    ) : (
      <path d={`M ${-w / 2 + 28} ${-h / 2} L ${w / 2 - 28} ${-h / 2} Q ${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 28} L ${w / 2} ${h / 2 - 28} Q ${w / 2} ${h / 2} ${w / 2 - 28} ${h / 2} L ${tail * 40} ${h / 2} L ${tail * 10} ${h / 2 + 40} L ${tail * -10} ${h / 2} L ${-w / 2 + 28} ${h / 2} Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 28} L ${-w / 2} ${-h / 2 + 28} Q ${-w / 2} ${-h / 2} ${-w / 2 + 28} ${-h / 2} Z`} fill={fill} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    )}
  </G>
);

/** Curved arrow drawn on from start to end, with a head that appears at the end. */
export const Arrow: React.FC<{ from: [number, number]; to: [number, number]; bend?: number; p: number; color?: string; width?: number; dashed?: boolean }> = ({ from, to, bend = 0.25, p, color = C.blue, width = 8, dashed = false }) => {
  const [x1, y1] = from, [x2, y2] = to;
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const head = (a: number) => `${x2 - 26 * Math.cos(ang + a)} ${y2 - 26 * Math.sin(ang + a)}`;
  return (
    <g>
      <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} {...STROKE} stroke={color} strokeWidth={width} {...(dashed ? { strokeDasharray: '16 12', opacity: p } : draw(p))} />
      {p > 0.92 && <path d={`M ${head(0.45)} L ${x2} ${y2} L ${head(-0.45)}`} {...STROKE} stroke={color} strokeWidth={width} />}
    </g>
  );
};

/** Paper grain + soft vignette over a whole scene. */
export const Grain: React.FC<{ dark?: boolean }> = ({ dark = false }) => (
  <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <defs>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} /><feColorMatrix values={dark ? '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0' : '0 0 0 0 0.3  0 0 0 0 0.28  0 0 0 0 0.25  0 0 0 0.07 0'} /></filter>
      <radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="65%" stopColor="#000" stopOpacity={0} /><stop offset="100%" stopColor="#000" stopOpacity={dark ? 0.35 : 0.12} /></radialGradient>
    </defs>
    <rect width={1920} height={1080} filter="url(#grain)" />
    <rect width={1920} height={1080} fill="url(#vig)" />
  </svg>
);
