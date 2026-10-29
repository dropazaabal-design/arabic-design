import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Arrow, Bubble, C, Cross, INK, Label, Move, Pop, Seq, Show, Sway, T, Tick, W, ease } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import { cue, start, until } from '../film/cue';
import { ChapterCard, PhaseCard, PhaseStrip, Title } from './common';

// Phase three: «كيف ترى» — chapters 9–13 and the close (chunks c11–c16).

export const C11: React.FC = () => {
  const id = 'c11';
  return <Seq end={until(id)} beats={[
    [start(id), <PhaseCard n={2} name="المرحلة الثالثة" q="كيف ترى" at={start(id)} />],
    [cue(id, 'الفصل التاسع'), <ChapterCard num={9} name="اقرأ الإشارات الصغيرة" at={cue(id, 'الفصل التاسع')} />],
    [cue(id, 'قائد إطفاء'), <g>
      <Title text="الإشارة قبل المشكلة" />
      <Person x={1550} y={1010} s={0.8} head="fire" top={C.navy} outfit="suit" pose="point" face={-1} expr="think" />
      <Pop at={cue(id, 'عمود دخان')} x={600} y={950}><P.Smoke /></Pop>
      <Pop at={cue(id, 'عمود دخان')} x={600} y={1000} s={0.9}><g transform="translate(0 -40)"><P.Fire s={0.6} /></g></Pop>
      <Arrow at={cue(id, 'وين تروح')} x1={700} y1={520} x2={300} y2={360} bow={0.2} color={C.red} />
    </g>],
    [cue(id, 'الطير'), <g>
      <Title text="الطير يطير فجأة" />
      <Pop at={cue(id, 'الطير')} x={960} y={1000} s={1.3}><P.Bush /></Pop>
      {[0, 1, 2].map((i) => <g key={i} transform={`translate(${880 + i * 80} ${740 - i * 20})`}><P.Bird fly={cue(id, 'يطير فجأة') + i * 4} dx={i - 1} /></g>)}
      <Show from={cue(id, 'مختبئ')}><g opacity={0.95}><ellipse cx={920} cy={880} rx={12} ry={16} fill={INK} /><ellipse cx={960} cy={880} rx={12} ry={16} fill={INK} /></g></Show>
      <Label x={960} y={330} text="فيه أحد مختبئ" size={64} at={cue(id, 'مختبئ')} />
    </g>],
    [cue(id, 'والصديق'), <g>
      <Title text="هذي رسالة" />
      <Pop at={cue(id, 'والصديق')} x={960} y={560} s={1.1}><P.Chat msgs={[
        { t: 'وينك؟', me: true, time: '9:00', at: cue(id, 'والصديق') },
        { t: 'هلا', time: '9:01', at: cue(id, 'يرد بسرعة') },
        { t: 'نطلع؟', me: true, time: '10:00', at: cue(id, 'صار يرد') },
        { t: 'مشغول', time: '4:30', at: cue(id, 'بعد ساعات') },
      ]} /></Pop>
      <Label x={1500} y={600} text="بعد ساعات…" size={60} at={cue(id, 'بعد ساعات')} />
    </g>],
    [cue(id, 'واللي رجع'), <g>
      <Title text="دافي فجأة … بدون أي حديث" />
      <g transform="translate(700 1000)"><P.Door open={0.5} /></g>
      <Person x={1150} y={1010} s={0.8} head="hair" top={C.pink} face={-1} pose="wave" expr="happy" seed={5} />
      <Label x={700} y={330} text="يختبر الباب" size={64} at={cue(id, 'يختبر')} />
      <Pop at={cue(id, 'بدون أي حديث')} x={1450} y={420}><P.Question size={150} /></Pop>
    </g>],
    [cue(id, 'وإذا ظهرت'), <g>
      <Title text="القروبات الجانبية" />
      <Pop at={cue(id, 'وإذا ظهرت')} x={960} y={600}><Bubble w={420} h={150}><T size={50}>الشلة</T></Bubble></Pop>
      {[0, 1, 2].map((i) => <Move key={i} a={cue(id, 'قروبات') + i * 8} b={cue(id, 'قروبات') + i * 8 + 30} x1={960} y1={600} x2={[480, 1440, 960][i]} y2={[360, 360, 920][i]}><Bubble w={220} h={90}><T size={34}>{['قروب ٢', 'قروب ٣', 'بدونك'][i]}</T></Bubble></Move>)}
      <Label x={960} y={260} text="لا تنتظر 6 شهور" size={56} at={cue(id, 'لا تنتظر')} />
    </g>],
    [cue(id, 'وأول ثقة'), <g>
      <Title text="أول ثقة … بعدها انضباط" />
      <g transform="translate(960 720)"><P.Stairs /></g>
      <Pop at={cue(id, 'وأول ثقة')} x={820} y={620} s={0.7}><P.Heart /></Pop>
      <Label x={820} y={790} text="ثقة" size={56} at={cue(id, 'وأول ثقة')} />
      <Pop at={cue(id, 'انضباط')} x={1080} y={520} s={0.45}><P.RuleBook title="انضباط" /></Pop>
      <Label x={960} y={910} text="بعد الثقة = حرص" size={54} at={cue(id, 'حرص')} />
      <Label x={960} y={1010} text="قبلها = تحكّم" size={54} tone="red" at={cue(id, 'تحكّم')} />
    </g>],
  ]} />;
};

export const C12: React.FC = () => {
  const id = 'c12';
  return <Seq end={until(id)} beats={[
    [start(id), <ChapterCard num={10} name="النقاط العمياء الثلاث" at={start(id)} />],
    [cue(id, 'اعرف أرضك'), <g>
      <Title text="ثلاث أسئلة قبل أي حركة" />
      {([['اعرف أرضك', <P.MapIcon />, 'أرضك'], ['واعرف حدودك', <g transform="scale(0.9)"><P.Mirror /></g>, 'حدودك'], ['واعرف مين', <P.Binoculars />, 'مين قدّامك']] as const).map(([w, n, l], i) => <g key={w}>
        <Pop at={cue(id, w)} x={1450 - i * 490} y={520} s={1.2}>{n}</Pop>
        <Label x={1450 - i * 490} y={800} text={l} size={60} at={cue(id, w, 1, 0.1)} />
      </g>)}
    </g>],
    [cue(id, 'بلوكباستر'), <g>
      <Title text="الممر الضيق" />
      <g transform="translate(960 1000) scale(0.9)"><P.Pass gap={220} /></g>
      <Pop at={cue(id, 'بلوكباستر')} x={960} y={1000} s={0.6}><Person x={0} y={0} head="hair" top={C.blue} outfit="suit" expr="sad" pose="idle" /></Pop>
      <Label x={960} y={480} text="بلوكباستر" size={56} at={cue(id, 'بلوكباستر')} />
      <Label x={960} y={600} text="ماسك بضعف" size={44} tone="red" at={cue(id, 'بضعف')} />
      <Move a={cue(id, 'فجاء')} b={cue(id, 'وأخذه')} x1={1800} y1={1000} x2={1080} y2={1000}><Mini x={0} y={0} s={1.6} c={C.red} /></Move>
      <Label x={1550} y={700} text="نتفليكس" size={56} at={cue(id, 'نتفليكس')} />
    </g>],
    [cue(id, 'لكن مايكروسوفت'), <g>
      <Title text="الممر المحمي: اتركه" />
      <g transform="translate(600 1000) scale(1.3)"><P.Castle c={C.blue} /></g>
      <Label x={600} y={330} text="قوقل" size={64} at={cue(id, 'قوقل')} />
      <Pop at={cue(id, 'بينج')} x={1250} y={1010}><Mini x={0} y={0} s={1.4} c={C.teal} /></Pop>
      <Label x={1250} y={700} text="بينج" size={56} at={cue(id, 'بينج')} />
      <Pop at={cue(id, 'حصتها')} x={1600} y={430}><P.Pie slice={0.03} label="3%" /></Pop>
      <Label x={1250} y={300} text="اتركه" size={70} at={cue(id, 'اتركه')} />
    </g>],
    [cue(id, 'واللي يترك'), <g>
      <Title text="أرض متشابكة: الطلعة سهلة … الرجعة صعبة" />
      {[0, 1, 2, 3].map((i) => <Mini key={i} x={600 + i * 100} y={1000} s={1.4} c={C.green} />)}
      <Pop at={cue(id, 'يرجع')} x={1350} y={1010}><Person x={0} y={0} s={0.7} head="hair" top={C.green} face={-1} expr="worried" pose="shrug" /></Pop>
      <Label x={1350} y={330} text="عشر سنين" size={60} at={cue(id, 'عشر سنين')} />
      <Pop at={cue(id, 'ما عاد يعرفه')} x={760} y={620}><P.Question size={150} /></Pop>
    </g>],
    [cue(id, 'والأرض المفتوحة'), <g>
      <Title text="الأرض المفتوحة لمن يتحرك" />
      <path d="M0 1000 L1920 1000" stroke={INK} strokeWidth={W} />
      <g transform="translate(400 860)"><P.Flag c={C.green} /></g>
      <Move a={cue(id, 'يتحرك')} b={cue(id, 'مو الأكثر')} x1={1300} y1={1000} x2={500} y2={1000}><Person x={0} y={0} s={0.6} head="curly" top={C.orange} face={-1} pose="cheer" expr="happy" /></Move>
      <Person x={1600} y={1010} s={0.6} head="hair" top={C.blue} pose="think" expr="think" face={-1} />
      <Label x={1600} y={480} text="لسا يفكّر…" size={50} at={cue(id, 'مو الأكثر')} />
    </g>],
    [cue(id, 'وفاروس'), <g>
      <Title text="فاروس في الغابة" sub="9 م" />
      <g transform="translate(960 900)"><P.Forest eyes={cue(id, 'الغابة')} /></g>
      {Array.from({ length: 9 }, (_, i) => <Mini key={i} x={600 + (i % 5) * 140} y={1010 + Math.floor(i / 5) * 40} s={1.2} head="roman" c={C.red} sad={false} />)}
      <Label x={960} y={260} text="ما سأل عن الأرض" size={56} tone="red" at={cue(id, 'وما سأل')} />
      <Label x={960} y={360} text="3 فرق" size={64} at={cue(id, 'ثلاث فرق')} />
    </g>],
  ]} />;
};

export const C13: React.FC = () => {
  const id = 'c13';
  return <Seq end={until(id)} beats={[
    [start(id), <ChapterCard num={11} name="كيف يغيّرك الضغط" at={start(id)} />],
    [cue(id, 'الطبع مو ثابت'), <g>
      <Title text="الطبع مو ثابت" />
      <Pop at={cue(id, 'الطبع مو ثابت')} out={cue(id, 'على أرضك') - 10} x={960} y={560}><T size={120}>الطبع مو ثابت</T></Pop>
      <Pop at={cue(id, 'على أرضك')} x={1500} y={900} s={0.6}><P.Sofa /></Pop>
      <Show from={cue(id, 'على أرضك')}><Person x={1500} y={850} s={0.5} head="hair" top={C.orange} pose="shrug" expr="smug" /></Show>
      <Label x={1500} y={430} text="تتراخى" size={56} at={cue(id, 'تتراخى')} />
      <Pop at={cue(id, 'وبعيد')} x={960} y={560} s={0.6}><P.Plane /></Pop>
      <Show from={cue(id, 'وبعيد')}><Mini x={960} y={900} s={1.4} c={C.sky} sad /></Show>
      <Label x={960} y={430} text="تحتاج دعم" size={56} at={cue(id, 'تحتاج')} />
      <Show from={cue(id, 'ومحاصر')}><path d="M300 600 L300 940 L620 940 L620 600" fill="none" stroke={C.stoneDark} strokeWidth={24} /><Person x={460} y={930} s={0.45} head="hair" top={C.red} expr={[[0, 'worried'], [cue(id, 'التزام'), 'angry']]} pose={[[0, 'cross'], [cue(id, 'التزام'), 'cheer']]} /></Show>
      <Label x={460} y={430} text="الخوف ← التزام" size={50} at={cue(id, 'يتحوّل')} />
    </g>],
    [cue(id, 'كورتيس'), <g>
      <Title text="كورتيس" sub="1519" />
      <path d="M0 860 L1920 860" stroke={INK} strokeWidth={W} />
      <g transform="translate(960 880)"><P.Waves w={2200} /></g>
      {[0, 1].map((i) => <g key={i} transform={`translate(${520 + i * 520} 870) scale(0.6)`}><P.Ship sail={false} /></g>)}
      {[0, 1].map((i) => <Pop key={i} at={cue(id, 'دمّر') + i * 8} x={520 + i * 520} y={720}><P.Fire s={1.1} /></Pop>)}
      {Array.from({ length: 5 }, (_, i) => <Mini key={i} x={1450 + i * 90} y={850} s={1.1} c={C.navy} head="roman" />)}
      <Label x={1600} y={420} text="ما فيه رجعة" size={60} at={cue(id, 'ما يرجع')} />
    </g>],
    [cue(id, 'ومن يشتري'), <g>
      <Title text="نسخة صغيرة من الفكرة" />
      <Pop at={cue(id, 'تذكرة')} x={960} y={560} s={1.4}><P.Ticket label="ذهاب فقط" /></Pop>
      <Narrator x={1600} y={1010} pose="present" expr="smug" face={-1} />
    </g>],
    [cue(id, 'وحط عدوين'), <g>
      <Title text="الخطر المشترك يوحّد" />
      <g transform="translate(960 300)"><P.Cloud storm w={1.6} /></g>
      <Sway amp={8} period={60} x={960} y={860}>
        <g transform="translate(960 860)"><P.Boat /></g>
        <Person x={860} y={800} s={0.45} head="hair" top={C.red} pose="hold" expr="worried" />
        <Person x={1060} y={800} s={0.45} head="curly" top={C.blue} pose="hold" face={-1} expr="worried" seed={3} />
      </Sway>
      <g transform="translate(960 900)"><P.Waves w={2200} c={C.waterDark} /></g>
      <Label x={960} y={540} text="يساعدون بعض" size={56} at={cue(id, 'يساعدون')} />
    </g>],
    [cue(id, 'نفس لاعبين'), <g>
      <Title text="قميص المنتخب" />
      <Seq end={until(id)} beats={[
        [cue(id, 'نفس لاعبين'), <g><g transform="translate(1300 800)"><P.Jersey c={C.blue} n="7" /></g><g transform="translate(620 800)"><P.Jersey c={C.red} n="9" /></g><Label x={960} y={500} text="منافسين" size={56} /></g>],
        [cue(id, 'قميص المنتخب'), <g><Pop at={cue(id, 'قميص المنتخب')} x={1300} y={800}><P.Jersey c={C.green} n="7" /></Pop><Pop at={cue(id, 'قميص المنتخب', 1, 0.1)} x={620} y={800}><P.Jersey c={C.green} n="9" /></Pop><Label x={960} y={500} text="فريق واحد" size={64} at={cue(id, 'قميص المنتخب')} /></g>],
      ]} />
    </g>],
  ]} />;
};

const Thermo: React.FC<{ id: string }> = ({ id }) => {
  const f = useCurrentFrame();
  return <g transform="translate(1350 560)"><P.Thermo level={ease(f, cue(id, 'يهدأ'), cue(id, 'يهدأ') + 50, 0.9, 0.2)} /></g>;
};

export const C14: React.FC = () => {
  const id = 'c14';
  return <Seq end={until(id)} beats={[
    [start(id), <ChapterCard num={12} name="تحكّم في غضبك" at={start(id)} />],
    [cue(id, 'النار سلاح'), <g>
      <Title text="النار ما تتحكم فيها بعد ما تشعلها" />
      <Pop at={cue(id, 'النار')} x={1400} y={560} s={1.5}><P.Match /></Pop>
      {[0, 1, 2, 3, 4].map((i) => <Pop key={i} at={cue(id, 'بعد ما تشعله') + i * 6} x={1100 - i * 180} y={900 - (i % 2) * 60} s={0.7 + i * 0.12}><P.Fire /></Pop>)}
    </g>],
    [cue(id, 'الرسالة'), <g>
      <Title text="رسالة وأنت معصّب" />
      <Person x={1500} y={1010} s={0.8} head="hair" top={C.red} pose="hold" face={-1} expr="angry" hand={<g transform="translate(-50 10) scale(0.25)"><P.Phone /></g>} />
      <Pop at={cue(id, 'معصّب')} x={1500} y={430}><P.Steam /></Pop>
      {[0, 1, 2, 3, 4, 5].map((i) => <Move key={i} a={cue(id, 'تسافر') + i * 4} b={cue(id, 'تسافر') + i * 4 + 40} x1={1350} y1={700} x2={300 + (i % 3) * 300} y2={[400, 600, 850][Math.floor(i / 2) % 3]}><g transform="scale(0.5)"><P.Letter /></g></Move>)}
    </g>],
    [cue(id, 'وجهّز ردّك'), <g>
      <Title text="جهّز ردّك قبل العشاء" />
      <g transform="translate(960 1000) scale(1.6 1)"><P.Table w={500} /></g>
      <Person x={1450} y={1010} s={0.75} head="hijab" hairColor={C.purple} outfit="dress" top={C.purple} face={-1} pose="point" expr="smug" seed={6} />
      <Pop at={cue(id, 'أمك')} x={1250} y={330}><Bubble w={420} h={120} tail={[150, 100]}><T size={46}>وش ذا القرار؟</T></Bubble></Pop>
      <Narrator x={450} y={1010} s={0.8} pose="hold" expr="happy" />
      <Pop at={cue(id, 'وجهّز ردّك')} x={720} y={560} s={0.8}><rect x={-120} y={-70} width={240} height={140} rx={10} fill={C.cream} stroke={INK} strokeWidth={W} /><T size={40}>رد جاهز ✓</T></Pop>
    </g>],
    [cue(id, 'واسأل'), <g>
      <Title text="قطيعة … أو بس مسافة؟" />
      <Pop at={cue(id, 'قطيعة')} x={1350} y={560}><P.Scissors /></Pop>
      <Label x={1350} y={760} text="قطيعة" size={64} tone="red" at={cue(id, 'قطيعة')} />
      <Pop at={cue(id, 'مسافة')} x={560} y={600}><g><Mini x={-140} y={60} s={1.3} c={C.blue} /><Mini x={140} y={60} s={1.3} c={C.green} /><path d="M-90 -80 L90 -80" stroke={INK} strokeWidth={6} strokeDasharray="10 10" /></g></Pop>
      <Label x={560} y={760} text="مسافة" size={64} at={cue(id, 'مسافة')} />
    </g>],
    [cue(id, 'والغضب'), <g>
      <Title text="الغضب يهدأ … والكسر يبقى" />
      <Thermo id={id} />
      <Show from={cue(id, 'والغضب')}><g transform="translate(560 900)"><P.Vase broken /></g></Show>
      <Label x={560} y={600} text="ما ينصلح" size={60} tone="red" at={cue(id, 'ما يصلحه')} />
    </g>],
  ]} />;
};

export const C15: React.FC = () => {
  const id = 'c15';
  const SRC: Array<[string, React.ReactNode, string]> = [
    ['مصدر محلي', <g transform="translate(0 100) scale(0.45)"><P.House /></g>, 'محلي'],
    ['ومصدر يزور', <g transform="translate(0 90) scale(0.7)"><P.Suitcase /></g>, 'يزور ويرجع'],
    ['ومصدر من داخل', <g transform="translate(0 110) scale(0.3)"><P.Office /></g>, 'من الداخل'],
    ['ومصدر محوَّل', <g transform="scale(0.7)"><P.Badge c={C.blue} /></g>, 'محوَّل'],
    ['ومصدر مضلِّل', <g transform="translate(0 50) scale(0.7)"><P.Briefcase label="سري" /></g>, 'مضلِّل'],
  ];
  return <Seq end={until(id)} beats={[
    [start(id), <ChapterCard num={13} name="اللي ما تعرفه يكلّفك" at={start(id)} />],
    [cue(id, 'الحقيقة'), <g>
      <Title text="خمسة أنواع مصادر" />
      <Label x={960} y={190} text="ناس قريبين" size={50} at={cue(id, 'ناس قريبين')} />
      {SRC.map(([w, n, l], i) => <g key={w}>
        <Pop at={cue(id, w)} x={1640 - i * 330} y={460}><circle r={120} fill={C.paper} stroke={INK} strokeWidth={W} />{n}</Pop>
        <Label x={1640 - i * 330} y={650} text={l} size={46} at={cue(id, w, 1, 0.1)} />
      </g>)}
      <Label x={980} y={800} text="جواسيس ألمانيا قلبهم البريطانيون" size={40} tone="ink" at={cue(id, 'جواسيس')} />
      <Seq end={until(id)} beats={[[cue(id, 'عملية'), <g>
        <Label x={660} y={880} text="عملية اللحم المفروم" size={50} at={cue(id, 'عملية')} />
        <Label x={660} y={980} text="خدعت ألمانيا عن صقلية" size={42} tone="ink" at={cue(id, 'صقلية')} />
      </g>]]} />
    </g>],
    [cue(id, 'وإذا عاقبت'), <g>
      <Title text="لا تعاقب اللي يقول الحقيقة" />
      <Person x={1450} y={1010} s={0.75} head="hair" top={C.green} face={-1} pose="present" expr={[[0, 'happy'], [cue(id, 'وقف'), 'sad']]} />
      <Pop at={cue(id, 'الحقيقة')} x={1150} y={430}><Bubble w={260} h={100} tail={[90, 80]}><T size={40}>الحقيقة…</T></Bubble></Pop>
      <Cross at={cue(id, 'عاقبت')} x={1150} y={430} s={1.6} />
      {[0, 1, 2, 3].map((i) => <g key={i}><Mini x={420 + i * 130} y={1010} s={1.4} c={[C.blue, C.orange, C.purple, C.teal][i]} />
        <Show from={cue(id, 'وقف') + i * 4}><path d={`M${405 + i * 130} 840 L${435 + i * 130} 840`} stroke={C.red} strokeWidth={8} strokeLinecap="round" /></Show></g>)}
      <Label x={620} y={600} text="سكت الجميع" size={56} at={cue(id, 'وقف')} />
    </g>],
    [cue(id, 'واعرف مين'), <g>
      <Title text="مين يسمعون كلامه فعلًا؟" />
      <Person x={1400} y={1010} s={0.8} head="hair" hairColor={C.greyDark} outfit="thobe" pose="hips" expr="smug" face={-1} />
      <Label x={1400} y={300} text="شكله المسؤول" size={50} at={cue(id, 'شكله')} />
      <Person x={560} y={1010} s={0.7} head="hijab" hairColor={C.navy} outfit="dress" top={C.navy} pose="hold" expr="smug" seed={7} />
      {[0, 1, 2].map((i) => <Arrow key={i} at={cue(id, 'يسمعون') + i * 6} x1={900 + i * 60} y1={700 + i * 40} x2={680} y2={640} bow={0.1} w={6} />)}
      <Label x={560} y={330} text="اللي يسمعونه" size={50} at={cue(id, 'فعلًا')} />
    </g>],
  ]} />;
};

export const C16: React.FC = () => {
  const id = 'c16';
  return <Seq end={until(id)} beats={[
    [start(id), <g>
      <Title text="حاصل الكتاب" />
      <Pop at={start(id)} out={cue(id, 'استعد') - 10} x={960} y={850} s={1.2}><P.Book /></Pop>
      <Seq end={until(id)} beats={[
        [cue(id, 'استعد'), <PhaseStrip n={0} at={cue(id, 'استعد')} y={500} />],
        [cue(id, 'وتحرك'), <PhaseStrip n={1} at={cue(id, 'استعد')} y={500} />],
        [cue(id, 'وشوف'), <PhaseStrip n={2} at={cue(id, 'استعد')} y={500} />],
      ]} />
      <Narrator x={1700} y={1010} s={0.7} pose="present" expr="happy" face={-1} />
    </g>],
    [cue(id, 'وإلا'), <g>
      <g transform="translate(960 1000)"><P.Sofa c={C.teal} /></g>
      <Person x={960} y={950} s={0.6} head="hair" top={C.orange} pose="shrug" expr="smug" />
      <Pop at={cue(id, 'عادي')} x={1300} y={420}><Bubble w={460} h={130} tail={[-150, 110]}><T size={54}>عادي، بكره نشوف</T></Bubble></Pop>
      <Pop at={cue(id, 'بكره')} x={600} y={420} s={0.8}><P.Clock r={70} spin={12} /></Pop>
      <Pop at={cue(id, 'بكره', 1, 0.8)} x={600} y={650}><P.Book /></Pop>
    </g>],
  ]} />;
};
