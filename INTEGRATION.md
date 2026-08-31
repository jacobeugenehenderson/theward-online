# How this site links to the product

Everything on this page that shows the Ward **is the Ward** — running, in a
frame — not a screenshot of it. That is the site's whole argument, so this doc
records what it took to make true, and every change it required on the product
side.

> **The governing rule.** The site observes and asks; the **product decides and
> renders**. Where a behaviour could live on either side, it goes in the Ward —
> because a Ward is a universal player and every installation should inherit it,
> not just this page. ⛔ **An embed must never fork the thing it embeds.**

---

## 1. What is embedded

| on the page | mode | what it is |
|---|---|---|
| the hero | *(no param)* / `?layer=slab` / `?layer=player` | the whole map, and either half alone |
| the directory | `?embed=society&place=<id>` | the Society Pages panel, from the search bar down — **posts `ward-place`** |
| the card | `?embed=card&place=<id>` | one place card, mounted alone — **follows `ward-place`** |
| *(built, unplaced)* | `?embed=masthead` | the four role counts |
| the diorama | `?embed=tree` | sky and one specimen in ONE Canvas, lit together |
| *(built, unplaced)* | `?embed=sky` | the celestial layer alone |

⛔ **The diorama is OPAQUE, not alpha, and the band draws no sky of its own.**
Flat discs placed in CSS percentages cannot share a projection with a perspective
render — the screenshot that settled it had the moon inside the canopy. ⚠️ **Known
consequence, on Jacob's list:** the opaque frame covers `.skyband-mark`, so the
day slider is currently invisible though still draggable.

⛔ **Never describe the diorama as swaying.** Wind is authored by the
meteorologist and almost no directive carries a `wind` block, so `uWindIntensity`
sits at 0. It is owed, not shipped.

`?layer=` and every `?embed=` are **framed‑only**: a direct visit falls through
to the app, so nobody is ever shown half a product.

---

## 2. The message contract

Three message types, all posted to the product's origin, all framed‑only.
**The product's handlers are the authority** — read them in `src/App.jsx`
before changing anything here.

```js
{ type: 'ward-layer', layer: null|'slab'|'player', ground: 'paper'|'plate' }
{ type: 'ward-time',  minute: 0..1439 | null }      // null = the neighborhood's own
{ type: 'ward-perf',  presence: 'active'|'idle' }
{ type: 'ward-place', id: '<listing id>' }          // out of society, in to card
```

**`ward-layer`** switches which payload the hero shows. ⛔ Switch **by message,
never by changing `src`** — a reload rebuilds the WebGL context and resets the
camera, and three layers become three unrelated pictures instead of one stack
having its ground taken away. `ground` exists because the product cannot see
this page's day/night across a cross‑origin frame, so it is told.

⚠️ `paper` / `plate` are the product's wire protocol. They are retired words in
this site's own vocabulary; **do not "correct" them.**

**`ward-time`** is bidirectional. Dragging the sky band posts it in; the
Almanac's own slider inside the product posts it back out. Both sides compare
before acting, so adopt → announce → adopt cannot loop. **Outbound posts are
coalesced to one per animation frame** — a drag fires `pointermove` ~60×/s and
each post re‑times the product's whole scene; sending them raw froze the
renderer.

**`ward-place`** is what makes the directory and the card agree: pick a place in
`?embed=society` and the `?embed=card` frame beside it turns to that place. The
two frames are cross-origin and cannot see each other, so **this page is a relay,
not a decider** — the product posts what was picked and the product renders it.

⛔ **The echo guard here is STRUCTURAL, not a comparison.** The society embed only
ever *speaks* and the card embed only ever *listens*, so adopt → announce → adopt
has no cycle to run around. (`ward-time` needs a value comparison because there
both sides genuinely own the same store.)

⛔ **POST, NEVER RE-SRC** — the same rule the hero's layer switch is built on.

⭐ **And on the product side the card is KEYED to the id.** `PlaceCard` is
stateful — open tab, photo index, edit context — and swapping `listing` under a
reused instance renders an **empty card**; that was measured, not guessed. Keying
remounts the *card*, which is cheap DOM, while the *frame* stays put. The rule was
never "never remount"; it is "never reload the frame."

⚠️ **`data-place` on the card frame is the single source for BOTH frames' starting
id.** It had become dead markup — `js/site.js` had grown its own constant and the
attribute this doc and index.html both told you to edit was read by nothing.
Restored 2026-08-23.

**`ward-perf`** is the throttle. An `IntersectionObserver` on the hero reports
when the Ward crosses half visibility; the product drops to about a third of its
frame rate while out of view. ⛔ **Idle is not paused** — going idle is what makes
a browser drop the WebGL surface. Capability and reasoning: `ls/FEATURES.md
§Embedded`.

---

## 3. What had to change in the product

Every item is committed in the lafayette‑square repo. This list exists so the
next person can see the cost of the embedding surface in one place.

**⛔ A FRAMED HERO HOLDS ITS SHOT** (2026-08-31) — `src/components/Scene.jsx`.
`?shot=` already said a framing is something an embedding page *authors*, and a
drag or a wheel promoting hero→browse underneath it meant the operator's framing
was silently not what was on screen. `onMove` and `onWheel` now promote only when
unframed; the double-tap into street was already gated on `viewMode === 'browse'`,
so it cannot fire from a held hero.

**And the other half:** `CameraRig` passes `enabled={false}` to the
`OrbitControls` while a framed shot is held, so a drag cannot move the camera
either. `update()` is unaffected — the hero keyframe path drives target and
position directly and calls it itself.

⚠️ **A GUESS THAT MEASURED FALSE, KEPT HERE SO IT IS NOT RE-DERIVED.** This
change first also wrote `touch-action: pan-y` onto the canvas, reasoning that
`OrbitControls` sets `touchAction: 'none'` in its constructor — which
`three/examples/jsm/controls/OrbitControls` line 36 really does, and which would
have meant a phone reader's vertical swipe was swallowed before any handler ran.
⛔ **That is not the class drei mounts.** It bundles `three-stdlib`'s, which never
touches the style. A walk of the live canvas's ancestor chain in a framed hero
found `touch-action` at its initial value on every node, and a wheel over the
frame chained to the host page *with the controls still enabled*. There was
nothing to undo, so the write came out rather than staying in as a no-op with a
false reason attached.

⭐ **This is what let the site DELETE its arm gate.** `index.html` carried a
"Click to browse" pill holding the frame at `pointer-events: none` — a guard for
two product behaviours, built on the wrong side of the line. Jacob, 2026-08-31:
*"a touch on the screen won't pan the camera to browse."* ⛔ Do not restore it:
it is a fork of the thing being embedded, and the fix is upstream.
⚠️ **The two scroll guards are NOT affected** — the directory and the card are
DOM embeds that really do eat the wheel. The hero was always the special case.

**⛔ THE PLACE CARD'S HERO PHOTO SCROLLS** (2026-08-31) — `PlaceCard.jsx`. It sat
*outside* the scroll container as a fixed 112px band: fine on a desktop card,
indefensible in a 4:3 frame on a phone, where it was half the card and never
moved. It is now the first child of the scroller. ⚠️ **The close button did not
come with it** — it was positioned against the hero, so it would have scrolled
the only way out of the card off the top. It is now a direct child of the dialog
and deliberately its **FIRST** child, because `.embed-card > [role="dialog"] >
:last-child` in `index.css` hides the claim bar and would have hidden it.
⭐ Not a small-screen fork: a photo that scrolls with its content is right on a
desktop card too, and a media query here would be two cards to reason about.

**New routes** — `src/App.jsx`, `parseRoute()` and the embed branch
`?embed=society | masthead | card | sky`, plus `&place=`. Chrome‑only: no
Scene, no controls, no ticker. `?embed=sky` is the exception — it mounts a
Canvas.

⚠️ **A Canvas embed can look broken and not be.** `?embed=sky` was reported here
as not sizing for a day; it sizes on the first real paint. R3F gates its setup on
a `ResizeObserver`, which cannot deliver in a throttled tab, so an embed inspected
in a background tab shows a 300×150 canvas and an **empty `style.width`**.
⛔ Do not check this with `canvas.getContext()` — that call *creates* the context
and can never report one missing. Read `style.width`: empty means `setSize` never
ran.

**Named exports** — `src/components/SidePanel.jsx` now exports
`LafayettePagesTab` and `SocietyMasthead`. ⭐ Nothing else was needed: the panel's
parts already read the content layer from stores and take no props but layout
hints, so mounting one alone was a **route, not a refactor**. `isBrowse` already
hid the masthead, which is why "from the search bar down" needed no new flag.

**`src/components/SkyEmbed.jsx`** — the celestial layer with nothing else:
`CelestialBodies`, `CloudDome`, `WeatherEffects`, the two tickers,
`AtmosphereDirectiveDriver`. `TimeTicker` and `SkyStateTicker` were exported
from `Scene.jsx` rather than reimplemented.

**⛔⛔ `memo()` ON ANY EMBED THAT MOUNTS A CANVAS — this is a rule, not a fix.**
`App` re-renders on every store tick. A bare `<Canvas>` under it re-renders too,
R3F re-runs `root.render()` under a fresh context Bridge, and **the entire scene
subtree is torn down and rebuilt before React can commit an effect.** Measured in
the tree embed at 472×420: a `useMemo([scene])` recomputing **~46×/second on a
dep that never changed**, `scene.uuid` identical throughout, and the measure
effect committing **zero** times. Geometry rebuilt every frame; the camera never
posed. Fix is one line — `export default memo(TreeDiorama)` (`ec4547c1`).

⚠️ **`SkyEmbed` has the same exposure and looks fine**, because it has no effect
to lose — it is remounting its scene every frame regardless. Know that before
profiling anything framed.

⭐ **What made it findable was a sentence, not a probe: *"it was there but then it
disappeared."*** That distinguishes NEVER-MOUNTED from MOUNTED-THEN-REMOVED, and
only the second points at a remount. An hour went into ground, shadows, camera fit
and the atlas first — all innocent. **When a framed symptom is intermittent, ask
whether it never appeared or appeared and left, before touching code.**

**`src/lib/framedPresence.js`** — where the throttle's state lives, and why it
lives in the Ward rather than here.

**CSS neutralisations** — `src/index.css`:
- `.embed-card > [role="dialog"]` makes a modal card fill its frame
- `.embed-card [aria-label="Close"]` and `.embed-card > [role=dialog] > :last-child`
  hide the close button and the claim bar — **flows an embed cannot finish, and a
  dead control is worse than no control**
- `.embed-society .overflow-y-auto > div:first-child` makes the directory's
  search sticky, because framed alone the list *is* the surface

⭐ All of these are **two structural selectors against Tailwind's one**, so they
win on specificity with no `!important` and the component keeps one layout
everywhere it actually ships.

**`SheetGround`** in `src/components/Scene.jsx` — while the `player` sheet is
up, the scene paints nothing but that sheet's own colour, so the sheet reads
solid without ever being opaque. The two numbers are a **pair**: raising
`.embed-sheet`'s opacity to 1 breaks the switch, removing `SheetGround` brings
the smudge back.

---

## 4. Generated, never restated

Two blocks on this page are built from the product's own source, so they cannot
drift:

- **the sources table** ← `src/cartograph/SourcesPanel.jsx`'s `GROUPS`
- **the sky's colours** ← `src/cartograph/skyGrid.js`'s `ANCHOR_CARDS_PROCEDURAL`

`node tools/build.mjs` runs both and stamps the assets; `tools/audit.py` runs it
in `--check` mode. An unclassified source **breaks the build** rather than
silently publishing something unverified or silently dropping something real.

Point the generators elsewhere with `WARD_SOURCES_PANEL` / `WARD_SKY_GRID`.

---

## 5. Which build it points at

`js/site.js` → `EMBED_URL`. It points at **staging**, because `?layer=` is on
the product's trunk and **not on `main`**. Check before flipping:

```
git -C ../../lafayette-square.nosync show origin/main:src/App.jsx | grep -c 'layer=slab'
```

`0` means production still cannot do this. One line changes it.
