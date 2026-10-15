// Kitab wa Bas identity (CR1 §7) + this episode's supporting palette (logged in episode-brief.json).
// Yellow, orange and gold are banned in designed elements; tools/palette.mjs fails the build on them.
export const C = {
  // identity
  blue: '#2E7BC5', // explanation
  red: '#E63946', // conflict
  green: '#10B981', // application
  night: '#101827', // neutral dark
  light: '#F4F5F2', // neutral light
  // ep01 support: indigo night room, slate desk, lilac book
  wall: '#141D33', wallLow: '#0F1729', desk: '#2B3B5E', deskTop: '#384B73', deskEdge: '#223050',
  drawer: '#33456B', drawerFront: '#3E5480', lilac: '#A99CE8', lilacDeep: '#7D6FCB',
  mist: '#8E9AB8', ink: '#0B1220', glow: '#D6E6F8', screenOff: '#1B2643', paperShade: '#DCDFE6',
};

export type Profile = {
  id: '16x9' | '9x16' | '4x5';
  w: number; h: number;
  safe: { x0: number; x1: number; y0: number; y1: number }; // CR1 §8 initial safe areas (origin top-left)
  title: number; body: number; caption: number; // px, inside the §8 starting ranges
};
export const PROFILES: Record<Profile['id'], Profile> = {
  '16x9': { id: '16x9', w: 1920, h: 1080, safe: { x0: 154, x1: 1766, y0: 86, y1: 994 }, title: 88, body: 48, caption: 48 },
  '9x16': { id: '9x16', w: 1080, h: 1920, safe: { x0: 96, x1: 900, y0: 220, y1: 1540 }, title: 84, body: 54, caption: 56 },
  '4x5': { id: '4x5', w: 1080, h: 1350, safe: { x0: 86, x1: 994, y0: 108, y1: 1215 }, title: 76, body: 50, caption: 52 },
};
export const FPS = 60;
