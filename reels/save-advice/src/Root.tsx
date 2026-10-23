import React from 'react';
import { Composition } from 'remotion';
import { Cover } from './Cover';
import { Reel } from './Reel';
import timeline from '../timeline.json';

// 1080×1920 at 60 fps; the duration is the measured recording's (timeline.json).
export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1080} height={1920} />
    <Composition id="Cover" component={Cover} durationInFrames={1} fps={timeline.fps} width={1080} height={1920} />
  </>
);
