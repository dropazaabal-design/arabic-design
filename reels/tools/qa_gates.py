"""Quality gates for a Baseera reel — the checks of reels/PIPELINE.md §12 as pass/fail tests.

usage:
  python3 reels/tools/qa_gates.py reels/<slug> [--measure]   one reel
  python3 reels/tools/qa_gates.py --all [--measure]          every reel whose script.json has a "qa" block
  python3 reels/tools/qa_gates.py --self-test                the gate logic on synthetic data

Without --measure the gates read the reel's committed measurements (output/qa-*.json) and fail if they are stale
(measured from a different final_reel.mp4). With --measure the reel's own tools (verify.py, synccheck.py, motion.py,
arabic-check.mjs) are re-run first, into a temp dir — needs ffmpeg, numpy and node. Exit code 1 if any gate fails.

Per-reel settings live in script.json → "qa" (absent = the reel is not gated):
  "qa": { "duration": [88, 92],                   seconds, from the brief
          "cta": { "seg": "s29", "srt": "تابعنا" }, the like/follow line: must be in the mix and in the SRT
          "maxStillSeconds": 2.0, "stillAllow": ["sh30"],
          "maxSilenceSeconds": 0.8,                 opt-in: fail on any silence longer than this (verify.py, −45 dB)
          "renderTests": true,                      opt-in: output/qa-render-tests.json must show every test passing
          "waive": { "arabic": ["text.clipped-word"] }, "waiveReason": "…" }   a waiver needs a reason
The frame rate in "spec" is the reel's own (timeline.json: 30 or 60). Loudness: −16 ± 1 LUFS, true peak ≤ −4 dBTP.
"""
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

LATIN = re.compile('[A-Za-z]')
EASTERN_DIGITS = re.compile('[٠-٩۰-۹]')
TARGET_LUFS, LUFS_TOL, MAX_PEAK, MAX_SYNC_MS, MAX_CUE_CHARS = -16.0, 1.0, -4.0, 20.0, 46


def load(p):
    return json.loads(Path(p).read_text(encoding='utf-8'))


def srt_cues(text):
    """[(start_s, end_s, text)] from an SRT; raises on a malformed block."""
    t = lambda s: (lambda h, m, rest: int(h) * 3600 + int(m) * 60 + float(rest.replace(',', '.')))(*s.strip().split(':'))
    cues = []
    for block in [b for b in text.strip().split('\n\n') if b.strip()]:
        lines = block.strip().split('\n')
        a, b = lines[1].split('-->')
        cues.append((t(a), t(b), ' '.join(lines[2:]).strip()))
    return cues


def jpeg_size(path):
    """(width, height) of a baseline/progressive JPEG, read from its SOF marker (no dependencies)."""
    data = Path(path).read_bytes()
    i = 2
    while i < len(data):
        marker, length = data[i + 1], int.from_bytes(data[i + 2:i + 4], 'big')
        if marker in (0xC0, 0xC1, 0xC2):
            return int.from_bytes(data[i + 7:i + 9], 'big'), int.from_bytes(data[i + 5:i + 7], 'big')
        i += 2 + length
    raise ValueError('no SOF marker')


def measure(reel, tmp):
    """Re-run the reel's own measuring tools; returns the paths of fresh measurements."""
    video = 'output/final_reel.mp4'
    run = lambda *a, **k: subprocess.run(a, cwd=reel, check=True, capture_output=True, text=True, **k)
    run('python3', 'tools/verify.py', video, str(tmp / 'qa-technical.json'))
    (tmp / 'qa-sync.json').write_text(run('python3', 'tools/synccheck.py', video).stdout, encoding='utf-8')
    run('python3', 'tools/motion.py', video, str(tmp / 'qa-motion.json'))
    subprocess.run(['node', 'tools/arabic-check.mjs'], cwd=reel, capture_output=True, text=True)   # exit 1 = errors found; the JSON says which
    return {'technical': tmp / 'qa-technical.json', 'sync': tmp / 'qa-sync.json', 'motion': tmp / 'qa-motion.json', 'arabic': reel / 'output/qa-arabic-check.json'}


def gates(reel, m=None):
    """Evaluate every gate for one reel. m = measurement paths (default: the committed output/qa-*.json)."""
    reel = Path(reel)
    script, tl = load(reel / 'script.json'), load(reel / 'timeline.json')
    qa = script['qa']
    m = m or {k: reel / f'output/qa-{v}.json' for k, v in (('technical', 'technical'), ('sync', 'sync'), ('motion', 'motion'), ('arabic', 'arabic-check'))}
    tech, sync, motion, arabic = (load(m[k]) for k in ('technical', 'sync', 'motion', 'arabic'))
    out = []
    add = lambda name, ok, detail: out.append((name, bool(ok), detail))

    mp4 = reel / 'output/final_reel.mp4'
    add('fresh', mp4.exists() and tech.get('bytes') == mp4.stat().st_size, f"measured {tech.get('bytes')} B, file {mp4.stat().st_size if mp4.exists() else 'missing'} B")

    v, a = tech['video'], (tech['audio'] or [{}])[0]
    spec = (v['codec_name'], v['pix_fmt'], v['width'], v['height'], v['r_frame_rate'], a.get('codec_name'), a.get('sample_rate'))
    add('spec', spec == ('h264', 'yuv420p', 1080, 1920, f"{tl['fps']}/1", 'aac', '48000'), '/'.join(map(str, spec)))
    add('frames', int(v['nb_frames']) == tl['durationInFrames'] and tech['cadence']['irregularDeltas'] == 0,
        f"{v['nb_frames']} frames vs timeline {tl['durationInFrames']}, irregular {tech['cadence']['irregularDeltas']}")
    lo, hi = qa['duration']
    add('duration', lo <= tech['duration']['container'] <= hi, f"{tech['duration']['container']:.2f} s in [{lo}, {hi}]")
    L = tech['loudness']
    add('loudness', abs(L['integratedLUFS'] - TARGET_LUFS) <= LUFS_TOL and L['truePeakDBFS'] <= MAX_PEAK, f"{L['integratedLUFS']} LUFS, peak {L['truePeakDBFS']} dBTP")
    add('black/freeze', not tech['black'] and not tech['frozenOver3s'], f"black {tech['black']}, frozen {tech['frozenOver3s']}")
    if 'maxSilenceSeconds' in qa:
        long_ = [(round(a, 2), round(b, 2)) for a, b in tech['silencesOver0.8s'] if b - a > qa['maxSilenceSeconds']]
        add('silence', not long_, f"over {qa['maxSilenceSeconds']} s: {long_ or 'none'}")
    if qa.get('renderTests'):
        rt = reel / 'output/qa-render-tests.json'
        r = load(rt) if rt.exists() else {'passed': 0, 'failed': 'missing'}
        add('render tests', r['passed'] > 0 and r['failed'] == 0, f"{r['passed']} passed, {r['failed']} failed")

    seg_ids = [s['id'] for s in tl['segments']]
    found = {d['id']: d for d in sync['detail']}
    add('sync', sorted(found) == sorted(seg_ids) and sync['maxAbsOffsetMs'] <= MAX_SYNC_MS, f"{len(found)}/{len(seg_ids)} lines, max {sync['maxAbsOffsetMs']} ms")

    allow = set(qa.get('stillAllow', []))
    still = [(s['shot'], s['longestStillSeconds']) for s in motion['shots'] if s['shot'] not in allow and s['longestStillSeconds'] > qa.get('maxStillSeconds', 2.0)]
    add('motion', not still, f"over {qa.get('maxStillSeconds', 2.0)} s: {still or 'none'}")

    waived = set(qa.get('waive', {}).get('arabic', []))
    if waived and not qa.get('waiveReason'):
        add('arabic', False, 'a waiver needs "waiveReason"')
    else:
        bad = [i for i in arabic['textIssues'] if i[0] == 'error' and i[1] not in waived]
        add('arabic', not bad, f"{arabic['errors']} errors, {len(bad)} not waived" + (f" ({sorted(waived)})" if waived else ''))

    texts = [o['text'] for o in script.get('onScreen', [])]
    add('on-screen text', texts and not any(LATIN.search(t) or EASTERN_DIGITS.search(t) for t in texts),
        f"{len(texts)} strings; Latin/Eastern digits in: {[t for t in texts if LATIN.search(t) or EASTERN_DIGITS.search(t)] or 'none'}")

    cues = srt_cues((reel / 'output/captions.ar.srt').read_text(encoding='utf-8'))
    order = all(c[0] < c[1] for c in cues) and all(p[1] <= n[0] + 1e-3 for p, n in zip(cues, cues[1:]))
    longest = max(len(c[2]) for c in cues)
    add('srt', order and longest <= MAX_CUE_CHARS and not any(LATIN.search(c[2]) for c in cues), f"{len(cues)} cues, ordered {order}, longest {longest} chars")

    cta = qa.get('cta')
    if cta:
        line = found.get(cta['seg'])
        add('cta', line is not None and abs(line['offsetMs']) <= MAX_SYNC_MS and any(cta['srt'] in c[2] for c in cues),
            f"{cta['seg']} in mix at {line and line['found']} s; «{cta['srt']}» in SRT: {any(cta['srt'] in c[2] for c in cues)}")

    al = load(reel / 'audio/alignment.json')
    unheard = [w['script'] for w in al if not w.get('heard')]
    add('voice', not unheard, f"{len(al)} script words, unheard: {unheard or 'none'}")

    bad_hash = []
    for it in load(reel / 'assets/asset_manifest.json')['items']:
        if 'sha256' in it:
            f = reel / it.get('master', it['path'])
            if not f.exists() or hashlib.sha256(f.read_bytes()).hexdigest() != it['sha256']:
                bad_hash.append(str(f.relative_to(reel)))
    add('manifest', not bad_hash, f"hash mismatch/missing: {bad_hash or 'none'}")

    cover = reel / 'publish/cover-1080x1920.jpg'
    add('cover', cover.exists() and jpeg_size(cover) == (1080, 1920), f"{jpeg_size(cover) if cover.exists() else 'missing'}")
    return out


def report(reel, results):
    print(f'\n{reel}')
    for name, ok, detail in results:
        print(f"  {'PASS' if ok else 'FAIL'}  {name:<15} {detail}")
    return all(ok for _, ok, _ in results)


def self_test():
    """Build a passing synthetic reel, then break one thing at a time and expect exactly that gate to fail."""
    with tempfile.TemporaryDirectory() as d:
        r = Path(d)
        for sub in ('output', 'audio', 'assets', 'publish'):
            (r / sub).mkdir()
        mp4 = r / 'output/final_reel.mp4'
        mp4.write_bytes(b'x' * 100)
        w = lambda p, o: (r / p).write_text(json.dumps(o, ensure_ascii=False), encoding='utf-8')
        w('script.json', {'onScreen': [{'id': 'a', 'text': 'تجربة آش، 1955'}], 'qa': {'duration': [60, 75], 'cta': {'seg': 's02', 'srt': 'تابعنا'}}})
        w('timeline.json', {'fps': 30, 'durationInFrames': 2100, 'segments': [{'id': 's01'}, {'id': 's02'}]})
        tech = {'bytes': 100, 'video': {'codec_name': 'h264', 'pix_fmt': 'yuv420p', 'width': 1080, 'height': 1920, 'r_frame_rate': '30/1', 'nb_frames': '2100'},
                'audio': [{'codec_name': 'aac', 'sample_rate': '48000'}], 'duration': {'container': 70.0}, 'cadence': {'irregularDeltas': 0},
                'loudness': {'integratedLUFS': -16.1, 'truePeakDBFS': -4.0}, 'black': [], 'frozenOver3s': [], 'silencesOver0.8s': [[3.0, 3.5]]}
        w('output/qa-technical.json', tech)
        w('output/qa-sync.json', {'maxAbsOffsetMs': 12, 'detail': [{'id': 's01', 'found': 1.0, 'offsetMs': 3}, {'id': 's02', 'found': 60.0, 'offsetMs': -12}]})
        w('output/qa-motion.json', {'shots': [{'shot': 'sh01', 'longestStillSeconds': 0.4}]})
        w('output/qa-arabic-check.json', {'errors': 0, 'textIssues': []})
        (r / 'output/captions.ar.srt').write_text('1\n00:00:00,100 --> 00:00:01,000\nمن فضلك\n\n2\n00:01:00,000 --> 00:01:02,000\nوتابعنا\n\n', encoding='utf-8')
        w('audio/alignment.json', [{'script': 'من', 'heard': 'من'}])
        (r / 'assets/x.bin').write_bytes(b'abc')
        w('assets/asset_manifest.json', {'items': [{'path': 'assets/x.bin', 'sha256': hashlib.sha256(b'abc').hexdigest()}]})
        # minimal JPEG header: SOI, SOF0 with height 1920, width 1080
        (r / 'publish/cover-1080x1920.jpg').write_bytes(b'\xff\xd8' + b'\xff\xc0\x00\x11\x08' + (1920).to_bytes(2, 'big') + (1080).to_bytes(2, 'big') + b'\x00' * 12)
        failing = lambda: sorted(n for n, ok, _ in gates(r) if not ok)
        assert failing() == [], failing()

        def expect(gate, mutate, restore):
            mutate()
            got = failing()
            restore()
            assert got == [gate], f'{gate}: {got}'

        expect('loudness', lambda: w('output/qa-technical.json', {**tech, 'loudness': {'integratedLUFS': -20, 'truePeakDBFS': -4}}), lambda: w('output/qa-technical.json', tech))
        expect('loudness', lambda: w('output/qa-technical.json', {**tech, 'loudness': {'integratedLUFS': -16, 'truePeakDBFS': -3.0}}), lambda: w('output/qa-technical.json', tech))
        expect('spec', lambda: w('timeline.json', {'fps': 60, 'durationInFrames': 2100, 'segments': [{'id': 's01'}, {'id': 's02'}]}),
               lambda: w('timeline.json', {'fps': 30, 'durationInFrames': 2100, 'segments': [{'id': 's01'}, {'id': 's02'}]}))
        qa_on = {'duration': [60, 75], 'cta': {'seg': 's02', 'srt': 'تابعنا'}, 'maxSilenceSeconds': 0.4}
        base_script = {'onScreen': [{'id': 'a', 'text': 'تجربة آش، 1955'}], 'qa': {'duration': [60, 75], 'cta': {'seg': 's02', 'srt': 'تابعنا'}}}
        expect('silence', lambda: w('script.json', {**base_script, 'qa': qa_on}), lambda: w('script.json', base_script))
        w('output/qa-render-tests.json', {'passed': 11, 'failed': 1})
        expect('render tests', lambda: w('script.json', {**base_script, 'qa': {**base_script['qa'], 'renderTests': True}}), lambda: w('script.json', base_script))
        expect('duration', lambda: w('output/qa-technical.json', {**tech, 'duration': {'container': 80}}), lambda: w('output/qa-technical.json', tech))
        expect('fresh', lambda: mp4.write_bytes(b'x' * 101), lambda: mp4.write_bytes(b'x' * 100))
        expect('on-screen text', lambda: w('script.json', {'onScreen': [{'id': 'a', 'text': 'Asch 1955'}], 'qa': {'duration': [60, 75], 'cta': {'seg': 's02', 'srt': 'تابعنا'}}}),
               lambda: w('script.json', {'onScreen': [{'id': 'a', 'text': 'تجربة آش، 1955'}], 'qa': {'duration': [60, 75], 'cta': {'seg': 's02', 'srt': 'تابعنا'}}}))
        expect('motion', lambda: w('output/qa-motion.json', {'shots': [{'shot': 'sh01', 'longestStillSeconds': 3.1}]}), lambda: w('output/qa-motion.json', {'shots': [{'shot': 'sh01', 'longestStillSeconds': 0.4}]}))
        srt = (r / 'output/captions.ar.srt').read_text(encoding='utf-8')
        expect('srt', lambda: (r / 'output/captions.ar.srt').write_text(srt.replace('00:00:01,000', '00:01:01,000'), encoding='utf-8'), lambda: (r / 'output/captions.ar.srt').write_text(srt, encoding='utf-8'))
        expect('cta', lambda: (r / 'output/captions.ar.srt').write_text(srt.replace('وتابعنا', 'شكرًا'), encoding='utf-8'), lambda: (r / 'output/captions.ar.srt').write_text(srt, encoding='utf-8'))
        expect('manifest', lambda: (r / 'assets/x.bin').write_bytes(b'abd'), lambda: (r / 'assets/x.bin').write_bytes(b'abc'))
        expect('voice', lambda: w('audio/alignment.json', [{'script': 'من', 'heard': None}]), lambda: w('audio/alignment.json', [{'script': 'من', 'heard': 'من'}]))
    print('self-test: all gates pass on good data and each fails alone on its own fault')


def main(argv):
    if '--self-test' in argv:
        self_test()
        return 0
    do_measure = '--measure' in argv
    here = Path(__file__).resolve().parent.parent
    targets = [p.parent for p in sorted(here.glob('*/script.json')) if 'qa' in load(p)] if '--all' in argv else [Path(a).resolve() for a in argv if not a.startswith('--')]
    if not targets:
        print('no reel to check (give reels/<slug>, or --all for every reel with a "qa" block in script.json)')
        return 1
    ok = True
    for reel in targets:
        with tempfile.TemporaryDirectory() as tmp:
            ok &= report(reel.relative_to(here.parent) if reel.is_relative_to(here.parent) else reel, gates(reel, measure(reel, Path(tmp)) if do_measure else None))
    print('\nALL GATES PASS' if ok else '\nGATES FAILED')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
