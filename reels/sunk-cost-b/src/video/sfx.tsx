import React from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import pop from '@mukarram-assets/sfx/pop.wav';
import whoosh from '@mukarram-assets/sfx/whoosh.wav';
import chime from '@mukarram-assets/sfx/chime.wav';
import scribble from '@mukarram-assets/sfx/scribble.wav';
import boing from '@mukarram-assets/sfx/boing.wav';
import thud from '@mukarram-assets/sfx/thud.wav';
import pneu from '../../../doublethink/assets/sfx/pneu.wav';
import stamp from '../../../doublethink/assets/sfx/stamp.wav';
import printer from '../../../sunk-cost-a/assets/sfx/printer.wav';
import splash from '../../../sunk-cost-a/assets/sfx/splash.wav';
import bubbles from '../../../sunk-cost-a/assets/sfx/bubbles.wav';
import ticks from '../../../sunk-cost-a/assets/sfx/ticks.wav';
import { B } from '../scene/shots';
import { MIX_GAIN } from './time';

// Effects on the beats they mark (seconds; the same beats as scene/shots.tsx B). This reel's own effects are
// synthesised by tools/sfx.py (engine, bell, wind, waves, sweep); the others come from reels/sunk-cost-a,
// reels/mukarram and reels/doublethink (no copies). The engine bed runs under the whole ride.
const own = (n: string) => staticFile(`sfx/${n}.wav`);
type Cue = [src: string, at: number, volume: number, dur?: number];

const cues = (): Cue[] => [
  [own('engine'), 0, 0.18, B.name - 0.5], [own('engine'), B.but - 0.3, 0.16, B.years + 0.75 - (B.but - 0.3)],
  [whoosh, 0.9, 0.12], [pneu, 1.2, 0.14], [pneu, 1.85, 0.12],
  [boing, B.wrong - 0.05, 0.1], [own('bell'), B.next - 0.2, 0.18], [pneu, B.next + 0.3, 0.12],
  [thud, B.no, 0.12], [pneu, B.gotOff - 0.2, 0.1], [whoosh, B.board + 0.6, 0.08],
  [printer, B.buy, 0.3], [own('wind'), B.desert - 0.4, 0.22],
  [pop, B.paid - 0.2, 0.08], [pop, B.loop - 0.2, 0.08], [stamp, B.wrongStart - 0.35, 0.16], [whoosh, B.wrongStart + 1.0, 0.1],
  [scribble, B.name - 0.5, 0.05], [splash, B.sank - 0.1, 0.35], [bubbles, B.sank + 0.3, 0.25], [bubbles, B.either, 0.2],
  [own('waves'), B.sank + 0.8, 0.14, B.but - 0.3 - (B.sank + 0.8)], [scribble, B.nearest - 0.6, 0.08],
  [thud, B.picture - 0.1, 0.1], [pop, B.plant - 0.1, 0.1], [whoosh, B.home - 0.3, 0.06],
  [ticks, B.snow - 0.3, 0.25], [own('waves'), B.sea - 0.3, 0.22],
  [own('sweep'), B.years + 0.8, 0.3], [chime, B.arrived, 0.12],
  [pneu, B.stop + 0.2, 0.12], [own('engine'), B.stop - 0.5, 0.1, 2.2], [whoosh, B.first - 0.3, 0.06],
  [boing, B.forty, 0.1], [scribble, B.ahead - 0.3, 0.06],
  [pop, B.qa, 0.06], [pop, B.qb, 0.06], [chime, B.cta + 0.2, 0.08],
  [own('wind'), B.stop - 0.5, 0.06, 82.18 - (B.stop - 0.5)],
];

export const Sfx: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      {cues().map(([src, at, volume, dur], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(at * fps))} durationInFrames={dur ? Math.round(dur * fps) : undefined} layout="none">
          <Audio src={src} volume={volume * MIX_GAIN} loop={!!dur} />
        </Sequence>
      ))}
    </>
  );
};
