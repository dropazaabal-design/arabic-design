import React from 'react';
import { BODY, TITLE } from './fonts';
import { C } from './theme';

const INK = C.ink;
// the room, in world units (floor at y 0)
export const CLOCK = { x: -140, y: -1100, r: 120 };
export const DOOR = { x: 980, w: 300, h: 860 };
export const HANDLE: [number, number] = [DOOR.x + DOOR.w / 2 - 40, -404];
export const WORK_X = 160; // where the flat-pack lies on the floor

/** Wall clock: Western digits at the quarters, time in minutes after midnight (12-hour face). */
export const WallClock: React.FC<{ min: number; r?: number; note?: string; spin?: number }> = ({ min, r = CLOCK.r, note, spin = 0 }) => {
  const h = ((min / 60) % 12) * 30, m = (min % 60) * 6;
  return (
    <g>
      <circle r={r + 14} fill={C.clock} stroke={INK} strokeWidth={6} />
      <circle r={r} fill={C.paper} stroke={INK} strokeWidth={4} />
      {Array.from({ length: 12 }, (_, k) => <path key={k} transform={`rotate(${k * 30})`} d={`M0 ${-r + 10} L0 ${-r + (k % 3 ? 20 : 28)}`} stroke={INK} strokeWidth={k % 3 ? 3 : 6} strokeLinecap="round" />)}
      {[['12', 0, -r + 58], ['3', r - 48, 14], ['6', 0, r - 32], ['9', -r + 48, 14]].map(([t, x, y]) => (
        <text key={t as string} x={x as number} y={y as number} textAnchor="middle" fontFamily={TITLE} fontWeight={800} fontSize={r * 0.3} fill={INK}>{t}</text>
      ))}
      <path transform={`rotate(${h})`} d={`M0 12 L0 ${-r * 0.5}`} stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <path transform={`rotate(${m})`} d={`M0 16 L0 ${-r * 0.78}`} stroke={C.clockDeep} strokeWidth={7} strokeLinecap="round" />
      <circle r={9} fill={INK} />
      {spin > 0 && <circle r={r * 0.9} fill="none" stroke={C.clock} strokeWidth={6} strokeDasharray="30 40" opacity={0.6 * spin} transform={`rotate(${min * 3})`} />}
      {note && <g transform={`translate(${r * 1.2} ${r * 0.5}) rotate(8)`}>
        <rect x={-70} y={-34} width={140} height={68} fill={C.note} stroke={INK} strokeWidth={3.5} />
        <text x={0} y={12} textAnchor="middle" direction="rtl" fontFamily={TITLE} fontWeight={800} fontSize={30} fill={INK}>{note}</text>
      </g>}
    </g>
  );
};

/** The living room. `dusk` 0 … 1 slides the window and the room toward evening; `door` 0 … 1 opens the front door. */
export const Room: React.FC<{ dusk?: number; door?: number; clockMin: number; note?: string; spin?: number; id: string; sofa?: boolean }> = ({ dusk = 0, door = 0, clockMin, note, spin = 0, id, sofa = true }) => (
  <g>
    <rect x={-1800} y={-1800} width={4000} height={1800} fill={C.wall} />
    <rect x={-1800} y={-250} width={4000} height={250} fill={C.wallDeep} opacity={0.55} />
    <rect x={-1800} y={0} width={4000} height={900} fill={C.floor} />
    <path d="M-1800 0 L2200 0" stroke={C.floorLine} strokeWidth={8} />
    {Array.from({ length: 16 }, (_, k) => <path key={k} d={`M${-1800 + k * 280} 0 L${-1980 + k * 280} 900`} stroke={C.floorLine} strokeWidth={3} opacity={0.55} />)}
    {/* window: the afternoon goes to evening */}
    <g transform="translate(470 -800)">
      <rect x={-170} y={-230} width={340} height={430} rx={10} fill={C.sky} stroke={INK} strokeWidth={6} />
      <rect x={-170} y={-230} width={340} height={430} rx={10} fill={C.dusk} opacity={0.75 * dusk} />
      <circle cx={-60} cy={-120 + 260 * dusk} r={44} fill="#FFFFFF" opacity={0.85 - 0.6 * dusk} />
      <path d="M0 -230 L0 200 M-170 -20 L170 -20" stroke={C.wall} strokeWidth={14} />
      <rect x={-170} y={-230} width={340} height={430} rx={10} fill="none" stroke={INK} strokeWidth={6} />
      <rect x={-196} y={200} width={392} height={22} rx={6} fill={C.wallDeep} stroke={INK} strokeWidth={4} />
    </g>
    <g transform={`translate(${CLOCK.x} ${CLOCK.y})`}><WallClock min={clockMin} note={note} spin={spin} /></g>
    {/* sofa and plant, left */}
    {sofa && <g transform="translate(-720 0)">
      <rect x={-260} y={-260} width={520} height={150} rx={30} fill={C.sofa} stroke={INK} strokeWidth={5} />
      <rect x={-300} y={-150} width={600} height={120} rx={26} fill={C.sofaShade} stroke={INK} strokeWidth={5} />
      <rect x={-320} y={-210} width={80} height={180} rx={28} fill={C.sofa} stroke={INK} strokeWidth={5} />
      <rect x={240} y={-210} width={80} height={180} rx={28} fill={C.sofa} stroke={INK} strokeWidth={5} />
      <rect x={-270} y={-30} width={22} height={30} fill={INK} /><rect x={248} y={-30} width={22} height={30} fill={INK} />
    </g>}
    <g transform="translate(-1180 0)">
      <path d="M-60 0 L-48 -120 L48 -120 L60 0 Z" fill={C.panelShade} stroke={INK} strokeWidth={5} />
      {[[-40, -300, -20], [30, -330, 18], [0, -380, 0], [-60, -230, -40], [60, -250, 40]].map(([x, y, r], k) => (
        <ellipse key={k} cx={x} cy={y} rx={34} ry={90} transform={`rotate(${r} ${x} ${y + 80})`} fill={k % 2 ? C.plant : C.plantDeep} stroke={INK} strokeWidth={4} />
      ))}
    </g>
    {/* front door */}
    <g transform={`translate(${DOOR.x} 0)`}>
      <rect x={-DOOR.w / 2 - 22} y={-DOOR.h - 22} width={DOOR.w + 44} height={DOOR.h + 22} rx={8} fill={C.wallDeep} stroke={INK} strokeWidth={6} />
      <rect x={-DOOR.w / 2} y={-DOOR.h} width={DOOR.w} height={DOOR.h} fill={dusk > 0.5 ? C.dusk : C.skyLow} />
      <rect x={-DOOR.w / 2} y={-DOOR.h * 0.4} width={DOOR.w} height={DOOR.h * 0.4} fill={C.plant} opacity={0.6} />
      {/* the panel swings inward, hinge on the left */}
      <g transform={`translate(${-DOOR.w / 2} 0) scale(${1 - 0.82 * door} 1)`}>
        <rect x={0} y={-DOOR.h} width={DOOR.w} height={DOOR.h} fill={C.panel} stroke={INK} strokeWidth={6} />
        <rect x={36} y={-DOOR.h + 50} width={DOOR.w - 72} height={DOOR.h * 0.36} rx={8} fill="none" stroke={C.panelEdge} strokeWidth={6} />
        <rect x={36} y={-DOOR.h * 0.5} width={DOOR.w - 72} height={DOOR.h * 0.38} rx={8} fill="none" stroke={C.panelEdge} strokeWidth={6} />
        <rect x={DOOR.w - 52} y={-410} width={26} height={14} rx={6} fill={C.metal} stroke={INK} strokeWidth={4} />
      </g>
    </g>
    {/* evening light: a cool wash that leaves a pool around the work area, so he keeps his contrast */}
    {dusk > 0 && <>
      <radialGradient id={`${id}-eve`} cx={WORK_X - 100} cy={-420} r={760} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={C.dusk} stopOpacity={0.12} /><stop offset="0.6" stopColor={C.dusk} stopOpacity={0.4} /><stop offset="1" stopColor={C.dusk} stopOpacity={0.7} />
      </radialGradient>
      <rect x={-1800} y={-1800} width={4000} height={2700} fill={`url(#${id}-eve)`} opacity={dusk} />
    </>}
  </g>
);

/** Doorbell: rings drawn by the door. */
export const Ring: React.FC<{ o: number; f: number }> = ({ o, f }) => o <= 0 ? null : (
  <g transform={`translate(${DOOR.x - DOOR.w / 2 - 70} -560)`} opacity={o}>
    {[0, 1, 2].map((k) => <path key={k} d={`M${-20 - k * 22} -40 Q${-46 - k * 26} 0 ${-20 - k * 22} 40`} stroke={C.clock} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(f * 0.6 - k)} />)}
  </g>
);

/** A flat-pack board: white laminate, edge band, pre-drilled holes, and its number sticker (an arrow shows which way is up). */
export const Panel: React.FC<{ w: number; h: number; num?: string; flipped?: boolean; rot?: number }> = ({ w, h, num, flipped = false, rot = 0 }) => (
  <g transform={`rotate(${rot})`}>
    <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill={INK} opacity={0.12} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={C.panel} stroke={INK} strokeWidth={4.5} />
    <rect x={w / 2 - 14} y={-h / 2} width={14} height={h} rx={4} fill={C.panelShade} stroke={INK} strokeWidth={3} />
    {[-0.36, 0, 0.36].map((t) => <circle key={t} cx={(flipped ? -1 : 1) * w * 0.28} cy={t * h} r={7} fill={C.panelEdge} stroke={INK} strokeWidth={2.5} />)}
    {num && <g transform={`translate(${(flipped ? 1 : -1) * w * 0.12} ${-h * 0.18}) rotate(${flipped ? 180 : 0})`}>
      <circle r={40} fill={C.clock} stroke={INK} strokeWidth={4} />
      <text y={16} textAnchor="middle" fontFamily={TITLE} fontWeight={800} fontSize={48} fill="#FFFFFF">{num}</text>
      <path d="M0 -70 L-16 -50 L16 -50 Z" fill={C.clock} stroke={INK} strokeWidth={3} />
    </g>}
  </g>
);

/** The instruction sheet: pictures only (as the line says), origin at its centre. */
export const Instructions: React.FC<{ rot?: number }> = ({ rot = 0 }) => (
  <g transform={`rotate(${rot})`}>
    <rect x={-120} y={-160} width={240} height={320} rx={8} fill={C.paper} stroke={INK} strokeWidth={4} />
    {[[-60, -90], [60, -90], [-60, 60], [60, 60]].map(([x, y], k) => (
      <g key={k} transform={`translate(${x} ${y})`}>
        <rect x={-50} y={-60} width={100} height={120} rx={6} fill="none" stroke={C.panelEdge} strokeWidth={3} />
        <text x={-38} y={-38} fontFamily={TITLE} fontWeight={800} fontSize={24} fill={INK}>{k + 1}</text>
        <path d={['M-20 40 L-20 -30 L20 -30 L20 40', 'M-25 0 L25 0 M0 -25 L0 25', 'M-28 30 L28 30 L28 -20 M-28 -20 L28 -20', 'M-20 -20 L20 20 M10 20 L20 20 L20 10'][k]} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
        <circle cx={22} cy={-28} r={6} fill={C.clock} />
      </g>
    ))}
  </g>
);

/** A screw, origin at its head; `tilt` leans it (a crooked one). */
export const Screw: React.FC<{ tilt?: number; s?: number }> = ({ tilt = 0, s = 1 }) => (
  <g transform={`rotate(${tilt}) scale(${s})`}>
    <path d="M-4 0 L4 0 L3 34 L0 40 L-3 34 Z" fill={C.metal} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M-4 10 L4 13 M-4 18 L4 21 M-4 26 L4 29" stroke={INK} strokeWidth={1.6} />
    <rect x={-10} y={-6} width={20} height={7} rx={3} fill={C.metal} stroke={INK} strokeWidth={2.5} />
  </g>
);

/** Screwdriver, origin at the grip; tip at (0, 96) pointing down the hand. */
export const Screwdriver: React.FC = () => (
  <g>
    <rect x={-13} y={-40} width={26} height={62} rx={10} fill={C.bookB} stroke={INK} strokeWidth={3.5} />
    <path d="M-6 -30 L-6 12 M6 -30 L6 12" stroke="#FFFFFF" strokeWidth={3} opacity={0.5} />
    <rect x={-4} y={22} width={8} height={68} fill={C.metal} stroke={INK} strokeWidth={2.5} />
    <path d="M-4 90 L0 98 L4 90 Z" fill={C.metal} stroke={INK} strokeWidth={2.5} />
  </g>
);

/** The flat-pack carton, origin at its base centre; `open` 0 … 1 folds the top flaps back. */
export const Carton: React.FC<{ w?: number; h?: number; open?: number; label?: 'shelf' | 'table' }> = ({ w = 420, h = 120, open = 0, label = 'shelf' }) => (
  <g>
    <ellipse cx={0} cy={2} rx={w * 0.55} ry={10} fill={INK} opacity={0.12} />
    <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill={C.box} stroke={INK} strokeWidth={5} />
    <rect x={w / 2 - 50} y={-h} width={50} height={h} fill={C.boxShade} opacity={0.6} />
    <g transform={`translate(${-w * 0.2} ${-h * 0.5})`}>
      <rect x={-46} y={-30} width={92} height={60} rx={6} fill={C.paper} stroke={INK} strokeWidth={3} />
      {label === 'shelf'
        ? <path d="M-24 22 L-24 -22 L24 -22 L24 22 M-24 0 L24 0" stroke={INK} strokeWidth={4} fill="none" />
        : <path d="M-28 -10 L28 -10 M-20 -10 L-24 22 M20 -10 L24 22" stroke={INK} strokeWidth={4} fill="none" />}
    </g>
    {open > 0 && <>
      <path d={`M${-w / 2} ${-h} L${-w / 2 - 70 * open} ${-h - 46 * open} L${-20 - 50 * open} ${-h - 46 * open} L0 ${-h}`} fill={C.boxShade} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M${w / 2} ${-h} L${w / 2 + 70 * open} ${-h - 46 * open} L${20 + 50 * open} ${-h - 46 * open} L0 ${-h}`} fill={C.boxShade} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    </>}
  </g>
);

/** The bookshelf. `built` 0 … 1 is how far it is (sides, then shelves, then back); `books` 0 … 1 fills it. Origin at its base centre. */
export const Shelf: React.FC<{ built: number; books?: number; w?: number; h?: number }> = ({ built, books = 0, w = 300, h = 620 }) => {
  const shelves = [0.25, 0.5, 0.75];
  const colors = [C.bookA, C.bookB, C.bookC, C.bookD];
  return (
    <g>
      <ellipse cx={0} cy={2} rx={w * 0.6} ry={10} fill={INK} opacity={0.12} />
      {built > 0.85 && <rect x={-w / 2 + 14} y={-h} width={w - 28} height={h} fill={C.panelShade} stroke={INK} strokeWidth={3} />}
      {built > 0 && <rect x={-w / 2} y={-h} width={22} height={h} fill={C.panel} stroke={INK} strokeWidth={4.5} />}
      {built > 0.15 && <rect x={w / 2 - 22} y={-h} width={22} height={h} fill={C.panel} stroke={INK} strokeWidth={4.5} />}
      {[0, ...shelves, 1].map((t, k) => built > 0.25 + k * 0.12 && <rect key={k} x={-w / 2} y={-h * t - (t === 1 ? 0 : 18)} width={w} height={18} fill={C.panel} stroke={INK} strokeWidth={4} />)}
      {books > 0 && shelves.map((t, row) => Array.from({ length: 6 }, (_, k) => {
        const i = row * 6 + k;
        if (i / 18 >= books) return null;
        const bh = 96 + ((i * 37) % 30);
        return <rect key={i} x={-w / 2 + 30 + k * 40} y={-h * t - 18 - bh} width={32} height={bh} rx={3} fill={colors[i % 4]} stroke={INK} strokeWidth={3} />;
      }))}
    </g>
  );
};

/** The coffee table of the second attempt, origin at its base centre; `built` 0 … 1. */
export const Table: React.FC<{ built: number; w?: number }> = ({ built, w = 380 }) => (
  <g>
    <ellipse cx={0} cy={2} rx={w * 0.55} ry={10} fill={INK} opacity={0.12} />
    {[-1, 1].map((sd) => built > (sd < 0 ? 0 : 0.3) && <rect key={sd} x={sd * (w / 2 - 40) - 8} y={-170} width={16} height={170} fill={C.metal} stroke={INK} strokeWidth={3.5} />)}
    {built > 0.6 && <rect x={-w / 2} y={-196} width={w} height={30} rx={8} fill={C.panel} stroke={INK} strokeWidth={4.5} />}
    {built > 0.9 && <g transform="translate(70 -196)"><rect x={-26} y={-44} width={52} height={44} rx={6} fill={C.paper} stroke={INK} strokeWidth={3.5} /><path d="M26 -34 Q44 -26 26 -12" stroke={INK} strokeWidth={3.5} fill="none" /></g>}
  </g>
);

/** Phone, origin at its centre, with a photo log: the shelf started at 4:00 and was done at 9:00. */
export const PhoneLog: React.FC<{ glow?: number; result?: number }> = ({ glow = 1, result = 0 }) => (
  <g>
    <rect x={-70} y={-130} width={140} height={260} rx={22} fill="#1B2433" stroke={INK} strokeWidth={5} />
    <rect x={-60} y={-112} width={120} height={224} rx={10} fill={C.screen} opacity={0.4 + 0.6 * glow} />
    {[['4:00', -78, 0.3], ['9:00', -10, 1]].map(([t, y, b]) => (
      <g key={t as string} transform={`translate(0 ${y as number})`}>
        <rect x={-50} y={-36} width={100} height={60} rx={6} fill={C.panelShade} stroke={INK} strokeWidth={2.5} />
        <g transform="translate(-18 18) scale(0.13)"><Shelf built={b as number} books={b === 1 ? 1 : 0} /></g>
        <text x={40} y={14} textAnchor="end" fontFamily={TITLE} fontWeight={800} fontSize={20} fill={INK}>{t}</text>
      </g>
    ))}
    {result > 0 && <g opacity={result}>
      <rect x={-56} y={30} width={112} height={40} rx={10} fill={C.clock} />
      <text x={0} y={58} textAnchor="middle" direction="rtl" fontFamily={BODY} fontWeight={700} fontSize={22} fill="#FFFFFF">5 ساعات</text>
    </g>}
  </g>
);

/** A small hardback for the finished shelf, held flat in a hand; origin at the grip. */
export const SmallBook: React.FC<{ color?: string }> = ({ color = C.bookA }) => (
  <g transform="translate(-14 -60)">
    <rect x={0} y={0} width={34} height={110} rx={4} fill={color} stroke={INK} strokeWidth={3.5} />
    <rect x={6} y={18} width={22} height={8} rx={3} fill="#FFFFFF" opacity={0.7} />
  </g>
);
