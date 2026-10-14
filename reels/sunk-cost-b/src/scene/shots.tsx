import React from 'react';
import { DrawPath, EndCard, Pill, alongPath, keys, tween } from '@motion/index';
import { INK, LINE, lerp, stroke, wobEllipse, wobRect } from '@mukarram/characters/ink';
import { POSES, Pose, walkPose } from '@mukarram/characters/rig';
import { poseTrack, vecTrack } from '@mukarram/scenes/common';
import { xTrack } from '@doublethink/scenes/common';
import { E as X } from '../../../sunk-cost-a/src/scene/expr';
import { wordAt } from '../video/time';
import { Aunt, Bus, BusTicket, C, FONT, Frame, Hero, Scarf, Stop, s30 } from './kit';

// Reel B — «الباص الغلط»: the director's cut. One logic carries the joke: home is one stop BEHIND him; the bus goes
// the other way; keep going east long enough and you come back from the west — to the stop just before your first.
// The middle of the film turns the idea into a picture: on the map, the road behind the bus sinks into the sea
// (what you travelled cannot be travelled back), and the only useful line is the new one from where you are now.

const P = (o: Partial<Pose>): Pose => ({ ...(POSES.stand as Pose), ...o });
export type ShotProps = { t: number; T: number; t0: number };

export const B = {
  ride: wordAt('s01', 'ركب'), after: wordAt('s01', 'وبعد'), wrong: wordAt('s01', 'بالعكس'),
  next: wordAt('s02', 'المحطة'), off: wordAt('s02', 'ينزل'),
  no: wordAt('s03', 'لأ'), dist: wordAt('s03', 'مسافة'), waste: wordAt('s03', 'حرام'),
  aunt: wordAt('s04', 'الخالة'), gotOff: wordAt('s04', 'نزلت'), cross: wordAt('s04', 'قطعت'), board: wordAt('s04', 'وركبت'),
  him: wordAt('s05', 'وصاحبنا'), buy: wordAt('s05', 'اشترى'),
  city: wordAt('s06', 'المدينة'), farms: wordAt('s06', 'مزارع'), desert: wordAt('s06', 'صحرا'),
  reason: wordAt('s07', 'لقى'), paid: wordAt('s08', 'دفعت'), loop: wordAt('s08', 'أكيد'),
  real: wordAt('s09', 'والسبب'), wrongStart: wordAt('s09', 'غلطت'),
  name: wordAt('s10', 'مغالطة'), road: wordAt('s10', 'الطريق'), sank: wordAt('s10', 'غرق'), either: wordAt('s10', 'نزلت'),
  q: wordAt('s11', 'والسؤال'), here: wordAt('s11', 'مكاني'), nearest: wordAt('s11', 'أقرب'),
  but: wordAt('s12', 'بس'), picture: wordAt('s12', 'صورة'), plant: wordAt('s12', 'نبتة'), home: wordAt('s12', 'بيته'),
  snow: wordAt('s13', 'ثلج'), sea: wordAt('s13', 'بحر'), years: wordAt('s13', 'وسنين'),
  finally: wordAt('s14', 'وأخيرا'), arrived: wordAt('s14', 'وصل'), globe: wordAt('s14', 'الكرة'),
  stop: wordAt('s15', 'المحطة'), first: wordAt('s15', 'محطته'), exactly: wordAt('s15', 'بالضبط'),
  auntEnd: wordAt('s16', 'والخالة'), forty: wordAt('s16', 'بأربعين'),
  ok: wordAt('s17', 'مو'), closer: wordAt('s17', 'يقربك'), ahead: wordAt('s17', 'قدامك'), behind: wordAt('s17', 'وراك'),
  qa: wordAt('s18', 'لو'), qb: wordAt('s18', 'هل'), cta: wordAt('s19', 'اكتبها'),
};

/* ---------------- the street (outside) ---------------- */

const HOUSE_X = -60;
const House: React.FC<{ x: number; y: number; glow?: number }> = ({ x, y, glow = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={wobRect(-170, -330, 340, 330, 10, 4, 3)} fill={C.city3} {...stroke(LINE)} />
    <path d="M-200 -320 L0 -470 L200 -320 Z" fill={C.scarf} {...stroke(LINE)} />
    <path d={wobRect(-50, -170, 100, 170, 8, 2, 2)} fill={C.seatDeep} {...stroke(LINE)} />
    <path d={wobRect(-140, -280, 80, 80, 6, 3, 2)} fill={C.busWin} {...stroke(LINE * 0.8)} opacity={0.6 + glow * 0.4} />
    <path d={wobRect(60, -280, 80, 80, 6, 5, 2)} fill={C.busWin} {...stroke(LINE * 0.8)} opacity={0.6 + glow * 0.4} />
    <g transform="translate(0 -560)"><path d="M0 70 C-46 20 -46 -40 0 -40 C46 -40 46 20 0 70Z" fill={C.pin} {...stroke(LINE)} /><circle cy={-6} r={14} fill={C.stripe} /></g>
    <text x={0} y={-640} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={900} fontSize={56} fill={INK}>البيت</text>
  </g>
);

const Street: React.FC<{ T: number; children?: React.ReactNode; far?: React.ReactNode }> = ({ T, children, far }) => (
  <g>
    <rect x={-1400} y={-800} width={4000} height={3600} fill={C.sky} />
    {[[-700, 300], [200, 220], [900, 330], [1700, 260]].map(([x, y], i) => <path key={i} d={wobEllipse(x + ((T * 12) % 400), y, 150, 50, i, 0.08, 10)} fill={C.cloud} />)}
    {Array.from({ length: 14 }, (_, i) => <rect key={i} x={-1400 + i * 290} y={560 - (i % 3) * 120} width={250} height={900} fill={[C.city1, C.city2, C.city3][i % 3]} {...stroke(LINE)} />)}
    <rect x={-1400} y={1050} width={4000} height={110} fill={C.walk} {...stroke(LINE)} />
    {far}
    <rect x={-1400} y={1160} width={4000} height={420} fill={C.road} />
    {Array.from({ length: 20 }, (_, i) => <rect key={i} x={-1400 + i * 220} y={1362} width={120} height={14} fill={C.roadLine} />)}
    <rect x={-1400} y={1580} width={4000} height={1300} fill={C.walk} {...stroke(LINE)} />
    {children}
  </g>
);

/** 1 · 0.00 — He runs for the bus at his stop (home is behind him, one stop back), hops on; it pulls away — the wrong way. */
export const S01Board: React.FC<ShotProps> = ({ t, T }) => {
  const busX = keys(T, [[0, -900], [1.2, 330, 'power2.out'], [1.75, 330], [2.9, 1500, 'power2.in']]);
  const runX = keys(T, [[0, 60], [1.35, 520, 'power1.inOut']]);
  const inBus = T > 1.5;
  return (
    <Frame T={T} bg={C.sky} start={{ cx: 300, cy: 1150, zoom: 0.92 }} moves={[{ at: 0.2, dur: 1.3, cx: 480, cy: 1220, zoom: 1.1, ease: 'power2.inOut' }, { at: 1.9, dur: 1.0, cx: 720, cy: 1200, zoom: 1.0, ease: 'power2.in' }]}>
      <Street T={T} far={<><House x={HOUSE_X} y={1050} /><Stop x={600} y={1050} label="7" s={0.9} /></>}>
        <g transform={`translate(${busX} 1560)`}><Bus roll={busX / 62} door={T > 1.2 && T < 1.75 ? 1 : 0} heads={inBus ? <circle cx={-60} cy={-250} r={50} fill={C.stripe} {...stroke(LINE)} /> : undefined} /></g>
        {!inBus && <Hero x={runX} y={1700} s={0.75} T={t} pose={walkPose(T * 2.4, 1.3)} expr={'determined'} look={[0.9, 0]} />}
        {/* the direction: an arrow from the stop away from home */}
        <path d="M720 1470 L1020 1470 M985 1440 L1020 1470 L985 1500" fill="none" {...stroke(14, C.pin)} opacity={tween(T, 1.7, 1.95, 0, 1)} />
      </Street>
    </Frame>
  );
};

/* ---------------- inside the bus ---------------- */

const WIN_Y0 = 380, WIN_Y1 = 900, FLOOR = 1580;
type Land = 'city' | 'farm' | 'desert' | 'snow' | 'sea' | 'stop';
const landAt = (T: number): Array<[Land, number]> => {
  const k: Array<[number, Land]> = [[0, 'city'], [B.farms - 0.6, 'farm'], [B.desert - 0.4, 'desert'], [B.snow - 0.3, 'snow'], [B.sea - 0.3, 'sea']];
  let i = 0;
  while (i + 1 < k.length && T >= k[i + 1][0]) i++;
  const fade = i > 0 ? tween(T, k[i][0], k[i][0] + 0.5, 0, 1) : 1;
  return i > 0 && fade < 1 ? [[k[i - 1][1], 1], [k[i][1], fade]] : [[k[i][1], 1]];
};

const Scenery: React.FC<{ kind: Land; off: number; T: number }> = ({ kind, off, T }) => {
  const tile = (w: number, f: (x: number, i: number) => React.ReactNode, speed = 1) => {
    const o = ((off * speed) % w + w) % w;
    return Array.from({ length: Math.ceil(2600 / w) + 2 }, (_, i) => <g key={i}>{f(-700 + i * w - o, i)}</g>);
  };
  switch (kind) {
    case 'city': return <g><rect x={-700} y={WIN_Y0} width={2600} height={600} fill={C.sky} />{tile(260, (x, i) => <rect x={x} y={WIN_Y0 + 120 + (i % 3) * 60} width={220} height={500} fill={[C.city1, C.city2, C.city3][i % 3]} {...stroke(LINE)} />, 0.4)}{tile(420, (x) => <path d={`M${x} ${WIN_Y1} L${x} ${WIN_Y0 + 140} M${x - 30} ${WIN_Y0 + 140} L${x + 40} ${WIN_Y0 + 140}`} {...stroke(10)} />)}</g>;
    case 'farm': return <g><rect x={-700} y={WIN_Y0} width={2600} height={600} fill={C.sky} /><rect x={-700} y={WIN_Y0 + 300} width={2600} height={300} fill={C.field} />{tile(500, (x, i) => <g><path d={wobEllipse(x, WIN_Y0 + 290, 160, 60, i, 0.1, 10)} fill={C.grass} /><g transform={`translate(${x + 200} ${WIN_Y0 + 400})`}><path d={wobEllipse(0, 0, 60, 36, i + 3, 0.05, 8)} fill={C.cloud} {...stroke(LINE * 0.7)} /><circle cx={-12} cy={-6} r={10} fill={INK} /><path d="M50 -20 L70 -36" {...stroke(LINE * 0.7)} /></g></g>, 0.7)}{tile(380, (x) => <path d={`M${x} ${WIN_Y1} L${x} ${WIN_Y0 + 380}`} {...stroke(8, C.grassDeep)} />)}</g>;
    case 'desert': return <g><rect x={-700} y={WIN_Y0} width={2600} height={600} fill={C.skyHi} /><circle cx={980} cy={WIN_Y0 + 110} r={50} fill={C.cloud} />{tile(600, (x, i) => <path d={`M${x - 300} ${WIN_Y0 + 380} Q${x} ${WIN_Y0 + 230 + (i % 2) * 40} ${x + 300} ${WIN_Y0 + 380} Z`} fill={C.duneDeep} />, 0.4)}<rect x={-700} y={WIN_Y0 + 370} width={2600} height={230} fill={C.dune} />{tile(520, (x, i) => <g transform={`translate(${x} ${WIN_Y0 + 470})`}><path d="M0 0 L0 -130 M0 -70 L-40 -70 L-40 -110 M0 -50 L36 -50 L36 -95" fill="none" {...stroke(26, C.cactus)} /></g>)}</g>;
    case 'snow': return <g><rect x={-700} y={WIN_Y0} width={2600} height={600} fill={C.ice} />{tile(560, (x, i) => <path d={`M${x - 280} ${WIN_Y0 + 420} L${x} ${WIN_Y0 + 120 + (i % 2) * 50} L${x + 280} ${WIN_Y0 + 420} Z`} fill={C.mountain} {...stroke(LINE)} />, 0.4)}<rect x={-700} y={WIN_Y0 + 400} width={2600} height={200} fill={C.snow} />{Array.from({ length: 40 }, (_, i) => <circle key={i} cx={-600 + ((i * 173 + T * 160) % 2400)} cy={WIN_Y0 + ((i * 97 + T * 120) % 520)} r={6} fill={C.snow} />)}</g>;
    case 'sea': return <g><rect x={-700} y={WIN_Y0} width={2600} height={600} fill={C.skyHi} /><rect x={-700} y={WIN_Y0 + 260} width={2600} height={340} fill={C.sea} />{tile(240, (x) => <path d={`M${x} ${WIN_Y0 + 300 + Math.sin(T * 3 + x) * 8} q60 -24 120 0`} fill="none" {...stroke(6, C.cloud)} />, 0.6)}<rect x={-700} y={WIN_Y0 + 470} width={2600} height={40} fill={C.ferry} {...stroke(LINE)} /></g>;
    case 'stop': default: return <g><rect x={-700} y={WIN_Y0} width={2600} height={600} fill={C.sky} /><rect x={-700} y={WIN_Y0 + 380} width={2600} height={220} fill={C.road} /></g>;
  }
};

const ROUTE_Y = 300;
/** The interior: windows with the moving land, the route display (home pin behind, the bus marker), seats, poles. */
const Interior: React.FC<{ T: number; dist: number; moving: number; km: number; stopView?: React.ReactNode; homey?: { picture: number; plant: number; curtain: number; calendar: number }; children?: React.ReactNode; front?: React.ReactNode }> = ({ T, dist, moving, km, stopView, homey, children, front }) => (
  <g>
    <rect x={-700} y={-600} width={2600} height={3400} fill={C.interior} />
    <defs><clipPath id="win"><rect x={-700} y={WIN_Y0} width={2600} height={WIN_Y1 - WIN_Y0} /></clipPath></defs>
    <g clipPath="url(#win)">
      {stopView ?? landAt(T).map(([kind, o], i) => <g key={i} opacity={o}><Scenery kind={kind} off={dist} T={T} /></g>)}
    </g>
    {[-460, -100, 260, 620, 980, 1340].map((x, i) => <rect key={i} x={x} y={WIN_Y0 - 10} width={34} height={WIN_Y1 - WIN_Y0 + 20} fill={C.panel} {...stroke(LINE)} />)}
    <rect x={-700} y={WIN_Y0 - 30} width={2600} height={30} fill={C.panel} {...stroke(LINE)} />
    <rect x={-700} y={WIN_Y1} width={2600} height={40} fill={C.panel} {...stroke(LINE)} />
    {/* the route display: home behind (left), the bus marker heading right, the distance in Western digits */}
    <rect x={60} y={ROUTE_Y - 80} width={960} height={140} rx={20} fill={C.led} {...stroke(LINE)} />
    <path d={`M120 ${ROUTE_Y} L960 ${ROUTE_Y}`} {...stroke(8, '#33416B')} />
    <g transform={`translate(230 ${ROUTE_Y})`}><path d="M0 26 C-20 6 -20 -22 0 -22 C20 -22 20 6 0 26Z" fill={C.pin} /><text x={0} y={-36} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={800} fontSize={30} fill={C.ledOn}>البيت</text></g>
    <g transform={`translate(${lerp(320, 900, Math.min(1, km / 60))} ${ROUTE_Y})`}>
      <rect x={-34} y={-18} width={68} height={36} rx={8} fill={C.ledOn} />
      <path d="M40 0 L60 0 M52 -8 L60 0 L52 8" {...stroke(5, C.ledOn)} fill="none" />
      <text x={0} y={-30} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.ledOn} direction="rtl">{`${Math.round(km)} كم`}</text>
    </g>
    {homey && <>
      {homey.curtain > 0 && [-460, -100, 260, 620, 980].map((x, i) => <path key={i} d={`M${x + 34} ${WIN_Y0} L${x + 34 + 90 * homey.curtain} ${WIN_Y0} Q${x + 60} ${WIN_Y0 + 260} ${x + 34} ${WIN_Y1} Z M${x + 360} ${WIN_Y0} L${x + 360 - 90 * homey.curtain} ${WIN_Y0} Q${x + 334} ${WIN_Y0 + 260} ${x + 360} ${WIN_Y1} Z`} fill={C.scarf} opacity={0.85} {...stroke(LINE * 0.6)} />)}
      {homey.calendar > 0 && <g transform="translate(997 690)"><rect x={-70} y={-90} width={140} height={170} rx={10} fill={C.stripe} {...stroke(LINE)} /><rect x={-70} y={-90} width={140} height={40} fill={C.scarf} /><text x={0} y={40} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={60} fill={INK}>{String(2026 + Math.floor(homey.calendar * 40))}</text></g>}
    </>}
    {/* seats along the wall, facing us */}
    {[-300, 100, 540, 900, 1280].map((x, i) => <path key={i} d={wobRect(x - 150, 960, 300, 470, 30, i, 2)} fill={C.seat} {...stroke(LINE)} />)}
    <rect x={-700} y={FLOOR} width={2600} height={800} fill={C.floor} />
    <path d={`M-700 ${FLOOR} L1900 ${FLOOR}`} {...stroke(LINE * 1.2)} />
    {[120, 980].map((x, i) => <path key={i} d={`M${x} -100 L${x} ${FLOOR}`} {...stroke(16, C.pole)} />)}
    {children}
    {[-300, 100, 540, 900, 1280].map((x, i) => <path key={i} d={wobRect(x - 160, 1460, 320, 70, 18, i + 4, 2)} fill={C.seatDeep} {...stroke(LINE)} />)}
    {front}
  </g>
);

const HX = 540, AX = 900, SY = FLOOR + 10, SS = 0.92;
const sway = (T: number, m: number) => Math.sin(T * 7) * 1.5 * m;
const kmAt = (T: number) => keys(T, [[0, 0], [B.next, 3], [B.buy, 3], [B.desert + 1, 18, 'power1.in'], [B.real, 25], [54, 400, 'power2.in']]);
const distAt = (T: number) => T * 520 - Math.max(0, Math.min(T, B.buy) - B.next) * 520;   // stands still at the stop

/** 2 · ~2.75 — Inside: the display shows home behind and the bus heading away. «بالعكس» — the double take. */
export const S02Inside: React.FC<ShotProps> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const rise = tween(T, B.off - 0.2, B.off + 0.4, 0, 0.45, 'power2.out') * tween(T, B.no - 0.15, B.no + 0.25, 1, 0);
  const look = vecTrack(s30(T), [[0, [0.4, 0.2]], [s30(B.wrong - 0.6), [0, -1]], [s30(B.wrong - 0.1), [0, -1]], [s30(B.next), [1, -0.2]], [s30(B.no), [0, 0.1]]]);
  const expr = xTrack(s30(T), [[0, 'satisfied'], [s30(B.wrong - 0.3), 'surprised'], [s30(B.wrong + 0.4), X.torn], [s30(B.no), X.stubborn]]);
  const moving = T < B.next ? 1 : T > B.buy ? 1 : 0;
  return (
    <Frame T={T} bg={C.interior} start={{ cx: 540, cy: 900, zoom: 1.0 }} moves={[
      { at: L(B.wrong - 0.8), dur: 0.5, cx: 520, cy: 520, zoom: 1.5, ease: 'power3.out' },
      { at: L(B.wrong + 0.2), dur: 0.5, cx: 600, cy: 1150, zoom: 1.3, ease: 'power2.inOut' },
      { at: L(B.off - 0.3), dur: 0.8, cx: 700, cy: 1100, zoom: 1.05, ease: 'power2.inOut' },
    ]}>
      <Interior T={T} dist={distAt(T)} moving={moving} km={kmAt(T)} front={<g transform={`translate(1160 ${FLOOR})`}><rect x={-60} y={-640} width={120} height={640} fill={C.busDeep} {...stroke(LINE)} /><rect x={-50 + 100 * tween(T, B.next + 0.3, B.next + 0.7, 0, 1) * tween(T, B.aunt + 2.4, B.aunt + 2.8, 1, 0)} y={-630} width={100} height={620} fill={C.busWin} opacity={0.7} /></g>}>
        <g transform={`translate(0 ${sway(T, moving)})`}>
          <Aunt x={AX} y={SY} s={SS * 0.95} T={t} sit={1} expr={'satisfied'} look={[-0.4, 0]} pose={P({ armL: [40, 70], armR: [40, 70], handL: 'pinch', handR: 'pinch' })} />
          <Hero x={HX} y={SY} s={SS} T={t} sit={1 - rise} expr={expr} look={look} pose={P({ lean: rise * 16, tilt: T > B.wrong - 0.2 && T < B.wrong + 0.3 ? -10 : 0 })} />
        </g>
      </Interior>
    </Frame>
  );
};

/** 3 · ~11.6 — The aunt gets up, gets off, crosses the street, boards the bus going home — seen through the window. */
export const S03Aunt: React.FC<ShotProps> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const up = tween(T, B.aunt - 0.1, B.aunt + 0.4, 1, 0, 'power2.out');
  const walk = tween(T, B.aunt + 0.4, B.gotOff + 0.2, 0, 1, 'power1.inOut');
  const crossP = tween(T, B.cross - 0.1, B.board, 0, 1, 'power1.inOut');
  const busL = keys(T, [[0, -1600], [B.cross, 200, 'power2.out'], [B.board + 0.5, 200], [B.board + 2.0, -1600, 'power2.in']]);
  const stopView = (
    <g>
      <rect x={-700} y={WIN_Y0} width={2600} height={600} fill={C.sky} />
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={-700 + i * 300} y={WIN_Y0 + 60 + (i % 3) * 40} width={260} height={400} fill={[C.city1, C.city2, C.city3][i % 3]} {...stroke(LINE)} />)}
      <rect x={-700} y={WIN_Y0 + 300} width={2600} height={300} fill={C.road} />
      <g transform={`translate(${busL} ${WIN_Y0 + 360}) scale(0.32)`}><Bus roll={busL / 20} dir={-1} sign="7" tint={C.grassDeep} /></g>
      {crossP > 0 && crossP < 1 && <Aunt x={lerp(900, 330, crossP)} y={WIN_Y0 + 470 - crossP * 70} s={0.46} T={T} facing={-1} pose={walkPose(T * 2, 1)} expr={'satisfied'} />}
      {T > B.board + 0.4 && T < B.board + 1.6 && <g transform={`translate(${busL - 40} ${WIN_Y0 + 230})`}><circle r={18} fill={C.scarf} {...stroke(LINE * 0.5)} /><path d={`M18 -6 l26 ${-16 + Math.sin(T * 14) * 8}`} {...stroke(6)} /></g>}
    </g>
  );
  return (
    <Frame T={T} bg={C.interior} start={{ cx: 700, cy: 1080, zoom: 1.0 }} moves={[{ at: L(B.gotOff), dur: 1.0, cx: 600, cy: 680, zoom: 1.45, ease: 'power2.inOut' }, { at: L(B.board + 0.9), dur: 1.0, cx: 560, cy: 1050, zoom: 1.12, ease: 'power2.inOut' }]}>
      <Interior T={T} dist={distAt(T)} moving={0} km={3} stopView={stopView} front={<g transform={`translate(1160 ${FLOOR})`}><rect x={-60} y={-640} width={120} height={640} fill={C.busDeep} {...stroke(LINE)} /><rect x={50} y={-630} width={0} height={620} fill={C.busWin} /></g>}>
        {walk < 1 && <Aunt x={lerp(AX, 1250, walk)} y={SY} s={SS * 0.95} T={t} sit={up} facing={walk > 0 ? 1 : 1} pose={walk > 0 ? walkPose(T * 2.2, 1) : P({})} expr={'determined'} look={[1, 0]} />}
        <Hero x={HX} y={SY} s={SS} T={t} sit={1} expr={xTrack(s30(T), [[0, X.stubborn], [s30(B.cross), 'skeptical'], [s30(B.board + 0.5), X.sigh]])}
          look={vecTrack(s30(T), [[0, [0.6, 0]], [s30(B.cross - 0.2), [0.3, -1]], [s30(B.board + 1.2), [0, 0.2]]])} pose={P({ armL: [26, -60], armR: [26, -60], handL: 'fist', handR: 'fist', tilt: -4 })} />
      </Interior>
    </Frame>
  );
};

/** 4 · ~17.2 — «اشترى تذكرة ثانية»: the machine prints, the ticket joins the first; the land changes outside:
 *  city → farms → desert. He looks out, a little less sure. */
export const S04Ride: React.FC<ShotProps> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const print = tween(T, B.buy, B.buy + 0.5, 0, 1, 'power2.out');
  const n = T > B.buy + 0.6 ? 2 : 1;
  return (
    <Frame T={T} bg={C.interior} start={{ cx: 640, cy: 1150, zoom: 1.35 }} moves={[{ at: L(B.city - 0.3), dur: 1.2, cx: 540, cy: 860, zoom: 1.0, ease: 'power2.inOut' }, { at: L(B.desert), dur: 3, cx: 540, cy: 900, zoom: 1.06, ease: 'sine.inOut' }]}>
      <Interior T={T} dist={distAt(T) * (T > B.city ? 2.4 : 1)} moving={1} km={kmAt(T)}>
        {/* the ticket machine on the pole */}
        <g transform="translate(980 1180)"><rect x={-70} y={-120} width={140} height={190} rx={16} fill={C.cap} {...stroke(LINE)} /><rect x={-40} y={-90} width={80} height={50} fill={C.ledOn} /><rect x={-50} y={40} width={100} height={12} fill={C.led} /></g>
        {print > 0 && print < 1 && <g transform={`translate(980 ${1232 + print * 50})`}><BusTicket /></g>}
        <g transform={`translate(0 ${sway(T, 1)})`}>
          <Hero x={HX} y={SY} s={SS} T={t} sit={1} expr={xTrack(s30(T), [[0, X.stubborn], [s30(B.buy + 0.6), 'smug'], [s30(B.farms), 'curious'], [s30(B.desert), X.torn]])}
            look={vecTrack(s30(T), [[0, [0.9, 0.2]], [s30(B.buy + 0.7), [0, 0]], [s30(B.city), [0.2, -1]]])}
            handR={T < B.buy + 0.7 ? [lerp(820, 960, tween(T, B.buy - 0.4, B.buy, 0, 1)), 1250] : [620, 1300]} holdR={<g transform="rotate(-10)"><BusTicket n={n} /></g>} />
        </g>
      </Interior>
    </Frame>
  );
};

/** Thought bubble (own space: centre 0,0) with an icon and a short line. */
const Bubble: React.FC<{ p: number; children: React.ReactNode; text: string; c?: string }> = ({ p, children, text, c = C.stripe }) => (
  <g transform={`scale(${p})`} opacity={Math.min(1, p * 2)}>
    <path d={wobEllipse(0, 0, 230, 150, 7, 0.06, 14)} fill={c} {...stroke(LINE)} />
    <circle cx={-140} cy={180} r={26} fill={c} {...stroke(LINE * 0.8)} /><circle cx={-180} cy={240} r={14} fill={c} {...stroke(LINE * 0.8)} />
    <g transform="translate(0 -40)">{children}</g>
    <text x={0} y={95} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={900} fontSize={46} fill={INK}>{text}</text>
  </g>
);

/** 5 · ~23.7 — Excuses, as bubbles: «دفعت كثير», «يلف ويرجع»; then the real one, «غلطت؟» — he hides his face and swats it away. */
export const S05Excuses: React.FC<ShotProps> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const b1 = tween(T, B.paid - 0.2, B.paid + 0.25, 0, 1, 'back.out(2)') * tween(T, B.real - 0.3, B.real, 1, 0);
  const b2 = tween(T, B.loop - 0.2, B.loop + 0.25, 0, 1, 'back.out(2)') * tween(T, B.real - 0.3, B.real, 1, 0);
  const b3 = tween(T, B.wrongStart - 0.4, B.wrongStart + 0.1, 0, 1, 'back.out(2)');
  const swat = tween(T, B.wrongStart + 1.0, B.wrongStart + 1.3, 0, 1, 'power3.in');
  const hide = tween(T, B.wrongStart - 0.1, B.wrongStart + 0.3, 0, 1) * (1 - swat);
  const head: [number, number] = [HX, SY - 470];
  return (
    <Frame T={T} bg={C.interior} start={{ cx: 540, cy: 900, zoom: 1.0 }} moves={[{ at: L(B.reason - 0.3), dur: 1.0, cx: 540, cy: 1000, zoom: 1.15 }, { at: L(B.real - 0.2), dur: 0.8, cx: 560, cy: 1050, zoom: 1.32, ease: 'power3.inOut' }]}>
      <Interior T={T} dist={distAt(T) * 2.4} moving={1} km={kmAt(T)}>
        <g transform={`translate(0 ${sway(T, 1)})`}>
          <Hero x={HX} y={SY} s={SS} T={t} sit={1} expr={xTrack(s30(T), [[0, X.torn], [s30(B.reason), 'curious'], [s30(B.paid), 'smug'], [s30(B.real), X.gulp], [s30(B.wrongStart), 'embarrassed'], [s30(B.wrongStart + 1.2), X.stubborn]])}
            look={vecTrack(s30(T), [[0, [0.3, -1]], [s30(B.reason), [-0.5, -0.8]], [s30(B.loop), [0.6, -0.8]], [s30(B.real), [0, 0.2]]])}
            handL={hide > 0 ? [head[0] - 40, head[1] + 10] : null} handR={hide > 0 ? [head[0] + 40, head[1] + 10] : swat > 0 ? [lerp(head[0] + 60, head[0] + 300, swat), head[1] - 120] : null} />
        </g>
        <g transform={`translate(330 ${640 + Math.sin(T * 2) * 8})`}><Bubble p={b1} text="دفعت كثير"><g transform="translate(0 -22)"><BusTicket n={2} /></g></Bubble></g>
        <g transform={`translate(760 ${600 + Math.sin(T * 2 + 1) * 8})`}><Bubble p={b2} text="يلف ويرجع"><path d="M-50 20 A60 60 0 1 1 40 50" fill="none" {...stroke(14, C.cap)} /><path d="M20 40 L44 54 L52 26" fill="none" {...stroke(12, C.cap)} /></Bubble></g>
        <g transform={`translate(${lerp(560, 1500, swat)} ${560 - swat * 200}) rotate(${swat * 40})`}><Bubble p={b3} text="غلطت؟!" c={C.knit}><circle r={58} fill={C.stripe} {...stroke(LINE)} /><path d="M-30 -30 L30 30 M30 -30 L-30 30" {...stroke(14, C.scarf)} /></Bubble></g>
      </Interior>
    </Frame>
  );
};

/* ---------------- the map: the road behind sinks; the useful line starts from here ---------------- */

const ROUTE = 'M180 1520 C420 1500 520 1360 600 1180 C680 1000 820 980 880 820 C940 660 860 520 900 380';
const HOME: [number, number] = [120, 1640];
const NEW = 'M900 380 C700 420 520 560 420 780 C320 1000 200 1300 120 1600';

/** 6 · ~34.4 — The map: the route drawn as the bus goes; «غرق وراك» — the travelled road sinks into the sea behind it;
 *  «نزلت أو كمّلت» — it is gone either way; «من مكاني الحين… وين أقرب طريق؟» — the new line home, from here. */
export const S06Map: React.FC<ShotProps> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const drive = tween(T, t0, B.sank, 0.45, 1, 'power1.inOut');
  const sink = tween(T, B.sank - 0.2, B.either + 0.4, 0, 1, 'power2.inOut');
  const bus = alongPath(ROUTE, drive);
  const fresh = tween(T, B.nearest - 0.6, B.nearest + 0.9, 0, 1, 'power2.inOut');
  const ask = tween(T, B.here - 0.3, B.here + 0.2, 0, 1);
  return (
    <Frame T={T} bg={C.map} start={{ cx: 540, cy: 980, zoom: 1.0 }} moves={[{ at: L(B.sank - 0.4), dur: 1.4, cx: 520, cy: 1080, zoom: 0.92, ease: 'power2.inOut' }, { at: L(B.here - 0.4), dur: 1.2, cx: 560, cy: 960, zoom: 0.95, ease: 'power2.inOut' }]}
      overlay={<>
        <Pill t={T} from={B.name - 0.05} to={B.q - 0.3} text="مغالطة التكلفة الغارقة" top={260} size={58} bg={C.cap} />
        <Pill t={T} from={B.here - 0.1} to={99} text="من هنا… وين أقرب طريق؟" top={260} size={56} bg={C.pin} />
      </>}>
      <rect x={-700} y={-600} width={2600} height={3400} fill={C.map} />
      {Array.from({ length: 30 }, (_, i) => <path key={i} d={wobRect(-500 + (i % 6) * 330, -200 + Math.floor(i / 6) * 420, 260, 320, 20, i, 4)} fill={C.mapBlock} />)}
      {/* side streets */}
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${-500 + i * 330} -400 L${-500 + i * 330} 2400`} {...stroke(26, C.walk)} />)}
      {/* the sea that takes the road behind */}
      <DrawPath d={ROUTE} p={drive} stroke={C.mapRoad} strokeWidth={46} />
      <DrawPath d={ROUTE} p={drive} stroke={C.stripe} strokeWidth={6} strokeDasharray={undefined} />
      <DrawPath d={ROUTE} p={Math.min(drive, sink)} stroke={C.water} strokeWidth={140} />
      <DrawPath d={ROUTE} p={Math.min(drive, sink * 0.98)} stroke={C.waterDeep} strokeWidth={70} opacity={0.6} />
      {sink > 0.1 && Array.from({ length: 8 }, (_, i) => { const w = alongPath(ROUTE, Math.min(sink, drive) * (i / 8)); return <path key={i} d={`M${w.x - 30} ${w.y} q15 -12 30 0 q15 12 30 0`} fill="none" {...stroke(5, C.stripe)} opacity={0.8} />; })}
      {/* home, and the new useful line from where he is now */}
      <g transform={`translate(${HOME[0]} ${HOME[1]})`}><path d="M0 60 C-40 18 -40 -34 0 -34 C40 -34 40 18 0 60Z" fill={C.pin} {...stroke(LINE)} /><circle cy={-4} r={12} fill={C.stripe} /><text x={10} y={-56} textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={900} fontSize={50} fill={INK}>البيت</text></g>
      <DrawPath d={NEW} p={fresh} stroke={C.pin} strokeWidth={16} strokeDasharray={undefined} />
      {fresh > 0 && <circle cx={alongPath(NEW, fresh).x} cy={alongPath(NEW, fresh).y} r={14} fill={C.pin} />}
      <circle cx={bus.x} cy={bus.y} r={70 + 20 * Math.sin(T * 4)} fill={C.pin} opacity={0.18 * ask} />
      <g transform={`translate(${bus.x} ${bus.y}) rotate(${bus.angle}) scale(0.16)`}><Bus roll={T * 4} /></g>
    </Frame>
  );
};

/** 7 · ~46.6 — But he makes the bus his home: a picture, a plant, curtains; slippers. */
export const S07Home: React.FC<ShotProps> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const pic = tween(T, B.picture - 0.4, B.picture + 0.2, 0, 1, 'back.out(1.6)');
  const plant = tween(T, B.plant - 0.4, B.plant + 0.2, 0, 1, 'back.out(1.6)');
  const curtain = tween(T, B.home - 0.4, B.home + 0.4, 0, 1, 'power2.out');
  const reach = T < B.picture + 0.2 ? tween(T, B.picture - 0.7, B.picture - 0.3, 0, 1) : tween(T, B.picture + 0.2, B.picture + 0.6, 1, 0);
  return (
    <Frame T={T} bg={C.interior} start={{ cx: 540, cy: 980, zoom: 1.05 }} moves={[{ at: L(B.home - 0.3), dur: 1.6, cx: 540, cy: 900, zoom: 0.95, ease: 'power2.inOut' }]}>
      <Interior T={T} dist={distAt(T) * 2.4} moving={1} km={kmAt(T)} homey={{ picture: pic, plant, curtain, calendar: 0 }}
        front={<g>
          {/* the plant on the next seat */}
          <g transform={`translate(${AX} 1460) scale(${plant})`}><path d="M-60 0 L60 0 L46 -110 L-46 -110 Z" fill={C.scarf} {...stroke(LINE)} /><path d="M0 -110 Q-30 -220 -90 -240 M0 -110 Q20 -230 80 -260 M0 -110 Q0 -260 10 -300" fill="none" {...stroke(16, C.grassDeep)} /></g>
          {/* slippers */}
          <g opacity={curtain}><path d={wobEllipse(470, FLOOR + 30, 50, 18, 3, 0.05, 8)} fill={C.knit} {...stroke(LINE * 0.6)} /><path d={wobEllipse(610, FLOOR + 30, 50, 18, 4, 0.05, 8)} fill={C.knit} {...stroke(LINE * 0.6)} /></g>
        </g>}>
        {/* the framed picture on the wall between the windows */}
        <g transform={`translate(300 ${1010 - (1 - pic) * 40})`} opacity={pic}><path d={wobRect(-90, -70, 180, 140, 8, 3, 2)} fill={C.stripe} {...stroke(LINE)} /><path d="M-60 40 L-20 -10 L10 20 L30 0 L60 40 Z" fill={C.grass} /><circle cx={40} cy={-34} r={14} fill={C.knit} /></g>
        <g transform={`translate(0 ${sway(T, 1)})`}>
          <Hero x={HX} y={SY} s={SS} T={t} sit={1} beard={tween(T, t0, t0 + 5, 0.05, 0.18)} expr={xTrack(s30(T), [[0, 'smug'], [s30(B.home), 'satisfied']])}
            look={vecTrack(s30(T), [[0, [-0.8, -0.3]], [s30(B.plant - 0.3), [0.8, 0]], [s30(B.home), [0, -0.1]]])}
            handR={reach > 0 ? [lerp(560, 320, reach), lerp(1300, 1010, reach)] : null} handL={tween(T, B.plant - 0.5, B.plant, 0, 1) * tween(T, B.plant + 0.2, B.plant + 0.6, 1, 0) > 0 ? [AX - 120, 1360] : null} />
        </g>
      </Interior>
    </Frame>
  );
};

/** 8 · ~51.6 — «ثلج… بحر… وسنين»: snow, then the sea (on a ferry), the calendar racing, the beard growing white. */
export const S08Years: React.FC<ShotProps> = ({ t, T, t0 }) => {
  const yrs = tween(T, B.snow - 0.3, B.years + 1.0, 0, 1, 'power1.in');
  return (
    <Frame T={T} bg={C.interior} start={{ cx: 600, cy: 1000, zoom: 1.0 }} moves={[{ at: 0, dur: 2.8, cx: 640, cy: 1050, zoom: 1.12, ease: 'sine.inOut' }]}>
      <Interior T={T} dist={distAt(T) * 2.4} moving={1} km={kmAt(T)} homey={{ picture: 1, plant: 1, curtain: 1, calendar: yrs }}
        front={<g transform={`translate(${AX} 1460)`}><path d="M-60 0 L60 0 L46 -110 L-46 -110 Z" fill={C.scarf} {...stroke(LINE)} /><path d={`M0 -110 Q-30 -${220 + yrs * 200} -90 -${240 + yrs * 260} M0 -110 Q20 -${230 + yrs * 200} 80 -${260 + yrs * 260} M0 -110 Q0 -${260 + yrs * 260} 10 -${300 + yrs * 320}`} fill="none" {...stroke(16, C.grassDeep)} /></g>}>
        <g transform="translate(300 1010)"><path d={wobRect(-90, -70, 180, 140, 8, 3, 2)} fill={C.stripe} {...stroke(LINE)} /><path d="M-60 40 L-20 -10 L10 20 L30 0 L60 40 Z" fill={C.grass} /><circle cx={40} cy={-34} r={14} fill={C.knit} /></g>
        <g transform={`translate(0 ${sway(T, 1)})`}>
          <Hero x={HX} y={SY} s={SS} T={t} sit={1} beard={lerp(0.18, 1, yrs)} age={yrs} expr={xTrack(s30(T), [[0, 'satisfied'], [s30(B.sea), 'curious'], [s30(B.years), X.sigh]])} look={[0.3, -0.6]} pose={P({ tilt: 6 * yrs, lean: 4 * yrs })} />
        </g>
      </Interior>
    </Frame>
  );
};

/* ---------------- the globe ---------------- */

const GC: [number, number] = [540, 1040], GR = 330;
const LAP = `M${GC[0] + 6} ${GC[1] - GR - 40} A${GR + 40} ${GR + 40} 0 1 1 ${GC[0] - 6} ${GC[1] - GR - 40}`;
/** 9 · ~54.4 — Space: home and his first stop side by side on top of the globe; the bus goes the long way round
 *  (east), and comes back from the west — to the stop just before his first one. «وصل!» */
export const S09Globe: React.FC<ShotProps> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const lap = tween(T, t0 + 0.3, B.arrived + 0.1, 0, 1, 'power1.inOut');
  const b = alongPath(LAP, lap);
  const pop = tween(T, B.arrived, B.arrived + 0.4, 0, 1, 'back.out(2.4)');
  return (
    <Frame T={T} bg={C.space} start={{ cx: 540, cy: 1040, zoom: 1.0 }} moves={[{ at: 0, dur: 1.0, cx: 540, cy: 1040, zoom: 0.95 }, { at: L(B.arrived - 0.2), dur: 1.4, cx: 540, cy: 760, zoom: 1.6, ease: 'power3.inOut' }]}>
      <rect x={-700} y={-600} width={2600} height={3400} fill={C.space} />
      {Array.from({ length: 70 }, (_, i) => <circle key={i} cx={(i * 211) % 1500 - 200} cy={(i * 157) % 2300 - 200} r={2 + (i % 3)} fill={C.star} opacity={0.4 + 0.6 * Math.abs(Math.sin(T * 1.5 + i))} />)}
      <g transform={`rotate(${-lap * 20} ${GC[0]} ${GC[1]})`}>
        <circle cx={GC[0]} cy={GC[1]} r={GR} fill={C.globeSea} {...stroke(LINE * 1.3)} />
        {[[-140, -120, 120, 90], [120, 40, 150, 110], [-60, 170, 90, 60], [170, -170, 70, 50]].map(([dx, dy, rx, ry], i) => <path key={i} d={wobEllipse(GC[0] + dx, GC[1] + dy, rx, ry, i + 2, 0.12, 12)} fill={C.globeLand} {...stroke(LINE * 0.8)} />)}
      </g>
      <DrawPath d={LAP} p={lap} stroke={C.pin} strokeWidth={8} opacity={0.8} />
      {/* home (left) and the first stop (right), side by side at the top */}
      <g transform={`translate(${GC[0] - 34} ${GC[1] - GR - 6})`}><path d="M0 24 C-16 8 -16 -14 0 -14 C16 -14 16 8 0 24Z" fill={C.pin} transform="scale(1.4)" /></g>
      <circle cx={GC[0] + 34} cy={GC[1] - GR - 4} r={12} fill={C.cap} {...stroke(LINE * 0.6)} />
      <g transform={`translate(${b.x} ${b.y}) rotate(${b.angle}) scale(0.11)`}><Bus roll={T * 6} /></g>
      <g transform={`translate(${GC[0] - 34} ${GC[1] - GR - 120}) scale(${pop})`}><text textAnchor="middle" direction="rtl" fontFamily={FONT} fontWeight={900} fontSize={84} fill={C.stripe}>وصل!</text></g>
    </Frame>
  );
};

/** 10 · ~58.7 — Back on the street: the bus comes from the west and stops at home — and his first stop is right there,
 *  a few steps ahead. Out steps a very old man in slippers, holding his plant. */
export const S10Arrive: React.FC<ShotProps> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const busX = keys(T, [[t0, -1300], [t0 + 1.0, HOUSE_X + 260, 'power2.out'], [B.exactly + 1.5, HOUSE_X + 260]]);
  const out = tween(T, t0 + 1.3, t0 + 2.0, 0, 1, 'power1.inOut');
  return (
    <Frame T={T} bg={C.sky} start={{ cx: HOUSE_X + 200, cy: 1150, zoom: 1.0 }} moves={[{ at: 1.8, dur: 0.6, cx: HOUSE_X + 260, cy: 1250, zoom: 1.2 }, { at: L(B.first - 0.4), dur: 1.4, cx: 340, cy: 1150, zoom: 0.8, ease: 'power2.inOut' }]}>
      <Street T={T} far={<><House x={HOUSE_X} y={1050} glow={1} /><Stop x={HOUSE_X + 480} y={1050} s={0.9} /><Stop x={600} y={1050} label="7" s={0.9} /></>}>
        <g transform={`translate(${busX} 1560)`}><Bus roll={busX / 62} door={out > 0 ? 1 : 0} /></g>
        {out > 0 && <Hero x={lerp(HOUSE_X + 420, HOUSE_X + 500, out)} y={1700} s={0.7} T={t} beard={1} age={1} expr={'laugh'} look={[0.3, -0.2]} pose={out < 1 ? walkPose(T * 1.6, 0.6) : P({ lean: 10, tilt: 6 })} holdR={<g transform="scale(0.5)"><path d="M-60 0 L60 0 L46 -110 L-46 -110 Z" fill={C.scarf} {...stroke(LINE)} /><path d="M0 -110 Q-30 -420 -90 -500 M0 -110 Q20 -430 80 -520" fill="none" {...stroke(16, C.grassDeep)} /></g>} />}
        {/* «كانت قدام محطته الأولى، بالضبط»: the first stop, a few steps ahead */}
        <path d={`M${HOUSE_X + 560} 1000 Q${(HOUSE_X + 600 + 600) / 2} 860 560 1000`} fill="none" {...stroke(10, C.pin)} strokeDasharray="22 18" opacity={tween(T, B.first, B.first + 0.4, 0, 1)} />
      </Street>
    </Frame>
  );
};

const BENCH_Y = 1640;
/** A street bench: back (behind the sitters) and seat (over their thighs), spanning x0..x1. */
const BenchBack: React.FC<{ x0: number; x1: number }> = ({ x0, x1 }) => <path d={wobRect(x0, BENCH_Y - 190, x1 - x0, 60, 14, 3, 2)} fill={C.seat} {...stroke(LINE)} />;
const BenchSeat: React.FC<{ x0: number; x1: number }> = ({ x0, x1 }) => (
  <g>
    <path d={wobRect(x0, BENCH_Y - 14, x1 - x0, 40, 10, 5, 2)} fill={C.seatDeep} {...stroke(LINE)} />
    {[x0 + 30, x1 - 30].map((x, i) => <path key={i} d={`M${x} ${BENCH_Y + 24} L${x} ${BENCH_Y + 64}`} {...stroke(LINE * 1.4)} />)}
  </g>
);

/** 11 · ~63.4 — The aunt, waiting at his door with tea — and forty years of knitting at her feet. */
export const S11AuntWaits: React.FC<ShotProps> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const scarf = tween(T, t0, B.forty + 0.6, 400, 4200, 'power2.in');
  return (
    <Frame T={T} bg={C.sky} start={{ cx: HOUSE_X + 470, cy: 1400, zoom: 1.3 }} moves={[{ at: L(B.forty - 0.3), dur: 1.2, cx: HOUSE_X + 470, cy: 1300, zoom: 0.95, ease: 'power2.inOut' }]}>
      <Street T={T} far={<><House x={HOUSE_X} y={1050} glow={1} /><Stop x={HOUSE_X + 480} y={1050} s={0.9} /></>}>
        <BenchBack x0={HOUSE_X + 330} x1={HOUSE_X + 760} />
        <Aunt x={HOUSE_X + 460} y={1700} s={0.72} T={t} sit={1} expr={xTrack(s30(T), [[0, 'smug'], [s30(B.forty), 'laugh']])} look={[0.6, -0.1]} holdL={<Scarf len={scarf} />} pose={P({ armL: [30, 60], handL: 'pinch' })} />
        <BenchSeat x0={HOUSE_X + 330} x1={HOUSE_X + 760} />
        <g transform={`translate(${HOUSE_X + 470} 1760)`}>{Array.from({ length: Math.floor(scarf / 300) }, (_, i) => <ellipse key={i} cx={-200 + (i % 7) * 70} cy={-Math.floor(i / 7) * 34} rx={70} ry={26} fill="none" {...stroke(30, C.knit)} />)}</g>
        <Hero x={HOUSE_X + 800} y={1700} s={0.7} T={t} beard={1} age={1} expr={xTrack(s30(T), [[0, 'surprised'], [s30(B.forty + 0.3), 'embarrassed']])} look={[-0.8, 0.1]} pose={P({ tilt: 8 })} />
      </Street>
    </Frame>
  );
};

/** 12 · ~67.2 — On the bench together: the road behind fades, the road ahead lights up. «اسأل عن اللي قدامك…» */
export const S12Ahead: React.FC<ShotProps> = ({ t, T, t0 }) => {
  const L = (x: number) => x - t0;
  const ahead = tween(T, B.ahead - 0.3, B.ahead + 0.6, 0, 1, 'power2.out');
  const behind = tween(T, B.behind - 0.2, B.behind + 0.5, 1, 0.25);
  return (
    <Frame T={T} bg={C.sky} start={{ cx: 600, cy: 1350, zoom: 1.15 }} moves={[{ at: L(B.closer - 0.4), dur: 1.4, cx: 700, cy: 1300, zoom: 1.0, ease: 'power2.inOut' }]}>
      <Street T={T} far={<><House x={HOUSE_X} y={1050} glow={1} /><Stop x={HOUSE_X + 480} y={1050} s={0.9} /></>}>
        <rect x={-1400} y={1160} width={1650} height={420} fill={C.road} opacity={1 - behind * 0} />
        <rect x={-1400} y={1160} width={1650} height={420} fill={C.sky} opacity={1 - behind} />
        <DrawPath d="M300 1370 L2200 1370" p={ahead} stroke={C.pin} strokeWidth={22} />
        <path d="M2160 1330 L2220 1370 L2160 1410" fill="none" {...stroke(22, C.pin)} opacity={ahead} />
        <BenchBack x0={HOUSE_X + 300} x1={HOUSE_X + 740} />
        <Aunt x={HOUSE_X + 420} y={1700} s={0.72} T={t} sit={1} expr={'satisfied'} look={[0.7, 0]} />
        <Hero x={HOUSE_X + 610} y={1700} s={0.7} T={t} sit={1} beard={1} age={1} expr={xTrack(s30(T), [[0, X.sigh], [s30(B.closer), 'curious'], [s30(B.ahead), 'satisfied']])}
          look={vecTrack(s30(T), [[0, [-0.9, 0]], [s30(B.ahead - 0.2), [1, -0.1]]])} pose={poseTrack(s30(T), [[0, P({})], [s30(B.ahead), P({ ...POSES.point })]], 8)} />
        <BenchSeat x0={HOUSE_X + 300} x1={HOUSE_X + 740} />
      </Street>
    </Frame>
  );
};

/** 13 · ~73.6 — The question, and the closing card; the two of them laugh on the bench. */
export const S13Close: React.FC<ShotProps> = ({ t, T }) => (
  <Frame T={T} bg={C.sky} start={{ cx: HOUSE_X + 520, cy: 1420, zoom: 1.3 }} moves={[{ at: 0, dur: 8, cx: HOUSE_X + 520, cy: 1380, zoom: 1.16, ease: 'sine.inOut' }]}
    overlay={<>
      <Pill t={T} from={B.qa} to={99} text="لو بدأت اليوم من الصفر…" top={300} size={54} bg="rgba(22,33,62,0.88)" />
      <Pill t={T} from={B.qb} to={99} text="هل كنت ستختار الشيء نفسه؟" top={410} size={54} bg={C.cap} />
      <EndCard t={T} from={B.cta + 0.2} accent={C.pin} top={1600} chipBg="rgba(22,33,62,0.85)" brandColor={C.busDeep} />
    </>}>
    <Street T={T} far={<><House x={HOUSE_X} y={1050} glow={1} /><Stop x={HOUSE_X + 480} y={1050} s={0.9} /></>}>
      <BenchBack x0={HOUSE_X + 300} x1={HOUSE_X + 740} />
      <Aunt x={HOUSE_X + 420} y={1700} s={0.72} T={t} sit={1} expr={'laugh'} look={[0.7, 0]} pose={P({ tilt: Math.sin(T * 4) * 4 })} />
      <Hero x={HOUSE_X + 610} y={1700} s={0.7} T={t} sit={1} beard={1} age={1} expr={'laugh'} look={[-0.7, 0]} pose={P({ tilt: Math.sin(T * 4 + 1) * 4 })} />
      <BenchSeat x0={HOUSE_X + 300} x1={HOUSE_X + 740} />
    </Street>
  </Frame>
);

export { lerp, INK };
