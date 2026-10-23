import React from 'react';
import { draw } from '../motion';
import { C } from '../theme';
import { ArText, G, P } from './doodles';

// The reel's world: a save button that becomes a drawer, saved cards that pile up in it, one card that
// is taken out and turns into an action (a book that opens, a task that starts), and a single step
// that leaves the drawer. Paper, cardboard and ink; no people.

const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const DRAWER = { x: 540, y: 1150, w: 700, h: 240 };

/** The platform-style save button (a bookmark in a rounded square). `fill` 0→1 fills the bookmark. */
export const SaveButton: React.FC<P & { fill?: number; press?: number }> = ({ fill = 0, press = 0, ...g }) => (
  <G {...g}>
    <g transform={`scale(${1 - 0.12 * Math.sin(clamp(press) * Math.PI)})`}>
      <rect x={-130} y={-130} width={260} height={260} rx={60} fill={C.white} stroke={C.ink} strokeWidth={8} filter="url(#lift)" />
      <path d="M -50 -78 L 50 -78 L 50 82 L 0 44 L -50 82 Z" fill={fill > 0 ? C.blue : 'none'} fillOpacity={fill} stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
    </g>
  </G>
);

/** Small bookmark / clock marks for a card's corner. */
const Mark: React.FC<{ x: number; y: number; kind: 'saved' | 'later'; s?: number }> = ({ x, y, kind, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {kind === 'saved'
      ? <path d="M -18 -26 L 18 -26 L 18 28 L 0 14 L -18 28 Z" fill={C.blue} />
      : <g><circle r={24} fill={C.paper} stroke={C.red} strokeWidth={6} /><path d="M 0 0 L 0 -14 M 0 0 L 10 6" stroke={C.red} strokeWidth={6} strokeLinecap="round" /></g>}
  </g>
);

/** Card icons: book (reading), target (focus), calendar (planning the day). */
export const Icon: React.FC<{ kind: 'book' | 'focus' | 'day'; color?: string }> = ({ kind, color = C.white }) => {
  if (kind === 'book') return (
    <g stroke={color} strokeWidth={10} fill="none" strokeLinejoin="round">
      <path d="M 0 -50 Q -50 -70 -100 -50 L -100 60 Q -50 40 0 60 Q 50 40 100 60 L 100 -50 Q 50 -70 0 -50 Z" />
      <path d="M 0 -50 L 0 60" />
    </g>
  );
  if (kind === 'focus') return (
    <g stroke={color} strokeWidth={10} fill="none">
      <circle r={70} /><circle r={42} /><circle r={12} fill={color} />
    </g>
  );
  return (
    <g stroke={color} strokeWidth={10} fill="none" strokeLinejoin="round">
      <rect x={-80} y={-64} width={160} height={136} rx={14} />
      <path d="M -80 -28 L 80 -28 M -44 -84 L -44 -48 M 44 -84 L 44 -48" strokeLinecap="round" />
      <path d="M -40 14 L -16 38 L 38 -10" strokeLinecap="round" />
    </g>
  );
};

/** A saved advice card: a coloured thumbnail with an icon, the topic, and a corner mark.
 *  `dust` greys it; `later` 0…1 stamps «لاحقًا» and turns the bookmark into a clock; `ring` outlines it green. */
export const Card: React.FC<P & { kind: 'book' | 'focus' | 'day'; label: string; color: string; dust?: number; later?: number; laterText?: string; ring?: number }> = ({
  kind, label, color, dust = 0, later = 0, laterText = '', ring = 0, ...g
}) => (
  <G {...g}>
    {ring > 0 && <rect x={-206} y={-266} width={412} height={532} rx={40} fill="none" stroke={C.green} strokeWidth={14} opacity={ring} />}
    <rect x={-190} y={-250} width={380} height={500} rx={30} fill={C.paper} stroke={C.ink} strokeWidth={6} filter="url(#lift)" />
    <rect x={-162} y={-222} width={324} height={270} rx={20} fill={color} />
    <g transform="translate(0 -88)"><Icon kind={kind} /></g>
    <ArText x={0} y={130} size={58} color={C.ink} weight={900}>{label}</ArText>
    <rect x={-120} y={186} width={240} height={14} rx={7} fill={C.line} />
    <Mark x={128} y={-196} kind={later > 0.5 ? 'later' : 'saved'} s={1.2} />
    {dust > 0 && <rect x={-190} y={-250} width={380} height={500} rx={30} fill={C.muted} opacity={0.45 * dust} />}
    {later > 0 && (
      <g transform={`translate(0 -40) rotate(-12) scale(${1.6 - 0.6 * clamp(later)})`} opacity={clamp(later * 2)}>
        <rect x={-150} y={-56} width={300} height={112} rx={16} fill={C.paper} fillOpacity={0.9} stroke={C.red} strokeWidth={10} />
        <ArText size={70} color={C.red} weight={900}>{laterText}</ArText>
      </g>
    )}
  </G>
);

/** The drawer, front view. `open` 0…1 pulls it out; `tabs` are the tops of what is inside. */
export const Drawer: React.FC<{ open: number; tabs: Array<{ x: number; color: string; h?: number; rot?: number; dust?: number }>; morph?: number; o?: number }> = ({ open, tabs, morph = 1, o = 1 }) => {
  const { x, y, w, h } = DRAWER;
  const top = y - h / 2;
  const rise = 150 * clamp(open);
  return (
    <g opacity={o}>
      {/* the opening and what stands in it (drawn behind the front panel) */}
      {open > 0 && <path d={`M ${x - w / 2 + 30} ${top} L ${x - w / 2 + 60} ${top - rise * 0.5} L ${x + w / 2 - 60} ${top - rise * 0.5} L ${x + w / 2 - 30} ${top} Z`} fill={C.navy2} />}
      {tabs.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${top + 100 - 230 * clamp(open) * (t.h ?? 1)}) rotate(${t.rot ?? 0})`}>
          <rect x={-70} y={-90} width={140} height={190} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          <rect x={-56} y={-78} width={112} height={70} rx={10} fill={t.color} />
          {(t.dust ?? 0) > 0 && <rect x={-70} y={-90} width={140} height={190} rx={14} fill={C.muted} opacity={0.5 * (t.dust ?? 0)} />}
        </g>
      ))}
      {/* the front panel */}
      <g transform={`translate(${x} ${y}) scale(${morph} 1)`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={C.cardboard} stroke={C.ink} strokeWidth={8} filter="url(#lift)" />
        <rect x={-w / 2 + 22} y={-h / 2 + 22} width={w - 44} height={h - 44} rx={16} fill="none" stroke={C.cardboardDark} strokeWidth={5} />
        <rect x={-90} y={-62} width={180} height={52} rx={8} fill={C.paper} stroke={C.cardboardDark} strokeWidth={4} />
        <rect x={-120} y={30} width={240} height={34} rx={17} fill={C.ink} />
      </g>
    </g>
  );
};

/** A book: `open` 0 = closed (cover), 1 = spread; `read` 0…1 highlights the right page's lines in turn (RTL). */
export const Book: React.FC<P & { open: number; read?: number; color?: string }> = ({ open, read = 0, color = C.blue, ...g }) => {
  const o = clamp(open);
  return (
    <G {...g}>
      <g transform={`translate(${-150 * (1 - o)} 0)`}>
      {/* pages */}
      <g opacity={clamp(o * 3)}>
        <path d={`M 0 -190 Q ${-160 * o} -214 ${-300 * o} -190 L ${-300 * o} 200 Q ${-160 * o} 176 0 200 Z`} fill={C.paper} stroke={C.ink} strokeWidth={6} />
        <path d="M 0 -190 Q 160 -214 300 -190 L 300 200 Q 160 176 0 200 Z" fill={C.paper} stroke={C.ink} strokeWidth={6} />
        {Array.from({ length: 6 }).map((_, i) => {
          const q = clamp(read * 6 - i);
          return (
            <g key={i}>
              {q > 0 && <rect x={36} y={-136 + i * 52} width={232 * q} height={26} rx={8} fill={C.green} opacity={0.35} transform={`translate(${232 * (1 - q)} 0)`} />}
              <rect x={40} y={-130 + i * 52} width={226} height={12} rx={6} fill={C.line} />
              <rect x={-266 * o} y={-130 + i * 52} width={226 * o} height={12} rx={6} fill={C.line} />
            </g>
          );
        })}
        <path d="M 0 -190 L 0 200" stroke={C.cardboardDark} strokeWidth={6} />
      </g>
      {/* the cover, swinging open from the spine (right to left) */}
      {o < 1 && (
        <g transform={`scale(${1 - 2 * Math.min(o, 0.5)} 1)`}>
          <rect x={0} y={-200} width={300} height={400} rx={18} fill={color} stroke={C.ink} strokeWidth={6} filter="url(#lift)" />
          <rect x={30} y={-150} width={240} height={60} rx={10} fill={C.paper} opacity={0.9} />
          <rect x={18} y={-200} width={20} height={400} fill={C.ink} opacity={0.25} />
        </g>
      )}
      </g>
    </G>
  );
};

/** One task: a checkbox, a line, and a bar that fills; `done` ticks the box. */
export const Task: React.FC<P & { p: number; done?: number; label: string }> = ({ p, done = 0, label, ...g }) => (
  <G {...g}>
    <rect x={-260} y={-140} width={520} height={280} rx={30} fill={C.paper} stroke={C.ink} strokeWidth={6} filter="url(#lift)" />
    <rect x={150} y={-90} width={70} height={70} rx={14} fill={done > 0 ? C.green : C.white} stroke={C.ink} strokeWidth={6} />
    {done > 0 && <path d="M 166 -56 L 182 -40 L 206 -72" fill="none" stroke={C.white} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" {...draw(done)} />}
    <ArText x={120} y={-55} size={52} anchor="start" color={C.ink} weight={900}>{label}</ArText>
    <rect x={-220} y={40} width={440} height={40} rx={20} fill={C.line} />
    <rect x={220 - 440 * clamp(p)} y={40} width={440 * clamp(p)} height={40} rx={20} fill={C.green} />
  </G>
);

/** The one step that leaves the drawer: a card with a footprint arrow. */
export const Step: React.FC<P & { label: string }> = ({ label, ...g }) => (
  <G {...g}>
    <rect x={-270} y={-120} width={540} height={240} rx={36} fill={C.green} stroke={C.ink} strokeWidth={7} filter="url(#lift)" />
    <path d="M -230 0 L -165 -48 L -165 -22 L -115 -22 L -115 22 L -165 22 L -165 48 Z" fill={C.white} />
    <ArText x={70} y={4} size={58} color={C.white} weight={900}>{label}</ArText>
  </G>
);

/** A wall-calendar sheet (time passing: pages flip without dates). */
export const Sheet: React.FC<P & { mark: number }> = ({ mark, ...g }) => (
  <G {...g}>
    <rect x={-170} y={-190} width={340} height={380} rx={20} fill={C.paper} stroke={C.ink} strokeWidth={6} filter="url(#lift)" />
    <rect x={-170} y={-190} width={340} height={80} rx={20} fill={C.red} />
    <rect x={-170} y={-130} width={340} height={20} fill={C.red} />
    {Array.from({ length: 12 }).map((_, i) => (
      <circle key={i} cx={-105 + (i % 4) * 70} cy={-50 + Math.floor(i / 4) * 70} r={18} fill={i === mark ? C.ink : C.line} />
    ))}
  </G>
);

/** A green start triangle. */
export const Start: React.FC<P> = (g) => (
  <G {...g}>
    <circle r={70} fill={C.green} stroke={C.ink} strokeWidth={6} />
    <path d="M -22 -34 L 34 0 L -22 34 Z" fill={C.white} />
  </G>
);
