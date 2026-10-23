import React from 'react';
import { INK, LINE, PAL, hash, sketch } from '../style';
import { Glow, LIGHT, LIT, Poly, Rect, blob, city } from './parts';

// Evening street, three parallax layers. pan 0→1 scrolls far 300 px, mid 700 px, near 1400 px (sidewalk with it).
// eve = later dusk: deeper sky, street lamps on, more windows lit.
const WALK = 800; // back edge of the sidewalk; people walk at y 860
const CURB = 950;
const NEAR_W = 1920 + 1400;

const far = city({ x0: -40, x1: 2300, base: 700, seed: 11, h: [200, 440], w: [80, 170], gap: 4, lit: 0.12, win: 0.8 });
const mid = city({ x0: -40, x1: 2700, base: 760, seed: 23, h: [150, 330], w: [110, 220], gap: 10, lit: 0.22 });
const midEve = city({ x0: -40, x1: 2700, base: 760, seed: 23, h: [150, 330], w: [110, 220], gap: 10, lit: 0.42 });

// near row: low facades with a shop front each
const TONES = ['#9EA5C2', '#A9A2BF', '#8F9AB6', '#B2B6CC'];
const AWN = [PAL.focus, PAL.calm, PAL.plum, PAL.storm];
const near = (() => {
  const out: { x: number; w: number; h: number; k: number }[] = [];
  for (let x = -60, k = 0; x < NEAR_W + 60; k++) {
    const w = 300 + hash(k * 5.3 + 1) * 160, h = 270 + hash(k * 2.1 + 7) * 180;
    out.push({ x, w, h, k });
    x += w + 8;
  }
  return out;
})();

const Facade: React.FC<{ x: number; w: number; h: number; k: number; eve: boolean }> = ({ x, w, h, k, eve }) => {
  const top = WALK - h, cols = Math.max(2, Math.floor((w - 40) / 90)), gx = (w - 40) / cols;
  const lit: string[] = [], dark: string[] = [];
  for (let r = 0; top + 40 + r * 92 < WALK - 230; r++)
    for (let c = 0; c < cols; c++) {
      const d = `M${x + 20 + c * gx + gx * 0.22} ${top + 40 + r * 92}h${gx * 0.56}v60h${-gx * 0.56}Z`;
      (hash(k * 31 + r * 7 + c) < (eve ? 0.5 : 0.25) ? lit : dark).push(d);
    }
  const shop = { x: x + 26, y: WALK - 170, w: w - 52, h: 150 };
  return (
    <g>
      <Rect x={x} y={top} w={w} h={h + 10} fill={TONES[k % 4]} seed={200 + k} />
      <Rect x={x - 8} y={top - 6} w={w + 16} h={18} fill={TONES[(k + 2) % 4]} sw={LINE.fine} seed={210 + k} />
      <path d={dark.join('')} fill="#6E7898" stroke={INK} strokeWidth={LINE.far} strokeOpacity={0.6} />
      <path d={lit.join('')} fill={LIT} stroke={INK} strokeWidth={LINE.far} strokeOpacity={0.6} />
      <Rect x={shop.x} y={shop.y} w={shop.w} h={shop.h} fill={eve ? '#E3E8F2' : '#C9D2E2'} sw={LINE.fine} seed={220 + k} />
      <path d={`M${shop.x + shop.w * 0.62} ${shop.y} v${shop.h}`} stroke={INK} strokeWidth={LINE.fine} />
      <Poly pts={[[shop.x - 10, shop.y - 34], [shop.x + shop.w + 10, shop.y - 34], [shop.x + shop.w + 24, shop.y + 6], [shop.x - 24, shop.y + 6]]} fill={AWN[k % 4]} seed={230 + k} />
    </g>
  );
};

const Lamp: React.FC<{ x: number; on: boolean; seed: number }> = ({ x, on, seed }) => (
  <g>
    {on && <Glow x={x + 60} y={WALK + 50} r={170} ry={34} o={0.55} />}
    {on && <Glow x={x + 60} y={300} r={150} o={0.8} />}
    <Rect x={x - 7} y={300} w={14} h={WALK + 30 - 300} fill={PAL.chairDark} sw={LINE.fine} seed={seed} />
    <path d={`M${x} 310 Q${x} 270 ${x + 40} 272 L${x + 60} 274`} fill="none" stroke={INK} strokeWidth={LINE.normal + 6} strokeLinecap="round" />
    <path d={`M${x} 310 Q${x} 270 ${x + 40} 272 L${x + 60} 274`} fill="none" stroke={PAL.chairDark} strokeWidth={6} strokeLinecap="round" />
    <Poly pts={[[x + 36, 278], [x + 84, 278], [x + 76, 298], [x + 44, 298]]} fill={on ? LIGHT : PAL.metal} sw={LINE.fine} seed={seed + 1} />
    <Rect x={x - 16} y={WALK + 22} w={32} h={14} fill={PAL.chairDark} sw={LINE.fine} seed={seed + 2} />
  </g>
);

const Tree: React.FC<{ x: number; seed: number; s?: number }> = ({ x, seed, s = 1 }) => {
  const trunk = sketch([[x, WALK + 30], [x + 4, WALK - 220 * s]], seed, 1.5);
  return (
    <g>
      <path d={trunk} fill="none" stroke={INK} strokeWidth={24} strokeLinecap="round" />
      <path d={trunk} fill="none" stroke={PAL.woodDark} strokeWidth={16} strokeLinecap="round" />
      <path d={blob(x, WALK - 330 * s, 130 * s, 120 * s, seed + 1, 11)} fill={PAL.plantDark} stroke={INK} strokeWidth={LINE.normal} />
      <path d={blob(x - 24 * s, WALK - 356 * s, 88 * s, 76 * s, seed + 2, 9)} fill={PAL.plant} />
      <Rect x={x - 46} y={WALK + 28} w={92} h={12} fill={PAL.floorDark} sw={LINE.fine} seed={seed + 4} />
    </g>
  );
};

const BusStop: React.FC<{ x: number }> = ({ x }) => (
  <g>
    <Rect x={x + 20} y={WALK - 300} w={300} h={260} fill={PAL.focusLight} sw={LINE.fine} seed={301} o={0.55} />
    <Rect x={x + 30} y={WALK - 290} w={90} h={150} fill={PAL.paper} sw={LINE.fine} seed={302} />
    <Poly pts={[[x + 44, WALK - 250], [x + 106, WALK - 250]]} open sw={LINE.far} o={0.6} seed={303} />
    <Poly pts={[[x + 44, WALK - 230], [x + 96, WALK - 230]]} open sw={LINE.far} o={0.6} seed={304} />
    <Rect x={x} y={WALK - 330} w={340} h={30} fill={PAL.chair} seed={305} />
    <Rect x={x + 10} y={WALK - 300} w={14} h={330} fill={PAL.chairDark} sw={LINE.fine} seed={306} />
    <Rect x={x + 316} y={WALK - 300} w={14} h={330} fill={PAL.chairDark} sw={LINE.fine} seed={307} />
    <Rect x={x + 150} y={WALK - 96} w={150} h={14} fill={PAL.metal} sw={LINE.fine} seed={308} />
    {/* stop sign: a pole and a round plate with a bus */}
    <Rect x={x + 396} y={WALK - 330} w={10} h={360} fill={PAL.metal} sw={LINE.fine} seed={309} />
    <circle cx={x + 401} cy={WALK - 352} r={38} fill={PAL.focus} stroke={INK} strokeWidth={LINE.normal} />
    <Rect x={x + 380} y={WALK - 372} w={42} h={30} fill={PAL.paper} sw={LINE.far} seed={310} />
    <circle cx={x + 389} cy={WALK - 338} r={4} fill={PAL.paper} />
    <circle cx={x + 413} cy={WALK - 338} r={4} fill={PAL.paper} />
  </g>
);

export const Street: React.FC<{ pan: number; eve?: boolean }> = ({ pan, eve = false }) => {
  const id = `pl-street-sky-${eve ? 'e' : 'd'}`;
  const sky = eve ? ['#6F7AA6', '#B9B3D6'] : [PAL.skyEve, '#E9E2EE'];
  const joints = Array.from({ length: 30 }, (_, i) => i * 120 - ((pan * 1400) % 120));
  const dashes = Array.from({ length: 12 }, (_, i) => i * 240 - ((pan * 1600) % 240));
  return (
    <g>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="0.75" stopColor={sky[1]} /></linearGradient>
      <rect width={1920} height={1080} fill={`url(#${id})`} />
      {eve && <><circle cx={1520} cy={150} r={26} fill="#E8EDF2" /><circle cx={1532} cy={142} r={23} fill={sky[0]} /></>}
      <g transform={`translate(${(-pan * 300).toFixed(1)} 0)`}>
        <path d={far.bodies} fill={eve ? '#8E93B8' : '#BFC2DA'} stroke={PAL.textSoft} strokeWidth={LINE.far} strokeOpacity={0.3} />
        <path d={far.lights} fill={LIT} opacity={eve ? 0.8 : 0.5} />
      </g>
      <g transform={`translate(${(-pan * 700).toFixed(1)} 0)`}>
        <path d={mid.bodies} fill={eve ? '#7D84A8' : '#A9AECA'} stroke={INK} strokeWidth={LINE.far} strokeOpacity={0.4} />
        <path d={(eve ? midEve : mid).lights} fill={LIT} opacity={0.9} />
      </g>
      {/* sidewalk and road */}
      <rect y={WALK} width={1920} height={CURB - WALK} fill="#C2C1CE" />
      <rect y={CURB} width={1920} height={1080 - CURB} fill="#6C7390" />
      <Rect x={-20} y={CURB - 4} w={1960} h={16} fill="#D8D9E2" sw={LINE.fine} seed={401} />
      <path d={joints.map((x) => `M${x.toFixed(1)} ${WALK} L${(x - 18).toFixed(1)} ${CURB - 4}`).join(' ')} stroke={INK} strokeWidth={LINE.far} opacity={0.18} />
      <path d={dashes.map((x) => `M${x.toFixed(1)} 1030 h120`).join(' ')} stroke="#D8D9E2" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
      <g transform={`translate(${(-pan * 1400).toFixed(1)} 0)`}>
        {near.map((b) => <Facade key={b.k} {...b} eve={eve} />)}
        <rect x={-100} y={WALK - 4} width={NEAR_W + 200} height={8} fill={INK} opacity={0.15} />
        {[260, 960, 1660, 2360, 3060].map((x, i) => <Lamp key={x} x={x} on={eve} seed={500 + i * 5} />)}
        {[620, 1320, 2760].map((x, i) => <Tree key={x} x={x} seed={600 + i * 7} s={1 - i * 0.06} />)}
        <BusStop x={1880} />
      </g>
    </g>
  );
};
