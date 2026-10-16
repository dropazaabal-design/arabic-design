import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Calendar, INK } from '../../../../motion-core/src/cartoon';
import { TITLE } from '../fonts';
import { toScreen, type Ratio } from '../stage';
import { Title } from '../text';
import { C, PROFILES } from '../theme';
import { ease, prog, sec } from '../time';
import { Hook, hookEnd, type HookBeats } from './hook';

// E2 (L2), episode only: the opening freezes and dims; the question is asked over it; a light
// finds Majid («what could the money really buy him?»); then the opening rewinds, the car backs
// out, and a calendar flips back two months.
export type QuestionBeats = { start: number; why: number; whyEnd: number; money: number; back: number; months: number; end: number };

export const Question: React.FC<{ f: number; hb: HookBeats; k: QuestionBeats; ratio: Ratio }> = ({ f, hb, k, ratio }) => {
  const hold = hb.end + sec(0.5);
  // rewind: the hook plays backwards at about ten times speed from «نرجع»
  const rw = prog(f, k.back, sec(1.3), ease.inOut);
  const hf = rw > 0 ? hold - (hold - hb.start + sec(0.4)) * rw : Math.min(f, hold);
  const dim = prog(f, k.start, sec(0.6)) * (1 - rw);
  const p = PROFILES[ratio];
  const q = prog(f, k.why - sec(0.1), sec(0.5)) * (1 - prog(f, k.whyEnd, sec(0.4)));
  const spot = prog(f, k.money, sec(0.7), ease.inOut) * (1 - prog(f, k.back - sec(0.2), sec(0.3)));
  const { cam, majid } = hookEnd(ratio);
  const [mx, my] = toScreen(cam, ratio, [majid.x, majid.y - 300 * majid.s]);
  const cal = prog(f, k.back + sec(0.8), sec(0.35));
  const flips = prog(f, k.back + sec(0.9), sec(0.9), ease.inOut) * 2; // two pages back
  return (
    <AbsoluteFill>
      <Hook f={hf} b={hb} ratio={ratio} />
      {/* the dim, with a soft hole of light on Majid */}
      <svg width={p.w} height={p.h} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="q-hole"><stop offset="0.45" stopColor="#000" stopOpacity={spot} /><stop offset="1" stopColor="#000" stopOpacity={0} /></radialGradient>
          <mask id="q-mask"><rect width={p.w} height={p.h} fill="#FFF" /><circle cx={mx} cy={my} r={p.h * 0.36} fill="url(#q-hole)" /></mask>
        </defs>
        <rect width={p.w} height={p.h} fill={C.night} opacity={0.72 * dim} mask="url(#q-mask)" />
        {rw > 0 && rw < 1 && Array.from({ length: 9 }, (_, j) => (
          <rect key={j} x={0} y={((j * 140 + f * 22) % (p.h + 140)) - 70} width={p.w} height={6} fill={C.light} opacity={0.07} />
        ))}
        {rw > 0 && rw < 1 && <g transform={`translate(${p.w / 2} ${p.h / 2})`} opacity={Math.sin(Math.PI * rw)}>
          <circle r={74} fill="rgba(14,22,38,0.75)" stroke={C.light} strokeWidth={5} />
          <path d="M-6 -30 L-46 0 L-6 30 Z M40 -30 L0 0 L40 30 Z" fill={C.light} />
        </g>}
        {cal > 0 && <g opacity={cal} transform={`translate(${p.w / 2 - 230} ${p.h / 2 - 250})`}>
          <rect x={-14} y={-14} width={488} height={470} rx={26} fill="rgba(14,22,38,0.6)" />
          <Calendar w={460} head={C.blue} markColor={C.red} font={TITLE} title="قبل شهرين" />
          {/* the pages turning back, hinged at the header */}
          {[0, 1].map((j) => {
            const t = Math.max(0, Math.min(1, flips - j));
            if (t <= 0 || t >= 1) return null;
            return <g key={j} transform={`scale(1 ${Math.abs(Math.cos(t * Math.PI))})`} opacity={1 - t * 0.3}>
              <Calendar w={460} head={C.blue} markColor={C.red} font={TITLE} title="" />
            </g>;
          })}
        </g>}
      </svg>
      <div style={{ position: 'absolute', left: p.safe.x0, right: p.w - p.safe.x1, top: p.safe.y0 + 20 }}>
        <Title text="ليش نصرف عشان يشوفونا؟" o={q} size={p.title} />
      </div>
    </AbsoluteFill>
  );
};
