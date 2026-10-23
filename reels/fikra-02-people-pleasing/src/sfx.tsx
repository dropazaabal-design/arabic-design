import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { TL, sceneStart, sec, wordAt } from './time';

// Light sound effects, each on the same spoken word as the picture beat it marks (typing, a send, a
// stamp, a clock, the cover of the planner). Files are original FFmpeg syntheses (public/sfx); no
// music. Volumes stay well under the voice.
type Cue = [file: string, frame: number, volume: number];

const cues = (): Cue[] => [
  // sc01 — the hook
  ['pop', wordAt('s01', 'رسالة'), 0.12],
  ['click', wordAt('s02', 'لا'), 0.08], ['click', wordAt('s02', 'أستطيع'), 0.08], ['click', wordAt('s02', 'اليوم'), 0.08], ['scrape', wordAt('s02', 'تمسحها'), 0.07],
  ['click', wordAt('s03', 'وترسل') + sec(0.35), 0.08], ['whoosh', wordAt('s03', 'حاضر'), 0.12], ['thud', wordAt('s03', 'حاضر') + sec(0.85), 0.12],
  ['scribble', wordAt('s04', 'غاضب'), 0.07], ['pop', wordAt('s04', 'فلماذا'), 0.1],
  // sc02 — what it cost; the pause; again and again
  ['snap', wordAt('s05', 'عاجل'), 0.12], ['thud', wordAt('s06', 'حاضر'), 0.12], ['tick', wordAt('s06', 'ساعة'), 0.12], ['tick', wordAt('s06', 'ساعتين'), 0.12],
  ['whoosh', wordAt('s06', 'وتأجل'), 0.1], ['whoosh', wordAt('s06', 'مرة'), 0.08],
  ['pop', wordAt('s07', 'الثانيتين'), 0.1], ['tick', wordAt('s07', 'وقفة'), 0.12],
  ['pop', wordAt('s08', 'ليست'), 0.1], ['pop', wordAt('s08', 'توافق'), 0.07], ['pop', wordAt('s08', 'مرة'), 0.07], ['pop', wordAt('s08', 'بعد'), 0.07], ['pop', wordAt('s08', 'مرة', 1), 0.07],
  // sc03 — the book; the balance; the receipt
  ['pageflip', sceneStart('sc03'), 0.1], ['scribble', wordAt('s09', 'العادة'), 0.07],
  ['whoosh', wordAt('s10', 'لنحافظ'), 0.06], ['whoosh', wordAt('s10', 'رضا'), 0.06], ['whoosh', wordAt('s10', 'يكلفنا'), 0.06], ['whoosh', wordAt('s10', 'أكثر'), 0.06],
  ['thud', wordAt('s11', 'استياء'), 0.1], ['thud', wordAt('s11', 'وقلق'), 0.1],
  ['tick', wordAt('s12', 'طلب'), 0.1], ['tick', wordAt('s12', 'ورد'), 0.1], ['snap', wordAt('s12', 'وثمن'), 0.12],
  // sc04 — the race
  ['pop', wordAt('s13', 'الرسالة'), 0.1], ['scribble', wordAt('s13', 'يتسابق'), 0.06], ['pop', wordAt('s14', 'هل'), 0.1], ['pop', wordAt('s14', 'هل', 1), 0.1],
  ['whoosh', wordAt('s15', 'سريع'), 0.12], ['snap', wordAt('s15', 'أمله'), 0.08], ['whoosh', wordAt('s15', 'فيصل') - sec(0.4), 0.12], ['click', wordAt('s15', 'فيصل'), 0.12],
  ['scrape', wordAt('s16', 'والجدول'), 0.1], ['pageflip', wordAt('s17', 'تنظر'), 0.12], ['pop', wordAt('s17', 'وعدت'), 0.1],
  ['thud', wordAt('s18', 'تخرج'), 0.1], ['snap', wordAt('s19', 'رسالتنا'), 0.14],
  // sc05 — the correction
  ['pageflip', sceneStart('sc05'), 0.1], ['snap', wordAt('s20', 'تصحيح'), 0.14], ['thud', wordAt('s20', 'لا'), 0.1], ['pop', wordAt('s20', 'لكل'), 0.08],
  ['scribble', wordAt('s20', 'ولا'), 0.08], ['snap', wordAt('s20', 'استغلال'), 0.12], ['scribble', wordAt('s20', 'استغلال') + sec(0.45), 0.07],
  ['scribble', wordAt('s21', 'الحل'), 0.06], ['pop', wordAt('s21', 'واضح'), 0.1], ['pop', wordAt('s21', 'نعم'), 0.08], ['pop', wordAt('s21', 'لا', 1), 0.08],
  ['pop', wordAt('s22', 'وقتك'), 0.08], ['pop', wordAt('s22', 'طلب'), 0.08],
  ['thud', wordAt('s23', 'توافق'), 0.09], ['thud', wordAt('s23', 'توافق') + sec(0.25), 0.09], ['thud', wordAt('s23', 'دائما'), 0.09], ['thud', wordAt('s23', 'دائما') + sec(0.25), 0.09],
  ['pop', wordAt('s24', 'اختيارا'), 0.12], ['scribble', wordAt('s24', 'رد') + sec(0.35), 0.07],
  ['whoosh', wordAt('s25', 'غدا'), 0.1], ['pop', wordAt('s25', 'مرتاح'), 0.08], ['pop', wordAt('s25', 'منزعج'), 0.08],
  // sc06 — the replay
  ['whoosh', wordAt('s26', 'فلنعد'), 0.14], ['scrape', wordAt('s26', 'فلنعد') + sec(0.2), 0.06], ['pop', wordAt('s26', 'ممكن'), 0.1],
  ['tick', wordAt('s27', 'توقف'), 0.14], ['snap', wordAt('s27', 'عاجل'), 0.12], ['tick', wordAt('s27', 'دقيقة'), 0.1],
  ['whoosh', wordAt('s28', 'ثانيا'), 0.08], ['pageflip', wordAt('s28', 'افتح') + sec(0.35), 0.12], ['whoosh', wordAt('s28', 'لوحة'), 0.08], ['pop', wordAt('s28', 'محجوز'), 0.08],
  ['pop', wordAt('s29', 'ومتى'), 0.1],
  ['click', wordAt('s31', 'لا'), 0.08], ['click', wordAt('s31', 'أستطيع'), 0.08], ['click', wordAt('s31', 'اليوم'), 0.08], ['whoosh', wordAt('s31', 'اليوم') + sec(0.45), 0.1],
  ['click', wordAt('s31', 'أقدر'), 0.08], ['click', wordAt('s31', 'غدا'), 0.08], ['click', wordAt('s31', 'نصف'), 0.08], ['click', wordAt('s31', 'ساعة'), 0.08], ['whoosh', wordAt('s31', 'ساعة') + sec(0.4), 0.1],
  ['pop', wordAt('s32', 'واجبا'), 0.08], ['pop', wordAt('s33', 'سأراجع'), 0.1], ['scrape', wordAt('s34', 'قصة'), 0.08], ['pageflip', wordAt('s34', 'جملة'), 0.1],
  // sc07 — after the reply
  ['pageflip', sceneStart('sc07'), 0.1], ['pop', wordAt('s35', 'وقد', 1), 0.08], ['pop', wordAt('s36', 'تمام'), 0.12], ['scribble', wordAt('s37', 'قرارك', 1), 0.08],
  ['pop', wordAt('s38', 'بالطلبات'), 0.07], ['pop', wordAt('s38', 'الصغيرة'), 0.07], ['pop', wordAt('s38', 'حيث'), 0.07], ['pop', wordAt('s38', 'يكلف'), 0.07], ['scribble', wordAt('s38', 'فالمهارة'), 0.06],
  // sc08 — the close
  ['pageflip', sceneStart('sc08'), 0.1], ['pop', wordAt('s39', 'وصلت'), 0.1], ['tick', wordAt('s39', 'وتوقفت'), 0.12], ['whoosh', wordAt('s39', 'ثم'), 0.1],
  ['pop', wordAt('s40', 'لمشروعك'), 0.1], ['scribble', wordAt('s41', 'ثانيتان'), 0.07],
  ['tick', wordAt('s43', 'توقف'), 0.1], ['tick', wordAt('s43', 'راجع'), 0.1], ['tick', wordAt('s43', 'أجب'), 0.1], ['chime', TL.durationInFrames - sec(3), 0.12],
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
