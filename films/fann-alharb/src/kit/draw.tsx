import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { TITLE } from '../fonts';

// The look: white page, black ink outlines, flat colour with one shade, a soft grey ground shadow.
export const INK = '#1C1C1E';
export const W = 6;                     // outline width at 1080p
export const C = {
  white: '#FFFFFF', paper: '#F4F2EE', shade: '#E4E1DB', grey: '#9B9B9B', greyDark: '#6B6B6B', shadow: 'rgba(0,0,0,0.10)',
  red: '#D64541', redDark: '#A83232', blue: '#3D6FB6', blueDark: '#2B518A', sky: '#9CC9E8', green: '#4E9A5B', greenDark: '#357344',
  yellow: '#FFC93C', yellowDark: '#E0A21B', brown: '#8B5E3C', brownDark: '#6A452B', wood: '#C48A55', woodDark: '#9C6A3D',
  skin: '#FFFFFF', gold: '#E8B33A', stone: '#B8B2A7', stoneDark: '#918A7E', water: '#5DADE2', waterDark: '#2E86C1',
  purple: '#8E6BBE', pink: '#E58FA8', orange: '#F08A3C', teal: '#3BA7A0', navy: '#2C3E66', cream: '#F6E7C8', black: '#2A2A2A',
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: e });

/** Pop in at `at` (frame): scale 0.6 → 1.06 → 1 around the element's anchor. Optional `out` fades it away. */
export const Pop: React.FC<{ at: number; out?: number; x?: number; y?: number; s?: number; r?: number; children: React.ReactNode; from?: 'pop' | 'up' | 'down' | 'left' | 'right' | 'fade' }> =
  ({ at, out, x = 0, y = 0, s = 1, r = 0, children, from = 'pop' }) => {
    const f = useCurrentFrame();
    if (f < at || (out !== undefined && f >= out + 10)) return null;
    const t = f - at;
    let k = 1, dx = 0, dy = 0;
    const o = Math.min(ease(t, 0, 6), out !== undefined ? ease(f, out, out + 10, 1, 0) : 1);
    if (from === 'pop') k = t < 9 ? ease(t, 0, 9, 0.6, 1.06) : ease(t, 9, 15, 1.06, 1, Easing.inOut(Easing.quad));
    if (from === 'up') dy = ease(t, 0, 16, 90, 0);
    if (from === 'down') dy = ease(t, 0, 16, -90, 0);
    if (from === 'left') dx = ease(t, 0, 16, -140, 0);
    if (from === 'right') dx = ease(t, 0, 16, 140, 0);
    return <g transform={`translate(${x + dx} ${y + dy}) rotate(${r}) scale(${s * k})`} opacity={o}>{children}</g>;
  };

/** Shows children only between two frames (no animation). */
export const Show: React.FC<{ from: number; to?: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const f = useCurrentFrame();
  return f >= from && (to === undefined || f < to) ? <>{children}</> : null;
};

/** Seq: beats that cut from one to the next; each lasts until the next one starts (the last until `end`). */
export const Seq: React.FC<{ end: number; beats: Array<[number, React.ReactNode]> }> = ({ end, beats }) => {
  const f = useCurrentFrame();
  for (let i = 0; i < beats.length; i++) {
    const a = beats[i][0], b = i + 1 < beats.length ? beats[i + 1][0] : end;
    if (f >= a && f < b) return <>{beats[i][1]}</>;
  }
  return null;
};

/** Ground shadow under a standing thing. */
export const Shadow: React.FC<{ w?: number; y?: number }> = ({ w = 120, y = 0 }) =>
  <ellipse cx={0} cy={y} rx={w} ry={w * 0.13} fill={C.shadow} />;

/** Arabic label with the reference's yellow-and-black emphasis (or plain ink). Anchor is the text centre. */
export const Label: React.FC<{ x: number; y: number; text: string; size?: number; tone?: 'yellow' | 'ink' | 'red' | 'white'; at?: number; r?: number }> =
  ({ x, y, text, size = 64, tone = 'yellow', at, r = 0 }) => {
    const fill = tone === 'yellow' ? C.yellow : tone === 'red' ? C.red : tone === 'white' ? '#fff' : INK;
    const stroke = tone === 'ink' ? 'none' : INK;
    const el = (
      <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={800}
        fontSize={size} fill={fill} stroke={stroke} strokeWidth={tone === 'ink' ? 0 : size * 0.16} strokeLinejoin="round"
        paintOrder="stroke" transform={`rotate(${r})`}>{text}</text>
    );
    return at === undefined ? <g transform={`translate(${x} ${y})`}>{el}</g> : <Pop at={at} x={x} y={y}>{el}</Pop>;
  };

/** An arrow that draws itself from (x1,y1) to (x2,y2), optionally bowed. */
export const Arrow: React.FC<{ at: number; x1: number; y1: number; x2: number; y2: number; bow?: number; color?: string; w?: number; dur?: number }> =
  ({ at, x1, y1, x2, y2, bow = 0, color = INK, w = 9, dur = 14 }) => {
    const f = useCurrentFrame();
    if (f < at) return null;
    const p = ease(f - at, 0, dur);
    const mx = (x1 + x2) / 2 - (y2 - y1) * bow, my = (y1 + y2) / 2 + (x2 - x1) * bow;
    const d = `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
    const ang = Math.atan2(y2 - my, x2 - mx);
    const h = 30;
    return (
      <g>
        <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
        {p > 0.95 && <path d={`M${x2 - h * Math.cos(ang - 0.45)} ${y2 - h * Math.sin(ang - 0.45)} L${x2} ${y2} L${x2 - h * Math.cos(ang + 0.45)} ${y2 - h * Math.sin(ang + 0.45)}`}
          fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />}
      </g>
    );
  };

/** A line drawn on over time (for strike-throughs, ticks, motion lines). */
export const Draw: React.FC<{ at: number; d: string; color?: string; w?: number; dur?: number; fill?: string }> = ({ at, d, color = INK, w = 8, dur = 12, fill = 'none' }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return <path d={d} fill={fill} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(f - at, 0, dur)} />;
};

/** Tick and cross marks. */
export const Tick: React.FC<{ at: number; x: number; y: number; s?: number }> = ({ at, x, y, s = 1 }) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><Draw at={at} d="M-30 0 L-8 24 L34 -28" color={C.green} w={14} /></g>;
export const Cross: React.FC<{ at: number; x: number; y: number; s?: number }> = ({ at, x, y, s = 1 }) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><Draw at={at} d="M-26 -26 L26 26" color={C.red} w={14} dur={7} /><Draw at={at + 6} d="M26 -26 L-26 26" color={C.red} w={14} dur={7} /></g>;

/** Speech or thought bubble with content inside (children drawn in bubble-local coordinates, centre 0,0). */
export const Bubble: React.FC<{ w: number; h: number; tail?: [number, number]; think?: boolean; children?: React.ReactNode }> = ({ w, h, tail = [-w * 0.3, h * 0.75], think, children }) => (
  <g>
    {think ? <>
      <circle cx={tail[0] * 0.55} cy={h / 2 + (tail[1] - h / 2) * 0.45} r={14} fill="#fff" stroke={INK} strokeWidth={W} />
      <circle cx={tail[0]} cy={tail[1]} r={9} fill="#fff" stroke={INK} strokeWidth={W} />
    </> : <path d={`M${tail[0] - 26} ${h / 2 - 8} L${tail[0]} ${tail[1]} L${tail[0] + 30} ${h / 2 - 8} Z`} fill="#fff" stroke={INK} strokeWidth={W} strokeLinejoin="round" />}
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={think ? h / 2 : 36} fill="#fff" stroke={INK} strokeWidth={W} />
    {!think && <path d={`M${tail[0] - 23} ${h / 2 - 3} L${tail[0] + 27} ${h / 2 - 3}`} stroke="#fff" strokeWidth={W + 2} />}
    {children}
  </g>
);

/** Plain Arabic text (ink), for inside bubbles, signs and cards. */
export const T: React.FC<{ x?: number; y?: number; size?: number; color?: string; weight?: number; children: React.ReactNode }> = ({ x = 0, y = 0, size = 44, color = INK, weight = 800, children }) =>
  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={weight} fontSize={size} fill={color}>{children}</text>;

/** A gentle repeating bob (frames → px). */
export const bob = (f: number, amp = 4, period = 150, phase = 0) => Math.sin((f / period) * Math.PI * 2 + phase) * amp;

/** Moves children from (x1,y1) to (x2,y2) between frames a and b (then stays). */
export const Move: React.FC<{ a: number; b: number; x1: number; y1: number; x2: number; y2: number; children: React.ReactNode; e?: (t: number) => number }> =
  ({ a, b, x1, y1, x2, y2, children, e = Easing.inOut(Easing.cubic) }) => {
    const f = useCurrentFrame();
    const t = interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });
    return <g transform={`translate(${x1 + (x2 - x1) * t} ${y1 + (y2 - y1) * t})`}>{children}</g>;
  };

/** A gentle sway (rotation in degrees) around a pivot, for wobbling stacks and nervous things. */
export const Sway: React.FC<{ amp?: number; period?: number; x?: number; y?: number; children: React.ReactNode }> = ({ amp = 4, period = 50, x = 0, y = 0, children }) => {
  const f = useCurrentFrame();
  return <g transform={`rotate(${Math.sin((f / period) * Math.PI * 2) * amp} ${x} ${y})`}>{children}</g>;
};
