import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CAST, type Who } from './kit/characters/cast';
import { Character } from './kit/characters/Character';
import { EXPRESSIONS, Head, type Expr } from './kit/characters/face';
import { GESTURES, GESTURE_NAMES, Hand } from './kit/characters/hands';
import { POSES, type PoseName } from './kit/characters/poses';
import { pose } from './kit/characters/skeleton';
import { BODY, TITLE } from './fonts';

// Reference sheets for the character bible, rendered from the same components the film uses.
const BG = '#F3F1EC';
const Label: React.FC<{ x: number; y: number; t: string; size?: number }> = ({ x, y, t, size = 22 }) => (
  <div dir="rtl" lang="ar" style={{ position: 'absolute', left: x - 150, top: y, width: 300, textAlign: 'center', fontFamily: BODY, fontWeight: 700, fontSize: size, color: '#2A2F3A' }}>{t}</div>
);
const Title: React.FC<{ t: string }> = ({ t }) => <div dir="rtl" lang="ar" style={{ position: 'absolute', top: 30, right: 60, fontFamily: TITLE, fontWeight: 800, fontSize: 48, color: '#2A2F3A' }}>{t}</div>;

export const CastSheet: React.FC = () => {
  const who = Object.keys(CAST) as Who[];
  return <AbsoluteFill style={{ background: BG }}>
    <svg width={1920} height={1080} style={{ position: 'absolute' }}>
      {who.map((w, k) => <Character key={w} who={w} p={pose({ turn: 0.35, body: 0.45 })} x={130 + k * 205} y={820} s={1.45} face={w === 'jaser' ? 'smug' : 'calm'} />)}
    </svg>
    <Title t="الشخصيات" />
    {who.map((w, k) => <Label key={w} x={130 + k * 205} y={850} t={CAST[w].name} />)}
  </AbsoluteFill>;
};

export const TurnSheet: React.FC = () => {
  const turns = [0, 0.35, 0.65, 1];
  const names = ['أمام', 'ثلاثة أرباع', 'ثلاثة أرباع ونصف', 'جانب'];
  return <AbsoluteFill style={{ background: BG }}>
    <svg width={1920} height={1080} style={{ position: 'absolute' }}>
      {(['salim', 'jaser', 'mona'] as Who[]).map((w, r) => turns.map((t, c) => <g key={`${w}${c}`} transform={`translate(${330 + c * 400} ${230 + r * 300}) scale(2.2)`}><Head r={48} turn={t} face={EXPRESSIONS[w === 'jaser' ? 'smug' : 'neutral']} look={CAST[w]} line={4.6} /></g>))}
    </svg>
    <Title t="الوجه من الأمام إلى الجانب" />
    {names.map((n, c) => <Label key={n} x={330 + c * 400} y={980} t={n} />)}
  </AbsoluteFill>;
};

export const ExpressionSheet: React.FC = () => {
  const ex = Object.keys(EXPRESSIONS) as Expr[];
  const AR: Record<string, string> = { neutral: 'محايد', calm: 'هادئ', smile: 'ابتسامة', forcedSmile: 'ابتسامة متكلّفة', irritated: 'منزعج', angry: 'غاضب', hurt: 'مجروح', sad: 'حزين', anxious: 'قلق', surprised: 'مندهش', thinking: 'يفكر', relieved: 'مرتاح', determined: 'عازم', embarrassed: 'محرَج', listening: 'منصت', smug: 'متعالٍ', contempt: 'ازدراء', shout: 'يصرخ' };
  return <AbsoluteFill style={{ background: BG }}>
    <svg width={1920} height={1080} style={{ position: 'absolute' }}>
      {ex.map((e, k) => <g key={e} transform={`translate(${170 + (k % 6) * 316} ${230 + Math.floor(k / 6) * 290}) scale(1.75)`}><Head r={48} turn={0.25} face={EXPRESSIONS[e]} look={CAST.salim} line={4.6} /></g>)}
    </svg>
    <Title t="التعابير" />
    {ex.map((e, k) => <Label key={e} x={170 + (k % 6) * 316} y={330 + Math.floor(k / 6) * 290} t={AR[e] ?? e} />)}
  </AbsoluteFill>;
};

export const PoseSheet: React.FC = () => {
  const ps = Object.keys(POSES) as PoseName[];
  return <AbsoluteFill style={{ background: BG }}>
    <svg width={1920} height={1080} style={{ position: 'absolute' }}>
      {ps.map((n, k) => {
        const P = POSES[n];
        const x = 120 + (k % 10) * 186, y = 470 + Math.floor(k / 10) * 480;
        return <g key={n}>
          {P.p.sit > 0.5 && <rect x={x - 46} y={y - 116} width={80} height={14} rx={4} fill="#B9B2A6" />}
          <Character who="salim" p={P.p} x={x} y={y} s={1.05} hands={P.hands} face={n === 'handsOnHips' ? 'smug' : n === 'slump' || n === 'headInHands' ? 'sad' : 'calm'} />
        </g>;
      })}
    </svg>
    <Title t="الوضعيات" />
    {ps.map((n, k) => <Label key={n} x={120 + (k % 10) * 186} y={480 + Math.floor(k / 10) * 480} t={POSES[n].name} size={17} />)}
  </AbsoluteFill>;
};

export const HandSheet: React.FC = () => <AbsoluteFill style={{ background: BG }}>
  <svg width={1920} height={1080} style={{ position: 'absolute' }}>
    {GESTURES.map((g, k) => <g key={g} transform={`translate(${210 + (k % 5) * 360} ${330 + Math.floor(k / 5) * 400}) scale(6)`}><Hand g={g} skin={CAST.salim.skin} /></g>)}
  </svg>
  <Title t="اليدان" />
  {GESTURES.map((g, k) => <Label key={g} x={270 + (k % 5) * 360} y={480 + Math.floor(k / 5) * 400} t={GESTURE_NAMES[g]} />)}
</AbsoluteFill>;
