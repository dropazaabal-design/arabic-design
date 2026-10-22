import React from 'react';
import { INK, LINE, PAL } from '../style';
import { clamp01, mix } from './ui';

const CUP = '#F4F6F8', CUP_SHADE = '#D9DFE6', DRINK = '#3E3436';

/**
 * A mug standing on a table: origin at the middle of its base (y=0 is the table), body 34×38 px, handle toward +x.
 * `steam` 0..1 shows three wisps; `t` (seconds) drifts them.
 */
export const Mug = ({ steam = 0, t = 0, color = PAL.focus }: { steam?: number; t?: number; color?: string }) => {
  const s = clamp01(steam), lw = LINE.fine;
  return (
    <g strokeLinejoin="round">
      {s > 0 && [-8, 0, 8].map((x, k) => {
        const ph = t * 1.3 + k * 0.7, rise = ((t * 0.35 + k * 0.33) % 1) * 6;
        const sw = Math.sin(ph * Math.PI) * 3;
        return <path key={k} d={`M${x} ${-44 - rise} q${-5 + sw} -8 0 -15 t${sw * 0.6} -15`} fill="none" stroke="#AEB9C6" strokeWidth={lw * 1.1} strokeLinecap="round" opacity={s * (0.85 - k * 0.1)} />;
      })}
      <path d="M15 -30 q12 -2 12 9 q0 11 -14 10" fill="none" stroke={INK} strokeWidth={lw + 5.5} strokeLinecap="round" />
      <path d="M15 -30 q12 -2 12 9 q0 11 -14 10" fill="none" stroke={CUP} strokeWidth={5.5} strokeLinecap="round" />
      <path d="M-17 -38 L17 -38 L15 -3 Q15 0 12 0 L-12 0 Q-15 0 -15 -3 Z" fill={CUP} stroke={INK} strokeWidth={lw} />
      <path d="M-16.4 -26 L16.4 -26 L16 -18 L-16 -18 Z" fill={color} />
      <path d="M5 -36 L13 -36 L11.5 -3 L4 -3 Z" fill={CUP_SHADE} opacity={0.8} />
      <ellipse cx={0} cy={-38} rx={17} ry={4.5} fill={CUP} stroke={INK} strokeWidth={lw} />
      <ellipse cx={0} cy={-37.3} rx={13.5} ry={2.9} fill={DRINK} />
    </g>
  );
};

/** A drinking glass on a table: origin at the middle of its base, 28 px wide at the rim, 46 px tall. `fill` 0..1 water level. */
export const Glass = ({ fill = 0.6 }: { fill?: number }) => {
  const f = clamp01(fill), lw = LINE.fine, H = 46;
  const half = (y: number) => mix(11, 14, -y / H); // half-width at height y (y ≤ 0)
  const wy = -H * 0.06 - f * H * 0.84;
  return (
    <g strokeLinejoin="round">
      <path d={`M${-half(-H)} ${-H} L${half(-H)} ${-H} L${half(0)} 0 L${-half(0)} 0 Z`} fill={PAL.waterLight} opacity={0.35} />
      {f > 0 && <path d={`M${-half(wy)} ${wy} L${half(wy)} ${wy} L${half(-3)} -3 L${-half(-3)} -3 Z`} fill={PAL.water} opacity={0.75} />}
      {f > 0 && <ellipse cx={0} cy={wy} rx={half(wy)} ry={2.4} fill={PAL.waterLight} stroke={PAL.waterDeep} strokeWidth={1} />}
      <path d={`M-5 ${-H + 6} L-6 -8`} stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.8} />
      <path d={`M${-half(-H)} ${-H} L${-half(0)} 0 Q0 2 ${half(0)} 0 L${half(-H)} ${-H}`} fill="none" stroke={INK} strokeWidth={lw} />
      <path d={`M${-half(0)} -3 Q0 -1 ${half(0)} -3`} fill="none" stroke={INK} strokeWidth={lw * 0.6} opacity={0.6} />
      <ellipse cx={0} cy={-H} rx={half(-H)} ry={3} fill="none" stroke={INK} strokeWidth={lw} />
    </g>
  );
};

/** A plate on a table seen from above-front: origin at its centre, 84×24 px. */
export const Plate = ({ color = '#FAFAF8' }: { color?: string }) => (
  <g>
    <ellipse cx={0} cy={2.5} rx={40} ry={11} fill={CUP_SHADE} stroke={INK} strokeWidth={LINE.fine} />
    <ellipse cx={0} cy={0} rx={42} ry={11.5} fill={color} stroke={INK} strokeWidth={LINE.fine} />
    <ellipse cx={0} cy={0.5} rx={27} ry={6.8} fill={CUP_SHADE} opacity={0.55} stroke={INK} strokeWidth={1.2} strokeOpacity={0.35} />
  </g>
);
