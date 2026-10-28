import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Bubble, C, Cross, INK, Label, Move, Pop, Seq, Show, T, W } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { NUM } from '../fonts';
import { Disclaimer, FLOOR, Header, LawCard, Row } from './common';

// The hook, the note, and laws 4–6 (chunks m00–m04).

/** The 48 laws as a grid read from the right: 1–3 done (cream), this part's laws lit blue from `lit`. */
export const Grid48: React.FC<{ at: number; lit: number; from: number; to: number; y?: number }> = ({ at, lit, from, to, y = 890 }) => {
  const f = useCurrentFrame();
  return <g>{Array.from({ length: 48 }, (_, i) => {
    if (f < at + i / 2) return null;
    const mine = i + 1 >= from && i + 1 <= to;
    const on = mine && f >= lit + (i + 1 - from) * 4;
    return <g key={i}>
      <rect x={980 - (i % 12) * 80 - 32} y={y + Math.floor(i / 12) * 80 - 32} width={64} height={64} rx={12}
        fill={on ? C.accent : i + 1 < from ? C.cream : C.shade} stroke={INK} strokeWidth={on ? 6 : 3} />
      {(on || i + 1 < from) && <text x={980 - (i % 12) * 80} y={y + Math.floor(i / 12) * 80 + 3} textAnchor="middle" dominantBaseline="middle"
        fontFamily={NUM} fontWeight={900} fontSize={32} fill={on ? '#fff' : C.greyDark}>{i + 1}</text>}
    </g>;
  })}</g>;
};

export const M00: React.FC = () => {
  const id = 'm00';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Pop at={start(id)} x={540} y={430}>
        <circle r={150} fill={C.accent} stroke={INK} strokeWidth={12} />
        <text x={0} y={18} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={230} fill="#fff">7</text>
      </Pop>
      <Label x={540} y={640} text="قوانين في ريل واحد" size={76} at={cue(id, 'قوانين')} />
      {([['كلامك', 820, 'كلامك', <g transform="scale(0.8)"><Bubble w={170} h={100}><T size={56}>…</T></Bubble></g>],
        ['وسمعتك', 540, 'سمعتك', <Q.Stars />],
        ['ظهورك', 260, 'ظهورك', <g transform="translate(0 90) scale(0.4)"><Q.Spotlight h={300} w={150} /></g>]] as const).map(([w, x, l, icon]) => <g key={w}>
        <Pop at={cue(id, w)} x={x} y={860}><circle r={115} fill={C.paper} stroke={INK} strokeWidth={W} />{icon}</Pop>
        <Label x={x} y={1020} text={l} size={50} at={cue(id, w, 1, 0.1)} />
      </g>)}
      <Label x={540} y={1180} text="في قوتك؟" size={60} tone="red" at={cue(id, 'قوتك')} />
    </g>],
    [cue(id, 'هذا الجزء'), <g>
      <Label x={540} y={330} text="الجزء الثاني" size={100} at={cue(id, 'هذا الجزء')} />
      <Pop at={cue(id, 'القوانين')} x={540} y={450}><T size={46}>«القوانين الثمانية والأربعون للقوة»</T></Pop>
      <Label x={540} y={530} text="روبرت غرين" size={48} tone="ink" at={cue(id, 'لروبرت')} />
      <Grid48 at={cue(id, 'هذا الجزء')} lit={cue(id, 'الثمانية')} from={4} to={10} y={720} />
      <Narrator x={540} y={FLOOR + 40} s={0.5} pose="present" expr="happy" />
    </g>],
  ]} />;
};

export const M01: React.FC = () => {
  const id = 'm01';
  return <g>
    <Show from={start(id)} to={until(id)}><Header title="تنبيه قبل البداية" /></Show>
    <Pop at={start(id)} out={until(id) - 10} x={540} y={490} s={0.9}><Q.Warning /></Pop>
    <Show from={start(id)} to={until(id)}><Disclaimer at={cue(id, 'تتعارض')} /></Show>
    <Show from={cue(id, 'للتعلّم')} to={until(id)}>
      <Row at={cue(id, 'للتعلّم')} y={1180} icon={<P.Magnifier />} text="للفهم… لا للتطبيق" mark="tick" />
    </Show>
  </g>;
};

const chip4 = 'القانون 4';
export const M02: React.FC = () => {
  const id = 'm02';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={4} lines={['قل دائمًا أقل من اللازم']} at={start(id)} />],
    [cue(id, 'يرى غرين'), <g>
      <Header chip={chip4} title="كثرة الكلام تكشفك" />
      <Person x={790} y={FLOOR} s={0.8} head="hair" top={C.sky} face={-1} pose={[[0, 'both'], [cue(id, 'وتُضعف'), 'shrug']]} expr={[[0, 'happy'], [cue(id, 'وتُضعف'), 'worried']]} seed={4} />
      <Pop at={cue(id, 'كثرة')} x={560} y={480}><Bubble w={600} h={170} tail={[180, 140]}><T size={46}>بلا… توقّف… وأيضًا…</T></Bubble></Pop>
      {[0, 1, 2].map((i) => <Move key={i} a={cue(id, 'تكشف') + i * 8} b={cue(id, 'تكشف') + 40 + i * 8} x1={700} y1={820} x2={300 - i * 40} y2={760 + i * 130}>
        <g transform={`rotate(${-12 + i * 12}) scale(0.5)`}><P.Letter label="سر" /></g>
      </Move>)}
      <Label x={300} y={630} text="تكشف ما تخفيه" size={46} tone="red" at={cue(id, 'إخفاءه')} />
      <Label x={300} y={1200} text="هيبة أقل" size={56} tone="red" at={cue(id, 'هيبتك')} />
    </g>],
    [cue(id, 'في التفاوض'), <g>
      <Header chip="مثال" title="في التفاوض" />
      <Narrator x={820} y={FLOOR} s={0.72} face={-1} pose={[[0, 'present'], [cue(id, 'ثم اصمت'), 'cross']]} expr={[[0, 'neutral'], [cue(id, 'ثم اصمت'), 'smug']]} />
      <Person x={260} y={FLOOR} s={0.72} head="bald" outfit="suit" top={C.navy} pose={[[0, 'idle'], [cue(id, 'ثم اصمت', 1, 0.6), 'think']]} expr={[[0, 'neutral'], [cue(id, 'ثم اصمت', 1, 0.6), 'think']]} seed={2} />
      <Pop at={cue(id, 'التفاوض')} x={540} y={FLOOR} s={0.9}><P.Table w={240} /></Pop>
      <Show from={cue(id, 'اعرض')} to={cue(id, 'ثم اصمت')}>
        <Pop at={cue(id, 'اعرض')} x={640} y={500}><Bubble w={460} h={150} tail={[150, 130]}><T size={50}>«هذا عرضي.»</T></Bubble></Pop>
      </Show>
      <Show from={cue(id, 'ثم اصمت')}>
        <Pop at={cue(id, 'ثم اصمت')} x={640} y={500}><Bubble w={260} h={150} tail={[100, 130]}><T size={64}>…</T></Bubble></Pop>
        <Pop at={cue(id, 'اصمت')} x={540} y={760} s={0.8}><P.Clock r={70} spin={6} /></Pop>
        <Label x={540} y={880} text="صمت" size={80} at={cue(id, 'اصمت')} />
      </Show>
    </g>],
    [cue(id, 'لكن الإيجاز'), <g>
      <Header chip="حدّ أخلاقي" title="الإيجاز ليس كتمانًا" />
      <Row at={cue(id, 'الإيجاز')} y={520} icon={<g transform="scale(0.8)"><Bubble w={170} h={100}><T size={56}>…</T></Bubble></g>} text="إيجاز في الكلام" mark="tick" />
      <Row at={cue(id, 'كتمان')} y={720} icon={<Q.Lock />} text="كتمان ما هو من حق غيرك" mark="cross" markAt={cue(id, 'من حق')} />
      <Pop at={cue(id, 'غيرك')} x={540} y={1060} s={0.55}><P.Scale tip={0} left={<Mini x={0} y={40} s={0.9} c={C.green} />} right={<Mini x={0} y={40} s={0.9} c={C.blue} />} /></Pop>
    </g>],
  ]} />;
};

const chip5 = 'القانون 5';
export const M03: React.FC = () => {
  const id = 'm03';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={5} lines={['السمعة تعني الكثير', 'فاحرسها']} at={start(id)} />],
    [cue(id, 'السمعة تسبقك'), <g>
      <Header chip={chip5} title="السمعة تسبقك" />
      <Move a={cue(id, 'السمعة تسبقك')} b={cue(id, 'وتصنعها')} x1={920} y1={0} x2={800} y2={0}>
        <Person x={0} y={FLOOR} s={0.72} head="hair" top={C.teal} face={-1} pose="idle" expr="happy" seed={5} />
      </Move>
      <Move a={cue(id, 'السمعة تسبقك')} b={cue(id, 'وتصنعها')} x1={800} y1={560} x2={430} y2={560}><Q.Stars /></Move>
      <Label x={430} y={1180} text="الأفعال المتكررة" size={56} at={cue(id, 'الأفعال')} />
      <g transform="translate(400 1010)"><Q.TrustBars at={[cue(id, 'وتصنعها'), cue(id, 'الأفعال'), cue(id, 'الأفعال', 1, 0.3), cue(id, 'المتكررة'), cue(id, 'المتكررة', 1, 0.3)]} /></g>
    </g>],
    [cue(id, 'لكن غرين'), <g>
      <Header chip={chip5} title="هدم سمعة المنافس؟" />
      <Person x={800} y={FLOOR} s={0.75} head="bald" outfit="suit" top={C.navy} face={-1} pose="point" expr="smug" seed={2} />
      <Pop at={cue(id, 'هدم')} x={620} y={620} s={0.5}><g transform="scale(-1 1)"><Q.Megaphone /></g></Pop>
      <Person x={270} y={FLOOR} s={0.75} head="curly" top={C.green} pose="idle" expr={[[0, 'neutral'], [cue(id, 'هدم'), 'sad']]} seed={7} />
      <Show from={cue(id, 'المنافس')}><g transform="translate(270 560)"><Q.Stars n={3} /><Cross at={cue(id, 'المنافس')} x={0} y={0} s={2.2} /></g></Show>
      <Label x={820} y={420} text="غيبة" size={72} tone="red" at={cue(id, 'غيبة')} />
      <Label x={540} y={420} text="بهتان" size={72} tone="red" at={cue(id, 'بهتان')} />
      <Label x={540} y={1210} text="لا نقبله" size={60} tone="ink" at={cue(id, 'لا نقبله')} />
    </g>],
    [cue(id, 'سمعتك بعملك'), <g>
      <Header chip={chip5} title="احمِ سمعتك بعملك" />
      <Pop at={cue(id, 'سمعتك بعملك')} x={540} y={600} s={1.7}><P.Shield /></Pop>
      <Pop at={cue(id, 'سمعتك بعملك', 1, 0.15)} x={540} y={590} s={1.3}><Q.Stars n={1} /></Pop>
      <Row at={cue(id, 'بعملك')} y={900} icon={<P.Briefcase />} text="بعملك" mark="tick" />
      <Row at={cue(id, 'بتشويه')} y={1100} icon={<P.Bang />} text="بتشويه غيرك" mark="cross" />
    </g>],
  ]} />;
};

const chip6 = 'القانون 6';
export const M04: React.FC = () => {
  const id = 'm04';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={6} lines={['اجذب الانتباه بأي ثمن']} at={start(id)} />],
    [cue(id, 'يرى غرين'), <g>
      <Header chip={chip6} title="من لا يُرى يُنسى" />
      <g transform={`translate(780 ${FLOOR})`}><Q.Spotlight h={600} w={200} /></g>
      <Person x={780} y={FLOOR} s={0.78} head="hair" top={C.red} face={-1} pose="wave" expr="happy" seed={4} />
      <FadeOut from={cue(id, 'يُنسى')}><Person x={290} y={FLOOR} s={0.78} head="curly" top={C.grey} pose="idle" expr="sad" seed={7} /></FadeOut>
      <Label x={290} y={560} text="يُنسى" size={80} tone="red" at={cue(id, 'يُنسى')} />
    </g>],
    [cue(id, 'الظهور مهم'), <g>
      <Header chip={chip6} title="الظهور مهم… لكن" />
      <Label x={540} y={460} text="«بأي ثمن»؟" size={110} tone="red" at={cue(id, 'بأي ثمن', 2)} />
      {([['فضيحة', 820, 'فضيحة', <P.Bang />], ['كذب', 540, 'كذب', <g transform="scale(0.9)"><P.Mask /></g>], ['أذى', 260, 'أذى', <g transform="scale(0.6)"><P.Swords /></g>]] as const).map(([w, x, l, icon]) => <g key={w}>
        <Pop at={cue(id, w)} x={x} y={760}><circle r={115} fill={C.paper} stroke={INK} strokeWidth={W} /><g transform="scale(0.6)">{icon}</g></Pop>
        <Cross at={cue(id, w, 1, 0.25)} x={x} y={760} s={2} />
        <Label x={x} y={920} text={l} size={50} tone="red" at={cue(id, w, 1, 0.1)} />
      </g>)}
      <Pop at={cue(id, 'المشاهدات')} x={540} y={1150} s={0.42}><P.Phone><T y={-30} size={60} color={C.red}>مليون</T><T y={50} size={42}>مشاهدة</T></P.Phone></Pop>
    </g>],
    [cue(id, 'بقيمة'), <g>
      <Header chip={chip6} title="اجذب الانتباه بقيمة تقدّمها" />
      <g transform={`translate(760 ${FLOOR})`}><Q.Spotlight h={600} w={200} /></g>
      <Narrator x={760} y={FLOOR} s={0.75} face={-1} pose="present" expr="happy" />
      <Pop at={cue(id, 'بقيمة')} x={430} y={760}><Q.Bulb /></Pop>
      {[0, 1, 2].map((i) => <Move key={i} a={cue(id, 'تقدّمها')} b={cue(id, 'تقدّمها') + 40} x1={-100 - i * 80} y1={FLOOR} x2={300 - i * 110} y2={FLOOR}>
        <Mini x={0} y={0} s={1.5} c={[C.green, C.pink, C.orange][i]} />
      </Move>)}
      <Label x={430} y={560} text="قيمة" size={80} at={cue(id, 'بقيمة')} />
    </g>],
  ]} />;
};

/** Fades its children out over 20 frames from `from` (someone being forgotten). */
const FadeOut: React.FC<{ from: number; children: React.ReactNode }> = ({ from, children }) => {
  const f = useCurrentFrame();
  return <g opacity={f < from ? 1 : Math.max(0.15, 1 - (f - from) / 20)}>{children}</g>;
};

