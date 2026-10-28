import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { Captions, Progress } from '../scenes/common';
import { C00, C01, C02, C03, C04 } from '../scenes/s1';
import { C05, C06, C07, C08 } from '../scenes/s2';

// The reel: narration, every chunk's scene on one white page, captions and the progress line on top.
const SCENES = [C00, C01, C02, C03, C04, C05, C06, C07, C08];

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
