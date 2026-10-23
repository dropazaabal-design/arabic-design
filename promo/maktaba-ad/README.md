# إعلان «مكتبة الوعي البصري» (كتاب وبس)

فيديو تسويقي مدته 46 ثانية بصيغتين:
- `export/maktaba-reel.mp4` بمقاس 1080×1920 (9:16)
- `export/maktaba-feed.mp4` بمقاس 1080×1350 (4:5)

كلاهما 60 إطارًا في الثانية، والصورة فيهما مبنية على صفحات المنتج الحقيقية من ملف الـPDF.

- التقرير: `REPORT.md`
- النص النهائي: `publish/script.md`
- العنوان والكابشن والافتتاحيتان البديلتان: `publish/caption.md`

## البنية
| المسار | المحتوى |
|---|---|
| `source/maktaba-alwaei-albasari.pdf` | ملف المنتج كما وصل (57 صفحة) |
| `public/pages/pNN.png` | صفحات محوّلة منه بدقة 220 نقطة في البوصة: 1، 3، 4، 14، 15، 16، 25، 26، 36، 37، 52 |
| `public/thumbs/t-NN.png` | مصغّرات صفحات القواعد الخمسين (الصفحات 4–56 ما عدا القوالب 14 و25 و36) |
| `narrative/script.txt` | النص المقفل، مشكولًا كما يقرؤه مولّد الصوت |
| `audio/lines/*.wav` | سطور الصوت التسعة |
| `audio/narration.wav` | السطور مجمّعة |
| `timing/lines.json` | توقيت السطور |
| `timing/words.json` | توقيت الكلمات |
| `timing/asr.json` | فحص الوضوح الآلي (Whisper) |
| `public/audio/mix.wav` | المزج النهائي: الصوت والبيانو والمؤثرات |
| `src/scenes.tsx` | المشاهد الثمانية على مسرح 1080×1350 |
| `src/Ad.tsx` | الصيغتان: الريل يضع المسرح في الشريط الأوسط ويمدّ الخلفية |
| `src/Cover.tsx` | غلاف الريل |
| `publish/` | الأغلفة والكابشن والنص |
| `export/` | الفيديوهان وملف الترجمة |
| `qa/` | نتائج الفحص الآلي ولقطات المراجعة |

## ما ليس في المستودع
المستودع عام، لذلك لا يُرفع إليه شيء من المنتج المدفوع ولا شيء يعرض صفحاته:
- ملف الـPDF
- الصفحات المحوّلة والمصغّرات
- الفيديوهان والأغلفة
- لقطات المراجعة
- المزج (`mix.wav`)، لأن `tools/mix.py` يعيد بناءه

كل ذلك موجود في الملف المضغوط المسلَّم. لإعادة توليد الصفحات من الـPDF:

```sh
mkdir -p public/pages public/thumbs
for n in 1 3 4 14 15 16 25 26 36 37 52; do pdftoppm -png -r 220 -f $n -l $n -singlefile source/maktaba-alwaei-albasari.pdf public/pages/p$(printf %02d $n); done
pdftoppm -png -scale-to-x 240 -scale-to-y -1 -f 4 -l 56 source/maktaba-alwaei-albasari.pdf public/thumbs/t
```

## إعادة البناء
الأدوات مشتركة مع الفيلم في `films/hudoo/tools`، ويُحدَّد لها المشروع بالمتغير `PROJECT_ROOT`.

```sh
# 1. الصوت: ElevenLabs (dlGxemPxFMTY7iXagmOj) في audio/takes/AD.mp3، ومحاذاة Scribe في audio/align/AD.words.json
T=../../reels/cr1-ep08-muwazzaf-araa/tools
PROJECT_ROOT=$PWD python3 $T/voice.py cut                         # → audio/lines/NNN.wav
PROJECT_ROOT=$PWD HUDOO_MODELS=<models> python3 $T/voice.py check # تفريغ مستقل → timing/asr.json
# 2. التوقيت والترجمة (الوقفات من narrative/beats.json)
PROJECT_ROOT=$PWD python3 $T/timeline.py $PWD/audio/lines
PROJECT_ROOT=$PWD SRT_NAME=maktaba.ar.srt python3 $T/srt.py
# 3. المزج: −16 LUFS، والذروة الحقيقية −4.5 dBTP
python3 tools/mix.py
# 4. التصيير
tools/render.sh Reel out/maktaba-reel.mp4 16
tools/render.sh Feed out/maktaba-feed.mp4 16
npx remotion still src/index.ts Cover publish/cover.png
# 5. الفحص
PROJECT_ROOT=$PWD QA_NAME=reel python3 ../../films/hudoo/tools/qa.py export/maktaba-reel.mp4
PROJECT_ROOT=$PWD QA_NAME=feed python3 ../../films/hudoo/tools/qa.py export/maktaba-feed.mp4
```

بعد إعادة الخطوة 2 يجب إعادة تصحيح نص الدعوة وأرقام ملف الترجمة يدويًا، والطريقة موضحة في `REPORT.md`.

`node_modules` رابط إلى مشروع ريلز آخر في المستودع، فيه Remotion 4.0.534.
