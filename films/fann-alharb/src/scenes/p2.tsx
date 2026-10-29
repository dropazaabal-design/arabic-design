import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Arrow, Bubble, C, Cross, INK, Label, Move, Pop, Seq, Show, Sway, T, Tick, W, ease } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';
import * as P from '../kit/props';
import { cue, start, until } from '../film/cue';
import { ChapterCard, PhaseCard, Title } from './common';

// Phase two: «كيف تتحرك» — chapters 4–8 (chunks c06–c10).

export const C06: React.FC = () => {
  const id = 'c06';
  return <Seq end={until(id)} beats={[
    [start(id), <PhaseCard n={1} name="المرحلة الثانية" q="كيف تتحرك" at={start(id)} />],
    [cue(id, 'الفصل الرابع'), <ChapterCard num={4} name="أمّن نفسك قبل الفوز" at={cue(id, 'الفصل الرابع')} />],
    [cue(id, 'الدفاع في يدك'), <g>
      <Title text="الدفاع في يدك … والنصر مو في يدك" />
      <Narrator x={1250} y={1010} pose={[[0, 'hold'], [cue(id, 'والنصر'), 'pointUp']]} face={-1} expr={[[0, 'smug'], [cue(id, 'والنصر'), 'worried']]} />
      <Pop at={cue(id, 'الدفاع')} x={1150} y={760} s={0.9}><P.Shield label="دفاع" /></Pop>
      <Pop at={cue(id, 'والنصر')} x={500} y={330}><P.Cloud w={1.4} /></Pop>
      <Pop at={cue(id, 'والنصر', 1, 0.15)} x={500} y={300} s={0.6}><P.Trophy /></Pop>
      <Label x={500} y={520} text="نصر" size={70} at={cue(id, 'والنصر', 1, 0.2)} />
    </g>],
    [cue(id, 'اللي يسكن'), <g>
      <Title text="كل شي على علاقة وحدة" />
      <Person x={960} y={1010} s={0.65} head="hair" top={C.purple} pose="cheer" expr={[[0, 'happy'], [cue(id, 'علاقة وحدة'), 'worried']]} />
      <Sway amp={6} period={70} x={960} y={640}>
        <path d="M960 640 L960 420" stroke={INK} strokeWidth={10} />
        <Pop at={cue(id, 'يسكن')} x={960} y={420}><P.Box label="بيت جديد" w={220} h={110} /></Pop>
        <Pop at={cue(id, 'ويستقيل')} x={960} y={305} s={0.8}><P.Letter label="" /></Pop>
        <Pop at={cue(id, 'وينتقل')} x={975} y={250} s={0.55}><P.Suitcase /></Pop>
      </Sway>
      <Label x={1350} y={620} text="علاقة وحدة" size={56} at={cue(id, 'علاقة وحدة')} />
      <Arrow at={cue(id, 'علاقة وحدة')} x1={1220} y1={620} x2={990} y2={560} />
      <Label x={560} y={300} text="استقالة" size={48} at={cue(id, 'ويستقيل')} />
      <Label x={560} y={420} text="مدينة ثانية" size={48} at={cue(id, 'وينتقل')} />
    </g>],
    [cue(id, 'والرومان'), <g>
      <Title text="سور هادريان" />
      <g transform="translate(960 1080)"><P.LongWall w={2000} /></g>
      <Pop at={cue(id, 'والرومان')} x={960} y={860} s={0.5}><Person x={0} y={0} head="roman" outfit="armour" top={C.red} pose="hips" expr="smug" /></Pop>
      {[0, 1, 2].map((i) => <Move key={i} a={cue(id, 'صعبة') + i * 10} b={cue(id, 'صعبة') + i * 10 + 20} x1={300 + i * 120} y1={1060} x2={420 + i * 120} y2={1000}><Mini x={0} y={0} s={1} c={C.brown} hc={C.orange} /></Move>)}
      <Label x={960} y={300} text="ما فتح أرض … بس حمى الحدود" size={56} at={cue(id, 'ما فتح')} />
    </g>],
    [cue(id, 'والنصر الحقيقي'), <g>
      <Title text="النصر الحقيقي ما أحد يصفّق له" />
      <Pop at={cue(id, 'والنصر الحقيقي')} x={1300} y={500}><P.Monitor /></Pop>
      <Pop at={cue(id, 'حفلة')} x={620} y={500} s={1.2}><P.Balloons /></Pop>
      <Pop at={cue(id, 'حفلة', 1, 0.2)} x={620} y={1000}><P.Table w={380} c={C.pink} /></Pop>
      <Label x={620} y={330} text="حفلة نوبة قلب ما صارت" size={46} at={cue(id, 'لنوبة')} />
      <Narrator x={1650} y={1010} s={0.8} pose="both" expr="happy" face={-1} />
    </g>],
  ]} />;
};

const BowBeat: React.FC<{ id: string }> = ({ id }) => {
  const f = useCurrentFrame();
  const pull = ease(f, cue(id, 'يتشدّ'), cue(id, 'والقرار'), 0, 1, (t) => t);
  return <g>
    <Title text="القوس: يتشدّ شوي شوي … ثم يفلت" />
    <g transform="translate(1250 560) scale(-1 1)"><P.Bow pull={pull} loose={cue(id, 'الإفلات')} /></g>
    <Pop at={cue(id, 'القوس')} x={300} y={560}><P.Target /></Pop>
    <Label x={1250} y={880} text="يتشدّ" size={60} at={cue(id, 'يتشدّ')} />
    <Label x={700} y={880} text="القرار" size={60} at={cue(id, 'والقرار')} />
  </g>;
};

export const C07: React.FC = () => {
  const id = 'c07';
  const ING: Array<[string, React.ReactNode]> = [['بيض', <P.Egg />], ['ودقيق', <g transform="translate(0 100)"><P.Bag label="دقيق" /></g>], ['وزبدة', <P.Butter />], ['وسكر', <g transform="translate(0 100)"><P.Bag label="سكر" c={C.pink} /></g>], ['وحليب', <g transform="translate(0 115)"><P.Milk /></g>]];
  return <Seq end={until(id)} beats={[
    [start(id), <ChapterCard num={5} name="الطاقة" at={start(id)} />],
    [cue(id, 'خمس مكونات'), <g>
      <Title text="خمس مكونات … مخبز كامل" />
      {ING.map(([w, n], i) => <Pop key={w} at={cue(id, w)} x={1560 - i * 280} y={420} s={0.9}>{n}</Pop>)}
      {([[<P.Cake />, 1460], [<P.Cookie />, 1100], [<P.Pancakes />, 760], [<P.Bread />, 420]] as const).map(([n, x], i) => <Pop key={i} at={cue(id, 'مخبز') + i * 6} x={x} y={820}>{n}</Pop>)}
      <Arrow at={cue(id, 'وطلعت')} x1={960} y1={560} x2={960} y2={700} />
    </g>],
    [cue(id, 'القائد يستخدم'), <g>
      <Title text="إشارات قليلة … جيش كامل" />
      <Pop at={cue(id, 'إشارات')} x={1500} y={420}><P.Drum /></Pop>
      <Pop at={cue(id, 'إشارات', 1, 0.15)} x={1500} y={760}><P.Flag /></Pop>
      {Array.from({ length: 10 }, (_, i) => <Pop key={i} at={cue(id, 'عشرة') + i} x={1050 - (i % 5) * 70} y={420 + Math.floor(i / 5) * 90} s={0.6}><Mini x={0} y={0} head="roman" c={C.red} /></Pop>)}
      {Array.from({ length: 60 }, (_, i) => <Pop key={i} at={cue(id, 'مية ألف') + Math.floor(i / 3)} x={1120 - (i % 15) * 62} y={720 + Math.floor(i / 15) * 70} s={0.42}><Mini x={0} y={0} head="roman" c={C.red} /></Pop>)}
      <Label x={800} y={300} text="10" size={64} at={cue(id, 'عشرة')} />
      <Label x={800} y={1030} text="100,000" size={64} at={cue(id, 'مية ألف')} />
    </g>],
    [cue(id, 'والمهم الصقر'), <g>
      <Title text="الصقر: صبر … وبعدها حسم" />
      <Seq end={until(id)} beats={[
        [cue(id, 'والمهم الصقر'), <g><g transform="translate(1100 560)"><P.Falcon /></g><rect x={950} y={680} width={300} height={24} rx={10} fill={C.brown} stroke={INK} strokeWidth={W} /></g>],
        [cue(id, 'وبعدها حسم'), <Move a={cue(id, 'وبعدها حسم')} b={cue(id, 'وبعدها حسم') + 25} x1={1100} y1={400} x2={700} y2={850}><P.Falcon dive /></Move>],
      ]} />
      <Pop at={cue(id, 'صبر')} x={1500} y={460}><P.Clock r={70} spin={8} /></Pop>
      <Label x={1500} y={620} text="صبر" size={70} at={cue(id, 'صبر')} />
      <Label x={500} y={420} text="حسم" size={80} tone="red" at={cue(id, 'حسم')} />
    </g>],
    [cue(id, 'القوس'), <BowBeat id={id} />],
    [cue(id, 'ناس تشدّ'), <g>
      <Title text="المطلوب الاثنين" />
      <Person x={1350} y={1010} s={0.75} head="hair" top={C.blue} pose="hold" face={-1} expr="worried" />
      <g transform="translate(1180 700) scale(0.5)"><P.Bow pull={1} /></g>
      <Pop at={cue(id, 'وما تفلت')} x={1350} y={430} s={0.8}><P.Cobweb /></Pop>
      <Pop at={cue(id, 'ناس تفلت')} x={560} y={1010}><Person x={0} y={0} s={0.75} head="curly" top={C.orange} pose="shrug" expr="surprised" seed={3} /></Pop>
      <Pop at={cue(id, 'وما شدّت')} x={700} y={1000}><path d="M-60 0 L60 -10" stroke={C.brown} strokeWidth={10} strokeLinecap="round" /></Pop>
      <Label x={960} y={260} text="المطلوب الاثنين" size={80} at={cue(id, 'والمطلوب')} />
    </g>],
  ]} />;
};

const Water: React.FC<{ id: string }> = ({ id }) => {
  const f = useCurrentFrame();
  const a = cue(id, 'كن مثل الماء');
  const k = ease(f, a, a + 70, 0, 1, (t) => t);
  const d = 'M1800 600 C1500 600 1300 600 1200 500 C1100 400 900 400 820 500 C700 650 500 640 120 640';
  return <g>
    <Title text="كن مثل الماء" />
    <path d={d} fill="none" stroke={C.water} strokeWidth={60} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
    {k > 0.99 && <path d={d} fill="none" stroke="#fff" strokeWidth={8} strokeDasharray="0.02 0.04" opacity={0.6} pathLength={1} strokeDashoffset={-f / 300} />}
    <path d="M920 640 L960 540 L1060 520 L1120 600 L1100 700 L980 720 Z" fill={C.stone} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    <Label x={960} y={880} text="ما يخاصم الأرض … يمشي معها" size={56} at={cue(id, 'ما يخاصم')} />
  </g>;
};

export const C08: React.FC = () => {
  const id = 'c08';
  return <Seq end={until(id)} beats={[
    [start(id), <ChapterCard num={6} name="خلّهم يلعبون لعبتك" at={start(id)} />],
    [cue(id, 'اوصل أول'), <g>
      <Title text="ثلاث حركات" />
      {([['اوصل أول', <P.Clock r={80} h={8} m={50} />, 'اوصل أول'], ['واخفِ', <P.Eye closed />, 'اخفِ نواياك'], ['وركّز', <P.Target />, 'ركّز قوتك']] as const).map(([w, n, l], i) => <g key={w}>
        <Pop at={cue(id, w)} x={1450 - i * 490} y={540} s={1.3}>{n}</Pop>
        <Label x={1450 - i * 490} y={790} text={l} size={60} at={cue(id, w, 1, 0.1)} />
      </g>)}
    </g>],
    [cue(id, 'قريبكم'), <g>
      <Title text="الجهد المتفرّق ما يغيّر شي" />
      <Person x={960} y={1010} s={0.75} head="hair" top={C.grey} expr={[[0, 'sad'], [cue(id, 'يتغيّر كل'), 'happy']]} pose={[[0, 'idle'], [cue(id, 'يتغيّر كل'), 'cheer']]} />
      <Seq end={until(id)} beats={[
        [cue(id, 'واحد يتصل'), <g>
          <Pop at={cue(id, 'واحد يتصل')} x={1500} y={460} s={0.5}><P.Phone><T size={40}>الاثنين</T></P.Phone></Pop>
          <Pop at={cue(id, 'وعمّة')} x={420} y={1010}><Mini x={0} y={0} s={1.3} head="hijab" hc={C.purple} c={C.purple} /></Pop>
          <Label x={420} y={720} text="بعد 3 أسابيع" size={46} at={cue(id, 'وعمّة')} />
          <Pop at={cue(id, 'يحوّل فلوس')} x={1500} y={900} s={0.6}><P.MoneyBag /></Pop>
          <Label x={960} y={260} text="وما تغيّر شي" size={60} tone="red" at={cue(id, 'وما تغيّر')} />
        </g>],
        [cue(id, 'لكن لو'), <g>
          <Label x={960} y={260} text="السبت … مع بعض" size={70} at={cue(id, 'السبت')} />
          {[0, 1, 2, 3, 4, 5].map((i) => <Move key={i} a={cue(id, 'مع بعض') + i * 3} b={cue(id, 'مع بعض') + i * 3 + 30} x1={i < 3 ? -100 : 2020} y1={1010} x2={i < 3 ? 520 + i * 110 : 1180 + (i - 3) * 110} y2={1010}>
            <Mini x={0} y={0} s={1.3} c={[C.red, C.green, C.orange, C.purple, C.teal, C.blue][i]} head={i % 2 ? 'hijab' : 'hair'} hc={C.navy} /></Move>)}
        </g>],
      ]} />
    </g>],
    [cue(id, 'ومحل قهوة'), <g>
      <Title text="لا تحارب على نقطة قوته" />
      <g transform="translate(1350 1000) scale(1.25)"><P.Shop c={C.greenDark} sign="ستاربكس" w={420} /></g>
      <Pop at={cue(id, 'ومحل قهوة')} x={520} y={1000} s={0.85}><P.Shop c={C.brown} sign="محمصة" w={300} /></Pop>
      <Pop at={cue(id, 'بالسعر')} x={850} y={420} s={0.9}><g><rect x={-80} y={-40} width={160} height={80} rx={10} fill="#fff" stroke={INK} strokeWidth={W} /><T size={44}>السعر</T></g></Pop>
      <Cross at={cue(id, 'بالسعر', 1, 0.2)} x={850} y={420} s={1.5} />
      <Label x={520} y={360} text="الجودة ★" size={64} at={cue(id, 'بالجودة')} />
      <Label x={1350} y={300} text="ضحّى بالقهوة عشان الحجم" size={46} at={cue(id, 'ضحّى')} />
    </g>],
    [cue(id, 'وبعدها، كن'), <Water id={id} />],
    [cue(id, 'اللي نفع مرة'), <g>
      <Title text="اللي نفع مرة … ما يعني ينفع دائمًا" />
      <g transform="translate(1300 960)"><P.Door open={0.6} /></g>
      <g transform="translate(620 960)"><P.Door c={C.blue} /></g>
      <Pop at={cue(id, 'اللي نفع')} x={1300} y={560}><P.Key /></Pop>
      <Tick at={cue(id, 'مرة')} x={1300} y={420} s={1.4} />
      <Pop at={cue(id, 'ما يعني')} x={620} y={560}><P.Key /></Pop>
      <Cross at={cue(id, 'ينفع دائمًا')} x={620} y={420} s={1.4} />
    </g>],
  ]} />;
};

export const C09: React.FC = () => {
  const id = 'c09';
  return <Seq end={until(id)} beats={[
    [start(id), <ChapterCard num={7} name="تحرّك بلا احتراق" at={start(id)} />],
    [cue(id, 'الطريق المباشر'), <g>
      <Title text="الطريق المباشر مو دائمًا الأسرع" />
      <g transform="translate(960 700)"><P.Roads curve={cue(id, 'الأسرع')} /></g>
      <Label x={960} y={930} text="مباشر … وعقبات" size={50} at={cue(id, 'المباشر')} />
      <Label x={960} y={320} text="غير مباشر" size={56} at={cue(id, 'الأسرع')} />
    </g>],
    [cue(id, 'اللي ترك'), <g>
      <Title text="شافوه مجنون" />
      <g transform="translate(1500 1010)"><P.Office /></g>
      <Move a={cue(id, 'اللي ترك')} b={cue(id, 'ناس')} x1={1400} y1={1010} x2={700} y2={1010}><Person x={0} y={0} s={0.7} head="hair" top={C.teal} pose="hold" face={-1} expr="happy" hand={<g transform="translate(-55 40) scale(0.6)"><P.Box /></g>} /></Move>
      {[0, 1].map((i) => <Pop key={i} at={cue(id, 'شافوه') + i * 6} x={1230 + i * 120} y={1010}><Mini x={0} y={0} s={1.2} c={C.navy} /></Pop>)}
      <Pop at={cue(id, 'مجنون')} x={1290} y={640}><Bubble w={260} h={100} tail={[0, 80]}><T size={48}>مجنون؟</T></Bubble></Pop>
      <Label x={700} y={420} text="تجنّب العقبات" size={56} at={cue(id, 'تجنّب')} />
    </g>],
    [cue(id, 'لا تتعجل'), <g>
      <Title text="لا تتعجل … ولا تهمل مؤنك" />
      {Array.from({ length: 6 }, (_, i) => <Move key={i} a={cue(id, 'لا تتعجل')} b={cue(id, 'فتتفكك')} x1={1700 - i * 40} y1={700} x2={1700 - i * (i < 2 ? 260 : 60) - 300} y2={700}><Mini x={0} y={0} s={1} head="roman" c={C.red} sad={i > 1} /></Move>)}
      <Label x={1200} y={400} text="تتفكك قوتك" size={56} tone="red" at={cue(id, 'فتتفكك')} />
      <Pop at={cue(id, 'مؤنك')} x={500} y={520}><P.Battery level={0.15} /></Pop>
      <Pop at={cue(id, 'يقول نعم')} x={960} y={1000}><Sway amp={8} period={30}><P.Papers n={12} tilt={1.5} /></Sway></Pop>
      <Label x={960} y={600} text="نعم لكل شي" size={50} at={cue(id, 'يقول نعم')} />
    </g>],
    [cue(id, 'وكراسوس'), <g>
      <Title text="كراسوس — كاراي" sub="53 ق.م" />
      <path d="M0 1000 Q300 900 600 980 T1200 960 T1920 990 L1920 1080 L0 1080 Z" fill={C.cream} stroke={INK} strokeWidth={W} />
      <Move a={cue(id, 'دخل')} b={cue(id, 'وانسحق')} x1={1700} y1={1000} x2={1100} y2={1000}><Person x={0} y={0} s={0.7} head="roman" outfit="armour" top={C.red} face={-1} expr="smug" /></Move>
      <Move a={cue(id, 'دخل')} b={cue(id, 'وانسحق')} x1={1450} y1={1000} x2={850} y2={1000}><Person x={0} y={0} s={0.7} head="hair" outfit="robe" top={C.purple} face={-1} pose="point" expr="smug" seed={8} /></Move>
      <Pop at={cue(id, 'عند عدوه')} x={700} y={560}><Bubble w={300} h={110} think tail={[60, 90]}><T size={44}>يشتغل للعدو!</T></Bubble></Pop>
      {Array.from({ length: 8 }, (_, i) => <Pop key={i} at={cue(id, 'وانسحق') + i * 2} x={200 + i * 80} y={1000}><Mini x={0} y={0} s={0.9} head="persian" c={C.purple} /></Pop>)}
    </g>],
    [cue(id, 'وكن ريح'), <g>
      <Title text="أربعة أوضاع: اختر اللي تحتاجه اللحظة" />
      {([['ريح', <P.Wind />, 'ريح'], ['وغابة', <g transform="translate(0 120) scale(0.7)"><P.Tree /></g>, 'غابة'], ['ونار', <P.Fire />, 'نار'], ['وجبل', <g transform="translate(0 120) scale(0.6)"><P.Mountain /></g>, 'جبل']] as const).map(([w, n, l], i) => <g key={w}>
        <Pop at={cue(id, w)} x={1560 - i * 400} y={540}>{n}</Pop>
        <Label x={1560 - i * 400} y={780} text={l} size={70} at={cue(id, w, 1, 0.1)} />
      </g>)}
    </g>],
    [cue(id, 'ولا تحاصر'), <g>
      <Title text="اترك له باب" />
      <path d="M560 300 L1360 300 L1360 900 L560 900 L560 680 M560 520 L560 300" fill="none" stroke={C.stoneDark} strokeWidth={30} strokeLinecap="round" />
      <Person x={960} y={830} s={0.6} head="hair" top={C.red} pose="shrug" expr="angry" />
      <Arrow at={cue(id, 'بلا مخرج')} x1={800} y1={600} x2={420} y2={600} color={C.green} w={12} />
      <Label x={330} y={480} text="مخرج" size={60} at={cue(id, 'بلا مخرج')} />
      <Label x={960} y={980} text="اللي ما عنده شي يخسره يقاتل بكل شي" size={44} at={cue(id, 'اللي ما عنده')} />
    </g>],
  ]} />;
};

export const C10: React.FC = () => {
  const id = 'c10';
  const FLAWS: Array<[string, string, React.ReactNode, string]> = [
    ['التهور', 'تهوّر', <P.Rocket />, 'شجاعة'], ['والجبن', 'جبن', <g transform="translate(0 90) scale(0.5)"><P.Castle /></g>, 'حذر'],
    ['والعصبية', 'عصبية', <g><P.Steam /><circle cy={80} r={50} fill={C.red} stroke={INK} strokeWidth={W} /></g>, 'حماس'],
    ['للكرامة', 'كرامة', <P.Crown />, 'عزّة'], ['والإفراط', 'رأفة زايدة', <P.Heart r={0.7} />, 'ولاء'],
  ];
  return <Seq end={until(id)} beats={[
    [start(id), <ChapterCard num={8} name="اعرف أي قاعدة تكسرها" at={start(id)} />],
    [cue(id, 'الطيار'), <g>
      <Title text="رحلة يونايتد 232" sub="1989" />
      <Person x={1550} y={1010} s={0.8} head="pilot" outfit="suit" top={C.navy} pose={[[0, 'hold'], [cue(id, 'وما فيه'), 'shrug']]} face={-1} expr={[[0, 'neutral'], [cue(id, 'فقدت'), 'surprised']]} />
      <Pop at={cue(id, 'قائمة تفحص')} x={1200} y={620} s={0.8}><P.Checklist items={['محرك', 'وقود', 'هيدروليك']} /></Pop>
      <Pop at={cue(id, 'رحلة')} x={600} y={480} s={0.9}><Sway amp={6} period={60}><P.Plane /></Sway></Pop>
      <Label x={600} y={720} text="فقدت التوجيه" size={56} tone="red" at={cue(id, 'فقدت')} />
      <Pop at={cue(id, 'وما فيه')} x={1200} y={330}><P.Question size={160} /></Pop>
    </g>],
    [cue(id, 'ارتجل'), <g>
      <Title text="ارتجلوا" />
      <Pop at={cue(id, 'ارتجل')} x={1400} y={520}><P.Timer label="44 دقيقة" /></Pop>
      <Pop at={cue(id, 'يوجّهون')} x={700} y={480}><Sway amp={8} period={45}><P.Plane /></Sway></Pop>
      <Arrow at={cue(id, 'المحركات')} x1={560} y1={640} x2={560} y2={760} color={C.orange} />
      <Arrow at={cue(id, 'المحركات', 1, 0.1)} x1={840} y1={640} x2={840} y2={760} color={C.orange} />
      <Label x={960} y={900} text="نجا 185" size={90} at={cue(id, 'ونجا')} />
    </g>],
    [cue(id, 'والقاعدة'), <g>
      <Title text="افهم ليش القاعدة موجودة" />
      <Pop at={cue(id, 'والقاعدة')} x={1100} y={600}><P.RuleBook /></Pop>
      <Pop at={cue(id, 'ليش')} x={900} y={540} s={1.1}><P.Magnifier /></Pop>
      <Label x={800} y={300} text="ليش؟" size={90} at={cue(id, 'ليش')} />
      <Narrator x={1600} y={1010} pose="think" expr="think" face={-1} />
    </g>],
    [cue(id, 'وخمس عيوب'), <g>
      <Title text="خمس عيوب تهدّك من داخل" />
      <Pop at={cue(id, 'وخمس عيوب')} out={cue(id, 'التهور') - 10} x={960} y={560}><T size={300} color={C.red}>5</T></Pop>
      {FLAWS.map(([w, l, n, mask], i) => <g key={w}>
        <Pop at={cue(id, w)} x={1600 - i * 320} y={520}><circle r={120} fill={C.paper} stroke={INK} strokeWidth={W} /><g transform="scale(0.8)">{n}</g></Pop>
        <Label x={1600 - i * 320} y={720} text={l} size={50} at={cue(id, w, 1, 0.1)} />
        <Pop at={cue(id, 'تتنكّر') + i * 6} x={1600 - i * 320} y={470} s={1.1} from="down"><P.Mask c={[C.gold, C.teal, C.pink, C.purple, C.green][i]} /></Pop>
        <Label x={1600 - i * 320} y={860} text={mask} size={46} tone="white" at={cue(id, 'فضيلة') + i * 5} />
      </g>)}
    </g>],
  ]} />;
};
