import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from './fonts';
import { TestShot } from './TestShot';
import { FPS, H, W } from './theme';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="TestShot" component={TestShot} durationInFrames={FPS * 10} fps={FPS} width={W} height={H} defaultProps={{ legacy: false }} />
    <Composition id="TestShotLegacy" component={TestShot} durationInFrames={FPS * 10} fps={FPS} width={W} height={H} defaultProps={{ legacy: true }} />
  </>
);
