import React from 'react';
import { INK, LINE, PAL, bowLine, clamp, lerp, stroke, wobEllipse, wobRect } from './ink';
import { BUILD, Build, Person, PersonProps } from './rig';

// The reel's cast: one rig, different builds, clothes and accessories. Each preset keeps its proportions,
// line weight, colours and eye design in every scene; scenes only change pose, expression and timing.

/* ---------- accessories (head space: centre of the head = 0,0) ---------- */

export const Glasses: React.FC<{ rx: number; ry: number; look: [number, number]; color?: string }> = ({ rx, ry, look, color = PAL.red }) => {
  const fx = look[0] * rx * 0.3, fy = look[1] * ry * 0.16;
  const spread = rx * 0.36 * (1 - Math.abs(look[0]) * 0.18);
  const r = rx * 0.27, y = -ry * 0.04;
  return (
    <g transform={`translate(${fx} ${fy})`} fill="none">
      <circle cx={-spread} cy={y} r={r} {...stroke(LINE * 0.85, color)} />
      <circle cx={spread} cy={y} r={r} {...stroke(LINE * 0.85, color)} />
      <path d={`M${-spread + r} ${y - 2} Q0 ${y - r * 0.45} ${spread - r} ${y - 2}`} {...stroke(LINE * 0.75, color)} />
      <path d={`M${-spread - r} ${y} L${-rx * 0.97 - fx} ${y - 6}`} {...stroke(LINE * 0.7, color)} />
      <path d={`M${spread + r} ${y} L${rx * 0.97 - fx} ${y - 6}`} {...stroke(LINE * 0.7, color)} />
    </g>
  );
};

export const Sunglasses: React.FC<{ rx: number; ry: number; look: [number, number]; on: number }> = ({ rx, ry, look, on }) => {
  if (on <= 0.01) return null;
  const fx = look[0] * rx * 0.3, fy = look[1] * ry * 0.16;
  const spread = rx * 0.37, y = lerp(-ry * 1.25, -ry * 0.05, clamp(on));
  const w = rx * 0.5, h = rx * 0.32;
  return (
    <g transform={`translate(${fx} ${fy + y})`}>
      <path d={wobRect(-spread - w / 2, -h / 2, w, h, 12, 3, 1.5)} fill={INK} {...stroke(LINE * 0.6)} />
      <path d={wobRect(spread - w / 2, -h / 2, w, h, 12, 4, 1.5)} fill={INK} {...stroke(LINE * 0.6)} />
      <path d={`M${-spread + w / 2} ${-h * 0.15} L${spread - w / 2} ${-h * 0.15}`} {...stroke(LINE * 0.7)} />
      <path d={`M${-spread - w * 0.3} ${-h * 0.25} l ${w * 0.25} 0`} {...stroke(LINE * 0.45, PAL.white)} opacity={0.8} />
      <path d={`M${spread - w * 0.3} ${-h * 0.25} l ${w * 0.25} 0`} {...stroke(LINE * 0.45, PAL.white)} opacity={0.8} />
    </g>
  );
};

export const Cowlick: React.FC<{ ry: number; t?: number }> = ({ ry, t = 0 }) => (
  <g fill="none">
    {[-1, 0, 1].map((k) => (
      <path key={k} d={`M${k * 10} ${-ry + 6} q ${k * 14 + Math.sin(t + k) * 4} ${-34} ${k * 26 + 14} ${-44}`} {...stroke(LINE * 0.9)} />
    ))}
  </g>
);

/** Cap; `back` turns the peak to the back of the head. */
export const Cap: React.FC<{ rx: number; ry: number; color: string; back?: boolean; button?: string }> = ({ rx, ry, color, back = false, button }) => {
  const peak = back ? -1 : 1;
  return (
    <g>
      <path d={`M${-rx * 0.98} ${-ry * 0.32} C${-rx * 0.95} ${-ry * 1.25} ${rx * 0.95} ${-ry * 1.25} ${rx * 0.98} ${-ry * 0.32} Q0 ${-ry * 0.46} ${-rx * 0.98} ${-ry * 0.32}Z`} fill={color} {...stroke()} />
      <path d={`M${peak * rx * 0.55} ${-ry * 0.38} Q${peak * rx * 1.25} ${-ry * 0.42} ${peak * rx * 1.42} ${-ry * 0.22} Q${peak * rx * 1.0} ${-ry * 0.2} ${peak * rx * 0.55} ${-ry * 0.3}Z`} fill={color} {...stroke(LINE * 0.9)} />
      {button && <circle cx={0} cy={-ry * 1.0} r={rx * 0.09} fill={button} {...stroke(LINE * 0.6)} />}
    </g>
  );
};

export const Mustache: React.FC<{ rx: number; ry: number; look: [number, number] }> = ({ rx, ry, look }) => (
  <path transform={`translate(${look[0] * rx * 0.3 + look[0] * rx * 0.05} ${ry * 0.3})`}
    d={`M0 0 C${-rx * 0.12} ${-rx * 0.1} ${-rx * 0.32} ${-rx * 0.06} ${-rx * 0.34} ${rx * 0.06} C${-rx * 0.2} ${rx * 0.02} ${-rx * 0.08} ${rx * 0.06} 0 ${rx * 0.02} C${rx * 0.08} ${rx * 0.06} ${rx * 0.2} ${rx * 0.02} ${rx * 0.34} ${rx * 0.06} C${rx * 0.32} ${-rx * 0.06} ${rx * 0.12} ${-rx * 0.1} 0 0Z`}
    fill={INK} />
);

/** Headphones resting on the shoulders (torso space). */
const Headphones: React.FC<{ b: Build }> = ({ b }) => (
  <g>
    <path d={`M${-b.torsoW * 0.3} ${-b.torsoH + 40} Q0 ${-b.torsoH + 92} ${b.torsoW * 0.3} ${-b.torsoH + 40}`} fill="none" {...stroke(LINE * 1.6, PAL.navy)} />
    <path d={wobEllipse(-b.torsoW * 0.33, -b.torsoH + 44, 20, 26, 5, 0.05, 8)} fill={PAL.red} {...stroke(LINE * 0.8)} />
    <path d={wobEllipse(b.torsoW * 0.33, -b.torsoH + 44, 20, 26, 6, 0.05, 8)} fill={PAL.red} {...stroke(LINE * 0.8)} />
  </g>
);

/* ---------- builds ---------- */

export const BUILDS = {
  narrator: { headRX: 100, headRY: 104, torsoW: 168, torsoH: 196, belly: 0.5, shX: 62, shirt: PAL.blue, shoe: PAL.navy, seed: 11 },
  litterer: { headRX: 80, headRY: 88, torsoW: 140, torsoH: 228, belly: 0.3, shX: 54, thigh: 96, shin: 92, upper: 92, fore: 86, shirt: PAL.teal, shoe: PAL.red, seed: 23 },
  cleaner: { headRX: 86, headRY: 90, torsoW: 172, torsoH: 206, belly: 0.85, shX: 62, shirt: PAL.navy, shoe: INK, seed: 37 },
  spitter: { headRX: 84, headRY: 82, torsoW: 182, torsoH: 176, belly: 1, shX: 64, thigh: 70, shin: 66, shirt: PAL.sage, shoe: PAL.woodDeep, seed: 41 },
  passerby: { headRX: 78, headRY: 84, torsoW: 140, torsoH: 200, belly: 0.4, shX: 54, shirt: PAL.redSoft, shoe: PAL.navy, seed: 53 },
} satisfies Record<string, Partial<Build>>;

type CastProps = Omit<PersonProps, 'build' | 'torsoDetail' | 'headBack' | 'headFront'> & { frame?: number };
const B = (k: keyof typeof BUILDS) => ({ ...BUILD, ...BUILDS[k] }) as Build;

/** The narrator: round red-framed glasses, a cowlick, blue hoodie with strings, headphones on the shoulders. */
export const Narrator: React.FC<CastProps> = (p) => {
  const b = B('narrator');
  const look = p.look ?? [0, 0];
  return (
    <Person {...p} build={b}
      torsoDetail={<g>
        <path d={bowLine(-16, -b.torsoH + 40, -20, -b.torsoH + 112, 3)} {...stroke(LINE * 0.6, PAL.white)} />
        <path d={bowLine(16, -b.torsoH + 40, 20, -b.torsoH + 112, -3)} {...stroke(LINE * 0.6, PAL.white)} />
        <path d={`M${-b.torsoW * 0.28} -46 Q0 -30 ${b.torsoW * 0.28} -46`} fill="none" {...stroke(LINE * 0.7)} />
        <Headphones b={b} />
      </g>}
      headBack={<Cowlick ry={b.headRY} t={(p.frame ?? 0) / 9} />}
      headFront={<Glasses rx={b.headRX} ry={b.headRY} look={look} />}
    />
  );
};

/** «أنت»: tall, backwards navy cap with a red button, teal shirt, red sneakers; sunglasses slide down on cue. */
export const Litterer: React.FC<CastProps & { shades?: number }> = ({ shades = 0, ...p }) => {
  const b = B('litterer');
  const look = p.look ?? [0, 0];
  return (
    <Person {...p} build={b}
      torsoDetail={<path d={wobRect(-b.torsoW * 0.32, -b.torsoH * 0.72, 38, 34, 6, 8, 1)} fill="none" {...stroke(LINE * 0.6)} />}
      headFront={<g><Cap rx={b.headRX} ry={b.headRY} color={PAL.navy} back button={PAL.red} /><Sunglasses rx={b.headRX} ry={b.headRY} look={look} on={shades} /></g>}
    />
  );
};

/** The street cleaner: navy overall with two reflective bands, blue cap, moustache. */
export const Cleaner: React.FC<CastProps> = (p) => {
  const b = B('cleaner');
  const look = p.look ?? [0, 0];
  return (
    <Person {...p} build={b}
      torsoDetail={<g>
        {[0.42, 0.68].map((k, i) => <path key={i} d={bowLine(-b.torsoW * 0.47, -b.torsoH * k, b.torsoW * 0.47, -b.torsoH * k, 6)} {...stroke(16, '#DCE6EE')} />)}
        <path d={wobRect(-24, -b.torsoH * 0.95, 48, 40, 6, 9, 1)} fill={PAL.blue} {...stroke(LINE * 0.6)} />
      </g>}
      headFront={<g><Cap rx={b.headRX} ry={b.headRY} color={PAL.blue} /><Mustache rx={b.headRX} ry={b.headRY} look={look} /></g>}
    />
  );
};

/** «غيرك»: short and round, sage shirt, flat cap. */
export const Spitter: React.FC<CastProps> = (p) => {
  const b = B('spitter');
  return (
    <Person {...p} build={b}
      torsoDetail={<g>{[-1, 1].map((k) => <circle key={k} cx={0} cy={-b.torsoH * (0.55 + k * 0.16)} r={5} fill={INK} />)}</g>}
      headFront={<path d={`M${-b.headRX * 0.95} ${-b.headRY * 0.45} Q0 ${-b.headRY * 1.35} ${b.headRX * 0.95} ${-b.headRY * 0.45} Q${b.headRX * 1.25} ${-b.headRY * 0.38} ${b.headRX * 1.05} ${-b.headRY * 0.3} Q0 ${-b.headRY * 0.5} ${-b.headRX * 0.95} ${-b.headRY * 0.45}Z`} fill={PAL.leafDeep} {...stroke()} />}
    />
  );
};

/** A passer-by with a hair tuft and a satchel strap. */
export const Passerby: React.FC<CastProps> = (p) => {
  const b = B('passerby');
  return (
    <Person {...p} build={b}
      torsoDetail={<path d={bowLine(-b.torsoW * 0.36, -b.torsoH * 0.95, b.torsoW * 0.4, -b.torsoH * 0.2, -6)} {...stroke(LINE * 1.3, PAL.woodDeep)} />}
      headBack={<path d={`M${-b.headRX * 0.2} ${-b.headRY * 0.95} q ${-10} ${-38} ${22} ${-46} q ${-4} ${22} ${14} ${40}`} fill={INK} {...stroke(LINE * 0.6)} />}
    />
  );
};
