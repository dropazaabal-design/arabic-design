// Writes the reel's pencil and props as standalone SVG files (no text), so
// Baseera's library can store and reuse them outside this video.
// run from the project folder:
// npx esbuild tools/export-assets.tsx --bundle --platform=node --outfile=out/export.cjs && node out/export.cjs
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Pencil } from '../src/art/pencil';
import { CalendarStrip, Icon, ListSheet, Stone, Stopwatch } from '../src/art/props';
import { C } from '../src/theme';

const out = `${process.cwd()}/assets/library/`;
mkdirSync(out, { recursive: true });

const svg = (w: number, h: number, vb: string, node: React.ReactNode) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${renderToStaticMarkup(<>{node}</>)}</svg>\n`;

const LIST = Array.from({ length: 6 }).map((_, i) => ({
  icon: (['dumbbell', 'book', 'briefcase'] as const)[i % 3],
  color: [C.coral, C.blue, C.violet][i % 3],
}));

const items: Array<[string, string]> = [
  ['pencil-eager', svg(160, 500, '-80 -480 160 500', <Pencil x={0} y={0} mood="eager" look={[0, -0.6]} />)],
  ['pencil-tired', svg(160, 500, '-80 -480 160 500', <Pencil x={0} y={0} mood="tired" look={[0, 1]} />)],
  ['pencil-proud', svg(160, 500, '-80 -480 160 500', <Pencil x={0} y={0} mood="proud" look={[-0.6, -0.4]} />)],
  ['task-list-sheet', svg(640, 500, '-315 -10 640 500', <ListSheet x={0} y={0} w={600} rowH={70} rows={6} items={LIST} done={3} />)],
  ['calendar-missed-day', svg(780, 150, '-390 -75 780 150', <CalendarStrip x={0} y={0} n={6} cell={112} ticks={[1, 1, 1, 0, 1, 1]} missed={[3]} today={4} />)],
  ['stopwatch', svg(220, 250, '-110 -130 220 240', <Stopwatch x={0} y={0} hand={0.25} />)],
  ['road-stone', svg(170, 50, '-75 -25 170 45', <Stone x={0} y={0} w={120} p={1} />)],
  ['icon-book', svg(120, 100, '-60 -50 120 100', <Icon kind="book" x={0} y={0} s={1.2} />)],
  ['icon-dumbbell', svg(140, 80, '-70 -40 140 80', <Icon kind="dumbbell" x={0} y={0} s={1.2} />)],
  ['icon-briefcase', svg(120, 100, '-60 -50 120 100', <Icon kind="briefcase" x={0} y={0} s={1.2} />)],
  ['icon-shoe', svg(120, 80, '-60 -45 120 80', <Icon kind="shoe" x={0} y={0} s={1.2} />)],
];
for (const [name, body] of items) writeFileSync(`${out}${name}.svg`, body);
console.log(JSON.stringify(items.map(([n]) => n)));
