"""Launch-campaign social posts (1080x1350, Instagram/Facebook feed size) in the Lime & Plum style.

Usage (from kinnesto/):  python marketing/make_creatives.py
Room photos come from Unsplash (free for commercial use under the Unsplash License).
"""
import io
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'marketing' / 'creatives'
F = ROOT / 'app' / 'node_modules' / '@expo-google-fonts'
DISPLAY = str(F / 'bricolage-grotesque' / '800ExtraBold' / 'BricolageGrotesque_800ExtraBold.ttf')
BOLD = str(F / 'plus-jakarta-sans' / '800ExtraBold' / 'PlusJakartaSans_800ExtraBold.ttf')
BODY = str(F / 'plus-jakarta-sans' / '600SemiBold' / 'PlusJakartaSans_600SemiBold.ttf')
PAPER, INK, LIME, PINK, LILAC, PLUM, VIOLET = '#FBF7EF', '#17112B', '#CCFF4D', '#FF5FA2', '#BBA6FF', '#2A1660', '#6C3BFF'
W, H = 1080, 1350


def font(path, size):
    return ImageFont.truetype(path, size)


def box(d, xy, fill, r=28, shadow=10, width=5):
    x0, y0, x1, y1 = xy
    d.rounded_rectangle([x0 + shadow, y0 + shadow, x1 + shadow, y1 + shadow], radius=r, fill=INK)
    d.rounded_rectangle(xy, radius=r, fill=fill, outline=INK, width=width)


def marker(d, x, y, text, f, fill):
    l, t, r, b = d.textbbox((x, y), text, font=f)
    box(d, [l - 16, t - 10, r + 16, b + 14], fill, r=16, shadow=8, width=5)
    d.text((x, y), text, font=f, fill=INK)
    return b + 14


def pill(d, x, y, text, fill, size=34):
    f = font(BOLD, size)
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    w, h = r - l + 48, b - t + 28
    box(d, [x, y, x + w, y + h], fill, r=h // 2, shadow=6, width=4)
    d.text((x + 24, y + 14 - t), text, font=f, fill=INK)
    return x + w


def footer(d, img, dark=False):
    icon = Image.open(ROOT / 'app' / 'assets' / 'icon.png').convert('RGBA').resize((84, 84), Image.LANCZOS)
    m = Image.new('L', (84, 84), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, 83, 83], radius=20, fill=255)
    img.paste(icon, (70, H - 140), m)
    d.text((172, H - 128), 'kinnesto', font=font(DISPLAY, 56), fill=LIME if dark else INK)
    d.text((W - 70, H - 112), 'kinnesto.com', font=font(BOLD, 34), fill=LIME if dark else INK, anchor='ra')


def photo(pid, size):
    url = f'https://images.unsplash.com/photo-{pid}?w=1400&q=75&auto=format&fit=crop'
    data = urllib.request.urlopen(url, timeout=30).read()
    return ImageOps.fit(Image.open(io.BytesIO(data)).convert('RGB'), size, Image.LANCZOS)


def post_gamble():
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    h = font(DISPLAY, 112)
    d.text((70, 110), 'Your next', font=h, fill=INK)
    y = marker(d, 84, 236, 'flatmate', h, PINK)
    d.text((70, y + 20), 'shouldn’t be', font=h, fill=INK)
    d.text((70, y + 146), 'a gamble.', font=h, fill=INK)
    d.text((72, y + 300), 'Match on the stuff that actually matters:', font=font(BODY, 38), fill='#3D3653')
    x, yy = 70, y + 380
    for i, (t, c) in enumerate([('🌙 Night owl', LILAC), ('🥦 Veg', LIME), ('✨ Neat freak', PINK), ('🐶 Pet parent', '#FFFFFF'), ('☕ WFH', LIME), ('🎉 Social', LILAC)]):
        t = t.split(' ', 1)[1]
        nx = pill(d, x, yy, t, c)
        x = nx + 22
        if i in (2,):
            x, yy = 70, yy + 104
    box(d, [70, yy + 140, 560, yy + 236], LIME, r=48, shadow=8)
    d.text((315, yy + 188), '92% vibe match', font=font(BOLD, 40), fill=INK, anchor='mm')
    footer(d, img)
    return img


def post_nobroker():
    img = Image.new('RGB', (W, H), PLUM)
    d = ImageDraw.Draw(img)
    h = font(DISPLAY, 128)
    for i, (word, col) in enumerate([('No brokers.', '#FFFFFF'), ('No spam calls.', '#FFFFFF')]):
        d.text((70, 150 + i * 150), word, font=h, fill=col)
    marker(d, 84, 470, 'Just vibes.', h, LIME)
    d.text((72, 690), 'Swipe on PGs, flats, hostels, co-living\nand BnBs. Chat with owners directly.\nFree, always.', font=font(BODY, 42), fill='#E2DBF7', spacing=14)
    x = 70
    for t, c in [('Flats', LIME), ('PGs', LILAC), ('Hostels', PINK), ('BnBs', '#FFFFFF')]:
        x = pill(d, x, 960, t, c, size=38) + 22
    footer(d, img, dark=True)
    return img


def post_place():
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    card = photo('1522708323590-d24dbb6b0267', (860, 820))
    m = Image.new('L', card.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, 859, 819], radius=44, fill=255)
    layer = Image.new('RGBA', (1000, 960), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.rounded_rectangle([30, 30, 890, 850], radius=44, fill=INK)
    sh = Image.new('RGBA', card.size, (0, 0, 0, 0))
    sh.paste(card, (0, 0), m)
    layer.paste(sh, (14, 14), sh)
    ld.rounded_rectangle([14, 14, 873, 833], radius=44, outline=INK, width=8)
    grad = Image.new('L', (860, 420), 0)
    for yy in range(420):
        ImageDraw.Draw(grad).line([(0, yy), (860, yy)], fill=int(235 * yy / 420))
    dark = Image.new('RGBA', (860, 420), (23, 17, 43, 255))
    dark.putalpha(Image.composite(grad, Image.new('L', grad.size, 0), m.crop((0, 400, 860, 820))))
    layer.alpha_composite(dark, (14, 414))
    ld.text((60, 620), '₹18,500/mo', font=font(DISPLAY, 58), fill=LIME)
    ld.text((60, 690), 'Sunny room · Koramangala', font=font(DISPLAY, 50), fill='#FFFFFF')
    ld.text((60, 760), '2 flatmates · Wi-Fi · Balcony', font=font(BODY, 32), fill='#E2DBF7')
    rot = layer.rotate(-4, resample=Image.BICUBIC, expand=True)
    img.paste(rot, (40, 60), rot)
    box(d, [600, 120, 990, 216], LIME, r=48, shadow=8)
    d.text((795, 168), '94% fit for you', font=font(BOLD, 38), fill=INK, anchor='mm')
    box(d, [70, 1030, 350, 1140], LIME, r=24, shadow=8)
    d.text((210, 1085), 'WANT', font=font(DISPLAY, 64), fill=INK, anchor='mm')
    d.text((400, 1036), 'PG in Koramangala?', font=font(DISPLAY, 52), fill=INK)
    d.text((400, 1098), 'Swipe right.', font=font(DISPLAY, 52), fill=VIOLET)
    footer(d, img)
    return img


def post_host():
    img = Image.new('RGB', (W, H), LIME)
    d = ImageDraw.Draw(img)
    h = font(DISPLAY, 108)
    d.text((70, 120), 'Got a', font=h, fill=INK)
    y = marker(d, 84, 246, 'spare room?', h, '#FFFFFF')
    d.text((70, y + 30), 'Pick flatmates by', font=font(DISPLAY, 84), fill=INK)
    vf = font(DISPLAY, 84)
    y2 = marker(d, 84, y + 140, 'vibe,', vf, PINK)
    d.text((84 + d.textlength('vibe,', font=vf) + 44, y + 140), 'not luck.', font=vf, fill=INK)
    steps = [('1', 'List your room, PG or BnB in 2 minutes. Free.'), ('2', 'See who swiped right, with their vibe score.'), ('3', 'Accept, chat, done. Zero brokerage.')]
    yy = y2 + 70
    for n, t in steps:
        box(d, [70, yy, 160, yy + 90], INK, r=45, shadow=0, width=0)
        d.text((115, yy + 45), n, font=font(DISPLAY, 52), fill=LIME, anchor='mm')
        d.text((190, yy + 24), t, font=font(BOLD, 36), fill=INK)
        yy += 128
    footer(d, img)
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [('01-flatmate-gamble', post_gamble), ('02-no-brokers', post_nobroker), ('03-pg-koramangala', post_place), ('04-spare-room-hosts', post_host)]:
        fn().save(OUT / f'{name}.png', optimize=True)
        print('wrote', name)


if __name__ == '__main__':
    main()
