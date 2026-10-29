import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { C00, C01, C02, C03, C04, C05 } from '../scenes/p1';
import { C06, C07, C08, C09, C10 } from '../scenes/p2';
import { C11, C12, C13, C14, C15, C16 } from '../scenes/p3';

// The whole film: the narration, and every chunk's scene on one white page (each scene renders only in its own time).
const SCENES = [C00, C01, C02, C03, C04, C05, C06, C07, C08, C09, C10, C11, C12, C13, C14, C15, C16];

export const Film: React.FC<{ silent?: boolean }> = ({ silent }) => (
  <AbsoluteFill style={{ background: '#fff' }}>
    {!silent && <Audio src={staticFile('audio/mix.wav')} />}
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      {SCENES.map((S, i) => <S key={i} />)}
    </svg>
  </AbsoluteFill>
);
