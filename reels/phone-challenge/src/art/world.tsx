import React from 'react';
import { BODY_FONT } from '../fonts';
import { draw, STROKE } from '../motion';
import { C } from '../theme';
import { ArText, G, P } from './doodles';

// Episode 2's one visual world: a phone, a day calendar, paper, and time. Large objects whose parts
// move separately, so the picture can show cause and effect (a reply takes the evening, a pause
// opens the calendar). No people, no faces.

const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** Width of a line of Arabic text, estimated (Cairo/Tajawal at weight 800–900). */
export const textW = (t: string, size: number) => t.length * size * 0.52;

/* ───────────────────────────── Phone ───────────────────────────── */

export const PHONE = { w: 560, h: 1040, screenTop: -492, chatTop: -380, fieldY: 236, keysTop: 300, bottom: 492 };

/** A large phone. Chat content is passed as children in screen coordinates (x −250…250, y −380…200).
 *  `words`/`shown` fill the input field one whole word at a time (Arabic letters are never split). */
export const Phone: React.FC<P & {
  contact: string; words?: string[]; shown?: number; caret?: boolean; send?: number; keys?: number;
  tint?: number; children?: React.ReactNode; fieldColor?: string;
}> = ({ contact, words = [], shown = 0, caret = false, send = 0, keys = 1, tint = 0, children, fieldColor = C.ink, ...g }) => {
  const text = words.slice(0, Math.max(0, Math.round(shown))).join(' ');
  const press = 1 - 0.18 * Math.sin(clamp(send) * Math.PI);
  return (
    <G {...g}>
      <defs><clipPath id="phoneScreen"><rect x={-252} y={-492} width={504} height={984} rx={52} /></clipPath></defs>
      <rect x={-280} y={-520} width={560} height={1040} rx={76} fill={C.navy} stroke={C.ink} strokeWidth={8} filter="url(#lift)" />
      <g clipPath="url(#phoneScreen)">
        <rect x={-252} y={-492} width={504} height={984} fill={C.paper} />
        {/* header: contact */}
        <rect x={-252} y={-492} width={504} height={110} fill={C.blueSoft} />
        <circle cx={186} cy={-432} r={32} fill={C.cardboard} stroke={C.ink} strokeWidth={4} />
        <ArText x={186} y={-430} size={30} color={C.ink}>{contact.slice(0, 1)}</ArText>
        <ArText x={138} y={-432} size={36} anchor="start" color={C.ink}>{contact}</ArText>
        {children}
        {/* the calm of a pause: an aqua veil over the screen */}
        {tint > 0 && <rect x={-252} y={-382} width={504} height={600} fill={C.aqua} opacity={0.35 * tint} />}
        {/* input field + send (RTL: send button on the left) */}
        <rect x={-252} y={196} width={504} height={96} fill="#EEF0F2" />
        <rect x={-150} y={206} width={382} height={76} rx={38} fill={C.white} stroke={C.line} strokeWidth={3} />
        {text && <ArText x={206} y={245} size={38} anchor="start" color={fieldColor}>{text}</ArText>}
        {caret && <rect x={text ? 206 - textW(text, 38) - 10 : 206} y={222} width={4} height={46} fill={C.blue} />}
        <g transform={`translate(-200 244) scale(${press})`}>
          <circle r={36} fill={send > 0 ? C.blue : C.inkSoft} />
          <path d="M 14 0 L -12 -14 L -6 0 L -12 14 Z" fill={C.white} transform="scale(-1 1)" />
        </g>
        {/* keyboard */}
        <g opacity={keys} transform={`translate(0 ${(1 - keys) * 200})`}>
          <rect x={-252} y={300} width={504} height={192} fill="#E3E6EA" />
          {[0, 1, 2].map((r) => Array.from({ length: 9 - (r === 2 ? 2 : 0) }).map((_, k) => (
            <rect key={`${r}-${k}`} x={-232 + (r === 2 ? 52 : 0) + k * 52} y={316 + r * 56} width={44} height={46} rx={8} fill={C.white} />
          )))}
        </g>
      </g>
      <rect x={-60} y={-508} width={120} height={14} rx={7} fill={C.ink} opacity={0.8} />
    </G>
  );
};

/** A chat bubble inside the phone. side 'in' sits on the right (RTL chat), 'out' on the left. */
export const ChatBubble: React.FC<{
  x?: number; y: number; text: string; side: 'in' | 'out'; fill?: string; color?: string; size?: number; p?: number;
  dashed?: boolean; ticks?: number; w?: number;
}> = ({ y, text, side, fill, color = C.ink, size = 40, p = 1, dashed = false, ticks = 0, w }) => {
  if (p <= 0) return null;
  const bw = Math.min(478, w ?? textW(text, size) + 56 + (ticks > 0 ? 44 : 0)), bh = size * 1.9;
  const right = side === 'in' ? 232 : -232 + bw;
  const left = right - bw;
  const tailX = side === 'in' ? right - 6 : left + 6;
  const bg = fill ?? (side === 'in' ? C.white : C.blueSoft);
  const k = 0.6 + 0.4 * clamp(p);
  const ox = side === 'in' ? right : left;
  return (
    <g opacity={clamp(p * 1.4)} transform={`translate(${ox} ${y}) scale(${k}) translate(${-ox} ${-y})`}>
      <rect x={left} y={y - bh / 2} width={bw} height={bh} rx={26} fill={bg} stroke={dashed ? C.inkSoft : C.line} strokeWidth={dashed ? 4 : 3} strokeDasharray={dashed ? '14 10' : undefined} />
      <path d={side === 'in' ? `M ${tailX - 18} ${y + bh / 2 - 4} L ${tailX + 14} ${y + bh / 2 + 14} L ${tailX - 2} ${y + bh / 2 - 18} Z` : `M ${tailX + 18} ${y + bh / 2 - 4} L ${tailX - 14} ${y + bh / 2 + 14} L ${tailX + 2} ${y + bh / 2 - 18} Z`} fill={bg} />
      <ArText x={right - 28} y={y + 1} size={size} anchor="start" color={color}>{text}</ArText>
      {ticks > 0 && <g opacity={ticks} transform={`translate(${left + 26} ${y + bh / 2 - 18})`}><path d="M -14 0 L -8 6 L 2 -6 M -4 0 L 2 6 L 12 -6" {...STROKE} strokeWidth={4} stroke={C.blue} /></g>}
    </g>
  );
};

/* ───────────────────────────── Calendar ───────────────────────────── */

export type Block = { from: number; to: number; label: string; color: string; text?: string; o?: number; dashed?: boolean; glow?: number };

/** A day column (evening hours, top to bottom). Hour labels sit on the right (RTL). */
export const DayCalendar: React.FC<P & { w?: number; h?: number; from?: number; to?: number; title: string; blocks?: Block[]; paper?: string; closed?: number; cover?: string }> = ({
  w = 600, h = 760, from = 16, to = 22, title, blocks = [], paper = C.paper, closed = 0, cover = '', ...g
}) => {
  const top = -h / 2 + 96, rowH = (h - 116) / (to - from);
  const y = (hr: number) => top + (hr - from) * rowH;
  const gx0 = -w / 2 + 28, gx1 = w / 2 - 112;
  return (
    <G {...g}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={paper} stroke={C.ink} strokeWidth={6} filter="url(#lift)" />
      <rect x={-w / 2} y={-h / 2} width={w} height={84} rx={26} fill={C.cardboard} />
      <rect x={-w / 2} y={-h / 2 + 56} width={w} height={28} fill={C.cardboard} />
      <ArText x={0} y={-h / 2 + 44} size={44} color={C.ink}>{title}</ArText>
      {Array.from({ length: to - from + 1 }).map((_, i) => (
        <g key={i}>
          <path d={`M ${gx0} ${y(from + i)} L ${w / 2 - 24} ${y(from + i)}`} stroke={C.line} strokeWidth={3} />
          {i < to - from && <ArText x={w / 2 - 30} y={y(from + i) + 26} size={30} anchor="start" color={C.inkSoft} font={BODY_FONT} weight={700}>{`${((from + i - 1) % 12) + 1} م`}</ArText>}
        </g>
      ))}
      {blocks.map((b, i) => {
        const o = b.o ?? 1;
        if (o <= 0 || b.to <= b.from) return null;
        const y0 = y(b.from), y1 = y(b.to), bh = y1 - y0;
        return (
          <g key={i} opacity={o}>
            {(b.glow ?? 0) > 0 && <rect x={gx0 - 10} y={y0 - 6} width={gx1 - gx0 + 20} height={bh + 12} rx={22} fill="none" stroke={b.color} strokeWidth={8} opacity={b.glow} />}
            <rect x={gx0} y={y0 + 4} width={gx1 - gx0} height={Math.max(4, bh - 8)} rx={16} fill={b.color} stroke={b.dashed ? C.ink : 'none'} strokeWidth={b.dashed ? 4 : 0} strokeDasharray={b.dashed ? '14 10' : undefined} />
            {bh > 44 && <ArText x={(gx0 + gx1) / 2} y={y0 + bh / 2} size={Math.min(44, bh * 0.42)} color={b.text ?? C.white}>{b.label}</ArText>}
          </g>
        );
      })}
      {/* a closed cover (cardboard) that flips up as the planner opens */}
      {closed > 0 && (
        <g transform={`translate(0 ${-h / 2}) scale(1 ${closed}) translate(0 ${h / 2})`}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={C.cardboard} stroke={C.ink} strokeWidth={6} />
          <rect x={-w / 2 + 24} y={-h / 2 + 24} width={w - 48} height={h - 48} rx={18} fill="none" stroke={C.cardboardDark} strokeWidth={4} strokeDasharray="16 12" />
          {cover && <ArText x={0} y={0} size={84} color={C.ink} weight={900}>{cover}</ArText>}
        </g>
      )}
    </G>
  );
};

/** Hour → y inside a DayCalendar (same geometry), for placing things next to a block. */
export const calY = (hr: number, h = 760, from = 16, to = 22) => -h / 2 + 96 + (hr - from) * ((h - 116) / (to - from));

/* ───────────────────────────── Time ───────────────────────────── */

/** A wall clock; `minutes` after 4 pm turns the hands. `ring` draws a pause arc (0…1). */
export const Clock: React.FC<P & { r?: number; minutes?: number; ring?: number; frozen?: number; color?: string }> = ({ r = 170, minutes = 0, ring = 0, frozen = 0, color = C.ink, ...g }) => {
  const total = 16 * 60 + minutes;
  const ha = ((total / 60) % 12) * 30, ma = (total % 60) * 6;
  return (
    <G {...g}>
      {frozen > 0 && <circle r={r + 34} fill={C.aqua} opacity={0.45 * frozen} />}
      <circle r={r} fill={C.paper} stroke={color} strokeWidth={10} filter="url(#lift)" />
      {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M 0 ${-r + 18} L 0 ${-r + (i % 3 ? 34 : 48)}`} stroke={color} strokeWidth={i % 3 ? 5 : 8} strokeLinecap="round" transform={`rotate(${i * 30})`} />)}
      <path d={`M 0 0 L 0 ${-r * 0.5}`} stroke={color} strokeWidth={14} strokeLinecap="round" transform={`rotate(${ha})`} />
      <path d={`M 0 0 L 0 ${-r * 0.74}`} stroke={color} strokeWidth={9} strokeLinecap="round" transform={`rotate(${ma})`} />
      <circle r={12} fill={color} />
      {ring > 0 && <circle r={r + 18} fill="none" stroke={C.blue} strokeWidth={12} strokeLinecap="round" transform="rotate(-90)" {...draw(ring)} />}
    </G>
  );
};

/* ───────────────────────────── Balance ───────────────────────────── */

/** A balance scale; tilt > 0 lowers the right pan. Pans stay level while the beam turns. */
export const Scale: React.FC<P & { tilt?: number; left: string; right: string; leftColor?: string; rightColor?: string; leftLoad?: React.ReactNode; rightLoad?: React.ReactNode; dark?: boolean }> = ({
  tilt = 0, left, right, leftColor = C.green, rightColor = C.aqua, leftLoad, rightLoad, dark = false, ...g
}) => {
  const a = (tilt * Math.PI) / 180, L = 300;
  const lx = -L * Math.cos(a), ly = -L * Math.sin(a), rx = L * Math.cos(a), ry = L * Math.sin(a);
  const line = dark ? C.paper : C.ink;
  const pan = (x: number, y: number, label: string, color: string, load: React.ReactNode) => (
    <g transform={`translate(${x} ${y})`}>
      <path d="M 0 0 L -110 150 M 0 0 L 110 150" stroke={line} strokeWidth={5} />
      {load && <g transform="translate(0 150)">{load}</g>}
      <path d="M -150 150 Q 0 230 150 150 Z" fill={color} stroke={line} strokeWidth={6} />
      <ArText x={0} y={250} size={46} color={dark ? C.white : C.ink}>{label}</ArText>
    </g>
  );
  return (
    <G {...g}>
      <path d="M -120 330 L 120 330 L 0 270 Z" fill={line} />
      <path d="M 0 280 L 0 -40" stroke={line} strokeWidth={14} strokeLinecap="round" />
      <path d={`M ${lx} ${ly - 40} L ${rx} ${ry - 40}`} stroke={line} strokeWidth={14} strokeLinecap="round" />
      <circle cx={0} cy={-40} r={16} fill={line} />
      {pan(lx, ly - 40, left, leftColor, leftLoad)}
      {pan(rx, ry - 40, right, rightColor, rightLoad)}
    </G>
  );
};

/* ───────────────────────────── Paper ───────────────────────────── */

/** A strip of tape (collage). */
export const Tape: React.FC<{ x: number; y: number; w?: number; rot?: number; o?: number }> = ({ x, y, w = 160, rot = -6, o = 1 }) => (
  <rect x={x - w / 2} y={y - 22} width={w} height={44} fill={C.aqua} opacity={0.75 * o} transform={`rotate(${rot} ${x} ${y})`} />
);

/** A kraft-paper note with tape; lines of text, one per row. */
export const Note: React.FC<P & { w?: number; h?: number; lines: string[]; size?: number; fill?: string; color?: string; tape?: boolean }> = ({ w = 420, h = 220, lines, size = 44, fill = C.cardboard, color = C.ink, tape = true, ...g }) => (
  <G {...g}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={fill} filter="url(#lift)" />
    {lines.map((l, i) => <ArText key={i} x={0} y={-((lines.length - 1) * size * 0.65) + i * size * 1.3} size={size} color={color}>{l}</ArText>)}
    {tape && <Tape x={0} y={-h / 2} w={w * 0.4} rot={-4} />}
  </G>
);

/** A receipt that prints downwards; `p` reveals the rows. The last row is the total. */
export const Receipt: React.FC<P & { w?: number; rows: Array<[string, number]>; title: string }> = ({ w = 620, rows, title, ...g }) => {
  const rowH = 96;
  const shown = rows.filter(([, p]) => p > 0).length;
  const cut = 120 + shown * rowH;
  const n = Math.ceil(w / 40), step = w / n;
  const zig = Array.from({ length: n }).map((_, i) => `L ${-w / 2 + (i + 0.5) * step} ${cut + 18} L ${-w / 2 + (i + 1) * step} ${cut}`).join(' ');
  return (
    <G {...g}>
      <rect x={-w / 2} y={0} width={w} height={cut} fill={C.paper} filter="url(#lift)" />
      <path d={`M ${-w / 2} ${cut} ${zig} Z`} fill={C.paper} />
      <path d={`M ${-w / 2} ${cut} L ${-w / 2} 0 L ${w / 2} 0 L ${w / 2} ${cut} ${Array.from({ length: n }).map((_, i) => `L ${w / 2 - (i + 0.5) * step} ${cut + 18} L ${w / 2 - (i + 1) * step} ${cut}`).join(' ')}`} fill="none" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <ArText x={0} y={56} size={46} color={C.ink}>{title}</ArText>
      <path d={`M ${-w / 2 + 30} 100 L ${w / 2 - 30} 100`} stroke={C.ink} strokeWidth={4} strokeDasharray="12 10" />
      {rows.map(([label, p], i) => p > 0 && (
        <g key={i} opacity={clamp(p * 1.5)}>
          {i === rows.length - 1 && <path d={`M ${-w / 2 + 30} ${120 + i * rowH} L ${w / 2 - 30} ${120 + i * rowH}`} stroke={C.ink} strokeWidth={4} />}
          <ArText x={w / 2 - 40} y={170 + i * rowH} size={i === rows.length - 1 ? 50 : 44} anchor="start" color={i === rows.length - 1 ? C.red : C.ink} weight={i === rows.length - 1 ? 900 : 800}>{label}</ArText>
        </g>
      ))}
    </G>
  );
};

/* ───────────────────────────── Paths ───────────────────────────── */

type Pt = [number, number];
/** A path made of cubic pieces [p0, c1, c2, p1] (each starting where the last ended), sampled to points. */
export const curve = (pieces: Array<[Pt, Pt, Pt, Pt]>, n = 40): Pt[] => pieces.flatMap(([a, b, c, d], k) =>
  Array.from({ length: n + 1 }).slice(k ? 1 : 0).map((_, i): Pt => {
    const t = (k ? i + 1 : i) / n, u = 1 - t;
    return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
  }));
/** A straight piece in the same form. */
export const line = (a: Pt, b: Pt): [Pt, Pt, Pt, Pt] => [a, [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3], [a[0] + (2 * (b[0] - a[0])) / 3, a[1] + (2 * (b[1] - a[1])) / 3], b];
/** The point at fraction u (0…1) of the length of a sampled path. */
export const along = (pts: Pt[], u: number): Pt => {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = clamp(u) * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? Math.min(1, d / seg[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= seg[i];
  }
  return pts[pts.length - 1];
};
export const svgPath = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

/** A pill with a word on it (labels that live on the stage and can move). */
export const Pill: React.FC<P & { text: string; size?: number; fill?: string; color?: string; stroke?: string }> = ({ text, size = 46, fill = C.ink, color = C.white, stroke, ...g }) => {
  const w = textW(text, size) + size * 1.3, h = size * 1.75;
  return (
    <G {...g}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke ?? 'none'} strokeWidth={stroke ? 5 : 0} filter="url(#lift)" />
      <ArText x={0} y={2} size={size} color={color}>{text}</ArText>
    </G>
  );
};

/* ───────────────────────────── Marks ───────────────────────────── */

/** A bracket between two x positions with a label above it (the two seconds between «لا» and «حاضر»). */
export const Gap: React.FC<{ x1: number; x2: number; y: number; label: string; p: number; color?: string }> = ({ x1, x2, y, label, p, color = C.blue }) => p > 0 ? (
  <g opacity={clamp(p * 1.5)}>
    <path d={`M ${x1} ${y + 26} L ${x1} ${y} L ${x2} ${y} L ${x2} ${y + 26}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" {...draw(p)} />
    <ArText x={(x1 + x2) / 2} y={y - 44} size={46} color={color}>{label}</ArText>
  </g>
) : null;

/** The pause sign (two bars). */
export const PauseSign: React.FC<P & { color?: string }> = ({ color = C.blue, ...g }) => (
  <G {...g}>
    <circle r={90} fill={C.aqua} stroke={color} strokeWidth={8} />
    <rect x={-36} y={-44} width={24} height={88} rx={8} fill={color} />
    <rect x={12} y={-44} width={24} height={88} rx={8} fill={color} />
  </G>
);

/** A rubber stamp (rotated, outlined text). */
export const Stamp: React.FC<P & { text: string; color?: string; size?: number }> = ({ text, color = C.red, size = 48, ...g }) => {
  const w = textW(text, size) + 70;
  return (
    <G {...g}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.9} rx={14} fill="none" stroke={color} strokeWidth={8} />
      <ArText x={0} y={2} size={size} color={color} weight={900}>{text}</ArText>
    </G>
  );
};

/** A horizontal line that wobbles (discomfort) and settles as `calm` goes to 1. */
export const Wave: React.FC<{ x: number; y: number; w: number; amp: number; calm: number; t: number; p?: number; color?: string; width?: number }> = ({ x, y, w, amp, calm, t, p = 1, color = C.red, width = 10 }) => {
  const pts = Array.from({ length: 121 }).map((_, i) => {
    const u = i / 120, a = amp * (1 - calm) * Math.sin(Math.PI * u);
    return `${i ? 'L' : 'M'} ${x + w / 2 - u * w} ${y + a * Math.sin(u * 22 + t * 5)}`;
  }).join(' ');
  return <path d={pts} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" {...draw(p)} />;
};

/** A cracked heart (a reaction imagined, no face). */
export const CrackedHeart: React.FC<P & { crack?: number; color?: string }> = ({ crack = 1, color = C.red, ...g }) => (
  <G {...g}>
    <path d="M 0 60 C -90 0 -90 -70 -40 -70 C -15 -70 0 -50 0 -35 C 0 -50 15 -70 40 -70 C 90 -70 90 0 0 60 Z" fill={color} stroke={C.ink} strokeWidth={6} />
    <path d="M 0 -35 L -12 -8 L 10 10 L -6 34" fill="none" stroke={C.paper} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" {...draw(crack)} />
  </G>
);

/** A check badge. */
export const Check: React.FC<P & { color?: string }> = ({ color = C.green, ...g }) => (
  <G {...g}>
    <circle r={40} fill={color} />
    <path d="M -18 0 L -4 14 L 20 -14" fill="none" stroke={C.white} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
  </G>
);


/** A message bubble anywhere on the stage, centred on (x, y). `tail` puts the tail right ('in') or left ('out'). */
export const MsgBubble: React.FC<P & { text: string; size?: number; fill?: string; color?: string; tail?: 'in' | 'out'; stroke?: string; dashed?: boolean; w?: number }> = ({
  text, size = 56, fill = C.white, color = C.ink, tail = 'in', stroke = C.line, dashed = false, w, ...g
}) => {
  const bw = w ?? textW(text, size) + size * 1.4, bh = size * 1.9;
  const tx = tail === 'in' ? bw / 2 - 26 : -bw / 2 + 26, d = tail === 'in' ? 1 : -1;
  return (
    <G {...g}>
      <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={bh * 0.38} fill={fill} stroke={stroke} strokeWidth={4} strokeDasharray={dashed ? '16 12' : undefined} filter="url(#lift)" />
      <path d={`M ${tx - 20 * d} ${bh / 2 - 4} L ${tx + 18 * d} ${bh / 2 + 22} L ${tx - 2 * d} ${bh / 2 - 22} Z`} fill={fill} />
      <ArText x={0} y={2} size={size} color={color}>{text}</ArText>
    </G>
  );
};

/** A horizontal evening timeline (RTL: 4 pm on the right). Blocks are drawn on the bar. */
export const Evening: React.FC<{ x0: number; x1: number; y: number; from?: number; to?: number; p?: number; blocks?: Block[]; h?: number; label?: string }> = ({ x0, x1, y, from = 16, to = 22, p = 1, blocks = [], h = 200, label }) => {
  const X = (hr: number) => x0 - ((hr - from) / (to - from)) * (x0 - x1);
  return (
    <g>
      <rect x={x1 - 20} y={y - h / 2 - 20} width={x0 - x1 + 40} height={h + 40} rx={28} fill={C.paper} stroke={C.ink} strokeWidth={6} filter="url(#lift)" opacity={clamp(p * 2)} />
      {Array.from({ length: to - from + 1 }).map((_, i) => {
        const q = clamp(p * (to - from + 1) - i);
        return q > 0 ? (
          <g key={i} opacity={q}>
            <path d={`M ${X(from + i)} ${y - h / 2} L ${X(from + i)} ${y + h / 2}`} stroke={C.line} strokeWidth={4} />
            <ArText x={X(from + i)} y={y + h / 2 + 52} size={36} color={C.inkSoft} weight={700} font={BODY_FONT}>{`${((from + i - 1) % 12) + 1} م`}</ArText>
          </g>
        ) : null;
      })}
      {label && <g opacity={clamp(p * 2)}><ArText x={x0 - 4} y={y - h / 2 - 54} size={44} anchor="start" color={C.ink}>{label}</ArText></g>}
      {blocks.map((b, i) => {
        const o = b.o ?? 1;
        if (o <= 0 || b.to <= b.from) return null;
        const a = X(b.from), c = X(b.to);
        return (
          <g key={i} opacity={o}>
            <rect x={c + 6} y={y - h / 2 + 14} width={a - c - 12} height={h - 28} rx={20} fill={b.color} stroke={b.dashed ? C.ink : 'none'} strokeWidth={4} strokeDasharray={b.dashed ? '14 10' : undefined} />
            {a - c > 120 && <ArText x={(a + c) / 2} y={y} size={54} color={b.text ?? C.white}>{b.label}</ArText>}
          </g>
        );
      })}
    </g>
  );
};
export const eveningX = (hr: number, x0: number, x1: number, from = 16, to = 22) => x0 - ((hr - from) / (to - from)) * (x0 - x1);
