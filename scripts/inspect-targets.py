"""Render spoiler contact sheets for visual QA; never used by the game."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

out = Path('docs/qa')
out.mkdir(parents=True, exist_ok=True)
for level in json.loads(Path('src/scenes.json').read_text()):
    source = Image.open(out / f"{level['id']}-composite.png").convert('RGB')
    sheet = Image.new('RGB', (1200, 360), '#102c35')
    draw = ImageDraw.Draw(sheet)
    for index, (target, box) in enumerate(level['boxes'].items()):
        x, y, w, h = (box[k] for k in ['x', 'y', 'w', 'h'])
        px, py = (x+w/2)*source.width, (y+h/2)*source.height
        half = max(w*source.width, h*source.height)*.7 + 12
        crop = source.crop((round(px-half), round(py-half), round(px+half), round(py+half)))
        crop = ImageOps.contain(crop, (290,290), Image.Resampling.NEAREST)
        sheet.paste(crop, (index*300+(300-crop.width)//2, 35+(290-crop.height)//2))
        draw.text((index*300+12, 12), f"{level['id']} / {target}", fill='#e7c577')
        draw.text((index*300+12, 337), f"native {round(w*source.width)} x {round(h*source.height)} px", fill='white')
    sheet.save(out / f"{level['id']}-targets.png")
