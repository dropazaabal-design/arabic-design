import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Arrow, Bubble, C, Cross, INK, Label, Pop, Seq, T, Tick, W, ease } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { NUM } from '../fonts';
import { FLOOR, Grid48, Header, LawCard, Row } from './common';

// Laws 18–20, the summary and the teaser for part five (chunks c04–c07).

/** A fire that grows from small to big between frames a and b (a problem left alone). */
const Growing: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const f = useCurrentFrame();
  return <g transform={`scale(${ease(f, a, b, 0.4, 1.4)})`}><P.Fire /></g>;
};

const chip18 = 'القانون 18';
export const C04: React.FC = () => {
  const id = 'c04';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={18} lines={['لا تبنِ حصونًا تعزلك', 'فالعزلة خطرة']} at={start(id)} />],
    [cue(id, 'وهنا نتفق'), <g>
      <Header chip={chip18} title="هنا نتفق مع غرين" />
      <Pop at={cue(id, 'ينعزل')} x={760} y={1150} s={0.75}><P.Castle /></Pop>
      <Label x={760} y={560} text="تفوته الأخبار" size={52} at={cue(id, 'الأخبار')} />
      <Pop at={cue(id, 'الأخبار')} x={480} y={700} s={0.6}><P.Letter label="خبر" /></Pop>
      <Cross at={cue(id, 'الأخبار', 1, 0.3)} x={480} y={690} s={1.4} />
      {[0, 1].map((i) => <g key={i}>
        <Mini x={300 - i * 160} y={FLOOR} s={1.7} c={[C.purple, C.teal][i]} />
        <Pop at={cue(id, 'يجامله') + i * 6} x={300 - i * 160} y={940}><Bubble w={170} h={80} tail={[0, 60]}><T size={34}>ممتاز!</T></Bubble></Pop>
      </g>)}
    </g>],
    [cue(id, 'وكم من مدير'), <g>
      <Header chip={chip18} title="باب مغلق… ومشكلة تكبر" />
      <Pop at={cue(id, 'أغلق')} x={780} y={FLOOR} s={1.3}><P.Door open={0} /></Pop>
      <Label x={780} y={560} text="باب مغلق" size={56} at={cue(id, 'بابه')} />
      <g transform={`translate(300 ${FLOOR - 40})`}><Growing a={cue(id, 'بالمشكلة')} b={cue(id, 'كبرت') + 20} /></g>
      <Label x={300} y={700} text="المشكلة تكبر" size={56} tone="red" at={cue(id, 'كبرت')} />
    </g>],
    [cue(id, 'خالط'), <g>
      <Header chip={chip18} title="خالط واسمع واستشر" />
      <Row at={cue(id, 'خالط')} y={460} icon={<g><Mini x={-30} y={70} s={1} c={C.pink} /><Mini x={30} y={70} s={1} c={C.teal} /></g>} text="خالط الناس" mark="tick" />
      <Row at={cue(id, 'واسمع')} y={640} icon={<P.Ear />} text="اسمع من ينتقدك" mark="tick" />
      <Row at={cue(id, 'واستشر')} y={820} icon={<P.Question />} text="استشر أهل الخبرة" mark="tick" />
      <Label x={540} y={1060} text="الشورى قيمة أصيلة" size={70} at={cue(id, 'فالشورى')} />
    </g>],
  ]} />;
};

const chip19 = 'القانون 19';
export const C05: React.FC = () => {
  const id = 'c05';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={19} lines={['اعرف من تتعامل معه', 'ولا تُسئ إلى الشخص الخطأ']} at={start(id)} />],
    [cue(id, 'معرفة'), <g>
      <Header chip={chip19} title="اعرف طباع الناس" />
      <Person x={820} y={FLOOR} s={0.72} head="hair" top={C.sky} face={-1} pose="idle" expr={[[0, 'neutral'], [cue(id, 'يقبل'), 'happy']]} seed={4} />
      <Person x={260} y={FLOOR} s={0.72} head="curly" top={C.orange} pose="idle" expr={[[0, 'neutral'], [cue(id, 'يجرحه'), 'sad']]} seed={7} />
      <Label x={820} y={560} text="يقبل المزاح" size={50} at={cue(id, 'يقبل')} />
      <Label x={260} y={560} text="يجرحه المزاح" size={50} tone="red" at={cue(id, 'يجرحه')} />
      <Label x={540} y={760} text="اختر كلماتك" size={80} at={cue(id, 'فاختر')} />
    </g>],
    [cue(id, 'لكن غرين'), <g>
      <Header chip={chip19} title="لا تُسئ إلى أحد أصلًا" />
      <Pop at={cue(id, 'يحصر')} x={540} y={450}><Bubble w={940} h={140} tail={[0, 120]}><T size={42}>«احذر فقط من يستطيع الانتقام»</T></Bubble></Pop>
      <Cross at={cue(id, 'ونحن')} x={540} y={450} s={2.4} />
      <Person x={780} y={FLOOR} s={0.8} head="bald" outfit="suit" top={C.navy} face={-1} pose="hips" expr="neutral" seed={2} />
      <Mini x={300} y={FLOOR} s={2.2} c={C.green} />
      <Label x={780} y={760} text="قويًّا" size={56} at={cue(id, 'قويًّا')} />
      <Tick at={cue(id, 'قويًّا', 1, 0.2)} x={780} y={860} s={1.4} />
      <Label x={300} y={760} text="أو ضعيفًا" size={56} at={cue(id, 'ضعيفًا')} />
      <Tick at={cue(id, 'ضعيفًا', 1, 0.2)} x={300} y={860} s={1.4} />
    </g>],
  ]} />;
};

const chip20 = 'القانون 20';
export const C06: React.FC = () => {
  const id = 'c06';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={20} lines={['لا تلتزم لأحد']} at={start(id)} />],
    [cue(id, 'يرى غرين'), <g>
      <Header chip={chip20} title="الحياد يحفظ استقلالك" />
      <Person x={860} y={FLOOR} s={0.62} head="hair" top={C.red} face={-1} pose="point" expr="angry" seed={4} />
      <Person x={220} y={FLOOR} s={0.62} head="curly" top={C.green} pose="point" expr="angry" seed={7} />
      <Narrator x={540} y={FLOOR} s={0.62} pose="stop" expr="neutral" />
      <Label x={540} y={520} text="لا تدخل خلافًا لا تعرف أصله" size={48} at={cue(id, 'خلاف')} />
      <Label x={540} y={620} text="ولا تتعجل التحالفات" size={44} tone="ink" at={cue(id, 'التحالفات')} />
    </g>],
    [cue(id, 'لكن إيهام'), <g>
      <Header chip={chip20} title="إيهام كل طرف خداع" />
      <Person x={860} y={FLOOR} s={0.62} head="hair" top={C.red} face={-1} pose="idle" expr="happy" seed={4} />
      <Person x={220} y={FLOOR} s={0.62} head="curly" top={C.green} pose="idle" expr="happy" seed={7} />
      <Person x={540} y={FLOOR} s={0.62} head="bald" outfit="suit" top={C.purple} pose="both" expr="smug" seed={2} />
      <Pop at={cue(id, 'إيهام')} x={760} y={700}><Bubble w={260} h={100} tail={[-60, 80]}><T size={40}>أنا معك</T></Bubble></Pop>
      <Pop at={cue(id, 'طرف')} x={320} y={700}><Bubble w={260} h={100} tail={[60, 80]}><T size={40}>أنا معك</T></Bubble></Pop>
      <Label x={540} y={500} text="خداع" size={100} tone="red" at={cue(id, 'خداع')} />
    </g>],
    [cue(id, 'ومن وعد'), <g>
      <Header chip={chip20} title="تمهّل… ثم أوفِ" />
      <Pop at={cue(id, 'فتمهّل')} x={780} y={700}><P.Clock r={110} spin={5} /></Pop>
      <Label x={780} y={880} text="تمهّل" size={70} at={cue(id, 'فتمهّل')} />
      <Arrow at={cue(id, 'ثم')} x1={660} y1={700} x2={440} y2={700} />
      <Pop at={cue(id, 'وعد')} x={300} y={700} s={0.9}><Q.Contract sign={cue(id, 'أوفِ')} title="وعد" /></Pop>
      <Label x={300} y={960} text="الوفاء واجب" size={56} at={cue(id, 'الوفاء')} />
    </g>],
  ]} />;
};

export const C07: React.FC = () => {
  const id = 'c07';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip="الخلاصة" title="خذ من القوانين الخمسة" />
      <Row at={cue(id, 'حضورًا')} y={440} icon={<Q.Bulb />} text="حضور بقيمة" mark="tick" />
      <Row at={cue(id, 'وثباتًا')} y={612} icon={<P.Shield />} text="ثبات في المبادئ" mark="tick" />
      <Row at={cue(id, 'وقربًا')} y={784} icon={<g><Mini x={-30} y={70} s={1} c={C.pink} /><Mini x={30} y={70} s={1} c={C.teal} /></g>} text="قرب من الناس" mark="tick" />
      <Row at={cue(id, 'واحترامًا')} y={956} icon={<P.Heart />} text="احترام للجميع" mark="tick" />
      <Row at={cue(id, 'وتمهّلًا')} y={1128} icon={<P.Clock r={60} />} text="تمهّل قبل الوعد" mark="tick" />
    </g>],
    [cue(id, 'واترك'), <g>
      <Header chip="الخلاصة" title="واترك" />
      {([['التخويف', 760, 'التخويف', <g transform="scale(0.55)"><P.Cloud storm /></g>], ['والإيهام', 320, 'الإيهام', <g transform="scale(0.8)"><P.Mask /></g>]] as const).map(([w, x, l, icon]) => <g key={w}>
        <Pop at={cue(id, w)} x={x} y={700}><circle r={130} fill={C.paper} stroke={INK} strokeWidth={W} />{icon}</Pop>
        <Cross at={cue(id, w, 1, 0.25)} x={x} y={700} s={2.2} />
        <Label x={x} y={900} text={l} size={60} tone="red" at={cue(id, w, 1, 0.1)} />
      </g>)}
      <Narrator x={540} y={FLOOR + 40} s={0.45} pose="stop" expr="neutral" />
    </g>],
    [cue(id, 'وفي الجزء'), <g>
      <Label x={540} y={340} text="الجزء القادم" size={100} at={cue(id, 'وفي الجزء')} />
      <Label x={540} y={470} text="من القانون 21" size={60} tone="ink" at={cue(id, 'الحادي')} />
      <Grid48 at={cue(id, 'وفي الجزء')} lit={cue(id, 'وفي الجزء')} from={16} to={20} y={680} />
      <Pop at={cue(id, 'الحادي')} x={980 - 8 * 80} y={760}><rect x={-38} y={-38} width={76} height={76} rx={14} fill="#fff" stroke={C.accent} strokeWidth={8} /><text y={3} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={36} fill={C.accent}>21</text></Pop>
    </g>],
    [cue(id, 'أي القوانين'), <g>
      <Header title="اكتبه في التعليقات" />
      <Pop at={cue(id, 'أي القوانين')} x={540} y={520}><Bubble w={900} h={170} tail={[260, 150]}><T size={52}>أي قانون تحتاجه أكثر؟</T></Bubble></Pop>
      {[16, 17, 18, 19, 20].map((n, i) => <Pop key={n} at={cue(id, 'الخمسة') + i * 4} x={880 - i * 170} y={790}>
        <circle r={66} fill={n === 17 ? C.red : C.accent} stroke={INK} strokeWidth={W} />
        <text y={4} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={60} fill="#fff">{n}</text>
      </Pop>)}
      <Pop at={cue(id, 'التعليقات')} x={540} y={1000} s={0.8}><P.Question /></Pop>
      <Narrator x={780} y={FLOOR + 40} s={0.5} face={-1} pose="wave" expr="happy" />
    </g>],
  ]} />;
};
