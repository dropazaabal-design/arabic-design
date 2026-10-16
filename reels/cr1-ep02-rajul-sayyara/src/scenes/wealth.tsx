import React from 'react';
import { Box, Car, INK, Jar, Note, walk } from '../../../../motion-core/src/cartoon';
import { Arrow, Card, Clock, Eye, GhostCar, Months, Say, Strike, Tag, Watch } from '../graphics';
import { StageSet } from '../sets';
import { Actor, F, Frame, P, STAGE_CAM, by, type Ratio } from '../stage';
import { C, CAST } from '../theme';
import { ease, life, mix, prog, sec } from '../time';

// E7 (L7): two things we mix up. Rich is what you see: money coming in and going out in front of
// people (Majid's car). Wealth is what you don't: money not spent — the car not bought, the
// watch not worn — in a jar drawn only as a dashed outline. Saad's was there all along; nobody
// turned to look. E8 (L8): what the hidden wealth bought him: time. R4 is the reel's short form.

/** A jar nobody sees: dashed outline, the notes inside faint. */
const GhostJar: React.FC<{ level: number; s?: number; id: string; o?: number }> = ({ level, s = 1, id, o = 1 }) => (
  <g transform={`scale(${s})`} opacity={o}>
    <g opacity={0.45}><Jar id={id} level={level} note={C.mint} noteShade={C.teal} /></g>
    <path d="M-75 -12 Q-75 0 -61 0 L61 0 Q75 0 75 -12 L75 -156 Q75 -168 57 -170 L-57 -170 Q-75 -168 -75 -156 Z" fill="none" stroke={C.light} strokeWidth={4} strokeDasharray="12 9" />
  </g>
);

const notesFall = (f: number, from: number, to: [number, number], start: [number, number], n = 4, dur = sec(1)) =>
  Array.from({ length: n }, (_, j) => {
    const t = prog(f, from + j * sec(0.12), dur, ease.inOut);
    if (t <= 0 || t >= 1) return null;
    return <g key={j} transform={`translate(${mix(start[0] + (j - n / 2) * 40, to[0], t)} ${mix(start[1], to[1], t) - Math.sin(Math.PI * t) * 60})`}>
      <Note color={C.mint} shade={C.teal} rot={t * 200 + j * 40} scale={0.6} /></g>;
  });

export type WealthBeats = { start: number; rich: number; wealth: number; inOut: number; seen: number; unspent: number; car: number; carGone: number; watch: number; watchGone: number; saad: number; nobody: number; end: number };

export const Wealth: React.FC<{ f: number; k: WealthBeats; ratio: Ratio }> = ({ f, k, ratio }) => {
  const V = ratio !== '16x9';
  // panels: rich on the right (read first), wealth on the left; stacked top / bottom in portrait
  const R = by(ratio, { x: 1440, y: 600 }, { x: 540, y: 330 }), L = by(ratio, { x: 480, y: 600 }, { x: 540, y: 830 });
  const split = prog(f, k.start + sec(1.2), sec(1.2), ease.inOut);
  const richO = prog(f, k.rich - sec(0.1), sec(0.4)), wealthO = prog(f, k.wealth - sec(0.1), sec(0.4));
  const jarLevel = mix(0.1, 0.45, prog(f, k.unspent, sec(1.2))) + mix(0, 0.25, prog(f, k.carGone, sec(1))) + mix(0, 0.2, prog(f, k.watchGone, sec(1)));
  const ghostCar = life(f, k.car - sec(0.1), k.carGone + sec(0.2), sec(0.4), sec(0.3));
  const ghostWatch = life(f, k.watch - sec(0.1), k.watchGone + sec(0.2), sec(0.4), sec(0.3));
  const passer = walk(f, by(ratio, 2100, 1300), by(ratio, 900, -200), k.nobody - sec(1.6), sec(3.4), 34);
  const js = by(ratio, 1.9, 1.25), cs = by(ratio, 1.2, 0.8);
  const labelY = (p: { y: number }) => p.y - by(ratio, 420, 290);
  return (
    <Frame ratio={ratio} c={STAGE_CAM[ratio]} world={<>
      <StageSet />
      {/* the two things, first one blur, then pulled apart */}
      {/* two things we mix up: two blank cards on top of each other, pulled apart into the panels */}
      {[R, L].map((p, j) => {
        const o = prog(f, k.start, sec(0.4)) * (1 - prog(f, (j ? k.wealth : k.rich) - sec(0.1), sec(0.3)));
        const home = { x: by(ratio, 960, 540) + (j ? -40 : 40), y: by(ratio, 520, 560) + (j ? 30 : -30) };
        const x = mix(home.x, p.x, split), y = mix(home.y, labelY(p), split);
        return o > 0 && <g key={j} transform={`translate(${x} ${y}) rotate(${(1 - split) * (j ? -5 : 5)})`}>
          <Card w={mix(380, 260, split)} h={mix(220, 84, split)} o={o} fill="#1C2D44" edge={j ? C.green : C.blue} />
        </g>;
      })}
      <path d={V ? 'M180 580 L900 580' : 'M960 150 L960 1000'} stroke={C.mist} strokeWidth={3} strokeDasharray="14 12" opacity={0.5 * split} />
      <g opacity={richO}>
        <Tag x={R.x} y={labelY(R)} text="الغنى" color={C.blue} size={52} w={260} />
        <Car id={`we-c-${ratio}`} kind="new" color={C.pearl} shade={C.pearlShade} glass={C.glass} x={R.x + by(ratio, 60, 80)} y={R.y + by(ratio, 200, 140)} scale={cs}
          shine={((f - k.rich) % sec(2.6)) / sec(1.2)} />
        <Actor f={f} d={{ look: CAST.majid, id: `we-m-${ratio}`, seed: 61, x: R.x - by(ratio, 330, 300), y: R.y + by(ratio, 250, 170), scale: by(ratio, 1, 0.62), facing: 1,
          pose: [P(0, 'proud', { headTurn: 0.6 })], face: [F(0, 'proud', { gx: 1 })] }} />
        {/* income in, spending out, in front of people */}
        {f >= k.inOut - sec(0.2) && <>
          <Arrow a={[R.x - by(ratio, 300, 330), R.y - by(ratio, 260, 200)]} b={[R.x - 60, R.y - by(ratio, 120, 90)]} bend={-0.15} color={C.green} grow={prog(f, k.inOut, sec(0.5))} />
          <Arrow a={[R.x + 20, R.y - by(ratio, 120, 90)]} b={[R.x + by(ratio, 120, 140), R.y + by(ratio, 30, 40)]} bend={-0.2} color={C.red} grow={prog(f, k.inOut + sec(0.6), sec(0.5))} />
          {notesFall(f, k.inOut + sec(0.6), [R.x + by(ratio, 80, 90), R.y + by(ratio, 70, 70)], [R.x - 20, R.y - by(ratio, 110, 90)], 3, sec(0.8))}
        </>}
        {[[-180, -40], [0, -80], [200, -30]].map(([dx, dy], j) => (
          <Eye key={j} x={R.x + by(ratio, 60, 80) + dx * cs} y={R.y + by(ratio, 200, 140) - 260 * cs + dy} s={by(ratio, 0.9, 0.7) * prog(f, k.seen + j * sec(0.12), sec(0.3), ease.back)} />
        ))}
      </g>
      <g opacity={wealthO}>
        <Tag x={L.x} y={labelY(L)} text="الثروة" color={C.green} size={52} w={260} />
        <g transform={`translate(${L.x + by(ratio, 0, 120)} ${L.y + by(ratio, 220, 160)})`}><GhostJar id={`we-j-${ratio}`} level={jarLevel} s={js} /></g>
        {notesFall(f, k.unspent, [L.x + by(ratio, 0, 120), L.y + by(ratio, 60, 40)], [L.x + by(ratio, 0, 120), L.y - by(ratio, 260, 200)], 4)}
        {ghostCar > 0 && <g opacity={ghostCar} transform={`translate(${L.x + by(ratio, 0, 120)} ${L.y - by(ratio, 150, 110)})`}><GhostCar scale={by(ratio, 0.6, 0.45)} /></g>}
        {notesFall(f, k.carGone, [L.x + by(ratio, 0, 120), L.y + by(ratio, 60, 40)], [L.x + by(ratio, 0, 120), L.y - by(ratio, 190, 140)], 5)}
        {ghostWatch > 0 && <g opacity={ghostWatch} transform={`translate(${L.x + by(ratio, 0, 120)} ${L.y - by(ratio, 200, 150)})`}><Watch ghost scale={by(ratio, 0.75, 0.6)} /></g>}
        {notesFall(f, k.watchGone, [L.x + by(ratio, 0, 120), L.y + by(ratio, 60, 40)], [L.x + by(ratio, 0, 120), L.y - by(ratio, 200, 150)], 3)}
        {f >= k.saad - sec(0.4) && <Actor f={f} d={{ look: CAST.saad, id: `we-s-${ratio}`, seed: 62, x: L.x - by(ratio, 300, 220), y: L.y + by(ratio, 250, 170), scale: by(ratio, 1, 0.62),
          facing: 1, o: prog(f, k.saad - sec(0.4), sec(0.4)),
          pose: [P(0, 'stand', { headTurn: 0.5 }), P(k.nobody, 'shrug', {}, 14)], face: [F(0, 'smile', { gx: 1 }), F(k.nobody, 'calm', { gx: 1 }, 14)] }} />}
      </g>
      {/* a passer-by walks past the wealth and turns to the car */}
      {f >= k.nobody - sec(1.6) && <Actor f={f} d={{ look: CAST.noura, id: `we-p-${ratio}`, seed: 63, x: passer.x, y: by(ratio, 960, 1060), scale: by(ratio, 0.9, 0.55), add: passer.add, facing: -1,
        o: life(f, k.nobody - sec(1.6), k.nobody + sec(1.8)),
        pose: [P(0, 'stand', { headTurn: -0.5 })], face: [F(0, 'smile', { gx: -1, gy: -0.3 })] }} />}
    </>} />
  );
};

export type FreedomBeats = { start: number; no: number; time: number; quote: number; control: number; morning: number; months: number; walk: number; end: number };

export const Freedom: React.FC<{ f: number; k: FreedomBeats; ratio: Ratio }> = ({ f, k, ratio }) =>
  f < k.morning ? <TimeShot f={f} k={k} ratio={ratio} /> : f < k.months ? <Morning f={f} k={k} ratio={ratio} /> : <MonthsShot f={f} k={k} ratio={ratio} />;

const TimeShot: React.FC<{ f: number; k: FreedomBeats; ratio: Ratio }> = ({ f, k, ratio }) => {
  const center = by(ratio, { x: 860, y: 520 }, { x: 540, y: 480 });
  const box = k.no > 0 ? life(f, k.no - sec(0.1), k.time + sec(0.2), sec(0.3), sec(0.3)) : 0;
  const toClock = prog(f, k.time, sec(0.9), ease.inOut);
  const jarO = 1 - toClock;
  const turn = prog(f, k.control, sec(1.6), ease.inOut);
  const r = by(ratio, 290, 210);
  return (
    <Frame ratio={ratio} c={STAGE_CAM[ratio]} world={<>
      <StageSet />
      {jarO > 0 && <g transform={`translate(${center.x} ${center.y + 200})`} opacity={jarO}>
        <GhostJar id={`fr-j-${ratio}`} level={0.85} s={by(ratio, 2.3, 1.8)} />
        <Say x={0} y={by(ratio, -470, -370)} size={140} color={C.mist} o={life(f, k.start, k.no)}>؟</Say>
      </g>}
      {box > 0 && <g opacity={box} transform={`translate(${center.x + by(ratio, 520, 0)} ${center.y + by(ratio, 40, -300)}) scale(${by(ratio, 1.6, 1.2)})`}>
        <Box w={200} h={130} color="#6D7F95" shade="#56677C" contents={<g transform="translate(0 -10)"><Watch scale={0.4} /></g>} />
        <Strike x={0} y={60} w={260} grow={prog(f, k.no + sec(0.6), sec(0.3))} />
      </g>}
      {toClock > 0 && <g opacity={toClock} transform={`translate(${center.x} ${center.y}) scale(${mix(0.4, 1, toClock)})`}>
        <Clock x={0} y={0} r={r} hour={300 + turn * 60} minute={turn * 720} />
      </g>}
      {notesFall(f, k.time - sec(0.2), [center.x, center.y], [center.x, center.y + 120], 5, sec(0.8))}
      {f >= k.quote - sec(0.3) && <Actor f={f} d={{ look: CAST.saad, id: `fr-s-${ratio}`, seed: 64, x: center.x + by(ratio, 500, 230), y: center.y + by(ratio, 470, 470), scale: by(ratio, 1.2, 0.75), facing: -1,
        o: prog(f, k.quote - sec(0.3), sec(0.4)),
        pose: [P(0, 'stand', { headTurn: 0.6 }), P(k.control - sec(0.4), 'holdUp', { shF: 140, elF: 20 }, 12), P(k.control + sec(1.8), 'proud', { headTurn: 0.6 }, 14)],
        face: [F(0, 'calm', { gx: 1, gy: -0.4 }), F(k.control - sec(0.4), 'determined', { gx: 1, gy: -0.6 }, 10), F(k.control + sec(1.8), 'relieved', {}, 14)],
        handF: 'open' }} />}
      <Tag x={center.x} y={center.y + by(ratio, 380, 300)} text="تتحكم في وقتك" color={C.green} size={by(ratio, 52, 44)} o={prog(f, k.control + sec(0.2), sec(0.4))} />
    </>} />
  );
};

/** Morning at Saad's window: he stretches and the day is his. */
const Morning: React.FC<{ f: number; k: FreedomBeats; ratio: Ratio }> = ({ f, k, ratio }) => {
  const rise = prog(f, k.morning, sec(2.2), ease.out);
  const c = by(ratio, { x: 960, y: 560, z: 1 }, { x: 900, y: 600, z: 1.15 }, { x: 900, y: 600, z: 1.0 });
  return (
    <Frame ratio={ratio} c={c} world={<>
      <rect x={-400} y={-300} width={2800} height={1500} fill="#2C4560" />
      <rect x={-400} y={880} width={2800} height={400} fill="#22374D" />
      <g transform="translate(560 140)">
        <defs><linearGradient id={`mo-sky-${ratio}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5FA8C8" /><stop offset="1" stopColor="#DDEFF4" /></linearGradient></defs>
        <rect x={0} y={0} width={800} height={560} rx={12} fill={`url(#mo-sky-${ratio})`} stroke={INK} strokeWidth={6} />
        <circle cx={560} cy={mix(560, 230, rise)} r={70} fill="#F5FBFF" opacity={0.95} />
        <circle cx={560} cy={mix(560, 230, rise)} r={120} fill="#F5FBFF" opacity={0.2} />
        <rect x={0} y={400} width={800} height={160} fill="#7FA9C2" opacity={0.6} />
        <path d="M400 0 L400 560 M0 280 L800 280" stroke="#2C4560" strokeWidth={16} />
        <rect x={0} y={0} width={800} height={560} rx={12} fill="none" stroke={INK} strokeWidth={6} />
        <path d={`M0 560 L800 560 L${mix(1300, 1000, rise)} 860 L${mix(-500, -200, rise)} 860 Z`} fill="#F5FBFF" opacity={0.08 * rise} />
      </g>
      <Actor f={f} d={{ look: CAST.saad, id: `mo-s-${ratio}`, seed: 65, x: 960, y: 900, scale: 1.05, facing: 1,
        pose: [P(0, 'stand', { headTurn: 0.6 }), P(k.morning + sec(0.4), 'cheer', { bob: -4 }, 18), P(k.morning + sec(2.2), 'proud', { headTurn: 0.6 }, 18)],
        face: [F(0, 'calm', { lid: 0.7 }), F(k.morning + sec(0.4), 'relieved', {}, 14), F(k.morning + sec(2.2), 'smile', { gx: 1 }, 14)] }} />
    </>} />
  );
};

/** Savings as months: Saad walks across them toward the open door. */
const MonthsShot: React.FC<{ f: number; k: FreedomBeats; ratio: Ratio }> = ({ f, k, ratio }) => {
  const V = ratio !== '16x9';
  const cells = prog(f, k.months, sec(1.2), ease.inOut) * 12;
  const cell = by(ratio, 104, 62);
  const x0 = by(ratio, 300, 160), y0 = by(ratio, 760, 760);
  const go = walk(f, x0 - 60, x0 + cell * 11.5, k.walk, Math.max(sec(1), k.end - k.walk), 34);
  const doorX = x0 + cell * 12 + by(ratio, 160, 60);
  return (
    <Frame ratio={ratio} c={STAGE_CAM[ratio]} world={<>
      <StageSet />
      <g transform={`translate(${doorX} ${y0})`}>
        <rect x={-90} y={-330} width={180} height={330} fill="#E3F6F2" stroke={INK} strokeWidth={5} />
        <rect x={-90} y={-330} width={180} height={330} fill={C.mint} opacity={0.35 + 0.1 * Math.sin(f / 10)} />
        <path d="M-90 0 L-200 90 L200 90 L90 0 Z" fill={C.mint} opacity={0.14} />
      </g>
      <Months x={x0} y={y0} cell={cell} cols={12} rows={1} filled={cells} color={C.green} />
      {cells >= 12 && <Tag x={x0 + cell * 6} y={y0 + cell + 50} text="شهور" color={C.green} size={40} o={prog(f, k.months + sec(1.2), sec(0.4))} />}
      <Actor f={f} d={{ look: CAST.saad, id: `mm-s-${ratio}`, seed: 66, x: go.x, y: y0, scale: V ? 0.62 : 0.85, add: go.add, facing: 1,
        pose: [P(0, 'stand', { headTurn: 0.6 })], face: [F(0, 'smile', { gx: 1 }), F(k.walk, 'determined', { gx: 1 }, 14)] }} />
    </>} />
  );
};

export type ReelWealthBeats = { start: number; car: number; carGone: number; control: number; end: number };

/** R4: the car not bought falls into Saad's jar as notes; then the clock he moves himself. */
export const ReelWealth: React.FC<{ f: number; k: ReelWealthBeats; ratio: Ratio }> = ({ f, k, ratio }) => {
  const clockAt = k.carGone + sec(1.2);
  if (f < clockAt) {
    const ghost = life(f, k.car - sec(0.2), k.carGone + sec(0.2), sec(0.4), sec(0.3));
    const level = mix(0.35, 0.8, prog(f, k.carGone, sec(1)));
    return (
      <Frame ratio={ratio} c={STAGE_CAM[ratio]} world={<>
        <StageSet />
        <Tag x={540} y={90} text="الثروة" color={C.green} size={52} w={260} o={prog(f, k.start, sec(0.4))} />
        {ghost > 0 && <g opacity={ghost} transform="translate(540 380)"><GhostCar scale={0.85} /></g>}
        <g transform="translate(600 920)"><GhostJar id={`rw-j-${ratio}`} level={level} s={2.2} /></g>
        {notesFall(f, k.carGone, [600, 700], [540, 380], 6)}
        <Actor f={f} d={{ look: CAST.saad, id: `rw-s-${ratio}`, seed: 67, x: 260, y: 960, scale: 0.9, facing: 1,
          pose: [P(0, 'stand', { headTurn: 0.6 })], face: [F(0, 'smile', { gx: 1 }), F(k.carGone, 'relieved', {}, 14)] }} />
      </>} />
    );
  }
  return <TimeShot f={f} ratio={ratio} k={{ start: clockAt, no: -1e9, time: clockAt, quote: clockAt, control: k.control, morning: k.end, months: k.end, walk: k.end, end: k.end }} />;
};
