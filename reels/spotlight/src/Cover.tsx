import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { BODY_FONT, TITLE_FONT, loadFonts } from './fonts';
import { Cam, CamOverride, Grain, World, bubbleA, toScreen } from './Reel';
import { Rich, Words } from './text';
import { C } from './theme';
import { sec } from './time';

loadFonts();

// The cover is the video's own opening moment: the slip in the spotlight, its shadow
// grown on the wall, the imagined others in dashed lines. Render it at COVER_FRAME
// (8.2 s); the covers sit on the video's timeline so the stage is exactly that frame.
// Only approved on-screen copy is used.
export const COVER_FRAME = sec(8.2);

/** The stage as a 1920×1080 picture, framed by `cam`, with the bubble's words on it. */
const Stage: React.FC<{ cam: Cam }> = ({ cam }) => {
  const a = bubbleA(useCurrentFrame());
  const [x, y] = toScreen(cam, a.x, a.y - 6);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'hidden', background: C.navy }}>
      <CamOverride.Provider value={cam}>
        <World />
      </CamOverride.Provider>
      <Grain />
      <Words text="صباح الخير" x={x} y={y} w={400 * a.s * cam.z} size={62 * a.s * cam.z} o={a.o} color={C.ink} />
    </div>
  );
};

const Plate: React.FC<{ text: string; size: number; style?: React.CSSProperties }> = ({ text, size, style }) => (
  <div dir="rtl" lang="ar" style={{ position: 'absolute', left: 0, right: 0, display: 'flex', justifyContent: 'center', ...style }}>
    <div style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: size, lineHeight: 1.16, color: C.ivory, textAlign: 'center', whiteSpace: 'pre-line', background: 'rgba(10,14,34,0.88)', padding: '0.04em 0.5em 0.16em', borderRadius: 36, border: '5px solid rgba(246,235,217,0.2)', boxShadow: '0 12px 0 rgba(0,0,0,0.3)' }}>
      <Rich text={text} />
    </div>
  </div>
);

const Tag: React.FC<{ text: string; size: number; bg: string; color: string; style?: React.CSSProperties }> = ({ text, size, bg, color, style }) => (
  <div dir="rtl" lang="ar" style={{ position: 'absolute', left: 0, right: 0, display: 'flex', justifyContent: 'center', ...style }}>
    <div style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: size, color, background: bg, padding: '0.06em 0.6em 0.2em', borderRadius: 999, border: `5px solid ${C.ink}`, boxShadow: '0 8px 0 rgba(0,0,0,0.35)', whiteSpace: 'nowrap' }}>{text}</div>
  </div>
);

const Brand: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div dir="rtl" lang="ar" style={{ position: 'absolute', fontFamily: BODY_FONT, fontWeight: 700, fontSize: 40, color: C.ivory, background: 'rgba(27,31,51,0.85)', padding: '4px 26px 10px', borderRadius: 999, border: '3px solid rgba(246,235,217,0.35)', ...style }}>كتاب وبس</div>
);

/** 16:9 — Facebook, X, and the landscape post itself. */
export const Cover: React.FC = () => (
  <AbsoluteFill style={{ background: C.navy }}>
    <Stage cam={{ cx: 960, cy: 525, z: 1.42 }} />
    <Plate text={`تحس إن الكل {${C.warm}|يراقبك؟}`} size={150} style={{ top: 22 }} />
    <Tag text="تأثير بقعة الضوء" size={64} bg={C.warm} color={C.ink} style={{ top: 912 }} />
    <Brand style={{ left: 40, bottom: 34 }} />
  </AbsoluteFill>
);

/** 9:16 — Instagram; everything that matters sits inside the central 3:4 (y 240–1680) the profile grid shows. */
const BAND = '#070B1C';
export const CoverTall: React.FC = () => (
  <AbsoluteFill style={{ background: BAND }}>
    <div style={{ position: 'absolute', left: -247, top: 585, width: 1920, height: 1080, transform: 'scale(0.82)', transformOrigin: '0 0' }}>
      <Stage cam={{ cx: 960, cy: 600, z: 1.3 }} />
    </div>
    {/* soft edges where the stage window meets the plain bands */}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 585, height: 90, background: `linear-gradient(180deg, ${BAND} 0%, rgba(7,11,28,0) 100%)` }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1381, height: 91, background: `linear-gradient(180deg, rgba(7,11,28,0) 0%, ${BAND} 100%)` }} />
    <Plate text={`تحس إن الكل\n{${C.warm}|يراقبك؟}`} size={124} style={{ top: 250 }} />
    <Tag text="تأثير بقعة الضوء" size={64} bg={C.warm} color={C.ink} style={{ top: 1400 }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1585, display: 'flex', justifyContent: 'center' }}><Brand style={{ position: 'relative' }} /></div>
  </AbsoluteFill>
);
