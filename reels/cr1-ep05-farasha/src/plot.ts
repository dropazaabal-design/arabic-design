// The two runs Lorenz compared, as one shared curve and one that leaves it.
// t is weather time along the sheet, 0 … 1 (two months). The rerun starts from numbers rounded to three
// places, so its difference from the first run starts tiny and doubles about every four days (Lorenz,
// The Essence of Chaos): 0.067 of the sheet. By the second month nothing of the first curve is left.
const TAU = Math.PI * 2;
export const DOUBLE_EVERY = 4 / 60;
export const run1 = (t: number) => 0.52 * Math.sin(TAU * 2.3 * t + 0.4) + 0.3 * Math.sin(TAU * 5.2 * t + 1.1) + 0.16 * Math.sin(TAU * 9.7 * t + 2.0);
const other = (t: number) => 0.55 * Math.sin(TAU * 1.7 * t + 2.6) + 0.34 * Math.sin(TAU * 4.1 * t + 0.2) + 0.12 * Math.sin(TAU * 11.3 * t + 1.3);
/** The share of the gap that has grown by time t: 0.002 at the start, doubling every DOUBLE_EVERY, capped at 1. */
export const gap = (t: number) => Math.min(1, 0.002 * Math.pow(2, t / DOUBLE_EVERY));
export const run2 = (t: number) => run1(t) + gap(t) * (other(t) - run1(t));

/** SVG path for a run from t = a to t = b, right to left (Arabic reading order): t = 0 at x1. */
export const runPath = (fn: (t: number) => number, a: number, b: number, box: { x0: number; x1: number; y: number; amp: number }, n = 240) => {
  if (b <= a) return '';
  const pts: string[] = [];
  for (let k = 0; k <= n; k++) {
    const t = a + ((b - a) * k) / n;
    pts.push(`${k ? 'L' : 'M'}${(box.x1 - t * (box.x1 - box.x0)).toFixed(1)} ${(box.y - fn(t) * box.amp).toFixed(1)}`);
  }
  return pts.join(' ');
};
