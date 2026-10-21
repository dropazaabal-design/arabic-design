import type { Look } from '../../../motion-core/src/cartoon';

export const FPS = 60;

// Identity colours (CR1) carry meaning: blue explains, red marks the conflict, green applies.
// This episode's support palette is a sea-blue morning: teal sky, slate asphalt, a pearl car,
// plum and rose for people. No yellow, orange or gold; skin tones stay below hue 20°.
export const C = {
  blue: '#2E7BC5', red: '#E63946', green: '#10B981', night: '#101827', light: '#F4F5F2',
  ink: '#0E1626',
  skyTop: '#1B4A6B', skyLow: '#3F7598', haze: '#B7CCDD', rose: '#D46A8C', roseSoft: '#E9A5BB',
  plum: '#6D4C8D', plumDeep: '#4E3468', teal: '#2A9DA8', tealDeep: '#1D6F79', mint: '#8FD6CB',
  building: '#3D5F81', buildingLit: '#4C7397', window: '#5B82A6', windowLit: '#D2E9F6',
  asphalt: '#283A4E', asphaltLine: '#E3ECF4', curb: '#6A86A2', sidewalk: '#4F6A86',
  pearl: '#EEF2F6', pearlShade: '#C9D3DE', glint: '#B6E8F5', glass: '#2B4A66',
  oldCar: '#71808F', oldCarShade: '#56636F',
  mist: '#9AAFC3', paper: '#E8EEF4', stage: '#0F1E30', stageLow: '#0B1626',
} as const;

const skin = {
  light: { skin: '#E2B9AB', skinShade: '#C79584' },
  medium: { skin: '#C99282', skinShade: '#A8705F' },
  deep: { skin: '#9C6858', skinShade: '#7C4C3E' },
};

/** The cast. Same look for a character everywhere in the episode. */
export const CAST: Record<string, Look> = {
  majid: { ...skin.medium, hair: 'short', hairColor: '#231C24', beard: 'stubble', top: C.teal, topShade: C.tealDeep, collar: 'shirt', bottom: '#253247', shoes: '#141B26' },
  saad: { ...skin.light, hair: 'wavy', hairColor: '#2E2228', glasses: true, top: C.plum, topShade: C.plumDeep, collar: 'sweater', bottom: '#3B4658', shoes: '#1A1F2A', build: 1.04 },
  noura: { ...skin.medium, hair: 'hijab', hairColor: '#231C24', hijab: C.rose, top: '#3E6C80', topShade: '#2E5263', bottom: '#2E5263', dress: true, shoes: '#1E2430' },
  elder: { ...skin.deep, hair: 'bald', hairColor: '#B9B6C4', beard: 'full', top: '#2C4A73', topShade: '#20385A', collar: 'jacket', bottom: '#222C3C', shoes: '#11161F', build: 1.1 },
  young: { ...skin.deep, hair: 'short', hairColor: '#1D171C', top: '#5E7FA3', topShade: '#4A6688', collar: 'shirt', bottom: '#2B3445', shoes: '#151A24', build: 0.96 },
  guest: { ...skin.light, hair: 'short', hairColor: '#8E8A99', beard: 'stubble', glasses: true, top: '#2C3550', topShade: '#1F2740', collar: 'jacket', bottom: '#1E2433', shoes: '#0F131B', build: 1.02 },
  valet: { ...skin.light, hair: 'cap', hairColor: '#2A2027', cap: C.plumDeep, top: C.plum, topShade: C.plumDeep, collar: 'jacket', bottom: '#2A2F3F', shoes: '#11151D', build: 0.95 },
};

export type Profile = {
  w: number; h: number;
  safe: { x0: number; x1: number; y0: number; y1: number };
  title: number; body: number; caption: number;
};

export const PROFILES: Record<'16x9' | '9x16' | '4x5', Profile> = {
  '16x9': { w: 1920, h: 1080, safe: { x0: 154, x1: 1766, y0: 86, y1: 994 }, title: 84, body: 46, caption: 48 },
  '9x16': { w: 1080, h: 1920, safe: { x0: 96, x1: 900, y0: 220, y1: 1540 }, title: 80, body: 50, caption: 54 },
  '4x5': { w: 1080, h: 1350, safe: { x0: 86, x1: 994, y0: 108, y1: 1215 }, title: 72, body: 46, caption: 50 },
};
