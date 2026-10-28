import React from 'react';
import { Audio, Sequence } from 'remotion';
import boing from '@mukarram-assets/sfx/boing.wav';
import crinkle from '@mukarram-assets/sfx/crinkle.wav';
import pageflip from '@mukarram-assets/sfx/pageflip.wav';
import pop from '@mukarram-assets/sfx/pop.wav';
import scrape from '@mukarram-assets/sfx/scrape.wav';
import scribble from '@mukarram-assets/sfx/scribble.wav';
import click from '@mukarram-assets/sfx/click.wav';
import thud from '@mukarram-assets/sfx/thud.wav';
import tick from '@mukarram-assets/sfx/tick.wav';
import whoosh from '@mukarram-assets/sfx/whoosh.wav';
import gulp from '../../assets/sfx/gulp.wav';
import ribbit from '../../assets/sfx/ribbit.wav';
import tap from '../../assets/sfx/tap.wav';
import thwip from '../../assets/sfx/thwip.wav';
import { sec, wordAt } from './time';

// Short effects on the beats they mark, keyed to the same words as the motion. The library effects are
// imported from reels/mukarram/assets/sfx (no copies); ribbit/thwip/gulp/tap are this reel's (tools/sfx.py).
type Cue = [src: string, frame: number, volume: number];

const cues = (): Cue[] => {
  const w = wordAt;
  const go = w('s02', 'يهرب') - 2;
  const before = w('s08', 'قبل');
  const drops = [w('s06', 'وبكرة'), w('s06', 'يجيب'), w('s06', 'معه'), w('s06', 'كومة') - 3];
  return [
    [thwip, 2, 0.12], [gulp, 9, 0.12], [tick, w('s01', 'بالتدريج'), 0.08],
    [pop, w('s02', 'تدري') - 3, 0.09], [tick, w('s02', 'تدري') + 1, 0.1],
    [boing, go, 0.08], [whoosh, go + 2, 0.09], [thud, go + 13, 0.1], [ribbit, go + 22, 0.1],
    [boing, w('s03', 'مو') - 8, 0.07], [pop, w('s03', 'تشبيه') - 2, 0.1],
    [whoosh, w('s04', 'علينا'), 0.07],
    [whoosh, w('s05', 'خمس') - sec(0.3), 0.08], [pop, w('s05', 'خمس'), 0.09], [pop, w('s05', 'عشر'), 0.09], [scrape, w('s05', 'عشر'), 0.05],
    [whoosh, w('s05', 'وفجأة'), 0.08], [tick, w('s05', 'وفجأة') + 6, 0.07], [tick, w('s05', 'وفجأة') + 12, 0.07], [tick, w('s05', 'راحت'), 0.07], [pop, w('s05', 'ساعة'), 0.1], [thud, w('s05', 'ساعة') + 3, 0.07],
    [whoosh, w('s06', 'بأجّلها') + 2, 0.08], [pageflip, w('s06', 'بأجّلها') + 12, 0.08], [thud, w('s06', 'لبكرة') + 4, 0.08],
    ...drops.map((d): Cue => [pageflip, d + 2, 0.07]), [scrape, w('s06', 'كومة') + 4, 0.08], [thud, w('s06', 'كومة') + 10, 0.1],
    [tick, w('s07', 'شوي'), 0.1], [tick, w('s07', 'شوي', 1), 0.1],
    [pop, w('s08', 'عادي'), 0.09], [tap, before, 0.12], [tap, before + 8, 0.12], [tap, before + 16, 0.12],
    [click, w('s09', 'اليوم') - 2, 0.11],
    [crinkle, w('s09', 'وغيّر') - 2, 0.08], [scribble, w('s09', 'خطوة'), 0.06], [pop, w('s09', 'صغيرة'), 0.1],
    [boing, w('s10', 'هرب'), 0.07], [pop, w('s10', 'وأنت') - 2, 0.1],
    [pop, w('s11', 'تكبر') - 2, 0.09], [ribbit, w('s11', 'تنتبه') + 30, 0.09],
  ];
};

export const Sfx: React.FC = () => (
  <>{cues().map(([src, at, volume], i) => <Sequence key={i} from={Math.max(0, at)} layout="none"><Audio src={src} volume={volume} /></Sequence>)}</>
);
