import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { Grain } from './art/doodles';
import { C } from './theme';
import { FPS, TL, ease, mix, prog, sec, srcAt, useEpisodeFrame } from './time';

// The speaker, as recorded: the source is 718×1280 at 30 fps. The frame shows source x 0–718, y 20–900
// (his head and hands; the clip's own burned-in subtitles sit lower, at y ≈ 925–1035, and stay out).
// The composition runs at 60 fps and OffthreadVideo shows the source frame at each time, so every
// recorded frame appears twice: no interpolation, no new frames. Muted: the voice is one edited track.
export const FRAME = { x: 185, y: 440, w: 710, h: 870 };
const SRC = { w: 718, h: 1280, top: 20 };
const K = FRAME.w / SRC.w;

export const SpeakerScene: React.FC<{ id: string; children?: React.ReactNode }> = ({ id, children }) => {
  const f = useEpisodeFrame();
  const s = TL.scenes.find((x) => x.sceneId === id)!;
  const from = sec(s.start), to = sec(s.end);
  const trimBefore = Math.round(srcAt(from, s.seg) * FPS);
  const push = mix(1, 1.025, prog(f, from, to - from, ease.linear));      // a slow push-in, about the face
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Grain dark />
      <div style={{ position: 'absolute', left: FRAME.x - 10, top: FRAME.y - 10, width: FRAME.w + 20, height: FRAME.h + 20, borderRadius: 34, background: C.paper, boxShadow: '0 18px 40px rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'absolute', left: FRAME.x, top: FRAME.y, width: FRAME.w, height: FRAME.h, borderRadius: 26, overflow: 'hidden', background: C.navy2 }}>
        <div style={{ position: 'absolute', left: 0, top: -SRC.top * K, width: SRC.w * K, height: SRC.h * K, transform: `scale(${push})`, transformOrigin: `50% ${(SRC.top + 300) / SRC.h * 100}%` }}>
          <Sequence from={from} layout="none">
            <OffthreadVideo src={staticFile('source.mp4')} trimBefore={trimBefore} muted style={{ width: '100%', height: '100%' }} />
          </Sequence>
        </div>
      </div>
      {children}
    </AbsoluteFill>
  );
};
