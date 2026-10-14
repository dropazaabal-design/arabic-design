# creative-3d: Blender backend اختياري للريلات

لبصيرة وضعا إنتاج. الوضع الحالي لا يتغير، والجديد طبقة اختيارية فوقه.

| الوضع | متى | الأدوات |
|---|---|---|
| `creative-motion` (الافتراضي) | شرح، رسوم SVG، شخصيات mukarram، عناوين عربية | Remotion + GSAP + `@remotion/paths` + Rive (`reels/motion`)، وElevenLabs، وWhisper/Scribe، وFFmpeg |
| `creative-3d` | لقطات سينمائية بشخصية ثلاثية الأبعاد ومكان حقيقي وإضاءة | Blender عبر MCP للتأليف والتحريك، ثم `backend.py render`، ثم Remotion أو FFmpeg للتركيب. الصوت والترجمة والفحوص كما هي |

```
Claude Code ─ المخرج (القصة واللقطات) ─ تخطيط المشهد ─▶ Blender MCP (execute_blender_code، look، get_scene_info)
   ─▶ .blend محفوظ ─▶ backend.py render (Blender CLI ← PNG ← ترميز PIPELINE §11) ─▶ Remotion <OffthreadVideo> أو FFmpeg ─▶ MP4 نهائي
```

## الاختيار والبديل

```sh
python3 reels/creative-3d/backend.py check
```

| خرج الأمر | المعنى | ماذا تفعل |
|---|---|---|
| خروج 0 (`addonReachable: true`) | الإضافة تجيب على `ping` | التأليف عبر MCP ممكن |
| خروج 2 | Blender مثبّت والإضافة لا تجيب | يمكن تصيير `.blend` محفوظ. للتأليف شغّل Blender وتأكد أن خادم الإضافة يعمل |
| خروج 1 | لا Blender ولا إضافة | استعمل `creative-motion`. لا شيء في خط الإنتاج يحتاج Blender |

لا تبعيات جديدة في المستودع:
- Blender والإضافة والخادم (`uvx mcp-for-blender`) خارج المستودع.
- `backend.py` يستعمل مكتبة Python القياسية وffmpeg فقط.

## التشغيل

### على جهازك (Windows أو macOS أو Linux بواجهة)

```sh
uvx mcp-for-blender setup     # يسجّل الخادم في Claude Code ويثبت الإضافة ويفعّلها
```

1. افتح Blender. الإضافة تبدأ خادمها تلقائيًا على `localhost:9876` (لوحة **MCP for Blender**، اضغط N).
2. افتح جلسة Claude Code **جديدة على الجهاز نفسه**، لأن الجلسة الجارية لا تحمّل خادمًا أُضيف بعد بدئها.
3. تحقق بـ `claude mcp get blender`، ثم `backend.py check`.

### في جلسة سحابية (حاوية Linux بلا شاشة، تُمسح بعد كل جلسة)

```sh
bash reels/creative-3d/start-blender.sh
```

يقوم السكربت بأربع خطوات:
1. يثبت Blender 4.5.9 LTS في `/opt` بعد التحقق من sha256 الرسمي.
2. يثبت الإضافة الرسمية ويفعّلها.
3. يسجل الخادم بـ `DISABLE_TELEMETRY=true`.
4. يشغّل واجهة Blender على شاشة افتراضية (Xvfb)، لأن الإضافة ترفض `blender -b`.

بعده افتح جلسة Claude Code جديدة (أو `claude -p`) لتظهر أدوات `mcp__blender__*`.

**جلسة سحابية لا تصل إلى Blender على جهازك.** المنفذ `localhost` هناك هو localhost جهازك، لا الحاوية.
- **ممنوع:** لا تفتح المنفذ 9876 للإنترنت. الإضافة بلا مصادقة، ومن يصل إليها يشغّل Python داخل Blender.
- **إن احتجت Blender جهازك:** شغّل Claude Code على جهازك نفسه.
- **إن احتجت جهازًا آخر تملكه:** استعمل نفق SSH إليه، كما توصي الوثائق الرسمية.

## الأمان والخصوصية

- **الإضافة تنفذ أي Python:** هذا مقصود. اجعلها على `localhost` فقط. للتقييد عيّن `BLENDER_MCP_SAFE_MODE=1` في بيئة الخادم، فيمنع الشبكة والملفات والعمليات الخارجية ويُبقي النمذجة والتصيير والحفظ.
- **القياس عن بعد:** محتواك لا يُرسل إلا بموافقة صريحة. بلا موافقة يُرسل سجل استعمال مجهول (اسم الأداة والمدة والإصدار). أوقفناه كليًا بـ `DISABLE_TELEMETRY=true` في التسجيل.
- **مشاهد المستخدم:** كل مشهد نبنيه في `Scene` خاص به، ولا نحذف إلا ما بنيناه نحن. الحفظ بـ `save_as_mainfile(copy=True)`، فلا يتغير ملف الجلسة الحية.

## طريقة العمل

1. **المشهد كود محفوظ:** يُكتب في ملف بالمستودع (مثال: `lab/scene.py`) بدوال صغيرة: `build()`، ثم `animate()`، ثم `stage()`، ثم `verify()`، ثم `save()`.
2. **التنفيذ عبر MCP:** تنفّذ كل دالة في نداء `execute_blender_code` مستقل: `exec(open('/abs/scene.py').read()); build()`. هكذا يبقى ما نُفّذ في Blender نسخة من ملف تراجعه في Git.
3. **الفحص قبل التصيير:** `look` بوضع `frames` يعرض شريطًا من إطارات الكاميرا، و`verify()` يعيد المفاتيح ومواقع الأجسام عند إطارات محددة. كلاهما قبل أي تصيير طويل.
4. **التصيير:** `python3 reels/creative-3d/backend.py render scene.blend clip.mp4 --scene NAME` يفتح الملف في عملية Blender منفصلة، فلا يتجمد Blender الحي. ويكتب `clip.render.json` بالأزمنة.
5. **التركيب:** في Remotion تضع `<OffthreadVideo src={staticFile('3d/clip.mp4')} />` داخل `<Sequence>`. الصوت والترجمة من الأدوات المعتادة. أو تستعمل FFmpeg مباشرة.
   - **معدل الإطارات:** صيّر بمعدل الريل (60 للإنتاج). المعاينة هنا بـ 24 لتكون خفيفة.

## المختبر (`lab/`)

إثبات تقني لا ريل منشور. في `lab/REPORT.md` النداءات الفعلية ونتائجها، وزمن التصيير، والفحوص.

| الملف | ما هو |
|---|---|
| `lab/scene.py` | مشهد «حبرة والكتاب»: قطرة حبر تقفز إلى كتاب مغلق، تدفعه فينفتح، ويصعد منه شرر |
| `lab/lab.blend` | الملف المحفوظ عبر MCP، وفيه المشاهد الثلاثة: الافتراضي ومختبر المرحلة 2 والمشهد المتحرك |
| `lab/still_f062.png` | تصيير داخل Blender الحي عبر MCP |
| `lab/preview.mp4` | معاينة 4 ث صُيّرت من الـ `.blend` في عملية منفصلة |
