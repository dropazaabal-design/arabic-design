# «فن الحرب» — بالعامية وبأسلوب الرسوم على الخلفية البيضاء

فيلم تفسيري عربي مدته 9:28، بمقاس 1920×1080 و60 إطارًا في الثانية، مع H.264 وAAC. النص هو
[`research/whiteboard-style/art-of-war-script-ar.md`](../../research/whiteboard-style/art-of-war-script-ar.md)،
والأسلوب من [`research/whiteboard-style/STUDY.md`](../../research/whiteboard-style/STUDY.md): خلفية بيضاء، شخصيات
برؤوس كبيرة وحد أسود، عناصر تدخل مع كلمتها، عنوان ثابت، وتسميات صفراء بحد أسود.

كل شيء مرسوم بالشيفرة (React + SVG في Remotion 4): لا صور نقطية ولا أصول جاهزة.

## الصوت

صوت «علي» السعودي من ElevenLabs (`eleven_v4`، معرّف الصوت `Hvlnv5DwiIO2CQ6oYMZ3`)، في 17 مقطعًا
(`narrative/chunks.json` هو النص المرسَل حرفيًا مع وسوم الأداء). وُلّدت نسختان لكل مقطع واستُعملت الأولى؛
النسخ كلها في مساحة ElevenLabs (مسار «فن الحرب — تعليق صوتي»). التكلفة نحو 13,000 رصيد.
صوت «نديم» المعتمد في `reels/voices/nadeem` لم يُستعمل لأن الشبكة هنا تمنع تنزيل نموذجه من huggingface.co.

## التوقيت

كل حركة مربوطة بكلمة، لا بثانية: `cue('c01', 'كبسة')` هو الإطار الذي تُقال فيه «كبسة».
أوقات الكلمات من محاذاة ElevenLabs (`timing/cNN.words.json`)، و`tools/timing.py` يجمع المقاطع
في `public/audio/narration.wav` ويكتب `src/timing.json` (خريطة الحرف ← الثانية، وغلاف الصوت لحركة الفم).

## المحتويات

| المسار | ما فيه |
|---|---|
| `src/kit/draw.tsx` | الحبر والألوان، والحركات: `Pop` و`Move` و`Arrow` و`Draw` و`Seq` و`Label` |
| `src/kit/people.tsx` | الشخصية الواحدة لكل الأدوار (ذراعان بـ IK، 14 وضعية، 8 تعابير، 13 غطاء رأس)، والراوي بالثوب والشماغ |
| `src/kit/props.tsx` | نحو 90 غرضًا |
| `src/scenes/p1–p3.tsx` | المشاهد: المراحل الثلاث، مقطع لكل ملف تقريبًا |
| `src/film/cue.ts` | من الكلمة إلى الإطار |
| `tools/` | `timing.py` (التوقيت)، `render.sh` (التصيير)، `stills.mjs` + `montage.py` (لوحات المراجعة)، `srt.py` (الترجمة) |
| `export/` | الفيلم المضغوط والترجمة `fann-alharb.ar.srt` |

## التشغيل

```sh
npm install
python3 tools/timing.py                 # بعد أي تغيير في الصوت
ffmpeg -i public/audio/narration.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 -ac 2 public/audio/mix.wav
npx remotion studio src/index.ts        # المعاينة
tools/render.sh out/master.mp4          # الفيلم (أو: tools/render.sh out/clip.mp4 0-1200)
node tools/stills.mjs /tmp/st 240 840 … && python3 tools/montage.py /tmp/st /tmp/sheet
```

لتغيير الصوت: ضع `audio/raw/cNN.mp3` جديدة (ومعها `timing/cNN.words.json` إن توفّر)، ثم أعد تشغيل `tools/timing.py`؛ المشاهد تتبع الكلمات وحدها.
