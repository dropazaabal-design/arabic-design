import React from 'react';
import { Car, INK, Jar } from '../../../../motion-core/src/cartoon';
import { Bar, Card, Say, Strike, Tag } from '../graphics';
import { StageSet } from '../sets';
import { Actor, F, Frame, P, STAGE_CAM, by, type Ratio } from '../stage';
import { C, CAST } from '../theme';
import { ease, life, mix, prog, sec } from '../time';

// E9 (L9) and R5: the limits. Some incomes barely cover rent and food — there the problem is the
// income, not the car. A fine car can sit on real wealth, an old car on none. The car says
// nothing; the point is not to be stingy, it is to know who you spend for.
export type LimitsBeats = {
  start: number; pause?: number; income?: number; rent?: number; food?: number; notCar?: number; incomeIs?: number;
  rich: number; richHas: number; poor: number; poorHas: number; says?: number; stingy?: number; who: number; end: number;
};

const Pause: React.FC<{ o: number }> = ({ o }) => (
  <g opacity={o} transform={`scale(${mix(0.8, 1, o)})`}>
    <circle r={90} fill="rgba(14,22,38,0.85)" stroke={C.red} strokeWidth={7} />
    <rect x={-34} y={-42} width={22} height={84} rx={6} fill={C.light} /><rect x={12} y={-42} width={22} height={84} rx={6} fill={C.light} />
  </g>
);

export const Limits: React.FC<{ f: number; k: LimitsBeats; ratio: Ratio; reel?: boolean }> = ({ f, k, ratio, reel = false }) => {
  const cardsAt = k.rich - sec(0.5);
  const whoO = prog(f, k.who - sec(0.1), sec(0.5));
  if (k.income !== undefined && f < cardsAt) {
    const pause = life(f, k.pause! - sec(0.1), k.income - sec(0.2), sec(0.3), sec(0.3));
    const barIn = prog(f, k.income - sec(0.2), sec(0.5));
    const rent = prog(f, k.rent!, sec(0.5), ease.out), food = prog(f, k.food!, sec(0.5), ease.out);
    const car = life(f, k.notCar! - sec(0.3), k.incomeIs! + sec(0.2));
    const hi = prog(f, k.incomeIs!, sec(0.4));
    const bx = by(ratio, 460, 140), bw = by(ratio, 1000, 800), byy = by(ratio, 430, 380);
    return (
      <Frame ratio={ratio} c={STAGE_CAM[ratio]} world={<>
        <StageSet />
        {pause > 0 && <g transform={`translate(${by(ratio, 960, 540)} ${by(ratio, 480, 460)})`}><Pause o={pause} /></g>}
        {barIn > 0 && <g opacity={barIn}>
          <Say x={by(ratio, bx + bw + 100, 540)} y={by(ratio, byy + 50, byy - 50)} size={42} color={C.mist}>الدخل</Say>
          <Bar x={bx} y={byy} w={bw} h={100} labelSize={40} segs={[{ frac: 0.62, color: '#3E6C8F', label: 'الإيجار', grow: rent }, { frac: 0.38, color: '#4E7A6F', label: 'الأكل', grow: food }]} />
          {hi > 0 && <rect x={bx - 10} y={byy - 10} width={bw + 20} height={120} rx={30} fill="none" stroke={C.red} strokeWidth={7} opacity={hi} />}
        </g>}
        {car > 0 && <g opacity={car} transform={`translate(${by(ratio, 960, 540)} ${byy + by(ratio, 330, 330)})`}>
          <Car id={`li-c-${ratio}`} kind="old" color={C.oldCar} shade={C.oldCarShade} glass={C.glass} scale={0.55} />
          <Strike x={0} y={-50} w={320} grow={prog(f, k.notCar!, sec(0.35))} />
        </g>}
        <Actor f={f} d={{ look: CAST.noura, id: `li-n-${ratio}`, seed: 71, x: by(ratio, 300, 250), y: by(ratio, 930, 1000), scale: by(ratio, 0.95, 0.72), facing: 1, o: barIn,
          pose: [P(0, 'stand', { headTurn: 0.6 }), P(k.rent!, 'think', { headTurn: 0.5 }, 14)], face: [F(0, 'calm', { gx: 1, gy: -0.4 }), F(k.food!, 'worried', { gx: 1, gy: -0.4 }, 16)] }} />
      </>} />
    );
  }
  // two cards: a fine car and an old one, and what is (or is not) behind each
  const a = prog(f, k.rich - sec(0.3), sec(0.5), ease.back), b = prog(f, k.poor - sec(0.3), sec(0.5), ease.back);
  const hasA = prog(f, k.richHas, sec(0.5)), hasB = prog(f, k.poorHas, sec(0.5));
  const q = k.says !== undefined ? prog(f, k.says, sec(0.5), ease.inOut) : 0;
  const up = prog(f, k.who - sec(0.4), sec(0.6), ease.inOut);
  const cw = by(ratio, 620, 680), ch = by(ratio, 560, 400);
  const A = by(ratio, { x: 1310, y: 520 }, { x: 540, y: 260 }), B = by(ratio, { x: 610, y: 520 }, { x: 540, y: 700 });
  const shrink = mix(1, by(ratio, 0.8, 0.82), up), lift = up * by(ratio, -40, -60);
  const cardBody = (p: { x: number; y: number }, o: number, rich: boolean, has: number) => o > 0 && (
    <g transform={`translate(${p.x} ${p.y + lift}) scale(${shrink})`}>
      <Card w={cw} h={ch} o={Math.min(1, o)}>
        <g opacity={1 - q}>
          <Car id={`li-${rich ? 'r' : 'p'}-${ratio}`} kind={rich ? 'new' : 'old'} color={rich ? '#3C5A8C' : C.oldCar} shade={rich ? '#2B4470' : C.oldCarShade} glass={C.glass}
            x={by(ratio, 0, -110)} y={by(ratio, -10, 80)} scale={by(ratio, 0.95, 0.72)} shine={rich ? ((f - k.rich) % sec(2.5)) / sec(1.1) : -1} />
        </g>
        {q > 0 && <Say x={by(ratio, 0, -120)} y={by(ratio, -90, 0)} size={150} o={q} color={C.mist}>؟</Say>}
        {reel ? <g>
          <Tag x={by(ratio, 0, 190)} y={by(ratio, 170, 10)} text={rich ? 'دين' : 'ثروة'} color={C.mist} solid={false} size={52} o={has} />
          <Strike x={by(ratio, 0, 190)} y={by(ratio, 170, 10)} w={150} grow={prog(f, (rich ? k.richHas : k.poorHas) + sec(0.5), sec(0.35))} />
        </g> : <g transform={`translate(${by(ratio, 0, 200)} ${by(ratio, 250, 110)}) scale(${by(ratio, 1.05, 0.65)})`} opacity={has}>
          <Jar id={`li-j-${rich ? 'r' : 'p'}-${ratio}`} level={rich ? 0.85 : 0.04} note={C.mint} noteShade={C.teal} />
        </g>}
      </Card>
    </g>
  );
  const stingy = k.stingy !== undefined ? life(f, k.stingy - sec(0.6), k.who - sec(0.2)) : 0;
  return (
    <Frame ratio={ratio} c={STAGE_CAM[ratio]} world={<>
      <StageSet />
      {cardBody(A, a, true, hasA)}
      {cardBody(B, b, false, hasB)}
      {stingy > 0 && <g opacity={stingy} transform={`translate(${by(ratio, 960, 540)} ${by(ratio, 930, 960)})`}>
        <Tag x={0} y={0} text="بخيل" color={C.mist} size={56} solid={false} />
        <Strike x={0} y={0} w={240} grow={prog(f, k.stingy!, sec(0.35))} />
      </g>}
      {whoO > 0 && <g opacity={whoO} transform={`translate(${by(ratio, 960, 540)} ${by(ratio, 930, 960)}) scale(${mix(0.85, 1, whoO) * by(ratio, 1.3, 1)})`}>
        <rect x={by(ratio, -300, -300)} y={-70} width={600} height={140} rx={70} fill={C.tealDeep} stroke={INK} strokeWidth={5} />
        <Say x={0} y={4} size={64} title>لمين تصرف؟</Say>
      </g>}
    </>} />
  );
};
