"""Contact sheet of review stills: python3 tools/sheet.py DIR OUT.jpg [thumb width]."""
import glob
import sys

from PIL import Image, ImageDraw

d, out = sys.argv[1], sys.argv[2]
tw = int(sys.argv[3]) if len(sys.argv) > 3 else 360
fs = sorted(glob.glob(f'{d}/*.png'))
ims = [Image.open(f) for f in fs]
th = round(tw * ims[0].size[1] / ims[0].size[0])
cols = 7
rows = (len(ims) + cols - 1) // cols
c = Image.new('RGB', (cols * (tw + 4), rows * (th + 24)), '#444')
dr = ImageDraw.Draw(c)
for k, (f, im) in enumerate(zip(fs, ims)):
    x, y = (k % cols) * (tw + 4), (k // cols) * (th + 24)
    c.paste(im.resize((tw, th)), (x, y))
    dr.text((x + 4, y + th + 4), f.split('-')[-1][:-4], fill='white')
c.save(out, quality=85)
print(out, c.size)
