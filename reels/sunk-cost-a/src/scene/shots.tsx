import React from 'react';
import { DrawPath, EndCard, Pill, alongPath, keys, popIn, tween, useGsapTimeline } from '@motion/index';
import { E as _E } from './expr';
import { INK, LINE, lerp, stroke, wobEllipse, wobRect } from '@mukarram/characters/ink';
import { POSES, Pose, walkPose } from '@mukarram/characters/rig';
import { poseTrack, vecTrack } from '@mukarram/scenes/common';
import { xTrack } from '@doublethink/scenes/common';
import { wordAt } from '../video/time';
import { C, Clock, Dino, ExitSign, FONT, Frame, Hero, NEIGHBOURS, Neighbour, Notes, Popcorn, SeatBack, SeatFront, Ticket, s30, sitBuild, waveTop } from './kit';
import { handAt } from '../../../power-of-no-b/src/characters/worker';

// Reel A — «لماذا تتمسك بالخسارة؟»: the disappointing movie. Fifteen shots, every beat on the word it belongs to
// (wordAt → seconds in the measured take). Each shot gets t (seconds since its own start) and T (reel seconds).
// GSAP (GsapCamera via Frame, popIn on HTML) moves cameras and titles; @remotion/paths draws the clock, the
// ripples, the dashed "either way" lines and sinks the ticket along a path; the mukarram rig acts with IK hands.

const X = _E;
const P = (o: Partial<Pose>): Pose => ({ ...(POSES.stand as Pose), ...o });
export type ShotProps = { t: number; T: number };

/* beats (reel seconds) */
export const B = {
  price: wordAt('s01', 'على'),
  bad: wordAt('s02', 'سي'), vbad: wordAt('s03', 'سي'),
  exit: wordAt('s04', 'باب'), ticket: wordAt('s05', 'التذكرة'), sit: wordAt('s06', 'وترجع'),
  hour1: wordAt('s07', 'ساعة'), hour2: wordAt('s07', 'ساعتين'), popcorn: wordAt('s07', 'الفشار'), people: wordAt('s07', 'والناس'),
  dino: wordAt('s08', 'والديناصور'), sing: wordAt('s08', 'يغني'),
  still: wordAt('s09', 'وأنت'), why: wordAt('s09', 'ليش'), paid: wordAt('s09', 'دفعت'),
  gone: wordAt('s10', 'راحت'), ifSit: wordAt('s10', 'قعدت'), ifLeave: wordAt('s10', 'طلعت'),
  name: wordAt('s11', 'مغالطة'),
  useless: wordAt('s12', 'ينفعك'), money: wordAt('s12', 'فلوس'), time: wordAt('s12', 'وقت'), effort: wordAt('s12', 'تعب'),
  study: wordAt('s13', 'تجربة'), full: wordAt('s13', 'السعر'), more: wordAt('s13', 'أكثر'), discount: wordAt('s13', 'خصم'), six: wordAt('s13', 'ست'),
  researchers: wordAt('s14', 'والباحثين'), films: wordAt('s14', 'أفلام'), end: wordAt('s14', 'لآخرها'),
  notAll: wordAt('s15', 'مو'), better: wordAt('s15', 'يحلو'), cont: wordAt('s15', 'كمل'),
  next: wordAt('s16', 'الساعة'), notTicket: wordAt('s16', 'التذكرة'),
  back: wordAt('s17', 'الفلوس'), twoHours: wordAt('s17', 'ساعتين'),
  q: wordAt('s18', 'لو'), q2: wordAt('s18', 'هل'), cta: wordAt('s19', 'قلها'),
};

/* ---------------- the hall (audience seen from the screen) ---------------- */

const BACK = { y: 1150, s: 0.55, xs: [175, 345, 515, 690, 865] };
const FRONT = { y: 1790, s: 0.95, hero: 560, left: 205, right: 905 };
const hip = (y: number, s: number) => y - 100 * s;
type BackSeat = { who: 'n1' | 'n2' | 'n3' | 'n4'; i: number; leave?: number; expr?: Parameters<typeof Neighbour>[0]['expr'] };

const Hall: React.FC<{ T: number; children?: React.ReactNode; back: BackSeat[]; left?: { leave?: number; sleep?: boolean } | null; clockTurns?: number; exitGlow?: number; tint?: string; tintK?: number }> = ({ T, children, back, left = { sleep: false }, clockTurns = 0, exitGlow = 0, tint = C.screen, tintK = 0.1 }) => {
  const by = hip(BACK.y, BACK.s), fy = hip(FRONT.y, FRONT.s);
  return (
    <g>
      <rect x={-600} y={-600} width={2300} height={3200} fill={C.wall} />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${-500 + i * 180} -600 L${-500 + i * 180} 2600`} {...stroke(12, C.wallLine)} opacity={0.6} />)}
      {/* exit door and sign (left wall), clock (right wall) */}
      <path d={wobRect(40, 690, 200, 330, 8, 4, 3)} fill={C.far} {...stroke(LINE)} />
      <g transform="translate(140 615)"><ExitSign glow={exitGlow} /></g>
      <Clock x={940} y={560} r={70} turns={clockTurns} />
      {/* the far rows: just heads in the dark */}
      {Array.from({ length: 9 }, (_, i) => <ellipse key={i} cx={70 + i * 118} cy={905 + (i % 2) * 6} rx={40} ry={44} fill={C.far} opacity={0.9} />)}
      <rect x={-600} y={930} width={2300} height={60} fill={C.velvetDeep} opacity={0.8} />
      {/* back row */}
      {BACK.xs.map((x, i) => <SeatBack key={i} x={x} yHip={by} s={BACK.s} />)}
      {back.map((p) => {
        const lv = p.leave ?? 99;
        const rise = tween(T, lv, lv + 0.4, 1, 0, 'power2.out');
        const go = tween(T, lv + 0.35, lv + 1.4, 0, 1, 'power1.in');
        const x = BACK.xs[p.i] - go * 700;
        const pose = go > 0 ? walkPose((T - lv) * 1.6, 0.8) : (POSES.stand as Pose);
        return <Neighbour key={p.i} who={p.who} x={x} y={BACK.y} s={BACK.s} T={T} sit={rise} seed={p.i * 7 + 3} expr={p.expr ?? 'tired'} pose={pose} look={[go > 0 ? -0.8 : 0, 0]} opacity={1 - tween(T, lv + 1.0, lv + 1.4, 0, 1)} />;
      })}
      {BACK.xs.map((x, i) => <SeatFront key={i} x={x} yHip={by} s={BACK.s} />)}
      {/* front row */}
      {[FRONT.left, FRONT.hero, FRONT.right].map((x, i) => <SeatBack key={i} x={x} yHip={fy} s={FRONT.s} />)}
      {left && (() => {
        const lv = left.leave ?? 99;
        const rise = tween(T, lv, lv + 0.4, 1, 0, 'power2.out'), go = tween(T, lv + 0.35, lv + 1.5, 0, 1, 'power1.in');
        return <Neighbour who={'n4'} x={FRONT.left - go * 700} y={FRONT.y} s={FRONT.s} T={T} sit={rise} seed={41} expr={left.sleep ? X.sleep : 'tired'}
          pose={go > 0 ? walkPose((T - lv) * 1.6, 0.8) : P({ tilt: left.sleep ? 14 : 4, lean: left.sleep ? 6 : 0 })} look={[go > 0 ? -0.8 : 0.1, 0.1]} opacity={1 - tween(T, lv + 1.1, lv + 1.5, 0, 1)} />;
      })()}
      {children}
      {[FRONT.left, FRONT.hero, FRONT.right].map((x, i) => <SeatFront key={i} x={x} yHip={fy} s={FRONT.s} />)}
      {/* the screen's light on the audience */}
      <rect x={-600} y={-600} width={2300} height={3200} fill={tint} opacity={tintK * (0.85 + 0.15 * Math.sin(T * 7.3) * Math.sin(T * 2.1))} style={{ mixBlendMode: 'screen' }} />
    </g>
  );
};

/** The hero in his seat, popcorn in the left hand on his lap, ticket in the right hand on the armrest — unless told otherwise. */
const fy = hip(FRONT.y, FRONT.s);
const SEATED = { x: FRONT.hero, y: FRONT.y, s: FRONT.s };
const restR: [number, number] = [FRONT.hero + 92, fy - 58];
const restL: [number, number] = [FRONT.hero - 70, fy - 30];

/* ---------------- the screen (seen from the audience) ---------------- */

const ScreenRoom: React.FC<{ T: number; children: React.ReactNode; light?: number }> = ({ T, children, light = 1 }) => (
  <g>
    <rect x={-600} y={-600} width={2300} height={3200} fill={C.night} />
    <path d={wobRect(70, 330, 940, 700, 10, 2, 3)} fill={C.frame} {...stroke(LINE * 1.2)} />
    <svg x={92} y={352} width={896} height={656} viewBox="0 0 896 656" overflow="hidden">
      <rect width={896} height={656} fill={C.screen} opacity={0.35 + 0.65 * light} />
      {children}
    </svg>
    {/* the projector beam from behind the audience, and the backs of heads */}
    <path d="M540 2100 L60 360 L1020 360 Z" fill={C.beam} opacity={0.06 + 0.02 * Math.sin(T * 9)} />
    {Array.from({ length: 8 }, (_, i) => <g key={i}><path d={wobRect(-10 + i * 140, 1640, 150, 300, 40, i, 2)} fill={C.velvetDeep} {...stroke(LINE)} /><ellipse cx={60 + i * 140} cy={1560 + (i % 2) * 20} rx={58} ry={64} fill={C.far} {...stroke(LINE * 0.7)} /></g>)}
  </g>
);

/* ===================================== the shots ===================================== */

/** 1 · 0.00 — The ticket window: the price slams down before anything else (the hook), he gulps, pays, beams. */
export const S01Booth: React.FC<ShotProps> = ({ t, T }) => {
  const out = tween(T, 0.0, 0.45, 1, 0, 'power3.out');           // the ticket slides out of the slot
  const pay = tween(T, 2.0, 2.4, 0, 1, 'power2.inOut'), take = tween(T, 2.85, 3.25, 0, 1, 'power2.inOut');
  const lift = tween(T, 3.25, 3.75, 0, 1, 'back.out(1.6)');
  const onCounter: [number, number] = [540, 1600 + out * 140];
  const up: [number, number] = [705, 1185];
  const expr = xTrack(s30(T), [[0, 'neutral'], [s30(0.3), 'surprised'], [s30(B.price + 0.2), X.gulp], [s30(2.6), 'determined'], [s30(3.35), 'laugh']]);
  return (
    <Frame T={T} bg={C.wall} start={{ cx: 540, cy: 1250, zoom: 1.12 }} moves={[{ at: 0, dur: 0.55, cx: 540, cy: 1450, zoom: 1.45, ease: 'power3.out' }, { at: 1.9, dur: 1.2, cx: 540, cy: 1200, zoom: 1.08 }, { at: 3.3, dur: 0.9, cx: 570, cy: 1290, zoom: 1.25, ease: 'power2.out' }]}>
      <rect x={-600} y={-600} width={2300} height={3200} fill={C.wall} />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${-500 + i * 180} -600 L${-500 + i * 180} 2600`} {...stroke(12, C.wallLine)} opacity={0.6} />)}
      {/* the lobby behind him: tonight's film poster */}
      <path d={wobRect(690, 560, 320, 460, 10, 6, 4)} fill={C.lilac} {...stroke(LINE)} />
      <text x={850} y={650} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={900} fontSize={46} fill={INK}>الوحش الرهيب</text>
      <g transform="translate(860 980) scale(0.45)"><Dino T={T} /></g>
      <Hero x={540} y={1880} s={1.5} T={t} expr={expr} look={take > 0.5 ? [0.2, -0.25] : [0, 0.8]} pose={P({ tilt: take > 0.5 ? -6 : 6, lean: pay > 0 && take < 0.5 ? 6 : 0 })}
        handL={pay > 0 && take < 0.6 ? [lerp(440, 500, pay), lerp(1640, 1530, pay)] : null}
        holdL={pay > 0 && pay < 1 ? <g transform="rotate(-10)">{[0, 1].map((i) => <path key={i} d={wobRect(-56, -24 + i * 10, 112, 56, 8, 3 + i, 2)} fill={C.mint} {...stroke(LINE * 0.6)} />)}</g> : undefined}
        handR={take > 0 ? [lerp(onCounter[0], up[0], lift), lerp(onCounter[1] - 20, up[1], lift)] : null}
        holdR={take >= 1 ? <g transform={`scale(${0.5 + lift * 0.12}) rotate(${-8 + lift * 4})`}><Ticket glow={lift} /></g> : undefined} />
      {/* we are inside the booth: its counter and the glass frame */}
      <rect x={-600} y={1520} width={2300} height={1200} fill={C.velvetDeep} />
      <path d="M-600 1520 L1700 1520" {...stroke(LINE * 1.4)} />
      <path d="M390 1520 Q540 1478 690 1520" fill={C.far} {...stroke(LINE)} />
      <path d={wobRect(-30, 300, 1140, 1230, 24, 2, 4)} fill="none" {...stroke(54, C.velvet)} />
      {take < 1 && <g transform={`translate(${onCounter[0]} ${onCounter[1]}) scale(1.0)`}><Ticket /></g>}
      {/* the clerk's sleeve and hand, pushing the ticket across */}
      {take < 1 && <g transform={`translate(${700 + out * 40} ${1700 + out * 60})`}><path d="M0 0 L260 230" {...stroke(96, C.tealDeep)} /><path d="M0 0 L260 230" {...stroke(82, C.teal)} /><circle cx={-6} cy={-6} r={40} fill={C.paper} {...stroke(LINE * 0.8)} /></g>}
    </Frame>
  );
};

/** 2 · ~4.2 — The film starts: the title card, then a cardboard dinosaur wobbling on strings, a boom mic dips in. */
export const S02Film: React.FC<ShotProps & { t0: number }> = ({ t, T }) => {
  const card = tween(t, 0.9, 1.2, 1, 0);
  return (
    <Frame T={T} bg={C.night} start={{ cx: 540, cy: 1000, zoom: 1.0 }} moves={[{ at: 0, dur: 2.2, cx: 540, cy: 760, zoom: 1.28, ease: 'sine.inOut' }]}>
      <ScreenRoom T={T}>
        {card > 0 && <g opacity={card}><rect width={896} height={656} fill={C.frame} /><text x={448} y={360} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={900} fontSize={96} fill={C.lilac}>الوحش الرهيب</text></g>}
        <g transform={`translate(${tween(t, 0.9, 1.9, 980, 520, 'power1.out')} 610)`} opacity={1 - card}><Dino T={T} /></g>
        <g transform={`translate(${300} ${tween(t, 1.4, 1.8, -80, 60, 'back.out(1.5)')})`}><path d="M0 -400 L0 0" {...stroke(8, INK)} /><ellipse cx={0} cy={20} rx={46} ry={24} fill={C.far} {...stroke(LINE * 0.6)} /></g>
      </ScreenRoom>
    </Frame>
  );
};

/** 3 · ~6.2 — His face: excited… then «سيئ». */
export const S03Face: React.FC<ShotProps> = ({ t, T }) => {
  const expr = xTrack(s30(T), [[0, 'satisfied'], [s30(B.bad - 0.6), 'skeptical'], [s30(B.bad), 'tired']]);
  return (
    <Frame T={T} bg={C.wall} start={{ cx: 560, cy: 1430, zoom: 1.75 }} moves={[{ at: 0, dur: 2.2, cx: 560, cy: 1420, zoom: 1.9, ease: 'sine.inOut' }]}>
      <Hall T={T} back={[{ who: 'n1', i: 0 }, { who: 'n2', i: 1 }, { who: 'n3', i: 3 }, { who: 'n4', i: 4 }]} tintK={0.14}>
        <Hero {...SEATED} T={t} sit={1} expr={expr} look={[0, -0.35]} pose={P({ tilt: tween(T, B.bad, B.bad + 0.4, 0, 7) })}
          handL={restL} holdL={<g transform="scale(0.55)"><Popcorn level={1} /></g>} handR={restR} holdR={<g transform="scale(0.32) rotate(-20)"><Ticket /></g>} />
      </Hall>
    </Frame>
  );
};

/** 4 · ~8.25 — «سيئ جدًا»: the dinosaur's head falls off; a stagehand's hand reaches in to put it back. */
export const S04Head: React.FC<ShotProps> = ({ t, T }) => (
  <Frame T={T} bg={C.night} start={{ cx: 540, cy: 720, zoom: 1.3 }} moves={[{ at: 0.2, dur: 0.3, cx: 560, cy: 760, zoom: 1.45, ease: 'power3.out' }]}>
    <ScreenRoom T={T}>
      <g transform="translate(520 610)"><Dino T={T} headOff={tween(t, 0.25, 0.75, 0, 1, 'bounce.out')} /></g>
      <g transform={`translate(${tween(t, 1.0, 1.5, 1000, 820, 'power2.out')} 420)`}><path d="M0 0 L240 -60" {...stroke(60, C.far)} /><circle cx={0} cy={0} r={34} fill={C.paper} {...stroke(LINE * 0.8)} /></g>
    </ScreenRoom>
  </Frame>
);

/** 5 · ~9.9 — The dilemma: he looks at the exit, half rises… looks at the ticket… and sits back down. */
export const S05Dilemma: React.FC<ShotProps & { t0: number }> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const rise = Math.min(tween(T, B.exit - 0.1, B.exit + 0.6, 0, 0.5, 'power2.out'), tween(T, B.sit, B.sit + 0.5, 0.5, 0, 'back.out(2)') + (T < B.sit ? 0.5 : 0) - (T < B.sit ? 0 : 0));
  const sit = 1 - (T < B.sit ? rise : tween(T, B.sit, B.sit + 0.45, 0.5, 0, 'bounce.out'));
  const tk = tween(T, B.ticket - 0.35, B.ticket + 0.15, 0, 1, 'power2.out') * tween(T, B.sit - 0.2, B.sit + 0.3, 1, 0);
  const look = vecTrack(s30(T), [[0, [0, -0.35]], [s30(B.exit - 0.2), [-1, -0.7]], [s30(B.ticket - 0.4), [0.35, 0.75]], [s30(B.sit + 0.4), [0, -0.35]]]);
  const expr = xTrack(s30(T), [[0, 'tired'], [s30(B.exit - 0.1), 'curious'], [s30(B.ticket - 0.2), X.torn], [s30(B.sit + 0.1), X.sigh]]);
  return (
    <Frame T={T} bg={C.wall} start={{ cx: 560, cy: 1380, zoom: 1.3 }} moves={[
      { at: L(B.exit - 0.3), dur: 0.9, cx: 330, cy: 1000, zoom: 1.05, ease: 'power2.inOut' },
      { at: L(B.ticket - 0.5), dur: 0.8, cx: 640, cy: 1440, zoom: 1.8, ease: 'power3.inOut' },
      { at: L(B.sit), dur: 0.9, cx: 560, cy: 1360, zoom: 1.22, ease: 'power2.out' },
    ]}>
      <Hall T={T} back={[{ who: 'n1', i: 0 }, { who: 'n2', i: 1 }, { who: 'n3', i: 3 }, { who: 'n4', i: 4 }]} exitGlow={tween(T, B.exit - 0.2, B.exit + 0.3, 0, 1) * tween(T, B.ticket - 0.5, B.ticket, 1, 0.2)}>
        <Hero {...SEATED} T={t} sit={sit} expr={expr} look={look} pose={P({ lean: 10 * (1 - sit), tilt: T > B.sit ? 8 : 0, squash: T > B.sit ? 0.04 * tween(T, B.sit, B.sit + 0.3, 1, 0.3) : 0 })}
          handL={[restL[0], restL[1] - (1 - sit) * 70]} holdL={<g transform="scale(0.55)"><Popcorn level={0.95} /></g>}
          handR={[lerp(restR[0], 695, tk), lerp(restR[1] - (1 - sit) * 70, 1400, tk)]} holdR={<g transform={`scale(${0.32 + 0.18 * tk}) rotate(${-20 + 20 * tk})`}><Ticket glow={tk} /></g>} />
      </Hall>
    </Frame>
  );
};

/** 6 · ~16.4 — Time passes: the clock spins, the popcorn empties, the stubble grows, the row empties one by one. */
export const S06Time: React.FC<ShotProps & { t0: number }> = ({ t, T }) => {
  const turns = tween(T, B.hour1 - 0.3, B.dino - 0.2, 0, 2.2, 'power1.in');
  const pop = tween(T, B.popcorn - 0.3, B.popcorn + 0.6, 0.95, 0, 'power1.inOut');
  const grow = tween(T, B.hour1, B.dino, 0, 1);
  return (
    <Frame T={T} bg={C.wall} start={{ cx: 560, cy: 1240, zoom: 1.0 }} moves={[{ at: 0, dur: 5.2, cx: 560, cy: 1300, zoom: 1.12, ease: 'sine.inOut' }]}>
      <Hall T={T} clockTurns={turns} back={[{ who: 'n1', i: 0, leave: B.people }, { who: 'n2', i: 1, leave: B.people + 0.55 }, { who: 'n3', i: 3, leave: B.people + 1.05 }, { who: 'n4', i: 4, leave: B.people + 1.5 }]}
        left={{ sleep: T > B.hour2 }}>
        <Hero {...SEATED} T={t} sit={1} stubble={grow * 0.7} mess={grow * 0.6} expr={xTrack(s30(T), [[0, X.sigh], [s30(B.popcorn), 'disgusted'], [s30(B.people), 'tired']])}
          look={vecTrack(s30(T), [[0, [0, -0.35]], [s30(B.hour1), [0.9, -0.9]], [s30(B.popcorn - 0.2), [-0.4, 0.8]], [s30(B.people), [0, -0.4]]])}
          pose={P({ tilt: 9, lean: 4, squash: 0.03 })} handL={restL} holdL={<g transform="scale(0.55)"><Popcorn level={pop} /></g>} handR={restR} holdR={<g transform="scale(0.32) rotate(-20)"><Ticket /></g>} />
      </Hall>
    </Frame>
  );
};

/** 7 · ~21.6 — «والديناصور؟ صار يغني»: a singing dinosaur, a disco beam, notes in the air. */
export const S07Sing: React.FC<ShotProps> = ({ t, T }) => {
  const sing = tween(T, B.sing - 0.3, B.sing, 0, 1);
  return (
    <Frame T={T} bg={C.night} start={{ cx: 540, cy: 690, zoom: 1.38 }} moves={[{ at: 0, dur: 2.8, cx: 540, cy: 680, zoom: 1.5, ease: 'sine.inOut' }]}>
      <ScreenRoom T={T}>
        {[0, 1, 2].map((i) => <path key={i} d="M448 -40 L300 700 L596 700 Z" fill={[C.velvetHi, C.teal, C.lilacDeep][i]} opacity={0.22 * sing} transform={`rotate(${Math.sin(T * 2 + i * 2.1) * 40} 448 -40)`} />)}
        <g transform={`translate(470 610) rotate(${Math.sin(T * 6) * 4 * sing})`}><Dino T={T} sing={sing} /></g>
        <Notes T={T} x={600} y={330} on={sing} />
      </ScreenRoom>
    </Frame>
  );
};

/** 8 · ~24.5 — Alone in the hall. «ليش؟» — he hugs the ticket: «دفعت…». */
export const S08Alone: React.FC<ShotProps & { t0: number }> = ({ t, T, t0 }) => {
  const hug = tween(T, B.paid - 0.2, B.paid + 0.35, 0, 1, 'back.out(1.8)');
  return (
    <Frame T={T} bg={C.wall} start={{ cx: 560, cy: 1300, zoom: 1.15 }} moves={[{ at: 0, dur: 1.2, cx: 560, cy: 1300, zoom: 1.2 }, { at: B.why - t0 - 0.2, dur: 0.9, cx: 570, cy: 1430, zoom: 1.85, ease: 'power3.inOut' }]}>
      <Hall T={T} back={[]} left={null} clockTurns={2.2 + t * 0.05} tintK={0.12}>
        <Hero {...SEATED} T={t} sit={1} stubble={0.7} mess={0.6} expr={xTrack(s30(T), [[0, 'tired'], [s30(B.why), 'skeptical'], [s30(B.paid), X.stubborn]])}
          look={vecTrack(s30(T), [[0, [0, -0.4]], [s30(B.why - 0.1), [0.15, 0.1]], [s30(B.paid), [0, 0.2]]])}
          pose={P({ tilt: lerp(9, -3, hug), lean: lerp(4, -2, hug) })} handL={restL} holdL={<g transform="scale(0.55)"><Popcorn level={0} /></g>}
          handR={[lerp(restR[0], 562, hug), lerp(restR[1], fy - 118, hug)]} holdR={<g transform={`scale(${0.32 + 0.08 * hug}) rotate(${-20 + 12 * hug})`}><Ticket glow={hug * 0.6} /></g>} />
      </Hall>
    </Frame>
  );
};

/* ---------------- the tank: what was paid sinks, whichever door you take ---------------- */

const SURFACE = 760;
const SINK = 'M540 380 C540 560 540 700 548 770 C600 900 470 1040 560 1180 C640 1320 470 1460 540 1640';
const Tank: React.FC<{ T: number; doorL: number; doorR: number; children?: React.ReactNode }> = ({ T, doorL, doorR, children }) => (
  <g>
    <rect x={-600} y={-600} width={2300} height={3200} fill={C.night} />
    {/* the floor you stand on: two doors */}
    <rect x={-600} y={SURFACE - 40} width={2300} height={40} fill={C.velvetDeep} />
    {[[270, doorL, 'تقعد'], [810, doorR, 'تطلع']].map(([x, g, label], i) => (
      <g key={i} transform={`translate(${x} ${SURFACE - 40})`}>
        <ellipse cx={0} cy={-170} rx={170} ry={210} fill={C.teal} opacity={0.12 + 0.35 * (g as number)} />
        <path d={wobRect(-95, -330, 190, 330, 10, i + 3, 3)} fill={i ? C.far : C.velvet} {...stroke(LINE)} />
        {i === 0 ? <path d="M-50 -60 L-50 -170 Q0 -200 50 -170 L50 -60 M-62 -60 L62 -60" fill="none" {...stroke(LINE, C.mint)} /> : <path d="M-60 -20 L-60 -300 L40 -280 L40 -20 Z" fill={C.tealDeep} {...stroke(LINE * 0.8)} />}
        <text x={0} y={-370} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={900} fontSize={64} fill={C.mint}>{label as string}</text>
      </g>
    ))}
    {/* the water under the floor and the seabed */}
    <path d={`${waveTop(-600, 1700, SURFACE + 20, T, 8)} L1700 2600 L-600 2600 Z`} fill={C.water} />
    <path d={`M-600 1700 Q540 1620 1700 1700 L1700 2600 L-600 2600 Z`} fill={C.waterDeep} />
    {Array.from({ length: 7 }, (_, i) => <circle key={i} cx={120 + i * 150} cy={1200 + ((T * 60 + i * 90) % 500) * -1 + 400} r={6 + (i % 3) * 3} fill={C.waterHi} opacity={0.35} />)}
    {children}
  </g>
);

/** 9 · ~29.3 — «الفلوس راحت»: the ticket drops into the water and sinks. Either door — it is still at the bottom. */
export const S09Sunk: React.FC<ShotProps & { t0: number }> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const p = tween(T, B.gone - 0.2, B.ifSit - 0.1, 0, 1, 'power1.inOut');
  const at = alongPath(SINK, p);
  const splash = tween(T, B.gone + 0.1, B.gone + 0.9, 0, 1, 'power2.out');
  const lineL = tween(T, B.ifSit, B.ifSit + 0.6, 0, 1, 'power2.inOut'), lineR = tween(T, B.ifLeave, B.ifLeave + 0.6, 0, 1, 'power2.inOut');
  return (
    <Frame T={T} bg={C.night} start={{ cx: 540, cy: 760, zoom: 1.12 }} moves={[
      { at: L(B.gone), dur: 1.2, cx: 540, cy: 1220, zoom: 1.0, ease: 'power2.inOut' },
      { at: L(B.ifSit - 0.2), dur: 1.0, cx: 540, cy: 1060, zoom: 0.88, ease: 'power2.inOut' },
      { at: L(B.name - 0.3), dur: 2.0, cx: 540, cy: 990, zoom: 0.9, ease: 'sine.inOut' },
    ]} overlay={<Pill t={T} from={B.name} to={99} text="مغالطة التكلفة الغارقة" top={1150} size={60} bg={C.velvet} />}>
      <Tank T={T} doorL={tween(T, B.ifSit, B.ifSit + 0.3, 0, 1) * tween(T, B.ifLeave, B.ifLeave + 0.3, 1, 0.5)} doorR={tween(T, B.ifLeave, B.ifLeave + 0.3, 0, 1)}>
        {[0, 1, 2].map((i) => <ellipse key={i} cx={548} cy={SURFACE + 20} rx={40 + splash * (120 + i * 70)} ry={10 + splash * (16 + i * 8)} fill="none" {...stroke(5, C.waterHi)} opacity={(1 - splash) * 0.9} />)}
        <DrawPath d="M270 720 C270 1100 460 1500 520 1610" p={lineL} stroke={C.mint} strokeWidth={8} />
        <DrawPath d="M810 720 C810 1100 620 1500 560 1610" p={lineR} stroke={C.mint} strokeWidth={8} />
        <g transform={`translate(${at.x} ${at.y}) rotate(${Math.sin(T * 3) * 18 * (1 - p) + (p >= 1 ? 8 : 0)}) scale(0.95)`} opacity={T < B.gone - 0.2 ? 0 : 1}><Ticket /></g>
      </Tank>
    </Frame>
  );
};

/** 10 · ~37.1 — «فلوس، أو وقت، أو تعب»: three more things fall in and settle next to the ticket. */
const Bills: React.FC = () => <g>{[0, 1, 2].map((i) => <path key={i} d={wobRect(-80, -50 + i * 14, 160, 70, 8, i + 2, 2)} fill={C.mint} {...stroke(LINE * 0.7)} transform={`rotate(${(i - 1) * 6})`} />)}<circle cx={0} cy={0} r={22} fill="none" {...stroke(5, C.tealDeep)} /></g>;
const Hourglass: React.FC = () => <g><path d="M-55 -80 L55 -80 L0 0 L55 80 L-55 80 L0 0 Z" fill={C.mint} {...stroke(LINE)} /><path d="M-30 60 L30 60 L0 30 Z" fill={C.lilacDeep} /><path d="M-65 -80 L65 -80 M-65 80 L65 80" {...stroke(LINE * 1.6)} /></g>;
const Drop: React.FC = () => <g><path d="M0 -90 C30 -40 60 0 60 30 C60 70 30 92 0 92 C-30 92 -60 70 -60 30 C-60 0 -30 -40 0 -90 Z" fill={C.waterHi} {...stroke(LINE)} /><path d="M-24 30 Q-24 60 4 66" fill="none" {...stroke(5, C.mint)} /></g>;
export const S10Three: React.FC<ShotProps & { t0: number }> = ({ t, T }) => {
  const items: Array<[number, number, React.ReactNode, string]> = [[B.money, 300, <Bills key="b" />, 'فلوس'], [B.time, 790, <Hourglass key="h" />, 'وقت'], [B.effort, 540, <Drop key="d" />, 'تعب']];
  return (
    <Frame T={T} bg={C.night} start={{ cx: 540, cy: 990, zoom: 0.9 }} moves={[{ at: 0, dur: 6, cx: 540, cy: 1100, zoom: 0.95, ease: 'sine.inOut' }]}
      overlay={<>{items.map(([at, x, , label], i) => <Pill key={i} t={T} from={at + 0.75} to={99} text={label} top={1610 - (i === 2 ? 80 : 0)} left={x - 150} width={300} size={52} bg={C.velvet} />)}</>}>
      <Tank T={T} doorL={0.3} doorR={0.3}>
        <g transform="translate(540 1640) scale(0.95)"><Ticket /></g>
        {items.map(([at, x, node], i) => {
          const p = tween(T, at - 0.3, at + 0.75, 0, 1, 'power2.in');
          const y = lerp(300, 1560 - (i === 2 ? 80 : 0), p);
          return <g key={i} transform={`translate(${x + Math.sin(p * 9) * 30 * (1 - p)} ${y}) rotate(${(1 - p) * 30 * (i - 1)}) scale(0.9)`} opacity={T > at - 0.3 ? 1 : 0}>{node}</g>;
        })}
      </Tank>
    </Frame>
  );
};

/** 11 · ~43.2 — Arkes & Blumer (1985), Experiment 2: tickets used in the first five plays, by price paid. */
const Stub: React.FC<{ c: string }> = ({ c }) => <path d="M-70 -22 L70 -22 L70 -8 A8 8 0 0 0 70 8 L70 22 L-70 22 L-70 8 A8 8 0 0 0 -70 -8 Z" fill={c} {...stroke(LINE * 0.6)} />;
export const S11Study: React.FC<ShotProps & { t0: number }> = ({ t, T }) => {
  const cols: Array<[number, number, string, string]> = [[810, 4.11, 'سعر كامل', C.velvet], [540, 3.32, 'خصم 2 دولار', C.lilacDeep], [270, 3.29, 'خصم 7 دولار', C.tealDeep]];
  const grow = (i: number) => tween(T, B.full - 0.2 + i * 0.35, B.more + 0.3 + i * 0.3, 0, 1, 'power2.out');
  return (
    <Frame T={T} bg={C.night} start={{ cx: 540, cy: 1060, zoom: 1.0 }} moves={[{ at: 0, dur: 2.4, cx: 540, cy: 1180, zoom: 1.2, ease: 'power2.inOut' }, { at: 2.6, dur: 5, cx: 540, cy: 1200, zoom: 1.28, ease: 'sine.inOut' }]}
      overlay={<>
        <Pill t={T} from={B.study - 0.1} to={99} text="آركس وبلومر، 1985" top={250} size={50} weight={800} bg="rgba(20,16,36,0.88)" />
        <Pill t={T} from={B.six - 0.1} to={99} text="تذاكر مستعملة · أول 5 عروض" top={1480} size={46} weight={800} bg={C.velvetDeep} />
      </>}>
      <rect x={-600} y={-600} width={2300} height={3200} fill={C.night} />
      {/* a stage with velvet curtains */}
      <path d="M-200 360 Q540 470 1280 360 L1280 300 L-200 300 Z" fill={C.velvet} {...stroke(LINE)} />
      <path d="M-200 300 L120 300 Q60 900 160 1440 L-200 1440 Z M1280 300 L960 300 Q1020 900 920 1440 L1280 1440 Z" fill={C.velvet} {...stroke(LINE)} />
      <rect x={-200} y={1440} width={1480} height={60} fill={C.velvetDeep} {...stroke(LINE)} />
      {cols.map(([x, v, label, c], i) => {
        const g = grow(i), n = v * g, full = Math.floor(n), part = n - full;
        return (
          <g key={i}>
            {Array.from({ length: full }, (_, k) => <g key={k} transform={`translate(${x} ${1410 - k * 50})`}><Stub c={c} /></g>)}
            {part > 0.02 && <g transform={`translate(${x} ${1410 - full * 50}) scale(1 ${part})`}><Stub c={c} /></g>}
            <text x={x} y={1390 - v * 50 - 30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={64} fill={C.mint} opacity={tween(g, 0.85, 1, 0, 1)}>{v.toFixed(2)}</text>
            <text x={x} y={1500} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={800} fontSize={40} fill={C.mint} opacity={tween(T, B.study + i * 0.25, B.study + 0.3 + i * 0.25, 0, 1)}>{label}</text>
            {/* a season-ticket buyer next to each column, ticket held up */}
            <g opacity={tween(T, B.study + i * 0.25, B.study + 0.3 + i * 0.25, 0, 1)}>
              <Neighbour who={(['n1', 'n2', 'n3'] as const)[i]} x={x + 112} y={1440} s={0.4} T={T} sit={0} seed={i * 5 + 2} expr={i === 0 ? 'satisfied' : 'curious'} pose={POSES.holdUp as Pose} look={[-0.5, -0.3]} />
              <g transform={`translate(${handAt(sitBuild(NEIGHBOURS[(['n1', 'n2', 'n3'] as const)[i]], 0), POSES.holdUp as Pose, 1, { x: x + 112, y: 1440, s: 0.4, facing: 1 }).join(' ')}) scale(0.32) rotate(-12)`}><Ticket /></g>
            </g>
          </g>
        );
      })}
    </Frame>
  );
};

/** 12 · ~51.4 — «أفلام سيئة كثيرة تنشاف لآخرها»: six little cinemas, six lone viewers, six «النهاية». */
export const S12Grid: React.FC<ShotProps & { t0: number }> = ({ t, T }) => {
  const scope = useGsapTimeline<SVGGElement>(({ timeline, selector }) => {
    for (let i = 0; i < 6; i++) popIn(timeline, selector(`[data-cell="${i}"]`), (B.films - (T - t)) - 0.3 + i * 0.18, { dur: 0.45, svgOrigin: `${i % 2 ? 790 : 290} ${470 + Math.floor(i / 2) * 430}` });
  });
  const tints = [C.n1, C.n2, C.n3, C.n4, C.n5, C.hero];
  return (
    <Frame T={T} bg={C.night} start={{ cx: 540, cy: 980, zoom: 1.0 }} moves={[{ at: 0, dur: 5.8, cx: 540, cy: 960, zoom: 1.06, ease: 'sine.inOut' }]}
      overlay={<Pill t={T} from={B.researchers - 0.1} to={99} text="آركس وبلومر، 1985" top={250} size={46} weight={800} />}>
      <rect x={-600} y={-600} width={2300} height={3200} fill={C.night} />
      <g ref={scope}>
        {Array.from({ length: 6 }, (_, i) => {
          const cx = i % 2 ? 790 : 290, cy = 470 + Math.floor(i / 2) * 430;
          const yawn = Math.max(0, Math.sin(T * 1.7 + i * 1.3));
          return (
            <g key={i} data-cell={i} style={{ opacity: 0 }}>
              <path d={wobRect(cx - 220, cy - 180, 440, 360, 16, i, 3)} fill={C.wall} {...stroke(LINE)} />
              <rect x={cx - 170} y={cy - 150} width={340} height={150} fill={C.screen} />
              <text x={cx} y={cy - 58} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={900} fontSize={54} fill={INK}>النهاية</text>
              <ellipse cx={cx} cy={cy + 150} rx={60} ry={20} fill={C.velvetDeep} />
              <circle cx={cx} cy={cy + 70} r={46} fill={C.paper} {...stroke(LINE * 0.7)} />
              <path d={`M${cx - 50} ${cy + 110} Q${cx} ${cy + 96} ${cx + 50} ${cy + 110} L${cx + 56} ${cy + 170} L${cx - 56} ${cy + 170} Z`} fill={tints[i]} {...stroke(LINE * 0.7)} />
              <path d={`M${cx - 18} ${cy + 64} q8 ${-6 + yawn * 4} 14 0 M${cx + 6} ${cy + 64} q8 ${-6 + yawn * 4} 14 0`} fill="none" {...stroke(4)} />
              <ellipse cx={cx + 2} cy={cy + 90} rx={8 + yawn * 4} ry={4 + yawn * 12} fill={INK} />
            </g>
          );
        })}
      </g>
    </Frame>
  );
};

/** 13 · ~57.2 — The honest part: if the film got better — stay (thumbs up). Stay for the next hour, not the ticket.
 *  He looks at the clock, then the ticket, pockets it, and stands up. */
export const S13Choice: React.FC<ShotProps & { t0: number }> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const dream = tween(T, B.better - 0.4, B.better + 0.2, 0, 1) * tween(T, B.next - 0.4, B.next, 1, 0);
  const stand = tween(T, B.notTicket + 0.55, B.notTicket + 1.15, 0, 1, 'power2.out');
  const crouch = tween(T, B.notTicket + 0.3, B.notTicket + 0.55, 0, 1) * (1 - stand);
  const pocket = tween(T, B.notTicket - 0.1, B.notTicket + 0.4, 0, 1, 'power2.inOut');
  const pose = poseTrack(s30(T), [[0, P({ tilt: 8, lean: 4 })], [s30(B.better - 0.2), P({ ...POSES.thumbsUp, tilt: -4 })], [s30(B.next - 0.2), P({ tilt: -6 })], [s30(B.notTicket + 0.3), P({ lean: 14, squash: 0.06 })], [s30(B.notTicket + 0.8), P({ lean: -2, tilt: -4 })]], 8);
  const look = vecTrack(s30(T), [[0, [0, -0.4]], [s30(B.better - 0.3), [0, -0.6]], [s30(B.next - 0.2), [0.95, -0.95]], [s30(B.notTicket - 0.3), [0.35, 0.7]], [s30(B.notTicket + 0.5), [-0.6, -0.3]]]);
  const expr = xTrack(s30(T), [[0, 'tired'], [s30(B.better - 0.2), 'laugh'], [s30(B.next - 0.2), 'curious'], [s30(B.notTicket), 'determined']]);
  return (
    <Frame T={T} bg={C.wall} start={{ cx: 560, cy: 1300, zoom: 1.32 }} moves={[
      { at: L(B.better - 0.3), dur: 0.8, cx: 560, cy: 1240, zoom: 1.2, ease: 'power2.out' },
      { at: L(B.next - 0.3), dur: 0.9, cx: 760, cy: 1000, zoom: 1.12, ease: 'power2.inOut' },
      { at: L(B.notTicket - 0.4), dur: 0.8, cx: 580, cy: 1380, zoom: 1.45, ease: 'power3.inOut' },
      { at: L(B.notTicket + 0.6), dur: 1.0, cx: 540, cy: 1200, zoom: 1.1, ease: 'power2.out' },
    ]}>
      <Hall T={T} back={[]} left={null} clockTurns={2.25 + Math.max(0, T - B.next) * 0.25} tint={dream > 0 ? C.velvetHi : C.screen} tintK={0.12 + dream * 0.25}>
        {dream > 0 && <g opacity={dream}>{Array.from({ length: 10 }, (_, i) => <path key={i} d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z" fill={C.mint} transform={`translate(${200 + i * 80} ${980 + Math.sin(T * 3 + i) * 60}) scale(${1 + Math.sin(T * 5 + i) * 0.4})`} />)}</g>}
        <Hero {...SEATED} T={t} sit={1 - stand} stubble={0.7} mess={0.6} expr={expr} look={look} pose={{ ...pose, squash: pose.squash + crouch * 0.05 }}
          handL={stand > 0.2 ? null : restL} holdL={stand > 0.2 ? undefined : <g transform="scale(0.55)"><Popcorn level={0} /></g>}
          handR={pocket > 0 && pocket < 1 ? [lerp(restR[0], FRONT.hero + 60, pocket), lerp(restR[1], fy - 60, pocket)] : dream > 0.5 ? null : pocket >= 1 ? null : restR}
          holdR={pocket < 0.95 && dream < 0.5 ? <g transform={`scale(${0.32 * (1 - pocket * 0.6)}) rotate(-20)`}><Ticket /></g> : undefined} />
      </Hall>
    </Frame>
  );
};

/* ---------------- outside: the night street ---------------- */

const Street: React.FC<{ T: number; children?: React.ReactNode }> = ({ T, children }) => (
  <g>
    <rect x={-600} y={-600} width={2300} height={3200} fill={C.street} />
    {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 197) % 1700 - 300} cy={(i * 131) % 700 - 200} r={2 + (i % 3)} fill={C.star} opacity={0.5 + 0.5 * Math.sin(T * 2 + i)} />)}
    {[[-260, 420, 300], [60, 300, 260], [880, 360, 320], [1180, 460, 260]].map(([x, top, w], i) => (
      <g key={i}><rect x={x} y={top} width={w} height={1400} fill={C.streetDeep} {...stroke(LINE)} />
        {Array.from({ length: 12 }, (_, k) => <rect key={k} x={x + 40 + (k % 3) * (w / 3.4)} y={top + 60 + Math.floor(k / 3) * 120} width={46} height={64} fill={(k + i) % 3 ? C.waterHi : C.lilac} opacity={(k + i) % 4 ? 0.85 : 0.25} />)}</g>
    ))}
    {/* the cinema front: its exit door, the marquee */}
    <rect x={300} y={700} width={560} height={900} fill={C.wall} {...stroke(LINE)} />
    <path d={wobRect(320, 720, 520, 120, 16, 2, 3)} fill={C.velvet} {...stroke(LINE)} />
    <text x={580} y={808} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={900} fontSize={70} fill={C.mint}>سينما</text>
    <path d={wobRect(380, 1080, 200, 520, 8, 5, 3)} fill={C.far} {...stroke(LINE)} />
    <path d="M380 1600 L580 1600 L700 1800 L260 1800 Z" fill={C.teal} opacity={0.15} />
    <rect x={-600} y={1600} width={2300} height={1000} fill={C.streetDeep} />
    <path d="M-600 1600 L1700 1600" {...stroke(LINE * 1.3)} />
    {children}
  </g>
);

const Cafe: React.FC<{ T: number; wave: number; laugh: number }> = ({ T, wave, laugh }) => (
  <g>
    <path d={wobRect(820, 1420, 300, 30, 8, 3, 2)} fill={C.lilacDeep} {...stroke(LINE)} />
    <path d="M970 1450 L970 1600" {...stroke(LINE * 1.5)} />
    <Neighbour who="n2" x={900} y={1600} s={0.62} T={T} sit={0} seed={13} expr={laugh > 0.5 ? 'laugh' : 'satisfied'} look={[-0.7, 0]}
      pose={P({ armL: [lerp(8, 150, wave), lerp(6, 30, wave)], handL: 'open', tilt: Math.sin(T * 4) * 3 * laugh })} />
    <Neighbour who="n3" x={1060} y={1600} s={0.66} T={T} sit={0} seed={17} expr={laugh > 0.5 ? 'laugh' : 'curious'} look={[-0.8, 0]} facing={-1}
      pose={P({ tilt: Math.sin(T * 4 + 1) * 3 * laugh })} />
  </g>
);

/** 14 · ~65.5 — He walks out into the night, breathes, and his friends wave him over: two hours back. */
export const S14Out: React.FC<ShotProps & { t0: number }> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const x = keys(T, [[t0, 480], [t0 + 0.3, 480], [B.back + 0.6, 640, 'power1.inOut'], [B.twoHours - 0.2, 640], [B.twoHours + 1.3, 760, 'power1.inOut']]);
  const walking = (T > t0 + 0.3 && T < B.back + 0.6) || (T > B.twoHours - 0.2 && T < B.twoHours + 1.3);
  const breathe = tween(T, B.back + 0.6, B.back + 1.0, 0, 1) * tween(T, B.twoHours - 0.4, B.twoHours, 1, 0);
  const pose = walking ? walkPose((T - t0) * 1.7, 0.9) : P({ armL: [lerp(8, 150, breathe), 30], armR: [lerp(8, 150, breathe), 30], handL: 'open', handR: 'open', tilt: -8 * breathe, squash: -0.03 * breathe });
  return (
    <Frame T={T} bg={C.street} start={{ cx: 540, cy: 1200, zoom: 1.15 }} moves={[{ at: 0.4, dur: 2.2, cx: 620, cy: 1180, zoom: 1.0, ease: 'power2.inOut' }, { at: L(B.twoHours - 0.3), dur: 1.4, cx: 760, cy: 1220, zoom: 1.08, ease: 'power2.inOut' }]}>
      <Street T={T}>
        <Cafe T={T} wave={tween(T, B.twoHours - 0.5, B.twoHours, 0, 1) * (0.6 + 0.4 * Math.sin(T * 8))} laugh={0} />
        <Hero x={x} y={1640} s={0.82} T={t} stubble={0.7} mess={0.6} pose={pose} expr={xTrack(s30(T), [[0, 'determined'], [s30(B.back + 0.6), X.relief], [s30(B.twoHours), 'laugh']])}
          look={T > B.twoHours - 0.3 ? [0.9, -0.1] : [0.2, -0.3]} />
      </Street>
    </Frame>
  );
};

/** 15 · ~69.3 — With his friends at the table. The question; the closing card. */
export const S15Close: React.FC<ShotProps & { t0: number }> = ({ t, T }) => {
  const talk = Math.max(0, Math.sin(T * 6)) * 0.6;
  return (
    <Frame T={T} bg={C.street} start={{ cx: 860, cy: 1380, zoom: 1.45 }} moves={[{ at: 0, dur: 8, cx: 820, cy: 1330, zoom: 1.22, ease: 'sine.inOut' }]}
      overlay={<>
        <Pill t={T} from={B.q} to={99} text="لو بدأت اليوم من الصفر…" top={300} size={54} bg="rgba(20,16,36,0.88)" />
        <Pill t={T} from={B.q2} to={99} text="هل كنت ستختار الشيء نفسه؟" top={410} size={54} bg={C.velvet} />
        <EndCard t={T} from={B.cta + 0.2} accent={C.velvetHi} top={1600} />
      </>}>
      <Street T={T}>
        <Cafe T={T} wave={0} laugh={1} />
        <Hero x={770} y={1640} s={0.82} T={t} stubble={0.7} mess={0.6} expr={'laugh'} talk={talk} look={[0.6, 0]} pose={P({ tilt: Math.sin(T * 4) * 4, armR: [40, 60], handR: 'open' })} />
      </Street>
    </Frame>
  );
};
