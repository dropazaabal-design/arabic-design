import React from 'react';
import { Headline, WordByWord } from '../text';
import { C, TITLE } from '../theme';
import { sec } from '../time';

/** The scene's title, in the band above the stage. `at` < scene start shows it fully from the first frame. */
export const Title: React.FC<{ text: string; f: number; at: number; until?: number; color?: string; size?: number }> = ({ text, f, at, until, color = C.ink, size = 92 }) => (
  <Headline text={text} f={f} at={at} until={until} x={540} y={TITLE.y} w={980} size={size} color={color} />
);

/** A verse half-line revealed one whole word at a time, on the spoken word (letters are never split). */
export const Verse: React.FC<{ text: string; f: number; times: number[]; y: number; until?: number; color?: string; size?: number }> = ({ text, f, times, y, until, color = C.ink, size = 70 }) => (
  <WordByWord text={text} f={f} times={times.map((t) => t - sec(0.06))} until={until} x={540} y={y} w={1000} size={size} color={color} />
);
