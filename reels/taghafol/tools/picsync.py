"""Picture sync for the speaker scenes: is each recorded frame shown when its sound is heard?

For every speaker scene, the reel (every second 60 fps frame) and the source (30 fps) are reduced to small
grey crops of the speaker; the frame-to-frame change ("motion") is computed for both and the two motion
curves are cross-correlated over ±6 source frames. Offset 0 = the reel shows the source frame the timeline
maps to; +1 = the reel is one source frame (33 ms) late. Robust to the slow push-in and to encoding, unlike
matching single frames.

usage: python tools/picsync.py render/taghafol.mp4   -> prints JSON; verify.py stores it in review/technical.json
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

root = Path(__file__).resolve().parent.parent
tl = json.loads((root / 'timeline.json').read_text())
W, H = 72, 88
REEL_CROP = 'crop=700:860:190:445'        # inside the speaker frame on the reel (FRAME 185,440,710,870)
SRC_CROP = 'crop=708:870:5:25'            # the same region in source pixels (scale 710/718)


def frames(path, start, dur, crop, every_other):
    sel = ",select='not(mod(n\\,2))'" if every_other else ''
    out = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{start:.4f}', '-i', str(path), '-t', f'{dur:.4f}',
                          '-vf', f'{crop}{sel},scale={W}:{H},format=gray', '-vsync', '0', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(out, dtype=np.uint8).astype(np.float64).reshape(-1, H * W)


def motion(x):
    m = np.abs(np.diff(x, axis=0)).mean(1)
    return (m - m.mean()) / (m.std() + 1e-9)


def measure(video):
    res = []
    for s in [x for x in tl['scenes'] if x['kind'] == 'speaker']:
        piece = tl['edl'][s['seg']]
        a, b = round((s['start'] + 0.1) * 60) / 60, s['end'] - 0.1          # a on the reel's 60 fps grid
        reel = motion(frames(video, a, b - a, REEL_CROP, True))                      # 30 samples per second
        src0 = piece['src'][0] + a - piece['audio'][0]
        # the source frame on screen at src0 is floor(src0 x 30); start the source read on the frame grid, 6 frames
        # earlier, so index 6 is exactly that frame (a start halfway between two frames would shift the read by one)
        j0 = int(np.floor(src0 * 30 + 1e-6))
        src = motion(frames(root / 'public/source.mp4', (j0 - 6 - 0.25) / 30, b - a + 12 / 30 + 0.5 / 30, SRC_CROP, False))
        n = len(reel)
        score = {}
        for k in range(-6, 7):
            seg = src[6 + k: 6 + k + n]
            if len(seg) == n:
                score[k] = float(np.dot(reel, seg) / n)
        best = max(score, key=score.get)
        res.append({'scene': s['sceneId'], 'reel': [round(a, 2), round(b, 2)], 'src': round(src0, 3), 'expectedSourceFrame': j0, 'samples': n,
                    'bestOffsetSourceFrames': best, 'corrAtBest': round(score[best], 3), 'corrAt0': round(score.get(0, float('nan')), 3)})
    return res


if __name__ == '__main__':
    print(json.dumps(measure(sys.argv[1]), ensure_ascii=False, indent=1))
