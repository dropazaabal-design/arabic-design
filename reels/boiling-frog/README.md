# بصيرة 02 — «الضفدع هرب… وأنت؟»

ريل Doodle عربي 1080×1920، 30 إطارًا/ث، 43.4 ث. قصة قصيرة: يقولون إن الضفدع لا ينتبه إذا سخن الماء
بالتدريج — لكن الضفدع ينتبه ويقفز سالمًا؛ القصة تشبيه، والتشبيه يصدق علينا (جوال يأكل ساعة، «بكرة»
تصير كومة)؛ ثم سؤال محدّد وخطوة واحدة صغيرة. الضفدع آمن طوال الوقت.

| المسار | ما فيه |
|---|---|
| `output/final_reel.mp4` · `output/captions.ar.srt` | الريل، والترجمة العربية بتوقيت الكلمات |
| `publish/cover-1080x1920.jpg` · `publish/publish.md` | الغلاف، والعنوان والكابشن لإنستغرام وفيسبوك ويوتيوب Shorts وX |
| `script.md` · `storyboard.md` · `output/qa_report.md` | النص بالتوقيت والنبرة والتحقق العلمي، 17 لقطة بملاحظات التمثيل، تقرير الجودة |
| `src/characters/frog.tsx` | **rig الضفدع**: ضغط/تمدد بحفظ الحجم، تحفّز، قفز، أرجل تنطوي وتنبسط، عيون قبّية ترمش وتنظر، فم ولسان وحنجرة |
| `src/characters/human.tsx` · `props.tsx` | الرجل (على rig مكرّم)، وأدوات القصة (ميزان الحرارة، الجوال وشريط وقت الشاشة، الساعة، كومة الأوراق، ورقة «بكرة»…) |
| `src/scenes/` | البركة، الاستوديو الداكن، الغرفة، خارج النافذة |
| `assets/svg/` | 21 SVG مستقلًا — `npm run assets` |
| `assets/asset_manifest.json` | مصدر كل عنصر وحقوقه |

## إعادة الاستعمال من `reels/mukarram` (بلا نسخ ولا تعديل)

`webpack-override.mjs` يعرّف `@mukarram` و`@mukarram-assets`: الراوي ونظام الحبر والوجوه والجسم
والمفاصل، والمكتب والميكروفون، والمسرح والكاميرا وفلتر الغليان، ومسارات الوضعيات والتعابير، وخطوط
Cairo، ومعظم المؤثرات تُستورد من هناك؛ وReact وRemotion يُحلّان دائمًا إلى `node_modules` هذا الريل.
الأدوات (`align.py`، `verify.py`، `synccheck.py`، `stills.mjs`، `storyboard.mjs`، `arabic-check.mjs`)
منسوخة من هناك ومكيّفة للمسارات والوقفات.

## إعادة الإنتاج

```sh
cd reels/boiling-frog && npm install
ffmpeg -i audio/take-A-7gBjXGsZONmcl19RQcWb.mp3 -ar 48000 -ac 1 audio/take-A.wav
python3 tools/align.py audio/take-A.wav audio/take-A.words.json   # timeline + أسطر الصوت + SRT + غلاف الفم
python3 tools/sfx.py
REMOTION_CHROME=/path/to/headless_shell npx remotion render src/video/index.ts Reel out/render-raw.mp4 --audio-codec=aac --audio-bitrate=192k
ffmpeg -i out/render-raw.mp4 -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 18 -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart -c:a copy output/final_reel.mp4
python3 tools/verify.py output/final_reel.mp4 && python3 tools/synccheck.py output/final_reel.mp4 && node tools/arabic-check.mjs
```
