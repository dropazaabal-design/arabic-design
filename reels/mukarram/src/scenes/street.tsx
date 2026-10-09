import React from 'react';
import { Passerby, Spitter } from '../characters/cast';
import { PAL, bowLine, rand, stroke, wobRect } from '../characters/ink';
import { Droplet, Flag, Puff, Sparkles } from '../characters/props';
import { POSES, Pose, walkPose } from '../characters/rig';
import { Shot } from '../video/stage';
import { ease, keys, prog, sec, wordAt } from '../video/time';
import { ShotProps, exprTrack, idle, poseTrack, vecTrack } from './common';
import { arc } from './helpers';

// The pavement: a brick wall, a lamp post, the kerb. «غيرك» throws nothing — he spits, a passer-by has
// to hop over the spot, and he plants a little flag on it as if he owned the pavement.

const GROUND = 1490;
const SX = 640, SS = 1.22;      // the spitter
const SPOT: [number, number] = [360, GROUND - 6];
const BOUNDS: [number, number, number, number] = [-420, -400, 1500, 2340];

const Street: React.FC<{ f: number; children?: React.ReactNode }> = ({ children }) => (
  <g>
    <rect x={-420} y={-400} width={1920} height={1900} fill="#EFE6D8" />
    {Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => {
      const x = -400 + c * 230 + (r % 2) * 115, y = 360 + r * 110;
      return rand(r * 31 + c) > 0.55 ? <path key={`${r}-${c}`} d={wobRect(x, y, 200, 86, 8, r * 9 + c, 2)} fill="#E3D3BC" {...stroke(4)} opacity={0.75} /> : null;
    }))}
    <path d="M940 1470 L940 420" {...stroke(16, PAL.navy)} />
    <path d="M940 430 Q 940 360 860 360 L820 360" fill="none" {...stroke(14, PAL.navy)} />
    <path d={wobRect(770, 350, 90, 46, 14, 301, 2)} fill={PAL.glow} {...stroke()} />
    <rect x={-420} y={1440} width={1920} height={260} fill={PAL.stone} />
    <path d={bowLine(-420, 1440, 1500, 1440, 3)} {...stroke()} />
    {[-200, 120, 440, 760, 1080].map((x) => <path key={x} d={`M${x} 1446 L${x - 30} 1696`} {...stroke(4)} opacity={0.4} />)}
    <rect x={-420} y={1700} width={1920} height={700} fill="#5D6676" />
    <path d={bowLine(-420, 1700, 1500, 1700, -3)} {...stroke(10)} />
    {[-300, 100, 500, 900].map((x) => <path key={x} d={`M${x} 1880 L${x + 160} 1880`} {...stroke(14, PAL.white)} opacity={0.8} />)}
    {children}
  </g>
);

/** «وغيرك لا يرمي شيئًا…» — empty palms to the camera, innocent smile. */
export const SpitInnocent: React.FC<ShotProps> = ({ f, t0 }) => {
  const nothing = wordAt('s08', 'يرمي');
  const id = idle(f, 41);
  const pose = poseTrack(f, [[t0, { ...POSES.stand, armL: [10, -40], armR: [10, -40], handL: 'fist', handR: 'fist' }], [nothing - 4, POSES.palmsOut]], sec(0.25));
  return (
    <Shot f={f} cam={{ cx: 600, cy: 1100, zoom: keys(f, [[t0, 1.2], [nothing, 1.28]]) }} bounds={BOUNDS}>
      <Street f={f}>
        <Spitter x={SX} y={GROUND} s={SS} facing={-1} pose={pose} blink={id.blink} bob={id.bob} expr={exprTrack(f, [[t0, 'neutral'], [nothing - 2, 'satisfied']])} look={[-0.2, 0]} />
        <Sparkles x={SX} y={GROUND - SS * 560} t={((f - nothing) % 24) / 24} r={130} n={4} color={PAL.blue} seed={44} />
      </Street>
    </Shot>
  );
};

/** «فقط يبصق على الرصيف،» — turns, spits (one small drop); a passer-by has to hop over it. */
export const SpitAct: React.FC<ShotProps> = ({ f, t0 }) => {
  const spit = wordAt('s08', 'يبصق') + 2, after = wordAt('s08', 'الرصيف');
  const id = idle(f, 41);
  const pose = poseTrack(f, [[t0, POSES.stand], [spit - 8, { ...POSES.stand, lean: 8, tilt: -8, armL: [20, -30], armR: [20, -30] }], [spit + 4, { ...POSES.stand, lean: -2 }]], sec(0.2));
  const drop = prog(f, spit, 9, ease.in);
  const mouth: [number, number] = [SX - 120 * SS, GROUND - 455 * SS];
  const [dx, dy] = arc(mouth, SPOT, drop, 60);
  // the passer-by walks right, hops over the spot on «الرصيف»
  const px = -120 + (f - t0) * 13;
  const hop = Math.max(0, Math.sin(Math.min(1, Math.max(0, (f - after + 4) / 12)) * Math.PI)) * 90;
  return (
    <Shot f={f} cam={{ cx: 560, cy: 1120, zoom: 1.18 }} bounds={BOUNDS}>
      <Street f={f}>
        {drop >= 1 && <Droplet x={SPOT[0]} y={SPOT[1]} s={1.2} rot={90} />}
        <Passerby x={px} y={GROUND - hop} s={1.02} facing={1} pose={hop > 4 ? ({ ...walkPose(0.25, 1.4), armL: [120, 30], armR: [120, 30] } as Pose) : walkPose((f - t0) / 22, 1)}
          blink={0} expr={hop > 4 ? 'surprised' : 'neutral'} look={[0.2, hop > 4 ? 0.6 : 0]} />
        <Spitter x={SX} y={GROUND} s={SS} facing={-1} pose={pose} blink={id.blink} expr={exprTrack(f, [[t0, 'neutral'], [spit - 8, 'puckered'], [spit + 6, 'smug']])}
          look={vecTrack(f, [[t0, [0, 0]], [spit - 10, [0.8, 0.3]], [spit + 10, [0.3, 0]]])} />
        {drop > 0 && drop < 1 && <Droplet x={dx} y={dy} s={1} />}
        <Puff x={SPOT[0]} y={GROUND} t={(f - spit - 9) / 10} s={0.5} />
      </Street>
    </Shot>
  );
};

/** «كأنه يملكه.» — plants a small red flag on the spot, hands on hips, chin up. */
export const SpitFlag: React.FC<ShotProps> = ({ f, t0 }) => {
  const own = wordAt('s08', 'كأنه');
  const id = idle(f, 41);
  const pose = poseTrack(f, [[t0, { ...POSES.stand, armR: [140, 20], handR: 'fist' }], [own, { ...POSES.stand, lean: 20, armR: [60, -10], handR: 'fist' }], [own + 10, POSES.hipsHands], [own + 14, { ...POSES.hipsHands, tilt: -10 }]], sec(0.22));
  const plant = prog(f, own + 2, 6, ease.in);
  return (
    <Shot f={f} cam={{ cx: 520, cy: 1120, zoom: keys(f, [[t0, 1.2], [own + 10, 1.34]]) }} bounds={BOUNDS}>
      <Street f={f}>
        <Droplet x={SPOT[0] + 30} y={SPOT[1]} s={1.2} rot={90} />
        {f >= own - 4 && <Flag x={SPOT[0]} y={GROUND} s={1.2} wave={f * 0.35} plant={plant} />}
        <Spitter x={SX - 60} y={GROUND} s={SS} facing={-1} pose={pose} blink={id.blink} expr={exprTrack(f, [[t0, 'determined'], [own + 10, 'smug']])} look={[0.1, -0.3]} />
        <Puff x={SPOT[0]} y={GROUND} t={(f - own - 8) / 12} s={0.7} />
      </Street>
    </Shot>
  );
};
