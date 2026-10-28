import React from 'react';
import { Arrow, Bubble, C, Cross, INK, Label, Pop, Seq, Show, T, Tick, W } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { FLOOR, Header, LawCard, Row } from './common';

// Law 2: friends, rivals and clear agreements (chunks k05–k08).

const chip = 'القانون 2';

export const K05: React.FC = () => {
  const id = 'k05';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={2} lines={['لا تضع ثقة مفرطة في الأصدقاء', 'وتعلّم كيف تستفيد من أعدائك']} at={start(id)} />],
    [cue(id, 'غرين يحذّر'), <g>
      <Header chip={chip} title="الصداقة شيء… والكفاءة شيء" />
      <Seq end={until(id)} beats={[
        [cue(id, 'غرين يحذّر'), <g>
          <Pop at={cue(id, 'خلط')} x={540} y={760}><P.Scale tip={-0.5} left={<g transform="translate(0 -50) scale(0.45)"><P.Badge c={C.blue} /></g>} right={<g transform="translate(0 -40) scale(0.4)"><P.Heart /></g>} /></Pop>
          <Label x={710} y={480} text="صداقة" size={52} at={cue(id, 'الصداقة')} />
          <Label x={370} y={480} text="كفاءة" size={52} at={cue(id, 'بالكفاءة')} />
        </g>],
        [cue(id, 'ويرى'), <g>
          <Person x={300} y={FLOOR} s={0.83} head="curly" top={C.red} pose="hold" expr="worried" seed={3} hand={<g transform="translate(-55 30) scale(0.45)"><P.Papers n={6} /></g>} />
          <Pop at={cue(id, 'لإثبات')} x={300} y={680}><P.Steam /></Pop>
          <Label x={300} y={420} text="خصم سابق" size={52} at={cue(id, 'خصمًا')} />
          <Person x={780} y={FLOOR} s={0.83} head="hair" top={C.sky} face={-1} pose={[[0, 'idle'], [cue(id, 'فرصة'), 'present']]} expr="neutral" seed={4} />
          <Label x={780} y={420} text="فرصة" size={56} at={cue(id, 'فرصة')} />
          <Arrow at={cue(id, 'فرصة')} x1={640} y1={760} x2={460} y2={760} />
        </g>],
      ]} />
    </g>],
    [cue(id, 'لكن ذلك احتمال'), <g>
      <Header chip={chip} title="احتمال… لا قاعدة" />
      <Label x={540} y={430} text="احتمال" size={110} at={cue(id, 'احتمال')} />
      <Mini x={780} y={1000} s={2} c={C.green} />
      <Mini x={300} y={1000} s={2} c={C.red} />
      <Pop at={cue(id, 'صديق')} x={780} y={600} s={0.8}><Bubble w={220} h={110} tail={[0, 90]}><T size={48}>خائن؟</T></Bubble></Pop>
      <Cross at={cue(id, 'خائنًا')} x={780} y={600} s={1.6} />
      <Pop at={cue(id, 'خصم جديرًا')} x={300} y={600} s={0.8}><Bubble w={220} h={110} tail={[0, 90]}><T size={48}>جدير؟</T></Bubble></Pop>
      <Cross at={cue(id, 'بالثقة')} x={300} y={600} s={1.6} />
      <Pop at={cue(id, 'وليس قاعدة')} x={540} y={1170}><T size={46}>ليس كل صديق خائنًا… ولا كل خصم جديرًا</T></Pop>
    </g>],
  ]} />;
};

const Friends: React.FC<{ id: string }> = ({ id }) => <g>
  <Person x={200} y={FLOOR} s={0.75} head="hair" top={C.sky} face={1} pose={[[0, 'idle'], [cue(id, 'ثم تختلفان'), 'point']]} expr={[[0, 'happy'], [cue(id, 'ثم تختلفان'), 'angry']]} seed={4} />
  <Person x={880} y={FLOOR} s={0.75} head="curly" top={C.orange} face={-1} pose={[[0, 'idle'], [cue(id, 'ثم تختلفان'), 'point']]} expr={[[0, 'happy'], [cue(id, 'ثم تختلفان'), 'angry']]} seed={7} />
</g>;

export const K06: React.FC = () => {
  const id = 'k06';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip={chip} title="تخيّل…" />
      <Pop at={cue(id, 'مشروعًا')} x={540} y={1290} s={0.62}><P.Shop c={C.teal} sign="مشروعنا" /></Pop>
      <Friends id={id} />
      <Seq end={until(id)} beats={[
        [cue(id, 'تتجاوز'), <g><Pop at={cue(id, 'تتجاوز')} x={540} y={520} s={0.85}><Q.Contract /></Pop><Cross at={cue(id, 'الاتفاق')} x={540} y={520} s={3} /></g>],
        [cue(id, 'نحن نعرف'), <Pop at={cue(id, 'نحن نعرف')} x={540} y={500}><Bubble w={960} h={150} tail={[-300, 130]}><T size={46}>«نحن نعرف بعضنا منذ سنوات»</T></Bubble></Pop>],
      ]} />
    </g>],
    [cue(id, 'ثم تختلفان'), <g>
      <Header chip={chip} title="ثم يأتي الخلاف" />
      <Friends id={id} />
      {([['المال', 760, 'المال', <P.Coins n={4} />], ['المسؤوليات', 540, 'المسؤوليات', <g transform="scale(0.45)"><P.Checklist items={['', '', '']} /></g>], ['الوقت', 320, 'الوقت', <P.Clock r={70} spin={10} />]] as const).map(([w, x, l, n]) => <g key={w}>
        <Pop at={cue(id, w)} x={x} y={470}>{n}</Pop>
        <Label x={x} y={600} text={l} size={44} at={cue(id, w, 1, 0.1)} />
      </g>)}
      <Pop at={cue(id, 'الفوضى')} x={540} y={1290} s={0.62}><P.Shop c={C.teal} closed /></Pop>
      <Pop at={cue(id, 'والصداقة')} x={540} y={820} s={0.9}><P.Heart broken /></Pop>
    </g>],
  ]} />;
};

export const K07: React.FC = () => {
  const id = 'k07';
  const step = (w: string) => cue(id, w);
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip="التطبيق" title="اختر شريكك بوضوح" />
      <Row at={cue(id, 'لأمانته')} y={460} icon={<P.Shield />} text="أمين" mark="tick" />
      <Row at={cue(id, 'وكفاءته')} y={660} icon={<P.Badge c={C.blue} />} text="كفء" mark="tick" />
      <Pop at={cue(id, 'واتفقا')} x={540} y={1000} s={0.75}><Q.Contract sign={cue(id, 'بوضوح')} title="الحقوق والواجبات" /></Pop>
    </g>],
    [cue(id, 'امنح الثقة'), <g>
      <Header chip="التطبيق" title="الثقة بالتدريج" />
      <Label x={540} y={430} text="تدريجيًا" size={90} at={cue(id, 'تدريجيًا')} />
      <g transform="translate(540 850)"><Q.TrustBars at={[step('امنح'), step('الثقة'), step('تدريجيًا'), step('السلوك'), step('والتجربة')]} /></g>
      <Label x={760} y={1060} text="السلوك" size={50} at={cue(id, 'السلوك')} />
      <Label x={320} y={1060} text="التجربة" size={50} at={cue(id, 'والتجربة')} />
    </g>],
    [cue(id, 'وإذا سبق'), <g>
      <Header chip="التطبيق" title="إنصاف… وحدود واضحة" />
      <Person x={200} y={FLOOR} s={0.72} head="hair" top={C.sky} pose={[[0, 'cross'], [cue(id, 'المصالحة'), 'present']]} expr="neutral" seed={4} />
      <Person x={880} y={FLOOR} s={0.72} head="curly" top={C.red} face={-1} pose={[[0, 'cross'], [cue(id, 'المصالحة'), 'present']]} expr={[[0, 'neutral'], [cue(id, 'المصالحة'), 'happy']]} seed={3} />
      <Pop at={cue(id, 'بإنصاف')} x={540} y={560} s={0.8}><P.Scale tip={0} left={<g transform="translate(0 -40) scale(0.35)"><P.Heart /></g>} right={<g transform="translate(0 -40) scale(0.35)"><P.Heart c={C.blue} /></g>} /></Pop>
      <Pop at={cue(id, 'المصالحة')} x={540} y={880} s={0.6}><P.Handshake /></Pop>
      <Show from={cue(id, 'حدود')}><path d={`M540 960 L540 ${FLOOR}`} stroke={C.red} strokeWidth={10} strokeDasharray="22 18" strokeLinecap="round" /></Show>
      <Label x={540} y={1060} text="حدود واضحة" size={50} at={cue(id, 'حدود')} />
    </g>],
  ]} />;
};

export const K08: React.FC = () => {
  const id = 'k08';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Header chip={chip} title="بلا مبالغة" />
      <Row at={cue(id, 'سوء ظن')} y={520} icon={<P.Magnifier />} text="سوء ظن دائم" mark="cross" />
      <Row at={cue(id, 'ولا تصنع')} y={720} icon={<P.Swords />} text="صناعة أعداء لتشعر بالقوة" mark="cross" />
      <Narrator x={540} y={FLOOR + 40} s={0.62} pose="stop" expr="worried" />
    </g>],
    [cue(id, 'الصداقة تستحق'), <g>
      <Header chip={chip} title="الوفاء… والاتفاق يحميه" />
      <Pop at={cue(id, 'الوفاء')} x={700} y={720} s={2}><P.Shield /></Pop>
      <Pop at={cue(id, 'الوفاء', 1, 0.1)} x={700} y={720} s={0.7}><P.Heart /></Pop>
      <Pop at={cue(id, 'والاتفاق')} x={300} y={760} s={0.75}><Q.Contract sign={cue(id, 'الواضح')} /></Pop>
      <Label x={700} y={1070} text="الوفاء" size={60} at={cue(id, 'الوفاء')} />
      <Label x={300} y={1070} text="اتفاق واضح" size={56} at={cue(id, 'الواضح')} />
      <Arrow at={cue(id, 'حمايتها')} x1={420} y1={620} x2={560} y2={620} bow={-0.2} />
    </g>],
  ]} />;
};
