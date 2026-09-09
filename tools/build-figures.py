#!/usr/bin/env python3
"""
build-figures — the works page's captures, from the raw grabs to what ships.

    python3 tools/build-figures.py

Reads `_source/shots/NN.png` (retina grabs out of Cartograph, 4186x2218) and
writes `assets/works/*.webp`. The raw grabs are ~70 MB and gitignored with the
rest of `_source/`; the WebPs are ~700 KB for the lot and are what the repo
carries.

⭐ NOT WIRED INTO tools/build.mjs, deliberately. Every other generator reads
something the repo has — the product's own panel, the token file — so it can run
on any checkout. This one reads `_source/`, which a clean checkout does not have,
and a build step that fails on a fresh clone is worse than a build step run by
hand when the captures change.

⚠️ THE FRAME NUMBERS ARE THE CONTRACT. Section's build is six grabs of ONE
locked camera with a layer switched on between each, and it only reads as one
place assembling because nothing else moves. Re-capture the set together or not
at all; a single replaced frame will jump.
"""
import subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC  = ROOT / '_source/shots'
OUT  = ROOT / 'assets/works'

# name → (source grab, output width, quality)
# The two stills carry panel text a reader may want to look at, so they get the
# extra width. The build frames are read as motion, never studied, and there are
# six of them — width costs six times as much here as it does anywhere else.
FIGURES = [
    ('survey',    '02', 2000, 80),
    ('section-1', '04', 1600, 80),
    ('section-2', '05', 1600, 80),
    ('section-3', '06', 1600, 80),
    ('section-4', '07', 1600, 80),
    ('section-5', '08', 1600, 80),
    ('section-6', '09', 1600, 80),
    ('stage',     '10', 2000, 80),
    ('preview',   '12', 2000, 80),
]

def main():
    if not SRC.exists():
        sys.exit(f'no {SRC.relative_to(ROOT)} — the raw grabs are gitignored; '
                 'put them back before rebuilding the figures')
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for name, grab, width, q in FIGURES:
        src = SRC / f'{grab}.png'
        if not src.exists():
            sys.exit(f'missing grab {src.relative_to(ROOT)}')
        dst = OUT / f'{name}.webp'
        tmp = OUT / f'.{name}.scaled.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src),
                        '-vf', f'scale={width}:-2:flags=lanczos', str(tmp)], check=True)
        subprocess.run(['cwebp', '-quiet', '-q', str(q), '-m', '6',
                        str(tmp), '-o', str(dst)], check=True)
        tmp.unlink()
        kb = dst.stat().st_size / 1024
        total += kb
        print(f'{name:<12} ← {grab}.png  {width}px  {kb:6.0f} KB')
    print(f'{"":<12}   {"":<9} {"total":>7} {total:6.0f} KB')

if __name__ == '__main__':
    main()
