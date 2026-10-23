"""manifest.json: every shot tied to its words, frames, plan, code, assets, word-cued motion, sounds and preview.

Read from the shot list (narrative/shotlist.json), the timing (timing/*.json, tools/timeline.py), the shot code
(src/scenes/bN.tsx: the kit components it draws and the words its actions are cued on), the sound cues (audio/sfx/bN.json)
and the previews (previews/shots/NNN.png). usage: python3 tools/manifest.py
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from timeline import FPS, LINES, SHOTS, T, norm, root  # noqa: E402

FRAMES = {s['id']: s for s in json.loads((root / 'timing/shots.json').read_text(encoding='utf-8'))}
LINE = {l['id']: l for l in LINES['lines']}

# where each drawable component lives, and its exported SVG when there is one
SVG = {
    'MeetingBack': 'backgrounds/meeting-room.svg', 'MeetingTableFront': 'backgrounds/meeting-room.svg', 'Meeting': 'backgrounds/meeting-room.svg',
    'UnderTable': 'backgrounds/under-table.svg', 'Street': 'backgrounds/street.svg', 'HomeLiving': 'backgrounds/living-room.svg',
    'Bedroom': 'backgrounds/bedroom.svg', 'DiningBack': 'backgrounds/dining-room.svg', 'DiningTableFront': 'backgrounds/dining-room.svg',
    'DeskBack': 'backgrounds/office-desk.svg', 'DeskFront': 'backgrounds/office-desk.svg', 'CoffeeCorner': 'backgrounds/coffee-corner.svg',
    'Corridor': 'backgrounds/corridor.svg', 'Lake': 'assets/metaphors/lake.svg', 'Pot': 'assets/metaphors/pot-pressed.svg',
    'Doors': 'assets/metaphors/three-doors.svg', 'SingleDoor': 'assets/metaphors/single-door.svg', 'Tree': 'assets/metaphors/tree-wind.svg',
    'Wave': 'assets/metaphors/wave.svg', 'Loop': 'assets/metaphors/loop.svg', 'Storm': 'assets/metaphors/storm.svg',
    'Plan': 'assets/metaphors/plan.svg', 'Gap': 'assets/metaphors/gap.svg', 'Phone': 'assets/props/phone-off.svg',
    'ChatScreen': 'assets/props/phone-chat.svg', 'PostScreen': 'assets/props/phone-post.svg', 'LockScreen': 'assets/props/phone-lock.svg',
    'Notebook': 'assets/props/notebook.svg', 'Pen': 'assets/props/pen.svg', 'Paper': 'assets/props/paper.svg', 'Folder': 'assets/props/folder.svg',
    'Calendar': 'assets/props/calendar.svg', 'Laptop': 'assets/props/laptop.svg', 'Lamp': 'assets/props/desk-lamp.svg', 'Mug': 'assets/props/mug.svg',
    'Glass': 'assets/props/glass.svg', 'Plate': 'assets/props/plate.svg', 'Clock': 'assets/props/wall-clock.svg', 'Plant': 'assets/props/plant.svg',
    'Chair': 'assets/props/chair-office.svg', 'SpeechBubble': 'assets/props/bubble-say.svg', 'ThoughtCloud': 'assets/props/bubble-think.svg',
}
CHAR_SVG = 'characters/{}/full-stand.svg'


def kit_index():
    """Component name → source file, for everything exported from src/kit and src/scenes/common.tsx."""
    idx = {}
    for p in sorted((root / 'src/kit').rglob('*.tsx')) + [root / 'src/scenes/common.tsx', root / 'src/film/engine.tsx']:
        for m in re.finditer(r'export (?:const|function) ([A-Z][A-Za-z0-9]*)', p.read_text(encoding='utf-8')):
            idx.setdefault(m.group(1), str(p.relative_to(root)))
    return idx


def shot_code(src, sid):
    """The source of one shot inside a batch file: from `  N: (c) =>` to the next shot or the end of SHOTS."""
    m = re.search(rf'^  {sid}: \(c\)', src, re.M)
    if not m:
        return None
    nxt = re.search(r'^  \d+: \(c\)|^\};', src[m.end():], re.M)
    return src[m.start(): m.end() + (nxt.start() if nxt else len(src))]


def main():
    idx = kit_index()
    out = []
    for s, t in zip(SHOTS, T):
        sid = s['id']
        b = (sid - 1) // 20 + 1
        src_path = root / f'src/scenes/b{b}.tsx'
        src = src_path.read_text(encoding='utf-8')
        # local helpers named in the shot are expanded one level, so components drawn through them count too
        code = shot_code(src, sid) or ''
        local = {m.group(1): m.start() for m in re.finditer(r'^const ([A-Z][A-Za-z0-9]*)', src, re.M)}
        used = set(re.findall(r'<([A-Z][A-Za-z0-9]*)', code))
        for name in list(used):
            if name in local:
                body = src[local[name]: src.find('\n);', local[name]) + 3]
                used |= set(re.findall(r'<([A-Z][A-Za-z0-9]*)', body))
        who = sorted(set(re.findall(r'who="([a-z0-9]+)"', code)) | set(re.findall(r"who: '([a-z0-9]+)'", code)))
        if 'Meeting' in used and not who:
            who = ['mona', 'att1', 'hadi', 'att2', 'jaser', 'salim']
        assets = []
        for name in sorted(used):
            if name in ('Stage', 'AbsoluteFill', 'React'):
                continue
            a = {'component': name, 'source': idx.get(name, f'src/scenes/b{b}.tsx (local)')}
            if name in SVG:
                a['svg'] = SVG[name]
            assets.append(a)
        cues = []
        for m in re.finditer(r"c\.at\('([^']+)'(?:,\s*(true|false))?(?:,\s*(\d+))?\)", code):
            word, end, nth = m.group(1), m.group(2) == 'true', int(m.group(3) or 0)
            hits = [w for w in t['words'] if norm(word) in norm(w['word'])]
            if hits:
                w = hits[min(nth, len(hits) - 1)]
                cues.append({'word': w['word'], 'time': round(w['end'] if end else w['start'], 3)})
        cues = list({(c['word'], c['time']): c for c in cues}.values())
        sfx_path = root / f'audio/sfx/b{b}.json'
        sfx = [c for c in json.loads(sfx_path.read_text(encoding='utf-8')) if c['shot'] == sid] if sfx_path.exists() else []
        fr = FRAMES[sid]
        L = LINE[s['line']]
        prev = root / f'previews/shots/{sid:03d}.png'
        out.append({
            'id': sid, 'chapter': L['chapter'], 'chapterTitle': L['chapterTitle'], 'line': s['line'],
            'text': ' '.join(w['word'] for w in t['words']),
            'speech': [round(t['speech'][0], 3), round(t['speech'][1], 3)],
            'frames': {'from': fr['from'], 'to': fr['to'], 'count': fr['to'] - fr['from'], 'key': fr['key']},
            'time': [round(fr['from'] / FPS, 3), round(fr['to'] / FPS, 3)],
            'plan': {k: s[k] for k in ('type', 'place', 'chars', 'props', 'frame', 'expr', 'action', 'cut', 'goal')},
            'code': f'src/scenes/b{b}.tsx', 'built': bool(code), 'composition': f'Shot{sid:03d}',
            'characters': [{'who': w, 'svg': CHAR_SVG.format(w)} for w in who],
            'assets': assets, 'wordCues': cues, 'sfx': sfx,
            'preview': str(prev.relative_to(root)) if prev.exists() else None,
        })
    (root / 'manifest.json').write_text(json.dumps({'film': 'الهدوء الحقيقي ليس كبتًا للمشاعر', 'fps': FPS, 'width': 1920, 'height': 1080,
                                                    'frames': LINES['frames'], 'seconds': LINES['total'], 'shots': out}, ensure_ascii=False, indent=1), encoding='utf-8')
    built = sum(o['built'] for o in out)
    print(f'manifest.json: {len(out)} shots, {built} built, {sum(o["preview"] is not None for o in out)} previews')


if __name__ == '__main__':
    main()
