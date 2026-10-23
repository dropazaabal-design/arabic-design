import React from 'react';
import { Ar, Chair, Clock, INK, Laptop, Mug, TITLE, clamp01, hash, mix, sketch } from './kit';
import { B } from './look';
import { ArchiveBack, ArchiveFront, Chute, InkPad, LogoScreen, Nameplate, QueueBox, RatingBox, STAMP_FOOT, Sign, Stand, StampTool, Sticky } from './props';

// Two places, both drawn in the 1080×1920 frame's units. Everything that must be read sits in the 4:5 band
// (y 285–1635); the rest of the frame is the same set continued.

// ——— the office inside his head ———
export const OFFICE = {
  counterY: 1180,
  naif: { x: 520, y: 1409, s: 1.9 },
  pad: [618, 1180] as [number, number],
  stand: [780, 1180] as [number, number],
  chute: [930, 860] as [number, number],
  rating: [150, 1180] as [number, number],
  mug: [262, 1180] as [number, number],
  archive: [362, 1180] as [number, number],
  monitor: { x: 52, y: 506, w: 340, h: 250 },
  queue: [745, 600] as [number, number],
  sign: [540, 400] as [number, number],
  plate: [520, 1262] as [number, number],
};
/** Stamp scale on the counter (the same as in Naif's hand, so picking it up never pops). */
export const STAMP_S = 1.45 * OFFICE.naif.s;
/** Where the stamp's neck is when it stands on the pad. */
export const STAMP_HOME: [number, number] = [OFFICE.pad[0], OFFICE.pad[1] - 21 - STAMP_FOOT * STAMP_S];
export const MUG_S = 2.3;

export type OfficeState = {
  morning?: number; queue?: number; queueFlash?: number; chutePuff?: number; dim?: number;
  rating?: React.ComponentProps<typeof RatingBox>;
  plate?: React.ComponentProps<typeof Nameplate>;
  stampHome?: boolean; mugHome?: boolean; mugOnBox?: boolean; inBin?: React.ReactNode;
  monitor?: React.ReactNode; t?: number;
};

/** Behind Naif: the wall, the dome of his skull for a ceiling, the sign, the monitor «الواقع», the queue, the chute. */
export const OfficeBack: React.FC<{ st: OfficeState }> = ({ st }) => {
  const O = OFFICE, m = O.monitor;
  return (
    <g>
      <rect x={-900} y={-900} width={2900} height={3800} fill={mix(0, 1, st.morning ?? 0) > 0.5 ? B.mist : B.mist} />
      {/* panels and a lower band */}
      {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${-560 + i * 140} 140 V1180`} stroke={B.blueLight} strokeWidth={4} />)}
      <rect x={-900} y={990} width={2900} height={190} fill={B.blueLight} />
      <path d={`M-900 990 H2000`} stroke={B.greyMid} strokeWidth={4} />
      {/* the inside of the skull: a dark dome with a soft rim */}
      <path d="M-900 -900 H2000 V760 Q1500 760 1260 360 Q1000 -40 540 -40 Q80 -40 -180 360 Q-420 760 -900 760 Z" fill={B.navy} />
      <path d="M-900 760 Q-420 760 -180 360 Q80 -40 540 -40 Q1000 -40 1260 360 Q1500 760 2000 760" fill="none" stroke={B.navy3} strokeWidth={26} />
      <path d="M-900 760 Q-420 760 -180 360 Q80 -40 540 -40 Q1000 -40 1260 360 Q1500 760 2000 760" fill="none" stroke={B.blue} strokeWidth={5} opacity={0.6} />
      <g transform={`translate(${O.sign[0]} ${O.sign[1]})`}><Sign /></g>
      {/* the monitor «الواقع»: what is happening in his real life right now */}
      <g>
        <path d={`M${m.x + m.w / 2} ${m.y - 60} V${m.y}`} stroke={INK} strokeWidth={5} />
        <rect x={m.x - 14} y={m.y - 14} width={m.w + 28} height={m.h + 28} rx={18} fill={B.navy} stroke={INK} strokeWidth={5} />
        <svg x={m.x} y={m.y} width={m.w} height={m.h} viewBox={`0 0 ${m.w} ${m.h}`}>{st.monitor}</svg>
        <rect x={m.x} y={m.y} width={m.w} height={m.h} fill="none" stroke={INK} strokeWidth={3} />
        <rect x={m.x + 10} y={m.y + 10} width={96} height={38} rx={10} fill={B.red} />
        <Ar x={m.x + 10} y={m.y + 10} w={96} h={38} size={22} color={B.white} weight={800} font={TITLE} lh={1}>الواقع</Ar>
      </g>
      <g transform={`translate(${O.queue[0]} ${O.queue[1]})`}><QueueBox n={st.queue ?? 1} flash={st.queueFlash} /></g>
      <g transform={`translate(${O.chute[0]} ${O.chute[1]})`}><Chute puff={st.chutePuff} /></g>
    </g>
  );
};

/** In front of Naif's legs: the counter, its top and the nameplate. */
export const OfficeCounter: React.FC<{ st: OfficeState }> = ({ st }) => {
  const O = OFFICE;
  return (
    <g>
      <rect x={-900} y={O.counterY} width={2900} height={1700} fill={B.navy2} />
      <rect x={-900} y={O.counterY + 120} width={2900} height={14} fill={B.blue} opacity={0.8} />
      <rect x={-900} y={O.counterY - 14} width={2900} height={26} fill={B.greyMid} stroke={INK} strokeWidth={4} />
      <g transform={`translate(${O.plate[0]} ${O.plate[1]})`}><Nameplate a="نايف · خدمة العملاء" {...st.plate} /></g>
    </g>
  );
};

/** On the counter: the rating box, the mug, the ink pad and stamp, the card stand, the archive. */
export const OfficeItems: React.FC<{ st: OfficeState }> = ({ st }) => {
  const O = OFFICE, t = st.t ?? 0;
  return (
    <g>
      <g transform={`translate(${O.stand[0]} ${O.stand[1]})`}><Stand /></g>
      <g transform={`translate(${O.pad[0]} ${O.pad[1]})`}><InkPad /></g>
      {(st.stampHome ?? true) && <g transform={`translate(${STAMP_HOME[0]} ${STAMP_HOME[1]}) scale(${STAMP_S})`}><StampTool /></g>}
      <g transform={`translate(${O.rating[0]} ${O.rating[1]})`}><RatingBox {...st.rating} /></g>
      {st.mugOnBox && <g transform={`translate(${O.rating[0]} ${O.rating[1] - 112}) scale(${MUG_S})`}><Mug steam={0.6} t={t} color={B.blue} /></g>}
      {(st.mugHome ?? true) && <g transform={`translate(${O.mug[0]} ${O.mug[1]}) scale(${MUG_S})`}><Mug steam={0.6} t={t} color={B.blue} /></g>}
      <g transform={`translate(${O.archive[0]} ${O.archive[1]})`}><ArchiveBack /></g>
      {st.inBin}
      <g transform={`translate(${O.archive[0]} ${O.archive[1]})`}><ArchiveFront /></g>
    </g>
  );
};
/** The lights of the office: a cool dim in the evening, a flicker at the turn. */
export const OfficeLight: React.FC<{ dim?: number }> = ({ dim = 0 }) => (dim > 0 ? <rect x={-900} y={-900} width={2900} height={3800} fill={B.navy} opacity={dim * 0.5} /> : null);

// ——— his real room ———
export const ROOM = {
  deskY: 1240,
  naif: { x: 330, y: 1500, s: 2.0 },
  laptop: [660, 1240] as [number, number], laptopS: 2.3,
  phone: [452, 1236] as [number, number],
  clock: [900, 560] as [number, number],
  window: { x: 70, y: 400, w: 300, h: 400 },
};
export type RoomState = { morning?: number; hours: number; minutes: number; drawn: number; type?: number; caret?: boolean; sent?: number; phoneHome?: boolean; phoneLit?: number; phoneBuzz?: number; t?: number };

export const RoomBack: React.FC<{ st: RoomState }> = ({ st }) => {
  const R = ROOM, W = R.window, m = clamp01(st.morning ?? 0);
  return (
    <g>
      <rect x={-900} y={-900} width={2900} height={3800} fill={m > 0.5 ? B.wallDay : B.wallEve} />
      <rect x={-900} y={-900} width={2900} height={3800} fill={B.wallDay} opacity={m} />
      <rect x={W.x - 18} y={W.y - 18} width={W.w + 36} height={W.h + 36} rx={10} fill={B.white} stroke={INK} strokeWidth={5} />
      <rect x={W.x} y={W.y} width={W.w} height={W.h} fill={B.skyEve} />
      <rect x={W.x} y={W.y} width={W.w} height={W.h} fill={B.skyDay} opacity={m} />
      {m < 1 && Array.from({ length: 9 }, (_, i) => <circle key={i} cx={W.x + 20 + hash(i + 3) * (W.w - 40)} cy={W.y + 20 + hash(i * 7 + 1) * (W.h * 0.6)} r={2.5 + hash(i) * 2} fill={B.white} opacity={(1 - m) * 0.8} />)}
      {m > 0 && [[W.x + 90, W.y + 110], [W.x + 210, W.y + 220]].map(([x, y], i) => <path key={i} d={`M${x - 50} ${y} q0 -28 30 -26 q14 -24 40 -12 q30 -8 32 22 q20 4 14 18 Z`} fill={B.white} opacity={m * 0.9} />)}
      <path d={`M${W.x + W.w / 2} ${W.y} V${W.y + W.h} M${W.x} ${W.y + W.h / 2} H${W.x + W.w}`} stroke={B.white} strokeWidth={10} />
      <g transform={`translate(${R.clock[0]} ${R.clock[1]})`}><Clock hours={st.hours} minutes={st.minutes} r={64} /></g>
      <rect x={-900} y={1150} width={2900} height={12} fill={B.greyMid} opacity={0.6} />
    </g>
  );
};
export const RoomChair: React.FC = () => <g transform={`translate(${ROOM.naif.x - 30} ${ROOM.naif.y}) scale(${ROOM.naif.s})`}><Chair kind="office" facing={1} /></g>;

export const RoomDesk: React.FC<{ st: RoomState }> = ({ st }) => {
  const R = ROOM;
  return (
    <g>
      <rect x={-900} y={R.deskY} width={2900} height={1700} fill={B.deskEdge} />
      <path d={sketch([[-900, R.deskY - 26], [2000, R.deskY - 26], [2000, R.deskY + 8], [-900, R.deskY + 8]], 5, 1, true)} fill={B.desk} stroke={INK} strokeWidth={5} />
      <rect x={-900} y={R.deskY + 70} width={2900} height={10} fill={INK} opacity={0.08} />
    </g>
  );
};
export const RoomItems: React.FC<{ st: RoomState }> = ({ st }) => {
  const R = ROOM;
  const buzz = st.phoneBuzz ?? 0, t = st.t ?? 0;
  return (
    <g>
      <g transform={`translate(${R.laptop[0]} ${R.laptop[1] - 18}) scale(${R.laptopS})`}>
        <Laptop open={1} screen={<LogoScreen drawn={st.drawn} type={st.type} caret={st.caret} sent={st.sent} />} />
      </g>
      <g transform={`translate(${R.laptop[0] + 150} ${R.laptop[1] - 18 - 120 * R.laptopS})`}><Sticky text="التسليم 5:00" w={150} size={30} /></g>
      {(st.phoneHome ?? true) && <g transform={`translate(${R.phone[0] + buzz * 3 * Math.sin(t * 140)} ${R.phone[1]})`}>
        {buzz > 0 && [-1, 1].map((s) => <path key={s} d={`M${s * 52} -22 q${s * 8} 12 0 24 M${s * 64} -16 q${s * 6} 8 0 16`} stroke={INK} strokeWidth={3.4} fill="none" strokeLinecap="round" opacity={buzz} />)}
        <rect x={-40} y={-14} width={80} height={14} rx={5} fill="#3B4456" stroke={INK} strokeWidth={3} />
        {(st.phoneLit ?? 0) > 0 && <rect x={-34} y={-16} width={68} height={4} rx={2} fill="#9CC7F0" opacity={st.phoneLit} />}
      </g>}
    </g>
  );
};
