import React from 'react';
import { Bubble, C, Cross, INK, Label, Move, Pop, Seq, T, Tick, W } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { NUM } from '../fonts';
import { Alert, FLOOR, Grid48, Header, LawCard, Row } from './common';
import { Cards, SIX } from './s1';

// Laws 30–32, the summary and the teaser for part seven (chunks c05–c08).

const chip30 = 'القانون 30';
export const C05: React.FC = () => {
  const id = 'c05';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={30} lines={['اجعل إنجازاتك تبدو بلا جهد']} at={start(id)} />],
    [cue(id, 'الإتقان'), <g>
      <Header chip={chip30} title="الإتقان والهدوء جميلان" />
      <Person x={700} y={FLOOR} s={0.78} head="hair" top={C.teal} face={-1} pose="hold" expr="happy" seed={5}
        hand={<g transform="translate(-55 40) scale(0.5)"><P.Trophy /></g>} />
      <Tick at={cue(id, 'جميلان')} x={320} y={760} s={2.2} />
    </g>],
    [cue(id, 'لكن إخفاء'), <g>
      <Header chip={chip30} title="إخفاء التعب كله… صورة غير حقيقية" />
      <Pop at={cue(id, 'إخفاء')} x={700} y={1000} s={1.1}><P.Stairs /></Pop>
      <Pop at={cue(id, 'إخفاء')} x={790} y={850} s={0.6}><P.Trophy /></Pop>
      <Label x={700} y={560} text="صورة غير حقيقية" size={56} tone="red" at={cue(id, 'صورة')} />
      <Mini x={250} y={FLOOR} s={2} c={C.orange} sad />
      <Label x={250} y={880} text="يُحبط المتعلم" size={46} tone="red" at={cue(id, 'ويحبط')} />
    </g>],
    [cue(id, 'لا بأس'), <g>
      <Header chip={chip30} title="اعرض رحلتك بصدق" />
      <Pop at={cue(id, 'لا بأس')} x={600} y={1100} s={1.4}><P.Stairs /></Pop>
      <Move a={cue(id, 'جهد طويل')} b={cue(id, 'جهد طويل') + 60} x1={330} y1={1160} x2={820} y2={960}>
        <Mini x={0} y={0} s={1.6} c={C.teal} />
      </Move>
      <Label x={540} y={560} text="القصة الصادقة تُلهم" size={70} at={cue(id, 'تُلهم')} />
    </g>],
  ]} />;
};

const chip31 = 'القانون 31';
export const C06: React.FC = () => {
  const id = 'c06';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={31} lines={['تحكّم في الخيارات', 'واجعل الآخرين يلعبون بأوراقك']} at={start(id)} />],
    [cue(id, 'وتنبيه خاص'), <g>
      <Alert at={cue(id, 'وتنبيه خاص')} text="إخفاء الخيار الثالث تلاعب" />
      <Pop at={cue(id, 'تشتري')} x={540} y={680}><Bubble w={620} h={130} tail={[0, 110]}><T size={46}>«تشتري اليوم أم غدًا؟»</T></Bubble></Pop>
      <Pop at={cue(id, 'تشتري')} x={540} y={960} s={0.9}><Cards labels={['اليوم', 'غدًا', '']} hiddenLast /></Pop>
      <Pop at={cue(id, 'عدم الشراء')} x={540} y={960} s={0.9}><g transform="translate(-260 0)"><rect x={-105} y={-140} width={210} height={280} rx={22} fill={C.cream} stroke={C.red} strokeWidth={8} /><T size={36}>لا أشتري</T></g></Pop>
      <Label x={540} y={1210} text="الخيار المخفي" size={50} tone="red" at={cue(id, 'عدم الشراء')} />
    </g>],
    [cue(id, 'فالخيارات'), <g>
      <Header chip={chip31} title="الخيارات أكثر مما يُعرض عليك" />
      {[0, 1, 2, 3, 4].map((i) => <Pop key={i} at={cue(id, 'أكثر') + i * 5} x={540} y={900} r={(2 - i) * -14}>
        <g transform={`translate(0 0) rotate(${(2 - i) * -14} 0 300)`}><rect x={-90} y={-130} width={180} height={260} rx={20} fill={['#fff', C.cream, C.sky, C.cream, '#fff'][i]} stroke={INK} strokeWidth={W} /></g>
      </Pop>)}
      <Narrator x={860} y={FLOOR + 40} s={0.5} face={-1} pose="present" expr="happy" />
    </g>],
  ]} />;
};

const chip32 = 'القانون 32';
export const C07: React.FC = () => {
  const id = 'c07';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={32} lines={['العب على أوهام الناس']} at={start(id)} />],
    [cue(id, 'وتنبيه خاص'), <g>
      <Alert at={cue(id, 'وتنبيه خاص')} text="بيع الأوهام كذب" />
      <Pop at={cue(id, 'الثراء')} x={760} y={780} s={0.8}><P.Phone><T y={-60} size={56} color={C.green}>ثراء</T><T y={20} size={56} color={C.green}>سريع!</T></P.Phone></Pop>
      <Cross at={cue(id, 'الثراء', 1, 0.4)} x={760} y={780} s={2.4} />
      <Pop at={cue(id, 'المضمونة')} x={320} y={780} s={0.8}><P.Phone><T y={-60} size={52} color={C.green}>نتائج</T><T y={20} size={52} color={C.green}>مضمونة</T></P.Phone></Pop>
      <Cross at={cue(id, 'المضمونة', 1, 0.4)} x={320} y={780} s={2.4} />
    </g>],
    [cue(id, 'احذر'), <g>
      <Header chip={chip32} title="وعود أجمل من أن تكون حقيقية" />
      <Pop at={cue(id, 'الأجمل')} x={760} y={700}><Q.Fireworks /></Pop>
      <Cross at={cue(id, 'حقيقية')} x={760} y={640} s={2.4} />
      <Pop at={cue(id, 'أملًا')} x={300} y={700}><Q.Bulb /></Pop>
      <Label x={300} y={900} text="أمل صادق" size={64} at={cue(id, 'صادقًا')} />
      <Label x={760} y={900} text="وهم" size={64} tone="red" at={cue(id, 'وهمًا')} />
    </g>],
  ]} />;
};

export const C08: React.FC = () => {
  const id = 'c08';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip="الخلاصة" title="خذ من القوانين الستة" />
      <Row at={cue(id, 'التثبّت')} y={SIX[0]} icon={<P.Magnifier />} text="التثبّت قبل الاتباع" mark="tick" />
      <Row at={cue(id, 'والجرأة')} y={SIX[1]} icon={<P.Rocket />} text="الجرأة المدروسة" mark="tick" />
      <Row at={cue(id, 'والتخطيط')} y={SIX[2]} icon={<P.MapIcon />} text="التخطيط حتى النهاية" mark="tick" />
      <Row at={cue(id, 'والصدق')} y={SIX[3]} icon={<g transform="scale(0.6)"><P.Trophy /></g>} text="الصدق في عرض الجهد" mark="tick" />
      <Row at={cue(id, 'ومعرفة')} y={SIX[4]} icon={<g transform="scale(0.35)"><Cards labels={['أ', 'ب']} gap={240} /></g>} text="معرفة خياراتك" mark="tick" />
      <Row at={cue(id, 'والحذر')} y={SIX[5]} icon={<g transform="scale(0.8)"><P.Cloud /></g>} text="الحذر من الوعود البراقة" mark="tick" />
    </g>],
    [cue(id, 'وفي الجزء'), <g>
      <Label x={540} y={340} text="الجزء القادم" size={100} at={cue(id, 'وفي الجزء')} />
      <Label x={540} y={470} text="من القانون 33" size={60} tone="ink" at={cue(id, 'الثالث')} />
      <Grid48 at={cue(id, 'وفي الجزء')} lit={cue(id, 'وفي الجزء')} from={27} to={32} y={680} />
      <Pop at={cue(id, 'الثالث')} x={980 - 8 * 80} y={840}><rect x={-38} y={-38} width={76} height={76} rx={14} fill="#fff" stroke={C.accent} strokeWidth={8} /><text y={3} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={36} fill={C.accent}>33</text></Pop>
    </g>],
    [cue(id, 'أي هذه'), <g>
      <Header title="اكتبه في التعليقات" />
      <Pop at={cue(id, 'أي هذه')} x={540} y={520}><Bubble w={900} h={170} tail={[260, 150]}><T size={52}>أي هذه القوانين أخطر؟</T></Bubble></Pop>
      {[27, 28, 29, 30, 31, 32].map((n, i) => <Pop key={n} at={cue(id, 'أخطر') + i * 4} x={940 - i * 160} y={790}>
        <circle r={62} fill={n === 27 || n === 31 || n === 32 ? C.red : C.accent} stroke={INK} strokeWidth={W} />
        <text y={4} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={56} fill="#fff">{n}</text>
      </Pop>)}
      <Pop at={cue(id, 'التعليقات')} x={540} y={1000} s={0.8}><P.Question /></Pop>
      <Narrator x={780} y={FLOOR + 40} s={0.5} face={-1} pose="wave" expr="happy" />
    </g>],
  ]} />;
};
