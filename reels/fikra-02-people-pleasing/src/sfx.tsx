import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { TL, sceneStart, sec, wordAt } from './time';

// Light sound effects, each on the same spoken word as the picture beat it marks.
// Files are original FFmpeg syntheses (public/sfx); no music. Volumes stay well under the voice.
type Cue = [file: string, frame: number, volume: number];

const cues = (): Cue[] => [
  // sc01 — the paradox
  ['scribble', wordAt('s01', 'سماعات'), 0.08], ['pop', wordAt('s01', 'بأربعين') - sec(0.1), 0.16],
  ['whoosh', wordAt('s02', 'تظهر'), 0.12], ['pop', wordAt('s02', 'بمئتي') - sec(0.1), 0.16], ['tick', wordAt('s03', 'سعرها'), 0.16],
  // sc02 — the problem
  ['pageflip', sceneStart('sc02'), 0.1], ['pop', wordAt('s05', 'متجر'), 0.12], ['pop', wordAt('s05', 'اشتراك'), 0.12], ['pop', wordAt('s05', 'نعم'), 0.12],
  // sc03 — the book and the idea
  ['pageflip', wordAt('s07', 'كتاب'), 0.12], ['scribble', wordAt('s07', 'اختصارات'), 0.07], ['snap', wordAt('s09', 'تستغ'), 0.14], ['pop', wordAt('s10', 'التباين'), 0.16],
  // sc04 — the mechanism
  ['scribble', wordAt('s11', 'بمسطرة') - sec(0.2), 0.07], ['scrape', wordAt('s11', 'بل'), 0.1],
  ['pop', wordAt('s12', 'بارد'), 0.1], ['pop', wordAt('s12', 'ساخن'), 0.1], ['pop', wordAt('s12', 'فاتر'), 0.1], ['tick', wordAt('s14', 'واحد'), 0.14],
  ['pop', wordAt('s15', 'أولا'), 0.1], ['pop', wordAt('s15', 'نقطة'), 0.1], ['pop', wordAt('s15', 'بعده'), 0.1], ['click', wordAt('s16', 'مفيد'), 0.14],
  // sc05 — the decision evolving
  ['pageflip', sceneStart('sc05'), 0.1], ['whoosh', wordAt('s19', 'بجانب'), 0.1], ['pop', wordAt('s21', 'بمئتين'), 0.12], ['pop', wordAt('s21', 'بأربعين'), 0.12],
  ['thud', wordAt('s22', 'عشرة'), 0.14], ['tick', wordAt('s24', 'انتبه'), 0.14],
  // sc06 — second case and the correction
  ['pop', wordAt('s25', 'بتسعمئة'), 0.12], ['pop', wordAt('s25', 'بستين'), 0.12], ['whoosh', wordAt('s26', 'صغيرة'), 0.08], ['snap', wordAt('s28', 'تصحيح'), 0.14],
  // sc07 — the three steps
  ['pageflip', sceneStart('sc07'), 0.1], ['pop', wordAt('s31', 'الحاجة'), 0.12], ['scribble', wordAt('s32', 'معيار'), 0.07], ['pageflip', wordAt('s33', 'القرار'), 0.12], ['pop', wordAt('s34', 'تجربة'), 0.12],
  // sc08 — the close
  ['tick', wordAt('s35', 'والسعر'), 0.14], ['chime', TL.durationInFrames - sec(3), 0.12],
];

export const Sfx: React.FC = () => (
  <>
    {cues().map(([file, at, volume], i) => (
      <Sequence key={i} from={Math.max(0, at)} layout="none">
        <Audio src={staticFile(`sfx/${file}.wav`)} volume={volume} />
      </Sequence>
    ))}
  </>
);
