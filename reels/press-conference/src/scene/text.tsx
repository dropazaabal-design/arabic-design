import React from 'react';
import { tween } from '@motion/index';
import { C, FONT, W } from './kit';

/** A short anchor phrase (not a running subtitle): Cairo 900, 58 px, porcelain on a pine pill, inside the centred 4:5
 *  guide and above the platforms' bottom interface. Two lines at most. */
export const Caption: React.FC<{ t: number; from: number; to: number; text: string; top?: number; tone?: 'teal' | 'berry' }> = ({ t, from, to, text, top = 300, tone = 'teal' }) => {
  if (t < from - 0.01 || t > to + 0.35) return null;
  const op = Math.min(tween(t, from, from + 0.28, 0, 1), tween(t, to, to + 0.3, 1, 0));
  const y = tween(t, from, from + 0.45, 18, 0, 'power3.out');
  return (
    <div style={{ position: 'absolute', top, left: 0, width: W, display: 'flex', justifyContent: 'center', opacity: op, transform: `translateY(${y}px)` }}>
      <div style={{ direction: 'rtl', fontFamily: FONT, fontWeight: 900, fontSize: 58, lineHeight: 1.35, color: C.porc, background: 'rgba(8,24,20,0.84)', padding: '10px 40px 22px', borderRadius: 30, textAlign: 'center', maxWidth: 860, textWrap: 'balance', borderBottom: `6px solid ${tone === 'teal' ? C.teal2 : C.berry2}` }}>
        {text}
      </div>
    </div>
  );
};

/** The closing title and, under it, the brand. */
export const EndTitle: React.FC<{ t: number; from: number; brandAt: number; top?: number }> = ({ t, from, brandAt, top = 330 }) => {
  if (t < from) return null;
  const op = tween(t, from, from + 0.5, 0, 1);
  const y = tween(t, from, from + 0.7, 26, 0, 'power3.out');
  const b = tween(t, brandAt, brandAt + 0.5, 0, 1);
  return (
    <div style={{ position: 'absolute', top, left: 0, width: W, textAlign: 'center' }}>
      <div style={{ opacity: op, transform: `translateY(${y}px)`, direction: 'rtl', fontFamily: FONT, fontWeight: 900, fontSize: 92, lineHeight: 1.3, color: C.porc, textShadow: '0 6px 30px rgba(0,0,0,0.45)' }}>
        حياتك ليست<br />مؤتمرًا صحفيًا
      </div>
      <div style={{ opacity: b, marginTop: 26, direction: 'rtl', fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.teal2 }}>كتاب وبس</div>
    </div>
  );
};
