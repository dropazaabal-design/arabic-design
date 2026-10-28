import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { TL } from '../video/time';
import { C } from './kit';
import { B, S01Board, S02Inside, S03Aunt, S04Ride, S05Excuses, S06Map, S07Home, S08Years, S09Globe, S10Arrive, S11AuntWaits, S12Ahead, S13Close, ShotProps } from './shots';

/** The shot list: start (reel seconds) and component. Cuts sit just before the word that motivates them. */
export const SHOTS: Array<[number, React.FC<ShotProps>, string]> = [
  [0, S01Board, 'board'],
  [B.after + 0.55, S02Inside, 'inside'],
  [B.aunt - 0.45, S03Aunt, 'aunt'],
  [B.him - 0.35, S04Ride, 'ride'],
  [B.reason - 0.9, S05Excuses, 'excuses'],
  [B.name - 0.5, S06Map, 'map'],
  [B.but - 0.3, S07Home, 'home'],
  [B.snow - 0.45, S08Years, 'years'],
  [B.years + 0.75, S09Globe, 'globe'],
  [B.stop - 0.5, S10Arrive, 'arrive'],
  [B.auntEnd - 0.35, S11AuntWaits, 'auntWaits'],
  [B.ok - 0.4, S12Ahead, 'ahead'],
  [B.qa - 0.6, S13Close, 'close'],
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
    <AbsoluteFill style={{ background: C.sky }}>
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
