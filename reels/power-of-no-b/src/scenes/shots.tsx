import React from 'react';
import { PAL, clamp } from '@mukarram/characters/ink';
import { Cam, Shot } from '@mukarram/video/stage';
import { C } from '../characters/studio';
import { TITLE_FONT } from '../video/fonts';
import { ease, keys, prog } from '../video/time';
import { ShotProps } from './common';
import { B, BOUNDS, CLOCK, World, WorldOpts, worker } from './world';

export type { ShotProps };

// Thirty framings of the one studio (scenes/world.tsx). The characters act every beat with their bodies; the
// camera only frames, pushes a little, and shakes once when the door slams. The imagination is the same angle
// with the lights going out, and reality cuts back to that angle.

const View: React.FC<{ f: number; cam: Cam; o?: WorldOpts; overlay?: React.ReactNode }> = ({ f, cam, o, overlay }) => (
  <Shot f={f} cam={cam} bounds={BOUNDS} bg={C.wall} overlay={overlay}><World f={f} o={o} /></Shot>
);
const k2 = (f: number, t0: number, t1: number, a: number, b: number) => keys(f, [[t0, a], [t1, b]], ease.inOut);
const wx = (f: number) => worker(f).at.x;

/** A rounded Arabic label (the concept's name), same style as reels/boiling-frog's Pill. */
const Pill: React.FC<{ text: string; p: number; top?: number }> = ({ text, p, top = 330 }) => (
  <div style={{ position: 'absolute', left: 60, right: 60, top, display: 'flex', justifyContent: 'center', opacity: clamp(p * 1.5), transform: `scale(${0.8 + 0.2 * p}) rotate(${(1 - p) * 3}deg)` }}>
    <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 86, lineHeight: 1.3, color: PAL.ink, background: C.soft, padding: '0.06em 0.6em 0.2em', borderRadius: 999, border: `7px solid ${PAL.ink}`, boxShadow: `0 9px 0 ${PAL.red}`, whiteSpace: 'nowrap' }}>{text}</div>
  </div>
);

/** Big leaves sweeping toward the lens (screen space), p 0..1. */
const LeavesFG: React.FC<{ p: number }> = ({ p }) => p <= 0 ? null : (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
    {[[1120, 520, -40, 1.0], [1180, 1000, -70, 1.3], [1060, 1420, -110, 0.9]].map(([x, y, r, s], i) => {
      const k = clamp(p * 1.4 - i * 0.15);
      return (
        <g key={i} transform={`translate(${x - 420 * k} ${y}) rotate(${r * k}) scale(${s * (0.6 + 0.9 * k)})`} opacity={clamp(k * 3)}>
          <path d="M0 0 Q-160 -120 -420 0 Q-160 120 0 0Z" fill={i % 2 ? PAL.leaf : PAL.leafDeep} stroke={PAL.ink} strokeWidth={9} strokeLinejoin="round" />
          <path d="M0 0 L-400 0" stroke={PAL.ink} strokeWidth={6} opacity={0.6} />
        </g>
      );
    })}
  </svg>
);

/** «إعجاب» and «متابعة» — two small Arabic icons for the last two seconds. */
const Icons: React.FC<{ p: number }> = ({ p }) => (
  <div dir="rtl" style={{ position: 'absolute', left: 0, right: 0, top: 1300, display: 'flex', justifyContent: 'center', gap: 40, opacity: clamp(p * 2), transform: `translateY(${(1 - clamp(p)) * 40}px)` }}>
    {[['إعجاب', 'M0 14 C-34 -10 -22 -40 0 -20 C22 -40 34 -10 0 14Z', PAL.red], ['متابعة', 'M-16 -2 L16 -2 M0 -18 L0 14', PAL.blue]].map(([t, d, c], i) => (
      <div key={i} dir="rtl" lang="ar" style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 62, color: PAL.ink, background: C.soft, padding: '6px 34px 14px', borderRadius: 999, border: `6px solid ${PAL.ink}`, boxShadow: `0 7px 0 ${c}` }}>
        <svg width={58} height={58} viewBox="-29 -29 58 58"><circle r={26} fill={c} stroke={PAL.ink} strokeWidth={4} /><path d={d} fill={i ? 'none' : PAL.white} stroke={PAL.white} strokeWidth={i ? 7 : 0} strokeLinecap="round" /></svg>
        {t}
      </div>
    ))}
  </div>
);

/* 01–03 · the hook: he heads for the door; a cup comes through it and lands in his hand */
export const HookWide: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: k2(f, t0, t1, 520, 300), cy: 1230, zoom: k2(f, t0, t1, 1.12, 1.22) }} />;
export const CupLand: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: 180, cy: 1235, zoom: k2(f, t0, t1, 1.95, 2.1) }} />;
export const AskSure: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: 235, cy: 1215, zoom: k2(f, t0, t1, 1.55, 1.62) }} />;

/* 04–08 · the pile */
export const BagIn: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: 420, cy: 1195, zoom: k2(f, t0, t1, 1.2, 1.27) }} />;
export const PlantIn: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: 470, cy: 1185, zoom: k2(f, t0, t1, 1.34, 1.4) }} />;
export const StrainFace: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: wx(t0) + 40, cy: 1150, zoom: k2(f, t0, t1, 2.5, 2.65) }} />;
export const AllLeave: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: k2(f, t0, t1, 560, 640), cy: 1220, zoom: 1.05 }} />;
export const TryStep: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: 250, cy: 1205, zoom: k2(f, t0, t1, 1.36, 1.12) }} />;

/* 09–14 · the chain: phone → cup → chin → plant → coat → clock → the swallowed sentence */
export const Buzz: React.FC<ShotProps> = ({ f, t0 }) => <View f={f} cam={{ cx: wx(t0) - 60, cy: 1225, zoom: 2.75 }} />;
export const Finger: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: wx(t0) - 10, cy: 1225, zoom: k2(f, t0, t1, 1.7, 1.8) }} />;
export const Chin: React.FC<ShotProps> = ({ f, t0 }) => <View f={f} cam={{ cx: wx(t0) - 20, cy: 1215, zoom: 2.45 }} />;
export const PlantTilt: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  return <View f={f} cam={{ cx: wx(t0) + 90, cy: 1180, zoom: k2(f, t0, t1, 2.2, 2.35) }} overlay={<LeavesFG p={prog(f, b.tilt + 4, 16, ease.out)} />} />;
};
export const Stagger: React.FC<ShotProps> = ({ f }) => {
  const b = B();
  const shake = f >= b.shut && f < b.shut + 8 ? 9 * (1 - (f - b.shut) / 8) : 0;
  return <View f={f} cam={{ cx: 300, cy: 1200, zoom: 1.25, shake }} />;
};
export const Clock: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: CLOCK[0] - 40, cy: 990, zoom: k2(f, t0, t1, 1.95, 2.05) }} />;
export const ListSwallow: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: 390, cy: 1060, zoom: k2(f, t0, t1, 1.55, 1.62) }} />;

/* 15–19 · the desk, the imagination, «لا», the silence, «تمام» — one angle */
const TWO: Cam = { cx: 400, cy: 1180, zoom: 1.45 };
export const DeskAsk: React.FC<ShotProps> = ({ f }) => <View f={f} cam={TWO} />;
export const Imagine: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  return <View f={f} cam={{ ...TWO, zoom: k2(f, t0, t1, 1.45, 1.6), shake: f >= b.lightsOff && f < b.lightsOff + 10 ? 3 : 0 }}
    o={{ imagine: prog(f, t0, 8, ease.out), masks: prog(f, b.masks - 4, 12, ease.back), lightsOff: prog(f, b.lightsOff + 4, 10, ease.linear), doorAway: prog(f, b.imag0 + 6, 40, ease.inOut) }} />;
};
export const Reality: React.FC<ShotProps> = ({ f }) => <View f={f} cam={TWO} />;
export const CupTremble: React.FC<ShotProps> = ({ f, t0 }) => {
  const c = worker(t0).cup?.p ?? [300, 1250];
  return <View f={f} cam={{ cx: c[0] + 30, cy: c[1] - 60, zoom: 3.0 }} />;
};
export const Tamam: React.FC<ShotProps> = ({ f }) => <View f={f} cam={TWO} />;

/* 20–23 · everyone takes their own */
export const DeskPush: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: k2(f, t0, t1, 820, 960), cy: 1220, zoom: 1.05 }} />;
export const BagBack: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: 380, cy: 1200, zoom: k2(f, t0, t1, 1.48, 1.55) }} />;
export const PlantBack: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: 410, cy: 1150, zoom: k2(f, t0, t1, 1.7, 1.78) }} />;
export const Free: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: k2(f, t0, t1, 210, 270), cy: 1190, zoom: k2(f, t0, t1, 1.5, 1.62) }} />;

/* 24–26 · the meaning: an imagined frown weighs more than the load */
export const MaskWeigh: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: 270, cy: 1150, zoom: k2(f, t0, t1, 1.85, 1.95) }} />;
export const Name: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  return <View f={f} cam={{ cx: 280, cy: 1130, zoom: k2(f, t0, t1, 2.1, 2.2) }} overlay={<Pill top={1360} text="السوسيوتروبيّة" p={prog(f, b.name - 3, 9, ease.back) * (1 - prog(f, t1 - 8, 8, ease.in))} />} />;
};
export const WaveWalk: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: k2(f, t0, t1, 640, 560), cy: 1220, zoom: 1.0 }} />;

/* 27–30 · the lid, and the call to action */
export const Peek: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: 420, cy: 1180, zoom: k2(f, t0, t1, 1.58, 1.66) }} />;
export const LidReveal: React.FC<ShotProps> = ({ f, t0, t1 }) => <View f={f} cam={{ cx: 410, cy: 1210, zoom: k2(f, t0, t1, 1.9, 2.0) }} />;
export const Cta: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  return <View f={f} cam={{ cx: 360, cy: 1150, zoom: k2(f, t0, t1, 1.85, 1.95) }} overlay={<Icons p={prog(f, b.icons, 10, ease.back)} />} />;
};
