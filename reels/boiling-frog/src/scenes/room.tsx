import React from 'react';
import { PAL, bowLine, rand, stroke, wobEllipse } from '@mukarram/characters/ink';
import { Puff, Sparkles } from '@mukarram/characters/props';
import { POSES, Pose, handLocal } from '@mukarram/characters/rig';
import { Shot } from '@mukarram/video/stage';
import { Frog } from '../characters/frog';
import { HUMAN_BUILD, Human } from '../characters/human';
import { BeanBag, CalendarSheet, Conveyor, DeskTable, FeedCard, PaperPile, Pen, Phone, TaskSheet, Thermometer, ThoughtBubble, WallClock, Window } from '../characters/props';
import { TITLE_FONT } from '../video/fonts';
import { ease, keys, prog, sec, wordAt } from '../video/time';
import { ShotProps, exprTrack, idle, poseTrack, vecTrack } from './common';

// One room, one man. The phone eats an hour; «بكرة» piles up until it buries him; nothing changes in a
// day — a little, then a little; he notices; he locks the phone and finishes one sheet.

const FLOOR = 1600;
const BOUNDS: [number, number, number, number] = [-420, -400, 1500, 2340];
const WALL = '#D6E6E2';

const Room: React.FC<{ f: number; night: number; minutes: number; heat: number; children?: React.ReactNode; win?: React.ReactNode; clockAt?: [number, number] }> = ({ night, minutes, heat, children, win, clockAt = [290, 720] }) => (
  <g>
    <rect x={-420} y={-400} width={1920} height={FLOOR + 400} fill={WALL} />
    <rect x={-420} y={-400} width={1920} height={FLOOR + 400} fill="#1D3352" opacity={night * 0.35} />
    <rect x={-420} y={FLOOR} width={1920} height={800} fill="#B8C6CF" />
    <path d={bowLine(-420, FLOOR, 1500, FLOOR, 3)} {...stroke()} />
    <path d={wobEllipse(540, FLOOR + 90, 520, 70, 701, 0.03, 12)} fill={PAL.blueSoft} {...stroke(5)} />
    <Window x={830} y={760} night={night}>{win}</Window>
    <WallClock x={clockAt[0]} y={clockAt[1]} s={0.95} minutes={minutes} />
    <Thermometer x={130} y={1080} s={0.42} level={heat} />
    {children}
  </g>
);

const SIT: Pose = { ...POSES.stand, legL: [70, 120], legR: [62, 112], armL: [16, -30], armR: [26, -96], handR: 'fist', lean: -8, tilt: -4 };
const phoneItem = (p: { bar?: number; label?: string; scroll?: number; lock?: number }) => <Phone x={-6} y={-86} s={0.66} {...p} />;

/* ------------------------------ phone ------------------------------ */

const minutesLabel = (f: number) => (f >= wordAt('s05', 'ساعة') ? '60 دقيقة' : f >= wordAt('s05', 'عشر') ? '10 دقائق' : f >= wordAt('s05', 'خمس') ? '5 دقائق' : undefined);
const barAt = (f: number) => keys(f, [[wordAt('s05', 'خمس'), 0.08], [wordAt('s05', 'عشر'), 0.18], [wordAt('s05', 'وفجأة'), 0.25], [wordAt('s05', 'ساعة'), 1]], ease.out);

const PhoneShot: React.FC<{ f: number; t0: number; zoom: number; lean: number; speed: number; len: number; expr: Parameters<typeof exprTrack>[1]; night: number; minutes: number; glance: [number, number]; morph?: number }> = ({ f, t0, zoom, lean, speed, len, expr, night, minutes, glance, morph = 1 }) => {
  const id = idle(f, 61);
  const flick = Math.max(0, Math.sin(f * 0.5 * (1 + speed / 8)));
  const pose: Pose = { ...SIT, lean: SIT.lean + lean, armR: [26, -96 + flick * 8], tilt: -4 + lean * 0.6 };
  const label = minutesLabel(f);
  const scroll = f * (6 + speed * 3);
  const glow = 0.5 + 0.2 * Math.sin(f * 0.7);
  return (
    <Shot f={f} cam={{ cx: 540, cy: 1250, zoom }} bounds={BOUNDS} overlay={label ? <MinutesBadge text={label} bar={barAt(f)} key={label} f={f} at={label === '60 دقيقة' ? wordAt('s05', 'ساعة') : label === '10 دقائق' ? wordAt('s05', 'عشر') : wordAt('s05', 'خمس')} /> : null}>
      <Room f={f} night={night} minutes={minutes} heat={0.3} clockAt={[290, 980]}>
        <BeanBag x={560} y={FLOOR} s={1.05} />
        <Conveyor x={430} y={1380} len={len} f={f} speed={speed} />
        {Array.from({ length: Math.floor(len / 150) }, (_, i) => {
          const x = 430 - ((f * speed + i * 150) % len);
          return <FeedCard key={i} x={x} y={1320 + Math.sin(x / 40) * 4} s={0.6} kind={i + Math.floor((f * speed + i * 150) / len)} rot={(rand(i) - 0.5) * 12} />;
        })}
        <circle cx={520} cy={1020} r={160} fill={PAL.blueSoft} opacity={0.35 * glow} />
        <Human x={540} y={FLOOR} s={1.12} pose={pose} blink={id.blink} expr={exprTrack(f, expr)} glance={glance} look={[0.15, 0.25]} shadow={false}
          itemR={<g opacity={morph}>{phoneItem({ bar: barAt(f), scroll })}</g>} />
        {morph < 1 && <g transform={`translate(520 ${1000 - 400 * (1 - morph)}) rotate(${-90 * morph}) scale(${3 - 2.4 * morph})`} opacity={1 - morph}><Thermometer x={0} y={0} level={0.66} /></g>}
      </Room>
    </Shot>
  );
};

/** The screen time, big and fixed at the top (pops on its word); the red bar is the thermometer's red. */
const MinutesBadge: React.FC<{ text: string; bar: number; f: number; at: number }> = ({ text, bar, f, at }) => {
  const p = prog(f, at, 8, ease.back);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, transform: `scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 2) }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 104, lineHeight: 1.2, color: PAL.ink, background: PAL.white, padding: '0.04em 0.5em 0.16em', borderRadius: 30, border: `7px solid ${PAL.ink}`, whiteSpace: 'nowrap' }}>{text}</div>
      <div style={{ width: 520, height: 34, borderRadius: 20, border: `6px solid ${PAL.ink}`, background: PAL.white, overflow: 'hidden' }}><div style={{ width: `${Math.round(bar * 100)}%`, height: '100%', background: PAL.red }} /></div>
    </div>
  );
};

/** «خمس دقايق على الجوال…» — match cut: the frog's thermometer swings flat into the phone's screen-time bar;
 *  he's happily scrolling on the bean bag; «5 دقائق». */
export const PhoneFive: React.FC<ShotProps> = ({ f, t0 }) => (
  <PhoneShot f={f} t0={t0} zoom={keys(f, [[t0, 1.7], [t0 + 12, 1.42]], ease.out)} lean={0} speed={2} len={keys(f, [[t0, 0], [wordAt('s05', 'الجوال'), 180]])}
    expr={[[t0, 'satisfied']]} night={0} minutes={10} glance={[0.2, 0.6]} morph={prog(f, t0, 12, ease.inOut)} />
);

/** «تصير عشر…» — the feed runs out of the phone as a conveyor; he leans in. */
export const PhoneTen: React.FC<ShotProps> = ({ f, t0 }) => (
  <PhoneShot f={f} t0={t0} zoom={keys(f, [[t0, 1.4], [t0 + sec(1), 1.48]])} lean={6} speed={5} len={keys(f, [[t0, 300], [t0 + sec(0.9), 520]])}
    expr={[[t0, 'neutral']]} night={0.15} minutes={keys(f, [[t0, 15], [t0 + sec(1), 22]])} glance={[0.2, 0.7]} />
);

/** «وفجأة راحت ساعة!» — the belt races, the clock spins, the window goes dark; «60 دقيقة»; he snaps out. */
export const PhoneHour: React.FC<ShotProps> = ({ f, t0 }) => {
  const hour = wordAt('s05', 'ساعة');
  const snapped = f >= hour + 2;
  return (
    <PhoneShot f={f} t0={t0} zoom={keys(f, [[t0, 1.25], [hour, 1.25], [hour + 5, 1.5]], ease.out)} lean={snapped ? -10 : 10} speed={snapped ? 1 : 14} len={snapped ? 640 : keys(f, [[t0, 520], [hour, 700]])}
      expr={[[t0, 'neutral'], [hour, 'surprised'], [hour + sec(0.7), 'embarrassed']]} night={keys(f, [[t0, 0.15], [hour, 1]])}
      minutes={keys(f, [[t0, 22], [hour, 82]], ease.in)} glance={snapped ? [-0.9, -0.9] : [0.2, 0.7]} />
  );
};

/* ------------------------------ the pile ------------------------------ */

const HX = 420, HS = 1.1;                 // the man at the desk
const PILE: [number, number] = [730, 1236];
const DROPS = () => [wordAt('s06', 'لبكرة'), wordAt('s06', 'وبكرة'), wordAt('s06', 'يجيب'), wordAt('s06', 'معه'), wordAt('s06', 'كومة') - 3];
const pileCount = (f: number) => {
  const d = DROPS();
  let n = 6 + (f >= wordAt('s06', 'بأجّلها') + 12 ? 1 : 0);
  d.forEach((t, i) => { if (f >= t + 7) n += i === 0 ? 1 : 4; });
  return n;
};
const AVALANCHE = () => wordAt('s06', 'كومة') + 4;

/** The heap of fallen paper in front of him (h = how high it reaches). */
const Mound: React.FC<{ x: number; h: number; w?: number }> = ({ x, h, w = 760 }) => {
  if (h <= 2) return null;
  return (
    <g transform={`translate(${x} ${FLOOR})`}>
      <path d={`M${-w / 2} 6 Q${-w / 3} ${-h * 0.9} 0 ${-h} Q${w / 3} ${-h * 0.95} ${w / 2} 6Z`} fill={PAL.white} {...stroke()} />
      {Array.from({ length: Math.floor(h / 22) }, (_, i) => {
        const yy = -h * 0.85 + i * 22 + (rand(i) - 0.5) * 8;
        const span = (w / 2) * Math.sqrt(Math.max(0, 1 + yy / h)) * 0.85;
        return <path key={i} d={bowLine(-span + rand(i + 3) * 40, yy, span - rand(i + 7) * 40, yy + (rand(i + 9) - 0.5) * 10, 2)} {...stroke(4, PAL.stone)} />;
      })}
      {[-0.3, 0.05, 0.32].map((k, i) => <path key={i} transform={`translate(${k * w} ${-h * (0.55 + (i % 2) * 0.2)}) rotate(${(i - 1) * 18})`} d="M-50 -10 L50 -10 L50 10 L-50 10Z" fill={i === 1 ? '#F7F0DC' : PAL.white} {...stroke(5)} />)}
    </g>
  );
};

const DeskRoom: React.FC<{ f: number; night: number; minutes: number; heat: number; pile: number; topple?: number; children?: React.ReactNode; win?: React.ReactNode }> = ({ f, night, minutes, heat, pile, topple = 0, children, win }) => (
  <Room f={f} night={night} minutes={minutes} heat={heat} win={win}>
    <DeskTable x={720} y={PILE[1]} w={520} />
    <PaperPile x={PILE[0]} y={PILE[1]} n={pile} topple={topple} />
    {children}
  </Room>
);

/** ««بأجّلها لبكرة»…» — he weighs a sheet, then flicks it onto the pile; a «بكرة» sheet drops on top. */
export const TasksDefer: React.FC<ShotProps> = ({ f, t0 }) => {
  const defer = wordAt('s06', 'بأجّلها'), tom = wordAt('s06', 'لبكرة');
  const id = idle(f, 61);
  const pose = poseTrack(f, [[t0, { ...POSES.stand, armR: [30, -70], handR: 'pinch', tilt: 6 }], [defer - 6, { ...POSES.stand, armR: [10, -40], handR: 'pinch', lean: -6 }], [defer + 2, { ...POSES.stand, armR: [100, 10], handR: 'open', lean: 6 }], [tom + 4, { ...POSES.wave, armR: [120, 40], tilt: -6 }]], sec(0.18));
  const toss = prog(f, defer + 2, 10, ease.inOut);
  const [hx, hy] = (() => { const [lx, ly] = handLocal(HUMAN_BUILD, pose, 1); return [HX + lx * HS, FLOOR + ly * HS]; })();
  const drop = prog(f, tom - 4, 8, ease.in);
  return (
    <Shot f={f} cam={{ cx: 580, cy: 1120, zoom: 1.12 }} bounds={BOUNDS}>
      <DeskRoom f={f} night={0.4} minutes={90} heat={0.35} pile={pileCount(f)}>
        <Human x={HX} y={FLOOR} s={HS} pose={pose} blink={id.blink} expr={exprTrack(f, [[t0, 'curious'], [defer - 4, 'smug'], [tom, 'satisfied']])} look={[0.3, 0.1]} glance={vecTrack(f, [[t0, [0.3, 0.5]], [defer, [0.8, 0.3]]])}
          itemR={f < defer + 2 ? <TaskSheet x={20} y={-30} s={0.5} rot={-10} /> : undefined} />
        {f >= defer + 2 && toss < 1 && <TaskSheet x={hx + (PILE[0] - hx) * toss} y={hy - 30 + (PILE[1] - 110 - hy) * toss - Math.sin(toss * Math.PI) * 160} s={0.5} rot={toss * 300} />}
        {f >= tom - 4 && <CalendarSheet x={PILE[0] + 10} y={-100 + drop * (PILE[1] - 15 * pileCount(f) - 40 + 100)} s={0.7} rot={(1 - drop) * 30 - 4} />}
        <Puff x={PILE[0]} y={PILE[1] - 15 * pileCount(f)} t={(f - tom - 4) / 12} s={0.8} />
      </DeskRoom>
    </Shot>
  );
};

/** «وبكرة يجيب معه كومة ثانية.» — «بكرة» sheets keep raining onto the pile; on «كومة» it topples and
 *  buries him to the chest (his face stays clear). */
export const TasksAvalanche: React.FC<ShotProps> = ({ f, t0 }) => {
  const av = AVALANCHE();
  const id = idle(f, 61);
  const d = DROPS();
  const topple = prog(f, av, 10, ease.in);
  const mound = prog(f, av + 4, 12, ease.out) * 200;
  const pose = poseTrack(f, [[t0, { ...POSES.wave, armR: [120, 40] }], [d[2], POSES.stand], [av - 2, { ...POSES.shrug, armL: [120, 40], armR: [120, 40], handL: 'open', handR: 'open' }], [av + 14, { ...POSES.stand, armL: [70, 40], armR: [70, 40], handL: 'open', handR: 'open', tilt: 8 }]], sec(0.2));
  return (
    <Shot f={f} cam={{ cx: 560, cy: 1100, zoom: keys(f, [[t0, 1.05], [av, 1.0]]), shake: f > av && f < av + 8 ? 7 : 0 }} bounds={BOUNDS}>
      <DeskRoom f={f} night={0.45} minutes={95} heat={0.38} pile={f < av ? pileCount(f) : Math.max(10, pileCount(f) - Math.floor(topple * 18))} topple={topple * 2}>
        <Human x={HX} y={FLOOR} s={HS} pose={pose} blink={id.blink} expr={exprTrack(f, [[t0, 'satisfied'], [d[3], 'neutral'], [av - 2, 'surprised'], [av + 14, 'embarrassed']])} look={[0.3, -0.2]}
          glance={vecTrack(f, [[t0, [0.5, -0.8]], [av, [0.4, -0.5]], [av + 14, [0, 0]]])} />
        {d.slice(1).map((t, i) => {
          const p = prog(f, t - 4, 8, ease.in);
          if (f < t - 4 || f > t + 10) return null;
          return <CalendarSheet key={i} x={PILE[0] + (i - 1.5) * 30} y={-140 + p * (PILE[1] - 15 * pileCount(f) - 40 + 140)} s={0.62} rot={(1 - p) * (i % 2 ? 40 : -40)} />;
        })}
        {topple > 0 && topple < 1 && Array.from({ length: 8 }, (_, i) => <path key={i} transform={`translate(${PILE[0] - topple * (180 + i * 30)} ${PILE[1] - 400 + i * 40 + topple * 300}) rotate(${topple * (90 + i * 30)})`} d="M-60 -10 L60 -10 L60 10 L-60 10Z" fill={PAL.white} {...stroke(5)} />)}
        <Mound x={HX + 40} h={mound} />
        <Puff x={HX + 60} y={FLOOR - mound} t={(f - av - 6) / 14} s={1.6} />
      </DeskRoom>
    </Shot>
  );
};

/* ------------------------------ slowly ------------------------------ */

const STEP1 = () => wordAt('s07', 'شوي'), STEP2 = () => wordAt('s07', 'شوي', 1);
const stepped = (f: number) => (f >= STEP2() ? 2 : f >= STEP1() ? 1 : 0);
const buried: Pose = { ...POSES.stand, armL: [40, -80], armR: [-12, -118], handR: 'fist', handL: 'mitten', tilt: -4 };

/** «ما تغيّر شي في يوم واحد…» / «تغيّر شوي، ثم شوي.» — he's back on the phone in the heap; on each «شوي»
 *  the heap, the clock and the wall thermometer each move one notch. He doesn't notice. */
export const SlowSteps: React.FC<ShotProps> = ({ f, t0 }) => {
  const k = stepped(f);
  const id = idle(f, 61);
  const step = (n: number) => prog(f, n === 1 ? STEP1() : STEP2(), 6, ease.back);
  const lv = k === 0 ? 0 : k === 1 ? step(1) : 1 + step(2);
  return (
    <Shot f={f} cam={{ cx: 560, cy: 1120, zoom: 1.0 + lv * 0.07 }} bounds={BOUNDS}>
      <DeskRoom f={f} night={0.6} minutes={120 + lv * 30} heat={0.42 + lv * 0.12} pile={10}>
        <Human x={HX} y={FLOOR} s={HS} pose={buried} blink={id.blink} expr={exprTrack(f, [[t0, 'satisfied']])} look={[0.1, 0.3]} glance={[0.2, 0.6]}
          itemR={phoneItem({ scroll: f * 8 })} />
        <Mound x={HX + 40} h={200 + lv * 28} />
        {lv > 0 && <Sparkles x={120} y={760} t={((f - STEP1()) % 20) / 20} r={60} n={3} color={PAL.red} seed={5} />}
      </DeskRoom>
    </Shot>
  );
};

/* ------------------------------ noticing ------------------------------ */

/** «وش الشي اللي صار عادي عندي… وهو قبل كان يزعجني؟» — he looks down at the heap, up at the clock, at the
 *  phone: a «؟» bubble; outside, the frog taps on the window glass. */
export const NoticeLook: React.FC<ShotProps> = ({ f, t0 }) => {
  const normal = wordAt('s08', 'عادي'), before = wordAt('s08', 'قبل'), bother = wordAt('s08', 'يزعجني');
  const id = idle(f, 61);
  const tap = Math.max(0, Math.sin((f - before) * 0.9)) * (f > before && f < before + 22 ? 1 : 0);
  return (
    <Shot f={f} cam={{ cx: 600, cy: 1020, zoom: keys(f, [[t0, 1.05], [bother, 1.16]]) }} bounds={BOUNDS}>
      <DeskRoom f={f} night={0.7} minutes={180} heat={0.66} pile={10}
        win={<Frog x={-40 + 40 * prog(f, before - 14, 10)} y={170} s={0.42} towel eyes="half" mouth="smirk" brow={-1} glance={[-0.6, 0]} pose={{ armR: 60 + tap * 50, armL: 20 }} />}>
        <Human x={HX} y={FLOOR} s={HS} pose={poseTrack(f, [[t0, buried], [bother - 4, { ...buried, armL: [60, -110], handL: 'open', tilt: 8 }]])} blink={f > normal ? 0 : id.blink}
          expr={exprTrack(f, [[t0, 'neutral'], [normal, 'curious'], [bother - 2, 'surprised'], [bother + sec(0.6), 'embarrassed']])} look={vecTrack(f, [[t0, [0, 0.4]], [normal, [-0.3, -0.4]], [before, [0.7, -0.2]]])}
          glance={vecTrack(f, [[t0, [0, 1]], [normal, [-0.8, -0.9]], [before, [1, -0.4]], [bother, [0, 0]]], sec(0.2))}
          itemR={phoneItem({ scroll: Math.min(f, t0 + 6) * 8 })} />
        <Mound x={HX + 40} h={256} />
        <ThoughtBubble x={HX + 210} y={720} s={0.8} pop={prog(f, normal, 10, ease.back)} />
      </DeskRoom>
    </Shot>
  );
};

/* ------------------------------ acting on it ------------------------------ */

/** «انتبه له اليوم،» — thumb to the side button; the screen goes dark on «اليوم»; phone face down. */
export const ActLock: React.FC<ShotProps> = ({ f, t0 }) => {
  const today = wordAt('s09', 'اليوم');
  const id = idle(f, 61);
  const lock = prog(f, today - 2, 5, ease.in);
  const down = prog(f, today + 8, 8, ease.inOut);
  const pose = poseTrack(f, [[t0, buried], [today - 6, { ...buried, armR: [-8, -126] }], [today + 8, { ...buried, armR: [40, -40], handR: 'open' }]], sec(0.2));
  return (
    <Shot f={f} cam={{ cx: 470, cy: 1060, zoom: keys(f, [[t0, 1.4], [today, 1.5]]) }} bounds={BOUNDS}>
      <DeskRoom f={f} night={0.7} minutes={185} heat={0.66} pile={10}>
        <Human x={HX} y={FLOOR} s={HS} pose={pose} blink={id.blink} expr={exprTrack(f, [[t0, 'embarrassed'], [today - 4, 'determined']])} look={[0.1, 0.3]} glance={[0.2, 0.7]}
          itemR={down < 0.05 ? phoneItem({ lock, scroll: t0 * 8 }) : undefined} />
        {down >= 0.05 && <g transform={`translate(${HX + 120} ${FLOOR - 262 + down * 6}) rotate(-90)`}><Phone x={0} y={0} s={0.5} lock={1} /></g>}
        <Mound x={HX + 40} h={256} />
      </DeskRoom>
    </Shot>
  );
};

/** «وغيّر خطوة وحدة صغيرة.» — he pulls one sheet out of the heap, writes, ticks it on «صغيرة», holds it
 *  up; the heap is one sheet lower; his shoulders drop with relief. */
export const ActOneTask: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const step = wordAt('s09', 'خطوة'), small = wordAt('s09', 'صغيرة');
  const id = idle(f, 61);
  const pull = prog(f, t0 + 2, 10, ease.inOut);
  const pose = poseTrack(f, [[t0, { ...buried, armR: [40, -40], handR: 'open' }], [t0 + 2, { ...buried, armR: [20, 30], handR: 'pinch', lean: 8 }], [t0 + 12, { ...buried, armR: [40, -60], handR: 'pinch', armL: [-30, -90], handL: 'fist' }], [small + 6, { ...buried, armR: [150, 30], handR: 'pinch', armL: [40, -40], tilt: 6, squash: 0.03 }], [small + 22, { ...buried, armR: [130, 30], handR: 'pinch', squash: -0.02 }]], sec(0.22));
  const writing = f >= step && f < small;
  return (
    <Shot f={f} cam={{ cx: 520, cy: 1060, zoom: keys(f, [[t0, 1.3], [small, 1.36], [t1, 1.3]]) }} bounds={BOUNDS}>
      <DeskRoom f={f} night={0.7} minutes={190} heat={0.6} pile={10}>
        <Human x={HX} y={FLOOR} s={HS} pose={pose} blink={id.blink} expr={exprTrack(f, [[t0, 'determined'], [small + 2, 'laugh'], [small + 20, 'satisfied']])} look={[0.1, f > small ? -0.2 : 0.4]}
          glance={f > small + 4 ? [0.4, -0.6] : [0.1, 0.8]}
          itemR={pull > 0 ? <TaskSheet x={0} y={-80} s={0.72} check={prog(f, small - 2, 8, ease.out)} seed={9} /> : undefined}
          itemL={f >= t0 + 12 && f < small + 6 ? <g transform={`translate(${writing ? Math.sin(f * 1.4) * 8 : 0} ${writing ? Math.cos(f * 1.1) * 5 : 0})`}><Pen x={0} y={-10} rot={30} s={0.8} /></g> : undefined} />
        <Mound x={HX + 40} h={256 - 20 * pull} />
        <Sparkles x={HX + 120} y={760} t={(f - small - 4) / 18} r={130} n={6} color={PAL.blue} seed={21} />
      </DeskRoom>
    </Shot>
  );
};

