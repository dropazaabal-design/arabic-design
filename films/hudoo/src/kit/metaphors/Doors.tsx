import React from 'react';
import { INK, LINE, PAL, sketch, sketchRect } from '../style';
import { Frame, clamp01, ease, ink, mix, smooth, useUid, type P } from './util';

// Three doors: the same message read three ways. Behind each door a different light: jagged rose, wavy lavender,
// calm blue. Door centres x = 520 / 960 / 1400, top y = 360, floor y = 860. Free for captions: y < 320, and a
// label slot above each door (DOORS.label).
export const DOORS = { xs: [520, 960, 1400], w: 250, top: 360, floor: 860, label: [[520, 300], [960, 300], [1400, 300]] as P[] } as const;
const DW = DOORS.w, DH = DOORS.floor - DOORS.top;
const LIGHTS = [
  { bg: '#F4DDE5', a: PAL.rose, b: PAL.warn, spill: '#E9B9C9' },
  { bg: '#ECE6F6', a: '#9A8FC0', b: '#7B6AA8', spill: '#CFC6E8' },
  { bg: '#DDEAF6', a: '#7FA6CF', b: PAL.focus, spill: '#BCD3EC' },
];

/** What waits behind each door, drawn into the doorway box (x, y, w, h). */
const Behind: React.FC<{ kind: number; x: number; y: number; w: number; h: number; t: number }> = ({ kind, x, y, w, h, t }) => {
  const L = LIGHTS[kind];
  const rows = 7;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={L.bg} />
      {Array.from({ length: rows }, (_, r) => {
        const yy = y + 40 + r * ((h - 60) / (rows - 1));
        const col = r % 2 ? L.a : L.b;
        if (kind === 0) { // jagged: sharp zigzags drifting sideways
          const off = ((t * 30 + r * 23) % 60) - 60;
          const pts: P[] = Array.from({ length: 12 }, (_, i) => [x + off + i * 30, yy + (i % 2 ? -16 : 16)]);
          return <path key={r} d={`M${pts.map((p) => p.join(' ')).join(' L')}`} fill="none" stroke={col} strokeWidth={8} strokeLinejoin="miter" strokeLinecap="round" />;
        }
        if (kind === 1) { // wavy: soft sine lines rolling
          const pts: P[] = Array.from({ length: 24 }, (_, i) => [x - 10 + i * 12, yy + Math.sin(i * 0.7 + t * 1.6 + r) * 12]);
          return <path key={r} d={smooth(pts)} fill="none" stroke={col} strokeWidth={8} strokeLinecap="round" />;
        }
        // calm: long level lines, slowly breathing in length
        const len = w * (0.45 + 0.25 * Math.sin(t * 0.6 + r * 1.3));
        const cx = x + w / 2 + Math.sin(r * 2.1) * 30;
        return <path key={r} d={`M${cx - len / 2} ${yy} L${cx + len / 2} ${yy}`} stroke={col} strokeWidth={8} strokeLinecap="round" opacity={0.85} />;
      })}
      {kind === 2 && <circle cx={x + w * 0.62} cy={y + h * 0.2} r={30} fill="#F4F8FC" stroke={L.a} strokeWidth={4} />}
    </g>
  );
};

/** A door panel hinged on one side, swinging away (dir = 1, into the far room) or toward the viewer (dir = −1). */
const Panel: React.FC<{ x: number; y: number; w: number; h: number; open: number; hinge: 'left' | 'right'; dir: 1 | -1; color: string; seed: number }> = ({ x, y, w, h, open, hinge, dir, color, seed }) => {
  const th = ease(open) * (Math.PI / 180) * 78;
  const pw = w * Math.cos(th), dh = h * 0.07 * Math.sin(th) * dir;
  const hx = hinge === 'left' ? x : x + w, sx = hinge === 'left' ? 1 : -1;
  const at = (u: number, v: number): P => [hx + sx * u * pw, y + dh * u + v * (h - 2 * dh * u)];
  const quad = (u0: number, v0: number, u1: number, v1: number) => [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)] as P[];
  const shade = 1 - Math.sin(th) * 0.35;
  const knob = at(0.86, 0.52);
  return (
    <g>
      <path d={sketch(quad(0, 0, 1, 1), seed, 1.2, true)} fill={color} {...ink(LINE.normal)} />
      <path d={sketch(quad(0, 0, 1, 1), seed, 1.2, true)} fill={INK} opacity={1 - shade} />
      <path d={sketch(quad(0.16, 0.08, 0.84, 0.44), seed + 1, 0.8, true)} fill="none" {...ink(LINE.fine)} opacity={0.6} />
      <path d={sketch(quad(0.16, 0.56, 0.84, 0.92), seed + 2, 0.8, true)} fill="none" {...ink(LINE.fine)} opacity={0.6} />
      <ellipse cx={knob[0]} cy={knob[1]} rx={Math.max(3, 11 * Math.cos(th))} ry={11} fill={PAL.metal} {...ink(LINE.fine)} />
    </g>
  );
};

export type DoorsProps = { t: number; open: [number, number, number]; glow?: number };

export const Doors: React.FC<DoorsProps> = ({ t, open, glow = 1 }) => {
  const id = useUid();
  const { xs, top, floor } = DOORS;
  return (
    <Frame bg="#E4E1EA">
      {/* wall texture: a few faint vertical strokes */}
      {Array.from({ length: 14 }, (_, i) => <path key={i} d={sketch([[70 + i * 140, 40], [70 + i * 140, 820]], i + 3, 2)} stroke="#D9D5E1" strokeWidth={3} fill="none" />)}
      <rect x={0} y={floor} width={1920} height={1080 - floor} fill={PAL.floor} />
      {Array.from({ length: 5 }, (_, i) => <path key={i} d={sketch([[0, floor + 30 + i * i * 12], [1920, floor + 30 + i * i * 12]], i + 60, 1.4)} stroke={PAL.floorDark} strokeWidth={2.4} fill="none" opacity={0.5} />)}
      <path d={sketchRect(-20, floor - 26, 1960, 26, 2)} fill="#F2F0F4" {...ink()} />
      {xs.map((cx, k) => {
        const o = clamp01(open[k]), L = LIGHTS[k];
        const x = cx - DW / 2;
        return (
          <g key={k}>
            {/* light from the doorway on the floor */}
            {o > 0.01 && <path d={`M${x + 6} ${floor} L${x + DW - 6} ${floor} L${x + DW + 90} 1080 L${x - 90} 1080 Z`} fill={L.spill} opacity={ease(o) * 0.7 * glow} />}
            <path d={sketchRect(x - 26, top - 26, DW + 52, DH + 26, 20 + k, 1)} fill="#F7F5F1" {...ink()} />
            <clipPath id={`${id}d${k}`}><rect x={x} y={top} width={DW} height={DH} /></clipPath>
            <g clipPath={`url(#${id}d${k})`}>
              <Behind kind={k} x={x} y={top} w={DW} h={DH} t={t} />
              <rect x={x} y={top} width={DW} height={DH} fill="#FFFFFF" opacity={(1 - glow) * 0.5} />
            </g>
            <Panel x={x} y={top} w={DW} h={DH} open={o} hinge="left" dir={1} color={PAL.sofa} seed={30 + k * 5} />
            <path d={sketchRect(x, top, DW, DH, 40 + k, 1)} fill="none" {...ink(LINE.normal)} />
          </g>
        );
      })}
      {/* a small plant between the doors, for scale and calm */}
      {[740, 1180].map((px, i) => (
        <g key={i}>
          {[-30, -12, 8, 26].map((a, j) => <path key={j} d={smooth([[px, floor - 70], [px + a * 0.6, floor - 120], [px + a * 1.3, floor - 160 - (j % 2) * 20]])} fill="none" stroke={PAL.plantDark} strokeWidth={10} strokeLinecap="round" />)}
          <path d={sketch([[px - 34, floor - 76], [px + 34, floor - 76], [px + 26, floor - 26], [px - 26, floor - 26]], 70 + i, 1, true)} fill={PAL.plum} {...ink()} />
        </g>
      ))}
    </Frame>
  );
};

export type SingleDoorProps = { t: number; open: number; knock: number };
/** One door seen from inside a calm room. Door x 810..1110, top 300, floor 860; knock rings centre (960, 560). Free for captions: y < 260, and x < 600. */
export const SINGLE_DOOR = { x: 810, w: 300, top: 300, floor: 860, knockAt: [960, 560] as P } as const;

export const SingleDoor: React.FC<SingleDoorProps> = ({ t, open, knock }) => {
  const id = useUid();
  const { x, w, top, floor } = SINGLE_DOOR;
  const h = floor - top;
  const o = ease(open), kn = clamp01(knock);
  const [kx, ky] = SINGLE_DOOR.knockAt;
  return (
    <Frame bg={PAL.wallMint}>
      {/* the room: wall, floor, rug, a lamp and a plant */}
      <rect x={0} y={floor} width={1920} height={1080 - floor} fill={PAL.floor} />
      <path d={sketchRect(-20, floor - 24, 1960, 24, 3)} fill="#EEF5F3" {...ink()} />
      <ellipse cx={960} cy={980} rx={520} ry={70} fill={PAL.rug} {...ink()} />
      <ellipse cx={960} cy={980} rx={440} ry={52} fill="none" stroke="#C3CEDB" strokeWidth={6} />
      {/* soft light from behind the door on the floor */}
      {o > 0.01 && <path d={`M${x + 4} ${floor} L${x + w - 4} ${floor} L${x + w + 120} 1080 L${x - 160} 1080 Z`} fill="#F1D9E3" opacity={o * 0.75} />}
      {/* lamp */}
      <path d={`M380 ${floor - 4} L380 520`} {...ink(14)} /><path d={`M380 ${floor - 4} L380 520`} stroke={PAL.metal} strokeWidth={7} />
      <ellipse cx={380} cy={floor - 4} rx={60} ry={14} fill={PAL.chair} {...ink()} />
      <path d={`M300 420 L460 420 L430 520 L330 520 Z`} fill="#F4F2FA" {...ink()} transform="translate(0 0)" />
      <path d={`M330 520 L430 520 L520 ${floor - 20} L240 ${floor - 20} Z`} fill="#FFFFFF" opacity={0.28} />
      {/* picture: just calm shapes */}
      <path d={sketchRect(1300, 360, 240, 170, 8)} fill="#F7F5F1" {...ink()} />
      <path d={sketchRect(1320, 380, 200, 130, 9, 0.8)} fill={PAL.calmLight} />
      <path d="M1320 480 Q1380 430 1430 470 Q1470 440 1520 470 L1520 510 L1320 510 Z" fill={PAL.plant} />
      <circle cx={1470} cy={415} r={16} fill="#F4F8FC" />
      {/* plant */}
      {[-40, -18, 4, 24, 44].map((a, j) => <path key={j} d={smooth([[1560, floor - 110], [1560 + a * 0.7, floor - 190], [1560 + a * 1.4, floor - 250 - (j % 2) * 30]])} fill="none" stroke={PAL.plantDark} strokeWidth={13} strokeLinecap="round" />)}
      <path d={sketch([[1510, floor - 116], [1610, floor - 116], [1596, floor - 20], [1524, floor - 20]], 12, 1, true)} fill={PAL.chair} {...ink()} />

      {/* door frame, the light behind, the door */}
      <path d={sketchRect(x - 30, top - 30, w + 60, h + 30, 14, 1)} fill="#F7F5F1" {...ink()} />
      <clipPath id={`${id}sd`}><rect x={x} y={top} width={w} height={h} /></clipPath>
      <g clipPath={`url(#${id}sd)`}>
        <rect x={x} y={top} width={w} height={h} fill="#F4DDE5" />
        <circle cx={x + w * 0.4} cy={top + h * 0.45} r={160 + Math.sin(t * 1.2) * 10} fill="#FBEFF3" />
        <circle cx={x + w * 0.4} cy={top + h * 0.45} r={70} fill="#FFFFFF" opacity={0.8} />
      </g>
      <Panel x={x} y={top} w={w} h={h} open={open * 0.75} hinge="right" dir={-1} color="#A7B6C6" seed={50} />
      {/* the knock: rings travelling out from the door and fading */}
      {kn < 1 && [0, 1, 2].map((k) => {
        const p = clamp01(kn * 1.25 - k * 0.12);
        if (p <= 0) return null;
        return <ellipse key={k} cx={kx} cy={ky} rx={60 + p * 420} ry={50 + p * 330} fill="none" stroke={PAL.rose} strokeWidth={8 - p * 5} opacity={(1 - p) * 0.9} />;
      })}
      {kn < 0.3 && [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
        <path key={i} d={`M${kx + sx * 26} ${ky + sy * 22} L${kx + sx * 44} ${ky + sy * 36}`} {...ink(5)} opacity={1 - kn / 0.3} />
      ))}
      {void mix}
    </Frame>
  );
};
