import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from './fonts';
import { REEL, Reel } from './Film';
import { FPS, H, W } from './theme';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={REEL.durationInFrames} fps={FPS} width={W} height={H} defaultProps={{ check: false, show: false }} />
    <Composition id="ReelCheck" component={Reel} durationInFrames={REEL.durationInFrames} fps={FPS} width={W} height={H} defaultProps={{ check: true, show: true }} />
  </>
);
