import React from 'react';
import { getLength, getPointAtLength } from '@remotion/paths';
import { TITLE_FONT, BODY_FONT } from '../fonts';
import { draw, STROKE } from '../motion';
import { C } from '../theme';

// Original doodles for the episode. Thick clean line, simple geometry, no people.
// Words placed on objects are SVG text with direction rtl (Chromium shapes Arabic in SVG).

type P = { x: number; y: number; s?: number; o?: number; rot?: number };
const G: React.FC<P & { children: React.ReactNode; filter?: string }> = ({ x, y, s = 1, o = 1, rot = 0, children, filter }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} filter={filter}>{children}</g>
);

export const ArText: React.FC<{ x?: number; y?: number; size: number; color?: string; weight?: number; children: string; font?: string; anchor?: 'middle' | 'start' | 'end' }> = ({ x = 0, y = 0, size, color = C.ink, weight = 800, children, font = TITLE_FONT, anchor = 'middle' }) => (
  <text x={x} y={y} direction="rtl" textAnchor={anchor} dominantBaseline="central" fontFamily={font} fontWeight={weight} fontSize={size} fill={color}>{children}</text>
);

/** Headphones; `p` draws the band on. `fancy` adds padding and a second line (the $200 pair). */
export const Headphones: React.FC<P & { color?: string; p?: number; fancy?: boolean }> = ({ color = C.blue, p = 1, fancy = false, ...g }) => (
  <G {...g}>
    <path d="M -120 40 C -120 -110 120 -110 120 40" {...STROKE} strokeWidth={fancy ? 16 : 12} stroke={color} {...draw(p)} />
    {fancy && <path d="M -96 -30 C -70 -84 70 -84 96 -30" {...STROKE} strokeWidth={6} stroke={C.white} opacity={0.7 * p} />}
    {[-1, 1].map((d) => (
      <g key={d} opacity={Math.min(1, p * 1.6)}>
        <rect x={d * 120 - 34} y={10} width={68} height={fancy ? 118 : 100} rx={30} fill={color} stroke={C.ink} strokeWidth={6} />
        <rect x={d * 120 - (d > 0 ? 34 : -4)} y={26} width={30} height={fancy ? 86 : 68} rx={14} fill={C.white} opacity={0.35} />
      </g>
    ))}
  </G>
);

/** A paper price tag hanging on a string; `label` is the price text. */
export const PriceTag: React.FC<P & { label: string; color?: string; textColor?: string; w?: number }> = ({ label, color = C.red, textColor = C.white, w = 300, ...g }) => (
  <G {...g}>
    <path d={`M 0 -120 L 0 -46`} {...STROKE} strokeWidth={4} stroke={C.inkSoft} />
    <path d={`M ${-w / 2} -46 L ${w / 2 - 34} -46 L ${w / 2} 0 L ${w / 2 - 34} 46 L ${-w / 2} 46 Z`} fill={color} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={w / 2 - 34} cy={0} r={9} fill={C.light} stroke={C.ink} strokeWidth={4} />
    <ArText x={-17} y={2} size={52} color={textColor} weight={900}>{label}</ArText>
  </G>
);

/** The 'felt price' gauge: a vertical bar whose fill is how expensive the price feels (0–1). */
export const Gauge: React.FC<P & { level: number; color?: string; label?: string; labelColor?: string }> = ({ level, color = C.red, label, labelColor = C.ink, ...g }) => (
  <G {...g}>
    <rect x={-34} y={-180} width={68} height={360} rx={34} fill={C.white} stroke={C.ink} strokeWidth={6} />
    <clipPath id="gaugeClip"><rect x={-28} y={-174} width={56} height={348} rx={28} /></clipPath>
    <rect x={-28} y={174 - 348 * level} width={56} height={348 * level} fill={color} clipPath="url(#gaugeClip)" />
    {[0.25, 0.5, 0.75].map((k) => <path key={k} d={`M 34 ${180 - 360 * k} L 52 ${180 - 360 * k}`} {...STROKE} strokeWidth={4} />)}
    {label && <ArText x={0} y={226} size={36} color={labelColor} font={BODY_FONT} weight={700}>{label}</ArText>}
  </G>
);

export const Wallet: React.FC<P & { color?: string }> = ({ color = C.green, ...g }) => (
  <G {...g}>
    <rect x={-110} y={-70} width={220} height={140} rx={22} fill={color} stroke={C.ink} strokeWidth={6} />
    <path d="M 30 -26 L 110 -26 L 110 26 L 30 26 Q 14 0 30 -26 Z" fill={C.white} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={52} cy={0} r={8} fill={C.ink} />
  </G>
);

export const Target: React.FC<P & { color?: string; p?: number }> = ({ color = C.green, p = 1, ...g }) => (
  <G {...g}>
    {[90, 58, 26].map((r, i) => <circle key={r} r={r} fill={i === 1 ? C.white : color} stroke={C.ink} strokeWidth={6} opacity={Math.min(1, p * 3 - i)} />)}
    <path d="M 120 -120 L 8 -8" {...STROKE} strokeWidth={8} {...draw(p * 1.2 - 0.2)} />
    <path d="M 120 -120 L 96 -122 M 120 -120 L 118 -96" {...STROKE} strokeWidth={8} opacity={p > 0.9 ? 1 : 0} />
  </G>
);

export const ShopBag: React.FC<P> = (g) => (
  <G {...g}>
    <path d="M -80 -50 L 80 -50 L 96 100 L -96 100 Z" fill={C.coverGray} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -40 -50 C -40 -110 40 -110 40 -50" {...STROKE} />
  </G>
);

export const SubCard: React.FC<P> = (g) => (
  <G {...g}>
    <rect x={-110} y={-72} width={220} height={144} rx={18} fill={C.blue} stroke={C.ink} strokeWidth={6} />
    <path d="M -110 -30 L 110 -30" stroke={C.ink} strokeWidth={14} />
    <path d="M 40 40 A 26 26 0 1 0 66 14" {...STROKE} stroke={C.white} strokeWidth={6} />
    <path d="M 66 0 L 68 16 L 52 18" {...STROKE} stroke={C.white} strokeWidth={6} />
  </G>
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

/** An original descriptive book card (not the cover): spine strip, title, subtitle, author. */
export const BookCard: React.FC<P & { title: string; subtitle: string; author: string; marks?: [number, number, number] }> = ({ title, subtitle, author, marks = [0, 0, 0], ...g }) => (
  <G {...g}>
    <rect x={-200} y={-280} width={400} height={560} rx={18} fill={C.paper} stroke={C.ink} strokeWidth={7} />
    <rect x={140} y={-280} width={60} height={560} rx={10} fill={C.coverBlue} stroke={C.ink} strokeWidth={7} />
    {/* highlighter strokes under each line as it is named (drawn right to left, the reading direction) */}
    {([[120, -170, -48, 30], [120, -170, 50, 22], [100, -150, 196, 20]] as const).map(([x1, x2, y, w], i) => marks[i] > 0 && <path key={i} d={`M ${x1} ${y} L ${x2} ${y}`} stroke={C.blue} strokeOpacity={0.22} strokeWidth={w} strokeLinecap="round" {...draw(marks[i])} />)}
    <path d="M -150 -150 L 100 -150" stroke={C.coverBlue} strokeWidth={10} strokeLinecap="round" />
    <ArText x={-25} y={-60} size={96} color={C.ink} weight={900}>{title}</ArText>
    <ArText x={-25} y={40} size={40} color={C.coverBlue} weight={800}>{subtitle}</ArText>
    <path d="M -150 120 L 100 120" stroke={C.line} strokeWidth={6} strokeLinecap="round" />
    <ArText x={-25} y={190} size={34} color={C.inkSoft} weight={700} font={BODY_FONT}>{author}</ArText>
  </G>
);

/** A long winding path and the straight shortcut across it (mental shortcut). */
const LONG_PATH = 'M -380 120 C -300 -140, -160 160, -60 -40 S 160 160, 240 -60 S 360 40, 380 -110';
const LONG_LEN = getLength(LONG_PATH);
/** `race` 0→1: a dot crosses the shortcut in the first third while another crawls the whole long way. */
export const PathShortcut: React.FC<P & { pLong: number; pShort: number; warn: number; fadeLong?: number; race?: number }> = ({ pLong, pShort, warn, fadeLong = 0, race = 0, ...g }) => (
  <G {...g}>
    <path d="M -380 120 C -300 -140, -160 160, -60 -40 S 160 160, 240 -60 S 360 40, 380 -110" {...STROKE} strokeWidth={10} stroke={C.line} strokeDasharray="1 1" pathLength={1} strokeDashoffset={1 - pLong} opacity={1 - 0.6 * fadeLong} />
    <path d={LONG_PATH} {...STROKE} strokeWidth={10} stroke={C.line} opacity={0} />
    <path d="M -380 120 L 380 -110" {...STROKE} strokeWidth={12} stroke={C.blue} {...draw(pShort)} />
    <circle cx={-380} cy={120} r={18} fill={C.ink} />
    <circle cx={380} cy={-110} r={18} fill={C.green} stroke={C.ink} strokeWidth={5} opacity={pShort > 0.95 ? 1 : 0} />
    {race > 0 && race < 1 && (() => {
      const q = getPointAtLength(LONG_PATH, LONG_LEN * race) ?? { x: 380, y: -110 }, s = Math.min(1, race * 3);
      return <><circle cx={q.x} cy={q.y} r={14} fill={C.inkSoft} /><circle cx={-380 + 760 * s} cy={120 - 230 * s} r={16} fill={C.blue} stroke={C.ink} strokeWidth={4} /></>;
    })()}
    <g transform="translate(40 4)" opacity={warn}>
      <circle r={46} fill={C.red} stroke={C.ink} strokeWidth={6} />
      <path d="M 0 -22 L 0 6" stroke={C.white} strokeWidth={10} strokeLinecap="round" />
      <circle cx={0} cy={22} r={6} fill={C.white} />
    </g>
  </G>
);

export const Ruler: React.FC<P & { color?: string; p?: number; crossed?: number }> = ({ color = C.coverGray, p = 1, crossed = 0, ...g }) => (
  <G {...g}>
    <g opacity={Math.min(1, p * 1.5)}>
      <rect x={-260} y={-42} width={520} height={84} rx={12} fill={color} stroke={C.ink} strokeWidth={6} />
      {Array.from({ length: 13 }).map((_, i) => <path key={i} d={`M ${-240 + i * 40} -42 L ${-240 + i * 40} ${i % 2 ? -14 : 2}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />)}
    </g>
    <path d="M -300 -110 L 300 110" {...STROKE} strokeWidth={16} stroke={C.red} {...draw(crossed)} />
    <path d="M 300 -110 L -300 110" {...STROKE} strokeWidth={16} stroke={C.red} {...draw(crossed * 2 - 1)} />
  </G>
);

export const Bowl: React.FC<P & { kind: 'cold' | 'warm' | 'hot'; t: number }> = ({ kind, t, ...g }) => {
  const water = kind === 'cold' ? '#7FB7E8' : kind === 'hot' ? '#F08A8F' : '#C9D7E3';
  return (
    <G {...g}>
      <path d="M -150 -20 L 150 -20 Q 140 120 0 130 Q -140 120 -150 -20 Z" fill={C.white} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
      <path d="M -138 6 L 138 6 Q 128 108 0 116 Q -128 108 -138 6 Z" fill={water} />
      <ellipse cx={0} cy={-20} rx={150} ry={22} fill={water} stroke={C.ink} strokeWidth={7} />
      {kind === 'cold' && [-60, 10, 70].map((dx, i) => <rect key={i} x={dx - 22} y={-48 + (i % 2) * 8} width={44} height={40} rx={8} fill={C.white} stroke={C.ink} strokeWidth={5} transform={`rotate(${i * 12 - 10} ${dx} -28)`} />)}
      {kind === 'hot' && [-50, 0, 50].map((dx, i) => <path key={i} d={`M ${dx} -60 q 16 -24 0 -48 q -16 -24 0 -48`} {...STROKE} strokeWidth={6} stroke={C.red} opacity={0.5 + 0.4 * Math.sin(t * 2.4 + i)} />)}
    </G>
  );
};

/** A thermometer whose column shows a level 0–1 (felt or measured temperature). */
export const Thermo: React.FC<P & { level: number; color: string; dashed?: boolean }> = ({ level, color, dashed = false, ...g }) => (
  <G {...g}>
    <rect x={-22} y={-170} width={44} height={250} rx={22} fill={C.white} stroke={C.ink} strokeWidth={6} strokeDasharray={dashed ? '14 10' : undefined} />
    <circle cx={0} cy={100} r={40} fill={color} stroke={C.ink} strokeWidth={6} />
    <rect x={-10} y={90 - 240 * level} width={20} height={240 * level + 10} fill={color} />
  </G>
);

export const Laptop: React.FC<P> = (g) => (
  <G {...g}>
    <rect x={-190} y={-150} width={380} height={240} rx={16} fill={C.navy2} stroke={C.ink} strokeWidth={7} />
    <rect x={-168} y={-128} width={336} height={196} rx={8} fill={C.blue} />
    <path d="M -250 90 L 250 90 L 220 130 L -220 130 Z" fill={C.coverGray} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
  </G>
);

export const Case: React.FC<P> = (g) => (
  <G {...g}>
    <rect x={-120} y={-80} width={240} height={160} rx={26} fill={C.red} stroke={C.ink} strokeWidth={7} />
    <path d="M -40 -80 L -40 -110 L 40 -110 L 40 -80" {...STROKE} strokeWidth={7} />
    <path d="M -120 -10 L 120 -10" stroke={C.ink} strokeWidth={6} opacity={0.5} />
  </G>
);

export const Calendar: React.FC<P & { label?: string }> = ({ label, ...g }) => (
  <G {...g}>
    <rect x={-110} y={-100} width={220} height={200} rx={18} fill={C.white} stroke={C.ink} strokeWidth={6} />
    <rect x={-110} y={-100} width={220} height={54} rx={18} fill={C.blue} stroke={C.ink} strokeWidth={6} />
    {[-60, 60].map((dx) => <path key={dx} d={`M ${dx} -120 L ${dx} -84`} {...STROKE} strokeWidth={8} />)}
    {label && <ArText x={0} y={30} size={64} weight={900}>{label}</ArText>}
  </G>
);

/** A paper card that slides over something to hide it (decision step: 'if I had not seen it'). */
export const CoverCard: React.FC<P & { w?: number; h?: number }> = ({ w = 360, h = 300, ...g }) => (
  <G {...g}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={C.coverGray} stroke={C.ink} strokeWidth={6} />
    <path d={`M ${-w / 2 + 30} ${-h / 2 + 50} L ${w / 2 - 30} ${-h / 2 + 50}`} stroke={C.line} strokeWidth={6} strokeLinecap="round" />
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
