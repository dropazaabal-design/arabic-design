import type { SvgLook } from '../../../motion-core/src/characters/SvgPerson';

export const FPS = 60;
export const W = 1080, H = 1920;

// «تأثير الفراشة»: a cool 1961 lab in mint and teal, a dark-green chalkboard, white paper. The meaning sits
// in two inks: blue for the first run, rose for the rerun, and one violet butterfly. No yellow, orange or
// gold; no wood (it reads orange): metal and painted surfaces only. Distinct from EP04's lavender room.
export const C = {
  bg: '#E6EFEC', wall: '#D3E3DE', wallDeep: '#BBD1CB', wallLine: '#A9C2BB', floor: '#5E807B', floorDeep: '#4D6B66', floorLine: '#6E918B',
  ink: '#0E1626', mist: '#4E6460', paper: '#FBFCFB', grid: '#D5E3DF', gridDeep: '#B6CBC5',
  run1: '#2F6FD0', run1Soft: '#9DBBEA', run2: '#C8336E', run2Soft: '#EBA9C3',
  teal: '#1F7A72', tealDeep: '#14514C', board: '#203C38', boardEdge: '#30524D', chalk: '#EAF2EF', chalkDim: '#A9BFBA',
  metal: '#9DB3AE', metalDeep: '#7A908B', metalLight: '#C6D6D2', panel: '#2B3B3D', lampOff: '#4C5F5C', lampOn: '#8FF0D2',
  sky: '#BFDCEB', skyLow: '#E3F0F6', night: '#223652', cloud: '#F6FAFB', door: '#8CA6A1', doorDeep: '#6F8A85',
  mug: '#3E5DAA', mugDeep: '#2D468A', coffee: '#3A2723', fly: '#5B4BD6', flyDeep: '#3E31A8', flySpot: '#C2BAF7',
  storm: '#5E6C8A', stormDeep: '#46516B', sun: '#E9F4FF',
} as const;

// Edward Lorenz as drawn here: light skin, dark hair, glasses, a white shirt and a wine tie (1961, MIT).
export const LORENZ: SvgLook = {
  skin: '#E3B6A8', skinShade: '#C4968A', hair: '#34363F', shirt: '#EEF2F3', shirtShade: '#C7D2D5',
  pants: '#55606E', pantsShade: '#434C58', slipper: '#2B313A', shoe: '#2B313A', shoeShade: '#1F242C',
};
export const WARDROBE = { glasses: '#1B2230', tie: '#8C2F4F', moustache: false } as const;

// 9:16 safe area (platform UI clear) and the caption band; titles take the top zone or, if a face is
// there, the zone just above the captions (src/stage.tsx keep-out)
export const SAFE = { x0: 96, x1: 900, y0: 220, y1: 1540 };
export const CAPTION_BOTTOM = 1522, CAPTION_TOP = 1350;
