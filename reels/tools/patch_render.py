"""Fix a few seconds of a finished reel without a full re-render: render only the changed frame ranges, splice them
into the first-generation out/render-raw.mp4 (from render_final.sh), then run the same single PIPELINE §11 re-encode.
Audio is copied untouched, so use it for picture-only fixes (sound changes: re-mix and remux instead).

usage: python3 reels/tools/patch_render.py reels/<slug> 480-700 2080-2820   (inclusive frame ranges, Reel composition)
Needs REMOTION_CHROME like render_final.sh. Writes output/final_reel.mp4 and output/render-patch.json, and fails
unless the result has exactly timeline.json's durationInFrames."""
import json
import subprocess
import sys
import time
from pathlib import Path

reel = Path(sys.argv[1]).resolve()
ranges = sorted(tuple(map(int, r.split('-'))) for r in sys.argv[2:])
total = json.loads((reel / 'timeline.json').read_text())['durationInFrames']
assert ranges and all(a <= b for a, b in ranges) and ranges[0][0] > 0 and ranges[-1][1] < total - 1, ranges
assert all(b1 < a2 for (_, b1), (a2, _) in zip(ranges, ranges[1:])), 'ranges overlap'
run = lambda *a: subprocess.run(a, cwd=reel, check=True)

t0 = time.time()
for a, b in ranges:
    run('npx', 'remotion', 'render', 'src/video/index.ts', 'Reel', f'out/patch-{a}-{b}.mp4', f'--frames={a}-{b}', '--muted', '--log=error')
t1 = time.time()

# raw[0:a1) + patch1 + raw(b1:a2) + patch2 + … + raw(bn:end)
n = len(ranges)
parts, graph, cut = [], [f'[0:v]split={n + 1}' + ''.join(f'[r{i}]' for i in range(n + 1))], 0
for i, (a, b) in enumerate(ranges):
    graph.append(f'[r{i}]trim=start_frame={cut}:end_frame={a},setpts=PTS-STARTPTS[k{i}]')
    graph.append(f'[{i + 1}:v]setpts=PTS-STARTPTS[p{i}]')
    parts += [f'[k{i}]', f'[p{i}]']
    cut = b + 1
graph.append(f'[r{n}]trim=start_frame={cut},setpts=PTS-STARTPTS[k{n}]')
parts.append(f'[k{n}]')
graph.append(''.join(parts) + f'concat=n={len(parts)}:v=1:a=0,scale=in_range=pc:out_range=tv,format=yuv420p[v]')
inputs = ['-i', 'out/render-raw.mp4'] + [x for a, b in ranges for x in ('-i', f'out/patch-{a}-{b}.mp4')]
run('ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(graph), '-map', '[v]', '-map', '0:a',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-movflags', '+faststart', '-color_range', 'tv',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'copy', 'output/final_reel.mp4')
t2 = time.time()

frames = int(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v', '-show_entries', 'stream=nb_read_frames',
                             '-of', 'csv=p=0', 'output/final_reel.mp4'], cwd=reel, capture_output=True, text=True).stdout.strip())
assert frames == total, f'spliced file has {frames} frames, timeline says {total}'
out = {'ranges': [f'{a}-{b}' for a, b in ranges], 'patchFrames': sum(b - a + 1 for a, b in ranges), 'patchRenderSeconds': round(t1 - t0),
       'encodeSeconds': round(t2 - t1), 'frames': frames, 'finished': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
(reel / 'output/render-patch.json').write_text(json.dumps(out) + '\n')
print(json.dumps(out))
