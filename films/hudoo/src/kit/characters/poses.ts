import type { Gesture } from './hands';
import { pose, type Pose } from './skeleton';

/** A named body pose with the hands that belong to it. Seventeen of them; scenes mix and key between them. */
export type Stance = { p: Pose; hands: { R: Gesture; L: Gesture }; name: string };
const st = (name: string, p: Partial<Pose>, R: Gesture = 'relaxed', L: Gesture = 'relaxed'): Stance => ({ name, p: pose(p), hands: { R, L } });

export const POSES = {
  stand: st('وقوف', {}),
  standFront: st('وقوف من الأمام', { turn: 0, body: 0, R: { sh: -8, el: 6 }, L: { sh: 8, el: 6 }, footR: [-16, 0], footL: [16, 0] }),
  walk: st('مشي', { lean: 4 }),
  sit: st('جلوس', { sit: 1, footR: [52, 0], footL: [64, 0], R: { hand: [48, -128] }, L: { hand: [62, -126] } }),
  sitTense: st('جلوس متوتر يضغط القلم', { sit: 1, lean: 4, head: 6, footR: [50, 0], footL: [62, 0], R: { hand: [56, -128] }, L: { hand: [70, -124] } }, 'relaxed', 'pen'),
  sitType: st('جلوس يكتب', { sit: 1, lean: 8, footR: [52, 0], footL: [64, 0], R: { hand: [74, -150] }, L: { hand: [86, -146] } }, 'relaxed', 'relaxed'),
  armsCrossed: st('ذراعان متشابكتان', { head: -4, R: { hand: [18, -168], bend: -1 }, L: { hand: [-6, -172], bend: -1 } }, 'fist', 'fist'),
  handsOnHips: st('يدان على الخصر (استعراض)', { body: 0.15, turn: 0.15, lean: -4, head: -8, R: { hand: [-40, -136], bend: -1 }, L: { hand: [40, -136], bend: 1 }, footR: [-22, 0], footL: [22, 0] }, 'fist', 'fist'),
  point: st('يشير بإصبعه (مقاطعة)', { lean: 6, L: { sh: 82, el: 4 } }, 'relaxed', 'point'),
  explain: st('يشرح بكفّين مفتوحتين', { R: { hand: [52, -168] }, L: { hand: [70, -160] } }, 'cup', 'open'),
  handOnChest: st('يد على الصدر', { head: 6, L: { hand: [22, -196], bend: -1 } }, 'relaxed', 'open'),
  phone: st('يقرأ الهاتف', { head: 14, R: { hand: [44, -176] }, L: { hand: [40, -170] } }, 'relaxed', 'grip'),
  breathe: st('يتنفس، يد على البطن', { head: -4, breath: 1, L: { hand: [26, -140], bend: -1 }, R: { hand: [18, -186], bend: -1 } }, 'open', 'open'),
  headInHands: st('رأس بين يديه', { sit: 1, lean: 22, head: 18, footR: [52, 0], footL: [64, 0], R: { hand: [56, -218] }, L: { hand: [66, -214] } }, 'open', 'open'),
  stop: st('يد مرفوعة «لحظة»', { L: { hand: [70, -196] } }, 'relaxed', 'stop'),
  slump: st('منحنٍ متعب', { lean: 10, head: 22, bob: 6, R: { sh: 2, el: 4 }, L: { sh: 4, el: 4 } }),
  shrug: st('يهز كتفيه', { head: -6, R: { hand: [-44, -168], bend: 1 }, L: { hand: [52, -166] } }, 'cup', 'cup'),
  stepBack: st('يتراجع خطوة', { lean: -8, head: -6, footR: [-34, 0], footL: [8, 0], L: { sh: 30, el: 40 } }, 'relaxed', 'open'),
  listen: st('ينصت مائلًا', { lean: 7, head: 8, R: { hand: [30, -150] }, L: { hand: [36, -152] } }, 'relaxed', 'relaxed'),
  write: st('يكتب في دفتر', { sit: 1, lean: 14, head: 16, footR: [52, 0], footL: [64, 0], R: { hand: [80, -132] }, L: { hand: [96, -136] } }, 'open', 'pen'),
} satisfies Record<string, Stance>;
export type PoseName = keyof typeof POSES;
