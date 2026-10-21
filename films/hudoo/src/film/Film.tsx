import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { TITLE } from '../fonts';
import { PAL } from '../kit/style';
import { makeCtx, TIMELINE, type Ctx } from './engine';
import { SHOTS as B1 } from '../scenes/b1';
import { SHOTS as B2 } from '../scenes/b2';
import { SHOTS as B3 } from '../scenes/b3';
import { SHOTS as B4 } from '../scenes/b4';
import { SHOTS as B5 } from '../scenes/b5';
import { SHOTS as B6 } from '../scenes/b6';
import { SHOTS as B7 } from '../scenes/b7';
import { SHOTS as B8 } from '../scenes/b8';

export type ShotRender = (c: Ctx) => React.ReactNode;
const ALL: Record<number, ShotRender> = { ...B1, ...B2, ...B3, ...B4, ...B5, ...B6, ...B7, ...B8 };
const XFADE = 14, DIP = 10;

/** A shot that has not been built yet shows its number and line, so gaps are obvious in any preview. */
const Missing: React.FC<{ id: number; text: string }> = ({ id, text }) => (
  <AbsoluteFill style={{ background: '#E9C6C9', alignItems: 'center', justifyContent: 'center' }}>
    <div dir="rtl" lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 48, color: '#2A2F3A', textAlign: 'center', padding: 80 }}>لقطة {id} غير منفذة<br />{text}</div>
  </AbsoluteFill>
);

/** The whole film: each shot is a pure function of its local frame; dissolves overlap two shots, fades dip through paper. */
export const Film: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const f = useCurrentFrame();
  const layers: React.ReactNode[] = [];
  let dip = 0;
  TIMELINE.forEach((s, k) => {
    const prev = TIMELINE[k - 1];
    const xin = prev && prev.meta.cut.startsWith('مزج') ? XFADE : 0;
    if (f < s.from - xin || f >= s.to) return;
    const ctx = makeCtx(s, f - s.from);
    const o = xin ? Math.min(1, (f - (s.from - xin)) / xin) : 1;
    const R = ALL[s.id];
    layers.push(<AbsoluteFill key={s.id} style={{ opacity: o }}>{R ? R(ctx) : <Missing id={s.id} text={ctx.text} />}</AbsoluteFill>);
    if (s.meta.cut.startsWith('تلاش')) dip = Math.max(dip, Math.max(0, 1 - (s.to - f) / DIP));
    if (prev && prev.meta.cut.startsWith('تلاش')) dip = Math.max(dip, Math.max(0, 1 - (f - s.from) / DIP));
  });
  return (
    <AbsoluteFill style={{ background: PAL.paper }}>
      {layers}
      {dip > 0 && <AbsoluteFill style={{ background: PAL.paper, opacity: dip }} />}
      {audio && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
};
