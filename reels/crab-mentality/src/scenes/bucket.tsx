import React from 'react';
import { B, F } from '../beats';
import { ClawArm, Crab, CrabProps, reach } from '../art/crab';
import { BUCKET, Beam, CUP, Dust, MotionLines, Scratch, VesselBack, VesselFront, insideClip, lerpShape } from '../art/props';
import { C, H, W } from '../theme';
import { ease, mix, prog } from '../time';

type Pt = [number, number];
const lip = (x: number) => BUCKET.rimY + BUCKET.ry * Math.sqrt(Math.max(0, 1 - ((x - BUCKET.cx) / BUCKET.rx) ** 2));
const along = (pts: Pt[], t: number): Pt => {
  const n = pts.length - 1;
  const k = Math.min(n - 1e-6, Math.max(0, t * n));
  const i = Math.floor(k);
  const u = k - i;
  return [mix(pts[i][0], pts[i + 1][0], u), mix(pts[i][1], pts[i + 1][1], u)];
};

/** Camera for the bucket world: hook close-up → reveal → name push-in → wide → the cup on the desk. */
export const bucketCamera = (f: number) => {
  const close = { k: 2.0, cy: 905 };
  const mid = { k: 1.0, cy: 1040 };
  const knot = { k: 1.28, cy: 1220 };
  const wide = { k: 1.08, cy: 905 };
  const desk = { k: 1, cy: H / 2 };
  let k = close.k + 0.08 * prog(f, 0, F.s2, ease.inOut);
  let cy = close.cy;
  const toMid = prog(f, F.s2 - 6, 28, ease.inOut);
  k = mix(k, mid.k, toMid); cy = mix(cy, mid.cy, toMid);
  const toKnot = prog(f, B.name - 4, 30, ease.inOut);
  k = mix(k, knot.k, toKnot); cy = mix(cy, knot.cy, toKnot);
  const toWide = prog(f, B.imagine - 8, 30, ease.inOut);
  k = mix(k, wide.k, toWide); cy = mix(cy, wide.cy, toWide);
  const toDesk = prog(f, B.toCup, 24, ease.inOut);
  k = mix(k, desk.k, toDesk); cy = mix(cy, desk.cy, toDesk);
  return `translate(${W / 2} ${H / 2}) scale(${k}) translate(${-W / 2} ${-cy})`;
};

// ---------------------------------------------------------------------------
// The hero through scenes 1–3.
// ---------------------------------------------------------------------------
const GL: Pt = [440, lip(440) - 6];
const GR: Pt = [640, lip(640) - 6];

const heroAt = (f: number): CrabProps & { inside: boolean } => {
  // 1 — the one attempt
  if (f < F.s2) {
    const pull1 = prog(f, 0, 12, ease.out);
    const pull2 = prog(f, 12, 12, ease.out);
    const settle = prog(f, 24, B.climbEnd - 24, ease.out);
    const strain = prog(f, B.strain, B.yank - B.strain, ease.inOut);
    const yank = prog(f, B.yank, B.yankEnd - B.yank, ease.in);
    const y = mix(mix(mix(1050, 975, pull1), 890, pull2), 868, settle) + strain * 30 + yank * 440;
    const hero: CrabProps = {
      x: 530, y, s: 1, rot: strain * 7 + yank * 18, stretch: strain * 0.24 * (1 - yank * 0.8),
      legMode: f < B.grab ? 'climb' : 'dangle', legPhase: f * (f < B.climbEnd ? 0.9 : f > B.grab ? 1.6 : 0.2),
      mood: f < B.climbEnd ? 'determined' : f < B.grab ? 'happy' : f < B.strain ? 'shock' : 'worried',
      look: f < B.climbEnd ? [0, -0.6] : f < B.grab ? [0.2, -1] : [0.7, 0.9],
      clawL: 0.1, clawR: 0.1, blink: 0,
    };
    // Hand over hand: right claw grips first, then the left; both let go on the yank.
    const gripR = f >= 2 && f < B.yank + 3;
    const gripL = f >= 12 && f < B.slip;
    hero.reachR = gripR ? reach(hero, GR) : null;
    hero.reachL = gripL ? reach(hero, [GL[0], GL[1] + (f > B.yankEnd ? (f - B.yankEnd) * 1.5 : 0)]) : null;
    hero.raise = f >= B.yank ? 1.4 : 0.6;
    if (gripL && f > B.yankEnd) hero.stretch = 0.1;
    return { ...hero, inside: true };
  }
  // 2 — inside, seen through the cut-away: climbs again, the others pull
  if (f < F.s3) {
    const up = prog(f, B.open + 6, Math.max(10, B.inside - B.open - 10), ease.out);
    const down = prog(f, B.inside + 14, 12, ease.in);
    const y = mix(1230, 1075, up) + down * 130;
    const hero: CrabProps = {
      x: 520, y, s: 0.86, rot: Math.sin(f / 6) * 3, legMode: 'climb', legPhase: f * (up > 0 && up < 1 ? 1.1 : 0.5),
      mood: f < B.inside ? 'determined' : 'worried', look: f < B.inside ? [0, -1] : [0.4, 0.9], stretch: down > 0 && down < 1 ? 0.16 : 0,
      clawL: 0.2, clawR: 0.2,
    };
    hero.reachL = reach(hero, [440, y - 120 + Math.sin(f / 4) * 10]);
    hero.reachR = reach(hero, [600, y - 140 + Math.cos(f / 4) * 10]);
    return { ...hero, inside: true };
  }
  // 3 — the pile: climbs over the others, all of them pull
  const path: Pt[] = [[520, 1250], [470, 1150], [545, 1040], [600, 950]];
  const climb = prog(f, B.imagine + 8, Math.max(14, B.pullAll - B.imagine - 10), ease.inOut);
  const drop = prog(f, B.pullAll + 12, 14, ease.in);
  const [px, py] = along(path, climb);
  const hero: CrabProps = {
    x: mix(px, 520, drop), y: mix(py, 1260, drop), s: 0.92, rot: drop * -16, legMode: drop > 0 ? 'dangle' : 'walk',
    legPhase: f * 1.2, mood: f < B.pullAll ? 'determined' : 'shock', look: f < B.pullAll ? [0.3, -1] : [0, 1], stretch: drop > 0 && drop < 1 ? 0.18 : 0,
    raise: drop > 0 ? 1.5 : 0.8,
  };
  const toCup = prog(f, B.toCup, 18, ease.in);
  return { ...hero, opacity: 1 - toCup, inside: true };
};

// The others: red, grumpy, at the bottom.
const PILE: Array<{ x: number; y: number; s: number; from: number }> = [
  { x: 375, y: 1395, s: 0.8, from: 0 },
  { x: 560, y: 1420, s: 0.86, from: 0 },
  { x: 718, y: 1390, s: 0.78, from: 0 },
  { x: 450, y: 1290, s: 0.7, from: 1 },
  { x: 655, y: 1282, s: 0.72, from: 1 },
];

export const BucketWorld: React.FC<{ f: number }> = ({ f }) => {
  if (f > B.toCup + 30) return null;
  const hero = heroAt(f);
  const toCup = prog(f, B.toCup + 2, 20, ease.inOut);
  const v = lerpShape(BUCKET, CUP, toCup);
  const cut = f < F.s2 ? 0 : prog(f, F.s2 + 4, 18, ease.inOut) * (1 - toCup);
  const wobble = f > B.yankEnd && f < F.s2 ? Math.sin((f - B.yankEnd) / 2.2) * 3 * Math.exp(-(f - B.yankEnd) / 12) : 0;
  const glow = f < F.s2 ? 0 : prog(f, B.inside, 12) * (1 - toCup);
  const beamO = (0.35 + 0.35 * prog(f, 8, 30) + 0.45 * prog(f, B.open, 12) - 0.35 * prog(f, B.imagine, 20)) * (1 - toCup);
  const card = prog(f, B.imagine + 12, 14, ease.back) * (1 - prog(f, B.toCup - 2, 10, ease.in));
  const sketch = prog(f, B.imagine + 14, 12) * (1 - prog(f, B.toCup + 2, 14));
  // On paper the bucket and the others turn to ink; the hero, its path and the pull keep their colour.
  const ink = sketch > 0 ? { filter: `grayscale(1) invert(${0.88 * sketch}) contrast(${1 + 0.15 * sketch})` } : undefined;

  // Red arms of scene 1 and the pile's arms in scenes 2–3.
  const arms: React.ReactNode[] = [];
  const crabs: React.ReactNode[] = [];
  if (f < F.s2) {
    const foot: Pt = [hero.x + 96, hero.y + 30];
    const reachP = prog(f, B.grab - 6, 6, ease.out);
    const peek = prog(f, B.slip + 6, 8, ease.out) * (1 - prog(f, B.slip + 26, 10, ease.in));
    if (f >= B.grab - 6 && f < B.yankEnd + 2) {
      arms.push(<ClawArm key="g" bx={700} by={1500} tx={mix(690, foot[0], reachP)} ty={mix(1180, foot[1], reachP)} open={f < B.grab ? 1 : 0.05} bend={-50} s={1.25} />);
    }
    if (peek > 0) arms.push(<ClawArm key="p" bx={680} by={1500} tx={650} ty={mix(1100, 905, peek)} open={0.5 + 0.5 * Math.sin((f - B.slip) / 2)} bend={-30} s={1.15} />);
  } else {
    const grab = prog(f, B.inside, 8, ease.out);
    const all = f >= F.s3 ? prog(f, B.pullAll, 10, ease.out) * (1 - prog(f, B.pullAll + 30, 10)) : 0;
    PILE.forEach((p, i) => {
      if (p.from === 1 && f < B.imagine - 6) return;
      const appear = p.from === 1 ? prog(f, B.imagine - 6, 14, ease.back) : 1;
      const bob = Math.sin(f / 7 + i) * 4;
      const red: CrabProps = { x: p.x, y: p.y + bob + (1 - appear) * 120, s: p.s, color: C.red, shade: C.redDeep, mood: 'grumpy', look: [(hero.x - p.x) / 300, -0.8], legPhase: f * 0.3 + i, opacity: Math.min(1, appear * 1.2) * (1 - prog(f, B.toCup - 4, 8)) };
      const holding = f < F.s3 ? (i < 3 ? grab : 0) : all;
      const target: Pt = [hero.x + (i - 2) * 34, hero.y + 50];
      const idle: Pt = [p.x + (i % 2 ? 60 : -60), p.y - 150 + Math.sin(f / 5 + i) * 12];
      const t: Pt = [mix(idle[0], target[0], holding), mix(idle[1], target[1], holding)];
      if (i % 2 === 0) { red.reachR = reach(red, t); red.clawR = holding > 0.8 ? 0.05 : 0.8; }
      else { red.reachL = reach(red, t); red.clawL = holding > 0.8 ? 0.05 : 0.8; }
      crabs.push(<Crab key={i} {...red} />);
    });
  }

  const heroNode = <Crab {...hero} />;
  return (
    <g>
      {card > 0 && (
        <g transform={`translate(540 1060) rotate(${-3 + (1 - card) * 6}) scale(${0.85 + 0.15 * card})`} opacity={card}>
          <rect x={-470} y={-560} width={940} height={1120} rx={18} fill={C.paper} />
          <rect x={-470} y={-560} width={940} height={1120} rx={18} fill="url(#hatch)" opacity={0.6} />
          <rect x={-470} y={-560} width={940} height={1120} rx={18} fill="none" stroke={C.ink} strokeWidth={6} />
          <circle cx={0} cy={-530} r={26} fill={C.red} stroke={C.ivory} strokeWidth={5} />
        </g>
      )}
      <Beam cx={BUCKET.cx} topY={-600} botY={BUCKET.rimY} wTop={560} wBot={BUCKET.rx * 1.8} o={beamO} />
      <clipPath id="inVessel"><path d={insideClip(v)} /></clipPath>
      <g transform={`rotate(${wobble} ${BUCKET.cx} ${BUCKET.botY})`} opacity={1 - prog(f, B.toCup + 22, 8)}>
        <g style={ink}><VesselBack v={v} glow={glow * (1 - sketch)} cut={cut} /></g>
        <g clipPath="url(#inVessel)">
          <g style={ink}>{crabs}</g>
          {hero.inside && heroNode}
          {arms}
          {f >= F.s3 && f < B.toCup && <AttemptPath f={f} />}
        </g>
        <g style={ink}><VesselFront v={v} cut={cut} cup={toCup} dent={prog(f, B.yankEnd, 6)} /></g>
        {f < F.s2 && <Scratch x={GL[0]} y={GL[1]} p={prog(f, B.yankEnd, 24)} />}
        {f < F.s2 && <Scratch x={GR[0]} y={GR[1]} p={prog(f, B.yank, 24)} />}
        {f < F.s2 && <MotionLines x={530} y={BUCKET.rimY + 40} p={prog(f, B.yankEnd - 4, 14)} dir={-1} />}
        {f < F.s2 && <Dust x={530} y={lip(530)} p={prog(f, B.yankEnd, 20)} />}
        {f >= F.s3 && f < B.toCup && <DownArrows f={f} />}
      </g>
    </g>
  );
};

const AttemptPath: React.FC<{ f: number }> = ({ f }) => {
  const draw = prog(f, B.imagine + 4, Math.max(14, B.pullAll - B.imagine - 6));
  const cutP = prog(f, B.pullAll + 8, 8);
  return (
    <path d="M 520 1250 C 430 1150 520 1060 600 950 S 640 820 640 760" fill="none" stroke={C.blueLight} strokeWidth={14} strokeLinecap="round"
      strokeDasharray="20 18" pathLength={1000} strokeDashoffset={0} opacity={0.9 * (1 - cutP * 0.7)}
      style={{ clipPath: `inset(${(1 - draw) * 100}% 0 0 0)` }} />
  );
};

const DownArrows: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {[360, 540, 720].map((x, i) => {
      const p = prog(f, B.pullAll + 10 + i * 3, 10, ease.out);
      const fade = 1 - prog(f, B.toCup - 8, 8);
      return (
        <g key={x} transform={`translate(${x} ${1040 + p * 60})`} opacity={p * fade}>
          <path d="M 0 -70 L 0 40 M -34 6 L 0 40 L 34 6" fill="none" stroke={C.ivory} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 0 -70 L 0 40 M -34 6 L 0 40 L 34 6" fill="none" stroke={C.red} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    })}
  </g>
);
