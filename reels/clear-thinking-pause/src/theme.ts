// Identity colours: red = the impulse, blue = the pause, green = the calm choice. No yellow or orange.
export const C = {
  bg: '#16181C', bgGlow: '#1F2228', scrap: '#2A2D33', scrapLight: '#34373E',
  paper: '#E4E5E1', paperDark: '#D3D5D0', ink: '#1E2228', inkSoft: '#5B636F', line: '#BFC3C9',
  white: '#F4F5F2', mute: '#8E95A1', phone: '#0B0C0F', bezel: '#3A3E46',
  blue: '#2E7BC5', red: '#E63946', green: '#10B981', blueTint: '#DCE8F5',
};
export const W = 1080;
export const H = 1920;
// Platform-safe layout: ≥80 px side margins, nothing important in the last 300 px, and the lower
// half kept clear of the right-hand button rail (x > W - 140).
export const SAFE = { side: 80, bottom: H - 300, rail: W - 140 };
// The phone at rest, in canvas pixels.
export const PHONE = { x: 250, y: 400, w: 580, h: 960, inset: 16 };
export const SCREEN = { w: PHONE.w - 2 * PHONE.inset, h: PHONE.h - 2 * PHONE.inset };
// Hook at rest (moderate, above the content) and the handle under it.
export const HOOK = { y: 262, small: 66, big: 150, bigY: [560, 740] as const };
export const HANDLE = { y: 316 };
// Captions: bottom-anchored above the last 300 px, narrower than the space left of the rail.
export const CAPTION = { bottom: 1590, width: 780, size: 50 };
