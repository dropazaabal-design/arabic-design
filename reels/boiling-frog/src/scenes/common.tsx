import React from 'react';
import { PAL, bowLine, stroke, wobRect } from '@mukarram/characters/ink';
import envelope from '../video/envelope.json';

// Pose/expression/look tracks and idle motion are reused from reels/mukarram/src/scenes/common.tsx;
// only the mouth envelope (this reel's measured voice) is local.
export { exprTrack, idle, poseTrack, vecTrack } from '@mukarram/scenes/common';
export type ShotProps = { f: number; t0: number; t1: number };

export const talkAt = (f: number) => {
  const e = envelope as number[];
  const v = Math.max(e[f] ?? 0, (e[f - 1] ?? 0) * 0.7, (e[f + 1] ?? 0) * 0.5);
  return v < 0.12 ? 0 : Math.min(1, (v - 0.12) * 1.25);
};

/** The narrator's corner for this reel: a dark navy set (the light studio belongs to reels/mukarram). */
export const StudioDark: React.FC<{ glow?: number }> = ({ glow = 0 }) => (
  <g>
    <rect x={-400} y={-400} width={1900} height={2800} fill="#1C2A44" />
    <path d={wobRect(110, 300, 860, 1060, 60, 601, 4)} fill="#2B4A73" {...stroke()} />
    {glow > 0 && <circle cx={540} cy={760} r={460} fill={PAL.glow} opacity={0.35 * glow} />}
    <path d={bowLine(150, 520, 420, 520, 2)} {...stroke(8)} />
    <path d={wobRect(180, 420, 34, 100, 4, 602, 1)} fill={PAL.red} {...stroke(6)} />
    <path d={wobRect(220, 440, 30, 80, 4, 603, 1)} fill={PAL.blueSoft} {...stroke(6)} />
    {/* a framed doodle of a thermometer (this reel's motif) */}
    <path d={wobRect(720, 360, 170, 200, 8, 604, 2)} fill={PAL.white} {...stroke(6)} />
    <path d="M795 520 L795 400 Q805 385 815 400 L815 520" fill="none" {...stroke(6)} />
    <circle cx={805} cy={528} r={18} fill={PAL.red} {...stroke(5)} />
    <path d="M800 510 L800 450 L810 450 L810 510Z" fill={PAL.red} />
  </g>
);
