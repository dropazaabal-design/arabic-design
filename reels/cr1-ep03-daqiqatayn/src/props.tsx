import React from 'react';
import { PARTS, PIVOTS } from '../../../motion-core/src/characters/sultan/Art';
import { BODY, TITLE } from './fonts';
import { C } from './theme';

const INK = C.ink;
export const NIGHTSTAND_TOP = -170;
export const NIGHTSTAND_X = 140;
export const SEAT_X = -110; // where he sits on the bed edge: x of his hips

/** The running shoe, from the same SVG art as the character's feet (heel at the origin, toe to +x). */
export const Shoe: React.FC<{ s?: number; rot?: number; o?: number }> = ({ s = 1, rot = 0, o = 1 }) => {
  const R = PARTS.runner;
  return (
    <g transform={`rotate(${rot}) scale(${s})`} opacity={o} style={{ '--shoe': C.shoe, '--shoe-shade': C.shoeShade } as React.CSSProperties}>
      <g transform={`translate(${-PIVOTS.runner[0] - 28} ${-PIVOTS.runner[1]})`}><R /></g>
    </g>
  );
};

/** Shoe box, origin at its base centre; `lid` 0 closed … 1 lifted off (the lid is drawn by the caller when held). */
export const ShoeBox: React.FC<{ w?: number; h?: number; lid?: number; dust?: number; shoes?: number; drawLid?: boolean; f?: number; label?: boolean }> = ({ w = 220, h = 96, lid = 0, dust = 0, shoes = 2, drawLid = true, f = 0, label = true }) => (
  <g>
    <ellipse cx={0} cy={2} rx={w * 0.56} ry={8} fill={INK} opacity={0.12} />
    {/* inside: tissue and the pair */}
    <path d={`M${-w / 2 + 8} ${-h + 6} L${w / 2 - 8} ${-h + 6} L${w / 2 - 8} -8 L${-w / 2 + 8} -8 Z`} fill="#EEF3F8" />
    {shoes >= 2 && <g transform={`translate(-34 ${-h + 30})`}><Shoe s={0.95} rot={-6} /></g>}
    {shoes >= 1 && <g transform={`translate(40 ${-h + 36})`}><Shoe s={0.95} rot={4} /></g>}
    <path d={`M${-w / 2} ${-h + 22} L${w / 2} ${-h + 22} L${w / 2 - 4} 0 L${-w / 2 + 4} 0 Z`} fill={C.box} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
    <path d={`M${w / 2 - 34} ${-h + 22} L${w / 2} ${-h + 22} L${w / 2 - 4} 0 L${w / 2 - 34} 0 Z`} fill={C.boxShade} opacity={0.7} />
    {label && <g transform={`translate(${-w * 0.18} ${-h * 0.42})`}>
      <rect x={-34} y={-14} width={68} height={28} rx={6} fill="#F4F7FB" stroke={INK} strokeWidth={3} />
      <g transform="translate(-12 5) scale(0.42)"><Shoe /></g>
    </g>}
    {drawLid && <BoxLid w={w} y={-h + 22 - lid * 120} rot={lid * -14} />}
    {dust > 0 && Array.from({ length: 7 }, (_, k) => (
      <circle key={k} cx={-w / 2 + 20 + k * (w - 40) / 6} cy={-h + 14 - lid * 120 - 4 - ((f * 0.3 + k * 13) % 30)} r={2.2} fill="#9AA9BC" opacity={dust * (0.5 + 0.5 * Math.sin(f / 9 + k))} />
    ))}
  </g>
);

/** The lid, origin at its bottom centre (so a hand can carry it). */
export const BoxLid: React.FC<{ w?: number; y?: number; rot?: number }> = ({ w = 220, y = 0, rot = 0 }) => (
  <g transform={`translate(0 ${y}) rotate(${rot})`}>
    <path d={`M${-w / 2 - 8} -30 L${w / 2 + 8} -30 L${w / 2 + 8} 0 L${-w / 2 - 8} 0 Z`} fill={C.boxLid} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
    <path d={`M${-w / 2 - 8} -30 L${w / 2 + 8} -30`} stroke="#FFFFFF" strokeWidth={4} opacity={0.6} />
  </g>
);

/** A sticky note with a few words in marker. Origin at its centre. */
export const Note: React.FC<{ text: string; sub?: string; w?: number; o?: number; rot?: number; strike?: number; color?: string }> = ({ text, sub, w = 300, o = 1, rot = -3, strike = 0, color = C.marker }) => (
  <g opacity={o} transform={`rotate(${rot})`}>
    <rect x={-w / 2 + 6} y={-w * 0.36 + 8} width={w} height={w * 0.72} fill={INK} opacity={0.1} />
    <rect x={-w / 2} y={-w * 0.36} width={w} height={w * 0.72} fill={C.note} stroke={INK} strokeWidth={3.5} />
    <rect x={-w / 2} y={-w * 0.36} width={w} height={w * 0.1} fill="#C9D6F0" />
    <text x={0} y={sub ? -4 : 14} textAnchor="middle" direction="rtl" fontFamily={TITLE} fontWeight={800} fontSize={w * 0.2} fill={color}>{text}</text>
    {sub && <text x={0} y={w * 0.2} textAnchor="middle" direction="rtl" fontFamily={BODY} fontWeight={700} fontSize={w * 0.11} fill={C.mist}>{sub}</text>}
    {strike > 0 && <path d={`M${-w * 0.36} ${sub ? -10 : 6} L${-w * 0.36 + w * 0.72 * strike} ${sub ? -22 : -6}`} stroke={C.red} strokeWidth={10} strokeLinecap="round" />}
  </g>
);

export const BED = { x0: -820, x1: -80, top: -150, pillowX: -700 }; // world: bed from headboard to foot, mattress top
export const DOOR = { x: 1000, w: 300, h: 860 };
export const NOTE_AT: [number, number] = [190, -620];
export const CLOCK_AT: [number, number] = [-790, -330];

/** Bedroom: wall, window, bed, nightstand, wall calendar, door. `dim` cools and darkens for dawn, `night` for the lamp-lit evening. Ground y = 0. */
export const Bedroom: React.FC<{ dim?: number; night?: number; sun?: number; stand?: number; door?: number; calDay?: number; id?: string; light?: [number, number] }> = ({ dim = 0, night = 0, sun = 0, stand = NIGHTSTAND_X, door = 0, calDay = 0, id = 'room', light }) => (
  <g>
    <rect x={-1600} y={-1700} width={3800} height={1700} fill={C.wall} />
    <rect x={-1600} y={0} width={3800} height={900} fill={C.floor} />
    <path d="M-1600 0 L2200 0" stroke={C.floorLine} strokeWidth={8} />
    {Array.from({ length: 14 }, (_, k) => <path key={k} d={`M${-1600 + k * 300} 0 L${-1800 + k * 300} 900`} stroke={C.floorLine} strokeWidth={3} opacity={0.6} />)}
    {/* window */}
    <g transform="translate(560 -760)">
      <rect x={-170} y={-230} width={340} height={430} rx={10} fill={C.skyLow} stroke={INK} strokeWidth={6} />
      <rect x={-170} y={-230} width={340} height={430} rx={10} fill={C.sky} opacity={0.6 + 0.4 * sun} />
      <circle cx={70} cy={-60 + 120 * (1 - sun)} r={46} fill="#FFFFFF" opacity={0.45 + 0.5 * sun} />
      <path d="M0 -230 L0 200 M-170 -20 L170 -20" stroke={C.wall} strokeWidth={14} />
      <rect x={-170} y={-230} width={340} height={430} rx={10} fill="none" stroke={INK} strokeWidth={6} />
      <rect x={-196} y={200} width={392} height={22} rx={6} fill={C.envDeep} stroke={INK} strokeWidth={4} />
    </g>
    {/* wall calendar: the days he has not opened the box */}
    <g transform="translate(-200 -900)">
      <rect x={-6} y={-30} width={12} height={22} rx={4} fill={INK} />
      <rect x={-120} y={-12} width={240} height={250} rx={12} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
      <rect x={-120} y={-12} width={240} height={46} rx={12} fill={C.marker} stroke={INK} strokeWidth={5} />
      {Array.from({ length: 30 }, (_, k) => {
        const col = 5 - (k % 6), row = Math.floor(k / 6);
        const cx = -100 + col * 40 + 20, cy = 54 + row * 36 + 16;
        return <g key={k}>
          <rect x={cx - 15} y={cy - 13} width={30} height={26} rx={5} fill={C.note} />
          {k < calDay && <path d={`M${cx - 10} ${cy - 9} L${cx + 10} ${cy + 9} M${cx + 10} ${cy - 9} L${cx - 10} ${cy + 9}`} stroke={C.mist} strokeWidth={4} strokeLinecap="round" />}
        </g>;
      })}
    </g>
    {/* door, with the morning outside */}
    <g transform={`translate(${DOOR.x} 0)`}>
      <rect x={-DOOR.w / 2 - 22} y={-DOOR.h - 22} width={DOOR.w + 44} height={DOOR.h + 22} rx={8} fill={C.envDeep} stroke={INK} strokeWidth={6} />
      <rect x={-DOOR.w / 2} y={-DOOR.h} width={DOOR.w} height={DOOR.h} fill={C.skyLow} />
      <rect x={-DOOR.w / 2} y={-DOOR.h * 0.42} width={DOOR.w} height={DOOR.h * 0.42} fill={C.grass} opacity={0.75} />
      <path d={`M${-DOOR.w * 0.12} 0 L${-DOOR.w * 0.02} ${-DOOR.h * 0.42} L${DOOR.w * 0.06} ${-DOOR.h * 0.42} L${DOOR.w * 0.22} 0 Z`} fill={C.path} />
      {/* the panel swings inward: hinge on the left, so it narrows toward the hinge */}
      <g transform={`translate(${-DOOR.w / 2} 0) scale(${1 - 0.82 * door} 1)`}>
        <rect x={0} y={-DOOR.h} width={DOOR.w} height={DOOR.h} fill={C.wood} stroke={INK} strokeWidth={6} />
        <rect x={34} y={-DOOR.h + 50} width={DOOR.w - 68} height={DOOR.h * 0.36} rx={8} fill="none" stroke={C.woodShade} strokeWidth={6} />
        <rect x={34} y={-DOOR.h * 0.5} width={DOOR.w - 68} height={DOOR.h * 0.36} rx={8} fill="none" stroke={C.woodShade} strokeWidth={6} />
        <circle cx={DOOR.w - 40} cy={-DOOR.h * 0.47} r={13} fill={C.boxLid} stroke={INK} strokeWidth={4} />
      </g>
      {door > 0 && <path d={`M${-DOOR.w / 2 + DOOR.w * 0.18} 0 L${DOOR.w / 2} 0 L${DOOR.w / 2 + 420} 900 L${-DOOR.w / 2 - 120} 900 Z`} fill="#FFFFFF" opacity={0.35 * door} />}
    </g>
    {/* bed: headboard at x0, foot at x1 */}
    <g>
      <rect x={BED.x0} y={-330} width={60} height={330} rx={12} fill={C.wood} stroke={INK} strokeWidth={5} />
      <rect x={BED.x0 + 40} y={BED.top} width={BED.x1 - BED.x0 - 40} height={110} rx={16} fill={C.bed} stroke={INK} strokeWidth={5} />
      <rect x={BED.x0 + 48} y={BED.top - 46} width={150} height={56} rx={24} fill="#F2F5FA" stroke={INK} strokeWidth={4} />
      <rect x={BED.x0 + 50} y={-40} width={20} height={40} fill={C.woodShade} stroke={INK} strokeWidth={4} />
      <rect x={BED.x1 - 30} y={-40} width={20} height={40} fill={C.woodShade} stroke={INK} strokeWidth={4} />
    </g>
    {/* nightstand */}
    <g transform={`translate(${stand} 0)`}>
      <rect x={-90} y={-170} width={180} height={170} rx={8} fill={C.wood} stroke={INK} strokeWidth={5} />
      <rect x={-90} y={-170} width={180} height={18} rx={6} fill={C.woodShade} stroke={INK} strokeWidth={4} />
      <path d="M-70 -100 L70 -100" stroke={INK} strokeWidth={4} opacity={0.4} />
      <circle cx={0} cy={-120} r={6} fill={INK} opacity={0.5} />
    </g>
    {/* the light change sits behind what the scene draws next (the box, the person), so they keep their contrast */}
    <RoomLight dim={dim} night={night} id={id} lx={light?.[0]} ly={light?.[1]} />
  </g>
);

/** The blanket over the bed, drawn after a sleeper so it covers him from world x `from` to the foot; `lift` is how high the body under it raises it. */
export const Blanket: React.FC<{ from: number; lift?: number }> = ({ from, lift = 120 }) => {
  const x1 = BED.x1 + 6, top = BED.top, m = (from + x1) / 2;
  return <path d={`M${from} ${top + 8} C${from - 10} ${top - lift * 0.9} ${m - 120} ${top - lift} ${m} ${top - lift} C${m + 160} ${top - lift} ${x1 - 30} ${top - lift * 0.7} ${x1} ${top + 4} L${x1} ${top + 60} L${from} ${top + 60} Z`}
    fill={C.blanket} stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
};

/** The room's light: cool dawn or lamp-lit night, each a pool of light at (lx, ly) that is darkest at the edges of the frame, so
 * the person standing in the pool keeps his contrast (the colour report: a dark scene needs its own separation, not a flat dimmer). */
export const POOL = { inner: 0.22, edge: 0.78, r: 640 };
export const RoomLight: React.FC<{ dim?: number; night?: number; lx?: number; ly?: number; id: string }> = ({ dim = 0, night = 0, lx = 150, ly = -600, id }) => {
  const a = Math.max(dim, night);
  if (a <= 0) return null;
  const tint = night >= dim ? C.night : C.dawn;
  return <>
    <radialGradient id={`${id}-pool`} cx={lx} cy={ly} r={POOL.r} gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor={tint} stopOpacity={POOL.inner} /><stop offset="0.6" stopColor={tint} stopOpacity={(POOL.inner + POOL.edge) / 2} /><stop offset="1" stopColor={tint} stopOpacity={POOL.edge} />
    </radialGradient>
    <rect x={-1600} y={-1700} width={3800} height={2600} fill={`url(#${id}-pool)`} opacity={a} />
  </>;
};

/** Alarm clock, origin at its base centre. `ring` 0 … 1 shakes it and draws the ring lines; shows `time`. */
export const AlarmClock: React.FC<{ ring?: number; f?: number; time?: string }> = ({ ring = 0, f = 0, time = '5:30' }) => (
  <g transform={`rotate(${ring * 7 * Math.sin(f * 1.9)})`}>
    <path d="M-30 0 L-38 10 M30 0 L38 10" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    <rect x={-46} y={-70} width={92} height={70} rx={18} fill={C.marker} stroke={INK} strokeWidth={5} />
    <rect x={-34} y={-58} width={68} height={40} rx={8} fill="#E8F1FB" stroke={INK} strokeWidth={3} />
    <text x={0} y={-29} textAnchor="middle" fontFamily={TITLE} fontWeight={800} fontSize={28} fill={INK}>{time}</text>
    <rect x={-14} y={-82} width={28} height={12} rx={4} fill={C.red} stroke={INK} strokeWidth={3.5} />
    {ring > 0 && [[-70, -60, -30], [70, -60, 30], [-62, -18, -60], [62, -18, 60]].map(([x, y, r], k) => (
      <path key={k} transform={`translate(${x} ${y}) rotate(${r})`} d="M0 -12 L0 12" stroke={C.red} strokeWidth={6} strokeLinecap="round" opacity={ring * (0.5 + 0.5 * Math.sin(f * 0.9 + k))} />
    ))}
  </g>
);

/** A sticky note on the wall with a marker line being written: `write` 0 … 1 reveals it right to left (Arabic stroke order). */
export const WallNote: React.FC<{ text: string; sub?: string; w?: number; write?: number; strike?: number; rot?: number; id: string; color?: string; o?: number }> = ({ text, sub, w = 300, write = 1, strike = 0, rot = -3, id, color = C.marker, o = 1 }) => {
  const h = w * 0.72;
  return (
    <g transform={`rotate(${rot})`} opacity={o}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} fill={INK} opacity={0.1} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={C.note} stroke={INK} strokeWidth={3.5} />
      <rect x={-w / 2} y={-h / 2} width={w} height={w * 0.1} fill="#C9D6F0" />
      <clipPath id={`${id}-w`}><rect x={w / 2 - w * write} y={-h / 2} width={w * write} height={h} /></clipPath>
      <g clipPath={`url(#${id}-w)`}>
        <text x={0} y={sub ? -2 : 18} textAnchor="middle" direction="rtl" fontFamily={TITLE} fontWeight={800} fontSize={w * (text.length > 7 ? 0.17 : 0.21)} fill={color}>{text}</text>
        {sub && <text x={0} y={w * 0.2} textAnchor="middle" direction="rtl" fontFamily={BODY} fontWeight={700} fontSize={w * 0.11} fill={C.mist}>{sub}</text>}
      </g>
      {strike > 0 && <path d={`M${w * 0.38} ${sub ? -14 : 4} L${w * 0.38 - w * 0.76 * strike} ${sub ? -2 : 16}`} stroke={C.red} strokeWidth={11} strokeLinecap="round" />}
    </g>
  );
};

/** Marker pen, origin at the grip; held upright its tip is at MARKER_TIP (up and forward). */
export const MARKER_TIP: [number, number] = [55, -32];
export const Marker: React.FC = () => (
  <g transform="rotate(60)">
    <rect x={-8} y={-50} width={16} height={74} rx={6} fill={C.marker} stroke={INK} strokeWidth={3.5} />
    <path d="M-6 -50 L0 -64 L6 -50 Z" fill={INK} />
  </g>
);

/** A crumpled ball of note paper, origin at its centre. */
export const Crumple: React.FC<{ r?: number; rot?: number }> = ({ r = 30, rot = 0 }) => (
  <g transform={`rotate(${rot})`}>
    <path d={`M${-r} ${-r * 0.2} L${-r * 0.6} ${-r * 0.85} L${r * 0.1} ${-r} L${r * 0.8} ${-r * 0.6} L${r} ${r * 0.1} L${r * 0.6} ${r * 0.8} L${-r * 0.2} ${r} L${-r * 0.85} ${r * 0.55} Z`} fill={C.note} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    <path d={`M${-r * 0.5} ${-r * 0.2} L${r * 0.1} ${r * 0.1} L${r * 0.4} ${-r * 0.5} M${-r * 0.2} ${r * 0.6} L${r * 0.1} ${r * 0.1}`} stroke={C.mist} strokeWidth={2.5} fill="none" />
    <path d={`M${-r * 0.3} ${-r * 0.55} L${r * 0.35} ${-r * 0.35}`} stroke={C.red} strokeWidth={4} strokeLinecap="round" />
  </g>
);

/** A thick hardback in three-quarter view (cover and a deep block of page edges), origin at the grip on its lower edge. */
export const Book: React.FC<{ pages?: number; color?: string }> = ({ pages = 1, color = C.marker }) => {
  const t = 20 + 46 * pages; // thickness of the page block
  return (
    <g transform="translate(-60 -40) rotate(-8)">
      <path d={`M0 0 L${t} ${-t * 0.5} L${t + 120} ${-t * 0.5} L120 0 Z`} fill="#F2F5FA" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {Array.from({ length: Math.round(pages * 5) }, (_, k) => { const y = -((k + 1) / (pages * 5 + 1)) * t * 0.5, x = -y * 2; return <path key={k} d={`M${x + 8} ${y} L${x + 116} ${y}`} stroke={C.floorLine} strokeWidth={2.5} />; })}
      <path d={`M120 0 L${t + 120} ${-t * 0.5} L${t + 120} ${150 - t * 0.5} L120 150 Z`} fill="#E3EAF2" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {Array.from({ length: Math.round(pages * 7) }, (_, k) => <path key={k} d={`M${124 + k * t / (pages * 7)} ${-k * t * 0.5 / (pages * 7) + 6} L${124 + k * t / (pages * 7)} ${150 - k * t * 0.5 / (pages * 7) - 6}`} stroke={C.floorLine} strokeWidth={2} />)}
      <rect x={0} y={0} width={120} height={150} rx={6} fill={color} stroke={INK} strokeWidth={4.5} />
      <rect x={18} y={40} width={84} height={16} rx={5} fill="#FFFFFF" opacity={0.85} />
      <rect x={30} y={66} width={60} height={10} rx={4} fill="#FFFFFF" opacity={0.5} />
    </g>
  );
};

/** One loose page, origin at the corner held. */
export const Page: React.FC<{ rot?: number }> = ({ rot = 0 }) => (
  <g transform={`rotate(${rot}) translate(-8 -150)`}>
    <path d="M0 0 L110 -6 L116 140 L4 146 Z" fill="#FFFFFF" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    {[24, 44, 64, 84, 104].map((y) => <path key={y} d={`M20 ${y} L${y % 40 ? 96 : 76} ${y - 3}`} stroke={C.floorLine} strokeWidth={5} strokeLinecap="round" />)}
  </g>
);

/** Outside: sky, a low wall, trees and the walking path. Ground y = 0. `dx` scrolls the far layers for a walk. */
export const Outside: React.FC<{ dx?: number }> = ({ dx = 0 }) => (
  <g>
    <rect x={-2000} y={-1900} width={4000} height={1900} fill={C.sky} />
    <rect x={-2000} y={-700} width={4000} height={700} fill={C.skyLow} />
    <circle cx={520 - dx * 0.05} cy={-1180} r={90} fill="#FFFFFF" opacity={0.85} />
    <g transform={`translate(${-dx * 0.4} 0)`}>
      {Array.from({ length: 9 }, (_, k) => {
        const x = -1600 + k * 420, h = 260 + ((k * 97) % 140);
        return <g key={k} transform={`translate(${x} -60)`}>
          <rect x={-14} y={-h * 0.45} width={28} height={h * 0.45} fill={C.woodShade} stroke={INK} strokeWidth={4} />
          <ellipse cx={0} cy={-h * 0.6} rx={110} ry={h * 0.32} fill={C.grass} stroke={INK} strokeWidth={5} />
        </g>;
      })}
    </g>
    <rect x={-2000} y={-80} width={4000} height={1000} fill={C.grass} />
    <rect x={-2000} y={-30} width={4000} height={120} fill={C.path} stroke={INK} strokeWidth={4} />
    <g transform={`translate(${-dx} 0)`}>
      {Array.from({ length: 14 }, (_, k) => <path key={k} d={`M${-1800 + k * 300} 30 L${-1700 + k * 300} 30`} stroke={C.floorLine} strokeWidth={6} strokeLinecap="round" />)}
    </g>
  </g>
);

/** Three steps rising to the right; the first is the smallest. Origin at the foot of the first step. */
export const STEP = { w: 250, h: [40, 210, 380] };
export const Stairs: React.FC<{ lit?: number[]; labels?: [string, number][] }> = ({ lit = [0, 0, 0], labels = [] }) => (
  <g>
    {STEP.h.map((h, k) => (
      <g key={k}>
        <rect x={k * STEP.w} y={-h} width={STEP.w} height={h} fill={k === 0 ? C.shoe : lit[k] > 0.5 ? C.sky : C.boxLid} opacity={k === 0 ? 1 : 0.6 + 0.4 * lit[k]} stroke={INK} strokeWidth={5} />
      </g>
    ))}
    {labels.map(([t, o], k) => o > 0 && (
      <text key={k} x={k === 0 ? STEP.w / 2 : STEP.w * 1.5 + STEP.w / 2 * 0} y={k === 0 ? 60 : -STEP.h[2] - 40} textAnchor="middle" direction="rtl" fontFamily={TITLE} fontWeight={800} fontSize={k === 0 ? 64 : 58}
        fill={k === 0 ? C.shoeShade : C.mist} opacity={o}>{t}</text>
    ))}
  </g>
);
