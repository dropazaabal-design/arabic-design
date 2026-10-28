import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CamKey, GsapCamera, tween } from '@motion/index';
import { Glasses } from '@mukarram/characters/cast';
import { Expression, ExprName } from '@mukarram/characters/face';
import { INK, LINE, lerp, stroke, wobEllipse, wobRect } from '@mukarram/characters/ink';
import { BUILD, Build, POSES, Person, Pose, blinkAt, breath } from '@mukarram/characters/rig';
import { BUILDS } from '@mukarram/characters/cast';
import { Boil } from '@mukarram/video/stage';
import { handAt, reachB } from '../../../power-of-no-b/src/characters/worker';

export const W = 1080, H = 1920;

/** Reel A's palette: a plum cinema lit by a mint screen, raspberry velvet, teal exit light; night navy outside.
 *  No yellow, orange or gold anywhere (the brief), and none of the earlier reels' palettes. */
export const C = {
  night: '#1D1530', wall: '#2A1E45', wallLine: '#352657', far: '#221838',
  velvet: '#8E2753', velvetDeep: '#5E1736', velvetHi: '#B8366E',
  screen: '#CFF5EC', screenDim: '#8FCFC4', frame: '#100B1D', beam: '#DDF5EE',
  teal: '#2EC4A6', tealDeep: '#1A8C77', mint: '#DDF5EE', paper: '#F4F1EA',
  hero: '#6E7FD8', heroDeep: '#4F5FB8', shoe: '#2A2140', hair: '#2B2033',
  lilac: '#B9A6E8', lilacDeep: '#8B74C9', water: '#24577F', waterDeep: '#143A5A', waterHi: '#7FC8E0',
  street: '#1B2A4A', streetDeep: '#121D36', neon: '#E0479E', star: '#E8F0FF', grass: '#2F6E66',
  n1: '#4F5FB8', n2: '#C25B8E', n3: '#3C8C9E', n4: '#8C6FD1', n5: '#5C9E7E',
};

export const FONT = 'Cairo, sans-serif';
export const s30 = (s: number) => s * 30;   // the mukarram tracks count 30-fps frames

/** One shot: background, the world under a GSAP camera (local seconds), the doodle boil, then HTML overlays. */
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

/* ---------------- the hero: glasses, side-swept fringe, periwinkle hoodie ---------------- */

export const HERO_B: Build = { ...BUILD, headRX: 90, headRY: 96, torsoW: 152, torsoH: 196, belly: 0.5, shX: 56, shirt: C.hero, shoe: C.shoe, seed: 71 };
/** sit 0 = standing, 1 = seated (thighs foreshortened: the seat hides them); a stand-up is a tween of `sit`. */
export const sitBuild = (b: Build, sit: number): Build => ({ ...b, thigh: lerp(b.thigh, 30, sit), shin: lerp(b.shin, 70, sit) });

const Fringe: React.FC<{ rx: number; ry: number; mess: number }> = ({ rx, ry, mess }) => (
  <g>
    <path d={`M${-rx * 0.98} ${-ry * 0.12} C${-rx * 1.05} ${-ry * 0.95} ${-rx * 0.2} ${-ry * 1.22} ${rx * 0.45} ${-ry * 1.02} C${rx * 0.95} ${-ry * 0.86} ${rx * 1.05} ${-ry * 0.5} ${rx * 0.98} ${-ry * 0.16}
      C${rx * 0.7} ${-ry * 0.55} ${rx * 0.1} ${-ry * 0.62} ${-rx * 0.38} ${-ry * 0.5} C${-rx * 0.62} ${-ry * 0.42} ${-rx * 0.85} ${-ry * 0.3} ${-rx * 0.98} ${-ry * 0.12}Z`} fill={C.hair} {...stroke(LINE * 0.8)} />
    {mess > 0 && [-0.5, -0.1, 0.35].map((k, i) => (
      <path key={i} d={`M${rx * k} ${-ry * 1.0} q ${6 + i * 4} ${-28 * mess} ${20 + i * 3} ${-18 * mess}`} fill="none" {...stroke(LINE * 0.7, C.hair)} />
    ))}
  </g>
);

const Stubble: React.FC<{ rx: number; ry: number; k: number }> = ({ rx, ry, k }) => (
  <g opacity={k}>
    {Array.from({ length: 22 }, (_, i) => {
      const a = Math.PI * (0.18 + (i / 21) * 0.64), r = 0.82 + ((i * 37) % 7) / 60;
      return <circle key={i} cx={Math.cos(a) * rx * r} cy={Math.sin(a) * ry * r * 0.92 + 4} r={3.2} fill={C.hair} />;
    })}
  </g>
);

export type HeroProps = {
  x: number; y: number; s: number; T: number; pose?: Pose; expr?: Expression | ExprName; look?: [number, number];
  sit?: number; stubble?: number; mess?: number; facing?: 1 | -1; talk?: number;
  /** world points for the hands (IK) and what each hand holds (drawn at the wrist, in world space) */
  handL?: [number, number] | null; handR?: [number, number] | null; holdL?: React.ReactNode; holdR?: React.ReactNode; blinkSeed?: number;
};

/** The hero, with optional IK hands and held props drawn at the hands (so they follow every move). */
export const Hero: React.FC<HeroProps> = ({ x, y, s, T, pose = POSES.stand as Pose, expr = 'neutral', look = [0, 0], sit = 0, stubble = 0, mess = 0, facing = 1, talk = 0, handL = null, handR = null, holdL, holdR, blinkSeed = 71 }) => {
  const b = sitBuild(HERO_B, sit);
  const at = { x, y, s, facing, bob: breath(s30(T), 30, 2) * 2 };
  const p = handL || handR ? reachB(b, pose, at, handL, handR, { L: 1, R: -1 }) : pose;
  const hl = handAt(b, p, -1, at), hr = handAt(b, p, 1, at);
  return (
    <g>
      <Person x={x} y={y} s={s} facing={facing} build={b} pose={p} expr={expr} look={look} bob={at.bob} talk={talk}
        blink={blinkAt(Math.floor(s30(T)), 30, blinkSeed)} shadow={sit < 0.5}
        torsoDetail={<g>
          <path d={`M-14 ${-b.torsoH + 30} L-18 ${-b.torsoH + 96} M14 ${-b.torsoH + 30} L18 ${-b.torsoH + 96}`} {...stroke(LINE * 0.55, C.mint)} />
          <path d={`M${-b.torsoW * 0.3} -60 Q0 -44 ${b.torsoW * 0.3} -60`} fill="none" {...stroke(LINE * 0.7, C.heroDeep)} />
        </g>}
        headFront={<g><Fringe rx={b.headRX} ry={b.headRY} mess={mess} /><Glasses rx={b.headRX} ry={b.headRY} look={look} color={C.tealDeep} /><Stubble rx={b.headRX} ry={b.headRY} k={stubble} /></g>} />
      {holdL && <g transform={`translate(${hl[0]} ${hl[1]}) scale(${s})`}>{holdL}</g>}
      {holdR && <g transform={`translate(${hr[0]} ${hr[1]}) scale(${s})`}>{holdR}</g>}
    </g>
  );
};

/** Audience members: the mukarram builds recoloured for this cinema. */
export const NEIGHBOURS = {
  n1: { ...BUILD, ...BUILDS.spitter, shirt: C.n1 } as Build,
  n2: { ...BUILD, ...BUILDS.passerby, shirt: C.n2 } as Build,
  n3: { ...BUILD, ...BUILDS.cleaner, shirt: C.n3 } as Build,
  n4: { ...BUILD, ...BUILDS.litterer, shirt: C.n4 } as Build,
  n5: { ...BUILD, ...BUILDS.narrator, shirt: C.n5 } as Build,
};
export const Neighbour: React.FC<{ who: keyof typeof NEIGHBOURS; x: number; y: number; s: number; T: number; sit?: number; expr?: Expression | ExprName; look?: [number, number]; pose?: Pose; facing?: 1 | -1; seed: number; opacity?: number }> = ({ who, x, y, s, T, sit = 1, expr = 'neutral', look = [0, 0], pose = POSES.stand as Pose, facing = 1, seed, opacity = 1 }) => (
  <Person x={x} y={y} s={s} facing={facing} build={sitBuild(NEIGHBOURS[who], sit)} pose={pose} expr={expr} look={look} opacity={opacity}
    blink={blinkAt(Math.floor(s30(T)), 30, seed)} bob={breath(s30(T), 30, seed) * 2} shadow={false} />
);

/* ---------------- cinema props ---------------- */

/** Seat back (behind the person) and seat front (cushion + arms, over the thighs), at hip height yHip. */
export const SeatBack: React.FC<{ x: number; yHip: number; s: number }> = ({ x, yHip, s }) => (
  <path d={wobRect(x - 86 * s, yHip - 236 * s, 172 * s, 250 * s, 34 * s, x % 7, 2)} fill={C.velvet} {...stroke(LINE * s)} />
);
export const SeatFront: React.FC<{ x: number; yHip: number; s: number }> = ({ x, yHip, s }) => (
  <g>
    <path d={wobRect(x - 92 * s, yHip - 14 * s, 184 * s, 58 * s, 16 * s, x % 5, 2)} fill={C.velvetDeep} {...stroke(LINE * s)} />
    {[-1, 1].map((k) => <path key={k} d={wobRect(x + k * 98 * s - 13 * s, yHip - 66 * s, 26 * s, 120 * s, 10 * s, x % 3 + k, 1.5)} fill={C.velvetDeep} {...stroke(LINE * 0.9 * s)} />)}
  </g>
);

/** The cinema ticket (own space: centre 0,0, 220 × 110): mint paper, raspberry stub, the price in Western digits. */
export const Ticket: React.FC<{ glow?: number; crumple?: number }> = ({ glow = 0, crumple = 0 }) => (
  <g transform={`scale(${1 - crumple * 0.5} ${1 - crumple * 0.25}) rotate(${crumple * 14})`}>
    {glow > 0 && <ellipse cx={0} cy={0} rx={150} ry={90} fill={C.teal} opacity={0.35 * glow} />}
    <path d="M-110 -55 L110 -55 L110 -16 A14 14 0 0 0 110 16 L110 55 L-110 55 L-110 16 A14 14 0 0 0 -110 -16 Z" fill={C.mint} {...stroke(LINE * 0.8)} />
    <path d="M58 -50 L58 50" {...stroke(4, C.velvet)} strokeDasharray="8 8" />
    <rect x={64} y={-50} width={42} height={100} fill={C.velvet} opacity={0.85} />
    <text x={-22} y={24} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={70} fill={INK}>150</text>
    <text x={-22} y={-26} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={800} fontSize={22} fill={C.velvetDeep}>تذكرة</text>
  </g>
);

/** Popcorn bucket (own space: bottom-centre at 0,0); `level` 1 = full, 0 = empty. */
export const Popcorn: React.FC<{ level: number }> = ({ level }) => (
  <g>
    {level > 0.02 && Array.from({ length: 9 }, (_, i) => (
      <circle key={i} cx={-38 + (i % 5) * 19 + (i > 4 ? 9 : 0)} cy={-112 + (1 - level) * 70 - (i > 4 ? 18 : 0)} r={15} fill={C.paper} {...stroke(LINE * 0.5)} />
    ))}
    <path d="M-50 -112 L50 -112 L38 0 L-38 0 Z" fill={C.paper} {...stroke(LINE * 0.8)} />
    {[-30, 0, 30].map((dx, i) => <path key={i} d={`M${dx - 8} -110 L${dx + 8} -110 L${dx * 0.76 + 6} -2 L${dx * 0.76 - 6} -2 Z`} fill={C.velvet} />)}
  </g>
);

/** Wall clock; hands turn `turns` times around (minute hand), the hour hand 1/12 of that. */
export const Clock: React.FC<{ x: number; y: number; r: number; turns: number }> = ({ x, y, r, turns }) => {
  const m = turns * 360, h = turns * 30 + 60;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={C.mint} {...stroke(LINE)} />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M0 ${-r * 0.86} L0 ${-r * 0.74}`} transform={`rotate(${i * 30})`} {...stroke(4)} />)}
      <path d={`M0 0 L0 ${-r * 0.5}`} transform={`rotate(${h})`} {...stroke(LINE * 1.1)} />
      <path d={`M0 0 L0 ${-r * 0.74}`} transform={`rotate(${m})`} {...stroke(LINE * 0.8, C.velvet)} />
      <circle r={6} fill={INK} />
    </g>
  );
};

/** The glowing exit sign over the door (own space: centre 0,0). */
export const ExitSign: React.FC<{ glow: number }> = ({ glow }) => (
  <g>
    <ellipse cx={0} cy={0} rx={170} ry={90} fill={C.teal} opacity={0.18 + 0.3 * glow} />
    <rect x={-110} y={-46} width={220} height={92} rx={14} fill={C.tealDeep} {...stroke(LINE)} />
    <text x={20} y={20} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={900} fontSize={54} fill={C.mint}>خروج</text>
    <path d="M-62 0 L-92 0 M-80 -12 L-92 0 L-80 12" {...stroke(6, C.mint)} fill="none" />
  </g>
);

/** The film: a cardboard dinosaur on visible strings (own space: centre-bottom at 0,0). */
export const Dino: React.FC<{ T: number; headOff?: number; sing?: number }> = ({ T, headOff = 0, sing = 0 }) => {
  const wob = Math.sin(T * 5) * 6;
  const mouth = sing > 0 ? 0.5 + 0.5 * Math.abs(Math.sin(T * 9)) : 0.2;
  const hx = 90 + headOff * 160, hy = -250 + headOff * 230, hr = headOff * 140;
  return (
    <g transform={`rotate(${wob * 0.4})`}>
      {/* strings to the top of the frame — the special effect nobody hid */}
      <path d={`M-60 -200 L-60 -900 M60 -190 L60 -900`} {...stroke(2, C.screenDim)} />
      <path d={wobEllipse(-20, -120, 130, 90, 3, 0.06, 10)} fill={C.lilac} {...stroke(LINE)} />
      {[-70, 30].map((dx, i) => <path key={i} d={`M${dx} -40 L${dx - 6} 0 L${dx + 26} 0 L${dx + 22} -40`} fill={C.lilac} {...stroke(LINE * 0.8)} />)}
      <path d="M-140 -120 Q-230 -110 -250 -40" fill="none" {...stroke(26, INK)} /><path d="M-140 -120 Q-230 -110 -250 -40" fill="none" {...stroke(16, C.lilac)} />
      {[-90, -40, 10].map((dx, i) => <path key={i} d={`M${dx} -205 l18 -30 l18 30`} fill={C.lilacDeep} {...stroke(LINE * 0.6)} />)}
      <g transform={`translate(${hx} ${hy}) rotate(${hr})`}>
        <path d={wobEllipse(0, 0, 80, 56, 4, 0.05, 10)} fill={C.lilac} {...stroke(LINE)} />
        <circle cx={22} cy={-14} r={10} fill={INK} />
        <path d={`M20 20 Q50 ${20 + 34 * mouth} 78 14`} fill={INK} {...stroke(LINE * 0.6)} />
        <path d="M-20 -40 L-20 -900" {...stroke(2, C.screenDim)} opacity={1 - headOff} />
      </g>
      {sing > 0 && <g transform={`translate(${hx + 70} ${hy + 30})`}><path d="M0 0 l60 40" {...stroke(10, INK)} /><circle cx={70} cy={48} r={20} fill={C.velvet} {...stroke(LINE * 0.7)} /></g>}
    </g>
  );
};

/** Floating musical notes (path-drawn), rising from (x, y). */
export const Notes: React.FC<{ T: number; x: number; y: number; on: number }> = ({ T, x, y, on }) => (
  <g opacity={on}>
    {[0, 1, 2, 3].map((i) => {
      const k = ((T * 0.7 + i * 0.25) % 1);
      return (
        <g key={i} transform={`translate(${x + Math.sin(k * 6 + i) * 60 + i * 50} ${y - k * 320}) scale(${0.8 + i * 0.1})`} opacity={1 - k}>
          <path d="M0 0 L0 -60 L34 -70 L34 -12" fill="none" {...stroke(7, C.mint)} />
          <ellipse cx={-8} cy={2} rx={14} ry={10} fill={C.mint} /><ellipse cx={26} cy={-8} rx={14} ry={10} fill={C.mint} />
        </g>
      );
    })}
  </g>
);

/** A wave line for water surfaces (seeded by x, animated by T). */
export const waveTop = (x0: number, x1: number, y: number, T: number, amp = 10) => {
  let d = `M${x0} ${y}`;
  for (let x = x0; x <= x1; x += 40) d += ` L${x} ${(y + Math.sin(x * 0.02 + T * 2.4) * amp).toFixed(1)}`;
  return d;
};

export { tween };
