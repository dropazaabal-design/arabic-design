import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Chip, PlacedSet, Seesaw, SetState, SPOTS, onCanvas } from './art';
import short from './data/short.json';
import { loadFonts } from './fonts';
import { BookCard, Captions, Guides, Signature, Title } from './text';
import { C, Profile, PROFILES } from './theme';
import { ease, life, prog, Program, sec, setFps, timing } from './time';

loadFonts();
const PROG = short as Program;

// Layout per ratio (CR1 §8): same story and timing, elements redistributed.
// 9:16 — the desk fills the width, a reading band above it, captions under it, the right-hand
//        rail and the lower 380 px left to the platform's buttons and description.
// 4:5  — a tighter camera on the two objects; the book card gets its own band at the top.
type Layout = { set: { x: number; y: number; w: number }; band: { top: number; height: number }; captionBottom: number; chipSize: number };
const LAYOUT: Record<'9x16' | '4x5', Layout> = {
  '9x16': { set: { x: -95, y: 560, w: 1150 }, band: { top: 236, height: 370 }, captionBottom: 1522, chipSize: 52 },
  '4x5': { set: { x: -22, y: 318, w: 1124 }, band: { top: 112, height: 196 }, captionBottom: 1208, chipSize: 48 },
};
const clampX = (p: Profile, x: number, half: number) => Math.min(p.safe.x1 - half, Math.max(p.safe.x0 + half, x));

/** The standalone reel: one situation, one idea, one change, one step — a whole story on its own. */
export const Reel: React.FC<{ ratio: '9x16' | '4x5'; guides?: boolean }> = ({ ratio, guides = false }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  setFps(fps);
  const p = PROFILES[ratio];
  const L = LAYOUT[ratio];
  const T = timing(PROG);
  const A = T.at, S = T.segStart;
  const on = (from: number, dur = sec(0.5), e = ease.inOut) => prog(f, from, dur, e);
  const win = (from: number, to: number, fin = sec(0.3), fout = sec(0.3)) => life(f, from, to, fin, fout);
  const pulse = (at: number, len = sec(1.2)) => win(at, at + len, sec(0.12), sec(0.5));

  // the attempt, told by the objects alone: the phone is turned over, it buzzes, it is turned back
  const flipAt = A('R2', 8, 'ومرة');
  const flip = on(flipAt, sec(0.4)) - on(flipAt + sec(1.5), sec(0.4));
  const away = on(A('R4', 13, 'يروح'), sec(1.4));
  const room: SetState = {
    phoneLit: f < A('R4', 13) ? 0.35 + 0.65 * Math.max(pulse(sec(0.5), sec(1.8)), pulse(A('R2', 4, 'والهاتف'), sec(1.8)), pulse(A('R2', 6, 'يضيء')), pulse(flipAt + sec(1.9), sec(1.6)), win(A('R3', 21, 'والإشارة'), S('R4'))) : 0.35,
    phoneBadge: Math.max(pulse(sec(0.5), sec(1.8)), pulse(A('R2', 6), sec(1.4)), pulse(flipAt + sec(1.9), sec(1.6))),
    phoneFlip: flip,
    phoneBuzz: win(flipAt + sec(0.75), flipAt + sec(1.5), sec(0.1), sec(0.2)),
    phoneAside: on(A('R4', 4, 'الكتاب') - sec(0.4), sec(0.6)),
    phoneAway: away,
    drawerOpen: on(A('R4', 4, 'الكتاب'), sec(0.5)) - on(A('R4', 10, 'على') + sec(0.2), sec(0.5)),
    bookGhost: on(A('R1', 3, 'اليوم')) * (f < A('R4', 4) ? 1 : 0),
    bookOut: prog(f, A('R4', 5, 'يطلع'), sec(1.2), ease.inOut),
    bookOpen: on(A('R4', 9, 'مفتوحًا'), sec(0.5)),
    bookmark: on(A('R4', 10, 'على'), sec(0.5)),
    bookGlow: on(A('R4', 20, 'تشوفه'), sec(0.8)),
    hours: f < S('R6') - sec(0.3)
      ? 10 + (f / fps) * 0.003 + prog(f, A('R2', 10, 'وتخلص'), sec(1.6), ease.inOut) * 2
      : 10 + ((f - S('R6')) / fps) * 0.003, // the last shot is the first night again,
    note: on(A('R1', 3, 'اليوم'), sec(0.45)),
    noteSag: on(A('R2', 12, 'والدرج'), sec(0.8)) * (f < S('R4') ? 1 : 0),
    noteCheck: on(A('R6', 4, 'تغيّر'), sec(0.5)),
    sights: [
      { to: 'phone', o: win(A('R3', 18, 'عادة'), S('R4'), sec(0.7)), color: C.red },
      { to: 'drawer', o: win(A('R3', 22, 'الظاهرة'), S('R4'), sec(0.7)), blocked: true, color: C.lilac },
      { to: 'book', o: win(A('R4', 17, 'الآن'), A('R4', 23, 'والهاتف'), sec(0.7)), color: C.green },
    ],
    frame: { o: win(A('R6', 4, 'تغيّر'), A('R6', 13)), color: C.green },
    path: win(A('R4', 24, 'يحتاج'), A('R4', 28) + sec(0.4)),
    tracker: { o: win(A('R5', 11, 'علّم'), S('R6') - sec(0.2)), checks: f >= A('R5', 14, 'فتحت') ? 1 : 0 },
    ring: (() => {
      const list: [SetState['ring'], number, number][] = [
        [{ at: 'drawer', color: C.lilac, o: 1 }, A('R2', 1), A('R2', 4)],
        [{ at: 'phone', color: C.red, o: 1 }, A('R2', 4), A('R2', 6)],
        [{ at: 'clock', color: C.light, o: 1 }, A('R2', 10), A('R2', 13)],
        [{ at: 'book', color: C.green, o: 1 }, A('R5', 2, 'اختر'), A('R5', 6)],
        [{ at: 'book', color: C.green, o: 1 }, A('R6', 7, 'وأنت'), A('R6', 12)],
      ];
      const live = list.map(([r, a, b]) => ({ r, o: win(a, b) })).filter((x) => x.o > 0.01);
      return live.length ? { ...live[live.length - 1].r!, o: live[live.length - 1].o } : null;
    })(),
  };

  const at = L.set;
  const phone = onCanvas(SPOTS.phone, at);
  const drawer = onCanvas(SPOTS.drawer, at);
  const chip = L.chipSize;
  const band = (o: number, el: React.ReactNode) => o > 0.01 && (
    <div style={{ position: 'absolute', left: p.safe.x0, width: p.safe.x1 - p.safe.x0, top: L.band.top, height: L.band.height, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: o }}>{el}</div>
  );
  const phoneChipY = ratio === '9x16' ? 868 : 640;
  const drawerChipY = ratio === '9x16' ? 1196 : 938;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(130% 80% at 50% 40%, ${C.wall} 0%, ${C.wallLow} 70%, ${C.night} 100%)`, overflow: 'hidden' }}>
      <PlacedSet s={room} {...at} />

      {/* the reading band: one thing at a time */}
      {band(win(0, A('R3', 1) - sec(0.1), 1, sec(0.3)), <Title text="لماذا الهاتف أقرب من الكتاب؟" size={p.title} o={1} />)}
      {band(win(A('R3', 1, 'كتاب'), A('R3', 8)), <BookCard size={ratio === '9x16' ? 60 : 50} o={1} />)}
      {band(win(A('R3', 8, 'البيئة'), A('R3', 18)), <div style={{ position: 'relative', width: 452 * (ratio === '9x16' ? 1.1 : 0.62), height: 330 * (ratio === '9x16' ? 1.1 : 0.62) }}>
        <Seesaw o={1} tip={prog(f, A('R3', 14, 'أكثر'), sec(0.9), ease.back)} x={0} y={0} scale={ratio === '9x16' ? 1.1 : 0.62} />
      </div>)}
      {band(win(A('R4', 0, 'خلّينا'), A('R4', 28)), <Chip text="نغيّر شيئًا واحدًا: المكان" icon="spark" color={C.green} size={chip} o={1} />)}
      {band(win(A('R4', 28, 'هذا'), S('R5')), <Chip text="مثال من عندنا" color={C.mist} size={chip} o={1} />)}
      {band(win(A('R5', 0, 'جرّبها'), A('R5', 17)), <Chip text="تجربة مقترحة: أسبوع" icon="check" color={C.green} size={chip} solid o={1} />)}
      {band(win(A('R5', 17, 'الظهور'), A('R5', 25)), (
        <div dir="rtl" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18 }}>
          <Chip text="كتاب ثقيل" icon="weight" color={C.red} size={chip} o={on(A('R5', 21, 'ولا'), sec(0.3))} />
          <Chip text="تعب" icon="battery" color={C.red} size={chip} o={on(A('R5', 22, 'يحلّ'), sec(0.3))} />
          <Chip text="وقت ضيق" icon="hourglass" color={C.red} size={chip} o={on(A('R5', 23, 'كل'), sec(0.3))} />
        </div>
      ))}
      {band(win(A('R5', 25, 'لكنه'), S('R6') + sec(0.2)), <Chip text="يسهّل أول خطوة" icon="check" color={C.green} size={chip} solid o={1} />)}
      {band(on(A('R6', 13, 'إلى'), sec(0.5)), (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <Title text="إلى أي خيار يدعوك؟" size={p.title} o={1} />
          <Signature size={ratio === '9x16' ? 40 : 36} o={on(A('R6', 15, 'خيار'), sec(0.6))} />
        </div>
      ))}

      {/* labels on the objects */}
      <Chip text="قريب وظاهر" icon="eye" color={C.red} size={chip} o={win(A('R2', 5, 'قدامك'), A('R2', 8)) + win(A('R2', 19, 'شوف'), S('R3'))}
        style={{ position: 'absolute', left: clampX(p, phone[0], 170), top: phoneChipY, translate: '-50% 0' }} />
      <Chip text="المحاولة: قلب الهاتف" icon="spark" color={C.blue} size={chip} o={win(flipAt, flipAt + sec(2.4))}
        style={{ position: 'absolute', left: clampX(p, phone[0], 270), top: phoneChipY, translate: '-50% 0' }} />
      <Chip text="بعيد ومخفي" icon="lock" color={C.lilac} size={chip} o={win(A('R2', 3, 'الدرج'), A('R2', 8)) + win(A('R2', 19), S('R3'))}
        style={{ position: 'absolute', left: clampX(p, drawer[0], 170), top: drawerChipY, translate: '-50% 0' }} />

      <Captions f={f} caps={PROG.captions} p={p} bottom={L.captionBottom} />
      <Audio src={staticFile(PROG.audio)} />
      {guides && <Guides p={p} />}
    </AbsoluteFill>
  );
};
