import React from 'react';
import { INK, PAL } from '../style';

// Diagram icons: INK line drawings with one flat accent fill. Each is centred at 0,0 and drawn in a 48×48 box;
// `s` is the rendered size in px (24–60 works; default 48), `accent` overrides the fill colour.
type IconProps = { s?: number; accent?: string };
const Icon = ({ s = 48, children }: { s?: number; children: React.ReactNode }) => (
  <g transform={`scale(${s / 48})`} fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">{children}</g>
);

export const IconThought = ({ s, accent = PAL.focusLight }: IconProps) => <Icon s={s}>
  <path d="M-12 8 A9 9 0 0 1 -14 -8 A10 10 0 0 1 2 -16 A10 10 0 0 1 17 -6 A8 8 0 0 1 12 8 Z" fill={accent} />
  <circle cx={-12} cy={15} r={3.2} fill={accent} /><circle cx={-18} cy={20} r={1.8} fill={accent} />
</Icon>;

export const IconHeart = ({ s, accent = PAL.rose }: IconProps) => <Icon s={s}>
  <path d="M0 18 C-20 4 -21 -6 -16 -12 A9 9 0 0 1 0 -11 A9 9 0 0 1 16 -12 C21 -6 20 4 0 18 Z" fill={accent} />
  <path d="M-11 -6 Q-12 -2 -9 1" stroke="#FFFFFF" opacity={0.7} />
</Icon>;

/** Flame in blue by default (pass accent={PAL.rose} for the rose one). Never orange. */
export const IconFlame = ({ s, accent = PAL.flameBlue }: IconProps) => <Icon s={s}>
  <path d="M0 20 C-12 20 -16 10 -13 2 C-11 -4 -6 -6 -6 -14 C0 -10 2 -6 2 -2 C4 -6 6 -8 6 -12 C14 -4 16 6 12 13 C9 18 5 20 0 20 Z" fill={accent} />
  <path d="M0 18 C-5 18 -7 13 -5 9 C-4 6 -1 5 0 1 C4 5 6 9 5 13 C4 16 2 18 0 18 Z" fill={PAL.flameCore} strokeWidth={2.2} />
</Icon>;

export const IconBody = ({ s, accent = PAL.calmLight }: IconProps) => <Icon s={s}>
  <circle cx={0} cy={-13} r={7} fill={accent} />
  <path d="M-11 20 L-11 2 Q-11 -3 -6 -3 L6 -3 Q11 -3 11 2 L11 20" fill={accent} />
  <path d="M-11 2 L-17 13 M11 2 L17 13" />
</Icon>;

export const IconEar = ({ s, accent = PAL.provokeLight }: IconProps) => <Icon s={s}>
  <path d="M-10 -4 A12 14 0 1 1 10 6 C7 10 4 10 3 15 C2 20 -4 22 -7 17" fill={accent} />
  <path d="M-3 -4 A5 5 0 1 1 5 0 C3 3 1 3 1 7" />
</Icon>;

export const IconClock = ({ s, accent = PAL.focusLight }: IconProps) => <Icon s={s}>
  <circle r={18} fill={accent} />
  <path d="M0 -10 L0 0 L8 5" />
</Icon>;

export const IconShield = ({ s, accent = PAL.calm }: IconProps) => <Icon s={s}>
  <path d="M0 -19 L16 -12 L16 0 C16 10 9 16 0 20 C-9 16 -16 10 -16 0 L-16 -12 Z" fill={accent} />
  <path d="M0 -12 L9 -8 L9 0 C9 6 5 10 0 13" stroke="#FFFFFF" strokeWidth={2.4} opacity={0.7} />
</Icon>;

export const IconDoor = ({ s, accent = PAL.wallLav }: IconProps) => <Icon s={s}>
  <path d="M-13 20 L-13 -19 L13 -19 L13 20" />
  <path d="M-13 -19 L5 -15 L5 22 L-13 20 Z" fill={accent} />
  <circle cx={0} cy={3} r={1.6} fill={INK} />
  <path d="M-20 20 H20" />
</Icon>;

export const IconPause = ({ s, accent = PAL.calmLight }: IconProps) => <Icon s={s}>
  <circle r={18} fill={accent} />
  <path d="M-5 -8 V8 M5 -8 V8" strokeWidth={4.2} />
</Icon>;

export const IconBreath = ({ s, accent = PAL.water }: IconProps) => <Icon s={s}>
  {[-10, 0, 10].map((y, k) => <path key={y} d={`M-18 ${y} q4.5 -6 9 0 t9 0 t9 0 t9 0`} stroke={k === 1 ? accent : INK} strokeWidth={k === 1 ? 4.2 : 3.2} />)}
</Icon>;

export const IconEye = ({ s, accent = PAL.focus }: IconProps) => <Icon s={s}>
  <path d="M-20 0 Q0 -18 20 0 Q0 18 -20 0 Z" fill="#FFFFFF" />
  <circle r={7} fill={accent} />
  <circle r={2.6} fill={INK} stroke="none" />
</Icon>;

export const IconCheck = ({ s, accent = PAL.calm }: IconProps) => <Icon s={s}>
  <circle r={18} fill={accent} />
  <path d="M-8 0 L-2 6 L9 -6" stroke="#FFFFFF" strokeWidth={4.2} />
</Icon>;

export const ICONS = { IconThought, IconHeart, IconFlame, IconBody, IconEar, IconClock, IconShield, IconDoor, IconPause, IconBreath, IconEye, IconCheck };
