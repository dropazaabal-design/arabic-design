import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { sec, wordAt, wordEnd } from './time';

// Short effects on the picture beats they mark (each keyed to the same word as the motion it belongs to).
// Original syntheses (assets/sfx; tools/sfx.py and reels/crab-mentality). Volumes stay well under the voice.
type Cue = [file: string, frame: number, volume: number];

const cues = (): Cue[] => {
  const w = wordAt;
  const release = w('s01', 'يرمي') + 5;
  const walkOff = w('s06', 'وتمشي') - sec(0.12);
  const lonely = w('s06', 'تلتفت') + sec(0.55);
  const bends = [w('s07', 'ينحني'), w('s07', 'قبلك') - 2, w('s07', 'بعدك', 1) - 3];
  const picks = [w('s07', 'على') + 2, w('s07', 'قبلك') + 9, w('s07', 'بعدك', 1) + 7];
  return [
    ['whoosh', 0, 0.1], ['splat', 12, 0.16],
    ['chomp', w('s01', 'موزته'), 0.13],
    ['whoosh', release, 0.09], ['thud', release + 16, 0.08],
    ['thud', w('s02', 'ونضحك'), 0.07],
    ['pop', w('s02', 'السلة') + 6, 0.09], ['pageflip', w('s02', 'يقرأ'), 0.07],
    ['pop', w('s03', 'وأنت'), 0.1],
    ['crinkle', w('s04', 'عندك'), 0.07], ['pop', w('s04', 'عقل'), 0.1],
    ['scribble', w('s04', 'حافظ'), 0.05], ['scribble', w('s04', 'نظافة'), 0.05],
    ['flutter', w('s05', 'فيطير'), 0.09], ['chime', w('s05', 'سلام'), 0.07],
    ['pop', wordEnd('s05', 'سلام') + 2, 0.09], ['whistle', wordEnd('s05', 'سلام') + 3, 0.07],
    ['thud', walkOff + 5, 0.1], ['click', w('s06', 'وتمشي') + 3, 0.1],
    ['breeze', lonely + 4, 0.1],
    ...bends.map((b): Cue => ['creak', b + 8, 0.09]),
    ...picks.map((p): Cue => ['tick', p, 0.11]),
    ['thud', w('s07', 'وكيس') + 10, 0.08], ['thud', w('s07', 'ومن') + 8, 0.08],
    ['spit', w('s08', 'يبصق') + 2, 0.07], ['boing', w('s08', 'الرصيف') - 3, 0.07],
    ['thud', w('s08', 'كأنه') + 8, 0.1],
    ['click', w('s09', 'القرد') + 1, 0.1], ['snap', w('s09', 'له'), 0.07],
    ['chime', w('s09', 'كرّمك'), 0.06],
    ['crinkle', w('s10', 'احتفظ'), 0.08], ['thud', w('s10', 'جيبك'), 0.05],
    ['click', w('s10', 'سلة'), 0.1], ['chime', w('s10', 'سلة') + 12, 0.06],
    ['click', w('s11', 'الطريق') + 4, 0.08], ['chime', w('s11', 'صدقة'), 0.07],
    ['pop', w('s11', 'لا') - 2, 0.1], ['chime', w('s11', 'الأذى', 1) + sec(0.45), 0.07],
  ];
};

export const Sfx: React.FC = () => (
  <>
    {cues().map(([file, at, volume], i) => (
      <Sequence key={i} from={Math.max(0, at)} layout="none"><Audio src={staticFile(`sfx/${file}.wav`)} volume={volume} /></Sequence>
    ))}
  </>
);
