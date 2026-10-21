import longData from './data/long.json';
import shortData from './data/short.json';
import type { HookBeats } from './scenes/hook';
import { timing, type Program } from './time';

export const LONG = longData as unknown as Program;
export const SHORT = shortData as unknown as Program;

export const hookBeats = (prog: 'long' | 'short'): HookBeats => {
  const T = timing(prog === 'long' ? LONG : SHORT);
  return prog === 'long'
    ? { start: T.segStart('L1'), isNew: T.at('L1', 3, 'جديدة'), notice: T.at('L1', 6, 'تنتبه'), park: T.at('L1', 10, 'وقّفها'), turn: T.at('L1', 14, 'انتبهوا'),
      but: T.at('L1', 16, 'بس'), think: T.at('L1', 21, 'يفكر'), imagine: T.at('L1', 27, 'يتخيّل'), end: T.segEnd('L1') }
    : { start: T.segStart('R1'), isNew: T.at('R1', 3, 'جديدة'), notice: T.at('R1', 6, 'تنتبه'), park: T.at('R1', 10, 'وقّفها'), turn: T.at('R1', 11, 'التفتوا'),
      but: T.at('R1', 13, 'بس'), think: T.at('R1', 17, 'يفكر'), imagine: T.at('R1', 23, 'يتخيّل'), end: T.segEnd('R1') };
};
