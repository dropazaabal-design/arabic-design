import timing from '../timing.json';

// Time is cued on words, never on fixed seconds: cue('c01', 'كبسة') is the frame the narrator says «كبسة».
// timing.json maps character offsets in each chunk's text to seconds (tools/timing.py).
type Chunk = { id: string; text: string; start: number; dur: number; anchors: number[][] };
const chunks = timing.chunks as Chunk[];
const byId: Record<string, Chunk> = Object.fromEntries(chunks.map((c) => [c.id, c]));
export const FPS = timing.fps;
const MISSING = 1e7;   // a chunk not voiced yet sits far beyond the end, so nothing of it renders

const at = (c: Chunk, ch: number) => {
  const A = c.anchors;
  for (let i = 1; i < A.length; i++) if (ch <= A[i][0]) {
    const [c0, t0] = A[i - 1], [c1, t1] = A[i];
    return t0 + ((ch - c0) / Math.max(1e-6, c1 - c0)) * (t1 - t0);
  }
  return A[A.length - 1][1];
};

export const start = (id: string) => (byId[id] ? Math.round(byId[id].start * FPS) : MISSING);
export const end = (id: string) => (byId[id] ? Math.round((byId[id].start + byId[id].dur) * FPS) : MISSING);
/** The next chunk's start (where this chunk's last beat should end), or the film's end. */
export const until = (id: string) => {
  const i = chunks.findIndex((c) => c.id === id);
  if (i < 0) return MISSING;
  return i + 1 < chunks.length ? start(chunks[i + 1].id) : timing.frames;
};

export function cue(id: string, phrase: string, n = 1, offset = 0): number {
  const c = byId[id];
  if (!c) return MISSING;
  let idx = -1;
  for (let k = 0; k < n; k++) { idx = c.text.indexOf(phrase, idx + 1); if (idx < 0) throw new Error(`cue: «${phrase}» #${n} not in ${id}`); }
  return Math.round((c.start + at(c, idx) + offset) * FPS);
}
/** Frame at which the phrase ends (good for reactions after a word). */
export const after = (id: string, phrase: string, n = 1, offset = 0) => {
  const c = byId[id];
  if (!c) return MISSING;
  const s = cue(id, phrase, n);
  let idx = -1;
  for (let k = 0; k < n; k++) idx = c.text.indexOf(phrase, idx + 1);
  return Math.round((c.start + at(c, idx + phrase.length) + offset) * FPS) || s;
};
