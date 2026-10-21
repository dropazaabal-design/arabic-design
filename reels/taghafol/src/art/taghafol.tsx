import React from 'react';
import { draw } from '../motion';
import { C } from '../theme';
import { ArText, G, P } from './doodles';

// The reel's one world, drawn from what he says: an eye that sees (فطن), a card that shows a sleepy eye
// (تكلّف الغفلة), small notes that pass by (ما يقع حوله), a magnifier (التحقيق), a balance and a crown
// (سيد قومه), two paths to «الحمد», and a house with three lit rooms. No people, no faces.

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const EW = 240, EC = 260;                                     // eye half-width; control y of its arcs (visible ±130)
const almond = `M ${-EW} 0 Q 0 ${-EC} ${EW} 0 Q 0 ${EC} ${-EW} 0 Z`;

/** An eye. `lid` 0 = open, 1 = shut (the upper lid comes down); `p` draws the outline; `iris` its colour. */
export const Eye: React.FC<P & { id: string; lid?: number; p?: number; iris?: string; look?: number; ring?: number }> = ({ id, lid = 0, p = 1, iris = C.blue, look = 0, ring = 0, ...g }) => {
  const edge = -EC + 2 * EC * clamp(lid);                     // control y of the lid's lower edge
  const fill = clamp(p * 2 - 1);
  return (
    <G {...g}>
      <defs><clipPath id={`eye-${id}`}><path d={almond} /></clipPath></defs>
      {ring > 0 && <path d={almond} fill="none" stroke={C.green} strokeWidth={26} opacity={0.35 * ring} transform="scale(1.1)" />}
      <path d={almond} fill={C.white} opacity={fill} />
      <g clipPath={`url(#eye-${id})`} opacity={fill}>
        <circle cx={look * 70} r={100} fill={iris} />
        <circle cx={look * 70} r={46} fill={C.navy} />
        <circle cx={look * 70 - 30} cy={-32} r={17} fill={C.white} />
        {lid > 0 && <path d={`M ${-EW - 20} 0 Q 0 ${-EC - 20} ${EW + 20} 0 L ${EW + 20} 0 Q 0 ${edge} ${-EW - 20} 0 Z`} fill={C.line} />}
      </g>
      {lid > 0 && fill > 0 && <path d={`M ${-EW} 0 Q 0 ${edge} ${EW} 0`} fill="none" stroke={C.ink} strokeWidth={10} strokeLinecap="round" opacity={fill} />}
      <path d={almond} fill="none" stroke={C.ink} strokeWidth={10} strokeLinejoin="round" {...draw(p)} />
    </G>
  );
};

/** The pretence: a paper card held up in front, with a sleepy eye drawn on it. `lid` is the drawn eye's lid. */
export const Mask: React.FC<P & { lid: number; label?: string; labelO?: number }> = ({ lid, label, labelO = 0, ...g }) => (
  <G {...g}>
    <rect x={-310} y={-200} width={620} height={label ? 400 : 330} rx={40} fill={C.paper} stroke={C.ink} strokeWidth={8} filter="url(#lift)" />
    <Eye id="mask" lid={lid} iris={C.muted} s={0.9} x={0} y={-40} />
    {label && labelO > 0 && <g opacity={labelO}><ArText y={140} size={60} color={C.ink} weight={900}>{label}</ArText></g>}
  </G>
);

/** A small note: something that happens around him. `lit` outlines it blue (seen); `tick` adds a check. */
export const Note: React.FC<P & { lit?: number; tick?: number; dim?: number; color?: string }> = ({ lit = 0, tick = 0, dim = 0, color = C.cardboard, ...g }) => (
  <G {...g}>
    <rect x={-80} y={-60} width={160} height={120} rx={16} fill={C.paper} stroke={lit > 0 ? C.blue : C.ink} strokeWidth={5 + 5 * lit} filter="url(#lift)" />
    <rect x={-80} y={-60} width={160} height={30} rx={14} fill={color} />
    <rect x={-56} y={-6} width={112} height={12} rx={6} fill={C.line} />
    <rect x={-56} y={22} width={78} height={12} rx={6} fill={C.line} />
    {dim > 0 && <rect x={-80} y={-60} width={160} height={120} rx={16} fill={C.light} opacity={0.6 * dim} />}
    {tick > 0 && (
      <g transform={`translate(70 -56) scale(${0.6 + 0.4 * clamp(tick)})`} opacity={clamp(tick * 2)}>
        <circle r={28} fill={C.blue} />
        <path d="M -12 0 L -3 9 L 13 -9" fill="none" stroke={C.white} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    )}
  </G>
);

/** A dotted line of sight. */
export const Sight: React.FC<{ from: [number, number]; to: [number, number]; o: number; color?: string }> = ({ from, to, o, color = C.blue }) => o > 0 ? (
  <path d={`M ${from[0]} ${from[1]} L ${to[0]} ${to[1]}`} stroke={color} strokeWidth={6} strokeDasharray="4 16" strokeLinecap="round" opacity={0.75 * o} />
) : null;

/** A magnifying glass (looking into something closely). */
export const Lens: React.FC<P & { r?: number }> = ({ r = 120, ...g }) => (
  <G {...g}>
    <path d={`M ${r * 0.7} ${-r * 0.7} L ${r * 1.5} ${-r * 1.5}`} stroke={C.ink} strokeWidth={30} strokeLinecap="round" />
    <circle r={r} fill={C.aqua} opacity={0.35} />
    <circle r={r} fill="none" stroke={C.ink} strokeWidth={14} />
    <path d={`M ${-r * 0.55} ${-r * 0.3} Q ${-r * 0.5} ${-r * 0.55} ${-r * 0.25} ${-r * 0.6}`} stroke={C.white} strokeWidth={9} strokeLinecap="round" fill="none" />
  </G>
);

/** A red X drawn over something. */
export const Cross: React.FC<P & { size?: number; p: number }> = ({ size = 110, p, ...g }) => p > 0 ? (
  <G {...g}>
    <path d={`M ${-size} ${-size} L ${size} ${size}`} stroke={C.red} strokeWidth={22} strokeLinecap="round" {...draw(Math.min(1, p * 2))} />
    <path d={`M ${size} ${-size} L ${-size} ${size}`} stroke={C.red} strokeWidth={22} strokeLinecap="round" {...draw(Math.max(0, p * 2 - 1))} />
  </G>
) : null;

/** A crown (سيد قومه). */
export const Crown: React.FC<P & { color?: string }> = ({ color = C.cardboard, ...g }) => (
  <G {...g}>
    <path d="M -90 50 L -100 -40 L -50 0 L 0 -62 L 50 0 L 100 -40 L 90 50 Z" fill={color} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" filter="url(#lift)" />
    <rect x={-92} y={44} width={184} height={30} rx={8} fill={color} stroke={C.ink} strokeWidth={8} />
    {[-100, 0, 100].map((x, i) => <circle key={i} cx={x} cy={i === 1 ? -66 : -44} r={12} fill={C.paper} stroke={C.ink} strokeWidth={6} />)}
  </G>
);

/** «الحمد»: a green rosette. `glow` pulses its ring. */
export const Praise: React.FC<P & { text: string; glow?: number }> = ({ text, glow = 0, ...g }) => (
  <G {...g}>
    <path d="M -60 80 L -90 210 L -40 180 L -10 230 L 0 100 Z" fill={C.green} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 60 80 L 90 210 L 40 180 L 10 230 L 0 100 Z" fill={C.green} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    {glow > 0 && <circle r={150 + 30 * glow} fill="none" stroke={C.green} strokeWidth={14} opacity={0.5 * (1 - glow)} />}
    <circle r={130} fill={C.green} stroke={C.ink} strokeWidth={8} filter="url(#lift)" />
    <circle r={104} fill="none" stroke={C.white} strokeWidth={5} strokeDasharray="10 9" />
    <ArText y={4} size={62} color={C.white} weight={900}>{text}</ArText>
  </G>
);

/** A house: `p` draws the outline; `rooms` are three windows (right to left) that light up with their labels. */
export const House: React.FC<P & { p: number; rooms: Array<{ label: string; lit: number }> }> = ({ p, rooms, ...g }) => (
  <G {...g}>
    <path d="M -340 -150 L 0 -420 L 340 -150" fill="none" stroke={C.ink} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" {...draw(clamp(p * 1.6))} />
    <path d="M -300 -180 L -300 330 L 300 330 L 300 -180" fill="none" stroke={C.ink} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" {...draw(clamp(p * 1.6 - 0.6))} />
    {rooms.map((r, i) => {
      const x = 190 - i * 190, o = clamp(p * 3 - 2);
      return (
        <g key={i} transform={`translate(${x} 60)`} opacity={o}>
          {r.lit > 0 && <rect x={-86} y={-106} width={172} height={212} rx={20} fill={C.green} opacity={0.25 * r.lit} transform={`scale(${1 + 0.12 * r.lit})`} />}
          <rect x={-70} y={-90} width={140} height={180} rx={14} fill={r.lit > 0 ? C.greenSoft : C.navy2} stroke={C.ink} strokeWidth={8} />
          <path d="M 0 -90 L 0 90 M -70 0 L 70 0" stroke={C.ink} strokeWidth={6} />
          {r.lit > 0 && <rect x={-70} y={-90} width={140} height={180} rx={14} fill="#FFF6D8" opacity={0.65 * r.lit} />}
          <g opacity={clamp(r.lit * 2)}><ArText y={170} size={48} color={C.ink} weight={900}>{r.label}</ArText></g>
        </g>
      );
    })}
  </G>
);
