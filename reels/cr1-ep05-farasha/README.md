# CR1 EP05: تأثير الفراشة (9:16، 60fps)

قصة إدوارد لورنز سنة 1961، مرسومة: رقم قُرّب لثلاث خانات، ثم فنجان قهوة، ثم طقس آخر تمامًا. ومنها جاء اسم «تأثير الفراشة» وجواب لورنز.

## الملفات
| الملف | ما هو |
|---|---|
| `export/cr1-ep05_farasha_9x16_v1.0.0.mp4` | الريل النهائي |
| `export/…ar.srt` | الترجمة |
| `script-short.md` | النص المقفل |
| `storyboard.md` | المعالجات الثلاث والاختيار والستوريبورد |
| `sources.json` | الادعاءات والمراجع وحدود الدقة |
| `LESSONS_LEARNED.md` | التقرير: الفحوص، وما نجح، وما بقي، والتكلفة |
| `publish/` | العنوان والكابشن والغلاف |
| `review/` | قياسات الملف، والتزامن، والتفريغ، ولوح لقطات، والمقطع التمثيلي |
| `audio/takes/` و`audio/align/` و`audio/generations.json` | التسجيل الوحيد ومحاذاته وسجل الإنفاق |

## إعادة البناء
```bash
npm ci   # أو ربط node_modules من EP04 كما هنا
python3 tools/make_sfx.py      # المؤثرات (مُركّبة، بلا عينات ولا تراخيص)
python3 tools/build_audio.py   # الصوت والخط الزمني والترجمة (−16 LUFS)
export REMOTION_CHROME=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/headless_shell | head -1)
npx remotion render ReelCheck /tmp/check.mp4 --scale=0.25 --every-nth-frame=2 --muted --browser-executable=$REMOTION_CHROME  # بوابة الوجه والنص
npx remotion render Reel export/cr1-ep05_farasha_9x16_v1.0.0.mp4 --crf=12 --x264-preset=slow --audio-codec=aac --audio-bitrate=192k --browser-executable=$REMOTION_CHROME
python3 tools/verify.py export/cr1-ep05_farasha_9x16_v1.0.0.mp4 short 1080x1920
python3 tools/synccheck.py export/cr1-ep05_farasha_9x16_v1.0.0.mp4
node tools/palette.mjs && node tools/copycheck.mjs && python3 tools/fontcheck.py
```

## البنية
- `src/scenes/insert.tsx`: لقطات الورق والأرقام.
- `src/scenes/lab.tsx`: المعمل.
- `src/scenes/board.tsx`: السبورة والخريطة.
- `src/Film.tsx`: يجمع اللقطات. كل حدث مربوط بكلمة منطوقة.
- `src/plot.ts`: منحنيا الحسبتين، بمعدل تضاعف كل 4 أيام.
- الشخصية: `motion-core/src/characters/SvgPerson.tsx`، مع الخيارات الجديدة `glasses` و`tie` و`moustache`.
