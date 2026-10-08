import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Bubble, Headphones, PriceTag } from '../art/doodles';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Headline, Label } from '../text';
import { C } from '../theme';
import { TL, ease, mix, prog, sec, sceneStart, segEnd, useEpisodeFrame, wordAt } from '../time';

const mixColor = (a: string, b: string, p: number) => {
  const h = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [x, y] = [h(a), h(b)];
  return `rgb(${x.map((v, i) => Math.round(mix(v, y[i], p))).join(',')})`;
};

// sc08 — back to the first symbol and the opening question; a quiet close on the series mark.
export const SC08: React.FC = () => {
  const f = useEpisodeFrame();
  const start = sceneStart('sc08'), end = TL.durationInFrames;
  const b = { same: wordAt('s35', 'والسعر'), unchanged: wordAt('s35', 'تتغير'), ask: wordAt('s36', 'واسأل'), yes: wordAt('s36', 'نعم'), pause: wordAt('s36', 'توقف'), q1: wordAt('s37', 'هل') - sec(0.1), q2: wordAt('s37', 'أم') - sec(0.1), done: segEnd('s37') };
  const pair = prog(f, start, sec(0.6));
  const away = prog(f, b.q1 - sec(0.3), sec(0.6), ease.inOut); // the pair steps away on «واسأل», just before the question
  const yes = prog(f, b.yes - sec(0.15), sec(0.4), ease.out) * (1 - prog(f, b.q1 - sec(0.3), sec(0.5)));
  const hush = 0.25 * prog(f, b.pause - sec(0.1), sec(0.8), ease.inOut) * (1 - prog(f, b.q1 - sec(0.2), sec(0.5))); // «توقّف لحظة»
  const ghost = 0.35 * (1 - prog(f, b.unchanged - sec(0.1), sec(0.8), ease.inOut)); // «لم تتغيّر»: the $200 pair leaves; the $40 pairs are alike
  const night = prog(f, b.done + sec(0.6), sec(1.4), ease.inOut);
  const mark = end - sec(3);
  const [price] = T.sc08.equal.split(' = ');
  return (
    <>
      <Stage f={f} svg={
        <g opacity={pair * (1 - away)} transform={`translate(0 ${-away * 40})`}>
          {/* right: the $40 pair alone */}
          <rect x={1000} y={250} width={760} height={600} rx={28} fill={C.white} stroke={C.line} strokeWidth={4} />
          <Headphones x={1380} y={430} s={1.05} color={C.blue} />
          <PriceTag x={1380} y={690} s={0.9} label={price} color={C.red} />
          {/* left: the same pair next to the $200 one */}
          <rect x={160} y={250} width={760} height={600} rx={28} fill={C.white} stroke={C.line} strokeWidth={4} />
          <Headphones x={360} y={420} s={0.95} color={C.coverBlue} fancy o={ghost} />
          <Headphones x={680} y={430} s={1.05} color={C.blue} />
          <PriceTag x={680} y={690} s={0.9} label={price} color={C.red} />
        </g>
      }>
        <Headline text={T.sc08.equal} f={f} at={b.same - sec(0.2)} until={b.q1 - sec(0.3)} x={960} y={110} size={84} color={C.ink} />
      </Stage>
      {/* the light lowers after the question; the series mark holds the last seconds */}
      <AbsoluteFill style={{ background: C.navy, opacity: Math.max(night * 0.9, hush) }} />
      {yes > 0 && <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}><g transform={`translate(960 930) scale(${mix(0.6, 1, yes)})`} opacity={yes}><Bubble x={0} y={0} w={220} h={110} fill={C.white} /></g></svg>}
      <Label text={T.sc08.yes} f={f} at={b.yes - sec(0.1)} until={b.q1 - sec(0.3)} x={960} y={922} size={44} bg="transparent" color={C.ink} />
      <Headline text={T.sc08.q1} f={f} at={b.q1} x={960} y={mix(360, 300, night)} w={1500} size={80} color={mixColor(C.ink, C.white, night)} />
      <Headline text={T.sc08.q2} f={f} at={b.q2} x={960} y={mix(480, 420, night)} w={1500} size={64} color={mixColor(C.blue, '#7FB3E6', night)} />
      <Label text={T.sc08.series} f={f} at={mark} x={960} y={720} size={40} bg={C.coverBlue} />
      <Label text={T.sc08.brand} f={f} at={mark + sec(0.3)} x={960} y={810} size={36} bg="transparent" color={C.white} border="#ffffff55" />
    </>
  );
};
