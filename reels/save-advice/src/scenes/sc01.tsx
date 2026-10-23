import React from 'react';
import { DRAWER, Drawer, SaveButton } from '../art/saved';
import { T } from '../copy';
import { Stage } from '../Stage';
import { ease, mix, prog, sceneEnd, sec, useEpisodeFrame, wordAt } from '../time';
import { GENERIC_TABS, Title } from './shared';

// sc01 — the hook from the first frame: the save button is pressed, turns into a drawer, and the
// drawer is already full; what is inside has not been used (it greys).
export const SC01: React.FC = () => {
  const f = useEpisodeFrame();
  const b = { how: wordAt('s01', 'كم'), saved: wordAt('s01', 'حفظت'), used: wordAt('s01', 'تستخدم') };
  const press = prog(f, b.how - sec(0.05), sec(0.3));
  const morph = prog(f, b.how + sec(0.35), sec(0.6), ease.inOut);
  const open = prog(f, b.saved - sec(0.1), sec(0.45), ease.out);
  const dust = prog(f, b.used - sec(0.1), sec(0.6));
  const tabs = GENERIC_TABS.map((t, i) => ({ ...t, h: t.h * prog(f, b.saved + sec(0.05 + i * 0.07), sec(0.25), ease.out), dust }));
  const btnY = mix(760, DRAWER.y, morph);
  return (
    <Stage f={f} svg={
      <>
        {morph > 0 && (
          <g transform={`translate(${DRAWER.x} ${mix(760, DRAWER.y, morph)}) scale(${mix(0.5, 1, morph)}) translate(${-DRAWER.x} ${-DRAWER.y})`}>
            <Drawer open={open} tabs={tabs} o={morph} />
          </g>
        )}
        {morph < 1 && <SaveButton x={540} y={btnY} s={mix(1.45, 0.7, morph)} o={1 - morph} fill={press} press={press} />}
      </>
    }>
      <Title text={T.sc01.title} f={f} at={-sec(0.25)} until={sceneEnd('sc01') - sec(0.35)} size={100} />
    </Stage>
  );
};
