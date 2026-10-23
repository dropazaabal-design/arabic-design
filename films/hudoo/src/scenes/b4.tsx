import React from 'react';
import { TITLE } from '../fonts';
import { Character } from '../kit/characters/Character';
import { CAST, type Look } from '../kit/characters/cast';
import { EXPRESSIONS, type Face } from '../kit/characters/face';
import type { Gesture } from '../kit/characters/hands';
import { POSES } from '../kit/characters/poses';
import { mixPose, pose, walkPhase, type Pose } from '../kit/characters/skeleton';
import { Bedroom, BEDROOM } from '../kit/places/Bedroom';
import { DeskBack, DeskFront, DESK } from '../kit/places/OfficeDesk';
import { Street } from '../kit/places/Street';
import { Gap, Loop, LOOP_ENTRIES, LOOP_NODES, SingleDoor, SINGLE_DOOR, Tree, gapLayout } from '../kit/metaphors';
import { Puffs, flame, heart, ease as smooth01, seg } from '../kit/metaphors/util';
import { IconBody, IconCheck, IconEye, IconThought, Phone, SpeechBubble, ThoughtCloud } from '../kit/props';
import { INK, PAL } from '../kit/style';
import { Actor, Cap, CAM0, Paper, Say, Stage, camMix, ease, faceAt, k, mix, poseAt, toScreen } from '../film/engine';
import type { ShotRender } from '../film/Film';
import { Arrow, ChestSwirl, Floor, MEET_FEET, MEET_S, Meeting, SEAT, WLabel, atTable, cam, nod, shake } from './common';

// Chapter 5 «قوة هادئة» (end), chapter 6 «الفكرة والجسد والانفعال», start of chapter 7 «المسافة»: shots 61–80.
const face = (base: keyof typeof EXPRESSIONS, o: Partial<Face>): Face => ({ ...EXPRESSIONS[base], ...o });
const S = (p: Pose, R: Gesture = 'relaxed', L: Gesture = 'relaxed') => ({ p, hands: { R, L } });
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const sitP = (o: Partial<Pose>) => pose({ sit: 1, footR: [52, 0], footL: [64, 0], ...o });
type ActorProps = React.ComponentProps<typeof Actor>;

/** Raised shoulders: torso and arms ride up `lift`×12 units while head and legs stay, so the head sinks between the shoulders. */
const Lifted: React.FC<ActorProps & { lift: number }> = ({ lift, ...a }) => {
  if (lift <= 0.01) return <Actor {...a} />;
  const dy = lift * 12 * (a.s ?? 1);
  return <g>
    <Actor {...a} only={['RightLeg', 'LeftLeg']} />
    <Actor {...a} y={(a.y ?? 0) - dy} only={['Torso', 'RightArm', 'LeftArm']} />
    <Actor {...a} only={['Head']} />
  </g>;
};

/** Short rose strokes flaring off each shoulder (the first point is the viewer-left shoulder). */
const Tension: React.FC<{ at: [number, number][]; s: number; o: number; t: number }> = ({ at, s, o, t }) => o <= 0.01 ? null : (
  <g opacity={Math.min(1, o)}>
    {at.map(([x, y], i) => {
      const side = i === 0 ? -1 : 1, j = 1 + 0.1 * Math.sin(t * 7 + i * 2);
      return <g key={i} transform={`translate(${x} ${y}) scale(${side * s * j} ${s * j})`}>
        <path d="M10 -16 L22 -30 M18 -4 L36 -12 M2 -26 L6 -42" stroke={PAL.warn} strokeWidth={5} strokeLinecap="round" fill="none" />
      </g>;
    })}
  </g>
);

/** A chevron (up or down) used to show shoulders rising or dropping. */
const Chevron: React.FC<{ x: number; y: number; dir: 1 | -1; o: number; color: string; s?: number }> = ({ x, y, dir, o, color, s = 1 }) => o <= 0.01 ? null : (
  <path d={`M${x - 18 * s} ${y + dir * 10 * s} L${x} ${y - dir * 10 * s} L${x + 18 * s} ${y + dir * 10 * s}`} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={Math.min(1, o)} />
);

/** The loop's doorway as a corner badge for shots 73–75: which way in this shot takes. */
const EntryBadge: React.FC<{ kind: 'thought' | 'body' | 'eye'; text: string; o: number }> = ({ kind, text, o }) => {
  if (o <= 0.001) return null;
  const u = Math.min(1, o);
  return <div style={{ position: 'absolute', right: 56, top: 40, width: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: u, transform: `scale(${mix(0.7, 1, u)})`, transformOrigin: '50% 0' }}>
    <svg width={150} height={166} viewBox="-75 -94 150 166">
      <path d="M-62 68 L-62 -20 Q-62 -88 0 -88 Q62 -88 62 -20 L62 68 Z" fill={PAL.calmLight} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M-42 68 L-42 -14 Q-42 -64 0 -64 Q42 -64 42 -14 L42 68 Z" fill="#FFFFFF" />
      <g transform="translate(0 10)">{kind === 'thought' ? <IconThought s={66} /> : kind === 'body' ? <IconBody s={66} /> : <IconEye s={66} />}</g>
    </svg>
    <div dir="rtl" lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 44, color: PAL.calm, background: 'rgba(243,241,236,0.92)', borderRadius: 20, padding: '0 20px 8px', whiteSpace: 'nowrap' }}>{text}</div>
  </div>;
};

/** One of the loop's three nodes drawn alone (same art as the Loop metaphor), centred at x,y with radius r. */
const NodeArt: React.FC<{ kind: 'thought' | 'emotion' | 'body'; x: number; y: number; r: number; t: number; o?: number; lit?: number }> = ({ kind, x, y, r, t, o = 1, lit = 0 }) => {
  if (o <= 0.01 || r <= 1) return null;
  const tint = kind === 'thought' ? '#DCD5EF' : kind === 'emotion' ? '#F3D3DE' : '#D3E0F2';
  const fl = 1 + lit * 0.15 + Math.sin(t * 9) * 0.04, beat = 1 + 0.12 * Math.max(0, Math.sin(t * 9));
  return <g opacity={Math.min(1, o)} transform={`translate(${x} ${y}) scale(${r / 104})`}>
    {lit > 0 && <circle r={126} fill={tint} opacity={Math.min(1, lit)} />}
    <circle r={104} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
    {kind === 'thought' && <g>
      <Puffs c={[[-30, 4, 26], [-4, -18, 32], [28, -4, 28], [6, 14, 26]]} fill="#FFFFFF" line={3.6} seed={3} />
      <circle cx={-40} cy={46} r={9} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
      <circle cx={-56} cy={64} r={5.5} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
    </g>}
    {kind === 'emotion' && <g>
      <path d={flame(0, 46, 74 * fl, 112 * fl, Math.sin(t * 5) * 8)} fill={PAL.warn} stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />
      <path d={flame(0, 46, 40 * fl, 64 * fl, Math.sin(t * 5 + 1) * 5)} fill="#F1B9CB" />
      <path d={flame(0, 46, 18 * fl, 30 * fl, 0)} fill={PAL.flameCore} />
    </g>}
    {kind === 'body' && <g transform="translate(0 8)">
      <path d="M-58 66 L-54 10 Q-48 -8 -24 -12 L24 -12 Q48 -8 54 10 L58 66 Z" fill={PAL.calm} stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />
      <circle cx={0} cy={-42} r={26} fill="#F4E6E1" stroke={INK} strokeWidth={3.6} />
      <path d={heart(8, 26, 36 * beat)} fill={PAL.warn} stroke={INK} strokeWidth={2.4} />
    </g>}
  </g>;
};

/** A phone lying on a desk, seen a little from above: `lit` screen, `hop` lifts it during a buzz, `buzz` shows vibration marks. */
const DeskPhone: React.FC<{ x: number; y: number; lit: number; buzz: number; hop: number }> = ({ x, y, lit, buzz, hop }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={2} rx={64} ry={6} fill={INK} opacity={0.12} />
    {lit > 0 && <ellipse cx={0} cy={-20} rx={110} ry={46} fill={PAL.screenGlow} opacity={0.45 * lit} />}
    <g transform={`translate(0 ${-hop})`}>
      <path d="M-62 0 L58 0 L58 6 L-62 6 Z" fill="#262C38" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M-62 0 L58 0 L44 -30 L-48 -30 Z" fill="#3B4456" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M-52 -4 L48 -4 L37 -26 L-40 -26 Z" fill={lit > 0 ? PAL.screenGlow : PAL.screen} />
      {lit > 0 && <path d="M-34 -10 L28 -10 L24 -19 L-29 -19 Z" fill="#FFFFFF" stroke={PAL.focus} strokeWidth={1.6} opacity={lit} />}
    </g>
    {buzz > 0 && [-1, 1].map((s) => <path key={s} d={`M${s * 74} -26 q${s * 10} 14 0 28 M${s * 90} -20 q${s * 7} 9 0 18`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={buzz} />)}
  </g>
);

/** A briefcase hanging from a gripping hand (drawn `upright`, so it always hangs straight down). */
const Bag: React.FC = () => (
  <g strokeLinejoin="round">
    <path d="M-8 4 Q-8 -7 0 -7 Q8 -7 8 4" fill="none" stroke={INK} strokeWidth={2.6} />
    <rect x={-24} y={3} width={48} height={32} rx={5} fill={PAL.chairDark} stroke={INK} strokeWidth={2.2} />
    <rect x={-24} y={3} width={48} height={10} rx={4} fill={PAL.chair} stroke={INK} strokeWidth={1.6} />
    <rect x={-4} y={9} width={8} height={6} rx={1.5} fill={PAL.metal} stroke={INK} strokeWidth={1.2} />
  </g>
);

/** A sheet of notes held by its lower edge (hand units, `upright`). */
const Sheet: React.FC = () => (
  <g>
    <path d="M-22 2 L22 2 L22 -60 L-14 -60 L-22 -52 Z" fill="#FFFFFF" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
    {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M16 ${-46 + i * 9} H${-14 + (i % 2) * 8}`} stroke={PAL.textSoft} strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />)}
  </g>
);

/** The pale shadow of a choice not taken (retreat / attack) in shot 62. */
const SHADE: Look = { ...CAST.salim, name: 'ظل', skin: '#ECE9E7', hairColor: '#A9AEB6', shirt: '#C6CBD3', shirtShade: '#B3B9C3', pants: '#B3B9C3', shoe: '#A9AEB6' };

/** A dimension line between two points (both ends ticked), drawn from the centre out. */
const Span: React.FC<{ x0: number; x1: number; y: number; p: number; color?: string }> = ({ x0, x1, y, p, color = PAL.calm }) => {
  if (p <= 0.01) return null;
  const m = (x0 + x1) / 2, h = ((x1 - x0) / 2) * Math.min(1, p);
  return <g stroke={color} strokeWidth={6} strokeLinecap="round" fill="none" opacity={Math.min(1, p * 3)}>
    <path d={`M${x0} ${y - 56} V${y + 22} M${x1} ${y - 56} V${y + 22}`} strokeDasharray="10 10" />
    <path d={`M${m - h} ${y} H${m + h}`} />
    {p > 0.95 && <path d={`M${x0 + 20} ${y - 14} L${x0 + 4} ${y} L${x0 + 20} ${y + 14} M${x1 - 20} ${y - 14} L${x1 - 4} ${y} L${x1 - 20} ${y + 14}`} strokeLinejoin="round" />}
  </g>;
};
/** Top of the calm middle stone of the Gap metaphor (it rises as the gap opens). */
const midTop = (open: number) => 770 + (1 - smooth01(seg(open, 0.15, 0.7))) * 80;

/** A cartoon eye in an extreme close-up: `blink` 0 open … 1 shut, `look` moves the pupil. */
const BigEye: React.FC<{ x: number; y: number; w: number; h: number; blink: number; look: [number, number] }> = ({ x, y, w, h, blink, look }) => {
  const top = mix(-h * 1.25, h * 0.75, blink), bot = h * 0.8;
  const shape = `M${-w / 2} 0 Q0 ${top} ${w / 2} 0 Q0 ${bot} ${-w / 2} 0 Z`;
  return <g transform={`translate(${x} ${y})`}>
    <clipPath id="b4-eye"><path d={shape} /></clipPath>
    <path d={shape} fill="#FFFFFF" />
    <g clipPath="url(#b4-eye)">
      <circle cx={look[0] * w * 0.16} cy={look[1] * h * 0.25 + 6} r={h * 0.62} fill={INK} />
      <circle cx={look[0] * w * 0.16 + h * 0.22} cy={look[1] * h * 0.25 - h * 0.2} r={h * 0.16} fill="#FFFFFF" />
    </g>
    <path d={`M${-w / 2} 0 Q0 ${bot} ${w / 2} 0`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <path d={`M${-w / 2 - 8} 4 Q0 ${top} ${w / 2 + 8} 4`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
  </g>;
};

/** A letter: folded (an envelope) at open 0, a sheet with words at open 1. Centre x,y. */
const Letter: React.FC<{ x: number; y: number; w: number; h: number; open: number; o: number; l1: number; l2: number }> = ({ x, y, w, h, open, o, l1, l2 }) => o <= 0.01 ? null : (
  <g opacity={Math.min(1, o)} transform={`translate(${x} ${y})`}>
    <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={8} fill={INK} opacity={0.12} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
    {open < 0.6 && <path d={`M${-w / 2} ${-h / 2} L0 ${h * 0.08} L${w / 2} ${-h / 2}`} fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" opacity={1 - open / 0.6} />}
    {open < 0.6 && <circle cx={0} cy={h * 0.08} r={Math.min(w, h) * 0.1} fill={PAL.warn} stroke={INK} strokeWidth={2.4} opacity={1 - open / 0.6} />}
    {open > 0.6 && <path d={`M${-w / 2 + 14} 0 H${w / 2 - 14}`} stroke={INK} strokeWidth={1.6} strokeDasharray="6 8" opacity={0.25} />}
    <WLabel x={0} y={-h * 0.14} text="انتبه" size={78} color={PAL.provoke} o={l1} w={w} />
    <WLabel x={0} y={h * 0.26} text="هنا شيء يهمك" size={44} o={l2} w={w} />
  </g>
);

export const SHOTS: Record<number, ShotRender> = {
  // 61 — out of the imagined outburst: the cloud with the shouting scene pops; on «القوة» he straightens, breathes in on «الهادئة», nods on «مختلف».
  61: (c) => {
    const up = c.at('القوة'), calm = c.at('الهادئة'), diff = c.at('مختلف');
    const cm = cam(1000, 520, 1.45);
    const pz = poseAt(c.f, [
      [-20, S(sitP({ lean: 12, head: 12, bob: 3, turn: 0.4, R: { hand: [56, -124] }, L: { hand: [66, -122] } }), 'fist', 'fist')],
      [up - 6, S(sitP({ lean: -3, head: -5, turn: 0.55, R: { hand: [50, -126] }, L: { hand: [62, -124] } }), 'relaxed', 'open'), 30],
    ]);
    const p = { ...pz.p, breath: k(c.f, [[up + 8, 0], [calm + 28, 1], [c.dur, 0.35]]), head: pz.p.head + nod(c.f, diff + 4, 1, 6) };
    const fant = 1 - c.p(-8, 34);
    return <Stage cam={cm} over={<Cap text="القوة الهادئة" o={c.p(calm - 4, 14)} top={50} size={64} />}>
      <Bedroom night lamp={0.85} />
      <Actor f={c.f} seed={41} who="salim" x={BEDROOM.bedSeat.x} y={860} s={1.45} facing={1} pose={{ p, hands: pz.hands }}
        face={faceAt(c.f, [[-20, face('irritated', { look: [0.3, 0.5] })], [up, face('neutral', { look: [0.6, -0.1] }), 16], [calm, face('calm', { look: [0.7, -0.2] }), 20]])} />
      {fant > 0.01 && <g transform={`translate(1300 330) scale(${mix(0.55, 1, fant)})`} opacity={fant}>
        <ThoughtCloud w={460} h={310} tail={[-300, 115]}>
          <g>
            <rect x={-20} y={26} width={180} height={18} rx={4} fill={PAL.table} stroke={INK} strokeWidth={3} />
            <Character who="salim" x={-70} y={100} s={0.5} facing={1} face="shout" p={pose({ lean: 8, head: -8, turn: 0.6, L: { hand: [96, -150] }, R: { hand: [30, -300] } })} hands={{ R: 'fist', L: 'fist' }} />
          </g>
        </ThoughtCloud>
      </g>}
    </Stage>;
  },
  // 62 — the parts of quiet strength: a steady sound wave on «صوت ثابت», a short clear bubble on «وكلمات واضحة», feet planted on «وجسد»
  // while pale shadows of retreat («يتراجع») and attack («يهاجم») slip out of him and are struck off.
  62: (c) => {
    const voice = c.at('صوت'), steady = c.at('ثابت'), words = c.at('وكلمات'), clear = c.at('واضحة'), body = c.at('وجسد'), back = c.at('يتراجع'), att = c.at('يهاجم');
    const X = 1230, FY = 980, s = 2.2;
    const hy = FY - 283 * s;
    const draw = c.p(voice - 4, 60, ease.out);
    const wy = hy + 54, wx0 = X - 118;
    const wave = Array.from({ length: 61 }, (_, i) => {
      const u = i / 60, x = wx0 - 760 * draw * u;
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${(wy + Math.sin(((wx0 - x) / 72) * Math.PI * 2 - c.t * 7) * 22 * Math.min(1, u * 6)).toFixed(1)}`;
    }).join(' ');
    const gb = k(c.f, [[back - 16, 0], [back + 6, 1], [back + 34, 1], [back + 56, 0]]);
    const ga = k(c.f, [[att - 16, 0], [att + 6, 1], [att + 22, 1], [att + 42, 0]]);
    const plant = c.p(body - 6, 16);
    const pz = poseAt(c.f, [
      [0, 'stand'],
      [voice - 8, S(pose({ turn: 0.5, R: { sh: -6, el: 10 }, L: { hand: [62, -172] } }), 'relaxed', 'open'), 16],
      [clear - 6, S(pose({ turn: 0.5, head: 3, R: { sh: -6, el: 10 }, L: { hand: [72, -188] } }), 'relaxed', 'chop'), 12],
      [clear + 26, S(pose({ turn: 0.5, R: { sh: -6, el: 10 }, L: { hand: [62, -172] } }), 'relaxed', 'open'), 16],
      [body - 10, S(pose({ turn: 0.45, head: -2, footR: [-26, 0], footL: [24, 0], R: { sh: -8, el: 8 }, L: { sh: 8, el: 8 } })), 18],
    ]);
    const strike = (a: number) => c.p(a + 34, 12);
    const shadeLabel = (x: number, text: string, a: number, o: number) => o > 0.01 && <g>
      <WLabel x={x} y={FY + 48} text={text} size={44} color={PAL.textSoft} o={o} />
      <path d={`M${x - 70} ${FY + 44} L${x - 70 + 140 * strike(a)} ${FY + 44}`} stroke={PAL.provoke} strokeWidth={6} strokeLinecap="round" opacity={strike(a) > 0 ? o : 0} />
    </g>;
    return <Stage over={<Say text="أريد أن أكمل فكرتي" to={toScreen(CAM0, [X - 6, FY - 334 * s + 6])} above={10} size={44} o={c.p(words - 4, 10) * (1 - 0.4 * c.p(body + 10, 20))} />}>
      <Paper seed={62} />
      <Floor y={FY} seed={62} />
      <path d={wave} stroke={PAL.calm} strokeWidth={8} fill="none" strokeLinecap="round" opacity={draw > 0 ? 1 : 0} />
      <WLabel x={wx0 - 520} y={wy - 86} text="صوت ثابت" size={48} color={PAL.calm} o={c.p(steady - 2, 12)} />
      {/* the two shadows: retreat slides back (+x), attack lunges forward (−x) */}
      {gb > 0.01 && <Character who={SHADE} x={X + 280 * gb} y={FY} s={s} facing={-1} o={0.55 * gb} face="anxious" p={pose({ lean: -12, head: -8, turn: 0.4, footR: [-30, 0], footL: [10, 0], L: { hand: [40, -200] }, R: { sh: -14, el: 20 } })} hands={{ L: 'stop', R: 'relaxed' }} />}
      {ga > 0.01 && <Character who={SHADE} x={X - 300 * ga} y={FY} s={s} facing={-1} o={0.55 * ga} face="angry" p={pose({ lean: 10, head: 2, turn: 0.7, footR: [-20, 0], footL: [34, 0], L: { sh: 84, el: 4 }, R: { sh: -20, el: 30 } })} hands={{ L: 'point', R: 'fist' }} />}
      {shadeLabel(X + 300, 'تراجع', back, c.p(back - 10, 12) * mix(1, 0.6, strike(back)))}
      {shadeLabel(X - 320, 'هجوم', att, c.p(att - 10, 12) * mix(1, 0.6, strike(att)))}
      {/* planted feet */}
      {plant > 0.01 && <g opacity={plant}>
        {[-1, 1].map((d) => <g key={d}>
          <ellipse cx={X + d * 36} cy={FY + 6} rx={46} ry={11} fill={PAL.calm} opacity={0.75} />
          {[0, 1, 2].map((i) => <path key={i} d={`M${X + d * 36 - 20 + i * 20} ${FY + 18} l${-4 + i * 4} ${18 * plant}`} stroke={PAL.calm} strokeWidth={4} strokeLinecap="round" />)}
        </g>)}
      </g>}
      <Actor f={c.f} seed={41} who="salim" x={X} y={FY} s={s} facing={-1} pose={pz} say={[voice, clear + 36]}
        face={faceAt(c.f, [[0, 'calm'], [voice, face('determined', { mouth: 0.25, tight: 0.1 })], [back - 6, face('determined', { mouth: 0.15, brow: 0.35, look: [0.4, 0] }), 14]])} />
    </Stage>;
  },
  // 63 — a tree on the hill: the gust arrives on «الريح», the branches give on «تتحرك أغصانها», the roots are cut open on «جذورها» and hold.
  63: (c) => {
    const wind = c.at('الريح'), roots = c.at('جذورها');
    const w = k(c.f, [[0, 0.12], [wind - 8, 0.12], [wind + 30, 1]]);
    const cm = camMix(cam(960, 470, 1.15), CAM0, c.p(roots - 30, 70));
    return <Stage cam={cm}><Tree t={c.t + 4} wind={w} roots={c.p(roots - 6, 80)} /></Stage>;
  },
  // 64 — back in the meeting: Jaser gets the last word («كما قلت، لن تنجح»); Salim smiles, lets it go with an open palm on «تنتصر»,
  // then picks up his notes on «كل جملة». Jaser, left with no fight, looks over.
  64: (c) => {
    const need = c.at('تحتاج'), win = c.at('تنتصر'), every = c.at('كل');
    const cm = cam(1330, 500, 1.9);
    const seat = (o: Partial<Pose>) => pose({ sit: 1, footR: [50, 0], footL: [62, 0], ...o });
    const jp = poseAt(c.f, [
      [0, S(seat({ lean: 6, head: 2, turn: 0.75, R: { hand: [58, -156] }, L: { hand: [92, -186] } }), 'relaxed', 'chop')],
      [36, S(seat({ lean: 8, head: 5, turn: 0.75, R: { hand: [58, -156] }, L: { hand: [96, -162] } }), 'relaxed', 'chop'), 10],
      [70, S(seat({ lean: 6, head: 0, turn: 0.75, R: { hand: [58, -156] }, L: { hand: [90, -198] } }), 'relaxed', 'point'), 14],
      [win - 6, S(seat({ lean: -8, head: -6, turn: 0.6, R: { hand: [22, -186], bend: -1 }, L: { hand: [-2, -190], bend: -1 } }), 'fist', 'fist'), 20],
    ]);
    const sp = poseAt(c.f, [
      [0, S(atTable({ turn: 0.75, head: 2 }))],
      [win - 8, S(seat({ turn: 0.7, head: -2, R: { hand: [58, -156] }, L: { hand: [74, -204] } }), 'relaxed', 'open'), 14],
      [every - 12, S(seat({ turn: 0.45, head: 10, R: { hand: [58, -156] }, L: { hand: [78, -152] } }), 'relaxed', 'grip'), 12],
      [every + 4, S(seat({ turn: 0.3, head: 16, R: { hand: [58, -156] }, L: { hand: [62, -214] } }), 'relaxed', 'grip'), 18],
    ]);
    const salimP = { p: { ...sp.p, head: sp.p.head + nod(c.f, need + 4, 1, 7) }, hands: sp.hands };
    const jHead = toScreen(cm, [SEAT[4] + 24, MEET_FEET - 330 * MEET_S]);
    return <Stage cam={cm} over={<Say text="كما قلت، لن تنجح" to={jHead} above={8} size={46} o={c.p(4, 10) * (1 - c.p(win + 6, 10))} />}>
      <Meeting f={c.f} seats={[null, null, null,
        { who: 'att2', p: atTable({ turn: mix(0.5, 0.8, c.p(every, 20)), head: 2 }), face: faceAt(c.f, [[0, { ...EXPRESSIONS.listening, look: [0.6, 0] }], [every + 6, face('smile', { mouth: 0.45, look: [1, 0] }), 16]]) },
        { who: 'jaser', facing: 1, p: jp.p, hands: jp.hands, say: [6, win - 10], face: faceAt(c.f, [[0, face('smug', { open2: 0.1 })], [win, 'smug'], [every + 20, face('smug', { skew: 0.2, browY: 0.35, brow: 0, look: [0.8, 0.2] }), 20]]) },
        null]}
        extra={<Actor f={c.f} seed={41} who="salim" x={SEAT[5]} y={MEET_FEET} s={MEET_S} facing={-1} pose={salimP}
          hold={c.f >= every + 2 ? { L: <Sheet /> } : undefined} upright={{ L: true }}
          face={faceAt(c.f, [[0, face('calm', { look: [0.9, 0] })], [win - 6, face('smile', { mouth: 0.6, look: [0.9, 0] }), 12], [every, face('calm', { look: [0.2, 0.8], mouth: 0.5 }), 16]])} />} />
    </Stage>;
  },
  // 65 — next morning: Salim walks to work with his bag, head up; nods to himself on «تفخر», lifts his eyes on «غدًا».
  65: (c) => {
    const proud = c.at('تفخر'), tmr = c.at('غدا');
    const v = 3.0, pan = 0.08 + (c.f * v) / 1400, ph = ((c.f * v) / (44 * 1.45)) * Math.PI;
    const wp = walkPhase(ph, 44, 1);
    const up = c.p(tmr - 10, 24);
    const p = pose({ lean: 2, turn: 0.45, ...wp, head: -5 - 5 * up + nod(c.f, proud, 2, 10), R: { sh: -4 + Math.sin(ph) * 8, el: 10 } });
    return <Stage cam={cam(960, 560, 1.15)}>
      <Street pan={pan} />
      <Actor f={c.f} seed={41} who="salim" x={860} y={880} s={1.45} facing={1} pose={{ p, hands: { R: 'grip', L: 'relaxed' } }} hold={{ R: <Bag /> }} upright={{ R: true }}
        face={faceAt(c.f, [[0, face('calm', { mouth: 0.5, look: [0.5, -0.1] })], [proud - 6, face('smile', { mouth: 0.85, look: [0.3, 0.3] }), 14], [tmr, face('smile', { look: [0.7, -0.6] }), 16]])} />
    </Stage>;
  },
  // 66 — at his desk the phone buzzes on «لماذا»; he stops typing, tenses on «يصعب»; a big question mark on «الهدوء»; a second buzz on «اللحظات».
  66: (c) => {
    const why = c.at('لماذا'), hard = c.at('يصعب'), calmW = c.at('الهدوء'), moments = c.at('اللحظات');
    const cm = cam(930, 470, 1.4);
    const b1 = k(c.f, [[why - 8, 0], [why - 4, 1], [why + 34, 1], [why + 40, 0]], ease.lin);
    const b2 = k(c.f, [[moments - 4, 0], [moments, 1], [moments + 28, 1], [moments + 34, 0]], ease.lin);
    const bz = Math.max(b1, b2);
    const lift = k(c.f, [[hard - 6, 0], [hard + 16, 1]]);
    const pz = poseAt(c.f, [
      [0, 'sitType'],
      [why + 2, S(pose({ ...POSES.sitType.p, head: 14, turn: 0.55 })), 14],
      [hard - 4, S(sitP({ lean: 4, head: 10, turn: 0.5, R: { hand: [40, -176] }, L: { hand: [56, -170] } }), 'fist', 'fist'), 16],
    ]);
    const typing = c.f < why ? Math.max(0, Math.sin(c.f * 0.9)) * 4 : 0;
    const p = { ...pz.p, R: c.f < why ? { hand: [74, -150 - typing] as [number, number] } : pz.p.R };
    const q = c.p(calmW - 4, 16, ease.back);
    const shY = 698 - 90 * 1.45 - lift * 17;
    return <Stage cam={cm}>
      <DeskBack />
      <Lifted lift={lift} f={c.f} seed={41} who="salim" x={DESK.seat.x} y={860} s={1.45} facing={1} pose={{ p, hands: pz.hands }}
        face={faceAt(c.f, [[0, face('calm', { look: [1, 0] })], [why + 2, face('neutral', { look: [0.8, 0.8] }), 10], [hard, face('anxious', { look: [0.7, 0.6] }), 14], [moments, face('anxious', { look: [0.6, 0.8], tight: 0.6 }), 14]])} />
      <DeskFront />
      <DeskPhone x={1150} y={644} lit={c.f > why - 6 ? 1 : 0} buzz={bz} hop={bz * Math.abs(Math.sin(c.f * 1.6)) * 4} />
      <Tension at={[[628, shY + 30], [752, shY + 30]]} s={1.3} o={lift} t={c.t} />
      {q > 0.01 && <g transform={`translate(1010 ${330 + Math.sin(c.t * 2) * 6}) rotate(${Math.sin(c.t * 1.3) * 4}) scale(${q})`}>
        <WLabel x={0} y={0} text="؟" size={250} color={PAL.focus} w={300} />
      </g>}
    </Stage>;
  },
  // 67 — the thought alone on «فكرة», then the body alone on «إحساسًا»; on «الجسد» they come together and the emotion lights between them.
  67: (c) => {
    const emo = c.at('الانفعال'), th = c.at('فكرة'), not = c.at('ولا'), feel = c.at('احساس'), body = c.at('الجسد');
    const tIn = c.p(th - 6, 16, ease.back), bIn = c.p(feel - 6, 16, ease.back), eIn = c.p(body + 20, 18, ease.back);
    const come = c.p(body - 4, 32);
    const tx = k(c.f, [[not - 4, 960], [feel + 4, 1330], [body - 4, 1330], [body + 28, 1260]]);
    const tr = k(c.f, [[not - 4, 170], [feel + 4, 140]]);
    const bx = mix(590, 660, come), Y = 500;
    const dimT = 1 - 0.65 * c.p(not, 14) * (1 - come);
    return <Stage over={<Cap text="الانفعال" o={c.p(2, 12) * (1 - c.p(th - 8, 12))} top={70} size={70} />}>
      <Paper seed={67} />
      {eIn > 0.01 && [[tx - tr, 960 + 115], [bx + 140, 960 - 115]].map(([a, b], i) => (
        <path key={i} d={`M${a} ${Y} L${a + (b - a) * Math.min(1, eIn)} ${Y}`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      ))}
      <NodeArt kind="thought" x={tx} y={Y} r={tr * Math.min(1.05, tIn)} t={c.t} o={dimT} lit={come * 0.6} />
      <WLabel x={tx} y={Y + tr + 64} text="فكرة" size={56} o={Math.min(1, tIn) * dimT} />
      <NodeArt kind="body" x={bx} y={Y} r={140 * Math.min(1.05, bIn)} t={c.t} lit={come * 0.6} />
      <WLabel x={bx} y={Y + 204} text="جسد" size={56} o={Math.min(1, bIn)} />
      <NodeArt kind="emotion" x={960} y={Y} r={115 * eIn} t={c.t} lit={0.6 + 0.4 * Math.sin(c.t * 4)} />
      <WLabel x={960} y={Y + 180} text="انفعال" size={56} color={PAL.warn} o={Math.min(1, eIn)} />
    </Stage>;
  },
  // 68 — the loop, close: the thought node lit and its words «إنه يستهين بي» on «إنه»; the pulse runs to the emotion on «تشعل»; it flares on «الغضب».
  68: (c) => {
    const thought = c.at('الفكرة'), said = c.at('انه'), ignite = c.at('تشعل'), anger = c.at('الغضب');
    const active = k(c.f, [[ignite - 4, 0], [ignite + 24, 1]]);
    const cm = camMix(cam(980, 540, 1.12), cam(1040, 540, 1.12), c.p(ignite - 10, 40));
    const em = LOOP_NODES[1], tn = LOOP_NODES[0];
    const burst = (a: number, x: number, y: number, col: string) => { const u = clamp((c.f - a) / 30); return u > 0 && u < 1 && <circle cx={x} cy={y} r={110 + u * 90} fill="none" stroke={col} strokeWidth={10 * (1 - u)} opacity={1 - u} />; };
    const cl = c.p(said - 6, 16, ease.back);
    return <Stage cam={cm}>
      <Loop t={c.t} active={active} />
      {burst(thought, tn.x, tn.y, PAL.focus)}
      {burst(anger - 4, em.x, em.y, PAL.warn)}
      {cl > 0.01 && <g transform={`translate(560 230) scale(${cl})`}>
        <ThoughtCloud w={560} h={230} tail={[290, 40]} size={46}>إنه يستهين بي</ThoughtCloud>
      </g>}
      <WLabel x={em.x + 240} y={em.y} text="الغضب" size={60} color={PAL.warn} o={c.p(anger - 4, 12)} />
    </Stage>;
  },
  // 69 — anger in the body, one sign per word: the heart beats faster («قلب يتسارع»), the jaw clenches («وفك مشدود»),
  // the shoulders ride up («وكتفان مرتفعتان»), heat rises in the face («وحرارة في الوجه»).
  69: (c) => {
    const ang = c.at('والغضب'), hw = c.at('قلب'), fast = c.at('يتسارع'), jaw = c.at('وفك'), sh = c.at('وكتفان'), heat = c.at('وحرارة');
    const X = 960, FY = 1010, s = 2.3;
    const lift = c.p(sh - 4, 24), dy = lift * 12 * s;
    const phase = 2 * Math.PI * (1.6 * Math.max(0, c.t - hw / 60) + 1.6 * Math.max(0, c.t - fast / 60));
    const beat = 1 + 0.22 * Math.max(0, Math.sin(phase)) ** 2;
    const hx = X + 26 * s, hy = FY - 168 * s - dy, headY = FY - 283 * s;
    const pz = poseAt(c.f, [[0, 'standFront'], [ang - 4, S(pose({ ...POSES.standFront.p, R: { sh: -12, el: 20 }, L: { sh: 12, el: 20 } }), 'fist', 'fist'), 18]]);
    const hIn = c.p(hw - 6, 14, ease.back), jIn = c.p(jaw - 4, 12), heatIn = c.p(heat - 4, 20);
    const calls: { a: number; text: string; lx: number; ly: number; px: number; py: number }[] = [
      { a: hw, text: 'قلب يتسارع', lx: 1500, ly: 660, px: hx + 56, py: hy },
      { a: jaw, text: 'فك مشدود', lx: 430, ly: 500, px: X - 128, py: headY + 68 },
      { a: sh, text: 'كتفان مرتفعتان', lx: 1500, ly: 420, px: X + 92, py: FY - 218 * s - dy - 30 },
      { a: heat, text: 'حرارة الوجه', lx: 430, ly: 290, px: X - 112, py: headY - 30 },
    ];
    return <Stage>
      <Paper seed={69} />
      <Floor y={FY} seed={69} />
      <Lifted lift={lift} f={c.f} seed={41} who="salim" x={X} y={FY} s={s} facing={1} pose={pz}
        face={faceAt(c.f, [[0, 'neutral'], [ang, 'irritated', 14], [hw, face('angry', { open2: 0, mouth: -0.5 }), 16], [jaw, face('angry', { tight: 1, open2: 0, mouth: -0.45 }), 12], [heat, face('angry', { tight: 1, open2: 0, mouth: -0.45, blush: 1 }), 24]])} />
      {/* the heart, in the film's chest "window" */}
      {hIn > 0.01 && <g transform={`translate(${hx} ${hy}) scale(${Math.min(1.1, hIn)})`}>
        <circle r={56} fill="#FFFFFF" opacity={0.75} stroke={INK} strokeWidth={3} strokeDasharray="10 8" />
        <path d={heart(0, 4, 64 * beat)} fill={PAL.warn} stroke={INK} strokeWidth={3.5} />
      </g>}
      {/* clenched jaw */}
      {jIn > 0.01 && [-1, 1].map((d) => <g key={d} opacity={jIn} transform={`translate(${X + d * 118} ${headY + 58}) scale(${d} 1)`}>
        {[0, 1, 2].map((i) => <path key={i} d={`M${6 + i * 3} ${-16 + i * 16} l${14 + Math.sin(c.t * 9) * 2} ${-4}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />)}
      </g>)}
      {/* shoulders up */}
      {[-1, 1].map((d) => <Chevron key={d} x={X + d * 74} y={FY - 218 * s - dy - 58 - 6 * Math.sin(c.t * 4)} dir={1} o={c.p(sh, 12)} color={PAL.warn} />)}
      <Tension at={[[X - 70, FY - 218 * s - dy + 6], [X + 62, FY - 218 * s - dy + 6]]} s={1.4} o={c.p(sh + 6, 14)} t={c.t} />
      {/* heat rising off the face */}
      {heatIn > 0.01 && [-56, 0, 56].map((dx, i) => {
        const u = (c.t * 0.8 + i * 0.33) % 1, y0 = headY - 128 - u * 50;
        return <path key={i} d={`M${X + dx} ${y0} q12 -14 0 -28 q-12 -14 0 -28`} fill="none" stroke={PAL.warn} strokeWidth={7} strokeLinecap="round" opacity={heatIn * Math.sin(u * Math.PI)} />;
      })}
      {calls.map((q, i) => {
        const o = c.p(q.a - 2, 12), left = q.lx < X;
        const ex = q.lx + (left ? 150 : -170);
        return o > 0.01 && <g key={i}>
          <path d={`M${ex} ${q.ly} L${mix(ex, q.px, Math.min(1, o))} ${mix(q.ly, q.py, Math.min(1, o))}`} stroke={INK} strokeWidth={3.5} strokeDasharray="8 8" opacity={0.7} />
          <circle cx={q.px} cy={q.py} r={7} fill={INK} opacity={o} />
          <WLabel x={q.lx} y={q.ly} text={q.text} size={46} o={o} bg="#FFFFFF" w={420} />
        </g>;
      })}
    </Stage>;
  },
  // 70 — the tense body feeds the thought: shoulders hunched and fists on «المتوتر», arrows run up to a cloud on «يجعل الأفكار»,
  // the cloud swells on «أكثر» and turns spiky on «حدة».
  70: (c) => {
    const tense = c.at('المتوتر'), makes = c.at('يجعل'), th = c.at('الافكار'), more = c.at('اكثر'), sharp = c.at('حدة');
    const X = 560, FY = 1010, s = 2.3;
    const lift = k(c.f, [[0, 0.5], [tense - 4, 0.5], [tense + 16, 1]]);
    const pz = poseAt(c.f, [
      [0, S(pose({ turn: 0.55, head: 4, R: { hand: [10, -150], bend: -1 }, L: { hand: [30, -146] } }), 'fist', 'fist')],
      [th - 10, S(pose({ turn: 0.7, head: -10, R: { hand: [10, -150], bend: -1 }, L: { hand: [30, -146] } }), 'fist', 'fist'), 20],
    ]);
    const shY = FY - 218 * s - lift * 12 * s;
    const cin = mix(0.8, 1, c.p(th - 6, 18, ease.back)), sp = c.p(sharp - 4, 8);
    const grow = mix(1, 1.08, c.p(more, 26)), jolt = shake(c.f, sharp, 34, 5);
    const arrows: [[number, number], [number, number]][] = [[[690, shY + 10], [1010, 450]], [[720, shY + 110], [1060, 510]]];
    const ap = c.p(makes, 26);
    const dots = (from: [number, number], to: [number, number], i: number) => c.f > makes + 26 && [0, 1, 2].map((j) => {
      const u = (c.t * 0.9 + j / 3 + i * 0.17) % 1, bend = 0.18;
      const mx = (from[0] + to[0]) / 2 - (to[1] - from[1]) * bend, my = (from[1] + to[1]) / 2 + (to[0] - from[0]) * bend;
      const x = (1 - u) ** 2 * from[0] + 2 * (1 - u) * u * mx + u * u * to[0], y = (1 - u) ** 2 * from[1] + 2 * (1 - u) * u * my + u * u * to[1];
      return <circle key={`${i}${j}`} cx={x} cy={y} r={9} fill={PAL.warn} opacity={Math.sin(u * Math.PI)} />;
    });
    return <Stage>
      <Paper seed={70} />
      <Floor y={FY} seed={70} />
      <Lifted lift={lift} f={c.f} seed={41} who="salim" x={X} y={FY} s={s} facing={1} pose={pz}
        face={faceAt(c.f, [[0, face('irritated', { look: [0.6, 0] })], [th, face('angry', { open2: 0, tight: 0.7, look: [0.8, -0.8] }), 16], [sharp, face('angry', { open2: 0.1, brow: 1, look: [0.8, -0.8] }), 10]])} />
      <Tension at={[[X - 64, shY + 24], [X + 52, shY + 24]]} s={1.3} o={0.6 + 0.4 * lift} t={c.t} />
      {arrows.map(([a, b], i) => <Arrow key={i} from={a} to={b} bend={0.18} p={c.p(makes + i * 8, 26)} color={PAL.warn} w={7} />)}
      {ap > 0 && arrows.map(([a, b], i) => dots(a, b, i))}
      {<g transform={`translate(${1260 + jolt} 330) scale(${cin * grow})`} opacity={c.p(2, 14)}>
        <g opacity={1 - sp}><SpeechBubble kind="think" w={560} h={300} tail={[-470, 100]}><WLabel x={0} y={0} text="يستهين بي" size={52} w={480} /></SpeechBubble></g>
        {sp > 0 && <g opacity={sp}><SpeechBubble kind="shout" w={520} h={320} tail={[-470, 100]} fill={PAL.provokeLight}><WLabel x={0} y={0} text="يستهين بي!" size={60} color={PAL.provoke} w={480} /></SpeechBubble></g>}
      </g>}
    </Stage>;
  },
  // 71 — the whole loop turns: the pulse reaches «فكرة», «انفعال», «جسد», and the thought again, harder on «أشد».
  71: (c) => {
    const go = c.at('فتدور'), th = c.at('فكرة'), em = c.at('انفعال'), bd = c.at('جسد'), th2 = c.at('فكرة', false, 1), hard = c.at('اشد');
    const active = k(c.f, [[0, -0.55], [th, 0], [em, 1], [bd, 2], [th2, 3]]);
    const [tn, en, bn] = LOOP_NODES;
    const hardU = c.p(hard - 4, 14);
    const ring = clamp((c.f - hard + 4) / 34);
    return <Stage>
      <Loop t={c.t} active={active} />
      <g transform={`rotate(${c.t * 40} 960 560)`} opacity={c.p(go, 16) * 0.35}>
        <circle cx={960} cy={560} r={372} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="18 26" />
      </g>
      {hardU > 0 && <circle cx={tn.x} cy={tn.y} r={124 + 6 * Math.sin(c.t * 8)} fill="none" stroke={PAL.provoke} strokeWidth={10} opacity={hardU} />}
      {ring > 0 && ring < 1 && <circle cx={tn.x} cy={tn.y} r={130 + ring * 120} fill="none" stroke={PAL.provoke} strokeWidth={8 * (1 - ring)} opacity={1 - ring} />}
      <WLabel x={tn.x} y={tn.label.y - 10} text={hardU > 0.5 ? 'فكرة أشد' : 'فكرة'} size={hardU > 0.5 ? 60 : 52} color={hardU > 0.5 ? PAL.provoke : INK} o={c.p(th - 4, 12)} />
      <WLabel x={en.label.x + 90} y={en.label.y} text="انفعال" size={52} o={c.p(em - 4, 12)} />
      <WLabel x={bn.label.x - 70} y={bn.label.y} text="جسد" size={52} o={c.p(bd - 4, 12)} />
    </Stage>;
  },
  // 72 — the good news: the loop slows and calms on «الجيد», a green ring traces it on «للحلقة», three doorways open on it by «مدخل».
  72: (c) => {
    const good = c.at('الجيد'), loop = c.at('للحلقة'), more = c.at('اكثر'), entry = c.at('مدخل');
    const ent = c.p(more - 4, entry - more + 24, ease.lin);
    const trace = c.p(loop - 4, 40);
    const pts = Array.from({ length: 49 }, (_, i) => { const a = ((-90 + i * 7.5 * trace) * Math.PI) / 180; return `${i ? 'L' : 'M'}${(960 + Math.cos(a) * 300).toFixed(1)} ${(560 + Math.sin(a) * 300).toFixed(1)}`; }).join(' ');
    return <Stage over={<Cap text="أكثر من مدخل" o={c.p(entry - 4, 12)} top={34} size={60} />}>
      <Loop t={c.t * mix(1, 0.4, c.p(good, 30))} active={3 + c.f / 260} entries={ent} />
      <circle cx={960} cy={560} r={420} fill={PAL.calmLight} opacity={0.22 * c.p(good, 30)} />
      {trace > 0 && <path d={pts} fill="none" stroke={PAL.calm} strokeWidth={10} strokeLinecap="round" opacity={0.75 * (1 - c.p(entry + 10, 20) * 0.5)} />}
      {LOOP_ENTRIES.map(([x, y], i) => {
        const s0 = clamp(ent * 3 - i);
        return s0 > 0 && <circle key={i} cx={x} cy={y} r={70 + 10 * Math.sin(c.t * 3 + i)} fill="none" stroke={PAL.calm} strokeWidth={5} opacity={0.6 * s0} />;
      })}
    </Stage>;
  },
  // 73 — the way in through the thought: the spiky «يستهين بي» over his head pulses on «الفكرة», he leans back to think on «فتبحث»,
  // brushes it aside with his hand on «تفسير» and a soft cloud «ربما كان متوترًا» takes its place; calm on «آخر».
  73: (c) => {
    const th = c.at('الفكرة'), search = c.at('فتبحث'), other = c.at('تفسير'), another = c.at('اخر');
    const cm = cam(880, 470, 1.25);
    const pz = poseAt(c.f, [
      [0, S(pose({ ...POSES.sitType.p, head: 6, lean: 6 }))],
      [search - 6, S(sitP({ lean: -6, head: -8, turn: 0.5, R: { hand: [26, -232] }, L: { hand: [70, -134] } })), 18],
      [other - 14, S(sitP({ lean: -6, head: -10, turn: 0.5, R: { hand: [26, -232] }, L: { hand: [36, -292] } }), 'relaxed', 'open'), 14],
      [other + 2, S(sitP({ lean: -4, head: -8, turn: 0.55, R: { hand: [26, -232] }, L: { hand: [92, -270] } }), 'relaxed', 'open'), 14],
      [another - 4, S(sitP({ lean: -4, head: -4, turn: 0.5, R: { hand: [48, -128] }, L: { hand: [62, -126] } })), 22],
    ]);
    const out = c.p(other, 18), soft = c.p(other + 8, 18, ease.back);
    const pulse = 1 + 0.08 * Math.sin(Math.min(1, Math.max(0, (c.f - th) / 30)) * Math.PI);
    return <Stage cam={cm} over={<EntryBadge kind="thought" text="من الفكرة" o={c.p(th - 4, 14)} />}>
      <DeskBack />
      <Actor f={c.f} seed={41} who="salim" x={DESK.seat.x} y={860} s={1.45} facing={1} pose={pz}
        face={faceAt(c.f, [[0, face('irritated', { look: [0.2, -0.9] })], [search, face('thinking', { look: [0.3, -0.9] }), 16], [another, face('calm', { mouth: 0.55, look: [0.4, -0.6] }), 18]])} />
      <DeskFront />
      <DeskPhone x={1150} y={644} lit={0} buzz={0} hop={0} />
      {out < 0.99 && <g transform={`translate(${760 + 260 * ease.in(out)} ${250 - 40 * out}) scale(${pulse * mix(1, 0.6, out)})`} opacity={1 - out}>
        <SpeechBubble kind="shout" w={400} h={230} tail={[-60, 190]} fill={PAL.provokeLight}><WLabel x={0} y={0} text="يستهين بي" size={44} color={PAL.provoke} w={360} /></SpeechBubble>
      </g>}
      {soft > 0.01 && <g transform={`translate(740 220) scale(${soft})`}>
        <ThoughtCloud w={560} h={250} tail={[-40, 200]} size={40}>ربما كان متوترًا</ThoughtCloud>
      </g>}
    </Stage>;
  },
  // 74 — the way in through the body: hunched and tight at the desk; the shoulders drop on «فترخي» as he sits back,
  // then one slow breath fills his chest on «أنفاسك».
  74: (c) => {
    const body = c.at('الجسد'), relax = c.at('فترخي'), slow = c.at('وتبطئ'), breaths = c.at('انفاسك');
    const cm = cam(790, 500, 1.6);
    const lift = k(c.f, [[relax - 4, 1], [relax + 30, 0]]);
    const pz = poseAt(c.f, [
      [0, S(sitP({ lean: 8, head: 10, turn: 0.45, R: { hand: [40, -170] }, L: { hand: [56, -166] } }), 'fist', 'fist')],
      [relax - 2, S(sitP({ lean: -6, head: -2, turn: 0.4, footR: [56, 0], footL: [68, 0], R: { hand: [46, -122] }, L: { hand: [60, -120] } }), 'open', 'relaxed'), 34],
    ]);
    const br = k(c.f, [[relax, 0.7], [relax + 40, 0], [slow + 6, 0], [c.dur - 4, 1]]);
    const p = { ...pz.p, breath: br };
    const shY = 698 - 90 * 1.45 - lift * 17;
    const chest: [number, number] = [DESK.seat.x + 6, 698 - 70 * 1.45];
    const drop = c.p(relax, 12) * (1 - c.p(relax + 60, 20));
    return <Stage cam={cm} over={<EntryBadge kind="body" text="من الجسد" o={c.p(body - 4, 14)} />}>
      <DeskBack />
      {c.f > slow && <circle cx={chest[0]} cy={chest[1]} r={70 + 70 * br} fill={PAL.calmLight} opacity={0.55 * c.p(slow, 20)} />}
      <Lifted lift={lift} f={c.f} seed={41} who="salim" x={DESK.seat.x} y={860} s={1.45} facing={1} pose={{ p, hands: pz.hands }}
        face={faceAt(c.f, [[0, face('irritated', { tight: 0.6, look: [0.8, 0.2] })], [relax, face('neutral', { open: 0.8, look: [0.3, 0.3] }), 20], [breaths, face('relieved', { open: 0.4 }), 24]])} />
      <DeskFront />
      <DeskPhone x={1150} y={644} lit={0} buzz={0} hop={0} />
      <Tension at={[[636, shY + 28], [752, shY + 28]]} s={1.2} o={lift * (0.7 + 0.3 * c.p(body, 12))} t={c.t} />
      {[624, 764].map((x, i) => <Chevron key={i} x={x} y={shY + 4 + 16 * drop} dir={-1} o={drop} color={PAL.calm} />)}
    </Stage>;
  },
  // 75 — the way in through attention: a gauge climbs; its first small lamp lights on «الإشارات»; Salim looks up from his phone on «قبل»
  // and points to it; the level stops well under the peak marked on «ذروتها».
  75: (c) => {
    const att = c.at('الانتباه'), sig = c.at('الاشارات'), early = c.at('مبكرا'), before = c.at('قبل'), peak = c.at('ذروتها');
    const GX = 740, Y0 = 880, Y1 = 220, GW = 92, X = 1330, FY = 960, s = 1.85;
    const level = k(c.f, [[0, 0.06], [att, 0.08], [sig, 0.27], [before, 0.39], [before + 40, 0.42], [c.dur, 0.33]]);
    const ly = (u: number) => Y0 - u * (Y0 - Y1);
    const lamps = [0.25, 0.5, 0.75];
    const lit1 = c.f >= sig ? 0.75 + 0.25 * Math.sin(c.t * 10) : 0;
    const bands: [number, number, string][] = [[0, 0.35, PAL.calm], [0.35, 0.65, PAL.focus], [0.65, 0.85, PAL.warn], [0.85, 1, PAL.provoke]];
    const pz = poseAt(c.f, [
      [0, S(pose({ head: 16, turn: 0.4, R: { hand: [44, -176] }, L: { hand: [36, -168] } }), 'grip', 'relaxed')],
      [before - 6, S(pose({ head: -2, turn: 0.75, R: { sh: -6, el: 10 }, L: { sh: 4, el: 8 } }), 'grip', 'relaxed'), 16],
      [before + 24, S(pose({ head: -2, turn: 0.8, lean: 3, R: { sh: -6, el: 10 }, L: { hand: [100, -214] } }), 'grip', 'point'), 14],
      [peak, S(pose({ head: 4, turn: 0.6, R: { sh: -6, el: 10 }, L: { hand: [22, -196], bend: -1 } }), 'grip', 'open'), 18],
    ]);
    return <Stage over={<EntryBadge kind="eye" text="من الانتباه" o={c.p(att - 4, 14)} />}>
      <Paper seed={75} />
      <Floor y={FY} seed={75} />
      {/* the gauge */}
      <clipPath id="b4-gauge"><rect x={GX - GW / 2} y={Y1} width={GW} height={Y0 - Y1} rx={GW / 2} /></clipPath>
      <rect x={GX - GW / 2} y={Y1} width={GW} height={Y0 - Y1} rx={GW / 2} fill="#FFFFFF" />
      <g clipPath="url(#b4-gauge)">
        {bands.map(([a, b, col]) => <rect key={a} x={GX - GW / 2} y={ly(b)} width={GW} height={ly(a) - ly(b)} fill={col} opacity={0.14} />)}
        {bands.map(([a, b, col]) => level > a && <rect key={`f${a}`} x={GX - GW / 2} y={ly(Math.min(b, level))} width={GW} height={ly(a) - ly(Math.min(b, level))} fill={col} />)}
      </g>
      <rect x={GX - GW / 2} y={Y1} width={GW} height={Y0 - Y1} rx={GW / 2} fill="none" stroke={INK} strokeWidth={6} />
      <circle cx={GX} cy={Y0 + 34} r={62} fill={PAL.calm} stroke={INK} strokeWidth={6} />
      {[0.35, 0.65, 0.85].map((u) => <path key={u} d={`M${GX - GW / 2 - 18} ${ly(u)} h18`} stroke={INK} strokeWidth={5} strokeLinecap="round" />)}
      {/* the peak, never reached */}
      <path d={`M${GX - 120} ${ly(0.93)} H${GX + 120}`} stroke={PAL.provoke} strokeWidth={6} strokeDasharray="14 12" opacity={c.p(peak - 6, 12)} />
      <WLabel x={GX - 250} y={ly(0.93)} text="الذروة" size={50} color={PAL.provoke} o={c.p(peak - 4, 12)} w={260} />
      {/* warning lamps on the gauge's side: only the first, early one lights */}
      {lamps.map((u, i) => {
        const x = GX + GW / 2 + 60, y = ly(u), on = i === 0 ? lit1 : 0;
        return <g key={u}>
          <path d={`M${GX + GW / 2} ${y} H${x - 26}`} stroke={INK} strokeWidth={4} />
          {on > 0 && <circle cx={x} cy={y} r={58} fill={PAL.warn} opacity={0.22 * on} />}
          {on > 0 && [0, 1, 2, 3, 4].map((r) => { const a = (-60 + r * 30) * Math.PI / 180; return <path key={r} d={`M${x + Math.cos(a) * 38} ${y + Math.sin(a) * 38} L${x + Math.cos(a) * 54} ${y + Math.sin(a) * 54}`} stroke={PAL.warn} strokeWidth={5} strokeLinecap="round" opacity={on} />; })}
          <circle cx={x} cy={y} r={26} fill={on > 0 ? PAL.warn : '#FFFFFF'} stroke={INK} strokeWidth={4.5} />
        </g>;
      })}
      <WLabel x={GX + GW / 2 + 210} y={ly(0.25) + 4} text="مبكرًا" size={46} color={PAL.calm} o={c.p(early - 4, 12)} w={240} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={FY} s={s} facing={-1} pose={pz} hold={{ R: <Phone w={28} glow={c.f < before ? 0.5 : 0} /> }} upright={{ R: true }}
        face={faceAt(c.f, [[0, face('neutral', { look: [0.2, 0.8] })], [before - 4, face('listening', { look: [1, 0.2], browY: 0.5 }), 10], [peak, face('calm', { look: [0.9, 0.1] }), 16]])} />
    </Stage>;
  },
  // 76 — signals are messages: the chest swirl glows on «إشارات», his guarded hands drop on «ليست عدوًا», a folded letter rises from the swirl
  // on «رسائل», he takes it on «تقول», opens it on «انتبه»; «هنا شيء يهمك» on «هنا»; a nod on «يهمك».
  76: (c) => {
    const sig = c.at('اشارات'), enemy = c.at('عدوا'), they = c.at('انها'), msgs = c.at('رسائل'), say = c.at('تقول'), att = c.at('انتبه'), here = c.at('هنا'), matters = c.at('يهمك');
    const X = 960, FY = 1010, s = 2.0;
    const chest: [number, number] = [X + 4, FY - 182 * s];
    const rise = c.p(msgs - 4, 44, ease.out), unfold = c.p(att - 10, 22);
    const lw = mix(110, 380, unfold) * mix(0.3, 1, rise), lh = mix(76, 250, unfold) * mix(0.3, 1, rise);
    const lx = X, ly = mix(chest[1], 712, rise);
    const hold = c.p(say - 16, 16);
    const base = poseAt(c.f, [
      [0, S(pose({ ...POSES.standFront.p, lean: -3, head: 10, R: { hand: [-18, -178], bend: -1 }, L: { hand: [22, -178], bend: 1 } }), 'stop', 'stop')],
      [enemy - 4, S(pose({ ...POSES.standFront.p, head: 10 })), 20],
    ]);
    const handY = (ly + 8 - FY) / s;
    const grab = pose({ ...POSES.standFront.p, head: 14, R: { hand: [-(lw / 2 + 2) / s, handY] }, L: { hand: [(lw / 2 + 2) / s, handY] } });
    const p = { ...mixPose(base.p, grab, ease.inOut(hold)), head: mix(base.p.head, 14, hold) + nod(c.f, matters, 1, 8) };
    const hands = hold > 0.5 ? { R: 'grip' as Gesture, L: 'grip' as Gesture } : base.hands;
    return <Stage>
      <Paper seed={76} />
      <Floor y={FY} seed={76} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={FY} s={s} facing={1} pose={{ p, hands }}
        face={faceAt(c.f, [[0, face('anxious', { look: [0, 0.8] })], [enemy, face('neutral', { look: [0, 0.8] }), 16], [they, face('listening', { look: [0, 0.8] }), 16], [att, face('listening', { look: [0, 0.9], browY: 0.5 }), 12], [matters, face('calm', { look: [0, 0.6], mouth: 0.55 }), 16]])} />
      <ChestSwirl x={chest[0]} y={chest[1]} r={60} t={c.t} amount={c.p(sig - 4, 24) * (1 - c.p(msgs, 30))} />
      <Letter x={lx} y={ly} w={lw} h={lh} open={unfold} o={c.p(msgs - 4, 10)} l1={c.p(att + 6, 12)} l2={c.p(here - 4, 12)} />
      {hold > 0.5 && [-1, 1].map((d) => <rect key={d} x={lx + d * (lw / 2 - 4) - 9} y={ly - 6} width={18} height={34} rx={9} fill={CAST.salim.skin} stroke={INK} strokeWidth={3} />)}
    </Stage>;
  },
  // 77 — two stones on calm water: feeling (flame) on «تشعر», doing (footprints) on «تفعله»; Salim on the calm stone between;
  // the space between them is measured out on «مسافة».
  77: (c) => {
    const feel = c.at('تشعر'), act = c.at('تفعله'), there = c.at('هناك'), gap = c.at('مسافة');
    const open = k(c.f, [[0, 0.44], [there, 0.44], [gap + 20, 0.5]]);
    const L = gapLayout(open);
    const fy = midTop(open) + 4;
    const pz = poseAt(c.f, [
      [0, 'standFront'],
      [feel - 4, S(pose({ ...POSES.standFront.p, turn: -0.6, head: 4 })), 16],
      [act - 4, S(pose({ ...POSES.standFront.p, turn: 0.6, head: 4 })), 18],
      [gap - 4, S(pose({ ...POSES.standFront.p, turn: 0, head: 0, breath: 0.6 })), 18],
    ]);
    return <Stage>
      <Gap t={c.t} open={open} />
      <WLabel x={L.labels.left[0]} y={L.labels.left[1]} text="شعور" size={58} color={PAL.warn} o={c.p(feel - 4, 12)} bg="#FFFFFF" />
      <WLabel x={L.labels.right[0]} y={L.labels.right[1]} text="فعل" size={58} o={c.p(act - 4, 12)} bg="#FFFFFF" />
      <Span x0={L.left[0] + 150} x1={L.right[0] - 150} y={935} p={c.p(gap - 6, 22)} />
      <WLabel x={960} y={1010} text="مسافة" size={52} color={PAL.calm} o={c.p(gap, 12)} bg="#FFFFFF" />
      <Actor f={c.f} seed={41} who="salim" x={960} y={fy} s={1.25} facing={1} pose={{ p: { ...pz.p, head: pz.p.head + nod(c.f, gap + 14, 1, 6) }, hands: pz.hands }}
        face={faceAt(c.f, [[0, 'calm'], [feel, face('calm', { look: [-0.8, 0.1] }), 12], [act, face('calm', { look: [0.8, 0.1] }), 12], [gap, face('calm', { look: [0, 0] }), 12]])} />
    </Stage>;
  },
  // 78 — very short: the two stones slide almost together on «قصيرة جدًا» (a close-up card); a huge eye watches, and blinks slowly on «رمشة».
  78: (c) => {
    const short = c.at('قصيرة'), very = c.at('جدا'), less = c.at('اقصر'), blink = c.at('رمشة');
    const open = k(c.f, [[0, 0.3], [short - 4, 0.3], [very + 10, 0]]);
    const L = gapLayout(open);
    const gx0 = L.left[0] + 150 - 470, gx1 = L.right[0] - 150 - 470;
    const bl = k(c.f, [[blink - 2, 0], [blink + 14, 1], [blink + 20, 1], [blink + 40, 0]]);
    const look: [number, number] = [k(c.f, [[short - 6, 0], [short + 10, -0.8], [less, -0.8], [less + 16, 0]]), k(c.f, [[short - 6, 0], [short + 10, 0.3], [less, 0.3], [less + 16, 0]])];
    const glow = c.p(very, 14) * (0.6 + 0.4 * Math.sin(c.t * 5));
    return <Stage>
      <Paper seed={78} />
      {/* the close-up card of the two stones */}
      <clipPath id="b4-card78"><rect x={90} y={290} width={800} height={540} rx={28} /></clipPath>
      <rect x={100} y={302} width={800} height={540} rx={28} fill={INK} opacity={0.1} />
      <g clipPath="url(#b4-card78)"><g transform="translate(-470 -130)"><Gap t={c.t} open={open} /></g></g>
      <rect x={90} y={290} width={800} height={540} rx={28} fill="none" stroke={INK} strokeWidth={5} />
      {glow > 0.01 && <g>
        <rect x={(gx0 + gx1) / 2 - 5} y={560} width={10} height={110} rx={5} fill={PAL.calm} opacity={glow} />
        <path d={`M${gx0 - 40} 540 L${gx0 - 4} 540 M${gx0 - 16} 528 L${gx0 - 4} 540 L${gx0 - 16} 552 M${gx1 + 40} 540 L${gx1 + 4} 540 M${gx1 + 16} 528 L${gx1 + 4} 540 L${gx1 + 16} 552`} stroke={PAL.calm} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={Math.min(1, glow * 1.5)} />
      </g>}
      {/* the eye, very close */}
      <clipPath id="b4-face78"><circle cx={1400} cy={560} r={330} /></clipPath>
      <circle cx={1408} cy={572} r={330} fill={INK} opacity={0.1} />
      <circle cx={1400} cy={560} r={330} fill={CAST.salim.skin} />
      <g clipPath="url(#b4-face78)">
        <path d="M1040 330 Q1250 250 1500 300 Q1640 330 1760 280 L1760 180 L1040 180 Z" fill={CAST.salim.hairColor} />
        <path d={`M1240 ${430 - bl * 6} Q1400 ${380 - bl * 6} 1560 ${420 - bl * 4}`} fill="none" stroke={CAST.salim.hairColor} strokeWidth={26} strokeLinecap="round" />
        <BigEye x={1400} y={590} w={400} h={120} blink={bl} look={look} />
        <path d="M1590 760 Q1610 800 1580 830" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" opacity={0.5} />
      </g>
      <circle cx={1400} cy={560} r={330} fill="none" stroke={INK} strokeWidth={6} />
    </Stage>;
  },
  // 79 — but it exists, and practice widens it: a pulse marks the gap on «موجودة»; on «تتسع» and «بالتدريب» the stones step apart, one practice day
  // (a check) at a time, while Salim's stance on the middle stone grows steady.
  79: (c) => {
    const exists = c.at('موجودة'), widen = c.at('تتسع'), train = c.at('بالتدريب');
    const steps = [widen, train, train + 24];
    const open = 0.44 + steps.reduce((a, st) => a + 0.07 * ease.inOut(clamp((c.f - st) / 18)), 0);
    const L = gapLayout(open);
    const fy = midTop(open) + 4;
    const n = steps.filter((st) => c.f >= st).length;
    const wide = clamp((open - 0.44) / 0.21);
    const pz = pose({ ...POSES.standFront.p, footR: [mix(-12, -24, wide), 0], footL: [mix(12, 24, wide), 0], head: nod(c.f, exists + 4, 1, 7) + steps.reduce((a, st) => a + nod(c.f, st + 4, 1, 4), 0), breath: 0.4 + 0.3 * Math.sin(c.t * 1.5) });
    const pulse = clamp((c.f - exists) / 40);
    return <Stage>
      <Gap t={c.t} open={open} />
      <WLabel x={L.labels.left[0]} y={L.labels.left[1]} text="شعور" size={58} color={PAL.warn} bg="#FFFFFF" />
      <WLabel x={L.labels.right[0]} y={L.labels.right[1]} text="فعل" size={58} bg="#FFFFFF" />
      {pulse > 0 && pulse < 1 && <ellipse cx={960} cy={fy + 30} rx={180 + pulse * 220} ry={50 + pulse * 40} fill="none" stroke={PAL.calm} strokeWidth={8 * (1 - pulse)} opacity={1 - pulse} />}
      <Span x0={L.left[0] + 150} x1={L.right[0] - 150} y={935} p={1} />
      <WLabel x={960} y={1010} text="مسافة" size={52} color={PAL.calm} bg="#FFFFFF" />
      {steps.map((st, i) => { const o = c.p(st - 2, 12, ease.back); return o > 0.01 && <g key={i} transform={`translate(${1180 - i * 220} 150) scale(${o})`}><IconCheck s={96} /></g>; })}
      <Actor f={c.f} seed={41} who="salim" x={960} y={fy} s={1.25} facing={1} pose={{ p: pz, hands: POSES.standFront.hands }}
        face={faceAt(c.f, [[0, 'determined'], [exists, face('determined', { mouth: 0.3 }), 12], [steps[2] + 10, face('calm', { mouth: 0.7 }), 16]])} />
      {n > 0 && <WLabel x={960} y={60} text="تدريب" size={48} color={PAL.calm} o={c.p(widen - 4, 12)} />}
    </Stage>;
  },
  // 80 — the feeling knocks: a rose light slips under the door on «الشعور»; two knocks ring out from it on «يطرق» and «الباب».
  80: (c) => {
    const feel = c.at('الشعور'), knock = c.at('يطرق'), door = c.at('الباب');
    const kn = c.f < door ? (c.f - knock) / 30 : (c.f - door) / 30;
    const g = c.p(feel - 4, 30);
    const { x, w, floor } = SINGLE_DOOR;
    return <Stage>
      <SingleDoor t={c.t} open={0} knock={c.f < knock ? 1 : clamp(kn)} />
      {g > 0.01 && <g opacity={g * (0.8 + 0.2 * Math.sin(c.t * 3))}>
        <ellipse cx={x + w / 2} cy={floor + 18} rx={190} ry={20} fill="#F1D9E3" />
        <rect x={x + 6} y={floor - 7} width={w - 12} height={7} fill={PAL.warn} />
      </g>}
    </Stage>;
  },
};

