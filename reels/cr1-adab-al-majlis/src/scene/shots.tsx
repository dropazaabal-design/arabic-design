import React from 'react';
import { AbsoluteFill } from 'remotion';
import { EndCard, keys, tween } from '@motion/index';
import { wordAt, wordEnd } from '../video/time';
import { Arrow, Book, C, Card, Check, FLOOR, Figure, Frame, HANDS, Label, Majlis, NoSign, Ring, Title, V, W, mix, pose, track } from './kit';

/** Beats on the measured narration (seconds). Every action is pinned to the word that names it. */
export const B = {
  sat: wordAt('s01', 'جلست'), split: wordAt('s01', 'تفرق'), between: wordAt('s01', 'بين'), except: wordAt('s01', 'إلا'), perm: wordAt('s01', 'بإذنهما'),
  hadith1: wordAt('s02', 'قال'), noHalal: wordAt('s02', 'لا'), hExcept: wordAt('s02', 'إلا'), hPerm: wordAt('s02', 'بإذنهما'),
  rose: wordAt('s03', 'قام'), need: wordAt('s03', 'لحاجة'), back: wordAt('s03', 'الرجوع'), take: wordAt('s03', 'تستول'),
  hadith2: wordAt('s04', 'قال'), ifRose: wordAt('s04', 'إذا'), returned: wordAt('s04', 'رجع'), right: wordAt('s04', 'أحق'),
  sat2: wordAt('s05', 'جلست'), space: wordAt('s05', 'مساحة'), beside: wordAt('s05', 'بجانبك'), crowd: wordAt('s05', 'تزاحمه'), wide: wordAt('s05', 'يتسع'),
  books: wordAt('s06', 'كتب'), dist: wordAt('s06', 'المسافة'), comfort: wordAt('s07', 'راحة'), noFixed: wordAt('s07', 'إلزام'), s07end: wordEnd('s07', 'محددة'),
  crowded: wordAt('s08', 'ازدحم'), makeRoom: wordAt('s08', 'فافسح'), ability: wordAt('s08', 'الاستطاعة'), noHarm: wordAt('s08', 'أذى'),
  verse: wordAt('s09', 'قال'), v1: wordAt('s09', 'يا'), v2: wordAt('s09', 'إذا'), v3: wordAt('s09', 'يفسح'), verseEnd: wordEnd('s09', 'لكم', 1),
  saadi: wordAt('s10', 'السعدي'), adab: wordAt('s10', 'أدب'), makes: wordAt('s10', 'يفسح'), needs: wordAt('s10', 'يحتاج'), harm: wordAt('s10', 'ضرر'),
  reward: wordAt('s11', 'والجزاء'), q1: wordAt('s11', 'فإن'), who: wordAt('s11', 'فسح'), q2: wordAt('s11', 'ومن'), widen: wordAt('s11', 'وسع', 1), end: wordEnd('s11', 'عليه'),
};

export type ShotProps = { t: number; T: number; t0: number };
const R = C.robe, K = C.cap;
const nodAt = (T: number, a: number, b: number, amp = 9) => (T > a && T < b ? amp * Math.abs(Math.sin((T - a) * Math.PI * 2.2)) : 0);
const sitKeys = (T: number, ks: Array<[number, number]>) => keys(T, ks.map(([a, v], i) => [a, v, i ? 'power2.inOut' : undefined] as [number, number, string?]));
/** Hands: a list of [at, pose name or a fixed point]; each pose is evaluated at the figure's current posture. */
type HandKey = [number, keyof typeof HANDS | V];
const hand = (T: number, sit: number, side: -1 | 1, ks: HandKey[]): V => {
  const at = (h: keyof typeof HANDS | V): V => (Array.isArray(h) ? h : HANDS[h](sit, side));
  let cur = at(ks[0][1]);
  for (let i = 1; i < ks.length; i++) {
    if (T < ks[i][0]) break;
    cur = mix(cur, at(ks[i][1]), tween(T, ks[i][0], ks[i][0] + 0.35, 0, 1, 'power2.inOut'));
  }
  return cur;
};
const headY = (sit: number, s: number) => FLOOR - (385 + (258 - 385) * sit) * s;   // the head's centre for a posture

/** 1 · 0–13 s — «لا تفرّق بين اثنين»: he walks in and sits between two friends; red. He stands, asks; they nod and
 *  make room, inviting him; he sits between them with their leave; green. Abu Dawud 4845 on the card. */
export const Sh1Split: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0, s = 1.25;
  const g = track(T, [[0, 1250], [1.45, 540, 'power1.out']]);   // he stands up and sits down again in the same spot
  const gSit = sitKeys(T, [[0, 0], [1.45, 0], [1.95, 1], [B.except, 1], [B.except + 0.5, 0], [B.hExcept - 2.4, 0], [B.hExcept - 1.8, 1]]);
  const a = track(T, [[0, 330], [B.hadith1 + 1.9, 330], [B.hadith1 + 2.9, 250, 'power2.inOut']]);
  const b = track(T, [[0, 750], [B.hadith1 + 2.0, 750], [B.hadith1 + 3.0, 830, 'power2.inOut']]);
  const shove = tween(T, B.split - 0.1, B.split + 0.3, 0, 1, 'power2.out') * tween(T, B.except, B.except + 0.5, 1, 0);
  const lookUp = T > B.except + 0.3 && T < B.hExcept - 1.6;
  return (
    <Frame T={T} start={{ cx: 540, cy: 965, zoom: 1.12 }} moves={[{ at: L(0.1), dur: 4, cx: 540, cy: 995, zoom: 1.17, ease: 'sine.inOut' }, { at: L(B.hadith1 - 0.5), dur: 1.2, cx: 540, cy: 965, zoom: 1.12 }, { at: L(B.hPerm - 2), dur: 3.5, cx: 540, cy: 980, zoom: 1.16, ease: 'sine.inOut' }]}
      overlay={<>
        <Title t={T} from={0.15} to={13.0} text="لا تفرّق بين اثنين" />
        <Card t={T} from={B.hadith1 - 0.45} to={13.0} head="قال رسول الله ﷺ" lines={[[B.hadith1 - 0.25, '«لاَ يَحِلُّ لِرَجُلٍ أَنْ يُفَرِّقَ بَيْنَ اثْنَيْنِ إِلاَّ بِإِذْنِهِمَا»']]} source="رواه أبو داود (4845)" />
      </>}>
      <Majlis />
      <Figure x={a.x} y={FLOOR + a.lift} s={s} robe={R.a} cap={K.a} breathe={T} lean={4 - 13 * shove} look={lookUp ? 0.6 : shove > 0.2 ? 1 : 0.8} tilt={lookUp ? -6 : 0} nod={nodAt(T, B.hadith1 + 0.7, B.hadith1 + 1.7)}
        handR={hand(T, 1, 1, [[0, 'rest'], [0.3, 'talk'], [1.1, 'rest'], [B.hadith1 + 2.8, 'invite'], [B.hExcept - 1.0, 'rest']])} />
      <Figure x={b.x} y={FLOOR + b.lift} s={s} robe={R.b} cap={K.b} breathe={T + 1.3} lean={-4 + 13 * shove} look={lookUp ? -0.6 : shove > 0.2 ? -1 : -0.8} tilt={lookUp ? 6 : 0} nod={nodAt(T, B.hadith1 + 0.9, B.hadith1 + 1.9)}
        handL={hand(T, 1, -1, [[0, 'rest'], [1.0, 'talk'], [1.6, 'rest']])} />
      <Figure x={g.x} s={s} robe={R.g} cap={K.g} sit={gSit} walk={g.walk} stride={g.stride} breathe={T + 0.6} look={T < 1.4 ? -0.6 : lookUp ? 0 : 0} nod={nodAt(T, B.hExcept - 1.5, B.hExcept - 0.9, 6)}
        handR={hand(T, gSit, 1, [[0, 'rest'], [B.perm, 'ask'], [B.hadith1 + 3.1, 'rest']])} handL={hand(T, gSit, -1, [[0, 'rest']])} />
      <NoSign t={T} at={B.between - 0.05} out={B.except + 0.15} x={540} y={headY(1, s) - 120} />
      <Check t={T} at={B.hExcept} out={12.9} x={540} y={headY(1, s) - 120} />
    </Frame>
  );
};

/** 2 · ~13.3–29 s — «احفظ مكان من قام لحاجة»: he stands, leaves his book on the seat, goes, glances back. Another
 *  starts to sit there: red. Muslim 2179 on the card; the seated one points at the kept place, he puts a hand to his
 *  chest and nods. The owner comes back; the other invites him to his place; green. */
export const Sh2Seat: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0, s = 1.25, SPOT = 380;
  const c = track(T, [[0, SPOT], [B.rose + 0.55, SPOT], [B.rose + 0.95, 260, 'power2.inOut'], [B.rose + 1.45, 260], [B.need + 0.8, 30, 'power1.inOut'], [B.back + 0.5, 30], [B.back + 1.2, -230, 'power1.in'],
    [B.returned - 1.3, -230], [B.returned + 0.2, SPOT, 'power1.out']]);
  const cSit = sitKeys(T, [[0, 1], [B.rose, 1], [B.rose + 0.5, 0], [B.returned + 0.25, 0], [B.returned + 0.8, 1]]);
  const placed = B.rose + 1.2, picked = B.returned + 1.0;
  const g = track(T, [[0, 1300], [B.need + 0.9, 1300], [B.take - 0.15, SPOT + 10, 'power1.out'], [B.take + 0.95, SPOT + 10], [B.take + 1.45, 650, 'power2.inOut']]);
  const gSit = sitKeys(T, [[0, 0], [B.take - 0.12, 0], [B.take + 0.25, 0.55], [B.take + 0.85, 0.55], [B.take + 1.25, 0]]);
  const cHand = hand(T, cSit, 1, [[0, 'hold'], [B.rose + 1.0, [110, -60]], [placed + 0.15, 'rest'], [picked - 0.2, 'down'], [picked + 0.3, 'hold']]);
  const bookInHand = T < placed || T > picked;
  const cx = c.x, cy = FLOOR + (cSit > 0.5 ? c.lift : 0);
  return (
    <Frame T={T} start={{ cx: 540, cy: 965, zoom: 1.12 }} moves={[{ at: L(B.rose - 0.8), dur: 4, cx: 500, cy: 995, zoom: 1.17, ease: 'sine.inOut' }, { at: L(B.hadith2 - 0.5), dur: 1.2, cx: 540, cy: 965, zoom: 1.12 }, { at: L(B.returned - 1), dur: 3, cx: 540, cy: 980, zoom: 1.16, ease: 'sine.inOut' }]}
      overlay={<>
        <Title t={T} from={t0 + 0.2} to={28.6} text="احفظ مكان من قام لحاجة" />
        <Card t={T} from={B.hadith2 - 0.45} to={28.6} head="قال رسول الله ﷺ" lines={[[B.hadith2 - 0.25, '«إِذَا قَامَ أَحَدُكُمْ مِنْ مَجْلِسِهِ ثُمَّ رَجَعَ إِلَيْهِ فَهُوَ أَحَقُّ بِهِ»']]} source="رواه مسلم (2179)" />
      </>}>
      <Majlis />
      <Figure x={870} s={s} robe={R.d} cap={K.d} breathe={T} look={T > B.rose && T < B.back + 1.2 ? -1 : T > B.take - 0.6 ? -0.8 : -0.3}
        nod={nodAt(T, B.right, B.right + 0.8, 6)} handL={hand(T, 1, -1, [[0, 'rest'], [B.hadith2 + 0.6, 'invite'], [B.ifRose + 0.2, 'rest']])} />
      <Figure x={cx} y={cy} s={s} robe={R.c} cap={K.c} sit={cSit} walk={c.walk} stride={c.stride} breathe={T + 0.8}
        look={T > B.back - 0.1 && T < B.back + 0.6 ? 1 : T > B.rose + 1.45 && T < B.back + 1.2 ? -0.8 : T > B.returned - 1.3 && T < B.returned + 0.4 ? 0.8 : 0}
        handR={cHand} handL={hand(T, cSit, -1, [[0, 'rest']])} />
      {bookInHand && <Book x={cx + cHand[0] * s} y={cy + cHand[1] * s - 6} s={s * 0.8} rot={-8} />}
      <Figure x={g.x} s={s} robe={R.g} cap={K.g} sit={gSit} walk={g.walk} stride={g.stride} breathe={T + 0.3}
        look={T > B.take + 0.2 && T < B.take + 0.9 ? -0.4 : T > B.returned - 1.2 ? -0.9 : T > B.hadith2 - 0.5 ? -0.55 + 0.4 * Math.sin((T - B.hadith2) * 1.7) : -0.2}
        tilt={T > B.take + 0.2 && T < B.take + 0.9 ? -10 : 0} nod={nodAt(T, B.hadith2 + 1.3, B.hadith2 + 2.0, 7)}
        handR={hand(T, gSit, 1, [[0, 'rest'], [B.hadith2 + 1.2, 'hold'], [B.ifRose + 0.6, 'rest']])}
        handL={hand(T, gSit, -1, [[0, 'rest'], [B.returned - 0.4, [-150, -150]], [B.returned + 0.6, 'rest']])} />
      {!bookInHand && <Book x={SPOT + 10} y={FLOOR + 4} s={s * 0.9} />}
      <NoSign t={T} at={B.take + 0.2} out={B.take + 1.4} x={SPOT + 10} y={headY(gSit, s) - 120} />
      <Check t={T} at={B.right} out={28.5} x={SPOT} y={headY(1, s) - 120} />
    </Frame>
  );
};

/** 3 · ~29–49 s — «اترك مساحة لمن بجانبك»: he walks in and sits on «وإذا جلست», welcomed; two dashed rings; he shuffles too close, both turn red; he shuffles back,
 *  green. Then an easy conversation at a comfortable distance; «راحة الجليس»; the rings breathe (no fixed measure). */
export const Sh3Space: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0, s = 1.25, J = 330;
  const g = track(T, [[0, 1180], [t0 + 0.1, 1180], [B.sat2 - 0.35, 760, 'power1.out'], [B.beside - 0.1, 760], [B.crowd - 0.1, 545, 'power2.inOut'], [B.wide - 0.9, 545], [B.wide + 0.2, 760, 'power2.inOut']]);
  const gSit = sitKeys(T, [[0, 0], [B.sat2 - 0.3, 0], [B.sat2 + 0.3, 1]]);
  const close = Math.max(0, Math.min(1, (420 - (g.x - J)) / 120));
  const rings = tween(T, B.space - 0.1, B.space + 0.4, 0, 1);
  const breath = (ph: number) => (T > B.noFixed ? 1 + 0.05 * Math.sin((T - B.noFixed) * 2.4 + ph) * tween(T, B.noFixed, B.noFixed + 0.8, 0, 1) : 1);
  const recoil = tween(T, B.crowd + 0.05, B.crowd + 0.4, 0, 1) * tween(T, B.wide - 0.2, B.wide + 0.4, 1, 0);
  return (
    <Frame T={T} start={{ cx: 540, cy: 965, zoom: 1.12 }} moves={[{ at: L(B.books - 0.3), dur: 6, cx: 540, cy: 1010, zoom: 1.2, ease: 'sine.inOut' }, { at: L(B.comfort - 0.6), dur: 3.5, cx: 540, cy: 985, zoom: 1.15, ease: 'sine.inOut' }]}
      overlay={<>
        <Title t={T} from={t0 + 0.2} to={48.7} text="اترك مساحة لمن بجانبك" />
        <Label t={T} from={B.comfort} to={48.7} text="راحة الجليس" top={330} />
      </>}>
      <Majlis />
      <Ring x={J} s={s * breath(0)} hot={close} op={rings} t={T} />
      <Ring x={g.x} s={s * breath(1.7)} hot={close} op={rings} t={T} />
      <Figure x={J} s={s} robe={R.e} cap={K.e} breathe={T} lean={-10 * recoil} look={recoil > 0.2 ? 1 : 0.7} tilt={-6 * recoil}
        nod={nodAt(T, B.dist - 0.3, B.dist + 0.5, 7)} handR={hand(T, 1, 1, [[0, 'rest'], [B.sat2 - 0.7, 'invite'], [B.sat2 + 0.5, 'rest'], [B.books + 0.3, 'talk'], [B.books + 1.5, 'rest'], [B.comfort + 0.6, 'talk'], [B.comfort + 1.6, 'rest']])} />
      <Figure x={g.x} y={FLOOR + (gSit > 0.5 ? g.lift : 0)} s={s} robe={R.g} cap={K.g} sit={gSit} walk={g.walk} stride={g.stride} breathe={T + 1.1} look={-0.7}
        nod={nodAt(T, B.books + 1.6, B.books + 2.4, 7)} handL={hand(T, gSit, -1, [[0, 'rest'], [B.dist - 1.6, 'talk'], [B.dist - 0.5, 'rest'], [B.noFixed + 0.3, 'talk'], [B.noFixed + 1.3, 'rest']])} />
      <NoSign t={T} at={B.crowd + 0.2} out={B.wide - 0.7} x={(J + g.x) / 2} y={headY(1, s) - 140} />
      <Check t={T} at={B.wide + 0.25} out={B.wide + 1.4} x={545} y={headY(1, s) - 140} />
    </Frame>
  );
};

/** 4 · ~49–67.6 s — «افسح للداخل»: a crowded row, a newcomer standing; arrows; each shifts a little, in a wave, so a
 *  place opens without squeezing anyone; he sits; green. Then the verse (Al-Mujadila 11) on its card, the row calm. */
// uneven gaps that each closes a little (equal spacing after), so the opening at the end squeezes no one
const ROW = [120, 330, 470, 690, 860], SHIFT = [20, 60, 30, 80, 80], ROBES = ['a', 'b', 'c', 'd', 'e'] as const;
export const Sh4Room: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0, s = 1.0;
  const g = track(T, [[0, 1250], [t0 + 1.6, 1000, 'power1.out'], [B.ability, 1000], [B.ability + 0.45, 960, 'power2.inOut']]);
  const gSit = sitKeys(T, [[0, 0], [B.ability + 0.45, 0], [B.ability + 0.95, 1]]);
  const dim = tween(T, B.verse - 0.95, B.verse - 0.35, 0, 0.55);
  return (
    <Frame T={T} start={{ cx: 540, cy: 960, zoom: 1 }} moves={[{ at: L(t0 + 0.1), dur: 5, cx: 560, cy: 985, zoom: 1.05, ease: 'sine.inOut' }, { at: L(B.verse - 1), dur: 1.4, cx: 540, cy: 960, zoom: 1 }]}
      overlay={<>
        <Title t={T} from={t0 + 0.2} to={B.verse - 0.9} text="افسح للداخل" />
        <AbsoluteFill style={{ background: C.bg, opacity: dim }} />
        <Card t={T} from={B.verse - 0.85} to={67.3} head="قال الله تعالى" top={420} size={66}
          lines={[[B.v1 - 0.1, '﴿يَا أَيُّهَا الَّذِينَ آمَنُوا'], [B.v2 - 0.1, 'إِذَا قِيلَ لَكُمْ تَفَسَّحُوا فِي الْمَجَالِسِ فَافْسَحُوا'], [B.v3 - 0.1, 'يَفْسَحِ اللَّهُ لَكُمْ﴾']]} source="[المجادلة: 11]" />
      </>}>
      <Majlis />
      {ROW.map((x0, k) => {
        const at = B.makeRoom + 0.1 + (4 - k) * 0.2;
        const p = track(T, [[0, x0], [at, x0], [at + 0.5, x0 - SHIFT[k], 'power2.inOut']]);
        return (
          <g key={k}>
            <Arrow t={T} at={at - 0.25} out={B.noHarm} x={x0 - 30} y={headY(1, s) - 85} s={1.1} />
            <Figure x={p.x} y={FLOOR + p.lift} s={s} robe={R[ROBES[k]]} cap={K[ROBES[k]]} breathe={T + k * 0.7}
              look={T > t0 + 1.4 && T < B.makeRoom + 1.5 ? 0.8 : 0.1 * (k - 2)} nod={nodAt(T, at - 0.6, at - 0.1, 5)} />
          </g>
        );
      })}
      <Figure x={g.x} s={s} robe={R.g} cap={K.g} sit={gSit} walk={g.walk} stride={g.stride} breathe={T + 0.4} look={T > t0 + 1.6 && T < B.makeRoom + 0.4 ? -1 : -0.3}
        handR={hand(T, gSit, 1, [[0, 'rest']])} nod={nodAt(T, B.noHarm - 0.2, B.noHarm + 0.5, 6)} />
      <Check t={T} at={B.noHarm + 0.1} out={B.verse - 0.9} x={960} y={headY(1, s) - 110} />
    </Frame>
  );
};

/** 5 · ~67.6–76.7 s — al-Sa'di: from the etiquette of the gathering, the seated one makes room for whoever needs a
 *  place, with no harm to himself. A man arrives; one shifts a little and invites him; all are at ease; green. */
export const Sh5Saadi: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0, s = 1.2;
  const r = track(T, [[0, 1300], [B.adab - 0.3, 1300], [B.makes + 0.2, 900, 'power1.out'], [B.needs, 900], [B.needs + 0.4, 860, 'power2.inOut']]);
  const rSit = sitKeys(T, [[0, 0], [B.needs + 0.35, 0], [B.needs + 0.9, 1]]);
  const q = track(T, [[0, 620], [B.makes, 620], [B.makes + 0.6, 580, 'power2.inOut']]);
  return (
    <Frame T={T} start={{ cx: 540, cy: 965, zoom: 1.12 }} moves={[{ at: L(t0 + 0.1), dur: 7, cx: 560, cy: 995, zoom: 1.18, ease: 'sine.inOut' }]}
      overlay={<>
        <Title t={T} from={t0 + 0.2} to={76.4} text="من أدب المجلس" />
        <Label t={T} from={B.saadi} to={76.4} text="تفسير السعدي" top={330} color={C.brand} />
      </>}>
      <Majlis />
      <Figure x={260} s={s} robe={R.a} cap={K.a} breathe={T} look={0.6} nod={nodAt(T, B.needs + 1.0, B.needs + 1.8, 5)} />
      <Figure x={q.x} y={FLOOR + q.lift} s={s} robe={R.e} cap={K.e} breathe={T + 0.9} look={T > B.adab ? 1 : -0.4}
        handR={hand(T, 1, 1, [[0, 'rest'], [B.makes + 0.4, 'invite'], [B.needs + 1.1, 'rest']])} />
      <Figure x={r.x} s={s} robe={R.b} cap={K.b} sit={rSit} walk={r.walk} stride={r.stride} breathe={T + 0.2} look={-0.7}
        nod={nodAt(T, B.makes + 0.5, B.makes + 1.1, 6)} />
      <Check t={T} at={B.harm} out={76.4} x={720} y={headY(1, s) - 130} />
    </Frame>
  );
};

/** 6 · ~76.7–88.6 s — «والجزاء من جنس العمل»: in a framed little scene one makes room and invites a newcomer; at
 *  «وسّع الله عليه» the frame itself widens. Then the title «آداب المجلس» and the كتاب وبس signature. */
export const Sh6Reward: React.FC<ShotProps> = ({ T, t0 }) => {
  const L = (x: number) => x - t0, s = 1.1;
  const w = tween(T, B.widen - 0.1, B.widen + 0.9, 600, 1000, 'power2.inOut');
  const gl = track(T, [[0, 1150], [B.reward + 0.9, 1150], [B.who - 0.2, 760, 'power1.out'], [B.who + 0.6, 760], [B.who + 0.95, 700, 'power2.inOut']]);
  const gSit = sitKeys(T, [[0, 0], [B.who + 0.9, 0], [B.who + 1.4, 1]]);
  const sx = track(T, [[0, 540], [B.who, 540], [B.who + 0.6, 410, 'power2.inOut']]);
  const fade = tween(T, B.end + 0.2, B.end + 0.8, 0, 1);
  return (
    <Frame T={T} start={{ cx: 540, cy: 960, zoom: 1 }} moves={[{ at: L(t0 + 0.1), dur: 6, cx: 540, cy: 975, zoom: 1.03, ease: 'sine.inOut' }]}
      overlay={<>
        <Title t={T} from={t0 + 0.2} to={B.end + 0.3} text="الجزاء من جنس العمل" />
        <Card t={T} from={B.q1 - 0.35} to={B.end + 0.3} head="" top={330} size={56}
          lines={[[B.q1 - 0.1, '«فإنَّ مَن فَسَحَ فَسَحَ اللهُ له،'], [B.q2 - 0.1, 'ومَن وسَّعَ لأخيه وسَّعَ اللهُ عليه»']]} source="تفسير السعدي" />
        <AbsoluteFill style={{ background: C.bg, opacity: fade }} />
        <Title t={T} from={B.end + 0.5} to={99} text="آداب المجلس" top={640} size={104} />
        <EndCard t={T} from={B.end + 1.0} accent={C.brand} chipBg={C.ink} ink="#FFFFFF" brandColor={C.brand} top={1180} />
      </>}>
      <rect x={-400} y={-400} width={W + 800} height={2800} fill={C.bg} />
      <defs><clipPath id="vig"><rect x={540 - w / 2} y={860} width={w} height={640} rx={44} /></clipPath></defs>
      <g clipPath="url(#vig)">
        <Majlis />
        <Figure x={sx.x} y={FLOOR + sx.lift} s={s} robe={R.a} cap={K.a} breathe={T} look={T > B.reward + 1.4 ? 0.9 : 0}
          handR={hand(T, 1, 1, [[0, 'rest'], [B.who + 0.3, 'invite'], [B.q2 + 0.4, 'rest']])} nod={nodAt(T, B.widen + 0.9, B.widen + 1.6, 5)} />
        <Figure x={gl.x} s={s} robe={R.g} cap={K.g} sit={gSit} walk={gl.walk} stride={gl.stride} breathe={T + 0.5} look={-0.8} nod={nodAt(T, B.who + 0.4, B.who + 0.9, 6)} />
      </g>
      <rect x={540 - w / 2} y={860} width={w} height={640} rx={44} fill="none" stroke={C.ink} strokeWidth={6} />
    </Frame>
  );
};
