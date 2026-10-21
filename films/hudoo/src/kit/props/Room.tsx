import React from 'react';
import { INK, LINE, PAL, sketch, sketchRect } from '../style';
import { rrect } from './ui';

/** A wall clock: origin at its centre, radius r (default 36). Twelve ticks, hour and minute hands (fractional minutes are fine). */
export const Clock = ({ hours, minutes, r = 36 }: { hours: number; minutes: number; r?: number }) => {
  const k = r / 36, lw = LINE.fine * k;
  const ha = ((hours % 12) + minutes / 60) * 30, ma = (minutes % 60) * 6;
  return (
    <g strokeLinecap="round">
      <circle r={r} fill={PAL.chair} stroke={INK} strokeWidth={lw} />
      <circle r={r * 0.84} fill="#FBFAF7" stroke={INK} strokeWidth={lw * 0.7} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180, l = i % 3 ? 0.08 : 0.15;
        return <path key={i} d={`M${Math.sin(a) * r * 0.74} ${-Math.cos(a) * r * 0.74} L${Math.sin(a) * r * (0.74 - l)} ${-Math.cos(a) * r * (0.74 - l)}`} stroke={INK} strokeWidth={i % 3 ? lw * 0.6 : lw} />;
      })}
      <path d={`M0 0 L0 ${-r * 0.42}`} stroke={INK} strokeWidth={lw * 1.5} transform={`rotate(${ha})`} />
      <path d={`M0 0 L0 ${-r * 0.64}`} stroke={INK} strokeWidth={lw} transform={`rotate(${ma})`} />
      <circle r={r * 0.07} fill={PAL.warn} stroke={INK} strokeWidth={lw * 0.5} />
    </g>
  );
};

const LEAVES: [number, number][] = [[-62, 58], [-38, 82], [-16, 96], [4, 104], [24, 92], [44, 78], [66, 56]];
/**
 * A potted plant: origin at the middle of the pot's base (y=0 is the floor), ~150 px tall.
 * `sway` −1..1 leans the leaves (pass a slow sine of time for a breeze).
 */
export const Plant = ({ sway = 0 }: { sway?: number }) => (
  <g strokeLinejoin="round">
    {LEAVES.map(([a, L], i) => (
      <g key={i} transform={`translate(0 -40) rotate(${a + sway * 7 * (L / 100)})`}>
        <path d={`M0 0 Q${-L * 0.28} ${-L * 0.5} 0 ${-L} Q${L * 0.28} ${-L * 0.5} 0 0 Z`} fill={i % 2 ? PAL.plantDark : PAL.plant} stroke={INK} strokeWidth={LINE.fine} />
        <path d={`M0 -4 Q${L * 0.03} ${-L * 0.5} 0 ${-L * 0.85}`} fill="none" stroke={INK} strokeWidth={1.3} opacity={0.45} />
      </g>
    ))}
    <path d={sketch([[-24, -44], [24, -44], [18, 0], [-18, 0]], 5, 0.8, true)} fill={PAL.table} stroke={INK} strokeWidth={LINE.normal} />
    <path d="M10 -40 L15 -40 L12 -4 L8 -4 Z" fill={PAL.tableEdge} opacity={0.8} />
    <path d={sketchRect(-27, -50, 54, 10, 6, 0.6)} fill={PAL.tableEdge} stroke={INK} strokeWidth={LINE.fine} />
  </g>
);

/** Seat-top height of both chairs, matched to a seated Character (hip at −112, thighs resting on the seat). */
export const SEAT_Y = -104;
/**
 * A chair in side view. Origin: the floor under the seat, aligned with a seated Character drawn at the same x,y and
 * facing (its hip lands over the seat, the backrest behind it). `facing` 1: the seat faces +x. Draw it BEFORE the character.
 */
export const Chair = ({ facing = 1, kind = 'dining' }: { facing?: 1 | -1; kind?: 'office' | 'dining' }) => {
  const lw = LINE.normal, S = SEAT_Y;
  return (
    <g transform={`scale(${facing} 1)`} strokeLinejoin="round" strokeLinecap="round">
      {kind === 'dining' ? (
        <g>
          <path d={sketch([[-46, 0], [-39, 0], [-37, S], [-40, S - 128], [-50, S - 126], [-46, S]], 2, 0.6, true)} fill={PAL.wood} stroke={INK} strokeWidth={lw} />
          <path d={`M-40 ${S - 112} L-47 ${S - 110} M-39 ${S - 80} L-45 ${S - 78}`} stroke={PAL.woodDark} strokeWidth={4} />
          <path d={`M24 ${S + 8} L24 0 L31 0 L31 ${S + 8} Z`} fill={PAL.woodDark} stroke={INK} strokeWidth={lw} />
          <path d={`M-40 -40 H26`} stroke={INK} strokeWidth={lw + 4} />
          <path d={`M-40 -40 H26`} stroke={PAL.woodDark} strokeWidth={4} />
          <path d={sketch([[-50, S], [38, S], [38, S + 11], [-50, S + 11]], 3, 0.6, true)} fill={PAL.wood} stroke={INK} strokeWidth={lw} />
        </g>
      ) : (
        <g>
          <path d={`M0 -12 L-40 -8 M0 -12 L38 -8 M0 -12 L-8 -6`} stroke={INK} strokeWidth={6 + lw * 2} />
          <path d={`M0 -12 L-40 -8 M0 -12 L38 -8 M0 -12 L-8 -6`} stroke={PAL.chairDark} strokeWidth={6} />
          {[-40, 38, -8].map((x) => <circle key={x} cx={x} cy={-5} r={5.5} fill={INK} />)}
          <rect x={-4.5} y={S + 10} width={9} height={-S - 22} fill={PAL.metal} stroke={INK} strokeWidth={lw * 0.8} />
          <path d={`M-20 ${S + 10} Q-44 ${S + 4} -46 ${S - 30}`} fill="none" stroke={INK} strokeWidth={6 + lw * 2} />
          <path d={`M-20 ${S + 10} Q-44 ${S + 4} -46 ${S - 30}`} fill="none" stroke={PAL.chairDark} strokeWidth={6} />
          <path d={rrect(-62, S - 140, 20, 112, 9)} fill={PAL.chair} stroke={INK} strokeWidth={lw} transform={`rotate(-6 -52 ${S - 30})`} />
          <path d={rrect(-52, S - 3, 94, 16, 7)} fill={PAL.chair} stroke={INK} strokeWidth={lw} />
          <path d={`M-46 ${S + 9} H36`} stroke={PAL.chairDark} strokeWidth={4} opacity={0.7} />
        </g>
      )}
    </g>
  );
};
