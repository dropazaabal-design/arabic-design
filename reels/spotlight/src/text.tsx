import React from 'react';
import { useCurrentFrame } from 'remotion';
import { BODY_FONT, TITLE_FONT } from './fonts';
import { C, SAFE } from './theme';
import { ease, prog, sec } from './time';

// Words are laid out by the browser, right to left. `{color|words}` colours a
// whole phrase; the split always falls on a space, so letters stay joined.
// Motion is per line or per block, never per letter.
export const Rich: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\{[^}]+\})/).filter(Boolean).map((part, i) => {
      const m = part.match(/^\{([^|]+)\|(.+)\}$/);
      return m ? <span key={i} style={{ color: m[1] }}>{m[2]}</span> : <span key={i}>{part}</span>;
    })}
  </>
);
export const plain = (t: string) => t.replace(/\{[^|]+\|([^}]+)\}/g, '$1');

/** A title in the top band. `pop` = shown from its first frame (the hook). */
export const Title: React.FC<{ text: string; from: number; to: number; size?: number; top?: number; pop?: boolean; color?: string; plate?: boolean }> = ({ text, from, to, size = 112, top = 186, pop = false, color = C.ivory, plate = false }) => {
  const f = useCurrentFrame();
  if (f < from - 1 || f > to + 1) return null;
  const pin = pop ? 1 : prog(f, from, sec(0.4), ease.out);
  const scaleIn = pop ? 0.94 + 0.06 * prog(f, from, sec(0.3), ease.back) : 1;
  const pout = prog(f, to - sec(0.27), sec(0.27), ease.in);
  return (
    <div dir="rtl" lang="ar" style={{
      position: 'absolute', top, left: SAFE.left, right: SAFE.right, textAlign: 'center',
      fontFamily: TITLE_FONT, fontWeight: 900, fontSize: size, lineHeight: 1.18, color,
      opacity: Math.min(pin, 1 - pout), transform: `translateY(${(1 - pin) * 36 - pout * 26}px) scale(${scaleIn})`,
      whiteSpace: 'pre-line',
      textShadow: `0 5px 0 rgba(0,0,0,0.35), 0 0 30px rgba(0,0,0,0.35)`,
    }}>
      {plate ? (
        <span style={{ display: 'inline-block', background: 'rgba(10,14,34,0.86)', padding: '0.02em 0.55em 0.14em', borderRadius: 30, border: `4px solid rgba(246,235,217,0.18)`, boxShadow: '0 10px 0 rgba(0,0,0,0.25)' }}><Rich text={text} /></span>
      ) : <Rich text={text} />}
    </div>
  );
};

export const Caption: React.FC<{ text: string; from: number; to: number; top: number; size?: number; color?: string; bg?: string; weight?: number; font?: string }> = ({ text, from, to, top, size = 62, color = C.ivory, bg, weight = 700, font = BODY_FONT }) => {
  const f = useCurrentFrame();
  if (f < from - 1 || f > to + 1) return null;
  const pin = prog(f, from, sec(0.4), ease.out);
  const op = Math.min(pin, 1 - prog(f, to - sec(0.27), sec(0.27), ease.in));
  return (
    <div style={{ position: 'absolute', top, left: SAFE.left, right: SAFE.right, display: 'flex', justifyContent: 'center', opacity: op, transform: `translateY(${(1 - pin) * 24}px)` }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.25, color, background: bg, padding: bg ? '12px 36px 18px' : 0, borderRadius: 40, textAlign: 'center', textShadow: bg ? 'none' : '0 4px 0 rgba(0,0,0,0.35)' }}>
        <Rich text={text} />
      </div>
    </div>
  );
};

/** Words that ride a drawn shape (a bubble, a pill); x, y is its centre. */
export const Words: React.FC<{ text: string; x: number; y: number; w: number; size: number; o: number; scale?: number; rot?: number; color?: string; weight?: number; font?: string }> = ({ text, x, y, w, size, o, scale = 1, rot = 0, color = C.ivory, weight = 800, font = TITLE_FONT }) => (
  <div dir="rtl" lang="ar" style={{
    position: 'absolute', left: x - w / 2, top: y, width: w, transform: `translateY(-50%) rotate(${rot}deg) scale(${scale})`,
    textAlign: 'center', fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.22, color, opacity: o, whiteSpace: 'pre-line',
  }}><Rich text={text} /></div>
);

export const Pill: React.FC<{ text: string; x: number; y: number; bg: string; from: number; to: number; size?: number; w?: number }> = ({ text, x, y, bg, from, to, size = 52, w = 470 }) => {
  const f = useCurrentFrame();
  if (f < from - 1 || f > to + 1) return null;
  const p = prog(f, from, sec(0.33), ease.back);
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y, width: w, display: 'flex', justifyContent: 'center', opacity: Math.min(prog(f, from, sec(0.2)), 1 - prog(f, to - sec(0.27), sec(0.27))), transform: `scale(${0.6 + 0.4 * p})` }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: size, color: C.paper, background: bg, padding: '10px 30px 16px', borderRadius: 999, border: `5px solid ${C.ivory}`, whiteSpace: 'nowrap', boxShadow: '0 8px 0 rgba(0,0,0,0.3)' }}>{text}</div>
    </div>
  );
};

/** Numbered steps; each line arrives with the action that builds its block. */
export const Steps: React.FC<{ items: Array<{ text: string; at: number; color: string }>; from: number; to: number; top?: number; focus?: number }> = ({ items, from, to, top = 200, focus = -1 }) => {
  const f = useCurrentFrame();
  if (f < from - 1 || f > to + 1) return null;
  return (
    <div dir="rtl" lang="ar" style={{ position: 'absolute', top, left: SAFE.left, right: SAFE.right, display: 'flex', flexDirection: 'column', gap: 20, opacity: 1 - prog(f, to - sec(0.27), sec(0.27)) }}>
      {items.map((s, i) => {
        const p = prog(f, s.at, sec(0.4), ease.out);
        const active = i === focus;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 26, opacity: p * (focus < 0 || active ? 1 : 0.55), transform: `translateX(${(1 - p) * -60}px) scale(${active ? 1 : 0.94})`, transformOrigin: 'right center' }}>
            <div style={{ width: 96, height: 96, borderRadius: 26, background: s.color, border: `5px solid ${C.ivory}`, color: C.paper, fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 0 rgba(0,0,0,0.3)' }}>{i + 1}</div>
            <div style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 72, color: C.ivory, lineHeight: 1.12, textShadow: '0 4px 0 rgba(0,0,0,0.35)' }}>{s.text}</div>
          </div>
        );
      })}
    </div>
  );
};
