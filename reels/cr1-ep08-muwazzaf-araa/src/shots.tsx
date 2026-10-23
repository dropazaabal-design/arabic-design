import React from 'react';
import { arms, breathe, inFist, look, stampAct, type ArmKey } from './act';
import { ChatBig, Bubble, Card, Flyer, Pill, Policy, STAND_CARD, BIN_TOP, StampTool } from './props';
import { EXPRESSIONS, Phone, clamp01, ease, faceAt, hash, joints, k, mix, mixPose, pose, settle, type Face, type Pose, type V } from './kit';
import { B } from './look';
import { headAt, toWorld, type Place } from './naif';
import { OFFICE, ROOM, RoomBack, RoomDesk, RoomItems, STAMP_S, type RoomState } from './sets';
import { OfficeScene, RoomScene, toScreen, type Cam } from './stage';
import { MONITOR_BOX, MonitorInsert, PHONE_BOX, PhoneInsert } from './inserts';
import { L0, L1, TOTAL, w } from './timing';
import { Naif } from './naif';

// The seventeen shots of the scene table, keyed to spoken words. Each returns its picture and the screen boxes the
// captions must not cover (faces, the hand or card carrying the joke).

export type Box = { x0: number; y0: number; x1: number; y1: number; what: string };
export type ShotOut = { node: React.ReactNode; guards: Box[] };
export type Shot = { id: string; from: number; render: (f: number) => ShotOut };

export const T = {
  into: L1(1) + 2, monitor: L0(4) - 8, card1: L0(5) - 16, type: L0(6) - 6, clock: L0(7) - 8, send: w(7, 4) - 8, wince: L1(7) + 4,
  card2: L0(8) - 20, policy: L0(9) - 6, flood: L0(11) - 8, promo: L0(12) - 4, out: L0(13) - 4, msg: w(13, 4) - 6,
  beat: L1(13) + 4, cu: L0(14) - 4, morning: L0(15) - 24, abshir: w(17, 0) - 6, fix: L1(17) + 6, archive: L0(18) - 10,
};

/** Action frames shared by the picture and the sound (src/cues.ts): one source for both. */
export const K = (() => {
  const policyWriteEnd = w(9, 2) + 6, policyStamp0 = w(9, 3) - 10;
  const buzz0 = L1(18) + 8, mugUp = buzz0 + 18, step = mugUp + 10, put = step + 24, back = put + 18;
  const cA = w(15, 1), cB = w(15, 1) + 14;
  return {
    card1Stamp0: w(5, 2) - 4, policyWriteEnd, policyToss: policyWriteEnd + 2, policyStamp0, wag0: L0(10) - 6,
    cA, cB, catchA: cA + 18, catchB: cB + 18, slap: w(16, 3) - 16, aStamp0: w(16, 3) + 8,
    buzz0, mugUp, step, put, back, fixClick: T.fix + 56, binDrop: w(18, 5),
  };
})();

const PO = OFFICE.naif as Place, PR = ROOM.naif as Place;
const CARD: V = [OFFICE.stand[0] + STAND_CARD.dx, OFFICE.stand[1] + STAND_CARD.dy];
const faceBox = (cam: Cam, P: Place, p: Pose): Box => {
  const h = toScreen(cam, headAt(P, p)), r = 48 * P.s * cam.z * 1.15;
  return { x0: h[0] - r, y0: h[1] - r, x1: h[0] + r, y1: h[1] + r * 1.1, what: 'face' };
};
const box = (cam: Cam, c: V, wdt: number, hgt: number, what: string): Box => {
  const s = toScreen(cam, c);
  return { x0: s[0] - (wdt * cam.z) / 2, y0: s[1] - (hgt * cam.z) / 2, x1: s[0] + (wdt * cam.z) / 2, y1: s[1] + (hgt * cam.z) / 2, what };
};
const camAt = (f: number, keys: [number, Cam][], e = ease.inOut): Cam => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) {
    const [a, A] = keys[i - 1], [b, Bc] = keys[i], t = e((f - a) / Math.max(1, b - a));
    return { x: mix(A.x, Bc.x, t), y: mix(A.y, Bc.y, t), z: mix(A.z, Bc.z, t) };
  }
  return keys[keys.length - 1][1];
};
const nodAt = (f: number, at: number, amp = 7, len = 18) => (f > at && f < at + len ? Math.sin(((f - at) / len) * Math.PI) * amp : 0);
const typed = (s: string, f: number, a: number, len: number) => Array.from(s).slice(0, Math.round(Array.from(s).length * clamp01((f - a) / len))).join('');
const untype = (s: string, f: number, a: number, len: number) => Array.from(s).slice(0, Math.round(Array.from(s).length * (1 - clamp01((f - a) / len)))).join('');

// ——— poses ———
const O_REST = pose({ lean: 2, turn: 0.3, body: 0.3, R: { sh: -8, el: 14 }, L: { sh: 12, el: 34 } });
const O_READ = pose({ lean: 8, turn: 0.62, body: 0.5, head: 10, R: { sh: -8, el: 14 }, L: { sh: 12, el: 34 } });
const O_FRONT = pose({ turn: 0.06, body: 0.08, R: { sh: -10, el: 12 }, L: { sh: 10, el: 12 } });
const O_PROUD = pose({ lean: -4, head: -8, turn: 0.18, body: 0.2, breath: 1, R: { sh: -10, el: 16 }, L: { sh: 12, el: 20 } });
const S_WORK = pose({ sit: 1, lean: 6, head: 4, turn: 0.5, body: 0.45, footR: [52, 0], footL: [64, 0], R: { hand: [86, -150] }, L: { hand: [128, -146] } });
const S_SLUMP = pose({ sit: 1, lean: 12, head: 16, turn: 0.45, body: 0.45, bob: 6, footR: [52, 0], footL: [64, 0], R: { hand: [70, -132] }, L: { hand: [110, -128] } });

// the real room, evening at four; the office's monitor shows it
const roomEve = (f: number, o: Partial<RoomState> = {}): RoomState => ({ hours: 4, minutes: 0, drawn: 0, caret: Math.floor(f / 30) % 2 === 0, t: f / 60, ...o });
const monitorRoom = (f: number, st: RoomState, view: 'desk' | 'clock' = 'desk', naif: { p: Pose; face: Face | keyof typeof EXPRESSIONS } = { p: S_WORK, face: { ...EXPRESSIONS.neutral, open: 0.55, look: [0.7, 0.25] } }) => (
  <svg width={340} height={250} viewBox={view === 'desk' ? '110 520 1006 740' : '640 400 520 382'} preserveAspectRatio="xMidYMid slice">
    <RoomBack st={st} />
    <Naif f={f} {...PR} p={naif.p} face={naif.face} hands={{ R: 'relaxed', L: 'relaxed' }} blink={0} />
    <RoomDesk st={st} />
    <RoomItems st={st} />
  </svg>
);

// ——— SH01: the hook — at his desk, a ding inside his head; he answers it like a headset ———
const sh01: Shot = {
  id: 'hook', from: 0, render: (f) => {
    const ding = 8, eyes = 14, tap = 30, say: [number, number] = [L0(1), L1(1)];
    const head = headAt(PR, S_WORK);
    const temple: V = [head[0] + 30, head[1] - 22];
    const b0 = mixPose(S_WORK, pose({ ...S_WORK, lean: -2, head: -6, turn: 0.22, body: 0.3 }), k(f, [[tap - 6, 0], [tap + 10, 1]]));
    const body = { ...b0, head: b0.head + nodAt(f, w(1, 4), 5, 16) + nodAt(f, w(1, 6), 6, 18) }; // never mutate the shared pose
    const p = arms(PR, f, body, undefined, [[0, null], [tap, temple, 16], [L1(1) + 30, temple]]);
    const face = faceAt(f, [[0, look('neutral', [0.7, 0.25])], [eyes, look('surprised', [0.15, -0.95]), 5], [tap + 4, look('forcedSmile', [-0.1, 0]), 10]]);
    const cam = camAt(f, [[0, { x: 470, y: 1050, z: 1.5 }], [L1(1) - 16, { x: 455, y: 1035, z: 1.62 }], [T.into + 16, { x: head[0], y: head[1], z: 4.2 }]], ease.in);
    const blink = f > ding && f < ding + 40 ? (Math.floor((f - ding) / 8) % 2 === 0 ? 1 : 0.3) : 0;
    return {
      node: <RoomScene cam={cam} st={roomEve(f)} naif={{ f, p, face, hands: { R: 'relaxed', L: f > tap - 4 ? 'two' : 'relaxed' }, say }}
        front={blink > 0 && <g transform={`translate(${head[0] + 10} ${head[1] - 128})`} opacity={blink}>
          <circle r={13} fill={B.blue} stroke={B.navy} strokeWidth={3} />
          {[-1, 0, 1].map((i) => <path key={i} d={`M${i * 22} -20 L${i * 32} -36`} stroke={B.blue} strokeWidth={6} strokeLinecap="round" />)}
        </g>} />,
      guards: [faceBox(cam, PR, p)],
    };
  },
};

// ——— SH02/03: inside his head — the office, proud; then the monitor «الواقع»: the logo is due at five ———
const sh02: Shot = {
  id: 'office', from: T.into, render: (f) => {
    const knot = (p: Pose): V => { const j = joints(p); return toWorld(PO, [j.neck[0] + 4, j.neck[1] + 46]); };
    const proud = k(f, [[T.into, 0.3], [w(2, 0), 1], [L1(3), 1]]);
    let body = mixPose(O_REST, O_PROUD, proud);
    body = { ...body, head: body.head + nodAt(f, w(3, 1), 6) + nodAt(f, w(3, 3), 6) };
    const p = arms(PO, f, body, undefined, [[T.into, null], [w(2, 0), knot(body), 14], [w(2, 4), null, 16]]);
    const angry = k(f, [[w(3, 8), 0], [w(3, 8) + 4, 1], [w(3, 8) + 30, 1], [w(3, 8) + 40, 0]], ease.lin);
    const face = faceAt(f, [[T.into, look('smile', [0.2, 0])], [w(3, 8) - 2, look('smile', [-0.95, 0.45]), 5], [w(3, 8) + 8, look('forcedSmile', [-0.9, 0.4]), 8], [L1(3) + 14, look('forcedSmile', [0, 0]), 10]]);
    const mon = OFFICE.monitor;
    const monC: V = [mon.x + mon.w / 2, mon.y + mon.h / 2];
    void monC;
    const cam: Cam = f < L0(3) - 4 ? camAt(f, [[T.into, { x: 540, y: 960, z: 1 }], [L0(3) - 4, { x: 530, y: 975, z: 1.06 }]]) : camAt(f, [[L0(3) - 4, { x: 360, y: 1000, z: 1.38 }], [T.monitor, { x: 375, y: 995, z: 1.45 }]]);
    return {
      node: <OfficeScene cam={cam} st={{ rating: { lit: { angry } }, monitor: monitorRoom(f, roomEve(f)), t: f / 60 }}
        naif={{ f, p, face, hands: { R: 'relaxed', L: 'relaxed' } }} />,
      guards: [faceBox(cam, PO, p)],
    };
  },
};
// SH03: the monitor «الواقع», full frame: his real desk, the empty logo, the note «التسليم 5:00»
const sh03: Shot = {
  id: 'reality', from: T.monitor, render: (f) => {
    const glow = k(f, [[w(4, 6) - 2, 0], [w(4, 6) + 6, 1], [w(4, 6) + 50, 0]]);
    const z = k(f, [[T.monitor, 1], [T.card1, 1.12]], ease.inOut); // a slow push toward the note, so the four seconds never sit still
    return {
      node: <MonitorInsert><g transform={`translate(237 144) scale(${z}) translate(-237 -144)`}>{monitorRoom(f, roomEve(f))}{glow > 0 && <rect x={204} y={118} width={66} height={52} rx={8} fill="none" stroke={B.red} strokeWidth={3} opacity={glow} />}</g></MonitorInsert>,
      guards: [MONITOR_BOX],
    };
  },
};

// ——— SH04: the first card; he reads it like a legal file and stamps it «قيد المعالجة» ———
const cardDrop = (f: number, t0: number, to: V = CARD) => {
  if (f < t0) return null;
  const u = clamp01((f - t0) / 16), sx = OFFICE.chute[0], sy = OFFICE.chute[1] + 40;
  const x = mix(sx, to[0], ease.out(u)), y = mix(sy, to[1], ease.in(u)) - Math.sin(u * Math.PI) * 50;
  const bounce = f > t0 + 16 ? -Math.abs(Math.sin(((f - t0 - 16) / 10) * Math.PI)) * 10 * Math.exp(-(f - t0 - 16) / 10) : 0;
  return { x, y: y + bounce, rot: (1 - u) * 14 };
};
const sh04: Shot = {
  id: 'card1', from: T.card1, render: (f) => {
    const drop = cardDrop(f, T.card1 + 8);
    const read = k(f, [[T.card1 + 18, 0], [T.card1 + 32, 1]]);
    let body = mixPose(O_REST, O_READ, read);
    body = { ...body, head: body.head + nodAt(f, w(5, 2), 8, 22) };
    const st = stampAct(PO, body, f, K.card1Stamp0, CARD);
    const p = st.active ? st.p : body;
    const face = faceAt(f, [[T.card1, look('neutral', [0.1, 0])], [T.card1 + 12, look('listening', [0.9, 0.35]), 5], [T.card1 + 34, look('determined', [0.85, 0.45]), 10]]);
    const cam: Cam = { x: 650, y: 995, z: 1.35 };
    return {
      node: <OfficeScene cam={cam} st={{ stampHome: !st.holding, chutePuff: k(f, [[T.card1, 0], [T.card1 + 8, 1], [T.card1 + 22, 0]]), queue: 1, monitor: monitorRoom(f, roomEve(f)), t: f / 60 }}
        naif={{ f, p, face, hands: { R: 'relaxed', L: st.grip ? 'grip' : 'relaxed' }, hold: st.stamp ? { L: st.stamp } : undefined, upright: { L: true } }}
        cards={drop && <g transform={`translate(${drop.x} ${drop.y}) rotate(${drop.rot})`}><Card text="ليش ما رديت على رسالتي؟" stamp={{ text: 'قيد المعالجة', color: B.blue, p: st.imprint }} /></g>} />,
      guards: [faceBox(cam, PO, p), box(cam, CARD, 250, 176, 'card')],
    };
  },
};

// ——— SH05: the reply — typed, deleted, «هههه» in, out, back in ———
const D1 = 'آسف والله ما شفتها، كنت مشغول', D2 = 'هلا والله! آسف تأخرت', HA = ' هههه';
const draftAt = (f: number) => {
  if (f < w(6, 2)) return typed(D1, f, w(6, 0), 50);
  if (f < w(6, 3) - 4) return untype(D1, f, w(6, 2), 14);
  if (f < w(6, 4)) return typed(D2, f, w(6, 3) - 4, 26);
  if (f < w(6, 5)) return D2 + typed(HA, f, w(6, 4), 10);
  if (f < w(6, 6)) return D2 + untype(HA, f, w(6, 5), 8);
  return D2 + typed(HA, f, w(6, 6), 8);
};
const tapping = (f: number, on: boolean, ph = 0) => (on ? Math.max(0, Math.sin(f * 0.9 + ph)) : 0);
const sh05: Shot = {
  id: 'typing', from: T.type, render: (f) => {
    const typing = !(f > w(6, 2) && f < w(6, 3) - 4);
    return {
      node: <PhoneInsert t={f / 60} tapL={tapping(f, typing)} tapR={tapping(f, typing, 1.6)} screen={
        <ChatBig name="خالد" clock="3:59" draft={draftAt(f)} caret={Math.floor(f / 18) % 2 === 0}>
          <g transform="translate(340 130)"><Bubble text="ليش ما رديت على رسالتي؟" time="3:58" w={270} h={110} /></g>
        </ChatBig>} />,
      guards: [PHONE_BOX],
    };
  },
};

// ——— SH06a: forty-five minutes on the monitor's clock ———
const sh06a: Shot = {
  id: 'clock45', from: T.clock, render: (f) => {
    const m = k(f, [[w(7, 1) - 4, 0], [w(7, 3) + 10, 45]], ease.inOut);
    return {
      node: <MonitorInsert>{monitorRoom(f, roomEve(f, { minutes: m }), 'clock')}</MonitorInsert>,
      guards: [MONITOR_BOX],
    };
  },
};

// ——— SH06b: all of it deleted… «أبشر» ———
const sh06b: Shot = {
  id: 'abshir1', from: T.send, render: (f) => {
    const full = D2 + HA;
    const sent = f >= w(7, 5);
    const draft = sent ? '' : f < w(7, 4) ? full : f < w(7, 4) + 14 ? untype(full, f, w(7, 4), 14) : typed('أبشر', f, w(7, 4) + 16, 10);
    const pop = clamp01(settle(f, w(7, 5), 14));
    return {
      node: <PhoneInsert t={f / 60} tapL={tapping(f, f > w(7, 4) + 14 && !sent)} screen={
        <ChatBig name="خالد" clock="4:45" draft={draft} caret={!sent && Math.floor(f / 18) % 2 === 0} sendGlow={sent ? 1 : 0}>
          <g transform="translate(340 130)"><Bubble text="ليش ما رديت على رسالتي؟" time="3:58" w={270} h={110} /></g>
          {sent && <g transform={`translate(20 ${270 + (1 - pop) * 30})`} opacity={pop}><Bubble mine text="أبشر" time="4:45" w={150} h={84} size={34} /></g>}
        </ChatBig>} />,
      guards: [PHONE_BOX],
    };
  },
};

// ——— SH06c: the rating box: neutral. A silent wince ———
const sh06c: Shot = {
  id: 'wince', from: T.wince, render: (f) => {
    const t0 = T.wince;
    let body = mixPose(O_REST, pose({ ...O_REST, turn: -0.25, body: 0.15, head: 6, bob: 4, lean: -2 }), k(f, [[t0 + 10, 0], [t0 + 24, 1]]));
    const phoneHand: V = toWorld(PO, [-40, -170]);
    const p = arms(PO, f, body, [[t0, phoneHand]]);
    const face = faceAt(f, [[t0, look('smile', [0.2, 0.2])], [t0 + 4, look('smile', [-0.95, 0.45]), 4], [t0 + 20, look('embarrassed', [-0.8, 0.5]), 10], [t0 + 60, look('forcedSmile', [-0.2, 0.2]), 14]]);
    const lit = k(f, [[t0 + 8, 0], [t0 + 12, 1], [t0 + 70, 1], [t0 + 84, 0.3]], ease.lin);
    const cam: Cam = { x: 340, y: 1010, z: 1.4 };
    return {
      node: <OfficeScene cam={cam} st={{ rating: { lit: { neutral: lit }, press: { neutral: lit > 0.9 ? 1 : 0 } }, monitor: monitorRoom(f, roomEve(f, { minutes: 45 })), t: f / 60 }}
        naif={{ f, p, face, hands: { R: 'grip', L: 'relaxed' }, hold: { R: inFist(PO, p, 'R', <Phone w={70} />, 0, 0) }, upright: { R: true } }} />,
      guards: [faceBox(cam, PO, p), box(cam, [OFFICE.rating[0], OFFICE.rating[1] - 56], 200, 120, 'rating')],
    };
  },
};

// ——— SH07: the second card says the opposite; a card in each hand, eyes back and forth ———
export const holdCard = (P: Place, p: Pose, side: 'R' | 'L', node: React.ReactNode) =>
  inFist(P, p, side, node, side === 'R' ? 100 : -100, 70);
const CARD1 = (pp = 1) => <Card text="ليش ما رديت على رسالتي؟" stamp={{ text: 'قيد المعالجة', color: B.blue, p: pp }} />;
const CARD2 = <Card text="ليش رديت بسرعة؟ فاضي؟" seed={2} />;
const sh07: Shot = {
  id: 'card2', from: T.card2, render: (f) => {
    const t0 = T.card2, drop = cardDrop(f, t0 + 8);
    const grabT = t0 + 30;
    const leftC: V = [360, 1110], rightC: V = [690, 1110];
    const sway = f < L0(8) ? 0 : f < w(8, 2) ? 0.5 : f < w(8, 3) ? -0.45 : f < w(8, 4) ? 0.5 : f < L1(8) + 8 ? -0.45 : 0;
    const keys: [number, number][] = [[L0(8) - 1, 0], [L0(8) + 8, 0.5], [w(8, 2), 0.5], [w(8, 2) + 8, -0.45], [w(8, 3), -0.45], [w(8, 3) + 7, 0.5], [w(8, 4), 0.5], [w(8, 4) + 6, -0.45], [L1(8) + 8, -0.45], [L1(8) + 18, 0]];
    const swayS = k(f, keys);
    const body0 = pose({ ...O_FRONT, turn: 0.06 + swayS * 0.7, head: 4, lean: swayS * 4 });
    const p = arms(PO, f, body0, [[t0, leftC]], [[t0, null], [grabT - 14, [CARD[0] - 90, CARD[1] + 20], 14], [grabT + 4, rightC, 18]]);
    const holding2 = f >= grabT;
    const lk: [number, number] = [sway > 0 ? 0.9 : sway < 0 ? -0.9 : 0, 0.4];
    const face = faceAt(f, [[t0, look('determined', [0.5, 0.3])], [t0 + 10, look('listening', [0.9, 0.4]), 5], [L0(8), look('anxious', lk), 6], [w(8, 2), look('anxious', lk), 4], [w(8, 3), look('anxious', lk), 4], [w(8, 4), look('anxious', lk), 4], [L1(8) + 8, look('anxious', [0, 0]), 6]]);
    const cam: Cam = { x: 540, y: 1000, z: 1.3 };
    return {
      node: <OfficeScene cam={cam} armsFront st={{ chutePuff: k(f, [[t0, 0], [t0 + 8, 1], [t0 + 22, 0]]), queue: 2, queueFlash: f > t0 + 8 && f < t0 + 20 ? 1 : 0, monitor: monitorRoom(f, roomEve(f, { minutes: 46 })), t: f / 60 }}
        naif={{ f, p, face, hands: { R: 'grip', L: holding2 || f > grabT - 6 ? 'grip' : 'relaxed' }, hold: { R: holdCard(PO, p, 'R', CARD1()), L: holding2 ? holdCard(PO, p, 'L', CARD2) : undefined }, upright: { R: true, L: true } }}
        cards={!holding2 && drop && <g transform={`translate(${drop.x} ${drop.y}) rotate(${drop.rot})`}>{CARD2}</g>}
        front={null} />,
      guards: [faceBox(cam, PO, p), box(cam, [leftC[0] - 100, leftC[1] - 70], 250, 176, 'card'), box(cam, [rightC[0] + 100, rightC[1] - 70], 250, 176, 'card')],
    };
  },
};

// ——— SH08: an official policy (the number is on the paper), the pen over the shoulder, «معتمد»; the box says no ———
const sh08: Shot = {
  id: 'policy', from: T.policy, render: (f) => {
    const t0 = T.policy, writeEnd = K.policyWriteEnd, toss = K.policyToss, stamp0 = K.policyStamp0, wag0 = K.wag0;
    const sheet: V = [CARD[0], CARD[1] - 6];
    const scrib = (f - t0) * 0.55;
    const penAt: V = [sheet[0] - 60 + Math.sin(scrib) * 70, sheet[1] - 10 + Math.cos(scrib * 1.7) * 10];
    const front = k(f, [[wag0 - 12, 0], [wag0 + 6, 1]]);
    const body = mixPose(O_READ, pose({ ...O_FRONT, head: -6, lean: -3, turn: 0.12 }), front);
    const st = stampAct(PO, body, f, stamp0, sheet, 1.3);
    let p = st.active ? st.p : arms(PO, f, body, undefined, [[t0, penAt], [writeEnd, penAt], [toss, [480, 860], 10], [toss + 16, null, 12]]);
    if (f < writeEnd) p = arms(PO, f, body, undefined, [[t0, penAt]]);
    // the rule: right index finger up, wagging on «لا قبل… ولا بعد»
    const wag = f > wag0 ? Math.sin((f - wag0) / 7) * 18 : 0;
    p = arms(PO, f, p, [[wag0 - 10, null], [wag0 + 4, toWorld(PO, [-90 + wag * 0.35, -262]), 12, 1], [L1(10) + 20, toWorld(PO, [-90, -262]), 14, 1], [L1(10) + 40, null, 16]]);
    const buzz1 = L1(10) + 10, buzz2 = L1(10) + 32;
    const angry = Math.max(k(f, [[buzz1, 0], [buzz1 + 3, 1], [buzz1 + 14, 0]], ease.lin), k(f, [[buzz2, 0], [buzz2 + 3, 1], [buzz2 + 30, 1], [buzz2 + 50, 0.2]], ease.lin));
    const face = faceAt(f, [[t0, look('determined', [0.8, 0.5])], [toss, look('smug', [0.3, 0]), 6], [wag0, look('smug', [0, 0]), 8], [buzz1 + 2, look('forcedSmile', [-0.9, 0.4]), 4], [buzz2 + 4, look('forcedSmile', [-0.95, 0.45]), 4]]);
    const cam = camAt(f, [[t0, { x: 650, y: 990, z: 1.35 }], [wag0 - 10, { x: 650, y: 990, z: 1.35 }], [wag0 + 30, { x: 420, y: 990, z: 1.3 }]]);
    const penFly = f > toss ? clamp01((f - toss) / 24) : 0;
    const rightFront = front > 0.5;
    void rightFront;
    return {
      node: <OfficeScene cam={cam} armsFront={front > 0.5} st={{ stampHome: !st.holding, rating: { lit: { angry }, press: { angry: angry > 0.9 ? 1 : 0 } }, queue: 2, monitor: monitorRoom(f, roomEve(f, { minutes: 50 })), t: f / 60 }}
        naif={{ f, p, face, hands: { R: f > wag0 - 4 && f < L1(10) + 34 ? 'point' : 'relaxed', L: st.grip ? 'grip' : f < toss ? 'pen' : 'relaxed' },
          hold: st.stamp ? { L: st.stamp } : f < toss ? { L: <g transform="rotate(-30)"><rect x={-3} y={-30} width={6} height={44} rx={3} fill={B.blue} stroke="#2A2F3A" strokeWidth={1.4} /></g> } : undefined, upright: { L: true } }}
        cards={<g>
          <g transform="translate(330 1172) rotate(-4)"><rect x={-90} y={-8} width={180} height={12} rx={3} fill={B.white} stroke="#2A2F3A" strokeWidth={2.4} /></g>
          <g transform={`translate(${sheet[0]} ${sheet[1]})`}><Policy written={k(f, [[w(9, 0), 0], [writeEnd, 1]], ease.lin)} stampP={st.imprint} /></g>
        </g>}
        front={<>
          {penFly > 0 && penFly < 1 && <g transform={`translate(${mix(560, 160, penFly)} ${mix(860, 300, penFly) - Math.sin(penFly * Math.PI) * 200}) rotate(${penFly * 720})`}><rect x={-6} y={-40} width={12} height={80} rx={6} fill={B.blue} stroke="#2A2F3A" strokeWidth={3} /></g>}
          {rightFront && null}
        </>} />,
      guards: [faceBox(cam, PO, p), box(cam, sheet, 300, 220, 'policy')],
    };
  },
};

// ——— SH09: the comparisons department opens; the chute bursts ———
const FLY = Array.from({ length: 46 }, (_, i) => ({ a: -150 + hash(i * 3) * 120, v: 14 + hash(i * 7) * 18, d: hash(i * 11) * 40, s: 0.7 + hash(i) * 0.5, spin: (hash(i * 5) - 0.5) * 30 }));
const flyerAt = (i: number, f: number, t0: number): V | null => {
  const q = FLY[i], s = (f - t0 - q.d) / 60;
  if (s < 0) return null;
  const a = (q.a * Math.PI) / 180;
  const x = OFFICE.chute[0] + Math.cos(a) * q.v * 60 * s * 0.6, y = OFFICE.chute[1] + 40 - Math.sin(a) * q.v * 60 * s * 0.6 * -1 + 900 * s * s;
  return [x, Math.min(y, 1175 - hash(i) * 30)];
};
const READ_CARDS: [string, V, number][] = [['ولد خالتك اشترى بيت!', [235, 920], -6], ['ليش ما نزلت صور السفر؟', [800, 800], 5], ['ليش نزلت صور السفر؟', [770, 1060], -3]];
const sh09: Shot = {
  id: 'flood', from: T.flood, render: (f) => {
    const t0 = T.flood;
    const dart = Math.sin((f - t0) / 9);
    const body = pose({ ...O_REST, lean: dart * 6, turn: dart * 0.6, body: 0.2 + dart * 0.15, head: 4 });
    const hitX = Math.floor((f - t0) / 12) % 2 ? 690 : 600, down = (f - t0) % 12 < 6;
    const stampQ: V = [hitX, down ? 1112 : 1040];
    const p = arms(PO, f, body, [[t0, toWorld(PO, [-60 + dart * 20, -250 - Math.abs(dart) * 20])]], [[t0, stampQ, 4]]);
    const face = faceAt(f, [[t0, look('anxious', [dart, -0.2])]]);
    const queue = Math.round(k(f, [[t0 + 4, 2], [L1(11), 99]], ease.in));
    const shake = f < t0 + 30 ? (hash(f) - 0.5) * 10 : 0;
    const cam: Cam = { x: 540 + shake, y: 960 + shake * 0.6, z: 1 };
    const stuck = (i: number) => clamp01((f - t0 - 8 - i * 9) / 10);
    return {
      node: <OfficeScene cam={cam} st={{ stampHome: false, queue, queueFlash: Math.floor(f / 4) % 2, chutePuff: 1, monitor: monitorRoom(f, roomEve(f, { minutes: 58 }), 'clock'), t: f / 60 }}
        naif={{ f, p, face, hands: { R: 'open', L: 'grip' }, hold: { L: inFist(PO, p, 'L', <g transform={`scale(${STAMP_S})`}><StampTool /></g>) }, upright: { L: true } }}
        cards={<g>
          {FLY.map((q, i) => { const at = flyerAt(i, f, t0); return at && <g key={i} transform={`translate(${at[0]} ${at[1]}) rotate(${(f - t0) * q.spin * 0.1})`}><Flyer seed={i} s={q.s} /></g>; })}
          {READ_CARDS.map(([t, at, r], i) => stuck(i) > 0 && <g key={t} transform={`translate(${mix(OFFICE.chute[0], at[0], ease.out(stuck(i)))} ${mix(OFFICE.chute[1], at[1], ease.out(stuck(i)))}) rotate(${r}) scale(${mix(0.4, 1.25, stuck(i))})`}><Card text={t} seed={i + 4} size={30} /></g>)}
        </g>} />,
      guards: [faceBox(cam, PO, p), ...READ_CARDS.map(([, at]) => box(cam, at, 312, 220, 'card'))],
    };
  },
};

// ——— SH10: promoted at last: «مدير قسم الزعل»; then buried; only the stamping hand is left ———
const pileTop = (f: number) => k(f, [[w(12, 2), OFFICE.counterY], [w(12, 8) + 10, 740]], ease.inOut);
const sh10: Shot = {
  id: 'promo', from: T.promo, render: (f) => {
    const flip = k(f, [[w(12, 0), 0], [w(12, 0) + 20, 1]]);
    const proud = k(f, [[w(12, 0) + 6, 0], [w(12, 1), 1], [w(12, 5), 1], [w(12, 7), 0.3]]);
    const body = mixPose(pose({ ...O_REST, head: 14, turn: 0.1, body: 0.15 }), O_PROUD, proud);
    const knot = (): V => { const j = joints(body); return toWorld(PO, [j.neck[0] + 4, j.neck[1] + 46]); };
    const p = arms(PO, f, body, undefined, [[T.promo, null], [w(12, 1), knot(), 12], [w(12, 3), null, 14]]);
    const face = faceAt(f, [[T.promo, look('anxious', [0.3, 0])], [w(12, 0) + 2, look('surprised', [0, 0.9]), 5], [w(12, 1), look('smile', [0.1, 0.2]), 10], [w(12, 5), look('anxious', [0, -0.8]), 10]]);
    const top = pileTop(f);
    const hand = f > L1(12) + 2;
    const stampY = hand ? (Math.floor((f - L1(12)) / 14) % 2 ? 790 : 730) : 0;
    const cam: Cam = camAt(f, [[L1(12) - 6, { x: 520, y: 1035, z: 1.3 }], [L1(12) + 20, { x: 600, y: 860, z: 1.75 }]]);
    const n = 70;
    return {
      node: <OfficeScene cam={cam} st={{ plate: { a: 'نايف · خدمة العملاء', b: 'مدير قسم الزعل', flip, glow: k(f, [[w(12, 0) + 10, 0], [w(12, 0) + 20, 1], [w(12, 3), 0]]) }, queue: 99, monitor: monitorRoom(f, roomEve(f, { minutes: k(f, [[w(12, 2), 58], [w(12, 8), 60]], ease.lin) }), 'clock'), t: f / 60 }}
        naif={{ f, p, face, hands: { R: 'relaxed', L: 'relaxed' } }}
        cards={null}
        front={<g>
          {Array.from({ length: n }, (_, i) => {
            const fx = 160 + hash(i * 13) * 720, base = OFFICE.counterY - 10 - hash(i * 3) * (OFFICE.counterY - top) * (1 - Math.abs(fx - 520) / 900);
            const fall = clamp01((f - w(12, 2) - hash(i * 17) * 70) / 14);
            const y = mix(-200, base, ease.in(fall));
            return fall > 0 && <g key={i} transform={`translate(${fx} ${y}) rotate(${(hash(i) - 0.5) * 70})`}><Flyer seed={i + 50} s={1.1} /></g>;
          })}
          {hand && <g>
            <path d={`M612 ${top + 40} L612 ${stampY + 46}`} stroke="#2A2F3A" strokeWidth={34} strokeLinecap="round" />
            <path d={`M612 ${top + 40} L612 ${stampY + 46}`} stroke={B.blue} strokeWidth={25} strokeLinecap="round" />
            <g transform={`translate(612 ${stampY}) scale(2.755)`}><rect x={-14} y={8} width={28} height={9} rx={2} fill={B.navy2} stroke="#2A2F3A" strokeWidth={1.6} /><rect x={-3.5} y={-3} width={7} height={11} fill={B.greyMid} stroke="#2A2F3A" strokeWidth={1.4} /><circle cx={0} cy={-9} r={7.5} fill={B.navy3} stroke="#2A2F3A" strokeWidth={1.6} /><ellipse cx={0} cy={1} rx={8} ry={7} fill="#F2E2DC" stroke="#2A2F3A" strokeWidth={1.6} /></g>
            {f > L1(12) + 14 && <g transform={`translate(650 ${790 + 92})`}><Imprintish /></g>}{f > L1(12) + 42 && <g transform={`translate(560 ${790 + 120}) rotate(10)`}><Imprintish /></g>}
          </g>}
        </g>} />,
      guards: hand ? [box(cam, [612, stampY + 40], 120, 160, 'hand')] : [faceBox(cam, PO, p), box(cam, OFFICE.plate, 420, 72, 'plate')],
    };
  },
};
const Imprintish: React.FC = () => <g transform="rotate(-8)"><rect x={-50} y={-24} width={100} height={48} rx={10} fill="none" stroke={B.blue} strokeWidth={5} /><text x={0} y={12} textAnchor="middle" fontFamily="Tajawal, sans-serif" fontWeight={800} fontSize={34} fill={B.blue}>تم</text></g>;

// ——— SH11: back in the room. The real phone: the only client who pays ———
const PHONE_READ: V = [470, 1060];
const sh11: Shot = {
  id: 'message', from: T.out, render: (f) => {
    const pick = w(13, 3), up = w(13, 4);
    const p0 = mixPose(S_SLUMP, pose({ ...S_SLUMP, lean: 6, head: 8, turn: 0.35 }), k(f, [[w(13, 2), 0], [w(13, 3), 1]]));
    const p = arms(PR, f, p0, undefined, [[T.out, null], [pick - 10, [ROOM.phone[0], ROOM.phone[1] - 10], 12], [up, PHONE_READ, 16]]);
    const held = f >= pick + 2;
    const face = faceAt(f, [[T.out, { ...EXPRESSIONS.neutral, open: 0.55, mouth: -0.2, look: [0.6, 0.2] }], [w(13, 1), look({ ...EXPRESSIONS.neutral, open: 0.7, mouth: -0.2 }, [0.4, 0.8]), 5], [up, look('anxious', [0.2, 0.4]), 8]]);
    const cam: Cam = { x: 470, y: 1040, z: 1.45 };
    return {
      node: <RoomScene cam={cam} st={roomEve(f, { minutes: 7, hours: 5, phoneHome: !held, phoneBuzz: !held && f > L0(13) ? 1 : 0, phoneLit: 1 })}
        naif={{ f, p, face, hands: { R: 'relaxed', L: held ? 'grip' : 'relaxed' }, hold: held ? { L: inFist(PR, p, 'L', <Phone w={64} glow={0.5} />, 0, 20) } : undefined, upright: { L: true } }} />,
      guards: [faceBox(cam, PR, p)],
    };
  },
};
const sh11b: Shot = {
  id: 'client', from: T.msg, render: (f) => {
    const m1 = clamp01(settle(f, T.msg + 6, 14)), m2 = clamp01(settle(f, w(13, 7), 14));
    return {
      node: <PhoneInsert t={f / 60} buzz={f < T.msg + 20 ? 0.6 : 0} screen={
        <ChatBig name="مقهى غيمة" avatar={B.blue} clock="5:07">
          <g transform={`translate(340 ${130 + (1 - m1) * 30})`} opacity={m1}><Bubble text="فات موعد التسليم." time="5:07" w={250} h={92} /></g>
          {m2 > 0 && <g transform={`translate(340 ${240 + (1 - m2) * 30})`} opacity={m2}><Bubble text="ننتظره بكرة 9 الصبح." time="5:07" w={280} h={92} /></g>}
        </ChatBig>} />,
      guards: [PHONE_BOX],
    };
  },
};
// SH11c: silence. The blank logo, the clock. Nothing is added to fill it.
const sh11c: Shot = {
  id: 'silence', from: T.beat, render: (f) => {
    const t0 = T.beat;
    const p0 = pose({ ...S_SLUMP, lean: 8, head: k(f, [[t0 + 36, 6], [t0 + 46, -6], [t0 + 74, 12]]), turn: 0.5 });
    const p = arms(PR, f, p0, undefined, [[t0, [480, 1200]]]);
    const face = faceAt(f, [[t0, look('anxious', [0.3, 0.5])], [t0 + 8, look('hurt', [0.95, 0.25]), 4], [t0 + 38, look('hurt', [0.75, -0.95]), 4], [t0 + 74, look('sad', [0, 0.6]), 12]]);
    const cam: Cam = { x: 610, y: 880, z: 1.15 };
    return {
      node: <RoomScene cam={cam} st={roomEve(f, { minutes: 7, hours: 5, phoneHome: false })}
        naif={{ f, p, face, hands: { R: 'relaxed', L: 'grip' }, hold: { L: inFist(PR, p, 'L', <g transform="rotate(90)"><Phone w={64} /></g>, 0, 0) }, upright: { L: true } }} />,
      guards: [faceBox(cam, PR, p)],
    };
  },
};

// ——— SH12: close. He served everyone today — except the one thing he chose himself ———
const sh12: Shot = {
  id: 'cu', from: T.cu, render: (f) => {
    const shut = w(14, 3), inhale = w(14, 5), exhale = w(14, 7), open = L1(14);
    const p = pose({ ...S_SLUMP, lean: 6, head: k(f, [[T.cu, 10], [exhale, 14], [open + 6, 2]]), turn: 0.38, breath: k(f, [[inhale, 0], [inhale + 16, 1], [exhale, 1], [exhale + 24, 0]]) });
    const lids = k(f, [[shut, 1], [shut + 14, 0.08], [open, 0.08], [open + 10, 1]]);
    const face = faceAt(f, [[T.cu, look('hurt', [0.2, 0.4])], [open, look('determined', [0.4, 0.1]), 12]]);
    const cam: Cam = { x: 360, y: 990, z: 2.45 };
    return {
      node: <RoomScene cam={cam} st={roomEve(f, { minutes: 8, hours: 5, phoneHome: false })} naif={{ f, p, face: { ...face, open: face.open * lids }, hands: { R: 'relaxed', L: 'relaxed' }, blink: 0 }} />,
      guards: [faceBox(cam, PR, p)],
    };
  },
};

// ——— SH13/14: next morning. Two cards — he catches one in each hand, weighs them, keeps the useful one ———
const CARD_A = (pp = 0) => <Card text="الخط صغير على الجوال" tag="العميل" tagColor={B.blue} stamp={{ text: 'نشتغل عليها', color: B.green, p: pp }} seed={7} />;
const CARD_B = <Card text="ولد خالتك اشترى سيارة!" seed={8} />;
const roomMorning = (f: number, o: Partial<RoomState> = {}): RoomState => ({ morning: 1, hours: 8, minutes: 30, drawn: 1, type: 0.55, t: f / 60, ...o });
const catchPath = (f: number, t0: number, to: V, arc = 160, y0 = OFFICE.chute[1] + 40): V | null => {
  if (f < t0) return null;
  const u = clamp01((f - t0) / 18);
  return [mix(OFFICE.chute[0], to[0], ease.out(u)), mix(y0, to[1], u) - Math.sin(u * Math.PI) * arc];
};
const sh13: Shot = {
  id: 'morning', from: T.morning, render: (f) => {
    const { cA, cB, catchA, catchB } = K;
    const leftC: V = [360, 1110], rightC: V = [690, 1110];
    const weigh = Math.sin(clamp01((f - L1(15)) / 50) * Math.PI) * 30;
    const body = pose({ ...O_FRONT, turn: k(f, [[L1(15), 0.06], [L1(15) + 14, 0.5], [L1(15) + 34, -0.4], [w(16, 0), 0.45]]), head: 4 });
    const slap = K.slap;
    const stamp = stampAct(PO, mixPose(body, O_READ, k(f, [[slap - 10, 0], [slap, 1]])), f, K.aStamp0, CARD, 1.25);
    let p = arms(PO, f, body, [[T.morning, null], [catchB - 10, [leftC[0], leftC[1] + weigh * 0.4], 10], [L1(15), [leftC[0], leftC[1] + weigh], 4], [w(16, 3), [400, 1150], 16]],
      [[T.morning, null], [catchA - 10, rightC, 10], [L1(15), [rightC[0], rightC[1] - weigh], 4], [slap, [CARD[0] - 80, CARD[1] + 30], 14], [slap + 18, null, 12]]);
    if (stamp.active) p = { ...p, L: stamp.p.L, lean: stamp.p.lean, turn: stamp.p.turn, body: stamp.p.body, head: stamp.p.head };
    const aFly = f < catchA ? catchPath(f, cA, rightC, -30, 1020) : null, bFly = f < catchB ? catchPath(f, cB, leftC, -70, 1110) : null;
    const aHeld = f >= catchA && f < slap + 14, aOnStand = f >= slap + 14, bHeld = f >= catchB;
    const face = faceAt(f, [[T.morning, look('calm', [0.1, 0])], [cA + 4, look('surprised', [0.8, -0.4]), 4], [catchB + 4, look('calm', [0, 0]), 10], [L1(15), look('thinking', [0.9, 0.4]), 6], [L1(15) + 22, look('thinking', [-0.9, 0.4]), 5], [w(16, 0), look('calm', [0.9, 0.4]), 6], [w(16, 3), look('determined', [0.8, 0.5]), 8]]);
    const cam: Cam = { x: 545, y: 1000, z: 1.3 };
    return {
      node: <OfficeScene cam={cam} armsFront st={{ stampHome: !stamp.holding, queue: 1, chutePuff: k(f, [[cA - 6, 0], [cA, 1], [cB + 10, 1], [cB + 24, 0]]), monitor: monitorRoom(f, roomMorning(f), 'desk', { p: S_WORK, face: look('calm', [0.7, 0.2]) }), t: f / 60 }}
        naif={{ f, p, face, hands: { R: bHeld ? 'grip' : 'open', L: stamp.grip ? 'grip' : aHeld ? 'grip' : 'open' },
          hold: { R: bHeld ? holdCard(PO, p, 'R', CARD_B) : undefined, L: stamp.stamp ?? (aHeld ? holdCard(PO, p, 'L', CARD_A()) : undefined) }, upright: { R: true, L: true } }}
        cards={<g>
          {aOnStand && <g transform={`translate(${CARD[0]} ${CARD[1]})`}>{CARD_A(stamp.imprint)}</g>}
          {aFly && <g transform={`translate(${aFly[0]} ${aFly[1]}) rotate(${(f - cA) * 1.5})`}>{CARD_A()}</g>}
          {bFly && <g transform={`translate(${bFly[0]} ${bFly[1]}) rotate(${-(f - cB) * 1.5})`}>{CARD_B}</g>}
        </g>} />,
      guards: [faceBox(cam, PO, p), box(cam, aOnStand ? CARD : [rightC[0] + 100, rightC[1] - 70], 250, 176, 'cardA')],
    };
  },
};
const sh14b: Shot = {
  id: 'abshir2', from: T.abshir, render: (f) => {
    const typedA = typed('أبشر', f, w(17, 1) - 8, 6), sent = f >= w(17, 1) + 2;
    const pop = clamp01(settle(f, w(17, 1) + 2, 14)), pill = clamp01(settle(f, w(17, 3) - 4, 12));
    return {
      node: <PhoneInsert t={f / 60} tapL={tapping(f, f > w(17, 1) - 10 && !sent)} screen={
        <ChatBig name="مقهى غيمة" avatar={B.blue} clock="8:31" draft={sent ? '' : typedA} sendGlow={sent ? 1 : 0}>
          <g transform="translate(340 130)"><Bubble text="ننتظره بكرة 9 الصبح." time="5:07" w={280} h={92} /></g>
          <g transform="translate(340 240)"><Bubble text="الخط صغير على الجوال" time="8:30" w={280} h={92} /></g>
          {sent && <g transform={`translate(20 ${370 + (1 - pop) * 30})`} opacity={pop}><Bubble mine text="أبشر" time="8:31" w={150} h={84} size={34} /></g>}
          {pill > 0 && <g transform={`translate(${250} ${412}) scale(${mix(0.6, 1, pill)})`}><Pill text="2 ث" o={pill} w={110} size={28} /></g>}
        </ChatBig>} />,
      guards: [PHONE_BOX],
    };
  },
};

// ——— SH15: the room, morning: bigger type, sent ———
const sh15: Shot = {
  id: 'fix', from: T.fix, render: (f) => {
    const t0 = T.fix, grow = k(f, [[t0 + 14, 0.55], [t0 + 50, 1]]), click = K.fixClick;
    const body = pose({ ...S_WORK, lean: 8, head: 2, turn: 0.55 });
    const p = arms(PR, f, body, undefined, [[t0, null], [click - 8, [600, 1180], 8], [click, [600, 1196], 4], [click + 8, null, 10]]);
    const face = faceAt(f, [[t0, look('determined', [0.8, 0.2])], [click + 30, look('relieved', [0.8, 0.2]), 12]]);
    const cam: Cam = { x: 600, y: 990, z: 1.25 };
    return {
      node: <RoomScene cam={cam} st={roomMorning(f, { minutes: k(f, [[t0, 50], [t0 + 100, 52]], ease.lin), type: grow, sent: k(f, [[click + 4, 0], [click + 34, 1]], ease.lin) })} naif={{ f, p, face, hands: { R: 'relaxed', L: f > click - 10 && f < click + 10 ? 'point' : 'relaxed' } }} />,
      guards: [faceBox(cam, PR, p), box(cam, [ROOM.laptop[0], ROOM.laptop[1] - 160], 330, 220, 'logo')],
    };
  },
};

// ——— SH16/17: the comparison: read, filed. The box goes off again — a mug on it. «وأنت… شغّال عند مين؟» ———
const sh16: Shot = {
  id: 'archive', from: T.archive, render: (f) => {
    const t0 = T.archive, drop = K.binDrop;
    const binTop: V = [OFFICE.archive[0], OFFICE.archive[1] + BIN_TOP];
    const readC: V = [400, 1040];
    const { buzz0, mugUp, step, put, back } = K;
    const stepX = k(f, [[step - 6, 0], [step + 18, -110], [put + 8, -110], [back + 16, 0]]);
    const P: Place = { ...PO, x: PO.x + stepX };
    const shrug = f > w(18, 3) && f < w(18, 3) + 26 ? Math.sin(((f - w(18, 3)) / 26) * Math.PI) : 0;
    const settleBreath = f > back + 20 ? Math.sin((f - back) / 26) * 2.2 : 0;
    const body = pose({ ...O_FRONT, breath: f > back + 20 ? 0.5 + 0.5 * Math.sin((f - back) / 26) : 0, turn: k(f, [[t0, 0.1], [w(18, 0), -0.35], [drop + 20, -0.2], [buzz0 + 2, -0.5], [back + 20, 0.05]]) + settleBreath * 0.01, head: 6 - shrug * 6 + settleBreath, bob: -shrug * 6 + (f > step && f < back + 16 ? Math.abs(Math.sin((f - step) / 6)) * 4 : 0) });
    const mugQ: V = [OFFICE.mug[0] + 22, OFFICE.mug[1] - 40], onBox: V = [OFFICE.rating[0] + 22, OFFICE.rating[1] - 112 - 40];
    const p = arms(P, f, body, [[t0, [440, 1150]], [w(18, 0), readC, 16], [drop - 8, [binTop[0], binTop[1] - 60], 12], [drop + 6, null, 16], [mugUp - 10, mugQ, 12], [step + 4, [mugQ[0], mugQ[1] - 40], 10], [put, onBox, 14], [put + 10, null, 16]]);
    const holdingB = f < drop;
    const bFall = f >= drop ? clamp01((f - drop) / 14) : 0;
    const holdingMug = f >= mugUp && f < put;
    const angry = f > buzz0 ? (Math.floor((f - buzz0) / 7) % 2 ? 1 : 0.4) * (f < put ? 1 : 0.25) : 0;
    const reply = clamp01(settle(f, back + 30, 12));
    const face = faceAt(f, [[t0, look('calm', [-0.3, 0.3])], [w(18, 0) - 4, look('thinking', [-0.8, 0.3]), 6], [w(18, 4), look('calm', [-0.6, 0.3]), 8], [buzz0 + 2, look('calm', [-0.9, 0.3]), 6], [back + 20, look('calm', [0, 0]), 10], [L0(19), look('smile', [0, 0]), 10], [w(19, 3), { ...EXPRESSIONS.smile, browY: 0.5, look: [0, 0] }, 8]]);
    const cam = camAt(f, [[t0, { x: 420, y: 1000, z: 1.3 }], [back + 10, { x: 420, y: 1000, z: 1.3 }], [L0(19), { x: 470, y: 990, z: 1.45 }]]);
    return {
      node: <OfficeScene cam={cam} place={P} armsFront st={{ rating: { lit: { angry }, press: { angry: angry > 0.9 && f < put ? 1 : 0 } }, mugHome: f < mugUp, mugOnBox: f >= put, queue: 2,
        monitor: reply > 0 ? <g><rect width={340} height={250} fill="#E9EEF4" /><g transform={`translate(325 ${60 + (1 - reply) * 20})`} opacity={reply}><Bubble text="وصل… ممتاز!" time="8:53" w={250} h={92} size={34} /></g></g> : monitorRoom(f, roomMorning(f, { minutes: 52, type: 1, sent: 1 })),
        inBin: bFall > 0 && bFall < 1 ? <g transform={`translate(${binTop[0]} ${mix(binTop[1] - 70, binTop[1] + 60, ease.in(bFall))}) rotate(${bFall * 30}) scale(0.7)`}>{CARD_B}</g> : null, t: f / 60 }}
        naif={{ f, p, face, hands: { R: holdingB || holdingMug ? 'grip' : 'relaxed', L: 'relaxed' },
          hold: { R: holdingB ? holdCard(P, p, 'R', CARD_B) : holdingMug ? inFist(P, p, 'R', <g transform="scale(2.3)"><MugInHand /></g>, -40, -46) : undefined }, upright: { R: true } }}
        cards={<g transform={`translate(${CARD[0]} ${CARD[1]})`}>{CARD_A(1)}</g>} />,
      guards: [faceBox(cam, P, p), ...(holdingB ? [box(cam, [readC[0] - 100, readC[1] - 70], 250, 176, 'cardB')] : []), box(cam, [OFFICE.rating[0], OFFICE.rating[1] - 80], 200, 170, 'rating')],
    };
  },
};
const MugInHand: React.FC = () => <g><path d="M-14 -36 L14 -36 L12 0 Q0 4 -12 0 Z" fill={B.blue} stroke="#2A2F3A" strokeWidth={2.4} /><path d="M14 -28 q10 0 9 10 q-1 8 -10 7" fill="none" stroke="#2A2F3A" strokeWidth={2.4} /></g>;

/** Where the real Naif's head is on screen when the office closes back into it. */
export const IRIS_OUT: V = toScreen({ x: 470, y: 1040, z: 1.45 }, headAt(PR, S_SLUMP));

export const SHOTS: Shot[] = [sh01, sh02, sh03, sh04, sh05, sh06a, sh06b, sh06c, sh07, sh08, sh09, sh10, sh11, sh11b, sh11c, sh12, sh13, sh14b, sh15, sh16];
export const shotAt = (f: number) => { let i = 0; for (let j = 0; j < SHOTS.length; j++) if (SHOTS[j].from <= f) i = j; return i; };
export { TOTAL };
