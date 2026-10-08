import React from 'react';
import { Arrow, Bubble, Headphones, ShopBag, SubCard } from '../art/doodles';
import { T } from '../copy';
import { Paper, Stage } from '../Stage';
import { Headline, Label } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneEnd, sceneStart, useEpisodeFrame, wordAt } from '../time';

// sc02 — the viewer's problem: not the product, its neighbour; it happens in shops, offers and yeses.
export const SC02: React.FC = () => {
  const f = useEpisodeFrame();
  const start = sceneStart('sc02'), end = sceneEnd('sc02');
  const b = {
    what: wordAt('s04', 'ما'), beside: wordAt('s04', 'بجانبها'), next: wordAt('s05', 'وهذا'),
    shop: wordAt('s05', 'متجر'), sub: wordAt('s05', 'اشتراك'), yes: wordAt('s05', 'نعم'), why: wordAt('s06', 'لماذا'),
  };
  const pairIn = prog(f, start, sec(0.6));
  const pairOut = prog(f, b.next - sec(0.1), sec(0.5), ease.in);
  const ring = prog(f, b.beside - sec(0.1), sec(0.7), ease.inOut);
  const card = (at: number) => prog(f, at - sec(0.15), sec(0.5), ease.out);
  const dim = 1 - 0.65 * prog(f, b.why - sec(0.2), sec(0.5));
  const cards: Array<[number, number, React.ReactNode]> = [
    [1420, b.shop, <ShopBag key="bag" x={0} y={10} s={1.1} />],
    [960, b.sub, <SubCard key="sub" x={0} y={0} s={1.1} />],
    [500, b.yes, <Bubble key="yes" x={0} y={-10} w={250} h={140} fill={C.white} />],
  ];
  return (
    <Stage f={f} dark svg={
      <>
        {pairOut < 1 && (
          <g opacity={pairIn * (1 - pairOut)} transform={`translate(0 ${-pairOut * 60})`}>
            <Paper x={1250} y={520} w={380} h={360} rot={1.5} />
            <Headphones x={1250} y={500} s={0.95} color={C.blue} />
            <Paper x={690} y={520} w={380} h={360} rot={-1.5} />
            <Headphones x={690} y={490} s={1.05} color={C.coverBlue} fancy />
            <ellipse cx={690} cy={520} rx={230} ry={215} fill="none" stroke={C.red} strokeWidth={8} strokeDasharray="26 18" opacity={ring} />
            <Arrow from={[1060, 380]} to={[880, 380]} bend={-0.35} p={ring} color={C.red} />
          </g>
        )}
        {cards.map(([x, at, node], i) => {
          const p = card(at);
          if (p <= 0) return null;
          return (
            <g key={i} transform={`translate(${x} ${mix(620, 540, p)})`} opacity={p * dim}>
              <Paper x={0} y={0} w={330} h={300} rot={i % 2 ? 2 : -2} />
              {node}
            </g>
          );
        })}
        {f >= b.why - sec(0.2) && <Bubble x={960} y={500} w={760} h={250} thought fill={C.white} o={prog(f, b.why - sec(0.2), sec(0.5))} />}
      </>
    }>
      <Headline text={T.sc02.what} f={f} at={b.what} until={b.next} x={960} y={100} size={96} color={C.white} />
      <Label text={T.sc02.beside} f={f} at={b.beside} until={b.next} x={690} y={760} size={44} bg={C.red} />
      <Label text={T.sc02.yes} f={f} at={b.yes} until={b.why} x={500} y={500} size={56} bg="transparent" color={C.ink} />
      <Headline text={T.sc02.why} f={f} at={b.why} until={end} x={960} y={445} size={92} color={C.ink} />
    </Stage>
  );
};
