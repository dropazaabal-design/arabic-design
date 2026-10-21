import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { BODY, TITLE } from '../fonts';
import { Figure, ease, joints, mix, mixPose, pose, prog, walk, type Pose } from '../rig';
import B from './beats.json';

// A «ضحكوا عليه…»: the crowd on one cliff laughs and throws bricks at a man on a pillar; every brick
// carries what they said. He catches them, turns the words face down, and builds. At the top the laughter
// stops — and he lowers a ladder to them. Dusk-blue silhouettes, white eyes; one red balloon for the goal.
export const W = 1080, H = 1920;
export const A_FRAMES = Math.round(B.duration * 60);
const C = {
  skyTop: '#5B6679', skyMid: '#3B4457', skyLow: '#232A38', hills: '#313949', hillsFar: '#414A5C', rock: '#12161E', rockEdge: '#1B212C',
  ink: '#05070A', eye: '#F4F7FB', brick: '#2B313D', brickTop: '#3C4555', brickLine: '#1A1F28', word: '#E2E7EE', label: '#AEB8C8',
  balloon: '#D2334A', balloonHi: '#F08A98', medal: '#E8EEF5', ribbon: '#B82A42', rope: '#C9D1DC', text: '#F4F7FB', textDim: '#AEB8C8',
};
const CLIFF = { x1: 420, top: 1260 }, PILLAR = { x0: 640, x1: 940, top: 1360 }, TOWER = { cx: 790, w: 256, row: 32 };
const GOAL = { x: 760, y: 236 };
const S = 1.15, HERO_X = 790;
const CROWD = [40, 105, 170, 235, 300, 365];
const at = (s: number) => Math.round(s * 60);
type Cam = { x: number; y: number; z: number };
const camMix = (a: Cam, b: Cam, t: number): Cam => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), z: mix(a.z, b.z, t) });

const Sky: React.FC<{ c: Cam }> = ({ c }) => (
  <>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.skyTop} /><stop offset="0.55" stopColor={C.skyMid} /><stop offset="1" stopColor={C.skyLow} /></linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.35" r="0.6"><stop offset="0" stopColor="#7F8AA0" stopOpacity="0.45" /><stop offset="1" stopColor="#7F8AA0" stopOpacity="0" /></radialGradient>
      <filter id="eyeglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    </defs>
    <rect x={0} y={0} width={W} height={H} fill="url(#sky)" />
    <rect x={0} y={0} width={W} height={H} fill="url(#glow)" />
    {/* far hills move a little with the camera (parallax) */}
    <g transform={`translate(${-(c.x - 420) * 0.12} ${-(c.y - 1000) * 0.05})`}>
      <path d="M-200 1250 L60 1060 L240 1170 L470 980 L700 1140 L900 1020 L1280 1220 L1280 1600 L-200 1600 Z" fill={C.hillsFar} opacity={0.7} />
      <path d="M-200 1380 L120 1210 L330 1300 L560 1180 L820 1290 L1050 1200 L1280 1330 L1280 1700 L-200 1700 Z" fill={C.hills} opacity={0.85} />
    </g>
  </>
);

const Brick: React.FC<{ word?: string; flip?: number }> = ({ word, flip = 0 }) => {
  const sy = Math.cos(flip * Math.PI);
  return (
    <g transform={`scale(1 ${Math.abs(sy) < 0.05 ? 0.05 : sy})`}>
      <rect x={-32} y={-15} width={64} height={30} rx={4} fill={C.brick} stroke={C.brickLine} strokeWidth={2} />
      <rect x={-30} y={-13} width={60} height={6} rx={3} fill={C.brickTop} />
      {word && sy > 0 && <foreignObject x={-48} y={-14} width={96} height={30}>
        <div dir="rtl" lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: word.length > 6 ? 13 : 16, color: C.word, textAlign: 'center', lineHeight: '28px', whiteSpace: 'nowrap' }}>{word}</div>
      </foreignObject>}
    </g>
  );
};

/** Rows of bricks on the pillar, with a word painted on each fifth of the tower as it passes. */
const Tower: React.FC<{ rows: number; labels: { row: number; text: string; o: number }[] }> = ({ rows, labels }) => {
  const full = Math.floor(rows), part = rows - full;
  const out: React.ReactNode[] = [];
  for (let r = 0; r < Math.ceil(rows); r++) {
    const y = PILLAR.top - (r + 1) * TOWER.row;
    const n = 4, off = r % 2 ? TOWER.row : 0;
    for (let k = 0; k < n; k++) {
      const visible = r < full || k < Math.round(part * n);
      if (!visible) continue;
      const x = TOWER.cx - TOWER.w / 2 + k * 64 + (off ? 32 : 0);
      const w = off && k === n - 1 ? 32 : 64;
      out.push(<rect key={`${r}-${k}`} x={x} y={y} width={w} height={TOWER.row} fill={C.brick} stroke={C.brickLine} strokeWidth={2} />);
      if (off && k === 0) out.push(<rect key={`${r}-h`} x={TOWER.cx - TOWER.w / 2} y={y} width={32} height={TOWER.row} fill={C.brick} stroke={C.brickLine} strokeWidth={2} />);
    }
  }
  return <g>
    {out}
    {labels.map((l) => l.o > 0 && <foreignObject key={l.text} x={TOWER.cx - TOWER.w / 2 + 8} y={PILLAR.top - (l.row + 1) * TOWER.row - 6} width={TOWER.w - 16} height={44} opacity={l.o}>
      <div dir="rtl" lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 30, color: C.label, textAlign: 'right', whiteSpace: 'nowrap' }}>— {l.text}</div>
    </foreignObject>)}
  </g>;
};

const Ground: React.FC = () => (
  <g>
    <path d={`M-400 ${CLIFF.top} L${CLIFF.x1} ${CLIFF.top} L${CLIFF.x1 + 16} ${CLIFF.top + 60} L${CLIFF.x1 - 8} ${CLIFF.top + 140} L${CLIFF.x1 + 10} ${CLIFF.top + 260} L${CLIFF.x1 - 20} 3200 L-400 3200 Z`} fill={C.rock} />
    <path d={`M-400 ${CLIFF.top} L${CLIFF.x1} ${CLIFF.top}`} stroke={C.rockEdge} strokeWidth={6} />
    <path d={`M${PILLAR.x0} ${PILLAR.top} L${PILLAR.x1} ${PILLAR.top} L${PILLAR.x1 + 14} ${PILLAR.top + 120} L${PILLAR.x1 - 6} 3200 L${PILLAR.x0 + 10} 3200 L${PILLAR.x0 - 14} ${PILLAR.top + 160} Z`} fill={C.rock} />
    <path d={`M${PILLAR.x0} ${PILLAR.top} L${PILLAR.x1} ${PILLAR.top}`} stroke={C.rockEdge} strokeWidth={6} />
  </g>
);

const Goal: React.FC<{ f: number; held: boolean; hand: [number, number] }> = ({ f, held, hand }) => {
  const sway = Math.sin(f / 26) * 10;
  const medal: [number, number] = held ? hand : [GOAL.x + sway * 0.4, GOAL.y + Math.sin(f / 31) * 6];
  const bal: [number, number] = [medal[0] + sway, medal[1] - 150];
  return <g>
    <path d={`M${medal[0]} ${medal[1] - 18} Q${(medal[0] + bal[0]) / 2 + 8} ${(medal[1] + bal[1]) / 2} ${bal[0]} ${bal[1] + 34}`} fill="none" stroke={C.rope} strokeWidth={2.5} />
    <ellipse cx={bal[0]} cy={bal[1]} rx={30} ry={36} fill={C.balloon} />
    <ellipse cx={bal[0] - 10} cy={bal[1] - 12} rx={8} ry={11} fill={C.balloonHi} opacity={0.6} />
    <path d={`M${bal[0] - 5} ${bal[1] + 36} L${bal[0] + 5} ${bal[1] + 36} L${bal[0]} ${bal[1] + 30} Z`} fill={C.balloon} />
    <g transform={`translate(${medal[0]} ${medal[1]})`}>
      <path d="M-10 -22 L0 -4 L10 -22" fill="none" stroke={C.ribbon} strokeWidth={6} />
      <circle r={16} fill={C.medal} />
      <path d="M0 -9 L2.6 -2.8 L9 -2.8 L3.8 1.2 L5.8 7.6 L0 3.8 L-5.8 7.6 L-3.8 1.2 L-9 -2.8 L-2.6 -2.8 Z" fill={C.ribbon} />
    </g>
  </g>;
};

/** One thrown brick in flight: a parabola from a hand to a target, spinning. */
const flight = (f: number, t0: number, dur: number, from: [number, number], to: [number, number], arc = 260) => {
  const t = (f / 60 - t0) / dur;
  if (t < 0 || t > 1) return null;
  return { x: mix(from[0], to[0], t), y: mix(from[1], to[1], t) - arc * 4 * t * (1 - t), t };
};

const Text: React.FC<{ text: string; o: number; top: number; size: number; color?: string; weight?: number }> = ({ text, o, top, size, color = C.text, weight = 800 }) =>
  o <= 0 ? null : <div dir="rtl" lang="ar" style={{ position: 'absolute', top, left: 90, right: 90, textAlign: 'center', fontFamily: TITLE, fontWeight: weight, fontSize: size, lineHeight: 1.25, color, opacity: o,
    transform: `translateY(${mix(26, 0, o)}px) scale(${mix(0.94, 1, o)})`, textShadow: '0 4px 24px rgba(5,7,10,0.65)' }}>{text}</div>;

const Laughs: React.FC<{ f: number; c: Cam }> = ({ f, c }) => <>{B.laughs.map((t, k) => {
  const o = prog(f, at(t), 6, ease.back) * (1 - prog(f, at(t) + 34, 10));
  if (o <= 0) return null;
  const wx = CROWD[(k * 2 + 1) % CROWD.length] + 30, wy = CLIFF.top - 470 - (k % 2) * 60;
  const sx = (wx - c.x) * c.z + W / 2, sy = (wy - c.y) * c.z + H / 2;
  return <div key={k} dir="rtl" lang="ar" style={{ position: 'absolute', left: sx - 160, top: sy - 60, width: 320, textAlign: 'center', fontFamily: TITLE, fontWeight: 800,
    fontSize: 70 + (k % 3) * 16, color: C.text, opacity: o, transform: `rotate(${(k % 2 ? -1 : 1) * 8}deg) scale(${mix(0.6, 1, o)})` }}>{k % 2 ? 'ههههه' : 'ههههههه'}</div>;
})}</>;

const WORDS = ['فاشل', 'مستحيل', 'ما بتقدر', 'انسَ', 'حلم', 'خلّك واقعي'];
type Throw = { t: number; who: number };
// every throw the crowd makes: the first volley, the brick he catches, then the ones he builds with (flight 0.5 s)
const THROWS: Throw[] = [...B.volley.map((v) => ({ t: v.t0, who: v.who })), { t: B.catch.arrive - 0.55, who: 5 }, ...B.riseThrows.map((t, k) => ({ t: t - 0.5, who: (k * 5 + 1) % 6 }))];
const RELEASE: [number, number] = [44, -262]; // the throwing hand at release, character space
const release = (i: number): [number, number] => [CROWD[i] + RELEASE[0] * S, CLIFF.top + RELEASE[1] * S];

export const ReelA: React.FC = () => {
  const f = useCurrentFrame();
  const shot = [...B.shots].reverse().find(([, t]) => f >= at(t as number))![0] as string;
  const idx = (name: string) => B.shots.findIndex(([n]) => n === name);
  const shotStart = (name: string) => at(B.shots[idx(name)][1] as number);
  const shotEnd = (name: string) => (idx(name) + 1 < B.shots.length ? at(B.shots[idx(name) + 1][1] as number) : at(B.duration));
  const local = (name: string) => prog(f, shotStart(name), shotEnd(name) - shotStart(name), (t) => t);

  // the tower
  const R = B.rise;
  const rows = f < at(B.catch.place) ? 0 : f < at(R.from) ? 0.25 : Math.min(R.rows, 0.25 + (R.rows - 0.25) * Math.pow(prog(f, at(R.from), at(R.to) - at(R.from), (t) => t), 0.92));
  const topY = PILLAR.top - Math.floor(rows) * TOWER.row;
  const labels = R.labels.map(([row, text]) => ({ row: row as number, text: text as string, o: rows >= (row as number) + 1.5 ? 1 : 0 }));
  const heroY = rows >= 1 ? topY : PILLAR.top;

  // ——— hero (faces the crowd: −x) ———
  const St = B.stairs;
  const L0: [number, number] = [TOWER.cx - TOWER.w / 2 + 6, topY - 10];
  const kneelX = L0[0] + 76 * S;
  const wk = walk(f, 0, HERO_X - kneelX, at(St.walk), at(St.kneel) - at(St.walk), 36);
  const heroX = HERO_X - wk.x;
  const toChar = (q: [number, number]): [number, number] => [(heroX - q[0]) / S, (q[1] - heroY) / S];
  const grab = at(B.summit.grab);
  const buildPhase = f >= at(R.from) && f < at(R.to);
  const ready = pose({ head: -8, handF: [46, -172], handN: [34, -168] });
  const catchP = pose({ head: -14, lean: -4, handF: [54, -206], handN: [42, -202] });
  const place = pose({ lean: 50, crouch: 24, head: 8, handF: [66, -40], handN: [54, -38] });
  let hp: Pose;
  let holding = false;
  if (f < at(B.catch.arrive) - 8) hp = pose({ lean: shot === 'wide' ? -4 + 3 * Math.sin(f / 9) : 0, head: -6, shF: 20, elF: 30, shN: -14, elN: 20 });
  else if (f < at(B.catch.place) - 6) { hp = mixPose(pose({ head: -6, shF: 20, elF: 30, shN: -14, elN: 20 }), pose({ head: 16, handF: [56, -176], handN: [40, -172] }), prog(f, at(B.catch.arrive) - 8, 8)); holding = f >= at(B.catch.arrive); }
  else if (f < at(R.from)) { hp = mixPose(mixPose(pose({ head: 16, handF: [56, -176], handN: [40, -172] }), place, prog(f, at(B.catch.place) - 6, 8)), ready, prog(f, at(B.catch.place) + 6, 10)); holding = f < at(B.catch.place); }
  else if (buildPhase) {
    // catch → set it at his feet → ready, once per brick
    const arrivals = B.riseThrows.map(at);
    const next = arrivals.find((a) => a + 14 > f) ?? arrivals[arrivals.length - 1];
    const a = prog(f, next - 6, 5), b = prog(f, next + 2, 5), c = prog(f, next + 8, 6);
    hp = mixPose(mixPose(mixPose(ready, catchP, a), place, b), ready, c);
    holding = f >= next && f < next + 7;
  } else if (f < at(St.walk)) {
    // he looks up, reaches with the far hand (behind his head, never across his face) and takes it
    const up = prog(f, grab - 16, 14, ease.out), hi = prog(f, grab + 4, 16, ease.out);
    const g = toChar([GOAL.x, GOAL.y]);
    hp = pose({ head: mix(-6, -22, up), shF: 14, elF: 24, handN: up > 0 ? [mix(30, g[0], up) - 6 * hi, mix(-170, g[1], up) - 30 * hi] : undefined });
  } else {
    const k = prog(f, at(St.kneel) - 4, 14, ease.inOut);
    const lt = toChar(L0);
    const walking = pose({ head: 6, bob: wk.bob, footF: wk.footF, footN: wk.footN, handN: [24, -306], shF: 16, elF: 20 });
    const kneel = pose({ lean: 46, crouch: 56, head: 26, footF: [20, 0], footN: [-34, 0], handN: [70, -120], handF: [lt[0], lt[1]] });
    hp = mixPose(walking, kneel, k);
  }
  const hj = joints(hp);
  const wristN: [number, number] = [heroX - hj.armN.wrist[0] * S, heroY + hj.armN.wrist[1] * S];

  // ——— crowd (faces +x) ———
  const crowdPose = (i: number): { p: Pose; eyes: 'laugh' | 'open' | 'shock'; brick?: string; side?: boolean } => {
    const word = WORDS[i % WORDS.length];
    const k = Math.sin(f / 4 + i * 1.3);
    const front = i % 2 ? pose({ shF: 84, elF: 4 }) : pose({ handF: [28, -136] }); // pointing, or holding his belly
    if (f < at(1.7)) return { p: { ...front, lean: -8 + 6 * k, head: -12 + 8 * k, bob: 3 * Math.abs(k), handN: [-6, -302] }, eyes: 'laugh', brick: word };
    if (f < at(B.silent.stop)) {
      const mine = THROWS.filter((q) => q.who === i).map((q) => at(q.t));
      const t = mine.find((q) => q + 16 > f);
      const wind = t === undefined ? 0 : prog(f, t - 12, 9) * (1 - prog(f, t - 3, 3));
      const rel = t === undefined ? 0 : prog(f, t - 3, 4) * (1 - prog(f, t + 6, 10));
      const hand: [number, number] = [mix(mix(-6, -40, wind), RELEASE[0], rel), mix(mix(-302, -286, wind), RELEASE[1], rel)];
      const fading = f > at(R.to) - 40;
      return { p: { ...front, lean: -5 + 3 * k + 10 * rel, head: -12, handN: hand }, eyes: fading ? 'open' : 'laugh', brick: t !== undefined && f >= t - 1 && f < t + 18 ? undefined : word };
    }
    if (i === 5 && f >= at(St.climb)) return { p: pose(), eyes: 'open' };
    return { p: pose({ head: -24 - (i % 2) * 6, shF: 6, elF: 8, shN: -4, elN: 6 }), eyes: 'shock', brick: i === 2 ? undefined : word, side: true };
  };
  // the first of them climbs: up the ladder a little way before the end
  const L1: [number, number] = [CLIFF.x1 - 30, CLIFF.top + 2];
  const lu: [number, number] = [(L0[0] - L1[0]) / Math.hypot(L0[0] - L1[0], L0[1] - L1[1]), (L0[1] - L1[1]) / Math.hypot(L0[0] - L1[0], L0[1] - L1[1])];
  const climbUp = prog(f, at(St.climb) + 18, at(B.duration) - at(St.climb) - 18, (t) => t) * 120;
  const climber = (() => {
    const base: [number, number] = [L1[0] - 12 + lu[0] * climbUp, L1[1] + lu[1] * climbUp - 2];
    const rung = (d: number): [number, number] => [(L1[0] + lu[0] * (climbUp + d) - base[0]) / S, (L1[1] + lu[1] * (climbUp + d) - base[1]) / S];
    const step = Math.sin(climbUp / 18);
    return { at: base, p: pose({ head: -28, lean: 10, handF: rung(250 + 14 * step), handN: rung(214 - 14 * step), footF: rung(46 + 16 * Math.max(0, step)), footN: [-8, 0] }) };
  })();

  // ——— cameras ———
  const topCam = (y: number): Cam => ({ x: 560, y: y - 60, z: 0.95 });
  const cams: Record<string, Cam> = {
    crowd: camMix({ x: 200, y: 1090, z: 1.85 }, { x: 220, y: 1080, z: 1.95 }, local('crowd')),
    wide: camMix({ x: 430, y: 980, z: 0.74 }, { x: 440, y: 960, z: 0.72 }, local('wide')),
    catch: camMix({ x: 760, y: 1170, z: 1.75 }, { x: 770, y: 1150, z: 1.85 }, local('catch')),
    rise: topCam(topY),
    summit: camMix({ x: 770, y: 360, z: 1.45 }, { x: 772, y: 345, z: 1.55 }, local('summit')),
    silent: camMix({ x: 210, y: 1080, z: 1.95 }, { x: 205, y: 1070, z: 2.08 }, local('silent')),
    stairs: camMix({ x: 482, y: 694, z: 0.92 }, { x: 478, y: 700, z: 0.98 }, local('stairs')),
  };
  const c = cams[shot];
  const flash = 1 - prog(f, at(B.summit.flash), 22);
  const shake = shot === 'summit' && f >= at(B.summit.flash) ? Math.sin(f * 1.7) * 6 * (1 - prog(f, at(B.summit.flash), 14)) : 0;

  // ——— the rope ladder: unrolls from the edge under his hand down to their cliff ———
  const lad = prog(f, at(St.unroll), at(St.land) - at(St.unroll), ease.in);
  const ladEnd: [number, number] = [mix(L0[0], L1[0], lad), mix(L0[1], L1[1], lad)];
  const ladder = lad > 0 && (() => {
    const len = Math.hypot(ladEnd[0] - L0[0], ladEnd[1] - L0[1]);
    const ux = (ladEnd[0] - L0[0]) / len, uy = (ladEnd[1] - L0[1]) / len, nx = -uy * 22, ny = ux * 22;
    const sag = (t: number) => Math.sin(t * Math.PI) * 26 * lad;
    const pt = (t: number, side: number) => [L0[0] + (ladEnd[0] - L0[0]) * t + nx * side, L0[1] + (ladEnd[1] - L0[1]) * t + ny * side + sag(t)];
    const rail = (side: number) => Array.from({ length: 21 }, (_, k) => { const [x, y] = pt(k / 20, side); return `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join(' ');
    const rungs = Math.floor(len / 42);
    return <g>
      <path d={rail(1)} fill="none" stroke={C.rope} strokeWidth={5} strokeLinecap="round" />
      <path d={rail(-1)} fill="none" stroke={C.rope} strokeWidth={5} strokeLinecap="round" />
      {Array.from({ length: rungs }, (_, k) => {
        const t = (k + 0.5) / rungs, [ax, ay] = pt(t, 1), [bx, by] = pt(t, -1);
        return <path key={k} d={`M${ax} ${ay} L${bx} ${by}`} stroke={C.rope} strokeWidth={6} strokeLinecap="round" />;
      })}
    </g>;
  })();

  // ——— bricks in flight ———
  const flying: React.ReactNode[] = [];
  B.volley.forEach((v, k) => {
    const q = flight(f, v.t0, v.dur, release(v.who), v.to as [number, number], 300);
    if (q) flying.push(<g key={`v${k}`} transform={`translate(${q.x} ${q.y}) rotate(${q.t * v.spin})`}><Brick word={v.word} /></g>);
  });
  {
    const q = flight(f, B.catch.arrive - 0.55, 0.55, release(5), [HERO_X - 56 * S, PILLAR.top - 176 * S], 140);
    if (q) flying.push(<g key="c" transform={`translate(${q.x} ${q.y}) rotate(${q.t * 360})`}><Brick word={B.catch.word} /></g>);
  }
  B.riseThrows.forEach((t0, k) => {
    const q = flight(f, t0 - 0.5, 0.5, release((k * 5 + 1) % 6), [HERO_X - 54 * S, heroY - 206 * S], 120 + (k % 3) * 40);
    if (q) flying.push(<g key={`r${k}`} transform={`translate(${q.x} ${q.y}) rotate(${q.t * 360})`}><Brick word={WORDS[k % WORDS.length]} /></g>);
  });
  // what he holds: the caught brick turns face down before it is set; later ones are set straight away
  const flip = f < at(R.from) ? prog(f, at(B.catch.flip), 14, ease.inOut) : 1;
  const heldBrick = holding ? <Brick word={B.catch.word} flip={flip} /> : undefined;
  // bricks that fell short and lie on his pillar
  const fallen = B.volley.filter((v) => f / 60 > v.t0 + v.dur && v.to[1] === 1340 && v.to[0] > PILLAR.x0 + 30).map((v, k) => <g key={k} transform={`translate(${v.to[0]} ${PILLAR.top - 15}) rotate(${k % 2 ? 8 : -6})`}><Brick /></g>);
  // the brick that slips from a silenced hand
  const dropT = prog(f, at(B.silent.drop), 16, ease.in);
  const dropped = f >= at(B.silent.drop) - 1 && f < at(St.walk) ? <g transform={`translate(${CROWD[2] + 30} ${mix(CLIFF.top - 110, CLIFF.top - 15, dropT)}) rotate(${dropT * 40})`}><Brick word="فاشل" /></g> : null;
  const lying = f >= at(St.walk) ? <g transform={`translate(${CROWD[2] + 30} ${CLIFF.top - 15}) rotate(40)`}><Brick word="فاشل" /></g> : null;

  const world = (
    <g transform={`translate(${W / 2 + shake} ${H / 2}) scale(${c.z}) translate(${-c.x} ${-c.y})`}>
      <Ground />
      {fallen}
      <Tower rows={rows} labels={labels} />
      {ladder}
      <Goal f={f} held={f >= grab} hand={wristN} />
      {lying}
      {CROWD.map((x, i) => {
        if (i === 5 && f >= at(St.climb)) return <g key={i} filter="url(#eyeglow)"><Figure p={climber.p} x={climber.at[0]} y={climber.at[1]} s={S} eyes="open" color={C.ink} eyeColor={C.eye} look={[0.5, -1]} /></g>;
        const { p, eyes, brick, side } = crowdPose(i);
        const pp = side ? { ...p, handN: [6, -96] as [number, number] } : p;
        return <g key={i} filter="url(#eyeglow)"><Figure p={pp} x={x} y={CLIFF.top} s={S} facing={1} eyes={eyes} color={C.ink} eyeColor={C.eye} look={eyes === 'shock' ? [0.6, -0.8] : [0.6, 0]} held={{ N: brick ? <Brick word={brick} /> : undefined }} /></g>;
      })}
      <g filter="url(#eyeglow)"><Figure p={hp} x={heroX} y={heroY} s={S} facing={-1} eyes="open" color={C.ink} eyeColor={C.eye} look={f >= grab && f < at(St.kneel) ? [0.4, -0.6] : [0.8, 0.2]} held={{ F: heldBrick }} /></g>
      {flying}
      {dropped}
    </g>
  );

  const say1 = prog(f, at(0.2), 12) * (1 - prog(f, at(2.6), 12));
  const say2 = prog(f, at(B.summit.text), 10) * (1 - prog(f, at(B.silent.stop) - 4, 8));
  const end1 = prog(f, at(St.text1), 14), end2 = prog(f, at(St.text2), 12, ease.back), sign = prog(f, at(St.sign), 14);
  return (
    <AbsoluteFill style={{ background: C.skyLow }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        <Sky c={c} />
        {world}
        <rect x={0} y={0} width={W} height={H} fill="#FFFFFF" opacity={f >= at(B.summit.flash) ? flash * 0.55 : 0} />
      </svg>
      {(shot === 'crowd' || shot === 'wide') && <Laughs f={f} c={c} />}
      <Text text="ضحكوا عليه…" o={say1} top={1400} size={120} />
      <Text text="…وصل." o={say2} top={240} size={130} />
      <Text text="وأول ما وصل…" o={end1} top={226} size={88} color={C.textDim} />
      <Text text="نزّل لهم سلّم." o={end2} top={340} size={124} />
      <Text text="كتاب وبس" o={sign * 0.85} top={1560} size={40} weight={700} color={C.textDim} />
      <Audio src={staticFile('audio/a-mix.wav')} />
    </AbsoluteFill>
  );
};
