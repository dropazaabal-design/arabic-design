import React from 'react';
import { P } from './pencil';

export const K = {
  ink: '#1B1F33', paper: '#FBF4E6', paperShade: '#EFE2CB', line: '#C9BBA2',
  blue: '#2E7BC5', blueLight: '#7DB6FF', red: '#E63946', green: '#10B981', amber: '#F4B860',
  violet: '#6C4AB6', teal: '#1F8A8A', coral: '#F28C6B', muted: '#8FA3BF',
};
const OUT = { stroke: K.ink, strokeWidth: 6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Small doodle icons for the three ambitions (no text, no faces). */
export const Icon: React.FC<{ kind: 'book' | 'dumbbell' | 'briefcase' | 'clock' | 'shoe' | 'bookmark'; x: number; y: number; s?: number; color?: string }> = ({ kind, x, y, s = 1, color }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {kind === 'book' && (<g>
      <path d="M -40 -26 Q -20 -36 0 -26 L 0 30 Q -20 20 -40 30 Z" fill={color ?? K.blue} {...OUT} />
      <path d="M 40 -26 Q 20 -36 0 -26 L 0 30 Q 20 20 40 30 Z" fill={color ?? K.blueLight} {...OUT} />
    </g>)}
    {kind === 'dumbbell' && (<g>
      <rect x={-30} y={-5} width={60} height={10} rx={4} fill={K.muted} {...OUT} />
      <rect x={-46} y={-22} width={16} height={44} rx={5} fill={color ?? K.red} {...OUT} />
      <rect x={30} y={-22} width={16} height={44} rx={5} fill={color ?? K.red} {...OUT} />
    </g>)}
    {kind === 'briefcase' && (<g>
      <path d="M -14 -24 L -14 -32 L 14 -32 L 14 -24" fill="none" {...OUT} />
      <rect x={-40} y={-24} width={80} height={52} rx={8} fill={color ?? K.violet} {...OUT} />
      <path d="M -40 -2 L 40 -2" {...OUT} />
    </g>)}
    {kind === 'clock' && (<g>
      <circle r={34} fill={K.paper} {...OUT} />
      <path d="M 0 0 L 0 -20 M 0 0 L 14 8" {...OUT} />
    </g>)}
    {kind === 'shoe' && (<g>
      <path d="M -40 14 L -40 -10 Q -20 -14 -10 -26 L 10 -10 Q 30 -6 40 6 L 40 14 Z" fill={color ?? K.green} {...OUT} />
      <path d="M -40 14 L 40 14" {...OUT} strokeWidth={10} />
    </g>)}
    {kind === 'bookmark' && <path d="M -16 -34 L 16 -34 L 16 34 L 0 20 L -16 34 Z" fill={color ?? K.red} {...OUT} />}
  </g>
);

/**
 * The notebook seen from above: a spread whose task list unfolds like an
 * accordion. rows: how many lines are out (fractional = the last one sliding),
 * done: how many are ticked.
 */
export const ListSheet: React.FC<{
  x: number; y: number; w: number; rowH: number; rows: number; items: Array<{ icon?: 'book' | 'dumbbell' | 'briefcase'; color?: string }>;
  done?: number; crowd?: number; o?: number; rot?: number;
}> = ({ x, y, w, rowH, rows, items, done = 0, crowd = 0, o = 1, rot = 0 }) => {
  const shown = Math.min(items.length, rows);
  const h = Math.max(rowH, shown * rowH) + 40;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o}>
      <rect x={-w / 2 + 10} y={14} width={w} height={h} rx={14} fill="#000" opacity={0.22} />
      <rect x={-w / 2} y={0} width={w} height={h} rx={14} fill={K.paper} {...OUT} />
      {Array.from({ length: Math.ceil(shown) }).map((_, i) => {
        const vis = Math.max(0, Math.min(1, rows - i));
        const it = items[i];
        const ry = 20 + i * rowH + rowH / 2;
        const jitter = crowd * Math.sin(i * 2.3) * 10;
        const tick = Math.max(0, Math.min(1, done - i));
        return (
          <g key={i} opacity={vis} transform={`translate(${jitter} ${(1 - vis) * -rowH * 0.6})`}>
            <path d={`M ${-w / 2 + 30} ${ry + rowH / 2 - 4} L ${w / 2 - 30} ${ry + rowH / 2 - 4}`} stroke={K.line} strokeWidth={3} />
            <rect x={w / 2 - 92} y={ry - 26} width={52} height={52} rx={10} fill={K.paper} {...OUT} strokeWidth={5} />
            {tick > 0 && <path d={`M ${w / 2 - 82} ${ry} L ${w / 2 - 68} ${ry + 14} L ${w / 2 - 44} ${ry - 18}`} fill="none" stroke={K.green} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - tick} />}
            <rect x={-w / 2 + 50} y={ry - 9} width={(w - 210) * (0.55 + ((i * 37) % 40) / 100)} height={18} rx={9} fill={it?.color ?? K.muted} opacity={0.55} />
            {it?.icon && <Icon kind={it.icon} x={w / 2 - 140} y={ry} s={0.62} />}
          </g>
        );
      })}
    </g>
  );
};

/** Calendar strip: days as boxes; ticks, an empty (missed) day, and today. */
export const CalendarStrip: React.FC<{ x: number; y: number; n: number; cell: number; ticks: number[]; missed?: number[]; today?: number; o?: number }> = ({ x, y, n, cell, ticks, missed = [], today = -1, o = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    {Array.from({ length: n }).map((_, i) => {
      // right to left, like the reading direction
      const cx = -(i - (n - 1) / 2) * (cell + 14);
      const t = ticks[i] ?? 0;
      const isMissed = missed.includes(i);
      return (
        <g key={i} transform={`translate(${cx} 0)`}>
          <rect x={-cell / 2} y={-cell / 2} width={cell} height={cell} rx={14} fill={i === today ? K.amber : K.paper} {...OUT} strokeDasharray={isMissed ? '12 10' : undefined} />
          {t > 0 && <path d={`M ${-cell * 0.25} 0 L ${-cell * 0.05} ${cell * 0.2} L ${cell * 0.28} ${-cell * 0.22}`} fill="none" stroke={K.green} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} />}
        </g>
      );
    })}
  </g>
);

export const Stopwatch: React.FC<{ x: number; y: number; s?: number; hand: number; ring?: number }> = ({ x, y, s = 1, hand, ring = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {ring > 0 && <circle r={110 + ring * 30} fill="none" stroke={K.amber} strokeWidth={8} opacity={1 - ring} />}
    <rect x={-16} y={-118} width={32} height={22} rx={6} fill={K.muted} {...OUT} />
    <circle r={96} fill={K.paper} {...OUT} strokeWidth={8} />
    <path d={`M 0 0 L 0 -96 A 96 96 0 ${hand > 0.5 ? 1 : 0} 1 ${Math.sin(hand * Math.PI * 2) * 96} ${-Math.cos(hand * Math.PI * 2) * 96} Z`} fill={K.amber} opacity={0.45} />
    {Array.from({ length: 12 }).map((_, i) => (
      <path key={i} d={`M ${Math.sin((i / 12) * Math.PI * 2) * 76} ${-Math.cos((i / 12) * Math.PI * 2) * 76} L ${Math.sin((i / 12) * Math.PI * 2) * 88} ${-Math.cos((i / 12) * Math.PI * 2) * 88}`} stroke={K.ink} strokeWidth={5} />
    ))}
    <path d={`M 0 0 L ${Math.sin(hand * Math.PI * 2) * 70} ${-Math.cos(hand * Math.PI * 2) * 70}`} stroke={K.red} strokeWidth={9} strokeLinecap="round" />
    <circle r={10} fill={K.ink} />
  </g>
);

/** A tick mark that becomes a paving stone of the road. */
export const Stone: React.FC<{ x: number; y: number; w: number; p: number; color?: string }> = ({ x, y, w, p, color = K.green }) => (
  <g transform={`translate(${x} ${y}) scale(${0.3 + 0.7 * p})`} opacity={Math.min(1, p * 2)}>
    <path d={`M ${-w / 2} 10 L ${-w / 2 + 14} -14 L ${w / 2 + 14} -14 L ${w / 2} 10 Z`} fill={color} {...OUT} strokeWidth={5} />
    <path d={`M ${-w * 0.18} -2 L ${-w * 0.04} 6 L ${w * 0.2} -8`} fill="none" stroke={K.paper} strokeWidth={6} strokeLinecap="round" />
  </g>
);

export { P };
