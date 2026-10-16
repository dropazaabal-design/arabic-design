import React from 'react';
import { INK } from '../../../motion-core/src/cartoon';
import { BODY, TITLE } from './fonts';
import { C } from './theme';

// Motion-graphic pieces, drawn in world units next to the characters, same ink outline.

/** Arabic text inside the SVG world (shaped by the browser, right to left). Anchored at its centre. */
export const Say: React.FC<{ x: number; y: number; size: number; color?: string; o?: number; bold?: boolean; title?: boolean; children: React.ReactNode }> = ({ x, y, size, color = C.light, o = 1, bold = true, title = false, children }) => (
  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={title ? TITLE : BODY} fontWeight={title ? 800 : bold ? 700 : 600}
    fontSize={size} fill={color} opacity={o} style={{ unicodeBidi: 'plaintext' } as React.CSSProperties}>{children}</text>
);

/** A label pill in the world: rounded box sized from the text length. */
export const Tag: React.FC<{ x: number; y: number; text: string; color: string; size?: number; o?: number; solid?: boolean; w?: number }> = ({ x, y, text, color, size = 40, o = 1, solid = true, w }) => {
  const width = w ?? text.length * size * 0.56 + size * 1.4;
  const h = size * 1.6;
  if (o <= 0) return null;
  return (
    <g opacity={o} transform={`translate(${x} ${y}) scale(${0.85 + 0.15 * Math.min(1, o)})`}>
      <rect x={-width / 2} y={-h / 2} width={width} height={h} rx={h / 2} fill={solid ? color : 'rgba(14,22,38,0.92)'} stroke={solid ? INK : color} strokeWidth={solid ? 4 : 4} />
      <Say x={0} y={2} size={size} color={solid ? C.light : color}>{text}</Say>
    </g>
  );
};

/** A bar split into segments, filled right to left. Each segment grows with its own `grow`. */
export const Bar: React.FC<{ x: number; y: number; w: number; h: number; segs: { frac: number; color: string; label?: string; grow?: number }[]; frame?: string; labelSize?: number }> = ({ x, y, w, h, segs, frame = C.light, labelSize = 34 }) => {
  let right = x + w;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h * 0.25} fill="#1A2638" stroke={INK} strokeWidth={4} />
      {segs.map((s, k) => {
        const sw = w * s.frac * (s.grow ?? 1);
        const sx = right - sw;
        right -= w * s.frac;
        return (
          <g key={k}>
            {sw > 1 && <rect x={sx} y={y + 6} width={Math.max(0, sw - 6)} height={h - 12} rx={(h - 12) * 0.22} fill={s.color} />}
            {s.label && (s.grow ?? 1) > 0.6 && <Say x={sx + sw / 2} y={y + h / 2 + 2} size={labelSize} color={C.light}>{s.label}</Say>}
          </g>
        );
      })}
      <rect x={x} y={y} width={w} height={h} rx={h * 0.25} fill="none" stroke={frame} strokeWidth={0} />
    </g>
  );
};

/** Months as a grid of cells, filled one by one (right to left, top to bottom). */
export const Months: React.FC<{ x: number; y: number; cell: number; cols?: number; rows?: number; filled: number; color: string; empty?: string }> = ({ x, y, cell, cols = 12, rows = 5, filled, color, empty = '#22334A' }) => (
  <g>
    {Array.from({ length: cols * rows }, (_, k) => {
      const c = cols - 1 - (k % cols), r = Math.floor(k / cols);
      const on = Math.max(0, Math.min(1, filled - k));
      return <rect key={k} x={x + c * cell} y={y + r * cell} width={cell - 8} height={cell - 8} rx={6}
        fill={on > 0 ? color : empty} opacity={on > 0 ? 0.35 + 0.65 * on : 1} stroke={INK} strokeWidth={3} />;
    })}
  </g>
);

/** A seesaw scale. `tilt` in degrees (+ = right side down). Pans carry any content. */
export const Seesaw: React.FC<{ x: number; y: number; w: number; tilt: number; left?: React.ReactNode; right?: React.ReactNode }> = ({ x, y, w, tilt, left, right }) => {
  const a = (tilt * Math.PI) / 180;
  const lx = -w / 2 * Math.cos(a), ly = -w / 2 * Math.sin(a), rx = w / 2 * Math.cos(a), ry = w / 2 * Math.sin(a);
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-70 120 L0 0 L70 120 Z" fill="#3B5675" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M${lx} ${ly} L${rx} ${ry}`} stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d={`M${lx} ${ly} L${rx} ${ry}`} stroke={C.mist} strokeWidth={13} strokeLinecap="round" />
      <circle r={13} fill={C.light} stroke={INK} strokeWidth={4} />
      <g transform={`translate(${lx} ${ly})`}>{left}</g>
      <g transform={`translate(${rx} ${ry})`}>{right}</g>
    </g>
  );
};

/** A wall clock. Angles in degrees from 12 o'clock. */
export const Clock: React.FC<{ x: number; y: number; r: number; hour: number; minute: number; face?: string }> = ({ x, y, r, hour, minute, face = C.paper }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill={face} stroke={INK} strokeWidth={7} />
    {Array.from({ length: 12 }, (_, k) => <path key={k} d={`M0 ${-r + 14} L0 ${-r + (k % 3 ? 26 : 38)}`} stroke={INK} strokeWidth={k % 3 ? 4 : 7} transform={`rotate(${k * 30})`} strokeLinecap="round" />)}
    <path d={`M0 0 L0 ${-r * 0.5}`} stroke={INK} strokeWidth={12} strokeLinecap="round" transform={`rotate(${hour})`} />
    <path d={`M0 0 L0 ${-r * 0.78}`} stroke={C.teal} strokeWidth={9} strokeLinecap="round" transform={`rotate(${minute})`} />
    <circle r={10} fill={INK} />
  </g>
);

/** A wristwatch on display, origin at its centre. */
export const Watch: React.FC<{ scale?: number; ghost?: boolean; o?: number }> = ({ scale = 1, ghost = false, o = 1 }) => (
  <g transform={`scale(${scale})`} opacity={o}>
    <rect x={-26} y={-110} width={52} height={220} rx={16} fill={ghost ? 'none' : '#3B4C63'} stroke={ghost ? C.light : INK} strokeWidth={5} strokeDasharray={ghost ? '14 10' : undefined} />
    <circle r={58} fill={ghost ? 'none' : '#DCE6F0'} stroke={ghost ? C.light : INK} strokeWidth={7} strokeDasharray={ghost ? '14 10' : undefined} />
    {!ghost && <circle r={46} fill="#F4F8FB" stroke={INK} strokeWidth={3} />}
    {!ghost && <path d="M0 0 L0 -32 M0 0 L22 10" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
    {!ghost && <path d="M-30 -40 L-12 -40" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.8} />}
  </g>
);

/** The outline of a car that was never bought: dashed, no fill. Origin like Car (ground centre). */
export const GhostCar: React.FC<{ scale?: number; o?: number; color?: string }> = ({ scale = 1, o = 1, color = C.light }) => (
  <g transform={`scale(${scale})`} opacity={o} fill="none" stroke={color} strokeWidth={5} strokeDasharray="16 12" strokeLinejoin="round">
    <path d="M-262 -40 L-266 -92 Q-262 -104 -240 -106 L-178 -110 Q-140 -160 -96 -166 L36 -168 Q64 -166 92 -140 L118 -112 L236 -100 Q266 -94 268 -70 L266 -40 Q262 -30 250 -30 L-250 -30 Q-262 -30 -262 -40 Z" />
    <circle cx={-168} cy={-44} r={46} /><circle cx={170} cy={-44} r={46} />
  </g>
);

/** A chain from (x1, y1) to (x2, y2); `taut` 0 sags, 1 straight. */
export const Chain: React.FC<{ x1: number; y1: number; x2: number; y2: number; taut?: number; color?: string; o?: number }> = ({ x1, y1, x2, y2, taut = 1, color = C.red, o = 1 }) => {
  const n = Math.max(4, Math.round(Math.hypot(x2 - x1, y2 - y1) / 30));
  const sag = (1 - taut) * 80;
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <g opacity={o}>
      {Array.from({ length: n + 1 }, (_, k) => {
        const t = k / n;
        const px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t + Math.sin(Math.PI * t) * sag;
        return <ellipse key={k} cx={px} cy={py} rx={k % 2 ? 9 : 18} ry={k % 2 ? 6 : 10} fill="none" stroke={k % 2 ? INK : color} strokeWidth={k % 2 ? 6 : 7} transform={`rotate(${ang} ${px} ${py})`} />;
      })}
    </g>
  );
};

/** A curved arrow from a to b, bending by `bend`. `grow` 0 … 1 draws it. */
export const Arrow: React.FC<{ a: [number, number]; b: [number, number]; bend?: number; color?: string; grow?: number; w?: number }> = ({ a, b, bend = 0, color = C.light, grow = 1, w = 7 }) => {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.15;
  const ang = Math.atan2(b[1] - my, b[0] - mx);
  if (grow <= 0) return null;
  return (
    <g>
      <path d={`M${a[0]} ${a[1]} Q${mx} ${my} ${b[0]} ${b[1]}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={`${len * grow} ${len}`} />
      {grow > 0.95 && <path d={`M${b[0]} ${b[1]} l${-26 * Math.cos(ang - 0.45)} ${-26 * Math.sin(ang - 0.45)} M${b[0]} ${b[1]} l${-26 * Math.cos(ang + 0.45)} ${-26 * Math.sin(ang + 0.45)}`} stroke={color} strokeWidth={w} strokeLinecap="round" />}
    </g>
  );
};

/** A red strike across something, drawn in with `grow`. */
export const Strike: React.FC<{ x: number; y: number; w: number; grow: number }> = ({ x, y, w, grow }) => grow > 0 ? (
  <path d={`M${x - w / 2} ${y + 10} L${x - w / 2 + w * grow} ${y - 10}`} stroke={C.red} strokeWidth={12} strokeLinecap="round" />
) : null;

/** A small open eye, for glances. */
export const Eye: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M-40 0 Q0 -34 40 0 Q0 34 -40 0 Z" fill={C.paper} stroke={INK} strokeWidth={5} />
    <circle r={13} fill={INK} /><circle cx={-4} cy={-5} r={4} fill="#FFFFFF" />
  </g>
);

/** A card on the stage, origin at its centre. */
export const Card: React.FC<{ w: number; h: number; o?: number; children?: React.ReactNode; fill?: string; edge?: string }> = ({ w, h, o = 1, children, fill = '#16263A', edge = C.mist }) => o > 0 ? (
  <g opacity={o} transform={`scale(${0.92 + 0.08 * o})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={28} fill={fill} stroke={edge} strokeWidth={4} />
    {children}
  </g>
) : null;

export const TITLE_FONT = TITLE;
