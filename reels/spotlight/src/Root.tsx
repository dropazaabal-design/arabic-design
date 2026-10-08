import React from 'react';
import { Composition } from 'remotion';
import { Reel } from './Reel';
import timeline from './timeline.json';

// 1920×1080, 60 fps, 5400 frames: all read from the measured timeline.
export const Root: React.FC = () => (
  <Composition id="Spotlight" component={Reel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={timeline.width} height={timeline.height} />
);
