import React from 'react';
import { C } from '../theme';

export const OUT = { stroke: C.ink, strokeWidth: 5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const PAPER = { fill: C.paper, ...OUT };

/** Paper props carry a soft drop shadow (filter "lift" defined in the World). */

export const Chair: React.FC<{ x: number; y: number; s?: number; o?: number; tint?: string }> = ({ x, y, s = 1, o = 1, tint = C.paper }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} filter="url(#lift)">
    <rect x={-70} y={-250} width={140} height={150} rx={18} fill={tint} {...OUT} />
    <rect x={-56} y={-236} width={112} height={18} rx={9} fill={C.paperShade} />
    <path d="M -95 -100 L 95 -100 L 105 -70 L -105 -70 Z" fill={tint} {...OUT} />
    <path d="M -88 -70 L -98 0 M 88 -70 L 98 0 M -50 -70 L -56 -10 M 50 -70 L 56 -10" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
  </g>
);

/** A speech bubble outline (the words sit on top, as HTML, so Arabic shapes properly). */
export const BubbleShape: React.FC<{ w: number; h: number; tail?: number; fill?: string; dashed?: boolean; o?: number; stroke?: string }> = ({ w, h, tail = 1, fill = C.paper, dashed = false, o = 1, stroke = C.ink }) => (
  <g opacity={o}>
    <path d={`M ${-w / 2 + 30} ${-h / 2} L ${w / 2 - 30} ${-h / 2} Q ${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 30} L ${w / 2} ${h / 2 - 30} Q ${w / 2} ${h / 2} ${w / 2 - 30} ${h / 2} L ${tail * 40 + 30} ${h / 2} L ${tail * 10} ${h / 2 + 46} L ${tail * 0 - 10} ${h / 2} L ${-w / 2 + 30} ${h / 2} Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 30} L ${-w / 2} ${-h / 2 + 30} Q ${-w / 2} ${-h / 2} ${-w / 2 + 30} ${-h / 2} Z`}
      fill={fill} {...OUT} stroke={stroke} strokeDasharray={dashed ? '18 12' : undefined} />
  </g>
);

/** Three dots: someone else talking (no words). */
export const Dots: React.FC<{ t: number; color?: string }> = ({ t, color = C.ink }) => (
  <g>{[-36, 0, 36].map((dx, i) => <circle key={i} cx={dx} cy={0} r={11} fill={color} opacity={0.4 + 0.6 * Math.max(0, Math.sin(t * 3.4 - i))} />)}</g>
);

export const Notebook: React.FC<{ x: number; y: number; s?: number; open?: number; lines?: number; o?: number }> = ({ x, y, s = 1, open = 1, lines = 4, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} filter="url(#lift)">
    <path d={`M 0 -60 Q ${-90 * open - 10} -78 ${-190 * open - 10} -60 L ${-190 * open - 10} 70 Q ${-90 * open - 10} 54 0 70 Z`} {...PAPER} />
    <path d={`M 0 -60 Q ${90 * open + 10} -78 ${190 * open + 10} -60 L ${190 * open + 10} 70 Q ${90 * open + 10} 54 0 70 Z`} {...PAPER} />
    {Array.from({ length: lines }).map((_, l) => (
      <g key={l} opacity={open}>
        <path d={`M -160 ${-26 + l * 26} L -30 ${-30 + l * 26}`} stroke="#C9BBA2" strokeWidth={6} strokeLinecap="round" />
        <path d={`M 30 ${-30 + l * 26} L 160 ${-26 + l * 26}`} stroke="#C9BBA2" strokeWidth={6} strokeLinecap="round" />
      </g>
    ))}
    <path d="M 0 -60 L 0 70" stroke={C.ink} strokeWidth={5} />
  </g>
);

export const Cup: React.FC<{ x: number; y: number; s?: number; color?: string; t: number }> = ({ x, y, s = 1, color = C.blue, t }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#lift)">
    {[0, 1].map((k) => <path key={k} d={`M ${-14 + k * 22} -96 q 10 -16 0 -30 q -10 -14 0 -28`} fill="none" stroke={C.paper} strokeWidth={5} strokeLinecap="round" opacity={0.35 + 0.3 * Math.sin(t * 2.1 + k)} />)}
    <path d="M -42 -76 L 42 -76 L 34 0 L -34 0 Z" fill={color} {...OUT} />
    <path d="M 40 -62 q 34 4 28 30 q -6 18 -32 14" fill="none" {...OUT} strokeWidth={6} />
    <path d="M -40 -64 L 40 -64" stroke={C.paper} strokeWidth={6} opacity={0.5} />
  </g>
);

export const Mic: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#lift)">
    <path d="M 0 0 L 0 -260" stroke={C.ink} strokeWidth={9} />
    <ellipse cx={0} cy={0} rx={70} ry={16} fill={C.ink} />
    <rect x={-26} y={-340} width={52} height={86} rx={26} fill={C.muted} {...OUT} />
    {[0, 1, 2].map((i) => <path key={i} d={`M -20 ${-320 + i * 18} L 20 ${-320 + i * 18}`} stroke={C.ink} strokeWidth={3} opacity={0.6} />)}
  </g>
);

/** A paper shirt on a hanger; the picture on it is a bold symbol, not a person. */
export const Shirt: React.FC<{ x: number; y: number; s?: number; pic?: number }> = ({ x, y, s = 1, pic = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#lift)">
    <path d="M 0 -250 L 0 -205 M -120 -150 L 0 -205 L 120 -150" fill="none" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <path d="M 0 -232 q 16 0 16 -14 q 0 -14 -16 -14" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    <path d="M -60 -180 Q 0 -150 60 -180 L 150 -130 L 120 -60 L 85 -78 L 85 120 L -85 120 L -85 -78 L -120 -60 L -150 -130 Z" fill={C.amber} {...OUT} />
    <path d="M -60 -180 Q 0 -140 60 -180" fill="none" {...OUT} />
    <g opacity={pic} transform={`scale(${0.6 + 0.4 * pic})`}>
      <circle cx={0} cy={10} r={58} fill={C.red} {...OUT} />
      <path d="M -8 -34 L 18 4 L 2 6 L 14 50 L -20 0 L -2 -2 Z" fill={C.paper} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    </g>
  </g>
);

/** A paper card; its label sits on top as HTML. icon: big beam / small beam. */
export const Card: React.FC<{ x: number; y: number; s?: number; beam: number; color: string; o?: number; rot?: number }> = ({ x, y, s = 1, beam, color, o = 1, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} filter="url(#lift)">
    <rect x={-210} y={-150} width={420} height={300} rx={22} fill={C.paper} {...OUT} />
    <rect x={-210} y={-150} width={420} height={70} rx={22} fill={color} {...OUT} />
    <g transform="translate(0 40)">
      <path d={`M 0 -60 L ${-40 - beam * 90} 70 L ${40 + beam * 90} 70 Z`} fill={C.warm} opacity={0.7} />
      <rect x={-22} y={-78} width={44} height={30} rx={8} fill={C.ink} />
      <ellipse cx={0} cy={70} rx={40 + beam * 90} ry={14} fill={C.warm} {...OUT} strokeWidth={3} />
    </g>
  </g>
);

export const Scrap: React.FC<{ x: number; y: number; rot: number; kind: 'glance' | 'thought' | 'replay' | 'beam'; o?: number; s?: number }> = ({ x, y, rot, kind, o = 1, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} filter="url(#lift)">
    <path d="M -80 -50 L 76 -56 L 82 48 L -74 54 Z" fill={C.paper} {...OUT} strokeWidth={4} />
    {kind === 'glance' && <g><path d="M -36 0 Q 0 -30 36 0 Q 0 30 -36 0 Z" fill="none" stroke={C.blue} strokeWidth={6} /><circle r={9} fill={C.blue} /></g>}
    {kind === 'thought' && <g fill="none" stroke={C.violet} strokeWidth={6}><path d="M -40 10 Q -46 -24 -12 -22 Q 0 -44 24 -26 Q 50 -22 40 6 Q 44 26 16 24 Q 0 40 -20 26 Q -46 32 -40 10 Z" /></g>}
    {kind === 'replay' && <g fill="none" stroke={C.red} strokeWidth={6} strokeLinecap="round"><path d="M 26 -14 A 30 30 0 1 0 30 12" /><path d="M 26 -34 L 28 -12 L 6 -12" /></g>}
    {kind === 'beam' && <g><path d="M 0 -30 L -34 28 L 34 28 Z" fill={C.warm} {...OUT} strokeWidth={3} /></g>}
  </g>
);

export const Flower: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} filter="url(#lift)">
    <path d="M 0 0 L 0 70" stroke={C.green} strokeWidth={8} strokeLinecap="round" />
    <path d="M 0 40 q 30 -20 40 6 q -24 14 -40 -6" fill={C.green} {...OUT} strokeWidth={4} />
    {Array.from({ length: 6 }).map((_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return <ellipse key={i} cx={Math.cos(a) * 24} cy={Math.sin(a) * 24} rx={18} ry={14} transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * 24} ${Math.sin(a) * 24})`} fill={C.coral} {...OUT} strokeWidth={4} />;
    })}
    <circle r={16} fill={C.amber} {...OUT} strokeWidth={4} />
  </g>
);

export const Flag: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} filter="url(#lift)">
    <path d="M 0 0 L 0 -150" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
    <path d="M 0 -150 L -90 -126 L 0 -100 Z" fill={C.green} {...OUT} />
  </g>
);

export const Clock: React.FC<{ x: number; y: number; r?: number; t: number }> = ({ x, y, r = 56, t }) => (
  <g transform={`translate(${x} ${y})`} filter="url(#lift)">
    <circle r={r} fill={C.paper} {...OUT} />
    {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M ${Math.sin((i * Math.PI) / 6) * r * 0.78} ${-Math.cos((i * Math.PI) / 6) * r * 0.78} L ${Math.sin((i * Math.PI) / 6) * r * 0.9} ${-Math.cos((i * Math.PI) / 6) * r * 0.9}`} stroke={C.ink} strokeWidth={4} />)}
    {/* t = hours on a 12 h dial */}
    <path d={`M 0 0 L ${Math.sin((t / 12) * Math.PI * 2) * r * 0.5} ${-Math.cos((t / 12) * Math.PI * 2) * r * 0.5}`} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <path d={`M 0 0 L ${Math.sin(((t % 1) * Math.PI * 2)) * r * 0.75} ${-Math.cos(((t % 1) * Math.PI * 2)) * r * 0.75}`} stroke={C.red} strokeWidth={5} strokeLinecap="round" />
    <circle r={6} fill={C.ink} />
  </g>
);

export const Window: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`} filter="url(#lift)">
    <rect x={-140} y={-110} width={280} height={220} rx={10} fill="#0A1028" {...OUT} />
    {[[-90, -60], [60, -70], [-30, 40], [90, 30], [10, -20]].map(([sx, sy], i) => <circle key={i} cx={sx} cy={sy} r={3 + (i % 2)} fill={C.paper} opacity={0.8} />)}
    <circle cx={60} cy={-30} r={34} fill={C.paper} />
    <circle cx={76} cy={-40} r={30} fill="#0A1028" />
    <path d="M 0 -110 L 0 110 M -140 0 L 140 0" stroke={C.paper} strokeWidth={10} />
    <rect x={-140} y={-110} width={280} height={220} rx={10} fill="none" {...OUT} strokeWidth={7} />
  </g>
);

/** Hanging can light; its beam is drawn separately. */
export const Lamp: React.FC<{ x: number; y: number; rot: number; on: number }> = ({ x, y, rot, on }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d="M 0 -400 L 0 -40" stroke={C.ink} strokeWidth={6} />
    <path d="M -46 -46 L 46 -46 L 64 30 L -64 30 Z" fill={C.ink} stroke="#2A3050" strokeWidth={4} />
    {/* the mouth glows with the beam; switched off (on < 0.3) it fades to the dark can */}
    <ellipse cx={0} cy={30} rx={64} ry={14} fill="#2A3050" opacity={1 - Math.min(1, on / 0.3)} />
    <ellipse cx={0} cy={30} rx={64} ry={14} fill={C.warm} opacity={(0.5 + 0.5 * on) * Math.min(1, on / 0.3)} />
  </g>
);

/** The same chair as a dashed outline: someone only imagined in the dark. */
export const GhostChair: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} fill="none" stroke={C.muted} strokeWidth={5} strokeDasharray="16 12" strokeLinecap="round" strokeLinejoin="round">
    <rect x={-70} y={-250} width={140} height={150} rx={18} />
    <path d="M -95 -100 L 95 -100 L 105 -70 L -105 -70 Z" />
    <path d="M -88 -70 L -98 0 M 88 -70 L 98 0" />
  </g>
);

/** A small side table. */
export const Stool: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#lift)">
    <path d="M -60 -66 L -70 0 M 60 -66 L 70 0 M 0 -66 L 0 -6" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
    <ellipse cx={0} cy={-70} rx={86} ry={20} fill={C.paperShade} {...OUT} />
  </g>
);

/** Closed notebooks in a pile. */
export const Stack: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#lift)">
    {[[C.blue, -4, 0], [C.coral, 6, -26], [C.green, -2, -52]].map(([c, dx, dy], i) => (
      <g key={i} transform={`translate(${dx} ${dy}) rotate(${i === 1 ? 3 : -2})`}>
        <rect x={-80} y={-24} width={160} height={26} rx={6} fill={c as string} {...OUT} strokeWidth={4} />
        <path d="M -70 -8 L 66 -8" stroke={C.paper} strokeWidth={4} opacity={0.6} />
      </g>
    ))}
  </g>
);
