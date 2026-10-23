import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';

export type EffectCraftOverlayProps = {
  /** Matches the safe --id passed to effectcraft-bridge.mjs. */
  id: string;
  /** frameCount from the exported manifest.json. */
  frameCount: number;
  /** Hide when the pre-rendered animation ends, or hold its last frame. */
  endBehavior?: 'hide' | 'hold';
  style?: React.CSSProperties;
};

/**
 * Transparent EffectCraft PNGs composited over the Remotion video.
 *
 * Place in a <Sequence from={...} durationInFrames={...}>; useCurrentFrame()
 * is local to that Sequence. Do not alter timing with JS timers.
 */
export const EffectCraftOverlay: React.FC<EffectCraftOverlayProps> = ({
  id, frameCount, endBehavior = 'hide', style
}) => {
  const frame = useCurrentFrame();
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) {
    throw new Error('EffectCraftOverlay: invalid id');
  }
  if (!Number.isSafeInteger(frameCount) || frameCount < 1) {
    throw new Error('EffectCraftOverlay: invalid frameCount');
  }
  if (frame >= frameCount && endBehavior === 'hide') return null;
  const index = Math.max(0, Math.min(frame, frameCount - 1));
  const number = String(index).padStart(6, '0');
  return <Img
    src={staticFile('effectcraft/' + id + '/frames/' + number + '.png')}
    style={{position:'absolute', inset:0, width:'100%', height:'100%',
      objectFit:'contain', pointerEvents:'none', ...style}}
  />;
};
