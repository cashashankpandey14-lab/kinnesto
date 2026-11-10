"""Renders every Kinnesto app icon from code, so the artwork can be tweaked and re-run.

Mark: two stacked swipe cards; the front card holds a house with a heart in it
("swipe for a home, and the people in it"), in the app's "Lime & Plum" palette with ink outlines.

Usage (from kinnesto/app):  python design/make_icons.py
"""
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / 'assets'
SS = 4  # supersampling factor

PLUM, VIOLET = (42, 22, 96), (108, 59, 255)
INK, LIME, LILAC = (23, 17, 43), (204, 255, 77), (187, 166, 255)
WHITE = (255, 255, 255)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(size):
    """Diagonal plum → violet, top-left to bottom-right."""
    small = 256
    g = Image.new('RGB', (small, small))
    px = g.load()
    for y in range(small):
        for x in range(small):
            t = (x + y) / (2 * (small - 1))
            px[x, y] = lerp(PLUM, VIOLET, t)
    return g.resize((size, size), Image.BICUBIC)


def round_mask(mask, r):
    """Rounds the corners of a hard-edged mask (blur, then re-threshold)."""
    return mask.filter(ImageFilter.GaussianBlur(r)).point(lambda v: 255 if v > 127 else 0)


def heart_points(cx, cy, s, n=400):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * s, cy - y * s))
    return pts


def house_mask(size, cx, cy, w):
    """Pentagon house with softly rounded corners, centred on (cx, cy), w wide.
    Returns the mask and the y where the heart (the "door") sits."""
    m = Image.new('L', (size, size), 0)
    h = w * 0.92
    top, eave, bottom = cy - h / 2, cy - h / 2 + w * 0.42, cy + h / 2
    ImageDraw.Draw(m).polygon([(cx, top), (cx + w / 2, eave), (cx + w / 2, bottom), (cx - w / 2, bottom), (cx - w / 2, eave)], fill=255)
    return round_mask(m, w * 0.05), eave + (bottom - eave) * 0.36


def card_layer(size, cx, cy, w, h, angle, fill, alpha=255, outline=None):
    """A rounded card rotated by `angle` degrees, as an RGBA layer, optionally with an ink
    outline and a hard offset shadow (the app's brutalist card look)."""
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    box = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]
    if outline:
        sh = w * 0.06
        d.rounded_rectangle([box[0] + sh, box[1] + sh, box[2] + sh, box[3] + sh], radius=w * 0.16, fill=outline + (255,))
    d.rounded_rectangle(box, radius=w * 0.16, fill=fill + (alpha,), outline=(outline + (255,)) if outline else None, width=int(w * 0.035) if outline else 0)
    return layer.rotate(angle, resample=Image.BICUBIC, center=(cx, cy))


def mark(size, scale=1.0, mono=False):
    """The cards + house + heart, transparent background. `scale` is the mark's width as a share of the canvas."""
    S = size * SS
    cx, cy = S / 2, S / 2 + S * 0.01 * scale
    cw, ch = S * 0.56 * scale, S * 0.70 * scale
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))

    # Back card peeks out to the right, like the next card in a deck.
    if not mono:
        out.alpha_composite(card_layer(S, cx + cw * 0.13, cy - ch * 0.02, cw, ch, -11, LILAC, outline=INK))

    # Front card, tilted the other way mid-swipe.
    front = card_layer(S, cx - cw * 0.05, cy + ch * 0.02, cw, ch, 6, WHITE if mono else LIME, outline=None if mono else INK)
    hm, door_y = house_mask(S, cx - cw * 0.05, cy + ch * 0.02, cw * 0.6)
    heart = Image.new('L', (S, S), 0)
    ImageDraw.Draw(heart).polygon(heart_points(cx - cw * 0.05, door_y, cw * 0.0088), fill=255)
    hm = hm.rotate(6, resample=Image.BICUBIC, center=(cx - cw * 0.05, cy + ch * 0.02))
    heart = heart.rotate(6, resample=Image.BICUBIC, center=(cx - cw * 0.05, cy + ch * 0.02))

    if mono:
        # Monochrome: white card with the house knocked out (heart stays white inside it).
        front.putalpha(ImageChops.subtract(front.getchannel('A'), ImageChops.subtract(hm, heart)))
        out.alpha_composite(front)
    else:
        # Ink house on the lime card; the heart in the doorway shows the lime through.
        g = Image.new('RGBA', (S, S), INK + (255,))
        g.putalpha(ImageChops.subtract(hm, heart))
        front.alpha_composite(g)
        out.alpha_composite(front)
    return out.resize((size, size), Image.LANCZOS)


def simple_mark(size):
    """Small sizes (favicon): just the lime house with the heart cut out, no cards."""
    S = size * SS
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    hm, door_y = house_mask(S, S / 2, S / 2, S * 0.62)
    heart = Image.new('L', (S, S), 0)
    ImageDraw.Draw(heart).polygon(heart_points(S / 2, door_y, S * 0.0115), fill=255)
    white = Image.new('RGBA', (S, S), LIME + (255,))
    white.putalpha(ImageChops.subtract(hm, heart))
    out.alpha_composite(white)
    return out.resize((size, size), Image.LANCZOS)


def on_gradient(size, art, rounded=False):
    bg = gradient(size).convert('RGBA')
    bg.alpha_composite(art)
    if rounded:
        m = Image.new('L', (size * SS, size * SS), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, size * SS - 1, size * SS - 1], radius=size * SS * 0.225, fill=255)
        bg.putalpha(m.resize((size, size), Image.LANCZOS))
    return bg


def main():
    # iOS / store icon: full bleed, no transparency (iOS applies its own corner mask).
    on_gradient(1024, mark(1024, 0.92)).convert('RGB').save(OUT / 'icon.png')
    # Android adaptive icon: art must sit inside the centre ~66% safe zone.
    gradient(512).convert('RGBA').save(OUT / 'android-icon-background.png')
    mark(512, 0.62).save(OUT / 'android-icon-foreground.png')
    mark(432, 0.62, mono=True).save(OUT / 'android-icon-monochrome.png')
    # Splash: the mark on its own; the splash background colour comes from app.json.
    mark(1024, 0.9).save(OUT / 'splash-icon.png')
    # Web favicon + home-screen icon.
    on_gradient(48, simple_mark(48), rounded=True).save(OUT / 'favicon.png')

    # Preview sheet for review (not used by the app).
    sheet = Image.new('RGBA', (1500, 560), (255, 251, 248, 255))
    sheet.alpha_composite(on_gradient(420, mark(420, 0.92), rounded=True), (60, 70))
    sheet.alpha_composite(on_gradient(420, mark(420, 0.62)).resize((300, 300)), (540, 130))
    circle = Image.new('L', (300, 300), 0)
    ImageDraw.Draw(circle).ellipse([0, 0, 299, 299], fill=255)
    sheet.paste((0, 0, 0, 0), (540, 130), ImageChops.invert(circle))
    dark = Image.new('RGBA', (300, 300), (30, 26, 43, 255))
    dark.alpha_composite(mark(300, 0.62, mono=True))
    sheet.alpha_composite(dark, (900, 130))
    for i, s in enumerate((120, 60, 32)):
        sheet.alpha_composite(on_gradient(s, (mark(s, 0.92) if s > 48 else simple_mark(s)), rounded=True), (1260, 120 + i * 140))
    sheet.save(Path(__file__).resolve().parent / 'icon-preview.png')
    print('Wrote', ', '.join(p.name for p in sorted(OUT.glob('*.png'))))


if __name__ == '__main__':
    main()
