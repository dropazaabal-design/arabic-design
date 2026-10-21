import React from 'react';
import { C, H, W } from './theme';
import { mix } from './time';

// Original vector art for this reel: abstract objects only, no people, hands, faces or text.

/** Deterministic pseudo-random numbers, so a torn edge is the same on every frame. */
const rand = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/**
 * A rounded rectangle whose edges can be torn: the same number of points for any radius and
 * tear depth, so a clean phone screen can morph into a torn paper scrap and back.
 * Returns a CSS polygon() in the element's own pixels.
 */
export const tornPolygon = (w: number, h: number, r: number, tear: number, seed = 7, step = 26) => {
  const rnd = rand(seed);
  const pts: Array<[number, number]> = [];
  const edge = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, d = tear * rnd();
      pts.push([x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d]);
    }
  };
  const arc = (cx: number, cy: number, a0: number) => {
    for (let k = 0; k <= 6; k++) {
      const a = a0 + (k / 6) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  arc(w - r, r, -Math.PI / 2); edge(w, r, w, h - r, -1, 0);
  arc(w - r, h - r, 0); edge(w - r, h, r, h, 0, -1);
  arc(r, h - r, Math.PI / 2); edge(0, h - r, 0, r, 1, 0);
  arc(r, r, Math.PI); edge(r, 0, w - r, 0, 0, 1);
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
};

const SCRAPS: Array<{ x: number; y: number; w: number; h: number; rot: number; fill: string; seed: number }> = [
  { x: -30, y: 70, w: 340, h: 190, rot: -7, fill: '#272A30', seed: 3 },
  { x: 840, y: 40, w: 280, h: 140, rot: 5, fill: '#2A2D33', seed: 5 },
  { x: 900, y: 600, w: 240, h: 280, rot: 8, fill: '#272A30', seed: 11 },
  { x: -70, y: 1040, w: 250, h: 300, rot: -5, fill: '#2A2D33', seed: 13 },
  { x: 140, y: 340, w: 800, h: 1100, rot: -2.5, fill: '#202328', seed: 17 },
  { x: 720, y: 1660, w: 400, h: 240, rot: 9, fill: '#272A30', seed: 19 },
  { x: 0, y: 1720, w: 450, h: 220, rot: -3, fill: '#292C32', seed: 23 },
];

/** Charcoal ground, a few grey paper scraps (they drift a little with the camera), still grain. */
export const Ground: React.FC<{ drift: number }> = ({ drift }) => (
  <>
    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 75% 55% at 50% 46%, ${C.bgGlow} 0%, ${C.bg} 70%)` }} />
    {SCRAPS.map((s, i) => (
      <div key={i} style={{
        position: 'absolute', left: s.x + drift * (i === 4 ? 0.6 : 0.25), top: s.y, width: s.w, height: s.h, background: s.fill,
        transform: `rotate(${s.rot}deg)`, clipPath: tornPolygon(s.w, s.h, 3, 9, s.seed, 16),
      }} />
    ))}
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'screen' }}>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={4} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width={W} height={H} filter="url(#grain)" />
    </svg>
  </>
);

type Ico = { size: number; color?: string; style?: React.CSSProperties };

/** Paper plane pointing left (the send arrow of a right-to-left interface). */
export const SendIcon: React.FC<Ico> = ({ size, color = C.white, style }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={style}>
    <path d="M42 8 L6 24 L42 40 L36 24 Z" fill={color} />
    <path d="M36 24 L18 24" stroke="rgba(0,0,0,0.18)" strokeWidth={3} strokeLinecap="round" />
  </svg>
);

export const PauseIcon: React.FC<Ico> = ({ size, color = C.white, style }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={style}>
    <rect x={13} y={10} width={7} height={28} rx={3.5} fill={color} />
    <rect x={28} y={10} width={7} height={28} rx={3.5} fill={color} />
  </svg>
);

/** A target: what the reply is for. */
export const TargetIcon: React.FC<Ico & { p?: number }> = ({ size, color = C.blue, p = 1, style }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={style}>
    {[28, 19, 10].map((r, i) => (
      <circle key={r} cx={32} cy={32} r={r} fill="none" stroke={color} strokeWidth={5} opacity={Math.max(0, Math.min(1, p * 3 - i))} />
    ))}
    <circle cx={32} cy={32} r={4} fill={color} opacity={p} />
  </svg>
);

/** A red spark: the reply only lets the anger out. */
export const SparkIcon: React.FC<Ico & { p?: number }> = ({ size, color = C.red, p = 1, style }) => {
  const rays = Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2 + 0.2, r0 = 9, r1 = (k % 2 ? 20 : 29) * p;
    return <line key={k} x1={32 + r0 * Math.cos(a)} y1={32 + r0 * Math.sin(a)} x2={32 + (r0 + r1) * Math.cos(a)} y2={32 + (r0 + r1) * Math.sin(a)} stroke={color} strokeWidth={5} strokeLinecap="round" />;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={style}>
      {rays}
      <circle cx={32} cy={32} r={6 * p} fill={color} />
    </svg>
  );
};

/** Save mark (bookmark): outline, filled by `fill` 0→1. */
export const BookmarkIcon: React.FC<Ico & { fill: number }> = ({ size, color = C.green, fill, style }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 48 60" style={style}>
    <clipPath id="bm"><rect x={0} y={60 - 60 * fill} width={48} height={60} /></clipPath>
    <path d="M8 4 H40 V56 L24 44 L8 56 Z" fill={color} clipPath="url(#bm)" />
    <path d="M8 4 H40 V56 L24 44 L8 56 Z" fill="none" stroke={color} strokeWidth={4.5} strokeLinejoin="round" />
  </svg>
);

/** A check mark drawn on by `p`. */
export const CheckIcon: React.FC<Ico & { p: number }> = ({ size, color = C.green, p, style }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={style}>
    <path d="M8 21 L17 30 L33 11" fill="none" stroke={color} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round"
      pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
  </svg>
);

/** Drafts folder mark. */
export const FolderIcon: React.FC<Ico> = ({ size, color = C.blue, style }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={style}>
    <path d="M5 13 Q5 9 9 9 H19 L23 13 H39 Q43 13 43 17 V36 Q43 40 39 40 H9 Q5 40 5 36 Z" fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" />
    <path d="M14 26 H34 M14 32 H27" stroke={color} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

/**
 * The pause space: a glass of water by a quiet window, cool blue light. `calm` 0→1 settles the
 * water surface; `t` is seconds (for the slow cloud drift and the ripple).
 */
export const WindowShot: React.FC<{ t: number; calm: number }> = ({ t, calm }) => {
  const amp = mix(7, 0, calm);
  const wave = Array.from({ length: 25 }, (_, k) => {
    const x = 482 + (k / 24) * 116;
    return `${x.toFixed(1)},${(1088 + amp * Math.sin(k * 0.9 + t * 7) * Math.sin((k / 24) * Math.PI)).toFixed(1)}`;
  });
  const cloud = (x: number, y: number, s: number, o: number) => (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <ellipse cx={0} cy={0} rx={70} ry={20} fill="#9CC3EA" />
      <ellipse cx={-30} cy={-14} rx={36} ry={22} fill="#9CC3EA" />
      <ellipse cx={22} cy={-18} rx={42} ry={26} fill="#9CC3EA" />
    </g>
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A88D0" /><stop offset="1" stopColor="#173A5E" />
        </linearGradient>
        <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.blue} stopOpacity={0.22} /><stop offset="1" stopColor={C.blue} stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7FB3E3" stopOpacity={0.55} /><stop offset="1" stopColor={C.blue} stopOpacity={0.4} />
        </linearGradient>
        <clipPath id="panes"><rect x={300} y={470} width={480} height={500} /></clipPath>
        <clipPath id="glassIn"><path d="M478 1006 L602 1006 L590 1186 L490 1186 Z" /></clipPath>
      </defs>
      {/* window */}
      <rect x={300} y={470} width={480} height={500} fill="url(#sky)" />
      <g clipPath="url(#panes)">
        {cloud(380 + ((t * 9) % 600), 610, 1, 0.22)}
        {cloud(120 + ((t * 6) % 700), 790, 0.8, 0.16)}
      </g>
      <rect x={300} y={470} width={480} height={500} fill="none" stroke="#3E434C" strokeWidth={16} />
      <rect x={533} y={470} width={14} height={500} fill="#3E434C" />
      <rect x={300} y={713} width={480} height={14} fill="#3E434C" />
      <rect x={280} y={968} width={520} height={20} rx={4} fill="#3A3E46" />
      {/* light falling onto the table */}
      <path d="M300 988 L780 988 L930 1196 L200 1196 Z" fill="url(#shaft)" />
      {/* table */}
      <rect x={150} y={1196} width={780} height={22} rx={6} fill="#30333A" />
      <rect x={170} y={1218} width={740} height={34} fill="#23262B" />
      {/* glass of water (drawn at 1×, shown larger, standing on the table) */}
      <g transform="translate(540 1196) scale(1.4) translate(-540 -1196)">
      <ellipse cx={540} cy={1197} rx={70} ry={9} fill="#000" opacity={0.35} />
      <ellipse cx={560} cy={1199} rx={44} ry={6} fill={C.blue} opacity={0.25} />
      <g clipPath="url(#glassIn)">
        <path d="M478 1006 L602 1006 L590 1186 L490 1186 Z" fill="#FFFFFF" opacity={0.05} />
        <polygon points={`${wave.join(' ')} 610,1190 470,1190`} fill="url(#water)" />
        <polyline points={wave.join(' ')} fill="none" stroke="#CFE3F7" strokeWidth={3} opacity={0.8} />
      </g>
      <path d="M478 1006 L602 1006 L590 1186 L490 1186 Z" fill="none" stroke="#C9D5E1" strokeWidth={4} strokeLinejoin="round" opacity={0.85} />
      <ellipse cx={540} cy={1006} rx={62} ry={7} fill="none" stroke="#C9D5E1" strokeWidth={3} opacity={0.7} />
      <path d="M494 1024 L503 1166" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.28} />
      </g>
    </svg>
  );
};
