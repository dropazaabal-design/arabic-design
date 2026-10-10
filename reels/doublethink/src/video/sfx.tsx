import React from 'react';
import { Audio, Sequence } from 'remotion';
import crinkle from '@mukarram-assets/sfx/crinkle.wav';
import pageflip from '@mukarram-assets/sfx/pageflip.wav';
import pop from '@mukarram-assets/sfx/pop.wav';
import scribble from '@mukarram-assets/sfx/scribble.wav';
import thud from '@mukarram-assets/sfx/thud.wav';
import tick from '@mukarram-assets/sfx/tick.wav';
import whoosh from '@mukarram-assets/sfx/whoosh.wav';
import boing from '@mukarram-assets/sfx/boing.wav';
import breeze from '@mukarram-assets/sfx/breeze.wav';
import casters from '../../assets/sfx/casters.wav';
import clack from '../../assets/sfx/clack.wav';
import flap from '../../assets/sfx/flap.wav';
import marker from '../../assets/sfx/marker.wav';
import pneu from '../../assets/sfx/pneu.wav';
import rattle from '../../assets/sfx/rattle.wav';
import rip from '../../assets/sfx/rip.wav';
import rub from '../../assets/sfx/rub.wav';
import slide from '../../assets/sfx/slide.wav';
import stamp from '../../assets/sfx/stamp.wav';
import { B } from '../scenes/world';

// Short effects on the beats they mark, keyed to the same words as the motion (scenes/world.tsx beats()).
// Library effects come from reels/mukarram/assets/sfx (no copies); clack/stamp/rattle/pneu/rip/rub/casters/
// marker/slide/flap are this reel's (tools/sfx.py). All sit well under the narration; the lock's «طق» is the
// loudest effect because it is the joke.
type Cue = [src: string, frame: number, volume: number];

const cues = (): Cue[] => {
  const b = B();
  return [
    // 01–02 the pull and the lock
    [rattle, b.pull1 + 2, 0.08], [rattle, b.pull2 + 2, 0.09], [rattle, b.pull3, 0.1], [thud, b.pull3 + 2, 0.05],
    [clack, b.slip, 0.2], [whoosh, b.slip + 1, 0.06], [thud, b.slip + 9, 0.08], [clack, b.notOpen + 14, 0.09],
    // 03 «مفتوح»
    [flap, b.flap1, 0.08], [stamp, b.stamp1, 0.16], [flap, b.stamp1 + 20, 0.06],
    // 04 the bump
    [tick, b.go + 4, 0.04], [tick, b.go + 14, 0.04], [tick, b.go + 24, 0.04], [boing, b.bump - 3, 0.06], [thud, b.bump - 3, 0.12],
    // 05 «مغلق», again and again
    [flap, b.flap2, 0.08], [rip, b.tear1, 0.13], [crinkle, b.tear1 + 10, 0.1], [tick, b.ball1 + 12, 0.05],
    [stamp, b.stamp2, 0.16], [stamp, b.tap2a, 0.12], [stamp, b.tap2b, 0.12], [flap, b.tap2b + 10, 0.06],
    // 06 «طبعًا!» and the eraser
    [pop, b.sure - 4, 0.07], [rub, b.erase0, 0.09], [breeze, b.blow, 0.05],
    // 07 tubes
    [rattle, b.rattle, 0.06], [pneu, b.cap1 - 8, 0.12], [pneu, b.cap2 - 8, 0.12], [thud, b.cap1 + 9, 0.05], [thud, b.cap2 + 10, 0.05],
    [pop, b.open, 0.08], [pop, b.open + 2, 0.08], [pageflip, b.open + 3, 0.07],
    // 08–09 pins and «صحيح»
    [tick, b.pinOn, 0.08], [tick, b.pinOff, 0.08], [stamp, b.ok1, 0.13], [whoosh, b.ok1 + 6, 0.04], [stamp, b.ok2, 0.13], [breeze, b.proud + 2, 0.04],
    // 10–11 the chair and the hook
    [casters, b.drag0 + 2, 0.08], [pageflip, b.hang, 0.07], [tick, b.hang + 2, 0.06], [pop, b.freeze, 0.08], [casters, b.sit - 10, 0.06], [thud, b.sit + 2, 0.05],
    // 12 the name on the board
    [marker, b.write, 0.06], [marker, b.sub, 0.05],
    // 14 evidence
    [clack, b.test, 0.15], [scribble, b.note2 + 4, 0.06],
    // 15 the crumpled sheet
    [crinkle, b.pick + 12, 0.08],
    // 16 the question
    [flap, b.flap3, 0.07], [rip, b.tear3, 0.1], [stamp, b.stamp3, 0.15], [clack, b.test3, 0.18], [rip, b.tear4, 0.1], [slide, b.slide + 2, 0.08],
  ];
};

export const Sfx: React.FC = () => (
  <>{cues().map(([src, at, volume], i) => <Sequence key={i} from={Math.max(0, at)} layout="none"><Audio src={src} volume={volume} /></Sequence>)}</>
);
