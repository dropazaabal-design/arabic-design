import React from 'react';
import { INK, LINE, PAL, hash } from '../style';
import { BASE, Door, Glow, LIGHT, NIGHT, NightSky, Plant, Poly, Rect, Room, Window, blob } from './parts';

// The family living room. door: the front door at x 1500 swings open 0→1; night: dark window, moon, lamp on.
export const HOME = {
  frontDoorX: 1500,
  roomDoorX: 300,
  /** Seated on the sofa at scale 1.45: Character x, hip y (feet stay at 860). */
  sofaSeat: { x: 840, y: 698 },
};

const SOFA = { x0: 700, x1: 1210, seat: 708 };

/** A bookcase standing on the floor at x0; books are coloured spines, no titles. */
export const Bookcase: React.FC<{ x: number; w?: number; top?: number; seed?: number }> = ({ x, w = 170, top = 380, seed = 1 }) => {
  const shelves = [top + 30, top + 170, top + 310];
  const C = [PAL.focus, PAL.calm, PAL.plum, PAL.rose, PAL.storm, PAL.chair, PAL.calmLight, PAL.provoke];
  const books: React.ReactNode[] = [];
  shelves.forEach((sy, r) => {
    for (let bx = x + 16, k = 0; bx < x + w - 34; k++) {
      const bw = 14 + hash(seed + r * 9 + k) * 12, bh = 70 + hash(seed * 3 + r * 5 + k) * 46;
      if (hash(seed * 7 + r * 13 + k) < 0.14) { bx += 26; continue; }
      books.push(<Rect key={`${r}-${k}`} x={bx} y={sy + 128 - bh} w={bw} h={bh} fill={C[(k * 3 + r) % C.length]} sw={LINE.far} seed={seed + r * 20 + k} />);
      bx += bw + 2;
    }
  });
  return (
    <g>
      <Rect x={x} y={top} w={w} h={BASE - top + 4} fill={PAL.wood} seed={seed} />
      <Rect x={x + 10} y={top + 10} w={w - 20} h={BASE - top - 20} fill={PAL.woodDark} sw={LINE.fine} seed={seed + 1} />
      {books}
      {shelves.map((sy, i) => <Rect key={i} x={x + 6} y={sy + 128} w={w - 12} h={12} fill={PAL.wood} sw={LINE.fine} seed={seed + 40 + i} />)}
    </g>
  );
};

/** Curtains either side of a window. */
export const Curtains: React.FC<{ x: number; y: number; w: number; h: number; c: string; seed?: number }> = ({ x, y, w, h, c, seed = 1 }) => (
  <g>
    <Rect x={x - 70} y={y - 34} w={w + 140} h={10} fill={PAL.metal} sw={LINE.fine} seed={seed} />
    <Poly pts={[[x - 60, y - 26], [x + 30, y - 26], [x + 6, y + h * 0.55], [x + 24, y + h + 50], [x - 64, y + h + 50]]} fill={c} seed={seed + 1} />
    <Poly pts={[[x + w + 60, y - 26], [x + w - 30, y - 26], [x + w - 6, y + h * 0.55], [x + w - 24, y + h + 50], [x + w + 64, y + h + 50]]} fill={c} seed={seed + 2} />
  </g>
);

const Sofa: React.FC = () => {
  const { x0, x1, seat } = SOFA, mid = (x0 + x1) / 2;
  return (
    <g>
      <ellipse cx={mid} cy={BASE + 14} rx={(x1 - x0) / 2 + 20} ry={12} fill={INK} opacity={0.1} />
      <Poly pts={[[x0 + 40, seat], [x0 + 36, 572], [x0 + 60, 552], [x1 - 60, 552], [x1 - 36, 572], [x1 - 40, seat]]} fill={PAL.sofa} seed={51} />
      <Rect x={x0 + 70} y={576} w={mid - x0 - 76} h={110} fill="#8C9CB3" sw={LINE.fine} seed={52} />
      <Rect x={mid + 6} y={576} w={x1 - mid - 76} h={110} fill="#8C9CB3" sw={LINE.fine} seed={53} />
      <path d={blob(x1 - 150, 640, 46, 40, 54, 8)} fill={PAL.rose} stroke={INK} strokeWidth={LINE.fine} />
      <Rect x={x0 + 50} y={seat} w={x1 - x0 - 100} h={36} fill="#8C9CB3" seed={55} />
      <Rect x={x0 + 44} y={seat + 36} w={x1 - x0 - 88} h={BASE - seat - 46} fill={PAL.sofa} seed={56} />
      <Rect x={x0} y={640} w={66} h={BASE - 650} fill={PAL.sofa} seed={57} />
      <Rect x={x1 - 66} y={640} w={66} h={BASE - 650} fill={PAL.sofa} seed={58} />
      {[x0 + 16, x1 - 30].map((lx, i) => <Rect key={i} x={lx} y={BASE - 12} w={14} h={22} fill={PAL.woodDark} sw={LINE.fine} seed={59 + i} />)}
    </g>
  );
};

const SideLamp: React.FC<{ x: number; on: boolean }> = ({ x, on }) => (
  <g>
    <Rect x={x - 50} y={690} w={100} h={14} fill={PAL.wood} seed={61} />
    <Rect x={x - 6} y={704} w={12} h={BASE - 704 + 6} fill={PAL.woodDark} sw={LINE.fine} seed={62} />
    <Rect x={x - 32} y={BASE - 4} w={64} h={10} fill={PAL.woodDark} sw={LINE.fine} seed={63} />
    <Poly pts={[[x - 22, 690], [x + 22, 690], [x + 14, 660], [x - 14, 660]]} fill={PAL.storm} sw={LINE.fine} seed={64} />
    <Rect x={x - 3} y={590} w={6} h={70} fill={INK} sw={0} seed={65} />
    <Poly pts={[[x - 52, 600], [x + 52, 600], [x + 34, 530], [x - 34, 530]]} fill={on ? LIGHT : PAL.wallLav} seed={66} />
  </g>
);

/** `room` swings the left (bedroom) door, ajar by default; `hall` is drawn inside that doorway, behind its leaf. */
export const HomeLiving: React.FC<{ door?: number; night?: boolean; room?: number; hall?: React.ReactNode }> = ({ door = 0, night = false, room = 0.82, hall }) => (
  <g>
    <Room wall={PAL.wallLav} floor={PAL.floor} seed={7} />
    {/* bedroom/corridor door, left: ajar onto a dim hall */}
    <Door x={200} w={200} top={300} leaf={PAL.wood} beyond={night ? PAL.wallNight : '#C4C3D6'} open={room} seed={71}>
      <rect x={200} y={720} width={200} height={100} fill={INK} opacity={0.12} />
      {hall && <><clipPath id="pl-home-hall"><rect x={200} y={300} width={200} height={520} /></clipPath><g clipPath="url(#pl-home-hall)">{hall}</g></>}
    </Door>
    <Bookcase x={480} seed={81} />
    <Curtains x={780} y={190} w={340} h={290} c="#B4AECB" seed={91} />
    <Window x={780} y={190} w={340} h={290} id="pl-home-win" sky={night ? PAL.skyNight : PAL.sky} seed={95}>
      {night
        ? <NightSky x={780} y={190} w={340} h={290} seed={3} />
        : <path d={blob(980, 470, 260, 70, 4, 10)} fill={PAL.wallSage} opacity={0.9} />}
    </Window>
    <Sofa />
    <Poly pts={[[620, 842], [1300, 842], [1350, 904], [570, 904]]} fill={PAL.rug} sw={LINE.fine} seed={101} />
    <Poly pts={[[660, 856], [1270, 856], [1300, 892], [626, 892]]} stroke={PAL.paper} sw={LINE.fine} o={0.6} open seed={102} />
    <SideLamp x={1290} on={night} />
    {/* front door: the leaf swings toward us with `door` */}
    <Door x={1395} w={210} top={290} leaf={PAL.chair} beyond={night ? PAL.skyNight : '#C9CFDE'} open={door} seed={111}>
      <Glow x={1500} y={330} r={90} o={night ? 0.5 : 0} />
      <rect x={1395} y={760} width={210} height={60} fill={INK} opacity={0.15} />
    </Door>
    <Plant x={1760} y={BASE + 8} s={0.95} seed={121} pot={PAL.paper} />
    {night && <rect width={1920} height={1080} fill={NIGHT} opacity={0.3} />}
    {night && <Glow x={1290} y={575} r={330} ry={280} color="#E7E6F4" o={0.55} />}
    {night && <Glow x={1290} y={566} r={60} o={0.9} />}
  </g>
);
