import React from 'react';
import { Character } from '../kit/characters/Character';
import { CAST } from '../kit/characters/cast';
import { EXPRESSIONS, type Face } from '../kit/characters/face';
import { Hand } from '../kit/characters/hands';
import { POSES } from '../kit/characters/poses';
import { pose, walkPhase } from '../kit/characters/skeleton';
import { Bedroom, BEDROOM } from '../kit/places/Bedroom';
import { HomeLiving, HOME } from '../kit/places/HomeLiving';
import { MEETING } from '../kit/places/MeetingRoom';
import { Street } from '../kit/places/Street';
import { UnderTable } from '../kit/places/UnderTable';
import { Lake } from '../kit/metaphors/Lake';
import { Phone, ThoughtCloud } from '../kit/props';
import { INK, PAL, sketch } from '../kit/style';
import { Actor, Cap, CAM0, Paper, Say, Stage, ease, faceAt, k, mix, poseAt, toScreen, type Ctx } from '../film/engine';
import type { ShotRender } from '../film/Film';
import { ChestSwirl, Floor, MEET_FEET, MEET_S, Meeting, SEAT, WLabel, atTable, cam, nod, shake, walkTo, type SeatSpec } from './common';

// Chapter 1 «سليم في الاجتماع» and the start of chapter 2 «الشارع والبيت»: shots 1–20.
const STAND = MEETING.standAt; // the presenter's spot by the whiteboard
const face = (base: keyof typeof EXPRESSIONS, o: Partial<Face>): Face => ({ ...EXPRESSIONS[base], ...o });

/** The team during the presentation: everyone's chair turned toward the board (to the right). */
const team = (f: number, o: { look?: number; head?: number[]; faces?: (SeatSpec['face'])[] } = {}): (SeatSpec | null)[] => {
  const who = ['mona', 'att1', 'hadi', 'att2', 'jaser'] as const;
  return (who.map((w, i) => ({
    who: w,
    p: w === 'jaser' ? atTable({ lean: -6, head: -4 + (o.head?.[i] ?? 0), turn: 0.45 }) : atTable({ head: o.head?.[i] ?? 0, turn: 0.45 }),
    face: o.faces?.[i] ?? (w === 'jaser' ? 'smug' : 'listening'),
    hands: w === 'jaser' ? { R: 'relaxed' as const, L: 'relaxed' as const } : undefined,
  } as SeatSpec)) as (SeatSpec | null)[]).concat([null]);
};
/** Salim at the board: presenting, then pointing at the chart. */
const presenter = (c: Ctx, keys: Parameters<typeof poseAt>[1], faces: Parameters<typeof faceAt>[1], say?: [number, number]) => (
  <Actor f={c.f} seed={41} who="salim" pose={poseAt(c.f, keys)} face={faceAt(c.f, faces)} x={STAND.x} y={STAND.y} s={1.45} facing={-1} say={say} />
);
const pointBoard = { p: pose({ lean: -3, head: -12, turn: 0.85, L: { hand: [104, -318] }, R: { hand: [36, -150] } }), hands: { R: 'relaxed' as const, L: 'point' as const } };
const midGesture = { p: pose({ lean: 3, head: 2, turn: 0.4, R: { hand: [62, -186] }, L: { hand: [70, -172] } }), hands: { R: 'open' as const, L: 'cup' as const } };

/** A bent pen squeezed across a fist (hand frame units): `bend` 0..1. */
const BentPen: React.FC<{ bend: number }> = ({ bend }) => {
  const d = `M-30 0 Q0 ${bend * 9} 30 0`;
  return <g>
    <path d={d} stroke={INK} strokeWidth={8.4} fill="none" strokeLinecap="round" />
    <path d={d} stroke={PAL.focus} strokeWidth={5.4} fill="none" strokeLinecap="round" />
    <path d="M30 -2.2 L35 0 L30 2.2 Z" fill={INK} />
    <path d={`M-30 -3 L-36 -3 L-36 3 L-30 3`} fill={PAL.metal} stroke={INK} strokeWidth={1.4} />
  </g>;
};

/** A dark-edged paper vignette that pushes the room back and keeps one figure. */
const Vignette: React.FC<{ x: number; y: number; r: number; o: number; id: string }> = ({ x, y, r, o, id }) => (
  <g opacity={o}>
    <radialGradient id={id} cx={x} cy={y} r={r} gradientUnits="userSpaceOnUse"><stop offset="0.45" stopColor={PAL.paper} stopOpacity={0} /><stop offset="1" stopColor={PAL.paper} stopOpacity={0.92} /></radialGradient>
    <rect x={-400} y={-400} width={2720} height={1880} fill={`url(#${id})`} />
  </g>
);

/** The thought cloud with the meeting replaying inside: a tiny table and Jaser raising his finger (`raise` 0..1). */
const Replay: React.FC<{ x: number; y: number; s: number; raise: number; tail: [number, number]; o?: number }> = ({ x, y, s, raise, tail, o = 1 }) => o <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <ThoughtCloud w={500} h={330} tail={tail}>
      <g>
        <Character who="jaser" x={-80} y={150} s={0.62} facing={1} face="smug" p={pose({ sit: 1, lean: mix(-4, -10, raise), footR: [50, 0], footL: [62, 0], R: { hand: [58, -156] }, L: { hand: [mix(76, 92, raise), mix(-154, -262, raise)] } })} hands={{ R: 'relaxed', L: raise > 0.4 ? 'point' : 'relaxed' }} />
        <Character who="salim" x={110} y={150} s={0.62} facing={-1} face={raise > 0.5 ? 'surprised' : 'calm'} p={pose({ sit: 1, footR: [50, 0], footL: [62, 0], R: { hand: [58, -156] }, L: { hand: [76, -154] } })} />
        <rect x={-190} y={52} width={380} height={80} rx={8} fill={PAL.table} stroke={INK} strokeWidth={3.5} />
      </g>
    </ThoughtCloud>
  </g>
);

/** A rewind mark (an open circle with an arrow head) that spins once at each beat. */
const Rewind: React.FC<{ x: number; y: number; r: number; spin: number; o: number }> = ({ x, y, r, spin, o }) => o <= 0 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${-spin * 360})`} opacity={o}>
    <path d={`M${r} 0 A${r} ${r} 0 1 1 ${r * 0.3} ${-r * 0.95}`} fill="none" stroke={PAL.provoke} strokeWidth={9} strokeLinecap="round" />
    <path d={`M${r * 0.3 - 16} ${-r * 0.95 - 14} L${r * 0.3 + 4} ${-r * 0.95} L${r * 0.3 - 14} ${-r * 0.95 + 18}`} fill="none" stroke={PAL.provoke} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** Pedestrian signal on a pole: the standing figure lit in wine red. */
const WalkSignal: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <rect x={x - 7} y={y - 380} width={14} height={380} fill={PAL.chairDark} stroke={INK} strokeWidth={2.4} />
    <rect x={x - 42} y={y - 470} width={84} height={110} rx={12} fill={PAL.screen} stroke={INK} strokeWidth={3.6} />
    <circle cx={x} cy={y - 445} r={9} fill={PAL.provoke} />
    <path d={`M${x} ${y - 434} v32 M${x - 14} ${y - 420} h28 M${x} ${y - 402} l-9 22 M${x} ${y - 402} l9 22`} stroke={PAL.provoke} strokeWidth={7} strokeLinecap="round" />
  </g>
);
/** A car seen from the side, crossing the road. */
const Car: React.FC<{ x: number; y: number; color: string; dir?: 1 | -1 }> = ({ x, y, color, dir = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${dir} 1)`}>
    <path d="M-170 -20 Q-170 -62 -130 -66 L-80 -68 Q-50 -118 10 -118 L70 -118 Q110 -114 136 -70 L160 -64 Q178 -58 178 -30 L178 -14 L-170 -14 Z" fill={color} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M-62 -72 Q-38 -108 8 -108 L36 -108 L36 -72 Z M48 -108 L68 -108 Q98 -104 118 -72 L48 -72 Z" fill={PAL.screenGlow} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    {[-100, 112].map((wx) => <g key={wx}><circle cx={wx} cy={-12} r={30} fill={INK} /><circle cx={wx} cy={-12} r={13} fill={PAL.metal} /></g>)}
  </g>
);

export const SHOTS: Record<number, ShotRender> = {
  // 1 — the morning meeting: Salim presents, taps the chart on «فكرته»; Hadi nods.
  1: (c) => {
    const tap = c.at('فكرته');
    const hadiNod = nod(c.f, tap + 6, 2, 9);
    return <Stage cam={CAM0}>
      <Meeting f={c.f} seats={team(c.f, { head: [0, 0, hadiNod, 0, 0] })}
        front={presenter(c, [[0, 'explain'], [tap - 14, pointBoard, 14], [tap + 60, 'explain', 22]], [[0, 'smile'], [tap - 10, 'calm']], [0, tap - 4])} />
    </Stage>;
  },
  // 2 — Jaser leans back and lifts a finger on «قاطعه»; Salim's hand stops mid-gesture.
  2: (c) => {
    const cut = c.at('قاطعه'), q = c.at('لنكن');
    const cm = cam(1480, 560, 1.75);
    const jp = poseAt(c.f, [[0, { p: atTable({ lean: -6, head: -4, turn: 0.45 }) }], [cut - 6, { p: pose({ sit: 1, lean: -11, head: -8, turn: 0.6, footR: [50, 0], footL: [62, 0], R: { hand: [58, -156] }, L: { hand: [96, -262] } }), hands: { R: 'relaxed', L: 'point' } }, 12]]);
    const seats = team(c.f, { faces: ['listening', 'listening', 'listening', 'surprised', 'smug'] });
    seats[4] = null;
    const head = toScreen(cm, [SEAT[4] + 10, MEET_FEET - 420]);
    return <Stage cam={cm} over={<Say text="لن تنجح" to={head} above={10} o={c.p(c.at('هذه') - 4, 10)} size={58} />}>
      <Meeting f={c.f} seats={seats}
        extra={<Actor f={c.f} seed={13} who="jaser" pose={jp} face={faceAt(c.f, [[0, 'smug'], [cut, face('smug', { brow: 0.5, open: 0.8 })]])} x={SEAT[4]} y={MEET_FEET} s={MEET_S} facing={1} say={[q, c.sp[1]]} />}
        front={presenter(c, [[0, 'explain'], [16, midGesture, 22]], [[0, 'smile'], [cut + 4, 'surprised', 8], [cut + 50, face('surprised', { open2: 0.15, browY: 0.6 })]], [0, cut + 2])} />
    </Stage>;
  },
  // 3 — one laughs on «ضحك»; the rest look up from the table to Salim on «والتفت».
  3: (c) => {
    const laugh = c.at('ضحك'), turn = c.at('والتفت');
    const cm = cam(700, 500, 2.0);
    const look = (i: number) => k(c.f, [[turn + i * 4, 0], [turn + 14 + i * 4, 1]]);
    const seat = (i: number, w: 'mona' | 'att1' | 'hadi' | 'att2'): SeatSpec => {
      const l = look(i);
      if (w === 'att1') {
        const sh = shake(c.f, laugh, 90, 4.5, 1.1);
        return { who: w, p: atTable({ lean: -10 * Math.min(1, Math.max(0, (c.f - laugh) / 8)) * (1 - Math.min(1, Math.max(0, (c.f - laugh - 90) / 20))) + sh, bob: Math.abs(sh) * 1.6, head: -12 + sh * 2.5, turn: mix(0.45, 0.7, l) }), face: faceAt(c.f, [[0, 'neutral'], [laugh - 2, face('smile', { open2: 0.85, squint: 0.8, mouth: 1 }), 6], [laugh + 80, 'smug', 18]]) };
      }
      return { who: w, p: atTable({ head: mix(22, -4, l), turn: mix(0.2, 0.85, l) }), face: { ...EXPRESSIONS.listening, open: mix(0.75, 1.05, l), look: [mix(0, 1, l), mix(1, -0.1, l)] } };
    };
    return <Stage cam={cm}>
      <Meeting f={c.f} seats={[seat(0, 'mona'), seat(1, 'att1'), seat(2, 'hadi'), seat(3, 'att2'), { who: 'jaser', p: atTable({ lean: -6, head: -4, turn: 0.5 }), face: 'smug' }, null]} />
    </Stage>;
  },
  // 4 — Salim smiles on «ابتسم», walks back and sits on «وجلس», presses his lips on «ولم».
  4: (c) => {
    const sm = c.at('ابتسم'), sit = c.at('وجلس'), lips = c.at('ولم');
    const f0 = sit - 34, f1 = sit + 16;
    const w = walkTo(c.f, f0, f1, STAND.x, SEAT[5], 1.38);
    const seated = c.f > f1;
    const pz = seated ? poseAt(c.f, [[f1, { p: w.p }], [f1 + 1, { p: atTable({ turn: 0.4 }) }, 18]]) : c.f < f0 ? { p: POSES.stand.p } : { p: w.p };
    const u = Math.min(1, Math.max(0, (c.f - f0) / (f1 - f0)));
    const fc = faceAt(c.f, [[0, face('surprised', { open2: 0.1 })], [sm, 'forcedSmile', 10], [lips, face('forcedSmile', { tight: 1, mouth: 0.25, width: 0.95 }), 10]]);
    return <Stage cam={cam(1280, 560, 1.5)}>
      <Meeting f={c.f} seats={team(c.f, { faces: ['listening', 'smug', 'listening', 'listening', 'smug'] })}
        extra={<Actor f={c.f} seed={41} who="salim" pose={pz} face={fc} x={w.x} y={mix(STAND.y, MEET_FEET, ease.inOut(u))} s={mix(1.45, MEET_S, ease.inOut(u))} facing={-1} />} />
    </Stage>;
  },
  // 5 — from outside he looks calm: a colleague nods at him, Hadi goes back to his papers, Jaser turns away.
  5: (c) => {
    const calm = c.at('هادئ');
    const a2 = nod(c.f, calm - 4, 2, 8);
    return <Stage cam={cam(1290, 510, 2.0)}>
      <Meeting f={c.f} seats={[
        { who: 'mona', face: 'listening' }, { who: 'att1', face: 'smug' },
        { who: 'hadi', p: atTable({ head: k(c.f, [[0, 0], [30, 16]]), turn: 0.3 }), face: { ...EXPRESSIONS.neutral, look: [0.2, 0.8] } },
        { who: 'att2', p: atTable({ head: a2, turn: 0.6 }), face: faceAt(c.f, [[0, 'listening'], [calm - 10, face('smile', { mouth: 0.6 })]]) },
        { who: 'jaser', facing: -1, p: pose({ sit: 1, lean: -4, head: -6, turn: 0.2, footR: [50, 0], footL: [62, 0], R: { hand: [22, -186], bend: -1 }, L: { hand: [-2, -190], bend: -1 } }), hands: { R: 'fist', L: 'fist' }, face: 'contempt' },
        { who: 'salim', facing: -1, p: atTable({ breath: 0.5 + 0.5 * Math.sin(c.f / 40), turn: 0.4 }), face: face('forcedSmile', { tight: 1, mouth: 0.25 }) },
      ]} />
    </Stage>;
  },
  // 6 — under the table: the hand squeezes the pen on «تضغط»; it bends and trembles on «بكل قوته».
  6: (c) => {
    const sq = c.at('تضغط'), hard = c.at('بكل');
    const grip = c.p(sq - 6, 14, ease.out), bend = c.p(hard, 40, ease.out);
    const tr = c.f > hard ? Math.sin(c.f * 2.1) * 2.2 * bend + Math.sin(c.f * 3.3) * 1.2 * bend : 0;
    const wrist: [number, number] = [1040 + tr, 600 + tr * 0.6 - grip * 10];
    const elbow: [number, number] = [1900, 140];
    return <Stage>
      <UnderTable />
      <g>
        <path d={`M${elbow[0]} ${elbow[1]} L${wrist[0] + 40} ${wrist[1] - 20}`} stroke={INK} strokeWidth={142} strokeLinecap="round" />
        <path d={`M${elbow[0]} ${elbow[1]} L${wrist[0] + 40} ${wrist[1] - 20}`} stroke={CAST.salim.shirt} strokeWidth={124} strokeLinecap="round" />
        <path d={`M${wrist[0] + 120} ${wrist[1] - 70} l-40 90`} stroke={CAST.salim.shirtShade} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
        <g transform={`translate(${wrist[0]} ${wrist[1]}) rotate(${152 - grip * 4}) scale(${9 + grip * 0.2} ${-(9 + grip * 0.2)})`}>
          <Hand g="grip" skin={CAST.salim.skin} layer="back" />
          <g transform={`translate(12 0) rotate(${84 + bend * 4})`}><BentPen bend={bend} /></g>
          <Hand g="grip" skin={CAST.salim.skin} layer="front" />
        </g>
        {bend > 0.05 && [0, 1, 2].map((i) => <path key={i} d={`M${wrist[0] - 210 - i * 26} ${wrist[1] - 120 + i * 50} q-18 10 -36 0`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" opacity={bend * 0.7} />)}
      </g>
    </Stage>;
  },
  // 7 — something in his chest boils without a sound on «يفور».
  7: (c) => {
    const boil = c.at('يفور');
    const cm = cam(1490, 560, 2.3);
    return <Stage cam={cm}>
      <Meeting f={c.f} seats={[{ who: 'mona' }, { who: 'att1' }, { who: 'hadi' }, { who: 'att2' }, { who: 'jaser', facing: -1, face: 'contempt' },
        { who: 'salim', facing: -1, p: atTable({ turn: 0.4, head: 3, breath: c.p(boil, 30) }), face: faceAt(c.f, [[0, face('forcedSmile', { tight: 1, mouth: 0.25 })], [boil, face('forcedSmile', { tight: 1, mouth: 0.2, brow: 0.8, look: [0, 0.3] }), 20]]) }]}
        front={<>
          <Vignette x={1490} y={560} r={420} o={0.9} id="b1-v7" />
          <ChestSwirl x={1496} y={606} r={34} t={c.t} amount={c.p(boil - 10, 36)} />
        </>} />
    </Stage>;
  },
  // 8 — calm on the surface: a waterline across his chest, a swirl under it; «هدوء على السطح» on «السطح».
  8: (c) => {
    const line = c.at('هدوء'), but = c.at('لكنه'), surf = c.at('السطح');
    const y = 640, draw = c.p(6, 70);
    const wave = Array.from({ length: 41 }, (_, i) => { const x = -100 + i * 53; return `${i ? 'L' : 'M'}${x} ${(y + Math.sin(i * 0.9 + c.t * 2) * 6).toFixed(1)}`; }).join(' ');
    return <Stage over={<Cap text="هدوء على السطح" o={c.p(surf, 12)} top={60} size={64} />}>
      <Paper seed={8} />
      <Actor f={c.f} seed={41} who="salim" pose={{ p: pose({ ...POSES.standFront.p, breath: 0.4 + 0.4 * Math.sin(c.f / 50) }) }} face="calm" x={960} y={1010} s={2.0} />
      <clipPath id="b1-w8"><rect x={-100} y={0} width={2120 * draw} height={1080} /></clipPath>
      <g clipPath="url(#b1-w8)">
        <path d={`${wave} L2020 1100 L-100 1100 Z`} fill={PAL.water} opacity={0.38} />
        <path d={wave} stroke={PAL.waterDeep} strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
      <ChestSwirl x={960} y={720} r={70} t={c.t} amount={c.p(but - 6, 36)} />
    </Stage>;
  },
  // 9 — like a still lake: the section under the water opens on «وتحتها», a current turns on «تيار».
  9: (c) => <Stage><Lake t={c.t} cut={c.p(c.at('وتحتها') - 16, 70)} current={c.p(c.at('تيار') - 6, 50)} /></Stage>,
  // 10 — on the shore he puts a hand on his chest; a small ripple keeps moving; «الهدوء الحقيقي».
  10: (c) => {
    const hand = c.at('الهدوء');
    return <Stage over={<Cap text="الهدوء الحقيقي" o={c.p(c.at('الحقيقي') - 4, 12)} top={60} size={64} />}>
      <Lake t={c.t + 20} cut={0} current={0} storm={0.18} />
      <path d={sketch([[1060, 1100], [1190, 900], [1400, 858], [1960, 840], [1960, 1100]], 31, 3, true)} fill="#8FA89A" stroke={INK} strokeWidth={3.6} />
      <path d={sketch([[1180, 940], [1500, 900], [1960, 896]], 32, 4)} stroke={PAL.plantDark} strokeWidth={4} fill="none" opacity={0.5} />
      <Actor f={c.f} seed={41} who="salim" pose={poseAt(c.f, [[0, 'stand'], [hand - 8, 'handOnChest', 20]])} face={faceAt(c.f, [[0, { ...EXPRESSIONS.neutral, look: [0.6, 0.3] }], [hand + 10, { ...EXPRESSIONS.calm, look: [0.3, 0.5] }, 20]])} x={1420} y={890} s={1.45} facing={-1} />
    </Stage>;
  },
  // 11 — feel, understand, choose: the wave lights on «تشعر», he looks and names it on «وتفهم», picks the straight arrow on «تختار».
  11: (c) => {
    const feel = c.at('تشعر'), know = c.at('وتفهم'), pick = c.at('تختار');
    const go = pick + 12;
    const w = walkTo(c.f, go, go + 48, 1250, 1110, 1.6);
    const zig = Array.from({ length: 9 }, (_, i) => [1150 - i * 72, 880 - i * 26 + (i % 2 ? -26 : 26)] as [number, number]);
    const zp = c.p(pick, 24), sp = c.p(pick + 8, 24);
    const zn = Math.max(1, Math.round(zp * (zig.length - 1)));
    const pz = c.f < go ? poseAt(c.f, [[0, 'standFront'], [know - 6, { p: pose({ ...POSES.standFront.p, head: 16, turn: 0.15 }) }, 16], [pick + 6, { p: pose({ ...POSES.standFront.p, head: 2, turn: -0.4 }) }, 16]]) : { p: w.p };
    return <Stage>
      <Paper seed={11} />
      <Floor y={900} />
      {[['أشعر', 1560, feel], ['أفهم', 960, know], ['أختار', 360, pick]].map(([t, x, a]) => <WLabel key={t as string} x={x as number} y={170} text={t as string} size={64} o={c.p((a as number) - 4, 12)} color={t === 'أختار' ? PAL.calm : INK} />)}
      {[[1560, 960, know], [960, 360, pick]].map(([a, b, at], i) => <path key={i} d={`M${(a as number) - 100} 160 h${-((a as number) - (b as number) - 200) * c.p((at as number) - 8, 14)}`} stroke={INK} strokeWidth={4} strokeDasharray="10 12" opacity={0.4} />)}
      <path d={sketch(zig.slice(0, zn + 1), 3, 1)} stroke={PAL.warn} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={zp > 0 ? 0.85 : 0} />
      <path d={`M1150 905 L${1150 - 760 * sp} 905`} stroke={PAL.calm} strokeWidth={12} strokeLinecap="round" opacity={sp > 0 ? 1 : 0} />
      {sp > 0.95 && <path d="M412 885 L390 905 L412 925" stroke={PAL.calm} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      <Actor f={c.f} seed={41} who="salim" pose={pz} face={faceAt(c.f, [[0, 'neutral'], [feel, face('irritated', { brow: 0.3, mouth: -0.1 })], [know, { ...EXPRESSIONS.thinking, look: [0, 0.7] }], [pick + 6, 'determined']])} x={c.f < go ? 1250 : w.x} y={900} s={1.6} facing={c.f < go ? 1 : -1} />
      <ChestSwirl x={c.f < go ? 1250 : w.x} y={900 - 192 * 1.6} r={44} t={c.t} amount={c.p(feel - 4, 18) * (1 - 0.5 * c.p(pick + 20, 40))} />
      {c.f > know - 4 && <WLabel x={1440} y={560} text="ضيق" size={44} o={c.p(know, 12) * (1 - c.p(go, 12))} bg={PAL.provokeLight} />}
    </Stage>;
  },
  // 12 — one week with Salim: seven day tiles appear right to left as he walks under them.
  12: (c) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const w = walkTo(c.f, 6, c.dur - 4, 1840, 420, 1.65);
    return <Stage over={<Cap text="أسبوع واحد" o={c.p(c.at('أسبوع') - 4, 12)} top={318} size={46} />}>
      <Paper seed={12} />
      <Floor y={970} />
      {days.map((d, i) => {
        const o = c.p(8 + i * 16, 12, ease.back), x = 1700 - i * 235, lit = Math.abs(w.x - x) < 118;
        return <g key={d} opacity={Math.min(1, o)} transform={`translate(${x} 190) scale(${mix(0.7, 1.05, Math.min(1, o))})`}>
          <rect x={-100} y={-80} width={200} height={160} rx={18} fill={lit ? PAL.calmLight : '#FFFFFF'} stroke={INK} strokeWidth={4} />
          <rect x={-100} y={-80} width={200} height={40} rx={18} fill={i === 0 ? PAL.calm : PAL.storm} stroke={INK} strokeWidth={4} />
          <rect x={-100} y={-56} width={200} height={16} fill={i === 0 ? PAL.calm : PAL.storm} />
          <WLabel x={0} y={22} text={d} size={36} />
        </g>;
      })}
      <Actor f={c.f} seed={41} who="salim" pose={{ p: w.p }} face={{ ...EXPRESSIONS.calm, look: [0.3, -0.5] }} x={w.x} y={970} s={1.65} facing={-1} />
    </Stage>;
  },
  // 13 — keeping it in versus choosing your response: two halves; the film's title in the pause.
  13: (c) => {
    const hide = c.at('تكتم'), ctrl = c.at('استجابتك'), title = c.at('دون') - 6;
    const right = 1 - 0.55 * c.p(ctrl - 10, 16), left = 0.45 + 0.55 * c.p(ctrl - 10, 16);
    return <Stage over={<>
      <Cap text="أن تكتم" o={c.p(hide - 4, 12)} x={1440} w={900} top={70} size={56} pill={false} color={PAL.provoke} />
      <Cap text="أن تتحكم في استجابتك" o={c.p(ctrl - 4, 12)} x={480} w={900} top={70} size={50} pill={false} color={PAL.calm} />
      <Cap text="الهدوء الحقيقي ليس كبتًا للمشاعر" o={c.p(title, 16)} top={860} size={62} />
    </>}>
      <rect x={960} y={0} width={960} height={1080} fill="#EEE3E6" />
      <rect x={0} y={0} width={960} height={1080} fill="#E1EEEA" />
      <path d={sketch([[960, -10], [960, 1090]], 4, 2)} stroke={INK} strokeWidth={5} />
      <g opacity={right}>
        <Actor f={c.f} seed={41} who="salim" x={1440} y={930} s={1.55} facing={-1}
          pose={poseAt(c.f, [[0, 'stand'], [hide - 10, { p: pose({ turn: 0.25, body: 0.25, head: 8, R: { hand: [16, -198], bend: -1 }, L: { hand: [24, -184], bend: -1 } }), hands: { R: 'open', L: 'open' } }, 16]])}
          face={faceAt(c.f, [[0, 'neutral'], [hide, face('forcedSmile', { tight: 1, mouth: 0.1, brow: 0.7 })]])} />
        <ChestSwirl x={1440 - 10} y={930 - 196 * 1.55} r={40} t={c.t} amount={c.p(hide, 30) * 0.9} />
      </g>
      <g opacity={left}>
        <Actor f={c.f} seed={43} who="salim" x={480} y={930} s={1.55} facing={1} say={[ctrl, c.sp[1]]}
          pose={poseAt(c.f, [[0, 'stand'], [ctrl - 8, 'explain', 18], [ctrl + 50, { p: pose({ ...POSES.explain.p, R: { hand: [60, -176] } }), hands: POSES.explain.hands }, 30]])}
          face={faceAt(c.f, [[0, 'neutral'], [ctrl, 'calm']])} />
      </g>
          </Stage>;
  },
  // 14 — the meeting is over; he comes out of the building on «وخرج» and walks along the evening street.
  14: (c) => {
    const out = c.at('وخرج'), v = 3.2;
    const doorX = (pan: number) => 470 - pan * 1400;
    const fw = out + 30;
    const sx = k(c.f, [[out, 470], [out + 30, 520]]);
    const walked = Math.max(0, c.f - fw) * v;
    const scr = Math.min(sx + walked, 860);
    const pan = Math.max(0, sx + walked - 860) / 1400;
    const total = scr - 470 + pan * 1400;
    const ph = (total / (44 * 1.45)) * Math.PI;
    const moving = c.f > fw ? Math.min(1, (c.f - fw) / 8) : 0;
    const doorOpen = k(c.f, [[out - 10, 0], [out + 4, 1], [out + 50, 1], [out + 70, 0]]);
    const dx = doorX(pan);
    return <Stage>
      <Street pan={pan} />
      <g>
        <rect x={dx - 70} y={590} width={140} height={210} fill={PAL.screen} stroke={INK} strokeWidth={3.6} />
        <rect x={dx - 70} y={590} width={140 * (1 - doorOpen * 0.85)} height={210} fill={PAL.chair} stroke={INK} strokeWidth={3.6} />
        <rect x={dx - 86} y={574} width={172} height={18} fill={PAL.storm} stroke={INK} strokeWidth={2.4} />
      </g>
      <Actor f={c.f} seed={41} who="salim" x={scr} y={880} s={1.45} facing={1} o={c.p(out - 4, 10)}
        pose={{ p: moving > 0 ? pose({ lean: 4, ...walkPhase(ph, 44, moving) }) : POSES.stand.p }} face={{ ...EXPRESSIONS.neutral, look: [0.4, 0.4] }} />
    </Stage>;
  },
  // 15 — the meeting goes on in his head: a thought cloud replays Jaser's finger.
  15: (c) => {
    const p0 = 0.3, v = 3.2 / 1400, pan = p0 + c.f * v;
    const ph = ((c.f * 3.2) / (44 * 1.45)) * Math.PI;
    const cl = c.p(c.at('الاجتماع') - 6, 16, ease.back);
    return <Stage>
      <Street pan={pan} />
      <Actor f={c.f} seed={41} who="salim" x={860} y={880} s={1.45} facing={1} pose={{ p: pose({ lean: 6, head: 6, ...walkPhase(ph, 44, 1) }) }} face={faceAt(c.f, [[0, 'neutral'], [30, 'irritated', 30]])} />
      <Replay x={500} y={300} s={Math.min(1, cl)} raise={k(c.f, [[c.at('ينته'), 0], [c.at('ينته') + 14, 1]])} tail={[260, 230]} o={Math.min(1, cl * 2)} />
    </Stage>;
  },
  // 16 — at the crossing he replays it: once, twice, ten times (a rewind mark and a counter).
  16: (c) => {
    const beats = [c.at('مرة'), c.at('ومرتين'), c.at('عشر')];
    const n = beats.filter((b) => c.f >= b).length;
    const last = beats[Math.max(0, n - 1)];
    const raise = n ? k(c.f, [[last, 0], [last + 12, 1]]) : 1;
    const spin = n ? ease.out(Math.min(1, (c.f - last) / 24)) : 0;
    const carX = mix(-260, 2200, c.p(0, 150, ease.lin));
    return <Stage>
      <Street pan={0.68} />
      <Car x={carX} y={1040} color={PAL.focus} />
      <WalkSignal x={1180} y={900} />
      <Actor f={c.f} seed={41} who="salim" x={980} y={890} s={1.45} facing={1} pose={{ p: pose({ head: 4 + nod(c.f, last, 1, 4), turn: 0.4, R: { hand: [18, -168], bend: -1 }, L: { hand: [-4, -172], bend: -1 } }), hands: { R: 'fist', L: 'fist' } }} face="irritated" />
      <Replay x={600} y={300} s={1} raise={raise} tail={[290, 230]} />
      <Rewind x={230} y={150} r={40} spin={spin} o={n ? 1 : 0} />
      {n > 0 && <WLabel x={230} y={250} text={['1', '2', '10'][n - 1]} size={56} color={PAL.provoke} o={Math.min(1, (c.f - last) / 6)} />}
    </Stage>;
  },
  // 17 — at the bus stop he argues with no one; a winning finger on «أذكى», then the hand drops. A stranger glances.
  17: (c) => {
    const win = c.at('أذكى');
    const pz = poseAt(c.f, [[0, 'stand'], [10, 'explain', 16], [win - 30, { p: pose({ ...POSES.explain.p, R: { hand: [58, -150] }, L: { hand: [76, -196] } }), hands: { R: 'cup', L: 'chop' } }, 14], [win - 6, { p: pose({ lean: -2, head: -6, L: { hand: [40, -312] }, R: { sh: -6, el: 8 } }), hands: { R: 'relaxed', L: 'point' } }, 10], [win + 50, 'slump', 30]]);
    return <Stage>
      <Street pan={0.9} />
      <Actor f={c.f} seed={41} who="salim" x={760} y={880} s={1.45} facing={1} pose={pz} say={[4, win + 30]} face={faceAt(c.f, [[0, 'irritated'], [win - 8, 'smug', 8], [win + 50, face('sad', { mouth: -0.2 }), 24]])} />
      <Actor f={c.f} seed={7} who="att3" x={1240} y={880} s={1.42} facing={-1} pose={poseAt(c.f, [[0, 'phone'], [win, { p: pose({ ...POSES.phone.p, head: -2, turn: 0.7 }), hands: POSES.phone.hands }, 12], [win + 50, 'phone', 16]])}
        hold={{ L: <Phone w={28} glow={0.4} /> }} upright={{ L: true }} face={faceAt(c.f, [[0, { ...EXPRESSIONS.neutral, look: [0, 0.6] }], [win + 4, face('surprised', { open2: 0, look: [1, 0] }), 8], [win + 50, { ...EXPRESSIONS.neutral, look: [0, 0.6] }]])} />
    </Stage>;
  },
  // 18 — home: the front door opens, he walks in; his sister lowers her phone and asks «ما بك؟».
  18: (c) => {
    const ask = c.at('ما');
    const w = walkTo(c.f, 30, 120, HOME.frontDoorX, 1250, 1.45);
    const door = k(c.f, [[0, 0], [24, 1], [130, 1], [150, 0.15]]);
    return <Stage over={<Say text="ما بك؟" to={toScreen(CAM0, [HOME.sofaSeat.x + 30, 470])} above={10} o={c.p(ask - 4, 10)} size={44} />}>
      <HomeLiving door={door} />
      <Actor f={c.f} seed={23} who="reem" x={HOME.sofaSeat.x} y={860} s={1.45} facing={1} say={[ask, c.sp[1]]}
        pose={poseAt(c.f, [[0, { p: pose({ sit: 1, head: 16, footR: [52, 0], footL: [64, 0], R: { hand: [46, -168] }, L: { hand: [56, -126] } }), hands: { R: 'grip', L: 'relaxed' } }], [ask - 20, { p: pose({ sit: 1, head: -4, turn: 0.6, footR: [52, 0], footL: [64, 0], R: { hand: [50, -128] }, L: { hand: [58, -126] } }), hands: { R: 'grip', L: 'relaxed' } }, 18]])}
        hold={{ R: <Phone w={28} glow={0.3} /> }} upright={{ R: true }}
        face={faceAt(c.f, [[0, { ...EXPRESSIONS.calm, look: [0, 0.7] }], [ask - 16, { ...EXPRESSIONS.anxious, look: [1, -0.1] }, 14]])} />
      <Actor f={c.f} seed={41} who="salim" x={w.x} y={866} s={1.45} facing={-1} o={c.p(8, 10)} pose={{ p: c.f > 120 ? POSES.stand.p : w.p }} face={{ ...EXPRESSIONS.irritated, look: [0.2, 0.6] }} />
    </Stage>;
  },
  // 19 — «لا شيء»: he doesn't stop, goes into his room and the door closes on «وأغلق».
  19: (c) => {
    const no = c.at('لا'), shut = c.at('وأغلق');
    const w = walkTo(c.f, 0, shut - 14, 1250, 250, 1.45, { lean: 6 });
    const inHall = w.x < 410;
    const salim = <Actor f={c.f} seed={41} who="salim" x={w.x} y={inHall ? 846 : 866} s={inHall ? 1.38 : 1.45} facing={-1} pose={{ p: w.p }} say={[no, no + 40]} face={{ ...EXPRESSIONS.irritated, look: [0.3, 0.3] }} />;
    const room = k(c.f, [[shut - 6, 0.82], [shut + 6, 0]], ease.in);
    const cm = cam(768, 540, 1.25);
    return <Stage cam={cm} over={<Say text="لا شيء" to={toScreen(cm, [w.x + 10, 450])} above={10} o={c.p(no - 2, 8) * (1 - c.p(no + 60, 10))} size={42} />}>
      <HomeLiving room={room} hall={inHall ? salim : undefined} />
      <Actor f={c.f} seed={23} who="reem" x={HOME.sofaSeat.x} y={860} s={1.45} facing={1}
        pose={{ p: pose({ sit: 1, lean: k(c.f, [[shut, 0], [shut + 4, -5], [shut + 30, 0]]), head: -4, turn: mix(0.6, -0.5, Math.min(1, Math.max(0, (1100 - w.x) / 500))), footR: [52, 0], footL: [64, 0], R: { hand: [50, -128] }, L: { hand: [58, -126] } }), hands: { R: 'grip', L: 'relaxed' } }}
        hold={{ R: <Phone w={28} /> }} upright={{ R: true }} face={faceAt(c.f, [[0, 'anxious'], [shut + 2, 'hurt', 10]])} />
      {!inHall && salim}
    </Stage>;
  },
  // 20 — silence is not a problem in itself: he sits on the bed's edge, breathes out, looks at the window.
  20: (c) => {
    const out = 6;
    const exhale = k(c.f, [[out, 1], [out + 50, 0]]);
    return <Stage>
      <Bedroom night lamp={0.6} />
      <Actor f={c.f} seed={41} who="salim" x={BEDROOM.bedSeat.x} y={860} s={1.45} facing={1}
        pose={{ p: pose({ sit: 1, lean: mix(4, 12, 1 - exhale), bob: mix(0, 4, 1 - exhale), head: mix(4, -8, c.p(70, 40)), turn: mix(0.4, 0.75, c.p(70, 40)), breath: exhale, footR: [52, 0], footL: [64, 0], R: { hand: [52, -124] }, L: { hand: [62, -122] } }) }}
        face={faceAt(c.f, [[0, 'sad'], [70, { ...EXPRESSIONS.sad, look: [0.7, -0.6], mouth: -0.3 }, 30]])} />
    </Stage>;
  },
};
