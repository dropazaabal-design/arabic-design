import React from 'react';
import { INK, LINE, PAL, hash, sketch, sketchRect } from '../style';
import { Frame, Puffs, blob, clamp01, ink, mix, smooth, useUid, type P } from './util';

// A storm over a small house. `intensity` 0 = a grey afternoon, 1 = a dark cloud, slanted rain, gusts.
// House centre x = 960, ground y = 840, roof peak y ≈ 500; cloud band y 60..360. Free for captions: the bottom
// band (y > 900) and, at low intensity, the sky corners.
export const STORM = { house: [960, 840] as P, ground: 840 } as const;
const G = STORM.ground;

const lerpHex = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(mix(v, pb[i], k))).join(',')})`;
};

export type StormProps = { t: number; intensity: number };

export const Storm: React.FC<StormProps> = ({ t, intensity }) => {
  const id = useUid();
  const k = clamp01(intensity);
  const wind = 0.15 + k * 0.5; // rain slant
  const drift = Math.sin(t * 0.3) * 20;
  const flash = k > 0.6 && (t * 0.37) % 1 < 0.035 ? (k - 0.6) / 0.4 : 0;
  const cloud: [number, number, number][] = [
    [520, 250, 120], [680, 180, 150], [880, 150, 170], [1080, 170, 160], [1270, 210, 140], [1420, 260, 110],
    [760, 290, 120], [1000, 290, 130], [1220, 300, 110], [380, 300, 90], [1560, 310, 80],
  ];
  const cs = 0.55 + k * 0.45;
  const cl = cloud.map(([x, y, r]) => [960 + (x - 960) * (0.7 + k * 0.3) + drift, y * (0.8 + k * 0.2), r * cs] as [number, number, number]);
  const drops = Math.round(160 * k);
  return (
    <Frame>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lerpHex('#BAC5D8', '#454C62', k)} /><stop offset="1" stopColor={lerpHex('#DCE3EE', '#7A8399', k)} />
        </linearGradient>
        <clipPath id={`${id}rain`}><rect x={0} y={200} width={1920} height={G - 200} /></clipPath>
      </defs>
      <rect width={1920} height={1080} fill={`url(#${id}sky)`} />
      <rect width={1920} height={1080} fill="#EEF0FA" opacity={flash * 0.45} />
      {/* far hills */}
      <path d={sketch([[-20, G - 40], [300, G - 120], [620, G - 70], [900, G - 130], [1250, G - 60], [1560, G - 140], [1940, G - 70], [1940, G + 10], [-20, G + 10]], 3, 2, true)} fill={lerpHex('#9FB3A8', '#5E6E6A', k)} {...ink(LINE.far)} />
      {/* rain */}
      <g clipPath={`url(#${id}rain)`}>
        {Array.from({ length: drops }, (_, i) => {
          const sp = 900 + hash(i * 1.3) * 500, len = 34 + hash(i * 2.1) * 24;
          const y = 220 + ((hash(i * 3.7) * 700 + t * sp) % (G - 200));
          const x = hash(i * 5.9) * 2100 - 120 + (y - 220) * wind;
          return <path key={i} d={`M${x} ${y} L${x + len * wind} ${y + len}`} stroke="#D3DEEC" strokeWidth={4} strokeLinecap="round" opacity={0.85} />;
        })}
      </g>
      {/* ground */}
      <path d={sketchRect(-20, G, 1960, 260, 4)} fill={lerpHex('#9DBFA9', '#5F7F6E', k)} {...ink()} />
      {Array.from({ length: Math.round(30 * k) }, (_, i) => {
        const u = (t * 2 + hash(i * 4.4)) % 1, x = hash(i * 8.1) * 1920, y = G + 20 + hash(i * 6.2) * 180;
        return <ellipse key={i} cx={x} cy={y} rx={6 + u * 22} ry={2 + u * 6} fill="none" stroke="#D3DEEC" strokeWidth={2.5} opacity={1 - u} />;
      })}
      {/* a small tree bending with the gusts */}
      {(() => {
        const b = (0.2 + k * 0.8) * (24 + 16 * Math.sin(t * 2.3)) + Math.sin(t * 7) * 4 * k;
        return <g>
          <path d={`M1360 ${G} Q1362 ${G - 80} ${1370 + b * 0.5} ${G - 150}`} fill="none" {...ink(18)} />
          <path d={`M1360 ${G} Q1362 ${G - 80} ${1370 + b * 0.5} ${G - 150}`} fill="none" stroke={PAL.woodDark} strokeWidth={10} />
          <Puffs c={[[1360 + b, G - 190, 54], [1330 + b * 0.9, G - 160, 42], [1400 + b * 1.1, G - 160, 44]]} fill={lerpHex('#6E9A82', '#4F6F5E', k)} line={LINE.normal} seed={8} />
        </g>;
      })()}
      {/* the house: small, warm-lit in cool light, holding */}
      <path d={sketchRect(800, 650, 320, G - 650, 5)} fill={PAL.wallGrey} {...ink(LINE.bold)} />
      <path d={sketchRect(1050, 520, 40, 90, 6)} fill={PAL.chair} {...ink()} />
      <path d={sketch([[770, 655], [960, 500], [1150, 655]], 7, 1.5, true)} fill={PAL.plum} {...ink(LINE.bold)} />
      {[[850, 700], [1010, 700]].map(([x, y], i) => (
        <g key={i}>
          <path d={sketchRect(x, y, 60, 60, 10 + i)} fill={lerpHex('#D7E2F0', '#EDE7F7', k)} {...ink()} />
          <path d={`M${x + 30} ${y} L${x + 30} ${y + 60} M${x} ${y + 30} L${x + 60} ${y + 30}`} {...ink(LINE.fine)} />
        </g>
      ))}
      <path d={sketchRect(930, 760, 60, G - 760, 12)} fill={PAL.sofa} {...ink()} />
      <circle cx={978} cy={804} r={4} fill={INK} />
      {/* gusts */}
      {k > 0.05 && Array.from({ length: 5 }, (_, i) => {
        const y = 420 + i * 70, x0 = ((t * (600 + i * 60) + i * 500) % 2600) - 500;
        return <path key={i} d={smooth([[x0, y], [x0 + 120, y - 14], [x0 + 240, y], [x0 + 330, y - 6], [x0 + 370, y - 34], [x0 + 340, y - 52], [x0 + 316, y - 30]])} fill="none" stroke="#EEF1F7" strokeWidth={6} strokeLinecap="round" opacity={k * 0.9} />;
      })}
      {/* the cloud */}
      <Puffs c={cl} fill={lerpHex('#AEB7C7', '#5A6275', k)} line={LINE.bold} seed={11} />
      <clipPath id={`${id}cl`}>{cl.map(([x, y, r], i) => <path key={i} d={smooth(blob(x, y, r, r, 77 + i, 10, 0.05), true)} />)}</clipPath>
      <g clipPath={`url(#${id}cl)`}>
        <ellipse cx={960 + drift} cy={330 * (0.8 + k * 0.2) + 40} rx={760} ry={110 * cs} fill={lerpHex('#9AA4B6', '#464D5F', k)} />
      </g>
      {cl.slice(0, 6).map(([x, y, r], i) => <path key={i} d={`M${x - r * 0.45} ${y - r * 0.35} Q${x - r * 0.1} ${y - r * 0.7} ${x + r * 0.3} ${y - r * 0.55}`} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={0.35 - k * 0.2} />)}
      {/* lightning, cool lavender */}
      {flash > 0 && <path d="M1180 330 L1130 450 L1175 450 L1110 590 L1215 420 L1168 420 L1220 330 Z" fill="#E6E1EF" {...ink(LINE.normal)} opacity={flash} />}
    </Frame>
  );
};
