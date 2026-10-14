# «فكرة طايرة» — عرض محرك الحركة

هذا مشهد عربي أصلي مدته 13.6 ث، بمقاس 1080×1920 و**60 إطارًا/ث**. يثبت طبقة الحركة `reels/motion` في فيديو حقيقي: GSAP ومسارات Remotion وRive وrig من TSX على ساعة واحدة. القصة والطبقات في `script.md`، والنبضات في `storyboard.json`، والقياسات في `output/qa_report.md`.

| الملف | ما هو |
|---|---|
| `output/final_reel.mp4` | الفيديو النهائي: H.264 High وyuv420p وbt709 و60/1، مع AAC 48 kHz |
| `publish/cover-1080x1920.jpg` | الغلاف: الإطار 744 (12.4 ث) |
| `output/captions.ar.srt` | الترجمة على الكلمات المقيسة |
| `src/scene/Scene.tsx` | المشهد كله، لقطة واحدة متصلة |
| `src/probe/Probe.tsx` | probes لاختبارات العرض |
| `tools/render-tests.mjs` | 12 فحصًا على عروض حقيقية، نتائجها في `output/qa-render-tests.json` |
| `tools/build_audio.py` | الصوت: loudnorm، والقص، و`timeline.json`، و`words.json`، و`alignment.json`، والـ SRT |
| `tools/sfx.py` | المؤثرات الأصلية: جو الغرفة، والطيران، والزقزقة |

## التشغيل

```sh
(cd ../motion && npm ci) && npm ci
export REMOTION_CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell   # اختياري
python3 tools/build_audio.py && python3 tools/sfx.py           # الصوت (مرة واحدة)
npx tsc -p tsconfig.json                                         # الأنواع
node tools/render-tests.mjs                                      # اختبارات العرض
npm run render                                                   # out/reel-raw.mp4 (نحو 8 دقائق)
ffmpeg -i out/reel-raw.mp4 -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 18 \
  -profile:v high -movflags +faststart -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a copy output/final_reel.mp4
npm run cover
python3 ../tools/qa_gates.py . --measure                         # البوابات
```

`Reel30` هو المشهد نفسه بـ 30 إطارًا/ث. لا يُصدَّر؛ وجوده لاختبار التطابق بين 30 و60.
