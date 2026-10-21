import React from 'react';
import { Bubble, pose, walk } from '../../../../motion-core/src/cartoon';
import { reach, SvgPerson } from '../../../../motion-core/src/characters/SvgPerson';
import {
  AlarmClock, Bedroom, Blanket, CLOCK_AT, Crumple, MARKER_TIP, Marker, NIGHTSTAND_TOP, NIGHTSTAND_X, NOTE_AT, SEAT_X, ShoeBox, WallNote,
} from '../props';
import { Actor, F, Frame, Lying, camMix, follow, lyingChar, toChar, type Cam } from '../stage';
import { C, SULTAN } from '../theme';
import { ease, life, mix, prog, sec } from '../time';

const S = 1.75;
const BOX = { x: NIGHTSTAND_X + 10, y: NIGHTSTAND_TOP, w: 220, h: 96 };
const sin = Math.sin;

/** The pair of notes on the wall: the plan, then the bigger plan stuck over it. */
const Notes: React.FC<{ plan: number; planSub: number; strike1: number; big: number; strike2?: number; small?: number }> = ({ plan, planSub, strike1, big, strike2 = 0, small = 0 }) => (
  <g transform={`translate(${NOTE_AT[0]} ${NOTE_AT[1]})`}>
    {plan > 0 && <g><WallNote id="n1" text="ساعة كل يوم" write={plan} strike={strike1} />
      {planSub > 0 && <g transform="translate(0 62)"><clipPath id="n1s"><rect x={110 - 220 * planSub} y={-30} width={220 * planSub} height={50} /></clipPath>
        <text clipPath="url(#n1s)" x={0} y={0} textAnchor="middle" fontFamily="Tajawal, sans-serif" fontWeight={800} fontSize={40} fill={C.mist} direction="rtl">5:30 الفجر</text></g>}</g>}
    {big > 0 && <g transform="translate(70 -70)"><WallNote id="n2" w={330} rot={5} text="بكرة ساعتين!" write={big} strike={strike2} /></g>}
    {small > 0 && <g transform="translate(-10 250)"><WallNote id="n3" w={300} rot={-2} text="ألبس الحذاء" write={small} color={C.shoeShade} /></g>}
  </g>
);

/** Writing on the wall: the marker tip runs right to left along a line of the note, with a hand's small wobble. */
const writeAt = (X: number, line: [number, number], from: number, dur: number, wide = 150) => (f: number): [number, number] => {
  const p = Math.min(1, Math.max(0, (f - from) / dur));
  const tc = toChar(X, 0, S);
  const [cx, cy] = tc([NOTE_AT[0] + line[0] + wide / 2 - wide * p + 5 * sin(f * 0.9), NOTE_AT[1] + line[1] + 6 * sin(f * 1.7)]);
  return [cx - MARKER_TIP[0], cy - MARKER_TIP[1]];
};

// ——— R1 · the box, a month on ———
export type HookBeats = { start: number; month: number; shame: number; box: number; end: number };
export const Hook: React.FC<{ f: number; k: HookBeats }> = ({ f, k }) => {
  const seated = reach(reach(pose('seated', { headTurn: 0.55 }), 'N', [58, -84], 'open'), 'F', [70, -86], 'open');
  const pull = prog(f, k.start + sec(0.9), k.month - k.start, ease.inOut);
  const c: Cam = camMix({ x: 30, y: -470, z: 2.1 }, { x: -60, y: -470, z: 1.55 }, pull);
  return (
    <Frame c={{ ...c, z: c.z * (1 + 0.012 * (f - k.start) / sec(4)) }} bg={C.bg} world={<>
      <Bedroom calDay={Math.round(30 * prog(f, k.month, k.shame + sec(0.3) - k.month, ease.inOut))} />
      <g transform={`translate(${BOX.x} ${BOX.y})`}>
        <ShoeBox w={BOX.w} h={BOX.h} dust={1} f={f} />
        {/* the price tag still on the box */}
        <g transform={`translate(${BOX.w / 2 - 20} ${-BOX.h + 30}) rotate(${12 + 4 * sin(f / 20)})`}>
          <path d="M0 0 L8 40" stroke={C.ink} strokeWidth={3} />
          <path d="M-14 40 L30 40 L30 92 L-14 92 Z" fill={C.paper} stroke={C.ink} strokeWidth={4} />
          <path d="M-4 56 L20 56 M-4 70 L14 70 M-4 82 L20 82" stroke={C.red} strokeWidth={5} strokeLinecap="round" />
        </g>
      </g>
      <Actor f={f} d={{
        look: SULTAN, id: 'hook', seed: 3, x: SEAT_X, y: 0, scale: S, facing: 1,
        pose: [
          { at: 0, to: { ...seated, lean: 3, headTurn: 0.95, headTilt: 5 } },
          { at: k.shame, to: { ...seated, lean: -4, shN: -150, elN: -72, headTilt: -8, headTurn: 0.3 }, dur: sec(0.35) }, // looks away, scratches
          { at: k.box, to: { ...seated, lean: 4, headTurn: 0.8, headTilt: 7 }, dur: sec(0.4) },
        ],
        face: [
          F(0, 'worried', { gx: 1, gy: 0.5 }),
          F(k.shame, 'embarrassed', { gx: -0.8, gy: 0.1 }, sec(0.25)),
          F(k.box, 'worried', { gx: 1, gy: 0.55, sweat: 0.5 }, sec(0.3)),
        ],
        handN: 'open', handF: 'open',
      }} />
    </>} />
  );
};

// ——— R2 · the plan on the wall ———
export type PlanBeats = { start: number; belly: number; write: number; text: number; time: number; proud: number; end: number };
const X_NOTE = -150;
export const Plan: React.FC<{ f: number; k: PlanBeats }> = ({ f, k }) => {
  const tc = toChar(X_NOTE, 0, S);
  const stand = pose('stand', { headTurn: 0.85 });
  const belly = reach({ ...stand, headTurn: 0.5, headTilt: 10, lean: 3 }, 'N', [30, -158], 'open');
  const w1 = { from: k.write + sec(0.15), dur: k.text + sec(1.3) - k.write };
  const w2 = { from: k.time + sec(0.1), dur: k.proud - k.time - sec(0.1) };
  const base = { ...stand, lean: 4 };
  const p = follow(f, [
    { at: 0, to: belly },
    { at: k.belly + sec(0.6), to: reach({ ...belly, headTilt: 4 }, 'N', [18, -170], 'open'), dur: sec(0.3) }, // pats it
    { at: k.belly + sec(0.95), to: belly, dur: sec(0.3) },
    { at: w1.from + w1.dur, to: reach({ ...base, headTilt: -4 }, 'F', writeAt(X_NOTE, [0, 18], 0, 1)(1)), dur: sec(0.3) },
    { at: k.proud, to: pose('proud', { headTurn: 0.55 }), dur: sec(0.45) },
  ], [
    { from: w1.from, to: w1.from + w1.dur, at: (g) => reach({ ...base, shN: -10, elN: 10 }, 'F', writeAt(X_NOTE, [0, 0], w1.from, w1.dur, 190)(g)) },
    { from: w2.from, to: w2.from + w2.dur, at: (g) => reach({ ...base, shN: -10, elN: 10 }, 'F', writeAt(X_NOTE, [0, 50], w2.from, w2.dur, 160)(g)), enter: sec(0.2) },
  ]);
  void tc;
  const c: Cam = camMix({ x: 0, y: -560, z: 1.55 }, { x: 40, y: -540, z: 1.42 }, prog(f, k.start, k.end - k.start, ease.inOut));
  return (
    <Frame c={c} bg={C.bg} world={<>
      <Bedroom calDay={30} sun={0.7} />
      <Notes plan={prog(f, w1.from, w1.dur, (x) => x)} planSub={prog(f, w2.from, w2.dur, (x) => x)} strike1={0} big={0} />
      <g transform={`translate(${BOX.x} ${BOX.y})`}><ShoeBox w={BOX.w} h={BOX.h} dust={1} f={f} /></g>
      <Actor f={f} d={{
        look: SULTAN, id: 'plan', seed: 5, x: X_NOTE, y: 0, scale: S, facing: 1, pose: [{ at: 0, to: p }],
        face: [
          F(0, 'worried', { gx: 0.2, gy: 0.9 }), F(k.belly + sec(0.5), 'determined', { gx: 0.3, gy: 0.8 }, sec(0.3)),
          F(k.write - sec(0.2), 'determined', { gx: 1, gy: 0.05 }, sec(0.25)),
          F(k.text + sec(0.3), 'proud', { gx: 1, gy: 0 }, sec(0.3)),
          F(k.proud, 'grin', { gx: 0.2, gy: -0.1, sparkle: 0.6 }, sec(0.3)),
        ],
        handN: 'open', handF: 'grip', holdF: f >= k.write - sec(0.35) ? <Marker /> : undefined, holdUpright: 'F',
      }} />
    </>} />
  );
};

// ——— R3 · dawn: the alarm, the box, the hour he imagines, back to sleep ———
export type DawnBeats = { start: number; ring: number; slap: number; up: number; look: number; imagine: number; back: number; end: number };
const SD = 1.5; // a little smaller in bed, so he fits it lying flat
const HX = -385, HY = -200;
export const Dawn: React.FC<{ f: number; k: DawnBeats }> = ({ f, k }) => {
  const up = prog(f, k.up, sec(0.55), ease.inOut) * (1 - prog(f, k.back, sec(0.6), ease.inOut));
  const rot = mix(-90, -6, up);
  const lie = pose('stand', { hipF: 6, knF: -10, hipN: 2, knN: -4, headTurn: 0.5, shF: -2, elF: 4, shN: -6, elN: 4 });
  const sitBed = pose('stand', { hipF: 86, knF: -4, hipN: 84, knN: -2, headTurn: 0.85, shF: 30, elF: 30, shN: 25, elN: 30 });
  const lc = lyingChar(HX, HY, -90, SD, 0);
  const slap = reach(lie, 'N', lc([CLOCK_AT[0] + 20, CLOCK_AT[1] - 50]), 'open', -1);
  const ringing = f >= k.ring && f < k.slap + sec(0.05);
  const p = follow(f, [
    { at: 0, to: lie },
    { at: k.slap - sec(0.3), to: slap, dur: sec(0.3) },
    { at: k.slap + sec(0.15), to: lie, dur: sec(0.35) },
    { at: k.up, to: sitBed, dur: sec(0.55) },
    { at: k.look, to: { ...sitBed, headTurn: 0.95, headTilt: 6, lean: 4 }, dur: sec(0.4) },
    { at: k.imagine, to: { ...sitBed, headTurn: 0.7, headTilt: -6, lean: -6, shN: -150, elN: -72 }, dur: sec(0.45) },
    { at: k.back, to: lie, dur: sec(0.6) },
  ]);
  const bubble = life(f, k.imagine + sec(0.15), k.back + sec(0.1), sec(0.4), sec(0.25));
  const pan = prog(f, k.look - sec(0.2), sec(0.9), ease.inOut) * (1 - prog(f, k.back - sec(0.1), sec(0.8), ease.inOut));
  const c: Cam = camMix({ x: -520, y: -340, z: 1.7 }, { x: -130, y: -470, z: 1.62 }, pan);
  const run = walk(f, 0, 0, k.imagine, sec(3), 16); // the hour he pictures: running hard, going nowhere
  const runPose = pose('stand', { headTurn: 0.8, lean: 12, shF: 60, elF: 80, shN: -50, elN: 90 });
  for (const [kk, v] of Object.entries(run.add)) (runPose as Record<string, number>)[kk] += (v as number) * 2.2;
  return (
    <Frame c={c} bg={C.bg} world={<>
      <Bedroom id="dawn" dim={1} calDay={30} light={[mix(-420, -200, pan), mix(-330, -420, pan)]} />
      <g transform={`translate(${CLOCK_AT[0]} ${CLOCK_AT[1]})`}><AlarmClock ring={ringing ? 1 : 0} f={f} /></g>
      <g transform={`translate(${BOX.x} ${BOX.y})`}><ShoeBox w={BOX.w} h={BOX.h} dust={1} f={f} /></g>
      {/* the box catches the first light when he looks at it */}
      <ellipse cx={BOX.x} cy={BOX.y - 50} rx={170} ry={100} fill="#FFFFFF" opacity={0.16 * life(f, k.look, k.back)} />
      <Lying hx={HX} hy={HY} rot={rot} s={SD} sit={0}>
        <Actor f={f} d={{
          look: SULTAN, id: 'dawn', seed: 9, x: 0, y: 0, scale: SD, facing: 1, pose: [{ at: 0, to: p }],
          face: [
            F(0, 'calm', { lid: 1, mouth: 0 }),
            F(k.ring + sec(0.1), 'wince', { lid: 0.8 }, sec(0.15)),
            F(k.up, 'calm', { lid: 0.45, gx: 0.4, gy: 0.2 }, sec(0.3)),
            F(k.look, 'worried', { gx: 1, gy: 0.5, lid: 0.3 }, sec(0.3)),
            F(k.imagine, 'wince', { gx: 0.4, gy: -0.9, sweat: 1 }, sec(0.3)),
            F(k.back, 'relieved', { lid: 1, mouth: 0.3 }, sec(0.4)),
          ],
          handN: f >= k.slap - sec(0.3) && f < k.slap + sec(0.3) ? 'open' : 'fist', handF: 'open',
        }} />
      </Lying>
      <Blanket from={mix(-600, -400, up) - 170 * prog(f, k.back + sec(0.35), sec(0.5))} lift={mix(118, 80, up)} />
      <Bubble id="imagine" x={-150} y={-900} w={470} h={330} tail={[-330, -700]} pop={bubble} fill="#EEF3F9">
        <g transform="translate(-95 110)"><SvgPerson id="mini" look={SULTAN} pose={runPose}
          face={{ brow: 0.8, browY: 0.2, lid: 0.3, lidLow: 0, pupil: 0.8, gx: 1, gy: 0, mouth: -0.6, open: 0.5, wide: 1.1, blush: 0.6, sweat: 1, sparkle: 0 }}
          scale={0.5} feet="runner" handF="fist" handN="fist" /></g>
        <g transform="translate(100 -30)">
          <circle r={62} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          <path d={`M0 0 L${46 * Math.sin(f / 4)} ${-46 * Math.cos(f / 4)}`} stroke={C.red} strokeWidth={6} strokeLinecap="round" />
          <circle r={7} fill={C.ink} />
          <text y={104} textAnchor="middle" fontFamily="Tajawal, sans-serif" fontWeight={800} fontSize={40} fill={C.ink} direction="rtl">60 دقيقة</text>
        </g>
      </Bubble>
    </>} />
  );
};

// ——— R3 · that night: an even bigger plan ———
export type NightBeats = { start: number; strike: number; big: number; proud: number; end: number };
export const Night: React.FC<{ f: number; k: NightBeats }> = ({ f, k }) => {
  const base = pose('stand', { headTurn: 0.85, lean: 4 });
  const st = { from: k.strike, dur: sec(0.45) };
  const wb = { from: k.big, dur: k.proud - k.big };
  const p = follow(f, [
    { at: 0, to: reach(base, 'F', writeAt(X_NOTE, [0, -10], 0, 1)(0)) },
    { at: st.from + st.dur, to: reach(base, 'F', writeAt(X_NOTE, [70, -70], 0, 1)(0)), dur: sec(0.4) },
    { at: k.proud, to: { ...pose('cheer', { headTurn: 0.6 }), shF: 120, elF: 30 }, dur: sec(0.35) },
  ], [
    { from: st.from, to: st.from + st.dur, at: (g) => reach(base, 'F', writeAt(X_NOTE, [0, 0], st.from, st.dur, 220)(g)), enter: sec(0.3) },
    { from: wb.from, to: wb.from + wb.dur, at: (g) => reach(base, 'F', writeAt(X_NOTE, [70, -60], wb.from, wb.dur, 230)(g)), enter: sec(0.3) },
  ]);
  const c: Cam = camMix({ x: 110, y: -560, z: 1.42 }, { x: 125, y: -580, z: 1.45 }, prog(f, k.start, k.end - k.start, ease.inOut));
  return (
    <Frame c={c} bg={C.night} world={<>
      <Bedroom id="night" night={1} calDay={30} light={[20, -560]} />
      <Notes plan={1} planSub={1} strike1={prog(f, st.from, st.dur, (x) => x)} big={prog(f, wb.from, wb.dur, (x) => x)} />
      <g transform={`translate(${BOX.x} ${BOX.y})`}><ShoeBox w={BOX.w} h={BOX.h} dust={1} f={f} /></g>
      <Actor f={f} d={{
        look: SULTAN, id: 'night', seed: 11, x: X_NOTE, y: 0, scale: S, facing: 1, pose: [{ at: 0, to: p }],
        face: [F(0, 'determined', { gx: 1, gy: 0 }), F(k.big, 'determined', { gx: 1, gy: -0.2, brow: -0.8 }, sec(0.2)), F(k.proud, 'proud', { gx: 0.3, gy: -0.2, sparkle: 0.7 }, sec(0.3))],
        handN: 'fist', handF: 'grip', holdF: <Marker />, holdUpright: 'F',
      }} />
    </>} />
  );
};

// ——— R6 · he strikes the big plan and writes the small one ———
export type DecideBeats = { start: number; strike: number; write: number; small: number; turn: number; end: number };
export const Decide: React.FC<{ f: number; k: DecideBeats }> = ({ f, k }) => {
  const base = pose('stand', { headTurn: 0.85, lean: 4 });
  const st = { from: k.strike, dur: sec(0.5) };
  const ws = { from: k.small - sec(0.1), dur: k.turn - k.small };
  const p = follow(f, [
    { at: 0, to: { ...base, shF: 20, elF: 40 } },
    { at: st.from + st.dur, to: reach(base, 'F', writeAt(X_NOTE, [-10, 250], 0, 1)(0)), dur: sec(0.5) },
    { at: k.turn, to: { ...pose('stand', { headTurn: 0.75, headTilt: 12, lean: 6 }), shF: 20, elF: 40 }, dur: sec(0.4) },
  ], [
    { from: st.from, to: st.from + st.dur, at: (g) => reach(base, 'F', writeAt(X_NOTE, [70, -70], st.from, st.dur, 240)(g)), enter: sec(0.4) },
    { from: ws.from, to: ws.from + ws.dur, at: (g) => reach(base, 'F', writeAt(X_NOTE, [-10, 250], ws.from, ws.dur, 200)(g)), enter: sec(0.3) },
  ]);
  const c: Cam = camMix({ x: 90, y: -560, z: 1.48 }, { x: 110, y: -500, z: 1.6 }, prog(f, k.write, k.end - k.write, ease.inOut));
  return (
    <Frame c={c} bg={C.bg} world={<>
      <Bedroom sun={prog(f, k.start, sec(1.5))} calDay={30} />
      <Notes plan={1} planSub={1} strike1={1} big={1} strike2={prog(f, st.from, st.dur, (x) => x)} small={prog(f, ws.from, ws.dur, (x) => x)} />
      <g transform={`translate(${BOX.x} ${BOX.y})`}><ShoeBox w={BOX.w} h={BOX.h} dust={1} f={f} /></g>
      <Actor f={f} d={{
        look: SULTAN, id: 'decide', seed: 13, x: X_NOTE, y: 0, scale: S, facing: 1, pose: [{ at: 0, to: p }],
        face: [F(0, 'thinking', { gx: 1, gy: -0.1 }), F(k.strike, 'determined', { gx: 1, gy: -0.1 }, sec(0.2)),
          F(k.small, 'determined', { gx: 1, gy: 0.4, brow: -0.3 }, sec(0.3)), F(k.turn, 'smile', { gx: 1, gy: 0.9 }, sec(0.3))],
        handN: 'open', handF: 'grip', holdF: <Marker />, holdUpright: 'F',
      }} />
    </>} />
  );
};

// ——— R6 · day one: shoes on, sitting; day two: at the door ———
export type WearBeats = { start: number; admire: number; door: number; handle: number; end: number };
export const Wear: React.FC<{ f: number; k: WearBeats }> = ({ f, k }) => {
  const seated = reach(reach(pose('seated', { headTurn: 0.6 }), 'N', [58, -84], 'open'), 'F', [70, -86], 'open');
  const atDoor = f >= k.door;
  const xDoor = 640;
  const w = walk(f, 380, xDoor, k.door, k.handle - k.door - sec(0.2), 34);
  const tc = toChar(w.x, 0, S);
  const handle = reach(pose('stand', { headTurn: 0.85, lean: 3 }), 'F', tc([1000 + 150 - 46, -404]), 'grip');
  const c: Cam = atDoor
    ? camMix({ x: 680, y: -520, z: 1.45 }, { x: 760, y: -520, z: 1.55 }, prog(f, k.door, k.end - k.door, ease.inOut))
    : camMix({ x: -20, y: -330, z: 2.0 }, { x: -50, y: -360, z: 2.15 }, prog(f, k.start, k.door - k.start, ease.inOut));
  return (
    <Frame c={c} bg={C.bg} world={<>
      <Bedroom sun={1} calDay={30} door={atDoor ? 0.32 * prog(f, k.handle + sec(0.2), sec(0.6)) : 0} />
      {!atDoor && <g transform={`translate(${BOX.x} ${BOX.y})`}><ShoeBox w={BOX.w} h={BOX.h} shoes={0} f={f} drawLid={false} /></g>}
      {!atDoor && <Actor f={f} d={{
        look: SULTAN, id: 'wear', seed: 15, x: SEAT_X, y: 0, scale: S, facing: 1, feet: 'runner',
        pose: [
          { at: 0, to: { ...seated, headTilt: 14, lean: 10 } },
          { at: k.admire, to: { ...seated, hipN: 60, knN: -40, headTilt: 16, lean: 12 }, dur: sec(0.45) }, // lifts a foot to look at the new shoe
          { at: k.admire + sec(1.1), to: { ...seated, headTilt: 4, lean: 2, headTurn: 0.4 }, dur: sec(0.4) },
        ],
        face: [F(0, 'smile', { gx: 0.7, gy: 1 }), F(k.admire + sec(1.1), 'relieved', { gx: 0, gy: 0 }, sec(0.3))],
        handN: 'open', handF: 'open',
      }} />}
      {atDoor && <Actor f={f} d={{
        look: SULTAN, id: 'door', seed: 17, x: w.x, y: 0, scale: S, facing: 1, feet: 'runner', add: w.add,
        pose: [{ at: 0, to: pose('stand', { headTurn: 0.85 }) }, { at: k.handle - sec(0.3), to: handle, dur: sec(0.35) }],
        face: [F(0, 'smile', { gx: 1, gy: 0 }), F(k.handle + sec(0.2), 'grin', { gx: 1, gy: 0, sparkle: 0.5 }, sec(0.3))],
        handN: 'fist', handF: f >= k.handle - sec(0.1) ? 'grip' : 'fist',
      }} />}
    </>} />
  );
};

// ——— R7 · back through the door: he takes the big plan off the wall, crumples it into the empty box ———
export type HomeBeats = { start: number; door: number; grab: number; crush: number; drop: number; question: number; end: number };
export const Home: React.FC<{ f: number; k: HomeBeats }> = ({ f, k }) => {
  const xStop = 430;
  const w = walk(f, 900, xStop, k.start + sec(0.3), k.grab - k.start - sec(0.9), 34);
  const tc = toChar(w.x, 0, S, -1);
  const stand = pose('stand', { headTurn: 0.85 });
  const big: [number, number] = [NOTE_AT[0] + 70, NOTE_AT[1] - 70];
  const onNote = reach({ ...stand, headTilt: -6 }, 'F', tc(big), 'grip');
  const atChest = reach({ ...stand, headTilt: 8, lean: 4 }, 'F', tc([xStop - 120, -420]), 'grip');
  const over = reach({ ...stand, lean: 10, headTilt: 12 }, 'F', tc([BOX.x + 20, BOX.y - BOX.h - 70]), 'grip');
  const held = f >= k.grab && f < k.drop;
  const crush = prog(f, k.crush, sec(0.35));
  const fall = prog(f, k.drop, sec(0.35), ease.in);
  const c: Cam = f < k.question
    ? camMix({ x: 660, y: -560, z: 1.35 }, { x: 290, y: -500, z: 1.6 }, prog(f, k.start, k.grab - k.start, ease.inOut))
    : camMix({ x: 290, y: -500, z: 1.6 }, { x: 260, y: -380, z: 1.95 }, prog(f, k.question, sec(1.4), ease.inOut));
  return (
    <Frame c={c} bg={C.bg} world={<>
      <Bedroom sun={1} calDay={0} door={1 - prog(f, k.door, sec(0.8), ease.inOut)} />
      <Notes plan={1} planSub={1} strike1={1} big={f < k.grab ? 1 : 0} strike2={1} small={1} />
      <g transform={`translate(${BOX.x} ${BOX.y})`}>
        <ShoeBox w={BOX.w} h={BOX.h} shoes={0} drawLid={false} f={f} />
        {/* the big plans, crumpled, collecting in the box the shoes came out of */}
        <g transform={`translate(0 ${-BOX.h + 30})`}>
          <Crumple r={28} rot={20} /><g transform="translate(-50 6)"><Crumple r={24} rot={-40} /></g>
          {f >= k.drop && <g transform={`translate(30 ${mix(-110, 0, fall)})`}><Crumple r={30} rot={mix(0, 70, fall)} /></g>}
        </g>
      </g>
      <Actor f={f} d={{
        look: SULTAN, id: 'home', seed: 19, x: w.x, y: 0, scale: S, facing: -1, feet: 'runner', add: w.add,
        pose: [
          { at: 0, to: { ...stand, chest: 0.5 } },
          { at: k.grab - sec(0.45), to: onNote, dur: sec(0.45) },
          { at: k.grab + sec(0.1), to: atChest, dur: sec(0.4) },
          { at: k.drop - sec(0.45), to: over, dur: sec(0.45) },
          { at: k.drop + sec(0.3), to: pose('proud', { headTurn: 0.5 }), dur: sec(0.45) },
          { at: k.question, to: { ...pose('explain', { headTurn: 0.05, headTilt: 4 }) }, dur: sec(0.5) }, // turns to us with the question
        ],
        face: [F(0, 'smile', { gx: 1, gy: 0, sweat: 0.4, blush: 0.3 }), F(k.grab - sec(0.5), 'determined', { gx: 1, gy: -0.3 }, sec(0.3)),
          F(k.crush, 'grin', { gx: 0.6, gy: 0.4 }, sec(0.2)), F(k.drop + sec(0.3), 'proud', { gx: -0.4, gy: 0, sparkle: 0.5 }, sec(0.3)),
          F(k.question, 'smile', { gx: 0, gy: 0, browY: 0.4 }, sec(0.3))],
        handN: 'fist', handF: held || (f >= k.grab - sec(0.15) && f < k.drop) ? 'grip' : 'open',
        holdF: held ? <g>{crush < 1 && <g transform={`scale(${mix(0.42, 0.12, crush)})`} opacity={1 - crush}><WallNote id="held" w={330} text="بكرة ساعتين!" strike={1} /></g>}
          {crush > 0 && <g transform={`scale(${mix(0.3, 1, crush)})`}><Crumple r={30} /></g>}</g> : undefined,
        holdUpright: 'F',
      }} />
    </>} />
  );
};
