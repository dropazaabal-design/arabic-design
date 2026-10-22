import React from 'react';
import { BODY, TITLE } from '../../fonts';
import { INK, PAL } from '../style';
import { Avatar, clamp01 } from './ui';

/**
 * The lock screen, authored at 360×720 (top-left origin): a cool night wallpaper, a big clock and the date.
 * Lay NotificationBanners over it at x=12, y≈260 (each ~100 px tall).
 */
export const LockScreen = ({ time, date }: { time: string; date?: string }) => (
  <g>
    <rect width={360} height={720} fill={PAL.skyNight} />
    <path d="M0 470 Q90 420 180 455 T360 430 V720 H0 Z" fill="#3A4766" />
    <path d="M0 560 Q110 520 210 560 T360 545 V720 H0 Z" fill="#45547A" />
    <path d="M0 640 Q120 610 240 645 T360 640 V720 H0 Z" fill="#53648C" />
    {[[60, 120], [290, 90], [320, 300], [40, 330], [200, 380]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={2 + (k % 2)} fill={PAL.screenGlow} opacity={0.5} />)}
    {/* padlock */}
    <g transform="translate(180 62)" fill="none" stroke="#E8EDF2" strokeWidth={2.4} strokeLinecap="round">
      <path d="M-6 -2 v-5 a6 6 0 0 1 12 0 v5" />
      <rect x={-9} y={-2} width={18} height={14} rx={3} fill="#E8EDF2" stroke="none" />
    </g>
    <foreignObject y={84} width={360} height={190}>
      <div dir="rtl" lang="ar" style={{ width: 360, textAlign: 'center', color: '#F3F1EC' }}>
        {date && <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 22, lineHeight: 1.6 }}>{date}</div>}
        <div dir="ltr" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 104, lineHeight: 1.05 }}>{time}</div>
      </div>
    </foreignObject>
    {/* torch and camera, home bar */}
    {[[48, 'M-4 -8 h8 l-2 6 v10 h-4 v-10 Z'], [312, 'M-9 -5 h4 l2 -3 h6 l2 3 h4 v12 h-18 Z M0 1 m-3.5 0 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0']].map(([x, d]) => (
      <g key={x} transform={`translate(${x} 664)`}>
        <circle r={24} fill="#1F2840" opacity={0.75} />
        <path d={d as string} fill="none" stroke="#E8EDF2" strokeWidth={2} strokeLinejoin="round" />
      </g>
    ))}
    <rect x={130} y={702} width={100} height={5} rx={2.5} fill="#E8EDF2" />
  </g>
);

/**
 * A lock-screen notification card, top-left origin, 336 wide × ~100 tall (screen units, 360-wide screen).
 * `o` 0..1 fades and slides it in from above.
 */
export const NotificationBanner = ({ name, text, time = 'الآن', o = 1 }: { name: string; text: string; time?: string; o?: number }) => {
  const k = clamp01(o);
  return (
    <g opacity={k} transform={`translate(0 ${(1 - k) * -18})`}>
      <foreignObject width={336} height={130}>
        <div dir="rtl" lang="ar" style={{ boxSizing: 'border-box', width: 336, display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 22, background: '#F3F1EC', border: `2px solid ${INK}`, fontFamily: BODY, color: INK }}>
          <Avatar name={name} size={46} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, fontSize: 19 }}>{name}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#6B7482' }}>{time}</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 17, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{text}</span>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};
