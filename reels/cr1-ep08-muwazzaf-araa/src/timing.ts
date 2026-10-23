import LINES from '../timing/lines.json';
import WORDS from '../timing/words.json';

// The episode's clock is the voice (timing/*.json, built by tools/timeline.py): every action sits on a spoken word,
// so the provisional clock and the recorded one drive the same scenes.
export const FPS = 60;
type Word = { line: number; i: number; word: string; start: number; end: number };
const words = WORDS as Word[];
const lines = LINES.lines;

/** Frame where word i of a line starts (or ends). */
export const w = (line: number, i: number, end = false) => {
  const x = words.find((q) => q.line === line && q.i === i);
  if (!x) throw new Error(`no word ${line}:${i}`);
  return Math.round((end ? x.end : x.start) * FPS);
};
export const L0 = (id: number) => Math.round(lines.find((l) => l.id === id)!.start * FPS);
export const L1 = (id: number) => Math.round(lines.find((l) => l.id === id)!.end * FPS);
export const TOTAL = LINES.frames;
export const LINE_LIST = lines;
export const SOURCE = LINES.source;
