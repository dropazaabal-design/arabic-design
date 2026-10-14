import React from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import crinkle from '@mukarram-assets/sfx/crinkle.wav';
import pop from '@mukarram-assets/sfx/pop.wav';
import whoosh from '@mukarram-assets/sfx/whoosh.wav';
import thud from '@mukarram-assets/sfx/thud.wav';
import creak from '@mukarram-assets/sfx/creak.wav';
import chime from '@mukarram-assets/sfx/chime.wav';
import scribble from '@mukarram-assets/sfx/scribble.wav';
import boing from '@mukarram-assets/sfx/boing.wav';
import stamp from '../../../doublethink/assets/sfx/stamp.wav';
import slide from '../../../doublethink/assets/sfx/slide.wav';
import { B } from '../scene/shots';
import { MIX_GAIN } from './time';

// Effects on the beats they mark (seconds; the same beats as scene/shots.tsx B). This reel's own effects are
// synthesised by tools/sfx.py (hall, printer, splash, bubbles, ticks, song, night); the rest are imported from
// reels/mukarram and reels/doublethink (no copies). Quiet beds under the voice, short accents on the actions.
const own = (n: string) => staticFile(`sfx/${n}.wav`);
type Cue = [src: string, at: number, volume: number, dur?: number];

const cues = (): Cue[] => [
  [own('hall'), 0, 0.09, 4.3], [own('bubbles'), B.gone + 1.0, 0.12, B.study - 0.55 - (B.gone + 1.0)],
  [own('printer'), 0.0, 0.35], [stamp, 0.32, 0.22], [crinkle, 2.1, 0.12], [crinkle, 2.95, 0.14],
  [own('hall'), 4.2, 0.22, 25.2], [own('hall'), B.notAll - 0.3, 0.2, B.back - 0.45 - (B.notAll - 0.3)],
  [boing, 4.9, 0.08], [thud, B.vbad - 0.05, 0.18], [boing, B.vbad + 0.15, 0.1],
  [creak, B.exit, 0.1], [chime, B.ticket - 0.1, 0.06], [thud, B.sit + 0.1, 0.12],
  [own('ticks'), B.hour1 - 0.3, 0.3], [crinkle, B.popcorn, 0.08],
  [slide, B.people, 0.07], [slide, B.people + 0.55, 0.07], [slide, B.people + 1.05, 0.07], [slide, B.people + 1.5, 0.07],
  [own('song'), B.sing - 0.2, 0.3],
  [crinkle, B.paid - 0.1, 0.12],
  [whoosh, B.gone - 0.4, 0.1], [own('splash'), B.gone + 0.1, 0.4], [own('bubbles'), B.gone + 0.4, 0.25],
  [pop, B.ifSit, 0.08], [pop, B.ifLeave, 0.08], [stamp, B.name - 0.05, 0.14],
  [own('splash'), B.money + 0.4, 0.22], [own('splash'), B.time + 0.4, 0.22], [own('splash'), B.effort + 0.4, 0.22],
  [scribble, B.full, 0.06], [pop, B.more, 0.06],
  [pop, B.films - 0.3, 0.06], [pop, B.films + 0.1, 0.06], [pop, B.films + 0.5, 0.06],
  [chime, B.better - 0.3, 0.08], [crinkle, B.notTicket, 0.1], [creak, B.notTicket + 0.6, 0.1],
  [whoosh, B.back - 0.5, 0.08], [own('night'), B.back - 0.45, 0.3],
  [pop, B.q, 0.06], [pop, B.q2, 0.06], [chime, B.cta + 0.2, 0.08],
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
