import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { PAL } from '../kit/style';
import { makeCtx, TIMELINE } from './engine';
import { ALL } from './Film';

/** One shot on its own (compositions Shot001…Shot160): the same render as in the film, from its first frame, with its slice of the soundtrack. */
export const Shot: React.FC<{ id: number; audio?: boolean }> = ({ id, audio = true }) => {
  const f = useCurrentFrame();
  const s = TIMELINE.find((x) => x.id === id)!;
  const R = ALL[id];
  return (
    <AbsoluteFill style={{ background: PAL.paper }}>
      {R ? R(makeCtx(s, f)) : null}
      {audio && <Audio src={staticFile('audio/mix.wav')} startFrom={s.from} />}
    </AbsoluteFill>
  );
};
