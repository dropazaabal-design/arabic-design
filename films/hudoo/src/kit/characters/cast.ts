// The cast: one rig, different clothes. No yellow, orange or gold anywhere (skins sit at rosy hues below 20°).
export type Look = {
  name: string;
  skin: string; hair: 'short' | 'quiff' | 'side' | 'kid' | 'hijab' | 'none'; hairColor: string; brow?: string;
  shirt: string; shirtShade: string; pants: string; shoe: string; collar: 'shirt' | 'v' | 'round';
  scarf?: string; scarfShade?: string; robe?: string; glasses?: string; beard?: boolean;
  /** Build: 1 = the hero; the provoker is a little broader, a child smaller. */
  build: number; size: number;
};

export const CAST = {
  // سليم: the hero. Calm green, one constant silhouette from the first shot to the last.
  salim: { name: 'سليم', skin: '#F4E6E1', hair: 'short', hairColor: '#2E2A30', shirt: '#3E8E7E', shirtShade: '#2F6F62', pants: '#2E3E52', shoe: '#22262E', collar: 'shirt', build: 1, size: 1 },
  // جاسر: the provoker. Wine red, a quiff, sharper default brows.
  jaser: { name: 'جاسر', skin: '#EAD6CF', hair: 'quiff', hairColor: '#1F1B1E', shirt: '#9A3C42', shirtShade: '#772E35', pants: '#3A3138', shoe: '#1E1A1C', collar: 'v', build: 1.1, size: 1.02 },
  // منى: the team's manager.
  mona: { name: 'منى', skin: '#F1E2DC', hair: 'hijab', hairColor: '#2E2A30', scarf: '#7B6AA8', scarfShade: '#5E4F86', shirt: '#4E4775', shirtShade: '#3D375E', pants: '#3D375E', robe: '#4E4775', shoe: '#2A2F3A', collar: 'round', build: 0.95, size: 0.97 },
  // ريم: his sister.
  reem: { name: 'ريم', skin: '#F3E6E1', hair: 'hijab', hairColor: '#2E2A30', scarf: '#C77B97', scarfShade: '#A35E79', shirt: '#6A5A7E', shirtShade: '#54476A', pants: '#54476A', robe: '#5B4E6B', shoe: '#2A2F3A', collar: 'round', build: 0.92, size: 0.95 },
  // هادي: a colleague at the table.
  hadi: { name: 'هادي', skin: '#E8D5CF', hair: 'side', hairColor: '#3B3540', glasses: '#2A2F3A', shirt: '#5C7389', shirtShade: '#4A5E72', pants: '#333A45', shoe: '#22262E', collar: 'shirt', build: 1, size: 1 },
  // the rest of the meeting
  att1: { name: 'زميل', skin: '#EFDDD7', hair: 'short', hairColor: '#4A3F45', shirt: '#6E8B74', shirtShade: '#57705D', pants: '#38404A', shoe: '#22262E', collar: 'round', build: 1.05, size: 0.98, beard: true },
  att2: { name: 'زميلة', skin: '#F2E4DF', hair: 'hijab', hairColor: '#2E2A30', scarf: '#9A8FC0', scarfShade: '#7C71A3', shirt: '#7A6E9E', shirtShade: '#625785', pants: '#4A4260', robe: '#5E5480', shoe: '#2A2F3A', collar: 'round', build: 0.92, size: 0.95 },
  att3: { name: 'زميل', skin: '#E3CEC8', hair: 'side', hairColor: '#26232A', shirt: '#4F6D8F', shirtShade: '#3E5874', pants: '#2C3440', shoe: '#22262E', collar: 'shirt', build: 1, size: 1.01 },
  mother: { name: 'الأم', skin: '#F0E0DA', hair: 'hijab', hairColor: '#2E2A30', scarf: '#6E8B88', scarfShade: '#55706D', shirt: '#4D5E66', shirtShade: '#3C4A51', pants: '#3C4A51', robe: '#4D5E66', shoe: '#2A2F3A', collar: 'round', build: 0.98, size: 0.95 },
} satisfies Record<string, Look>;
export type Who = keyof typeof CAST;
