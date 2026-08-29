# theward.online

The marketing site for **The Ward** — a reusable kit for building a digital
presence for real neighborhoods. Static
HTML, CSS and a little JavaScript. No framework, no build step for the site
itself; one generator, for one block.

```
serve   python3 -m http.server 8791 --bind 127.0.0.1
open    http://127.0.0.1:8791
build   node tools/build.mjs        # every generator, then stamp the assets
audit   python3 tools/audit.py      # runs the build in --check mode
```

⛔ **NOTHING ON THIS PAGE IS `loading="lazy"`, AND THAT IS A RULE.** It cost
three separate debugging rounds: two embeds and an image, each reported as
broken when it was simply not loaded. Lazy starts its clock when an element
*enters view*, and programmatic scrolling does not reliably trip it — an image
sitting at `top: 90px` stayed unloaded indefinitely and fetched instantly the
moment the attribute came off.

The page is short and its assets are few. The only heavy thing is the hero
frame, which is not lazy either because it is the first thing anyone sees.
**If you add `loading="lazy"` here, you are choosing a bug over a byte.**

⛔ **`tools/audit.py` now enforces this, and that is the fourth round talking.**
The rule was the loudest sentence in this file and the tree frame shipped lazy
anyway. A rule stated only in prose is a rule that comes back.

⚠⚠ **CACHING LIES AT TWO LEVELS, AND IT COST THIS PROJECT TWO SESSIONS.**
`build.mjs` stamps `?v=<mtime>` on every local css/js link — but the browser
also caches **index.html**, so it keeps serving the OLD stamps and the new files
are never requested. When testing a change, load `http://127.0.0.1:8791/?cb=N`
with a fresh N, or hard-reload. Before believing any symptom, check that what
RAN is what is on disk:

```js
const fresh = await fetch('/js/site.js?x=' + Date.now()).then(r => r.text())
const ran = performance.getEntriesByType('resource').find(e => e.name.includes('site.js'))
ran.decodedBodySize === fresh.length   // false ⇒ you are debugging a ghost
```

⚠ **The stamp itself is not housekeeping.** A browser will happily keep running a script it fetched ten
edits ago, and every symptom then looks like a bug in code that is already
correct. A whole session was lost to exactly that here: the page was executing
16,015 bytes while the server served 14,871, and two "fixes" were made to code
that had never run. Never debug this site without checking that what ran is
what is on disk.

Deploys from `main` to GitHub Pages, custom domain in `CNAME`.

---

**Companion docs.** `INTEGRATION.md` — how this page links to the product, and
every change it required on the product side. `BACKLOG.md` — what is open, and
the standing rules that should not be re-litigated.

## 1. What the site argues

One claim. Copy or components that do not serve it should be cut rather than
kept.

> **A reusable kit for building a digital presence for real neighborhoods.**
> The Ward gives a neighborhood a place of its own online — the people, places,
> businesses, events, exchanges and local knowledge that already make it a
> community, made easier to see and use. Not another social network; the one
> that is already there, strengthened. Two audiences read the same page at
> different depths: a visitor who wants to look, and a host who wants one.

⚠️ **THE CLAIM CHANGED ON 2026-08-23 and the change is the point.** It used to
read *"A neighborhood, documented with care and handed back to the people in
it."* That described **one installation**. The page now sells **the kit** — which
is what the product actually is (`CLAUDE.md` Layer 0: *"We are building a KIT
that pours neighborhoods"*), and what a reader arriving cold needs to hear first.
⛔ The old claim is not wrong, it is *downstream*: it is what a Ward is once it
exists. Copy that argues for one lovingly-made neighborhood still belongs on the
page; copy that implies there is only one does not.

**One spine, descending in register.** A visitor reads the top and stops; a host
keeps going. There is no audience switcher — the page changes weight instead,
from a panel you read standing at an overlook to a drawing filed in an archive.
Never add a "for developers" or "for partners" tab; the depth is the answer.

**The Ward is self-branded and does not change.** This site is the environment
it drops into. The relationship is a wayside panel and the view behind it: the
panel is designed around the view and never competes with it.

---

## 2. Files

```
index.html          the whole site
css/tokens.css      every colour, size, family and duration
css/site.css        everything else, in numbered sections
js/site.js          the clock, the layer switch, nothing else
tools/build-sources.mjs   the sources block, generated from the product
tools/build-sky.mjs       the sky strip, generated from the product
tools/build-vignettes.mjs the badges' glyph geometry (NOT from the product)
tools/audit.py      conformance — run before committing
data/sources.json   generated; the same data the block is built from
data/vignette-glyphs.json    MEASURED; each badge emoji and its ink geometry
```

---

## 3. Rules

Enforced by `tools/audit.py`, which fails rather than warns.

1. **No colour, size, family or duration outside `css/tokens.css`.** If you are
   about to type a hex code into `site.css`, add a token.
2. **No inline `style` attributes, no `<style>` blocks.** All CSS in `css/`.
3. **No `!important`** outside the reduced-motion reset.
4. **Both grounds, always.** Day and night are declared for all three viewer
   states: the bare `:root`, the guarded `prefers-color-scheme` block, and the
   `[data-theme]` stamp. Night is not day inverted — the browns *lift*.
5. **Amber is reserved.** `--live` appears only where something is actually
   live. The mark's dot is the definition of the rule, not an exception to it:
   a light in a gateway means *you are here, and this place is running*.
6. **Rules keep their numbers; statistics never appear.** You cannot describe
   the trust ladder without "three days". You can describe a neighborhood
   without counting its buildings. A rule is durable; a count is stale the day
   it is typed.
7. **The site names no town.** The sources are named hard — a source you cannot
   go and get is treacle — but no neighborhood, city or state appears. The
   audit checks this.
8. **Placeholders are labelled and obvious.** Never a plausible-looking fake.

---

## 4. The sources block is generated

`tools/build-sources.mjs` **reads the product's own Sources panel**
(`src/cartograph/SourcesPanel.jsx` in the lafayette-square repo) and writes the
block between the `SOURCES:BEGIN` / `SOURCES:END` markers in `index.html`. It
never restates that data, so it cannot drift.

Everything about the public block is a rule applied to the panel's data:

- a source marked `unverified` never ships
- a row whose action is `owed` never ships
- the panel's `steps` never ship — they are operator register
- **every (row :: source) pair must be classified in the generator, and an
  unknown one throws.** A new row in the panel breaks this build rather than
  silently publishing something unverified or silently dropping something real.
- a public note may not name a place this site does not name; it fails and asks
  for an override.

`node tools/build-sources.mjs --check` fails if the block in `index.html` is
stale. The audit runs it.

**`tools/build-sky.mjs` is the same pattern for the sky.** It lifts
`ANCHOR_CARDS_PROCEDURAL` out of the product's `skyGrid.js` — four season
anchors × twenty-four hours × four bands of authored hex — so the strip is the
same table the map is lit by, not a designer's guess at it. It validates every
hex and fails if the sky model changes shape.

⛔ **`tools/build-vignettes.mjs` IS NOT ONE OF THESE, AND USED TO BE.** It read
the product's `vignettePresets.js` and derived each participant badge's ground
from its own emoji's colours. That was demoted deliberately, and the reason is
worth keeping: **deriving the ground from the emoji guarantees the worst case.**
A blue bicycle got a blue ground, and 16% of its ink cleared 3:1 against it.

⭐ Swept across a neutral ground from black to white, **no single flat value
serves every emoji** — mid-tones take the worst glyph to ~0% legible ink, white
kills 🔑 and ☕, black kills 🚲. So the badge does what a merit badge does: **one
authored master field and a deep rim**, in the page's own cream.

⛔ **An outline on the glyph was built and cut.** It gave a guaranteed 16.5:1
edge and it read as a sticker. Only a whisper of drop-shadow remains, for relief
rather than legibility.

⚠️ **What that costs, recorded rather than discovered later:** a glyph with no
dark contour of its own has nothing to read against a pale field — 🥚 ☁️ 🦢 clear
3:1 on **0–1%** of their ink here. The five in use are fine. **Checking a new
emoji is now a step, not a guarantee.**

⚠️ **And a caution about the number itself:** *share of ink clearing 3:1* is a
poor proxy where a thin dark contour carries the whole read. 🔑 scores **6%** on
this field and looks perfectly clear, because that 6% is a continuous outline.
Trust it for "is there any contour at all" — not as a ranking.

The generator still exists because two things remain **measurements**, not
choices: the emoji as a token (so no copy of it lives in the markup), and a
per-role **scale and nudge** — a flex box centres the line box, not the glyph,
and 🚲's ink is 0.48 of its box where 🌳's is 0.70. ⛔ A role with no measured ink
throws.

⚠️ **So the product-generated blocks are the sources table and the sky strip,
those two only.** Do not re-add the badges to that claim.

⭐ **There is no time control on this page, deliberately, and there are two
reasons.** First: a three-button strip and then a horizon disc both had to be
explained; a band of sky does not. Second: **the Almanac inside the product
already owns the day slider, and two sliders that do not drive each other is
worse than one.** If the page should ever move with the hour, the right shape is
the product posting its time outward and this page following — one slider, two
surfaces. ⛔ Never a second slider here.

⚠ Consequence, recorded rather than hidden: the page follows the neighborhood's
clock even for a viewer whose system asks for light. Contrast holds in both
grounds, so this is a preference override rather than a legibility failure — but
it is an override, and if it ever needs an escape hatch, the product-posts-time
route above is the one that earns it.

Point it elsewhere with `WARD_SOURCES_PANEL=/path/to/SourcesPanel.jsx`.

---

## 5. The embed

The hero frame is **the running product**, not a picture. Its own address is
the API: no parameter is the composite, `?layer=slab` is the ground with no
commons over it, `?layer=player` the commons with no ground under it.

Three things are load-bearing, all of them paid for elsewhere:

- **Switch by message, never by changing `src`.** Changing the frame's source
  rebuilds the product's WebGL context and resets its camera, and then the
  layers are three unrelated pictures instead of one stack having its ground
  taken away.
- **The message contract is the product's, and it is exact.** `App.jsx` ignores
  anything whose `type` is not `ward-layer`. It also takes `ground`
  (`'paper'` / `'plate'`), because it cannot see this page's day/night across a
  cross-origin frame — so `applyClock()` re-posts. Those two words are the
  product's wire protocol; do not "correct" them to this site's vocabulary.
  `postMessage` wants an **origin**, never a URL with a path.
- **Never hide a live canvas.** `display:none`, `visibility`, `opacity:0`, even
  a fully opaque cover, all make Chrome drop the WebGL surface, and restoring
  it lands as one blocked frame of many seconds. Leave it rendering.

### The page's half of the frame budget

An `IntersectionObserver` on the hero frame posts
`{ type: 'ward-perf', presence: 'idle' | 'active' }` as the Ward crosses half
visibility. **The Ward does the throttling** — this page only reports what it
can see, because a framed document cannot observe its own position in ours.
The capability and the reasoning live in the product, at
`ls/FEATURES.md §Embedded`; do not reimplement the behaviour here.

⛔ Never send anything that would pause it. Idle is a lower frame rate, not a
stop — a stopped canvas is dropped by the browser and costs seconds to restore.

**The Ward does not self-size**, deliberately: self-sizing is for apps whose
height is their content. This is a landscape you look *across*, so the frame
keeps a fixed aspect — 16:10, and 4:3 on a phone so the horizon survives.

### ⚠ Which build it points at

`js/site.js` → `EMBED_URL`. It points at the **staging** build, because
`?layer=` is on the product's trunk but **not on production**. Check before
flipping:

```
git -C ../../lafayette-square.nosync show origin/main:src/App.jsx | grep -c 'layer=slab'
```

`0` means production still cannot do this and the site must keep pointing at
staging. Flip `EMBED_URL` when that returns non-zero — one line, the only one.

---

## 6. ⚠ The courier route

`js/site.js` → `COURIER_INTAKE`.

- `'interest'` — a note of interest. Touches no backend. **This is today.**
- `'live'` — routes into courier onboarding.

**Do not flip to `'live'` until the courier backend close-out has landed.** An
applicant submits a phone number, government identity documents, a background
check, a licence, insurance and a payout account. Until that work is done those
land in a backend with known, written-down holes, and the section on this site
exists to describe the model — not to collect anyone's papers.

The section and the button are built and finished. Only the destination is a
decision, and it is one line.

---

## 7. State

| Piece | State |
|---|---|
| The band, the mark, the palette, the type | settled |
| The scroll — eight sections | built |
| Copy | **provisional**, all of it, and expected to be rewritten |
| The sources block | generated, current, audit-checked |
| The embed | loads the real product; **layer switch confirmed end-to-end** — Both / Place / People all switch in place, and the return is instant |
| The courier section | built; destination is `interest`. **Cary has its own room** — an inset panel with its own ground and a verdigris rule, marked with the courier badge from the ladder. ⭐ The hue is the product's own: `SocietyMasthead`'s Couriers stat. ⚠ NOT `--live` — amber is for what is running, and couriers are not open. Its four rules moved from two paragraphs into `.terms` (same words) |
| The directory | **`?embed=society` — the product's own panel, mounted alone, and it paints.** Real accordion, real counts, real scrolling. ⚠ It boots in ~5s, so it is blank on arrival and fills in — that is what looked like a failure. ⛔ **The cause is boot time, not `loading="lazy"`.** This row named lazy as the reason until 2026-08-23, by which point nothing on the page was lazy and §1's rule was audited — a corrected rule left a stale explanation behind it, which is the more expensive half to leave lying around |
| Every building opens | its own claim again, with a labelled gap awaiting an overhead of the neighborhood. It is NOT the directory's claim and the two were briefly collapsed |
| The place card | **`?embed=card&place=<id>` — the card itself, running, in a drawn tablet.** Confirmed: photo, logo, rating, tabs, and no close button. **To swap the place: change `data-place` in index.html and nothing else** — and that is true again; `js/site.js` had grown a constant that quietly took over, leaving the attribute dead while two docs told you to edit it (restored 2026-08-23). It now seeds BOTH frames; the ids come from the directory above it |
| The joint | a 3px rule in the reserved colour under the band. The seam vanished at night when band and sky were both near-black; the rule says *below this line, everything is live* |
| The sky band | a short divider between what the Ward holds and what is living in it, carrying the neighborhood's own authored sky (`tools/build-sky.mjs`). It reports; it does not ask |
| The ask | **its own section, and the page's last word.** It sat mid-page inside §host with two sections after it, and the address was stranded again in the footer. One home now, at the end. The footer carries sources + `© 2026 Jacob Henderson LLC` The QR is **live as of 2026-08-29** — `sms:` to the installation's number, so it opens the reader's own messages app and reaches a person, never a check-in (§8). ⭐ **It is also a link**, so a desktop click does the same thing the camera does: macOS Messages declares the `sms` scheme, and where nothing claims it the click is simply inert. Its `href` carries no `body` even though the encoded image does — `&body=` is the iOS separator, and a handler reading it as part of the recipient would address a message to nothing. ⚠️ **This section is NOT printable** (Jacob, 2026-08-29); an earlier code comment said it was, and the code is sized and contrasted for a screen someone is holding a second phone up to |
| `/host` as a standalone page | **not built.** Section 07 is in the scroll only; sales happens in fragments and it should also be a page you can send cold |
| Privacy / terms pages | **not built** |
| The five participant badges | **settled.** One authored master — cream field, deep rim, halo on the glyph — so every emoji reads and any emoji can be swapped in. ☕ 🏡 🛡️ 🔑 🚲 — the guardian is a shield, which is the only one of them that is itself a heraldic device, and so the only one already in the register the badge is borrowing. They are the ladder's step markers, replacing the numbers 1–4; the courier is not a rung and wears its badge in the Cary room. Size and centring are generated from each glyph's measured ink |
| Favicon | **built** — `assets/favicon.svg`. The mark's 16 px cousin: thick ring, bright notch, and the band mark's street grid dropped because it turns to mud below ~20 px. Token colours, theme-aware. ⚠ SVG only — Safari shows nothing rather than something wrong |

**Open, needing Jacob:**

- The courier fee schedule is stated in three places in the product; this page
  would be a fourth. The copy is written **without figures** until the rate is
  ruled on.
- The wayside figures are geometric placeholders. They are honest — they are
  drawings, not fake renders — but they are the weakest thing on the page. The
  right answer is to **capture them from the product**: the Look is authored
  across a whole day and the Meteorologist scrubs weather live, so the sky
  figure and the neon figure can be stills of the actual installation. That is
  a capture pass, not an illustration commission.

---

## 7b. The legal page

`legal.html` — the website's terms, linked from the footer. It is the SITE, not a
document parked beside it: same band, same stamped stylesheets, same tokens, and it
is covered by the same audit.

⛔ **`tools/audit.py` reads every `*.html` at the root, not `index.html`.** It read
only the front page until 2026-08-29, so the day a second page arrived every rule
went quiet on it at once — no lazy-loading check, no inline-style check, no
missing-asset check, and every class it used scored as UNUSED CSS. The page list is
the filesystem now, so the next page is covered on the day it lands.
⚠️ Two checks are **per page**, deliberately: id uniqueness and anchor resolution are
properties of a DOCUMENT, and checking the concatenation reported `#main` and the
mark's `#mark-clip` as duplicates the moment a second page existed.

⭐ **The "names a town" rule is SCOPED, not switched off.** That rule exists because
the page sells the kit and naming one town collapses it into one instance — an
argument about the PITCH. A governing-law clause is not the pitch; a court sits
somewhere. So `legal.html` may use the two strings a forum-selection clause needs
and nothing more, and every other town name still fails everywhere.

## 7c. The link preview

`assets/og.png` — what a forwarded text, Slack paste or DM shows. It is the BAND
MARK at 1200×630 on the masthead band's ground — ring, street grid and notch.

⭐ **The band mark, not the favicon.** §301 records that the favicon drops the street
grid because it "turns to mud below about 20 px". A preview card is 1200 px wide, so
the grid survives easily — and it is the half of the mark that says this is about
STREETS. Using the tab icon here would ship a 16 px compromise into a frame that
never needed it.

⛔ **It cannot be the SVG, and that is the whole reason this file exists.** The mark
is `assets/favicon.svg`, which is right for a tab — theme-aware, one file. But every
preview scraper (iMessage, Signal, Slack, WhatsApp) fetches `og:image` and
**rasterises nothing**, so an SVG there shows a blank card — worse than no card,
because the link reads as broken rather than plain.
⛔ **And the URL must be ABSOLUTE.** A scraper is not a browser and does not resolve
a relative path against the page.

⭐ **Generated, not drawn:** `python3 tools/build-og.py` renders it from the
favicon's own path data, so the card cannot drift away from the tab icon. The script
PINS that geometry — if the mark's path changes it refuses to run rather than
quietly emitting the previous ring under a new favicon. `--check` verifies the file.
Both are wired into `tools/audit.py` (`link preview`, `preview image`).

⚠️ The card takes the band's dark values in both themes. A preview is baked at build
time and the reader's theme is unknowable, so it looks like the top of the page.

## 8. ⚠ A QR on this site cannot be a working check-in

A check-in code is meaningful because you have to be standing in front of it.
Publishing a scannable one lets anyone anywhere earn a townie's standing without
ever visiting, which empties the only credential the neighborhood has.

So a QR here may only ever be **an illustration of the physical object** — the
card a place puts in its window — and it must resolve to an explainer, never to
a check-in route. Shown that way it does real work: it makes an abstract trust
ladder into a thing you have seen.
