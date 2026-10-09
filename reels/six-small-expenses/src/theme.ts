// كتاب وبس: blue and green for the symbols, red for the second title line; no yellow or orange.
export const C = {
  black: '#000000', band: '#EAEAEA', ink: '#111111', body: '#363636', red: '#E63946',
  blue: '#2E7BC5', blueDark: '#1F5E9C', green: '#10B981', greenDark: '#0B8A61', paper: '#FAFAFA', rule: '#BDBDBD', handle: '#8C8C8C',
};
export const W = 1080, H = 1920, FPS = 30, FRAMES = 394;          // 13.13 s
// Vertical plan (px): symbols 0–350 · title band 350–634 · list band 644–1580 · quiet black below.
export const BAND = { titleTop: 350, titleBottom: 634, listTop: 644, listBottom: 1580 };
// Side margins: 64 px; the list keeps 120 px on the right, clear of the platform's button column.
export const MARGIN = { side: 64, listRight: 120 };
