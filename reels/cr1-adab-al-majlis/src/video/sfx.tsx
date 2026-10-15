import React from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import tick from '@mukarram-assets/sfx/tick.wav';
import thud from '@mukarram-assets/sfx/thud.wav';
import pageflip from '@mukarram-assets/sfx/pageflip.wav';
import crinkle from '@mukarram-assets/sfx/crinkle.wav';
import click from '@mukarram-assets/sfx/click.wav';
import whoosh from '@mukarram-assets/sfx/whoosh.wav';
import pop from '@mukarram-assets/sfx/pop.wav';
import slide from '../../../doublethink/assets/sfx/slide.wav';
import { B } from '../scene/shots';
import { MIX_GAIN, TL } from './time';

// Effects on the beats they mark (seconds; the same beats as scene/shots.tsx B). No music (the brief): a quiet room
// tone under everything, soft footsteps on the rug, cloth when someone sits or stands, a muted thud for the red mark,
// a light tick for the green one, a page for each card. Nothing plays over the verse but the room tone.
// Own effects: tools/sfx.py (room, step, rustle); the rest imported from reels/mukarram and reels/doublethink.
const own = (n: string) => staticFile(`sfx/${n}.wav`);
type Cue = [src: string, at: number, volume: number, dur?: number];
const steps = (from: number, to: number, vol = 0.32): Cue[] => {
  const n = Math.max(1, Math.round((to - from) / 0.38));
  return Array.from({ length: n }, (_, i) => [own('step'), from + (i * (to - from)) / n, vol * (i % 2 ? 0.85 : 1)] as Cue);
};
const sit = (at: number): Cue => [own('rustle'), at, 0.28];

const cues = (): Cue[] => [
  [own('room'), 0, 0.3, TL.totalSeconds],
  // 1 · not between two
  ...steps(0.05, 1.4), sit(1.5), [thud, B.between - 0.05, 0.1], sit(B.except), [pageflip, B.hadith1 - 0.45, 0.12],
  [slide, B.hadith1 + 1.9, 0.07], [slide, B.hadith1 + 2.0, 0.07], sit(B.hExcept - 2.4), [tick, B.hExcept, 0.22],
  // 2 · keep the place of who rose for a need
  sit(B.rose), ...steps(B.rose + 0.55, B.rose + 0.95), [click, B.rose + 1.2, 0.18], ...steps(B.rose + 1.45, B.need + 0.8),
  ...steps(B.back + 0.5, B.back + 1.2), ...steps(B.need + 0.9, B.take - 0.15), sit(B.take - 0.1), [thud, B.take + 0.2, 0.1],
  sit(B.take + 0.85), [pageflip, B.hadith2 - 0.45, 0.12], ...steps(B.returned - 1.3, B.returned + 0.2), sit(B.returned + 0.25),
  [crinkle, B.returned + 0.85, 0.08], [tick, B.right, 0.22],
  // 3 · leave room beside you
  ...steps(B.sat2 - 1.4, B.sat2 - 0.4), sit(B.sat2 - 0.3), [slide, B.beside - 0.1, 0.11], [thud, B.crowd + 0.2, 0.1], [slide, B.wide - 0.9, 0.11], [tick, B.wide + 0.25, 0.2], [pop, B.comfort, 0.07],
  // 4 · make room for who comes in; then the verse in silence (room tone only)
  ...steps(B.crowded - 1.35, B.crowded + 0.2), ...[4, 3, 2, 1, 0].map((k): Cue => [slide, B.makeRoom + 0.1 + (4 - k) * 0.2, 0.06]),
  ...steps(B.ability, B.ability + 0.45), sit(B.ability + 0.45), [tick, B.noHarm + 0.1, 0.2], [pageflip, B.verse - 0.85, 0.1],
  // 5 · al-Sa'di
  ...steps(B.adab - 0.3, B.makes + 0.2), [slide, B.makes, 0.08], sit(B.needs + 0.35), [tick, B.harm, 0.2],
  // 6 · the reward; the frame widens; the signature
  ...steps(B.reward + 0.9, B.who - 0.2), [slide, B.who, 0.08], sit(B.who + 0.9), [pageflip, B.q1 - 0.35, 0.1],
  [whoosh, B.widen - 0.1, 0.08], [pop, B.end + 1.0, 0.1], [pop, B.end + 1.25, 0.1],
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
