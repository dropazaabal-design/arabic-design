import React from 'react';
import { Card, DRAWER, Drawer, SaveButton, Start, Step } from '../art/saved';
import { Check } from '../art/world';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Headline } from '../text';
import { C } from '../theme';
import { TL, ease, mix, prog, sec, useEpisodeFrame, wordAt } from '../time';
import { CARD, GENERIC_TABS, Title } from './shared';

// sc07 — the close mirrors the opening: the save button comes back, but the drawer now holds less, and
// one step comes out of it. The last question stays on screen.
export const SC07: React.FC = () => {
  const f = useEpisodeFrame();
  const end = TL.durationInFrames;
  const b = { before: wordAt('s10', 'قبل'), save: wordAt('s10', 'تحفظ'), what: wordAt('s10', 'ما'), step: wordAt('s10', 'الخطوة') };
  const prev = 1 - prog(f, b.before - sec(0.3), sec(0.4));
  const open = prog(f, b.before - sec(0.1), sec(0.5), ease.out);
  const btn = prog(f, b.before, sec(0.4), ease.out) * (1 - prog(f, b.what - sec(0.1), sec(0.4)));
  const hover = Math.sin(prog(f, b.save - sec(0.05), sec(0.6)) * Math.PI);
  const out = prog(f, b.step - sec(0.1), sec(0.8), ease.out);
  const tabs = GENERIC_TABS.filter((_, i) => i === 1 || i === 4).map((t) => ({ ...t, dust: 0.5, h: t.h * (1 - 0.15 * out) }));
  const k = CARD.day;
  return (
    <Stage f={f} svg={
      <>
        {prev > 0 && <g opacity={prev}><Card kind={k.kind} label={T.sc07.day} color={k.color} x={540} y={680} s={0.85} ring={1} /><Check x={690} y={520} s={1.5} /><Start x={760} y={870} s={1.1} /></g>}
        <Drawer open={open} tabs={tabs} />
        {btn > 0 && <SaveButton x={540} y={720} s={0.8 * (1 + 0.06 * hover)} o={btn} fill={0} />}
        {out > 0 && <Step x={540} y={mix(DRAWER.y - 60, 760, out)} s={mix(0.4, 1.05, out)} label={T.sc07.step} o={Math.min(1, out * 3)} />}
      </>
    }>
      <Title text={T.sc07.title} f={f} at={b.what - sec(0.1)} size={92} />
      <Headline text={T.sc07.brand} f={f} at={end - sec(1.6)} x={540} y={1440} w={600} size={48} color={C.inkSoft} weight={800} />
    </Stage>
  );
};
