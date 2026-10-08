import React from 'react';
import { Composition, Still } from 'remotion';
import { Cover } from './Cover';
import { Reel } from './Reel';
import timeline from './timeline.json';

export const Root: React.FC = () => (
  <>
    <Composition id="Hedgehog" component={Reel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={timeline.width} height={timeline.height} />
    <Still id="HedgehogCover" component={Cover} width={1080} height={1920} />
  </>
);
