import React, { useId } from 'react';
import { C } from '../theme';

export const INK = { stroke: C.ivory, strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/** One pincer pointing up from (0,0). open: 0 closed … 1 wide. */
export const Pincer: React.FC<{ fill: string; open: number; s?: number }> = ({ fill, open, s = 1 }) => (
  <g transform={`scale(${s})`}>
    <ellipse cx={0} cy={-22} rx={22} ry={27} fill={fill} {...INK} />
    <path d="M -10 -30 Q -4 -36 4 -32" fill="none" stroke={C.ivory} strokeWidth={3} opacity={0.5} />
    <path d="M -14 -40 C -26 -62 -16 -84 -2 -92 C -6 -74 -4 -58 2 -44 Z" fill={fill} {...INK} />
    <g transform={`rotate(${8 + open * 34} 12 -40)`}>
      <path d="M 14 -40 C 26 -58 22 -78 8 -88 C 10 -72 6 -56 0 -46 Z" fill={fill} {...INK} />
    </g>
  </g>
);

export type Mood = 'calm' | 'worried' | 'determined' | 'happy' | 'shock' | 'grumpy';
type Pt = [number, number];

export type CrabProps = {
  x: number; y: number; rot?: number; s?: number; color?: string; shade?: string;
  legPhase?: number; legMode?: 'walk' | 'climb' | 'dangle';
  clawL?: number; clawR?: number; raise?: number;
  reachL?: Pt | null; reachR?: Pt | null; hideArmL?: boolean; hideArmR?: boolean;
  mood?: Mood; blink?: number; look?: Pt; stretch?: number; opacity?: number; shadow?: number;
};

const shoulder = (side: number): Pt => [side * 40, -30];

/** Arm from shoulder to a point (local coords), elbow bent outward, pincer along the forearm. */
const Arm: React.FC<{ side: number; to: Pt; color: string; open: number }> = ({ side, to, color, open }) => {
  const [sx, sy] = shoulder(side);
  const mx = (sx + to[0]) / 2;
  const my = (sy + to[1]) / 2;
  const len = Math.hypot(to[0] - sx, to[1] - sy) || 1;
  const bend = Math.max(0, 70 - len * 0.35);
  const ex = mx + side * bend * Math.abs((to[1] - sy) / len) + 0;
  const ey = my - bend * 0.3;
  const ang = (Math.atan2(to[1] - ey, to[0] - ex) * 180) / Math.PI + 90;
  return (
    <g>
      <path d={`M ${sx} ${sy} L ${ex} ${ey} L ${to[0]} ${to[1]}`} fill="none" stroke={C.ivory} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${sx} ${sy} L ${ex} ${ey} L ${to[0]} ${to[1]}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${to[0]} ${to[1]}) rotate(${ang}) translate(0 18) scale(${side} 1)`}>
        <Pincer fill={color} open={open} s={0.82} />
      </g>
    </g>
  );
};

const Brow: React.FC<{ side: number; mood: Mood }> = ({ side, mood }) => {
  const x = side * 22;
  const y = -98;
  const tilt: Record<Mood, number> = { calm: 0, happy: -6, worried: 16, determined: -18, shock: 0, grumpy: -26 };
  const lift = mood === 'shock' ? -10 : mood === 'happy' ? -4 : 0;
  const t = tilt[mood] * side;
  if (mood === 'calm') return null;
  return <path d={`M ${x - 14} ${y + lift} L ${x + 14} ${y + lift}`} transform={`rotate(${t} ${x} ${y + lift})`} stroke={C.ivory} strokeWidth={6} strokeLinecap="round" />;
};

const Mouth: React.FC<{ mood: Mood; shade: string }> = ({ mood, shade }) => {
  const st = { fill: 'none', stroke: shade, strokeWidth: 5, strokeLinecap: 'round' as const };
  switch (mood) {
    case 'happy': return <path d="M -22 14 Q 0 36 22 14" {...st} />;
    case 'worried': return <path d="M -18 24 Q -9 16 0 24 Q 9 32 18 24" {...st} />;
    case 'determined': return <path d="M -16 22 L 16 20" {...st} />;
    case 'shock': return <ellipse cx={0} cy={22} rx={9} ry={12} fill={shade} />;
    case 'grumpy': return <path d="M -18 28 Q 0 14 18 28" {...st} />;
    default: return <path d="M -18 20 Q 0 30 18 20" {...st} />;
  }
};

/** The hero (and, in red, the others). Facing the viewer, claws up. */
export const Crab: React.FC<CrabProps> = ({
  x, y, rot = 0, s = 1, color = C.blue, shade = C.blueDeep, legPhase = 0, legMode = 'walk',
  clawL = 0.3, clawR = 0.3, raise = 0.3, reachL = null, reachR = null, hideArmL = false, hideArmR = false,
  mood = 'calm', blink = 0, look = [0, 0], stretch = 0, opacity = 1, shadow = 0,
}) => {
  const id = useId().replace(/:/g, '');
  const legs: React.ReactNode[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const w = Math.sin(legPhase + i * 1.25 + (side > 0 ? Math.PI : 0)) * 11;
      const hip: Pt = [side * 56, -4 + i * 17];
      let knee: Pt = [side * 98, -22 + i * 25 + w];
      let foot: Pt = [side * 122, 10 + i * 30 + w * 0.6];
      if (legMode === 'climb') { knee = [side * 96, -40 + i * 26 + w]; foot = [side * 112, -12 + i * 34 + w * 0.8]; }
      if (legMode === 'dangle') { knee = [side * 84, 18 + i * 20 + w * 0.5]; foot = [side * 90, 60 + i * 22 + w * 0.5]; }
      legs.push(
        <g key={`${side}${i}`}>
          <path d={`M ${hip[0]} ${hip[1]} L ${knee[0]} ${knee[1]} L ${foot[0]} ${foot[1]}`} fill="none" stroke={C.ivory} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M ${hip[0]} ${hip[1]} L ${knee[0]} ${knee[1]} L ${foot[0]} ${foot[1]}`} fill="none" stroke={shade} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </g>,
      );
    }
  }
  const defaultHand = (side: number): Pt => [side * (80 + raise * 6), -96 - raise * 34];
  const sx = 1 - stretch * 0.35;
  const sy = 1 + stretch;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={opacity}>
      {shadow > 0 && <ellipse cx={0} cy={88} rx={120} ry={18} fill="#000" opacity={0.25 * shadow} />}
      <g transform={`scale(${sx} ${sy})`}>
        {legs}
        {!hideArmL && <Arm side={-1} to={reachL ?? defaultHand(-1)} color={color} open={clawL} />}
        {!hideArmR && <Arm side={1} to={reachR ?? defaultHand(1)} color={color} open={clawR} />}
        {[-1, 1].map((side) => (
          <path key={side} d={`M ${side * 16} -40 L ${side * 22} -72`} stroke={C.ivory} strokeWidth={7} strokeLinecap="round" />
        ))}
        <path d="M -76 6 C -76 -40 -40 -56 0 -56 C 40 -56 76 -40 76 6 C 76 38 40 52 0 52 C -40 52 -76 38 -76 6 Z" fill={color} {...INK} strokeWidth={6} />
        <path d="M -66 18 C -50 44 50 44 66 18 C 50 52 -50 52 -66 18 Z" fill={shade} opacity={0.55} />
        <path d="M -46 -32 C -28 -44 -8 -46 12 -44" fill="none" stroke={C.ivory} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
        {[[-40, -8, 7], [34, -16, 6], [46, 8, 4.5], [-22, -24, 4]].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={C.ivory} opacity={0.22} />
        ))}
        <Mouth mood={mood} shade={shade} />
        {[-1, 1].map((side) => (
          <g key={side} transform={`translate(${side * 22} -78)`}>
            <clipPath id={`eye${id}${side}`}><circle r={14} /></clipPath>
            <circle r={14} fill={C.paper} stroke={C.ink} strokeWidth={3} />
            <g clipPath={`url(#eye${id}${side})`}>
              <circle cx={look[0] * 5} cy={look[1] * 5 + 1} r={mood === 'shock' ? 4 : 6.5} fill={C.ink} />
              <circle cx={look[0] * 5 + 2.5} cy={look[1] * 5 - 2} r={2} fill={C.paper} />
              {blink > 0 && <rect x={-16} y={-16} width={32} height={32 * blink} fill={color} />}
              {(mood === 'grumpy' || mood === 'determined') && <rect x={-16} y={-16} width={32} height={9} fill={color} />}
            </g>
            <circle r={14} fill="none" stroke={C.ink} strokeWidth={3} />
          </g>
        ))}
        {[-1, 1].map((side) => <Brow key={side} side={side} mood={mood} />)}
      </g>
    </g>
  );
};

/** A claw arm rising from a hidden body (below a rim or a frame edge). */
export const ClawArm: React.FC<{ bx: number; by: number; tx: number; ty: number; open?: number; bend?: number; opacity?: number; s?: number; color?: string }> = ({ bx, by, tx, ty, open = 0.6, bend = 40, opacity = 1, s = 1, color = C.red }) => {
  const mx = (bx + tx) / 2;
  const my = (by + ty) / 2;
  const len = Math.hypot(tx - bx, ty - by) || 1;
  const cx = mx + (-(ty - by) / len) * bend;
  const cy = my + ((tx - bx) / len) * bend;
  const ang = (Math.atan2(ty - cy, tx - cx) * 180) / Math.PI + 90;
  const d = `M ${bx} ${by} Q ${cx} ${cy} ${tx} ${ty}`;
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={C.ivory} strokeWidth={28 * s} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={19 * s} strokeLinecap="round" />
      <path d={d} fill="none" stroke={C.redDeep} strokeWidth={4 * s} strokeLinecap="round" strokeDasharray={`${3 * s} ${22 * s}`} />
      <g transform={`translate(${tx} ${ty}) rotate(${ang}) translate(0 ${20 * s})`}>
        <Pincer fill={color} open={open} s={1.1 * s} />
      </g>
    </g>
  );
};

/** A world point as the crab's own arm target (undoes its position, rotation, scale and stretch). */
export const reach = (c: { x: number; y: number; rot?: number; s?: number; stretch?: number }, p: Pt): Pt => {
  const a = (-(c.rot ?? 0) * Math.PI) / 180;
  const dx = p[0] - c.x;
  const dy = p[1] - c.y;
  const rx = dx * Math.cos(a) - dy * Math.sin(a);
  const ry = dx * Math.sin(a) + dy * Math.cos(a);
  const s = c.s ?? 1;
  const st = c.stretch ?? 0;
  return [rx / s / (1 - st * 0.35), ry / s / (1 + st)];
};
