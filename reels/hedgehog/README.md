# معضلة القنفذ

ريل «كتاب وبس» (Doodle + Motion Graphics)، 1080×1920، 30fps، H.264/AAC — `out/hedgehog.mp4` (45.0 ث، −16 LUFS).

- **العنوان الافتتاحي:** «كل ما تقرّب… تنجرح؟» ثابت أول 3 ثوانٍ، ثم «معضلة القنفذ».
- **السكريبت المقفل:** `script.json`؛ الأفكار العشر والاختيار والخطافات البديلة والكابشن: `plan/ideas.md`.
- **الصوت:** ElevenLabs `eleven_v4`، الصوت `dlGxemPxFMTY7iXagmOj` («Fernando Martínez - Rapid, Persuasive»)، هوية «نديم» **التجريبية** في `../voices/nadeem/elevenlabs.json` (لم تُقيَّم بالسماع بعد). التسجيل كما وُلّد: قصّ إلى الكلام وكسب ثابت فقط، بلا تغيير سرعة أو طبقة. فحص Whisper يدلّ على أن الكلمات مفهومة فقط، لا على طبيعية الإلقاء أو سلامة اللكنة.
- **التوقيت:** `tools/build-voice.py` يحاذي كلمات السكريبت مع كلمات Whisper، ويضع حدود الجمل والمشاهد على الوقفات الحقيقية، ويكتب `src/timeline.json` و`src/captions.json` و`audio/alignment.json`.
- **بصيرة:** خطة `canva_build_reel` (0 أخطاء، 0 تحذيرات) في `plan/`، وتدقيق النصوص الموضوعة 11/11 (`tools/proof.mjs`).
- **المصدر:** شوبنهاور، *Parerga und Paralipomena* (1851)، المجلد 2، §396 — حكاية رمزية، لا تجربة، ولا اقتباس حرفي.

```bash
npm install
python3 tools/build-voice.py TAKE.wav WORDS.json   # بعد اختيار تسجيل وتفريغه بـ Whisper
REMOTION_CHROME=/path/to/chrome npm run render
```
