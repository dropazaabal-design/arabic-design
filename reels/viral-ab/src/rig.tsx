import React from 'react';
import { Easing, interpolate } from 'remotion';

// A silhouette figure for both reels. Character space: feet on y = 0, up is −y, +x is the way it faces.
// Legs reach their feet by two-bone IK (feet stay planted unless a scene moves them); arms are either angles
// (0 = hanging, + = swung forward) or a hand target, also by IK. `robe` draws a thobe instead of legs.
export type Pose = {
  lean: number; head: number; bob: number; crouch: number;
  shF: number; elF: number; shN: number; elN: number;
  footF: [number, number]; footN: [number, number];
  handF?: [number, number]; handN?: [number, number];
};
export const REST: Pose = { lean: 0, head: 0, bob: 0, crouch: 0, shF: 8, elF: 10, shN: -8, elN: 10, footF: [12, 0], footN: [-12, 0] };
export const pose = (p: Partial<Pose> = {}): Pose => ({ ...REST, ...p });

const L = { torso: 92, neck: 30, upper: 52, fore: 50, thigh: 60, shin: 60, head: 25 };
const rad = (d: number) => (d * Math.PI) / 180;
const dir = (deg: number): [number, number] => [Math.sin(rad(deg)), Math.cos(rad(deg))]; // 0 = down, + = forward
const add = (a: [number, number], b: [number, number], k = 1): [number, number] => [a[0] + b[0] * k, a[1] + b[1] * k];
const rot = (v: [number, number], deg: number): [number, number] => {
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
};

/** Two-bone IK from `a` to `t`; `bend` +1 puts the joint forward (+x side), −1 behind. */
export const ik = (a: [number, number], t: [number, number], l1: number, l2: number, bend: 1 | -1): [number, number] => {
  const dx = t[0] - a[0], dy = t[1] - a[1];
  const d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const ang = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const th = base - bend * ang;
  return [a[0] + l1 * Math.cos(th), a[1] + l1 * Math.sin(th)];
};

export function joints(p: Pose) {
  const hip: [number, number] = [0, -(L.thigh + L.shin) + 4 + p.bob + p.crouch];
  const neck = add(hip, rot([0, -L.torso], p.lean));
  const head = add(neck, rot([0, -L.neck], p.lean + p.head));
  const shoulder = add(neck, rot([0, 8], p.lean));
  const arm = (sh: number, el: number, hand?: [number, number], bend: 1 | -1 = -1) => {
    if (hand) {
      const elbow = ik(shoulder, hand, L.upper, L.fore, bend);
      const d = Math.hypot(hand[0] - elbow[0], hand[1] - elbow[1]);
      const wrist: [number, number] = d > L.fore ? add(elbow, [(hand[0] - elbow[0]) / d, (hand[1] - elbow[1]) / d], L.fore) : hand;
      return { elbow, wrist };
    }
    const elbow = add(shoulder, dir(sh + p.lean), L.upper);
    return { elbow, wrist: add(elbow, dir(sh + el + p.lean), L.fore) };
  };
  const leg = (foot: [number, number]) => ({ knee: ik(hip, foot, L.thigh, L.shin, 1), foot });
  return { hip, neck, head, shoulder, armF: arm(p.shF, p.elF, p.handF), armN: arm(p.shN, p.elN, p.handN), legF: leg(p.footF), legN: leg(p.footN) };
}

export type Eyes = 'open' | 'laugh' | 'shock' | 'closed' | 'none';
export type FigureProps = {
  p: Pose; x?: number; y?: number; s?: number; facing?: 1 | -1; color?: string; eyes?: Eyes; eyeColor?: string; look?: [number, number];
  robe?: boolean; ghutra?: boolean; beard?: boolean; bun?: boolean; held?: { F?: React.ReactNode; N?: React.ReactNode }; o?: number; width?: number;
};

// held props are drawn the world's way round, so words on them never read mirrored
/** The figure itself. Line weight scales with the figure so a child reads as a child, not a thinner adult. */
export const Figure: React.FC<FigureProps> = ({ p, x = 0, y = 0, s = 1, facing = 1, color = '#06080C', eyes = 'open', eyeColor = '#F4F7FB', look = [0, 0], robe = false, ghutra = false, beard = false, bun = false, held, o = 1, width = 13 }) => {
  const j = joints(p);
  const line = (pts: [number, number][], w = width) => <path d={`M${pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L')}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
  const [hx, hy] = j.head;
  const eye = (dx: number) => {
    const ex = hx + dx + 8 + look[0] * 3, ey = hy - 3 + look[1] * 3;
    if (eyes === 'none') return null;
    if (eyes === 'laugh') return <path key={dx} d={`M${ex - 5} ${ey + 2} Q${ex} ${ey - 5} ${ex + 5} ${ey + 2}`} fill="none" stroke={eyeColor} strokeWidth={3.2} strokeLinecap="round" />;
    if (eyes === 'closed') return <path key={dx} d={`M${ex - 5} ${ey} L${ex + 5} ${ey}`} stroke={eyeColor} strokeWidth={3} strokeLinecap="round" />;
    const r = eyes === 'shock' ? 5.4 : 4.2;
    return <ellipse key={dx} cx={ex} cy={ey} rx={r} ry={r * 1.15} fill={eyeColor} />;
  };
  const sleeve = robe ? width + 3 : width;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`} opacity={o}>
      {/* far side first */}
      {!robe && line([j.hip, j.legN.knee, j.legN.foot])}
      {line([j.shoulder, j.armN.elbow, j.armN.wrist], sleeve)}
      {held?.N && <g transform={`translate(${j.armN.wrist[0]} ${j.armN.wrist[1]}) scale(${facing} 1)`}>{held.N}</g>}
      {robe
        ? <path d={robePath(j, p)} fill={color} />
        : <>{line([j.hip, j.legF.knee, j.legF.foot])}{line([j.hip, j.neck], width + 3)}</>}
      {robe && <>
        <path d={`M${j.legN.foot[0] - 9} 0 L${j.legN.foot[0] + 12} 0`} stroke={color} strokeWidth={9} strokeLinecap="round" />
        <path d={`M${j.legF.foot[0] - 9} 0 L${j.legF.foot[0] + 12} 0`} stroke={color} strokeWidth={9} strokeLinecap="round" />
      </>}
      {ghutra && <path d={ghutraPath(j, p)} fill={color} />}
      {bun && <circle cx={hx - 24} cy={hy - 10} r={12} fill={color} />}
      <circle cx={hx} cy={hy} r={L.head} fill={color} />
      {beard && <path d={`M${hx - 8} ${hy + 8} Q${hx + 6} ${hy + 62} ${hx + 32} ${hy + 4} Z`} fill={color} />}
      {eye(-8)}{eye(6)}
      {line([j.shoulder, j.armF.elbow, j.armF.wrist], sleeve)}
      {held?.F && <g transform={`translate(${j.armF.wrist[0]} ${j.armF.wrist[1]}) scale(${facing} 1)`}>{held.F}</g>}
    </g>
  );
};

function robePath(j: ReturnType<typeof joints>, p: Pose) {
  const [nx, ny] = j.neck, [sx, sy] = j.shoulder;
  const lean = rad(p.lean);
  const hemY = -6, hemC = (j.legF.foot[0] + j.legN.foot[0]) / 2 + Math.sin(lean) * 8;
  const w0 = 22, w1 = 38 + Math.abs(j.legF.foot[0] - j.legN.foot[0]) * 0.35;
  const sh = (side: number): [number, number] => [sx + side * w0 * Math.cos(lean), sy + side * w0 * Math.sin(lean) + 4];
  const [ax, ay] = sh(-1), [bx, by] = sh(1);
  return `M${nx - 8} ${ny} L${bx} ${by} C${bx + 10} ${by + 60} ${hemC + w1 + 4} ${hemY - 80} ${hemC + w1} ${hemY} L${hemC - w1} ${hemY} C${hemC - w1 - 4} ${hemY - 80} ${ax - 10} ${ay + 60} ${ax} ${ay} Z`;
}

function ghutraPath(j: ReturnType<typeof joints>, p: Pose) {
  const [hx, hy] = j.head;
  const a = rad(p.lean + p.head);
  const back = [hx - 28 * Math.cos(a) - 30 * Math.sin(a), hy + 46 * Math.cos(a)];
  return `M${hx + 18} ${hy - 22} Q${hx - 40} ${hy - 40} ${back[0]} ${back[1]} L${hx + 4} ${hy + 30} Q${hx - 6} ${hy} ${hx + 18} ${hy - 22} Z`;
}

// ——— time helpers (frames) ———
export const ease = {
  out: Easing.bezier(0.22, 1, 0.36, 1), inOut: Easing.bezier(0.65, 0, 0.35, 1), in: Easing.bezier(0.55, 0, 1, 0.45), back: Easing.bezier(0.34, 1.56, 0.64, 1),
};
export const prog = (f: number, from: number, dur: number, e = ease.out) => interpolate(f, [from, from + Math.max(1, dur)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const v = (k: keyof Pose) => mix(a[k] as number, b[k] as number, t);
  const pt = (q?: [number, number], r?: [number, number]): [number, number] | undefined => (q && r ? [mix(q[0], r[0], t), mix(q[1], r[1], t)] : undefined);
  // an arm posed by angles on one side and by a hand target on the other blends through its wrist position
  const hand = (k: 'F' | 'N') => {
    const q = a[`hand${k}`], r = b[`hand${k}`];
    if (!q && !r) return undefined;
    const w = (p: Pose) => joints(p)[`arm${k}`].wrist;
    return pt(q ?? w(a), r ?? w(b));
  };
  return { lean: v('lean'), head: v('head'), bob: v('bob'), crouch: v('crouch'), shF: v('shF'), elF: v('elF'), shN: v('shN'), elN: v('elN'),
    footF: pt(a.footF, b.footF)!, footN: pt(a.footN, b.footN)!, handF: hand('F'), handN: hand('N') };
};
/** Keyframed pose: each key blends from the pose at its start over `dur` frames. */
export const track = (f: number, keys: { at: number; to: Pose; dur?: number }[]) => {
  let v = keys[0].to;
  for (const k of keys.slice(1)) {
    if (f < k.at) break;
    v = mixPose(v, k.to, ease.inOut(Math.min(1, (f - k.at) / (k.dur ?? 14))));
  }
  return v;
};
/** Steps for a walk from x0 to x1 over [start, start+frames]: body x and the two feet (char space, facing +x). */
export const walk = (f: number, x0: number, x1: number, start: number, frames: number, stride = 46) => {
  const t = Math.max(0, Math.min(1, (f - start) / frames));
  const x = mix(x0, x1, ease.inOut(t));
  const moving = f > start && f < start + frames;
  const ph = (Math.abs(x - x0) / stride) * Math.PI;
  const lift = moving ? Math.abs(Math.sin(ph)) * 10 : 0;
  const swing = moving ? Math.sin(ph) * 20 : 0;
  return { x, footF: [12 + swing, -(Math.sin(ph) > 0 ? lift : 0)] as [number, number], footN: [-12 - swing, -(Math.sin(ph) < 0 ? lift : 0)] as [number, number], bob: moving ? -Math.abs(Math.cos(ph)) * 4 : 0 };
};
