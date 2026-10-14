import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { DrawPath, GsapCamera, RiveActor, alongPath, clock, drawn, hop, morph, popIn, pulse, shake, tween, useGsapTimeline } from '@motion/index';
import { INK, LINE, lerp, stroke } from '@mukarram/characters/ink';
import { BUILD, Build, POSES, Person, Pose, blinkAt, breath } from '@mukarram/characters/rig';
import { exprTrack, poseTrack, vecTrack } from '@mukarram/scenes/common';
import { Boil } from '@mukarram/video/stage';
import { handAt, reachB } from '../../../power-of-no-b/src/characters/worker';
import { TITLE_FONT } from '../video/fonts';
import { wordAt } from '../video/time';
import { BULB, C, CLOUD, Curls, Desk, Lamp, PLANE, PLANE_FOLD, QMARK, RAYS, Room, SHEET, Window } from './props';

// «فكرة طايرة» — one continuous shot. Who does what (one clock: Remotion's frame → seconds t):
//   GSAP (@remotion/gsap): the camera, the impact shake, the happy hop, the glow pulse, the on-screen titles;
//   @remotion/paths: the thought cloud and "?" drawing themselves, the flight path, its trail, sheet ⇄ plane morph,
//     the bulb drawn on the paper, the underline;
//   Rive (RiveActor, state machine replayed to t): the bird on the sill looking up at the plane, then dancing;
//   TSX rig (reels/mukarram) with arm IK (reels/doublethink via power-of-no-b): the thinker — tired, curious, folding,
//     winding up, throwing, tracking the plane with his eyes, catching it, unfolding the idea.
// Everything is a function of t, so any frame renders alone, in any order, at 30 or 60 fps.

const W = 1080, H = 1920;
const B_: Build = { ...BUILD, shirt: C.shirt, seed: 7 };
const AT = { x: 420, y: 1520, s: 1.2, facing: 1 as const };
const PAPER_ON_DESK: [number, number] = [585, 1282];
const CATCH: [number, number] = [578, 1018];
const PRESENT: [number, number] = [690, 940];   // paper centre when held up to the camera

/** Beats (seconds), on the words where they belong. */
const T = {
  blank: wordAt('s01', 'فاضية'),
  noCome: wordAt('s01', 'تجي'),
  look: 3.25, reach: 3.45, grab: 3.8, folded: 4.35, windup: 4.4, release: 4.84, catch: 7.92,
  unfold: 8.55, unfolded: 8.95, bulb: 8.98, bulbDone: 9.9,
  lit: wordAt('s02', 'تجي', 1),
  moving: wordAt('s02', 'تتحرك'),
};

const P = (o: Partial<Pose>): Pose => ({ ...(POSES.stand as Pose), ...o });
const POSE = {
  tired: P({ tilt: 6, lean: 4, armL: [6, 4], armR: [12, 8] }),
  slump: P({ tilt: 11, lean: 8, squash: 0.045, armL: [3, 2], armR: [5, 3] }),
  perk: P({ tilt: -5, lean: -2, squash: -0.02 }),
  windup: P({ armR: [168, 48], armL: [34, 24], lean: -10, tilt: -7, squash: 0.03, handR: 'pinch', handL: 'open' }),
  throw: P({ armR: [86, -6], armL: [-12, 12], lean: 13, tilt: 7, handR: 'open' }),
  watch: P({ tilt: -9, lean: -3, armL: [10, 8], armR: [16, 10], handR: 'open' }),
  present: P({ tilt: -4, lean: -2, armL: [12, 8], handR: 'pinch' }),
};
const s30 = (s: number) => s * 30;   // the mukarram tracks count 30-fps frames

const basePose = (t: number): Pose =>
  poseTrack(s30(t), [
    [0, POSE.tired], [s30(T.noCome - 0.1), POSE.slump], [s30(T.look), POSE.perk], [s30(T.windup), POSE.windup],
    [s30(T.release - 0.1), POSE.throw], [s30(T.release + 0.45), POSE.watch], [s30(T.catch + 0.1), POSE.present],
  ], 8);

const stance = (t: number) => ({ ...AT, bob: breath(s30(t), 30, 3) * 2.2 });

// The flight starts where the throwing hand is at release, and ends in the catching hand.
const RELEASE = handAt(B_, basePose(T.release), 1, stance(T.release));
const FLIGHT = `M${RELEASE[0].toFixed(1)} ${RELEASE[1].toFixed(1)} C${RELEASE[0] + 200} ${RELEASE[1] - 300} 990 600 870 430 C770 290 430 290 290 460 C170 620 230 860 420 905 C500 925 545 975 ${CATCH[0]} ${CATCH[1]}`;
const flightP = (t: number) => tween(t, T.release, T.catch, 0, 1, 'sine.inOut');

/** Right-hand target and its weight (0 = the pose's own arm, 1 = the hand on the target). */
const rightHand = (t: number): [[number, number], number] | null => {
  if (t >= T.reach && t < T.grab) return [PAPER_ON_DESK, tween(t, T.reach, T.grab - 0.08, 0, 1, 'power2.inOut')];
  if (t >= T.grab && t < T.windup) {
    const k = tween(t, T.grab, T.grab + 0.35, 0, 1, 'power2.inOut');
    return [[lerp(PAPER_ON_DESK[0], 520, k), lerp(PAPER_ON_DESK[1], 1130, k)], tween(t, T.windup - 0.15, T.windup, 1, 0)];
  }
  if (t >= T.catch - 0.42 && t < T.catch) {
    const p = alongPath(FLIGHT, flightP(t));
    return [[p.x, p.y], tween(t, T.catch - 0.42, T.catch - 0.12, 0, 1, 'power2.out')];
  }
  if (t >= T.catch) {
    const k = tween(t, T.unfold, T.unfolded, 0, 1, 'power2.inOut');
    const sc = lerp(1, 2.0, k);
    const sway = Math.sin(t * 2.1) * 6 * k;
    return [[lerp(CATCH[0], PRESENT[0] - 70 * sc + 12, k), lerp(CATCH[1], PRESENT[1], k) + sway], 1];
  }
  return null;
};

const fullPose = (t: number): Pose => {
  const base = basePose(t);
  const h = rightHand(t);
  if (!h) return base;
  const ik = reachB(B_, base, stance(t), null, h[0], { R: -1 });
  return { ...base, armR: [lerp(base.armR[0], ik.armR[0], h[1]), lerp(base.armR[1], ik.armR[1], h[1])], handR: t >= T.grab - 0.05 ? 'pinch' : base.handR };
};

/** The held sheet/plane: where it is, its heading, how folded (1 = plane), its scale. */
const held = (t: number, pose: Pose) => {
  const hand = handAt(B_, pose, 1, stance(t));
  if (t < T.grab) return null;
  if (t < T.release) {
    const fold = tween(t, T.grab + 0.15, T.folded, 0, 1, 'power2.inOut');
    return { x: hand[0] + 8, y: hand[1] - 10, angle: lerp(0, -28, tween(t, T.windup, T.release, 0, 1)), fold, s: lerp(0.55, 0.8, fold) };
  }
  if (t < T.catch) return null;
  const k = tween(t, T.unfold, T.unfolded, 0, 1, 'power2.inOut');
  const sc = lerp(0.8, 2.0, k);
  return { x: hand[0] + lerp(10, 70 * sc - 12, k), y: hand[1] + lerp(-8, 0, k), angle: lerp(18, 0, k), fold: 1 - k, s: sc };
};

const Sheet: React.FC<{ fold: number; bulb: number; rays: number }> = ({ fold, bulb, rays }) => (
  <g>
    <path d={morph(fold, SHEET, PLANE)} fill={C.paper} {...stroke(LINE * 0.8)} />
    {fold > 0.5 && <path d={PLANE_FOLD} {...stroke(LINE * 0.5, C.paperFold)} opacity={(fold - 0.5) * 2} />}
    {BULB.map((d, i) => <DrawPath key={i} d={d} p={tween(bulb, i / 3, (i + 1) / 3, 0, 1, 'none')} stroke={C.ideaDeep} strokeWidth={4.5} />)}
    {rays > 0 && <path d={RAYS} {...stroke(4, C.ideaDeep)} opacity={rays} />}
  </g>
);

/** Fallback bird if the Rive file cannot load (TSX stand-in: same place, same size). */
const BirdFallback: React.FC = () => (
  <svg width={240} height={240} viewBox="-120 -120 240 240">
    <ellipse cx={0} cy={20} rx={70} ry={64} fill="#4FC3F7" {...stroke(LINE)} />
    <circle cx={-22} cy={4} r={10} fill={INK} /><circle cx={22} cy={4} r={10} fill={INK} />
    <path d="M-10 26 L0 40 L10 26 Z" fill="#8D6E63" {...stroke(LINE * 0.6)} />
  </svg>
);

const World: React.FC<{ t: number }> = ({ t }) => {
  const pose = fullPose(t);
  const st = stance(t);
  const head: [number, number] = [AT.x, AT.y - 520];
  const fp = flightP(t);
  const plane = t >= T.release && t < T.catch ? alongPath(FLIGHT, fp) : null;
  const look: [number, number] = plane
    ? [Math.max(-1, Math.min(1, (plane.x - head[0]) / 260)), Math.max(-1, Math.min(1, (plane.y - head[1]) / 260))]
    : vecTrack(s30(t), [[0, [0.55, 0.65]], [s30(T.look), [0.85, -0.6]], [s30(T.reach), [0.6, 0.7]], [s30(T.catch), [0.7, 0]], [s30(T.unfolded + 0.2), [0.9, -0.1]], [s30(T.bulbDone + 0.2), [0, 0]]]);
  const expr = exprTrack(s30(t), [
    [0, 'tired'], [s30(T.look), 'curious'], [s30(T.reach - 0.05), 'smug'], [s30(T.windup), 'determined'], [s30(T.release + 0.1), 'curious'],
    [s30(T.catch - 0.06), 'surprised'], [s30(T.catch + 0.42), 'laugh'], [s30(T.unfolded), 'curious'], [s30(T.bulbDone + 0.15), 'satisfied'], [s30(T.lit), 'laugh'],
  ]);
  const h = held(t, pose);
  const bulb = tween(t, T.bulb, T.bulbDone, 0, 1, 'power1.inOut');
  const rays = tween(t, T.lit, T.lit + 0.3, 0, 1);
  const trailHead = fp, trailTail = Math.max(0, fp - 0.2);

  return (
    <g>
      <Room warm={tween(t, T.lit, T.lit + 0.8, 0, 1)} />
      <Window warm={tween(t, T.lit, T.lit + 0.8, 0, 1)} />
      {/* the bird (Rive): idle, looks up as the plane passes over it, dances when the idea lights up */}
      <foreignObject x={760} y={612} width={240} height={240}>
        <RiveActor src={staticFile('rive/birb.riv')} artboard="birb" stateMachine="birb" time={t}
          inputs={[{ at: 5.15, name: 'look up' }, { at: T.lit + 0.1, name: 'dance', value: true }]}
          width={240} height={240} fallback={<BirdFallback />} />
      </foreignObject>
      {/* thought cloud and question mark draw themselves, then fade as he looks away */}
      <g transform="translate(-10 -70)" opacity={tween(t, T.look - 0.1, T.look + 0.25, 1, 0)}>
        <DrawPath d={CLOUD} p={tween(t, 0.2, 1.0, 0, 1, 'power1.inOut')} stroke={C.paper} strokeWidth={LINE} fill="none" />
        {/* the Arabic question mark «؟» is the mirror image of the Latin one */}
        <g transform="translate(832 0) scale(-1 1)"><DrawPath d={QMARK} p={tween(t, 0.85, 1.4, 0, 1, 'power2.out')} stroke={C.idea} strokeWidth={LINE * 1.6} /></g>
        <circle cx={350} cy={905} r={14} fill={C.paper} opacity={tween(t, 0.1, 0.3, 0, 1)} />
        <circle cx={385} cy={935} r={9} fill={C.paper} opacity={tween(t, 0.0, 0.2, 0, 1)} />
      </g>
      <Lamp glow={tween(t, T.lit, T.lit + 0.8, 0, 1)} />
      {/* the actor group: GSAP hops it when the idea is caught; whatever he holds hops with him */}
      <g data-actor>
        <circle data-glow cx={PRESENT[0]} cy={PRESENT[1]} r={210} fill={C.idea} opacity={0} />
        <Person x={st.x} y={st.y} s={st.s} build={B_} pose={pose} expr={expr} look={look} bob={st.bob}
          blink={blinkAt(Math.floor(s30(t)), 30, 7)} headFront={<Curls rx={B_.headRX} ry={B_.headRY} />} />
        {h && (
          <g transform={`translate(${h.x} ${h.y}) rotate(${h.angle}) scale(${h.s})`}>
            <Sheet fold={h.fold} bulb={bulb} rays={rays} />
          </g>
        )}
      </g>
      <Desk />
      {/* the plane in flight, its trail drawn along the same path */}
      {plane && <DrawPath d={FLIGHT} p={trailHead} from={trailTail} stroke={C.paper} strokeWidth={6} opacity={0.55} />}
      {plane && (
        <g transform={`translate(${plane.x} ${plane.y}) rotate(${plane.angle + Math.sin(t * 9) * 4}) scale(0.8)`}>
          <Sheet fold={1} bulb={0} rays={0} />
        </g>
      )}
      {/* the paper still on the desk until he picks it up */}
      {t < T.grab && <g transform={`translate(${PAPER_ON_DESK[0] + 10} ${PAPER_ON_DESK[1] - 4}) scale(0.55 0.22)`}><path d={SHEET} fill={C.paper} {...stroke(LINE * 1.4)} /></g>}
    </g>
  );
};

/** Titles (HTML, RTL) choreographed by a GSAP timeline in screen space; the underline is a drawn path. */
const Titles: React.FC<{ t: number }> = ({ t }) => {
  const scope = useGsapTimeline<HTMLDivElement>(({ timeline, selector }) => {
    timeline.fromTo(selector('.t1'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', immediateRender: false }, T.blank - 0.35)
      .to(selector('.t1'), { y: -30, opacity: 0, duration: 0.3, ease: 'power2.in' }, T.look - 0.05);
    popIn(timeline, selector('.t2a'), T.lit - 0.05, { dur: 0.5, transformOrigin: '50% 50%' });
    popIn(timeline, selector('.t2b'), T.lit + 0.3, { dur: 0.5, transformOrigin: '50% 50%' });
    pulse(timeline, selector('.t2b'), T.moving + 0.2, { scale: 1.06, dur: 0.6, transformOrigin: '50% 50%' });
  });
  const pill: React.CSSProperties = { display: 'inline-block', padding: '14px 40px 26px', borderRadius: 40, background: 'rgba(31,35,41,0.86)', color: C.text, fontFamily: TITLE_FONT, fontWeight: 900, direction: 'rtl', lineHeight: 1.35 };
  const under = drawn('M6 22 C80 8 170 30 250 14 C300 6 330 18 344 12', tween(t, T.moving, T.moving + 0.45, 0, 1, 'power2.out'));
  return (
    <div ref={scope} style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', top: 300, left: 72, width: 828, textAlign: 'center' }}>
        <div className="t1" style={{ ...pill, fontSize: 78, opacity: 0 }}>ورقة فاضية…</div>
      </div>
      <div style={{ position: 'absolute', top: 280, left: 72, width: 828, textAlign: 'center' }}>
        <div className="t2a" style={{ ...pill, fontSize: 92, opacity: 0 }}>الفكرة تجي</div>
        <div style={{ height: 22 }} />
        <div className="t2b" style={{ ...pill, fontSize: 92, opacity: 0, background: C.idea, color: INK }}>
          وأنت <span style={{ position: 'relative', display: 'inline-block' }}>تتحرّك
            <svg width="100%" height="34" viewBox="0 0 350 34" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: -18 }}>
              <path d="M6 22 C80 8 170 30 250 14 C300 6 330 18 344 12" fill="none" {...stroke(9, INK)} strokeDasharray={under.strokeDasharray} strokeDashoffset={under.strokeDashoffset} />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
};

/** The scene's GSAP timeline for world elements (shake, hop, glow) — scoped to the world group. */
const WorldMoves: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scope = useGsapTimeline<SVGGElement>(({ timeline, selector, scope: root }) => {
    shake(timeline, root, T.catch, { amp: 9, dur: 0.32 });
    hop(timeline, selector('[data-actor]'), T.catch + 0.42, { lift: 34, dur: 0.6, svgOrigin: `${AT.x} ${AT.y}` });
    timeline.to(selector('[data-glow]'), { opacity: 0.32, duration: 0.4, ease: 'power2.out' }, T.lit);
    pulse(timeline, selector('[data-glow]'), T.lit + 0.4, { scale: 1.12, dur: 0.9, n: 3, svgOrigin: `${PRESENT[0]} ${PRESENT[1]}` });
  });
  return <g ref={scope}>{children}</g>;
};

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { t } = clock(frame, fps);
  return (
    <AbsoluteFill style={{ background: C.wallDusk }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        <defs><Boil t={t} /></defs>
        <GsapCamera width={W} height={H} start={{ cx: 470, cy: 1090, zoom: 1.5 }} moves={[
          { at: 0, dur: 3.3, cx: 465, cy: 1070, zoom: 1.62, ease: 'sine.inOut' },
          { at: T.windup - 0.1, dur: 0.5, cx: 490, cy: 1040, zoom: 1.38, ease: 'power2.out' },
          { at: T.release, dur: 1.2, cx: 640, cy: 760, zoom: 0.96, ease: 'power2.inOut' },
          { at: T.release + 1.25, dur: 1.4, cx: 470, cy: 760, zoom: 0.93, ease: 'sine.inOut' },
          { at: T.catch - 0.55, dur: 0.6, cx: 540, cy: 1000, zoom: 1.22, ease: 'power3.out' },
          { at: T.unfold, dur: 0.7, cx: 600, cy: 990, zoom: 1.42, ease: 'power2.inOut' },
          { at: T.lit - 0.35, dur: 0.9, cx: 585, cy: 990, zoom: 1.1, ease: 'power3.inOut' },
          { at: T.lit + 0.6, dur: 2.4, cx: 580, cy: 985, zoom: 1.16, ease: 'sine.inOut' },
        ]}>
          <WorldMoves>
            <g filter="url(#boil)"><World t={t} /></g>
          </WorldMoves>
        </GsapCamera>
      </svg>
      <Titles t={t} />
    </AbsoluteFill>
  );
};
