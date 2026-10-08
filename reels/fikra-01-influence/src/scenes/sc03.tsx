import React from 'react';
import { BookCard, PathShortcut } from '../art/doodles';
import { T } from '../copy';
import { Headline, Label } from '../text';
import { C } from '../theme';
import { Paper, Stage } from '../Stage';
import { ease, mix, prog, sec, sceneEnd, sceneStart, useEpisodeFrame, wordAt } from '../time';

// sc03 — the book (an original descriptive card, not the cover), mental shortcuts, the idea's name.
export const SC03: React.FC = () => {
  const f = useEpisodeFrame();
  const end = sceneEnd('sc03');
  const b = {
    book: wordAt('s07', 'كتاب'), shortcuts: wordAt('s07', 'اختصارات'), abused: wordAt('s09', 'تستغ'),
    name: wordAt('s10', 'التباين'), principle: wordAt('s10', 'يسم'),
    named: wordAt('s07', 'التأثير'), field: wordAt('s07', 'الإقناع'), author: wordAt('s07', 'روبرت'), one: wordAt('s10', 'واحدة'),
    save: wordAt('s08', 'توفر'), serve: wordAt('s08', 'تخدمنا'), arrange: wordAt('s09', 'يرتب'), seen: wordAt('s09', 'نراه'),
  };
  const card = prog(f, sceneStart('sc03') + sec(0.15), sec(0.7), ease.out);
  const pLong = prog(f, b.shortcuts - sec(0.1), sec(1.1), ease.inOut);
  const pShort = prog(f, b.shortcuts + sec(1.0), sec(0.7), ease.inOut);
  const warn = prog(f, b.abused - sec(0.1), sec(0.35), ease.out);
  const saved = prog(f, b.save, sec(0.6), ease.inOut); // the long way fades: time and effort saved
  const race = prog(f, b.save - sec(0.1), sec(2.4), (x) => x); // the shortcut dot arrives while the other still crawls
  const marks: [number, number, number] = [prog(f, b.named, sec(0.5)), prog(f, b.field - sec(0.3), sec(0.5)), prog(f, b.author, sec(0.5))];
  const ok = prog(f, b.serve - sec(0.1), sec(0.4), ease.out); // «تخدمنا جيدًا»
  const one = prog(f, b.one - sec(0.1), sec(0.9), ease.out); // «واحدة منها»: today's idea is on this shortcut
  // «حين يرتّب أحدٌ ما نراه»: two cards are placed on the shortcut, in an order someone chose
  const on = (t: number): [number, number] => [620 + 0.95 * (-380 + 760 * t), 560 + 0.95 * (120 - 230 * t)];
  const placed: Array<[number, number, string]> = [[0.2, b.arrange, '1'], [0.86, b.seen, '2']];
  const clear = prog(f, b.name - sec(0.55), sec(0.5), ease.inOut); // the card and the path clear just before the name lands on «التباين»
  const line = prog(f, b.name + sec(0.3), sec(0.7), ease.inOut);
  return (
    <Stage f={f} svg={
      <>
        {clear < 1 && card > 0 && <BookCard x={1340} y={mix(600, 540, card)} s={0.95} o={card * (1 - clear)} rot={mix(4, 1.5, card)} title={T.sc03.title} subtitle={T.sc03.subtitle} author={T.sc03.author} marks={marks} />}
        {clear < 1 && pLong > 0 && <g opacity={1 - clear}><PathShortcut x={620} y={560} s={0.95} pLong={pLong} pShort={pShort} warn={warn} fadeLong={saved} race={race} /></g>}
        {one > 0 && one < 1 && <ellipse cx={on(0.5)[0]} cy={on(0.5)[1]} rx={mix(60, 420, one)} ry={mix(30, 170, one)} transform={`rotate(-17 ${on(0.5)[0]} ${on(0.5)[1]})`} fill="none" stroke={C.blue} strokeWidth={6} opacity={(1 - one) * 0.9} />}
        {clear < 1 && ok > 0 && <g transform={`translate(${on(1)[0] + 70} ${on(1)[1] - 60}) scale(${mix(0.6, 1, ok)})`} opacity={ok * (1 - clear)}><circle r={34} fill={C.green} /><path d="M -15 0 L -3 12 L 17 -12" fill="none" stroke={C.white} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" /></g>}
        {clear < 1 && placed.map(([t, at, n]) => {
          const p = prog(f, at - sec(0.15), sec(0.45), ease.out);
          if (p <= 0) return null;
          const [x, y] = on(t);
          return <g key={n} opacity={p * (1 - clear)} transform={`translate(${x} ${y - mix(150, 110, p)})`}><Paper x={0} y={0} w={96} h={96} rot={n === '1' ? -4 : 3} /><text y={4} textAnchor="middle" dominantBaseline="central" fontFamily="Cairo" fontWeight={900} fontSize={52} fill={C.ink}>{n}</text></g>;
        })}
        {line > 0 && <path d="M 1260 640 L 660 640" stroke={C.coverBlue} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - line} />}
      </>
    }>
      <Label text={T.sc03.shortcut} f={f} at={b.shortcuts + sec(1.0)} until={b.principle} x={620} y={300} size={44} bg={C.blue} />
      <Headline text={T.sc03.principle} f={f} at={b.name - sec(0.1)} until={end} x={960} y={420} size={140} color={C.coverBlue} />
    </Stage>
  );
};
