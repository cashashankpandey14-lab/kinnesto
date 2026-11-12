"""Google Play and App Store listing graphics.

Usage (from kinnesto/):  python marketing/make_store_assets.py
Inputs: marketing/store/screens/*.png, phone captures (390x844 at 2x) of the production web build with demo data.
Outputs (marketing/store/):
  play/icon-512.png, play/feature-graphic-1024x500.png, play/phone-*.png (1080x1920)
  appstore/iphone-6.9-*.png (1320x2868, the one size Apple requires)
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

from make_ads import brand, icon, wrap
from make_creatives import BODY, BOLD, DISPLAY, GOLD, GOLDTEXT, INK, MUTED, PAPER, ROOT, WHITE, font

S = ROOT / 'marketing' / 'store'
SHOTS = [  # screen, headline, subline, dark background
    ('places-swipe', 'Swipe on rooms across Mumbai', 'Flats, PGs, hostels, co-living and stays', True),
    ('roomies', 'Match with flatmates who fit', 'Matched on sleep, food, budget and habits', False),
    ('listing', 'See your fit before you visit', 'Every place shows how well it suits you', True),
    ('person', 'Know them before you meet', 'Profiles, lifestyle and what they’re looking for', False),
    ('chat', 'Chat directly. No brokers.', 'Talk to owners and flatmates in the app', True),
    ('welcome', 'Find your place. And your people.', 'Free to join · Now live in Mumbai', False),
]


def phone(screen, width):
    """The capture inside a simple dark device frame, with a soft shadow; returns an RGBA image."""
    sw = width - int(width * 0.06)
    sh = int(screen.height * sw / screen.width)
    scr = screen.resize((sw, sh), Image.LANCZOS)
    b = (width - sw) // 2
    fw, fh = width, sh + 2 * b
    pad = int(width * 0.08)
    out = Image.new('RGBA', (fw + 2 * pad, fh + 2 * pad), (0, 0, 0, 0))
    sh_l = Image.new('RGBA', out.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh_l).rounded_rectangle([pad, pad + pad // 3, pad + fw, pad + fh + pad // 3], radius=int(width * 0.13), fill=(0, 0, 0, 90))
    out.alpha_composite(sh_l.filter(ImageFilter.GaussianBlur(pad // 2)))
    d = ImageDraw.Draw(out)
    d.rounded_rectangle([pad, pad, pad + fw, pad + fh], radius=int(width * 0.13), fill=(10, 10, 14), outline=(60, 58, 70), width=max(2, width // 300))
    m = Image.new('L', scr.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, sw - 1, sh - 1], radius=int(width * 0.10), fill=255)
    out.paste(scr, (pad + b, pad + b), m)
    return out


def shot(name, head, sub, dark, w, h):
    img = Image.new('RGB', (w, h), INK if dark else PAPER)
    d = ImageDraw.Draw(img)
    u = w / 1080
    fh = font(DISPLAY, int(78 * u))
    y = int(120 * u) if h / w < 1.9 else int(200 * u)
    for ln in wrap(d, head, fh, w - 160 * u):
        d.text(((w - d.textlength(ln, font=fh)) / 2, y), ln, font=fh, fill=WHITE if dark else INK)
        y += int(fh.size * 1.12)
    fs = font(BODY, int(36 * u))
    d.text(((w - d.textlength(sub, font=fs)) / 2, y + 18 * u), sub, font=fs, fill=GOLD if dark else GOLDTEXT)
    ph = phone(Image.open(S / 'screens' / f'{name}.png').convert('RGB'), int(w * 0.74))
    top = int(y + 110 * u)
    img.paste(ph, ((w - ph.width) // 2, top - int(w * 0.74 * 0.08)), ph)  # runs off the bottom edge on purpose
    return img


def feature_graphic():
    w, h = 1024, 500
    img = Image.new('RGB', (w, h), INK)
    d = ImageDraw.Draw(img)
    brand(img, 64, 70, 64)
    y = 190
    for ln in ['Find your place.', 'And your people.']:
        d.text((64, y), ln, font=font(DISPLAY, 54), fill=WHITE if y == 190 else GOLD)
        y += 64
    d.text((64, y + 24), 'Rooms, PGs and flatmates in Mumbai', font=font(BOLD, 24), fill=(190, 186, 204))
    ph = phone(Image.open(S / 'screens' / 'places-swipe.png').convert('RGB'), 300)
    img.paste(ph, (w - ph.width - 30, 40), ph)
    return img


def main():
    for sub in ['play', 'appstore']:
        (S / sub).mkdir(parents=True, exist_ok=True)
        for old in (S / sub).glob('*.png'):
            old.unlink()
    ic = Image.new('RGB', (512, 512), INK)  # Play wants a full-bleed square; it applies its own rounding
    ic.paste(Image.open(ROOT / 'app' / 'assets' / 'icon.png').convert('RGB').resize((512, 512), Image.LANCZOS))
    ic.save(S / 'play' / 'icon-512.png')
    feature_graphic().save(S / 'play' / 'feature-graphic-1024x500.png')
    for i, (name, head, sub, dark) in enumerate(SHOTS, 1):
        shot(name, head, sub, dark, 1080, 1920).save(S / 'play' / f'phone-{i}-{name}.png', optimize=True)
        shot(name, head, sub, dark, 1320, 2868).save(S / 'appstore' / f'iphone-6.9-{i}-{name}.png', optimize=True)
        print('wrote', name)


if __name__ == '__main__':
    main()
