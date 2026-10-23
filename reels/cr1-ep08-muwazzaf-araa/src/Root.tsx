import React from 'react';
import { Composition } from 'remotion';
import { Episode, TOTAL } from './Episode';
import { loadFonts } from './kit';
import { Test } from './Test';
import { Cover } from './Cover';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Ep08" component={Episode} durationInFrames={TOTAL} fps={60} width={1080} height={1920} defaultProps={{ audio: true }} />
    <Composition id="Ep08Silent" component={Episode} durationInFrames={TOTAL} fps={60} width={1080} height={1920} defaultProps={{ audio: false }} />
    <Composition id="Cover" component={Cover} durationInFrames={1} fps={60} width={1080} height={1920} />
    <Composition id="Test" component={Test} durationInFrames={240} fps={60} width={1080} height={1920} />
  </>
);
