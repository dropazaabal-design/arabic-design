"""Review strips: previews/review/NNN-{a,b,c}.png → previews/review/batchN.jpg (one row per shot, three frames).
usage: python3 tools/strip.py FIRST-LAST OUT.jpg"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

a, b = map(int, sys.argv[1].split('-'))
W, H = 640, 360
rows = [i for i in range(a, b + 1) if Path(f'previews/review/{i:03d}-a.png').exists()]
sheet = Image.new('RGB', (W * 3 + 60, H * len(rows)), 'white')
d = ImageDraw.Draw(sheet)
for r, i in enumerate(rows):
    d.text((8, r * H + 8), str(i), fill='black')
    for c, t in enumerate('abc'):
        sheet.paste(Image.open(f'previews/review/{i:03d}-{t}.png').convert('RGB').resize((W, H)), (60 + c * W, r * H))
sheet.save(sys.argv[2], quality=85)
print(sys.argv[2], len(rows))
