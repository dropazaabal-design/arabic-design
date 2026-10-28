import { continueRender, delayRender } from 'remotion';
import cairo800a from '@mukarram-assets/fonts/cairo-800-arabic.woff2';
import cairo800l from '@mukarram-assets/fonts/cairo-800-latin.woff2';
import cairo900a from '@mukarram-assets/fonts/cairo-900-arabic.woff2';
import cairo900l from '@mukarram-assets/fonts/cairo-900-latin.woff2';
import tajawal700a from '@mukarram-assets/fonts/tajawal-700-arabic.woff2';
import tajawal700l from '@mukarram-assets/fonts/tajawal-700-latin.woff2';
import amiri700a from '../../assets/fonts/amiri-700-arabic.woff2';

// Cairo (titles) and Tajawal (source lines) from reels/mukarram's assets (no copies); Amiri (OFL, Google Fonts, Arabic
// subset) for the hadith and the verse: a naskh that sets full tashkeel and the ornate brackets ﴿﴾ correctly.
// Every face is loaded before the first frame is captured.
const ARABIC = 'U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC';
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const FACES: Array<[family: string, weight: string, url: string, range: string]> = [
  ['Cairo', '800', cairo800a, ARABIC], ['Cairo', '800', cairo800l, LATIN], ['Cairo', '900', cairo900a, ARABIC], ['Cairo', '900', cairo900l, LATIN],
  ['Tajawal', '700', tajawal700a, ARABIC], ['Tajawal', '700', tajawal700l, LATIN],
  ['Amiri', '700', amiri700a, ARABIC],
];

let started = false;
export const loadFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender('Arabic fonts');
  const faces = FACES.map(([family, weight, url, unicodeRange]) => new FontFace(family, `url(${url})`, { weight, unicodeRange, display: 'block' }));
  Promise.all(faces.map((f) => f.load().then((ff) => document.fonts.add(ff))))
    .then(() => document.fonts.ready)
    .then(() => continueRender(handle))
    .catch((e) => { throw new Error(`font load failed: ${e}`); });
};
