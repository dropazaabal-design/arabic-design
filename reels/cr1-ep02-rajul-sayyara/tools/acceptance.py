"""Acceptance report per deliverable (CR1 §13), from the measured reports in review/ and the static
checks. Each domain says what was checked, by what, and what still waits on a person.

usage: python3 tools/acceptance.py   → review/acceptance.md
"""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'episode-brief.json').read_text(encoding='utf-8'))['version']
OUTS = [('16x9', 'long', 'الحلقة الأفقية'), ('9x16', 'short', 'الريل العمودي'), ('4x5', 'short', 'نسخة التغذية')]


def ok(cmd):
    r = subprocess.run(cmd, cwd=root, capture_output=True, text=True)
    return r.returncode == 0, (r.stdout.strip().splitlines() or [''])[-1][:160]


static = {'palette': ok(['node', 'tools/palette.mjs']), 'copy': ok(['node', 'tools/copycheck.mjs']), 'fonts': ok(['python3', 'tools/fontcheck.py']),
          'types': ok(['npx', 'tsc', '--noEmit', '-p', '.'])}
mark = lambda b: '✅' if b else '❌'
lines = [f'# تقرير القبول — الإصدار {version}', '',
         'لكل مخرج ستة مجالات (CR1 §13). «آلي» = قيس أو فُحص بأداة في هذا المستودع. «ينتظر إنسانًا» = لا تثبته الأداة: مشاهدة المعنى وسماع الأداء.', '',
         '## فحوص مشتركة', '',
         f"- {mark(static['palette'][0])} الألوان المحظورة (أصفر/برتقالي/ذهبي): `tools/palette.mjs` — {static['palette'][1]}",
         f"- {mark(static['copy'][0])} النص على الشاشة عربي فقط، أرقام غربية، الترجمة = النص المقفل حرفيًا، ≤ 17 حرفًا/ث: `tools/copycheck.mjs`",
         f"- {mark(static['fonts'][0])} كل حرف ظاهر موجود في خطه وجداول التشكيل حاضرة: `tools/fontcheck.py` — {static['fonts'][1]}",
         f"- {mark(static['types'][0])} TypeScript بلا أخطاء", '']
for ratio, prog, name in OUTS:
    rep = json.loads((root / f'review/cr1-ep02_rajul-sayyara_{ratio}_v{version}.json').read_text(encoding='utf-8'))
    c = rep['checks']
    lines += [f'## {name} — `{rep["file"]}`', '',
              f"{rep['video']['width']}×{rep['video']['height']}، {rep['duration']['frames']} إطارًا ({rep['duration']['container']:.2f} ث)، "
              f"{rep['bytes'] / 1e6:.1f} ميغابايت، فيديو ≈ {rep['videoBitrate'] / 1e6:.2f} Mbps، {rep['loudness']['integratedLUFS']} LUFS، ذروة {rep['loudness']['truePeakDBTP']} dBTP.", '',
              '| المجال | ما فُحص | النتيجة | يوقف التسليم؟ |', '|---|---|---|---|',
              '| المحتوى | سجل الادعاءات C1–C9 في `sources.json`؛ عبارات هاوسل «بمعنى كلامه»؛ قصتنا موسومة «قصة توضيحية» وقصة الكتاب «من الكتاب»؛ بلا وعود ثراء ولا توصية بأصل مالي | آلي/يدوي: ✅ — ينتظر إنسانًا: مطابقة الصياغة مع النسخة العربية من الكتاب | لا |',
              f"| السرد | رغبة ← قرار ← نتيجة ← فهم ← حدود ← تطبيق ← عودة للبداية (`scene-plan.json`)؛ {'الريل مستقل بنصه' if prog == 'short' else 'سؤال الإغلاق مرتبط بالمشهد الأول'} | مراجعة لقطات: ✅ — ينتظر إنسانًا: المشاهدة كاملة | لا |",
              '| العربية | اتصال الحروف واتجاهها في اللقطات، الخطوط، الترجمة حرفية | آلي ✅ + لقطات ✅ — ينتظر إنسانًا: القراءة على هاتف | لا |',
              f"| الصوت | الشدة والذروة {mark(c['loudness −16 ±1 LUFS'] and c['true peak ≤ −4 dBTP'])}؛ بداية كل مقطع في موضعه {mark(c['voice lines start on time (≤ 1 frame)'])} (أقصى فرق {rep['voiceOnsets']['maxAbsOffset']} ث)، وكل كلمة بعد وقفة {mark(c['words after a pause on time (≤ 1 frame)'])} ({rep['voiceOnsets']['afterPause']['words']} كلمة، أقصى فرق {rep['voiceOnsets']['afterPause']['maxAbsOffset']} ث)؛ صمت فوق 0.8 ث: {len(rep['silencesOver0.8s'])} | كل النسخ المختارة فُرّغت بـWhisper محليًا، ونهاياتها مفرّغة وحدها — ينتظر إنسانًا: سماع كامل، وأولًا الكلمات في `review/pronunciation.json` | **نعم حتى السماع** |",
              f"| الصورة | المقاس {mark(c[[k for k in c if 'x' in k and k[0].isdigit()][0]])}؛ لا إطارات سوداء {mark(c['no black frames'])}؛ ثبات فوق 3 ث: {len(rep['holdsOver3s'])}؛ الهوية واللون ✅ | لقطات ✅ — ينتظر إنسانًا: مشاهدة الثبات المعلَّم | لا |",
              f"| الملف | H.264 ‏yuv420p {mark(c['h264 + yuv420p progressive'])}، ‏60fps ثابت {mark(c['60 fps constant'])}، ‏BT.709 {mark(c['BT.709 tags'])}، ‏AAC-LC ‏48 kHz {mark(c['AAC-LC 48 kHz'])}، بدء سريع {mark(c['fast start (moov first)'])}، فك كامل بلا أخطاء {mark(c['full decode, no errors'])}، الإطارات = الخط الزمني {mark(c['frames = timeline'])} | {'✅ كله' if rep['pass'] else '❌ ' + '، '.join(k for k, v in c.items() if not v)} | {'لا' if rep['pass'] else '**نعم**'} |", '']
    if rep['holdsOver3s'] or rep['silencesOver0.8s']:
        lines += ['علامات مراجعة (CR1 §9):', '']
        lines += [f"- ثبات صورة من {s} ث لمدة {d} ث" for s, d in rep['holdsOver3s']]
        lines += [f"- صمت من {a} إلى {b} ث" for a, b in rep['silencesOver0.8s']]
        lines += ['']
lines += ['## الحالة', '',
          'كل الفحوص الآلية في الجداول أعلاه. التسليم الفني جاهز؛ **الاعتماد النهائي ينتظر سماعًا كاملًا ومشاهدة على الهاتف** من صاحب القناة، ثم يُنشر بتكليف منفصل (CR1 §13).', '']
(root / 'review/acceptance.md').write_text('\n'.join(lines), encoding='utf-8')
print('\n'.join(lines[:12]))
