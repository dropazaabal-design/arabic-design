import React from 'react';
import { BODY, TITLE } from '../fonts';
import { CAST } from '../kit/characters/cast';
import { EXPRESSIONS, type Face } from '../kit/characters/face';
import { Hand } from '../kit/characters/hands';
import { POSES } from '../kit/characters/poses';
import { joints, mixPose, pose, walkPhase, type Pose } from '../kit/characters/skeleton';
import { Bedroom, BEDROOM } from '../kit/places/Bedroom';
import { MEETING } from '../kit/places/MeetingRoom';
import { Street } from '../kit/places/Street';
import { Boat, Lake, LAKE } from '../kit/metaphors/Lake';
import { Calendar, IconClock, IconPause, IconShield, LockScreen, Notebook, NotificationBanner, Phone, SpeechBubble } from '../kit/props';
import { Avatar, StatusBar, UI } from '../kit/props/ui';
import { INK, PAL, sketch } from '../kit/style';
import { Actor, Cap, CAM0, Paper, Say, Stage, Tag, ease, faceAt, k, mix, poseAt, toScreen, type Cam, type Ctx } from '../film/engine';
import type { ShotRender } from '../film/Film';
import { Arrow, ChestSwirl, Floor, MEET_FEET, MEET_S, Meeting, SEAT, WLabel, atTable, cam, nod, shake, walkTo, type SeatSpec } from './common';

// Chapter 11's end (the reply, the block, the fence) and chapter 12 «خطوة اليوم»: back to the meeting a week later,
// the lake once more, the five-part step, and the film's last image. Shots 141–160.
const STAND = MEETING.standAt;
const face = (base: keyof typeof EXPRESSIONS, o: Partial<Face>): Face => ({ ...EXPRESSIONS[base], ...o });
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const SKIN = CAST.salim.skin;

/** World point of a character's wrist (for things attached to a held prop). */
const wristAt = (p: Pose, x: number, y: number, s: number, facing: 1 | -1, side: 'R' | 'L'): [number, number] => {
  const w = (side === 'R' ? joints(p).armR : joints(p).armL).wrist;
  return [x + w[0] * s * facing, y + w[1] * s];
};
/** Turn a hand so its fingers point at `deg` (−90 = straight up), whatever the forearm does. */
const aim = (p: Pose, side: 'R' | 'L', deg = -90): Pose => {
  const a = side === 'R' ? joints(p).armR : joints(p).armL;
  const ang = (Math.atan2(a.wrist[1] - a.elbow[1], a.wrist[0] - a.elbow[0]) * 180) / Math.PI;
  return { ...p, [side]: { ...p[side], wrist: deg - ang } };
};

// ——— the meeting, a week later (the same seats as shot 1) ———
const TEAM = ['mona', 'att1', 'hadi', 'att2', 'jaser'] as const;
const jaserSeat = (o: Partial<Pose> = {}) => atTable({ lean: -6, head: -4, turn: 0.45, ...o });
const jaserFinger = pose({ sit: 1, lean: -11, head: -8, turn: 0.6, footR: [50, 0], footL: [62, 0], R: { hand: [58, -156] }, L: { hand: [96, -262] } });
const team = (o: { head?: number[]; turn?: number[]; faces?: SeatSpec['face'][] } = {}): (SeatSpec | null)[] =>
  [...TEAM.map((w, i): SeatSpec => ({
    who: w,
    p: w === 'jaser' ? jaserSeat({ head: -4 + (o.head?.[i] ?? 0) }) : atTable({ head: o.head?.[i] ?? 0, turn: o.turn?.[i] ?? 0.45 }),
    face: o.faces?.[i] ?? (w === 'jaser' ? 'smug' : 'listening'),
    hands: w === 'jaser' ? { R: 'relaxed', L: 'relaxed' } : undefined,
  })), null];
const pointBoard = { p: pose({ lean: -3, head: -12, turn: 0.85, L: { hand: [104, -318] }, R: { hand: [36, -150] } }), hands: { R: 'relaxed' as const, L: 'point' as const } };
const midGesture = { p: pose({ lean: 3, head: 2, turn: 0.4, R: { hand: [62, -186] }, L: { hand: [70, -172] } }), hands: { R: 'open' as const, L: 'cup' as const } };

/** The pen squeezed across a fist (hand units), bent by `bend` 0..1 — the old habit from shot 6. */
const BentPen: React.FC<{ bend: number }> = ({ bend }) => {
  const d = `M-30 0 Q0 ${bend * 9} 30 0`;
  return <g>
    <path d={d} stroke={INK} strokeWidth={8.4} fill="none" strokeLinecap="round" />
    <path d={d} stroke={PAL.focus} strokeWidth={5.4} fill="none" strokeLinecap="round" />
    <path d="M30 -2.2 L35 0 L30 2.2 Z" fill={INK} />
    <path d="M-30 -3 L-36 -3 L-36 3 L-30 3" fill={PAL.metal} stroke={INK} strokeWidth={1.4} />
  </g>;
};

// ——— the phone: one post, its comments, a reply field (authored at 360×720 like the kit's screens, bigger type) ———
type Cm = { name: string; text: string; kind: 'friend' | 'hostile' | 'mine'; o?: number; gone?: number; collapse?: number; check?: number; glow?: number };
const POST = { author: 'سليم', text: 'تعلمت هذا الأسبوع أن الهدوء لا يعني الكبت' };
const ANON = 'مجهول';
const HOSTILE = 'كلام فاضي… مين سألك أصلًا؟';
const REPLY = 'شكرًا لرأيك، أحترم الاختلاف.';
const svgIcon = (d: string, color: string, size = 22, sw = 2) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: 'none' }}><path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const BLOCK = 'M12 3 a9 9 0 1 0 0.01 0 Z M5.6 5.6 L18.4 18.4';
const FLAG = 'M5 21 V4 M5 4 h11 l-2 4 l2 4 h-11';
const SEND = 'M20 12 L4 4 L7 12 L4 20 Z';

const Thread: React.FC<{ comments: Cm[]; typed?: number; send?: number; menuOn?: number; menu?: number; press?: number; scroll?: number; time?: string }> = ({ comments, typed = 0, send = 0, menuOn = -1, menu = 0, press = 0, scroll = 0, time = '22:40' }) => {
  const c = UI.day;
  const card: React.CSSProperties = { background: '#FFFFFF', border: `2px solid ${INK}`, borderRadius: 16, boxSizing: 'border-box' };
  return <g>
    <rect width={360} height={720} fill={c.bg} />
    <foreignObject width={360} height={720}>
      <div dir="rtl" lang="ar" style={{ width: 360, height: 720, display: 'flex', flexDirection: 'column', fontFamily: BODY, fontWeight: 600, color: c.text }}>
        <div style={{ background: c.bar, borderBottom: `1.5px solid ${c.line}`, flex: 'none' }}>
          <StatusBar time={time} color={c.text} />
          <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 21, fontWeight: 700 }}>منشور</div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 10 - scroll, padding: '0 10px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ ...card, padding: '10px 14px 8px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={POST.author} size={40} />
                <span style={{ fontSize: 18, fontWeight: 700 }}>{POST.author}</span>
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.55, marginTop: 6 }}>{POST.text}</div>
            </div>
            <span style={{ fontSize: 15, color: c.soft, padding: '0 6px 6px' }}>التعليقات</span>
            {comments.map((m, i) => {
              const o = clamp(m.o ?? 1), gone = clamp(m.gone ?? 0), col = clamp(m.collapse ?? 0), mine = m.kind === 'mine';
              if (o <= 0 || col >= 1) return null;
              const tight = o < 1 || col > 0;
              const showMenu = i === menuOn && menu > 0;
              return <div key={i} style={{ position: 'relative', zIndex: showMenu ? 3 : 1, marginRight: mine ? 40 : 0, marginBottom: 10 * (1 - col) * o, maxHeight: tight ? 140 * Math.min(1, o * 1.4) * (1 - col) : undefined, overflow: tight ? 'hidden' : 'visible', opacity: Math.min(1, o * 1.6) * (1 - col), transform: `translateY(${(1 - o) * -14}px)` }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', opacity: 1 - gone }}>
                  <Avatar name={m.name} size={mine ? 32 : 36} />
                  <div style={{ ...card, flex: 1, padding: '6px 12px 9px', borderRadius: 14, borderTopRightRadius: 4, background: mine ? c.mine : m.kind === 'hostile' && showMenu ? PAL.provokeLight : '#FFFFFF', boxShadow: m.glow ? `0 0 0 ${2 + 7 * m.glow}px rgba(62,142,126,${0.35 * m.glow})` : 'none' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: mine ? PAL.calm : c.soft, lineHeight: 1.5 }}>{m.name}</div>
                    <div style={{ fontSize: 21, lineHeight: 1.45 }}>{m.text}</div>
                  </div>
                  <svg width={22} height={6} viewBox="0 0 20 6" style={{ flex: 'none', marginTop: 16 }}>{[3, 10, 17].map((x) => <circle key={x} cx={x} cy={3} r={2.4} fill={c.soft} />)}</svg>
                </div>
                {gone > 0 && <div style={{ position: 'absolute', inset: 0, opacity: gone, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, border: `2px dashed ${c.soft}`, background: c.bg, color: c.soft, fontSize: 20, fontWeight: 700 }}>
                  {svgIcon(BLOCK, c.soft)}<span>تم الحظر</span>
                  {(m.check ?? 0) > 0 && <svg width={30} height={30} viewBox="-20 -20 40 40" style={{ marginRight: 6, transform: `scale(${0.4 + 0.6 * clamp(m.check ?? 0)})`, opacity: clamp(m.check ?? 0) }}><circle r={17} fill={PAL.calm} stroke={INK} strokeWidth={2.4} /><path d="M-8 0 L-2 6 L9 -6" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>}
                {showMenu && <div style={{ position: 'absolute', left: 4, top: 'calc(100% - 8px)', opacity: menu, transform: `scale(${0.6 + 0.4 * menu})`, transformOrigin: 'left top', ...card, borderRadius: 14, width: 158, padding: '4px 0', display: 'flex', flexDirection: 'column', boxShadow: '0 6px 0 rgba(42,47,58,0.15)' }}>
                  {([['حظر', BLOCK, PAL.provoke], ['إبلاغ', FLAG, c.text]] as const).map(([label, d, col2], j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', fontSize: 22, fontWeight: 700, color: col2, borderTop: j ? `1.5px solid ${c.line}` : 'none', background: j === 0 && press > 0 ? `rgba(233,198,201,${press})` : 'transparent', position: 'relative' }}>
                      {svgIcon(d, col2)}<span>{label}</span>
                      {j === 0 && press > 0 && <div style={{ position: 'absolute', left: 60, top: 22, width: 70, height: 70, marginLeft: -35, marginTop: -35, borderRadius: 99, border: `3px solid ${PAL.provoke}`, opacity: 1 - press, transform: `scale(${0.3 + press})` }} />}
                    </div>
                  ))}
                </div>}
              </div>;
            })}
          </div>
        </div>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px 16px', borderTop: `1.5px solid ${c.line}`, background: c.bar }}>
          <div style={{ flex: 1, height: 46, borderRadius: 23, border: `2px solid ${INK}`, boxSizing: 'border-box', background: '#FFFFFF', display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 18, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {typed > 0
              ? <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ visibility: 'hidden' }}>{REPLY}</span>
                <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${typed * 100}%`, overflow: 'hidden' }}><span style={{ position: 'absolute', right: 0, top: 0 }}>{REPLY}</span></span>
                <span style={{ position: 'absolute', right: `${typed * 100}%`, top: 4, bottom: 4, width: 2, background: PAL.calm }} />
              </span>
              : <span style={{ color: c.soft }}>اكتب ردًا…</span>}
          </div>
          <div style={{ position: 'relative', width: 46, height: 46, flex: 'none', borderRadius: 23, background: typed > 0.98 || send > 0 ? PAL.calm : c.line, border: `2px solid ${INK}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - 0.18 * Math.sin(Math.PI * clamp(send))})` }}>
            <svg width={24} height={24} viewBox="0 0 24 24" style={{ transform: 'scaleX(-1)' }}><path d={SEND} fill="#FFFFFF" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" /></svg>
            {send > 0 && send < 1 && <div style={{ position: 'absolute', left: 23, top: 23, width: 80, height: 80, marginLeft: -40, marginTop: -40, borderRadius: 99, border: `3px solid ${PAL.calm}`, opacity: 1 - send, transform: `scale(${0.3 + send})` }} />}
          </div>
        </div>
      </div>
    </foreignObject>
  </g>;
};

/** The phone filling the frame: w 520, centred; `scr` maps a screen point (360×720 units) to the world. */
const PH = { x: 960, y: 540, w: 520 };
const PSW = PH.w * 0.87, PK = PSW / 360;
const scr = (sx: number, sy: number): [number, number] => [PH.x - PSW / 2 + sx * PK, PH.y - PSW + sy * PK];
const PhoneShot: React.FC<{ cm: Cam; screen: React.ReactNode; buzz?: number; t: number; over?: React.ReactNode }> = ({ cm, screen, buzz = 0, t, over }) => (
  <Stage cam={cm} bg={PAL.wallNight} over={over}>
    <rect x={-400} y={-400} width={2720} height={1880} fill={PAL.wallNight} />
    <ellipse cx={PH.x} cy={PH.y} rx={520} ry={600} fill={PAL.screenGlow} opacity={0.08} />
    <g transform={`translate(${PH.x} ${PH.y})`}><Phone w={PH.w} glow={0.5} screen={screen} buzz={buzz} t={t} /></g>
  </Stage>
);
/** Animate a screen node: scale about a point (an app opening from or closing into it). */
const zoomAbout = (node: React.ReactNode, s: number, at: [number, number], o: number) => o <= 0 ? null : (
  <g opacity={o} transform={`translate(${at[0]} ${at[1]}) scale(${s}) translate(${-at[0]} ${-at[1]})`}>{node}</g>
);
const camK = (f: number, keys: [number, number, number, number][]): Cam => {
  const pick = (i: 1 | 2 | 3) => k(f, keys.map((q) => [q[0], q[i]] as [number, number]));
  return cam(pick(1), pick(2), pick(3));
};

// ——— small drawings for the metaphors and the step ———
/** A watering can in hand units (the grip holds the handle at 0,0); `tilt` pours; water falls from the rose. */
const WateringCan: React.FC<{ tilt: number; pour: number; t: number }> = ({ tilt, pour, t }) => {
  const a = (tilt * Math.PI) / 180, tip: [number, number] = [56 * Math.cos(a) - 2 * Math.sin(a), 56 * Math.sin(a) + 2 * Math.cos(a)];
  return <g>
    <g transform={`rotate(${tilt})`}>
      <path d="M-14 10 Q-14 -6 0 -6 Q14 -6 14 10" fill="none" stroke={INK} strokeWidth={6.5} strokeLinecap="round" />
      <path d="M-14 10 Q-14 -6 0 -6 Q14 -6 14 10" fill="none" stroke={PAL.focus} strokeWidth={3.2} strokeLinecap="round" />
      <path d="M18 30 L50 6" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d="M18 30 L50 6" stroke={PAL.focus} strokeWidth={4.4} strokeLinecap="round" />
      <ellipse cx={55} cy={2} rx={4} ry={7} transform="rotate(-37 55 2)" fill={PAL.focusLight} stroke={INK} strokeWidth={1.6} />
      <path d={sketch([[-24, 8], [24, 8], [22, 42], [-22, 42]], 7, 0.6, true)} fill={PAL.focus} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M-18 16 H18" stroke="#FFFFFF" strokeWidth={2} opacity={0.4} />
    </g>
    {pour > 0 && Array.from({ length: 7 }, (_, i) => {
      const u = (t * 1.5 + i / 7) % 1;
      return <ellipse key={i} cx={tip[0] + 3 + u * 10 + (i % 3) * 3} cy={tip[1] + 4 + u * 64} rx={1.6} ry={3.2} fill={PAL.water} stroke={INK} strokeWidth={0.6} opacity={pour * (1 - u * 0.6)} />;
    })}
  </g>;
};

/** A low picket fence on an ellipse (back half or front half), pickets `h` tall; `glow` outlines it in calm green. */
const Fence: React.FC<{ cx: number; cy: number; rx: number; ry: number; half: 'back' | 'front'; h: number; glow: number }> = ({ cx, cy, rx, ry, half, h, glow }) => {
  const n = 26;
  const pts = Array.from({ length: n }, (_, i) => (i / n) * Math.PI * 2).filter((a) => (half === 'front' ? Math.sin(a) >= 0 : Math.sin(a) < 0));
  const P = (a: number, up: number): [number, number] => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry - up * (0.85 + 0.15 * Math.sin(a))];
  const rail = (up: number) => {
    const as = Array.from({ length: 41 }, (_, i) => (half === 'front' ? 0 : Math.PI) + (i / 40) * Math.PI);
    return `M${as.map((a) => P(a, up).map((v) => v.toFixed(1)).join(' ')).join(' L')}`;
  };
  return <g>
    {[0.35, 0.75].map((r) => <g key={r}>
      {glow > 0 && <path d={rail(h * r)} fill="none" stroke={PAL.calm} strokeWidth={18} opacity={glow * 0.4} strokeLinecap="round" />}
      <path d={rail(h * r)} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d={rail(h * r)} fill="none" stroke="#FBFAF7" strokeWidth={4.5} strokeLinecap="round" />
    </g>)}
    {pts.map((a, i) => {
      const [x, y] = P(a, 0), top = h * (0.85 + 0.15 * Math.sin(a)), w = 13 + 4 * Math.sin(a);
      const d = `M${x - w / 2} ${y} L${x - w / 2} ${y - top + 8} L${x} ${y - top} L${x + w / 2} ${y - top + 8} L${x + w / 2} ${y} Z`;
      return <g key={i}>
        {glow > 0 && <path d={d} fill="none" stroke={PAL.calm} strokeWidth={12} opacity={glow * 0.4} strokeLinejoin="round" />}
        <path d={d} fill="#FBFAF7" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </g>;
    })}
  </g>;
};

/** A battery standing on the soil: `fill` 0..1 charges it in calm green. Origin at its base centre. */
const Battery: React.FC<{ fill: number; s?: number }> = ({ fill, s = 1 }) => (
  <g transform={`scale(${s})`}>
    <rect x={-16} y={-168} width={32} height={14} rx={4} fill={PAL.metal} stroke={INK} strokeWidth={3} />
    <rect x={-42} y={-156} width={84} height={156} rx={14} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
    <rect x={-32} y={-10 - 136 * fill} width={64} height={136 * fill} rx={7} fill={PAL.calm} />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M-32 ${-44 - i * 34} H32`} stroke="#FFFFFF" strokeWidth={3} opacity={fill > (i + 1) * 0.24 ? 0.5 : 0} />)}
    <path d="M6 -112 L-10 -76 L4 -76 L-6 -42 L14 -84 L0 -84 Z" fill="#FFFFFF" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" opacity={0.3 + 0.7 * fill} />
  </g>
);

/** A small leaf pair on a stem point. */
const Leaves: React.FC<{ x: number; y: number; s: number; flip?: boolean }> = ({ x, y, s, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s})`}>
    <path d="M0 0 Q26 -22 50 -8 Q26 10 0 0 Z" fill={PAL.plant} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <path d="M4 -1 Q24 -8 44 -8" fill="none" stroke={PAL.plantDark} strokeWidth={2} />
  </g>
);

/** An open book mark for the channel's name. */
const BookMark: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => o <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M0 -6 Q-30 -22 -64 -14 L-64 34 Q-30 26 0 42 Z" fill="#F3F1EC" stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
    <path d="M0 -6 Q30 -22 64 -14 L64 34 Q30 26 0 42 Z" fill="#E7E3DC" stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
    {[0, 1, 2].map((i) => <path key={i} d={`M${-54} ${-2 + i * 11} Q-30 ${-10 + i * 11} -10 ${-1 + i * 11}`} fill="none" stroke={PAL.textSoft} strokeWidth={2} opacity={0.6} />)}
  </g>
);

/** The street, scrolled to where Salim stopped (shots 151–153 share it). */
const PAN_STOP = 0.46;

export const SHOTS: Record<number, ShotRender> = {
  // 141 — the calm reply: typed in the field, sent on «واحدة», read in the thread; on «أغلق» the app closes to the lock screen.
  141: (c) => {
    const sendAt = c.at('واحدة'), shut = c.at('أغلق');
    const typed = clamp((c.f - 4) / 50);
    const posted = c.p(sendAt + 3, 16, ease.out);
    const glow = Math.max(0, Math.sin(clamp((c.f - c.at('هادئة')) / 70) * Math.PI)) * 0.9 + Math.max(0, Math.sin(clamp((c.f - c.at('واضحة')) / 50) * Math.PI)) * 0.6;
    const close = c.p(shut, 18);
    const thread = <Thread typed={posted > 0 ? 0 : typed} send={c.p(sendAt - 2, 14, ease.lin)} comments={[
      { name: 'هادي', text: 'أتفق معك تمامًا', kind: 'friend' },
      { name: ANON, text: HOSTILE, kind: 'hostile' },
      { name: 'سليم', text: REPLY, kind: 'mine', o: posted, glow: Math.min(1, glow) },
    ]} />;
    const screen = <g>
      <LockScreen time="22:41" date="الثلاثاء 21 أكتوبر" />
      {zoomAbout(thread, mix(1, 0.25, ease.in(close)), [180, 420], 1 - c.p(shut + 6, 12))}
    </g>;
    const cm = camK(c.f, [[0, 960, 720, 1.42], [sendAt + 4, 960, 720, 1.42], [sendAt + 34, 960, 640, 1.5], [shut - 4, 975, 630, 1.6], [shut + 22, 960, 540, 1]]);
    return <PhoneShot cm={cm} screen={screen} t={c.t} />;
  },
  // 142 — the attack repeats: two banners buzz on the lock screen («تكرر», «الهجوم»); he opens it, the menu opens and «حظر» is tapped on «الحظر».
  142: (c) => {
    const rep = c.at('تكرر'), atk = c.at('الهجوم'), use = c.at('استخدم'), blk = c.at('الحظر'), calm = c.at('شعور');
    const open = c.p(use, 16, ease.out);
    const buzz = Math.max(c.f >= rep && c.f < rep + 22 ? 1 : 0, c.f >= atk && c.f < atk + 22 ? 1 : 0);
    const gone = c.p(blk + 8, 16);
    const menu = c.p(use + 16, 12, ease.out) * (1 - c.p(blk + 6, 8));
    const lock = <g>
      <LockScreen time="23:05" date="الثلاثاء 21 أكتوبر" />
      <g transform="translate(12 250)"><NotificationBanner name={ANON} text="لن تتغير أبدًا" time="الآن" o={c.p(atk - 2, 10, ease.out)} /></g>
      <g transform={`translate(12 ${mix(250, 360, c.p(atk - 2, 10))})`}><NotificationBanner name={ANON} text="ما زلت مصرًا؟ كلامك فارغ" time="الآن" o={c.p(rep - 2, 10, ease.out)} /></g>
      {c.f > use - 8 && c.f < use + 10 && <circle cx={180} cy={300} r={10 + 50 * c.p(use - 8, 16, ease.lin)} fill="none" stroke={INK} strokeWidth={3} opacity={1 - c.p(use - 8, 16, ease.lin)} />}
    </g>;
    const thread = <Thread scroll={150} time="23:05" menuOn={4} menu={menu} press={c.p(blk - 4, 10, ease.lin)} comments={[
      { name: 'هادي', text: 'أتفق معك تمامًا', kind: 'friend' },
      { name: ANON, text: HOSTILE, kind: 'hostile', gone, collapse: c.p(calm - 20, 16) },
      { name: 'سليم', text: REPLY, kind: 'mine' },
      { name: ANON, text: 'ما زلت مصرًا؟ كلامك فارغ', kind: 'hostile', gone, collapse: c.p(calm - 20, 16) },
      { name: ANON, text: 'لن تتغير أبدًا', kind: 'hostile', gone, check: c.p(calm, 14, ease.back) },
    ]} />;
    const screen = <g>{lock}{zoomAbout(thread, mix(0.3, 1, open), [180, 300], Math.min(1, open * 2))}</g>;
    const cm = camK(c.f, [[0, 960, 540, 1.0], [atk, 960, 560, 1.12], [use, 960, 560, 1.12], [use + 26, 960, 700, 1.45], [blk + 30, 960, 700, 1.45], [calm, 960, 660, 1.35], [c.dur, 960, 640, 1.28]]);
    return <PhoneShot cm={cm} screen={screen} buzz={buzz} t={c.t} />;
  },
  // 143 — a low fence round a small garden: he waters a clock that blooms on «وقتك» and a battery that fills on «وطاقتك»;
  //       wine-red scraps hit the fence and fall on «ضعفا»; the fence glows on «حد».
  143: (c) => {
    const time = c.at('وقتك'), energy = c.at('وطاقتك'), weak = c.at('ضعفا'), edge = c.at('حد');
    const G = { cx: 1240, cy: 880, rx: 400, ry: 74 };
    const tilt = k(c.f, [[0, 6], [c.at('حماية') - 4, 30], [weak - 30, 30], [weak - 14, 10], [weak + 30, 10], [weak + 46, 30]]);
    const pour = clamp((tilt - 18) / 10);
    const sp = pose({ head: 6, turn: 0.55, L: { hand: [94, -156] }, R: { sh: -4, el: 10 }, breath: 0.5 + 0.5 * Math.sin(c.f / 40) });
    const look = k(c.f, [[weak - 34, 0], [weak - 18, 1], [weak + 40, 1], [weak + 60, 0]]);
    const sAt = pose({ ...sp, head: mix(6, -4, look), turn: mix(0.55, 0.75, look) });
    const bloom = c.p(time - 6, 22, ease.back), charge = c.p(energy - 4, 40, ease.out);
    const glow = c.p(edge - 6, 16) * (0.6 + 0.4 * Math.sin(c.f / 9));
    const sway = Math.sin(c.f / 30) * 2;
    const scraps = [[680, 0], [770, 8], [600, 16]].map(([y, d], i) => {
      const a = weak - 46 + d, u = clamp((c.f - a) / 46), back = clamp((c.f - a - 46) / 40);
      const x = mix(2060, G.cx + G.rx + 40, ease.in(u)) + back * 160, yy = y + back * back * 240;
      return { x, y: yy, o: (c.f > a ? 1 : 0) * (1 - back), rot: back * 80 * (i % 2 ? 1 : -1), i };
    });
    return <Stage over={<>
      <Cap text="حد آخر" o={c.p(edge - 2, 14)} top={60} size={66} />
    </>}>
      <Paper seed={143} />
      <Floor y={900} />
      <ellipse cx={G.cx} cy={G.cy + 6} rx={G.rx - 30} ry={G.ry - 12} fill="#9C8F96" stroke={INK} strokeWidth={3.6} />
      <ellipse cx={G.cx} cy={G.cy - 2} rx={G.rx - 48} ry={G.ry - 26} fill="#AFA3AA" />
      <Fence {...G} half="back" h={96} glow={glow} />
      {/* the clock flower */}
      <g transform={`rotate(${sway} 1150 870)`}>
        <path d="M1150 870 Q1140 760 1152 650" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
        <path d="M1150 870 Q1140 760 1152 650" fill="none" stroke={PAL.plantDark} strokeWidth={7} strokeLinecap="round" />
        <Leaves x={1146} y={790} s={1.1} /><Leaves x={1144} y={740} s={0.9} flip />
        <g transform={`translate(1152 600) scale(${mix(0.25, 1, bloom)})`}>
          {Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx={0} cy={-74} rx={22} ry={34} transform={`rotate(${i * 45})`} fill={PAL.calmLight} stroke={INK} strokeWidth={3} />)}
          <IconClock s={124} accent="#FFFFFF" />
          <path d={`M0 0 L${Math.sin(c.f / 25) * 26} ${-Math.cos(c.f / 25) * 26}`} stroke={PAL.calm} strokeWidth={4} strokeLinecap="round" opacity={bloom} />
        </g>
      </g>
      {/* the battery with its sprouts */}
      <Leaves x={1330} y={880} s={0.9} flip /><Leaves x={1410} y={884} s={0.8} />
      <g transform="translate(1372 884)"><Battery fill={charge} s={1.05} /></g>
      <Fence {...G} half="front" h={96} glow={glow} />
      {scraps.map((s) => s.o > 0 && <g key={s.i} transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`} opacity={s.o}>
        <SpeechBubble w={110} h={76} tail={[-70, 10]} kind="shout" fill={PAL.provokeLight} />
        <path d="M-20 -10 L20 10 M-20 10 L20 -10" stroke={PAL.provoke} strokeWidth={6} strokeLinecap="round" />
      </g>)}
      <WLabel x={1152} y={430} text="وقتك" size={48} o={c.p(time, 12)} color={PAL.focus} />
      <WLabel x={1372} y={660} text="طاقتك" size={48} o={c.p(energy, 12)} color={PAL.calm} />
      <Actor f={c.f} seed={41} who="salim" x={700} y={900} s={1.6} facing={1} pose={{ p: sAt }} hands={{ R: 'relaxed', L: 'grip' }}
        hold={{ L: <WateringCan tilt={tilt} pour={pour} t={c.t} /> }} upright={{ L: true }}
        face={faceAt(c.f, [[0, 'relieved'], [weak - 18, face('calm', { look: [0.8, -0.1] }), 10], [weak + 50, 'relieved', 14], [edge, face('smile', { mouth: 0.7 }), 14]])} />
    </Stage>;
  },
  // 144 — a week later, the same meeting as shot 1: the calendar jumps a week on «أسبوع»; he taps the chart on «كالعادة».
  144: (c) => {
    const wk = c.at('أسبوع'), tap = c.at('كالعادة');
    const n = Math.max(0, Math.min(7, Math.floor((c.f - wk) / 5) + 1));
    const flip = c.f >= wk && n < 8 ? clamp(((c.f - wk) % 5) / 5) : 1;
    const hadiNod = nod(c.f, tap + 8, 2, 9);
    return <Stage cam={CAM0}>
      <Meeting f={c.f} seats={team({ head: [0, 0, hadiNod, 0, 0] })}
        extra={<g transform="translate(352 432) scale(2.3)">
          <Calendar day={21 + n} month="أكتوبر" />
          {c.f >= wk && c.f < wk + 36 && n <= 7 && <g transform={`translate(0 ${-52 + flip * 40}) rotate(${flip * -25})`} opacity={1 - flip}><Calendar day={20 + n} month="أكتوبر" /></g>}
        </g>}
        front={<Actor f={c.f} seed={41} who="salim" x={STAND.x} y={STAND.y} s={1.45} facing={-1} say={[0, tap - 4]}
          pose={poseAt(c.f, [[0, 'explain'], [40, midGesture, 22], [tap - 14, pointBoard, 14], [tap + 40, 'explain', 22]])}
          face={faceAt(c.f, [[0, 'calm'], [tap - 10, 'smile']])} />} />
    </Stage>;
  },
  // 145 — the same table (mugs, papers), the same faces (each looks up), the same Jaser: he leans back and lifts a finger on «جاسر».
  145: (c) => {
    const tb = c.at('الطاولة'), fc = c.at('الوجوه'), js = c.at('جاسر');
    const cm = camK(c.f, [[0, 820, 730, 2.3], [fc - 10, 1010, 720, 2.3], [fc + 22, 760, 520, 1.9], [js - 12, 860, 520, 1.9], [js + 14, 1210, 530, 2.35]]);
    const look = (i: number) => k(c.f, [[fc + i * 8, 0], [fc + 16 + i * 8, 1]]);
    const seats: (SeatSpec | null)[] = (['mona', 'att1', 'hadi', 'att2'] as const).map((w, i): SeatSpec => ({
      who: w, p: atTable({ head: mix(16, -2, look(i)) + nod(c.f, fc + 40 + i * 10, 1, 5), turn: mix(0.25, 0.5, look(i)) }),
      face: { ...EXPRESSIONS.neutral, look: [mix(0, 0.8, look(i)), mix(0.8, -0.1, look(i))] },
    }));
    const jp = poseAt(c.f, [[0, { p: jaserSeat() }], [js - 6, { p: jaserFinger, hands: { R: 'relaxed', L: 'point' } }, 14]]);
    seats.push({ who: 'jaser', p: jp.p, hands: jp.hands ?? { R: 'relaxed', L: 'relaxed' }, face: faceAt(c.f, [[0, 'smug'], [js - 4, face('smug', { brow: 0.5, browY: 0.1, open: 0.8 }), 10]]), say: [js + 6, c.dur] }, null);
    return <Stage cam={cm}>
      <Meeting f={c.f} seats={seats}
        front={<>
          {/* hands at the table: Hadi taps his pen, a cup is lifted and set down */}
          <g transform={`translate(${SEAT[2] + 74} ${648 - Math.abs(Math.sin(c.f / 9)) * 6 * (c.f > tb ? 1 : 0)}) rotate(-12)`}><path d="M-26 0 L26 0" stroke={INK} strokeWidth={8} strokeLinecap="round" /><path d="M-26 0 L26 0" stroke={PAL.focus} strokeWidth={4.5} strokeLinecap="round" /></g>
        </>}
        extra={<Actor f={c.f} seed={41} who="salim" x={STAND.x} y={STAND.y} s={1.45} facing={-1} pose={poseAt(c.f, [[0, 'explain'], [60, midGesture, 22]])} face="calm" say={[0, js]} />} />
    </Stage>;
  },
  // 146 — he is no longer that man: a ghost of the old Salim sits in his empty chair, smiles on «يبتسم», squeezes the pen
  //       under the table on «ويضغط» (an x-ray window); it fades on «تحت الطاولة» while Salim stands calm, hands loose.
  146: (c) => {
    const who = c.at('ذلك'), smile = c.at('يبتسم'), press = c.at('ويضغط'), under = c.at('تحت');
    const cm = camK(c.f, [[0, 1440, 590, 2.0], [c.dur, 1440, 600, 2.1]]);
    const ghostO = c.p(who - 8, 30) * (1 - c.p(under + 10, 50)) * 0.62;
    const win = c.p(press - 6, 18, ease.back) * (1 - c.p(under + 10, 40));
    const bend = c.p(press + 4, 40, ease.out);
    const tr = c.f > press ? Math.sin(c.f * 2.1) * 1.6 * bend : 0;
    const seats = team({ faces: ['listening', 'listening', 'listening', 'listening', 'smug'] });
    seats[4] = { who: 'jaser', p: jaserFinger, hands: { R: 'relaxed', L: 'point' }, face: faceAt(c.f, [[0, face('smug', { brow: 0.5, open: 0.8 })], [smile, face('smug', { look: [1, 0] })]]) };
    const ghost = ghostO > 0 && <Actor f={c.f} seed={77} who="salim" x={SEAT[5]} y={MEET_FEET} s={MEET_S} facing={-1} o={ghostO}
      pose={{ p: atTable({ turn: 0.4, head: 4 + nod(c.f, smile, 1, 6), lean: 3, R: { hand: [56, -128] }, L: { hand: [70, -124] } }) }} hands={{ R: 'fist', L: 'fist' }}
      face={faceAt(c.f, [[0, face('forcedSmile', { tight: 0.8, mouth: 0.3 })], [smile, face('forcedSmile', { tight: 1, mouth: 0.6, width: 1.2, brow: 0.8 }), 12]])} />;
    return <Stage cam={cm}>
      <Meeting f={c.f} seats={seats} extra={ghost}
        front={<>
          {win > 0 && <g opacity={Math.min(1, win)}>
            <circle cx={1404} cy={760} r={82 * Math.min(1, win)} fill="#FFFFFF" opacity={0.75} stroke={INK} strokeWidth={4} strokeDasharray="12 9" />
            <g transform={`translate(${1404 + tr} ${762 + tr * 0.5}) rotate(196) scale(${3.4 * Math.min(1, win)} ${-3.4 * Math.min(1, win)})`} opacity={0.85}>
              <Hand g="grip" skin={SKIN} layer="back" />
              <g transform={`translate(12 0) rotate(${84 + bend * 4})`}><BentPen bend={bend} /></g>
              <Hand g="grip" skin={SKIN} layer="front" />
            </g>
          </g>}
          <Actor f={c.f} seed={41} who="salim" x={STAND.x} y={STAND.y} s={1.45} facing={-1}
            pose={poseAt(c.f, [[0, { p: pose({ head: 2, turn: 0.45, breath: 0.4 + 0.4 * Math.sin(c.f / 45), R: { sh: -8, el: 10 }, L: { sh: 8, el: 12 } }) }], [who, { p: pose({ head: 6, turn: 0.75, R: { sh: -8, el: 10 }, L: { sh: 8, el: 12 } }) }, 24], [under + 20, { p: pose({ head: -2, turn: 0.45, R: { sh: -10, el: 14 }, L: { hand: [40, -150] } }), hands: { R: 'relaxed', L: 'open' } }, 20]])}
            face={faceAt(c.f, [[0, 'calm'], [who + 4, face('calm', { look: [0.9, 0.4] }), 16], [under + 20, face('calm', { mouth: 0.5 }), 16]])} />
        </>} />
    </Stage>;
  },
  // 147 — Jaser cuts in again («لنكن واقعيين»): a small swirl in Salim's chest on «يشعر», the word «انزعاج» on «ويسميه»,
  //       and on «ويختار» he lifts a calm palm and answers clearly; Jaser lowers his finger, Hadi nods.
  147: (c) => {
    const feel = c.at('يشعر'), name = c.at('ويسميه'), pick = c.at('ويختار'), act = c.at('يفعل');
    const cm = cam(1440, 560, 1.55);
    const jp = poseAt(c.f, [[0, { p: jaserFinger, hands: { R: 'relaxed', L: 'point' } }], [act - 10, { p: jaserSeat({ lean: -2, head: 2 }), hands: { R: 'relaxed', L: 'relaxed' } }, 20]]);
    const seats = team({ head: [0, 0, nod(c.f, act + 10, 2, 8), 0, 0], turn: [0.45, 0.45, 0.5, 0.55, 0.45], faces: ['listening', 'listening', 'listening', 'surprised', 'smug'] });
    seats[4] = { who: 'jaser', p: jp.p, hands: jp.hands, say: [0, 44], face: faceAt(c.f, [[0, face('smug', { brow: 0.5, open: 0.8 })], [pick + 30, face('surprised', { open2: 0.1, mouth: 0, browY: 0.5 }), 14], [act + 20, face('neutral', { brow: 0.3, look: [1, 0] }), 20]]) };
    const sp = poseAt(c.f, [[0, { p: pose({ turn: 0.6, head: 2, R: { sh: -8, el: 10 }, L: { sh: 8, el: 12 } }) }], [feel + 4, { p: pose({ turn: 0.6, head: 6, lean: -2, R: { hand: [10, -150], bend: -1 }, L: { sh: 10, el: 20 } }), hands: { R: 'fist', L: 'fist' } }, 14], [name - 6, { p: pose({ turn: 0.45, head: 14, R: { hand: [10, -150], bend: -1 }, L: { sh: 10, el: 20 } }), hands: { R: 'relaxed', L: 'relaxed' } }, 16], [pick - 6, { p: pose({ turn: 0.7, head: -2, R: { sh: -8, el: 10 }, L: { hand: [78, -204] } }), hands: { R: 'relaxed', L: 'stop' } }, 18]]);
    const head = toScreen(cm, [SEAT[4] + 10, MEET_FEET - 420]);
    const sHead = toScreen(cm, [STAND.x - 14, STAND.y - 540]);
    const chest: [number, number] = [STAND.x - 6, STAND.y - 192 * 1.45];
    return <Stage cam={cm} over={<>
      <Say text="لنكن واقعيين…" to={head} above={10} o={c.p(0, 6) * (1 - c.p(50, 10))} size={46} />
      <Tag text="انزعاج" at={toScreen(cm, [chest[0] - 150, chest[1] + 20])} o={c.p(name, 10, ease.out) * (1 - c.p(pick + 26, 12))} bg={PAL.provokeLight} color={INK} size={44} />
      <Say text="لحظة، دعني أكمل فكرتي" to={sHead} above={6} o={c.p(pick + 16, 12)} size={44} />
    </>}>
      <Meeting f={c.f} seats={seats}
        front={<>
          <Actor f={c.f} seed={41} who="salim" x={STAND.x} y={STAND.y} s={1.45} facing={-1} pose={sp} say={[pick + 18, c.sp[1]]}
            face={faceAt(c.f, [[0, 'neutral'], [feel, face('irritated', { brow: 0.45 }), 10], [name - 4, { ...EXPRESSIONS.thinking, look: [0, 0.8] }, 12], [pick, face('calm', { brow: 0.2, tight: 0.2 }), 14]])} />
          <ChestSwirl x={chest[0]} y={chest[1]} r={34} t={c.t} amount={c.p(feel - 4, 24) * mix(1, 0.55, c.p(pick, 50))} />
        </>} />
    </Stage>;
  },
  // 148 — true calm is not a lake with no currents: the title phrase over the still surface, then the section opens on «بحيرة»
  //       and the currents brighten on «تيارات».
  148: (c) => (
    <Stage over={<Cap text="الهدوء الحقيقي" o={c.p(c.at('الحقيقي') - 6, 14) * (1 - c.p(c.at('بحيرة') + 10, 14))} top={70} size={66} />}>
      <Lake t={c.t + 40} cut={k(c.f, [[0, 0.2], [c.at('بحيرة') - 10, 0.3], [c.at('بحيرة') + 40, 1]])} current={k(c.f, [[0, 0.25], [c.at('تيارات') - 6, 0.4], [c.at('تيارات') + 30, 1]])} />
    </Stage>
  ),
  // 149 — you see the current (it lights up on «ترى»), know its way (arrows on «اتجاهه»), and steer your own boat across it on «وتقود».
  149: (c) => {
    const see = c.at('ترى'), dir = c.at('اتجاهه'), lead = c.at('وتقود');
    const bx = k(c.f, [[0, 360], [lead - 10, 420], [c.dur, 1240]], ease.inOut);
    const row = k(c.f, [[0, 0.25], [lead - 14, 0.25], [lead + 6, 1]]);
    const arrows = c.p(dir - 4, 30);
    return <Stage>
      <Lake t={c.t + 60} cut={1} current={k(c.f, [[0, 0.45], [see - 4, 0.45], [see + 24, 1]])} />
      {c.f > see - 4 && <ellipse cx={960} cy={830} rx={680} ry={230} fill="none" stroke="#D7EBF3" strokeWidth={6} strokeDasharray="30 22" strokeDashoffset={-c.f * 2} opacity={c.p(see - 4, 20) * (1 - c.p(dir + 20, 30)) * 0.7} />}
      <Arrow from={[600, 690]} to={[1300, 690]} bend={-0.12} p={arrows} color="#F3F1EC" w={9} />
      <Arrow from={[1320, 990]} to={[620, 990]} bend={-0.1} p={c.p(dir + 10, 30)} color="#F3F1EC" w={9} />
      <g transform={`translate(0 ${-LAKE.pan})`}><Boat t={c.t} x={bx} y={930} s={1.25} row={row} /></g>
    </Stage>;
  },
  // 150 — Salim turns to us with a smile on «فإليك»; the card «خطوة اليوم» is pinned on «خطوة», underlined on «اليوم».
  150: (c) => {
    const turn = c.at('فإليك'), step = c.at('خطوة'), today = c.at('اليوم');
    const card = c.p(step - 6, 16, ease.back);
    const side = pose({ turn: 0.85, body: 0.55, head: 2 });
    const front = pose({ ...POSES.standFront.p, head: -2 });
    const present = { p: pose({ ...POSES.standFront.p, turn: -0.15, body: 0.1, R: { sh: -8, el: 6 }, L: { hand: [96, -178] } }), hands: { R: 'relaxed' as const, L: 'cup' as const } };
    const pz = poseAt(c.f, [[0, { p: side }], [turn - 4, { p: front }, 20], [step - 4, present, 18], [c.at('تجربها') - 4, { p: pose({ ...front, head: nod(c.f, c.at('تجربها'), 1, 8) - 2 }) }, 18], [today, { p: pose({ ...front, head: -4 + nod(c.f, today + 4, 1, 7) }) }, 12]]);
    return <Stage>
      <Paper seed={150} />
      <Floor y={1000} />
      <g transform={`translate(560 470) rotate(-2) scale(${mix(0.6, 1, Math.min(1, card))})`} opacity={Math.min(1, card * 1.5)}>
        <rect x={-300} y={-170} width={600} height={340} rx={18} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
        <rect x={-260} y={-190} width={110} height={40} fill={PAL.calmLight} opacity={0.8} transform="rotate(-8 -205 -170)" />
        <rect x={150} y={-190} width={110} height={40} fill={PAL.calmLight} opacity={0.8} transform="rotate(7 205 -170)" />
        <WLabel x={0} y={-6} text="خطوة اليوم" size={92} w={580} />
        <path d={`M${-200} 70 L${-200 + 190 * c.p(today, 20)} 70`} stroke={PAL.calm} strokeWidth={10} strokeLinecap="round" opacity={c.f > today ? 1 : 0} />
      </g>
      <Actor f={c.f} seed={41} who="salim" x={1260} y={1000} s={1.85} facing={-1} pose={pz}
        face={faceAt(c.f, [[0, face('calm', { look: [1, 0] })], [turn, 'smile', 16], [step, face('smile', { look: [0.8, 0] }), 12], [c.at('تجربها'), 'smile', 12]])} />
    </Stage>;
  },
  // 151 — walking down the street, his phone buzzes on «لحظة»; irritation rises on «تنزعج»; he stops dead on «توقف» (a pause sign).
  151: (c) => {
    const buzzAt = c.at('لحظة'), irk = c.at('تنزعج'), stop = c.at('توقف');
    const v = 3.0, decel = 20;
    const dist = c.f <= stop - 6 ? v * c.f : v * (stop - 6 + Math.min(c.f - stop + 6, decel) - Math.min(c.f - stop + 6, decel) ** 2 / (2 * decel));
    const moving = c.f <= stop - 6 ? 1 : Math.max(0, 1 - (c.f - stop + 6) / decel);
    const pan = PAN_STOP - (v * (stop - 6 + decel / 2)) / 1400 + dist / 1400;
    const ph = (dist / (44 * 1.45)) * Math.PI;
    const walk = pose({ lean: 4 * moving, ...walkPhase(ph, 44, moving) });
    const read = k(c.f, [[buzzAt + 4, 0], [buzzAt + 20, 1], [stop + 4, 1], [stop + 22, 0.25]]);
    const p = mixPose(pose({ ...walk, L: { hand: [36, -130] } }), pose({ ...walk, head: 14, turn: 0.5, L: { hand: [42, -176] } }), read);
    const x = 820, cm = cam(900, 600, 1.3);
    const pause = c.p(stop, 14, ease.back);
    return <Stage cam={cm}>
      <Street pan={pan} />
      <Actor f={c.f} seed={41} who="salim" x={x} y={880} s={1.45} facing={1} pose={{ p }} hands={{ R: 'relaxed', L: 'grip' }}
        hold={{ L: <Phone w={28} glow={0.4} buzz={c.f > buzzAt && c.f < buzzAt + 26 ? 1 : 0} t={c.t} /> }} upright={{ L: true }}
        face={faceAt(c.f, [[0, face('neutral', { look: [0.6, 0.1] })], [buzzAt + 10, face('neutral', { look: [0.4, 0.8] }), 10], [irk, face('irritated', { look: [0.4, 0.8], brow: 0.8 }), 10], [stop, face('surprised', { open2: 0, open: 1.1, look: [0.2, 0] }), 8], [stop + 30, face('neutral', { brow: 0.2, look: [0.3, 0] }), 20]])} />
      <ChestSwirl x={x + 10} y={880 - 196 * 1.45} r={30} t={c.t} amount={c.p(irk - 4, 24) * mix(1, 0.8, c.p(stop, 30))} />
      {pause > 0 && <g transform={`translate(${x + 10} ${330 - 6 * Math.sin(c.f / 12) * c.p(stop + 30, 20)}) scale(${Math.min(1.1, pause)})`}><IconPause s={120} /></g>}
    </Stage>;
  },
  // 152 — standing still, hand on his chest on «سم»; a one-word card «انزعاج» at his chest; on «سرك» it floats up into a thought.
  152: (c) => {
    const name = c.at('سم'), word = c.at('بكلمة'), secret = c.at('سرك');
    const x = 860, cm = cam(900, 560, 1.75);
    const chest = toScreen(cm, [x + 10, 880 - 200 * 1.45]);
    const headS = toScreen(cm, [x + 4, 880 - 330 * 1.45]);
    const up = c.p(secret - 6, 22);
    const tagAt: [number, number] = [mix(chest[0] + 250, headS[0] + 330, up), mix(chest[1] + 30, headS[1] - 70, up)];
    return <Stage cam={cm} over={<>
      <Tag text="انزعاج" at={tagAt} o={c.p(name + 4, 12, ease.out)} bg="#FFFFFF" color={INK} size={mix(60, 50, up)} />
      {up > 0.2 && [0.35, 0.65].map((u, i) => <div key={i} style={{ position: 'absolute', left: mix(headS[0] + 70, tagAt[0] - 120, u) - 9 + i * 2, top: mix(headS[1] - 10, tagAt[1] + 20, u) - 9, width: 18 - i * 5, height: 18 - i * 5, borderRadius: 99, background: '#FFFFFF', border: `3px solid ${INK}`, opacity: c.p(secret + 4, 10) }} />)}
    </>}>
      <Street pan={PAN_STOP} />
      <Actor f={c.f} seed={41} who="salim" x={x} y={880} s={1.45} facing={1}
        pose={poseAt(c.f, [[0, { p: pose({ turn: 0.4, body: 0.35, head: 2, breath: 0.4, L: { hand: [30, -130] } }), hands: { R: 'relaxed', L: 'grip' } }], [name - 8, { p: pose({ ...POSES.handOnChest.p, turn: 0.3, body: 0.3, head: 8 + nod(c.f, secret + 6, 1, 6) }), hands: POSES.handOnChest.hands }, 18]])}
        hold={c.f < name ? { L: <Phone w={28} /> } : undefined} upright={{ L: true }}
        face={faceAt(c.f, [[0, face('neutral', { brow: 0.2 })], [name, { ...EXPRESSIONS.thinking, look: [0.3, 0.6] }, 14], [word, face('calm', { look: [0.6, 0.4] }), 14], [secret, face('calm', { tight: 0.6, mouth: 0.35, look: [0.5, -0.4] }), 12]])} />
    </Stage>;
  },
  // 153 — eyes closed, a slow breath in (lines drawn into him), then on «الزفير» a long ribbon of breath flows out, longer than the first.
  153: (c) => {
    const inA = c.at('خذ'), outA = c.at('الزفير');
    const x = 860, cm = cam(880, 520, 1.7);
    const inhale = c.p(inA, 80), exhale = c.p(outA - 4, c.dur - outA, ease.out);
    const breath = inhale * (1 - exhale);
    const mouth: [number, number] = [x - 4, 880 - 278 * 1.45 - breath * 4];
    const wave = (len: number, ox: number, oy: number, amp: number, ph: number) => Array.from({ length: 30 }, (_, i) => {
      const u = i / 29; return `${i ? 'L' : 'M'}${(ox + u * len).toFixed(1)} ${(oy + Math.sin(u * 9 + ph) * amp * u).toFixed(1)}`;
    }).join(' ');
    const inLen = 260 * clamp(inhale * 1.4) * (1 - c.p(outA - 20, 16));
    const outLen = 560 * exhale;
    return <Stage cam={cm}>
      <Street pan={PAN_STOP} />
      <Actor f={c.f} seed={41} who="salim" x={x} y={880} s={1.45} facing={1}
        pose={{ p: pose({ ...POSES.breathe.p, turn: 0.15, body: 0.15, head: mix(-2, -6, breath), bob: -breath * 3, breath }), hands: POSES.breathe.hands }}
        face={faceAt(c.f, [[0, face('calm', { open: 0.6 })], [inA, face('calm', { open: 0.04, mouth: 0.25 }), 14], [outA, face('relieved', { open: 0.04, open2: 0.12, width: 0.7 }), 14], [c.dur - 30, face('relieved', { open: 0.3 }), 20]])} />
      {inLen > 4 && [0, 1, 2].map((i) => <path key={i} d={wave(inLen, mouth[0] + 40 + i * 6, mouth[1] - 20 + i * 18, 6, c.f / 6 + i)} transform={`rotate(${-10 + i * 10} ${mouth[0] + 40} ${mouth[1]})`} fill="none" stroke={PAL.water} strokeWidth={5} strokeLinecap="round" strokeDasharray="26 14" strokeDashoffset={c.f * 1.5} opacity={0.8} />)}
      {outLen > 4 && <g transform={`translate(${mouth[0] - 30} ${mouth[1] + 4}) scale(-1 1)`}>
        {[0, 1, 2].map((i) => <path key={i} d={wave(outLen * (1 - i * 0.12), 0, (i - 1) * 16, 10 + i * 3, -c.f / 8 + i * 1.7)} fill="none" stroke={i === 1 ? PAL.water : PAL.waterLight} strokeWidth={i === 1 ? 8 : 5} strokeLinecap="round" opacity={0.85} />)}
      </g>}
    </Stage>;
  },
  // 154 — thinking «ماذا أريد هنا؟»; a hand on his chest and a shield on «أحميه»; an open palm held out and a big palm on «أطلبه».
  154: (c) => {
    const ask = c.at('اسأل'), prot = c.at('أحميه'), req = c.at('أطلبه'), here = c.at('هنا');
    const sh = c.p(prot - 4, 16, ease.back), pm = c.p(req - 4, 16, ease.back);
    const pulse = (a: number) => 1 + 0.06 * Math.sin(clamp((c.f - a) / 30) * Math.PI);
    const pz = poseAt(c.f, [[0, { p: pose({ turn: 0.15, body: 0.2, R: { sh: -6, el: 8 }, L: { sh: 6, el: 8 } }) }],
      [ask, { p: pose({ turn: 0.25, body: 0.2, head: -8, R: { sh: -6, el: 8 }, L: { hand: [40, -246] } }), hands: { R: 'relaxed', L: 'relaxed' } }, 18],
      [prot - 8, { p: pose({ turn: 0.35, body: 0.2, head: 4, R: { sh: -6, el: 8 }, L: { hand: [24, -196], bend: -1 } }), hands: { R: 'relaxed', L: 'open' } }, 16],
      [req - 8, { p: pose({ turn: -0.3, body: 0.2, head: 0, R: { hand: [-84, -168] }, L: { hand: [24, -196], bend: -1 } }), hands: { R: 'cup', L: 'open' } }, 16],
      [here, { p: pose({ turn: 0, body: 0.2, head: -2 + nod(c.f, here + 6, 1, 6), R: { hand: [-84, -168] }, L: { hand: [24, -196], bend: -1 } }), hands: { R: 'cup', L: 'open' } }, 14]]);
    const headTop = toScreen(CAM0, [985, 990 - 360 * 1.8]);
    return <Stage over={<Say text="ماذا أريد هنا؟" to={headTop} above={30} o={c.p(ask + 6, 12)} size={50} think />}>
      <Paper seed={154} />
      <Floor y={990} />
      {sh > 0 && <g transform={`translate(1490 560) scale(${Math.min(1.1, sh) * pulse(here)})`}><IconShield s={230} /></g>}
      {pm > 0 && <g transform={`translate(420 ${640 - 10 * Math.sin(c.f / 20)}) rotate(-90) scale(${7.5 * Math.min(1.1, pm) * pulse(here)})`}><Hand g="open" skin={SKIN} /></g>}
      <WLabel x={1490} y={760} text="أحمي" size={56} o={c.p(prot + 4, 12)} color={PAL.calm} />
      <WLabel x={430} y={760} text="أطلب" size={56} o={c.p(req + 4, 12)} color={PAL.focus} />
      <Actor f={c.f} seed={41} who="salim" x={960} y={990} s={1.8} facing={1} pose={pz}
        face={faceAt(c.f, [[0, 'calm'], [ask, { ...EXPRESSIONS.thinking, look: [0.3, -0.8] }, 14], [prot, face('determined', { look: [0.9, 0] }), 12], [req, face('calm', { look: [-0.9, 0.1] }), 12], [here + 6, face('calm', { look: [0, 0] }), 12]])} />
    </Stage>;
  },
  // 155 — at a fork: a rose zigzag and a straight calm path; on «اختر» he turns and steps onto the straight one.
  155: (c) => {
    const pick = c.at('اختر');
    const w = walkTo(c.f, pick + 2, c.dur, 1010, 840, 1.6);
    const zig: [number, number][] = Array.from({ length: 9 }, (_, i) => [1060 + i * 95, 930 - i * 34 + (i % 2 ? -34 : 34)]);
    const straight = c.p(pick - 4, 22);
    const pz = c.f < pick + 2 ? poseAt(c.f, [[0, { p: pose({ turn: 0.8, body: 0.45, head: 6 }) }], [30, { p: pose({ turn: -0.2, body: 0.3, head: 2 }) }, 18]]) : { p: w.p };
    return <Stage>
      <Paper seed={155} />
      <Floor y={930} />
      <path d={sketch(zig, 4, 1)} stroke={PAL.warn} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={mix(0.85, 0.35, straight)} />
      <path d={`M1000 940 L160 940`} stroke={PAL.calmLight} strokeWidth={26} strokeLinecap="round" />
      <path d={`M1000 940 L${1000 - 840 * mix(0.25, 1, straight)} 940`} stroke={PAL.calm} strokeWidth={16} strokeLinecap="round" />
      {straight > 0.95 && <path d="M190 916 L158 940 L190 964" stroke={PAL.calm} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      <circle cx={1010} cy={936} r={22} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      <Actor f={c.f} seed={41} who="salim" x={c.f < pick + 2 ? 1010 : w.x} y={930} s={1.6} facing={c.f < pick + 2 ? 1 : -1} pose={pz}
        face={faceAt(c.f, [[0, { ...EXPRESSIONS.thinking, look: [0.8, 0] }], [30, face('neutral', { look: [-0.8, 0.2] }), 12], [pick - 6, 'determined', 10]])} />
    </Stage>;
  },
  // 156 — three cards fill on the words: a clear word («كلمة», he speaks), a chosen silence («صمتا», lips closed), a gentle limit («حدا», a raised palm).
  156: (c) => {
    const slots = c.at('الرد'), word = c.at('كلمة'), quiet = c.at('صمتا'), limit = c.at('حدا');
    const on = [word, quiet, limit].map((a) => c.p(a - 4, 16, ease.back));
    const act = c.f >= limit - 4 ? 2 : c.f >= quiet - 4 ? 1 : c.f >= word - 4 ? 0 : -1;
    const xs = [1500, 960, 420], labels = ['كلمة واضحة', 'صمت تختاره', 'حد بلطف'];
    const pz = poseAt(c.f, [[0, { p: pose({ turn: 0, body: 0.2, R: { sh: -6, el: 8 }, L: { sh: 6, el: 8 } }) }],
      [word - 8, { p: pose({ ...POSES.explain.p, turn: 0.45, body: 0.3, R: { hand: [44, -176] }, L: { hand: [76, -170] } }), hands: POSES.explain.hands }, 16],
      [word + 50, { p: pose({ ...POSES.explain.p, turn: 0.4, body: 0.3, R: { hand: [50, -160] }, L: { hand: [84, -186] } }), hands: POSES.explain.hands }, 30],
      [quiet - 8, { p: pose({ turn: 0, body: 0.2, head: 6, R: { hand: [-6, -150], bend: -1 }, L: { hand: [12, -154], bend: -1 } }), hands: { R: 'relaxed', L: 'relaxed' } }, 18],
      [limit - 8, { p: pose({ turn: -0.35, body: 0.2, head: -2, R: { sh: -6, el: 10 }, L: { hand: [-60, -206] } }), hands: { R: 'relaxed', L: 'stop' } }, 18]]);
    const art = (i: number, s: number) => {
      if (i === 0) return <g transform={`scale(${s})`}><SpeechBubble w={190} h={110} tail={[-70, 80]}><g>{[-24, 0, 24].map((y, j) => <path key={j} d={`M${-60 + j * 10} ${y} H60`} stroke={INK} strokeWidth={7} strokeLinecap="round" />)}</g></SpeechBubble></g>;
      if (i === 1) return <g transform={`scale(${s})`}>
        <circle r={78} fill={SKIN} stroke={INK} strokeWidth={5} />
        <path d="M-34 20 Q0 38 34 20" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
        <path d="M-30 -18 q10 -8 20 0 M10 -18 q10 -8 20 0" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <rect x={-11} y={-6} width={22} height={70} rx={11} fill={SKIN} stroke={INK} strokeWidth={5} />
      </g>;
      return <g transform={`rotate(-90) scale(${5.4 * s})`}><Hand g="stop" skin={SKIN} /></g>;
    };
    return <Stage>
      <Paper seed={156} />
      <Floor y={1010} />
      {xs.map((x, i) => {
        const sl = c.p(slots - 4 + i * 6, 12), o = on[i], hot = act === i;
        return <g key={i} opacity={Math.min(1, sl)}>
          <rect x={x - 220} y={70} width={440} height={370} rx={26} fill={o > 0 ? '#FFFFFF' : 'none'} stroke={hot ? PAL.calm : INK} strokeWidth={hot ? 8 : 4} strokeDasharray={o > 0 ? undefined : '16 12'} opacity={o > 0 ? 1 : 0.5} />
          {o > 0 && <g transform={`translate(${x} ${220 - (hot ? 4 * Math.sin(c.f / 14) : 0)})`} opacity={hot || act > i ? 1 : 0.6}>{art(i, Math.min(1.08, o))}</g>}
          <WLabel x={x} y={392} text={labels[i]} size={48} o={o} color={hot ? PAL.calm : INK} />
        </g>;
      })}
      <Actor f={c.f} seed={41} who="salim" x={960} y={1010} s={1.45} facing={1} pose={pz} say={[word, quiet - 40]}
        face={faceAt(c.f, [[0, 'calm'], [word, face('calm', { look: [0.6, -0.2] }), 12], [quiet, face('calm', { tight: 0.7, mouth: 0.4, look: [0, -0.2] }), 12], [limit, face('smile', { mouth: 0.5, look: [-0.6, -0.1] }), 12]])} />
    </Stage>;
  },
  // 157 — his own bubble in his own hand: wine-red strings tug it from above; he grips it on «ردك»; the strings snap on «لا» and fall.
  157: (c) => {
    const grip = c.at('ردك'), snap = c.at('لا'), fall = c.at('الاستفزاز');
    const x = 1000, y = 1010, s = 1.7;
    const tug = c.f < grip ? Math.sin(c.f / 7) * 6 * (1 - c.p(grip - 20, 20)) : 0;
    const pz = poseAt(c.f, [[0, { p: pose({ turn: 0.5, body: 0.4, head: -4, L: { hand: [70 + tug * 0.3, -214 - tug] }, R: { hand: [-20, -170 - tug * 0.6] } }), hands: { R: 'open', L: 'grip' } }],
      [grip - 6, { p: pose({ turn: 0.45, body: 0.35, head: 2, L: { hand: [78, -196] }, R: { sh: -6, el: 10 } }), hands: { R: 'relaxed', L: 'grip' } }, 18]]);
    const hand = wristAt(pz.p, x, y, s, 1, 'L');
    const bubTop: [number, number] = [hand[0] + 4, hand[1] - 2.46 * (70 + 76) - 6];
    const rHand = wristAt(pz.p, x, y, s, 1, 'R');
    const headTop: [number, number] = [x + 12, y - 380 * s];
    const cut = c.p(snap, 10, ease.out), drop = c.p(snap + 6, Math.max(20, fall + 40 - snap), ease.in);
    const src = (i: number): [number, number] => [880 + i * 160, -20 - cut * 60];
    const ends: [number, number][] = [bubTop, headTop, rHand];
    return <Stage>
      <Paper seed={157} />
      <Floor y={1010} />
      <g transform={`translate(1040 ${-30 - cut * 120})`} opacity={1 - cut * 0.6}><SpeechBubble w={520} h={150} tail={[0, 120]} kind="shout" fill={PAL.provokeLight} /></g>
      {ends.map((e, i) => {
        const s0 = src(i), mid: [number, number] = [mix(s0[0], e[0], 0.55), mix(s0[1], e[1], 0.55)];
        const upper = <path d={`M${s0[0]} ${s0[1]} L${mix(s0[0], mid[0], 1 - cut * 0.4)} ${mix(s0[1], mid[1], 1 - cut * 0.4)}`} stroke={PAL.provoke} strokeWidth={4} fill="none" strokeLinecap="round" />;
        const lower = <path d={`M${mid[0] + drop * 20 * (i - 1)} ${mid[1] + drop * 520} Q${mix(mid[0], e[0], 0.5) - drop * 40} ${mix(mid[1], e[1], 0.5) + drop * 560} ${e[0]} ${e[1] + drop * 600}`} stroke={PAL.provoke} strokeWidth={4} fill="none" strokeLinecap="round" opacity={1 - drop} />;
        return <g key={i}>{upper}{cut < 1 || drop < 1 ? lower : null}
          {c.f >= snap && c.f < snap + 14 && <g transform={`translate(${mid[0]} ${mid[1]})`} opacity={1 - (c.f - snap) / 14}>{[0, 1, 2, 3].map((j) => <path key={j} d={`M0 0 L${Math.cos(j * 1.6) * 30} ${Math.sin(j * 1.6) * 30}`} stroke={PAL.provoke} strokeWidth={4} strokeLinecap="round" />)}</g>}
        </g>;
      })}
      <Actor f={c.f} seed={41} who="salim" x={x} y={y} s={s} facing={1} pose={pz}
        hold={{ L: <g>
          <path d="M0 18 V-70" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d="M0 18 V-70" stroke={PAL.wood} strokeWidth={3} strokeLinecap="round" />
          <g transform="translate(4 -112)"><SpeechBubble w={150} h={78} tail={[-6, 46]} size={26}>ردي أنا</SpeechBubble></g>
        </g> }} upright={{ L: true }}
        face={faceAt(c.f, [[0, face('irritated', { brow: 0.4, look: [0.3, -0.7] })], [grip, face('determined', { look: [0.5, -0.3] }), 12], [snap + 10, face('calm', { mouth: 0.55 }), 14]])} />
    </Stage>;
  },
  // 158 — straight to us with a smile: «جربها اليوم», and one finger raised on «مرة».
  158: (c) => {
    const once = c.at('مرة');
    const base = pose({ ...POSES.standFront.p, head: -2 });
    const invite = { p: pose({ ...POSES.standFront.p, head: 4, L: { hand: [70, -170] }, R: { sh: -8, el: 6 } }), hands: { R: 'relaxed' as const, L: 'cup' as const } };
    const one = { p: aim(pose({ ...POSES.standFront.p, head: -3, lean: -1, L: { hand: [96, -292] }, R: { sh: -8, el: 6 } }), 'L', -84), hands: { R: 'relaxed' as const, L: 'point' as const } };
    const pz = poseAt(c.f, [[0, { p: base }], [c.at('جربها') - 6, invite, 16], [once - 12, one, 14], [c.at('فقط'), { p: pose({ ...one.p, head: -3 + nod(c.f, c.at('فقط'), 1, 6) }), hands: one.hands }, 10]]);
    return <Stage over={<Cap text="جربها اليوم" o={c.p(c.at('جربها') - 2, 14)} top={70} size={66} />}>
      <Paper seed={158} />
      <Floor y={1070} />
      <Actor f={c.f} seed={41} who="salim" x={940} y={1070} s={1.95} facing={1} pose={pz}
        face={faceAt(c.f, [[0, 'calm'], [c.at('جربها'), 'smile', 14], [once, face('smile', { mouth: 1, squint: 0.45 }), 10]])} />
      <WLabel x={1440} y={430} text="مرة واحدة" size={64} o={c.p(once + 2, 12)} color={PAL.calm} />
    </Stage>;
  },
  // 159 — evening in his room: the lamp on, he opens the notebook on «اكتب» and writes; on «حدث» he looks up, at ease.
  159: (c) => {
    const write = c.at('اكتب'), what = c.at('حدث');
    const open = c.p(write - 10, 16);
    const u = clamp((c.f - write) / (what - write + 10));
    const penX = 46 + ((u * 3) % 1) * 48, line = Math.floor(u * 3);
    const pz = poseAt(c.f, [[0, { p: pose({ sit: 1, lean: 12, head: 14, turn: 0.55, footR: [52, 0], footL: [64, 0], R: { hand: [70, -126] }, L: { hand: [84, -122] } }), hands: { R: 'relaxed', L: 'relaxed' } }],
      [write - 4, { p: pose({ sit: 1, lean: 14, head: 18, turn: 0.55, footR: [52, 0], footL: [64, 0], R: { hand: [104, -120] }, L: { hand: [penX, -116 - line * 5] } }), hands: { R: 'open', L: 'pen' } }, 14],
      [what + 4, { p: pose({ sit: 1, lean: 4, head: -6, turn: 0.8, footR: [52, 0], footL: [64, 0], R: { hand: [104, -120] }, L: { hand: [70, -118] } }), hands: { R: 'open', L: 'pen' } }, 22]]);
    const cm = cam(820, 600, 1.5);
    return <Stage cam={cm}>
      <Bedroom night lamp={1} />
      <Actor f={c.f} seed={41} who="salim" x={BEDROOM.bedSeat.x} y={860} s={1.45} facing={-1} pose={pz}
        face={faceAt(c.f, [[0, face('calm', { look: [0, 0.8] })], [write, face('calm', { look: [0.2, 0.9], mouth: 0.3 }), 12], [what + 4, face('relieved', { look: [0.2, -0.6], mouth: 0.7 }), 18]])} />
      <g transform={`translate(${BEDROOM.bedSeat.x - 128} 692)`}><Notebook w={250} open={open} written={u} lines={['ماذا حدث اليوم؟', 'شعرت بالانزعاج وسميته', 'توقفت وتنفست', 'ثم اخترت ردي']} /></g>
    </Stage>;
  },
  // 160 — the end: the lake still under the moon, the boat drifting away; «كتاب وبس» on «كتاب».
  160: (c) => {
    const u = c.p(0, c.dur, ease.lin);
    const logo = c.p(c.at('كتاب') - 4, 22, ease.out);
    return <Stage>
      <Lake t={c.t + 120} cut={0} current={0} />
      <Boat t={c.t} x={mix(1060, 1300, u)} y={mix(900, 780, u)} s={mix(0.75, 0.5, u)} row={0.5} />
      <BookMark x={560} y={170} s={1.2 * mix(0.8, 1, logo)} o={logo} />
      <WLabel x={560} y={340} text="كتاب وبس" size={124} w={900} color="#F3F1EC" o={logo} />
    </Stage>;
  },
};
