import React from 'react';
import storyboard from '../../storyboard.json';
import { MicClose, MicEyeRoll, MicLaugh, MicSincere, MicTurn } from '../scenes/mic';
import { CleanerArrive, CleanerBend1, CleanerBend2, CleanerBend3, ParkBin, ParkClear, ParkDove, ParkLonely, ParkPocket, ParkRead, ParkRelease, ParkWalkIn, ParkWalkOff } from '../scenes/park';
import { SpitAct, SpitFlag, SpitInnocent } from '../scenes/street';
import { ZooBinHat, ZooEat, ZooHook, ZooReverse, ZooSign, ZooToss } from '../scenes/zoo';
import type { ShotProps } from '../scenes/common';
import { TL, sec, segStart, wordAt } from './time';

// storyboard.json is the shot list; each shot starts on its anchor word and ends where the next starts.
const COMPONENTS: Record<string, React.FC<ShotProps>> = {
  ZooHook, ZooEat, ZooToss, MicLaugh, ZooBinHat, ZooSign, MicTurn, ParkWalkIn, ParkRead, ParkRelease, ParkDove, ParkWalkOff, MicEyeRoll, ParkLonely,
  CleanerArrive, CleanerBend1, CleanerBend2, CleanerBend3, SpitInnocent, SpitAct, SpitFlag, ZooReverse, MicSincere, ParkPocket, ParkBin, ParkClear, MicClose,
};

type Anchor = { at?: number; seg?: string; word?: string; n?: number; off?: number };
const resolve = (a: Anchor) => {
  if (a.at !== undefined) return sec(a.at);
  const base = a.word ? wordAt(a.seg!, a.word, a.n ?? 0) : segStart(a.seg!);
  return base + sec(a.off ?? 0);
};

export type ResolvedShot = { id: string; component: React.FC<ShotProps>; t0: number; t1: number };
export const SHOTS: ResolvedShot[] = storyboard.shots.map((s, i, all) => {
  const component = COMPONENTS[s.component];
  if (!component) throw new Error(`no component ${s.component}`);
  const t0 = resolve(s.anchor as Anchor);
  const t1 = i + 1 < all.length ? resolve(all[i + 1].anchor as Anchor) : TL.durationInFrames;
  if (t1 <= t0) throw new Error(`${s.id} has no length (${t0}→${t1})`);
  return { id: s.id, component, t0, t1 };
});
