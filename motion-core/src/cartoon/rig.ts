/**
 * Baseera cartoon rig — the pure half of the character kit.
 *
 * A character is two flat records of numbers: a Pose (body) and a Face (expression).
 * Named poses and expressions are partial records; scenes blend between them with
 * keyframes that are pure functions of the frame. No clocks, no state, no randomness:
 * any frame can be rendered alone and in any order.
 */

export type Pose = {
  lean: number;     // torso lean in degrees, + = toward the facing side
  bob: number;      // whole-body vertical offset (px, + = down), for bounce and slump
  headTilt: number; // degrees
  headTurn: number; // 0 = toward camera, 1 = full three-quarter toward the facing side
  shF: number; elF: number; // far arm: shoulder and elbow, degrees. 0 = hanging; + = swings forward (toward facing)
  shN: number; elN: number; // near arm
  hipF: number; knF: number; hipN: number; knN: number; // legs, same convention
  sit: number;      // 0 standing … 1 seated (hips at seat height)
  chest: number;    // 0 … 1 chest out (pride)
};

export type Face = {
  brow: number;   // + = inner ends up (worry, sadness), − = inner ends down (anger, resolve)
  browY: number;  // raise −1 … 1
  lid: number;    // upper lid 0 open … 1 closed
  lidLow: number; // lower lid 0 … 1 (smile squint)
  pupil: number;  // pupil scale
  gx: number; gy: number; // gaze −1 … 1 (gx + = toward the facing side)
  mouth: number;  // curve −1 frown … 1 smile
  open: number;   // 0 … 1
  wide: number;   // mouth width scale
  blush: number; sweat: number; sparkle: number; // 0 … 1
};

export const REST: Pose = {
  lean: 0, bob: 0, headTilt: 0, headTurn: 0.25,
  shF: 6, elF: 8, shN: -6, elN: 8, hipF: 3, knF: 0, hipN: -3, knN: 0, sit: 0, chest: 0,
};

export const CALM: Face = {
  brow: 0, browY: 0, lid: 0.12, lidLow: 0, pupil: 1, gx: 0, gy: 0,
  mouth: 0.15, open: 0, wide: 1, blush: 0, sweat: 0, sparkle: 0,
};

/** Body language. Each entry overrides only what it needs; the rest comes from REST. */
export const POSES = {
  stand: {},
  proud: { chest: 1, lean: -4, headTilt: -6, shF: 38, elF: -112, shN: -38, elN: 112 }, // hands on hips
  point: { shF: 70, elF: 6, lean: 3 },                                                   // far arm points ahead
  explain: { shF: 35, elF: 55, shN: 30, elN: 60, lean: 2 },                              // open palms
  think: { shN: 20, elN: 140, headTilt: 8, lean: -2 },                                   // hand on chin
  shrug: { shF: 22, elF: 72, shN: -22, elN: -72, headTilt: 10, bob: 3 },
  cross: { shF: -12, elF: -84, shN: 14, elN: 84, lean: -3 },                             // arms crossed
  slump: { lean: 8, bob: 10, headTilt: 14, shF: 2, elF: 4, shN: -2, elN: 4 },
  scratch: { shN: -150, elN: -72, headTilt: -8 },                                        // embarrassed head scratch
  holdUp: { shF: 120, elF: 20 },                                                         // raises something (keys)
  phone: { shF: 14, elF: -142, headTilt: 12, lean: 3 },                                  // holds a phone up in front
  wave: { shF: 150, elF: 30 },
  carry: { shF: 45, elF: 70, shN: 45, elN: 70, lean: -2 },                               // holds a box in front
  cheer: { shF: 158, elF: 14, shN: -158, elN: -14, chest: 0.6, bob: -6 },
  seated: { sit: 1, hipF: 90, knF: -90, hipN: 90, knN: -90, shF: 55, elF: 30, shN: 55, elN: 30 }, // hands on the wheel
  turnAway: { headTurn: 1, lean: -2 },
  lookBack: { headTurn: -0.6, headTilt: -4 },
} satisfies Record<string, Partial<Pose>>;

/** Facial expressions, as partial overrides of CALM. */
export const FACES = {
  calm: {},
  smile: { mouth: 0.8, lidLow: 0.25 },
  grin: { mouth: 1, open: 0.45, wide: 1.15, lidLow: 0.35 },
  proud: { mouth: 0.7, lid: 0.42, lidLow: 0.2, browY: 0.25, brow: -0.15 },
  dreamy: { mouth: 0.55, open: 0.15, gy: -0.6, gx: 0.3, browY: 0.5, sparkle: 1, pupil: 1.25 },
  embarrassed: { mouth: -0.15, wide: 0.75, gx: -0.8, gy: 0.4, brow: 0.6, blush: 1, sweat: 0.8 },
  worried: { brow: 0.9, browY: 0.35, mouth: -0.45, wide: 0.8, pupil: 0.85 },
  sad: { brow: 0.8, browY: 0.1, lid: 0.35, mouth: -0.75, gy: 0.5 },
  surprised: { browY: 1, lid: 0, pupil: 0.75, mouth: 0, open: 0.7, wide: 0.6 },
  thinking: { brow: -0.2, browY: 0.15, gx: 0.6, gy: -0.7, mouth: -0.1, wide: 0.6 },
  determined: { brow: -0.6, browY: -0.1, mouth: 0.25, lid: 0.25 },
  relieved: { lid: 0.85, mouth: 0.75, browY: 0.2, brow: 0.3 },
  wince: { brow: 0.7, lid: 0.55, mouth: -0.5, wide: 1.1, open: 0.2, sweat: 0.5 },
} satisfies Record<string, Partial<Face>>;

export type PoseName = keyof typeof POSES;
export type FaceName = keyof typeof FACES;

export const pose = (name: PoseName, extra: Partial<Pose> = {}): Pose => ({ ...REST, ...POSES[name], ...extra });
export const face = (name: FaceName, extra: Partial<Face> = {}): Face => ({ ...CALM, ...FACES[name], ...extra });

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
/** Smooth in and out, so every move settles instead of stopping dead. */
export const ease = (t: number) => { const x = clamp01(t); return x * x * (3 - 2 * x); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function mixRecord<T extends Record<string, number>>(a: T, b: T, t: number): T {
  const out = { ...a };
  for (const k in b) (out as Record<string, number>)[k] = lerp(a[k], b[k], t);
  return out;
}

export type Key<T> = { at: number; to: T; dur?: number };

/**
 * The value at `frame` of a keyframed track. Each key starts blending from whatever the
 * track was at that moment toward `to`, over `dur` frames (default 14), so keys may
 * overlap and a late key never snaps.
 */
export function track<T extends Record<string, number>>(frame: number, keys: Key<T>[]): T {
  if (!keys.length) throw new Error('track: needs at least one key');
  const sorted = [...keys].sort((a, b) => a.at - b.at);
  let v = sorted[0].to;
  for (const k of sorted.slice(1)) {
    if (frame < k.at) break;
    v = mixRecord(v, k.to, ease((frame - k.at) / (k.dur ?? 14)));
  }
  return v;
}

/** A scalar track, same rules. */
export function trackNum(frame: number, keys: Key<number>[]): number {
  return track(frame, keys.map((k) => ({ ...k, to: { v: k.to } }))).v;
}

/**
 * Walking: how far along a walk is at `frame`, and the leg and arm swing to add to the pose.
 * `cycle` is frames per two steps. Feet return to rest when the walk ends.
 */
export function walk(frame: number, from: number, to: number, start: number, frames: number, cycle = 36) {
  const t = clamp01((frame - start) / frames);
  const moving = frame >= start && frame < start + frames;
  const env = moving ? Math.sin(Math.PI * Math.min(1, t * 6, (1 - t) * 6)) : 0; // ramps in and out
  const ph = ((frame - start) / cycle) * Math.PI * 2;
  const s = Math.sin(ph) * env;
  return {
    x: lerp(from, to, ease(t) * 0.15 + t * 0.85),
    add: {
      hipF: 24 * s, knF: -22 * Math.max(0, -s), hipN: -24 * s, knN: -22 * Math.max(0, s),
      shF: -16 * s, shN: 16 * s, bob: -5 * Math.abs(Math.cos(ph)) * env, lean: 3 * env,
    } as Partial<Pose>,
  };
}

export function addPose(p: Pose, add: Partial<Pose>): Pose {
  const out = { ...p };
  for (const k in add) (out as Record<string, number>)[k] += (add as Record<string, number>)[k];
  return out;
}

/** Deterministic blink: a few frames shut every 3–4.6 s, phase set by `seed`. 60 fps base. */
export function blink(frame: number, seed = 0, fps = 60): number {
  const period = Math.round(fps * (3 + ((seed * 7919) % 17) / 10));
  const f = (frame + seed * 131) % period;
  const len = Math.max(4, Math.round(fps * 0.13));
  if (f >= len) return 0;
  return Math.sin((f / len) * Math.PI);
}

/** Small breathing so a still character never looks frozen. */
export const breathe = (frame: number, seed = 0, fps = 60) => Math.sin(((frame + seed * 53) / fps) * Math.PI * 0.55) * 1.6;
