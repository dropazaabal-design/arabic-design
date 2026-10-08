import React from 'react';
import { ArText } from '../art/doodles';
import { Receipt, Scale, Tape } from '../art/world';
import { T } from '../copy';
import { Stage } from '../Stage';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneStart, useEpisodeFrame, wordAt } from '../time';

// sc03 — the book, as an original kraft-paper card (no cover image); then the habit it describes as a
// balance: each «نعم» moves a piece of your time onto their side; what is left on yours is resentment
// and worry; then the receipt: a simple request, a quick reply, a price that shows later.
const SX = 1270, SY = 430, SS = 0.95;

const panPos = (tilt: number, side: -1 | 1): [number, number] => {
  const a = (tilt * Math.PI) / 180;
  return [SX + side * 300 * Math.cos(a) * SS, SY + (side * 300 * Math.sin(a) - 40 + 150) * SS];
};

const Chip: React.FC<{ x: number; y: number; o?: number }> = ({ x, y, o = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <circle r={34} fill={C.green} stroke={C.paper} strokeWidth={5} />
    <path d="M 0 0 L 0 -18 M 0 0 L 13 8" stroke={C.white} strokeWidth={6} strokeLinecap="round" />
  </g>
);

export const SC03: React.FC = () => {
  const f = useEpisodeFrame();
  const start = sceneStart('sc03');
  const b = {
    t1: wordAt('s09', 'توقف'), t2: wordAt('s09', 'إرضاء'), author: wordAt('s09', 'باتريك'), role: wordAt('s09', 'كاتب'), habit: wordAt('s09', 'العادة'),
    yes: wordAt('s10', 'نعم'), keep: wordAt('s10', 'لنحافظ'), approve: wordAt('s10', 'رضا'), cost: wordAt('s10', 'يكلفنا'), more: wordAt('s10', 'أكثر'),
    resent: wordAt('s11', 'استياء'), worry: wordAt('s11', 'وقلق'),
    ours: wordAt('s12', 'ورسالتنا'), req: wordAt('s12', 'طلب'), reply: wordAt('s12', 'ورد'), price: wordAt('s12', 'وثمن'),
  };
  const card = prog(f, start + sec(0.1), sec(0.7), ease.out);
  const side = prog(f, b.yes - sec(0.2), sec(0.7), ease.inOut);          // the card steps aside for the balance
  const toRec = prog(f, b.ours - sec(0.2), sec(0.7), ease.inOut);        // the balance gives way to the receipt
  const scaleIn = prog(f, b.yes - sec(0.1), sec(0.5)) * (1 - toRec);
  const moves = [b.keep, b.approve, b.cost, b.more].map((at) => prog(f, at - sec(0.1), sec(0.6), ease.inOut));
  const moved = moves.reduce((a, m) => a + m, 0);
  const tilt = mix(0, 22, moved / 4);
  const L = panPos(tilt, -1), R = panPos(tilt, 1);
  const under = prog(f, b.habit - sec(0.1), sec(0.6), ease.inOut);
  const cx = mix(960, 380, side), cs = mix(1, 0.66, side), cy = mix(540, 520, side);
  return (
    <Stage f={f} dark svg={
      <>
        {/* the book card */}
        <g opacity={card} transform={`translate(${cx} ${cy + (1 - card) * 60}) scale(${cs}) rotate(-2)`}>
          <rect x={-380} y={-390} width={760} height={780} rx={14} fill={C.cardboard} filter="url(#lift)" />
          <rect x={-350} y={-360} width={700} height={720} rx={10} fill="none" stroke={C.cardboardDark} strokeWidth={4} strokeDasharray="18 12" />
          <g opacity={prog(f, b.t1 - sec(0.1), sec(0.4))}><ArText x={0} y={-210} size={104} color={C.ink} weight={900}>{T.sc03.title1}</ArText></g>
          <g opacity={prog(f, b.t2 - sec(0.1), sec(0.4))}><ArText x={0} y={-70} size={104} color={C.ink} weight={900}>{T.sc03.title2}</ArText></g>
          {under > 0 && <path d="M 300 0 L -300 0" stroke={C.red} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - under} />}
          <path d="M -220 70 L 220 70" stroke={C.cardboardDark} strokeWidth={5} />
          <g opacity={prog(f, b.author - sec(0.1), sec(0.4))}><ArText x={0} y={150} size={62} color={C.ink}>{T.sc03.author}</ArText></g>
          <g opacity={prog(f, b.role - sec(0.1), sec(0.4))}>
            <rect x={-330} y={222} width={660} height={78} rx={39} fill={C.aqua} />
            <ArText x={0} y={262} size={36} color={C.ink}>{T.sc03.role}</ArText>
          </g>
          <Tape x={0} y={-390} w={260} rot={-3} />
        </g>
        {/* the balance: their approval vs my time */}
        {scaleIn > 0 && (
          <g opacity={scaleIn}>
            <Scale x={SX} y={SY} s={SS} tilt={tilt} left={T.sc03.mine} right={T.sc03.theirs} leftColor={C.green} rightColor={C.aqua} dark />
            {/* four pieces of time move from my pan to theirs, one per beat */}
            {moves.map((m, i) => {
              const fx = L[0] - 90 + i * 60, fy = L[1] - 34, tx = R[0] - 90 + i * 60, ty = R[1] - 34;
              return <Chip key={i} x={mix(fx, tx, m)} y={mix(fy, ty, m) - Math.sin(m * Math.PI) * 170} />;
            })}
            {/* what stays on my side */}
            {[[b.resent, T.sc03.resent, -40, 0], [b.worry, T.sc03.anxiety, 40, -86]].map(([at, t, dx, dy], i) => {
              const p = prog(f, (at as number) - sec(0.1), sec(0.4), ease.in);
              return p > 0 ? (
                <g key={i} transform={`translate(${L[0] + (dx as number)} ${mix(L[1] - 300, L[1] - 40 + (dy as number), p)})`} opacity={p}>
                  <rect x={-98} y={-40} width={196} height={80} rx={40} fill={C.red} />
                  <ArText x={0} y={2} size={44} color={C.white}>{t as string}</ArText>
                </g>
              ) : null;
            })}
            {/* the «نعم» that tips it */}
            <g opacity={prog(f, b.yes - sec(0.1), sec(0.3)) * (1 - prog(f, b.resent - sec(0.4), sec(0.4)))} transform={`translate(${SX} ${SY - 220})`}>
              <rect x={-90} y={-46} width={180} height={92} rx={36} fill={C.red} />
              <ArText x={0} y={2} size={54} color={C.white}>{T.sc03.yes}</ArText>
            </g>
          </g>
        )}
        {/* the receipt */}
        {toRec > 0 && (
          <g opacity={toRec} transform={`translate(0 ${(1 - toRec) * 80})`}>
            <Receipt x={1250} y={160} s={1.3} w={660} title={T.sc03.receipt} rows={[
              [T.sc03.r1, prog(f, b.req - sec(0.1), sec(0.3))],
              [T.sc03.r2, prog(f, b.reply - sec(0.1), sec(0.3))],
              [T.sc03.r3, prog(f, b.price - sec(0.1), sec(0.3))],
            ]} />
          </g>
        )}
      </>
    } />
  );
};
