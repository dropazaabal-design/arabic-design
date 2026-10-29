import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from './fonts';
import { Film } from './film/Film';
import timing from './timing.json';

loadFonts();

// Laid out at 1080×1920; rendered with --scale=2 for 2160×3840 (4K vertical).
export const Root: React.FC = () => (
  <Composition id="Film" component={Film} durationInFrames={timing.frames} fps={timing.fps} width={1080} height={1920} />
);
