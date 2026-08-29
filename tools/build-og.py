#!/usr/bin/env python3
"""
build-og — the link-preview image, rendered from the mark rather than drawn again.

⭐ WHY THIS EXISTS AT ALL. The site's mark is `assets/favicon.svg`, and an SVG is
the right answer for a tab: it is theme-aware and one file beats a pile of PNGs.
⛔ IT IS THE WRONG ANSWER FOR A LINK PREVIEW. iMessage, Signal, Slack, WhatsApp and
every other scraper fetch `og:image` and rasterise nothing — an SVG there shows as a
blank card, which is worse than no card because the link looks broken rather than
plain. So the preview is a PNG at the 1200×630 Open Graph standard.

⭐ IT IS THE BAND MARK, NOT THE FAVICON. `README` §301: the favicon is the mark's
16px cousin, and it DROPS the street grid because the grid "turns to mud below about
20px". A preview card is 1200px wide — the grid survives easily there, and it is the
half of the mark that says this thing is about STREETS. Using the tab icon here
would ship the compromise made for a 16px box into a frame that never needed it.

⛔ AND IT IS GENERATED, NOT DRAWN. The geometry is read from ONE place — the band
mark inline in `index.html` — so the preview cannot drift from the mark on the page
the way two hand-kept copies always do. Change the mark, re-run this.

⚠️ THE DARK THEME'S VALUES, DELIBERATELY. The favicon is theme-aware; a preview card
cannot be, because it is baked at build time and the reader's theme is unknowable.
It takes the masthead band's colours, which is what the top of the page looks like
in either theme and therefore what a forwarded link should look like.

  python3 tools/build-og.py            writes assets/og.png
  python3 tools/build-og.py --check    exits 2 if the file is missing or stale

Requires Pillow (already used by tools/audit.py's toolchain).
"""
import math
import pathlib
import sys

from PIL import Image, ImageChops, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/og.png"
MARK = ROOT / "index.html"        # the band mark lives inline, in the masthead

# Token values, never new colours: --band-bg, --band-text, --live.
BG, RING, NOTCH = "#1C1815", "#EFE8D8", "#B96A12"
W, H, S = 1200, 630, 430          # OG standard; the mark takes the frame it deserves
K = 4                             # supersample — PIL's arc has no antialiasing

# The band mark's geometry, in its 0 0 120 120 viewBox:
#   ring  M76.8 14 A 49 49 0 1 1 43.2 14        stroke-width 11
#   grid  M38 8 V112 M82 8 V112 M8 38 H112 M8 82 H112
#         stroke-width 2.5, opacity 0.5, clipped to circle(60,60,r 40)
#   notch circle cx 60 cy 14 r 9.5
CX, CY, R, SW = 60.0, 60.0, 49.0, 11.0
AX, AY = 76.8, 14.0               # arc start
BX, BY = 43.2, 14.0               # arc end
NX, NY, NR = 60.0, 14.0, 9.5      # the notch
GRID_W, GRID_A, CLIP_R = 2.5, 0.5, 40.0
VLINES, HLINES = (38.0, 82.0), (38.0, 82.0)
GRID_LO, GRID_HI = 8.0, 112.0

# ⛔ A PIN, not a copy. If the mark's path ever changes, these numbers are stale and
# this script would keep emitting the OLD ring under a NEW favicon — silently, which
# is the failure this whole file exists to avoid.
def check_pin() -> None:
    svg = MARK.read_text(encoding="utf-8")
    for needle in (f"M{AX:g} {AY:g} A {R:g} {R:g}",
                   f'cx="{CX:g}" cy="{NY:g}" r="{NR:g}"',
                   f'stroke-width="{SW:g}"',
                   f'circle cx="{CX:g}" cy="{CY:g}" r="{CLIP_R:g}"',
                   f"M{VLINES[0]:g} {GRID_LO:g} V{GRID_HI:g}",
                   f'stroke-width="{GRID_W:g}"'):
        if needle not in svg:
            sys.exit(f"[build-og] ⛔ the band mark in {MARK.name} no longer contains `{needle}`.\n"
                     f"  The mark moved and this script's geometry did not. Update both, "
                     f"or the preview card will keep showing the previous mark.")


def render() -> Image.Image:
    w, h, s = W * K, H * K, S * K
    ox, oy = (w - s) // 2, (h - s) // 2
    u = s / 120.0
    im = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(im)
    # PIL sweeps clockwise from `start`, which is SVG's sweep-flag 1.
    a0 = math.degrees(math.atan2(AY - CY, AX - CX)) % 360
    a1 = math.degrees(math.atan2(BY - CY, BX - CX)) % 360
    d.arc([ox + (CX - R) * u, oy + (CY - R) * u, ox + (CX + R) * u, oy + (CY + R) * u],
          a0, a1, fill=RING, width=int(round(SW * u)))

    # The streets. PIL has no clipPath, so the clip IS a mask — but the mask must
    # be the LINES themselves, intersected with the clip circle.
    # ⛔ NOT a filled layer composited through a circular mask: that was the first
    # cut, and it laid 50% of the layer's own BACKGROUND over everything inside
    # r40, printing a grey disc edge across the cream ring. The SVG's grid group
    # has strokes and no field; the mask has to say the same thing.
    lines = Image.new("L", (w, h), 0)
    ld = ImageDraw.Draw(lines)
    gw = max(1, int(round(GRID_W * u)))
    for x in VLINES:
        ld.line([ox + x * u, oy + GRID_LO * u, ox + x * u, oy + GRID_HI * u], fill=255, width=gw)
    for y in HLINES:
        ld.line([ox + GRID_LO * u, oy + y * u, ox + GRID_HI * u, oy + y * u], fill=255, width=gw)
    clip = Image.new("L", (w, h), 0)
    ImageDraw.Draw(clip).ellipse(
        [ox + (CX - CLIP_R) * u, oy + (CY - CLIP_R) * u,
         ox + (CX + CLIP_R) * u, oy + (CY + CLIP_R) * u], fill=255)
    mask = ImageChops.multiply(lines, clip).point(lambda v: int(v * GRID_A))
    im = Image.composite(Image.new("RGB", (w, h), RING), im, mask)

    d = ImageDraw.Draw(im)
    d.ellipse([ox + (NX - NR) * u, oy + (NY - NR) * u,
               ox + (NX + NR) * u, oy + (NY + NR) * u], fill=NOTCH)
    return im.resize((W, H), Image.LANCZOS)


check_pin()
if "--check" in sys.argv:
    if not OUT.exists():
        sys.exit(f"[build-og] ⛔ {OUT.relative_to(ROOT)} is missing — every forwarded "
                 f"link shows a blank card. Run: python3 tools/build-og.py")
    have = Image.open(OUT)
    if have.size != (W, H):
        sys.exit(f"[build-og] ⛔ {OUT.relative_to(ROOT)} is {have.size[0]}×{have.size[1]}, "
                 f"expected {W}×{H}.")
    print(f"[build-og] ok — {OUT.relative_to(ROOT)} {W}×{H}")
else:
    render().save(OUT, optimize=True)
    print(f"[build-og] wrote {OUT.relative_to(ROOT)} {W}×{H} "
          f"({OUT.stat().st_size // 1024} KB) from the band mark in {MARK.name}")
