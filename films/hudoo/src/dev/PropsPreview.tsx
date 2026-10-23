import React from 'react';
import { AbsoluteFill, Composition } from 'remotion';
import { BODY, TITLE, loadFonts } from '../fonts';
import { Character } from '../kit/characters/Character';
import { POSES } from '../kit/characters/poses';
import {
  Calendar, ChatScreen, Chair, Clock, Folder, Glass, ICONS, Lamp, Laptop, LockScreen, Mug, Notebook, NotificationBanner,
  Paper, Pen, Phone, Plant, Plate, PostScreen, SpeechBubble, ThoughtCloud, type ChatMessage,
} from '../kit/props';
import { PAL } from '../kit/style';

// Dev sheets for the prop kit (not part of the film).
const Sheet = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <AbsoluteFill style={{ background: PAL.paper }}>
    <svg width={1920} height={1080} style={{ position: 'absolute' }}>{children}</svg>
    <div dir="rtl" lang="ar" style={{ position: 'absolute', top: 24, right: 50, fontFamily: TITLE, fontWeight: 800, fontSize: 42, color: PAL.text }}>{title}</div>
  </AbsoluteFill>
);
const Label = ({ x, y, t }: { x: number; y: number; t: string }) => (
  <foreignObject x={x - 160} y={y} width={320} height={40}>
    <div dir="rtl" lang="ar" style={{ textAlign: 'center', fontFamily: BODY, fontWeight: 700, fontSize: 22, color: PAL.text }}>{t}</div>
  </foreignObject>
);
const At = ({ x, y, s = 1, children }: { x: number; y: number; s?: number; children: React.ReactNode }) => <g transform={`translate(${x} ${y}) scale(${s})`}>{children}</g>;

const JASER = 'جاسر';
const SARCASM = 'أتمنى أن تكون فكرتك القادمة أفضل من فكرة اليوم';
const DRAFT = 'يا جاسر، أنت آخر شخص يحق له أن يتكلم عن الأفكار…';
const THREAD: ChatMessage[] = [
  { from: 'me', text: 'شكرًا للجميع على الاجتماع اليوم', time: '11:31' },
  { from: 'them', text: SARCASM, time: '11:40' },
];
const POST = { author: 'سليم', text: 'تعلمت هذا الأسبوع أن الهدوء لا يعني الكبت' };
const COMMENTS = [
  { name: 'منى', text: 'كلام جميل، شكرًا لك' },
  { name: JASER, text: 'كلام فاضي… مين سألك أصلًا؟', hostile: true },
  { name: 'هادي', text: 'أتفق معك تمامًا' },
];
const REPLY = 'شكرًا لرأيك. أحترم الاختلاف، ولن أدخل في جدال.';

export const PropsObjects = () => (
  <Sheet title="الأدوات">
    <At x={150} y={250} s={3}><Pen /></At><Label x={130} y={300} t="قلم" />
    <At x={150} y={420} s={3}><Pen click={1} color={PAL.provoke} /></At><Label x={130} y={460} t="قلم مضغوط" />
    <At x={380} y={300} s={2.6}><Mug steam={1} t={0.4} /></At><Label x={380} y={330} t="كوب" />
    <At x={560} y={300} s={2.6}><Glass fill={0.6} /></At><Label x={560} y={330} t="كأس ماء" />
    <At x={760} y={260} s={2.4}><Plate /></At><Label x={760} y={330} t="صحن" />
    <At x={1050} y={300} s={1.6}><Laptop open={1} /></At><Label x={1050} y={330} t="حاسوب" />
    <At x={1380} y={300} s={1.6}><Laptop open={0.5} /></At><Label x={1380} y={330} t="حاسوب يُفتح" />
    <At x={1700} y={300} s={1.6}><Laptop open={0} /></At><Label x={1700} y={330} t="حاسوب مغلق" />
    <At x={140} y={640} s={2}><Paper /></At><Label x={140} y={745} t="ورقة" />
    <At x={330} y={640} s={2}><Paper crumple={0.5} /></At><Label x={330} y={745} t="ورقة تُكرمش" />
    <At x={500} y={640} s={2}><Paper crumple={1} /></At><Label x={500} y={745} t="كرة ورق" />
    <At x={720} y={680} s={2}><Folder /></At><Label x={720} y={790} t="ملف" />
    <At x={960} y={660} s={2}><Clock hours={11} minutes={40} /></At><Label x={960} y={750} t="ساعة حائط" />
    <At x={1180} y={730} s={2.2}><Calendar day={21} month="أكتوبر" /></At><Label x={1180} y={760} t="تقويم" />
    <At x={1380} y={770} s={2}><Lamp on={0} /></At><Label x={1400} y={800} t="مصباح مطفأ" />
    <At x={1640} y={770} s={2}><Lamp on={1} /></At><Label x={1660} y={800} t="مصباح مضاء" />
    <At x={1830} y={1040} s={1.4}><Plant sway={0.4} /></At>
    <At x={110} y={1060} s={0.7}><Chair kind="dining" /></At>
    <At x={330} y={1060} s={0.7}><Chair kind="office" facing={-1} /></At>
    <At x={760} y={1000} s={1.6}><Phone glow={1} screen={<LockScreen time="11:40" date="الثلاثاء 21 أكتوبر" />} /></At>
    <At x={900} y={1000} s={1.6}><Phone /></At>
    <At x={1040} y={1000} s={1.6}><Phone faceDown buzz={1} t={0.01} /></At>
    <At x={1180} y={1000} s={1.6}><Phone buzz={1} t={0.03} glow={0.6} screen={<ChatScreen name={JASER} messages={THREAD} />} /></At>
    {Object.values(ICONS).map((I, k) => <At key={k} x={1300 + (k % 6) * 72} y={900 + Math.floor(k / 6) * 76} s={1}><I s={56} /></At>)}
  </Sheet>
);

const Screen = ({ x, children }: { x: number; children: React.ReactNode }) => (
  <g transform={`translate(${x + 245} 565)`}><Phone w={490} screen={children} /></g>
);

export const PropsChat = () => (
  <Sheet title="المحادثة">
    <Screen x={90}><ChatScreen name={JASER} messages={THREAD} typing={1} t={0.1} /></Screen>
    <Screen x={720}><ChatScreen name={JASER} messages={THREAD} draft={DRAFT} draftCaret /></Screen>
    <Screen x={1350}><ChatScreen name={JASER} messages={THREAD} draft={DRAFT} erase={0.5} draftCaret header="night" /></Screen>
  </Sheet>
);

export const PropsPost = () => (
  <Sheet title="المنشور">
    <Screen x={90}><PostScreen {...POST} comments={COMMENTS} menu={1} /></Screen>
    <Screen x={720}><PostScreen {...POST} comments={COMMENTS} reply={REPLY} blocked={1} /></Screen>
    <Screen x={1350}>
      <LockScreen time="11:40" date="الثلاثاء 21 أكتوبر" />
      <g transform="translate(12 290)"><NotificationBanner name={JASER} text={SARCASM} time="11:40" /></g>
      <g transform="translate(12 400)"><NotificationBanner name="ريم" text="لا تنسَ العشاء الليلة" time="10:05" o={0.6} /></g>
    </Screen>
  </Sheet>
);

const LINES = ['ماذا حدث؟ تعليق ساخر في الاجتماع', 'ماذا شعرت؟ غضب وحرج', 'أين في جسدي؟ حرارة في الوجه', 'ماذا أريد؟ أن أُحترم', 'ما الخطوة؟ أتنفس ثم أرد بهدوء'];
export const PropsNotebook = () => (
  <Sheet title="الدفتر والفقاعات">
    <At x={560} y={330} s={3.6}><Notebook lines={LINES} written={0.55} /></At>
    <At x={150} y={720} s={1.1}><Notebook open={0} /></At>
    <At x={420} y={720} s={1.1}><Notebook open={0.3} /></At>
    <At x={720} y={720} s={1.1}><Notebook open={0.8} lines={LINES} written={1} /></At>
    <At x={1340} y={190}><SpeechBubble w={420} h={150} tail={[-150, 120]}>{REPLY}</SpeechBubble></At>
    <At x={1560} y={470}><ThoughtCloud w={420} h={190} tail={[-200, 150]}>ماذا أشعر الآن؟</ThoughtCloud></At>
    <At x={1250} y={720}><SpeechBubble kind="shout" w={430} h={200} tail={[200, 150]}>مين سألك أصلًا؟!</SpeechBubble></At>
    <At x={1690} y={860}><ThoughtCloud w={260} h={170} tail={[-130, 110]}><ICONS.IconFlame s={80} /></ThoughtCloud></At>
    <At x={180} y={960} s={1}><Paper /></At>
  </Sheet>
);

const lock = <LockScreen time="11:40" date="الثلاثاء 21 أكتوبر" />;
const chat = <ChatScreen name={JASER} messages={THREAD} header="night" />;
export const PropsHold = () => (
  <Sheet title="الهاتف في اليد ومقياس الأدوات">
    {/* standing, reading (upright), at the cast-sheet scale */}
    <Character who="salim" p={POSES.phone.p} x={200} y={900} s={1.45} hands={{ L: 'grip' }} hold={{ L: <Phone w={28} glow={0.7} screen={chat} /> }} upright={{ L: true }} face="hurt" />
    <Character who="salim" p={POSES.phone.p} x={520} y={900} s={1.45} hands={{ L: 'grip' }} hold={{ L: <Phone screen={lock} /> }} upright={{ L: true }} face="calm" />
    <Character who="jaser" p={POSES.phone.p} x={840} y={900} s={1.45} hands={{ L: 'grip' }} hold={{ L: <Phone w={28} screen={lock} /> }} face="smug" />
    <Label x={200} y={940} t="هاتف 28 يُقرأ" /><Label x={520} y={940} t="هاتف 44 يُقرأ" /><Label x={840} y={940} t="هاتف 28 مع الساعد" />
    {/* seated on a chair at a desk, writing in the notebook with a pen */}
    <g transform="translate(1200 900) scale(1.45)">
      <Chair kind="office" />
    </g>
    <Character who="salim" p={POSES.write.p} x={1200} y={900} s={1.45} hands={POSES.write.hands} hold={{ L: <Pen /> }} face="thinking" />
    <rect x={1310} y={690} width={330} height={20} rx={4} fill={PAL.table} stroke={PAL.text} strokeWidth={3.6} />
    <g transform="translate(1440 686) scale(0.62 0.3)"><Notebook lines={LINES} written={0.4} /></g>
    <At x={1545} y={690} s={1.45}><Mug steam={0.8} t={1} /></At>
    <g transform="translate(1720 900) scale(1.45)"><Chair kind="dining" facing={-1} /></g>
    <Character who="hadi" p={POSES.sit.p} x={1720} y={900} s={1.45} facing={-1} face="listening" />
    <At x={1500} y={300} s={1.45}><Clock hours={11} minutes={40} /></At>
    <g transform="translate(1625 690) scale(-1.2 1.2)"><Lamp on={1} /></g>
  </Sheet>
);

loadFonts();
const still = { durationInFrames: 1, fps: 60, width: 1920, height: 1080 } as const;
export const PropsRoot = () => (
  <>
    <Composition id="PropsObjects" component={PropsObjects} {...still} />
    <Composition id="PropsChat" component={PropsChat} {...still} />
    <Composition id="PropsPost" component={PropsPost} {...still} />
    <Composition id="PropsNotebook" component={PropsNotebook} {...still} />
    <Composition id="PropsHold" component={PropsHold} {...still} />
  </>
);
