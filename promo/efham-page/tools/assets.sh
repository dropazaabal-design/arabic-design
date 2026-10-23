#!/bin/sh
# Web images from the product PDFs (S1.pdf … S6.pdf in $1): six covers and two pages of «قوة العادات» (track 2).
# The PDFs and these renders stay out of the public repository; this script rebuilds them.
set -e
cd "$(dirname "$0")/.."
src="$1"; tmp=$(mktemp -d)
for n in 1 2 3 4 5 6; do pdftoppm -png -r 110 -f 1 -l 1 -singlefile "$src/S$n.pdf" "$tmp/cover-$n"; done
for p in 5 8; do pdftoppm -png -r 150 -f $p -l $p -singlefile "$src/S2.pdf" "$tmp/page-$p"; done
python3 - "$tmp" <<'PY'
import sys, glob, os
from PIL import Image
tmp = sys.argv[1]
for f in sorted(glob.glob(f'{tmp}/*.png')):
    im = Image.open(f).convert('RGB')
    w = 560 if 'cover' in f else 1100
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    out = f'assets/{os.path.basename(f)[:-4]}.webp'
    im.save(out, 'WEBP', quality=82, method=6)
    print(out, im.size, os.path.getsize(out) // 1024, 'KB')
PY
rm -rf "$tmp"
