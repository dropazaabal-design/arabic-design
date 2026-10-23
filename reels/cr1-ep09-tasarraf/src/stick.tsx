import React from 'react';
import { COLORS } from './config';

// A stickman: white lines, a round head with dot eyes and a mouth that carries the feeling. No other features.
export type Face = 'neutral' | 'smile' | 'nervous' | 'proud' | 'wow' | 'tired';
/** Limb angles in degrees from straight down (positive toward the way he faces): [upper, lower]. */
export type Pose = { lean: number; head: number; armF: [number, number]; armB: [number, number]; legF: [number, number]; legB: [number, number]; bob?: number };

export const STAND: Pose = { lean: 0, head: 0, armF: [8, 4], armB: [-8, -4], legF: [6, 0], legB: [-6, 0] };
const rad = (d: number) => (d * Math.PI) / 180;
const limb = (x: number, y: number, a: number, len: number): [number, number] => [x + Math.sin(rad(a)) * len, y + Math.cos(rad(a)) * len];
export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const m = (u: number, v: number) => u + (v - u) * t;
  const m2 = (u: [number, number], v: [number, number]): [number, number] => [m(u[0], v[0]), m(u[1], v[1])];
  return { lean: m(a.lean, b.lean), head: m(a.head, b.head), armF: m2(a.armF, b.armF), armB: m2(a.armB, b.armB), legF: m2(a.legF, b.legF), legB: m2(a.legB, b.legB), bob: m(a.bob ?? 0, b.bob ?? 0) };
};
/** A walking (or running) pose at phase ph. */
export const stride = (ph: number, amp = 1, run = false): Pose => {
  const s = Math.sin(ph) * amp, k = run ? 1.6 : 1;
  return {
    lean: (run ? 10 : 3) * amp, head: 0, bob: Math.abs(Math.cos(ph)) * (run ? 10 : 5) * amp,
    armF: [-22 * s * k, (run ? 70 : 20) * amp - 10 * s], armB: [22 * s * k, (run ? 70 : 20) * amp + 10 * s],
    legF: [24 * s * k, 24 * s * k - 26 * Math.max(0, Math.cos(ph)) * amp * k], legB: [-24 * s * k, -24 * s * k - 26 * Math.max(0, -Math.cos(ph)) * amp * k],
  };
};

const MOUTH: Record<Face, string> = {
  neutral: 'M-12 18 H12',
  smile: 'M-14 14 Q0 28 14 14',
  nervous: 'M-14 20 Q-7 14 0 20 Q7 26 14 20',
  proud: 'M-16 12 Q0 32 16 12 Z',
  wow: 'M-7 18 a7 9 0 1 0 14 0 a7 9 0 1 0 -14 0',
  tired: 'M-12 22 Q0 14 12 22',
};

/** The figure stands at (x, foot), 380 units tall at s = 1, facing right (dir 1) or left (dir −1). */
export const Stick: React.FC<{
  x: number; foot: number; pose?: Pose; face?: Face; s?: number; dir?: 1 | -1; o?: number;
  sweat?: number; look?: number; blink?: boolean; children?: React.ReactNode; color?: string; chest?: React.ReactNode;
}> = ({ x, foot, pose = STAND, face = 'neutral', s = 1, dir = 1, o = 1, sweat = 0, look = 0, blink = false, children, color = COLORS.white, chest }) => {
  const hip: [number, number] = [0, -170 + (pose.bob ?? 0) * -1];
  const neck = limb(hip[0], hip[1], 180 + pose.lean, 130);
  const head = limb(neck[0], neck[1], 180 + pose.lean + pose.head, 54);
  const sh = limb(hip[0], hip[1], 180 + pose.lean, 116);
  const arm = (a: [number, number]) => { const e = limb(sh[0], sh[1], a[0], 72); return [e, limb(e[0], e[1], a[1], 68)] as const; };
  const leg = (a: [number, number]) => { const k = limb(hip[0], hip[1], a[0], 86); return [k, limb(k[0], k[1], a[1], 84)] as const; };
  const [eF, hF] = arm(pose.armF), [eB, hB] = arm(pose.armB), [kF, fF] = leg(pose.legF), [kB, fB] = leg(pose.legB);
  const pl = (...pts: (readonly [number, number])[]) => 'M' + pts.map((q) => q.join(' ')).join(' L');
  return (
    <g opacity={o} transform={`translate(${x} ${foot}) scale(${s * dir} ${s})`}>
      <g fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round">
        <path d={pl(fB, kB, hip)} opacity={0.75} />
        <path d={pl(hB, eB, sh)} opacity={0.75} />
        <path d={pl(hip, neck)} />
        {chest && <g transform={`translate(${(hip[0] + neck[0]) / 2} ${(hip[1] + neck[1]) / 2 + 4}) scale(${dir} 1)`}>{chest}</g>}
        <path d={pl(fF, kF, hip)} />
        <path d={pl(hF, eF, sh)} />
      </g>
      <g transform={`translate(${head[0]} ${head[1]}) rotate(${pose.head * 0.5})`}>
        <circle r={46} fill={color} />
        {blink
          ? <g stroke={COLORS.navy} strokeWidth={4} strokeLinecap="round"><path d={`M${4 + look * 4} -6 h12`} /><path d={`M${-20 + look * 4} -6 h12`} /></g>
          : <g fill={COLORS.navy}><circle cx={14 + look * 5} cy={-6} r={face === 'wow' ? 7 : 5.5} /><circle cx={-12 + look * 5} cy={-6} r={face === 'wow' ? 7 : 5.5} /></g>}
        <path d={MOUTH[face]} transform="translate(6 0)" fill={face === 'proud' || face === 'wow' ? COLORS.navy : 'none'} stroke={COLORS.navy} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
        {sweat > 0 && <path d="M40 -40 q8 14 0 20 q-8 -6 0 -20 Z" fill={COLORS.blue} opacity={sweat} transform={`translate(0 ${(1 - sweat) * -10})`} />}
      </g>
      {children}
    </g>
  );
};
/** Where a hand is, for props held by the figure (same maths as the drawing). */
export const handAt = (x: number, foot: number, pose: Pose, s = 1, dir: 1 | -1 = 1, front = true): [number, number] => {
  const hip: [number, number] = [0, -170 + (pose.bob ?? 0) * -1];
  const sh = limb(hip[0], hip[1], 180 + pose.lean, 116);
  const a = front ? pose.armF : pose.armB;
  const e = limb(sh[0], sh[1], a[0], 72), h = limb(e[0], e[1], a[1], 68);
  return [x + h[0] * s * dir, foot + h[1] * s];
};
