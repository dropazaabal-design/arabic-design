import React from 'react';
import { Scale } from '../art/world';
import { Cross, Crown, Eye } from '../art/taghafol';
import { T } from '../copy';
import { Stage } from '../Stage';
import { C } from '../theme';
import { at, ease, mix, prog, sceneStart, sec, useEpisodeFrame } from '../time';
import { Verse } from './shared';

// sc06 — «ليس الغبيُّ بسيدٍ في قومه / لكنّ سيدَ قومِه المتغابي». A balance: on the right «الغبي» (an eye that is
// shut: he does not see), on the left «المتغابي» (the same eye half-lidded: he sees and lets it pass).
// The crown goes to the first and is refused, then lands on the second, and its side of the balance goes down.
const O: [number, number] = [540, 930];
const L = 300;
const panAt = (tilt: number, side: -1 | 1): [number, number] => {
  const a = (tilt * Math.PI) / 180;
  return [O[0] + side * L * Math.cos(a), O[1] + side * L * Math.sin(a) - 40];
};
const W1 = [44.14, 44.78, 45.8, 46.44, 46.7], W2 = [47.52, 48.4, 49.12, 50.5];

export const SC06: React.FC = () => {
  const f = useEpisodeFrame();
  const s0 = sceneStart('sc06');
  const enter = prog(f, s0, sec(0.5));
  const toRight = prog(f, at(44.9), sec(0.8), ease.inOut);
  const refuse = prog(f, at(45.8), sec(0.4), ease.inOut);
  const back = prog(f, at(46.3), sec(0.7), ease.inOut);
  const toLeft = prog(f, at(47.6), sec(0.8), ease.inOut);
  const land = prog(f, at(50.5), sec(0.35), ease.in);
  const tilt = mix(0, -9, prog(f, at(50.5) + sec(0.2), sec(0.6), ease.out));
  const right = panAt(tilt, 1), left = panAt(tilt, -1);
  // the crown: centre → above the right pan → back → above the left pan → on it
  const home: [number, number] = [540, 660];
  const aboveR: [number, number] = [right[0], right[1] - 40];
  const aboveL: [number, number] = [left[0], left[1] - 40];
  const onL: [number, number] = [left[0], left[1] + 30];
  let cx = mix(home[0], aboveR[0], toRight), cy = mix(home[1], aboveR[1], toRight);
  cx = mix(cx, home[0], back); cy = mix(cy, home[1], back);
  cx = mix(cx, aboveL[0], toLeft); cy = mix(cy, aboveL[1], toLeft);
  cx = mix(cx, onL[0], land); cy = mix(cy, onL[1], land);
  const crowned = prog(f, at(50.5) + sec(0.3), sec(0.4));
  return (
    <Stage f={f} svg={
      <>
        <Scale x={O[0]} y={O[1]} tilt={tilt} o={enter} s={mix(0.94, 1, enter)}
          right={T.sc06.dull} left={T.sc06.wise} rightColor={refuse > 0.5 ? C.redSoft : C.line} leftColor={crowned > 0.5 ? C.green : C.aqua}
          rightLoad={<Eye id="dull" x={0} y={-48} s={0.3} lid={1} iris={C.muted} />}
          leftLoad={<Eye id="wise" x={0} y={-48} s={0.3} lid={0.45} ring={crowned} />} />
        <Cross x={right[0]} y={right[1] + 90} size={70} p={refuse * (1 - back)} />
        <Crown x={cx} y={cy} s={mix(0.8, 0.62, land)} o={enter} rot={mix(0, -6, toRight * (1 - back))} color={crowned > 0.5 ? C.green : C.cardboard} />
      </>
    }>
      <Verse text={T.sc06.l1} f={f} times={W1.map((t) => Math.max(s0, at(t)))} y={270} />
      <Verse text={T.sc06.l2} f={f} times={W2.map((t) => at(t))} y={370} color={C.blue} />
    </Stage>
  );
};
