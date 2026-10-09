import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { PAL } from '../characters/ink';
import { loadFonts } from './fonts';
import { SHOTS } from './shots';
import { Sfx } from './sfx';
import { TL, sec } from './time';

loadFonts();

/** The reel: one shot at a time, hard cuts on the words (storyboard.json), the narration lines at their
 *  measured places (timeline.json), short effects under the voice. No captions are burned in. */
export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  const shot = SHOTS.find((s) => f >= s.t0 && f < s.t1) ?? SHOTS[SHOTS.length - 1];
  const Shot = shot.component;
  return (
    <AbsoluteFill style={{ background: PAL.paper }}>
      <Shot f={f} t0={shot.t0} t1={shot.t1} />
      {TL.segments.map((s) => (
        <Sequence key={s.id} from={sec(s.fileStart)} layout="none"><Audio src={staticFile(s.file)} /></Sequence>
      ))}
      <Sfx />
    </AbsoluteFill>
  );
};
