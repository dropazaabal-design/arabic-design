import React from 'react';
import { C, FONT, Shadow, V } from './kit';

/** The front set's geometry (world px at zoom 1). The bench is cut by a gap; the bridge spans it. */
export const G = {
  topBack: 1178, top: 1236, bottom: 1332,      // bench: back edge, front edge, bottom of the front face
  floor: 1214,                                  // where feet stand on the bench
  gap0: 600, gap1: 880,                         // the gap
  deck: 1192,                                   // top of the bridge's top chord
  seg: 95,                                      // one truss segment
  podium: 170,                                  // podium centre
  work: 572,                                    // where the robot crouches to work on the bridge
  rs: 0.68,                                     // the robot's scale in the front set
};
export const PIN: V = [G.gap0 + G.seg, G.deck + 8];             // the joint the loose piece hangs from
export const PIN2: V = [G.gap1 - G.seg, G.deck + 8];            // the far joint

/** One truss segment, origin at its top-left; `bend` kinks it at mid-span (degrees, for the failed connector). */
export const Truss: React.FC<{ w?: number; h?: number; tone?: 'teal' | 'porc'; bend?: number }> = ({ w = G.seg, h = 44, tone = 'teal', bend = 0 }) => {
  const f = tone === 'teal' ? 'url(#teal)' : 'url(#porc)';
  const half = (x0: number, x1: number) => (
    <>
      <rect x={x0} y={0} width={x1 - x0} height={10} rx={3} fill={f} />
      <rect x={x0} y={h - 9} width={x1 - x0} height={9} rx={3} fill={f} />
    </>
  );
  return (
    <g>
      {bend ? (
        <>
          {half(0, w / 2 + 2)}
          <g transform={`rotate(${bend} ${w / 2} ${h / 2})`}>{half(w / 2 - 2, w)}</g>
        </>
      ) : half(0, w)}
      <path d={`M 4 ${h - 6} L ${w / 2} 6 L ${w - 4} ${h - 6}`} stroke={tone === 'teal' ? C.teal3 : C.porc3} strokeWidth={7} fill="none" strokeLinejoin="round" />
      <rect x={0} y={0} width={8} height={h} rx={3} fill={f} />
      <rect x={w - 8} y={0} width={8} height={h} rx={3} fill={f} />
      {[[4, 5], [w - 4, 5], [4, h - 5], [w - 4, h - 5], [w / 2, 6]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.6} fill={C.graph} />)}
    </g>
  );
};

/** Where the loose piece is: 'hung' from PIN at an angle (crooked), or placed by its left end at a point. */
export type PieceState = { at: V; rot: number; bend?: number; op?: number };
export const Piece: React.FC<PieceState> = ({ at, rot, bend = 0, op = 1 }) => (
  <g transform={`translate(${at[0]} ${at[1]}) rotate(${rot})`} opacity={op}>
    <g transform="translate(0 -8)"><Truss bend={bend} /></g>
  </g>
);

/** The bench halves, the gap, the two fixed halves of the bridge. */
export const Bench: React.FC = () => {
  const half = (x0: number, x1: number) => (
    <g>
      <rect x={x0} y={G.topBack} width={x1 - x0} height={G.top - G.topBack} fill="url(#benchTop)" />
      <rect x={x0} y={G.top} width={x1 - x0} height={G.bottom - G.top} fill="url(#benchFront)" />
      <rect x={x0} y={G.top - 2} width={x1 - x0} height={5} fill="#5B7A73" opacity={0.55} />
    </g>
  );
  return (
    <g>
      {/* the gap: depth into darkness */}
      <rect x={G.gap0} y={G.topBack - 4} width={G.gap1 - G.gap0} height={900} fill="url(#abyss)" />
      {half(-900, G.gap0)}
      {half(G.gap1, 2000)}
      {/* end grain at the gap edges */}
      <rect x={G.gap0 - 14} y={G.topBack} width={14} height={G.bottom - G.topBack} fill="#1A2826" />
      <rect x={G.gap1} y={G.topBack} width={14} height={G.bottom - G.topBack} fill="#2F4A45" />
      {/* the fixed halves of the bridge, anchored by plates */}
      <rect x={G.gap0 - 60} y={G.deck + 30} width={64} height={14} rx={4} fill="url(#graph)" />
      <rect x={G.gap1 - 4} y={G.deck + 30} width={64} height={14} rx={4} fill="url(#graph)" />
      <g transform={`translate(${G.gap0} ${G.deck})`}><Truss /></g>
      <g transform={`translate(${G.gap1 - G.seg} ${G.deck})`}><Truss /></g>
    </g>
  );
};

/** Under the bench: legs, a crate, deep shadow. */
export const UnderBench: React.FC = () => (
  <g>
    <rect x={-900} y={G.bottom} width={2900} height={900} fill={C.night} />
    {[-300, 120, 520, 950, 1350].map((x) => <rect key={x} x={x} y={G.bottom} width={34} height={700} fill="#0E1E1B" />)}
    <rect x={260} y={1520} width={190} height={130} rx={8} fill="#13302A" />
    <rect x={272} y={1532} width={166} height={18} rx={4} fill={C.teal3} opacity={0.5} />
    <ellipse cx={540} cy={G.bottom + 6} rx={900} ry={40} fill="url(#shade)" />
  </g>
);

/** The workshop wall: pegboard, a shelf, hanging tools, a lamp. */
export const Wall: React.FC<{ lamp?: number }> = ({ lamp = 1 }) => (
  <g>
    <rect x={-900} y={-600} width={2900} height={G.topBack + 600} fill="url(#wall)" />
    <rect x={-900} y={760} width={2900} height={G.topBack - 760} fill="url(#peg)" opacity={0.9} />
    {/* hanging tool silhouettes on the pegboard */}
    <g fill="#0B201B" opacity={0.95}>
      <rect x={-210} y={830} width={16} height={120} rx={8} />
      <circle cx={-202} cy={830} r={20} />
      <rect x={980} y={820} width={14} height={110} rx={7} />
      <rect x={1010} y={820} width={14} height={96} rx={7} />
      <path d="M 360 800 l 24 0 l 0 110 l -12 16 l -12 -16 z" />
    </g>
    {/* shelf with boxes and a spool */}
    <rect x={40} y={560} width={420} height={14} rx={4} fill="#1E3E37" />
    <rect x={70} y={496} width={90} height={64} rx={6} fill="#1C443C" />
    <rect x={176} y={516} width={70} height={44} rx={6} fill={C.berry3} opacity={0.75} />
    <circle cx={330} cy={524} r={36} fill="#1C443C" />
    <circle cx={330} cy={524} r={14} fill="#0E2A24" />
    <rect x={392} y={508} width={46} height={52} rx={6} fill="#24524A" />
    {/* the lamp and its pool of light */}
    <line x1={640} y1={-600} x2={640} y2={640} stroke="#0A1A17" strokeWidth={5} />
    <ellipse cx={640} cy={1050} rx={560} ry={420} fill="url(#pool)" opacity={lamp} />
    <path d="M 584 690 Q 640 600 696 690 Z" fill="url(#graph)" />
    <ellipse cx={640} cy={690} rx={56} ry={10} fill="#DDEFEA" opacity={0.85 * lamp} />
  </g>
);

/** The wall clock; `mins` is the time shown, in minutes. */
export const Clock: React.FC<{ x: number; y: number; r?: number; mins: number }> = ({ x, y, r = 58, mins }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r + 8} fill="url(#graph)" />
    <circle r={r} fill="url(#porcV)" />
    {Array.from({ length: 12 }, (_, i) => <rect key={i} x={-2} y={-r + 6} width={4} height={i % 3 ? 7 : 12} fill={C.graph2} transform={`rotate(${i * 30})`} />)}
    <rect x={-3.5} y={-r * 0.5} width={7} height={r * 0.5} rx={3} fill={C.graph} transform={`rotate(${(mins / 720) * 360})`} />
    <rect x={-2.5} y={-r * 0.8} width={5} height={r * 0.8} rx={2} fill={C.teal3} transform={`rotate(${(mins / 60) * 360})`} />
    <circle r={5} fill={C.graph} />
  </g>
);

/** A press microphone facing the camera; `aim` tilts it (degrees). */
export const Mic: React.FC<{ x: number; y: number; s?: number; aim?: number; stand?: number; live?: number }> = ({ x, y, s = 1, aim = 0, stand = 80, live = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${aim}) scale(${s})`}>
    <rect x={-3} y={0} width={6} height={stand} fill={C.graph2} />
    <ellipse cx={0} cy={-10} rx={15} ry={20} fill="url(#graph)" />
    <ellipse cx={0} cy={-12} rx={11} ry={15} fill="url(#grille)" opacity={0.9} />
    <rect x={-15} y={4} width={30} height={9} rx={4} fill="url(#berry)" />
    {live > 0 && <circle cx={0} cy={8} r={2.6} fill="#E7F0ED" opacity={live} />}
  </g>
);

/** The absurdly elaborate tiny podium: berry front, a nameplate, a cluster of microphones, an approval gauge. */
export const Podium: React.FC<{ x?: number; s?: number; mics?: number[]; shine?: number; needle?: number; fallen?: number; live?: number }> = ({ x = G.podium, s = 0.62, mics = [0, 0, 0, 0, 0, 0, 0], shine = 0, needle = -80, fallen = 0, live = 1 }) => (
  <g transform={`translate(${x} ${G.floor}) scale(${s}) translate(0 ${-G.floor})`}>
    <Shadow x={0} y={G.floor + 4} rx={150} ry={16} />
    {/* the step behind it */}
    <rect x={-70} y={G.floor - 44} width={140} height={44} rx={6} fill="#2A3A37" />
    {/* microphones (behind the top slab, heads above it) */}
    {[-78, -52, -26, 0, 26, 52, 78].map((dx, i) => (
      <Mic key={i} x={dx} y={1000 - (i % 2) * 14 - (i === 3 ? 18 : 0)} s={0.95} aim={dx * 0.22 + (mics[i] ?? 0) + (i === 6 ? fallen * 70 : 0)} stand={40} live={i === 3 ? live : 0} />
    ))}
    <rect x={-122} y={1004} width={244} height={18} rx={6} fill="url(#porcV)" />
    <path d={`M -110 1022 L 110 1022 L 92 ${G.floor} L -92 ${G.floor} Z`} fill="url(#berryV)" />
    <path d={`M -110 1022 L -92 ${G.floor} L -84 ${G.floor} L -100 1022 Z`} fill="#D08AA6" opacity={0.35} />
    {/* nameplate: a small robot mark, no words */}
    <g transform="translate(-24 0)">
      <rect x={-52} y={1060} width={104} height={40} rx={8} fill="url(#metal)" />
      <rect x={-52} y={1060} width={104} height={40} rx={8} fill="#FFFFFF" opacity={0.5 * shine} />
      <circle cx={0} cy={1084} r={9} fill={C.graph2} />
      <rect x={-12} y={1074} width={24} height={8} rx={4} fill={C.graph} />
      <line x1={0} y1={1066} x2={0} y2={1072} stroke={C.graph2} strokeWidth={2.5} />
    </g>
    {/* approval gauge on the front: a dial with no numbers, needle at the low end */}
    <g transform="translate(78 1060)">
      <path d="M -24 4 A 24 24 0 0 1 24 4 Z" fill={C.graph} />
      <path d="M -20 2 A 20 20 0 0 1 20 2 Z" fill="url(#porcV)" />
      {[-80, -50, -20, 10, 40, 70].map((a) => <rect key={a} x={-1} y={-19} width={2} height={5} fill={C.graph2} transform={`rotate(${a})`} />)}
      <path d="M 12 -14 A 18 18 0 0 1 18 -2" stroke={C.teal} strokeWidth={4} fill="none" />
      <line x1={0} y1={0} x2={0} y2={-16} stroke={C.berry3} strokeWidth={3.4} strokeLinecap="round" transform={`rotate(${needle})`} />
      <circle r={3.5} fill={C.graph} />
    </g>
  </g>
);

/** The cable from the podium to a wall socket; `out` 0 … 1 pulls the plug out. */
export const Cable: React.FC<{ out?: number }> = ({ out = 0 }) => {
  const px = 330 + out * 26, py = 1146 + out * 30;
  return (
    <g>
      <rect x={318} y={1124} width={40} height={46} rx={7} fill="url(#graph)" />
      <rect x={329} y={1138} width={4} height={14} rx={2} fill="#0E1113" />
      <rect x={343} y={1138} width={4} height={14} rx={2} fill="#0E1113" />
      <path d={`M ${G.podium + 100} ${G.floor - 30} Q ${(G.podium + 100 + px) / 2} ${G.floor + 10 - out * 20} ${px - 4} ${py + 10}`} stroke="#14181B" strokeWidth={6} fill="none" />
      <rect x={px - 12} y={py - 6} width={24} height={22} rx={5} fill="url(#graph)" transform={`rotate(${out * 40} ${px} ${py})`} />
    </g>
  );
};

/** The diagram on its easel: «تأخّرت» and a chart that only goes down, arrows looping back on themselves. */
export const Easel: React.FC<{ x: number; draw?: number }> = ({ x, draw = 1 }) => (
  <g transform={`translate(${x} 0)`}>
    <line x1={-110} y1={G.floor} x2={-60} y2={820} stroke={C.graph} strokeWidth={10} />
    <line x1={110} y1={G.floor} x2={60} y2={820} stroke={C.graph} strokeWidth={10} />
    <line x1={0} y1={G.floor - 10} x2={0} y2={820} stroke={C.graph2} strokeWidth={8} />
    <rect x={-150} y={820} width={300} height={300} rx={12} fill="url(#porcV)" />
    <text x={0} y={888} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={900} fontSize={46} fill={C.graph}>تأخّرت</text>
    <path d="M -110 940 L -60 970 L -20 950 L 30 1020 L 70 1000 L 110 1080" stroke={C.berry} strokeWidth={9} fill="none" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={420} strokeDashoffset={420 * (1 - draw)} />
    <path d="M 96 1062 l 16 20 l 6 -24 z" fill={C.berry} opacity={draw > 0.95 ? 1 : 0} />
    <circle cx={-90} cy={1060} r={24} fill="none" stroke={C.graph2} strokeWidth={6} />
    <path d="M -90 1060 l 0 -14 M -90 1060 l 10 6" stroke={C.graph2} strokeWidth={5} strokeLinecap="round" />
    <path d="M -40 1080 q 30 -40 60 0 q -30 30 -50 -8" stroke={C.teal3} strokeWidth={5} fill="none" strokeLinecap="round" />
  </g>
);

/** The polished steel panel leaning on the wall (the robot polishes its image in it). */
export const Panel: React.FC<{ x: number; y?: number; w?: number; h?: number; children?: React.ReactNode; fog?: number }> = ({ x, y = 950, w = 130, h = 236, children, fog = 0 }) => (
  <g>
    <defs><clipPath id={`panel-${x}`}><rect x={x} y={y} width={w} height={h} rx={10} /></clipPath></defs>
    <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={14} fill="url(#graph)" />
    <rect x={x} y={y} width={w} height={h} rx={10} fill="url(#metal)" />
    <g clipPath={`url(#panel-${x})`}>
      {children}
      <rect x={x} y={y} width={w} height={h} fill="#DDE7E4" opacity={0.18 + 0.4 * fog} />
      <path d={`M ${x - 20} ${y + h * 0.7} L ${x + w * 0.6} ${y - 20}`} stroke="#FFFFFF" strokeWidth={18} opacity={0.18} />
    </g>
  </g>
);

/** A small loose screw. */
export const Screw: React.FC<{ x: number; y: number; rot?: number; op?: number }> = ({ x, y, rot = 0, op = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={op}>
    <rect x={-3} y={-4} width={16} height={8} rx={2} fill={C.graph3} />
    <polygon points="-9,-7 -3,-9 -3,9 -9,7" fill={C.graph2} />
  </g>
);

/** The wrench, in gripper space (along +x). */
export const Wrench: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <rect x={4} y={-6} width={74} height={12} rx={6} fill="url(#metal)" />
    <path d="M 74 -16 a 16 16 0 1 1 0 32 l 0 -10 a 6 6 0 0 0 0 -12 z" fill="url(#metal)" />
  </g>
);

/** A connector plate, in gripper space; `kink` bends it (the failed one). */
export const Connector: React.FC<{ tone?: 'teal' | 'porc'; kink?: number }> = ({ tone = 'teal', kink = 0 }) => (
  <g>
    <rect x={6} y={-9} width={22} height={18} rx={4} fill={tone === 'teal' ? 'url(#teal)' : 'url(#porc)'} />
    <g transform={`rotate(${kink} 28 0)`}><rect x={26} y={-9} width={22} height={18} rx={4} fill={tone === 'teal' ? 'url(#teal)' : 'url(#porc)'} /></g>
    <circle cx={14} cy={0} r={3} fill={C.graph} /><circle cx={42} cy={0} r={3} fill={C.graph} transform={`rotate(${kink} 28 0)`} />
  </g>
);

/** Cue cards, in gripper space. */
export const Cards: React.FC<{ fan?: number }> = ({ fan = 0 }) => (
  <g>
    {[0, 1, 2].map((k) => <rect key={k} x={8} y={-26} width={40} height={52} rx={4} fill="url(#porcV)" stroke={C.porc3} strokeWidth={1.5} transform={`rotate(${(k - 1) * 9 * fan} 16 20)`} />)}
    {[0, 1, 2].map((k) => <rect key={k} x={16} y={-14 + k * 10} width={24} height={4} rx={2} fill={C.porc3} />)}
  </g>
);

/** The trolley that tests the bridge. */
export const Trolley: React.FC<{ x: number; y?: number; roll?: number }> = ({ x, y = G.deck, roll = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <Shadow x={0} y={0} rx={44} ry={6} />
    <rect x={-38} y={-44} width={76} height={32} rx={8} fill="url(#porc)" />
    <rect x={-38} y={-30} width={76} height={8} fill="url(#teal)" />
    {[-24, 24].map((wx) => (
      <g key={wx} transform={`translate(${wx} -9) rotate(${(roll * 180) / Math.PI})`}>
        <circle r={10} fill="url(#graph)" />
        <rect x={-1.5} y={-8} width={3} height={16} fill={C.graph3} />
      </g>
    ))}
  </g>
);

/** The helping hand: another robot's forearm and gripper from the right edge (no body, no face). */
export const HelperArm: React.FC<{ from: V; to: V; open?: number; held?: React.ReactNode }> = ({ from, to, open = 0.3, held }) => {
  const a = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const sp = 12 + 18 * open;
  return (
    <g transform={`translate(${from[0]} ${from[1]}) rotate(${a})`}>
      <rect x={0} y={-14} width={len} height={28} rx={14} fill="url(#graphV)" />
      <rect x={20} y={-4} width={Math.max(0, len - 60)} height={6} rx={3} fill={C.teal2} opacity={0.8} />
      <g transform={`translate(${len} 0)`}>
        {held}
        <rect x={8} y={-sp / 2 - 7} width={26} height={8} rx={4} fill="url(#graph)" />
        <rect x={8} y={sp / 2 - 1} width={26} height={8} rx={4} fill="url(#graph)" />
        <circle r={14} fill="url(#graph)" />
        <circle r={5} fill={C.teal2} />
      </g>
    </g>
  );
};

/** The podium's telescopic boom: from its mount on the podium toward a point; `p` 0 (folded) … 1 (at the point). */
export const BoomMic: React.FC<{ to: V; p: number; aim?: number }> = ({ to, p, aim = 0 }) => {
  const base: V = [G.podium + 62, G.floor - 150];
  const tip: V = [base[0] + (to[0] - base[0]) * p, base[1] + (to[1] - base[1]) * p];
  if (p <= 0.02) return null;
  const a = (Math.atan2(tip[1] - base[1], tip[0] - base[0]) * 180) / Math.PI;
  const len = Math.hypot(tip[0] - base[0], tip[1] - base[1]);
  return (
    <g>
      <g transform={`translate(${base[0]} ${base[1]}) rotate(${a})`}>
        <rect x={0} y={-4} width={len} height={8} rx={4} fill="url(#graphV)" />
        <rect x={0} y={-6} width={Math.min(len, 60)} height={12} rx={6} fill="url(#graph)" />
      </g>
      <g transform={`translate(${tip[0]} ${tip[1]}) rotate(${a + 90 + aim})`}>
        <ellipse cx={0} cy={-14} rx={13} ry={17} fill="url(#graph)" />
        <ellipse cx={0} cy={-16} rx={9.5} ry={12.5} fill="url(#grille)" />
        <rect x={-13} y={-2} width={26} height={8} rx={4} fill="url(#berry)" />
      </g>
    </g>
  );
};
