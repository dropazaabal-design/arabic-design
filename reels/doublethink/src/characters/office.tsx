import React from 'react';
import { INK, LINE, PAL, bowLine, clamp, lerp, rand, stroke, wobEllipse, wobRect } from '@mukarram/characters/ink';

// The office, piece by piece. One rule holds every piece together: the first door's LOCK never changes —
// it has no "open" state at all (the bolt is always across the seam, the cobweb on the keyhole is never
// broken). Only the paper pad on the door changes, and only when the manager's stamp says so.
// Every word is real Arabic set in Cairo by the browser (RTL, joined letters); digits are Western.

export const AR = { fontFamily: 'Cairo', fontWeight: 900, direction: 'rtl' as const } as const;

export const C = {
  wall: '#26405E',
  wallLow: '#1F3651',
  rail: PAL.teal,
  floor: '#34465A',
  floorDeep: '#2A394B',
  door: PAL.blue,
  doorPanel: '#3E8AD1',
  frame: PAL.teal,
  steel: PAL.blueSoft,
  slot: '#132031',
  paper: '#F3EEE3',
  paperShade: '#E2DCCD',
  meet: PAL.red,
  meetPanel: '#EC5C68',
  suit: '#2A2F38',
  board: '#E3EBEE',
  pin: PAL.teal,
};

type At = { x: number; y: number; s?: number; rot?: number; o?: number };
const T = ({ x, y, s = 1, rot = 0 }: At) => `translate(${x} ${y}) rotate(${rot}) scale(${s})`;

/** A little tie inside a ring: the manager's seal (it sits on every stamp he makes). */
const Seal: React.FC<{ r: number; color: string }> = ({ r, color }) => (
  <g>
    <circle cx={0} cy={0} r={r} fill="none" stroke={color} strokeWidth={r * 0.16} />
    <path d={`M${-r * 0.2} ${-r * 0.55} L${r * 0.2} ${-r * 0.55} L${r * 0.12} ${-r * 0.32} L${r * 0.26} ${r * 0.45} L0 ${r * 0.66} L${-r * 0.26} ${r * 0.45} L${-r * 0.12} ${-r * 0.32} Z`} fill={color} />
  </g>
);

/** A rubber-stamp imprint: double frame and the word (sized from its length so it never overflows);
 *  the manager's seal sits on the bottom-left corner of the frame. */
export const StampMark: React.FC<At & { word: string; color?: string; w?: number; h?: number; seal?: boolean; size?: number }> = ({ word, color = PAL.red, w = 270, h = 116, seal = true, size, ...a }) => {
  const fs = size ?? Math.min(h * 0.62, (0.8 * w) / (0.66 * Math.max(3, word.length)));
  return (
    <g transform={T(a)} opacity={a.o ?? 0.93}>
      <path d={wobRect(-w / 2, -h / 2, w, h, 10, 900 + word.length, 2)} fill="none" stroke={color} strokeWidth={Math.max(4, h * 0.06)} />
      <path d={wobRect(-w / 2 + h * 0.1, -h / 2 + h * 0.1, w - h * 0.2, h * 0.8, 7, 910 + word.length, 1.5)} fill="none" stroke={color} strokeWidth={Math.max(2, h * 0.025)} />
      <text x={0} y={fs * 0.36} textAnchor="middle" {...AR} fontSize={fs} fill={color}>{word}</text>
      {seal && <g transform={`translate(${-w / 2 + 4} ${h / 2 - 4})`}><circle cx={0} cy={0} r={h * 0.24} fill={C.paper} /><Seal r={h * 0.2} color={color} /></g>}
    </g>
  );
};

export const SHEET = { w: 300, h: 150 };

/** One sheet of the door pad (300×150), optionally stamped; crease 0..1 draws the wrinkles of a sheet that was crumpled. */
export const PadSheet: React.FC<At & { word?: string | null; crease?: number }> = ({ word, crease = 0, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobRect(-150, -75, 300, 150, 6, 921, 1.5)} fill={C.paper} {...stroke(LINE * 0.7)} />
    {word && <StampMark x={4} y={-2} word={word} w={262} h={114} rot={-3} />}
    {crease > 0 && (
      <g opacity={0.55 * crease}>
        {[[-125, -50, 30, 64], [-40, -72, 80, 40], [55, -64, -15, 72], [-135, 14, 135, -8]].map(([x1, y1, x2, y2], i) => <path key={i} d={bowLine(x1, y1, x2, y2, 6)} {...stroke(2.5, PAL.stone)} />)}
      </g>
    )}
  </g>
);

/** A crumpled paper ball (unfold 0..1 opens it back into a creased sheet showing its word). */
export const Crumple: React.FC<At & { word?: string; unfold?: number; seed?: number }> = ({ word, unfold = 0, seed = 1, ...a }) => {
  if (unfold > 0.5) return <PadSheet {...a} word={word} crease={1} s={(a.s ?? 1) * lerp(0.6, 1, (unfold - 0.5) * 2)} />;
  const r = lerp(34, 48, unfold * 2);
  return (
    <g transform={T(a)} opacity={a.o ?? 1}>
      <path d={wobEllipse(0, 0, r, r * 0.9, 930 + seed, 0.16, 11)} fill={C.paper} {...stroke(LINE * 0.7)} />
      {[0, 1, 2, 3].map((i) => <path key={i} d={bowLine(-r * 0.6 + rand(seed * 5 + i) * r * 0.4, -r * 0.5 + i * r * 0.3, r * 0.5 - rand(seed * 9 + i) * r * 0.4, -r * 0.3 + i * r * 0.28, 8)} {...stroke(2.5, PAL.stone)} />)}
      <path d={`M${-r * 0.3} ${r * 0.1} q ${r * 0.2} ${-r * 0.3} ${r * 0.45} ${-r * 0.05}`} fill="none" stroke={PAL.red} strokeWidth={4} opacity={0.6} />
    </g>
  );
};

export type DoorState = {
  /** the word stamped on the pad's top sheet (null = blank) */
  word: string | null;
  /** sheets left in the pad */
  count: number;
  /** a top sheet being peeled away: 0..1 (rendered by the scene as a loose sheet once it's off) */
  flap?: number;
  /** the slab shakes a few px when pulled; the bolt never moves */
  rattle?: number;
  /** lever turned down (deg) */
  lever?: number;
  /** cobweb wobble (a breath on it) */
  web?: number;
  /** extra re-stamps of the same word (0..2), slightly offset: «من البداية» */
  bold?: number;
};

export const DOOR = { w: 400, h: 880, padY: -580, slotX: 0, slotY: -772, handleX: -140, handleY: -330, lockY: -262 };

/** The manager's door, front view. Origin = bottom centre on the floor. Hinges on the right, handle and lock on the left. */
export const Door: React.FC<{ x: number; y: number; st: DoorState }> = ({ x, y, st }) => {
  const { w, h } = DOOR;
  const r = clamp(st.rattle ?? 0, -6, 6);
  const lv = st.lever ?? 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* frame */}
      <path d={wobRect(-w / 2 - 44, -h - 44, w + 88, h + 44, 6, 941, 2)} fill={C.frame} {...stroke()} />
      <rect x={-w / 2} y={-h} width={w} height={h} fill={C.slot} />
      {/* strike plate on the frame, where the bolt goes in */}
      <path d={wobRect(-w / 2 - 34, DOOR.lockY - 26, 22, 52, 4, 942, 1)} fill={C.steel} {...stroke(LINE * 0.6)} />
      <g transform={`translate(${r} 0)`}>
        <path d={wobRect(-w / 2 + 4, -h + 4, w - 8, h - 8, 6, 943, 2)} fill={C.door} {...stroke()} />
        <path d={wobRect(-w / 2 + 46, -h + 70, w - 92, 340, 10, 944, 2)} fill={C.doorPanel} {...stroke(LINE * 0.6)} />
        <path d={wobRect(-w / 2 + 46, -h + 470, w - 92, 340, 10, 945, 2)} fill={C.doorPanel} {...stroke(LINE * 0.6)} />
        {/* hinges */}
        {[-h + 120, -h * 0.5, -120].map((hy) => <path key={hy} d={wobRect(w / 2 - 14, hy - 30, 20, 60, 4, 946, 1)} fill={C.steel} {...stroke(LINE * 0.6)} />)}
        {/* the pad holder and its sheets */}
        <g transform={`translate(0 ${DOOR.padY})`}>
          <path d={wobRect(-172, -104, 344, 208, 10, 947, 2)} fill={C.frame} {...stroke()} />
          {Array.from({ length: Math.min(6, Math.max(0, st.count - 1)) }, (_, i) => <path key={i} d={bowLine(-150, 78 + i * 4, 150, 78 + i * 4, 1)} {...stroke(2.5)} opacity={0.7} />)}
          {st.count > 0 && <PadSheet x={0} y={0} word={st.word} />}
          {st.word && (st.bold ?? 0) >= 1 && <StampMark x={8} y={1} word={st.word} w={262} h={114} rot={-1} o={0.4} seal={false} />}
          {st.word && (st.bold ?? 0) >= 2 && <StampMark x={0} y={-4} word={st.word} w={262} h={114} rot={-6} o={0.4} seal={false} />}
          <path d="M-70 -96 L70 -96" {...stroke(LINE * 1.2, C.suit)} />
        </g>
        {/* the hatch above the pad (its shutter slides up when the hand comes out) */}
        <g transform={`translate(${DOOR.slotX} ${DOOR.slotY})`}>
          <path d={wobRect(-96, -34, 192, 68, 8, 948, 1.5)} fill={C.steel} {...stroke(LINE * 0.8)} />
          <rect x={-78} y={-20} width={156} height={40} rx={6} fill={C.slot} />
          <g transform={`translate(0 -20) scale(1 ${1 - clamp(st.flap ?? 0) * 0.9})`}><rect x={-78} y={0} width={156} height={40} rx={4} fill={C.steel} {...stroke(LINE * 0.5)} /><path d="M-60 20 L60 20" {...stroke(LINE * 0.5)} opacity={0.5} /></g>
        </g>
        {/* lever handle */}
        <g transform={`translate(${DOOR.handleX} ${DOOR.handleY})`}>
          <path d={wobEllipse(0, 0, 26, 26, 949, 0.04, 9)} fill={C.steel} {...stroke(LINE * 0.8)} />
          <g transform={`rotate(${lv})`}><path d="M-6 -11 L84 -9 Q98 0 84 9 L-6 11 Z" fill={C.steel} {...stroke(LINE * 0.8)} /></g>
          <circle cx={0} cy={0} r={8} fill={INK} />
        </g>
        {/* lock plate, keyhole, and the cobweb nobody has broken */}
        <g transform={`translate(${DOOR.handleX} ${DOOR.lockY})`}>
          <path d={wobRect(-20, -34, 40, 68, 8, 950, 1)} fill={C.steel} {...stroke(LINE * 0.7)} />
          <circle cx={0} cy={-6} r={7} fill={INK} />
          <path d="M-4 -2 L4 -2 L6 16 L-6 16 Z" fill={INK} />
          <g opacity={0.85} transform={`translate(0 2) skewX(${(st.web ?? 0) * 8})`}>
            {[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d={`M0 0 L${Math.cos((a * Math.PI) / 180) * 26} ${Math.sin((a * Math.PI) / 180) * 26}`} stroke={PAL.white} strokeWidth={1.6} />)}
            {[9, 17, 24].map((rr) => <path key={rr} d={[0, 60, 120, 180, 240, 300, 360].map((a, i) => `${i ? 'L' : 'M'}${(Math.cos((a * Math.PI) / 180) * rr).toFixed(1)} ${(Math.sin((a * Math.PI) / 180) * rr).toFixed(1)}`).join(' ')} fill="none" stroke={PAL.white} strokeWidth={1.3} />)}
          </g>
        </g>
      </g>
      {/* THE BOLT: always across the seam into the frame (drawn over both) */}
      <path d={wobRect(-w / 2 - 30, DOOR.lockY - 9, 44 + r, 18, 4, 951, 0.8)} fill={INK} />
      <path d={`M${-w / 2 - 26} ${DOOR.lockY - 3} L${-w / 2 + 8 + r} ${DOOR.lockY - 3}`} stroke={PAL.stone} strokeWidth={3} opacity={0.6} />
      {/* gap under the door (where a sheet can slide back) */}
      <path d={bowLine(-w / 2 + 6, -3, w / 2 - 6, -3, 0.5)} stroke={C.slot} strokeWidth={7} />
    </g>
  );
};

/** The same door seen edge-on (for the bump). Origin = floor at the door's face; the door face is the line x=0, the corridor is x<0. */
export const DoorSide: React.FC<{ x: number; y: number; word: string | null; shake?: number }> = ({ x, y, word, shake = 0 }) => {
  const { h } = DOOR;
  return (
    <g transform={`translate(${x + shake} ${y})`}>
      <rect x={0} y={-h - 300} width={700} height={h + 300} fill={C.wallLow} />
      <path d={wobRect(0, -h - 44, 60, h + 44, 4, 961, 1.5)} fill={C.frame} {...stroke()} />
      <path d={wobRect(-4, -h, 44, h, 4, 962, 1.5)} fill={C.door} {...stroke()} />
      {/* pad holder, in profile, with the sheet edge */}
      <path d={wobRect(-26, DOOR.padY - 104, 26, 208, 4, 963, 1)} fill={C.frame} {...stroke(LINE * 0.8)} />
      <path d={`M-30 ${DOOR.padY - 60} L-30 ${DOOR.padY + 60}`} {...stroke(LINE * 0.8, C.paper)} />
      {word && <path d={`M-31 ${DOOR.padY - 30} L-31 ${DOOR.padY + 30}`} stroke={PAL.red} strokeWidth={4} />}
      {/* lever pointing into the corridor */}
      <path d={`M-4 ${DOOR.handleY - 12} L-40 ${DOOR.handleY - 12} L-40 ${DOOR.handleY - 30} L-110 ${DOOR.handleY - 26} Q-122 ${DOOR.handleY - 16} -110 ${DOOR.handleY - 6} L-40 ${DOOR.handleY + 4} L-40 ${DOOR.handleY + 12} L-4 ${DOOR.handleY + 12}Z`} fill={C.steel} {...stroke(LINE * 0.8)} />
      <path d={wobRect(-12, DOOR.lockY - 30, 12, 60, 3, 964, 1)} fill={C.steel} {...stroke(LINE * 0.6)} />
    </g>
  );
};

/** The manager's arm out of the mail slot: from `from` (slot) to the wrist `to`; holding a stamp, a sheet, or nothing. */
export const ManagerHand: React.FC<{ from: [number, number]; to: [number, number]; hold?: 'stamp' | 'none' | 'pinch' | 'fist'; press?: number; o?: number }> = ({ from, to, hold = 'stamp', press = 0, o = 1 }) => {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const L = Math.hypot(dx, dy);
  if (L < 4) return null;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const k = 1 - press * 0.12;
  return (
    <g opacity={o}>
      {/* sleeve (dark suit) and white cuff */}
      <path d={`M${from[0]} ${from[1]} L${to[0] - (dx / L) * 34} ${to[1] - (dy / L) * 34}`} stroke={INK} strokeWidth={50} strokeLinecap="round" />
      <path d={`M${from[0]} ${from[1]} L${to[0] - (dx / L) * 34} ${to[1] - (dy / L) * 34}`} stroke={C.suit} strokeWidth={50 - LINE * 1.6} strokeLinecap="round" />
      <g transform={`translate(${to[0] - (dx / L) * 30} ${to[1] - (dy / L) * 30}) rotate(${ang})`}>
        <rect x={-12} y={-27} width={20} height={54} rx={6} fill={PAL.white} {...stroke(LINE * 0.7)} />
        <circle cx={-2} cy={0} r={5} fill={PAL.red} />
      </g>
      <g transform={`translate(${to[0]} ${to[1]})`}>
        {hold === 'stamp' && (
          <g transform={`scale(1 ${k})`}>
            {/* stamp: knob held in the fist, neck, red rubber base below */}
            <path d="M-11 0 L11 0 L13 44 L-13 44 Z" fill={C.suit} {...stroke(LINE * 0.7)} />
            <path d={wobRect(-52, 44, 104, 28, 6, 971, 1)} fill={C.suit} {...stroke(LINE * 0.8)} />
            <path d={wobRect(-48, 70, 96, 12, 3, 972, 1)} fill={PAL.red} {...stroke(LINE * 0.6)} />
          </g>
        )}
        <path d={wobEllipse(0, -6, 30, 28, 973, 0.05, 9)} fill={PAL.white} {...stroke(LINE * 0.8)} />
        {hold === 'pinch' && <path d="M14 -18 Q34 -4 16 12" fill="none" {...stroke(LINE * 0.8)} />}
        {hold === 'none' && [-14, 0, 14].map((xx) => <path key={xx} d={`M${xx} 14 L${xx * 1.3} 40`} {...stroke(LINE * 0.9)} />)}
        <path d="M-22 -26 Q-30 -40 -14 -40" fill="none" {...stroke(LINE * 0.7)} />
      </g>
    </g>
  );
};

/** A hand-held rubber stamp (the clerk's blue «صحيح» stamp, or any colour). Origin = the grip. */
export const StampTool: React.FC<At & { color?: string; press?: number }> = ({ color = PAL.blue, press = 0, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <g transform={`scale(1 ${1 - press * 0.12})`}>
      <path d={wobEllipse(0, -6, 20, 18, 974, 0.05, 8)} fill={color} {...stroke(LINE * 0.7)} />
      <path d="M-9 8 L9 8 L11 46 L-11 46 Z" fill={C.suit} {...stroke(LINE * 0.7)} />
      <path d={wobRect(-46, 46, 92, 24, 5, 975, 1)} fill={C.suit} {...stroke(LINE * 0.8)} />
      <path d={wobRect(-42, 68, 84, 10, 3, 976, 1)} fill={color} {...stroke(LINE * 0.5)} />
    </g>
  </g>
);

/** A meeting memo: «الاجتماع» / «قائم» or «ملغي» / 3:00 / the manager's seal; `ok` 0..1 lands the clerk's blue «صحيح». unroll 0..1. */
export const Memo: React.FC<At & { kind: 'on' | 'off'; ok?: number; unroll?: number }> = ({ kind, ok = 0, unroll = 1, ...a }) => {
  const u = clamp(unroll);
  const word = kind === 'on' ? 'قائم' : 'ملغي';
  return (
    <g transform={T(a)} opacity={a.o ?? 1}>
      <g transform={`translate(0 -130) scale(1 ${0.08 + 0.92 * u}) translate(0 130)`}>
        <path d={wobRect(-100, -130, 200, 260, 8, kind === 'on' ? 981 : 982, 2)} fill={C.paper} {...stroke(LINE * 0.8)} />
        <text x={0} y={-84} textAnchor="middle" {...AR} fontSize={30} fill={INK} opacity={0.85}>الاجتماع</text>
        <text x={0} y={-6} textAnchor="middle" {...AR} fontSize={74} fill={INK}>{word}</text>
        <g transform="translate(0 46)">
          <circle cx={46} cy={0} r={15} fill="none" {...stroke(4)} />
          <path d="M46 -9 L46 0 L53 5" fill="none" {...stroke(3.5)} />
          <text x={-6} y={13} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={38} fill={INK}>3:00</text>
        </g>
        <StampMark x={8} y={100} word="المدير" w={124} h={46} rot={-4} size={24} />
        {ok > 0 && <StampMark x={2} y={82} word="صحيح" color={PAL.blue} w={196} h={88} seal={false} rot={-9} o={0.95 * clamp(ok * 3)} s={1 + 0.25 * (1 - clamp(ok * 3))} />}
      </g>
      {u < 1 && <path d={wobRect(-104, -130 + 260 * (0.08 + 0.92 * u) - 14, 208, 28, 12, 983, 1)} fill={C.paperShade} {...stroke(LINE * 0.7)} />}
    </g>
  );
};

/** A pneumatic-post capsule (closed), origin at its centre. */
export const Capsule: React.FC<At & { open?: number }> = ({ open = 0, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobRect(-24, -50, 48, 100, 18, 984, 1.2)} fill={PAL.teal} {...stroke(LINE * 0.8)} />
    <path d="M-24 -26 L24 -26 M-24 26 L24 26" {...stroke(LINE * 0.6)} />
    <g transform={`translate(0 ${-50 - open * 30}) rotate(${open * -40})`}><path d={wobRect(-26, -14, 52, 18, 7, 985, 1)} fill={PAL.blue} {...stroke(LINE * 0.7)} /></g>
  </g>
);

/** A pneumatic tube down the wall with an outlet mouth at the bottom (points toward `dir`). shake in px. */
export const Tube: React.FC<{ x: number; top: number; bottom: number; dir?: 1 | -1; shake?: number }> = ({ x, top, bottom, dir = 1, shake = 0 }) => (
  <g transform={`translate(${x + shake} 0)`}>
    <path d={`M-22 ${top} L-22 ${bottom - 30} M22 ${top} L22 ${bottom - 30}`} {...stroke()} />
    <rect x={-22} y={top} width={44} height={bottom - 30 - top} fill={PAL.teal} />
    <path d={`M-22 ${top} L-22 ${bottom - 30} M22 ${top} L22 ${bottom - 30}`} {...stroke()} />
    {[top + 160, top + 420].map((yy) => <path key={yy} d={wobRect(-30, yy, 60, 22, 4, 986, 1)} fill={PAL.blue} {...stroke(LINE * 0.7)} />)}
    <g transform={`translate(0 ${bottom - 30}) scale(${dir} 1)`}>
      <path d="M-22 0 Q-22 60 30 60 L62 60 L62 -14 L30 -14 Q22 -14 22 0 Z" fill={PAL.teal} {...stroke()} />
      <path d={wobEllipse(62, 23, 12, 40, 987, 0.05, 8)} fill={C.slot} {...stroke(LINE * 0.8)} />
    </g>
  </g>
);

export const Pin: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx={0} cy={0} r={11} fill={PAL.red} {...stroke(LINE * 0.6)} />
    <circle cx={-3} cy={-3} r={3} fill={PAL.white} opacity={0.7} />
  </g>
);

export const PinBoard: React.FC<{ x: number; y: number; w?: number; h?: number }> = ({ x, y, w = 420, h = 300 }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={wobRect(-w / 2, -h / 2, w, h, 10, 988, 2)} fill={PAL.teal} {...stroke()} />
    <path d={wobRect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 6, 989, 1.5)} fill="#7FB2AF" {...stroke(LINE * 0.5)} />
  </g>
);

/** The clerk's desk: a blue front panel (hides his legs) and a light top at y=−232. Origin = floor centre. */
export const Desk: React.FC<{ x: number; y: number; w?: number }> = ({ x, y, w = 600 }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={wobRect(-w / 2 + 20, -200, w - 40, 200, 8, 991, 2)} fill={PAL.blue} {...stroke()} />
    <path d={wobRect(-w / 2 + 60, -170, 150, 80, 6, 992, 1.5)} fill="#3E8AD1" {...stroke(LINE * 0.6)} />
    <path d="M-120 -130 L-100 -130" {...stroke(LINE * 1.2)} transform={`translate(${-w / 2 + 245} 0)`} />
    <path d={wobRect(-w / 2, -232, w, 40, 8, 993, 2)} fill={C.steel} {...stroke()} />
  </g>
);

/** Office chair (red), sized to the clerk (seat top at y=−128, back up to −330). Origin = floor centre. roll turns the casters. */
export const Chair: React.FC<At & { roll?: number }> = ({ roll = 0, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d="M0 -112 L0 -40" {...stroke(LINE * 2.4, C.suit)} />
    {[-96, -44, 44, 96].map((dx) => <path key={dx} d={`M0 -34 L${dx} -16`} {...stroke(LINE * 1.8, C.suit)} />)}
    {[-96, -44, 44, 96].map((dx, i) => <g key={dx} transform={`translate(${dx} -12) rotate(${roll * 180 + i * 40})`}><circle cx={0} cy={0} r={12} fill={INK} /><path d="M-7 0 L7 0" stroke={PAL.stone} strokeWidth={3} /></g>)}
    <path d={`M-62 -150 L-62 -190 M62 -150 L62 -190`} {...stroke(LINE * 1.6, C.suit)} />
    <path d={wobRect(-96, -340, 192, 160, 38, 995, 2)} fill={PAL.red} {...stroke()} />
    <path d="M-56 -296 Q0 -314 56 -296" fill="none" {...stroke(LINE * 0.6)} opacity={0.4} />
    <path d={wobRect(-112, -150, 224, 40, 16, 994, 2)} fill={PAL.red} {...stroke()} />
  </g>
);
export const CHAIR = { seat: -128, backTop: -336 };

/** Small open notebook (two pages). `word` is handwritten on the right page; write 0..1 reveals it right→left; erase 0..1 rubs it out. */
export const Notebook: React.FC<At & { word?: string; write?: number; erase?: number; seed?: number; smudge?: boolean }> = ({ word, write = 1, erase = 0, seed = 1, smudge = false, ...a }) => {
  const id = `nb${seed}`;
  return (
    <g transform={T(a)} opacity={a.o ?? 1}>
      <path d={wobRect(-160, -100, 320, 200, 10, 996, 1.5)} fill={PAL.blue} {...stroke(LINE * 0.8)} />
      <path d={wobRect(-150, -92, 148, 184, 6, 997, 1)} fill={C.paper} {...stroke(LINE * 0.6)} />
      <path d={wobRect(2, -92, 148, 184, 6, 998, 1)} fill={C.paper} {...stroke(LINE * 0.6)} />
      {[-52, -14, 24, 62].map((yy) => <path key={yy} d={`M16 ${yy} L138 ${yy} M-138 ${yy} L-16 ${yy}`} stroke={PAL.blueSoft} strokeWidth={2.5} />)}
      <path d="M0 -92 L0 92" {...stroke(LINE * 0.6)} />
      {smudge && <g opacity={0.3}><path d="M26 -30 q 50 -14 104 -6" stroke={PAL.stone} strokeWidth={14} strokeLinecap="round" fill="none" /><path d="M34 -16 q 40 -8 84 0" stroke={PAL.stone} strokeWidth={3} fill="none" /></g>}
      {word && (
        <g>
          <clipPath id={id}><rect x={150 - 148 * clamp(write)} y={-92} width={148 * clamp(write)} height={184} /></clipPath>
          <g clipPath={`url(#${id})`} opacity={1 - clamp(erase) * 0.95}>
            <text x={76} y={14} textAnchor="middle" fontFamily="Cairo" fontWeight={800} direction="rtl" fontSize={word.length > 4 ? 40 : 46} fill={INK} transform="rotate(-4 76 0)">{word}</text>
          </g>
          {erase > 0 && erase < 1 && <path d={`M22 ${-2 + Math.sin(erase * 40) * 8} L130 ${-8 + Math.cos(erase * 40) * 8}`} stroke={PAL.redSoft} strokeWidth={12} strokeLinecap="round" opacity={0.5} />}
          {erase > 0.15 && <path d="M30 18 q 40 -12 90 -4" stroke={PAL.stone} strokeWidth={3} fill="none" opacity={0.35 * clamp(erase)} />}
        </g>
      )}
    </g>
  );
};

/** The meeting-room door (red) with a small window and a hook for notices. Origin = bottom centre. */
export const MeetDoor: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={wobRect(-224, -904, 448, 904, 6, 1001, 2)} fill={C.frame} {...stroke()} />
    <path d={wobRect(-180, -860, 360, 860, 6, 1002, 2)} fill={C.meet} {...stroke()} />
    <path d={wobRect(-110, -780, 220, 150, 10, 1003, 2)} fill={C.slot} {...stroke(LINE * 0.8)} />
    <path d="M-80 -760 L-40 -650 M-30 -770 L10 -660" stroke={PAL.blueSoft} strokeWidth={5} opacity={0.35} />
    <path d={wobRect(-130, -420, 260, 320, 10, 1004, 2)} fill={C.meetPanel} {...stroke(LINE * 0.6)} />
    <g transform="translate(140 -330)">
      <path d={wobEllipse(0, 0, 24, 24, 1005, 0.04, 9)} fill={C.steel} {...stroke(LINE * 0.8)} />
      <path d="M6 -10 L-74 -9 Q-88 0 -74 9 L6 10 Z" fill={C.steel} {...stroke(LINE * 0.8)} />
    </g>
    <path d="M-50 -585 L-30 -585 L-30 -560 Q-30 -548 -40 -548" fill="none" {...stroke(LINE * 1.1, C.suit)} />
  </g>
);
export const MEET = { hookY: -560, clockY: -1010 };

/** Digital wall clock showing a time (Western digits). Origin = centre. */
export const Clock: React.FC<At & { text: string; blink?: number }> = ({ text, blink = 1, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobRect(-130, -56, 260, 112, 18, 1006, 2)} fill={C.suit} {...stroke()} />
    <text x={0} y={30} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={78} fill={PAL.teal} opacity={0.4 + 0.6 * blink}>{text}</text>
  </g>
);

/** Whiteboard: the term is written right→left (write 0..1), then the attribution line (sub 0..1). Origin = centre. */
export const Whiteboard: React.FC<At & { write?: number; sub?: number }> = ({ write = 0, sub = 0, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobRect(-200, -230, 400, 460, 10, 1007, 2)} fill={C.steel} {...stroke()} />
    <path d={wobRect(-184, -214, 368, 428, 6, 1008, 1.5)} fill={C.board} {...stroke(LINE * 0.5)} />
    <path d={wobRect(-150, 214, 300, 22, 6, 1009, 1)} fill={C.steel} {...stroke(LINE * 0.7)} />
    <path d={wobRect(60, 200, 60, 16, 6, 1010, 1)} fill={PAL.blue} {...stroke(LINE * 0.5)} />
    <clipPath id="wb1"><rect x={184 - 368 * clamp(write)} y={-214} width={368 * clamp(write)} height={250} /></clipPath>
    <g clipPath="url(#wb1)">
      <text x={0} y={-100} textAnchor="middle" {...AR} fontSize={92} fill={PAL.blue}>التفكير</text>
      <text x={0} y={8} textAnchor="middle" {...AR} fontSize={92} fill={PAL.blue}>المزدوج</text>
    </g>
    <clipPath id="wb2"><rect x={184 - 368 * clamp(sub)} y={40} width={368 * clamp(sub)} height={170} /></clipPath>
    <g clipPath="url(#wb2)">
      <path d="M-120 52 L120 52" stroke={PAL.red} strokeWidth={5} strokeLinecap="round" />
      <text x={0} y={130} textAnchor="middle" {...AR} fontSize={56} fill={PAL.red}>أورويل · 1984</text>
    </g>
  </g>
);

/** A low cabinet by the first door (somewhere to put papers down). Origin = floor centre. */
export const Cabinet: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={wobRect(-100, -300, 200, 300, 8, 1011, 2)} fill={PAL.teal} {...stroke()} />
    <path d="M-100 -150 L100 -150" {...stroke(LINE * 0.7)} />
    <path d="M-20 -225 L20 -225 M-20 -75 L20 -75" {...stroke(LINE * 1.2, C.suit)} />
    <path d={wobRect(-110, -318, 220, 26, 6, 1012, 1)} fill={C.steel} {...stroke(LINE * 0.8)} />
  </g>
);
