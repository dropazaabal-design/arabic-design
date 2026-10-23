import { continueRender, delayRender, staticFile } from 'remotion';

// Tajawal for titles, Cairo for text (CR1 §7). Arabic and Latin subsets share one family and are
// picked by unicode-range; every face is loaded before the first frame, so nothing is measured or
// painted with a fallback font.
const ARABIC = 'U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC';
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2212';
const FACES: Array<[string, string, string]> = [
  ['Tajawal', '700', 'tajawal-700'],
  ['Tajawal', '800', 'tajawal-800'],
  ['Cairo', '600 700', 'cairo-var'],
];

let started = false;
export const loadFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender('Arabic fonts');
  const faces = FACES.flatMap(([family, weight, file]) => [
    new FontFace(family, `url(${staticFile(`fonts/${file}-arabic.woff2`)})`, { weight, unicodeRange: ARABIC, display: 'block' }),
    new FontFace(family, `url(${staticFile(`fonts/${file}-latin.woff2`)})`, { weight, unicodeRange: LATIN, display: 'block' }),
  ]);
  Promise.all(faces.map((f) => f.load().then((ff) => document.fonts.add(ff))))
    .then(() => document.fonts.ready)
    .then(() => continueRender(handle))
    .catch((e) => { throw new Error(`font load failed: ${e}`); });
};

export const TITLE = 'Tajawal, sans-serif';
export const BODY = 'Cairo, sans-serif';
