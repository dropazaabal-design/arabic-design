import React from 'react';
import { staticFile } from 'remotion';
import { B, F } from '../beats';
import { Crab, CrabProps, reach } from '../art/crab';
import { Block, BubbleShape, Checklist, Dust, Lock, Sparkle, WiseBook, Wrench } from '../art/props';
import { C } from '../theme';
import { ease, mix, prog } from '../time';

export const GROUND7 = 1430;
/** The plan is staged larger than its drawing coordinates; the exit scene maps through the same factor. */
export const PLAN_K = 1.3;
export const PLAN_LIFT = 60;
export const planToScreen = (x: number, y: number): [number, number] => [540 + (x - 540) * PLAN_K, GROUND7 - PLAN_LIFT + (y - GROUND7) * PLAN_K];
export const STAIRS = [
  { x: 345, w: 200, h: 150, color: C.blue, emblem: 'lock' as const },
  { x: 545, w: 200, h: 300, color: C.green, emblem: 'tool' as const },
  { x: 745, w: 200, h: 450, color: C.amberDeep, emblem: 'check' as const },
];
/** When each block lands, and how far it has arrived. */
export const blockIn = (f: number, i: number) => [B.st1 + 34, B.st2 + 34, B.st3 + 24][i] <= f
  ? 1 : prog(f, [B.st1 + 22, B.st2 + 22, B.st3 + 12][i], 12, ease.back);

const Dots: React.FC<{ x: number; y: number; fill: string; s?: number; o?: number }> = ({ x, y, fill, s = 1, o = 1 }) => (
  <g opacity={o}>
    <BubbleShape x={x} y={y} w={170} h={100} fill={fill} scale={s} />
    {[-40, 0, 40].map((dx) => <circle key={dx} cx={x + dx * s} cy={y} r={10 * s} fill={C.ivory} />)}
  </g>
);

export const Plan: React.FC<{ f: number }> = ({ f }) => {
  if (f < F.s7 - 6 || f > F.s8 + 26) return null;
  const enter = prog(f, F.s7 - 4, 16, ease.out);
  const toExit = prog(f, F.s8 - 2, 22, ease.inOut);

  // Hero: on the ground, then climbs the stairs it built during s17.
  const climb = prog(f, B.watch + 2, 30, ease.inOut);
  const stairTop = (i: number) => GROUND7 - STAIRS[i].h - 26;
  const climbPts: Array<[number, number]> = [[235, GROUND7 - 40], [STAIRS[0].x, stairTop(0) - 40], [STAIRS[1].x, stairTop(1) - 40], [STAIRS[2].x, stairTop(2) - 40]];
  const k = Math.min(2.999, climb * 3);
  const i0 = Math.floor(k);
  const u = k - i0;
  const hx = mix(climbPts[i0][0], climbPts[i0 + 1][0], u);
  const hy = mix(climbPts[i0][1], climbPts[i0 + 1][1], u) - Math.sin(u * Math.PI) * 60;
  const dodge = prog(f, B.watch + 46, 8, ease.out) * (1 - prog(f, B.watch + 64, 10));
  const hero: CrabProps = {
    x: climb > 0 ? hx - dodge * 40 : 235, y: climb > 0 ? hy : GROUND7 - 40, s: 0.8, shadow: climb > 0 ? 0 : 1,
    legPhase: climb > 0 && climb < 1 ? f * 1.3 : 0, rot: -dodge * 12,
    mood: f < B.st1 ? 'calm' : f < B.watch + 30 ? 'determined' : 'calm', look: f < B.st2 ? [0.6, -0.4] : f < B.st3 ? [1, -0.6] : f >= B.watch + 30 ? [1, -0.8] : [0.8, -0.3],
    raise: 0.8,
  };
  // The tool from the book stays in the right claw from s15 on.
  const toolFly = prog(f, B.st2 + 20, 14, ease.inOut);
  const holdsTool = toolFly >= 1;
  if (holdsTool) { hero.reachR = reach(hero, [hero.x + 80, hero.y - 110]); hero.clawR = 0.05; }

  // s14: the plans, the bubbles, the lock.
  const nb = prog(f, B.st1 - 2, 10, ease.back);
  const lockDrop = prog(f, B.st1 + 10, 8, ease.in);
  const bounce = prog(f, B.st1 + 18, 14, ease.out);
  const toBlock1 = prog(f, B.st1 + 22, 12, ease.inOut);

  // s15: the question, the book, the tool.
  const q = prog(f, B.st2, 14, ease.inOut);
  const bookOpen = prog(f, B.st2 + 10, 12, ease.out);
  const bookOut = prog(f, B.st3 - 4, 10);
  // s16: the checklist folds into the third block.
  const ticks = prog(f, B.st3 + 2, 16);
  const fold = prog(f, B.st3 + 14, 10, ease.in);
  const ruler = prog(f, B.st3 + 22, 16, ease.out);
  // s17: two bubbles: one useful, one heavy.
  const drift = prog(f, B.watch + 14, 24, ease.out);
  const take = prog(f, B.watch + 40, 12, ease.inOut);
  const drop = prog(f, B.watch + 48, 22, ease.in);

  const W1 = { x: 300, y: 1090 };
  const toolPos = { x: mix(745, hero.x + 80, toolFly), y: mix(900, hero.y - 110, toolFly) - Math.sin(toolFly * Math.PI) * 120 };

  return (
    <g opacity={enter * (1 - prog(f, F.s8 + 10, 12))} transform={`translate(0 ${(1 - enter) * 700}) translate(540 ${GROUND7 - PLAN_LIFT}) scale(${PLAN_K}) translate(-540 ${-GROUND7})`}>
      {/* blueprint grid */}
      <g opacity={0.12 * (1 - toExit)}>
        {Array.from({ length: 19 }).map((_, i) => <path key={`v${i}`} d={`M ${i * 60} 0 L ${i * 60} 1920`} stroke={C.ivory} strokeWidth={2} />)}
        {Array.from({ length: 33 }).map((_, i) => <path key={`h${i}`} d={`M 0 ${i * 60} L 1080 ${i * 60}`} stroke={C.ivory} strokeWidth={2} />)}
      </g>
      <g opacity={1 - toExit}>
        <rect x={-20} y={GROUND7} width={1120} height={500} fill="#0A1630" />
        <path d={`M -20 ${GROUND7} L 1100 ${GROUND7}`} stroke={C.ivory} strokeWidth={5} opacity={0.5} />
        {/* outline of the way still to build */}
        {STAIRS.map((s, i) => (
          <rect key={i} x={s.x - s.w / 2} y={GROUND7 - s.h} width={s.w} height={s.h} rx={6} fill="none" stroke={C.ivory} strokeWidth={4} strokeDasharray="14 12" opacity={0.35 * (1 - blockIn(f, i))} />
        ))}
        {/* ruler: progress measured by what was done */}
        {ruler > 0 && (
          <g>
            <path d={`M 920 ${GROUND7} L 920 ${mix(GROUND7, GROUND7 - 450, ruler)}`} stroke={C.amber} strokeWidth={8} strokeLinecap="round" />
            {[0, 1, 2, 3].map((t) => (mix(GROUND7, GROUND7 - 450, ruler) <= GROUND7 - t * 150 ? <path key={t} d={`M 900 ${GROUND7 - t * 150} L 940 ${GROUND7 - t * 150}`} stroke={C.amber} strokeWidth={6} /> : null))}
          </g>
        )}
        {/* green rail from the useful words */}
        {take > 0 && <path d={`M ${STAIRS[0].x - 90} ${GROUND7 - STAIRS[0].h - 90} L ${STAIRS[2].x + 60} ${GROUND7 - STAIRS[2].h - 90}`} stroke={C.green} strokeWidth={14} strokeLinecap="round" opacity={take} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - take} />}
      </g>
      {f < F.s8 - 4 && STAIRS.map((s, i) => {
        const p = blockIn(f, i);
        if (p <= 0) return null;
        return (
          <g key={i}>
            <Block x={s.x} y={GROUND7} w={s.w} h={s.h} color={s.color} emblem={s.emblem} s={Math.max(0.01, p)} glow={prog(f, [B.st1, B.st2, B.st3][i] + 34, 10) * (1 - prog(f, [B.st1, B.st2, B.st3][i] + 50, 10))} />
            <Dust x={s.x} y={GROUND7} p={prog(f, [B.st1 + 34, B.st2 + 34, B.st3 + 24][i], 14)} />
          </g>
        );
      })}

      {/* s14 */}
      {f >= B.st1 - 2 && toBlock1 < 1 && (
        <g transform={`translate(${mix(W1.x, STAIRS[0].x, toBlock1)} ${mix(W1.y, GROUND7 - 75, toBlock1)}) scale(${nb * (1 - 0.6 * toBlock1)})`}>
          <image href={staticFile('assets/notebook-pencil.svg')} x={-150} y={-170} width={300} height={300} />
          {lockDrop > 0 && <Lock x={0} y={mix(-260, -10, lockDrop)} s={0.85} shut={lockDrop >= 1 ? 1 : 0} />}
        </g>
      )}
      {f >= B.st1 && f < B.st1 + 36 && [0, 1, 2].map((i) => {
        const t = prog(f, B.st1 + i * 3, 16, ease.in);
        const start = [[900, 900], [920, 1120], [860, 760]][i];
        const hit = [W1.x + 150, W1.y - 60 + (i - 1) * 70];
        const x = bounce > 0 ? mix(hit[0], start[0] + 60, bounce) : mix(start[0], hit[0], t);
        const y = bounce > 0 ? mix(hit[1], start[1] - 140, bounce) : mix(start[1], hit[1], t);
        return <Dots key={i} x={x} y={y} fill={C.red} s={0.6} o={1 - bounce} />;
      })}

      {/* s15 */}
      {f >= B.st2 - 4 && bookOut < 1 && (
        <g opacity={prog(f, B.st2 - 4, 8) * (1 - bookOut)}>
          <WiseBook x={745} y={1120} open={bookOpen} glow={bookOpen} s={0.7} />
          <image href={staticFile('assets/lightbulb.svg')} x={690} y={870 - bookOpen * 30} width={110} height={110} opacity={bookOpen} />
          {q < 1 && (
            <g transform={`translate(${mix(hero.x + 60, 720, q)} ${mix(hero.y - 160, 940, q) - Math.sin(q * Math.PI) * 120})`}>
              <circle r={46} fill={C.paper} stroke={C.ink} strokeWidth={5} />
              <text x={0} y={20} textAnchor="middle" fontFamily="Cairo, sans-serif" fontWeight={900} fontSize={60} fill={C.ink}>؟</text>
            </g>
          )}
        </g>
      )}
      {f >= B.st2 + 20 && !holdsTool && <Wrench x={toolPos.x} y={toolPos.y} rot={toolFly * 360} s={0.7} />}
      {f >= B.st2 + 20 && f < B.st2 + 36 && (
        <rect x={mix(745, STAIRS[1].x - 60, prog(f, B.st2 + 20, 14))} y={mix(940, GROUND7 - 200, prog(f, B.st2 + 20, 14))} width={120} height={30} rx={6} fill={C.woodLight} stroke={C.ivory} strokeWidth={4} transform={`rotate(${prog(f, B.st2 + 20, 14) * 200} ${STAIRS[1].x} ${GROUND7 - 200})`} />
      )}
      <Sparkle x={STAIRS[1].x} y={GROUND7 - 320} p={prog(f, B.st2 + 32, 14)} color={C.green} s={1.3} />

      {/* s16 */}
      {f >= B.st3 - 4 && fold < 1 && (
        <g transform={`translate(${mix(760, STAIRS[2].x, fold)} ${mix(1040, GROUND7 - 225, fold)}) scale(${0.74} ${0.74 * (1 - fold * 0.85)})`} opacity={prog(f, B.st3 - 4, 8)}>
          <Checklist x={0} y={0} ticks={ticks} />
        </g>
      )}

      {/* s17 */}
      {f >= B.watch + 10 && (
        <g>
          <g opacity={(1 - take) * prog(f, B.watch + 10, 8)} transform={`translate(${mix(1150, 790, drift)} ${mix(700, 790, drift)}) scale(0.8)`}>
            <BubbleShape x={0} y={0} w={200} h={130} fill="#5B5F86" tail="down" tailX={-30} />
            <rect x={-60} y={-14} width={120} height={28} rx={8} fill={C.green} stroke={C.ivory} strokeWidth={4} />
          </g>
          <g opacity={(1 - drop) * prog(f, B.watch + 14, 8)} transform={`translate(${mix(1200, 600, drift)} ${mix(640, 760, drift) + drop * 700}) scale(0.8)`}>
            <BubbleShape x={0} y={0} w={200} h={130} fill="#5B5F86" tail="down" tailX={30} />
            <path d="M -40 30 L 40 30 L 26 -10 L -26 -10 Z" fill={C.redDeep} stroke={C.ivory} strokeWidth={4} />
            <circle cx={0} cy={-22} r={14} fill="none" stroke={C.ivory} strokeWidth={5} />
          </g>
        </g>
      )}
      {f < F.s8 - 4 && <Crab {...hero} />}
      {f < F.s8 - 4 && holdsTool && <Wrench x={hero.x + 80} y={hero.y - 150} rot={20} s={0.55} />}
    </g>
  );
};
