import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from './fonts';
import { Cover } from './Cover';

loadFonts();

// One still per part: render with inputProps {part: 1..6} (tools/covers.mjs).
export const Root: React.FC = () => (
  <Composition id="Cover" component={Cover} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ part: 1 }} />
);
