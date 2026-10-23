import React from 'react';
import { BODY, COLORS, TEXT, TINT } from './config';
import { ease, kf, mix, p } from './motion';
import { Stickman, type StickPose } from './parts';
import { S, w } from './timing';
import { Words } from './type';

// Scenes 1–2. A bookmark that stopped; the camera pulls back to the books waiting with their «لاحقًا» cards and a
// figure who reaches for one and hesitates. Then the pile withdraws, the bookmark straightens into a blue line, and
// the line draws a way forward to the point the product comes out of (scene 3).

type Book = { x: number; y: number; w: number; h: number; fill: string; depth: number; d: number }; // depth: parallax 0..1, d: withdraw delay
const BOOKS: Book[] = [
  // the lying stack
  { x: 430, y: 1012, w: 360, h: 68, fill: TINT.navyLift2, depth: 1, d: 10 },
  { x: 455, y: 952, w: 318, h: 60, fill: '#163B61', depth: 1, d: 6 },
  { x: 444, y: 884, w: 330, h: 68, fill: TINT.navyLift, depth: 1, d: 3 },
  { x: 470, y: 826, w: 320, h: 58, fill: '#1A4570', depth: 1, d: 0 }, // the book with the bookmark
  // upright, left and right of the stack
  { x: 340, y: 830, w: 48, h: 250, fill: '#163B61', depth: 0.8, d: 8 },
  { x: 392, y: 796, w: 38, h: 284, fill: TINT.navyLift2, depth: 0.8, d: 12 },
  { x: 815, y: 790, w: 50, h: 290, fill: TINT.navyLift2, depth: 0.8, d: 5 },
  { x: 869, y: 826, w: 42, h: 254, fill: '#1A4570', depth: 0.8, d: 14 },
];
const CARDS = [
  { cx: 840, cy: 764, r: -6, d: 2 }, // out of the tall right book
  { cx: 411, cy: 772, r: 8, d: 6 }, // out of the tall left book
  { cx: 724, cy: 1046, r: -3, d: 0 }, // dropped in front of the stack
];
const RIBBON = { x: 700, top: 870, bottom: 986, half: 15 };
/** The shelf is drawn in its own units and placed 1.3× larger on the board, its foot (540, 1080) at (460, 1000). */
const BASE = { s: 1.3, x: 460, y: 1000 };
const base = `translate(${BASE.x}px, ${BASE.y}px) scale(${BASE.s}) translate(-540px, -1080px)`;
const toBoard = (x: number, y: number): [number, number] => [BASE.x + (x - 540) * BASE.s, BASE.y + (y - 1080) * BASE.s];
/** The line the bookmark becomes: out of the ribbon, one wave leftward (the way Arabic reads), rising at its end. */
export const PATH = 'M700 986.2 C700 1064.6 586.2 1080 516.9 1026.2 C447.7 964.6 363.1 972.3 332.3 918.5';
const END: [number, number] = [332.3, 918.5];
export const PATH_END = toBoard(...END); // (190, 790) on the board: the covers come out of this point
const FOCUS = toBoard(712, 893); // the stopped bookmark, framed so the «لاحقًا» card stays below the question

const stickPose = (f: number): { x: number; pose: StickPose } => {
  const walk0 = 34, walk1 = 116, reach = 124, hold = 150, back = 170;
  const x = kf(f, [[walk0, 168], [walk1, 252]], ease.inOut);
  const amp = Math.min(p(f, walk0, 10), 1 - p(f, walk1 - 10, 12));
  const ph = ((f - walk0) / 8.5);
  const s = Math.sin(ph) * amp;
  const walkPose: StickPose = {
    lean: 3 * amp, head: 0,
    armR: [-16 * s + 6, -8 * s + 10], armL: [16 * s - 6, 8 * s - 2],
    legR: [20 * s, 20 * s + 10 * Math.max(0, Math.cos(ph)) * amp], legL: [-20 * s, -20 * s + 10 * Math.max(0, -Math.cos(ph)) * amp],
  };
  const r = p(f, reach, 24, ease.out) * (1 - 0.62 * p(f, back, 34, ease.inOut));
  const doubt = p(f, back - 6, 30, ease.inOut);
  return {
    x,
    pose: {
      lean: mix(walkPose.lean, 6, r) - 5 * doubt, head: -12 * doubt,
      armR: [mix(walkPose.armR[0], 74, r), mix(walkPose.armR[1], 86, r)],
      armL: [walkPose.armL[0] - 6 * doubt, walkPose.armL[1] + 14 * doubt],
      legR: walkPose.legR, legL: walkPose.legL,
    },
  };
};

export const Shelf: React.FC<{ f: number }> = ({ f }) => {
  if (f > S.s3 + 30) return null;
  const s2 = S.s2;
  // camera: a close-up on the stopped bookmark pulls back to the whole shelf; scene 2 leans in a little
  const z = kf(f, [[0, 1.9], [12, 1.9], [104, 1], [s2, 1], [S.s3, 1.06]], ease.inOut);
  const cx = kf(f, [[12, FOCUS[0]], [104, 540]], ease.inOut), cy = kf(f, [[12, FOCUS[1]], [104, 675]], ease.inOut);
  const cam = (depth: number) => {
    const zz = 1 + (z - 1) * depth;
    const ccx = mix(540, cx, depth), ccy = mix(675, cy, depth);
    return `translate(540px, 675px) scale(${zz}) translate(${-ccx}px, ${-ccy}px) ${base}`;
  };
  const gone = (d: number, depth: number) => p(f, s2 + 6 + d, 28, ease.in) * (0.75 + 0.25 * depth);
  const stick = stickPose(f);
  const stickOut = p(f, s2, 22, ease.in);
  const morph = p(f, s2 + 22, 26, ease.inOut); // ribbon → line
  const draw = p(f, s2 + 46, 116, ease.inOut); // the line draws forward
  const pathOut = p(f, S.s3 + 6, 22, ease.in);
  const r = RIBBON, hw = mix(r.half, 4, morph), notch = mix(20, 0, morph);
  const ribbonColor = morph < 0.5 ? COLORS.green : COLORS.blue;
  const tip = tipAt(draw);
  return (
    <>
      {/* far layer: the shelf's frame, moving less than the books (parallax) */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1350, transformOrigin: '0 0', transform: cam(0.55), opacity: 1 - p(f, s2, 30) }}>
        <svg width={1080} height={1350} style={{ overflow: 'visible' }}>
          <rect x={150} y={640} width={780} height={452} rx={18} fill="none" stroke={TINT.line} strokeWidth={3} />
          <line x1={150} x2={930} y1={1092} y2={1092} stroke={TINT.line} strokeWidth={6} />
        </svg>
      </div>
      {/* the shelf: books, «لاحقًا» cards, the figure */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1350, transformOrigin: '0 0', transform: cam(1) }}>
        {CARDS.slice(0, 2).map((c, k) => <Later key={k} {...c} f={f} out={gone(c.d, 1)} />)}
        <svg width={1080} height={1350} style={{ position: 'absolute', overflow: 'visible' }}>
          <line x1={120} x2={960} y1={1080} y2={1080} stroke={TINT.dim} strokeWidth={4} opacity={1 - p(f, s2, 20)} strokeLinecap="round" />
          {BOOKS.map((b, k) => {
            const g = gone(b.d, b.depth);
            if (g >= 1) return null;
            return (
              <g key={k} opacity={1 - g} transform={`translate(0 ${g * 260 * b.depth})`}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={6} fill={b.fill} stroke={TINT.line} strokeWidth={2.5} />
                {b.w > b.h
                  ? <><line x1={b.x + 18} x2={b.x + 18} y1={b.y + 8} y2={b.y + b.h - 8} stroke={TINT.line} strokeWidth={3} /><line x1={b.x + b.w - 30} x2={b.x + b.w - 70} y1={b.y + b.h / 2} y2={b.y + b.h / 2} stroke={TINT.dim} strokeWidth={4} strokeLinecap="round" opacity={0.5} /></>
                  : <><line x1={b.x + 8} x2={b.x + b.w - 8} y1={b.y + 26} y2={b.y + 26} stroke={TINT.line} strokeWidth={3} /><line x1={b.x + 8} x2={b.x + b.w - 8} y1={b.y + b.h - 26} y2={b.y + b.h - 26} stroke={TINT.line} strokeWidth={3} /></>}
              </g>
            );
          })}
        </svg>
        <Later {...CARDS[2]} f={f} out={gone(CARDS[2].d, 1)} />
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translateX(${-60 * stickOut}px)` }}>
          <Stickman x={stick.x} foot={1080} pose={stick.pose} o={1 - stickOut} />
        </div>
        {/* the bookmark, then the line it becomes */}
        <svg width={1080} height={1350} style={{ position: 'absolute', overflow: 'visible' }}>
          {draw > 0 && (
            <path d={PATH} fill="none" stroke={COLORS.blue} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} opacity={1 - pathOut} />
          )}
          <path d={`M${r.x - hw} ${r.top} H${r.x + hw} V${r.bottom} L${r.x} ${r.bottom - notch} L${r.x - hw} ${r.bottom} Z`} fill={ribbonColor} opacity={1 - pathOut} />
          {draw > 0 && draw < 1 && <circle cx={tip[0]} cy={tip[1]} r={11} fill={COLORS.blue} />}
          {draw >= 1 && <circle cx={END[0]} cy={END[1]} r={mix(11, 0, pathOut)} fill={COLORS.blue} />}
        </svg>
      </div>
      {/* the question (scene 1), then the turn (scene 2) */}
      <Words f={f} text={TEXT.s1[0]} at={-20} top={118} size={86} out={s2 - 4} />
      <Words f={f} text={TEXT.s1[1]} at={w(1, 3) - 6} top={226} size={86} out={s2 - 2} hi={{ 2: COLORS.blue }} />
      <Words f={f} text={TEXT.s2[0]} at={s2 + 8} top={118} size={86} out={S.s3 - 6} />
      <Words f={f} text={TEXT.s2[1]} at={w(2, 2) - 4} top={226} size={86} out={S.s3 - 4} hi={{ 2: COLORS.green }} />
    </>
  );
};

/** A «لاحقًا» card: lifts away when the pile withdraws. */
const Later: React.FC<{ cx: number; cy: number; r: number; f: number; out: number }> = ({ cx, cy, r, out }) => {
  if (out >= 1) return null;
  return (
    <div style={{ position: 'absolute', left: cx - 78, top: cy - 33, width: 156, height: 66, transform: `translateY(${-230 * out}px) rotate(${r + 24 * out}deg)`, opacity: 1 - out, background: COLORS.white, borderRadius: 12, boxShadow: '0 8px 18px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: COLORS.navy, lineHeight: 1 }}>{TEXT.later}</div>
    </div>
  );
};

// The drawing tip of PATH, sampled once (the path is fixed) so the dot rides the line exactly.
let samples: [number, number][] | null = null;
const tipAt = (t: number): [number, number] => {
  if (!samples) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', PATH);
    const L = el.getTotalLength();
    samples = Array.from({ length: 201 }, (_, i) => { const q = el.getPointAtLength((L * i) / 200); return [q.x, q.y]; });
  }
  const k = Math.min(200, Math.max(0, t * 200)), i = Math.floor(k), u = k - i;
  const a = samples[i], b = samples[Math.min(200, i + 1)];
  return [mix(a[0], b[0], u), mix(a[1], b[1], u)];
};
