import type { Look } from './kit';

// «كتاب وبس»: navy, white and the brand blue #2E7BC5. Red only for an angry rating, green only for «نشتغل عليها».
// No yellow, orange or gold anywhere (tools/palette.mjs of the film checks hue 20°–70°).
export const B = {
  navy: '#0F1E3A', navy2: '#1B2D52', navy3: '#2A3F69', blue: '#2E7BC5', blueDark: '#23629E', blueLight: '#D6E6F5', mist: '#EAF2FB',
  white: '#FFFFFF', paper: '#F7F9FC', grey: '#8A96A8', greyLight: '#DDE3EB', greyMid: '#B9C3D0', ink: '#2A2F3A',
  red: '#D2434F', redLight: '#F6D9DC', green: '#1E9E6A', greenLight: '#D3F0E3',
  wallEve: '#C9D4E3', wallDay: '#E3EBF5', skyEve: '#1B2D52', skyDay: '#CFE2F5', desk: '#B9C6D6', deskEdge: '#93A3B8',
};

/** نايف: one look from the first frame to the last. In the office inside his head he adds a headset and a tie. */
export const NAIF: Look = {
  name: 'نايف', skin: '#F2E2DC', hair: 'short', hairColor: '#2A2630', shirt: B.blue, shirtShade: B.blueDark,
  pants: '#1F2A44', shoe: '#1A1F2B', collar: 'shirt', build: 1, size: 1,
};
