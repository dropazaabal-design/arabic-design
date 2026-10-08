import React from 'react';
import { Arrow, Bubble, Headphones, PriceTag, Wallet } from '../art/doodles';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Headline, Label } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneEnd, sceneStart, useEpisodeFrame, wordAt } from '../time';

// sc05 — the decision evolving: $40 alone vs next to $200; a $30 plan ends at $40 while it feels like $160 saved.
export const SC05: React.FC = () => {
  const f = useEpisodeFrame();
  const start = sceneStart('sc05'), end = sceneEnd('sc05');
  const b = {
    pocket: wordAt('s18', 'تقارنه'), beside: wordAt('s19', 'بجانب'), fixed: wordAt('s20', 'ثابت'),
    story: wordAt('s21', 'تخيل'), plan: wordAt('s21', 'ثلاثين'), show200: wordAt('s21', 'بمئتين'), show40: wordAt('s21', 'بأربعين'),
    saved: wordAt('s22', 'وفرت'), over: wordAt('s22', 'عشرة'), order: wordAt('s23', 'الأغلى'), warn: wordAt('s24', 'انتبه'),
  };
  // part 1: comparison point moves from the wallet to the $200 pair
  const p1 = prog(f, start, sec(0.5));
  const wallet = prog(f, b.pocket - sec(0.2), sec(0.5));
  const toB = prog(f, b.beside - sec(0.1), sec(0.8), ease.inOut);
  const pulse = 1 + 0.08 * Math.sin(prog(f, b.fixed, sec(0.6)) * Math.PI);
  const p1Out = prog(f, b.story - sec(0.2), sec(0.5), ease.in);
  // part 2: the story with a plan
  const s200 = prog(f, b.show200 - sec(0.1), sec(0.5));
  const s40 = prog(f, b.show40 - sec(0.1), sec(0.5));
  const leave = prog(f, b.saved - sec(0.3), sec(0.6), ease.inOut);
  const badge = (at: number) => prog(f, at, sec(0.35), ease.out);
  const warn = prog(f, b.warn - sec(0.2), sec(0.5));
  return (
    <Stage f={f} svg={
      <>
        {p1Out < 1 && (
          <g opacity={p1 * (1 - p1Out)}>
            <Headphones x={1300} y={380} s={1.15} color={C.blue} />
            <PriceTag x={1300} y={680} s={pulse} label={T.sc05.price40} color={C.red} />
            {wallet > 0 && <Wallet x={620} y={mix(560, 640, toB)} s={1.1} o={wallet * (1 - toB)} />}
            {toB > 0 && <><Headphones x={mix(380, 620, toB)} y={360} s={1.3} color={C.coverBlue} fancy o={toB} /><PriceTag x={620} y={680} s={0.95} o={toB} label={T.sc05.price200} color={C.coverBlue} w={320} /></>}
            <Arrow from={[1120, 690]} to={[mix(760, 800, toB), mix(600, 690, toB)]} bend={0.2} p={prog(f, b.pocket, sec(0.6), ease.inOut)} color={C.blue} />
          </g>
        )}
        {p1Out > 0 && (
          <g>
            {s200 > 0 && <g opacity={s200 * (1 - leave)}><Headphones x={1260} y={430} s={1.0} color={C.coverBlue} fancy /><PriceTag x={1260} y={700} s={0.85} label={T.sc05.price200} color={C.coverBlue} w={320} /></g>}
            {s40 > 0 && <g transform={`translate(${mix(0, 260, leave)} 0)`} opacity={s40}><Headphones x={700} y={430} s={1.0} color={C.blue} /><PriceTag x={700} y={700} s={0.85} label={T.sc05.price40} color={C.red} /></g>}
            {s200 > 0 && leave < 1 && <g opacity={1 - leave}><Arrow from={[1110, 420]} to={[860, 420]} bend={-0.3} p={s40} color={C.inkSoft} /></g>}
            {[[1260, b.order, '1'], [700, b.order + sec(0.25), '2']].map(([x, at, n]) => {
              const p = badge(at as number);
              return p > 0 && leave < 1 ? <g key={n as string} transform={`translate(${x} 230) scale(${p})`} opacity={1 - leave}><circle r={36} fill={C.ink} /><text y={2} textAnchor="middle" dominantBaseline="central" fontFamily="Cairo" fontWeight={900} fontSize={40} fill={C.white}>{n}</text></g> : null;
            })}
            {leave > 0 && warn < 1 && <Bubble x={1340} y={360} w={560} h={190} thought tail={-1} fill={C.white} o={leave * (1 - warn)} />}
          </g>
        )}
      </>
    }>
      <Label text={T.sc05.hypothetical} f={f} at={start} until={end} x={1766} y={74} align="right" size={30} bg={C.coverGray} color={C.ink} />
      <Label text={T.sc05.reference} f={f} at={b.pocket + sec(0.3)} until={b.story - sec(0.2)} x={mix(620, 620, toB)} y={mix(450, 880, Math.min(1, toB * 2))} size={40} bg={C.blue} />
      <Label text={T.sc05.plan} f={f} at={b.plan - sec(0.1)} until={b.warn - sec(0.2)} x={1600} y={170} size={40} bg={C.green} />
      <Headline text={T.sc05.saved} f={f} at={b.saved} until={b.warn - sec(0.2)} x={1340} y={318} w={520} size={52} color={C.blue} />
      <Label text={T.sc05.over} f={f} at={b.over} until={b.warn - sec(0.2)} x={960} y={860} size={48} bg={C.red} />
      <Headline text={T.sc05.warning} f={f} at={b.warn} until={end} x={960} y={150 + 0 * warn} size={88} color={C.red} />
    </Stage>
  );
};
