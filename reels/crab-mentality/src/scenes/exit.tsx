import React from 'react';
import { B, F } from '../beats';
import { ClawArm, Crab, CrabProps, reach } from '../art/crab';
import { BUCKET, Beam, Block, Dust, Sparkle, VesselBack, VesselFront, Wrench, insideClip } from '../art/props';
import { C, H, W } from '../theme';
import { ease, mix, prog } from '../time';
import { GROUND7, PLAN_K, STAIRS, planToScreen } from './plan';

const FLOOR = BUCKET.botY - 18;
const IN = [
  { x: 370, w: 170, h: 170 },
  { x: 530, w: 170, h: 340 },
  { x: 690, w: 170, h: 510 },
];
const top = (i: number) => FLOOR - IN[i].h - 22;

export const exitCamera = (f: number) => {
  const p = prog(f, F.s8 - 2, 24, ease.inOut);
  const follow = prog(f, B.out + 6, 26, ease.inOut);
  const k = mix(1, 1.12, p);
  const cy = mix(H / 2, 1000, p);
  const cx = mix(W / 2, 650, follow);
  return `translate(${W / 2} ${H / 2}) scale(${k}) translate(${-cx} ${-cy})`;
};

export const Exit: React.FC<{ f: number }> = ({ f }) => {
  if (f < F.s8 - 4) return null;
  const into = prog(f, F.s8 - 2, 22, ease.inOut);
  const bucketIn = prog(f, F.s8, 20, ease.out);
  const tilt = prog(f, B.stumble + 22, 6, ease.out) * (1 - prog(f, B.adjust + 4, 16, ease.inOut));
  const dawn = prog(f, B.out, 40, ease.inOut);

  // Hero: down into the bucket, up the stairs, a slip, the fix, out.
  const pts: Array<[number, number]> = [[250, FLOOR - 40], [IN[0].x, top(0) - 40], [IN[1].x, top(1) - 40]];
  const up01 = prog(f, B.stumble, 18, ease.inOut);
  const k = Math.min(1.999, up01 * 2);
  const i0 = Math.floor(k);
  const u = k - i0;
  let x = mix(pts[i0][0], pts[i0 + 1][0], u);
  let y = mix(pts[i0][1], pts[i0 + 1][1], u) - Math.sin(u * Math.PI) * 50;
  if (f < B.stumble) { const [sx, sy] = planToScreen(STAIRS[2].x, GROUND7 - STAIRS[2].h - 66); x = mix(sx, 250, into); y = mix(sy, FLOOR - 40, into) - Math.sin(into * Math.PI) * 200; }
  const tryTop = prog(f, B.stumble + 18, 6, ease.out);
  const slip = prog(f, B.stumble + 24, 8, ease.in);
  const goOn = prog(f, B.goOn, 12, ease.inOut);
  const toRim = prog(f, B.out, 12, ease.inOut);
  const hop = prog(f, B.out + 12, 18, ease.inOut);
  if (f >= B.stumble + 18) {
    x = mix(IN[1].x, IN[2].x - 40, tryTop * (1 - slip)) ; y = mix(top(1) - 40, top(2) - 40, tryTop * (1 - slip));
  }
  if (f >= B.goOn) { x = mix(IN[1].x, IN[2].x, goOn); y = mix(top(1) - 40, top(2) - 40, goOn) - Math.sin(goOn * Math.PI) * 60; }
  if (f >= B.out) { x = mix(IN[2].x, 760, toRim); y = mix(top(2) - 40, BUCKET.rimY - 50, toRim); }
  if (f >= B.out + 12) { x = mix(760, 900, hop); y = mix(BUCKET.rimY - 50, FLOOR + 10, hop) - Math.sin(hop * Math.PI) * 220; }
  const landed = hop >= 1;
  const fixing = f >= B.adjust && f < B.goOn;
  const hero: CrabProps = {
    x, y, s: landed ? 0.72 : 0.78, rot: slip * -22 * (1 - prog(f, B.stumble + 32, 10)),
    legPhase: (f > B.stumble && f < B.stumble + 20) || (goOn > 0 && goOn < 1) || (toRim > 0 && toRim < 1) ? f * 1.3 : 0,
    mood: landed ? 'happy' : f >= B.stumble + 24 && f < B.adjust ? 'worried' : 'determined',
    look: fixing ? [0.8, 0.4] : landed ? [Math.sin(f / 10), -0.5] : [0.5, -1], raise: landed ? 1.3 + 0.2 * Math.sin(f / 3) : 0.8,
    shadow: landed ? 1 : 0, clawR: 0.05,
  };
  const wrenchAt: [number, number] = fixing ? [IN[2].x - 70, top(2) + 120] : [x + 70, y - 100];
  if (!landed) hero.reachR = reach(hero, wrenchAt);
  const inside = !landed && hop < 0.35;

  const reachClaws = prog(f, B.out + 6, 10, ease.out) * (1 - prog(f, B.out + 34, 14, ease.in));
  const snapEmpty = f > B.out + 18;

  const blocks = IN.map((b, i) => {
    const s = STAIRS[i];
    const [px, py] = planToScreen(s.x, GROUND7);
    const bx = mix(px, b.x, into);
    const base = mix(py, FLOOR, into);
    const w = mix(s.w * PLAN_K, b.w, into);
    const h = mix(s.h * PLAN_K, b.h, into);
    return <Block key={i} x={bx} y={base} w={w} h={h} color={s.color} emblem={s.emblem} rot={i === 2 ? tilt * 9 : 0} />;
  });

  return (
    <g>
      <defs>
        <clipPath id="inBucket8"><path d={insideClip(BUCKET)} /></clipPath>
      </defs>
      <rect x={-200} y={FLOOR + 20} width={1480} height={700} fill="#1A1838" opacity={bucketIn} />
      <path d={`M -200 ${FLOOR + 20} L 1280 ${FLOOR + 20}`} stroke={C.ivory} strokeWidth={5} opacity={0.4 * bucketIn} />
      <Beam cx={BUCKET.cx} topY={-700} botY={BUCKET.rimY} wTop={600 + dawn * 300} wBot={BUCKET.rx * 1.9} o={(0.35 + 0.65 * dawn) * bucketIn} />
      <g transform={`translate(0 ${(1 - bucketIn) * 700})`} opacity={bucketIn}>
        <VesselBack v={BUCKET} cut={1} glow={0.5 * (1 - dawn)} />
      </g>
      <g clipPath={bucketIn > 0.95 ? 'url(#inBucket8)' : undefined}>
        {reachClaws > 0 && [0, 1].map((i) => (
          <ClawArm key={i} bx={450 + i * 140} by={FLOOR - 60} tx={mix(500 + i * 120, 690 + i * 40, reachClaws)} ty={mix(1150, BUCKET.rimY - 30 + i * 36, reachClaws)} open={snapEmpty ? 0.05 : 0.9} bend={-30 + i * 50} s={1} />
        ))}
        {blocks}
        <Crab x={300} y={FLOOR - 30} s={0.6} color={C.red} shade={C.redDeep} mood="grumpy" look={[0.5, -1]} opacity={bucketIn} />
        {inside && <Crab {...hero} />}
        <Sparkle x={IN[2].x - 60} y={top(2) + 80} p={prog(f, B.adjust + 10, 16)} color={C.green} s={1.3} />
      </g>
      {!landed && <Wrench x={wrenchAt[0]} y={wrenchAt[1] - 40} rot={fixing ? Math.sin((f - B.adjust) / 2) * 40 : 20} s={0.55} />}
      <g transform={`translate(0 ${(1 - bucketIn) * 700})`} opacity={bucketIn}>
        <VesselFront v={BUCKET} cut={1 - dawn * 0.3} />
      </g>
      <Dust x={IN[1].x} y={top(1)} p={prog(f, B.stumble + 30, 14)} />
      {!inside && <Crab {...hero} />}
      {landed && <Dust x={900} y={FLOOR + 30} p={prog(f, B.out + 30, 16)} />}
      {landed && [0, 1, 2].map((i) => <Sparkle key={i} x={820 + i * 90} y={1180 - (i % 2) * 70} p={prog(f, B.out + 32 + i * 5, 18)} color={C.amber} s={1} />)}
    </g>
  );
};
