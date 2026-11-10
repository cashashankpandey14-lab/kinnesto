"""Renders the 1200x630 link-preview image (WhatsApp, Facebook, X, LinkedIn) into assets/og.png.

Usage (from kinnesto/app):  python design/make_og.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

APP = Path(__file__).resolve().parent.parent
FONTS = APP / 'node_modules' / '@expo-google-fonts'
DISPLAY = str(FONTS / 'bricolage-grotesque' / '800ExtraBold' / 'BricolageGrotesque_800ExtraBold.ttf')
BODY = str(FONTS / 'plus-jakarta-sans' / '600SemiBold' / 'PlusJakartaSans_600SemiBold.ttf')
BOLD = str(FONTS / 'plus-jakarta-sans' / '800ExtraBold' / 'PlusJakartaSans_800ExtraBold.ttf')

PAPER, INK, LIME, PINK, LILAC, PLUM = '#FBF7EF', '#17112B', '#CCFF4D', '#FF5FA2', '#BBA6FF', '#2A1660'
W, H = 1200, 630


def marker(d, xy, text, font, fill):
    """A word on a tilted-looking highlighter block with an ink outline and hard shadow."""
    x, y = xy
    l, t, r, b = d.textbbox((x, y), text, font=font)
    pad = 14
    box = [l - pad, t - 8, r + pad, b + 12]
    d.rounded_rectangle([box[0] + 7, box[1] + 7, box[2] + 7, box[3] + 7], radius=14, fill=INK)
    d.rounded_rectangle(box, radius=14, fill=fill, outline=INK, width=4)
    d.text((x, y), text, font=font, fill=INK)


def main():
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    h1 = ImageFont.truetype(DISPLAY, 96)
    small = ImageFont.truetype(BODY, 30)
    tag = ImageFont.truetype(BOLD, 26)

    # Left: headline
    d.text((70, 70), 'Find your', font=h1, fill=INK)
    marker(d, (82, 178), 'place.', h1, LIME)
    d.text((70, 300), 'Find your', font=h1, fill=INK)
    marker(d, (82, 408), 'people.', h1, PINK)
    d.text((72, 548), 'Flats · PGs · Hostels · Co-living · BnBs · Flatmates', font=small, fill='#3D3653')

    # Right: the app icon on a tilted card stack, plus a sticker
    icon = Image.open(APP / 'assets' / 'icon.png').convert('RGBA').resize((330, 330), Image.LANCZOS)
    mask = Image.new('L', (330, 330), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, 329, 329], radius=76, fill=255)
    icon.putalpha(mask)
    shadow = Image.new('RGBA', (330, 330), INK)
    shadow.putalpha(mask)
    for layer, (x, y, angle) in ((shadow, (838, 158, -6)), (icon, (830, 150, -6))):
        rot = layer.rotate(angle, resample=Image.BICUBIC, expand=True)
        img.paste(rot, (x - 20, y - 20), rot)

    d.rounded_rectangle([880, 470, 1150, 534], radius=32, fill=INK)
    d.rounded_rectangle([872, 462, 1142, 526], radius=32, fill=LIME, outline=INK, width=4)
    d.text((1007, 494), 'kinnesto.com', font=tag, fill=INK, anchor='mm')

    d.rounded_rectangle([900, 86, 1128, 140], radius=27, fill=INK)
    d.rounded_rectangle([894, 80, 1122, 134], radius=27, fill=LILAC, outline=INK, width=3)
    d.text((1008, 107), '92% vibe match', font=ImageFont.truetype(BOLD, 22), fill=INK, anchor='mm')

    img.save(APP / 'assets' / 'og.png', optimize=True)
    print('Wrote assets/og.png')


if __name__ == '__main__':
    main()
