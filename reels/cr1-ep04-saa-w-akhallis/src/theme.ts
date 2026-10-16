import type { SvgLook } from '../../../motion-core/src/characters/SvgPerson';

export const FPS = 60;
export const W = 1080, H = 1920;

// «ساعة وأخلّصها»: a calm, cool living room (low saturation) where the meaning sits in two things — the
// clock (time) and the white flat-pack shelf. The afternoon slides into evening as the clock runs on;
// the second attempt starts at noon in full light. No yellow, orange or gold; no wood tones (they read orange).
export const C = {
  bg: '#F3F4F8', wall: '#E9E8F2', wallDeep: '#D9D7E7', floor: '#CFCDE0', floorLine: '#BAB7D0',
  ink: '#0E1626', text: '#0E1626', mist: '#5E6584', paper: '#FFFFFF', note: '#E4ECFA',
  dusk: '#2E3554', night: '#1C2238',
  // identity accents (marks and areas, not small text)
  blue: '#2E7BC5', red: '#E63946', green: '#10B981',
  // the meaning colours: time and the shelf
  clock: '#2E7BC5', clockDeep: '#1E5C99', panel: '#F7F8FB', panelEdge: '#C5CCDA', panelShade: '#DDE2EC',
  box: '#B3BDD0', boxShade: '#96A2BA', sofa: '#7E86B3', sofaShade: '#666E9C', plant: '#5FA48B', plantDeep: '#43806B',
  sky: '#BFD9EE', skyLow: '#E7F1F9', metal: '#9AA6BA', screen: '#E6F0FA',
  bookA: '#5B6BC2', bookB: '#C04E6E', bookC: '#3C8F87', bookD: '#7A5FB0',
} as const;

export const NASER: SvgLook = {
  skin: '#D29A86', skinShade: '#B27A67', hair: '#241B22', shirt: '#8E3B52', shirtShade: '#73293F',
  pants: '#4B5A78', pantsShade: '#3C4963', slipper: '#3E4A63', shoe: '#3E4A63', shoeShade: '#2E384E',
};

// 9:16 safe area (platform UI clear) and the caption band; titles take the top zone or, if a face is
// there, the zone just above the captions (src/stage.tsx keepOut)
export const SAFE = { x0: 96, x1: 900, y0: 220, y1: 1540 };
export const CAPTION_BOTTOM = 1522, CAPTION_TOP = 1330;
