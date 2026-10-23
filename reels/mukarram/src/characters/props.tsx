import React from 'react';
import { INK, LINE, PAL, bowLine, clamp, closedPath, lerp, openPath, rand, stroke, wobEllipse, wobRect } from './ink';

// Props and set pieces, each with its own small controls (open, flap, fold, wave…). Signs carry real
// Arabic text set in Cairo by the browser (right to left, letters joined), never letter-animated.

type At = { x: number; y: number; s?: number; rot?: number; o?: number };
const T = ({ x, y, s = 1, rot = 0 }: At) => `translate(${x} ${y}) rotate(${rot}) scale(${s})`;
export const BANANA = '#F1CF62';
export const BANANA_DEEP = '#D9A93A';

export const Banana: React.FC<At & { bitten?: number }> = ({ bitten = 0, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d="M-10 -70 C 30 -50 40 10 0 60 C -10 64 -24 58 -20 50 C 6 10 0 -30 -26 -56 Z" fill={BANANA} {...stroke(LINE * 0.8)} />
    <path d="M-12 -70 l -6 -14" {...stroke(LINE * 1.1, PAL.woodDeep)} />
    {bitten > 0.5 && <path d="M -2 62 q 6 -10 0 -18 q 8 -4 10 -14" fill={PAL.paper} {...stroke(LINE * 0.6)} />}
  </g>
);

/** A banana peel: three broad flaps around a stub (splay 0..1 opens them). */
export const Peel: React.FC<At & { splay?: number }> = ({ splay = 1, ...a }) => {
  const flap = (ang: number, len: number, k: number) => (
    <g key={k} transform={`rotate(${ang})`}>
      <path d={`M-14 0 C -26 ${len * 0.35} -18 ${len * 0.8} 0 ${len} C 18 ${len * 0.8} 26 ${len * 0.35} 14 0 Z`} fill={BANANA} {...stroke(LINE * 0.75)} />
      <path d={`M0 ${len * 0.2} L0 ${len * 0.75}`} {...stroke(LINE * 0.45, BANANA_DEEP)} />
      <path d={`M-4 ${len * 0.92} q 4 6 8 0`} fill="none" {...stroke(LINE * 0.6, PAL.woodDeep)} />
    </g>
  );
  return (
    <g transform={T(a)} opacity={a.o ?? 1}>
      {flap(-70 - 45 * splay, 70, 1)}
      {flap(70 + 45 * splay, 70, 2)}
      {flap(180, 60, 3)}
      <path d={wobEllipse(0, -4, 18, 22, 7, 0.08, 7)} fill={BANANA} {...stroke(LINE * 0.75)} />
      <path d="M0 -22 l 2 -16" {...stroke(LINE * 1.2, PAL.woodDeep)} />
    </g>
  );
};

/** The red snack bag. crumple squashes it, fold turns it into a small square, wings 0..1 grows dove wings flapping at `flap` radians. */
export const SnackBag: React.FC<At & { crumple?: number; fold?: number; wings?: number; flap?: number; empty?: boolean }> = ({ crumple = 0, fold = 0, wings = 0, flap = 0, empty = false, ...a }) => {
  const w = lerp(92, 60, fold) * (1 - crumple * 0.25), h = lerp(124, 54, fold) * (1 - crumple * 0.35);
  const crimp = (y: number) => {
    const n = 7, pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) pts.push([-w / 2 + (i / n) * w, y + (i % 2 ? -7 : 0)]);
    return 'M' + pts.map((p) => p.join(' ')).join(' L');
  };
  const wing = (side: 1 | -1) => {
    const up = Math.sin(flap) * 0.8;
    return (
      <g transform={`translate(${side * w * 0.45} ${-h * 0.1}) scale(${side * wings} ${wings}) rotate(${-25 - up * 40})`}>
        <path d="M0 0 C 30 -50 90 -70 130 -50 C 110 -40 120 -26 96 -22 C 104 -10 90 0 70 0 C 70 10 50 14 0 0Z" fill={PAL.white} {...stroke(LINE * 0.8)} />
        <path d="M40 -18 q 20 -10 44 -12" fill="none" {...stroke(LINE * 0.5)} />
      </g>
    );
  };
  const skew = crumple * 8;
  return (
    <g transform={T(a)} opacity={a.o ?? 1}>
      {wings > 0.01 && <>{wing(-1)}{wing(1)}</>}
      <g transform={`skewX(${skew})`}>
        <path d={wobRect(-w / 2, -h / 2, w, h, 14, 31, 2 + crumple * 6)} fill={PAL.red} {...stroke()} />
        {fold < 0.6 && <path d={openPath([[-w * 0.36, h * 0.05], [-w * 0.12, -h * 0.12], [w * 0.1, h * 0.08], [w * 0.36, -h * 0.1]])} fill="none" {...stroke(LINE * 1.1, PAL.white)} />}
        {fold < 0.6 && <path d={crimp(-h / 2 + 10)} fill="none" {...stroke(LINE * 0.55)} />}
        {fold < 0.6 && <path d={crimp(h / 2 - 3)} fill="none" {...stroke(LINE * 0.55)} />}
        {crumple > 0.3 && <path d={`M${-w * 0.2} ${-h * 0.25} l ${w * 0.15} ${h * 0.1} l ${-w * 0.05} ${h * 0.2}`} fill="none" {...stroke(LINE * 0.5)} />}
        {fold >= 0.6 && <path d={`M${-w * 0.5} 0 L${w * 0.5} 0 M0 ${-h * 0.5} L0 ${h * 0.5}`} {...stroke(LINE * 0.5)} opacity={0.6} />}
        {!empty && fold < 0.3 && [0, 1, 2].map((i) => <circle key={i} cx={-w * 0.2 + i * w * 0.2} cy={-h / 2 - 6 - (i % 2) * 6} r={7} fill={BANANA} {...stroke(LINE * 0.45)} />)}
      </g>
    </g>
  );
};

/** A street bin with a hinged lid (lid 0 = closed, 1 = flipped open). */
export const Bin: React.FC<At & { lid?: number; color?: string; face?: number }> = ({ lid = 0, color = PAL.blue, face = 0, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <ellipse cx={0} cy={4} rx={86} ry={14} fill={PAL.shadow} />
    <path d="M-70 -190 L70 -190 L58 0 L-58 0 Z" fill={color} {...stroke()} />
    {[-30, 0, 30].map((x) => <path key={x} d={bowLine(x, -165, x * 0.85, -24, 2)} {...stroke(LINE * 0.6)} opacity={0.5} />)}
    <g transform={`translate(-78 -192) rotate(${-lid * 115})`}>
      <path d={wobRect(0, -22, 156, 24, 10, 33, 1.5)} fill={color} {...stroke()} />
      <path d="M58 -22 q 20 -18 40 0" fill="none" {...stroke(LINE * 0.9)} />
    </g>
    {face > 0.01 && <g opacity={face}><path d="M-24 -110 q 6 -10 12 0 M12 -110 q 6 -10 12 0" fill="none" {...stroke(LINE * 0.8)} /><path d="M-22 -86 q 22 20 44 0" fill="none" {...stroke(LINE * 0.8)} /></g>}
  </g>
);

/** A wooden sign on a post with Arabic lines (right to left, Cairo). */
export const Sign: React.FC<At & { lines: string[]; w?: number; h?: number; post?: number; size?: number; color?: string; board?: string; upside?: boolean }> = ({ lines, w = 460, h = 190, post = 300, size = 54, color = INK, board = PAL.paper, upside = false, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    {post > 0 && <path d={`M-14 0 L14 0 L12 ${-post} L-12 ${-post}Z`} fill={PAL.wood} {...stroke()} />}
    <g transform={`translate(0 ${-post - h / 2}) ${upside ? 'rotate(180)' : ''}`}>
      <path d={wobRect(-w / 2, -h / 2, w, h, 18, 61, 3)} fill={PAL.wood} {...stroke()} />
      <path d={wobRect(-w / 2 + 16, -h / 2 + 14, w - 32, h - 28, 12, 62, 2)} fill={board} {...stroke(LINE * 0.6)} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={(i - (lines.length - 1) / 2) * size * 1.25 + size * 0.36} textAnchor="middle" direction="rtl" fontFamily="Cairo" fontWeight={900} fontSize={size} fill={color}>{l}</text>
      ))}
    </g>
  </g>
);

/** A pictogram sign (no words): a figure dropping litter into a bin, with a tick. */
export const PictoSign: React.FC<At & { upside?: boolean }> = ({ upside = false, ...a }) => (
  <g transform={`${T(a)} ${upside ? 'rotate(180)' : ''}`} opacity={a.o ?? 1}>
    <path d={wobRect(-90, -110, 180, 220, 16, 91, 2)} fill={PAL.white} {...stroke()} />
    <circle cx={-30} cy={-58} r={16} fill={INK} />
    <path d="M-30 -40 L-30 20 M-30 -20 L0 0 M-30 20 L-46 70 M-30 20 L-14 70" fill="none" {...stroke(LINE * 1.3)} />
    <path d="M18 18 L60 18 L54 70 L24 70Z" fill={PAL.blue} {...stroke(LINE * 0.9)} />
    <path d={wobRect(4, -12, 14, 18, 3, 92, 1)} fill={PAL.red} {...stroke(LINE * 0.6)} />
    <path d="M26 -70 l 12 14 l 26 -30" fill="none" {...stroke(LINE * 1.2, PAL.leafDeep)} />
  </g>
);

export const Tree: React.FC<At & { sway?: number }> = ({ sway = 0, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d="M-22 0 Q-14 -120 -24 -230 L22 -230 Q14 -120 22 0Z" fill={PAL.wood} {...stroke()} />
    <g transform={`rotate(${sway * 2} 0 -240)`}>
      <path d={wobEllipse(-60, -300, 110, 90, 101, 0.06, 11)} fill={PAL.leaf} {...stroke()} />
      <path d={wobEllipse(70, -320, 100, 86, 102, 0.06, 11)} fill={PAL.leaf} {...stroke()} />
      <path d={wobEllipse(0, -400, 120, 96, 103, 0.06, 11)} fill={PAL.leaf} {...stroke()} />
      <path d="M-40 -380 q 20 -16 40 0 M40 -300 q 16 -12 30 0" fill="none" {...stroke(LINE * 0.7, PAL.leafDeep)} />
    </g>
  </g>
);

export const Bush: React.FC<At> = (a) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={closedPath([[-120, 0], [-130, -50], [-80, -100], [-20, -110], [40, -120], [100, -80], [130, -30], [120, 0]])} fill={PAL.leaf} {...stroke()} />
    <path d="M-60 -60 q 20 -18 40 0 M30 -70 q 18 -14 36 0" fill="none" {...stroke(LINE * 0.7, PAL.leafDeep)} />
  </g>
);

export const Cloud: React.FC<At> = (a) => (
  <g transform={T(a)} opacity={a.o ?? 0.9}>
    <path d={closedPath([[-110, 0], [-120, -36], [-70, -64], [-20, -90], [40, -78], [84, -50], [118, -20], [100, 4]])} fill={PAL.white} {...stroke(LINE * 0.8)} />
  </g>
);

export const Bench: React.FC<At> = (a) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobRect(-170, -150, 340, 34, 8, 111, 1.5)} fill={PAL.wood} {...stroke()} />
    <path d={wobRect(-170, -100, 340, 30, 8, 112, 1.5)} fill={PAL.wood} {...stroke()} />
    <path d="M-140 -70 L-150 0 M140 -70 L150 0 M-140 -116 L-140 -70 M140 -116 L140 -70" fill="none" {...stroke(LINE * 1.2)} />
  </g>
);

/** Zoo enclosure bars across a width. */
export const Fence: React.FC<At & { w: number; h?: number; gap?: number }> = ({ w, h = 520, gap = 70, ...a }) => {
  const bars = Math.floor(w / gap);
  return (
    <g transform={T(a)} opacity={a.o ?? 1}>
      <path d={bowLine(-w / 2, -h, w / 2, -h, 3)} {...stroke(LINE * 2.2, PAL.navy)} />
      <path d={bowLine(-w / 2, -h * 0.12, w / 2, -h * 0.12, -3)} {...stroke(LINE * 2.2, PAL.navy)} />
      {Array.from({ length: bars + 1 }, (_, i) => {
        const x = -w / 2 + i * gap + (rand(i + 5) - 0.5) * 6;
        return <path key={i} d={bowLine(x, -h - 24, x + (rand(i + 9) - 0.5) * 6, 0, (rand(i) - 0.5) * 6)} {...stroke(LINE * 1.6, PAL.navy)} />;
      })}
    </g>
  );
};

export const Log: React.FC<At> = (a) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobRect(-160, -60, 320, 60, 28, 121, 2)} fill={PAL.wood} {...stroke()} />
    <path d={wobEllipse(150, -30, 22, 30, 122, 0.05, 8)} fill={PAL.tanLight} {...stroke(LINE * 0.8)} />
    <path d="M-110 -40 q 40 8 80 0 M0 -24 q 40 8 80 0" fill="none" {...stroke(LINE * 0.6)} />
  </g>
);

/** Narrator's desk front (covers the lower body) and the mic on a boom with a pop filter. */
export const Desk: React.FC<At & { w?: number }> = ({ w = 760, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobRect(-w / 2, 0, w, 60, 10, 131, 2)} fill={PAL.woodDeep} {...stroke()} />
    <path d={wobRect(-w / 2 + 30, 56, w - 60, 520, 10, 132, 3)} fill={PAL.wood} {...stroke()} />
    <path d={bowLine(-w / 2 + 70, 140, w / 2 - 70, 140, 3)} {...stroke(LINE * 0.6)} opacity={0.4} />
  </g>
);

export const Mic: React.FC<At & { glow?: number }> = ({ glow = 0, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d="M0 0 L0 -60 L-120 -200" fill="none" {...stroke(LINE * 1.5, INK)} />
    <circle cx={0} cy={-62} r={10} fill={INK} />
    <g transform="translate(-130 -230) rotate(-30)">
      <path d={wobRect(-34, -70, 68, 120, 34, 141, 2)} fill={PAL.navy} {...stroke()} />
      {[-40, -20, 0, 20].map((y) => <path key={y} d={`M-26 ${y} L26 ${y}`} {...stroke(LINE * 0.45, '#5A6A85')} />)}
      <circle cx={0} cy={-110} r={0} />
    </g>
    <g opacity={0.9}>
      <circle cx={-205} cy={-270} r={70} fill="rgba(255,255,255,0.35)" {...stroke(LINE * 0.8)} />
      <path d="M-205 -340 L-205 -200 M-275 -270 L-135 -270" {...stroke(LINE * 0.3)} opacity={0.4} />
    </g>
    {glow > 0 && <circle cx={-160} cy={-240} r={30 + glow * 10} fill={PAL.red} opacity={0.15 * glow} />}
  </g>
);

export const Broom: React.FC<At> = (a) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d="M0 -260 L0 0" {...stroke(LINE * 1.6, PAL.woodDeep)} />
    <path d="M0 -260 L0 0" {...stroke(LINE * 0.6, PAL.wood)} />
    <path d="M-40 0 L40 0 L56 70 L-56 70Z" fill={PAL.tan} {...stroke()} />
    {[-36, -18, 0, 18, 36].map((x) => <path key={x} d={`M${x} 10 L${x * 1.3} 66`} {...stroke(LINE * 0.5)} />)}
    <path d={wobRect(-46, -10, 92, 20, 6, 151, 1)} fill={PAL.red} {...stroke(LINE * 0.8)} />
  </g>
);

export const Dustpan: React.FC<At> = (a) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d="M-70 0 L70 0 L60 -60 L-60 -60Z" fill={PAL.stone} {...stroke()} />
    <path d="M0 -60 L0 -170" {...stroke(LINE * 1.5)} />
  </g>
);

/** A small red flag on a stick; wave = phase (radians). */
export const Flag: React.FC<At & { wave?: number; plant?: number }> = ({ wave = 0, plant = 1, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <g transform={`translate(0 ${(1 - plant) * -60})`}>
      <path d="M0 0 L0 -220" {...stroke(LINE * 1.1)} />
      <path d={`M0 -220 Q 50 ${-214 + Math.sin(wave) * 12} 100 ${-200 + Math.sin(wave + 1) * 10} Q 52 ${-176 + Math.sin(wave + 2) * 10} 0 -160 Z`} fill={PAL.red} {...stroke(LINE * 0.9)} />
    </g>
    {plant > 0.9 && <path d="M-26 2 q 26 -12 52 0" fill="none" {...stroke(LINE * 0.7)} opacity={0.7} />}
  </g>
);

/** A round counter bubble with a digit (pops with `pop` 0..1). */
export const Counter: React.FC<At & { n: number; pop?: number }> = ({ n, pop = 1, ...a }) => {
  const k = clamp(pop);
  const s = (a.s ?? 1) * (k < 1 ? 0.6 + 0.55 * Math.sin(k * Math.PI * 0.75) : 1);
  return (
    <g transform={`translate(${a.x} ${a.y}) scale(${s})`} opacity={k > 0 ? 1 : 0}>
      <path d={wobEllipse(0, 0, 62, 62, 161 + n, 0.05, 10)} fill={PAL.white} {...stroke()} />
      <text x={0} y={22} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={68} fill={PAL.red}>{n}</text>
    </g>
  );
};

export const Bulb: React.FC<At & { on?: number }> = ({ on = 1, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <circle cx={0} cy={-10} r={70} fill={PAL.glow} opacity={0.8 * on} />
    {Array.from({ length: 8 }, (_, i) => {
      const r = (i / 8) * Math.PI * 2;
      return <path key={i} d={`M${Math.cos(r) * 62} ${-10 + Math.sin(r) * 62} L${Math.cos(r) * (62 + 24 * on)} ${-10 + Math.sin(r) * (62 + 24 * on)}`} {...stroke(LINE * 0.8)} opacity={on} />;
    })}
    <path d={wobEllipse(0, -18, 38, 42, 171, 0.03, 10)} fill={on > 0.5 ? PAL.white : PAL.paperDeep} {...stroke()} />
    <path d="M-16 22 L16 22 L14 44 L-14 44Z" fill={PAL.stone} {...stroke(LINE * 0.8)} />
    <path d="M-12 -18 q 6 -16 12 0 q 6 16 12 0" fill="none" {...stroke(LINE * 0.6, PAL.red)} />
  </g>
);

/** Sparkle stars around a point (t 0..1 grows and fades). */
export const Sparkles: React.FC<{ x: number; y: number; t: number; r?: number; n?: number; color?: string; seed?: number }> = ({ x, y, t, r = 90, n = 5, color = PAL.blue, seed = 1 }) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <g transform={`translate(${x} ${y})`} opacity={Math.sin(t * Math.PI)}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + rand(seed + i) * 0.8;
        const d = r * (0.6 + 0.6 * t) * (0.7 + rand(seed * 3 + i) * 0.5);
        const s = 10 + rand(seed * 7 + i) * 10;
        return <path key={i} transform={`translate(${Math.cos(a) * d} ${Math.sin(a) * d})`} d={`M0 ${-s} Q2 -2 ${s} 0 Q2 2 0 ${s} Q-2 2 ${-s} 0 Q-2 -2 0 ${-s}Z`} fill={color} />;
      })}
    </g>
  );
};

/** Speed/motion lines behind a moving thing (angle in degrees, the direction of motion). */
export const SpeedLines: React.FC<{ x: number; y: number; ang: number; len?: number; o?: number }> = ({ x, y, ang, len = 90, o = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${ang + 180})`} opacity={o}>
    {[-26, 0, 26].map((dy, i) => <path key={i} d={`M${30 + i * 8} ${dy} L${30 + len - i * 14} ${dy}`} {...stroke(LINE * 0.8)} />)}
  </g>
);

/** Small dust puff on landing (t 0..1). */
export const Puff: React.FC<{ x: number; y: number; t: number; s?: number }> = ({ x, y, t, s = 1 }) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={1 - t}>
      {[-1, 1].map((k) => <path key={k} d={wobEllipse(k * (24 + t * 50), -10 - t * 16, 18 + t * 10, 12 + t * 6, 181 + k, 0.1, 8)} fill={PAL.white} {...stroke(LINE * 0.6)} />)}
    </g>
  );
};

/** A small spit droplet (kept small and clean-looking on purpose). */
export const Droplet: React.FC<At> = (a) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d="M0 -16 Q 12 0 0 8 Q -12 0 0 -16Z" fill={PAL.blueSoft} {...stroke(LINE * 0.6, PAL.blue)} />
  </g>
);

/** A soft round glow (for warm, sincere beats). */
export const Glow: React.FC<{ x: number; y: number; r: number; o?: number; color?: string }> = ({ x, y, r, o = 1, color = PAL.glow }) => (
  <g opacity={o}>
    <circle cx={x} cy={y} r={r} fill={color} opacity={0.55} />
    <circle cx={x} cy={y} r={r * 0.65} fill={color} opacity={0.6} />
  </g>
);

/** Paving: a ground band with a few hand-drawn joints. */
export const Pavement: React.FC<{ y: number; w?: number; x?: number; color?: string; seed?: number }> = ({ y, w = 2400, x = -660, color = PAL.paperDeep, seed = 1 }) => (
  <g>
    <rect x={x} y={y} width={w} height={1400} fill={color} />
    <path d={bowLine(x, y, x + w, y, 3)} {...stroke()} />
    {Array.from({ length: 14 }, (_, i) => {
      const xx = x + 120 + i * 180 + (rand(seed + i) - 0.5) * 40;
      return <path key={i} d={bowLine(xx, y + 60 + (i % 2) * 90, xx + 60, y + 60 + (i % 2) * 90, 2)} {...stroke(LINE * 0.6)} opacity={0.35} />;
    })}
  </g>
);
