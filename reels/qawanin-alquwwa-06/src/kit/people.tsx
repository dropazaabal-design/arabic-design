import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, INK, W, bob, ease } from './draw';
import timing from '../timing.json';

// One figure for everyone: a big round white head, two vertical line eyes, outlined limbs, clothes that say the role.
// Local coordinates: feet at (0,0), head top near y = -600. Arms are two-bone IK chains aimed at a hand target.

export type Expr = 'neutral' | 'happy' | 'smug' | 'worried' | 'surprised' | 'angry' | 'sad' | 'think';
export type Head = 'shemagh' | 'hair' | 'hairLong' | 'hijab' | 'bald' | 'greek' | 'roman' | 'mongol' | 'topknot' | 'cap' | 'pilot' | 'fire' | 'general' | 'curly' | 'king';
export type Outfit = 'thobe' | 'shirt' | 'suit' | 'robe' | 'armour' | 'dress';
type P2 = [number, number];
/** Hand targets relative to the hip centre at (0,-200) feel awkward; they are given in figure space directly. */
export type Pose = { l: P2; r: P2 };

export const POSES: Record<string, Pose> = {
  idle: { l: [-74, -158], r: [74, -158] },
  point: { l: [-74, -158], r: [215, -420] },          // points to the figure's right (screen right when facing 1)
  pointUp: { l: [-74, -158], r: [150, -560] },
  present: { l: [-74, -158], r: [175, -300] },
  both: { l: [-175, -300], r: [175, -300] },           // open both palms (shrug / "here it is")
  shrug: { l: [-140, -330], r: [140, -330] },
  think: { l: [-60, -250], r: [-10, -398] },           // hand on chin
  facepalm: { l: [-74, -158], r: [10, -445] },
  wave: { l: [-74, -158], r: [150, -540] },
  cheer: { l: [-150, -560], r: [150, -560] },
  hold: { l: [-55, -285], r: [55, -285] },             // holding something in front
  hips: { l: [-95, -250], r: [95, -250] },
  stop: { l: [-74, -158], r: [190, -380] },
  cross: { l: [45, -300], r: [-45, -300] },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  l: [lerp(a.l[0], b.l[0], t), lerp(a.l[1], b.l[1], t)], r: [lerp(a.r[0], b.r[0], t), lerp(a.r[1], b.r[1], t)],
});

const UPPER = 100, FORE = 96;
function ik(s: P2, t: P2, out: number): [P2, P2] {
  const dx = t[0] - s[0], dy = t[1] - s[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), 30), UPPER + FORE - 1);
  const th = Math.atan2(dy, dx);
  const a = Math.acos((UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d));
  const e1: P2 = [s[0] + UPPER * Math.cos(th + a), s[1] + UPPER * Math.sin(th + a)];
  const e2: P2 = [s[0] + UPPER * Math.cos(th - a), s[1] + UPPER * Math.sin(th - a)];
  const elbow = (e1[0] - s[0]) * out > (e2[0] - s[0]) * out ? e1 : e2;  // elbow away from the body
  const hand: P2 = [s[0] + d * Math.cos(th), s[1] + d * Math.sin(th)];
  return [elbow, hand];
}

const Limb: React.FC<{ pts: P2[]; color: string; w?: number }> = ({ pts, color, w = 24 }) => {
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return <g><path d={d} fill="none" stroke={INK} strokeWidth={w + W * 2} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" /></g>;
};

const Face: React.FC<{ expr: Expr; blink: boolean; mouth: number }> = ({ expr, blink, mouth }) => {
  const ey = -452, eh = expr === 'surprised' ? 30 : 24;
  const eyes = blink
    ? <g stroke={INK} strokeWidth={6} strokeLinecap="round"><path d="M-34 -448 L-18 -448" /><path d="M18 -448 L34 -448" /></g>
    : <g stroke={INK} strokeWidth={8} strokeLinecap="round"><path d={`M-25 ${ey - eh / 2} L-25 ${ey + eh / 2}`} /><path d={`M25 ${ey - eh / 2} L25 ${ey + eh / 2}`} /></g>;
  const brows: Record<Expr, string> = {
    neutral: '', happy: 'M-38 -486 Q-25 -494 -12 -486 M12 -486 Q25 -494 38 -486',
    smug: 'M-38 -482 L-12 -486 M12 -492 L38 -484', worried: 'M-40 -478 L-12 -490 M12 -490 L40 -478',
    surprised: 'M-38 -494 Q-25 -504 -12 -494 M12 -494 Q25 -504 38 -494', angry: 'M-40 -492 L-12 -480 M12 -480 L40 -492',
    sad: 'M-40 -478 L-12 -488 M12 -488 L40 -478', think: 'M-38 -486 L-12 -486 M12 -494 L38 -488',
  };
  const open = mouth > 0.18;
  const mouths: Record<Expr, string> = {
    neutral: 'M-14 -410 L14 -410', happy: 'M-22 -414 Q0 -396 22 -414', smug: 'M-16 -408 Q6 -404 22 -416',
    worried: 'M-16 -404 Q0 -412 16 -404', surprised: '', angry: 'M-18 -404 Q0 -414 18 -404', sad: 'M-18 -402 Q0 -414 18 -402',
    think: 'M-10 -408 L16 -412',
  };
  return <g>
    {eyes}
    {brows[expr] && <path d={brows[expr]} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />}
    {expr === 'surprised' ? <ellipse cx={0} cy={-406} rx={11} ry={14} fill={INK} />
      : open ? <ellipse cx={0} cy={-408} rx={16} ry={4 + mouth * 12} fill={INK} />
        : <path d={mouths[expr]} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />}
  </g>;
};

const headR = 82, HY = -440;

const HeadBack: React.FC<{ head: Head; c: string }> = ({ head, c }) => {
  if (head === 'shemagh') return <path d={`M-96 ${HY - 40} Q-110 ${HY + 70} -120 ${HY + 150} L-60 ${HY + 120} L60 ${HY + 120} L120 ${HY + 150} Q110 ${HY + 70} 96 ${HY - 40} Z`} fill={C.red} stroke={INK} strokeWidth={W} strokeLinejoin="round" />;
  if (head === 'hijab') return <path d={`M-98 ${HY - 10} Q-112 ${HY + 90} -110 ${HY + 140} L110 ${HY + 140} Q112 ${HY + 90} 98 ${HY - 10} Z`} fill={c} stroke={INK} strokeWidth={W} strokeLinejoin="round" />;
  if (head === 'king') return <g>{[-1, 1].map((k) => [0, 1, 2, 3].map((i) => <circle key={`${k}${i}`} cx={k * (78 + (i % 2) * 14)} cy={HY - 30 + i * 46} r={34} fill={c} stroke={INK} strokeWidth={W} />))}</g>;
  if (head === 'hairLong') return <path d={`M-88 ${HY - 20} Q-100 ${HY + 80} -84 ${HY + 120} L84 ${HY + 120} Q100 ${HY + 80} 88 ${HY - 20} Z`} fill={c} stroke={INK} strokeWidth={W} strokeLinejoin="round" />;
  return null;
};

const HeadFront: React.FC<{ head: Head; c: string }> = ({ head, c }) => {
  const s = { stroke: INK, strokeWidth: W, strokeLinejoin: 'round' as const };
  switch (head) {
    case 'shemagh': return <g>
      <path d={`M-98 ${HY + 30} Q-104 ${HY - 112} 0 ${HY - 114} Q104 ${HY - 112} 98 ${HY + 30} Q86 ${HY - 46} 0 ${HY - 50} Q-86 ${HY - 46} -98 ${HY + 30} Z`} fill={C.red} {...s} />
      {[-64, -32, 0, 32, 64].map((x) => <path key={x} d={`M${x * 0.9} ${HY - 108} L${x * 1.1} ${HY - 52}`} stroke="#fff" strokeWidth={3} opacity={0.7} />)}
      <path d={`M-84 ${HY - 84} Q0 ${HY - 110} 84 ${HY - 84}`} stroke="#fff" strokeWidth={3} fill="none" opacity={0.7} />
      <path d={`M-90 ${HY - 70} Q0 ${HY - 104} 90 ${HY - 70}`} stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
      <path d={`M-90 ${HY - 70} Q0 ${HY - 104} 90 ${HY - 70}`} stroke={C.black} strokeWidth={10} fill="none" strokeLinecap="round" />
    </g>;
    case 'hair': return <path d={`M-80 ${HY - 10} Q-88 ${HY - 92} 0 ${HY - 90} Q88 ${HY - 92} 80 ${HY - 10} Q62 ${HY - 52} 20 ${HY - 56} Q-40 ${HY - 40} -80 ${HY - 10} Z`} fill={c} {...s} />;
    case 'curly': return <g>{[-60, -30, 0, 30, 60].map((x, i) => <circle key={x} cx={x} cy={HY - 70 + Math.abs(x) * 0.25} r={30} fill={c} {...s} />)}</g>;
    case 'hairLong': return <path d={`M-82 ${HY + 10} Q-90 ${HY - 94} 0 ${HY - 92} Q90 ${HY - 94} 82 ${HY + 10} Q70 ${HY - 50} 0 ${HY - 54} Q-70 ${HY - 50} -82 ${HY + 10} Z`} fill={c} {...s} />;
    case 'hijab': return <path d={`M-96 ${HY + 40} Q-104 ${HY - 104} 0 ${HY - 106} Q104 ${HY - 104} 96 ${HY + 40} Q84 ${HY - 66} 0 ${HY - 68} Q-84 ${HY - 66} -96 ${HY + 40} Z`} fill={c} {...s} />;
    case 'topknot': return <g>
      <path d={`M-78 ${HY - 20} Q-84 ${HY - 90} 0 ${HY - 88} Q84 ${HY - 90} 78 ${HY - 20} Q40 ${HY - 60} 0 ${HY - 60} Q-40 ${HY - 60} -78 ${HY - 20} Z`} fill={C.black} {...s} />
      <circle cx={0} cy={HY - 104} r={24} fill={C.black} {...s} />
      <path d={`M-18 ${HY + 46} Q-50 ${HY + 70} -46 ${HY + 110} M18 ${HY + 46} Q50 ${HY + 70} 46 ${HY + 110}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>;
    case 'greek': return <g>
      <path d={`M-0 ${HY - 160} Q-90 ${HY - 160} -110 ${HY - 70} L110 ${HY - 70} Q90 ${HY - 160} 0 ${HY - 160}`} fill={C.red} {...s} />
      <path d={`M-88 ${HY + 30} Q-96 ${HY - 100} 0 ${HY - 100} Q96 ${HY - 100} 88 ${HY + 30} L58 ${HY + 30} L58 ${HY - 30} L-58 ${HY - 30} L-58 ${HY + 30} Z`} fill={C.gold} {...s} />
    </g>;
    case 'roman': return <g>
      <path d={`M-70 ${HY - 112} Q0 ${HY - 175} 70 ${HY - 112} L60 ${HY - 92} L-60 ${HY - 92} Z`} fill={C.red} {...s} />
      <path d={`M-90 ${HY - 10} Q-96 ${HY - 104} 0 ${HY - 104} Q96 ${HY - 104} 90 ${HY - 10} L110 ${HY - 10} L110 ${HY + 6} L-110 ${HY + 6} L-110 ${HY - 10} Z`} fill={C.stone} {...s} />
      <path d={`M-90 ${HY} L-86 ${HY + 70} L-62 ${HY + 70} L-62 ${HY} M90 ${HY} L86 ${HY + 70} L62 ${HY + 70} L62 ${HY}`} fill={C.stone} {...s} />
    </g>;
    case 'mongol': return <g>
      <path d={`M-70 ${HY - 70} Q0 ${HY - 200} 70 ${HY - 70} Z`} fill={C.red} {...s} />
      <rect x={-96} y={HY - 92} width={192} height={42} rx={21} fill={C.brown} {...s} />
    </g>;
    case 'cap': return <g>
      <path d={`M-84 ${HY - 30} Q-84 ${HY - 110} 0 ${HY - 110} Q84 ${HY - 110} 84 ${HY - 30} Z`} fill={c} {...s} />
      <path d={`M40 ${HY - 34} L150 ${HY - 30} Q150 ${HY - 14} 40 ${HY - 14} Z`} fill={c} {...s} />
    </g>;
    case 'pilot': case 'general': return <g>
      <path d={`M-96 ${HY - 70} Q0 ${HY - 150} 96 ${HY - 70} L84 ${HY - 50} L-84 ${HY - 50} Z`} fill={head === 'pilot' ? C.navy : C.greenDark} {...s} />
      <path d={`M-90 ${HY - 52} L90 ${HY - 52} L110 ${HY - 30} L-110 ${HY - 30} Z`} fill={C.black} {...s} />
      <circle cx={0} cy={HY - 86} r={12} fill={C.gold} {...s} />
    </g>;
    case 'fire': return <g>
      <path d={`M-92 ${HY - 40} Q-92 ${HY - 132} 0 ${HY - 132} Q92 ${HY - 132} 92 ${HY - 40} Z`} fill={C.red} {...s} />
      <path d={`M-120 ${HY - 40} L120 ${HY - 40} L110 ${HY - 20} L-110 ${HY - 20} Z`} fill={C.red} {...s} />
      <rect x={-20} y={HY - 120} width={40} height={50} rx={6} fill={C.gold} {...s} />
    </g>;
    case 'king': return <g>
      {[-60, -20, 20, 60].map((x) => <circle key={x} cx={x} cy={HY - 78 + Math.abs(x) * 0.3} r={30} fill={c} {...s} />)}
      <path d={`M-62 ${HY - 100} L-70 ${HY - 170} L-34 ${HY - 130} L0 ${HY - 182} L34 ${HY - 130} L70 ${HY - 170} L62 ${HY - 100} Z`} fill={C.gold} {...s} />
      {[-36, 0, 36].map((x) => <circle key={x} cx={x} cy={HY - 112} r={7} fill={C.red} />)}
    </g>;
    default: return null;
  }
};

export type PersonProps = {
  x: number; y: number; s?: number; face?: 1 | -1;
  head?: Head; hairColor?: string; top?: string; bottom?: string; outfit?: Outfit;
  pose?: string | Array<[number, string]>; expr?: Expr | Array<[number, Expr]>;
  talk?: boolean; seed?: number; crop?: boolean; idle?: boolean; children?: React.ReactNode; hand?: React.ReactNode;
};

const at = <T,>(v: T | Array<[number, T]>, f: number): [T, T, number] => {
  if (!Array.isArray(v) || (v.length && !Array.isArray(v[0]))) return [v as T, v as T, 1];
  const arr = v as Array<[number, T]>;
  let i = 0;
  while (i + 1 < arr.length && arr[i + 1][0] <= f) i++;
  const prev = i > 0 ? arr[i - 1][1] : arr[0][1];
  return [prev, arr[i][1], arr[i][0] <= f ? ease(f - arr[i][0], 0, 10) : 1];
};

/** A whole figure. `talk` opens the mouth with the narration's loudness. `hand` is drawn at the right hand. */
export const Person: React.FC<PersonProps> = ({
  x, y, s = 1, face = 1, head = 'hair', hairColor = C.black, top = C.blue, bottom = C.navy, outfit = 'shirt',
  pose = 'idle', expr = 'neutral', talk = false, seed = 0, idle = true, children, hand,
}) => {
  const f = useCurrentFrame();
  const [p0, p1, pt] = at(pose, f);
  const P = lerpPose(POSES[p0] ?? POSES.idle, POSES[p1] ?? POSES.idle, pt);
  const [, e1] = at(expr, f);
  const mouth = talk ? (timing.mouth[f] ?? 0) : 0;
  const blink = (f + seed * 37) % 200 < 6;
  const by = idle ? bob(f, 3, 170, seed) : 0;
  const long = outfit === 'thobe' || outfit === 'robe' || outfit === 'dress';
  const shoulderL: P2 = [-56, -338], shoulderR: P2 = [56, -338];
  const [elL, hL] = ik(shoulderL, P.l, -1), [elR, hR] = ik(shoulderR, P.r, 1);
  const sleeve = outfit === 'armour' ? C.stone : top;
  const s2 = { stroke: INK, strokeWidth: W, strokeLinejoin: 'round' as const };
  return (
    <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`}>
      <ellipse cx={0} cy={0} rx={110} ry={16} fill={C.shadow} />
      <g transform={`translate(0 ${by})`}>
        {/* legs */}
        {long ? <>
          <ellipse cx={-30} cy={-8} rx={30} ry={13} fill={outfit === 'thobe' ? C.brown : C.black} {...s2} />
          <ellipse cx={30} cy={-8} rx={30} ry={13} fill={outfit === 'thobe' ? C.brown : C.black} {...s2} />
        </> : <>
          <Limb pts={[[-30, -200], [-34, -14]]} color={bottom} w={36} />
          <Limb pts={[[30, -200], [34, -14]]} color={bottom} w={36} />
          <ellipse cx={-40} cy={-8} rx={34} ry={14} fill={C.black} {...s2} />
          <ellipse cx={40} cy={-8} rx={34} ry={14} fill={C.black} {...s2} />
        </>}
        <HeadBack head={head} c={head === 'hijab' ? hairColor : hairColor} />
        {/* back arm when crossed would sit here; keep both arms after the torso for clarity */}
        {/* torso */}
        {long
          ? <path d="M-62 -350 Q-74 -200 -96 -18 L96 -18 Q74 -200 62 -350 Q0 -372 -62 -350 Z" fill={outfit === 'thobe' ? '#FFFFFF' : top} {...s2} />
          : <path d="M-64 -350 Q-72 -270 -66 -196 L66 -196 Q72 -270 64 -350 Q0 -372 -64 -350 Z" fill={outfit === 'armour' ? C.gold : top} {...s2} />}
        {outfit === 'thobe' && <path d="M0 -352 L0 -280" stroke={INK} strokeWidth={4} />}
        {outfit === 'thobe' && <path d="M-50 -60 Q0 -48 50 -60" stroke={C.shade} strokeWidth={10} fill="none" />}
        {outfit === 'suit' && <g><path d="M-22 -356 L0 -300 L22 -356" fill="#fff" {...s2} /><path d="M0 -330 L-9 -310 L0 -250 L9 -310 Z" fill={C.red} {...s2} /></g>}
        {outfit === 'armour' && <path d="M-60 -300 L60 -300 M-62 -250 L62 -250" stroke={INK} strokeWidth={4} />}
        {outfit === 'robe' && <path d="M-40 -352 L30 -200 L36 -18" stroke={INK} strokeWidth={4} fill="none" />}
        {/* arms */}
        <Limb pts={[shoulderL, elL, hL]} color={outfit === 'thobe' ? '#FFFFFF' : sleeve} w={26} />
        <Limb pts={[shoulderR, elR, hR]} color={outfit === 'thobe' ? '#FFFFFF' : sleeve} w={26} />
        <circle cx={hL[0]} cy={hL[1]} r={17} fill="#fff" {...s2} />
        <circle cx={hR[0]} cy={hR[1]} r={17} fill="#fff" {...s2} />
        {/* head */}
        <circle cx={0} cy={HY} r={headR} fill="#fff" {...s2} />
        <HeadFront head={head} c={hairColor} />
        <Face expr={e1} blink={blink} mouth={mouth} />
        {hand && <g transform={`translate(${hR[0]} ${hR[1]})`}>{hand}</g>}
        {children}
      </g>
    </g>
  );
};

/** The narrator: white thobe, red shemagh with a black agal. Always talks with the voice. */
export const Narrator: React.FC<Omit<PersonProps, 'head' | 'outfit'>> = (p) =>
  <Person head="shemagh" outfit="thobe" talk seed={3} {...p} />;

/** A tiny, simplified person for crowds (no arms posing, no face detail beyond eyes). */
export const Mini: React.FC<{ x: number; y: number; s?: number; c?: string; head?: string; hc?: string; sad?: boolean }> = ({ x, y, s = 1, c = C.blue, head = 'hair', hc = C.black, sad }) => {
  const s2 = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const };
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={30} ry={5} fill={C.shadow} />
    <path d="M-12 -2 L-10 -50 M12 -2 L10 -50" stroke={INK} strokeWidth={8} strokeLinecap="round" />
    <path d="M-22 -100 Q-26 -70 -20 -48 L20 -48 Q26 -70 22 -100 Q0 -108 -22 -100 Z" fill={c} {...s2} />
    <path d="M-22 -96 L-34 -56 M22 -96 L34 -56" stroke={INK} strokeWidth={8} strokeLinecap="round" />
    <circle cx={0} cy={-130} r={27} fill="#fff" {...s2} />
    {head === 'hair' && <path d="M-26 -134 Q-28 -160 0 -160 Q28 -160 26 -134 Q14 -150 0 -150 Q-14 -150 -26 -134 Z" fill={hc} {...s2} />}
    {head === 'hijab' && <path d="M-32 -110 Q-36 -166 0 -166 Q36 -166 32 -110 Q30 -150 0 -152 Q-30 -150 -32 -110 Z" fill={hc} {...s2} />}
    {head === 'greek' && <path d="M-30 -132 Q-30 -164 0 -164 Q30 -164 30 -132 Z M0 -164 Q-20 -186 -36 -170 M0 -164 Q20 -186 36 -170" fill={C.gold} {...s2} />}
    {head === 'roman' && <path d="M-30 -132 Q-30 -164 0 -164 Q30 -164 30 -132 Z" fill={C.stone} {...s2} />}
    {head === 'mongol' && <path d="M-26 -146 Q0 -196 26 -146 Z" fill={C.red} {...s2} />}
    {head === 'persian' && <rect x={-24} y={-170} width={48} height={30} rx={6} fill={C.purple} {...s2} />}
    <path d="M-9 -136 L-9 -126 M9 -136 L9 -126" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    {sad && <path d="M-8 -112 Q0 -118 8 -112" stroke={INK} strokeWidth={3} fill="none" />}
  </g>;
};
