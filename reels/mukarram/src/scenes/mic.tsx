import React from 'react';
import { Narrator } from '../characters/cast';
import { ExprName } from '../characters/face';
import { PAL } from '../characters/ink';
import { Monkey, MONKEY_POSES, mixMonkey } from '../characters/monkey';
import { Desk, Mic } from '../characters/props';
import { POSES, Pose, PoseName } from '../characters/rig';
import { Shot } from '../video/stage';
import { TITLE_FONT } from '../video/fonts';
import { ease, keys, prog, sec, wordAt } from '../video/time';
import { ShotProps, StudioBack, exprTrack, idle, poseTrack, talkAt, vecTrack } from './common';

const poseOf = (n: PoseName): Pose => POSES[n];

// The narrator at his desk mic. Body, head, hands and face are animated per shot from word-keyed tracks;
// the mouth follows the measured voice; blinks and breathing never stop. The camera moves separately.

type MicCfg = {
  poses: Array<[number, Pose | PoseName]>;
  exprs: Array<[number, ExprName]>;
  looks: Array<[number, [number, number]]>;
  glances?: Array<[number, [number, number]]>;
  zoom: Array<[number, number]>;
  cy?: number;
  glow?: number;
  /** extra up/down bounce (laughing) */
  bounce?: (f: number) => number;
  overlay?: React.ReactNode;
  extra?: React.ReactNode;
};

const MicSet: React.FC<{ f: number; c: MicCfg }> = ({ f, c }) => {
  const id = idle(f, 11);
  const pose = poseTrack(f, c.poses);
  const look = vecTrack(f, c.looks);
  const glance = c.glances ? vecTrack(f, c.glances, sec(0.15)) : ([0, 0] as [number, number]);
  const zoom = keys(f, c.zoom, ease.out);
  return (
    <Shot f={f} cam={{ cx: 540, cy: c.cy ?? 900, zoom }} bounds={[-400, -400, 1500, 2400]} overlay={c.overlay}>
      <StudioBack glow={c.glow} />
      <Narrator frame={f} x={540} y={1420} s={1.32} pose={pose} expr={exprTrack(f, c.exprs)} blink={id.blink} bob={id.bob + (c.bounce?.(f) ?? 0)}
        look={look} glance={glance} talk={talkAt(f)} shadow={false} />
      <Mic x={1010} y={1180} s={1.05} />
      <Desk x={540} y={1180} w={900} />
      {c.extra}
    </Shot>
  );
};

/** «ونضحك.» — laughs with the audience: shoulders bounce, a slap on the desk on the word. */
export const MicLaugh: React.FC<ShotProps> = ({ f }) => {
  const w = wordAt('s02', 'ونضحك');
  return (
    <MicSet f={f} c={{
      poses: [[0, 'stand'], [w - 6, { ...poseOf('stand'), armR: [30, -40], handR: 'fist' }], [w + 2, { ...poseOf('stand'), armR: [26, -10], handR: 'open' }], [w + 12, 'shrug']],
      exprs: [[0, 'satisfied'], [w - 4, 'laugh']],
      looks: [[0, [-0.3, 0]], [w, [0.1, -0.2]]],
      zoom: [[0, 1.0], [w + 20, 1.06]],
      bounce: (x) => (x > w ? Math.abs(Math.sin((x - w) * 0.55)) * 10 * Math.max(0, 1 - (x - w) / 40) : 0),
    }} />
  );
};

/** «طيب… وأنت؟» — squints at the monkey's side, turns to camera, points at the viewer (punch-in on «وأنت»). */
export const MicTurn: React.FC<ShotProps> = ({ f, t0 }) => {
  const a = wordAt('s03', 'طيب'), b = wordAt('s03', 'وأنت');
  return (
    <MicSet f={f} c={{
      poses: [[t0, 'stand'], [a, { ...poseOf('stand'), tilt: 8 }], [b - 5, 'pointCam']],
      exprs: [[t0, 'satisfied'], [a - 3, 'skeptical'], [b - 2, 'curious']],
      looks: [[t0, [-0.85, 0]], [a + 6, [-0.6, 0.1]], [b - 8, [0, 0]]],
      glances: [[t0, [-1, 0]], [b - 8, [0, 0]]],
      zoom: [[t0, 1.0], [b - 2, 1.02], [b + 5, 1.38]],
      cy: 860,
    }} />
  );
};

/** «تلتفت» — deadpan eye-roll at the litterer. */
export const MicEyeRoll: React.FC<ShotProps> = ({ f, t0 }) => (
  <MicSet f={f} c={{
    poses: [[t0, { ...poseOf('stand'), armL: [-10, -110], armR: [-10, -110], handL: 'fist', handR: 'fist', tilt: -4 }]],
    exprs: [[t0, 'skeptical'], [t0 + 8, 'smug']],
    looks: [[t0, [0, 0]]],
    glances: [[t0, [0.6, -0.2]], [t0 + 5, [0, -1]], [t0 + 12, [-0.7, -0.6]]],
    zoom: [[t0, 1.22], [t0 + 20, 1.26]],
    cy: 820,
  }} />
);

/** «أما أنت، فقد كرّمك الله.» — sincere: hand on the chest on «كرّمك», a warm glow behind. */
export const MicSincere: React.FC<ShotProps> = ({ f, t0 }) => {
  const k = wordAt('s09', 'كرّمك'), a = wordAt('s09', 'أما');
  return (
    <MicSet f={f} c={{
      poses: [[t0, 'stand'], [a, { ...poseOf('palmsOut'), armL: [8, 6], handL: 'mitten' }], [k - 6, 'handOnChest']],
      exprs: [[t0, 'neutral'], [a, 'curious'], [k - 4, 'tender']],
      looks: [[t0, [0.2, 0]], [a + 4, [0, 0]]],
      zoom: [[t0, 1.0], [t0 + sec(2.5), 1.12]],
      glow: prog(f, k - 8, sec(0.6)),
    }} />
  );
};

/** «فعلى الأقل، لا تكن أنت الأذى.» — the closing line appears as one card; the monkey pops up with a thumbs-up. */
export const MicClose: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const la = wordAt('s11', 'لا'), adha = wordAt('s11', 'الأذى', 1);
  const card = prog(f, la - 2, sec(0.35), ease.back);
  const monkeyIn = prog(f, adha + sec(0.45), sec(0.4), ease.back);
  return (
    <MicSet f={f} c={{
      poses: [[t0, 'stand'], [la - 4, { ...poseOf('point'), armR: [62, 30], tilt: 0 }], [adha + 2, 'stand'], [adha + sec(0.5), { ...poseOf('stand'), tilt: 6 }]],
      exprs: [[t0, 'neutral'], [la - 3, 'determined'], [adha + 4, 'satisfied']],
      looks: [[t0, [0, 0]], [la, [0, -0.1]], [adha + 6, [0.15, 0]]],
      zoom: [[t0, 1.0], [la, 1.0], [t1, 0.94]],
      cy: 960,
      extra: (
        <g transform={`translate(0 ${(1 - monkeyIn) * 420})`}>
          <Monkey x={180} y={1650} s={0.95} pose={mixMonkey(MONKEY_POSES.sit, MONKEY_POSES.thumbs, monkeyIn)} expr="satisfied" blink={0} />
        </g>
      ),
      overlay: (
        <div style={{ position: 'absolute', left: 90, right: 90, top: 300, display: 'flex', justifyContent: 'center', opacity: Math.min(1, card * 1.4), transform: `scale(${0.8 + 0.2 * card}) rotate(${(1 - card) * -3}deg)` }}>
          <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 104, lineHeight: 1.25, color: PAL.ink, background: PAL.white, padding: '0.1em 0.55em 0.22em', borderRadius: 36, border: `7px solid ${PAL.ink}`, boxShadow: `0 10px 0 ${PAL.ink}`, textAlign: 'center', whiteSpace: 'nowrap' }}>
            لا تكن أنت <span style={{ color: PAL.red }}>الأذى</span>
          </div>
        </div>
      ),
    }} />
  );
};

