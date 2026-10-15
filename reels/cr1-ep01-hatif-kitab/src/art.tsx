import React from 'react';
import { BODY, TITLE } from './fonts';
import { C } from './theme';
import { mix, mixColor } from './time';

// The one set every version shares: a desk at night, a phone on it, a book in its drawer.
// Set coordinates are 1000×640. The desk top is drawn top-down in "plane" coordinates
// (x 0–700, y 0–260, back to front) and projected obliquely, so objects lying on it are
// plain rectangles that can be flipped or slid in plane space. No people, faces or hands:
// the story is told by the objects, the room and what is left behind.
export const SET = { w: 1000, h: 640 };
const OX = 241, OY = 320.8, SK = -0.35, SY = 0.42;
const DRAWER_LVL = 26; // the drawer's top sits this far below the desk top, in set pixels
const plane = (lvl = 0) => `matrix(1 0 ${SK} ${SY} ${OX} ${OY + lvl})`;
export const project = (x: number, y: number, lvl = 0): [number, number] => [OX + x + SK * y, OY + SY * y + lvl];
const NS = { vectorEffect: 'non-scaling-stroke' } as const;
const LINE = 5;

export type Target = 'phone' | 'drawer' | 'book' | 'door' | 'note' | 'clock' | 'desk';
export type SetState = {
  phoneLit?: number; // screen glow 0–1
  phoneBadge?: number; // notification on screen 0–1
  phoneFlip?: number; // 0 face up → 1 face down
  phoneBuzz?: number; // buzz arcs 0–1
  phoneAside?: number; // the phone moves to the desk's far corner to make room for the book
  phoneAway?: number; // 0 on the desk → 1 charging in the other room
  drawerOpen?: number; // 0–1
  bookGhost?: number; // dashed silhouette: the book is inside the closed drawer
  bookOut?: number; // 0 in the drawer → 1 lying on the desk where the phone was
  bookOpen?: number; // 0 closed → 1 open on the page
  bookmark?: number; // the ribbon on the page you stopped at
  bookGlow?: number; // the book is now the cue in the room
  bookFade?: number; // habituation: the book blends into the desk
  hours?: number; // clock (10 = ten o'clock; fractions move both hands)
  note?: number; // the wall note «اليوم أقرأ»
  noteSag?: number; // the note droops after the failed night
  noteCheck?: number; // the note gets a green tick at the end
  sights?: { to: 'phone' | 'drawer' | 'book'; o: number; blocked?: boolean; color: string }[];
  frame?: { o: number; color: string } | null; // the whole room = the environment
  path?: number; // dashed walk from the desk to the charger
  tracker?: { o: number; checks: number } | null; // seven boxes on a card beside the book
  ring?: { at: Target; o: number; color: string } | null;
  dim?: number; // set pushed back behind a diagram
};

const PHONE = { x: 205, y: 52, w: 92, h: 168 }; // plane coords, portrait, top toward the wall
const BOOK_DESK = { x: 160, y: 62, w: 250, h: 150 }; // the open book lands where the phone was
const BOOK_DRAWER = { x: 470, y: 205, w: 160, h: 112 }; // closed book in the drawer (y moves with the drawer)
const DRAWER = { x: 420, w: 250, pull: 150 };
export const SPOTS: Record<Target, [number, number, number]> = {
  phone: [...project(PHONE.x + PHONE.w / 2, PHONE.y + PHONE.h / 2), 92] as [number, number, number],
  drawer: [695, 498, 150],
  book: [...project(BOOK_DESK.x + BOOK_DESK.w / 2, BOOK_DESK.y + BOOK_DESK.h / 2), 160] as [number, number, number],
  door: [60, 260, 120],
  note: [545, 160, 150],
  clock: [800, 150, 85],
  desk: [500, 420, 380],
};
const EYE: [number, number] = [415, 588]; // where you sit: low, in front of the desk

/** Phone in plane coordinates. */
const Phone: React.FC<{ lit: number; badge: number; flip: number }> = ({ lit, badge, flip }) => {
  const cx = PHONE.x + PHONE.w / 2, cy = PHONE.y + PHONE.h / 2;
  const sx = Math.cos(flip * Math.PI);
  const back = sx < 0;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${Math.max(0.02, Math.abs(sx))} 1) translate(${-cx} ${-cy})`}>
      <rect x={PHONE.x} y={PHONE.y} width={PHONE.w} height={PHONE.h} rx={16} fill={C.ink} stroke={C.light} strokeWidth={LINE} {...NS} />
      {back ? (
        <circle cx={PHONE.x + 24} cy={PHONE.y + 26} r={9} fill="none" stroke={C.mist} strokeWidth={3} {...NS} />
      ) : (
        <>
          <rect x={PHONE.x + 9} y={PHONE.y + 12} width={PHONE.w - 18} height={PHONE.h - 24} rx={8} fill={mixColor(C.screenOff, C.glow, lit)} />
          {badge > 0.01 && (
            <g opacity={badge}>
              <rect x={PHONE.x + 16} y={PHONE.y + 30} width={PHONE.w - 32} height={26} rx={6} fill={C.light} stroke={C.mist} strokeWidth={2} {...NS} />
              <circle cx={PHONE.x + PHONE.w - 22} cy={PHONE.y + 43} r={9} fill={C.red} />
              <rect x={PHONE.x + 16} y={PHONE.y + 64} width={PHONE.w - 46} height={10} rx={5} fill={C.mist} opacity={0.7} />
            </g>
          )}
        </>
      )}
    </g>
  );
};

/** A closed book (cover up) at a plane rect. */
const ClosedBook: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={6} fill={C.lilac} stroke={C.light} strokeWidth={LINE} {...NS} />
    <rect x={x + w - 22} y={y} width={22} height={h} rx={4} fill={C.lilacDeep} />
    <rect x={x + 22} y={y + h * 0.3} width={w * 0.45} height={12} rx={6} fill={C.light} opacity={0.85} />
  </g>
);

/** An open book at a plane rect: two pages, a spine, lines of text as bars (no letters). */
const OpenBook: React.FC<{ x: number; y: number; w: number; h: number; fade: number; mark: number }> = ({ x, y, w, h, fade, mark }) => {
  const page = mixColor(C.light, C.deskTop, fade);
  const line = mixColor(C.mist, C.deskTop, fade);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={page} stroke={page} strokeWidth={LINE} {...NS} />
      <line x1={x + w / 2} y1={y + 6} x2={x + w / 2} y2={y + h - 6} stroke={line} strokeWidth={3} {...NS} />
      {[0, 1, 2, 3, 4].map((k) => (
        <g key={k}>
          <rect x={x + 18} y={y + 22 + k * 24} width={w / 2 - 36} height={8} rx={4} fill={line} />
          <rect x={x + w / 2 + 18} y={y + 22 + k * 24} width={w / 2 - 36 - (k === 4 ? 40 : 0)} height={8} rx={4} fill={line} />
        </g>
      ))}
      {mark > 0.01 && <path d={`M ${x + w * 0.72} ${y - 4} h 22 v ${18 + 44 * mark} l -11 -12 l -11 12 z`} fill={mixColor(C.lilacDeep, C.deskTop, fade)} />}
    </g>
  );
};

/** The desk set. Everything that changes between shots is a number in `s`. */
export const DeskSet: React.FC<{ s: SetState }> = ({ s }) => {
  const lit = s.phoneLit ?? 0, flip = s.phoneFlip ?? 0, away = s.phoneAway ?? 0;
  const open = s.drawerOpen ?? 0, out = s.bookOut ?? 0, fade = s.bookFade ?? 0;
  const pull = DRAWER.pull * open;
  const hours = s.hours ?? 10;
  const phoneDx = -190 * (s.phoneAside ?? 0) - 140 * away; // aside to the corner, then out through the doorway
  const phoneOnDesk = away < 0.98;
  const [pcx, pcy] = project(PHONE.x + PHONE.w / 2 + phoneDx, PHONE.y + PHONE.h / 2);
  const inDrawer = { x: BOOK_DRAWER.x, y: BOOK_DRAWER.y + pull };
  const land = { x: BOOK_DESK.x + 45, y: BOOK_DESK.y + 19 };
  const bx = mix(inDrawer.x, land.x, out), by = mix(inDrawer.y, land.y, out);
  const blvl = mix(DRAWER_LVL, 0, out) - 140 * Math.sin(Math.PI * out);
  const bookOpen = s.bookOpen ?? 0;
  const front = `translate(${SK * pull} ${SY * pull})`;
  const glowAt = (x: number, y: number, o: number, id: string) => o > 0.01 && <ellipse cx={x} cy={y - 150} rx={230} ry={170} fill={`url(#${id})`} opacity={o} />;
  const sightTo: Record<string, [number, number]> = { phone: [pcx, pcy - 10], drawer: [695, 470], book: [SPOTS.book[0], SPOTS.book[1] - 10] };
  return (
    <svg viewBox={`0 0 ${SET.w} ${SET.h}`} width={SET.w} height={SET.h} style={{ overflow: 'visible', position: 'absolute', left: 0, top: 0 }}>
      <defs>
        <radialGradient id="glow"><stop offset="0" stopColor={C.glow} stopOpacity={0.55} /><stop offset="1" stopColor={C.glow} stopOpacity={0} /></radialGradient>
        <radialGradient id="pageglow"><stop offset="0" stopColor={C.light} stopOpacity={0.4} /><stop offset="1" stopColor={C.light} stopOpacity={0} /></radialGradient>
        <clipPath id="drawerIn">
          <polygon points={[project(DRAWER.x, 260, DRAWER_LVL), project(DRAWER.x + DRAWER.w, 260, DRAWER_LVL), project(DRAWER.x + DRAWER.w, 260 + pull, DRAWER_LVL), project(DRAWER.x, 260 + pull, DRAWER_LVL)].map((p) => p.join(',')).join(' ')} />
        </clipPath>
        <clipPath id="doorway"><rect x={14} y={70} width={92} height={365} rx={6} /></clipPath>
      </defs>

      {/* wall: doorway to the other room (the charger lives there), window with the moon, clock */}
      <rect x={14} y={70} width={92} height={365} rx={6} fill={C.wallLow} stroke={C.mist} strokeWidth={4} />
      <line x1={18} y1={404} x2={102} y2={404} stroke={C.mist} strokeWidth={3} opacity={0.6} />
      <path d="M 106 72 L 140 90 L 140 452 L 106 434 Z" fill={C.desk} stroke={C.mist} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={130} cy={262} r={5} fill={C.mist} />
      {away > 0.6 && (
        <g clipPath="url(#doorway)" opacity={Math.min(1, (away - 0.6) / 0.3)}>
          <rect x={40} y={300} width={40} height={72} rx={8} fill={C.ink} stroke={C.mist} strokeWidth={3} />
          <rect x={46} y={308} width={28} height={50} rx={4} fill={C.screenOff} />
          <line x1={60} y1={372} x2={60} y2={420} stroke={C.mist} strokeWidth={3} />
          <circle cx={60} cy={392} r={6} fill={C.green} />
        </g>
      )}
      <g>
        <rect x={160} y={80} width={190} height={170} rx={10} fill={C.wallLow} stroke={C.mist} strokeWidth={LINE} />
        <line x1={255} y1={80} x2={255} y2={250} stroke={C.mist} strokeWidth={3} />
        <line x1={160} y1={165} x2={350} y2={165} stroke={C.mist} strokeWidth={3} />
        <path d="M 312 104 a 26 26 0 1 0 14 46 a 20 20 0 1 1 -14 -46 z" fill={C.lilac} />
      </g>
      <g transform="translate(800 150)">
        <circle r={60} fill={C.wallLow} stroke={C.light} strokeWidth={LINE} />
        {[0, 1, 2, 3].map((k) => <circle key={k} cx={46 * Math.sin((k * Math.PI) / 2)} cy={-46 * Math.cos((k * Math.PI) / 2)} r={4} fill={C.mist} />)}
        <line x1={0} y1={0} x2={30 * Math.sin(((hours % 12) * Math.PI) / 6)} y2={-30 * Math.cos(((hours % 12) * Math.PI) / 6)} stroke={C.light} strokeWidth={7} strokeLinecap="round" />
        <line x1={0} y1={0} x2={44 * Math.sin((hours % 1) * 2 * Math.PI)} y2={-44 * Math.cos((hours % 1) * 2 * Math.PI)} stroke={C.lilac} strokeWidth={5} strokeLinecap="round" />
        <circle r={6} fill={C.light} />
      </g>

      {/* light on the wall: whichever object is the visible cue */}
      {glowAt(pcx, pcy, lit * (1 - flip) * (1 - away), 'glow')}
      {out >= 1 && glowAt(SPOTS.book[0], SPOTS.book[1], (s.bookGlow ?? 0) * (1 - fade), 'pageglow')}

      <line x1={40} y1={622} x2={960} y2={622} stroke={C.mist} strokeWidth={3} opacity={0.5} />
      {/* desk top and what lies on it */}
      <g transform={plane()}>
        <rect x={0} y={0} width={700} height={260} rx={6} fill={C.deskTop} stroke={C.light} strokeWidth={LINE} {...NS} />
        {out >= 1 && (
          <g>
            <rect x={BOOK_DESK.x + 10} y={BOOK_DESK.y + 12} width={BOOK_DESK.w} height={BOOK_DESK.h} rx={8} fill={C.deskEdge} opacity={0.5 * (1 - fade)} />
            {bookOpen < 1 && <g opacity={1 - bookOpen}><ClosedBook x={land.x} y={land.y} w={BOOK_DRAWER.w} h={BOOK_DRAWER.h} /></g>}
            {bookOpen > 0 && <g opacity={bookOpen}><OpenBook {...BOOK_DESK} fade={fade} mark={s.bookmark ?? 0} /></g>}
          </g>
        )}
        {s.tracker && s.tracker.o > 0.01 && (
          <g opacity={s.tracker.o}>
            <rect x={420} y={95} width={150} height={120} rx={8} fill={C.light} stroke={C.mist} strokeWidth={3} {...NS} />
            {Array.from({ length: 7 }, (_, k) => {
              const x = 434 + (k % 4) * 33, y = 112 + Math.floor(k / 4) * 48;
              return (
                <g key={k}>
                  <rect x={x} y={y} width={24} height={34} rx={4} fill="none" stroke={C.mist} strokeWidth={3} {...NS} />
                  {k < (s.tracker?.checks ?? 0) && <path d={`M ${x + 4} ${y + 18} l 6 8 l 11 -18`} fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" {...NS} />}
                </g>
              );
            })}
          </g>
        )}
        {phoneOnDesk && (
          <g transform={`translate(${phoneDx} 0)`} opacity={away > 0.75 ? Math.max(0, (0.98 - away) / 0.23) : 1}>
            <rect x={PHONE.x + 8} y={PHONE.y + 10} width={PHONE.w} height={PHONE.h} rx={16} fill={C.deskEdge} opacity={0.6} />
            <Phone lit={lit} badge={s.phoneBadge ?? 0} flip={flip} />
          </g>
        )}
      </g>
      {/* desk front: slab, leg, drawer unit */}
      <rect x={150} y={430} width={700} height={20} rx={4} fill={C.deskEdge} stroke={C.light} strokeWidth={LINE} />
      <rect x={172} y={450} width={34} height={172} rx={4} fill={C.desk} stroke={C.light} strokeWidth={LINE} />
      <rect x={560} y={450} width={270} height={172} rx={6} fill={C.desk} stroke={C.light} strokeWidth={LINE} />
      <rect x={570} y={556} width={250} height={58} rx={6} fill={C.drawer} stroke={C.light} strokeWidth={4} />
      <rect x={665} y={578} width={60} height={10} rx={5} fill={C.light} />

      {/* open drawer: its inside (seen from above) holds the book; the front comes toward us */}
      {open > 0.001 && (
        <g>
          <g transform={plane(DRAWER_LVL)}>
            <rect x={DRAWER.x} y={260} width={DRAWER.w} height={pull} fill={C.ink} stroke={C.light} strokeWidth={4} {...NS} />
          </g>
          {out <= 0 && (
            <g clipPath="url(#drawerIn)">
              <g transform={plane(blvl)}><ClosedBook x={bx} y={by} w={BOOK_DRAWER.w} h={BOOK_DRAWER.h} /></g>
            </g>
          )}
        </g>
      )}
      <g transform={front}>
        <rect x={570} y={456} width={250} height={86} rx={6} fill={C.drawerFront} stroke={C.light} strokeWidth={LINE} />
        <rect x={660} y={490} width={70} height={12} rx={6} fill={C.light} opacity={1 - 0.85 * (s.bookGhost ?? 0) * (out <= 0 ? 1 : 0)} />
        {(s.bookGhost ?? 0) > 0.01 && open < 0.05 && out <= 0 && (
          <g opacity={s.bookGhost} stroke={C.lilac} strokeWidth={5} fill="none" strokeLinejoin="round">
            <rect x={604} y={470} width={182} height={58} rx={6} strokeDasharray="14 9" />
            <line x1={760} y1={470} x2={760} y2={528} strokeDasharray="8 7" />
            <rect x={622} y={490} width={84} height={12} rx={6} fill={C.lilac} stroke="none" opacity={0.7} />
          </g>
        )}
      </g>

      {(s.phoneBuzz ?? 0) > 0.01 && (
        <g opacity={s.phoneBuzz} stroke={C.red} strokeWidth={5} fill="none" strokeLinecap="round">
          {[1, -1].map((side) => (
            <g key={side}>
              <path d={`M ${pcx + side * 62} ${pcy - 24} q ${side * 16} 24 0 48`} />
              <path d={`M ${pcx + side * 80} ${pcy - 36} q ${side * 24} 36 0 72`} />
            </g>
          ))}
        </g>
      )}
      {/* the book in the air, above everything */}
      {out > 0 && out < 1 && <g transform={plane(blvl)}><ClosedBook x={bx} y={by} w={BOOK_DRAWER.w} h={BOOK_DRAWER.h} /></g>}

      {/* the walk the phone now costs you */}
      {(s.path ?? 0) > 0.01 && (
        <g opacity={Math.min(1, (s.path ?? 0) * 2)}>
          <path d="M 240 452 C 240 560, 160 600, 70 600 L 70 445" fill="none" stroke={C.green} strokeWidth={5} strokeDasharray="12 12" />
          <path d="M 58 462 l 12 -18 l 12 18" fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" />
        </g>
      )}

      {/* what the eye meets first */}
      {(s.sights ?? []).some((v) => v.o > 0.01) && (
        <g>
          {(s.sights ?? []).map((v, k) => {
            const [tx, ty] = sightTo[v.to];
            const ex = v.blocked ? mix(EYE[0], tx, 0.86) : tx, ey = v.blocked ? mix(EYE[1], ty, 0.86) : ty;
            // the line grows from the eye toward its target
            const gx = mix(EYE[0], ex, Math.min(1, v.o * 1.4)), gy = mix(EYE[1], ey, Math.min(1, v.o * 1.4));
            return (
              <g key={k} opacity={Math.min(1, v.o * 2)}>
                <line x1={EYE[0]} y1={EYE[1]} x2={gx} y2={gy} stroke={v.color} strokeWidth={5} strokeDasharray={v.blocked ? '10 10' : undefined} strokeLinecap="round" />
                {v.o > 0.7 && v.blocked && <path d={`M ${ex - 14} ${ey - 14} l 28 28 M ${ex + 14} ${ey - 14} l -28 28`} stroke={C.red} strokeWidth={6} strokeLinecap="round" />}
                {v.o > 0.7 && !v.blocked && <circle cx={ex} cy={ey} r={10} fill={v.color} />}
              </g>
            );
          })}
          <g transform={`translate(${EYE[0]} ${EYE[1]})`} opacity={Math.min(1, Math.max(...(s.sights ?? []).map((v) => v.o)) * 2)}>
            <path d="M -38 0 C -20 -24, 20 -24, 38 0 C 20 24, -20 24, -38 0 z" fill={C.night} stroke={C.light} strokeWidth={5} />
            <circle r={10} fill={C.light} />
          </g>
        </g>
      )}
      {s.frame && s.frame.o > 0.01 && (
        <rect x={6} y={54} width={988} height={584} rx={26} fill="none" stroke={s.frame.color} strokeWidth={6} strokeDasharray="22 14" opacity={s.frame.o} />
      )}
      {s.ring && s.ring.o > 0.01 && (() => {
        const [x, y, r] = s.ring.at === 'phone' ? [pcx, pcy, 92] : SPOTS[s.ring.at];
        const k = mix(1.12, 1, s.ring.o);
        if (s.ring.at === 'desk') return <ellipse cx={545} cy={378} rx={420 * k} ry={92 * k} fill="none" stroke={s.ring.color} strokeWidth={6} opacity={s.ring.o} />;
        return <circle cx={x} cy={y} r={r * k} fill="none" stroke={s.ring.color} strokeWidth={6} opacity={s.ring.o} />;
      })()}
    </svg>
  );
};

/** The note on the wall: the intention, written once and left in plain sight. */
const WallNote: React.FC<{ o: number; sag: number; check: number }> = ({ o, sag, check }) => (
  <div dir="rtl" lang="ar" style={{
    position: 'absolute', left: 415, top: 92, minWidth: 260, height: 112, padding: '0 26px', boxSizing: 'border-box', whiteSpace: 'nowrap', background: C.light, borderRadius: 10,
    boxShadow: '0 10px 24px rgba(0,0,0,0.35)', opacity: o, transformOrigin: '50% 0%',
    transform: `rotate(${mix(-2, -9, sag)}deg) translateY(${mix(14, 0, o)}px)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
    fontFamily: TITLE, fontWeight: 800, fontSize: 50, color: C.night,
  }}>
    <span>اليوم أقرأ</span>
    {check > 0.01 && (
      <div style={{ position: 'absolute', left: -26, top: -26, width: 60, height: 60, borderRadius: 30, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: check, transform: `scale(${mix(0.6, 1, check)})`, boxShadow: '0 6px 16px rgba(0,0,0,0.35)' }}>
        <svg width={40} height={40} viewBox="0 0 24 24"><path d="M4 12.5 l5 5 l11 -11" fill="none" stroke={C.light} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    )}
  </div>
);

/** The set placed on a canvas: `w` is its width in canvas px, (x, y) its top-left corner.
 *  Children are drawn in set coordinates on top of it. */
export const PlacedSet: React.FC<{ s: SetState; x: number; y: number; w: number; opacity?: number; children?: React.ReactNode }> = ({ s, x, y, w, opacity = 1, children }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: SET.w, height: SET.h, transform: `scale(${w / SET.w})`, transformOrigin: '0 0', opacity: opacity * (1 - (s.dim ?? 0) * 0.88) }}>
    <DeskSet s={s} />
    {(s.note ?? 0) > 0.01 && <WallNote o={s.note ?? 0} sag={s.noteSag ?? 0} check={s.noteCheck ?? 0} />}
    {children}
  </div>
);
/** Where a set point lands on the canvas for a given placement. */
export const onCanvas = (pt: [number, number] | [number, number, number], at: { x: number; y: number; w: number }): [number, number] =>
  [at.x + (pt[0] * at.w) / SET.w, at.y + (pt[1] * at.w) / SET.w];

// Small line icons (24-unit grid, thick strokes).
export type IconKind = 'weight' | 'battery' | 'hourglass' | 'eye' | 'lock' | 'check' | 'spark' | 'open' | 'question' | 'door';
export const Icon: React.FC<{ kind: IconKind; size: number; color: string }> = ({ kind, size, color }) => {
  const p = { stroke: color, strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ flex: 'none' }}>
      {kind === 'weight' && <><path d="M8 8 a4 4 0 1 1 8 0" {...p} /><path d="M5 9 h14 l2 11 H3 z" {...p} /></>}
      {kind === 'battery' && <><rect x={2} y={7} width={18} height={10} rx={2} {...p} /><path d="M22 10 v4" {...p} /><rect x={4.5} y={9.5} width={3.5} height={5} rx={0.6} fill={color} stroke="none" /></>}
      {kind === 'hourglass' && <path d="M6 3 h12 M6 21 h12 M7 3 c0 6 10 6 10 9 s-10 3 -10 9 M17 3 c0 6 -10 6 -10 9 s10 3 10 9" {...p} />}
      {kind === 'eye' && <><path d="M2 12 s4 -7 10 -7 s10 7 10 7 s-4 7 -10 7 s-10 -7 -10 -7 z" {...p} /><circle cx={12} cy={12} r={3} {...p} /></>}
      {kind === 'lock' && <><rect x={5} y={11} width={14} height={10} rx={2} {...p} /><path d="M8 11 V8 a4 4 0 0 1 8 0 v3" {...p} /></>}
      {kind === 'check' && <path d="M4 12.5 l5 5 l11 -11" {...p} strokeWidth={3} />}
      {kind === 'spark' && <path d="M12 3 v4 M12 17 v4 M3 12 h4 M17 12 h4 M5.6 5.6 l2.8 2.8 M15.6 15.6 l2.8 2.8 M18.4 5.6 l-2.8 2.8 M8.4 15.6 l-2.8 2.8" {...p} />}
      {kind === 'open' && <><rect x={7} y={2.5} width={10} height={19} rx={2.2} {...p} /><path d="M10 8.5 l2.5 2.5 l-2.5 2.5 M12.5 11 H4" {...p} /></>}
      {kind === 'question' && <><path d="M9 9 a3 3 0 1 1 4.5 2.6 c-1 .6 -1.5 1.2 -1.5 2.4" {...p} /><circle cx={12} cy={18} r={0.9} fill={color} stroke="none" /><circle cx={12} cy={12} r={10} {...p} /></>}
      {kind === 'door' && <><path d="M5 21 V3 h10 v18" {...p} /><path d="M15 3 l4 2 v16 l-4 0" {...p} /><circle cx={12} cy={12} r={0.9} fill={color} stroke="none" /></>}
    </svg>
  );
};

/** A label chip with an icon, laid out right to left. */
export const Chip: React.FC<{ text: string; icon?: IconKind; color: string; size: number; o: number; strike?: number; solid?: boolean; style?: React.CSSProperties }> = ({ text, icon, color, size, o, strike = 0, solid = false, style }) => (
  <div dir="rtl" lang="ar" style={{
    display: 'inline-flex', alignItems: 'center', gap: size * 0.35, whiteSpace: 'nowrap', position: 'relative',
    fontFamily: BODY, fontWeight: 700, fontSize: size, lineHeight: 1.35, color: solid ? C.light : C.light,
    background: solid ? color : 'rgba(16,24,39,0.92)', border: `${Math.max(3, size * 0.06)}px solid ${color}`,
    padding: `${size * 0.12}em ${size * 0.012}em`, paddingInline: size * 0.55, paddingBlock: size * 0.14, borderRadius: 999,
    opacity: o, transform: `scale(${mix(0.86, 1, o)})`, ...style,
  }}>
    {icon && <Icon kind={icon} size={size * 1.05} color={solid ? C.light : color} />}
    <span>{text}</span>
    {strike > 0.01 && <div style={{ position: 'absolute', insetInlineStart: size * 0.3, top: '52%', height: Math.max(4, size * 0.09), width: `calc(${strike * 100}% - ${size * 0.6}px)`, background: C.red, borderRadius: 4 }} />}
  </div>
);

/** «البيئة» outweighs «الحماس»: a beam that tips as the sentence lands. 452×330 at scale 1. */
export const Seesaw: React.FC<{ o: number; tip: number; x: number; y: number; scale: number }> = ({ o, tip, x, y, scale }) => {
  if (o < 0.01) return null;
  const ang = mix(0, 14, tip); // the right-hand side (البيئة) goes down
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 452, height: 330, opacity: o, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
      <svg width={452} height={330} viewBox="0 0 452 330" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path d="M 226 230 L 196 300 L 256 300 Z" fill={C.blue} />
        <g transform={`rotate(${ang} 226 230)`}>
          <rect x={20} y={222} width={412} height={14} rx={7} fill={C.light} />
          <rect x={300} y={92} width={124} height={130} rx={14} fill={C.blue} />
          <rect x={40} y={166} width={70} height={56} rx={10} fill={C.mist} />
        </g>
      </svg>
      <div dir="rtl" lang="ar" style={{ position: 'absolute', inset: 0, transform: `rotate(${ang}deg)`, transformOrigin: '226px 230px', fontFamily: BODY, fontWeight: 700, fontSize: 48, color: C.light }}>
        <span style={{ position: 'absolute', left: 280, width: 164, top: 18, textAlign: 'center', transform: 'translateY(-46px)' }}>البيئة</span>
        <span style={{ position: 'absolute', left: 0, width: 150, top: 96, textAlign: 'center', transform: 'translateY(-18px)' }}>الحماس</span>
      </div>
    </div>
  );
};
