"""creative-3d backend: is Blender usable here, and render a .blend into a pipeline-spec clip.

  python3 reels/creative-3d/backend.py check                      JSON status; exit 0 = the MCP addon answers (author
                                                                  through MCP), 2 = only the Blender binary (render saved
                                                                  .blend files), 1 = neither → fall back to creative-motion
  python3 reels/creative-3d/backend.py render IN.blend OUT.mp4 [--scene NAME]
                                                                  Blender CLI render (PNG frames) → the PIPELINE §11
                                                                  encode (H.264 High, yuv420p, BT.709 tv, CRF 18)
  python3 reels/creative-3d/backend.py selftest                   the check logic against a fake addon (no Blender)

The addon (mcp-for-blender) listens on BLENDER_HOST:BLENDER_PORT (default localhost:9876) with no auth: never expose it.
Rendering needs only the Blender binary (`blender -b`), not the addon; authoring through MCP needs both.
"""
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

HOST, PORT = os.environ.get('BLENDER_HOST', 'localhost'), int(os.environ.get('BLENDER_PORT', '9876'))
BLENDER = os.environ.get('BLENDER_BIN') or shutil.which('blender')


def ping(host=HOST, port=PORT, timeout=3.0):
    """True if the addon answers its own liveness command {"type": "ping"} (touches no scene data)."""
    try:
        with socket.create_connection((host, port), timeout=timeout) as s:
            s.sendall(json.dumps({'type': 'ping', 'params': {}}).encode())
            buf = b''
            while True:
                chunk = s.recv(65536)
                if not chunk:
                    return False
                buf += chunk
                try:
                    return json.loads(buf).get('result', {}).get('pong') is True
                except ValueError:
                    continue            # partial JSON: keep reading
    except OSError:
        return False


def check():
    version = None
    if BLENDER:
        out = subprocess.run([BLENDER, '--version'], capture_output=True, text=True, timeout=60).stdout
        version = out.splitlines()[0] if out else None
    addon = ping()
    mode = ('creative-3d' if version else 'creative-3d (MCP only: render inside Blender, no local binary)') if addon else \
        'creative-3d render-only (start Blender with the addon to author)' if version else 'creative-motion'
    return {'blender': BLENDER, 'version': version, 'addon': f'{HOST}:{PORT}', 'addonReachable': addon, 'mode': mode}, (0 if addon else 2 if version else 1)


def render(blend, out, scene=None):
    if not BLENDER:
        sys.exit('no Blender binary (set BLENDER_BIN or put blender on PATH): use creative-motion')
    out = Path(out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='c3d-') as tmp:
        t0 = time.time()
        cmd = [BLENDER, '-b', str(Path(blend).resolve())] + (['-S', scene] if scene else []) + \
              ['-o', f'{tmp}/f_####', '-F', 'PNG', '-x', '1', '--python-expr',
               'import bpy, json; s = bpy.context.scene; print("C3D", json.dumps([s.frame_start, s.frame_end, s.render.fps]))', '-a']
        log = subprocess.run(cmd, capture_output=True, text=True)
        meta = next((json.loads(l[4:]) for l in log.stdout.splitlines() if l.startswith('C3D ')), None)
        frames = sorted(Path(tmp).glob('f_*.png'))
        if log.returncode or not frames or meta is None:
            sys.exit(f'blender render failed (exit {log.returncode}, {len(frames)} frames):\n{log.stdout[-2000:]}\n{log.stderr[-2000:]}')
        t1 = time.time()
        first, fps = meta[0], meta[2]
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps), '-start_number', str(first), '-i', f'{tmp}/f_%04d.png',
                        '-vf', 'scale=out_range=tv:out_color_matrix=bt709,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
                        '-profile:v', 'high', '-movflags', '+faststart', '-color_range', 'tv', '-colorspace', 'bt709',
                        '-color_primaries', 'bt709', '-color_trc', 'bt709', str(out)], check=True)
    stats = {'frames': len(frames), 'fps': fps, 'renderSeconds': round(t1 - t0, 1), 'encodeSeconds': round(time.time() - t1, 1),
             'secondsPerFrame': round((t1 - t0) / len(frames), 2), 'out': str(out)}
    out.with_suffix('.render.json').write_text(json.dumps(stats) + '\n')
    return stats


def selftest():
    """A fake addon answering ping (in two TCP chunks), and a closed port: check() must tell them apart."""
    srv = socket.socket()
    srv.bind(('127.0.0.1', 0))
    srv.listen(1)
    port = srv.getsockname()[1]

    def serve():
        c, _ = srv.accept()
        assert json.loads(c.recv(4096))['type'] == 'ping'
        body = json.dumps({'status': 'success', 'result': {'pong': True}}).encode()
        c.sendall(body[:10])
        time.sleep(0.05)
        c.sendall(body[10:])
        c.close()
    threading.Thread(target=serve, daemon=True).start()
    assert ping('127.0.0.1', port) is True, 'a live addon must answer'
    srv.close()
    assert ping('127.0.0.1', port, timeout=1) is False, 'a closed port must read as unreachable'
    print('selftest ok')


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['check']:
        status, code = check()
        print(json.dumps(status, ensure_ascii=False))
        sys.exit(code)
    elif a[:1] == ['render'] and len(a) >= 3:
        print(json.dumps(render(a[1], a[2], a[a.index('--scene') + 1] if '--scene' in a else None)))
    elif a[:1] == ['selftest']:
        selftest()
    else:
        sys.exit(__doc__)
