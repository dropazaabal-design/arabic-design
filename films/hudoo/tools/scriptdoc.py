"""narrative/SCRIPT.md: the narration as a reading script — chapters, every line with its film time, the fully
vowelled text the voice reads, the pause after it and the performance note — from narrative/lines.json and timing/lines.json.
usage: python3 tools/scriptdoc.py"""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
N = json.loads((root / 'narrative/lines.json').read_text(encoding='utf-8'))
T = {l['id']: l for l in json.loads((root / 'timing/lines.json').read_text(encoding='utf-8'))['lines']}
mmss = lambda s: f'{int(s // 60)}:{s % 60:04.1f}'
out = ['# النص المسجّل: «الهدوء الحقيقي ليس كبتًا للمشاعر: كيف تتحكم في استجابتك دون أن تتخلى عن التعبير عن نفسك؟»', '',
       f'المدة الفعلية بعد التسجيل: {mmss(json.loads((root / "timing/lines.json").read_text())["total"])}، '
       f'في {len(N["lines"])} جملة. التوقيت الظاهر لكل جملة هو مكانها في الفيلم. '
       'الوقفة بعد الجملة 0.3 ث، وبعد آخر جملة في الفصل 0.8 ث. النص بالتشكيل الكامل هو ما قرأه الصوت، '
       'وملاحظات الأداء بخط مائل لا تُنطق.', '']
ch = None
for l in N['lines']:
    if l['chapter'] != ch:
        ch = l['chapter']
        out += ['', f'## {ch}. {l["chapterTitle"]}', '']
    t = T[l['id']]
    note = f' — *{l["note"]}*' if l.get('note') else ''
    out.append(f'{l["id"]}. `{mmss(t["start"])}–{mmss(t["end"])}` {l["tts"]}{note} ⟨وقفة {t["pauseAfter"]} ث⟩')
(root / 'narrative/SCRIPT.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
print('narrative/SCRIPT.md', len(N['lines']), 'lines')
