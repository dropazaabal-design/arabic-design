import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Arrow, Bubble, C, Cross, INK, Label, Move, Pop, Seq, Show, T, W } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { NUM } from '../fonts';
import { Alert, FLOOR, Header, LawCard, Row } from './common';
import { Grid48 } from './s1';

// Laws 7–10, the summary and the teaser for part three (chunks m05–m09).

const chip7 = 'القانون 7';
export const M05: React.FC = () => {
  const id = 'm05';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={7} lines={['اجعل غيرك يعمل', 'وانسب الفضل لنفسك']} at={start(id)} />],
    [cue(id, 'وتنبيه خاص'), <g>
      <Alert at={cue(id, 'وتنبيه خاص')} text="هذا ظلم وأكل لجهد الناس" />
      <Person x={800} y={FLOOR} s={0.75} head="hair" top={C.orange} face={-1} pose="hold" expr={[[0, 'neutral'], [cue(id, 'لجهد'), 'sad']]} seed={4}
        hand={<g transform="translate(-55 40) scale(0.55)"><P.Box label="جهده" /></g>} />
      <Person x={270} y={FLOOR} s={0.75} head="bald" outfit="suit" top={C.navy} pose="cheer" expr="smug" seed={2} />
      <Move a={cue(id, 'ظلم')} b={cue(id, 'ظلم') + 30} x1={800} y1={860} x2={270} y2={830}><g transform="scale(0.55)"><P.Trophy /></g></Move>
      <Label x={540} y={690} text="ظلم" size={90} tone="red" at={cue(id, 'ظلم')} />
    </g>],
    [cue(id, 'ما يصحّ'), <g>
      <Header chip={chip7} title="ما يصحّ منه: التفويض العادل" />
      <Narrator x={820} y={FLOOR} s={0.66} face={-1} pose={[[0, 'present'], [cue(id, 'يذكر'), 'both']]} expr="happy" />
      {[0, 1, 2].map((i) => <g key={i}>
        <Mini x={520 - i * 160} y={FLOOR} s={1.7} c={[C.teal, C.pink, C.green][i]} head={i === 1 ? 'hijab' : 'hair'} hc={C.navy} />
        <Arrow at={cue(id, 'وزّع') + i * 6} x1={700} y1={760} x2={520 - i * 160} y2={980} w={6} />
        <Pop at={cue(id, 'لكل شخص') + i * 6} x={520 - i * 160} y={880} s={0.5}><Q.Stars n={1} /></Pop>
        <Label x={520 - i * 160} y={985} text={['سارة', 'نورة', 'خالد'][i]} size={40} at={cue(id, 'أسماء') + i * 6} />
      </g>)}
      <Label x={360} y={560} text="لكل شخص فضله" size={60} at={cue(id, 'فضله')} />
      <Pop at={cue(id, 'احترامهم')} x={360} y={680} s={0.8}><P.Heart /></Pop>
    </g>],
  ]} />;
};

/** A fishing line with a hook and a gift on it: the bait. Bottom of the line at (0,0). */
const Bait: React.FC = () => <g>
  <path d="M0 -420 L0 0 Q0 60 -46 60 Q-90 60 -90 16" fill="none" stroke={C.greyDark} strokeWidth={12} strokeLinecap="round" />
  <path d="M-90 16 L-106 40 M-90 16 L-70 34" stroke={C.greyDark} strokeWidth={10} strokeLinecap="round" />
  <g transform="translate(0 -40) scale(0.7)"><P.Box label="هدية" c={C.pink} /></g>
</g>;

const chip8 = 'القانون 8';
export const M06: React.FC = () => {
  const id = 'm06';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={8} lines={['اجعل الآخرين يأتون إليك', 'واستعمل الطُّعم إن لزم']} at={start(id)} />],
    [cue(id, 'الفكرة'), <g>
      <Header chip={chip8} title="من يحدد المكان والتوقيت" />
      <Pop at={cue(id, 'المكان')} x={780} y={620}><P.MapIcon /></Pop>
      <Label x={780} y={800} text="المكان" size={52} at={cue(id, 'المكان')} />
      <Pop at={cue(id, 'والتوقيت')} x={300} y={620}><P.Clock r={100} spin={8} /></Pop>
      <Label x={300} y={800} text="التوقيت" size={52} at={cue(id, 'والتوقيت')} />
      <Pop at={cue(id, 'الأفضلية')} x={540} y={1030} s={1.1}><P.Crown /></Pop>
      <Label x={540} y={1200} text="الأفضلية" size={80} at={cue(id, 'الأفضلية')} />
    </g>],
    [cue(id, 'أما'), <g>
      <Alert at={cue(id, 'أما')} text="الطُّعم خداع لا نقبله" />
      <g transform="translate(540 1040)"><Move a={cue(id, 'أما')} b={cue(id, 'أما') + 30} x1={0} y1={-200} x2={0} y2={0}><Bait /></Move></g>
      <Cross at={cue(id, 'خداع')} x={540} y={1020} s={3} />
      <Mini x={860} y={FLOOR} s={1.8} c={C.green} />
      <Mini x={220} y={FLOOR} s={1.8} c={C.purple} />
    </g>],
    [cue(id, 'ضع شروطك'), <g>
      <Header chip={chip8} title="شروط واضحة… وقيمة حقيقية" />
      <Pop at={cue(id, 'شروطك')} x={790} y={640} s={0.85}><Q.Contract sign={cue(id, 'بوضوح')} title="شروطي" /></Pop>
      <Pop at={cue(id, 'قيمتك')} x={300} y={600}><Q.Bulb /></Pop>
      <Label x={300} y={420} text="قيمتك" size={60} at={cue(id, 'قيمتك')} />
      {[0, 1, 2].map((i) => <Move key={i} a={cue(id, 'يجذب')} b={cue(id, 'يجذب') + 50} x1={-120 - i * 60} y1={FLOOR} x2={160 + i * 140} y2={FLOOR}>
        <Mini x={0} y={0} s={1.6} c={[C.teal, C.orange, C.pink][i]} head={i === 2 ? 'hijab' : 'hair'} hc={C.navy} />
      </Move>)}
      <Narrator x={820} y={FLOOR + 40} s={0.5} face={-1} pose="present" expr="happy" />
    </g>],
  ]} />;
};

const chip9 = 'القانون 9';
export const M07: React.FC = () => {
  const id = 'm07';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={9} lines={['انتصر بأفعالك، لا بالجدال']} at={start(id)} />],
    [cue(id, 'قد تكسب'), <g>
      <Header chip={chip9} title="تكسب النقاش… وتخسر الشخص" />
      <Person x={800} y={FLOOR} s={0.75} head="hair" top={C.sky} face={-1} pose={[[0, 'point'], [cue(id, 'وتخسر'), 'cheer']]} expr={[[0, 'angry'], [cue(id, 'وتخسر'), 'smug']]} seed={4} />
      <Person x={270} y={FLOOR} s={0.75} head="curly" top={C.orange} pose={[[0, 'point'], [cue(id, 'وتخسر'), 'cross']]} expr={[[0, 'angry'], [cue(id, 'وتخسر'), 'sad']]} seed={7} />
      <Pop at={cue(id, 'تكسب')} x={800} y={500} s={0.6}><P.Trophy /></Pop>
      <Pop at={cue(id, 'وتخسر')} x={540} y={760}><P.Heart broken /></Pop>
      <Label x={540} y={930} text="خسرته" size={60} tone="red" at={cue(id, 'الشخص')} />
    </g>],
    [cue(id, 'بدل'), <g>
      <Header chip={chip9} title="جرّبها على نطاق صغير" />
      <Pop at={cue(id, 'تجادل')} x={790} y={480} s={0.8}><Bubble w={420} h={150} tail={[100, 130]}><T size={46}>«خطتي أفضل!»</T></Bubble></Pop>
      <Cross at={cue(id, 'أفضل')} x={790} y={480} s={2.2} />
      <Pop at={cue(id, 'نطاق صغير')} x={790} y={1000}><Q.Plant at={cue(id, 'نطاق صغير')} /></Pop>
      <Pop at={cue(id, 'ودع')} x={330} y={1120}><P.Bars a={cue(id, 'ودع')} b={cue(id, 'النتيجة')} h1={110} h2={330} l1="قبل" l2="بعد" c1={C.grey} c2={C.green} /></Pop>
      <Label x={330} y={640} text="النتيجة تتكلم" size={60} at={cue(id, 'تتكلم')} />
    </g>],
    [cue(id, 'ويبقى'), <g>
      <Header chip={chip9} title="والحوار الهادئ باب مفتوح" />
      <Pop at={cue(id, 'ويبقى')} x={540} y={FLOOR} s={1.3}><P.Door open={1} /></Pop>
      <Person x={830} y={FLOOR} s={0.7} head="hair" top={C.sky} face={-1} pose="present" expr="happy" seed={4} />
      <Person x={250} y={FLOOR} s={0.7} head="curly" top={C.orange} pose="present" expr="happy" seed={7} />
      <Label x={540} y={520} text="حوار هادئ" size={70} at={cue(id, 'الحوار')} />
    </g>],
  ]} />;
};

/** Four people in a row; the low mood spreads from the right one to the left from `from`. */
const Crowd: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  return <g>{[0, 1, 2, 3].map((i) => <Mini key={i} x={860 - i * 200} y={FLOOR} s={2} c={[C.purple, C.teal, C.pink, C.green][i]}
    head={i === 2 ? 'hijab' : 'hair'} hc={C.navy} sad={i === 0 || (i < 3 && f >= from + i * 12)} />)}</g>;
};

const chip10 = 'القانون 10';
export const M08: React.FC = () => {
  const id = 'm08';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={10} lines={['العدوى: تجنّب التعساء', 'وسيّئي الحظ']} at={start(id)} />],
    [cue(id, 'يرى غرين'), <g>
      <Header chip={chip10} title="المزاج السلبي معدٍ… أحيانًا" />
      <Pop at={cue(id, 'المزاج')} x={820} y={560}><P.Cloud storm /></Pop>
      <Crowd from={cue(id, 'معدٍ')} />
      <Label x={330} y={600} text="أحيانًا" size={80} at={cue(id, 'أحيانًا')} />
    </g>],
    [cue(id, 'لكن وصف'), <g>
      <Header chip={chip10} title="التشاؤم بالناس منهيّ عنه" />
      <Label x={540} y={430} text="«سيّئ الحظ»" size={90} tone="red" at={cue(id, 'بسوء الحظ')} />
      <Cross at={cue(id, 'التشاؤم')} x={540} y={430} s={2} />
      <Label x={540} y={560} text="التشاؤم نهى عنه الإسلام" size={50} tone="ink" at={cue(id, 'نهى')} />
      <Person x={780} y={FLOOR} s={0.72} head="hair" top={C.sky} face={-1} pose={[[0, 'idle'], [cue(id, 'ومساندة'), 'present']]} expr="happy" seed={4} />
      <Person x={300} y={FLOOR} s={0.72} head="curly" top={C.grey} pose="idle" expr={[[0, 'sad'], [cue(id, 'مطلوب'), 'happy']]} seed={7} />
      <Pop at={cue(id, 'ومساندة')} x={540} y={690} s={0.6}><P.Heart /></Pop>
      <Label x={540} y={800} text="مساندة المبتلى" size={56} at={cue(id, 'المبتلى')} />
    </g>],
    [cue(id, 'ابتعد'), <g>
      <Header chip={chip10} title="ابتعد عن…" />
      <Row at={cue(id, 'السلوك')} y={540} icon={<P.Bang />} text="السلوك المؤذي" mark="tick" />
      <Row at={cue(id, 'لا عن')} y={740} icon={<P.Heart />} text="صاحب المصيبة" mark="cross" markAt={cue(id, 'المصيبة')} />
      <Narrator x={540} y={FLOOR + 40} s={0.5} pose="present" expr="happy" />
    </g>],
  ]} />;
};

export const M09: React.FC = () => {
  const id = 'm09';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip="الخلاصة" title="خذ من القوانين السبعة" />
      <Row at={cue(id, 'الإيجاز')} y={440} icon={<g transform="scale(0.8)"><Bubble w={170} h={100}><T size={56}>…</T></Bubble></g>} text="الإيجاز" mark="tick" />
      <Row at={cue(id, 'والسمعة')} y={612} icon={<P.Shield />} text="السمعة النظيفة" mark="tick" />
      <Row at={cue(id, 'والظهور')} y={784} icon={<Q.Bulb />} text="الظهور بقيمة" mark="tick" />
      <Row at={cue(id, 'والإنصاف')} y={956} icon={<Q.Stars n={1} />} text="الإنصاف في الفضل" mark="tick" />
      <Row at={cue(id, 'والإقناع')} y={1128} icon={<g transform="translate(0 120) scale(0.55)"><Q.Plant /></g>} text="الإقناع بالعمل" mark="tick" />
    </g>],
    [cue(id, 'واترك'), <g>
      <Header chip="الخلاصة" title="واترك" />
      {([['الغيبة', 820, 'الغيبة', <g transform="scale(-0.55 0.55)"><Q.Megaphone /></g>], ['والخداع', 540, 'الخداع', <g transform="translate(0 70) scale(0.35)"><Bait /></g>], ['والتشاؤم', 260, 'التشاؤم', <g transform="scale(0.55)"><P.Cloud storm /></g>]] as const).map(([w, x, l, icon]) => <g key={w}>
        <Pop at={cue(id, w)} x={x} y={700}><circle r={120} fill={C.paper} stroke={INK} strokeWidth={W} />{icon}</Pop>
        <Cross at={cue(id, w, 1, 0.25)} x={x} y={700} s={2.1} />
        <Label x={x} y={880} text={l} size={56} tone="red" at={cue(id, w, 1, 0.1)} />
      </g>)}
      <Narrator x={540} y={FLOOR + 40} s={0.45} pose="stop" expr="neutral" />
    </g>],
    [cue(id, 'وفي الجزء'), <g>
      <Label x={540} y={340} text="الجزء القادم" size={100} at={cue(id, 'وفي الجزء')} />
      <Label x={540} y={470} text="من القانون 11" size={60} tone="ink" at={cue(id, 'الحادي')} />
      <Grid48 at={cue(id, 'وفي الجزء')} lit={cue(id, 'وفي الجزء')} from={4} to={10} y={680} />
      <Pop at={cue(id, 'الحادي')} x={980 - 10 * 80} y={680}><rect x={-38} y={-38} width={76} height={76} rx={14} fill="#fff" stroke={C.accent} strokeWidth={8} /><text y={3} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={36} fill={C.accent}>11</text></Pop>
    </g>],
    [cue(id, 'وقل لنا'), <g>
      <Header title="قل لنا في التعليقات" />
      <Pop at={cue(id, 'وقل لنا')} x={540} y={520}><Bubble w={900} h={170} tail={[260, 150]}><T size={56}>أي قانون تراه الأخطر؟</T></Bubble></Pop>
      {[4, 5, 6, 7, 8, 9, 10].map((n, i) => <Pop key={n} at={cue(id, 'قانون') + i * 4} x={960 - i * 140} y={790}>
        <circle r={56} fill={n === 7 || n === 8 ? C.red : C.accent} stroke={INK} strokeWidth={W} />
        <text y={4} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={56} fill="#fff">{n}</text>
      </Pop>)}
      <Pop at={cue(id, 'الأخطر')} x={540} y={1000} s={0.8}><P.Question /></Pop>
      <Narrator x={780} y={FLOOR + 40} s={0.5} face={-1} pose="wave" expr="happy" />
    </g>],
  ]} />;
};
