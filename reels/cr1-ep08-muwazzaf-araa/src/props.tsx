import React from 'react';
import { Ar, BODY, INK, TITLE, clamp01, ease, hash, mix, rrect, sketch } from './kit';
import { B } from './look';

// The things on Naif's desks. World units; each prop says where its origin is.

/** A stamp imprint: a rounded frame and a word, slammed in as p goes 0→1 (it lands a little big, then settles). */
export const Imprint: React.FC<{ text: string; color: string; p: number; w?: number; size?: number; rot?: number }> = ({ text, color, p, w = 200, size = 34, rot = -8 }) => {
  if (p <= 0) return null;
  const h = size * 1.7;
  return (
    <g transform={`rotate(${rot}) scale(${mix(1.4, 1, ease.out(clamp01(p * 1.6)))})`} opacity={clamp01(p * 3)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={12} fill="none" stroke={color} strokeWidth={5} />
      <Ar x={-w / 2} y={-h / 2} w={w} h={h} size={size} color={color} weight={800} font={TITLE} lh={1}>{text}</Ar>
    </g>
  );
};

/**
 * A complaint card, centred at its origin, w×h. The sender is a faceless dot on the right (the app is right-to-left);
 * `tag` puts a coloured badge on top (the client's card is blue, everyone else's grey).
 */
export const Card: React.FC<{ text: string; w?: number; h?: number; size?: number; tag?: string; tagColor?: string; stamp?: { text: string; color: string; p: number }; seed?: number; shadow?: boolean }> = ({ text, w = 280, h = 176, size = 30, tag, tagColor = B.grey, stamp, seed = 1, shadow = true }) => (
  <g>
    {shadow && <rect x={-w / 2 + 6} y={-h / 2 + 9} width={w} height={h} rx={12} fill={B.navy} opacity={0.18} />}
    <path d={sketch([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], seed, 1.1, true)} fill={B.white} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
    <rect x={-w / 2 + 2} y={-h / 2 + 2} width={w - 4} height={16} rx={6} fill={tag ? tagColor : B.greyLight} />
    <circle cx={w / 2 - 26} cy={-h / 2 + 40} r={14} fill={tag ? tagColor : B.greyMid} stroke={INK} strokeWidth={2.4} />
    {tag && <Ar x={-w / 2 + 12} y={-h / 2 + 22} w={w - 64} h={36} size={22} color={tagColor} weight={800} align="right">{tag}</Ar>}
    <Ar x={-w / 2 + 12} y={-h / 2 + (tag ? 56 : 26)} w={w - (tag ? 24 : 52)} h={(tag ? 74 : 90)} size={size} weight={700} lh={1.28} align="right">{text}</Ar>
    {stamp && <g transform={`translate(0 ${CARD_STAMP_DY})`}><Imprint text={stamp.text} color={stamp.color} p={stamp.p} w={Math.min(200, w * 0.8)} size={28} rot={-5} /></g>}
  </g>
);

/** Where a stamp lands on a card (from the card's centre). */
export const CARD_STAMP_DY = 48;

/** A rubber stamp, gripped at its neck (origin), drawn upright (the film's stamp in this episode's colours). */
export const StampTool: React.FC<{ rubber?: string }> = ({ rubber = B.blue }) => (
  <g>
    <circle cx={0} cy={-9} r={7.5} fill={B.navy3} stroke={INK} strokeWidth={1.6} />
    <rect x={-3.5} y={-3} width={7} height={11} fill={B.greyMid} stroke={INK} strokeWidth={1.4} />
    <rect x={-14} y={8} width={28} height={9} rx={2} fill={B.navy2} stroke={INK} strokeWidth={1.6} />
    <rect x={-13} y={17} width={26} height={3.5} fill={rubber} stroke={INK} strokeWidth={1.2} />
  </g>
);
/** Height from the stamp's neck to the bottom of its rubber, in stamp units. */
export const STAMP_FOOT = 20.5;

/** The ink pad: origin at the middle of its base on the counter. */
export const InkPad: React.FC = () => (
  <g>
    <rect x={-46} y={-16} width={92} height={16} rx={4} fill={B.navy2} stroke={INK} strokeWidth={3} />
    <rect x={-38} y={-21} width={76} height={7} rx={3} fill={B.blueDark} stroke={INK} strokeWidth={2} />
  </g>
);

const FaceIcon: React.FC<{ kind: 'angry' | 'neutral' | 'happy'; r: number }> = ({ kind, r }) => {
  const k = r / 22;
  return (
    <g stroke={INK} strokeWidth={2.6 * k} strokeLinecap="round" fill="none">
      <circle cx={-7 * k} cy={-4 * k} r={2.4 * k} fill={INK} />
      <circle cx={7 * k} cy={-4 * k} r={2.4 * k} fill={INK} />
      {kind === 'angry' && <><path d={`M${-12 * k} ${-12 * k} L${-3 * k} ${-8 * k} M${12 * k} ${-12 * k} L${3 * k} ${-8 * k}`} /><path d={`M${-8 * k} ${10 * k} Q0 ${3 * k} ${8 * k} ${10 * k}`} /></>}
      {kind === 'neutral' && <path d={`M${-8 * k} ${8 * k} L${8 * k} ${8 * k}`} />}
      {kind === 'happy' && <path d={`M${-9 * k} ${5 * k} Q0 ${14 * k} ${9 * k} ${5 * k}`} />}
    </g>
  );
};
/**
 * «قيّم خدمتنا»: three buttons (angry, neutral, happy). Origin at the middle of its base on the counter.
 * `lit` lights a button (0..1); `press` pushes it in; `muffle` 0..1 is the mug sitting on it.
 */
export const RatingBox: React.FC<{ lit?: Partial<Record<'angry' | 'neutral' | 'happy', number>>; press?: Partial<Record<'angry' | 'neutral' | 'happy', number>> }> = ({ lit = {}, press = {} }) => {
  const kinds = ['angry', 'neutral', 'happy'] as const;
  const col = { angry: B.red, neutral: B.grey, happy: B.green };
  return (
    <g>
      <path d={`M-96 0 L-88 -112 L88 -112 L96 0 Z`} fill={B.navy2} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
      <Ar x={-86} y={-110} w={172} h={34} size={22} color={B.white} weight={800} font={TITLE}>قيّم خدمتنا</Ar>
      {kinds.map((kd, i) => {
        // right to left: angry on the right, as the eye meets it first
        const cx = 56 - i * 56, l = clamp01(lit[kd] ?? 0), pr = clamp01(press[kd] ?? 0);
        return (
          <g key={kd} transform={`translate(${cx} ${-42 + pr * 3})`}>
            {l > 0 && <circle r={36} fill={col[kd]} opacity={0.35 * l} />}
            <circle r={24} fill={l > 0 ? col[kd] : '#3A4E78'} stroke={INK} strokeWidth={3} />
            <circle r={24} fill={B.white} opacity={l > 0 ? 0 : 0.18} />
            <FaceIcon kind={kd} r={19} />
          </g>
        );
      })}
    </g>
  );
};

/** The queue number on the wall («الدور»). Origin at its centre. */
export const QueueBox: React.FC<{ n: number; flash?: number }> = ({ n, flash = 0 }) => (
  <g>
    <rect x={-80} y={-62} width={160} height={124} rx={14} fill={B.navy} stroke={INK} strokeWidth={4} />
    <Ar x={-80} y={-60} w={160} h={36} size={24} color={B.blueLight} weight={800} font={TITLE}>الدور</Ar>
    <rect x={-62} y={-22} width={124} height={70} rx={8} fill="#0A1428" />
    <text x={0} y={34} textAnchor="middle" fontFamily={TITLE} fontWeight={800} fontSize={58} fill={flash > 0 ? B.white : '#6FB0EA'} style={{ direction: 'ltr' }}>{n}</text>
  </g>
);

/** The pneumatic chute the opinions arrive by: from above the frame down to a mouth at (0, 0). */
export const Chute: React.FC<{ puff?: number }> = ({ puff = 0 }) => (
  <g>
    <rect x={-40} y={-1400} width={80} height={1380} fill={B.greyLight} stroke={INK} strokeWidth={4} />
    <rect x={-26} y={-1400} width={14} height={1380} fill={B.white} opacity={0.7} />
    {[-1100, -800, -500, -220].map((y) => <rect key={y} x={-48} y={y} width={96} height={22} rx={6} fill={B.greyMid} stroke={INK} strokeWidth={3} />)}
    <path d="M-62 -24 L62 -24 L52 18 L-52 18 Z" fill={B.navy2} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M-48 18 L48 18 L${44} ${18 + 10 + puff * 18} L${-44} ${18 + 10 + puff * 18} Z`} fill={B.navy3} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    {puff > 0 && [-30, 0, 30].map((x, i) => <path key={i} d={`M${x} ${48 + puff * 10} q${(i - 1) * 6} ${12 + puff * 10} ${(i - 1) * 16} ${24 + puff * 18}`} stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" opacity={puff} />)}
  </g>
);

/** The slanted card holder on the counter. Origin at the middle of its base; a card sits at STAND_CARD. */
export const Stand: React.FC = () => (
  <g>
    <path d="M-150 0 L150 0 L132 -196 L-132 -196 Z" fill={B.navy2} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M-138 -8 L138 -8 L122 -186 L-122 -186 Z" fill={B.navy3} />
    <rect x={-150} y={-22} width={300} height={22} rx={6} fill={B.blueDark} stroke={INK} strokeWidth={3.4} />
  </g>
);
export const STAND_CARD = { dx: 0, dy: -104 };

/** The ceiling sign. Origin at its centre. */
export const Sign: React.FC = () => (
  <g>
    {[-260, 260].map((x) => <path key={x} d={`M${x} -170 L${x} -78`} stroke={INK} strokeWidth={5} />)}
    <rect x={-400} y={-78} width={800} height={156} rx={22} fill={B.navy} stroke={INK} strokeWidth={5} />
    <rect x={-384} y={-62} width={768} height={124} rx={14} fill="none" stroke={B.blue} strokeWidth={3} />
    <Ar x={-390} y={-64} w={780} h={86} size={58} color={B.white} weight={800} font={TITLE} lh={1}>خدمة عملاء آراء الناس</Ar>
    <Ar x={-390} y={14} w={780} h={44} size={28} color={B.blueLight} weight={700} lh={1}>دوام 24 ساعة · 7 أيام</Ar>
  </g>
);

/** The plate on the counter front; `flip` 0→1 turns it over from `a` to `b`. Origin at its centre. */
export const Nameplate: React.FC<{ a: string; b?: string; flip?: number; glow?: number }> = ({ a, b, flip = 0, glow = 0 }) => {
  const sy = Math.abs(Math.cos(flip * Math.PI));
  const text = flip < 0.5 || !b ? a : b;
  return (
    <g transform={`scale(1 ${Math.max(0.02, sy)})`}>
      {glow > 0 && <rect x={-226} y={-48} width={452} height={96} rx={18} fill={B.blue} opacity={0.3 * glow} />}
      <rect x={-210} y={-36} width={420} height={72} rx={12} fill={B.white} stroke={INK} strokeWidth={4} />
      <Ar x={-206} y={-34} w={412} h={68} size={36} color={B.navy} weight={800} font={TITLE} lh={1}>{text}</Ar>
    </g>
  );
};

/** The archive: an open bin on the counter (origin at the middle of its base). Cards dropped in go between back and front. */
export const ArchiveBack: React.FC = () => (
  <path d="M-62 -104 L62 -104 L58 0 L-58 0 Z" fill={B.navy3} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
);
export const ArchiveFront: React.FC = () => (
  <g>
    <path d="M-66 -70 L66 -70 L60 0 L-60 0 Z" fill={B.greyMid} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <Ar x={-62} y={-66} w={124} h={60} size={25} color={B.navy} weight={800} font={TITLE} lh={1}>الأرشيف</Ar>
  </g>
);
/** Top of the bin's opening (world y offset from its base). */
export const BIN_TOP = -104;

/** The response policy: a sheet with its rule written in and the «معتمد» stamp. Origin at its centre. */
export const Policy: React.FC<{ written: number; stampP: number }> = ({ written, stampP }) => (
  <g>
    <rect x={-150} y={-110} width={300} height={220} rx={8} fill={B.paper} stroke={INK} strokeWidth={3.6} />
    <rect x={-150} y={-110} width={300} height={44} rx={8} fill={B.blue} />
    <Ar x={-146} y={-110} w={292} h={44} size={28} color={B.white} weight={800} font={TITLE} lh={1}>سياسة الرد</Ar>
    <g clipPath="url(#policy-write)">
      <Ar x={-140} y={-58} w={280} h={100} size={36} weight={800} lh={1.25} font={TITLE}>بعد 7 دقائق و30 ثانية</Ar>
    </g>
    <defs><clipPath id="policy-write"><rect x={150 - 300 * clamp01(written)} y={-60} width={300 * clamp01(written)} height={110} /></clipPath></defs>
    <g transform="translate(40 70)"><Imprint text="معتمد" color={B.red} p={stampP} w={150} size={30} /></g>
  </g>
);

/**
 * The client's logo on the laptop (screen content, 640×400). `drawn` 0 = an empty canvas with a dashed circle,
 * 1 = the logo; `type` 0.55 = the café name too small (yesterday's version), 1 = the fixed, readable size.
 */
export const LogoScreen: React.FC<{ drawn: number; type?: number; caret?: boolean; sent?: number }> = ({ drawn, type = 0.55, caret = false, sent = 0 }) => {
  const d = clamp01(drawn);
  return (
    <g>
      <rect width={640} height={400} fill="#DCE4EE" />
      <rect width={640} height={40} fill={B.navy2} />
      {[0, 1, 2].map((i) => <circle key={i} cx={610 - i * 24} cy={20} r={7} fill={B.greyMid} />)}
      <rect x={14} y={54} width={46} height={330} rx={8} fill={B.white} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={24} y={68 + i * 54} width={26} height={26} rx={6} fill={i === 1 ? B.blue : B.greyLight} />)}
      <rect x={80} y={54} width={546} height={330} rx={8} fill={B.white} />
      <circle cx={353} cy={190} r={92} fill="none" stroke={B.greyMid} strokeWidth={4} strokeDasharray="12 10" opacity={1 - d} />
      <g opacity={d} transform="translate(353 172)">
        <path d="M-70 18 q-36 0 -30 -32 q6 -28 36 -20 q10 -36 50 -30 q34 6 34 36 q32 -2 30 26 q-2 22 -30 20 Z" fill={B.blueLight} stroke={B.blue} strokeWidth={6} strokeLinejoin="round" />
        <path d="M-26 6 L26 6 L20 44 Q0 52 -20 44 Z" fill={B.white} stroke={B.navy} strokeWidth={6} strokeLinejoin="round" />
        <path d="M24 16 q18 0 14 14 q-3 9 -16 8" fill="none" stroke={B.navy} strokeWidth={6} />
        <text x={0} y={98 + 30 * type} textAnchor="middle" fontFamily={TITLE} fontWeight={800} fontSize={52 * type} fill={B.navy} style={{ direction: 'rtl' }}>مقهى غيمة</text>
      </g>
      {caret && <rect x={340} y={300} width={4} height={40} fill={B.navy} />}
      {sent > 0 && <g transform="translate(353 360)">
        <rect x={-150} y={-20} width={300} height={40} rx={20} fill={B.navy2} />
        <rect x={-146} y={-16} width={292 * clamp01(sent)} height={32} rx={16} fill={B.green} />
        <Ar x={-150} y={-20} w={300} h={40} size={22} color={B.white} weight={800} lh={1}>{sent >= 1 ? 'تم الإرسال' : 'جارٍ الإرسال…'}</Ar>
      </g>}
    </g>
  );
};

/** A sticky note (light blue, never yellow), origin at its centre. */
export const Sticky: React.FC<{ text: string; w?: number; size?: number; rot?: number }> = ({ text, w = 150, size = 30, rot = 4 }) => (
  <g transform={`rotate(${rot})`}>
    <rect x={-w / 2 + 4} y={-w * 0.36 + 6} width={w} height={w * 0.72} fill={B.navy} opacity={0.15} />
    <rect x={-w / 2} y={-w * 0.36} width={w} height={w * 0.72} fill={B.blueLight} stroke={INK} strokeWidth={3} />
    <rect x={-w / 2} y={-w * 0.36} width={w} height={12} fill={B.blue} opacity={0.6} />
    <Ar x={-w / 2 + 6} y={-w * 0.36 + 12} w={w - 12} h={w * 0.72 - 14} size={size} weight={800} font={TITLE} lh={1.15}>{text}</Ar>
  </g>
);

/** Flying paper for the flood: a small card at an angle (text unreadable on purpose, except where the shot asks). */
export const Flyer: React.FC<{ seed: number; s?: number }> = ({ seed, s = 1 }) => {
  const w = 120 * s, h = 74 * s;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={B.white} stroke={INK} strokeWidth={2.6} />
      <rect x={-w / 2 + 2} y={-h / 2 + 2} width={w - 4} height={9 * s} rx={3} fill={hash(seed) > 0.8 ? B.blue : B.greyLight} />
      {[0, 1].map((i) => <rect key={i} x={-w / 2 + 12 * s} y={-h / 2 + (22 + i * 18) * s} width={(w - 40 * s) * (0.5 + hash(seed + i) * 0.5)} height={7 * s} rx={3} fill={B.greyMid} />)}
    </g>
  );
};

/** A chat bubble for the phone inserts (HTML-free SVG; RTL text). Origin at the bubble's top corner on its own side. */
export const Bubble: React.FC<{ text: string; mine?: boolean; w?: number; h?: number; size?: number; time?: string }> = ({ text, mine = false, w = 300, h = 86, size = 30, time }) => (
  <g transform={`translate(${mine ? 0 : -w} 0)`}>
    <rect width={w} height={h} rx={22} fill={mine ? B.blueLight : B.white} stroke={INK} strokeWidth={2.4} />
    <Ar x={14} y={4} w={w - 28} h={h - (time ? 26 : 8)} size={size} weight={700} align="right" lh={1.3}>{text}</Ar>
    {time && <text x={18} y={h - 12} fontFamily={BODY} fontWeight={700} fontSize={18} fill={B.grey} style={{ direction: 'ltr' }}>{time}</text>}
  </g>
);

/** A chat screen with large type for the phone inserts (authored 360×720, like the film's phone screens). */
export const ChatBig: React.FC<{ name: string; avatar?: string; children?: React.ReactNode; draft?: string; caret?: boolean; sendGlow?: number; clock?: string }> = ({ name, avatar = B.grey, children, draft, caret, sendGlow = 0, clock = '4:00' }) => (
  <g>
    <rect width={360} height={720} fill="#E9EEF4" />
    <rect width={360} height={96} fill={B.white} />
    <text x={22} y={28} fontFamily={BODY} fontWeight={700} fontSize={16} fill={INK} style={{ direction: 'ltr' }}>{clock}</text>
    <circle cx={318} cy={62} r={20} fill={avatar} stroke={INK} strokeWidth={2} />
    <Ar x={30} y={42} w={262} h={40} size={24} weight={800} align="right" lh={1}>{name}</Ar>
    <rect y={95} width={360} height={2} fill={B.greyLight} />
    {children}
    <rect y={604} width={360} height={116} fill={B.white} />
    <rect x={64} y={616} width={282} height={92} rx={26} fill="#F1F4F8" stroke={B.greyLight} strokeWidth={2} />
    {draft !== undefined && <Ar x={76} y={618} w={258} h={88} size={27} weight={700} align="right" lh={1.25}>{draft}{caret ? '|' : ''}</Ar>}
    <circle cx={34} cy={662} r={24} fill={sendGlow > 0 ? B.blue : B.greyMid} />
    <path d="M24 662 L44 654 L38 662 L44 670 Z" fill={B.white} transform="rotate(180 34 662)" />
  </g>
);

/** A small digit-free timer pill («2 ث» style) for the callback, origin at its centre. */
export const Pill: React.FC<{ text: string; color?: string; o?: number; size?: number; w?: number }> = ({ text, color = B.green, o = 1, size = 30, w = 150 }) => (
  o <= 0 ? null : <g opacity={o}>
    <rect x={-w / 2} y={-size * 0.85} width={w} height={size * 1.7} rx={size * 0.85} fill={color} stroke={INK} strokeWidth={3} />
    <Ar x={-w / 2} y={-size * 0.85} w={w} h={size * 1.7} size={size} color={B.white} weight={800} font={TITLE} lh={1}>{text}</Ar>
  </g>
);

export { rrect };
