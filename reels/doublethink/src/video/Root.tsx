import React from 'react';
import { Composition } from 'remotion';
import timeline from '../../timeline.json';
import { Cover } from './Cover';
import { ModelSheet } from './ModelSheet';
import { Reel } from './Reel';

// 1080×1920 at 30 fps; the length is the measured recording's (timeline.json).
export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1080} height={1920} />
    <Composition id="ModelSheet" component={ModelSheet} durationInFrames={1} fps={timeline.fps} width={1080} height={1920} />
    <Composition id="Cover" component={Cover} durationInFrames={1} fps={timeline.fps} width={1080} height={1920} />
  </>
);
