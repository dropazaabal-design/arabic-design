import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { Palm } from '../b/B';
import { BODY, TITLE } from '../fonts';
import { Figure, ease, joints, mix, mixPose, pose, prog, walk, type Pose } from '../rig';
import B from './beats.json';

// C «الضربة 101»: a man strikes a wall that fills the sky; nothing happens. Every strike leaves a chip; a counter runs
// to 100 while days pass and people tell him he is wasting his life. The 101st strike lands where the first did, the
// crack runs through every chip and then the whole wall, and it falls: the first colour in the film is the valley
// behind it. He walks on to the next wall and raises the hammer, which is frame 0 again (the reel loops).
// Grey until the turn; one timeline (beats.json) drives picture and score.
export const W = 1080, H = 1920;
export const C_FRAMES = Math.round(B.duration * 60);
const C = {
  wall: '#2E3136', strata: '#26292D', chip: '#6B7178', chipRim: '#A3A9B1', dust: '#B8BDC4', ground: '#121418', ink: '#07080A', eye: '#F4F7FB',
  night: '#07080B', crack: '#C9FBF4', skyTop: '#3B2F6B', skyMid: '#B4609A', skyLow: '#F2B8C6', sun: '#FDE7EF',
  hillFar: '#7A5A9E', hill: '#4E3A72', field: '#1E7A55', fieldHi: '#2FA36F', river: '#1FA7A0', riverHi: '#7FE0D6',
  text: '#F4F7FB', textDim: '#C3C8CF', pill: 'rgba(7,8,10,0.62)',
};
const { GY, S, DX } = B;
const at = (s: number) => Math.round(s * 60);
type Cam = { x: number; y: number; z: number };
const camMix = (a: Cam, b: Cam, t: number): Cam => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), z: mix(a.z, b.z, t) });
const C0: Cam = { x: 540, y: GY - 490 / 0.9, z: 0.9 }; // frame 0, and (shifted by DX) the last frame
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ——— the wall: a jittered grid whose cells are the shards ———
const G = B.grid;
const P = (i: number, j: number) => G.pts[j * G.cols + i] as [number, number];
const SHARDS = Array.from({ length: (G.cols - 1) * (G.rows - 1) }, (_, n) => {
  const i = n % (G.cols - 1), j = Math.floor(n / (G.cols - 1));
  const q = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
  const c: [number, number] = [q.reduce((s, p) => s + p[0], 0) / 4, q.reduce((s, p) => s + p[1], 0) / 4];
  return { q, c, i, j };
});
const inside = (p: [number, number], q: [number, number][]) => {
  let o = false;
  for (let a = 0, b = q.length - 1; a < q.length; b = a++) {
    if ((q[a][1] > p[1]) !== (q[b][1] > p[1]) && p[0] < ((q[b][0] - q[a][0]) * (p[1] - q[a][1])) / (q[b][1] - q[a][1]) + q[a][0]) o = !o;
  }
  return o;
};
const CHIPS = B.chips.map((p) => ({ p: p as [number, number], shard: SHARDS.findIndex((s) => inside(p as [number, number], s.q)) }));
const FINAL = B.final as [number, number];
const MAXD = Math.max(...SHARDS.map((s) => Math.hypot(s.c[0] - FINAL[0], s.c[1] - FINAL[1])));
// grid edges (the break lines), each with its distance from the final strike
const EDGES: { a: [number, number]; b: [number, number]; d: number }[] = [];
for (let j = 0; j < G.rows; j++) for (let i = 0; i < G.cols; i++) {
  if (i < G.cols - 1) EDGES.push({ a: P(i, j), b: P(i + 1, j), d: 0 });
  if (j < G.rows - 1) EDGES.push({ a: P(i, j), b: P(i, j + 1), d: 0 });
}
EDGES.forEach((e) => { e.d = Math.hypot((e.a[0] + e.b[0]) / 2 - FINAL[0], (e.a[1] + e.b[1]) / 2 - FINAL[1]); });
const MAXE = Math.max(...EDGES.map((e) => e.d));

/** One shard at its place or falling; strata lines meet across shared edges, so the wall reads whole until it breaks. */
const Shard: React.FC<{ q: [number, number][]; fall?: { dx: number; dy: number; r: number; c: [number, number] } }> = ({ q, fall }) => {
  const lerp = (a: [number, number], b: [number, number], t: number) => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
  const lines = [0.22, 0.48, 0.71].map((t) => { const [x1, y1] = lerp(q[0], q[3], t), [x2, y2] = lerp(q[1], q[2], t); return `M${x1} ${y1} L${x2} ${y2}`; }).join(' ');
  const d = `M${q.map((p) => `${p[0]} ${p[1]}`).join(' L')} Z`;
  const g = <><path d={d} fill={C.wall} stroke={C.wall} strokeWidth={2} strokeLinejoin="round" /><path d={lines} stroke={C.strata} strokeWidth={5} /></>;
  return fall ? <g transform={`translate(${fall.dx} ${fall.dy}) rotate(${fall.r} ${fall.c[0]} ${fall.c[1]})`}>{g}</g> : g;
};

/** The valley behind the wall: the first colour in the film. */
const Valley: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="csky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.skyTop} /><stop offset="0.62" stopColor={C.skyMid} /><stop offset="1" stopColor={C.skyLow} /></linearGradient>
      <radialGradient id="csun"><stop offset="0" stopColor={C.sun} /><stop offset="0.55" stopColor={C.sun} stopOpacity="0.9" /><stop offset="1" stopColor={C.sun} stopOpacity="0" /></radialGradient>
    </defs>
    <rect x={-2600} y={-1400} width={4800} height={2660} fill="url(#csky)" />
    <circle cx={540} cy={1215} r={330} fill="url(#csun)" />
    <path d="M-2600 1250 Q-2100 1150 -1600 1235 T-600 1210 T400 1240 T1300 1205 T2200 1245 L2200 1300 L-2600 1300 Z" fill={C.hillFar} />
    <path d="M-2600 1290 Q-1900 1220 -1200 1280 T200 1272 T1400 1265 T2200 1285 L2200 1600 L-2600 1600 Z" fill={C.hill} />
    <rect x={-2600} y={1300} width={4800} height={300} fill={C.field} />
    {[-2300, -1900, -1450, -1000, -560, -120, 330, 790, 1230, 1650].map((x, k) => <path key={k} d={`M${x} 1600 L${x + 220} 1330 L${x + 300} 1330 L${x + 160} 1600 Z`} fill={C.fieldHi} opacity={0.5} />)}
    <path d="M430 1600 C500 1480 620 1420 560 1350 S520 1290 548 1262 L556 1262 C540 1290 600 1330 588 1360 S560 1470 650 1600 Z" fill={C.river} />
    <path d="M500 1600 C560 1490 600 1440 570 1370" fill="none" stroke={C.riverHi} strokeWidth={6} opacity={0.7} strokeDasharray="38 26" strokeDashoffset={f * 1.6} />
    {[[-2050, 0.8], [-1700, 1], [-1260, 0.7], [-830, 1], [-420, 0.85], [60, 1], [1010, 1], [1330, 0.75]].map(([x, g]) => <Palm key={x} x={x} g={g} dates={g > 0.9 ? 1 : 0} y={1330} />)}
  </g>
);

const Hammer: React.FC<{ hand: [number, number]; th: number; s: number; facing: 1 | -1; x: number; y: number }> = ({ hand, th, s, facing, x, y }) => {
  // character space → world; th: 0 = forward, 90 = up, 180 = back
  const r = (th * Math.PI) / 180, L = 150;
  const w = (p: [number, number]): [number, number] => [x + facing * s * p[0], y + s * p[1]];
  const a = w([hand[0] - Math.cos(r) * 14, hand[1] + Math.sin(r) * 14]), b = w([hand[0] + Math.cos(r) * L, hand[1] - Math.sin(r) * L]);
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return <g>
    <path d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} stroke={C.ink} strokeWidth={8 * s} strokeLinecap="round" />
    <g transform={`translate(${b[0]} ${b[1]}) rotate(${ang})`}><rect x={-14 * s} y={-24 * s} width={30 * s} height={48 * s} rx={5} fill={C.ink} /></g>
  </g>;
};

const Text: React.FC<{ text: string; o: number; top: number; size: number; color?: string; weight?: number }> = ({ text, o, top, size, color = C.text, weight = 800 }) =>
  o <= 0 ? null : <div dir="rtl" lang="ar" style={{ position: 'absolute', top, left: 80, right: 80, textAlign: 'center', fontFamily: TITLE, fontWeight: weight, fontSize: size, lineHeight: 1.2, color, opacity: o, whiteSpace: 'pre-line',
    transform: `translateY(${mix(26, 0, o)}px) scale(${mix(0.94, 1, o)})`, textShadow: '0 4px 24px rgba(7,8,10,0.75)' }}>{text}</div>;

// ——— his swing ———
const HANDS: [number, number] = [58, -176];
const RAISED = { p: pose({ head: -10, handF: [-4, -296], handN: [-14, -288] }), th: 158 };
/** Where he stands and how the hammer points so its head lands exactly on a chip. */
const strikeFor = (t: [number, number]) => {
  const dy = (t[1] - GY) / S - HANDS[1];
  const dx = Math.sqrt(Math.max(0, 150 * 150 - dy * dy));
  return { x: t[0] + (HANDS[0] + dx) * S, p: pose({ lean: 12, head: 4, handF: HANDS, handN: [HANDS[0] - 10, HANDS[1] + 6] }), th: (Math.atan2(-dy, dx) * 180) / Math.PI };
};
const TARGETS = [...B.chips, B.final] as [number, number][];
const STRIKES = TARGETS.map(strikeFor);
const HITS = B.hits.map(at);
type Swing = { x: number; p: Pose; th: number };
const mixSwing = (a: Swing, b: Swing, t: number): Swing => ({ x: mix(a.x, b.x, t), p: mixPose(a.p, b.p, t), th: mix(a.th, b.th, t) });

export const ReelC: React.FC<{ bare?: boolean; still?: number; cam?: Cam }> = ({ bare = false, still, cam }) => {
  const now = useCurrentFrame();
  const f = still ?? now;
  const shot = [...B.shots].reverse().find(([, t]) => f >= at(t as number))![0] as string;
  const idx = (name: string) => B.shots.findIndex(([n]) => n === name);
  const span = (name: string) => [at(B.shots[idx(name)][1] as number), idx(name) + 1 < B.shots.length ? at(B.shots[idx(name) + 1][1] as number) : at(B.duration)];
  const local = (name: string) => { const [a, b] = span(name); return prog(f, a, b - a, (t) => t); };
  const T = B.text, K = B.close, I = B.impact, J = B.journey;
  const done = HITS.filter((h) => f >= h).length; // strikes landed so far
  const lastStrike = HITS[HITS.length - 1];

  // ——— the man ———
  let sw: Swing = { x: STRIKES[0].x, ...RAISED };
  const recoil = (k: number): Swing => ({ ...STRIKES[k], p: { ...STRIKES[k].p, lean: 4, head: 0 }, th: STRIKES[k].th + 18 });
  if (f < HITS[0]) sw = mixSwing({ x: STRIKES[0].x, ...RAISED }, STRIKES[0], prog(f, HITS[0] - 7, 7, ease.in));
  else if (f < HITS[99]) {
    const k = HITS.findIndex((h, n) => f >= h && f < HITS[n + 1]);
    const g = HITS[k + 1] - HITS[k];
    const rec = Math.min(8, g * 0.3), up = Math.min(18, g * 0.45), down = Math.min(7, g * 0.25);
    const b = prog(f, HITS[k + 1] - down - up, up);
    sw = mixSwing(mixSwing(mixSwing(STRIKES[k], recoil(k), prog(f, HITS[k], rec)), { x: b > 0.5 ? STRIKES[k + 1].x : STRIKES[k].x, ...RAISED }, b), STRIKES[k + 1], prog(f, HITS[k + 1] - down, down, ease.in));
    sw.x = b > 0.5 ? STRIKES[k + 1].x : STRIKES[k].x;
  } else if (f < lastStrike) {
    // spent: he leans on the hammer, breathes, looks up, and raises it once more
    const lean: Swing = { x: STRIKES[100].x, p: pose({ lean: 18, crouch: 10, bob: 3 * Math.sin(f / 7), head: mix(14, -26, prog(f, at(K.look), 20)), handF: [44, -150], handN: [36, -146] }), th: -70 };
    sw = mixSwing(mixSwing(recoil(99), lean, prog(f, HITS[99] + 4, at(K.lean) - HITS[99])), { x: STRIKES[100].x, ...RAISED }, prog(f, at(K.raise), at(B.hits[100] - 0.2) - at(K.raise), ease.inOut));
    sw = mixSwing(sw, STRIKES[100], prog(f, lastStrike - 7, 7, ease.in));
  } else if (f < at(J.walk) - 12) {
    const down: Swing = { x: STRIKES[100].x, p: pose({ head: mix(0, -14, prog(f, at(I.fall), 40)), handF: [40, -150], handN: [32, -146] }), th: -72 };
    sw = mixSwing(recoil(100), down, prog(f, at(I.fall) - 6, 24));
  } else {
    const endX = STRIKES[0].x + DX;
    const wk = walk(f, 0, STRIKES[100].x - endX, at(J.walk), at(J.arrive) - at(J.walk), 64);
    const carry: Swing = { x: STRIKES[100].x - wk.x, p: pose({ head: 2, bob: wk.bob, footF: wk.footF, footN: wk.footN, handF: [20, -206], handN: [8, -196] }), th: 160 };
    const fromDown: Swing = { x: STRIKES[100].x, p: pose({ head: -14, handF: [40, -150], handN: [32, -146] }), th: -72 };
    sw = mixSwing(mixSwing(fromDown, carry, prog(f, at(J.walk) - 12, 12)), { x: endX, ...RAISED }, prog(f, at(J.raise), at(J.up) - at(J.raise), ease.inOut));
    if (f < at(J.raise)) sw.x = carry.x;
  }

  // ——— cameras ———
  const close: Cam = { x: STRIKES[100].x - 70, y: GY - 230, z: 2.0 };
  const impactCam: Cam = { x: 540, y: 820, z: 0.62 };
  const revealCam: Cam = { x: 540, y: 1010, z: 0.8 }, revealEnd: Cam = { x: 540, y: 1040, z: 0.88 };
  const cams: Record<string, Cam> = {
    wide: camMix(C0, { ...C0, z: 0.95 }, ease.inOut(local('wide'))),
    montage: camMix({ ...C0, z: 0.95 }, { x: 540, y: GY - 490 / 1.02, z: 1.02 }, local('montage')),
    close: camMix(close, { ...close, z: 2.12 }, local('close')),
    impact: camMix(impactCam, { ...impactCam, z: 0.64 }, local('impact')),
    // the push never stops while the words are read (no still frame), then the road takes over from where it ends
    reveal: camMix(camMix(impactCam, revealCam, ease.inOut(prog(f, at(I.fall), 90, (t) => t))), revealEnd, prog(f, at(I.fall) + 90, at(J.walk) - at(I.fall) - 100, (t) => t)),
    journey: camMix(revealEnd, { ...C0, x: C0.x + DX }, ease.inOut(prog(f, at(J.walk) - 10, at(J.up) - at(J.walk) + 10, (t) => t))),
  };
  const c = cam ?? cams[shot];
  // graded feedback: a light knock on every strike, the last one shakes the frame
  const kick = HITS.reduce((m, h, k) => (f >= h && f < h + (k === 100 ? 40 : 8) ? Math.max(m, (k === 100 ? 22 : k < 3 ? 4 : 1.5) * (1 - (f - h) / (k === 100 ? 40 : 8))) : m), 0);
  const shake = kick * Math.sin(f * 2.3);

  // days pass during the montage
  const mont = prog(f, at(3.5), at(8.55) - at(3.5), (t) => t);
  const night = f >= at(3.5) && f < at(8.6) ? 0.5 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 5 * mont)) : 0;

  // the wall breaks: cracks through the chips (tree order), then the break lines outward, then the shards fall
  const c1 = (f - at(I.crack1)) / (at(I.crack2) - at(I.crack1)); // 0→1 over the chip tree
  const c2 = (f - at(I.crack2)) / (at(I.fall) - at(I.crack2)); // 0→1 over the grid
  const maxDepth = Math.max(...B.mst.map((e) => e[2]));
  const fallT = (s: { c: [number, number] }) => (f - at(I.fall)) / 60 - 0.45 * (Math.hypot(s.c[0] - FINAL[0], s.c[1] - FINAL[1]) / MAXD);
  const shardFall = (n: number) => {
    const s = SHARDS[n], t = fallT(s);
    if (t <= 0) return undefined;
    const out = (s.c[0] - FINAL[0]) * 0.35;
    return { dx: out * t, dy: 0.5 * 2600 * t * t - 120 * t, r: (hash(n) - 0.5) * 80 * t, c: s.c };
  };
  const broken = f >= at(I.fall);
  const wall1 = SHARDS.map((s, n) => {
    const fl = shardFall(n);
    if (fl && fl.dy > 4000) return null;
    return <Shard key={n} q={s.q} fall={fl} />;
  });
  const chips = CHIPS.slice(0, Math.min(done, 100)).map(({ p, shard }, k) => {
    const fl = shardFall(shard);
    const age = f - HITS[k];
    const pop = Math.min(1, age / 4);
    const r = 7 + 3 * hash(k + 9);
    const pts = Array.from({ length: 6 }, (_, m) => { const a = (m / 6) * Math.PI * 2 + hash(k * 7 + m); const rr = r * (0.6 + 0.5 * hash(k * 13 + m)) * pop; return `${p[0] + Math.cos(a) * rr} ${p[1] + Math.sin(a) * rr}`; }).join(' L');
    const g = <g key={k}>
      <path d={`M${pts} Z`} fill={C.chip} stroke={C.chipRim} strokeWidth={1.6} strokeLinejoin="round" />
      {age < 14 && [0, 1, 2].map((m) => <circle key={m} cx={p[0] + (m - 1) * 10 * (age / 14)} cy={p[1] + 6 - 14 * (age / 14) * (m === 1 ? 1.3 : 1)} r={3 + 6 * (age / 14)} fill={C.dust} opacity={0.6 * (1 - age / 14)} />)}
    </g>;
    return fl ? <g key={k} transform={`translate(${fl.dx} ${fl.dy}) rotate(${fl.r} ${fl.c[0]} ${fl.c[1]})`}>{g}</g> : g;
  });
  const cracks = !broken && f >= at(I.crack1) && <g filter="url(#cglow)">
    {B.mst.map(([a, b, d], k) => {
      const t = Math.max(0, Math.min(1, c1 * (maxDepth + 1) - (d - 1)));
      if (t <= 0) return null;
      const pa = B.chips[a], pb = B.chips[b];
      return <path key={k} d={`M${pa[0]} ${pa[1]} L${mix(pa[0], pb[0], t)} ${mix(pa[1], pb[1], t)}`} stroke={C.crack} strokeWidth={5} strokeLinecap="round" />;
    })}
    {c2 > 0 && EDGES.map((e, k) => {
      const t = Math.max(0, Math.min(1, c2 * 1.25 - e.d / MAXE));
      if (t <= 0) return null;
      const from = Math.hypot(e.a[0] - FINAL[0], e.a[1] - FINAL[1]) < Math.hypot(e.b[0] - FINAL[0], e.b[1] - FINAL[1]);
      const [p, q] = from ? [e.a, e.b] : [e.b, e.a];
      return <path key={`g${k}`} d={`M${p[0]} ${p[1]} L${mix(p[0], q[0], t)} ${mix(p[1], q[1], t)}`} stroke={C.crack} strokeWidth={6} strokeLinecap="round" />;
    })}
  </g>;
  // the next wall, met at the end of the road (same as the first, DX to the left)
  const wall2 = SHARDS.map((s, n) => <Shard key={`w${n}`} q={s.q.map((p) => [p[0] + DX, p[1]] as [number, number])} />);

  // the people who pass and tell him he is wasting his life
  const Pa = B.passers;
  const passer = (k: number) => {
    const stopX = [70, 230][k], from = [-260, -150][k];
    const wIn = walk(f, 0, stopX - from, at(Pa.in) + k * 6, at(Pa.stop) - at(Pa.in), 46);
    const wOut = walk(f, 0, stopX + 300, at(Pa.out) + k * 8, 60, 46);
    const leaving = f >= at(Pa.out) + k * 8;
    const x = leaving ? stopX - wOut.x : from + wIn.x;
    const shake = f >= at(Pa.stop) && !leaving ? 10 * Math.sin((f - at(Pa.stop)) / 3.2) * (1 - prog(f, at(Pa.out) - 20, 20)) : 0;
    const p = leaving ? pose({ footF: wOut.footF, footN: wOut.footN, bob: wOut.bob }) : f < at(Pa.stop) ? pose({ footF: wIn.footF, footN: wIn.footN, bob: wIn.bob }) : pose({ head: shake, shF: k ? 84 : 10, elF: k ? 4 : 14, handN: k ? undefined : [30, -130] });
    return { x, p, facing: (leaving ? -1 : 1) as 1 | -1 };
  };

  const hj = joints(sw.p);
  const world = (
    <g transform={`translate(${W / 2 + shake} ${H / 2 + shake * 0.4}) scale(${c.z}) translate(${-c.x} ${-c.y})`}>
      <defs><filter id="cglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      {(broken || f >= at(J.walk)) && <Valley f={f} />}
      {wall2}
      {wall1}
      {chips}
      {cracks}
      <rect x={-3000} y={GY} width={6000} height={1400} fill={C.ground} />
      {f >= at(Pa.in) && f < at(Pa.out) + 80 && [0, 1].map((k) => { const q = passer(k); return <Figure key={k} p={q.p} x={q.x} y={GY} s={S} facing={q.facing} robe ghutra color={C.ink} eyeColor={C.eye} look={[0.6, 0]} />; })}
      <Hammer hand={hj.armF.wrist} th={sw.th} s={S} facing={-1} x={sw.x} y={GY} />
      <Figure p={sw.p} x={sw.x} y={GY} s={S} facing={-1} robe ghutra color={C.ink} eyeColor={C.eye} look={shot === 'close' || f >= at(I.fall) ? [0.5, -0.8] : [0.8, -0.2]} />
    </g>
  );

  const flash = f >= at(I.flash) ? 1 - prog(f, at(I.flash), 18) : 0;
  const drop = f >= at(I.fall) ? 1 - prog(f, at(I.fall), 30) : 0;
  const counter = done > 0 && f < at(K.lean) ? Math.min(done, 100) : 0;
  const say = (a: number, b: number, d = 12) => prog(f, at(a), d) * (1 - prog(f, at(b), 10));
  return (
    <AbsoluteFill style={{ background: C.ground }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        {world}
        <rect width={W} height={H} fill={C.night} opacity={night} />
        <rect width={W} height={H} fill="#FFFFFF" opacity={flash * 0.6 + drop * 0.35} />
      </svg>
      {!bare && <>
        {counter > 0 && <div dir="rtl" lang="ar" style={{ position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 60, color: C.text, background: C.pill, borderRadius: 999, padding: '2px 34px 8px' }}>ضربة {counter}</div>
        </div>}
        <Text text="ضربها مرّة…" o={say(T.once, T.nothingOut)} top={250} size={104} />
        <Text text="…وما صار شي." o={say(T.nothing, T.nothingOut)} top={380} size={104} color={C.textDim} />
        <Text text="قالوا: ضيّعت عمرك." o={say(T.said, T.saidOut)} top={300} size={96} />
        <Text text="الضربة 101" o={say(T.big, B.hits[100] - 0.05, 10)} top={210} size={140} />
        <Text text="ما كسرتها الضربة الأخيرة…" o={say(T.last, T.outro)} top={230} size={72} color={C.textDim} />
        <Text text={'كسرتها الميّة\nاللي قبلها.'} o={say(T.before, T.outro, 14)} top={330} size={110} />
        <Text text="كتاب وبس" o={say(T.sign, T.outro + 0.3) * 0.85} top={1600} size={40} weight={700} color={C.textDim} />
        <Audio src={staticFile('audio/c-mix.wav')} />
      </>}
    </AbsoluteFill>
  );
};
