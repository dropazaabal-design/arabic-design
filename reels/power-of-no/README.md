# بصيرة 06 — بس طلب صغير!

مشروع Remotion مستقل بمقاس 1080×1920 و30 إطارًا/ثانية. المصدر المرئي في `src/scene.tsx`، والتسجيل العربي الواحد مدته 41.92 ثانية. `output/visual_review_1080p.mp4` هو **معاينة بصوت مؤثرات فقط**؛ لا يُنشر بوصفه الفيلم النهائي.

## التشغيل

```bash
npm install
npm run assets
# نزّل التسجيل المعتمد من رابط جلسة الصوت في script.md إلى public/narration.mp3
npm run typecheck
npm run studio
npm run render
npm run cover
```

يجمع `npm run assets` ملف `audio/words.json` في SRT ويولد `public/foley.wav`. التوقيت والتعليقات منفصلان في `output/captions.ar.srt`. الصوت المعتمد لم يكن قابلاً للتنزيل من بيئة العمل، لذا لا يوجد ملف `output/final_reel.mp4` صالح حتى يُنسخ `narration.mp3` ويُنفذ render وQA للصوت. لا تستخدم معاينة المؤثرات في النشر.

**المعاينة البديلة:** `tools/export-frames.tsx` يرسم الإطارات SVG من دالة `Frame` نفسها التي يستخدمها Remotion. عُيّنت الحركة في هذه المعاينة عند 15 إطارًا/ثانية ثم ضوعفت الإطارات إلى ملف 30fps؛ تصدير Remotion النهائي يعمل عند 30 إطار حركة حقيقيًا/ثانية. يمكن تحويل SVG إلى H.264 مع FFmpeg عندما يتعذر تشغيل Chromium. إطار كل ثانية ونصف معروض في `output/contact-sheet.jpg` محليًا.

ملف `storyboard.md` يصف انتقالات الأغراض والتمثيل؛ `output/qa_report.md` يسجل ما تم اختباره وما تعذر. لا تعتمد هذه النسخة الصوتية حتى تسمع لفظ «السوسيوتروبية» وتراجع مزج الصوت في MP4 النهائي.
