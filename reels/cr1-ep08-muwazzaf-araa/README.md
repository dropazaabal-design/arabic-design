# EP08 «موظف عند آراء الناس» — فكرة من كتاب

**الكتاب:** فن اللامبالاة لمارك مانسون.
**الشكل:** ريل قصصي كرتوني 1080×1920 بمعدل 60 إطارًا/ث، مدته 79 ث.
**الصوت:** ElevenLabs بالصوت المعتمد `dlGxemPxFMTY7iXagmOj` والنموذج `eleven_v4`.
**الموسيقى:** لا يوجد. المؤثرات مصنوعة بالشيفرة.

| الملف | المحتوى |
|---|---|
| `script.md` | الزاوية والوعد، والسكربت في أربع وحدات أداء، وجدول المشاهد |
| `research/sources.json` | ادعاءات الحلقة ومصادرها من موقع المؤلف نفسه، وما هو من إعدادنا |
| `narrative/units.json` | نص التوليد بالوسوم |
| `narrative/beats.json` | الوقفات الكوميدية المتعمدة بين السطور |
| `audio/takes/` | التسجيلات الثمانية (وحدتان لكل جزء)، ونسخة باسم الوحدة لكل تسجيل مختار |
| `audio/align/` | توقيت الكلمات من Scribe (محاذاة المزوّد) |
| `audio/lines/` | السطور التسعة عشر مقطوعة من التسجيلات |
| `timing/lines.json`، `timing/words.json` | ساعة الحلقة: كل حركة مربوطة بكلمة منطوقة |
| `timing/asr.json`، `timing/takes-asr.json` | تفريغ مستقل بـ Whisper small، محلي |
| `timing/cues.json` | توقيت المؤثرات، مأخوذ من الإطارات نفسها |
| `src/` | الحلقة في Remotion |
| `src/shots.tsx` | اللقطات |
| `src/sets.tsx`، `src/props.tsx` | المكانان والأغراض |
| `src/naif.tsx` | نايف بسمّاعته وربطة عنقه، على الهيكل المشترك من `films/hudoo` |
| `src/act.tsx` | الإمساك والختم والذراعان بالأهداف |
| `src/Episode.tsx` | الانتقالات والترجمة والإشارة إلى الكتاب |
| `tools/` | أدوات الصوت والتوقيت والمزج والترجمة وبوابة الترجمة |
| `qa/` | نتائج الفحص الآلي |
| `export/` | الفيديو وملف الترجمة |
| `publish/` | الغلاف والعنوان والكابشن |
| `LESSONS_LEARNED.md` | التقرير: ما تحسن، وما بقي، والتكلفة، والفحص |

## إعادة البناء
```sh
# الصوت: بعد تحميل التسجيلات المختارة إلى audio/takes/{A,B,C,D}.mp3 ومحاذاة Scribe إلى audio/align/
python3 tools/voice.py cut                      # → audio/lines/NNN.wav, timing/words-raw.json
python3 tools/timeline.py audio/lines           # → timing/lines.json, timing/words.json (الوقفات من narrative/beats.json)
HUDOO_MODELS=<models> python3 tools/voice.py check   # تفريغ مستقل → timing/asr.json
S=$(mktemp -d)
npx esbuild tools/cues.ts --bundle --platform=node --format=esm --outfile=$S/cues.mjs && node $S/cues.mjs
python3 tools/mix.py                            # → public/audio/mix.wav (−16 LUFS، والذروة الحقيقية −4.5 dBTP)
python3 tools/srt.py                            # → export/ep08.ar.srt
npx esbuild tools/keepout.ts --bundle --platform=node --format=esm --outfile=$S/k.mjs && node $S/k.mjs   # بوابة الترجمة
npx remotion render src/index.ts Ep08 export/ep08_muwazzaf-araa_9x16.mp4 --codec=h264 --crf=17 --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=192k
npx remotion still src/index.ts Cover publish/cover.png
PROJECT_ROOT=$PWD QA_NAME=ep08 python3 ../../films/hudoo/tools/qa.py export/ep08_muwazzaf-araa_9x16.mp4
```

- **بدون تسجيل:** `python3 tools/timeline.py` بلا وسيط يبني ساعة تقديرية من سرعة هذا الصوت في EP05، ويصيّر الحلقة صامتة بالتوقيت التقديري.
- **المتطلبات:** `node_modules` رابط إلى مشروع EP04 (Remotion 4.0.534). الشخصية والوجوه والأيدي والدعائم من `films/hudoo/src/kit`.
