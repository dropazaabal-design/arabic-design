import React from 'react';
import { Arrow, C, Cross, INK, Label, Move, Pop, Seq, Show, T, W } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { Alert, Disclaimer, FLOOR, Grid48, Header, LawCard, Row } from './common';

// The hook, the note, and laws 27–29 (chunks c00–c04).

/** The six-row list the hook and the summary use (y from 400, 166 apart). */
export const SIX = [400, 566, 732, 898, 1064, 1230];

/** centred — option cards; `hidden` turns the last card face down until `reveal`. */
export const Cards: React.FC<{ labels: string[]; gap?: number; hiddenLast?: boolean }> = ({ labels, gap = 260, hiddenLast }) => <g>
  {labels.map((l, i) => {
    const x = ((labels.length - 1) / 2 - i) * gap;   // first card on the right
    const down = hiddenLast && i === labels.length - 1;
    return <g key={i} transform={`translate(${x} 0)`}>
      <rect x={-105} y={-140} width={210} height={280} rx={22} fill={down ? C.navy : '#fff'} stroke={INK} strokeWidth={W} />
      {down ? <path d="M-70 -100 L70 100 M70 -100 L-70 100" stroke={C.blue} strokeWidth={8} /> : <T size={l.length > 6 ? 36 : 46}>{l}</T>}
    </g>;
  })}
</g>;

export const C00: React.FC = () => {
  const id = 'c00';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Label x={540} y={330} text="لماذا يتبع الناس" size={90} at={start(id)} />
      <Label x={540} y={440} text="من يبيعهم الوهم؟" size={90} tone="red" at={cue(id, 'يبيعهم')} />
      <Person x={820} y={FLOOR} s={0.75} head="bald" outfit="suit" top={C.purple} face={-1} pose="pointUp" expr="smug" seed={2} />
      <Pop at={cue(id, 'الوهم')} x={820} y={600} s={0.7}><P.Cloud /></Pop>
      {[0, 1, 2].map((i) => <Move key={i} a={cue(id, 'يتبع')} b={cue(id, 'يتبع') + 40} x1={60 - i * 120} y1={FLOOR} x2={520 - i * 130} y2={FLOOR}>
        <Mini x={0} y={0} s={1.7} c={[C.teal, C.pink, C.green][i]} head={i === 1 ? 'hijab' : 'hair'} hc={C.navy} />
      </Move>)}
    </g>],
    [cue(id, 'ستة'), <g>
      <Header chip="الجزء السادس" title="ستة قوانين في ريل واحد" />
      <Row at={cue(id, 'صناعة')} y={SIX[0]} icon={<g><Mini x={-30} y={70} s={1} c={C.pink} /><Mini x={30} y={70} s={1} c={C.teal} /></g>} text="صناعة الأتباع" />
      <Row at={cue(id, 'والجرأة')} y={SIX[1]} icon={<P.Rocket />} text="الجرأة" />
      <Row at={cue(id, 'والتخطيط')} y={SIX[2]} icon={<P.MapIcon />} text="التخطيط" />
      <Row at={cue(id, 'والإتقان')} y={SIX[3]} icon={<g transform="scale(0.6)"><P.Trophy /></g>} text="الإتقان الخفي" />
      <Row at={cue(id, 'والتحكم')} y={SIX[4]} icon={<g transform="scale(0.35)"><Cards labels={['أ', 'ب']} gap={240} /></g>} text="التحكم في الخيارات" />
      <Row at={cue(id, 'والأوهام')} y={SIX[5]} icon={<g transform="scale(0.8)"><P.Cloud /></g>} text="الأوهام" />
    </g>],
    [cue(id, 'هذا الجزء'), <g>
      <Label x={540} y={330} text="الجزء السادس" size={100} at={cue(id, 'هذا الجزء')} />
      <Pop at={cue(id, 'القوانين')} x={540} y={450}><T size={46}>«القوانين الثمانية والأربعون للقوة»</T></Pop>
      <Label x={540} y={530} text="روبرت غرين" size={48} tone="ink" at={cue(id, 'لروبرت')} />
      <Grid48 at={cue(id, 'هذا الجزء')} lit={cue(id, 'الثمانية')} from={27} to={32} y={720} />
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

const chip27 = 'القانون 27';
export const C02: React.FC = () => {
  const id = 'c02';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={27} lines={['استغل حاجة الناس إلى الإيمان', 'لتصنع أتباعًا']} at={start(id)} />],
    [cue(id, 'وتنبيه خاص'), <g>
      <Alert at={cue(id, 'وتنبيه خاص')} text="من أخطر صور التلاعب" />
      <Pop at={cue(id, 'يستغل')} x={800} y={FLOOR} s={0.9}><P.Box w={220} h={110} c={C.wood} /></Pop>
      <Show from={cue(id, 'يستغل')}><Person x={800} y={FLOOR - 110} s={0.6} head="bald" outfit="suit" top={C.purple} face={-1} pose="pointUp" expr="smug" seed={2} /></Show>
      {[0, 1, 2].map((i) => <Mini key={i} x={440 - i * 140} y={FLOOR} s={1.6} c={[C.teal, C.pink, C.green][i]} head={i === 1 ? 'hijab' : 'hair'} hc={C.navy} />)}
      <Label x={300} y={760} text="المعنى" size={56} at={cue(id, 'المعنى')} />
      <Label x={300} y={860} text="والأمان" size={56} at={cue(id, 'والأمان')} />
    </g>],
    [cue(id, 'احذر'), <g>
      <Header chip={chip27} title="احذر… وتثبّت" />
      <Row at={cue(id, 'طاعة')} y={480} icon={<P.Eye closed />} text="طاعة عمياء" mark="cross" />
      <Row at={cue(id, 'يقينًا')} y={680} icon={<P.Question />} text="يقين بلا دليل" mark="cross" />
      <Row at={cue(id, 'تثبّت')} y={880} icon={<P.Magnifier />} text="تثبّت واسأل أهل العلم" mark="tick" />
      <Narrator x={540} y={FLOOR + 40} s={0.45} pose="stop" expr="neutral" />
    </g>],
  ]} />;
};

const chip28 = 'القانون 28';
export const C03: React.FC = () => {
  const id = 'c03';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={28} lines={['ادخل الفعل بجرأة']} at={start(id)} />],
    [cue(id, 'التردد'), <g>
      <Header chip={chip28} title="التردد يضيّع الفرص" />
      <Person x={800} y={FLOOR} s={0.72} head="hair" top={C.sky} face={-1} pose="think" expr="worried" seed={4} />
      <Pop at={cue(id, 'سنوات')} x={780} y={520}><P.Calendar top="سنوات" big="؟" /></Pop>
      <Label x={780} y={700} text="بانتظار اللحظة المثالية" size={40} tone="ink" at={cue(id, 'المثالية')} />
      <Pop at={cue(id, 'الواثقة')} x={300} y={760}><P.Rocket /></Pop>
      <Label x={300} y={980} text="خطوة واثقة" size={56} at={cue(id, 'الواثقة')} />
    </g>],
    [cue(id, 'لكن الجرأة'), <g>
      <Header chip={chip28} title="جرأة… لا تهوّر" />
      {([['تهورًا', 760, 'تهوّر'], ['وقاحة', 320, 'وقاحة']] as const).map(([w, x, l]) => <g key={w}>
        <Label x={x} y={470} text={l} size={60} tone="red" at={cue(id, w)} />
        <Cross at={cue(id, w, 1, 0.2)} x={x} y={470} s={1.8} />
      </g>)}
      <Row at={cue(id, 'ادرس')} y={680} icon={<P.Notebook />} text="ادرس" mark="tick" />
      <Row at={cue(id, 'توكّل')} y={880} icon={<P.Heart />} text="توكّل" mark="tick" />
      <Row at={cue(id, 'أقدم')} y={1080} icon={<P.Rocket />} text="أقدِم" mark="tick" />
    </g>],
  ]} />;
};

const chip29 = 'القانون 29';
export const C04: React.FC = () => {
  const id = 'c04';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={29} lines={['خطّط حتى النهاية']} at={start(id)} />],
    [cue(id, 'مشاريع'), <g>
      <Header chip={chip29} title="بداية بحماس… ثم تعثّر" />
      <Pop at={cue(id, 'بحماس')} x={780} y={760}><P.Rocket /></Pop>
      <Label x={780} y={980} text="حماس" size={64} at={cue(id, 'بحماس')} />
      <Arrow at={cue(id, 'تتعثر')} x1={640} y1={760} x2={440} y2={760} />
      <Pop at={cue(id, 'تتعثر')} x={300} y={760}><P.Bang /></Pop>
      <Label x={300} y={980} text="تعثّر" size={64} tone="red" at={cue(id, 'تتعثر')} />
      <Label x={540} y={1180} text="لم يفكروا في النهاية" size={50} tone="ink" at={cue(id, 'نهايتها')} />
    </g>],
    [cue(id, 'اسأل'), <g>
      <Header chip={chip29} title="اسأل قبل أن تبدأ" />
      <Row at={cue(id, 'الكلفة')} y={480} icon={<P.Coins n={3} />} text="ما الكلفة؟" />
      <Row at={cue(id, 'المخاطر')} y={680} icon={<g transform="scale(0.55)"><Q.Warning /></g>} text="ما المخاطر؟" />
      <Row at={cue(id, 'أتوقف')} y={880} icon={<g transform="translate(-20 90) scale(0.6)"><P.Flag /></g>} text="متى أتوقف؟" />
      <Label x={540} y={1110} text="هنا نتفق مع غرين" size={70} at={cue(id, 'نتفق')} />
    </g>],
  ]} />;
};

