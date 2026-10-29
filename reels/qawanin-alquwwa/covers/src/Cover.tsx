import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Bubble, C, T } from './kit/draw';
import { Mini } from './kit/people';
import * as P from './kit/props';
import * as Q from './kit/props2';
import { BODY, NUM, TITLE } from './fonts';

// One cinematic cover per part, 1080×1920: a dark stage, a single top light with haze, dust and an anamorphic
// flare, the part's emblem lit in the beam, a two-line hook, and film grain over all. Text stays inside the
// centre 3:4 (y 240–1680) so the profile grid crop keeps it.

const LAMP = { x: 540, y: 120 };
const FLOOR = 1250;
const AMBER = '#FFC56B';
const ICE = '#8CC4FF';
const ORD = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];

/** The bait from part 3: a fishing line and hook with a gift on it (bottom of the line at 0,0). */
const Bait: React.FC = () => <g>
  <path d="M0 -420 L0 0 Q0 60 -46 60 Q-90 60 -90 16" fill="none" stroke={C.grey} strokeWidth={10} strokeLinecap="round" />
  <path d="M-90 16 L-106 40 M-90 16 L-70 34" stroke={C.grey} strokeWidth={8} strokeLinecap="round" />
  <g transform="translate(0 -40) scale(0.7)"><P.Box label="هدية" c={C.pink} /></g>
</g>;

type Part = { laws: [number, number]; title: [string, string]; hero: React.ReactNode };
const PARTS: Record<number, Part> = {
  1: { laws: [1, 3], title: ['حفلة فاخرة', 'كلّفته حريته'], hero: <g>
    <g transform="translate(540 720)"><Q.Fireworks w={460} /></g>
    <g transform={`translate(540 ${FLOOR}) scale(1.05)`}><Q.Chateau /></g>
    <g transform={`translate(540 ${FLOOR}) scale(1.35)`}><Q.Bars at={-100} w={420} h={430} /></g>
  </g> },
  2: { laws: [4, 10], title: ['هل الصمت', 'قوة؟'], hero: <g>
    <g transform="translate(540 640) scale(1.6)"><P.Crown /></g>
    <g transform="translate(540 980)"><Bubble w={560} h={320} tail={[120, 240]}><T y={-30} size={200}>…</T></Bubble></g>
  </g> },
  3: { laws: [11, 15], title: ['هل الكرم', 'دائمًا بريء؟'], hero: <g transform={`translate(560 ${FLOOR - 120}) scale(1.75)`}><Bait /></g> },
  4: { laws: [16, 20], title: ['هل غيابك', 'يرفع قيمتك؟'], hero: <g>
    <path d={`M470 ${FLOOR} L250 ${FLOOR + 60} L830 ${FLOOR + 60} L612 ${FLOOR} Z`} fill={AMBER} opacity={0.25} />
    <g transform={`translate(540 ${FLOOR}) scale(2.3)`}><P.Door open={0.45} /></g>
  </g> },
  5: { laws: [21, 26], title: ['هل التواضع', 'حيلة أحيانًا؟'], hero: <g transform="translate(540 930) scale(3.4)"><P.Mask /></g> },
  6: { laws: [27, 32], title: ['لماذا نتبع', 'من يبيعنا الوهم؟'], hero: <g>
    <g transform="translate(540 760) scale(2.0)"><P.Cloud /></g>
    <g transform="translate(540 560) scale(1.1)"><Q.Stars n={3} /></g>
    {[0, 1, 2].map((i) => <Mini key={i} x={360 + i * 180} y={FLOOR} s={2.1} c={[C.teal, C.pink, C.green][i]} head={i === 1 ? 'hijab' : 'hair'} hc={C.navy} />)}
  </g> },
};

/** Deterministic dust inside the light cone. */
const DUST = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => { const x = Math.sin(i * 97.13 + n * 13.7) * 43758.5453; return x - Math.floor(x); };
  const y = 260 + r(1) * (FLOOR - 300);
  const half = 40 + ((y - LAMP.y) / (FLOOR - LAMP.y)) * 330;
  return { x: LAMP.x + (r(2) * 2 - 1) * half, y, s: 1.5 + r(3) * 3.5, o: 0.15 + r(4) * 0.5 };
});

export const Cover: React.FC<{ part: number }> = ({ part }) => {
  const p = PARTS[part];
  const glow = (id: string, color: string, sd: number) => <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation={sd} /><feColorMatrix type="matrix" values={`0 0 0 0 ${parseInt(color.slice(1, 3), 16) / 255} 0 0 0 0 ${parseInt(color.slice(3, 5), 16) / 255} 0 0 0 0 ${parseInt(color.slice(5, 7), 16) / 255} 0 0 0 1 0`} />
  </filter>;
  const line = (text: string, y: number, color: string, glowId: string) => <g>
    <text x={540} y={y} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={900} fontSize={text.length > 11 ? 104 : 124} fill={color} filter={`url(#${glowId})`} opacity={0.75}>{text}</text>
    <text x={540} y={y} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={900} fontSize={text.length > 11 ? 104 : 124} fill={color}>{text}</text>
  </g>;
  return <AbsoluteFill style={{ background: '#05070D' }}>
    <svg viewBox="0 0 1080 1920" width="100%" height="100%">
      <defs>
        <radialGradient id="bg" cx="540" cy="820" r="1300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#16233F" /><stop offset="0.55" stopColor="#0A1022" /><stop offset="1" stopColor="#020308" />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1={LAMP.y} x2="0" y2={FLOOR} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE7C2" stopOpacity="0.55" /><stop offset="1" stopColor={AMBER} stopOpacity="0.10" />
        </linearGradient>
        <radialGradient id="pool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={AMBER} stopOpacity="0.5" /><stop offset="1" stopColor={AMBER} stopOpacity="0" /></radialGradient>
        <radialGradient id="vignette" cx="540" cy="900" r="1150" gradientUnits="userSpaceOnUse">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.9" />
        </radialGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8" /></filter>
        <filter id="haze" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70" /></filter>
        <filter id="flare" x="-10%" y="-400%" width="120%" height="900%"><feGaussianBlur stdDeviation="3 1.5" /></filter>
        <filter id="rim" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="16" floodColor={AMBER} floodOpacity="0.55" /></filter>
        {glow('glowW', '#9FD0FF', 14)}{glow('glowB', '#2F7DE1', 18)}{glow('glowA', '#FFB347', 10)}
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" /><feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      <rect width={1080} height={1920} fill="url(#bg)" />
      {/* the part number, huge and faint, like a title card behind the stage */}
      <text x={540} y={980} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={1200} fill="#fff" opacity={0.04}>{part}</text>
      {/* haze */}
      <ellipse cx={540} cy={900} rx={420} ry={520} fill="#2A4A80" opacity={0.35} filter="url(#haze)" />
      <ellipse cx={540} cy={FLOOR} rx={420} ry={90} fill={AMBER} opacity={0.18} filter="url(#haze)" />
      {/* the light: beam, floor pool, dust */}
      <path d={`M${LAMP.x - 34} ${LAMP.y} L${LAMP.x + 34} ${LAMP.y} L${LAMP.x + 380} ${FLOOR} L${LAMP.x - 380} ${FLOOR} Z`} fill="url(#beam)" filter="url(#soft)" />
      <ellipse cx={540} cy={FLOOR + 10} rx={430} ry={70} fill="url(#pool)" />
      {DUST.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.s} fill="#FFF3DD" opacity={d.o} />)}
      {/* the emblem, rim-lit */}
      <g filter="url(#rim)">{p.hero}</g>
      {/* lamp and anamorphic flare */}
      <ellipse cx={LAMP.x} cy={LAMP.y} rx={540} ry={5} fill={ICE} opacity={0.8} filter="url(#flare)" />
      <ellipse cx={LAMP.x} cy={LAMP.y} rx={260} ry={2.5} fill="#fff" opacity={0.9} filter="url(#flare)" />
      <circle cx={LAMP.x} cy={LAMP.y} r={26} fill="#fff" filter="url(#soft)" />

      {/* series line and part chip */}
      <text x={540} y={300} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={BODY} fontWeight={600} fontSize={38} fill="#fff" opacity={0.85}>القوانين الثمانية والأربعون للقوة</text>
      <g transform="translate(540 382)">
        <rect x={-150} y={-34} width={300} height={68} rx={34} fill={C.accent} />
        <text y={4} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={BODY} fontWeight={700} fontSize={36} fill="#fff">{`الجزء ${ORD[part]}`}</text>
      </g>

      {/* the hook */}
      <rect x={0} y={1290} width={1080} height={420} fill="#000" opacity={0.35} filter="url(#haze)" />
      {line(p.title[0], 1380, '#FFFFFF', 'glowW')}
      {line(p.title[1], 1510, ICE, 'glowB')}
      {/* the laws, set like a film credit */}
      <g transform="translate(540 1630)">
        <path d="M-400 0 L-250 0 M250 0 L400 0" stroke={AMBER} strokeWidth={3} opacity={0.8} />
        <text y={4} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={NUM} fontWeight={700} fontSize={52} fill={AMBER} filter="url(#glowA)" opacity={0.6}>{`القوانين من ${p.laws[0]} إلى ${p.laws[1]}`}</text>
        <text y={4} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={NUM} fontWeight={700} fontSize={52} fill={AMBER}>{`القوانين من ${p.laws[0]} إلى ${p.laws[1]}`}</text>
      </g>
      <text x={540} y={1790} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={BODY} fontWeight={500} fontSize={30} fill="#fff" opacity={0.55}>روبرت غرين · للتعلّم والفهم</text>

      {/* vignette and grain over everything */}
      <rect width={1080} height={1920} fill="url(#vignette)" />
      <rect width={1080} height={1920} filter="url(#grain)" opacity={0.13} style={{ mixBlendMode: 'overlay' }} />
    </svg>
  </AbsoluteFill>;
};
