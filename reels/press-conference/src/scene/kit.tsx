import React from 'react';
import { tween } from '@motion/index';

/** The look: a miniature workshop at night. Matte porcelain, oxidised teal (the work), muted berry (the press),
 *  graphite metal, deep pine air. No yellow, orange or gold anywhere. Light comes from the upper left. */
export const W = 1080, H = 1920;
export const C = {
  pine: '#102923', pine2: '#173A32', pine3: '#22493F', night: '#0A1B17',
  porc: '#E7F0ED', porc2: '#C8D7D2', porc3: '#97ABA5',
  teal: '#347F79', teal2: '#4E9C95', teal3: '#235853',
  berry: '#A74F73', berry2: '#C2708F', berry3: '#76344F',
  graph: '#24282C', graph2: '#3A4046', graph3: '#59616A',
};
export const FONT = 'Cairo, sans-serif';

export type V = [number, number];
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const clamp01 = (k: number) => Math.max(0, Math.min(1, k));
export const mix = (a: V, b: V, k: number): V => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const deg = (r: number) => (r * 180) / Math.PI;

/** Shared gradients (objectBoundingBox, so one id shades any shape from the upper left). Put once per <svg>. */
export const Defs: React.FC = () => (
  <defs>
    <linearGradient id="porc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F7FBF9" /><stop offset="0.55" stopColor={C.porc} /><stop offset="1" stopColor="#B4C7C1" /></linearGradient>
    <linearGradient id="porcV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2F7F5" /><stop offset="1" stopColor="#BACBC6" /></linearGradient>
    <linearGradient id="graph" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4C545B" /><stop offset="1" stopColor="#1B1F23" /></linearGradient>
    <linearGradient id="graphV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#454C53" /><stop offset="1" stopColor="#1D2125" /></linearGradient>
    <linearGradient id="teal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5BA9A1" /><stop offset="1" stopColor="#26605B" /></linearGradient>
    <linearGradient id="tealV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#57A39C" /><stop offset="1" stopColor="#2A6762" /></linearGradient>
    <linearGradient id="berry" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C77697" /><stop offset="1" stopColor="#80395A" /></linearGradient>
    <linearGradient id="berryV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B95F84" /><stop offset="1" stopColor="#7C3757" /></linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E3ECE9" /><stop offset="0.45" stopColor="#9FB0AB" /><stop offset="0.6" stopColor="#C9D5D1" /><stop offset="1" stopColor="#7E8F8A" /></linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0D2520" /><stop offset="0.6" stopColor="#163A32" /><stop offset="1" stopColor="#0F2722" /></linearGradient>
    <linearGradient id="benchTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3E5A54" /><stop offset="1" stopColor="#2C4641" /></linearGradient>
    <linearGradient id="benchFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22312F" /><stop offset="1" stopColor="#141E1C" /></linearGradient>
    <linearGradient id="abyss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B1916" /><stop offset="1" stopColor="#040A09" /></linearGradient>
    <radialGradient id="pool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#CFE3DD" stopOpacity="0.22" /><stop offset="1" stopColor="#CFE3DD" stopOpacity="0" /></radialGradient>
    <radialGradient id="shade" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#020807" stopOpacity="0.55" /><stop offset="1" stopColor="#020807" stopOpacity="0" /></radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#8FD3CB" stopOpacity="0.9" /><stop offset="1" stopColor="#8FD3CB" stopOpacity="0" /></radialGradient>
    <pattern id="peg" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="17" cy="17" r="3.2" fill="#0A1E1A" /></pattern>
    <pattern id="grille" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.3" fill="#0E1113" /></pattern>
  </defs>
);

/** A soft contact shadow. */
export const Shadow: React.FC<{ x: number; y: number; rx: number; ry?: number; op?: number }> = ({ x, y, rx, ry = rx * 0.18, op = 1 }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="url(#shade)" opacity={op} />
);

/** A two-part limb drawn as shaded tubes. */
const Tube: React.FC<{ a: V; b: V; w: number; dark?: string; light?: string }> = ({ a, b, w, dark = '#1E2327', light = '#5B636B' }) => (
  <>
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={dark} strokeWidth={w} strokeLinecap="round" />
    <line x1={a[0] - w * 0.18} y1={a[1] - w * 0.18} x2={b[0] - w * 0.18} y2={b[1] - w * 0.18} stroke={light} strokeWidth={w * 0.32} strokeLinecap="round" opacity={0.8} />
  </>
);

/** Two-bone IK. `pick` scores the two joint solutions; the higher wins. */
export const ik = (s: V, t: V, a: number, b: number, pick: (e: V) => number): V => {
  const dx = t[0] - s[0], dy = t[1] - s[1];
  const d = Math.max(1, Math.min(Math.hypot(dx, dy), a + b - 0.5));
  const base = Math.atan2(dy, dx);
  const off = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const [e1, e2] = [base + off, base - off].map((g): V => [s[0] + a * Math.cos(g), s[1] + a * Math.sin(g)]);
  return pick(e1) >= pick(e2) ? e1 : e2;
};
/** The wrist after IK: the target, pulled back onto the reach if it is too far. */
const reach = (s: V, t: V, len: number): V => {
  const d = Math.hypot(t[0] - s[0], t[1] - s[1]);
  return d <= len ? t : [s[0] + ((t[0] - s[0]) * len) / d, s[1] + ((t[1] - s[1]) * len) / d];
};

/** Hand targets in robot-local px (s = 1, origin between the feet, y up negative). */
export const HAND = {
  rest: (side: -1 | 1): V => [side * 66, -104],
  hips: (side: -1 | 1): V => [side * 70, -120],
  chest: (side: -1 | 1): V => [side * 18, -168],
  talk: (side: -1 | 1): V => [side * 92, -196],
  up: (side: -1 | 1): V => [side * 70, -262],
  front: (side: -1 | 1): V => [side * 40, -150],
};

export type RobotProps = {
  x: number; y: number; s?: number;
  turn?: number;          // −1 … 1: where the visor looks (left … right)
  tilt?: number;          // head tilt, degrees (+ clockwise)
  nod?: number;           // head dip, px
  lean?: number;          // upper body, degrees (+ clockwise)
  droop?: number;         // antenna droop, degrees (0 upright, 70 hanging)
  l?: V; r?: V;           // hand targets (HAND…), robot-local
  gl?: number; gr?: number; // grippers 0 closed … 1 open
  walk?: number;          // walk phase (steps)
  stride?: number;        // 0 … 1
  crouch?: number;        // 0 … 1
  back?: boolean;         // seen from behind
  glow?: number;          // chest light 0 … 1
  inR?: React.ReactNode;  // something held in the right gripper (drawn in gripper space, x along the forearm)
  inL?: React.ReactNode;
  op?: number;
};

const Gripper: React.FC<{ w: V; e: V; open: number; side: -1 | 1; held?: React.ReactNode }> = ({ w, e, open, side, held }) => {
  const a = deg(Math.atan2(w[1] - e[1], w[0] - e[0]));
  const sp = 10 + 16 * open;
  return (
    <g transform={`translate(${w[0]} ${w[1]}) rotate(${a})`}>
      {held}
      <rect x={6} y={-sp / 2 - 6} width={22} height={7} rx={3.5} fill="url(#graph)" transform={`rotate(${-12 * open * side} 6 ${-sp / 2})`} />
      <rect x={6} y={sp / 2 - 1} width={22} height={7} rx={3.5} fill="url(#graph)" transform={`rotate(${12 * open * side} 6 ${sp / 2})`} />
      <circle r={11} fill="url(#graph)" />
      <circle r={4} fill={C.teal2} opacity={0.9} />
    </g>
  );
};

/** The robot: about 330 px tall at s = 1. Faceless; it acts with posture, hands, visor direction and antenna. */
export const Robot: React.FC<RobotProps> = ({ x, y, s = 1, turn = 0, tilt = 0, nod = 0, lean = 0, droop = 0, l, r, gl = 0.3, gr = 0.3, walk = 0, stride = 0, crouch = 0, back = false, glow = 0.6, inR, inL, op = 1 }) => {
  const ph = walk * Math.PI;
  const bob = -Math.abs(Math.sin(ph)) * 5 * stride;
  const drop = crouch * 46;
  const hipY = -78 + drop + bob;
  const foot = (side: -1 | 1): V => {
    const k = side === 1 ? Math.sin(ph) : -Math.sin(ph);
    return [side * 24 + k * 16 * stride, -Math.max(0, side === 1 ? Math.cos(ph) : -Math.cos(ph)) * 14 * stride];
  };
  const leg = (side: -1 | 1) => {
    const h: V = [side * 20, hipY];
    const f = foot(side);
    const k = ik(h, f, 40, 40, (e) => side * e[0]);
    return { h, k, f };
  };
  const sh = (side: -1 | 1): V => [side * 50, -180 + drop + bob];
  const armOf = (side: -1 | 1, t: V | undefined) => {
    const S = sh(side);
    const T = reach(S, t ? [t[0], t[1]] : [HAND.rest(side)[0], HAND.rest(side)[1] + drop], 119);
    const e = ik(S, T, 62, 58, (p) => p[1] + 0.4 * side * (p[0] - S[0]));
    return { S, e, w: T };
  };
  const L = armOf(-1, l), R = armOf(1, r);
  const legs = [leg(-1), leg(1)];
  const tx = turn * 13;
  const pivot = `0 ${hipY - 8}`;
  const arm = (A: ReturnType<typeof armOf>, side: -1 | 1, g: number, held?: React.ReactNode) => (
    <g>
      <Tube a={A.S} b={A.e} w={17} />
      <Tube a={A.e} b={A.w} w={15} />
      <circle cx={A.e[0]} cy={A.e[1]} r={10} fill="url(#porc)" />
      <Gripper w={A.w} e={A.e} open={g} side={side} held={held} />
      <circle cx={A.S[0]} cy={A.S[1]} r={17} fill="url(#porc)" />
    </g>
  );
  // the arm on the far side of the turn is drawn behind the body
  const behind = turn >= 0 ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
      <Shadow x={0} y={2} rx={78} ry={13} />
      {legs.map(({ h, k, f }, i) => (
        <g key={i}>
          <Tube a={h} b={k} w={20} />
          <Tube a={k} b={f} w={18} />
          <circle cx={k[0]} cy={k[1]} r={9} fill="url(#porc)" />
          <rect x={f[0] - 18 + (i ? 4 : -4)} y={f[1] - 12} width={36} height={14} rx={7} fill="url(#graph)" />
        </g>
      ))}
      <g transform={`rotate(${lean} ${pivot})`}>
        {arm(behind === -1 ? L : R, behind as -1 | 1, behind === -1 ? gl : gr, behind === -1 ? inL : inR)}
        <rect x={-30} y={hipY - 20} width={60} height={24} rx={10} fill="url(#graph)" />
        <rect x={-48} y={-200 + drop + bob} width={96} height={108} rx={32} fill="url(#porc)" />
        {back ? (
          <g opacity={0.7}>{[0, 1, 2].map((k) => <rect key={k} x={-22} y={-172 + drop + bob + k * 14} width={44} height={5} rx={2.5} fill={C.porc3} />)}</g>
        ) : (
          <>
            <rect x={-28 + tx * 0.3} y={-178 + drop + bob} width={56} height={40} rx={12} fill="url(#teal)" />
            <circle cx={tx * 0.3} cy={-158 + drop + bob} r={12} fill="url(#glow)" opacity={glow} />
            <circle cx={tx * 0.3} cy={-158 + drop + bob} r={4.5} fill="#BFEDE6" opacity={0.4 + 0.6 * glow} />
          </>
        )}
        <rect x={-11} y={-214 + drop + bob} width={22} height={18} rx={4} fill="url(#graph)" />
        <g transform={`translate(0 ${nod}) rotate(${tilt} 0 ${-208 + drop + bob})`}>
          <g transform={`translate(0 ${drop + bob})`}>
            <g transform={`rotate(${droop * (turn >= 0 ? 1 : -1)} ${tx * 0.4} -298)`}>
              <line x1={tx * 0.4} y1={-298} x2={tx * 0.4} y2={-330} stroke="#2A2F34" strokeWidth={4.5} strokeLinecap="round" />
              <circle cx={tx * 0.4} cy={-334} r={7.5} fill="url(#teal)" />
            </g>
            <circle cx={-61 - tx * 0.5} cy={-254} r={12} fill="url(#graph)" />
            <circle cx={61 - tx * 0.5} cy={-254} r={12} fill="url(#graph)" />
            <rect x={-60} y={-300} width={120} height={92} rx={34} fill="url(#porc)" />
            {back ? (
              <rect x={-30} y={-276} width={60} height={8} rx={4} fill={C.porc3} opacity={0.6} />
            ) : (
              <>
                <rect x={-48 + tx} y={-273} width={96} height={38} rx={19} fill="url(#graph)" />
                <path d={`M ${-36 + tx} ${-263} Q ${-10 + tx} ${-270} ${18 + tx} ${-266}`} stroke="#9FB7B1" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.45} />
              </>
            )}
          </g>
        </g>
        {arm(behind === -1 ? R : L, (-behind) as -1 | 1, behind === -1 ? gr : gl, behind === -1 ? inR : inL)}
      </g>
    </g>
  );
};

/** Walking along x: position, walk phase (one step per 34 px) and stride, from x keys. */
export const track = (T: number, ks: Array<[number, number, string?]>, keysFn: (t: number, k: Array<[number, number, string?]>) => number) => {
  const x = keysFn(T, ks);
  const v = Math.abs(keysFn(T + 0.03, ks) - keysFn(T - 0.03, ks)) / 0.06;
  return { x, walk: x / 34, stride: Math.min(1, v / 140) };
};

/** A small fade-in/out window (0 … 1) for props and text. */
export const win = (t: number, a: number, b: number, fade = 0.25) => Math.min(tween(t, a, a + fade, 0, 1), tween(t, b, b + fade, 1, 0));
