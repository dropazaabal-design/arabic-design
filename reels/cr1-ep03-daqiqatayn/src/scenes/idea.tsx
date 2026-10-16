import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Bubble, pose, walk } from '../../../../motion-core/src/cartoon';
import { Book, Outside, Page, Shoe, STEP, Stairs } from '../props';
import { Actor, F, Frame, camMix, type Cam } from '../stage';
import { BookCard, Title } from '../text';
import { C, SAFE, SULTAN, W } from '../theme';
import { ease, life, mix, prog, sec } from '../time';

const S = 1.6;

/** A plain studio floor for the book's idea: light, so the character and the one prop carry the frame. */
const Studio: React.FC = () => (
  <g>
    <rect x={-2000} y={-2000} width={4000} height={2000} fill={C.bg} />
    <rect x={-2000} y={0} width={4000} height={1200} fill={C.env} />
    <path d="M-2000 0 L2000 0" stroke={C.floorLine} strokeWidth={6} />
    <ellipse cx={0} cy={-560} rx={900} ry={700} fill="#FFFFFF" opacity={0.5} />
  </g>
);

const Mark: React.FC<{ ok: boolean; o: number; size?: number }> = ({ ok, o, size = 64 }) => (
  <svg width={size} height={size} viewBox="-32 -32 64 64" style={{ opacity: o, transform: `scale(${mix(0.6, 1, o)})`, flex: 'none' }}>
    <circle r={29} fill={ok ? C.shoe : C.red} stroke={C.ink} strokeWidth={4} />
    <path d={ok ? 'M-13 1 L-4 10 L14 -10' : 'M-11 -11 L11 11 M11 -11 L-11 11'} stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/** «big ✗ → small ✓» row, right to left. */
const Swap: React.FC<{ big: string; small: string; a: number; b: number }> = ({ big, small, a, b }) => (
  <div dir="rtl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, whiteSpace: 'nowrap', fontFamily: 'Tajawal, sans-serif', fontWeight: 800 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: a * (1 - 0.45 * b), fontSize: 66, color: C.ink, textDecoration: b > 0.5 ? `line-through ${C.red} 7px` : 'none' }}>
      <span>{big}</span><Mark ok={false} o={a} size={58} />
    </div>
    <svg width={70} height={40} viewBox="0 0 70 40" style={{ opacity: b }}><path d="M64 20 L8 20 M24 6 L8 20 L24 34" stroke={C.mist} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: b, fontSize: 76, color: C.shoeShade, transform: `scale(${mix(0.85, 1, b)})` }}>
      <span>{small}</span><Mark ok o={b} size={64} />
    </div>
  </div>
);

// ——— R4 · the rule: under two minutes ———
export type IdeaBeats = { start: number; book: number; rule: number; shrink: number; less: number; noBook: number; page: number; noRun: number; shoe: number; end: number };
export const Idea: React.FC<{ f: number; k: IdeaBeats }> = ({ f, k }) => {
  const X = 60;
  const running = f >= k.noRun && f < k.shoe;
  const run = walk(f, X, X, k.noRun, k.shoe - k.noRun, 14);
  const bar = prog(f, k.shrink, k.less + sec(0.4) - k.shrink, ease.inOut); // the hour shrinks to under two minutes
  const barO = life(f, k.rule - sec(0.1), k.noBook);
  const c: Cam = camMix({ x: 40, y: -470, z: 1.45 }, { x: 60, y: -430, z: 1.6 }, prog(f, k.start, k.end - k.start, ease.inOut));
  const held = f >= k.noBook && f < k.page ? 'book' : f >= k.page && f < k.noRun ? 'page' : f >= k.shoe ? 'shoe' : undefined;
  return (
    <AbsoluteFill>
      <Frame c={c} world={<>
        <Studio />
        <Actor f={f} d={{
          look: SULTAN, id: 'idea', seed: 21, x: X, y: 0, scale: S, facing: 1, add: running ? { ...run.add, hipF: run.add.hipF! * 2, hipN: run.add.hipN! * 2, knF: run.add.knF! * 2.4, knN: run.add.knN! * 2.4, shF: run.add.shF! * 2.5, shN: run.add.shN! * 2.5 } : undefined,
          pose: [
            { at: 0, to: pose('think', { headTurn: 0.45, headTilt: -8 }) },
            { at: k.rule, to: pose('stand', { headTurn: 0.4, headTilt: -10 }), dur: sec(0.4) },
            { at: k.less, to: pose('explain', { headTurn: 0.35, headTilt: -4 }), dur: sec(0.4) },
            { at: k.noBook - sec(0.25), to: { ...pose('carry', { headTurn: 0.5 }), lean: -8, bob: 8, shF: 40, elF: 60, shN: 30, elN: 70 }, dur: sec(0.3) }, // the thick book: heavy
            { at: k.page - sec(0.15), to: pose('holdUp', { headTurn: 0.6, headTilt: -6, shF: 110, elF: 25, shN: -10, elN: 20 }), dur: sec(0.3) }, // one page: light
            { at: k.noRun - sec(0.1), to: pose('stand', { lean: 10, headTurn: 0.7, shF: 40, elF: 90, shN: -30, elN: 90 }), dur: sec(0.2) },
            { at: k.shoe - sec(0.1), to: pose('holdUp', { headTurn: 0.55, headTilt: -6, shF: 125, elF: 15 }), dur: sec(0.35) },
          ],
          face: [
            F(0, 'thinking', { gx: 0.2, gy: -1 }),
            F(k.rule, 'calm', { gx: 0, gy: -1 }, sec(0.3)), F(k.shrink + sec(0.5), 'surprised', { gx: 0, gy: -1 }, sec(0.2)),
            F(k.less + sec(0.3), 'smile', { gx: 0, gy: -0.6 }, sec(0.3)),
            F(k.noBook, 'wince', { gx: 0.8, gy: 0.4, sweat: 0.6 }, sec(0.2)),
            F(k.page, 'grin', { gx: 1, gy: -0.8 }, sec(0.2)),
            F(k.noRun, 'wince', { gx: 1, gy: 0, sweat: 1, open: 0.5 }, sec(0.2)),
            F(k.shoe, 'grin', { gx: 1, gy: -0.9, sparkle: 0.7 }, sec(0.2)),
          ],
          handF: held ? 'grip' : running ? 'fist' : 'open', handN: held === 'book' ? 'grip' : 'open',
          holdF: held === 'book' ? <g transform="scale(0.8)"><Book pages={1.8} /></g> : held === 'page' ? <Page rot={-8} /> : held === 'shoe' ? <g transform="translate(6 -4)"><Shoe s={1.05} /></g> : undefined,
          holdUpright: held === 'book' || held === 'shoe' ? 'F' : false,
        }} />
      </>} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: SAFE.y0 + 30, display: 'flex', justifyContent: 'center' }}>
        <BookCard o={life(f, k.book - sec(0.2), k.rule - sec(0.1))} size={60} />
      </div>
      {/* the hour, shrinking to the two-minute version */}
      {barO > 0 && <div dir="rtl" style={{ position: 'absolute', top: SAFE.y0 + 40, left: SAFE.x0, width: SAFE.x1 - SAFE.x0, opacity: barO }}>
        <div dir="rtl" style={{ height: 120, width: `${mix(100, 9, bar)}%`, marginInlineStart: 0, borderRadius: 24, border: `5px solid ${C.ink}`, background: mix(0, 1, bar) > 0.5 ? C.shoe : C.boxLid,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif', fontWeight: 800, fontSize: 64, color: C.ink, overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {bar < 0.5 && <span style={{ opacity: 1 - bar * 2 }}>ساعة كاملة</span>}
        </div>
        <Title text="أقل من دقيقتين" o={prog(f, k.less - sec(0.1), sec(0.4))} size={96} color={C.shoeShade} style={{ marginTop: 26 }} />
      </div>}
      <div style={{ position: 'absolute', top: SAFE.y0 + 70, left: SAFE.x0 - 40, width: SAFE.x1 - SAFE.x0 + 80 }}>
        {f >= k.noBook - sec(0.2) && f < k.noRun - sec(0.1) && <Swap big="كتاب" small="صفحة" a={prog(f, k.noBook - sec(0.2), sec(0.3))} b={prog(f, k.page - sec(0.1), sec(0.35))} />}
        {f >= k.noRun - sec(0.1) && <Swap big="ركض ساعة" small="تلبس الحذاء" a={prog(f, k.noRun - sec(0.1), sec(0.3)) * (1 - prog(f, k.end - sec(0.3), sec(0.3)))} b={prog(f, k.shoe - sec(0.1), sec(0.35)) * (1 - prog(f, k.end - sec(0.3), sec(0.3)))} />}
      </div>
    </AbsoluteFill>
  );
};

// ——— R5 · it has to exist before it can get better ———
export type WhyBeats = { start: number; exist: number; better: number; end: number };
export const Why: React.FC<{ f: number; k: WhyBeats }> = ({ f, k }) => {
  const SX = -150; // foot of the first step
  const w = walk(f, -250, SX + STEP.w / 2, k.exist - sec(0.35), sec(0.75), 30);
  const onStep = prog(f, k.exist + sec(0.05), sec(0.3), ease.out);
  const lit = prog(f, k.better, sec(0.6));
  const c: Cam = camMix({ x: 150, y: -520, z: 1.2 }, { x: 190, y: -560, z: 1.26 }, prog(f, k.start, k.end - k.start, ease.inOut));
  return (
    <AbsoluteFill>
      <Frame c={c} world={<>
        <Studio />
        <g transform={`translate(${SX} 0)`}><Stairs lit={[1, lit, lit * prog(f, k.better + sec(0.25), sec(0.5))]} /></g>
        <Actor f={f} d={{
          look: SULTAN, id: 'why', seed: 23, x: w.x, y: -STEP.h[0] * onStep, scale: S, facing: 1, add: w.add,
          pose: [{ at: 0, to: pose('stand', { headTurn: 0.8 }) }, { at: k.better, to: pose('stand', { headTurn: 0.9, headTilt: -10 }), dur: sec(0.4) }],
          face: [F(0, 'thinking', { gx: 1, gy: 0.5 }), F(k.exist, 'determined', { gx: 1, gy: 0.6 }, sec(0.2)), F(k.better, 'smile', { gx: 1, gy: -0.8 }, sec(0.3))],
          handF: 'fist', handN: 'fist',
        }} />
      </>} />
      <div style={{ position: 'absolute', top: SAFE.y0 + 40, left: SAFE.x0, width: SAFE.x1 - SAFE.x0 }}>
        <Title text="توجد أول…" o={prog(f, k.exist - sec(0.1), sec(0.4))} size={104} color={C.shoeShade} />
        <Title text="قبل ما تتحسن" o={prog(f, k.better - sec(0.1), sec(0.4))} size={80} color={C.mist} style={{ marginTop: 10 }} />
      </div>
    </AbsoluteFill>
  );
};

// ——— R6 · weeks later: out walking, no bargaining ———
export type WalkBeats = { start: number; weeks: number; out: number; noDeal: number; end: number };
export const Walk: React.FC<{ f: number; k: WalkBeats }> = ({ f, k }) => {
  const span = k.end - k.start + sec(0.6);
  const w = walk(f, 0, 0, k.start - sec(0.3), span, 36);
  const dx = (f - k.start) * 5.2;
  const days = Math.round(24 * prog(f, k.weeks - sec(0.2), k.out + sec(0.4) - k.weeks, (x) => x));
  const deal = prog(f, k.noDeal, sec(0.45)) * (1 - prog(f, k.noDeal + sec(1.0), sec(0.12), ease.in));
  const burst = f >= k.noDeal + sec(1.1) && f < k.noDeal + sec(1.4) ? 1 - prog(f, k.noDeal + sec(1.1), sec(0.3)) : 0;
  const c: Cam = camMix({ x: 40, y: -520, z: 1.45 }, { x: 80, y: -500, z: 1.55 }, prog(f, k.start, k.end - k.start, ease.inOut));
  return (
    <AbsoluteFill>
      <Frame c={c} world={<>
        <Outside dx={dx} />
        <Actor f={f} d={{
          look: SULTAN, id: 'walk', seed: 25, x: 0, y: 0, scale: S, facing: 1, feet: 'runner', add: w.add,
          pose: [{ at: 0, to: pose('stand', { headTurn: 0.85, chest: 0.4 }) }, { at: k.noDeal, to: pose('stand', { headTurn: 0.9, chest: 0.8, headTilt: -4 }), dur: sec(0.4) }],
          face: [F(0, 'smile', { gx: 1, gy: 0 }), F(k.noDeal + sec(0.2), 'relieved', { gx: 1, gy: 0 }, sec(0.3)), F(k.noDeal + sec(1.1), 'grin', { gx: 1, gy: 0 }, sec(0.3))],
          handF: 'fist', handN: 'fist',
        }} />
        {/* the old voice, left behind: he does not turn to it */}
        <Bubble id="deal" x={-140} y={-900} w={300} h={180} tail={[-40, -730]} pop={deal} fill="#E6EDF5">
          <text x={0} y={18} textAnchor="middle" direction="rtl" fontFamily="Tajawal, sans-serif" fontWeight={800} fontSize={58} fill={C.mist}>بكرة؟</text>
        </Bubble>
        {burst > 0 && [0, 1, 2, 3, 4, 5].map((j) => <circle key={j} cx={-140 + Math.cos(j) * 140 * (1.4 - burst)} cy={-900 + Math.sin(j) * 90 * (1.4 - burst)} r={10 * burst} fill="#E6EDF5" stroke={C.ink} strokeWidth={3} />)}
      </>} />
      {/* weeks of days, ticked */}
      <div style={{ position: 'absolute', top: SAFE.y0 + 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: life(f, k.weeks - sec(0.3), k.noDeal + sec(0.2)) }}>
        <svg width={W * 0.62} height={300} viewBox="0 0 700 340">
          <rect x={4} y={4} width={692} height={332} rx={24} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          {Array.from({ length: 28 }, (_, j) => {
            const col = 6 - (j % 7), row = Math.floor(j / 7), x = 30 + col * 94, y = 26 + row * 76;
            return <g key={j}>
              <rect x={x} y={y} width={78} height={62} rx={12} fill={j < days ? C.shoe : C.note} stroke={C.ink} strokeWidth={3} />
              {j < days && <path d={`M${x + 22} ${y + 32} L${x + 34} ${y + 44} L${x + 56} ${y + 20}`} stroke="#FFFFFF" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            </g>;
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
