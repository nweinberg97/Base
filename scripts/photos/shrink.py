# Shrink downloaded candidates to at most 1200 px and drop files that aren't images.
import pathlib, sys
from PIL import Image, ImageOps
root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'photo-candidates')
for p in root.rglob('*.jpg'):
    try:
        im = ImageOps.exif_transpose(Image.open(p)).convert('RGB')
        im.thumbnail((1200, 1200))
        im.save(p, 'JPEG', quality=85)
    except Exception as e:
        print('removing', p, e); p.unlink()
