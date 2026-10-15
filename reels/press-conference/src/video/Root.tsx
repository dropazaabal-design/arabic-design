import React from 'react';
import { Composition } from 'remotion';
import timeline from '../../timeline.json';
import { Cover } from './Cover';
import { Reel } from './Reel';

// The reel at 60 fps (timeline.json, measured from the take). Reel30 is the same scene at 30 fps: the render check
// requires the same picture at the same second. Cover is one still (package.json "cover").
export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1080} height={1920} />
    <Composition id="Reel30" component={Reel} durationInFrames={Math.round(timeline.totalSeconds * 30)} fps={30} width={1080} height={1920} />
    <Composition id="Cover" component={Cover} durationInFrames={1} fps={timeline.fps} width={1080} height={1920} />
  </>
);
