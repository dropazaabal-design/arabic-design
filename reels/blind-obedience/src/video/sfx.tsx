import React from 'react';
import { Audio, Sequence } from 'remotion';
import chime from '@mukarram-assets/sfx/chime.wav';
import click from '@mukarram-assets/sfx/click.wav';
import pop from '@mukarram-assets/sfx/pop.wav';
import scribble from '@mukarram-assets/sfx/scribble.wav';
import snap from '@mukarram-assets/sfx/snap.wav';
import thud from '@mukarram-assets/sfx/thud.wav';
import tick from '@mukarram-assets/sfx/tick.wav';
import whoosh from '@mukarram-assets/sfx/whoosh.wav';
import clack from '../../../doublethink/assets/sfx/clack.wav';
import flap from '../../../doublethink/assets/sfx/flap.wav';
import rattle from '../../../doublethink/assets/sfx/rattle.wav';
import stamp from '../../../doublethink/assets/sfx/stamp.wav';
import tap from '../../../boiling-frog/assets/sfx/tap.wav';
import hum from '../../assets/sfx/hum.wav';
import { B } from '../scenes/shots';
import { SHOTS } from './shots';

// Short effects on the beats they mark, keyed to the same words as the motion (scenes/shots.tsx B()). Library
// effects are imported from reels/mukarram, reels/doublethink and reels/boiling-frog (no copies); the panel's
// hum is this reel's (tools/sfx.py). The knocks on the wall and the last switch are the loudest effects.
type Cue = [src: string, frame: number, volume: number];
const at = (id: string) => SHOTS.find((s) => s.id === id)!.t0;

const cues = (): Cue[] => {
  const b = B();
  const ticks: Cue[] = Array.from({ length: 14 }, (_, i) => [tick, b.r26 + i * 4, 0.04]);
  const bubbles: Cue[] = Array.from({ length: 7 }, (_, i) => [pop, b.all - 4 + Math.round((i * 54) / 6), 0.05]);
  return [
    [hum, 0, 0.1], [hum, at('sh05'), 0.08], [hum, at('sh20'), 0.1], [hum, at('sh20') + 80, 0.08],
    [scribble, at('sh03') + 2, 0.06], [scribble, b.yale - 8, 0.05], [scribble, b.one - 2, 0.07], [scribble, b.result - 2, 0.05], ...ticks,
    [clack, b.v450 + 2, 0.22], [thud, b.v450 + 3, 0.12], [stamp, b.volt - 2, 0.16],
    [tap, b.prod2 + 12, 0.08], [tap, b.prod2 + 24, 0.08], [tap, b.prod2 + 36, 0.08],
    [thud, b.knock - 2, 0.22], [rattle, b.knock - 2, 0.14], [thud, b.knock + 12, 0.22], [rattle, b.knock + 12, 0.14],
    [click, b.go + 10, 0.14], [click, b.go + 28, 0.14], [click, b.go + 42, 0.14],
    [whoosh, at('sh10'), 0.06], [pop, b.actor - 2, 0.07], [snap, b.fake + 2, 0.08],
    [whoosh, at('sh12'), 0.06], [whoosh, b.group - 4, 0.04], ...bubbles, [pop, b.right1 - 4, 0.07], [pop, b.walk - 4, 0.07], [stamp, b.p37 - 2, 0.14],
    [flap, b.y2006 - 4, 0.1], [scribble, b.close + 6, 0.05],
    [pop, b.oneP + 2, 0.08], [chime, b.right2, 0.06],
    [scribble, at('sh18') + 2, 0.05], [whoosh, b.quarter - 10, 0.05], [chime, b.quarter, 0.06], [pop, b.you - 4, 0.06],
    [chime, b.icons, 0.07],
  ];
};

export const Sfx: React.FC = () => (
  <>{cues().map(([src, f, volume], i) => <Sequence key={i} from={Math.max(0, f)} layout="none"><Audio src={src} volume={volume} /></Sequence>)}</>
);
