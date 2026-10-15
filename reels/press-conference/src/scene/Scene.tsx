import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { TL } from '../video/time';
import { C } from './kit';
import { ShotProps, SHOTS } from './shots';

const Shot: React.FC<{ t0: number; C: React.FC<ShotProps> }> = ({ t0, C: Comp }) => {
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  return <Comp t={t} T={t0 + t} t0={t0} />;
};

/** The shot list in reel seconds; cuts land on the 60-fps grid at any fps (so Reel30 is every other frame of Reel). */
export const Scene: React.FC = () => {
  const { fps } = useVideoConfig();
  const end = Math.round(TL.totalSeconds * fps);
  return (
    <AbsoluteFill style={{ background: C.pine }}>
      {SHOTS.map(([t0, Comp, id], i) => {
        const at = (s: number) => Math.round(s * 60) * fps / 60;
        const f0 = at(t0), f1 = i + 1 < SHOTS.length ? at(SHOTS[i + 1][0]) : end;
        return <Sequence key={id} from={f0} durationInFrames={f1 - f0} name={id}><Shot t0={f0 / fps} C={Comp} /></Sequence>;
      })}
    </AbsoluteFill>
  );
};
