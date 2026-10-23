import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from './fonts';
import { A_FRAMES, H, ReelA, W } from './a/A';
import { B_FRAMES, ReelB } from './b/B';
import { C_FRAMES, ReelC } from './c/C';
import { CoverA, CoverB, CoverC } from './covers';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="A" component={ReelA} durationInFrames={A_FRAMES} fps={60} width={W} height={H} />
    <Composition id="B" component={ReelB} durationInFrames={B_FRAMES} fps={60} width={W} height={H} />
    <Composition id="C" component={ReelC} durationInFrames={C_FRAMES} fps={60} width={W} height={H} />
    <Composition id="CoverA" component={CoverA} durationInFrames={1} fps={60} width={W} height={H} />
    <Composition id="CoverB" component={CoverB} durationInFrames={1} fps={60} width={W} height={H} />
    <Composition id="CoverC" component={CoverC} durationInFrames={1} fps={60} width={W} height={H} />
  </>
);
