import React from 'react';
import { Phone } from '../art/reel';
import { Book, Card, Drawer, Task } from '../art/saved';
import { Check } from '../art/world';
import { T } from '../copy';
import { Stage } from '../Stage';
import { C } from '../theme';
import { ease, mix, prog, sceneEnd, sec, useEpisodeFrame, wordAt } from '../time';
import { CARD, CENTER, GENERIC_TABS, LABELED_TABS, TAB_Y, Title } from './shared';

// sc05 — the action, shown: the book opens and one page is read (line by line); then the focus card
// comes out, the phone is moved away, and one task starts filling.
export const SC05: React.FC = () => {
  const f = useEpisodeFrame();
  const b = { open: wordAt('s06', 'افتح'), read: wordAt('s06', 'واقرأ'), focus: wordAt('s07', 'عن'), away: wordAt('s07', 'أبعد'), start: wordAt('s07', 'وابدأ') };
  const open = prog(f, b.open - sec(0.05), sec(0.6), ease.inOut);
  const read = prog(f, b.read - sec(0.05), sec(1.0), (x) => x);
  const aside = prog(f, b.focus - sec(0.15), sec(0.5), ease.inOut);
  const drawer = prog(f, b.focus - sec(0.2), sec(0.3)) * (1 - prog(f, b.away + sec(0.2), sec(0.4)));
  const rise = prog(f, b.focus, sec(0.55), ease.out);
  const flipA = prog(f, b.focus + sec(0.6), sec(0.2), ease.in), flipB = prog(f, b.focus + sec(0.8), sec(0.25), ease.out);
  const phoneIn = prog(f, b.focus + sec(0.7), sec(0.3), ease.out);
  const away = prog(f, b.away - sec(0.05), sec(0.6), ease.in);
  const task = prog(f, b.start - sec(0.05), sec(1.6), (x) => x) * 0.65;
  const c = CARD.focus;
  const tabs = [...GENERIC_TABS.map((t) => ({ ...t, dust: 1 })), ...LABELED_TABS.map((t, i) => ({ ...t, h: t.h * (i === 1 ? 1 - rise : i === 0 ? 0 : 1) }))];
  const TX = 540, TY = 780;
  return (
    <Stage f={f} svg={
      <>
        <Drawer open={drawer} tabs={tabs} />
        <Book x={mix(CENTER[0], 250, aside)} y={mix(CENTER[1], 520, aside)} s={mix(1.1, 0.42, aside)} open={open} read={read} color={C.blue} />
        {aside > 0.9 && <Check x={360} y={440} s={1.1} />}
        {rise > 0 && flipA < 1 && (
          <g transform={`translate(${TX} ${TY}) scale(${1 - flipA} 1) translate(${-TX} ${-TY})`}>
            <Card kind={c.kind} label={T.sc05.focus} color={c.color} x={mix(c.tab, TX, rise)} y={mix(TAB_Y, TY, rise)} s={mix(0.36, 0.7, rise)} />
          </g>
        )}
        {flipA >= 1 && <g transform={`translate(${TX} ${TY}) scale(${flipB} 1) translate(${-TX} ${-TY})`}><Task x={TX} y={TY} p={task} label="" /></g>}
        {phoneIn > 0 && away < 1 && <Phone x={mix(860, 1260, away)} y={mix(760, 700, away)} s={0.4} rot={mix(0, 18, away)} o={phoneIn} />}
      </>
    }>
      <Title text={T.sc05.title1} f={f} at={b.open - sec(0.1)} until={b.start - sec(0.3)} color={C.blue} />
      <Title text={T.sc05.title2} f={f} at={b.start - sec(0.1)} until={sceneEnd('sc05') - sec(0.35)} color={C.green} />
    </Stage>
  );
};
