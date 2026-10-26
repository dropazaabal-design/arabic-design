"""Contact sheet of film frames: python3 tools/sheet.py OUT.jpg FRAME [FRAME ...]  (renders stills, tiles them 3 wide)."""
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
out, frames = sys.argv[1], [int(x) for x in sys.argv[2:]]
chrome = os.environ.get('REMOTION_CHROME', '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell')
tmp = Path(tempfile.mkdtemp())
tiles = []
for f in frames:
    p = tmp / f'{f}.png'
    subprocess.run(['npx', 'remotion', 'still', 'src/index.ts', 'Film', str(p), f'--frame={f}', f'--browser-executable={chrome}', '--log=error'],
                   cwd=root, check=True)
    im = Image.open(p).convert('RGB').resize((640, 360))
    ImageDraw.Draw(im).text((8, 6), f'{f} ({f / 60:.1f}s)', fill=(200, 0, 0))
    tiles.append(im)
cols = 3
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (cols * 644, rows * 364), 'grey')
for i, im in enumerate(tiles):
    sheet.paste(im, ((i % cols) * 644 + 2, (i // cols) * 364 + 2))
sheet.save(out, quality=88)
print(out)
