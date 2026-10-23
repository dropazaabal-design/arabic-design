// The film's look in one place: palette, line weights and the hand-drawn line.
// Rule: no yellow, orange or gold — no colour with hue 20°–70°, saturation ≥ 0.25 and lightness 0.2–0.85
// (tools/palette.mjs checks every hex in src/). Woods and skins are taupe or rosy, never amber.
export const INK = '#2A2F3A';
export const PAL = {
  paper: '#F3F1EC', paperShade: '#E7E3DC',
  // walls
  wallMint: '#DCEBE7', wallBlue: '#DDE6F0', wallLav: '#E6E1EF', wallSage: '#DDE5D8', wallGrey: '#E9E6E1', wallNight: '#3A4258',
  // floors
  floor: '#CBC6BE', floorDark: '#B4AEA5', floorBlue: '#BCC6D1', rug: '#A9B7C9',
  // furniture
  wood: '#B8AFA6', woodDark: '#8F877F', table: '#C9D3DD', tableEdge: '#A8B4C1', chair: '#5B6B7A', chairDark: '#475563',
  sofa: '#7C8DA6', metal: '#9AA4AF', screen: '#2E3A4C', screenGlow: '#CFE3F2',
  // nature and metaphors
  plant: '#6E9A82', plantDark: '#4F7A63', water: '#7FB3C8', waterDeep: '#3F6F8C', waterLight: '#BFDCE6', sky: '#DDE3EE', skyEve: '#C9D0E6', skyNight: '#2F3A57',
  storm: '#6B7486', flameBlue: '#5C8FD6', flameCore: '#A9C8F2', steam: '#E8EDF2', rose: '#C77B97', plum: '#7D5A6B',
  // signal colours (story): calm green, provocation wine-red, warning rose, focus blue
  calm: '#3E8E7E', calmLight: '#BFE0D8', provoke: '#9A3C42', provokeLight: '#E9C6C9', warn: '#C2566F', focus: '#4F7FB8', focusLight: '#CFDDF0',
  text: '#2A2F3A', textSoft: '#5B6472',
} as const;
export const LINE = { bold: 5, normal: 3.6, fine: 2.4, far: 1.8 } as const;

/** Deterministic hash → 0..1 (no Math.random anywhere: every frame renders the same in any order). */
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/**
 * A hand-drawn polyline: each segment is split and nudged off the straight line by a seeded amount, so edges feel
 * drawn by hand. The wobble is fixed per seed — it never boils from frame to frame.
 */
export const sketch = (pts: [number, number][], seed = 1, wobble = 1.6, closed = false) => {
  const out: string[] = [];
  const P = closed ? [...pts, pts[0]] : pts;
  P.forEach((p, i) => {
    if (i === 0) { out.push(`M${p[0].toFixed(1)} ${p[1].toFixed(1)}`); return; }
    const a = P[i - 1];
    const len = Math.hypot(p[0] - a[0], p[1] - a[1]);
    const n = Math.max(1, Math.round(len / 60));
    const nx = -(p[1] - a[1]) / (len || 1), ny = (p[0] - a[0]) / (len || 1);
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const w = k === n ? 0 : (hash(seed * 31 + i * 7 + k) - 0.5) * 2 * wobble;
      const mx = a[0] + (p[0] - a[0]) * (t - 0.5 / n), my = a[1] + (p[1] - a[1]) * (t - 0.5 / n);
      out.push(`Q${(mx + nx * w).toFixed(1)} ${(my + ny * w).toFixed(1)} ${(a[0] + (p[0] - a[0]) * t).toFixed(1)} ${(a[1] + (p[1] - a[1]) * t).toFixed(1)}`);
    }
  });
  return out.join(' ') + (closed ? ' Z' : '');
};
/** A hand-drawn rectangle path (for fills and outlines). */
export const sketchRect = (x: number, y: number, w: number, h: number, seed = 1, wobble = 1.4) =>
  sketch([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed, wobble, true);
