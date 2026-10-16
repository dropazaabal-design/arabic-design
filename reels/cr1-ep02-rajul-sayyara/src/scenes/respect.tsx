import React from 'react';
import { INK } from '../../../../motion-core/src/cartoon';
import { Card, Engine, Say, Seesaw, Strike, Tag } from '../graphics';
import { StageSet } from '../sets';
import { Actor, F, Frame, P, STAGE_CAM, by, type Ratio } from '../stage';
import { C, CAST } from '../theme';
import { ease, life, mix, prog, sec } from '../time';

// E5 (L5): what Housel does not say (a struck sign), what he does (the car is a cover over the
// wish for respect), and where respect comes from: three virtues outweigh an engine.
export type RespectBeats = { start: number; no: number; noEnd: number; think: number; truth: number; respect: number; from: number; v1: number; v2: number; v3: number; engine: number; end: number };

const CAR_COVER = 'M-262 -10 L-266 -92 Q-262 -104 -240 -106 L-178 -110 Q-140 -160 -96 -166 L36 -168 Q64 -166 92 -140 L118 -112 L236 -100 Q266 -94 268 -70 L266 -10 Z';

export const Respect: React.FC<{ f: number; k: RespectBeats; ratio: Ratio }> = ({ f, k, ratio }) => {
  const V = ratio !== '16x9';
  const sign = life(f, k.no - sec(0.1), k.think, sec(0.3), sec(0.4));
  const strike = prog(f, k.noEnd, sec(0.35));
  const cover = prog(f, k.think - sec(0.2), sec(0.5)); // the covered shape rises in
  const slide = prog(f, k.truth + sec(0.3), sec(0.9), ease.inOut); // the cover slides off
  const glow = prog(f, k.respect - sec(0.1), sec(0.5));
  const up = prog(f, k.from - sec(0.2), sec(0.8), ease.inOut); // respect moves up, the scale comes in
  const scaleIn = prog(f, k.from, sec(0.6));
  const vs = [k.v1, k.v2, k.v3].map((t) => prog(f, t - sec(0.1), sec(0.45), ease.back));
  const eng = prog(f, k.engine - sec(0.2), sec(0.45), ease.back);
  const tilt = mix(0, 10, vs[0]) + mix(0, 4, vs[1]) + mix(0, 4, vs[2]) - mix(0, 8, eng) + mix(0, 6, prog(f, k.engine + sec(0.5), sec(0.8), ease.inOut));
  const cx = by(ratio, 1150, 600), cy = by(ratio, 540, 470);
  const card = { x: cx, y: mix(cy - 60, by(ratio, 190, 90), up), s: mix(by(ratio, 1.5, 1.2), 1, up) };
  const ss = { x: by(ratio, 1110, 560), y: by(ratio, 620, 600), w: by(ratio, 980, 700) };
  return (
    <Frame ratio={ratio} c={STAGE_CAM[ratio]} world={<>
      <StageSet />
      {sign > 0 && <g opacity={sign} transform={`translate(${by(ratio, 960, 540)} ${by(ratio, 330, 160)})`}>
        <Card w={by(ratio, 900, 700)} h={160} o={1}><Say x={0} y={4} size={by(ratio, 76, 58)}>لا تشتري سيارة حلوة</Say></Card>
        <Strike x={0} y={0} w={by(ratio, 800, 620)} grow={strike} />
      </g>}
      {/* the wish under the car-shaped cover */}
      {cover > 0 && up < 1 && <g opacity={cover * (1 - up)} transform={`translate(${cx} ${cy + 160}) scale(${V ? 1 : 1.4})`}>
        <ellipse cx={0} cy={6} rx={300} ry={22} fill="#000" opacity={0.3} />
        <rect x={-150} y={-10} width={300} height={24} rx={8} fill="#2A3D55" stroke={INK} strokeWidth={4} />
      </g>}
      {glow > 0 && <g opacity={glow} transform={`translate(${card.x} ${card.y}) scale(${card.s})`}>
        <circle r={150 + 10 * Math.sin(f / 12)} fill={C.mint} opacity={0.12} />
        <Card w={360} h={130} o={1} fill={C.tealDeep} edge={C.mint}><Say x={0} y={4} size={56}>الاحترام</Say></Card>
      </g>}
      {cover > 0 && slide < 1 && <g opacity={cover * (1 - slide)} transform={`translate(${cx + slide * by(ratio, 1100, 800)} ${cy + 150}) rotate(${slide * 12}) scale(${V ? 1.1 : 1.6})`}>
        <path d={CAR_COVER} fill="#4A5F7A" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M-200 -60 Q-60 -30 60 -70 Q160 -100 230 -60" stroke="#6E86A3" strokeWidth={6} fill="none" opacity={0.7} />
        <circle cx={-168} cy={-14} r={36} fill="#33465C" stroke={INK} strokeWidth={4} /><circle cx={170} cy={-14} r={36} fill="#33465C" stroke={INK} strokeWidth={4} />
      </g>}
      {/* the scale: humility, kindness, empathy outweigh horsepower */}
      {scaleIn > 0 && <g opacity={scaleIn}>
        <Seesaw x={ss.x} y={ss.y} w={ss.w} tilt={tilt}
          right={<g transform="translate(0 -14)">{['تواضع', 'لطف', 'تعاطف'].map((w, j) => vs[j] > 0 && (
            <g key={w} transform={`translate(0 ${-(1 - vs[j]) * 160 - j * 76})`} opacity={Math.min(1, vs[j] * 2)}><Tag x={0} y={-36} text={w} color={C.green} size={by(ratio, 48, 40)} w={by(ratio, 240, 200)} /></g>
          ))}</g>}
          left={eng > 0 ? <g transform={`translate(0 ${-14 - (1 - eng) * 160})`} opacity={Math.min(1, eng * 2)}><Engine s={by(ratio, 1.3, 1)} /></g> : undefined} />
      </g>}
      <Actor f={f} d={{
        look: CAST.majid, id: `rs-m-${ratio}`, seed: 41, x: by(ratio, 330, 250), y: by(ratio, 1000, 1000), scale: by(ratio, 1.25, 0.72), facing: 1,
        pose: [P(0, 'stand', { headTurn: 0.4 }), P(k.think, 'stand', { headTurn: 0.8, headTilt: -6 }, 14), P(k.truth + sec(0.5), 'stand', { headTurn: 0.8, lean: -3 }, 12),
          P(k.respect + sec(0.4), 'think', { headTurn: 0.6 }, 14), P(k.v3, 'stand', { headTurn: 0.8 }, 14), P(k.engine + sec(0.6), 'shrug', { headTurn: 0.6 }, 14)],
        face: [F(0, 'calm', { gx: 1 }), F(k.no, 'calm', { gx: 1, gy: -0.6 }), F(k.think, 'dreamy', { gx: 1 }, 14), F(k.truth + sec(0.4), 'surprised', { gx: 1 }, 8),
          F(k.respect + sec(0.4), 'thinking', {}, 12), F(k.v1, 'calm', { gx: 1, gy: -0.2 }, 12), F(k.engine + sec(0.6), 'smile', { gx: 1 }, 14)],
      }} />
    </>} />
  );
};
