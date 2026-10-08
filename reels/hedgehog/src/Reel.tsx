import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Hedgehog, HedgehogTone } from './art/hedgehog';
import { Book, Bookmark, ClockTag, Fence, Gift, Glow, Ground, Heart, House, Lamp, Meter, Moon, OUT, Phone, Poke, Snow, Sofa, Stars } from './art/things';
import { B, F } from './beats';
import { BODY_FONT, loadFonts } from './fonts';
import { Pill, Title } from './text';
import { C, H, SKY, W } from './theme';
import { TL, ease, mix, prog, sec } from './time';
import captions from './captions.json';

loadFonts();

// ---------------------------------------------------------------------------
// Light of each part: cold blues, then warmer as the story finds its distance.
// ---------------------------------------------------------------------------
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const PARTS: Array<[number, keyof typeof SKY]> = [
  [0, 'cold'], [B.huddle, 'huddle'], [F.s3, 'apart'], [B.settle, 'balance'], [F.s5, 'room'], [F.s6, 'dusk'], [F.s7, 'night'],
];
const Sky: React.FC = () => {
  const f = useCurrentFrame();
  let top = hex(SKY.cold[0]);
  let bot = hex(SKY.cold[1]);
  for (const [at, name] of PARTS) {
    const p = prog(f, at - 8, 18, ease.inOut);
    if (p <= 0) break;
    top = top.map((v, i) => mix(v, hex(SKY[name][0])[i], p));
    bot = bot.map((v, i) => mix(v, hex(SKY[name][1])[i], p));
  }
  const rgb = (c: number[]) => `rgb(${c.map(Math.round).join(',')})`;
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${rgb(top)} 0%, ${rgb(bot)} 100%)` }} />;
};

const Grain: React.FC = () => (
  <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <defs>
      <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={5} /><feColorMatrix values="0 0 0 0 0.97  0 0 0 0 0.93  0 0 0 0 0.86  0 0 0 0.08 0" /></filter>
      <radialGradient id="vig" cx="50%" cy="46%" r="78%"><stop offset="58%" stopColor="#000" stopOpacity={0} /><stop offset="100%" stopColor="#000" stopOpacity={0.45} /></radialGradient>
    </defs>
    <rect width={W} height={H} filter="url(#paper)" />
    <rect width={W} height={H} fill="url(#vig)" />
  </svg>
);

const G = 1400; // ground line outdoors
type HH = { key: string; x: number; y: number; s: number; dir: 1 | -1; tone?: HedgehogTone; puff?: number; shiver?: number; warm?: number; eye?: 'open' | 'closed' | 'happy' | 'wince'; look?: number; hop?: number; squash?: number; o?: number };

// ---------------------------------------------------------------------------
// 1 — two hedgehogs shuffle together for warmth, touch, get pricked, jump back.
// ---------------------------------------------------------------------------
const scene1 = (f: number): HH[] => {
  const go = prog(f, 0, B.touch, ease.inOut);
  const back = prog(f, B.ouch, 12, ease.out);
  const hopP = prog(f, B.ouch, 12);
  const puff = prog(f, B.touch - 2, 4) * (1 - prog(f, B.ouch + 14, 20));
  const cold = 1 - go * 0.7 + back * 0.7;
  const wince = f >= B.ouch && f < B.ouch + 28;
  const eye = wince ? 'wince' : f < B.touch ? 'open' : 'closed';
  return [
    { key: 'a', tone: 'brown', dir: 1, x: mix(mix(175, 418, go), 270, back), y: G, s: 0.9, puff, shiver: Math.max(0, cold), warm: go * (1 - back), eye, hop: Math.sin(hopP * Math.PI) * 60 },
    { key: 'b', tone: 'sand', dir: -1, x: mix(mix(905, 662, go), 810, back), y: G, s: 0.9, puff, shiver: Math.max(0, cold), warm: go * (1 - back), eye, hop: Math.sin(hopP * Math.PI) * 60 },
  ];
};

// ---------------------------------------------------------------------------
// 2 — a cold night: the group huddles, warms, squeezes, and the quills prick.
// ---------------------------------------------------------------------------
const GROUP: Array<{ tone: HedgehogTone; dir: 1 | -1; x0: number; x1: number; x2: number }> = [
  { tone: 'brown', dir: 1, x0: 140, x1: 318, x2: 372 },
  { tone: 'sand', dir: 1, x0: 395, x1: 466, x2: 492 },
  { tone: 'rose', dir: -1, x0: 690, x1: 614, x2: 588 },
  { tone: 'brown', dir: -1, x0: 945, x1: 762, x2: 708 },
];
const scene2 = (f: number): HH[] => {
  const hud = prog(f, B.huddle - 12, 22, ease.inOut);
  const sq = prog(f, B.squeeze, 10, ease.in);
  const jolt = prog(f, B.prick, 10);
  const puff = prog(f, B.prick - 2, 4) * (1 - prog(f, B.prick + 18, 20) * 0.4);
  return GROUP.map((g, i) => ({
    key: `g${i}`, tone: g.tone, dir: g.dir, x: mix(mix(g.x0, g.x1, hud), g.x2, sq) - g.dir * Math.sin(jolt * Math.PI) * 30, y: G, s: 0.8,
    puff, shiver: 1 - hud, warm: hud, eye: f >= B.prick && f < B.prick + 30 ? 'wince' : hud > 0.5 ? 'closed' : 'open', hop: Math.sin(jolt * Math.PI) * 26,
  }));
};

// ---------------------------------------------------------------------------
// 3 — apart, cold again; in and out; the warm distance.
// ---------------------------------------------------------------------------
const gap3 = (f: number) => {
  let g = mix(232, 660, prog(f, B.apart, 12, ease.out));
  g = mix(g, 290, prog(f, B.in1, 14, ease.inOut));
  g = mix(g, 520, prog(f, B.out1, 14, ease.inOut));
  g = mix(g, 390, prog(f, B.settle, 18, ease.inOut));
  return g;
};
const scene3 = (f: number): HH[] => {
  const g = gap3(f);
  const close = g < 320 ? (320 - g) / 90 : 0;
  const far = g > 470 ? (g - 470) / 190 : 0;
  const found = prog(f, B.found, 10);
  const eye = found > 0.5 ? 'happy' : close > 0.3 ? 'wince' : 'open';
  return [
    { key: 'a', tone: 'brown', dir: 1, x: 540 - g / 2, y: G, s: 0.9, puff: close, shiver: far, warm: 1 - far, eye, hop: Math.sin(prog(f, B.apart, 12) * Math.PI) * 40 },
    { key: 'b', tone: 'sand', dir: -1, x: 540 + g / 2, y: G, s: 0.9, puff: close, shiver: far, warm: 1 - far, eye, hop: Math.sin(prog(f, B.apart, 12) * Math.PI) * 40 },
  ];
};

// ---------------------------------------------------------------------------
// 4 — the meter sets the pair's distance.
// ---------------------------------------------------------------------------
const marker4 = (f: number) => {
  let m = 0.88;
  m = mix(m, 0.5, prog(f, B.warmZone - 6, 14, ease.inOut));
  m = mix(m, 0.12, prog(f, B.redZone - 6, 12, ease.inOut));
  m = mix(m, 0.5, prog(f, B.redZone + 16, 14, ease.inOut));
  return m;
};
const scene4 = (f: number): HH[] => {
  const m = marker4(f);
  const g = mix(232, 640, m);
  const close = m < 0.3 ? (0.3 - m) / 0.18 : 0;
  const far = m > 0.66 ? (m - 0.66) / 0.22 : 0;
  const eye = close > 0.4 ? 'wince' : far > 0.4 ? 'open' : 'happy';
  return [
    { key: 'a', tone: 'brown', dir: 1, x: 540 - g / 2, y: G, s: 0.8, puff: close, shiver: far, warm: 1 - far, eye },
    { key: 'b', tone: 'sand', dir: -1, x: 540 + g / 2, y: G, s: 0.8, puff: close, shiver: far, warm: 1 - far, eye },
  ];
};

// ---------------------------------------------------------------------------
// 5 — the phone and the soft bubble.
// ---------------------------------------------------------------------------
const SEAT = 1335;
const scene5 = (f: number): HH[] => {
  const peek = prog(f, B.peek, 12, ease.inOut);
  const bump = prog(f, B.bump, 10, ease.out);
  const bx = mix(mix(330, 452, peek), 372, bump);
  return [
    { key: 'b', tone: 'rose', dir: 1, x: bx, y: SEAT, s: 0.82, look: peek > 0 && bump < 0.5 ? 1 : 0, eye: bump > 0.3 ? 'happy' : 'open', squash: Math.sin(bump * Math.PI) * 0.5 },
    { key: 'a', tone: 'brown', dir: -1, x: 730, y: SEAT, s: 0.82, puff: 0.5 * prog(f, B.peek + 4, 8) * (1 - bump), eye: bump > 0.5 ? 'happy' : 'open', look: 1 },
  ];
};

// ---------------------------------------------------------------------------
// 6 — two houses, a visit at the agreed time, the gentle fence.
// ---------------------------------------------------------------------------
const HOME_L = 220, HOME_R = 860, G6 = 1420, HS = 0.95;
const scene6 = (f: number): HH[] => {
  const walk = prog(f, B.walk, Math.max(24, B.door - 6 - B.walk), ease.inOut);
  const x = mix(HOME_R - 80, HOME_L + 190, walk);
  const step = walk > 0 && walk < 1 ? Math.abs(Math.sin(f / 4)) * 10 : 0;
  const host = prog(f, B.door + 4, 10, ease.back);
  const out: HH[] = [{ key: 'a', tone: 'brown', dir: -1, x, y: G6, s: 0.7, hop: step, eye: walk >= 1 ? 'happy' : 'open' }];
  if (host > 0) out.push({ key: 'h', tone: 'sand', dir: 1, x: HOME_L + 60, y: G6, s: 0.62 * host, eye: 'happy' });
  return out;
};

// ---------------------------------------------------------------------------
// 7 — the warm distance; save.
// ---------------------------------------------------------------------------
const scene7 = (f: number): HH[] => {
  const breathe = Math.sin(f / 14) * 0.06;
  return [
    { key: 'a', tone: 'brown', dir: 1, x: 345, y: G, s: 1, warm: 1, eye: 'happy', squash: breathe },
    { key: 'b', tone: 'sand', dir: -1, x: 735, y: G, s: 1, warm: 1, eye: 'happy', squash: -breathe },
  ];
};

const hedgehogs = (f: number): HH[] =>
  f < F.s2 ? scene1(f) : f < F.s3 ? scene2(f) : f < F.s4 ? scene3(f) : f < F.s5 ? scene4(f) : f < F.s6 ? scene5(f) : f < F.s7 ? scene6(f) : scene7(f);

// ---------------------------------------------------------------------------
// The world behind and around them.
// ---------------------------------------------------------------------------
const Backdrop: React.FC<{ f: number }> = ({ f }) => {
  if (f < F.s5) {
    const snow = f < F.s2 ? mix(0.35, 0.8, prog(f, B.book + 6, 20)) : f < F.s3 ? mix(0.8, 0.4, prog(f, B.huddle - 12, 22)) : f < F.s4 ? mix(1, 0.3, prog(f, B.settle, 20)) : 0.25;
    return (
      <g>
        {f < F.s4 && <Moon x={880} y={760} o={0.9} />}
        <Snow f={f} density={snow} wind={f >= F.s3 && f < B.settle ? 0.25 : 0.05} />
        <Ground y={G + 6} color={f < F.s4 ? '#D7E7F7' : '#2C335E'} />
      </g>
    );
  }
  if (f < F.s6) {
    return (
      <g>
        <rect x={0} y={1440} width={1080} height={480} fill="#3A2538" />
        <path d="M 0 1440 L 1080 1440" stroke={C.ink} strokeWidth={6} />
        <Lamp x={960} y={1440} on={1} />
        <Sofa x={540} y={1440} w={680} />
      </g>
    );
  }
  if (f < F.s7) {
    const door = prog(f, B.door, 12, ease.out);
    return (
      <g>
        <Stars f={f} o={0.5} />
        <Ground y={G6 + 6} color="#2F4A44" />
        <path d={`M ${HOME_R - 60} ${G6 + 30} Q 540 ${G6 + 70} ${HOME_L + 80} ${G6 + 30}`} fill="none" stroke={C.paper} strokeWidth={8} strokeDasharray="22 18" opacity={0.45} />
        <House x={HOME_L} y={G6} s={HS} color="#E9D3AE" roof={C.coral} door={door} lit={1} />
        <House x={HOME_R} y={G6} s={HS} color="#CFE3F5" roof={C.blue} door={0} lit={1} flip />
        <Fence x={540} y={G6} w={300} glow={prog(f, B.fence, 14)} gate={prog(f, B.walk - 6, 10, ease.out)} />
      </g>
    );
  }
  return (
    <g>
      <Stars f={f} />
      <Moon x={860} y={640} o={0.9} />
      <Ground y={G + 6} color="#2A2F5E" />
    </g>
  );
};

const Effects: React.FC<{ f: number }> = ({ f }) => {
  const out: React.ReactNode[] = [];
  if (f < F.s2) {
    const go = prog(f, 0, B.touch, ease.inOut) * (1 - prog(f, B.ouch, 10));
    out.push(<Glow key="g1" id="g1" x={540} y={1290} r={360} o={go} />);
    out.push(<Poke key="p1" x={540} y={1190} p={prog(f, B.ouch - 4, 18)} s={1.2} />);
    out.push(<Poke key="p2" x={500} y={1240} p={prog(f, B.ouch - 1, 16)} s={0.7} />);
    out.push(<Poke key="p3" x={585} y={1230} p={prog(f, B.ouch + 1, 16)} s={0.7} />);
    const bookIn = prog(f, B.book - 4, 12, ease.back);
    if (bookIn > 0) out.push(<g key="book" opacity={Math.min(1, bookIn)}><Book x={540} y={880} s={0.8 * bookIn} open={prog(f, B.book + 6, 14, ease.inOut)} /></g>);
  } else if (f < F.s3) {
    const warm = prog(f, B.huddle - 12, 22) * (1 - prog(f, B.prick + 4, 12) * 0.5);
    out.push(<Glow key="g2" id="g2" x={540} y={1300} r={430} o={warm} />);
    [432, 540, 648].forEach((x, i) => out.push(<Poke key={`p${i}`} x={x} y={1250 - (i % 2) * 40} p={prog(f, B.prick - 2 + i * 2, 18)} s={0.85} />));
  } else if (f < F.s4) {
    const g = gap3(f);
    const far = g > 470 ? (g - 470) / 190 : 0;
    out.push(<Glow key="ga" id="ga" x={540 - g / 2} y={1300} r={300} o={0.9 * (1 - far)} />);
    out.push(<Glow key="gb" id="gb" x={540 + g / 2} y={1300} r={300} o={0.9 * (1 - far)} />);
    out.push(<Poke key="p" x={540} y={1200} p={prog(f, B.in1 + 12, 16)} s={0.9} />);
    const found = prog(f, B.found, 12, ease.out);
    if (found > 0) {
      const a = 540 - g / 2 + 120, b = 540 + g / 2 - 120;
      out.push(<g key="arrow" opacity={found}><path d={`M ${a} 1130 L ${b} 1130`} stroke={C.paper} strokeWidth={6} strokeDasharray="14 12" /><path d={`M ${a + 20} 1112 L ${a} 1130 L ${a + 20} 1148 M ${b - 20} 1112 L ${b} 1130 L ${b - 20} 1148`} fill="none" stroke={C.paper} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /><Heart x={540} y={1060} s={1.1 * found} color={C.amber} /></g>);
    }
  } else if (f < F.s5) {
    const m = marker4(f);
    const g = mix(232, 640, m);
    const far = m > 0.66 ? (m - 0.66) / 0.22 : 0;
    const inP = prog(f, F.s4 - 4, 12, ease.out);
    out.push(<Glow key="g4" id="g4" x={540} y={1310} r={300 + (1 - m) * 60} o={(1 - far) * 0.9} />);
    const shake = f >= B.redZone && f < B.redZone + 14 ? Math.sin(f * 2.2) * 8 : 0;
    out.push(<Meter key="m" x={540} y={880} w={760} marker={m} shake={shake} o={inP} />);
    out.push(<Poke key="p" x={540} y={1230} p={prog(f, B.redZone + 2, 16)} s={0.9} />);
    if (g > 0) out.push(<Snow key="s" f={f} density={far * 0.9} />);
  } else if (f < F.s6) {
    const love = prog(f, B.love, 10, ease.back) * (1 - prog(f, B.peek, 8)) + prog(f, B.space, 10, ease.back);
    out.push(<Heart key="h" x={555} y={1000} s={1.2 * Math.min(1, love)} o={Math.min(1, love)} />);
    const bub = prog(f, B.bubble - 4, 12, ease.back);
    if (bub > 0) out.push(<circle key="bub" cx={700} cy={1215} r={215 * bub} fill={C.green} fillOpacity={0.08} stroke={C.green} strokeWidth={6} strokeDasharray="18 14" opacity={0.9} />);
    out.push(<Phone key="ph" x={560} y={1170} s={0.85} rot={-14} glow={0.6 + 0.4 * Math.sin(f / 8)} />);
  } else if (f < F.s7) {
    const walk = prog(f, B.walk, Math.max(24, B.door - 6 - B.walk), ease.inOut);
    const x = mix(HOME_R - 80, HOME_L + 190, walk);
    const step = walk > 0 && walk < 1 ? Math.abs(Math.sin(f / 4)) * 10 : 0;
    if (prog(f, B.door + 6, 8) < 1) out.push(<Gift key="gift" x={x - 150} y={G6 - 10 - step} s={0.95} />);
    else out.push(<Gift key="gift" x={HOME_L + 130} y={G6 - 6} s={0.95} />);
    out.push(<ClockTag key="clk" x={HOME_L + 70} y={920} p={prog(f, B.clock, 10, ease.back)} tick={prog(f, B.clock + 10, 10)} />);
    out.push(<Heart key="hh" x={HOME_L + 150} y={1150 - prog(f, B.door + 10, 20) * 40} s={prog(f, B.door + 10, 10, ease.back)} o={1 - prog(f, B.door + 30, 10)} />);
    for (let i = 0; i < 4; i++) {
      const t = prog(f, B.hearts + i * 8, 34, ease.inOut);
      if (t <= 0 || t >= 1) continue;
      const lr = i % 2 === 0;
      const hx = lr ? mix(HOME_L + 60, HOME_R - 60, t) : mix(HOME_R - 60, HOME_L + 60, t);
      out.push(<Heart key={`f${i}`} x={hx} y={1100 - Math.sin(t * Math.PI) * 220} s={0.8} o={Math.sin(t * Math.PI)} color={lr ? C.coral : C.amber} />);
    }
  } else {
    out.push(<Glow key="ga" id="g7a" x={345} y={1300} r={330} o={0.9} />);
    out.push(<Glow key="gb" id="g7b" x={735} y={1300} r={330} o={0.9} />);
    const drop = prog(f, B.save, 16, ease.back);
    if (drop > 0) out.push(<Bookmark key="bm" x={540} y={mix(-120, 980, drop)} s={1.1} />);
  }
  return <g>{out}</g>;
};

const camera = (f: number) => {
  let k = 1, cx = 540, cy = 1250;
  if (f < F.s2) k = mix(1, 1.06, prog(f, 0, F.s2));
  else if (f < F.s3) { k = 0.98; }
  else if (f < F.s4) { k = mix(1, 1.12, prog(f, B.settle, 30, ease.inOut)); cy = 1260; }
  else if (f >= F.s6 && f < F.s7) { k = 1; cy = 1200; }
  else if (f >= F.s7) k = mix(1, 1.08, prog(f, F.s7, F.end - F.s7));
  return `translate(540 ${cy}) scale(${k}) translate(${-cx} ${-cy})`;
};

const World: React.FC = () => {
  const f = useCurrentFrame();
  const seed = (Math.floor(f / 4) % 3) + 2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves={1} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={3} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g transform={camera(f)}>
        <Backdrop f={f} />
        <g filter="url(#boil)">
          <Effects f={f} />
          {hedgehogs(f).map(({ key, ...h }) => <Hedgehog key={key} {...h} f={f} />)}
        </g>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Words: titles and labels (the approved copy), captions (the locked script).
// ---------------------------------------------------------------------------
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / TL.fps;
  const cur = (captions as Array<{ text: string; start: number; end: number }>).find((c, i, all) => t >= c.start - 0.05 && t < Math.max(c.end + 0.25, all[i + 1] ? Math.min(all[i + 1].start - 0.05, c.end + 0.6) : c.end + 0.6));
  if (!cur) return null;
  const pin = prog(f, Math.round((cur.start - 0.05) * TL.fps), 5);
  return (
    <div style={{ position: 'absolute', top: 1500, left: 90, right: 90, display: 'flex', justifyContent: 'center', opacity: pin }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 50, lineHeight: 1.3, color: C.ivory, background: 'rgba(12,18,40,0.78)', padding: '10px 30px 16px', borderRadius: 26, textAlign: 'center', maxWidth: 880 }}>
        {cur.text}
      </div>
    </div>
  );
};

const Texts: React.FC = () => (
  <AbsoluteFill>
    <Title text={`معضلة {${C.amber}|القنفذ}`} from={0} to={F.s2 - 2} size={132} pop />
    <Pill text="حكاية فلسفية لشوبنهاور" x={540} y={470} bg={C.violet} from={B.book} to={F.s2 - 2} size={48} w={620} />
    <Pill text="برد" x={540} y={520} bg={C.blue} from={B.cold} to={B.huddle + 10} size={64} w={240} />
    <Pill text="وخز" x={540} y={520} bg={C.red} from={B.prick} to={F.s3 - 2} size={64} w={240} />
    <Pill text="مسافة دافية" x={540} y={520} bg={C.green} from={B.found} to={F.s4 - 2} size={60} w={440} />
    <Title text={`القرب {${C.amber}|يدفّي}…\nوالزايد {${C.red}|يوخز}`} from={F.s4} to={F.s5 - 2} size={104} />
    <Title text={`{${C.green}|مساحتك}\nمو قطيعة`} from={B.bump} to={F.s6 - 2} size={112} />
    <Title text={`ود مستمر…\n{${C.amber}|بموعد مريح}`} from={B.visit} to={F.s7 - 2} size={104} />
    <Pill text="الحد اللطيف يحمي الود" x={540} y={470} bg={C.green} from={B.fence} to={F.s7 - 2} size={48} w={620} />
    <Title text={`مسافة {${C.amber}|دافية}`} from={F.s7} to={F.end + 2} size={124} />
    <Pill text="كتاب وبس" x={540} y={1510} bg="rgba(27,31,51,0.75)" from={F.end - sec(1.4)} to={F.end + 10} size={42} w={280} />
    <Captions />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Sound: the narration as recorded, and light effects tied to actions. No music.
// ---------------------------------------------------------------------------
const SFX: Array<[string, number, number]> = [
  ['whoosh', 2, 0.12], ['snap', B.ouch - 2, 0.35], ['pop', B.ouch, 0.25], ['thud', B.ouch + 12, 0.2], ['pageflip', B.book + 4, 0.35],
  ['whoosh', B.huddle - 10, 0.15], ['snap', B.prick, 0.35], ['pop', B.prick + 2, 0.22], ['pop', B.prick + 4, 0.2],
  ['whoosh', B.apart, 0.2], ['snap', B.in1 + 12, 0.25], ['chime', B.found, 0.22],
  ['tick', B.warmZone, 0.3], ['snap', B.redZone + 2, 0.3], ['chime', B.redZone + 28, 0.18],
  ['pop', B.love, 0.25], ['click', B.peek, 0.25], ['pop', B.bubble, 0.3], ['thud', B.bump, 0.18],
  ['click', B.walk - 6, 0.3], ['tick', B.clock + 10, 0.3], ['chime', B.door, 0.25], ['pop', B.hearts, 0.18], ['pop', B.hearts + 16, 0.18],
  ['chime', B.save + 10, 0.2],
];

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink }}>
    <Sky />
    <World />
    <Grain />
    <Texts />
    <Audio src={staticFile('voice/narration.wav')} />
    {SFX.filter(([, at]) => Number.isFinite(at) && at >= 0 && at < TL.durationInFrames).map(([name, at, vol], i) => (
      <Sequence key={i} from={at} durationInFrames={sec(1.6)} layout="none"><Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} /></Sequence>
    ))}
  </AbsoluteFill>
);
