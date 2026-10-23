import React from 'react';
import { Composition } from 'remotion';
import timeline from '../../timeline.json';
import { CastSheet, ExpressionSheet, PropSheet } from './ModelSheet';
import { Reel } from './Reel';

// 1080×1920 at 30 fps; the reel's length is the measured recording's (timeline.json).
export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1080} height={1920} />
    <Composition id="CastSheet" component={CastSheet} durationInFrames={1} fps={timeline.fps} width={1080} height={1920} />
    <Composition id="ExpressionSheet" component={ExpressionSheet} durationInFrames={1} fps={timeline.fps} width={1080} height={1920} />
    <Composition id="PropSheet" component={PropSheet} durationInFrames={1} fps={timeline.fps} width={1080} height={1920} />
  </>
);
