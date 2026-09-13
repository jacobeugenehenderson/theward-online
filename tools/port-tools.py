import io, re, sys

SRC = "/private/tmp/claude-501/-Users-jacobhenderson-Desktop-lafayette-square-nosync/15948c52-f615-4988-91d4-4415392b0563/scratchpad/%s.html"
OUT = "/Users/jacobhenderson/Desktop/dev.nosync/theward-online/works/%s/index.html"

# ── The palette map. ⭐ COURIER IS THE CARY GREEN AND THAT IS NOT A CHOICE MADE
#    HERE: tokens.css records verdigris as the product's OWN authored courier
#    colour, taken from SocietyMasthead's Couriers stat. The bar's courier slice
#    is therefore the same green the app paints couriers in.
#    ⛔ --live IS NOT IN THIS MAP. tokens.css reserves amber for what is actually
#    running, and delivery is not open; the Cary section on the front page makes
#    the same refusal for the same reason. Amber's jobs go to the routed brown.
TOK = [
    ('var(--brick-soft)', 'var(--ground-3)'),
    ('var(--brick)',      'var(--cary-rule)'),
    ('var(--verdigris)',  'var(--cary-rule)'),
    ('var(--amber)',      'var(--sign)'),
    ('var(--ink-3)',      'var(--text-faint)'),
    ('var(--ink-2)',      'var(--text-soft)'),
    ('var(--ink)',        'var(--text)'),
    ('var(--paper)',      'var(--ground-2)'),
    ('var(--rule-soft)',  'var(--rule-soft)'),
    ('var(--shadow)',     'rgba(0,0,0,.07)'),
    ('var(--ground)',     'var(--ground)'),
]
FONTS = [
    ('font-family="IBM Plex Mono, monospace"', ''),
    ('"IBM Plex Mono",monospace', 'var(--f-sys)'),
    ("font-family:\\'IBM Plex Mono\\',monospace", 'font-family:var(--f-sys)'),
    ('"IBM Plex Mono", monospace', 'var(--f-sys)'),
    ("'IBM Plex Mono',monospace", 'var(--f-sys)'),
    ('"Fraunces","Iowan Old Style",Georgia,serif', 'var(--f-sys)'),
    ('"Fraunces",Georgia,serif', 'var(--f-sys)'),
    ('"IBM Plex Sans",system-ui,sans-serif', 'var(--f-sys)'),
]

INLINE = [
  ('style="max-width:none;margin-top:6px"',                'class="fignote"'),
  ('style="font-size:13px;color:var(--text-soft);max-width:70ch;margin:4px 0 0"', 'class="toponote"'),
  ('style="margin:20px 0 6px"',                            'class="topobar"'),
  ('style="border-bottom:none;padding-top:4px"',           'class="dial dial--open dial--tight"'),
  ('style="border-bottom:none"',                           'class="dial dial--open"'),
  ('style="max-width:100%;height:auto"',                   'class="fig-svg"'),
  ('style="margin-top:2px"',                               'class="mt-1"'),
  ('style="margin-top:30px"',                              'class="mt-4"'),
  ('style="margin:14px 0 4px"',                            'class="figbox"'),
  ('style="margin:10px 0 4px"',                            'class="figbox"'),
  ('style="color:var(--text-soft)"',                       'class="soft"'),
  ('style="margin:10px 0 2px;font-size:12.5px;color:var(--text-soft)"', 'class="sources"'),
  ('style="cursor:pointer;font-family:var(--f-sys);font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--text-faint)"', 'class="sources-sum"'),
  ('style="padding-top:9px;line-height:1.5"',              'class="sources-body"'),
  ('style="margin:8px 0 0;padding-left:16px"',             'class="sources-list"'),
  ('style="max-width:56ch"',                               'class="note"'),
  ('style="color:var(--sign)"',                            'class="tag-upside"'),
  ('style="color:var(--cary-rule)"',                       'class="tag-ward"'),
  ('style="margin-top:18px"',                              'class="mt-3"'),
  ('style="max-width:68ch;margin-top:-12px"',              'class="railnote"'),
  ('style="font-size:13px;color:var(--text-faint);max-width:70ch;margin-top:4px"', 'class="railfoot"'),
]

def deinline(t):
    """⛔ tools/audit.py forbids a style attribute anywhere: all CSS lives in
       css/. Each one above became a named class in site.css instead."""
    for a, b in INLINE:
        # a tag may already carry a class; merge rather than emit two attributes
        t = t.replace(' class="note" ' + a, ' class="note ' + b.split('"')[1] + '"')
        t = t.replace(' ' + a, ' ' + b)
    return merge_classes(t)

def merge_classes(t):
    """⛔ A TAG MAY CARRY ONE class ATTRIBUTE. `deinline` above turned a style
       attribute into a class one, and on a tag that ALREADY had a class that
       produced `class="dial" class="dial dial--open"`. A browser keeps the
       FIRST and silently discards the second, so the ported class did nothing
       and the failure was invisible — no error, no warning, just a rule that
       never applied. Merge them into one, first occurrence wins its position.
       (Reported by Jacob, 2026-09-12; tools/audit.py now checks for it.)"""
    def fix(m):
        tag = m.group(0)
        found = re.findall(r'\sclass="([^"]*)"', tag)
        if len(found) < 2:
            return tag
        merged = []
        for group in found:
            for tok in group.split():
                if tok not in merged:
                    merged.append(tok)
        tag = re.sub(r'\sclass="[^"]*"', '', tag)
        return re.sub(r'^<([a-zA-Z][\w-]*)', r'<\1 class="' + ' '.join(merged) + '"', tag)
    return re.sub(r'<[a-zA-Z][^>]*>', fix, t)


def retoken(t):
    for a, b in TOK:   t = t.replace(a, b)
    for a, b in FONTS: t = t.replace(a, b)
    return t

def grab(name):
    s = io.open(SRC % name, encoding='utf-8').read()
    css  = re.search(r'<style>([\s\S]*?)</style>', s).group(1)
    js   = re.search(r'<script>([\s\S]*?)</script>', s).group(1)
    body = s[s.index('<div class="wrap">'):s.index('<script>')]
    body = body[:body.rindex('</div>')]   # closes .wrap, which the shell replaces
    return css, js, body

# ⛔ THE ARTIFACT'S PAGE CHROME IS NOT PORTED. It has its own masthead, wrap and
# palette; here the site band, .shell and tokens.css do those jobs, so every one
# of these rules would ship as dead CSS. tools/audit.py reports them as unused,
# and the fix has to live HERE — stripping them by hand after each regeneration
# just means they come back on the next one.
DEAD = ['wrap', 'stamp', 'masthead-row', 'sub', 'blk', 'raildials', 's-tax']

def strip_local_tokens(css):
    """Drop the artifact's own :root palettes — tokens.css owns colour now."""
    css = re.sub(r':root\{[\s\S]*?\n\}\n', '', css, count=1)
    css = re.sub(r'@media \(prefers-color-scheme:dark\)\{[\s\S]*?\n  \}\n\}\n', '', css, count=1)
    css = re.sub(r':root\[data-theme="dark"\]\{[\s\S]*?\n\}\n', '', css, count=1)
    css = css.replace('*{box-sizing:border-box}\n', '')
    css = re.sub(r'body\{[^}]*\}\n', '', css)
    css = re.sub(r'h1,h2,h3,h4\{[^}]*\}\n', '', css)
    css = re.sub(r'header h1\{[^}]*\}\n', '', css)
    css = re.sub(r'header\{[^}]*\}\n', '', css)
    for d in DEAD:
        # ⚠️ no lookbehind: the rule is written `section.blk{…}`, and a
        # (?<![\w-]) guard sees the `n` of "section" and declines to match.
        css = re.sub(r'(?m)^[^\n]*\.%s(?![\w-])[^\n]*\n' % re.escape(d), '', css)
    # ⛔ no colour literal may reach css/site.css, and this site has no shadow
    # token — it does not need one: every panel here is a border on --ground-2.
    css = re.sub(r';?\s*box-shadow:[^;}]*', '', css)
    return retoken(css).strip()

HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s &mdash; The Ward</title>
<meta name="description" content="%(desc)s">
<!-- ⛔ NOINDEX, on the same grounds as /works itself: an unlisted URL sent to a
     person rather than published. The OG tags stay, because the whole use of an
     unlisted link is that somebody forwards it. -->
<meta name="robots" content="noindex, nofollow">
<meta property="og:type" content="article">
<meta property="og:site_name" content="The Ward">
<meta property="og:url" content="https://theward.online/works/%(slug)s/">
<meta property="og:title" content="%(ogtitle)s">
<meta property="og:description" content="%(desc)s">
<meta property="og:image" content="https://theward.online/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Ward's mark: a heavy ring open at the top, a faint street grid across its centre, and an amber light in the gap.">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">
<link rel="stylesheet" href="../../css/tokens.css">
<link rel="stylesheet" href="../../css/site.css">
<link rel="icon" href="../../assets/favicon.svg" type="image/svg+xml">

<!-- ⛔ THIS PAGE DECLARES NO CSS OF ITS OWN AND CARRIES NO PLACEMENT
     ATTRIBUTES: tools/audit.py fails on either, because all CSS lives in css/.
     The dials, the bar and the figures are a section of css/site.css scoped
     under .tool--%(slug)s, like every other component on this site.
     ── %(title)s ──────────────────────────────────────────────────────────
   ⭐ COLOUR COMES ENTIRELY FROM tokens.css. Nothing here names a hex value; the
   dials, the bar and the figures are drawn in the site's own palette, so the
   page changes with the ground the way every other page does.
   ⛔ --live IS DELIBERATELY ABSENT. Amber is reserved for what is actually
   running and delivery is not open yet — the same refusal the Cary room makes
   on the front page. Its jobs here are done by --sign, the routed brown.
   ⭐ THE COURIER SLICE IS --cary-rule, and that is not decoration: tokens.css
   records verdigris as the product's OWN authored courier colour, lifted from
   SocietyMasthead's Couriers stat. The bar paints a courier the colour the app
   paints a courier. */
     -->
</head>
<body>

<a class="skip" href="#main">Skip to content</a>

<header class="shell">
  <div class="band">
    <svg class="band-mark" viewBox="0 0 120 120" role="img" aria-label="The Ward">
      <defs><clipPath id="mark-clip"><circle cx="60" cy="60" r="40"/></clipPath></defs>
      <path d="M76.8 14 A 49 49 0 1 1 43.2 14" fill="none" stroke="currentColor" stroke-width="11"/>
      <g clip-path="url(#mark-clip)" stroke="currentColor" stroke-width="2.5" opacity="0.5">
        <path d="M38 8 V112 M82 8 V112 M8 38 H112 M8 82 H112"/>
      </g>
      <circle cx="60" cy="14" r="9.5" fill="var(--live)"/>
    </svg>
    <span class="band-text">
      <span class="band-name">The Ward</span>
      <span class="band-meta"><a href="../../">Digital presence for real neighborhoods</a></span>
    </span>
    <!-- ⭐⭐ THE TWO TOOLS FACE EACH OTHER, exactly as the two manuals do
         (Jacob, 2026-09-12: "buttons in the header that match the way we did the
         buttons for the guides"). `guide/index.html` and `handbook/index.html`
         each carry ONE filled `.band-cta` naming the other; these carry the same,
         because The Ask and The Split are two halves of one argument — what it
         costs to run, and where an order's money goes — and a reader holding one
         is exactly the reader who wants the other.
         ⛔ STILL NO TRAIL GUIDE LINK. The rule that /works is not in the network
         of manuals is untouched: this is a lateral move between two documents in
         the SAME set, not an advertisement for a different one. The colophon
         still does the reaching to /works, the guide and the terms. -->
    <span class="band-links">
      <a class="band-cta" href="../%(sibslug)s/">%(sibname)s</a>
    </span>
  </div>
</header>

<main class="shell" id="main">
'''

FOOT = '''
</main>

<footer class="shell">
  <div class="colophon">
    <div class="colophon-row">
      <span class="colophon-k">%(sibk)s</span>
      <span>%(sibtext)s <a href="../%(sibslug)s/">%(siblink)s &rarr;</a></span>
    </div>
    <div class="colophon-row">
      <span class="colophon-k">Works</span>
      <span>How a neighborhood is actually constructed &mdash; the sources, the pipeline, and the instruments that build a Ward. <a href="../">See the works &rarr;</a></span>
    </div>
    <div class="colophon-row">
      <span class="colophon-k">Legal</span>
      <span>What you may and may not rely on here, what belongs to whom, and what visiting or discussing The Ward does and does not establish. <a href="../../legal.html">Read the terms &rarr;</a></span>
    </div>
    <div class="colophon-foot">
      <span>&copy; 2026 <a href="https://jacobhenderson.studio">Jacob Henderson</a> LLC</span>
    </div>
  </div>
</footer>

<script src="../../js/site.js"></script>
<script src="../../js/%(slug)s.js"></script>
</body>
</html>
'''

# ══ THE SPLIT ════════════════════════════════════════════════════════════════
css, js, body = grab('the-split')
css = strip_local_tokens(css)
# the artifact's own masthead is replaced by the site band + a prospectus head
body = body[body.index('</header>')+len('</header>'):]
body = deinline(retoken(body))
body = body.replace('https://claude.ai/code/artifact/b01d3133-917f-4ead-b46a-460462d0e6b6', '../ask/')
js   = retoken(js).replace('https://claude.ai/code/artifact/b01d3133-917f-4ead-b46a-460462d0e6b6', '../ask/')

split_head = '''
  <section class="sec pro-head">
    <p class="pro-kicker">What a delivery order divides into</p>
    <h1>The Split</h1>
    <p class="lede">The customer carries the largest share; the business pays a small fee; the courier is paid first out of the service charge; and the Host and the Ward divide what is left.</p>
  </section>

  <section class="sec">
'''
page = (HEAD % dict(title='The Split', slug='split',
        sibslug='ask', sibname='The Ask',
        ogtitle='The Split &mdash; where a delivery order&rsquo;s money goes',
        desc='Every dollar of a delivery order, and who is owed it: the business, the courier, the Host, the Ward and the processor — against what the same order costs on DoorDash, Uber Eats and Grubhub.',
        css=css)
     + split_head + body + '\n  </section>\n'
     + FOOT % dict(slug='split', sibk='The Ask', sibslug='ask', siblink='Open the tool',
        sibtext='What it would cost to staff and run this properly, under each of the three shapes the money could take.'))
io.open(OUT % 'split', 'w', encoding='utf-8').write(page)
print('split  ->', len(page), 'bytes')

# ══ THE ASK ══════════════════════════════════════════════════════════════════
css, js, body = grab('the-ask')
css = strip_local_tokens(css)
# ⛔ THE TOPOLOGY CONTROL LIVES IN THE ARTIFACT'S OWN <header>, and stripping the
# header to make room for the site band took it with it — #topo, the flow
# diagram and the topo note. The script then threw on a null #topo and NOTHING
# below it ran: no roster, no reading, no chart, every figure an em dash.
# Carried over explicitly rather than left to a slice.
topo_block = body[body.index('<div class="modes" id="topo"'):body.index('</header>')]
body = body[body.index('</header>')+len('</header>'):]
body = deinline(retoken(body))
SPL = 'https://claude.ai/code/artifact/58b3e743-b13d-4860-8f5c-b4d6ebb08dca'
body = body.replace(SPL, '../split/')
js   = retoken(js).replace(SPL, '../split/')

ask_head = '''
  <section class="sec pro-head">
    <p class="pro-kicker">What it costs to build this properly</p>
    <h1>The Ask</h1>
    <p class="lede"><b>The neighborhood never pays</b> and participation stays free.</p>
  </section>

  <section class="sec">
'''
page = (HEAD % dict(title='The Ask', slug='ask',
        sibslug='split', sibname='The Split',
        ogtitle='The Ask &mdash; what it costs to build this properly',
        desc='A roster, a set of revenue assumptions, and the number that has to be raised — under a nonprofit, inside an institution, or on earned revenue alone.',
        css=css)
     + ask_head + deinline(retoken(topo_block)) + '\n  </section>\n\n  <section class="sec">\n' + body + '\n  </section>\n'
     + FOOT % dict(slug='ask', sibk='The Split', sibslug='split', siblink='Open the tool',
        sibtext='Where a single delivery order&rsquo;s money goes, and what the same order costs on the incumbents.'))
io.open(OUT % 'ask', 'w', encoding='utf-8').write(page)
print('ask    ->', len(page), 'bytes')


# ══ THE SITE'S OWN CONVENTIONS ═══════════════════════════════════════════════
# ⛔ Run from the repo root. Regenerates works/{split,ask}/index.html, js/*.js
# and the TOOLS block of css/site.css from the two artifacts, then re-applies
# everything tools/audit.py requires. Hand-patching the output after a run is
# how the dead rules and the literals kept coming back.
import re as _re
OUTDIR = "/Users/jacobhenderson/Desktop/dev.nosync/theward-online/"

for slug in ['split','ask']:
    f = OUTDIR + 'works/%s/index.html' % slug
    s_ = io.open(f, encoding='utf-8').read()
    s_ = s_.replace('<main class="shell" id="main">', '<main class="shell tool--%s" id="main">' % slug)
    # ⭐ tools/audit.py's own designed hook: one element may name the instance.
    for a in ['<li><b>Lafayette Square fully installed</b>', '<li><b>Senior SWE, St. Louis</b>',
              '<li><b>Nonprofit ED</b>', '<li><b>Market spread</b>',
              '<li>Live at <b>lafayette-square.com</b>']:
        s_ = s_.replace(a, a.replace('<li>', '<li data-names-instance>', 1))
    s_ = _re.sub(r'<li>(?=[^<]*St\. ?Louis)', '<li data-names-instance>', s_)
    io.open(f, 'w', encoding='utf-8').write(s_)

# the stylesheets and scripts
out_css = []
for name, slug in [('the-split','split'), ('the-ask','ask')]:
    css, js, body = grab(name)
    css = strip_local_tokens(css)
    scope = '.tool--' + slug
    lines = []
    for line in css.split('\n'):
        m = _re.match(r'^([^{@/\s][^{]*)\{', line)
        lines.append(','.join(scope + ' ' + x.strip() for x in m.group(1).split(',')) + '{' + line[m.end():] if m else line)
    css = '\n'.join(lines)
    js = retoken(js).replace('https://claude.ai/code/artifact/b01d3133-917f-4ead-b46a-460462d0e6b6', '../ask/') \
                    .replace('https://claude.ai/code/artifact/58b3e743-b13d-4860-8f5c-b4d6ebb08dca', '../split/')
    io.open(OUTDIR + 'js/%s.js' % slug, 'w', encoding='utf-8').write(
        "/* /works/%s — the instrument. Generated by tools/port-tools.py; edit the\n"
        "   artifact and re-run rather than editing here.\n"
        "   ⛔ NOT INLINE, and not a preference: tools/audit.py balances every page\n"
        "   as markup, and a script carrying '<div…>' strings is unparseable to it. */\n%s\n" % (slug, js))
    out_css.append("\n/* ═══ /works/%s — the instrument ═══════════════════════════════════════\n"
        "   Generated by tools/port-tools.py. Edit the artifact and re-run.\n"
        "   ⭐ SCOPED UNDER .tool--%s: these names (.note, .line, .rule, .legend,\n"
        "   .seg) are generic and site.css owns the unscoped ones.\n"
        "   ⛔ SCOPING ALONE IS NOT ENOUGH — an unscoped site rule still matches\n"
        "   inside a scoped subtree. The roster header was `.band`, this site's\n"
        "   MASTHEAD, and inherited its fill; renamed `.rband` in the artifact.\n"
        "   ⭐ COLOUR IS TOKENS ONLY. The courier slice is --cary-rule because\n"
        "   tokens.css records verdigris as the product's OWN authored courier\n"
        "   colour; where the artifact used amber it uses --sign, because --live is\n"
        "   reserved for what is actually running and delivery is not open. */\n%s\n" % (slug, slug, css))

UTIL = io.open(OUTDIR + 'tools/port-utilities.css', encoding='utf-8').read()
site = io.open(OUTDIR + 'css/site.css', encoding='utf-8').read()
site = site.split('/* TOOLS:BEGIN */')[0].rstrip()
io.open(OUTDIR + 'css/site.css', 'w', encoding='utf-8').write(
    site + '\n\n/* TOOLS:BEGIN */' + ''.join(out_css) + UTIL + '/* TOOLS:END */\n')
print('regenerated: 2 pages, 2 scripts, the TOOLS block')
