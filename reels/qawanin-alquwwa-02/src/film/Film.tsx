import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { Captions, Progress } from '../scenes/common';
import { M00, M01, M02, M03, M04 } from '../scenes/s1';
import { M05, M06, M07, M08, M09 } from '../scenes/s2';

// The reel: narration, every chunk's scene on one white page, captions and the progress line on top.
const SCENES = [M00, M01, M02, M03, M04, M05, M06, M07, M08, M09];

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
