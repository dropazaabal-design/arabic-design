import React from 'react';
import { PAL, rand, stroke } from '@mukarram/characters/ink';
import { Puff, SpeedLines } from '@mukarram/characters/props';
import { Shot } from '@mukarram/video/stage';
import { Frog, FrogPose } from '../characters/frog';
import { Fly, LilyPad, Reeds, Ripple, Rock, Thermometer } from '../characters/props';
import { ease, keys, prog, sec, wordAt } from '../video/time';
import { ShotProps, idle } from './common';

// The pond at dusk. The frog floats on a swim ring next to a red thermometer that creeps up. It notices,
// gathers itself, and leaps out onto a dry rock — safe, a little proud. Nothing is ever shown heating it.

const FX = 520, FY = 1395;            // frog on the ring
const ROCK: [number, number] = [865, 1238];
const BOUNDS: [number, number, number, number] = [-420, -400, 1500, 2340];

const PondWorld: React.FC<{ f: number; children?: React.ReactNode; level: number }> = ({ f, children, level }) => (
  <g>
    <rect x={-420} y={-400} width={1920} height={2800} fill="#1D3A5C" />
    {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={-300 + rand(i) * 1700} cy={-200 + rand(i + 50) * 1100} r={2 + rand(i + 9) * 3} fill={PAL.white} opacity={0.35 + 0.35 * Math.sin(f / 12 + i)} />)}
    <circle cx={820} cy={430} r={90} fill="#F3EBD2" opacity={0.9} />
    <path d="M-420 1080 Q 100 940 520 1060 Q 900 960 1500 1080 L1500 1300 L-420 1300Z" fill="#24496E" />
    <path d="M-420 1180 Q 540 1140 1500 1180 L1500 2340 L-420 2340Z" fill="#2E6D9E" {...stroke()} />
    {[0, 1, 2].map((i) => <Ripple key={i} x={FX + (i - 1) * 60} y={FY + 10} t={((f / 40) + i / 3) % 1} r={170} />)}
    <LilyPad x={180} y={1560} s={0.9} rot={-8} />
    <LilyPad x={720} y={1690} s={0.7} rot={14} />
    <Rock x={ROCK[0]} y={ROCK[1] + 90} s={0.9} />
    <path d="M-420 1760 Q 300 1700 1500 1780 L1500 2340 L-420 2340Z" fill="#2F5F45" {...stroke()} />
    <Reeds x={60} y={1780} f={f} s={1.1} />
    <Reeds x={1000} y={1800} f={f + 20} s={0.9} />
    <Thermometer x={250} y={1330} s={1.08} level={level} />
    {children}
  </g>
);

/** Float on the ring: a slow bob on the water. */
const bob = (f: number) => Math.sin(f / 14) * 6;

/** Hook (frame 0): a fly buzzes past; the tongue snaps it; the frog chews, happy, and lounges while the
 *  thermometer creeps up «بالتدريج». */
export const PondHook: React.FC<ShotProps> = ({ f, t1 }) => {
  const snap = prog(f, 2, 4, ease.out) * (1 - prog(f, 7, 4, ease.in));
  const fly: [number, number] = [760 - f * 14, 1080 + Math.sin(f * 0.9) * 18];
  const caught = f >= 7;
  const lounge = prog(f, sec(1.4), sec(0.5));
  const id = idle(f, 7);
  const ang = Math.atan2(fly[1] - (FY - 80), fly[0] - FX) * 57.3;
  const level = keys(f, [[0, 0.28], [wordAt('s01', 'بالتدريج'), 0.42], [t1, 0.5]], ease.linear);
  const pose: Partial<FrogPose> = { armL: 150 * lounge, armR: 150 * lounge, lean: -6 * lounge, tilt: Math.sin(f / 20) * 3 };
  return (
    <Shot f={f} cam={{ cx: 540, cy: keys(f, [[0, 1290], [t1, 1270]]), zoom: keys(f, [[0, 1.6], [t1, 1.75]]) }} bounds={BOUNDS}>
      <PondWorld f={f} level={level}>
        <Frog x={FX} y={FY + bob(f)} s={1} ring pose={pose} eyes={caught ? (f < 40 ? 'happy' : 'half') : 'open'} mouth={caught ? 'smile' : 'o'}
          tongue={snap} tongueAng={ang} glance={caught ? [0, 0] : [0.8, -0.4]} blink={caught ? 0 : id.blink} throat={caught && f < 30 ? Math.abs(Math.sin(f * 0.5)) * 0.6 : 0} />
        {!caught && <Fly x={fly[0]} y={fly[1]} f={f} />}
      </PondWorld>
    </Shot>
  );
};

/** «لكن تدري؟» — it notices: eyes snap to the thermometer, go wide; the throat puffs; the red jumps a notch. */
export const PondNotice: React.FC<ShotProps> = ({ f, t0 }) => {
  const see = wordAt('s02', 'تدري') - 3;
  const level = keys(f, [[t0, 0.5], [see, 0.52], [see + 6, 0.66]], ease.out);
  return (
    <Shot f={f} cam={{ cx: 440, cy: 1200, zoom: keys(f, [[t0, 1.75], [see + 4, 1.95]], ease.out) }} bounds={BOUNDS}>
      <PondWorld f={f} level={level}>
        <Frog x={FX} y={FY + bob(f)} s={1} ring eyes={f < see ? 'half' : 'wide'} mouth={f < see ? 'smile' : 'o'} brow={f < see ? 0 : 1}
          glance={f < see ? [0, 0] : [-1, -0.6]} throat={f >= see ? 0.4 + Math.abs(Math.sin((f - see) * 0.6)) * 0.4 : 0}
          pose={{ armL: f < see ? 150 : 40, armR: f < see ? 150 : 40, tilt: f < see ? 3 : -8 }} />
      </PondWorld>
    </Shot>
  );
};

/** «الضفدع نفسه يحاول يهرب!» — anticipation (a deep crouch, determined), the leap on «يهرب» (stretch,
 *  arms out), a squash on the dry rock, overshoot, settle; then a relieved wave. */
export const PondLeap: React.FC<ShotProps> = ({ f, t0 }) => {
  const go = wordAt('s02', 'يهرب') - 2;
  const air = 13;
  const t = prog(f, go, air, ease.linear);
  const landed = f >= go + air;
  const crouch = f < go ? prog(f, t0 + 4, go - t0 - 4, ease.inOut) : landed ? keys(f, [[go + air, 0.9], [go + air + 5, -0.15], [go + air + 10, 0.1], [go + air + 14, 0]], ease.out) : 0;
  const stretch = f >= go && !landed ? Math.sin(t * Math.PI) * 0.9 + 0.1 : 0;
  const x = landed ? ROCK[0] : f < go ? FX : FX + (ROCK[0] - FX) * t;
  const y = landed ? ROCK[1] : f < go ? FY + bob(f) : FY + (ROCK[1] - FY) * t - Math.sin(Math.PI * t) * 420;
  const wave = landed && f > go + air + 16 ? 120 + Math.sin((f - go) * 0.5) * 30 : landed ? 10 : f >= go ? 160 : 30;
  const id = idle(f, 7);
  return (
    <Shot f={f} cam={{ cx: keys(f, [[t0, 560], [go, 600], [go + air, 680]]), cy: keys(f, [[t0, 1220], [go + air, 1180]]), zoom: keys(f, [[t0, 1.1], [go, 1.02]], ease.out), shake: landed && f < go + air + 5 ? 5 : 0 }} bounds={BOUNDS}>
      <PondWorld f={f} level={0.66}>
        {/* the empty ring keeps floating where the frog was */}
        {f >= go && <g transform={`translate(${FX} ${FY + bob(f) - 40})`}><path d="M-150 0 A150 40 0 1 0 150 0 A150 40 0 1 0 -150 0" fill={PAL.red} {...stroke()} /><path d="M-104 -6 A104 22 0 1 0 104 -6 A104 22 0 1 0 -104 -6" fill="#2E6D9E" {...stroke(5)} /></g>}
        {f >= go && !landed && <SpeedLines x={x - 60} y={y - 120} ang={-40} len={110} />}
        <Frog x={x} y={y} s={1} ring={f < go} rot={f >= go && !landed ? (t - 0.5) * 30 : 0}
          pose={{ crouch, stretch, armL: f >= go && !landed ? 150 : landed ? 20 : 30, armR: wave, lean: f < go ? 8 * crouch : 0 }}
          eyes={f < go ? 'open' : landed && f > go + air + 12 ? 'happy' : 'wide'} brow={f < go ? -1 : 0}
          mouth={f < go ? 'flat' : landed ? 'grin' : 'o'} blink={landed ? id.blink : 0} glance={f < go ? [0.6, -0.2] : [0, 0]} />
        <Puff x={ROCK[0]} y={ROCK[1]} t={(f - go - air) / 14} s={1.2} />
        {Array.from({ length: 6 }, (_, i) => {
          const d = (f - go) / 18;
          if (d < 0 || d > 1) return null;
          const a = -Math.PI / 2 + (i - 2.5) * 0.45;
          return <circle key={i} cx={FX + Math.cos(a) * 140 * d} cy={FY - 30 + Math.sin(a) * 160 * d + d * d * 120} r={10 * (1 - d)} fill={PAL.blueSoft} {...stroke(3)} />;
        })}
      </PondWorld>
    </Shot>
  );
};
