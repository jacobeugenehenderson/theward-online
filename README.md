# theward.online

The marketing site for **The Ward** — a living model of a neighborhood. Static
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

> **A neighborhood, documented with care and handed back to the people in it.**
> The ground comes from public record; the meaning comes from the people. Two
> audiences read the same page at different depths — a visitor who wants to
> look, and a host who wants one.

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
tools/build-vignettes.mjs the five participant vignettes, ditto
tools/audit.py      conformance — run before committing
data/sources.json   generated; the same data the block is built from
data/vignette-palettes.json  MEASURED; the emoji colours the vignettes are built from
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

**`tools/build-vignettes.mjs` is the same pattern for the five participant
types.** The Ward gives every person an emoji on a vignette whose colours are
pulled *out of that emoji*; this block puts Townie, Resident, Guardian,
Keyholder and Courier on the page wearing the same treatment, so the roles are
shown in the product's own visual language rather than in swatches invented
here. It imports the product's `vignettePresets.js` at every build, so a retuned
preset lands here too.

⚠ **One thing is held still, and it says so.** `extractEmojiColors` renders the
emoji to a canvas and reads the pixels back, and node has no canvas — so the
palettes are a **capture**, in `data/vignette-palettes.json`, which records what
browser and platform measured them and how to re-measure. ⛔ **A role with no
captured palette throws**, so a sixth type breaks the build rather than shipping
a guessed colour.

⭐ The colours land in `tokens.css` and nowhere else — rule 1 forbids a literal
in `site.css`, so `.role-vig--*` is `var()` all the way down and a stale token
block shows as a *flat* circle rather than a *wrong* one.

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
| The courier section | built; destination is `interest` |
| The directory | **`?embed=society` — the product's own panel, mounted alone, and it paints.** Real accordion, real counts, real scrolling. ⚠ It boots in ~5s and the frame is `loading="lazy"`, so it is blank on arrival and fills in — that is what looked like a failure |
| Every building opens | its own claim again, with a labelled gap awaiting an overhead of the neighborhood. It is NOT the directory's claim and the two were briefly collapsed |
| The place card | **`?embed=card&place=<id>` — the card itself, running, in a drawn tablet.** Confirmed: photo, logo, rating, tabs, and no close button. **To swap the place: change `data-place` in index.html and nothing else**; the ids come from the directory above it |
| The joint | a 3px rule in the reserved colour under the band. The seam vanished at night when band and sky were both near-black; the rule says *below this line, everything is live* |
| The sky band | a short divider between what the Ward holds and what is living in it, carrying the neighborhood's own authored sky (`tools/build-sky.mjs`). It reports; it does not ask |
| `/host` as a standalone page | **not built.** Section 07 is in the scroll only; sales happens in fragments and it should also be a page you can send cold |
| Privacy / terms pages | **not built** |
| The five participant vignettes | generated from the product's own avatar treatment; audit-checked. Emoji ☕ 🏡 🌳 🔑 🚲, preset `v3` (the neon ring — the washed-out presets buried the emoji). **They are the ladder's step markers**, replacing the numbers 1–4; the courier is not a rung and wears its badge in the aside instead. ⛔ 🕯️ was the strongest Guardian candidate on meaning and was **rejected because gold is the reserved `--live` colour** (rule 5). ⚠ The courier badge is the weakest of the five and the reason is mechanical, not aesthetic: 🚲's three captured clusters are 214°/193°/240°, **all blue**, and `v3` builds its base from the dark cluster — so a blue bike sits on a navy ground. Every other role's palette spans more than one hue family. Fix is a warmer courier emoji, not a preset change |
| Favicon | **not built.** The mark's 16 px cousin — a thick ring with a bright notch — is the intended asset |

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
- Whether a QR belongs on the page, and what it may point at. See §8.

---

## 8. ⚠ A QR on this site cannot be a working check-in

A check-in code is meaningful because you have to be standing in front of it.
Publishing a scannable one lets anyone anywhere earn a townie's standing without
ever visiting, which empties the only credential the neighborhood has.

So a QR here may only ever be **an illustration of the physical object** — the
card a place puts in its window — and it must resolve to an explainer, never to
a check-in route. Shown that way it does real work: it makes an abstract trust
ladder into a thing you have seen.
