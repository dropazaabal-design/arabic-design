import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EXPRESSIONS, ease, faceAt, k, mixPose, pose, settle, type Pose, type V } from './kit';
import { B } from './look';
import { Card, STAMP_FOOT, StampTool } from './props';
import { OFFICE, STAMP_HOME, STAMP_S } from './sets';
import { OfficeScene, fistAt, fistOff, grab, type Cam } from './stage';
import { STAND_CARD } from './props';

// The hardest move first (CR1 practice): a card drops onto the stand, his eyes go to it before his head, he reads,
// reaches for the stamp, lifts it, stamps the card, puts the stamp back and lets go. 4 s at 60 fps.
const P = OFFICE.naif;
const CARD: V = [OFFICE.stand[0] + STAND_CARD.dx, OFFICE.stand[1] + STAND_CARD.dy];
const REST = pose({ lean: 2, turn: 0.3, body: 0.35, head: 0, R: { sh: -8, el: 14 }, L: { sh: 12, el: 34 }, footR: [-13, 0], footL: [13, 0] });
const READ = pose({ ...REST, lean: 8, turn: 0.62, body: 0.5, head: 10 });

export const stampMove = (f: number, t0: number) => {
  // keys (frames after t0): reach, contact, lift over the card, press, lift, back over the pad, put down, release
  const T = { reach: 0, take: 16, over: 38, press: 46, up: 58, back: 80, put: 90, free: 112 };
  const s = f - t0;
  const above: V = [CARD[0] - 30, CARD[1] - 120];
  const onCard: V = [CARD[0] - 30, CARD[1] + 20 - (STAMP_FOOT) * STAMP_S];
  const hover: V = [STAMP_HOME[0], STAMP_HOME[1] - 40];
  const path: [number, V][] = [[T.take, STAMP_HOME], [T.over, above], [T.press, onCard], [T.up, above], [T.back, hover], [T.put, STAMP_HOME]];
  let q: V = STAMP_HOME;
  if (s >= T.take) {
    q = path[path.length - 1][1];
    for (let i = 1; i < path.length; i++) {
      if (s <= path[i][0]) { const [a, qa] = path[i - 1], [b, qb] = path[i]; const u = ease.inOut((s - a) / (b - a)); q = [qa[0] + (qb[0] - qa[0]) * u, qa[1] + (qb[1] - qa[1]) * u]; break; }
    }
  }
  const holding = s >= T.take && s < T.put;
  const base = mixPose(REST, READ, k(s, [[T.reach - 10, 1], [T.take, 0.7], [T.press, 1], [T.back, 0.5]]));
  const g = grab(P, base, 'L', q, -1);
  const reachIn = k(s, [[T.reach - 6, 0], [T.take, 1], [T.put, 1], [T.free, 0]]);
  const p: Pose = mixPose(base, g.p, reachIn);
  return { p, holding, imprint: k(s, [[T.press - 1, 0], [T.press + 10, 1]], ease.lin), off: fistOff(P, p, 'L'), stampAt: holding ? fistAt(P, p, 'L') : null, T };
};

export const Test: React.FC = () => {
  const f = useCurrentFrame();
  const cam: Cam = { x: 640, y: 1000, z: 1.35 };
  const drop = settle(f, 14, 11);
  const cardY = f < 14 ? -999 : k(f, [[14, OFFICE.chute[1] + 30], [30, CARD[1]]], ease.in);
  const cardX = k(f, [[14, OFFICE.chute[0]], [30, CARD[0]]], ease.out);
  const sm = stampMove(f, 100);
  const look: [number, number] = f < 20 ? [0.2, 0] : f < 96 ? [0.9, 0.35] : [0.6, 0.55];
  const face = faceAt(f, [[0, EXPRESSIONS.neutral], [20, { ...EXPRESSIONS.listening, look }, 6], [40, { ...EXPRESSIONS.determined, look: [0.8, 0.4] }, 10], [96, { ...EXPRESSIONS.determined, look: [0.6, 0.6] }, 8], [210, EXPRESSIONS.smile, 12]]);
  const p = f < 100 ? mixPose(REST, READ, k(f, [[26, 0], [44, 1]])) : sm.p;
  const nod = f > 60 && f < 84 ? Math.sin(((f - 60) / 24) * Math.PI) * 6 : 0;
  return (
    <AbsoluteFill style={{ background: B.mist }}>
      <OfficeScene cam={cam} st={{ stampHome: !sm.holding, chutePuff: k(f, [[8, 0], [14, 1], [26, 0]]) }}
        naif={{ f, p: { ...p, head: p.head + nod }, face, hands: { R: 'relaxed', L: sm.holding || (f - 100 > sm.T.take - 4 && f - 100 < sm.T.put + 4) ? 'grip' : 'relaxed' },
          hold: sm.holding ? { L: <g transform={`translate(${sm.off[0]} ${sm.off[1]})`}><StampTool /></g> } : undefined, upright: { L: true } }}
        cards={f >= 14 && <g transform={`translate(${cardX} ${cardY + (1 - drop) * 0}) rotate(${(1 - drop) * 8})`}><Card text="ليش ما رديت على رسالتي؟" stamp={{ text: 'قيد المعالجة', color: B.blue, p: f >= 100 ? sm.imprint : 0 }} /></g>} />
    </AbsoluteFill>
  );
};
