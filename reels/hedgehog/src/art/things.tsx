import React from 'react';
import { C } from '../theme';

export const OUT = { stroke: C.ink, strokeWidth: 6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Falling snow; density 0–1, deterministic per frame. */
export const Snow: React.FC<{ f: number; density: number; wind?: number }> = ({ f, density, wind = 0 }) => {
  if (density <= 0) return null;
  const n = Math.round(70 * density);
  return (
    <g opacity={Math.min(1, density * 1.4)}>
      {Array.from({ length: n }).map((_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const x0 = (seed / 233280) * 1180 - 50;
        const speed = 1.6 + ((i * 37) % 10) / 4;
        const y = ((f * speed + i * 97) % 2000) - 40;
        const x = x0 + Math.sin((f + i * 13) / 25) * 18 + wind * y * 0.15;
        const r = 3 + ((i * 7) % 5);
        return <circle key={i} cx={((x % 1180) + 1180) % 1180 - 50} cy={y} r={r} fill={C.snow} opacity={0.75} />;
      })}
    </g>
  );
};

/** A soft warm halo. */
export const Glow: React.FC<{ x: number; y: number; r: number; o: number; color?: string; id: string }> = ({ x, y, r, o, color = C.warm, id }) => (
  o <= 0 ? null : (
    <g opacity={o}>
      <defs>
        <radialGradient id={id}><stop offset="0%" stopColor={color} stopOpacity={0.75} /><stop offset="55%" stopColor={color} stopOpacity={0.28} /><stop offset="100%" stopColor={color} stopOpacity={0} /></radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
    </g>
  )
);

/** The prick: a red burst with short lines. */
export const Poke: React.FC<{ x: number; y: number; p: number; s?: number }> = ({ x, y, p, s = 1 }) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={1 - p}>
      <path d="M 0 -34 L 9 -10 L 34 -12 L 14 4 L 24 28 L 0 14 L -24 28 L -14 4 L -34 -12 L -9 -10 Z" fill={C.red} {...OUT} strokeWidth={4} transform={`scale(${0.6 + p * 0.8})`} />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        return <path key={i} d={`M ${Math.cos(a) * (40 + p * 40)} ${Math.sin(a) * (40 + p * 40)} L ${Math.cos(a) * (58 + p * 60)} ${Math.sin(a) * (58 + p * 60)}`} stroke={C.red} strokeWidth={7} strokeLinecap="round" />;
      })}
    </g>
  );
};

export const Heart: React.FC<{ x: number; y: number; s?: number; o?: number; color?: string }> = ({ x, y, s = 1, o = 1, color = C.coral }) => (
  o <= 0 ? null : <path transform={`translate(${x} ${y}) scale(${s})`} opacity={o} d="M 0 18 C -30 -2 -34 -26 -16 -32 C -6 -35 0 -26 0 -20 C 0 -26 6 -35 16 -32 C 34 -26 30 -2 0 18 Z" fill={color} {...OUT} strokeWidth={4} />
);

export const Ground: React.FC<{ y: number; color: string; o?: number }> = ({ y, color, o = 1 }) => (
  <path d={`M -40 ${y} C 200 ${y - 26} 420 ${y + 18} 620 ${y - 6} C 820 ${y - 26} 960 ${y + 10} 1120 ${y - 8} L 1120 2000 L -40 2000 Z`} fill={color} opacity={o} />
);

export const Moon: React.FC<{ x: number; y: number; o?: number }> = ({ x, y, o = 1 }) => (
  <g opacity={o}>
    <circle cx={x} cy={y} r={70} fill={C.paper} opacity={0.9} />
    <circle cx={x + 26} cy={y - 14} r={62} fill="#13214A" />
  </g>
);

export const Stars: React.FC<{ f: number; o?: number }> = ({ f, o = 1 }) => (
  <g opacity={o}>
    {Array.from({ length: 26 }).map((_, i) => {
      const x = (i * 211) % 1060 + 10, y = 120 + ((i * 137) % 700);
      return <circle key={i} cx={x} cy={y} r={2 + (i % 3)} fill={C.paper} opacity={0.35 + 0.35 * Math.sin(f / 12 + i)} />;
    })}
  </g>
);

/** An open book (the story) — no text, only lines. */
export const Book: React.FC<{ x: number; y: number; s: number; open: number }> = ({ x, y, s, open }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={`M 0 -70 Q ${-80 * open - 20} ${-90} ${-180 * open - 20} -70 L ${-180 * open - 20} 90 Q ${-80 * open - 20} 70 0 90 Z`} fill={C.paper} {...OUT} />
    <path d={`M 0 -70 Q ${80 * open + 20} ${-90} ${180 * open + 20} -70 L ${180 * open + 20} 90 Q ${80 * open + 20} 70 0 90 Z`} fill={C.paper} {...OUT} />
    {open > 0.5 && [0, 1, 2, 3].map((l) => (
      <g key={l} opacity={(open - 0.5) * 2}>
        <path d={`M -150 ${-30 + l * 30} L -30 ${-34 + l * 30}`} stroke="#C9BBA2" strokeWidth={6} strokeLinecap="round" />
        <path d={`M 30 ${-34 + l * 30} L 150 ${-30 + l * 30}`} stroke="#C9BBA2" strokeWidth={6} strokeLinecap="round" />
      </g>
    ))}
    <path d="M 0 -70 L 0 90" stroke={C.ink} strokeWidth={6} />
  </g>
);

export const Phone: React.FC<{ x: number; y: number; s?: number; rot?: number; glow?: number }> = ({ x, y, s = 1, rot = 0, glow = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-34} y={-60} width={68} height={120} rx={14} fill={C.ink} {...OUT} strokeWidth={5} />
    <rect x={-26} y={-50} width={52} height={96} rx={8} fill={C.blueLight} opacity={0.5 + 0.5 * glow} />
    {[0, 1, 2].map((i) => <rect key={i} x={-18} y={-38 + i * 22} width={36 - i * 8} height={10} rx={5} fill={C.paper} opacity={0.8} />)}
  </g>
);

export const Sofa: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <g>
    <rect x={x - w / 2} y={y - 210} width={w} height={150} rx={50} fill="#7A4E6A" {...OUT} />
    <rect x={x - w / 2 - 30} y={y - 120} width={w + 60} height={120} rx={40} fill="#8E5E7C" {...OUT} />
    <rect x={x - w / 2 + 30} y={y} width={30} height={40} fill={C.ink} />
    <rect x={x + w / 2 - 60} y={y} width={30} height={40} fill={C.ink} />
  </g>
);

export const Lamp: React.FC<{ x: number; y: number; on: number }> = ({ x, y, on }) => (
  <g>
    <defs><radialGradient id="lampglow"><stop offset="0%" stopColor={C.warm} stopOpacity={0.45} /><stop offset="100%" stopColor={C.warm} stopOpacity={0} /></radialGradient></defs>
    <circle cx={x} cy={y - 330} r={300} fill="url(#lampglow)" opacity={on} />
    <path d={`M ${x} ${y} L ${x} ${y - 300}`} stroke={C.ink} strokeWidth={8} />
    <path d={`M ${x - 70} ${y - 300} L ${x + 70} ${y - 300} L ${x + 44} ${y - 390} L ${x - 44} ${y - 390} Z`} fill={C.amber} {...OUT} />
    <ellipse cx={x} cy={y} rx={60} ry={14} fill={C.ink} />
  </g>
);

export const House: React.FC<{ x: number; y: number; s?: number; color: string; roof: string; door: number; lit: number; flip?: boolean }> = ({ x, y, s = 1, color, roof, door, lit, flip = false }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <rect x={-150} y={-260} width={300} height={260} fill={color} {...OUT} />
    <path d="M -185 -250 L 0 -400 L 185 -250 Z" fill={roof} {...OUT} />
    <rect x={-110} y={-210} width={80} height={70} rx={8} fill={lit > 0 ? C.warm : '#2A3358'} {...OUT} strokeWidth={5} opacity={1} />
    <rect x={-110} y={-210} width={80} height={70} rx={8} fill={C.warm} opacity={lit} />
    <rect x={30} y={-150} width={80} height={150} rx={6} fill="#3A2A2A" {...OUT} strokeWidth={5} />
    <rect x={30} y={-150} width={80} height={150} fill={C.warm} opacity={door * 0.9} />
    <g transform={`translate(30 0) scale(${1 - door * 0.82} 1)`}>
      <rect x={0} y={-150} width={80} height={150} rx={6} fill="#8A5A3C" {...OUT} strokeWidth={5} />
      <circle cx={64} cy={-74} r={6} fill={C.amber} />
    </g>
  </g>
);

/** A low hedge fence with an open gate: the gentle limit. */
export const Fence: React.FC<{ x: number; y: number; w: number; glow: number; gate: number }> = ({ x, y, w, glow, gate }) => (
  <g>
    {glow > 0 && <rect x={x - w / 2 - 10} y={y - 90} width={w + 20} height={100} rx={40} fill={C.green} opacity={0.18 * glow} />}
    {Array.from({ length: Math.floor(w / 40) + 1 }).map((_, i) => {
      const px = x - w / 2 + i * 40;
      if (Math.abs(px - x) < 50) return null;
      return <path key={i} d={`M ${px} ${y} L ${px} ${y - 70} L ${px + 10} ${y - 82} L ${px + 20} ${y - 70} L ${px + 20} ${y} Z`} fill={C.paper} {...OUT} strokeWidth={4} />;
    })}
    <path d={`M ${x - w / 2} ${y - 50} L ${x - 50} ${y - 50} M ${x + 50} ${y - 50} L ${x + w / 2 + 20} ${y - 50}`} stroke={C.ink} strokeWidth={6} />
    <g transform={`translate(${x - 50} ${y}) rotate(${-70 * gate})`}>
      <rect x={0} y={-76} width={46} height={72} rx={6} fill={C.green} {...OUT} strokeWidth={4} />
    </g>
  </g>
);

/** A clock tag: the agreed time. */
export const ClockTag: React.FC<{ x: number; y: number; p: number; tick: number }> = ({ x, y, p, tick }) => (
  p <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${p})`}>
      <circle r={52} fill={C.paper} {...OUT} />
      <path d="M 0 0 L 0 -34 M 0 0 L 24 12" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
      {tick > 0 && <g transform="translate(40 -40)"><circle r={22} fill={C.green} {...OUT} strokeWidth={4} /><path d="M -10 0 L -2 8 L 11 -9" fill="none" stroke={C.paper} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - tick} /></g>}
    </g>
  )
);

export const Gift: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-30} y={-50} width={60} height={50} rx={6} fill={C.coral} {...OUT} strokeWidth={4} />
    <path d="M 0 -50 L 0 0 M -30 -28 L 30 -28" stroke={C.amber} strokeWidth={8} />
    <path d="M 0 -52 C -18 -72 -30 -58 -14 -52 M 0 -52 C 18 -72 30 -58 14 -52" fill="none" stroke={C.amber} strokeWidth={6} strokeLinecap="round" />
  </g>
);

/** A bookmark ribbon: save. */
export const Bookmark: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M -36 -60 L 36 -60 L 36 60 L 0 34 L -36 60 Z" fill={C.amber} {...OUT} />
  </g>
);

/** Distance meter: close (red) — warm (amber) — far (blue); marker 0 = close, 1 = far. */
export const Meter: React.FC<{ x: number; y: number; w: number; marker: number; shake?: number; o?: number }> = ({ x, y, w, marker, shake = 0, o = 1 }) => {
  const x0 = x - w / 2;
  const seg = w / 3;
  const mx = x0 + marker * w + shake;
  return (
    <g opacity={o}>
      <rect x={x0} y={y - 34} width={seg} height={68} rx={34} fill={C.red} {...OUT} />
      <rect x={x0 + seg} y={y - 34} width={seg} height={68} fill={C.amber} {...OUT} />
      <rect x={x0 + 2 * seg} y={y - 34} width={seg} height={68} rx={34} fill={C.blue} {...OUT} />
      {/* icons: quill, heart, snowflake */}
      <path d={`M ${x0 + seg / 2 - 22} ${y + 16} L ${x0 + seg / 2} ${y - 20} L ${x0 + seg / 2 + 22} ${y + 16} Z`} fill={C.paper} {...OUT} strokeWidth={4} />
      <Heart x={x0 + seg * 1.5} y={y + 4} s={0.9} color={C.paper} />
      {[0, 60, 120].map((a) => <path key={a} d={`M ${x0 + seg * 2.5} ${y} m ${-22 * Math.cos((a * Math.PI) / 180)} ${-22 * Math.sin((a * Math.PI) / 180)} l ${44 * Math.cos((a * Math.PI) / 180)} ${44 * Math.sin((a * Math.PI) / 180)}`} stroke={C.paper} strokeWidth={6} strokeLinecap="round" />)}
      <g transform={`translate(${mx} ${y - 70})`}>
        <path d="M -26 -30 L 26 -30 L 0 6 Z" fill={C.paper} {...OUT} />
      </g>
    </g>
  );
};
