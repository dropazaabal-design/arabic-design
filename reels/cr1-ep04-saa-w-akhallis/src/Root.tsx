import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from './fonts';
import { TestShot } from './TestShot';
import { TrialInputs } from './TrialInputs';
import { FPS, H, W } from './theme';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="TestShot" component={TestShot} durationInFrames={FPS * 10} fps={FPS} width={W} height={H} defaultProps={{ legacy: false }} />
    <Composition id="TestShotLegacy" component={TestShot} durationInFrames={FPS * 10} fps={FPS} width={W} height={H} defaultProps={{ legacy: true }} />
    <Composition id="TrialInputs" component={TrialInputs} durationInFrames={1} fps={FPS} width={1024} height={1024} defaultProps={{ which: 'naser' as const }} />
  </>
);
