# إسناد ومصادر

## مستعمَل

**[FrequencyWords](https://github.com/hermitdave/FrequencyWords)** — Hermit Dave، MIT.
مصدر معجم `lib/lexicon/ar.txt.gz`. التفاصيل في `lib/lexicon/README.md`.

**[instagram-skills](https://github.com/sergebulaev/instagram-skills)** — Serge Bulaev، MIT.
فكرتان منه في `lib/copy.js` و`skills/arabic-content`: اختيار الخطّاف حسب هدف
المنشور، وهيكل الإطارات (وعد في الأول، الأقوى مبكّرًا، طلب واحد في الأخير).
**لا نصّ ولا كود منقول.** القواعد عربية مكتوبة من الصفر، وخاصّة بفيسبوك.

**حزم المستخدم الخمس** (`canva-art-director`، `canva-arabic-post`،
`canva-arabic-reel`، `canva-arabic-ad`، `canva-design-memory`) — كتبها صاحب
المشروع لمساعد آخر، ورفعها للدمج في ٢٠٢٦-٠٩-٢٩.

| الجزء | أين صار |
|---|---|
| مدير التصميم: الفكرة قبل الأداة، الموجز، بوّابة الجودة، قواعد التحرير والحفظ | `skills/arabic-create/SKILL.md` و`references/art-direction.md` |
| البوست والريل والإعلان | `skills/arabic-create/references/formats.md` |
| ذاكرة الذوق وقواعد نطاقها | `skills/arabic-memory/SKILL.md` |
| `remember.py` | نُقل إلى `lib/taste.js` (Node، بلا تبعيات) بالتحقّقات نفسها |
| `taste-profile.json` | تفضيلاته الثلاث بكلماته في `taste.json` |
| «لا تنشر ملفًا في GitHub للحصول على رابط» | صار الطريق العام بإذن صريح لكل تصميم؛ Canva يولّد افتراضيًا |

**إضافة `arabic-carousel` ١٫٦٫٠** (مشروع `baseera`) — كتبها صاحب المشروع،
ورفعها في ٢٠٢٦-١٠-٠٤. أُضيفت **إضافةً ثانية في السوق** تحت
`plugins/arabic-carousel/`، لا مدموجة في `arabic-design`: مهمّتها البناء من فكرة،
ومهمّة `arabic-design` الحراسة على تصميم قائم، وأسماء مهاراتهما لا تتعارض. وهي
الجزء الذي سجّلناه في ٢٠٢٦-٠٩-٢٩ أنه «لم يكن في الحزمة» (`canva-arabic-carousel`).

| الجزء | حالته |
|---|---|
| ست مهارات (`arabic-carousel`، `carousel-director`، `canva-arabic`، `arabic-reels`، `arabic-proofing`، `creator-memory`) و`GUIDE.md` والمراجع والأصول | كما هي، بلا تعديل |
| `scripts/studio.mjs` و`canva.mjs` و`canva-mcp.mjs` | كما هي. مبنيّة من `lib/studio` عنده (ترويستها تقول ذلك)، كودُه وحده — لا تبعية خارجية مجمَّعة فيها ولا ترخيص أجنبي |
| `.mcp.json` (خادم `baseera-canva`) | كما هو؛ `${CLAUDE_PLUGIN_ROOT}` يحلّ على جذر الإضافة الثانية فتعمل من موضعها الجديد |
| `homepage`/`repository` | أُعيدا إلى مستودع `arabic-design` لأنها صارت تُوزَّع منه، وأُضيف `license: MIT` |
| `plugin.json` في الجذر (نسخة ثانية للمخطّط العام وواجهة مساعد آخر، `extensions.com.openai`) | حُذف؛ المانيفست الباقي `.claude-plugin/plugin.json` وهو موضع Claude Code. والوصفان كانا يختلفان في سطر واحد: أنّ أدوات Canva تعمل خادمَ MCP هنا، لا CLI فقط |

**[Habibi-TTS](https://github.com/SWivid/Habibi-TTS)** — X-LANCE (SJTU) وSII،
arXiv:2601.13802. الكود MIT. الأوزان **ليست كلّها** كذلك: الموحّد وSAU وUAE تحت
CC-BY-NC-SA-4.0 (قيدٌ من مجموعتي SADA وMixat)، وMSA وALG وEGY وIRQ وMAR تحت
Apache-2.0.

**[NAMAA-Egyptian-TTS](https://huggingface.co/NAMAA-Space/NAMAA-Egyptian-TTS)** —
مجتمع نماء، MIT (الكود والأوزان). مبنيّ على `ResembleAI/chatterbox` متعدّد اللغات.

**[Remotion](https://github.com/remotion-dev/remotion)** — Remotion GmbH.
**ليست MIT.** مجانية للأفراد وللجمعيات غير الربحيّة وللشركات الربحيّة حتى ثلاثة
موظفين؛ وما فوق ذلك يحتاج Company License من `remotion.pro`.
[`LICENSE.md`](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

**الثلاثة تُستدعى ولا تُحزَم.** لا نموذج ولا وزن ولا حزمة `npm` في هذا
المستودع: `lib/speech.js` يبني سطر الأوامر و`lib/video.js` يكتب مشروعًا، ثمّ
يثبّتهما صاحبهما بنفسه ويقرأ ترخيصه. فلا يرث مستودعٌ MIT قيدًا لا يملكه، ولا
يمرّ مستعملٌ على قيد لا يراه: `--commercial` يرفض الوزن غير التجاري، وحقل
`licence` يسافر مع كل حالة فيديو. وما كُتب هنا عن حدودهما مقروء من مصدرهما —
`infer_cli.py` وبطاقة النموذج و`LICENSE.md` — لا من صفحات تعريفهما.

**ما لم يُلمَس عمدًا**: التعارض الظاهر بين «المحرّر بلا إنترنت» في
`arabic-carousel` وقاعدة `canva-arabic` «Canva يبقى المحرّر: لا تبنِ محرّرًا
بديلًا». هو تعارض داخل إضافة صاحبها بين طريقَي تسليم يختار بينهما، لا خطأ نصحّحه
له. وقرار ٢٠٢٦-٠٩-٢٩ بإزالة استوديو المتصفّح من `arabic-design` باقٍ كما هو:
`arabic-design` لم تتغيّر مهارةٌ فيها.

## قُيِّم ولم يُدمَج — ولماذا

### من حزم المستخدم

| الجزء | لماذا لم يُدمَج |
|---|---|
| `agents/openai.yaml` و`$اسم-المهارة` ومسارات `/root/.codex` | خاصّة بمساعد آخر؛ Claude يحلّ المهارات بأسمائها في الإضافة |
| أسماء أدوات Canva فيها (`create_design`، `image_to_design`، `get_design_pages`، `design_file`) | موصل آخر. موصل هذه الجلسة لا يقبل `design_file`، ورفع الملف مباشرةً لا يصنع تصميمًا (مقيس — `REFERENCE.md` §١٢). كُتبت الخطوات بأدواته الفعلية |
| إحالة إلى `canva-arabic-carousel` | لم تكن في الحزمة؛ كُتب قسم الكاروسيل من المبادئ نفسها |
| `assets/icon.svg` | أيقونة واجهة ذلك المساعد |

### من instagram-skills

| الجزء | لماذا لم يُدمَج |
|---|---|
| عملاء Apify وPublora وPixfaro | خدمات مدفوعة خارجية بمفاتيح API. Publora «طبقة النشر الافتراضية» عنده، وهذه الإضافة لا تنشر شيئًا عمدًا. |
| بوّابة الموافقة `approval.py` | المؤلّف نفسه يصفها «طبقة أعراف لا فرض وقت التشغيل». الأمان هنا لا يقوم على تعليمات. |
| مسار `diy` للنشر | ينفّذ أمرًا من متغيّر بيئة. |
| قواعد «المُؤنسِن» | إنجليزية: تكشف `delve` وكثافة الشَّرطات. لا قيمة لها بالعربية، فكُتب بديلها العربي. |
| حدود إنستغرام | ٢٢٠٠ حرف، طيّة ١٢٥، ٣–٥ وسوم. فيسبوك منصّة أخرى. |

### browser-canvas (Parker Hancock، MIT في README)

فُحص كاملًا: خطّافه `PostToolUse` يستدعي `localhost` فقط، والخادم لا يرسل
شيئًا للخارج. **سليم، لكنه أداة لمهمّة أخرى**: خادم Bun يعرض واجهات React
تفاعلية (نماذج، لوحات تحكّم) بإعادة تحميل حيّة.

القيمة الوحيدة التي تخصّنا منه — **المعاينة المحلّية** — متاحة بلا شيء منه:
صفحات هذه الإضافة HTML ثابتة، و`make --out=page.html` يكتب ملفًّا يُفتح في
أي متصفّح مباشرةً. إضافة ١٣٧ ملفًّا وBun وReact لنحصل على ما يعطيه نقرٌ مزدوج
ليست صفقة.

فحص الوصولية عنده (`axe-core`) مصمَّم لواجهات تفاعلية: تسميات الحقول،
الترتيب، التركيز. ملصق مسطّح مشكلته الوحيدة من هذا الصنف التباين، و`compose`
يفحصه قبل الرسم.
