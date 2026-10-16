import React from 'react';
import { Composition, Still } from 'remotion';
import { Cover } from './Cover';
import long from './data/long.json';
import short from './data/short.json';
import { Episode } from './Episode';
import { Reel } from './Reel';

// Deliverables run at 60 fps (CR1 §1). The *Draft compositions replay the same timeline at 30 fps
// for the quick review preview only.
const frames = (s: number, fps: number) => Math.round(s * fps);
export const Root: React.FC = () => (
  <>
    <Composition id="Episode16x9" component={Episode} fps={60} width={1920} height={1080} durationInFrames={frames(long.totalSeconds, 60)} defaultProps={{ guides: false }} />
    <Composition id="Reel9x16" component={Reel} fps={60} width={1080} height={1920} durationInFrames={frames(short.totalSeconds, 60)} defaultProps={{ ratio: '9x16' as const, guides: false }} />
    <Composition id="Reel4x5" component={Reel} fps={60} width={1080} height={1350} durationInFrames={frames(short.totalSeconds, 60)} defaultProps={{ ratio: '4x5' as const, guides: false }} />
    <Still id="Cover16x9" component={Cover} width={1920} height={1080} defaultProps={{ ratio: '16x9' as const, guides: false }} />
    <Still id="Cover9x16" component={Cover} width={1080} height={1920} defaultProps={{ ratio: '9x16' as const, guides: false }} />
    <Still id="Cover4x5" component={Cover} width={1080} height={1350} defaultProps={{ ratio: '4x5' as const, guides: false }} />
    <Composition id="Episode16x9Draft" component={Episode} fps={30} width={1920} height={1080} durationInFrames={frames(long.totalSeconds, 30)} defaultProps={{ guides: false }} />
    <Composition id="Reel9x16Draft" component={Reel} fps={30} width={1080} height={1920} durationInFrames={frames(short.totalSeconds, 30)} defaultProps={{ ratio: '9x16' as const, guides: false }} />
  </>
);
