import React from 'react';
import { Calendar, CoverCard, Headphones, Ruler, Target, Wallet } from '../art/doodles';
import { T } from '../copy';
import { Paper, Stage } from '../Stage';
import { Headline, Label, Note } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneEnd, useEpisodeFrame, wordAt } from '../time';

// sc07 — the application: need → independent yardstick → decision, then one small experiment for the week.
export const SC07: React.FC = () => {
  const f = useEpisodeFrame();
  const end = sceneEnd('sc07');
  const b = {
    need: wordAt('s31', 'الحاجة'), yard: wordAt('s32', 'معيار'), hours: wordAt('s32', 'كم'), decide: wordAt('s33', 'القرار'),
    unseen: wordAt('s33', 'أر'), week: wordAt('s34', 'تجربة'),
  };
  const st = (at: number) => prog(f, at - sec(0.2), sec(0.5), ease.out);
  const up = prog(f, b.week - sec(0.3), sec(0.8), ease.inOut);
  const cover = prog(f, b.unseen - sec(0.3), sec(0.7), ease.inOut);
  const stations: Array<[number, number, string]> = [[1460, b.need, T.sc07.need], [960, b.yard, T.sc07.yardstick], [460, b.decide, T.sc07.decision]];
  const Y = mix(470, 330, up), S = mix(1, 0.72, up);
  const card = prog(f, b.week, sec(0.6), ease.out);
  return (
    <Stage f={f} svg={
      <>
        {stations.map(([x, at], i) => {
          const p = st(at);
          if (p <= 0) return null;
          return (
            <g key={i} transform={`translate(${x} ${Y}) scale(${S})`} opacity={p}>
              <circle cx={0} cy={-250} r={42} fill={C.green} stroke={C.ink} strokeWidth={6} />
              <text y={-248} textAnchor="middle" dominantBaseline="central" fontFamily="Cairo" fontWeight={900} fontSize={46} fill={C.white}>{i + 1}</text>
              {i === 0 && <Target x={0} y={10} s={1.1} p={prog(f, at, sec(0.9), ease.inOut)} />}
              {i === 1 && <><Wallet x={0} y={-30} s={0.8} /><Ruler x={0} y={110} s={0.62} color={C.green} p={prog(f, at, sec(0.8), ease.inOut)} /></>}
              {i === 2 && <><Headphones x={0} y={-10} s={0.85} color={C.coverBlue} fancy />{cover > 0 && <CoverCard x={mix(-320, 0, cover)} y={10} w={330} h={260} o={cover} rot={mix(-8, -2, cover)} />}</>}
            </g>
          );
        })}
        {card > 0 && (
          <g opacity={card} transform={`translate(0 ${(1 - card) * 40})`}>
            <Paper x={960} y={800} w={1100} h={210} fill={C.white} />
            <Calendar x={1400} y={800} s={0.7} />
          </g>
        )}
      </>
    }>
      {stations.map(([x, at, text], i) => <Label key={i} text={text} f={f} at={at} until={b.week - sec(0.3)} x={x} y={700} size={48} bg={i === 2 ? C.blue : C.green} />)}
      <Note text={T.sc07.hours} f={f} at={b.hours} until={b.week - sec(0.3)} x={960} y={790} size={38} color={C.ink} />
      <Note text={T.sc07.unseen} f={f} at={b.unseen} until={b.week - sec(0.3)} x={460} y={790} size={38} color={C.ink} />
      <Headline text={`${T.sc07.week1}\n${T.sc07.week2}`} f={f} at={b.week + sec(0.2)} until={end} x={900} y={722} w={900} size={52} color={C.ink} />
    </Stage>
  );
};
