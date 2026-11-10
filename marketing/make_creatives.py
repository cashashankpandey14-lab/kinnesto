"""Mumbai launch social posts (1080x1350, Instagram/Facebook feed size) in the Midnight & Marigold style.

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
DISPLAY = str(F / 'sora' / '600SemiBold' / 'Sora_600SemiBold.ttf')
BOLD = str(F / 'plus-jakarta-sans' / '700Bold' / 'PlusJakartaSans_700Bold.ttf')
BODY = str(F / 'plus-jakarta-sans' / '500Medium' / 'PlusJakartaSans_500Medium.ttf')
INK, INK2, PAPER, LINE, MUTED = (18, 17, 25), (29, 27, 39), (246, 245, 242), (229, 226, 220), (108, 104, 120)
GOLD, GOLDTEXT, SEA, WHITE = (244, 165, 28), (184, 110, 0), (17, 97, 95), (255, 255, 255)
W, H = 1080, 1350


def font(path, size):
    return ImageFont.truetype(path, size)


def footer(img, d, dark):
    icon = Image.open(ROOT / 'app' / 'assets' / 'icon.png').convert('RGBA').resize((72, 72), Image.LANCZOS)
    m = Image.new('L', (72, 72), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, 71, 71], radius=18, fill=255)
    img.paste(icon, (72, H - 132), m)
    fg = WHITE if dark else INK
    d.text((162, H - 96), 'kinnesto', font=font(DISPLAY, 44), fill=fg, anchor='lm')
    d.text((W - 72, H - 96), 'kinnesto.com', font=font(BOLD, 30), fill=GOLD if dark else GOLDTEXT, anchor='rm')


def eyebrow(d, x, y, text, dark):
    f = font(BOLD, 24)
    w = d.textlength(text, font=f) + 66
    d.rounded_rectangle([x, y, x + w, y + 50], radius=25, fill=(37, 34, 49) if dark else WHITE, outline=(55, 51, 70) if dark else LINE, width=2)
    d.ellipse([x + 20, y + 19, x + 32, y + 31], fill=(30, 158, 106))
    d.text((x + 44, y + 25), text, font=f, fill=WHITE if dark else INK, anchor='lm')


def photo(pid, size):
    url = f'https://images.unsplash.com/photo-{pid}?w=1400&q=78&auto=format&fit=crop'
    data = urllib.request.urlopen(url, timeout=30).read()
    return ImageOps.fit(Image.open(io.BytesIO(data)).convert('RGB'), size, Image.LANCZOS)


def rounded(im, r):
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], radius=r, fill=255)
    return m


def post_match():
    img = Image.new('RGB', (W, H), INK)
    d = ImageDraw.Draw(img)
    eyebrow(d, 72, 90, 'Now live in Mumbai', True)
    h = font(DISPLAY, 86)
    d.text((72, 190), 'Your next flatmate', font=h, fill=WHITE)
    d.text((72, 290), 'shouldn’t be', font=h, fill=WHITE)
    d.text((72, 390), 'a gamble.', font=h, fill=GOLD)
    # Compatibility card
    x0, y0, x1, y1 = 72, 560, W - 72, 1110
    d.rounded_rectangle([x0, y0, x1, y1], radius=36, fill=INK2, outline=(46, 43, 59), width=2)
    d.text((x0 + 44, y0 + 48), 'EXAMPLE MATCH', font=font(BOLD, 22), fill=(140, 136, 153))
    d.text((x0 + 44, y0 + 84), 'You and Priya', font=font(DISPLAY, 40), fill=WHITE)
    d.text((x1 - 44, y0 + 70), '91%', font=font(DISPLAY, 92), fill=GOLD, anchor='rm')
    rows = [('Sleep schedule', 100), ('Food habits', 100), ('Budget', 90), ('Cleanliness', 80), ('Guests', 60)]
    for i, (k, v) in enumerate(rows):
        y = y0 + 190 + i * 64
        d.text((x0 + 44, y), k, font=font(BODY, 26), fill=(217, 213, 227))
        d.text((x1 - 44, y), f'{v}%', font=font(BODY, 26), fill=(140, 136, 153), anchor='ra')
        d.rounded_rectangle([x0 + 44, y + 40, x1 - 44, y + 48], radius=4, fill=(46, 43, 59))
        d.rounded_rectangle([x0 + 44, y + 40, x0 + 44 + (x1 - x0 - 88) * v / 100, y + 48], radius=4, fill=GOLD)
    footer(img, d, True)
    return img


def post_nobroker():
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    eyebrow(d, 72, 90, 'Free · No brokerage', False)
    h = font(DISPLAY, 96)
    d.text((72, 200), 'No brokers.', font=h, fill=INK)
    d.text((72, 312), 'No spam calls.', font=h, fill=INK)
    d.text((72, 450), 'Just a better way to', font=font(DISPLAY, 58), fill=GOLDTEXT)
    d.text((72, 524), 'find home in Mumbai.', font=font(DISPLAY, 58), fill=GOLDTEXT)
    d.text((72, 650), 'Flats, PGs, hostels, co-living and stays,\nplus flatmates matched on lifestyle.\nChat directly with owners.', font=font(BODY, 36), fill=MUTED, spacing=16)
    x = 72
    for t in ['Andheri', 'Bandra', 'Powai', 'Lower Parel', 'Thane']:
        w = d.textlength(t, font=font(BOLD, 28)) + 48
        if x + w > W - 72:
            break
        d.rounded_rectangle([x, 900, x + w, 960], radius=30, fill=WHITE, outline=LINE, width=2)
        d.text((x + w / 2, 930), t, font=font(BOLD, 28), fill=INK, anchor='mm')
        x += w + 14
    d.rounded_rectangle([72, 1010, 470, 1090], radius=40, fill=INK)
    d.text((271, 1050), 'Start on kinnesto.com', font=font(BOLD, 28), fill=WHITE, anchor='mm')
    footer(img, d, False)
    return img


def post_listing():
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    ph = photo('1502672260266-1c1ef2d93688', (936, 900))
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([86, 120, 1022, 1030], radius=44, fill=(18, 17, 25, 40))
    from PIL import ImageFilter
    shadow = shadow.filter(ImageFilter.GaussianBlur(26))
    img.paste(shadow, (0, 0), shadow)
    # Scrim for the text
    scrim = Image.new('L', (936, 900), 0)
    sd = ImageDraw.Draw(scrim)
    for y in range(420, 900):
        sd.line([(0, y), (936, y)], fill=int(230 * ((y - 420) / 480) ** 1.3))
    dark = Image.new('RGB', (936, 900), INK)
    ph = Image.composite(dark, ph, scrim)
    img.paste(ph, (72, 96), rounded(ph, 44))
    d.rounded_rectangle([110, 134, 420, 192], radius=29, fill=WHITE)
    d.text((265, 163), 'Room in a 2BHK', font=font(BOLD, 26), fill=INK, anchor='mm')
    d.rounded_rectangle([W - 330, 134, W - 110, 192], radius=29, fill=GOLD)
    d.text((W - 220, 163), '94% fit for you', font=font(BOLD, 26), fill=INK, anchor='mm')
    d.text((116, 790), '₹32,000/mo', font=font(BOLD, 50), fill=GOLD)  # Sora has no ₹ glyph
    d.text((116, 856), 'Sunny room in Bandra West', font=font(DISPLAY, 46), fill=WHITE)
    d.text((116, 922), '1 flatmate · Wi-Fi · Lift · Available now', font=font(BODY, 28), fill=(210, 206, 220))
    d.text((72, 1050), 'Looking for a room in Mumbai?', font=font(DISPLAY, 46), fill=INK)
    d.text((72, 1112), 'Swipe right on the ones you love.', font=font(DISPLAY, 46), fill=GOLDTEXT)
    footer(img, d, False)
    return img


def post_host():
    img = Image.new('RGB', (W, H), INK)
    d = ImageDraw.Draw(img)
    eyebrow(d, 72, 90, 'For owners and hosts', True)
    h = font(DISPLAY, 84)
    d.text((72, 190), 'Got a spare room', font=h, fill=WHITE)
    d.text((72, 288), 'in Mumbai?', font=h, fill=WHITE)
    d.text((72, 406), 'Choose who moves in.', font=font(DISPLAY, 62), fill=GOLD)
    steps = [('1', 'List your room, PG or stay in two minutes. Free.'), ('2', 'Requests arrive with a profile and match score.'), ('3', 'Accept, chat and confirm. Zero brokerage.')]
    y = 580
    for n, t in steps:
        d.rounded_rectangle([72, y, W - 72, y + 140], radius=28, fill=INK2, outline=(46, 43, 59), width=2)
        d.ellipse([112, y + 40, 172, y + 100], fill=GOLD)
        d.text((142, y + 70), n, font=font(DISPLAY, 32), fill=INK, anchor='mm')
        d.text((204, y + 70), t, font=font(BODY, 32), fill=(230, 228, 236), anchor='lm')
        y += 164
    footer(img, d, True)
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob('*.png'):
        old.unlink()
    for name, fn in [('01-flatmate-match', post_match), ('02-no-brokers', post_nobroker), ('03-room-bandra', post_listing), ('04-spare-room-hosts', post_host)]:
        fn().save(OUT / f'{name}.png', optimize=True)
        print('wrote', name)


if __name__ == '__main__':
    main()
