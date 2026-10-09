import React from 'react';
import { Card, Drawer, Sheet } from '../art/saved';
import { T } from '../copy';
import { Stage } from '../Stage';
import { C } from '../theme';
import { ease, mix, prog, sceneEnd, sec, useEpisodeFrame, wordAt } from '../time';
import { CARD, FAN_S, GENERIC_TABS, LABELED_TABS, TAB_Y, Title } from './shared';

// sc03 — after saving, nothing changed: the drawer closes, days pass (pages turn), the list comes
// back out — and each saved card is stamped «لاحقًا»: the saved list became a list of postponed things.
const KEYS = ['reading', 'focus', 'day'] as const;

export const SC03: React.FC = () => {
  const f = useEpisodeFrame();
  const b = { but: wordAt('s03', 'لكن'), after: wordAt('s03', 'بعد'), what: wordAt('s03', 'ماذا'), changed: wordAt('s03', 'تغير'),
    list: wordAt('s04', 'قائمة'), saved: wordAt('s04', 'المحفوظات'), stamps: [wordAt('s04', 'قائمة', 1), wordAt('s04', 'أشياء'), wordAt('s04', 'تؤجلها')] };
  const open = Math.max(1 - prog(f, b.but, sec(0.4), ease.in), prog(f, b.list - sec(0.1), sec(0.4), ease.out));
  const sheet = prog(f, b.after - sec(0.2), sec(0.3)) * (1 - prog(f, b.list - sec(0.3), sec(0.3)));
  const page = [b.after, b.what - sec(0.25), b.changed].filter((t) => f >= t).length;
  const flip = Math.min(...[b.after, b.what - sec(0.25), b.changed].map((t) => Math.abs(f - t))) < sec(0.12) ? 0.3 : 1;
  const rise = prog(f, b.saved - sec(0.15), sec(0.6), ease.out);
  const tabs = [...GENERIC_TABS.map((t) => ({ ...t, dust: 1 })), ...LABELED_TABS.map((t) => ({ ...t, h: t.h * (1 - rise) }))];
  return (
    <Stage f={f} svg={
      <>
        <Drawer open={open} tabs={tabs} />
        {/* dust settling on the closed drawer */}
        <g opacity={prog(f, b.changed - sec(0.1), sec(0.5)) * (1 - rise)} stroke={C.muted} strokeWidth={6} strokeLinecap="round" fill="none">
          <path d="M 220 1050 Q 250 1040 270 1062 M 820 1048 Q 850 1040 862 1066 M 300 1250 L 360 1250 M 700 1252 L 770 1252" />
        </g>
        {sheet > 0 && <Sheet x={540} y={640} s={1.1 * (flip < 1 ? 0.94 : 1)} mark={page * 3 + 1} o={sheet} />}
        {rise > 0 && KEYS.map((k, i) => {
          const c = CARD[k];
          return <Card key={k} kind={c.kind} label={T.sc03[k]} color={c.color} x={mix(c.tab, c.fan[0], rise)} y={mix(TAB_Y, c.fan[1], rise)} s={mix(0.36, FAN_S, rise)} rot={(i - 1) * -3 * rise}
            o={Math.min(1, rise * 3)} later={prog(f, b.stamps[i] - sec(0.1), sec(0.3), ease.out)} laterText={T.sc03.later} />;
        })}
      </>
    }>
      <Title text={T.sc03.title} f={f} at={b.what - sec(0.1)} until={sceneEnd('sc03') - sec(0.35)} />
    </Stage>
  );
};
