"""Edits the AI clips into finished ad spots with captions and an end card.

Usage (from kinnesto/):  python marketing/make_reels.py
Needs: pip install imageio-ffmpeg (bundles ffmpeg). Inputs: marketing/reels/ai-0*.mp4.
Outputs (marketing/reels/):
  reel-live-action-15s.mp4   1080x1920  Instagram/Facebook Reels and Stories
  spot-landscape-9s.mp4      1920x1080  YouTube, Facebook feed, Google video
  clip-*.mp4                 the raw clips converted to H.264 (clip 3 rotated upright to landscape)
"""
import subprocess
from pathlib import Path

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
R = ROOT / 'marketing' / 'reels'
F = ROOT / 'app' / 'node_modules' / '@expo-google-fonts'
DISPLAY = str(F / 'sora' / '600SemiBold' / 'Sora_600SemiBold.ttf')
BOLD = str(F / 'plus-jakarta-sans' / '700Bold' / 'PlusJakartaSans_700Bold.ttf')
FF = imageio_ffmpeg.get_ffmpeg_exe()
INK, PAPER, GOLD, MUTED = (18, 17, 25), (246, 245, 242), (244, 165, 28), (170, 166, 186)


def run(args):
    subprocess.run([FF, '-loglevel', 'error', '-y', *args], check=True)


def wrap(d, text, font, maxw):
    lines, cur = [], ''
    for word in text.split():
        trial = (cur + ' ' + word).strip()
        if d.textlength(trial, font=font) <= maxw or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    return lines + [cur]


def caption(text, w, size, sub=None):
    """A caption card: white headline (and optional gold subline) on a soft dark band, transparent elsewhere.
    Lines wrap inside side margins so nothing reaches the frame edge or the platform's side buttons."""
    f = ImageFont.truetype(DISPLAY, size)
    fs = ImageFont.truetype(BOLD, int(size * 0.42))
    d0 = ImageDraw.Draw(Image.new('RGBA', (10, 10)))
    margin = 140 if w < 1500 else 240
    lines = wrap(d0, text, f, w - 2 * margin)
    subs = wrap(d0, sub, fs, w - 2 * margin) if sub else []
    lh, sh = int(size * 1.12), int(size * 0.58)
    h = 80 + lh * len(lines) + (12 + sh * len(subs) if subs else 0)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    band = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    bd = ImageDraw.Draw(band)
    for y in range(h):  # a gentle vertical fade so the band never shows a hard edge
        a = int(150 * min(1, y / 40, (h - y) / 40))
        bd.line([(0, y), (w, y)], fill=(12, 11, 18, a))
    im.alpha_composite(band)
    d = ImageDraw.Draw(im)
    y = 36
    for ln in lines:
        d.text(((w - d.textlength(ln, font=f)) / 2, y), ln, font=f, fill=PAPER)
        y += lh
    y += 12
    for ln in subs:
        d.text(((w - d.textlength(ln, font=fs)) / 2, y), ln, font=fs, fill=GOLD)
        y += sh
    return im


def end_card(w, h):
    im = Image.new('RGB', (w, h), INK)
    d = ImageDraw.Draw(im)
    vertical = h > w
    icon = 300 if vertical else 240
    ic = Image.open(ROOT / 'app' / 'assets' / 'icon.png').convert('RGBA').resize((icon, icon), Image.LANCZOS)
    m = Image.new('L', (icon, icon), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, icon - 1, icon - 1], radius=int(icon * 0.23), fill=255)
    cy = int(h * (0.33 if vertical else 0.30))
    im.paste(ic, ((w - icon) // 2, cy - icon // 2), m)
    def centre(text, font, y, fill):
        tw = d.textlength(text, font=font)
        d.text(((w - tw) / 2, y), text, font=font, fill=fill)
    s = 1 if vertical else 0.8
    centre('kinnesto', ImageFont.truetype(DISPLAY, int(150 * s)), cy + icon // 2 + int(40 * s), PAPER)
    centre('Find your place. And the people to share it with.', ImageFont.truetype(BOLD, int(40 * s)), cy + icon // 2 + int(230 * s), MUTED)
    centre('Now live in Mumbai', ImageFont.truetype(BOLD, int(40 * s)), cy + icon // 2 + int(320 * s), PAPER)
    centre('kinnesto.com', ImageFont.truetype(DISPLAY, int(76 * s)), cy + icon // 2 + int(400 * s), GOLD)
    return im


def main():
    # 1. Convert to H.264 (the generator outputs 10-bit HEVC, which many browsers and ad tools reject).
    enc = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '19', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart']
    run(['-i', str(R / 'ai-01-platform-relief.mp4'), *enc, str(R / 'clip-01-platform-relief.mp4')])
    run(['-i', str(R / 'ai-02-move-in.mp4'), *enc, str(R / 'clip-02-move-in.mp4')])
    # Clip 3 was generated sideways; turned 90 degrees anticlockwise it is an upright 1920x1080 shot.
    run(['-i', str(R / 'ai-03-mumbai-sealink.mp4'), '-vf', 'transpose=2', *enc, str(R / 'clip-03-sealink-landscape.mp4')])

    # 2. Overlays and end cards as PNGs.
    tmp = R / '_build'
    tmp.mkdir(exist_ok=True)
    caption('Flat hunting in Mumbai?', 1080, 84).save(tmp / 'c1.png')
    caption('Swipe. Match. Move in.', 1080, 84, 'Rooms and flatmates, matched on how you live').save(tmp / 'c2.png')
    caption('No brokers. Just your people.', 1080, 78).save(tmp / 'c3.png')
    caption('Find your place in Mumbai.', 1920, 96, 'Flats, PGs, co-living and flatmates. No brokers.').save(tmp / 'c4.png')
    end_card(1080, 1920).save(tmp / 'end-v.png')
    end_card(1920, 1080).save(tmp / 'end-h.png')

    # 3. Vertical 15 s reel: clip 1 (two captions) + clip 2 (one caption) + 3 s end card.
    # Captions sit below Instagram's top overlay (y 300) and above its bottom overlay.
    fc = (
        '[0:v]setpts=PTS-STARTPTS,fps=30[v0];[1:v]setpts=PTS-STARTPTS,fps=30[v1];'
        '[2:v]loop=loop=-1:size=1,trim=duration=3,fps=30,setpts=PTS-STARTPTS,format=yuv420p[v2];'
        "[v0][3:v]overlay=0:300:enable='between(t,0.3,3)'[a0];[a0][4:v]overlay=0:300:enable='between(t,3,6.1)'[b0];"
        "[v1][5:v]overlay=0:300:enable='between(t,0.5,6.1)'[b1];"
        '[0:a]asetpts=PTS-STARTPTS[x0];[1:a]asetpts=PTS-STARTPTS[x1];[6:a]atrim=duration=3[x2];'
        '[b0][x0][b1][x1][v2][x2]concat=n=3:v=1:a=1[v][a]'
    )
    run(['-i', str(R / 'clip-01-platform-relief.mp4'), '-i', str(R / 'clip-02-move-in.mp4'), '-i', str(tmp / 'end-v.png'),
         '-i', str(tmp / 'c1.png'), '-i', str(tmp / 'c2.png'), '-i', str(tmp / 'c3.png'),
         '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
         '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-shortest', *enc, str(R / 'reel-live-action-15s.mp4')])

    # 4. Landscape 9 s spot: the sea link with a caption, then a 3 s end card.
    fc2 = (
        '[0:v]setpts=PTS-STARTPTS,fps=30[v0];[1:v]loop=loop=-1:size=1,trim=duration=3,fps=30,setpts=PTS-STARTPTS,format=yuv420p[v1];'
        "[v0][2:v]overlay=0:H-h-60:enable='between(t,0.8,6.1)'[b0];"
        '[0:a]asetpts=PTS-STARTPTS[x0];[3:a]atrim=duration=3[x1];[b0][x0][v1][x1]concat=n=2:v=1:a=1[v][a]'
    )
    run(['-i', str(R / 'clip-03-sealink-landscape.mp4'), '-i', str(tmp / 'end-h.png'), '-i', str(tmp / 'c4.png'),
         '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
         '-filter_complex', fc2, '-map', '[v]', '-map', '[a]', '-shortest', *enc, str(R / 'spot-landscape-9s.mp4')])
    print('done')


if __name__ == '__main__':
    main()
