import React from 'react';
import { Pill } from '../art/world';
import { Check } from '../art/world';
import { Eye, Mask, Note, Sight } from '../art/taghafol';
import { T } from '../copy';
import { Stage } from '../Stage';
import { C } from '../theme';
import { at, ease, mix, prog, sec, useEpisodeFrame } from '../time';
import { Title } from './shared';

// sc02 — the definition. An eye that sees what is around it (notes, each on its line of sight); a card with a
// sleepy eye is held up in front of it («تكلّف الغفلة»); behind the card the notes are still seen, one tick
// per word; then the card comes down («تظهر كذلك») and the open eye is there («ولست كذلك»).
const EYE: [number, number] = [540, 880];
const NOTES: Array<[number, number]> = [[870, 690], [700, 560], [380, 560], [210, 690]];   // right to left
const COLORS = [C.blue, C.green, C.red, C.cardboard];
const K = 1;                                                                                 // EDL piece

export const SC02: React.FC = () => {
  const f = useEpisodeFrame();
  const eyeP = prog(f, at(0.76, K), sec(0.7), ease.inOut);
  const appear = NOTES.map((_, i) => prog(f, at(2.62 + 0.35 * i, K), sec(0.35)));
  const sight = NOTES.map((_, i) => prog(f, at(2.72 + 0.35 * i, K), sec(0.4), ease.inOut));
  const ticks = [8.0, 9.04, 10.66, 11.74].map((t) => prog(f, at(t, K), sec(0.3)));
  const rise = prog(f, at(5.24, K), sec(0.6), ease.out);
  const sleepy = mix(0.25, 0.6, prog(f, at(6.0, K), sec(0.6), ease.inOut));
  const shown = prog(f, at(13.78, K), sec(0.3));
  const reveal = prog(f, at(14.68, K), sec(0.7), ease.inOut);
  const real = prog(f, at(15.32, K), sec(0.35));
  return (
    <Stage f={f} svg={
      <>
        {NOTES.map((n, i) => <Sight key={i} from={EYE} to={[n[0], n[1] + 40]} o={sight[i]} />)}
        <Eye id="sc02" x={EYE[0]} y={EYE[1]} p={eyeP} s={mix(0.9, 1, eyeP)} ring={real} />
        {NOTES.map((n, i) => appear[i] > 0 && (
          <Note key={i} x={n[0]} y={n[1]} s={mix(0.5, 1, appear[i])} o={Math.min(1, appear[i] * 2)} color={COLORS[i]} lit={Math.max(sight[i] * 0.6, ticks[i])} tick={ticks[i]} rot={[4, -3, 3, -4][i]} />
        ))}
        {rise > 0 && (
          <Mask x={EYE[0]} y={mix(mix(1560, EYE[1] + 40, rise), 1170, reveal)} s={mix(1, 0.62, reveal)} rot={mix(-3, -6, reveal)} lid={sleepy} label={T.sc02.shown} labelO={shown} />
        )}
        {real > 0 && <Check x={790} y={790} s={mix(0.5, 1.1, real)} o={real} />}
        {real > 0 && <Pill text={T.sc02.real} x={540} y={672} size={46} fill={C.green} s={mix(0.8, 1, real)} o={real} />}
      </>
    }>
      <Title text={T.sc02.title} f={f} at={at(0.98, K)} until={at(5.24, K) - sec(0.3)} />
      <Title text={T.sc02.title2} f={f} at={at(5.24, K)} />
    </Stage>
  );
};
