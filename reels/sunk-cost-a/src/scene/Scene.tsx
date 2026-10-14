import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { TL } from '../video/time';
import { C } from './kit';
import { B, S01Booth, S02Film, S03Face, S04Head, S05Dilemma, S06Time, S07Sing, S08Alone, S09Sunk, S10Three, S11Study, S12Grid, S13Choice, S14Out, S15Close, ShotProps } from './shots';

/** The shot list: start (reel seconds) and component. Cuts sit just before the word that motivates them. */
export const SHOTS: Array<[number, React.FC<ShotProps & { t0: number }>, string]> = [
  [0, S01Booth, 'booth'],
  [4.2, S02Film, 'film'],
  [B.bad - 0.95, S03Face, 'face'],
  [B.vbad - 0.15, S04Head, 'head'],
  [B.exit - 0.75, S05Dilemma, 'dilemma'],
  [B.hour1 - 0.35, S06Time, 'time'],
  [B.dino - 0.25, S07Sing, 'sing'],
  [B.still - 0.3, S08Alone, 'alone'],
  [B.gone - 0.45, S09Sunk, 'sunk'],
  [37.0, S10Three, 'three'],
  [B.study - 0.55, S11Study, 'study'],
  [B.researchers - 0.3, S12Grid, 'grid'],
  [B.notAll - 0.3, S13Choice, 'choice'],
  [B.back - 0.45, S14Out, 'out'],
  [B.q - 0.6, S15Close, 'close'],
];

const Shot: React.FC<{ t0: number; C: React.FC<ShotProps & { t0: number }> }> = ({ t0, C: Comp }) => {
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  return <Comp t={t} T={t0 + t} t0={t0} />;
};

export const Scene: React.FC = () => {
  const { fps } = useVideoConfig();
  const end = Math.round(TL.totalSeconds * fps);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      {SHOTS.map(([t0, Comp, id], i) => {
        const f0 = Math.round(t0 * fps), f1 = i + 1 < SHOTS.length ? Math.round(SHOTS[i + 1][0] * fps) : end;
        return <Sequence key={id} from={f0} durationInFrames={f1 - f0} name={id}><Shot t0={f0 / fps} C={Comp} /></Sequence>;
      })}
    </AbsoluteFill>
  );
};
