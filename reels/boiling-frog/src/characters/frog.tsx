import React from 'react';
import { INK, LINE, PAL, clamp, lerp, openPath, stroke, wobEllipse } from '@mukarram/characters/ink';

// The frog: a squash-and-stretch rig in the same ink language as reels/mukarram. Body volume is kept
// when it squashes (crouch) or stretches (jump); legs fold or extend; domed eyes blink, glance and
// emote; the wide mouth opens, smiles or pops an "o"; the tongue can shoot out; the throat puffs.

export const FROG = { body: '#4FA89A', light: '#D3EEE7', deep: '#2F7F74', spot: '#3E917F' };

export type FrogEyes = 'open' | 'wide' | 'half' | 'happy' | 'closed';
export type FrogMouth = 'smile' | 'grin' | 'flat' | 'o' | 'smirk' | 'open';
export type FrogPose = {
  /** anticipation: 0 = sitting, 1 = fully crouched (wide and low) */
  crouch: number;
  /** jump: 0 = sitting, 1 = fully stretched (tall, legs out) */
  stretch: number;
  lean: number;
  tilt: number;
  /** front arms: angle from hanging (+ = outward/up), per side */
  armL: number;
  armR: number;
};
export const FROG_SIT: FrogPose = { crouch: 0, stretch: 0, lean: 0, tilt: 0, armL: 0, armR: 0 };

export type FrogProps = {
  x: number;
  y: number;
  s?: number;
  facing?: 1 | -1;
  rot?: number;
  pose?: Partial<FrogPose>;
  eyes?: FrogEyes;
  mouth?: FrogMouth;
  blink?: number;
  glance?: [number, number];
  /** brows: + = worried/raised, − = knowing/flat */
  brow?: number;
  tongue?: number;
  tongueAng?: number;
  throat?: number;
  blush?: number;
  shadow?: boolean;
  /** drawn around the waist (swim ring) or on the shoulders (towel), body space */
  ring?: boolean;
  towel?: boolean;
  /** extra drawing in the right hand */
  itemR?: React.ReactNode;
};

const Eye: React.FC<{ x: number; shape: FrogEyes; blink: number; g: [number, number]; brow: number; side: -1 | 1 }> = ({ x, shape, blink, g, brow, side }) => {
  const r = 36;
  const lid = shape === 'half' ? 0.45 : 0;
  const shut = clamp(blink / 0.85);
  return (
    <g transform={`translate(${x} -150)`}>
      <path d={wobEllipse(0, 0, r + 8, r + 6, 300 + side, 0.04, 10)} fill={FROG.body} {...stroke()} />
      {shape === 'happy' ? (
        <path d={`M${-r * 0.6} 6 Q0 ${-r * 0.75} ${r * 0.6} 6`} fill="none" {...stroke(LINE * 1.1)} />
      ) : shape === 'closed' || shut > 0.95 ? (
        <path d={`M${-r * 0.6} 0 Q0 ${r * 0.35} ${r * 0.6} 0`} fill="none" {...stroke(LINE * 1.1)} />
      ) : (
        <g>
          <ellipse cx={0} cy={0} rx={r * 0.78} ry={r * 0.78 * (1 - shut * 0.9)} fill={PAL.white} {...stroke(LINE * 0.6)} />
          <g transform={`scale(1 ${1 - shut * 0.9})`}>
            <circle cx={g[0] * r * 0.32} cy={g[1] * r * 0.3} r={shape === 'wide' ? r * 0.24 : r * 0.36} fill={INK} />
            <circle cx={g[0] * r * 0.32 - 5} cy={g[1] * r * 0.3 - 6} r={4.5} fill={PAL.white} />
          </g>
          {(lid > 0 || shut > 0) && <path d={`M${-r * 0.8} ${-r * 0.8} L${r * 0.8} ${-r * 0.8} L${r * 0.8} ${lerp(-r * 0.8, r * 0.1, Math.max(lid, shut))} Q0 ${lerp(-r * 0.6, r * 0.3, Math.max(lid, shut))} ${-r * 0.8} ${lerp(-r * 0.8, r * 0.1, Math.max(lid, shut))}Z`} fill={FROG.body} {...stroke(LINE * 0.7)} />}
        </g>
      )}
      <path d={`M${-18} ${-r - 14 - brow * 8} L${18} ${-r - 14 - brow * 8 + side * brow * -6}`} {...stroke(LINE * 0.9)} opacity={Math.abs(brow) > 0.05 ? 1 : 0} />
    </g>
  );
};

const mouthD = (m: FrogMouth, w: number): { d: string; fill: boolean } => {
  switch (m) {
    case 'grin': return { d: `M${-w} -6 Q0 ${w * 0.55} ${w} -6 Q0 ${w * 0.1} ${-w} -6Z`, fill: true };
    case 'open': return { d: `M${-w * 0.7} 0 Q0 ${w * 0.7} ${w * 0.7} 0 Q0 ${-w * 0.12} ${-w * 0.7} 0Z`, fill: true };
    case 'o': return { d: `M-14 4 A14 16 0 1 0 14 4 A14 16 0 1 0 -14 4Z`, fill: true };
    case 'flat': return { d: `M${-w * 0.8} 0 Q0 6 ${w * 0.8} 0`, fill: false };
    case 'smirk': return { d: `M${-w * 0.8} 4 Q${w * 0.2} 14 ${w * 0.85} -10`, fill: false };
    case 'smile':
    default: return { d: `M${-w} -8 Q0 ${w * 0.42} ${w} -8`, fill: false };
  }
};

export const Frog: React.FC<FrogProps> = ({ x, y, s = 1, facing = 1, rot = 0, pose = {}, eyes = 'open', mouth = 'smile', blink = 0, glance = [0, 0], brow = 0, tongue = 0, tongueAng = -30, throat = 0, blush = 0, shadow = true, ring = false, towel = false, itemR }) => {
  const p = { ...FROG_SIT, ...pose };
  const c = clamp(p.crouch), st = clamp(p.stretch);
  // volume-keeping squash and stretch
  const sy = (1 - 0.28 * c) * (1 + 0.42 * st);
  const sx = 1 / Math.sqrt(sy);
  const legOut = st;           // 0 = folded under the body, 1 = straight down behind
  const lift = st * 60;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * facing} ${s})`}>
      {shadow && <ellipse cx={0} cy={4} rx={120 * (1 + 0.2 * c) * (1 - 0.4 * st)} ry={14} fill={PAL.shadow} />}
      {/* back legs: folded thighs + feet on the ground, or stretched long when jumping */}
      {[-1, 1].map((k) => {
        const hip: [number, number] = [k * 70 * sx, -60 * sy - lift];
        const knee: [number, number] = [lerp(k * 128 * (1 + c * 0.2), k * 60, legOut), lerp(-58 * (1 - c * 0.3), -lift + 30, legOut)];
        const foot: [number, number] = [lerp(k * 86, k * 40, legOut), lerp(-4, -lift + 120, legOut)];
        return (
          <g key={k}>
            <path d={openPath([hip, knee, foot])} fill="none" {...stroke(46, INK)} />
            <path d={openPath([hip, knee, foot])} fill="none" {...stroke(46 - LINE * 1.6, FROG.body)} />
            <path transform={`translate(${foot[0]} ${foot[1]}) scale(${k} 1)`} d="M-6 0 l 34 -10 l -6 12 l 18 4 l -18 6 l 6 12 l -34 -12Z" fill={FROG.deep} {...stroke(LINE * 0.7)} />
          </g>
        );
      })}
      <g transform={`translate(0 ${-lift}) rotate(${p.lean}) scale(${sx} ${sy})`}>
        {/* body + head as one blob */}
        <path d={openPath([[0, -196], [70, -190], [118, -132], [126, -60], [96, -8], [0, 4], [-96, -8], [-126, -60], [-118, -132], [-70, -190], [0, -196]]) + 'Z'} fill={FROG.body} {...stroke()} />
        <path d={wobEllipse(0, -46, 70, 44, 311, 0.04, 10)} fill={FROG.light} />
        {[[-70, -120, 10], [84, -96, 8], [-48, -168, 7], [100, -150, 6]].map(([sx2, sy2, r], i) => <circle key={i} cx={sx2} cy={sy2} r={r} fill={FROG.spot} />)}
        {throat > 0.02 && <path d={wobEllipse(0, -70, 40 + throat * 30, 22 + throat * 26, 312, 0.04, 10)} fill={FROG.light} {...stroke(LINE * 0.7)} />}
        {ring && (
          <g>
            <path d={wobEllipse(0, -40, 150, 40, 313, 0.03, 12)} fill={PAL.red} {...stroke()} />
            {[-100, -30, 40, 110].map((xx) => <path key={xx} d={`M${xx} -76 l 16 70`} {...stroke(16, PAL.white)} />)}
            <path d={wobEllipse(0, -46, 104, 22, 314, 0.03, 12)} fill={FROG.light} {...stroke(LINE * 0.7)} />
          </g>
        )}
        {/* front arms */}
        {[-1, 1].map((k) => {
          const a = ((k === -1 ? p.armL : p.armR) * Math.PI) / 180;
          const sh: [number, number] = [k * 64, -86];
          const hand: [number, number] = [sh[0] + k * Math.sin(a) * 74, sh[1] + Math.cos(a) * 74];
          return (
            <g key={k}>
              <path d={openPath([sh, [sh[0] + k * 8, (sh[1] + hand[1]) / 2], hand])} fill="none" {...stroke(26, INK)} />
              <path d={openPath([sh, [sh[0] + k * 8, (sh[1] + hand[1]) / 2], hand])} fill="none" {...stroke(26 - LINE * 1.4, FROG.body)} />
              {[-12, 0, 12].map((d) => <circle key={d} cx={hand[0] + d} cy={hand[1] + 4} r={7} fill={FROG.light} {...stroke(LINE * 0.6)} />)}
              {k === 1 && itemR && <g transform={`translate(${hand[0]} ${hand[1]})`}>{itemR}</g>}
            </g>
          );
        })}
        {towel && <path d="M-110 -150 Q 0 -110 110 -150 L 118 -96 Q 0 -60 -118 -96Z" fill={PAL.blue} {...stroke()} />}
        {/* face */}
        <g transform={`rotate(${p.tilt} 0 -120)`}>
          <Eye x={-56} shape={eyes} blink={blink} g={glance} brow={brow} side={-1} />
          <Eye x={56} shape={eyes} blink={blink} g={glance} brow={brow} side={1} />
          {blush > 0.01 && <g opacity={0.5 * blush}><ellipse cx={-80} cy={-102} rx={18} ry={10} fill={PAL.red} /><ellipse cx={80} cy={-102} rx={18} ry={10} fill={PAL.red} /></g>}
          <g transform="translate(0 -80)">
            {tongue > 0.01 && (
              <g transform={`rotate(${tongueAng})`}>
                <path d={`M0 0 L${tongue * 240} 0`} {...stroke(16, PAL.red)} />
                <circle cx={tongue * 240} cy={0} r={13} fill={PAL.red} {...stroke(LINE * 0.6)} />
              </g>
            )}
            {(() => { const m = mouthD(tongue > 0.01 ? 'o' : mouth, 74); return <path d={m.d} fill={m.fill ? INK : 'none'} {...stroke(LINE)} />; })()}
          </g>
        </g>
      </g>
    </g>
  );
};
