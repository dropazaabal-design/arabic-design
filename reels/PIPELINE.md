# دليل إنتاج ريل «بصيرة» من الصفر إلى التسليم

> مكتوب لوكيل برمجي (Codex أو غيره) يعمل في هذا المستودع. يصف الطريقة التي أُنتجت بها الريلات
> `mukarram` و`boiling-frog` و`doublethink` و`power-of-no-b` و`blind-obedience`. الأوامر والمسارات حقيقية.
> المرجعان الأحدث للنسخ منهما: **`reels/blind-obedience/`** (ريل شرح علمي بصوتين، 72 ث) و**`reels/power-of-no-b/`**
> (قصة كوميدية بصوتين في عالم واحد متصل، 90 ث).

---

## 0. الخريطة في جدول واحد

| # | المرحلة | المدخل | المخرج | بوابة المرور |
|---|---|---|---|---|
| 0 | الاستلام وGit | ملف الموجز `.md` | فرع جديد من `claude/new-session-gmtqwj` | المجلدات المرجعية موجودة، شجرة العمل نظيفة |
| 1 | البحث | روابط الموجز | فقرة «التحقق» في `script.md` | كل رقم سيظهر قرأته في نصه الأصلي أو ملخصه |
| 2 | النص | الموجز + البحث | `script.json` | المدة التقديرية ضمن الهدف، لا ادعاء بلا مصدر |
| 3 | الصوت | `script.json` | `audio/take-*.mp3` + تفريغ كلمات | التفريغ المستقل سمع كل كلمات النص |
| 4 | التوقيت | النسخ + الكلمات | `timeline.json`، `words.json`، `envelope.json`، SRT، أسطر WAV | المدة المقيسة ضمن الهدف بلا تسريع |
| 5 | البناء البصري | التوقيت | `src/…`، `storyboard.json` | `tsc --noEmit` نظيف |
| 6 | المعاينة | الكود | صور ثابتة + أنيماتيك صامت | لا عيب مرئي معروف، لا سكون طويل |
| 7 | المؤثرات | الإيقاعات | `src/video/sfx.tsx` | المؤثرات تحت الصوت |
| 8 | التصدير | كل ما سبق | `output/final_reel.mp4` | يُصدَّر مرة واحدة بعد المعاينة |
| 9 | الفحص | MP4 | `output/qa-*.json` + `qa_report.md` | كل البنود التقنية ✓ |
| 10 | التوثيق والنشر | كل ما سبق | `README.md`، `storyboard.md`، `publish/` | الغلاف داخل قص 3:4، نصوص المنصات بحدودها |
| 11 | الحفظ والمراجعة | الفرع | commit + push + PR مسودة | PR على الأساس الصحيح بلا تعارض |

---

## 1. قواعد لا تُكسر

1. **لا تعدّل ريلات الآخرين.** استورد منها (القسم 2) ولا تنسخ رسومها حرفيًا. كل ريل جديد في مجلد جديد `reels/<slug>/`.
2. **لا force push، لا دمج، لا نشر على المنصات.** PR مسودة دائمًا إلى `claude/new-session-gmtqwj`.
3. **لا تسريع ولا إبطاء ولا تغيير طبقة للصوت.** إذا طالت المدة أو قصرت: عدّل النبضات (`SEG_BEATS`) أو النص، ثم أعد التوليد.
4. **لا تدّعِ أنك سمعت أو شاهدت.** حكم النطق من تفريغ آلي مستقل، وحكم الصورة من صور ثابتة وقياسات. اكتب ذلك صراحة في التقرير.
5. **كل رقم على الشاشة أو في الصوت من نص مصدره.** المواقع الثانوية (بطاقات المذاكرة، المدونات) تدلّك على المصدر فقط ولا تكفي سندًا. سجّل في `script.md` ما قرأته فعلًا: النص الكامل، أو الملخص فقط، أو لم يُقرأ.
6. **عربية فقط داخل الكادر.** RTL، أرقام غربية (0–9)، ولا كلمة إنجليزية مرسومة. الأسماء اللاتينية والمراجع في `script.md` و`publish.md` فقط.
7. **لا تشخيص نفسي ولا تعميم.** المفهوم «يلامس»، والاستفزاز سؤال للمشاهد لا اتهام.
8. **الملفات الكبيرة المؤقتة لا تُرفع.** `node_modules/`، و`out/`، و`audio/*.wav` (يُعاد توليدها من mp3) في `.gitignore`.

---

## 2. ما يُعاد استعماله وكيف

كل ريل مشروع Remotion مستقل: `remotion 4.0.534`، `react 19.3`، `typescript 7.0.2`. يستورد من الريلات الأخرى عبر
الملف `webpack-override.mjs`، ويعطي الأسماء نفسها في `tsconfig.json` (`paths`) لفحص الأنواع.

| الاسم المستعار | يشير إلى | ماذا تأخذ منه |
|---|---|---|
| `@mukarram/characters/rig` | `reels/mukarram/src/characters/rig.tsx` | `Person`، `Pose`، `POSES`، `mixPose`، `walkPose`، `handLocal`، `hipHeight`، `BUILD` |
| `@mukarram/characters/face` | `face.tsx` | `EXPRESSIONS`، `Expression`، `mixExpr` |
| `@mukarram/characters/cast` | `cast.tsx` | `Narrator` (راوي بصيرة)، `Litterer`، `Spitter`، `Passerby`، `Cleaner`، `BUILDS`، `Glasses`، `Mustache`، `Cap` |
| `@mukarram/characters/ink` | `ink.ts` | `PAL` (الألوان)، `INK`، `stroke`، `wobEllipse`، `wobRect`، `bowLine`، `clamp`، `lerp` |
| `@mukarram/video/stage` | `stage.tsx` | `Shot` (كاميرا + غليان الخط + حبيبات + طبقة HTML)، `SAFE`، `W`، `H` |
| `@mukarram/scenes/common` | `common.tsx` | `poseTrack`، `vecTrack`، `idle` (رمش وتنفس) |
| `@mukarram-assets/fonts/*.woff2` | خطوط Cairo 800/900 | تُحمَّل بـ `loadFonts()` |
| `@mukarram-assets/sfx/*.wav` | مؤثرات | `pop`، `thud`، `click`، `tick`، `whoosh`، `chime`، `scribble`، `snap`، `creak`، `crinkle`، `boing`، `breeze`… |
| `@doublethink/characters/employee` | `reels/doublethink/...` | `Employee` (موظف بقميص وربطة)، `reach`، `armIK`، `toTorso` (IK الذراع) |
| مسار نسبي `../../../doublethink/assets/sfx/x.wav` | | `clack`، `stamp`، `rattle`، `flap`، `casters`… |
| مسار نسبي `../../../boiling-frog/assets/sfx/x.wav` | | `gulp`، `tap` |

قواعد هذا الإعداد (تعلّمناها من أعطال حقيقية):
- `webpack-override.mjs` يجبر `react` و`react-dom` و`remotion` على `node_modules` الريل نفسه، حتى لا تُحمَّل نسختان من React.
- نمرّر `webpackOverride` إلى `bundle()` يدويًا في `tools/stills.mjs`، لأن `bundle()` لا يقرأ `remotion.config.ts`.
- `remotion.config.ts` يُحزَم بصيغة CommonJS، فلا وجود فيه لـ `import.meta`. لذلك يرجع الملف إلى `process.cwd()` عند غيابه، وتحذير `"import.meta"` في السجل غير ضار.
- في `tsconfig.json` لا تضع `baseUrl` (تحت TS7 يعطي الخطأ TS5102). استعمل `paths` فقط.
- `src/assets.d.ts` يعلن `declare module '*.wav'` و`'*.woff2'`.

**أسرع بداية:** انسخ هيكل `reels/blind-obedience/` كما هو (الملفات `package.json` و`package-lock.json` و`tsconfig.json` و`remotion.config.ts` و`webpack-override.mjs` و`.gitignore` و`src/assets.d.ts`، والمجلد `src/video/{time,fonts,index,shots}.ts`، والملف `src/scenes/common.tsx`، والأدوات `tools/*`). بعد النسخ:
- غيّر `name` في `package.json`.
- غيّر البادئة في `tools/arabic-check.mjs`.
- شغّل `npm ci`.

---

## 3. المرحلة 0 — الاستلام وGit

```sh
git fetch origin claude/new-session-gmtqwj
git checkout -b claude/<slug> origin/claude/new-session-gmtqwj
ls reels/mukarram reels/doublethink reels/boiling-frog    # المراجع موجودة؟
```

اقرأ الموجز كاملًا واستخرج منه:
- المدة المستهدفة ونطاقها، مثل 88–92.
- الأصوات المطلوبة.
- الشخصيات وثوابت العالم: أي غرض موجود، وأين يقع.
- طلب الإعجاب والمتابعة: هل يجب أن يكون مسموعًا؟
- عنوان الغلاف.
- التسليمات بأسمائها.
- الممنوعات: ألوان، إنجليزية، تشخيص.

---

## 4. المرحلة 1 — البحث والتحقق

| المصدر | ما ينجح | ما يفشل |
|---|---|---|
| PubMed | `curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=<PMID>&rettype=abstract&retmode=text"` | جلب صفحة pubmed.ncbi.nlm.nih.gov (جدار ملفات تعريف) |
| PMC | `curl "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=PMCID:PMC<id>&format=json&resultType=core"` | جلب صفحة pmc.ncbi.nlm.nih.gov (reCAPTCHA) |
| مقال قديم ممسوح | `curl https://archive.org/metadata/<item>` ثم تنزيل `<name>_djvu.txt` | — |
| PDF منشور في موقع جامعة | `curl -L -o x.pdf <url> && pdftotext -layout x.pdf x.txt && grep -n ...` | — |
| البحث العام | يدلّ على المصدر فقط | لا تقتبس رقمًا منه |

اكتب في `script.md` قسم «التحقق العلمي»، وفي كل مرجع:
- الاستشهاد الكامل: المؤلفون، والسنة، والمجلة، والمجلد والصفحات، وDOI وPMID.
- ما قُرئ منه: النص الكامل، أو الملخص، أو النسخة الممسوحة.
- الجملة الأصلية التي تسند كل ادعاء، وبجانبها الجملة التي استُعملت في الريل.
- قسم «ما لم يُقل عمدًا»: الادعاءات التي حذفتها لأن مصدرها لم يُقرأ أو لأن المصادر تخالفها.

مثال من `blind-obedience`: ملخص برغر 2009 يذكر أن متواطئًا واحدًا رفض فلم تنخفض الطاعة. لذلك نُسب أثر «الشخص الواحد» إلى تجربة آش وحدها، ولم يُعمَّم على ميلغرام.

---

## 5. المرحلة 2 — النص (`script.json`)

```json
{
  "title": "…", "topic": "…", "factCheck": ["…"],
  "takes": {
    "N": { "file": "audio/take-N.wav", "words": "audio/take-N.words.json", "source": "take-N1-<genId>.mp3", "voice_id": "dlGxemPxFMTY7iXagmOj", "model_id": "eleven_v4", "who": "الراوي" },
    "E": { "file": "audio/take-E.wav", "words": "audio/take-E.words.json", "source": "…", "voice_id": "…", "model_id": "eleven_v4", "who": "شخصية ثانية" }
  },
  "roles": { "N": "راوٍ خارج الكادر", "X": "شخصية في الكادر" },
  "segments": [
    { "id": "s01", "take": "E", "role": "X", "sceneId": "lab", "tag": "[calm]", "text": "من فضلك… استمر." }
  ],
  "onScreen": [ { "id": "badge1", "text": "تجربة ميلغرام، 1963" } ]
}
```

- **`take`** تعني من أي تسجيل يُقص السطر. **`role`** تعني من يتكلم، وبها يتحرك فم الشخصية الصحيحة فقط.
- **`onScreen`** قائمة بكل نص يُرسم داخل الكادر، ويفحصها `tools/arabic-check.mjs`.
- **سرعة الكلام:** نحو كلمتين في الثانية بصوت بصيرة، بالوقفات. احسب: مدة الكلام = عدد الكلمات ÷ 2. أضف نبضات التمثيل؛ في القصص الجسدية تبلغ 15–25% من المدة.
- **الأسلوب:** لهجة خليجية بيضاء («مو»، «وش»، «محد»)، وجمل قصيرة. اكتب الأعداد بالحروف («ستة وعشرين») ليُنطق الرقم كما تريد.
- **الوقفات:** ضع «…» حيث تريد وقفة مسموعة، وأنهِ كل سطر بنقطة أو علامة استفهام أو تعجب. أداة المحاذاة تقطع الأسطر عند الوقفات.
- **الأسطر الطويلة:** قسّم السطر الطويل الذي يحتاج أفعالًا متتابعة («حرّك إصبعه… فانزلق الكوب. مسكه بذقنه…») إلى أسطر، لتضع بينها نبضات.
- **الختام:** إن طلب الموجز إعجابًا ومتابعة مسموعين فاجعلهما في آخر سطر من الصوت نفسه، لا في نص على الشاشة فقط.

---

## 6. المرحلة 3 — الصوت

استعملنا موصل ElevenLabs. إن لم يتوفر لك فاستعمل ElevenLabs REST بالمعاملات نفسها. البديل المحلي هو هوية «نديم» في
`reels/voices/nadeem/` (Chatterbox، والتعليمات في README تلك المجلد).

1. أنشئ flow واحدًا لكل ريل: `creative_create_flow`.
2. **قدّر الكلفة أولًا:** `creative_generate_speech(estimate_only=true)`. ثلاث نسخ لنص مدته 60 ثانية تكلّف نحو 2500 credit.
3. ولّد بنموذج `eleven_v4`، و`generations_count: 3`، والنص مع وسوم الأداء (`[playfully]`، `[firm]`، `[warmly]`…) وسطر فارغ بين الأسطر.
   - الراوي: `dlGxemPxFMTY7iXagmOj` (صوت بصيرة في كل الريلات).
   - أصوات استُعملت للشخصيات: `rpGHcNQJvO8dFNNFNj1v` (فهد، سعودي ودود)، و`JAFpvTRfGNCbJ2St9kyT` (صابر، فصيح عميق).
   - اختر الأصوات من `creative_list_voices`، ولا تخترع معرّفًا.
4. استعلم بـ `creative_get_flow_run_status` حتى ينتهي التوليد، ثم نزّل كل `content_url` بـ `curl` إلى `audio/take-N1-<generationId>.mp3`. **الروابط الموقّعة تنتهي بعد ساعتين.**
5. افرز النسخ بعدد الوقفات:
   ```sh
   ffmpeg -i take.mp3 -af silencedetect=n=-40dB:d=0.25 -f null - 2>&1 | grep -c silence_end
   ```
   النسخة التي تُدمج أسطرها بلا وقفات صعبة القص.
6. **تفريغ مستقل لكل نسخة مرشحة:**
   - أضفها بـ `creative_attach_reference_file(url=<content_url>, flow_id=…)`، ثم فرّغها بـ `creative_transcribe_audio(model_id="eleven_scribe_v1", connect_from=[node])`.
   - نزّل `words_download_url` ثم حوّله:
     ```python
     [{'w': x['text'], 's': x['start'], 'e': x['end']} for x in words if x['type'] == 'word']
     ```
     واحفظ النتيجة في `audio/take-N.words.json`.
   - **لا تفرّغ عقدة التوليد نفسها:** تعيد نص الطلب مع الوسوم، ولا تعطي ما نُطق فعلًا.
   - أدوات رفع الملفات المحلية قد تكون مرفوضة؛ إرفاق الرابط يعمل.
7. اختر النسخة التي سُمعت فيها كل الكلمات، ثم الأقل في أخطاء النطق. مثال: «الريل» سُمعت «الrail» في نسخة فاستُبعدت.
8. المصطلح الصعب (مثل «السوسيوتروبية») يبقى في النص فقط إذا سمعه التفريغ صحيحًا.
9. حوّل النسخ المختارة إلى WAV (هذه الملفات لا تُرفع):
   ```sh
   ffmpeg -i take-N1-….mp3 -ar 48000 -ac 1 audio/take-N.wav
   ```

---

## 7. المرحلة 4 — التوقيت (`tools/align.py`)

```sh
python3 tools/align.py
```

**ما يفعله:**
1. يطابق كلمات النص (بعد التطبيع: حذف الحركات، وتوحيد أ/إ/آ وة/ه وى/ي) بكلمات تفريغ نسخته، باستعمال `difflib.SequenceMatcher`.
2. يقص كل سطر من نسخته في منتصف الوقفة المحيطة به. إن لم توجد وقفة لأن النسخة وصلت سطرين ببعضهما، يقص عند أهدأ 10 مللي ث، ويتشاركه السطران.
3. يضبط ربحًا واحدًا لكل نسخة إلى **−16 LUFS**، ويضيف حدًّا للذروة وتلاشيًا قصيرًا عند الطرفين. **لا تغيير للسرعة.**
4. يصفّ الأسطر بترتيب النص:
   - سطران متجاوران من النسخة نفسها يحتفظان بوقفتها الطبيعية.
   - عند تبدّل المتكلم تُترك `TURN = 0.32` ث.
   - `SEG_BEATS[id]` تضيف ثواني صورة بلا كلام **قبل** السطر، للتمثيل والضحكة والصمت.
5. **يكتب:**
   - أسطر الصوت `assets/audio/voice/sNN.wav`.
   - `timeline.json`: المدة، و`fileStart` و`start` لكل سطر، والمشاهد.
   - `src/video/words.json`: زمن كل كلمة على الخط الزمني النهائي.
   - `src/video/envelope.json`: غلاف فم لكل `role`، قيمة واحدة لكل إطار.
   - `output/captions.ar.srt`: مقاطع مرتبة زمنيًا بتوقيت الكلمات، ولا تتجاوز 46 حرفًا.
   - `audio/alignment.json`: كلمة النص مقابل الكلمة المسموعة.

**الضبط:** المدة المقيسة = `LEAD` + الكلام + الوقفات + النبضات + `HOLD`. للوصول إلى الهدف عدّل `SEG_BEATS` أو `HOLD`، ولا تعدّل السرعة أبدًا. نطاق التحذير مكتوب في السكربت (`if not A <= TOTAL <= B`)، فعدّله لكل ريل.

---

## 8. المرحلة 5 — البناء البصري

### 8.1 العقد الزمني

`src/video/time.ts` يعطيك:
- `sec(s)`: يحوّل الثواني إلى إطار.
- `segStart(id)`: بداية سطر.
- **`wordAt(seg, word, n?)`** و`wordEnd(...)`: إطار بداية كلمة منطوقة أو نهايتها. المطابقة تتجاهل الحركات وعلامات الترقيم، وتعمل على بداية الكلمة.
- `prog(f, from, dur, ease)`: تقدّم من 0 إلى 1.
- `keys(f, [[frame, value], …])`: قيمة تتنقل بين مفاتيح.
- `ease.{out, inOut, in, back, linear}`.

**كل حركة تُربط بكلمة، لا بثانية ثابتة.** اجمع المفاتيح في دالة واحدة:

```ts
const beats = () => ({ cupLand: wordAt('s01', 'صغير') + 3, shut: wordAt('s12', 'فعلق') + 6, … });
let cache = null; export const B = () => (cache ??= beats());
```

### 8.2 اللقطات (`storyboard.json` ← `src/video/shots.ts`)

```json
{ "shots": [ { "id": "sh05", "component": "LastSwitch", "anchor": { "seg": "s04", "word": "وصلوا", "off": -0.1 },
               "size": "قريبة جدًا", "audio": "…", "motive": "…", "action": "…", "face": "…", "rhythm": "…", "cut": "…" } ] }
```

- اللقطة تبدأ عند `anchor`، وتنتهي حيث تبدأ اللقطة التالية. الصيغ الممكنة: `{at: ثوانٍ}`، أو `{seg}`، أو `{seg, word, n, off}`.
- كل لقطة مكوّن React يستقبل `{ f, t0, t1 }` (الإطار الحالي، وبداية اللقطة ونهايتها)، ويصدَّر من `src/scenes/shots.tsx`.
- الأمر `node tools/storyboard.mjs` يولّد `storyboard.md` من الحقول الوصفية. عدّل القالب داخله ليطابق حقول موجزك. والأمر `--frames` يطبع إطار البداية والوسط والنهاية لكل لقطة، للمعاينة.

### 8.3 نمطان للعالم

| النمط | متى | مثال |
|---|---|---|
| **عالم واحد متصل** | قصة تنتقل فيها أغراض بين أيدٍ ويجب ألا تظهر أو تختفي عند القطع | `power-of-no-b/src/scenes/world.tsx`: دوال `worker(f)` و`colleague1(f)`… تعيد الموقع والوضعية والأغراض، وتكتفي اللقطات باختيار الكاميرا |
| **أماكن منفصلة** | شرح بمشاهد مستقلة (مختبر، غرفة، سبورة) | `blind-obedience/src/scenes/shots.tsx`: `LabShot` و`AschShot` و`BoardShot` |

### 8.4 الشخصيات والأيدي والأغراض

- تُبنى الشخصية بـ `<Person x y s pose expr blink bob look glance talk build torsoDetail headFront itemL itemR />`.
  - نقطة الأصل الأرض بين القدمين.
  - `pose.armL`/`armR` = `[زاوية الكتف، انحناء المرفق]`.
  - `lean` و`tilt` و`squash` لإمالة الجذع والرأس والضغط.
- **اليد على شيء:**
  - إلى نقطة في العالم: `reach(pose, at, L, R)` (لبنية الموظف)، أو `reachB(build, …)` في `power-of-no-b/src/characters/worker.tsx` لأي بنية.
  - إلى نقطة في فضاء الجذع: `armIK`.
  - لمعرفة موقع اليد في العالم: `handAt(build, pose, side, at)`.
- **الأغراض تُرسم في فضاء العالم عند موقع اليد.** أي لا تستعمل `itemL` إلا لغرض لا ينتقل بين الأيدي. التسليم = `lerp` بين يد المعطي ويد الآخذ، ثم يتبدّل الحامل في إطار تتطابق فيه النقطتان.
- **ترتيب الرسم يحدد العمق.** في `blind-obedience` كانت يد المشارك خلف لوحة المفاتيح؛ الحل كان رسم المشارك بعد اللوحة.
- **لا تجعل دالة شخصية تستدعي دالة شخصية أخرى تستدعيها بدورها** (حلقة لا نهائية). استعمل نقاط لقاء ثابتة مثل `meetCup()` و`meetBag()`.
- **الوجوه:** `EXPRESSIONS`، وتعابير إضافية `X` في `src/scenes/common.tsx`. الأداة `xTrack(f, [[frame, expr], …])` تمزج بين التعابير خلال 4 إطارات. لا تكرر الوجه نفسه في لقطتين متتاليتين.
- **الفم:** `talkAt(f, role)` من `envelope.json`، فيتحرك فم كل شخصية على أسطرها فقط.

### 8.5 طبقة الحركة (`reels/motion` ← `@motion/index`)

ساعة واحدة: إطار Remotion. كل طبقة دالة في `t = frame / fps` بالثواني، فيُرسم أي إطار وحده وبأي ترتيب، بـ 30 أو 60. التفاصيل والقرارات في `reels/motion/README.md`، والمثال الكامل `reels/idea-flight`.

| الحاجة | الأداة | ملاحظة |
|---|---|---|
| كاميرا، هزة، قفزة، ظهور بارتداد، نبض، عناوين HTML | GSAP عبر `useGsapTimeline` الرسمية (`@remotion/gsap`) + `popIn`/`hop`/`swing`/`shake`/`pulse`/`camera`، و`<GsapCamera>` | أهداف عناصر فقط. لا `play()` ولا callbacks ولا random. محور SVG بـ `svgOrigin` |
| رسم خط، أثر متحرك، جسم على مسار، تحوّل شكل، دائرة تمييز يدوية | `@remotion/paths`: `DrawPath`، `drawn(d, p, from)`، `alongPath(d, p)`، `morph`، `scribbleLoop` | لا مكتبة مسارات ثانية (لا MotionPath ولا DrawSVG) |
| أرقام الـ rig (وضعيات، IK، وجوه) | `tween`/`keys` بثوانٍ وأسماء easing من GSAP (`ease('back.out(1.7)')`)، أو أدوات mukarram بـ `f30` | `blinkAt(Math.floor(f30), 30, seed)`؛ `Boil t={t}` |
| شخصية Rive بآلة حالات | `<RiveActor src artboard stateMachine inputs={[{at, name, value?}]} fallback>` داخل `<foreignObject>` | لا `@remotion/rive`: يتقدم بفرق الإطارات (يتأثر بالترتيب) ويجلب WASM من الشبكة ولا يشغّل آلات الحالة |

- **اكتب المشهد بالثواني** لا بعدد الإطارات. الصوت والمؤثرات توضع بـ `Math.round(s * fps)`.
- **60 إطارًا/ث** للإنتاجات الجديدة: `timeline.json.fps = 60`. سجّل `Reel30` (المشهد نفسه بـ 30) لاختبار التطابق.
- **GSAP والـ rig معًا:** GSAP يحرك المجموعات (`<g data-actor>`)، والـ rig يحسب الأطراف من `t`. ما تمسكه اليد يُرسم داخل المجموعة نفسها، فيقفز معها.
- **اختبارات العرض:** `node tools/render-tests.mjs` في الريل. تتحقق من تطابق الإطار بأي ترتيب، وتطابق 30 و60 عند الثانية نفسها، ورسم Rive، وبديله عند الفشل، وفك MP4.

### 8.6 قواعد تصميم الكادر

- الأبعاد 1080×1920، والإطارات 30 في الثانية (أو 60 للإنتاجات الجديدة: §8.5).
- **المنطقة الآمنة** (`SAFE`): المحتوى المهم بين y=250 وy=1560، ولا يتجاوز x=900 من اليمين (أزرار المنصة).
- **الغلاف:** العنوان داخل قص 3:4، أي بين y=240 وy=1680. تحقق بصورة رُسم عليها الإطار:
  ```sh
  ffmpeg -i out/cover.png -vf "scale=540:960,drawbox=x=0:y=120:w=540:h=720:color=yellow@0.9:t=3" check.png
  ```
- **الألوان:** أزرق بصيرة `#2E7BC5`، وأحمر `#E63946`. العوالم الداكنة تبرز الوجوه البيضاء. التزم بممنوعات الموجز.
- **الخط:** Cairo 800/900 عبر `loadFonts()`. استدعِ `loadFonts()` في كل ملف composition، بما فيه `Cover.tsx`.
- **نص SVG العربي:** `direction="rtl"` مع `textAnchor="middle"`. بدون `textAnchor` يمتد النص يسارًا من x ويخرج من الكادر.
- **الحركات الصغيرة:** تجنبها في النصوص الصغيرة. «وصلتُ» بضمة بدت «وصلث» بحجم صغير، فكُتبت «وصلت».
- **اللوحات الثابتة:** النصوص الشارحة (شارات المصدر، الأختام، الأيقونات) طبقة HTML عبر `overlay` في `<Shot>`، فتبقى حادة.
- **الخطّاف:** حركة من الإطار الأول قبل أي عنوان.
- **الختام:** «إعجاب» و«متابعة» أيقونتان صغيرتان في آخر ثانيتين فقط، لا بطاقة ثابتة.

---

## 9. المرحلة 6 — المعاينة (قبل أي تصدير كامل)

```sh
npx tsc --noEmit -p .
export REMOTION_CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
node tools/storyboard.mjs --frames                   # إطارات منتصف كل لقطة
node tools/stills.mjs /tmp/x mids 38 140 260 …       # ورقة تماس 5 أعمدة
npx remotion render src/video/index.ts Reel /tmp/animatic.mp4 --scale=0.25 --muted --crf=30
python3 tools/motion.py /tmp/animatic.mp4 /tmp/motion.json   # أطول سكون لكل لقطة
ffmpeg -i /tmp/animatic.mp4 -vf "fps=1.5,scale=135:240,tile=15x8" -frames:v 1 /tmp/sheet.png
```

انظر في الصور وتحقق من:
- اليد على الغرض فعلًا.
- النص غير مقصوص عند الحافة.
- الوجوه غير مغطاة.
- الغرض لا يقفز بين لقطتين.
- العمود أو الرقم يقول ما يقوله المصدر.

ثم أصلح العيب وأعد معاينة الإطارات المتأثرة فقط. **صدّر التصدير الكامل مرة واحدة**، بعد أن تختفي العيوب المعروفة.

---

## 10. المرحلة 7 — المؤثرات

- **المؤثرات الجديدة** تُولَّد في `tools/sfx.py` بـ numpy مع بذرة ثابتة، وتُكتب إلى `assets/sfx/*.wav`. أمثلة: `buzz` و`whomp` و`hum`.
- **ما عدا ذلك يُستورد** من الريلات الأخرى، بلا نسخ.
- **الملف `src/video/sfx.tsx`** فيه قائمة `[ملف، إطار، حجم]` مربوطة بـ `B()`:
  - الحجم بين 0.04 و0.22.
  - أعلى المؤثرات هو النكتة أو الذروة.
  - لا يغطي مؤثر على الكلام.

---

## 11. المرحلة 8 — التصدير

```sh
npx remotion render src/video/index.ts Reel out/render-raw.mp4 --audio-codec=aac --audio-bitrate=192k --log=error
ffmpeg -i out/render-raw.mp4 -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 18 \
  -profile:v high -movflags +faststart -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a copy output/final_reel.mp4
npx remotion still src/video/index.ts Cover out/cover.png && ffmpeg -i out/cover.png -q:v 2 publish/cover-1080x1920.jpg
```

- يأخذ التصدير 10–20 دقيقة لريل مدته 70–90 ثانية، فشغّله في الخلفية واكتب التوثيق في أثنائه.
- `remotion.config.ts` يضبط JPEG 95، وyuv420p، وh264 بـ CRF 18، و4 مسارات متوازية.

---

## 12. المرحلة 9 — الفحص

```sh
python3 tools/verify.py output/final_reel.mp4            # → output/qa-technical.json
python3 tools/synccheck.py output/final_reel.mp4 > output/qa-sync.json
python3 tools/motion.py output/final_reel.mp4            # → output/qa-motion.json
node tools/arabic-check.mjs                              # → output/qa-arabic-check.json
```

| البند | المطلوب |
|---|---|
| المواصفات | 1080×1920، 30/1، H.264 High، yuv420p، AAC 48 kHz، وعدد الإطارات = `timeline.durationInFrames`، و0 فروق توقيت شاذة |
| المدة | ضمن نطاق الموجز |
| الجهارة | نحو −16 LUFS متكامل، وذروة حقيقية ≤ −1 dBTP (حصلنا عادة على −4) |
| السواد والتجميد | لا شيء، أو مقصود ومشروح |
| فترات بلا كلام > 0.8 ث | كل واحدة نبضة تمثيل مقصودة؛ اسردها في التقرير |
| التزامن | كل الأسطر وُجدت في المزيج بالترابط المتقاطع (`synccheck`)، وأقصى انحراف ≤ 20 مللي ث. كاشف بدايات الكلام في `verify` قد يفوّت سطرًا يبدأ بلا صمت قبله؛ الترابط هو الحكم |
| الحركة | أطول سكون داخل لقطة ≲ 2 ث، إلا لقطة ختام مقصودة |
| طلب الإعجاب والمتابعة | سطره موجود في المزيج (`qa-sync.json`) + جهارة نافذته (`ffmpeg -ss … -t … -af ebur128`) + موجود في SRT |
| نصوص الشاشة | `arabic-check` يعطي 0 أخطاء. خطأ `text.clipped-word` قد يأتي من قالب الكاروسيل الذي يستعمله الفحص لا من الريل؛ تحقق بصورة ثابتة واكتب ذلك |
| الغلاف | العنوان داخل قص 3:4 (صورة التحقق) |

**`output/qa_report.md`** بأربعة أقسام منفصلة:
1. النتائج التقنية (جدول).
2. الحكم الإبداعي، بما فيه نقاط الضعف التي تراها.
3. ما تعذر فحصه مباشرة: «لم أستمع ولم أشاهد بزمن حقيقي»، و«ما لم يُقرأ من المصادر».
4. التغييرات الفعلية عن المقترح.

واحفظ أيضًا ورقة تماس (`output/contact_sheet.jpg`، إطار منتصف كل لقطة):

```sh
ffmpeg -i output/final_reel.mp4 -vf "select='eq(n\,46)+eq(n\,112)+…',scale=216:384,tile=10x3" -frames:v 1 -vsync vfr output/contact_sheet.jpg
```

### 12.1 البوابات الآلية (`reels/tools/qa_gates.py`)

بنود الجدول أعلاه صارت اختبارات تنجح أو تفشل. كل ريل يحمل في `script.json` كتلة `qa` يُفحص آليًا:

```json
"qa": { "duration": [88, 92], "cta": { "seg": "s29", "srt": "تابعنا" }, "maxStillSeconds": 2.0, "stillAllow": [],
        "maxSilenceSeconds": 0.8, "renderTests": true,
        "waive": { "arabic": ["text.clipped-word"] }, "waiveReason": "سبب الإعفاء مكتوبًا" }
```

```sh
python3 reels/tools/qa_gates.py reels/<slug>            # من القياسات المحفوظة output/qa-*.json
python3 reels/tools/qa_gates.py reels/<slug> --measure  # يعيد القياس من final_reel.mp4 (ffmpeg + numpy + node)
python3 reels/tools/qa_gates.py --all --measure          # كل ريل فيه كتلة qa
python3 reels/tools/qa_gates.py --self-test              # منطق البوابات نفسه
```

| البوابة | تفشل إذا |
|---|---|
| `fresh` | القياسات المحفوظة أُخذت من ملف MP4 غير الموجود الآن (حجمه مختلف) |
| `spec` / `frames` | ليس H.264/yuv420p/1080×1920/AAC 48 kHz بمعدل `timeline.fps` (30 أو 60)، أو عدد الإطارات ≠ `timeline.durationInFrames`، أو التوقيت غير منتظم |
| `duration` | المدة خارج `qa.duration` |
| `loudness` | الجهارة خارج −16 ± 1 LUFS، أو الذروة الحقيقية > −4 dBTP |
| `black/freeze` | يوجد سواد، أو تجميد > 3 ث |
| `silence` (اختيارية: `maxSilenceSeconds`) | صمت أطول من الحد (−45 dB). لا يفرضها الريلان السابقان: في `power-of-no-b` تسع فترات صمت > 0.8 ث |
| `render tests` (اختيارية: `renderTests`) | `output/qa-render-tests.json` فيه اختبار فاشل أو غائب |
| `sync` | سطر من `timeline.json` غير موجود في المزيج، أو انحراف > 20 مللي ث |
| `motion` | لقطة (غير مستثناة في `stillAllow`) فيها سكون أطول من `maxStillSeconds` |
| `arabic` | خطأ من فحص استوديو بصيرة غير معفى. الإعفاء يحتاج `waiveReason` مكتوبًا |
| `on-screen text` | حرف لاتيني أو رقم شرقي (٠–٩) في `onScreen` |
| `srt` | مقاطع غير مرتبة أو متداخلة، أو مقطع > 46 حرفًا، أو حرف لاتيني |
| `cta` | سطر `qa.cta.seg` غير موجود في المزيج، أو العبارة `qa.cta.srt` غائبة عن SRT |
| `voice` | كلمة من النص لم يسمعها التفريغ المستقل (`audio/alignment.json`) |
| `manifest` | ملف له `sha256` في `asset_manifest.json` مفقود أو تغيّر |
| `cover` | الغلاف مفقود أو ليس 1080×1920 |

**في GitHub:** يشغّل `.github/workflows/reel-qa.yml` الاختبار الذاتي ثم `--all --measure` على كل PR يمس `reels/`. ووظيفة ثانية (`motion`) تشغّل اختبارات `reels/motion` والتحقق من الأنواع واختبارات العرض في `reels/idea-flight`.
ما بقي يدويًا: هل العنوان داخل قص 3:4، والحكم الإبداعي، والسماع والمشاهدة.

---

## 13. المرحلة 10 — التوثيق والنشر

| الملف | محتواه |
|---|---|
| `script.md` | النص المقفول في جدول (المعرّف، والمتكلم، والنص، والنبرة)؛ والأصوات ومعرّفاتها ولماذا اختيرت النسخة؛ ونتيجة التفريغ المستقل؛ والتحقق العلمي (القسم 4) |
| `storyboard.md` | يولّده `tools/storyboard.mjs` |
| `assets/asset_manifest.json` | لكل أصل: المسار، والمصدر (معرّف التوليد والـflow)، والحقوق، وبصمة sha256 للأصول الأساسية |
| `publish/cover-1080x1920.jpg` | من مكوّن `Cover` |
| `publish/publish.md` | Instagram وFacebook وYouTube Shorts وX: العنوان على الغلاف، والكابشن، والوسوم، ورفع SRT، وتنبيه المحتوى المولّد آليًا في يوتيوب. اذكر حدود X (Title ≤ 70، وDescription ≤ 200، والمنشور ≤ 280) وقِس الأطوال بـ `python3 -c "print(len(s))"` |
| `README.md` | ماذا يوجد وأين، وما أُعيد استعماله، وأوامر إعادة الإنتاج بالترتيب |

---

## 14. المرحلة 11 — الحفظ والمراجعة

```sh
git add reels/<slug>
git commit -m "…" -m "Co-Authored-By: … " -m "…"      # لا تذكر اسم النموذج في الرسالة
for i in 1 2 3 4; do git push -u origin claude/<slug> && break; sleep $((2**i)); done
```

- **PR مسودة** من `claude/<slug>` إلى `claude/new-session-gmtqwj`. اقرأ حالته بعد الإنشاء: الأساس، والمسودة، و`mergeable_state`، وعدد الملفات.
- **إن فتحت واجهة Claude Code طلبًا تلقائيًا** على أساس `claude/wonderful-lamport-ep2m3e`، تظهر مئات الملفات وتعارض. غيّر الأساس إلى `claude/new-session-gmtqwj` واجعله مسودة: حدّث `base` في طلب، و`draft` في طلب آخر.
- **إن دُمج الطلب قبل أن تنتهي** (مثلًا قبل اكتمال التصدير):
  1. لا تضف شيئًا فوق تاريخ مدموج.
  2. شغّل `git checkout -B claude/<slug> origin/claude/new-session-gmtqwj`.
  3. أضف الباقي وادفعه (دفع fast-forward بلا force).
  4. افتح PR مسودة جديدًا.
- **لا تسلّم رابطًا قبل التحقق من وجوده.**
  - تحقق بالأمر `git ls-tree -l origin/<branch> reels/<slug>/output/final_reel.mp4`.
  - رابط التحميل: `https://github.com/<owner>/<repo>/raw/<branch>/reels/<slug>/output/final_reel.mp4`.

---

## 15. أعطال واجهناها وحلولها

| العَرَض | السبب | الحل |
|---|---|---|
| `path argument undefined` عند التصدير | `import.meta` فارغ في config مُحزَم CJS | الرجوع إلى `process.cwd()` في `webpack-override.mjs` |
| الصور الثابتة لا تجد `@mukarram` | `bundle()` يتجاهل `remotion.config.ts` | مرّر `webpackOverride` إلى `bundle()` |
| TS5102 | `baseUrl` في tsconfig تحت TS7 | احذفه واترك `paths` |
| تداخل سطرين عند القص | النسخة لم تقف بينهما | القص عند أهدأ 10 مللي ث مشتركًا بينهما (موجود في `align.py`) |
| SRT غير مرتب زمنيًا | أسطر نسختين متداخلة | `caps.sort(key=start)` قبل الدمج (موجود) |
| الروابط الموقعة من ElevenLabs لا تعمل | تنتهي بعد ساعتين | نزّل الملفات فورًا |
| التفريغ يعيد الوسوم `[playfully]` | فرّغت عقدة التوليد | أرفق `content_url` كملف مرجعي وفرّغه |
| PubMed/PMC لا يُجلب | جدار ملفات تعريف/reCAPTCHA | E-utilities / Europe PMC / archive.org |
| `Maximum call stack` في دوال الشخصيات | استدعاء متبادل | نقاط لقاء ثابتة |
| اليد خلف الغرض | ترتيب الرسم | ارسم الشخصية بعد الغرض |
| نص عربي يخرج من الكادر | `direction="rtl"` بلا `textAnchor` | `textAnchor="middle"` |
| فقاعة أو نص مقصوص عند حافة الكادر | موقعه بالنسبة لجسم الشخصية لا للكاميرا | ضعه فوق الرأس واحسب حدود الكادر من `zoom` (عرض الكادر = 1080/zoom) |
| لقطات سبورة ثابتة > 2 ث | لا حركة | دفع بطيء للكاميرا (`zoom + 0.0012*(f-t0)`) |

---

## 16. قائمة التسليم (تحقق منها قبل الرد على المستخدم)

- [ ] `python3 reels/tools/qa_gates.py reels/<slug> --measure` ← `ALL GATES PASS` (و`script.json` فيه كتلة `qa`)
- [ ] `output/final_reel.mp4` ضمن المدة، والفحوص التقنية كلها ✓
- [ ] طلب الإعجاب والمتابعة مسموع، وفي SRT، والأيقونتان في آخر ثانيتين
- [ ] `output/captions.ar.srt` مرتب ومقروء
- [ ] `publish/cover-1080x1920.jpg` عنوانه داخل قص 3:4
- [ ] `script.md` فيه التحقق، وما قُرئ فعلًا، وما حُذف عمدًا
- [ ] `storyboard.md` بالحقول التي طلبها الموجز
- [ ] `output/qa_report.md` بأقسامه الأربعة، بلا ادعاء سماع أو مشاهدة
- [ ] `assets/asset_manifest.json` و`publish/publish.md` و`README.md`
- [ ] commit + push + PR مسودة على `claude/new-session-gmtqwj`، وحالته مقروءة
- [ ] رابط التحميل تحققت من وجوده قبل إرساله

---

## 17. بدايات جاهزة حسب نوع الريل

| تريد | انسخ من | لماذا |
|---|---|---|
| قصة جسدية بأغراض تنتقل بين الأيدي | `reels/power-of-no-b/src/scenes/world.tsx` | `mover()` (مشي من مفاتيح x)، `reachB`/`handAt`/`torsoToWorld`، الأغراض في فضاء العالم، خيال/واقع بالزاوية نفسها |
| شرح علمي بأرقام ومصادر | `reels/blind-obedience/src/scenes/shots.tsx` و`src/characters/lab.tsx` | `Badge` (المصدر أعلى الشاشة) و`Stamp` (رقم كبير) في shots؛ `Board`/`Chalk` (سبورة تُكتب) و`HeadGrid` (40 رأسًا تحمرّ) و`Generator` و`AschCard` في lab |
| راوٍ في استوديو مع مايك | `reels/mukarram/src/scenes/mic.tsx` | الراوي الأصلي ومكتبه |
| شخصية غير بشرية بضغط وتمدد | `reels/boiling-frog/src/characters/frog.tsx` | rig الضفدع |
| مكتب وأختام وأوراق | `reels/doublethink/src/characters/office.tsx` | `Door`، `Memo`، `StampTool`، `Chair` |
| لقطة متصلة بكاميرا سينمائية بـ 60 إطارًا، طائرة/غرض على مسار، رسم يظهر، شخصية Rive | `reels/idea-flight/src/scene/Scene.tsx` | `GsapCamera`، `alongPath` + IK للإمساك، `morph` ورقة ⇄ طائرة، `DrawPath`، `RiveActor` بآلة حالات، عناوين HTML بـ GSAP، `Reel30` واختبارات العرض |
