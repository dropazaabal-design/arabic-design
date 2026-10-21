# ساعة وأخلّصها — الحلقة الرابعة من CR1 (ريل)

**فكرة من كتاب · كتاب وبس**: ريل 9:16 (16 أكتوبر 2026).

- **الكتاب**: «التفكير السريع والبطيء» لدانيال كانمان، الفصل 23.
- **الفكرة**: مغالطة التخطيط. نقدّر الوقت على أحسن احتمال، والأصدق أن نسأل: كم أخذ مثله مع غيرنا، ومعنا آخر مرة؟
- **القصة** (توضيحية من إعداد السلسلة): ناصر يفتح كرتون مكتبة الساعة أربع ويقول «ساعة وأخلّصها»، والضيوف يرنّون الجرس الساعة سبع ونصفها على الأرض. بعد شهر يفتح جواله قبل كرتون الطاولة: خمس ساعات. فيبدأ من الظهر.

## التسليم

| الملف | ما فيه |
|---|---|
| `export/cr1-ep04_saa-w-akhallis_9x16_v1.0.0.mp4` | الريل: 1080×1920، ‏60fps، ‏1:11، بترجمة مدمجة |
| `export/cr1-ep04_saa-w-akhallis_9x16_v1.0.0.ar.srt` | الترجمة نصًا |
| `LESSONS_LEARNED.md` | الدروس: ما نجح وما فشل وأسبابه، والإصلاحات، والتكلفة، والفحوص، والمقارنة مع EP03، والتحسينات التالية |
| `review/cr1-ep04_saa-w-akhallis_9x16_v1.0.0.json` | قياس الملف المصدَّر بعدادات صريحة: مقيس، ومحجوب، ووقفة قصيرة، وبلا حافة |
| `review/test-shot/` | اللقطة الأصعب: قبل وبعد (أيدي EP03 مقابل الأيدي الجديدة) |
| `review/tools-decision.md` | قرار الأدوات، وخطة تجربة GPU في `research/omni-gpu-trial/` |
| `review/pronunciation.json`، `review/asr-*.json`، `review/takes.json` | النطق والتفريغ المستقل واختيار النسخ |
| `review/contrast.json`، `review/sheet_color.png`، `review/sheet_gray.png` | التباين، وألواح المراجعة بلا صوت |
| `review/preview_9x16_half.mp4` | المعاينة بالصوت قبل التصيير النهائي |

## التشغيل

```sh
npm install
python3 tools/make_sfx.py && python3 tools/build_audio.py      # المؤثرات المركّبة، ثم المزج والتوقيت والترجمة (لا توليد صوت)
node tools/palette.mjs && node tools/copycheck.mjs && python3 tools/fontcheck.py && python3 tools/contrast.py
npx tsc --noEmit -p .
REMOTION_CHROME=… npx remotion render ReelCheck /tmp/gate.mp4 --scale=0.25 --every-nth-frame=2 --muted   # بوابة الوجه والنص: تفشل عند أي تداخل
REMOTION_CHROME=… npx remotion render Reel export/cr1-ep04_saa-w-akhallis_9x16_v1.0.0.mp4 --crf=12 --x264-preset=slow --audio-codec=aac --audio-bitrate=192k
python3 tools/verify.py export/cr1-ep04_saa-w-akhallis_9x16_v1.0.0.mp4 short 1080x1920
```
