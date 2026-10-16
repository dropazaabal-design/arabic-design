import React from 'react';
import { Bubble, Car, Keys, Person, driverSeat, face, pose, walk, type Look } from '../../../../motion-core/src/cartoon';
import { Notice, Strike, Tag } from '../graphics';
import { GROUND, HotelSet, ParkingSet } from '../sets';
import { Actor, F, Frame, P, by, camMix, type Cam, type Ratio } from '../stage';
import { C, CAST } from '../theme';
import { ease, life, prog, sec } from '../time';

// E4 (L4), from the book: young Housel parks guests' cars at a hotel, dreams of owning one so
// people would see him as a success, then catches what he really pictured: never the owner,
// always himself behind the wheel. The mirror shot (also R2 in the reel) shows the paradox:
// the looker sees herself in the car's window, not its owner.

const HOTEL_GROUND = 900;
const LUX = { color: '#3C5A8C', shade: '#2B4470' }; // the guest's car: deep steel blue

export type ValetBeats = {
  start: number; every: number; arrive: number; dream: number; noticed: number; rarely: number; owner: number; cool: number;
  himself: number; people: number; name: number; end: number;
};

/** The car's front window filling a w × h box (bubble or inset), a driver showing through it. */
export const WindowShot: React.FC<{ id: string; w: number; h: number; color: string; shade: string; who: Look; mood: Parameters<typeof face>[0]; shine?: number; facing?: 1 | -1; reflect?: boolean }> = ({ id, w, h, color, shade, who, mood, shine = -1, facing = 1, reflect }) => {
  const s = w / 190;
  return (
    <Car id={id} kind="new" color={color} shade={shade} glass={C.glass} x={-40 * s * facing} y={136 * s + h * 0.04} scale={s} facing={facing} shine={shine}
      driver={<g>
        <Person id={`${id}-d`} look={who} pose={pose('seated', { headTurn: 0.35 })} face={face(mood, { gx: 0.5 })} {...driverSeat('new')} facing={reflect ? -1 : 1} />
        {reflect && <path d="M-60 -160 L-30 -160 L-80 -100 L-110 -100 Z M0 -160 L14 -160 L-36 -100 L-50 -100 Z" fill="#FFFFFF" opacity={0.25} />}
      </g>} />
  );
};

export const Valet: React.FC<{ f: number; k: ValetBeats; ratio: Ratio }> = ({ f, k, ratio }) => {
  const V = ratio !== '16x9';
  const carStop = 1190;
  const arrive = prog(f, k.every, k.arrive - k.every + sec(0.5), ease.out);
  const carX = carStop + 1300 * (1 - arrive);
  const out = k.arrive + sec(0.6), give = k.arrive + sec(1.4), take = give + sec(0.5), leave = take + sec(0.5);
  const guestWalk = walk(f, 1060, 960, leave, sec(1.3), 32);
  const valetWalk = walk(f, V ? 820 : 700, V ? 880 : 790, out, sec(0.8), 30);
  const valetX = valetWalk.x;
  const head: [number, number] = [valetX, HOTEL_GROUND - 400 * 0.95];
  const dream = prog(f, k.dream, sec(0.5), ease.back) * (1 - prog(f, k.noticed - sec(0.15), sec(0.3)));
  const second = prog(f, k.rarely, sec(0.5), ease.back);
  const swap = f >= k.himself;
  const strike = prog(f, k.cool, sec(0.35));
  const dimTitle = prog(f, k.name, sec(0.6));
  const base: Cam = by(ratio, { x: 960, y: 560, z: 1.05 }, { x: 980, y: 520, z: 1.06 }, { x: 980, y: 560, z: 0.96 });
  const near: Cam = by(ratio, { x: 900, y: 520, z: 1.25 }, { x: 900, y: 470, z: 1.15 }, { x: 900, y: 520, z: 1.05 });
  // a slow push while he waits for the cars, so the wait never reads as a frozen frame
  const wait = prog(f, k.start, Math.max(1, k.dream - k.start), (x) => x);
  const c = camMix({ ...base, z: base.z * (1 + 0.06 * wait), x: base.x - 40 * wait }, near, prog(f, k.dream - sec(0.4), sec(1.2), ease.inOut));
  const bx = by(ratio, 540, 700), by_ = by(ratio, 340, 200, 250), bw = by(ratio, 420, 440), bh = by(ratio, 300, 310);
  return (
    <Frame ratio={ratio} c={c} world={<>
      <HotelSet glow={1} />
      {/* the guest arrives, steps out, hands over the keys and walks into the hotel */}
      {f >= out && f < leave + sec(1.3) && <Actor f={f} d={{
        look: CAST.guest, id: `v-g-${ratio}`, seed: 21, x: f < leave ? 1060 : guestWalk.x, y: HOTEL_GROUND, scale: 0.92, add: guestWalk.add, facing: -1,
        o: 1 - prog(f, leave + sec(0.8), sec(0.5)),
        pose: [P(0, 'stand'), P(give - sec(0.2), 'holdUp', { shF: 80, elF: 30 }, 10), P(take + sec(0.1), 'stand', {}, 12)],
        face: [F(0, 'calm', { gx: 1 }), F(give, 'smile', { gx: 1 })],
        holdF: f < take ? <Keys color={C.plum} /> : undefined,
      }} />}
      <Car id={`v-car-${ratio}`} kind="new" color={LUX.color} shade={LUX.shade} glass={C.glass} x={carX} y={HOTEL_GROUND + 5} scale={1.1} facing={-1}
        lights={1 - arrive * 0.6} shine={(f - k.arrive) / sec(1)} wheelTurn={-carX}
        driver={f < out ? <Person id={`v-gd-${ratio}`} look={CAST.guest} pose={pose('seated', { headTurn: 0.3 })} face={face('calm', { gx: 0.4 })} {...driverSeat('new')} /> : undefined} />
      <Actor f={f} d={{
        look: CAST.valet, id: `v-v-${ratio}`, seed: 22, x: valetX, y: HOTEL_GROUND, scale: 0.95, add: valetWalk.add, facing: 1,
        pose: [P(0, 'stand', { headTurn: 0.5 }), P(k.arrive, 'stand', { headTurn: 0.9, lean: -2 }, 10), P(give, 'holdUp', { shF: 70, elF: 20 }, 10),
          P(take + sec(0.3), 'holdUp', { shF: 40, elF: 60 }, 14), P(k.dream, 'stand', { headTurn: 0.4, headTilt: -8 }, 16),
          P(k.noticed, 'think', {}, 12), P(k.himself, 'scratch', {}, 14), P(k.name - sec(0.3), 'stand', { headTurn: 0.2 }, 16)],
        face: [F(0, 'calm', { gx: 1 }), F(k.arrive, 'surprised', { gx: 1 }, 8), F(k.arrive + sec(0.5), 'smile', { gx: 1 }, 10),
          F(k.dream, 'dreamy', {}, 14), F(k.noticed, 'thinking', {}, 10), F(k.himself, 'embarrassed', { gx: 0.4, gy: -0.3 }, 12),
          F(k.himself + sec(1.2), 'smile', { gx: 0.4, gy: -0.3 }, 14)],
        holdF: f >= take && f < k.dream ? <Keys color={C.plum} swing={Math.sin(f / 6) * 12} /> : undefined,
      }} />
      <Notice x={head[0]} y={head[1] - 10} r={58} t={f - k.noticed} len={sec(0.9)} />
      {/* first dream: himself at the wheel, people cheering */}
      {dream > 0 && <Bubble id={`v-b1-${ratio}`} x={bx} y={by_} w={bw} h={bh} tail={[head[0] - 10, head[1] - 20]} pop={dream}>
        <WindowShot id={`v-b1c-${ratio}`} w={bw} h={bh} color={LUX.color} shade={LUX.shade} who={CAST.valet} mood="grin" shine={(f - k.dream) / sec(1.2)} />
        {[[-0.36, -0.25], [0.32, -0.3], [0.4, 0.05]].map(([sx, sy], j) => (
          <path key={j} transform={`translate(${sx * bw} ${sy * bh}) scale(${0.9 + 0.2 * Math.sin(f / 9 + j)})`} d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z" fill={C.teal} />
        ))}
      </Bubble>}
      {/* what he rarely thought (the owner is cool), and what he did think (I would be) */}
      {second > 0 && <Bubble id={`v-b2-${ratio}`} x={bx} y={by_} w={bw} h={bh} tail={[head[0] - 10, head[1] - 20]} pop={second * (1 - dimTitle)}>
        <WindowShot id={`v-b2c-${ratio}`} w={bw} h={bh} color={LUX.color} shade={LUX.shade} who={swap ? CAST.valet : CAST.guest} mood={swap ? 'proud' : 'calm'} />
        <Tag x={bw * 0.2} y={-bh * 0.3} text="رائع" color={swap ? C.green : C.blue} size={38} o={prog(f, k.owner, sec(0.3))} />
        {!swap && <Strike x={bw * 0.2} y={-bh * 0.3} w={140} grow={strike} />}
        {swap && f >= k.people && [[-0.38, -0.2], [0.42, 0.1]].map(([sx, sy], j) => (
          <path key={j} transform={`translate(${sx * bw} ${sy * bh}) scale(${0.9 + 0.2 * Math.sin(f / 9 + j)})`} d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z" fill={C.teal} />
        ))}
      </Bubble>}
      {dimTitle > 0 && <rect x={-800} y={-600} width={3600} height={2400} fill={C.night} opacity={0.55 * dimTitle} />}
    </>} />
  );
};

export type MirrorBeats = { start: number; proud: number; look: number; see: number; notUs?: number; end: number };

/** The paradox in one picture: the owner stands proud by his car; a passer-by stops, bends to the
 * window and sees herself in it. Hotel at night (episode) or the office car park (reel). */
export const Mirror: React.FC<{ f: number; k: MirrorBeats; ratio: Ratio; place: 'hotel' | 'parking' }> = ({ f, k, ratio, place }) => {
  const hotel = place === 'hotel';
  const g = hotel ? HOTEL_GROUND : GROUND + 30;
  const car = hotel ? { ...LUX, x: 1060 } : { color: C.pearl, shade: C.pearlShade, x: 1000 };
  const owner = hotel ? CAST.valet : CAST.majid;
  const lookerWalk = walk(f, 1900, car.x + 330, k.start + sec(0.2), Math.max(sec(0.6), k.look - k.start - sec(0.2)), 34);
  const bend = prog(f, k.look, sec(0.5), ease.inOut);
  const see = prog(f, k.see, sec(0.6), ease.inOut);
  const base: Cam = by(ratio, { x: 1000, y: 620, z: 1.25 }, { x: car.x, y: 760, z: 1.2 }, { x: car.x, y: 700, z: 1.1 });
  const near: Cam = by(ratio, { x: car.x + 80, y: 600, z: 1.5 }, { x: car.x, y: 720, z: 1.3 }, { x: car.x, y: 680, z: 1.2 });
  const inset = { x: car.x - by(ratio, 160, 40), y: g - by(ratio, 470, 560), r: by(ratio, 125, 150) };
  const c = camMix(base, near, prog(f, k.see - sec(0.3), sec(1.1), ease.inOut));
  const fall = k.notUs ?? k.see + sec(0.6); // the owner sees it is not about him
  return (
    <Frame ratio={ratio} c={c} world={<>
      {hotel ? <HotelSet glow={1} /> : <ParkingSet sway={Math.sin(f / 70) * 3} />}
      <Actor f={f} d={{
        look: owner, id: `mi-o-${ratio}`, seed: 31, x: car.x - by(ratio, 420, 330), y: g, scale: 0.95, facing: 1,
        pose: [P(0, 'stand', { headTurn: 0.6 }), P(k.proud, 'proud', { headTurn: 0.8 }, 16), P(fall, 'stand', { headTurn: 0.9 }, 14)],
        face: [F(0, 'smile', { gx: 1 }), F(k.proud, 'proud', { gx: 1 }, 12), F(fall - sec(0.4), 'surprised', { gx: 1 }, 8), F(fall, 'worried', { gx: 1, mouth: -0.2 }, 14)],
      }} />
      <Car id={`mi-car-${ratio}`} kind="new" color={car.color} shade={car.shade} glass={C.glass} x={car.x} y={g + 5} scale={1.1}
        shine={((f - k.proud) % sec(3)) / sec(1.3)}
/>
      <Actor f={f} d={{
        look: CAST.noura, id: `mi-l-${ratio}`, seed: 32, x: lookerWalk.x, y: g + 8, scale: 0.92, add: lookerWalk.add, facing: -1,
        pose: [P(0, 'stand'), P(k.look, 'stand', { lean: 14 * bend, headTilt: 10, headTurn: 0.4 }, 14), P(k.see, 'stand', { lean: 14, headTilt: 12, shN: 20, elN: 120 }, 14)],
        face: [F(0, 'calm', { gx: 1 }), F(k.look, 'surprised', { gx: 1, gy: 0.4 }, 10), F(k.see, 'dreamy', { gx: 1, gy: 0.4 }, 16)],
      }} />
      {/* a magnifier on the window: what she sees there is herself */}
      {see > 0 && <g opacity={see}>
        <path d={`M${car.x - 70} ${g - 150} L${inset.x - inset.r * 0.7} ${inset.y + inset.r * 0.7} M${car.x + 60} ${g - 150} L${inset.x + inset.r * 0.7} ${inset.y + inset.r * 0.7}`} stroke={C.light} strokeWidth={3} opacity={0.6} />
        <g transform={`translate(${inset.x} ${inset.y}) scale(${0.85 + 0.15 * see})`}>
          <clipPath id={`mi-in-${ratio}`}><circle r={inset.r} /></clipPath>
          <circle r={inset.r} fill={C.haze} />
          <g clipPath={`url(#mi-in-${ratio})`}><WindowShot id={`mi-ws-${ratio}`} w={inset.r * 2} h={inset.r * 2} color={car.color} shade={car.shade} who={CAST.noura} mood="dreamy" reflect /></g>
          <circle r={inset.r} fill="none" stroke={C.light} strokeWidth={6} />
        </g>
      </g>}
    </>} />
  );
};
