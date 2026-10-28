import React from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import crinkle from '@mukarram-assets/sfx/crinkle.wav';
import pageflip from '@mukarram-assets/sfx/pageflip.wav';
import pop from '@mukarram-assets/sfx/pop.wav';
import scribble from '@mukarram-assets/sfx/scribble.wav';
import whoosh from '@mukarram-assets/sfx/whoosh.wav';
import chime from '@mukarram-assets/sfx/chime.wav';
import boing from '@mukarram-assets/sfx/boing.wav';
import { MIX_GAIN, wordAt } from './time';

// Effects on the scene's beats (seconds, the same beats as scene/Scene.tsx T). Library effects are imported from
// reels/mukarram (no copies); room tone, flight and chirp are this reel's (tools/sfx.py). Placed in frames at the
// composition's fps, so 30 and 60 fps play them at the same instants (±half a frame).
const cues = (): Array<[string, number, number]> => [
  [staticFile('sfx/room.wav'), 0, 0.5],
  [scribble, 0.22, 0.06], [scribble, 0.86, 0.05],
  [staticFile('sfx/chirp.wav'), 3.15, 0.12],
  [crinkle, 3.86, 0.14],
  [whoosh, 4.74, 0.16],
  [staticFile('sfx/flight.wav'), 4.86, 0.16],
  [staticFile('sfx/chirp.wav'), 5.15, 0.12],
  [pop, 7.88, 0.16], [boing, 8.36, 0.06],
  [pageflip, 8.55, 0.14],
  [scribble, 8.98, 0.07],
  [chime, wordAt('s02', 'تجي', 1) - 0.02, 0.12], [staticFile('sfx/chirp.wav'), wordAt('s02', 'تجي', 1) + 0.15, 0.1],
  [scribble, wordAt('s02', 'تتحرك'), 0.05],
];

export const Sfx: React.FC = () => {
  const { fps } = useVideoConfig();
  return <>{cues().map(([src, s, volume], i) => <Sequence key={i} from={Math.round(s * fps)} layout="none"><Audio src={src} volume={volume * MIX_GAIN} /></Sequence>)}</>;
};
