import React from 'react';
import type { Look } from './cast';
import { mix } from './skeleton';

/** A face is a handful of numbers, so expressions blend smoothly and any two can be mixed. */
export type Face = {
  open: number; // eyelids: 0 shut … 1 open … 1.25 wide
  look: [number, number]; // pupils, −1..1 each way
  brow: number; // brow angle: + inner ends down (anger, focus), − inner ends up (worry, sadness)
  browY: number; // brow height: + raised (surprise), − lowered
  mouth: number; // curve: + smile, − frown
  open2: number; // mouth open 0..1
  width: number; // mouth width, 1 = normal
  tight: number; // pressed lips 0..1
  skew: number; // one-sided smile −1..1
  blush: number; // 0..1
  squint: number; // lower lids up 0..1
};
export const NEUTRAL: Face = { open: 1, look: [0, 0], brow: 0, browY: 0, mouth: 0.15, open2: 0, width: 1, tight: 0, skew: 0, blush: 0, squint: 0 };
const f = (p: Partial<Face>): Face => ({ ...NEUTRAL, ...p });

/** The expression library (14). Names are what the shot list and the character bible use. */
export const EXPRESSIONS = {
  neutral: NEUTRAL,
  calm: f({ open: 0.85, mouth: 0.35, brow: -0.1, squint: 0.15 }),
  smile: f({ mouth: 0.9, squint: 0.35, browY: 0.15 }),
  forcedSmile: f({ mouth: 0.55, width: 1.15, brow: 0.55, tight: 0.6, open: 0.95 }), // the mouth smiles, the brows don't
  irritated: f({ brow: 0.6, browY: -0.25, mouth: -0.25, tight: 0.5, open: 0.85, squint: 0.2 }),
  angry: f({ brow: 1, browY: -0.45, mouth: -0.6, open2: 0.25, width: 1.1, open: 1.05, squint: 0.25 }),
  hurt: f({ brow: -0.7, browY: 0.1, mouth: -0.45, open: 0.8, look: [0, 0.4] }),
  sad: f({ brow: -0.9, browY: 0.05, mouth: -0.6, open: 0.7, look: [0, 0.6] }),
  anxious: f({ brow: -0.8, browY: 0.35, mouth: -0.2, tight: 0.4, width: 0.85, open: 1.1, look: [0.3, 0] }),
  surprised: f({ browY: 0.9, open: 1.25, open2: 0.55, width: 0.75, mouth: 0 }),
  thinking: f({ brow: 0.25, browY: 0.1, skew: 0.5, mouth: 0, look: [0.5, -0.6], open: 0.9 }),
  relieved: f({ open: 0.55, mouth: 0.6, brow: -0.35, browY: 0.15 }),
  determined: f({ brow: 0.45, browY: -0.1, mouth: 0.05, tight: 0.45, open: 1 }),
  embarrassed: f({ brow: -0.5, mouth: 0.2, skew: -0.4, blush: 1, look: [0.2, 0.7], open: 0.8 }),
  listening: f({ brow: -0.15, browY: 0.25, mouth: 0.25, open: 1.05 }),
  smug: f({ brow: 0.3, browY: -0.05, skew: 0.9, mouth: 0.35, open: 0.7 }), // the provoker's default
  contempt: f({ brow: 0.55, skew: -0.8, mouth: -0.1, open: 0.65, look: [-0.3, 0] }),
  shout: f({ brow: 1, browY: -0.3, open2: 0.9, width: 1.1, mouth: -0.3, open: 1.1 }),
} satisfies Record<string, Face>;
export type Expr = keyof typeof EXPRESSIONS;

export const mixFace = (a: Face, b: Face, t: number): Face => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const m = (k: keyof Face) => mix(a[k] as number, b[k] as number, t);
  return { open: m('open'), look: [mix(a.look[0], b.look[0], t), mix(a.look[1], b.look[1], t)], brow: m('brow'), browY: m('browY'), mouth: m('mouth'), open2: m('open2'), width: m('width'), tight: m('tight'), skew: m('skew'), blush: m('blush'), squint: m('squint') };
};

const INK = '#2A2F3A';
const LIP = '#7A3346';

/**
 * The head, in its own frame (centre at 0,0). `turn` slides the features across the round head (front → three-quarter →
 * profile) and squeezes the far eye, so one drawing covers every view. `blink` closes the lids; `talk` flaps the mouth.
 */
export const Head: React.FC<{ r: number; turn: number; face: Face; look: Look; blink?: number; talk?: number; line: number }> = ({ r, turn, face, look, blink = 0, talk = 0, line }) => {
  const s = turn < 0 ? -1 : 1, a = Math.min(1, Math.abs(turn));
  const fx = r * 0.5 * turn;
  const ey = -r * 0.1;
  const gap = r * 0.33;
  const eyes = [
    { x: fx - s * gap * (1 - 0.45 * a), k: 1 }, // near eye
    { x: fx + s * gap * (1 - 0.55 * a), k: 1 - 0.6 * a }, // far eye, squeezed by the turn
  ];
  const open = Math.max(0, face.open * (1 - blink));
  const hijab = look.hair === 'hijab';
  const eye = (e: { x: number; k: number }, i: number) => {
    if (i === 1 && a > 0.9) return null;
    const rx = r * 0.19 * e.k, ry = r * 0.235 * Math.min(1.25, open);
    const px = e.x + face.look[0] * rx * 0.45 + s * a * rx * 0.25, py = ey + face.look[1] * ry * 0.35;
    if (open < 0.14) return <path key={i} d={`M${e.x - rx} ${ey + 1} Q${e.x} ${ey + 4 + face.mouth * 2} ${e.x + rx} ${ey + 1}`} fill="none" stroke={INK} strokeWidth={line * 0.8} strokeLinecap="round" />;
    const lower = face.squint * ry * 0.7;
    return <g key={i}>
      <ellipse cx={e.x} cy={ey} rx={rx} ry={ry} fill="#FFFFFF" stroke={INK} strokeWidth={line * 0.7} />
      <circle cx={px} cy={py} r={Math.min(rx, ry) * 0.55} fill={INK} />
      <circle cx={px + rx * 0.18} cy={py - ry * 0.22} r={Math.min(rx, ry) * 0.16} fill="#FFFFFF" />
      {lower > 0.5 && <path d={`M${e.x - rx - 1} ${ey + ry - lower} Q${e.x} ${ey + ry - lower * 1.6} ${e.x + rx + 1} ${ey + ry - lower} L${e.x + rx + 2} ${ey + ry + 3} L${e.x - rx - 2} ${ey + ry + 3} Z`} fill={look.skin} />}
    </g>;
  };
  const brow = (e: { x: number; k: number }, i: number) => {
    if (i === 1 && a > 0.9) return null;
    const inner = i === 0 ? s : -s; // the end toward the other eye
    const w = r * 0.2 * e.k;
    const by = ey - r * 0.32 - face.browY * r * 0.12;
    const dy = face.brow * r * 0.09;
    const xi = e.x + inner * w, xo = e.x - inner * w;
    return <path key={`b${i}`} d={`M${xo} ${by - dy * 0.3} Q${e.x} ${by - r * 0.05 - dy * 0.2} ${xi} ${by + dy}`} fill="none" stroke={look.brow ?? INK} strokeWidth={line * 1.05} strokeLinecap="round" />;
  };
  // mouth: a curve when closed, a shape when open; tight lips shorten it, skew lifts one corner
  const mx = fx + s * a * r * 0.05, my = r * 0.42;
  const w = r * 0.28 * face.width * (1 - 0.35 * a) * (1 - 0.35 * face.tight);
  const o = Math.min(1, face.open2 + talk);
  const c = face.mouth * r * 0.22;
  const yl = my - face.skew * r * 0.07 - c * 0.35, yr = my + face.skew * r * 0.07 - c * 0.35;
  const mouth = o < 0.06
    ? <path d={`M${mx - w} ${yl} Q${mx} ${my + c} ${mx + w} ${yr}`} fill="none" stroke={INK} strokeWidth={line * (0.85 + face.tight * 0.3)} strokeLinecap="round" />
    : <path d={`M${mx - w} ${yl} Q${mx} ${my + c * 0.4 - o * r * 0.03} ${mx + w} ${yr} Q${mx} ${my + c + o * r * 0.32} ${mx - w} ${yl} Z`} fill={LIP} stroke={INK} strokeWidth={line * 0.8} strokeLinejoin="round" />;
  const nose = a > 0.12
    ? <path d={`M${fx + s * r * 0.12} ${r * 0.02} Q${fx + s * r * (0.22 + a * 0.18)} ${r * 0.18} ${fx + s * r * 0.08} ${r * 0.22}`} fill="none" stroke={INK} strokeWidth={line * 0.7} strokeLinecap="round" />
    : <path d={`M${fx - r * 0.04} ${r * 0.18} Q${fx} ${r * 0.22} ${fx + r * 0.04} ${r * 0.18}`} fill="none" stroke={INK} strokeWidth={line * 0.6} strokeLinecap="round" />;
  const ear = a > 0.2 && !hijab && <path d={`M${fx - s * r * 0.78} ${-r * 0.12} q${-s * r * 0.16} ${r * 0.1} 0 ${r * 0.3}`} fill={look.skin} stroke={INK} strokeWidth={line * 0.7} strokeLinecap="round" opacity={Math.min(1, (a - 0.2) * 4)} />;
  return (
    <g>
      {hijab ? <Hijab r={r} turn={turn} look={look} line={line} /> : <circle r={r} fill={look.skin} stroke={INK} strokeWidth={line} />}
      {!hijab && <Hair r={r} turn={turn} look={look} line={line} />}
      {ear}
      {face.blush > 0 && [0, 1].map((i) => <ellipse key={i} cx={eyes[i].x + (i ? s : -s) * r * 0.04} cy={r * 0.2} rx={r * 0.13 * eyes[i].k} ry={r * 0.07} fill="#E59AAE" opacity={face.blush * 0.7} />)}
      {eyes.map(eye)}
      {eyes.map(brow)}
      {look.glasses && eyes.map((e, i) => (i === 1 && a > 0.9 ? null : <ellipse key={`g${i}`} cx={e.x} cy={ey} rx={r * 0.25 * e.k} ry={r * 0.24} fill="none" stroke={look.glasses} strokeWidth={line * 0.7} />))}
      {look.glasses && a < 0.9 && <path d={`M${eyes[0].x + s * r * 0.25} ${ey} L${eyes[1].x - s * r * 0.25 * eyes[1].k} ${ey}`} stroke={look.glasses} strokeWidth={line * 0.7} />}
      {nose}
      {mouth}
      {look.beard && <path d={`M${fx - r * 0.5} ${r * 0.3} Q${fx} ${r * 1.02} ${fx + r * 0.5} ${r * 0.3} Q${fx} ${r * 0.72} ${fx - r * 0.5} ${r * 0.3} Z`} fill={look.hairColor} opacity={0.85} />}
    </g>
  );
};

/** Hair as a cap whose hairline rises toward the face side, so it reads the head's turn as well as the eyes do. */
const Hair: React.FC<{ r: number; turn: number; look: Look; line: number }> = ({ r, turn, look, line }) => {
  const s = turn < 0 ? -1 : 1, a = Math.min(1, Math.abs(turn));
  const front = s * mix(0.2, 0.75, a); // hairline point on the face side
  const c = look.hairColor;
  if (look.hair === 'none') return null;
  const base = `M${-r * 1.0} ${-r * 0.05} C${-r * 1.08} ${-r * 1.25} ${r * 1.08} ${-r * 1.25} ${r * 1.0} ${-r * 0.05}`;
  const hairline = look.hair === 'kid'
    ? `L${r * 0.9} ${-r * 0.35} Q${r * front * 0.6} ${-r * 0.5} ${-r * 0.9} ${-r * 0.35} Z`
    : `L${r * 0.92 * (s > 0 ? 1 : 0.9)} ${-r * (s > 0 ? 0.45 : 0.2)} Q${r * front} ${-r * 0.72} ${-r * 0.92} ${-r * (s > 0 ? 0.2 : 0.45)} Z`;
  return <g>
    <path d={`${base} ${hairline}`} fill={c} stroke={'#2A2F3A'} strokeWidth={line * 0.8} strokeLinejoin="round" />
    {look.hair === 'quiff' && <path d={`M${r * front * 0.9} ${-r * 0.75} Q${r * (front + s * 0.25)} ${-r * 1.35} ${r * (front - s * 0.45)} ${-r * 0.95} Z`} fill={c} stroke={'#2A2F3A'} strokeWidth={line * 0.8} strokeLinejoin="round" />}
    {look.hair === 'side' && <path d={`M${-r * 0.2 * s} ${-r * 0.95} Q${r * 0.3 * s} ${-r * 0.75} ${r * 0.85 * s} ${-r * 0.55}`} fill="none" stroke={'#5B6472'} strokeWidth={line * 0.6} strokeLinecap="round" />}
  </g>;
};

/** A headscarf: the scarf is the head's outline, the face is an oval window that slides with the turn. */
const Hijab: React.FC<{ r: number; turn: number; look: Look; line: number }> = ({ r, turn, look, line }) => {
  const s = turn < 0 ? -1 : 1, a = Math.min(1, Math.abs(turn));
  const fx = r * 0.42 * turn;
  const scarf = look.scarf ?? '#8A7BB0';
  return <g>
    <path d={`M${-r * 1.08} ${r * 0.1} C${-r * 1.15} ${-r * 1.25} ${r * 1.15} ${-r * 1.25} ${r * 1.08} ${r * 0.1} C${r * 1.05} ${r * 0.9} ${r * 0.7} ${r * 1.28} ${0} ${r * 1.3} C${-r * 0.7} ${r * 1.28} ${-r * 1.05} ${r * 0.9} ${-r * 1.08} ${r * 0.1} Z`} fill={scarf} stroke={'#2A2F3A'} strokeWidth={line} strokeLinejoin="round" />
    <ellipse cx={fx} cy={r * 0.12} rx={r * mix(0.74, 0.5, a)} ry={r * 0.86} fill={look.skin} stroke={'#2A2F3A'} strokeWidth={line * 0.8} />
    <path d={`M${fx - r * mix(0.74, 0.5, a)} ${-r * 0.2} Q${fx} ${-r * 0.92} ${fx + r * mix(0.74, 0.5, a)} ${-r * 0.2}`} fill="none" stroke={look.scarfShade ?? '#6E5F96'} strokeWidth={line * 1.6} strokeLinecap="round" opacity={0.8} />
    {a > 0.3 && <path d={`M${fx - s * r * 0.9} ${-r * 0.1} Q${fx - s * r * 1.0} ${r * 0.6} ${fx - s * r * 0.5} ${r * 1.1}`} fill="none" stroke={look.scarfShade ?? '#6E5F96'} strokeWidth={line * 0.7} opacity={0.7} />}
  </g>;
};
