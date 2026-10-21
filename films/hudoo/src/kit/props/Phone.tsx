import React from 'react';
import { INK, PAL } from '../style';
import { clamp01, rrect } from './ui';

/** Screen content is authored at 360×720 (top-left origin) and scaled into the glass. */
export const PHONE_SCREEN = { w: 360, h: 720 } as const;

const BODY = '#3B4456', BACK = '#4A5568', EDGE = '#262C38';

export type PhoneProps = { w?: number; screen?: React.ReactNode; glow?: number; faceDown?: boolean; buzz?: number; t?: number };

/**
 * A phone, portrait, centred at 0,0. Width w (default 44), height ≈ 2.1·w; everything scales with w.
 * In a Character's hand the prop is drawn ×1.45 (the hand's scale), so pass w≈28 there for a ~40×85 px phone.
 * `screen` is drawn into a 360×720 viewport (PHONE_SCREEN); without it the glass is dark (off).
 * `glow` 0..1 a cool halo around a lit screen; `faceDown` shows the back; `buzz` 0..1 shakes it (needs `t`, seconds) with vibration marks.
 */
export const Phone = ({ w = 44, screen, glow = 0, faceDown = false, buzz = 0, t = 0 }: PhoneProps) => {
  const b = w * 0.065, sw = w - 2 * b, sh = sw * 2, h = sh + 2 * b, r = w * 0.17, lw = w * 0.055;
  const bz = clamp01(buzz);
  const dx = bz * w * 0.05 * Math.sin(t * Math.PI * 2 * 23), rot = bz * 4 * Math.sin(t * Math.PI * 2 * 17 + 1);
  const sx = -sw / 2, sy = -sh / 2, sr = Math.max(0, r - b);
  const g = clamp01(glow);
  return (
    <g>
      {g > 0 && !faceDown && [3, 2, 1].map((k) => (
        <path key={k} d={rrect(-w / 2 - k * w * 0.22, -h / 2 - k * w * 0.22, w + k * w * 0.44, h + k * w * 0.44, r + k * w * 0.22)} fill={PAL.screenGlow} opacity={g * 0.16} />
      ))}
      {bz > 0 && [-1, 1].map((s) => (
        <path key={s} d={`M${s * (w / 2 + w * 0.16)} ${-h * 0.16} q${s * w * 0.09} ${h * 0.16} 0 ${h * 0.32} M${s * (w / 2 + w * 0.3)} ${-h * 0.1} q${s * w * 0.07} ${h * 0.1} 0 ${h * 0.2}`}
          fill="none" stroke={INK} strokeWidth={lw} strokeLinecap="round" opacity={bz} />
      ))}
      <g transform={`translate(${dx} 0) rotate(${rot})`}>
        {/* side buttons */}
        <rect x={(faceDown ? -1 : 1) * (w / 2) - lw * 0.6} y={-h * 0.2} width={lw * 1.2} height={h * 0.12} rx={lw * 0.5} fill={EDGE} />
        <path d={rrect(-w / 2, -h / 2, w, h, r)} fill={faceDown ? BACK : BODY} stroke={INK} strokeWidth={lw} />
        {faceDown ? (
          <g>
            <path d={rrect(-w / 2 + w * 0.12, -h / 2 + w * 0.12, w * 0.36, w * 0.36, w * 0.09)} fill={BODY} stroke={INK} strokeWidth={lw * 0.7} />
            <circle cx={-w / 2 + w * 0.3} cy={-h / 2 + w * 0.22} r={w * 0.065} fill={EDGE} stroke={INK} strokeWidth={lw * 0.5} />
            <circle cx={-w / 2 + w * 0.3} cy={-h / 2 + w * 0.39} r={w * 0.065} fill={EDGE} stroke={INK} strokeWidth={lw * 0.5} />
            <path d={`M${w * 0.3} ${-h * 0.2} L${w * 0.3} ${h * 0.35}`} stroke="#FFFFFF" strokeWidth={lw} strokeLinecap="round" opacity={0.12} />
          </g>
        ) : (
          <g>
            <svg x={sx} y={sy} width={sw} height={sh} viewBox={`0 0 ${PHONE_SCREEN.w} ${PHONE_SCREEN.h}`}>
              {screen ?? (
                <g>
                  <rect width={360} height={720} fill={PAL.screen} />
                  <path d="M250 0 L360 0 L360 90 L80 720 L-20 720 Z" fill="#FFFFFF" opacity={0.06} />
                </g>
              )}
            </svg>
            {/* round the glass corners: the body colour over the screen's square corners */}
            <path d={`M${sx} ${sy} h${sw} v${sh} h${-sw} Z ${rrect(sx, sy, sw, sh, sr)}`} fill={BODY} fillRule="evenodd" />
            <circle cx={0} cy={sy + sw * 0.07} r={sw * 0.028} fill={EDGE} />
            <path d={rrect(sx, sy, sw, sh, sr)} fill="none" stroke={INK} strokeWidth={lw * 0.45} />
          </g>
        )}
      </g>
    </g>
  );
};
