import React from 'react';
import { Bubble, C, Cross, INK, Label, Pop, Seq, T, W } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { NUM } from '../fonts';
import { Alert, FLOOR, Grid48, Header, LawCard, Row } from './common';

// Laws 13–15, the summary and the teaser for part four (chunks c04–c07).

const chip13 = 'القانون 13';
export const C04: React.FC = () => {
  const id = 'c04';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={13} lines={['عند طلب المساعدة خاطب المصلحة', 'لا الرحمة ولا الامتنان']} at={start(id)} />],
    [cue(id, 'فيه جانب'), <g>
      <Header chip={chip13} title="بيّن ما يكسبه الطرف الآخر" />
      <Narrator x={820} y={FLOOR} s={0.72} face={-1} pose="present" expr="happy" />
      <Person x={260} y={FLOOR} s={0.72} head="bald" outfit="suit" top={C.navy} pose={[[0, 'cross'], [cue(id, 'يكسبه'), 'present']]} expr={[[0, 'neutral'], [cue(id, 'يكسبه'), 'happy']]} seed={2} />
      <Pop at={cue(id, 'شراكة')} x={540} y={490} s={0.7}><Q.Contract title="شراكة" /></Pop>
      <Pop at={cue(id, 'يكسبه')} x={540} y={940} s={0.55}><P.Scale tip={0} left={<g transform="translate(0 -30) scale(0.5)"><P.Coins n={3} /></g>} right={<g transform="translate(0 -30) scale(0.5)"><P.Coins n={3} /></g>} /></Pop>
      <Label x={540} y={700} text="مصلحة مشتركة" size={56} at={cue(id, 'الطرف الآخر')} />
    </g>],
    [cue(id, 'لكن قول'), <g>
      <Header chip={chip13} title="تعميم غير صحيح" />
      <Pop at={cue(id, 'الناس لا')} x={540} y={430}><Bubble w={960} h={140} tail={[0, 120]}><T size={42}>«الناس لا يتحركون إلا لمصلحتهم»</T></Bubble></Pop>
      <Cross at={cue(id, 'تعميم')} x={540} y={430} s={2.4} />
      <Row at={cue(id, 'رحمةً')} y={680} icon={<P.Heart />} text="يعينون رحمةً" mark="tick" />
      <Row at={cue(id, 'ووفاءً')} y={880} icon={<g transform="scale(0.6)"><P.Handshake /></g>} text="ووفاءً" mark="tick" />
      <Row at={cue(id, 'والشكر')} y={1080} icon={<Q.Stars n={1} />} text="والشكر خُلق نبيل" mark="tick" />
    </g>],
  ]} />;
};

const chip14 = 'القانون 14';
export const C05: React.FC = () => {
  const id = 'c05';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={14} lines={['تظاهر بالصداقة', 'واعمل جاسوسًا']} at={start(id)} />],
    [cue(id, 'وتنبيه خاص'), <g>
      <Alert at={cue(id, 'وتنبيه خاص')} text="غدر وتجسس نهى عنه الإسلام" />
      <Pop at={cue(id, 'وتجسس')} x={540} y={830} s={1.3}><P.Binoculars /></Pop>
      <Cross at={cue(id, 'نهى')} x={540} y={830} s={2.6} />
      <Label x={540} y={1120} text="«ولا تجسّسوا»" size={84} at={cue(id, 'ولا تجسّسوا')} />
    </g>],
    [cue(id, 'المفيد'), <g>
      <Header chip={chip14} title="انتبه لمن يكثر الأسئلة" />
      <Person x={800} y={FLOOR} s={0.75} head="hair" top={C.sky} face={-1} pose="hold" expr={[[0, 'neutral'], [cue(id, 'أسرار'), 'worried']]} seed={4}
        hand={<g transform="translate(-55 70) scale(0.55)"><P.Briefcase label="سري" /></g>} />
      <Person x={270} y={FLOOR} s={0.75} head="curly" top={C.orange} pose="point" expr="smug" seed={7} />
      {[0, 1, 2].map((i) => <Pop key={i} at={cue(id, 'يكثر') + i * 6} x={330 + i * 120} y={520 + (i % 2) * 70} s={0.45}><P.Question /></Pop>)}
      <Label x={800} y={560} text="أسرار عملك" size={52} at={cue(id, 'أسرار')} />
    </g>],
    [cue(id, 'واجمع'), <g>
      <Header chip={chip14} title="اجمع المعلومات بطرق مشروعة" />
      <Row at={cue(id, 'سؤال صريح')} y={500} icon={<P.Question />} text="سؤال صريح" mark="tick" />
      <Row at={cue(id, 'بحث معلن')} y={700} icon={<P.Magnifier />} text="بحث معلن" mark="tick" />
      <Row at={cue(id, 'بحث معلن', 1, 0.6)} y={900} icon={<P.Binoculars />} text="تجسس وتظاهر بالصداقة" mark="cross" />
      <Narrator x={540} y={FLOOR + 40} s={0.45} pose="present" expr="happy" />
    </g>],
  ]} />;
};

/** The Kaaba, simply: a black cube with a gold band and door, on a pale court (bottom centre). */
const Kaaba: React.FC = () => <g>
  <ellipse cx={0} cy={0} rx={300} ry={34} fill={C.shade} />
  <rect x={-150} y={-300} width={300} height={300} fill={C.black} stroke={INK} strokeWidth={W} />
  <rect x={-150} y={-250} width={300} height={34} fill={C.gold} stroke={INK} strokeWidth={4} />
  <rect x={40} y={-150} width={60} height={110} rx={6} fill={C.gold} stroke={INK} strokeWidth={4} />
</g>;

const chip15 = 'القانون 15';
export const C06: React.FC = () => {
  const id = 'c06';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={15} lines={['اسحق عدوك تمامًا']} at={start(id)} />],
    [cue(id, 'وتنبيه خاص'), <g>
      <Alert at={cue(id, 'وتنبيه خاص')} text="هذا تجاوز وظلم" />
      <Pop at={cue(id, 'فالعدل')} x={540} y={860} s={0.9}><P.Scale tip={0} left={<Mini x={0} y={40} s={0.9} c={C.green} />} right={<Mini x={0} y={40} s={0.9} c={C.red} />} /></Pop>
      <Label x={540} y={1180} text="العدل واجب حتى مع الخصم" size={56} at={cue(id, 'واجب')} />
    </g>],
    [cue(id, 'ويوم'), <g>
      <Header chip="من السيرة" title="يوم فتح مكة" />
      <Pop at={cue(id, 'فتح مكة')} x={540} y={1120}><Kaaba /></Pop>
      <Label x={540} y={520} text="عفو" size={130} at={cue(id, 'عفا')} />
      <Pop at={cue(id, 'عفا', 1, 0.3)} x={540} y={680} s={0.8}><P.Heart /></Pop>
      <Label x={540} y={1240} text="عن أعداء الأمس" size={52} tone="ink" at={cue(id, 'أعداءه')} />
    </g>],
    [cue(id, 'الحكمة'), <g>
      <Header chip={chip15} title="احسم الخلاف… واترك باب الصلح" />
      <Pop at={cue(id, 'مكتوب')} x={780} y={700} s={0.9}><Q.Contract sign={cue(id, 'مكتوب')} title="اتفاق" /></Pop>
      <Label x={780} y={960} text="اتفاق مكتوب" size={52} at={cue(id, 'مكتوب')} />
      <Pop at={cue(id, 'باب الصلح')} x={300} y={940}><P.Door open={1} /></Pop>
      <Label x={300} y={1060} text="باب الصلح مفتوح" size={46} at={cue(id, 'مفتوحًا')} />
    </g>],
  ]} />;
};

export const C07: React.FC = () => {
  const id = 'c07';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip="الخلاصة" title="خذ من القوانين الخمسة" />
      <Row at={cue(id, 'الإتقان')} y={440} icon={<Q.Bulb />} text="الإتقان مع مشاركة المعرفة" mark="tick" />
      <Row at={cue(id, 'والتمهّل')} y={612} icon={<P.Clock r={60} />} text="التمهّل أمام الكرم المفاجئ" mark="tick" />
      <Row at={cue(id, 'وبيان')} y={784} icon={<g transform="scale(0.6)"><P.Handshake /></g>} text="بيان المصلحة المشتركة" mark="tick" />
      <Row at={cue(id, 'والحذر')} y={956} icon={<P.Eye />} text="الحذر ممن يتجسس" mark="tick" />
      <Row at={cue(id, 'والحسم')} y={1128} icon={<P.Shield />} text="الحسم مع العدل" mark="tick" />
    </g>],
    [cue(id, 'وفي الجزء'), <g>
      <Label x={540} y={340} text="الجزء القادم" size={100} at={cue(id, 'وفي الجزء')} />
      <Label x={540} y={470} text="من القانون 16" size={60} tone="ink" at={cue(id, 'السادس')} />
      <Grid48 at={cue(id, 'وفي الجزء')} lit={cue(id, 'وفي الجزء')} from={11} to={15} y={680} />
      <Pop at={cue(id, 'السادس')} x={980 - 3 * 80} y={760}><rect x={-38} y={-38} width={76} height={76} rx={14} fill="#fff" stroke={C.accent} strokeWidth={8} /><text y={3} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={36} fill={C.accent}>16</text></Pop>
    </g>],
    [cue(id, 'أي هذه'), <g>
      <Header title="اكتبه في التعليقات" />
      <Pop at={cue(id, 'أي هذه')} x={540} y={520}><Bubble w={900} h={170} tail={[260, 150]}><T size={52}>أي قانون رأيته في حياتك؟</T></Bubble></Pop>
      {[11, 12, 13, 14, 15].map((n, i) => <Pop key={n} at={cue(id, 'القوانين رأيته') + i * 4} x={880 - i * 170} y={790}>
        <circle r={66} fill={n === 13 ? C.accent : C.red} stroke={INK} strokeWidth={W} />
        <text y={4} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={60} fill="#fff">{n}</text>
      </Pop>)}
      <Pop at={cue(id, 'التعليقات')} x={540} y={1000} s={0.8}><P.Question /></Pop>
      <Narrator x={780} y={FLOOR + 40} s={0.5} face={-1} pose="wave" expr="happy" />
    </g>],
  ]} />;
};

