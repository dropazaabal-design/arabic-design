import React from 'react';
import { B, F } from '../beats';
import { Crab, CrabProps, reach } from '../art/crab';
import { BubbleShape, CUP, Desk, Lamp, Notebook, Pencil, Sparkle, Steam, VesselBack, VesselFront } from '../art/props';
import { C } from '../theme';
import { ease, mix, prog } from '../time';

type Pt = [number, number];

// Notebook: spine at x 740 (Arabic — the cover opens to the right), page 420…740.
const NB = { x: 740, y: 1300, w: 320, h: 430 };
const LINE_Y = (i: number) => NB.y - NB.h + 52 + i * ((NB.h - 90) / 6);
/** Pencil tip across 4 lines, right to left. */
const writePoint = (w: number): Pt => {
  const k = Math.min(3.999, Math.max(0, w * 4));
  const i = Math.floor(k);
  const t = k - i;
  return [NB.x - 34 - t * (NB.w - 70), LINE_Y(i) - 4];
};
const PENCIL_ANGLE = 35;
const PENCIL_LEN = 300;

export const bubble4 = (f: number) => {
  const enter = prog(f, B.doubt, 12, ease.out);
  const fall = prog(f, B.slam - 7, 7, ease.in);
  return {
    x: mix(-460, 470, enter) + fall * 80, y: mix(640, 960, fall), rot: mix(0, -6, fall), scale: mix(1, 0.86, fall),
    o: enter * (1 - prog(f, F.s5 + 2, 8)),
  };
};

export const studyState = (f: number) => {
  const open = prog(f, B.learn + 2, 12, ease.inOut) * (1 - prog(f, B.slam, 5, ease.in));
  const write = prog(f, B.learn + 14, Math.max(16, B.slam - B.learn - 20), ease.inOut);
  return { open, write };
};

export const Study: React.FC<{ f: number }> = ({ f }) => {
  if (f < B.toCup - 2 || f > F.s5 + 18) return null;
  const rise = prog(f, B.toCup + 10, 14, ease.out);
  const leave = prog(f, F.s5 - 4, 18, ease.inOut);
  const { open, write } = studyState(f);
  const slam = prog(f, B.slam, 6, ease.out);
  const flicker = f > B.slam && f < B.slam + 14 ? 0.45 + 0.4 * Math.abs(Math.sin((f - B.slam) * 1.7)) : 1;
  const pencilFly = prog(f, B.slam + 2, 18, ease.out);
  const hop = prog(f, B.toCup + 24, 16, ease.inOut);

  // Hero: climbs out of the cup, then writes, then recoils.
  const tip = writePoint(write);
  const a = (PENCIL_ANGLE * Math.PI) / 180;
  const butt: Pt = [tip[0] - Math.sin(a) * PENCIL_LEN, tip[1] + Math.cos(a) * PENCIL_LEN];
  const writing = f >= B.learn + 12 && f < B.slam;
  const baseX = writing ? butt[0] - 70 : f >= B.slam ? mix(writePoint(1)[0] - Math.sin(a) * PENCIL_LEN - 70, 250, slam) : mix(CUP.cx, 330, hop);
  const baseY = f < B.learn ? mix(CUP.rimY, 1290, hop) - Math.sin(hop * Math.PI) * 120 : 1290;
  const hero: CrabProps = {
    x: baseX, y: baseY, s: 0.74, rot: slam * -12, legPhase: writing ? f * 0.8 : hop > 0 && hop < 1 ? f : 0,
    mood: f < B.learn ? 'happy' : f < B.slam ? 'determined' : 'shock', look: writing ? [0.8, -0.8] : f >= B.slam ? [0.6, -0.6] : [0.4, 0],
    raise: 0.9, shadow: hop >= 1 ? 1 : 0,
  };
  if (writing) { hero.reachR = reach(hero, butt); hero.clawR = 0.05; }
  if (f >= B.slam + 14) hero.mood = 'worried';
  const showHero = f >= B.toCup + 22;

  const b = bubble4(f);
  const pencilTip: Pt = f < B.slam ? tip : [mix(tip[0], 960, pencilFly), mix(tip[1], 1270, pencilFly) - Math.sin(pencilFly * Math.PI) * 260];

  return (
    <g transform={`translate(${-leave * 1100} 0)`}>
      <Lamp x={850} y={330 - (1 - rise) * 500} on={rise * flicker} />
      <g transform={`translate(0 ${(1 - rise) * 700})`}>
        <Desk y={1300} />
        <ellipse cx={NB.x - NB.w / 2 + 40} cy={1306} rx={260} ry={18} fill="#000" opacity={0.25} />
        <Notebook x={NB.x} y={NB.y} w={NB.w} h={NB.h} open={open} write={write} squash={slam * (1 - prog(f, B.slam + 6, 10))} tilt={slam * 3} />
        {f >= B.slam && <Sparkle x={NB.x - 120} y={NB.y - NB.h - 20} p={prog(f, B.slam, 14)} color={C.red} s={1.4} />}
      </g>
      {f > B.toCup + 18 && (
        <g>
          <VesselBack v={CUP} />
          <Steam x={CUP.cx} y={CUP.rimY - 34} draw={prog(f, B.toCup + 24, 18)} t={f} />
          {showHero && hop < 0.5 && <Crab {...hero} />}
          <VesselFront v={CUP} cup={1} />
        </g>
      )}
      {showHero && hop >= 0.5 && <Crab {...hero} />}
      {f >= B.learn + 10 && pencilFly < 1 && (
        <Pencil x={pencilTip[0]} y={pencilTip[1]} rot={f < B.slam ? -145 : -145 + pencilFly * 420} s={1.75} />
      )}
      {pencilFly >= 1 && <Pencil x={960} y={1290} rot={-90} s={1.75} />}
      {writing && <Sparkle x={tip[0] - 20} y={tip[1] - 40} p={((f - B.learn) % 14) / 14} color={C.blueLight} s={0.6} />}
      {f >= B.doubt && b.o > 0 && <BubbleShape x={b.x} y={b.y} w={800} h={236} tail="left" fill={C.red} rot={b.rot} scale={b.scale} o={b.o} />}
    </g>
  );
};
