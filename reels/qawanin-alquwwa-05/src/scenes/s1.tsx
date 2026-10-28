import React from 'react';
import { Bubble, C, Cross, INK, Label, Move, Pop, Seq, Show, T, W } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { Alert, Disclaimer, FLOOR, Grid48, Header, LawCard, Row } from './common';

// The hook, the note, and laws 21–23 (chunks c00–c04).

/** centred — an open palm with water drops: clean hands. */
export const CleanHand: React.FC = () => <g>
  <path d="M-50 70 L-50 -20 L-50 -80 Q-50 -96 -36 -96 Q-22 -96 -22 -80 L-22 -30 L-22 -110 Q-22 -126 -8 -126 Q6 -126 6 -110 L6 -30 L6 -100 Q6 -116 20 -116 Q34 -116 34 -100 L34 -20 L34 -60 Q34 -76 48 -76 Q62 -76 62 -60 L62 30 Q62 90 6 100 L-20 100 Q-50 96 -50 70 Z" fill="#fff" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
  {[[-90, -60], [-100, 10], [100, -30]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 18} Q${x + 12} ${y} ${x} ${y + 10} Q${x - 12} ${y} ${x} ${y - 18} Z`} fill={C.water} stroke={INK} strokeWidth={3} />)}
</g>;

/** The six-row list the hook and the summary use (y from 400, 166 apart). */
export const SIX = [400, 566, 732, 898, 1064, 1230];

export const C00: React.FC = () => {
  const id = 'c00';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Label x={540} y={360} text="هل التواضع حيلة أحيانًا؟" size={90} at={start(id)} />
      <Person x={720} y={FLOOR} s={0.8} head="hair" top={C.sky} face={-1} pose="hold" expr="happy" seed={4} />
      <Pop at={cue(id, 'حيلة')} x={380} y={760}><Bubble w={300} h={220} think tail={[180, 170]}><g transform="scale(1.1)"><P.Mask /></g></Bubble></Pop>
    </g>],
    [cue(id, 'ستة'), <g>
      <Header chip="الجزء الخامس" title="ستة قوانين في ريل واحد" />
      <Row at={cue(id, 'التظاهر')} y={SIX[0]} icon={<P.Question />} text="التظاهر بالغفلة" />
      <Row at={cue(id, 'والاستسلام')} y={SIX[1]} icon={<g transform="translate(-20 90) scale(0.6)"><P.Flag c="#fff" /></g>} text="الاستسلام" />
      <Row at={cue(id, 'والتركيز')} y={SIX[2]} icon={<P.Target />} text="التركيز" />
      <Row at={cue(id, 'والبلاط')} y={SIX[3]} icon={<P.Crown />} text="البلاط" />
      <Row at={cue(id, 'وصناعة')} y={SIX[4]} icon={<g transform="translate(0 120) scale(0.55)"><Q.Plant /></g>} text="صناعة الذات" />
      <Row at={cue(id, 'والأيدي')} y={SIX[5]} icon={<CleanHand />} text="الأيدي النظيفة" />
    </g>],
    [cue(id, 'هذا الجزء'), <g>
      <Label x={540} y={330} text="الجزء الخامس" size={100} at={cue(id, 'هذا الجزء')} />
      <Pop at={cue(id, 'القوانين')} x={540} y={450}><T size={46}>«القوانين الثمانية والأربعون للقوة»</T></Pop>
      <Label x={540} y={530} text="روبرت غرين" size={48} tone="ink" at={cue(id, 'لروبرت')} />
      <Grid48 at={cue(id, 'هذا الجزء')} lit={cue(id, 'الثمانية')} from={21} to={26} y={720} />
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

const chip21 = 'القانون 21';
export const C02: React.FC = () => {
  const id = 'c02';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={21} lines={['تظاهر بالغفلة', 'لتوقع بالغافل']} at={start(id)} />],
    [cue(id, 'وتنبيه خاص'), <g>
      <Alert at={cue(id, 'وتنبيه خاص')} text="هذا خداع" />
      <Row at={cue(id, 'التواضع')} y={760} icon={<P.Heart />} text="تواضع بلا استعراض" mark="tick" markAt={cue(id, 'جميل')} />
      <Row at={cue(id, 'التغابي')} y={960} icon={<P.Mask />} text="تغابٍ لاستدراج الناس" mark="cross" markAt={cue(id, 'فمكر')} />
      <Label x={540} y={1180} text="مكر" size={90} tone="red" at={cue(id, 'فمكر')} />
    </g>],
    [cue(id, 'وانتبه'), <g>
      <Header chip={chip21} title="انتبه لمن يتظاهر بالجهل" />
      <Person x={800} y={FLOOR} s={0.75} head="hair" top={C.sky} face={-1} pose="both" expr="happy" seed={4} />
      <Pop at={cue(id, 'تكشف')} x={650} y={600}><Bubble w={380} h={150} tail={[120, 130]}><g transform="scale(0.5)"><P.Papers n={5} /></g></Bubble></Pop>
      <Person x={260} y={FLOOR} s={0.75} head="curly" top={C.orange} pose="idle" expr={[[0, 'surprised'], [cue(id, 'عندك'), 'smug']]} seed={7} />
      <Label x={260} y={760} text="«ما أعرف شيئًا!»" size={44} tone="ink" at={cue(id, 'بالجهل')} />
      <Label x={540} y={440} text="لا تتكلم بكل ما تعرف" size={56} at={cue(id, 'فلا تتكلم')} />
    </g>],
  ]} />;
};

const chip22 = 'القانون 22';
export const C03: React.FC = () => {
  const id = 'c03';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={22} lines={['استعمل تكتيك الاستسلام', 'وحوّل الضعف إلى قوة']} at={start(id)} />],
    [cue(id, 'فيه حكمة'), <g>
      <Header chip={chip22} title="إذا كنت أضعف" />
      <Row at={cue(id, 'فالتراجع')} y={520} icon={<g transform="translate(-20 90) scale(0.6)"><P.Flag c="#fff" /></g>} text="تراجع مؤقت يحفظ ما بقي" mark="tick" />
      <Row at={cue(id, 'خسارة')} y={720} icon={<P.Bang />} text="خسارة كل شيء" mark="cross" />
      <Pop at={cue(id, 'ما بقي')} x={540} y={1020}><P.Shield /></Pop>
      <Pop at={cue(id, 'ما بقي', 1, 0.2)} x={540} y={1020} s={0.5}><P.Coins n={3} /></Pop>
    </g>],
    [cue(id, 'لكن غرين'), <g>
      <Header chip={chip22} title="استسلام يخفي انتقامًا؟" />
      <Pop at={cue(id, 'ستارًا')} x={600} y={1000} s={1.2}><P.Flag c="#fff" /></Pop>
      <Move a={cue(id, 'لانتقام')} b={cue(id, 'لانتقام') + 20} x1={540} y1={980} x2={330} y2={760}><g transform="scale(0.8)"><P.Swords /></g></Move>
      <Cross at={cue(id, 'غدر')} x={330} y={760} s={2.4} />
      <Label x={330} y={560} text="غدر" size={110} tone="red" at={cue(id, 'غدر')} />
    </g>],
    [cue(id, 'تراجع بصدق'), <g>
      <Header chip={chip22} title="تراجع بصدق… وابنِ نفسك" />
      <Pop at={cue(id, 'وابنِ')} x={540} y={1150} s={1.3}><Q.Plant at={cue(id, 'وابنِ')} /></Pop>
      <Label x={540} y={520} text="من جديد" size={100} at={cue(id, 'جديد')} />
    </g>],
  ]} />;
};

const chip23 = 'القانون 23';
export const C04: React.FC = () => {
  const id = 'c04';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={23} lines={['ركّز قواك']} at={start(id)} />],
    [cue(id, 'الجهد'), <g>
      <Header chip={chip23} title="الجهد المشتت يضيع" />
      <g transform="translate(780 820)">{[-60, -25, 15, 50, 85].map((a, i) => <path key={i} d={`M0 0 L${Math.cos(a * Math.PI / 180) * 160} ${-Math.sin(a * Math.PI / 180) * 160}`} stroke={C.greyDark} strokeWidth={8} strokeLinecap="round" strokeDasharray="14 12" />)}</g>
      <Label x={780} y={980} text="مشتت" size={60} tone="red" at={cue(id, 'المشتت')} />
      <Pop at={cue(id, 'منتجًا واحدًا')} x={300} y={760}><P.Target /></Pop>
      <Pop at={cue(id, 'منتجًا واحدًا')} x={300} y={1160} s={0.55}><P.Shop c={C.teal} sign="منتج واحد" /></Pop>
      <Label x={300} y={600} text="مركّز" size={60} at={cue(id, 'يتقن')} />
      <Label x={540} y={1250} text="يتفوق غالبًا" size={50} at={cue(id, 'غالبًا')} />
    </g>],
    [cue(id, 'لكن ركّز'), <g>
      <Header chip={chip23} title="ركّز جهدك… لا مخاطرك" />
      <Row at={cue(id, 'مصدر رزق')} y={520} icon={<P.Coins n={1} />} text="مصدر رزق واحد" mark="cross" markAt={cue(id, 'يوقعك')} />
      <Row at={cue(id, 'فنوّع')} y={720} icon={<P.Coins n={4} />} text="نوّع دخلك" mark="tick" />
      <Row at={cue(id, 'ووحّد')} y={920} icon={<P.Target />} text="وحّد هدفك" mark="tick" />
    </g>],
  ]} />;
};
