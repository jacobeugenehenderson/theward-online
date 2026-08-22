# theward.online

The marketing site for **The Ward** — a living model of a neighborhood. Static
HTML, CSS and a little JavaScript. No framework, no build step for the site
itself; one generator, for one block.

```
serve   python3 -m http.server 8791 --bind 127.0.0.1
open    http://127.0.0.1:8791
audit   python3 tools/audit.py
build   node tools/build-sources.mjs
```

Deploys from `main` to GitHub Pages, custom domain in `CNAME`.

---

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
tools/audit.py      conformance — run before committing
data/sources.json   generated; the same data the block is built from
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
| The embed | loads the real product from staging; layer switch wired to the product's contract, **not yet confirmed end-to-end in a browser** |
| The courier section | built; destination is `interest` |
| `/host` as a standalone page | **not built.** Section 07 is in the scroll only; sales happens in fragments and it should also be a page you can send cold |
| Privacy / terms pages | **not built** |
| Favicon | **not built.** The mark's 16 px cousin — a thick ring with a bright notch — is the intended asset |

**Open, needing Jacob:**

- The courier fee schedule is stated in three places in the product; this page
  would be a fourth. The copy is written **without figures** until the rate is
  ruled on.
- The wayside figures are geometric placeholders. They are honest — they are
  drawings, not fake renders — but they are the weakest thing on the page.
