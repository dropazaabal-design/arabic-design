import timeline from '../../timeline.json';
import words from './words.json';

// The measured take on the reel's timeline, in seconds (fps-independent: the scene is authored in seconds and
// sampled at whatever fps the composition runs, 60 for the reel, 30 for the 30/60 check).
export const TL = timeline;

const clean = (x: string) => x.replace(/[«»،.:؟…!؛]/g, '').replace(/[ً-ْـ]/g, '');
type W = { seg: string; w: string; start: number; end: number };
const find = (segId: string, w: string, n = 0) => {
  const hit = (words as W[]).filter((x) => x.seg === segId && clean(x.w).startsWith(clean(w)))[n];
  if (!hit) throw new Error(`no word ${w} in ${segId}`);
  return hit;
};
/** Seconds at which a spoken word starts / ends (n = which occurrence in the line). */
export const wordAt = (segId: string, w: string, n = 0) => find(segId, w, n).start;
export const wordEnd = (segId: string, w: string, n = 0) => find(segId, w, n).end;

/** One gain for the whole mix (voice and effects), set from the measured audio-only render (npm run mix). */
export const MIX_GAIN = 10 ** (0.7 / 20);   // measured mix −16.68 LUFS / −6.25 dBTP → −16.0
