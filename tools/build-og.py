#!/usr/bin/env python3
"""
build-og — the link-preview image, rendered from the mark rather than drawn again.

⭐ WHY THIS EXISTS AT ALL. The site's mark is `assets/favicon.svg`, and an SVG is
the right answer for a tab: it is theme-aware and one file beats a pile of PNGs.
⛔ IT IS THE WRONG ANSWER FOR A LINK PREVIEW. iMessage, Signal, Slack, WhatsApp and
every other scraper fetch `og:image` and rasterise nothing — an SVG there shows as a
blank card, which is worse than no card because the link looks broken rather than
plain. So the preview is a PNG at the 1200×630 Open Graph standard.

⛔ AND IT IS GENERATED, NOT DRAWN. The ring's geometry is copied from ONE place —
the favicon's own path — so the preview cannot drift away from the tab icon the way
two hand-kept copies always do. Change the mark, re-run this.

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

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/og.png"
MARK = ROOT / "assets/favicon.svg"

# Token values, never new colours: --band-bg, --band-text, --live.
BG, RING, NOTCH = "#1C1815", "#EFE8D8", "#B96A12"
W, H, S = 1200, 630, 430          # OG standard; the mark takes the frame it deserves
K = 4                             # supersample — PIL's arc has no antialiasing

# The favicon's own geometry, in its 0 0 120 120 viewBox:
#   path  M76.8 14 A 49 49 0 1 1 43.2 14   stroke-width 17
#   notch circle cx 60 cy 14 r 13
CX, CY, R, SW = 60.0, 60.0, 49.0, 17.0
AX, AY = 76.8, 14.0               # arc start
BX, BY = 43.2, 14.0               # arc end
NX, NY, NR = 60.0, 14.0, 13.0     # the notch

# ⛔ A PIN, not a copy. If the mark's path ever changes, these numbers are stale and
# this script would keep emitting the OLD ring under a NEW favicon — silently, which
# is the failure this whole file exists to avoid.
def check_pin() -> None:
    svg = MARK.read_text(encoding="utf-8")
    for needle in (f"M{AX:g} {AY:g} A {R:g} {R:g}", f'cx="{CX:g}" cy="{NY:g}" r="{NR:g}"',
                   f'stroke-width="{SW:g}"'):
        if needle not in svg:
            sys.exit(f"[build-og] ⛔ {MARK.name} no longer contains `{needle}`.\n"
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
          f"({OUT.stat().st_size // 1024} KB) from {MARK.name}")
