import React from 'react';
import { Bubble, Car, INK, Jar, Note, Person, Phone, driverSeat, face, pose, walk } from '../../../../motion-core/src/cartoon';
import { Bar, Eye, Months, Say, Tag } from '../graphics';
import { GROUND, ParkingSet, StageSet } from '../sets';
import { Actor, F, Frame, N, P, type Cam, type Ratio } from '../stage';
import { C, CAST } from '../theme';
import { ease, life, mixColor, prog, sec, type Timing } from '../time';

// E3 (L3): two months earlier. Majid parks his old car among shiny ones and feels it speaks for
// him; a bonus arrives; he decides; the down payment empties his savings; the instalment takes a
// third of his salary for five years; for a week he reads every glance as admiration for him.

const OLD = { color: '#5D8796', shade: '#476B78' }; // Majid's old car: faded sea blue

export const Want: React.FC<{ f: number; T: Timing; ratio: Ratio }> = ({ f, T, ratio }) => {
  const V = ratio !== '16x9';
  const s0 = T.segStart('L3');
  const k = {
    park: T.at('L3', 7, 'يوقّف'), speak: T.at('L3', 15, 'تتكلم'), speakEnd: T.at('L3', 19, 'يتكلم'),
    feel: T.at('L3', 20, 'وهذا'), arrived: T.at('L3', 27, 'وصلنا'), bonus: T.at('L3', 29, 'مكافأة'), decide: T.at('L3', 30, 'فقرر'),
    pay: T.at('L3', 33, 'دفع'), rest: T.at('L3', 37, 'والباقي'), third: T.at('L3', 40, 'ثلث'), five: T.at('L3', 42, 'لخمس'),
    week: T.at('L3', 44, 'وأول'), eyes: T.at('L3', 49, 'يلمح'), admire: T.at('L3', 54, 'إعجاب'), end: T.segEnd('L3'),
  };
  // three shots: the car park (s0 → pay), the stage for money (pay → week), the week of glances
  if (f < k.pay) return <ParkShot f={f} k={k} s0={s0} ratio={ratio} V={V} />;
  if (f < k.week) return <MoneyShot f={f} k={k} ratio={ratio} V={V} />;
  return <GlanceShot f={f} k={k} ratio={ratio} V={V} />;
};

type K = Record<string, number>;

const ParkShot: React.FC<{ f: number; k: K; s0: number; ratio: Ratio; V: boolean }> = ({ f, k, s0, ratio, V }) => {
  const carStop = V ? 1260 : 760;
  const arrive = prog(f, s0, k.park - s0 + sec(0.4), ease.out);
  const carX = carStop - 1300 * (1 - arrive);
  const outAt = k.park + sec(0.5);
  const spot = V ? 960 : 430;
  const step = walk(f, carStop - 260, spot, outAt, sec(0.6), 30);
  // close on Majid for the feeling and the bonus
  const close = prog(f, k.feel - sec(0.2), sec(0.9), ease.inOut);
  const base: Cam = V ? { x: 1180, y: 700, z: 1.2 } : { x: 960, y: 600, z: 1.05 };
  const near: Cam = V ? { x: 1040, y: 600, z: 1.7 } : { x: 560, y: 600, z: 1.7 };
  const c: Cam = { x: base.x + (near.x - base.x) * close, y: base.y + (near.y - base.y) * close, z: base.z + (near.z - base.z) * close };
  const phoneUp = f >= k.bonus - sec(0.5);
  const speech = life(f, k.speak - sec(0.1), k.speakEnd + sec(0.5));
  const dream = prog(f, k.decide, sec(0.5), ease.back);
  const out = f >= outAt;
  return (
    <Frame ratio={ratio} c={c} world={<>
      <ParkingSet sway={Math.sin(f / 70) * 3} />
      <Car id={`w-a-${ratio}`} kind="new" color={C.plum} shade={C.plumDeep} glass={C.glass} x={carStop + 660} y={GROUND} scale={1.05} facing={-1} />
      <Car id={`w-b-${ratio}`} kind="new" color={C.pearl} shade={C.pearlShade} glass={C.glass} x={carStop - 700} y={GROUND} scale={1.05} />
      {out && <Actor f={f} d={{
        look: CAST.majid, id: `w-m-${ratio}`, seed: 1, x: step.x, y: 968, scale: 0.95, add: step.add,
        facing: [N(0, -1), N(outAt + sec(0.65), 1, 1)],
        pose: [P(0, 'stand'), P(outAt + sec(0.7), 'stand', { headTurn: 0.8 }), P(k.speak, 'scratch', { headTurn: 0.6 }, 12), P(k.feel, 'slump', { headTurn: 0.3 }, 20),
          P(k.arrived - sec(0.4), 'stand', { headTurn: 0.2, headTilt: -6 }, 20), P(k.bonus - sec(0.5), 'phone', {}, 12), P(k.decide, 'point', { headTurn: 0.7 }, 12)],
        face: [F(0, 'calm'), F(outAt + sec(0.7), 'worried', { gx: 1, gy: 0.3 }), F(k.speak, 'embarrassed', {}, 10), F(k.feel, 'sad', { gx: 0, gy: 0.4 }, 16),
          F(k.arrived - sec(0.4), 'dreamy', { gx: 0, gy: -0.8 }, 18), F(k.bonus - sec(0.5), 'calm', { gx: 0.4, gy: 0.8 }), F(k.bonus, 'surprised', { gx: 0.4, gy: 0.6 }, 6),
          F(k.bonus + sec(0.6), 'grin', {}, 10), F(k.decide, 'determined', { gx: 1 }, 10)],
        farInFront: phoneUp && f < k.decide, handF: f >= k.decide ? 'point' : 'fist',
        holdF: phoneUp && f < k.decide ? <Phone scale={0.62} screen={f >= k.bonus ? <BonusCard o={prog(f, k.bonus, sec(0.3))} /> : undefined} /> : undefined,
      }} />}
      <Car id={`w-old-${ratio}`} kind="old" color={OLD.color} shade={OLD.shade} glass={C.glass} x={carX} y={GROUND + 6} scale={1.08}
        wheelTurn={carX} driver={!out ? <Person id={`w-drv-${ratio}`} look={CAST.majid} pose={pose('seated')} face={face('calm', { gx: 0.5 })} {...driverSeat('old')} /> : undefined} />
      {/* the old car "speaks for him": a speech balloon with an ellipsis that keeps going */}
      {speech > 0 && <g opacity={speech} transform={`translate(${carStop + 120} ${GROUND - 300})`}>
        <path d="M-90 -50 Q-90 -80 -60 -80 L60 -80 Q90 -80 90 -50 L90 0 Q90 30 60 30 L-10 30 L-40 66 L-36 30 L-60 30 Q-90 30 -90 0 Z" fill={C.paper} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {[0, 1, 2].map((j) => <circle key={j} cx={-40 + j * 40} cy={-25} r={10 + 3 * Math.sin(f / 6 - j)} fill={INK} />)}
      </g>}
      {dream > 0 && <Bubble id={`w-dream-${ratio}`} x={spot + 250} y={330} w={360} h={250} tail={[spot + 30, 560]} pop={dream}>
        <Car id={`w-dc-${ratio}`} kind="new" color={C.pearl} shade={C.pearlShade} glass={C.glass} y={70} scale={0.6} shine={(f - k.decide) / sec(1)} />
      </Bubble>}
    </>} />
  );
};

const BonusCard: React.FC<{ o: number }> = ({ o }) => (
  <g opacity={o}>
    <rect x={-25} y={-30} width={50} height={46} rx={8} fill={C.green} stroke={INK} strokeWidth={2.5} />
    <path d="M-10 -8 L-2 0 L12 -16" stroke={C.light} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x={-20} y={22} width={40} height={6} rx={3} fill="#9FB3C7" />
  </g>
);

const MoneyShot: React.FC<{ f: number; k: K; ratio: Ratio; V: boolean }> = ({ f, k, ratio, V }) => {
  const c: Cam = V ? { x: 960, y: 640, z: 0.95 } : { x: 960, y: 540, z: 1 };
  // the down payment: notes leave the jar and land in the car
  const pour = prog(f, k.pay + sec(0.2), sec(1.4), ease.inOut);
  const jar = { x: V ? 760 : 560, y: V ? 520 : 470 }, car = { x: V ? 1180 : 1360, y: V ? 520 : 470 };
  const barIn = prog(f, k.rest, sec(0.5), ease.out);
  const third = prog(f, k.third, sec(0.6), ease.out);
  const months = prog(f, k.five, sec(1.6), ease.inOut) * 60;
  const barY = V ? 760 : 640, barX = 560, barW = 800;
  return (
    <Frame ratio={ratio} c={c} world={<>
      <StageSet />
      <g transform={`translate(${jar.x} ${jar.y})`}><Jar level={0.85 * (1 - pour)} note={C.mint} noteShade={C.teal} /></g>
      <Say x={jar.x} y={jar.y + 50} size={34} color={C.mist}>مدخراته</Say>
      <g transform={`translate(${car.x} ${car.y})`}><Car id={`m-car-${ratio}`} kind="new" color={C.pearl} shade={C.pearlShade} glass={C.glass} scale={0.72} /></g>
      {pour > 0 && pour < 1 && [0, 1, 2, 3, 4].map((j) => {
        const t = Math.max(0, Math.min(1, pour * 1.6 - j * 0.15));
        if (t <= 0 || t >= 1) return null;
        const x = jar.x + (car.x - jar.x) * t, y = jar.y - 200 - Math.sin(Math.PI * t) * 160;
        return <g key={j} transform={`translate(${x} ${y})`}><Note color={C.mint} shade={C.teal} rot={t * 160 + j * 30} scale={0.7} /></g>;
      })}
      <Tag x={car.x} y={car.y + 60} text="مقدّمًا" color={C.blue} size={34} o={prog(f, k.pay + sec(0.9), sec(0.4))} />
      {barIn > 0 && <g opacity={barIn} transform={`translate(0 ${(1 - barIn) * 20})`}>
        <Say x={barX + barW + 90} y={barY + 40} size={36} color={C.mist}>الراتب</Say>
        <Bar x={barX} y={barY} w={barW} h={80} labelSize={34} segs={[
          { frac: 1 / 3, color: mixColor('#3E6C8F', C.red, third), label: third > 0.5 ? 'القسط' : undefined },
          { frac: 2 / 3, color: '#3E6C8F' },
        ]} />
      </g>}
      {months > 0 && <g>
        <Months x={V ? 300 : 1460 - 12 * 34} y={V ? 900 : 790} cell={V ? 40 : 34} filled={months} color={C.red} />
        <Tag x={V ? 300 + 12 * 20 : 1460 - 6 * 34} y={V ? 1150 : 990} text="5 سنين" color={C.red} size={32} o={prog(f, k.five + sec(0.4), sec(0.4))} />
      </g>}
    </>} />
  );
};

const GlanceShot: React.FC<{ f: number; k: K; ratio: Ratio; V: boolean }> = ({ f, k, ratio, V }) => {
  // Majid drives slowly past people; eyes pop up toward the car; his own bubble shows applause for him
  const t = (f - k.week) / Math.max(1, k.end - k.week);
  const carX = V ? 1250 : 900 + 120 * t;
  const c: Cam = V ? { x: 1250, y: 720, z: 1.2 } : { x: 960, y: 600, z: 1.05 };
  const people = V ? [{ w: 'young', x: 900 }, { w: 'noura', x: 1600 }] : [{ w: 'young', x: 300 }, { w: 'noura', x: 1500 }, { w: 'elder', x: 1700 }];
  const admire = prog(f, k.admire - sec(0.2), sec(0.5), ease.back);
  return (
    <Frame ratio={ratio} c={c} world={<>
      <ParkingSet sway={Math.sin(f / 70) * 3} />
      {people.map((p, j) => (
        <Actor key={p.w} f={f} d={{
          look: CAST[p.w], id: `g-${p.w}-${ratio}`, seed: 10 + j, x: p.x, y: 905, scale: 0.82, facing: p.x < carX ? 1 : -1,
          pose: [P(0, 'stand', { headTurn: 0.8 })], face: [F(0, 'calm', { gx: 1 }), F(k.eyes + j * sec(0.2), 'surprised', { gx: 1 }, 8), F(k.eyes + sec(0.8), 'calm', { gx: 1 }, 14)],
        }} />
      ))}
      <Car id={`g-car-${ratio}`} kind="new" color={C.pearl} shade={C.pearlShade} glass={C.glass} x={carX} y={GROUND + 10} scale={1.15} shine={((f - k.week) % sec(2.5)) / sec(1.2)} wheelTurn={carX}
        driver={<Person id={`g-drv-${ratio}`} look={CAST.majid} pose={pose('seated', { headTurn: 0.6 })} face={face(f >= k.admire ? 'proud' : 'smile', { gx: 0.9 })} {...driverSeat('new')} />} />
      {people.map((p, j) => <Eye key={j} x={p.x + (carX - p.x) * 0.35} y={560 - j * 30} s={0.8 * prog(f, k.eyes + j * sec(0.2), sec(0.3), ease.back)} o={1 - prog(f, k.admire, sec(0.4))} />)}
      {admire > 0 && <Bubble id={`g-b-${ratio}`} x={carX + 60} y={V ? 330 : 300} w={420} h={270} tail={[carX + 40, GROUND - 230]} pop={admire}>
        {[-135, 135].map((x, j) => (
          <Person key={j} id={`g-clap-${j}-${ratio}`} look={CAST[(['noura', 'young'] as const)[j]]} pose={pose('cheer')} face={face('grin')} x={x} y={160} scale={0.4} facing={j ? -1 : 1} />
        ))}
        <Person id={`g-hero-${ratio}`} look={CAST.majid} pose={pose('proud')} face={face('proud')} x={0} y={135} scale={0.46} />
      </Bubble>}
    </>} />
  );
};
