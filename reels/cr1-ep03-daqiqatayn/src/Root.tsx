import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from './fonts';
import { REEL, Reel } from './Film';
import { SvgLab } from './Lab';
import { TestShot } from './TestShot';
import { FPS, H, W } from './theme';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={REEL.durationInFrames} fps={FPS} width={W} height={H} />
    <Composition id="TestShot" component={TestShot} durationInFrames={FPS * 11} fps={FPS} width={W} height={H} defaultProps={{ dark: false }} />
    <Composition id="TestShotDark" component={TestShot} durationInFrames={FPS * 11} fps={FPS} width={W} height={H} defaultProps={{ dark: true }} />
    <Composition id="SvgLab" component={SvgLab} durationInFrames={60} fps={FPS} width={W} height={H} />
  </>
);
