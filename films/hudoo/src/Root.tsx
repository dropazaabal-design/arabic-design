import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from './fonts';
import { CastSheet, ExpressionSheet, HandSheet, PoseSheet, TurnSheet } from './sheets';
import { Film } from './film/Film';
import { TOTAL_FRAMES } from './film/engine';

loadFonts();
const sheet = { durationInFrames: 1, fps: 60, width: 1920, height: 1080 } as const;

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={TOTAL_FRAMES} fps={60} width={1920} height={1080} defaultProps={{ audio: true }} />
    <Composition id="FilmSilent" component={Film} durationInFrames={TOTAL_FRAMES} fps={60} width={1920} height={1080} defaultProps={{ audio: false }} />
    <Composition id="CastSheet" component={CastSheet} {...sheet} />
    <Composition id="TurnSheet" component={TurnSheet} {...sheet} />
    <Composition id="ExpressionSheet" component={ExpressionSheet} {...sheet} />
    <Composition id="PoseSheet" component={PoseSheet} {...sheet} />
    <Composition id="HandSheet" component={HandSheet} {...sheet} />
  </>
);
