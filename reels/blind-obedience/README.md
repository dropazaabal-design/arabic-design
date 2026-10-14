# بصيرة — «الامتثال الأعمى»

ريل كرتوني عربي 1080×1920، 30 إطارًا/ث، 72.3 ث، بصوتين (الراوي، والمجرِّب بأوامر ميلغرام). مستفز ومصدَّق: «65%
ضغطوا الزر الأخير… وأنت؟» — ميلغرام 1963 (26 من 40، وتوقّع طلاب ييل 1%)، آش 1955 (37% من الإجابات، والربع مع شريك
صادق)، وإعادة برغر الجزئية 2006. كل رقم من نص مصدره، ومصدره على الشاشة لحظة ظهوره (`script.md`).

| المسار | ما فيه |
|---|---|
| `output/final_reel.mp4` · `output/captions.ar.srt` | الريل والترجمة العربية |
| `publish/cover-1080x1920.jpg` · `publish/publish.md` | الغلاف، والعناوين والكابشن لريلز وشورتس |
| `script.md` · `storyboard.md` · `output/qa_report.md` | النص والتحقق من المصادر، 20 لقطة، تقرير الجودة |
| `src/characters/lab.tsx` | مولّد الصدمات (30 مفتاحًا 15–450 فولت بتسمياتها)، الحاجز والطرقات، غرفة «الطالب»، بطاقة آش، فقاعات الإجابات، السبورة |
| `src/characters/people.tsx` | المجرِّب بالمعطف الرمادي، «الطالب» الممثل، أعضاء جماعة آش (على rig مكرّم) |
| `src/scenes/shots.tsx` · `storyboard.json` | اللقطات على كلمات التسجيل |

إعادة استعمال بلا نسخ: الـrig والوجوه والراوي والمسرح والخطوط ومعظم المؤثرات من `reels/mukarram`؛ الموظف (المشارك) وIK
الذراع ومؤثرات من `reels/doublethink`؛ مؤثر من `reels/boiling-frog`. الأدوات من `reels/power-of-no-b` (محاذاة نسختين).

```sh
cd reels/blind-obedience && npm install
ffmpeg -i audio/take-N1-6CcF7Z01DxKBQDuhg7KV.mp3 -ar 48000 -ac 1 audio/take-N.wav
ffmpeg -i audio/take-E1-E6ZWoTE8u3wfkyKoAqmI.mp3 -ar 48000 -ac 1 audio/take-E.wav
python3 tools/align.py && python3 tools/sfx.py
REMOTION_CHROME=/path/to/headless_shell npx remotion render src/video/index.ts Reel out/render-raw.mp4 --audio-codec=aac --audio-bitrate=192k
ffmpeg -i out/render-raw.mp4 -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 18 -profile:v high -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart -c:a copy output/final_reel.mp4
python3 tools/verify.py output/final_reel.mp4 && python3 tools/synccheck.py output/final_reel.mp4 && python3 tools/motion.py output/final_reel.mp4 && node tools/arabic-check.mjs
```
