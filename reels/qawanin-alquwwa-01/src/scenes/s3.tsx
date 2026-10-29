import React from 'react';
import { Arrow, Bubble, C, Cross, INK, Label, Move, Pop, Seq, Show, T, Tick, W } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { FLOOR, Header, LawCard, Row } from './common';

// Law 3, the summary and the teaser for part two (chunks k09–k12).

const chip = 'القانون 3';

export const K09: React.FC = () => {
  const id = 'k09';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={3} lines={['أخفِ نواياك']} at={start(id)} />],
    [cue(id, 'الفكرة'), <g>
      <Header chip={chip} title="خطة مكشوفة مبكرًا" />
      <Person x={820} y={FLOOR} s={0.78} head="hair" top={C.sky} face={-1} pose="hold" expr="happy" seed={4} />
      <Pop at={cue(id, 'كشف')} x={600} y={940} s={0.7}><g transform="scale(-1 1)"><Q.Megaphone /></g></Pop>
      <Move a={cue(id, 'خطتك')} b={cue(id, 'المنافسين')} x1={600} y1={700} x2={260} y2={560}><g transform="scale(0.45)"><P.Scroll /></g></Move>
      {[0, 1, 2].map((i) => <Pop key={i} at={cue(id, 'المنافسين') + i * 4} x={380 - i * 110} y={FLOOR}><Mini x={0} y={0} s={1.5} c={C.black} hc={C.black} /></Pop>)}
      <Label x={270} y={380} text="تعطيل" size={60} tone="red" at={cue(id, 'لتعطيلها')} />
      <Label x={270} y={780} text="استعداد لمواجهتك" size={42} at={cue(id, 'الاستعداد')} />
    </g>],
    [cue(id, 'لكنه يذهب'), <g>
      <Header chip={chip} title="أهداف زائفة؟" />
      <Pop at={cue(id, 'أهداف زائفة')} x={780} y={640}><P.Target /></Pop>
      <Label x={780} y={480} text="زائف" size={56} tone="red" at={cue(id, 'زائفة')} />
      {[0, 1, 2].map((i) => <Arrow key={i} at={cue(id, 'تشغل') + i * 5} x1={900 - i * 120} y1={1100} x2={820 - i * 40} y2={760} w={6} />)}
      {[0, 1, 2].map((i) => <Mini key={i} x={900 - i * 120} y={FLOOR} s={1.3} c={[C.blue, C.green, C.orange][i]} />)}
      <Pop at={cue(id, 'الهدف الحقيقي')} x={290} y={660} s={0.8}><P.Target /></Pop>
      <Pop at={cue(id, 'الهدف الحقيقي', 1, 0.2)} x={290} y={700} s={0.5}><Q.Lock /></Pop>
      <Label x={290} y={480} text="الحقيقي" size={52} at={cue(id, 'الحقيقي')} />
      <Pop at={cue(id, 'التضليل')} x={290} y={1060} s={0.6}><Q.Warning /></Pop>
      <Label x={330} y={1240} text="هنا يبدأ التضليل" size={50} tone="red" at={cue(id, 'التضليل')} />
    </g>],
  ]} />;
};

export const K10: React.FC = () => {
  const id = 'k10';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip={chip} title="خدمة جديدة: احمِها حتى تنضج" />
      <Row at={cue(id, 'تدرسها')} y={460} icon={<P.Notebook />} text="ادرسها" mark="tick" />
      <Row at={cue(id, 'وتختبرها')} y={660} icon={<Q.Flask />} text="اختبرها" mark="tick" />
      <Row at={cue(id, 'وتحمي')} y={860} icon={<Q.Lock />} text="احمِ تفاصيلها حتى تنضج" mark="tick" />
      <Pop at={cue(id, 'لإطلاق')} x={540} y={1150} s={0.9}><P.Rocket /></Pop>
    </g>],
    [cue(id, 'لا تحتاج'), <g>
      <Header chip={chip} title="لا تحتاج إلى…" />
      <Row at={cue(id, 'إعلان')} y={520} icon={<Q.Megaphone />} text="إعلان كل خطوة" mark="cross" />
      <Row at={cue(id, 'طلب رأي')} y={720} icon={<g><Mini x={-50} y={80} s={1.1} c={C.pink} /><Mini x={50} y={80} s={1.1} c={C.teal} /><g transform="translate(0 -60) scale(0.5)"><P.Question /></g></g>} text="رأي كل شخص تعرفه" mark="cross" />
    </g>],
    [cue(id, 'وإذا سألك'), <g>
      <Header chip={chip} title="جواب صادق" />
      <Pop at={cue(id, 'وإذا سألك')} x={850} y={FLOOR}><Mini x={0} y={0} s={1.9} c={C.purple} /></Pop>
      <Pop at={cue(id, 'سألك')} x={850} y={880} s={0.7}><P.Question /></Pop>
      <Narrator x={300} y={FLOOR} s={0.72} pose="present" expr="happy" />
      <Pop at={cue(id, 'أعمل')} x={540} y={520}><Bubble w={960} h={210} tail={[-220, 170]}>
        <T y={-38} size={50}>«أعمل على مشروع،</T><T y={40} size={50}>وسأشارك التفاصيل عندما يكتمل»</T>
      </Bubble></Pop>
      <Label x={600} y={760} text="خصوصية واضحة" size={60} at={cue(id, 'خصوصية')} />
      <Tick at={cue(id, 'خصوصية', 1, 0.3)} x={600} y={860} s={1.6} />
    </g>],
  ]} />;
};

export const K11: React.FC = () => {
  const id = 'k11';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip={chip} title="أين يبدأ الخداع؟" />
      <Row at={cue(id, 'اختلاق')} y={460} icon={<g transform="translate(0 150) scale(0.9)"><P.Book title="قصة" /></g>} text="اختلاق قصة" mark="cross" />
      <Row at={cue(id, 'إعطاء وعود')} y={660} icon={<g transform="scale(0.6)"><P.Handshake /></g>} text="وعود لن تفي بها" mark="cross" />
      <Row at={cue(id, 'إخفاء معلومة')} y={860} icon={<g transform="translate(0 70)"><P.Briefcase label="سري" /></g>} text="إخفاء ما يمس حق شريك أو عميل" mark="cross" />
      <Label x={540} y={1120} text="هذا خداع" size={90} tone="red" at={cue(id, 'خداع')} />
    </g>],
    [cue(id, 'الحفاظ على خطتك'), <g>
      <Header chip={chip} title="الخطة لا تبرّر تضييع الحقوق" />
      <Pop at={cue(id, 'الحفاظ')} x={540} y={760}><P.Scale tip={-1} left={<g><Mini x={-30} y={30} s={0.8} c={C.blue} /><Mini x={30} y={30} s={0.8} c={C.green} /></g>} right={<g transform="translate(0 -40) scale(0.4)"><Q.Lock /></g>} /></Pop>
      <Label x={360} y={1030} text="حقوق الناس" size={52} at={cue(id, 'حقوق الناس')} />
      <Label x={730} y={1030} text="خطتك" size={52} at={cue(id, 'خطتك')} />
    </g>],
    [cue(id, 'قبل أن تتكلم'), <g>
      <Header chip={chip} title="قبل أن تتكلم، اسأل:" />
      <Row at={cue(id, 'هل مشاركة')} y={480} icon={<P.Question />} text="هل مشاركتها تساعد العمل؟" />
      <Row at={cue(id, 'وهل للطرف')} y={680} icon={<g transform="scale(1.1)"><P.Eye /></g>} text="هل له حق في معرفتها؟" />
      <Pop at={cue(id, 'توازن')} x={540} y={1090} s={0.55}><P.Scale tip={0} left={<g transform="translate(0 -40) scale(0.4)"><P.Heart /></g>} right={<g transform="translate(0 -50) scale(0.6)"><Q.Bulb /></g>} /></Pop>
      <Label x={790} y={940} text="الحكمة" size={50} at={cue(id, 'الحكمة')} />
      <Label x={290} y={940} text="الصدق" size={50} at={cue(id, 'والصدق')} />
    </g>],
  ]} />;
};

export const K12: React.FC = () => {
  const id = 'k12';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip="الخلاصة" title="خذ من القوانين الثلاثة" />
      <Row at={cue(id, 'اللباقة')} y={460} icon={<Q.Bulb />} text="اللباقة في إظهار قدراتك" mark="tick" />
      <Row at={cue(id, 'والتدرّج')} y={660} icon={<g transform="translate(30 0) scale(0.55)"><Q.TrustBars at={[0, 0, 0, 0, 0]} /></g>} text="التدرّج في الثقة" mark="tick" />
      <Row at={cue(id, 'والخصوصية')} y={860} icon={<Q.Lock />} text="الخصوصية في التخطيط" mark="tick" />
      {([['التملّق', 820, 'تملّق'], ['والخيانة', 540, 'خيانة'], ['والكذب', 260, 'كذب']] as const).map(([w, x, l]) => <g key={w}>
        <Label x={x} y={1110} text={l} size={56} tone="red" at={cue(id, w)} />
        <Cross at={cue(id, w, 1, 0.2)} x={x} y={1110} s={1.6} />
      </g>)}
      <Label x={540} y={1240} text="واترك" size={44} tone="ink" at={cue(id, 'واترك')} />
    </g>],
    [cue(id, 'وفي الجزء الثاني'), <g>
      <Label x={540} y={330} text="الجزء الثاني" size={110} at={cue(id, 'وفي الجزء الثاني')} />
      {([['قلة الكلام', 820, 'قلة الكلام', <g transform="scale(0.8)"><Bubble w={150} h={90}><T size={50}>…</T></Bubble></g>], ['والسمعة', 540, 'السمعة', <Q.Stars />], ['وجذب', 260, 'جذب الانتباه', <g transform="translate(0 90) scale(0.4)"><Q.Spotlight h={300} w={150} /></g>]] as const).map(([w, x, l, n]) => <g key={w}>
        <Pop at={cue(id, w)} x={x} y={640}><circle r={120} fill={C.paper} stroke={INK} strokeWidth={W} />{n}</Pop>
        <Label x={x} y={810} text={l} size={38} at={cue(id, w, 1, 0.1)} />
      </g>)}
      <Pop at={cue(id, 'قوتك')} x={540} y={1240} s={0.7}><P.Book title="القوة" c={C.navy} /></Pop>
      <Narrator x={880} y={FLOOR + 40} s={0.53} pose="wave" expr="happy" face={-1} />
    </g>],
  ]} />;
};
