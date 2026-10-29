import React from 'react';
import { Arrow, Bubble, C, Cross, Label, Move, Pop, Seq, Show, T, Tick } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { Alert, Disclaimer, FLOOR, Grid48, Header, LawCard, Row } from './common';

// The hook, the note, and laws 11–12 (chunks c00–c03).

/** A fishing line with a hook and a gift on it: the bait. Bottom of the line at (0,0). */
export const Bait: React.FC = () => <g>
  <path d="M0 -420 L0 0 Q0 60 -46 60 Q-90 60 -90 16" fill="none" stroke={C.greyDark} strokeWidth={12} strokeLinecap="round" />
  <path d="M-90 16 L-106 40 M-90 16 L-70 34" stroke={C.greyDark} strokeWidth={10} strokeLinecap="round" />
  <g transform="translate(0 -40) scale(0.7)"><P.Box label="هدية" c={C.pink} /></g>
</g>;

export const C00: React.FC = () => {
  const id = 'c00';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Label x={540} y={400} text="هل الكرم دائمًا بريء؟" size={96} at={start(id)} />
      <Pop at={cue(id, 'الكرم')} x={540} y={980} s={2.2}><P.Box label="هدية" c={C.pink} /></Pop>
      <Pop at={cue(id, 'بريء')} x={760} y={640} s={0.7}><P.Question /></Pop>
    </g>],
    [cue(id, 'خمسة'), <g>
      <Header chip="الجزء الثالث" title="خمسة قوانين في ريل واحد" />
      <Row at={cue(id, 'الاعتماد')} y={430} icon={<P.Key />} text="الاعتماد عليك" />
      <Row at={cue(id, 'والكرم')} y={602} icon={<g transform="translate(0 50) scale(0.8)"><P.Box label="" c={C.pink} /></g>} text="الكرم الخادع" />
      <Row at={cue(id, 'وطلب')} y={774} icon={<g transform="scale(0.6)"><P.Handshake /></g>} text="طلب المساعدة" />
      <Row at={cue(id, 'والصديق')} y={946} icon={<P.Binoculars />} text="الصديق الجاسوس" />
      <Row at={cue(id, 'وسحق')} y={1118} icon={<P.Swords />} text="سحق الخصم" />
    </g>],
    [cue(id, 'هذا الجزء'), <g>
      <Label x={540} y={330} text="الجزء الثالث" size={100} at={cue(id, 'هذا الجزء')} />
      <Pop at={cue(id, 'القوانين')} x={540} y={450}><T size={46}>«القوانين الثمانية والأربعون للقوة»</T></Pop>
      <Label x={540} y={530} text="روبرت غرين" size={48} tone="ink" at={cue(id, 'لروبرت')} />
      <Grid48 at={cue(id, 'هذا الجزء')} lit={cue(id, 'الثمانية')} from={11} to={15} y={720} />
      <Narrator x={540} y={FLOOR + 40} s={0.5} pose="present" expr="happy" />
    </g>],
  ]} />;
};

export const C01: React.FC = () => {
  const id = 'c01';
  return <g>
    <Show from={start(id)} to={until(id)}><Header title="تنبيه قبل البداية" /></Show>
    <Pop at={start(id)} out={until(id) - 10} x={540} y={490} s={0.9}><Q.Warning /></Pop>
    <Show from={start(id)} to={until(id)}><Disclaimer at={cue(id, 'تتعارض')} /></Show>
    <Show from={cue(id, 'للتعلّم')} to={until(id)}>
      <Row at={cue(id, 'للتعلّم')} y={1180} icon={<P.Magnifier />} text="للفهم… لا للتطبيق" mark="tick" />
    </Show>
  </g>;
};

const chip11 = 'القانون 11';
export const C02: React.FC = () => {
  const id = 'c02';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={11} lines={['اجعل الناس معتمدين عليك']} at={start(id)} />],
    [cue(id, 'يرى غرين'), <g>
      <Header chip={chip11} title="من لا يُستغنى عنه…" />
      <Person x={800} y={FLOOR} s={0.78} head="hair" top={C.teal} face={-1} pose="hold" expr="smug" seed={4}
        hand={<g transform="translate(-50 10) scale(0.5)"><P.Key /></g>} />
      {[0, 1, 2].map((i) => <g key={i}>
        <Mini x={420 - i * 140} y={FLOOR} s={1.7} c={[C.pink, C.orange, C.purple][i]} head={i === 1 ? 'hijab' : 'hair'} hc={C.navy} />
        <Arrow at={cue(id, 'يُستغنى') + i * 5} x1={420 - i * 140} y1={1000} x2={680} y2={850} w={5} />
      </g>)}
      <Label x={300} y={620} text="يصعب إقصاؤه" size={56} at={cue(id, 'إقصاؤه')} />
      <Label x={800} y={470} text="ماهر ونافع" size={52} at={cue(id, 'ماهرًا')} />
      <Tick at={cue(id, 'محمود')} x={800} y={560} s={1.6} />
    </g>],
    [cue(id, 'وتنبيه خاص'), <g>
      <Alert at={cue(id, 'وتنبيه خاص')} text="إخفاء المعرفة إضرار بالفريق" />
      <Pop at={cue(id, 'بإخفاء')} x={790} y={820} s={0.6}><P.Notebook /></Pop>
      <Pop at={cue(id, 'المعرفة')} x={790} y={860} s={0.9}><Q.Lock /></Pop>
      {[0, 1, 2].map((i) => <Mini key={i} x={420 - i * 140} y={FLOOR} s={1.7} c={[C.pink, C.orange, C.purple][i]} head={i === 1 ? 'hijab' : 'hair'} hc={C.navy} sad />)}
      <Label x={280} y={760} text="تعطيل" size={80} tone="red" at={cue(id, 'وتعطيل')} />
    </g>],
    [cue(id, 'كن مهمًّا'), <g>
      <Header chip={chip11} title="كن مهمًّا… بلا احتكار" />
      <Row at={cue(id, 'بإتقانك')} y={470} icon={<Q.Bulb />} text="أتقن عملك" mark="tick" />
      <Row at={cue(id, 'ووثّق')} y={670} icon={<P.Notebook />} text="وثّق عملك" mark="tick" />
      <Row at={cue(id, 'ودرّب')} y={870} icon={<g><Mini x={-30} y={70} s={1} c={C.pink} /><Mini x={30} y={70} s={1} c={C.teal} /></g>} text="درّب من حولك" mark="tick" />
      <Label x={540} y={1110} text="العمل يستمر… وفضلك يبقى" size={56} at={cue(id, 'استمر')} />
      <Pop at={cue(id, 'وبقي')} x={540} y={1220} s={0.8}><Q.Stars /></Pop>
    </g>],
  ]} />;
};

const chip12 = 'القانون 12';
export const C03: React.FC = () => {
  const id = 'c03';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={12} lines={['استعمل الصدق والكرم الانتقائيين', 'لتجريد ضحيتك من سلاحها']} at={start(id)} />],
    [cue(id, 'وتنبيه خاص'), <g>
      <Alert at={cue(id, 'وتنبيه خاص')} text="صدق وهدية للإيقاع بالناس" />
      <g transform="translate(540 1060)"><Move a={cue(id, 'وتنبيه خاص')} b={cue(id, 'وتنبيه خاص') + 30} x1={0} y1={-200} x2={0} y2={0}><Bait /></Move></g>
      <Cross at={cue(id, 'خداع')} x={540} y={1040} s={3} />
      <Label x={540} y={1240} text="خداع" size={80} tone="red" at={cue(id, 'خداع')} />
    </g>],
    [cue(id, 'فائدته'), <g>
      <Header chip={chip12} title="اعرف الأسلوب لتحمي نفسك" />
      <Pop at={cue(id, 'كرم مفاجئ')} x={800} y={640} s={1.1}><P.Box label="هدية" c={C.pink} /></Pop>
      <Label x={800} y={800} text="كرم مفاجئ" size={50} at={cue(id, 'كرم مفاجئ')} />
      <Arrow at={cue(id, 'يتبعه')} x1={650} y1={600} x2={430} y2={600} />
      <Pop at={cue(id, 'طلب كبير')} x={280} y={640} s={1.2}><P.MoneyBag /></Pop>
      <Label x={280} y={800} text="طلب كبير" size={50} tone="red" at={cue(id, 'طلب كبير')} />
    </g>],
    [cue(id, 'كبائع'), <g>
      <Header chip={chip12} title="مثال: البائع" />
      <Person x={800} y={FLOOR} s={0.72} head="bald" outfit="suit" top={C.navy} face={-1} pose="present" expr="smug" seed={2} />
      <Pop at={cue(id, 'يعترف')} x={560} y={540}><Bubble w={520} h={140} tail={[180, 120]}><T size={46}>«فيه عيب صغير…»</T></Bubble></Pop>
      <Label x={300} y={760} text="ثقة" size={60} at={cue(id, 'ثقتك')} />
      <Arrow at={cue(id, 'ثقتك', 1, 0.2)} x1={300} y1={820} x2={300} y2={930} />
      <Pop at={cue(id, 'صفقة')} x={300} y={1060} s={1.1}><P.MoneyBag /></Pop>
      <Label x={300} y={1230} text="صفقة كبيرة" size={50} tone="red" at={cue(id, 'صفقة')} />
    </g>],
    [cue(id, 'فخذ وقتك'), <g>
      <Header chip={chip12} title="خذ وقتك قبل أن تقرر" />
      <Pop at={cue(id, 'وقتك')} x={400} y={560}><P.Clock r={120} spin={4} /></Pop>
      <Narrator x={860} y={FLOOR} s={0.62} face={-1} pose="think" expr="think" />
      <Label x={400} y={860} text="الكرم الحقيقي" size={70} at={cue(id, 'والكرم الحقيقي')} />
      <Label x={400} y={960} text="لا ينتظر مقابلًا خفيًّا" size={46} tone="ink" at={cue(id, 'مقابلًا')} />
      <Pop at={cue(id, 'الحقيقي')} x={400} y={1120} s={0.6}><P.Heart /></Pop>
    </g>],
  ]} />;
};
