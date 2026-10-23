import React from 'react';
import { Headline } from '../text';
import { C, TITLE } from '../theme';

// Positions shared by neighbouring scenes, so each scene starts exactly where the previous one ended
// (the reel cuts between scenes without a crossfade; matching states make the cut invisible).
export type Kind = 'book' | 'focus' | 'day';
export const CARD: Record<'reading' | 'focus' | 'day', { kind: Kind; color: string; fan: [number, number]; tab: number }> = {
  reading: { kind: 'book', color: C.blue, fan: [820, 620], tab: 760 },      // RTL: first on the right
  focus: { kind: 'focus', color: C.navy2, fan: [540, 620], tab: 540 },
  day: { kind: 'day', color: C.cardboardDark, fan: [260, 620], tab: 320 },
};
export const FAN_S = 0.72;
export const TAB_Y = 1000;
export const GENERIC_TABS = [270, 360, 450, 630, 720, 810].map((x, i) => ({ x, color: [C.green, C.red, C.aqua, C.blue, C.navy2, C.cardboardDark][i], rot: [-4, 3, -2, 4, -3, 2][i], h: [0.9, 1.05, 0.8, 0.95, 1.1, 0.85][i] }));
export const LABELED_TABS = (['reading', 'focus', 'day'] as const).map((k, i) => ({ x: CARD[k].tab, color: CARD[k].color, rot: [3, -2, 4][i], h: 1.12 }));
export const CENTER: [number, number] = [540, 680];

export const Title: React.FC<{ text: string; f: number; at: number; until?: number; color?: string; size?: number }> = ({ text, f, at, until, color = C.ink, size = 96 }) => (
  <Headline text={text} f={f} at={at} until={until} x={540} y={TITLE.y} w={980} size={size} color={color} />
);
