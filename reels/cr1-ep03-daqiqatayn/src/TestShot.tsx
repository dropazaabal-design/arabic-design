import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { OpenBox } from './scenes/open';
import { sec, setFps } from './time';

// Internal test (≈11 s): one real moment of the story — a look, a reaction, an object handled — in the
// light room and in a dark one, to compare before building the rest.
export const TestShot: React.FC<{ dark?: boolean }> = ({ dark = false }) => {
  const f = useCurrentFrame();
  setFps(useVideoConfig().fps);
  const k = { start: 0, look: sec(1.3), doubt: sec(2.6), decide: sec(4.0), lid: sec(5.2), inside: sec(5.9), take: sec(7.3), up: sec(8.0), end: sec(11) };
  return <AbsoluteFill><OpenBox f={f} k={k} dim={dark ? 1 : 0} /></AbsoluteFill>;
};
