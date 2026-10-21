import React from 'react';
import { pose, type Pose } from '../../../../motion-core/src/cartoon';
import { reach } from '../../../../motion-core/src/characters/SvgPerson';
import { AMERICAS, BOARD, Butterfly, Chalk, ChalkText, Cloud, flapAt, Hall, Sun, Tornado } from '../props';
import { gap, run1, run2, runPath } from '../plot';
import { Actor, F, Frame, camMix, follow, toChar, type Direction } from '../stage';
import { C, LORENZ, WARDROBE } from '../theme';
import { ease, mix, prog, sec } from '../time';

// The board: the meaning (R6), the name and its question (R7), his answer (R8). Lorenz stands to the
// board's left, facing it, so the drawings grow right to left toward him and his face stays clear of the
// platform buttons on the right of the screen.
export const SB = 1.55;
export const XB = -270;
const tc = toChar(XB, 0, SB);
const who = (d: Partial<Direction> & Pick<Direction, 'pose' | 'face'>): Direction => ({
  look: LORENZ, wardrobe: WARDROBE, id: 'lorenz', seed: 11, scale: SB, x: XB, y: 0, facing: 1, ...d,
});
const ChalkStick = () => <rect x={-5} y={-20} width={10} height={26} rx={3} fill={C.chalk} stroke={C.ink} strokeWidth={2} />;
/** The hand drawing a small loop around (cx, cy) as a chalk shape appears: p 0 … 1. */
const drawing = (base: Pose, cx: number, cy: number, r: number, p: number) =>
  reach(base, 'F', tc([cx + r * Math.cos(p * Math.PI * 4.2 + 2.6), cy + r * 0.7 * Math.sin(p * Math.PI * 4.2 + 2.6)]), 'pinch');

const DIAG = { x0: -70, x1: 550, y: -930, amp: 92 };
const STRIP = { x: 545, y: -640, step: 82, n: 8, limit: 5 }; // eight slots of two days, right to left; the line after the fifth (ten days… then two weeks blur)
const icon = (k: number) => (k % 3 === 0 ? 'sun' : k % 3 === 1 ? 'cloud' : 'rain');

export type MeaningBeats = { start: number; weather: number; grow: number; double: number; why: number; limit: number; end: number };
/** R6: weather in chalk; two lines from one point drifting apart, the gap doubling; then a forecast that runs out at two weeks. */
export const Meaning: React.FC<{ f: number; k: MeaningBeats }> = ({ f, k }) => {
  const cloudP = prog(f, k.weather, sec(0.9), (t) => t);
  const lines = prog(f, k.grow - sec(0.1), k.why - k.grow - sec(0.2), (t) => t);
  const stand = pose('stand', { headTurn: 0.8, lean: 3 });
  const stripP = prog(f, k.why, k.limit - k.why, (t) => t);
  const limitP = prog(f, k.limit - sec(0.15), sec(0.4));
  const pointAt = (x: number, y: number) => reach(pose('stand', { headTurn: 0.95, lean: 4, headTilt: -6 }), 'F', tc([x, y]), 'pinch');
  const p = follow(f, [
    { at: 0, to: stand },
    { at: k.grow + sec(0.95), to: pointAt(-20, -760), dur: sec(0.4) },
    { at: k.why, to: pointAt(0, -650), dur: sec(0.4) },
    { at: k.limit - sec(0.25), to: pointAt(40, -680), dur: sec(0.3) },
    { at: k.limit + sec(0.6), to: { ...pose('explain', { headTurn: 0.5 }) }, dur: sec(0.5) },
  ], [
    { from: k.weather, to: k.weather + sec(0.9), at: (g) => drawing(stand, -40, -560, 36, prog(g, k.weather, sec(0.9), (t) => t)), enter: sec(0.3) },
  ]);
  const bracket = (t: number, n: number, o: number) => {
    const x = DIAG.x1 - t * (DIAG.x1 - DIAG.x0), y1 = DIAG.y - run1(t) * DIAG.amp, y2 = DIAG.y - run2(t) * DIAG.amp;
    return o > 0 && <g key={n} opacity={o}>
      <Chalk d={`M${x - 14} ${Math.min(y1, y2) - 10} L${x} ${Math.min(y1, y2) - 10} L${x} ${Math.max(y1, y2) + 10} L${x - 14} ${Math.max(y1, y2) + 10}`} w={5} color={C.chalkDim} />
      <ChalkText x={x - 60} y={Math.max(y1, y2) + 10} w={120} size={40} text="×2" o={1} color={C.chalk} ltr />
    </g>;
  };
  return (
    <Frame c={camMix({ x: 160, y: -730, z: 1.0 }, { x: 175, y: -740, z: 1.05 }, prog(f, k.start, k.end - k.start, ease.inOut))} bg={C.bg} world={<>
      <Hall>
        {cloudP > 0 && <g transform="translate(-40 -560)"><Cloud s={1.2} rain draw={cloudP} /></g>}
        <ChalkText x={-140} y={-525} w={200} size={40} text="الطقس" o={prog(f, k.weather + sec(0.7), sec(0.3))} />
        <Chalk d={runPath(run1, 0, lines, DIAG)} w={8} />
        <Chalk d={runPath(run2, 0, lines, DIAG)} w={7} color={C.run2Soft} />
        <circle cx={DIAG.x1} cy={DIAG.y - run1(0) * DIAG.amp} r={10} fill={C.chalk} opacity={prog(f, k.grow - sec(0.2), sec(0.2))} />
        {[0.4, 0.47, 0.54].map((t, n) => bracket(t, n, lines >= t + 0.02 ? prog(f, k.double + n * sec(0.35), sec(0.25)) : 0))}
        <ChalkText x={-120} y={-805} w={700} size={42} text="الفرق يتضاعف كل 4 أيام تقريبًا" o={prog(f, k.double + sec(0.9), sec(0.35))} color={C.chalkDim} />
        {Array.from({ length: STRIP.n }, (_, i) => {
          const o = prog(f, k.why + (i * (k.limit - k.why)) / (STRIP.n + 1), sec(0.2));
          const cx = STRIP.x - i * STRIP.step, known = i < STRIP.limit;
          return o > 0 && <g key={i} transform={`translate(${cx} ${STRIP.y})`} opacity={o * (known ? 1 - 0.12 * i : 0.9)}>
            <rect x={-36} y={-40} width={72} height={80} rx={9} fill="none" stroke={C.chalkDim} strokeWidth={4} />
            {known ? (icon(i) === 'sun' ? <Sun o={1} s={0.62} f={0} /> : <Cloud s={0.7} rain={icon(i) === 'rain'} />)
              : <ChalkText x={-36} y={-42} w={72} size={54} text="؟" o={1} />}
          </g>;
        })}
        {stripP > 0 && <Chalk d={`M${STRIP.x - (STRIP.limit - 0.5) * STRIP.step} ${STRIP.y - 60} L${STRIP.x - (STRIP.limit - 0.5) * STRIP.step} ${STRIP.y + 50}`} w={7} p={limitP} color={C.run2Soft} />}
        <ChalkText x={STRIP.x - (STRIP.limit - 0.5) * STRIP.step - 130} y={STRIP.y + 48} w={260} size={44} text="أسبوعين" o={limitP} color={C.run2Soft} />
      </Hall>
      <Actor f={f} d={who({
        pose: [{ at: 0, to: p }],
        face: [F(0, 'calm', { gx: 0.9, gy: -0.2 }), F(k.weather, 'thinking', { gx: 1, gy: 0.2 }, sec(0.3)),
          F(k.grow, 'determined', { gx: 1, gy: -0.6 }, sec(0.3)), F(k.limit + sec(0.6), 'calm', { gx: 0.2, gy: 0 }, sec(0.3))],
        handF: 'pinch', handN: f > k.limit + sec(0.5) ? 'open' : 'fist', holdF: <g transform={`scale(${1 / SB})`}><ChalkStick /></g>,
      })} />
    </>} />
  );
};

// the map in board space: the Americas' box placed on the board's right half
const MAP = { x: 150, y: -1070, s: 1.0 };
const mapPt = ([x, y]: [number, number]): [number, number] => [MAP.x + x * MAP.s, MAP.y + y * MAP.s];
const MAP_CAM = { x: 330, y: -800, z: 1.42 };
/** Labels and marks on the map that R7 draws and R8 keeps (so the cut between them is invisible). */
const MapMarks: React.FC<{ f: number; brazil: number; texas: number; storm: number; ask: number; fade?: number }> = ({ f, brazil, texas, storm, ask, fade = 0 }) => {
  const br = mapPt(AMERICAS.brazil), tx = mapPt(AMERICAS.texas);
  return <g opacity={1 - 0.5 * fade}>
    <ChalkText x={br[0] - 120} y={br[1] + 34} w={240} size={40} text="البرازيل" o={brazil} />
    <ChalkText x={tx[0] - 330} y={tx[1] - 34} w={220} size={40} text="تكساس" o={texas} align="right" />
    <g transform={`translate(${tx[0]} ${tx[1] + 10})`}><Tornado f={f} o={storm} s={1.0} /></g>
    <ChalkText x={tx[0] + 20} y={tx[1] - 150} w={90} size={80} text="؟" o={ask * (1 - fade)} color={C.run2Soft} />
  </g>;
};

export type NameBeats = { start: number; draw: number; title: number; lift: number; brazil: number; launch: number; storm: number; texas: number; end: number };
/** R7: he draws a butterfly; it comes alive and flies to Brazil on a chalk map; a dashed path to Texas, a storm, a question mark. */
export const Name: React.FC<{ f: number; k: NameBeats }> = ({ f, k }) => {
  const BF: [number, number] = [-40, -620];
  const drawP = prog(f, k.draw, k.lift - k.draw - sec(0.2), (t) => t);
  const alive = prog(f, k.lift - sec(0.3), sec(0.35));
  const flyT = prog(f, k.lift + sec(0.1), k.brazil - k.lift + sec(0.1), ease.inOut);
  const br = mapPt(AMERICAS.brazil), tx = mapPt(AMERICAS.texas);
  const bf: [number, number] = flyT <= 0 ? BF : [mix(BF[0], br[0], flyT), mix(BF[1], br[1] - 30, flyT) - 140 * Math.sin(flyT * Math.PI)];
  const mapP = prog(f, k.draw, k.lift - k.draw, (t) => t);
  const pathP = prog(f, k.launch, k.storm - k.launch + sec(0.4), (t) => t);
  const stand = pose('stand', { headTurn: 0.85, lean: 4 });
  const p = follow(f, [
    { at: 0, to: stand },
    { at: k.lift + sec(0.2), to: pose('stand', { headTurn: 0.7, headTilt: -10, lean: -2 }), dur: sec(0.5) },
  ], [
    { from: k.draw, to: k.lift - sec(0.2), at: (g) => drawing(stand, BF[0], BF[1], 52, prog(g, k.draw, k.lift - k.draw - sec(0.2), (t) => t)), enter: sec(0.3) },
  ]);
  const push = prog(f, k.brazil - sec(0.9), sec(1.1), ease.inOut);
  return (
    <Frame c={camMix({ x: 175, y: -740, z: 1.05 }, MAP_CAM, push)} bg={C.bg} world={<>
      <Hall>
        <g transform={`translate(${MAP.x} ${MAP.y}) scale(${MAP.s})`}>
          <Chalk d={AMERICAS.north} p={mapP} w={5} color={C.chalkDim} />
          <Chalk d={AMERICAS.south} p={mapP} w={5} color={C.chalkDim} />
        </g>
        <Chalk d={`M${br[0]} ${br[1]} C${br[0] + 60} ${br[1] - 90} ${tx[0] + 120} ${tx[1] + 40} ${tx[0]} ${tx[1]}`} p={pathP} w={5} color={C.chalk} />
        <MapMarks f={f} brazil={prog(f, k.brazil - sec(0.1), sec(0.3))} texas={prog(f, k.texas - sec(0.1), sec(0.3))} storm={prog(f, k.storm, sec(0.3))} ask={prog(f, k.texas + sec(0.25), sec(0.3))} />
        {/* the butterfly: chalk lines while he draws, then colour and wings */}
        <g transform={`translate(${bf[0]} ${bf[1]}) rotate(${flyT > 0 && flyT < 1 ? -14 : 0})`}>
          {drawP > 0 && <g opacity={1 - alive}><Butterfly flap={0} s={1.15} chalk draw={drawP} /></g>}
          {alive > 0 && <g opacity={alive}><Butterfly flap={f < k.lift ? 0 : flyT >= 1 ? flapAt(f, 60, 2.5) : flapAt(f)} s={mix(1.15, 0.8, flyT)} color={alive} /></g>}
        </g>
      </Hall>
      <Actor f={f} d={who({
        pose: [{ at: 0, to: p }],
        face: [F(0, 'thinking', { gx: 1, gy: 0.1 }), F(k.lift, 'surprised', { gx: 0.8, gy: -0.6, mouth: 0.4 }, sec(0.2)),
          F(k.lift + sec(0.7), 'smile', { gx: 1, gy: -0.6 }, sec(0.3))],
        handF: 'pinch', handN: 'fist', holdF: <g transform={`scale(${1 / SB})`}><ChalkStick /></g>,
      })} />
    </>} />
  );
};

export type AnswerBeats = { start: number; answer: number; storm: number; calm: number; unknown: number; end: number };
/** R8: he turns to us. The storm on one side, a clear sky on the other — the same flap could help either. A shrug, two question marks. */
export const Answer: React.FC<{ f: number; k: AnswerBeats }> = ({ f, k }) => {
  const tx = mapPt(AMERICAS.texas), br = mapPt(AMERICAS.brazil);
  const sunAt: [number, number] = [tx[0] + 190, tx[1] - 20];
  const unknown = prog(f, k.unknown, sec(0.4));
  const p = follow(f, [
    { at: 0, to: pose('stand', { headTurn: 0.6, lean: 2 }) },
    { at: k.answer + sec(0.55), to: pose('point', { headTurn: 0.1, shF: 150, elF: 12, lean: 0 }), dur: sec(0.4) },
    { at: k.storm, to: reach(pose('stand', { headTurn: 0.35, lean: 3 }), 'F', tc([tx[0] - 120, tx[1] + 120]), 'open'), dur: sec(0.45) },
    { at: k.calm, to: reach(pose('stand', { headTurn: 0.35, lean: 3 }), 'F', tc([sunAt[0] - 130, sunAt[1] + 140]), 'open'), dur: sec(0.45) },
    { at: k.unknown - sec(0.1), to: pose('shrug', { headTurn: 0.05 }), dur: sec(0.35) },
  ]);
  return (
    <Frame c={(() => { const q = prog(f, k.start + sec(0.1), sec(1.0), ease.inOut); const c = camMix(MAP_CAM, { x: 175, y: -680, z: 1.05 }, q); return { ...c, y: MAP_CAM.y + (-680 - MAP_CAM.y) * Math.min(1, q * 1.6) }; })()} bg={C.bg} world={<>
      <Hall>
        <g transform={`translate(${MAP.x} ${MAP.y}) scale(${MAP.s})`}>
          <Chalk d={AMERICAS.north} w={5} color={C.chalkDim} o={1 - 0.5 * unknown} />
          <Chalk d={AMERICAS.south} w={5} color={C.chalkDim} o={1 - 0.5 * unknown} />
        </g>
        <Chalk d={`M${br[0]} ${br[1]} C${br[0] + 60} ${br[1] - 90} ${tx[0] + 120} ${tx[1] + 40} ${tx[0]} ${tx[1]}`} w={5} o={1 - 0.5 * unknown} />
        <g transform={`translate(${br[0]} ${br[1] - 30})`}><Butterfly flap={flapAt(f, 60, 2.5)} s={0.8} /></g>
        <MapMarks f={f} brazil={1} texas={1} storm={1} ask={1 - prog(f, k.storm, sec(0.4))} fade={unknown} />
        <ChalkText x={tx[0] + 40} y={tx[1] - 40} w={100} size={46} text="أو" o={prog(f, k.calm - sec(0.1), sec(0.3))} />
        <g transform={`translate(${sunAt[0]} ${sunAt[1]})`}><Sun o={prog(f, k.calm, sec(0.35))} s={1.1} f={f} /></g>
        <ChalkText x={tx[0] - 70} y={tx[1] - 260} w={140} size={140} text="؟" o={unknown} color={C.run2Soft} />
        <ChalkText x={sunAt[0] - 70} y={sunAt[1] - 250} w={140} size={140} text="؟" o={prog(f, k.unknown + sec(0.2), sec(0.4))} color={C.run2Soft} />
      </Hall>
      <Actor f={f} d={who({
        pose: [{ at: 0, to: p }],
        face: [F(0, 'smile', { gx: 1, gy: -0.4 }), F(k.answer, 'determined', { gx: 0, gy: 0 }, sec(0.3)),
          F(k.storm, 'thinking', { gx: 1, gy: -0.6 }, sec(0.3)), F(k.unknown, 'smile', { gx: 0, gy: 0, brow: 0.5, browY: 0.5 }, sec(0.3))],
        handF: f < k.storm ? 'point' : 'open', handN: f >= k.unknown - sec(0.1) ? 'open' : 'fist',
      })} />
    </>} />
  );
};
