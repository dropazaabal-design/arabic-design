import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ChatBubble, MsgBubble, Phone, textW } from './art/world';
import { TITLE_FONT, loadFonts } from './fonts';
import { Boil } from './motion';
import { C } from './theme';

loadFonts();

// Covers drawn from the episode's own opening: the message, «لا أستطيع اليوم» typed and struck out,
// and the «حاضر» that was sent instead, bursting out of the phone. Two words carry the feeling the
// title asks about. No faces, no stock, no book cover image.
export const COVER = {
  ask: 'ممكن تساعدني اليوم؟', contact: 'زميل', typed: ['لا', 'أستطيع', 'اليوم'], yes: 'حاضر',
  line1: 'وافقت…', line2: 'وندمت؟', series: 'فكرة من كتاب',
};

/** Paper grain + soft vignette at any size. */
const Grain: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <svg width={w} height={h} style={{ position: 'absolute', inset: 0 }}>
    <defs>
      <filter id="cgrain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} /><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.28  0 0 0 0 0.25  0 0 0 0.07 0" /></filter>
      <radialGradient id="cvig" cx="50%" cy="50%" r="75%"><stop offset="65%" stopColor="#000" stopOpacity={0} /><stop offset="100%" stopColor="#000" stopOpacity={0.12} /></radialGradient>
    </defs>
    <rect width={w} height={h} filter="url(#cgrain)" />
    <rect width={w} height={h} fill="url(#cvig)" />
  </svg>
);

/** The phone with the reply you wanted struck out, and the big «حاضر» that left it. */
const Moment: React.FC<{ x: number; y: number; s: number; burst: [number, number]; burstSize: number }> = ({ x, y, s, burst, burstSize }) => {
  const fieldW = textW(COVER.typed.join(' '), 38);
  const at = (lx: number, ly: number) => `${x + lx * s} ${y + ly * s}`;
  return (
    <>
      <Phone x={x} y={y} s={s} contact={COVER.contact} words={COVER.typed} shown={3} fieldColor={C.inkSoft} send={1}>
        <ChatBubble y={-200} side="in" text={COVER.ask} />
      </Phone>
      {/* drawn over the phone (the input field sits above the chat layer) */}
      <path d={`M ${at(218, 252)} L ${at(194 - fieldW, 236)}`} stroke={C.red} strokeWidth={10 * s} strokeLinecap="round" />
      <MsgBubble x={burst[0]} y={burst[1]} rot={-5} text={COVER.yes} size={burstSize} fill={C.red} color={C.white} stroke={C.red} tail="out" />
    </>
  );
};

const Pill: React.FC<{ text: string; size: number; style: React.CSSProperties }> = ({ text, size, style }) => (
  <div dir="rtl" lang="ar" style={{ position: 'absolute', fontFamily: TITLE_FONT, fontWeight: 800, fontSize: size, color: C.white, background: C.blue, padding: '0.06em 0.65em 0.16em', borderRadius: 999, ...style }}>{text}</div>
);

const Words: React.FC<{ size1: number; size2: number; style: React.CSSProperties }> = ({ size1, size2, style }) => (
  <div dir="rtl" lang="ar" style={{ position: 'absolute', textAlign: 'center', fontFamily: TITLE_FONT, fontWeight: 900, ...style }}>
    <div style={{ fontSize: size1, lineHeight: 1.15, color: C.ink }}>{COVER.line1}</div>
    <div style={{ fontSize: size2, lineHeight: 1.2, color: C.red }}>{COVER.line2}</div>
  </div>
);

/** YouTube (16:9). Words read first (right, RTL); the bottom-right corner stays clear for YouTube's duration badge. */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ background: C.light }}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <Boil t={0} />
        <filter id="lift" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx={0} dy={10} stdDeviation={9} floodColor="#000" floodOpacity={0.18} /></filter>
      </defs>
      <g filter="url(#boil)"><Moment x={600} y={700} s={1.08} burst={[700, 650]} burstSize={124} /></g>
    </svg>
    <Grain w={1920} h={1080} />
    <Words size1={190} size2={250} style={{ right: 50, top: 170, width: 780 }} />
    <Pill text={COVER.series} size={46} style={{ left: 60, top: 54 }} />
  </AbsoluteFill>
);

/** Reel (9:16). Everything that matters sits inside the central 3:4 (y 240–1680) that the profile grid shows. */
export const CoverTall: React.FC = () => (
  <AbsoluteFill style={{ background: C.light }}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <Boil t={0} />
        <filter id="lift" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx={0} dy={10} stdDeviation={9} floodColor="#000" floodOpacity={0.18} /></filter>
      </defs>
      <g filter="url(#boil)"><Moment x={480} y={1150} s={0.78} burst={[620, 1130]} burstSize={110} /></g>
    </svg>
    <Grain w={1080} h={1920} />
    <Words size1={150} size2={196} style={{ left: 40, right: 40, top: 262 }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1590, display: 'flex', justifyContent: 'center' }}>
      <Pill text={COVER.series} size={44} style={{ position: 'relative' }} />
    </div>
  </AbsoluteFill>
);
