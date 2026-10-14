# بصيرة 06 — «بس طلب صغير!» (قوة كلمة «لا») — النسخة B

ريل كرتوني عربي 1080×1920، 30 إطارًا/ث، 90.2 ث، بصوتين (راوٍ/عامل وزميل). عامل في استوديو تصوير يريد أن يخرج في
موعده؛ كوب ثم حقيبة ثم نبتة، ومع كل «أكيد» تنشغل يد؛ سلسلة جوال ← كوب ← ذقن ← نبتة ← باب يعلق المعطف؛ خيال الرفض
(أقنعة عبوس، الأضواء تنطفئ)؛ «لا، اليوم ما أقدر. عندي موعد.» — «تمام.»؛ كل واحد يأخذ غرضه؛ قفلة غطاء الكوب؛ طلب
إعجاب ومتابعة مسموع يخدم نكتة «لا». هذه **النسخة B** من الموجز نفسه؛ نسخة A في `reels/power-of-no/`.

| المسار | ما فيه |
|---|---|
| `output/final_reel.mp4` · `output/captions.ar.srt` | الريل، والترجمة العربية بتوقيت الكلمات |
| `publish/cover-1080x1920.jpg` · `publish/publish.md` | الغلاف، والعنوان والكابشن لإنستغرام وفيسبوك ويوتيوب Shorts وX |
| `script.md` · `storyboard.md` · `output/qa_report.md` | النص والصوت والتحقق العلمي، 30 لقطة بحقول الموجز، تقرير الجودة |
| `src/characters/worker.tsx` | العامل على rig مكرّم: معطف بذيل يعلق، وشاح، جيب للجوال وجيب للغطاء؛ IK الذراع لأي بنية |
| `src/characters/studio.tsx` | الباب و«خروج»، الساعة الرقمية، قائمة «التسليم»، الأضواء، الكاميرا، الخلفية، المكتب، الكوب والغطاء، الحقيبة، النبتة، أقنعة العبوس |
| `src/scenes/world.tsx` | العالم الواحد: كل حركة وكل غرض دالة في رقم الإطار على كلمات التسجيل، فلا يظهر غرض ولا يختفي عند القطع |
| `src/scenes/shots.tsx` · `storyboard.json` | 30 لقطة (كاميرا فقط) تبدأ كل منها على كلمة منطوقة |
| `tools/align.py` | محاذاة **نسختين** صوتيتين على نص واحد، قص عند الوقفات، توقيت مقيس، SRT، غلاف فم لكل متكلم |
| `assets/asset_manifest.json` | مصدر كل عنصر وحقوقه |

## إعادة الاستعمال (بلا نسخ ولا تعديل)

`webpack-override.mjs` يعرّف `@mukarram` و`@mukarram-assets` (الـrig والوجوه والزملاء الثلاثة ومسارات الوضعيات والمسرح
وفلتر الغليان والخطوط ومعظم المؤثرات) و`@doublethink` (IK الذراع)؛ ومؤثرا `gulp`/`tap` من `reels/boiling-frog` و`casters`/
`clack`/`rattle` من `reels/doublethink` يُستوردان بمساراتهما. React وRemotion يُحلّان دائمًا إلى `node_modules` هذا الريل.
الأدوات (`verify.py`، `synccheck.py`، `motion.py`، `stills.mjs`، `storyboard.mjs`، `arabic-check.mjs`) منسوخة من
`reels/doublethink` ومكيّفة.

## إعادة الإنتاج

```sh
cd reels/power-of-no-b && npm install
ffmpeg -i audio/take-N1-yZoD5vUcUqMEv8yAWTiO.mp3 -ar 48000 -ac 1 audio/take-N.wav
ffmpeg -i audio/take-C2-HiESb63L1QkQcCiYZmRr.mp3 -ar 48000 -ac 1 audio/take-C.wav
python3 tools/align.py        # timeline + أسطر الصوت + SRT + أغلفة الفم
python3 tools/sfx.py
REMOTION_CHROME=/path/to/headless_shell npx remotion render src/video/index.ts Reel out/render-raw.mp4 --audio-codec=aac --audio-bitrate=192k
ffmpeg -i out/render-raw.mp4 -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 18 -profile:v high -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart -c:a copy output/final_reel.mp4
REMOTION_CHROME=/path/to/headless_shell npx remotion still src/video/index.ts Cover out/cover.png && ffmpeg -i out/cover.png -q:v 2 publish/cover-1080x1920.jpg
python3 tools/verify.py output/final_reel.mp4 && python3 tools/synccheck.py output/final_reel.mp4 && python3 tools/motion.py output/final_reel.mp4 && node tools/arabic-check.mjs
```
