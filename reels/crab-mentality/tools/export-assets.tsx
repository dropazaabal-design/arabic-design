// Writes the reel's characters and props as standalone SVG files (no text),
// so Baseera's library can store and reuse them outside this video.
// run: npx esbuild tools/export-assets.tsx --bundle --platform=node --outfile=out/export.cjs && node out/export.cjs
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Crab } from '../src/art/crab';
import { BUCKET, Block, CUP, Checklist, Crate, Awning, Ladder, Notebook, VesselBack, VesselDefs, VesselFront, WiseBook, Wrench } from '../src/art/props';
import { C } from '../src/theme';

const out = new URL('../assets/library/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const svg = (w: number, h: number, vb: string, node: React.ReactNode) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${renderToStaticMarkup(<><VesselDefs />{node}</>)}</svg>\n`;

const items: Array<[string, string]> = [
  ['crab-hero-determined', svg(320, 320, '-160 -190 320 320', <Crab x={0} y={0} mood="determined" look={[0, -0.6]} />)],
  ['crab-hero-happy', svg(320, 320, '-160 -190 320 320', <Crab x={0} y={0} mood="happy" raise={1.3} />)],
  ['crab-hero-worried', svg(320, 320, '-160 -190 320 320', <Crab x={0} y={0} mood="worried" look={[0, 0.8]} />)],
  ['crab-red-grumpy', svg(320, 320, '-160 -190 320 320', <Crab x={0} y={0} color={C.red} shade={C.redDeep} mood="grumpy" />)],
  ['bucket-galvanized', svg(760, 680, '160 820 760 680', <><VesselBack v={BUCKET} /><VesselFront v={BUCKET} /></>)],
  ['bucket-cutaway', svg(760, 680, '160 820 760 680', <><VesselBack v={BUCKET} cut={1} /><VesselFront v={BUCKET} cut={1} /></>)],
  ['coffee-cup', svg(360, 260, '20 1090 360 260', <><VesselBack v={CUP} /><VesselFront v={CUP} cup={1} /></>)],
  ['notebook-arabic-open', svg(720, 480, '400 850 720 480', <Notebook x={740} y={1300} w={320} h={430} open={1} write={0.6} />)],
  ['notebook-arabic-closed', svg(380, 480, '400 850 380 480', <Notebook x={740} y={1300} w={320} h={430} open={0} write={0} />)],
  ['ladder-broken-rung', svg(220, 760, '-110 -740 220 760', <Ladder x={0} y={0} h={720} total={4} broken={1} fix={0} />)],
  ['wrench', svg(120, 200, '-60 -50 120 200', <Wrench x={0} y={0} rot={0} />)],
  ['block-lock', svg(300, 260, '-130 -220 300 260', <Block x={0} y={0} w={200} h={180} color={C.blue} emblem="lock" />)],
  ['block-tool', svg(300, 260, '-130 -220 300 260', <Block x={0} y={0} w={200} h={180} color={C.green} emblem="tool" />)],
  ['block-check', svg(300, 260, '-130 -220 300 260', <Block x={0} y={0} w={200} h={180} color={C.amberDeep} emblem="check" />)],
  ['wise-book', svg(520, 460, '-260 -380 520 460', <WiseBook x={0} y={0} open={1} glow={1} />)],
  ['checklist', svg(300, 400, '-150 -200 300 400', <Checklist x={0} y={0} ticks={1} />)],
  ['crate', svg(280, 220, '-140 -200 280 220', <Crate x={0} y={0} w={240} h={180} />)],
  ['awning', svg(640, 180, '-320 -110 640 180', <Awning x={0} y={0} w={560} />)],
];
for (const [name, body] of items) writeFileSync(`${out}${name}.svg`, body);
console.log(JSON.stringify(items.map(([n]) => n)));
