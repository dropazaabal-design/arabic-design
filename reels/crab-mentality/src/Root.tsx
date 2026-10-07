import React from 'react';
import { Composition } from 'remotion';
import { Reel } from './Reel';
import timeline from './timeline.json';

export const Root: React.FC = () => (
  <Composition id="CrabReel" component={Reel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={timeline.width} height={timeline.height} />
);
