import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import captions from './captions.json';
import { loadFonts, TITLE_FONT } from './fonts';
import { SCENES } from './scenes';
import { Sfx } from './sfx';
import { C, CAPS } from './theme';
import { TL, prog, sec } from './time';

loadFonts();

/** The reel: one scene at a time, hard cuts. The speaker's own voice runs under every scene (one edited
 *  track, public/audio/voice.wav); his picture returns in the speaker scenes. Light effects, no music,
 *  burned-in Arabic captions (the verse lines are the scene's title instead). */
export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  const cur = TL.scenes.find((s) => f >= sec(s.start) && f < sec(s.end)) ?? TL.scenes[TL.scenes.length - 1];
  const Scene = SCENES[cur.sceneId as keyof typeof SCENES];
  return (
    <AbsoluteFill style={{ background: C.light }}>
      <Scene />
      <Captions f={f} />
      <Audio src={staticFile('audio/voice.wav')} />
      <Sfx />
    </AbsoluteFill>
  );
};

/** One short cue at a time, in the band below the stage and above the platform's own UI zone. */
const Captions: React.FC<{ f: number }> = ({ f }) => {
  const c = (captions as Array<{ start: number; end: number; text: string; title: boolean }>).find((x) => !x.title && f >= sec(x.start) && f < sec(x.end));
  if (!c) return null;
  const p = prog(f, sec(c.start), sec(0.12));
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: CAPS.y, display: 'flex', justifyContent: 'center', opacity: p }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 52, lineHeight: 1.35, color: C.ink, background: 'rgba(255,255,255,0.95)', padding: '0.12em 0.6em 0.22em', borderRadius: 22, boxShadow: '0 6px 0 rgba(16,24,39,0.22)', textAlign: 'center', maxWidth: 900 }}>{c.text}</div>
    </div>
  );
};
