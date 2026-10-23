import React from 'react';

/** The ten hands. Drawn in the hand's own frame: the wrist at 0,0, +x along the forearm, the thumb toward −y. */
export const GESTURES = ['open', 'relaxed', 'fist', 'point', 'pen', 'grip', 'stop', 'two', 'cup', 'chop'] as const;
export type Gesture = (typeof GESTURES)[number];
export const GESTURE_NAMES: Record<Gesture, string> = {
  open: 'كفّ مفتوحة', relaxed: 'يد مسترخية', fist: 'قبضة', point: 'إشارة بالسبابة', pen: 'إمساك قلم',
  grip: 'قبضة حول شيء', stop: 'كفّ «توقّف»', two: 'إصبعان', cup: 'كفّ تعرض', chop: 'حافة اليد',
};

const INK = '#2A2F3A';

/** A finger: an ink stroke under a skin stroke, so it keeps an outline at any angle. */
const Finger: React.FC<{ d: string; skin: string; w?: number; o?: number }> = ({ d, skin, w = 4.2, o = 2.4 }) => (
  <><path d={d} fill="none" stroke={INK} strokeWidth={w + o} strokeLinecap="round" strokeLinejoin="round" /><path d={d} fill="none" stroke={skin} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" /></>
);
const Palm: React.FC<{ skin: string; rx?: number; ry?: number; cx?: number }> = ({ skin, rx = 8, ry = 7.6, cx = 6 }) => (
  <ellipse cx={cx} cy={0} rx={rx} ry={ry} fill={skin} stroke={INK} strokeWidth={2.2} />
);

/**
 * `back` and `front` let a held object sit between the palm and the fingers that wrap it (grip, pen):
 * draw <Hand layer="back"/>, the object, then <Hand layer="front"/>.
 */
export const Hand: React.FC<{ g: Gesture; skin: string; layer?: 'back' | 'front' | 'all' }> = ({ g, skin, layer = 'all' }) => {
  const back = layer !== 'front', front = layer !== 'back';
  switch (g) {
    case 'open':
      return <g>{back && <>
        <Finger d="M4 -6 L10 -11 L14 -15" skin={skin} />
        {[-5, -1.5, 2, 5.5].map((y, k) => <Finger key={k} d={`M10 ${y * 0.8} L${22 - Math.abs(k - 1.5) * 1.6} ${y * 1.25}`} skin={skin} />)}
        <Palm skin={skin} />
      </>}</g>;
    case 'relaxed':
      return <g>{back && <>
        <Finger d="M5 -6 L11 -9" skin={skin} />
        {[-4.5, -1.5, 1.5, 4.5].map((y, k) => <Finger key={k} d={`M10 ${y * 0.8} Q17 ${y} 18 ${y + 4}`} skin={skin} />)}
        <Palm skin={skin} />
      </>}</g>;
    case 'fist':
      return <g>{back && <>
        <rect x={0} y={-7.5} width={15} height={15} rx={5.5} fill={skin} stroke={INK} strokeWidth={2.2} />
        {[-3.5, 0, 3.5].map((y, k) => <path key={k} d={`M11 ${y} L14.5 ${y}`} stroke={INK} strokeWidth={1.4} strokeLinecap="round" />)}
        <Finger d="M3 -6 Q9 -8 11 -3" skin={skin} w={3.8} />
      </>}</g>;
    case 'point':
      return <g>{back && <>
        <rect x={0} y={-7} width={14} height={14} rx={5} fill={skin} stroke={INK} strokeWidth={2.2} />
        <Finger d="M11 -4 L27 -5" skin={skin} />
        {[0.5, 4].map((y, k) => <path key={k} d={`M10.5 ${y} L13.5 ${y}`} stroke={INK} strokeWidth={1.4} strokeLinecap="round" />)}
        <Finger d="M3 -6 Q8 -8 11 -6" skin={skin} w={3.6} />
      </>}</g>;
    case 'pen':
      return <g>
        {back && <><Palm skin={skin} rx={7.5} ry={7} />{[1.5, 4.8].map((y, k) => <Finger key={k} d={`M9 ${y} Q14 ${y + 1} 13 ${y + 4.5}`} skin={skin} w={3.8} />)}</>}
        {front && <><Finger d="M8 -5 Q15 -7 17 -2" skin={skin} w={3.8} /><Finger d="M4 -6 Q11 -2 16.5 -1" skin={skin} w={3.6} /></>}
      </g>;
    case 'grip':
      return <g>
        {back && <Palm skin={skin} rx={8} ry={8} cx={5} />}
        {front && <>{[-4.5, -1.2, 2.1, 5.4].map((y, k) => <Finger key={k} d={`M8 ${y - 1} Q16 ${y - 3} 15 ${y + 2.5}`} skin={skin} w={3.9} />)}<Finger d="M2 -7 Q9 -11 13 -6" skin={skin} w={4} /></>}
      </g>;
    case 'stop':
      return <g>{back && <>
        <Finger d="M4 -7 L9 -13" skin={skin} />
        {[-4.5, -1.5, 1.5, 4.5].map((y, k) => <Finger key={k} d={`M11 ${y} L${23 - Math.abs(k - 1.5)} ${y}`} skin={skin} />)}
        <Palm skin={skin} rx={8.5} ry={8} />
        <path d="M2 -2 Q6 1 10 -1 M3 3 Q7 4 11 2" fill="none" stroke={INK} strokeWidth={1.1} opacity={0.6} />
      </>}</g>;
    case 'two':
      return <g>{back && <>
        <rect x={0} y={-7} width={14} height={14} rx={5} fill={skin} stroke={INK} strokeWidth={2.2} />
        <Finger d="M11 -4.5 L25 -9" skin={skin} />
        <Finger d="M11 -0.5 L25 1" skin={skin} />
        <path d="M10.5 4 L13.5 4" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
        <Finger d="M3 -6 Q8 -7 10 -4" skin={skin} w={3.6} />
      </>}</g>;
    case 'cup':
      return <g>{back && <>
        <path d="M0 -6 Q4 8 16 8 Q22 7 23 2 L20 1 Q16 3 12 0 Q8 -4 6 -8 Z" fill={skin} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        <Finger d="M5 -7 L11 -11" skin={skin} w={3.8} />
      </>}</g>;
    case 'chop':
      return <g>{back && <>
        <path d="M0 -6 L22 -3.5 Q26 0 22 3.5 L0 6 Z" fill={skin} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        <path d="M11 -1.5 L23 -0.5" stroke={INK} strokeWidth={1.1} opacity={0.6} />
        <Finger d="M3 -6 L10 -8" skin={skin} w={3.6} />
      </>}</g>;
  }
};
