import React from 'react';
import { BODY, COLORS, HANDLE, TINT, TITLE } from './config';
import { ease, life, mix, p } from './motion';
import { STAND, Stick, handAt, mixPose, stride, type Face, type Pose } from './stick';
import { L1, sceneStart, w } from './timing';

// Twelve scenes, one per spoken line; every action sits on a spoken word. Drawn on the 1080×1920 frame, with the
// pictures in y 380–1360 and the caption under them (all inside the 4:5 band, y 285–1635).
const FLOOR = 1260;

const Floor: React.FC<{ o?: number }> = ({ o = 1 }) => <line x1={90} x2={990} y1={FLOOR} y2={FLOOR} stroke={TINT.dim} strokeWidth={5} strokeLinecap="round" opacity={o} />;
const Txt: React.FC<{ x: number; y: number; size: number; children: React.ReactNode; color?: string; o?: number; anchor?: 'middle' | 'start' | 'end'; weight?: number; font?: string }> = ({ x, y, size, children, color = COLORS.white, o = 1, anchor = 'middle', weight = 800, font = TITLE }) => (
  <text x={x} y={y} fontSize={size} fontFamily={font} fontWeight={weight} fill={color} textAnchor={anchor} direction="rtl" opacity={o}>{children}</text>
);
const Bubble: React.FC<{ x: number; y: number; text: string; o: number; tail?: 1 | -1; w?: number; size?: number }> = ({ x, y, text, o, tail = 1, w: bw = 230, size = 46 }) => o <= 0 ? null : (
  <g opacity={o} transform={`translate(${x} ${y}) scale(${mix(0.7, 1, o)})`}>
    <rect x={-bw / 2} y={-56} width={bw} height={100} rx={34} fill={COLORS.white} />
    <path d={`M${tail * 20} 40 L${tail * 44} 78 L${tail * 52} 40 Z`} fill={COLORS.white} />
    <Txt x={0} y={14} size={size} color={COLORS.navy}>{text}</Txt>
  </g>
);
const Book: React.FC<{ x: number; y: number; s?: number; r?: number; o?: number; open?: number; color?: string }> = ({ x, y, s = 1, r = 0, o = 1, open = 0, color = COLORS.blue }) => (
  <g opacity={o} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    {open > 0.5 ? (
      <>
        <rect x={-64} y={-44} width={62} height={86} rx={6} fill={color} stroke={COLORS.white} strokeWidth={4} />
        <rect x={2} y={-44} width={62} height={86} rx={6} fill={color} stroke={COLORS.white} strokeWidth={4} />
        {[0, 1, 2].map((k) => <g key={k}><line x1={-52} x2={-14} y1={-24 + k * 18} y2={-24 + k * 18} stroke={COLORS.white} strokeWidth={3} opacity={0.6} /><line x1={14} x2={52} y1={-24 + k * 18} y2={-24 + k * 18} stroke={COLORS.white} strokeWidth={3} opacity={0.6} /></g>)}
      </>
    ) : (
      <>
        <rect x={-46} y={-60} width={92} height={120} rx={8} fill={color} stroke={COLORS.white} strokeWidth={4} />
        <rect x={34} y={-60} width={12} height={120} fill={COLORS.white} opacity={0.35} />
        <line x1={-26} x2={20} y1={-22} y2={-22} stroke={COLORS.white} strokeWidth={5} strokeLinecap="round" />
        <line x1={-26} x2={6} y1={-4} y2={-4} stroke={COLORS.white} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
      </>
    )}
  </g>
);
const Mask: React.FC<{ x: number; y: number; s?: number; o?: number; r?: number; split?: number }> = ({ x, y, s = 1, o = 1, r = 0, split = 0 }) => (
  <g opacity={o} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    {[-1, 1].map((d) => (
      <g key={d} transform={`translate(${d * split * 40} ${split * 10}) rotate(${d * split * 18})`}>
        <clipPath id={`half${d}`}><rect x={d < 0 ? -70 : 0} y={-80} width={70} height={160} /></clipPath>
        <g clipPath={split > 0 ? `url(#half${d})` : undefined}>
          <path d="M-44 -40 Q0 -62 44 -40 Q52 10 0 52 Q-52 10 -44 -40 Z" fill={COLORS.blue} stroke={COLORS.white} strokeWidth={4} />
          <ellipse cx={-17} cy={-12} rx={10} ry={7} fill={COLORS.navy} /><ellipse cx={17} cy={-12} rx={10} ry={7} fill={COLORS.navy} />
          <path d="M-20 16 Q0 34 20 16" fill="none" stroke={COLORS.navy} strokeWidth={5} strokeLinecap="round" />
        </g>
      </g>
    ))}
  </g>
);
/** A sofa: back and seat; people sit on it with SIT at foot = FLOOR − 70. */
const Couch: React.FC<{ x0: number; x1: number; o?: number }> = ({ x0, x1, o = 1 }) => (
  <g opacity={o}>
    <rect x={x0} y={FLOOR - 330} width={x1 - x0} height={170} rx={30} fill={TINT.panel} stroke={TINT.line} strokeWidth={3} />
    <rect x={x0 - 20} y={FLOOR - 170} width={x1 - x0 + 40} height={100} rx={26} fill={TINT.panel2} stroke={TINT.line} strokeWidth={3} />
    <rect x={x0} y={FLOOR - 70} width={20} height={70} fill={TINT.panel2} /><rect x={x1 - 20} y={FLOOR - 70} width={20} height={70} fill={TINT.panel2} />
  </g>
);
const Clock: React.FC<{ x: number; y: number; t: number; o?: number; r?: number }> = ({ x, y, t, o = 1, r = 64 }) => (
  <g opacity={o} transform={`translate(${x} ${y})`}>
    <circle r={r} fill={COLORS.white} />
    <circle r={r} fill="none" stroke={COLORS.blue} strokeWidth={7} />
    <line x1={0} y1={0} x2={Math.sin(t / 12 * Math.PI * 2) * r * 0.5} y2={-Math.cos(t / 12 * Math.PI * 2) * r * 0.5} stroke={COLORS.navy} strokeWidth={7} strokeLinecap="round" />
    <line x1={0} y1={0} x2={Math.sin(t * Math.PI * 2) * r * 0.75} y2={-Math.cos(t * Math.PI * 2) * r * 0.75} stroke={COLORS.navy} strokeWidth={5} strokeLinecap="round" />
    <circle r={6} fill={COLORS.navy} />
  </g>
);

type Scene = (f: number) => React.ReactNode;
const SIT: Pose = { lean: -14, head: 8, armF: [60, 100], armB: [40, 90], legF: [84, 4], legB: [80, 0] };
const SITY = FLOOR - 70;
const nod = (f: number, a: number, b: number) => (f > a && f < b ? Math.sin(((f - a) / 9) * Math.PI) * 14 : 0);
const FRIENDS = [250, 410, 570];

// 1 — the name of the game: a mask turns into a face, and four figures go from outline to solid
const s1: Scene = (f) => {
  const title = 1; // on screen from frame 0: the hook is the first frame
  const flip = p(f, w(1, 3) - 4, 22, ease.inOut);
  const sx = Math.abs(Math.cos(flip * Math.PI));
  return (
    <g>
      <g opacity={title} transform={`translate(0 ${mix(30, 0, title)})`}>
        <Txt x={540} y={500} size={124}>لعبة التمثيل</Txt>
      </g>
      <g transform={`translate(540 760) scale(${sx * 1.7} 1.7)`}>
        {flip < 0.5 ? <Mask x={0} y={0} /> : (
          <g>
            <circle r={52} fill={COLORS.white} />
            <circle cx={18} cy={-8} r={6} fill={COLORS.navy} /><circle cx={-14} cy={-8} r={6} fill={COLORS.navy} />
            <path d="M-16 14 Q2 30 20 14" fill="none" stroke={COLORS.navy} strokeWidth={5} strokeLinecap="round" />
          </g>
        )}
      </g>
      {[0, 1, 2, 3].map((k) => {
        const on = p(f, w(1, 2) + k * 10, 14, ease.out);
        const solid = p(f, w(1, 3) + k * 9, 12);
        const c = k === 3 ? COLORS.green : COLORS.white;
        return (
          <g key={k} opacity={on}>
            <g opacity={mix(0.35, 1, solid * (k + 1) / 4)}><Stick x={780 - k * 170} foot={1250} s={0.48} face={k === 3 ? 'proud' : 'neutral'} color={c} look={-0.4} /></g>
            {k < 3 && <path d={`M${700 - k * 170} 1120 h-30 m12 -12 l-12 12 l12 12`} fill="none" stroke={TINT.dim} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />}
          </g>
        );
      })}
    </g>
  );
};

/** The sofa scene shared by lines 2, 4 and 7: friends on the left facing right, the hero on the right facing them. */
const Gathering: React.FC<{ f: number; hero: Pose; heroFoot: number; heroFace: Face; sweat?: number; friendFace?: Face; turn?: number; look?: number; children?: React.ReactNode; book?: number }> = ({ f, hero, heroFoot, heroFace, sweat = 0, friendFace = 'smile', turn = 0, look = 0.5, children, book = 0 }) => {
  const bk = handAt(820, heroFoot, hero, 1, -1);
  return (
    <g>
      <Floor />
      <Couch x0={150} x1={950} />
      {FRIENDS.map((x, k) => (
        <Stick key={k} x={x} foot={SITY} pose={k === 0 ? { ...SIT, head: 8 - 14 * turn, armF: [mix(60, 100, turn), mix(100, 80, turn)] } : SIT} face={friendFace} look={look} blink={Math.floor((f + k * 37) / 50) % 6 === 0} />
      ))}
      <Stick x={820} foot={heroFoot} pose={hero} face={heroFace} dir={-1} sweat={sweat} look={0.5} />
      {book > 0 && <Book x={bk[0] - 30} y={bk[1] - 40} s={0.9} open={1} o={book} r={8} />}
      {children}
    </g>
  );
};

// 2 — at a gathering the friends praise a book; he says «إيه قريته»
const s2: Scene = (f) => {
  const praise = life(f, w(2, 5) - 6, w(2, 8), 14, 12);
  const say = p(f, w(2, 9) - 4, 14, ease.out);
  return (
    <Gathering f={f} hero={{ ...SIT, head: 8 + nod(f, w(2, 9), w(2, 10) + 24) }} heroFoot={SITY} heroFace={say > 0.5 ? 'smile' : 'neutral'}>
      <g opacity={praise} transform="translate(410 640)">
        <rect x={-150} y={-80} width={300} height={150} rx={60} fill={COLORS.white} />
        <path d="M-20 70 L-40 110 L10 70 Z" fill={COLORS.white} />
        <Book x={-50} y={-4} s={0.7} />
        <path d="M60 -22 a20 20 0 0 1 34 0 a20 20 0 0 1 34 0 q0 30 -34 52 q-34 -22 -34 -52 Z" fill={COLORS.green} transform="translate(-20 0) scale(0.9)" />
      </g>
      <Bubble x={800} y={690} text="إيه قريته" o={say} tail={-1} w={270} />
    </Gathering>
  );
};

// 3 — he never opened it: the book still in its wrap, a cobweb draws across it
const s3: Scene = (f) => {
  const t0 = sceneStart(3);
  const zoom = p(f, t0, 30, ease.out);
  const web = p(f, w(3, 2), 22, ease.out);
  return (
    <g>
      <Floor />
      <g transform={`translate(400 ${mix(900, 860, zoom)}) scale(${mix(2.2, 2.6, zoom)})`}>
        <Book x={0} y={0} />
        <rect x={-52} y={-66} width={104} height={132} rx={10} fill={COLORS.white} opacity={0.12} />
        <path d="M-40 -62 L-10 -40 M40 -62 L10 -40" stroke={COLORS.white} strokeWidth={2} opacity={0.5} />
        <g opacity={web} stroke={COLORS.white} strokeWidth={1.6} fill="none">
          {[0, 1, 2, 3, 4].map((k) => <line key={k} x1={46} y1={-60} x2={46 - Math.cos((k * 22 * Math.PI) / 180) * 60 * web} y2={-60 + Math.sin((k * 22 * Math.PI) / 180) * 60 * web} />)}
          {[18, 34, 50].map((r) => <path key={r} d={`M${46 - r} -60 Q${46 - r * 0.8} ${-60 + r * 0.5} ${46 - r * 0.7} ${-60 + r * 0.7} Q${46 - r * 0.4} ${-60 + r * 0.9} 46 ${-60 + r}`} />)}
        </g>
      </g>
      <Stick x={780} foot={FLOOR} pose={{ ...STAND, head: -8, armB: [-20, -60] }} face="nervous" dir={-1} sweat={p(f, w(3, 1), 14)} look={-0.6} />
      <Txt x={400} y={1170} size={44} weight={700} font={BODY} color={TINT.dim} o={web}>ما انفتح</Txt>
    </g>
  );
};

// 4 — one friend turns to him: «وش أكثر فصل عجبك؟»; he sweats
const s4: Scene = (f) => {
  const turn = p(f, w(4, 2) - 4, 14, ease.out);
  const ask = p(f, w(4, 4) - 6, 14, ease.out);
  const zoom = p(f, sceneStart(4), 50, ease.inOut) + p(f, w(4, 4), 40, ease.inOut);
  const s = 1 + 0.09 * zoom;
  return (
    <g transform={`translate(${600 * (1 - s)} ${900 * (1 - s)}) scale(${s})`}>
      <Gathering f={f} hero={SIT} heroFoot={SITY} heroFace={ask > 0.5 ? 'nervous' : 'smile'} sweat={p(f, w(4, 6), 16)} friendFace={ask > 0.5 ? 'wow' : 'smile'} turn={turn} look={0.8}>
        <Bubble x={500} y={640} text="وش أكثر فصل عجبك؟" o={ask} tail={1} w={480} size={42} />
      </Gathering>
    </g>
  );
};

// 5 — a vague answer gets him out; then the night: awake on the bed, the clock, the next gathering on his mind
const s5: Scene = (f) => {
  const night = p(f, w(5, 4) - 6, 24, ease.inOut);
  const think = p(f, w(5, 9) - 8, 16, ease.out);
  const t = mix(11, 15, p(f, w(5, 5), L1(5) - w(5, 5) + 30, ease.lin));
  return (
    <g>
      <rect x={-100} y={-100} width={1280} height={2120} fill="#000" opacity={0.35 * night} />
      <g opacity={night}>
        <rect x={720} y={480} width={220} height={260} rx={14} fill="none" stroke={TINT.dim} strokeWidth={6} />
        <line x1={830} x2={830} y1={480} y2={740} stroke={TINT.dim} strokeWidth={4} />
        <path d="M900 540 a40 40 0 1 1 -30 70 a32 32 0 1 0 30 -70 Z" fill={COLORS.white} />
        <Clock x={210} y={560} t={t} />
      </g>
      <Floor />
      <rect x={300} y={FLOOR - 160} width={520} height={90} rx={22} fill={TINT.panel2} stroke={TINT.line} strokeWidth={3} />
      <rect x={300} y={FLOOR - 250} width={50} height={180} rx={20} fill={TINT.panel2} stroke={TINT.line} strokeWidth={3} />
      <rect x={320} y={FLOOR - 70} width={20} height={70} fill={TINT.panel2} /><rect x={780} y={FLOOR - 70} width={20} height={70} fill={TINT.panel2} />
      <Stick x={540} foot={SITY + 10} pose={{ ...SIT, head: mix(-6, 14, night), armF: [mix(30, 150, 1 - night), mix(40, 170, 1 - night)] }} face={night > 0.5 ? 'tired' : 'smile'} sweat={night * think} look={0.2} blink={false} />
      <g opacity={think} transform={`translate(0 ${mix(20, 0, think)})`}>
        <circle cx={600} cy={760} r={14} fill={COLORS.white} /><circle cx={630} cy={720} r={20} fill={COLORS.white} />
        <rect x={470} y={470} width={340} height={210} rx={80} fill={COLORS.white} />
        <g transform="translate(640 600) scale(0.5)">
          <rect x={-200} y={-90} width={400} height={90} rx={20} fill={TINT.panel2} />
          {[-120, 0, 120].map((x) => <g key={x} transform={`translate(${x} -150)`}><circle r={36} fill={COLORS.navy} /><line y1={36} y2={110} stroke={COLORS.navy} strokeWidth={14} strokeLinecap="round" /></g>)}
        </g>
        <Txt x={760} y={560} size={70} color={COLORS.blue}>؟</Txt>
      </g>
    </g>
  );
};

// 6 — the summary, then a chapter, then the whole book, at the desk at night
const s6: Scene = (f) => {
  const items = [w(6, 1), w(6, 3), w(6, 5)].map((a) => p(f, a - 6, 16, ease.settle));
  const t = mix(15, 23, p(f, sceneStart(6), L1(6) - sceneStart(6), ease.lin));
  const desk = { ...SIT, lean: 8, head: 14, armF: [90, 100] as [number, number], armB: [80, 95] as [number, number] };
  return (
    <g>
      <rect x={-100} y={-100} width={1280} height={2120} fill="#000" opacity={0.35} />
      <Floor />
      <Clock x={180} y={720} t={t} r={58} />
      <rect x={430} y={FLOOR - 240} width={500} height={24} rx={8} fill={TINT.panel2} stroke={TINT.line} strokeWidth={3} />
      <rect x={880} y={FLOOR - 216} width={20} height={216} fill={TINT.panel2} /><rect x={460} y={FLOOR - 216} width={20} height={216} fill={TINT.panel2} />
      <path d={`M860 ${FLOOR - 240} V${FLOOR - 400} L790 ${FLOOR - 460}`} fill="none" stroke={TINT.dim} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M760 ${FLOOR - 470} l70 -10 l-10 60 Z`} fill={COLORS.white} />
      <path d={`M780 ${FLOOR - 440} L620 ${FLOOR - 240} H900 Z`} fill={COLORS.white} opacity={0.08} />
      <rect x={210} y={FLOOR - 150} width={190} height={24} rx={10} fill={TINT.panel2} />
      <rect x={300} y={FLOOR - 126} width={16} height={126} fill={TINT.panel2} />
      <Stick x={330} foot={SITY - 20} pose={desk} face="neutral" look={0.6} />
      {[['ملخّص', COLORS.white, 0.6], ['فصل', COLORS.blue, 0.8], ['الكتاب كله', COLORS.green, 1.1]].map(([t, c, k], j) => (
        <g key={j} opacity={items[j]} transform={`translate(${800 - j * 230} ${mix(560, 600, items[j])})`}>
          <rect x={-60} y={-80 * (k as number)} width={120} height={80 * (k as number)} rx={10} fill={c as string} stroke={COLORS.white} strokeWidth={4} />
          <Txt x={0} y={60} size={40} font={BODY} weight={700} color={j === 2 ? COLORS.green : COLORS.white}>{t}</Txt>
          {j > 0 && <path d="M88 -30 h-30 m12 -12 l-12 12 l12 12" fill="none" stroke={TINT.dim} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={items[j]} />}
        </g>
      ))}
    </g>
  );
};

// 7 — the next gathering: he stands and explains the book, the friends listen
const s7: Scene = (f) => {
  const up = p(f, w(7, 3) - 6, 22, ease.inOut);
  const talk = f > w(7, 3) ? Math.sin(f / 5) * 10 : 0;
  const hero = mixPose(SIT, { ...STAND, armF: [70 + talk, 60], armB: [-30, -40] }, up);
  return (
    <Gathering f={f} hero={hero} heroFoot={mix(SITY, FLOOR, up)} heroFace={up > 0.5 ? 'proud' : 'smile'} friendFace={up > 0.5 ? 'wow' : 'smile'} look={0.8} book={up}>
      {[0, 1, 2].map((k) => <Txt key={k} x={FRIENDS[k] + 10} y={760 - 12 * Math.sin((f + k * 20) / 8)} size={56} color={COLORS.green} o={p(f, w(7, 5) + k * 6, 10)}>!</Txt>)}
    </Gathering>
  );
};

// 8 — to master the role he had to live it: the mask comes down and the face under it wears the same look
const s8: Scene = (f) => {
  const role = p(f, w(8, 4) - 4, 16, ease.out);
  const down = p(f, w(8, 6) - 4, 24, ease.inOut);
  const hold: Pose = { ...STAND, armF: [mix(150, 30, down), mix(165, 20, down)] };
  const hd = handAt(540, FLOOR, hold, 1, 1);
  return (
    <g>
      <Floor />
      <Stick x={540} foot={FLOOR} pose={hold} face="proud" look={0} />
      <Mask x={mix(560, hd[0] + 10, down)} y={mix(705, hd[1] - 10, down)} s={mix(1.25, 0.8, down)} r={mix(0, 30, down)} />
      <Txt x={540} y={470} size={78} o={role * (1 - p(f, w(8, 6) - 6, 10))}>عشان تتقن الدور…</Txt>
      <Txt x={540} y={470} size={96} color={COLORS.green} o={p(f, w(8, 6) + 6, 16)}>تعيشه</Txt>
    </g>
  );
};

// 9 — with time the acting stops being acting: the word is struck out, the mask splits on the floor
const s9: Scene = (f) => {
  const strike = p(f, w(9, 3) - 4, 18, ease.out);
  const split = p(f, w(9, 5) - 4, 20, ease.out);
  return (
    <g>
      <Run f={f} />
      <Txt x={540} y={540} size={120} o={1 - 0.6 * strike}>تمثيل</Txt>
      {strike > 0.01 && <line x1={760} x2={mix(760, 320, strike)} y1={505} y2={505} stroke={COLORS.green} strokeWidth={12} strokeLinecap="round" />}
      <Mask x={mix(260, 220, split)} y={FLOOR - 40} s={0.9} r={-10} split={split} o={p(f, sceneStart(9), 12)} />
    </g>
  );
};

/** Walking in place with the floor moving under him. */
const Run: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {[0, 1, 2, 3, 4].map((k) => { const x = 1000 - ((f * 5 + k * 210) % 1050); return <line key={k} x1={x} x2={x + 90} y1={FLOOR + 24 + (k % 2) * 22} y2={FLOOR + 24 + (k % 2) * 22} stroke={TINT.dim} strokeWidth={5} strokeLinecap="round" opacity={0.5} />; })}
    <Floor />
    <Stick x={620} foot={FLOOR} pose={stride(f / 8, 0.9)} face="smile" look={0.4} />
  </g>
);

const GHOST: Pose = { ...STAND, lean: -4, head: -8, armF: [30, 20] };
const ICONS = (f: number) => [w(11, 4), w(11, 5), w(11, 6)].map((a) => p(f, a - 6, 14, ease.settle));

// 10 — use it for yourself: pick the person you want to become (a dashed green figure)
const s10: Scene = (f) => {
  const use = p(f, w(10, 1) - 4, 16, ease.out);
  const ghost = p(f, w(10, 3) - 4, 20, ease.out);
  return (
    <g>
      <Floor />
      <Txt x={540} y={480} size={86} color={COLORS.green} o={use * (1 - ghost)}>لصالحك</Txt>
      <g opacity={ghost}>
        <Stick x={760} foot={FLOOR} pose={GHOST} face="proud" dir={-1} color={COLORS.green} o={0.55} />
        <Txt x={760} y={720} size={46} weight={700} font={BODY} color={COLORS.green}>اللي تبي تصيره</Txt>
      </g>
      <Stick x={260} foot={FLOOR} pose={{ ...STAND, head: -6 * ghost }} face={ghost > 0.5 ? 'wow' : 'smile'} look={0.6} />
    </g>
  );
};

// 11 — act like him from today: his sleep, his words, his habits light up as he walks toward him
const s11: Scene = (f) => {
  const walk = p(f, w(11, 0), L1(11) - w(11, 0) + 20, ease.inOut);
  const x = mix(260, 560, walk);
  const ic = ICONS(f);
  const labels = ['نومه', 'كلامه', 'عاداته'];
  return (
    <g>
      <Floor />
      {[0, 1, 2, 3, 4, 5].map((k) => <ellipse key={k} cx={330 + k * 70} cy={FLOOR + 22 + (k % 2) * 10} rx={20} ry={8} fill={COLORS.green} opacity={0.55 * (x > 300 + k * 70 ? 0.4 : 1)} />)}
      <Stick x={760} foot={FLOOR} pose={GHOST} face="proud" dir={-1} color={COLORS.green} o={0.55} />
      <Stick x={x} foot={FLOOR} pose={walk > 0 && walk < 1 ? stride((f - w(11, 0)) / 7, 1) : STAND} face="smile" look={0.6} />
      {[0, 1, 2].map((k) => (
        <g key={k} opacity={ic[k]} transform={`translate(${780 - k * 240} 520) scale(${mix(0.6, 1, ic[k])})`}>
          <circle r={70} fill={TINT.panel2} stroke={COLORS.green} strokeWidth={6} />
          {k === 0 && <path d="M18 -34 a36 36 0 1 0 22 50 a30 30 0 1 1 -22 -50 Z" fill={COLORS.white} />}
          {k === 1 && <g><rect x={-38} y={-30} width={76} height={50} rx={18} fill={COLORS.white} /><path d="M-14 18 L-24 38 L4 18 Z" fill={COLORS.white} /></g>}
          {k === 2 && [0, 1, 2].map((j) => <g key={j} transform={`translate(0 ${-24 + j * 24})`}><rect x={-34} y={-8} width={16} height={16} rx={4} fill={COLORS.green} /><line x1={-6} x2={34} y1={0} y2={0} stroke={COLORS.white} strokeWidth={6} strokeLinecap="round" /></g>)}
          <Txt x={0} y={124} size={40} font={BODY} weight={700}>{labels[k]}</Txt>
        </g>
      ))}
    </g>
  );
};

// 12 — until nothing is left to act: the mask fades from his hand, he steps into the green figure; «لأنك صرته»
const s12: Scene = (f) => {
  const walk = p(f, sceneStart(12), w(12, 6) - sceneStart(12), ease.inOut);
  const x = mix(560, 760, walk);
  const maskGone = p(f, w(12, 5) - 4, 24);
  const merged = p(f, w(12, 7) - 4, 20);
  const end = p(f, w(12, 7) - 6, 22, ease.out);
  const h = p(f, L1(12) + 30, 20);
  const pose = merged > 0 ? mixPose(STAND, GHOST, merged) : walk > 0 && walk < 1 ? stride((f - sceneStart(12)) / 7, 1) : STAND;
  const hd = handAt(x, FLOOR, pose, 1, 1, false);
  return (
    <g>
      <Floor />
      <g opacity={1 - merged}><Stick x={760} foot={FLOOR} pose={GHOST} face="proud" dir={-1} color={COLORS.green} o={0.55} /></g>
      <Stick x={x} foot={FLOOR} pose={pose} face={merged > 0.5 ? 'proud' : 'smile'} look={0.6} color={merged > 0.5 ? COLORS.green : COLORS.white} />
      <Mask x={hd[0]} y={hd[1] + 30} s={0.6} r={20} o={1 - maskGone} />
      {merged > 0 && <circle cx={760} cy={FLOOR - 200} r={mix(120, 300, merged)} fill="none" stroke={COLORS.green} strokeWidth={6} opacity={1 - merged} />}
      <g opacity={end} transform={`translate(0 ${mix(30, 0, end)})`}>
        <Txt x={540} y={520} size={110} color={COLORS.green}>لأنك صرته</Txt>
      </g>
      <text x={540} y={1340} fontSize={40} fontFamily={BODY} fontWeight={700} fill={TINT.dim} textAnchor="middle" direction="ltr" opacity={h}>{HANDLE}</text>
    </g>
  );
};

export const SCENES: Scene[] = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12];
