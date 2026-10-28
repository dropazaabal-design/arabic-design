import React from 'react';
import { Narrator } from '@mukarram/characters/cast';
import { ExprName } from '@mukarram/characters/face';
import { PAL } from '@mukarram/characters/ink';
import { Desk, Mic } from '@mukarram/characters/props';
import { POSES, Pose, PoseName } from '@mukarram/characters/rig';
import { Shot } from '@mukarram/video/stage';
import { Frog } from '../characters/frog';
import { TITLE_FONT } from '../video/fonts';
import { ease, keys, prog, sec, wordAt } from '../video/time';
import { ShotProps, StudioDark, exprTrack, idle, poseTrack, talkAt, vecTrack } from './common';

// The narrator from reels/mukarram (same rig, glasses, hoodie, mouth on the voice) on this reel's dark set.

const P = (n: PoseName): Pose => POSES[n];
type Cfg = {
  poses: Array<[number, Pose | PoseName]>;
  exprs: Array<[number, ExprName]>;
  looks: Array<[number, [number, number]]>;
  glances?: Array<[number, [number, number]]>;
  zoom: Array<[number, number]>;
  cy?: number;
  silent?: boolean;
  extra?: React.ReactNode;
  overlay?: React.ReactNode;
};

const Set: React.FC<{ f: number; c: Cfg }> = ({ f, c }) => {
  const id = idle(f, 11);
  return (
    <Shot f={f} cam={{ cx: 540, cy: c.cy ?? 860, zoom: keys(f, c.zoom, ease.out) }} bounds={[-400, -400, 1500, 2400]} overlay={c.overlay}>
      <StudioDark />
      <Narrator frame={f} x={540} y={1420} s={1.32} pose={poseTrack(f, c.poses)} expr={exprTrack(f, c.exprs)} blink={id.blink} bob={id.bob}
        look={vecTrack(f, c.looks)} glance={c.glances ? vecTrack(f, c.glances, sec(0.15)) : [0, 0]} talk={c.silent ? 0 : talkAt(f)} shadow={false} />
      <Mic x={1010} y={1180} s={1.05} />
      <Desk x={540} y={1180} w={900} />
      {c.extra}
    </Shot>
  );
};

const Pill: React.FC<{ text: string; p: number; top?: number }> = ({ text, p, top = 300 }) => (
  <div style={{ position: 'absolute', left: 80, right: 80, top, display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 1.5), transform: `scale(${0.8 + 0.2 * p}) rotate(${(1 - p) * 3}deg)` }}>
    <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 84, lineHeight: 1.3, color: PAL.ink, background: PAL.white, padding: '0.08em 0.6em 0.2em', borderRadius: 999, border: `7px solid ${PAL.ink}`, boxShadow: `0 9px 0 ${PAL.red}`, whiteSpace: 'nowrap' }}>{text}</div>
  </div>
);

/** «يعني القصة مو صحيحة… هي مجرد تشبيه.» — caught out, he scratches his head; the frog (towel on)
 *  hops onto the desk and nods; on «تشبيه» the pill «القصة مجرد تشبيه». */
export const StudioMyth: React.FC<ShotProps> = ({ f, t0 }) => {
  const wrong = wordAt('s03', 'مو'), simile = wordAt('s03', 'تشبيه');
  const hop = prog(f, wrong - 8, 12, ease.linear);
  const fx = 900 - 140 * hop, fy = 1150 - Math.sin(hop * Math.PI) * 220;
  const nod = f > wrong + 6 ? Math.sin((f - wrong) * 0.5) * 6 * Math.max(0, 1 - (f - wrong - 6) / 30) : 0;
  return (
    <Set f={f} c={{
      poses: [[t0, 'stand'], [wrong - 4, 'scratch'], [simile - 6, { ...P('palmsOut'), armL: [8, 6], handL: 'mitten' }]],
      exprs: [[t0, 'neutral'], [wrong - 3, 'embarrassed'], [simile - 4, 'satisfied']],
      looks: [[t0, [0, 0]], [wrong, [0.5, 0.1]], [simile - 4, [0, 0]]],
      glances: [[t0, [0, 0]], [wrong, [1, 0.3]], [simile - 4, [0, 0]]],
      zoom: [[t0, 1.25], [simile, 1.32]],
      extra: hop > 0 ? <Frog x={fx} y={fy + 20} s={0.7} towel eyes={hop < 1 ? 'wide' : 'half'} mouth={hop < 1 ? 'o' : 'smirk'} brow={hop < 1 ? 0 : -1}
        pose={{ crouch: hop >= 1 ? Math.max(0, 0.6 - (f - wrong - 4) / 10) : 0, stretch: hop > 0 && hop < 1 ? 0.6 : 0, tilt: nod, armL: 20, armR: 20 }} glance={[-0.6, 0]} /> : null,
      overlay: <Pill text="القصة مجرد تشبيه" p={prog(f, simile - 2, 9, ease.back)} />,
    }} />
  );
};

/** «بس التشبيه يصدق علينا أحيانًا.» — he points at himself and at us on «علينا»; the frog looks at us too. */
export const StudioUs: React.FC<ShotProps> = ({ f, t0 }) => {
  const us = wordAt('s04', 'علينا');
  return (
    <Set f={f} c={{
      poses: [[t0, P('palmsOut')], [us - 6, 'pointCam']],
      exprs: [[t0, 'satisfied'], [us - 4, 'curious']],
      looks: [[t0, [0, 0]]],
      zoom: [[t0, 1.3], [us, 1.3], [us + 6, 1.45]],
      cy: 840,
      extra: <Frog x={760} y={1170} s={0.7} towel eyes="half" mouth="smirk" brow={-1} glance={[0, 0.2]} pose={{ armL: 20, armR: f > us ? 90 : 20 }} blink={idle(f, 7).blink} />,
    }} />
  );
};

/** Silent beat after «ثم شوي»: deadpan, he points sideways at the hour that went; on «اسأل نفسك» he
 *  taps his own temple. */
export const StudioPoint: React.FC<ShotProps> = ({ f, t0 }) => {
  const ask = wordAt('s08', 'اسأل');
  return (
    <Set f={f} c={{
      poses: [[t0, 'stand'], [t0 + 8, { ...P('point'), armR: [84, 2] }], [ask - 4, { ...P('stand'), armR: [150, 95], handR: 'point', tilt: 6 }]],
      exprs: [[t0, 'neutral'], [t0 + 6, 'skeptical'], [ask - 2, 'curious']],
      looks: [[t0, [0, 0]], [t0 + 8, [0.7, 0]], [ask - 6, [0, 0]]],
      glances: [[t0, [0, 0]], [t0 + 10, [1, 0]], [ask - 6, [0, 0]]],
      zoom: [[t0, 1.35], [ask, 1.42]],
      silent: f < ask - 2,
    }} />
  );
};
