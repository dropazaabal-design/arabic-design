import React from 'react';
import { Composition } from 'remotion';
import { Reel } from './Reel';
import timeline from '../timeline.json';

// 1080×1920 at 60 fps; the duration is the edited recording's plus the end card (timeline.json).
export const Root: React.FC = () => (
  <Composition id="Reel" component={Reel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1080} height={1920} />
);
