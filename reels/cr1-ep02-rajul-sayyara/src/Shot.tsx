import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { SHORT, hookBeats } from './programs';
import { Hook } from './scenes/hook';
import { type Ratio } from './stage';
import { Captions, Signature } from './text';
import { C, PROFILES } from './theme';
import { sec } from './time';

// Representative shot at final quality: the hook in each ratio, on the estimated timing, with
// its sound effects. No narration yet — the voice is generated after the budget is approved.
const CAPTION_BOTTOM: Record<Ratio, number> = { '16x9': 0, '9x16': 1522, '4x5': 1208 };

export const shotFrames = (ratio: Ratio) => {
  const b = hookBeats(ratio === '16x9' ? 'long' : 'short');
  return b.end + sec(1.2);
};

export const Shot: React.FC<{ ratio: Ratio }> = ({ ratio }) => {
  const f = useCurrentFrame();
  const b = hookBeats(ratio === '16x9' ? 'long' : 'short');
  const p = PROFILES[ratio];
  const sfx: [number, string, number][] = [
    [b.start - sec(0.25), 'whoosh', 0.3], [b.park + sec(0.25), 'click', 0.45], [b.park + sec(0.5), 'tick', 0.35], [b.park + sec(0.66), 'tick', 0.3],
    [b.think, 'pop', 0.4], [b.think + sec(0.18), 'pop', 0.4], [b.think + sec(0.36), 'pop', 0.4], [b.imagine, 'tick', 0.3],
  ];
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Hook f={f} b={b} ratio={ratio} />
      {ratio !== '16x9' && <Captions f={f} caps={SHORT.captions.filter((c) => c.seg === 'R1')} p={p} bottom={CAPTION_BOTTOM[ratio]} />}
      {ratio === '16x9' && <Signature o={1} size={30} style={{ position: 'absolute', top: p.safe.y0, left: p.safe.x0 }} />}
      {sfx.map(([at, name, v], k) => (
        <Sequence key={k} from={Math.max(0, at)} durationInFrames={sec(1.5)}><Audio src={staticFile(`sfx/${name}.wav`)} volume={v} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};

