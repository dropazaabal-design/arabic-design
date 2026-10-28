import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, INK, Label, Pop, Seq, Show, T, W } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { TITLE } from '../fonts';
import { FLOOR, Header, LawCard, Row } from './common';

// The hook, the series, the note, and law 1 (chunks k00–k04).

const Grid48: React.FC<{ at: number; lit: number }> = ({ at, lit }) => {
  const f = useCurrentFrame();
  return <g>{Array.from({ length: 48 }, (_, i) => {
    if (f < at + i) return null;
    const on = i < 3 && f >= lit;
    return <rect key={i} x={980 - (i % 12) * 80 - 32} y={890 + Math.floor(i / 12) * 80 - 32} width={64} height={64} rx={12}
      fill={on ? C.accent : i < 3 ? C.cream : C.shade} stroke={INK} strokeWidth={on ? 6 : 3} />;
  })}</g>;
};

export const K00: React.FC = () => {
  const id = 'k00';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Pop at={start(id)} x={540} y={400}><text textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={900} fontSize={130} fill={C.red} stroke={INK} strokeWidth={10} paintOrder="stroke">قد تخسر…</text></Pop>
      {([['إظهار', 820, 'إظهار قوتك', <g><g transform="translate(0 80) scale(0.32)"><Q.Spotlight h={300} w={160} /></g><g transform="translate(0 -10) scale(0.5)"><P.Crown /></g></g>],
        ['ثقتك', 540, 'ثقة غير مدروسة', <g transform="scale(0.42)"><P.Handshake /><path d="M-10 -80 L10 -30 L-8 0 L12 40" stroke={C.red} strokeWidth={14} fill="none" /></g>],
        ['كلامك', 260, 'خطط قبل أوانها', <g transform="scale(0.55)"><Q.Megaphone /></g>]] as const).map(([w, x, l, icon]) => <g key={w}>
        <Pop at={cue(id, w)} x={x} y={720}><circle r={120} fill={C.paper} stroke={INK} strokeWidth={W} />{icon}</Pop>
        <Label x={x} y={890} text={l} size={44} at={cue(id, w, 1, 0.15)} />
      </g>)}
      <Narrator x={540} y={FLOOR + 40} s={0.69} pose={[[0, 'shrug'], [cue(id, 'كلامك'), 'facepalm']]} expr="worried" />
    </g>],
    [cue(id, 'في هذه السلسلة'), <g>
      <Pop at={cue(id, 'القوانين')} x={540} y={330}><T size={50}>«القوانين الثمانية والأربعون للقوة»</T></Pop>
      <Label x={540} y={420} text="روبرت غرين" size={52} at={cue(id, 'لروبرت')} />
      <Pop at={cue(id, 'في هذه السلسلة')} x={540} y={810} s={0.8}><P.Book title="القوة" c={C.navy} /></Pop>
      <Grid48 at={cue(id, 'الثمانية')} lit={cue(id, 'ثلاثة قوانين')} />
      <Label x={540} y={1270} text="3 قوانين في كل جزء" size={56} at={cue(id, 'ثلاثة قوانين')} />
    </g>],
  ]} />;
};

export const K01: React.FC = () => {
  const id = 'k01';
  return <g>
    <Show from={start(id)} to={until(id)}><Header title="تنبيه قبل البداية" /></Show>
    <Pop at={cue(id, 'وتنبيه')} out={until(id) - 10} x={540} y={470} s={0.9}><Q.Warning /></Pop>
    <Show from={start(id)} to={until(id)}>
      <Row at={cue(id, 'تتعارض')} y={760} tone={C.cream} icon={<g transform="translate(0 150) scale(0.9)"><P.Book title="" /></g>} text="بعضها يتعارض مع الإسلام والأخلاق" />
      <Row at={cue(id, 'للتعلّم')} y={960} icon={<P.Magnifier />} text="نعرضها للتعلّم والفهم" mark="tick" markAt={cue(id, 'وفهم')} />
      <Row at={cue(id, 'وعرضها')} y={1160} icon={<g transform="scale(1.1)"><P.Eye /></g>} text="العرض لا يعني الموافقة" mark="tick" markAt={cue(id, 'الموافقة')} />
    </Show>
  </g>;
};

const Boss: React.FC<{ x: number; expr: any; pose?: any }> = ({ x, expr, pose = 'cross' }) =>
  <Person x={x} y={FLOOR} s={0.85} head="bald" outfit="suit" top={C.navy} pose={pose} expr={expr} seed={2} />;

export const K02: React.FC = () => {
  const id = 'k02';
  const law = <Header chip="القانون 1" title="لا تتفوق على سيدك" />;
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={1} lines={['لا تتفوق على سيدك']} at={start(id)} />],
    [cue(id, 'يرى غرين'), <g>
      {law}
      {[0, 1, 2, 3, 4].map((i) => <Pop key={i} at={cue(id, 'أمام الآخرين') + i * 3} x={900 - i * 180} y={640}><Mini x={0} y={0} s={0.9} c={[C.teal, C.pink, C.orange, C.green, C.purple][i]} head={i % 2 ? 'hijab' : 'hair'} hc={C.navy} /></Pop>)}
      <Show from={cue(id, 'يتفوق')}><g transform={`translate(290 ${FLOOR})`}><Q.Spotlight h={560} w={190} /></g></Show>
      <Boss x={790} expr={[[0, 'neutral'], [cue(id, 'بالتهديد'), 'angry']]} />
      <Person x={290} y={FLOOR} s={0.85} head="hair" top={C.sky} pose={[[0, 'idle'], [cue(id, 'يتفوق'), 'cheer']]} expr="happy" seed={4} />
      <Label x={790} y={700} text="تهديد!" size={56} tone="red" at={cue(id, 'بالتهديد')} r={-6} />
    </g>],
    [cue(id, 'ويستحضر'), <g>
      <Header chip="قصة" title="نيكولا فوكيه" />
      <Pop at={cue(id, 'حفلًا')} x={540} y={980} s={0.8}><Q.Chateau /></Pop>
      <Pop at={cue(id, 'فخمًا')} x={540} y={560}><Q.Fireworks /></Pop>
      <Label x={540} y={400} text="1661" size={90} at={cue(id, 'عام')} />
      <Person x={830} y={FLOOR} s={0.75} head="hairLong" hairColor={C.brown} outfit="suit" top={C.purple} pose={[[0, 'idle'], [cue(id, 'أقام'), 'present']]} expr="happy" seed={5} />
      <Label x={830} y={760} text="فوكيه" size={48} at={cue(id, 'نيكولا')} />
      <T x={830} y={820} size={32} color={C.greyDark}>مسؤول مالية فرنسا</T>
      <Show from={cue(id, 'للملك')}><Person x={250} y={FLOOR} s={0.75} head="king" hairColor={C.brown} outfit="robe" top={C.blueDark} pose="hips" expr="neutral" seed={6} /></Show>
      <Label x={250} y={760} text="لويس 14" size={48} at={cue(id, 'لويس')} />
    </g>],
    [cue(id, 'بعد نحو'), <g>
      <Header chip="قصة" title="بعد نحو ثلاثة أسابيع" />
      <Pop at={cue(id, 'بعد نحو')} x={810} y={620} s={0.9}><P.Calendar top="أسابيع" big="3" /></Pop>
      <Person x={360} y={FLOOR} s={0.78} head="hairLong" hairColor={C.brown} outfit="suit" top={C.purple} expr={[[0, 'worried'], [cue(id, 'المؤبد'), 'sad']]} pose="idle" seed={5} />
      <g transform={`translate(360 ${FLOOR + 6})`}><Q.Bars at={cue(id, 'اعتُقل')} w={400} h={560} /></g>
      <Label x={360} y={680} text="سجن مؤبد" size={60} tone="red" at={cue(id, 'المؤبد')} />
    </g>],
  ]} />;
};

export const K03: React.FC = () => {
  const id = 'k03';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip="القانون 1" title="القصة أعقد من غيرة" />
      <Row at={cue(id, 'بصراعات')} y={470} icon={<P.Swords />} text="صراعات سياسية" />
      <Row at={cue(id, 'واتهامات')} y={670} icon={<g transform="translate(0 90)"><P.MoneyBag /></g>} text="اتهامات مالية" />
      <Row at={cue(id, 'وكان الملك')} y={870} icon={<g transform="scale(0.9)"><P.Calendar big="!" /></g>} text="نيّة إبعاده قبل الحفل" />
      <Row at={cue(id, 'لا تختصر')} y={1110} tone={C.cream} icon={<g transform="translate(0 70) scale(0.9)"><P.Crown /></g>} text="«غيرة الملك» وحدها" mark="cross" markAt={cue(id, 'غيرة')} />
    </g>],
    [cue(id, 'ما الذي نستفيده'), <g>
      <Header chip="الدرس" title="ما الذي نستفيده؟" />
      <Row at={cue(id, 'قدّم')} y={450} icon={<Q.Bulb />} text="قدّم أفكارك بلباقة" mark="tick" />
      <Row at={cue(id, 'وصحّح')} y={650} icon={<g transform="scale(1.4)"><P.Ear /></g>} text="صحّح الخطأ دون إحراج" mark="tick" />
      <Row at={cue(id, 'اشرح')} y={850} icon={<g><Mini x={-60} y={80} s={1.1} c={C.blue} /><Mini x={0} y={80} s={1.1} c={C.green} /><Mini x={60} y={80} s={1.1} c={C.orange} /></g>} text="اشرح الفائدة للفريق" mark="tick" />
      <Row at={cue(id, 'واذكر')} y={1050} icon={<Q.Stars />} text="اذكر مساهمات الآخرين بعدل" mark="tick" />
    </g>],
  ]} />;
};

export const K04: React.FC = () => {
  const id = 'k04';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip="القانون 1" title="ما لا يلزم قبوله" />
      <Row at={cue(id, 'إخفاء')} y={470} icon={<g transform="scale(1.1)"><P.Eye closed /></g>} text="إخفاء كفاءتك دائمًا" mark="cross" markAt={cue(id, 'لا يلزم')} />
      <Row at={cue(id, 'التملّق')} y={670} icon={<g transform="scale(1.1)"><P.Mask /></g>} text="التملّق" mark="cross" markAt={cue(id, 'لا يلزم', 1, 0.15)} />
      <Row at={cue(id, 'بسرقة')} y={870} icon={<g transform="translate(0 110)"><P.Trophy /></g>} text="أن يُسرق إنجازك" mark="cross" markAt={cue(id, 'لا يلزم', 1, 0.3)} />
    </g>],
    [cue(id, 'احترم'), <g>
      <Header chip="القانون 1" title="الطريق الأفضل" />
      <Row at={cue(id, 'احترم')} y={470} icon={<P.Heart />} text="احترم الناس" mark="tick" />
      <Row at={cue(id, 'واحفظ')} y={670} icon={<P.Shield />} text="احفظ حقك" mark="tick" />
      <Row at={cue(id, 'وابحث')} y={870} icon={<g transform="translate(0 150) scale(0.8)"><Q.Plant at={cue(id, 'نجاحك')} /></g>} text="ابحث عن بيئة تقدّر نجاحك" mark="tick" />
      <Narrator x={540} y={FLOOR + 40} s={0.53} pose="present" expr="happy" />
    </g>],
  ]} />;
};
