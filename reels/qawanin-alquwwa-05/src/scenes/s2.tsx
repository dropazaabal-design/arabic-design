import React from 'react';
import { Bubble, C, Cross, INK, Label, Pop, Seq, T, Tick, W } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { NUM } from '../fonts';
import { Alert, FLOOR, Grid48, Header, LawCard, Row } from './common';
import { CleanHand, SIX } from './s1';

// Laws 24–26, the summary and the teaser for part six (chunks c05–c08).

const chip24 = 'القانون 24';
export const C05: React.FC = () => {
  const id = 'c05';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={24} lines={['كن رجل البلاط المثالي']} at={start(id)} />],
    [cue(id, 'يقصد غرين'), <g>
      <Header chip={chip24} title="فن التعامل مع أصحاب النفوذ" />
      <Person x={820} y={FLOOR} s={0.75} head="king" hairColor={C.brown} outfit="robe" top={C.blueDark} face={-1} pose="hips" expr="neutral" seed={6} />
      <Person x={260} y={FLOOR} s={0.72} head="hair" outfit="suit" top={C.navy} pose="present" expr="happy" seed={4} />
      <Label x={540} y={480} text="لباقة" size={60} at={cue(id, 'لباقة')} />
      <Label x={540} y={580} text="حسن توقيت" size={56} at={cue(id, 'توقيت')} />
      <Label x={540} y={680} text="كلام محسوب" size={56} at={cue(id, 'محسوب')} />
      <Tick at={cue(id, 'مطلوب')} x={540} y={790} s={1.6} />
    </g>],
    [cue(id, 'أما المداهنة'), <g>
      <Header chip={chip24} title="المداهنة نفاق" />
      <Person x={820} y={FLOOR} s={0.75} head="king" hairColor={C.brown} outfit="robe" top={C.blueDark} face={-1} pose="hips" expr="smug" seed={6} />
      <Person x={260} y={FLOOR} s={0.72} head="hair" outfit="suit" top={C.navy} pose="both" expr="happy" seed={4} />
      <Pop at={cue(id, 'المداهنة')} x={480} y={520}><Bubble w={560} h={140} tail={[-150, 120]}><T size={44}>«أنت عبقري الزمان!»</T></Bubble></Pop>
      <Cross at={cue(id, 'فنفاق')} x={480} y={520} s={2.4} />
      <Label x={540} y={760} text="الصدق مع الاحترام أبقى" size={56} at={cue(id, 'والصدق')} />
    </g>],
  ]} />;
};

const chip25 = 'القانون 25';
export const C06: React.FC = () => {
  const id = 'c06';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={25} lines={['أعِد صناعة نفسك']} at={start(id)} />],
    [cue(id, 'لا تقبل'), <g>
      <Header chip={chip25} title="لا تقبل صورة الناس عنك" />
      <Pop at={cue(id, 'الصورة')} x={780} y={FLOOR} s={1.1}><P.Mirror /></Pop>
      <Person x={330} y={FLOOR} s={0.75} head="hair" top={C.teal} pose={[[0, 'idle'], [cue(id, 'طوّر'), 'cheer']]} expr="happy" seed={5} />
      <Pop at={cue(id, 'مهاراتك')} x={560} y={1150} s={0.9}><Q.Plant at={cue(id, 'مهاراتك')} /></Pop>
      <Label x={540} y={520} text="طوّر مهاراتك وشخصيتك" size={56} at={cue(id, 'طوّر')} />
    </g>],
    [cue(id, 'لكن صناعة'), <g>
      <Header chip={chip25} title="صناعة الذات غير تزييفها" />
      <Row at={cue(id, 'صناعة الذات')} y={520} icon={<g transform="translate(0 120) scale(0.55)"><Q.Plant /></g>} text="تطوير حقيقي" mark="tick" />
      <Row at={cue(id, 'تنتحل')} y={720} icon={<P.Badge c={C.gold} />} text="انتحال خبرة ليست لك" mark="cross" />
      <Row at={cue(id, 'تعرض')} y={920} icon={<g transform="scale(0.35)"><P.Phone /></g>} text="حياة غير حقيقية" mark="cross" />
    </g>],
  ]} />;
};

const chip26 = 'القانون 26';
export const C07: React.FC = () => {
  const id = 'c07';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={26} lines={['أبقِ يديك نظيفتين']} at={start(id)} />],
    [cue(id, 'وتنبيه خاص'), <g>
      <Alert at={cue(id, 'وتنبيه خاص')} text="تحميل غيرك أخطاءك ظلم" />
      <Person x={800} y={FLOOR} s={0.75} head="bald" outfit="suit" top={C.navy} face={-1} pose="point" expr="smug" seed={2} />
      <Pop at={cue(id, 'أخطاءك')} x={820} y={690} s={0.7}><CleanHand /></Pop>
      <Mini x={280} y={FLOOR} s={2.2} c={C.orange} sad />
      <Pop at={cue(id, 'تُحمّل')} x={280} y={880} s={0.6}><P.Bang /></Pop>
      <Label x={420} y={720} text="ظلم صريح" size={80} tone="red" at={cue(id, 'ظلم')} />
    </g>],
    [cue(id, 'القائد'), <g>
      <Header chip={chip26} title="القائد الحقيقي" />
      <Row at={cue(id, 'يعترف')} y={500} icon={<CleanHand />} text="يعترف بخطئه" mark="tick" />
      <Row at={cue(id, 'ويحمي')} y={700} icon={<P.Shield />} text="يحمي فريقه" mark="tick" />
      <Row at={cue(id, 'يرمي')} y={900} icon={<P.Bang />} text="يرمي أخطاءه على غيره" mark="cross" />
      <Label x={540} y={1120} text="يخسر ثقة الجميع" size={60} tone="red" at={cue(id, 'ثقة')} />
    </g>],
  ]} />;
};

export const C08: React.FC = () => {
  const id = 'c08';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip="الخلاصة" title="خذ من القوانين الستة" />
      <Row at={cue(id, 'التواضع')} y={SIX[0]} icon={<P.Heart />} text="التواضع بلا خداع" mark="tick" />
      <Row at={cue(id, 'والمرونة')} y={SIX[1]} icon={<g transform="translate(-20 90) scale(0.6)"><P.Flag c="#fff" /></g>} text="المرونة عند الضعف" mark="tick" />
      <Row at={cue(id, 'وتركيز')} y={SIX[2]} icon={<P.Target />} text="تركيز الجهد" mark="tick" />
      <Row at={cue(id, 'واللباقة')} y={SIX[3]} icon={<P.Crown />} text="اللباقة دون نفاق" mark="tick" />
      <Row at={cue(id, 'وتطوير')} y={SIX[4]} icon={<g transform="translate(0 120) scale(0.55)"><Q.Plant /></g>} text="تطوير نفسك" mark="tick" />
      <Row at={cue(id, 'وتحمّل')} y={SIX[5]} icon={<CleanHand />} text="تحمّل أخطائك" mark="tick" />
    </g>],
    [cue(id, 'وفي الجزء'), <g>
      <Label x={540} y={340} text="الجزء القادم" size={100} at={cue(id, 'وفي الجزء')} />
      <Label x={540} y={470} text="من القانون 27" size={60} tone="ink" at={cue(id, 'السابع')} />
      <Grid48 at={cue(id, 'وفي الجزء')} lit={cue(id, 'وفي الجزء')} from={21} to={26} y={680} />
      <Pop at={cue(id, 'السابع')} x={980 - 2 * 80} y={840}><rect x={-38} y={-38} width={76} height={76} rx={14} fill="#fff" stroke={C.accent} strokeWidth={8} /><text y={3} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={36} fill={C.accent}>27</text></Pop>
    </g>],
    [cue(id, 'أي القوانين'), <g>
      <Header title="اكتبه في التعليقات" />
      <Pop at={cue(id, 'أي القوانين')} x={540} y={520}><Bubble w={900} h={170} tail={[260, 150]}><T size={52}>أي القوانين الستة أعجبك؟</T></Bubble></Pop>
      {[21, 22, 23, 24, 25, 26].map((n, i) => <Pop key={n} at={cue(id, 'الستة أعجبك') + i * 4} x={940 - i * 160} y={790}>
        <circle r={62} fill={n === 21 || n === 26 ? C.red : C.accent} stroke={INK} strokeWidth={W} />
        <text y={4} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={56} fill="#fff">{n}</text>
      </Pop>)}
      <Pop at={cue(id, 'التعليقات')} x={540} y={1000} s={0.8}><P.Question /></Pop>
      <Narrator x={780} y={FLOOR + 40} s={0.5} face={-1} pose="wave" expr="happy" />
    </g>],
  ]} />;
};
