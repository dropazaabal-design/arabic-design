import React from 'react';
import { Audio, Sequence } from 'remotion';
import chime from '@mukarram-assets/sfx/chime.wav';
import click from '@mukarram-assets/sfx/click.wav';
import creak from '@mukarram-assets/sfx/creak.wav';
import crinkle from '@mukarram-assets/sfx/crinkle.wav';
import breeze from '@mukarram-assets/sfx/breeze.wav';
import boing from '@mukarram-assets/sfx/boing.wav';
import pop from '@mukarram-assets/sfx/pop.wav';
import snap from '@mukarram-assets/sfx/snap.wav';
import thud from '@mukarram-assets/sfx/thud.wav';
import tick from '@mukarram-assets/sfx/tick.wav';
import whoosh from '@mukarram-assets/sfx/whoosh.wav';
import casters from '../../../doublethink/assets/sfx/casters.wav';
import clack from '../../../doublethink/assets/sfx/clack.wav';
import rattle from '../../../doublethink/assets/sfx/rattle.wav';
import gulp from '../../../boiling-frog/assets/sfx/gulp.wav';
import tap from '../../../boiling-frog/assets/sfx/tap.wav';
import buzz from '../../assets/sfx/buzz.wav';
import whomp from '../../assets/sfx/whomp.wav';
import { B } from '../scenes/world';

// Short effects on the beats they mark, keyed to the same words as the motion (scenes/world.tsx B()).
// Library effects are imported from reels/mukarram, reels/doublethink and reels/boiling-frog (no copies);
// buzz and whomp are this reel's (tools/sfx.py). All sit well under the voices; the door slam and the
// imagined frown's thud are the loudest, because they are the jokes.
type Cue = [src: string, frame: number, volume: number];

const steps = (from: number, to: number, every: number, vol: number): Cue[] =>
  Array.from({ length: Math.max(0, Math.floor((to - from) / every)) }, (_, i) => [tap, from + i * every, vol] as Cue);

const cues = (): Cue[] => {
  const b = B();
  return [
    // the hook: his steps, the door, the cup
    ...steps(2, b.doorOpen - 4, 13, 0.07), [creak, b.doorOpen, 0.1], [pop, b.cupLand, 0.13], [snap, b.cupLand + 2, 0.06],
    // the pile: the bag's weight, the plant's leaves, the sway
    ...steps(b.c2In, b.c2In + 34, 12, 0.05), [thud, b.bagLand + 2, 0.13], [whoosh, b.bagLand - 6, 0.04],
    ...steps(b.c3In, b.c3In + 36, 12, 0.05), [crinkle, b.plantGive + 4, 0.07], [crinkle, b.plantLand, 0.08], [boing, b.sure3 + 8, 0.05],
    ...steps(b.leave, b.leave + 70, 12, 0.04), [creak, b.tryStep + 8, 0.06], [boing, b.stepBack + 4, 0.05],
    // the chain
    [buzz, b.buzz, 0.22], [pop, b.msg - 2, 0.07], [whoosh, b.slide + 2, 0.06], [thud, b.chin + 4, 0.08], [pop, b.lidPop, 0.12], [tap, b.lidPop + 20, 0.09],
    [crinkle, b.tilt + 2, 0.1], [whoosh, b.tilt + 4, 0.06], ...steps(b.stagger, b.stagger + 26, 9, 0.08), [clack, b.shut, 0.22], [thud, b.shut + 1, 0.14],
    [tick, b.flip4, 0.12], [pop, b.think - 2, 0.06], [gulp, b.gulp, 0.22],
    // the desk, the imagination, reality
    ...steps(b.c1Back, b.c1Back + 32, 11, 0.05), [whomp, b.imag0, 0.2], [whomp, b.masks - 4, 0.12], [clack, b.lightsOff + 4, 0.1], [clack, b.lightsOff + 10, 0.1], [clack, b.lightsOff + 16, 0.12],
    [breeze, b.imag1 + 2, 0.06], [rattle, b.noEnd + 8, 0.035], [rattle, b.noEnd + 24, 0.03], [rattle, b.noEnd + 40, 0.03],
    // everyone takes their own
    [tap, b.cupBack, 0.07], [casters, b.deskPush, 0.13], [whoosh, b.bagBack + 2, 0.05], [crinkle, b.plantBack + 2, 0.07],
    [creak, b.tailFree, 0.08], [snap, b.shake + 4, 0.04], [chime, b.one, 0.06],
    // the meaning: the imagined frown weighs more than the bag
    [pop, b.maskOn, 0.06], [thud, b.heavy + 2, 0.2], [pop, b.pop, 0.13], [chime, b.pop + 4, 0.05],
    ...steps(b.walk0, b.atDoor, 10, 0.05),
    // the lid and the call to action
    [boing, b.pointLid, 0.06], [click, b.lidGive + 6, 0.08], [pop, b.like, 0.07], [click, b.follow, 0.06], [pop, b.thumb + 2, 0.07], [chime, b.icons, 0.07],
  ];
};

export const Sfx: React.FC = () => (
  <>{cues().map(([src, at, volume], i) => <Sequence key={i} from={Math.max(0, at)} layout="none"><Audio src={src} volume={volume} /></Sequence>)}</>
);
