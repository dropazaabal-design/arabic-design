import React from 'react';
import storyboard from '../../storyboard.json';
import * as S from '../scenes/shots';
import type { ShotProps } from '../scenes/shots';
import { TL, sec, segStart, wordAt } from './time';

// storyboard.json is the shot list (same contract as reels/boiling-frog/src/video/shots.ts).
const COMPONENTS = S as unknown as Record<string, React.FC<ShotProps>>;
type Anchor = { at?: number; seg?: string; word?: string; n?: number; off?: number };
const resolve = (a: Anchor) => (a.at !== undefined ? sec(a.at) : (a.word ? wordAt(a.seg!, a.word, a.n ?? 0) : segStart(a.seg!)) + sec(a.off ?? 0));

export const SHOTS = storyboard.shots.map((s, i, all) => {
  const component = COMPONENTS[s.component];
  if (typeof component !== 'function') throw new Error(`no component ${s.component}`);
  const t0 = resolve(s.anchor as Anchor);
  const t1 = i + 1 < all.length ? resolve(all[i + 1].anchor as Anchor) : TL.durationInFrames;
  if (t1 <= t0) throw new Error(`${s.id} has no length (${t0}→${t1})`);
  return { id: s.id, component, t0, t1 };
});
