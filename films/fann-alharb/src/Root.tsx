import React from 'react';
import { AbsoluteFill, Composition } from 'remotion';
import { loadFonts } from './fonts';
import { Film } from './film/Film';
import { Sheet } from './film/Sheet';
import timing from './timing.json';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={timing.frames} fps={60} width={1920} height={1080} />
    <Composition id="Sheet" component={Sheet} durationInFrames={600} fps={60} width={1920} height={1080} />
  </>
);
