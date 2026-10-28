import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, INK, Label, Pop, Seq, Show, T } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import * as Q from '../kit/props2';
import { cue, start, until } from '../film/cue';
import { Alert, Disclaimer, FLOOR, Grid48, Header, LawCard, Row } from './common';

// The hook, the note, and laws 16–17 (chunks c00–c03).

export const C00: React.FC = () => {
  const id = 'c00';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Label x={540} y={360} text="هل غيابك يرفع قيمتك؟" size={90} at={start(id)} />
      <g transform={`translate(540 ${FLOOR})`}><Q.Spotlight h={620} w={220} /></g>
      <Label x={540} y={520} text="وهل الغموض يحميك؟" size={70} tone="red" at={cue(id, 'وهل الغموض')} />
      <Pop at={cue(id, 'الغموض')} x={540} y={1060} s={1.4}><P.Mask /></Pop>
    </g>],
    [cue(id, 'خمسة'), <g>
      <Header chip="الجزء الرابع" title="خمسة قوانين في ريل واحد" />
      <Row at={cue(id, 'الغياب')} y={430} icon={<g transform="translate(0 130) scale(0.9)"><P.Door /></g>} text="الغياب" />
      <Row at={cue(id, 'والغموض')} y={602} icon={<P.Mask />} text="الغموض" />
      <Row at={cue(id, 'والعزلة')} y={774} icon={<g transform="translate(0 80) scale(0.4)"><P.Castle /></g>} text="العزلة" />
      <Row at={cue(id, 'ومعرفة')} y={946} icon={<P.Magnifier />} text="معرفة الناس" />
      <Row at={cue(id, 'والالتزام')} y={1118} icon={<g transform="scale(0.6)"><P.Handshake /></g>} text="الالتزام" />
    </g>],
    [cue(id, 'هذا الجزء'), <g>
      <Label x={540} y={330} text="الجزء الرابع" size={100} at={cue(id, 'هذا الجزء')} />
      <Pop at={cue(id, 'القوانين')} x={540} y={450}><T size={46}>«القوانين الثمانية والأربعون للقوة»</T></Pop>
      <Label x={540} y={530} text="روبرت غرين" size={48} tone="ink" at={cue(id, 'لروبرت')} />
      <Grid48 at={cue(id, 'هذا الجزء')} lit={cue(id, 'الثمانية')} from={16} to={20} y={720} />
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

/** A phone whose feed fills with posts, one every few frames from `at`. */
const Feed: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(6, Math.floor((f - at) / 8) + 1));
  return <P.Phone>{Array.from({ length: n }, (_, i) => <g key={i} transform={`translate(0 ${-150 + i * 60})`}>
    <rect x={-95} y={-24} width={190} height={48} rx={8} fill={[C.sky, C.pink, C.cream][i % 3]} stroke={INK} strokeWidth={3} />
    <path d="M-75 -6 L60 -6 M-75 8 L20 8" stroke={INK} strokeWidth={4} strokeLinecap="round" />
  </g>)}</P.Phone>;
};

const chip16 = 'القانون 16';
export const C02: React.FC = () => {
  const id = 'c02';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={16} lines={['استعمل الغياب', 'لتزيد الاحترام والتقدير']} at={start(id)} />],
    [cue(id, 'الفكرة'), <g>
      <Header chip={chip16} title="ما يكثر يقل تقديره" />
      <Pop at={cue(id, 'ينشر')} x={780} y={720} s={1.1}><Feed at={cue(id, 'ينشر')} /></Pop>
      <Label x={780} y={1060} text="ينشر كل ساعة" size={50} at={cue(id, 'كل ساعة')} />
      {[0, 1, 2].map((i) => <Mini key={i} x={400 - i * 130} y={FLOOR} s={1.7} c={[C.teal, C.pink, C.green][i]} head={i === 1 ? 'hijab' : 'hair'} hc={C.navy} sad={i < 3} />)}
      <Label x={270} y={900} text="يملّه متابعوه" size={56} tone="red" at={cue(id, 'متابعوه')} />
    </g>],
    [cue(id, 'لكن الغياب'), <g>
      <Header chip={chip16} title="الغياب ليس قاعدة مطلقة" />
      <Pop at={cue(id, 'القانون السادس')} x={540} y={470}><rect x={-130} y={-34} width={260} height={68} rx={34} fill={C.accent} stroke={INK} strokeWidth={5} /><T y={4} size={36} color="#fff">القانون 6</T></Pop>
      <Label x={540} y={610} text="«من لا يُرى يُنسى»" size={90} at={cue(id, 'من لا يُرى')} />
      <Person x={540} y={FLOOR} s={0.75} head="curly" top={C.grey} pose="idle" expr="sad" seed={7} />
    </g>],
    [cue(id, 'الحل'), <g>
      <Header chip={chip16} title="الحل: التوازن" />
      <Pop at={cue(id, 'التوازن')} x={540} y={760} s={1.1}><P.Scale tip={0} left={<g transform="translate(0 0) scale(0.45)"><P.Door /></g>} right={<g transform="translate(0 -40) scale(0.5)"><Q.Bulb /></g>} /></Pop>
      <Label x={780} y={1060} text="حضور بقيمة" size={56} at={cue(id, 'حضور')} />
      <Label x={300} y={1060} text="غياب لا يقطع رحمًا" size={46} at={cue(id, 'وغياب')} />
      <Pop at={cue(id, 'رحمًا')} x={300} y={1180} s={0.6}><P.Heart /></Pop>
    </g>],
  ]} />;
};

const chip17 = 'القانون 17';
export const C03: React.FC = () => {
  const id = 'c03';
  return <Seq end={until(id)} beats={[
    [start(id), <LawCard num={17} lines={['أبقِ الآخرين في رعب معلّق', 'وكن غير متوقَّع']} at={start(id)} />],
    [cue(id, 'وتنبيه خاص'), <g>
      <Alert at={cue(id, 'وتنبيه خاص')} text="تخويف الناس ظلم" />
      <Person x={800} y={FLOOR} s={0.75} head="bald" outfit="suit" top={C.navy} face={-1} pose="point" expr="angry" seed={2} />
      <Pop at={cue(id, 'المتقلّب')} x={800} y={700} s={0.8}><P.Cloud storm /></Pop>
      {[0, 1, 2].map((i) => <Mini key={i} x={420 - i * 140} y={FLOOR} s={1.7} c={[C.teal, C.pink, C.orange][i]} head={i === 1 ? 'hijab' : 'hair'} hc={C.navy} sad />)}
      <Label x={280} y={880} text="فريق خائف" size={60} tone="red" at={cue(id, 'خائفًا')} />
      <Label x={280} y={980} text="لا مبدع" size={50} tone="ink" at={cue(id, 'مبدعًا')} />
    </g>],
    [cue(id, 'ما يصحّ'), <g>
      <Header chip={chip17} title="ما يصحّ: مرونة في التفاوض" />
      <Narrator x={820} y={FLOOR} s={0.72} face={-1} pose="present" expr="smug" />
      <Person x={260} y={FLOOR} s={0.72} head="bald" outfit="suit" top={C.navy} pose="think" expr="think" seed={2} />
      <Pop at={cue(id, 'التفاوض')} x={540} y={FLOOR} s={0.9}><P.Table w={240} /></Pop>
      <Label x={540} y={560} text="مرونة" size={90} at={cue(id, 'بمرونتك')} />
    </g>],
    [cue(id, 'كن ثابتًا'), <g>
      <Header chip={chip17} title="ثابت في مبادئك… مرن في وسائلك" />
      <Row at={cue(id, 'مبادئك')} y={460} icon={<P.Shield />} text="ثابت في مبادئك" mark="tick" />
      <Row at={cue(id, 'ومرنًا')} y={640} icon={<P.MapIcon />} text="مرن في وسائلك" mark="tick" />
      <Row at={cue(id, 'فالغموض')} y={820} icon={<P.Mask />} text="غموض في الخطة" mark="tick" markAt={cue(id, 'مقبول')} />
      <Row at={cue(id, 'التخويف')} y={1000} icon={<P.Bang />} text="التخويف" mark="cross" />
    </g>],
  ]} />;
};

