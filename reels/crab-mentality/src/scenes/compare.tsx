import React from 'react';
import { B, F } from '../beats';
import { ClawArm, Crab, CrabProps, reach } from '../art/crab';
import { BubbleShape, Dust, Ladder, Sparkle, Wrench, ladderRungY } from '../art/props';
import { C } from '../theme';
import { ease, mix, prog } from '../time';

const BASE = 1430;
const LH = 720;
const RIGHT = 810;
const LEFT = 270;
const rung = (i: number) => BASE + ladderRungY(LH, 4, i);

export const Compare: React.FC<{ f: number }> = ({ f }) => {
  if (f < F.s6 - 4 || f > F.s7 + 16) return null;
  const wipe = prog(f, F.s6 - 2, 14, ease.out);
  const exit = prog(f, F.s7 - 4, 10, ease.in);
  const mark = prog(f, B.advise + 2, 10, ease.out);
  const wIn = prog(f, B.fix - 8, 8, ease.out);
  const fix = prog(f, B.fix, 16, ease.inOut);
  const climbR = prog(f, B.fix + 18, 26, ease.inOut);
  const grab = prog(f, B.stop + 2, 7, ease.out);
  const yank = prog(f, B.stop + 10, 9, ease.in);
  const topple = prog(f, B.stop + 14, 18, ease.in);
  const step0 = prog(f, B.warn + 4, 14, ease.out);

  // Two heroes: the same attempt, two different answers.
  const heroR: CrabProps = {
    x: RIGHT - 4, y: mix(mix(BASE - 50, rung(0) - 46, step0), rung(3) - 46, climbR), s: 0.68, legMode: 'climb',
    legPhase: climbR > 0 && climbR < 1 ? f * 1.4 : 0, mood: climbR >= 1 ? 'happy' : f >= B.advise ? 'determined' : 'worried', look: [0, -1],
  };
  heroR.reachL = reach(heroR, [RIGHT - 50, heroR.y - 110]);
  heroR.reachR = reach(heroR, [RIGHT + 50, heroR.y - 110]);
  if (climbR >= 1) { heroR.reachL = null; heroR.reachR = null; heroR.raise = 1.3 + 0.2 * Math.sin(f / 3); }
  const heroL: CrabProps = {
    x: LEFT - 4 - topple * 60, y: mix(BASE - 50, rung(0) - 46, step0) + yank * (BASE - 50 - rung(0) + 46), s: 0.68, legMode: yank > 0 ? 'dangle' : 'climb',
    legPhase: f * 0.6, mood: f < B.stop ? 'worried' : 'shock', look: f < B.stop ? [0, -1] : [-0.3, 0.9], rot: yank * -14,
    stretch: grab > 0.8 && yank < 1 ? 0.14 : 0,
  };
  if (yank < 0.5) {
    heroL.reachL = reach(heroL, [LEFT - 50, heroL.y - 110]);
    heroL.reachR = reach(heroL, [LEFT + 50, heroL.y - 110]);
  } else heroL.raise = 1.4;
  const foot: [number, number] = [heroL.x + 40, heroL.y + 40];

  const pathR = prog(f, B.fix + 18, 26);
  const pathL = prog(f, B.stop + 12, 14);

  return (
    <g opacity={1 - exit} transform={`translate(0 ${-exit * 600})`}>
      <rect x={540 - 540 * wipe} y={0} width={540 * wipe} height={1920} fill="#3A1622" />
      <rect x={540} y={0} width={540 * wipe} height={1920} fill="#0F3B3A" />
      <rect x={0} y={BASE} width={1080} height={500} fill="#000" opacity={0.25} />
      <path d={`M 540 ${560 + (1 - wipe) * 500} L 540 ${1600 - (1 - wipe) * 500}`} stroke={C.ivory} strokeWidth={6} strokeDasharray="16 18" strokeLinecap="round" opacity={0.7} />

      {/* right: advice */}
      <g opacity={wipe}>
        <Ladder x={RIGHT} y={BASE} h={LH} total={4} broken={1} fix={fix} color={C.green} />
        {mark > 0 && <circle cx={RIGHT} cy={rung(1)} r={96 * mark} fill="none" stroke={C.green} strokeWidth={8} strokeDasharray="14 12" opacity={1 - fix} />}
        <path d={`M ${RIGHT + 110} ${BASE - 40} L ${RIGHT + 110} ${rung(3) - 40}`} stroke={C.green} strokeWidth={10} strokeDasharray="18 16" strokeLinecap="round" style={{ clipPath: `inset(${(1 - pathR) * 100}% 0 0 0)` }} />
        {pathR > 0.95 && <path d={`M ${RIGHT + 82} ${rung(3) - 10} L ${RIGHT + 110} ${rung(3) - 48} L ${RIGHT + 138} ${rung(3) - 10}`} fill="none" stroke={C.green} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />}
        {wIn > 0 && fix < 1 && <Wrench x={mix(1040, RIGHT + 40, wIn)} y={mix(700, rung(1) - 70, wIn)} rot={mix(80, 0, wIn) + Math.sin(fix * Math.PI * 4) * 30} s={0.8} />}
        <Sparkle x={RIGHT} y={rung(1)} p={prog(f, B.fix + 14, 14)} color={C.green} s={1.3} />
        <Crab {...heroR} />
      </g>

      {/* left: discouragement */}
      <g opacity={wipe}>
        <g transform={`rotate(${-topple * 26} ${LEFT - 60} ${BASE})`}>
          <Ladder x={LEFT} y={BASE} h={LH} total={4} broken={topple > 0.3 ? 0 : 1} fix={0} color={C.muted} />
        </g>
        <path d={`M ${LEFT - 110} ${rung(1)} L ${LEFT - 110} ${BASE - 30}`} stroke={C.red} strokeWidth={10} strokeDasharray="18 16" strokeLinecap="round" style={{ clipPath: `inset(0 0 ${(1 - pathL) * 100}% 0)` }} />
        {pathL > 0.95 && <path d={`M ${LEFT - 138} ${BASE - 62} L ${LEFT - 110} ${BASE - 24} L ${LEFT - 82} ${BASE - 62}`} fill="none" stroke={C.red} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />}
        <Crab {...heroL} />
        {f >= B.stop && (
          <ClawArm bx={120} by={1760} tx={mix(160, foot[0], grab)} ty={mix(1700, foot[1], grab)} open={grab > 0.9 ? 0.05 : 0.9} bend={-40} s={1.1} />
        )}
        <Dust x={LEFT} y={BASE} p={prog(f, B.stop + 18, 16)} />
      </g>

      {/* the two kinds of words, arriving together */}
      {(() => {
        const r = prog(f, B.warn + 8, 12, ease.out);
        const l = prog(f, B.warn + 14, 12, ease.out);
        const rOut = prog(f, B.fix - 6, 10);
        return (
          <g>
            <g opacity={r * (1 - rOut)}>
              <BubbleShape x={mix(1200, RIGHT, r)} y={640} w={250} h={150} tail="down" fill={C.green} tailX={-20} />
              <Wrench x={mix(1200, RIGHT, r)} y={600} rot={40} s={0.55} color={C.paper} />
            </g>
            <g opacity={l * (1 - prog(f, B.stop + 8, 8))}>
              <BubbleShape x={mix(-120, LEFT, l)} y={640} w={250} h={150} tail="down" fill={C.red} tailX={20} />
              <path d={`M ${mix(-120, LEFT, l) - 50} 650 q 50 -70 100 0`} fill="none" stroke={C.paper} strokeWidth={14} strokeLinecap="round" />
              <path d={`M ${mix(-120, LEFT, l) + 40} 600 l 14 -24 M ${mix(-120, LEFT, l) + 56} 616 l 24 -10`} stroke={C.paper} strokeWidth={10} strokeLinecap="round" />
            </g>
          </g>
        );
      })()}
    </g>
  );
};
