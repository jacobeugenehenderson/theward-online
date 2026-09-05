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
| *(built, unplaced)* | `?embed=tree&species=<id>` | sky and one specimen in ONE Canvas, lit together. ⛔ **Always pin the species** — see below |
| *(built, unplaced)* | `?embed=almanac` | the Almanac panel, DOM only. Posts `ward-size`, listens for `ward-cue` |
| *(built, unplaced)* | `?embed=sky` | the celestial layer alone |

⛔ **THE DIORAMA AND THE ALMANAC CAME OFF THE PAGE ON 2026-09-05** (Jacob: *"get
rid of the diorama, time slider, light/dark maker, everything. The section is now
just about the slab, and what it does"*). §03 describes the Slab rather than
demonstrating it, and a section that describes needs no instrument. **Both routes
still work and are supported** — they are unplaced, not retired, and everything
recorded about them below is the record of getting them right. ⚠️ The page's whole
clock went with them: no `ward-time`, no sky table, no `data-theme` stamped from
the sun over the installation. The reader's own `prefers-color-scheme` decides
this page's ground now, and `ward-layer`'s `ground` is read from that.

⛔ **The diorama is OPAQUE, not alpha, and the band draws no sky of its own.**
Flat discs placed in CSS percentages cannot share a projection with a perspective
render — the screenshot that settled it had the moon inside the canopy.

⭐ **AND THAT IS WHY `?embed=almanac` EXISTS (2026-09-04).** The known consequence
recorded here used to be *"the opaque frame covers `.skyband-mark`, so the day
slider is currently invisible though still draggable"* — an invisible control the
site had built for itself because the product's own one lived inside the panel.
Mounting the panel's Almanac alone retires the whole problem: the diorama is now
a figure with its whole frame back, and the control underneath it is the Ward's.
⛔ **Nothing was forked to do it.** `AlmanacTab` was already self-contained —
stores in, no props — so this was a route, exactly like `?embed=society`.

⛔⛔ **PIN THE SPECIES, OR YOU GET WHOEVER IS ON THE BENCH.** Bare `?embed=tree`
does not fall through to `DEFAULT_SPECIES`: `TreeDiorama` resolves
`readParam('species') || species || pick?.species || DEFAULT_SPECIES`, and `pick`
is **the Meteorologist's canary** — whatever specimen an operator last parked that
tool on. Measured 2026-09-04, this site was framing
`maple_sugar/skeleton-1-lod1.glb` at 39,633 tris, which is what *"the tree is
sparse"* turned out to be. `linden_american` is 86,499 tris and is now named in
the URL. ⚠️ **Do not pin `lod` with it.** lod0 exists on disk but is excluded from
the R2 upload (353MB the runtime cannot request), so asking for it 404s, throws
inside `Suspense`, and takes the sky down with the tree. lod1 IS the hero LOD the
map draws.

⛔ **Never describe the diorama as swaying.** Wind is authored by the
meteorologist and almost no directive carries a `wind` block, so `uWindIntensity`
sits at 0. It is owed, not shipped.

`?layer=` and every `?embed=` are **framed‑only**: a direct visit falls through
to the app, so nobody is ever shown half a product.

---

## 2. The message contract

Six message types, all posted to the product's origin, all framed‑only.
**The product's handlers are the authority** — read them in `src/App.jsx`
before changing anything here.

```js
{ type: 'ward-layer', layer: null|'slab'|'player', ground: 'paper'|'plate' }
{ type: 'ward-time',  minute: 0..1439 | null }      // null = the neighborhood's own
{ type: 'ward-perf',  presence: 'active'|'idle' }
{ type: 'ward-place', id: '<listing id>' }          // out of society, in to card
{ type: 'ward-size',  height: <px> }                // out of almanac only
{ type: 'ward-cue' }                                // in to almanac, ONCE
```

**`ward-layer`** switches which payload the hero shows. ⛔ Switch **by message,
never by changing `src`** — a reload rebuilds the WebGL context and resets the
camera, and three layers become three unrelated pictures instead of one stack
having its ground taken away. `ground` exists because the product cannot see
this page's day/night across a cross‑origin frame, so it is told.

⚠️ `paper` / `plate` are the product's wire protocol. They are retired words in
this site's own vocabulary; **do not "correct" them.**

⚠️ **`ward-time`, `ward-size` and `ward-cue` ARE NOT IN USE BY THIS SITE as of
2026-09-05** — it frames the hero, the directory and the card, and keeps no clock
of its own. Everything below is the working contract for the next page that wants
one, and every warning in it was paid for.

**`ward-time`** is bidirectional, and **the page was a relay between THREE
frames** that cannot see each other: the hero, the diorama and the Almanac. The
Almanac's strip posts a minute out; the page adopts it, repaints its own ground,
and **posts it straight back out to the others**. Both sides compare before
acting, so adopt → announce → adopt cannot loop. **Outbound posts are coalesced
to one per animation frame** — a drag fires `pointermove` ~60×/s and each post
re-times the product's whole scene; sending them raw froze the renderer.

⛔ **THE RE-POST IS THE LOAD-BEARING HALF, AND LEAVING IT OUT SHIPPED ONCE.** The
inbound handler adopted the minute and repainted the page, and the DIORAMA STAYED
AT MIDNIGHT while the Almanac beside it read two in the afternoon. Adopt, *then*
announce.

⛔⛔ **AND NEVER BACK TO THE FRAME IT CAME FROM — THIS IS WHY THE SLIDER FOUGHT
THE POINTER.** The first cut posted to every frame including the Almanac, on the
theory that its own guard (`|getMinuteOfDay() − m.minute| < 1`) makes an echo of
its own value a no-op. **It does at rest and it does not during a drag**: by the
time the echo lands a frame later the pointer has moved on, the two values differ
by more than a minute, and the Almanac dutifully `setTime`s itself BACK. Then it
announces that, the page adopts it, and the two argue at 60Hz — the handle
stutters, lags the cursor and will not stay where it is dropped. The host relays
with the source excluded; a page-initiated post (`now`, the keyboard range) still
reaches everything, because there the Almanac is the one that has to be told.

**`ward-size`** is the Almanac saying how tall it is. Only that embed sends it, so
**the host must key on `e.source`** — `ward-time` arrives from three frames and a
height from the wrong one is nonsense. It exists because the Almanac's header row
scales its own type to fit and its hi/lo labels come and go with the forecast, so
any height the host hardcodes is wrong at some width.

⛔⛔ **A SELF-MEASURING EMBED LOCKS AT ITS FIRST READING UNLESS YOU BREAK THE
LOOP, AND THIS IS THE GENERAL TRAP.** The host applies the height, the frame
becomes that tall, the component's `h-full` now resolves against the *frame*, its
inner `overflow-y-auto` swallows anything that no longer fits, and the box
reports the same number for ever. It never grows, so the ResizeObserver never
fires again. Measured: the first reading was taken before the forecast added the
hi/lo row, the frame was set 18px short, and the temperature sat clipped off the
bottom edge permanently. **Two things fix it together, and one alone does not:**
`.embed-almanac` is absolutely positioned with `bottom: auto`, so its height is
its CONTENT's rather than its frame's; and the observer reads `scrollHeight`,
with a `MutationObserver` beside it because a subtree that grows inside a clamped
box is invisible to a ResizeObserver.

**`ward-cue`** goes the other way, exactly once. The host can see when the
Almanac has been scrolled to and the framed document cannot, so it says so and
the handle nudges three times. The embed drops the cue on the first pointer or
key that touches it. ⛔ Never `infinite`: an ambient pulse stops meaning *pull me*
within seconds and starts meaning *this page moves*.

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

**⭐ THE ALMANAC, MOUNTED ALONE** (2026-09-04) — `src/components/AlmanacEmbed.jsx`,
plus `AlmanacTab` promoted to a named export and the `?embed=almanac` route. The
component needed nothing: it reads the clock and the sky from stores and takes no
props, so this was a route, not a refactor — the same claim `?embed=society`
makes, tested a second time and true again.

⚠️ **WHAT A DOM-ONLY EMBED HAS TO SUPPLY FOR ITSELF, and this is the general
lesson.** `TimeTicker` and `SkyStateTicker` are `useFrame`; they only exist inside
an R3F root. With no Canvas:
- **the clock** is fine — `AlmanacTab` already runs its own 1s `returnToLive()`
  pump while live.
- **the sun is not.** `sunElevation` is pushed from `CelestialBodies`, which is in
  the scene. Without it the store keeps its `0.5` default forever, `isNight` never
  turns true, and the Almanac shows **a sun icon at midnight** — on a page whose
  whole argument is that you can move through the day. `SunElevationDriver` pushes
  the same `SunCalc.getPosition().altitude` the scene reads, keyed to the clock.
- **the weather** needs `WeatherPoller`, which is DOM-only and drops straight in.
  `temperatureF` and `currentWeatherCode` are written directly by
  `setWeatherTargets`, not interpolated, so they arrive without a ticker.

**⭐ `data-tod` AND `data-almanac` ARE SEAMS, NOT DECORATION** — `DawnTimeline.jsx`
and `SidePanel.jsx`. An embedding page cannot reach across a frame with CSS, so
`.embed-almanac [data-tod="handle"]` in `index.css` is how a marketing embed makes
the grab target loud enough for a first-time visitor without a second slider and
without forking this one. Two structural selectors beat Tailwind's one, so the
strip keeps ONE look everywhere it actually ships. ⛔ Rename either attribute and
the embed goes quiet with no error.

**Named exports** — `src/components/SidePanel.jsx` now exports
`LafayettePagesTab`, `SocietyMasthead` and `AlmanacTab`. ⭐ Nothing else was needed: the panel's
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
- `.embed-almanac [data-tod="track"|"handle"]` enlarges the day strip's grab
  target and gives it a real `grab` cursor; `[data-cue]` adds the one-time nudge.
  ⛔ **Colour is deliberately untouched** — the handle's fill and border are
  INLINE (green at rest, blue while dragging), so overriding them would cost an
  `!important` and would fork the one signal the control already gives
- `.embed-almanac [data-almanac="head"]` trims the header's gutters under 400px.
  That row is three children at `justify-between` with no wrap; in the app the
  Almanac is the panel's width, but framed on a phone inside a figure with its own
  gutters the frame comes in around 290px and the temperature ran off the edge

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

One block on this page is built from the product's own source, so it cannot
drift:

- **the sources table** ← `src/cartograph/SourcesPanel.jsx`'s `GROUPS`

⛔ **THERE WERE TWO.** `tools/build-sky.mjs` extracted
`src/cartograph/skyGrid.js`'s `ANCHOR_CARDS_PROCEDURAL` — four seasons ×
twenty-four hours × five bands of authored hex — so this page's sky could never
be a designer's guess at the map's. Exactly one thing read it, the diorama band's
gradient, and that band came off the page on 2026-09-05. The generator and
`data/sky.json` were **deleted rather than left running against nothing**, which
is the same rule the audit enforces everywhere else. ⭐ To restore:
`git show HEAD:tools/build-sky.mjs`, put the `SKY:BEGIN`/`SKY:END` markers back
in `index.html`, and add it to the array in `tools/build.mjs` — that array is the
line that makes it run.

`node tools/build.mjs` runs the generators and stamps the assets; `tools/audit.py`
runs it in `--check` mode. An unclassified source **breaks the build** rather than
silently publishing something unverified or silently dropping something real.

Point the generator elsewhere with `WARD_SOURCES_PANEL`.

---

## 5. Which build it points at

⛔⛔ **THE PRODUCT SHIPS FIRST, ALWAYS — for any embed this page adds.**
`?embed=` is framed-only and **falls THROUGH** on a build that does not know the
route: the app renders whole, inside whatever small frame the page gave it. No
error, nothing blank, and nothing that reads as a missing feature — it reads as a
bug in the page. Gate every new embed before shipping the page that frames it:

```
git -C ../../lafayette-square.nosync show origin/main:src/App.jsx \
  | grep -c "embed === '<name>'"
```

`0` means production cannot do it yet and the site must not go out ahead of it.
⚠️ Not currently binding — this page frames only routes that have shipped.

`js/site.js` → `EMBED_URL`. It points at **staging**, because `?layer=` is on
the product's trunk and **not on `main`**. Check before flipping:

```
git -C ../../lafayette-square.nosync show origin/main:src/App.jsx | grep -c 'layer=slab'
```

`0` means production still cannot do this. One line changes it.
