import React from 'react';
import { INK, LINE, PAL, stroke, wobEllipse, wobRect } from '@mukarram/characters/ink';
import { BUILDS, Glasses, Mustache } from '@mukarram/characters/cast';
import { BUILD, Build, Person, PersonProps } from '@mukarram/characters/rig';

// The people of the reel, all on the reels/mukarram rig: the experimenter in a grey technician's coat (as in
// Milgram 1963), the "learner" (an actor — a mild man with a moustache and a cardigan), and the members of
// Asch's group. The participant is reels/doublethink's clerk; the honest partner is the Baseera narrator.

type P = Omit<PersonProps, 'build' | 'torsoDetail' | 'headBack' | 'headFront'>;

export const EXP_BUILD: Build = { ...BUILD, headRX: 84, headRY: 92, torsoW: 150, torsoH: 232, belly: 0.3, shX: 56, thigh: 92, shin: 88, upper: 90, fore: 84, shirt: '#9AA3AE', shoe: INK, seed: 71 };
const COAT_LINE = '#6F7883';

/** The experimenter: grey coat to the knee, dark tie, side-parted hair, black-rimmed glasses; a clipboard. */
export const Experimenter: React.FC<P & { clipboard?: boolean; glint?: number }> = ({ clipboard = true, glint = 0, ...p }) => {
  const b = EXP_BUILD;
  const look = p.look ?? [0, 0];
  return (
    <Person {...p} build={b}
      torsoDetail={<g>
        <path d={`M${-b.torsoW * 0.44} -4 L${b.torsoW * 0.44} -4 L${b.torsoW * 0.5} 130 L${-b.torsoW * 0.5} 130Z`} fill={b.shirt} {...stroke(LINE * 0.8)} />
        <path d={`M2 -2 L4 128`} {...stroke(LINE * 0.5, COAT_LINE)} />
        <path d={`M-12 ${-b.torsoH + 16} L12 ${-b.torsoH + 16} L8 ${-b.torsoH + 120} L0 ${-b.torsoH + 136} L-8 ${-b.torsoH + 120}Z`} fill={PAL.navy} {...stroke(LINE * 0.6)} />
        <path d={`M-34 ${-b.torsoH + 4} L-8 ${-b.torsoH + 80} L-44 ${-b.torsoH + 58}Z`} fill={COAT_LINE} {...stroke(LINE * 0.6)} />
        <path d={`M34 ${-b.torsoH + 4} L8 ${-b.torsoH + 80} L44 ${-b.torsoH + 58}Z`} fill={COAT_LINE} {...stroke(LINE * 0.6)} />
        <g transform={`translate(${-b.torsoW * 0.27} ${-b.torsoH + 96})`}>
          <path d="M-8 -26 L-8 6 M2 -30 L2 6" {...stroke(LINE * 0.8, PAL.red)} />
          <path d="M-20 0 L20 0 L18 30 L-18 30Z" fill={b.shirt} {...stroke(LINE * 0.5)} />
        </g>
      </g>}
      headFront={<g>
        <path d={`M${-b.headRX * 1.0} ${-b.headRY * 0.15} Q ${-b.headRX * 0.95} ${-b.headRY * 1.05} ${b.headRX * 0.1} ${-b.headRY * 1.0} Q ${b.headRX * 0.95} ${-b.headRY * 0.95} ${b.headRX * 1.0} ${-b.headRY * 0.15} Q ${b.headRX * 0.6} ${-b.headRY * 0.62} ${-b.headRX * 0.3} ${-b.headRY * 0.58} Z`} fill={INK} />
        <Glasses rx={b.headRX} ry={b.headRY} look={look} color={INK} />
        {glint > 0 && <path d={`M${-b.headRX * 0.5 + look[0] * 20} ${-b.headRY * 0.1} l18 -18`} {...stroke(LINE * 0.9, PAL.white)} opacity={glint} />}
      </g>}
      itemL={clipboard ? <g transform="translate(-6 -20) rotate(-8)"><path d={wobRect(-46, -60, 92, 124, 8, 701, 1)} fill="#7E6047" {...stroke(LINE * 0.7)} /><path d={wobRect(-38, -46, 76, 102, 4, 702, 1)} fill={PAL.paper} {...stroke(LINE * 0.4)} />{[0, 1, 2, 3].map((i) => <path key={i} d={`M-28 ${-30 + i * 20} L28 ${-30 + i * 20}`} {...stroke(LINE * 0.4, PAL.stone)} />)}</g> : undefined}
    />
  );
};

/** The "learner": a mild man with a moustache and a green cardigan (he is an actor). */
export const Actor: React.FC<P & { tag?: boolean }> = ({ tag = false, ...p }) => {
  const b: Build = { ...BUILD, ...BUILDS.spitter, shirt: PAL.sage, seed: 81 };
  const look = p.look ?? [0, 0];
  return (
    <Person {...p} build={b}
      torsoDetail={<g>
        {[0.32, 0.5, 0.68].map((k) => <circle key={k} cx={0} cy={-b.torsoH * k} r={5} fill={INK} />)}
        <path d={`M-10 ${-b.torsoH + 4} L0 ${-b.torsoH + 40} L10 ${-b.torsoH + 4}`} fill={PAL.white} {...stroke(LINE * 0.5)} />
        {tag && <g transform={`translate(${-b.torsoW * 0.22} ${-b.torsoH * 0.62})`}><path d={wobRect(-40, -18, 80, 36, 6, 711, 1)} fill={PAL.white} {...stroke(LINE * 0.6)} /><text x={0} y={10} textAnchor="middle" fontFamily="Cairo, sans-serif" fontWeight={900} fontSize={24} fill={PAL.red} direction="rtl">ممثل</text></g>}
      </g>}
      headFront={<g>
        <path d={`M${-b.headRX * 0.98} ${-b.headRY * 0.1} Q ${-b.headRX * 0.9} ${-b.headRY * 0.6} ${-b.headRX * 0.55} ${-b.headRY * 0.66}`} fill="none" {...stroke(LINE * 1.6)} />
        <path d={`M${b.headRX * 0.98} ${-b.headRY * 0.1} Q ${b.headRX * 0.9} ${-b.headRY * 0.6} ${b.headRX * 0.55} ${-b.headRY * 0.66}`} fill="none" {...stroke(LINE * 1.6)} />
        <Mustache rx={b.headRX} ry={b.headRY} look={look} />
      </g>}
    />
  );
};

/** One of Asch's group: varied builds, shirts and hair, so seven people read as seven people. */
const MEMBERS: Array<{ b: keyof typeof BUILDS; shirt: string; hair: 'flat' | 'curl' | 'bald' | 'tuft' | 'cap' }> = [
  { b: 'litterer', shirt: PAL.teal, hair: 'cap' },
  { b: 'cleaner', shirt: PAL.navy, hair: 'bald' },
  { b: 'passerby', shirt: PAL.redSoft, hair: 'tuft' },
  { b: 'spitter', shirt: PAL.sage, hair: 'flat' },
  { b: 'narrator', shirt: '#6B7FA0', hair: 'curl' },
  { b: 'passerby', shirt: PAL.stone, hair: 'flat' },
  { b: 'cleaner', shirt: PAL.woodDeep, hair: 'curl' },
];
export const Member: React.FC<P & { k: number }> = ({ k, ...p }) => {
  const m = MEMBERS[k % MEMBERS.length];
  const b: Build = { ...BUILD, ...BUILDS[m.b], shirt: m.shirt, shoe: INK, seed: 90 + k };
  const hair = (() => {
    const rx = b.headRX, ry = b.headRY;
    switch (m.hair) {
      case 'cap': return <path d={`M${-rx} ${-ry * 0.3} Q0 ${-ry * 1.4} ${rx} ${-ry * 0.3} L${rx * 1.3} ${-ry * 0.22} L${rx * 0.9} ${-ry * 0.16} Q0 ${-ry * 0.5} ${-rx} ${-ry * 0.3}Z`} fill={PAL.red} {...stroke(LINE * 0.8)} />;
      case 'bald': return <path d={`M${-rx * 0.98} ${-ry * 0.05} Q ${-rx} ${-ry * 0.5} ${-rx * 0.7} ${-ry * 0.6} M${rx * 0.98} ${-ry * 0.05} Q ${rx} ${-ry * 0.5} ${rx * 0.7} ${-ry * 0.6}`} fill="none" {...stroke(LINE * 1.6)} />;
      case 'tuft': return <path d={`M${-rx * 0.2} ${-ry * 0.95} q -10 -38 22 -46 q -4 22 14 40`} fill={INK} {...stroke(LINE * 0.6)} />;
      case 'curl': return <g>{[-0.6, -0.2, 0.2, 0.6].map((x, i) => <path key={i} d={wobEllipse(rx * x, -ry * 0.82, rx * 0.3, ry * 0.25, 120 + i, 0.08, 8)} fill={INK} />)}</g>;
      default: return <path d={`M${-rx} ${-ry * 0.2} Q0 ${-ry * 1.25} ${rx} ${-ry * 0.2} Q0 ${-ry * 0.62} ${-rx} ${-ry * 0.2}Z`} fill={INK} />;
    }
  })();
  return <Person {...p} build={b} headFront={hair} />;
};
