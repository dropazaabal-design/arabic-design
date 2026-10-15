import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CamKey, GsapCamera, tween } from '@motion/index';
import { Cap } from '@mukarram/characters/cast';
import { BUILDS } from '@mukarram/characters/cast';
import { Expression, ExprName } from '@mukarram/characters/face';
import { INK, LINE, lerp, stroke, wobEllipse, wobRect } from '@mukarram/characters/ink';
import { BUILD, Build, POSES, Person, Pose, blinkAt, breath } from '@mukarram/characters/rig';
import { Boil } from '@mukarram/video/stage';
import { handAt, reachB } from '../../../power-of-no-b/src/characters/worker';
import { sitBuild } from '../../../sunk-cost-a/src/scene/kit';

export const W = 1080, H = 1920;
export { sitBuild };

/** Reel B's palette: daylight cobalt and mint for the trip, lilac dunes for the desert, deep space for the globe.
 *  No yellow, orange or gold (the brief); distinct from Reel A's night plum and from the earlier reels. */
export const C = {
  sky: '#BFE6F2', skyHi: '#E6F6FA', cloud: '#FFFFFF',
  road: '#7E7A99', roadLine: '#F2F2F7', curb: '#B7B4CC', walk: '#D9D6E6',
  bus: '#2A55C9', busDeep: '#1C3C93', busWin: '#CFEFF7', stripe: '#F2F2F7', led: '#0E1630', ledOn: '#7CF0D6',
  city1: '#9AA3E0', city2: '#7CC9C0', city3: '#C7B8EA', cityWin: '#EAF6FF',
  grass: '#6CBF84', grassDeep: '#4C9A66', field: '#9ED39F',
  dune: '#E3C4DA', duneDeep: '#C79BC0', cactus: '#4C9A66',
  snow: '#F4F8FF', ice: '#BFD8F2', mountain: '#8FA6D8',
  sea: '#3FA7B5', seaDeep: '#2C7F8C', ferry: '#F2F2F7',
  space: '#16213E', star: '#E8F0FF', globeSea: '#3E7CC2', globeLand: '#6CBF84',
  hero: '#3BAA8C', heroDeep: '#2A7F68', cap: '#2A55C9', aunt: '#9B7FD0', scarf: '#C2477F', knit: '#D2558D',
  seat: '#5B6BB5', seatDeep: '#3E4C8F', pole: '#B7B4CC', interior: '#E7ECF7', panel: '#D5DBEE', floor: '#9AA0BF',
  map: '#EAF0E6', mapBlock: '#D7E2D2', mapRoad: '#B7B4CC', water: '#8FD0DA', waterDeep: '#5FB4C2', pin: '#E0479E', beard: '#F4F4F8',
};
export const FONT = 'Cairo, sans-serif';
export const s30 = (s: number) => s * 30;

/** One shot: background, the world under a GSAP camera (local seconds), the doodle boil, HTML overlays. */
export const Frame: React.FC<{ T: number; bg: string; start: { cx: number; cy: number; zoom: number; rot?: number }; moves?: CamKey[]; children: React.ReactNode; overlay?: React.ReactNode }> = ({ T, bg, start, moves = [], children, overlay }) => (
  <AbsoluteFill style={{ background: bg }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <defs><Boil t={T} /></defs>
      <GsapCamera width={W} height={H} start={start} moves={moves}>
        <g filter="url(#boil)">{children}</g>
      </GsapCamera>
    </svg>
    {overlay}
  </AbsoluteFill>
);

/* ---------------- cast ---------------- */

export const HERO_B: Build = { ...BUILD, ...BUILDS.litterer, shirt: C.hero, shoe: C.busDeep, seed: 83 } as Build;
export const AUNT_B: Build = { ...BUILD, ...BUILDS.spitter, shirt: C.aunt, shoe: C.seatDeep, seed: 97, headRX: 86, headRY: 86 } as Build;

/** A beard that grows with the years (0 = none, 1 = to the knees); colour goes from dark to white with `age`. */
const Beard: React.FC<{ rx: number; ry: number; len: number; age: number }> = ({ rx, ry, len, age }) => {
  if (len <= 0.01) return null;
  const c = age > 0.5 ? C.beard : '#5A4E58';
  const L = ry * 0.6 + len * 420;
  return <path d={`M${-rx * 0.82} ${ry * 0.2} Q${-rx * 0.9} ${ry * 0.2 + L * 0.6} ${-rx * 0.1} ${ry * 0.2 + L} Q0 ${ry * 0.2 + L + 24} ${rx * 0.1} ${ry * 0.2 + L} Q${rx * 0.9} ${ry * 0.2 + L * 0.6} ${rx * 0.82} ${ry * 0.2} Q0 ${ry * 0.62} ${-rx * 0.82} ${ry * 0.2}Z`} fill={c} {...stroke(LINE * 0.8)} />;
};

export type ActorProps = {
  x: number; y: number; s: number; T: number; pose?: Pose; expr?: Expression | ExprName; look?: [number, number];
  sit?: number; facing?: 1 | -1; handL?: [number, number] | null; handR?: [number, number] | null; holdL?: React.ReactNode; holdR?: React.ReactNode; opacity?: number;
};

const useHands = (b: Build, p: ActorProps) => {
  const at = { x: p.x, y: p.y, s: p.s, facing: p.facing ?? 1, bob: breath(s30(p.T), 30, b.seed) * 2 };
  const pose = p.handL || p.handR ? reachB(b, p.pose ?? (POSES.stand as Pose), at, p.handL ?? null, p.handR ?? null, { L: 1, R: -1 }) : (p.pose ?? (POSES.stand as Pose));
  return { at, pose, hl: handAt(b, pose, -1, at), hr: handAt(b, pose, 1, at) };
};

/** «صاحبنا»: tall, cobalt cap, mint-green shirt, a backpack strap; a beard that grows over the trip. */
export const Hero: React.FC<ActorProps & { beard?: number; age?: number }> = (p) => {
  const b = sitBuild(HERO_B, p.sit ?? 0);
  const { at, pose, hl, hr } = useHands(b, p);
  return (
    <g opacity={p.opacity ?? 1}>
      <Person x={p.x} y={p.y} s={p.s} facing={p.facing ?? 1} build={b} pose={pose} expr={p.expr ?? 'neutral'} look={p.look ?? [0, 0]} bob={at.bob}
        blink={blinkAt(Math.floor(s30(p.T)), 30, 83)} shadow={(p.sit ?? 0) < 0.5}
        torsoDetail={<path d={`M${-b.torsoW * 0.36} ${-b.torsoH * 0.95} Q${-b.torsoW * 0.1} ${-b.torsoH * 0.5} ${b.torsoW * 0.32} ${-b.torsoH * 0.12}`} fill="none" {...stroke(LINE * 1.6, C.seatDeep)} />}
        headFront={<g><Beard rx={b.headRX} ry={b.headRY} len={p.beard ?? 0} age={p.age ?? 0} /><Cap rx={b.headRX} ry={b.headRY} color={C.cap} back button={C.scarf} /></g>} />
      {p.holdL && <g transform={`translate(${hl[0]} ${hl[1]}) scale(${p.s})`}>{p.holdL}</g>}
      {p.holdR && <g transform={`translate(${hr[0]} ${hr[1]}) scale(${p.s})`}>{p.holdR}</g>}
    </g>
  );
};

/** «الخالة»: short and round, lilac dress, magenta headscarf; knits. */
export const Aunt: React.FC<ActorProps & { grey?: number }> = (p) => {
  const b = sitBuild(AUNT_B, p.sit ?? 0);
  const { at, pose, hl, hr } = useHands(b, p);
  const rx = b.headRX, ry = b.headRY;
  return (
    <g opacity={p.opacity ?? 1}>
      <Person x={p.x} y={p.y} s={p.s} facing={p.facing ?? 1} build={b} pose={pose} expr={p.expr ?? 'satisfied'} look={p.look ?? [0, 0]} bob={at.bob}
        blink={blinkAt(Math.floor(s30(p.T)), 30, 97)} shadow={(p.sit ?? 0) < 0.5}
        headBack={<path d={wobEllipse(0, ry * 0.18, rx * 1.28, ry * 1.32, 9, 0.03, 12)} fill={C.scarf} {...stroke(LINE)} />}
        headFront={<path d={`M${-rx * 1.0} ${-ry * 0.25} Q0 ${-ry * 1.28} ${rx * 1.0} ${-ry * 0.25} Q${rx * 0.7} ${-ry * 0.72} 0 ${-ry * 0.78} Q${-rx * 0.7} ${-ry * 0.72} ${-rx * 1.0} ${-ry * 0.25}Z`} fill={C.scarf} {...stroke(LINE * 0.8)} />}
        torsoDetail={<path d={`M${-b.torsoW * 0.3} ${-b.torsoH * 0.9} Q0 ${-b.torsoH * 0.6} ${b.torsoW * 0.3} ${-b.torsoH * 0.9}`} fill="none" {...stroke(LINE * 0.7, '#7E62B8')} />} />
      {p.holdL && <g transform={`translate(${hl[0]} ${hl[1]}) scale(${p.s})`}>{p.holdL}</g>}
      {p.holdR && <g transform={`translate(${hr[0]} ${hr[1]}) scale(${p.s})`}>{p.holdR}</g>}
    </g>
  );
};

/* ---------------- props ---------------- */

/** The bus from the side (own space: front bumper at +x, wheels' bottom at y = 0), 980 × 360. */
export const Bus: React.FC<{ roll: number; door?: number; heads?: React.ReactNode; dir?: 1 | -1; sign?: string; tint?: string }> = ({ roll, door = 0, heads, dir = 1, sign = '7', tint = C.bus }) => (
  <g transform={`scale(${dir} 1)`}>
    <path d={wobRect(-490, -400, 980, 340, 46, 3, 3)} fill={tint} {...stroke(LINE * 1.2)} />
    <rect x={-490} y={-170} width={980} height={26} fill={C.stripe} />
    {[-400, -250, -100, 50].map((x, i) => <path key={i} d={wobRect(x, -360, 130, 150, 14, i, 2)} fill={C.busWin} {...stroke(LINE)} />)}
    <g>{heads}</g>
    <path d={wobRect(220, -360, 150, 300, 10, 7, 2)} fill={C.busDeep} {...stroke(LINE)} />
    <rect x={225 + door * 70} y={-355} width={70 - door * 60} height={290} fill={C.busWin} opacity={0.8} />
    <rect x={295} y={-355} width={70 - door * 60} height={290} fill={C.busWin} opacity={0.8} />
    <path d={wobRect(380, -380, 100, 140, 20, 2, 2)} fill={C.busWin} {...stroke(LINE)} />
    <rect x={-470} y={-392} width={120} height={46} rx={8} fill={C.led} />
    <text x={-410} y={-356} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={36} fill={C.ledOn} transform={dir < 0 ? 'translate(-820 0) scale(-1 1)' : undefined}>{sign}</text>
    {[-300, 300].map((x, i) => (
      <g key={i} transform={`translate(${x} -40)`}>
        <circle r={62} fill={INK} /><circle r={30} fill={C.curb} {...stroke(LINE * 0.6)} />
        {[0, 1, 2].map((k) => <path key={k} d="M0 -28 L0 28" transform={`rotate(${roll * 57.3 + k * 60})`} {...stroke(6)} />)}
      </g>
    ))}
  </g>
);

/** A bus stop: shelter, bench, sign. `mirror` puts it on the other side of the street (facing down). */
export const Stop: React.FC<{ x: number; y: number; label?: string; s?: number }> = ({ x, y, label, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-160 0 L-160 -330 L160 -330 L160 0" fill="none" {...stroke(LINE * 1.3)} />
    <path d={wobRect(-190, -360, 380, 40, 10, 5, 2)} fill={C.cap} {...stroke(LINE)} />
    <rect x={-150} y={-320} width={300} height={250} fill={C.busWin} opacity={0.45} />
    <path d={wobRect(-130, -110, 260, 26, 6, 3, 1)} fill={C.seatDeep} {...stroke(LINE * 0.8)} />
    <path d="M210 0 L210 -420" {...stroke(LINE * 1.4)} />
    <circle cx={210} cy={-450} r={42} fill={C.cap} {...stroke(LINE)} />
    {label && <text x={210} y={-436} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill={C.stripe}>{label}</text>}
  </g>
);

/** The aunt's knitting: needles and a scarf whose length (px) grows with the years, piling up in coils. */
export const Scarf: React.FC<{ len: number }> = ({ len }) => {
  const coils = Math.max(0, len - 120) / 260;
  return (
    <g>
      <path d="M-40 -30 L40 30 M40 -30 L-40 30" {...stroke(5, C.curb)} />
      <path d={`M0 0 L0 ${Math.min(len, 120)}`} {...stroke(34, C.knit)} />
      {Array.from({ length: Math.floor(coils) + 1 }, (_, i) => {
        const k = i < Math.floor(coils) ? 1 : coils - Math.floor(coils);
        return <ellipse key={i} cx={-30 + (i % 4) * 60 - Math.floor(i / 4) * 20} cy={170 + (i % 4) * 10 - Math.floor(i / 4) * 40} rx={60 * k} ry={24 * k} fill="none" {...stroke(30, C.knit)} />;
      })}
    </g>
  );
};

/** Ticket from the bus machine (own space: centre 0,0). */
export const BusTicket: React.FC<{ n?: number }> = ({ n = 1 }) => (
  <g>{Array.from({ length: n }, (_, i) => <g key={i} transform={`translate(0 ${i * 46})`}><path d="M-50 -22 L50 -22 L50 22 L-50 22 Z" fill={C.stripe} {...stroke(LINE * 0.6)} /><path d="M-36 -6 L20 -6 M-36 8 L4 8" {...stroke(5, C.cap)} /></g>)}</g>
);

export { tween, lerp };
