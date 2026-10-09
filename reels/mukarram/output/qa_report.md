# QA — «لا تكن أنت الأذى» (`output/final_reel.mp4`)

**الملف:** `output/final_reel.mp4` — 16934448 بايت، sha256 `d3de69994b114ee7251847a6b2f5fe5c7b84f4b7681f008219f4a4b2fdab9f13`. معاينة 540×960: `output/preview.mp4`. لوحة اللقطات: `output/contact_sheet.jpg`.

## ما تحقّق بالأدوات

| الفحص | النتيجة | الأداة |
|---|---|---|
| الأبعاد والإطار | 1080×1920، 30/1 ثابت، 1495 إطارًا، 0 فروق توقيت شاذة | ffprobe (`tools/verify.py` → `qa-technical.json`) |
| الترميز | H.264 High، yuv420p (نطاق tv، bt709)، faststart؛ AAC-LC 48 kHz ستيريو 189 kb/s | ffprobe |
| المدة | 49.83 ث (الحاوية 49.835)، مطابقة لـ `timeline.json` المقيس | ffprobe |
| فك الترميز كاملًا | 0 أخطاء | `ffmpeg -v error -f null` |
| الجهارة | −16.0 LUFS متكاملة، ذروة حقيقية −4.0 dBTP، LRA 2.9 | ebur128 |
| إطارات سوداء / تجمّد > 3 ث / صمت > 0.8 ث | لا شيء / لا شيء / لا شيء | blackdetect، freezedetect، silencedetect |
| تزامن الصوت | كل الأسطر الـ11 موجودة في المزيج بفارق ≤ 14 ميلي ثانية (أقل من نصف إطار) | ارتباط متقاطع (`tools/synccheck.py` → `qa-sync.json`) |
| النطق | ElevenLabs Scribe على التسجيل المختار: 91/91 كلمة مطابقة للنص | `audio/alignment.json` |
| النص العربي على الشاشة | 3 نصوص، 0 أخطاء، 0 تحذيرات (حروف، همزات، ة/ه، ى/ي، أرقام، ترقيم) | بصيرة `studio check` (`tools/arabic-check.mjs` → `qa-arabic-check.json`) |
| الأنواع | TypeScript بلا أخطاء | `tsc --noEmit` |
| النهاية | آخر كلمة 48.53 ث، ثم 1.3 ث للخاتمة؛ آخر إطار غير أسود | timeline + لوحة اللقطات |

## ما فُحص بالعين (إطارات، لا مشاهدة كاملة)

- منتصف كل لقطة من اللقطات الـ27 من الملف النهائي (`contact_sheet.jpg`): حركة الشخصيات وتعابيرها، فم الراوي مفتوح مع الكلام، لا صور فوتوغرافية، لا نص لاتيني.
- قبل التصدير أُصلح: لافتة الحديقة المقصوصة أعلى الإطار، لافتة «حافظ على…» المقصوصة في لقطات الجيب والسلة والختام، اللافتة التي غطّت وجه القرد، الميكروفون الذي غطّى نظارة الراوي.

## مشكلات متبقية (معروفة، لم تُصلح لتقديم التسليم)

1. **sh18 (29.5–30.7 ث):** مع الاقتراب على الانحناءة الثالثة يُقص طرف لافتة «حافظ على نظافة المكان» يسار الإطار، ورأس العامل يغطي جزءًا من سطرها الثاني. الإصلاح: `cx` أصغر أو تكبير أقل في `CleanerBend3`، ثم إعادة التصدير.
2. **sh01 (≈0.5–1.0 ث):** أثناء سحب الكاميرا للخلف تمر لافتة «حديقة الحيوان» قرب الحافة العليا ويُقص أعلاها لحظيًا؛ تكتمل من ≈1.1 ث.
3. **لم يستمع إنسان إلى الريل ولم يشاهده كاملًا.** الفحوص أعلاه قياسات وإطارات؛ الأداء الصوتي والإيقاع الكوميدي يحتاجان أذنًا وعينًا.

## إعادة الإنتاج

```sh
cd reels/mukarram && npm install
python3 tools/align.py audio/take-A.wav audio/take-A.words.json   # يحتاج audio/take-A.wav: ffmpeg -i audio/take-A-*.mp3 -ar 48000 -ac 1 audio/take-A.wav
python3 tools/sfx.py
REMOTION_CHROME=/path/to/headless_shell npm run render
python3 tools/verify.py output/final_reel.mp4 && python3 tools/synccheck.py output/final_reel.mp4
node tools/arabic-check.mjs && node tools/storyboard.mjs && npm run assets
```
(`npm run render` يخرج بإطارات JPEG بنطاق كامل؛ النسخة المسلّمة حُوّلت إلى yuv420p بنطاق tv بالأمر: `ffmpeg -i in.mp4 -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 18 -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart -c:a copy out.mp4`.)
