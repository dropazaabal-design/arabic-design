import { continueRender, delayRender } from 'remotion';
import cairo800a from '@mukarram-assets/fonts/cairo-800-arabic.woff2';
import cairo800l from '@mukarram-assets/fonts/cairo-800-latin.woff2';
import cairo900a from '@mukarram-assets/fonts/cairo-900-arabic.woff2';
import cairo900l from '@mukarram-assets/fonts/cairo-900-latin.woff2';

// The same Cairo faces and unicode ranges as reels/mukarram/src/video/fonts.ts, imported from that
// reel's assets (no copies). Every face is loaded before the first frame is captured.
const ARABIC = 'U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC, U+102E0-102FB, U+10E60-10E7E, U+10EC2-10EC4, U+10EFC-10EFF, U+1EE00-1EEFF';
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const FACES: Array<[string, string, string, string]> = [['800', cairo800a, cairo800l, ''], ['900', cairo900a, cairo900l, '']];

let started = false;
export const loadFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender('Arabic fonts');
  const faces = FACES.flatMap(([weight, ar, la]) => [
    new FontFace('Cairo', `url(${ar})`, { weight, unicodeRange: ARABIC, display: 'block' }),
    new FontFace('Cairo', `url(${la})`, { weight, unicodeRange: LATIN, display: 'block' }),
  ]);
  Promise.all(faces.map((f) => f.load().then((ff) => document.fonts.add(ff))))
    .then(() => document.fonts.ready)
    .then(() => continueRender(handle))
    .catch((e) => { throw new Error(`font load failed: ${e}`); });
};
export const TITLE_FONT = 'Cairo, sans-serif';
