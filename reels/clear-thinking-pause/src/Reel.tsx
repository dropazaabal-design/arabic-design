import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { BookmarkIcon, Ground, WindowShot } from './art';
import { COPY } from './copy';
import { loadFonts } from './fonts';
import { Phone } from './Phone';
import { BODY_FONT, Captions, measure, TITLE_FONT } from './text';
import { C, HANDLE, HOOK, PHONE, SAFE, W, H } from './theme';
import { at, ease, FPS, life, mix, prog, sceneStart, sec, TL } from './time';

loadFonts();

/** The whole reel: one phone, one continuous camera; scenes are states of the same objects. */
export const Reel: React.FC<{ guides?: boolean }> = ({ guides = false }) => {
  const f = useCurrentFrame();
  const t = f / FPS;

  // camera on the phone group: close and low in scene 1, at rest after, carried aside for the pause shot
  const open = prog(f, sec(2.15), sec(0.7), ease.inOut);
  const away = prog(f, at('s05', 7, 'وابتعد'), sec(0.85), ease.inOut) - prog(f, at('s05', 12, 'تهدأ'), sec(0.85), ease.inOut);
  const rule = prog(f, at('s08', 0, 'اكتب'), sec(0.7), ease.inOut);
  const shakeT = f - at('s02', 9, 'ضغطة');
  const shake = shakeT >= 0 && shakeT < 10 ? 9 * Math.sin(shakeT * 2.2) * (1 - shakeT / 10) : 0;
  const cam = { s: mix(1.18, 1.06, open) * mix(1, 0.94, rule), x: -860 * away + shake, y: mix(56, 16, open) + 40 * rule };

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <Ground drift={-160 * away} />

      {/* the pause space comes in from the left edge's opposite side as the phone is carried away */}
      {away > 0.001 && (
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${860 * (1 - away)}px)` }}>
          <WindowShot t={t} calm={prog(f, at('s05', 9, 'ارجع'), sec(1.2), ease.inOut)} />
        </div>
      )}

      {/* the phone */}
      <div style={{
        position: 'absolute', left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h,
        transformOrigin: `${W / 2 - PHONE.x}px ${H / 2 - PHONE.y}px`, transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`,
        opacity: mix(1, 0.2, rule),
      }}>
        <Phone f={f} />
      </div>

      <Diagram f={f} />
      <RuleCard f={f} />
      <Hook f={f} />
      <div dir="ltr" style={{ position: 'absolute', left: 0, width: W, top: HANDLE.y, textAlign: 'center', fontFamily: BODY_FONT, fontWeight: 500, fontSize: 28, letterSpacing: 0.5, color: C.mute }}>{COPY.handle}</div>
      <Captions f={f} />

      <Audio src={staticFile(TL.voice)} />
      <Sfx />
      {guides && <Guides />}
    </AbsoluteFill>
  );
};

/** The hook: big on two lines from frame 0, then the same words fly into one moderate line above the content. */
const Hook: React.FC<{ f: number }> = ({ f }) => {
  // the halves shrink and part sideways first, then rise onto one line, so they never cross
  const p = prog(f, sec(2.15), sec(0.4), ease.inOut);
  const py = prog(f, sec(2.5), sec(0.4), ease.inOut);
  const out = prog(f, sceneStart('sc7'), sec(0.45), ease.inOut);
  if (out >= 1) return null;
  const small = `900 ${HOOK.small}px Cairo`;
  const [l1, l2] = COPY.hook;
  const wFull = measure(`${l1} ${l2}`, small), w1 = measure(l1, small), w2 = measure(l2, small);
  const k = mix(1, HOOK.small / HOOK.big, p);
  // right-to-left: the first half of the sentence sits on the right of the one-line hook
  const parts = [
    { text: l1, x: mix(W / 2, W / 2 + wFull / 2 - w1 / 2, p), y: mix(HOOK.bigY[0], HOOK.y, py) },
    { text: l2, x: mix(W / 2, W / 2 - wFull / 2 + w2 / 2, p), y: mix(HOOK.bigY[1], HOOK.y, py) },
  ];
  return (
    <>
      {parts.map((q, i) => (
        <div key={i} dir="rtl" lang="ar" style={{
          position: 'absolute', left: 0, width: W, top: q.y - HOOK.big * 0.68, textAlign: 'center', whiteSpace: 'nowrap',
          fontFamily: TITLE_FONT, fontWeight: 900, fontSize: HOOK.big, lineHeight: 1.36, color: C.white, opacity: 1 - out,
          transform: `translateX(${q.x - W / 2}px) scale(${k})`, transformOrigin: '50% 50%', textShadow: '0 6px 30px rgba(0,0,0,0.45)',
        }}>
          {i === 0 ? q.text : <>{q.text.split(' ')[0]} <span style={{ color: C.red }}>{q.text.split(' ')[1]}</span></>}
        </div>
      ))}
    </>
  );
};

/** Scene 4 diagram: an impulsive red line rushes from the event and stops at a blue gap; past it, a decision. */
const Diagram: React.FC<{ f: number }> = ({ f }) => {
  const o = life(f, at('s04', 9, 'نقع'), sceneStart('sc5') + 6, 8, 10);
  if (o <= 0) return null;
  const y = 1150, xEvent = 830, xGap = 560, gapW = 64, xDecision = 290;
  const launch = at('s04', 11, 'ردود'), gapIn = at('s04', 13, 'تلقائية');
  const run = prog(f, launch, gapIn + 5 - launch, ease.in);
  const head = mix(xEvent, xGap + gapW / 2 + 6, run);
  const hit = prog(f, gapIn + 5, 8, ease.out);
  const gap = prog(f, gapIn - 3, 7, ease.out);
  const glow = 1 + 0.25 * Math.sin(Math.PI * prog(f, at('s04', 14, 'قبل'), sec(0.9), ease.inOut));
  const calmLine = prog(f, at('s04', 18, 'أمامنا'), sec(0.7), ease.inOut);
  const decision = prog(f, at('s04', 19, 'قرار'), sec(0.4), ease.back);
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: o }}>
      <line x1={xDecision} x2={xEvent} y1={y} y2={y} stroke="#3A3E46" strokeWidth={4} strokeDasharray="2 14" strokeLinecap="round" />
      <rect x={xGap - (gapW * glow) / 2} y={y - 90} width={gapW * glow} height={180} rx={32} fill={C.blue} opacity={0.28 * gap} />
      <rect x={xGap - (gapW * glow) / 2} y={y - 90} width={gapW * glow} height={180} rx={32} fill="none" stroke={C.blue} strokeWidth={4} opacity={gap} />
      {run > 0 && <line x1={xEvent} x2={head} y1={y} y2={y} stroke={C.red} strokeWidth={12} strokeLinecap="round" />}
      {run > 0 && <circle cx={head} cy={y} r={10 + 8 * Math.sin(Math.PI * hit)} fill={C.red} />}
      <circle cx={xEvent} cy={y} r={18} fill={C.red} />
      <line x1={xGap - gapW / 2 - 8} x2={mix(xGap - gapW / 2 - 8, xDecision + 34, calmLine)} y1={y} y2={y} stroke={C.blue} strokeWidth={6} strokeDasharray="4 14" strokeLinecap="round" opacity={calmLine > 0 ? 1 : 0} />
      <circle cx={xDecision} cy={y} r={28 * decision} fill="none" stroke={C.white} strokeWidth={7} />
    </svg>
  );
};

/** Scene 7: the rule, on a large note in the same space, with a green frame and a save mark. */
const RuleCard: React.FC<{ f: number }> = ({ f }) => {
  const inP = prog(f, at('s08', 0, 'اكتب'), sec(0.7), ease.out);
  if (inP <= 0) return null;
  const words = COPY.sc7;
  const times = [at('s08', 3, 'سأرد'), at('s08', 4, 'عندما'), at('s08', 5, 'أهدأ')];
  const save = prog(f, at('s09', 0, 'احفظها'), sec(0.5), ease.out);
  const size = Math.min(104, (640 / measure(words.join(' '), '900 100px Cairo')) * 100);
  return (
    <div style={{ position: 'absolute', left: 150, width: 780, top: 640, height: 480, opacity: inP, transform: `translateY(${mix(220, 0, inP)}px) rotate(${mix(3, -1, inP)}deg)` }}>
      <div style={{ position: 'absolute', inset: 0, background: C.paper, clipPath: 'polygon(0 2%, 4% 0, 30% 1.5%, 55% 0, 80% 1.8%, 100% 0.5%, 99.5% 100%, 70% 98.5%, 40% 100%, 12% 98.8%, 0.5% 100%)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'absolute', inset: 26, borderRadius: 26, border: `4px solid ${C.green}` }} />
      <BookmarkIcon size={54} fill={save} style={{ position: 'absolute', left: 58, top: 44, transform: `scale(${1 + 0.18 * Math.sin(Math.PI * save)})` }} />
      <div dir="rtl" lang="ar" style={{ position: 'absolute', left: 60, right: 60, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TITLE_FONT, fontWeight: 900, fontSize: size, lineHeight: 1.3, color: C.ink, whiteSpace: 'nowrap' }}>
        {words.map((w, i) => {
          const p = prog(f, times[i], 7, ease.out);
          return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${mix(22, 0, p)}px)`, marginInlineStart: i ? '0.26em' : 0 }}>{w}</span>;
        })}
      </div>
      <div style={{ position: 'absolute', left: '50%', bottom: 96, width: 260 * save, height: 6, borderRadius: 3, background: C.green, transform: 'translateX(-50%)' }} />
    </div>
  );
};

// Very light effects on the actions they mark (FFmpeg-synthesised files from this repo's history); no music.
type Cue = [file: string, frame: number, volume: number];
const cues = (): Cue[] => [
  ['tick', sec(1.5), 0.07],
  ['pop', at('s02', 1, 'رسالة'), 0.09],
  ['pageflip', sceneStart('sc4') - 2, 0.08],
  ['whoosh', at('s05', 7, 'وابتعد'), 0.05],
  ['whoosh', at('s05', 12, 'تهدأ'), 0.04],
  ['click', at('s07', 9, 'كيف'), 0.08],
  ['tick', at('s09', 0, 'احفظها'), 0.08],
];
const Sfx: React.FC = () => (
  <>
    {cues().map(([file, from, volume], i) => (
      <Sequence key={i} from={Math.max(0, from)} layout="none"><Audio src={staticFile(`sfx/${file}.wav`)} volume={volume} /></Sequence>
    ))}
  </>
);

/** Review overlay only (never in the delivered render): side margins, bottom 300 px, right button rail. */
const Guides: React.FC = () => (
  <>
    <div style={{ position: 'absolute', left: SAFE.side, right: SAFE.side, top: 0, bottom: 0, borderLeft: '2px dashed #0ff', borderRight: '2px dashed #0ff' }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: SAFE.bottom, bottom: 0, background: 'rgba(255,0,255,0.18)' }} />
    <div style={{ position: 'absolute', left: SAFE.rail, right: 0, top: H / 2, bottom: 0, background: 'rgba(255,0,255,0.18)' }} />
  </>
);
