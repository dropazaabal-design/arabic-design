# بصيرة Motion Core — A + C (foundation)

هذه نواة أولية **للإخراج الدلالي المتزامن مع الكلام**، وليست محرك فيديو بديلًا ولا منتجًا مكتملًا.

## المسار A: دمج المكتبات
- **Remotion 4.0.534** هو المسؤول عن الإطارات والتصيير. تم اختيار نفس الإصدار المثبت في ريلز هذا المستودع.
- `@remotion/gsap`: حركات العناصر المركبة عبر `useGsapTimeline()`، من دون مؤقتات أو `play()` مستقل.
- `@remotion/paths`: رسم خطوط SVG بـ `evolvePath()` بدل كتابة حسابات طول المسار.
- `@remotion/captions`: تحويل توقيت الكلمات إلى `Caption[]`؛ النص العربي المعروض لا يُجزّأ إلى حروف.
- مهارات Remotion الرسمية للوكلاء: `npx skills add remotion-dev/skills`؛ ليست مطلوبة أثناء تشغيل الريل.

## المسار C: نظام بصيرة
- `src/core.ts`: يربط **intent + actor + action + channel** بكلمة محددة في تفريغ Whisper.
- `fromSegmentedWhisperWords()` يدعم تنسيق `src/words.json` الموجود في `reels/clear-thinking-pause`.
- `compileMotionPlan()`: يحوّل الأوقات إلى إطارات مطلقة ويرفض المراجع المفقودة، تداخل قنوات الممثل الواحد، والمدة غير الصالحة.
- `sampleActor()`: حركة انتقالية مستمرة بعد انتهائها، وإيماءات محلية لا تتسرب للمشاهد التالية.
- `src/RemotionStage.tsx`: مثال شخصية SVG هندسية بلا ملامح ومسار متحرك.
- `src/GsapEntrance.tsx` و `src/Captions.tsx`: محولات قابلة لإعادة الاستخدام.

## اختبار النواة
```sh
cd motion-core
npm install
npm test
npm run typecheck
```
يجب تثبيت جميع حزم Remotion بنفس النسخة. لا تعدّل الدفعة الحالية أي ريل سابق أو ملفات الصوت أو Lockfiles للريلز.

## مثال
```ts
import {compileMotionPlan,fromSegmentedWhisperWords} from './src/core';
const words=fromSegmentedWhisperWords(alignedWordsFromExistingReel);
const plan=compileMotionPlan({
 fps:30,words,durationMs:50000,
 beats:[{
  id:'hesitation',wordId:'s02:9',actorId:'hero',
  intent:'question',channel:'gesture',action:'nod',durationMs:400
 }]
});
```
المنسّق الإبداعي هو الذي يقرر أي حدث بصري يعبّر عن الجملة؛ محرك التوقيت لا يدّعي فهم النص تلقائيًا. لا تستعمل مثال IDs دون فحص الملف الحقيقي.

## شروط الاعتماد قبل الدمج
1. اختبار `npm test` (تم التحقق من 7 حالات على نسخة محلية من النواة).
2. `npm run typecheck` بعد جلب الاعتماديات؛ لم يتوفر اتصال npm أثناء هذه الجلسة، ولذلك **لم يُنفذ فحص TSX الكامل**.
3. Composition تجريبية منفصلة لريل فعلي، لا تغيير النسخة المنشورة.
4. فحص لقطات متفرقة وتكرار تصيير نفس الإطارات للمقارنة.
5. معاينة بشرية للانسجام الدلالي والصوت الحقيقي، وتأكيد سلامة الصوت والصورة بـ FFmpeg.

لا يوجد في هذه الدفعة فيديو نهائي أو إثبات تزامن صوت حقيقي. مكتبة الشخصيات الكاملة والتخطيط الذكي للنص مراحل لاحقة.
