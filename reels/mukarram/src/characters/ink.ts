// Shared drawing language for every doodle in this kit: one ink, one paper, a few functional colours,
// and shapes whose outlines wobble a little (seeded, so a shape is the same on every frame and only the
// stage's line boil moves it).

export const INK = '#1F2329';
export const PAL = {
  ink: INK,
  paper: '#F6F1E6',
  paperDeep: '#ECE4D4',
  white: '#FFFFFF',
  blue: '#2E7BC5',
  blueSoft: '#CFE0F2',
  red: '#E63946',
  redSoft: '#F6CDD1',
  teal: '#8FC1BE',
  navy: '#22304A',
  sage: '#A9BFA0',
  leaf: '#86B37E',
  leafDeep: '#5E9160',
  wood: '#A88565',
  woodDeep: '#7E6047',
  tan: '#C9A07A',
  tanLight: '#EED9BF',
  stone: '#C8C3B8',
  shadow: 'rgba(31,35,41,0.12)',
  glow: '#FFF6D8',
};

export const LINE = 7;
export const stroke = (w = LINE, color = INK) => ({ stroke: color, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

/** Deterministic 0..1 noise from an integer seed (mulberry32 step). */
export const rand = (seed: number) => {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type Pt = [number, number];

/** Closed smooth path through points (Catmull–Rom → cubic Bézier). */
export const closedPath = (pts: Pt[]) => {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
};

/** Open smooth path through points. */
export const openPath = (pts: Pt[]) => {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

/** A hand-drawn ellipse: radius jittered by `amp` (fraction) at `n` points, seeded. */
export const wobEllipse = (cx: number, cy: number, rx: number, ry: number, seed = 1, amp = 0.025, n = 10) => {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(seed * 97 + 3) * 0.3;
    const k = 1 + (rand(seed * 131 + i) - 0.5) * 2 * amp;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return closedPath(pts);
};

/** A hand-drawn rounded rectangle (corners as short arcs, edges slightly bowed). */
export const wobRect = (x: number, y: number, w: number, h: number, r = 14, seed = 1, amp = 2.5) => {
  const j = (i: number) => (rand(seed * 53 + i) - 0.5) * 2 * amp;
  const pts: Pt[] = [
    [x + r, y + j(1)], [x + w / 2, y + j(2)], [x + w - r, y + j(3)],
    [x + w + j(4), y + r], [x + w + j(5), y + h / 2], [x + w + j(6), y + h - r],
    [x + w - r, y + h + j(7)], [x + w / 2, y + h + j(8)], [x + r, y + h + j(9)],
    [x + j(10), y + h - r], [x + j(11), y + h / 2], [x + j(12), y + r],
  ];
  return closedPath(pts);
};

/** A slightly bowed line between two points (bow in px, signed). */
export const bowLine = (x1: number, y1: number, x2: number, y2: number, bow = 4) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${(mx - (dy / L) * bow).toFixed(1)} ${(my + (dx / L) * bow).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const deg = (d: number) => (d * Math.PI) / 180;
