import type { gsap } from 'gsap';

// Reusable GSAP moves for useGsapTimeline (@remotion/gsap) builders. Each adds tweens to the builder's paused
// timeline at `at` seconds and returns the time it ends, so moves chain or overlap with plain arithmetic or GSAP's
// own position parameter. Targets are elements (the official hook refuses plain objects); for SVG pass the pivot
// as `svgOrigin` ("x y" in the element's user space) so the origin never depends on a measured bounding box.

type TL = gsap.core.Timeline;
type Target = gsap.TweenTarget;
type Pivot = { svgOrigin?: string; transformOrigin?: string };

/** Pop in with overshoot (follow-through on scale). */
export const popIn = (tl: TL, el: Target, at: number, { dur = 0.45, overshoot = 2.2, ...pivot }: { dur?: number; overshoot?: number } & Pivot = {}) => {
  tl.fromTo(el, { scale: 0, opacity: 0, ...pivot }, { scale: 1, opacity: 1, duration: dur, ease: `back.out(${overshoot})`, immediateRender: false }, at);
  return at + dur;
};

/** Anticipation → stretch → travel → squash on landing → settle. Moves by (dx, dy) and arcs `lift` px up. */
export const hop = (tl: TL, el: Target, at: number, { dx = 0, dy = 0, lift = 120, dur = 0.7, ...pivot }: { dx?: number; dy?: number; lift?: number; dur?: number } & Pivot = {}) => {
  const ant = dur * 0.22, air = dur * 0.5, land = dur * 0.28;
  tl.to(el, { scaleX: 1.12, scaleY: 0.86, duration: ant, ease: 'power2.out', ...pivot }, at)
    .to(el, { scaleX: 0.9, scaleY: 1.12, duration: air * 0.4, ease: 'power2.out' }, at + ant)
    .to(el, { x: `+=${dx}`, duration: air, ease: 'none' }, at + ant)
    .to(el, { y: `+=${dy - lift}`, duration: air / 2, ease: 'power2.out' }, at + ant)
    .to(el, { y: `+=${lift}`, duration: air / 2, ease: 'power2.in' }, at + ant + air / 2)
    .to(el, { scaleX: 1, scaleY: 1, duration: air * 0.6, ease: 'sine.inOut' }, at + ant + air * 0.4)
    .to(el, { scaleX: 1.14, scaleY: 0.84, duration: land * 0.35, ease: 'power2.out' }, at + ant + air)
    .to(el, { scaleX: 1, scaleY: 1, duration: land * 0.65, ease: 'elastic.out(1,0.45)' }, at + ant + air + land * 0.35);
  return at + dur;
};

/** Damped swing (follow-through / overlapping action): rotation overshoots and settles to 0. */
export const swing = (tl: TL, el: Target, at: number, { angle = 12, dur = 1.2, ...pivot }: { angle?: number; dur?: number } & Pivot = {}) => {
  const k = [angle, -angle * 0.55, angle * 0.3, -angle * 0.12, 0];
  k.forEach((r, i) => tl.to(el, { rotation: r, duration: dur / k.length, ease: i === 0 ? 'power2.out' : 'sine.inOut', ...(i === 0 ? pivot : {}) }, at + (i * dur) / k.length));
  return at + dur;
};

/** Impact shake that decays (deterministic keyframes, no random). */
export const shake = (tl: TL, el: Target, at: number, { amp = 12, dur = 0.36 }: { amp?: number; dur?: number } = {}) => {
  const k = [1, -0.8, 0.55, -0.3, 0.12, 0];
  k.forEach((v, i) => tl.to(el, { x: v * amp, y: (i % 2 ? -1 : 1) * v * amp * 0.4, duration: dur / k.length, ease: 'sine.inOut' }, at + (i * dur) / k.length));
  return at + dur;
};

/** Breathing pulse on an emphasis (a glow, a word): up and back, `n` times. */
export const pulse = (tl: TL, el: Target, at: number, { scale = 1.08, dur = 0.5, n = 1, ...pivot }: { scale?: number; dur?: number; n?: number } & Pivot = {}) => {
  for (let i = 0; i < n; i++) {
    tl.to(el, { scale, duration: dur / 2, ease: 'sine.out', ...pivot }, at + i * dur).to(el, { scale: 1, duration: dur / 2, ease: 'sine.in' }, at + i * dur + dur / 2);
  }
  return at + n * dur;
};

export type CamKey = { at: number; dur: number; cx: number; cy: number; zoom: number; rot?: number; ease?: string };

/** Camera moves on the two groups rendered by <GsapCamera>: zoom/rotate about the frame centre, pan in world space.
 *  Same composition as reels/mukarram's Shot: translate(W/2, H/2) · rotate · scale(zoom) · translate(−cx, −cy). */
export const camera = (tl: TL, zoomEl: Target, panEl: Target, start: Omit<CamKey, 'at' | 'dur' | 'ease'>, moves: CamKey[]) => {
  tl.set(zoomEl, { scale: start.zoom, rotation: start.rot ?? 0, svgOrigin: '0 0' }, 0).set(panEl, { x: -start.cx, y: -start.cy }, 0);
  let end = 0;
  for (const m of moves) {
    const e = m.ease ?? 'power2.inOut';
    tl.to(zoomEl, { scale: m.zoom, rotation: m.rot ?? 0, duration: m.dur, ease: e }, m.at).to(panEl, { x: -m.cx, y: -m.cy, duration: m.dur, ease: e }, m.at);
    end = Math.max(end, m.at + m.dur);
  }
  return end;
};
