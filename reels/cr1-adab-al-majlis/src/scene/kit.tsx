import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CamKey, GsapCamera, keys, tween } from '@motion/index';
import { Boil } from '@mukarram/video/stage';

export const W = 1080, H = 1920;

/** The brief's palette (ADAB_AL_MAJLIS_MASTER.md): cool white ground, ink, the brand blue, green for the right way, red
 *  for the wrong one. No yellow, orange or gold anywhere. Robes are quiet blue-greys so the actions read first. */
export const C = {
  bg: '#F6F8FA', ink: '#182A3A', brand: '#2E7BC5', ok: '#10B981', no: '#E63946', slate: '#4A5B6C',
  wall: '#EEF2F6', arch: '#E1E8EF', cushion: '#DCE6EF', cushionDeep: '#C3D1DE', seat: '#C9D6E3',
  rug: '#24476B', rugLine: '#2E7BC5', rugDot: '#F6F8FA', floor: '#E3E9EF',
  head: '#E8DCD2', card: '#FFFFFF',
  robe: { g: '#2E7BC5', a: '#DCE3EA', b: '#BFD3E6', c: '#D9D4E8', d: '#C7D2DC', e: '#E6E9EC', f: '#B8C7D6' },
  cap: { g: '#182A3A', a: '#4A5B6C', b: '#182A3A', c: '#4A5B6C', d: '#2B3E50', e: '#4A5B6C', f: '#182A3A' },
};
export const FONT = 'Cairo, sans-serif', BODY = 'Tajawal, sans-serif', NASKH = 'Amiri, serif';
export const FLOOR = 1360;          // the seat line the figures sit on (y of the hips' base)
const LINE = 5;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (k: number) => Math.max(0, Math.min(1, k));
export type V = [number, number];
const mix = (a: V, b: V, k: number): V => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

/** Body heights by posture (figure-local px at s = 1, y up is negative): standing → seated cross-legged. */
const body = (sit: number) => ({ hip: lerp(-175, -48, sit), sh: lerp(-335, -208, sit), head: lerp(-385, -258, sit), hem: lerp(-26, -48, sit) });

/** Hand targets (figure-local) for the poses this reel needs; mixed with `pose(t, keys)` below. */
export const HANDS = {
  rest: (sit: number, side: -1 | 1): V => mix([side * 62, -168], [side * 82, -46], sit),          // hanging / on the knees
  ask: (sit: number, side: -1 | 1): V => mix([side * 84, -232], [side * 96, -140], sit),           // open hand at the chest: «may I?»
  invite: (sit: number, side: -1 | 1): V => mix([side * 150, -210], [side * 150, -90], sit),         // palm out toward a place
  talk: (sit: number, side: -1 | 1): V => mix([side * 70, -250], [side * 64, -128], sit),           // a small speaking gesture
  hold: (sit: number, side: -1 | 1): V => mix([side * 30, -245], [side * 26, -120], sit),           // holding the book at the chest
  down: (sit: number, side: -1 | 1): V => mix([side * 90, -60], [side * 110, -8], sit),            // reaching to the seat
};

/** Two-bone arm (front view): of the two elbow solutions take the natural one, lower and a little outward (an elbow
 *  that points up and out reads as hands-on-hips). */
const arm = (s: V, t: V, a = 78, b = 74, side: -1 | 1): V => {
  const dx = t[0] - s[0], dy = t[1] - s[1];
  const d = Math.min(Math.hypot(dx, dy), a + b - 1);
  const base = Math.atan2(dy, dx);
  const off = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const [e1, e2] = [base + off, base - off].map((g): V => [s[0] + a * Math.cos(g), s[1] + a * Math.sin(g)]);
  const score = (e: V) => e[1] + 0.35 * side * (e[0] - s[0]);
  return score(e1) >= score(e2) ? e1 : e2;
};

export type FigProps = {
  x: number; y?: number; s?: number; robe: string; cap: string;
  sit?: number;            // 0 standing … 1 seated cross-legged
  lean?: number;           // degrees, + toward the right of the frame
  look?: number;           // −1 … 1: where the head turns (a shift of head and cap)
  tilt?: number;           // head tilt, degrees
  nod?: number;            // head dip, px
  handL?: V; handR?: V;    // figure-local hand targets (HANDS…)
  walk?: number;           // walk phase in steps (standing only)
  stride?: number;         // 0 … 1: how much the legs swing (0 = feet together)
  breathe?: number;        // seconds, for the idle breath
  opacity?: number;
};

/** A symbolic person: no face, a robe, a cap, round hands. Seated = a cross-legged lap under the robe. */
export const Figure: React.FC<FigProps> = ({ x, y = FLOOR, s = 1, robe, cap, sit = 1, lean = 0, look = 0, tilt = 0, nod = 0, handL, handR, walk = 0, stride = 1, breathe = 0, opacity = 1 }) => {
  const b = body(sit);
  const br = Math.sin(breathe * 2 * Math.PI / 3.6) * 2.2;                  // a slow breath: shoulders and head rise 2 px
  const sh = b.sh - br, hy = b.head - br + nod;
  const step = Math.sin(walk * Math.PI) * stride;
  const lift = (v: number) => Math.max(0, v);
  const hl = handL ?? HANDS.rest(sit, -1), hr = handR ?? HANDS.rest(sit, 1);
  const sL: V = [-48, sh + 18], sR: V = [48, sh + 18];
  const eL = arm(sL, hl, 78, 74, -1), eR = arm(sR, hr, 78, 74, 1);
  const ol = { stroke: C.ink, strokeWidth: LINE, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const legOp = clamp01(1 - sit * 2.2), lapK = clamp01(sit * 1.4 - 0.2);
  const hx = look * 9, cx = look * 15;
  const limb = (p: V[]) => <><path d={`M${p.map((q) => q.join(' ')).join(' L')}`} fill="none" stroke={C.ink} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" /><path d={`M${p.map((q) => q.join(' ')).join(' L')}`} fill="none" stroke={robe} strokeWidth={19} strokeLinecap="round" strokeLinejoin="round" /></>;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      {/* standing legs under the hem, swinging with the walk */}
      {legOp > 0 && <g opacity={legOp}>
        {[-1, 1].map((k) => { const sw = k * step * 18, up = lift(k * step) * 10; return (
          <g key={k}><path d={`M${k * 20} ${b.hem} L${k * 22 + sw} ${-6 - up}`} {...ol} strokeWidth={13} />
            <ellipse cx={k * 26 + sw} cy={-6 - up} rx={20} ry={9} fill={C.ink} /></g>); })}
      </g>}
      {/* the crossed legs under the robe (the lap), growing as the figure sits */}
      {lapK > 0 && <ellipse cx={0} cy={-34} rx={lerp(60, 112, lapK)} ry={lerp(14, 36, lapK)} fill={robe} {...ol} />}
      <g transform={`rotate(${lean} 0 ${b.hip})`}>
        {/* robe: shoulders → hips → hem */}
        <path d={`M-30 ${sh} L30 ${sh} Q52 ${sh} 54 ${sh + 22} L62 ${b.hip} L66 ${b.hem} L-66 ${b.hem} L-62 ${b.hip} L-54 ${sh + 22} Q-52 ${sh} -30 ${sh} Z`} fill={robe} {...ol} />
        <path d={`M0 ${sh + 14} L0 ${lerp(b.hip, b.hem, 0.6)}`} stroke={C.ink} strokeOpacity={0.25} strokeWidth={4} strokeLinecap="round" />
        {limb([sL, eL, hl])}
        {limb([sR, eR, hr])}
        <circle cx={hl[0]} cy={hl[1]} r={13} fill={C.head} {...ol} />
        <circle cx={hr[0]} cy={hr[1]} r={13} fill={C.head} {...ol} />
        <g transform={`rotate(${tilt} 0 ${sh})`}>
          <rect x={-12 + hx * 0.4} y={sh - 22} width={24} height={26} fill={C.head} {...ol} />
          <circle cx={hx} cy={hy} r={40} fill={C.head} {...ol} />
          <path d={`M${cx - 39} ${hy - 6} A40 40 0 0 1 ${cx + 39} ${hy - 6} Q${cx} ${hy - 14} ${cx - 39} ${hy - 6} Z`} fill={cap} {...ol} />
        </g>
      </g>
    </g>
  );
};

/** Hand pose track: keys [at, V] in seconds, eased between, 0.35 s per change. */
export const pose = (t: number, keys: Array<[number, V]>, dur = 0.35): V => {
  let cur = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) break;
    cur = mix(cur, keys[i][1], tween(t, keys[i][0], keys[i][0] + dur, 0, 1, 'power2.inOut'));
  }
  return cur;
};

/** The majlis: arched wall, back cushions, the floor seat and a patterned rug. `cushions` = x of each back cushion. */
export const Majlis: React.FC<{ cushions?: number[]; rugY?: number }> = ({ cushions = [150, 410, 670, 930] }) => (
  <g>
    <rect x={-400} y={-400} width={W + 800} height={H + 800} fill={C.bg} />
    <rect x={-400} y={560} width={W + 800} height={FLOOR - 560} fill={C.wall} />
    {[200, 540, 880].map((ax) => <path key={ax} d={`M${ax - 110} 1180 L${ax - 110} 820 Q${ax - 110} 700 ${ax} 690 Q${ax + 110} 700 ${ax + 110} 820 L${ax + 110} 1180`} fill="none" stroke={C.arch} strokeWidth={14} />)}
    {cushions.map((cx) => (
      <g key={cx}>
        <rect x={cx - 120} y={1140} width={240} height={170} rx={34} fill={C.cushion} stroke={C.ink} strokeWidth={LINE} />
        <path d={`M${cx - 100} 1176 L${cx + 100} 1176`} stroke={C.brand} strokeWidth={6} strokeLinecap="round" opacity={0.55} />
      </g>
    ))}
    <rect x={-400} y={1300} width={W + 800} height={70} rx={14} fill={C.seat} stroke={C.ink} strokeWidth={LINE} />
    <rect x={-400} y={1368} width={W + 800} height={H} fill={C.floor} />
    <rect x={40} y={1420} width={W - 80} height={250} rx={10} fill={C.rug} stroke={C.ink} strokeWidth={LINE} />
    <rect x={70} y={1446} width={W - 140} height={198} rx={6} fill="none" stroke={C.rugLine} strokeWidth={6} />
    {Array.from({ length: 13 }, (_, i) => <path key={i} d={`M${120 + i * 70} 1545 l14 -14 l14 14 l-14 14 Z`} fill={C.rugDot} opacity={0.75} />)}
  </g>
);

/** Red «not like this» mark: a ring with a slash, popping in at `at`, gone at `out`. */
export const NoSign: React.FC<{ t: number; at: number; out: number; x: number; y: number; r?: number }> = ({ t, at, out, x, y, r = 58 }) => {
  if (t < at || t > out + 0.3) return null;
  const k = tween(t, at, at + 0.35, 0.3, 1, 'back.out(2.4)') * tween(t, out, out + 0.3, 1, 0, 'power2.in');
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <circle r={r} fill="#FFFFFF" fillOpacity={0.92} stroke={C.no} strokeWidth={14} />
      <path d={`M${-r * 0.68} ${r * 0.68} L${r * 0.68} ${-r * 0.68}`} stroke={C.no} strokeWidth={14} strokeLinecap="round" />
    </g>
  );
};

/** Green «that's it» check. */
export const Check: React.FC<{ t: number; at: number; out: number; x: number; y: number; r?: number }> = ({ t, at, out, x, y, r = 56 }) => {
  if (t < at || t > out + 0.3) return null;
  const k = tween(t, at, at + 0.35, 0.3, 1, 'back.out(2.4)') * tween(t, out, out + 0.3, 1, 0, 'power2.in');
  const draw = tween(t, at + 0.1, at + 0.45, 0, 1, 'power2.out');
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <circle r={r} fill={C.ok} stroke={C.ink} strokeWidth={LINE} />
      <path d={`M${-r * 0.42} ${r * 0.02} L${-r * 0.1} ${r * 0.32} L${r * 0.45} ${-r * 0.3}`} fill="none" stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
    </g>
  );
};

/** A personal-space ring around a seated figure (dashed); `hot` 0…1 turns it red where it is crowded. */
export const Ring: React.FC<{ x: number; s?: number; hot?: number; op?: number; t: number; r?: number }> = ({ x, s = 1, hot = 0, op = 1, t, r = 175 }) => {
  const col = hot > 0.5 ? C.no : C.ok;
  const rr = r * s;
  return <ellipse cx={x} cy={FLOOR - 150 * s} rx={rr} ry={rr * 1.08} fill={col} fillOpacity={0.06 * op} stroke={col} strokeWidth={6} strokeDasharray="18 14"
    strokeDashoffset={-t * 18} opacity={op} />;
};

/** The book left on a seat to keep the place (closed, brand blue). */
export const Book: React.FC<{ x: number; y: number; s?: number; op?: number; rot?: number }> = ({ x, y, s = 1, op = 1, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={op}>
    <rect x={-46} y={-14} width={92} height={28} rx={5} fill="#FFFFFF" stroke={C.ink} strokeWidth={LINE} />
    <rect x={-50} y={-20} width={100} height={16} rx={5} fill={C.brand} stroke={C.ink} strokeWidth={LINE} />
  </g>
);

/** A short curved arrow (make-room direction), drawn on between `at` and `at + 0.4`. */
export const Arrow: React.FC<{ t: number; at: number; out: number; x: number; y: number; dir?: -1 | 1; s?: number }> = ({ t, at, out, x, y, dir = -1, s = 1 }) => {
  if (t < at || t > out + 0.3) return null;
  const p = tween(t, at, at + 0.4, 0, 1, 'power2.out'), op = tween(t, out, out + 0.3, 1, 0);
  return (
    <g transform={`translate(${x} ${y}) scale(${dir * s} ${s})`} opacity={op}>
      <path d="M40 0 Q0 -26 -40 0" fill="none" stroke={C.brand} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      {p > 0.85 && <path d="M-40 0 l20 -4 M-40 0 l6 -19" stroke={C.brand} strokeWidth={10} strokeLinecap="round" />}
    </g>
  );
};

/** One shot: the world under a gentle GSAP camera, a subtle line boil, and HTML overlays (titles, cards). */
export const Frame: React.FC<{ T: number; start: Omit<CamKey, 'at' | 'dur' | 'ease'>; moves?: CamKey[]; children: React.ReactNode; overlay?: React.ReactNode }> = ({ T, start, moves = [], children, overlay }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <defs><Boil t={T} /></defs>
      <GsapCamera width={W} height={H} start={start} moves={moves}>
        <g filter="url(#boil)">{children}</g>
      </GsapCamera>
    </svg>
    {overlay}
  </AbsoluteFill>
);

/** The rule's title at the top: Cairo 900 in ink, a brand-blue bar drawn under it. */
export const Title: React.FC<{ t: number; from: number; to: number; text: string; top?: number; size?: number }> = ({ t, from, to, text, top = 150, size = 78 }) => {
  if (t < from || t > to + 0.3) return null;
  const op = Math.min(tween(t, from, from + 0.3, 0, 1), tween(t, to, to + 0.3, 1, 0));
  const y = tween(t, from, from + 0.4, 24, 0, 'power3.out');
  const bar = tween(t, from + 0.15, from + 0.6, 0, 1, 'power2.out');
  return (
    <div style={{ position: 'absolute', top, left: 0, width: W, textAlign: 'center', opacity: op, transform: `translateY(${y}px)` }}>
      <div style={{ direction: 'rtl', fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.3, color: C.ink, whiteSpace: 'nowrap' }}>{text}</div>
      <div style={{ margin: '6px auto 0', width: 220 * bar, height: 10, borderRadius: 5, background: C.brand }} />
    </div>
  );
};

/** A text card for the evidence: header line, the quoted text (Amiri, fully as in the source), the source line.
 *  `lines` appear one by one at their times (a verse is never rearranged, only revealed in order). */
export const Card: React.FC<{ t: number; from: number; to: number; head: string; lines: Array<[number, string]>; source?: string; top?: number; size?: number; width?: number }> =
  ({ t, from, to, head, lines, source, top = 330, size = 60, width = 940 }) => {
    if (t < from || t > to + 0.35) return null;
    const op = Math.min(tween(t, from, from + 0.35, 0, 1), tween(t, to, to + 0.35, 1, 0));
    const y = tween(t, from, from + 0.45, 40, 0, 'power3.out');
    return (
      <div style={{ position: 'absolute', top, left: (W - width) / 2, width, opacity: op, transform: `translateY(${y}px)` }}>
        <div style={{ background: C.card, border: `5px solid ${C.ink}`, borderRadius: 40, padding: '30px 44px 34px', boxShadow: '0 18px 0 rgba(24,42,58,0.08)', direction: 'rtl', textAlign: 'center' }}>
          {head && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: C.brand, lineHeight: 1.4 }}>{head}</div>}
          <div style={{ marginTop: head ? 10 : 0 }}>
            {lines.map(([at, txt], i) => (
              <div key={i} style={{ fontFamily: NASKH, fontWeight: 700, fontSize: size, lineHeight: 1.75, color: C.ink, textWrap: 'balance', opacity: tween(t, at, at + 0.4, 0, 1), transform: `translateY(${tween(t, at, at + 0.4, 14, 0, 'power2.out')}px)` }}>{txt}</div>
            ))}
          </div>
          {source && <div style={{ marginTop: 14, fontFamily: BODY, fontWeight: 700, fontSize: 36, color: C.slate }}>{source}</div>}
        </div>
      </div>
    );
  };

/** A small green label (e.g. «راحة الجليس»). */
export const Label: React.FC<{ t: number; from: number; to: number; text: string; top: number; color?: string }> = ({ t, from, to, text, top, color = C.ok }) => {
  if (t < from || t > to + 0.3) return null;
  const k = tween(t, from, from + 0.35, 0.6, 1, 'back.out(2)'), op = Math.min(tween(t, from, from + 0.2, 0, 1), tween(t, to, to + 0.3, 1, 0));
  return (
    <div style={{ position: 'absolute', top, left: 0, width: W, textAlign: 'center', opacity: op }}>
      <span style={{ display: 'inline-block', transform: `scale(${k})`, direction: 'rtl', fontFamily: FONT, fontWeight: 800, fontSize: 50, color: '#FFFFFF', background: color, padding: '6px 34px 16px', borderRadius: 34, border: `4px solid ${C.ink}` }}>{text}</span>
    </div>
  );
};

/** A position track (motion `keys`, seconds) with what a body does on it: legs swing with the distance walked,
 *  a seated figure lifts a little while it shuffles along the seat. */
export const track = (T: number, ks: Array<[number, number, string?]>) => {
  const x = keys(T, ks);
  const v = Math.abs(keys(T + 0.03, ks) - keys(T - 0.03, ks)) / 0.06;
  return { x, walk: x / 85, stride: Math.min(1, v / 220), lift: -14 * Math.min(1, v / 160) };
};

export { lerp, clamp01, mix };
