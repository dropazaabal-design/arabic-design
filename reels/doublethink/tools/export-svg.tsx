// Writes this reel's new character poses and props as standalone SVG files in assets/svg/, so Baseera's
// library can reuse them. Same approach as reels/boiling-frog/tools/export-svg.tsx. run: npm run assets
// (Arabic words inside props are SVG <text> in Cairo; open the files with Cairo installed to see them set.)
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { POSES } from '@mukarram/characters/rig';
import { Employee } from '../src/characters/employee';
import { Capsule, Chair, Clock, Crumple, Door, DoorSide, ManagerHand, Memo, Notebook, PadSheet, StampMark, StampTool, Whiteboard } from '../src/characters/office';

const out = path.join(process.cwd(), 'assets/svg/');
mkdirSync(out, { recursive: true });
const svg = (w: number, h: number, vb: string, node: React.ReactNode) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${renderToStaticMarkup(<>{node}</>)}</svg>\n`;
const MAN = (n: React.ReactNode) => svg(420, 700, '-210 -680 420 700', n);
const stand = POSES.stand;

const items: Array<[string, string]> = [
  ['clerk-neutral', MAN(<Employee x={0} y={0} pose={stand} expr="neutral" />)],
  ['clerk-sure-thumbs-up', MAN(<Employee x={0} y={0} pose={{ ...stand, armR: [118, 52], handR: 'thumb', tilt: 6 }} expr="laugh" talk={0.6} />)],
  ['clerk-doubt', MAN(<Employee x={0} y={0} pose={stand} expr={{ eyes: 'open', brow: [12, 12], lift: [-2, -2], mouth: 'wavy', sweat: 0.8 }} />)],
  ['clerk-sincere', MAN(<Employee x={0} y={0} pose={stand} expr={{ eyes: 'happy', brow: [-8, -8], lift: [10, 10], mouth: 'smile' }} />)],
  ['clerk-knowing', MAN(<Employee x={0} y={0} pose={stand} expr={{ eyes: 'half', brow: [8, -10], lift: [0, 14], mouth: 'smirk' }} />)],
  ['clerk-shrug', MAN(<Employee x={0} y={0} pose={POSES.shrug} expr="laugh" />)],
  ['door-locked-blank', svg(520, 960, '-260 -940 520 960', <Door x={0} y={0} st={{ word: null, count: 9 }} />)],
  ['door-locked-maftouh', svg(520, 960, '-260 -940 520 960', <Door x={0} y={0} st={{ word: 'مفتوح', count: 9 }} />)],
  ['door-locked-mughlaq', svg(520, 960, '-260 -940 520 960', <Door x={0} y={0} st={{ word: 'مغلق', count: 8, bold: 2 }} />)],
  ['door-side', svg(320, 960, '-160 -940 320 960', <DoorSide x={0} y={0} word="مفتوح" />)],
  ['manager-hand-stamp', svg(240, 320, '-120 -60 240 320', <ManagerHand from={[0, -40]} to={[0, 120]} hold="stamp" />)],
  ['pad-sheet-maftouh', svg(320, 170, '-160 -85 320 170', <PadSheet x={0} y={0} word="مفتوح" />)],
  ['pad-sheet-mughlaq-creased', svg(320, 170, '-160 -85 320 170', <PadSheet x={0} y={0} word="مغلق" crease={1} />)],
  ['crumpled-sheet', svg(120, 120, '-60 -60 120 120', <Crumple x={0} y={0} word="مفتوح" />)],
  ['stamp-mark-sahih', svg(300, 140, '-150 -70 300 140', <StampMark x={0} y={0} word="صحيح" color="#2E7BC5" seal={false} />)],
  ['stamp-tool-blue', svg(120, 120, '-60 -30 120 120', <StampTool x={0} y={0} color="#2E7BC5" />)],
  ['memo-qaim-sahih', svg(220, 280, '-110 -140 220 280', <Memo kind="on" x={0} y={0} ok={1} />)],
  ['memo-mulgha', svg(220, 280, '-110 -140 220 280', <Memo kind="off" x={0} y={0} />)],
  ['capsule', svg(80, 140, '-40 -70 80 140', <Capsule x={0} y={0} />)],
  ['notebook-maqfoul', svg(340, 220, '-170 -110 340 220', <Notebook x={0} y={0} word="مقفول" smudge />)],
  ['office-chair-red', svg(260, 360, '-130 -350 260 360', <Chair x={0} y={0} />)],
  ['clock-3-00', svg(280, 130, '-140 -65 280 130', <Clock x={0} y={0} text="3:00" />)],
  ['whiteboard-doublethink', svg(420, 480, '-210 -240 420 480', <Whiteboard x={0} y={0} write={1} sub={1} />)],
];
for (const [name, body] of items) writeFileSync(`${out}${name}.svg`, body);
console.log(`${items.length} SVGs → assets/svg/`);
