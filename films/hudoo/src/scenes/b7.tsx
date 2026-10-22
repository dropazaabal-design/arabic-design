import React from 'react';
import { BODY, TITLE } from '../fonts';
import { CAST } from '../kit/characters/cast';
import { EXPRESSIONS, type Expr, type Face } from '../kit/characters/face';
import { Hand, type Gesture } from '../kit/characters/hands';
import { pose, type Pose } from '../kit/characters/skeleton';
import { Bedroom } from '../kit/places/Bedroom';
import { DINING, DiningBack, DiningTableFront } from '../kit/places/Dining';
import { HomeLiving, HOME } from '../kit/places/HomeLiving';
import { Glow, Plant, Rect, Room, Window } from '../kit/places/parts';
import { Glass, IconEye, IconHeart, LockScreen, Mug, Notebook, Pen, Phone, Plate, PostScreen, ThoughtCloud, type PostComment } from '../kit/props';
import { INK, PAL, hash, sketch } from '../kit/style';
import { Actor, Cap, Paper, Say, Stage, ease, faceAt, k, mix, poseAt, toScreen, type Cam } from '../film/engine';
import type { ShotRender } from '../film/Film';
import { Arrow, Floor, WLabel, atTable, cam, nod, shake } from './common';

// Chapter 10 «تدريب يومي» (the notebook) and chapter 11 «في البيت والعمل والإنترنت»: shots 121–140.
type V2 = [number, number];
type Pz = { p: Pose; hands?: { R: Gesture; L: Gesture } };
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const face = (base: Expr, o: Partial<Face>): Face => ({ ...EXPRESSIONS[base], ...o });
const P = (o: Partial<Pose>, R: Gesture = 'relaxed', L: Gesture = 'relaxed'): Pz => ({ p: pose(o), hands: { R, L } });
const ramp = (f: number, a: number, b: number) => clamp01((f - a) / Math.max(1, b - a));

/** The part of a polyline drawn up to u (0..1); its last point is the pen tip. */
const partial = (pts: V2[], u: number): V2[] => {
  const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  let left = clamp01(u) * seg.reduce((a, b) => a + b, 0);
  const out: V2[] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (left >= seg[i]) { out.push(pts[i + 1]); left -= seg[i]; continue; }
    const t = left / (seg[i] || 1);
    out.push([mix(pts[i][0], pts[i + 1][0], t), mix(pts[i][1], pts[i + 1][1], t)]);
    break;
  }
  return out;
};
const line = (pts: V2[]) => pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
const ellipsePts = (cx: number, cy: number, rx: number, ry: number, turns = 1.12, a0 = -2.2, n = 44): V2[] =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 - (i / n) * turns * Math.PI * 2, w = 1 + (i / n) * 0.08; return [cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]; });

// ——— the notebook page (shared by 121 and the four inserts) ———
const HANDINK = '#2C4A7C';
const LINES = ['ماذا حدث؟', '', 'ماذا شعرت؟', '', '', 'أين شعرت به في جسدي؟', '', '', '', 'ماذا فعلت؟ وماذا أجرب؟'];
const LEN = LINES.map((l) => Math.max(1, Array.from(l).length));
const TOTAL = LEN.reduce((a, b) => a + b, 0);
/** Notebook `written` with every line before row i done and row i at progress p. */
const upTo = (i: number, p: number) => (LEN.slice(0, i).reduce((a, b) => a + b, 0) + clamp01(p) * LEN[i]) / TOTAL;
const geo = (w: number) => { const pw = w / 2, ph = w * 0.66, ls = ph * 0.074; return { w, pw, ph, ls, y0: -ph / 2 + ph * 0.13, fs: ls * 0.72 }; };
const NB = { x: 560, y: 540, ...geo(1500) };
const rowY = (i: number) => NB.y + NB.y0 + i * NB.ls;
const rowR = (i: number) => NB.x + NB.pw * 0.85 - (i % 3) * NB.w * 0.004;
// ponytail: line width estimated from the character count like the Notebook does (0.5 em per letter); 0.88 tuned by eye
const rowW = (i: number) => { const n = LEN[i]; return n * 0.5 * Math.min(NB.fs, (NB.pw * 0.78) / (n * 0.5)) * 0.88; };
const tipOn = (i: number, p: number): V2 => [rowR(i) - p * rowW(i), rowY(i) - NB.ls * 0.22];

type Seg = { a: number; b: number; from: V2; to: V2; ink?: boolean; path?: V2[] };
/** Pen tip over time: writing segments are linear, the moves between them eased and lifted. */
const penTip = (f: number, segs: Seg[]): { tip: V2; lift: number } => {
  const at = (s: Seg, u: number): V2 => (s.path ? partial(s.path, u).slice(-1)[0] : [mix(s.from[0], s.to[0], s.ink ? u : ease.inOut(u)), mix(s.from[1], s.to[1], s.ink ? u : ease.inOut(u))]);
  let pos: V2 = segs[0].from, ink = 0;
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i], n = segs[i + 1];
    if (f < s.a) { pos = i === 0 ? s.from : pos; break; }
    if (f <= s.b) { pos = at(s, (f - s.a) / Math.max(1, s.b - s.a)); ink = s.ink ? 1 : 0; break; }
    pos = s.path ? s.path[s.path.length - 1] : s.to;
    if (n && f < n.a) { const u = ease.inOut((f - s.b) / Math.max(1, n.a - s.b)); pos = [mix(pos[0], n.from[0], u), mix(pos[1], n.from[1], u)]; break; }
  }
  return { tip: [pos[0] + Math.sin(f * 1.3) * 4 * ink + (1 - ink) * Math.sin(f * 0.07) * 3, pos[1] + Math.sin(f * 0.9) * 6 * ink - (1 - ink) * 12], lift: 1 - ink };
};

/** Salim's left hand writing, seen from above: green sleeve from the bottom-left, pen tip at `tip`. */
const PenHand: React.FC<{ tip: V2; s?: number; ang?: number; lift?: number }> = ({ tip, s = 8, ang = -46, lift = 0 }) => {
  const a = (ang * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a), sc = s * (1 + lift * 0.04);
  const wx = tip[0] - ca * 27 * sc, wy = tip[1] - sa * 27 * sc;
  const arm = `M${wx - ca * 1500} ${wy - sa * 1500} L${wx} ${wy}`;
  return <g>
    <path d={arm} stroke={INK} strokeWidth={9 * sc + 9} strokeLinecap="round" fill="none" />
    <path d={arm} stroke={CAST.salim.shirt} strokeWidth={9 * sc} strokeLinecap="round" fill="none" />
    <g transform={`translate(${wx} ${wy}) rotate(${ang}) scale(${sc} ${-sc})`}>
      <Hand g="pen" skin={CAST.salim.skin} layer="back" />
      <g transform="translate(12 0)"><Pen /></g>
      <Hand g="pen" skin={CAST.salim.skin} layer="front" />
    </g>
  </g>;
};

/** Handwriting in the notebook's ink on rule `rule`, revealed from its right end. */
const Hw: React.FC<{ right: number; rule: number; text: string; p: number; size?: number; o?: number; color?: string }> = ({ right, rule, text, p, size = NB.fs, o = 1, color = HANDINK }) => p <= 0 ? null : (
  <foreignObject x={right - 700} y={rule - NB.ls * 0.68} width={700} height={NB.ls} opacity={o}>
    <div dir="rtl" lang="ar" style={{ width: 700, textAlign: 'right', fontFamily: BODY, fontWeight: 600, fontSize: size, lineHeight: `${NB.ls}px`, color, whiteSpace: 'nowrap' }}>
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <span style={{ visibility: 'hidden' }}>{text}</span>
        <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${clamp01(p) * 100}%`, overflow: 'hidden' }}><span style={{ position: 'absolute', right: 0, top: 0 }}>{text}</span></span>
      </span>
    </div>
  </foreignObject>
);

const DUVET = '#A9B4CB';
/** The open notebook on the duvet under the bedside lamp; yesterday's entry is a faint scrawl on the left page. */
const PageStage: React.FC<{ cam: Cam; written: number; children?: React.ReactNode; over?: React.ReactNode }> = ({ cam, written, children, over }) => (
  <Stage cam={cam} bg={DUVET} over={over}>
    <rect x={-800} y={-800} width={3600} height={2800} fill={DUVET} />
    {[0, 1, 2].map((i) => <path key={i} d={sketch([[-300, 160 + i * 400], [700, 90 + i * 410], [2300, 230 + i * 380]], 70 + i, 8)} stroke="#93A0BC" strokeWidth={12} fill="none" opacity={0.5} />)}
    <Glow x={150} y={-150} r={1400} ry={1000} color="#EEF0F8" o={0.6} />
    <ellipse cx={NB.x + 30} cy={NB.y + NB.ph / 2 + 16} rx={NB.w * 0.53} ry={34} fill={INK} opacity={0.15} />
    <g transform={`translate(${NB.x} ${NB.y})`}><Notebook lines={LINES} written={written} w={NB.w} /></g>
    {[0, 2, 5, 9].map((r, i) => <path key={r} d={Array.from({ length: 16 }, (_, j) => `${j ? 'L' : 'M'}${NB.x - NB.pw * 0.17 - j * (14 + i * 2)} ${rowY(r) - 20 + Math.sin(j * 1.7 + r) * 9}`).join(' ')} stroke={HANDINK} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />)}
    {children}
  </Stage>
);

// ——— gauges, the meter of the film's diagrams (no numbers) ———
const Gauge: React.FC<{ x: number; y: number; h: number; w?: number; fill: number; color?: string; o?: number }> = ({ x, y, h, w = 70, fill, color = PAL.warn, o = 1 }) => {
  const r = w / 2, inner = w - 20, fh = Math.max(0, (h - 20) * clamp01(fill));
  return <g opacity={o}>
    <rect x={x - r} y={y - h} width={w} height={h} rx={r} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
    {fh > 0 && <rect x={x - inner / 2} y={y - 10 - fh} width={inner} height={fh} rx={Math.min(inner / 2, fh / 2)} fill={color} />}
    {[0.25, 0.5, 0.75].map((t) => <path key={t} d={`M${x - r - 4} ${y - 10 - (h - 20) * t} h-16`} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.4} />)}
  </g>;
};
/** The "noticed" eye pinned beside a gauge at fill level `lv`. */
const EyeMark: React.FC<{ x: number; y: number; h: number; lv: number; o: number; s?: number }> = ({ x, y, h, lv, o, s = 64 }) => o <= 0 ? null : (
  <g transform={`translate(${x + 70} ${y - 10 - (h - 20) * lv}) scale(${mix(0.4, 1, Math.min(1, o))})`} opacity={Math.min(1, o * 2)}>
    <path d="M-60 0 H-26" stroke={PAL.focus} strokeWidth={5} strokeLinecap="round" />
    <circle r={s * 0.62} fill="#FFFFFF" stroke={PAL.focus} strokeWidth={4} />
    <IconEye s={s} />
  </g>
);

// ——— the family dinner ———
const DX = { salim: DINING.seats[1].x, reem: DINING.seats[2].x, mother: DINING.seats[3].x };
const DY = DINING.feetY, DS = DINING.scale;
/** Seated at the dinner table; hands rest on the top (y in character units, a little higher for the smaller women). */
const TB = (o: Partial<Pose> = {}, y = -170) => atTable({ R: { hand: [44, y] }, L: { hand: [60, y + 2] }, ...o });
const TBW = (o: Partial<Pose> = {}) => TB(o, -178);
type Diner = { pose: Pz; face: Face | Expr; say?: [number, number]; hold?: { R?: React.ReactNode; L?: React.ReactNode }; upright?: { R?: boolean; L?: boolean } };
const Dinner: React.FC<{ f: number; salim: Diner; reem: Diner; mother: Diner; over?: React.ReactNode }> = ({ f, salim, reem, mother, over }) => (
  <g>
    <DiningBack />
    <Actor f={f} seed={41} who="salim" x={DX.salim} y={DY} s={DS} facing={1} pose={salim.pose} face={salim.face} say={salim.say} hold={salim.hold} upright={salim.upright} />
    <Actor f={f} seed={23} who="reem" x={DX.reem} y={DY} s={DS} facing={-1} pose={reem.pose} face={reem.face} say={reem.say} hold={reem.hold} upright={reem.upright} />
    <Actor f={f} seed={31} who="mother" x={DX.mother} y={DY} s={DS} facing={-1} pose={mother.pose} face={mother.face} say={mother.say} hold={mother.hold} upright={mother.upright} />
    <DiningTableFront food />
    {over}
  </g>
);
/** Top of each diner's head in the world (for bubble tails). */
const HEAD = { salim: [DX.salim, DY - 318 * DS] as V2, reem: [DX.reem - 4, DY - 318 * DS * 0.95] as V2, mother: [DX.mother - 4, DY - 318 * DS * 0.95] as V2 };
const Spoon = () => <g>
  <path d="M-24 0 L5 0" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
  <path d="M-24 0 L5 0" stroke={PAL.metal} strokeWidth={2.2} strokeLinecap="round" />
  <ellipse cx={10} cy={0} rx={6.5} ry={4} fill={PAL.metal} stroke={INK} strokeWidth={1.4} />
</g>;
const HeldGlass = () => <g transform="scale(0.62) translate(0 24)"><Glass fill={0.55} /></g>;

// ——— the phone (136–138): one phone in the world, held in two hands, against the dark living room ———
const PH = { x: 960, y: 560, w: 500 };
const PHB = PH.w * 0.065, PHS = PH.w - 2 * PHB, PHK = PHS / 360;
const PH_BOTTOM = PH.y + PHS + PHB;
const scr = (u: number, v: number): V2 => [PH.x - PHS / 2 + u * PHK, PH.y - PHS + v * PHK];
const POST = { author: 'سليم', text: 'تعلمت هذا الأسبوع أن الهدوء لا يعني الكبت', time: '22:40' };
const FRIEND: PostComment = { name: 'منى', text: 'كلام جميل، شكرًا لك' };
const ANON: PostComment = { name: 'مجهول', text: 'كلام فاضي… مين سألك أصلًا؟', hostile: true };
/** Where PostScreen lays out the hostile comment (screen units, measured from a render): its avatar centre and card box. */
const ANON_AV: V2 = [332, 437];
const ANON_CARD = { u0: 46, u1: 308, v0: 412, v1: 500 };

/** A blank grey avatar: an account with no picture. */
const Faceless: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#8A94A4" stroke={INK} strokeWidth={Math.max(1.5, r * 0.1)} />
    <circle cx={x} cy={y - r * 0.2} r={r * 0.3} fill="#E6EAF0" />
    <path d={`M${x - r * 0.6} ${y + r * 0.72} Q${x - r * 0.55} ${y + r * 0.12} ${x} ${y + r * 0.14} Q${x + r * 0.55} ${y + r * 0.12} ${x + r * 0.6} ${y + r * 0.72} Z`} fill="#E6EAF0" />
  </g>
);

const NightBack: React.FC = () => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill="#2B3248" />
    <Glow x={250} y={220} r={700} ry={520} color="#E7E6F4" o={0.22} />
    <path d={sketch([[-200, 900], [700, 860], [1500, 880], [2200, 850]], 3, 6)} stroke="#3C4662" strokeWidth={240} fill="none" />
    <Glow x={PH.x} y={PH.y} r={620} ry={700} color={PAL.screenGlow} o={0.25} />
  </g>
);
const Thumb: React.FC<{ base: V2; tip: V2; w?: number }> = ({ base, tip, w = 70 }) => {
  const a = Math.atan2(tip[1] - base[1], tip[0] - base[0]), deg = (a * 180) / Math.PI;
  const d = `M${base[0]} ${base[1]} L${tip[0]} ${tip[1]}`;
  const mid: V2 = [mix(base[0], tip[0], 0.5), mix(base[1], tip[1], 0.5)];
  return <g>
    <path d={d} stroke={INK} strokeWidth={w + 9} strokeLinecap="round" />
    <path d={d} stroke={CAST.salim.skin} strokeWidth={w} strokeLinecap="round" />
    <path d={`M${mid[0] - Math.sin(a) * w * 0.3} ${mid[1] + Math.cos(a) * w * 0.3} l${Math.sin(a) * w * 0.25} ${-Math.cos(a) * w * 0.25}`} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
    <ellipse cx={tip[0] - Math.cos(a) * w * 0.14} cy={tip[1] - Math.sin(a) * w * 0.14} rx={w * 0.27} ry={w * 0.22} transform={`rotate(${deg} ${tip[0] - Math.cos(a) * w * 0.14} ${tip[1] - Math.sin(a) * w * 0.14})`} fill="#FBF5F3" stroke={INK} strokeWidth={3} />
  </g>;
};
const THUMB_BASE: [V2, V2] = [[PH.x - PH.w / 2 - 6, 965], [PH.x + PH.w / 2 + 6, 965]];
/** Palms and sleeves behind the phone (layer back), thumbs on the glass (layer front). */
const PhoneHands: React.FC<{ layer: 'back' | 'front'; tipL: V2; tipR: V2 }> = ({ layer, tipL, tipR }) => layer === 'back' ? (
  <g>
    {[-1, 1].map((s) => {
      const cx = PH.x + s * (PH.w / 2 + 20), cy = PH_BOTTOM - 40;
      const sl = `M${cx + s * 260} ${cy + 520} L${cx + s * 40} ${cy + 110}`;
      return <g key={s}>
        <path d={sl} stroke={INK} strokeWidth={178} strokeLinecap="round" />
        <path d={sl} stroke={CAST.salim.shirt} strokeWidth={168} strokeLinecap="round" />
        <ellipse cx={cx} cy={cy} rx={105} ry={165} transform={`rotate(${s * 22} ${cx} ${cy})`} fill={CAST.salim.skin} stroke={INK} strokeWidth={5} />
      </g>;
    })}
  </g>
) : (
  <g>
    <Thumb base={THUMB_BASE[0]} tip={tipL} />
    <Thumb base={THUMB_BASE[1]} tip={tipR} />
  </g>
);
const THUMB_REST: [V2, V2] = [[PH.x - PH.w / 2 + 60, 905], [PH.x + PH.w / 2 - 60, 905]];

/** The on-screen keyboard (screen units, bottom of the phone); `hot` lights the key being pressed. */
const KEY = { v0: 478, cols: 10, w: 31, gap: 4.4, rows: [496, 546, 596] };
const keyAt = (r: number, c: number): V2 => [8 + c * (KEY.w + KEY.gap) + KEY.w / 2, KEY.rows[r] + 20];
const Keyboard: React.FC<{ y: number; hot?: [number, number] | null }> = ({ y, hot }) => (
  <g transform={`translate(0 ${y})`}>
    <rect x={0} y={KEY.v0} width={360} height={260} fill="#D3D9DF" />
    {KEY.rows.map((ry, r) => Array.from({ length: r === 2 ? 8 : 10 }, (_, c) => {
      const cc = r === 2 ? c + 1 : c, [kx] = keyAt(r, cc);
      return <rect key={`${r}-${c}`} x={kx - KEY.w / 2} y={ry} width={KEY.w} height={40} rx={6} fill={hot && hot[0] === r && hot[1] === cc ? '#AEB8C6' : '#FFFFFF'} stroke="#9AA4AF" strokeWidth={1.2} />;
    }))}
    <rect x={8} y={646} width={52} height={40} rx={6} fill="#BCC4CE" stroke="#9AA4AF" strokeWidth={1.2} />
    <rect x={68} y={646} width={224} height={40} rx={6} fill="#FFFFFF" stroke="#9AA4AF" strokeWidth={1.2} />
    <rect x={300} y={646} width={52} height={40} rx={6} fill={PAL.calm} stroke="#9AA4AF" strokeWidth={1.2} />
  </g>
);
/** The reply bar above the keyboard with what Salim is typing. */
const ReplyBar: React.FC<{ y: number; text: string; caret: boolean }> = ({ y, text, caret }) => (
  <g transform={`translate(0 ${y})`}>
    <rect x={0} y={386} width={360} height={92} fill="#F8F9FA" />
    <path d="M0 386 H360" stroke="#D3D9DF" strokeWidth={1.5} />
    <foreignObject x={0} y={386} width={360} height={92}>
      <div dir="rtl" lang="ar" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', boxSizing: 'border-box', width: 360, height: 92, fontFamily: BODY }}>
        <div style={{ width: 34, height: 34, flex: 'none', borderRadius: 17, background: PAL.plum, border: `2px solid ${INK}`, boxSizing: 'border-box', color: '#FFFFFF', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>س</div>
        <div style={{ flex: 1, height: 74, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', background: '#FFFFFF', border: `2px solid ${INK}`, borderRadius: 18, boxSizing: 'border-box', padding: '4px 12px', fontSize: 20, fontWeight: 600, lineHeight: 1.45, color: text ? INK : '#6B7482' }}>
          <div>{text || 'اكتب ردًا…'}{caret && <span style={{ display: 'inline-block', width: 2.5, height: '1.1em', background: PAL.focus, verticalAlign: '-0.2em', marginInlineStart: 1 }} />}</div>
        </div>
      </div>
    </foreignObject>
  </g>
);

// ——— small drawings for the diagrams ———
const Battery: React.FC<{ x: number; y: number; charge: number }> = ({ x, y, charge }) => {
  const w = 230, h = 116, low = charge < 0.3;
  return <g>
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={20} fill="#FFFFFF" stroke={low ? PAL.warn : INK} strokeWidth={7} />
    <rect x={x + w / 2 + 2} y={y - 24} width={18} height={48} rx={6} fill={low ? PAL.warn : INK} />
    {[0, 1, 2, 3].map((i) => { const on = clamp01(charge * 4 - i); return on > 0 ? <rect key={i} x={x - w / 2 + 16 + i * 51} y={y - h / 2 + 16} width={42} height={h - 32} rx={7} fill={PAL.calm} opacity={on} /> : null; })}
    {low && <rect x={x - w / 2 + 16} y={y - h / 2 + 16} width={14} height={h - 32} rx={5} fill={PAL.warn} />}
  </g>;
};
const Msg: React.FC<{ x: number; y: number; s?: number; heavy?: number }> = ({ x, y, s = 1, heavy = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-56 -40 H56 Q66 -40 66 -30 V22 Q66 32 56 32 H-20 L-42 50 L-38 32 H-56 Q-66 32 -66 22 V-30 Q-66 -40 -56 -40 Z" fill={heavy > 0.5 ? PAL.provokeLight : '#FFFFFF'} stroke={INK} strokeWidth={5 + heavy * 3} strokeLinejoin="round" />
    {[-20, -4, 12].map((ly, i) => <path key={ly} d={`M40 ${ly} H${-40 + i * 16}`} stroke={heavy > 0.5 ? PAL.provoke : PAL.textSoft} strokeWidth={6} strokeLinecap="round" />)}
  </g>
);
/** A beam balance standing on y; `tilt` 0..1 brings the left pan down. */
const Balance: React.FC<{ x: number; y: number; tilt: number; left?: React.ReactNode }> = ({ x, y, tilt, left }) => {
  const py = y - 330, L = 210, d = tilt * 0.36;
  const ends: V2[] = [[x - L * Math.cos(d), py + L * Math.sin(d)], [x + L * Math.cos(d), py - L * Math.sin(d)]];
  return <g>
    <path d={`M${x - 110} ${y} H${x + 110} L${x + 70} ${y - 26} H${x - 70} Z`} fill={PAL.woodDark} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={x - 10} y={py} width={20} height={y - 26 - py} fill={PAL.metal} stroke={INK} strokeWidth={5} />
    <path d={line(ends)} stroke={INK} strokeWidth={16} strokeLinecap="round" />
    <path d={line(ends)} stroke={PAL.metal} strokeWidth={8} strokeLinecap="round" />
    <circle cx={x} cy={py} r={16} fill={PAL.chair} stroke={INK} strokeWidth={5} />
    {ends.map(([ex, ey], i) => <g key={i}>
      <path d={`M${ex} ${ey} L${ex - 78} ${ey + 120} M${ex} ${ey} L${ex + 78} ${ey + 120}`} stroke={INK} strokeWidth={3.5} />
      <path d={`M${ex - 90} ${ey + 120} H${ex + 90} Q${ex + 70} ${ey + 160} ${ex} ${ey + 160} Q${ex - 70} ${ey + 160} ${ex - 90} ${ey + 120} Z`} fill={PAL.metal} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {i === 0 && <g transform={`translate(${ex} ${ey + 120})`}>{left}</g>}
    </g>)}
  </g>;
};
/** A rubber stamp, gripped at its neck (origin), drawn upright. */
const Stamp: React.FC<{ color: string }> = ({ color }) => <g>
  <circle cx={0} cy={-9} r={7.5} fill={color} stroke={INK} strokeWidth={1.6} />
  <rect x={-3.5} y={-3} width={7} height={11} fill={PAL.woodDark} stroke={INK} strokeWidth={1.4} />
  <rect x={-14} y={8} width={28} height={9} rx={2} fill={PAL.wood} stroke={INK} strokeWidth={1.6} />
  <rect x={-13} y={17} width={26} height={3.5} fill={color} stroke={INK} strokeWidth={1.2} />
</g>;
const TaskCard: React.FC<{ x: number; y: number; imprint?: string; color: string; pop: number; seed: number }> = ({ x, y, imprint, color, pop, seed }) => (
  <g>
    <path d={sketch([[x - 152, y + 84], [x + 152, y + 84], [x + 144, y + 6], [x - 144, y + 6]], seed, 1)} fill={INK} opacity={0.1} />
    <path d={sketch([[x - 142, y - 80], [x + 142, y - 80], [x + 152, y + 76], [x - 152, y + 76]], seed, 1.2, true)} fill="#FFFFFF" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M${x - 141} ${y - 80} H${x + 141} V${y - 60} H${x - 142} Z`} fill={PAL.focusLight} />
    {[0, 1].map((i) => <path key={i} d={`M${x + 120} ${y - 38 + i * 22} H${x - 40 - (hash(seed + i) * 70)}`} stroke={PAL.metal} strokeWidth={8} strokeLinecap="round" />)}
    {imprint && pop > 0 && <g transform={`translate(${x} ${y + 32}) rotate(-5) scale(${mix(1.35, 1, ease.out(Math.min(1, pop)))})`} opacity={Math.min(1, pop * 2)}>
      <rect x={-128} y={-34} width={256} height={68} rx={14} fill="none" stroke={color} strokeWidth={5} />
      <WLabel x={0} y={4} text={imprint} size={46} color={color} w={256} />
    </g>}
  </g>
);
const DialogueIcon = () => <g>
  <path d="M-80 -60 H10 Q26 -60 26 -44 V-6 Q26 10 10 10 H-40 L-62 28 L-58 10 H-80 Q-96 10 -96 -6 V-44 Q-96 -60 -80 -60 Z" fill={PAL.calmLight} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  <path d="M-10 -10 H80 Q96 -10 96 6 V40 Q96 56 80 56 H58 L62 74 L40 56 H-10 Q-26 56 -26 40 V6 Q-26 -10 -10 -10 Z" fill="#FFFFFF" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  {[-62, -36, -10].map((x) => <circle key={x} cx={x} cy={-26} r={6} fill={PAL.calm} />)}
  {[8, 34, 60].map((x) => <circle key={x} cx={x} cy={24} r={6} fill={PAL.focus} />)}
</g>;
const Sword: React.FC<{ rot: number }> = ({ rot }) => <g transform={`rotate(${rot})`}>
  <path d="M-7 -96 L0 -112 L7 -96 V40 H-7 Z" fill={PAL.metal} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
  <rect x={-28} y={40} width={56} height={12} rx={5} fill={PAL.chairDark} stroke={INK} strokeWidth={4} />
  <rect x={-7} y={52} width={14} height={36} rx={4} fill={PAL.plum} stroke={INK} strokeWidth={4} />
</g>;
const BattleIcon: React.FC<{ t: number }> = ({ t }) => <g>
  <Sword rot={-40} /><Sword rot={40} />
  {[0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + (i - 2) * 0.5, r0 = 40 + Math.sin(t * 9 + i) * 4; return <path key={i} d={`M${Math.cos(a) * r0} ${-30 + Math.sin(a) * r0} l${Math.cos(a) * 26} ${Math.sin(a) * 26}`} stroke={PAL.warn} strokeWidth={6} strokeLinecap="round" />; })}
</g>;

/** Front-view office for the stamps (135): wall, window, shelf, chair back; the desk is drawn after Salim. */
const OfficeFront: React.FC = () => (
  <g>
    <Room wall={PAL.wallGrey} floor={PAL.floorBlue} seed={3} />
    <Window x={1360} y={150} w={400} h={330} id="b7-off-win" sky={PAL.sky} seed={11}>
      <path d="M1360 480 V380 H1420 V330 H1500 V400 H1560 V300 H1640 V420 H1700 V360 H1760 V480 Z" fill="#B6BED0" />
    </Window>
    <Rect x={150} y={330} w={420} h={12} fill={PAL.wood} seed={21} />
    {[PAL.focus, PAL.chair, PAL.calm, PAL.focusLight, PAL.storm].map((c, i) => <Rect key={c} x={180 + i * 40} y={240} w={34} h={90} fill={c} sw={2.4} seed={22 + i} />)}
    <Plant x={500} y={330} s={0.4} seed={27} pot={PAL.paper} n={7} />
    <path d={sketch([[860, 760], [850, 470], [880, 430], [1040, 430], [1070, 470], [1060, 760]], 41, 1.5, true)} fill={PAL.chair} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <Plant x={1800} y={830} s={1} seed={33} pot={PAL.wallLav} />
  </g>
);
const DeskSlab: React.FC = () => (
  <g>
    <path d={sketch([[220, 712], [1700, 712], [1700, 1100], [220, 1100]], 51, 1.5, true)} fill="#D9D5CE" stroke={INK} strokeWidth={4} />
    <path d={sketch([[200, 692], [1720, 692], [1720, 716], [200, 716]], 52, 1.2, true)} fill={PAL.paperShade} stroke={INK} strokeWidth={4} />
  </g>
);

/** A comment card for the flowing feed (140). kind: hostile (rose, spiky avatar) or plain; `q` marks the ones worth a reply. */
const FeedCard: React.FC<{ y: number; kind: 'hostile' | 'plain' | 'reply'; seed: number; o: number }> = ({ y, kind, seed, o }) => (
  <g opacity={o}>
    <path d={sketch([[620, y - 60], [1520, y - 60], [1520, y + 60], [620, y + 60]], seed, 1.4, true)} fill="#FFFFFF" stroke={kind === 'hostile' ? PAL.warn : INK} strokeWidth={kind === 'hostile' ? 6 : 4.5} strokeLinejoin="round" />
    {kind === 'hostile'
      ? <path d={Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 24 : 38; return `${i ? 'L' : 'M'}${1462 + Math.cos(a) * r} ${y + Math.sin(a) * r}`; }).join(' ') + 'Z'} fill={PAL.warn} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      : <circle cx={1462} cy={y} r={34} fill={kind === 'reply' ? PAL.focus : PAL.storm} stroke={INK} strokeWidth={3.5} />}
    {[0, 1].map((i) => <path key={i} d={`M${1400} ${y - 18 + i * 36} H${1400 - 340 - hash(seed + i) * 380}`} stroke={kind === 'hostile' ? PAL.provokeLight : PAL.metal} strokeWidth={14} strokeLinecap="round" />)}
  </g>
);

export const SHOTS: Record<number, ShotRender> = {
  // 121 — every evening: the lamp clicks on at «كل», he writes on «يكتب», four lines fill the page on «أربعة أسطر».
  121: (c) => {
    const on = c.at('كل'), wr = c.at('يكتب'), four = c.at('أربعة');
    const X = 760, S = 1.45, NX = 862, NY = 662, g = geo(150);
    const spans: [number, number][] = [[wr - 6, four - 8], [four - 4, four + 18], [four + 22, four + 46], [four + 50, c.dur - 6]];
    const rows = [0, 2, 5, 9];
    let row = -1, pr = 0;
    spans.forEach(([a, b], j) => { if (c.f >= a) { row = rows[j]; pr = clamp01((c.f - a) / (b - a)); } });
    const written = row < 0 ? 0 : upTo(row, pr);
    const ink = row >= 0 && pr < 1 ? 1 : 0;
    // pen tip on the small page, then the wrist that puts it there (the pen points forward and down from the hand)
    const r = Math.max(0, row), n = LEN[r];
    const tip: V2 = row < 0 ? [NX + g.pw * 0.8, NY + g.y0 - 6] : [NX + g.pw * 0.85 - pr * n * 0.5 * Math.min(g.fs, (g.pw * 0.78) / (n * 0.5)) * 0.88, NY + g.y0 + r * g.ls - 2];
    const wx = tip[0] - 46 + Math.sin(c.f * 1.3) * 1.5 * ink, wy = tip[1] - 24 + Math.sin(c.f * 0.9) * 2 * ink;
    const bodyP = pose({ sit: 1, lean: 12, head: 18 + Math.sin(c.f * 0.12) * 1.5, turn: 0.5, footR: [52, 0], footL: [64, 0], R: { hand: [(NX - 60 - X) / S, (NY + 20 - 860) / S] }, L: { hand: [(wx - X) / S, (wy - 860) / S] } });
    const fc = faceAt(c.f, [[0, { ...EXPRESSIONS.calm, look: [0.4, 0.8] }], [four - 10, { ...EXPRESSIONS.thinking, look: [0.2, 0.4] }, 8], [four - 2, { ...EXPRESSIONS.calm, look: [0.4, 0.85] }, 8]]);
    const actor = (only: string[]) => <Actor f={c.f} seed={41} who="salim" x={X} y={860} s={S} facing={1} pose={{ p: bodyP, hands: { R: 'grip', L: 'pen' } }} hold={{ L: <Pen /> }} face={fc} only={only} />;
    return <Stage cam={{ x: 790, y: 585, z: 1.8 }}>
      <Bedroom night lamp={mix(0.08, 1, c.p(on - 2, 8, ease.out))} />
      {actor(['RightArm', 'RightLeg', 'LeftLeg', 'Torso', 'Head'])}
      <g transform={`translate(${NX} ${NY}) rotate(3)`}><Notebook lines={LINES} written={written} w={150} /></g>
      {actor(['LeftArm'])}
    </Stage>;
  },
  // 122 — insert: the first line «ماذا حدث؟» is written with the words.
  122: (c) => {
    const a = c.at('ماذا') - 4, b = c.at('حدث', true) - 4;
    const pen = penTip(c.f, [{ a, b, from: tipOn(0, 0), to: tipOn(0, 1), ink: true }]);
    return <PageStage cam={{ x: 900, y: mix(380, 360, c.p(0, 60)), z: mix(1.4, 1.48, c.p(0, 60)) }} written={upTo(0, ramp(c.f, a, b))}>
      <PenHand tip={pen.tip} lift={pen.lift} />
    </PageStage>;
  },
  // 123 — insert: «ماذا شعرت؟» is written; the four words come on their words; the pen rings «محرج».
  123: (c) => {
    const a = c.at('ماذا') - 2, b = c.at('شعرت', true) - 2;
    const W = [['محرج', c.at('محرج'), 92], ['قلق', c.at('قلق'), 69], ['مستاء', c.at('مستاء'), 115], ['مجروح', c.at('مجروح'), 115]] as const;
    const rights: number[] = [];
    W.forEach((w, i) => rights.push(i ? rights[i - 1] - W[i - 1][2] - 52 : rowR(3)));
    const cy = rowY(3) - NB.ls * 0.24, cx0 = rights[0] - W[0][2] / 2;
    const ring = ellipsePts(cx0, cy, 86, 44);
    const ca = c.at('مستاء') + 2, cb = ca + 36;
    const hover = (i: number): V2 => [rights[i] - W[i][2] * 0.3, cy - 46];
    const segs: Seg[] = [
      { a, b, from: tipOn(2, 0), to: tipOn(2, 1), ink: true },
      ...W.slice(0, 3).map(([, t], i): Seg => ({ a: t - 14, b: t - 2, from: hover(i), to: hover(i) })),
      { a: ca, b: cb, from: ring[0], to: ring[0], path: ring, ink: true },
      { a: cb + 24, b: cb + 40, from: [cx0 - 40, cy + 70], to: [cx0 - 60, cy + 90] },
    ];
    const pen = penTip(c.f, segs);
    const rp = ramp(c.f, ca, cb);
    return <PageStage cam={{ x: 900, y: 400, z: mix(1.36, 1.56, c.p(b, 160)) }} written={upTo(2, ramp(c.f, a, b))}>
      {W.map(([t, at, ], i) => <Hw key={t} right={rights[i]} rule={rowY(3)} text={t} size={46} p={c.p(at - 3, 10, ease.out)} o={i === 0 ? 1 : mix(0.8, 0.5, c.p(cb, 20))} />)}
      {rp > 0 && <path d={line(partial(ring, rp))} stroke={HANDINK} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      <PenHand tip={pen.tip} lift={pen.lift} />
    </PageStage>;
  },
  // 124 — insert: «أين شعرت به في جسدي؟», then a little body on «جسدي» with a mark on the chest.
  124: (c) => {
    const a = c.at('أين') - 4, b = c.at('جسدي') - 8;
    const ba = b + 2, bb = c.at('جسدي', true) - 6, mk = bb - 2;
    const bx = 1040, by = 572, B = 1.5;
    const pt = (x: number, y: number): V2 => [bx + x * B, by + y * B];
    const head = Array.from({ length: 17 }, (_, i): V2 => { const t = Math.PI / 2 + (i / 16) * Math.PI * 2; return pt(Math.cos(t) * 17, Math.sin(t) * 17 - 3); });
    const body: V2[] = [...head, pt(0, 14), pt(0, 74), pt(-20, 124), pt(0, 74), pt(20, 124), pt(0, 74), pt(0, 30), pt(-30, 66), pt(0, 30), pt(30, 66)];
    const bp = ramp(c.f, ba, bb);
    const chest = pt(0, 44);
    const pen = penTip(c.f, [
      { a, b, from: tipOn(5, 0), to: tipOn(5, 1), ink: true },
      { a: ba, b: bb, from: body[0], to: body[0], path: body, ink: true },
      { a: mk, b: mk + 8, from: [chest[0] + 6, chest[1] - 2], to: chest, ink: true },
      { a: mk + 12, b: mk + 26, from: [chest[0] - 120, chest[1] + 120], to: [chest[0] - 150, chest[1] + 150] },
    ]);
    const mark = c.p(mk, 10, ease.back);
    return <PageStage cam={{ x: 900, y: mix(580, 595, c.p(0, 120)), z: 1.42 }} written={upTo(5, ramp(c.f, a, b))}>
      {bp > 0 && <path d={line(partial(body, bp))} stroke={HANDINK} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {mark > 0 && <g transform={`translate(${chest[0]} ${chest[1]}) scale(${mark})`}>
        <circle r={18} fill={PAL.warn} opacity={0.85} />
        <path d="M-12 -5 Q0 -15 12 -3 Q5 10 -10 7" stroke={PAL.provoke} strokeWidth={3.5} fill="none" />
      </g>}
      <PenHand tip={pen.tip} lift={pen.lift} />
    </PageStage>;
  },
  // 125 — insert: «ماذا فعلت؟» on «فعلت», «وماذا أجرب؟» on «أريد… أجرب», then an arrow to «المرة القادمة» on «المرة».
  125: (c) => {
    const half = 11 / LEN[9];
    const a1 = c.at('فعلت') - 30, b1 = c.at('فعلت', true) - 2, a2 = c.at('أريد') - 4, b2 = c.at('أجرب', true) - 2;
    const ar0 = c.at('المرة') - 6, ar1 = ar0 + 24, t0 = ar1 + 4, t1 = c.at('القادمة', true) - 10;
    const p9 = c.f < a2 ? half * ramp(c.f, a1, b1) : mix(half, 1, ramp(c.f, a2, b2));
    const ay = rowY(10) - NB.ls * 0.26, ax0 = rowR(10) - 6, ax1 = rowR(10) - 230;
    const textR = ax1 - 26, textW = 13 * 23 * 0.88;
    const pen = penTip(c.f, [
      { a: a1, b: b1, from: tipOn(9, 0), to: tipOn(9, half), ink: true },
      { a: a2, b: b2, from: tipOn(9, half), to: tipOn(9, 1), ink: true },
      { a: ar0, b: ar1, from: [ax0, ay], to: [ax1, ay], ink: true },
      { a: t0, b: t1, from: [textR, ay + 4], to: [textR - textW, ay + 4], ink: true },
      { a: t1 + 6, b: t1 + 20, from: [textR - textW - 40, ay + 70], to: [textR - textW - 60, ay + 90] },
    ]);
    return <PageStage cam={{ x: 900, y: 750, z: mix(1.36, 1.46, c.p(0, c.dur)) }} written={upTo(9, p9)}>
      <Arrow from={[ax0, ay]} to={[ax1, ay]} bend={0.06} p={ramp(c.f, ar0, ar1)} color={HANDINK} w={6} />
      <Hw right={textR} rule={rowY(10)} text="المرة القادمة" size={46} p={ramp(c.f, t0, t1)} />
      <PenHand tip={pen.tip} lift={pen.lift} />
    </PageStage>;
  },
  // 126 — over the days: each day's gauge rises; the eye of noticing lands lower day after day; «أبكر».
  126: (c) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const lv = [0.84, 0.69, 0.55, 0.42, 0.3], H = 440, Y = 760, v = 0.012;
    const xs = [1560, 1260, 960, 660, 360];
    const late = c.at('أبكر');
    const reach = lv.map((l, i) => 34 + i * 22 + l / v);
    return <Stage over={<Cap text="يلاحظ أبكر" o={c.p(late - 4, 12)} top={940} size={58} />}>
      <Paper seed={126} />
      {days.map((d, i) => {
        const s0 = 34 + i * 22, appear = c.p(i * 6, 14, ease.back);
        const fill = Math.min(lv[i], Math.max(0, c.f - s0) * v);
        return <g key={d} opacity={Math.min(1, appear)}>
          <Gauge x={xs[i]} y={Y} h={H} fill={fill} />
          <EyeMark x={xs[i]} y={Y} h={H} lv={lv[i]} o={c.p(reach[i] - 2, 12, ease.back)} s={58} />
          <WLabel x={xs[i]} y={826} text={d} size={42} />
        </g>;
      })}
      {(() => {
        const pts: V2[] = xs.map((x, i) => [x + 70, Y - 10 - (H - 20) * lv[i] - 64]);
        const p = c.p(late - 6, 24);
        return p > 0 ? <g>
          <path d={line(partial(pts, p))} stroke={PAL.focus} strokeWidth={5} strokeDasharray="14 12" fill="none" strokeLinecap="round" />
          {p > 0.95 && <path d={`M${pts[4][0] + 6} ${pts[4][1] - 26} L${pts[4][0] - 4} ${pts[4][1] + 2} L${pts[4][0] + 26} ${pts[4][1] - 6}`} stroke={PAL.focus} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </g> : null;
      })()}
    </Stage>;
  },
  // 127 — his patterns: the battery empties on «التعب» and the gauge shoots up on «أسرع»; the plate empties on «الجوع»
  // and the message lands on the scale on «رسالة», heavier on «أثقل». Salim thinks, looking from one to the other.
  127: (c) => {
    const know = c.at('يعرف'), tired = c.at('التعب'), fast = c.at('أسرع'), hungry = c.at('الجوع'), msg = c.at('رسالة'), heavy = c.at('أثقل');
    const charge = 1 - c.p(tired, 30, ease.lin);
    const g = c.f < fast ? mix(0.12, 0.22, c.p(20, fast - 20)) : mix(0.22, 0.9, c.p(fast, 22, ease.out));
    const food = 1 - c.p(hungry, 26);
    const drop = c.p(msg - 4, 18, ease.in), hv = c.p(heavy - 4, 16, ease.out);
    const tilt = mix(0.18 * drop, 1, hv) + shake(c.f, heavy + 10, 30, 0.05, 0.6);
    const thinkP = (o: Partial<Pose>) => P({ head: 4, turn: 0.4, R: { hand: [12, -150], bend: -1 }, L: { hand: [30, -240], bend: -1 }, ...o }, 'relaxed', 'fist');
    const pz = poseAt(c.f, [[0, thinkP({})], [tired - 8, thinkP({ head: -10, turn: 0.6 }), 16], [hungry - 8, thinkP({ head: 12, turn: 0.6 }), 16], [heavy + 6, thinkP({ head: 8, turn: 0.55, lean: -3 }), 14]]);
    const fc = faceAt(c.f, [[0, { ...EXPRESSIONS.thinking, look: [0.3, -0.4] }], [know, { ...EXPRESSIONS.thinking, look: [0.3, 0.2] }], [tired - 6, { ...EXPRESSIONS.thinking, look: [0.8, -0.7] }, 10], [fast + 4, face('surprised', { open2: 0.15, look: [0.8, -0.6] }), 8], [fast + 40, { ...EXPRESSIONS.thinking, look: [0.8, -0.6] }, 16], [hungry - 6, { ...EXPRESSIONS.thinking, look: [0.8, 0.5] }, 12], [heavy + 4, face('surprised', { open2: 0.1, look: [0.8, 0.5] }), 8], [heavy + 26, face('determined', { look: [0.6, 0.3] }), 14]]);
    const bob = nod(c.f, know, 1, 7) + nod(c.f, heavy + 26, 1, 6);
    return <Stage>
      <Paper seed={127} />
      <Floor y={1010} />
      <Actor f={c.f} seed={41} who="salim" x={330} y={1010} s={2.05} facing={1} pose={{ p: { ...pz.p, head: pz.p.head + bob }, hands: pz.hands }} face={fc} />
      {/* row 1: tiredness → a faster gauge */}
      <Battery x={820} y={260} charge={charge} />
      <WLabel x={820} y={392} text="تعب" size={48} o={c.p(tired - 4, 12)} color={PAL.warn} />
      <Arrow from={[970, 260]} to={[1150, 260]} p={c.p(fast - 20, 16)} />
      <Gauge x={1270} y={470} h={360} fill={g} />
      {c.f > fast && [0, 1, 2].map((i) => <path key={i} d={`M${1340 + i * 18} ${330 - i * 40} v${-40 - i * 10}`} stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={(1 - c.p(fast + 20, 40)) * 0.7} />)}
      {/* row 2: hunger → a heavier message */}
      <g transform="translate(820 760) scale(2.8)">
        <Plate />
        {food > 0.02 && <ellipse cx={0} cy={-5} rx={24 * food} ry={8 * food} fill={PAL.plant} stroke={INK} strokeWidth={1.2} />}
        {food < 0.6 && [-14, 4, 16].map((x) => <circle key={x} cx={x} cy={-1} r={1.6} fill={PAL.woodDark} />)}
      </g>
      <WLabel x={820} y={860} text="جوع" size={48} o={c.p(hungry - 4, 12)} color={PAL.warn} />
      <Arrow from={[990, 760]} to={[1180, 760]} p={c.p(msg - 24, 16)} />
      <Balance x={1520} y={980} tilt={tilt} left={drop > 0 ? <g transform={`translate(0 ${mix(-360, -44, drop)})`}><Msg x={0} y={0} s={mix(0.85, 1.12, hv)} heavy={hv} /></g> : null} />
      {hv > 0.3 && [0, 1].map((i) => <path key={i} d={`M${1290 + i * 40} ${720 + i * 10} v40`} stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={(1 - c.p(heavy + 20, 40)) * 0.6} />)}
    </Stage>;
  },
  // 128 — the mirror: he wipes the fogged glass from «بل»; the fog lifts and on «بوضوح» his reflection is clear; he relaxes.
  128: (c) => {
    const but = c.at('بل'), clear = c.at('بوضوح');
    const X = 1590, M = { x0: 1690, x1: 1880, y0: 300, y1: 826 }, plane = 1700;
    const wipe = ramp(c.f, but + 8, clear - 30);
    const ang = wipe * Math.PI * 4;
    const wipeHand: V2 = [84 + Math.cos(ang) * 8, -262 + Math.sin(ang) * 22];
    const pz = poseAt(c.f, [
      [0, P({ turn: 0.6, head: 4, body: 0.5 })],
      [but - 6, P({ turn: 0.65, head: -2, body: 0.5, L: { hand: [82, -258] } }, 'relaxed', 'open'), 16],
      [but + 10, P({ turn: 0.65, head: -2, body: 0.5, L: { hand: wipeHand } }, 'relaxed', 'open'), 2],
      [clear - 26, P({ turn: 0.6, head: 0, body: 0.5, L: { hand: wipeHand } }, 'relaxed', 'open'), 2],
      [clear - 22, P({ turn: 0.55, head: -4, body: 0.45, lean: -2, breath: 0.6 }), 18],
    ]);
    const fc = faceAt(c.f, [[0, { ...EXPRESSIONS.thinking, look: [0.6, 0] }], [but, { ...EXPRESSIONS.neutral, look: [0.7, 0] }, 12], [clear - 4, 'relieved', 14], [clear + 40, face('calm', { mouth: 0.6 }), 20]]);
    const fog = 1 - ease.inOut(ramp(c.f, but + 10, clear + 4));
    const gleam = ramp(c.f, clear + 4, clear + 44);
    const cm = cam(1450, 560, 1.72);
    const me = (x: number, facing: 1 | -1) => <Actor f={c.f} seed={41} who="salim" x={x} y={860} s={1.45} facing={facing} pose={pz} face={fc} />;
    return <Stage cam={cm}>
      <Bedroom />
      {/* a standing mirror at the foot of the bed */}
      <path d={`M${M.x0 + 10} ${M.y1 + 10} L${M.x0 - 20} 866 M${M.x1 - 10} ${M.y1 + 10} L${M.x1 + 20} 866`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M${M.x0 + 10} ${M.y1 + 10} L${M.x0 - 20} 866 M${M.x1 - 10} ${M.y1 + 10} L${M.x1 + 20} 866`} stroke={PAL.woodDark} strokeWidth={8} strokeLinecap="round" />
      <rect x={M.x0 - 16} y={M.y0 - 16} width={M.x1 - M.x0 + 32} height={M.y1 - M.y0 + 32} rx={26} fill={PAL.wood} stroke={INK} strokeWidth={5} />
      <clipPath id="b7-mirror"><rect x={M.x0} y={M.y0} width={M.x1 - M.x0} height={M.y1 - M.y0} rx={14} /></clipPath>
      <filter id="b7-fogblur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={12 * fog} /></filter>
      <g clipPath="url(#b7-mirror)">
        <rect x={M.x0} y={M.y0} width={M.x1 - M.x0} height={M.y1 - M.y0} fill="#C9D4E4" />
        <rect x={M.x0} y={M.y0 + 330} width={M.x1 - M.x0} height={300} fill={PAL.floor} opacity={0.6} />
        <g filter={fog > 0.02 ? 'url(#b7-fogblur)' : undefined} opacity={mix(1, 0.5, fog)}>{me(2 * plane - X, -1)}</g>
        <rect x={M.x0} y={M.y0} width={M.x1 - M.x0} height={M.y1 - M.y0} fill="#EEF1F5" opacity={0.86 * fog} />
        {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={M.x0 + 20 + hash(i + 3) * 120} cy={M.y0 + 40 + hash(i * 7) * 440} r={30 + hash(i * 5) * 30} fill="#FFFFFF" opacity={0.5 * fog} />)}
        {gleam > 0 && gleam < 1 && <path d={`M${M.x0 - 120 + gleam * 380} ${M.y0} l60 0 l-160 ${M.y1 - M.y0} l-60 0 Z`} fill="#FFFFFF" opacity={0.5 * Math.sin(gleam * Math.PI)} />}
      </g>
      {me(X, 1)}
    </Stage>;
  },
  // 129 — dinner: they eat; Reem criticises his decision on «انتقدت», pointing then an open hand; Salim stops eating; the mother looks between them.
  129: (c) => {
    const din = c.at('العشاء'), crit = c.at('انتقدت'), chg = c.at('بتغيير');
    const sp = <Spoon />;
    const salim = poseAt(c.f, [
      [0, P(TB({ L: { hand: [46, -172] } }), 'relaxed', 'grip')],
      [10, P(TB({ head: 6, L: { hand: [30, -244] } }), 'relaxed', 'grip'), 18],
      [42, P(TB({ L: { hand: [46, -172] } }), 'relaxed', 'grip'), 18],
      [crit + 2, P(TB({ lean: -3, head: -2, turn: 0.45, L: { hand: [56, -196] } }), 'relaxed', 'grip'), 12],
      [chg, P(TB({ lean: -2, turn: 0.45, L: { hand: [58, -174] } }), 'relaxed', 'grip'), 22],
    ]);
    const reem = poseAt(c.f, [
      [0, P(TBW({ head: 12, turn: 0.4 }))],
      [din - 6, P(TBW({ head: 0, turn: 0.55 })), 16],
      [crit - 10, P(TBW({ lean: 6, head: -2, turn: 0.65, L: { hand: [96, -228] } }), 'relaxed', 'point'), 12],
      [crit + 46, P(TBW({ lean: 4, turn: 0.6, L: { hand: [82, -206] } }), 'relaxed', 'open'), 16],
      [chg - 8, P(TBW({ lean: 8, head: 3, turn: 0.6, L: { hand: [96, -226] } }), 'relaxed', 'chop'), 10],
      [chg + 30, P(TBW({ lean: 4, turn: 0.6, L: { hand: [80, -204] } }), 'relaxed', 'open'), 18],
    ]);
    const mother = poseAt(c.f, [
      [0, P(TBW({ head: 8, turn: 0.4 }))],
      [crit + 6, P(TBW({ head: -2, turn: 0.5, lean: -2 })), 14],
    ]);
    const cm = { x: 1000, y: 480, z: 1.55 };
    const bubble = c.p(crit + 4, 10);
    return <Stage cam={cm} over={<Say text="تغيّر عملك؟!" to={toScreen(cm, [HEAD.reem[0] - 6, HEAD.reem[1] - 6])} above={14} o={bubble} size={48} />}>
      <Dinner f={c.f}
        salim={{ pose: salim, hold: { L: sp }, face: faceAt(c.f, [[0, face('smile', { mouth: 0.5, look: [0.3, 0.4] })], [crit + 2, face('surprised', { open2: 0.1, look: [0.6, -0.1] }), 8], [crit + 40, face('listening', { brow: 0.3, mouth: 0, look: [0.6, -0.1] }), 16]]) }}
        reem={{ pose: reem, say: [crit, c.sp[1]], face: faceAt(c.f, [[0, { ...EXPRESSIONS.calm, look: [0.2, 0.6] }], [din - 4, 'neutral', 10], [crit - 8, face('irritated', { brow: 0.4, mouth: -0.1 }), 10], [chg, face('anxious', { brow: -0.2 }), 20]]) }}
        mother={{ pose: mother, face: faceAt(c.f, [[0, { ...EXPRESSIONS.calm, look: [0.2, 0.6] }], [crit + 6, { ...EXPRESSIONS.anxious, look: [0.1, 0] }, 12], [chg + 10, { ...EXPRESSIONS.anxious, look: [0.9, 0] }, 14]]) }} />
    </Stage>;
  },
  // 130 — close on Salim: the gauge climbs on «يرتفع»; on «ولاحظه» he looks down at his fist and opens it; the eye pins the level.
  130: (c) => {
    const up = c.at('يرتفع'), see = c.at('ولاحظه');
    const fill = mix(0.15, 0.72, c.p(c.at('بالانزعاج'), see - c.at('بالانزعاج') + 2, ease.in)) - 0.06 * c.p(see + 30, 30);
    const tense = c.f < see + 8 ? shake(c.f, up, 60, 0.6, 1.7) : 0;
    const salim = poseAt(c.f, [
      [0, P(TB({ head: 0, turn: 0.45, L: { hand: [54, -172] } }), 'relaxed', 'fist')],
      [up - 6, P(TB({ head: -2, turn: 0.45, lean: 2, breath: 0.8, L: { hand: [54 + tense, -170] } }), 'relaxed', 'fist'), 14],
      [see - 2, P(TB({ head: 16, turn: 0.4, lean: 4, breath: 0.8, L: { hand: [54, -172] } }), 'relaxed', 'fist'), 12],
      [see + 14, P(TB({ head: 14, turn: 0.4, lean: 2, breath: 0, L: { hand: [58, -174] } }), 'relaxed', 'open'), 18],
    ]);
    const cm = { x: 880, y: 500, z: 2.3 };
    return <Stage cam={cm}>
      <Dinner f={c.f}
        salim={{ pose: salim, face: faceAt(c.f, [[0, face('irritated', { brow: 0.35, look: [0.6, -0.1] })], [up, face('irritated', { brow: 0.7, tight: 0.8, look: [0.6, -0.1] }), 12], [see - 2, face('surprised', { open2: 0, browY: 0.4, look: [0.3, 0.9] }), 10], [see + 22, face('calm', { look: [0.3, 0.8] }), 18]]) }}
        reem={{ pose: poseAt(c.f, [[0, P(TBW({ lean: 4, turn: 0.6, L: { hand: [82, -206] } }), 'relaxed', 'open')], [40, P(TBW({ lean: 6, turn: 0.6, L: { hand: [90, -216] } }), 'relaxed', 'chop'), 14], [90, P(TBW({ lean: 4, turn: 0.6, L: { hand: [80, -204] } }), 'relaxed', 'open'), 18]]), say: [0, see + 30], face: face('anxious', { brow: 0 }) }}
        mother={{ pose: P(TBW({ head: -2, turn: 0.5 })), face: 'anxious' }}
        over={<g>
          <Gauge x={640} y={600} h={250} w={60} fill={fill} />
          <EyeMark x={640} y={600} h={250} lv={0.72} o={c.p(see, 12, ease.back)} s={48} />
        </g>} />
    </Stage>;
  },
  // 131 — two-shot: instead of defending he leans in, an open hand on the table, and asks «ما الذي يقلقك بالضبط؟»; Reem's arms unfold.
  131: (c) => {
    const ask = c.at('ما'), worry = c.at('يقلقك'), def = c.at('يدافع');
    const salim = poseAt(c.f, [
      [0, P(TB({ lean: -4, head: -2, turn: 0.45 }))],
      [def, P(TB({ lean: -6, head: -4, turn: 0.45, breath: 0.8 })), 16],
      [ask - 14, P(TB({ lean: 7, head: 4, turn: 0.5, L: { hand: [70, -176] } }), 'relaxed', 'cup'), 18],
    ]);
    const crossed = P(TBW({ lean: -4, head: -4, turn: 0.6, R: { hand: [20, -190], bend: -1 }, L: { hand: [-4, -194], bend: -1 } }), 'fist', 'fist');
    const reem = poseAt(c.f, [[0, crossed], [worry + 8, P(TBW({ lean: 2, head: 4, turn: 0.55 })), 20]]);
    const cm = { x: 950, y: 480, z: 1.9 };
    return <Stage cam={cm} over={<Say text="ما الذي يقلقك بالضبط؟" to={toScreen(cm, [HEAD.salim[0] + 4, HEAD.salim[1] - 4])} above={12} o={c.p(ask - 2, 10)} size={46} />}>
      <Dinner f={c.f}
        salim={{ pose: salim, say: [ask, c.sp[1] - 6], face: faceAt(c.f, [[0, face('irritated', { brow: 0.4, look: [0.6, 0] })], [def, face('irritated', { brow: 0.3, tight: 0.7, look: [0.4, 0.4] }), 12], [ask - 12, face('calm', { brow: -0.15, look: [0.7, -0.1] }), 14]]) }}
        reem={{ pose: reem, face: faceAt(c.f, [[0, face('irritated', { brow: 0.45, look: [0.5, 0] })], [worry, face('surprised', { open2: 0.05, browY: 0.5, look: [0.6, 0] }), 10], [worry + 30, face('anxious', { look: [0.4, 0.3] }), 16]]) }}
        mother={{ pose: P(TBW({ head: 0, turn: 0.5 })), face: faceAt(c.f, [[0, { ...EXPRESSIONS.anxious, look: [0.6, 0] }], [worry + 14, { ...EXPRESSIONS.listening, look: [0.8, 0] }, 14]]) }} />
    </Stage>;
  },
  // 132 — on Reem, over Salim's shoulder: she looks down at her hands, then up at him: «أخاف أن تتعب وتندم».
  132: (c) => {
    const fear = c.at('أخاف'), regret = c.at('وتندم');
    const fid = Math.sin(c.f * 0.12) * 3;
    const reem = poseAt(c.f, [
      [0, P(TBW({ head: 14, turn: 0.45, R: { hand: [40 + fid, -184] }, L: { hand: [48 - fid, -186] } }), 'relaxed', 'grip')],
      [fear - 10, P(TBW({ head: 0, turn: 0.55, lean: 3, R: { hand: [40, -184] }, L: { hand: [50, -186] } }), 'relaxed', 'grip'), 16],
      [regret, P(TBW({ head: 6, turn: 0.55, lean: 4, R: { hand: [40, -184] }, L: { hand: [50, -186] } }), 'relaxed', 'grip'), 16],
    ]);
    const cm = { x: 1120, y: 480, z: 2.2 };
    return <Stage cam={cm} over={<Say text="أخاف أن تتعب وتندم" to={toScreen(cm, [HEAD.reem[0] - 4, HEAD.reem[1] - 6])} above={12} o={c.p(fear - 2, 10)} size={46} />}>
      <Dinner f={c.f}
        salim={{ pose: P(TB({ lean: 6, head: 2, turn: 0.5, L: { hand: [70, -176] } }), 'relaxed', 'cup'), face: { ...EXPRESSIONS.listening, look: [0.7, 0] } }}
        reem={{ pose: reem, say: [fear, c.sp[1]], face: faceAt(c.f, [[0, face('sad', { look: [0.2, 0.8] })], [fear - 8, face('anxious', { brow: -0.9, mouth: -0.15, look: [0.6, -0.1] }), 12], [regret, face('hurt', { look: [0.6, -0.1] }), 14]]) }}
        mother={{ pose: P(TBW({ head: 6 + nod(c.f, regret, 1, 6), turn: 0.6, lean: 3 })), face: faceAt(c.f, [[0, { ...EXPRESSIONS.anxious, look: [0.8, 0.1] }], [regret + 6, face('sad', { mouth: -0.1, look: [0.8, 0.2] }), 16]]) }} />
    </Stage>;
  },
  // 133 — what was behind it: a thorny criticism shell bristles on «النقد», splits open on «خوفًا» to show a heart; «خوف عليه».
  133: (c) => {
    const crit = c.at('النقد'), fear = c.at('خوفا'), on = c.at('عليه');
    const open = c.p(fear - 4, 22, ease.out), bristle = c.p(crit - 6, 14) * (1 - open);
    const cx = 1220, cy = 420, beat = 1 + 0.06 * Math.max(0, Math.sin((c.f - fear) * 0.18)) * (c.f > fear ? 1 : 0);
    const spikes = (half: 1 | -1) => Array.from({ length: 13 }, (_, i): V2 => {
      const a = half === -1 ? Math.PI + (i / 12) * Math.PI : (i / 12) * Math.PI;
      const r = i % 2 ? 230 : 230 + 52 + bristle * 26;
      return [Math.cos(a) * r, Math.sin(a) * r * 0.78];
    });
    const shell = (half: 1 | -1) => (
      <g transform={`translate(${cx} ${cy + half * open * 120}) rotate(${half * open * 24})`} opacity={1 - c.p(fear + 40, 30)}>
        <path d={sketch([...spikes(half), [-230, 0]], half === 1 ? 7 : 8, 2, true)} fill="#D6B7BF" stroke={PAL.provoke} strokeWidth={7} strokeLinejoin="round" />
        <path d={`M-200 0 ${Array.from({ length: 9 }, (_, i) => `L${-200 + i * 50} ${(i % 2 ? 1 : -1) * 14}`).join(' ')}`} stroke={PAL.provoke} strokeWidth={5} fill="none" opacity={open > 0.02 ? 1 : 0} />
      </g>
    );
    return <Stage>
      <Paper seed={133} />
      <Floor y={1010} />
      <Actor f={c.f} seed={23} who="reem" x={540} y={1010} s={2.05} facing={1}
        pose={poseAt(c.f, [[0, P({ head: 6, turn: 0.45, R: { hand: [26, -170] }, L: { hand: [34, -174] } }, 'grip', 'grip')], [fear, P({ head: 0, turn: 0.5, R: { hand: [24, -176] }, L: { hand: [30, -186], bend: -1 } }, 'grip', 'open'), 18]])}
        face={faceAt(c.f, [[0, face('anxious', { look: [0.6, -0.3] })], [fear + 10, face('sad', { mouth: 0.1, brow: -0.6, look: [0.6, -0.3] }), 20]])} />
      {/* the tail from the shell to Reem */}
      <path d={`M${cx - 200} ${cy + 120} Q${cx - 380} ${cy + 220} ${720} ${430}`} stroke={PAL.provoke} strokeWidth={6} fill="none" strokeLinecap="round" opacity={1 - open} />
      <g transform={`translate(${cx} ${cy}) scale(${mix(0.4, 1.0, open) * beat})`} opacity={c.p(fear - 6, 10)}>
        <Glow x={0} y={0} r={200} color={PAL.provokeLight} o={0.8} />
        <IconHeart s={300} />
      </g>
      {shell(-1)}
      {shell(1)}
      <WLabel x={cx} y={760} text="خوف عليه" size={60} o={c.p(on - 4, 12)} color={PAL.provoke} />
    </Stage>;
  },
  // 134 — dinner, wide: hand on his chest on «أفهم», opened toward her on «وأريد»; Reem nods on «أجرب»; the mother smiles and sets her glass down.
  134: (c) => {
    const und = c.at('أفهم'), thought = c.at('فكرت'), want = c.at('وأريد'), tr = c.at('أجرب');
    const salim = poseAt(c.f, [
      [0, P(TB({ turn: 0.5 }))],
      [und - 14, P(TB({ head: 2, turn: 0.5, L: { hand: [22, -194], bend: -1 } }), 'relaxed', 'open'), 18],
      [want - 12, P(TB({ lean: 6, head: 0, turn: 0.55, L: { hand: [82, -204] } }), 'relaxed', 'cup'), 18],
    ]);
    const reem = poseAt(c.f, [[0, P(TBW({ turn: 0.55, head: 2 }))], [thought, P(TBW({ turn: 0.55, head: 6, lean: 2 })), 20]]);
    const glassDown = c.p(tr + 6, 16);
    const mother = poseAt(c.f, [[0, P(TBW({ head: 2, turn: 0.5, L: { hand: [54, -206] } }), 'relaxed', 'grip')], [tr + 6, P(TBW({ head: 0, turn: 0.5, L: { hand: [56, -184] } }), 'relaxed', 'grip'), 16]]);
    const cm = { x: 1000, y: 480, z: 1.55 };
    const b1 = c.p(und - 2, 10) * (1 - c.p(want - 18, 10)), b2 = c.p(want - 2, 10);
    return <Stage cam={cm} over={<>
      <Say text="أفهم خوفك" to={toScreen(cm, [HEAD.salim[0], HEAD.salim[1] - 4])} above={12} o={b1} size={48} />
      <Say text="وأريد أن أجرب" to={toScreen(cm, [HEAD.salim[0], HEAD.salim[1] - 4])} above={12} o={b2} size={48} />
    </>}>
      <Dinner f={c.f}
        salim={{ pose: salim, say: [und, c.sp[1]], face: faceAt(c.f, [[0, face('calm', { look: [0.6, 0] })], [thought, face('determined', { mouth: 0.25, look: [0.6, 0] }), 14], [want, face('calm', { mouth: 0.5, look: [0.7, 0] }), 14]]) }}
        reem={{ pose: { p: { ...reem.p, head: reem.p.head + nod(c.f, tr, 2, 8) }, hands: reem.hands }, face: faceAt(c.f, [[0, face('anxious', { look: [0.6, 0] })], [thought, face('listening', { look: [0.6, 0] }), 16], [tr, face('smile', { mouth: 0.5, brow: -0.3, look: [0.6, 0] }), 14]]) }}
        mother={{ pose: mother, hold: { L: <HeldGlass /> }, upright: { L: true }, face: faceAt(c.f, [[0, { ...EXPRESSIONS.anxious, look: [0.8, 0] }], [tr, face('smile', { look: [0.8, 0] }), 14]]) }} />
      {glassDown > 0 && glassDown < 1 && <path d="M1190 640 h-20 M1196 628 l-14 -8" stroke={INK} strokeWidth={3} opacity={0} />}
    </Stage>;
  },
  // 135 — at work: he stamps «نعم» on the first card on «نعم», then «نعم، ولكن» on the second on «ولكن».
  135: (c) => {
    const know = c.at('يعرف'), yes = c.at('نعم'), when = c.at('ومتى'), but = c.at('ولكن');
    const X = 960, Y = 940, S = 1.6;
    const cards = [{ x: 1160, y: 630 }, { x: 760, y: 630 }];
    const loc = (wx: number, wy: number): V2 => [(wx - X) / S, (wy - Y) / S];
    const grip = (i: number, up: number): V2 => loc(cards[i].x + (i ? 30 : -30) * 0, cards[i].y + 30 - 50 - up);
    const restL = loc(1060, 690), restR = loc(860, 690);
    const hitL = (f: number) => f < yes - 22 ? 0 : f < yes - 4 ? ease.out((f - yes + 22) / 18) * 80 : f < yes ? mix(80, 0, ease.in((f - yes + 4) / 4)) : 0;
    const hitR = (f: number) => f < but - 22 ? 0 : f < but - 4 ? ease.out((f - but + 22) / 18) * 80 : f < but ? mix(80, 0, ease.in((f - but + 4) / 4)) : 0;
    const L: V2 = c.f < yes - 40 ? restL : c.f < yes + 26 ? grip(0, hitL(c.f)) : restL;
    const R: V2 = c.f < when ? restR : c.f < but + 26 ? grip(1, hitR(c.f)) : restR;
    const toL = (c.f < yes - 40 ? 0 : c.f < yes + 26 ? 1 : 0), toR = (c.f >= when && c.f < but + 26 ? 1 : 0);
    const blend = (a: V2, b: V2, t: number): V2 => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
    const Lh = blend(restL, L, toL ? ramp(c.f, yes - 40, yes - 26) : 1 - ramp(c.f, yes + 26, yes + 42));
    const Rh = blend(restR, R, toR ? ramp(c.f, when, when + 14) : 1 - ramp(c.f, but + 26, but + 42));
    const turn = k(c.f, [[0, 0], [know - 10, 0.28], [when - 8, 0.28], [when + 6, -0.28], [but + 50, -0.28], [but + 70, 0]]);
    const p = pose({ sit: 1, turn, body: 0, head: k(c.f, [[0, 0], [know - 10, 8], [but + 50, 8], [but + 70, 0]]) + nod(c.f, but + 60, 1, 6), footR: [40, 0], footL: [50, 0], R: { hand: [Lh[0] * 0 + Rh[0], Rh[1]], bend: 1 }, L: { hand: Lh, bend: -1 } });
    const fc = faceAt(c.f, [[0, 'calm'], [know, { ...EXPRESSIONS.thinking, look: [0.5, 0.5] }, 12], [yes, face('calm', { look: [0.5, 0.6] }), 10], [when, { ...EXPRESSIONS.thinking, look: [-0.5, 0.5] }, 12], [but, face('calm', { mouth: 0.5, look: [-0.5, 0.6] }), 10], [but + 60, face('calm', { mouth: 0.55, look: [0, 0] }), 16]]);
    const actor = (only: string[]) => <Actor f={c.f} seed={41} who="salim" x={X} y={Y} s={S} facing={1} pose={{ p, hands: { R: 'grip', L: 'grip' } }} face={fc} hold={{ R: <Stamp color={PAL.focus} />, L: <Stamp color={PAL.calm} /> }} upright={{ R: true, L: true }} only={only} />;
    return <Stage cam={{ x: 960, y: 505, z: 1.6 }}>
      <OfficeFront />
      {actor(['Torso', 'Head', 'RightLeg', 'LeftLeg'])}
      <DeskSlab />
      <g transform="translate(1440 694) scale(2)"><Mug steam={0.6} t={c.t} /></g>
      <TaskCard x={cards[0].x} y={cards[0].y} imprint="نعم" color={PAL.calm} pop={c.p(yes, 10)} seed={3} />
      <TaskCard x={cards[1].x} y={cards[1].y} imprint="نعم، ولكن" color={PAL.focus} pop={c.p(but, 10)} seed={5} />
      {actor(['RightArm', 'LeftArm'])}
    </Stage>;
  },
  // 136 — online: the phone comes up and fills the frame; on «الإنترنت» it opens onto his post; the camera pushes in.
  136: (c) => {
    const net = c.at('الإنترنت'), test = c.at('الامتحان');
    const rise = 1 - c.p(0, 26, ease.out);
    const tap = net - 6;
    const open = c.p(net, 18, ease.out);
    const tipR: V2 = c.f < tap - 14 ? THUMB_REST[1] : c.f < tap + 10 ? (() => { const u = ramp(c.f, tap - 14, tap); return [mix(THUMB_REST[1][0], 1060, u), mix(THUMB_REST[1][1], 800, u) + (c.f > tap ? 6 : 0)] as V2; })() : (() => { const u = ramp(c.f, tap + 10, tap + 28); return [mix(1060, THUMB_REST[1][0], u), mix(800, THUMB_REST[1][1], u)] as V2; })();
    const z = mix(1, 1.78, c.p(net + 10, test + 60 - net, ease.inOut));
    const cm = { x: 960, y: mix(560 + 260 * rise, 360, c.p(net + 10, test + 60 - net)), z };
    const screen = <g>
      <LockScreen time="22:40" />
      <g transform={`translate(0 ${(1 - open) * 720})`}><PostScreen {...POST} comments={[FRIEND]} /></g>
    </g>;
    return <Stage cam={cm} bg="#2B3248">
      <NightBack />
      <g transform={`translate(0 ${rise * 260})`}>
        <PhoneHands layer="back" tipL={THUMB_REST[0]} tipR={tipR} />
        <g transform={`translate(${PH.x} ${PH.y})`}><Phone w={PH.w} glow={0.6} screen={screen} /></g>
        <PhoneHands layer="front" tipL={THUMB_REST[0]} tipR={tipR} />
      </g>
    </Stage>;
  },
  // 137 — his post; on «تعليق» an aggressive comment arrives from an account with no picture; the camera goes to it on «مجهول».
  137: (c) => {
    const post = c.at('منشورا'), come = c.at('تعليق'), aggr = c.at('عدواني'), anon = c.at('حساب');
    const inn = c.p(come - 4, 16);
    const av = scr(ANON_AV[0], ANON_AV[1]);
    const pan = c.p(c.at('فجاءه'), 40), push = c.p(anon - 6, 40);
    const cm = { x: mix(mix(990, 930, c.p(post, 80)), 960, pan) + (av[0] - 960) * 0.6 * push, y: mix(360, 470, pan) + (av[1] - 470) * 0.5 * push, z: mix(1.78, 2.6, push) };
    const hot = c.p(aggr, 14);
    const box = { x0: scr(ANON_CARD.u0, 0)[0], x1: scr(ANON_CARD.u1, 0)[0], y0: scr(0, ANON_CARD.v0)[1], y1: scr(0, ANON_CARD.v1)[1] };
    const sh = shake(c.f, aggr, 30, 5, 1.2);
    const screen = <g>
      <PostScreen {...POST} comments={[FRIEND]} />
      <g opacity={inn}><PostScreen {...POST} comments={[FRIEND, ANON]} /></g>
      {inn > 0 && <g opacity={inn}><Faceless x={ANON_AV[0]} y={ANON_AV[1]} r={18.5} /></g>}
    </g>;
    return <Stage cam={cm} bg="#2B3248">
      <NightBack />
      <g transform={`translate(${PH.x} ${PH.y})`}><Phone w={PH.w} glow={0.6} screen={screen} /></g>
      {hot > 0 && <g transform={`translate(${sh} 0)`} opacity={hot}>
        <rect x={box.x0 - 6} y={box.y0 - 6} width={box.x1 - box.x0 + 12} height={box.y1 - box.y0 + 12} rx={20} fill="none" stroke={PAL.warn} strokeWidth={6} />
        {[0, 1, 2].map((i) => <path key={i} d={`M${box.x0 - 18 - i * 4} ${box.y0 + 10 + i * 30} l-26 ${-8 + i * 8}`} stroke={PAL.warn} strokeWidth={6} strokeLinecap="round" />)}
      </g>}
    </Stage>;
  },
  // 138 — his thumbs type a sharp reply from «تكتب»… and stop on «توقفت», lifted over the keys.
  138: (c) => {
    const type0 = c.at('تكتب') - 10, type1 = c.at('لاذعا', true), stop = c.at('توقفت');
    const kb = 1 - c.p(0, 16, ease.out);
    const DRAFT = 'ومن أنت أصلًا لتحكم عليّ؟ أمثالك لا يفهمون إلا';
    const chars = Array.from(DRAFT);
    const n = Math.round(chars.length * ramp(c.f, type0, type1));
    const typing = c.f >= type0 && c.f < Math.min(type1, stop);
    const tap = Math.floor((c.f - type0) / 6), ph = ((c.f - type0) % 6) / 6;
    const keyOf = (t: number): [number, number] => { const left = t % 2 === 0; return [Math.floor(hash(t * 3 + 1) * 3), (left ? 0 : 5) + Math.floor(hash(t * 7 + 2) * 5)]; };
    const tipFor = (t: number): V2 => { const [r, cc] = keyOf(t); const [u, v] = keyAt(r === 2 ? 2 : r, r === 2 ? Math.min(8, Math.max(1, cc)) : cc); return scr(u, v + kb * 260); };
    const lift = c.p(stop - 4, 14, ease.out);
    const thumb = (side: 0 | 1): V2 => {
      if (!typing && c.f < type0) return THUMB_REST[side];
      const last = typing ? (tap % 2 === side ? tap : tap - 1) : (() => { const T = Math.floor((Math.min(type1, stop) - type0) / 6); return T % 2 === side ? T : T - 1; })();
      const prev = last - 2;
      const at = tipFor(Math.max(side, last)), from = prev >= side ? tipFor(prev) : THUMB_REST[side];
      const u = typing && last === tap ? ease.out(Math.min(1, ph * 1.6)) : 1;
      const press = typing && last === tap && ph > 0.55 ? 8 : 0;
      const p: V2 = [mix(from[0], at[0], u), mix(from[1], at[1], u) + press];
      return [p[0] + (side ? 80 : -80) * lift, p[1] + 90 * lift];
    };
    const hotKey = typing && ph > 0.55 ? keyOf(tap) : null;
    const caret = Math.floor(c.f / 24) % 2 === 0 || typing;
    const tL = thumb(0), tR = thumb(1);
    const screen = <g>
      <g transform={`translate(0 ${-150 * (1 - kb)})`}><PostScreen {...POST} comments={[FRIEND, ANON]} /><Faceless x={ANON_AV[0]} y={ANON_AV[1]} r={18.5} /></g>
      <ReplyBar y={kb * 360} text={chars.slice(0, n).join('')} caret={caret} />
      <Keyboard y={kb * 260} hot={hotKey ? [hotKey[0], hotKey[0] === 2 ? Math.min(8, Math.max(1, hotKey[1])) : hotKey[1]] : null} />
    </g>;
    const cm = { x: 960, y: mix(690, 670, c.p(stop, 40)), z: mix(1.7, 1.78, c.p(stop, 40)) };
    return <Stage cam={cm} bg="#2B3248">
      <NightBack />
      <PhoneHands layer="back" tipL={tL} tipR={tR} />
      <g transform={`translate(${PH.x} ${PH.y})`}><Phone w={PH.w} glow={0.6} screen={screen} /></g>
      <PhoneHands layer="front" tipL={tL} tipR={tR} />
    </Stage>;
  },
  // 139 — on the sofa at night, his face in the phone's light: «هل يريد هذا الشخص…»: the faceless account,
  // then «حوارًا» (two calm bubbles, right) or «معركة» (crossed swords, left).
  139: (c) => {
    const ask = c.at('سأل'), who = c.at('الشخص'), talk = c.at('حوارا'), war = c.at('معركة');
    const X = HOME.sofaSeat.x, S = 1.45;
    const pz = poseAt(c.f, [
      [0, P({ sit: 1, head: 16, turn: 0.4, footR: [52, 0], footL: [64, 0], R: { hand: [46, -188] }, L: { hand: [40, -182] } }, 'grip', 'relaxed')],
      [ask + 10, P({ sit: 1, head: -4, turn: 0.35, lean: -3, footR: [52, 0], footL: [64, 0], R: { hand: [44, -176] }, L: { hand: [30, -230], bend: -1 } }, 'grip', 'fist'), 18],
    ]);
    const look = faceAt(c.f, [[0, { ...EXPRESSIONS.neutral, look: [0.3, 0.8] }], [ask + 10, { ...EXPRESSIONS.thinking, look: [0.2, -0.8] }, 12], [talk - 4, { ...EXPRESSIONS.thinking, look: [0.8, -0.7] }, 10], [war - 6, face('thinking', { brow: 0.4, look: [-0.6, -0.7] }), 8]]);
    const cm = { x: 900, y: 420, z: 1.55 };
    const cl = c.p(who - 16, 14, ease.back);
    const cx = 900, cy = 220;
    return <Stage cam={cm}>
      <HomeLiving night />
      <Actor f={c.f} seed={41} who="salim" x={X} y={860} s={S} facing={1} pose={pz} face={look} hold={{ R: <Phone w={28} glow={0.9} screen={<rect width={360} height={720} fill={PAL.screenGlow} />} /> }} upright={{ R: true }} />
      <Glow x={X + 60} y={600} r={190} ry={170} color={PAL.screenGlow} o={0.55} />
      <Glow x={X + 20} y={470} r={110} color="#DCE9F5" o={0.4} />
      {cl > 0 && <g transform={`translate(${cx} ${cy}) scale(${Math.min(1, cl)})`}>
        <ThoughtCloud w={760} h={330} tail={[-30, 230]} />
        <g opacity={c.p(who - 8, 10)}><Faceless x={0} y={-14} r={44} /></g>
        <g transform={`translate(-30 50)`}><WLabel x={0} y={0} text="؟" size={44} o={c.p(who + 6, 10)} /></g>
        <g transform={`translate(225 -40) scale(${c.p(talk - 4, 12, ease.back)})`}><DialogueIcon /></g>
        <WLabel x={225} y={92} text="حوار" size={44} o={c.p(talk, 10)} color={PAL.calm} />
        <g transform={`translate(-225 -20) scale(${0.62 * c.p(war - 4, 10, ease.back)})`}><BattleIcon t={c.t} /></g>
        <WLabel x={-225} y={92} text="معركة" size={44} o={c.p(war - 2, 8)} color={PAL.provoke} />
      </g>}
    </Stage>;
  },
  // 140 — not every comment deserves a reply: comments flow up; only two take a reply arrow (the first on «يستحق»).
  140: (c) => {
    const kinds = ['plain', 'hostile', 'hostile', 'plain', 'hostile', 'reply', 'hostile', 'reply', 'hostile', 'plain', 'hostile', 'hostile', 'plain', 'hostile'] as const;
    const v = 5, line0 = 480, y0 = kinds.map((_, i) => 245 + i * 140);
    return <Stage over={<Cap text="ليس كل تعليق يستحق ردًا" o={c.p(c.at('فليس') - 4, 12)} top={40} size={58} />}>
      <Paper seed={140} />
      {kinds.map((kd, i) => {
        const y = y0[i] - v * c.f, o = clamp01((y - 190) / 80) * clamp01((1150 - y) / 70);
        if (o <= 0) return null;
        const trig = (y0[i] - line0) / v, ar = c.p(trig, 16), rp = c.p(trig + 10, 12, ease.back);
        return <g key={i}>
          <FeedCard y={y} kind={kd} seed={i * 5 + 1} o={o * (kd === 'reply' || c.f < trig ? 1 : 1 - 0.45 * c.p(trig, 20))} />
          {kd === 'reply' && ar > 0 && <g opacity={o}>
            <Arrow from={[606, y - 8]} to={[530, y + 10]} bend={-0.3} p={ar} color={PAL.calm} w={8} />
            {rp > 0 && <g transform={`translate(330 ${y + 10}) scale(${rp})`}>
              <path d={sketch([[-180, -48], [180, -48], [180, 48], [-180, 48]], i, 1.2, true)} fill={PAL.calmLight} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
              <circle cx={136} cy={0} r={28} fill={PAL.calm} stroke={INK} strokeWidth={3.5} />
              <path d="M88 0 H-140" stroke={PAL.calm} strokeWidth={13} strokeLinecap="round" />
            </g>}
          </g>}
        </g>;
      })}
    </Stage>;
  },
};
