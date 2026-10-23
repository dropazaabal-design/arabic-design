# إعلان «بكج افهم نفسك» (كتاب وبس)

إعلان من 44.5 ث بنسختين، ريل 1080×1920 وFeed 1080×1350، بمعدل 60 إطارًا/ث، مبني في Remotion.

**المقاسان من مصدر واحد:** كل المشاهد مصممة على لوحة واحدة مقاسها 1080×1350.
- **Feed:** هو اللوحة نفسها.
- **الريل:** يضع اللوحة بين y=285 وy=1635، ويمدّ الخلفية وحدها فوقها وتحتها.

لا تمديد للصورة ولا قص للنص.

## الملفات
| المسار | ما فيه |
|---|---|
| `src/config.ts` | **كل ما قد تريد تغييره:** النصوص، الألوان، المسارات وأعداد صفحاتها، الرابط، الخطوة المعروضة، **والسعر (`PRICE`، معطّل افتراضيًا)** |
| `src/timing.ts` | الساعة من التسجيل، وبدايات المشاهد مربوطة بكلمات منطوقة |
| `src/shelf.tsx` | المشهدان 1–2: الرف والـStickman وعلامة القراءة التي تصير خطًا |
| `src/scenes.tsx` | المشاهد 3–7: الأغلفة (كائن واحد يتنقل بين المشاهد)، والمسارات، والصفحات، والهاتف، والختام |
| `src/type.tsx` | تحريك العربية كلمةً كلمة، والكلمة لا تُقسَّم إلى حروف |
| `src/parts.tsx` | الغلاف ثلاثي الأبعاد، والـStickman، وأيقونة الملف، والشارات، والشعار |
| `src/cues.ts` | المؤثرات الصوتية، كل مؤثر على إطار فعله |
| `src/Ad.tsx` | اللوحة والخلفية، وتركيب المقاسين |
| `narrative/units.json` | نص التعليق المنطوق، ونصه على الشاشة بالأرقام |
| `narrative/beats.json` | الوقفات بين السطور، ليقع كل مشهد على وقته |
| `audio/takes/` | التسجيلان، و`VO.mp3` نسخة من التسجيل المختار |
| `audio/align/` | توقيت الكلمات من Scribe |
| `audio/lines/` | السطور مقطوعة من التسجيل |
| `timing/asr-take1.json`، `timing/asr-take2.json`، `timing/asr.json` | التفريغ المستقل (Whisper small، محليًا) |
| `publish/script.md` | نص التعليق وتوقيت المشاهد |
| `REPORT.md` | ما نُفّذ، وما فُحص، وما تعذّر |

## إعادة البناء
```sh
# 0. صفحات المنتج (لا تُرفع إلى المستودع العام): من ملفات PDF الستة S1.pdf … S6.pdf
for n in 1 2 3 4 5 6; do pdftoppm -png -r 160 -f 1 -l 1 -singlefile S$n.pdf public/covers/s$n; done
for p in 5 6 7 8; do pdftoppm -png -r 200 -f $p -l $p -singlefile S2.pdf public/pages/s2-p$p; done

# 1. الصوت والتوقيت (الأدوات من reels/cr1-ep08-muwazzaf-araa/tools)
T=../../reels/cr1-ep08-muwazzaf-araa/tools
PROJECT_ROOT=$PWD python3 $T/voice.py cut                         # audio/takes/VO.mp3 + audio/align/VO.words.json → audio/lines/
PROJECT_ROOT=$PWD python3 $T/timeline.py $PWD/audio/lines         # → timing/lines.json, timing/words.json
PROJECT_ROOT=$PWD HUDOO_MODELS=<models> python3 $T/voice.py check # → timing/asr.json
PROJECT_ROOT=$PWD SRT_NAME=efhamnafsak-ad.ar.srt python3 $T/srt.py

# 2. المؤثرات والمزج: −16 LUFS، والذروة الحقيقية −4.5 dBTP، بلا موسيقى
S=$(mktemp -d)
npx esbuild tools/cues.ts --bundle --platform=node --format=esm --outfile=$S/cues.mjs && node $S/cues.mjs
python3 tools/mix.py

# 3. التصيير (H.264، yuv420p، BT.709، AAC، faststart)
tools/render.sh Reel export/efhamnafsak-ad-reel-1080x1920-60fps.mp4
tools/render.sh Feed export/efhamnafsak-ad-feed-1080x1350-60fps.mp4

# 4. الفحص، ولقطات المراجعة
PROJECT_ROOT=$PWD QA_NAME=reel python3 ../../films/hudoo/tools/qa.py export/efhamnafsak-ad-reel-1080x1920-60fps.mp4
PROJECT_ROOT=$PWD QA_NAME=feed python3 ../../films/hudoo/tools/qa.py export/efhamnafsak-ad-feed-1080x1350-60fps.mp4
node tools/snap.mjs review/x $(for f in $(python3 tools/frames.py | tail -1); do echo FeedSilent@$f ReelSilent@$f; done)
```

**السعر:** `PRICE = { show: true, text: '…' }` في `src/config.ts` يُظهر السعر بجانب زر الدعوة، ثم يُعاد التصيير. لا يوجد في الإعلان خصم ولا عدّ تنازلي ولا «لفترة محدودة».

**المتطلبات:**
- `node_modules` رابط إلى مشروع ريلز آخر في المستودع، فيه Remotion 4.0.534.
- الخطوط Tajawal وCairo في `public/fonts`، وتُحمَّل قبل أول إطار.
