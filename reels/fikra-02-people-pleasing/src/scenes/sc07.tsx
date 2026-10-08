import React from 'react';
import { MsgBubble, Pill, Wave } from '../art/world';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Headline } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneStart, useEpisodeFrame, wordAt } from '../time';

// sc07 — after the reply. A red line wobbles (discomfort) while the other side is typing; the answer is
// simple and the line settles. A clear reply doesn't buy everyone's approval — it makes the decision
// yours. Then the calm line slides down and becomes the track of practice: small requests first, as
// steps that grow, and a bar that fills slowly.
const TRACK_Y = 950, TX0 = 1560, TX1 = 360;

/** A request with no words: a bubble with two grey lines. */
const Req: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <MsgBubble x={0} y={0} text="" w={300} size={50} />
    <rect x={-110} y={-22} width={220} height={16} rx={8} fill={C.line} />
    <rect x={-20} y={8} width={130} height={16} rx={8} fill={C.line} />
  </g>
);

export const SC07: React.FC = () => {
  const f = useEpisodeFrame();
  const start = sceneStart('sc07');
  const b = {
    feel: wordAt('s35', 'تشعر'), un: wordAt('s35', 'عدم'), may: wordAt('s35', 'وقد', 1), upset: wordAt('s35', 'ينزعج'),
    reply: wordAt('s36', 'يرد'), ok: wordAt('s36', 'تمام'),
    clear: wordAt('s37', 'الرد'), no: wordAt('s37', 'لا'), but: wordAt('s37', 'لكنه'), yours: wordAt('s37', 'قرارك', 1),
    begin: wordAt('s38', 'ابدأ'), req: wordAt('s38', 'بالطلبات'), small: wordAt('s38', 'الصغيرة'), where: wordAt('s38', 'حيث'), cost: wordAt('s38', 'يكلف'),
    skill: wordAt('s38', 'فالمهارة'), time: wordAt('s38', 'وقتا'), train: wordAt('s38', 'وتدريبا'),
  };
  const t = (f - start) / 60;
  // part A — discomfort, then a simple answer
  const wave = prog(f, b.feel - sec(0.1), sec(0.9), ease.inOut);
  const calm = prog(f, b.ok - sec(0.1), sec(1.2), ease.inOut);
  const typing = prog(f, b.may - sec(0.1), sec(0.3), ease.out);
  const answered = prog(f, b.ok - sec(0.1), sec(0.3), ease.out);
  const aOut = prog(f, b.clear - sec(0.2), sec(0.5), ease.in);
  // the calm line becomes the track at the bottom
  const toTrack = prog(f, b.clear - sec(0.2), sec(0.9), ease.inOut);
  const lineY = mix(700, TRACK_Y, toTrack), lineW = mix(1400, TX0 - TX1, toTrack);
  // part B — words
  const bOut = prog(f, b.begin - sec(0.3), sec(0.4), ease.in);
  const ring = prog(f, b.yours - sec(0.05), sec(0.6), ease.inOut);
  // part C — steps that grow, and the practice bar
  const steps = [b.req, b.small, b.where, b.cost].map((at) => prog(f, at - sec(0.1), sec(0.4), ease.out));
  const STEPS = [[1450, 800, 0.8], [1100, 650, 1.05], [750, 500, 1.3], [410, 345, 1.5]];
  const fill = prog(f, b.skill - sec(0.1), b.train + sec(1.0) - b.skill, ease.inOut) * 0.62;
  return (
    <Stage f={f} dark svg={
      <>
        {/* the line: wobbling discomfort that settles, then the track */}
        <g opacity={1 - toTrack}>
          <Wave x={960} y={700} w={1400} amp={110} calm={calm} t={t} p={wave} color={C.red} width={18} />
        </g>
        {toTrack > 0 && <path d={`M ${960 + lineW / 2} ${lineY} L ${960 - lineW / 2} ${lineY}`} stroke={C.navy2} strokeWidth={30} strokeLinecap="round" opacity={toTrack} />}
        {toTrack > 0 && <path d={`M ${960 + lineW / 2} ${lineY} L ${960 - lineW / 2} ${lineY}`} stroke={C.paper} strokeWidth={6} strokeLinecap="round" opacity={toTrack * 0.35} />}
        {fill > 0 && <path d={`M ${TX0} ${TRACK_Y} L ${TX0 - (TX0 - TX1) * fill} ${TRACK_Y}`} stroke={C.green} strokeWidth={30} strokeLinecap="round" />}
        {aOut < 1 && (
          <g opacity={1 - aOut}>
            {/* the other side is typing… then a simple answer */}
            {typing > 0 && answered < 1 && (
              <g opacity={typing * (1 - answered)}>
                <MsgBubble x={1300} y={300} s={mix(0.7, 1.6, typing)} text="" w={220} size={56} />
                {[0, 1, 2].map((i) => <circle key={i} cx={1300 + 80 - i * 80} cy={300 - 10 * Math.max(0, Math.sin(t * 7 - i * 0.9))} r={20} fill={C.inkSoft} opacity={typing} />)}
              </g>
            )}
            {answered > 0 && <MsgBubble x={1260} y={300} s={mix(0.7, 1.4, answered)} o={answered} text={T.sc07.ok} size={60} />}
            <Pill x={640} y={470} text={T.sc07.uneasy} fill={C.red} size={66} o={prog(f, b.un - sec(0.1), sec(0.3)) * (1 - calm)} s={mix(0.6, 1, prog(f, b.un - sec(0.1), sec(0.35), ease.out)) * (1 + 0.04 * Math.sin(t * 9) * (1 - calm))} />
          </g>
        )}
        {/* «قرارك», circled */}
        {ring > 0 && bOut < 1 && <ellipse cx={960} cy={680} rx={330} ry={150} fill="none" stroke={C.green} strokeWidth={10} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring} transform="rotate(-4 960 680)" opacity={1 - bOut} />}
        {/* part C: small requests first; each step a little bigger */}
        {STEPS.map(([x, y, sc], i) => steps[i] > 0 ? <rect key={i} x={x - 150 * sc - 20} y={y + 70 * sc} width={300 * sc + 40} height={22} rx={8} fill={C.paper} opacity={0.3 * steps[i]} /> : null)}
        {STEPS.map(([x, y, s], i) => steps[i] > 0 ? <Req key={i} x={x} y={mix(y + 40, y, steps[i])} s={s * mix(0.6, 1, steps[i])} o={steps[i]} /> : null)}
      </>
    }>
      {bOut < 1 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - bOut }}>
          <Headline text={T.sc07.noGuarantee} f={f} at={b.no - sec(0.1)} x={960} y={160} w={1600} size={100} color={C.paper} />
          <Headline text={T.sc07.yours1} f={f} at={b.but - sec(0.1)} x={960} y={330} w={1600} size={78} color={C.aqua} />
          <Headline text={T.sc07.yours2} f={f} at={b.yours - sec(0.1)} x={960} y={570} w={900} size={170} color={C.green} />
        </div>
      )}
      <Headline text={T.sc07.small} f={f} at={b.small - sec(0.1)} x={1450} y={630} w={600} size={62} color={C.green} />
      <Headline text={T.sc07.practice} f={f} at={b.skill - sec(0.1)} x={560} y={TRACK_Y - 110} w={600} size={60} color={C.paper} />
    </Stage>
  );
};
