// Identity colors (fixed for the account) and soft tints of them. Red warns, green chooses.
export const C = {
  blue: '#2E7BC5', red: '#E63946', green: '#10B981', navy: '#101827', light: '#F4F5F2', white: '#FFFFFF', text: '#20252E',
  aqua: '#ACD2D7', cardboard: '#C3A88C', cardboardDark: '#9A7D5D',
  aquaSoft: '#DCEDEF', redSoft: '#F7D3D6', greenSoft: '#CFF3E5', blueSoft: '#D5E5F5',
  ink: '#20252E', inkSoft: '#5B6372', paper: '#FBFBF8', line: '#C9CDD3', muted: '#8C95A6', navy2: '#1B2436',
};
export const W = 1080;
export const H = 1920;
// Reels / Shorts: keep words and key objects clear of the platform UI — the top bar, the right-hand
// buttons and the bottom caption/handle zone. Titles live in the TITLE band, burned captions in CAPS.
export const SAFE = { x: 72, top: 250, bottom: 1560, right: 900 };
export const TITLE = { y: 300 };
export const CAPS = { y: 1330 };
export type Bg = 'light' | 'navy';
