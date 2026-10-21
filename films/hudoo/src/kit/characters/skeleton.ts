// The skeleton every character shares. Character space: feet on y = 0, up is −y, +x is the way it faces.
// One set of proportions for the whole cast (children are the same rig drawn at a smaller scale), so a pose,
// an expression or a gesture written once works on everyone.
export type V = [number, number];

/** Proportions (px at scale 1). The head is big on purpose: faces carry the story. */
export const BONES = { headR: 48, neck: 9, torso: 98, upper: 60, fore: 56, thigh: 66, shin: 64, foot: 26 } as const;

/** An arm is either angles (sh: 0 = hanging, + = swung toward +x; el: bend at the elbow) or a hand target (IK). */
export type Arm = { sh?: number; el?: number; hand?: V; bend?: 1 | -1; wrist?: number };
export type Pose = {
  lean: number; // torso lean about the hip, degrees, + toward +x
  bob: number; // hip drop, px (breathing, walking, settling)
  sit: number; // 0 standing … 1 seated: the hip drops to chair height and the thighs go level
  head: number; // head tilt, degrees, + = chin down/forward
  turn: number; // head turn: 0 front, 1 full profile toward +x, −1 toward −x
  body: number; // torso turn: 0 front, 1 profile
  R: Arm; L: Arm; // the character's own right and left arm
  footR: V; footL: V; // foot targets
  breath?: number; // 0..1 chest rise
};

export const REST: Pose = { lean: 0, bob: 0, sit: 0, head: 0, turn: 0.35, body: 0.45, R: { sh: -6, el: 8 }, L: { sh: 6, el: 8 }, footR: [-13, 0], footL: [13, 0] };
export const pose = (p: Partial<Pose> = {}): Pose => ({ ...REST, ...p, R: { ...REST.R, ...(p.R ?? {}) }, L: { ...REST.L, ...(p.L ?? {}) } });

const rad = (d: number) => (d * Math.PI) / 180;
export const dir = (deg: number): V => [Math.sin(rad(deg)), Math.cos(rad(deg))]; // 0 = down, + = toward +x
export const add = (a: V, b: V, k = 1): V => [a[0] + b[0] * k, a[1] + b[1] * k];
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Two-bone IK from a to t; bend +1 puts the middle joint toward +x, −1 toward −x. Reach is clamped, never stretched. */
export const ik = (a: V, t: V, l1: number, l2: number, bend: 1 | -1): V => {
  const dx = t[0] - a[0], dy = t[1] - a[1];
  const d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const ang = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const th = base - bend * ang;
  return [a[0] + l1 * Math.cos(th), a[1] + l1 * Math.sin(th)];
};

export type Joints = ReturnType<typeof joints>;
/** World joints of a pose in character space. */
export function joints(p: Pose) {
  const B = BONES;
  const seat = 112; // chair seat height
  const standHip = -(B.thigh + B.shin) + 2;
  const hipY = mix(standHip, -seat, p.sit) + p.bob;
  const hip: V = [mix(0, -8, p.sit), hipY];
  const L = rad(p.lean);
  const up = (k: number): V => [hip[0] + Math.sin(L) * k, hip[1] - Math.cos(L) * k];
  const across = (x: number, y: number): V => [hip[0] + x * Math.cos(L) - y * Math.sin(L), hip[1] + x * Math.sin(L) + y * Math.cos(L)];
  const chest = (p.breath ?? 0) * 3;
  const neck = up(B.torso + chest);
  const sw = mix(30, 6, p.body), hw = mix(15, 4, p.body);
  // shoulders: the character's right is −x in its own frame (front view: its right is the viewer's left)
  const shR = across(-sw, -(B.torso - 8 + chest)), shL = across(sw * 0.85, -(B.torso - 8 + chest));
  const headC = add(neck, dir(180 - (p.lean + p.head * 0.6)), B.neck + B.headR);
  const arm = (s: V, a: Arm, side: -1 | 1) => {
    if (a.hand) {
      const elbow = ik(s, a.hand, B.upper, B.fore, a.bend ?? (side === 1 ? -1 : -1));
      const d = Math.hypot(a.hand[0] - elbow[0], a.hand[1] - elbow[1]);
      const wrist: V = d > B.fore ? add(elbow, [(a.hand[0] - elbow[0]) / d, (a.hand[1] - elbow[1]) / d], B.fore) : a.hand;
      return { shoulder: s, elbow, wrist, foreDeg: Math.atan2(wrist[0] - elbow[0], wrist[1] - elbow[1]) * 180 / Math.PI };
    }
    const elbow = add(s, dir((a.sh ?? 0) + p.lean), B.upper);
    const fd = (a.sh ?? 0) + (a.el ?? 0) + p.lean;
    return { shoulder: s, elbow, wrist: add(elbow, dir(fd), B.fore), foreDeg: fd };
  };
  const hipR: V = [hip[0] - hw, hip[1]], hipL: V = [hip[0] + hw, hip[1]];
  const leg = (top: V, foot: V) => ({ top, knee: ik(top, foot, B.thigh, B.shin, 1), ankle: foot });
  // seated: the thigh lies level on the seat, the shin hangs to the foot
  const seatedLeg = (top: V, foot: V) => {
    if (p.sit < 0.5) return leg(top, foot);
    const knee: V = [top[0] + B.thigh * 0.98, top[1] + 4];
    return { top, knee: [mix(ik(top, foot, B.thigh, B.shin, 1)[0], knee[0], (p.sit - 0.5) * 2), mix(ik(top, foot, B.thigh, B.shin, 1)[1], knee[1], (p.sit - 0.5) * 2)] as V, ankle: foot };
  };
  return { hip, neck, headC, sw, hw, shR, shL, armR: arm(shR, p.R, -1), armL: arm(shL, p.L, 1), legR: seatedLeg(hipR, p.footR), legL: seatedLeg(hipL, p.footL) };
}

/** Blend two poses (angles, targets and all); an arm posed by angles on one side and by a hand target on the other blends through its wrist. */
export function mixPose(a: Pose, b: Pose, t: number): Pose {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const m = (x: number, y: number) => mix(x, y, t);
  const v = (x: V, y: V): V => [m(x[0], y[0]), m(x[1], y[1])];
  const ja = joints(a), jb = joints(b);
  const arm = (x: Arm, y: Arm, wa: V, wb: V): Arm => {
    if (x.hand || y.hand) return { hand: v(x.hand ?? wa, y.hand ?? wb), bend: t < 0.5 ? x.bend : y.bend, wrist: m(x.wrist ?? 0, y.wrist ?? 0) };
    return { sh: m(x.sh ?? 0, y.sh ?? 0), el: m(x.el ?? 0, y.el ?? 0), wrist: m(x.wrist ?? 0, y.wrist ?? 0) };
  };
  return {
    lean: m(a.lean, b.lean), bob: m(a.bob, b.bob), sit: m(a.sit, b.sit), head: m(a.head, b.head), turn: m(a.turn, b.turn), body: m(a.body, b.body),
    R: arm(a.R, b.R, ja.armR.wrist, jb.armR.wrist), L: arm(a.L, b.L, ja.armL.wrist, jb.armL.wrist),
    footR: v(a.footR, b.footR), footL: v(a.footL, b.footL), breath: m(a.breath ?? 0, b.breath ?? 0),
  };
}

/** One step of a walk at phase ph (radians), stride s: feet, hip bob and arm swing. */
export function walkPhase(ph: number, s = 44, moving = 1) {
  const sw = Math.sin(ph) * s * 0.5 * moving;
  const liftR = Math.max(0, Math.sin(ph)) * 12 * moving, liftL = Math.max(0, -Math.sin(ph)) * 12 * moving;
  return {
    footR: [-6 + sw, -liftR] as V, footL: [6 - sw, -liftL] as V, bob: -Math.abs(Math.cos(ph)) * 4 * moving,
    R: { sh: -Math.sin(ph) * 22 * moving, el: 14 }, L: { sh: Math.sin(ph) * 22 * moving, el: 14 },
  };
}
