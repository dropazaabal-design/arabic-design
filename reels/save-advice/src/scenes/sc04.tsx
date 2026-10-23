import React from 'react';
import { Book, Card, Drawer } from '../art/saved';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Label } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sceneEnd, sec, useEpisodeFrame, wordAt } from '../time';
import { CARD, CENTER, FAN_S, GENERIC_TABS, LABELED_TABS, TAB_Y, Title } from './shared';

// sc04 — choose one: the reading card lifts out (green ring), its «لاحقًا» peels off, the others go
// back into the drawer; then the card turns over and becomes a book — a small action.
export const SC04: React.FC = () => {
  const f = useEpisodeFrame();
  const b = { choose: wordAt('s05', 'اختر'), one: wordAt('s05', 'واحدة'), turn: wordAt('s05', 'وحولها'), act: wordAt('s05', 'فعل') };
  const lift = prog(f, b.choose - sec(0.05), sec(0.6), ease.inOut);
  const back = prog(f, b.choose + sec(0.1), sec(0.5), ease.in);
  const peel = prog(f, b.one, sec(0.5), ease.in);
  const close = prog(f, b.one + sec(0.4), sec(0.4), ease.inOut);
  const flipA = prog(f, b.turn - sec(0.05), sec(0.25), ease.in), flipB = prog(f, b.turn + sec(0.2), sec(0.3), ease.out);
  const r = CARD.reading;
  const tabs = [...GENERIC_TABS.map((t) => ({ ...t, dust: 1 })), ...LABELED_TABS.map((t, i) => ({ ...t, h: t.h * (i === 0 ? 0 : back) }))];
  return (
    <Stage f={f} svg={
      <>
        <Drawer open={1 - close} tabs={tabs} />
        {(['focus', 'day'] as const).map((k, i) => {
          const c = CARD[k];
          return back < 1 ? <Card key={k} kind={c.kind} label={T.sc04[k]} color={c.color} x={mix(c.fan[0], c.tab, back)} y={mix(c.fan[1], TAB_Y, back)} s={mix(FAN_S, 0.36, back)} rot={(i * 2 - 1) * 3 * (1 - back)} later={1} laterText={T.sc04.later} o={1 - back * 0.5} /> : null;
        })}
        {flipA < 1 && (
          <g transform={`translate(${mix(r.fan[0], CENTER[0], lift)} ${mix(r.fan[1], CENTER[1], lift)}) scale(${1 - flipA} 1) translate(${-mix(r.fan[0], CENTER[0], lift)} ${-mix(r.fan[1], CENTER[1], lift)})`}>
            <Card kind={r.kind} label={T.sc04.reading} color={r.color} x={mix(r.fan[0], CENTER[0], lift)} y={mix(r.fan[1], CENTER[1], lift)} s={mix(FAN_S, 0.95, lift)} rot={3 * (1 - lift)}
              later={1 - peel} laterText={T.sc04.later} ring={lift} />
          </g>
        )}
        {flipA >= 1 && (
          <g transform={`translate(${CENTER[0]} ${CENTER[1]}) scale(${flipB} 1) translate(${-CENTER[0]} ${-CENTER[1]})`}>
            <Book x={CENTER[0]} y={CENTER[1]} open={0} color={C.blue} s={1.1} />
          </g>
        )}
      </>
    }>
      <Title text={T.sc04.title} f={f} at={b.choose - sec(0.1)} until={sceneEnd('sc04') - sec(0.35)} color={C.green} />
      <Label text={T.sc04.small} f={f} at={b.act - sec(0.1)} until={sceneEnd('sc04') - sec(0.35)} x={540} y={905} size={50} bg={C.green} />
    </Stage>
  );
};
