import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { Captions, Progress } from '../scenes/common';
import { K00, K01, K02, K03, K04 } from '../scenes/s1';
import { K05, K06, K07, K08 } from '../scenes/s2';
import { K09, K10, K11, K12 } from '../scenes/s3';

// The reel: narration, every chunk's scene on one white page, captions and the progress line on top.
const SCENES = [K00, K01, K02, K03, K04, K05, K06, K07, K08, K09, K10, K11, K12];

export const Film: React.FC = () => (
  <AbsoluteFill style={{ background: '#fff' }}>
    <Audio src={staticFile('audio/mix.wav')} />
    <svg viewBox="0 0 1080 1920" width="100%" height="100%">
      {SCENES.map((S, i) => <S key={i} />)}
      <Captions />
      <Progress />
    </svg>
  </AbsoluteFill>
);
