import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { Backdrop, ease, mix, p } from './parts';
import { CUTS, DARK, SCENES } from './scenes';

// One design, two frames. The scenes are laid out on a 1080×1350 stage (4:5): the feed version is that stage; the reel
// (9:16) puts it in the middle (y 285–1635, the area platform buttons leave free) and extends the background around it.
const PUSH = 12; // frames of the push between scenes (the new scene enters from the left, as the eye reads right to left)

export const Ad: React.FC<{ format: 'reel' | 'feed'; audio?: boolean }> = ({ format, audio = true }) => {
  const f = useCurrentFrame();
  const H = format === 'reel' ? 1920 : 1350, top = format === 'reel' ? 285 : 0;
  const i = Math.max(0, CUTS.findIndex((c, k) => f >= c && f < CUTS[k + 1]));
  const t = p(f, CUTS[i], PUSH, ease.inOut);
  const dark = i > 0 ? mix(DARK[i - 1], DARK[i], t) : DARK[0];
  const layer = (k: number, x: number, o: number) => {
    const S = SCENES[k];
    return <div key={k} style={{ position: 'absolute', left: 0, top, width: 1080, height: 1350, transform: `translateX(${x}px)`, opacity: o }}><S f={f} /></div>;
  };
  return (
    <AbsoluteFill style={{ background: '#F1F5FC', overflow: 'hidden' }}>
      <Backdrop h={H} dark={dark} />
      {i > 0 && t < 1 && layer(i - 1, mix(0, 1080 * 0.35, t), 1 - t)}
      {layer(i, i > 0 ? mix(-1080 * 0.35, 0, t) : 0, i > 0 ? t : 1)}
      {audio && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
};
