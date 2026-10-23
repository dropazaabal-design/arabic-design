import React from 'react';
import { Character } from '../../../films/hudoo/src/kit/characters/Character';
import { EXPRESSIONS, type Face } from '../../../films/hudoo/src/kit/characters/face';
import { pose } from '../../../films/hudoo/src/kit/characters/skeleton';
import { BODY, C, Chip, Note, PAGE_H, PAGE_W, Page, PenHand, Phone, SvgTxt, Txt, ease, mix, p, page, phoneDims, thumb } from './parts';
import { TOTAL, w } from './timing';

// Seven scenes on a 1080×1350 stage (the 4:5 safe area; the 9:16 film extends the background around it).
// Every key action is on a spoken word: w(line, word) is that word's frame.
export type Scene = React.FC<{ f: number }>;
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1080} height={1350} viewBox="0 0 1080 1350" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>{children}</svg>;
const face = (base: keyof typeof EXPRESSIONS, o: Partial<Face> = {}): Face => ({ ...EXPRESSIONS[base], ...o });
const k = (f: number, keys: [number, number][], e = ease.inOut) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; return mix(va, vb, e((f - a) / Math.max(1, b - a))); }
  return keys[keys.length - 1][1];
};
const blink = (f: number, seed: number) => { const per = 200 + seed * 23, ph = (f + seed * 37) % per; return ph < 7 ? Math.sin((ph / 7) * Math.PI) : 0; };

// ——— 1. The hook: an endless "saved" feed; the product opens in the phone; the 50 maps spread out ———
const SAVED = ['عادات الصباح', 'إدارة الوقت', 'خطة ادخار', 'كيف تركّز؟', 'لا تؤجّل', 'تنظيم المهام', 'قبل أن تقرّر', 'هدوء الأعصاب', 'نصيحة مالية', 'فن الإنصات',
  'روتين النوم', 'قوة البدايات', 'حدودك الشخصية', 'العمل العميق', 'كتب تغيّرك', 'خطة الأسبوع', 'التحفيز', 'ترتيب الأولويات', 'التواصل', 'الانضباط'];
const THUMB = [C.blue, C.navy2, C.green, '#5B7BD9', '#2C4A9A', '#3E7FA8'];
const Feed: React.FC<{ f: number; sw: number; sh: number }> = ({ f, sw, sh }) => {
  const stop = w(1, 6) + 14;
  // scroll position: speed ramps up, then the thumb stops on «تحتاجها»
  const speed = (t: number) => (t < stop ? 3 + 22 * Math.min(1, t / stop) ** 2 : 0);
  let y = 0; for (let t = 0; t < f; t++) y += speed(t) * (t > stop - 12 ? (stop - t) / 12 : 1);
  const cw = (sw - 3 * 16) / 2, ch = 286;
  return (
    <g>
      <rect width={sw} height={sh} fill={C.sky} />
      <g transform={`translate(0 ${-y})`}>
        {Array.from({ length: 40 }, (_, i) => {
          const col = i % 2, row = Math.floor(i / 2), x = sw - 16 - (col + 1) * cw - col * 16, yy = 150 + row * (ch + 16);
          return <g key={i}>
            <rect x={x} y={yy} width={cw} height={ch} rx={18} fill={C.white} stroke={C.grid} strokeWidth={2} />
            <rect x={x + 10} y={yy + 10} width={cw - 20} height={150} rx={12} fill={THUMB[i % THUMB.length]} opacity={0.9} />
            <circle cx={x + cw / 2} cy={yy + 85} r={30} fill={C.white} opacity={0.25} />
            <path d={`M${x + cw - 46} ${yy + 22} h22 v30 l-11 -8 l-11 8 Z`} fill={C.white} />
            <SvgTxt x={x + 12} y={yy + 168} w={cw - 24} h={70} size={26} align="right">{SAVED[i % SAVED.length]}</SvgTxt>
            <rect x={x + cw - 130} y={yy + 248} width={118} height={10} rx={5} fill={C.grid} />
          </g>;
        })}
      </g>
      <rect width={sw} height={136} fill={C.white} />
      <SvgTxt x={24} y={52} w={sw - 48} h={70} size={36} weight={800} align="right">المحفوظات</SvgTxt>
      <path d={`M${44} ${66} h26 v36 l-13 -10 l-13 10 Z`} fill={C.blue} />
      <rect y={135} width={sw} height={2} fill={C.grid} />
    </g>
  );
};

const TILE = { w: 82, h: 116, gap: 8, rowGap: 18, x1: 905, y0: 318 };
const AXES = ['المال', 'الإنتاجية', 'العادات', 'علم النفس', 'العلاقات'];
/** The pages of the 50 rules (the three templates, PDF pages 14, 25 and 36, are not rules). */
const RULE_PAGES = Array.from({ length: 53 }, (_, i) => i + 4).filter((n) => n !== 14 && n !== 25 && n !== 36);
const tilePos = (i: number) => { const r = Math.floor(i / 10), c = i % 10; return { x: TILE.x1 - (c + 1) * TILE.w - c * TILE.gap, y: TILE.y0 + r * (TILE.h + TILE.rowGap) }; };

export const S1: Scene = ({ f }) => {
  const P = { cx: 540, cy: 690, w: 520 };
  const { sw, sh } = phoneDims(P.w);
  const coverIn = p(f, w(1, 6) + 14, 22, ease.out);
  const spread = w(2, 3) - 12;
  const phoneOut = p(f, spread, 24);
  const curious = w(2, 0);
  const headTurn = k(f, [[0, 0.55], [w(1, 3), 0.75], [curious, 0.6]]);
  return (
    <>
      <Svg>
        {phoneOut < 1 && (
          <g transform={`translate(${540 * (1 - mix(1, 0.45, phoneOut))} ${640 * (1 - mix(1, 0.45, phoneOut))}) scale(${mix(1, 0.45, phoneOut)})`} opacity={1 - phoneOut}>
            <Phone {...P} screenBg={C.sky}>
              <Feed f={f} sw={sw} sh={sh} />
              {coverIn > 0 && <g transform={`translate(0 ${(1 - coverIn) * sh})`}>
                <rect width={sw} height={sh} fill={C.navy} />
                <image href={page(1)} x={0} y={(sh - sw * PAGE_H / PAGE_W) / 2} width={sw} height={sw * PAGE_H / PAGE_W} />
              </g>}
            </Phone>
          </g>
        )}
        {f >= spread && RULE_PAGES.map((n, i) => {
          const t = p(f, spread + 4 + i * 2, 20, ease.out), q = tilePos(i);
          const glow = i === 10 ? p(f, w(2, 7) + 8, 14) : 0;
          return <g key={n} opacity={t} transform={`translate(${mix(540 - TILE.w / 2, q.x, t)} ${mix(640, q.y, t)}) scale(${mix(0.4, 1, t)})`}>
            <rect x={3} y={6} width={TILE.w} height={TILE.h} rx={5} fill={C.navy} opacity={0.15} />
            <image href={thumb(n)} width={TILE.w} height={TILE.h} />
            <rect width={TILE.w} height={TILE.h} rx={5} fill="none" stroke={glow > 0 ? C.green : C.grid} strokeWidth={glow > 0 ? 3 + glow * 4 : 1.5} />
          </g>;
        })}
        <Character who="salim" x={170} y={1912} s={2.4} facing={1} blink={blink(f, 3)}
          p={pose({ turn: headTurn, body: 0.35, head: k(f, [[0, 8], [w(1, 3), -2], [curious, 4]]), R: { sh: -6, el: 8 }, L: { sh: 6, el: 8 } })}
          face={f < w(1, 3) ? face('neutral', { look: [0.8, -0.3] }) : f < curious ? face('anxious', { look: [0.9, -0.4] }) : face('listening', { look: [0.9, -0.5], mouth: 0.4 })} />
      </Svg>
      {f >= spread && AXES.map((a, r) => <Txt key={a} x={915} y={TILE.y0 + r * (TILE.h + TILE.rowGap) + 34} w={150} size={30} weight={700} font={BODY} align="right" color={C.navy} o={p(f, w(2, 4) + r * 4, 12)}>{a}</Txt>)}
      <Txt x={0} y={14} w={1080} size={64} color={C.navy} o={p(f, 6, 12) * (1 - p(f, w(1, 6) + 14, 14))}>محفوظ… لكنه غائب</Txt>
      <Chip x={610} y={1270} o={p(f, w(2, 0), 12) * (1 - p(f, spread, 10))} size={40} bg={C.white} color={C.navy} border={`3px solid ${C.blueSoft}`}>من كتاب وبس</Chip>
      <Chip x={600} y={1090} o={p(f, w(2, 6), 14, ease.back)} size={52}>صفحة واحدة لكل فكرة</Chip>
    </>
  );
};

// ——— 2. Too many tasks: sticky notes pile up around him ———
export const TASKS = ['عرض العميل غدًا', 'خطة الأسبوع', 'رسائل المجموعة', 'تصفّح بلا هدف', 'فواتير الشهر', 'تقرير العمل', 'موعد الطبيب'];
const NOTE_RING: [number, number, number][] = [[250, 300, -8], [820, 290, 6], [170, 560, 5], [900, 560, -6], [300, 800, 7], [800, 820, -4], [540, 200, 3]];
export const S2: Scene = ({ f }) => {
  const a = w(3, 0) - 9;
  const stress = p(f, w(3, 1), 16);
  return (
    <>
      <Svg>
        <rect x={0} y={1210} width={1080} height={140} fill={C.desk} />
        <path d="M0 1210 H1080" stroke={C.deskEdge} strokeWidth={4} />
        <Character who="salim" x={540} y={1250} s={2.55} facing={1} blink={blink(f, 5)}
          p={pose({ turn: 0.05, body: 0.05, head: mix(0, 8, stress), bob: mix(0, 6, stress), R: { hand: [mix(-30, -56, stress), mix(-150, -262, stress)], bend: -1 }, L: { hand: [mix(30, 56, stress), mix(-150, -262, stress)], bend: 1 } })}
          hands={{ R: 'open', L: 'open' }} face={face('anxious', { look: [0, -0.2], open: 1.15 })} />
        {TASKS.map((t, i) => {
          const at = a + 4 + i * 8, o = p(f, at, 12, ease.back);
          const [x, y, r] = NOTE_RING[i];
          const bob = Math.sin((f - at) / 9 + i) * 4;
          return <Note key={t} x={x} y={y + bob} text={t} rot={r} o={o} s={mix(0.5, 1, Math.min(1, o))} />;
        })}
      </Svg>
    </>
  );
};

// ——— 3. The Eisenhower map: tapped in the library's own index, then lifted out of the phone ———
// Positions on the real pages, in 827-wide page units.
const INDEX_ROW = { x: 62, y: 280, w: 335, h: 24 }; // «مصفوفة أيزنهاور» in the index (p03)
const Q = { tr: { x: 411, y: 318, w: 321, h: 372 }, tl: { x: 79, y: 318, w: 321, h: 372 } }; // quadrants on p15 (rule 11)
export const S3: Scene = ({ f }) => {
  const P = { cx: 540, cy: 660, w: 500 };
  const { sw, sh } = phoneDims(P.w);
  const ps = sw / PAGE_W, py = 70;
  const tap = w(4, 1);
  const lift = p(f, w(4, 2) - 6, 26);
  const zoom = mix(1, 1.15, p(f, w(4, 4), 40));
  const PW = 980, sc = PW / PAGE_W, x0 = 50, y0 = 20;
  const hl = (q: { x: number; y: number; w: number; h: number }, at: number, color: string) => {
    const o = p(f, at - 4, 12);
    return o > 0 && <rect x={x0 + q.x * sc - 6} y={y0 + q.y * sc - 6} width={q.w * sc + 12} height={q.h * sc + 12} rx={22} fill="none" stroke={color} strokeWidth={8 + 3 * Math.sin((f - at) / 7)} opacity={o} />;
  };
  return (
    <Svg>
      {lift < 1 && <g opacity={1 - lift}>
        <Phone {...P}>
          <rect width={sw} height={sh} fill={C.white} />
          <image href={page(3)} x={0} y={py} width={sw} height={sw * PAGE_H / PAGE_W} />
          {f > tap - 6 && <rect x={INDEX_ROW.x * ps - 4} y={py + INDEX_ROW.y * ps - 4} width={INDEX_ROW.w * ps + 8} height={INDEX_ROW.h * ps + 8} rx={6} fill={C.green} opacity={0.22 * p(f, tap - 6, 6)} />}
          {f > tap && f < tap + 30 && <circle cx={(INDEX_ROW.x + INDEX_ROW.w / 2) * ps} cy={py + (INDEX_ROW.y + INDEX_ROW.h / 2) * ps} r={10 + (f - tap) * 1.6} fill="none" stroke={C.green} strokeWidth={4} opacity={1 - (f - tap) / 30} />}
        </Phone>
      </g>}
      {lift > 0 && <g transform={`translate(540 830) scale(${zoom}) translate(-540 -830)`}>
        <g transform={`translate(${mix(P.cx - (P.w * 0.45) / 2, x0, lift)} ${mix(P.cy - 200, y0, lift)}) scale(${mix(0.45 * (P.w / PW), 1, lift)})`}>
          <Page n={15} x={0} y={0} w={PW} />
        </g>
        {lift >= 1 && <>{hl(Q.tr, w(4, 6), C.red)}{hl(Q.tl, w(4, 7), C.green)}</>}
      </g>}
    </Svg>
  );
};

// ——— 4. The priorities template, printed on the desk; the tasks go into their quarters; the next step is circled ———
const SHEET = { x: 90, y: 20, w: 900, rot: -1.2 };
const sp = (px: number, py: number): [number, number] => [SHEET.x + px * (SHEET.w / PAGE_W), SHEET.y + py * (SHEET.w / PAGE_W)];
const SLOTS: [number, number][] = [sp(586, 528), sp(240, 528), sp(586, 940), sp(240, 940)]; // افعل الآن، جدول لاحقًا، فوّض، احذف
export const S4: Scene = ({ f }) => {
  const a = w(5, 0) - 6;
  const sheetIn = p(f, a, 24, ease.out);
  const next = w(5, 6);
  const ring = p(f, next + 4, 40);
  const handIn = p(f, next - 14, 18, ease.out);
  const ang = (f - next) / 9;
  return (
    <>
      <Svg>
        <rect width={1080} height={1350} fill={C.desk} />
        <g transform={`translate(540 640) scale(${1 + 0.06 * p(f, w(5, 3), 150, (t) => t)}) translate(-540 -640) translate(0 ${(1 - sheetIn) * -1400}) rotate(${SHEET.rot + (1 - sheetIn) * 6} 540 700)`}>
          <Page n={25} x={SHEET.x} y={SHEET.y} w={SHEET.w} />
          {TASKS.slice(0, 4).map((t, i) => {
            const at = w(5, 1) + i * 9, o = p(f, at, 20, ease.out);
            const [x, y] = SLOTS[i];
            const dim = i === 0 ? 1 : 1 - 0.4 * p(f, next, 14);
            return <g key={t} opacity={dim}><Note x={mix(-200, x, o)} y={mix(650, y, o)} text={t} w={290} h={110} rot={mix(-14, i % 2 ? 3 : -3, o)} o={o} ring={i === 0 ? ring : 0} /></g>;
          })}
        </g>
        {handIn > 0 && <PenHand x={SLOTS[0][0] + 205 + Math.cos(ang) * 16} y={SLOTS[0][1] + 92 + Math.sin(ang) * 10 + (1 - handIn) * 700} s={6.5} />}
      </Svg>
      <Chip x={270} y={196} o={p(f, a + 20, 12)} size={34} bg={C.blueSoft} color={C.navy}>مثال توضيحي</Chip>
      <Chip x={SLOTS[0][0] - 20} y={SLOTS[0][1] + 122} o={p(f, next + 30, 12, ease.back)} size={38} bg={C.green}>ابدأ من هنا</Chip>
    </>
  );
};

// ——— 5. The breadth: one real map per area, dealt on a deck as each is named ———
const DECK: [number, number, string][] = [[15, -1, 'الإنتاجية'], [4, 2, 'المال'], [26, 3, 'العادات'], [37, 4, 'علم النفس'], [52, 6, 'العلاقات']];
export const S5: Scene = ({ f }) => {
  const start = w(6, 0) - 7;
  const times = DECK.map(([, wi]) => (wi < 0 ? start : w(6, wi)));
  const top = times.filter((t) => f >= t - 4).length - 1;
  const CW = 620, cx = 230, cy = 120;
  return (
    <>
      <Svg>
        {DECK.map(([n], i) => {
          if (f < times[i] - 4) return null;
          const tin = i === 0 ? 1 : p(f, times[i] - 4, 16, ease.out);
          const depth = top - i;
          const x = mix(-760, cx, tin) + depth * 56, y = cy + depth * 18, rot = mix(-8, 0, tin) + depth * 3;
          return <g key={n} opacity={depth > 2 ? 0 : 1 - depth * 0.18} transform={`translate(${x} ${y}) rotate(${rot} ${CW / 2} 440) scale(${1 - depth * 0.05})`}><Page n={n} x={0} y={0} w={CW} /></g>;
        })}
      </Svg>
      <Chip x={cx + CW / 2} y={cy - 30} o={1} size={44} bg={C.blue}>{DECK[top][2]}</Chip>
      <div dir="rtl" style={{ position: 'absolute', left: 40, top: 1150, width: 1000, display: 'flex', justifyContent: 'center', gap: 12 }}>
        {DECK.map(([, , a], i) => <div key={a} style={{ fontFamily: BODY, fontWeight: 700, fontSize: 32, color: i <= top ? C.white : C.grey, background: i <= top ? C.navy : C.blueSoft, borderRadius: 999, padding: '4px 22px 10px', opacity: i <= top ? 1 : 0.6 }}>{a}</div>)}
      </div>
      <Txt x={0} y={1225} w={1080} size={46} color={C.navy} o={p(f, w(6, 6) + 20, 14)}>5 محاور · 50 خريطة</Txt>
    </>
  );
};

// ——— 6. Not instead of reading: he reads a book; the map is there when he needs it ———
const Shelf: React.FC = () => (
  <g>
    <rect x={60} y={170} width={300} height={720} rx={8} fill="#C8D3E6" stroke={C.deskEdge} strokeWidth={4} />
    {[0, 1, 2].map((r) => <g key={r}>
      <rect x={70} y={410 + r * 230} width={280} height={12} fill={C.deskEdge} />
      {Array.from({ length: 7 }, (_, i) => <rect key={i} x={84 + i * 37} y={250 + r * 230 - (i % 3) * 10} width={30} height={160 + (i % 3) * 10} rx={4} fill={[C.navy2, C.blue, C.green, '#5B7BD9', C.navy, '#3E7FA8', '#7C8DB5'][(i + r) % 7]} />)}
    </g>)}
  </g>
);
export const S6: Scene = ({ f }) => {
  const turn = w(7, 3), glance = w(7, 5), nodAt = w(7, 8);
  const lookPhone = p(f, glance, 14);
  const nod = f > nodAt && f < nodAt + 30 ? Math.sin(((f - nodAt) / 30) * Math.PI * 2) * 6 : 0;
  const s = 2.3, X = 520, Y = 1180;
  const bookX = X + 70 * s, bookY = Y - 200 * s;
  const flip = p(f, turn, 16);
  return (
    <>
      <Svg>
        <rect x={0} y={1180} width={1080} height={170} fill={C.desk} />
        <Shelf />
        <path d="M330 1180 h420 v-180 q0 -40 -40 -40 h-340 q-40 0 -40 40 Z" fill="#7C8DB5" stroke="#2A2F3A" strokeWidth={4} />
        <Character who="salim" x={X} y={Y} s={s} facing={1} blink={blink(f, 7)}
          p={pose({ sit: 1, lean: mix(6, 0, lookPhone), head: mix(16, -2, lookPhone) + nod, turn: mix(0.5, 0.85, lookPhone), footR: [52, 0], footL: [64, 0], R: { hand: [62, -198] }, L: { hand: [78, -196] } })}
          hands={{ R: 'grip', L: 'grip' }}
          face={lookPhone < 0.5 ? face('calm', { look: [0.4, 0.7] }) : face('smile', { look: [1, 0.2] })} />
        <g transform={`translate(${bookX} ${bookY})`}>
          <path d="M-90 0 L0 12 L90 0 L90 -70 L0 -58 L-90 -70 Z" fill={C.white} stroke="#2A2F3A" strokeWidth={4} strokeLinejoin="round" />
          <path d="M0 12 V-58" stroke="#2A2F3A" strokeWidth={3} />
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M${-78} ${-52 + i * 13} L-14 ${-44 + i * 13} M14 ${-44 + i * 13} L78 ${-52 + i * 13}`} stroke={C.grid} strokeWidth={4} />)}
          {flip > 0 && flip < 1 && <path d={`M0 12 L${90 * Math.cos(flip * Math.PI)} 0 L${90 * Math.cos(flip * Math.PI)} -70 L0 -58 Z`} fill={C.sky} stroke="#2A2F3A" strokeWidth={3} />}
        </g>
        <rect x={830} y={980} width={170} height={200} fill="#C8D3E6" stroke={C.deskEdge} strokeWidth={4} />
        <Phone cx={915} cy={890} w={130} rot={-8} screenBg="#0A1024" o={1}>
          <rect width={130} height={260} fill={C.white} opacity={lookPhone} />
          <image href={page(15)} x={0} y={30} width={phoneDims(130).sw} height={phoneDims(130).sw * PAGE_H / PAGE_W} opacity={lookPhone} />
        </Phone>
        {lookPhone > 0 && <circle cx={915} cy={890} r={150} fill={C.blue} opacity={0.08 * lookPhone} />}
      </Svg>
      <Txt x={40} y={56} w={1000} size={54} color={C.navy} o={p(f, w(7, 4), 14)}>الكتاب للعمق · والخريطة للتطبيق</Txt>
    </>
  );
};

// ——— 7. How it comes: on the phone, printed (the 3 templates), instantly, and the price ———
const Printer: React.FC<{ x: number; y: number; out: number; f: number }> = ({ x, y, out, f }) => (
  <g>
    {[36, 25, 14].map((n, i) => {
      const t = p(f, out + i * 12, 22, ease.out);
      return t > 0 && <g key={n} transform={`translate(${x - 100 + (i - 1) * 70 * t} ${y + 40 + t * 160}) rotate(${(i - 1) * 8 * t})`}><Page n={n} x={0} y={0} w={200} /></g>;
    })}
    <rect x={x - 170} y={y - 120} width={340} height={170} rx={26} fill="#C8D3E6" stroke="#2A2F3A" strokeWidth={5} />
    <rect x={x - 130} y={y - 160} width={260} height={50} rx={10} fill={C.white} stroke="#2A2F3A" strokeWidth={4} />
    <rect x={x - 130} y={y + 30} width={260} height={16} rx={6} fill="#2A2F3A" />
    <circle cx={x + 120} cy={y - 70} r={10} fill={C.green} />
  </g>
);
export const S7: Scene = ({ f }) => {
  const phone = w(8, 2), print = w(8, 4), fast = w(8, 5), price = w(8, 7);
  const P = { cx: 290, cy: 520, w: 360 };
  const { sw, sh } = phoneDims(P.w);
  const scroll = (f - (w(8, 0) - 7)) * 0.6;
  const dl = p(f, fast, 28, (t) => t);
  return (
    <>
      <Svg>
        <g transform={`translate(${P.cx} ${P.cy}) scale(${1 + 0.04 * Math.max(0, Math.sin(((f - phone) / 24) * Math.PI)) * (f > phone && f < phone + 24 ? 1 : 0)}) translate(${-P.cx} ${-P.cy})`}>
          <Phone {...P}>
            <rect width={sw} height={sh} fill="#E9EDF4" />
            {[15, 16].map((n, i) => <image key={n} href={page(n)} x={10} y={60 + i * ((sw - 20) * PAGE_H / PAGE_W + 12) - Math.min(scroll, 190)} width={sw - 20} height={(sw - 20) * PAGE_H / PAGE_W} />)}
            {dl > 0 && <g transform={`translate(${sw / 2} ${sh / 2})`} opacity={1 - p(f, fast + 60, 14)}>
              <circle r={86} fill={C.white} opacity={0.94} />
              <circle r={64} fill="none" stroke={C.blueSoft} strokeWidth={12} />
              <circle r={64} fill="none" stroke={C.green} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={`${dl} 1`} transform="rotate(-90)" />
              {dl >= 1 && <path d="M-26 2 L-6 22 L28 -18" fill="none" stroke={C.green} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />}
            </g>}
          </Phone>
        </g>
        <Printer x={790} y={300} out={print} f={f} />
      </Svg>
      <Chip x={290} y={938} o={p(f, phone, 12)} size={40} bg={C.white} color={C.navy} border={`3px solid ${C.blueSoft}`}>ملف PDF</Chip>
      <Chip x={790} y={855} o={p(f, print + 30, 12)} size={40} bg={C.white} color={C.navy} border={`3px solid ${C.blueSoft}`}>3 قوالب للطباعة</Chip>
      <Chip x={540} y={70} o={p(f, fast, 12)} size={44} bg={C.green}>تحميل فوري بعد الدفع</Chip>
      {f > price - 6 && <div dir="rtl" style={{ position: 'absolute', left: 290, top: 1010, width: 500, height: 280, background: C.white, borderRadius: 36, boxShadow: '0 14px 40px rgba(11,29,77,0.18)', border: `4px solid ${C.blueSoft}`, opacity: p(f, price - 6, 12), transform: `scale(${mix(0.85, 1, p(f, price - 6, 16, ease.back))})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 800, fontSize: 120, color: C.navy, lineHeight: 1.05 }}>44 ريالًا</div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 36, color: C.grey }}>سعودي · دفعة واحدة</div>
      </div>}
    </>
  );
};

// ——— 8. The call to action: the cover, the name, the address, held long enough to read ———
export const S8: Scene = ({ f }) => {
  const a = w(9, 0) - 20;
  const coverIn = p(f, a, 26, ease.out);
  const urlPulse = f > w(9, 6) && f < w(9, 6) + 30 ? Math.sin(((f - w(9, 6)) / 30) * Math.PI) * 0.06 : 0;
  return (
    <>
      <Svg>
        <g transform={`translate(0 ${(1 - coverIn) * 80})`} opacity={coverIn}>
          <Page n={1} x={330} y={50} w={420} rot={-3} />
        </g>
      </Svg>
      <Txt x={0} y={680} w={1080} size={88} color={C.white} o={p(f, w(9, 2), 14)}>مكتبة الوعي البصري</Txt>
      <div style={{ position: 'absolute', left: 540, top: 900, transform: `translate(-50%, -50%) scale(${(0.9 + 0.1 * p(f, w(9, 5), 14, ease.back)) + urlPulse})`, opacity: p(f, w(9, 5), 12), background: C.white, borderRadius: 999, padding: '10px 54px 18px', fontFamily: BODY, fontWeight: 700, fontSize: 76, color: C.navy, direction: 'ltr', whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>kitabwbs.com</div>
      <Txt x={0} y={1010} w={1080} size={38} weight={700} font={BODY} color={C.blueSoft} o={p(f, w(9, 9), 14)}>50 خريطة · 3 قوالب · PDF · 44 ريالًا</Txt>
      <Txt x={0} y={1160} w={1080} size={40} color={C.blueSoft} o={p(f, w(9, 9) + 20, 14)}>كتاب وبس</Txt>
    </>
  );
};

/** Scene windows: each starts a few frames before its first word. */
export const CUTS = [0, w(3, 0) - 9, w(4, 0) - 7, w(5, 0) - 6, w(6, 0) - 7, w(7, 0) - 7, w(8, 0) - 7, w(9, 0) - 21, TOTAL];
export const SCENES: Scene[] = [S1, S2, S3, S4, S5, S6, S7, S8];
export const DARK = [0, 0, 0, 0, 0, 0, 0, 1];
