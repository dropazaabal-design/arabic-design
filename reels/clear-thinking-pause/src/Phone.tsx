import React from 'react';
import { BookmarkIcon, CheckIcon, FolderIcon, PauseIcon, SendIcon, SparkIcon, TargetIcon, tornPolygon } from './art';
import { COPY } from './copy';
import { measure, Pill, BODY_FONT, TITLE_FONT } from './text';
import { C, PHONE, SCREEN } from './theme';
import { at, atEnd, ease, life, mix, mixColor, prog, sceneStart, sec } from './time';

// The one phone the whole reel is built around. Everything here is a function of the frame and of
// spoken-word times (`at`), so every change lands on the word that names it.

type Lines = string[][];
const DRAFT: Lines = [COPY.draft.slice(0, 3), COPY.draft.slice(3)];
const CALM: Lines = [COPY.calm.slice(0, 3), COPY.calm.slice(3)];
const GRAY = '#A3A8B0';
// the harsh draft is erased one whole word every 2 frames, each fading over 5
const ERASE_STEP = 2, ERASE_FADE = 5, ERASE_DONE = 5 * ERASE_STEP + ERASE_FADE;

/** Words of a message in fixed, balanced lines; each word fades as a whole. A line shows once one of its words does. */
const Words: React.FC<{ lines: Lines; o: (k: number) => number; size: number; color?: string; strike?: (k: number) => number }> = ({ lines, o, size, color = C.ink, strike }) => {
  let k = -1;
  return (
    <div dir="rtl" lang="ar" style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: size, lineHeight: 1.36, color, textAlign: 'right' }}>
      {lines.map((line, li) => {
        const ks = line.map(() => ++k);
        if (ks.every((x) => o(x) <= 0.001)) return null;
        return (
          <div key={li}>
            {line.map((w, wi) => (
              <React.Fragment key={wi}>
                {wi > 0 && ' '}
                <span style={{ opacity: o(ks[wi]), textDecoration: strike && strike(ks[wi]) > 0.5 ? `line-through ${C.red} 3px` : undefined }}>{w}</span>
              </React.Fragment>
            ))}
          </div>
        );
      })}
    </div>
  );
};

/** Times of the phone's story, all from the measured words. */
const beats = () => {
  const typeFrom = at('s02', 5, 'وكتبت'), typeTo = atEnd('s02', 7) - 6;
  const erase = at('s06', 7, 'قول');
  const calmFrom = erase + ERASE_DONE, calmTo = at('s06', 11, 'إهانة');
  return {
    open: sec(2.15),
    incoming: at('s02', 1, 'رسالة'),
    upset: at('s02', 2, 'ضايقتك'),
    focus: at('s02', 3, 'فتحت'),
    typed: (k: number) => typeFrom + (k * (typeTo - typeFrom)) / 5,
    oneLeft: at('s02', 8, 'وبقيت'),
    press: at('s02', 9, 'ضغطة'),
    lift: at('s03', 1, 'اسأل'),
    serves: at('s03', 5, 'يخدمك'),
    or: at('s03', 6, 'أم'),
    vents: at('s03', 7, 'يفرّغ'),
    morph: sceneStart('sc4') - 2,
    title: at('s04', 1, 'كتاب'),
    author: at('s04', 5, 'شين'),
    back: sceneStart('sc5'),
    pause: at('s05', 2, 'وقفة'),
    note: at('s05', 3, 'اترك'),
    toNote: at('s05', 4, 'الردّ'),
    noteLabel: at('s05', 6, 'المسودات'),
    fromNote: at('s06', 3, 'تريد'),
    noteGone: atEnd('s06', 4) + 4,
    erase,
    calm: (k: number) => calmFrom + (k * (calmTo - calmFrom)) / 5,
    calmDone: calmTo,
    sayIt: at('s06', 10, 'دون'),
    right: at('s07', 3, 'حقك'),
    choose: at('s07', 8, 'تختار'),
    send: at('s07', 9, 'كيف'),
    sent: at('s07', 10, 'تردّ'),
    labelOut: at('s07', 6, 'تعطيك'),
  };
};

/** Morph amount: 0 = phone screen, 1 = book scrap (scene 4), and back. */
export const morphAt = (f: number) => {
  const b = beats();
  return prog(f, b.morph, sec(0.75), ease.inOut) * (1 - prog(f, b.back, sec(0.75), ease.inOut));
};

export const Phone: React.FC<{ f: number }> = ({ f }) => {
  const b = beats();
  const M = morphAt(f);
  const chatO = 1 - Math.min(1, M / 0.35);
  const scrapO = Math.max(0, (M - 0.65) / 0.35);

  // scene 1: dark scrim over the chat, abstract draft bars, red ring that stops short
  const scrim = 1 - prog(f, b.open + sec(0.55), sec(0.4), ease.inOut);
  const ring1 = prog(f, sec(0.25), sec(1.25), ease.out) * 0.86 * (1 - prog(f, b.open, sec(0.5)));
  const ring2 = prog(f, b.oneLeft, sec(0.8), ease.out) * 0.86 * (1 - prog(f, b.lift - sec(0.3), sec(0.4)));
  const ring = Math.max(ring1, ring2);

  // the draft: typed (sc2), carried to the note and back (sc5–6), erased and replaced (sc6), sent (sc7)
  const toNote = prog(f, b.toNote, sec(0.7), ease.inOut);
  const fromNote = prog(f, b.fromNote, sec(0.6), ease.inOut);
  const inField = f < b.toNote ? 1 : 1 - toNote + fromNote;
  const eraseO = (k: number) => 1 - prog(f, b.erase + k * ERASE_STEP, ERASE_FADE);
  const draftO = (k: number) => (f < b.open ? 0 : prog(f, b.typed(k), 4)) * inField * (f >= b.erase ? eraseO(k) : 1);
  const calmO = (k: number) => prog(f, b.calm(k), 5);
  const sendP = prog(f, b.send, sec(0.6), ease.inOut);
  const calmInField = f < b.send ? 1 : 1 - sendP;
  const hasDraft = f >= b.typed(0) && (f < b.toNote || f >= b.fromNote);

  // the send button: red when a harsh draft waits, grey during the pause, blue for the calm reply
  const paused = f >= b.pause && f < b.calmDone;
  const isCalm = f >= b.calmDone;
  const sendColor = f < b.open ? C.red
    : isCalm ? (f < b.sent + sec(0.4) ? mixColor(GRAY, C.blue, prog(f, b.calmDone, 8)) : mixColor(C.blue, GRAY, prog(f, b.sent + sec(0.4), 10)))
    : paused ? mixColor(C.red, GRAY, prog(f, b.pause, 8))
    : hasDraft ? mixColor(GRAY, C.red, prog(f, b.typed(0), 6)) : GRAY;
  const sendScale = 1 + 0.12 * Math.sin(Math.PI * prog(f, b.right, sec(0.5), ease.inOut)) - 0.1 * Math.sin(Math.PI * prog(f, b.choose, sec(0.3), ease.inOut));
  const pauseGlyph = prog(f, b.pause, sec(0.35), ease.back) * (1 - prog(f, b.fromNote, sec(0.4)));
  const fieldBorder = f < b.open ? C.red : isCalm ? mixColor(GRAY, C.blue, prog(f, b.calmDone, 8)) : f >= b.focus && hasDraft && !paused ? C.red : f >= b.focus && f < b.typed(0) ? GRAY : '#D5D8DC';

  // scene 3: the field lifts, a calm gap opens above the send button
  const lift = prog(f, b.lift, sec(0.8), ease.inOut) * (f < b.morph + sec(0.4) ? 1 : 0);
  const fieldBottom = 24 + 360 * lift;
  const dimChat = 1 - 0.65 * lift;

  // scenes 5–6: the drafts note
  const noteIn = prog(f, b.note, sec(0.45), ease.back) * (1 - prog(f, b.noteGone, sec(0.35)));
  const outgoing = prog(f, b.send + sec(0.25), sec(0.45), ease.out);
  const exampleTag = prog(f, b.calmDone + 6, sec(0.3), ease.back);

  const W2 = SCREEN.w;
  const rect = { x: mix(PHONE.inset, -60, M), y: mix(PHONE.inset, 90, M), w: mix(SCREEN.w, 700, M), h: mix(SCREEN.h, 460, M) };

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: PHONE.w, height: PHONE.h }}>
      {/* body */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 78, background: C.phone, border: `3px solid ${C.bezel}`, opacity: 1 - Math.min(1, M / 0.3), boxShadow: '0 40px 80px rgba(0,0,0,0.55)' }} />
      {/* screen ↔ book scrap */}
      <div style={{
        position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, transform: `rotate(${mix(0, -2.2, M)}deg)`,
        clipPath: tornPolygon(rect.w, rect.h, mix(60, 6, M), mix(0, 11, M), 29, 24), background: mixColor('#E8E9E5', '#E2E3DE', M),
        boxShadow: M > 0.5 ? '0 30px 60px rgba(0,0,0,0.5)' : undefined, overflow: 'hidden',
      }}>
        {chatO > 0.001 ? (
          <div style={{ position: 'absolute', left: 0, top: 0, width: W2, height: SCREEN.h, opacity: chatO }}>
            {/* island and header (an abstract contact: no name, no face) */}
            <div style={{ position: 'absolute', left: W2 / 2 - 68, top: 14, width: 136, height: 34, borderRadius: 17, background: '#0B0C0F' }} />
            <div style={{ position: 'absolute', inset: 0, opacity: dimChat }}>
              <div style={{ position: 'absolute', right: 24, top: 74, width: 66, height: 66, borderRadius: 33, background: '#B6BAC1' }} />
              <div style={{ position: 'absolute', right: 108, top: 88, width: 150, height: 16, borderRadius: 8, background: '#C6C9CE' }} />
              <div style={{ position: 'absolute', right: 108, top: 116, width: 94, height: 12, borderRadius: 6, background: '#D2D5D9' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: 164, height: 2, background: '#D3D5D1' }} />
              {/* incoming message, right side (right-to-left interface) */}
              <div style={{ position: 'absolute', right: 24, top: 196, opacity: prog(f, b.incoming, 6), transform: `translateY(${mix(14, 0, prog(f, b.incoming, 8))}px)` }}>
                <div dir="rtl" lang="ar" style={{
                  fontFamily: BODY_FONT, fontWeight: 700, fontSize: 38, lineHeight: 1.3, color: C.ink, background: '#FFFFFF', padding: '14px 26px 18px',
                  borderRadius: '30px 8px 30px 30px', whiteSpace: 'nowrap',
                  boxShadow: `0 0 0 ${3 * prog(f, b.upset, 8)}px ${C.red}, 0 6px 16px rgba(0,0,0,0.08)`,
                }}>{COPY.incoming}</div>
              </div>
              {/* the calm reply, sent: outgoing, left side */}
              {outgoing > 0 && (
                <div style={{ position: 'absolute', left: 24, top: 318, opacity: outgoing, transform: `translateY(${mix(150, 0, outgoing)}px)` }}>
                  <div style={{ background: C.blueTint, borderRadius: '8px 30px 30px 30px', padding: '14px 24px 16px', boxShadow: `inset 0 0 0 2px ${C.blue}` }}>
                    <Words lines={CALM} o={() => 1} size={34} />
                  </div>
                  <CheckIcon size={44} p={prog(f, b.sent, sec(0.45))} style={{ position: 'absolute', left: -4, bottom: -46 }} />
                </div>
              )}
            </div>

            {/* scene 3: the gap between the draft and the send button */}
            {lift > 0 && (
              <>
                <div style={{ position: 'absolute', left: 14, right: 14, top: SCREEN.h - fieldBottom + 10, bottom: 24 + 88 + 8, borderRadius: 30, background: `rgba(46,123,197,${0.13 * lift})`, boxShadow: `inset 0 0 0 2px rgba(46,123,197,${0.45 * lift})` }} />
                <svg width={W2} height={SCREEN.h} style={{ position: 'absolute', left: 0, top: 0 }}>
                  <line x1={64} x2={64} y1={SCREEN.h - fieldBottom + 6} y2={SCREEN.h - 24 - 88 - 6} stroke={C.blue} strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round" opacity={lift} />
                </svg>
                <div dir="rtl" lang="ar" style={{ position: 'absolute', left: 100, right: 16, top: SCREEN.h - 24 - 360 + 34, height: 210, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.28em', fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 35, lineHeight: 1.2 }}>
                  <Col o={prog(f, b.serves, 6)} icon={<TargetIcon size={62} p={prog(f, b.serves, sec(0.5))} />} text={COPY.sc3[0]} color={C.blue} />
                  <Col o={prog(f, b.or, 6)} text={COPY.sc3[1]} color={C.inkSoft} />
                  <Col o={prog(f, b.vents, 6)} icon={<SparkIcon size={62} p={prog(f, b.vents, sec(0.4), ease.back)} />} text={COPY.sc3[2]} color={C.red} />
                </div>
              </>
            )}

            {/* the field (right) and the send button (left) */}
            <div style={{
              position: 'absolute', right: 20, bottom: fieldBottom, width: 408, minHeight: 88, boxSizing: 'border-box', borderRadius: 44, background: '#FFFFFF',
              border: `3px solid ${fieldBorder}`, padding: '18px 26px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              {f < b.open + sec(0.3) ? (
                <div style={{ opacity: scrim, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
                  <div style={{ width: 300, height: 13, borderRadius: 7, background: '#C3C7CD' }} />
                  <div style={{ width: 210, height: 13, borderRadius: 7, background: '#C3C7CD' }} />
                </div>
              ) : f < b.erase + ERASE_DONE ? (
                <Words lines={DRAFT} o={draftO} size={36} color={paused && f < b.erase ? C.inkSoft : C.ink} strike={(k) => (f >= b.erase ? prog(f, b.erase + k * ERASE_STEP, 2) : 0)} />
              ) : (
                <div style={{ opacity: calmInField, transform: `translateY(${-120 * sendP}px)` }}><Words lines={CALM} o={calmO} size={36} /></div>
              )}
              {exampleTag > 0 && f < b.send && (
                <div style={{ position: 'absolute', left: 18, top: -30 }}><Pill text={COPY.example} o={exampleTag} color={C.inkSoft} size={26} solid={false} /></div>
              )}
            </div>
            <svg width={W2} height={SCREEN.h} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
              {ring > 0.001 && (
                <circle cx={64} cy={SCREEN.h - 24 - 44} r={56} fill="none" stroke={C.red} strokeWidth={7} strokeLinecap="round"
                  pathLength={1} strokeDasharray={`${ring} 1`} transform={`rotate(-90 64 ${SCREEN.h - 68})`} opacity={0.95} />
              )}
            </svg>
            <div style={{ position: 'absolute', left: 20, bottom: 24, width: 88, height: 88, borderRadius: 44, background: sendColor, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${sendScale})`, boxShadow: '0 8px 18px rgba(0,0,0,0.18)' }}>
              <SendIcon size={46} style={{ opacity: 1 - pauseGlyph }} />
              {pauseGlyph > 0 && <div style={{ position: 'absolute', inset: 0, borderRadius: 44, background: C.blue, opacity: pauseGlyph, transform: `scale(${mix(0.6, 1, pauseGlyph)})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PauseIcon size={46} /></div>}
            </div>
            {/* scene 1 scrim: only the input row is lit */}
            {scrim > 0 && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: SCREEN.h - 150, background: `linear-gradient(to bottom, rgba(13,14,17,${0.92 * scrim}) 82%, rgba(13,14,17,0))` }} />}
          </div>
        ) : null}

        {/* scene 4: the book scrap (our own card, not the cover) */}
        {scrapO > 0 && (
          <div style={{ position: 'absolute', inset: 0, opacity: scrapO }}>
            <div style={{ position: 'absolute', right: 30, top: 26, bottom: 26, width: 3, background: C.ink, opacity: 0.22 }} />
            <div style={{ position: 'absolute', right: 40, top: 26, bottom: 26, width: 1.5, background: C.ink, opacity: 0.14 }} />
            <div dir="rtl" lang="ar" style={{ position: 'absolute', inset: '0 70px 0 50px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 36, color: C.inkSoft, opacity: prog(f, b.title, 8) }}>{COPY.sc4.label}</div>
              <div style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: Math.min(84, (540 / measure(COPY.sc4.title, '900 100px Cairo')) * 100), lineHeight: 1.3, whiteSpace: 'nowrap', color: C.ink, opacity: prog(f, b.title, 8), transform: `translateY(${mix(16, 0, prog(f, b.title, 10))}px)` }}>{COPY.sc4.title}</div>
              <div style={{ width: 120 * prog(f, b.author, 8), height: 4, borderRadius: 2, background: C.ink, opacity: 0.3, margin: '14px 0 16px' }} />
              <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 40, color: C.inkSoft, opacity: prog(f, b.author, 8) }}>{COPY.sc4.author}</div>
            </div>
          </div>
        )}
      </div>

      {/* scene 2 label: one press left */}
      <Callout o={life(f, b.oneLeft, sceneStart('sc3') + 4, 6, 6)} x={PHONE.inset + SCREEN.w / 2} y={PHONE.inset + 540}
        text={COPY.sc2} color={C.red} arrowTo={[PHONE.inset + 64, PHONE.inset + SCREEN.h - 24 - 88 - 18]} />
      {/* scene 6 label: say it without insult */}
      <Callout o={life(f, b.sayIt, b.labelOut, 6, 8)} x={PHONE.inset + SCREEN.w / 2} y={PHONE.inset + 470}
        text={COPY.sc6} color={C.blue} />

      {/* scenes 5–6: the drafts note */}
      {noteIn > 0 && (
        <div style={{ position: 'absolute', left: PHONE.inset + 34, top: PHONE.inset + 300, width: SCREEN.w - 68, transform: `rotate(-2deg) scale(${mix(0.85, 1, noteIn)})`, opacity: Math.min(1, noteIn * 1.4) }}>
          <div style={{ background: C.paperDark, clipPath: tornPolygon(SCREEN.w - 68, 270, 6, 6, 41, 22), height: 270, padding: '28px 32px', boxSizing: 'border-box' }}>
            <div dir="rtl" lang="ar" style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 33, color: C.blue, whiteSpace: 'nowrap' }}>
              <FolderIcon size={40} />
              <span style={{ opacity: prog(f, b.noteLabel, 6) }}>{COPY.sc5}</span>
            </div>
            <div style={{ marginTop: 20, opacity: toNote * (1 - fromNote), transform: `translateY(${mix(40, 0, toNote)}px)` }}>
              <Words lines={DRAFT} o={() => 1} size={31} color={C.inkSoft} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/** One column of the scene-3 line: optional icon above a whole phrase. */
const Col: React.FC<{ o: number; icon?: React.ReactNode; text: string; color: string }> = ({ o, icon, text, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: o, transform: `translateY(${mix(10, 0, o)}px)` }}>
    <div style={{ height: 62, display: 'flex', alignItems: 'center' }}>{icon}</div>
    <span style={{ color, whiteSpace: 'nowrap' }}>{text}</span>
  </div>
);

/** A label pill centred at (x, y) in phone pixels, with an optional dashed pointer. */
const Callout: React.FC<{ o: number; x: number; y: number; text: string; color: string; arrowTo?: [number, number] }> = ({ o, x, y, text, color, arrowTo }) => {
  if (o <= 0) return null;
  return (
    <>
      {arrowTo && (
        <svg width={PHONE.w} height={PHONE.h} style={{ position: 'absolute', left: 0, top: 0, opacity: o }}>
          <path d={`M${x - 60} ${y + 34} Q ${arrowTo[0] + 10} ${y + 60} ${arrowTo[0]} ${arrowTo[1]}`} fill="none" stroke={color} strokeWidth={5} strokeDasharray="3 12" strokeLinecap="round" />
          <circle cx={arrowTo[0]} cy={arrowTo[1]} r={7} fill={color} />
        </svg>
      )}
      <div style={{ position: 'absolute', left: x - 300, width: 600, top: y - 32, display: 'flex', justifyContent: 'center' }}>
        <Pill text={text} o={o} color={color} size={42} />
      </div>
    </>
  );
};

export { BookmarkIcon };
