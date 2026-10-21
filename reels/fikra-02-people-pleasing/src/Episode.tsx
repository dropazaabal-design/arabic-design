import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { loadFonts } from './fonts';
import { SCENES } from './scenes';
import { Sfx } from './sfx';
import { C } from './theme';
import { Offset, TL, ease, prog, sec } from './time';

loadFonts();

const FADE = sec(0.4);

/** The whole episode: each scene is its own component, faded in and out at its timeline window. */
export const Episode: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      {TL.scenes.map((s) => {
        const from = sec(s.start), to = sec(s.end);
        if (f < from - 1 || f > to + FADE) return null;
        const Scene = SCENES[s.sceneId as keyof typeof SCENES];
        const o = Math.min(prog(f, from, FADE, ease.inOut), 1 - prog(f, to, FADE, ease.inOut));
        return <AbsoluteFill key={s.sceneId} style={{ opacity: s.sceneId === 'sc01' && f < FADE ? 1 : o }}><Offset.Provider value={0}><Scene /></Offset.Provider></AbsoluteFill>;
      })}
      <Narration />
      <Sfx />
    </AbsoluteFill>
  );
};

/** One scene alone (for partial re-render), in episode frames. */
export const SceneOnly: React.FC<{ sceneId: string }> = ({ sceneId }) => {
  const s = TL.scenes.find((x) => x.sceneId === sceneId)!;
  const Scene = SCENES[sceneId as keyof typeof SCENES];
  return <AbsoluteFill><Offset.Provider value={sec(s.start)}><Scene /></Offset.Provider></AbsoluteFill>;
};

/** Narration: measured line files when the full take exists; until then the opening sample at its place. */
const Narration: React.FC = () => {
  const segs = TL.segments as Array<{ id: string; file?: string; fileStart?: number }>;
  const lines = segs.filter((s) => s.file);
  if (lines.length) return <>{lines.map((s) => <Sequence key={s.id} from={sec(s.fileStart!)} layout="none"><Audio src={staticFile(s.file!)} /></Sequence>)}</>;
  const sample = (TL as { sampleAudio?: { file: string; at: number } }).sampleAudio;
  return sample ? <Sequence from={sec(sample.at)} layout="none"><Audio src={staticFile(sample.file)} /></Sequence> : null;
};
