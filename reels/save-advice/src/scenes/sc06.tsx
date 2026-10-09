import React from 'react';
import { Book, Card, Drawer, Start, Task } from '../art/saved';
import { Check } from '../art/world';
import { T } from '../copy';
import { Stage } from '../Stage';
import { C } from '../theme';
import { ease, mix, prog, sceneEnd, sec, useEpisodeFrame, wordAt } from '../time';
import { CARD, Title } from './shared';

// sc06 — not everything you watch: a flood of saved cards pours in; then all but one fall away, and the
// one that fits is chosen (green) and started.
const FLOOD = Array.from({ length: 11 }).map((_, i) => ({
  kind: (['book', 'focus', 'day'] as const)[i % 3],
  color: [C.blue, C.navy2, C.cardboardDark, C.red, C.aqua, C.green][i % 6],
  x: 170 + ((i * 337) % 760), y: 590 + ((i * 211) % 420), rot: ((i * 37) % 30) - 15,
}));
const KEEP = 5;   // the one that stays (a «ترتيب اليوم» card)

export const SC06: React.FC = () => {
  const f = useEpisodeFrame();
  const b = { not: wordAt('s08', 'ليس'), all: wordAt('s08', 'كل'), need: wordAt('s09', 'المطلوب'), choose: wordAt('s09', 'تختار'), fits: wordAt('s09', 'يناسبك'), go: wordAt('s09', 'وتبدأ') };
  const prev = 1 - prog(f, b.not - sec(0.2), sec(0.4));
  const fall = prog(f, b.need - sec(0.05), sec(0.7), ease.in);
  const pick = prog(f, b.need + sec(0.2), sec(0.7), ease.inOut);
  const ring = prog(f, b.choose - sec(0.1), sec(0.35));
  const go = prog(f, b.go - sec(0.1), sec(0.35), ease.out);
  return (
    <Stage f={f} svg={
      <>
        <Drawer open={0} tabs={[]} />
        {prev > 0 && <g opacity={prev}><Book x={250} y={520} s={0.42} open={1} read={1} color={C.blue} /><Check x={360} y={440} s={1.1} /><Task x={540} y={780} p={0.65} label="" /></g>}
        {FLOOD.map((c, i) => {
          const at = b.not + sec(0.25) + i * sec(0.09);
          const p = prog(f, at, sec(0.45), ease.out);
          if (p <= 0) return null;
          if (i === KEEP) {
            const k = CARD.day;
            return <Card key={i} kind={k.kind} label={T.sc06.day} color={k.color} x={mix(c.x, 540, pick)} y={mix(c.y - 80 * (1 - p), 720 - 40 * go, pick)} s={mix(0.42 * mix(0.4, 1, p), 0.85, pick)} rot={mix(c.rot, 0, pick)} o={Math.min(1, p * 2)} ring={ring} />;
          }
          return <Card key={i} kind={c.kind} label="" color={c.color} x={c.x} y={c.y - 80 * (1 - p) + fall * 1400} s={0.42 * mix(0.4, 1, p)} rot={c.rot + fall * 25} o={Math.min(1, p * 2) * (1 - fall)} />;
        })}
        {ring > 0.9 && <Check x={540 + 150} y={720 - 200} s={mix(0.5, 1.5, prog(f, b.fits - sec(0.1), sec(0.3), ease.out))} o={prog(f, b.fits - sec(0.1), sec(0.2))} />}
        {go > 0 && <Start x={760} y={870} s={mix(0.5, 1.1, go)} o={go} />}
      </>
    }>
      <Title text={T.sc06.title1} f={f} at={b.not - sec(0.1)} until={b.choose - sec(0.3)} color={C.red} />
      <Title text={T.sc06.title2} f={f} at={b.choose - sec(0.1)} until={sceneEnd('sc06') - sec(0.35)} color={C.green} />
    </Stage>
  );
};
