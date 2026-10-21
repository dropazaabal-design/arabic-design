# بصيرة — AI Narrative Planner (optional)

يمكن للوكيل الإبداعي صياغة Storyboard انطلاقًا من الملخص العربي والصوت
المُحاذى من Whisper. **لا يُنتج MP4 بنفسه.** يمر كل اقتراح بمسار
`prepareStoryboard` و`directStory` و`compileMotionPlan` الموجود سلفًا.

## التشغيل مع Claude API (الاختيار الأساسي)

```sh
cd motion-core
npm install
npm run build:core
# ضع المتغيرات في إعدادات البيئة السرية فقط، ولا تحفظ قيمها في Git
export BASEERA_AI_PROVIDER=anthropic
export BASEERA_AI_MODEL=<model-id-you-can-access>
export ANTHROPIC_API_KEY=<secret-from-your-account>
npm run planner:generate -- planner/demo-brief.json demo/output/ai-storyboard.json
```

لـ OpenAI Responses API:

```sh
export BASEERA_AI_PROVIDER=openai
export BASEERA_AI_MODEL=<model-id-you-can-access>
export OPENAI_API_KEY=<secret-from-your-account>
npm run planner:generate -- planner/demo-brief.json demo/output/ai-storyboard.json
```

- المتغيرات مطلوبة فقط عند إرسال طلب API حقيقي. لن يطلب CI مفاتيح.
- ملف `planner/demo-brief.json` يشير إلى ملف التوقيت الصحيح والمسجل بالفعل.
- `wordsFile` يُحل بالنسبة إلى مجلد `motion-core` الذي يشغَّل منه الأمر.
- المخرج **جديد دائمًا**: لن يُستبدل ملف موجود تلقائيًا.
- لا يلزم تحديد مشاهد أو حركات يدويًا: النموذج يقترحها ضمن قاموس حركات آمن
  ومحدود بعد قراءة الكلمات المؤقتة. توفير هوية الشخصيات فقط هو قيد استمرارية.
- لا يُستدعى أي نموذج AI أثناء التصيير. البيانات المُولّدة تُفحص أولًا،
  ثم يمكن أن يعتمدها المخرج ويستعملها في ريل جديد.
- لا تضع مفاتيح API داخل `demo-brief.json` أو أي مسار في Git.
- التكلفة الخارجية إن وُجدت تتبع API الخاص بالمزود، وليست مغطاة باشتراك ChatGPT/Claude.
- تعطل API أو رفضه أو عدم مطابقة الكلمات يمنع إنشاء أي ملف.

## اختبارات بدون إنفاق API

```sh
npm test
npm run typecheck
```

اختبارات `planner/tests` تستخدم mock fetch مُحددًا بالكامل، وتتحقق من مسار
Anthropic وOpenAI، ورفض JSON الفاسد، والمراجع المفقودة، وغياب المفتاح،
وأخطاء HTTP وتعارض الحركة. هذه اختبارات اتصال صورية لا تُثبت جودة
المقترح الإبداعي من خدمة مدفوعة حقيقية.

## ما لم يكتمل بعد

- لم ندّع تشغيل اتصال API مدفوع أو قياس جودة الإخراج من نموذج حي.
- الربط الآلي مع قصة منشورة يتطلب **مراجعة فعلية** قبل اعتماد ملف JSON.
- لا نسمح للنموذج بتوليد TSX أو أوامر قابلة للتنفيذ؛ فقط JSON يتم التحقق منه.
