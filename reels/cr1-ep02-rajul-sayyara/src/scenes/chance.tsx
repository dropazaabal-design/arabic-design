import React from 'react';
import { Calendar, Car, walk } from '../../../../motion-core/src/cartoon';
import { TITLE } from '../fonts';
import { Bar, Chain, Eye, Tag } from '../graphics';
import { GROUND, OfficeSet, ParkingSet } from '../sets';
import { Actor, F, Frame, P, by, camMix, type Cam, type Ratio } from '../stage';
import { C, CAST } from '../theme';
import { ease, life, mix, prog, sec } from '../time';

// E6 (L6) and R3: the money went into something everyone sees; next to it, a car nobody looks
// at: Saad's, scratched for two years. Six months later a door opens: a young company, a
// project they love, a lower first-year salary. Majid wants it more, but the instalment holds
// him back by a chain. Saad says yes and walks through.
export type ChanceBeats = {
  start: number; where?: number; seen?: number; pan: number; saad: number; scratch?: number; later?: number;
  office: number; chance: number; less: number; want?: number; but: number; chain: number; yes: number; end: number;
};

const OLD = { color: C.oldCar, shade: C.oldCarShade };

export const Chance: React.FC<{ f: number; k: ChanceBeats; ratio: Ratio }> = ({ f, k, ratio }) =>
  f < k.office ? <Park f={f} k={k} ratio={ratio} /> : <Office f={f} k={k} ratio={ratio} />;

const Park: React.FC<{ f: number; k: ChanceBeats; ratio: Ratio }> = ({ f, k, ratio }) => {
  const mine = { x: 520 }, his = { x: 1520 };
  const a0: Cam = by(ratio, { x: 760, y: 600, z: 1.12 }, { x: 640, y: 700, z: 1.25 }, { x: 640, y: 700, z: 1.12 });
  const a1: Cam = by(ratio, { x: 1340, y: 600, z: 1.12 }, { x: 1560, y: 700, z: 1.25 }, { x: 1560, y: 700, z: 1.12 });
  const zs: Cam = { x: his.x + 100, y: 760, z: by(ratio, 1.9, 1.8) };
  let c = camMix(a0, a1, prog(f, k.pan - sec(0.2), sec(1.4), ease.inOut));
  if (k.scratch) c = camMix(c, zs, prog(f, k.scratch - sec(0.4), sec(0.8), ease.inOut) * (1 - prog(f, (k.later ?? k.office) - sec(0.5), sec(0.5), ease.inOut)));
  const seen = k.seen ?? -1e9;
  const passer = walk(f, 2050, 600, k.pan + sec(0.4), sec(3.2), 34);
  return (
    <Frame ratio={ratio} c={c} world={<>
      <ParkingSet sway={Math.sin(f / 70) * 3} />
      <Car id={`ch-m-${ratio}`} kind="new" color={C.pearl} shade={C.pearlShade} glass={C.glass} x={mine.x} y={GROUND + 6} scale={1.08}
        shine={k.seen ? ((f - seen) % sec(2.4)) / sec(1.1) : -1} />
      <Car id={`ch-s-${ratio}`} kind="old" color={OLD.color} shade={OLD.shade} glass={C.glass} x={his.x} y={GROUND + 6} scale={1.08} facing={-1} />
      {/* everyone sees Majid's car */}
      {k.seen && [[-160, -330], [10, -380], [180, -320]].map(([dx, dy], j) => (
        <Eye key={j} x={mine.x + dx} y={GROUND + dy} s={1.1 * prog(f, seen + j * sec(0.15), sec(0.3), ease.back)} o={1 - prog(f, k.pan, sec(0.4))} />
      ))}
      <Actor f={f} d={{
        look: CAST.majid, id: `ch-mj-${ratio}`, seed: 51, x: mine.x + 400, y: GROUND + 34, scale: 0.95, facing: -1,
        pose: [P(0, 'stand', { headTurn: 0.6 }), ...(k.where ? [P(k.where, 'shrug', {}, 12), P(k.where + sec(1.2), 'proud', { headTurn: 0.5 }, 16)] : [P(0, 'proud', { headTurn: 0.5 })])],
        face: [F(0, 'calm', { gx: 1 }), ...(k.where ? [F(k.where, 'worried', { gx: 0, gy: 0.4 }, 10), F(k.where + sec(1.2), 'proud', { gx: 1 }, 14)] : [F(0, 'proud', { gx: 1 })])],
      }} />
      <Actor f={f} d={{
        look: CAST.saad, id: `ch-sd-${ratio}`, seed: 52, x: his.x + by(ratio, 330, 250), y: GROUND + 34, scale: 0.97, facing: -1,
        pose: [P(0, 'stand', { headTurn: 0.4 }), P(k.saad, 'wave', { headTurn: 0.9 }, 12), P(k.saad + sec(0.9), 'stand', { headTurn: 0.7 }, 14),
          ...(k.scratch ? [P(k.scratch, 'scratch', { headTurn: 0.5 }, 12), P(k.scratch + sec(1.2), 'shrug', {}, 14)] : [])],
        face: [F(0, 'calm', { gx: 1 }), F(k.saad, 'smile', { gx: 1 }, 10), ...(k.scratch ? [F(k.scratch, 'grin', { gx: 0.6, gy: 0.4 }, 12)] : [])],
      }} />
      {/* someone walks past the old car without a glance */}
      <Actor f={f} d={{
        look: CAST.young, id: `ch-p-${ratio}`, seed: 53, x: passer.x, y: GROUND + 60, scale: 0.98, add: passer.add, facing: -1,
        pose: [P(0, 'stand')], face: [F(0, 'calm', { gx: 1, gy: 0.2 })], o: life(f, k.pan + sec(0.3), k.pan + sec(3.8), sec(0.3), sec(0.4)),
      }} />
      {k.scratch && <circle cx={his.x - 55 * 1.08} cy={GROUND + 6 - 92 * 1.08} r={40} fill="none" stroke={C.red} strokeWidth={5}
        opacity={prog(f, k.scratch + sec(0.3), sec(0.3))} strokeDasharray="10 8" />}
    </>} />
  );
};

const Office: React.FC<{ f: number; k: ChanceBeats; ratio: Ratio }> = ({ f, k, ratio }) => {
  const door = prog(f, k.chance - sec(0.1), sec(0.6), ease.inOut);
  const glow = door * (0.85 + 0.15 * Math.sin(f / 10));
  const majidFrom = by(ratio, 380, 480);
  const want = k.want ?? k.but - sec(0.6);
  const go = walk(f, majidFrom, majidFrom + 380, want, sec(0.9), 30);
  const pull = prog(f, k.chain, sec(0.7), ease.out);
  const majidX = go.x - pull * 170;
  const saadGo = walk(f, 1130, 1380, k.yes + sec(0.5), sec(1.0), 30);
  const inDoor = prog(f, k.yes + sec(1.3), sec(0.6));
  const chainIn = prog(f, k.but, sec(0.4));
  const anchor: [number, number] = [majidFrom - by(ratio, 200, 150), 700];
  const c: Cam = by(ratio, { x: 930, y: 540, z: 1.0 }, { x: 900, y: 560, z: 0.85 }, { x: 900, y: 560, z: 0.8 });
  const later = k.later !== undefined ? life(f, k.office, k.chance - sec(0.1), sec(0.3), sec(0.3)) : 0;
  const flips = k.later !== undefined ? prog(f, k.office, Math.max(sec(0.6), k.chance - k.office - sec(0.4)), ease.inOut) * 6 : 0;
  return (
    <Frame ratio={ratio} c={c} world={<>
      <OfficeSet door={door} doorGlow={glow} />
      <Tag x={1380} y={290} text="فرصة" color={C.green} size={44} o={prog(f, k.chance + sec(0.2), sec(0.4))} />
      {/* the first-year salary: shorter */}
      {f >= k.less - sec(0.6) && <g opacity={prog(f, k.less - sec(0.6), sec(0.4))}>
        <Bar x={1230} y={170} w={300} h={56} segs={[{ frac: 1, color: C.blue, grow: mix(1, 0.62, prog(f, k.less, sec(0.6), ease.inOut)) }]} />
        <Tag x={1150} y={198} text="أقل" color={C.red} size={34} o={prog(f, k.less + sec(0.3), sec(0.3))} />
      </g>}
      {chainIn > 0 && <g opacity={chainIn * (1 - prog(f, k.yes + sec(1.6), sec(0.5)))}>
        <Chain x1={anchor[0] + 80} y1={anchor[1] - 10} x2={majidX - 20} y2={GROUND - 30 - 160} taut={pull} color={C.red} />
        <Car id={`ch-anc-${ratio}`} kind="new" color={C.pearl} shade={C.pearlShade} glass={C.glass} x={anchor[0]} y={anchor[1] + 40} scale={0.32} />
        <Tag x={anchor[0]} y={anchor[1] - 100} text="القسط" color={C.red} size={34} o={1} />
      </g>}
      <Actor f={f} d={{
        look: CAST.majid, id: `of-m-${ratio}`, seed: 54, x: majidX, y: GROUND - 30, scale: 0.95, add: go.add, facing: 1,
        pose: [P(0, 'stand', { headTurn: 0.4 }), P(k.chance, 'stand', { headTurn: 0.9, lean: -2 }, 12), P(want, 'point', { lean: 6 }, 12),
          P(k.chain, 'slump', { lean: -8, headTurn: 0.9 }, 10), P(k.yes, 'stand', { headTurn: 0.9 }, 16)],
        face: [F(0, 'calm', { gx: 1 }), F(k.chance, 'surprised', { gx: 1 }, 8), F(k.chance + sec(0.6), 'dreamy', { gx: 1 }, 14), F(want, 'determined', { gx: 1 }, 10),
          F(k.chain, 'wince', { gx: -0.5 }, 8), F(k.yes, 'sad', { gx: 1, gy: 0 }, 16)],
        handF: f >= want && f < k.chain ? 'point' : 'fist',
      }} />
      <Actor f={f} d={{
        look: CAST.saad, id: `of-s-${ratio}`, seed: 55, x: saadGo.x, y: GROUND - 30, scale: 0.97, add: saadGo.add, facing: 1, o: 1 - inDoor,
        pose: [P(0, 'stand', { headTurn: 0.5 }), P(k.chance, 'stand', { headTurn: 0.9 }, 12), P(k.yes, 'wave', { headTurn: 0.9 }, 10), P(k.yes + sec(0.5), 'stand', { headTurn: 1 }, 10)],
        face: [F(0, 'calm', { gx: 1 }), F(k.chance, 'surprised', { gx: 1 }, 8), F(k.chance + sec(0.6), 'thinking', {}, 14), F(k.yes - sec(0.3), 'determined', { gx: 1 }, 10), F(k.yes, 'grin', { gx: 1 }, 8)],
      }} />
      {later > 0 && <g opacity={later} transform="translate(960 300)">
        <rect x={-260} y={-60} width={520} height={480} rx={26} fill="rgba(14,22,38,0.7)" />
        <g transform="translate(-200 -20)">
          <Calendar w={400} head={C.blue} markColor={C.red} font={TITLE} title="" />
          {flips % 1 > 0 && <g transform={`scale(1 ${Math.abs(Math.cos((flips % 1) * Math.PI))})`}><Calendar w={400} head={C.blue} markColor={C.red} font={TITLE} title="" /></g>}
        </g>
        <Tag x={0} y={380} text="بعد ستة شهور" color={C.blue} size={40} o={1} />
      </g>}
    </>} />
  );
};
