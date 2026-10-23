import React from 'react';
import { Composition } from 'remotion';
import { loadFonts } from './fonts';
import { CastSheet, ExpressionSheet, HandSheet, PoseSheet, TurnSheet } from './sheets';
import { Film } from './film/Film';
import { TIMELINE, TOTAL_FRAMES } from './film/engine';
import { Shot } from './film/Shot';
import { CoverTall, CoverWide } from './cover';

loadFonts();
const sheet = { durationInFrames: 1, fps: 60, width: 1920, height: 1080 } as const;

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={TOTAL_FRAMES} fps={60} width={1920} height={1080} defaultProps={{ audio: true }} />
    <Composition id="FilmSilent" component={Film} durationInFrames={TOTAL_FRAMES} fps={60} width={1920} height={1080} defaultProps={{ audio: false }} />
    {TIMELINE.map((s) => <Composition key={s.id} id={`Shot${String(s.id).padStart(3, '0')}`} component={Shot} durationInFrames={s.to - s.from} fps={60} width={1920} height={1080} defaultProps={{ id: s.id, audio: true }} />)}
    <Composition id="CoverWide" component={CoverWide} durationInFrames={1} fps={60} width={1920} height={1080} />
    <Composition id="CoverTall" component={CoverTall} durationInFrames={1} fps={60} width={1080} height={1350} />
    <Composition id="CastSheet" component={CastSheet} {...sheet} />
    <Composition id="TurnSheet" component={TurnSheet} {...sheet} />
    <Composition id="ExpressionSheet" component={ExpressionSheet} {...sheet} />
    <Composition id="PoseSheet" component={PoseSheet} {...sheet} />
    <Composition id="HandSheet" component={HandSheet} {...sheet} />
  </>
);
