// «كتاب وبس» keeps its blue / red / green roles; each part of the story gets its own light.
export const C = {
  blue: '#2E7BC5',
  blueLight: '#7DB6FF',
  blueDeep: '#1D5A99',
  red: '#E63946',
  redDeep: '#A4222E',
  green: '#10B981',
  greenDeep: '#0B7F5A',
  amber: '#F4B860',
  amberDeep: '#D9893B',
  coral: '#F28C6B',
  pink: '#E86A92',
  violet: '#6C4AB6',
  ivory: '#F6EBD9',
  paper: '#FBF4E6',
  ink: '#121A33',
  inkSoft: '#26314F',
  metal: '#4A5A7A',
  metalDark: '#2E3A55',
  metalLight: '#8EA3C7',
  wood: '#8A5A3B',
  woodLight: '#B07A50',
  woodDark: '#5E3B25',
  muted: '#8FA3BF',
};

/** Background of each part: [top, bottom] of the gradient. */
export const SKY: Record<string, [string, string]> = {
  night: ['#0B1226', '#1B2547'],
  study: ['#0C3138', '#15505A'],
  dusk: ['#1E1640', '#3A2A63'],
  split: ['#121A33', '#121A33'],
  plan: ['#0E2142', '#163566'],
  dawn: ['#2A2350', '#F28C6B'],
};

export const SAFE = { left: 100, right: 100, top: 160, bottom: 300 };
export const W = 1080;
export const H = 1920;
