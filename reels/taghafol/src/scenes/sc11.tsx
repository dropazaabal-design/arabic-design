import React from 'react';
import { Eye } from '../art/taghafol';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Headline, Label, Note } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sceneStart, sec, useEpisodeFrame } from '../time';

// sc11 — end card (after his last word): the half-lidded eye, his phrase, the account, and the source as far
// as it can be stated (the speaker's name is not on screen in the clip and is not guessed).
export const SC11: React.FC = () => {
  const f = useEpisodeFrame();
  const s0 = sceneStart('sc11');
  const e = prog(f, s0, sec(0.7), ease.inOut);
  return (
    <Stage f={f} svg={<Eye id="sc11" x={540} y={mix(800, 760, e)} p={e} lid={mix(0, 0.45, prog(f, s0 + sec(0.6), sec(0.5), ease.inOut))} />}>
      <Headline text={T.sc11.title} f={f} at={s0 + sec(0.3)} x={540} y={930} w={980} size={104} color={C.green} />
      <Label text={T.sc11.brand} f={f} at={s0 + sec(0.7)} x={540} y={1120} size={52} />
      <Note text={T.sc11.source} f={f} at={s0 + sec(0.9)} x={540} y={1230} w={900} size={40} />
    </Stage>
  );
};
