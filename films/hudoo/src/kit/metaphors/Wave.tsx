import React from 'react';
import { INK, LINE, PAL, hash } from '../style';
import { Frame, Puffs, ease, ink, mix, seg, smooth, useUid, type P } from './util';

// One wave on calm water: it rises, crests, and settles back into the sea.
// Calm surface y = 760, horizon y = 600; the wave stands around x 600..1500 and up to y ≈ 320 at size 1.
// Free for captions: the sky's top band (y < 280) and the bottom band (y > 900) under the water line.
export const WAVE = { sea: 760, horizon: 600, peak: 320 } as const;
const SEA = WAVE.sea;

export type WaveProps = { t: number; phase: number; size: number };

// The wave as 19 points (x px from the crest at full size, y as a fraction of the height): a plain swell, and the
// same points curled over. The shape morphs between them, so the lip grows and melts back smoothly.
const SWELL_X = [-520, -380, -280, -205, -160, -130, -110, -95, -82, -70, -58, -40, -20, 0, 120, 260, 400, 540, 680];
const SWELL: P[] = SWELL_X.map((x) => [x, Math.exp(-((x / (x < 0 ? 230 : 300)) ** 2))]);
const CURL: P[] = [[-520, 0], [-380, 0.03], [-280, 0.12], [-205, 0.3], [-160, 0.5], [-148, 0.64], [-165, 0.74], [-200, 0.745], [-228, 0.68],
  [-254, 0.78], [-240, 0.9], [-180, 0.99], [-90, 1.03], [0, 1], [120, 0.86], [260, 0.55], [400, 0.25], [540, 0.07], [680, 0]];
const TIP = 8, CREST = 13;

export const Wave: React.FC<WaveProps> = ({ t, phase, size }) => {
  const id = useUid();
  const ph = Math.max(0, Math.min(1, phase));
  const amp = ph < 0.45 ? ease(ph / 0.45) : ph < 0.6 ? 1 : 1 - ease((ph - 0.6) / 0.4);
  const A = 440 * size * amp;
  const L = ease(seg(ph, 0.25, 0.5)) * (1 - ease(seg(ph, 0.6, 0.8)));
  const cx = mix(1120, 900, ph);
  const sx = mix(0.75, 1, amp) * (0.6 + 0.4 * size) * 1.15;
  const swell = (x: number) => Math.sin(x * 0.012 - t * 1.2) * 5 + Math.sin(x * 0.005 + t * 0.7) * 4;
  const W = SWELL.map((p, i): P => {
    const x = cx + mix(p[0], CURL[i][0], L) * sx;
    return [x, SEA - mix(p[1], CURL[i][1], L) * A + swell(x) * (1 - amp * 0.6)];
  });
  const calmL: P[] = [], calmR: P[] = [];
  for (let x = -40; x < W[0][0] - 20; x += 40) calmL.push([x, SEA + swell(x) * (1 - amp * 0.6)]);
  for (let x = W[W.length - 1][0] + 40; x <= 2000; x += 40) calmR.push([x, SEA + swell(x) * (1 - amp * 0.6)]);
  const edge = [...calmL, ...W, ...calmR];
  const top = smooth(edge);
  const body = `${top} L2000 1100 L-40 1100 Z`;
  const settle = seg(ph, 0.6, 1);
  const tip = W[TIP];
  return (
    <Frame bg={PAL.sky}>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D3DDEC" /><stop offset="1" stopColor="#EEF2F8" /></linearGradient>
        <linearGradient id={`${id}sea`} gradientUnits="userSpaceOnUse" x1="0" y1="300" x2="0" y2="1080">
          <stop offset="0" stopColor="#9CCADB" /><stop offset="0.5" stopColor="#6FA4BE" /><stop offset="1" stopColor="#3F6F8C" />
        </linearGradient>
        <radialGradient id={`${id}sun`}><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.8" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#${id}sky)`} />
      <circle cx={1580} cy={200} r={150} fill={`url(#${id}sun)`} />
      <circle cx={1580} cy={200} r={52} fill="#F7F9FC" {...ink(LINE.fine)} />
      <Puffs c={[[300, 190, 40], [350, 170, 52], [410, 190, 38]]} fill="#F7F9FC" line={LINE.fine} seed={2} />
      {/* far sea */}
      <rect x={0} y={WAVE.horizon} width={1920} height={SEA - WAVE.horizon + 20} fill="#B4D3E0" />
      <path d={`M0 ${WAVE.horizon} L1920 ${WAVE.horizon}`} {...ink(LINE.far)} />
      {Array.from({ length: 10 }, (_, i) => {
        const y = WAVE.horizon + 20 + i * 14, x = ((hash(i) * 1920 + t * 12) % 2000) - 40;
        return <path key={i} d={`M${x} ${y} L${x + 60 + i * 8} ${y}`} stroke="#E4EFF4" strokeWidth={3} strokeLinecap="round" />;
      })}
      {/* the sea and the wave, one body */}
      <path d={body} fill={`url(#${id}sea)`} />
      {/* light bands up the face */}
      {A > 40 && [0.3, 0.55, 0.8].map((k, i) => {
        const pts = W.slice(0, 6).map(([x, y]): P => [x + k * 50 * sx, SEA - (SEA - y) * (1 - k * 0.55)]);
        return <path key={i} d={smooth(pts)} fill="none" stroke="#B9DCE8" strokeWidth={10 - i * 3} strokeLinecap="round" opacity={0.75} />;
      })}
      {/* the inside of the lip, a darker band */}
      {L > 0.15 && <path d={smooth(W.slice(TIP + 1, CREST).map(([x, y]): P => [x + 26 * sx * L, y + 34 * L * (A / 440)]))} fill="none" stroke="#4F86A6" strokeWidth={16 * L} strokeLinecap="round" opacity={0.8} />}
      <path d={top} fill="none" {...ink(LINE.bold)} />
      {/* foam on the lip, spray off the tip */}
      {L > 0.12 && <>
        <path d={smooth(W.slice(TIP, CREST + 1))} fill="none" stroke="#F5F8FB" strokeWidth={20 * L} strokeLinecap="round" />
        <path d={smooth(W.slice(TIP, CREST + 1))} fill="none" stroke={INK} strokeWidth={LINE.normal} strokeLinecap="round" />
        {L > 0.35 && Array.from({ length: 8 }, (_, i) => {
          const u = (t * 0.9 + hash(i * 2.2)) % 1;
          return <circle key={i} cx={tip[0] - 20 - u * 90 * hash(i + 4)} cy={tip[1] - 30 + u * u * 160} r={(4 + hash(i) * 6) * L} fill="#F5F8FB" stroke={INK} strokeWidth={1.6} opacity={(1 - u) * L} />;
        })}
      </>}
      {/* settling: lace of foam on the surface, thinning to calm */}
      {settle > 0 && settle < 1 && (
        <path d={smooth(edge.map(([x, y]): P => [x, y + 14]))} fill="none" stroke="#F5F8FB" strokeWidth={7} strokeLinecap="round" strokeDasharray="70 34 22 34" strokeDashoffset={-t * 30} opacity={Math.min(1, settle * 4) * (1 - settle)} />
      )}
      {/* near-water glints */}
      {Array.from({ length: 12 }, (_, i) => {
        const y = 880 + (i % 4) * 50, x = ((hash(i * 7.7) * 1920 + t * (14 + i)) % 2000) - 40;
        return <path key={i} d={`M${x} ${y} L${x + 50 + (i % 3) * 30} ${y}`} stroke="#A9D0DE" strokeWidth={4} strokeLinecap="round" opacity={0.7} />;
      })}
    </Frame>
  );
};
