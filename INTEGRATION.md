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
| the directory | `?embed=society&place=<id>` | the Society Pages panel, from the search bar down |
| the card | `?embed=card&place=<id>` | one place card, mounted alone |
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

**`ward-perf`** is the throttle. An `IntersectionObserver` on the hero reports
when the Ward crosses half visibility; the product drops to about a third of its
frame rate while out of view. ⛔ **Idle is not paused** — going idle is what makes
a browser drop the WebGL surface. Capability and reasoning: `ls/FEATURES.md
§Embedded`.

---

## 3. What had to change in the product

Every item is committed in the lafayette‑square repo. This list exists so the
next person can see the cost of the embedding surface in one place.

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
