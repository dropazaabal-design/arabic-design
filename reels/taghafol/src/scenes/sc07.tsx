import React from 'react';
import { along, curve, svgPath } from '../art/world';
import { Note, Praise } from '../art/taghafol';
import { T } from '../copy';
import { draw } from '../motion';
import { Stage } from '../Stage';
import { C } from '../theme';
import { at, ease, mix, prog, sceneStart, sec, useEpisodeFrame } from '../time';
import { Verse } from './shared';

// sc07 — «وتغافلْ عن أمورٍ إنه / لم يفُزْ بالحمدِ إلا من غفل». Two paths from one start to «الحمد».
// The red one stops at every matter and circles it, and ends in a knot short of the goal; the green one
// passes the same matters by (they fade as it goes) and reaches «الحمد».
type Pt = [number, number];
const START: Pt = [820, 1230], GOAL: Pt = [290, 700];
const MATTERS: Pt[] = [[640, 1110], [520, 930], [330, 1010]];
const W1 = [52.18, 52.82, 52.98, 53.34], W2 = [54.22, 54.86, 55.22, 55.66, 55.94, 56.0];

const ring = (c: Pt, r: number, a0: number, turns = 1, n = 36): Pt[] =>
  Array.from({ length: Math.round(n * turns) + 1 }).map((_, i) => {
    const a = a0 + (i / n) * 2 * Math.PI;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  });
const RED: Pt[] = [
  START, [720, 1180],
  ...ring(MATTERS[0], 105, 0.4), [600, 1010],
  ...ring(MATTERS[1], 105, 1.2), [430, 970],
  ...ring(MATTERS[2], 105, 5.6), [250, 1130],
  ...Array.from({ length: 60 }).map((_, i): Pt => [210 + (14 + i * 0.6) * Math.cos(i * 0.55), 1170 + (14 + i * 0.6) * Math.sin(i * 0.55) * 0.8]),
];
const GREEN = curve([[START, [900, 1020], [760, 830], [600, 790]], [[600, 790], [470, 760], [380, 800], GOAL]]);
// where the green path passes closest to each matter (0…1 along it)
const PASS = MATTERS.map((m) => {
  let best = 0, d = Infinity;
  for (let u = 0; u <= 1; u += 0.01) { const p = along(GREEN, u); const dd = Math.hypot(p[0] - m[0], p[1] - m[1]); if (dd < d) { d = dd; best = u; } }
  return best;
});

export const SC07: React.FC = () => {
  const f = useEpisodeFrame();
  const s0 = sceneStart('sc07');
  const start = prog(f, Math.max(s0, at(52.18)), sec(0.3));
  const matters = [52.82, 52.98, 53.34].map((t) => prog(f, at(t), sec(0.3)));
  const red = prog(f, at(53.34), sec(1.3), ease.inOut);
  const redFade = prog(f, at(54.8), sec(0.5));
  const praise = prog(f, at(55.22), sec(0.35));
  const green = prog(f, at(55.66), sec(0.75), ease.inOut);
  const pulse = (t: number) => { const p = prog(f, at(t), sec(0.7), ease.linear); return p > 0 && p < 1 ? p : 0; };
  const head = along(GREEN, green);
  return (
    <Stage f={f} svg={
      <>
        <path d={svgPath(RED)} fill="none" stroke={C.red} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" opacity={mix(1, 0.35, redFade)} {...draw(red)} />
        {MATTERS.map((m, i) => matters[i] > 0 && (
          <Note key={i} x={m[0]} y={m[1]} s={mix(0.5, 0.8, matters[i])} o={Math.min(1, matters[i] * 2)} color={[C.cardboard, C.aqua, C.cardboard][i]} rot={[3, -3, 2][i]}
            dim={prog(f, at(55.66) + Math.round(sec(0.75) * PASS[i]), sec(0.3))} />
        ))}
        {green > 0 && <path d={svgPath(GREEN)} fill="none" stroke={C.green} strokeWidth={16} strokeLinecap="round" {...draw(green)} />}
        {start > 0 && <circle cx={START[0]} cy={START[1]} r={26} fill={C.ink} opacity={start} />}
        {praise > 0 && <Praise text={T.sc07.praise} x={GOAL[0]} y={GOAL[1]} s={mix(0.5, 0.78, praise)} o={Math.min(1, praise * 2)} glow={Math.max(pulse(56.12), pulse(58.18))} />}
        {green > 0 && green < 1 && <circle cx={head[0]} cy={head[1]} r={20} fill={C.green} stroke={C.ink} strokeWidth={5} />}
      </>
    }>
      <Verse text={T.sc07.l1} f={f} times={W1.map((t) => Math.max(s0, at(t)))} y={270} />
      <Verse text={T.sc07.l2} f={f} times={W2.map((t) => at(t))} y={370} color={C.green} />
    </Stage>
  );
};
