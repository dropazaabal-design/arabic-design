# بصيرة 04 — «التفكير المزدوج»

ريل كرتوني عربي أصلي (Ink/Doodle)، 1080×1920، 30 إطارًا/ث، 55.3 ث بالطول المقيس للتسجيل. موظف يشدّ بابًا مقفولًا. ختم المدير يقول «مفتوح» فيصدّق ويرتطم، ثم يقول «مقفول من البداية» فيصدّق ويمحو ملاحظته بيده. ثم تصله ورقتان عن الاجتماع نفسه في الساعة نفسها، «قائم» و«ملغي»، فيختم «صحيح» على الاثنتين، ويجلب الكرسي ليحضر ويعلّق الإلغاء بيده الأخرى. بعدها التسمية: جورج أورويل، «1984». يعود إلى الباب ويفحص القفل بنفسه، ويعيد الختم الثالث من تحت الباب.
**قاعدة العالم:** القفل لا يتغيّر أبدًا (مزلاج عابر وبيت عنكبوت سليم). الذي يتغيّر هو اللافتة وحدها، وبختم المدير فقط.

| المسار | ما فيه |
|---|---|
| `output/final_reel.mp4` · `output/captions.ar.srt` | الريل (H.264/AAC)، والترجمة العربية بتوقيت الكلمات المسجّلة |
| `publish/cover-1080x1920.jpg` · `publish/publish.md` | الغلاف (العنوان داخل قصّ شبكة إنستغرام 3:4)، والعناوين والكابشن لإنستغرام وفيسبوك ويوتيوب Shorts وX |
| `script.md` · `storyboard.md` · `output/qa_report.md` | النص بالتوقيت والنبرة والدقة، 16 لقطة بالغرض والفعل والردّ وما تغيّر والكاميرا والمؤثر وسبب القطع، تقرير الجودة (تقني وإبداعي) |
| `src/characters/employee.tsx` | **الموظف** على rig مكرّم، مع IK ذراعين تضع اليد على المقبض واللوحة والدبوس والخطّاف والكرسي فعلًا |
| `src/characters/office.tsx` | الباب بقفل ثابت (مزلاج، عنكبوت، لوحة أوراق مختومة، كوّة)، وزاويته الجانبية، ويد المدير وختمه، والمذكّرات، والكبسولات والأنبوبان، واللوحة، والمكتب، والكرسي، والدفتر، وباب الاجتماع، والساعة، والسبّورة |
| `src/scenes/world.tsx` · `shots.tsx` | المكتب المتّصل وحالته المرتبطة بكلمات التسجيل، و16 لقطة |
| `assets/svg/` | 23 SVG مستقلًا — `npm run assets` |
| `assets/asset_manifest.json` | مصدر كل عنصر وحقوقه |

## إعادة الاستعمال من 01 و02 (بلا نسخ)

`webpack-override.mjs` نسخة مطابقة لملف `reels/boiling-frog`. يعرّف `@mukarram` و`@mukarram-assets`، ومن هناك تأتي هذه كلها عبر الاستيراد، بلا نسخ ولا تعديل: نظام الحبر، والوجوه، والجسم والمفاصل، ومسارات الوضعيات والنظرات، والمسرح بفلتر الغليان وحبيبات الورق، وخطوط Cairo، ومعظم المؤثرات. الأدوات (`align.py`، `verify.py`، `synccheck.py`، `stills.mjs`، `storyboard.mjs`، `arabic-check.mjs`، `sfx.py`، `export-svg.tsx`) منسوخة من `reels/boiling-frog` ومكيّفة. أبرز تعديل في `align.py`: يقصّ كل سطر عند وقفاته هو، فتسقط الجملة المحذوفة من التسجيل بلا تسريع.

## إعادة الإنتاج

```sh
cd reels/doublethink && npm ci
ffmpeg -i audio/take-A-t9Ygy32amvjiNq4KYRfS.mp3 -ar 48000 -ac 1 audio/take-A.wav
python3 tools/align.py audio/take-A.wav audio/take-A.words.json   # timeline + أسطر الصوت + SRT + كلمات + غلاف الفم
python3 tools/sfx.py
export REMOTION_CHROME=/path/to/headless_shell
npx remotion render src/video/index.ts Reel out/render-raw.mp4 --audio-codec=aac --audio-bitrate=192k
ffmpeg -i out/render-raw.mp4 -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 18 -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart -c:a copy output/final_reel.mp4
npx remotion still src/video/index.ts Cover out/cover.png && ffmpeg -i out/cover.png -q:v 2 publish/cover-1080x1920.jpg
python3 tools/verify.py output/final_reel.mp4 && python3 tools/synccheck.py output/final_reel.mp4 && node tools/arabic-check.mjs && node tools/storyboard.mjs
```
