import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from './fonts';
import { REEL, Reel } from './Film';
import { TestShot } from './TestShot';
import { TrialInputs } from './TrialInputs';
import { FPS, H, W } from './theme';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={REEL.durationInFrames} fps={FPS} width={W} height={H} defaultProps={{ check: false, show: false }} />
    <Composition id="ReelCheck" component={Reel} durationInFrames={REEL.durationInFrames} fps={FPS} width={W} height={H} defaultProps={{ check: true, show: true }} />
    <Composition id="TestShot" component={TestShot} durationInFrames={FPS * 10} fps={FPS} width={W} height={H} defaultProps={{ legacy: false }} />
    <Composition id="TestShotLegacy" component={TestShot} durationInFrames={FPS * 10} fps={FPS} width={W} height={H} defaultProps={{ legacy: true }} />
    <Composition id="TrialInputs" component={TrialInputs} durationInFrames={1} fps={FPS} width={1024} height={1024} defaultProps={{ which: 'naser' as const }} />
  </>
);
