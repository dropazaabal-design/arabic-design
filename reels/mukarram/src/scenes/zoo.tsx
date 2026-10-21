import React from 'react';
import { PAL, bowLine, stroke } from '../characters/ink';
import { MONKEY_POSES, Monkey, MonkeyPose, mixMonkey } from '../characters/monkey';
import { Banana, Bin, Cloud, Log, Peel, PictoSign, Puff, Sign, SnackBag, Sparkles, SpeedLines, Tree } from '../characters/props';
import { Shot } from '../video/stage';
import { ease, keys, prog, sec, wordAt } from '../video/time';
import { ShotProps, exprTrack, idle, vecTrack } from './common';
import { arc } from './helpers';

// The zoo: the gate sign, the monkey on its log inside, a bin and a pile of old peels. The monkey is
// the comparison the whole reel turns on, so it is animated in every shot (eat, toss, hat, read, bin).

const MX = 560, MY = 1350, MS = 1.2;          // the monkey on its log
const BIN: [number, number] = [860, 1440];   // the enclosure bin
const PILE: [number, number] = [300, 1470];  // old peels
const BOUNDS: [number, number, number, number] = [-420, -420, 1500, 2340];

/** Track of monkey poses (eased changes). */
const mTrack = (f: number, k: Array<[number, MonkeyPose]>, dur = sec(0.25)) => {
  let cur = k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (f < k[i][0]) break;
    cur = mixMonkey(cur, k[i][1], prog(f, k[i][0], dur, ease.inOut));
  }
  return cur;
};

const ZooWorld: React.FC<{ f: number; children?: React.ReactNode; pile?: number; binAt?: boolean }> = ({ f, children, pile = 2, binAt = true }) => (
  <g>
    <rect x={-420} y={-420} width={1920} height={1600} fill="#DCEAF4" />
    <Cloud x={200 + (f % 900) * 0.04} y={260} s={0.9} />
    <Cloud x={860 - (f % 900) * 0.03} y={180} s={0.7} />
    <path d="M-420 1120 Q 0 900 420 1080 Q 760 960 1500 1100 L1500 1300 L-420 1300Z" fill="#B9D3A8" {...stroke()} />
    <rect x={-420} y={1180} width={1920} height={1200} fill="#EAD9BF" />
    <path d={bowLine(-420, 1180, 1500, 1180, 4)} {...stroke()} />
    {/* back fence of the enclosure */}
    {Array.from({ length: 16 }, (_, i) => <path key={i} d={bowLine(-380 + i * 120, 760, -380 + i * 120 + 4, 1190, (i % 3) - 1)} {...stroke(10, PAL.navy)} />)}
    <path d={bowLine(-420, 790, 1500, 790, 4)} {...stroke(12, PAL.navy)} />
    {/* gate posts and the sign */}
    <path d="M150 1190 L150 250 L220 250 L220 1190Z" fill={PAL.wood} {...stroke()} />
    <path d="M860 1190 L860 250 L930 250 L930 1190Z" fill={PAL.wood} {...stroke()} />
    <Sign x={540} y={420} lines={['حديقة الحيوان']} w={720} h={170} post={0} size={84} />
    <Tree x={1010} y={1210} s={0.9} sway={Math.sin(f / 20)} />
    <Log x={MX} y={MY + 34} s={1.1} />
    {Array.from({ length: pile }, (_, i) => <Peel key={i} x={PILE[0] + [0, 56, -48, 28][i]} y={PILE[1] - [0, 10, 6, 26][i]} rot={[10, -30, 50, 80][i]} s={0.9} />)}
    {binAt && <Bin x={BIN[0]} y={BIN[1]} s={0.75} />}
    {children}
    {/* visitors' railing in the foreground */}
    <path d={bowLine(-420, 1660, 1500, 1660, 3)} {...stroke(14, PAL.woodDeep)} />
    <path d={bowLine(-420, 1740, 1500, 1740, -3)} {...stroke(14, PAL.woodDeep)} />
    {[-300, 0, 300, 600, 900, 1200].map((x) => <path key={x} d={`M${x} 1640 L${x} 2340`} {...stroke(16, PAL.woodDeep)} />)}
    <rect x={-420} y={1780} width={1920} height={600} fill={PAL.paperDeep} />
  </g>
);

/** Hook (frame 0): a peel is already flying at the lens; it slaps down, the camera pulls back to the zoo. */
export const ZooHook: React.FC<ShotProps> = ({ f }) => {
  const land = 12;
  const t = Math.min(1, f / land);
  const [px, py] = arc([1180, 640], [380, 1490], t, 260);
  const id = idle(f, 71);
  const pose = mTrack(f, [[0, MONKEY_POSES.tossBack], [10, MONKEY_POSES.sit], [30, MONKEY_POSES.eat]]);
  const zoom = keys(f, [[0, 1.7], [10, 1.55], [44, 1.0]], ease.out);
  const cx = keys(f, [[0, 520], [10, 470], [44, 540]]), cy = keys(f, [[0, 1240], [10, 1300], [44, 1000]]);
  return (
    <Shot f={f} cam={{ cx, cy, zoom, shake: f >= land && f < land + 6 ? 6 : 0 }} bounds={BOUNDS}>
      <ZooWorld f={f}>
        <Monkey x={MX} y={MY} s={MS} pose={pose} expr={f < 30 ? 'smug' : 'satisfied'} blink={id.blink} look={[0.2, 0]} itemR={f >= 30 ? <Banana x={0} y={-6} s={0.75} /> : undefined} />
        {f < land ? (
          <g>
            <SpeedLines x={px} y={py} ang={Math.atan2(1490 - 640, 380 - 1180) * 57.3} len={120} />
            <Peel x={px} y={py} s={1.5 - 0.5 * t} rot={-540 * t} splay={0.6} />
          </g>
        ) : (
          <g>
            <Peel x={380} y={1490} s={1} rot={8} splay={1} />
            <Puff x={380} y={1500} t={(f - land) / 14} s={1.3} />
          </g>
        )}
      </ZooWorld>
    </Shot>
  );
};

/** «يأكل القرد موزته…» — peels, bites on «موزته», chews with happy eyes. */
export const ZooEat: React.FC<ShotProps> = ({ f, t0 }) => {
  const bite = wordAt('s01', 'موزته');
  const id = idle(f, 71);
  const pose = mTrack(f, [[t0, MONKEY_POSES.peel], [t0 + 8, MONKEY_POSES.eat]], sec(0.3));
  const chew = f > bite ? Math.abs(Math.sin((f - bite) * 0.6)) : 0;
  return (
    <Shot f={f} cam={{ cx: 560, cy: 1170, zoom: keys(f, [[t0, 1.6], [t0 + sec(1.6), 1.72]]) }} bounds={BOUNDS}>
      <ZooWorld f={f}>
        <Monkey x={MX} y={MY} s={MS} pose={pose} expr={exprTrack(f, [[t0, 'curious'], [t0 + 8, 'satisfied'], [bite, 'chewing']])} blink={id.blink} talk={chew}
          itemR={<Banana x={0} y={-8} s={0.75} bitten={f > bite ? 1 : 0} />} />
      </ZooWorld>
    </Shot>
  );
};

/** «ثم يرمي القشرة خلف ظهره.» — tosses the peel over his shoulder without looking; it lands on the pile. */
export const ZooToss: React.FC<ShotProps> = ({ f, t0 }) => {
  const throwAt = wordAt('s01', 'يرمي'), release = throwAt + 5, back = wordAt('s01', 'ظهره');
  const id = idle(f, 71);
  const pose = mTrack(f, [[t0, MONKEY_POSES.sit], [throwAt - 3, MONKEY_POSES.tossBack], [release + 6, MONKEY_POSES.sit], [back - 2, MONKEY_POSES.patBelly]], sec(0.18));
  const flight = Math.max(0, Math.min(1, (f - release) / 16));
  const [px, py] = arc([MX + 60, 840], [PILE[0] + 20, PILE[1] - 14], flight, 380);
  return (
    <Shot f={f} cam={{ cx: 520, cy: 1160, zoom: keys(f, [[t0, 1.3], [throwAt, 1.3], [throwAt + 6, 1.38]], ease.out) }} bounds={BOUNDS}>
      <ZooWorld f={f}>
        <Monkey x={MX} y={MY} s={MS} pose={pose} expr={exprTrack(f, [[t0, 'chewing'], [throwAt, 'smug'], [back - 2, 'satisfied']])} blink={id.blink}
          talk={f < throwAt ? Math.abs(Math.sin(f * 0.6)) : 0} itemR={f < release ? <Peel x={0} y={-10} s={0.7} splay={0.7} /> : undefined} />
        {f >= release && flight < 1 && <Peel x={px} y={py} s={0.9} rot={-720 * flight} splay={0.8} />}
        {flight >= 1 && <Peel x={PILE[0] + 20} y={PILE[1] - 14} s={0.9} rot={30} />}
        <Puff x={PILE[0] + 20} y={PILE[1]} t={(f - release - 16) / 14} />
      </ZooWorld>
    </Shot>
  );
};

/** «فهو قرد… لا يعرف السلة،» — scratches his head, then wears the bin as a hat, proud. */
export const ZooBinHat: React.FC<ShotProps> = ({ f, t0 }) => {
  const scratch = wordAt('s02', 'قرد'), lift = wordAt('s02', 'السلة') - 6;
  const id = idle(f, 71);
  const pose = mTrack(f, [[t0, MONKEY_POSES.sit], [scratch - 4, MONKEY_POSES.scratch], [lift - 4, MONKEY_POSES.sit], [lift, MONKEY_POSES.hatOn], [lift + 16, { ...MONKEY_POSES.sit, armL: [30, 10], armR: [30, 10] }]], sec(0.2));
  const p = prog(f, lift, 12, ease.inOut);
  const head: [number, number] = [MX, MY - MS * (262 + 18) - MS * 140];
  const [bx, by] = arc([BIN[0], BIN[1] - 10], head, p, 200);
  const worn = f >= lift + 12;
  return (
    <Shot f={f} cam={{ cx: 640, cy: 1120, zoom: 1.32 }} bounds={BOUNDS}>
      <ZooWorld f={f} binAt={false}>
        <Monkey x={MX} y={MY} s={MS} pose={pose} expr={exprTrack(f, [[t0, 'neutral'], [scratch - 2, 'curious'], [lift + 10, 'satisfied']])} blink={id.blink}
          glance={vecTrack(f, [[t0, [0, 0]], [scratch, [0.4, -0.6]], [lift - 6, [0.8, 0.4]], [lift + 10, [0, 0]]])}
          hat={worn ? <Bin x={0} y={-142} s={0.44} rot={180} /> : undefined} />
        {!worn && <Bin x={bx} y={by} s={0.75 - 0.22 * p} rot={180 * p} />}
        <Sparkles x={head[0]} y={head[1] - 30} t={(f - lift - 12) / 16} r={120} color={PAL.blue} seed={4} />
      </ZooWorld>
    </Shot>
  );
};

/** «ولا يقرأ اللافتات.» — holds a pictogram sign upside down and tilts his head to "read" it. */
export const ZooSign: React.FC<ShotProps> = ({ f, t0 }) => {
  const read = wordAt('s02', 'يقرأ'), signs = wordAt('s02', 'اللافتات');
  const id = idle(f, 71);
  const tilt = keys(f, [[t0, 0], [read, 18], [signs + 4, 46]], ease.out);
  const pose = { ...MONKEY_POSES.holdSign, tilt };
  return (
    <Shot f={f} cam={{ cx: 560, cy: 1120, zoom: keys(f, [[t0, 1.4], [signs, 1.48]]) }} bounds={BOUNDS}>
      <ZooWorld f={f} binAt={false}>
        <Monkey x={MX} y={MY} s={MS} pose={pose} expr={exprTrack(f, [[t0, 'curious'], [signs + 4, 'surprised']])} blink={id.blink} glance={[0, 0.8]} />
        <PictoSign x={MX + 4} y={MY - 70} s={0.8} upside rot={keys(f, [[t0, -6], [signs, 4]])} />
      </ZooWorld>
    </Shot>
  );
};

/** «القرد له عذر…» — the monkey drops a stray bag into the bin, dusts his hands, gives the camera a look. */
export const ZooReverse: React.FC<ShotProps> = ({ f, t0 }) => {
  const drop = wordAt('s09', 'القرد'), dust = wordAt('s09', 'له'), look = wordAt('s09', 'عذر');
  const id = idle(f, 71);
  const pose = mTrack(f, [[t0, { ...MONKEY_POSES.drop, armR: [40, 20] }], [drop - 4, MONKEY_POSES.drop], [dust - 2, MONKEY_POSES.dust], [look, MONKEY_POSES.sit]], sec(0.18));
  const fall = prog(f, drop + 2, 8, ease.in);
  const lid = keys(f, [[drop - 2, 0], [drop + 1, 1], [drop + 12, 1], [drop + 16, 0]], ease.out);
  return (
    <Shot f={f} cam={{ cx: 700, cy: 1150, zoom: keys(f, [[t0, 1.35], [look, 1.35], [look + 5, 1.55]], ease.out) }} bounds={BOUNDS}>
      <ZooWorld f={f} binAt={false} pile={0}>
        <Bin x={BIN[0] - 60} y={BIN[1]} s={0.75} lid={lid} />
        <Monkey x={MX} y={MY} s={MS} pose={pose} expr={exprTrack(f, [[t0, 'neutral'], [drop, 'satisfied'], [look - 2, 'skeptical']])} blink={f > look ? 0 : id.blink}
          look={vecTrack(f, [[t0, [0.5, 0.3]], [look - 4, [0, 0]]])} glance={vecTrack(f, [[t0, [0.6, 0.6]], [look - 4, [0, 0]]])}
          itemR={f < drop + 2 ? <SnackBag x={0} y={10} s={0.55} empty crumple={0.6} /> : undefined} />
        {f >= drop + 2 && fall < 1 && <SnackBag x={BIN[0] - 60} y={BIN[1] - 150 + fall * 60} s={0.5} empty crumple={0.6} o={1 - fall} />}
        <Puff x={MX + 70} y={MY - 170} t={(f - dust) / 12} s={0.7} />
      </ZooWorld>
    </Shot>
  );
};

