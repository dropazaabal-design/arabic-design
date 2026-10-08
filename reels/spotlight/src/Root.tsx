import React from 'react';
import { Composition } from 'remotion';
import { Cover, CoverTall } from './Cover';
import { Reel } from './Reel';
import timeline from './timeline.json';

// 1920×1080, 60 fps, 5400 frames: all read from the measured timeline.
export const Root: React.FC = () => (
  <>
    <Composition id="Spotlight" component={Reel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={timeline.width} height={timeline.height} />
    {/* covers: render one still at COVER_FRAME (src/Cover.tsx) */}
    <Composition id="SpotlightCover" component={Cover} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1920} height={1080} />
    <Composition id="SpotlightCoverTall" component={CoverTall} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1080} height={1920} />
  </>
);
