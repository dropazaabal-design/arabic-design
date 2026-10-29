"""Tile PNG stills into contact sheets: python3 tools/montage.py DIR OUTPREFIX [per_sheet=12]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
d, prefix = Path(sys.argv[1]), sys.argv[2]
n = int(sys.argv[3]) if len(sys.argv) > 3 else 12
files = sorted(d.glob('*.png'))
for s in range(0, len(files), n):
    part = files[s:s + n]
    tiles = []
    for p in part:
        im = Image.open(p).convert('RGB').resize((360, 640))
        ImageDraw.Draw(im).text((8, 6), f'{int(p.stem)} ({int(p.stem) / 60:.1f}s)', fill=(200, 0, 0))
        tiles.append(im)
    rows = (len(tiles) + 3) // 4
    sheet = Image.new('RGB', (4 * 364, rows * 644), 'grey')
    for i, im in enumerate(tiles):
        sheet.paste(im, ((i % 4) * 364 + 2, (i // 4) * 644 + 2))
    out = f'{prefix}-{s // n + 1:02d}.jpg'
    sheet.save(out, quality=85)
    print(out)
