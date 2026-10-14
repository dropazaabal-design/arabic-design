import React from 'react';
import { PAL, bowLine, clamp, lerp, stroke } from '@mukarram/characters/ink';
import { Litterer, Passerby, Spitter, BUILDS } from '@mukarram/characters/cast';
import { Expression } from '@mukarram/characters/face';
import { BUILD, Build, POSES, Pose, mixPose, walkPose } from '@mukarram/characters/rig';
import { armIK, toTorso } from '@doublethink/characters/employee';
import { Backdrop, Bag, C, Clipboard, Cup, DOOR, DigitalClock, Door, ExitSign, FrownMask, Lid, PhotoDesk, Plant, ShakeLines, Softbox, Thought, TinyFrown, Tripod } from '../characters/studio';
import { At, PocketLid, Vec, W_BUILD, Worker, handAt, reachB, torsoToWorld } from '../characters/worker';
import { TL, ease, keys, prog, sec, segStart, wordAt, wordEnd } from '../video/time';
import { X, idle, talkAt, xTrack } from './common';

// One connected studio, laid out left→right: the exit door («خروج» over it, the clock and the handover list
// beside it) · the worker's spot · the wheeled photo desk · the set (softboxes, camera, blue backdrop).
// Everything that moves is a function of the global frame, keyed to words of the recording, so every shot sees
// the same world: who holds the cup, the bag and the plant; where the lid is; whether the door has his coat.

export const FLOOR = 1560;
export const DOOR_X = 0;
export const CLOCK: Vec = [330, 830];
export const LIST: Vec = [500, 1150];
export const DESK0 = 950, DESK1 = 1450;
export const BOUNDS: [number, number, number, number] = [-700, 200, 2500, 2200];
const S = 1;

const B1 = { ...BUILD, ...BUILDS.litterer } as Build;   // C1, the cup's owner
const B2 = { ...BUILD, ...BUILDS.spitter } as Build;    // C2, the bag
const B3 = { ...BUILD, ...BUILDS.passerby } as Build;   // C3, the plant

/* ------------------------------ beats ------------------------------ */

export const beats = () => {
  const w = wordAt, we = wordEnd, ss = segStart;
  return {
    reach: w('s01', 'ويطلع') + 6, doorOpen: w('s01', 'لولا'), cupIn: w('s01', 'طلب'), cupLand: w('s01', 'صغير') + 3,
    ask: ss('s02'), minute: w('s02', 'دقيقة'), sure1: w('s03', 'أكيد'), shoe: we('s03', 'أكيد') + 6,
    c2In: ss('s04') - 30, bagGive: w('s04', 'المعدات') + 2, bagLand: w('s05', 'أكيد') - 3, sure2: w('s05', 'أكيد'),
    c2Back: ss('s06') - 14, c3In: ss('s06') - 34, plantGive: w('s06', 'الديكور') + 2, plantLand: w('s07', 'أكيد') - 4, sure3: w('s07', 'أكيد'),
    leave: w('s08', 'كل') + 4, alone: w('s08', 'وهو'), tryStep: w('s08', 'بقي'), stepBack: w('s08', 'شايل'),
    buzz: w('s09', 'اهتز') - 8, msg: w('s09', 'وصلت'),
    finger: w('s10', 'حرّك'), slide: w('s10', 'فانزلق') - 2,
    chin: w('s11', 'مسكه') - 2, lidPop: w('s11', 'بذقنه') + 2, tilt: w('s11', 'فمالت') - 2,
    straighten: w('s12', 'استقام'), stagger: w('s12', 'ينقذها'), shut: w('s12', 'فعلق') + 6,
    clockLook: w('s13', 'طالع'), flip4: w('s13', 'الساعة'),
    list: w('s14', 'كان') - 4, mouth: w('s14', 'كل'), think: w('s14', 'تخيّل'), gulp: w('s14', 'وبلع'), unthink: we('s14', 'الجملة'),
    c1Back: ss('s15') - 34, deskAsk: w('s15', 'المكتب'),
    imag0: w('s16', 'في') - 1, masks: w('s16', 'زعلوا'), lightsOff: w('s16', 'وانطفى'), imag1: ss('s17') - sec(1.05),
    no: w('s17', 'لا'), appt: w('s17', 'عندي'), noEnd: we('s17', 'موعد'),
    tamam: w('s18', 'تمام'), cupBack: we('s18', 'تمام') + 6,
    deskPush: w('s19', 'سحب') + 6, deskStop: we('s19', 'بنفسه') + 14,
    c2Return: ss('s20') - 32, bagBack: w('s20', 'أخذ'), c3Return: ss('s21') - 30, plantBack: w('s21', 'نبتته') - 4,
    tailFree: ss('s22') - 20, shake: w('s22', 'كل'), one: w('s22', 'كلمة'),
    maskOn: w('s23', 'قيمتك') - 4, maskLook: w('s23', 'برضا'), heavy: w('s23', 'أثقل'),
    name: w('s24', 'السوسيوتروبيّة'), pop: we('s24', 'السوسيوتروبيّة') + 4,
    walk0: w('s25', 'قال') - 6, wave: w('s25', 'والعلاقة'), back0: w('s25', 'مثل'), atDoor: ss('s26') - 4,
    c1Fetch: w('s25', 'بقيت'), peek: ss('s26') - 8,
    glance: ss('s27') - 14, tomorrow: w('s27', 'بكرة'), ten: w('s27', 'عشر'),
    lidAsk: w('s28', 'كنت'), lookDown: w('s28', 'غطا'), pointLid: w('s28', 'الكوب') + 6, laugh: we('s28', 'الكوب') + 4, lidGive: we('s28', 'الكوب') + 16,
    cta: ss('s29') - 8, like: w('s29', 'حط'), follow: w('s29', 'وتابعنا'), ifNo: w('s29', 'وإذا'), ok: w('s29', 'تمام'),
    thumb: w('s30', 'تمام') - 4, icons: TL.durationInFrames - sec(2),
  };
};
export type Beats = ReturnType<typeof beats>;
let cache: Beats | null = null;
export const B = () => (cache ??= beats());

/* ------------------------------ helpers ------------------------------ */

const N = TL.durationInFrames + 2;
/** An x track with its walk: position, walk-cycle phase from the distance covered, speed and direction. */
const mover = (k: () => Array<[number, number]>) => {
  let xs: number[] | null = null, d: number[] = [];
  return (f: number) => {
    if (!xs) {
      const kk = k();
      xs = Array.from({ length: N }, (_, i) => keys(i, kk, ease.inOut));
      d = [0];
      for (let i = 1; i < N; i++) d[i] = d[i - 1] + Math.abs(xs[i] - xs[i - 1]);
    }
    const i = Math.max(1, Math.min(N - 2, Math.round(f)));
    const v = Math.abs(xs[i + 1] - xs[i - 1]) / 2;
    return { x: xs[i], phase: d[i] / 340, v, dir: Math.sign(xs[i + 1] - xs[i - 1]) };
  };
};
const walkMix = (base: Pose, m: { phase: number; v: number }, stride = 1) => mixPose(base, walkPose(m.phase, stride, base), clamp(m.v / 2.5));
const P = (p: keyof typeof POSES): Pose => POSES[p] as Pose;
const tween = (f: number, from: number, dur: number) => prog(f, from, dur, ease.inOut);
const lerpV = (a: Vec, b: Vec, t: number): Vec => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
/** IK in torso space (wrist target given in the character's own torso coordinates). */
const holdT = (b: Build, pose: Pose, L?: Vec | null, R?: Vec | null, eL: 1 | -1 = 1, eR: 1 | -1 = 1): Pose => ({
  ...pose, ...(L ? { armL: armIK(b, -1, L, eL) } : {}), ...(R ? { armR: armIK(b, 1, R, eR) } : {}),
});
const arcPt = (a: Vec, b: Vec, t: number, h: number): Vec => [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - Math.sin(Math.PI * t) * h];

/* ------------------------------ the door and the clock ------------------------------ */

export const doorOpen = (f: number) => {
  const b = B();
  return keys(f, [[0, 0], [b.doorOpen - 2, 0], [b.doorOpen + 10, 0.85], [b.cupLand + 20, 0.85], [b.cupLand + 44, 0.32],
    [b.c2In - 2, 0.32], [b.shut - 8, 0.32], [b.shut, 0], [b.tailFree, 0], [b.tailFree + 8, 0.35], [b.tailFree + 22, 0.22]], ease.inOut);
};
/** The door's free edge at x (world) for a given opening. */
const doorEdge = (open: number) => DOOR_X - DOOR.w / 2 + DOOR.w * Math.cos(clamp(open) * 1.25);
export const clockText = (f: number) => {
  const b = B();
  const t: Array<[number, string]> = [[0, '4:59'], [b.cupLand, '5:00'], [b.leave, '5:01'], [b.buzz, '5:03'], [b.flip4, '5:04'], [b.no, '5:05'], [b.peek, '5:06']];
  let cur = t[0];
  for (const k of t) if (f >= k[0]) cur = k;
  return { text: cur[1], flip: prog(f, cur[0], 6, ease.out) };
};

/* ------------------------------ the worker ------------------------------ */

const wMove = mover(() => {
  const b = B();
  return [[0, 900], [b.doorOpen - 2, 330], [b.bagLand, 330], [b.bagLand + 10, 360], [b.plantLand, 360], [b.plantLand + 10, 395],
    [b.tryStep, 395], [b.tryStep + 12, 350], [b.stepBack, 350], [b.stepBack + 14, 420], [b.stagger, 420], [b.stagger + 26, 250],
    [b.tailFree + 16, 250], [b.tailFree + 30, 290], [b.walk0, 290], [b.wave - 4, 640], [b.back0, 640], [b.atDoor, 300]];
});

/** Where two hands meet for a handoff (fixed world points, so the worker and a colleague never need each other's state). */
const meetBag = () => { const x = wMove(B().bagLand).x; return torsoToWorld(W_BUILD, P('stand'), { x, y: FLOOR, s: S, facing: 1 }, [104, -6]); };
const meetCup = (): Vec => [wMove(B().tamam).x + 118, FLOOR - 300];

const UNDER_ARM: Vec = [96, 8];      // pot bottom, torso space
const CUP_T: Vec = [-40, -86];       // left wrist holding the cup, torso space
const BAG_T: Vec = [104, -6];        // right wrist with the bag, outside the pot
const CHIN_T: Vec = [-30, -130];     // the cup pinned under the chin, torso space

export type WorkerState = {
  at: At; pose: Pose; expr: Expression; look: Vec; glance: Vec; talk: number; tail: Vec | null; lid: number;
  phone: { buzz: number; up: number }; plant: { on: boolean; tilt: number; rustle: number; s: number };
  cup: { holder: 'C1' | 'W' | 'desk' | 'none'; p: Vec; rot: number; lid: boolean; tremble: number } | null;
  bag: Vec | null; bagSwing: number; lidFly: Vec | null;
};

export const worker = (f: number): WorkerState => {
  const b = B();
  const m = wMove(f);
  const id = idle(f, 61);
  const loaded = f >= b.bagLand && f < b.bagBack;
  const sway = f >= b.plantLand && f < b.plantBack ? Math.sin(f * 0.17) * 3.5 + Math.sin(f * 0.07) * 2 : 0;
  const at: At = { x: m.x, y: FLOOR, s: S, facing: 1, bob: id.bob };

  // ---- body ----
  let base: Pose = { ...P('stand') };
  if (f >= b.bagLand && f < b.bagBack) base = { ...base, lean: 5 + sway, tilt: 4 + sway * 0.6, squash: 0.03, legL: [-6, 0], legR: [8, 4] };
  if (f >= b.sure2 && f < b.sure2 + 8) base = { ...base, squash: 0.06 * (1 - (f - b.sure2) / 8) };
  // trying to reach the door with the pile on: a step, the pile leans, a step back
  if (f >= b.tryStep && f < b.stepBack + 16) base = { ...base, lean: base.lean + keys(f, [[b.tryStep, 0], [b.tryStep + 10, -10], [b.stepBack, 12], [b.stepBack + 14, 0]]) };
  // the chain: twist toward the phone, duck to the cup, straighten
  if (f >= b.finger && f < b.straighten + 14) {
    const duck = keys(f, [[b.chin - 4, 0], [b.chin + 4, 1], [b.straighten, 1], [b.straighten + 12, 0]]);
    base = { ...base, lean: base.lean + keys(f, [[b.finger, 0], [b.finger + 14, -7], [b.chin, -7], [b.chin + 6, 4]]), tilt: base.tilt + 24 * duck, squash: 0.04 * duck };
  }
  // staggering back into the door, then the yank when it shuts on the coat
  if (f >= b.stagger && f < b.shut + 30) base = { ...base, lean: keys(f, [[b.stagger, 6], [b.stagger + 8, -14], [b.shut - 2, -10], [b.shut + 3, 12], [b.shut + 14, -4], [b.shut + 28, 3]], ease.out) };
  const stuck = f >= b.shut && f < b.tailFree + 8;
  if (stuck && f >= b.shut + 28) base = { ...base, lean: 3 + (f > b.clockLook && f < b.list ? 0 : Math.max(0, Math.sin((f - b.shut) * 0.05)) * 5) };
  // the imagination: he shrinks into himself; reality: a breath
  if (f >= b.imag0 && f < b.imag1) base = { ...base, squash: 0.05, tilt: -4, lean: -6 };
  if (f >= b.imag1 && f < b.no) base = { ...base, squash: -0.03 * Math.sin(clamp((f - b.imag1) / (b.no - b.imag1)) * Math.PI) };
  if (f >= b.heavy && f < b.pop) base = { ...base, legL: [-10, 14], legR: [12, 16], lean: -4, squash: 0.05 * (1 - tween(f, b.heavy + 10, 20)) };
  if (f >= b.laugh && f < b.cta) base = { ...base, tilt: Math.sin((f - b.laugh) * 0.6) * 5, squash: Math.abs(Math.sin((f - b.laugh) * 0.6)) * 0.03 };
  const bounce = f >= b.walk0 && f < b.atDoor + 4;
  let pose = walkMix(base, m, bounce ? 1.25 : 1);
  if (bounce) pose = { ...pose, squash: pose.squash - Math.abs(Math.sin(m.phase * Math.PI * 2)) * 0.04 };

  // ---- arms and the load ----
  let cup: WorkerState['cup'] = null, bag: Vec | null = null, bagSwing = 0, lidFly: Vec | null = null;
  const plantState = { on: f >= b.plantLand && f < b.plantBack, tilt: 0, rustle: 0, s: 0.55 };
  if (f < b.cupLand) {
    // walking with one hand already out for the handle
    const r = tween(f, b.reach - 10, 16);
    if (r > 0) {
      const handle: Vec = [doorEdge(doorOpen(f)) - 34, FLOOR - DOOR.h * 0.47];
      pose = reachB(W_BUILD, pose, at, lerpV(handAt(W_BUILD, pose, -1, at), handle, r));
      pose.handL = r > 0.6 ? 'open' : pose.handL;
    }
  } else if (f < b.cupBack) {
    // the cup in the left hand (or under his chin)
    const cupHold = tween(f, b.cupLand, 10);
    const handNow = handAt(W_BUILD, pose, -1, at);
    pose = holdT(W_BUILD, pose, lerpV(toTorso(W_BUILD, pose, at.x, at.y, at.s, 1, at.bob ?? 0, handNow), CUP_T, cupHold));
    pose.handL = 'mitten';
    let p = handAt(W_BUILD, pose, -1, at), rot = 0;
    const slip = tween(f, b.slide, 18), toChin = tween(f, b.chin - 2, 8), back = tween(f, b.straighten + 2, 10);
    if (f >= b.slide && f < b.straighten + 12) {
      const chinW = torsoToWorld(W_BUILD, pose, at, CHIN_T);
      const slipP: Vec = [p[0] - 30 * slip, p[1] + 26 * slip];
      p = lerpV(lerpV(p, slipP, 1), chinW, toChin * (1 - back));
      p = lerpV(p, handAt(W_BUILD, pose, -1, at), back);
      rot = -38 * slip * (1 - toChin) - 30 * toChin * (1 - back);
    }
    if (f >= b.straighten + 12 && f < b.shut + 30) rot = Math.sin((f - b.stagger) * 0.5) * 10 * (1 - tween(f, b.shut + 10, 20));
    // passing it back across his body to the colleague after «تمام»
    if (f >= b.tamam + 8) {
      const give = tween(f, b.tamam + 8, 12);
      pose = reachB(W_BUILD, pose, at, lerpV(handAt(W_BUILD, pose, -1, at), meetCup(), give), null, { L: -1 });
      p = handAt(W_BUILD, pose, -1, at);
    }
    const tremble = f >= b.noEnd && f < b.tamam + 6 ? Math.sin(f * 2.7) * 4 * clamp((f - b.noEnd) / 10) : 0;
    cup = { holder: 'W', p, rot, lid: f < b.lidPop, tremble };
    if (f >= b.lidPop && f < b.lidPop + 20) {
      const cupTop: Vec = [p[0], p[1] - 55];
      lidFly = arcPt(cupTop, torsoToWorld(W_BUILD, pose, at, [-41, -46]), tween(f, b.lidPop, 20), 140);
    }
  }

  // the bag, right hand (outside the pot); the phone reach lifts it across
  if (f >= b.bagLand && f < b.bagBack) {
    const toPhone = keys(f, [[b.finger, 0], [b.finger + 14, 1], [b.chin + 4, 1], [b.straighten, 0.6], [b.straighten + 10, 0]]);
    const t = lerpV(BAG_T, [-30, -110], toPhone * 0.75);
    const settle = tween(f, b.bagLand, 8);
    const handNow = handAt(W_BUILD, pose, 1, at);
    pose = holdT(W_BUILD, pose, null, lerpV(toTorso(W_BUILD, pose, at.x, at.y, at.s, 1, at.bob ?? 0, handNow), t, settle));
    pose.handR = toPhone > 0.5 ? 'point' : 'fist';
    bag = handAt(W_BUILD, pose, 1, at);
    bagSwing = Math.sin(f * 0.21) * 4 + (f > b.finger && f < b.straighten + 20 ? Math.sin((f - b.finger) * 0.3) * 12 : 0) + sway * 1.5;
  } else if (f >= b.bagLand - 20 && f < b.bagLand) {
    const g = tween(f, b.bagLand - 20, 18);
    pose = reachB(W_BUILD, pose, at, null, lerpV(handAt(W_BUILD, pose, 1, at), meetBag(), g));
  }

  // the plant under the right arm: tilts when the arm leaves it, back when he straightens
  if (plantState.on) {
    plantState.tilt = keys(f, [[b.finger + 10, 0], [b.tilt, 8], [b.tilt + 14, 42], [b.straighten, 42], [b.straighten + 12, -6], [b.straighten + 20, 0]], ease.out) + sway * 1.4;
    plantState.rustle = f < b.plantLand + 30 || (f > b.tilt && f < b.straighten + 20) ? 1 : 0.3;
    plantState.s = 0.55 * (1 + 0.25 * keys(f, [[b.tilt, 0], [b.tilt + 14, 1], [b.straighten, 1], [b.straighten + 12, 0]]));
  }

  // ---- after the load: free hands, the mask, the walk, the lid, the call to action ----
  if (f >= b.tailFree - 4 && f < b.tailFree + 22) {
    const door: Vec = [doorEdge(doorOpen(f)) - 30, FLOOR - DOOR.h * 0.47];
    pose = reachB(W_BUILD, pose, at, lerpV(handAt(W_BUILD, pose, -1, at), door, tween(f, b.tailFree - 4, 8) * (1 - tween(f, b.tailFree + 14, 8))));
  }
  const free = f >= b.tailFree + 22;
  if (free && f < b.maskOn) {
    const sh = f >= b.shake && f < b.one ? Math.sin((f - b.shake) * 0.9) * 14 : 0;
    pose = holdT(W_BUILD, pose, [-70 + sh, -92 + sh * 0.5], f >= b.one ? [40, -300] : [70 - sh, -92 - sh * 0.5]);
    pose.handL = 'open'; pose.handR = f >= b.one ? 'point' : 'open';
  }
  if (f >= b.maskOn && f < b.walk0) {
    const drop = f >= b.heavy ? keys(f, [[b.heavy, 0], [b.heavy + 5, 1], [b.pop, 1], [b.pop + 10, 0.2]], ease.out) : 0;
    pose = holdT(W_BUILD, pose, [-74, -120 + 70 * drop], [56, -60]);
    pose.handL = 'open'; pose.handR = 'mitten';
  }
  if (f >= b.wave && f < b.back0) { pose = { ...pose, armR: [150 + Math.sin((f - b.wave) * 0.5) * 18, 30] }; pose.handR = 'open'; }
  if (f >= b.glance && f < b.lidAsk) {
    const palm = tween(f, b.tomorrow - 4, 8), ten = tween(f, b.ten - 4, 6);
    pose = mixPose(pose, { ...pose, armR: [100, 20], handR: 'open' }, palm * (1 - ten));
    if (ten > 0) pose = mixPose(pose, { ...pose, armL: [70, 70], armR: [70, 70], handL: 'open', handR: 'open' }, ten);
  }
  if (f >= b.pointLid && f < b.lidGive + 20) {
    // he pulls the lid out of the pocket and puts it on the colleague's cup
    const c1 = colleague1(f);
    const pocket = torsoToWorld(W_BUILD, pose, at, [-41, -46]);
    const lidT = c1.cup ? [c1.cup.p[0], c1.cup.p[1] - 55] as Vec : pocket;
    const g = tween(f, b.lidGive - 6, 14);
    const target = f < b.lidGive - 6 ? pocket : lerpV(pocket, lidT, g);
    pose = reachB(W_BUILD, pose, at, target, null, { L: 1 });
    pose.handL = 'pinch';
    if (f >= b.lidGive - 6 && f < b.lidGive + 8) lidFly = handAt(W_BUILD, pose, -1, at);
  }
  if (f >= b.cta) {
    const tr: Array<[number, Pose]> = [[b.cta, { ...pose, armR: [30, 10], handR: 'mitten' }], [b.like - 4, { ...P('thumbsUp'), armR: [70, -130] }], [b.follow - 2, { ...P('pointCam') }], [b.ifNo - 2, { ...P('shrug') }], [b.ok - 4, { ...P('thumbsUp'), armR: [70, -130], armL: [70, -130], handL: 'thumb' }]];
    let cur = tr[0][1];
    for (const [t0, p] of tr) if (f >= t0) cur = mixPose(cur, p, tween(f, t0, 7));
    pose = { ...pose, armL: cur.armL, armR: cur.armR, handL: cur.handL, handR: cur.handR, tilt: cur.tilt };
  }

  // ---- face ----
  const expr = xTrack(f, [
    [0, 'satisfied'], [b.reach, X.relieved], [b.cupLand, 'surprised'], [b.ask + 6, 'curious'], [b.sure1 - 2, X.autoSmile], [b.sure1 + 20, X.cheek],
    [b.sure2 - 2, X.autoSmile], [b.sure2 + 10, X.cheek], [b.plantGive, 'surprised'], [b.sure3 - 2, X.strain], [b.sure3 + 16, X.wobble],
    [b.alone, X.wobble], [b.tryStep, X.strain], [b.stepBack, X.hesitant], [b.buzz + 6, 'surprised'], [b.msg, X.hesitant],
    [b.finger, X.strain], [b.slide, X.panic], [b.chin + 4, X.strain], [b.tilt + 4, X.panic], [b.straighten, X.strain], [b.shut + 2, 'surprised'],
    [b.shut + 20, X.hesitant], [b.clockLook, X.dread], [b.list, 'curious'], [b.mouth, 'surprised'], [b.think, X.dread], [b.gulp, X.gulp], [b.unthink + 4, X.hesitant],
    [b.deskAsk - 4, X.hesitant], [b.imag0, X.dread], [b.imag1, X.breathe], [b.no - 6, X.calm], [b.appt, X.firm], [b.noEnd + 6, X.hesitant],
    [b.tamam + 2, 'surprised'], [b.tamam + 18, X.relieved], [b.bagBack, 'curious'], [b.plantBack + 6, X.relieved],
    [b.shake, 'surprised'], [b.one - 6, 'laugh'], [b.maskOn, 'curious'], [b.heavy, X.strain], [b.pop - 6, X.relieved], [b.pop + 6, 'satisfied'],
    [b.walk0, 'laugh'], [b.back0 + 10, X.sincere], [b.peek + 6, 'curious'], [b.tomorrow - 4, X.sincere], [b.lidAsk + 8, 'curious'],
    [b.lookDown, 'surprised'], [b.pointLid + 4, 'embarrassed'], [b.laugh, 'laugh'], [b.cta, X.sincere], [b.like, X.proud], [b.ifNo, 'smug'], [b.ok - 2, 'laugh'],
  ]);
  // ---- eyes ----
  let look: Vec = m.v > 1 ? [m.dir * 0.55, 0] : [0, 0];
  const L = (from: number, to: number, v: Vec) => { if (f >= from && f < to) look = v; };
  L(b.cupLand, b.ask, [-0.6, 0.2]); L(b.ask, b.c2In + 20, [-0.6, 0]); L(b.c2In + 20, b.c3In + 20, [0.6, 0]); L(b.c3In + 20, b.leave, [0.5, 0.1]);
  L(b.leave, b.alone, [0.6, 0]); L(b.alone, b.tryStep, [-0.7, -0.1]); L(b.buzz, b.finger, [-0.3, 0.6]); L(b.finger, b.slide, [-0.3, 0.6]);
  L(b.slide, b.straighten, [-0.5, 0.4]); L(b.tilt, b.straighten, [0.6, 0.3]); L(b.shut, b.shut + 24, [-0.6, 0.2]); L(b.clockLook, b.list, [0.35, -0.8]);
  L(b.list, b.think, [0.7, -0.2]); L(b.c1Back + 10, b.imag0, [0.6, -0.1]); L(b.imag0, b.imag1, [0.4, -0.3]); L(b.no - 4, b.cupBack + 10, [0.55, -0.1]);
  L(b.c2Return + 20, b.bagBack + 10, [0.6, 0.1]); L(b.c3Return + 20, b.plantBack + 10, [0.6, 0.1]); L(b.tailFree - 6, b.tailFree + 20, [-0.7, 0.2]);
  L(b.shake, b.maskOn, [0, 0.4]); L(b.maskOn, b.pop + 6, [-0.45, 0.2]); L(b.wave, b.back0, [0.7, -0.1]); L(b.peek, b.glance, [0.6, 0]);
  L(b.glance, b.glance + 12, [0.5, 0.3]); L(b.glance + 12, b.tomorrow, [0.3, -0.8]); L(b.tomorrow, b.lookDown, [0.55, 0]); L(b.lookDown, b.laugh, [-0.2, 0.8]);
  L(b.laugh, b.cta, [0.5, 0]); L(b.cta, N, [0, 0]);
  const tail: Vec | null = stuck ? toTorso(W_BUILD, pose, at.x, at.y, at.s, 1, at.bob ?? 0, [doorEdge(0) - 6, FLOOR - 70]) : null;
  const buzz = f >= b.buzz && f < b.finger ? (Math.floor((f - b.buzz) / 3) % 2 ? 3 : -3) * (Math.floor((f - b.buzz) / 14) % 2 ? 0 : 1) : 0;
  return {
    at, pose, expr, look, glance: look, talk: talkAt(f, 'W'), tail, lid: f >= b.lidPop + 20 && f < b.pointLid + 8 ? 1 : 0,
    phone: { buzz, up: f >= b.buzz ? 10 : 0 }, plant: plantState, cup, bag, bagSwing, lidFly,
  };
};

/* ------------------------------ the colleagues ------------------------------ */

type Mate = { at: At; pose: Pose; expr: Expression; look: Vec; handL: Vec; handR: Vec; on: boolean; talk: number;
  cup?: { p: Vec; lid: boolean } | null; bag?: Vec | null; plant?: { p: Vec; tilt: number } | null };

const c1Move = mover(() => {
  const b = B();
  return [[0, 30], [b.cupIn, 30], [b.cupLand + 6, 110], [b.leave, 110], [b.leave + 90, 1300], [b.c1Back, 1100], [b.c1Back + 32, 520],
    [b.tamam + 6, 520], [b.cupBack - 2, 470], [b.cupBack + 4, 470], [b.cupBack + 24, 660], [b.deskPush, 660], [b.deskStop, 1160], [b.c1Fetch, 1160], [b.peek, 560]];
});
const deskX = (f: number) => keys(f, [[B().deskPush, DESK0], [B().deskStop, DESK1]], ease.inOut);
const cupOnDesk = (f: number): Vec => [deskX(f) - 130, FLOOR - 330];

export const colleague1 = (f: number): Mate => {
  const b = B();
  const m = c1Move(f);
  const id = idle(f, 23);
  const at: At = { x: m.x, y: FLOOR, s: S, facing: 1, bob: id.bob };
  let pose = walkMix(P('stand'), m);
  let cup: Mate['cup'] = null;
  // in through the door with the cup held out for the hand that wanted the handle
  if (f < b.cupLand) {
    const w = worker(Math.min(f, b.cupLand)).pose;
    const wHand = handAt(W_BUILD, w, -1, { x: wMove(f).x, y: FLOOR, s: S, facing: 1 });
    const t = tween(f, b.cupIn - 6, 12);
    pose = reachB(B1, pose, at, null, lerpV(handAt(B1, pose, 1, at), wHand, t));
    cup = { p: handAt(B1, pose, 1, at), lid: true };
  }
  if (f >= b.ask && f < b.sure1 + 4) pose = mixPose(pose, { ...P('point'), armR: [130, 20], handR: 'point', armL: [20, 30] }, tween(f, b.ask, 8));
  if (f >= b.sure1 + 4 && f < b.shoe) pose = mixPose(pose, P('thumbsUp'), tween(f, b.sure1 + 4, 6));
  if (f >= b.shoe && f < b.leave) pose = mixPose(pose, { ...P('hipsHands'), lean: -4, tilt: 4 }, tween(f, b.shoe, 10) * (1 - tween(f, b.leave - 10, 10)));
  if (f >= b.c1Back + 30 && f < b.imag0) pose = mixPose(pose, { ...P('point'), armR: [84, 4] }, tween(f, b.deskAsk - 8, 8));
  if (f >= b.tamam - 4 && f < b.cupBack) pose = mixPose(pose, { ...P('shrug'), armL: [40, 60] }, tween(f, b.tamam - 4, 6) * (1 - tween(f, b.tamam + 10, 6)));
  // takes the cup back with the left hand, from where the worker's hand really is
  if (f >= b.tamam + 10 && f < b.deskPush) {
    const reachIn = tween(f, b.tamam + 10, 10) * (1 - tween(f, b.cupBack + 4, 10));
    const wHand = worker(b.cupBack - 1).cup?.p ?? meetCup();
    pose = reachB(B1, pose, at, lerpV(handAt(B1, pose, -1, at), wHand, reachIn));
    if (f >= b.cupBack) cup = { p: handAt(B1, pose, -1, at), lid: false };
  }
  // pushes the desk
  if (f >= b.cupBack + 24 && f < b.deskStop + 8) {
    const desk: Vec = [deskX(f) - 230, FLOOR - 320];
    pose = { ...pose, lean: 18 * tween(f, b.deskPush - 6, 8) };
    pose = reachB(B1, pose, at, desk, [desk[0] + 10, desk[1] + 20]);
  }
  if (f >= b.wave && f < b.c1Fetch) pose = { ...pose, armR: [150 + Math.sin((f - b.wave) * 0.5) * 18, 30], handR: 'open' };
  if (f >= b.c1Fetch && f < b.c1Fetch + 10) pose = reachB(B1, pose, at, cupOnDesk(f));
  if (f >= b.c1Fetch + 6) {
    const sip = f >= b.cta + 16 && f < b.cta + 56 ? tween(f, b.cta + 16, 10) * (1 - tween(f, b.cta + 44, 10)) : 0;
    pose = holdT(B1, pose, lerpV([-80, -70], [-30, -236], sip));
    cup = { p: handAt(B1, pose, -1, at), lid: f >= b.lidGive + 2 };
    if (f >= b.peek) pose = { ...pose, lean: -8 * tween(f, b.peek, 8) * (1 - tween(f, b.tomorrow, 10)) };
    if (f >= b.laugh && f < b.cta) pose = { ...pose, tilt: Math.sin((f - b.laugh) * 0.55 + 1) * 6 };
    if (f >= b.thumb) pose = mixPose(pose, { ...pose, armR: [32, -100], handR: 'thumb' }, tween(f, b.thumb, 6));
  }
  if (f >= b.cupBack && f < b.c1Fetch && f >= b.deskPush - 4) cup = { p: f < b.deskPush + 2 ? lerpV(handAt(B1, pose, -1, at), cupOnDesk(f), tween(f, b.deskPush - 4, 6)) : cupOnDesk(f), lid: false };
  const expr = xTrack(f, [[0, 'satisfied'], [b.ask, 'curious'], [b.sure1 + 4, 'laugh'], [b.shoe, 'neutral'], [b.c1Back, 'satisfied'], [b.deskAsk, 'curious'],
    [b.no, 'neutral'], [b.noEnd + 10, 'neutral'], [b.tamam - 2, 'satisfied'], [b.deskPush, 'determined'], [b.deskStop, 'satisfied'], [b.peek, 'curious'],
    [b.lidAsk, 'smug'], [b.laugh, 'laugh'], [b.cta, 'satisfied'], [b.thumb, 'laugh']]);
  let look: Vec = m.v > 1 ? [m.dir * 0.55, 0] : [-0.55, 0];
  if (f >= b.deskAsk && f < b.imag0) look = [0.6, 0];
  if (f >= b.cta) look = [-0.3, 0];
  return { at, pose, expr, look, handL: handAt(B1, pose, -1, at), handR: handAt(B1, pose, 1, at), on: f >= b.doorOpen + 4, talk: talkAt(f, 'C'), cup };
};

const c2Move = mover(() => {
  const b = B();
  return [[0, 1150], [b.c2In, 1150], [b.c2In + 34, 520], [b.c2Back, 520], [b.c2Back + 18, 760], [b.leave + 4, 760], [b.leave + 80, 1400],
    [b.c2Return, 1300], [b.c2Return + 30, 470], [b.bagBack + 10, 470], [b.bagBack + 50, 1050]];
});
export const colleague2 = (f: number): Mate => {
  const b = B();
  const m = c2Move(f);
  const id = idle(f, 41);
  const at: At = { x: m.x, y: FLOOR, s: S, facing: 1, bob: id.bob };
  let pose = walkMix(P('stand'), m);
  let bag: Vec | null = null;
  if (f < b.bagLand) {
    const give = tween(f, b.bagGive - 14, 14);
    const wHand = meetBag();
    pose = holdT(B2, pose, [-80, -6]);
    if (give > 0) pose = reachB(B2, pose, at, lerpV(handAt(B2, pose, -1, at), wHand, give));
    pose = { ...pose, lean: -6 + 4 * give, tilt: -4 };
    bag = handAt(B2, pose, -1, at);
  }
  if (f >= b.bagBack - 14) {
    const w = worker(Math.min(f, b.bagBack - 1));
    const t = tween(f, b.bagBack - 14, 12);
    pose = reachB(B2, pose, at, f < b.bagBack ? lerpV(handAt(B2, pose, -1, at), w.bag ?? handAt(B2, pose, -1, at), t) : null);
    if (f >= b.bagBack) { pose = { ...pose, armL: [60 + Math.sin(f * 0.3) * 20, -20] }; bag = handAt(B2, pose, -1, at); }
  }
  if (f >= b.wave && f < b.back0) pose = { ...pose, armR: [150 + Math.sin((f - b.wave) * 0.5 + 1) * 18, 30], handR: 'open' };
  const expr = xTrack(f, [[0, 'satisfied'], [b.bagGive, 'laugh'], [b.leave, 'satisfied'], [b.bagBack, 'laugh'], [b.wave, 'laugh']]);
  const look: Vec = m.v > 1 ? [m.dir * 0.55, 0] : [-0.55, 0];
  return { at, pose, expr, look, handL: handAt(B2, pose, -1, at), handR: handAt(B2, pose, 1, at), on: true, talk: 0, bag };
};

const c3Move = mover(() => {
  const b = B();
  return [[0, 1250], [b.c3In, 1250], [b.c3In + 36, 590], [b.leave + 8, 590], [b.leave + 84, 1300], [b.c3Return, 1300], [b.c3Return + 28, 500],
    [b.plantBack + 12, 500], [b.plantBack + 56, 900]];
});
export const colleague3 = (f: number): Mate => {
  const b = B();
  const m = c3Move(f);
  const id = idle(f, 53);
  const at: At = { x: m.x, y: FLOOR, s: S, facing: 1, bob: id.bob };
  let pose = walkMix(P('stand'), m);
  let plant: Mate['plant'] = null;
  const hug: Vec = [-10, -40];
  const carry = (fr: number) => {
    const p = holdT(B3, pose, [hug[0] - 46, hug[1] - 30], [hug[0] + 40, hug[1] - 30]);
    return { pose: p, pot: [at.x + hug[0] * S, at.y - 200 * S + 30] as Vec, fr };
  };
  if (f < b.plantLand) {
    const c = carry(f);
    pose = c.pose;
    const w = worker(b.plantLand);
    const dst = torsoToWorld(W_BUILD, w.pose, w.at, UNDER_ARM);
    const t = tween(f, b.plantGive - 4, 14);
    const pot = lerpV(c.pot, dst, t);
    pose = reachB(B3, pose, at, [pot[0] - 40, pot[1] - 40], [pot[0] + 40, pot[1] - 40]);
    plant = { p: pot, tilt: -6 + 6 * t };
  }
  if (f >= b.plantBack - 12) {
    const w = worker(Math.min(f, b.plantBack - 1));
    const src = torsoToWorld(W_BUILD, w.pose, w.at, UNDER_ARM);
    const t = tween(f, b.plantBack - 12, 12);
    const c = carry(f);
    const pot = f < b.plantBack ? src : lerpV(src, c.pot, tween(f, b.plantBack, 10));
    pose = reachB(B3, c.pose, at, [pot[0] - 40, pot[1] - 40], [pot[0] + 40, pot[1] - 40]);
    if (f >= b.plantBack) plant = { p: pot, tilt: 0 };
    void t;
  }
  if (f >= b.wave && f < b.back0) pose = { ...pose, armL: [150 + Math.sin((f - b.wave) * 0.5 + 2) * 18, 30], handL: 'open' };
  const expr = xTrack(f, [[0, 'satisfied'], [b.plantGive, 'tender'], [b.leave, 'satisfied'], [b.plantBack, 'laugh'], [b.wave, 'laugh']]);
  const look: Vec = m.v > 1 ? [m.dir * 0.55, 0] : [-0.55, 0];
  return { at, pose, expr, look, handL: handAt(B3, pose, -1, at), handR: handAt(B3, pose, 1, at), on: true, talk: 0, plant };
};

/* ------------------------------ drawing ------------------------------ */

const Wall: React.FC = () => (
  <g>
    <rect x={BOUNDS[0]} y={BOUNDS[1] - 400} width={BOUNDS[2] - BOUNDS[0]} height={FLOOR - BOUNDS[1] + 400} fill={C.wall} />
    <rect x={BOUNDS[0]} y={FLOOR - 380} width={BOUNDS[2] - BOUNDS[0]} height={380} fill={C.wallLow} />
    <path d={bowLine(BOUNDS[0], FLOOR - 380, BOUNDS[2], FLOOR - 380, 2)} {...stroke(10, C.rail)} />
    {Array.from({ length: 26 }, (_, i) => {
      const x = BOUNDS[0] + 80 + i * 120, y = 420 + (i % 3) * 210;
      return <path key={i} d={`M${x} ${y} l 18 -18 l 18 18`} fill="none" stroke={C.rail} strokeWidth={5} opacity={0.5} />;
    })}
    <rect x={BOUNDS[0]} y={FLOOR} width={BOUNDS[2] - BOUNDS[0]} height={BOUNDS[3] - FLOOR + 200} fill={C.floor} />
    <path d={bowLine(BOUNDS[0], FLOOR, BOUNDS[2], FLOOR, 3)} {...stroke()} />
    {Array.from({ length: 16 }, (_, i) => <path key={i} d={bowLine(BOUNDS[0] + i * 220, FLOOR + 30, BOUNDS[0] + i * 220 - 180, BOUNDS[3] + 200, 4)} stroke={C.floorLine} strokeWidth={6} />)}
  </g>
);

export type WorldOpts = { imagine?: number; masks?: number; lightsOff?: number; doorAway?: number; hideMates?: boolean; plantBig?: number };

/** The whole studio at frame f. */
export const World: React.FC<{ f: number; o?: WorldOpts }> = ({ f, o = {} }) => {
  const b = B();
  const w = worker(f), c1 = colleague1(f), c2 = colleague2(f), c3 = colleague3(f);
  const im = o.imagine ?? 0, off = o.lightsOff ?? 0;
  const lit = 1 - off;
  const ck = clockText(f);
  const mate = (m: Mate, Comp: typeof Litterer, seed: number) => m.on ? (
    <Comp x={m.at.x} y={m.at.y} s={m.at.s} pose={m.pose} expr={m.expr} blink={idle(f, seed).blink} bob={m.at.bob} look={m.look} glance={m.look} talk={m.talk} />
  ) : null;
  const plantNode = w.plant.on ? <g transform={`translate(${UNDER_ARM[0]} ${UNDER_ARM[1]})`}><Plant x={0} y={0} s={w.plant.s} tilt={w.plant.tilt} rustle={w.plant.rustle} seed={f} /></g> : null;
  return (
    <g>
      <Wall />
      {/* the set */}
      <Backdrop x={1800} y={FLOOR} w={760} />
      <Softbox x={1200} y={FLOOR} on={lit * (f >= b.lightsOff + 6 && im > 0 ? 0 : 1)} />
      <Softbox x={2350} y={FLOOR} on={lit * (f >= b.lightsOff + 12 && im > 0 ? 0 : 1)} flip />
      <Tripod x={1520} y={FLOOR} />
      {/* the exit */}
      <Door x={DOOR_X} y={FLOOR} open={doorOpen(f)} shrink={o.doorAway ?? 0} />
      <ExitSign x={DOOR_X} y={FLOOR - DOOR.h - 70} lit={im > 0 ? 1 - prog(f, b.lightsOff, 4, ease.linear) : 1} />
      <DigitalClock x={CLOCK[0]} y={CLOCK[1]} s={0.8} text={ck.text} flip={ck.flip} />
      <Clipboard x={LIST[0]} y={LIST[1]} s={0.85} />
      <PhotoDesk x={deskX(f)} y={FLOOR} roll={deskX(f) / 22} />
      {/* people: the colleagues pass behind the worker */}
      {!o.hideMates && mate(c2, Spitter, 41)}
      {!o.hideMates && mate(c3, Passerby, 53)}
      {!o.hideMates && mate(c1, Litterer, 23)}
      {/* the plant in transit (C3's arms) */}
      {c3.plant && <Plant x={c3.plant.p[0]} y={c3.plant.p[1]} s={0.55} tilt={c3.plant.tilt} rustle={0.5} seed={f} />}
      <Worker x={w.at.x} y={w.at.y} s={w.at.s} pose={w.pose} expr={w.expr} blink={idle(f, 61).blink} bob={w.at.bob} look={w.look} glance={w.glance}
        talk={w.talk} tail={w.tail} lid={w.lid} phone={w.phone} underArm={plantNode} />
      {/* the load */}
      {w.bag && <Bag x={w.bag[0]} y={w.bag[1]} s={0.62} swing={w.bagSwing} />}
      {c2.bag && <Bag x={c2.bag[0]} y={c2.bag[1]} s={0.62} swing={Math.sin(f * 0.2) * 6} />}
      {w.cup && <Cup x={w.cup.p[0]} y={w.cup.p[1] + 30} s={0.85} rot={w.cup.rot} lid={w.cup.lid} tremble={w.cup.tremble} />}
      {c1.on && c1.cup && <Cup x={c1.cup.p[0]} y={c1.cup.p[1] + 30} s={0.85} lid={c1.cup.lid} steam={1} />}
      {w.lidFly && <Lid x={w.lidFly[0]} y={w.lidFly[1]} s={0.85} rot={(f % 30) * 12} />}
      {/* strain lines while the pile sways */}
      {f >= b.sure3 && f < b.buzz && <ShakeLines x={w.at.x} y={FLOOR - 520} r={150} o={0.5 + 0.5 * Math.sin(f * 0.4)} seed={Math.floor(f / 4)} />}
      {/* the swallowed sentence: tiny frowns in a thought bubble */}
      <Thought x={w.at.x + 70} y={FLOOR - 600} dx={150} dy={-230} rx={210} ry={130} p={f >= b.think - 2 && f < b.unthink ? prog(f, b.think - 2, 8) : 0}>
        <TinyFrown x={-110} y={10} seed={1} /><TinyFrown x={0} y={-20} seed={2} /><TinyFrown x={110} y={10} seed={3} />
      </Thought>
      {/* the imagination: everything goes dark; the colleagues become giant frowns */}
      {im > 0 && <rect x={BOUNDS[0]} y={BOUNDS[1] - 400} width={BOUNDS[2] - BOUNDS[0]} height={BOUNDS[3] - BOUNDS[1] + 800} fill="#05070B" opacity={0.55 * im + 0.35 * off} />}
      {im > 0 && (o.masks ?? 0) > 0 && (
        <g>
          <FrownMask x={c1.at.x} y={FLOOR - 470} r={190 * (o.masks ?? 0)} seed={1} />
          <FrownMask x={680} y={760} r={160 * (o.masks ?? 0)} seed={2} tint="#2E1A30" />
          <FrownMask x={60} y={700} r={150 * (o.masks ?? 0)} seed={3} tint="#3B1A22" />
        </g>
      )}
      {im > 0 && <Worker x={w.at.x} y={w.at.y} s={w.at.s} pose={w.pose} expr={w.expr} blink={0} bob={w.at.bob} look={w.look} glance={w.glance} tail={w.tail} lid={w.lid} phone={w.phone} underArm={plantNode} />}
      {im > 0 && w.bag && <Bag x={w.bag[0]} y={w.bag[1]} s={0.62} swing={w.bagSwing} />}
      {im > 0 && w.cup && <Cup x={w.cup.p[0]} y={w.cup.p[1] + 30} s={0.85} rot={w.cup.rot} lid={w.cup.lid} />}
      {/* the weight of an imagined frown (the meaning section): a small mask in his palm */}
      {f >= b.maskOn && f < b.pop + 14 && (() => {
        const hand = handAt(W_BUILD, w.pose, -1, w.at);
        const k = prog(f, b.maskOn, 10, ease.back) * (1 - prog(f, b.pop, 8, ease.in));
        return <FrownMask x={hand[0]} y={hand[1] - 70 * k} r={56 * k} seed={4} tint="#4A2230" />;
      })()}
      {f >= b.pop && f < b.pop + 16 && <g opacity={1 - (f - b.pop) / 16}>{Array.from({ length: 8 }, (_, i) => {
        const hand = handAt(W_BUILD, w.pose, -1, w.at), an = (i / 8) * Math.PI * 2, r = 40 + (f - b.pop) * 7;
        return <path key={i} d={`M${hand[0] + Math.cos(an) * r} ${hand[1] - 70 + Math.sin(an) * r} l${Math.cos(an) * 20} ${Math.sin(an) * 20}`} {...stroke(7, PAL.blueSoft)} />;
      })}</g>}
      {/* the phone's message, popping out of the breast pocket */}
      {f >= b.msg - 4 && f < b.finger + 10 && (() => {
        const hd = torsoToWorld(W_BUILD, w.pose, w.at, [0, -260]);
        const k = 0.62 * prog(f, b.msg - 4, 8, ease.back) * (1 - prog(f, b.finger + 2, 8, ease.in));
        return (
          <g transform={`translate(${hd[0] - 40} ${hd[1] - 165}) scale(${k})`}>
            <path d="M-120 -54 Q-120 -78 -96 -78 L96 -78 Q120 -78 120 -54 L120 30 Q120 54 96 54 L40 54 L70 96 L0 54 L-96 54 Q-120 54 -120 30Z" fill={PAL.blue} {...stroke()} />
            <text x={0} y={8} textAnchor="middle" fontFamily="Cairo, sans-serif" fontWeight={900} fontSize={64} fill={PAL.white} direction="rtl">وصلت</text>
          </g>
        );
      })()}
    </g>
  );
};
