import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Chip, PlacedSet, SetState, SPOTS, onCanvas } from './art';
import { loadFonts, TITLE } from './fonts';
import { Guides, Signature } from './text';
import { C, PROFILES } from './theme';

loadFonts();

// One still per ratio: the problem at a glance — the lit phone in reach, the book hidden in the
// drawer — and the question in large type. Same set and palette as the films.
const room: SetState = {
  phoneLit: 1, phoneBadge: 1, bookGhost: 1, note: 1, hours: 10,
  ring: { at: 'phone', color: C.red, o: 1 },
};
const LAYOUT = {
  '16x9': { set: { x: -10, y: 250, w: 1100 }, title: { x: 1060, y: 250, w: 706, size: 124 }, sig: 40 },
  '9x16': { set: { x: -95, y: 760, w: 1150 }, title: { x: 96, y: 250, w: 804, size: 100 }, sig: 42 },
  '4x5': { set: { x: -22, y: 490, w: 1124 }, title: { x: 86, y: 118, w: 908, size: 96 }, sig: 36 },
} as const;

export const Cover: React.FC<{ ratio: '16x9' | '9x16' | '4x5'; guides?: boolean }> = ({ ratio, guides = false }) => {
  const p = PROFILES[ratio];
  const L = LAYOUT[ratio];
  const drawer = onCanvas(SPOTS.drawer, L.set);
  const wide = ratio === '16x9';
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 90% at ${wide ? '35%' : '50%'} 55%, ${C.wall} 0%, ${C.wallLow} 70%, ${C.night} 100%)`, overflow: 'hidden' }}>
      <PlacedSet s={room} {...L.set} />
      <div style={{ position: 'absolute', left: drawer[0] - 150, top: drawer[1] - 52, width: 300, height: 104, borderRadius: 24, border: `6px solid ${C.lilac}` }} />
      <div dir="rtl" lang="ar" style={{
        position: 'absolute', left: L.title.x, top: L.title.y, width: L.title.w,
        display: 'flex', flexDirection: 'column', alignItems: wide ? 'flex-start' : 'center', gap: 22,
      }}>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: L.title.size, lineHeight: 1.22, color: C.light, textAlign: wide ? 'right' : 'center' }}>
          <div style={{ whiteSpace: 'nowrap' }}>لماذا <span style={{ color: C.red }}>الهاتف</span></div>
          {wide ? (
            <><div>أقرب من</div><div><span style={{ color: C.lilac }}>الكتاب</span>؟</div></>
          ) : (
            <div style={{ whiteSpace: 'nowrap' }}>أقرب من <span style={{ color: C.lilac }}>الكتاب</span>؟</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: wide ? 'flex-start' : 'center' }}>
          <Chip text="قريب وظاهر" icon="eye" color={C.red} size={wide ? 46 : 50} o={1} />
          <Chip text="بعيد ومخفي" icon="lock" color={C.lilac} size={wide ? 46 : 50} o={1} />
        </div>
        <Signature size={L.sig} o={1} />
      </div>
      {guides && <Guides p={p} />}
    </AbsoluteFill>
  );
};
