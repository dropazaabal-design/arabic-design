import React from 'react';
import { Bubble, Car, INK, Keys, Person, driverSeat, face, pose, walk } from '../../../../motion-core/src/cartoon';
import { GROUND, ParkingSet } from '../sets';
import { Actor, F, Frame, N, P, type Cam, type Ratio } from '../stage';
import { C, CAST } from '../theme';
import { ease, prog, sec } from '../time';

/**
 * The hook: Majid parks his new car so people will notice him. They do — and each one, in a
 * thought bubble, sees himself behind the wheel. Shared by the episode (L1) and the reel (R1);
 * each passes the frames of its own words.
 */
export type HookBeats = {
  start: number; isNew: number; notice: number; park: number; turn: number;
  but: number; think: number; imagine: number; end: number;
};

type Spot = { x: number; y: number; s: number };
const LAYOUT: Record<Ratio, {
  cam: Cam; carStop: number; carY: number; carScale: number; majid: Spot; people: Spot[]; bubbles: [number, number][]; bw: number; bh: number; push: number; panX: number;
}> = {
  '16x9': {
    cam: { x: 960, y: 600, z: 1.08 }, carStop: 690, carY: 935, carScale: 1.15, majid: { x: 300, y: 965, s: 0.95 },
    people: [{ x: 1150, y: 905, s: 0.8 }, { x: 1365, y: 908, s: 0.82 }, { x: 1575, y: 905, s: 0.8 }],
    bubbles: [[1030, 360], [1340, 250], [1620, 370]], bw: 285, bh: 210, push: 0.05, panX: 25,
  },
  '9x16': {
    cam: { x: 1250, y: 764, z: 1.25 }, carStop: 1300, carY: 1000, carScale: 1.05, majid: { x: 965, y: 1062, s: 1.0 },
    people: [{ x: 990, y: 905, s: 0.82 }, { x: 1255, y: 908, s: 0.84 }, { x: 1520, y: 905, s: 0.82 }],
    bubbles: [[1010, 390], [1255, 215], [1490, 395]], bw: 260, bh: 200, push: 0.02, panX: 0,
  },
  '4x5': {
    cam: { x: 1250, y: 734, z: 1.12 }, carStop: 1300, carY: 1000, carScale: 1.05, majid: { x: 965, y: 1062, s: 1.0 },
    people: [{ x: 990, y: 905, s: 0.82 }, { x: 1255, y: 908, s: 0.84 }, { x: 1520, y: 905, s: 0.82 }],
    bubbles: [[1005, 400], [1255, 255], [1500, 405]], bw: 270, bh: 200, push: 0.03, panX: 0,
  },
};

const WHO = ['noura', 'elder', 'young'] as const;

export const Hook: React.FC<{ f: number; b: HookBeats; ratio: Ratio; o?: number; dim?: number }> = ({ f, b, ratio, o = 1, dim = 0 }) => {
  const L = LAYOUT[ratio];
  // the car glides in and settles as he parks
  const arrive = prog(f, b.start - sec(0.3), b.park - b.start + sec(0.3), ease.out);
  const carX = L.carStop - 1500 * (1 - arrive);
  const settle = Math.sin(prog(f, b.park - sec(0.1), sec(0.5), ease.out) * Math.PI) * 4;
  const out = f >= b.park + sec(0.2) ? 1 : 0; // Majid steps out from behind the car
  const shine = (f - b.isNew) / sec(0.9);
  const push = prog(f, b.think, b.end - b.think, ease.inOut);
  const c: Cam = { x: L.cam.x + L.panX * push, z: L.cam.z * (1 + L.push * push), y: L.cam.y - 30 * push };

  const seat = driverSeat('new');
  const driver = out < 1 && (
    <Person id={`hk-drv-${ratio}`} look={CAST.majid} pose={pose('seated', { headTurn: 0.5 })}
      face={face(f < b.notice ? 'smile' : 'proud', { gx: f < b.notice ? 0.4 : 0.9 })} {...seat} />
  );

  // he walks out from behind the car's rear to his spot, then turns to face the onlookers
  const stepOut = walk(f, L.carStop - 250 * L.carScale, L.majid.x, b.park + sec(0.2), sec(0.55), 30);
  const majid = {
    look: CAST.majid, id: `hk-m-${ratio}`, seed: 1, x: stepOut.x, y: L.majid.y, scale: L.majid.s, add: stepOut.add, facing: [N(0, -1), N(b.park + sec(0.78), 1, 1)],
    pose: [P(0, 'stand'), P(b.park + sec(0.8), 'holdUp', { headTurn: 0.7 }, 16), P(b.but, 'proud', { headTurn: 0.8 }, 18)],
    face: [F(0, 'smile', { gx: 0.6 }), F(b.park + sec(0.8), 'proud', { gx: 1 }), F(b.turn + sec(0.2), 'proud', { gx: 1, gy: -0.1 }), F(b.imagine, 'proud', { gx: 1, mouth: 0.9 })],
    holdF: f > b.park + sec(0.7) && f < b.but + sec(0.15) ? <Keys color={C.teal} swing={Math.sin(f / 7) * 14} /> : undefined, o: out,
  };

  return (
    <Frame ratio={ratio} c={c} o={o} world={<>
      <ParkingSet dim={dim} sway={Math.sin(f / 70) * 3} />
      <Car id={`hk-park-${ratio}`} kind="new" color={C.plum} shade={C.plumDeep} glass={C.glass} x={L.people[2].x + 430} y={GROUND - 20} scale={0.9} facing={-1} />
      {WHO.map((w, k) => {
        const p = L.people[k];
        const look = f >= b.turn + k * sec(0.12);
        return <Actor key={w} f={f} d={{
          look: CAST[w], id: `hk-${w}-${ratio}`, seed: 3 + k, x: p.x, y: p.y, scale: p.s,
          facing: k === 0 && !look ? 1 : -1,
          pose: [P(0, k === 1 ? 'cross' : 'stand', { headTurn: k === 0 ? 0.6 : 0.4 }), P(b.turn + k * sec(0.12), k === 1 ? 'cross' : 'stand', { headTurn: 0.9, lean: -2 }, 10)],
          face: [F(0, 'smile', { gx: k === 0 ? 1 : 0.6 }), F(b.turn + k * sec(0.12), 'surprised', { gx: 1 }, 8), F(b.think, 'dreamy', { gx: 0.4 }, 18)],
        }} />;
      })}
      {/* the moment they notice: three small strokes above each head */}
      {WHO.map((w, k) => {
        const p = L.people[k];
        const t = f - (b.turn + k * sec(0.12));
        const o2 = t < 0 ? 0 : Math.min(1, t / sec(0.12)) * (1 - prog(f, b.turn + k * sec(0.12) + sec(0.6), sec(0.3)));
        if (o2 <= 0) return null;
        const hx = p.x, hy = p.y - 400 * p.s;
        return <g key={w} opacity={o2} stroke={INK} strokeWidth={5} strokeLinecap="round">
          {[-125, -95, -65].map((a2) => {
            const r1 = 58 * p.s + 6 * Math.min(1, t / sec(0.2)), r2 = r1 + 20;
            const ca = Math.cos((a2 * Math.PI) / 180), sa = Math.sin((a2 * Math.PI) / 180);
            return <path key={a2} d={`M${hx + ca * r1} ${hy + sa * r1} L${hx + ca * r2} ${hy + sa * r2}`} />;
          })}
        </g>;
      })}
      {majid.o > 0 && <Actor f={f} d={majid} />}
      {/* speed lines while the car is still moving */}
      {arrive > 0.02 && arrive < 0.98 && [0.38, 0.6, 0.8].map((h, k) => (
        <path key={k} d={`M${carX - 300 * L.carScale - 30 - k * 40} ${L.carY - h * 170 * L.carScale} l${-150 - k * 50} 0`}
          stroke={C.light} strokeWidth={7} strokeLinecap="round" opacity={0.55 * Math.sqrt(1 - arrive)} />
      ))}
      <Car id={`hk-car-${ratio}`} kind="new" color={C.pearl} shade={C.pearlShade} glass={C.glass}
        x={carX} y={L.carY + settle} scale={L.carScale} shine={shine} wheelTurn={carX * 0.9} driver={driver || undefined} />
      {WHO.map((w, k) => {
        const p = L.people[k];
        const pop = prog(f, b.think + k * sec(0.18), sec(0.45), ease.back);
        const [bx, by] = L.bubbles[k];
        const dreamt = prog(f, b.imagine, sec(0.6), ease.out);
        const s2 = driverSeat('new');
        return (
          <Bubble key={w} id={`hk-b-${w}-${ratio}`} x={bx} y={by} w={L.bw} h={L.bh} tail={[p.x - 8, p.y - 395 * p.s]} pop={pop}>
            <Car id={`hk-bc-${w}-${ratio}`} kind="new" color={C.pearl} shade={C.pearlShade} glass={C.glass}
              x={-40 * (L.bw / 190)} y={136 * (L.bw / 190) + L.bh * 0.04} scale={L.bw / 190}
              shine={(f - b.imagine) / sec(1.1)}
              driver={<Person id={`hk-bd-${w}-${ratio}`} look={CAST[w]} pose={pose('seated', { headTurn: 0.35 })}
                face={face(dreamt > 0.5 ? 'grin' : 'smile', { gx: 0.5 })} {...s2} />} />
            {dreamt > 0 && [[-0.36, -0.25], [0.32, -0.3], [0.4, 0.05]].map(([sx, sy], j) => (
              <path key={j} transform={`translate(${sx * L.bw} ${sy * L.bh}) scale(${dreamt * (0.9 + 0.2 * Math.sin(f / 9 + j))})`}
                d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z" fill={C.teal} />
            ))}
          </Bubble>
        );
      })}
    </>} />
  );
};

export const hookCam = (ratio: Ratio) => LAYOUT[ratio].cam;
