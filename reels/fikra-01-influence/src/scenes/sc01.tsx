import React from 'react';
import { Arrow, Gauge, Headphones, PriceTag } from '../art/doodles';
import { STROKE, draw } from '../motion';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Label } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneEnd, useEpisodeFrame, wordAt } from '../time';

// sc01 — the paradox before second 12: $40 feels expensive, then $200 appears beside it,
// and the same $40 feels lighter while its tag never changes.
export const SC01: React.FC = () => {
  const f = useEpisodeFrame();
  const end = sceneEnd('sc01');
  const b = {
    drawA: wordAt('s01', 'سماعات'), tagA: wordAt('s01', 'بأربعين') - sec(0.1), high: wordAt('s01', 'غالية'),
    inB: wordAt('s02', 'تظهر'), tagB: wordAt('s02', 'بمئتي') - sec(0.1),
    suddenly: wordAt('s03', 'وفجأة'), light: wordAt('s03', 'أخف'), same: wordAt('s03', 'سعرها'), pair: wordAt('s03', 'والسماعات'),
  };
  const pA = prog(f, -sec(0.25), Math.max(sec(0.9), b.drawA + sec(0.6)), ease.inOut); // drawing from frame 0
  const room = prog(f, b.inB - sec(0.15), sec(0.8), ease.inOut); // A makes room for B
  const ax = mix(960, 1220, room), as = mix(1.5, 1.25, room);
  const tagA = prog(f, b.tagA, sec(0.45), ease.out);
  const gauge = prog(f, b.high - sec(0.2), sec(0.6), ease.out) * 0.82;
  const drop = prog(f, b.light - sec(0.1), sec(0.9), ease.inOut);
  const inB = prog(f, b.inB, sec(0.8), ease.out);
  const tagB = prog(f, b.tagB, sec(0.45), ease.out);
  const lock = prog(f, b.same, sec(0.5), ease.out);
  const pull = prog(f, b.suddenly, sec(0.8), ease.inOut) * (1 - prog(f, b.same - sec(0.1), sec(0.4), ease.in)); // B acts on A
  const ring = prog(f, b.pair - sec(0.1), sec(0.7), ease.inOut); // and the pair itself is the same one
  const swing = (at: number) => 6 * Math.sin(((f - at) / sec(0.8)) * Math.PI) * Math.exp(-Math.max(0, f - at) / sec(0.9));
  return (
    <Stage f={f} svg={
      <>
        {/* A — the $40 pair, on the right (read first) */}
        <Headphones x={ax} y={mix(400, 380, room)} s={as} color={C.blue} p={pA} />
        {tagA > 0 && <PriceTag x={ax} y={700} s={mix(0.7, 1, tagA) * mix(1.1, 1, room)} o={tagA} rot={swing(b.tagA)} label={T.sc01.price40} color={C.red} />}
        {/* how expensive it feels */}
        {gauge > 0 && <Gauge x={mix(1340, 1580, room)} y={520} s={0.9} level={mix(gauge, 0.3, drop)} color={drop > 0.5 ? C.blue : C.red} o={Math.min(1, gauge * 3)} />}
        {/* B — the $200 pair slides in on the left */}
        {inB > 0 && <Headphones x={mix(240, 600, inB)} y={360} s={1.45} color={C.coverBlue} fancy o={inB} />}
        {tagB > 0 && <PriceTag x={600} y={700} s={mix(0.7, 1, tagB)} o={tagB} rot={swing(b.tagB)} label={T.sc01.price200} color={C.coverBlue} w={320} />}
        {/* the comparison: the $200 pair now sets the yardstick for the $40 one */}
        {pull > 0 && <g opacity={Math.min(1, pull * 2)}><Arrow from={[720, 200]} to={[1110, 232]} bend={-0.25} p={pull} color={C.inkSoft} width={6} /></g>}
        {ring > 0 && <ellipse cx={ax} cy={400} rx={235} ry={175} {...STROKE} stroke={C.green} strokeWidth={6} {...draw(ring)} />}
        {/* the price did not move: a frame locks onto the $40 tag */}
        {lock > 0 && <rect x={ax - 170} y={630} width={340} height={140} rx={24} fill="none" stroke={C.green} strokeWidth={8} strokeDasharray="1 1" pathLength={1} strokeDashoffset={1 - lock} />}
      </>
    }>
      <Label text={T.sc01.hypothetical} f={f} at={-sec(0.3)} until={end} x={1766} y={74} align="right" size={30} bg={C.coverGray} color={C.ink} />
      <Label text={T.sc01.feelsHigh} f={f} at={b.high} until={b.light} x={mix(1340, 1580, room)} y={760} size={36} bg={C.red} />
      <Label text={T.sc01.feelsLow} f={f} at={b.light + sec(0.3)} until={end} x={1580} y={760} size={36} bg={C.blue} />
      <Label text={T.sc01.samePrice} f={f} at={b.same + sec(0.2)} until={end} x={ax} y={800} size={44} bg={C.green} />
    </Stage>
  );
};
