# تقرير Blender MCP — التحقق والتشغيل والدمج

- **التاريخ:** 2026-10-14.
- **مصدر الأدلة:**
  - 4 جلسات Claude Code جديدة (`claude -p`) فيها **24 نداءً حقيقيًا لأدوات `mcp__blender__*` بلا خطأ واحد**، ونصها الملخص في `mcp-calls.txt`.
  - الصور المحفوظة هنا.
  - قياسات `ffprobe`/`ffmpeg` من الملفات نفسها.
- **حدود القياس:** شاهدتُ الصور المستخرجة وورقة الإطارات، ولم أشاهد الفيديو بزمنه.

## 1. حالة MCP: **متصل** (Connected)

| الدليل | النتيجة |
|---|---|
| `claude mcp get blender` | `√ Connected`، stdio، `/root/.local/bin/uvx mcp-for-blender`، نطاق user، `DISABLE_TELEMETRY=true` |
| تهيئة كل جلسة جديدة | `{'name': 'blender', 'status': 'connected'}`، و9 أدوات: `execute_blender_code`، `get_scene_info`، `look`، `get_addon_status`، `generate_3d`، `search_assets`، `import_asset`، `disable_telemetry`، `record_trajectory_feedback` |
| `get_addon_status` | `up_to_date: true`، البروتوكول 13/13، الإضافة 1.8، Blender 4.5.9 LTS، `telemetry_consent: false` |
| `backend.py check` | خروج 0، `addonReachable: true` (أمر `ping` الخاص بالإضافة) |

**الحالة التي وجدتها:**
- كانت `claude mcp get blender` تعيد «No MCP server named blender»، ولم يكن Blender مثبتًا.
- إذن أوامرك الثلاثة نُفذت على جهاز آخر (جهازك)، لا في هذه الحاوية السحابية (Ubuntu 24.04.5، 4 أنوية، 15 GB، بلا GPU).
- **الجلسة السحابية لا تستطيع الوصول إلى Blender على جهازك:** `localhost:9876` هنا هو الحاوية لا جهازك، ولم أفتح أي منفذ للإنترنت.
- لذلك ثبّتُّ Blender في الحاوية وأثبتُّ الاتصال كاملًا فيها.

## 2. حالة Blender: مثبت، متاح، الإضافة مفعّلة وتستجيب

| البند | النتيجة |
|---|---|
| Blender | 4.5.9 LTS من download.blender.org، وsha256 مطابق للملف الرسمي، في `/opt/blender-4.5.9-linux-x64`، ورابطه `/usr/local/bin/blender` |
| الأدوات | Python 3.13.16، و uv/uvx 0.11.32، و Claude Code 2.1.300، و`mcp-for-blender` 2.1.9 |
| الإضافة | `uvx mcp-for-blender setup --yes` (بعد `--dry-run`) ثبتها في `~/.config/blender/4.5/scripts/addons/blender_mcp.py` وفعّلها. التحقق: `ENABLED ['blender_mcp']` و`addon_utils.check → (True, True)` |
| التسجيل | تسجيل واحد بلا تكرار. أعدته بـ `DISABLE_TELEMETRY=true` كما في الوثائق الرسمية |
| التشغيل | الإضافة ترفض `blender -b` لأن أوامرها تُنفذ بمؤقت في خيط الواجهة. لذا تعمل واجهة Blender على شاشة افتراضية (Xvfb)، والخادم بدأ تلقائيًا على `localhost:9876` فقط |
| إعادة التشغيل | أُوقف Blender، فأعاد `check` الخروج 2. ثم أعاد `start-blender.sh` كل شيء في **7 ث** بخروج 0 |

## 3. الاختبار الحي (المرحلة 2): 7 نداءات منفصلة

كل شيء في مشهد جديد `Creative_Reels_Lab`. المشهد الأصلي `Scene` لم يُمس.

| # | الأداة | النتيجة الفعلية |
|---|---|---|
| 1 | `get_scene_info` | `Scene 'Scene' \| 1 camera, 1 light, 1 mesh` (Cube، Light، Camera) |
| 2 | `execute_blender_code` | المجموعة `Creative_Reels_Test`، وفيها `CRT_Cube`/`CRT_Sphere`/`CRT_Cone` بثلاث مواد مختلفة: `CRT_Teal`/`CRT_Pink`/`CRT_Blue` |
| 3 | `execute_blender_code` | الكاميرا `CRT_Camera` كاميرا المشهد، والضوءان `CRT_Key` (منطقة) و`CRT_Sun` (شمس) |
| 4 | `execute_blender_code` | تعديل في نداء منفصل: الكرة بمقياس 1.4 وارتفاع z = 1.26، وخشونة المادة 0.2 |
| 5 | `get_scene_info` | `Creative_Reels_Lab \| 1 camera, 2 light, 3 mesh`، والكرة `at (0,0,1.26) size 2.52` |
| 6 | `execute_blender_code` (قراءة فقط) | المجموعة في المشهد، والمواد بألوانها، و`original_scene_untouched: [Camera, Cube, Light]` |
| 7 | `look` (كاميرا) | `look-live-test.png`: مكعب أخضر مزرق، وكرة وردية كبيرة، ومخروط أزرق |

## 4. اختبار التحريك والتصيير (المرحلة 3)

«حبرة والكتاب» شخصية أصلية: قطرة حبر بعينين وقدمين، من مجسمات bmesh مشوهة بالكود، بلا أصول خارجية.
- تقفز قفزتين إلى كتاب مغلق، ثم تتراجع وتندفع وتصدمه عند الإطار 46.
- ينزلق الكتاب، وينقلب غلافه مفتوحًا.
- يصعد شرر مضيء بضوئه الخاص، فتتسع عيناها وتنظران إليه، ثم تقفز فرحًا وتدور دورة كاملة.

**نداءات MCP:** `build`، ثم `animate`، ثم `stage`، ثم `look frames`، ثم `verify`، ثم تصيير صورة، ثم `look` على الصورة، ثم `save`. الكود المنفذ هو `scene.py` نفسه.

**المفاتيح (`verify()`):** 11 جسمًا فيها مفاتيح:
- `HB_Root`: 14 مفتاحًا؛
- `HB_Body`: 25؛
- `BK_Hinge`: 6؛
- `SP_Spark`: 7؛
- والعينان والحدقتان، و`BK_Root`، و`SP_Light`، و`CAM`.

**عينات من المواقع عند إطارات محددة:**

| الإطار | موضع الجسم (x، z) | زاوية الغلاف | x الكتاب | z الشرر |
|---|---|---|---|---|
| 1 | −1.70، 0 | 0° | 0.90 | 0.20 |
| 20 | −1.15، 0 | 0° | 0.90 | 0.20 |
| 46 (الصدمة) | −0.35، 0 | 0° | 0.90 | 0.20 |
| 54 | −0.62، 0 | 131° | 1.22 | 0.20 |
| 62 | −0.62، 0 | 157° | 1.22 | 0.90 |
| 78 (القفزة) | −0.62، 0.75 | 169° | 1.22 | 2.04 |
| 96 | −0.62، 0 | 169° | 1.22 | 1.90 |

**الملفات الناتجة (كلها في `reels/creative-3d/lab/`):**

| الملف | التحقق |
|---|---|
| `lab.blend` (1.3 MB) | حُفظ عبر MCP بـ `save_as_mainfile(copy=True)`. **أُعيد فتحه مرتين:** <ul><li>في عملية CLI منفصلة للتصيير.</li><li>داخل Blender حي جديد عبر MCP بعد إعادة التشغيل. المشاهد الثلاثة موجودة، والمفاتيح والعينات **مطابقة تمامًا** لما قبل الحفظ.</li></ul> |
| `still_f062.png` | 540×960، صُيّر **داخل Blender الحي عبر MCP** (Cycles) |
| `preview.mp4` | <ul><li>96 إطارًا، 4.000 ث، 24/1 ثابت، 540×960.</li><li>H.264 High، yuv420p، bt709 tv-range.</li><li>يُفك كاملًا بلا أخطاء.</li><li>**الحركة:** 88 من 95 انتقالًا بين إطارين فيها تغير. أطول سكون 5 إطارات (0.2 ث). الفرق المتوسط 3.9 بين الإطارين 1 و46، و3.6 بين 46 و62.</li></ul> |
| `preview.render.json` | Cycles على المعالج، 24 عينة + OIDN، و4 ارتدادات: **1246.9 ث للتصيير (12.99 ث للإطار)**، والترميز 1.4 ث |
| `look-frames-after-reopen.png` | شريط إطارات الكاميرا بعد إعادة الفتح: القفز، والصدم، وانفتاح الغلاف، والشرر |

## 5. الدمج في بصيرة

| الملف | التغيير |
|---|---|
| `reels/creative-3d/backend.py` | `check`: خروج 0 = الإضافة تجيب، و2 = الملف التنفيذي فقط، و1 = لا شيء، فيُستعمل `creative-motion`. `render`: من `.blend` إلى PNG ثم ترميز PIPELINE §11. `selftest`: بلا Blender. مكتبة Python القياسية وffmpeg فقط |
| `reels/creative-3d/start-blender.sh` | تجهيز الحاوية السحابية بخطوات تتخطى ما سبق إنجازه، وفيه التحقق من sha256 وإيقاف القياس |
| `reels/creative-3d/README.md` | الوضعان، والتشغيل محليًا وسحابيًا، والأمان، وطريقة العمل، والتركيب في Remotion (`<OffthreadVideo>`) |
| `reels/creative-3d/lab/*` | هذا الإثبات |
| `reels/PIPELINE.md` §8.7 و`reels/AGENTS.md` | الوضعان والبديل |
| `.github/workflows/reel-qa.yml` | خطوة `backend.py selftest` |

**ما لم يتغير:** Remotion وGSAP وRive وأدوات الصوت وFFmpeg لم يُعدّل فيها شيء.
- **التبعيات:** لا تبعيات جديدة في أي `package.json`، ولا بيانات اعتماد جديدة.
- **CI على #44:** `gates` (ومعها خطوة الـ selftest الجديدة) و`motion` كلاهما ناجح.
- **محليًا:** `qa_gates.py --self-test` و`--all` ناجحان، و`reels/motion` ناجح 8/8.

## 6. ما بقي فعلًا

1. **Blender على جهازك لم يُختبر من هنا، ولا يمكن اختباره من جلسة سحابية.**
   - **الخطوة المطلوبة منك:** افتح Blender على جهازك، وتأكد من **Start MCP Server** في لوحة MCP for Blender (اضغط N).
   - ثم افتح جلسة Claude Code **على جهازك نفسه**، وشغّل `claude mcp get blender` و`python3 reels/creative-3d/backend.py check`.
   - **ممنوع:** لا تفتح المنفذ 9876 للإنترنت، فالإضافة بلا مصادقة. إن احتجت جهازًا آخر فنفق SSH فقط.
2. **سرعة التصيير السحابي:** 13 ث للإطار على 4 أنوية بلا GPU، بدقة 540×960 وبـ 24 عينة. ريل كامل بـ 60 إطارًا/ث و1080×1920 بهذا الإعداد بطيء جدًا هنا. للإنتاج صيّر على جهاز بـ GPU (Cycles على GPU، أو EEVEE).
3. **الحاوية تُمسح بعد الجلسة:** Blender والإضافة والتسجيل تختفي. تُعاد بـ `bash reels/creative-3d/start-blender.sh` (نحو دقيقتين للتنزيل)، ثم جلسة Claude Code جديدة لتظهر الأدوات.
4. **`look` لقطة واجهة لا تصيير:** في الوضع `frames` يؤطّر كل الأجسام إن لم تحدد الكاميرا. المعتمد للحكم على الصورة النهائية هو التصيير.
