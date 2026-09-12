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
# ⭐ AND EVERY DEPTH, not just the root. `works/index.html` is a page; a glob
# that stops at the top level would have covered none of it — the same silent
# failure this comment was written about, one directory down.
PAGES = {str(f.relative_to(ROOT)): f.read_text()
         for f in sorted(ROOT.glob('**/*.html'))
         if not any(part.startswith('.') or part == 'node_modules'
                    for part in f.relative_to(ROOT).parts)}
html = '\n'.join(PAGES.values())            # the checks that are about the whole site
index = PAGES['index.html']                  # the ones that are about the front page
site = (ROOT / 'css/site.css').read_text()
toks = (ROOT / 'css/tokens.css').read_text()
# ⭐ EVERY SCRIPT, NOT JUST site.js — the same failure this file warns about
# twice for HTML ("a glob that stops at the top", "looking at nothing"). The
# two /works instruments live in js/split.js and js/ask.js, and while this read
# one file their classes and selectors were invisible to every check below.
js   = '\n'.join(f.read_text() for f in sorted(ROOT.glob('js/**/*.js')))

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
# ── the two dark paths must agree, and neither may say a thing twice ────────
# ⛔ THE THEME-PARITY CHECK BELOW DOES NOT COVER THIS, and the gap was live.
# It asks only whether a token declared in a dark block also exists in :root.
# It never compared the TWO dark blocks to each other — so `@media
# (prefers-color-scheme: dark)` carried the badge palette, `:root[data-theme=
# "dark"]` carried none of it, and this file printed green while a reader who
# explicitly chose dark got DAY badges on a night page.
# ⚠️ It also missed a duplicated paste inside the media block: the whole badge
# group declared twice, second copy misindented. A later edit that anchored on
# one of the doubled tokens quietly doubled four more.
# ⭐ Plain CSS cannot share a selector list between a media query and an
# unconditional rule, so the night palette HAS to be written twice. That makes
# drift a certainty and the check the only defence.
def _decls(css, start_pat):
    i = css.find(start_pat)
    if i < 0: return None
    depth, j, out = 0, i, []
    while j < len(css):
        if css[j] == '{': depth += 1
        elif css[j] == '}':
            depth -= 1
            if depth == 0: break
        j += 1
    return re.findall(r'(--[a-z0-9-]+)\s*:', css[i:j])

_md = _decls(toks, ':root:not([data-theme="light"])')
_td = _decls(toks, ':root[data-theme="dark"]')
_problems = []
if _md is None or _td is None:
    _problems.append('could not find both dark blocks')
else:
    for name, d in (('@media dark', _md), ('[data-theme=dark]', _td)):
        dup = sorted({t for t in d if d.count(t) > 1})
        if dup: _problems.append(f'{name} declares {dup} more than once')
    only_m, only_t = sorted(set(_md) - set(_td)), sorted(set(_td) - set(_md))
    if only_m: _problems.append(f'in @media dark but not [data-theme=dark]: {only_m}')
    if only_t: _problems.append(f'in [data-theme=dark] but not @media dark: {only_t}')
check('dark parity', not _problems, ' · '.join(_problems))

declared = set(re.findall(r'^\s*(--[a-z0-9-]+):', toks, re.M))
dark_only = set(re.findall(r'--[a-z0-9-]+', toks.split('prefers-color-scheme')[1])) if 'prefers-color-scheme' in toks else set()
check('theme parity', not (dark_only - declared), f'defined only in a theme block: {sorted(dark_only - declared)[:4]}')

# ── classes and tokens: nothing undefined, nothing unused ───────────────────
# ⭐ THE TWO CHECKS ASK DIFFERENT QUESTIONS, so they read different sources.
#   undefined — does the MARKUP name a class with no rule? Strict: markup only,
#               because that is where a typo silently renders unstyled.
#   unused    — is a rule referenced ANYWHERE, markup or script? A class a
#               script builds is used, and it is rarely built whole:
#               `d.className = 'role' + (on ? '' : ' off')` is three literals.
# ⛔ FEEDING THE SCRIPT TOKENS INTO BOTH WAS THE FIRST ATTEMPT AND IT WAS WRONG —
# every quoted word in every script became a "class", and `undefined` reported
# 400 English words. The asymmetry is the point.
in_markup = set()
for c in re.findall(r'class="([^"]*)"', html): in_markup.update(c.split())

in_script = set(re.findall(r"querySelectorAll?\('\.([a-z0-9-]+)", js))
# markup built inside a script string: '<div class="k-cour">' — the literal
# scan below cannot see these, because splitting that string on whitespace
# yields `class="k-cour">`, which is not a bare token.
for c in re.findall(r'class="([^"<>]*)"', js): in_script.update(c.split())
for lit in re.findall(r"'([^'\n]*)'|\"([^\"\n]*)\"", js):
    for tok in (lit[0] or lit[1]).split():
        if re.fullmatch(r'[a-zA-Z][\w-]*', tok): in_script.add(tok)

defined = set(re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', bare))
check('undefined css', not (in_markup - defined), f'{sorted(in_markup - defined)}')
check('unused css', not (defined - in_markup - in_script), f'{sorted(defined - in_markup - in_script)}')
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
# ── one attribute per tag ───────────────────────────────────────────────────
# ⛔ A REPEATED ATTRIBUTE IS SILENT. Given `class="dial" class="dial--open"` a
# browser keeps the FIRST and discards the rest: no error, no warning, and a
# stylesheet rule that simply never applies. Eight tags shipped this way when
# two pages were generated by a script that wrote a second class attribute
# instead of merging (Jacob spotted it by reading the output, 2026-09-12).
dup_attr = {}
for name, page in PAGES.items():
    hits = []
    for tag in re.findall(r'<[a-zA-Z][^>]*>', page):
        seen = re.findall(r'(?:^|\s)([a-zA-Z-]+)=', tag)
        twice = sorted({a for a in seen if seen.count(a) > 1})
        if twice:
            hits.append(f'{twice} in {tag[:60]}')
    if hits: dup_attr[name] = hits
check('one attr per tag', not dup_attr, f'{dup_attr}')

check('unique ids', not dup_ids, f'{dup_ids}')
check('anchor', not dead_anchors, f'{dead_anchors}')

# ── every referenced local asset exists ─────────────────────────────────────
# ⚠️ RESOLVED AGAINST THE PAGE, NOT THE ROOT. A page in a subdirectory reaches
# the assets relatively — `works/index.html` links `../css/site.css` — and the
# old root-anchored pattern did not even MATCH those, so it reported ok by
# looking at nothing. Same class of failure as a glob that stops at the top.
missing = []
for name, page in PAGES.items():
    here = (ROOT / name).parent
    for src in re.findall(r'(?:src|href)="((?:\.\./)*(?:assets|css|js)/[^"?]+)', page):
        if not (here / src).resolve().exists():
            missing.append(f'{name} → {src}')
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
# ⭐ AND ONE ELEMENT MAY NAME THE INSTANCE, anywhere, on any page. A reader
# looking at a living map wants to know whose neighborhood it is, and refusing to
# say reads as evasion rather than as discipline (Jacob, 2026-08-31). So the rule
# is scoped a SECOND way: any element carrying `data-names-instance` has its text
# removed before the scan, and the check runs at full strength on everything else.
# ⛔ THE HOOK IS AN ATTRIBUTE, NOT A PAGE. Exempting index.html wholesale would
# retire the rule on the one page it exists for; exempting a marked element keeps
# every other sentence honest and makes the exception visible in the markup, where
# the next person edits. Remove the attribute and the audit fails again.
# ⚠️ AND ONE PAGE IS SCOPED WHOLE, PROVISIONALLY. `works/index.html` is a
# technical prospectus whose central rhetorical move is arguing FROM the
# instance — "One neighborhood is the proof" — so it names the town on nearly
# every screen. Marking each mention would be noise pretending to be discipline.
# ⛔ THIS IS THE WEAKEST EXEMPTION IN THIS FILE and it is deliberately the only
# whole-page one: the front page's rule exists because naming a town collapses
# the KIT into one instance, and that argument does not apply to a document
# about how the instance was built. Jacob, 2026-09-05: "let's see how it
# actually looks/works in situ" — revisit once it has been looked at, and prefer
# `data-names-instance` on the handful of elements that really need it if the
# count turns out to be small.
TOWN_EXEMPT_PAGES = {'works/index.html'}
INSTANCE_NOTE = re.compile(r'<([a-zA-Z][\w-]*)\b[^>]*\bdata-names-instance\b.*?</\1\s*>', re.S)
town_fails = {}
for name, page in PAGES.items():
    if name in TOWN_EXEMPT_PAGES: continue
    body_ = page[page.find('<body'):] if '<body' in page else page
    body_ = INSTANCE_NOTE.sub(' ', body_)
    words = re.findall(TOWNS, re.sub(r'<[^>]+>', ' ', body_), re.I)
    if name == 'legal.html':
        words = [w for w in words if w.lower() not in JURISDICTION]
    if words: town_fails[name] = sorted(set(words))
check('names a town', not town_fails, f'{town_fails}')

# ── the link preview: the card a forwarded text shows ───────────────────────
# ⛔ AN og:image MUST BE ABSOLUTE AND MUST NOT BE THE SVG. A scraper is not a
# browser: it does not resolve a relative path, and it rasterises nothing. Either
# mistake yields a BLANK CARD, which reads as a broken link rather than a plain one —
# and neither is visible from the page itself, so nothing else here would catch it.
og_fails = []
for name, page in PAGES.items():
    m = re.search(r'<meta property="og:image" content="([^"]+)"', page)
    if not m:
        og_fails.append(f'{name}: no og:image'); continue
    src = m.group(1)
    if not src.startswith('https://'): og_fails.append(f'{name}: og:image is not absolute — {src}')
    if src.endswith('.svg'):           og_fails.append(f'{name}: og:image is an SVG — scrapers show a blank card')
    local = ROOT / src.split('theward.online/')[-1]
    if 'theward.online/' in src and not local.exists():
        og_fails.append(f'{name}: og:image is not on disk — {local.name}')
check('link preview', not og_fails, f'{og_fails}')
og = subprocess.run(['python3', 'tools/build-og.py', '--check'], cwd=ROOT,
                    capture_output=True, text=True)
check('preview image', og.returncode == 0, (og.stdout + og.stderr).strip())

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
