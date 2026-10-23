import LINES from '../timing/lines.json';
import WORDS from '../timing/words.json';

// The ad's clock is the recorded voice: every scene and every action is placed on a spoken word
// (timing/words.json, from tools/timeline.py). Re-recording the voice re-times the whole ad.
export const FPS = 60;
type Word = { line: number; i: number; word: string; start: number; end: number };
const words = WORDS as Word[];
const fr = (s: number) => Math.round(s * FPS);

/** Frame where word i of line `line` starts (or ends). */
export const w = (line: number, i: number, end = false) => {
  const x = words.find((q) => q.line === line && q.i === i);
  if (!x) throw new Error(`no word ${line}:${i}`);
  return fr(end ? x.end : x.start);
};
const line = (id: number) => LINES.lines.find((l) => l.id === id)!;
export const L0 = (id: number) => fr(line(id).start);
export const L1 = (id: number) => fr(line(id).end);
export const TOTAL = LINES.frames;

/** Scene n starts a few frames before line n is spoken. */
export const sceneStart = (n: number) => (n === 1 ? 0 : L0(n) - 8);
