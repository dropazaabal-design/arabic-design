import React from 'react';
import { PAL, bowLine, rand, stroke, wobEllipse, wobRect } from '@mukarram/characters/ink';
import { POSES } from '@mukarram/characters/rig';
import { Shot } from '@mukarram/video/stage';
import { Frog } from '../characters/frog';
import { Human } from '../characters/human';
import { TaskSheet } from '../characters/props';
import { TITLE_FONT } from '../video/fonts';
import { ease, keys, prog, wordAt } from '../video/time';
import { ShotProps, idle } from './common';

// Outside his window at night: the frog, safe and dry with its towel, watches him through the glass —
// he's holding up his one finished sheet. «الضفدع هرب… وأنت؟» then «لا تنتظر المشكلة تكبر».

const BOUNDS: [number, number, number, number] = [-420, -400, 1500, 2340];

const Card: React.FC<{ p1: number; p2: number }> = ({ p1, p2 }) => (
  <div style={{ position: 'absolute', left: 70, right: 70, top: 290, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
    <div dir="rtl" lang="ar" style={{ opacity: Math.min(1, p1 * 1.5), transform: `scale(${0.8 + 0.2 * p1}) rotate(${(1 - p1) * -3}deg)`, fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 100, lineHeight: 1.25, color: PAL.ink, background: PAL.white, padding: '0.08em 0.5em 0.2em', borderRadius: 34, border: `7px solid ${PAL.ink}`, boxShadow: `0 10px 0 ${PAL.ink}`, whiteSpace: 'nowrap' }}>
      الضفدع هرب… <span style={{ color: PAL.red }}>وأنت؟</span>
    </div>
    <div dir="rtl" lang="ar" style={{ opacity: Math.min(1, p2 * 1.5), transform: `translateY(${(1 - p2) * 20}px)`, fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 60, lineHeight: 1.3, color: PAL.white, background: PAL.blue, padding: '0.06em 0.6em 0.16em', borderRadius: 999, border: `6px solid ${PAL.ink}`, whiteSpace: 'nowrap' }}>
      لا تنتظر المشكلة تكبر
    </div>
  </div>
);

const Night: React.FC<{ f: number; children?: React.ReactNode; inside: React.ReactNode }> = ({ f, children, inside }) => (
  <g>
    <rect x={-420} y={-400} width={1920} height={2800} fill="#1D3A5C" />
    {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={-300 + rand(i + 3) * 1700} cy={-300 + rand(i + 40) * 700} r={2 + rand(i + 7) * 3} fill={PAL.white} opacity={0.3 + 0.3 * Math.sin(f / 10 + i)} />)}
    {/* the house wall with his lit window */}
    <path d={wobRect(-300, 560, 1100, 1400, 10, 801, 3)} fill="#2E4B70" {...stroke()} />
    {Array.from({ length: 7 }, (_, r) => <path key={r} d={bowLine(-300, 640 + r * 150, 800, 640 + r * 150, 2)} {...stroke(4)} opacity={0.25} />)}
    <g>
      <clipPath id="outWin"><rect x={150} y={760} width={420} height={480} /></clipPath>
      <rect x={150} y={760} width={420} height={480} fill="#FFE8B5" />
      <g clipPath="url(#outWin)">{inside}</g>
      <path d={wobRect(150, 760, 420, 480, 6, 802, 2)} fill="none" {...stroke(14, PAL.woodDeep)} />
      <path d="M360 760 L360 1240 M150 1000 L570 1000" {...stroke(10, PAL.woodDeep)} />
      <path d={wobRect(120, 1236, 480, 34, 6, 803, 2)} fill={PAL.wood} {...stroke()} />
    </g>
    <path d="M-420 1700 Q 300 1660 1500 1720 L1500 2340 L-420 2340Z" fill="#2F5F45" {...stroke()} />
    {/* a big flower pot: the frog's dry seat */}
    <path d="M700 1720 L960 1720 L930 1560 L730 1560Z" fill={PAL.red} {...stroke()} />
    <path d={wobRect(710, 1530, 240, 40, 10, 804, 2)} fill={PAL.red} {...stroke()} />
    <path d={wobEllipse(830, 1532, 110, 18, 805, 0.03, 10)} fill={PAL.woodDeep} />
    {children}
  </g>
);

const inside = (f: number, wave: number) => (
  <g transform="translate(360 1320)">
    <Human x={0} y={0} s={0.62} pose={{ ...POSES.stand, armR: [150 + wave * 20, 30], handR: 'pinch', armL: [16, 8] }} expr="satisfied" blink={idle(f, 61).blink}
      itemR={<TaskSheet x={0} y={-50} s={0.5} check={1} />} />
  </g>
);

/** «الضفدع هرب… وأنت؟» — the frog on the pot, towel on, watching him with a knowing smile; a proud little
 *  hop on «هرب»; on «وأنت؟» it turns to us and points. The card lands. */
export const CloseFrog: React.FC<ShotProps> = ({ f, t0 }) => {
  const ran = wordAt('s10', 'هرب'), you = wordAt('s10', 'وأنت');
  const hop = Math.sin(Math.min(1, Math.max(0, (f - ran) / 10)) * Math.PI);
  const id = idle(f, 7);
  return (
    <Shot f={f} cam={{ cx: 600, cy: keys(f, [[t0, 1300], [you, 1240]]), zoom: keys(f, [[t0, 1.2], [you, 1.2], [you + 6, 1.28]], ease.out) }} bounds={BOUNDS}
      overlay={<Card p1={prog(f, you - 2, 9, ease.back)} p2={0} />}>
      <Night f={f} inside={inside(f, 0)}>
        <Frog x={830} y={1540 - hop * 70} s={0.9} towel eyes={f < you - 2 ? 'half' : 'open'} mouth={f < you ? 'smirk' : 'grin'} brow={f < you ? -1 : 1}
          glance={f < you - 4 ? [-1, -0.2] : [0, 0.1]} blink={f < you - 4 ? 0 : id.blink}
          pose={{ crouch: hop > 0 ? 0 : 0, stretch: hop * 0.4, armR: f >= you - 3 ? 110 : 20, armL: 20, tilt: f >= you ? -6 : 4 }} />
      </Night>
    </Shot>
  );
};

/** «لا تنتظر المشكلة تكبر عشان تنتبه.» — slow pull-out; inside, he waves his finished sheet; the frog winks
 *  and waves back; the second line of the card appears on «تكبر». */
export const CloseEnd: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const grow = wordAt('s11', 'تكبر'), end = wordAt('s11', 'تنتبه');
  const id = idle(f, 7);
  const wave = Math.sin(f * 0.35);
  return (
    <Shot f={f} cam={{ cx: 580, cy: keys(f, [[t0, 1260], [t1, 1180]]), zoom: keys(f, [[t0, 1.24], [t1, 1.08]]) }} bounds={BOUNDS}
      overlay={<Card p1={1} p2={prog(f, grow - 2, 9, ease.back)} />}>
      <Night f={f} inside={inside(f, f > grow ? wave : 0)}>
        <Frog x={830} y={1540} s={0.9} towel eyes={f > end + 6 && f < end + 26 ? 'happy' : 'open'} mouth="smile" glance={[-0.7, -0.3]} blink={id.blink}
          pose={{ armR: f > grow ? 120 + wave * 30 : 20, armL: 20, tilt: Math.sin(f / 18) * 3, crouch: f > end + 30 && f < end + 36 ? 0.4 : 0 }} />
      </Night>
    </Shot>
  );
};
