import React from 'react';
import { Eye, House } from '../art/taghafol';
import { T } from '../copy';
import { Stage } from '../Stage';
import { at, ease, mix, prog, sceneStart, sec, useEpisodeFrame } from '../time';
import { Title } from './shared';

// sc09 — «هذا التغافل، والتغافل مطلوب حتى في بيتك: مع بنيك، مع أهلك، مع من إليك». The half-lidded eye (sees,
// lets pass) goes up under a roof; a house is drawn around it and its three rooms light on the three words.
export const SC09: React.FC = () => {
  const f = useEpisodeFrame();
  const s0 = sceneStart('sc09');
  const appear = prog(f, s0, sec(0.5), ease.inOut);
  const up = prog(f, at(70.42), sec(0.8), ease.inOut);
  const house = prog(f, at(71.3), sec(1.3), ease.inOut);
  const rooms = ([[T.sc09.kids, 73.46], [T.sc09.family, 74.2], [T.sc09.yours, 75.22]] as const).map(([label, t]) => ({ label, lit: prog(f, at(t), sec(0.35)) }));
  const t2 = at(71.42);
  return (
    <Stage f={f} svg={
      <>
        <House x={540} y={900} p={house} rooms={rooms} />
        <Eye id="sc09" x={540} y={mix(880, 650, up)} s={mix(0.85, 0.38, up)} p={appear} lid={mix(0.2, 0.45, appear)} />
      </>
    }>
      <Title text={T.sc09.title1} f={f} at={Math.max(s0, at(68.92))} until={t2 - sec(0.3)} />
      <Title text={T.sc09.title2} f={f} at={t2} />
    </Stage>
  );
};
