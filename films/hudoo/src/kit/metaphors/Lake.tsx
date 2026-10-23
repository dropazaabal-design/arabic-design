import React from 'react';
import { Character } from '../characters/Character';
import { pose } from '../characters/skeleton';
import { INK, LINE, PAL, hash, sketch } from '../style';
import { Frame, blob, ease, ink, mix, smooth, useUid, type P } from './util';

// The lake: calm on top, a current turning underneath. World coordinates are the 1920×1080 frame at cut = 0;
// `cut` pans the camera down by PAN so the cross-section below the front edge of the water comes into view.
export const LAKE = { horizon: 640, edge: 1080, pan: 500, bed: 1540, vortex: [960, 1330] as P } as const;
const { horizon: HZ, edge: EDGE, pan: PAN, bed: BED } = LAKE;

/** Points on a flattened spiral: u 0..1 runs from the rim (r1) in to the eye (r0). */
const spiral = (cx: number, cy: number, rx: number, ry: number, turns: number, phase: number, r0 = 0.12, r1 = 1, n = 120): P[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n, a = phase + u * turns * Math.PI * 2, r = mix(r1, r0, u);
    return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r];
  });

const hills = (base: number, peaks: [number, number][], seed: number) => {
  const pts: P[] = [[-40, base + 40], [-40, base], ...peaks, [1960, base], [1960, base + 40]];
  return sketch(pts, seed, 2.2, true);
};
const BACK: [number, number][] = [[160, HZ - 110], [380, HZ - 150], [620, HZ - 90], [860, HZ - 60], [1120, HZ - 130], [1380, HZ - 175], [1640, HZ - 110], [1840, HZ - 140]];
const FRONT: [number, number][] = [[90, HZ - 40], [300, HZ - 70], [520, HZ - 30], [760, HZ - 20], [1000, HZ - 45], [1240, HZ - 25], [1500, HZ - 60], [1760, HZ - 35]];

/** A small boat with سليم paddling, drawn in its own frame: waterline at y = 0, bow toward +x. `row` scales the stroke. */
export const Boat: React.FC<{ t: number; x: number; y?: number; s?: number; row?: number }> = ({ t, x, y = 0, s = 1, row = 1 }) => {
  const id = useUid();
  const ph = t * 2.4, sn = Math.sin(ph) * row;
  const bob = Math.sin(t * 1.7) * 3, rock = Math.sin(t * 1.3 + 0.6) * 1.6;
  // the paddle, in boat space: a top grip U and a blade B a fixed length away; the stroke swings it fore and aft
  const a = ((12 + 22 * sn) * Math.PI) / 180, L = 210;
  const U: P = [30 + 14 * sn, -150 + 6 * Math.cos(ph) * row];
  const B: P = [U[0] + Math.sin(a) * L, U[1] + Math.cos(a) * L];
  const at = (k: number): P => [U[0] + (B[0] - U[0]) * k, U[1] + (B[1] - U[1]) * k];
  const CX = -20, CY = 44, CS = 0.85; // the figure's feet sit below the gunwale, hidden by the hull
  const toChar = (p: P): P => [(p[0] - CX) / CS, (p[1] - CY) / CS];
  const g = at((-40 - U[1]) / (B[1] - U[1])); // where the shaft crosses the gunwale
  const hull = 'M-165 -40 L185 -40 Q165 16 112 28 L-122 28 Q-158 16 -165 -40 Z';
  const shaft = (p: P, q: P) => <><path d={`M${p[0]} ${p[1]} L${q[0]} ${q[1]}`} {...ink(14)} /><path d={`M${p[0]} ${p[1]} L${q[0]} ${q[1]}`} stroke={PAL.wood} strokeWidth={7.5} strokeLinecap="round" /></>;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s}) rotate(${rock})`}>
      <path d="M-150 30 L170 30 Q140 74 96 84 L-106 84 Q-138 70 -150 30 Z" fill={PAL.waterDeep} opacity={0.28} />
      {[0, 1, 2].map((k) => {
        const u = (t * 0.5 + k / 3) % 1;
        return <ellipse key={k} cx={-180 - u * 220} cy={26} rx={30 + u * 90} ry={5 + u * 10} fill="none" stroke={PAL.waterLight} strokeWidth={3} opacity={(1 - u) * 0.8} />;
      })}
      {shaft([U[0] - (B[0] - U[0]) * 0.08, U[1] - (B[1] - U[1]) * 0.08], g)}
      <clipPath id={`${id}gw`}><rect x={-400} y={-600} width={800} height={562} /></clipPath>
      <g clipPath={`url(#${id}gw)`}><Character who="salim" p={pose({ sit: 1, turn: 0.75, body: 0.7, lean: 4 + sn * 6, head: -2, R: { hand: toChar(at(0.36)) }, L: { hand: toChar(at(0.05)) }, footR: [56, 0], footL: [66, 0] })} x={CX} y={CY} s={CS} face="calm" hands={{ R: 'grip', L: 'grip' }} /></g>
      <path d={hull} fill="#9C8F96" {...ink(LINE.bold)} />
      <path d="M-160 -30 L180 -30" stroke="#C9BEC3" strokeWidth={9} strokeLinecap="round" />
      <path d="M-134 0 Q20 10 146 -2" fill="none" stroke={INK} strokeWidth={LINE.fine} opacity={0.45} />
      <path d={hull} fill="none" {...ink(LINE.bold)} />
      {shaft(g, B)}
      <ellipse cx={B[0]} cy={B[1]} rx={13} ry={30} transform={`rotate(${-a * 57.3} ${B[0]} ${B[1]})`} fill={PAL.wood} {...ink(LINE.normal)} />
      {/* the water closes over the blade */}
      <path d={`M${B[0] - 50} 30 Q${B[0]} 22 ${B[0] + 50} 30 L${B[0] + 50} 70 L${B[0] - 50} 70 Z`} fill="#5F86A8" opacity={0.55} />
      <ellipse cx={B[0]} cy={30} rx={34 + Math.abs(Math.cos(ph)) * 14} ry={6} fill="none" stroke="#E6EDF5" strokeWidth={3} opacity={0.8} />
    </g>
  );
};

export type LakeProps = {
  t: number;
  /** 0..1 how visible the current under the surface is */
  current: number;
  /** 0..1 pans down to reveal the cross-section below the waterline */
  cut: number;
  /** 0..1 a small boat enters from the left and is steered across */
  boat?: number;
  /** 0..1 wind ripples */
  storm?: number;
};

export const Lake: React.FC<LakeProps> = ({ t, current, cut, boat = 0, storm = 0 }) => {
  const id = useUid();
  const c = ease(cut);
  const moon: P = [1390, 300];
  // moon path on the water: rows of light dashes, wider and further apart toward the viewer
  const glints = Array.from({ length: 22 }, (_, k) => {
    const d = k / 21, yy = HZ + 14 + Math.pow(d, 1.5) * (EDGE - HZ - 40);
    const w = (18 + d * 120) * (0.55 + 0.45 * Math.sin(t * 1.4 + k * 1.9)) * (1 + storm * 0.4);
    const jx = Math.sin(t * 0.9 + k * 2.3) * (4 + d * 20) * (1 + storm * 3);
    return { yy, w, x: moon[0] + jx, h: 2 + d * 5 };
  });
  const ripples = Array.from({ length: 70 }, (_, i) => {
    const d = Math.pow(hash(i * 3.1 + 7), 1.3), yy = HZ + 20 + d * (EDGE - HZ - 30);
    const sz = 10 + d * 46, sp = 30 + d * 90;
    const xx = ((hash(i * 5.3 + 1) * 2100 + t * sp) % 2100) - 90;
    return { xx, yy, sz, on: hash(i * 9.7 + 3) < storm, dark: i % 3 === 0 };
  });
  const bx = mix(-260, 1420, ease(boat));
  const by = 930 - Math.sin(Math.PI * ease(boat)) * 30;
  const [vx, vy] = LAKE.vortex;
  const arms = 3;

  return (
    <Frame bg={PAL.skyNight}>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#46547E" /><stop offset="0.55" stopColor="#7D88B4" /><stop offset="1" stopColor="#CDD2E8" />
        </linearGradient>
        <linearGradient id={`${id}lake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BAC7E0" /><stop offset="0.35" stopColor="#8EA6C8" /><stop offset="1" stopColor="#4E7397" />
        </linearGradient>
        <linearGradient id={`${id}deep`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4C7C9C" /><stop offset="0.5" stopColor="#30536F" /><stop offset="1" stopColor="#22384F" />
        </linearGradient>
        <radialGradient id={`${id}halo`}>
          <stop offset="0" stopColor="#F4F2FA" stopOpacity="0.55" /><stop offset="1" stopColor="#E6E1EF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`translate(0 ${-PAN * c})`}>
        {/* sky */}
        <rect x={0} y={0} width={1920} height={HZ + 10} fill={`url(#${id}sky)`} />
        <rect x={0} y={0} width={1920} height={HZ + 10} fill="#353D57" opacity={storm * 0.35} />
        {[[220, 90], [520, 160], [760, 70], [1080, 130], [1660, 110], [1820, 210], [340, 250]].map(([sx, sy], i) => (
          <circle key={i} cx={sx} cy={sy} r={2.4 + (i % 3) * 0.8} fill="#F1F3FA" opacity={(0.5 + 0.3 * Math.sin(t * 1.1 + i * 2)) * (1 - storm * 0.8)} />
        ))}
        <circle cx={moon[0]} cy={moon[1]} r={170} fill={`url(#${id}halo)`} />
        <circle cx={moon[0]} cy={moon[1]} r={46} fill="#F1F3FA" {...ink(LINE.fine)} />
        <circle cx={moon[0] - 14} cy={moon[1] - 8} r={9} fill="#DFE2EE" /><circle cx={moon[0] + 16} cy={moon[1] + 14} r={6} fill="#DFE2EE" />
        {[[300, 360, 260], [980, 420, 340], [1700, 330, 200]].map(([cx, cy, w], i) => {
          const xx = cx + Math.sin(t * 0.05 + i) * 60;
          return <path key={i} d={smooth(blob(xx, cy, w, 16, i + 4, 10, 0.12), true)} fill="#A9B0D2" opacity={0.55} />;
        })}
        {/* far shore */}
        <path d={hills(HZ, BACK, 3)} fill="#8C93B9" {...ink(LINE.far)} />
        <path d={hills(HZ, FRONT, 5)} fill="#6E799F" {...ink(LINE.far)} />
        <path d={sketch(Array.from({ length: 30 }, (_, i): P => [1180 + i * 14, HZ - 8 - (i % 2) * 12 - Math.sin(i) * 4]).concat([[1600, HZ + 2], [1180, HZ + 2]]), 9, 1, true)} fill="#56628A" {...ink(LINE.far)} />

        {/* the surface: glassy, holding the sky */}
        <rect x={0} y={HZ} width={1920} height={EDGE - HZ} fill={`url(#${id}lake)`} />
        <g transform={`translate(0 ${HZ}) scale(1 -0.5) translate(0 ${-HZ})`} opacity={0.32}>
          <path d={hills(HZ, BACK, 3)} fill="#6E799F" />
          <path d={hills(HZ, FRONT, 5)} fill="#56628A" />
        </g>
        <path d={`M0 ${HZ} L1920 ${HZ}`} {...ink(LINE.far)} />
        {[0.12, 0.3, 0.52, 0.78].map((d, i) => {
          const yy = HZ + d * (EDGE - HZ), off = Math.sin(t * 0.25 + i) * 60;
          return <path key={i} d={`M${120 + i * 200 + off} ${yy} L${980 + i * 160 + off} ${yy}`} stroke="#DCE6F2" strokeWidth={2 + d * 4} strokeLinecap="round" opacity={0.45 * (1 - storm * 0.7)} />;
        })}
        {glints.map((g, k) => <rect key={k} x={g.x - g.w / 2} y={g.yy} width={g.w} height={g.h} rx={g.h / 2} fill="#EEF1F8" opacity={0.85} />)}
        {/* the current, faintly, through the calm surface */}
        {current > 0 && (
          <g opacity={current * 0.4 * (1 - c)}>
            {Array.from({ length: 3 }, (_, k) => (
              <path key={k} d={smooth(spiral(960, 905, 520, 95, 1.6, (k / 3) * Math.PI * 2 + t * 0.25, 0.15))} fill="none" stroke="#3F6A8A" strokeWidth={7} strokeLinecap="round" strokeDasharray="90 50" strokeDashoffset={-t * 40} />
            ))}
          </g>
        )}
        {/* wind ripples */}
        {ripples.map((r, i) => r.on && (
          <path key={i} d={`M${r.xx} ${r.yy} q${r.sz / 2} ${-r.sz * 0.28} ${r.sz} 0`} fill="none" stroke={r.dark ? '#46698C' : '#E6EDF5'} strokeWidth={1.5 + r.sz / 18} strokeLinecap="round" opacity={0.85} />
        ))}

        {/* the cross-section below the front edge */}
        <rect x={0} y={EDGE} width={1920} height={BED + 200 - EDGE} fill={`url(#${id}deep)`} />
        {[300, 820, 1380].map((x0, i) => (
          <path key={i} d={`M${x0} ${EDGE} L${x0 + 160} ${EDGE} L${x0 + 360} ${BED} L${x0 + 120} ${BED} Z`} fill={PAL.waterLight} opacity={0.07 + 0.03 * Math.sin(t * 0.8 + i)} />
        ))}
        {/* the current: spiral streamlines turning under the calm surface */}
        <g opacity={0.25 + current * 0.75}>
          {Array.from({ length: arms }, (_, k) => {
            const pts = spiral(vx, vy, 600, 190, 1.35, (k / arms) * Math.PI * 2 + t * 0.35, 0.1);
            return (
              <g key={k}>
                <path d={smooth(pts)} fill="none" stroke="#7FB3C8" strokeWidth={22} strokeLinecap="round" opacity={0.35 * current} />
                <path d={smooth(pts)} fill="none" stroke="#D7EBF3" strokeWidth={7} strokeLinecap="round" strokeDasharray="160 60" strokeDashoffset={-t * 160} opacity={0.4 + current * 0.6} />
              </g>
            );
          })}
          {Array.from({ length: 26 }, (_, i) => {
            const u = (t * 0.07 + hash(i * 2.7)) % 1, k = i % arms;
            const p = spiral(vx, vy, 600, 190, 1.35, (k / arms) * Math.PI * 2 + t * 0.35, 0.1, 1, 60)[Math.floor(u * 60)];
            return <circle key={i} cx={p[0]} cy={p[1]} r={3 + (i % 3) * 2} fill="#E6F2F7" opacity={current * (0.4 + 0.6 * Math.sin(u * Math.PI))} />;
          })}
          <circle cx={vx} cy={vy} r={14} fill="#D7EBF3" opacity={current * 0.6} />
        </g>
        {/* lake bed, stones and weed */}
        <path d={sketch([[-40, BED + 20], [200, BED - 10], [520, BED + 14], [900, BED - 6], [1300, BED + 18], [1640, BED - 12], [1960, BED + 10], [1960, BED + 260], [-40, BED + 260]], 21, 3, true)} fill="#4A4862" {...ink(LINE.normal)} />
        {[[180, BED + 4, 70, 34], [460, BED + 18, 44, 22], [1500, BED + 4, 90, 40], [1720, BED + 10, 50, 24], [1060, BED + 10, 38, 18]].map(([x, y, rx, ry], i) => (
          <path key={i} d={smooth(blob(x, y, rx, ry, i + 30, 10, 0.08), true)} fill={i % 2 ? '#625F7C' : '#56536E'} {...ink(LINE.fine)} />
        ))}
        {[120, 260, 610, 1240, 1600, 1820].map((x0, i) => {
          const sway = Math.sin(t * 1.2 + i) * 18 + current * 30;
          const h = 120 + (i % 3) * 50;
          return <path key={i} d={smooth([[x0, BED + 6], [x0 + sway * 0.3, BED - h * 0.35], [x0 + sway * 0.8 - 8, BED - h * 0.7], [x0 + sway * 1.3, BED - h]])} fill="none" stroke={PAL.plantDark} strokeWidth={9} strokeLinecap="round" />;
        })}
        {/* section line: the front edge of the water */}
        <rect x={0} y={EDGE} width={1920} height={14} fill="#9CC3D6" opacity={0.8} />
        <path d={sketch([[-20, EDGE], [1940, EDGE]], 4, 1.5)} {...ink(LINE.bold)} fill="none" />

        {boat > 0 && <Boat t={t} x={bx} y={by} s={0.9} />}
      </g>
    </Frame>
  );
};
