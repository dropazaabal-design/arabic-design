import React from 'react';
import { Butterfly, flapAt, Numbers, PlotSheet } from '../props';
import { Frame, camMix } from '../stage';
import { C } from '../theme';
import { ease, mix, prog, sec } from '../time';

// Close-ups of paper: the runs plotted, and the one number that was rounded. Their own small world,
// centred on the sheet; a desk surface around it so the sheet reads as a thing lying there.
const Desk: React.FC = () => <rect x={-1400} y={-1600} width={2800} height={3200} fill="#C3D4CF" />;

export type HookBeats = { start: number; same: number; again: number; diverge: number; apart: number; end: number };
/** R1: the hook. The first run draws itself; the rerun traces it exactly; then it leaves and never comes back. */
export const Hook: React.FC<{ f: number; k: HookBeats }> = ({ f, k }) => {
  // the first run is already being drawn on the first frame (no empty opening)
  const a = 0.16 + 0.84 * prog(f, k.start, k.again - k.start + sec(0.6), (t) => ease.out(t));
  const b = prog(f, k.again, k.end - k.again - sec(0.25), (t) => t);
  const pull = prog(f, k.diverge - sec(0.2), sec(1.4), ease.inOut);
  // the camera starts at the right edge of the sheet (where both runs begin) and pulls back to the whole sheet
  const c = camMix({ x: 190, y: -60, z: 1.7 }, { x: 0, y: -30, z: 1.08 }, pull);
  const flyT = prog(f, k.apart, k.end - k.apart + sec(0.3), (t) => t);
  return (
    <Frame c={c} bg={C.bg} world={<>
      <Desk />
      <g transform={`rotate(${mix(-2.5, -1, pull)})`}>
        <PlotSheet a={a} b={b} ring={prog(f, k.diverge + sec(0.3), sec(0.3)) * (1 - prog(f, k.end - sec(0.3), sec(0.3)))} legend={prog(f, k.again - sec(0.1), sec(0.4))} />
      </g>
      {/* the first sight of the butterfly: its shadow crosses the sheet as the hook ends */}
      {flyT > 0 && flyT < 1 && <g transform={`translate(${mix(560, -560, flyT)} ${-420 + 60 * Math.sin(flyT * 7)})`} opacity={0.2}>
        <Butterfly flap={flapAt(f)} s={2.2} color={0} />
      </g>}
    </>} />
  );
};

export type NumbersBeats = { start: number; drop: number; end: number; ghost?: number };
/** R3 «والورقة تقرّب لثلاث خانات بس»: what the machine held and what the paper showed; the last three digits lift off.
 * R9 «ثلاث خانات ما ظهرت على ورقة»: the same two readouts, the missing digits glowing where they never were. */
export const NumbersShot: React.FC<{ f: number; k: NumbersBeats }> = ({ f, k }) => {
  const drop = k.ghost === undefined ? prog(f, k.drop, sec(0.9), ease.inOut) : 1;
  const ghost = k.ghost === undefined ? 0 : prog(f, k.ghost, sec(0.5));
  return (
    <Frame c={camMix({ x: 0, y: -170, z: 1.04 }, { x: 0, y: -160, z: 1.1 }, prog(f, k.start, k.end - k.start, ease.inOut))} bg={C.bg} world={<>
      <Desk />
      <Numbers o={1} drop={drop} ghost={ghost} f={f} />
    </>} />
  );
};

export type CompareBeats = { start: number; together: number; apart: number; end: number };
/** R5 «الخطّان مشوا سوا… وبعدين تفرّقوا»: the new printout laid over the old against the light. */
export const Compare: React.FC<{ f: number; k: CompareBeats }> = ({ f, k }) => {
  const b = Math.min(prog(f, k.together - sec(0.2), k.apart - k.together + sec(0.2), (t) => t) * 0.36 + prog(f, k.apart, k.end - k.apart, (t) => t) * 0.64, 1);
  const slide = prog(f, k.start, sec(0.45), ease.out);
  return (
    <Frame c={camMix({ x: 60, y: -40, z: 1.14 }, { x: 0, y: -30, z: 1.06 }, prog(f, k.apart, sec(1.0), ease.inOut))} bg={C.bg} world={<>
      <Desk />
      <g transform={`translate(${mix(-420, 0, slide)} ${mix(140, 0, slide)}) rotate(${mix(-8, -1, slide)})`}>
        <PlotSheet a={1} b={b} label="ساعة على الجهاز = قرابة شهرين من الطقس" labelO={prog(f, k.start + sec(0.3), sec(0.4))} />
      </g>
    </>} />
  );
};
