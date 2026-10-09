import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { at, sceneStart } from './time';

// A few light effects on the picture beats they mark, well under the voice (no music). Original FFmpeg
// syntheses (public/sfx, from reels/crab-mentality). Beats are source seconds mapped onto the edit.
type Cue = [file: string, frame: number, volume: number];

const cues = (): Cue[] => [
  ['pop', at(26.02, 0), 0.05],                                             // the answer
  ['scribble', at(0.76, 1), 0.04], ['pop', at(2.62, 1), 0.05], ['whoosh', at(5.24, 1), 0.05],
  ['tick', at(8.0, 1), 0.04], ['tick', at(10.66, 1), 0.04], ['whoosh', at(14.68, 1), 0.05],
  ['tick', at(28.84), 0.04], ['snap', at(35.12), 0.05],
  ['whoosh', at(44.9), 0.04], ['whoosh', at(47.6), 0.04], ['thud', at(50.5), 0.06],
  ['scribble', at(53.34), 0.04], ['pop', at(55.22), 0.05], ['whoosh', at(55.66), 0.04],
  ['scribble', at(71.3), 0.04], ['pop', at(73.46), 0.04], ['pop', at(74.2), 0.04], ['pop', at(75.22), 0.04],
  ['chime', sceneStart('sc11'), 0.06],
];

export const Sfx: React.FC = () => (
  <>
    {cues().map(([file, frame, volume], i) => (
      <Sequence key={i} from={Math.max(0, frame)} layout="none"><Audio src={staticFile(`sfx/${file}.wav`)} volume={volume} /></Sequence>
    ))}
  </>
);
