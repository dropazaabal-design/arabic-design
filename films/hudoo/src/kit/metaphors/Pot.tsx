import React from 'react';
import { Hand } from '../characters/hands';
import { INK, LINE, PAL, hash, sketch, sketchRect } from '../style';
import { Frame, Puffs, clamp01, ease, flame, ink, mix, smooth, type P } from './util';

// A pot on a stove, side view. Pressing the lid hides the boil; turning the flame down calms it.
// Pot centre x = 960; rim y = 430; lid knob ≈ y 345; burner y = 745. Free for captions: the top band (y < 300)
// and both sides above the counter (x < 560 and x > 1360, y < 720).
export const POT = { cx: 960, rim: 430, bottom: 690, burner: 745, knob: [1250, 838] as P } as const;
const SKIN = '#F4E6E1', SLEEVE = '#3E8E7E';
const ENAMEL = '#8FB0CF', ENAMEL_D = '#6F93B8', LID = '#A9BBCF';

export type PotProps = {
  t: number;
  /** 0..1 how hard the pot boils */
  boil: number;
  /** 0..1 size of the blue flame */
  flame: number;
  /** 0..1 two hands press the lid down */
  press: number;
  /** 0..1 the lid tilts open and steam leaves gently */
  steamOut: number;
  /** 0..1 the stove knob turned down */
  knob?: number;
};

/** One arm in a green sleeve reaching down from off-frame: shoulder → elbow → wrist, the hand flat on the lid. Left side; the right is mirrored. */
const Arm: React.FC<{ sh: P; el: P; wr: P; ang: number }> = ({ sh, el, wr, ang }) => {
  const d = `M${sh[0]} ${sh[1]} L${el[0]} ${el[1]} L${wr[0]} ${wr[1]}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={40 + 8.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={SLEEVE} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${mix(sh[0], el[0], 0.3) - 9} ${mix(sh[1], el[1], 0.3)} L${el[0] - 9} ${el[1] - 6}`} stroke="#2F6F62" strokeWidth={9} strokeLinecap="round" opacity={0.6} />
      <g transform={`translate(${wr[0]} ${wr[1]}) rotate(${ang}) scale(5.2)`}><Hand g="chop" skin={SKIN} /></g>
    </g>
  );
};

export const Pot: React.FC<PotProps> = ({ t, boil, flame: fl, press, steamOut, knob = 0 }) => {
  const b = clamp01(boil), pr = ease(press), so = ease(steamOut);
  const { cx, rim, bottom, burner } = POT;
  // the lid: rattles with the boil unless held or opened
  const free = b * (1 - pr) * (1 - so);
  const jig = Math.max(0, Math.sin(t * 23)) * Math.max(0, Math.sin(t * 7.3 + 1));
  const lift = free * jig * 14 + so * 6;
  const tilt = free * Math.sin(t * 19) * 3.2 - so * 6;
  const shake = pr * b * Math.sin(t * 41) * 2.2;
  const bulge = 1 + pr * b * (0.02 + 0.008 * Math.sin(t * 13));
  const lidT = `translate(${shake} ${-lift}) rotate(${tilt} ${tilt < 0 ? cx - 252 : cx + 252} ${rim})`;
  const lidPath = `M${cx - 254} ${rim} Q${cx - 240} ${rim - 58} ${cx} ${rim - 64} Q${cx + 240} ${rim - 58} ${cx + 254} ${rim} Z`;
  // bubbles peeking at the rim while it boils
  const bubbles = Array.from({ length: 16 }, (_, i) => {
    const ph = (t * (0.9 + hash(i) * 0.8) + hash(i * 3.3)) % 1;
    const x = cx + (hash(i * 7.1) - 0.5) * 480;
    return { x, y: rim - 2 - ph * (6 + lift * 0.8), r: (6 + hash(i * 1.7) * 10) * Math.sin(ph * Math.PI), on: hash(i * 5.5) < b };
  });
  // puffs that escape at the rim: sideways squirts when pressed, soft rising clouds when the lid is open
  const puffs = (n: number, x0: number, y0: number, dx: number, rise: number, size: number, speed: number, seed: number, amt: number) =>
    Array.from({ length: n }, (_, i) => {
      const u = (t * speed + i / n + hash(seed + i) * 0.2) % 1;
      const wob = Math.sin(u * 6 + i + seed) * 18 * u;
      return [x0 + dx * u + wob, y0 - rise * u, size * (0.4 + u) * amt] as [number, number, number];
    }).filter((p) => p[2] > 1);
  const kAng = mix(58, -58, ease(knob));
  const [kx, ky] = POT.knob;

  return (
    <Frame bg={PAL.wallBlue}>
      {/* wall tiles behind the stove */}
      <g opacity={0.55}>
        {Array.from({ length: 9 }, (_, r) => <path key={`h${r}`} d={sketch([[0, 300 + r * 52], [1920, 300 + r * 52]], r + 2, 1.2)} stroke="#C4D2E2" strokeWidth={3} fill="none" />)}
        {Array.from({ length: 23 }, (_, c) => <path key={`v${c}`} d={sketch([[c * 88 + (c % 2) * 10, 300], [c * 88 + (c % 2) * 10, 740]], c + 40, 1)} stroke="#C4D2E2" strokeWidth={3} fill="none" />)}
      </g>
      {/* counter and cabinets */}
      <path d={sketchRect(-20, 770, 1960, 340, 3)} fill={PAL.wallGrey} {...ink()} />
      {[0, 280, 1400, 1680].map((x, i) => <path key={i} d={sketchRect(x + 30, 810, 220, 240, 10 + i)} fill="none" stroke={INK} strokeWidth={LINE.fine} opacity={0.5} />)}
      {[140, 420, 1510, 1790].map((x, i) => <path key={i} d={`M${x - 26} 850 L${x + 26} 850`} {...ink(7)} />)}
      {/* stove front: oven door and knobs */}
      <path d={sketchRect(560, 760, 800, 340, 5)} fill={PAL.table} {...ink(LINE.bold)} />
      <path d={sketchRect(620, 880, 680, 180, 6)} fill={PAL.chair} {...ink()} />
      <path d={sketchRect(660, 910, 600, 110, 7)} fill={PAL.screen} {...ink(LINE.fine)} />
      <path d="M690 925 L760 925" stroke={PAL.screenGlow} strokeWidth={6} strokeLinecap="round" opacity={0.35} />
      <path d={`M700 864 L1220 864`} {...ink(10)} />
      <path d={`M700 864 L1220 864`} stroke={PAL.metal} strokeWidth={5} strokeLinecap="round" />
      <circle cx={670} cy={ky} r={28} fill={PAL.paper} {...ink()} />
      <path d={`M670 ${ky} L670 ${ky - 20}`} {...ink(6)} />
      {/* the knob that matters: three flame marks for low, mid and high */}
      {[-58, 0, 58].map((a, i) => {
        const r = 50, ax = kx + Math.sin((a * Math.PI) / 180) * r, ay = ky - Math.cos((a * Math.PI) / 180) * r;
        return <g key={i}><path d={flame(ax, ay + 6 + i * 3, 10 + i * 4, 12 + i * 7)} fill={PAL.flameBlue} {...ink(1.8)} /><path d={flame(ax, ay + 6 + i * 3, 5 + i * 2, 6 + i * 3.5)} fill={PAL.flameCore} /></g>;
      })}
      <circle cx={kx} cy={ky} r={28} fill={PAL.paper} {...ink()} />
      <g transform={`rotate(${kAng} ${kx} ${ky})`}><path d={`M${kx} ${ky + 2} L${kx} ${ky - 21}`} {...ink(7)} /></g>
      <path d={sketchRect(540, 738, 840, 30, 8)} fill={PAL.tableEdge} {...ink(LINE.bold)} />

      {/* flame: a row of blue tongues on the burner */}
      {fl > 0.01 && Array.from({ length: 11 }, (_, i) => {
        const u = i / 10, x = cx - 170 + u * 340;
        const edge = Math.abs(u - 0.5) * 2;
        const h = (16 + 92 * fl * (1 - edge * 0.25)) * (0.82 + 0.18 * Math.sin(t * 11 + i * 1.7));
        const w = 24 + 18 * fl;
        const lean = (u - 0.5) * 50 * fl + Math.sin(t * 7 + i) * 4;
        return (
          <g key={i}>
            <path d={flame(x, burner + 2, w, h, lean)} fill={PAL.flameBlue} {...ink(LINE.fine)} />
            <path d={flame(x, burner + 2, w * 0.5, h * 0.55, lean * 0.5)} fill={PAL.flameCore} />
          </g>
        );
      })}
      <path d={sketchRect(cx - 200, burner - 4, 400, 14, 9)} fill={PAL.chairDark} {...ink()} />
      {[cx - 230, cx + 230].map((x, i) => <path key={i} d={`M${x - 22} ${burner} L${x} ${bottom - 2} L${x + 22} ${burner}`} fill="none" {...ink(7)} />)}

      {/* the pot */}
      <g transform={`translate(${cx + shake} ${bottom}) scale(${bulge} ${2 - bulge}) translate(${-cx} ${-bottom})`}>
        {[-1, 1].map((sd) => <path key={sd} d={`M${cx + sd * 258} ${rim + 50} Q${cx + sd * 320} ${rim + 52} ${cx + sd * 318} ${rim + 82} Q${cx + sd * 314} ${rim + 100} ${cx + sd * 258} ${rim + 96}`} fill="none" {...ink(22)} />)}
        {[-1, 1].map((sd) => <path key={`h${sd}`} d={`M${cx + sd * 258} ${rim + 50} Q${cx + sd * 320} ${rim + 52} ${cx + sd * 318} ${rim + 82} Q${cx + sd * 314} ${rim + 100} ${cx + sd * 258} ${rim + 96}`} fill="none" stroke={PAL.chair} strokeWidth={13} strokeLinecap="round" />)}
        <path d={`M${cx - 260} ${rim} L${cx + 260} ${rim} L${cx + 252} ${bottom - 36} Q${cx + 248} ${bottom} ${cx + 210} ${bottom} L${cx - 210} ${bottom} Q${cx - 248} ${bottom} ${cx - 252} ${bottom - 36} Z`} fill={ENAMEL} {...ink(LINE.bold)} />
        <path d={`M${cx - 254} ${rim + 150} L${cx + 254} ${rim + 150} L${cx + 252} ${rim + 190} L${cx - 252} ${rim + 190} Z`} fill={ENAMEL_D} />
        <path d={`M${cx - 210} ${rim + 40} L${cx - 210} ${rim + 120}`} stroke="#D5E4F1" strokeWidth={14} strokeLinecap="round" opacity={0.8} />
        <path d={`M${cx - 210} ${rim + 140} L${cx - 210} ${rim + 152}`} stroke="#D5E4F1" strokeWidth={14} strokeLinecap="round" opacity={0.8} />
        <path d={sketchRect(cx - 272, rim - 4, 544, 24, 12, 1)} fill={ENAMEL_D} {...ink()} />
      </g>
      {/* boiling bubbles at the rim, under the lid */}
      {bubbles.map((q, i) => q.on && q.r > 0.5 && <circle key={i} cx={q.x} cy={q.y} r={q.r} fill="#EEF4F9" {...ink(2)} />)}
      {/* the lid */}
      <g transform={lidT}>
        <path d={lidPath} fill={LID} {...ink(LINE.bold)} />
        <path d={`M${cx - 170} ${rim - 34} Q${cx - 90} ${rim - 54} ${cx - 10} ${rim - 56}`} fill="none" stroke="#E2EAF2" strokeWidth={10} strokeLinecap="round" />
        <path d={sketchRect(cx - 34, rim - 92, 68, 30, 13, 1)} fill={PAL.chair} {...ink()} />
        <path d={`M${cx - 260} ${rim} L${cx + 260} ${rim}`} {...ink(LINE.bold)} />
      </g>
      {/* rattle marks */}
      {free > 0.05 && [-1, 1].map((sd) => (
        <g key={sd} opacity={clamp01(free * 1.6) * (0.4 + 0.6 * jig)}>
          {[0, 1, 2].map((k) => <path key={k} d={`M${cx + sd * (300 + k * 26)} ${rim - 70 + k * 22} q${sd * 18} 4 ${sd * 30} -4`} fill="none" {...ink(LINE.normal)} />)}
        </g>
      ))}
      {/* steam: little squirts while rattling or pressed, a calm column when the lid is open */}
      <Puffs c={[...puffs(4, cx - 270, rim - 6, -170, 80, 24, 1.1, 1, b * (1 - so) * (0.4 + pr * 0.6)), ...puffs(4, cx + 270, rim - 6, 170, 80, 24, 1.1, 7, b * (1 - so) * (0.4 + pr * 0.6))]} fill={PAL.steam} line={LINE.fine} seed={2} />
      {/* the lid tilted open: three soft wisps rise and thin out */}
      {so > 0.02 && [0, 1, 2].map((k) => {
        const x0 = cx + 150 + k * 46, y0 = rim - 30 - k * 8, hh = (220 + k * 40) * (0.4 + 0.6 * so) * (0.5 + 0.5 * b);
        const pts: P[] = Array.from({ length: 12 }, (_, i) => { const u = i / 11; return [x0 + u * 40 + Math.sin(u * 7 - t * 2.4 + k * 2) * 16 * u, y0 - u * hh]; });
        return <g key={k} opacity={so * (0.55 + 0.45 * b)}>
          <path d={smooth(pts)} fill="none" stroke={INK} strokeWidth={21} strokeLinecap="round" opacity={0.35} />
          <path d={smooth(pts)} fill="none" stroke={PAL.steam} strokeWidth={15} strokeLinecap="round" />
        </g>;
      })}
      {/* pressure lines: the boil does not go away under the hands */}
      {pr * b > 0.02 && Array.from({ length: 14 }, (_, i) => {
        const a = (-0.95 + (i / 13) * 1.9) * Math.PI * 0.62 + Math.PI / 2;
        const r0 = 330 + Math.sin(t * 17 + i) * 6, len = 26 + 34 * pr * b;
        const ox = cx + Math.cos(a) * r0 * -1, oy = 600 - Math.sin(a) * r0 * 0.75;
        const dx = -Math.cos(a), dy = -Math.sin(a) * 0.75;
        return <path key={i} d={`M${ox} ${oy} L${ox + dx * len} ${oy + dy * len}`} stroke={PAL.warn} strokeWidth={6} strokeLinecap="round" opacity={clamp01(pr * b * 1.5)} />;
      })}
      {/* the hands that hold the lid down */}
      {pr > 0.01 && [1, -1].map((sd) => {
        const up = (1 - pr) * -420;
        // the lid's dome at x: the palm lies along it, fingers toward the knob
        const wx = 808, wy = rim - 64 * (1 - ((wx - cx) / 254) ** 2) - 26;
        return <g key={sd} transform={`translate(0 ${up})`}>
          <g transform={sd === 1 ? '' : `translate(${2 * cx} 0) scale(-1 1)`}>
            <Arm sh={[520, -140]} el={[560 + shake, 210]} wr={[wx + shake, wy]} ang={-14} />
          </g>
        </g>;
      })}
    </Frame>
  );
};
