import React from 'react';
import { INK, PAL, clamp, lerp, stroke } from './ink';

// Faces are drawn from a few independent controls, so any expression can blink, look around and talk:
//   expression → eye shape, brows, mouth shape, blush, sweat
//   blink 0..1 → eyelids close (any open-eyed shape)
//   look [x, y] -1..1 → features slide across the head (a head turn without redrawing the head)
//   talk 0..1 → the expression's mouth opens (from the voice envelope, per frame)

export type EyeShape = 'open' | 'wide' | 'half' | 'happy' | 'closed' | 'squint' | 'down';
export type MouthShape = 'smile' | 'grin' | 'flat' | 'o' | 'frown' | 'wavy' | 'smirk' | 'pucker' | 'chew';
export type Expression = {
  eyes: EyeShape;
  /** brows: [left angle, right angle] in degrees (+ = inner end down, cross), lift in px (+ = up) */
  brow: [number, number];
  lift: [number, number];
  mouth: MouthShape;
  blush?: number;
  sweat?: number;
  /** one eye can differ (skeptical): applied to the screen-right eye */
  eyeR?: EyeShape;
};

const E = (eyes: EyeShape, brow: [number, number], lift: [number, number], mouth: MouthShape, extra: Partial<Expression> = {}): Expression => ({ eyes, brow, lift, mouth, ...extra });

/** The six required expressions plus the extra ones this reel needs. */
export const EXPRESSIONS = {
  neutral: E('open', [0, 0], [0, 0], 'flat'),
  curious: E('open', [-4, -16], [2, 16], 'o'),
  surprised: E('wide', [-10, -10], [20, 20], 'o'),
  skeptical: E('open', [14, -10], [-4, 12], 'smirk', { eyeR: 'half' }),
  embarrassed: E('down', [-18, -18], [6, 6], 'wavy', { blush: 1, sweat: 1 }),
  satisfied: E('happy', [-4, -4], [8, 8], 'smile'),
  // extras
  laugh: E('happy', [-8, -8], [12, 12], 'grin'),
  smug: E('half', [6, -8], [0, 10], 'smirk'),
  tender: E('happy', [-12, -12], [10, 10], 'smile', { blush: 0.6 }),
  tired: E('half', [-14, -14], [2, 2], 'frown', { sweat: 1 }),
  disgusted: E('squint', [16, 16], [-6, -6], 'wavy'),
  chewing: E('happy', [-4, -4], [6, 6], 'chew'),
  determined: E('open', [12, 12], [-2, -2], 'flat'),
  puckered: E('half', [8, 8], [0, 0], 'pucker'),
} satisfies Record<string, Expression>;
export type ExprName = keyof typeof EXPRESSIONS;

/** Blend two expressions: shapes switch at the midpoint, numbers interpolate. */
export const mixExpr = (a: Expression, b: Expression, t: number): Expression => {
  const k = clamp(t);
  const pick = <T,>(x: T, y: T) => (k < 0.5 ? x : y);
  return {
    eyes: pick(a.eyes, b.eyes),
    eyeR: pick(a.eyeR, b.eyeR),
    mouth: pick(a.mouth, b.mouth),
    brow: [lerp(a.brow[0], b.brow[0], k), lerp(a.brow[1], b.brow[1], k)],
    lift: [lerp(a.lift[0], b.lift[0], k), lerp(a.lift[1], b.lift[1], k)],
    blush: lerp(a.blush ?? 0, b.blush ?? 0, k),
    sweat: lerp(a.sweat ?? 0, b.sweat ?? 0, k),
  };
};

const Eye: React.FC<{ shape: EyeShape; r: number; blink: number; px: number; py: number }> = ({ shape, r, blink, px, py }) => {
  const sw = r * 0.42;
  if (shape === 'happy') return <path d={`M${-r} ${r * 0.35} Q0 ${-r * 1.0} ${r} ${r * 0.35}`} fill="none" {...stroke(sw)} />;
  if (shape === 'closed' || blink > 0.85) return <path d={`M${-r} 0 Q0 ${r * 0.45} ${r} 0`} fill="none" {...stroke(sw)} />;
  if (shape === 'squint') return <path d={`M${-r} ${-r * 0.5} L${r * 0.6} 0 L${-r} ${r * 0.5}`} fill="none" {...stroke(sw * 0.9)} />;
  const open = 1 - 0.88 * clamp(blink / 0.85);
  if (shape === 'wide') {
    return (
      <g transform={`scale(1 ${open})`}>
        <ellipse cx={0} cy={0} rx={r * 1.25} ry={r * 1.4} fill={PAL.white} {...stroke(sw * 0.7)} />
        <circle cx={px * r * 0.5} cy={py * r * 0.5} r={r * 0.48} fill={INK} />
      </g>
    );
  }
  const ry = r * (shape === 'half' ? 0.62 : shape === 'down' ? 0.8 : 1.15);
  const dy = shape === 'down' ? r * 0.35 : shape === 'half' ? r * 0.2 : 0;
  return (
    <g transform={`translate(${px * r * 0.35} ${py * r * 0.3 + dy}) scale(1 ${open})`}>
      <ellipse cx={0} cy={0} rx={r * 0.78} ry={ry} fill={INK} />
      <circle cx={-r * 0.22} cy={-ry * 0.38} r={r * 0.24} fill={PAL.white} />
      {shape === 'half' && <path d={`M${-r * 1.05} ${-ry * 0.25} L${r * 1.05} ${-ry * 0.25}`} {...stroke(sw * 0.9)} />}
    </g>
  );
};

const mouthPath = (shape: MouthShape, w: number, o: number): { d: string; fill: boolean; tongue?: string } => {
  const h = w / 2;
  switch (shape) {
    case 'grin':
    case 'smile': {
      const open = shape === 'grin' ? Math.max(0.55, o) : o;
      if (open < 0.08) return { d: `M${-h} 0 Q0 ${w * 0.42} ${h} 0`, fill: false };
      const depth = w * (0.18 + open * 0.5);
      return { d: `M${-h} 0 Q0 ${w * 0.06} ${h} 0 Q${h * 0.7} ${depth * 1.25} 0 ${depth * 1.25} Q${-h * 0.7} ${depth * 1.25} ${-h} 0Z`, fill: true, tongue: `M${-h * 0.45} ${depth * 1.05} Q0 ${depth * 0.55} ${h * 0.45} ${depth * 1.05} Q0 ${depth * 1.3} ${-h * 0.45} ${depth * 1.05}Z` };
    }
    case 'frown':
      if (o < 0.08) return { d: `M${-h * 0.8} ${w * 0.16} Q0 ${-w * 0.2} ${h * 0.8} ${w * 0.16}`, fill: false };
      return { d: `M${-h * 0.7} ${w * 0.2} Q0 ${-w * (0.15 + o * 0.3)} ${h * 0.7} ${w * 0.2} Q0 ${w * 0.28} ${-h * 0.7} ${w * 0.2}Z`, fill: true };
    case 'o': {
      const rx = w * (0.16 + o * 0.08), ry = w * (0.2 + o * 0.16);
      return { d: `M${-rx} 0 A${rx} ${ry} 0 1 0 ${rx} 0 A${rx} ${ry} 0 1 0 ${-rx} 0Z`, fill: true };
    }
    case 'wavy':
      if (o < 0.08) return { d: `M${-h} 0 Q${-h / 2} ${-w * 0.14} 0 0 Q${h / 2} ${w * 0.14} ${h} 0`, fill: false };
      return { d: `M${-h * 0.6} 0 Q0 ${-w * 0.1} ${h * 0.6} 0 Q0 ${w * (0.12 + o * 0.35)} ${-h * 0.6} 0Z`, fill: true };
    case 'smirk':
      if (o < 0.08) return { d: `M${-h * 0.8} ${w * 0.08} Q${h * 0.1} ${w * 0.16} ${h * 0.85} ${-w * 0.14}`, fill: false };
      return { d: `M${-h * 0.7} ${w * 0.04} Q${h * 0.2} ${-w * 0.02} ${h * 0.8} ${-w * 0.12} Q${h * 0.3} ${w * (0.18 + o * 0.35)} ${-h * 0.7} ${w * 0.04}Z`, fill: true };
    case 'pucker':
      return { d: `M${-w * 0.12} 0 A${w * 0.12} ${w * 0.1} 0 1 0 ${w * 0.12} 0 A${w * 0.12} ${w * 0.1} 0 1 0 ${-w * 0.12} 0Z`, fill: false };
    case 'chew': {
      const k = w * (0.12 + o * 0.12);
      return { d: `M${-h * 0.75} 0 Q0 ${k} ${h * 0.75} 0`, fill: false };
    }
    case 'flat':
    default:
      if (o < 0.08) return { d: `M${-h * 0.75} ${w * 0.02} Q0 ${w * 0.1} ${h * 0.75} ${w * 0.02}`, fill: false };
      return { d: `M${-h * 0.65} 0 Q0 ${w * 0.04} ${h * 0.65} 0 Q${h * 0.5} ${w * (0.12 + o * 0.45)} 0 ${w * (0.12 + o * 0.45)} Q${-h * 0.5} ${w * (0.12 + o * 0.45)} ${-h * 0.65} 0Z`, fill: true, tongue: `M${-h * 0.3} ${w * (0.1 + o * 0.38)} Q0 ${w * (0.02 + o * 0.25)} ${h * 0.3} ${w * (0.1 + o * 0.38)}Z` };
  }
};

export type FaceProps = {
  rx: number;
  ry: number;
  expr: Expression;
  blink?: number;
  look?: [number, number];
  talk?: number;
  /** pupils glance within the eye (independent of the head turn) */
  glance?: [number, number];
  mouthY?: number;
};

/** Eyes, brows, mouth, blush and sweat, centred on the head's centre. */
export const Face: React.FC<FaceProps> = ({ rx, ry, expr, blink = 0, look = [0, 0], talk = 0, glance = [0, 0], mouthY = 0.42 }) => {
  const fx = look[0] * rx * 0.3, fy = look[1] * ry * 0.16;
  const spread = rx * 0.36 * (1 - Math.abs(look[0]) * 0.18);
  const r = rx * 0.135;
  const eyeY = -ry * 0.04;
  const nearL = 1 + Math.min(0, look[0]) * -0.08, nearR = 1 + Math.max(0, look[0]) * 0.08;
  const browY = eyeY - r * 2.2;
  const w = rx * 0.42;
  const m = mouthPath(expr.mouth, w, clamp(talk));
  const gx = glance[0] + look[0] * 0.6, gy = glance[1] + look[1] * 0.4;
  return (
    <g transform={`translate(${fx} ${fy})`}>
      {(expr.blush ?? 0) > 0.01 && (
        <g opacity={0.55 * (expr.blush ?? 0)}>
          <ellipse cx={-spread - r * 0.6} cy={eyeY + r * 2.2} rx={r * 1.5} ry={r * 0.85} fill={PAL.red} />
          <ellipse cx={spread + r * 0.6} cy={eyeY + r * 2.2} rx={r * 1.5} ry={r * 0.85} fill={PAL.red} />
        </g>
      )}
      <g transform={`translate(${-spread} ${eyeY}) scale(${nearL})`}><Eye shape={expr.eyes} r={r} blink={blink} px={gx} py={gy} /></g>
      <g transform={`translate(${spread} ${eyeY}) scale(${nearR})`}><Eye shape={expr.eyeR ?? expr.eyes} r={r} blink={blink} px={gx} py={gy} /></g>
      <path d={`M${-r * 1.2} 0 L${r * 1.2} 0`} transform={`translate(${-spread} ${browY - expr.lift[0]}) rotate(${expr.brow[0]})`} {...stroke(r * 0.5)} />
      <path d={`M${-r * 1.2} 0 L${r * 1.2} 0`} transform={`translate(${spread} ${browY - expr.lift[1]}) rotate(${-expr.brow[1]})`} {...stroke(r * 0.5)} />
      <g transform={`translate(${look[0] * rx * 0.05} ${ry * mouthY})`}>
        <path d={m.d} fill={m.fill ? INK : 'none'} {...stroke(r * 0.42)} />
        {m.fill && m.tongue && clamp(talk) > 0.25 && <path d={m.tongue} fill={PAL.red} />}
      </g>
      {(expr.sweat ?? 0) > 0.01 && (
        <path d={`M${rx * 0.62} ${-ry * 0.42} q ${-r * 0.7} ${r * 1.3} 0 ${r * 1.7} q ${r * 0.7} ${-r * 0.4} 0 ${-r * 1.7}Z`} fill={PAL.blueSoft} {...stroke(r * 0.28, PAL.blue)} opacity={expr.sweat} />
      )}
    </g>
  );
};
