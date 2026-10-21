import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from './fonts';
import { A_FRAMES, H, ReelA, W } from './a/A';
import { B_FRAMES, ReelB } from './b/B';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="A" component={ReelA} durationInFrames={A_FRAMES} fps={60} width={W} height={H} />
    <Composition id="B" component={ReelB} durationInFrames={B_FRAMES} fps={60} width={W} height={H} />
  </>
);
