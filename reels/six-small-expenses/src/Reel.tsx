import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { T } from './copy';
import { BODY_FONT, loadFonts, TITLE_FONT } from './fonts';
import { Symbols } from './Symbols';
import { BAND, C, FRAMES, MARGIN } from './theme';

loadFonts();

const ease = Easing.bezier(0.33, 1, 0.68, 1);
// The list: hidden at frame 0, revealed 0.12–0.95 s (opacity up, a light blur cleared), held for reading,
// then eased back toward the opening state in the last 0.33 s so the loop restarts cleanly.
// Title, symbols and handle never move.
const reveal = (f: number) => {
  const inP = interpolate(f, [4, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const outP = interpolate(f, [FRAMES - 10, FRAMES - 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  const o = inP * (1 - outP);
  return { opacity: o, blur: 10 * (1 - o) };
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  const { opacity, blur } = reveal(f);
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <Symbols frame={f} />
      {/* title band */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: BAND.titleTop, height: BAND.titleBottom - BAND.titleTop, background: C.band,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: `0 ${MARGIN.side}px` }}>
        <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 64, lineHeight: 1.3, textAlign: 'center', whiteSpace: 'nowrap' }}>
          <div style={{ color: C.ink }}>{T.title.line1}</div>
          <div style={{ color: C.red }}>{T.title.line2}</div>
        </div>
      </div>
      {/* list band */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: BAND.listTop, height: BAND.listBottom - BAND.listTop, background: C.band }} />
      <div dir="rtl" lang="ar" style={{ position: 'absolute', top: BAND.listTop + 46, right: MARGIN.listRight, left: MARGIN.side,
        opacity, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
        {T.items.map((item) => (
          <div key={item.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 18 }}>
            <div style={{ flex: '0 0 auto', width: 58, height: 58, borderRadius: 29, background: C.ink, color: '#FFFFFF', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 34, marginTop: 6 }}>
              <span style={{ marginTop: -4 }}>{item.n}</span>
            </div>
            <div>
              <div style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 46, lineHeight: 1.22, color: C.ink }}>{item.head}</div>
              <div style={{ fontFamily: BODY_FONT, fontWeight: 500, fontSize: 40, lineHeight: 1.32, color: C.body }}>{item.body}</div>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8 }}>
          <div style={{ width: 84, height: 6, borderRadius: 3, background: C.red, marginBottom: 14 }} />
          <div style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 46, lineHeight: 1.25, color: C.ink, textAlign: 'center' }}>{T.close}</div>
        </div>
      </div>
      {/* handle: small, still, in the quiet black under the list */}
      <div dir="ltr" style={{ position: 'absolute', top: BAND.listBottom + 34, left: 0, right: 0, textAlign: 'center', fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 30, color: C.handle, letterSpacing: 0.5 }}>{T.handle}</div>
    </AbsoluteFill>
  );
};
