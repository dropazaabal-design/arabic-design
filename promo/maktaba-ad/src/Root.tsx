import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from '../../../films/hudoo/src/fonts';
import { Ad } from './Ad';
import { Cover } from './Cover';
import { TOTAL } from './timing';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Ad} durationInFrames={TOTAL} fps={60} width={1080} height={1920} defaultProps={{ format: 'reel' as const, audio: true }} />
    <Composition id="Feed" component={Ad} durationInFrames={TOTAL} fps={60} width={1080} height={1350} defaultProps={{ format: 'feed' as const, audio: true }} />
    <Composition id="ReelSilent" component={Ad} durationInFrames={TOTAL} fps={60} width={1080} height={1920} defaultProps={{ format: 'reel' as const, audio: false }} />
    <Composition id="FeedSilent" component={Ad} durationInFrames={TOTAL} fps={60} width={1080} height={1350} defaultProps={{ format: 'feed' as const, audio: false }} />
    <Composition id="Cover" component={Cover} durationInFrames={1} fps={60} width={1080} height={1920} />
  </>
);
