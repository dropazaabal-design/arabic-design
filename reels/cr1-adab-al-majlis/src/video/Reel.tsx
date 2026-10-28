import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import { Scene } from '../scene/Scene';
import { loadFonts } from './fonts';
import { Sfx } from './sfx';
import { MIX_GAIN, TL } from './time';

loadFonts();

/** The shots, the narrator's lines at their measured places (timeline.json), effects under them. */
export const Reel: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Scene />
      {TL.segments.map((s) => <Sequence key={s.id} from={Math.round(s.fileStart * fps)} layout="none"><Audio src={staticFile(s.file)} volume={MIX_GAIN} /></Sequence>)}
      <Sfx />
    </AbsoluteFill>
  );
};
