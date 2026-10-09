import React from 'react';
import { BUILDS, Cleaner, Litterer } from '../characters/cast';
import { PAL, bowLine, stroke } from '../characters/ink';
import { Bench, Bin, Broom, Bulb, Bush, Cloud, Counter, Dustpan, Glow, Pavement, Peel, Puff, Sign, SnackBag, Sparkles, SpeedLines, Tree } from '../characters/props';
import { POSES, Pose, handLocal, BUILD, mixPose, walkPose } from '../characters/rig';
import { Shot } from '../video/stage';
import { ease, keys, prog, sec, wordAt, wordEnd } from '../video/time';
import { ShotProps, exprTrack, idle, poseTrack, vecTrack } from './common';
import { arc, handWorld, walked } from './helpers';

// The park: a path, the sign «حافظ على نظافة المكان», a bin. The litterer reads the sign, lets his bag
// fly off like a dove and walks away; the cleaner bends for it — and for the next ones; later the same
// man folds his bag into his pocket, bins it, and clears a peel from the path.

const GROUND = 1480;
const SIGN_X = 350;
const BIN_X = 860;
const SPOT = 430;            // where the dropped bag lies
const LS = 1.15, CS = 1.12;  // litterer / cleaner scale
const BOUNDS: [number, number, number, number] = [-420, -900, 1500, 2340];
const LB = { ...BUILD, ...BUILDS.litterer };
const CB = { ...BUILD, ...BUILDS.cleaner };

const SIGN_LINES = ['حافظ على', 'نظافة المكان'];

const ParkWorld: React.FC<{ f: number; children?: React.ReactNode; sun?: number; bin?: React.ReactNode }> = ({ f, children, sun = 0, bin }) => (
  <g>
    <rect x={-420} y={-900} width={1920} height={2200} fill="#E2EDF5" />
    <Glow x={880} y={sun > 0 ? 300 : 260} r={180 + sun * 160} o={0.5 + sun * 0.5} />
    <Cloud x={260 + (f % 1200) * 0.03} y={420} s={1} />
    <Cloud x={820 - (f % 1200) * 0.02} y={-160} s={0.8} />
    <Cloud x={120} y={-560} s={0.9} />
    <Bush x={-60} y={1180} s={1.1} />
    <Bush x={980} y={1170} s={1.2} />
    <rect x={-420} y={1170} width={1920} height={300} fill="#CFE0BF" />
    <path d={bowLine(-420, 1170, 1500, 1170, 3)} {...stroke()} />
    <Tree x={120} y={1240} s={1} sway={Math.sin(f / 24)} />
    <Bench x={760} y={1330} s={0.7} />
    <Pavement y={1440} x={-420} w={1920} seed={3} />
    <Sign x={SIGN_X} y={1470} lines={SIGN_LINES} w={440} h={180} post={330} size={56} />
    {bin ?? <Bin x={BIN_X} y={GROUND + 6} s={0.82} />}
    {children}
  </g>
);

/* ------------------------------ the litterer ------------------------------ */

const lHand = (pose: Pose, side: -1 | 1, x: number, facing: 1 | -1) => handWorld(BUILDS.litterer, pose, side, x, GROUND, LS, facing);

/** «عندك عقل، وتقرأ جيدًا:» — walks in munching from his red bag; a bulb lights on «عقل»; stops at the sign. */
export const ParkWalkIn: React.FC<ShotProps> = ({ f, t0 }) => {
  const aql = wordAt('s04', 'عقل'), stop = wordAt('s04', 'وتقرأ') - 2;
  const w = walked(f, t0, stop, 1180, 640, 200);
  // hand to mouth and back, eased (0 = hand down, 1 = at the mouth)
  const m = Math.max(0, Math.min(1, (Math.sin(f * 0.22) - 0.2) * 2.5));
  const base: Pose = { ...POSES.stand, armL: [14, 10], armR: [12 + 6 * m, -30 - 110 * m], handR: m > 0.5 ? 'fist' : 'mitten' };
  const pose = w.moving ? walkPose(w.phase, 1, base) : mixPose(walkPose(w.phase, 1, base), { ...POSES.stand, armL: [14, 10], tilt: -6 }, prog(f, stop, 8));
  const id = idle(f, 23);
  const bulb = prog(f, aql - 2, 8, ease.back) * (1 - prog(f, aql + sec(1.1), 8));
  return (
    <Shot f={f} cam={{ cx: keys(f, [[t0, 760], [stop, 620]]), cy: 1080, zoom: 1.0 }} bounds={BOUNDS}>
      <ParkWorld f={f}>
        <Litterer x={w.x} y={GROUND} s={LS} facing={-1} pose={pose} blink={id.blink}
          expr={exprTrack(f, [[t0, 'chewing'], [aql, 'satisfied'], [stop, 'curious']])}
          talk={m * 0.4} look={vecTrack(f, [[t0, [0.3, 0]], [aql, [0, -0.5]], [stop, [0.6, -0.2]]])}
          itemL={<SnackBag x={4} y={34} s={0.72} />} />
        {bulb > 0 && <Bulb x={w.x} y={GROUND - LS * 520 - 110} s={0.9 * bulb} on={bulb} />}
      </ParkWorld>
    </Shot>
  );
};

/** «حافظ على نظافة المكان» — reads the sign right to left; a red marker underlines each line as it is said. */
export const ParkRead: React.FC<ShotProps> = ({ f, t0 }) => {
  const a = wordAt('s04', 'حافظ'), aEnd = wordEnd('s04', 'على'), b = wordAt('s04', 'نظافة'), bEnd = wordEnd('s04', 'المكان');
  const id = idle(f, 23);
  const nod = f > bEnd - 6 ? Math.sin((f - bEnd + 6) * 0.45) * 7 * Math.max(0, 1 - (f - bEnd) / 24) : 0;
  const pose: Pose = { ...POSES.stand, armL: [14, 10], armR: [10, -40], tilt: -8 + nod };
  const board = 1470 - 330 - 90;
  const u1 = prog(f, a, aEnd - a, ease.linear), u2 = prog(f, b, bEnd - b, ease.linear);
  const line = (y: number, wd: number, p: number) => p > 0 && <path d={bowLine(SIGN_X + wd / 2, y, SIGN_X + wd / 2 - wd * p, y, 2)} {...stroke(9, PAL.red)} />;
  return (
    <Shot f={f} cam={{ cx: 470, cy: 1020, zoom: keys(f, [[t0, 1.7], [t0 + sec(2), 1.78]]) }} bounds={BOUNDS}>
      <ParkWorld f={f}>
        {line(board - 15 + 18, 230, u1)}
        {line(board + 55 + 18, 340, u2)}
        <Litterer x={660} y={GROUND} s={LS} facing={-1} pose={pose} blink={f > a && f < bEnd ? 0 : id.blink}
          expr={exprTrack(f, [[t0, 'curious'], [b, 'neutral'], [bEnd - 6, 'satisfied']])}
          look={[0.55, -0.25]} glance={vecTrack(f, [[t0, [-0.6, -0.4]], [a, [-0.4, -0.5]], [aEnd, [0.6, -0.5]], [b, [-0.5, -0.1]], [bEnd, [0.8, -0.1]]], sec(0.3))}
          itemR={<SnackBag x={0} y={34} s={0.6} empty crumple={0.5} />} />
      </ParkWorld>
    </Shot>
  );
};

/** «ثم تفتح يدك،» — lifts the empty bag high and, on «يدك», opens his fingers. */
export const ParkRelease: React.FC<ShotProps> = ({ f, t0 }) => {
  const open = wordAt('s05', 'يدك');
  const id = idle(f, 23);
  const pose = poseTrack(f, [[t0, { ...POSES.stand, armR: [30, -20] }], [t0 + 4, POSES.holdUp], [open, { ...POSES.holdUp, handR: 'open', armR: [124, 26] }]], sec(0.3));
  const [hx, hy] = lHand(pose, 1, 640, -1);
  const free = prog(f, open + 2, sec(1.2), ease.out);
  return (
    <Shot f={f} cam={{ cx: 600, cy: 900, zoom: keys(f, [[t0, 1.3], [open, 1.42]]) }} bounds={BOUNDS}>
      <ParkWorld f={f}>
        <Litterer x={640} y={GROUND} s={LS} facing={-1} pose={pose} blink={id.blink} expr={exprTrack(f, [[t0, 'satisfied'], [open - 6, 'tender']])} look={[0.1, -0.5]} />
        <SnackBag x={hx} y={hy - 40 - free * 60} s={0.62} rot={free * -8} empty crumple={0.4} />
      </ParkWorld>
    </Shot>
  );
};

/** «فيطير الكيس… كأنك تطلق حمامة سلام.» — the bag grows wings and flutters up into the light; on «سلام»
 *  the wings vanish and it drops like a stone. */
export const ParkDove: React.FC<ShotProps> = ({ f, t0 }) => {
  const wing = wordAt('s05', 'فيطير'), salam = wordAt('s05', 'سلام'), drop = wordEnd('s05', 'سلام') + 2;
  const id = idle(f, 23);
  const rise = prog(f, t0, drop - t0, ease.inOut);
  const bx = 600 + Math.sin(f * 0.12) * 46, by = 760 - rise * 760;
  const fall = prog(f, drop, 12, ease.in);
  const wings = prog(f, wing, 10, ease.back) * (f < drop ? 1 : 0);
  return (
    <Shot f={f} cam={{ cx: 600, cy: keys(f, [[t0, 900], [drop, 220], [drop + 10, 260]]), zoom: 1.25 }} bounds={BOUNDS}>
      <ParkWorld f={f} sun={0.6}>
        <Litterer x={640} y={GROUND} s={LS} facing={-1} pose={walkPose(0, 0, { ...POSES.wave, armR: [140 + Math.sin(f * 0.4) * 18, 30] })} blink={id.blink} expr="tender" look={[0.1, -0.7]} />
        {f < drop && <Glow x={bx} y={by} r={150} o={0.9} />}
        <Sparkles x={bx} y={by} t={(f - salam) / 18} r={160} n={7} color={PAL.blue} seed={9} />
        <SnackBag x={bx} y={f < drop ? by : by + fall * 1400} s={0.75} rot={Math.sin(f * 0.2) * 8 + fall * 40} wings={wings} flap={f * 0.55} empty crumple={0.3} />
        {f >= drop && fall < 1 && <SpeedLines x={bx} y={by + fall * 1400} ang={90} len={110} />}
        {f > wing && f < drop && [0, 1, 2].map((i) => {
          const t = ((f - wing) / 40 + i / 3) % 1;
          return <path key={i} transform={`translate(${bx - 120 + i * 120} ${by + 60 + t * 220}) rotate(${t * 120})`} d="M0 0 q 14 -20 30 -6 q -10 4 -30 6z" fill={PAL.white} {...stroke(4)} opacity={1 - t} />;
        })}
      </ParkWorld>
    </Shot>
  );
};

/** «وتمشي…» — the bag slaps down by the sign; on «وتمشي» the sunglasses drop and he swaggers off. */
export const ParkWalkOff: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const go = wordAt('s06', 'وتمشي');
  const id = idle(f, 23);
  const shades = prog(f, go - 2, 7, ease.back);
  const w = walked(f, go + 8, t1, 640, -300, 230);
  const pose = w.moving ? walkPose(w.phase, 1.3, { ...POSES.stand, armL: [16, 8], armR: [16, 8], tilt: -6 }) : { ...POSES.stand, tilt: -8 };
  const land = prog(f, t0, 5, ease.in);
  return (
    <Shot f={f} cam={{ cx: 560, cy: 1100, zoom: 0.98 }} bounds={BOUNDS}>
      <ParkWorld f={f}>
        <SnackBag x={SPOT} y={-200 + land * (GROUND - 30 + 200)} s={0.6} rot={20} empty crumple={0.6} />
        <Puff x={SPOT} y={GROUND} t={(f - t0 - 5) / 12} />
        <Litterer x={w.x} y={GROUND} s={LS} facing={-1} pose={pose} blink={id.blink} shades={shades}
          expr={exprTrack(f, [[t0, 'satisfied'], [go, 'smug']])} look={[0.2, -0.15]} />
      </ParkWorld>
    </Shot>
  );
};

/** The beat after «تلتفت»: the bag alone under the sign; a breeze nudges it. */
export const ParkLonely: React.FC<ShotProps> = ({ f, t0 }) => {
  const nudge = prog(f, t0 + 6, 10, ease.out);
  return (
    <Shot f={f} cam={{ cx: 440, cy: 1360, zoom: keys(f, [[t0, 1.9], [t0 + 20, 2.0]]) }} bounds={BOUNDS}>
      <ParkWorld f={f}>
        <SnackBag x={SPOT + nudge * 26} y={GROUND - 30} s={0.6} rot={20 + Math.sin(f * 0.5) * 4 * nudge} empty crumple={0.6} />
        <SpeedLines x={SPOT + 210 - nudge * 60} y={GROUND - 120} ang={180} len={140} o={Math.sin(nudge * Math.PI)} />
        <path transform={`translate(${720 - (f - t0) * 22} ${GROUND - 160 + Math.sin(f * 0.3) * 20}) rotate(${f * 9})`} d="M0 0 q 20 -24 40 0 q -20 24 -40 0z" fill={PAL.leaf} {...stroke(4)} />
      </ParkWorld>
    </Shot>
  );
};

/* ------------------------------ the cleaner ------------------------------ */

/** x for the cleaner so that his pinching hand meets `spot` when fully bent (facing left). */
const cleanerX = (spot: number) => spot + handLocal(CB, POSES.bend, 1)[0] * CS;
const CX = cleanerX(SPOT);
const PICKS = () => [wordAt('s07', 'على') + 2, wordAt('s07', 'قبلك') + 9, wordAt('s07', 'بعدك', 1) + 7];
const bendTrack = (f: number, bends: number[]) => {
  const keysP: Array<[number, Pose]> = [[0, POSES.stand]];
  for (const b of bends) keysP.push([b, POSES.bend], [b + 16, { ...POSES.stand, armL: [-30, -60], handL: 'open', tilt: 4 }]);
  return poseTrack(f, keysP, sec(0.3));
};

const CleanerCounter: React.FC<{ f: number }> = ({ f }) => {
  const picks = PICKS();
  const n = picks.filter((p) => f >= p).length;
  if (!n) return null;
  return <Counter x={780} y={720} s={1.15} n={n} pop={prog(f, picks[n - 1], 8, ease.linear)} />;
};

/** Back creak marks at the lower back while bent. */
const Creak: React.FC<{ f: number; at: number; x: number; y: number }> = ({ f, at, x, y }) => {
  const t = (f - at) / 12;
  if (t < 0 || t > 1) return null;
  return <g opacity={1 - t}>{[0, 1, 2].map((i) => <path key={i} d={`M${x + 30 + i * 24} ${y - 20 - i * 26} l 12 -10 l -8 -8 l 14 -10`} fill="none" {...stroke(5)} />)}</g>;
};

/** «بعدك يأتي عامل النظافة،» — he walks in with broom and dustpan and finds the bag. */
export const CleanerArrive: React.FC<ShotProps> = ({ f, t0 }) => {
  const nz = wordAt('s07', 'النظافة');
  const w = walked(f, t0, nz + 6, 1250, CX, 190);
  const id = idle(f, 37);
  const base: Pose = { ...POSES.stand, armL: [10, -20], armR: [16, -40], handR: 'fist', handL: 'fist' };
  const pose = w.moving ? walkPose(w.phase, 0.8, base) : mixPose(base, { ...base, tilt: 10 }, prog(f, nz + 6, 8));
  return (
    <Shot f={f} cam={{ cx: keys(f, [[t0, 760], [nz, 600]]), cy: 1090, zoom: 1.0 }} bounds={BOUNDS}>
      <ParkWorld f={f}>
        <SnackBag x={SPOT} y={GROUND - 30} s={0.6} rot={20} empty crumple={0.6} />
        <Cleaner x={w.x} y={GROUND} s={CS} facing={-1} pose={pose} blink={id.blink} expr={exprTrack(f, [[t0, 'neutral'], [nz + 4, 'tired']])}
          look={vecTrack(f, [[t0, [0.2, 0]], [nz, [0.5, 0.5]]])} itemR={<Broom x={0} y={150} s={0.75} rot={-8} />} itemL={<Dustpan x={0} y={150} s={0.7} />} />
      </ParkWorld>
    </Shot>
  );
};

/** One bending shot: bags fall in on cue, the cleaner bends on its word, picks the bag, the counter ticks. */
const CleanerBends: React.FC<ShotProps & { bends: number[]; drops: number[]; push?: boolean; peel?: boolean }> = ({ f, t0, bends, drops, push = false, peel = false }) => {
  const id = idle(f, 37);
  const pose = bendTrack(f, bends);
  const picks = PICKS();
  const picked = (i: number) => f >= picks[i] + 2;
  const [hx, hy] = handWorld(BUILDS.cleaner, pose, 1, CX, GROUND, CS, -1);
  const tired = bends.length >= 1 && f > bends[bends.length - 1];
  return (
    <Shot f={f} cam={{ cx: 560, cy: 1180, zoom: push ? keys(f, [[t0, 1.3], [bends[bends.length - 1], 1.5]], ease.out) : 1.3, shake: push && f > picks[2] && f < picks[2] + 6 ? 5 : 0 }} bounds={BOUNDS}>
      <ParkWorld f={f}>
        {/* bags on the ground, or falling in from above on their cue */}
        {[0, 1, 2].map((i) => {
          const pickIdx = i;
          if (picked(pickIdx)) return null;
          const inHand = f >= picks[pickIdx] - 1;
          if (inHand) return <SnackBag key={i} x={hx} y={hy + 26} s={0.55} rot={10} empty crumple={0.6} />;
          if (i === 0) return <SnackBag key={i} x={SPOT} y={GROUND - 30} s={0.6} rot={20} empty crumple={0.6} />;
          const d = drops[i - 1];
          if (d === undefined || f < d) return null;
          const p = prog(f, d, 8, ease.in);
          return <SnackBag key={i} x={SPOT + (i === 2 ? 20 : -10)} y={-100 + p * (GROUND - 30 + 100)} s={0.6} rot={-20 + i * 30} empty crumple={0.6} />;
        })}
        {peel && drops[1] !== undefined && f >= drops[1] && f < picks[2] - 1 && <Peel x={SPOT + 90} y={-80 + prog(f, drops[1] + 3, 8, ease.in) * (GROUND - 20 + 80)} s={0.8} rot={f * 20} />}
        {drops.map((d, i) => <Puff key={i} x={SPOT} y={GROUND} t={(f - d - 8) / 12} />)}
        <Cleaner x={CX} y={GROUND} s={CS} facing={-1} pose={pose} blink={id.blink}
          expr={exprTrack(f, [[t0, tired ? 'tired' : 'neutral'], ...bends.map((b) => [b + 4, 'tired'] as [number, 'tired'])])}
          look={[0.4, 0.5]} itemL={<Dustpan x={0} y={150} s={0.7} />} />
        {bends.map((b, i) => <Creak key={i} f={f} at={b + 8} x={CX + 40} y={GROUND - 420} />)}
        <CleanerCounter f={f} />
      </ParkWorld>
    </Shot>
  );
};

/** «ينحني على كيسك…» */
export const CleanerBend1: React.FC<ShotProps> = (p) => <CleanerBends {...p} bends={[wordAt('s07', 'ينحني')]} drops={[]} />;
/** «وكيس من قبلك…» — a second bag drops in from above; he bends again. */
export const CleanerBend2: React.FC<ShotProps> = (p) => <CleanerBends {...p} bends={[wordAt('s07', 'قبلك') - 2]} drops={[wordAt('s07', 'وكيس') + 2]} />;
/** «ومن بعدك.» — a third bag and a peel; the third bend, a push-in, the counter hits 3. */
export const CleanerBend3: React.FC<ShotProps> = (p) => <CleanerBends {...p} bends={[wordAt('s07', 'بعدك', 1) - 3]} drops={[wordAt('s07', 'وكيس') + 2, wordAt('s07', 'ومن')]} push peel />;

/* ------------------------------ the turn-around ------------------------------ */

/** «احتفظ بالكيس في جيبك…» — folds the empty bag small and tucks it into his shirt pocket. */
export const ParkPocket: React.FC<ShotProps> = ({ f, t0 }) => {
  const fold = wordAt('s10', 'احتفظ'), pocket = wordAt('s10', 'جيبك');
  const id = idle(f, 23);
  const pose = poseTrack(f, [[t0, { ...POSES.stand, armL: [-24, -96], armR: [-24, -96], handL: 'pinch', handR: 'pinch' }], [pocket - 6, { ...POSES.stand, armL: [8, 6], armR: [-36, -112], handR: 'open' }]], sec(0.25));
  const [lx, ly] = handWorld(BUILDS.litterer, pose, -1, 600, GROUND, LS, 1);
  const [rx, ry] = handWorld(BUILDS.litterer, pose, 1, 600, GROUND, LS, 1);
  const into = prog(f, pocket - 6, 8, ease.in);
  const pocketAt: [number, number] = [600 - 26 * LS, GROUND - 330 * LS];
  const bag: [number, number] = [((lx + rx) / 2) * (1 - into) + pocketAt[0] * into, ((ly + ry) / 2 + 10) * (1 - into) + pocketAt[1] * into];
  return (
    <Shot f={f} cam={{ cx: 600, cy: 1010, zoom: keys(f, [[t0, 1.45], [pocket, 1.55]]) }} bounds={BOUNDS}>
      <ParkWorld f={f}>
        <Litterer x={600} y={GROUND} s={LS} facing={1} pose={pose} blink={id.blink} expr={exprTrack(f, [[t0, 'neutral'], [fold, 'determined'], [pocket, 'satisfied']])}
          look={vecTrack(f, [[t0, [0, 0.5]], [pocket + 6, [0.2, 0]]])} />
        {into < 1 && <SnackBag x={bag[0]} y={bag[1]} s={0.6 * (1 - into * 0.6)} fold={prog(f, fold, 12, ease.inOut)} empty />}
        <Sparkles x={pocketAt[0]} y={pocketAt[1]} t={(f - pocket) / 14} r={70} n={4} color={PAL.red} seed={12} />
      </ParkWorld>
    </Shot>
  );
};

/** «حتى تجد سلة.» — walks to the bin; on «سلة» the folded bag goes in, the lid flips, the bin smiles. */
export const ParkBin: React.FC<ShotProps> = ({ f, t0 }) => {
  const sala = wordAt('s10', 'سلة');
  const id = idle(f, 23);
  const w = walked(f, t0, sala - 10, 600, 760, 190);
  const pose = w.moving ? walkPose(w.phase, 0.9) : poseTrack(f, [[sala - 10, { ...POSES.stand, armR: [70, 10], handR: 'pinch' }], [sala + 8, POSES.thumbsUp]], sec(0.22));
  const [hx, hy] = handWorld(BUILDS.litterer, pose, 1, w.x, GROUND, LS, 1);
  const lid = keys(f, [[sala - 4, 0], [sala, 1], [sala + 10, 1], [sala + 14, 0]], ease.out);
  const fall = prog(f, sala, 6, ease.in);
  return (
    <Shot f={f} cam={{ cx: 700, cy: 1130, zoom: 1.2 }} bounds={BOUNDS}>
      <ParkWorld f={f} bin={<Bin x={BIN_X} y={GROUND + 6} s={0.82} lid={lid} face={prog(f, sala + 12, 8)} />}>
        <Litterer x={w.x} y={GROUND} s={LS} facing={1} pose={pose} blink={id.blink} expr={exprTrack(f, [[t0, 'satisfied'], [sala + 10, 'laugh']])} look={[0.3, 0.1]} />
        {f > sala - 14 && fall < 1 && <SnackBag x={hx + (BIN_X - hx) * fall} y={hy + 20 + fall * 80} s={0.36} fold={1} empty />}
        <Sparkles x={BIN_X} y={GROUND - 200} t={(f - sala - 10) / 16} r={110} color={PAL.blue} seed={21} />
      </ParkWorld>
    </Shot>
  );
};

/** «إماطةُ الأذى عن الطريق صدقة…» — he clears a peel from the path into the bin; the cleaner straightens
 *  his back, relieved; the light warms. */
export const ParkClear: React.FC<ShotProps> = ({ f, t0 }) => {
  const im = wordAt('s11', 'إماطة'), tariq = wordAt('s11', 'الطريق'), sadaqa = wordAt('s11', 'صدقة');
  const id = idle(f, 23), idc = idle(f, 37);
  const PEEL_X = 470;
  const lx = PEEL_X + handLocal(LB, POSES.bend, 1)[0] * LS;
  const turned = f >= tariq - 8;
  const pose = poseTrack(f, [[t0, POSES.stand], [im, POSES.bend], [im + 14, { ...POSES.stand, armR: [40, -30], handR: 'pinch' }], [tariq - 8, { ...POSES.stand, armR: [120, 20], handR: 'pinch' }], [tariq - 2, { ...POSES.stand, armR: [70, -10], handR: 'open' }]], sec(0.25));
  const [hx, hy] = handWorld(BUILDS.litterer, pose, 1, lx, GROUND, LS, turned ? 1 : -1);
  const toss = prog(f, tariq - 2, 10, ease.inOut);
  const [px, py] = arc([hx, hy], [BIN_X, GROUND - 170], toss, 220);
  const lid = keys(f, [[tariq, 0], [tariq + 4, 1], [tariq + 14, 1], [tariq + 18, 0]], ease.out);
  const warm = prog(f, sadaqa - 4, sec(0.6));
  const cPose = poseTrack(f, [[t0, { ...POSES.stand, armR: [16, -40], handR: 'fist', lean: 10, tilt: 6 }], [sadaqa - 2, { ...POSES.stand, armL: [160, 20], armR: [160, 20], handL: 'open', handR: 'open', lean: -6, squash: 0.04 }]], sec(0.35));
  return (
    <Shot f={f} cam={{ cx: 560, cy: 1100, zoom: keys(f, [[t0, 1.0], [sadaqa, 1.04]]) }} bounds={BOUNDS}>
      <ParkWorld f={f} sun={warm} bin={<Bin x={BIN_X} y={GROUND + 6} s={0.82} lid={lid} face={warm} />}>
        <Glow x={540} y={1050} r={520} o={warm * 0.6} />
        <Cleaner x={190} y={GROUND} s={CS * 0.95} facing={1} pose={cPose} blink={idc.blink} expr={exprTrack(f, [[t0, 'tired'], [sadaqa, 'satisfied']])} look={[0.3, -0.1]}
          itemR={f < sadaqa ? <Broom x={0} y={150} s={0.75} rot={-8} /> : undefined} />
        {f >= sadaqa && <Broom x={300} y={GROUND - 220} s={0.75} rot={20} />}
        <Litterer x={lx} y={GROUND} s={LS} facing={turned ? 1 : -1} pose={pose} blink={id.blink} expr={exprTrack(f, [[t0, 'determined'], [tariq + 6, 'satisfied']])} look={[0.2, 0.3]} />
        {f < im + 8 && <Peel x={PEEL_X} y={GROUND - 12} s={0.85} rot={-10} />}
        {f >= im + 8 && toss < 1 && <Peel x={toss > 0 ? px : hx} y={toss > 0 ? py : hy + 16} s={0.7} rot={toss * 400} />}
        <Sparkles x={540} y={900} t={(f - sadaqa) / 22} r={300} n={9} color={PAL.blue} seed={33} />
      </ParkWorld>
    </Shot>
  );
};
