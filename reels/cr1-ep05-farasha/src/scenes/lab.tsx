import React from 'react';
import { pose, type Pose } from '../../../../motion-core/src/cartoon';
import { reach } from '../../../../motion-core/src/characters/SvgPerson';
import { Butterfly, DoorLeaf, flapAt, Lab, LAB, Mug, PlotSheet } from '../props';
import { Actor, F, Frame, camMix, follow, plantedWalk, toChar, type Cam, type Direction } from '../stage';
import { C, LORENZ, WARDROBE } from '../theme';
import { ease, mix, prog, sec } from '../time';

// The lab, 1961: one set, seen from four places. Lorenz types at the teleprinter, takes a printout,
// presses start, leaves for coffee, comes back an hour later, and finds the weather changed.
export const S = 1.5;
export const DESK_X = 170;
const tc = toChar(DESK_X, 0, S);
const who = (d: Partial<Direction> & Pick<Direction, 'pose' | 'face'>): Direction => ({
  look: LORENZ, wardrobe: WARDROBE, id: 'lorenz', seed: 11, scale: S, x: DESK_X, y: 0, facing: 1, ...d,
});
const clockAt = (min: number) => 14 * 60 + 10 + min; // ten past two in the afternoon, then an hour on

/** A printout sheet held in a hand: rows of numbers, or the two runs once he has the new one. */
const Sheet: React.FC<{ plot?: boolean; side?: number }> = ({ plot = false, side = -20 }) => (
  <g transform={`translate(${side} -150)`}>
    <rect x={-60} y={0} width={120} height={160} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={2.6} />
    {plot ? <g transform="translate(0 70) scale(0.13)"><PlotSheet a={1} b={1} /></g>
      : Array.from({ length: 8 }, (_, k) => <path key={k} d={`M44 ${18 + k * 17} L${-40 + ((k * 23) % 30)} ${18 + k * 17}`} stroke={C.mist} strokeWidth={3} strokeDasharray="9 5" />)}
  </g>
);

const typeLook = pose('stand', { lean: 9, headTurn: 0.85, headTilt: 14 });
/** Both hands on the keys, fingers striking in turn. */
const typing = (g: number, look: Pose = typeLook, hands: 'both' | 'N' = 'both') => {
  const a = Math.max(0, Math.sin(g / 4.4)), b = Math.max(0, Math.sin(g / 4.4 + 2.1));
  let p = look;
  if (hands === 'both') p = reach(p, 'F', tc([382, -330 - 12 * a]), 'point', 1);
  return reach(p, 'N', tc([292, -330 - 12 * b]), 'point', -1);
};

const HOLDER: [number, number] = [455, -560]; // the copy stand's clip, right of the teleprinter
/** A wire copy stand on the desk; the sheet he typed from clipped to it. */
const CopyStand: React.FC<{ sheet: boolean }> = ({ sheet }) => (
  <g>
    <path d={`M${HOLDER[0]} -300 L${HOLDER[0] - 10} ${HOLDER[1] + 120} M${HOLDER[0] - 40} -300 L${HOLDER[0] + 40} -300`} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    {sheet && <g transform={`translate(${HOLDER[0] - 10} ${HOLDER[1] + 110}) rotate(6) scale(1.3)`}><Sheet side={-60} /></g>}
    <rect x={HOLDER[0] - 34} y={HOLDER[1] - 34} width={44} height={14} rx={4} fill={C.metalDeep} stroke={C.ink} strokeWidth={3} />
  </g>
);

export type DeskBeats = { start: number; busy: number; take: number; copy: number; push: number; end: number };
/** R2–R3: the wide lab, then closer as he takes the printout and types its numbers back in. */
export const Desk: React.FC<{ f: number; k: DeskBeats }> = ({ f, k }) => {
  // he tears off the top sheet, reads it, clips it to the copy stand, and types its numbers back in with both hands
  const readLook = pose('stand', { lean: 4, headTurn: 0.95, headTilt: -4 });
  const placeAt = k.copy - sec(0.55);
  const p = follow(f, [
    { at: k.take - sec(0.3), to: reach(pose('stand', { lean: 6, headTurn: 0.95, headTilt: -10 }), 'F', tc([360, -560]), 'edge', -1), dur: sec(0.35) },
    { at: k.take + sec(0.3), to: reach(reach(readLook, 'F', tc([382, -515]), 'edge', -1), 'N', tc([290, -340]), 'open', -1), dur: sec(0.4) },
    { at: placeAt, to: reach(reach(readLook, 'F', tc([HOLDER[0] - 10, HOLDER[1] + 80]), 'edge', -1), 'N', tc([290, -340]), 'open', -1), dur: sec(0.35) },
  ], [
    { from: 0, to: k.take - sec(0.3), at: (g) => typing(g) },
    { from: k.copy, to: k.end + sec(1), at: (g) => typing(g, pose('stand', { lean: 8, headTurn: 0.9, headTilt: Math.sin(g / 50) > 0.2 ? -6 : 10 })), enter: sec(0.35) },
  ]);
  const hasSheet = f >= k.take + sec(0.05) && f < placeAt + sec(0.3);
  const onStand = f >= placeAt + sec(0.3);
  const c = camMix({ x: 300, y: -660, z: 0.92 }, { x: 300, y: -560, z: 1.45 }, prog(f, k.push, sec(1.0), ease.inOut));
  // the strip grows as it prints; he tears the top sheet off, and it starts again
  const rows = f < k.take ? 3 + Math.min(4, Math.max(0, (f - k.start) / 40)) : Math.min(4, (f - k.take) / 40);
  return (
    <Frame c={camMix(c, { ...c, x: c.x + 12 }, prog(f, k.start, k.end - k.start, ease.inOut))} bg={C.bg} world={<>
      <Lab f={f} clockMin={clockAt((f - k.start) / 3600)} lamps={f >= k.busy ? 1 : 0.4} rows={rows} cloudShift={f * 0.15} />
      <DoorLeaf open={0} />
      <CopyStand sheet={onStand} />
      <Actor f={f} d={who({
        pose: [{ at: 0, to: p }],
        face: [F(0, 'calm', { gx: 0.7, gy: 0.9 }), F(k.take - sec(0.4), 'thinking', { gx: 1, gy: -0.6 }, sec(0.25)),
          F(k.copy, 'determined', { gx: 1, gy: -0.5 }, sec(0.3)), F(k.copy + sec(0.9), 'calm', { gx: 0.8, gy: 0.8 }, sec(0.3)),
          F(k.copy + sec(1.7), 'determined', { gx: 1, gy: -0.5 }, sec(0.3))],
        handF: f < k.take - sec(0.3) || f >= k.copy ? 'point' : 'edge', handN: f >= k.take && f < k.copy ? 'open' : 'point',
        holdF: hasSheet ? <g transform={`scale(${1.3 / S})`}><Sheet side={36} /></g> : undefined, holdUpright: 'F', farInFront: hasSheet,
      })} />
    </>} />
  );
};

export type SwitchBeats = { start: number; press: number; end: number };
/** R4 «ضغط تشغيل»: close on the start switch; his finger comes down, the lamp beside it goes green. */
export const Switch: React.FC<{ f: number; k: SwitchBeats }> = ({ f, k }) => {
  const down = prog(f, k.press, sec(0.1), ease.in) * (1 - prog(f, k.press + sec(0.35), sec(0.2)));
  const p = follow(f, [{ at: 0, to: typing(k.start) }], [
    { from: k.start + sec(0.05), to: k.end + 1, enter: sec(0.2), at: (g) => reach(pose('stand', { lean: 8, headTurn: 0.95, headTilt: 10 }), 'F', tc([LAB.button[0], LAB.button[1] - 34 + 28 * (g < k.press ? prog(g, k.press - sec(0.25), sec(0.25), ease.in) : down)]), 'point', 1) },
  ]);
  return (
    <Frame c={camMix({ x: 410, y: -420, z: 2.4 }, { x: 420, y: -410, z: 2.5 }, prog(f, k.start, k.end - k.start))} bg={C.bg} world={<>
      <Lab f={f} clockMin={clockAt(0)} lamps={f >= k.press ? 2 : 0.4} press={f >= k.press + sec(0.05) ? 1 : down} rows={16} />
      <Actor f={f} d={who({ pose: [{ at: 0, to: p }], face: [F(0, 'determined', { gx: 1, gy: 0.8 })], handF: 'point', handN: 'open' })} />
    </>} />
  );
};

export type DoorBeats = { start: number; turn: number; out: number; hourFrom: number; back: number; inside: number; sip: number; end: number };
/** R4–R5: he leaves for coffee, the clock over the door runs an hour, he comes back with the mug. */
export const Door: React.FC<{ f: number; k: DoorBeats }> = ({ f, k }) => {
  const DOOR_X = (LAB.door.x0 + LAB.door.x1) / 2;
  const leaving = f < k.hourFrom;
  // out: from the desk to the doorway, facing the door; back: from the doorway into the room
  const wOut = plantedWalk(f, DESK_X, DOOR_X, k.turn + sec(0.15), k.out - k.turn - sec(0.15), S);
  const wIn = plantedWalk(f, DOOR_X, -150, k.inside, sec(1.25), S);
  const x = leaving ? wOut.x : wIn.x;
  const step = leaving ? wOut.add : wIn.add;
  const doorOpen = leaving
    ? prog(f, k.out - sec(0.7), sec(0.35), ease.inOut) * (1 - prog(f, k.out + sec(0.05), sec(0.35), ease.inOut))
    : prog(f, k.back - sec(0.05), sec(0.3), ease.inOut) * (1 - prog(f, k.inside + sec(0.9), sec(0.4), ease.inOut));
  const hidden = leaving ? f > k.out + sec(0.4) : f < k.back;
  const race = prog(f, k.hourFrom, k.back - k.hourFrom - sec(0.1), ease.inOut);
  // the mug: carried at the chest, raised to his mouth for one sip
  const sipUp = prog(f, k.sip, sec(0.3), ease.inOut) * (1 - prog(f, k.sip + sec(0.75), sec(0.3), ease.inOut));
  const carry = (base: Pose) => reach(base, 'N', [mix(56, 40, sipUp), mix(-190, -292, sipUp)], 'grip', -1);
  const walkLook = pose('stand', { headTurn: 0.55, lean: 2 });
  const p = leaving
    ? follow(f, [{ at: 0, to: typing(k.start) }, { at: k.turn - sec(0.2), to: pose('stand', { headTurn: 0.1 }), dur: sec(0.2) }, { at: k.turn, to: walkLook, dur: sec(0.3) }])
    : carry({ ...walkLook, headTilt: mix(0, -12, sipUp) });
  const facing: 1 | -1 = leaving ? (f < k.turn ? 1 : -1) : 1;
  const c: Cam = camMix({ x: -170, y: -660, z: 0.92 }, { x: -210, y: -640, z: 0.96 }, prog(f, k.start, k.end - k.start, ease.inOut));
  return (
    <Frame c={c} bg={C.bg} world={<>
      <Lab f={f} clockMin={clockAt(race * 60 + (f - k.start) / 3600)} light={race} lamps={1.6} rows={16} cloudShift={f * 0.15 + race * 900} />
      {!hidden && <Actor f={f} d={who({
        x, facing, add: step, pose: [{ at: 0, to: p }],
        face: leaving ? [F(0, 'determined', { gx: 0.4, gy: 1 }), F(k.turn, 'calm', { gx: 0.5, gy: 0.1 }, sec(0.3))]
          : [F(0, 'relieved', { gx: 0.4 }), F(k.sip + sec(1.1), 'calm', { gx: 0.8, gy: 0.2 }, sec(0.3))],
        handF: 'open', handN: leaving ? 'open' : 'grip',
        holdN: leaving ? undefined : <g transform={`scale(${0.85 / S}) translate(-4 46)`}><Mug steam={1} f={f} /></g>, holdUpright: 'N',
      })} />}
      <DoorLeaf open={doorOpen} />
    </>} />
  );
};

export type ReactBeats = { start: number; stop: number; shock: number; end: number };
/** R5's last line: close on him at the desk, the new printout in one hand, the mug stopped halfway. */
export const React_: React.FC<{ f: number; k: ReactBeats }> = ({ f, k }) => {
  const up = prog(f, k.start, k.stop - k.start, ease.out);
  const sink = prog(f, k.shock + sec(0.5), sec(0.9), ease.inOut);
  const base = pose('stand', { lean: 2, headTurn: 0.95, headTilt: mix(-4, 6, prog(f, k.shock, sec(0.3))) });
  const p = reach(reach(base, 'F', tc([392, -585]), 'edge'), 'N', [mix(60, 52, up), mix(-190, -228, up) + 30 * sink], 'grip', -1);
  return (
    <Frame c={camMix({ x: 250, y: -560, z: 2.0 }, { x: 236, y: -572, z: 2.12 }, prog(f, k.start, k.end - k.start, ease.inOut))} bg={C.bg} world={<>
      <Lab f={f} clockMin={clockAt(60)} light={1} lamps={1.6} rows={16} cloudShift={900 + f * 0.15} />
      <Actor f={f} d={who({
        pose: [{ at: 0, to: p }],
        face: [F(0, 'thinking', { gx: 1, gy: -0.1 }), F(k.stop - sec(0.1), 'worried', { gx: 1, gy: 0 }, sec(0.3)),
          F(k.shock, 'surprised', { gx: 1, gy: 0, pupil: 0.65 }, sec(0.15))],
        handF: 'edge', handN: 'grip', farInFront: true, holdUpright: true,
        holdF: <g transform={`scale(${1.3 / S})`}><Sheet plot /></g>,
        holdN: <g transform={`scale(${0.85 / S}) translate(-4 46)`}><Mug steam={0.6} f={f} /></g>,
      })} />
    </>} />
  );
};

export type WindowBeats = { start: number; look: number; turn: number; end: number };
/** R9–R10: by the window with his coffee; outside, a butterfly crosses the glass. He turns to us. */
export const Window: React.FC<{ f: number; k: WindowBeats }> = ({ f, k }) => {
  const X = -40;
  const flyT = prog(f, k.look - sec(0.4), k.turn + sec(1.6) - k.look, (t) => t);
  const fly: [number, number] = [mix(LAB.window.x1 + 40, LAB.window.x0 + 60, flyT), -1020 + 70 * Math.sin(flyT * Math.PI * 2.2) + 40 * flyT];
  const turnP = prog(f, k.turn, sec(0.45), ease.inOut);
  const look = pose('stand', { headTurn: mix(0.7, 0.05, turnP), headTilt: mix(-10, 4, turnP), lean: -2 });
  const p = reach(look, 'N', [60, mix(-192, -206, turnP)], 'grip', -1);
  return (
    <Frame c={camMix({ x: -140, y: -700, z: 1.3 }, { x: -150, y: -704, z: 1.36 }, prog(f, k.start, k.end - k.start, ease.inOut))} bg={C.bg} world={<>
      <Lab f={f} clockMin={clockAt(64)} light={0.85} lamps={1.6} rows={16} cloudShift={900 + f * 0.25}
        butterflyOutside={<g transform={`translate(${fly[0]} ${fly[1]}) rotate(-12)`}><Butterfly flap={flapAt(f)} s={0.9} /></g>} />
      <DoorLeaf open={0} />
      <Actor f={f} d={who({
        x: X, facing: -1, pose: [{ at: 0, to: p }],
        face: [F(0, 'calm', { gx: 0.8, gy: -0.7 }), F(k.look, 'thinking', { gx: 0.6, gy: -0.8 }, sec(0.4)),
          F(k.turn, 'smile', { gx: -0.1, gy: 0 }, sec(0.35))],
        handF: 'open', handN: 'grip', holdUpright: 'N',
        holdN: <g transform={`scale(${0.85 / S}) translate(-4 46)`}><Mug steam={0.4} f={f} /></g>,
      })} />
    </>} />
  );
};
