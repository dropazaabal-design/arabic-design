import { continueRender, delayRender, staticFile } from 'remotion';

// The four families the user chose: Alexandria (headings), Reem Kufi Fun (playful emphasis labels),
// Readex Pro (captions and body), Cairo (numbers). All faces load before the first frame.
const FACES: Array<[string, string, string]> = [
  ['Alexandria', '700', 'Alexandria-Bold'], ['Alexandria', '800', 'Alexandria-ExtraBold'], ['Alexandria', '900', 'Alexandria-Black'],
  ['Reem Kufi Fun', '700', 'ReemKufiFun-Bold'],
  ['Readex Pro', '500', 'ReadexPro-Medium'], ['Readex Pro', '600', 'ReadexPro-SemiBold'], ['Readex Pro', '700', 'ReadexPro-Bold'],
  ['Cairo', '700', 'Cairo-Bold'], ['Cairo', '900', 'Cairo-Black'],
];

let started = false;
export const loadFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender('fonts');
  Promise.all(FACES.map(([family, weight, file]) => new FontFace(family, `url(${staticFile(`fonts/${file}.ttf`)})`, { weight, display: 'block' })
    .load().then((f) => document.fonts.add(f))))
    .then(() => document.fonts.ready)
    .then(() => continueRender(handle))
    .catch((e) => { throw new Error(`font load failed: ${e}`); });
};

export const TITLE = 'Alexandria, sans-serif';
export const FUN = '"Reem Kufi Fun", sans-serif';
export const BODY = '"Readex Pro", sans-serif';
export const NUM = 'Cairo, sans-serif';
