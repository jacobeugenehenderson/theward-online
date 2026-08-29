#!/usr/bin/env python3
"""
audit — verify the code against its own rules before any document is trusted.

Run before committing structural changes:   python3 tools/audit.py

A semantic check cannot see a structural break and vice versa, so both run.
Every line reports ok or names what is wrong; a failure exits non-zero.
"""
import re, sys, subprocess, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# ⛔ EVERY PAGE, NOT JUST THE FRONT ONE. This read `index.html` alone, so the day
# `legal.html` arrived every rule below went quiet on it at once — no lazy-loading
# check, no inline-style check, no missing-asset check, and every class it used
# scored as UNUSED CSS. A lint that silently stops covering a new file is worse
# than no lint, because the green line still prints.
# ⭐ So the page list is the FILESYSTEM. A page added tomorrow is covered on the
# day it lands, with nothing to remember.
PAGES = {f.name: f.read_text() for f in sorted(ROOT.glob('*.html'))}
html = '\n'.join(PAGES.values())            # the checks that are about the whole site
index = PAGES['index.html']                  # the ones that are about the front page
site = (ROOT / 'css/site.css').read_text()
toks = (ROOT / 'css/tokens.css').read_text()
js   = (ROOT / 'js/site.js').read_text()

fails = []
def check(label, ok, detail=''):
    print(f'{label:<15}: {"ok" if ok else detail or "FAIL"}')
    if not ok: fails.append(label)

# ── rule 1: no literal colours, sizes, families or durations outside tokens ──
bare = re.sub(r'/\*.*?\*/', '', site, flags=re.S)
hexes = re.findall(r'#[0-9a-fA-F]{3,8}\b', bare)
rgba  = re.findall(r'\brgba?\([^)]*\)', bare)
fams  = [v for v in re.findall(r'font-family:\s*([^;]+)', bare) if not v.strip().startswith('var(')]
check('literals', not (hexes or rgba or fams),
      f'hex={hexes[:3]} rgba={rgba[:3]} font-family={fams[:2]}')

# ── the loudest rule on the page, and nothing was checking it ────────────────
# README §1 leads with "NOTHING ON THIS PAGE IS loading=lazy, AND THAT IS A RULE"
# and records that it cost three separate debugging rounds. It then happened a
# fourth time: the tree frame shipped with loading="lazy" and the sky band sat
# black under programmatic scroll — indistinguishable from a broken embed. A rule
# stated only in prose is a rule that comes back.
lazy = re.findall(r'<(\w+)[^>]*loading="lazy"', html)
check('lazy loading', not lazy, f'loading="lazy" on: {lazy} — README §1 forbids it')

# ── rule 2: no inline style attributes; rule 3: no <style> blocks ────────────
check('inline style', 'style="' not in html,
      f'style attribute in: {[n for n,h in PAGES.items() if chr(34) in h and "style=" + chr(34) in h]}')
check('style blocks', '<style' not in html,
      f'<style> block in: {[n for n,h in PAGES.items() if "<style" in h]} — all CSS lives in css/')

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

# ── the other half of the token check, and the expensive half ───────────────
# `unused token` above catches a token declared and never reached. This catches
# the reverse — a token REACHED and never declared — and that one is not a tidy
# ness problem, it is a silent bug.
#
#   ⛔ AN UNDEFINED CUSTOM PROPERTY DOES NOT FALL THROUGH. IT WINS, THEN EVAPORATES.
#
# `border-radius: var(--shape-corner-md)` with no fallback outranks a utility
# class on specificity and takes the cascade; only AFTERWARDS does the undefined
# var make the declaration invalid at computed-value time, resetting the property
# to its initial value. So the rule that beat everything paints nothing, and the
# rule that would have worked never gets its turn. There is no error, no console
# warning, and nothing wrong-looking in either rule.
#
# Paid for twice. Every control in Codedesk rendered square for this reason, and
# `--vig-rim-accent` was referenced here before tokens.css declared it — while
# THIS FILE reported ok, because it only ever looked at the declared side.
#
# A `var()` WITH a fallback is safe by construction and is deliberately allowed:
# the fallback is the author saying what happens when the token is absent.
nof  = set(re.findall(r'var\((--[a-z0-9-]+)\s*\)', site + toks))
# Declared anywhere a browser would find it: tokens.css, a local on a component
# in site.css, or seeded onto an element by js (including a COMPUTED name, whose
# literal prefix is the contract — same rule as `dynamic` above).
local  = set(re.findall(r'(--[a-z0-9-]+)\s*:', bare))
seeded = set(re.findall(r"setProperty\('(--[a-z0-9-]+)", js))
def seeded_ok(t):
    return any(len(p) > 2 and t.startswith(p) for p in seeded)
undef = {t for t in nof - declared - local if t not in seeded and not seeded_ok(t)}
check('undefined token', not undef,
      f'{sorted(undef)} — used in var() with no fallback and declared nowhere; '
      'the declaration wins on specificity and then paints nothing')

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
# ⛔ PER PAGE, NOT ACROSS PAGES. Uniqueness is a property of a DOCUMENT; two pages
# sharing `#main` or the mark's `#mark-clip` is correct and expected. Checking the
# concatenation reported both as duplicates the moment a second page existed —
# a lint crying wolf about the very thing it should be indifferent to.
dup_ids, dead_anchors = {}, {}
for name, page in PAGES.items():
    pids = re.findall(r'\sid="([^"]+)"', page)
    dups = sorted({i for i in pids if pids.count(i) > 1})
    if dups: dup_ids[name] = dups
    dead = sorted({h for h in re.findall(r'href="#([^"]+)"', page) if h not in pids})
    if dead: dead_anchors[name] = dead
check('unique ids', not dup_ids, f'{dup_ids}')
check('anchor', not dead_anchors, f'{dead_anchors}')

# ── every referenced local asset exists ─────────────────────────────────────
missing = [src for src in re.findall(r'(?:src|href)="((?:assets|css|js)/[^"?]+)', html)
           if not (ROOT / src).exists()]
check('assets', not missing, f'{missing}')

# ── the site names no town ──────────────────────────────────────────────────
# ⭐ WHY THE RULE EXISTS: the page sells the KIT, and naming one town collapses it
# into one instance. That is an argument about the PITCH.
# ⛔ A GOVERNING-LAW CLAUSE IS NOT THE PITCH. It has to name a jurisdiction — a
# court sits somewhere — so the rule is SCOPED rather than switched off, and only
# the two strings a forum-selection clause actually needs are allowed, only on the
# legal page. Anything else, anywhere, still fails.
TOWNS = r'Lafayette|St\.? ?Louis|Missouri|Łódź|Lodz|Altadena|Poland'
JURISDICTION = {'missouri', 'st. louis', 'st louis'}
town_fails = {}
for name, page in PAGES.items():
    body_ = page[page.find('<body'):] if '<body' in page else page
    words = re.findall(TOWNS, re.sub(r'<[^>]+>', ' ', body_), re.I)
    if name == 'legal.html':
        words = [w for w in words if w.lower() not in JURISDICTION]
    if words: town_fails[name] = sorted(set(words))
check('names a town', not town_fails, f'{town_fails}')

# ── the sources block is generated, and current ─────────────────────────────
gen = subprocess.run(['node', 'tools/build.mjs', '--check'], cwd=ROOT,
                     capture_output=True, text=True)
check('generated', gen.returncode == 0, (gen.stdout + gen.stderr).strip())

# ── the courier route is not live ───────────────────────────────────────────
m = re.search(r"var COURIER_INTAKE = '(\w+)'", js)
live = m and m.group(1) == 'live'
print(f'courier        : {"⚠ LIVE — the backend close-out must have landed" if live else "interest (touches no backend)"}')

print()
print('AUDIT ' + ('PASSED' if not fails else 'FAILED: ' + ', '.join(sorted(set(fails)))))
sys.exit(1 if fails else 0)
