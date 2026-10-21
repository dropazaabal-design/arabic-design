import React from 'react';
import { Bubble, pose, type Pose } from '../../../../motion-core/src/cartoon';
import { reach } from '../../../../motion-core/src/characters/SvgPerson';
import { CLOCK, Carton, DOOR, HANDLE, Panel, PhoneLog, Ring, Room, Screw, Shelf, SmallBook, Table, WORK_X } from '../props';
import { Actor, F, Frame, camMix, follow, plantedWalk, reportText, toChar, type Cam } from '../stage';
import { C, NASER, SAFE } from '../theme';
import { ease, life, mix, prog, sec } from '../time';
import { BODY, TITLE } from '../fonts';

const S = 1.7;
const stand = (extra: Partial<Pose> = {}) => pose('stand', { headTurn: 0.85, ...extra });
const BOX_X = WORK_X - 30; // the carton, base centre
const SHELF_X = WORK_X + 420; // where the shelf is built

// ——— R1 · four o'clock, guests at seven: he rips the carton open — "an hour and I'm done" ———
export type OpenBeats = { start: number; seven: number; down: number; open: number; say: number; one: number; end: number };
export const Open: React.FC<{ f: number; k: OpenBeats }> = ({ f, k }) => {
  const X = -90, tc = toChar(X, 0, S);
  const flap = prog(f, k.open, sec(0.35), ease.out);
  const p = follow(f, [
    { at: 0, to: stand({ headTurn: 0.9, headTilt: 6 }) },
    { at: k.open - sec(0.45), to: reach(stand({ lean: 22, headTilt: 12 }), 'N', tc([BOX_X - 120, -126]), 'grip'), dur: sec(0.4) },
    { at: k.open + sec(0.05), to: reach(stand({ lean: 4, headTilt: 4 }), 'N', tc([BOX_X - 220, -230]), 'grip'), dur: sec(0.25) }, // the flap tears up
    { at: k.say, to: stand({ headTurn: 0.25, headTilt: -4, chest: 0.6, shF: 150, elF: 20, shN: -10, elN: 20 }), dur: sec(0.4) }, // to us, one finger up
  ]);
  // a cut, not a tilt, from the clock to him on «الساعة أربع»: a tilt would drag his face up under the captions
  const c: Cam = f < k.down ? { x: CLOCK.x + 70, y: CLOCK.y + 20, z: 3.0 + 0.1 * prog(f, 0, k.down) } : camMix({ x: 40, y: -600, z: 1.5 }, { x: 40, y: -560, z: 1.42 }, prog(f, k.down, sec(1.2), ease.out));
  return (
    <Frame c={c} bg={C.bg} world={<>
      <Room id="open" clockMin={16 * 60 + (f - k.start) / 60 / 4} note="الضيوف 7:00" />
      {/* the note pulses when the voice says seven */}
      <circle cx={CLOCK.x + CLOCK.r * 1.2} cy={CLOCK.y + CLOCK.r * 0.5} r={110} fill="none" stroke={C.clock} strokeWidth={8} opacity={life(f, k.seven, k.seven + sec(1.0), sec(0.15), sec(0.4))} />
      <g transform={`translate(${BOX_X} 0)`}><Carton w={360} h={120} open={flap} /></g>
      {flap > 0 && <g transform={`translate(${BOX_X + 40} ${-118 - 30 * flap})`}><g transform="scale(1 0.3)"><Panel w={300} h={90} /></g></g>}
      <g transform={`translate(${SHELF_X} 0)`} opacity={0}><Shelf built={0} /></g>
      <Actor f={f} d={{
        look: NASER, id: 'open', seed: 41, x: X, y: 0, scale: S, facing: 1, pose: [{ at: 0, to: p }],
        face: [F(0, 'smile', { gx: 1, gy: 0.6 }), F(k.open, 'determined', { gx: 1, gy: 0.7 }, sec(0.15)),
          F(k.say, 'proud', { gx: 0, gy: 0, sparkle: 0.6 }, sec(0.25)), F(k.one, 'grin', { gx: 0, gy: 0, sparkle: 0.8 }, sec(0.2))],
        handN: f > k.open - sec(0.5) && f < k.say ? 'grip' : 'open', handF: f >= k.say ? 'point' : 'open',
      }} />
    </>} />
  );
};

// ——— R3–R4 · on the floor among the pieces: the best case he planned on, and Kahneman's own eight years ———
export type FloorBeats = { start: number; name: number; best: number; pop: number; author: number; two: number; expert: number; eight: number; end: number };
export const Floor: React.FC<{ f: number; k: FloorBeats }> = ({ f, k }) => {
  const X = -40, Y = 74 * S; // sitting on the floor: the hips rest on it, the legs out in front
  const sit = (extra: Partial<Pose> = {}) => pose('seated', { hipF: 86, knF: -6, hipN: 82, knN: -4, headTurn: 0.6, shF: 20, elF: 30, shN: 25, elN: 40, ...extra });
  const dream = prog(f, k.best + sec(0.2), k.pop - k.best - sec(0.2), ease.inOut);
  const bubble = life(f, k.best, k.pop + sec(0.25), sec(0.35), sec(0.2));
  const pop = prog(f, k.pop, sec(0.7), (x) => x);
  const c: Cam = camMix({ x: 120, y: -390, z: 1.42 }, { x: 140, y: -410, z: 1.46 }, prog(f, k.start, k.end - k.start, ease.inOut)); // low enough that a sitting face stays above the captions
  const showYears = f >= k.author - sec(0.2);
  return (
    <>
      <Frame c={c} bg={C.bg} world={<>
        <Room id="floor" clockMin={19 * 60 + 5 + (f - k.start) / 60 / 2} note="الضيوف 7:00" dusk={0.85} />
        <g transform={`translate(${SHELF_X} 0)`}><Shelf built={0.44} /></g>
        {/* pieces on the floor round him */}
        <g transform={`translate(${X + 330} 50)`}><path d="M-200 0 L200 0 L186 -26 L-186 -26 Z" fill={C.panel} stroke={C.ink} strokeWidth={4} /></g>
        <g transform={`translate(${X - 260} 70) rotate(-8)`}><path d="M-150 0 L150 0 L138 -22 L-138 -22 Z" fill={C.panel} stroke={C.ink} strokeWidth={4} /></g>
        {/* «as if not one screw would argue»: one springs out of the shelf */}
        {pop > 0 && pop < 1 && <g transform={`translate(${SHELF_X - 150 - 380 * pop} ${-300 - 260 * Math.sin(pop * Math.PI)}) rotate(${pop * 720})`}><Screw s={1.6} /></g>}
        <Actor f={f} d={{
          look: NASER, id: 'floor', seed: 43, x: X, y: Y, scale: S, facing: 1,
          pose: [
            { at: 0, to: sit({ lean: -6, headTilt: 10 }) },
            { at: k.best, to: sit({ lean: -4, headTilt: -10, headTurn: 0.5 }), dur: sec(0.4) },
            { at: k.pop + sec(0.05), to: sit({ lean: -14, headTilt: 8, shN: 120, elN: 70 }), dur: sec(0.15) }, // flinches from it
            { at: k.pop + sec(0.6), to: sit({ lean: -4, headTilt: 4, headTurn: 0.4 }), dur: sec(0.4) },
            { at: k.author, to: sit({ lean: 0, headTilt: -8, headTurn: 0.35 }), dur: sec(0.4) },
            { at: k.eight, to: sit({ lean: -8, headTilt: 10, headTurn: 0.3, shF: 30, elF: 110, shN: 30, elN: 110 }), dur: sec(0.35) }, // laughs at himself
          ],
          face: [
            F(0, 'sad', { gx: 0.4, gy: 0.4 }), F(k.best, 'dreamy', { gx: 0.4, gy: -0.9 }, sec(0.3)),
            F(k.pop + sec(0.05), 'wince', { gx: 1, gy: -0.3, sweat: 0.8 }, sec(0.1)),
            F(k.author, 'thinking', { gx: 0.2, gy: -0.9 }, sec(0.3)), F(k.expert + sec(0.4), 'surprised', { gx: 0.2, gy: -0.9 }, sec(0.2)),
            F(k.eight, 'grin', { gx: 0, gy: 0, lid: 0.3, lidLow: 0.5 }, sec(0.25)),
          ],
          handF: 'open', handN: 'open',
        }} />
        <Bubble id="dream" x={X + 160} y={-1000} w={460} h={300} tail={[X + 60, -640]} pop={bubble} fill="#EEF0F8">
          <g transform="translate(-60 120) scale(0.42)"><Shelf built={dream} books={dream > 0.95 ? 1 : 0} /></g>
          <g transform="translate(120 -10) scale(0.5)"><circle r={90} fill={C.paper} stroke={C.ink} strokeWidth={8} />
            <path d={`M0 0 L0 -70`} stroke={C.clockDeep} strokeWidth={10} strokeLinecap="round" transform={`rotate(${dream * 360})`} /><circle r={10} fill={C.ink} /></g>
        </Bubble>
      </>} />
      {showYears && <Years f={f} k={k} />}
    </>
  );
};

/** Kahneman's textbook in three lines and one bar: their estimate (2 years), the expert's floor (no team under 7), what it took (about 8). */
const Years: React.FC<{ f: number; k: FloorBeats }> = ({ f, k }) => {
  const o = life(f, k.author - sec(0.2), k.end, sec(0.3), sec(0.25));
  const fill = prog(f, k.two, sec(0.5)) * 2 + prog(f, k.eight - sec(0.1), sec(0.9), ease.inOut) * 6;
  const w = 820, x0 = (1080 - w) / 2, top = SAFE.y0 + 30, hgt = 400;
  reportText(f, 'years', [x0, top, x0 + w, top + hgt]);
  const rows = [[k.two, 'تقديرهم', 'سنتين', C.clockDeep], [k.expert + sec(0.3), 'الفرق قبلهم', 'ما أحد أقل من 7', C.red], [k.eight, 'الواقع', 'قرابة 8 سنين', C.ink]] as const;
  return (
    <div dir="rtl" style={{ position: 'absolute', left: x0, top, width: w, height: hgt, opacity: o, background: 'rgba(247,248,251,0.95)', border: `4px solid ${C.ink}`, borderRadius: 28,
      padding: '18px 34px', boxSizing: 'border-box', fontFamily: TITLE, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 800, fontSize: 44, color: C.ink, textAlign: 'center' }}>كتاب مدرسي… كم سنة؟</div>
      {/* the bar fills right to left, one tick per year */}
      <div style={{ position: 'relative', height: 40, borderRadius: 12, border: `4px solid ${C.ink}`, overflow: 'hidden', background: C.paper }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${(fill / 10) * 100}%`, background: C.clock }} />
        <div style={{ position: 'absolute', right: '70%', top: 0, bottom: 0, width: '30%', background: C.red, opacity: 0.22 * prog(f, k.expert + sec(0.3), sec(0.4)) }} />
      </div>
      {rows.map(([at, label, value, col]) => {
        const a = prog(f, at, sec(0.35));
        return <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: a, transform: `translateY(${mix(10, 0, a)}px)` }}>
          <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 38, color: C.mist }}>{label}</span>
          <span style={{ fontWeight: 800, fontSize: label === 'الواقع' ? 58 : 46, color: col }}>{value}</span>
        </div>;
      })}
    </div>
  );
};

// ——— R5 · late that night: done at nine; he photographs it (the record he will need) ———
export type PhotoBeats = { start: number; wrong: number; right: number; last: number; end: number };
export const Photo: React.FC<{ f: number; k: PhotoBeats }> = ({ f, k }) => {
  const X = SHELF_X - 330, tc = toChar(X, 0, S);
  const shoot = reach(stand({ headTurn: 0.85, headTilt: -2 }), 'F', tc([X + 170, -640]), 'grip');
  const p = follow(f, [{ at: 0, to: stand({ headTurn: 0.8, headTilt: 6, lean: 2 }) }, { at: k.last - sec(0.6), to: shoot, dur: sec(0.45) }]);
  const flash = prog(f, k.last + sec(0.4), sec(0.05)) * (1 - prog(f, k.last + sec(0.45), sec(0.35)));
  const c: Cam = camMix({ x: SHELF_X - 160, y: -560, z: 1.45 }, { x: SHELF_X - 140, y: -580, z: 1.55 }, prog(f, k.start, k.end - k.start, ease.inOut));
  const marks = [[k.wrong, 'كم بياخذ معي؟', false], [k.right, 'كم أخذ مع غيري؟', true], [k.last, 'وكم أخذ معي آخر مرة؟', true]] as const;
  const top = SAFE.y0 + 30;
  reportText(f, 'questions', [SAFE.x0, top, SAFE.x1, top + 3 * 96]);
  return (
    <>
      <Frame c={c} bg={C.bg} world={<>
        <Room id="photo" clockMin={21 * 60 + (f - k.start) / 60} dusk={1} />
        <g transform={`translate(${SHELF_X} 0)`}><Shelf built={1} books={0.35} /></g>
        <Actor f={f} d={{
          look: NASER, id: 'photo', seed: 45, x: X, y: 0, scale: S, facing: 1, pose: [{ at: 0, to: p }],
          face: [F(0, 'relieved', { gx: 1, gy: -0.3, sweat: 0.5 }), F(k.last - sec(0.5), 'smile', { gx: 1, gy: -0.1 }, sec(0.3))],
          handF: f >= k.last - sec(0.7) ? 'grip' : 'open', handN: 'open',
          holdF: f >= k.last - sec(0.7) ? <g transform={`scale(${0.42 / S})`}><PhoneLog glow={0.4} /></g> : undefined, holdUpright: 'F',
        }} />
      </>} />
      <div style={{ position: 'absolute', top, left: SAFE.x0, width: SAFE.x1 - SAFE.x0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        {marks.map(([at, t, ok]) => {
          const o = prog(f, at - sec(0.1), sec(0.3));
          const struck = !ok && f >= k.right - sec(0.1);
          return <div key={t} dir="rtl" style={{ opacity: o * (struck ? 0.55 : 1), fontFamily: TITLE, fontWeight: 800, fontSize: ok ? 66 : 58, color: ok ? C.clockDeep : C.ink,
            textDecoration: struck ? `line-through ${C.red} 7px` : 'none', background: 'rgba(247,248,251,0.92)', borderRadius: 18, padding: '0 22px 6px', whiteSpace: 'nowrap',
            transform: `translateY(${mix(14, 0, o)}px)` }}>{t}</div>;
        })}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF', opacity: 0.7 * flash }} />
    </>
  );
};

// ——— R6 · a month on: a table this time; before opening it he opens his phone — five hours. He starts at noon. ———
export type MonthBeats = { start: number; phone: number; five: number; noon: number; end: number };
export const Month: React.FC<{ f: number; k: MonthBeats }> = ({ f, k }) => {
  const X = -90, tc = toChar(X, 0, S);
  const look = reach(stand({ headTurn: 0.75, headTilt: 16, lean: 4 }), 'F', tc([X + 160, -420]), 'grip');
  const flap = prog(f, k.noon + sec(0.5), sec(0.35));
  const p = follow(f, [
    { at: 0, to: stand({ headTurn: 0.9, headTilt: 8 }) },
    { at: k.phone - sec(0.5), to: look, dur: sec(0.45) },
    { at: k.noon, to: stand({ headTurn: 0.6, headTilt: -14 }), dur: sec(0.3) }, // up at the clock: twelve
    { at: k.noon + sec(0.15), to: reach(stand({ lean: 22, headTilt: 12 }), 'N', tc([BOX_X - 120, -126]), 'grip'), dur: sec(0.35) },
    { at: k.noon + sec(0.55), to: reach(stand({ lean: 6, headTilt: 6 }), 'N', tc([BOX_X - 220, -230]), 'grip'), dur: sec(0.25) },
  ]);
  const c: Cam = f < k.noon - sec(0.1)
    ? camMix({ x: 20, y: -560, z: 1.42 }, { x: X + 175, y: -520, z: 2.9 }, prog(f, k.phone - sec(0.1), sec(0.5), ease.inOut)) // the screen fills the frame
    : { x: 0, y: -640, z: 1.3 };
  return (
    <Frame c={c} bg={C.bg} world={<>
      <Room id="month" clockMin={f < k.noon ? 11 * 60 + 50 + (f - k.start) / 60 / 4 : 12 * 60} />
      <g transform={`translate(${SHELF_X} 0)`}><Shelf built={1} books={1} /></g>
      <g transform={`translate(${BOX_X} 0)`}><Carton w={360} h={120} open={flap} label="table" /></g>
      <Actor f={f} d={{
        look: NASER, id: 'month', seed: 47, x: X, y: 0, scale: S, facing: 1, pose: [{ at: 0, to: p }],
        face: [F(0, 'calm', { gx: 1, gy: 0.6 }), F(k.phone, 'thinking', { gx: 1, gy: 0.8 }, sec(0.25)), F(k.five, 'surprised', { gx: 1, gy: 0.8 }, sec(0.15)),
          F(k.noon, 'determined', { gx: 0.2, gy: -1 }, sec(0.2)), F(k.noon + sec(0.4), 'determined', { gx: 1, gy: 0.7 }, sec(0.2))],
        handF: f >= k.phone - sec(0.55) && f < k.noon ? 'grip' : 'open', handN: f > k.noon && f < k.noon + sec(1.2) ? 'grip' : 'open',
        holdF: f >= k.phone - sec(0.55) && f < k.noon ? <g transform={`translate(0 ${-100 / S}) scale(${0.8 / S})`}><PhoneLog result={prog(f, k.five, sec(0.3))} glow={1} /></g> : undefined, holdUpright: 'F',
      }} />
    </>} />
  );
};

// ——— R6–R7 · seven o'clock again, the same framing as the first time: now it is ready. He opens the door; the question. ———
export type DoorBeats = { start: number; ring: number; ready: number; walk: number; handle: number; ask: number; end: number };
export const Door: React.FC<{ f: number; k: DoorBeats }> = ({ f, k }) => {
  const xFrom = SHELF_X - 250, xTo = HANDLE[0] - 205;
  const w = plantedWalk(f, xFrom, xTo, k.walk, k.handle - k.walk - sec(0.25), S);
  const tc = toChar(w.x, 0, S);
  const atHandle = reach(stand({ headTurn: 0.85, lean: 2 }), 'F', tc(HANDLE), 'grip');
  const pull = prog(f, k.handle + sec(0.15), sec(0.7), ease.inOut);
  const opened = reach(stand({ headTurn: 0.8, lean: -4 }), 'F', tc([HANDLE[0] - 120 * pull, HANDLE[1]]), 'grip');
  const p = follow(f, [
    { at: 0, to: reach(stand({ headTurn: 0.6, headTilt: -4 }), 'F', tc([SHELF_X - 60, -300]), 'grip') }, // sliding the last book in
    { at: k.ring + sec(0.1), to: stand({ headTurn: 1, headTilt: -6, chest: 0.4 }), dur: sec(0.35) }, // to the door, unhurried
    { at: k.handle - sec(0.3), to: atHandle, dur: sec(0.3) },
    { at: k.handle + sec(0.15), to: opened, dur: sec(0.7) },
    { at: k.ask, to: { ...opened, headTurn: 0.1, headTilt: 4 }, dur: sec(0.35) }, // to us
    { at: k.ask + sec(0.5), to: { ...stand({ headTurn: 0.1, headTilt: 4, chest: 0.5 }), shN: -150, elN: -20 }, dur: sec(0.35) }, // one finger, like the start
  ]);
  const ringO = prog(f, k.ring, sec(0.15)) * (1 - prog(f, k.ring + sec(1.3), sec(0.3)));
  const c: Cam = f < k.ask - sec(0.2)
    ? { x: 250, y: -560, z: 1.05 }
    : camMix({ x: 250, y: -560, z: 1.05 }, { x: xTo + 60, y: -470, z: 1.75 }, prog(f, k.ask - sec(0.2), sec(0.9), ease.inOut));
  const bookIn = f >= k.ring;
  return (
    <Frame c={c} bg={C.bg} world={<>
      <Room id="door" clockMin={19 * 60 + (f - k.start) / 60 / 4} note="الضيوف 7:00" dusk={0.55} door={pull} />
      <Ring o={ringO} f={f} />
      <g transform={`translate(${SHELF_X} 0)`}><Shelf built={1} books={bookIn ? 1 : 0.94} /></g>
      <g transform={`translate(${WORK_X - 120} 0)`}><Table built={1} /></g>
      <Actor f={f} d={{
        look: NASER, id: 'door', seed: 49, x: w.x, y: 0, scale: S, facing: 1, add: w.add, pose: [{ at: 0, to: p }],
        face: [F(0, 'calm', { gx: 1, gy: 0.2 }), F(k.ring + sec(0.1), 'smile', { gx: 1, gy: 0 }, sec(0.25)), F(k.ask, 'grin', { gx: 0, gy: 0, sparkle: 0.5 }, sec(0.25))],
        handF: f < k.ring || (f >= k.handle - sec(0.3) && f < k.ask + sec(0.4)) ? 'grip' : 'open', handN: f >= k.ask + sec(0.45) ? 'point' : 'open',
        holdF: f < k.ring ? <SmallBook color={C.bookC} /> : undefined, holdUpright: 'F',
      }} />
      {/* the guests: two shadows in the doorway light, never faces */}
      {pull > 0.5 && <g opacity={(pull - 0.5) * 2 * 0.35} fill={C.dusk}>
        <ellipse cx={DOOR.x + 40} cy={-420} rx={60} ry={70} /><rect x={DOOR.x - 10} y={-360} width={100} height={360} rx={40} />
        <ellipse cx={DOOR.x + 120} cy={-400} rx={52} ry={62} /><rect x={DOOR.x + 76} y={-345} width={90} height={345} rx={36} />
      </g>}
    </>} />
  );
};
