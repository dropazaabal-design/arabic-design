import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Arrow, Bubble, C, Cross, INK, Label, Move, Pop, Seq, Show, Sway, T, Tick, W } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import { after, cue, start, until } from '../film/cue';
import { ChapterCard, PhaseCard, PhaseStrip, Title } from './common';

// Phase one: «قبل ما تتحرك» — the intro and chapters 1–3 (chunks c00–c05).

const SunTzu: React.FC<{ x: number; y: number; s?: number; pose?: string; expr?: any }> = ({ x, y, s = 0.8, pose = 'present', expr = 'smug' }) =>
  <Person x={x} y={y} s={s} head="topknot" outfit="robe" top={C.teal} pose={pose} expr={expr} seed={9} />;

/** Five measures: icons at the top, the current one lit. */
const FIVE: Array<[string, React.ReactNode]> = [
  ['ثقة', <P.Heart r={0.45} />], ['توقيت', <P.Clock r={46} />], ['أرض', <g transform="translate(0 50) scale(0.3)"><P.Mountain /></g>],
  ['قائد', <g transform="scale(0.5)"><P.Crown /></g>], ['نظام', <g transform="scale(0.32)"><P.Checklist items={['', '']} /></g>],
];
const FiveStrip: React.FC<{ n: number }> = ({ n }) => <g>{FIVE.map(([l, icon], i) => {
  const x = 1440 - i * 240, on = i === n;
  return <g key={l} transform={`translate(${x} 200)`} opacity={on ? 1 : 0.35}>
    <circle r={58} fill={on ? C.yellow : '#fff'} stroke={INK} strokeWidth={W} />
    <g transform="scale(0.85)">{icon}</g>
    <T y={92} size={36}>{l}</T>
  </g>;
})}</g>;

export const C00: React.FC = () => {
  const id = 'c00';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Title text="فن الحرب" />
      <Pop at={cue(id, 'كتاب')} x={760} y={930} s={1.1}><P.Book /></Pop>
      <Show from={cue(id, 'لسون تزو')}><SunTzu x={340} y={1000} /></Show>
      <Label x={340} y={330} text="سون تزو" at={cue(id, 'لسون تزو')} />
      <Label x={760} y={420} text="+2000 سنة" size={80} at={cue(id, 'ألفين')} r={-4} />
      <Narrator x={1500} y={1010} pose={[[0, 'wave'], [cue(id, 'كتاب'), 'point']]} face={-1} expr="happy" />
    </g>],
    [cue(id, 'يدرسونه'), <g>
      <Title text="مين يقرأه اليوم؟" />
      {([['مؤسسو', 1420, 'مؤسسون', 'suit', C.navy, 'hair'], ['وقادة', 960, 'قادة', 'suit', C.greyDark, 'bald'], ['ورياضيو', 500, 'رياضيون', 'shirt', C.red, 'curly']] as const).map(([w, x, l, o, top, head], i) =>
        <g key={w}>
          <Pop at={cue(id, w)} x={x} y={0}><Person x={0} y={1000} s={0.85} outfit={o} top={top} head={head} pose="hold" expr="happy" seed={i}
            hand={<g transform="translate(-55 10) scale(0.32)"><P.Book /></g>} /></Pop>
          <Label x={x} y={330} text={l} at={cue(id, w, 1, 0.15)} />
        </g>)}
      <Pop at={cue(id, 'ورياضيو', 1, 0.4)} x={500} y={640} s={0.7}><circle r={40} fill={C.gold} stroke={INK} strokeWidth={W} /><path d="M-30 -40 L-10 -110 M30 -40 L10 -110" stroke={C.red} strokeWidth={14} /></Pop>
    </g>],
    [cue(id, 'اليوم بنشوف'), <g>
      <Title text="وش اللي يفرّق اللي يكسبون؟" />
      <Pop at={cue(id, 'اليوم بنشوف')} x={760} y={1000}><rect x={-130} y={-180} width={260} height={180} fill={C.gold} stroke={INK} strokeWidth={W} /><T y={-90} size={90}>1</T></Pop>
      <Pop at={cue(id, 'اليوم بنشوف', 1, 0.2)} x={470} y={1000}><rect x={-120} y={-100} width={240} height={100} fill={C.stone} stroke={INK} strokeWidth={W} /><T y={-50} size={60}>2</T></Pop>
      <Show from={cue(id, 'يفرّق')}><Person x={760} y={820} s={0.65} head="hair" top={C.green} pose="cheer" expr="happy" hand={<g transform="translate(0 -20) scale(0.4)"><P.Trophy /></g>} /></Show>
      <Show from={cue(id, 'يفرّق')}><Person x={470} y={900} s={0.6} head="curly" top={C.blue} pose="shrug" expr="worried" seed={2} /></Show>
      <Pop at={cue(id, 'يكسبون')} x={1150} y={420}><P.Question size={240} /></Pop>
      <Narrator x={1560} y={1010} pose="think" expr="think" face={-1} />
    </g>],
    [cue(id, 'صحيح الكتاب'), <g>
      <Title text="مو بس للحروب" />
      <Person x={260} y={1000} s={0.8} head="greek" outfit="armour" top={C.red} pose="hips" expr="angry" />
      <Label x={260} y={320} text="قادة الحروب" size={56} />
      <Arrow at={cue(id, 'بس دروسه')} x1={420} y1={560} x2={600} y2={560} />
      {([['زواجك', 1560, 470, 'زواجك', <P.Ring />], ['وصديقك', 1180, 470, 'صديقك', <g><Mini x={-50} y={90} c={C.green} /><Mini x={50} y={90} c={C.orange} hc={C.brown} /></g>],
        ['أخوك', 800, 470, 'أخوك', <g><Mini x={-55} y={90} c={C.blue} /><Mini x={55} y={90} c={C.red} /><path d="M-10 -70 L10 -40 L-6 -30 L12 0" stroke={C.red} strokeWidth={8} fill="none" /></g>],
        ['ومديرك', 1370, 840, 'مديرك', <g><g transform="translate(0 100) scale(0.6)"><P.Table /></g><Mini x={0} y={40} c={C.navy} hc={C.grey} /><g transform="translate(90 -70)"><P.Clock r={36} spin={4} /></g></g>],
        ['خوفك', 990, 840, 'خوفك', <g><g opacity={0.85}><Mini x={30} y={110} s={2.2} c={C.black} hc={C.black} /></g><Mini x={-40} y={110} c={C.sky} sad /></g>]] as const).map(([w, x, y, l, node]) =>
        <g key={w}>
          <Pop at={cue(id, w)} x={x} y={y}><circle r={130} fill={C.paper} stroke={INK} strokeWidth={W} />{node}</Pop>
          <Label x={x} y={y + 170} text={l} size={50} at={cue(id, w, 1, 0.1)} />
        </g>)}
      <Show from={cue(id, 'الاجتماع')}><Narrator x={1780} y={1060} s={0.7} pose="facepalm" expr="sad" face={-1} /></Show>
    </g>],
    [cue(id, 'الكتاب ثلاطعش'), <g>
      <Title text="13 فصل … 3 مراحل" />
      {Array.from({ length: 13 }, (_, i) => <Pop key={i} at={cue(id, 'الكتاب ثلاطعش') + i * 3} x={1680 - i * 118} y={520} s={0.32}><P.Book title={`${i + 1}`} c={[C.red, C.blue, C.green][Math.floor(i / 4.4)]} /></Pop>)}
      <Seq end={until(id)} beats={[
        [cue(id, 'ثلاث مراحل'), <PhaseStrip n={0} at={cue(id, 'ثلاث مراحل')} />],
        [cue(id, 'وكيف تتحرك'), <PhaseStrip n={1} at={cue(id, 'ثلاث مراحل')} />],
        [cue(id, 'وكيف ترى'), <PhaseStrip n={2} at={cue(id, 'ثلاث مراحل')} />],
      ]} />
    </g>],
  ]} />;
};

export const C01: React.FC = () => {
  const id = 'c01';
  const f = useCurrentFrame();
  return <Seq end={until(id)} beats={[
    [start(id), <PhaseCard n={0} name="المرحلة الأولى" q="قبل ما تتحرك" at={start(id)} />],
    [cue(id, 'أغلب الناس'), <g>
      <Title text="أغلب الناس" />
      {Array.from({ length: 6 }, (_, i) => <Move key={i} a={cue(id, 'أغلب الناس') + i * 4} b={cue(id, 'ويفكرون')} x1={1900 + i * 120} y1={980 - (i % 2) * 40} x2={760 + i * 120} y2={980 - (i % 2) * 40}>
        <g transform={`rotate(${Math.sin(f / 3 + i) * 6})`}><Mini x={0} y={0} s={1.3} c={[C.blue, C.red, C.green, C.orange, C.purple, C.teal][i]} /></g>
      </Move>)}
      <Pop at={cue(id, 'ويفكرون')} x={1100} y={560}><P.Question size={200} /></Pop>
      <Pop at={cue(id, 'سون تزو')} x={350} y={1000}><SunTzu x={0} y={0} s={0.8} pose="hold" expr="smug" /></Pop>
      <Pop at={cue(id, 'سون تزو', 1, 0.2)} x={600} y={900} s={0.5}><P.Scroll /></Pop>
      <Label x={350} y={320} text="العكس" size={80} at={cue(id, 'العكس')} />
    </g>],
    [cue(id, 'الفصل الأول'), <ChapterCard num={1} name="جهّز قبل ما تبدأ" at={cue(id, 'الفصل الأول')} />],
    [cue(id, 'اثنين فتحوا'), <g>
      <Title text="نفس المشروع" />
      <Pop at={cue(id, 'اثنين فتحوا')} x={1300} y={1000}><P.Shop c={C.blue} /></Pop>
      <Pop at={cue(id, 'اثنين فتحوا', 1, 0.15)} x={560} y={1000}><P.Shop c={C.blue} /></Pop>
      <Person x={1640} y={1010} s={0.6} head="hair" top={C.green} face={-1} seed={1} />
      <Person x={240} y={1010} s={0.6} head="curly" top={C.orange} seed={2} />
      <Label x={960} y={220} text="نفس الشارع" at={cue(id, 'بنفس الشارع')} />
      <Pop at={cue(id, 'ونفس الميزانية')} x={1300} y={500}><P.Coins n={4} /></Pop>
      <Pop at={cue(id, 'ونفس الميزانية', 1, 0.1)} x={560} y={500}><P.Coins n={4} /></Pop>
    </g>],
    [cue(id, 'الأول قعد'), <g>
      <Title text="الأول: يخطّط" />
      <Person x={1640} y={1010} s={0.75} head="hair" top={C.green} face={-1} pose="think" expr="think" seed={1} />
      <Pop at={cue(id, 'الأول قعد')} x={1330} y={1000}><P.Desk /></Pop>
      <Pop at={cue(id, 'شهر')} x={1650} y={360} s={0.8}><P.Calendar top="شهر" big="30" /></Pop>
      <Pop at={cue(id, 'يكتب')} x={1000} y={560}><P.Checklist w={420} items={['التكاليف', 'المخاطر', 'المنافسين']} at={[cue(id, 'التكاليف'), cue(id, 'والمخاطر'), cue(id, 'والمنافسين')]}
        checks={[cue(id, 'والمخاطر'), cue(id, 'والمنافسين'), cue(id, 'والمنافسين', 1, 0.6)]} /></Pop>
      <Person x={260} y={1010} s={0.6} head="curly" top={C.orange} expr="neutral" seed={2} />
    </g>],
    [cue(id, 'الثاني قال'), <g>
      <Title text="الثاني: يالله توكلنا" />
      <Person x={420} y={1010} s={0.85} head="curly" top={C.orange} pose="cheer" expr="happy" seed={2} />
      <Pop at={cue(id, 'يالله')} x={760} y={330}><Bubble w={420} h={130} tail={[-150, 110]}><T size={54}>يالله توكلنا!</T></Bubble></Pop>
      <Pop at={cue(id, 'كبسة')} x={1250} y={560}><Bubble w={600} h={420} think tail={[-330, 280]}><g transform="translate(-40 40) scale(1.2)"><P.Kabsa /></g><g transform="translate(200 -110)"><P.Clock r={50} spin={6} /></g></Bubble></Pop>
      <Label x={1450} y={870} text="بعد ساعة؟" size={60} at={cue(id, 'بعد ساعة')} />
      <Person x={1720} y={1010} s={0.55} head="hair" top={C.green} face={-1} pose="facepalm" expr="sad" seed={1} />
    </g>],
    [cue(id, 'بعد سنة'), <g>
      <Title text="بعد سنة" />
      <g transform="translate(1300 1000)"><P.Shop c={C.blue} open /></g>
      <g transform="translate(560 1000)"><P.Shop c={C.blue} closed /></g>
      {[0, 1, 2].map((i) => <Pop key={i} at={cue(id, 'واحد بس') + i * 5} x={1160 + i * 110} y={1010}><Mini x={0} y={0} s={1.1} c={[C.pink, C.teal, C.purple][i]} head={i === 1 ? 'hijab' : 'hair'} hc={C.navy} /></Pop>)}
      <Person x={250} y={1010} s={0.6} head="curly" top={C.orange} expr="sad" seed={2} />
      <Show from={cue(id, 'وأظنك')}><Pop at={cue(id, 'وأظنك')} x={960} y={1060} s={0.6}><Narrator x={0} y={0} pose="point" expr="smug" face={-1} /></Pop></Show>
    </g>],
  ]} />;
};

export const C02: React.FC = () => {
  const id = 'c02';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Title text="خمس أشياء تقيسها" />
      <SunTzu x={1620} y={1010} s={0.85} pose="present" />
      {FIVE.map(([l, icon], i) => <g key={l}>
        <Pop at={cue(id, 'خمس') + i * 8} x={1260 - i * 230} y={560} s={1.5}><circle r={70} fill="#fff" stroke={INK} strokeWidth={W} />{icon}</Pop>
        <Label x={1260 - i * 230} y={740} text={l} size={56} at={cue(id, 'خمس') + i * 8 + 4} />
      </g>)}
    </g>],
    [cue(id, 'أولها ثقة'), <g>
      <FiveStrip n={0} />
      <Pop at={cue(id, 'شاكلتون')} x={760} y={980}><g transform="translate(0 0)"><P.Ice w={1.3} /></g><g transform="translate(0 -20)"><P.Ship tilt={-14} sail={false} /></g></Pop>
      <Label x={760} y={440} text="1915" size={90} at={cue(id, 'سنة ألف')} />
      <Label x={760} y={560} text="انسحقت!" size={60} tone="red" at={cue(id, 'انسحقت')} r={-6} />
      <Person x={1520} y={1010} s={0.8} head="cap" hairColor={C.greyDark} top={C.brown} pose="hips" expr="neutral" />
      <Label x={1520} y={400} text="شاكلتون" size={56} at={cue(id, 'شاكلتون', 1, 0.2)} />
    </g>],
    [cue(id, 'ومع ذلك'), <g>
      <FiveStrip n={0} />
      {Array.from({ length: 28 }, (_, i) => <Pop key={i} at={cue(id, 'رجّع') + i * 2} x={1650 - (i % 14) * 105} y={640 + Math.floor(i / 14) * 230} s={1}><Mini x={0} y={0} s={1.1} c={C.brown} hc={C.black} /></Pop>)}
      <Label x={960} y={980} text="28 من 28" size={90} at={cue(id, 'كلهم')} />
      <Tick at={cue(id, 'كلهم', 1, 0.3)} x={1300} y={980} s={1.4} />
    </g>],
    [cue(id, 'والثاني التوقيت'), <g>
      <FiveStrip n={1} />
      <Person x={1560} y={1010} s={0.85} head="general" outfit="suit" top={C.greenDark} pose={[[0, 'think'], [cue(id, 'أجّل'), 'point']]} face={-1} expr="think" />
      <Label x={1560} y={400} text="أيزنهاور" size={56} at={cue(id, 'أيزنهاور')} />
      <Seq end={until(id)} beats={[
        [cue(id, 'أيزنهاور'), <g><g transform="translate(800 640)"><P.Calendar top="يونيو" big="5" /></g><g transform="translate(800 400)"><P.Cloud storm w={1.1} /></g></g>],
        [cue(id, 'أجّل'), <g><Pop at={cue(id, 'أجّل')} x={800} y={640}><P.Calendar top="يونيو" big="6" c={C.green} /></Pop><Pop at={cue(id, 'أجّل', 1, 0.3)} x={800} y={390}><P.Sun /></Pop>
          <Label x={800} y={860} text="+24 ساعة" size={70} at={cue(id, 'يوم كامل')} /></g>],
      ]} />
      <Label x={400} y={600} text="الطقس" size={64} at={cue(id, 'بسبب الطقس')} />
    </g>],
    [cue(id, 'والثالث الأرض'), <g>
      <FiveStrip n={2} />
      <g transform="translate(960 1000)"><P.Pass gap={150} /></g>
      {[0, 1, 2].map((i) => <Pop key={i} at={cue(id, 'قوة إغريقية') + i * 4} x={930 + i * 30} y={1000 - i * 6}><Mini x={0} y={0} s={1.05} head="greek" c={C.red} /></Pop>)}
      {Array.from({ length: 24 }, (_, i) => <Pop key={i} at={cue(id, 'جيش فارس') + i} x={1150 + (i % 8) * 85} y={850 + Math.floor(i / 8) * 70} s={0.75}><Mini x={0} y={0} head="persian" c={C.purple} /></Pop>)}
      <Label x={960} y={330} text="ممر ضيق" size={84} at={cue(id, 'ممر ضيق')} />
      <Label x={1450} y={700} text="جيش فارس" size={50} at={cue(id, 'جيش فارس', 1, 0.2)} />
    </g>],
    [cue(id, 'فلو كنت'), <g>
      <Title text="اختر أرضك" />
      {Array.from({ length: 9 }, (_, i) => <Mini key={i} x={1180 + (i % 5) * 120 + (Math.floor(i / 5) * 60)} y={720 + Math.floor(i / 5) * 160} s={1.2} c={[C.red, C.blue, C.orange, C.green, C.purple][i % 5]} head={i % 3 ? 'hair' : 'hijab'} hc={C.pink} />)}
      <Person x={1480} y={1030} s={0.55} head="hair" top={C.sky} pose="cross" expr="worried" />
      <Cross at={cue(id, 'لا تتحدى')} x={1450} y={760} s={3} />
      <Pop at={cue(id, 'خذ واحد')} x={560} y={1010}><P.Table w={300} /><g transform="translate(-70 -175) scale(0.6)"><P.Cup /></g><g transform="translate(70 -175) scale(0.6)"><P.Cup c={C.blue} /></g></Pop>
      <Show from={cue(id, 'خذ واحد')}><Person x={300} y={1010} s={0.6} head="hair" top={C.sky} pose="present" expr="happy" /><Person x={820} y={1010} s={0.6} head="curly" top={C.green} face={-1} pose="present" expr="happy" seed={4} /></Show>
      <Tick at={cue(id, 'قهوة')} x={560} y={480} s={2} />
    </g>],
    [cue(id, 'والرابع القائد'), <g>
      <FiveStrip n={3} />
      <Pop at={cue(id, 'والرابع القائد')} x={960} y={600}><P.Scale tip={0} left={<g transform="translate(0 -40) scale(0.45)"><P.Heart /></g>} right={<g transform="translate(0 -60) scale(0.35)"><P.RuleBook title="حزم" /></g>} /></Pop>
      <Label x={790} y={340} text="لين" size={64} at={cue(id, 'لين')} />
      <Label x={1130} y={340} text="حزم" size={64} at={cue(id, 'وحزم')} />
      <Narrator x={1640} y={1010} s={0.9} pose="both" expr="happy" face={-1} />
    </g>],
    [cue(id, 'والخامس النظام'), <g>
      <FiveStrip n={4} />
      <g transform="translate(1350 1000) scale(0.8)"><P.Sofa /></g>
      <Person x={1350} y={940} s={0.6} head="hair" top={C.orange} pose="shrug" expr="smug" />
      <Label x={1350} y={430} text="على مزاجه" size={56} at={cue(id, 'مزاجه')} />
      {Array.from({ length: 10 }, (_, i) => <g key={i} transform={`translate(${1620 - i * 62} 1050)`}><rect x={-26} y={-26} width={52} height={52} rx={6} fill="#fff" stroke={INK} strokeWidth={4} /></g>)}
      <Tick at={cue(id, 'يروح يوم')} x={1620} y={1050} s={0.7} />
      {Array.from({ length: 9 }, (_, i) => <Cross key={i} at={cue(id, 'ويغيب') + i * 2} x={1558 - i * 62} y={1050} s={0.6} />)}
      <Pop at={cue(id, 'والخامس النظام', 1, 0.4)} x={500} y={1000}><P.Door c={C.wood} /></Pop>
      <Pop at={cue(id, 'والخامس النظام', 1, 0.6)} x={500} y={1000} s={0.8}><P.GymBag /></Pop>
      <Pop at={cue(id, 'والخامس النظام', 1, 0.8)} x={500} y={600}><P.Clock r={60} h={6} m={0} /></Pop>
      <Label x={500} y={440} text="نظام" size={64} at={cue(id, 'والخامس النظام', 1, 0.8)} />
    </g>],
  ]} />;
};

export const C03: React.FC = () => {
  const id = 'c03';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Title text="كل حرب خديعة" />
      <g transform="translate(450 1000) scale(0.75)"><P.CityGate /></g>
      <Label x={450} y={560} text="طروادة" size={56} />
      <Move a={cue(id, 'بالانسحاب')} b={cue(id, 'وخلّوا')} x1={1450} y1={1000} x2={2300} y2={1000}><g transform="scale(0.6)"><P.Ship /></g></Move>
      <Move a={cue(id, 'بالانسحاب', 1, 0.3)} b={cue(id, 'وخلّوا', 1, 0.3)} x1={1700} y1={1020} x2={2500} y2={1020}><g transform="scale(0.5)"><P.Ship c={C.woodDark} /></g></Move>
      <Pop at={cue(id, 'حصان خشبي')} x={1050} y={1000} s={0.8}><P.WoodHorse /></Pop>
    </g>],
    [cue(id, 'والباقي تعرفه'), <g>
      <Title text="والباقي تعرفه" />
      <g transform="translate(800 1000) scale(0.9)"><P.WoodHorse /></g>
      {[0, 1, 2].map((i) => <Move key={i} a={cue(id, 'والباقي') + i * 6} b={cue(id, 'تعرفه') + i * 6} x1={790 + i * 40} y1={700} x2={790 + i * 40} y2={620}><Mini x={0} y={0} s={1.05} head="greek" c={C.red} /></Move>)}
      <Narrator x={1560} y={1010} pose="point" expr="smug" face={-1} />
    </g>],
    [cue(id, 'وأهم قاعدة'), <g>
      <Title text="اعرف نفسك … واعرف خصمك" />
      <T x={1450} y={210} size={44} color={C.greyDark}>نفسك</T><T x={1150} y={210} size={44} color={C.greyDark}>خصمك</T><T x={700} y={210} size={44} color={C.greyDark}>النتيجة</T>
      {([['اعرف نفسك', 340, true, true, <g transform="scale(0.55) translate(0 120)"><P.Trophy /></g>, 'تكسب'], ['تعرف نفسك بس', 580, true, false, <T size={70}>50/50</T>, 'نص نص'], ['تجهل الاثنين', 820, false, false, <g transform="scale(0.6)"><P.Heart broken c={C.grey} /></g>, 'تخسر']] as const).map(([w, y, a, b, res, l]) =>
        <g key={w}>
          <Pop at={cue(id, w)} x={1450} y={y} s={0.55}><P.Mirror /></Pop>
          <Pop at={cue(id, w, 1, 0.15)} x={1150} y={y} s={0.6}><P.Spyglass /></Pop>
          {a ? <Tick at={cue(id, w, 1, 0.3)} x={1520} y={y + 60} /> : <Cross at={cue(id, w, 1, 0.3)} x={1520} y={y + 60} />}
          {b ? <Tick at={cue(id, w, 1, 0.45)} x={1230} y={y + 60} /> : <Cross at={cue(id, w, 1, 0.45)} x={1230} y={y + 60} />}
          <Arrow at={cue(id, w, 1, 0.6)} x1={1000} y1={y} x2={860} y2={y} />
          <Pop at={cue(id, w, 1, 0.8)} x={700} y={y}>{res}</Pop>
          <Label x={420} y={y} text={l} size={60} tone={l === 'تخسر' ? 'red' : 'yellow'} at={cue(id, w, 1, 0.9)} />
        </g>)}
    </g>],
  ]} />;
};

export const C04: React.FC = () => {
  const id = 'c04';
  return <Seq end={until(id)} beats={[
    [start(id), <ChapterCard num={2} name="أنهِها قبل ما تنهكك" at={start(id)} />],
    [cue(id, 'الصراع الطويل'), <g>
      <Title text="الصراع الطويل عدّاد شغّال" />
      <Pop at={cue(id, 'الصراع الطويل')} x={860} y={520} s={1.3}><P.Meter a={cue(id, 'الصراع الطويل')} b={cue(id, 'أثينا')} to={9870} /></Pop>
      {Array.from({ length: 6 }, (_, i) => <Move key={i} a={cue(id, 'عدّاد') + i * 12} b={cue(id, 'عدّاد') + i * 12 + 40} x1={700 + i * 60} y1={680} x2={700 + i * 60} y2={1000}><P.Coins n={1} /></Move>)}
      <Narrator x={1620} y={1010} pose="point" expr="worried" face={-1} />
    </g>],
    [cue(id, 'أثينا'), <g>
      <Title text="أثينا ضد إسبرطة" />
      <g transform="translate(1400 1000)"><P.Temple crack={cue(id, 'انتهت')} /></g>
      <Label x={1400} y={500} text="أثينا الغنية" size={56} />
      <Person x={500} y={1010} s={0.85} head="greek" outfit="armour" top={C.red} pose="stop" expr="angry" />
      <Label x={500} y={320} text="إسبرطة" size={56} />
      <Pop at={cue(id, 'ثلاثين')} x={960} y={420} s={0.7}><P.Meter a={cue(id, 'ثلاثين')} b={cue(id, 'ثلاثين') + 60} to={30} unit=" سنة" c={C.brown} /></Pop>
      <Label x={1400} y={800} text="رفضت توقف" size={56} tone="red" at={cue(id, 'رفضت')} r={-5} />
    </g>],
    [cue(id, 'وأخوين'), <g>
      <Title text="بيت أبوهم" />
      <Pop at={cue(id, 'وأخوين')} x={700} y={1000} s={0.85}><P.House /></Pop>
      <Person x={330} y={1010} s={0.7} head="hair" top={C.blue} pose="point" expr="angry" />
      <Person x={1070} y={1010} s={0.7} head="curly" top={C.red} pose="point" face={-1} expr="angry" seed={3} />
      <Pop at={cue(id, 'المحامين')} x={1560} y={1010} s={0.7}><Person x={0} y={0} head="bald" outfit="suit" top={C.black} pose="hold" expr="smug" hand={<g transform="translate(-55 60) scale(0.7)"><P.Briefcase /></g>} /></Pop>
      <Pop at={cue(id, 'أكثر من قيمة')} x={1500} y={480} s={0.75}><P.Bars a={cue(id, 'أكثر من قيمة')} b={cue(id, 'قيمة البيت')} h1={200} h2={330} l1="البيت" l2="المحامين" /></Pop>
    </g>],
    [cue(id, 'وقاعدة ثانية'), <g>
      <Label x={960} y={150} text="لا تطلع فاضي" size={80} at={cue(id, 'لا تطلع')} />
      <Person x={1420} y={1010} s={0.85} head="hair" top={C.sky} pose={[[0, 'idle'], [cue(id, 'ويسأله'), 'present']]} face={-1} expr={[[0, 'sad'], [cue(id, 'ويسأله'), 'neutral']]} />
      <Label x={1420} y={340} text="خسر الترقية" size={50} at={cue(id, 'خسر الترقية')} tone="red" />
      <Pop at={cue(id, 'لزميله')} x={500} y={1010}><Person x={0} y={0} s={0.85} head="hair" hairColor={C.brown} outfit="suit" top={C.navy} expr="happy" seed={5} /></Pop>
      <Pop at={cue(id, 'ويسأله')} x={1000} y={380}><Bubble w={460} h={130} tail={[170, 110]}><T size={52}>وش سوّيت غيري؟</T></Bubble></Pop>
      <Pop at={cue(id, 'ويسمع')} x={1000} y={720} s={0.9}><P.Ear /></Pop>
      <Pop at={cue(id, 'ويسمع', 1, 0.3)} x={1180} y={740} s={0.7}><P.Notebook /></Pop>
    </g>],
    [cue(id, 'واللي كسب'), <g>
      <Title text="كسب النقاش … وخسر البقية" />
      <Person x={1350} y={1010} s={0.85} head="hair" top={C.green} pose="cheer" face={-1}
        expr={[[0, 'happy'], [cue(id, 'وخسر'), 'worried']]} hand={<g transform="translate(0 -10) scale(0.35)"><Seq end={until(id)} beats={[[0, <P.Trophy />], [cue(id, 'فوز كلّفك'), <P.Trophy cracked />]]} /></g>} />
      <Label x={1350} y={220} text="كسبت!" size={64} at={cue(id, 'كسب نقاش')} />
      <Person x={560} y={1010} s={0.8} head="hijab" hairColor={C.purple} outfit="dress" top={C.purple} face={-1} pose="cross" expr="sad" seed={6} />
      <Pop at={cue(id, 'وخسر')} x={960} y={560}><P.Heart broken /></Pop>
      <Pop at={cue(id, 'لنص يوم')} x={960} y={300} s={0.8}><P.Clock r={70} spin={10} /></Pop>
      <Label x={960} y={430} text="نص يوم" size={56} at={cue(id, 'لنص يوم', 1, 0.2)} />
    </g>],
  ]} />;
};

export const C05: React.FC = () => {
  const id = 'c05';
  return <Seq end={until(id)} beats={[
    [start(id), <ChapterCard num={3} name="اكسب بدون قتال" at={start(id)} />],
    [cue(id, 'جنكيز خان'), <g>
      <Title text="جنكيز خان" />
      <g transform="translate(500 1000) scale(0.8)"><P.CityGate flag={cue(id, 'تستسلم')} /></g>
      <Move a={cue(id, 'جنكيز خان')} b={until(id)} x1={1950} y1={1000} x2={1350} y2={1000} e={(t) => t}><g transform="scale(-0.7 0.7)"><P.Horse gallop><Mini x={0} y={0} s={1.4} head="mongol" c={C.brown} /></P.Horse></g></Move>
      <Label x={960} y={260} text="سمعة" size={80} at={cue(id, 'سمعة')} />
      <Label x={500} y={400} text="استسلام قبل الوصول" size={50} at={cue(id, 'قبل يوصل')} />
    </g>],
    [cue(id, 'والأب'), <g>
      <Title text="أب ينفّذ كل مرة" />
      <Person x={1400} y={1010} s={0.9} head="hair" hairColor={C.greyDark} outfit="thobe" pose="cross" expr="smug" face={-1} />
      {[0, 1, 2].map((i) => <Pop key={i} at={cue(id, 'عياله') + i * 5} x={520 + i * 160} y={1010}><Mini x={0} y={0} s={1.3} c={[C.pink, C.sky, C.green][i]} head={i === 0 ? 'hijab' : 'hair'} hc={C.purple} /></Pop>)}
      {[0, 1, 2, 3].map((i) => <Tick key={i} at={cue(id, 'كل مرة') + i * 6} x={600 + i * 100} y={480} />)}
      <Label x={750} y={350} text="كل مرة" size={64} at={cue(id, 'كل مرة')} />
    </g>],
    [cue(id, 'وسون تزو يرتب'), <g>
      <Title text="ترتيب الخيارات: من الأرخص للأغلى" />
      {([['أفضلها', 'خرّب خطته', <P.Crumpled />, false], ['بعدها تمنع', 'امنع تحالفاته', <g transform="scale(0.6)"><P.ChainCut /></g>, false], ['بعدها المواجهة', 'المواجهة', <g transform="scale(0.55)"><P.Swords /></g>, false], ['وأسوأها', 'الحصار', <g transform="translate(0 70) scale(0.32)"><P.Castle /></g>, true]] as const).map(([w, l, icon, bad], i) =>
        <g key={w}>
          <Pop at={cue(id, w)} x={1480} y={290 + i * 190}><circle r={52} fill={bad ? C.red : C.yellow} stroke={INK} strokeWidth={W} /><T size={56} y={4}>{i + 1}</T></Pop>
          <Pop at={cue(id, w, 1, 0.1)} x={1260} y={290 + i * 190} s={0.9}>{icon}</Pop>
          <Pop at={cue(id, w, 1, 0.2)} x={850} y={290 + i * 190} from="right"><T size={60} color={bad ? C.red : INK}>{l}</T></Pop>
        </g>)}
      <Label x={450} y={860} text="الأسوأ" size={64} tone="red" at={cue(id, 'الحصار')} r={-6} />
    </g>],
    [cue(id, 'أوبر'), <g>
      <Title text="أوبر ضد ديدي في الصين" />
      <Move a={cue(id, 'أوبر')} b={cue(id, 'وجهًا')} x1={1800} y1={1000} x2={1180} y2={1000}><g transform="scale(-1 1)"><P.Car c={C.black} /></g></Move>
      <Show from={cue(id, 'ديدي')}><g transform="translate(720 1000)"><P.Car c={C.orange} /></g></Show>
      <Label x={1250} y={700} text="أوبر" size={56} at={cue(id, 'أوبر', 1, 0.2)} />
      <Label x={700} y={700} text="ديدي" size={56} at={cue(id, 'ديدي')} />
      {[0, 1, 2, 3].map((i) => <Move key={i} a={cue(id, 'مليارات') + i * 8} b={cue(id, 'مليارات') + i * 8 + 40} x1={1250} y1={900} x2={1300 + i * 130} y2={400 - (i % 2) * 60}><g transform="scale(0.6)"><P.MoneyBag /></g></Move>)}
      <Pop at={cue(id, 'باعت')} x={960} y={330}><P.Handshake /></Pop>
      <Pop at={cue(id, 'حصة صغيرة')} x={480} y={360} s={0.8}><P.Pie slice={0.18} label="حصة صغيرة" /></Pop>
    </g>],
    [cue(id, 'وإذا اختلفت'), <g>
      <Title text="مين يسمعون كلامه؟" />
      <Pop at={cue(id, 'عمّتك')} x={900} y={1010}><Person x={0} y={0} s={0.9} head="hijab" hairColor={C.navy} outfit="dress" top={C.navy} pose="hold" expr="smug" seed={7} /></Pop>
      <Label x={900} y={300} text="العمّة" size={70} at={cue(id, 'عمّتك', 1, 0.2)} />
      <Person x={1550} y={1010} s={0.75} head="hair" top={C.blue} pose="think" face={-1} expr="neutral" hand={<g transform="translate(-10 0) scale(0.22)"><P.Phone /></g>} />
      {[0, 1, 2].map((i) => <Mini key={i} x={300 + i * 120} y={1010} s={1.25} c={[C.red, C.green, C.orange][i]} head={i === 1 ? 'hijab' : 'hair'} hc={C.brown} />)}
      {[0, 1, 2].map((i) => <Arrow key={i} at={cue(id, 'الكل يسمع') + i * 5} x1={300 + i * 120} y1={760} x2={800} y2={560} bow={-0.15} w={6} />)}
      <Label x={1550} y={330} text="قبل لا يتكلم أحد" size={46} at={cue(id, 'قبل لا يتكلم')} />
    </g>],
    [cue(id, 'وإذا الأرقام'), <g>
      <Title text="خلّ الحساب يقرر" />
      <Pop at={cue(id, 'وإذا الأرقام')} x={1250} y={560}><P.Scale tip={1} left={<Mini x={0} y={30} s={0.7} c={C.sky} />} right={<Mini x={0} y={40} s={1.3} c={C.black} />} /></Pop>
      <Pop at={cue(id, 'كبرياءك')} x={600} y={420}><P.Crown /></Pop>
      <Cross at={cue(id, 'كبرياءك', 1, 0.2)} x={600} y={430} s={2.2} />
      <Move a={cue(id, 'انسحب')} b={until(id)} x1={700} y1={1010} x2={200} y2={1010}><Person x={0} y={0} s={0.6} head="hair" top={C.sky} pose="idle" face={-1} expr="smug" /></Move>
      <Label x={600} y={720} text="انسحب" size={80} at={cue(id, 'انسحب')} />
    </g>],
  ]} />;
};
