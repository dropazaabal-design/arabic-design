import React from 'react';
import { Bell, Call, Cross, Dumbbell, Internet, Lens, Message, Notebook, Pencil, Phone, Reset, TimerRing, TwoWeeks } from './art/reel';
import { Check, along, curve, svgPath } from './art/world';
import { T } from './copy';
import { Stage } from './Stage';
import { Headline, Note, WordByWord } from './text';
import { C, TITLE } from './theme';
import { ease, mix, prog, sec, sceneStart, useEpisodeFrame, wordAt } from './time';

// Three continuous stages (each draws its own world once, so scene changes inside it never flicker):
//   A  sc01–sc03  the phone, the timer, the path back to it, the lens       (light)
//   B  sc04       the published experiment: two weeks, internet cut, calls and texts kept (navy)
//   C  sc05–sc06  two minutes vs two weeks, the phone put away, the two paths, the timer again (light)

const Title: React.FC<{ text: string; f: number; at: number; until?: number; color?: string; size?: number }> = ({ text, f, at, until, color = C.ink, size = 96 }) => (
  <Headline text={text} f={f} at={at} until={until} x={540} y={TITLE.y} w={960} size={size} color={color} />
);

/* ───────────── A: sc01–sc03 ───────────── */

const LOOP = curve([[[540, 800], [960, 700], [920, 400], [540, 440]], [[540, 440], [160, 400], [120, 700], [540, 800]]]);
const PERIOD = 1.2;

export const StageA: React.FC = () => {
  const f = useEpisodeFrame();
  const b = {
    q: wordAt('s01', 'دقيقتين'), no: wordAt('s01', 'بلا'), phone: wordAt('s01', 'هاتف'),
    try: wordAt('s02', 'جرب'), even: wordAt('s02', 'حتى'), notif: wordAt('s02', 'إشعار'),
    not: wordAt('s03', 'ليست'), test: wordAt('s03', 'اختبار'), but: wordAt('s03', 'بل'), notice: wordAt('s03', 'ملاحظة'), habit: wordAt('s03', 'عادة'),
  };
  const ringP = prog(f, sec(0.3), sec(2.6), (x) => x);
  const toLoop = prog(f, sceneStart('sc02') + sec(0.1), sec(0.6), ease.inOut);
  const ph = { x: 540, y: mix(900, 1060, toLoop), s: mix(0.85, 0.72, toLoop) };
  const loopDraw = prog(f, sceneStart('sc02') + sec(0.3), sec(0.5), ease.inOut);
  // the dot leaves the phone and comes back, again and again; it stops when the idea turns to noticing
  const run = Math.max(0, (Math.min(f, b.not) - b.try) / sec(PERIOD));
  const [dx, dy] = along(LOOP, run % 1);
  const returns = Math.floor(run);
  const sinceReturn = (run - returns) * PERIOD;
  const flash = returns > 0 && f < b.not + sec(0.3) ? Math.max(0, 1 - sinceReturn / 0.3) : 0;
  const bell = prog(f, b.even - sec(0.2), sec(0.35), ease.out) * (1 - prog(f, b.test - sec(0.3), sec(0.3)));
  const dumb = prog(f, b.test - sec(0.1), sec(0.35), ease.out) * (1 - prog(f, b.notice + sec(0.2), sec(0.3)));
  const lens = prog(f, b.notice - sec(0.15), sec(0.6), ease.out);
  const tallyScale = mix(1, 1.45, lens);
  return (
    <Stage f={f} svg={
      <>
        {/* sc01: the two minutes set around the phone */}
        <g opacity={1 - toLoop}><TimerRing x={540} y={900} r={400} p={ringP} /></g>
        {/* sc02: the path back to the phone */}
        {loopDraw > 0 && <path d={svgPath(LOOP)} fill="none" stroke={C.blue} strokeWidth={10} strokeDasharray="4 22" strokeLinecap="round" opacity={0.7 * loopDraw} />}
        <Phone x={ph.x} y={ph.y} s={ph.s} flash={flash} />
        {f >= b.try && <circle cx={dx} cy={dy} r={26} fill={f < b.not ? C.blue : C.red} stroke={C.white} strokeWidth={6} />}
        {/* how many times: one mark per return, in a row at the left */}
        <g transform={`translate(215 1010) scale(${tallyScale}) translate(-215 -1010)`}>
          {Array.from({ length: Math.min(returns, 6) }).map((_, i) => (
            <path key={i} d={`M ${300 - i * 34} 965 L ${300 - i * 34} 1055`} stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
          ))}
        </g>
        {bell > 0 && <Bell x={850} y={1000} s={mix(0.6, 1.05, bell)} o={bell} />}
        {/* sc03: not a test of strength — noticing */}
        {dumb > 0 && <g opacity={dumb}><Dumbbell x={215} y={640} s={mix(0.6, 1.1, dumb)} /><Cross x={215} y={640} size={90} p={prog(f, b.but - sec(0.05), sec(0.4))} /></g>}
        {lens > 0 && <Lens x={mix(-150, 215, lens)} y={mix(1300, 1010, lens)} r={150} o={lens} />}
      </>
    }>
      <WordByWord text={T.sc01.title.join(' ')} f={f} times={[b.q - sec(0.05), b.no - sec(0.05), b.phone - sec(0.05)]} until={sceneStart('sc02') + sec(0.2)} x={540} y={TITLE.y} w={960} size={104} color={C.ink} />
      <Title text={T.sc02.title} f={f} at={b.even - sec(0.1)} until={sceneStart('sc03') + sec(0.3)} />
      <Title text={T.sc03.title} f={f} at={b.habit - sec(0.1)} color={C.blue} />
    </Stage>
  );
};

/* ───────────── B: sc04 ───────────── */

export const StageB: React.FC = () => {
  const f = useEpisodeFrame();
  const b = {
    study: wordAt('s04', 'تجربة'), cut: wordAt('s04', 'حجب'), weeks: wordAt('s04', 'أسبوعين'), calls: wordAt('s04', 'المكالمات'), texts: wordAt('s04', 'والرسائل'),
    better: wordAt('s05', 'تحسن'), but: wordAt('s05', 'لكن'), keep: wordAt('s05', 'الالتزام'), easy: wordAt('s05', 'سهلا'),
  };
  const cal = prog(f, b.study - sec(0.2), sec(0.5), ease.out);
  const filled = 14 * prog(f, b.weeks - sec(0.1), sec(1.0), (x) => x);
  const icons = 1 - prog(f, b.better - sec(0.3), sec(0.4), ease.in);
  const cut = prog(f, b.cut - sec(0.05), sec(0.4), ease.inOut);
  const line = prog(f, b.better - sec(0.1), sec(1.4), ease.inOut);
  // keeping it up was not easy: the phone keeps pushing back toward the two weeks
  const push = f < b.keep ? 0 : Math.abs(Math.sin(((f - b.keep) / sec(0.75)) * Math.PI)) * (1 - prog(f, b.easy + sec(0.4), sec(0.4)));
  const phoneIn = prog(f, b.keep - sec(0.2), sec(0.3)) * (1 - prog(f, b.easy + sec(0.5), sec(0.3)));
  return (
    <Stage f={f} dark svg={
      <>
        <g opacity={cal}><TwoWeeks x={540} y={580} filled={filled} dark /></g>
        {icons > 0 && (
          <g opacity={icons}>
            <Internet x={540} y={960} s={1.05} cut={cut} />
            <Call x={300} y={1180} ok={prog(f, b.calls - sec(0.05), sec(0.3), ease.out)} />
            <Message x={780} y={1180} ok={prog(f, b.texts - sec(0.05), sec(0.3), ease.out)} />
          </g>
        )}
        {line > 0 && (
          <path d="M 170 1150 C 330 1140, 380 1060, 520 1040 S 760 940, 910 900" fill="none" stroke={C.green} strokeWidth={18} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - line} />
        )}
        {phoneIn > 0 && <Phone x={540} y={mix(1000, 820, push)} s={0.26} o={phoneIn} />}
        {phoneIn > 0 && push > 0.85 && <path d="M 470 762 L 440 736 M 540 755 L 540 720 M 610 762 L 640 736" stroke={C.red} strokeWidth={10} strokeLinecap="round" />}
      </>
    }>
      <Title text={T.sc04.title} f={f} at={b.cut - sec(0.1)} color={C.white} size={82} />
      <Note text={T.sc04.source} f={f} at={b.study} x={540} y={410} w={960} size={36} color={C.aqua} align="center" />
    </Stage>
  );
};

/* ───────────── C: sc05–sc06 ───────────── */

const HABIT = curve([[[565, 860], [940, 800], [920, 520], [720, 560]], [[720, 560], [575, 590], [570, 720], [565, 860]]]);

export const StageC: React.FC = () => {
  const f = useEpisodeFrame();
  const b = {
    this: wordAt('s06', 'هذا'), two: wordAt('s06', 'دقيقتين'), reset: wordAt('s06', 'تعيدان'), brain: wordAt('s06', 'دماغك'),
    start: wordAt('s07', 'ابدأ'), put: wordAt('s07', 'ضع'), away: wordAt('s07', 'بعيدا'), choose: wordAt('s07', 'اختر'),
    after: wordAt('s08', 'بعد'), q: wordAt('s08', 'هل'), reason: wordAt('s08', 'لسبب'), mere: wordAt('s08', 'لمجرد'), habit: wordAt('s08', 'العادة'),
  };
  const end = sec(41.74);
  const barsOut = prog(f, b.start - sec(0.3), sec(0.4), ease.in);
  const weeks = prog(f, b.this - sec(0.1), sec(0.6), ease.out), mins = prog(f, b.two - sec(0.1), sec(0.4), ease.out);
  const reset = prog(f, b.reset - sec(0.1), sec(0.35), ease.out);
  // the phone: appears, is put away, comes back for the closing question
  const phIn = prog(f, b.start - sec(0.1), sec(0.4), ease.out);
  const away = prog(f, b.put - sec(0.05), sec(0.8), ease.inOut);
  const back = prog(f, b.after - sec(0.2), sec(0.6), ease.inOut);
  const ph = { x: mix(mix(540, 850, away), 540, back), y: mix(mix(1000, 560, away), 1060, back), s: mix(mix(0.5, 0.24, away), 0.55, back) };
  const book = prog(f, b.choose - sec(0.1), sec(0.4), ease.out) * (1 - prog(f, b.after - sec(0.3), sec(0.4)));
  const write = prog(f, b.choose + sec(0.1), sec(1.4), (x) => x);
  const purpose = prog(f, b.reason - sec(0.1), sec(0.6), ease.inOut);
  const loop = prog(f, b.mere - sec(0.1), sec(0.7), ease.inOut);
  const ring = prog(f, b.habit + sec(0.95), sec(1.2), ease.inOut);
  const paths = 1 - prog(f, b.habit + sec(1.0), sec(0.5));
  const [hx, hy] = along(HABIT, ((f - b.mere) / sec(1.1)) % 1);
  return (
    <Stage f={f} svg={
      <>
        {/* two minutes next to two weeks */}
        {barsOut < 1 && (
          <g opacity={1 - barsOut}>
            <rect x={900 - 740 * weeks} y={640} width={740 * weeks} height={70} rx={35} fill={C.green} />
            <rect x={900 - 46 * mins} y={850} width={46 * mins} height={70} rx={35} fill={C.blue} opacity={mins} />
            {reset > 0 && <g opacity={reset}><Reset x={540} y={1110} s={mix(0.6, 1, reset)} /><Cross x={540} y={1110} size={110} p={prog(f, b.brain - sec(0.05), sec(0.4))} /></g>}
          </g>
        )}
        {/* the notebook, in the space the phone left */}
        {book > 0 && <g opacity={book}><Notebook x={540} y={1010} s={mix(0.8, 1, book)} lines={write} /><Pencil x={mix(760, 330, write)} y={mix(900, 1080, write)} rot={30} s={0.8} /></g>}
        {/* the two paths: for a reason, or out of habit */}
        {paths > 0 && purpose > 0 && (
          <g opacity={paths}>
            <path d="M 515 860 C 470 760, 360 690, 262 650" fill="none" stroke={C.green} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - purpose} />
            {purpose > 0.9 && <Check x={240} y={635} s={1.5} />}
          </g>
        )}
        {paths > 0 && loop > 0 && (
          <g opacity={paths}>
            <path d={svgPath(HABIT)} fill="none" stroke={C.red} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - loop} />
            {loop >= 1 && <circle cx={hx} cy={hy} r={22} fill={C.red} stroke={C.white} strokeWidth={6} />}
          </g>
        )}
        {ring > 0 && <TimerRing x={540} y={1060} r={350} p={ring} track={ring} />}
        {phIn > 0 && <Phone x={ph.x} y={ph.y} s={ph.s} o={phIn * mix(1, 0.55, away * (1 - back))} />}
      </>
    }>
      {barsOut < 1 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - barsOut }}>
          <Headline text={T.sc05.weeks} f={f} at={b.this - sec(0.1)} x={720} y={548} w={360} size={64} color={C.green} />
          <Headline text={T.sc05.minutes} f={f} at={b.two - sec(0.1)} x={720} y={758} w={360} size={64} color={C.blue} />
        </div>
      )}
      <Title text={T.sc05.title} f={f} at={b.this - sec(0.1)} until={b.after - sec(0.3)} />
      <Title text={T.sc06.title} f={f} at={b.after} />
      {paths > 0 && <div style={{ position: 'absolute', inset: 0, opacity: paths }}>
        <Headline text={T.sc06.reason} f={f} at={b.reason} x={240} y={690} w={300} size={60} color={C.green} />
        <Headline text={T.sc06.habit} f={f} at={b.mere + sec(0.2)} x={790} y={440} w={300} size={60} color={C.red} />
      </div>}
      <Headline text={T.sc06.brand} f={f} at={end - sec(1.6)} x={540} y={1440} w={600} size={48} color={C.inkSoft} weight={800} />
    </Stage>
  );
};
