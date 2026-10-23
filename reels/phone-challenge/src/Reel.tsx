import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import captions from './captions.json';
import { loadFonts, TITLE_FONT } from './fonts';
import { StageA, StageB, StageC } from './scenes';
import { Sfx } from './sfx';
import { C, CAPS } from './theme';
import { TL, ease, prog, sceneStart, sec } from './time';

loadFonts();

const FADE = sec(0.4);
const GROUPS = [
  { C: StageA, from: 0, to: sceneStart('sc04') },
  { C: StageB, from: sceneStart('sc04'), to: sceneStart('sc05') },
  { C: StageC, from: sceneStart('sc05'), to: TL.durationInFrames },
];

/** The reel: three continuous stages (crossfaded only where the stage changes), narration,
 *  an original music bed from the first frame, light effects, and burned-in Arabic captions. */
export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.light }}>
      {GROUPS.map(({ C: Stage, from, to }, i) => {
        if (f < from - 1 || f > to + FADE) return null;
        const o = i === 0 ? 1 - prog(f, to, FADE, ease.inOut) : Math.min(prog(f, from, FADE, ease.inOut), 1 - prog(f, to, FADE, ease.inOut));
        return <AbsoluteFill key={i} style={{ opacity: o }}><Stage /></AbsoluteFill>;
      })}
      <Captions f={f} />
      {(TL.segments as Array<{ id: string; file: string; fileStart: number }>).map((s) => (
        <Sequence key={s.id} from={sec(s.fileStart)} layout="none"><Audio src={staticFile(s.file)} /></Sequence>
      ))}
      <Audio src={staticFile('music/bed.wav')} volume={0.26} />
      <Sfx />
    </AbsoluteFill>
  );
};

/** One short cue at a time, in the band above the platform's own caption and buttons zone. */
const Captions: React.FC<{ f: number }> = ({ f }) => {
  const c = (captions as Array<{ start: number; end: number; text: string }>).find((x) => f >= sec(x.start) && f < sec(x.end));
  if (!c) return null;
  const p = prog(f, sec(c.start), sec(0.12));
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: CAPS.y, display: 'flex', justifyContent: 'center', opacity: p }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 50, lineHeight: 1.35, color: C.ink, background: 'rgba(255,255,255,0.94)', padding: '0.12em 0.6em 0.22em', borderRadius: 22, boxShadow: '0 6px 0 rgba(16,24,39,0.18)', textAlign: 'center', maxWidth: 900 }}>{c.text}</div>
    </div>
  );
};
