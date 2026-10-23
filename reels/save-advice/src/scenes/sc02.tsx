import React from 'react';
import { Card, Drawer } from '../art/saved';
import { T } from '../copy';
import { Stage } from '../Stage';
import { ease, mix, prog, sec, useEpisodeFrame, wordAt } from '../time';
import { CARD, GENERIC_TABS, LABELED_TABS, TAB_Y } from './shared';

// sc02 — one saved video after another: each card arrives big, then drops into the drawer as a tab.
const KEYS = ['reading', 'focus', 'day'] as const;

export const SC02: React.FC = () => {
  const f = useEpisodeFrame();
  const at = [wordAt('s02', 'القراءة'), wordAt('s02', 'التركيز'), wordAt('s02', 'ترتيب')];
  const drops = [at[1] - sec(0.75), at[2] - sec(0.75), wordAt('s02', 'يومك') + sec(0.35)];
  const tabs = [...GENERIC_TABS.map((t) => ({ ...t, dust: 1 })), ...LABELED_TABS.map((t, i) => ({ ...t, h: t.h * prog(f, drops[i] + sec(0.3), sec(0.2)) }))];
  return (
    <Stage f={f} svg={
      <>
        <Drawer open={1} tabs={tabs} />
        {KEYS.map((k, i) => {
          const inP = prog(f, at[i] - sec(0.2), sec(0.4), ease.out);
          const drop = prog(f, drops[i], sec(0.45), ease.in);
          if (inP <= 0 || drop >= 1) return null;
          const c = CARD[k];
          return <Card key={k} kind={c.kind} label={T.sc02[k]} color={c.color}
            x={mix(540, c.tab, drop)} y={mix(mix(260, 680, inP), TAB_Y, drop)} s={mix(mix(0.6, 1, inP), 0.36, drop)} rot={mix(-4 + i * 4, 0, drop)} o={Math.min(1, inP * 2)} />;
        })}
      </>
    } />
  );
};
