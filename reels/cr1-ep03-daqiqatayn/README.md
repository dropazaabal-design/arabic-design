# دقيقتين بس — الحلقة الثالثة من CR1 (ريل)

**فكرة من كتاب · كتاب وبس** — ريل واحد 9:16 (16 أكتوبر 2026).
الكتاب: «العادات الذرية» لجيمس كلير (الفصل 13). الفكرة: **قاعدة الدقيقتين**: ابدأ أي عادة جديدة بنسخة تاخذ أقل من دقيقتين، لأن العادة لازم توجد قبل ما تتحسن.
القصة توضيحية من إعداد السلسلة: سلطان اشترى حذاء رياضة وتركه شهرًا في كرتونه، لأن خطته «ساعة كل يوم» أكبر من أن يبدأها.

## التسليم

| الملف | ما فيه |
|---|---|
| `export/cr1-ep03_daqiqatayn_9x16_v1.0.0.mp4` | الريل 1080×1920، ‏60fps، ‏1:10، بترجمة مدمجة |
| `export/cr1-ep03_daqiqatayn_9x16_v1.0.0.ar.srt` | الترجمة نصًا |
| `review/report.md` | تقرير التجربة: ما نجح، ما بقي ضعيفًا، أولوية التطوير التالية، ونتائج الفحص |
| `review/cr1-ep03_daqiqatayn_9x16_v1.0.0.json` | قياس الملف المصدَّر (`verify.py`) |
| `review/contrast.json` | تباين الشخصية والنصوص في كل حالة إضاءة (`contrast.py`) |
| `review/takes.json`، `review/asr-turbo.json` | اختيار نسخ الصوت والتفريغ المستقل |
| `review/test_open_box_9x16_60fps.mp4` | اللقطة الاختبارية (11 ث) قبل بناء الريل |
| `review/sheet_*.png` | ألواح لقطات للمراجعة: بالألوان، وبالرمادي |

## حزمة الحلقة

```
episode-brief.json   الفكرة والتطبيق والصوت ورقم الإصدار
sources.json         سجل الادعاءات C1–C6 (من الكتاب / من إعدادنا) والمراجع، وما لم نستعمله ولماذا
script-short.md      النص المقفل (7 مقاطع)
sfx.json             المؤثرات، كل واحد مربوط بكلمة وفعل على الشاشة
timeline.json        الوحدات المختارة ومواضعها، والوقفات المضافة للأفعال، والمؤثرات، وقياس المزج
audio/               نسخ ElevenLabs (4 لكل وحدة)، توقيت الكلمات للنسخ المختارة، سجل التوليد والرصيد
src/                 Film.tsx (الريل)، scenes/ (room، idea، open)، props.tsx، stage.tsx، text.tsx، TestShot.tsx، Lab.tsx
tools/               build_audio.py، make_sfx.py، takes.py، asr.py، verify.py، contrast.py، copycheck.mjs، fontcheck.py، palette.mjs، stills.mjs
```

الشخصية من مصدر SVG منفصل: `motion-core/art/characters/sultan.svg` ← `node tools/svgr-build.mjs sultan` (SVGR) ← `motion-core/src/characters/sultan/Art.tsx`، ويحرّكها `motion-core/src/characters/SvgPerson.tsx` بالوضعيات والتعابير نفسها في طقم الكرتون.

## التشغيل

```sh
npm install
python3 tools/make_sfx.py && python3 tools/build_audio.py   # المؤثرات المركّبة، ثم المزج والتوقيت والترجمة (لا توليد صوت جديد)
node tools/palette.mjs && node tools/copycheck.mjs && python3 tools/fontcheck.py && python3 tools/contrast.py
npx tsc --noEmit -p .
REMOTION_CHROME=… npx remotion render Reel export/cr1-ep03_daqiqatayn_9x16_v1.0.0.mp4 --crf=12 --x264-preset=slow --audio-codec=aac --audio-bitrate=192k
python3 tools/verify.py export/cr1-ep03_daqiqatayn_9x16_v1.0.0.mp4 short 1080x1920
```
