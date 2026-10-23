import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { BODY, clamp01, ease, k } from './kit';
import { B } from './look';
import { Iris } from './inserts';
import { IRIS_OUT, SHOTS, T, shotAt } from './shots';
import { LINE_LIST, FPS, L1, TOTAL } from './timing';

// The episode: shots by frame, the two wipes through his head, burned-in captions in the 4:5 band, the credit.

/** Captions sit at the bottom of the 4:5 band (y 1470–1630), never over a face, a hand or the card with the joke. */
export const CAPTION = { top: 1470, bottom: 1630, x0: 60, x1: 1020 };
export const captionAt = (f: number) => LINE_LIST.find((l) => f >= Math.round(l.start * FPS) - 3 && f <= Math.round(l.end * FPS) + 10);
export const CREDIT_FROM = L1(19) + 12;

const Caption: React.FC<{ text: string; o: number }> = ({ text, o }) => (
  <div style={{ position: 'absolute', left: CAPTION.x0, width: CAPTION.x1 - CAPTION.x0, top: CAPTION.top, height: CAPTION.bottom - CAPTION.top, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: o }}>
    <div dir="rtl" lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: 44, lineHeight: 1.38, color: B.navy, background: 'rgba(255,255,255,0.94)', border: `3px solid ${B.navy}`, borderRadius: 26, padding: '6px 28px 12px', textAlign: 'center', maxWidth: 940 }}>{text}</div>
  </div>
);
const Credit: React.FC<{ o: number }> = ({ o }) => (
  <div style={{ position: 'absolute', left: CAPTION.x0, width: CAPTION.x1 - CAPTION.x0, top: CAPTION.top, height: CAPTION.bottom - CAPTION.top, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: o }}>
    <div dir="rtl" lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: 36, color: B.white, background: B.navy, borderRadius: 22, padding: '6px 26px 10px' }}>مستوحى من كتاب فن اللامبالاة — مارك مانسون</div>
    <div dir="ltr" style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: B.navy, background: 'rgba(255,255,255,0.94)', border: `3px solid ${B.navy}`, borderRadius: 22, padding: '2px 22px 6px' }}>@kitabwbs</div>
  </div>
);

export const Episode: React.FC<{ audio?: boolean; captions?: boolean }> = ({ audio = true, captions = true }) => {
  const f = useCurrentFrame();
  const i = shotAt(f);
  const shot = SHOTS[i];
  let picture: React.ReactNode = shot.render(f).node;

  // into his head: the office opens out of his head (iris centred where the head is on screen)
  const inA = T.into - 14, inB = T.into + 18;
  if (f >= inA && f < inB) {
    // the hook's camera ends centred on his head, so the iris opens from the frame's centre
    const hook = SHOTS[0].render(f);
    const r = k(f, [[inA, 40], [inB, 1500]], ease.in);
    picture = <>{hook.node}<Iris id="iris-in" cx={540} cy={960} r={r}>{SHOTS[1].render(Math.max(f, T.into)).node}</Iris></>;
  }
  // out of his head: the buried office closes into the real Naif's head
  const outA = T.out, outB = T.out + 24;
  if (f >= outA && f < outB) {
    const office = SHOTS[shotAt(T.out - 1)].render(T.out - 1 + Math.min(20, f - outA));
    const r = k(f, [[outA, 1500], [outB, 60]], ease.in);
    picture = <>{shot.render(f).node}<Iris id="iris-out" cx={IRIS_OUT[0]} cy={IRIS_OUT[1]} r={r}>{office.node}</Iris></>;
  }
  const cap = captionAt(f);
  const credit = clamp01((f - CREDIT_FROM) / 10);
  return (
    <AbsoluteFill style={{ background: B.navy, overflow: 'hidden' }}>
      {picture}
      {captions && cap && f < CREDIT_FROM && <Caption text={cap.text} o={1} />}
      {credit > 0 && <Credit o={credit} />}
      {audio && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
};
export { TOTAL };
