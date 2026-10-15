import React from 'react';
import { keys, tween } from '@motion/index';
import { wordAt, wordEnd } from '../video/time';
import { HAND, Robot, RobotProps, V, clamp01, lerp, mix } from './kit';
import { BoomMic, Cable, Cards, Connector, Easel, G, HelperArm, Panel, PIN, Piece, Screw, Trolley, Wrench } from './props';
import { FgMic, Frame, FrontSet, OverheadSet, PodiumBack, RobotTop, RoomSet, seat } from './sets';
import { Caption, EndTitle } from './text';

/** Beats on the measured narration (reel seconds); every action is pinned to the word that names it. */
export const B = {
  stumble: wordAt('s01', 'تعثر'), conf: wordAt('s01', 'عقد'), s01end: wordEnd('s01', 'صحفيا'),
  tries: wordAt('s02', 'يحاول'), falls: wordAt('s02', 'تقع'), leaves: wordAt('s02', 'يترك'), goes: wordAt('s02', 'ويطلع'), explains: wordAt('s02', 'يشرح'),
  why1: wordAt('s03', 'ليش'), late: wordAt('s03', 'تأخر'), why2: wordAt('s03', 'وليش'), wrong: wordAt('s03', 'أخطأ'), why3: wordAt('s03', 'وليش', 1), people: wordAt('s03', 'الناس'), misread: wordAt('s03', 'غلط'),
  after: wordAt('s04', 'وبعد'), back: wordAt('s04', 'يرجع'), finds: wordAt('s04', 'يلقى'), left: wordAt('s04', 'تركه'),
  time: wordAt('s05', 'ومع'), readies: wordAt('s05', 'يجهز'), before: wordAt('s05', 'قبل'), tries2: wordAt('s05', 'يجرب'), solution: wordAt('s05', 'الحل'),
  even: wordAt('s06', 'حتى'), start: wordAt('s06', 'بدايته'), waits: wordAt('s06', 'تنتظر'), approval: wordAt('s06', 'موافقة'), folk: wordAt('s06', 'ناس'), know: wordAt('s06', 'تعرف'), s06end: wordEnd('s06', 'أصلا'),
  was: wordAt('s07', 'كان'), image: wordAt('s07', 'صورته'), before2: wordAt('s07', 'قبل'), piece: wordAt('s07', 'القطعة'),
  day: wordAt('s08', 'وفي'), broke: wordAt('s08', 'تعطل'),
  waited: wordAt('s09', 'انتظر'), crowd: wordAt('s09', 'الجمهور'),
  then: wordAt('s10', 'ثم'), noticed: wordAt('s10', 'انتبه'), most: wordAt('s10', 'أغلب'), empty: wordAt('s10', 'فاضية'),
  some: wordAt('s11', 'بعض'), head: wordAt('s11', 'رأسه'), rest: wordAt('s11', 'والباقي'), answer: wordAt('s11', 'جوابا'),
  problem: wordAt('s12', 'المشكلة'), crooked: wordAt('s12', 'معوجة'), lost: wordAt('s12', 'والوقت'), s12end: wordEnd('s12', 'رجع'),
  but: wordAt('s13', 'بس'), first: wordAt('s13', 'مرة'), knew: wordAt('s13', 'عرف'), puts: wordAt('s13', 'يحط'),
  returned: wordAt('s14', 'رجع'), tried: wordAt('s14', 'جرب'), erred: wordAt('s14', 'أخطأ'), fixed: wordAt('s14', 'عدل'),
  needed: wordAt('s15', 'ولما'), hand2: wordAt('s15', 'يدا'), asked: wordAt('s15', 'طلبها'),
  bridge: wordAt('s16', 'الجسر'), silent: wordAt('s16', 'سكت'),
  done: wordAt('s17', 'اكتمل'), worked: wordAt('s17', 'اشتغل'), learned: wordAt('s17', 'وتعلم'), accepted: wordAt('s17', 'وقبل'), s17end: wordEnd('s17', 'المساعدة'),
  wronged: wordAt('s18', 'إذا'), sorry: wordAt('s18', 'اعتذر'),
  need: wordAt('s19', 'وإذا'), speak: wordAt('s19', 'تكلم'),
  but2: wordAt('s20', 'لكن'), explain: wordAt('s20', 'تشرح'), every: wordAt('s20', 'لكل'), passer: wordAt('s20', 'عابر'),
  let: wordAt('s21', 'خل'), step: wordAt('s21', 'الخطوة'), becomes: wordAt('s21', 'تتحول'), statement: wordAt('s21', 'بيان'),
  life: wordAt('s22', 'حياتك'), notconf: wordAt('s22', 'مؤتمر'),
};

export type ShotProps = { t: number; T: number; t0: number };

/* ───────────── helpers ───────────── */

const S = G.rs;
/** A world point → the robot's local hand target (robot at x, y). */
const loc = (x: number, y: number, p: V): V => [(p[0] - x) / S, (p[1] - y) / S];
/** Keys for a value: [time, value, ease?]… (GSAP eases). */
const K = (T: number, ks: Array<[number, number, string?]>) => keys(T, ks);
/** A point that moves through keyed points. */
const KV = (T: number, ks: Array<[number, V, string?]>): V => [keys(T, ks.map(([a, v, e]) => [a, v[0], e] as [number, number, string?])), keys(T, ks.map(([a, v, e]) => [a, v[1], e] as [number, number, string?]))];
/** Walk data from x keys: position, walk phase, stride. */
const walkX = (T: number, ks: Array<[number, number, string?]>) => {
  const x = keys(T, ks);
  const v = Math.abs(keys(T + 0.03, ks) - keys(T - 0.03, ks)) / 0.06;
  return { x, walk: x / 30, stride: Math.min(1, v / 120) };
};
/** A damped swing (degrees) after an event. */
const swing = (T: number, at: number, amp: number, freq = 2.2, decay = 2.4) => (T < at ? 0 : amp * Math.sin((T - at) * freq * Math.PI * 2) * Math.exp(-(T - at) * decay));
/** Idle life: small breathing offsets so no shot is ever a still frame. */
const idle = (T: number, ph = 0) => ({ tilt: 1.6 * Math.sin(T * 1.3 + ph), droop: 6 + 4 * Math.sin(T * 0.9 + ph) });

const Bot: React.FC<RobotProps & { hw?: { l?: V; r?: V } }> = ({ hw, ...p }) => {
  const x = p.x, y = p.y;
  return <Robot s={S} {...p} l={hw?.l ? loc(x, y, hw.l) : p.l} r={hw?.r ? loc(x, y, hw.r) : p.r} />;
};

/** The hung piece: crooked from PIN, with its swing; `lift` 0 hung … 1 level (seated). */
const hungRot = (T: number, slipAt: number, jolt = Infinity) => {
  if (T < slipAt) return 0;
  const base = tween(T, slipAt, slipAt + 0.45, 0, 62, 'power2.in');
  return base + swing(T, slipAt + 0.45, 9, 1.6, 1.8) + (T > jolt ? tween(T, jolt, jolt + 0.15, 0, 7, 'power2.out') + swing(T, jolt + 0.15, 4, 2.2, 3) : 0);
};

/* ───────────── 1 · 0 – ~10.5 s: the slip, the boom, the walk to the podium ───────────── */

/** Macro on the gap: the gripper lowers the last piece; it slips (تعثّر) and hangs crooked; the gripper reaches after
 *  it; the podium's boom mic pushes into the work (عقد مؤتمرًا). Pull back (يحاول): bridge on the right, podium on
 *  the left. Another jolt drops a screw (تقع قطعة); he drops the wrench (يترك الأدوات), stands, walks to the podium
 *  and climbs its step (ويطلع يشرح). */
export const Sh01: React.FC<ShotProps> = ({ T }) => {
  const slip = B.stumble + 0.05;
  const lower = tween(T, 0, slip - 0.05, -46, 0, 'power1.out');
  const rot = hungRot(T, slip, B.falls);
  const placing = T < slip;
  const stand = tween(T, B.goes - 0.7, B.goes - 0.2, 0, 1, 'power2.inOut');
  const w = walkX(T, [[0, G.work], [B.goes - 0.25, G.work], [B.explains + 0.55, G.podium, 'power1.inOut']]);
  const climb = tween(T, B.explains + 0.45, B.explains + 0.75, 0, 1, 'power2.out');
  const y = G.floor - 27 * climb - Math.sin(climb * Math.PI) * 10;
  // the gripper: on the piece while placing, then reaches down after it, then pulls back
  const pieceEnd: V = mix([PIN[0] + 18, PIN[1] - 8 + lower], [PIN[0] + 18, PIN[1] - 8], 1);
  const reachAfter: V = [PIN[0] + 20, PIN[1] + 30];
  const rH = placing ? pieceEnd : KV(T, [[slip, pieceEnd], [slip + 0.5, reachAfter, 'power2.out'], [B.conf + 0.2, reachAfter], [B.conf + 0.6, [PIN[0] - 20, PIN[1] - 40], 'power2.inOut'], [B.falls, [PIN[0] - 20, PIN[1] - 40]], [B.falls + 0.3, [PIN[0] + 24, PIN[1] + 26], 'power2.out'], [B.leaves - 0.2, [PIN[0] + 20, PIN[1] + 22]], [B.leaves + 0.2, [PIN[0] - 30, PIN[1] - 50], 'power2.inOut']]);
  const lH: V = [w.x - 50, G.floor - 70];
  const boomP = K(T, [[0, 0], [B.conf - 0.1, 0], [B.conf + 0.5, 1, 'back.out(1.4)'], [B.goes - 0.5, 1], [B.goes + 0.3, 0, 'power2.in']]);
  const toBoom = T > B.conf + 0.1 && T < B.tries;
  const turn = toBoom ? K(T, [[B.conf + 0.1, 1], [B.conf + 0.45, -1, 'power2.out']]) : T > B.goes - 0.3 ? K(T, [[B.goes - 0.3, 1], [B.goes, -1], [B.explains + 0.5, -1], [B.explains + 0.8, 0]]) : 1;
  const dropW = tween(T, B.leaves + 0.1, B.leaves + 0.45, 0, 1, 'power2.in');
  const holdingWrench = T < B.leaves + 0.1;
  const flinch = swing(T, B.falls + 0.05, 10, 2.6, 3.5);
  const screwT = clamp01((T - B.falls) / 0.9);
  const crouch = (1 - stand) * (T < B.goes - 0.7 ? 1 : 1);
  const lean = (1 - stand) * (placing || T < B.conf + 0.6 ? 24 : 10);
  return (
    <Frame start={{ cx: 680, cy: 1150, zoom: 3.0 }}
      moves={[{ at: B.tries - 0.25, dur: 1.6, cx: 470, cy: 1130, zoom: 1.3, ease: 'power2.inOut' }, { at: B.tries + 1.35, dur: B.goes - B.tries - 1.4, cx: 520, cy: 1140, zoom: 1.5, ease: 'sine.inOut' }, { at: B.goes, dur: 1.6, cx: 360, cy: 1120, zoom: 1.45, ease: 'sine.inOut' }]}
      overlay={<Caption t={T} from={0.35} to={B.s01end + 0.2} text="كل تعثّر… يحتاج بيانًا؟" tone="berry" />}>
      <FrontSet mins={130 + T * 0.4}
        wallProps={<><Easel x={-160} draw={0} /><Panel x={330} y={1040} w={96} h={150} /><Cable /></>}
        actors={<>
          <Piece at={placing ? [PIN[0], PIN[1] + lower] : PIN} rot={rot} />
          {T > B.falls && screwT < 1 && <Screw x={PIN[0] + 6 + screwT * 20} y={PIN[1] + 30 + screwT * screwT * 260} rot={screwT * 400} op={1 - clamp01((screwT - 0.8) / 0.2)} />}
          {!holdingWrench && <g transform={`translate(${lerp(G.work - 40, G.work - 70, dropW)} ${lerp(G.floor - 60, G.floor - 4, dropW)}) rotate(${lerp(-30, 8, dropW)})`}><Wrench s={0.75} /></g>}
          <Bot x={w.x} y={y} walk={w.walk} stride={w.stride * stand} crouch={crouch} lean={lean + flinch * 0.3} turn={turn} droop={T > slip && T < B.conf ? 30 : 8 + flinch}
            tilt={toBoom ? -6 : 0} hw={{ r: stand > 0.5 ? undefined : rH, l: holdingWrench ? lH : undefined }} gr={placing ? 0.35 : 0.9}
            inL={holdingWrench ? <Wrench s={0.8} /> : undefined} r={stand > 0.5 ? (T > B.explains + 0.6 ? HAND.front(1) : HAND.rest(1)) : undefined} />
        </>}
        front={<BoomMic to={[G.work + 46, G.floor - 150]} p={boomP} aim={toBoom ? 0 : -10} />} />
    </Frame>
  );
};

/* ───────────── shared state of the set across the film ───────────── */

/** The wall clock: it runs, and jumps forward where time has been spent. */
const mins = (T: number) => 130 + T * 0.5 + tween(T, B.after - 0.3, B.after + 0.4, 0, 95, 'power3.inOut') + tween(T, B.problem - 0.5, B.problem + 0.2, 0, 70, 'power3.inOut') + tween(T, B.lost - 0.1, B.lost + 0.9, 0, 80, 'power2.inOut');
/** The loose piece, hung crooked until he comes back to it; it sags on the failed connector until the help arrives. */
const pieceRot = (T: number) => {
  if (T < B.returned + 0.1) return hungRot(T, B.stumble + 0.05, B.falls) + 1.2 * Math.sin(T * 1.1);
  return K(T, [[B.returned + 0.1, 69 + 1.2 * Math.sin((B.returned + 0.1) * 1.1)], [B.returned + 0.85, 0, 'power2.inOut'], [B.erred - 0.05, 0], [B.erred + 0.25, 17, 'power2.in'], [B.asked + 0.9, 17], [B.asked + 1.35, 0, 'power2.out']])
    + swing(T, B.erred + 0.25, 3, 2, 3);
};
/** The point on the piece at distance d from PIN (along it) and e across it. */
const onPiece = (T: number, d: number, e = -8): V => {
  const r = (pieceRot(T) * Math.PI) / 180;
  return [PIN[0] + d * Math.cos(r) - e * Math.sin(r), PIN[1] + d * Math.sin(r) + e * Math.cos(r)];
};
const WRENCH_AT: V = [G.work - 70, G.floor - 4];
const wrenchOnBench = (T: number) => T > B.leaves + 0.45 && T < B.puts + 0.25;
const AT_PODIUM = { x: G.podium, y: G.floor - 27 };
/** The podium's live light: on until the microphone fails (تعطّل), a flicker, then off. */
const liveAt = (T: number) => (T < B.broke ? 1 : T < B.broke + 0.35 ? (Math.sin(T * 90) > 0 ? 1 : 0) : 0);
const RAIL_L: V = [132, 1086], RAIL_R: V = [208, 1086];

/** The workshop with everything that persists: easel, steel panel, cable, the piece, the wrench on the bench. */
const World: React.FC<{ T: number; actors?: React.ReactNode; front?: React.ReactNode; podium?: React.ComponentProps<typeof FrontSet>['podium']; lamp?: number; noPiece?: boolean; pieceDy?: number }> = ({ T, actors, front, podium, lamp, noPiece, pieceDy = 0 }) => (
  <FrontSet mins={mins(T)} lamp={lamp}
    podium={{ shine: tween(T, B.why3, B.after - 0.5, 0, 0.9), needle: -80, live: liveAt(T), ...podium }}
    wallProps={<><Easel x={-160} draw={tween(T, B.late - 0.15, B.late + 0.7, 0, 1, 'power1.inOut')} /><Panel x={330} y={1040} w={96} h={150} /><Cable out={tween(T, B.broke + 0.1, B.broke + 0.35, 0, 1, 'back.out(2)')} /></>}
    actors={<>
      {!noPiece && <g transform={`translate(0 ${pieceDy})`}><Piece at={PIN} rot={pieceRot(T)} /></g>}
      {wrenchOnBench(T) && <g transform={`translate(${WRENCH_AT[0]} ${WRENCH_AT[1]}) rotate(8)`}><Wrench s={0.75} /></g>}
      {actors}
    </>}
    front={front} />
);

/* ───────────── 2 · the explanations (three cuts) ───────────── */

/** «ليش تأخّر»: at the podium he points at an oversized diagram that only goes down. */
export const Sh02a: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  return (
    <Frame start={{ cx: -60, cy: 1030, zoom: 1.75 }} moves={[{ at: L(t0), dur: 1.2, cx: -40, cy: 1020, zoom: 1.85, ease: 'sine.inOut' }]}>
      <World T={T} actors={
        <Bot {...AT_PODIUM} turn={-1} lean={-6} hw={{ l: KV(T, [[t0, [60, 1040]], [B.late - 0.2, [-10, 960], 'power2.out'], [B.late + 0.5, [-20, 990], 'sine.inOut']]) }}
          r={HAND.talk(1)} gl={0.9} tilt={-4} droop={4} />
      } />
    </Frame>
  );
};

/** «وليش أخطأ»: close on the microphones; he straightens the crooked one. */
export const Sh02b: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const fix = tween(T, B.wrong - 0.1, B.wrong + 0.35, 0, 1, 'power2.inOut');
  return (
    <Frame start={{ cx: 178, cy: 1050, zoom: 3.3 }} moves={[{ at: L(t0), dur: 1.0, cx: 186, cy: 1048, zoom: 3.45, ease: 'sine.inOut' }]}>
      <World T={T} podium={{ mics: [0, 0, 0, 0, 0, 28 * (1 - fix), 0] }} actors={
        <Bot {...AT_PODIUM} turn={0.5} tilt={6} nod={6} hw={{ r: KV(T, [[t0, [230, 1110]], [B.wrong - 0.25, [204, 1052], 'power2.out'], [B.wrong + 0.4, [200, 1050]], [B.wrong + 0.7, [228, 1100], 'power2.in']]) }}
          gr={T < B.wrong - 0.1 ? 0.8 : 0.25} l={HAND.rest(-1)} />
      } />
    </Frame>
  );
};

/** «وليش الناس فاهمته غلط»: beside the podium he polishes his own nameplate; the bridge hangs crooked behind. */
export const Sh02c: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const rub: V = [146 + 14 * Math.sin(T * 13), 1128 + 4 * Math.cos(T * 13)];
  return (
    <Frame start={{ cx: 330, cy: 1105, zoom: 2.05 }} moves={[{ at: L(t0), dur: 2.2, cx: 320, cy: 1108, zoom: 2.2, ease: 'sine.inOut' }]}>
      <World T={T} front={
        <Bot x={252} y={G.floor + 8} crouch={0.45} lean={-14} turn={-1} hw={{ l: rub }} gl={0.15} r={HAND.hips(1)} droop={10}
          inL={<ellipse cx={14} cy={0} rx={13} ry={9} fill="url(#porcV)" />} />
      } />
    </Frame>
  );
};

/* ───────────── 3 · back to the bench: as he left it ───────────── */

export const Sh03: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const w = walkX(T, [[t0, 380], [B.back - 0.3, 380], [B.finds + 0.15, 560, 'power1.out']]);
  const roll = clamp01((T - (B.left - 0.3)) / 1.0);
  const sx = roll < 0.4 ? lerp(585, 600, roll / 0.4) : 600 + (roll - 0.4) * 12;
  const sy = roll < 0.4 ? G.floor - 8 : G.floor - 8 + ((roll - 0.4) / 0.6) ** 2 * 260;
  return (
    <Frame start={{ cx: 770, cy: 1090, zoom: 2.15 }} fg={<FgMic />} moves={[{ at: L(t0), dur: 4, cx: 740, cy: 1100, zoom: 2.3, ease: 'sine.inOut' }]}>
      <World T={T} actors={<>
        {T > B.left - 0.3 && roll < 1 && <Screw x={sx} y={sy} rot={roll * 600} op={1 - clamp01((roll - 0.85) / 0.15)} />}
        <Bot x={w.x} y={G.floor} walk={w.walk} stride={w.stride} turn={1} crouch={tween(T, B.finds + 0.1, B.finds + 0.6, 0, 0.35)}
          droop={K(T, [[t0, 8], [B.finds + 0.3, 8], [B.left + 0.2, 42, 'power2.out']])} tilt={T > B.finds ? 8 : 0} r={HAND.rest(1)} l={HAND.rest(-1)} />
      </>} />
    </Frame>
  );
};

/* ───────────── 4 · preparing the reply before trying the fix ───────────── */

export const Sh04: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const X = 540;
  const fan = T > B.readies - 0.2 && T < B.before + 0.2 ? 0.5 + 0.5 * Math.sin((T - B.readies) * 9) : 0.3;
  const reach = K(T, [[t0, 0], [B.before + 0.05, 0], [B.tries2 + 0.15, 1, 'power2.out'], [B.solution + 0.05, 1], [B.solution + 0.45, 0, 'power2.in']]);
  return (
    <Frame start={{ cx: 520, cy: 1075, zoom: 1.95 }} moves={[{ at: L(t0), dur: 3.8, cx: 530, cy: 1085, zoom: 2.1, ease: 'sine.inOut' }]}>
      <World T={T} actors={
        <Bot x={X} y={G.floor} crouch={0.35 * reach} lean={-8 * reach} turn={lerp(0.3, -0.7, reach)} r={HAND.front(1)} inR={<Cards fan={fan} />}
          hw={{ l: mix([X - 48, G.floor - 76], [WRENCH_AT[0] + 22, WRENCH_AT[1] - 22], reach) }} gl={0.2 + 0.7 * reach} tilt={idle(T).tilt} droop={idle(T).droop} />
      } />
    </Frame>
  );
};

/* ───────────── 5 · his start waits for approval ───────────── */

/** He reaches to begin, stops (تنتظر), turns to the audience (us) and waits, hand in the air. */
export const Sh05: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const go = K(T, [[t0, 0], [B.start, 0], [B.start + 0.6, 1, 'power2.out'], [B.waits, 1], [B.waits + 0.4, 0.55, 'power2.inOut'], [B.know, 0.55], [B.s06end, 0.25, 'sine.inOut']]);
  const turn = K(T, [[t0, 1], [B.waits, 1], [B.waits + 0.35, -0.15, 'power2.out'], [B.know, -0.15], [B.know + 0.3, 0.9], [B.know + 0.9, -0.15]]);
  return (
    <Frame start={{ cx: 430, cy: 1120, zoom: 1.5 }} fg={<FgMic />} moves={[{ at: L(t0), dur: 5, cx: 450, cy: 1110, zoom: 1.6, ease: 'sine.inOut' }]}>
      <World T={T} actors={
        <Bot x={G.work} y={G.floor} crouch={go * 0.9} lean={go * 16} turn={turn} hw={{ r: mix([G.work + 50, G.floor - 90], onPiece(T, 18, -40), go) }} gr={0.8}
          l={HAND.rest(-1)} droop={T > B.waits ? 25 : 6} tilt={T > B.waits ? -5 + idle(T).tilt : 0} />
      } />
    </Frame>
  );
};

/** Insert: the approval gauge on the podium, needle at zero, trembling. */
export const Sh05b: React.FC<ShotProps> = ({ T }) => {
  const needle = -80 + 5 * Math.max(0, Math.sin((T - B.approval) * 9)) * Math.exp(-Math.max(0, T - B.approval) * 1.5) + 1.2 * Math.sin(T * 17);
  return (
    <Frame start={{ cx: 214, cy: 1108, zoom: 11 }} moves={[{ at: 0, dur: 1.4, cx: 216, cy: 1110, zoom: 12, ease: 'sine.inOut' }]}>
      <World T={T} podium={{ needle }} />
    </Frame>
  );
};

/* ───────────── 6 · the mirror: he polishes his image; the bridge stays broken in it ───────────── */

export const Sh06: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const wipe = T > t0 + 0.2 && T < B.before2 + 0.5;
  const ang = (T - t0) * 8.5;
  // he wipes the reflection of his own visor
  const target: V = wipe ? [600 + 46 * Math.cos(ang), 1410 + 26 * Math.sin(ang)] : [560, 1470];
  const fs = 3.0, fx = 175, fy = 2210;
  const fog = tween(T, t0, B.before2, 0.6, 0.05);
  // the reflection (symbolic, not a mirrored world): the crooked bridge behind, his front close, wiping in step
  const ref = (
    <g>
      <g transform="translate(420 1110) scale(1.15) translate(-720 -1210)"><World T={T} /></g>
      <Robot x={610} y={1790} s={1.55} turn={-0.25} r={[(1220 - target[0] - 610) / 1.55, (target[1] + 40 - 1790) / 1.55]} gr={0.2} l={HAND.rest(-1)}
        inR={<ellipse cx={14} cy={0} rx={13} ry={9} fill="url(#porcV)" />} droop={6} />
    </g>
  );
  return (
    <Frame start={{ cx: 540, cy: 1060, zoom: 1.0 }} moves={[{ at: L(t0), dur: 2.0, cx: 540, cy: 1060, zoom: 1.05, ease: 'sine.inOut' }, { at: L(B.before2 - 0.1), dur: 1.2, cx: 430, cy: 1130, zoom: 2.2, ease: 'power2.inOut' }]}
      overlay={<Caption t={T} from={B.image - 0.1} to={B.piece + 0.5} text="يصلح صورته" tone="berry" />}>
      <rect x={-600} y={-600} width={2300} height={3200} fill="url(#wall)" />
      <rect x={-600} y={-600} width={2300} height={3200} fill="url(#peg)" opacity={0.8} />
      <Panel x={210} y={560} w={680} h={1060} fog={fog}>{ref}</Panel>
      <g style={{ filter: 'brightness(0.8)' }}>
        <Robot x={fx} y={fy} s={fs} back turn={0.3} r={[(target[0] - fx) / fs, (target[1] - fy) / fs]} gr={0.2} l={HAND.rest(-1)}
          inR={<ellipse cx={14} cy={0} rx={13} ry={9} fill="url(#porcV)" />} />
      </g>
    </Frame>
  );
};

/* ───────────── 7 · the microphone fails ───────────── */

export const Sh07: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const talking = T < B.broke;
  const g = Math.sin((T - t0) * 6);
  const tap = T > B.broke + 0.6 && T < B.broke + 1.5;
  return (
    <Frame start={{ cx: 235, cy: 1085, zoom: 2.2 }} moves={[{ at: L(t0), dur: 2.9, cx: 225, cy: 1080, zoom: 2.35, ease: 'sine.inOut' }]}>
      <World T={T} actors={
        <Bot {...AT_PODIUM} turn={talking ? 0.2 * g : -0.1} tilt={tap ? 10 : 0} lean={tap ? -4 : 0} droop={talking ? 4 : 18}
          l={talking ? mix(HAND.talk(-1), HAND.up(-1), 0.5 + 0.5 * g) : HAND.rest(-1)}
          hw={{ r: tap ? [172 + 4 * Math.sin(T * 30), 1056] : talking ? undefined : [210, 1090] }} r={talking ? HAND.talk(1) : undefined} gr={tap ? 0.1 : 0.5} />
      } />
    </Frame>
  );
};

/* ───────────── 8 · he waits for the verdict ───────────── */

export const Sh08: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  return (
    <Frame start={{ cx: 172, cy: 1040, zoom: 2.0 }} moves={[{ at: L(t0), dur: 3.1, cx: 172, cy: 1030, zoom: 2.7, ease: 'sine.inOut' }]}>
      <World T={T} lamp={tween(T, t0, t0 + 3, 1, 0.75)} actors={
        <Bot {...AT_PODIUM} turn={0.05 * Math.sin(T * 0.8)} hw={{ l: RAIL_L, r: RAIL_R }} gl={0.1} gr={0.1} glow={0.4 + 0.4 * Math.sin(T * 2.4)} tilt={idle(T).tilt} droop={10 + 6 * Math.sin(T * 0.7)} />
      } />
    </Frame>
  );
};

/* ───────────── 9 · the reverse: mostly empty seats ───────────── */

const OCC: Array<[number, number, boolean]> = [[2, -2, false], [3, 1, false], [2, 2, true]];

export const Sh09: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const rise = tween(T, B.noticed - 0.3, B.empty + 0.2, 0, 1, 'power2.inOut');
  return (
    <Frame start={{ cx: 540, cy: 1150, zoom: 1.22 }} moves={[{ at: L(B.noticed - 0.3), dur: B.empty + 0.5 - B.noticed, cx: 540, cy: 1010, zoom: 1.02, ease: 'power2.inOut' }]}
      fg={<g style={{ filter: 'brightness(0.5)' }}>
        <PodiumBack x={640} y={lerp(1520, 1700, rise)} s={2.3} />
        <Robot x={360} y={lerp(2380, 2560, rise)} s={2.2} back turn={lerp(0, 0.6, tween(T, B.most - 0.2, B.most + 0.5, 0, 1))} l={HAND.rest(-1)} r={HAND.rest(1)} tilt={lerp(0, -6, rise)} />
      </g>}
      overlay={<Caption t={T} from={B.most - 0.1} to={B.empty + 0.75} text="أغلب الكراسي فاضية" />}>
      <RoomSet occupied={OCC} rings={0.5} t={T} />
    </Frame>
  );
};

/* ───────────── 10 · some voices were in his head; the rest weren't waiting ───────────── */

export const Sh10: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const shrink = tween(T, B.some + 0.3, B.head + 0.7, 0, 1, 'power2.inOut');
  const sp = seat(2, -2);
  return (
    <Frame start={{ cx: sp.x + 20, cy: 960, zoom: 2.5 }}
      moves={[{ at: L(B.some + 0.3), dur: B.head + 0.4 - B.some, cx: 420, cy: 980, zoom: 1.55, ease: 'power2.inOut' }, { at: L(B.rest - 0.1), dur: 1.3, cx: 735, cy: 1090, zoom: 2.3, ease: 'power2.inOut' }, { at: L(B.rest + 1.3), dur: 2.4, cx: 745, cy: 1095, zoom: 2.45, ease: 'sine.inOut' }]}>
      <RoomSet occupied={OCC} rings={lerp(1, 0.15, shrink)} t={T} shadow={{ r: 2, c: -2, scale: lerp(3.6, 1.15, shrink), op: lerp(0.95, 0.45, shrink) }} />
    </Frame>
  );
};

/* ───────────── 11 · the problem didn't vanish; lost time didn't return ───────────── */

export const Sh11: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  return (
    <Frame start={{ cx: 700, cy: 1165, zoom: 3.0 }} moves={[{ at: L(t0), dur: B.lost - t0, cx: 716, cy: 1178, zoom: 3.6, ease: 'sine.inOut' }, { at: L(B.lost - 0.15), dur: 1.2, cx: 905, cy: 1000, zoom: 2.7, ease: 'power2.inOut' }]}>
      <World T={T} />
    </Frame>
  );
};

/* ───────────── 12 · for the first time, he knew where to put his hand ───────────── */

/** a · close on the podium rail: the hand lets go and moves down-right, out of frame. */
export const Sh12a: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const go = tween(T, B.first, B.first + 0.55, 0, 1, 'power2.in');
  return (
    <Frame start={{ cx: 196, cy: 1072, zoom: 3.5 }} moves={[{ at: L(t0), dur: 1.7, cx: 200, cy: 1076, zoom: 3.6, ease: 'sine.inOut' }]}>
      <World T={T} actors={
        <Bot {...AT_PODIUM} turn={lerp(0, 0.9, go)} hw={{ l: RAIL_L, r: mix(RAIL_R, [330, 1190], go) }} gl={0.1} gr={lerp(0.1, 0.6, go)} glow={0.6} droop={lerp(14, 2, go)} />
      } />
    </Frame>
  );
};

/** b · match cut: the hand comes down from the upper left onto the wrench and closes on it. */
export const Sh12b: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const X = 470;
  const grip: V = [WRENCH_AT[0] + 6, WRENCH_AT[1] - 4];
  const hand = KV(T, [[t0, [420, 1080]], [B.puts + 0.1, grip, 'power2.out'], [B.puts + 0.35, grip], [B.puts + 0.9, [grip[0] + 6, grip[1] - 30], 'power2.inOut']]);
  const held = T > B.puts + 0.3;
  return (
    <Frame start={{ cx: 518, cy: 1168, zoom: 3.6 }} moves={[{ at: L(t0), dur: 1.7, cx: 512, cy: 1164, zoom: 3.75, ease: 'sine.inOut' }]}>
      <World T={T} actors={<>
        <Bot x={X} y={G.floor} crouch={0.75} lean={14} turn={0.9} hw={{ r: hand }} gr={held ? 0.15 : 0.9} l={HAND.rest(-1)} droop={4} />
        {held && <g transform={`translate(${hand[0] - 6} ${hand[1] + 4}) rotate(8)`}><Wrench s={0.75} /></g>}
      </>} />
    </Frame>
  );
};

/* ───────────── 13 · back to the bench: try, err, adjust ───────────── */

export const Sh13: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const joint: V = [PIN[0] - 4, PIN[1] + 24];
  const placed = T > B.tried + 0.25 && T < B.fixed + 0.15;
  const kink = tween(T, B.erred - 0.05, B.erred + 0.2, 0, 34, 'power2.in');
  const pull = clamp01((T - (B.fixed + 0.15)) / 0.7);
  const holdPiece = onPiece(T, 26, -10);
  const r = KV(T, [[t0, [PIN[0] - 30, PIN[1] - 40]], [B.returned + 0.05, onPiece(B.returned + 0.05, 26, -10), 'power2.out'], [B.returned + 0.85, onPiece(B.returned + 0.85, 26, -10)],
    [B.tried - 0.25, [joint[0] - 40, joint[1] + 6]], [B.tried + 0.2, joint, 'power2.out'], [B.erred + 0.3, joint], [B.fixed, joint], [B.fixed + 0.45, [joint[0] - 70, joint[1] - 30], 'power2.in'], [B.fixed + 0.8, onPiece(B.fixed + 0.8, 26, -10), 'power2.out']]);
  const rH = T > B.returned + 0.05 && T < B.returned + 0.85 ? holdPiece : r;
  return (
    <Frame start={{ cx: 650, cy: 1150, zoom: 2.3 }} moves={[{ at: L(t0), dur: 3.9, cx: 668, cy: 1158, zoom: 2.45, ease: 'sine.inOut' }]}
      overlay={<Caption t={T} from={B.tried - 0.1} to={B.fixed + 0.75} text="جرّب. أخطأ. عدّل." />}>
      <World T={T} actors={<>
        {placed && <g transform={`translate(${joint[0] - 28} ${joint[1]})`}><Connector kink={kink} /></g>}
        {pull > 0 && pull < 1 && <g transform={`translate(${joint[0] - 28 - pull * 120} ${joint[1] - 30 * Math.sin(pull * Math.PI) + pull * pull * 60}) rotate(${-pull * 160})`}><Connector kink={34} /></g>}
        <Bot x={G.work} y={G.floor} crouch={1} lean={22} turn={1} hw={{ r: rH }} gr={T > B.tried - 0.25 && T < B.tried + 0.25 ? 0.35 : 0.3}
          inR={T > B.tried - 0.6 && T < B.tried + 0.25 ? <Connector /> : undefined} l={[-40, -120]} inL={<Wrench s={0.8} />} droop={T > B.erred && T < B.fixed ? 30 : 6} tilt={T > B.erred && T < B.fixed ? 8 : 0} />
      </>} />
    </Frame>
  );
};

/* ───────────── 14 · he needs a second hand, and asks for it ───────────── */

const HELP_FROM: V = [1260, 860];
const helperIn = (T: number) => tween(T, B.asked + 0.15, B.asked + 0.85, 0, 1, 'power3.out');

export const Sh14: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const far = onPiece(T, 88, -4);
  const k = helperIn(T);
  const ask = tween(T, B.asked - 0.45, B.asked - 0.1, 0, 1, 'power2.out') * (1 - tween(T, B.asked + 0.9, B.asked + 1.3, 0, 1));
  const tryFar = K(T, [[t0, 0], [B.hand2 - 0.3, 0], [B.hand2 + 0.2, 1, 'power2.out'], [B.asked - 0.6, 1], [B.asked - 0.3, 0]]);
  const lHand: V = ask > 0 ? [G.work + 60 + 8 * Math.sin(T * 14) * ask, G.floor - 150] : mix([G.work + 30, G.floor - 60], [PIN[0] + 60, PIN[1] + 20], tryFar);
  return (
    <Frame start={{ cx: 720, cy: 1110, zoom: 1.85 }} moves={[{ at: L(t0), dur: 3.1, cx: 735, cy: 1105, zoom: 1.95, ease: 'sine.inOut' }]}
      overlay={<Caption t={T} from={B.asked - 0.3} to={B.asked + 1.05} text="أحتاج مساعدة" />}>
      <World T={T} actors={<>
        <Bot x={G.work} y={G.floor} crouch={1} lean={lerp(22, 10, ask)} turn={lerp(1, 1, ask)} tilt={ask * -10} hw={{ r: onPiece(T, 26, -10), l: lHand }} gr={0.3} gl={lerp(0.3, 1, ask)} droop={lerp(20, 0, ask)} />
        {k > 0 && <HelperArm from={HELP_FROM} to={mix(HELP_FROM, [far[0] + 4, far[1] - 4], k)} open={T < B.asked + 0.8 ? 0.9 : 0.2} />}
      </>} />
    </Frame>
  );
};

/* ───────────── 15 · from above: the piece seats and locks ───────────── */

export const Sh15: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const p = tween(T, B.bridge - 0.1, B.bridge + 0.6, 0, 1, 'power2.inOut');
  const lock = tween(T, B.bridge + 0.6, B.bridge + 1.3, 0, 1, 'power1.out');
  const lift = 1 - p;
  const near: V = [700 + lift * 50, 960 - lift * 30];
  return (
    <Frame start={{ cx: 700, cy: 960, zoom: 1.55 }} moves={[{ at: L(t0), dur: 2.7, cx: 705, cy: 955, zoom: 1.7, ease: 'sine.inOut' }]}>
      <OverheadSet piece={p} lock={lock} />
      <RobotTop x={470} y={960} s={0.9} l={[near[0], near[1] - 60]} r={[near[0], near[1] + 60]} />
      <HelperArm from={[1300, 700]} to={[792 + lift * 60, 960 - lift * 40]} open={0.2} />
    </Frame>
  );
};

/* ───────────── 16 · complete: the trolley test ───────────── */

const trolleyX = (T: number) => K(T, [[0, 470], [B.worked - 0.1, 470], [B.accepted + 0.8, 975, 'power1.inOut']]);

export const Sh16: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const tx = trolleyX(T);
  const on = tx > 600 && tx < 880;
  const flex = on ? 3 * Math.sin(((tx - 600) / 280) * Math.PI) : 0;
  const push = T < B.worked + 0.7;
  const helper: V = [onPiece(T, 92, -2)[0], onPiece(T, 92, -2)[1] - 2 + flex];
  return (
    <Frame start={{ cx: 700, cy: 1110, zoom: 1.6 }} moves={[{ at: L(t0), dur: 4, cx: 740, cy: 1110, zoom: 1.7, ease: 'sine.inOut' }]}
      overlay={<Caption t={T} from={B.learned - 0.1} to={B.s17end + 0.4} text="تعلّم… وقبل المساعدة" />}>
      <World T={T} pieceDy={flex} actors={<>
        <g transform={`translate(${PIN[0] - 32} ${PIN[1] + 24 + flex})`}><Connector tone="porc" /></g>
        <Trolley x={tx} y={G.deck + 4 + flex} roll={tx / 10} />
        <Bot x={530} y={G.floor} crouch={0.55} lean={push ? 14 : 4} turn={1} hw={{ r: push ? [tx - 42, G.deck - 20] : [580, G.floor - 80] }} gr={0.3} l={HAND.rest(-1)} droop={T > B.accepted ? 0 : 8} />
        <HelperArm from={HELP_FROM} to={helper} open={0.2} />
      </>} />
    </Frame>
  );
};

/* ───────────── 17 · he returns the borrowed driver, with a small bow ───────────── */

const Driver: React.FC = () => (
  <g><rect x={6} y={-6} width={30} height={12} rx={5} fill="url(#porcV)" /><rect x={34} y={-2.5} width={34} height={5} rx={2} fill={C3.teal} /></g>
);
const C3 = { teal: '#4E9C95' };

export const Sh17: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const give = tween(T, B.wronged, B.sorry - 0.25, 0, 1, 'power2.inOut');
  const taken = T > B.sorry - 0.2;
  const bow = tween(T, B.sorry, B.sorry + 0.35, 0, 1, 'power2.out') * (1 - tween(T, B.sorry + 1.0, B.sorry + 1.5, 0, 1));
  const meet: V = [700, 1100];
  const helperTo = KV(T, [[t0, [onPiece(t0, 92, -2)[0], onPiece(t0, 92, -2)[1] - 2]], [B.sorry - 0.4, [meet[0] + 42, meet[1]], 'power2.inOut'], [B.sorry + 0.2, [meet[0] + 42, meet[1]]], [B.sorry + 0.9, [860, 1000], 'power2.inOut']]);
  return (
    <Frame start={{ cx: 690, cy: 1080, zoom: 2.0 }} moves={[{ at: L(t0), dur: 2.8, cx: 700, cy: 1075, zoom: 2.15, ease: 'sine.inOut' }]}
      overlay={<Caption t={T} from={B.wronged + 0.1} to={B.sorry + 0.8} text="اعتذر حين يلزم" />}>
      <World T={T} actors={<>
        <g transform={`translate(${PIN[0] - 32} ${PIN[1] + 24})`}><Connector tone="porc" /></g>
        <Trolley x={975} />
        <Bot x={575} y={G.floor} crouch={0.3} lean={4 + 14 * bow} nod={10 * bow} turn={1} hw={{ r: taken ? [600, 1150] : mix([600, 1150], meet, give), l: bow > 0.2 ? [585, 1060] : undefined }} l={HAND.rest(-1)} gr={taken ? 0.6 : 0.2}
          inR={taken ? undefined : <Driver />} droop={2} />
        <HelperArm from={HELP_FROM} to={helperTo} open={taken ? 0.15 : 0.9} held={taken ? <g transform="rotate(180) translate(-10 0)"><Driver /></g> : undefined} />
      </>} />
    </Frame>
  );
};

/* ───────────── 18 · two hands on one bolt ───────────── */

export const Sh18: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const bolt: V = [PIN[0], PIN[1] + 4];
  const turnA = (T - t0) * 220;
  return (
    <Frame start={{ cx: 700, cy: 1188, zoom: 3.0 }} moves={[{ at: L(t0), dur: 2.3, cx: 706, cy: 1190, zoom: 3.15, ease: 'sine.inOut' }]}
      overlay={<Caption t={T} from={B.need + 0.1} to={B.speak + 0.6} text="واطلب العون" />}>
      <World T={T} actors={<>
        <g transform={`translate(${PIN[0] - 32} ${PIN[1] + 24})`}><Connector tone="porc" /></g>
        <g transform={`translate(${bolt[0]} ${bolt[1]}) rotate(${turnA})`}><polygon points="-9,-5 0,-10 9,-5 9,5 0,10 -9,5" fill={C3.teal} stroke="#1B1F23" strokeWidth={2} /></g>
        <Bot x={G.work} y={G.floor} crouch={1} lean={22} turn={1} hw={{ r: [bolt[0] - 14 + 3 * Math.sin(T * 8), bolt[1] + 2] }} gr={0.25} l={[-40, -120]} inL={<Wrench s={0.8} />} />
        <HelperArm from={HELP_FROM} to={[bolt[0] + 16 + 3 * Math.cos(T * 8), bolt[1] - 6]} open={0.25} held={<g transform="rotate(180) translate(-6 0)"><Driver /></g>} />
      </>} />
    </Frame>
  );
};

/* ───────────── 19 · not for every passer-by: he chooses the bench ───────────── */

export const Sh19: React.FC<ShotProps & { cam?: { cx: number; cy: number; zoom: number } }> = ({ T, t0, cam }) => {
  const L = (x: number) => x - t0;
  const boom = K(T, [[t0, 0], [B.but2, 0], [B.explain - 0.1, 0.78, 'power2.out'], [B.every + 0.2, 0.78], [B.passer + 0.6, 0.42, 'power2.inOut']]);
  const look = K(T, [[t0, 1], [B.explain - 0.1, 1], [B.explain + 0.3, -1, 'power2.out'], [B.every - 0.1, -1], [B.every + 0.35, 1, 'power2.inOut']]);
  const up = K(T, [[t0, 1], [B.explain - 0.2, 1], [B.explain + 0.3, 0.45], [B.every, 0.45], [B.every + 0.6, 1, 'power2.inOut']]);
  return (
    <Frame start={cam ?? { cx: 380, cy: 1140, zoom: 1.3 }} fg={cam ? undefined : <FgMic />} moves={cam ? [] : [{ at: L(t0), dur: 3.6, cx: 400, cy: 1135, zoom: 1.36, ease: 'sine.inOut' }]}
      overlay={<Caption t={T} from={B.every - 0.2} to={B.passer + 0.75} text="ليس لكل عابر" />}>
      <World T={T} actors={<>
        <g transform={`translate(${PIN[0] - 32} ${PIN[1] + 24})`}><Connector tone="porc" /></g>
        <Trolley x={975} />
        <Bot x={G.work} y={G.floor} crouch={up} lean={22 * up} turn={look} hw={{ r: up > 0.9 ? onPiece(T, 40, -4) : undefined }} r={up > 0.9 ? undefined : HAND.rest(1)} l={[-40, -120 + 30 * (1 - up)]} inL={<Wrench s={0.8} />} droop={look < 0 ? 12 : 4} />
      </>} front={<BoomMic to={[G.work - 40, G.floor - 150]} p={boom} aim={-20 * (1 - up)} />} />
    </Frame>
  );
};

/* ───────────── 20 · the step before the statement: the trolley crosses ───────────── */

export const Sh20: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const tx = K(T, [[t0, 560], [B.step - 0.1, 560], [B.statement + 0.4, 905, 'power1.inOut']]);
  const flex = tx > 600 && tx < 880 ? 2.5 * Math.sin(((tx - 600) / 280) * Math.PI) : 0;
  const nudge = T < B.step + 0.3;
  return (
    <Frame start={{ cx: 690, cy: 1160, zoom: 2.9 }} moves={[{ at: L(t0), dur: 3.6, cx: 760, cy: 1158, zoom: 2.75, ease: 'sine.inOut' }]}>
      <World T={T} pieceDy={flex} actors={<>
        <g transform={`translate(${PIN[0] - 32} ${PIN[1] + 24 + flex})`}><Connector tone="porc" /></g>
        <Trolley x={tx} y={G.deck + 4 + flex} roll={tx / 10} />
        <Bot x={G.work - 20} y={G.floor} crouch={0.8} lean={16} turn={1} hw={{ r: nudge ? [tx - 42, G.deck - 18] : [600, G.floor - 90] }} gr={0.3} l={[-40, -120]} inL={<Wrench s={0.8} />} />
      </>} />
    </Frame>
  );
};

/* ───────────── 21 · your life is not a press conference ───────────── */

export const Sh21: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0;
  const work = Math.sin(T * 5);
  const up = K(T, [[t0, 0], [B.notconf + 0.6, 0], [B.notconf + 1.1, 1, 'power2.inOut'], [B.notconf + 2.1, 1], [B.notconf + 2.7, 0, 'power2.inOut']]);
  const crouch = 1 - 0.85 * up;
  return (
    <Frame start={{ cx: 470, cy: 1200, zoom: 1.28 }} fg={<FgMic />} moves={[{ at: L(t0), dur: 5.3, cx: 480, cy: 1210, zoom: 1.16, ease: 'sine.inOut' }]}
      overlay={<EndTitle t={T} from={B.life} brandAt={B.notconf + 0.6} />}>
      <World T={T} lamp={0.85} actors={<>
        <g transform={`translate(${PIN[0] - 32} ${PIN[1] + 24})`}><Connector tone="porc" /></g>
        <Trolley x={985} />
        <Bot x={G.work} y={G.floor} crouch={crouch} lean={20 * crouch} turn={1} tilt={up * 6}
          hw={{ r: up > 0.5 ? undefined : [PIN[0] + 6 + 8 * work, PIN[1] + 6] }} r={up > 0.5 ? HAND.rest(1) : undefined} gr={0.25} l={[-40, -120 + 40 * up]} inL={<Wrench s={0.8} />} droop={4 + 3 * Math.sin(T)} />
      </>} />
    </Frame>
  );
};

/* ───────────── the shot list ───────────── */

/** Start (reel seconds), component, id; storyboard.src.json uses the same ids and anchors. */
export const SHOTS: Array<[number, React.FC<ShotProps>, string]> = [
  [0, Sh01, 'p01'],
  [B.why1 - 0.15, Sh02a, 'p02a'],
  [B.why2 - 0.2, Sh02b, 'p02b'],
  [B.why3 - 0.15, Sh02c, 'p02c'],
  [B.after - 0.3, Sh03, 'p03'],
  [B.time - 0.3, Sh04, 'p04'],
  [B.even - 0.3, Sh05, 'p05'],
  [B.approval - 0.15, Sh05b, 'p05b'],
  [B.folk + 0.5, Sh05, 'p05c'],
  [B.was - 0.35, Sh06, 'p06'],
  [B.day - 0.4, Sh07, 'p07'],
  [B.waited - 0.4, Sh08, 'p08'],
  [B.then - 0.5, Sh09, 'p09'],
  [B.some - 0.2, Sh10, 'p10'],
  [B.problem - 0.6, Sh11, 'p11'],
  [B.but - 0.45, Sh12a, 'p12a'],
  [B.knew - 0.05, Sh12b, 'p12b'],
  [B.returned - 0.5, Sh13, 'p13'],
  [B.needed - 0.3, Sh14, 'p14'],
  [B.bridge - 0.35, Sh15, 'p15'],
  [B.done - 0.3, Sh16, 'p16'],
  [B.wronged - 0.4, Sh17, 'p17'],
  [B.need - 0.15, Sh18, 'p18'],
  [B.but2 - 0.25, Sh19, 'p19'],
  [B.let - 0.2, Sh20, 'p20'],
  [B.life - 0.5, Sh21, 'p21'],
];
