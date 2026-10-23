import LINES from '../timing/lines.json';
import WORDS from '../timing/words.json';

// Time in this ad is the recorded voice: every action is placed on a spoken word.
export const FPS = 60;
type Word = { line: number; i: number; word: string; start: number; end: number };
const words = WORDS as Word[];

/** Frame where word i of line `line` starts (or ends). */
export const w = (line: number, i: number, end = false) => {
  const x = words.find((q) => q.line === line && q.i === i);
  if (!x) throw new Error(`no word ${line}:${i}`);
  return Math.round((end ? x.end : x.start) * FPS);
};
export const lineStart = (id: number) => Math.round(LINES.lines.find((l) => l.id === id)!.start * FPS);
export const lineEnd = (id: number) => Math.round(LINES.lines.find((l) => l.id === id)!.end * FPS);
/** The call to action is held 2 s after the last word, so the name and the address can be read. */
export const TOTAL = lineEnd(9) + 2 * FPS;
