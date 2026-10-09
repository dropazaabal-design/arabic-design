import React from 'react';
import { Composition } from 'remotion';
import { Reel } from './Reel';
import { FPS, FRAMES, H, W } from './theme';

// 1080×1920, 30 fps, 394 frames (13.13 s), silent.
export const Root: React.FC = () => <Composition id="Reel" component={Reel} durationInFrames={FRAMES} fps={FPS} width={W} height={H} />;
