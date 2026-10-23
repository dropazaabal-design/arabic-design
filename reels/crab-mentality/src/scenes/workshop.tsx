import React from 'react';
import { staticFile } from 'remotion';
import { B, F } from '../beats';
import { Crab, CrabProps, reach } from '../art/crab';
import { Awning, BubbleShape, Crate, Dust, Sparkle } from '../art/props';
import { C } from '../theme';
import { ease, mix, prog } from '../time';

const GROUND = 1380;
const CRATES = [
  { x: 440, y: GROUND, at: 0 },
  { x: 680, y: GROUND, at: 5 },
  { x: 560, y: GROUND - 180, at: 10 },
];

export const bubble5 = (f: number) => {
  const enter = prog(f, B.shrink, 10, ease.out);
  const fall = prog(f, B.crush - 8, 8, ease.in);
  return { x: mix(330, 540, fall), y: mix(mix(380, 560, enter), 800, fall), rot: mix(-8, 2, fall), o: enter * (1 - prog(f, F.s6, 8)) };
};

export const Workshop: React.FC<{ f: number }> = ({ f }) => {
  if (f < F.s5 - 6 || f > F.s6 + 14) return null;
  const enter = prog(f, F.s5 - 4, 18, ease.inOut);
  const exit = prog(f, F.s6 - 2, 14, ease.inOut);
  const crack = prog(f, B.crush, 3);
  const breakOff = prog(f, B.crush + 3, 18, ease.in);
  const lift = prog(f, B.build + 14, 14, ease.out);
  const lights = prog(f, B.build + 26, 8) * (1 - crack);
  const wob = f > B.crush ? Math.sin((f - B.crush) / 2) * 5 * Math.exp(-(f - B.crush) / 10) : 0;

  const hero: CrabProps = {
    x: f < B.build + 14 ? mix(1000, 860, prog(f, F.s5, 14)) : 860, y: GROUND - 40, s: 0.76,
    mood: f < B.crush ? 'happy' : 'shock', look: f < B.crush ? [-0.8, -0.5] : [-0.6, -1], legPhase: f < B.build + 14 ? f * 1.2 : 0,
    raise: f < B.build + 26 ? 1.3 : f < B.crush ? 0.8 : 1.4, clawL: 0.1, clawR: 0.1, shadow: 1,
  };
  // Holds the awning up, then lets it go onto the stall.
  const awn = { x: mix(860, 560, lift), y: mix(GROUND - 260, GROUND - 360 - 20, lift) };
  if (f >= B.build + 6 && f < B.build + 26) {
    hero.reachL = reach(hero, [awn.x - 120 + (1 - lift) * 100, awn.y]);
    hero.reachR = reach(hero, [awn.x + 120 + (1 - lift) * 60, awn.y]);
  }
  if (f > B.crush + 8) hero.mood = 'worried';
  const b = bubble5(f);

  return (
    <g transform={`translate(${(1 - enter) * 1100} 0)`} opacity={1 - exit}>
      <rect x={-40} y={GROUND} width={1160} height={600} fill="#191233" />
      <path d={`M -40 ${GROUND} L 1120 ${GROUND}`} stroke={C.ivory} strokeWidth={5} opacity={0.5} />
      <g transform={`translate(540 ${GROUND}) scale(1.3) translate(-560 ${-GROUND})`}>
      {[[120, 420], [300, 300], [820, 360], [960, 520], [640, 250]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3 + (i % 2)} fill={C.ivory} opacity={0.4 + 0.3 * Math.sin(f / 9 + i)} />
      ))}
      <ellipse cx={560} cy={GROUND + 10} rx={330} ry={22} fill="#000" opacity={0.3} />
      {CRATES.map((c, i) => {
        const d = prog(f, B.build + c.at, 9, ease.in);
        const bounce = f > B.build + c.at + 9 ? Math.sin((f - B.build - c.at - 9) / 1.6) * 10 * Math.exp(-(f - B.build - c.at - 9) / 4) : 0;
        return (
          <g key={i} transform={i === 2 ? `rotate(${wob} 560 ${GROUND - 180})` : undefined}>
            <Crate x={c.x} y={mix(900, c.y, d) - Math.abs(bounce)} w={240} h={180} o={Math.min(1, d * 4)} />
            <Dust x={c.x} y={c.y} p={prog(f, B.build + c.at + 9, 14)} />
          </g>
        );
      })}
      {f >= B.build + 10 && (
        <g transform={`rotate(${wob} 560 ${GROUND - 360})`}>
          <image href={staticFile('assets/steps-flag.svg')} x={470} y={GROUND - 560 - 40 * breakOff} width={180} height={180} opacity={prog(f, B.build + 28, 8) * (1 - breakOff)} />
        </g>
      )}
      {f >= B.build + 6 && (
        <g transform={`translate(${breakOff * -300} ${breakOff * 300}) rotate(${breakOff * -32} ${awn.x} ${awn.y})`}>
          <Awning x={awn.x} y={awn.y} w={560} crack={crack} />
          {Array.from({ length: 7 }).map((_, i) => (
            <circle key={i} cx={awn.x - 270 + i * 90} cy={awn.y + 34 + Math.sin(i) * 6} r={11} fill={C.amber} opacity={0.3 + 0.7 * lights} stroke={C.ivory} strokeWidth={3} />
          ))}
        </g>
      )}
      {lights > 0.5 && <Sparkle x={560} y={GROUND - 470} p={prog(f, B.build + 28, 14)} color={C.amber} s={1.2} />}
      <Crab {...hero} />
      </g>
      {f >= B.shrink && b.o > 0 && <BubbleShape x={b.x} y={b.y} w={560} h={170} tail="none" fill={C.red} rot={b.rot} o={b.o} />}
    </g>
  );
};
