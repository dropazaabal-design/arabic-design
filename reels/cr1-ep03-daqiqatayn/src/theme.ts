import type { SvgLook } from '../../../motion-core/src/characters/SvgPerson';

export const FPS = 60;
export const W = 1080, H = 1920;

// «دقيقتين بس»: a calm light room (low saturation) so the character and the one object that matters —
// the new running shoes — carry the colour. Dawn scenes cool and dim; the decision brightens the room.
// No yellow, orange or gold; skin stays below hue 20°.
export const C = {
  bg: '#F4F7FB', env: '#DFEAF3', envDeep: '#C9D8E6', wall: '#E8EFF6', floor: '#CBD7E3', floorLine: '#B5C4D4',
  ink: '#0E1626', text: '#0E1626', mist: '#5D7189', dawn: '#2B3C57', dawnLow: '#3E5272', night: '#1B2840',
  // identity accents (kept for marks and areas, not small text: see the colour report)
  blue: '#2E7BC5', red: '#E63946', green: '#10B981',
  shoe: '#12A39A', shoeShade: '#0B7D76', box: '#9FB2C8', boxShade: '#7F95AE', boxLid: '#B4C4D6',
  paper: '#FFFFFF', note: '#E4ECFA', marker: '#3B4BA8', bed: '#7C8FB8', bedShade: '#62759E', blanket: '#94A6CC',
  wood: '#8D8FA8', woodShade: '#72748E', sky: '#BFD9EE', skyLow: '#E7F1F9', grass: '#7FB59A', path: '#D7DEE6',
} as const;

export const SULTAN: SvgLook = {
  skin: '#C98F7E', skinShade: '#A9705F', hair: '#2A1F27', shirt: '#5E6BC4', shirtShade: '#4A55A3',
  pants: '#6E7F99', pantsShade: '#5A6A83', slipper: '#3E4A63', shoe: C.shoe, shoeShade: C.shoeShade,
};

// 9:16 safe area (platform UI clear) and the caption baseline; titles sit at the top, captions above y 1522
export const SAFE = { x0: 96, x1: 900, y0: 220, y1: 1540 };
export const CAPTION_BOTTOM = 1522;
