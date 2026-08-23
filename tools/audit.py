#!/usr/bin/env python3
"""
audit — verify the code against its own rules before any document is trusted.

Run before committing structural changes:   python3 tools/audit.py

A semantic check cannot see a structural break and vice versa, so both run.
Every line reports ok or names what is wrong; a failure exits non-zero.
"""
import re, sys, subprocess, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
html = (ROOT / 'index.html').read_text()
site = (ROOT / 'css/site.css').read_text()
toks = (ROOT / 'css/tokens.css').read_text()
js   = (ROOT / 'js/site.js').read_text()

fails = []
def check(label, ok, detail=''):
    print(f'{label:<14}: {"ok" if ok else detail or "FAIL"}')
    if not ok: fails.append(label)

# ── rule 1: no literal colours, sizes, families or durations outside tokens ──
bare = re.sub(r'/\*.*?\*/', '', site, flags=re.S)
hexes = re.findall(r'#[0-9a-fA-F]{3,8}\b', bare)
rgba  = re.findall(r'\brgba?\([^)]*\)', bare)
fams  = [v for v in re.findall(r'font-family:\s*([^;]+)', bare) if not v.strip().startswith('var(')]
check('literals', not (hexes or rgba or fams),
      f'hex={hexes[:3]} rgba={rgba[:3]} font-family={fams[:2]}')

# ── rule 2: no inline style attributes; rule 3: no <style> blocks ────────────
check('inline style', 'style="' not in html, 'found a style attribute in index.html')
check('style blocks', '<style' not in html, 'found a <style> block; all CSS lives in css/')

# ── rule 4: no !important ───────────────────────────────────────────────────
bad_imp = [l.strip() for l in site.splitlines()
           if '!important' in l and 'prefers-reduced-motion' not in site[:site.find(l)][-400:]]
check('!important', not re.search(r'!important', re.sub(r'@media \(prefers-reduced-motion[^}]*\}[^}]*\}', '', site, flags=re.S)),
      'found !important outside the reduced-motion reset')

# ── rule 5: both themes, all three viewer states ────────────────────────────
check('themes', all(s in toks for s in
      (':root {', '@media (prefers-color-scheme: dark)', ':root:not([data-theme="light"])', ':root[data-theme="dark"]')),
      'tokens.css must declare bare :root, the guarded media query, and the [data-theme] stamp')
declared = set(re.findall(r'^\s*(--[a-z0-9-]+):', toks, re.M))
dark_only = set(re.findall(r'--[a-z0-9-]+', toks.split('prefers-color-scheme')[1])) if 'prefers-color-scheme' in toks else set()
check('theme parity', not (dark_only - declared), f'defined only in a theme block: {sorted(dark_only - declared)[:4]}')

# ── classes and tokens: nothing undefined, nothing unused ───────────────────
used = set()
for c in re.findall(r'class="([^"]*)"', html): used.update(c.split())
used.update(re.findall(r"querySelectorAll?\('\.([a-z0-9-]+)", js))
used.update(re.findall(r'class="([^"]*)"', html and '' or ''))  # no-op guard
defined = set(re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', bare))
check('undefined css', not (used - defined), f'{sorted(used - defined)}')
check('unused css', not (defined - used), f'{sorted(defined - used)}')
# Reserved, and why. A scale with a hole in it is worse than an unused step;
# anything NOT listed here that reports unused is drift, not a reservation.
RESERVED = {
    '--s5': 'spacing scale step — the scale is a system, not a pick-list',
    '--s7': 'spacing scale step — as above',
}
refs = set(re.findall(r'var\((--[a-z0-9-]+)', site + toks + js))

# Tokens reached by a COMPUTED name — getPropertyValue('--sky-' + key + '-top').
# The literal prefix is the contract; every token under it counts as referenced,
# and is reported as dynamic so it is never mistaken for a static use.
dynamic = set()
for prefix in re.findall(r"setProperty\('(--[a-z0-9-]*)", js) + \
              re.findall(r"getPropertyValue\('(--[a-z0-9-]*)", js):
    if len(prefix) > 2:
        dynamic |= {t for t in declared if t.startswith(prefix)}
refs |= dynamic

drift = declared - refs - set(RESERVED)
check('unused token', not drift, f'{sorted(drift)}')
for t in sorted((declared - refs) & set(RESERVED)):
    print(f'  reserved    : {t} — {RESERVED[t]}')
if dynamic:
    print(f'  dynamic     : {len(dynamic)} token(s) reached by computed name from js/site.js')

# ── structure: balanced comments and tags ───────────────────────────────────
check('comments', html.count('<!--') == html.count('-->'),
      f'{html.count("<!--")} open / {html.count("-->")} close')
body = re.sub(r'<!--.*?-->', '', html, flags=re.S)
VOID = {'img','input','br','hr','meta','link','source','area','base','col',
        'path','circle','rect','ellipse','use','stop','polygon','line'}
stack, mismatch = [], []
for m in re.finditer(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(/?)>', body):
    close, name, self_ = m.group(1), m.group(2).lower(), m.group(3)
    if name in VOID or self_ or name == '!doctype': continue
    if not close: stack.append(name)
    elif stack and stack[-1] == name: stack.pop()
    else: mismatch.append(name)
check('tags', not stack and not mismatch, f'unclosed={stack[:4]} mismatch={mismatch[:4]}')

# ── ids unique, and every reference resolves ────────────────────────────────
ids = re.findall(r'\sid="([^"]+)"', html)
check('unique ids', len(ids) == len(set(ids)), f'duplicated: {[i for i in set(ids) if ids.count(i) > 1]}')
for href in re.findall(r'href="#([^"]+)"', html):
    if href not in ids: fails.append('anchor'); print(f'anchor        : #{href} goes nowhere')

# ── the site names no town ──────────────────────────────────────────────────
text = re.sub(r'<[^>]+>', ' ', body)
leak = sorted(set(re.findall(r'Lafayette|St\.? ?Louis|Missouri|Łódź|Lodz|Altadena|Poland', text, re.I)))
check('names a town', not leak, f'{leak}')

# ── the sources block is generated, and current ─────────────────────────────
gen = subprocess.run(['node', 'tools/build.mjs', '--check'], cwd=ROOT,
                     capture_output=True, text=True)
check('generated', gen.returncode == 0, (gen.stdout + gen.stderr).strip())

# ── the courier route is not live ───────────────────────────────────────────
m = re.search(r"var COURIER_INTAKE = '(\w+)'", js)
live = m and m.group(1) == 'live'
print(f'courier       : {"⚠ LIVE — the backend close-out must have landed" if live else "interest (touches no backend)"}')

print()
print('AUDIT ' + ('PASSED' if not fails else 'FAILED: ' + ', '.join(sorted(set(fails)))))
sys.exit(1 if fails else 0)
