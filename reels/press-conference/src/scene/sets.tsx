import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CamKey, GsapCamera } from '@motion/index';
import { C, Defs, H, W } from './kit';
import { Bench, Clock, G, Mic, Podium, UnderBench, Wall } from './props';

/** A shot: the world under the GSAP camera, a soft vignette, screen-space layers (foreground blur, text) on top. */
export const Frame: React.FC<{ start: Omit<CamKey, 'at' | 'dur' | 'ease'>; moves?: CamKey[]; children: React.ReactNode; fg?: React.ReactNode; overlay?: React.ReactNode; bg?: string }> = ({ start, moves = [], children, fg, overlay, bg = C.pine }) => (
  <AbsoluteFill style={{ background: bg }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <Defs />
      <GsapCamera width={W} height={H} start={start} moves={moves}>{children}</GsapCamera>
    </svg>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 52%, rgba(0,0,0,0) 55%, rgba(2,10,8,0.55) 100%)' }} />
    {fg && <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}><Defs />{fg}</svg>}
    {overlay}
  </AbsoluteFill>
);

/** The workshop seen from the front. Layers in depth order; the robot and other actors go in `actors` (on the
 *  bench, behind the podium and in front of the bridge), `front` is drawn over the bench edge. */
export const FrontSet: React.FC<{ mins: number; podium?: React.ComponentProps<typeof Podium>; wallProps?: React.ReactNode; behind?: React.ReactNode; actors?: React.ReactNode; front?: React.ReactNode; lamp?: number }> = ({ mins, podium, wallProps, behind, actors, front, lamp = 1 }) => (
  <g>
    <Wall lamp={lamp} />
    <Clock x={930} y={960} mins={mins} />
    {wallProps}
    <UnderBench />
    <Bench />
    {behind}
    {actors}
    <Podium {...podium} />
    {front}
  </g>
);

export { G };

/* ───────────── the press room, seen from behind the podium ───────────── */

export const HORIZON = 820;
/** Row r (0 nearest) → scale and floor y; columns spread from the centre with perspective. */
export const seat = (r: number, c: number) => {
  const z = 1 + 0.62 * r;
  const k = 1 / z;
  return { x: 540 + c * 250 * k, y: HORIZON + 900 * k, k };
};

const Chair: React.FC<{ x: number; y: number; k: number; dim?: number }> = ({ x, y, k, dim = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${k})`} opacity={1 - dim}>
    <ellipse cx={0} cy={4} rx={80} ry={12} fill="url(#shade)" />
    <rect x={-58} y={-150} width={116} height={86} rx={14} fill="url(#porcV)" />
    <rect x={-50} y={-70} width={8} height={70} fill={C.graph2} />
    <rect x={42} y={-70} width={8} height={70} fill={C.graph2} />
    <rect x={-64} y={-76} width={128} height={22} rx={8} fill="url(#porc)" />
  </g>
);

/** A small loudspeaker on a seat; `away` turns its back to the podium; `rings` 0 … 1 shows sound. */
export const Speaker: React.FC<{ x: number; y: number; k: number; away?: boolean; rings?: number; t?: number }> = ({ x, y, k, away = false, rings = 0, t = 0 }) => (
  <g transform={`translate(${x} ${y - 76 * k}) scale(${k})`}>
    <rect x={-34} y={-92} width={68} height={92} rx={10} fill="url(#graph)" />
    {away ? (
      <g>
        <g opacity={0.6}>{[0, 1, 2, 3].map((i) => <rect key={i} x={-20} y={-76 + i * 14} width={40} height={5} rx={2.5} fill={C.graph3} />)}</g>
        <path d="M 30 -10 q 30 10 26 40" stroke="#15191C" strokeWidth={5} fill="none" />
        <circle cx={22} cy={-82} r={3.5} fill={C.porc3} opacity={0.5} />
      </g>
    ) : (
      <>
        <circle cx={0} cy={-56} r={22} fill="#15191C" /><circle cx={0} cy={-56} r={10} fill={C.graph3} />
        <circle cx={0} cy={-20} r={9} fill="#15191C" />
        {rings > 0 && [0, 1, 2].map((i) => {
          const p = ((t * 1.4 + i / 3) % 1);
          return <circle key={i} cx={0} cy={-56} r={30 + p * 70} fill="none" stroke={C.berry2} strokeWidth={5} opacity={rings * (1 - p) * 0.8} />;
        })}
      </>
    )}
  </g>
);

/** Rows of mostly empty seats; `occupied` = [row, col, away?]. Optional big shadow of one speaker on the back wall. */
export const RoomSet: React.FC<{ occupied: Array<[number, number, boolean]>; rings?: number; t: number; shadow?: { r: number; c: number; scale: number; op: number } }> = ({ occupied, rings = 0, t, shadow }) => {
  const rows = [5, 4, 3, 2, 1, 0];
  return (
    <g>
      <rect x={-900} y={-600} width={2900} height={HORIZON + 600} fill="url(#wall)" />
      <ellipse cx={540} cy={HORIZON - 120} rx={520} ry={260} fill="url(#pool)" />
      {/* a shut door far away */}
      <rect x={760} y={HORIZON - 250} width={120} height={250} rx={6} fill="#0C221D" />
      <circle cx={862} cy={HORIZON - 120} r={5} fill={C.graph3} />
      {shadow && (() => {
        const p = seat(shadow.r, shadow.c);
        return (
          <g opacity={shadow.op} transform={`translate(${p.x - 20} ${HORIZON - 20}) scale(${shadow.scale})`}>
            <rect x={-34} y={-92} width={68} height={92} rx={10} fill="#03100C" opacity={0.8} />
            <circle cx={0} cy={-56} r={22} fill="#0C211C" />
            <circle cx={0} cy={-20} r={9} fill="#0C211C" />
            {[0, 1].map((i) => <path key={i} d={`M ${40 + i * 18} -86 Q ${58 + i * 22} -56 ${40 + i * 18} -26`} stroke="#03100C" strokeWidth={6} fill="none" opacity={0.7} />)}
          </g>
        );
      })()}
      <path d={`M -900 ${HORIZON} L 1980 ${HORIZON} L 1980 2600 L -900 2600 Z`} fill="url(#benchFront)" />
      <path d={`M -900 ${HORIZON} L 1980 ${HORIZON} L 1980 ${HORIZON + 6} L -900 ${HORIZON + 6} Z`} fill="#2F4A45" opacity={0.6} />
      {rows.map((r) => (
        <g key={r}>
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((c) => {
            const p = seat(r, c);
            const who = occupied.find(([rr, cc]) => rr === r && cc === c);
            return (
              <g key={c}>
                <Chair x={p.x} y={p.y} k={p.k} />
                {who && <Speaker x={p.x} y={p.y} k={p.k} away={who[2]} rings={who[2] ? 0 : rings} t={t} />}
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
};

/** The podium from behind (dark), with the microphones' backs. In screen space for the reverse shots. */
export const PodiumBack: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-78, -52, -26, 0, 26, 52, 78].map((dx, i) => (
      <g key={i} transform={`translate(${dx} ${-24 - (i % 2) * 14}) rotate(${dx * 0.22})`}>
        <rect x={-3} y={0} width={6} height={40} fill="#15191C" />
        <ellipse cx={0} cy={-10} rx={15} ry={20} fill="#1A1E22" />
      </g>
    ))}
    <rect x={-122} y={-18} width={244} height={18} rx={6} fill="#3B4744" />
    <path d="M -110 0 L 110 0 L 92 210 L -92 210 Z" fill="#3A1F2D" />
    <rect x={-80} y={30} width={160} height={8} rx={4} fill="#4A2A3A" />
  </g>
);

/* ───────────── the bench from above ───────────── */

/** Top-down: bench halves, the gap, the bridge; `piece` 0 (lifted, offset) … 1 (seated); `lock` flashes the joints. */
export const OverheadSet: React.FC<{ piece: number; lock: number }> = ({ piece, lock }) => {
  const y0 = 860, y1 = 1060;
  const deck = (x0: number, x1: number, f = 'url(#teal)') => (
    <g>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={6} fill={f} />
      {Array.from({ length: Math.round((x1 - x0) / 24) }, (_, i) => <rect key={i} x={x0 + 8 + i * 24} y={y0 + 10} width={8} height={y1 - y0 - 20} rx={3} fill={C.teal3} opacity={0.7} />)}
      <rect x={x0} y={y0} width={x1 - x0} height={12} rx={4} fill={C.teal2} />
      <rect x={x0} y={y1 - 12} width={x1 - x0} height={12} rx={4} fill={C.teal3} />
    </g>
  );
  const lift = (1 - piece);
  return (
    <g>
      <rect x={-900} y={-600} width={2900} height={2900} fill={C.night} />
      <rect x={-900} y={560} width={1500} height={800} fill="url(#benchTop)" />
      <rect x={880} y={560} width={1500} height={800} fill="url(#benchTop)" />
      <rect x={600} y={560} width={280} height={800} fill="url(#abyss)" />
      {/* tool marks and a few parts on the bench */}
      <circle cx={420} cy={1180} r={16} fill={C.graph2} /><rect x={300} y={700} width={70} height={14} rx={7} fill={C.graph3} />
      {deck(560, 695)}
      {deck(785, 920)}
      <g transform={`translate(${740 + lift * 60} ${960 - lift * 40}) scale(${1 + lift * 0.18}) rotate(${lift * 14}) translate(-740 -960)`}>
        <ellipse cx={740} cy={960 + 30 + lift * 60} rx={60} ry={110} fill="url(#shade)" opacity={0.6 * lift} />
        {deck(695, 785, 'url(#teal)')}
      </g>
      {[695, 785].map((x) => [y0 + 22, y1 - 22].map((y) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={9} fill={C.graph} />
          <circle cx={x} cy={y} r={14 + 26 * lock} fill="none" stroke="#BFEDE6" strokeWidth={5} opacity={lock > 0 && lock < 1 ? 1 - lock : 0} />
        </g>
      )))}
    </g>
  );
};

/** The robot from directly above (head, shoulders, arms to two targets). */
export const RobotTop: React.FC<{ x: number; y: number; s?: number; l: [number, number]; r: [number, number] }> = ({ x, y, s = 1, l, r }) => (
  <g>
    {[l, r].map((h, i) => {
      const sx = x + (i ? 1 : -1) * 0 * s, sy = y + (i ? 1 : -1) * 58 * s;
      return (
        <g key={i}>
          <line x1={sx} y1={sy} x2={h[0]} y2={h[1]} stroke="#1E2327" strokeWidth={22 * s} strokeLinecap="round" />
          <circle cx={h[0]} cy={h[1]} r={16 * s} fill="url(#graph)" />
          <circle cx={sx} cy={sy} r={24 * s} fill="url(#porc)" />
        </g>
      );
    })}
    <ellipse cx={x - 10 * s} cy={y} rx={70 * s} ry={86 * s} fill="url(#porc)" />
    <rect x={x + 30 * s} y={y - 50 * s} width={24 * s} height={100 * s} rx={10 * s} fill="url(#graph)" />
    <circle cx={x - 10 * s} cy={y - 4 * s} r={9 * s} fill="url(#teal)" />
  </g>
);

/** Screen-space foreground: an out-of-focus press microphone at the lower edge (depth, and the press never far). */
export const FgMic: React.FC<{ x?: number; y?: number; s?: number; aim?: number; op?: number }> = ({ x = 150, y = 1790, s = 5.2, aim = 18, op = 1 }) => (
  <g style={{ filter: 'blur(9px)' }} opacity={op}>
    <Mic x={x} y={y} s={s} aim={aim} stand={120} />
  </g>
);
