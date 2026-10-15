import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Chip, Icon, IconKind, PlacedSet, Seesaw, SetState, SPOTS, onCanvas } from './art';
import long from './data/long.json';
import { BODY, loadFonts, TITLE } from './fonts';
import { BookCard, Guides, Signature, Title } from './text';
import { C, PROFILES } from './theme';
import { ease, life, mix, prog, Program, sec, setFps, timing } from './time';

loadFonts();
const P = PROFILES['16x9'];
const PROG = long as Program;
type Place = { x: number; y: number; w: number };
const FULL: Place = { x: 310, y: 170, w: 1300 };
const LEFT: Place = { x: 154, y: 236, w: 1110 }; // room for the book card / the steps on the right (read first)
const AFTER: Place = { x: 172, y: 330, w: 770 };
const BEFORE: Place = { x: 990, y: 330, w: 770 };
const lerp = (a: Place, b: Place, p: number): Place => ({ x: mix(a.x, b.x, p), y: mix(a.y, b.y, p), w: mix(a.w, b.w, p) });

/** The horizontal episode, 1920×1080. One room all the way through: problem, attempt, change, result. */
export const Episode: React.FC<{ guides?: boolean }> = ({ guides = false }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  setFps(fps);
  const T = timing(PROG);
  const A = T.at, S = T.segStart, SE = T.segEnd;
  const on = (from: number, dur = sec(0.5), e = ease.inOut) => prog(f, from, dur, e);
  const win = (from: number, to: number, fin = sec(0.35), fout = sec(0.35)) => life(f, from, to, fin, fout);
  const pulse = (at: number, len = sec(1.4)) => win(at, at + len, sec(0.15), sec(0.6));

  // ---- the room's state, beat by beat --------------------------------------------------------
  const away = on(A('L5', 28, 'يروح'), sec(1.6));
  const drawerOpen = on(A('L5', 14, 'الكتاب'), sec(0.6)) - on(A('L5', 20, 'على') + sec(0.3), sec(0.5));
  const bookOut = prog(f, A('L5', 15, 'يطلع'), sec(1.3), ease.inOut);
  const flip = on(A('L2', 36, 'تقلب'), sec(0.5)) - on(A('L2', 43, 'تقلبه'), sec(0.45));
  const litPulse = Math.max(
    pulse(sec(0.8), sec(2.0)), pulse(A('L1', 9, 'والهاتف'), sec(2.2)), win(A('L2', 16, 'والهاتف'), A('L2', 21), sec(0.4)) * 0.6,
    pulse(A('L2', 21, 'يضيء')), pulse(A('L2', 25, 'يضيء')), win(A('L2', 43, 'تقلبه'), A('L3', 0), sec(0.3)),
    pulse(A('L3', 35, 'والإشارة'), sec(2.5)),
  );
  const badge = Math.max(pulse(sec(0.8), sec(2.0)), pulse(A('L1', 9), sec(2.2)), win(A('L2', 21), A('L2', 32)), win(A('L2', 43), A('L3', 0)));
  const nightReset = f >= S('L4') ? 1 : 0; // a new night begins while the diagram covers the room
  const hours = f < S('L4')
    ? 10 + (f / fps) * 0.002 + prog(f, A('L2', 44, 'وبعد'), sec(1.8), ease.inOut)
    : f < S('L8') - sec(0.5)
      ? 10 + ((f - S('L4')) / fps) * 0.002 + prog(f, A('L6', 33, 'فترة'), sec(2.6), ease.inOut) * 6
      : 10 + ((f - S('L8')) / fps) * 0.002; // the closing shot is the opening night again
  const fade = on(A('L6', 35, 'ممكن'), sec(2.6)) - on(A('L6', 48, 'الفكرة'), sec(0.8));
  const ringAt = (list: [SetState['ring'], number, number][]) => {
    const live = list.map(([r, a, b]) => ({ r, o: win(a, b) })).filter((x) => x.o > 0.01);
    return live.length ? { ...live[live.length - 1].r!, o: live[live.length - 1].o } : null;
  };
  const room: SetState = {
    phoneLit: f < A('L5', 28) ? 0.35 + 0.65 * litPulse : 0.35,
    phoneBadge: badge,
    phoneFlip: flip,
    phoneBuzz: win(A('L2', 41, 'يهتز') - sec(0.1), A('L2', 42) + sec(0.3), sec(0.1), sec(0.3)),
    phoneAside: on(A('L5', 14, 'الكتاب') - sec(0.4), sec(0.6)),
    phoneAway: away,
    drawerOpen,
    bookGhost: on(A('L1', 3, 'اليوم')) * (1 - on(S('L4') - sec(0.3))) + on(SE('L4')) * (f < A('L5', 14) ? 1 : 0),
    bookOut,
    bookOpen: on(A('L5', 19, 'مفتوحًا'), sec(0.6)),
    bookmark: on(A('L5', 23, 'الصفحة'), sec(0.6)),
    bookGlow: on(A('L5', 46, 'اللي'), sec(0.8)),
    bookFade: fade,
    hours,
    note: on(A('L1', 3, 'اليوم'), sec(0.5)),
    noteSag: on(A('L2', 46, 'الدرج'), sec(0.9)) * (1 - nightReset),
    noteCheck: on(A('L8', 23, 'رتّبت'), sec(0.5)),
    sights: [
      { to: 'phone', o: win(A('L3', 33, 'تبدأ'), S('L4') - sec(0.2), sec(0.8)), color: C.red },
      { to: 'drawer', o: win(A('L3', 36, 'الظاهرة'), S('L4') - sec(0.2), sec(0.8)), blocked: true, color: C.lilac },
      { to: 'book', o: win(A('L5', 36, 'أول'), A('L5', 48, 'والهاتف'), sec(0.8)), color: C.green },
    ],
    frame: Math.max(win(A('L3', 18, 'واللي'), A('L3', 31)), 0) > 0.01 ? { o: win(A('L3', 18), A('L3', 31)), color: C.blue }
      : { o: win(A('L8', 22, 'بس'), A('L8', 29)), color: C.green },
    path: win(A('L5', 51, 'منك'), S('L6')),
    tracker: { o: win(A('L7', 52, 'علامة'), S('L8') - sec(0.2)), checks: f >= A('L7', 58, 'تكفي') ? 1 : 0 },
    ring: ringAt([
      [{ at: 'drawer', color: C.lilac, o: 1 }, A('L1', 6), A('L1', 9)],
      [{ at: 'phone', color: C.red, o: 1 }, A('L1', 9), A('L1', 11)],
      [{ at: 'clock', color: C.light, o: 1 }, A('L2', 0, 'الساعة'), A('L2', 3)],
      [{ at: 'drawer', color: C.lilac, o: 1 }, A('L2', 8, 'الكتاب'), A('L2', 16)],
      [{ at: 'clock', color: C.light, o: 1 }, A('L2', 44, 'وبعد'), A('L2', 48) + sec(0.6)],
      [{ at: 'note', color: C.blue, o: 1 }, A('L5', 6, 'ما'), A('L5', 12)],
      [{ at: 'desk', color: C.green, o: 1 }, A('L5', 12, 'نغيّر'), A('L5', 14)],
      [{ at: 'desk', color: C.green, o: 1 }, A('L7', 5, 'اختر'), A('L7', 16)],
      [{ at: 'book', color: C.green, o: 1 }, A('L7', 17, 'حط'), A('L7', 23)],
      [{ at: 'door', color: C.green, o: 1 }, A('L7', 24, 'أبعد'), A('L7', 31)],
      [{ at: 'book', color: C.green, o: 1 }, A('L8', 10, 'الكتاب'), A('L8', 12)],
      [{ at: 'door', color: C.mist, o: 1 }, A('L8', 12, 'والهاتف'), A('L8', 14)],
    ]),
    dim: on(S('L4') - sec(0.4), sec(0.6)) - on(SE('L4') + sec(0.2), sec(0.6)),
  };

  // ---- camera: where the room sits on the canvas ------------------------------------------------
  const toLeft = Math.max(
    on(A('L3', 0, 'في'), sec(0.8)) - on(SE('L3') + sec(0.4), sec(0.6)),
    on(S('L7') - sec(0.6), sec(0.8)) - on(SE('L7') + sec(0.4), sec(0.8)),
  );
  const split = on(A('L5', 70, 'لكنه'), sec(0.9)) - on(S('L6') - sec(0.6), sec(0.9));
  const place = lerp(lerp(FULL, LEFT, toLeft), AFTER, split);
  const before: SetState = { phoneLit: 1, phoneBadge: 1, bookGhost: 1, hours: 10, note: 1 };

  // ---- copy on screen -------------------------------------------------------------------------
  const B = P.body;
  const phoneLabelAt = onCanvas(SPOTS.phone, FULL);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 30%, ${C.wall} 0%, ${C.wallLow} 70%, ${C.night} 100%)`, overflow: 'hidden' }}>
      <PlacedSet s={room} {...place} />
      {split > 0.01 && <PlacedSet s={before} {...BEFORE} opacity={split} />}
      {split > 0.01 && (
        <>
          <Chip text="قبل" color={C.red} size={56} o={split} style={{ position: 'absolute', left: BEFORE.x + BEFORE.w / 2, top: 228, translate: '-50% 0' }} />
          <Chip text="بعد" color={C.green} size={56} o={split} style={{ position: 'absolute', left: AFTER.x + AFTER.w / 2, top: 228, translate: '-50% 0' }} />
        </>
      )}

      {/* L1 — the paradox */}
      <div style={{ position: 'absolute', left: P.safe.x0, width: P.safe.x1 - P.safe.x0, top: 92 }}>
        <Title text="لماذا الهاتف أقرب من الكتاب؟" size={P.title} o={win(0, A('L2', 0) - sec(0.2), sec(0.6), sec(0.6))} />
      </div>
      <Chip text="قريب وظاهر" icon="eye" color={C.red} size={B} o={win(A('L1', 10, 'قدامك'), A('L2', 3))}
        style={{ position: 'absolute', left: phoneLabelAt[0], top: 498, translate: '-50% 0' }} />
      <Chip text="بعيد ومخفي" icon="lock" color={C.lilac} size={B} o={win(A('L1', 8, 'الدرج'), A('L2', 3))}
        style={{ position: 'absolute', left: 1430, top: 790 }} />
      <Signature size={40} o={win(sec(1), A('L2', 0)) * 0.95} style={{ position: 'absolute', right: 1920 - P.safe.x1, top: 222 }} />

      {/* L2 — the night and the attempt */}
      <Chip text="المحاولة: قوة الإرادة" icon="spark" color={C.blue} size={B} o={win(A('L2', 32, 'فتقرر'), A('L2', 44))}
        style={{ position: 'absolute', left: phoneLabelAt[0], top: 498, translate: '-50% 0' }} />

      {/* L3 — the book and its idea */}
      <div style={{ position: 'absolute', right: 1920 - P.safe.x1, top: 236, width: 452 }}>
        <BookCard size={50} o={win(A('L3', 1, 'كتاب'), SE('L3') + sec(0.3))} />
      </div>
      <Seesaw o={win(A('L3', 9, 'البيئة') - sec(0.3), A('L3', 18))} tip={prog(f, A('L3', 15, 'أكثر'), sec(1.0), ease.back)} x={P.safe.x1 - 452} y={560} scale={1} />
      <Chip text="البيئة" color={C.blue} size={B} o={win(A('L3', 18, 'واللي'), A('L3', 31))} style={{ position: 'absolute', left: LEFT.x + 30, top: LEFT.y - 4 }} />

      {/* L4 — the mechanism, drawn */}
      <Diagram f={f} A={A} from={S('L4') - sec(0.2)} to={SE('L4') + sec(0.3)} />

      {/* L5 — change one thing */}
      <div style={{ position: 'absolute', left: P.safe.x0, width: P.safe.x1 - P.safe.x0, top: 96, display: 'flex', justifyContent: 'center' }}>
        <Chip text="نغيّر شيئًا واحدًا: المكان" icon="spark" color={C.green} size={56} o={win(A('L5', 1, 'خلّينا'), A('L5', 33))} />
      </div>
      <Chip text="لحظة تختار فيها" icon="hourglass" color={C.green} size={B} o={win(A('L5', 55, 'خطوة'), A('L5', 62))} style={{ position: 'absolute', left: 470, top: 880 }} />
      <Chip text="مثال توضيحي" color={C.mist} size={44} o={win(A('L5', 62, 'هذا'), S('L6') - sec(0.4))} style={{ position: 'absolute', left: P.safe.x0, top: 100 }} />

      {/* L6 — the limits */}
      <div style={{ position: 'absolute', left: P.safe.x0, width: P.safe.x1 - P.safe.x0, top: 96, display: 'flex', justifyContent: 'center' }}>
        <Chip text="حدود الفكرة" icon="lock" color={C.red} size={56} o={win(A('L6', 0, 'لكن'), A('L6', 42))} />
      </div>
      <div dir="rtl" style={{ position: 'absolute', right: 1920 - P.safe.x1, top: 470, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22 }}>
        <Chip text="كتاب ثقيل" icon="weight" color={C.red} size={B} o={win(A('L6', 13, 'الكتاب'), A('L6', 28))} />
        <Chip text="تعب" icon="battery" color={C.red} size={B} o={win(A('L6', 17, 'كنت'), A('L6', 28))} />
        <Chip text="وقت ضيق" icon="hourglass" color={C.red} size={B} o={win(A('L6', 21, 'عندك'), A('L6', 28))} />
      </div>
      <div style={{ position: 'absolute', left: P.safe.x0, width: P.safe.x1 - P.safe.x0, top: 96, display: 'flex', justifyContent: 'center' }}>
        <Chip text="حط الكتاب وخلاص" color={C.red} size={56} o={win(A('L6', 45, 'حط'), A('L6', 48))} strike={on(A('L6', 46), sec(0.5))} />
      </div>
      <div style={{ position: 'absolute', left: P.safe.x0, width: P.safe.x1 - P.safe.x0, top: 96, display: 'flex', justifyContent: 'center' }}>
        <Chip text="سهّل أول خطوة" icon="check" color={C.green} size={56} solid o={win(A('L6', 49, 'تقول'), S('L7') - sec(0.3))} />
      </div>
      <div dir="rtl" style={{ position: 'absolute', right: 1920 - P.safe.x1, top: 470, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22 }}>
        <Chip text="كتاب يناسبك" color={C.green} size={B} o={win(A('L6', 55, 'كتابًا'), S('L7') - sec(0.3))} />
        <Chip text="وقت حقيقي" color={C.green} size={B} o={win(A('L6', 57, 'ووقتًا'), S('L7') - sec(0.3))} />
      </div>

      {/* L7 — a one-week experiment */}
      <Steps f={f} A={A} from={S('L7')} to={SE('L7') + sec(0.3)} />

      {/* L8 — the same desk, the same night */}
      <div style={{ position: 'absolute', left: P.safe.x0, width: P.safe.x1 - P.safe.x0, top: 92 }}>
        <Title text="إلى أي خيار يدعوك؟" size={P.title} o={on(A('L8', 37, 'إلى'), sec(0.6))} color={C.light} />
      </div>
      <Signature size={40} o={on(A('L8', 29, 'فسؤالي'), sec(0.8))} style={{ position: 'absolute', right: 1920 - P.safe.x1, top: 222 }} />

      <Audio src={staticFile(PROG.audio)} />
      {guides && <Guides p={P} />}
    </AbsoluteFill>
  );
};

type At = (seg: string, i: number, check?: string) => number;

/** Cue → craving → action, drawn right to left; the phone's path is open, the book's is locked. */
const Diagram: React.FC<{ f: number; A: At; from: number; to: number }> = ({ f, A, from, to }) => {
  const o = life(f, from, to, sec(0.5), sec(0.5));
  if (o < 0.01) return null;
  const xs = [1440, 1000, 560];
  const rows = [{ y: 330, who: 'الهاتف', color: C.red }, { y: 640, who: 'الكتاب', color: C.lilac }];
  const labels: [string, IconKind][] = [['إشارة', 'spark'], ['رغبة', 'question'], ['فعل', 'open']];
  const nodeIn = [A('L4', 2, 'أول'), A('L4', 10, 'بعدها'), A('L4', 16, 'وبعدها')];
  const bookIn = A('L4', 35, 'الكتاب');
  const lock = prog(f, A('L4', 46, 'مقفول'), sec(0.5), ease.back);
  const door = prog(f, A('L4', 28, 'تفتح'), sec(0.8), ease.inOut);
  const race = A('L4', 50, 'يعني');
  const lap = sec(1.25);
  const dotT = f >= race ? ((f - race) % lap) / lap : -1;
  const W = 330, H = 128;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ position: 'absolute', left: P.safe.x0, width: P.safe.x1 - P.safe.x0, top: 92 }}>
        <Title text="من الإشارة إلى الفعل" size={P.title} o={1} />
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {rows.map((r, ri) => [0, 1].map((k) => {
          const p = ri === 0 ? prog(f, nodeIn[k + 1] - sec(0.5), sec(0.6), ease.inOut) : prog(f, bookIn + sec(0.3 + k * 0.3), sec(0.5));
          const x1 = xs[k] - W / 2 - 8, x2 = xs[k + 1] + W / 2 + 22;
          return (
            <g key={`${ri}${k}`} opacity={ri === 0 ? 1 : 0.8}>
              <line x1={x1} y1={r.y} x2={mix(x1, x2, p)} y2={r.y} stroke={ri === 0 ? C.blue : C.mist} strokeWidth={8} strokeDasharray={ri === 1 ? '14 12' : undefined} strokeLinecap="round" />
              {p > 0.95 && <path d={`M ${x2 + 18} ${r.y - 16} L ${x2 - 2} ${r.y} L ${x2 + 18} ${r.y + 16}`} fill="none" stroke={ri === 0 ? C.blue : C.mist} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />}
            </g>
          );
        }))}
        {dotT >= 0 && <circle cx={mix(xs[0], xs[2], dotT)} cy={rows[0].y - H / 2 - 26} r={16} fill={C.red} />}
      </svg>
      {rows.map((r, ri) => (
        <React.Fragment key={ri}>
          <div dir="rtl" lang="ar" style={{ position: 'absolute', left: 1640, top: r.y - 40, width: 140, textAlign: 'center', fontFamily: TITLE, fontWeight: 800, fontSize: 48, color: r.color,
            opacity: ri === 0 ? prog(f, nodeIn[0] - sec(0.4), sec(0.5)) : prog(f, bookIn - sec(0.2), sec(0.5)) }}>{r.who}</div>
          {labels.map(([t, ic], k) => {
            const p = ri === 0 ? prog(f, nodeIn[k], sec(0.5), ease.back) : prog(f, bookIn + sec(k * 0.3), sec(0.5));
            const live = ri === 0 || k === 0 ? 1 : 0.55;
            return (
              <div key={k} dir="rtl" lang="ar" style={{
                position: 'absolute', left: xs[k] - W / 2, top: r.y - H / 2, width: W, height: H, borderRadius: 26,
                background: ri === 0 ? '#16294A' : '#151E33', border: `5px solid ${ri === 0 ? C.blue : C.mist}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, opacity: p * live, transform: `scale(${mix(0.85, 1, p)})`,
                fontFamily: TITLE, fontWeight: 800, fontSize: 56, color: C.light,
              }}>
                <Icon kind={ic} size={56} color={ri === 0 ? C.light : C.mist} />
                <span>{t}</span>
              </div>
            );
          })}
        </React.Fragment>
      ))}
      {/* the cue opens a door; it does not push you through it */}
      <div style={{ position: 'absolute', left: xs[0] - 34, top: rows[0].y - H / 2 - 92, opacity: life(f, A('L4', 22, 'الإشارة'), A('L4', 30), sec(0.3), sec(0.4)), transform: `scaleX(${mix(1, -0.3, door)})` }}>
        <Icon kind="door" size={68} color={C.blue} />
      </div>
      <div dir="rtl" style={{ position: 'absolute', left: xs[0] - 260, width: 520, top: rows[0].y + H / 2 + 22, display: 'flex', justifyContent: 'center', gap: 16 }}>
        <Chip text="ظاهرة طول الوقت" color={C.red} size={44} o={prog(f, A('L4', 37, 'ظاهرة'), sec(0.4))} />
        <Chip text="قريب" color={C.red} size={44} o={prog(f, A('L4', 41, 'قريب'), sec(0.4))} />
      </div>
      <div style={{ position: 'absolute', left: xs[0] + W / 2 - 50, top: rows[1].y - H / 2 - 36, width: 92, height: 92, borderRadius: 46, background: C.night, border: `5px solid ${C.red}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: lock, transform: `scale(${mix(0.6, 1, lock)})` }}>
        <Icon kind="lock" size={56} color={C.red} />
      </div>
      {f >= A('L4', 60, 'والثاني') && (
        <div style={{ position: 'absolute', left: xs[0] - 60, top: rows[1].y + H / 2 + 18, display: 'flex', gap: 18 }}>
          {[0, 1, 2].map((k) => <div key={k} style={{ width: 22, height: 22, borderRadius: 11, background: C.mist, opacity: 0.35 + 0.65 * Math.max(0, Math.sin(((f - A('L4', 60)) / sec(1.2)) * Math.PI * 2 - k * 0.9)) }} />)}
        </div>
      )}
    </div>
  );
};

/** The one-week experiment as three steps, on the right, read first. */
const Steps: React.FC<{ f: number; A: At; from: number; to: number }> = ({ f, A, from, to }) => {
  const o = life(f, from, to, sec(0.5), sec(0.5));
  if (o < 0.01) return null;
  const steps: [string, number][] = [
    ['اختر مكانًا تمرّ عليه كل ليلة', A('L7', 4, 'أولًا')],
    ['الكتاب مفتوح على صفحتك', A('L7', 16, 'ثانيًا')],
    ['الشاحن بعيد ولو مترين', A('L7', 23, 'ثالثًا')],
  ];
  const stepsOut = prog(f, A('L7', 31, 'وكل'), sec(0.5));
  const left = 1300, width = P.safe.x1 - 1300;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o }}>
      <div style={{ position: 'absolute', left: P.safe.x0, width: P.safe.x1 - P.safe.x0, top: 96, display: 'flex', justifyContent: 'center' }}>
        <Chip text="تجربة أسبوع" icon="check" color={C.green} size={56} solid o={1} />
      </div>
      <div dir="rtl" style={{ position: 'absolute', left, width, top: 250, display: 'flex', flexDirection: 'column', gap: 34, opacity: 1 - stepsOut }}>
        {steps.map(([t, at], k) => {
          const p = prog(f, at, sec(0.5), ease.out);
          return (
            <div key={k} lang="ar" style={{ display: 'flex', alignItems: 'flex-start', gap: 20, opacity: p, transform: `translateX(${mix(-30, 0, p)}px)`, fontFamily: BODY, fontWeight: 700, fontSize: 48, lineHeight: 1.4, color: C.light }}>
              <div style={{ flex: 'none', width: 72, height: 72, borderRadius: 36, background: C.green, color: C.night, fontFamily: TITLE, fontWeight: 800, fontSize: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>{k + 1}</div>
              <div>{t}</div>
            </div>
          );
        })}
      </div>
      <div dir="rtl" style={{ position: 'absolute', left, width, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 30 }}>
        <Chip text="هل كان البدء أسهل؟" icon="question" color={C.green} size={50} o={prog(f, A('L7', 37, 'هل'), sec(0.4)) * (1 - prog(f, A('L7', 59, 'وإذا'), sec(0.4)))} />
        <Chip text="عدد الصفحات" color={C.red} size={48} o={prog(f, A('L7', 43, 'عدد'), sec(0.4)) * (1 - prog(f, A('L7', 59), sec(0.4)))} strike={prog(f, A('L7', 44, 'الصفحات'), sec(0.5))} />
        <Chip text="كم ليلة فتحت الكتاب" icon="check" color={C.green} size={48} o={prog(f, A('L7', 48, 'كم'), sec(0.4)) * (1 - prog(f, A('L7', 59), sec(0.4)))} />
      </div>
      <div dir="rtl" style={{ position: 'absolute', left, width, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 30 }}>
        <Chip text="لم يتغير شيء؟ ابحث عن العائق" icon="question" color={C.blue} size={44} o={prog(f, A('L7', 65, 'هذه'), sec(0.4))} />
        <Chip text="نوع الكتاب" color={C.blue} size={48} o={prog(f, A('L7', 75, 'نوع'), sec(0.4))} />
        <Chip text="وقت القراءة" color={C.blue} size={48} o={prog(f, A('L7', 78, 'وقت'), sec(0.4))} />
      </div>
    </div>
  );
};
