import React from 'react';
import { Audio, Sequence, interpolate, staticFile, useVideoConfig } from 'remotion';
import click from '@mukarram-assets/sfx/click.wav';
import tick from '@mukarram-assets/sfx/tick.wav';
import creak from '@mukarram-assets/sfx/creak.wav';
import snap from '@mukarram-assets/sfx/snap.wav';
import scrape from '@mukarram-assets/sfx/scrape.wav';
import pageflip from '@mukarram-assets/sfx/pageflip.wav';
import pop from '@mukarram-assets/sfx/pop.wav';
import slide from '../../../doublethink/assets/sfx/slide.wav';
import clack from '../../../doublethink/assets/sfx/clack.wav';
import casters from '../../../doublethink/assets/sfx/casters.wav';
import rub from '../../../doublethink/assets/sfx/rub.wav';
import marker from '../../../doublethink/assets/sfx/marker.wav';
import pneu from '../../../doublethink/assets/sfx/pneu.wav';
import rattle from '../../../doublethink/assets/sfx/rattle.wav';
import hall from '../../../sunk-cost-a/assets/sfx/hall.wav';
import ticks from '../../../sunk-cost-a/assets/sfx/ticks.wav';
import hum from '../../../blind-obedience/assets/sfx/hum.wav';
import { B } from '../scene/shots';
import { MIX_GAIN, TL } from './time';

// Sound carries the story under the voice, never over it (the brief): no music. The workshop's room tone under
// everything, the hall's tone in the reverse shots, a mains hum while the podium is live, and one effect per action,
// on the beat that shows it. Own effects: tools/sfx.py (room, step, servo, crackle, murmur, tink); the rest imported.
const own = (n: string) => staticFile(`sfx/${n}.wav`);
/** [source, at (s), volume, duration (loops; s), fade in / out (s)] */
type Cue = [src: string, at: number, volume: number, dur?: number, fade?: [number, number]];
const steps = (from: number, to: number, every = 0.28, vol = 0.22): Cue[] => {
  const n = Math.max(1, Math.round((to - from) / every));
  return Array.from({ length: n }, (_, i) => [own('step'), from + (i * (to - from)) / n, vol * (i % 2 ? 0.8 : 1)] as Cue);
};
const servo = (at: number, vol = 0.12): Cue => [own('servo'), at, vol];

const cues = (): Cue[] => [
  [own('room'), 0, 0.32, TL.totalSeconds, [0.4, 1.5]],
  // the slip, the boom, the walk to the podium
  servo(0.2), [creak, B.stumble + 0.05, 0.22], [rattle, B.stumble + 0.42, 0.2], [slide, B.conf - 0.12, 0.3], [clack, B.conf + 0.42, 0.12],
  [own('tink'), B.falls + 0.05, 0.25], [clack, B.leaves + 0.42, 0.26], servo(B.goes - 0.7, 0.15), [slide, B.goes - 0.4, 0.14],
  ...steps(B.goes - 0.2, B.explains + 0.5), [own('step'), B.explains + 0.55, 0.26], [own('step'), B.explains + 0.72, 0.2],
  [hum, B.explains + 0.8, 0.07, B.broke - (B.explains + 0.8), [0.6, 0.05]],
  // the explanations
  [marker, B.late - 0.15, 0.22], servo(B.why1, 0.1), [slide, B.wrong - 0.05, 0.16], [click, B.wrong + 0.3, 0.16], [rub, B.why3 + 0.05, 0.22], [rub, B.why3 + 0.75, 0.2],
  // back to the bench; time has gone
  [ticks, B.after - 0.35, 0.2, 1.2, [0.05, 0.3]], ...steps(B.back - 0.3, B.finds + 0.15), [own('tink'), B.left + 0.1, 0.2],
  // the reply before the fix
  [pageflip, B.readies - 0.1, 0.2], [pageflip, B.readies + 0.35, 0.16], servo(B.before + 0.05, 0.1),
  // waiting for approval
  servo(B.start, 0.12), [tick, B.approval + 0.25, 0.1],
  // the mirror
  [rub, B.was - 0.1, 0.22], [rub, B.was + 0.6, 0.2], [rub, B.was + 1.3, 0.18], [rub, B.image + 0.4, 0.16],
  // the microphone dies; the plug pops out; dead taps
  [own('crackle'), B.broke - 0.05, 0.22], [pop, B.broke + 0.12, 0.2], [tick, B.broke + 0.7, 0.12], [tick, B.broke + 0.95, 0.1], [tick, B.broke + 1.2, 0.08],
  // the reverse: a large, quiet hall; the loudspeakers' noise, loud in his head, then small
  [hall, B.then - 0.5, 0.22, B.problem - 0.6 - (B.then - 0.5), [0.5, 0.4]],
  [own('murmur'), B.then - 0.2, 0.08, 3.2, [0.6, 0.4]], [own('murmur'), B.some - 0.2, 0.3, B.head + 0.7 - (B.some - 0.2), [0.2, 1.2]], [own('murmur'), B.head + 0.6, 0.06, 3.5, [0.3, 0.8]],
  // the problem is still there; lost time
  [ticks, B.lost - 0.1, 0.2, 1.1, [0.05, 0.3]],
  // the hand on the tool
  servo(B.first, 0.12), [clack, B.puts + 0.22, 0.24],
  // try, err, adjust
  [creak, B.returned + 0.1, 0.22], servo(B.returned + 0.15, 0.12), [click, B.tried + 0.2, 0.24], [snap, B.erred - 0.02, 0.18], [creak, B.erred + 0.05, 0.2],
  [scrape, B.fixed + 0.15, 0.22], [clack, B.fixed + 0.85, 0.16],
  // asking for a hand
  servo(B.hand2, 0.14), [pneu, B.asked + 0.12, 0.24], [click, B.asked + 0.85, 0.2],
  // it locks
  [click, B.bridge + 0.6, 0.26], [snap, B.bridge + 0.64, 0.18],
  // the trolley test
  [casters, B.worked - 0.1, 0.28, 2.2, [0.05, 0.4]],
  // returning the borrowed driver; two hands on one bolt
  [click, B.sorry - 0.2, 0.18], servo(B.sorry, 0.1), ...[0, 0.3, 0.6, 0.9, 1.2].map((d): Cue => [tick, B.need + 0.2 + d, 0.14]),
  // the boom offers itself; he turns back to the bench
  [slide, B.but2 - 0.05, 0.22], servo(B.explain, 0.1), servo(B.every, 0.1), [slide, B.passer + 0.1, 0.14],
  // the trolley crosses
  [casters, B.step - 0.1, 0.3, 2.4, [0.05, 0.5]],
  // the end: the work goes on, no applause
  [tick, B.life + 0.4, 0.08], [tick, B.notconf + 0.9, 0.07],
];

export const Sfx: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      {cues().map(([src, at, volume, dur, fade], i) => {
        const len = dur ? Math.round(dur * fps) : undefined;
        const vol = fade && len
          ? (f: number) => volume * MIX_GAIN * interpolate(f, [0, fade[0] * fps, len - fade[1] * fps, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          : volume * MIX_GAIN;
        return (
          <Sequence key={i} from={Math.max(0, Math.round(at * fps))} durationInFrames={len} layout="none">
            <Audio src={src} volume={vol} loop={!!dur} />
          </Sequence>
        );
      })}
    </>
  );
};
