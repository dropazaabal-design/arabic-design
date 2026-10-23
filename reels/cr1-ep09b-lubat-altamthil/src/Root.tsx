import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from '../../../films/hudoo/src/fonts';
import { Reel } from './Reel';
import { FPS, TOTAL } from './timing';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} defaultProps={{ audio: true }} />
    <Composition id="ReelSilent" component={Reel} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} defaultProps={{ audio: false }} />
  </>
);
