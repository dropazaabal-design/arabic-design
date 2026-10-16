import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Work } from './scenes/work';
import { sec, setFps } from './time';

// The hardest shot (≈10 s), before the voice timing exists: EP03's hands (`legacy`) against the new ones.
export const TestShot: React.FC<{ legacy?: boolean }> = ({ legacy = false }) => {
  const f = useCurrentFrame();
  setFps(useVideoConfig().fps);
  const k = { start: 0, screw: sec(0.6), crooked: sec(2.4), sheet: sec(3.2), turn: sec(4.1), panel: sec(6.0), flip: sec(7.9), end: sec(10) };
  return <AbsoluteFill><Work f={f} k={k} legacy={legacy} /></AbsoluteFill>;
};
