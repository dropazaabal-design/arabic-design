import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { TL, sec, wordAt } from './time';

// Light effects on the spoken word whose picture beat they mark. Original FFmpeg syntheses
// (public/sfx, from reels/crab-mentality). Volumes stay well under the voice.
type Cue = [file: string, frame: number, volume: number];

const cues = (): Cue[] => [
  ['tick', sec(0.3), 0.12], ['pop', wordAt('s01', 'هاتف'), 0.1],
  ['whoosh', wordAt('s02', 'جرب'), 0.07], ['pop', wordAt('s02', 'حتى'), 0.09],
  ['snap', wordAt('s03', 'ليست'), 0.08], ['scribble', wordAt('s03', 'بل'), 0.08], ['whoosh', wordAt('s03', 'ملاحظة'), 0.08],
  ['pageflip', wordAt('s04', 'تجربة'), 0.08], ['snap', wordAt('s04', 'حجب'), 0.12], ['tick', wordAt('s04', 'أسبوعين'), 0.1],
  ['pop', wordAt('s04', 'المكالمات'), 0.09], ['pop', wordAt('s04', 'والرسائل'), 0.09],
  ['scribble', wordAt('s05', 'تحسن'), 0.06], ['thud', wordAt('s05', 'الالتزام'), 0.08],
  ['pop', wordAt('s06', 'دقيقتين'), 0.09], ['scribble', wordAt('s06', 'دماغك'), 0.08],
  ['whoosh', wordAt('s07', 'ضع'), 0.1], ['pageflip', wordAt('s07', 'اختر'), 0.1],
  ['pop', wordAt('s08', 'لسبب'), 0.1], ['scribble', wordAt('s08', 'لمجرد'), 0.07], ['tick', wordAt('s08', 'العادة') + sec(0.5), 0.1],
  ['chime', TL.durationInFrames - sec(1.6), 0.1],
];

export const Sfx: React.FC = () => (
  <>
    {cues().map(([file, at, volume], i) => (
      <Sequence key={i} from={Math.max(0, at)} layout="none"><Audio src={staticFile(`sfx/${file}.wav`)} volume={volume} /></Sequence>
    ))}
  </>
);
