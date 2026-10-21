import React from 'react';
import { BODY, TITLE } from './fonts';
import { run1, run2, runPath } from './plot';
import { C } from './theme';

// ——— the lab, one world for every lab shot (feet on y = 0, x grows to the right) ———
// door · window · desk with the teleprinter · the computer cabinet, the clock above it
export const LAB = {
  door: { x0: -780, x1: -500, top: -800 },
  window: { x0: -380, x1: -80, y0: -1170, y1: -790 },
  desk: { x0: 150, x1: 600, top: -300 },
  tp: { x0: 190, x1: 440, top: -480 },
  key: [330, -318] as [number, number],
  button: [480, -322] as [number, number],
  cabinet: { x0: 650, x1: 1040, top: -780 },
  clock: { x: -640, y: -1010, r: 84 },
};
export const STROKE = 4.5;
const ink = { stroke: C.ink, strokeWidth: STROKE, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export type LabState = {
  f: number; clockMin: number; light?: number; door?: number; lamps?: number; press?: number; rows?: number;
  cloudShift?: number; butterflyOutside?: React.ReactNode;
};

export const Lab: React.FC<LabState> = ({ f, clockMin, light = 0, lamps = 0, press = 0, rows = 6, cloudShift = 0, butterflyOutside }) => {
  const { window: wi, desk: de, cabinet: ca, clock: ck } = LAB;
  const sky = light; // 0 = day sky, 1 = late (blue hour) — the hour away shows in the window
  return (
    <g>
      {/* wall and floor */}
      <rect x={-2200} y={-2600} width={4400} height={2600} fill={C.wall} />
      <rect x={-2200} y={-120} width={4400} height={120} fill={C.wallDeep} />
      <path d="M-2200 -120 L2200 -120" stroke={C.wallLine} strokeWidth={4} />
      <rect x={-2200} y={0} width={4400} height={1400} fill={C.floor} />
      {[180, 420, 760].map((y) => <path key={y} d={`M-2200 ${y} L2200 ${y}`} stroke={C.floorLine} strokeWidth={4} opacity={0.6} />)}
      <path d="M-2200 0 L2200 0" {...ink} />
      {/* window */}
      <clipPath id="glass"><rect x={wi.x0} y={wi.y0} width={wi.x1 - wi.x0} height={wi.y1 - wi.y0} /></clipPath>
      <g>
        <g clipPath="url(#glass)">
        <rect x={wi.x0} y={wi.y0} width={wi.x1 - wi.x0} height={wi.y1 - wi.y0} fill={mixHex(C.sky, C.night, sky * 0.55)} />
        {[0, 1, 2].map((k) => {
          const cx = wi.x0 + ((k * 170 + cloudShift + 60) % (wi.x1 - wi.x0 + 200)) - 60;
          return <g key={k} transform={`translate(${cx} ${wi.y0 + 90 + k * 95})`} opacity={0.95}>
            <path d="M-60 0 C-62 -26 -30 -36 -14 -22 C-6 -44 34 -42 38 -18 C60 -20 66 6 46 10 L-50 10 C-66 10 -70 2 -60 0 Z" fill={C.cloud} />
          </g>;
        })}
        {butterflyOutside}
        </g>
        <rect x={wi.x0} y={wi.y0} width={wi.x1 - wi.x0} height={wi.y1 - wi.y0} fill="none" {...ink} strokeWidth={8} />
        <path d={`M${(wi.x0 + wi.x1) / 2} ${wi.y0} L${(wi.x0 + wi.x1) / 2} ${wi.y1} M${wi.x0} ${(wi.y0 + wi.y1) / 2} L${wi.x1} ${(wi.y0 + wi.y1) / 2}`} {...ink} strokeWidth={6} />
        <rect x={wi.x0 - 24} y={wi.y1} width={wi.x1 - wi.x0 + 48} height={22} rx={6} fill={C.metalLight} {...ink} />
      </g>
      {/* doorway (the leaf is DoorLeaf, drawn after the actor so it can close over him) */}
      <rect x={LAB.door.x0 - 16} y={LAB.door.top - 16} width={LAB.door.x1 - LAB.door.x0 + 32} height={-LAB.door.top + 16} fill={C.doorDeep} {...ink} />
      <rect x={LAB.door.x0} y={LAB.door.top} width={LAB.door.x1 - LAB.door.x0} height={-LAB.door.top} fill="#2C3D3B" />
      {/* clock */}
      <Clock x={ck.x} y={ck.y} r={ck.r} min={clockMin} />
      {/* the computer: a metal cabinet with a panel of lamps */}
      <g>
        <rect x={ca.x0} y={ca.top} width={ca.x1 - ca.x0} height={-ca.top} rx={14} fill={C.metal} {...ink} />
        <rect x={ca.x0 + 30} y={ca.top + 40} width={ca.x1 - ca.x0 - 60} height={170} rx={10} fill={C.panel} {...ink} strokeWidth={3.5} />
        {Array.from({ length: 18 }, (_, k) => {
          const col = k % 6, row = Math.floor(k / 6);
          const on = lamps > 0 && ((k * 7 + Math.floor(f / 9) * (k % 4 + 1)) % 5 < 2 + lamps);
          return <circle key={k} cx={ca.x0 + 80 + col * 48} cy={ca.top + 85 + row * 42} r={12} fill={on ? C.lampOn : C.lampOff} stroke={C.ink} strokeWidth={2.5} />;
        })}
        {[0, 1, 2].map((k) => <rect key={k} x={ca.x0 + 40} y={ca.top + 260 + k * 150} width={ca.x1 - ca.x0 - 80} height={110} rx={8} fill={C.metalLight} stroke={C.metalDeep} strokeWidth={4} />)}
        {[0, 1, 2].map((k) => <path key={k} d={`M${ca.x0 + 80} ${ca.top + 300 + k * 150} L${ca.x1 - 80} ${ca.top + 300 + k * 150} M${ca.x0 + 80} ${ca.top + 330 + k * 150} L${ca.x1 - 80} ${ca.top + 330 + k * 150}`} stroke={C.metalDeep} strokeWidth={5} strokeLinecap="round" />)}
      </g>
      {/* desk */}
      <g>
        <rect x={de.x0} y={de.top} width={de.x1 - de.x0} height={34} rx={6} fill={C.metalLight} {...ink} />
        <rect x={de.x0 + 24} y={de.top + 34} width={22} height={-de.top - 34} fill={C.metalDeep} {...ink} strokeWidth={3.5} />
        <rect x={de.x1 - 46} y={de.top + 34} width={22} height={-de.top - 34} fill={C.metalDeep} {...ink} strokeWidth={3.5} />
      </g>
      {/* the teleprinter that prints the computer's numbers, with its paper rising out of the top */}
      <Teleprinter f={f} rows={rows} />
      {/* start switch on the desk's right end */}
      <g transform={`translate(${LAB.button[0]} ${LAB.button[1]})`}>
        <rect x={-34} y={-6} width={68} height={28} rx={6} fill={C.panel} {...ink} strokeWidth={3.5} />
        <circle cx={0} cy={-6 + press * 6} r={20} fill={press > 0.5 ? C.lampOn : C.run2} {...ink} strokeWidth={3.5} />
      </g>
    </g>
  );
};

/** The door leaf, hinged on the doorway's left edge; `open` 0 … 1 (its face narrows as it turns toward the room). */
export const DoorLeaf: React.FC<{ open: number }> = ({ open }) => (
  <g transform={`translate(${LAB.door.x0} 0) scale(${1 - open * 0.82} 1)`}>
    <rect x={0} y={LAB.door.top} width={LAB.door.x1 - LAB.door.x0} height={-LAB.door.top} fill={C.door} {...ink} />
    <rect x={40} y={LAB.door.top + 60} width={200} height={260} rx={10} fill="none" stroke={C.doorDeep} strokeWidth={5} />
    <rect x={40} y={LAB.door.top + 400} width={200} height={300} rx={10} fill="none" stroke={C.doorDeep} strokeWidth={5} />
    <circle cx={LAB.door.x1 - LAB.door.x0 - 34} cy={-400} r={13} fill={C.metalLight} {...ink} strokeWidth={3.5} />
  </g>
);

// ——— the hall of the 1972 talk (and of the explanation): a wall with a big board; Lorenz stands to its right ———
export const BOARD = { x0: -150, x1: 610, y0: -1080, y1: -440 };
export const Hall: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <g>
    <rect x={-2200} y={-2600} width={4400} height={2600} fill={C.wall} />
    <rect x={-2200} y={-120} width={4400} height={120} fill={C.wallDeep} />
    <path d="M-2200 -120 L2200 -120" stroke={C.wallLine} strokeWidth={4} />
    <rect x={-2200} y={0} width={4400} height={1400} fill={C.floor} />
    <path d="M-2200 0 L2200 0" {...ink} />
    <rect x={BOARD.x0 - 24} y={BOARD.y0 - 24} width={BOARD.x1 - BOARD.x0 + 48} height={BOARD.y1 - BOARD.y0 + 48} rx={12} fill={C.boardEdge} {...ink} />
    <rect x={BOARD.x0} y={BOARD.y0} width={BOARD.x1 - BOARD.x0} height={BOARD.y1 - BOARD.y0} fill={C.board} {...ink} strokeWidth={3} />
    <rect x={BOARD.x0 + 50} y={BOARD.y1 + 12} width={BOARD.x1 - BOARD.x0 - 100} height={18} rx={5} fill={C.metal} {...ink} strokeWidth={3} />
    {children}
  </g>
);

export const Teleprinter: React.FC<{ f: number; rows: number }> = ({ rows }) => {
  const { tp } = LAB;
  const paperTop = tp.top - 60 - Math.min(rows, 16) * 14;
  return (
    <g>
      {/* paper: a strip out of the platen; printed rows are short dashes */}
      <path d={`M${tp.x0 + 50} ${tp.top + 10} L${tp.x0 + 50} ${paperTop} Q${tp.x0 + 60} ${paperTop - 40} ${tp.x0 + 130} ${paperTop - 30} L${tp.x1 - 50} ${paperTop - 30} L${tp.x1 - 50} ${tp.top + 10} Z`} fill={C.paper} {...ink} strokeWidth={3.5} />
      {Array.from({ length: Math.min(rows, 16) }, (_, k) => (
        <path key={k} d={`M${tp.x1 - 80} ${tp.top - 10 - k * 14} L${tp.x0 + 80 + ((k * 37) % 60)} ${tp.top - 10 - k * 14}`} stroke={C.mist} strokeWidth={4} strokeDasharray="14 8" opacity={0.75} />
      ))}
      {/* body */}
      <path d={`M${tp.x0} ${LAB.desk.top} L${tp.x0 + 20} ${tp.top} L${tp.x1 - 20} ${tp.top} L${tp.x1} ${LAB.desk.top} Z`} fill={C.metal} {...ink} />
      <rect x={tp.x0 + 30} y={tp.top - 16} width={tp.x1 - tp.x0 - 60} height={24} rx={12} fill={C.panel} {...ink} strokeWidth={3.5} />
      {/* keyboard */}
      <path d={`M${tp.x0 + 30} ${LAB.desk.top} L${tp.x0 + 50} ${LAB.desk.top - 46} L${tp.x1 - 50} ${LAB.desk.top - 46} L${tp.x1 - 30} ${LAB.desk.top} Z`} fill={C.metalLight} {...ink} strokeWidth={3.5} />
      {Array.from({ length: 3 }, (_, r) => Array.from({ length: 8 }, (_, k) => (
        <rect key={`${r}-${k}`} x={tp.x0 + 64 + k * 22 + r * 6} y={LAB.desk.top - 40 + r * 13} width={14} height={9} rx={2} fill={C.panel} />
      )))}
    </g>
  );
};

export const Clock: React.FC<{ x: number; y: number; r: number; min: number }> = ({ x, y, r, min }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r + 10} fill={C.teal} {...ink} />
    <circle r={r} fill={C.paper} {...ink} strokeWidth={3} />
    {Array.from({ length: 12 }, (_, k) => {
      const a = (k * Math.PI) / 6;
      return <path key={k} d={`M${Math.sin(a) * r * 0.8} ${-Math.cos(a) * r * 0.8} L${Math.sin(a) * r * 0.92} ${-Math.cos(a) * r * 0.92}`} stroke={C.ink} strokeWidth={k % 3 ? 3 : 6} strokeLinecap="round" />;
    })}
    <path d={`M0 0 L0 ${-r * 0.5}`} stroke={C.ink} strokeWidth={9} strokeLinecap="round" transform={`rotate(${((min / 60) % 12) * 30})`} />
    <path d={`M0 0 L0 ${-r * 0.76}`} stroke={C.tealDeep} strokeWidth={6} strokeLinecap="round" transform={`rotate(${(min % 60) * 6})`} />
    <circle r={8} fill={C.ink} />
  </g>
);

/** A mug, origin at the bottom centre; the handle on the +x side. */
export const Mug: React.FC<{ steam?: number; f?: number; level?: number }> = ({ steam = 0, f = 0, level = 1 }) => (
  <g>
    {steam > 0 && [0, 1].map((k) => (
      <path key={k} d={`M${-8 + k * 16} -78 C${-20 + k * 16} -96 ${4 + k * 16} -104 ${-8 + k * 16} -124`} fill="none" stroke={C.paper} strokeWidth={5} strokeLinecap="round"
        opacity={steam * (0.5 + 0.4 * Math.sin(f / 9 + k * 2))} transform={`translate(0 ${-((f / 3 + k * 9) % 16)})`} />
    ))}
    <path d="M28 -54 C52 -54 52 -22 28 -22" fill="none" stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
    <path d="M28 -54 C52 -54 52 -22 28 -22" fill="none" stroke={C.mug} strokeWidth={6} strokeLinecap="round" />
    <path d="M-30 -70 L30 -70 L27 -4 C27 0 24 2 20 2 L-20 2 C-24 2 -27 0 -27 -4 Z" fill={C.mug} {...ink} />
    <ellipse cx={0} cy={-70} rx={30} ry={7} fill={level > 0 ? C.coffee : C.mugDeep} {...ink} strokeWidth={3} />
    <path d="M-18 -56 L-18 -14" stroke={C.mugDeep} strokeWidth={6} strokeLinecap="round" />
  </g>
);

/** The butterfly, origin at its body; `flap` 0 open … 1 closed (wings edge-on). Chalk draws it in outline only. */
export const Butterfly: React.FC<{ flap: number; s?: number; chalk?: boolean; color?: number; draw?: number }> = ({ flap, s = 1, chalk = false, color = 1, draw = 1 }) => {
  const k = Math.max(0.35, Math.cos((flap * Math.PI) / 2));
  const fill = chalk ? 'none' : mixHex(C.board, C.fly, color);
  const spot = chalk ? 'none' : mixHex(C.board, C.flySpot, color);
  const line = chalk ? { stroke: C.chalk, strokeWidth: 4.5, pathLength: 1, strokeDasharray: `${draw} 1` } : { stroke: C.ink, strokeWidth: 3.5 };
  const wing = (side: 1 | -1) => (
    <g transform={`scale(${side * k} 1)`}>
      <path d="M2 -6 C20 -58 78 -66 84 -36 C88 -12 54 4 4 2 Z" fill={fill} {...line} strokeLinejoin="round" />
      <path d="M3 4 C42 6 70 22 62 46 C54 66 22 54 2 12 Z" fill={fill} {...line} strokeLinejoin="round" />
      {!chalk && <><circle cx={56} cy={-34} r={9} fill={spot} /><circle cx={38} cy={30} r={7} fill={spot} /></>}
    </g>
  );
  return (
    <g transform={`scale(${s})`}>
      {wing(-1)}{wing(1)}
      <path d="M0 -24 L0 40" stroke={chalk ? C.chalk : C.ink} strokeWidth={chalk ? 6 : 9} strokeLinecap="round" />
      <path d="M-2 -24 C-8 -44 -16 -52 -24 -54 M2 -24 C8 -44 16 -52 24 -54" fill="none" stroke={chalk ? C.chalk : C.ink} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

/** Flap phase for a butterfly in flight: wings beat ~6 times a second. */
export const flapAt = (f: number, fps = 60, rate = 6) => (1 - Math.cos((f / fps) * rate * Math.PI * 2)) / 2;

// ——— the printout, close up (its own world: a sheet 900 × 1200 centred on 0,0) ———
export const SHEET = { w: 920, h: 1240 };
const PLOT = { x0: -380, x1: 380, y: -40, amp: 210 };

/** The plotted runs. `a`/`b` = how far each run has been drawn (0 … 1 of the sheet), right to left. */
export const PlotSheet: React.FC<{ a: number; b: number; ring?: number; legend?: number; label?: string; labelO?: number }> = ({ a, b, ring = 0, legend = 0, label, labelO = 0 }) => {
  const head2: [number, number] = [PLOT.x1 - b * (PLOT.x1 - PLOT.x0), PLOT.y - run2(b) * PLOT.amp];
  const ringT = 0.42; // where the eye first sees them part
  return (
    <g>
      <rect x={-SHEET.w / 2 + 16} y={-SHEET.h / 2 + 22} width={SHEET.w} height={SHEET.h} rx={10} fill="#C9D9D5" />
      <rect x={-SHEET.w / 2} y={-SHEET.h / 2} width={SHEET.w} height={SHEET.h} rx={10} fill={C.paper} {...ink} />
      {Array.from({ length: 17 }, (_, k) => <path key={`v${k}`} d={`M${-400 + k * 50} -520 L${-400 + k * 50} 440`} stroke={C.grid} strokeWidth={2} />)}
      {Array.from({ length: 20 }, (_, k) => <path key={`h${k}`} d={`M-400 ${-520 + k * 50} L400 ${-520 + k * 50}`} stroke={C.grid} strokeWidth={2} />)}
      <path d={`M${PLOT.x0} ${PLOT.y} L${PLOT.x1} ${PLOT.y}`} stroke={C.gridDeep} strokeWidth={3} />
      <path d={runPath(run1, 0, a, PLOT)} fill="none" stroke={C.run1} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d={runPath(run2, 0, b, PLOT)} fill="none" stroke={C.run2} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
      {b > 0 && b < 1 && <circle cx={head2[0]} cy={head2[1]} r={11} fill={C.run2} {...ink} strokeWidth={3} />}
      {ring > 0 && <circle cx={PLOT.x1 - ringT * (PLOT.x1 - PLOT.x0)} cy={PLOT.y - run1(ringT) * PLOT.amp} r={60 + 30 * (1 - ring)} fill="none" stroke={C.run2} strokeWidth={6} opacity={ring} />}
      {legend > 0 && <g opacity={legend} transform={`translate(0 ${30 * (1 - legend)})`}>
        <foreignObject x={-150} y={-520} width={560} height={90}>
          <div dir="rtl" lang="ar" style={{ display: 'flex', gap: 22, justifyContent: 'center', fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.ink }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><i style={{ width: 46, height: 10, borderRadius: 5, background: C.run1, display: 'inline-block' }} />الحسبة الأولى</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><i style={{ width: 46, height: 10, borderRadius: 5, background: C.run2, display: 'inline-block' }} />الإعادة</span>
          </div>
        </foreignObject>
      </g>}
      {label && labelO > 0 && <foreignObject x={-440} y={-572} width={880} height={110} opacity={labelO}>
        <div dir="rtl" lang="ar" style={{ textAlign: 'center', fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.mist }}>{label}</div>
      </foreignObject>}
    </g>
  );
};

/** Two readouts: what the machine holds and what the sheet shows. `drop` 0 … 1 lifts the hidden digits off; `ghost` brings them back as a glow. */
export const Numbers: React.FC<{ o: number; drop: number; ghost?: number; f: number }> = ({ o, drop, ghost = 0, f }) => {
  const digit = (s: string, extra: React.CSSProperties = {}) => <span style={{ fontFamily: TITLE, fontWeight: 800, ...extra }}>{s}</span>;
  return (
    <g opacity={o}>
      <rect x={-400} y={-520} width={800} height={300} rx={26} fill={C.panel} {...ink} />
      <foreignObject x={-400} y={-520} width={800} height={300}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div dir="rtl" lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.chalkDim }}>في ذاكرة الجهاز</div>
          <div dir="ltr" style={{ fontSize: 132, color: C.lampOn, letterSpacing: 2, lineHeight: 1.1 }}>
            {digit('0.506')}{digit('127', { color: C.lampOn })}
          </div>
        </div>
      </foreignObject>
      <rect x={-400} y={-120} width={800} height={340} rx={16} fill={C.paper} {...ink} />
      {[0, 1, 2].map((k) => <path key={k} d={`M-340 ${-60 + k * 110} L340 ${-60 + k * 110}`} stroke={C.grid} strokeWidth={3} />)}
      <foreignObject x={-400} y={-120} width={800} height={340}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <div dir="rtl" lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.mist }}>على الورقة</div>
          <div dir="ltr" style={{ fontSize: 132, color: C.ink, letterSpacing: 2, lineHeight: 1.1, position: 'relative' }}>
            {digit('0.506')}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              {digit('127', {
                color: ghost > 0 ? C.run2 : C.ink,
                opacity: ghost > 0 ? ghost * (0.75 + 0.25 * Math.sin(f / 7)) : 1 - drop,
                transform: ghost > 0 ? 'none' : `translateY(${-drop * 90}px) rotate(${-drop * 14}deg)`,
                display: 'inline-block',
                WebkitTextStroke: ghost > 0 ? `3px ${C.run2}` : undefined,
                ...(ghost > 0 ? { color: 'transparent' } : {}),
              })}
            </span>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};

// ——— chalk ———
/** A chalk stroke drawn up to `p` (0 … 1) along its own length. */
export const Chalk: React.FC<{ d: string; p?: number; w?: number; color?: string; o?: number }> = ({ d, p = 1, w = 6, color = C.chalk, o = 1 }) =>
  p <= 0 ? null : <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} opacity={o} />;

export const ChalkText: React.FC<{ x: number; y: number; w: number; size: number; text: string; o: number; color?: string; align?: 'center' | 'right' | 'left'; ltr?: boolean }> = ({ x, y, w, size, text, o, color = C.chalk, align = 'center', ltr = false }) =>
  o <= 0 ? null : <foreignObject x={x} y={y} width={w} height={size * 1.7} opacity={o}>
    <div dir={ltr ? 'ltr' : 'rtl'} lang="ar" style={{ textAlign: align, fontFamily: TITLE, fontWeight: 700, fontSize: size, color, lineHeight: 1.4, whiteSpace: 'nowrap' }}>{text}</div>
  </foreignObject>;

/** The Americas in chalk (north up), in a 420 × 540 box; Brazil and Texas are marked by the scene. */
export const AMERICAS = {
  north: 'M40 70 C70 40 120 28 180 34 C230 40 262 60 300 58 C330 70 336 94 306 118 C290 136 270 152 252 170 C240 190 236 206 228 220 C238 232 242 246 236 252 C222 246 214 232 204 222 C190 220 176 232 166 248 C160 262 168 278 182 292 C190 300 196 308 196 316 C182 312 164 300 148 284 C128 262 110 236 96 208 C82 180 68 150 56 122 C46 100 36 86 40 70 Z',
  south: 'M206 322 C236 320 270 330 298 348 C324 366 328 392 312 418 C296 446 276 474 262 500 C254 516 246 530 240 534 C232 520 226 496 220 470 C214 440 206 410 198 382 C192 360 190 336 206 322 Z',
  texas: [168, 214] as [number, number],
  brazil: [272, 392] as [number, number],
};

/** A funnel of stacked rings: the storm that might be. */
export const Tornado: React.FC<{ f: number; o: number; s?: number; chalk?: boolean }> = ({ f, o, s = 1, chalk = true }) => (
  <g opacity={o} transform={`scale(${s})`}>
    {Array.from({ length: 7 }, (_, k) => {
      const y = -k * 20, rx = 14 + k * 9, wob = Math.sin(f / 6 + k) * (3 + k * 1.2);
      return <ellipse key={k} cx={wob} cy={y} rx={rx} ry={5 + k} fill="none" stroke={chalk ? C.chalk : C.stormDeep} strokeWidth={4} />;
    })}
  </g>
);

export const Sun: React.FC<{ o: number; s?: number; f: number }> = ({ o, s = 1, f }) => (
  <g opacity={o} transform={`scale(${s}) rotate(${(f / 4) % 360})`}>
    <circle r={26} fill="none" stroke={C.chalk} strokeWidth={5} />
    {Array.from({ length: 8 }, (_, k) => <path key={k} d="M0 -38 L0 -52" stroke={C.chalk} strokeWidth={5} strokeLinecap="round" transform={`rotate(${k * 45})`} />)}
  </g>
);

export const Cloud: React.FC<{ s?: number; rain?: boolean; draw?: number }> = ({ s = 1, rain = false, draw = 1 }) => (
  <g transform={`scale(${s})`} fill="none" stroke={C.chalk} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M-34 10 C-46 10 -50 -8 -36 -12 C-34 -30 -12 -34 -4 -20 C4 -36 30 -32 30 -12 C44 -12 46 10 32 10 Z" pathLength={1} strokeDasharray={`${draw} 1`} />
    {rain && draw >= 1 && <path d="M-20 22 L-24 34 M0 22 L-4 34 M20 22 L16 34" />}
  </g>
);

export function mixHex(a: string, b: string, p: number) {
  const h = (c: string) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
  const [x, y] = [h(a), h(b)];
  return '#' + x.map((v, k) => Math.round(v + (y[k] - v) * Math.max(0, Math.min(1, p))).toString(16).padStart(2, '0')).join('');
}
