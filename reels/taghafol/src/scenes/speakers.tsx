import React from 'react';
import { T } from '../copy';
import { SpeakerScene } from '../Speaker';
import { C } from '../theme';
import { at, sceneStart, sec, useEpisodeFrame } from '../time';
import { Title } from './shared';

// The speaker scenes: his picture and one short title from what he is saying. Beats are source seconds.

/** sc01 — cold open: the question and its answer, from the first frame. */
export const SC01: React.FC = () => {
  const f = useEpisodeFrame();
  const a = at(26.02, 0);                                                  // «الفطن»
  return (
    <SpeakerScene id="sc01">
      <Title text={T.sc01.q} f={f} at={-sec(1)} until={a - sec(0.3)} color={C.white} />
      <Title text={T.sc01.a} f={f} at={a} color={C.green} />
    </SpeakerScene>
  );
};

/** sc03 — «وهذا التغافل صفة محمودة في الرجال». */
export const SC03: React.FC = () => {
  const f = useEpisodeFrame();
  return (
    <SpeakerScene id="sc03">
      <Title text={T.sc03.title} f={f} at={at(19.56, 2)} color={C.green} />
    </SpeakerScene>
  );
};

/** sc05 — the opposite, acted out (the one who questions everything), then «لذا قال الأول». */
export const SC05: React.FC = () => {
  const f = useEpisodeFrame();
  const poet = at(40.44);
  return (
    <SpeakerScene id="sc05">
      <Title text={T.sc05.q} f={f} at={Math.max(sceneStart('sc05'), at(36.9))} until={poet - sec(0.3)} color={C.red} />
      <Title text={T.sc05.poet} f={f} at={poet} color={C.white} />
    </SpeakerScene>
  );
};

/** sc08 — «حمد من عاشره… هذه من خصال السادة». */
export const SC08: React.FC = () => {
  const f = useEpisodeFrame();
  const b = at(64.12);
  return (
    <SpeakerScene id="sc08">
      <Title text={T.sc08.title1} f={f} at={at(60.28)} until={b - sec(0.3)} color={C.white} />
      <Title text={T.sc08.title2} f={f} at={b} color={C.green} />
    </SpeakerScene>
  );
};

/** sc10 — the conclusion, in his words. */
export const SC10: React.FC = () => {
  const f = useEpisodeFrame();
  const b = at(79.22);
  return (
    <SpeakerScene id="sc10">
      <Title text={T.sc10.title1} f={f} at={at(77.88)} until={b - sec(0.3)} color={C.white} />
      <Title text={T.sc10.title2} f={f} at={b} color={C.green} />
    </SpeakerScene>
  );
};
