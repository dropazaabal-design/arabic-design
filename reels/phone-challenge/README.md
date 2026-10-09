# ريل «هل تقدر تجلس دقيقتين بلا هاتف؟» — كتاب وبس

ريل عربي 1080×1920 بـ60 إطارًا، مدته 41,7 ث، لـInstagram وFacebook Reels وYouTube Shorts. فكرة واحدة: تقليل إتاحة الهاتف يستحق التجربة، والدقيقتان اقتراح تفاعلي منّا لا بروتوكول الدراسة.

| الملف | ما فيه |
|---|---|
| `render/phone-challenge.mp4` | الريل (الترجمة محروقة فيه) |
| `render/captions.ar.srt` | الترجمة ملفًا منفصلًا |
| `narration.txt` / `script.json` | النص المقفل وبصمته؛ `speech/` نص التوليد كما أُرسل |
| `research/notes.md` | المصادر ومستوى كل ادعاء وما لا يقوله الريل |
| `storyboard.json` | المشاهد والحركة المربوطة بالكلمات والنصوص الظاهرة حرفيًا |
| `timeline.json` | الأزمنة المقيسة من التسجيل |
| `src/` | مشروع Remotion: `scenes.tsx` (المسارح الثلاثة)، `art/reel.tsx` (الرسوم)، `Reel.tsx` (التركيب والترجمة والصوت) |
| `tools/` | المحاذاة والترجمة والموسيقى والفحوص |
| `publish/publish.md` | العنوان والكابشن |
| `checkpoint.json` | المكتمل والناقص والاستهلاك وأمر الاستئناف |

```sh
npm run render                                   # يحتاج REMOTION_CHROME
python3 tools/verify.py render/phone-challenge.mp4
node tools/copycheck.mjs && python3 tools/beatcheck.py
```

**لم يُشاهَد الريل كاملًا ولم يُستمع إليه بشريًا.** المراجعة إطارات وقياسات. كلمة «دماغك» (~29 ث) تحتاج أذنًا.
