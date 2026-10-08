// Identity colors (fixed for the series) + colors sampled from the used edition's cover (palette.json), plus soft tints of them.
export const C = {
  blue: '#2E7BC5', red: '#E63946', green: '#10B981', navy: '#101827', light: '#F4F5F2', white: '#FFFFFF', text: '#20252E',
  aqua: '#ACD2D7', cardboard: '#C3A88C', cardboardDark: '#9A7D5D', // sampled from the Arabic edition's cover (palette.json)
  aquaSoft: '#DCEDEF', redSoft: '#F7D3D6', greenSoft: '#CFF3E5', blueSoft: '#D5E5F5',
  ink: '#20252E', inkSoft: '#5B6372', paper: '#FBFBF8', line: '#C9CDD3', muted: '#8C95A6', navy2: '#1B2436',
};
export const W = 1920;
export const H = 1080;
// Safe area: 8% of each dimension.
export const SAFE = { x: 154, y: 86 };
export type Bg = 'light' | 'navy';
