import React from 'react';
import { Composition } from 'remotion';
import { Reel } from './Reel';
import timeline from '../timeline.json';

// 1080×1920 at 30 fps; the duration is the measured timeline (voice + beats + closing hold).
export const Root: React.FC = () => (
  <Composition id="Reel" component={Reel} durationInFrames={timeline.durationInFrames} fps={timeline.fps}
    width={timeline.width} height={timeline.height} defaultProps={{ guides: false }} />
);
