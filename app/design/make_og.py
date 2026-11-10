"""Renders the 1200x630 link-preview image (WhatsApp, Facebook, X, LinkedIn) into assets/og.png.

Usage (from kinnesto/app):  python design/make_og.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

APP = Path(__file__).resolve().parent.parent
FONTS = APP / 'node_modules' / '@expo-google-fonts'
DISPLAY = str(FONTS / 'sora' / '600SemiBold' / 'Sora_600SemiBold.ttf')
BODY = str(FONTS / 'plus-jakarta-sans' / '600SemiBold' / 'PlusJakartaSans_600SemiBold.ttf')
BOLD = str(FONTS / 'plus-jakarta-sans' / '700Bold' / 'PlusJakartaSans_700Bold.ttf')

INK, MUTED, MARIGOLD, GOLDTEXT = (18, 17, 25), (160, 156, 175), (244, 165, 28), (244, 165, 28)
W, H = 1200, 630


def main():
    img = Image.new('RGB', (W, H), INK)
    # Soft marigold glow behind the icon.
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for r in range(320, 0, -8):
        a = int(26 * (1 - r / 320) ** 1.6)
        gd.ellipse([930 - r, 315 - r, 930 + r, 315 + r], fill=(244, 165, 28, a))
    img.paste(glow, (0, 0), glow)
    d = ImageDraw.Draw(img)

    d.rounded_rectangle([72, 74, 330, 116], radius=21, outline=(60, 56, 74), width=2)
    d.ellipse([90, 89, 102, 101], fill=(30, 158, 106))
    d.text((114, 95), 'Now live in Mumbai', font=ImageFont.truetype(BOLD, 20), fill=(230, 228, 236), anchor='lm')

    h1 = ImageFont.truetype(DISPLAY, 78)
    d.text((70, 160), 'Find your place.', font=h1, fill=(255, 255, 255))
    d.text((70, 252), 'And the people', font=h1, fill=GOLDTEXT)
    d.text((70, 344), 'to share it with.', font=h1, fill=GOLDTEXT)
    d.text((72, 470), 'Flats, PGs, hostels, co-living and flatmates.', font=ImageFont.truetype(BODY, 28), fill=MUTED)
    d.text((72, 512), 'Matched on lifestyle. No brokers.', font=ImageFont.truetype(BODY, 28), fill=MUTED)

    icon = Image.open(APP / 'assets' / 'icon.png').convert('RGBA').resize((300, 300), Image.LANCZOS)
    mask = Image.new('L', (300, 300), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, 299, 299], radius=70, fill=255)
    img.paste(icon, (780, 165), mask)
    d.rounded_rectangle([780, 165, 1079, 464], radius=70, outline=(60, 56, 74), width=2)
    d.text((930, 520), 'kinnesto.com', font=ImageFont.truetype(BOLD, 30), fill=(255, 255, 255), anchor='mm')

    img.save(APP / 'assets' / 'og.png', optimize=True)
    print('Wrote assets/og.png')


if __name__ == '__main__':
    main()
