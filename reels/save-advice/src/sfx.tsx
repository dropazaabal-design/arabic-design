import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { TL, sec, wordAt } from './time';

// Light effects on the spoken word whose picture beat they mark. Original FFmpeg syntheses
// (public/sfx, from reels/crab-mentality). Volumes stay well under the voice.
type Cue = [file: string, frame: number, volume: number];

const cues = (): Cue[] => [
  ['click', wordAt('s01', 'كم'), 0.12], ['thud', wordAt('s01', 'حفظت') - sec(0.1), 0.09],
  ['pop', wordAt('s02', 'القراءة'), 0.09], ['whoosh', wordAt('s02', 'التركيز') - sec(0.75), 0.07],
  ['pop', wordAt('s02', 'التركيز'), 0.09], ['whoosh', wordAt('s02', 'ترتيب') - sec(0.75), 0.07],
  ['pop', wordAt('s02', 'ترتيب'), 0.09], ['whoosh', wordAt('s02', 'يومك') + sec(0.35), 0.07],
  ['thud', wordAt('s03', 'لكن'), 0.09], ['pageflip', wordAt('s03', 'بعد'), 0.08], ['pageflip', wordAt('s03', 'ماذا') - sec(0.25), 0.08], ['pageflip', wordAt('s03', 'تغير'), 0.08],
  ['snap', wordAt('s04', 'قائمة', 1), 0.1], ['snap', wordAt('s04', 'أشياء'), 0.1], ['snap', wordAt('s04', 'تؤجلها'), 0.1],
  ['pop', wordAt('s05', 'اختر'), 0.1], ['scrape', wordAt('s05', 'واحدة'), 0.06], ['whoosh', wordAt('s05', 'وحولها'), 0.08],
  ['pageflip', wordAt('s06', 'افتح'), 0.1], ['scribble', wordAt('s06', 'واقرأ'), 0.06],
  ['pop', wordAt('s07', 'عن'), 0.08], ['whoosh', wordAt('s07', 'أبعد'), 0.1], ['tick', wordAt('s07', 'وابدأ'), 0.1],
  ['whoosh', wordAt('s08', 'ليس') + sec(0.25), 0.08], ['pop', wordAt('s09', 'تختار'), 0.1], ['pop', wordAt('s09', 'يناسبك'), 0.09], ['chime', wordAt('s09', 'وتبدأ'), 0.08],
  ['click', wordAt('s10', 'تحفظ'), 0.08], ['whoosh', wordAt('s10', 'الخطوة'), 0.08], ['chime', TL.durationInFrames - sec(1.6), 0.1],
];

export const Sfx: React.FC = () => (
  <>
    {cues().map(([file, at, volume], i) => (
      <Sequence key={i} from={Math.max(0, at)} layout="none"><Audio src={staticFile(`sfx/${file}.wav`)} volume={volume} /></Sequence>
    ))}
  </>
);
