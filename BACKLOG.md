# Backlog

Open work on theward.online. **Resolved items leave this file** — they do not
move to a "done" section. Rules live in `README.md`; how the page links to the
product lives in `INTEGRATION.md`.

---

**LIVE at `https://theward.online`** — Pages from `main`, cert issued, `https_enforced`, `http`→`https`, apex + `www`. A push deploys; there is no CI.
▶ `curl -s -o /dev/null -w "%{http_code}\n" https://theward.online/`

## Blocked on the product

✅ **The day slider is visible again.** The diorama frame now stops short of the
bottom edge and the mark rides the strip that leaves — a track under the tree.
⛔ Still ONE control: the whole sky stays draggable, and a second visible slider
would be the second slider this page deliberately does not have. The `now` button
already appeared only when the day is held off live (`nowBtn.hidden = held ===
null`) — that behaviour was built and simply had nowhere visible to appear.

⭐ **The tree that deploys is `/baked/<look>/trees/…`, it is tracked, and staging
serves it today.** An earlier version of this line claimed the GLBs were missing
from the build and invented a size limit as the reason. Both were wrong:
`public/trees/` is the Arborist's authoring source pool and is gitignored on
purpose. ⛔ **Do not treat a 404 there as a defect** — it is the architecture.

**`?embed=sky` — ✅ IT WORKS. This entry was wrong.** The canvas sizes correctly
on the first real paint; the 300×150 is what a **throttled tab** looks like.
R3F v8 gates its setup on a `ResizeObserver` rect, and an observer cannot deliver
while the frame is not being painted. It self‑heals. ⛔ **And "creates a WebGL
context, throws no errors" was not evidence of anything** — `canvas.getContext()`
*creates* the context, so it can never report one missing. Measured and retracted
in the brief's §2, which is now worth reading for the traps rather than the claim.

The site's overlay was **reverted rather than left half‑built**, so the CSS band
still works here — that decision holds and is why nothing on the page is broken.

**The moon.** Stays the CSS one until the sky embed is *placed here* — which is
now a site-side job, not a wait. The product has a
real moon — a photographed surface with its terminator derived from the sun's
direction — and drawing a worse one beside it is the whole mistake this page
exists not to make.

---

## Ready to do

One loose end. ⚠️ Everything else that stood here on
2026-08-31 was already done, was cut, or pointed at copy that no longer exists —
see the note at the foot of this section.

⚠️ **Loose end on the QR** (shipped 2026-08-29, `assets/message.png`): its payload
carries `&body=` — the iOS separator; Android and RFC 5724 want `?body=` — and a
hard-coded "Hello". Jacob is rebuilding the generator in CodeDesk; the file swaps
at the same path with no markup change.
⛔ **Never a scannable *check-in* code.** Publishing one lets anyone anywhere earn
a townie's standing without visiting, which empties the only credential the
neighborhood has.

---

⛔ **WHAT LEFT THIS LIST, AND WHY — so it is not written back in.** Three of these
read as open work and none of it was. **This section had drifted from the page it
describes**, which is the failure the audit cannot catch and a reader cannot
either.

- **The badge emoji.** Chosen and shipped. The treatment was settled long before
  and the remaining question was taste, which is answered.
- **The `ward-perf` observer on jacobhenderson.studio.** Built and committed
  there — `js/site.js:494-508`, commit `3b14d5b`. It is the throttle: the framed
  Ward cannot see that it has been scrolled off a page it does not own, so the
  host watches and tells it, and it drops its frame rate.
- ⛔ **A PRIVACY PAGE. WRITTEN, THEN CUT — Jacob, 2026-08-31: "this page doesn't
  get a privacy statement."** It was built (`privacy.html`, eight sections,
  linked from the colophon) and reverted whole, and the reason is worth keeping
  because the draft looked good and was still wrong. **⛔ THE PRODUCT ALREADY HAS
  ONE** — `PrivacyPage` in `src/pages/LegalPage.jsx`, "Privacy & Safety", with
  Data Philosophy, Identity & Anonymity, Cary data handling, SMS and credentials.
  ⚠️ **So the page was restating the PRODUCT's behaviour on the SITE's domain**:
  everything load-bearing in it — the random identifier, location staying on the
  device, what you write being public — describes the thing in the frame, not
  this website, which collects nothing and needs about two sentences to say so.
  That is the **fourth-place-the-number-lives** failure this file already warns
  about under *the courier rate*, in different clothes, and it would have drifted
  from `LegalPage.jsx` the first time either moved.
  ⚠️ It also promised on behalf of **every** Ward, when a Host's installation is
  not ours to speak for — which `legal.html §1` explicitly disclaims.
  ▶ **Parked, not pursued:** a mission-style statement about earning standing by
  presence rather than by an account might belong somewhere on this page. Jacob
  is not sold, and it is a copy decision, not a legal one. ⛔ Do not reopen it as
  "write the privacy page".
- **`/host` as a standalone page.** ⛔ **Cut by Jacob, 2026-08-31, and the
  section is the argument:** it is a heading, ONE sentence, an email button and
  the QR. There is no "how to" to send — the background that makes the ask land
  is the rest of the scroll, so a cold send would be the ask with its argument
  removed. ⚠️ It also cut against a decision already recorded in the markup: the
  ask was moved out of mid-page to be the LAST thing, its own room. ⭐ What it
  needed instead was one attribute — `id="host"`, so the ask is linkable at
  `/#host` and can never drift out of sync with the page around it.
- **`?embed=masthead` under "There is no account."** ⚠️ **The embed is real and
  still unplaced — but its ANCHOR IS GONE.** That sentence is no longer on the
  page; the only "no account" left is a cell in the data-sources table. The four
  live counts (Townies · Residents · Guardians · Couriers) are still worth
  showing, and `SocietyMasthead` still renders them — but where is now an open
  question, not a placement. ⛔ Do not re-file this as "place the masthead" until
  there is copy for it to sit under.

⚠️ **One correction while checking:** the privacy entry used to warn that a legal
page here would be "a fourth place the courier rate lives". `legal.html` carries
no rate figure at all. The live 22 %-vs-25 % contradiction is real and is logged
below, but this page is not one of its homes.

---

## Needs a decision from Jacob

⛔ **`cary/legal/courier-agreement.md` IS STALE ON THE AGE GATES.** The site now
says *"Sixteen and over. Alcohol deliveries are 21+."* The agreement still
carries a third gate — **Drive 18+ (motor vehicle)** — which Jacob ruled was
written anticipating a **ride-share**, not delivery (2026-08-23). ⚠️ So the
document a courier signs and the page a courier reads now disagree. Nobody is
signing today, which is why this is logged rather than blocking — but it is a
legal document, and it should be the *agreement* that gets corrected, not the
page quietly matched to it.


**The courier rate.** The copy is written **without figures** because the
product says 22 % (cart math, the public legal page, and the Cary brief all
agree) and Jacob said 25 %. Whichever is right, it must move in all four places
at once, and the legal page is the canonical public statement.

⛔ **THE OVERHEAD CAPTURE NOW NAMES THE TOWN LEGIBLY, and that is a live rule
break.** This entry used to end *"illegible at the size it renders"* — that was
true, and **stacking the wayside blocks (2026-08-23) made it false.** Full-width
at 16:9 the title block reads clearly: `…TTE PARK · ST. LOUIS, MO`, and Park
Avenue and Mississippi Avenue are legible street labels besides.

⚠️ **`tools/audit.py`'s `names a town` check cannot see this** — it scans the
page's TEXT. An image is invisible to it, so this would have shipped silently and
the audit would have said `ok`.

▶ **Three ways, needs a ruling:** re-capture the overhead with the title block
off (the real fix, needs the product) · crop it out (the label sits near centre,
so this is unreliable) · or decide rule 7 does not apply to imagery, which is a
change to the rule and should be written as one.

**The season ramp.** Autumn leaves are genuinely unbuilt in the Arborist — the
backlog there says the fall pack is still unprocessed. Summer green works today.
⛔ **The copy claimed otherwise and has been fixed** — *"the leaves know what
season it is"* shipped in the trees panel while this very file recorded the
feature as unbuilt. **Two files, two rooms apart, disagreeing.** Removed in
`git show` below; kept here as the reason the audit should learn to catch it.

---

## Not yet started

**All copy is a first draft** and expected to be rewritten. The structure is the
part that has been argued through.

---

## ⛔ Standing rules, so they are not re-litigated

- ⛔ **An embed gets a SCROLL GUARD, never a gutter.** An iframe eats the mouse
  wheel, so a reader on their way down gets captured by the directory or the
  card. The first fix was two rails down the sides, on the theory that the outer
  thirds were dead space. **They are not** — the card's tabs run to the LEFT edge
  and the directory's chevrons to the RIGHT, so no margin is safe on both. The
  guard covers the whole frame, belongs to this document (so the wheel scrolls
  the page), and a click dismisses it. Leaving the frame re-arms it — ⭐ that
  half is load-bearing: dismiss-once-forever just defers the trap to the second
  pass down the page.
- ⛔ **NEVER put a guard over the hero.** That frame is WebGL and `src/index.css`
  carries the measurement: covering a live canvas makes Chrome drop the surface
  and restoring it costs seconds. The directory and card are DOM-only, which is
  the whole reason a cover is safe on those two and nowhere else.
- ⛔ **AND THE HERO GETS NO ARM GATE EITHER** (2026-08-31). The pill that held the
  frame at `pointer-events: none` until you clicked it was guarding a *product*
  behaviour from the wrong side of the line: a drag or a wheel promoting
  hero→browse under a framing the page had authored. ⭐ **Fixed in the Ward**, so
  every installation inherits it — a framed hero holds its shot and its
  OrbitControls are disabled. An embed must never fork the thing it embeds, and a
  gate here was exactly that.
  ⚠️ **The scroll half of the fear measured false**, and that is worth knowing
  before anyone re-adds a gate: `OrbitControls` was believed to set
  `touch-action: none` on the canvas and eat a phone swipe. Drei bundles
  `three-stdlib`'s, which does not — measured on the live frame, `touch-action` is
  at its initial value on every node and a wheel over the hero already chained to
  the host page. `INTEGRATION.md §3` has the detail.

- **Nothing is `loading="lazy"`.** It cost three separate debugging rounds — two
  embeds and an image, each reported broken when it was merely not loaded.
- **No captures where the product can be embedded.** The page's argument is that
  this is the real thing.
- **No time control besides the sky band.** The Almanac inside the product owns
  the day slider; the band drives it rather than competing with it.
- **Rules keep their numbers; statistics never appear.** You cannot describe the
  trust ladder without "three days". You can describe a neighborhood without
  counting its buildings.
- **The site names no town.** The audit checks it.
- ⛔ **THE TRAP, FOR THE NEXT DOMAIN: set the custom domain AFTER DNS resolves.**
  Pages was enabled while `CNAME` was already committed, so GitHub ran certificate
  verification against the registrar's parking IP, failed, and **did not retry** —
  which presents as an indefinite "cert pending" with nothing visibly wrong (DNS
  correct, no CAA, no stale AAAA). The fix is to make it look again: unset the
  custom domain, set it back. ⚠️ That round-trip rewrites `CNAME` on the remote as
  two commits, so expect to rebase before your next push.
- ⛔ **The page carries NO pricing figure, deliberately** (Jacob, 2026-08-23):
  *"we don't have a price or cost structure set up so it's question begging in
  the wrong direction."* The rewrite dropped the old "no licence per view, no
  meter" term and it is not to be restored as a placeholder. ⚠️ Distinct from
  **the courier rate** above, which is a live 22 %-vs-25 % contradiction.
- ⛔ **The page may not promise what the product does not do**, and the tell is
  that this file already says so. Two live cases: **wind** — the diorama does not
  sway, because wind is authored by the meteorologist and almost no directive
  carries one; and **season** — the autumn pack is unprocessed. ⭐ Both are
  *aspiration*, not rot: they are owed features, so the copy waits rather than
  the backlog being quietly corrected.
- ⛔ **`loading="lazy"` is now AUDITED, not just written down.** It was the
  README's loudest rule and it was broken anyway — the tree frame shipped lazy
  and the sky band sat black under programmatic scroll, indistinguishable from a
  broken embed. That is the fourth round this rule has cost. A rule stated only in
  prose is a rule that comes back.
- ⛔ **Deleting an element means grepping its class name.** Removing the tree left
  its declarations behind with no selector, and CSS **fails open** — no error, no
  console, just a silently mis-parsed cascade that dropped the whole
  `.skyband-sun, .skyband-moon` rule and blew the moon's maria up to the size of
  the band. Dead CSS is dead code. `git show 442bc8a` has the measurement.
