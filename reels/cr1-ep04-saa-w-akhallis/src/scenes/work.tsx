import React from 'react';
import { pose, type Pose } from '../../../../motion-core/src/cartoon';
import { anchorAt, reach, type SvgHand } from '../../../../motion-core/src/characters/SvgPerson';
import { Carton, Instructions, Panel, Room, Screw, Screwdriver, WORK_X } from '../props';
import { Actor, F, Frame, camMix, follow, toChar, type Cam } from '../stage';
import { C, NASER } from '../theme';
import { ease, mix, prog, sec } from '../time';

// R2, the hardest shot: kneeling at the carton he uses as a bench, he drives the first screw (it goes in
// crooked), turns the picture-only instructions round, then lifts panel 3 by its edges and finds it upside
// down. Hands: pinch for the screw, grip for the screwdriver, edge for the sheet and the board.
export type WorkBeats = { start: number; screw: number; crooked: number; sheet: number; turn: number; panel: number; flip: number; end: number };

export const S = 1.7;
export const X = -150, Y = 72 * S; // kneeling: the feet sink one shin below the floor so the knees rest on it
const BENCH = { x: WORK_X - 30, top: -120 }; // the closed carton, top face at y −120
const HOLE: [number, number] = [BENCH.x - 40, BENCH.top - 22];
const tc = toChar(X, Y, S);

export const kneel = (extra: Partial<Pose> = {}): Pose => pose('stand', { hipF: 0, knF: -90, hipN: 0, knN: -90, headTurn: 0.85, ...extra });

/** `legacy` draws the shot with EP03's hands (grip and fist only), for the before/after comparison. */
export const Work: React.FC<{ f: number; k: WorkBeats; legacy?: boolean; cam?: Cam }> = ({ f, k, legacy = false, cam }) => {
  const H = (h: SvgHand): SvgHand => (legacy && (h === 'pinch' || h === 'edge') ? 'grip' : h);
  const bend = kneel({ lean: 24, headTilt: 10 });
  // the screw goes in, then leans over
  const driven = prog(f, k.screw + sec(0.3), k.crooked - k.screw - sec(0.3), (x) => x);
  const tilt = 26 * prog(f, k.crooked - sec(0.35), sec(0.35), ease.in);
  const screwTop: [number, number] = [HOLE[0] + Math.sin((tilt * Math.PI) / 180) * 30, HOLE[1] - 30 + 22 * driven];
  // the screwdriver's tip rides the screw head; its grip is 98 units above the tip (in the hand's frame, scaled)
  const drv = (g: number): [number, number] => [screwTop[0] + 3 * Math.sin(g * 0.8), screwTop[1] - 98 * S + 2 * Math.cos(g * 0.8)];
  const sheetRot = f < k.turn ? 0 : 90 * prog(f, k.turn, sec(0.5), ease.inOut) + 90 * prog(f, k.turn + sec(0.9), sec(0.5), ease.inOut);
  // panel 3: lifted by its edges, upright in front of him; then flipped right way up
  const flip = prog(f, k.flip, sec(0.6), ease.inOut);
  const holdPanel = kneel({ lean: 4, headTilt: 4, headTurn: 0.75 });
  // the board stands on its end in front of him, right of his face: his far hand on its near edge, the other lower down
  const PANEL: [number, number] = [X + 300, -300];
  const panelGrip = reach(holdPanel, 'F', tc([PANEL[0] - 80, PANEL[1] - 40]), H('edge'));
  const pf = anchorAt(panelGrip, 'F', H('edge'));
  const panelBoth = reach(panelGrip, 'N', [pf[0], pf[1] + 120 / S], H('edge'));
  // the sheet is held at chest height, forward and to the right, so his face stays clear while he reads it
  const sheetPose = (tilt: number) => reach(reach(kneel({ lean: 10, headTilt: tilt, headTurn: 0.9 }), 'N', tc([X + 200, -300]), H('edge')), 'F', tc([X + 330, -300]), H('edge'));
  const p = follow(f, [
    { at: 0, to: reach(reach(bend, 'N', tc([HOLE[0] - 6, HOLE[1] - 40]), H('pinch')), 'F', tc(drv(0)), 'grip', -1) },
    { at: k.crooked + sec(0.05), to: reach(reach(kneel({ lean: 6, headTilt: -6, headTurn: 0.7 }), 'N', tc([X + 40, -180]), 'open'), 'F', tc([X + 150, -150]), 'grip'), dur: sec(0.3) }, // leans back from it
    { at: k.sheet - sec(0.35), to: sheetPose(10), dur: sec(0.45) },
    { at: k.turn, to: sheetPose(-14), dur: sec(0.6) }, // his head turns with the sheet
    { at: k.turn + sec(0.9), to: sheetPose(16), dur: sec(0.6) },
    { at: k.panel - sec(0.45), to: reach(reach(kneel({ lean: 34, headTilt: 12 }), 'F', tc([X + 300, -60]), H('edge')), 'N', tc([X + 250, -60]), H('edge')), dur: sec(0.4) }, // down to the board on the floor
    { at: k.panel + sec(0.1), to: panelBoth, dur: sec(0.55) },
    { at: k.flip + sec(0.7), to: { ...panelBoth, headTilt: -4 }, dur: sec(0.3) },
  ], [
    { from: k.screw, to: k.crooked, at: (g) => reach(reach(bend, 'N', tc([HOLE[0] - 6, HOLE[1] - 40 + 18 * prog(g, k.screw, sec(0.6))]), H('pinch')), 'F', tc(drv(g)), 'grip', -1) },
  ]);
  const holding = f >= k.panel - sec(0.05);
  const sheetHeld = f >= k.sheet - sec(0.1) && f < k.panel - sec(0.5);
  const c: Cam = cam ?? camMix({ x: -10, y: -330, z: 1.75 }, { x: 20, y: -360, z: 1.68 }, prog(f, k.start, k.end - k.start, ease.inOut));
  return (
    <Frame c={c} bg={C.bg} world={<>
      <Room id="work" clockMin={16 * 60 + 25 + (f - k.start) / 60} note="الضيوف 7:00" />
      <g transform={`translate(${BENCH.x} 0)`}><Carton w={360} h={120} open={1} /></g>
      {/* the side panel lying on the carton: its top face, with the holes */}
      <path d={`M${BENCH.x - 170} ${BENCH.top} L${BENCH.x + 170} ${BENCH.top} L${BENCH.x + 150} ${BENCH.top - 34} L${BENCH.x - 150} ${BENCH.top - 34} Z`} fill={C.panel} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      {[-100, -40, 60, 120].map((x) => <ellipse key={x} cx={BENCH.x + x} cy={BENCH.top - 18} rx={7} ry={3.5} fill={C.panelEdge} stroke={C.ink} strokeWidth={2} />)}
      {/* the screw: held, then on its own (crooked) */}
      {f >= k.screw - sec(0.05) && <g transform={`translate(${HOLE[0]} ${HOLE[1] - 30 + 22 * driven})`}><Screw tilt={tilt} s={1.4} /></g>}
      {f >= k.crooked + sec(0.3) && <g transform={`translate(${BENCH.x + 120} ${BENCH.top - 46}) rotate(-80)`}><g transform="scale(1.6)"><Screwdriver /></g></g>}
      {/* panel 3 on the floor in front, before he lifts it */}
      {!holding && <g transform={`translate(${X + 330} 40)`}>
        <path d="M-210 0 L210 0 L196 -30 L-196 -30 Z" fill={C.panel} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <ellipse cx={-90} cy={-15} rx={22} ry={9} fill={C.clock} stroke={C.ink} strokeWidth={2.5} />
      </g>}
      {/* the instructions on the floor before he picks them up, and after he drops them */}
      {!sheetHeld && <g transform={`translate(${X + (f < k.sheet ? 120 : 40)} 80) scale(0.7 0.24)`}><Instructions /></g>}
      <Actor f={f} d={{
        look: NASER, id: 'work', seed: 31, x: X, y: Y, scale: S, facing: 1, pose: [{ at: 0, to: p }],
        face: [
          F(0, 'determined', { gx: 0.6, gy: 1 }),
          F(k.crooked, 'wince', { gx: 0.6, gy: 1, sweat: 0.4 }, sec(0.12)),
          F(k.sheet, 'thinking', { gx: 1, gy: 0.7 }, sec(0.25)),
          F(k.turn + sec(0.4), 'worried', { gx: 1, gy: 0.7 }, sec(0.3)),
          F(k.panel + sec(0.6), 'calm', { gx: 1, gy: 0.1 }, sec(0.2)),
          F(k.flip - sec(0.25), 'surprised', { gx: 1, gy: 0 }, sec(0.12)),
          F(k.flip + sec(0.7), 'embarrassed', { gx: 0.2, gy: 0, sweat: 0.8 }, sec(0.3)),
        ],
        handN: f < k.screw + sec(0.7) ? H('pinch') : f >= k.sheet - sec(0.1) && sheetHeld ? H('edge') : holding ? H('edge') : 'open',
        handF: f < k.crooked + sec(0.3) ? 'grip' : f >= k.sheet - sec(0.1) && sheetHeld ? H('edge') : holding ? H('edge') : 'open',
        holdN: f < k.screw - sec(0.05) ? <Screw s={1.4 / S} /> : undefined,
        holdF: f < k.crooked + sec(0.3) ? <g transform={`scale(${1 / 1})`}><Screwdriver /></g>
          : sheetHeld ? <g transform={`translate(${-75 / S} 0) rotate(${sheetRot}) scale(${0.62 / S})`}><Instructions /></g>
            : holding ? <g transform={`translate(${80 / S} ${(40 - 60) / S}) rotate(${mix(180, 360, flip)}) scale(${1 / S})`}><Panel w={170} h={420} num="3" /></g> : undefined,
        holdUpright: true,
        farInFront: holding || sheetHeld,
      }} />
    </>} />
  );
};
