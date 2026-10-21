# آلة الأمنية — شوبنهاور

فيلم SVG/2D أصلي، 1080×1920، 30 إطار حركة حقيقيًا/ث، 66.4 ثانية. التعليق العربي مولّد بالذكاء الاصطناعي ومدمج مع 43 مؤثرًا ونغمات بيانو أصلية. الترجمة العربية مدمجة بصريًا ومرفقة SRT.

المراجع والحدود الفلسفية: `script.md`؛ تمثيل الجسم ومسار كل غرض: `storyboard.md`؛ توقيت الكلام وسكتات المونتاج: `timeline.json` و`audio/words.json`. الأصول SVG قابلة للتعديل في `src/art.tsx`، المشاهد في `src/scenes/`، الحركة في `src/Stage.tsx`، والقطع في `src/index.tsx`.

```sh
npm ci
npm run typecheck
npm run studio
python tools/prepare.py
python tools/sfx.py
npm run render
# تسوية النطاق والترميز النهائي
ffmpeg -y -i output/picture.mp4 -vf 'scale=in_range=pc:out_range=tv,format=yuv420p' -c:v libx264 -preset medium -crf 18 -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -ar 48000 -movflags +faststart output/final_reel.mp4
python tools/verify.py
node tools/copycheck.mjs
node tools/stills.mjs
```

Chromium مثبّت. عند اختلاف مكانه حدّث `--browser-executable`. Studio يحوي الفيلم والمشاهد المسجلة مستقلًا والغلاف. التوليد الصوتي لا يُعاد عند إعادة التصيير: التسجيل نفسه محفوظ محليًا. يلزم Python وnumpy وFFmpeg.

الحالة الإبداعية: فُحصت إطارات ومعاينة مصيّرة، وأُصلح اتصال الجائزة باليد وتنوع لقطة التأمل. لا تتوفر هنا أداة لمشاهدة الفيلم متصلًا بزمنه والاستماع إليه؛ لم نَدّع اكتمال تلك المراجعة. تقرير QA يفصل ذلك عن القياسات. لم يدمج PR ولم يُنشر الفيلم.
