import React from 'react';
import { BODY, TITLE } from '../fonts';
import { Character } from '../kit/characters/Character';
import { EXPRESSIONS, type Expr, type Face } from '../kit/characters/face';
import type { Gesture } from '../kit/characters/hands';
import { POSES } from '../kit/characters/poses';
import { joints, pose, type Pose } from '../kit/characters/skeleton';
import { Bedroom, BEDROOM } from '../kit/places/Bedroom';
import { MeetingBack, MeetingTableFront } from '../kit/places/MeetingRoom';
import { DeskBack, DeskFront, DESK } from '../kit/places/OfficeDesk';
import { Door, Glow, NIGHT } from '../kit/places/parts';
import { Doors } from '../kit/metaphors/Doors';
import { Puffs } from '../kit/metaphors/util';
import { Chair, ChatScreen, Clock, IconDoor, IconEar, IconPause, Mug, Phone, SpeechBubble, ThoughtCloud, type ChatMessage } from '../kit/props';
import { rrectPts } from '../kit/props/ui';
import { INK, PAL, hash, sketch, sketchRect } from '../kit/style';
import { Actor, CAM0, Cap, Say, Paper, Stage, Tag, blinkAt, ease, faceAt, k, mix, poseAt, toScreen, type Cam, type Ctx } from '../film/engine';
import type { ShotRender } from '../film/Film';
import { Floor, MEET_FEET, MEET_S, SEAT, WLabel, atTable, cam, nod, shake, walkTo } from './common';

// Chapter 3's end «تنظيم لا كبت», chapter 4 «الحدث والتفسير» and the start of chapter 5 «قوة هادئة»: shots 41–60.
type V2 = [number, number];
const JASER = 'جاسر';
const SARCASM = 'أتمنى أن تكون فكرتك القادمة أفضل من فكرة اليوم';
const THREAD: ChatMessage[] = [{ from: 'me', text: 'شكرًا للجميع على الاجتماع اليوم', time: '11:31' }, { from: 'them', text: SARCASM, time: '11:40' }];
const ROSE = '#E7AFC2'; // the felt feeling, drawn as a small rose cloud
const CARD = [PAL.rose, '#9A8FC0', PAL.focus]; // the three readings, matching the three doors' lights
const CARD_BG = ['#F4DDE5', '#ECE6F6', '#DDEAF6'];
const STICKERS = ['يريد أن يهينني', 'أمام الجميع', 'كالعادة'];

const face = (base: Expr, o: Partial<Face>): Face => ({ ...EXPRESSIONS[base], ...o });
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: V2, b: V2, t: number): V2 => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
const st = (p: Pose, R: Gesture = 'relaxed', L: Gesture = 'relaxed') => ({ p, hands: { R, L } });
/** Seated on a bed or chair edge, feet on the floor. */
const seat = (o: Partial<Pose> = {}) => pose({ sit: 1, footR: [52, 0], footL: [64, 0], R: { hand: [52, -126] }, L: { hand: [62, -124] }, ...o });
/** Character space → world, for a character drawn at (x, y) with scale s and facing. */
const W2 = (x: number, y: number, s: number, fc: 1 | -1, q: V2): V2 => [x + fc * s * q[0], y + s * q[1]];
/** World → character space (the inverse of W2). */
const C2 = (x: number, y: number, s: number, fc: 1 | -1, w: V2): V2 => [((w[0] - x) * fc) / s, (w[1] - y) / s];
const wristOf = (p: Pose, side: 'R' | 'L'): V2 => (side === 'R' ? joints(p).armR.wrist : joints(p).armL.wrist);
const headOf = (p: Pose): V2 => joints(p).headC;
/** A quadratic arc from a to b that rises by `lift` (flights of cards and stickers). */
const arc = (a: V2, b: V2, u: number, lift: number): V2 => {
  const m: V2 = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - lift];
  return [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * m[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * m[1] + u * u * b[1]];
};

// ——— small drawings this batch needs ———

/** The message as a chat bubble on paper, its words set one by one so they can be counted (`lit`: words counted so far). */
const MsgCard: React.FC<{ x: number; y: number; w: number; h: number; size?: number; lit?: number; o?: number; rot?: number; sc?: number }> = ({ x, y, w, h, size = 50, lit = -1, o = 1, rot = 0, sc = 1 }) => o <= 0 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} opacity={Math.min(1, o)}>
    <path d={sketch(rrectPts(-w / 2 + 8, -h / 2 + 10, w, h, 34), 6, 1.2, true)} fill={INK} opacity={0.12} />
    <path d={`M${w / 2 - 44} ${-h / 2 + 2} L${w / 2 + 24} ${-h / 2 - 6} L${w / 2 - 6} ${-h / 2 + 40} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
    <path d={sketch(rrectPts(-w / 2, -h / 2, w, h, 34), 5, 1.2, true)} fill="#FFFFFF" stroke={INK} strokeWidth={4.5} />
    <path d={`M${w / 2 - 40} ${-h / 2 + 4} L${w / 2 + 14} ${-h / 2 - 1} L${w / 2 - 8} ${-h / 2 + 32} Z`} fill="#FFFFFF" />
    <foreignObject x={-w / 2 + 26} y={-h / 2 + 10} width={w - 52} height={h - 20}>
      <div dir="rtl" lang="ar" style={{ width: '100%', height: '100%', display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', columnGap: size * 0.22, fontFamily: BODY, fontWeight: 700, fontSize: size, lineHeight: 1.5, color: INK }}>
        {SARCASM.split(' ').map((wd, i) => {
          const u = clamp01(lit - i), on = lit > i && lit < i + 1.4;
          return <span key={i} style={{ position: 'relative', padding: '0 8px', borderRadius: 14, background: on ? PAL.focusLight : 'transparent' }}>
            {wd}
            {u > 0 && <span style={{ position: 'absolute', left: '50%', bottom: 2, width: 16, height: 16, marginLeft: -8, borderRadius: 8, background: PAL.focus, transform: `scale(${ease.back(u)})` }} />}
          </span>;
        })}
      </div>
    </foreignObject>
  </g>
);

/** A sticky note with a short phrase: what the mind adds on top of the message. */
const Sticker: React.FC<{ x: number; y: number; text: string; rot: number; sc?: number; o?: number; size?: number }> = ({ x, y, text, rot, sc = 1, o = 1, size = 50 }) => {
  if (o <= 0 || sc <= 0.01) return null;
  const w = text.length * size * 0.5 + 76, h = size * 1.9;
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} opacity={Math.min(1, o)}>
    <path d={sketchRect(-w / 2 + 7, -h / 2 + 9, w, h, 3, 1)} fill={INK} opacity={0.14} />
    <path d={sketchRect(-w / 2, -h / 2, w, h, 4, 1.2)} fill={PAL.provokeLight} stroke={INK} strokeWidth={3.6} />
    <rect x={-40} y={-h / 2 - 13} width={80} height={26} fill="#FFFFFF" opacity={0.75} transform="rotate(-5)" />
    <WLabel x={0} y={4} text={text} size={size} w={w} color={PAL.provoke} />
  </g>;
};

/** The feeling as a small rose cloud with a face; `tip` stretches a little arm out to a world point. */
const Feeling: React.FC<{ x: number; y: number; r: number; f: number; look?: V2; joy?: number; wide?: number; tip?: V2 | null; o?: number; squash?: number; sc?: number }> = ({ x, y, r, f, look = [0.6, 0], joy = 0.5, wide = 0, tip, o = 1, squash = 0, sc = 1 }) => {
  if (o <= 0 || sc <= 0.01) return null;
  const br = sc * (1 + Math.sin(f / 22) * 0.03);
  const lumps: [number, number, number][] = [[0, 0, r], [-r * 0.66, r * 0.2, r * 0.64], [r * 0.66, r * 0.18, r * 0.62], [-r * 0.3, -r * 0.46, r * 0.6], [r * 0.34, -r * 0.4, r * 0.55]];
  const bl = blinkAt(f, 77), ey = r * 0.13 * (1 + wide * 0.35) * (1 - bl * 0.9);
  const base: V2 = [x + r * 0.5 * br, y];
  return <g opacity={Math.min(1, o)}>
    {tip && <g>
      <path d={`M${base[0]} ${base[1]} Q${(base[0] + tip[0]) / 2} ${Math.min(base[1], tip[1]) - 30} ${tip[0]} ${tip[1]}`} fill="none" stroke={INK} strokeWidth={r * 0.3 + 8} strokeLinecap="round" />
      <path d={`M${base[0]} ${base[1]} Q${(base[0] + tip[0]) / 2} ${Math.min(base[1], tip[1]) - 30} ${tip[0]} ${tip[1]}`} fill="none" stroke={ROSE} strokeWidth={r * 0.3} strokeLinecap="round" />
      <circle cx={tip[0]} cy={tip[1]} r={r * 0.2} fill={ROSE} stroke={INK} strokeWidth={3.6} />
    </g>}
    <g transform={`translate(${x} ${y + r * squash * 0.12}) scale(${br * (1 + squash * 0.12)} ${br * (1 - squash * 0.12)})`}>
      <Puffs c={lumps} fill={ROSE} line={3.6} seed={7} />
      <path d={`M${-r * 0.5} ${r * 0.42} q${r * 0.2} ${-r * 0.12} ${r * 0.4} 0 t${r * 0.4} 0`} fill="none" stroke={PAL.warn} strokeWidth={4} strokeLinecap="round" opacity={0.45} />
      {[-0.3, 0.16].map((ex, i) => <g key={i}>
        <ellipse cx={r * ex + look[0] * r * 0.06} cy={-r * 0.06 + look[1] * r * 0.05} rx={r * 0.085} ry={Math.max(1.5, ey)} fill={INK} />
        {bl < 0.5 && <circle cx={r * ex + look[0] * r * 0.06 + r * 0.025} cy={-r * 0.06 + look[1] * r * 0.05 - ey * 0.4} r={r * 0.025} fill="#FFFFFF" />}
      </g>)}
      <path d={`M${-r * 0.17} ${r * 0.2} Q${-r * 0.06} ${r * (0.2 + 0.16 * joy)} ${r * 0.06} ${r * 0.2}`} fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
    </g>
  </g>;
};

/** Glasses as a small object (hand frame units, centred). */
const GlassesProp: React.FC<{ lens: string; lensO?: number; w?: number; tired?: boolean }> = ({ lens, lensO = 0.7, w = 34, tired }) => {
  const rx = w * 0.24, ry = w * 0.2, cx = w * 0.27;
  return <g>
    <path d={`M${-cx - rx} ${-2} L${-cx - rx - 6} ${-ry - 2} M${cx + rx} ${-2} L${cx + rx + 6} ${-ry - 2}`} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
    {[-cx, cx].map((x) => <g key={x}>
      <ellipse cx={x} cy={0} rx={rx} ry={ry} fill={lens} fillOpacity={lensO} stroke={INK} strokeWidth={2.6} />
      {tired && <path d={`M${x - rx * 0.8} ${-ry * 0.25} Q${x} ${ry * 0.45} ${x + rx * 0.8} ${-ry * 0.25}`} fill="none" stroke={INK} strokeWidth={1.8} opacity={0.7} />}
      {!tired && <path d={`M${x - rx * 0.4} ${-ry * 0.45} l${rx * 0.3} ${-ry * 0.1}`} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" opacity={0.8} />}
    </g>)}
    <path d={`M${-cx + rx} ${-1} Q0 ${-ry * 0.6} ${cx - rx} ${-1}`} fill="none" stroke={INK} strokeWidth={2.6} />
  </g>;
};

/** Glasses worn on a character's face: lenses on the rig's eyes (same maths as face.tsx), tinted. */
const FaceGlasses: React.FC<{ x: number; y: number; s: number; fc: 1 | -1; p: Pose; lens: string; lensO?: number; tired?: boolean }> = ({ x, y, s, fc, p, lens, lensO = 0.55, tired }) => {
  const j = joints(p), r = 48, sg = p.turn < 0 ? -1 : 1, a = Math.min(1, Math.abs(p.turn));
  const fx = r * 0.5 * p.turn, ey = -r * 0.1, gap = r * 0.33;
  const eyes = [{ x: fx - sg * gap * (1 - 0.45 * a), k: 1 }, { x: fx + sg * gap * (1 - 0.55 * a), k: 1 - 0.6 * a }];
  return <g transform={`translate(${x} ${y}) scale(${s * fc} ${s}) translate(${j.headC[0]} ${j.headC[1]}) rotate(${p.lean * 0.6 + p.head})`}>
    {eyes.map((e, i) => <g key={i}>
      <ellipse cx={e.x} cy={ey} rx={r * 0.27 * e.k} ry={r * 0.25} fill={lens} fillOpacity={lensO} stroke={INK} strokeWidth={3.4} />
      {tired && <path d={`M${e.x - r * 0.22 * e.k} ${ey - r * 0.06} Q${e.x} ${ey + r * 0.1} ${e.x + r * 0.22 * e.k} ${ey - r * 0.06}`} fill="none" stroke={INK} strokeWidth={2.4} opacity={0.75} />}
    </g>)}
    <path d={`M${eyes[0].x + sg * r * 0.27} ${ey} L${eyes[1].x - sg * r * 0.27 * eyes[1].k} ${ey}`} stroke={INK} strokeWidth={3.4} />
    <path d={`M${eyes[0].x - sg * r * 0.27} ${ey} L${eyes[0].x - sg * r * 0.62} ${ey - 3}`} stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
  </g>;
};

/** A tiny head (only the head of the rig), centred at (x, y): faces inside thought clouds. */
const MiniHead: React.FC<{ who: 'jaser' | 'salim' | 'hadi' | 'att1' | 'att2'; x: number; y: number; s: number; fc?: Face | Expr; turn?: number; head?: number; facing?: 1 | -1 }> = ({ who, x, y, s, fc = 'neutral', turn = 0.3, head = 0, facing = 1 }) => {
  const p = pose({ turn, head });
  return <Character who={who} only={['Head']} p={p} face={fc} x={x} y={y - headOf(p)[1] * s * (who === 'jaser' ? 1.02 : 1)} s={s} facing={facing} />;
};

/** A thought cloud in world space, popping in with `o`, its trail pointing at `to` (world). */
const Cloud: React.FC<{ x: number; y: number; w: number; h: number; to: V2; o: number; fill?: string; faint?: number; children?: React.ReactNode }> = ({ x, y, w, h, to, o, fill = '#FFFFFF', faint = 1, children }) => {
  if (o <= 0.01) return null;
  const s = mix(0.55, 1, Math.min(1, o));
  return <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, o) * faint}>
    <ThoughtCloud w={w} h={h} tail={[(to[0] - x) / s, (to[1] - y) / s]} fill={fill}>{children}</ThoughtCloud>
  </g>;
};

/** A rewind mark: an open circle with an arrow head, turning backwards. */
const Rewind: React.FC<{ x: number; y: number; r: number; spin: number; o: number; color?: string }> = ({ x, y, r, spin, o, color = PAL.focus }) => o <= 0 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${-spin * 360})`} opacity={o}>
    <path d={`M${r} 0 A${r} ${r} 0 1 1 ${r * 0.3} ${-r * 0.95}`} fill="none" stroke={color} strokeWidth={r * 0.16} strokeLinecap="round" />
    <path d={`M${r * 0.3 - r * 0.24} ${-r * 0.95 - r * 0.2} L${r * 0.3 + r * 0.05} ${-r * 0.95} L${r * 0.3 - r * 0.2} ${-r * 0.95 + r * 0.25}`} fill="none" stroke={color} strokeWidth={r * 0.16} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** A rubber stamp in wine red, slammed on with `p`. */
const Stamp: React.FC<{ x: number; y: number; text: string; p: number; rot?: number; size?: number }> = ({ x, y, text, p, rot = -9, size = 60 }) => {
  if (p <= 0) return null;
  const w = text.length * size * 0.5 + 90, h = size * 1.7;
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${mix(1.7, 1, ease.out(Math.min(1, p)))})`} opacity={Math.min(1, p * 2)}>
    <path d={sketchRect(-w / 2, -h / 2, w, h, 12, 1.6)} fill="#FFFFFF" fillOpacity={0.6} stroke={PAL.provoke} strokeWidth={8} />
    <path d={sketchRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 13, 1.2)} fill="none" stroke={PAL.provoke} strokeWidth={3} />
    <WLabel x={0} y={6} text={text} size={size} w={w} color={PAL.provoke} />
  </g>;
};

/** Everything inside one of the three reading cards: a paper margin around a rounded card, its number and its word. */
const CardOver: React.FC<{ n: number; label: string; lo: number; f: number }> = ({ n, label, lo, f }) => {
  const x0 = 150, y0 = 54, x1 = 1770, y1 = 1026, r = 44, col = CARD[n - 1];
  const inner = `M${x0 + r} ${y0} H${x1 - r} Q${x1} ${y0} ${x1} ${y0 + r} V${y1 - r} Q${x1} ${y1} ${x1 - r} ${y1} H${x0 + r} Q${x0} ${y1} ${x0} ${y1 - r} V${y0 + r} Q${x0} ${y0} ${x0 + r} ${y0} Z`;
  const pop = ease.back(clamp01(f / 14));
  return <>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
      <path d={`M-10 -10 H1930 V1090 H-10 Z ${inner}`} fill={PAL.paper} fillRule="evenodd" />
      <path d={inner} fill="none" stroke={col} strokeWidth={16} />
      <path d={inner} fill="none" stroke={INK} strokeWidth={3.6} transform="translate(0 0)" />
      <g transform={`translate(${x1 - 30} ${y0 + 30}) scale(${pop})`}>
        <circle r={58} fill={col} stroke={INK} strokeWidth={4.5} />
        <foreignObject x={-58} y={-58} width={116} height={116}>
          <div style={{ width: 116, height: 116, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TITLE, fontWeight: 800, fontSize: 64, color: '#FFFFFF', lineHeight: 1 }}>{n}</div>
        </foreignObject>
      </g>
    </svg>
    <Tag text={label} at={[960, y0 + 4]} o={lo} bg={col} size={50} />
  </>;
};

/** The fantasy look: a rose wash with soft cloud edges (Salim's imagined meeting). */
const DREAM: [number, number, number][] = [
  ...Array.from({ length: 17 }, (_, i) => [i * 120, -14 + hash(i) * 20, 70 + hash(i * 3) * 40] as [number, number, number]),
  ...Array.from({ length: 17 }, (_, i) => [i * 120 + 60, 1094 - hash(i * 5) * 20, 70 + hash(i * 7) * 40] as [number, number, number]),
  ...Array.from({ length: 10 }, (_, i) => [-16, i * 120, 66 + hash(i * 9) * 36] as [number, number, number]),
  ...Array.from({ length: 10 }, (_, i) => [1936, i * 120 + 60, 66 + hash(i * 11) * 36] as [number, number, number]),
];
const Dream: React.FC = () => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
    <rect width={1920} height={1080} fill={PAL.rose} opacity={0.12} />
    {DREAM.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#F6E6EC" opacity={0.94} />)}
  </svg>
);

/** SVG filters: a flat dark silhouette (shadows) and a frozen, washed-out look (the paused fantasy). */
const Filters: React.FC = () => (
  <defs>
    <filter id="b3-sil"><feColorMatrix type="matrix" values="0 0 0 0 0.17  0 0 0 0 0.19  0 0 0 0 0.26  0 0 0 1 0" /></filter>
    <filter id="b3-frz"><feColorMatrix type="saturate" values="0.2" /></filter>
  </defs>
);

/** A side road for the driving metaphor: sky, hills, trees and dashes that scroll with the frame. */
const Road: React.FC<{ f: number }> = ({ f }) => {
  const wrap = (x: number, span: number) => ((x % span) + span) % span;
  return <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill={PAL.sky} />
    {[0, 1, 2, 3].map((i) => {
      const x = wrap(i * 820 - f * 1.2, 3280) - 500;
      return <path key={i} d={`M${x - 520} 890 Q${x - 220} ${600 + (i % 2) * 50} ${x} ${620 + (i % 2) * 40} Q${x + 280} ${650} ${x + 560} 890 Z`} fill={i % 2 ? PAL.wallSage : '#CFDCCB'} stroke={INK} strokeWidth={2.4} strokeOpacity={0.3} />;
    })}
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const x = wrap(i * 470 - f * 5, 2820) - 360, h = 150 + hash(i) * 70;
      return <g key={i}>
        <rect x={x - 9} y={884 - h * 0.45} width={18} height={h * 0.45} fill={PAL.woodDark} stroke={INK} strokeWidth={2.4} />
        <path d={sketch([[x - 60, 884 - h * 0.4], [x - 70, 884 - h * 0.75], [x - 30, 884 - h], [x + 34, 884 - h * 0.98], [x + 68, 884 - h * 0.7], [x + 56, 884 - h * 0.4]], i + 4, 4, true)} fill={i % 2 ? PAL.plant : PAL.plantDark} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </g>;
    })}
    <rect x={-400} y={884} width={2720} height={600} fill={PAL.storm} />
    <rect x={-400} y={884} width={2720} height={12} fill={PAL.metal} />
    <path d={sketch([[-400, 884], [2320, 884]], 3, 1.5)} stroke={INK} strokeWidth={3.6} fill="none" />
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={wrap(i * 300 - f * 14, 2700) - 300} y={1012} width={150} height={14} rx={7} fill="#E8EDF2" />)}
  </g>;
};
/** The little open car, side view, facing right: seat backs and steering wheel behind the driver… */
const CarBack: React.FC<{ dy: number }> = ({ dy }) => (
  <g transform={`translate(0 ${dy})`}>
    <path d={sketchRect(926, 548, 46, 200, 21, 1)} fill={PAL.chairDark} stroke={INK} strokeWidth={3.6} transform="rotate(-8 950 748)" />
    <path d={sketchRect(692, 578, 44, 170, 22, 1)} fill={PAL.chairDark} stroke={INK} strokeWidth={3.6} transform="rotate(-8 714 748)" />
    <path d="M1166 668 L1226 736" stroke={INK} strokeWidth={15} strokeLinecap="round" />
    <path d="M1166 668 L1226 736" stroke={PAL.metal} strokeWidth={7} strokeLinecap="round" />
    <ellipse cx={1150} cy={634} rx={14} ry={52} transform="rotate(-16 1150 634)" fill="none" stroke={INK} strokeWidth={14} />
    <ellipse cx={1150} cy={634} rx={14} ry={52} transform="rotate(-16 1150 634)" fill="none" stroke={PAL.chair} strokeWidth={6} />
  </g>
);
/** …and the body, windshield and wheels in front of him. */
const CarFront: React.FC<{ dy: number; spin: number }> = ({ dy, spin }) => (
  <g transform={`translate(0 ${dy})`}>
    <path d="M1232 735 L1214 735 L1182 596 L1196 592 Z" fill={PAL.screenGlow} opacity={0.5} />
    <path d="M1232 735 L1196 592" stroke={INK} strokeWidth={12} strokeLinecap="round" />
    <path d="M1232 735 L1196 592" stroke={PAL.chairDark} strokeWidth={5} strokeLinecap="round" />
    <path d={sketch([[566, 874], [560, 772], [584, 730], [760, 722], [1240, 728], [1350, 748], [1394, 778], [1400, 852], [1380, 878]], 9, 1.4, true)} fill={PAL.focus} stroke={INK} strokeWidth={4.6} strokeLinejoin="round" />
    <path d={sketch([[584, 742], [1240, 744], [1340, 762]], 10, 1)} stroke={PAL.focusLight} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.6} />
    <path d="M905 744 L900 864 M1196 746 L1186 864" stroke={INK} strokeWidth={2.6} opacity={0.5} />
    <rect x={1100} y={768} width={44} height={10} rx={5} fill={PAL.chairDark} stroke={INK} strokeWidth={2} />
    <circle cx={1384} cy={792} r={14} fill="#EEF2F8" stroke={INK} strokeWidth={3} />
    <rect x={558} y={770} width={14} height={34} rx={5} fill={PAL.warn} stroke={INK} strokeWidth={2.4} />
    {[700, 1252].map((wx) => <g key={wx} transform={`translate(${wx} 880) rotate(${spin})`}>
      <circle r={58} fill={INK} />
      <circle r={30} fill={PAL.metal} stroke={INK} strokeWidth={3} />
      {[0, 72, 144, 216, 288].map((a) => <path key={a} d="M0 -6 L0 -27" stroke={INK} strokeWidth={4} strokeLinecap="round" transform={`rotate(${a})`} />)}
    </g>)}
  </g>
);

/** A dark cloud (the worst reading) — `dark` 0..1. */
const DarkCloud: React.FC<{ x: number; y: number; r: number; f: number; dark?: number }> = ({ x, y, r, f, dark = 1 }) => {
  const b = 1 + Math.sin(f / 18) * 0.03;
  return <g transform={`translate(${x} ${y}) scale(${b})`}>
    <Puffs c={[[0, 0, r], [-r * 0.7, r * 0.2, r * 0.66], [r * 0.7, r * 0.18, r * 0.64], [-r * 0.28, -r * 0.48, r * 0.62], [r * 0.34, -r * 0.4, r * 0.56]]} fill={dark > 0.5 ? '#3F4556' : PAL.storm} line={3.6} seed={11} />
    {[-0.4, 0, 0.4].map((dx, i) => { const ph = ((f / 30 + i * 0.33) % 1); return <path key={i} d={`M${r * dx} ${r * 0.75 + ph * r * 0.5} l-4 ${r * 0.18}`} stroke={PAL.focus} strokeWidth={4} strokeLinecap="round" opacity={(1 - ph) * dark} />; })}
  </g>;
};

/** A plinth beside Salim where he sets things down. */
const Stool: React.FC<{ x: number; top: number; floor: number }> = ({ x, top, floor }) => (
  <g>
    <path d={sketchRect(x - 52, top, 104, floor - top, x, 1)} fill={PAL.wood} stroke={INK} strokeWidth={3.6} />
    <path d={sketchRect(x - 64, top - 14, 128, 18, x + 1, 1)} fill={PAL.woodDark} stroke={INK} strokeWidth={3.6} />
  </g>
);

/** Shout arcs coming out of a mouth (world), facing `dir`. */
const ShoutArcs: React.FC<{ x: number; y: number; f: number; o: number; dir?: 1 | -1; s?: number }> = ({ x, y, f, o, dir = 1, s = 1 }) => o <= 0 ? null : (
  <g opacity={o}>
    {[0, 1, 2].map((i) => {
      const ph = ((f / 16 + i / 3) % 1), r = (30 + ph * 90) * s;
      return <path key={i} d={`M${x + dir * r * 0.5} ${y - r * 0.8} Q${x + dir * r * 1.1} ${y} ${x + dir * r * 0.5} ${y + r * 0.8}`} fill="none" stroke={PAL.provoke} strokeWidth={8 * s} strokeLinecap="round" opacity={1 - ph} />;
    })}
  </g>
);

/** A burst behind an explosion: a spiky star in rose. */
const Burst: React.FC<{ x: number; y: number; r: number; o: number; seed?: number }> = ({ x, y, r, o, seed = 3 }) => o <= 0 ? null : (
  <path d={sketch(Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2, rr = r * (i % 2 ? 0.55 : 0.9 + hash(seed + i) * 0.25); return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.85] as V2; }), seed, 1, true)} fill={PAL.provokeLight} stroke={PAL.warn} strokeWidth={6} strokeLinejoin="round" opacity={o} />
);

/** The marionette control bar Jaser holds (centred on his hand, world units). */
const Bar: React.FC<{ x: number; y: number; rot: number }> = ({ x, y, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d="M-120 0 L120 0 M0 -16 L0 60" stroke={INK} strokeWidth={20} strokeLinecap="round" />
    <path d="M-120 0 L120 0 M0 -16 L0 60" stroke={PAL.wood} strokeWidth={11} strokeLinecap="round" />
  </g>
);

/** A seated colleague in the meeting (manual layering when a shot needs something between the back wall and the people). */
const Seated: React.FC<{ f: number; i: number; who: 'mona' | 'att1' | 'hadi' | 'att2' | 'jaser'; p: Pose; fc: Face | Expr; facing?: 1 | -1; hands?: { R: Gesture; L: Gesture }; hold?: { R?: React.ReactNode; L?: React.ReactNode }; up?: { R?: boolean; L?: boolean }; say?: [number, number] }> = ({ f, i, who, p, fc, facing = -1, hands, hold, up, say }) => (
  <Actor f={f} seed={i * 3 + 1} who={who} pose={{ p, hands }} face={fc} x={SEAT[i]} y={MEET_FEET} s={MEET_S} facing={facing} hold={hold} upright={up} say={say} />
);

/** A sheet of paper raised as a shield (hand frame units). */
const Shield: React.FC = () => (
  <g>
    <path d={sketchRect(-22, -30, 44, 58, 5, 0.6)} fill="#FBFAF7" stroke={INK} strokeWidth={2.2} />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M14 ${-18 + i * 11} H${-14 + (i === 3 ? 12 : 0)}`} stroke="#9AA3AE" strokeWidth={1.8} strokeLinecap="round" />)}
  </g>
);

/** A mini copy of the message (a bubble with grey lines) for cards in a hand. */
const MiniMsg: React.FC<{ w?: number; band?: string }> = ({ w = 30, band = PAL.paperShade }) => (
  <g>
    <path d={sketchRect(-w / 2, -w * 0.65, w, w * 1.3, 3, 0.5)} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
    <rect x={-w / 2 + 1} y={-w * 0.65 + 1} width={w - 2} height={w * 0.22} fill={band} />
    {[0, 1, 2].map((i) => <path key={i} d={`M${w * 0.32} ${-w * 0.2 + i * w * 0.2} H${-w * 0.32 + (i === 2 ? w * 0.3 : 0)}`} stroke="#9AA3AE" strokeWidth={1.6} strokeLinecap="round" />)}
  </g>
);

export const SHOTS: Record<number, ShotRender> = {
  // 41 — night: he rereads the message; a «؟» rises on «تسأل», two faint clouds of other readings open on «طريقة» and «أخرى».
  41: (c) => {
    const ask = c.at('تسأل'), way = c.at('طريقة'), other = c.at('أخرى'), back = c.at('لفهم'), what = c.at('حدث');
    const X = BEDROOM.bedSeat.x, Y = 860, S = 1.45;
    const cm = cam(1000, 470, 1.7);
    const sp = (o: Partial<Pose>) => seat({ R: { hand: [50, -128] }, ...o });
    const pz = poseAt(c.f, [
      [0, st(sp({ head: 10, turn: 0.4, L: { hand: [60, -152] } }), 'relaxed', 'grip')],
      [ask - 22, st(sp({ head: 16, turn: 0.45, lean: 4, L: { hand: [58, -190] } }), 'relaxed', 'grip'), 18],
      [way - 14, st(sp({ head: -10, turn: 0.62, L: { hand: [60, -172] } }), 'relaxed', 'grip'), 16],
      [other - 12, st(sp({ head: -8, turn: -0.3, body: 0.35, L: { hand: [60, -168] } }), 'relaxed', 'grip'), 18],
      [back - 4, st(sp({ head: 14 + nod(c.f, what, 1, 5), turn: 0.45, lean: 4, L: { hand: [58, -188] } }), 'relaxed', 'grip'), 20],
    ]);
    const hd = W2(X, Y, S, 1, headOf(pz.p));
    const qm = c.p(ask - 4, 14, ease.back);
    const fc = faceAt(c.f, [[0, face('neutral', { look: [0.4, 0.8], open: 0.85 })], [ask - 8, face('thinking', { look: [0.5, 0.8] })], [way - 8, face('thinking', { look: [0.8, -0.8] })], [other - 6, face('thinking', { look: [-0.8, -0.8] })], [back + 4, face('calm', { look: [0.5, 0.8] })]]);
    const bob = (ph: number) => Math.sin(c.f / 26 + ph) * 6;
    return <Stage cam={cm}>
      <Bedroom night lamp={0.55} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={Y} s={S} facing={1} pose={pz} face={fc}
        hold={{ L: <Phone w={28} glow={0.6} screen={<ChatScreen name={JASER} messages={THREAD} header="night" />} /> }} upright={{ L: true }} />
      <WLabel x={hd[0] + 6} y={hd[1] - 150 - 12 * Math.min(1, qm)} text="؟" size={120} color={PAL.focus} o={Math.min(1, qm) * (1 - 0.4 * c.p(way, 20))} />
      <Cloud x={1300} y={300 + bob(0)} w={340} h={230} to={[hd[0] + 70, hd[1] - 60]} o={c.p(way - 4, 18, ease.back)} fill="#EEF1F7" faint={0.7}>
        <MiniHead who="jaser" x={-30} y={-6} s={0.95} fc={face('smile', { open2: 0.7, squint: 0.9, mouth: 1 })} turn={0.3} head={-10} />
        {[0, 1, 2].map((i) => <path key={i} d={`M${48 + i * 10} ${-50 + i * 26} q12 -6 20 2`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />)}
      </Cloud>
      <Cloud x={620} y={300 + bob(2)} w={340} h={230} to={[hd[0] - 60, hd[1] - 70]} o={c.p(other - 4, 18, ease.back)} fill="#EEF1F7" faint={0.7}>
        <MiniHead who="jaser" x={36} y={-4} s={0.95} fc={face('anxious', { look: [-0.6, 0.3] })} turn={-0.3} />
        <g transform="translate(-74 30)">
          <rect x={-34} y={-62} width={68} height={64} rx={6} fill="#FBFAF7" stroke={INK} strokeWidth={3} />
          <rect x={-34} y={-62} width={68} height={16} rx={6} fill={PAL.focus} stroke={INK} strokeWidth={3} />
          <circle cx={6} cy={-22} r={14} fill="none" stroke={PAL.warn} strokeWidth={4} />
        </g>
      </Cloud>
    </Stage>;
  },

  // 42 — acceptance is not approval: on the right he cradles his feeling in both palms; on the left the message gets «غير مقبول» on «مقبول».
  42: (c) => {
    const acc = c.at('والقبول'), mean = c.at('يعني'), ok = c.at('مقبول');
    const X = 1440, Y = 990, S = 1.85, F = -1 as const;
    const holdP = pose({ head: 16, turn: 0.4, lean: 3, R: { hand: [50, -178] }, L: { hand: [66, -172] } });
    const pz = poseAt(c.f, [
      [0, st(pose({ ...holdP, R: { hand: [44, -160] }, L: { hand: [58, -156] } }), 'cup', 'cup')],
      [acc, st(holdP, 'cup', 'cup'), 20],
      [ok - 8, st(pose({ ...holdP, head: 0, turn: 0.75 }), 'cup', 'cup'), 14],
      [ok + 40, st(pose({ ...holdP, head: 12 + nod(c.f, ok + 60, 1, 5) }), 'cup', 'cup'), 22],
    ]);
    const wl = W2(X, Y, S, F, wristOf(pz.p, 'L')), wr = W2(X, Y, S, F, wristOf(pz.p, 'R'));
    const fp: V2 = [(wl[0] + wr[0]) / 2 - 36, Math.min(wl[1], wr[1]) - 44];
    const fc = faceAt(c.f, [[0, face('calm', { look: [0.5, 0.8] })], [mean, face('calm', { look: [0.4, 0.9], mouth: 0.5 })], [ok - 6, face('determined', { look: [0.9, 0] })], [ok + 40, face('calm', { look: [0.5, 0.8] })]]);
    const stamp = c.p(ok - 2, 12);
    return <Stage>
      <Paper seed={42} />
      <Floor y={990} seed={42} />
      <path d={sketch([[960, 120], [960, 960]], 42, 2)} stroke={INK} strokeWidth={4} strokeDasharray="14 16" opacity={0.35} fill="none" />
      <MsgCard x={490} y={470} w={720} h={330} size={46} rot={-2} sc={1 + shake(c.f, ok + 4, 16, 0.012, 2)} />
      <Stamp x={560} y={640} text="غير مقبول" p={stamp} />
      <WLabel x={1420} y={150} text="القبول" size={70} color={PAL.calm} o={c.p(acc - 4, 14)} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={Y} s={S} facing={F} pose={pz} face={fc} />
      <Feeling x={fp[0]} y={fp[1]} r={46} f={c.f} look={[-0.6, 0.5]} joy={0.6} sc={ease.out(c.p(0, 20))} />
    </Stage>;
  },

  // 43 — the little car: he doesn't fight the feeling; he makes room for it on «تفسح», and on «القيادة» he gently puts its reaching arm back.
  43: (c) => {
    const fight = c.at('تحارب'), feel = c.at('شعورك'), room = c.at('تفسح'), place = c.at('مكانا'), hand = c.at('تسلمه'), drive = c.at('القيادة');
    const X = 1030, Y = 900, S = 1.45;
    const cm = cam(950, 600, 1.2);
    const dy = Math.sin(c.f / 5) * 1.5;
    // the feeling: floats beside the car, then flies into the passenger seat
    const out: V2 = [330 + Math.sin(c.t * 1.7) * 14, 500 + Math.sin(c.t * 2.3) * 12];
    const seatP: V2 = [808, 664 + dy];
    const go = c.p(room - 2, place - room + 4);
    const fpos = arc(out, seatP, go, 120);
    const squash = c.f > place + 2 ? Math.exp(-(c.f - place - 2) / 9) * Math.sin((c.f - place - 2) / 2.6) : 0;
    // its arm reaches for the wheel on «تسلمه»; Salim's hand takes it back on «القيادة»
    const reachA = hand - 16, reachB = hand + 16, takeA = drive - 10, takeB = drive + 2, guideB = drive + 34, retB = drive + 50;
    const base: V2 = [fpos[0] + 30, fpos[1] - 8], wheelTip: V2 = [1128, 640 + dy], rest: V2 = [916, 690 + dy];
    let tip: V2 | null = null;
    if (c.f >= reachA && c.f < guideB) tip = c.f < reachB ? lerp(base, wheelTip, ease.inOut((c.f - reachA) / (reachB - reachA))) : c.f < takeB ? wheelTip : lerp(wheelTip, rest, ease.inOut((c.f - takeB) / (guideB - takeB)));
    else if (c.f >= guideB && c.f < retB) tip = lerp(rest, base, ease.in((c.f - guideB) / (retB - guideB)));
    const wheelL: V2 = [86, -172 + dy / S];
    const inv = k(c.f, [[room - 16, 0], [room + 2, 1], [place, 1], [place + 18, 0]]);
    let Lh: V2 = lerp(wheelL, [-34, -190], inv);
    const tc = tip ? C2(X, Y, S, 1, tip) : wheelL;
    if (c.f >= takeA && c.f < takeB) Lh = lerp(wheelL, tc, ease.inOut((c.f - takeA) / (takeB - takeA)));
    else if (c.f >= takeB && c.f < guideB) Lh = tc;
    else if (c.f >= guideB && c.f < guideB + 26) Lh = lerp(C2(X, Y, S, 1, rest), wheelL, ease.inOut((c.f - guideB) / 26));
    const turn = k(c.f, [[0, 0.45], [fight - 10, 0.45], [fight + 6, -0.4], [feel + 24, -0.4], [feel + 40, 0.45], [room - 14, 0.45], [room + 2, -0.35], [place + 10, -0.35], [place + 26, 0.45], [takeA, 0.45], [takeA + 12, -0.25], [guideB + 4, -0.25], [guideB + 20, 0.45]]);
    const p = seat({ lean: 4, head: 2, turn, body: 0.45, R: { hand: [83, -196 + dy / S] }, L: { hand: Lh } });
    const fc = faceAt(c.f, [[0, face('calm', { look: [0.8, 0] })], [fight, face('calm', { look: [0.9, 0.1] })], [room, face('smile', { look: [0.9, 0.2] })], [place + 26, face('calm', { look: [0.9, 0] })], [takeA - 4, face('calm', { look: [0.9, 0.3], brow: 0.15 })], [guideB, face('smile', { look: [0.8, 0.3] })], [guideB + 22, face('calm', { look: [0.9, 0] })]]);
    const joy = k(c.f, [[0, 0.2], [place, 0.2], [place + 10, 1], [reachA, 1], [reachA + 8, 0.1], [guideB, 0.1], [guideB + 14, 0.9]]);
    const wide = k(c.f, [[reachA, 0], [reachA + 10, 1], [guideB, 1], [guideB + 14, 0]]);
    const fLook: V2 = c.f < room ? [0.9, 0.4] : [0.9, 0];
    const tagAt = toScreen(cm, [fpos[0], fpos[1] - 105]);
    return <Stage cam={cm} over={<Tag text="شعورك" at={tagAt} o={c.p(feel - 4, 12) * (1 - c.p(room + 10, 14))} bg={PAL.warn} size={44} />}>
      <Road f={c.f} />
      <CarBack dy={dy} />
      <Feeling x={fpos[0]} y={fpos[1]} r={60} f={c.f} look={fLook} joy={joy} wide={wide} tip={tip} squash={squash} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={Y + dy} s={S} facing={1} pose={{ p, hands: { R: 'grip', L: inv > 0.5 ? 'open' : 'grip' } }} face={fc} />
      <CarFront dy={dy} spin={c.f * 9} />
    </Stage>;
  },

  // 44 — back to the message itself: a rewind mark turns, the bubble comes back onto the screen on «الرسالة» and we push in.
  44: (c) => {
    const msg = c.at('الرسالة'), self = c.at('نفسها');
    const PX = 960, PY = 540, PW = 420;
    const sw = PW * 0.87, sc = sw / 360, sx = PX - sw / 2, sy = PY - sw;
    const B = { x0: 74, x1: 352, y0: 520, y1: 664 }; // Jaser's bubble on the night chat screen (screen units)
    const toW = (u: number, v: number): V2 => [sx + u * sc, sy + v * sc];
    const rev = c.p(msg - 8, 22, ease.out);
    const bc = toW((B.x0 + B.x1) / 2, (B.y0 + B.y1) / 2);
    const push = c.p(self - 20, 60);
    const cm = cam(mix(960, bc[0], push), mix(540, bc[1], push), mix(1, 1.8, push));
    const spin = c.p(0, msg + 6, ease.out) * 2;
    const ring = c.p(msg + 10, 16);
    const [ax, ay] = toW(B.x0 - 6, B.y0 - 6), [bx, by] = toW(B.x1 + 6, B.y1 + 6);
    const cover = rev < 1 ? <rect x={B.x0 - 4} y={B.y0 - 4} width={(B.x1 - B.x0 + 8) * (1 - rev)} height={B.y1 - B.y0 + 8} fill="#151B26" /> : null;
    return <Stage cam={cm}>
      <Paper seed={44} />
      <Rewind x={480} y={300} r={120} spin={spin} o={1 - c.p(msg + 20, 16)} />
      {[0, 1, 2].map((i) => <path key={i} d={`M${560 + i * 30} ${640 + i * 60} q-60 -30 -120 0`} stroke={PAL.focus} strokeWidth={8} fill="none" strokeLinecap="round" opacity={(1 - c.p(msg, 20)) * (0.3 + 0.3 * Math.sin(c.f / 4 + i))} />)}
      <g transform={`translate(${PX} ${PY})`}><Phone w={PW} glow={0.5} screen={<g><ChatScreen name={JASER} messages={THREAD} header="night" />{cover}</g>} /></g>
      <path d={sketchRect(ax, ay, bx - ax, by - ay, 4, 1.4)} fill="none" stroke={PAL.focus} strokeWidth={6} opacity={ring * (0.65 + 0.35 * Math.sin(c.f / 7))} />
    </Stage>;
  },

  // 45 — what actually happened: «الحدث»; the words are counted one by one on «كلمات», a screen frames them on «شاشة», the clock runs to late night on «آخر».
  45: (c) => {
    const what = c.at('حدث'), words = c.at('كلمات'), screen = c.at('شاشة'), came = c.at('وصلت'), late = c.at('آخر');
    const lit = (c.f - words) / 9;
    const scr = c.p(screen - 8, 30);
    const night = c.p(late - 12, 22, ease.out), clk = c.p(late - 8, 44, ease.out);
    const mins = mix(9 * 60 + 5, 11 * 60 + 40, clk);
    const ping = c.p(came - 2, 30);
    const fy = 520 + Math.sin(c.f / 40) * 5;
    return <Stage over={<Cap text="الحدث" o={c.p(what - 4, 12)} top={60} size={68} />}>
      <Paper seed={45} />
      <rect x={290} y={fy - 250} width={940} height={500} rx={40} fill="none" stroke={PAL.screen} strokeWidth={16} pathLength={1} strokeDasharray={`${scr} 1`} />
      <rect x={290} y={fy - 250} width={940} height={500} rx={40} fill={PAL.focusLight} opacity={scr * 0.35} />
      {ping > 0 && ping < 1 && <rect x={330 - ping * 40} y={fy - 170 - ping * 40} width={860 + ping * 80} height={340 + ping * 80} rx={40} fill="none" stroke={PAL.focus} strokeWidth={6} opacity={1 - ping} />}
      <MsgCard x={760} y={fy} w={860} h={300} size={54} lit={lit} />
      <g transform={`translate(1530 520) scale(${ease.back(night)})`} opacity={Math.min(1, night * 1.5)}>
        <circle r={250} fill={PAL.skyNight} stroke={INK} strokeWidth={4.5} />
        {[[-150, -110], [-60, -190], [120, -150], [170, 60], [-180, 80], [40, 190]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3 + (i % 2) * 2} fill="#E8EDF2" opacity={0.6 + 0.4 * Math.sin(c.f / 15 + i)} />)}
        <circle cx={120} cy={-150} r={44} fill="#E8EDF2" />
        <circle cx={140} cy={-164} r={40} fill={PAL.skyNight} />
        <g transform="translate(0 20)"><Clock hours={Math.floor(mins / 60)} minutes={mins % 60} r={140} /></g>
      </g>
      <WLabel x={1530} y={830} text="11:40" size={58} o={c.p(late + 30, 14)} />
    </Stage>;
  },

  // 46 — what Salim's mind added: stickers fly from his head onto the words — «يريد أن يهينني», «أمام الجميع», «كالعادة»; hurt turns to anger.
  46: (c) => {
    const mind = c.at('عقل'), j = c.at('جاسر'), hum = c.at('يهينني'), all = c.at('الجميع'), usual = c.at('كالعادة');
    const X = 1540, Y = 1000, S = 1.75, F = -1 as const;
    const pz = poseAt(c.f, [
      [0, st(pose({ lean: 5, head: 8, turn: 0.45 }))],
      [hum - 16, st(pose({ ...POSES.handOnChest.p, turn: 0.5 }), 'relaxed', 'open'), 16],
      [all - 18, 'armsCrossed', 18],
      [usual - 12, st(pose({ ...POSES.point.p, lean: 8, head: -2, turn: 0.7 }), 'relaxed', 'point'), 12],
    ]);
    const fc = faceAt(c.f, [[0, face('hurt', { look: [0.7, 0.2] })], [hum, face('hurt', { brow: -0.9, mouth: -0.6, look: [0.8, 0.2] })], [all - 8, face('irritated', { look: [0.8, 0.1] })], [usual - 6, face('angry', { look: [0.9, 0] })]]);
    const hd = W2(X, Y, S, F, headOf(pz.p));
    const puff: V2 = [1400, 250];
    const flights: { a: number; b: number; to: V2; rot: number }[] = [
      { a: j - 6, b: hum + 8, to: [830, 410], rot: -6 },
      { a: all - 28, b: all + 8, to: [560, 515], rot: 5 },
      { a: usual - 24, b: usual + 6, to: [800, 600], rot: -3 },
    ];
    let jolt = 0;
    flights.forEach((s) => { jolt += shake(c.f, s.b, 16, 6, 2.2); });
    return <Stage>
      <Paper seed={46} />
      <Floor y={1000} seed={46} />
      <MsgCard x={700 + jolt} y={480} w={860} h={300} size={50} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={Y} s={S} facing={F} pose={pz} face={fc} />
      <Cloud x={puff[0]} y={puff[1]} w={240} h={160} to={[hd[0] - 30, hd[1] - 90]} o={c.p(mind - 6, 16, ease.back)} fill={PAL.provokeLight}>
        {[0, 1, 2].map((i) => <circle key={i} cx={-40 + i * 40} cy={Math.sin(c.f / 6 + i) * 8} r={10} fill={PAL.warn} opacity={0.6} />)}
      </Cloud>
      {flights.map((s, i) => {
        if (c.f < s.a) return null;
        const u = ease.inOut(clamp01((c.f - s.a) / (s.b - s.a)));
        const [x, y] = arc(puff, s.to, u, 180);
        const land = c.f > s.b ? 1 + Math.exp(-(c.f - s.b) / 6) * Math.sin((c.f - s.b) / 2) * 0.08 : mix(0.3, 1, u);
        return <Sticker key={i} x={x} y={y} text={STICKERS[i]} rot={mix(25, s.rot, u)} sc={land} size={50} />;
      })}
    </Stage>;
  },

  // 47 — the event is one thing (right box), the interpretation another: the stickers peel off into a cloud on «وتفسيرنا», a line splits them on «شيء آخر».
  47: (c) => {
    const ev = c.at('الحدث'), interp = c.at('وتفسيرنا'), intent = c.at('لنية'), split = c.at('شيء', false, 1);
    const dx = 40 * c.p(split - 4, 26);
    const rx = 1400 + dx, lx = 520 - dx;
    const box = (x: number, p: number, seed: number) => <path d={sketchRect(x - 380, 190, 760, 740, seed, 1.6)} fill="#FFFFFF" fillOpacity={0.55 * p} stroke={INK} strokeWidth={5} pathLength={1} strokeDasharray={`${p} 1`} />;
    const from: V2[] = [[rx + 60, 520], [rx - 120, 610], [rx + 90, 690]];
    const to: V2[] = [[lx, 665], [lx - 120, 790], [lx + 150, 780]];
    const rots = [-6, 5, -3], rotsTo = [-3, 6, -5];
    const cl = c.p(interp - 6, 30, ease.back);
    const cy = 640 + Math.sin(c.f / 30) * 6;
    return <Stage>
      <Paper seed={47} />
      {box(rx, c.p(ev - 8, 24), 71)}
      {box(lx, c.p(interp - 8, 24), 72)}
      <WLabel x={rx} y={270} text="الحدث" size={64} o={c.p(ev - 4, 12)} />
      <WLabel x={lx} y={270} text="التفسير" size={64} color={PAL.provoke} o={c.p(interp - 4, 12)} />
      <MsgCard x={rx} y={600 + Math.sin(c.f / 34) * 4} w={620} h={300} size={44} />
      {cl > 0.01 && <g transform={`translate(${lx} ${cy}) scale(${cl})`}>
        <Puffs c={[[0, 0, 170], [-180, 50, 120], [180, 46, 120], [-80, -110, 120], [90, -100, 110]]} fill="#A7AEBC" line={4} seed={4} />
      </g>}
      {c.f > intent - 6 && <MiniHead who="jaser" x={lx} y={cy - 110} s={1.15} fc={face('smug', { skew: 1, look: [0.2, 0.2] })} turn={0.2} />}
      {STICKERS.map((t, i) => {
        const a = interp + i * 8, u = ease.inOut(clamp01((c.f - a) / 34));
        const [x, y] = arc(from[i], to[i], u, 160);
        return <Sticker key={i} x={x} y={y} text={t} rot={mix(rots[i], rotsTo[i], u)} sc={mix(0.8, 0.85, u)} size={44} />;
      })}
      <path d={`M960 120 L960 ${mix(120, 990, c.p(split - 4, 22))}`} stroke={INK} strokeWidth={9} strokeLinecap="round" opacity={c.f > split - 4 ? 1 : 0} />
    </Stage>;
  },

  // 48 — an ambiguous grey shape; he puts on tired glasses on «قراءته» and the shape turns hostile on «عداء».
  48: (c) => {
    const amb = c.at('غامضا'), lean = c.at('يميل'), many = c.at('كثير'), read = c.at('قراءته'), host = c.at('عداء');
    const X = 470, Y = 960, S = 1.8;
    const wearAt = read + 2;
    const eyeC: V2 = [10, -290];
    const pz = poseAt(c.f, [
      [0, st(pose({ head: 4, turn: 0.5 }))],
      [amb - 14, st(pose({ head: -6, turn: 0.55, L: { hand: [36, -240] } }), 'relaxed', 'relaxed'), 18],
      [lean - 10, st(pose({ head: 14, turn: 0.45, L: { hand: [60, -184] } }), 'relaxed', 'grip'), 16],
      [read - 18, st(pose({ head: 2, turn: 0.4, L: { hand: eyeC } }), 'relaxed', 'grip'), 16],
      [wearAt + 2, st(pose({ head: 2, turn: 0.45, L: { sh: 8, el: 10 } })), 18],
      [host - 6, st(pose({ ...POSES.stepBack.p, turn: 0.5 }), 'relaxed', 'open'), 12],
    ]);
    const worn = c.f >= wearAt;
    const hostile = c.p(host - 10, 22, ease.out);
    const fc = faceAt(c.f, [[0, face('anxious', { look: [0.9, 0] })], [amb, face('thinking', { look: [0.9, -0.1] })], [lean - 6, face('neutral', { look: [0.5, 0.8], open: 0.8 })], [wearAt, face('anxious', { look: [0.9, 0], open: 0.75 })], [host, face('irritated', { look: [0.9, 0], brow: 0.8 })]]);
    const gw = W2(X, Y, S, 1, wristOf(pz.p, 'L'));
    const BX = 1340, BY = 560, R = 230;
    const pts: V2[] = Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2, rr = R * (1 + 0.06 * Math.sin(c.t * 1.3 + i * 1.9)) * (1 + hostile * (i % 2 ? 0.3 : -0.12));
      return [BX + Math.cos(a) * rr, BY + Math.sin(a) * rr * 0.92];
    });
    const blobD = pts.map((q, i) => { const n = pts[(i + 1) % pts.length]; return `${i ? '' : `M${((q[0] + pts[pts.length - 1][0]) / 2).toFixed(1)} ${((q[1] + pts[pts.length - 1][1]) / 2).toFixed(1)} `}Q${q[0].toFixed(1)} ${q[1].toFixed(1)} ${((q[0] + n[0]) / 2).toFixed(1)} ${((q[1] + n[1]) / 2).toFixed(1)}`; }).join(' ') + ' Z';
    const spikeD = 'M' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L') + ' Z';
    const qa = c.p(amb - 4, 16) * (1 - hostile);
    return <Stage over={!worn && <Tag text="متعب" at={[gw[0] + 150, gw[1] - 30]} o={c.p(many - 4, 12) * (1 - c.p(read - 20, 10))} bg={PAL.storm} size={44} />}>
      <Paper seed={48} />
      <Floor y={960} seed={48} />
      <path d={blobD} fill="#B7BCC8" stroke={INK} strokeWidth={4} strokeDasharray="18 12" opacity={1 - hostile} />
      {['؟', '؟', '؟'].map((q, i) => <WLabel key={i} x={BX - 90 + i * 90} y={BY - 30 + Math.sin(c.f / 20 + i * 2) * 14 + (i % 2) * 50} text={q} size={70} color={PAL.textSoft} o={qa} />)}
      {hostile > 0 && <g opacity={hostile}>
        <path d={spikeD} fill={PAL.warn} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {[-1, 1].map((sd) => <g key={sd}>
          <ellipse cx={BX + sd * 70} cy={BY - 30} rx={34} ry={24} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
          <circle cx={BX + sd * 70 - 14} cy={BY - 26} r={11} fill={INK} />
          <path d={`M${BX + sd * 120} ${BY - 92} L${BX + sd * 28} ${BY - 54}`} stroke={INK} strokeWidth={11} strokeLinecap="round" />
        </g>)}
        <path d={`M${BX - 80} ${BY + 80} l26 -20 l26 20 l26 -20 l26 20 l26 -20 l26 20`} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      </g>}
      <WLabel x={BX} y={240} text="عداء" size={70} color={PAL.provoke} o={c.p(host, 14)} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={Y} s={S} facing={1} pose={pz} face={fc}
        hold={!worn && c.f > lean - 8 ? { L: <g opacity={c.p(lean - 8, 10)}><GlassesProp lens={PAL.storm} tired /></g> } : undefined} upright={{ L: true }} />
      {worn && <FaceGlasses x={X} y={Y} s={S} fc={1} p={pz.p} lens={PAL.storm} lensO={0.5} tired />}
      <rect x={-10} y={-10} width={1940} height={1100} fill={PAL.skyNight} opacity={0.1 * c.p(wearAt, 20)} />
    </Stage>;
  },

  // 49 — one message, three intentions: on «بثلاث» the card in his hand splits into three cards; numbered on «نيات», tinted on «مختلفة».
  49: (c) => {
    const read = c.at('تقرأ'), three = c.at('بثلاث'), intents = c.at('نيات'), diff = c.at('مختلفة');
    const X = 400, Y = 980, S = 1.8;
    const throwAt = three - 4;
    const pz = poseAt(c.f, [
      [0, st(pose({ head: 6, turn: 0.45, L: { hand: [58, -178] } }), 'relaxed', 'grip')],
      [read - 10, st(pose({ head: 16, turn: 0.45, L: { hand: [52, -210] } }), 'relaxed', 'grip'), 16],
      [throwAt - 12, st(pose({ head: 6, lean: -3, turn: 0.5, L: { hand: [26, -200] } }), 'relaxed', 'grip'), 10],
      [throwAt, st(pose({ head: 0, lean: 6, turn: 0.6, L: { hand: [104, -214] } }), 'relaxed', 'open'), 8],
      [diff - 10, st(pose({ head: -2, turn: 0.55, L: { hand: [34, -240] } })), 18],
    ]);
    const hand = W2(X, Y, S, 1, wristOf(pz.p, 'L'));
    const slots: V2[] = [[1620, 470], [1250, 470], [880, 470]];
    const rots = [6, -2, -7];
    const fc = faceAt(c.f, [[0, face('thinking', { look: [0.6, 0.6] })], [read, face('thinking', { look: [0.5, 0.9] })], [throwAt, face('surprised', { look: [0.9, -0.2], open2: 0.2 })], [intents, face('thinking', { look: [1, -0.2] })], [diff + 20, face('thinking', { look: [0.4, -0.2] })]]);
    return <Stage>
      <Paper seed={49} />
      <Floor y={980} seed={49} />
      {slots.map((to, i) => {
        const a = throwAt + 2 + i * 3, dur = 40 - i * 7;
        if (c.f < a) return null;
        const u = ease.out(clamp01((c.f - a) / dur));
        const [x, y] = arc(hand, to, u, 120 - i * 30);
        const sc = mix(0.12, 1, u), num = c.p(intents - 4 + i * 8, 12, ease.back), tint = c.p(diff - 4 + i * 6, 16);
        const fl = Math.sin(c.f / 30 + i * 1.7) * 6;
        return <g key={i} transform={`translate(${x} ${y + fl * u}) rotate(${mix(-30, rots[i], u)}) scale(${sc})`}>
          <path d={sketchRect(-150 + 8, -200 + 10, 300, 400, 30 + i, 1)} fill={INK} opacity={0.12} />
          <path d={sketchRect(-150, -200, 300, 400, 20 + i, 1.2)} fill={tint > 0 ? CARD_BG[i] : '#FFFFFF'} stroke={INK} strokeWidth={4.5} />
          <rect x={-146} y={-196} width={292} height={mix(20, 60, tint)} fill={CARD[i]} opacity={mix(0.35, 1, tint)} />
          <path d={sketch(rrectPts(-110, -100, 220, 150, 30), 40 + i, 1, true)} fill="#FFFFFF" stroke={INK} strokeWidth={3.6} />
          {[0, 1, 2].map((l) => <path key={l} d={`M80 ${-62 + l * 36} H${-80 + (l === 2 ? 70 : 0)}`} stroke="#9AA3AE" strokeWidth={8} strokeLinecap="round" />)}
          {num > 0 && <g transform={`translate(0 130) scale(${num})`}>
            <circle r={54} fill={CARD[i]} stroke={INK} strokeWidth={4.5} />
            <WLabel x={0} y={6} text={String(i + 1)} size={64} color="#FFFFFF" w={120} />
          </g>}
        </g>;
      })}
      <Actor f={c.f} seed={41} who="salim" x={X} y={Y} s={S} facing={1} pose={pz} face={fc}
        hold={c.f < throwAt + 2 ? { L: <MiniMsg w={32} /> } : undefined} upright={{ L: true }} />
    </Stage>;
  },

  // 50 — card 1, deliberate sarcasm: Jaser types with a smirk, looks up at us on «سخرية», taps send on «مقصودة».
  50: (c) => {
    const sar = c.at('سخرية'), meant = c.at('مقصودة');
    const X = 1000, Y = 950, S = 2.0, F = -1 as const;
    const tapAmp = c.f < sar - 8 ? Math.max(0, Math.sin(c.f * 0.6)) * 5 : 0;
    const send = k(c.f, [[meant - 8, 0], [meant - 2, -10], [meant + 2, 8], [meant + 10, 0]]);
    const typeP = (o: Partial<Pose> = {}) => pose({ head: 14, turn: 0.4, R: { hand: [48, -192 + tapAmp + send] }, L: { hand: [42, -178] }, ...o });
    const pz = poseAt(c.f, [[0, st(typeP(), 'point', 'grip')], [sar - 10, st(typeP({ head: -4, turn: 0.15 }), 'point', 'grip'), 14], [meant - 14, st(typeP(), 'point', 'grip'), 10], [meant + 20, st(typeP({ head: 2, lean: -4, turn: 0.3, R: { hand: [30, -150] } }), 'relaxed', 'grip'), 18]]);
    const fc = faceAt(c.f, [[0, face('smug', { look: [0.4, 0.8] })], [sar - 6, face('smug', { skew: 1, mouth: 0.5, brow: 0.45, look: [-0.3, -0.1], open: 0.8 })], [meant - 10, face('smug', { look: [0.4, 0.8] })], [meant + 14, face('smug', { skew: 1, mouth: 0.6, look: [-0.2, 0] })]]);
    const ph = W2(X, Y, S * 1.02, F, wristOf(pz.p, 'L'));
    const fly = c.p(meant, 40, ease.in);
    const flash = Math.max(0, 1 - Math.abs(c.f - meant - 2) / 10);
    return <Stage over={<CardOver n={1} label="سخرية" lo={c.p(sar - 4, 12)} f={c.f} />}>
      <rect x={-10} y={-10} width={1940} height={1100} fill={CARD_BG[0]} />
      <rect x={-10} y={950} width={1940} height={200} fill={PAL.floor} />
      <path d={sketch([[0, 950], [1920, 950]], 50, 2)} stroke={INK} strokeWidth={3} opacity={0.5} fill="none" />
      <path d={sketchRect(380, 260, 260, 200, 51, 1.4)} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      <path d={sketchRect(400, 280, 220, 160, 52, 1)} fill={PAL.wallSage} />
      <path d="M400 440 L470 360 L530 410 L570 370 L620 440 Z" fill={PAL.plant} />
      <Actor f={c.f} seed={13} who="jaser" x={X} y={Y} s={S} facing={F} pose={pz} face={fc}
        hold={{ L: <Phone w={28} glow={0.4 + flash * 0.6} screen={<ChatScreen name="سليم" messages={[THREAD[0]]} draft={SARCASM.slice(0, Math.round(SARCASM.length * clamp01(c.f / (meant - 4))))} draftCaret header="day" />} /> }} upright={{ L: true }} />
      {fly > 0 && fly < 1 && <g transform={`translate(${mix(ph[0] - 20, 360, fly)} ${mix(ph[1] - 60, 140, fly)}) scale(${mix(0.6, 1.2, fly)}) rotate(-12)`} opacity={1 - fly * 0.6}>
        <path d={sketch(rrectPts(-70, -36, 140, 72, 22), 53, 1, true)} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
        {[0, 1].map((l) => <path key={l} d={`M46 ${-10 + l * 20} H${-46 + l * 30}`} stroke="#9AA3AE" strokeWidth={6} strokeLinecap="round" />)}
      </g>}
    </Stage>;
  },

  // 51 — card 2, a clumsy joke: Jaser laughs at his own message on «مزحة»; nobody answers, and on «لا يحسن» the laugh dies into a blush.
  51: (c) => {
    const joke = c.at('مزحة'), heavy = c.at('ثقيلة'), no = c.at('لا'), bad = c.at('يحسن');
    const X = 760, Y = 950, S = 1.9;
    const laughing = c.f >= joke - 4 && c.f < no;
    const lu = c.p(joke - 6, 10) * (1 - c.p(no - 2, 8));
    const sh = laughing ? shake(c.f, joke - 4, no - joke + 4, 3.5, 1.3) : 0;
    const p = seat({ lean: mix(4, -12, lu) + sh, bob: Math.abs(sh) * 1.2, head: mix(10, -14, lu) + sh * 2, turn: mix(0.4, 0.3, lu), R: { hand: lu > 0.5 ? [30, -146] : [60, -170] }, L: { hand: [58, -206] } });
    const fc = faceAt(c.f, [[0, face('smug', { look: [0.5, 0.7] })], [joke - 6, face('smile', { open2: 0.8, squint: 0.9, mouth: 1 }), 8], [no, face('embarrassed', { look: [-0.7, 0], blush: 0.9 }), 6], [bad + 24, face('embarrassed', { look: [0.5, 0.6], blush: 1, mouth: -0.1 }), 16]]);
    const hd = W2(X, Y, S * 1.02, 1, headOf(p));
    const dots = c.p(heavy - 6, 10) * (1 - c.p(no - 4, 8));
    const sweat = c.p(no + 20, 50, ease.in);
    const panel: V2 = [1420, 470];
    return <Stage over={<>
      <CardOver n={2} label="مزحة" lo={c.p(joke - 4, 12)} f={c.f} />
      <Say text="ههههه" to={toScreen(CAM0, [hd[0] + 40, hd[1] - 70])} o={lu} above={10} size={50} />
    </>}>
      <rect x={-10} y={-10} width={1940} height={1100} fill={CARD_BG[1]} />
      <rect x={-10} y={950} width={1940} height={200} fill={PAL.floor} />
      <path d={sketch([[0, 950], [1920, 950]], 51, 2)} stroke={INK} strokeWidth={3} opacity={0.5} fill="none" />
      <g transform={`translate(${X} ${Y}) scale(${S * 1.02})`}><Chair facing={1} kind="office" /></g>
      <Actor f={c.f} seed={13} who="jaser" x={X} y={Y} s={S} facing={1} pose={{ p, hands: { R: lu > 0.5 ? 'open' : 'relaxed', L: 'grip' } }} face={fc}
        hold={{ L: <Phone w={28} glow={0.4} /> }} upright={{ L: true }} />
      {sweat > 0 && <path d={`M${hd[0] - 70} ${hd[1] - 40 + sweat * 60} q-10 18 0 24 q10 -6 0 -24 Z`} fill={PAL.waterLight} stroke={INK} strokeWidth={3} opacity={1 - c.p(c.dur - 20, 16)} />}
      <g transform={`translate(${panel[0]} ${panel[1]})`}>
        <path d={sketch(rrectPts(-200, -250, 400, 500, 40), 54, 1.2, true)} fill="#FFFFFF" stroke={INK} strokeWidth={4.5} />
        <path d={sketch(rrectPts(-160, -210, 260, 110, 26), 55, 1, true)} fill={PAL.calmLight} stroke={INK} strokeWidth={3.6} />
        {[0, 1].map((l) => <path key={l} d={`M80 ${-176 + l * 36} H${-130 + l * 70}`} stroke={PAL.textSoft} strokeWidth={8} strokeLinecap="round" opacity={0.6} />)}
        {dots > 0 && <g opacity={dots} transform={`translate(70 -20) scale(${mix(0.6, 1, dots)})`}>
          <path d={sketch(rrectPts(-80, -40, 160, 80, 30), 56, 1, true)} fill={PAL.paperShade} stroke={INK} strokeWidth={3.6} />
          {[0, 1, 2].map((d) => <circle key={d} cx={-36 + d * 36} cy={-Math.max(0, Math.sin(c.f / 5 - d)) * 8} r={10} fill={PAL.textSoft} />)}
        </g>}
        <WLabel x={0} y={140} text="…" size={90} color={PAL.textSoft} o={c.p(no + 10, 20)} />
      </g>
    </Stage>;
  },

  // 52 — card 3, Jaser's desk at night: tense under the deadline, he types fast on «تحت ضغط»; the deadline pulses on «موعد التسليم».
  52: (c) => {
    const wrote = c.at('كتبها'), under = c.at('تحت'), press = c.at('ضغط'), due = c.at('موعد'), hand = c.at('التسليم');
    const X = DESK.seat.x, Y = 860, S = 1.45;
    const cm = cam(1060, 520, 1.28);
    const typing = c.f > under - 8 && c.f < hand + 34;
    const tap = typing ? Math.abs(Math.sin(c.f * 1.1)) * 6 : c.f > wrote && c.f < under ? Math.max(0, Math.sin(c.f * 0.5)) * 4 : 0;
    const sp = (o: Partial<Pose>) => seat({ lean: 10, head: 18, turn: 0.45, R: { hand: [70, -184] }, L: { hand: [64, -192] }, ...o });
    const pz = poseAt(c.f, [
      [0, st(seat({ lean: 12, head: 8, turn: 0.55, R: { hand: [42, -266] }, L: { hand: [70, -152] } }), 'open', 'grip')],
      [wrote - 12, st(sp({}), 'point', 'grip'), 16],
      [due - 6, st(sp({ lean: 6, head: -2, turn: 0.75 }), 'point', 'grip'), 12],
      [hand + 26, st(sp({}), 'point', 'grip'), 14],
    ]);
    const p = { ...pz.p, R: { ...pz.p.R, hand: pz.p.R.hand ? [pz.p.R.hand[0], pz.p.R.hand[1] + tap] as V2 : undefined } };
    const fc = faceAt(c.f, [[0, face('anxious', { look: [0.9, -0.1] })], [wrote, face('anxious', { look: [0.6, 0.9] })], [press - 6, face('anxious', { look: [0.6, 0.9], brow: -1, tight: 0.7 })], [due - 4, face('anxious', { look: [1, -0.2], open: 1.2 })], [hand + 26, face('anxious', { look: [0.6, 0.9], brow: -1 })]]);
    const hd = W2(X, Y, S * 1.02, 1, headOf(p));
    const ring = c.p(due - 4, 14, ease.back), pulse = c.f > due ? 0.5 + 0.5 * Math.sin((c.f - due) / 5) : 0;
    const Sc = DESK.screen;
    const screen = <g>
      <rect x={Sc.x} y={Sc.y} width={Sc.w} height={Sc.h} fill={PAL.screenGlow} />
      <rect x={Sc.x} y={Sc.y} width={Sc.w} height={60} fill={PAL.focus} />
      <foreignObject x={Sc.x} y={Sc.y - 4} width={Sc.w} height={70}>
        <div dir="rtl" lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 44, color: '#FFFFFF', textAlign: 'center', lineHeight: 1.5 }}>التسليم</div>
      </foreignObject>
      {Array.from({ length: 12 }, (_, i) => {
        const col = i % 6, row = Math.floor(i / 6), x = Sc.x + 30 + col * 66, y = Sc.y + 82 + row * 76;
        return <rect key={i} x={x} y={y} width={56} height={64} rx={8} fill="#FFFFFF" stroke={PAL.textSoft} strokeWidth={2.4} />;
      })}
      <circle cx={Sc.x + 30 + 66 + 28} cy={Sc.y + 82 + 76 + 32} r={44 * Math.max(0.3, ring)} fill="none" stroke={PAL.warn} strokeWidth={7 + pulse * 3} opacity={0.6 + 0.4 * ring} />
    </g>;
    return <Stage cam={cm} over={<CardOver n={3} label="ضغط" lo={c.p(press - 4, 12)} f={c.f} />}>
      <DeskBack />
      <rect x={-10} y={-10} width={1940} height={1100} fill={NIGHT} opacity={0.42} />
      <Glow x={1280} y={480} r={560} ry={420} color="#DCE7F5" o={0.5} />
      <g transform="translate(985 205)"><Clock hours={11} minutes={40} r={46} /></g>
      <Actor f={c.f} seed={13} who="jaser" x={X} y={Y} s={S} facing={1} pose={{ p, hands: pz.hands }} face={fc}
        hold={{ L: <Phone w={28} glow={0.5} /> }} upright={{ L: true }} />
      <DeskFront screen={screen} />
      {[0, 1].map((i) => { const u = clamp01((c.f - press - i * 30) / 50); return u > 0 && u < 1 ? <path key={i} d={`M${hd[0] - 52 - i * 18} ${hd[1] - 60 + u * 70} q-9 16 0 22 q9 -6 0 -22 Z`} fill={PAL.waterLight} stroke={INK} strokeWidth={2.6} opacity={1 - u} /> : null; })}
    </Stage>;
  },

  // 53 — three closed doors: he looks from one to the next (we don't know which reading is right yet); on «يفتح» each door opens a crack of light.
  53: (c) => {
    const know = c.at('تعرف'), which = c.at('أيها'), right = c.at('الصحيح'), yet = c.at('بعد'), thisW = c.at('وهذا'), opens = c.at('يفتح'), door = c.at('الباب');
    const S = 1.6;
    const w = walkTo(c.f, door - 4, door + 40, 1730, 1630, S);
    const op = c.p(opens - 6, 50, ease.out) * 0.42;
    const pz = c.f > door - 4 && c.f < door + 40 ? { p: w.p } : poseAt(c.f, [
      [0, st(pose({ head: 4, turn: 0.55 }))],
      [yet - 14, st(pose({ ...POSES.shrug.p, turn: 0.4 }), 'cup', 'cup'), 16],
      [thisW + 12, st(pose({ head: -4, turn: 0.55 })), 20],
      [opens + 8, st(pose({ ...POSES.handOnChest.p, head: -2, turn: 0.6 }), 'relaxed', 'open'), 18],
      [door + 40, st(pose({ head: -4, turn: 0.6 })), 16],
    ]);
    const lookX = k(c.f, [[which - 4, 0.2], [which + 8, 0.5], [right, 0.5], [right + 10, 0.9], [yet - 10, 0.9], [yet, 0.2]]);
    const fc = faceAt(c.f, [[0, face('anxious', { look: [0.3, 0] })], [which, face('thinking', { look: [lookX, 0] })], [yet - 6, face('anxious', { look: [0, 0.2], browY: 0.5 })], [thisW + 6, face('calm', { look: [0.6, 0] })], [opens + 4, face('relieved', { look: [0.8, -0.1] })], [door, face('smile', { look: [0.9, 0] })]]);
    const hd = W2(w.x, 960, S, -1, headOf(pz.p));
    return <Stage>
      <Doors t={c.t} open={[op, op, op]} glow={1} />
      <Actor f={c.f} seed={41} who="salim" x={w.x} y={960} s={S} facing={-1} pose={pz} face={c.f > which && c.f < yet ? { ...fc, look: [lookX, 0] } : fc} />
      <WLabel x={hd[0] - 10} y={hd[1] - 140} text="؟" size={110} color={PAL.focus} o={c.p(know - 2, 12, ease.back) * (1 - c.p(thisW + 6, 14))} />
    </Stage>;
  },

  // 54 — neither the worst nor the best: a dark cloud in one hand, rose glasses in the other; he sets each aside on its plinth (on «ولا» and after «بأفضله»).
  54: (c) => {
    const worst = c.at('أسوأ'), nor = c.at('ولا'), conv = c.at('تقنع'), best = c.at('بأفضله');
    const X = 960, Y = 980, S = 1.8;
    const base = POSES.standFront.p;
    const rLow: V2 = [-58, -150], rUp: V2 = [-82, -238], rSet: V2 = [-100, -139];
    const lLow: V2 = [58, -150], lUp: V2 = [82, -238], lSet: V2 = [100, -139];
    const cloudSet = nor + 12, glassSet = best + 30;
    const Rh: V2 = [k(c.f, [[worst - 18, rLow[0]], [worst, rUp[0]], [nor - 8, rUp[0]], [cloudSet, rSet[0]], [cloudSet + 22, -40]]), k(c.f, [[worst - 18, rLow[1]], [worst, rUp[1]], [nor - 8, rUp[1]], [cloudSet, rSet[1]], [cloudSet + 22, -140]])];
    const Lh: V2 = [k(c.f, [[best - 20, lLow[0]], [best - 2, lUp[0]], [best + 10, lUp[0]], [glassSet, lSet[0]], [glassSet + 20, 40]]), k(c.f, [[best - 20, lLow[1]], [best - 2, lUp[1]], [best + 10, lUp[1]], [glassSet, lSet[1]], [glassSet + 20, -140]])];
    const headTurn = k(c.f, [[worst - 14, 0], [worst, -0.45], [cloudSet + 10, -0.45], [cloudSet + 26, 0], [conv - 6, 0], [conv + 10, 0.45], [glassSet + 8, 0.45], [glassSet + 24, 0]]);
    const p = pose({ ...base, turn: headTurn, head: k(c.f, [[0, 4], [worst, -4], [cloudSet, 8], [cloudSet + 20, 2], [best, -4], [glassSet, 8], [glassSet + 20, 0]]), R: { hand: Rh, bend: 1 }, L: { hand: Lh, bend: -1 } });
    const fc = faceAt(c.f, [[0, face('neutral', { look: [0, 0.2] })], [worst - 4, face('anxious', { look: [-0.9, -0.2] })], [cloudSet + 10, face('neutral', { look: [0, 0] })], [conv, face('thinking', { look: [0.9, 0.2] })], [best, face('smile', { look: [0.9, -0.1], skew: 0.6 })], [glassSet + 10, face('calm', { look: [0, 0] })]]);
    const rw = W2(X, Y, S, 1, wristOf(p, 'R'));
    const cloudHeld = c.f < cloudSet;
    const cpos: V2 = cloudHeld ? [rw[0] - 4, rw[1] - 56] : [780, 676];
    const dark = c.p(worst - 6, 20);
    const glassHeld = c.f < glassSet;
    const sparkle = c.p(best - 4, 12) * (glassHeld ? 1 : 1 - c.p(glassSet, 20));
    return <Stage>
      <Paper seed={54} />
      <Floor y={980} seed={54} />
      <Stool x={780} top={730} floor={985} />
      <Stool x={1140} top={730} floor={985} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={Y} s={S} facing={1} pose={{ p, hands: { R: cloudHeld ? 'cup' : 'relaxed', L: glassHeld ? 'grip' : 'relaxed' } }} face={fc}
        hold={glassHeld ? { L: <GlassesProp lens={PAL.rose} lensO={0.75} /> } : undefined} upright={{ L: true }} />
      <DarkCloud x={cpos[0]} y={cpos[1]} r={cloudHeld ? mix(36, 46, dark) : 46} f={c.f} dark={dark} />
      {!glassHeld && <g transform="translate(1140 704) scale(2.6)"><GlassesProp lens={PAL.rose} lensO={0.75} /></g>}
      {sparkle > 0 && (() => { const lw = W2(X, Y, S, 1, wristOf(p, 'L')); return [0, 1, 2].map((i) => <path key={i} d={`M${lw[0] + 30 + i * 30} ${lw[1] - 70 - (i % 2) * 30} l0 -22 M${lw[0] + 19 + i * 30} ${lw[1] - 81 - (i % 2) * 30} l22 0`} stroke={PAL.rose} strokeWidth={5} strokeLinecap="round" opacity={sparkle * (0.5 + 0.5 * Math.sin(c.f / 4 + i))} />); })()}
      <WLabel x={cloudHeld ? cpos[0] : 780} y={cloudHeld ? cpos[1] - 100 : 560} text="الأسوأ" size={52} color={PAL.storm} o={c.p(worst - 4, 12)} />
      <WLabel x={1140} y={560} text="الأفضل" size={52} color={PAL.warn} o={c.p(best - 4, 12)} />
    </Stage>;
  },

  // 55 — night again: «أكثر من باب» rises as three little doors; on «تسأل» he types a short draft «ماذا تقصد؟» and keeps it «للصباح» instead of sending.
  55: (c) => {
    const more = c.at('أكثر'), door = c.at('باب'), ask = c.at('تسأل'), before = c.at('قبل'), judge = c.at('تحكم');
    const X = BEDROOM.bedSeat.x, Y = 860, S = 1.45;
    const cm = cam(1060, 480, 1.45);
    const Q = 'ماذا تقصد؟';
    const tA = ask - 22, tB = ask + 26;
    const typing = c.f > tA && c.f < tB;
    const n = Math.round(Q.length * clamp01((c.f - tA) / (tB - tA)));
    const tap = typing ? Math.max(0, Math.sin(c.f * 0.8)) * 4 : 0;
    const sp = (o: Partial<Pose>) => seat({ head: 14, turn: 0.45, lean: 4, R: { hand: [50, -128] }, L: { hand: [58, -190] }, ...o });
    const pz = poseAt(c.f, [
      [0, st(sp({}), 'relaxed', 'grip')],
      [more - 10, st(sp({ head: -6, turn: 0.2 }), 'relaxed', 'grip'), 16],
      [tA - 12, st(sp({ R: { hand: [62, -194] } }), 'point', 'grip'), 14],
      [tB + 4, st(sp({}), 'relaxed', 'grip'), 14],
      [judge + 10, st(sp({ head: -4, turn: 0.75, L: { hand: [62, -136] } }), 'relaxed', 'grip'), 24],
    ]);
    const p = { ...pz.p, R: { ...pz.p.R, hand: pz.p.R.hand ? [pz.p.R.hand[0], pz.p.R.hand[1] + tap] as V2 : undefined } };
    const fc = faceAt(c.f, [[0, face('calm', { look: [0.5, 0.8] })], [more - 6, face('thinking', { look: [-0.5, -0.8] })], [tA - 8, face('calm', { look: [0.5, 0.8] })], [judge + 10, face('relieved', { look: [0.8, -0.6] })]]);
    const hd = W2(X, Y, S, 1, headOf(p)), ph = W2(X, Y, S, 1, wristOf(p, 'L'));
    const card = c.p(tA - 6, 14, ease.back);
    const save = c.p(judge - 4, 30, ease.inOut);
    const cardC = lerp([1330, 300], [ph[0] + 10, ph[1] - 30], save);
    const sun = c.p(before - 4, 14, ease.back);
    const dOn = (i: number) => c.p([more, more + 14, door][i] - 4, 12, ease.back);
    return <Stage cam={cm} over={<Tag text="للصباح" at={toScreen(cm, [1330, 300 + 110])} o={sun * (1 - c.p(judge - 4, 10))} bg={PAL.calm} size={44} />}>
      <Bedroom night lamp={0.6} />
      <Actor f={c.f} seed={41} who="salim" x={X} y={Y} s={S} facing={1} pose={{ p, hands: pz.hands }} face={fc}
        hold={{ L: <Phone w={28} glow={0.5 + save * 0.4} screen={<ChatScreen name={JASER} messages={THREAD} header="night" draft={Q.slice(0, n)} />} /> }} upright={{ L: true }} />
      <Cloud x={700} y={260} w={360} h={220} to={[hd[0] - 50, hd[1] - 70]} o={c.p(more - 6, 14, ease.back) * (1 - c.p(tA, 16))}>
        {[0, 1, 2].map((i) => <g key={i} transform={`translate(${-90 + i * 90} 0) scale(${dOn(i)})`}><IconDoor s={70} accent={[PAL.provokeLight, PAL.wallLav, PAL.focusLight][i]} /></g>)}
      </Cloud>
      {card > 0.01 && save < 1 && <g transform={`translate(${cardC[0]} ${cardC[1]}) scale(${Math.min(1, card) * mix(1, 0.12, save)})`} opacity={1 - c.p(judge + 20, 8)}>
        {save < 0.05 && <path d={`M-200 40 L${ph[0] - cardC[0]} ${ph[1] - cardC[1] - 40}`} stroke={PAL.textSoft} strokeWidth={3} strokeDasharray="6 10" />}
        <path d={sketch(rrectPts(-230, -66, 460, 132, 40), 55, 1.2, true)} fill="#FFFFFF" stroke={INK} strokeWidth={4} strokeDasharray="16 10" />
        <WLabel x={0} y={6} text={Q.slice(0, n) || ' '} size={56} w={440} />
        {typing && <rect x={-Q.slice(0, n).length * 13 - 6} y={-28} width={4} height={56} fill={PAL.focus} opacity={Math.sin(c.f / 4) > 0 ? 1 : 0} />}
        {sun > 0 && <g transform={`translate(190 -76) scale(${sun})`}>
          <circle r={50} fill={PAL.calmLight} stroke={INK} strokeWidth={4} />
          <circle cy={-6} r={16} fill="#FFFFFF" stroke={INK} strokeWidth={3} />
          {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d="M0 -30 L0 -36" stroke={INK} strokeWidth={3} strokeLinecap="round" transform={`translate(0 -6) rotate(${i * 60})`} />)}
          <path d="M-22 24 H22" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        </g>}
      </g>}
    </Stage>;
  },

  // 56 — that night, lying awake: a rose cloud of another reply grows over his head on «تخيل»; his fist closes on «ردًا آخر», and we push into the cloud.
  56: (c) => {
    const imag = c.at('تخيل'), reply = c.at('ردا'), other = c.at('آخر');
    const FX = 1210, FY = 628, S = 1.45;
    const lift = k(c.f, [[reply - 14, 0], [reply + 6, 1]]);
    const p = pose({ ...POSES.standFront.p, turn: 0.7, body: 0.2, head: -4, breath: 0.5 + 0.5 * Math.sin(c.f / 40), R: { hand: [24, -150] }, L: { hand: [mix(34, 92, lift), mix(-176, -214, lift)] } });
    const fc = faceAt(c.f, [[0, face('irritated', { look: [1, 0], open: 0.95 })], [imag, face('determined', { look: [1, -0.4], brow: 0.8 })], [reply, face('angry', { look: [1, -0.4], open2: 0 })]]);
    const grow = c.p(imag - 6, 46, ease.back);
    const CX = 1180, CY = 330;
    const push = c.p(140, c.dur - 140, ease.in);
    const cm = cam(mix(1000, CX, push), mix(540, CY, push), mix(1.25, 2.6, push));
    const head: V2 = [FX - 410, FY - 12];
    const shakeFist = c.f > other ? shake(c.f, other, 30, 3, 1.4) : 0;
    const salimMini = pose({ ...POSES.point.p, lean: 6, L: { hand: [74, -300] } });
    return <Stage cam={cm}>
      <Bedroom night lamp={0.2} />
      <g transform={`rotate(-90 ${FX} ${FY + shakeFist})`}>
        <Character who="salim" only={['Head', 'Torso', 'RightArm', 'RightLeg', 'LeftLeg']} x={FX} y={FY} s={S} p={p} face={fc} blink={blinkAt(c.f, 41) * 0.6} />
      </g>
      <path d={sketch([[930, 600], [1060, 578], [1300, 592], [1520, 610], [1530, 790], [920, 790]], 56, 3, true)} fill="#9EABC6" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M960 640 Q1200 610 1500 650`} fill="none" stroke={INK} strokeWidth={2.4} opacity={0.3} />
      <g transform={`rotate(-90 ${FX} ${FY + shakeFist})`}>
        <Character who="salim" only={['LeftArm']} x={FX} y={FY} s={S} p={p} face={fc} hands={{ R: 'relaxed', L: lift > 0.5 ? 'fist' : 'relaxed' }} />
      </g>
      <Cloud x={CX} y={CY} w={760} h={440} to={[head[0] + 130, head[1] - 160]} o={grow} fill="#F4DDE5">
        <rect x={-60} y={50} width={300} height={40} rx={8} fill={PAL.table} stroke={INK} strokeWidth={3} />
        <MiniHead who="att1" x={-10} y={10} s={0.55} fc="surprised" turn={-0.4} />
        <MiniHead who="hadi" x={90} y={8} s={0.55} fc="anxious" turn={-0.4} />
        <MiniHead who="jaser" x={190} y={6} s={0.55} fc="surprised" turn={-0.4} />
        <Character who="salim" x={-190} y={150} s={0.6} facing={1} p={salimMini} hands={{ R: 'relaxed', L: 'fist' }} face="shout" />
      </Cloud>
    </Stage>;
  },

  // 57 — the imagined meeting (rose): he bursts in on «يدخل», raises his voice on «ويرفع صوته», slams the table on «ويضرب» (the mugs jump), puffs his chest on «ويثبت».
  57: (c) => {
    const enter = c.at('يدخل'), tom = c.at('غدا'), raise = c.at('ويرفع'), voice = c.at('صوته'), hit = c.at('ويضرب'), prove = c.at('ويثبت'), all = c.at('للجميع'), not = c.at('ليس');
    const doorO = k(c.f, [[enter - 14, 0], [enter - 6, 1], [enter + 90, 1], [enter + 130, 0.15]], ease.out);
    const w = walkTo(c.f, enter - 4, tom - 4, 130, 272, 1.45, { lean: 8 });
    const sc = mix(1.36, 1.45, clamp01((w.x - 130) / 142));
    const sy = mix(842, 860, clamp01((w.x - 130) / 142));
    const slam = hit;
    const raiseP = st(pose({ ...POSES.point.p, lean: 8, head: -6, turn: 0.55, L: { sh: 70, el: 10 } }), 'relaxed', 'point');
    const pz = c.f < tom - 4 ? { p: w.p, hands: { R: 'fist' as Gesture, L: 'fist' as Gesture } } : poseAt(c.f, [
      [tom - 4, st(pose({ lean: 4, head: -2, turn: 0.55, R: { sh: -4, el: 20 }, L: { sh: 8, el: 20 } }), 'fist', 'fist')],
      [raise - 8, raiseP, 12],
      [slam - 16, st(pose({ lean: -4, head: -8, turn: 0.55, L: { hand: [40, -328] } }), 'fist', 'fist'), 10],
      [slam - 2, st(pose({ lean: 14, head: 6, turn: 0.55, L: { hand: [54, -150] } }), 'fist', 'fist'), 5],
      [prove - 14, st(pose({ ...POSES.handsOnHips.p, breath: 1, lean: -6, head: -10, turn: 0.4 }), 'fist', 'fist'), 18],
      [all, st(pose({ ...POSES.handsOnHips.p, breath: 1, lean: -6, head: -10, turn: 0.75 }), 'fist', 'fist'), 20],
      [not - 6, st(pose({ ...POSES.handsOnHips.p, breath: 1, lean: -8, head: -14 + nod(c.f, not, 1, 6), turn: 0.3 }), 'fist', 'fist'), 18],
    ]);
    const fc = faceAt(c.f, [[0, face('angry', { look: [1, 0] })], [raise - 4, 'shout', 8], [voice + 24, face('angry', { look: [1, 0] })], [slam - 4, face('shout', { open2: 0.5 }), 6], [slam + 30, face('angry', { look: [1, 0] })], [prove - 6, face('smug', { look: [0.8, -0.1], brow: 0.6 })]]);
    const hd = W2(w.x, sy, sc, 1, headOf(pz.p));
    const startle = (i: number) => k(c.f, [[slam - 2 + i * 2, 0], [slam + 4 + i * 2, 1], [slam + 50, 0.4]]);
    const fear = (base: Expr) => faceAt(c.f, [[0, face(base, { look: [0.3, 0.3] })], [enter - 6, face('surprised', { look: [1, 0] })], [raise, face('anxious', { look: [1, 0] })], [slam, face('surprised', { open: 1.3, open2: 0.6 }), 4], [slam + 40, face('anxious', { look: [1, 0], open: 1.1 })]]);
    const sit = (i: number, o: Partial<Pose> = {}) => atTable({ lean: -10 * startle(i) + 2, head: -6 * startle(i), turn: 0.55, ...o });
    const hop = (u: number) => (u <= 0 || u >= 1 ? 0 : Math.abs(Math.sin(u * Math.PI * 2.2)) * 50 * (1 - u));
    const mugU = (d: number) => clamp01((c.f - slam - d) / 34);
    const shk = shake(c.f, slam, 22, 8, 1.7);
    const cm = cam(820 + shk, 560, 1.3);
    return <Stage cam={cm} over={<Dream />}>
      <MeetingBack t={c.t} />
      <Door x={44} w={190} top={300} leaf={PAL.wood} beyond={PAL.wallGrey} glass open={doorO} seed={11} />
      {(['att1', 'hadi', 'att2'] as const).map((who, j) => <Seated key={who} f={c.f} i={j + 1} who={who} p={sit(j)} fc={fear('listening')} />)}
      <Seated f={c.f} i={4} who="jaser" p={atTable({ lean: -6 - 6 * startle(3), head: -4, turn: 0.5 })} fc={faceAt(c.f, [[0, 'smug'], [enter - 6, face('surprised', { look: [1, 0] })], [slam, face('surprised', { open: 1.3 }), 4], [slam + 40, face('contempt', { look: [1, 0] })]])} hands={{ R: 'relaxed', L: 'relaxed' }} />
      <MeetingTableFront />
      {[[430, 0, PAL.focus], [700, 4, PAL.calmLight], [1180, 8, PAL.wallLav]].map(([x, d, col], i) => <g key={i} transform={`translate(${x} ${636 - hop(mugU(d as number))}) rotate(${Math.sin(mugU(d as number) * 9) * 14 * (1 - mugU(d as number))}) scale(1.4)`}><Mug color={col as string} /></g>)}
      {c.f > slam - 1 && c.f < slam + 18 && [0, 1, 2, 3, 4].map((i) => { const a = -Math.PI * (0.15 + i * 0.17), u = (c.f - slam + 1) / 18; return <path key={i} d={`M${330 + Math.cos(a) * (40 + u * 60)} ${640 + Math.sin(a) * (40 + u * 60)} l${Math.cos(a) * 30} ${Math.sin(a) * 30}`} stroke={INK} strokeWidth={6} strokeLinecap="round" opacity={1 - u} />; })}
      <Actor f={c.f} seed={41} who="salim" x={w.x} y={sy} s={sc} facing={1} pose={pz} face={fc} say={[raise, voice + 30]} o={c.p(enter - 8, 8)} />
      <ShoutArcs x={hd[0] + 80} y={hd[1] + 20} f={c.f} o={c.p(raise, 8) * (1 - c.p(voice + 30, 10))} />
    </Stage>;
  },

  // 58 — the fantasy freezes: hands on hips, a huge shadow behind him grows on «استعراض»; «استعراض للقوة» stamps in.
  58: (c) => {
    const show = c.at('استعراض'), power = c.at('للقوة');
    const X = 272, Y = 860, S = 1.45;
    const cm = cam(600, 600, 1.45);
    const big = c.p(show - 10, 34, ease.out);
    const sp = pose({ ...POSES.handsOnHips.p, breath: 0.6 + 0.4 * Math.sin(c.f / 12), lean: -8, head: -14, turn: 0.3 });
    const fz = (i: number, who: 'att1' | 'hadi' | 'att2') => <Seated key={who} f={0} i={i} who={who} p={atTable({ lean: -8, head: -5, turn: 0.55 })} fc={face('anxious', { look: [1, 0], open: 1.1 })} />;
    const stampP = c.p(show + 2, 10);
    return <Stage cam={cm} over={<>
      <Dream />
      {stampP > 0 && <div style={{ position: 'absolute', left: 1020, top: 160, transform: `rotate(-6deg) scale(${mix(1.6, 1, ease.out(stampP))})`, opacity: Math.min(1, stampP * 2), border: `8px solid ${PAL.provoke}`, borderRadius: 18, padding: '4px 34px 14px', background: 'rgba(255,255,255,0.7)' }}>
        <div dir="rtl" lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 70, color: PAL.provoke, lineHeight: 1.3 }}>استعراض للقوة</div>
      </div>}
    </>}>
      <Filters />
      <g filter="url(#b3-frz)">
        <MeetingBack t={0} />
        <g filter="url(#b3-sil)" opacity={0.45}>
          <Character who="salim" x={X + 150} y={Y + 20} s={mix(1.45, 2.05, big)} facing={1} p={sp} hands={{ R: 'fist', L: 'fist' }} />
        </g>
        {fz(1, 'att1')}{fz(2, 'hadi')}{fz(3, 'att2')}
        <MeetingTableFront />
      </g>
      <g transform="translate(140 390)" opacity={1 - c.p(show, 20) * 0.5}><IconPause s={80} /></g>
      <Actor f={c.f} seed={41} who="salim" x={X} y={Y} s={S} facing={1} pose={st(sp, 'fist', 'fist')} face={face('smug', { look: [0.8, -0.1], brow: 0.6 })} />
    </Stage>;
  },

  // 59 — it looks strong for a moment (his silhouette shrinks on «لحظة»); on «يدافعون» they raise papers as shields and cross arms, Jaser shouts back; on «يسمعوا» a listening ear is crossed out.
  59: (c) => {
    const mom = c.at('لحظة'), others = c.at('الآخرين'), defend = c.at('يدافعون'), listen = c.at('يسمعوا');
    const cm = cam(960, 560, 1.45);
    const shrink = c.p(mom - 4, 30, ease.inOut);
    const up = (i: number) => c.p(defend - 8 + i * 5, 14);
    const shieldP = (u: number) => atTable({ lean: mix(0, -6, u), head: mix(0, 6, u), turn: 0.55, L: { hand: [mix(76, 64, u), mix(-154, -218, u)] }, R: { hand: [mix(58, 40, u), mix(-156, -196, u)] } });
    const crossP = (u: number) => atTable({ lean: mix(0, -6, u), head: mix(0, -6, u), turn: 0.55, R: { hand: [mix(58, 22, u), mix(-156, -178, u)], bend: -1 }, L: { hand: [mix(76, -2, u), mix(-154, -182, u)], bend: -1 } });
    const glance = k(c.f, [[others - 4, 0.55], [others + 10, 0.1], [defend - 10, 0.1], [defend, 0.55]]);
    const jz = c.p(defend - 6, 12);
    const jP = atTable({ lean: mix(-6, 12, jz), head: mix(-4, -8, jz), turn: 0.5, L: { hand: [mix(76, 104, jz), mix(-154, -236, jz)] } });
    const jHead = W2(SEAT[4], MEET_FEET, MEET_S * 1.02, -1, headOf(jP));
    const ear = c.p(listen - 6, 14, ease.back), cross = c.p(listen + 6, 12);
    const defFace = (u: number) => face('anxious', { look: [1, 0], brow: mix(-0.8, 0.4, u), tight: mix(0.4, 0.9, u) });
    return <Stage cam={cm} over={<>
      <Dream />
      {jz > 0 && <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {(() => { const h = toScreen(cm, jHead); return <g transform={`translate(${h[0] - 230} ${h[1] - 190}) scale(${mix(0.5, 1, jz)})`} opacity={jz}><SpeechBubble kind="shout" w={210} h={150} tail={[140, 120]}>!!</SpeechBubble></g>; })()}
      </svg>}
    </>}>
      <Filters />
      <MeetingBack t={c.t} />
      <Seated f={c.f} i={1} who="att1" p={{ ...crossP(up(0)), turn: up(0) > 0.5 ? 0.55 : glance }} fc={defFace(up(0))} hands={{ R: up(0) > 0.5 ? 'fist' : 'relaxed', L: up(0) > 0.5 ? 'fist' : 'relaxed' }} />
      <Seated f={c.f} i={2} who="hadi" p={{ ...shieldP(up(1)), turn: up(1) > 0.5 ? 0.55 : -glance }} fc={defFace(up(1))} hands={{ R: 'relaxed', L: 'grip' }} hold={up(1) > 0.05 ? { L: <Shield /> } : undefined} up={{ L: true }} />
      <Seated f={c.f} i={3} who="att2" p={{ ...shieldP(up(2)), turn: up(2) > 0.5 ? 0.55 : glance }} fc={defFace(up(2))} hands={{ R: 'relaxed', L: 'grip' }} hold={up(2) > 0.05 ? { L: <Shield /> } : undefined} up={{ L: true }} />
      <Seated f={c.f} i={4} who="jaser" p={jP} fc={jz > 0.3 ? face('shout', { look: [1, 0] }) : face('irritated', { look: [1, 0] })} hands={{ R: 'relaxed', L: jz > 0.5 ? 'point' : 'relaxed' }} say={[defend, listen]} />
      <MeetingTableFront />
      {shrink < 1 && <g filter="url(#b3-sil)" opacity={0.65 * (1 - shrink)}>
        <Character who="salim" x={440} y={1150} s={mix(2.4, 1.6, shrink)} facing={1} p={pose({ ...POSES.handsOnHips.p, breath: 1, lean: -6 })} hands={{ R: 'fist', L: 'fist' }} />
      </g>}
      {ear > 0 && <g transform={`translate(960 330) scale(${ear})`}>
        <circle r={70} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
        <IconEar s={90} />
        <path d="M-56 56 L56 -56" stroke={PAL.provoke} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={`${cross} 1`} />
      </g>}
    </Stage>;
  },

  // 60 — the provoker picks the moment: Jaser holds the strings; on «يختار اللحظة» he waits, and on «تنفجر» he yanks — Salim jumps up exploding.
  60: (c) => {
    const follow = c.at('تابعا'), prov = c.at('للمستفز'), choose = c.at('يختار'), moment = c.at('اللحظة'), boom = c.at('تنفجر');
    const JX = 1500, JY = 600, JS = 1.5;
    const yank = k(c.f, [[boom - 14, 0], [boom - 6, 0.3], [boom, -1]], ease.inOut);
    const test = k(c.f, [[follow - 6, 0], [follow + 6, 0.5], [follow + 22, 0]]);
    const jP = pose({ lean: -2, head: -6, turn: 0.45, L: { hand: [96, -206 + yank * 70 + test * 20] }, R: c.f > choose - 8 && c.f < boom - 10 ? { hand: [40, -296] } : { sh: -6, el: 10 } });
    const jFace = faceAt(c.f, [[0, 'smug'], [choose - 6, face('smug', { skew: 1, look: [1, 0.6], brow: 0.5 })], [boom - 8, face('smug', { skew: 1, mouth: 0.8, squint: 0.6, look: [1, 0.8] })]]);
    const bar = W2(JX, JY, JS * 1.02, -1, wristOf(jP, 'L'));
    const BW: V2 = [bar[0], bar[1] + 10];
    const SX = 760, SY = 970, S = 1.6;
    const jump = k(c.f, [[boom, 0], [boom + 8, -60], [boom + 30, 0]], ease.out);
    const ex = c.p(boom - 2, 10, ease.out);
    const slack = pose({ lean: 8, head: 20, turn: 0.45, R: { hand: [-6, -120 - test * 40] }, L: { hand: [40, -122 - test * 40] }, bob: 4 });
    const blown = pose({ lean: -6, head: -10, turn: 0.35, R: { hand: [-54, -326] }, L: { hand: [70, -326] }, footR: [-30, 0], footL: [30, 0] });
    const sP = poseAt(c.f, [[0, st(slack)], [boom - 2, st(blown, 'open', 'open'), 6], [boom + 60, st(pose({ ...blown, head: -4, R: { hand: [-50, -300] }, L: { hand: [66, -300] } }), 'fist', 'fist'), 30]]);
    const sFace = faceAt(c.f, [[0, face('irritated', { look: [0.8, 0.6], open: 0.8 })], [moment, face('irritated', { look: [0.9, -0.4], brow: 0.8 })], [boom - 2, 'shout', 4], [boom + 60, face('angry', { open2: 0.3 })]]);
    const sy = SY + jump;
    const rw = W2(SX, sy, S, 1, wristOf(sP.p, 'R')), lw = W2(SX, sy, S, 1, wristOf(sP.p, 'L')), sh = W2(SX, sy, S, 1, headOf(sP.p));
    const ends: V2[] = [[BW[0] - 110, BW[1]], [BW[0] + 110, BW[1]], [BW[0], BW[1] + 60]];
    const targets: V2[] = [rw, lw, [sh[0], sh[1] - 80]];
    const taut = c.f > moment ? 1 : 0.4 + 0.2 * Math.sin(c.f / 20);
    const clock = c.p(moment - 6, 12, ease.back) * (1 - c.p(boom + 4, 10));
    return <Stage over={<Tag text="المستفز" at={[JX + 60, 720]} o={c.p(prov - 4, 12)} bg={PAL.provoke} size={44} />}>
      <Paper seed={60} />
      <Floor y={970} seed={60} />
      <path d={sketchRect(1300, JY, 520, 600, 61, 1.6)} fill={PAL.paperShade} stroke={INK} strokeWidth={4} />
      <Burst x={sh[0]} y={sh[1] + 60} r={mix(80, 320, ex)} o={ex * (1 - c.p(boom + 60, 40) * 0.5)} />
      <Actor f={c.f} seed={41} who="salim" x={SX} y={sy} s={S} facing={1} pose={sP} face={sFace} say={[boom, boom + 40]} />
      {ends.map((e, i) => { const t = targets[i], m: V2 = [(e[0] + t[0]) / 2, (e[1] + t[1]) / 2 + (1 - taut) * 50]; return <path key={i} d={`M${e[0]} ${e[1]} Q${m[0]} ${m[1]} ${t[0]} ${t[1]}`} stroke={INK} strokeWidth={2.6} fill="none" opacity={0.8} />; })}
      <Actor f={c.f} seed={13} who="jaser" x={JX} y={JY} s={JS} facing={-1} pose={{ p: jP, hands: { R: c.f > choose - 8 && c.f < boom - 10 ? 'point' : 'relaxed', L: 'grip' } }} face={jFace} />
      <Bar x={BW[0]} y={BW[1]} rot={yank * 8} />
      {clock > 0 && <g transform={`translate(${JX + 130} ${JY - 520}) scale(${clock})`}>
        <circle r={56} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
        <Clock hours={11} minutes={(c.f - moment) * 0.5 + 40} r={48} />
      </g>}
      <ShoutArcs x={sh[0] + 70} y={sh[1] + 20} f={c.f} o={ex * (1 - c.p(boom + 50, 20))} s={1.2} />
    </Stage>;
  },
};
