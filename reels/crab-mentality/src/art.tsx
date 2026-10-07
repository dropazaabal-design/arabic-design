import React from 'react';
import { C } from './theme';

const INK = { stroke: C.ivory, strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/** One pincer, pointing up from (0,0). open: 0 closed … 1 wide. */
const Pincer: React.FC<{ fill: string; open: number; s?: number }> = ({ fill, open, s = 1 }) => (
  <g transform={`scale(${s})`}>
    <ellipse cx={0} cy={-22} rx={22} ry={27} fill={fill} {...INK} />
    <path d="M -14 -40 C -26 -62 -16 -84 -2 -92 C -6 -74 -4 -58 2 -44 Z" fill={fill} {...INK} />
    <g transform={`rotate(${8 + open * 34} 12 -40)`}>
      <path d="M 14 -40 C 26 -58 22 -78 8 -88 C 10 -72 6 -56 0 -46 Z" fill={fill} {...INK} />
    </g>
  </g>
);

export type CrabProps = {
  x: number; y: number; rot?: number; s?: number; color?: string;
  legPhase?: number; clawOpen?: number; armRaise?: number; look?: number; opacity?: number; flipY?: boolean;
};

/** The crab. Facing the viewer, claws up — the climbing pose. */
export const Crab: React.FC<CrabProps> = ({ x, y, rot = 0, s = 1, color = C.blue, legPhase = 0, clawOpen = 0.3, armRaise = 0, look = 0, opacity = 1 }) => {
  const legs = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const w = Math.sin(legPhase + i * 1.25 + (side > 0 ? Math.PI : 0)) * 11;
      const hip = [side * 56, -4 + i * 17];
      const knee = [side * 98, -22 + i * 25 + w];
      const foot = [side * 122, 10 + i * 30 + w * 0.6];
      legs.push(
        <path key={`${side}${i}`} d={`M ${hip[0]} ${hip[1]} L ${knee[0]} ${knee[1]} L ${foot[0]} ${foot[1]}`} fill="none" stroke={C.ivory} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />,
      );
    }
  }
  const arm = (side: number) => {
    const elbow = [side * (74 + armRaise * 6), -76 - armRaise * 18];
    const hand = [side * (80 + armRaise * 4), -100 - armRaise * 30];
    return (
      <g key={side}>
        <path d={`M ${side * 38} -34 L ${elbow[0]} ${elbow[1]} L ${hand[0]} ${hand[1]}`} fill="none" stroke={C.ivory} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        <g transform={`translate(${hand[0]} ${hand[1]}) rotate(${side * (12 + armRaise * 8)}) scale(${side} 1)`}>
          <Pincer fill={color} open={clawOpen} s={0.82} />
        </g>
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={opacity}>
      {legs}
      {arm(-1)}
      {arm(1)}
      {[-1, 1].map((side) => (
        <path key={side} d={`M ${side * 16} -40 L ${side * 22} -70`} stroke={C.ivory} strokeWidth={6} strokeLinecap="round" />
      ))}
      <path d="M -74 4 C -74 -40 -40 -54 0 -54 C 40 -54 74 -40 74 4 C 74 36 40 50 0 50 C -40 50 -74 36 -74 4 Z" fill={color} {...INK} strokeWidth={6} />
      <path d="M -44 -30 C -26 -42 -6 -44 12 -42" fill="none" stroke={C.ivory} strokeWidth={5} strokeLinecap="round" opacity={0.55} />
      <path d="M -20 22 Q 0 32 20 22" fill="none" stroke={C.bg} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${side * 22} -76)`}>
          <circle r={13} fill={C.ivory} stroke={C.bg} strokeWidth={3} />
          <circle cx={look * 5} cy={1} r={5.5} fill={C.bg} />
        </g>
      ))}
    </g>
  );
};

/** The red pulling force: an arm rising from below, pincer at its tip. */
export const RedClaw: React.FC<{ bx: number; by: number; tx: number; ty: number; open?: number; bend?: number; opacity?: number; s?: number }> = ({ bx, by, tx, ty, open = 0.6, bend = 40, opacity = 1, s = 1 }) => {
  const mx = (bx + tx) / 2;
  const my = (by + ty) / 2;
  const len = Math.hypot(tx - bx, ty - by) || 1;
  const nx = -(ty - by) / len;
  const ny = (tx - bx) / len;
  const cx = mx + nx * bend;
  const cy = my + ny * bend;
  const ang = (Math.atan2(ty - cy, tx - cx) * 180) / Math.PI + 90;
  const d = `M ${bx} ${by} Q ${cx} ${cy} ${tx} ${ty}`;
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={C.ivory} strokeWidth={30 * s} strokeLinecap="round" />
      <path d={d} fill="none" stroke={C.red} strokeWidth={21 * s} strokeLinecap="round" />
      <path d={d} fill="none" stroke={C.ivory} strokeWidth={3} strokeLinecap="round" strokeDasharray="2 26" opacity={0.6} />
      <g transform={`translate(${tx} ${ty}) rotate(${ang})`}>
        <Pincer fill={C.red} open={open} s={1.15 * s} />
      </g>
    </g>
  );
};

export type VesselShape = { cx: number; rimY: number; rx: number; ry: number; botY: number; botHalf: number };
export const BUCKET: VesselShape = { cx: 540, rimY: 920, rx: 290, ry: 58, botY: 1380, botHalf: 220 };
export const CUP: VesselShape = { cx: 320, rimY: 1010, rx: 185, ry: 40, botY: 1330, botHalf: 135 };
export const lerpShape = (a: VesselShape, b: VesselShape, p: number): VesselShape => ({
  cx: a.cx + (b.cx - a.cx) * p, rimY: a.rimY + (b.rimY - a.rimY) * p, rx: a.rx + (b.rx - a.rx) * p,
  ry: a.ry + (b.ry - a.ry) * p, botY: a.botY + (b.botY - a.botY) * p, botHalf: a.botHalf + (b.botHalf - a.botHalf) * p,
});

/** Inside of the vessel: the dark opening, and an optional red glow from within. */
export const VesselBack: React.FC<{ v: VesselShape; glow?: number }> = ({ v, glow = 0 }) => (
  <g>
    <defs>
      <radialGradient id="innerGlow" cx="50%" cy="60%" r="60%">
        <stop offset="0%" stopColor={C.red} stopOpacity={0.55} />
        <stop offset="100%" stopColor={C.red} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={v.cx} cy={v.rimY} rx={v.rx} ry={v.ry} fill={C.bgDeep} stroke={C.ivory} strokeWidth={6} />
    <ellipse cx={v.cx} cy={v.rimY + v.ry * 0.2} rx={v.rx * 0.9} ry={v.ry * 0.7} fill="url(#innerGlow)" opacity={glow} />
  </g>
);

/** Front wall. cup: 0 bucket … 1 coffee cup (handle, band, colour). */
export const VesselFront: React.FC<{ v: VesselShape; cup?: number }> = ({ v, cup = 0 }) => {
  const { cx, rimY, rx, ry, botY, botHalf } = v;
  const body = `M ${cx - rx} ${rimY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${rimY} L ${cx + botHalf} ${botY} Q ${cx} ${botY + ry * 0.75} ${cx - botHalf} ${botY} Z`;
  const band = (t: number) => {
    const y = rimY + (botY - rimY) * t;
    const half = rx + (botHalf - rx) * t;
    return `M ${cx - half} ${y} Q ${cx} ${y + ry * 1.3} ${cx + half} ${y}`;
  };
  const fill = cup > 0.5 ? C.ivory : C.metal;
  return (
    <g>
      {cup > 0 && (
        <path d={`M ${cx - rx * 0.92} ${rimY + (botY - rimY) * 0.2} C ${cx - rx * 1.6} ${rimY + (botY - rimY) * 0.15} ${cx - rx * 1.6} ${rimY + (botY - rimY) * 0.75} ${cx - botHalf * 1.02} ${rimY + (botY - rimY) * 0.7}`}
          fill="none" stroke={C.ivory} strokeWidth={14} strokeLinecap="round" opacity={cup} />
      )}
      <path d={body} fill={fill} {...INK} strokeWidth={6} />
      <path d={band(0.22)} fill="none" stroke={cup > 0.5 ? C.blue : C.ivory} strokeWidth={cup > 0.5 ? 16 : 5} opacity={cup > 0.5 ? 1 : 0.45} />
      <path d={band(0.78)} fill="none" stroke={C.ivory} strokeWidth={5} opacity={0.45 * (1 - cup)} />
      {[0.35, 0.5, 0.65].map((t, i) => (
        <path key={i} d={`M ${cx - rx * 0.62 + i * 26} ${rimY + (botY - rimY) * t} l -18 34`} stroke={C.ivory} strokeWidth={4} strokeLinecap="round" opacity={0.25 * (1 - cup)} />
      ))}
      <path d={`M ${cx - rx} ${rimY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${rimY}`} fill="none" stroke={C.ivory} strokeWidth={9} strokeLinecap="round" />
    </g>
  );
};

export const Steam: React.FC<{ x: number; y: number; draw: number; t: number }> = ({ x, y, draw, t }) => (
  <g>
    {[-40, 0, 40].map((dx, i) => {
      const w = Math.sin(t / 9 + i) * 8;
      return (
        <path key={i} d={`M ${x + dx} ${y} C ${x + dx - 22 + w} ${y - 40} ${x + dx + 22 - w} ${y - 80} ${x + dx + w} ${y - 120}`}
          fill="none" stroke={C.ivory} strokeWidth={6} strokeLinecap="round" opacity={0.7}
          pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
      );
    })}
  </g>
);

/** Ladder standing at (x, y) (bottom centre), rotated about its foot. */
export const Ladder: React.FC<{
  x: number; y: number; h: number; rot?: number; rungs: number; total?: number; color?: string;
  broken?: number | null; fix?: number; glow?: number; opacity?: number; railGrow?: number;
}> = ({ x, y, h, rot = 0, rungs, total = 5, color = C.blue, broken = null, fix = 1, glow = 0, opacity = 1, railGrow = 1 }) => {
  const half = 58;
  const railH = h * railGrow;
  const items = [];
  for (let i = 0; i < total; i++) {
    const vis = Math.max(0, Math.min(1, rungs - i));
    if (vis <= 0) continue;
    const ry = -h * ((i + 0.7) / (total + 0.4));
    if (-ry > railH) continue;
    if (broken === i && fix < 1) {
      items.push(
        <g key={i} opacity={vis}>
          <path d={`M ${-half} ${ry} L -6 ${ry + 22 * (1 - fix)}`} stroke={color} strokeWidth={14} strokeLinecap="round" />
          <path d={`M ${half} ${ry} L 6 ${ry + 30 * (1 - fix)}`} stroke={color} strokeWidth={14} strokeLinecap="round" />
        </g>,
      );
    } else {
      items.push(
        <g key={i} opacity={vis}>
          <path d={`M ${-half} ${ry} L ${half} ${ry}`} stroke={C.ivory} strokeWidth={20} strokeLinecap="round" />
          <path d={`M ${-half} ${ry} L ${half} ${ry}`} stroke={color} strokeWidth={13} strokeLinecap="round" />
        </g>,
      );
    }
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
      {glow > 0 && <rect x={-half - 34} y={-railH - 20} width={half * 2 + 68} height={railH + 40} rx={40} fill={C.blue} opacity={0.18 * glow} />}
      {[-half, half].map((rx) => (
        <g key={rx}>
          <path d={`M ${rx} 0 L ${rx} ${-railH}`} stroke={C.ivory} strokeWidth={22} strokeLinecap="round" />
          <path d={`M ${rx} 0 L ${rx} ${-railH}`} stroke={color} strokeWidth={14} strokeLinecap="round" />
        </g>
      ))}
      {items}
    </g>
  );
};

export const Wrench: React.FC<{ x: number; y: number; rot: number; opacity?: number }> = ({ x, y, rot, opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
    <path d="M -10 0 L -10 120 Q 0 134 10 120 L 10 0 Z" fill={C.blue} {...INK} />
    <path d="M -34 -30 C -40 6 -20 18 0 18 C 20 18 40 6 34 -30 L 16 -14 L 16 -34 L -16 -34 L -16 -14 Z" fill={C.blue} {...INK} />
  </g>
);

export const Lock: React.FC<{ x: number; y: number; s?: number; opacity?: number }> = ({ x, y, s = 1, opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
    <path d="M -34 -6 L -34 -40 C -34 -84 34 -84 34 -40 L 34 -6" fill="none" stroke={C.ivory} strokeWidth={14} strokeLinecap="round" />
    <rect x={-56} y={-10} width={112} height={92} rx={18} fill={C.blue} {...INK} strokeWidth={6} />
    <circle cx={0} cy={28} r={11} fill={C.ivory} />
    <path d="M 0 30 L 0 56" stroke={C.ivory} strokeWidth={8} strokeLinecap="round" />
  </g>
);

/** Speech bubble shape; the words are laid out in HTML on top (RTL shaping). */
export const BubbleShape: React.FC<{ x: number; y: number; w: number; h: number; tail?: 'down' | 'none'; fill?: string; tailX?: number; scale?: number; rot?: number; opacity?: number }> = ({ x, y, w, h, tail = 'down', fill = C.red, tailX = 0, scale = 1, rot = 0, opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={opacity}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.42} fill={fill} {...INK} strokeWidth={6} />
    {tail === 'down' && <path d={`M ${tailX - 26} ${h / 2 - 4} L ${tailX + 8} ${h / 2 + 46} L ${tailX + 30} ${h / 2 - 4}`} fill={fill} stroke={C.ivory} strokeWidth={6} strokeLinejoin="round" />}
    {tail === 'down' && <path d={`M ${tailX - 22} ${h / 2 - 3} L ${tailX + 26} ${h / 2 - 3}`} stroke={fill} strokeWidth={8} />}
  </g>
);

export const TalkDots: React.FC<{ x: number; y: number; fill: string; scale?: number; opacity?: number }> = ({ x, y, fill, scale = 1, opacity = 1 }) => (
  <g opacity={opacity}>
    <BubbleShape x={x} y={y} w={190} h={110} fill={fill} scale={scale} />
    {[-44, 0, 44].map((dx) => <circle key={dx} cx={x + dx * scale} cy={y} r={11 * scale} fill={C.ivory} />)}
  </g>
);

export const Check: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => (
  <path d={`M ${x - 26} ${y} L ${x - 6} ${y + 20} L ${x + 30} ${y - 22}`} fill="none" stroke={C.ivory} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
);

export const MotionLines: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => (
  <g opacity={1 - p}>
    {[-60, -20, 20, 60].map((dx, i) => (
      <path key={i} d={`M ${x + dx} ${y - 10 - p * 50} l ${dx * 0.15} -${36}`} stroke={C.ivory} strokeWidth={6} strokeLinecap="round" />
    ))}
  </g>
);
