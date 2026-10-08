import React from 'react';
import { Arrow, Bubble, Gauge, Headphones, PriceTag, Target, Wallet } from '../art/doodles';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Headline, Label } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneEnd, sceneStart, useEpisodeFrame, wordAt } from '../time';

// sc05 — the decision evolving: $40 alone vs next to $200; a $30 plan ends at $40 while it feels like $160 saved.
export const SC05: React.FC = () => {
  const f = useEpisodeFrame();
  const start = sceneStart('sc05'), end = sceneEnd('sc05');
  const b = {
    see: wordAt('s18', 'السماعات'), forty: wordAt('s18', 'بأربعين'), alone: wordAt('s18', 'وحدها'), need: wordAt('s18', 'تحتاجه'), example: wordAt('s17', 'مثال'),
    lighter: wordAt('s24', 'أخف'), notMean: wordAt('s24', 'يعني'),
    pocket: wordAt('s18', 'ستقارنها'), beside: wordAt('s19', 'بجانب'), shift: wordAt('s19', 'تتغير'), deal: wordAt('s19', 'صفقة'),
    fixed: wordAt('s20', 'ثابت'), feel: wordAt('s20', 'الإحساس'), moved: wordAt('s20', 'تحرك'),
    plan: wordAt('s21', 'ثلاثين'), offer: wordAt('s21', 'يعرض'), show200: wordAt('s21', 'بمئتين'), here: wordAt('s21', 'وعندي'), show40: wordAt('s21', 'بأربعين'),
    saved: wordAt('s22', 'وفرت'), over: wordAt('s22', 'عشرة'), lie: wordAt('s23', 'يكذب'), honest: wordAt('s23', 'أحد'),
    order: wordAt('s23', 'ترتيب'), began: wordAt('s23', 'فبدأت'), dearest: wordAt('s23', 'الأغلى'), warn: wordAt('s24', 'انتبه'),
  };
  // part 1: $40 alone is measured against the wallet; the $200 pair arrives, then the comparison point moves to it
  const p1 = 1;
  const drawA = prog(f, start + sec(0.1), Math.max(sec(1), b.see + sec(0.3) - start), ease.out); // drawn through «لكن لنرَ كيف يتطوّر القرار»
  const tagA = prog(f, b.forty - sec(0.1), sec(0.45), ease.out);
  const ring = prog(f, b.alone - sec(0.1), sec(0.6), ease.inOut) * (1 - prog(f, b.beside - sec(0.1), sec(0.4)));
  const needIn = prog(f, b.need - sec(0.1), sec(0.5), ease.out);
  const pop = 1 + 0.35 * (1 - prog(f, b.example - sec(0.1), sec(0.5), ease.out)) * (f >= b.example - sec(0.1) ? 1 : 0);
  const dip = 1 - 0.12 * Math.sin(prog(f, b.lighter - sec(0.1), sec(0.6)) * Math.PI);
  const neq = prog(f, b.notMean - sec(0.1), sec(0.6), ease.out); // «لا يعني أنه مناسبٌ لك»
  const wallet = prog(f, b.pocket - sec(0.2), sec(0.5));
  const bIn = prog(f, b.beside - sec(0.1), sec(0.8), ease.inOut);
  const toB = prog(f, b.shift - sec(0.1), sec(0.8), ease.inOut); // «تتغيّر نقطة المقارنة»
  const wx = mix(620, 330, bIn), wy = mix(560, 600, bIn);
  const deal = 1 - 0.1 * Math.sin(prog(f, b.deal, sec(0.5)) * Math.PI); // the $40 tag shrinks for a moment: «صفقة»
  const pulse = 1 + 0.08 * Math.sin(prog(f, b.fixed, sec(0.6)) * Math.PI);
  const gauge = prog(f, b.feel - sec(0.2), sec(0.4));
  const drop = prog(f, b.moved - sec(0.1), sec(0.8), ease.inOut); // «الإحساس به تحرّك»
  const p1Out = prog(f, b.plan - sec(0.5), sec(0.5), ease.in);
  // part 2: the story with a plan
  const bPair = prog(f, b.offer - sec(0.1), sec(0.5)), bTag = prog(f, b.show200 - sec(0.1), sec(0.4));
  const aPair = prog(f, b.here - sec(0.1), sec(0.5)), aTag = prog(f, b.show40 - sec(0.1), sec(0.4));
  const leave = prog(f, b.saved - sec(0.3), sec(0.6), ease.inOut);
  const clear = prog(f, b.lie - sec(0.2), sec(0.5), ease.in); // the feeling and the fact step aside: «لم يكذب عليك أحد»
  const honest = prog(f, b.honest - sec(0.1), sec(0.35), ease.out);
  const recap = prog(f, b.order - sec(0.2), sec(0.6), ease.inOut); // the order of the offer, replayed
  const warn = prog(f, b.warn - sec(0.2), sec(0.5));
  const badge = (at: number) => prog(f, at, sec(0.35), ease.out);
  const first = 1 + 0.15 * Math.sin(prog(f, b.dearest - sec(0.1), sec(0.6)) * Math.PI);
  const ax = 700 + 260 * leave;
  const planMove = prog(f, b.offer - sec(0.7), sec(0.55), ease.inOut); // the plan is stated big, then pinned to the corner // the $40 pair, after the $200 one has left
  return (
    <Stage f={f} svg={
      <>
        {p1Out < 1 && (
          <g opacity={p1 * (1 - p1Out)}>
            <Headphones x={1300} y={380} s={1.15} color={C.blue} p={drawA} />
            {tagA > 0 && <PriceTag x={1300} y={680} s={pulse * deal * mix(0.7, 1, tagA)} o={tagA} label={T.sc05.price40} color={C.red} />}
            {ring > 0 && <ellipse cx={1300} cy={500} rx={250} ry={290} fill="none" stroke={C.inkSoft} strokeWidth={6} strokeDasharray="20 14" opacity={ring} />}
            {needIn > 0 && <Target x={wx - 250} y={wy} s={0.55} p={needIn} o={needIn * (1 - bIn)} />}
            {wallet > 0 && <Wallet x={wx} y={wy} s={1.1} o={wallet * (1 - toB)} />}
            {bIn > 0 && <><Headphones x={mix(380, 620, bIn)} y={360} s={1.3} color={C.coverBlue} fancy o={bIn} /><PriceTag x={620} y={680} s={0.95} o={bIn} label={T.sc05.price200} color={C.coverBlue} w={320} /></>}
            <Arrow from={[1120, 690]} to={[mix(wx + 140, 800, toB), mix(wy + 40, 690, toB)]} bend={0.2} p={prog(f, b.pocket, sec(0.6), ease.inOut)} color={C.blue} />
            {gauge > 0 && <Gauge x={1590} y={470} s={0.7} level={mix(0.75, 0.32, drop)} color={drop > 0.5 ? C.blue : C.red} o={gauge} />}
          </g>
        )}
        {p1Out > 0 && (
          <g>
            {bPair > 0 && <g opacity={bPair * (1 - leave)}><Headphones x={1260} y={430} s={1.0} color={C.coverBlue} fancy />{bTag > 0 && <PriceTag x={1260} y={700} s={0.85 * mix(0.7, 1, bTag)} o={bTag} label={T.sc05.price200} color={C.coverBlue} w={320} />}</g>}
            {aPair > 0 && <g opacity={aPair}><Headphones x={ax} y={430} s={1.0} color={C.blue} />{aTag > 0 && <PriceTag x={ax} y={700} s={0.85 * mix(0.7, 1, aTag) * dip} o={aTag} label={T.sc05.price40} color={C.red} />}</g>}
            {/* lighter by comparison ≠ suitable: the need target stands apart */}
            {neq > 0 && <g opacity={neq}><Target x={1420} y={470} s={0.75} p={neq} /><path d="M 1165 450 L 1235 450 M 1165 490 L 1235 490 M 1218 420 L 1182 520" {...{ stroke: C.red, strokeWidth: 10, strokeLinecap: 'round' as const, fill: 'none' }} /></g>}
            {bPair > 0 && leave < 1 && <g opacity={1 - leave}><Arrow from={[1110, 420]} to={[860, 420]} bend={-0.3} p={aPair} color={C.inkSoft} /></g>}
            {leave > 0 && clear < 1 && <Bubble x={1340} y={360} w={560} h={190} thought tail={-1} fill={C.white} o={leave * (1 - clear)} />}
            {/* the price was true: a check on the $40 tag */}
            {honest > 0 && warn < 1 && <g transform={`translate(${ax + 170} 640) scale(${mix(0.6, 1, honest)})`} opacity={honest * (1 - warn)}><circle r={30} fill={C.green} /><path d="M -13 0 L -3 10 L 15 -10" fill="none" stroke={C.white} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" /></g>}
            {/* «تغيّر ترتيب العرض… فبدأتَ المقارنة من الأغلى»: the $200 pair comes back as 1, the $40 pair is 2 */}
            {recap > 0 && warn < 1 && (
              <g opacity={recap * (1 - warn)}>
                <Headphones x={mix(380, 520, recap)} y={430} s={0.85} color={C.coverBlue} fancy o={0.85} />
                <PriceTag x={mix(380, 520, recap)} y={690} s={0.75} label={T.sc05.price200} color={C.coverBlue} w={320} />
                <Arrow from={[640, 330]} to={[840, 330]} bend={-0.3} p={prog(f, b.began - sec(0.1), sec(0.7), ease.inOut)} color={C.inkSoft} />
                {([[520, b.order, '1', first], [ax, b.order + sec(0.3), '2', 1]] as const).map(([x, at, n, k]) => {
                  const p = badge(at);
                  return p > 0 ? <g key={n} transform={`translate(${x} 230) scale(${p * k})`}><circle r={36} fill={C.ink} /><text y={2} textAnchor="middle" dominantBaseline="central" fontFamily="Cairo" fontWeight={900} fontSize={40} fill={C.white}>{n}</text></g> : null;
                })}
              </g>
            )}
          </g>
        )}
      </>
    }>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${pop})`, transformOrigin: '1700px 74px' }}><Label text={T.sc05.hypothetical} f={f} at={b.example - sec(0.1)} until={end} x={1766} y={74} align="right" size={30} bg={C.coverGray} color={C.ink} /></div>
      <Label text={T.sc05.reference} f={f} at={b.pocket + sec(0.3)} until={b.plan - sec(0.5)} x={mix(wx, 620, toB)} y={mix(wy - 110, 880, Math.min(1, toB * 2))} size={40} bg={C.blue} />
      <Label text={T.sc05.plan} f={f} at={b.plan - sec(0.1)} until={b.warn - sec(0.2)} x={mix(960, 1600, planMove)} y={mix(470, 170, planMove)} size={mix(64, 40, planMove)} bg={C.green} />
      <Headline text={T.sc05.saved} f={f} at={b.saved} until={b.lie - sec(0.2)} x={1340} y={318} w={520} size={52} color={C.blue} />
      <Label text={T.sc05.over} f={f} at={b.over} until={b.lie - sec(0.2)} x={960} y={860} size={48} bg={C.red} />
      <Headline text={T.sc05.warning} f={f} at={b.warn} until={end} x={960} y={150} size={88} color={C.red} />
    </Stage>
  );
};
