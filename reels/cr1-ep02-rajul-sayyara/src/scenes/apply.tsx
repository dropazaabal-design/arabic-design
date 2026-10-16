import React from 'react';
import { Bubble, INK, Person, face, pose } from '../../../../motion-core/src/cartoon';
import { Card, Months, Say, Tag, Watch } from '../graphics';
import { StageSet } from '../sets';
import { Actor, F, Frame, P, STAGE_CAM, by, camMix, type Cam, type Ratio } from '../stage';
import { TITLE } from '../fonts';
import { C, CAST, PROFILES } from '../theme';
import { ease, life, mix, prog, sec } from '../time';

// E10 (L10) and R6: the test before a big purchase. Majid at a shop window with a watch, people
// around. If nobody would see it, would he still buy it? The people fade away one by one. Yes:
// enjoy it, it is yours. No: you pay an audience busy picturing itself. Then a second question
// (how many months could you live if income stopped?) and the question to the viewer.
export type ApplyBeats = {
  start: number; nobody: number; nobody2: number; yes?: number; no?: number; audience?: number; months?: number; small?: number; you: number; end: number;
};

const SHOP_X = 1120, GROUND_Y = 930;

const Shop: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={-800} y={-600} width={3600} height={1500} fill="#2B4561" />
    <rect x={-800} y={GROUND_Y - 20} width={3600} height={600} fill="#33506E" />
    <rect x={-800} y={GROUND_Y - 24} width={3600} height={10} fill="#4C6B8A" stroke={INK} strokeWidth={3} />
    <g transform={`translate(${SHOP_X} 0)`}>
      <rect x={-420} y={180} width={840} height={GROUND_Y - 200} fill="#20354C" stroke={INK} strokeWidth={6} />
      <rect x={-460} y={140} width={920} height={60} rx={10} fill={C.plumDeep} stroke={INK} strokeWidth={5} />
      <rect x={-380} y={240} width={760} height={520} rx={8} fill="#BFD9EA" opacity={0.92} stroke={INK} strokeWidth={5} />
      <path d="M-330 260 L-250 260 L-370 520 L-380 520 L-380 360 Z" fill="#FFFFFF" opacity={0.25} />
      {/* the display stand and the watch on it */}
      <path d="M-90 640 L90 640 L70 560 L-70 560 Z" fill="#4E3468" stroke={INK} strokeWidth={4} />
      <g transform="translate(0 470)"><circle r={110} fill="#F5FBFF" opacity={0.25 + 0.08 * Math.sin(f / 12)} /><Watch scale={0.8} /></g>
      <rect x={-420} y={GROUND_Y - 30} width={840} height={20} fill="#4C6B8A" stroke={INK} strokeWidth={4} />
    </g>
  </g>
);

export const Apply: React.FC<{ f: number; k: ApplyBeats; ratio: Ratio }> = ({ f, k, ratio }) => {
  const stageAt = k.months ?? k.you - sec(0.2);
  if (f >= stageAt) return <Questions f={f} k={k} ratio={ratio} />;
  const gone1 = prog(f, k.nobody, sec(0.5)), gone2 = prog(f, k.nobody2, sec(0.5));
  const back = k.audience !== undefined ? prog(f, k.audience - sec(0.4), sec(0.5)) : 0;
  const yes = k.yes !== undefined ? life(f, k.yes, k.no ?? k.end, sec(0.3), sec(0.3)) : 0;
  const q = life(f, k.nobody - sec(0.2), k.yes ?? k.you, sec(0.4), sec(0.3));
  const base: Cam = by(ratio, { x: 1000, y: 560, z: 1.05 }, { x: 1100, y: 600, z: 1.05 }, { x: 1100, y: 600, z: 0.95 });
  const near: Cam = by(ratio, { x: 940, y: 560, z: 1.3 }, { x: 1060, y: 620, z: 1.25 }, { x: 1060, y: 620, z: 1.12 });
  const c = camMix(base, near, prog(f, k.nobody, sec(1.6), ease.inOut) * (1 - back));
  const crowd: { w: keyof typeof CAST; x: number; o: number }[] = [
    { w: 'noura', x: by(ratio, 300, 690), o: Math.max(1 - gone1, back) }, { w: 'elder', x: by(ratio, 1720, 1500), o: Math.max(1 - gone2, back) },
  ];
  const mx = by(ratio, 860, 960);
  return (
    <Frame ratio={ratio} c={c} overlay={q > 0 && ratio === '16x9' && <Question o={q} ratio={ratio} />} world={<>
      <Shop f={f} />
      {crowd.map((p, j) => p.o > 0 && <Actor key={p.w} f={f} d={{ look: CAST[p.w], id: `ap-${p.w}-${ratio}`, seed: 80 + j, x: p.x, y: GROUND_Y + 20, scale: 0.92, facing: p.x < mx ? 1 : -1, o: p.o,
        pose: [P(0, 'stand', { headTurn: 0.6 }), ...(k.audience !== undefined ? [P(k.audience, j ? 'cross' : 'stand', { headTurn: 0.4, headTilt: -6 }, 12)] : [])],
        face: [F(0, 'calm', { gx: 1 }), F(k.start + sec(0.6), 'surprised', { gx: 1 }, 10), F(k.start + sec(1.4), 'smile', { gx: 1 }, 12),
          ...(k.audience !== undefined ? [F(k.audience, 'dreamy', {}, 14)] : [])] }} />)}
      <Actor f={f} d={{ look: CAST.majid, id: `ap-m-${ratio}`, seed: 82, x: mx, y: GROUND_Y + 30, scale: 1, facing: 1,
        pose: [P(0, 'stand', { headTurn: 0.8 }), P(k.nobody, 'think', { headTurn: 0.6 }, 14), ...(k.yes !== undefined ? [P(k.yes, 'stand', { headTurn: 0.8 }, 12)] : []),
          ...(k.no !== undefined ? [P(k.no, 'shrug', { headTurn: 0.3 }, 14)] : [])],
        face: [F(0, 'dreamy', { gx: 1 }), F(k.nobody, 'thinking', {}, 12), ...(k.yes !== undefined ? [F(k.yes, 'smile', { gx: 1 }, 12)] : []),
          ...(k.no !== undefined ? [F(k.no, 'calm', { gx: -1 }, 12)] : [])] }} />
      {yes > 0 && <Tag x={SHOP_X} y={240} text="استمتع" color={C.green} size={46} o={yes} />}
      {/* the audience, each one picturing themselves */}
      {back > 0 && crowd.map((p, j) => (
        <Bubble key={j} id={`ap-b-${j}-${ratio}`} x={p.x + (j ? -60 : 60)} y={360} w={240} h={180} tail={[p.x, GROUND_Y - 370]} pop={prog(f, k.audience! + j * sec(0.2), sec(0.5), ease.back)}>
          <Person id={`ap-bp-${j}-${ratio}`} look={CAST[p.w]} pose={pose('proud')} face={face('proud')} y={90} scale={0.34} />
          <g transform="translate(70 -30)"><Watch scale={0.25} /></g>
        </Bubble>
      ))}
    </>} />
  );
};

/** The test question, in screen space so the camera never crops it. */
const Question: React.FC<{ o: number; ratio: Ratio }> = ({ o, ratio }) => {
  const P = PROFILES[ratio];
  return (
    <div style={{ position: 'absolute', left: P.safe.x0, right: P.w - P.safe.x1, top: P.safe.y0 + (ratio === '16x9' ? 10 : 70), display: 'flex', justifyContent: 'center', opacity: o }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: P.title * (ratio === '16x9' ? 0.72 : 0.62), lineHeight: 1.35, color: C.light, textAlign: 'center',
        background: 'rgba(14,22,38,0.88)', border: `3px solid ${C.mist}`, borderRadius: 28, padding: '0.2em 0.8em 0.32em', transform: `translateY(${(1 - o) * 16}px)`, textWrap: 'balance' } as React.CSSProperties}>
        لو ما أحد بيشوفه… كنت بتشتريه؟
      </div>
    </div>
  );
};

const Questions: React.FC<{ f: number; k: ApplyBeats; ratio: Ratio }> = ({ f, k, ratio }) => {
  const m = k.months !== undefined ? life(f, k.months - sec(0.2), k.you - sec(0.2)) : 0;
  const count = k.months !== undefined ? prog(f, k.months + sec(0.6), sec(2.2), ease.inOut) * 3 : 0;
  const small = k.small !== undefined ? prog(f, k.small, sec(0.6)) : 0;
  const you = prog(f, k.you - sec(0.1), sec(0.5), ease.back);
  const cell = by(ratio, 100, 64);
  const gx = by(ratio, 960, 540) - 6 * cell;
  return (
    <Frame ratio={ratio} c={STAGE_CAM[ratio]} world={<>
      <StageSet />
      {m > 0 && <g opacity={m}>
        <Say x={by(ratio, 960, 540)} y={by(ratio, 260, 220)} size={by(ratio, 92, 80)} title>كم شهر؟</Say>
        <Months x={gx} y={by(ratio, 430, 420)} cell={cell} rows={1} filled={count} color={C.green} />
        {small > 0 && <g transform={`translate(${gx + cell * 12 - cell * 1.5} ${by(ratio, 430, 420) + cell + 80})`} opacity={small}>
          <circle r={70} fill={C.green} opacity={0.18 + 0.08 * Math.sin(f / 9)} />
          <Say x={0} y={4} size={80} title color={C.light}>3</Say>
        </g>}
        <g transform={`translate(${by(ratio, 960, 540)} ${by(ratio, 880, 900)})`} opacity={small}>
          <rect x={-70} y={-200} width={140} height={200} fill="#E3F6F2" stroke={INK} strokeWidth={5} />
          <rect x={-70} y={-200} width={140} height={200} fill={C.mint} opacity={0.4} />
          <rect x={-70} y={-200} width={mix(140, 90, small)} height={200} fill="#3B5D7C" stroke={INK} strokeWidth={5} />
        </g>
      </g>}
      {you > 0 && <g transform={`translate(${by(ratio, 960, 540)} ${by(ratio, 500, 470)}) scale(${mix(0.85, 1, you) * by(ratio, 1.35, 1) * (1 + 0.012 * Math.sin(f / 22))})`} opacity={Math.min(1, you)}>
        <Card w={by(ratio, 620, 600)} h={by(ratio, 300, 300)} o={1} fill={C.tealDeep} edge={C.mint}>
          <Say x={0} y={-30} size={110} title>وأنت؟</Say>
          <g transform="translate(0 90)">
            <path d="M-60 -34 Q-60 -54 -40 -54 L40 -54 Q60 -54 60 -34 L60 4 Q60 24 40 24 L-6 24 L-30 46 L-28 24 L-40 24 Q-60 24 -60 4 Z" fill={C.light} stroke={INK} strokeWidth={4} />
            {/* someone is typing an answer */}
            {[-24, 0, 24].map((x, j) => <circle key={x} cx={x} cy={-15 - 5 * Math.max(0, Math.sin(f / 7 - j * 0.9))} r={7} fill={INK} />)}
          </g>
        </Card>
      </g>}
    </>} />
  );
};
