"""Paid-ad creatives for Meta (Stories, carousel, link ads) and Google (Display, Performance Max, logos).

Usage (from kinnesto/):  python marketing/make_ads.py
Run make_reels.py first: the photo-led ads use frames from the AI clips in marketing/reels/.
Outputs go to marketing/ads/.
"""
import subprocess
from pathlib import Path

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFilter, ImageOps

from make_creatives import (BODY, BOLD, DISPLAY, GOLD, GOLDTEXT, INK, INK2, LINE, MUTED, PAPER, ROOT, WHITE,
                            font, photo, rounded)

OUT = ROOT / 'marketing' / 'ads'
REELS = ROOT / 'marketing' / 'reels'
ICON = ROOT / 'app' / 'assets' / 'icon.png'


def frame(clip, t):
    """One still from an ad clip, so the static ads share the reels' look."""
    p = REELS / '_build' / f'{Path(clip).stem}-{t}.png'
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-loglevel', 'error', '-y', '-ss', str(t), '-i', str(REELS / clip),
                    '-frames:v', '1', str(p)], check=True)
    return Image.open(p).convert('RGB')


def icon(size):
    ic = Image.open(ICON).convert('RGBA').resize((size, size), Image.LANCZOS)
    m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.23), fill=255)
    ic.putalpha(m)
    return ic


def brand(img, x, y, size, dark=True, chip=False):
    """App icon plus the kinnesto wordmark, left-aligned at (x, y). chip=True backs it for bright photos."""
    if chip:
        f = font(DISPLAY, int(size * 0.62))
        w = size * 1.22 + ImageDraw.Draw(img).textlength('kinnesto', font=f)
        pad = int(size * 0.22)
        layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).rounded_rectangle([x - pad, y - pad, x + w + pad * 1.6, y + size + pad], radius=(size + 2 * pad) // 2, fill=(18, 17, 25, 175))
        img.paste(layer, (0, 0), layer)
    img.paste(icon(size), (x, y), icon(size))
    ImageDraw.Draw(img).text((x + size * 1.22, y + size / 2), 'kinnesto', font=font(DISPLAY, int(size * 0.62)),
                             fill=WHITE if dark else INK, anchor='lm')


def wrap(d, text, f, maxw):
    lines = []
    for para in text.split('\n'):
        cur = ''
        for word in para.split():
            trial = (cur + ' ' + word).strip()
            if d.textlength(trial, font=f) <= maxw or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = word
        lines.append(cur)
    return lines


def block(d, x, y, text, f, fill, maxw, lh=1.12, anchor='la'):
    """Wrapped text; returns the y below it."""
    for ln in wrap(d, text, f, maxw):
        tx = x if anchor == 'la' else x - d.textlength(ln, font=f) / 2
        d.text((tx, y), ln, font=f, fill=fill)
        y += int(f.size * lh)
    return y


def pill(d, x, y, text, size=30, fill=GOLD, fg=INK, centre=False):
    f = font(BOLD, size)
    w, h = d.textlength(text, font=f) + size * 2.2, size * 2.3
    if centre:
        x -= w / 2
    d.rounded_rectangle([x, y, x + w, y + h], radius=h / 2, fill=fill)
    d.text((x + w / 2, y + h / 2), text, font=f, fill=fg, anchor='mm')
    return y + h


def scrim(im, start, strength=235, side='bottom'):
    """Darken one side of a photo so white type reads on any frame."""
    w, h = im.size
    m = Image.new('L', im.size, 0)
    md = ImageDraw.Draw(m)
    if side == 'bottom':
        for y in range(int(h * start), h):
            md.line([(0, y), (w, y)], fill=int(strength * max(0, (y - h * start) / (h - h * start)) ** 1.1))
    else:  # left
        for x in range(0, int(w * start)):
            md.line([(x, 0), (x, h)], fill=int(strength * (1 - x / (w * start)) ** 0.9))
    return Image.composite(Image.new('RGB', im.size, INK), im, m)


def match_card(d, x0, y0, x1, scale=1.0):
    """The compatibility card from the app, as in the feed post."""
    s = scale
    rows = [('Sleep schedule', 100), ('Food habits', 100), ('Budget', 90), ('Cleanliness', 80), ('Guests', 60)]
    y1 = y0 + int((190 + 64 * len(rows) + 20) * s)
    d.rounded_rectangle([x0, y0, x1, y1], radius=int(36 * s), fill=INK2, outline=(46, 43, 59), width=2)
    p = int(44 * s)
    d.text((x0 + p, y0 + int(48 * s)), 'EXAMPLE MATCH', font=font(BOLD, int(22 * s)), fill=(140, 136, 153))
    d.text((x0 + p, y0 + int(84 * s)), 'You and Priya', font=font(DISPLAY, int(40 * s)), fill=WHITE)
    d.text((x1 - p, y0 + int(70 * s)), '91%', font=font(DISPLAY, int(92 * s)), fill=GOLD, anchor='rm')
    for i, (k, v) in enumerate(rows):
        y = y0 + int((190 + i * 64) * s)
        d.text((x0 + p, y), k, font=font(BODY, int(26 * s)), fill=(217, 213, 227))
        d.text((x1 - p, y), f'{v}%', font=font(BODY, int(26 * s)), fill=(140, 136, 153), anchor='ra')
        by = y + int(40 * s)
        d.rounded_rectangle([x0 + p, by, x1 - p, by + int(8 * s)], radius=4, fill=(46, 43, 59))
        d.rounded_rectangle([x0 + p, by, x0 + p + (x1 - x0 - 2 * p) * v / 100, by + int(8 * s)], radius=4, fill=GOLD)
    return y1


# ---------- Instagram / Facebook Stories, 1080x1920 ----------
# Keep type out of the top 250px and bottom 340px, where the platforms draw their own UI.

def story_hook(f1):
    img = scrim(ImageOps.fit(f1, (1080, 1920)), 0.42)
    d = ImageDraw.Draw(img)
    brand(img, 90, 260, 76, chip=True)
    y = block(d, 90, 1080, 'Flat hunting in Mumbai?', font(DISPLAY, 92), WHITE, 900)
    y = block(d, 90, y + 10, 'Swipe. Match. Move in.', font(DISPLAY, 64), GOLD, 900)
    y = block(d, 90, y + 24, 'Rooms, PGs and flatmates matched on how you live. No brokerage.', font(BODY, 36), (220, 216, 230), 860, 1.4)
    pill(d, 90, y + 36, 'Find a room  →', 34)
    return img


def story_match():
    img = Image.new('RGB', (1080, 1920), INK)
    d = ImageDraw.Draw(img)
    brand(img, 90, 260, 76)
    f = font(DISPLAY, 88)
    y = block(d, 90, 440, 'Your next flatmate shouldn’t be a gamble.', f, WHITE, 900)
    y = match_card(d, 90, y + 70, 990)
    y = block(d, 90, y + 60, 'See how you match on sleep, food, budget and more before you ever meet.', font(BODY, 36), (200, 196, 212), 880, 1.4)
    pill(d, 90, y + 40, 'Find your flatmate  →', 34)
    return img


def story_hosts(f2):
    img = scrim(ImageOps.fit(f2, (1080, 1920)), 0.40)
    d = ImageDraw.Draw(img)
    brand(img, 90, 260, 76, chip=True)
    y = block(d, 90, 1060, 'Got a spare room in Mumbai?', font(DISPLAY, 88), WHITE, 900)
    y = block(d, 90, y + 10, 'Choose who moves in.', font(DISPLAY, 64), GOLD, 900)
    y = block(d, 90, y + 24, 'List free in two minutes. Requests come with a profile and match score.', font(BODY, 36), (220, 216, 230), 860, 1.4)
    pill(d, 90, y + 36, 'List your room free  →', 34)
    return img


# ---------- Carousel, 1080x1080 (Instagram and Facebook feed) ----------

def slide_frame(n, dark=True):
    img = Image.new('RGB', (1080, 1080), INK if dark else PAPER)
    d = ImageDraw.Draw(img)
    for i in range(5):  # progress dots
        d.rounded_rectangle([72 + i * 44, 1000, 72 + i * 44 + (30 if i == n else 14), 1014], radius=7,
                            fill=GOLD if i == n else ((70, 66, 86) if dark else LINE))
    d.text((1008, 1007), 'kinnesto.com', font=font(BOLD, 26), fill=GOLD if dark else GOLDTEXT, anchor='rm')
    return img, d


def car_1():
    img, d = slide_frame(0)
    brand(img, 72, 80, 64)
    y = block(d, 72, 300, 'Finding a home in Mumbai,', font(DISPLAY, 72), WHITE, 940)
    y = block(d, 72, y, 'minus the chaos.', font(DISPLAY, 72), GOLD, 940)
    block(d, 72, y + 40, 'Three steps. No brokers. Swipe to see how  →', font(BODY, 36), (200, 196, 212), 900, 1.4)
    return img


def car_2():
    img, d = slide_frame(1, dark=False)
    d.text((72, 80), '01  Swipe rooms', font=font(DISPLAY, 54), fill=INK)
    block(d, 72, 156, 'Flats, PGs, hostels, co-living and stays across Mumbai.', font(BODY, 32), MUTED, 900, 1.35)
    ph = photo('1502672260266-1c1ef2d93688', (936, 640))
    ph = scrim(ph, 0.45, 225)
    img.paste(ph, (72, 290), rounded(ph, 36))
    d.rounded_rectangle([1008 - 250, 318, 1008 - 28, 370], radius=26, fill=GOLD)
    d.text((1008 - 139, 344), '94% fit for you', font=font(BOLD, 24), fill=INK, anchor='mm')
    d.text((110, 760), '₹32,000/mo', font=font(BOLD, 44), fill=GOLD)  # Sora has no ₹ glyph
    d.text((110, 818), 'Sunny room in Bandra West', font=font(DISPLAY, 40), fill=WHITE)
    d.text((110, 876), '1 flatmate · Wi-Fi · Lift · Available now', font=font(BODY, 26), fill=(210, 206, 220))
    return img


def car_3():
    img, d = slide_frame(2)
    d.text((72, 80), '02  Match flatmates', font=font(DISPLAY, 54), fill=WHITE)
    block(d, 72, 156, 'Matched on lifestyle, not luck.', font(BODY, 32), (200, 196, 212), 900, 1.35)
    match_card(d, 72, 290, 1008, 1.18)
    return img


def car_4():
    img, d = slide_frame(3, dark=False)
    d.text((72, 80), '03  Chat. Move in.', font=font(DISPLAY, 54), fill=INK)
    block(d, 72, 156, 'Talk to owners and flatmates directly. Zero brokerage.', font(BODY, 32), MUTED, 900, 1.35)
    msgs = [(False, 'Hi! Is the Bandra room still free from the 1st?'), (True, 'Yes! Want to see it Saturday?'),
            (False, 'Perfect. 11am works.'), (True, 'Great, see you then 🙂'.replace(' 🙂', '.'))]
    y = 310
    f = font(BODY, 34)
    for mine, t in msgs:
        lines = wrap(d, t, f, 560)
        w = max(d.textlength(ln, font=f) for ln in lines) + 64
        h = len(lines) * 46 + 40
        x = 1008 - w if mine else 72
        d.rounded_rectangle([x, y, x + w, y + h], radius=30, fill=INK if mine else WHITE, outline=None if mine else LINE, width=2)
        for i, ln in enumerate(lines):
            d.text((x + 32, y + 20 + i * 46), ln, font=f, fill=WHITE if mine else INK)
        y += h + 24
    d.rounded_rectangle([72, y + 20, 520, y + 92], radius=36, fill=(225, 240, 238))
    d.text((296, y + 56), 'Visit booked · Sat 11:00', font=font(BOLD, 28), fill=(17, 97, 95), anchor='mm')
    return img


def car_5():
    img, d = slide_frame(4)
    ic = icon(220)
    img.paste(ic, (430, 180), ic)
    d.text((540, 480), 'kinnesto', font=font(DISPLAY, 104), fill=WHITE, anchor='mm')
    d.text((540, 580), 'Find your place. And the people to share it with.', font=font(BOLD, 32), fill=(170, 166, 186), anchor='mm')
    pill(d, 540, 670, 'Now live in Mumbai · Free to join', 32, centre=True)
    d.text((540, 860), 'kinnesto.com', font=font(DISPLAY, 60), fill=GOLD, anchor='mm')
    return img


# ---------- Google Display / Performance Max, Facebook link ad ----------

def display_landscape(f3, text=True):
    img = ImageOps.fit(f3, (1200, 628))
    if not text:
        brand(img, 40, 40, 56, chip=True)
        return img
    img = scrim(img, 0.72, 240, 'left')
    d = ImageDraw.Draw(img)
    brand(img, 60, 56, 56)
    y = block(d, 60, 170, 'Find your place in Mumbai.', font(DISPLAY, 60), WHITE, 620)
    y = block(d, 60, y + 14, 'Flats, PGs, co-living and flatmates. No brokers.', font(BODY, 28), (220, 216, 230), 560, 1.35)
    pill(d, 60, y + 30, 'Find a room  →', 26)
    return img


def display_square(f2, text=True):
    img = ImageOps.fit(f2, (1200, 1200), centering=(0.5, 0.62))
    if not text:
        brand(img, 56, 56, 72, chip=True)
        return img
    img = scrim(img, 0.42)
    d = ImageDraw.Draw(img)
    brand(img, 72, 72, 76, chip=True)
    y = block(d, 72, 760, 'No brokers. Just your people.', font(DISPLAY, 80), WHITE, 1000)
    y = block(d, 72, y + 12, 'Rooms and flatmates in Mumbai, matched on how you live.', font(BODY, 36), (220, 216, 230), 1000, 1.35)
    pill(d, 72, y + 30, 'Get started free  →', 32)
    return img


def display_portrait(f1):
    img = ImageOps.fit(f1, (960, 1200), centering=(0.5, 0.4))
    brand(img, 48, 48, 64, chip=True)
    return img


def logo_square():
    img = Image.new('RGBA', (1200, 1200), (0, 0, 0, 0))
    ic = icon(1200)
    img.paste(ic, (0, 0), ic)
    return img


def logo_wide():
    img = Image.new('RGBA', (1200, 300), (0, 0, 0, 0))
    ic = icon(240)
    img.paste(ic, (60, 30), ic)
    ImageDraw.Draw(img).text((340, 150), 'kinnesto', font=font(DISPLAY, 168), fill=INK, anchor='lm')
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (REELS / '_build').mkdir(exist_ok=True)
    for old in [*OUT.glob("*.png"), *OUT.glob("*.jpg")]:
        old.unlink()
    f1 = frame('clip-01-platform-relief.mp4', 1.5)
    f2 = frame('clip-02-move-in.mp4', 3)
    f3 = frame('clip-03-sealink-landscape.mp4', 2.5)
    jobs = [
        ('story-01-flat-hunting-1080x1920', lambda: story_hook(f1)),
        ('story-02-flatmate-match-1080x1920', story_match),
        ('story-03-hosts-1080x1920', lambda: story_hosts(f2)),
        ('carousel-1-hook-1080', car_1), ('carousel-2-swipe-1080', car_2), ('carousel-3-match-1080', car_3),
        ('carousel-4-chat-1080', car_4), ('carousel-5-cta-1080', car_5),
        ('display-landscape-1200x628', lambda: display_landscape(f3)),
        ('display-square-1200x1200', lambda: display_square(f2)),
        ('pmax-landscape-clean-1200x628', lambda: display_landscape(f3, False)),
        ('pmax-square-clean-1200x1200', lambda: display_square(f2, False)),
        ('pmax-portrait-clean-960x1200', lambda: display_portrait(f1)),
        ('logo-square-1200', logo_square), ('logo-wide-1200x300', logo_wide),
    ]
    for name, fn in jobs:
        im = fn()
        if im.mode == 'RGBA' and not name.startswith('logo'):
            im = im.convert('RGB')
        if name.startswith('logo'):
            im.save(OUT / f'{name}.png', optimize=True)
        else:  # Google caps display images at 5 MB; JPEG keeps photo ads small
            im.save(OUT / f'{name}.jpg', quality=90, optimize=True, progressive=True)
        print('wrote', name)


if __name__ == '__main__':
    main()
