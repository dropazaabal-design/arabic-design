import React from 'react';
import { BODY, COLORS, HANDLE, TINT, TITLE } from './config';
import { ease, kf, life, mix, p } from './motion';
import { STAND, Stick, handAt, mixPose, stride, type Face, type Pose } from './stick';
import { L0, L1, sceneStart, w } from './timing';

// Ten scenes, one per spoken line; every action sits on a spoken word. Drawn on the 1080×1920 frame, with the
// pictures in y 380–1360 and the caption under them (all inside the 4:5 band, y 285–1635).
const FLOOR = 1260;

const Floor: React.FC<{ o?: number }> = ({ o = 1 }) => <line x1={90} x2={990} y1={FLOOR} y2={FLOOR} stroke={TINT.dim} strokeWidth={5} strokeLinecap="round" opacity={o} />;
const Txt: React.FC<{ x: number; y: number; size: number; children: React.ReactNode; color?: string; o?: number; anchor?: 'middle' | 'start' | 'end'; weight?: number; font?: string }> = ({ x, y, size, children, color = COLORS.white, o = 1, anchor = 'middle', weight = 800, font = TITLE }) => (
  <text x={x} y={y} fontSize={size} fontFamily={font} fontWeight={weight} fill={color} textAnchor={anchor} direction="rtl" opacity={o}>{children}</text>
);
const Bubble: React.FC<{ x: number; y: number; text: string; o: number; tail?: 1 | -1; w?: number }> = ({ x, y, text, o, tail = 1, w: bw = 230 }) => o <= 0 ? null : (
  <g opacity={o} transform={`translate(${x} ${y}) scale(${mix(0.7, 1, o)})`}>
    <rect x={-bw / 2} y={-56} width={bw} height={100} rx={34} fill={COLORS.white} />
    <path d={`M${tail * 20} 40 L${tail * 44} 78 L${tail * 52} 40 Z`} fill={COLORS.white} />
    <Txt x={0} y={14} size={46} color={COLORS.navy}>{text}</Txt>
  </g>
);
const Badge: React.FC<{ text?: string }> = ({ text = 'منضبط' }) => (
  <g>
    <rect x={-58} y={-24} width={116} height={46} rx={10} fill={COLORS.green} />
    <text x={0} y={9} fontSize={28} fontFamily={TITLE} fontWeight={800} fill={COLORS.navy} textAnchor="middle" direction="rtl">{text}</text>
  </g>
);
const Calendar: React.FC<{ x: number; y: number; day: number; o?: number; flip?: number }> = ({ x, y, day, o = 1, flip = 0 }) => (
  <g opacity={o} transform={`translate(${x} ${y})`}>
    <rect x={-90} y={-80} width={180} height={170} rx={20} fill={COLORS.white} />
    <rect x={-90} y={-80} width={180} height={48} rx={20} fill={COLORS.blue} />
    <rect x={-90} y={-50} width={180} height={18} fill={COLORS.blue} />
    <text x={0} y={-44} fontSize={28} fontFamily={TITLE} fontWeight={800} fill={COLORS.white} textAnchor="middle" direction="rtl">يوم</text>
    <g transform={`scale(1 ${1 - Math.sin(flip * Math.PI) * 0.9})`}><text x={0} y={60} fontSize={84} fontFamily={TITLE} fontWeight={800} fill={COLORS.navy} textAnchor="middle">{day}</text></g>
  </g>
);
const Mask: React.FC<{ x: number; y: number; s?: number; o?: number; r?: number }> = ({ x, y, s = 1, o = 1, r = 0 }) => (
  <g opacity={o} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <path d="M-44 -40 Q0 -62 44 -40 Q52 10 0 52 Q-52 10 -44 -40 Z" fill={COLORS.blue} stroke={COLORS.white} strokeWidth={4} />
    <ellipse cx={-17} cy={-12} rx={10} ry={7} fill={COLORS.navy} /><ellipse cx={17} cy={-12} rx={10} ry={7} fill={COLORS.navy} />
    <path d="M-20 16 Q0 34 20 16" fill="none" stroke={COLORS.navy} strokeWidth={5} strokeLinecap="round" />
    <line x1={40} y1={40} x2={66} y2={110} stroke={COLORS.white} strokeWidth={6} strokeLinecap="round" />
  </g>
);

type Scene = (f: number) => React.ReactNode;
const nod = (f: number, a: number, b: number) => (f > a && f < b ? Math.sin(((f - a) / 9) * Math.PI) * 14 : 0);

// 1 — asked about a book he hasn't read, he nods anyway
const s1: Scene = (f) => {
  const ask = p(f, w(1, 3) - 4, 14, ease.out) * (1 - p(f, w(1, 8), 12));
  const nervous = f > w(1, 8);
  const hero: Pose = { ...STAND, head: nod(f, w(1, 8), w(1, 11) + 20), armF: [14, 10] };
  const friendPose: Pose = { ...STAND, armF: [70, 40] };
  const bk = handAt(330, FLOOR, friendPose, 1, 1);
  return (
    <g>
      <Floor />
      <Stick x={330} foot={FLOOR} pose={friendPose} face="smile" look={0.6} />
      <g transform={`translate(${bk[0] + 30} ${bk[1] - 30}) rotate(-8)`}>
        <rect x={-62} y={-44} width={60} height={86} rx={6} fill={COLORS.blue} stroke={COLORS.white} strokeWidth={4} />
        <rect x={2} y={-44} width={60} height={86} rx={6} fill={COLORS.blue} stroke={COLORS.white} strokeWidth={4} />
        {[0, 1, 2].map((k) => <line key={k} x1={12} x2={52} y1={-24 + k * 18} y2={-24 + k * 18} stroke={COLORS.white} strokeWidth={3} opacity={0.6} />)}
      </g>
      <Bubble x={330} y={640} text="قريته؟" o={ask} tail={1} />
      <Stick x={760} foot={FLOOR} pose={hero} face={nervous ? 'nervous' : 'neutral'} dir={-1} sweat={p(f, w(1, 10), 14)} look={0.4} />
    </g>
  );
};

// 2 — that's acting: a spotlight and a mask; then a second kind of acting, the kind that changes you
const s2: Scene = (f) => {
  const t0 = sceneStart(2);
  const stage = p(f, t0, 20, ease.out);
  const maskUp = p(f, w(2, 1) - 6, 14, ease.out) * (1 - p(f, w(2, 2), 16, ease.inOut));
  const turn = p(f, w(2, 4), 16);
  return (
    <g>
      <path d={`M540 300 L${540 - 240 * stage} ${FLOOR} H${540 + 240 * stage} Z`} fill={COLORS.white} opacity={0.07 * stage} />
      <ellipse cx={540} cy={FLOOR} rx={240 * stage} ry={30} fill={COLORS.white} opacity={0.1 * stage} />
      {[-1, 1].map((d) => <path key={d} d={`M${540 + d * 540} 300 V1300 H${540 + d * (540 - 230 * stage)} Q${540 + d * (540 - 170 * stage)} 800 ${540 + d * (540 - 230 * stage)} 300 Z`} fill={COLORS.blue} opacity={0.85} />)}
      <Floor o={0.6} />
      <Stick x={540} foot={FLOOR} pose={{ ...STAND, armF: [mix(14, 150, maskUp), mix(10, 160, maskUp)] }} face={turn > 0.5 ? 'wow' : 'nervous'} look={mix(0.4, 0, turn)} sweat={1 - turn} />
      <Mask x={mix(600, 548, maskUp)} y={mix(1060, 690, maskUp)} s={1.15} o={maskUp > 0.02 ? 1 : 0} />
      <Txt x={540} y={470} size={88} o={life(f, w(2, 1) - 4, w(2, 2) + 6)} color={COLORS.white}>تمثيل</Txt>
      <Txt x={540} y={470} size={70} o={p(f, w(2, 5), 14)} color={COLORS.green}>تمثيل يغيّرك</Txt>
    </g>
  );
};

// 3 — an old idea in psychology: act as if
const s3: Scene = (f) => {
  const bulb = p(f, w(3, 1) - 4, 16, ease.settle);
  const title = p(f, w(3, 7) - 4, 22, ease.out);
  const point = p(f, w(3, 7) - 8, 16);
  return (
    <g>
      <Floor />
      <g opacity={bulb} transform={`translate(560 ${640 - 30 * bulb})`}>
        <circle r={52} fill="none" stroke={COLORS.green} strokeWidth={8} />
        <path d="M-18 52 V76 H18 V52" fill="none" stroke={COLORS.green} strokeWidth={8} strokeLinejoin="round" />
        {[-60, -20, 20, 60].map((a) => <line key={a} x1={Math.sin((a * Math.PI) / 180) * 72} y1={-Math.cos((a * Math.PI) / 180) * 72} x2={Math.sin((a * Math.PI) / 180) * 94} y2={-Math.cos((a * Math.PI) / 180) * 94} stroke={COLORS.green} strokeWidth={7} strokeLinecap="round" />)}
      </g>
      <Stick x={460} foot={FLOOR} pose={{ ...STAND, armF: [mix(10, 160, point), mix(6, 170, point)], head: -10 * point }} face={title > 0.5 ? 'proud' : 'wow'} look={0.3} />
      <g opacity={title} transform={`translate(0 ${mix(30, 0, title)})`}>
        <Txt x={540} y={470} size={130}>تصرّف كأنّك</Txt>
        <path d="M870 505 Q540 525 210 505" fill="none" stroke={COLORS.green} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p(f, w(3, 8), 24)} />
      </g>
    </g>
  );
};

// 4 — wants to be disciplined; the feeling never finishes loading; he gets up and acts the part today
const SIT: Pose = { lean: -14, head: 8, armF: [60, 100], armB: [40, 90], legF: [84, 4], legB: [80, 0] };
const s4: Scene = (f) => {
  const think = life(f, w(4, 0), w(4, 3), 14, 10);
  const bar = life(f, w(4, 3) - 4, w(4, 6), 12, 10);
  const up = p(f, w(4, 6), 26, ease.inOut);
  const badge = p(f, w(4, 9) - 4, 14, ease.settle);
  const clock = p(f, w(4, 10) - 4, 16, ease.out);
  const hero = mixPose(SIT, { ...STAND, lean: -3, head: -6, armF: [20, 10] }, up);
  const foot = mix(FLOOR - 70, FLOOR, up);
  const load = Math.min(0.12, ((f - w(4, 3)) / 40) * 0.12);
  return (
    <g>
      <Floor />
      <g opacity={1 - up * 0.6}>
        <rect x={250} y={FLOOR - 170} width={420} height={100} rx={26} fill={TINT.panel2} stroke={TINT.line} strokeWidth={3} />
        <rect x={230} y={FLOOR - 240} width={60} height={170} rx={24} fill={TINT.panel2} stroke={TINT.line} strokeWidth={3} />
        <rect x={270} y={FLOOR - 70} width={20} height={70} fill={TINT.panel2} /><rect x={630} y={FLOOR - 70} width={20} height={70} fill={TINT.panel2} />
      </g>
      <Stick x={mix(430, 540, up)} foot={foot} pose={hero} face={up > 0.5 ? 'smile' : 'tired'} look={0.4} blink={up < 0.3 && Math.floor(f / 40) % 4 === 0}
        chest={badge > 0.01 ? <g transform={`scale(${badge}) rotate(${mix(-20, -6, badge)})`}><Badge /></g> : null} />
      <g opacity={think}>
        {[[560, 760, 14], [600, 720, 20]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill={COLORS.white} />)}
        <rect x={560} y={540} width={260} height={130} rx={60} fill={COLORS.white} />
        <Txt x={690} y={624} size={54} color={COLORS.navy}>منضبط؟</Txt>
      </g>
      <g opacity={bar} transform="translate(540 520)">
        <Txt x={0} y={-40} size={42} weight={700} font={BODY}>الشعور</Txt>
        <rect x={-220} y={0} width={440} height={44} rx={22} fill="none" stroke={COLORS.white} strokeWidth={4} />
        <rect x={210 - 420 * Math.max(0, load)} y={10} width={420 * Math.max(0, load)} height={24} rx={12} fill={COLORS.blue} />
        <Txt x={0} y={100} size={36} weight={700} font={BODY} color={TINT.dim}>{Math.floor(f / 20) % 2 ? 'جارٍ التحميل…' : 'جارٍ التحميل'}</Txt>
      </g>
      <g opacity={clock} transform={`translate(830 ${560 + 20 * (1 - clock)})`}>
        <circle r={78} fill={COLORS.white} />
        <circle r={78} fill="none" stroke={COLORS.blue} strokeWidth={8} />
        <line x1={0} y1={0} x2={0} y2={-48} stroke={COLORS.navy} strokeWidth={7} strokeLinecap="round" />
        <line x1={0} y1={0} x2={0} y2={40} stroke={COLORS.navy} strokeWidth={7} strokeLinecap="round" />
        <circle r={7} fill={COLORS.navy} />
        <text y={130} fontSize={44} fontFamily={TITLE} fontWeight={800} fill={COLORS.white} textAnchor="middle">6:00</text>
      </g>
    </g>
  );
};

/** Running in place: speed lines move on the floor so the run reads without the figure leaving the frame. */
const Run: React.FC<{ f: number; face: Face; sweat?: number; badge?: React.ReactNode; smooth?: number }> = ({ f, face, sweat = 0, badge, smooth = 0 }) => {
  const ph = f / (smooth > 0.5 ? 6.5 : 5.2);
  const pose = stride(ph, 1, true);
  return (
    <g>
      {[0, 1, 2, 3, 4].map((k) => { const x = 1000 - (((f * 9 + k * 210) % 1050)); return <line key={k} x1={x} x2={x + 90} y1={FLOOR + 24 + (k % 2) * 22} y2={FLOOR + 24 + (k % 2) * 22} stroke={TINT.dim} strokeWidth={5} strokeLinecap="round" opacity={0.6} />; })}
      <Floor />
      <Stick x={520} foot={FLOOR} pose={{ ...pose, head: smooth > 0.5 ? -4 : 6 + Math.sin(f / 4) * 4 }} face={face} sweat={sweat} look={0.5} chest={badge} />
    </g>
  );
};

// 5 — the first days feel like acting: the badge is crooked, the days crawl
const s5: Scene = (f) => {
  const day = f < w(5, 1) ? 1 : f < w(5, 2) ? 2 : 3;
  const fl = Math.max(p(f, w(5, 1) - 6, 12), 0) % 1;
  return (
    <g>
      <Run f={f} face="nervous" sweat={0.9 + 0.1 * Math.sin(f / 6)} badge={<g transform={`rotate(${-14 + Math.sin(f / 5) * 6})`}><Badge /></g>} />
      <Calendar x={820} y={560} day={day} o={p(f, sceneStart(5), 14)} flip={fl} />
      <g opacity={life(f, w(5, 3) - 4, w(5, 4) + 50)}>
        <rect x={160} y={480} width={300} height={120} rx={56} fill={COLORS.white} />
        <circle cx={420} cy={630} r={16} fill={COLORS.white} /><circle cx={455} cy={668} r={10} fill={COLORS.white} />
        <Txt x={310} y={560} size={54} color={COLORS.navy}>أنا أمثّل؟</Txt>
      </g>
    </g>
  );
};

// 6 — two weeks on, he forgets he is acting: the badge falls off and he runs on
const s6: Scene = (f) => {
  const roll = p(f, w(6, 0), Math.max(8, w(6, 1) + 10 - w(6, 0)), ease.inOut);
  const day = Math.round(mix(3, 14, roll));
  const drop = p(f, w(6, 2) - 6, 30, ease.in);
  const calm = p(f, w(6, 2), 20);
  return (
    <g>
      <Run f={f} face={calm > 0.5 ? 'smile' : 'nervous'} sweat={1 - calm} smooth={calm} badge={drop < 0.02 ? <g transform="rotate(-10)"><Badge /></g> : null} />
      {drop >= 0.02 && drop < 1 && <g transform={`translate(${520 - 120 * drop} ${FLOOR - 240 + 230 * drop}) rotate(${-10 - 160 * drop})`} opacity={1 - drop * 0.3}><Badge /></g>}
      {drop >= 1 && <g transform={`translate(${400 - (f - w(6, 2) - 24) * 9} ${FLOOR - 12}) rotate(-170)`} opacity={0.7}><Badge /></g>}
      <Calendar x={820} y={560} day={day} />
    </g>
  );
};

// 7 — nobody was watching: he wasn't lying to people, he was training
const s7: Scene = (f) => {
  const chairs = life(f, w(7, 1) - 6, w(7, 6) - 4, 14, 12);
  const grid = p(f, w(7, 6) - 6, 14, ease.out);
  const ticks = Math.floor(kf(f, [[w(7, 6), 0], [w(7, 7) + 50, 14]], ease.inOut));
  return (
    <g>
      <Floor />
      <g opacity={chairs}>
        {[0, 1, 2].map((k) => <g key={k} transform={`translate(${640 + k * 120} ${FLOOR})`}><path d="M-34 0 V-70 H34 V0 M-34 -70 V-150" fill="none" stroke={TINT.dim} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" /></g>)}
        <Txt x={760} y={980} size={44} weight={700} font={BODY} color={TINT.dim}>ولا أحد يتفرّج</Txt>
      </g>
      <Stick x={330} foot={FLOOR} pose={{ ...STAND, armF: [mix(10, 120, grid), mix(6, 175, grid)], armB: [mix(-10, -120, grid), mix(-6, -175, grid)] }} face={grid > 0.5 ? 'proud' : 'neutral'} look={0.4} />
      <g opacity={grid} transform="translate(500 520)">
        {Array.from({ length: 14 }, (_, k) => {
          const x = (k % 7) * 62, y = Math.floor(k / 7) * 70, on = k < ticks;
          return (
            <g key={k} transform={`translate(${x} ${y})`}>
              <rect width={50} height={50} rx={10} fill={on ? COLORS.green : 'none'} stroke={on ? COLORS.green : COLORS.white} strokeWidth={4} />
              {on && <path d="M12 26 l9 9 l17 -20" fill="none" stroke={COLORS.navy} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />}
            </g>
          );
        })}
        <Txt x={214} y={210} size={48} color={COLORS.green}>تدريب</Txt>
      </g>
    </g>
  );
};

// 8 — one convinces others (a mask, an audience); the other convinces himself (a mirror)
const s8: Scene = (f) => {
  const right = p(f, w(8, 0) - 6, 16, ease.out);
  const left = p(f, w(8, 5) - 6, 16, ease.out);
  return (
    <g>
      <line x1={540} x2={540} y1={430} y2={FLOOR + 40} stroke={TINT.line} strokeWidth={4} />
      <g opacity={right}>
        <Txt x={810} y={500} size={52} color={COLORS.white}>يتصنّع</Txt>
        <Txt x={810} y={560} size={34} weight={700} font={BODY} color={TINT.dim}>يقنع غيره</Txt>
        <line x1={580} x2={1010} y1={FLOOR} y2={FLOOR} stroke={TINT.dim} strokeWidth={5} strokeLinecap="round" />
        <Stick x={900} foot={FLOOR} s={0.78} dir={-1} pose={{ ...STAND, armF: [120, 120] }} face="smile" look={0.6} />
        <Mask x={mix(810, 800, 0)} y={890} s={0.8} r={-20} />
        {[640, 720].map((x, k) => <Stick key={k} x={x} foot={FLOOR} s={0.5} pose={STAND} face="neutral" look={0.8} o={0.6} />)}
      </g>
      <g opacity={left}>
        <Txt x={270} y={500} size={52} color={COLORS.green}>يتصرّف كأنّه</Txt>
        <Txt x={270} y={560} size={34} weight={700} font={BODY} color={TINT.dim}>يقنع نفسه</Txt>
        <line x1={70} x2={500} y1={FLOOR} y2={FLOOR} stroke={TINT.dim} strokeWidth={5} strokeLinecap="round" />
        <rect x={110} y={760} width={150} height={500} rx={18} fill={TINT.panel2} stroke={COLORS.white} strokeWidth={6} />
        <g opacity={0.45}><Stick x={185} foot={FLOOR - 20} s={0.62} pose={STAND} face="proud" look={0.5} /></g>
        <Stick x={400} foot={FLOOR} s={0.78} dir={-1} pose={{ ...STAND, lean: -3, head: -6 }} face="proud" look={0.4} />
      </g>
    </g>
  );
};

// 9 — choose the person you want to become, and walk like him from tomorrow
const s9: Scene = (f) => {
  const ghost = p(f, w(9, 1) - 4, 18, ease.out);
  const walk = p(f, w(9, 5), Math.max(30, L1(9) - w(9, 5) + 10), ease.inOut);
  const x = mix(260, 760, walk);
  const walking = walk > 0 && walk < 1;
  const merged = p(f, L1(9) + 4, 18);
  const pose = walking ? stride((f - w(9, 5)) / 7, 1) : STAND;
  return (
    <g>
      <Floor />
      {[0, 1, 2, 3, 4, 5].map((k) => <ellipse key={k} cx={330 + k * 80} cy={FLOOR + 22 + (k % 2) * 10} rx={20} ry={8} fill={COLORS.green} opacity={ghost * 0.55 * (x > 300 + k * 80 ? 0.4 : 1)} />)}
      <g opacity={ghost * (1 - merged)}>
        <Stick x={760} foot={FLOOR} pose={{ ...STAND, lean: -4, head: -8, armF: [30, 20] }} face="proud" dir={-1} color={COLORS.green} o={0.55} />
      </g>
      <Stick x={x} foot={FLOOR} pose={merged > 0 ? mixPose(STAND, { ...STAND, lean: -4, head: -8, armF: [30, 20] }, merged) : pose} face={merged > 0.5 ? 'proud' : 'smile'} look={0.6} />
      {merged > 0 && <circle cx={760} cy={FLOOR - 200} r={mix(120, 260, merged)} fill="none" stroke={COLORS.green} strokeWidth={6} opacity={1 - merged} />}
      <Txt x={760} y={720} size={46} weight={700} font={BODY} color={COLORS.green} o={ghost * (1 - merged)}>اللي تبي تصيره</Txt>
    </g>
  );
};

// 10 — the question, and the hold
const s10: Scene = (f) => {
  const q = p(f, L0(10) - 4, 22, ease.out);
  const h = p(f, L1(10) + 24, 20);
  return (
    <g>
      <Floor />
      <Stick x={540} foot={FLOOR} pose={{ ...STAND, armF: [40, 120] }} face="smile" look={0} blink={Math.floor(f / 50) % 5 === 0} />
      <g opacity={q} transform={`translate(0 ${mix(30, 0, q)})`}>
        <Txt x={540} y={500} size={86}>وش أول عادة</Txt>
        <Txt x={540} y={610} size={86} color={COLORS.green}>بتمثّلها؟</Txt>
      </g>
      <text x={540} y={1340} fontSize={40} fontFamily={BODY} fontWeight={700} fill={TINT.dim} textAnchor="middle" direction="ltr" opacity={h}>{HANDLE}</text>
    </g>
  );
};

export const SCENES: Scene[] = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10];
