import React from 'react';
import { CAST } from '../kit/characters/cast';
import { EXPRESSIONS, type Face } from '../kit/characters/face';
import { Hand, type Gesture } from '../kit/characters/hands';
import { POSES } from '../kit/characters/poses';
import { joints, pose, walkPhase, type Pose } from '../kit/characters/skeleton';
import { Bedroom, BEDROOM } from '../kit/places/Bedroom';
import { Corridor } from '../kit/places/Corridor';
import { HomeLiving, HOME } from '../kit/places/HomeLiving';
import { Door, Ghost, Glow, LIGHT, NIGHT, Room } from '../kit/places/parts';
import { Pot } from '../kit/metaphors/Pot';
import { Calendar, ChatScreen, Clock, Folder, Phone, Plant } from '../kit/props';
import { Ar } from '../kit/props/ui';
import { INK, LINE, PAL, hash, sketch, sketchRect } from '../kit/style';
import { Actor, Cap, CAM0, Paper, Say, Stage, ease, faceAt, k, mix, poseAt, toScreen, type Ctx } from '../film/engine';
import type { ShotRender } from '../film/Film';
import { ChestSwirl, Floor, WLabel, cam, nod, shake, walkTo } from './common';

// Chapter 2 «صمت أم خوف؟» (shots 21–26) and chapter 3 «تنظيم لا كبت» up to naming the feeling (shots 27–40).
type V2 = [number, number];
const face = (base: keyof typeof EXPRESSIONS, o: Partial<Face>): Face => ({ ...EXPRESSIONS[base], ...o });
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const SKIN = CAST.salim.skin;

/** World points of a posed character (s = drawn scale including the cast size): head centre, chest, hip, wrists. */
const J = (p: Pose, x: number, y: number, s: number, fc: 1 | -1) => {
  const j = joints(p);
  const w = (q: V2): V2 => [x + fc * s * q[0], y + s * q[1]];
  return { head: w(j.headC), chest: w([mix(j.hip[0], j.neck[0], 0.62), mix(j.hip[1], j.neck[1], 0.62)]), hip: w(j.hip), wrL: w(j.armL.wrist), wrR: w(j.armR.wrist), r: 48 * s };
};
/** A hand redrawn on top of something held against the body (the lid on the chest), exactly where the rig puts it. */
const TopHand: React.FC<{ p: Pose; side: 'R' | 'L'; g: Gesture; x: number; y: number; s: number; fc: 1 | -1 }> = ({ p, side, g, x, y, s, fc }) => {
  const a = side === 'R' ? joints(p).armR : joints(p).armL;
  const ang = (Math.atan2(a.wrist[1] - a.elbow[1], a.wrist[0] - a.elbow[0]) * 180) / Math.PI + (p[side].wrist ?? 0);
  return <g transform={`translate(${x} ${y}) scale(${s * fc} ${s})`}>
    <g transform={`translate(${a.wrist[0]} ${a.wrist[1]}) rotate(${ang}) scale(1.45 ${side === 'R' ? -1.45 : 1.45})`}><Hand g={g} skin={SKIN} /></g>
  </g>;
};
/** A damped swing toward `amp` starting at frame `from` (a scale beam settling, a lid knocked). */
const swing = (f: number, from: number, amp: number) => { if (f < from) return 0; const u = (f - from) / 60; return amp * (1 - Math.exp(-u * 4.5) * Math.cos(u * 12)); };
/** A silhouette: everything inside is flattened to one ink colour (a cast shadow on the wall). */
const Silhouette: React.FC<{ id: string; o: number; children: React.ReactNode }> = ({ id, o, children }) => (
  <g opacity={o}>
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%"><feFlood floodColor={INK} /><feComposite in2="SourceAlpha" operator="in" /></filter>
    <g filter={`url(#${id})`}>{children}</g>
  </g>
);
const Seated = (o: Partial<Pose> = {}) => pose({ sit: 1, footR: [52, 0], footL: [64, 0], R: { hand: [48, -128] }, L: { hand: [60, -126] }, ...o });

// ——— the balance (shots 23–24) ———
const BAL = { x: 860, py: 330, half: 330, hang: 250, floor: 960 };
const panAt = (side: 1 | -1, tilt: number): V2 => { const a = (tilt * Math.PI) / 180; return [BAL.x + side * BAL.half * Math.cos(a), BAL.py + side * BAL.half * Math.sin(a) + BAL.hang]; };
const Balance: React.FC<{ tilt: number; R?: React.ReactNode; L?: React.ReactNode }> = ({ tilt, R, L }) => {
  const { x, py, half, hang, floor } = BAL;
  const a = (tilt * Math.PI) / 180;
  const pan = (side: 1 | -1, inside?: React.ReactNode) => {
    const e: V2 = [x + side * half * Math.cos(a), py + side * half * Math.sin(a)];
    const [px, pyy] = [e[0], e[1] + hang];
    return <g key={side}>
      {[-128, 0, 128].map((dx) => <path key={dx} d={`M${e[0]} ${e[1] + 6} L${px + dx} ${pyy}`} stroke={INK} strokeWidth={3} />)}
      <circle cx={e[0]} cy={e[1] + 4} r={9} fill={PAL.metal} stroke={INK} strokeWidth={3} />
      <g transform={`translate(${px} ${pyy})`}>
        {inside}
        <path d="M-136 0 Q-118 64 0 66 Q118 64 136 0 Z" fill={PAL.table} stroke={INK} strokeWidth={LINE.bold} strokeLinejoin="round" />
        <path d="M-100 18 Q-40 34 20 30" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.6} />
      </g>
    </g>;
  };
  return <g>
    <path d={sketch([[x - 130, floor], [x + 130, floor], [x + 60, floor - 46], [x - 60, floor - 46]], 4, 1.4, true)} fill={PAL.woodDark} stroke={INK} strokeWidth={LINE.bold} strokeLinejoin="round" />
    <path d={sketchRect(x - 16, py, 32, floor - 46 - py, 5, 1)} fill={PAL.wood} stroke={INK} strokeWidth={LINE.normal} />
    <g transform={`rotate(${tilt} ${x} ${py})`}>
      <path d={sketchRect(x - half - 14, py - 12, 2 * half + 28, 24, 6, 1)} fill={PAL.metal} stroke={INK} strokeWidth={LINE.normal} />
      <path d={`M${x - 14} ${py - 12} L${x} ${py - 70} L${x + 14} ${py - 12} Z`} fill={PAL.chair} stroke={INK} strokeWidth={LINE.fine} strokeLinejoin="round" />
    </g>
    <circle cx={x} cy={py} r={16} fill={PAL.chair} stroke={INK} strokeWidth={LINE.normal} />
    {pan(1, R)}{pan(-1, L)}
  </g>;
};
/** A padlock, origin at the middle of its bottom edge (≈ 100 × 130). */
const Lock: React.FC = () => (
  <g>
    <path d="M-30 -76 L-30 -100 A30 30 0 0 1 30 -100 L30 -76" fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
    <path d="M-30 -76 L-30 -100 A30 30 0 0 1 30 -100 L30 -76" fill="none" stroke={PAL.metal} strokeWidth={12} strokeLinecap="round" />
    <path d={sketchRect(-50, -82, 100, 82, 3, 1)} fill={PAL.storm} stroke={INK} strokeWidth={LINE.bold} />
    <circle cx={0} cy={-48} r={10} fill={INK} /><path d="M-5 -44 L-8 -20 L8 -20 L5 -44 Z" fill={INK} />
  </g>
);

// ——— the pot's arm reaching the stove knob from the right (shots 37–38) ———
const KnobArm: React.FC<{ wr: V2; turn: number; g?: Gesture }> = ({ wr, turn, g = 'grip' }) => {
  const sh: V2 = [2140, 1260];
  const el: V2 = [mix(sh[0], wr[0], 0.5) + 60, mix(sh[1], wr[1], 0.5) + 110];
  const d = `M${sh[0]} ${sh[1]} L${el[0]} ${el[1]} L${wr[0]} ${wr[1]}`;
  return <g>
    <path d={d} fill="none" stroke={INK} strokeWidth={48.8} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={CAST.salim.shirt} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M${mix(el[0], wr[0], 0.2)} ${mix(el[1], wr[1], 0.2) + 10} L${mix(el[0], wr[0], 0.75)} ${mix(el[1], wr[1], 0.75) + 10}`} stroke={CAST.salim.shirtShade} strokeWidth={9} strokeLinecap="round" opacity={0.6} />
    <g transform={`translate(${wr[0]} ${wr[1]}) rotate(${-150 + turn}) scale(5.2 -5.2)`}><Hand g={g} skin={SKIN} /></g>
  </g>;
};

// ——— a flat phone lying on a surface, its screen glowing up (shots 27, 31) ———
const PhoneOn: React.FC<{ x: number; y: number; lit: number; buzz?: number; t?: number; down?: boolean }> = ({ x, y, lit, buzz = 0, t = 0, down }) => {
  const dx = buzz * Math.sin(t * 140) * 2.5;
  return <g transform={`translate(${x + dx} ${y})`}>
    {lit > 0 && !down && <><Glow x={0} y={-30} r={110} ry={70} color={PAL.screenGlow} o={lit * 0.9} /><path d="M-26 -6 L26 -6 L60 -110 L-60 -110 Z" fill={PAL.screenGlow} opacity={lit * 0.25} /></>}
    <rect x={-32} y={-9} width={64} height={10} rx={4} fill={PAL.screen} stroke={INK} strokeWidth={3} />
    {!down && <rect x={-26} y={-11} width={52} height={3} rx={1.5} fill={lit > 0.2 ? PAL.screenGlow : PAL.chair} />}
    {buzz > 0 && [-1, 1].map((sd) => <path key={sd} d={`M${sd * 44} -26 q${sd * 8} 12 0 24 M${sd * 56} -32 q${sd * 10} 18 0 36`} fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" opacity={buzz} />)}
  </g>;
};

/** The big phone for the screen inserts: centred, a little tilted, in a dark room. */
const PHONE_W = 560;
const BigPhone: React.FC<{ screen: React.ReactNode; t: number }> = ({ screen, t }) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill={PAL.skyNight} />
    <Glow x={960} y={560} r={720} ry={560} color="#4A5878" o={1} />
    <g transform={`translate(960 ${560 + Math.sin(t * 0.9) * 4}) rotate(${-2 + Math.sin(t * 0.6) * 0.6})`}><Phone w={PHONE_W} screen={screen} glow={0.5} /></g>
  </g>
);
const JASER_MSG = 'أتمنى أن تكون فكرتك القادمة أفضل من فكرة اليوم';
const MY_MSG = { from: 'me' as const, text: 'شكرًا للجميع على الاجتماع اليوم', time: '11:31' };

// ——— the backpack of stones (shot 26), drawn in the character's frame, about the hip ———
const STONE = (i: number): V2 => [-57 + (i % 2 ? 9 : -9) + (hash(i) - 0.5) * 6, -104 - Math.max(0, i - 1) * 13];
const Pack: React.FC<{ p: Pose; x: number; y: number; s: number; n: number; front?: boolean }> = ({ p, x, y, s, n, front }) => {
  const j = joints(p);
  return <g transform={`translate(${x} ${y}) scale(${-s} ${s}) translate(${j.hip[0]} ${j.hip[1]}) rotate(${p.lean})`}>
    {front ? <path d="M-34 -96 Q-12 -110 8 -96 L10 -50" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      : <g>
        {Array.from({ length: n }, (_, i) => i).filter((i) => i >= 1).map((i) => { const [sx, sy] = STONE(i); return <ellipse key={i} cx={sx} cy={sy} rx={14} ry={10} fill={i % 2 ? PAL.metal : PAL.storm} stroke={INK} strokeWidth={2.6} />; })}
        <path d={sketch([[-86 - n, -104], [-30, -104], [-28, -6], [-84 - n * 1.4, -4]], 9, 1, true)} fill={PAL.focus} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={sketch([[-80 - n, -60], [-34, -60], [-34, -24], [-78 - n, -24]], 10, 0.8, true)} fill={PAL.focusLight} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
        <path d="M-86 -104 Q-58 -114 -30 -104" fill="none" stroke={INK} strokeWidth={4} />
      </g>}
  </g>;
};
const packTop = (p: Pose, x: number, y: number, s: number): V2 => {
  const j = joints(p), a = (p.lean * Math.PI) / 180, q: V2 = [-58, -112];
  const cx = j.hip[0] + q[0] * Math.cos(a) - q[1] * Math.sin(a), cy = j.hip[1] + q[0] * Math.sin(a) + q[1] * Math.cos(a);
  return [x - s * cx, y + s * cy];
};

/** A smiling mask on a stick (shot 33): centred at (x, y), the stick goes to the hand. */
const Mask: React.FC<{ x: number; y: number; hand: V2; r: number }> = ({ x, y, hand, r }) => (
  <g>
    <path d={`M${hand[0]} ${hand[1]} L${x} ${y}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
    <path d={`M${hand[0]} ${hand[1]} L${x} ${y}`} stroke={PAL.wood} strokeWidth={8} strokeLinecap="round" />
    <ellipse cx={x} cy={y} rx={r * 1.06} ry={r * 1.12} fill="#FBFAF7" stroke={INK} strokeWidth={5} />
    {[-1, 1].map((sd) => <path key={sd} d={`M${x + sd * r * 0.5 - r * 0.2} ${y - r * 0.18} Q${x + sd * r * 0.5} ${y - r * 0.38} ${x + sd * r * 0.5 + r * 0.2} ${y - r * 0.18} Q${x + sd * r * 0.5} ${y - r * 0.08} ${x + sd * r * 0.5 - r * 0.2} ${y - r * 0.18} Z`} fill={INK} />)}
    {[-1, 1].map((sd) => <ellipse key={sd} cx={x + sd * r * 0.62} cy={y + r * 0.22} rx={r * 0.16} ry={r * 0.09} fill={PAL.rose} opacity={0.5} />)}
    <path d={`M${x - r * 0.48} ${y + r * 0.3} Q${x} ${y + r * 0.78} ${x + r * 0.48} ${y + r * 0.3}`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
  </g>
);

/** A name card pinned to something (shots 39–40). */
const Card: React.FC<{ x: number; y: number; text: string; color: string; bg: string; o: number; rot?: number; w?: number }> = ({ x, y, text, color, bg, o, rot = 0, w = 230 }) => o <= 0 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${mix(0.4, 1, Math.min(1, o))})`} opacity={Math.min(1, o * 1.5)}>
    <path d={sketchRect(-w / 2, -54, w, 108, 7, 1)} fill={bg} stroke={INK} strokeWidth={LINE.bold} />
    <circle cx={0} cy={-44} r={9} fill={color} stroke={INK} strokeWidth={2.4} />
    <Ar x={-w / 2} y={-46} w={w} h={100} size={56} color={color} weight={800}>{text}</Ar>
  </g>
);

export const SHOTS: Record<number, ShotRender> = {
  // 21 — wise silence: Reem asks; he lifts his palm «لحظة» on «تنتظر», the swirl in his chest calms on «تهدأ»,
  // the clock runs on «وقت أنسب», then he sits beside her and starts to talk on «للكلام».
  21: (c) => {
    const ask = 24, wait = c.at('تنتظر'), calm = c.at('تهدأ'), time = c.at('وقت'), fit = c.at('أنسب'), talk = c.at('للكلام');
    const cm = cam(1020, 560, 1.12);
    const go = fit - 6, sat = go + 44;
    const w = walkTo(c.f, go, sat, 1250, 1090, 1.45);
    const br = c.f < wait ? 0.5 + 0.5 * Math.sin(c.f / 9) : 0.5 + 0.5 * Math.sin((c.f - wait) / 34 - 1.5);
    const stand = { p: pose({ breath: br, head: 4 }) };
    const stop = { p: pose({ lean: 2, head: -2, breath: br, R: { sh: -4, el: 10 }, L: { hand: [78, -206] } }), hands: { R: 'relaxed' as const, L: 'stop' as const } };
    const seat = { p: Seated({ lean: 7, head: 4, turn: 0.55, L: { hand: [74, -150] } }), hands: { R: 'relaxed' as const, L: 'open' as const } };
    const sp = c.f < go ? poseAt(c.f, [[0, stand], [wait - 14, stop, 16], [go - 22, { p: pose({ breath: br }) }, 18]]) : c.f < sat ? { p: w.p } : poseAt(c.f, [[sat, { p: w.p }], [sat + 1, seat, 18]]);
    const sx = c.f < go ? 1250 : w.x;
    const sj = J(sp.p, sx, 860, 1.45, -1);
    const fc = faceAt(c.f, [[0, face('irritated', { brow: 0.4, look: [0.6, 0.1] })], [wait - 6, face('calm', { open: 0.45, look: [0, 0.6] }), 14], [calm + 40, face('calm', { open: 0.8 }), 20], [fit - 10, face('listening', { look: [1, 0.2] }), 14], [talk - 6, 'calm', 12]]);
    const swirl = k(c.f, [[0, 0.9], [calm - 8, 0.9], [calm + 80, 0.3]]);
    const mins = k(c.f, [[time - 8, 10], [fit + 30, 52]], ease.inOut);
    const reemLook = k(c.f, [[time - 10, 0], [time + 6, 1], [go + 6, 1], [go + 22, 0]]);
    const reemP = Seated({ head: mix(-4, -12, reemLook) + nod(c.f, wait + 20, 1, 7), turn: 0.6, R: { hand: [50, -128] }, L: { hand: [58, -126] } });
    const rHead = toScreen(cm, [HOME.sofaSeat.x - 4, 860 - 330 * 1.45 * 0.95]);
    const sHead = toScreen(cm, [sj.head[0], sj.head[1] - sj.r]);
    return <Stage cam={cm} over={<>
      <Cap text="اختيار" o={c.p(c.at('اختيارا') - 4, 12)} top={40} size={58} color={PAL.calm} />
      <Say text="ما بك؟" to={rHead} above={14} o={c.p(ask, 10) * (1 - c.p(wait - 18, 10))} size={44} />
      <Say text="لحظة" to={sHead} above={14} o={c.p(wait - 2, 10) * (1 - c.p(calm + 60, 12))} size={46} />
    </>}>
      <HomeLiving night />
      <g transform="translate(1290 225)">
        <Glow x={0} y={0} r={110} color="#E7E6F4" o={c.p(time - 8, 12) * (1 - c.p(fit + 40, 20)) * 0.9} />
        <Clock hours={9} minutes={mins} r={50} />
        {c.f > time - 6 && c.f < fit + 40 && <path d={`M${Math.sin(((mins - 4) * 6 * Math.PI) / 180) * 66} ${-Math.cos(((mins - 4) * 6 * Math.PI) / 180) * 66} A66 66 0 0 1 ${Math.sin((mins * 6 * Math.PI) / 180) * 66} ${-Math.cos((mins * 6 * Math.PI) / 180) * 66}`} fill="none" stroke={PAL.calm} strokeWidth={6} strokeLinecap="round" />}
      </g>
      <Actor f={c.f} seed={23} who="reem" x={HOME.sofaSeat.x} y={860} s={1.45} facing={1} pose={{ p: reemP, hands: { R: 'grip', L: 'relaxed' } }} say={[ask, ask + 40]}
        hold={{ R: <Phone w={28} /> }} upright={{ R: true }}
        face={faceAt(c.f, [[0, face('anxious', { look: [1, -0.2] })], [wait + 10, face('listening', { look: [1, -0.1] }), 14], [time - 6, face('listening', { look: [0.7, -1] }), 12], [go + 8, face('smile', { mouth: 0.5, look: [1, 0] }), 16]])} />
      <Actor f={c.f} seed={41} who="salim" x={sx} y={860} s={1.45} facing={-1} pose={sp} face={fc} say={[talk, c.dur]} />
      <ChestSwirl x={sj.chest[0]} y={sj.chest[1]} r={40} t={c.t * (c.f < wait ? 1.6 : 0.8)} amount={swirl} />
    </Stage>;
  },
  // 22 — silence as escape: in the work corridor Salim (holding his idea in a folder) meets Jaser; he looks away and
  // steps back on «هروبًا», Jaser's shadow grows on the wall on «تخاف», he turns and slips away on «ترفض».
  22: (c) => {
    const run = c.at('هروبا'), fear = c.at('تخاف'), face2 = c.at('المواجهة'), rej = c.at('ترفض');
    const cm = cam(1000, 540, 1.12);
    const jw = walkTo(c.f, 0, 80, 1820, 1330, 1.45);
    const jp = c.f < 80 ? { p: jw.p } : poseAt(c.f, [[80, { p: jw.p }], [81, 'handsOnHips', 18], [face2 - 6, { p: pose({ ...POSES.handsOnHips.p, lean: 3, head: 4 }), hands: POSES.handsOnHips.hands }, 16]]);
    const folder = { L: { hand: [36, -176] as V2 }, R: { hand: [24, -170] as V2 } };
    const hold = { R: 'grip' as const, L: 'grip' as const };
    const sw = walkTo(c.f, 0, 60, 560, 720, 1.45);
    const back = c.p(run - 2, 16);
    const out = rej + 4;
    const ow = walkTo(c.f, out, out + 70, 720 - 34, 470, 1.45);
    let sp: { p: Pose; hands: typeof hold };
    if (c.f < 60) sp = { p: { ...sw.p, ...folder }, hands: hold };
    else if (c.f < out) sp = { ...poseAt(c.f, [[60, { p: pose({ ...folder }) }], [run - 14, { p: pose({ lean: 3, ...folder }) }, 10], [run, { p: pose({ lean: -8, head: 12, turn: 0.1, footR: [-34, 0], footL: [8, 0], ...folder }) }, 14], [fear + 6, { p: pose({ lean: 4, bob: 4, head: 18, turn: 0.1, footR: [-20, 0], footL: [10, 0], L: { hand: [26, -182] }, R: { hand: [16, -178] } }) }, 18], [rej - 20, { p: pose({ lean: 2, bob: 4, head: 14, turn: -0.4, footR: [-20, 0], footL: [10, 0], L: { hand: [22, -186] }, R: { hand: [12, -182] } }) }, 14]]), hands: hold };
    else sp = { p: { ...ow.p, L: { hand: [22, -186] }, R: { hand: [12, -182] }, head: 12 }, hands: hold };
    const sx = c.f < 60 ? sw.x : c.f < out ? 720 - 34 * back : ow.x;
    const grow = c.p(fear - 6, 50, ease.out);
    const jx = c.f < 80 ? jw.x : 1330;
    return <Stage cam={cm} over={<Cap text="هروب" o={c.p(run - 4, 12)} top={40} size={58} color={PAL.provoke} />}>
      <Corridor pan={0.16} />
      <Silhouette id="b2-sh22" o={mix(0.12, 0.3, grow)}>
        <g transform={`translate(${mix(jx + 40, 1150, grow)} 826) skewX(${mix(-4, 14, grow)}) translate(${-mix(jx + 40, 1150, grow)} -826)`}>
          <Actor f={c.f} seed={13} who="jaser" x={mix(jx + 40, 1150, grow)} y={826} s={mix(1.45, 2.45, grow)} facing={-1} pose={jp} face="smug" />
        </g>
      </Silhouette>
      <Actor f={c.f} seed={13} who="jaser" x={jx} y={860} s={1.45} facing={-1} pose={jp}
        face={faceAt(c.f, [[0, 'smug'], [run, face('smug', { browY: 0.2, look: [1, 0.2] }), 10], [face2, face('contempt', { look: [1, 0.3] }), 14]])} />
      <Actor f={c.f} seed={41} who="salim" x={sx} y={860} s={1.45} facing={c.f < out ? 1 : -1} pose={sp}
        hold={{ L: <g transform="scale(0.5)"><Folder /></g> }} upright={{ L: true }}
        face={faceAt(c.f, [[0, face('neutral', { look: [1, 0] })], [run - 6, face('anxious', { look: [-0.6, 0.8] }), 10], [fear + 4, face('anxious', { look: [-0.2, 1], tight: 0.8 }), 14], [rej - 16, face('hurt', { look: [-1, 0.5] }), 12]])} />
    </Stage>;
  },
  // 23 — the small question, drawn: Salim carries a clock, a «؟» rises over the balance on «سؤال»,
  // he sets the clock in the right pan on «اخترت الوقت» and the beam settles toward it.
  23: (c) => {
    const q = c.at('سؤال'), chose = c.at('اخترت'), drop = c.at('الوقت') - 6;
    const go = c.at('هل') - 4, there = go + 48;
    const w = walkTo(c.f, go, there, 1540, 1395, 1.7);
    const carry = { L: { hand: [58, -196] as V2 } };
    const reach = { p: pose({ lean: 6, head: 10, turn: 0.6, L: { hand: [113, -262] }, R: { sh: -4, el: 12 } }), hands: { R: 'relaxed' as const, L: 'grip' as const } };
    const sp = c.f < go ? poseAt(c.f, [[0, { p: pose({ head: 16, turn: 0.5, ...carry }), hands: { R: 'relaxed', L: 'grip' } }], [c.at('بينهما') - 4, { p: pose({ head: -2, turn: 0.8, ...carry }), hands: { R: 'relaxed', L: 'grip' } }, 18]])
      : c.f < there ? { p: { ...w.p, ...carry }, hands: { R: 'relaxed' as const, L: 'grip' as const } }
        : poseAt(c.f, [[there, { p: { ...w.p, ...carry }, hands: { R: 'relaxed', L: 'grip' } }], [chose - 18, reach, 18], [drop + 10, { p: pose({ head: 6 + nod(c.f, drop + 30, 1, 8), turn: 0.6 }) }, 20]]);
    const sx = c.f < go ? 1540 : w.x;
    const held = c.f < drop;
    const sj = J(sp.p, sx, BAL.floor, 1.7, -1);
    const tilt = swing(c.f, drop + 12, 11);
    const pr = panAt(1, tilt);
    const fall = c.p(drop, 12, ease.in);
    const clockR = 52;
    const inPan = <g transform={`translate(0 ${-clockR + 26})`}><Clock hours={10} minutes={10 + c.f * 0.02} r={clockR} /></g>;
    return <Stage>
      <Paper seed={23} />
      <Floor y={BAL.floor} />
      <WLabel x={BAL.x} y={170} text="؟" size={120} color={PAL.focus} o={c.p(q - 4, 12, ease.back)} />
      <Balance tilt={tilt} R={c.f >= drop + 12 ? inPan : null} />
      {!held && c.f < drop + 12 && <g transform={`translate(${mix(sj.wrL[0], pr[0], fall)} ${mix(sj.wrL[1], pr[1] - clockR + 26, fall)})`}><Clock hours={10} minutes={10} r={clockR} /></g>}
      <Actor f={c.f} seed={41} who="salim" x={sx} y={BAL.floor} s={1.7} facing={-1} pose={sp}
        hold={held ? { L: <Clock hours={10} minutes={10} r={clockR / (1.7 * 1.45)} /> } : undefined} upright={{ L: true }}
        face={faceAt(c.f, [[0, face('thinking', { look: [0.3, 0.7] })], [c.at('بينهما'), face('thinking', { look: [1, -0.2] }), 14], [chose - 10, face('calm', { look: [1, 0.4] }), 12], [drop + 20, 'calm']])} />
      <WLabel x={pr[0]} y={pr[1] + 130} text="اخترت الوقت" size={50} color={PAL.calm} o={c.p(drop + 8, 14)} />
    </Stage>;
  },
  // 24 — or didn't you dare: Salim opens his mouth to speak, a lock drops into the left pan on «تجرؤ»,
  // the beam slams down to its side, his words shrink away and he shrinks back.
  24: (c) => {
    const dare = c.at('تجرؤ'), word = c.at('الكلام'), at0 = c.at('أم');
    const land = dare + 4;
    const tilt = c.f < land ? 11 : 11 + swing(c.f, land, -26);
    const pl = panAt(-1, tilt), pr = panAt(1, tilt);
    const fallY = mix(-180, pl[1] + 22, c.p(dare - 22, 26, ease.in));
    const cm = cam(700, 560, 1.18);
    const sp = poseAt(c.f, [[0, { p: pose({ turn: 0.6 }) }], [at0, { p: pose({ lean: 4, head: -4, turn: 0.6, breath: 1, R: { sh: -4, el: 12 }, L: { hand: [70, -176] } }), hands: { R: 'relaxed', L: 'open' } }, 16],
      [land, { p: pose({ lean: -9, head: 6, turn: 0.5, footR: [-34, 0], footL: [8, 0], R: { sh: -8, el: 30 }, L: { hand: [34, -198] } }), hands: { R: 'relaxed', L: 'open' } }, 10],
      [word, { p: pose({ lean: 6, bob: 4, head: 20, turn: 0.6, R: { hand: [20, -150] }, L: { hand: [28, -146] } }), hands: { R: 'relaxed', L: 'relaxed' } }, 20]]);
    const sj = J(sp.p, 300, BAL.floor, 1.7, 1);
    const bub = c.p(at0 + 6, 14) * (1 - c.p(land, 10));
    const head = toScreen(cm, [sj.head[0] + 40, sj.head[1] - sj.r]);
    return <Stage cam={cm} over={<Say text="…" to={head} above={16} o={bub} size={64} />}>
      <Paper seed={24} />
      <Floor y={BAL.floor} />
      <Balance tilt={tilt} R={<g transform="translate(0 -26)"><Clock hours={10} minutes={10} r={52} /></g>} L={c.f >= land ? <g transform="translate(0 26)"><Lock /></g> : null} />
      {c.f < land && c.f > dare - 26 && <g transform={`translate(${pl[0]} ${fallY + 4})`}><Lock /></g>}
      {c.f >= land && c.f < land + 16 && [-1, 1].map((sd) => <path key={sd} d={`M${pl[0] + sd * 150} ${pl[1] - 20} l${sd * 40} -24 M${pl[0] + sd * 156} ${pl[1] + 10} l${sd * 46} 0`} stroke={INK} strokeWidth={6} strokeLinecap="round" opacity={1 - (c.f - land) / 16} />)}
      <Actor f={c.f} seed={41} who="salim" x={300} y={BAL.floor} s={1.7} facing={1} pose={sp} say={[at0 + 6, land]}
        face={faceAt(c.f, [[0, face('neutral', { look: [0.6, 0] })], [at0, face('determined', { look: [1, 0], open2: 0.3 }), 10], [land, face('surprised', { open2: 0.1, look: [1, 0.5] }), 6], [land + 20, face('anxious', { tight: 1, look: [0.6, 0.9] }), 16]])} />
      <WLabel x={pl[0]} y={pl[1] + 130} text="لم تجرؤ" size={50} color={PAL.provoke} o={c.p(c.at('على') - 2, 14)} />
      <WLabel x={pr[0]} y={pr[1] + 130} text="اخترت الوقت" size={44} color={PAL.calm} o={0.5} />
    </Stage>;
  },
  // 25 — the chosen silence leaves a door open: in the dark hallway a door stands ajar, light spills out;
  // Salim takes the handle on «لتعود» and pulls it open on «وتتكلم»; Reem's silhouette waits inside.
  25: (c) => {
    const open1 = c.at('مفتوحا'), grab = c.at('لتعود'), speak = c.at('وتتكلم');
    const cm = cam(1000, 560, 1.15);
    const DX = 1000, DW = 220, TOP = 300, H = 520;
    const op = mix(0.3, 0.74, c.p(speak - 2, 36));
    const th = (op * 80 * Math.PI) / 180;
    const knob: V2 = [DX + 0.86 * DW * Math.cos(th), TOP - 0.86 * Math.sin(th) * 22 + 0.52 * (H + 2 * 0.86 * Math.sin(th) * 22)];
    const gap0 = DX + DW * Math.cos(th);
    const glow = 0.6 + 0.3 * c.p(open1 - 4, 16) * (1 - c.p(open1 + 30, 30) * 0.5) + 0.4 * c.p(speak, 30);
    const w = walkTo(c.f, 0, 150, 300, 1040, 1.45);
    const back = walkTo(c.f, speak - 2, speak + 34, 1040, 1040 - (1153 - knob[0]), 1.45);
    const sx = c.f < speak - 2 ? w.x : back.x;
    const hand: V2 = [(knob[0] - sx) / 1.45, (knob[1] - 860) / 1.45];
    const reach = { p: pose({ lean: 3, head: -2, turn: 0.7, L: { hand }, R: { sh: -4, el: 10 } }), hands: { R: 'relaxed' as const, L: 'grip' as const } };
    const sp = c.f < 150 ? { p: w.p } : c.f < speak - 2 ? poseAt(c.f, [[150, { p: w.p }], [151, { p: pose({ head: -6, turn: 0.75 }) }, 20], [grab - 16, { p: pose({ lean: -2, head: -4, turn: 0.75, L: { sh: 10, el: 30 } }) }, 8], [grab - 8, reach, 10]])
      : { p: { ...back.p, L: { hand }, head: -4, turn: 0.7 }, hands: reach.hands };
    return <Stage cam={cm}>
      <Room wall={PAL.wallLav} floor={PAL.floor} seed={25} />
      <path d={sketchRect(380, 330, 220, 160, 4)} fill={PAL.paper} stroke={INK} strokeWidth={LINE.normal} />
      <path d="M396 470 Q450 400 500 450 Q540 410 584 450 L584 474 L396 474 Z" fill={PAL.plant} />
      <Plant x={1560} y={834} s={0.9} seed={7} pot={PAL.paperShade} />
      <Door x={DX} w={DW} top={TOP} leaf={PAL.wood} beyond={LIGHT} open={op} seed={251}>
        <Glow x={DX + DW * 0.8} y={560} r={260} color="#FFFFFF" o={glow} />
        <rect x={DX} y={700} width={DW} height={120} fill={PAL.sofa} opacity={0.35} />
        <Ghost x={DX + 170} y={760} s={1.05} c={PAL.plum} o={0.35 * c.p(speak + 10, 30)} />
      </Door>
      <mask id="b2-m25"><rect x={-100} y={-100} width={2200} height={1300} fill="#FFFFFF" /><rect x={gap0} y={TOP} width={DX + DW - gap0} height={H} fill="#000000" /></mask>
      <rect x={-100} y={-100} width={2200} height={1300} fill={NIGHT} opacity={0.42} mask="url(#b2-m25)" />
      <path d={`M${gap0} 820 L${DX + DW} 820 L${DX + DW + 260} 1100 L${gap0 - 160 - 200 * op} 1100 Z`} fill={LIGHT} opacity={0.35 * glow} />
      <Actor f={c.f} seed={41} who="salim" x={sx} y={860} s={1.45} facing={1} pose={sp}
        face={faceAt(c.f, [[0, face('neutral', { look: [1, 0] })], [150, face('calm', { look: [1, 0.1] }), 16], [speak + 20, face('relieved', { open: 0.8, look: [1, 0] }), 20]])} />
      <Glow x={sx + 60} y={560} r={260} ry={360} color="#FFFFFF" o={0.25 * c.p(speak, 30)} />
    </Stage>;
  },
  // 26 — imposed silence piles up: day after day the calendar flips and a stone drops into his backpack;
  // from «فيتراكم» they come faster and he bends lower with each one.
  26: (c) => {
    const drops = [c.at('الصمت'), c.at('تفرضه'), c.at('نفسك'), c.at('فيتراكم'), c.at('فيتراكم') + 20, c.at('مع'), c.at('الأيام'), c.at('الأيام') + 16];
    const nAt = (f: number) => drops.filter((d) => f >= d).length;
    const n = nAt(c.f);
    const S = 1.75, Y = 960;
    let x = 1420;
    for (let f = 0; f < c.f; f++) x -= f < 8 ? 0 : 2.4 * (1 - nAt(f) / 11);
    const dist = 1420 - x;
    const jolt = drops.reduce((a, d) => a + (c.f >= d && c.f < d + 20 ? Math.sin(((c.f - d) / 20) * Math.PI) * 6 : 0), 0);
    const heavy = k(c.f, drops.map((d, i) => [d, i + 1] as [number, number]).reduce<[number, number][]>((a, kv) => a.concat([[kv[0], kv[1] - 1], [kv[0] + 14, kv[1]]]), [[0, 0]]));
    const wp = walkPhase((dist / (44 * S)) * Math.PI, 44 - heavy * 3, Math.min(1, c.f / 8));
    const p = pose({ ...wp, lean: 3 + heavy * 2.6, head: 6 + heavy * 2.6, bob: wp.bob + heavy * 1.6 + jolt, body: 0.5, turn: 0.55 });
    const top = packTop(p, x, Y, S);
    const day = Math.min(7, n + 1);
    return <Stage>
      <Paper seed={26} />
      <Floor y={Y} />
      <g transform="translate(1560 330) scale(3.4)"><Calendar day={day} /></g>
      {drops.map((d, i) => {
        const u = (c.f - (d - 14)) / 14;
        return u > 0 && u < 1 ? <g key={i} transform={`translate(1560 330) scale(3.4) translate(0 -38) rotate(${-u * 80} 28 0)`} opacity={1 - u}>
          <rect x={-28} y={0} width={56} height={38} fill="#FBFAF7" stroke={INK} strokeWidth={LINE.fine / 3.4 * 2} />
          <Ar x={-28} y={0} w={56} h={38} size={28} weight={800}>{String(i + 1)}</Ar>
        </g> : null;
      })}
      {drops.map((d, i) => {
        const u = (c.f - (d - 16)) / 16;
        return u > 0 && u < 1 ? <ellipse key={i} cx={top[0]} cy={mix(-80, top[1], ease.in(u))} rx={24} ry={17} fill={i % 2 ? PAL.metal : PAL.storm} stroke={INK} strokeWidth={4} /> : null;
      })}
      <Pack p={p} x={x} y={Y} s={S} n={n} />
      <Actor f={c.f} seed={41} who="salim" x={x} y={Y} s={S} facing={-1} pose={{ p }}
        face={faceAt(c.f, [[0, face('neutral', { look: [0.6, 0.4] })], [drops[2], face('sad', { open: 0.75, look: [0.5, 0.8] }), 16], [drops[4], face('sad', { open: 0.6, look: [0.3, 1], mouth: -0.7 }), 16]])} />
      <Pack p={p} x={x} y={Y} s={S} n={n} front />
    </Stage>;
  },
  // 27 — night, tired: Salim yawns on the bed edge on «متعب»; the phone on the nightstand buzzes and lights on «رسالة»;
  // he turns and reaches for it on «جاسر».
  27: (c) => {
    const tired = c.at('متعب'), msg = c.at('رسالة'), who = c.at('جاسر');
    const X = 830;
    const slump = Seated({ lean: 8, head: 12, turn: 0.5 });
    const yawn = { p: Seated({ lean: 2, head: -14, turn: 0.55, L: { hand: [42, -244] } }), hands: { R: 'relaxed' as const, L: 'open' as const } };
    const sp = poseAt(c.f, [[0, { p: slump }], [tired - 16, yawn, 16], [tired + 40, { p: Seated({ lean: 6, head: 10, turn: 0.5, L: { hand: [62, -124] } }) }, 20], [msg + 10, { p: Seated({ lean: 6, head: 8, turn: 0.8 }) }, 12],
      [who - 4, { p: Seated({ lean: 18, head: 12, turn: 0.8, L: { hand: [150, -152] } }), hands: { R: 'relaxed', L: 'open' } }, 22]]);
    const buzz = c.f > msg ? Math.max(0, 1 - (c.f - msg) / 60) * (Math.sin((c.f - msg) / 6) > -0.4 ? 1 : 0) : 0;
    return <Stage cam={cam(840, 590, 1.32)}>
      <Bedroom night lamp={0.7} />
      <PhoneOn x={574} y={670} lit={c.p(msg - 2, 6)} buzz={buzz} t={c.t} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={860} s={1.45} facing={-1} pose={sp}
        face={faceAt(c.f, [[0, face('sad', { open: 0.55, brow: -0.3, look: [0.2, 0.8] })], [tired - 10, face('neutral', { open: 0.05, open2: 1, width: 0.8, mouth: -0.1, brow: -0.5, browY: 0.4 }), 12], [tired + 34, face('sad', { open: 0.45, brow: -0.3, look: [0.2, 0.9] }), 16],
          [msg + 4, face('surprised', { open: 0.9, open2: 0, look: [1, 0.8] }), 10], [who, face('irritated', { brow: 0.4, look: [1, 0.8] }), 14]])} />
    </Stage>;
  },
  // 28 — the message on the screen: Jaser is typing, then his words appear one by one with the voice.
  28: (c) => {
    const ws = JASER_MSG.split(' ');
    const n = c.words.filter((w) => c.f >= Math.round(w.start * 60) - (c.at(c.words[0].word) - Math.round(c.words[0].start * 60) + 0) && false).length;
    void n;
    const shown = ws.filter((_, i) => c.f >= c.w(i) - 2).length;
    const cm = { x: 960, y: mix(560, 760, c.p(0, 70)), z: mix(1.15, 1.8, c.p(0, 70)) };
    return <Stage cam={cam(cm.x, cm.y, cm.z)}>
      <BigPhone t={c.t} screen={<ChatScreen name="جاسر" header="night" t={c.t} typing={shown ? 0 : 1}
        messages={shown ? [MY_MSG, { from: 'them', text: ws.slice(0, shown).join(' '), time: '11:40' }] : [MY_MSG]} />} />
    </Stage>;
  },
  // 29 — heat rising: close on Salim's face over the phone; a flush climbs from his neck on «تصعد», the brows drop.
  29: (c) => {
    const heat = c.at('بالحرارة'), up = c.at('تصعد'), facew = c.at('وجهه');
    const X = 860, S = 1.45;
    const p = Seated({ lean: 6, head: mix(14, 2, c.p(facew - 6, 20)), turn: 0.6, breath: 0.5 + 0.5 * Math.sin(c.f / (c.f > up ? 8 : 16)), L: { hand: [66, -170] } });
    const sj = J(p, X, 860, S, -1);
    const rise = c.p(up - 4, 70, ease.out);
    const cmx = cam(sj.head[0] - 30, sj.head[1] + 70, 2.5);
    const r = sj.r - 3;
    return <Stage cam={cmx}>
      <Bedroom night lamp={0.5} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={860} s={S} facing={-1} pose={{ p, hands: { R: 'relaxed', L: 'grip' } }}
        hold={{ L: <Phone w={26} glow={0.6} screen={<ChatScreen name="جاسر" header="night" messages={[MY_MSG, { from: 'them', text: JASER_MSG, time: '11:40' }]} />} /> }} upright={{ L: true }}
        face={faceAt(c.f, [[0, face('irritated', { brow: 0.3, mouth: -0.1, look: [1, 0.9] })], [heat, face('irritated', { look: [1, 0.9] }), 16], [up, face('angry', { open2: 0, tight: 1, mouth: -0.5, blush: 0.6, look: [1, 0.8] }), 30], [facew, face('angry', { open2: 0, tight: 1, mouth: -0.55, blush: 1, look: [1, 0.2] }), 16]])} />
      <clipPath id="b2-c29"><circle cx={sj.head[0]} cy={sj.head[1]} r={r} /><rect x={sj.head[0] - 16} y={sj.head[1] + r * 0.7} width={32} height={r * 0.7} /></clipPath>
      <linearGradient id="b2-g29" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={PAL.warn} stopOpacity={0.6} /><stop offset="0.7" stopColor={PAL.warn} stopOpacity={0.35} /><stop offset="1" stopColor={PAL.warn} stopOpacity={0} /></linearGradient>
      <g clipPath="url(#b2-c29)"><rect x={sj.head[0] - r - 10} y={sj.head[1] + r * 1.4 - rise * r * 2.9} width={2 * r + 20} height={r * 2.9} fill="url(#b2-g29)" /></g>
      {c.f > facew - 10 && [0, 1, 2].map((i) => {
        const u = ((c.f - facew + 10) / 50 + i / 3) % 1, x0 = sj.head[0] - 40 + i * 40;
        return <path key={i} d={`M${x0} ${sj.head[1] - r - 6 - u * 60} q8 -10 0 -20 q-8 -10 0 -20`} fill="none" stroke={PAL.warn} strokeWidth={4} strokeLinecap="round" opacity={(1 - u) * c.p(facew - 10, 14)} />;
      })}
      <Glow x={sj.wrL[0]} y={sj.wrL[1] - 30} r={120} color={PAL.screenGlow} o={0.35} />
    </Stage>;
  },
  // 30 — the reply he did not send: a long, sharp draft types itself fast, hesitates on «ثم», and is erased on «مسحه».
  30: (c) => {
    const typeA = c.at('كتب'), then = c.at('ثم'), del = c.at('مسحه');
    const draft = 'يا جاسر، أنت آخر شخص يحق له أن يتكلم عن الأفكار! لو كانت عندك فكرة واحدة لقلتها بدل السخرية من الآخرين';
    const typed = Array.from(draft).slice(0, Math.round(Array.from(draft).length * c.p(typeA, then - typeA - 6, ease.lin))).join('');
    const erase = c.p(del, 24, ease.in);
    return <Stage cam={cam(960, 820, 2.0)}>
      <BigPhone t={c.t} screen={<ChatScreen name="جاسر" header="night" t={c.t} draft={typed} draftCaret={Math.floor(c.f / 15) % 2 === 0 || c.f < then} erase={erase}
        messages={[MY_MSG, { from: 'them', text: JASER_MSG, time: '11:40' }]} />} />
    </Stage>;
  },
  // 31 — «لا يهم»: he puts the phone face down on the bed, lies back, crosses his arms with a forced smile;
  // the thought «لا يهم» on «لا يهم», then «لست غاضبًا» on «أنا لست».
  31: (c) => {
    const no = c.at('لا'), me = c.at('أنا');
    const X = 1000, S = 1.45;
    const lieAt = 30, lieLen = 40;
    const u = c.p(lieAt, lieLen);
    const holdP = { p: Seated({ lean: 6, head: 12, turn: 0.6, L: { hand: [62, -176] } }), hands: { R: 'relaxed' as const, L: 'grip' as const } };
    const putP = { p: Seated({ lean: 14, head: 16, turn: 0.6, L: { hand: [92, -112] } }), hands: { R: 'relaxed' as const, L: 'open' as const } };
    const lieP = { p: pose({ head: -4, turn: 0.75, R: { hand: [18, -168], bend: -1 }, L: { hand: [-6, -172], bend: -1 }, footR: [-22, 0], footL: [-14, 0], breath: 0.5 + 0.5 * Math.sin(c.f / 30) }), hands: { R: 'fist' as const, L: 'fist' as const } };
    const sp = poseAt(c.f, [[0, holdP], [4, putP, 20], [lieAt, lieP, lieLen]]);
    const hipW: V2 = [X + S * joints(sp.p).hip[0], 860 + S * joints(sp.p).hip[1]];
    const H: V2 = [mix(988, 1010, u), mix(698, 660, u)];
    const put = c.f >= 22;
    const head = toScreen(cam(1000, 600, 1.35), [mix(990, 785, u), mix(470, 590, u)]);
    return <Stage cam={cam(1000, 600, 1.35)} over={<>
      <Say think text="لا يهم" to={head} above={30} o={c.p(no - 4, 10) * (1 - c.p(me - 8, 8))} size={50} />
      <Say think text="لست غاضبًا" to={head} above={30} o={c.p(me - 2, 10)} size={50} />
    </>}>
      <Bedroom night lamp={0.5} />
      {put && <PhoneOn x={X + 140} y={704} lit={0} down />}
      <g transform={`translate(${H[0]} ${H[1]}) rotate(${-90 * u}) translate(${-hipW[0]} ${-hipW[1]})`}>
        <Actor f={c.f} seed={41} who="salim" x={X} y={860} s={S} facing={1} pose={sp}
          hold={put ? undefined : { L: <Phone w={26} glow={0.4} /> }} upright={{ L: true }}
          face={faceAt(c.f, [[0, face('irritated', { look: [1, 0.9] })], [lieAt + 20, face('neutral', { look: [1, 0] }), 14], [no - 6, face('forcedSmile', { look: [1, 0] }), 12], [me + 10, face('forcedSmile', { tight: 1, brow: 0.8, mouth: 0.4, look: [1, -0.2] }), 16]])} />
      </g>
    </Stage>;
  },
  // 32 — but he was angry: close in the dark, eyes wide open at the ceiling, jaw set; his fist closes on «غاضبًا»
  // and the swirl turns under the blanket.
  32: (c) => {
    const was = c.at('كان'), angry = c.at('غاضبا');
    const X = 1000, S = 1.45;
    const tr = shake(c.f, angry + 6, 40, 1.4, 1.3);
    const p = pose({ head: -4, turn: 0.75, R: { hand: [18, -150], bend: -1 }, L: { hand: [38 + tr, -176], bend: -1 }, footR: [-22, 0], footL: [-14, 0], breath: 0.5 + 0.5 * Math.sin(c.f / 14) });
    const hipW: V2 = [X + S * joints(p).hip[0], 860 + S * joints(p).hip[1]];
    const cm = cam(880, 630, 2.4);
    return <Stage cam={cm}>
      <Bedroom night lamp={0} />
      <g transform={`translate(1010 660) rotate(-90) translate(${-hipW[0]} ${-hipW[1]})`}>
        <Actor f={c.f} seed={41} who="salim" x={X} y={860} s={S} facing={1} pose={{ p, hands: { R: 'relaxed', L: c.f > angry ? 'fist' : 'relaxed' } }}
          face={faceAt(c.f, [[0, face('irritated', { open: 1.1, tight: 1, mouth: -0.3, look: [1, 0] })], [angry, face('angry', { open: 1.12, open2: 0, tight: 1, mouth: -0.5, look: [1, 0.1] }), 14]])} />
      </g>
      <path d={sketch([[905, 612], [1000, 604], [1120, 610], [1260, 606], [1400, 616], [1420, 712], [905, 712]], 32, 2, true)} fill="#8E9AB8" stroke={INK} strokeWidth={LINE.normal} strokeLinejoin="round" />
      <path d="M960 640 Q1080 630 1200 646 M1000 676 Q1150 666 1300 680" fill="none" stroke={INK} strokeWidth={2} opacity={0.3} />
      <ChestSwirl x={950} y={650} r={30} t={c.t} amount={c.p(was - 6, 30) * 0.9} />
      <rect x={-200} y={-200} width={2400} height={1500} fill={NIGHT} opacity={0.26} />
      <Glow x={790} y={590} r={160} color="#DCE3F2" o={0.35} />
    </Stage>;
  },
  // 33 — suppression of expression: the irritation shows on his face; he lifts a smiling mask over it on «تخفي»;
  // the swirl in his chest keeps turning and grows on «يبقى الشعور».
  33: (c) => {
    const term = c.at('كبت'), hide = c.at('تخفي'), shows = c.at('يظهر'), stays = c.at('يبقى'), feel = c.at('الشعور');
    const X = 720, Y = 1000, S = 1.9;
    const raise = c.p(hide - 12, 22);
    const sp = poseAt(c.f, [[0, { p: pose({ ...POSES.standFront.p, breath: 0.5 + 0.5 * Math.sin(c.f / 20), L: { hand: [46, -116] } }), hands: { R: 'relaxed', L: 'grip' } }],
      [c.at('علماء'), { p: pose({ ...POSES.standFront.p, head: 4, breath: 0.5 + 0.5 * Math.sin(c.f / 20), L: { hand: [46, -116] } }), hands: { R: 'relaxed', L: 'grip' } }, 20],
      [hide - 22, { p: pose({ ...POSES.standFront.p, head: 8, L: { hand: [40, -104] } }), hands: { R: 'relaxed', L: 'grip' } }, 10],
      [hide - 12, { p: pose({ ...POSES.standFront.p, head: 0, breath: 0.5 + 0.5 * Math.sin(c.f / 20), L: { hand: [36, -204] } }), hands: { R: 'relaxed', L: 'grip' } }, 22],
      [feel, { p: pose({ ...POSES.standFront.p, head: 0, breath: 0.5 + 0.5 * Math.sin(c.f / 12), L: { hand: [36, -204] }, R: { sh: -10, el: 8 } }), hands: { R: 'fist', L: 'grip' } }, 14]]);
    const sj = J(sp.p, X, Y, S, 1);
    const low: V2 = [sj.wrL[0] + 70, sj.wrL[1] + 130];
    const m: V2 = [mix(low[0], sj.head[0], ease.inOut(raise)), mix(low[1], sj.head[1] + 4, ease.inOut(raise))];
    const sw = 0.85 + 0.35 * c.p(stays - 4, 40);
    return <Stage over={<Cap text="كبت التعبير" o={c.p(term - 4, 14)} top={50} size={64} />}>
      <Paper seed={33} />
      <Floor y={Y} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={Y} s={S} facing={1} pose={sp}
        face={faceAt(c.f, [[0, face('irritated', { brow: 0.8, look: [0, 0] })], [c.at('علماء'), face('angry', { open2: 0, tight: 0.8, look: [0.5, 0.4] }), 20]])} />
      <ChestSwirl x={sj.chest[0]} y={sj.chest[1]} r={58 * mix(1, 1.25, c.p(feel - 4, 30))} t={c.t * (c.f > stays ? 1.4 : 1)} amount={sw} />
      <Mask x={m[0]} y={m[1]} hand={sj.wrL} r={sj.r * mix(0.8, 1, raise)} />
      <TopHand p={sp.p} side="L" g="grip" x={X} y={Y} s={S} fc={1} />
      <WLabel x={1420} y={300} text="ما يظهر" size={58} color={PAL.calm} o={c.p(shows - 4, 12)} />
      {c.f > shows - 4 && <path d={`M${1250} ${310} Q${1100} ${330} ${sj.head[0] + sj.r + 30} ${sj.head[1]}`} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="12 12" opacity={c.p(shows, 14)} />}
      <WLabel x={1420} y={700} text="يبقى في الداخل" size={58} color={PAL.warn} o={c.p(stays - 4, 12)} />
      {c.f > stays - 4 && <path d={`M${1180} ${700} Q${1000} ${700} ${sj.chest[0] + 80} ${sj.chest[1]}`} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="12 12" opacity={c.p(stays, 14)} />}
    </Stage>;
  },
  // 34 — imagine a pot boiling, and you press the lid down with both hands on «تضغط».
  34: (c) => {
    const boil = c.at('يغلي'), press = c.at('تضغط');
    return <Stage>
      <Pot t={c.t} boil={k(c.f, [[0, 0.45], [boil - 10, 0.45], [boil + 24, 1]])} flame={1} press={c.p(press - 26, 30, ease.out)} steamOut={0} />
    </Stage>;
  },
  // 35 — the kitchen looks calm (night window, a ticking clock, still things) but the lid jumps, and the pressure lines
  // multiply around the pot on «لا يختفي».
  35: (c) => {
    const but = c.at('لكن'), gone = c.at('يختفي');
    const S = 0.62, OX = 960 - 960 * S, OY = 1080 - 1080 * S;
    const boil = k(c.f, [[0, 0.35], [but - 6, 0.35], [but + 30, 1]]);
    const nLines = Math.round(18 * c.p(gone - 30, 34));
    const pc: V2 = [OX + 960 * S, OY + 560 * S];
    const z = mix(1, 1.12, c.p(but, 100));
    return <Stage cam={cam(960, mix(540, 640, c.p(but, 100)), z)}>
      <rect x={-200} y={-200} width={2400} height={1500} fill={PAL.wallBlue} />
      {Array.from({ length: 6 }, (_, r) => <path key={r} d={`M-20 ${OY + (300 + r * 52 * 1.0) * S} H1940`} stroke="#C4D2E2" strokeWidth={2} opacity={0.55} />)}
      <path d={sketchRect(-20, OY + 770 * S, 1960, 400, 3)} fill={PAL.wallGrey} stroke={INK} strokeWidth={LINE.normal} />
      {[60, 200, 1580, 1730].map((x, i) => <path key={i} d={sketchRect(x, OY + 800 * S, 120, 160, 20 + i, 1)} fill="none" stroke={INK} strokeWidth={LINE.fine} opacity={0.5} />)}
      {/* window with the night outside */}
      <path d={sketchRect(110, 150, 300, 280, 31)} fill={PAL.skyNight} stroke={INK} strokeWidth={LINE.normal} />
      <circle cx={330} cy={220} r={22} fill="#E8EDF2" />
      <path d="M260 150 V430 M110 290 H410" stroke={PAL.paper} strokeWidth={10} />
      <path d={sketchRect(96, 136, 328, 308, 32)} fill="none" stroke={INK} strokeWidth={LINE.normal} />
      {/* upper cabinets and the wall clock */}
      <path d={sketchRect(1340, 110, 520, 250, 33)} fill={PAL.wallGrey} stroke={INK} strokeWidth={LINE.normal} />
      <path d="M1600 110 V360" stroke={INK} strokeWidth={LINE.fine} />
      {[1570, 1630].map((x) => <path key={x} d={`M${x} 300 v40`} stroke={INK} strokeWidth={7} strokeLinecap="round" />)}
      <g transform="translate(960 190)"><Clock hours={11} minutes={50 + c.t * 0.5} r={56} /></g>
      <path d={`M960 190 L${960 + Math.sin(Math.floor(c.t) * 0.105) * 44} ${190 - Math.cos(Math.floor(c.t) * 0.105) * 44}`} stroke={PAL.provoke} strokeWidth={2.5} strokeLinecap="round" />
      {/* things that sit still on the counter */}
      <g transform={`translate(1700 ${OY + 770 * S})`}><Plant sway={Math.sin(c.t * 0.8) * 0.3} /></g>
      <g transform={`translate(220 ${OY + 770 * S - 6})`}>
        <path d={sketchRect(-90, -16, 180, 16, 40)} fill={PAL.wood} stroke={INK} strokeWidth={LINE.fine} />
        <path d="M-50 -16 Q-50 -60 0 -60 Q50 -60 50 -16 Z" fill={PAL.calmLight} stroke={INK} strokeWidth={LINE.fine} />
      </g>
      <g transform={`translate(${OX} ${OY}) scale(${S})`}>
        <Pot t={c.t} boil={boil} flame={1} press={0} steamOut={0} />
      </g>
      {Array.from({ length: nLines }, (_, i) => {
        const a = Math.PI * (1.05 + (i / 17) * 0.9) + (i % 2) * 0.06;
        const r0 = 205 + (i % 3) * 18 + Math.sin(c.t * 9 + i) * 5, len = 30 + 24 * (i % 2);
        return <path key={i} d={`M${pc[0] + Math.cos(a) * r0 * 1.3} ${pc[1] + Math.sin(a) * r0 * 0.9} L${pc[0] + Math.cos(a) * (r0 + len) * 1.3} ${pc[1] + Math.sin(a) * (r0 + len) * 0.9}`} stroke={PAL.warn} strokeWidth={6} strokeLinecap="round" />;
      })}
    </Stage>;
  },
  // 36 — the cost of holding it down: Salim tries to talk to Reem while both hands press a lid onto his chest;
  // a drop of sweat on «جهدًا»; the line between them stretches and breaks as he backs off on «أصعب».
  36: (c) => {
    const effort = c.at('جهدا'), comm = c.at('التواصل'), hard = c.at('أصعب');
    const cm = cam(1060, 560, 1.15);
    const press = pose({ lean: 3, head: 4, turn: 0.6, R: { hand: [8, -190] }, L: { hand: [28, -180] }, breath: 0.4 + 0.3 * Math.sin(c.f / 9) });
    const bw = walkTo(c.f, hard - 4, hard + 30, 1230, 1430, 1.45);
    const sx = c.f < hard - 4 ? 1230 : bw.x;
    const sp: Pose = c.f < hard - 4 ? press : { ...bw.p, R: press.R, L: press.L, head: 6, turn: 0.6 };
    const sj = J(sp, sx, 860, 1.45, -1);
    const lidC: V2 = [sj.chest[0] - 18, sj.chest[1] - 6];
    const squirt = (Math.sin(c.f / 7) > 0.6 ? 1 : 0) * clamp((c.f - 20) / 20);
    const reach = k(c.f, [[comm - 16, 0], [comm + 6, 1], [hard, 1], [hard + 24, 0]]);
    const rp = Seated({ lean: mix(0, 10, reach), head: mix(-6, -2, reach), turn: 0.6, R: { hand: [50, -128] }, L: { hand: [mix(60, 112, reach), mix(-126, -186, reach)] } });
    const rj = J(rp, HOME.sofaSeat.x, 860, 1.45 * 0.95, 1);
    const brk = c.p(hard + 6, 24);
    const a: V2 = [rj.head[0] + 60, rj.head[1] - 20], b: V2 = [sj.head[0] - 60, sj.head[1] - 20];
    const mid = (u: number): V2 => [mix(a[0], b[0], u), mix(a[1], b[1], u) - Math.sin(u * Math.PI) * 50];
    const seg = (u0: number, u1: number, droop: number) => Array.from({ length: 13 }, (_, i) => { const u = mix(u0, u1, i / 12); const q = mid(u); return `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${(q[1] + droop * Math.sin(((u - u0) / (u1 - u0 || 1)) * Math.PI * 0.5) ** 2 * 0).toFixed(1)}`; }).join(' ');
    const drop = c.p(effort - 4, 70, ease.lin);
    const sHead = toScreen(cm, [sj.head[0], sj.head[1] - sj.r]);
    return <Stage cam={cm} over={<Say text="…" to={sHead} above={14} o={c.p(24, 10) * (1 - c.p(150, 10)) + c.p(comm - 10, 10) * (1 - c.p(hard - 4, 8))} size={60} />}>
      <HomeLiving night />
      <Actor f={c.f} seed={23} who="reem" x={HOME.sofaSeat.x} y={860} s={1.45} facing={1} pose={{ p: rp, hands: { R: 'relaxed', L: 'open' } }}
        face={faceAt(c.f, [[0, face('listening', { look: [1, -0.1] })], [effort, face('anxious', { look: [1, -0.1] }), 16], [hard + 6, face('hurt', { look: [1, 0] }), 16]])} />
      <Actor f={c.f} seed={41} who="salim" x={sx} y={860} s={1.45} facing={-1} pose={{ p: sp, hands: { R: 'open', L: 'open' } }} say={[24, 150]}
        face={faceAt(c.f, [[0, face('forcedSmile', { brow: 0.6, look: [1, 0] })], [effort - 6, face('anxious', { tight: 1, brow: -0.5, look: [1, 0.2] }), 14], [hard, face('anxious', { tight: 1, look: [0.6, 0.6] }), 14]])} />
      <g transform={`translate(${lidC[0]} ${lidC[1]}) rotate(${Math.sin(c.f * 1.7) * 1.5 * squirt})`}>
        <ellipse cx={0} cy={0} rx={58} ry={54} fill={PAL.table} stroke={INK} strokeWidth={LINE.bold} />
        <ellipse cx={0} cy={0} rx={44} ry={40} fill="none" stroke={PAL.tableEdge} strokeWidth={6} />
        <path d={sketchRect(-14, -10, 28, 20, 3, 0.6)} fill={PAL.chair} stroke={INK} strokeWidth={3} />
      </g>
      {squirt > 0 && [-1, 1].map((sd) => <g key={sd} opacity={0.9}>{[0, 1].map((i) => <circle key={i} cx={lidC[0] + sd * (70 + i * 22)} cy={lidC[1] - 30 - i * 16 - (c.f % 14)} r={10 + i * 4} fill={PAL.steam} stroke={INK} strokeWidth={2.4} />)}</g>)}
      <TopHand p={sp} side="R" g="open" x={sx} y={860} s={1.45} fc={-1} />
      <TopHand p={sp} side="L" g="open" x={sx} y={860} s={1.45} fc={-1} />
      {c.f > effort - 4 && drop < 1 && <path d={`M${sj.head[0] + 46} ${sj.head[1] - 30 + drop * 60} q-9 14 0 22 q9 -8 0 -22 Z`} fill={PAL.waterLight} stroke={INK} strokeWidth={3} opacity={1 - drop * 0.6} />}
      <g opacity={c.p(comm - 12, 14)}>
        {brk <= 0 ? <path d={seg(0, 1, 0)} fill="none" stroke={PAL.focus} strokeWidth={6} strokeDasharray="16 12" strokeDashoffset={-c.f * 1.5} strokeLinecap="round" />
          : <>
            <path d={seg(0, 0.5 - 0.25 * brk, 0)} fill="none" stroke={PAL.focus} strokeWidth={6} strokeDasharray="16 12" strokeLinecap="round" opacity={1 - brk * 0.5} />
            <path d={seg(0.5 + 0.25 * brk, 1, 0)} fill="none" stroke={PAL.focus} strokeWidth={6} strokeDasharray="16 12" strokeLinecap="round" opacity={1 - brk * 0.5} />
          </>}
      </g>
    </Stage>;
  },
  // 37 — «تنظيم المشاعر»: the pot boils freely, and a hand comes in from the right toward the stove knob.
  37: (c) => {
    const title = c.at('تنظيم'), other = c.at('آخر');
    const u = c.p(c.at('المشاعر'), other - c.at('المشاعر') + 10, ease.out);
    const wr: V2 = [mix(2060, 1318, u), mix(1180, 872, u)];
    return <Stage over={<Cap text="تنظيم المشاعر" o={c.p(title - 4, 14)} top={70} size={70} />}>
      <Pot t={c.t} boil={1} flame={1} press={0} steamOut={0} knob={0} />
      <KnobArm wr={wr} turn={0} g={u > 0.85 ? 'grip' : 'open'} />
    </Stage>;
  },
  // 38 — turn the heat down: the hand turns the knob on «تخفض», the blue flame shrinks, the boil settles,
  // the lid lifts by itself and lets out a calm steam on «الغطاء».
  38: (c) => {
    const down = c.at('تخفض'), pot = c.at('القدر'), lid = c.at('على');
    const knob = c.p(down - 2, 34);
    const kAng = mix(58, -58, knob) - 58;
    const away = c.p(pot + 10, 40, ease.in);
    const wr: V2 = [mix(1318, 2080, away) + Math.cos(((kAng - 0) * Math.PI) / 180) * 0, mix(872, 1180, away)];
    const z = mix(1.7, 1, c.p(pot - 10, 60));
    return <Stage cam={cam(mix(1180, 960, c.p(pot - 10, 60)), mix(760, 540, c.p(pot - 10, 60)), z)}>
      <Pot t={c.t} boil={k(c.f, [[0, 1], [down + 20, 1], [pot + 40, 0.3]])} flame={mix(1, 0.22, c.p(down, 40))} press={0} steamOut={c.p(lid - 10, 50)} knob={knob} />
      <KnobArm wr={wr} turn={kAng * (1 - away)} g="grip" />
    </Stage>;
  },
  // 39 — admitting it to himself: on the bed edge he lays a hand on his chest on «تعترف», nods on «نعم»;
  // a card «غاضب» pops up on «غاضب», «متعب» on «متعب»; he breathes out on «أيضًا».
  39: (c) => {
    const own = c.at('تعترف'), yes = c.at('نعم'), ang = c.at('غاضب'), tir = c.at('متعب'), too = c.at('أيضا');
    const X = BEDROOM.bedSeat.x, S = 1.45;
    const ex = k(c.f, [[too - 6, 1], [too + 40, 0]]);
    const sp = poseAt(c.f, [[0, { p: Seated({ lean: 6, head: 10, turn: 0.45, breath: 0.5 + 0.5 * Math.sin(c.f / 22) }) }],
      [own - 6, { p: Seated({ lean: 4, head: 14 + nod(c.f, yes - 4, 1, 8), turn: 0.4, breath: 0.5 + 0.5 * Math.sin(c.f / 22), L: { hand: [20, -186], bend: -1 } }), hands: { R: 'relaxed', L: 'open' } }, 20],
      [too - 6, { p: Seated({ lean: mix(4, 9, 1 - ex), bob: mix(0, 3, 1 - ex), head: 8, turn: 0.55, breath: ex, L: { hand: [20, -186], bend: -1 } }), hands: { R: 'relaxed', L: 'open' } }, 20]]);
    const sj = J(sp.p, X, 860, S, 1);
    const cm = cam(1060, 560, 1.28);
    const cards: [string, string, string, number, V2, number][] = [['غاضب', PAL.provoke, PAL.provokeLight, ang, [1270, 330], -5], ['متعب', PAL.focus, PAL.focusLight, tir, [1330, 500], 4]];
    return <Stage cam={cm}>
      <Bedroom night lamp={0.8} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={860} s={S} facing={1} pose={sp}
        face={faceAt(c.f, [[0, face('sad', { look: [0.4, 0.7] })], [own, face('calm', { open: 0.5, look: [0.2, 0.9] }), 16], [ang - 4, face('irritated', { brow: 0.45, open: 0.8, look: [0.6, 0.2] }), 12], [tir - 4, face('sad', { open: 0.55, brow: -0.4, look: [0.6, 0.3] }), 12], [too, face('relieved', { open: 0.6 }), 20]])} />
      <ChestSwirl x={sj.chest[0] + 8} y={sj.chest[1]} r={38} t={c.t * 0.9} amount={0.75} />
      {cards.map(([t, col, bg, at, [cx, cy], rot]) => <g key={t}>
        {c.f > at && <path d={`M${cx - 120} ${cy + 10} Q${mix(cx, sj.chest[0], 0.5)} ${cy + 80} ${sj.chest[0] + 50} ${sj.chest[1] - 10}`} fill="none" stroke={col} strokeWidth={4} strokeDasharray="10 10" opacity={c.p(at + 6, 12) * 0.8} />}
        <Card x={cx} y={cy} text={t} color={col} bg={bg} o={c.p(at - 4, 14, ease.back)} rot={rot + Math.sin(c.t * 1.3 + cx) * 1.2} />
      </g>)}
    </Stage>;
  },
  // 40 — naming it: strings from a dark shape behind him jerk Salim's arms; a light comes on on «تسمي» and shows the
  // shape, a name card «غضب» sticks on it on «باسمه», he sees it on «بوضوح», and the strings snap on «من الخلف».
  40: (c) => {
    const name = c.at('تسمي'), feel = c.at('الشعور'), card = c.at('باسمه'), see = c.at('فتراه'), clear = c.at('بوضوح'), move = c.at('يحركك'), snap = c.at('الخلف') - 8;
    const X = 960, Y = 1000, S = 1.72;
    const base = { p: pose({ ...POSES.standFront.p, R: { hand: [-46, -124] }, L: { hand: [46, -124] } }), hands: { R: 'relaxed' as const, L: 'relaxed' as const } };
    const upL = { p: pose({ ...POSES.standFront.p, head: -4, R: { hand: [-48, -128] }, L: { hand: [76, -236] } }), hands: base.hands };
    const upR = { p: pose({ ...POSES.standFront.p, head: 4, R: { hand: [-76, -236] }, L: { hand: [48, -128] } }), hands: base.hands };
    const free = { p: pose({ ...POSES.standFront.p, head: -2, R: { sh: -10, el: 8 }, L: { sh: 10, el: 8 }, breath: 0.6 }), hands: { R: 'open' as const, L: 'open' as const } };
    const sp = poseAt(c.f, [[0, base], [6, upL, 12], [26, base, 14], [44, upR, 12], [64, base, 14], [move - 6, upL, 10], [move + 12, upR, 10], [move + 30, base, 12], [snap + 2, free, 18]]);
    const sj = J(sp.p, X, Y, S, 1);
    const lit = c.p(name - 4, 12);
    const reveal = c.p(feel - 4, 30);
    const clr = c.p(clear - 6, 30);
    const tug = (sj.wrR[1] - sj.wrL[1]) * 0.06;
    const bar: V2 = [X, 150];
    const ends: [V2, V2] = [[bar[0] - 170, bar[1] + tug * 10], [bar[0] + 170, bar[1] - tug * 10]];
    const sn = c.p(snap, 16, ease.out);
    const string = (from: V2, to: V2, key: string) => {
      if (c.f < snap) return <path key={key} d={`M${from[0]} ${from[1]} L${to[0]} ${to[1]}`} stroke={INK} strokeWidth={3} />;
      const m1: V2 = [mix(from[0], to[0], 0.5 - 0.42 * sn), mix(from[1], to[1], 0.5 - 0.42 * sn)];
      const m2: V2 = [mix(to[0], from[0], 0.5 - 0.45 * sn), mix(to[1], from[1], 0.5 - 0.45 * sn) + sn * 30];
      return <g key={key} opacity={1 - sn * 0.85}>
        <path d={`M${from[0]} ${from[1]} Q${m1[0] + 10} ${(from[1] + m1[1]) / 2} ${m1[0]} ${m1[1]}`} stroke={INK} strokeWidth={3} fill="none" />
        <path d={`M${to[0]} ${to[1]} Q${m2[0] - 14} ${(to[1] + m2[1]) / 2} ${m2[0]} ${m2[1]}`} stroke={INK} strokeWidth={3} fill="none" />
      </g>;
    };
    const blobC: V2 = [X + 20, 330];
    const blobPts = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; const rr = 1 + Math.sin(i * 2.3) * 0.08 + Math.sin(c.t * 1.5 + i) * 0.02; return [blobC[0] + Math.cos(a) * 400 * rr, blobC[1] + Math.sin(a) * 210 * rr] as V2; });
    const fly = c.p(card - 16, 18, ease.out);
    const cardP: V2 = [mix(330, 1250, fly), mix(250, 230, fly) - Math.sin(fly * Math.PI) * 90];
    return <Stage>
      <Paper seed={40} />
      <Floor y={Y} />
      {/* the spotlight on the left and its beam */}
      <path d={`M300 218 L${mix(300, 1000, lit)} ${mix(218, 130, lit)} L${mix(300, 1120, lit)} ${mix(218, 560, lit)} Z`} fill="#FFFFFF" opacity={0.55 * lit} />
      <g transform="translate(250 200) rotate(20)">
        <path d={sketchRect(-60, -40, 110, 80, 41, 1)} fill={PAL.chair} stroke={INK} strokeWidth={LINE.bold} />
        <path d="M50 -50 L80 -60 L80 60 L50 50 Z" fill={lit > 0.5 ? '#FFFFFF' : PAL.metal} stroke={INK} strokeWidth={LINE.normal} strokeLinejoin="round" />
      </g>
      <path d="M240 240 L200 520 M260 240 L300 520" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      {/* the feeling behind him: a dark shape until the light shows it */}
      <path d={sketch(blobPts, 40, 6, true)} fill={reveal > 0 ? PAL.plum : INK} opacity={mix(0.55, 0.3, reveal) * mix(1, 0.75, clr)} stroke={INK} strokeWidth={mix(0, 5, reveal)} />
      {reveal > 0 && <ChestSwirl x={blobC[0] - 140} y={blobC[1] + 20} r={110} t={c.t * mix(1.2, 0.6, clr)} amount={reveal * 0.9} color={PAL.warn} />}
      {[-1, 1].map((sd) => <path key={sd} d={`M${blobC[0] + sd * 150} ${blobC[1] - 120} Q${blobC[0] + sd * 190} ${bar[1] + 40} ${ends[sd === -1 ? 0 : 1][0]} ${ends[sd === -1 ? 0 : 1][1]}`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" opacity={mix(0.55, 0.35, reveal)} />)}
      <path d={`M${ends[0][0] - 20} ${ends[0][1]} L${ends[1][0] + 20} ${ends[1][1]}`} stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d={`M${ends[0][0] - 20} ${ends[0][1]} L${ends[1][0] + 20} ${ends[1][1]}`} stroke={PAL.wood} strokeWidth={9} strokeLinecap="round" />
      {string(ends[0], sj.wrR, 'r')}
      {string(ends[1], sj.wrL, 'l')}
      {c.f >= snap && c.f < snap + 14 && [sj.wrR, sj.wrL].map((w, i) => <g key={i} opacity={1 - (c.f - snap) / 14}>{[0, 1, 2, 3].map((j) => { const a = (j / 4) * Math.PI * 2 + 0.4; const m: V2 = [mix(ends[i][0], w[0], 0.5), mix(ends[i][1], w[1], 0.5)]; return <path key={j} d={`M${m[0] + Math.cos(a) * 14} ${m[1] + Math.sin(a) * 14} L${m[0] + Math.cos(a) * 34} ${m[1] + Math.sin(a) * 34}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />; })}</g>)}
      <Actor f={c.f} seed={41} who="salim" x={X} y={Y} s={S} facing={1} pose={sp}
        face={faceAt(c.f, [[0, face('anxious', { look: [0, 0.2] })], [see - 4, face('surprised', { open2: 0.2, look: [0.6, -1] }), 12], [clear, face('thinking', { look: [0.6, -1] }), 16], [snap + 6, face('relieved', { open: 0.7 }), 16]])} />
      <Card x={cardP[0]} y={cardP[1]} text="غضب" color={PAL.provoke} bg="#FFFFFF" o={c.p(card - 16, 8)} rot={mix(-30, -6, fly)} />
    </Stage>;
  },
};
