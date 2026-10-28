import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { TL } from '../video/time';
import { C } from './kit';
import { B, Sh1Split, Sh2Seat, Sh3Space, Sh4Room, Sh5Saadi, Sh6Reward, ShotProps } from './shots';

/** The shot list: start (reel seconds) and component, one shot per rule in the brief's order. */
export const SHOTS: Array<[number, React.FC<ShotProps>, string]> = [
  [0, Sh1Split, 'split'],
  [B.rose - 1.65, Sh2Seat, 'seat'],
  [B.sat2 - 1.5, Sh3Space, 'space'],
  [B.crowded - 1.4, Sh4Room, 'room'],
  [B.saadi - 1.4, Sh5Saadi, 'saadi'],
  [B.reward - 0.8, Sh6Reward, 'reward'],
];

const Shot: React.FC<{ t0: number; C: React.FC<ShotProps> }> = ({ t0, C: Comp }) => {
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  return <Comp t={t} T={t0 + t} t0={t0} />;
};

export const Scene: React.FC = () => {
  const { fps } = useVideoConfig();
  const end = Math.round(TL.totalSeconds * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {SHOTS.map(([t0, Comp, id], i) => {
        // cuts on the 60-fps grid at any fps (a half frame at 30 fps), so every clock inside a shot (t, the GSAP camera)
        // reads the same seconds at 30 and 60 fps and Reel30 is exactly every other frame of Reel
        const at = (s: number) => Math.round(s * 60) * fps / 60;
        const f0 = at(t0), f1 = i + 1 < SHOTS.length ? at(SHOTS[i + 1][0]) : end;
        return <Sequence key={id} from={f0} durationInFrames={f1 - f0} name={id}><Shot t0={f0 / fps} C={Comp} /></Sequence>;
      })}
    </AbsoluteFill>
  );
};
