import React from 'react';
import { INK, LINE, PAL, clamp, lerp, rand, stroke, wobEllipse } from '@mukarram/characters/ink';
import { Puff, Sparkles, SpeedLines } from '@mukarram/characters/props';
import { POSES, Pose, mixPose, walkPose } from '@mukarram/characters/rig';
import { arc, handWorld, walked } from '@mukarram/scenes/helpers';
import { Shot } from '@mukarram/video/stage';
import { EMP_BUILD, Employee, Pencil, reach } from '../characters/employee';
import { C, CHAIR, Capsule, Crumple, DOOR, DoorSide, ManagerHand, Memo, Notebook, PadSheet, StampTool } from '../characters/office';
import { ease, keys, prog, sec, segStart, wordAt } from '../video/time';
import { ShotProps, X, idle, poseTrack, talkAt, vecTrack, xTrack } from './common';
import { B, BOARD, BOUNDS, Back, CAB_X, CHAIR_SIT, DOOR_X, EMP_DESK_X, FLOOR, Front, MEET_X, MEMO_OFF, MEMO_ON, STAMP_DESK, TUBE_L, TUBE_R, TUBE_Y, chairAt, dragX } from './world';

export type { ShotProps };

// Sixteen shots in one office. The clerk acts every beat with his body (weight, hands on things, eyes that
// move before the head); the camera only frames. Contacts (handle, pad, pins, stamps, hook, chair) are placed
// with the arm IK in ../characters/employee.tsx, so a hand is really on the thing it moves.

const S = 1.2;
type V = [number, number];
type At = { x: number; y: number; s: number; facing: 1 | -1 };
const at = (x: number, facing: 1 | -1 = 1, y = FLOOR): At => ({ x, y, s: S, facing });
const hand = (p: Pose, a: At, side: -1 | 1): V => handWorld(EMP_BUILD, p, side, a.x, a.y, a.s, a.facing);
const HATCH: V = [DOOR_X + DOOR.slotX, FLOOR + DOOR.slotY + 14];
const PAD: V = [DOOR_X, FLOOR + DOOR.padY];
const LEVER: V = [DOOR_X + DOOR.handleX, FLOOR + DOOR.handleY];
const LOCK: V = [DOOR_X + DOOR.handleX, FLOOR + DOOR.lockY];
const leverPt = (deg: number, d = 52): V => [LEVER[0] + Math.cos((deg * Math.PI) / 180) * d, LEVER[1] + Math.sin((deg * Math.PI) / 180) * d];
/** wrist height when the manager's stamp face sits on the pad */
const STAMP_DOWN = PAD[1] - 64;

/** A path through [frame, point] keys (eased per leg). */
const path = (f: number, k: Array<[number, V]>, e = ease.inOut): V => [keys(f, k.map(([t, p]) => [t, p[0]]), e), keys(f, k.map(([t, p]) => [t, p[1]]), e)];
/** A short nod: n dips of `amp` degrees over `dur` frames from `from`. */
const nod = (f: number, from: number, dur = 14, n = 1, amp = 9) => (f >= from && f < from + dur ? Math.sin(((f - from) / dur) * Math.PI * 2 * n) * amp * (1 - ((f - from) / dur) * 0.5) : 0);

const P: Record<string, Pose> = {
  stand: POSES.stand as Pose,
  pull: { ...(POSES.stand as Pose), legL: [-24, 14], legR: [16, -4], lean: -10, tilt: -6, handL: 'fist', handR: 'fist', stance: 0.8 },
  pullFoot: { ...(POSES.stand as Pose), legL: [-20, 12], legR: [92, 52], lean: -26, tilt: -12, handL: 'fist', handR: 'fist', stance: 0.8 },
  sitFloor: { ...(POSES.stand as Pose), legL: [84, 10], legR: [96, 20], lean: -14, tilt: -6, armL: [42, 24], armR: [-30, -118], handL: 'open', handR: 'open', stance: 0.6 },
  crouch: { ...(POSES.stand as Pose), legL: [40, 90], legR: [52, 100], lean: 26, tilt: 6, armL: [30, 20], armR: [30, 20], stance: 0.6 },
  sitChair: { ...(POSES.stand as Pose), legL: [-70, -70], legR: [70, 70], handL: 'mitten', handR: 'mitten' },
  bend: { ...(POSES.bend as Pose), lean: 48, tilt: 16, legL: [-8, 6], legR: [10, 10], handL: 'open', handR: 'pinch' },
};

/** Draws the clerk. Pass the pose AFTER any reach(). */
const Clerk: React.FC<{ a: At; pose: Pose; expr: ReturnType<typeof xTrack>; f: number; look?: V; glance?: V; talk?: number; bob?: boolean; earPencil?: boolean; pocket?: React.ReactNode; o?: number }> = ({ a, pose, expr, f, look = [0, 0], glance = [0, 0], talk = 0, bob = false, earPencil = true, pocket, o = 1 }) => {
  const id = idle(f, 41);
  return <Employee x={a.x} y={a.y} s={a.s} facing={a.facing} pose={pose} expr={expr} blink={id.blink} bob={bob ? id.bob : 0} look={look} glance={glance} talk={talk} earPencil={earPencil} pocket={pocket} shadow opacity={o} />;
};

/** The notebook in his shirt pocket (closed) and the folded memo that rides there later. */
const PocketBook: React.FC = () => <g><path d="M-16 -30 L16 -30 L16 10 L-16 10Z" fill={PAL.blue} {...stroke(LINE * 0.5)} /><path d="M-10 -24 L10 -24" stroke={C.paper} strokeWidth={3} /></g>;
const PocketMemo: React.FC = () => <g><PocketBook /><path d="M-4 -46 L26 -42 L22 6 L-8 2Z" fill={C.paper} {...stroke(LINE * 0.5)} /><path d="M2 -34 L18 -32" stroke={INK} strokeWidth={3} /></g>;

/** His arm coming back into a close-up from off-frame (the rig's thin limb, sleeve and mitten), for the second, weaker try. */
const ArmIn: React.FC<{ from: V; to: V; o?: number }> = ({ from, to, o = 1 }) => {
  const dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy) || 1;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const sl: V = [from[0] + dx * 0.25, from[1] + dy * 0.25];
  return (
    <g opacity={o}>
      <path d={`M${from[0]} ${from[1]} L${sl[0]} ${sl[1]}`} stroke={INK} strokeWidth={38} strokeLinecap="round" />
      <path d={`M${from[0]} ${from[1]} L${sl[0]} ${sl[1]}`} stroke={PAL.blueSoft} strokeWidth={38 - LINE * 1.6} strokeLinecap="round" />
      <path d={`M${from[0]} ${from[1]} L${to[0] - (dx / L) * 14} ${to[1] - (dy / L) * 14}`} {...stroke(12)} />
      <g transform={`translate(${to[0]} ${to[1]}) rotate(${ang - 90})`}><path d={wobEllipse(0, 6, 19, 21, 1201, 0.05, 9)} fill={PAL.white} {...stroke(LINE * 0.8)} /></g>
    </g>
  );
};

/** Falling bits (eraser crumbs) from a point, t in frames since start. */
const Crumbs: React.FC<{ x: number; y: number; t: number; blow?: number }> = ({ x, y, t, blow = 0 }) => (
  <g>{Array.from({ length: 7 }, (_, i) => {
    const tt = t - i * 2;
    if (tt < 0 || tt > 26) return null;
    const dx = (rand(i * 11) - 0.5) * 50 + blow * (tt * 6 + i * 4), dy = 0.5 * 1.1 * tt * tt * (1 - blow * 0.6);
    return <circle key={i} cx={x + dx} cy={y + dy} r={4 + rand(i) * 3} fill={PAL.redSoft} {...stroke(2)} opacity={1 - tt / 26} />;
  })}</g>
);

/* =============================== 01 · the pull =============================== */

const pullState = (f: number) => {
  const b = B();
  const heave = keys(f, [[0, 0.35], [b.pull1, 0.35], [b.pull1 + 6, 0.85], [b.pull1 + 14, 0.5], [b.pull2, 0.5], [b.pull2 + 6, 0.95], [b.pull2 + 12, 0.65], [b.pull3 - 4, 0.65], [b.pull3 + 4, 1]], ease.inOut);
  const foot = prog(f, b.pull3 - 6, 9, ease.back);
  const shake = heave > 0.8 ? Math.sin(f * 3.3) * 2.5 : 0;
  const a = at(-300 + shake);
  let pose = mixPose(P.pull, P.pullFoot, foot);
  pose = { ...pose, lean: pose.lean - 8 * heave, squash: -0.02 * heave };
  const lv = 6 + 22 * heave;
  pose = reach(pose, a, leverPt(lv, 30), leverPt(lv, 56));
  return { a, pose, heave, lv, rattle: heave > 0.4 ? Math.sin(f * 2.4) * 3 * heave : 0 };
};

/** «شدّ الباب بكل قوته…» — from frame 0 his hands are on the handle; he heaves, heaves harder, plants a foot on the door. */
export const PullWide: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  const st = pullState(f);
  const expr = xTrack(f, [[0, 'determined'], [b.pull2, X.strain]]);
  return (
    <Shot f={f} cam={{ cx: keys(f, [[t0, -160], [t1, -170]]), cy: 1230, zoom: keys(f, [[t0, 1.1], [t1, 1.17]]) }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} door={{ lever: st.lv, rattle: st.rattle }} />
      <Clerk a={st.a} pose={st.pose} expr={expr} f={f} look={[0.55, 0.1]} glance={[0.6, 0.4]} talk={st.heave > 0.9 ? 0.35 : 0} />
      <Front f={f} />
    </Shot>
  );
};

/* =============================== 02 · the lock =============================== */

/** «طق! ما انفتح.» — close on the lock: his hands slip off, the lever springs back, the bolt never moves; a weaker second try. */
export const LockClose: React.FC<ShotProps> = ({ f }) => {
  const b = B();
  const slip = b.slip;
  const before = f < slip;
  const st = pullState(Math.min(f, slip - 1));
  const fly = prog(f, slip, 7, ease.out);
  const a = { ...st.a, x: st.a.x - 300 * fly };
  const pose: Pose = before ? st.pose : { ...st.pose, lean: st.pose.lean - 30 * fly, armL: [60, 30], armR: [70, 20], handL: 'open', handR: 'open' };
  const tug0 = b.notOpen + 4;
  const tug = keys(f, [[tug0 + 8, 0], [tug0 + 10, 12], [tug0 + 14, 4], [tug0 + 16, 0]], ease.out);
  const spring = before ? st.lv : 26 * Math.cos((f - slip) * 0.85) * Math.exp(-(f - slip) * 0.22) + tug;
  const rattle = before ? st.rattle : f < slip + 2 ? -5 : 0;
  const web = f >= slip ? 0.9 * Math.sin((f - slip) * 0.7) * Math.exp(-(f - slip) * 0.1) : 0;
  const armTo = path(f, [[tug0, [-330, 1300]], [tug0 + 8, leverPt(tug, 40)], [tug0 + 16, leverPt(tug, 40)], [tug0 + 28, [-360, 1320]]], ease.inOut);
  const armO = f >= tug0 && f < tug0 + 28 ? 1 : 0;
  return (
    <Shot f={f} cam={{ cx: -90, cy: 1290, zoom: 3.0 }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} door={{ lever: spring, rattle, web }} />
      {fly < 1 && <Clerk a={a} pose={pose} expr={before ? X.strain : X.bonk} f={f} look={[0.55, 0.1]} glance={[0.6, 0.4]} />}
      {f >= slip && f < slip + 6 && <SpeedLines x={LEVER[0] - 40} y={LEVER[1]} ang={180} len={110} o={1 - (f - slip) / 6} />}
      <Puff x={LOCK[0] - 80} y={LOCK[1] + 6} t={prog(f, slip, 14, ease.out)} s={0.7} />
      <ArmIn from={[-420, 1360]} to={armTo} o={armO} />
    </Shot>
  );
};

/* =============================== 03 · stamp «مفتوح» =============================== */

/** The manager's hand coming out of the hatch to stamp the pad: wrist path for a stamp landing at `hit`. */
const stampPath = (f: number, out: number, hit: number, back: number): V =>
  path(f, [[out, HATCH], [out + 8, [70, 830]], [hit - 5, [16, 812]], [hit, [0, STAMP_DOWN]], [hit + 3, [0, STAMP_DOWN + 4]], [hit + 7, [6, 852]], [back, [10, 850]], [back + 8, HATCH]], ease.inOut);

/** «المدير قال: «الباب مفتوح».» — he's on the floor rubbing his shoulder; the hatch opens, the stamp lands: «مفتوح». */
export const StampOpen: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  const flap = keys(f, [[b.flap1, 0], [b.flap1 + 5, 1], [b.stamp1 + 18, 1], [b.stamp1 + 24, 0]]);
  const wrist = stampPath(f, b.flap1 + 3, b.stamp1, b.stamp1 + 14);
  const press = f >= b.stamp1 && f < b.stamp1 + 4 ? 1 : 0;
  const rub = f < b.stamp1 + 2 ? Math.sin(f * 0.55) * 9 : 0;
  const pose: Pose = { ...P.sitFloor, armR: f < b.stamp1 + 2 ? [-30 + rub, -118] : [20, -20], handR: f < b.stamp1 + 2 ? 'open' : 'mitten', tilt: -6 + (f >= b.stamp1 ? -6 : 0) };
  const expr = xTrack(f, [[t0, X.dazed], [b.flap1 + 4, 'curious'], [b.stamp1, 'surprised'], [b.stamp1 + 12, 'curious']]);
  const glance = vecTrack(f, [[t0, [0.3, 0]], [b.flap1 + 2, [0.5, -0.9]], [b.stamp1 - 2, [0.4, -0.7]]]);
  return (
    <Shot f={f} cam={{ cx: -80, cy: 1160, zoom: keys(f, [[t0, 1.22], [t1, 1.26]]) }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} door={{ flap }} />
      {flap > 0.4 && <ManagerHand from={HATCH} to={wrist} hold="stamp" press={press} />}
      <Clerk a={at(-270)} pose={pose} expr={expr} f={f} look={[0.4, -0.3]} glance={glance} />
    </Shot>
  );
};

/* =============================== 04 · the bump (side view) =============================== */

const SIDE_DOOR = 200;
const SideSet: React.FC<{ f: number; shake: number }> = ({ f, shake }) => (
  <g>
    <rect x={-1200} y={-200} width={2600} height={FLOOR + 200} fill={C.wall} />
    <rect x={-1200} y={FLOOR - 420} width={2600} height={420} fill={C.wallLow} />
    <path d={`M-1200 ${FLOOR - 420} L1400 ${FLOOR - 420}`} {...stroke(10, C.rail)} />
    <rect x={-1200} y={FLOOR} width={2600} height={900} fill={C.floor} />
    <path d={`M-1200 ${FLOOR} L1400 ${FLOOR}`} {...stroke()} />
    <DoorSide x={SIDE_DOOR} y={FLOOR} word={f >= B().stamp1 ? 'مفتوح' : null} shake={shake} />
  </g>
);

/** «ابتسم، حاول يعبر… وارتطم.» — he believes the sign: up, tie straightened, chest out, march — bonk. Eyes: sign → handle → a doubtful smile. */
export const BumpSide: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  const c = b.bump - 3;                       // contact frame
  const w = walked(f, b.go, c, -300, SIDE_DOOR - 104, 170);
  const crouchUp: Pose = { ...P.crouch, armL: [20, 10], armR: [20, 10] };
  const tie: Pose = { ...P.stand, armR: [-14, -124], handR: 'pinch', tilt: -4 };
  const proud: Pose = { ...P.stand, lean: -4, tilt: -7, armL: [14, 10], armR: [14, 10] };
  let pose = poseTrack(f, [[t0, P.sitFloor], [b.smile + 3, crouchUp], [b.smile + 11, P.stand], [b.smile + 16, tie], [b.go - 3, proud]], sec(0.2));
  let x = -300;
  if (f >= b.go && f < c) { pose = walkPose(w.phase, 1, proud); x = w.x; }
  if (f >= c) {
    x = keys(f, [[c, SIDE_DOOR - 100], [c + 10, SIDE_DOOR - 170]], ease.out);
    const k = f - c;
    pose = { ...P.stand, stance: 0.4, squash: k < 4 ? 0.13 * (1 - k / 4) : 0, lean: keys(f, [[c, 8], [c + 4, -16], [c + 10, 5], [c + 16, -2], [c + 22, 0]]), tilt: keys(f, [[c, -14], [c + 5, 10], [c + 12, -4], [c + 18, 0]]), armL: [34, 30], armR: [-8, -10] };
  }
  pose = { ...pose, stance: Math.min(pose.stance ?? 1, 0.45) };
  const expr = xTrack(f, [[t0, X.dazed], [b.smile, 'satisfied'], [b.go - 2, 'smug'], [c, X.bonk], [c + 8, 'surprised'], [c + 14, X.dazed], [c + 18, X.hesitant], [c + 27, { ...X.hesitant, mouth: 'smile' as const }]]);
  const glance = vecTrack(f, [[t0, [0.4, 0]], [b.smile, [0.6, -0.5]], [b.go, [0.7, 0]], [c + 12, [0.8, -0.95]], [c + 20, [0.8, 0.6]], [c + 27, [0.5, 0.1]]], sec(0.12));
  const shake = f >= c && f < c + 10 ? Math.sin(f * 3) * 4 * (1 - (f - c) / 10) : 0;
  return (
    <Shot f={f} cam={{ cx: -40, cy: 1150, zoom: 1.15, shake: f >= c && f < c + 5 ? 5 : 0 }} bounds={[-1200, -200, 1400, 2400]} bg={C.wall}>
      <SideSet f={f} shake={shake} />
      <Clerk a={at(x)} pose={pose} expr={expr} f={f} look={[0.85, 0]} glance={glance} />
      <Sparkles x={x + 40} y={FLOOR - 560} t={prog(f, c, 20, ease.linear)} r={110} n={5} color={PAL.blueSoft} seed={7} />
    </Shot>
  );
};

/* =============================== 05 · stamp «مغلق» =============================== */

/** «وبعد لحظة: «الباب مقفول من البداية!»» — the hand rips «مفتوح» off, crumples it, drops it; stamps «مغلق», then stamps it again and again. */
export const StampClosed: React.FC<ShotProps> = ({ f }) => {
  const b = B();
  const flap = keys(f, [[b.flap2, 0], [b.flap2 + 5, 1], [b.tap2b + 9, 1], [b.tap2b + 15, 0]]);
  const grab: V = [PAD[0] - 140, PAD[1] - 74];
  const ripEnd: V = [40, PAD[1] + 40];
  const ballAt: V = [30, PAD[1] - 10];
  const wristTear = path(f, [[b.flap2 + 3, HATCH], [b.tear1 - 2, grab], [b.tear1, grab], [b.tear1 + 10, ripEnd], [b.tear1 + 20, ballAt], [b.ball1, ballAt], [b.ball1 + 6, HATCH]], ease.inOut);
  const stampOut = b.ball1 + 6;
  const wristStamp = path(f, [[stampOut, HATCH], [b.stamp2 - 4, [14, 820]], [b.stamp2, [0, STAMP_DOWN]], [b.stamp2 + 3, [0, STAMP_DOWN + 4]], [b.stamp2 + 7, [4, 850]],
    [b.tap2a - 4, [6, 846]], [b.tap2a, [3, STAMP_DOWN]], [b.tap2a + 5, [6, 850]], [b.tap2b - 4, [4, 846]], [b.tap2b, [-3, STAMP_DOWN]], [b.tap2b + 5, [6, 850]], [b.tap2b + 10, HATCH]], ease.inOut);
  const stampPhase = f >= stampOut;
  const wrist = stampPhase ? wristStamp : wristTear;
  const hold = stampPhase ? 'stamp' : f >= b.tear1 + 14 && f < b.ball1 ? 'fist' : f >= b.tear1 - 2 && f < b.tear1 + 14 ? 'pinch' : 'none';
  const press = [b.stamp2, b.tap2a, b.tap2b].some((t) => f >= t && f < t + 3) ? 1 : 0;
  // the torn sheet: hangs from the hand by its corner, then is crumpled into the fist
  const peel = prog(f, b.tear1, 10, ease.out);
  const crush = prog(f, b.tear1 + 10, 8, ease.in);
  const fall = (f - b.ball1) / 12;
  return (
    <Shot f={f} cam={{ cx: 30, cy: 1000, zoom: 1.9 }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} door={{ flap }} hide={{ crumple: true }} />
      {f >= b.tear1 && f < b.tear1 + 16 && (
        <g transform={`translate(${wrist[0]} ${wrist[1]}) rotate(${32 * peel + 40 * crush}) scale(${1 - 0.75 * crush}) translate(142 68)`}><PadSheet x={0} y={0} word="مفتوح" crease={crush} /></g>
      )}
      {f >= b.tear1 + 16 && f < b.ball1 && <Crumple x={wrist[0] + 6} y={wrist[1] + 30} word="مفتوح" seed={2} s={0.9} />}
      {f >= b.ball1 && fall <= 1.4 && <Crumple x={lerp(ballAt[0] + 6, DOOR_X - 40, Math.min(1, fall))} y={lerp(ballAt[1] + 30, FLOOR - 30, Math.min(1, fall * fall))} word="مفتوح" seed={2} rot={fall * 120} />}
      {flap > 0.4 && <ManagerHand from={HATCH} to={wrist} hold={hold as 'stamp'} press={press} />}
    </Shot>
  );
};

/* =============================== 06 · «طبعًا!» and the eraser =============================== */

/** «هزّ رأسه: «طبعًا!»… ومحا ما كان مصدّقه قبل قليل.» — quick nods, a thumbs-up; the notebook says «مفتوح»; a moment of doubt; he rubs out his own note and blows the crumbs away. */
export const Erase: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  const a = at(-330);
  const nbOut = b.sure + 12, pen = nbOut + 10, hover = pen + 6;
  // body
  let pose = poseTrack(f, [[t0, P.stand], [b.sure - 6, { ...P.stand, armR: [118, 52], handR: 'thumb', tilt: 6 }], [b.sure + 12, P.stand]], sec(0.2), ease.back);
  pose = { ...pose, tilt: pose.tilt + nod(f, b.nod, 26, 3, 9) };
  // notebook: left hand from pocket to the front of his chest
  const pocketPt: V = [a.x - 0.25 * 150 * S, FLOOR - 192 - 0.6 * 196 * S];
  const nbHand = path(f, [[nbOut, pocketPt], [nbOut + 4, pocketPt], [nbOut + 12, [-430, 1290]]], ease.inOut);
  const open = prog(f, nbOut + 6, 8, ease.out);
  const showBook = f >= nbOut + 4;
  if (f >= nbOut) pose = reach(pose, a, nbHand, null, { L: 1 });
  // pencil: right hand to the ear, then over the word, then rubbing
  const ear: V = [a.x + 0.92 * 88 * S, 1063 - 0.18 * 94 * S + 8];
  const word: V = [-430 + 120 + 57, 1290 - 40 + 10];
  const rubbing = f >= b.erase0 && f < b.erase1;
  const pencilHand = rubbing
    ? ([word[0] + Math.sin((f - b.erase0) * 1.1) * 30, word[1] - 62 + Math.abs(Math.cos((f - b.erase0) * 1.1)) * 5] as V)
    : path(f, [[pen, hand(pose, a, 1)], [pen + 5, ear], [pen + 8, ear], [hover, [word[0] + 10, word[1] - 92]], [b.erase0 - 2, [word[0], word[1] - 84]], [b.erase0, [word[0], word[1] - 62]], [b.erase1, [word[0], word[1] - 62]], [b.erase1 + 6, [word[0] + 30, word[1] - 90]]], ease.inOut);
  if (f >= pen) pose = reach(pose, a, null, pencilHand, { R: 1 });
  pose = { ...pose, handL: f >= nbOut ? 'pinch' : pose.handL, handR: f >= pen + 7 ? 'pinch' : pose.handR };
  const earPencil = f < pen + 7;
  const talk = f >= b.sure - 2 && f < b.sure + 16 ? talkAt(f) : 0;
  const expr = xTrack(f, [[t0, 'neutral'], [b.nod, 'satisfied'], [b.sure - 2, 'laugh'], [b.sure + 14, 'satisfied'], [hover, 'curious'], [b.erase0 - 16, X.hesitant], [b.erase0 - 4, 'determined'], [b.blow, X.blow], [b.blow + 12, 'satisfied']]);
  const glance = vecTrack(f, [[t0, [0.5, -0.5]], [b.nod, [0.2, 0]], [nbOut + 6, [0.3, 0.7]], [b.erase0 - 16, [0.8, -0.8]], [b.erase0 - 8, [0.3, 0.7]], [b.blow + 12, [0.1, 0.2]]], sec(0.12));
  const nbPos: V = [nbHand[0] + 120, nbHand[1] - 40];
  return (
    <Shot f={f} cam={{ cx: keys(f, [[t0, -290], [nbOut + 4, -290], [nbOut + 14, -320]]), cy: keys(f, [[t0, 1170], [nbOut + 4, 1170], [nbOut + 14, 1200]]), zoom: keys(f, [[t0, 1.7], [nbOut + 4, 1.7], [nbOut + 14, 1.95]]) }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} />
      <Clerk a={a} pose={pose} expr={expr} f={f} look={[0.2, 0.1]} glance={glance} talk={talk} earPencil={earPencil} pocket={showBook ? undefined : <PocketBook />} />
      {showBook && (open < 0.5
        ? <g transform={`translate(${nbPos[0] - 60} ${nbPos[1]}) scale(${0.75})`}><path d="M-80 -100 L80 -100 L80 100 L-80 100Z" fill={PAL.blue} {...stroke(LINE * 0.8)} /></g>
        : <Notebook x={nbPos[0]} y={nbPos[1]} s={0.75} word="مفتوح" erase={prog(f, b.erase0, b.erase1 - b.erase0, ease.linear)} seed={6} />)}
      {f >= pen + 7 && <Pencil x={pencilHand[0]} y={pencilHand[1] + 20} rot={170} s={0.7} />}
      {f >= b.erase0 && <Crumbs x={word[0]} y={word[1] + 30} t={f - b.erase0} blow={f >= b.blow ? Math.min(1, (f - b.blow) / 4) : 0} />}
      <Puff x={word[0] - 30} y={word[1] - 20} t={prog(f, b.blow, 12, ease.out)} s={0.8} />
    </Shot>
  );
};

/* =============================== 07 · two tubes, two memos =============================== */

const CATCH_L: V = [-1420, 1060];
const CATCH_R: V = [-1080, 1060];
const MOUTH_L: V = [TUBE_L + 62, TUBE_Y - 7];
const MOUTH_R: V = [TUBE_R - 62, TUBE_Y - 7];
const SHOW_L: V = [-1432, 1150];
const SHOW_R: V = [-1068, 1150];

/** Capsules / memos he holds through shots 07–08, and the bits left on the desk. */
const DeskBits: React.FC<{ f: number; capsOnDesk: boolean; stamp?: boolean }> = ({ f, capsOnDesk, stamp = true }) => (
  <g>
    {capsOnDesk && <><Capsule x={-1500} y={1306} rot={90} s={0.8} open={1} /><Capsule x={-990} y={1306} rot={-90} s={0.8} open={1} /></>}
    {stamp && f < B().ok1 - 14 && <StampTool x={STAMP_DESK[0]} y={STAMP_DESK[1]} color={PAL.blue} s={0.9} />}
  </g>
);

/** «ثم وصلته ورقتان للاجتماع نفسه، في الساعة نفسها:» — the tubes rattle, two capsules shoot out, he catches one in each hand, pops them, unrolls two memos; 3:00 on both. */
export const Tubes: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  const a = at(EMP_DESK_X);
  const f1 = b.cap1, f2 = b.cap2, land1 = f1 + 9, land2 = f2 + 10;
  const c1 = f < land1 ? arc(MOUTH_L, CATCH_L, clamp((f - f1) / (land1 - f1)), 90) : null;
  const c2 = f < land2 ? arc(MOUTH_R, CATCH_R, clamp((f - f2) / (land2 - f2)), 100) : null;
  const jolt = (land: number) => (f >= land && f < land + 6 ? Math.sin(((f - land) / 6) * Math.PI) * 14 : 0);
  const lift = prog(f, b.open + 14, 10, ease.inOut);
  const hL: V = f < b.open + 14 ? [CATCH_L[0], CATCH_L[1] + jolt(land1) + (f < f1 - 4 ? 120 : f < land1 ? 120 * (1 - prog(f, f1 - 4, 8)) : 0)] : [lerp(CATCH_L[0], SHOW_L[0] - 20, lift), lerp(CATCH_L[1], SHOW_L[1], lift)];
  const hR: V = f < b.open + 14 ? [CATCH_R[0], CATCH_R[1] + jolt(land2) + (f < f2 - 4 ? 120 : f < land2 ? 120 * (1 - prog(f, f2 - 4, 8)) : 0)] : [lerp(CATCH_R[0], SHOW_R[0] + 20, lift), lerp(CATCH_R[1], SHOW_R[1], lift)];
  let pose: Pose = { ...P.stand, handL: f >= land1 ? 'fist' : 'open', handR: f >= land2 ? 'fist' : 'open', tilt: f >= b.rattle && f < f1 ? -8 : 0 };
  pose = reach(pose, a, hL, hR, { L: 1, R: 1 });
  const open = prog(f, b.open, 5, ease.out);
  const unroll = prog(f, b.open + 2, 14, ease.out);
  const capsHeld = f < b.open + 6;
  const expr = xTrack(f, [[t0, 'neutral'], [b.rattle, 'curious'], [land1, 'surprised'], [land2 + 2, 'satisfied'], [b.time - 4, X.sincere]]);
  const glance = vecTrack(f, [[t0, [0, 0]], [b.rattle, [0, -0.9]], [f1 - 3, [-0.7, -0.7]], [f2 - 3, [0.7, -0.7]], [b.open, [0, 0.4]], [b.open + 18, [0.7, -0.1]], [b.time, [-0.7, -0.1]], [b.time + 9, [0.7, -0.1]]], sec(0.12));
  const camT = prog(f, b.time - 14, 14, ease.inOut);
  return (
    <Shot f={f} cam={{ cx: -1250, cy: lerp(1090, 1090, camT), zoom: lerp(1.22, 1.5, camT) }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} />
      {c1 && f >= f1 && <Capsule x={c1[0]} y={c1[1]} rot={(f - f1) * 40} s={0.8} />}
      {c2 && f >= f2 && <Capsule x={c2[0]} y={c2[1]} rot={-(f - f2) * 40} s={0.8} />}
      {f >= b.open + 2 && <><Memo kind="off" x={hL[0]} y={hL[1] - 118} s={0.85} unroll={unroll} /><Memo kind="on" x={hR[0]} y={hR[1] - 118} s={0.85} unroll={unroll} /></>}
      <Clerk a={a} pose={pose} expr={expr} f={f} glance={glance} pocket={<PocketBook />} />
      {capsHeld && f >= land1 && <Capsule x={hL[0]} y={hL[1] - 10} rot={-20} s={0.8} open={open} />}
      {capsHeld && f >= land2 && <Capsule x={hR[0]} y={hR[1] - 10} rot={20} s={0.8} open={open} />}
      <Front f={f} />
      <DeskBits f={f} capsOnDesk={!capsHeld} />
    </Shot>
  );
};

/* =============================== 08 · pinned side by side =============================== */

const pinPt = (m: V): V => [m[0], m[1] - 82];

/** «الاجتماع قائم»… و«الاجتماع ملغي». — he pins «قائم» on the right and nods; pins «ملغي» on the left and nods just as sincerely. */
export const PinBoth: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  const a = at(EMP_DESK_X);
  const hR = path(f, [[t0, SHOW_R], [b.pinOn - 8, [MEMO_ON[0] + 10, MEMO_ON[1] + 70]], [b.pinOn - 2, pinPt(MEMO_ON)], [b.pinOn + 4, pinPt(MEMO_ON)], [b.pinOn + 12, [-1110, 1300]]], ease.inOut);
  const hL = path(f, [[t0, SHOW_L], [b.pinOff - 10, [MEMO_OFF[0] - 10, MEMO_OFF[1] + 70]], [b.pinOff - 2, pinPt(MEMO_OFF)], [b.pinOff + 4, pinPt(MEMO_OFF)], [b.pinOff + 12, [-1390, 1300]]], ease.inOut);
  let pose: Pose = { ...P.stand, handL: 'pinch', handR: 'pinch' };
  pose = { ...pose, tilt: nod(f, b.readOn + 2, 14, 1, 10) + nod(f, b.readOff + 2, 14, 1, 10), lean: f >= b.pinOn - 8 && f < b.pinOn + 6 ? 6 : f >= b.pinOff - 10 && f < b.pinOff + 6 ? -6 : 0 };
  pose = reach(pose, a, hL, hR, { L: 1, R: 1 });
  const heldOn = f < b.pinOn, heldOff = f < b.pinOff;
  const expr = xTrack(f, [[t0, X.sincere], [b.pinOn - 8, 'determined'], [b.pinOn + 4, 'satisfied'], [b.readOn, X.sincere], [b.pinOff - 12, 'determined'], [b.pinOff + 4, 'satisfied'], [b.readOff, X.sincere]]);
  const glance = vecTrack(f, [[t0, [0.6, -0.1]], [b.pinOn - 8, [0.8, 0.1]], [b.readOn - 2, [0.8, 0.1]], [b.pinOff - 12, [-0.8, 0.1]], [b.readOff - 2, [-0.8, 0.1]], [b.readOff + 16, [0, 0.1]]], sec(0.12));
  return (
    <Shot f={f} cam={{ cx: -1250, cy: 1150, zoom: 1.58 }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} />
      {heldOn && <Memo kind="on" x={hR[0]} y={hR[1] + lerp(-118, 82, prog(f, b.pinOn - 8, 6, ease.inOut))} s={lerp(0.85, 0.72, prog(f, b.pinOn - 8, 6, ease.inOut))} />}
      {heldOff && <Memo kind="off" x={hL[0]} y={hL[1] + lerp(-118, 82, prog(f, b.pinOff - 10, 8, ease.inOut))} s={lerp(0.85, 0.72, prog(f, b.pinOff - 10, 8, ease.inOut))} />}
      <Clerk a={a} pose={pose} expr={expr} f={f} glance={glance} pocket={<PocketBook />} />
      <Front f={f} />
      <DeskBits f={f} capsOnDesk />
    </Shot>
  );
};

/* =============================== 09 · «صحيح» on both =============================== */

/** «ختم على الاثنتين: «صحيح».» — his blue stamp: thunk on «قائم», a toss to the other hand, thunk on «ملغي»; a sincere, proud blow on the stamp. */
export const StampTrue: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  const a = at(EMP_DESK_X);
  const okR: V = [MEMO_ON[0], MEMO_ON[1] - 64], okL: V = [MEMO_OFF[0], MEMO_OFF[1] - 64];
  const toss0 = b.ok1 + 5, toss1 = toss0 + 6;
  const hR = path(f, [[t0, [-1110, 1300]], [b.ok1 - 14, STAMP_DESK], [b.ok1 - 11, STAMP_DESK], [b.ok1 - 5, [okR[0] + 10, okR[1] - 70]], [b.ok1, okR], [b.ok1 + 3, [okR[0], okR[1] + 3]], [toss0, [-1180, 1210]], [toss1 + 4, [-1150, 1300]], [b.proud, [-1150, 1300]]], ease.inOut);
  const hL = path(f, [[t0, [-1390, 1300]], [toss0, [-1390, 1300]], [toss1, [-1320, 1215]], [b.ok2 - 5, [okL[0] - 10, okL[1] - 70]], [b.ok2, okL], [b.ok2 + 3, [okL[0], okL[1] + 3]], [b.ok2 + 10, [-1330, 1180]], [b.proud, [-1300, 1150]], [b.proud + 10, [-1290, 1140]]], ease.inOut);
  const chest: V = [-1230, 1230];
  const hR2 = f >= b.proud + 4 ? path(f, [[b.proud + 4, [-1150, 1300]], [b.proud + 12, chest]], ease.inOut) : hR;
  let pose: Pose = { ...P.stand, handL: 'fist', handR: f >= b.proud + 10 ? 'open' : 'fist' };
  pose = { ...pose, lean: f >= b.ok1 - 6 && f < b.ok1 + 4 ? 5 : f >= b.ok2 - 6 && f < b.ok2 + 4 ? -5 : 0, squash: [b.ok1, b.ok2].some((t) => f >= t && f < t + 3) ? -0.03 : 0 };
  pose = reach(pose, a, hL, hR2, { L: 1, R: 1 });
  // where the stamp is: desk → right hand → in the air → left hand
  const inAir = f >= toss0 && f < toss1;
  const tossPt = arc([-1180, 1210], [-1320, 1215], clamp((f - toss0) / (toss1 - toss0)), 80);
  const stampAt: V | null = f < b.ok1 - 11 ? null : f < toss0 ? hR : inAir ? tossPt : hL;
  const press = [b.ok1, b.ok2].some((t) => f >= t && f < t + 3) ? 1 : 0;
  const expr = xTrack(f, [[t0, 'satisfied'], [b.ok1 - 8, 'determined'], [b.ok1 + 1, X.proud], [b.ok2 - 6, 'determined'], [b.ok2 + 1, X.proud], [b.proud, X.blow], [b.proud + 10, X.sincere]]);
  const glance = vecTrack(f, [[t0, [0.4, 0.4]], [b.ok1 - 12, [0.6, 0.5]], [b.ok1 - 6, [0.8, 0]], [toss0, [0, 0.5]], [b.ok2 - 8, [-0.8, 0]], [b.proud, [-0.2, 0.3]], [b.proud + 10, [0, 0]]], sec(0.1));
  return (
    <Shot f={f} cam={{ cx: -1250, cy: 1150, zoom: keys(f, [[t0, 1.58], [b.proud, 1.58], [b.proud + 12, 1.7]]) }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} />
      <Clerk a={a} pose={pose} expr={expr} f={f} glance={glance} pocket={<PocketBook />} />
      {stampAt && <StampTool x={stampAt[0]} y={stampAt[1]} rot={inAir ? (f - toss0) * 60 : 0} color={PAL.blue} s={0.9} press={press} />}
      <Front f={f} />
      <DeskBits f={f} capsOnDesk />
      <Puff x={hL[0] + 10} y={hL[1] + 70} t={prog(f, b.proud + 2, 10, ease.out)} s={0.5} />
    </Shot>
  );
};

/* =============================== 10 · the chair =============================== */

const memoHeld = (h: V, s = 0.72, kind: 'on' | 'off' = 'off') => <Memo kind={kind} x={h[0]} y={h[1] - 96} s={s} />;

/** «جاب كرسي ليحضر…» — he takes both memos, walks to the meeting room dragging his chair by its back, the «ملغي» memo held up in front. */
export const ChairDrag: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  const x = dragX(f);
  const a = at(x, -1);
  const w = walked(f, b.drag0 - 4, b.arrive, -1640, -2330, 170);
  let pose = walkPose(w.phase, 0.9, { ...P.stand, lean: 6 });
  const ch = chairAt(f);
  const grip: V = [ch.x - 84, FLOOR + CHAIR.backTop + 14];
  const front: V = [x - 150, 1120 + Math.sin(w.phase * Math.PI * 4) * 6];
  pose = reach(pose, a, grip, front, { L: 1, R: 1 });
  pose = { ...pose, handL: 'fist', handR: 'pinch' };
  return (
    <Shot f={f} cam={{ cx: keys(f, [[t0, -2050], [t1, -2300]], ease.inOut), cy: 1170, zoom: 1.15 }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} />
      {memoHeld(front)}
      <Clerk a={a} pose={pose} expr={X.proud} f={f} look={[0.5, 0]} glance={[0.6, -0.2]} pocket={<PocketMemo />} />
    </Shot>
  );
};

/* =============================== 11 · both at once =============================== */

const HOOK_HAND: V = [MEET_X - 30, FLOOR - 560 + 14];
const MEMO_ON_DOOR: V = [MEET_X + 30, FLOOR - 560 + 200];   // his hand keeps the notice up by its lower corner (the word stays clear)

/** «وعلّق الإلغاء بيده الثانية!» — one hand hangs «ملغي» on the meeting door, the other keeps the chair for attending: a frozen split, then he sits — hand still on the notice. */
export const BothHands: React.FC<ShotProps & { cam?: { cx: number; cy: number; zoom: number }; overlay?: React.ReactNode }> = ({ f, t0, cam, overlay }) => {
  const b = B();
  const a = at(CHAIR_SIT, -1);
  const ch = chairAt(f);
  const grip: V = [ch.x - 84, FLOOR + CHAIR.backTop + 14];
  const sitT = prog(f, b.sit - 6, 12, ease.inOut);
  const split: Pose = { ...P.stand, legL: [-52, -20], legR: [8, 4], lean: -16, tilt: 10, handL: 'fist', handR: 'open', stance: 1.2 };
  let pose = poseTrack(f, [[t0, { ...P.stand, handL: 'fist', handR: 'pinch' }], [b.freeze - 6, split]], sec(0.2), ease.back);
  pose = mixPose(pose, { ...P.sitChair, handL: 'mitten', handR: 'open' }, sitT);
  const tremble = f >= b.freeze && f < b.freeze + 8 ? Math.sin(f * 3.4) * 2 : 0;
  pose = { ...pose, tilt: pose.tilt + tremble };
  const front = path(f, [[t0, [-2480, 1130]], [b.hang - 6, [HOOK_HAND[0] + 20, HOOK_HAND[1] + 40]], [b.hang, HOOK_HAND], [b.hang + 6, MEMO_ON_DOOR], [b.sit + 8, [MEET_X + 28, 1196]]], ease.inOut);
  const back = f < b.sit + 2 ? grip : path(f, [[b.sit + 2, grip], [b.sit + 12, [-2250, 1380]]], ease.inOut);
  pose = reach(pose, { ...a, y: FLOOR }, back, front, { L: 1, R: 1 });
  const expr = xTrack(f, [[t0, X.proud], [b.hang, 'satisfied'], [b.freeze - 4, X.proud], [b.sit + 4, X.sincere]]);
  const glance = vecTrack(f, [[t0, [0.7, -0.6]], [b.hang + 4, [-0.7, -0.1]], [b.freeze - 6, [0, -0.2]], [b.sit, [0.3, 0]]], sec(0.12));
  return (
    <Shot f={f} cam={cam ?? { cx: -2390, cy: 1130, zoom: 1.3, shake: f >= b.freeze && f < b.freeze + 3 ? 3 : 0 }} bounds={BOUNDS} bg={C.wall} overlay={overlay}>
      <Back f={f} />
      {f < b.hang && memoHeld(front)}
      <Clerk a={a} pose={pose} expr={expr} f={f} look={[0.1, -0.1]} glance={glance} pocket={<PocketMemo />} />
      {!cam && <Sparkles x={-2330} y={FLOOR - 640} t={prog(f, b.freeze, 16, ease.linear)} r={150} n={6} color={PAL.blueSoft} seed={11} />}
    </Shot>
  );
};

/* =============================== 12 · the name =============================== */

const seated = at(CHAIR_SIT, -1);

/** «جورج أورويل سمّى هذا «التفكير المزدوج» في رواية «1984»:» — he waits, content, for a meeting he hung «ملغي» on; the whiteboard behind him gets the name. */
export const Naming: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  const takeOut = t0 + 16;
  const front = path(f, [[t0, [MEET_X + 28, 1196]], [t0 + 12, [-2370, 1330]], [takeOut + 8, [-2390, 1300]]], ease.inOut);
  const back = path(f, [[t0, [-2250, 1380]], [takeOut, [-2280, 1250]], [takeOut + 6, [-2280, 1250]], [takeOut + 14, [-2272, 1400]]], ease.inOut);
  let pose: Pose = { ...P.sitChair, handL: 'pinch', handR: 'open', tilt: nod(f, b.sub + 26, 16, 1, 7) + (f > takeOut + 16 ? Math.sin(f * 0.26) * 4 : 0) };
  pose = { ...pose, legR: [70 + Math.max(0, Math.sin(f * 0.45)) * 8, 70] };
  pose = reach(pose, seated, back, front, { L: 1, R: 1 });
  const showMemo = f >= takeOut + 6;
  const expr = xTrack(f, [[t0, X.sincere], [b.write + 4, 'satisfied'], [b.sub + 26, X.sincere]]);
  const glance = vecTrack(f, [[t0, [0.6, -0.4]], [takeOut, [-0.4, 0.5]], [takeOut + 16, [0.6, -0.3]], [b.sub + 18, [0.6, -0.95]], [b.sub + 40, [0.5, -0.3]]], sec(0.15));
  return (
    <Shot f={f} cam={{ cx: -2420, cy: keys(f, [[t0, 960], [t1, 975]]), zoom: keys(f, [[t0, 1.0], [t1, 1.04]]) }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} />
      <Clerk a={seated} pose={pose} expr={expr} f={f} look={[glance[0] * 0.4, glance[1] * 0.3]} glance={glance} pocket={showMemo ? <PocketBook /> : <PocketMemo />} />
      {showMemo && <Memo kind="on" x={back[0] + 10} y={back[1] - 92} s={0.6} rot={4} />}
    </Shot>
  );
};

/** «تصدّق فكرتين متناقضتين في وقت واحد، وتتغاضى عن التناقض.» — close: «قائم» (he lifts it, nods) → «ملغي» (he points at it, nods) →
 *  faster and faster, head and body swaying between them; a flicker of doubt (hand to chin, a bead of sweat); eyes shut, a happy shrug.
 *  Seated facing left: +x on the face is screen-left (the notice), −x is screen-right (the memo in his hand). */
export const Overlook: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  const ON: V = [-0.8, 0.45], OFF: V = [0.85, -0.6];
  const fastKeys: Array<[number, V]> = Array.from({ length: 6 }, (_, i) => [b.fast + i * 5, i % 2 === 0 ? ON : OFF]);
  const glance = vecTrack(f, [[t0, [0.2, -0.2]], [b.look1, ON], [b.look2, OFF], [b.look3, ON], ...fastKeys, [b.doubt, [0.1, 0.1]], [b.shrug + 26, [0, 0]]], sec(0.08));
  const look: V = [glance[0] * 0.55, glance[1] * 0.35];
  const shrugT = keys(f, [[b.shrug - 4, 0], [b.shrug + 4, 1], [b.shrug + 22, 1], [b.shrug + 32, 0.15]], ease.inOut);
  let pose: Pose = { ...P.sitChair, handL: 'pinch', handR: 'open' };
  pose = { ...pose, lean: glance[0] * 6 * (1 - shrugT), tilt: nod(f, b.look1 + 2, 12, 1, 9) + nod(f, b.look2 + 2, 12, 1, 9) + nod(f, b.look3 + 2, 10, 1, 6) };
  // the memo in his hand lifts when he looks at it; the free hand points at the notice when he looks at that
  const lifted = (t: number) => keys(f, [[t, 0], [t + 4, 1], [t + 12, 1], [t + 16, 0]], ease.inOut);
  const lift = Math.max(f < b.fast ? lifted(b.look1) : 0, f < b.fast ? lifted(b.look3) : 0, ...fastKeys.filter((_, i) => i % 2 === 0).map(([t]) => (f >= t && f < t + 5 ? Math.sin(((f - t) / 5) * Math.PI) * 0.6 : 0)));
  const back: V = [-2272, 1400 - 50 * lift];
  const lap: V = [-2360, 1405], notice: V = [-2445, 1250], chin: V = [-2318, 1196];
  const pointK: Array<[number, V]> = [[t0, lap], [b.look2 - 2, lap], [b.look2 + 4, notice], [b.look3 - 2, notice], [b.look3 + 4, lap]];
  fastKeys.forEach(([t], i) => pointK.push([t + 1, i % 2 === 1 ? notice : lap]));
  pointK.push([b.doubt, lap], [b.doubt + 6, chin], [b.shrug - 4, chin]);
  let front = path(f, pointK.sort((x, y) => x[0] - y[0]), ease.inOut);
  pose = reach(pose, seated, back, front, { L: 1, R: 1 });
  pose = mixPose(pose, { ...pose, armR: [55, 95], handR: 'open', tilt: 8, squash: -0.03 }, shrugT);
  const pointing = f >= b.look2 && f < b.doubt && (Math.hypot(front[0] - notice[0], front[1] - notice[1]) < 40);
  pose = { ...pose, handR: shrugT > 0.5 ? 'open' : f >= b.doubt + 4 ? 'fist' : pointing ? 'point' : 'mitten' };
  const expr = xTrack(f, [[t0, X.sincere], [b.look1, 'satisfied'], [b.look2, 'satisfied'], [b.fast, 'curious'], [b.doubt, X.doubt], [b.shrug - 2, 'laugh'], [b.shrug + 24, X.sincere]]);
  return (
    <Shot f={f} cam={{ cx: -2385, cy: 1205, zoom: 1.75 }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} />
      <Clerk a={seated} pose={pose} expr={expr} f={f} look={look} glance={glance} pocket={<PocketBook />} />
      <Memo kind="on" x={back[0] + 10} y={back[1] - 92} s={0.6} rot={4 - lift * 4} />
    </Shot>
  );
};

/* =============================== 13 · evidence =============================== */

/** «أما لو تغيّر الدليل وغيّرت رأيك، فهذا طبيعي.» — back at the first door: he sets the memo down, tests the handle himself (it's locked), and writes what he found. */
export const Evidence: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  const arrive = b.grip - 2;
  const w = walked(f, t0, arrive, -820, -330, 170);
  const x = f < arrive ? w.x : -330;
  const a = at(x);
  let pose: Pose = f < arrive ? walkPose(w.phase, 0.9, P.stand) : P.stand;
  const putAt = t0 + 10;
  const cabTop: V = [CAB_X + 10, FLOOR - 318 - 6];
  const carry: V = [x + 140, 1250];
  const r1 = f < putAt ? carry : f < putAt + 6 ? path(f, [[putAt, carry], [putAt + 6, cabTop]]) : null;
  if (r1) pose = reach(pose, a, null, r1, { R: 1 });
  // the test pull
  const pulling = f >= b.grip && f < b.test + 8;
  const heave = keys(f, [[b.grip, 0], [b.test - 2, 0.3], [b.test, 1], [b.test + 6, 0.2]], ease.inOut);
  const lv = 4 + 18 * heave;
  if (pulling) pose = reach({ ...pose, lean: -10 * heave }, a, null, leverPt(lv, 50), { R: 1 });
  // the note: notebook out, pencil from the ear, «مقفول» written right→left
  const nbOut = b.note2 - 8;
  const pocketPt: V = [a.x - 0.25 * 150 * S, FLOOR - 192 - 0.6 * 196 * S];
  const nbHand = path(f, [[nbOut, pocketPt], [nbOut + 3, pocketPt], [nbOut + 10, [-450, 1290]]], ease.inOut);
  const writeT = prog(f, b.note2 + 4, 22, ease.linear);
  const wordPt: V = [-450 + 120 + 57, 1290 - 40 + 10];
  const ear: V = [a.x + 0.92 * 88 * S, 1063 - 0.18 * 94 * S + 8];
  const penHand: V = f < b.note2 + 4 ? path(f, [[nbOut, hand(pose, a, 1)], [nbOut + 4, ear], [nbOut + 6, ear], [b.note2 + 4, [wordPt[0] + 50, wordPt[1] - 60]]]) : [wordPt[0] + 50 - 100 * writeT, wordPt[1] - 62 + Math.sin(f * 1.7) * 5];
  const noting = f >= nbOut && f < b.calm + 10;
  if (noting) pose = reach(pose, a, nbHand, penHand, { L: 1, R: 1 });
  pose = { ...pose, tilt: pose.tilt + nod(f, b.test + 10, 12, 1, 7) + nod(f, b.calm, 14, 1, 7), handR: pulling ? 'fist' : noting ? 'pinch' : pose.handR, handL: noting ? 'pinch' : pose.handL };
  const expr = xTrack(f, [[t0, X.calm], [b.test, 'determined'], [b.test + 8, X.calm], [b.note2, 'curious'], [b.calm, X.calm]]);
  const glance = vecTrack(f, [[t0, [0.7, 0]], [b.test + 2, [0.6, 0.8]], [nbOut + 8, [0.2, 0.8]], [b.calm + 4, [0.2, 0.1]]], sec(0.12));
  const camT = prog(f, nbOut + 2, 12, ease.inOut);
  const nbPos: V = [nbHand[0] + 120, nbHand[1] - 40];
  return (
    <Shot f={f} cam={{ cx: lerp(-330, -320, camT), cy: lerp(1150, 1200, camT), zoom: lerp(1.2, 1.55, camT) }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} door={{ lever: pulling ? lv : 0, rattle: pulling ? Math.sin(f * 2.4) * 1.5 * heave : 0 }} />
      {f >= putAt + 6 && <Memo kind="on" x={cabTop[0]} y={cabTop[1] - 78} s={0.6} rot={-6} />}
      <Clerk a={a} pose={pose} expr={expr} f={f} look={[0.4, 0]} glance={glance} earPencil={!(noting && f >= nbOut + 5)} pocket={noting ? undefined : <PocketBook />} />
      {r1 && <Memo kind="on" x={r1[0]} y={r1[1] - 78} s={0.6} rot={4} />}
      {noting && <Notebook x={nbPos[0]} y={nbPos[1]} s={0.75} word="مقفول" write={writeT} smudge seed={13} />}
      {noting && f >= nbOut + 5 && <Pencil x={penHand[0]} y={penHand[1] + 22} rot={20} s={0.7} />}
    </Shot>
  );
};

/* =============================== 14 · only the words =============================== */

/** «لكن المدير ما لمس القفل. اللي تغيّر… كلامه فقط.» — he picks up the crumpled «مفتوح», smooths it and holds it under the «مغلق» pad: two stamps, one lock, cobweb intact. */
export const OnlyWords: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  const ball: V = [DOOR_X - 40, FLOOR - 30];
  const down0 = b.pick, down1 = b.pick + 10, up1 = b.pick + 20, unfoldAt = up1 + 2, placed = unfoldAt + 22;
  const peer = b.lock + 4, peerEnd = peer + 16;
  const x = keys(f, [[t0, -350], [down0, -250], [up1, -250], [up1 + 8, -350]], ease.inOut);
  const a = at(x);
  const bendT = keys(f, [[down0 - 2, 0], [down1, 1], [down1 + 4, 1], [up1, 0]], ease.inOut);
  let pose = mixPose(P.stand, P.bend, bendT);
  // he leans in to peer at the lock (the cobweb trembles under his breath)
  const peerT = keys(f, [[peer - 4, 0], [peer + 2, 1], [peerEnd, 1], [peerEnd + 6, 0]], ease.inOut);
  pose = { ...pose, lean: pose.lean + 14 * peerT, tilt: pose.tilt + 10 * peerT };
  const chest: V = [-300, 1260];
  const sheetSpot: V = [-150, 1160];
  const lift = keys(f, [[b.compare + 6, 0], [b.compare + 12, 1], [b.compare + 20, 1], [b.compare + 26, 0]], ease.inOut);
  const hR: V = f < down1 + 4 ? path(f, [[down0, hand(pose, a, 1)], [down1, [ball[0], ball[1] - 6]]])
    : path(f, [[down1 + 4, [ball[0], ball[1] - 6]], [up1 + 4, [chest[0] + 50, chest[1]]], [unfoldAt + 12, [chest[0] + 60, chest[1]]], [placed, [sheetSpot[0] - 80, sheetSpot[1] + 10]]], ease.inOut);
  const hR2: V = [hR[0], hR[1] - 40 * lift];
  // the free hand: helps unfold, then taps the sheet twice on «كلامه فقط»
  const tapPt: V = [sheetSpot[0] - 60, sheetSpot[1] + 30];
  const rest: V = [-470, 1360];
  const chestL: V = [chest[0] - 60, chest[1]];
  const hL: V | null = f < up1 ? null : path(f, [[up1, hand(P.stand, a, -1)], [up1 + 4, chestL], [unfoldAt + 16, chestL], [unfoldAt + 26, rest], [b.only - 6, rest], [b.only, [tapPt[0], tapPt[1] - 20]], [b.only + 3, tapPt], [b.only + 6, [tapPt[0], tapPt[1] - 22]], [b.only + 9, tapPt], [b.only + 16, [tapPt[0] - 40, tapPt[1] + 30]], [b.only + 24, rest]], ease.inOut);
  if (f >= down0) pose = reach(pose, a, hL, hR2, { L: 1, R: 1 });
  pose = { ...pose, handR: 'pinch', handL: f >= b.only - 6 && f < b.only + 16 ? 'point' : f >= up1 && f < unfoldAt + 18 ? 'pinch' : 'mitten' };
  const unfold = prog(f, unfoldAt, 14, ease.out);
  const held = f >= down1 + 4;
  const sheetPos: V = f < unfoldAt + 12 ? [hR2[0] - 50, hR2[1] - 20] : [hR2[0] + 80, hR2[1] - 10];
  const web = f >= peer && f < peer + 40 ? Math.sin((f - peer) * 0.6) * 0.9 * (1 - (f - peer) / 40) : 0;
  const expr = xTrack(f, [[t0, 'curious'], [unfoldAt + 6, 'curious'], [peer, X.calm], [b.compare, 'curious'], [b.only + 10, X.knowing]]);
  const glance = vecTrack(f, [[t0, [0.7, 0.9]], [up1, [0.4, 0.6]], [unfoldAt + 14, [0.7, 0.3]], [peer - 4, [0.7, 0.95]], [b.compare, [0.7, 0.3]], [b.compare + 12, [0.8, -0.85]], [b.compare + 24, [0.7, 0.3]], [b.only + 12, [0, 0]]], sec(0.1));
  const look: V = [0.3 + glance[0] * 0.2, glance[1] * 0.3];
  return (
    <Shot f={f} cam={{ cx: -110, cy: 1170, zoom: 1.35 }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} door={{ web }} />
      {!held && <Crumple x={ball[0]} y={ball[1]} word="مفتوح" seed={2} />}
      <Clerk a={a} pose={pose} expr={expr} f={f} look={look} glance={glance} pocket={<PocketBook />} />
      {held && <Crumple x={sheetPos[0]} y={sheetPos[1]} word="مفتوح" unfold={unfold} seed={2} s={0.62} rot={-3} />}
      <Puff x={LOCK[0] - 24} y={LOCK[1] - 30} t={prog(f, peer + 2, 12, ease.out)} s={0.35} />
    </Shot>
  );
};

/* =============================== 15 · the question =============================== */

/** «وإيش اللي تغيّر فعلًا… الواقع، ولا الكلام؟» — a third stamp: «مفتوح». He doesn't rush. Tests the handle: locked. Tears the sheet off and slides it back under the door. A beat on his face. */
export const TheQuestion: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  const flap = keys(f, [[b.flap3, 0], [b.flap3 + 4, 1], [b.stamp3 + 14, 1], [b.stamp3 + 20, 0]]);
  const swipeA: V = [-120, 880], swipeB: V = [80, 1010];
  const wrist = path(f, [[b.flap3 + 2, HATCH], [b.tear3 - 1, swipeA], [b.tear3 + 5, swipeB], [b.stamp3 - 4, [14, 816]], [b.stamp3, [0, STAMP_DOWN]], [b.stamp3 + 3, [0, STAMP_DOWN + 4]], [b.stamp3 + 8, [6, 852]], [b.stamp3 + 12, HATCH]], ease.inOut);
  const press = f >= b.stamp3 && f < b.stamp3 + 3 ? 1 : 0;
  const fallT = clamp((f - b.tear3) / 26);
  const tearSheet = f >= b.tear3 && f < b.tear3 + 26;
  // the clerk: calm; tests the handle; tears the sheet off from its bottom edge; bends and slides it under
  const x = keys(f, [[t0, -350], [b.grip3 - 2, -350], [b.grip3 + 6, -300], [b.lookPad + 2, -300], [b.tear4 - 4, -240], [b.slide + 20, -240], [b.slide + 30, -350]], ease.inOut);
  const a = at(x);
  let pose: Pose = { ...P.stand };
  const heave = keys(f, [[b.grip3 + 4, 0], [b.test3 - 2, 0.3], [b.test3, 1], [b.test3 + 8, 0.2]], ease.inOut);
  const lv = 4 + 18 * heave;
  const pulling = f >= b.grip3 && f < b.test3 + 10;
  const padEdge: V = [PAD[0] - 90, PAD[1] + 70];
  const bendT = keys(f, [[b.slide - 6, 0], [b.slide + 2, 1], [b.slide + 16, 1], [b.slide + 24, 0]], ease.inOut);
  pose = mixPose(pose, P.bend, bendT);
  const floorPt: V = [-110, FLOOR - 10];
  let hR: V | null = null;
  if (pulling) { hR = leverPt(lv, 50); pose = { ...pose, lean: -10 * heave }; }
  else if (f >= b.lookPad + 4 && f < b.slide - 4) hR = path(f, [[b.lookPad + 4, hand(pose, a, 1)], [b.tear4 - 2, padEdge], [b.tear4 + 2, padEdge], [b.tear4 + 8, [padEdge[0] - 30, padEdge[1] + 80]], [b.slide - 4, [-200, 1330]]]);
  else if (f >= b.slide - 4 && f < b.slide + 20) hR = path(f, [[b.slide - 4, [-200, 1330]], [b.slide + 2, floorPt], [b.slide + 14, [floorPt[0] + 80, FLOOR - 4]]]);
  if (hR) pose = reach(pose, a, null, hR, { R: 1 });
  pose = { ...pose, handR: pulling ? 'fist' : 'pinch' };
  const myTear = f >= b.tear4 && f < b.slide + 2;
  const slideT = clamp((f - (b.slide + 2)) / 12);
  const expr = xTrack(f, [[t0, X.calm], [b.stamp3, X.calm], [b.test3, 'determined'], [b.test3 + 8, X.calm], [b.tear4, X.calm], [b.slide + 26, X.knowing]]);
  const glance = vecTrack(f, [[t0, [0.4, -0.6]], [b.stamp3 + 6, [0.5, -0.7]], [b.grip3, [0.7, 0.6]], [b.test3 + 6, [0.5, 0.2]], [b.lookPad, [0.6, -0.8]], [b.slide - 6, [0.5, 0.8]], [b.slide + 26, [0, 0]]], sec(0.12));
  return (
    <Shot f={f} cam={{ cx: -150, cy: 1150, zoom: keys(f, [[t0, 1.28], [b.slide + 24, 1.28], [b.slide + 40, 1.4]]) }} bounds={BOUNDS} bg={C.wall}>
      <Back f={f} door={{ flap, lever: pulling ? lv : 0 }} />
      {tearSheet && <PadSheet x={lerp(PAD[0], DOOR_X + 150, fallT) + Math.sin(fallT * 9) * 30} y={lerp(PAD[1], FLOOR - 14, fallT * fallT)} rot={-82 * fallT + Math.sin(fallT * 7) * 20} s={lerp(1, 0.6, fallT)} word="مغلق" />}
      {flap > 0.4 && <ManagerHand from={HATCH} to={wrist} hold="stamp" press={press} />}
      {f >= b.slide + 2 && slideT < 1 && (
        <g clipPath="url(#underDoor)">
          <clipPath id="underDoor"><rect x={-260} y={FLOOR - 2} width={600} height={200} /></clipPath>
          <g transform={`translate(${lerp(floorPt[0] + 20, 10, slideT)} ${lerp(FLOOR + 26, FLOOR - 4, slideT)}) scale(1 0.28)`}><PadSheet x={-14} y={-8} word="مفتوح" s={0.66} crease={1} rot={-4} /><PadSheet x={0} y={0} word="مفتوح" s={0.7} /></g>
        </g>
      )}
      <Clerk a={a} pose={pose} expr={expr} f={f} look={[0.3, 0]} glance={glance} pocket={<PocketBook />} />
      {f < b.slide - 2 && (() => { const l = hand(pose, a, -1); return <Crumple x={l[0] - 10} y={l[1] + 40} word="مفتوح" unfold={1} seed={2} s={0.5} rot={84} />; })()}
      {myTear && hR && <PadSheet x={hR[0] + 40} y={hR[1] + 36} rot={-8} s={0.7} word="مفتوح" />}
    </Shot>
  );
};

