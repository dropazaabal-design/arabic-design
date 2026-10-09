# ريل «التغافل» — كتاب وبس

- **الصيغة:** ريل عربي 1080×1920 بـ60 إطارًا، مدته 82,2 ث.
- **المادة:** المتحدث الأصلي بصوته، مع رسوم Doodle وMotion تشرح ما يقوله.
- **الفكرة من كلامه نفسه:** التغافل تكلّف الغفلة ممن هو فطِن، وليس غفلة حقيقية («الفطن المتغافل»).

| الملف | ما فيه |
|---|---|
| `render/taghafol.mp4` | الريل (الترجمة محروقة فيه) |
| `render/captions.ar.srt` | الترجمة ملفًا منفصلًا، على الصوت المعدّل |
| `source/` | المقطع الأصلي كما رُفع، وبصمته |
| `transcript/reviewed.json` | النص بتوقيت المصدر. التوقيت من Whisper، والكلمات مصحّحة على ترجمة المقطع المحروقة، وبدايات الكلمات عند القصّات من غلاف الصوت |
| `audio/whisper-words.json` · `audio/envelope.json` | الكلمات بتوقيتها، وغلاف الصوت كل 20 ملي ثانية (للاستعمال مجددًا) |
| `audio/cuts.md` · `audio/audiocheck.json` | كل قصّة ولماذا هي آمنة، وقياسات الذروة والمحدِّد والسلسلة والوصلات |
| `transcript/scenes.json` · `timeline.json` | المشاهد بتوقيت المصدر، وخريطة القصّ (EDL) والأزمنة على الريل |
| `storyboard.json` | المشاهد والرسوم والنصوص الظاهرة حرفيًا |
| `src/` | مشروع Remotion. فيه `Speaker.tsx` (إطار المتحدث بإطارات المصدر)، و`art/taghafol.tsx` (الرسوم)، و`scenes/` (11 مشهدًا مستقلًا)، و`Reel.tsx` (التركيب والترجمة والصوت) |
| `tools/` | `edl.py` (القصّ والصوت والترجمة والخط الزمني)، `audiocheck.py`، `verify.py`، `copycheck.mjs`، `arabic-check.mjs`، `stills.mjs` |
| `checkpoint.json` | المكتمل والناقص وما لم يُشاهَد أو يُسمع |

```sh
python3 tools/edl.py                       # يعيد بناء الصوت المعدّل من الأصل + الترجمة + timeline.json
npm run render                             # يحتاج REMOTION_CHROME
python3 tools/verify.py render/taghafol.mp4
node tools/copycheck.mjs
```

يحتاج `edl.py` الملف `audio/original-48k.wav`، وهو غير محفوظ في Git لأنه يُستخرج من المصدر بالأمر:

```sh
ffmpeg -i source/original.mp4 -vn -ar 48000 audio/original-48k.wav
```
