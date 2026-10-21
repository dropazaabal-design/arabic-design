import React from 'react';
import { Bubble, Car, Jar, Note, Person, Phone, driverSeat, face, pose } from '../../../../motion-core/src/cartoon';
import { Notice, Tag } from '../graphics';
import { GROUND, ParkingSet } from '../sets';
import { Actor, F, Frame, P, by, camMix, type Cam, type Ratio } from '../stage';
import { C, CAST } from '../theme';
import { ease, life, mix, prog, sec } from '../time';
import { WindowShot } from './valet';

// E11 (L11): a year later, same car park. Majid kept his car; every month a small amount goes to
// an account he named «حرية». A new colleague parks a shiny car; everyone turns, Majid too — and
// he catches himself picturing himself at its wheel, and smiles. He knows the paradox now.
export type BackBeats = { start: number; month: number; freedom: number; year: number; parked: number; turn: number; majidToo: number; imagine: number; smile: number; title: number; choose: number; end: number };

const NEW = { color: C.rose, shade: '#B25472' };

export const Back: React.FC<{ f: number; k: BackBeats; ratio: Ratio }> = ({ f, k, ratio }) => {
  const mine = by(ratio, 420, 700);
  const majidX = mine + by(ratio, 400, 380);
  const stop = by(ratio, 1720, 1650);
  const arrive = prog(f, k.year - sec(0.2), k.parked - k.year + sec(0.6), ease.out);
  const carX = stop + 1500 * (1 - arrive); // from the right, front toward the onlookers
  const phone = life(f, k.month - sec(0.3), k.year, sec(0.3), sec(0.3));
  const ticks = Math.floor(prog(f, k.month, k.freedom - k.month + sec(1.2)) * 6);
  const level = 0.08 + ticks * 0.1;
  const head: [number, number] = [majidX, GROUND + 34 - 400 * 0.95];
  const dream = prog(f, k.imagine, sec(0.5), ease.back) * (1 - prog(f, k.smile + sec(0.2), sec(0.25)));
  const pop = prog(f, k.smile + sec(0.2), sec(0.35));
  const end = prog(f, k.title - sec(0.6), sec(1.0), ease.inOut);
  const base: Cam = by(ratio, { x: 1060, y: 600, z: 1.05 }, { x: 1180, y: 680, z: 1.18 }, { x: 1180, y: 680, z: 1.05 });
  const near: Cam = by(ratio, { x: majidX + 120, y: 600, z: 1.35 }, { x: majidX + 60, y: 620, z: 1.4 }, { x: majidX + 60, y: 640, z: 1.25 });
  const wide: Cam = by(ratio, { x: 1060, y: 540, z: 1.0 }, { x: 1180, y: 600, z: 1.1 }, { x: 1180, y: 620, z: 1.0 });
  const c = camMix(camMix(base, near, prog(f, k.majidToo - sec(0.3), sec(1), ease.inOut)), wide, end);
  const jarAt = { x: majidX + 170, y: GROUND - 180 };
  const turnAll = (j: number) => k.turn + j * sec(0.12);
  return (
    <Frame ratio={ratio} c={c} world={<>
      <ParkingSet sway={Math.sin(f / 70) * 3} dim={0.3 * end} />
      <Car id={`bk-m-${ratio}`} kind="new" color={C.pearl} shade={C.pearlShade} glass={C.glass} x={mine} y={GROUND + 6} scale={1.08} />
      {[{ w: 'noura' as const, x: by(ratio, 1130, 1250) }, { w: 'elder' as const, x: by(ratio, 1310, 1440) }].map((p, j) => (
        <Actor key={p.w} f={f} d={{ look: CAST[p.w], id: `bk-${p.w}-${ratio}`, seed: 90 + j, x: p.x, y: GROUND - 25, scale: 0.82, facing: f >= turnAll(j) ? 1 : -1,
          pose: [P(0, j ? 'cross' : 'stand', { headTurn: 0.5 }), P(turnAll(j), j ? 'cross' : 'stand', { headTurn: 0.9, lean: -2 }, 10)],
          face: [F(0, 'smile', { gx: 1 }), F(turnAll(j), 'surprised', { gx: 1 }, 8), F(turnAll(j) + sec(0.8), 'dreamy', { gx: 0.4 }, 16)] }} />
      ))}
      <Actor f={f} d={{ look: CAST.majid, id: `bk-mj-${ratio}`, seed: 92, x: majidX, y: GROUND + 34, scale: 0.95, facing: f >= k.majidToo ? 1 : -1,
        pose: [P(0, 'stand', { headTurn: 0.4 }), P(k.month - sec(0.3), 'phone', {}, 12), P(k.year, 'stand', { headTurn: 0.5 }, 12),
          P(k.majidToo, 'stand', { headTurn: 0.9, lean: -2 }, 10), P(k.smile, 'proud', { headTurn: 0.6 }, 16)],
        face: [F(0, 'relieved', {}), F(k.month, 'smile', { gx: 0.3, gy: 0.7 }, 10), F(k.year, 'calm', { gx: 1 }, 12), F(k.majidToo, 'surprised', { gx: 1 }, 8),
          F(k.imagine, 'dreamy', {}, 14), F(k.smile, 'grin', { gx: 0.5 }, 10), F(k.smile + sec(1.2), 'smile', { gx: 0.5 }, 14)],
        farInFront: phone > 0, holdF: phone > 0 ? <Phone scale={0.62} screen={<g>
          <rect x={-22} y={-30} width={44} height={40} rx={6} fill={C.green} />
          <path d="M-12 -10 L0 -22 L12 -10 M0 -22 L0 2" stroke={C.light} strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>} /> : undefined }} />
      {/* the jar called «حرية», a little more each month */}
      {phone > 0 && <g opacity={phone} transform={`translate(${jarAt.x} ${jarAt.y})`}>
        <Jar id={`bk-j-${ratio}`} level={level} note={C.mint} noteShade={C.teal} w={120} h={150} />
        <Tag x={0} y={-190} text="حرية" color={C.green} size={34} o={prog(f, k.freedom, sec(0.4))} />
        {Array.from({ length: 6 }, (_, j) => {
          const t = prog(f, k.month + j * ((k.freedom - k.month + sec(1.2)) / 6), sec(0.5), ease.inOut);
          return t > 0 && t < 1 ? <g key={j} transform={`translate(${mix(-150, 0, t)} ${mix(-160, -60, t) - Math.sin(Math.PI * t) * 40})`}><Note color={C.mint} shade={C.teal} scale={0.4} rot={t * 90} /></g> : null;
        })}
      </g>}
      <Car id={`bk-n-${ratio}`} kind="new" color={NEW.color} shade={NEW.shade} glass={C.glass} x={carX} y={GROUND + 6} scale={1.05} facing={-1}
        shine={(f - k.parked) / sec(0.9)} wheelTurn={-carX}
        driver={<Person id={`bk-nd-${ratio}`} look={CAST.young} pose={pose('seated', { headTurn: 0.5 })} face={face('proud', { gx: 0.6 })} {...driverSeat('new')} />} />
      <Notice x={head[0]} y={head[1]} r={58} t={f - k.majidToo} len={sec(0.8)} />
      {dream > 0 && <Bubble id={`bk-b-${ratio}`} x={majidX + by(ratio, 250, 220)} y={by(ratio, 380, 330)} w={by(ratio, 380, 380)} h={by(ratio, 270, 270)} tail={[head[0] + 20, head[1] - 20]} pop={dream}>
        <WindowShot id={`bk-ws-${ratio}`} w={by(ratio, 380, 380)} h={by(ratio, 270, 270)} color={NEW.color} shade={NEW.shade} who={CAST.majid} mood="grin" shine={(f - k.imagine) / sec(1)} />
      </Bubble>}
      {/* the bubble bursts into a few dots as he smiles at himself */}
      {pop > 0 && pop < 1 && Array.from({ length: 8 }, (_, j) => {
        const a = (j / 8) * Math.PI * 2;
        return <circle key={j} cx={majidX + by(ratio, 250, 220) + Math.cos(a) * 200 * pop} cy={by(ratio, 380, 330) + Math.sin(a) * 140 * pop} r={14 * (1 - pop)} fill="#EAF1F7" />;
      })}
    </>} />
  );
};
