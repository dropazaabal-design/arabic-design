import { Expression } from '@mukarram/characters/face';

// Faces beyond the rig's named set (same contract as reels/blind-obedience's X).
const E_ = (eyes: Expression['eyes'], brow: [number, number], lift: [number, number], mouth: Expression['mouth'], extra: Partial<Expression> = {}): Expression => ({ eyes, brow, lift, mouth, ...extra });
export const E = {
  gulp: E_('wide', [-12, -12], [14, 14], 'wavy', { sweat: 0.8 }),
  torn: E_('open', [-14, -14], [10, 10], 'wavy', { sweat: 0.5 }),
  sigh: E_('half', [-8, -8], [2, 2], 'flat'),
  sleep: E_('closed', [0, 0], [0, 0], 'o'),
  stubborn: E_('squint', [14, 14], [-4, -4], 'flat'),
  relief: E_('closed', [-8, -8], [8, 8], 'smile'),
} satisfies Record<string, Expression>;
