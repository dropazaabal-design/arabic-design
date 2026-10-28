import React from 'react';
import { PAL, bowLine, clamp, stroke, wobRect } from '@mukarram/characters/ink';
import { C, CHAIR, Cabinet, Chair, Clock, Crumple, DOOR, Desk, Door, DoorState, MEET, MeetDoor, Memo, PadSheet, Pin, PinBoard, Tube, Whiteboard } from '../characters/office';
import { ease, keys, prog, sec, segStart, wordAt } from '../video/time';

// One connected office, laid out left→right as the story travels right→left (the reading direction):
//   meeting-room door + 3:00 clock · whiteboard · the clerk's desk (two tubes, pinboard) · cabinet · the manager's door.
// Everything that changes is a function of the global frame, keyed to words of the recording, so every shot
// sees the same world: the pad's sheets, the crumpled «مفتوح», the memos on the board, the chair, the board text.

export const FLOOR = 1560;
export const DOOR_X = 0;
export const CAB_X = -600;
export const DESK_X = -1250;
export const TUBE_L = -1620;
export const TUBE_R = -860;
export const TUBE_Y = 800;            // outlet height
export const BOARD = { x: -1250, y: 1100, w: 580, h: 300 };   // a partition board behind the desk, at shoulder height
export const MEMO_OFF: [number, number] = [-1452, 1122];  // «ملغي» pinned on the left of his head
export const MEMO_ON: [number, number] = [-1048, 1122];   // «قائم» pinned on the right (read first)
export const EMP_DESK_X = -1250;                          // where he stands behind the desk, between the two memos
export const STAMP_DESK: [number, number] = [-1130, 1258]; // the clerk's blue stamp resting on the desk (grip point)
export const WB = { x: -2480, y: 446, s: 0.85 };       // above the meeting door
export const CLOCK: [number, number] = [-2168, 790];    // beside the meeting door
export const MEET_X = -2480;
export const CHAIR_DESK: [number, number] = [-900, FLOOR - 40];
export const CHAIR_STRETCH = -2020;                        // where the chair is when he freezes in the split
export const CHAIR_SIT = -2290;                            // pulled under him when he sits
export const BOUNDS: [number, number, number, number] = [-3000, -100, 700, 2300];

/** Story beats in global frames (all from words of the take). */
export const beats = () => {
  const w = wordAt;
  const stamp1 = w('s02', 'مفتوح');
  const tear1 = w('s04', 'وبعد') + 10;
  const stamp2 = w('s04', 'مقفول');
  const tear3 = segStart('s15') - 12;
  return {
    pull1: w('s01', 'شدّ'), pull2: w('s01', 'بكل'), pull3: w('s01', 'قوته'), slip: w('s01', 'طق'), notOpen: w('s01', 'ما'),
    flap1: w('s02', 'المدير') + 2, stamp1,
    smile: w('s03', 'ابتسم'), go: w('s03', 'حاول'), bump: w('s03', 'وارتطم') + 3,
    flap2: w('s04', 'وبعد') - 2, tear1, ball1: tear1 + 22, stamp2, tap2a: w('s04', 'من') + 2, tap2b: w('s04', 'البداية') + 9,
    nod: w('s05', 'هزّ'), sure: w('s05', 'طبعًا'), erase0: w('s05', 'مصدّقه'), erase1: w('s05', 'قليل') + 2, blow: w('s05', 'قليل') + 4,
    rattle: w('s06', 'ثم'), cap1: w('s06', 'وصلته'), cap2: w('s06', 'ورقتان'), open: w('s06', 'للاجتماع'), time: w('s06', 'الساعة'),
    pinOn: w('s07', 'الاجتماع') + 8, readOn: w('s07', 'قائم'), pinOff: w('s07', 'والاجتماع') + 12, readOff: w('s07', 'ملغي'),
    ok1: w('s08', 'على') + 2, ok2: w('s08', 'الاثنتين') + 16, proud: w('s08', 'صحيح'),
    take: w('s09', 'جاب') - 1, drag0: w('s09', 'جاب'), arrive: w('s09', 'وعلّق') - 2, hang: w('s09', 'الإلغاء') + 4, freeze: w('s09', 'الثانية'),
    sit: w('s09', 'الثانية') + 14, write: w('s11', 'التفكير'), sub: w('s11', '1984'),
    look1: w('s12', 'تصدّق'), look2: w('s12', 'فكرتين'), look3: w('s12', 'متناقضتين'), fast: w('s12', 'في'), doubt: w('s12', 'وتتغاضى'), shrug: w('s12', 'التناقض'),
    put: segStart('s13') - 2, grip: w('s13', 'تغيّر'), test: w('s13', 'الدليل'), note2: w('s13', 'وغيّرت') + 4, calm: w('s13', 'طبيعي'),
    pick: w('s14', 'لكن') + 4, unfold: w('s14', 'المدير') + 4, point: w('s14', 'لمس'), lock: w('s14', 'القفل'), compare: w('s14', 'اللي'), only: w('s14', 'كلامه'),
    flap3: tear3 - 4, tear3, stamp3: segStart('s15') + 2, grip3: w('s15', 'تغيّر'), test3: w('s15', 'الواقع'), lookPad: w('s15', 'ولا'), tear4: w('s15', 'الكلام') + 6,
    slide: w('s15', 'الكلام') + 20,
  };
};
export type Beats = ReturnType<typeof beats>;
let cache: Beats | null = null;
export const B = () => (cache ??= beats());

/** The door pad at frame f: which word is on top, and how many sheets are left. */
export const padAt = (f: number): DoorState => {
  const b = B();
  if (f < b.stamp1) return { word: null, count: 9 };
  if (f < b.tear1) return { word: 'مفتوح', count: 9 };
  if (f < b.stamp2) return { word: null, count: 8 };
  if (f < b.tear3) return { word: 'مغلق', count: 8, bold: (f >= b.tap2a ? 1 : 0) + (f >= b.tap2b ? 1 : 0) };
  if (f < b.stamp3) return { word: null, count: 7 };
  if (f < b.tear4) return { word: 'مفتوح', count: 7 };
  return { word: null, count: 6 };
};

/** The stamp lands with a little pop: scale for the freshest imprint. */
export const stampPop = (f: number, at: number) => 1 + 0.25 * (1 - prog(f, at, 5, ease.out)) * (f >= at ? 1 : 0);

const Wall: React.FC = () => (
  <g>
    <rect x={BOUNDS[0]} y={BOUNDS[1]} width={BOUNDS[2] - BOUNDS[0]} height={FLOOR - BOUNDS[1]} fill={C.wall} />
    <rect x={BOUNDS[0]} y={FLOOR - 420} width={BOUNDS[2] - BOUNDS[0]} height={420} fill={C.wallLow} />
    <path d={bowLine(BOUNDS[0], FLOOR - 420, BOUNDS[2], FLOOR - 420, 2)} {...stroke(10, C.rail)} />
    <path d={bowLine(BOUNDS[0], FLOOR - 420, BOUNDS[2], FLOOR - 420, 2)} {...stroke(3)} opacity={0.6} />
    {/* faint wallpaper doodles (no words) */}
    {Array.from({ length: 30 }, (_, i) => {
      const x = BOUNDS[0] + 60 + i * 120, y = 260 + (i % 3) * 230;
      return <path key={i} d={`M${x} ${y} q 14 -16 28 0 q 14 16 28 0`} fill="none" stroke={PAL.blueSoft} strokeWidth={4} opacity={0.08} />;
    })}
    <rect x={BOUNDS[0]} y={FLOOR} width={BOUNDS[2] - BOUNDS[0]} height={BOUNDS[3] - FLOOR} fill={C.floor} />
    <rect x={BOUNDS[0]} y={FLOOR - 18} width={BOUNDS[2] - BOUNDS[0]} height={18} fill={C.floorDeep} />
    <path d={bowLine(BOUNDS[0], FLOOR, BOUNDS[2], FLOOR, 3)} {...stroke()} />
    {Array.from({ length: 16 }, (_, i) => <path key={i} d={bowLine(BOUNDS[0] + i * 240, FLOOR + 30, BOUNDS[0] + i * 240 - 160, BOUNDS[3], 4)} stroke={C.floorDeep} strokeWidth={5} opacity={0.7} />)}
  </g>
);

/** The memos on the pinboard at frame f (pinned → stamped → taken away when he heads to the meeting). */
export const boardMemos = (f: number) => {
  const b = B();
  const out: Array<{ kind: 'on' | 'off'; at: [number, number]; ok: number }> = [];
  if (f >= b.pinOn && f < b.take) out.push({ kind: 'on', at: MEMO_ON, ok: f >= b.ok1 ? prog(f, b.ok1, 4, ease.linear) : 0 });
  if (f >= b.pinOff && f < b.take) out.push({ kind: 'off', at: MEMO_OFF, ok: f >= b.ok2 ? prog(f, b.ok2, 4, ease.linear) : 0 });
  return out;
};

/** The clerk's x while he drags the chair to the meeting door (shared by the shot and the chair). */
export const dragX = (f: number) => keys(f, [[B().drag0, -1660], [B().arrive, CHAIR_SIT]], ease.inOut);

/** Where the desk chair is (x on the floor), and its roll, at frame f. */
export const chairAt = (f: number) => {
  const b = B();
  if (f < b.drag0) return { x: CHAIR_DESK[0], roll: 0, behindDesk: true };
  let x: number;
  if (f < b.arrive) x = dragX(f) + 190;
  else if (f < b.sit - 10) x = keys(f, [[b.arrive, dragX(b.arrive) + 190], [b.arrive + 8, CHAIR_STRETCH]], ease.out);
  else x = keys(f, [[b.sit - 10, CHAIR_STRETCH], [b.sit, CHAIR_SIT]], ease.inOut);
  return { x, roll: x / 90, behindDesk: false };
};

/** The back of the world (everything behind the characters). `hide` skips pieces a shot draws itself. */
export const Back: React.FC<{ f: number; door?: Partial<DoorState>; hide?: { chair?: boolean; crumple?: boolean; boardMemos?: boolean; meetMemo?: boolean } }> = ({ f, door = {}, hide = {} }) => {
  const b = B();
  const ch = chairAt(f);
  const shake = (at: number) => (f >= at - 8 && f < at + 2 ? Math.sin(f * 2.1) * 4 : 0);
  return (
    <g>
      <Wall />
      {/* meeting area */}
      <MeetDoor x={MEET_X} y={FLOOR} />
      <Clock x={CLOCK[0]} y={CLOCK[1]} s={0.65} text="3:00" />
      {!hide.meetMemo && f >= b.hang && <Memo kind="off" x={MEET_X - 40} y={FLOOR + MEET.hookY + 118} s={0.82} rot={2} />}
      <Whiteboard x={WB.x} y={WB.y} s={WB.s} write={prog(f, b.write, 26, ease.linear)} sub={prog(f, b.sub, 18, ease.linear)} />
      {/* desk area */}
      <Tube x={TUBE_L} top={-100} bottom={TUBE_Y} dir={1} shake={shake(b.cap1)} />
      <Tube x={TUBE_R} top={-100} bottom={TUBE_Y} dir={-1} shake={shake(b.cap2)} />
      <PinBoard x={BOARD.x} y={BOARD.y} w={BOARD.w} h={BOARD.h} />
      {!hide.boardMemos && boardMemos(f).map((m) => <g key={m.kind}><Memo kind={m.kind} x={m.at[0]} y={m.at[1]} s={0.72} ok={m.ok} /><Pin x={m.at[0]} y={m.at[1] - 82} /></g>)}
      {f >= b.take && [MEMO_ON, MEMO_OFF].map((m, i) => <Pin key={i} x={m[0]} y={m[1] - 82} />)}
      {!hide.chair && ch.behindDesk && <Chair x={ch.x} y={CHAIR_DESK[1]} />}
      {/* the manager's door and its cabinet */}
      <Cabinet x={CAB_X} y={FLOOR} />
      <Door x={DOOR_X} y={FLOOR} st={{ ...padAt(f), ...door }} />
      {!hide.crumple && f >= b.ball1 + 12 && f < b.pick && <Crumple x={DOOR_X - 40} y={FLOOR - 30} word="مفتوح" seed={2} />}
      {f >= b.tear3 + 26 && <PadSheet x={DOOR_X + 150} y={FLOOR - 14} s={0.6} rot={-82} word="مغلق" />}
      {!hide.chair && !ch.behindDesk && <Chair x={ch.x} y={FLOOR} roll={ch.roll} />}
    </g>
  );
};

/** The front of the world: the desk (it hides the clerk's legs when he stands behind it). */
export const Front: React.FC<{ f: number }> = () => (
  <g>
    <Desk x={DESK_X} y={FLOOR} />
  </g>
);

export { CHAIR, DOOR, clamp, wobRect };
