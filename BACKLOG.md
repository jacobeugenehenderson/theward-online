# Backlog

Open work on theward.online. **Resolved items leave this file** — they do not
move to a "done" section. Rules live in `README.md`; how the page links to the
product lives in `INTEGRATION.md`.

---

## Blocked on the product

**The day slider is invisible.** The diorama frame is opaque and covers
`.skyband-mark`, so the band no longer shows where you are in the day — it is
still draggable, but nothing says so, which is the exact affordance problem the
mark was added to solve in the first place. Jacob has it on his list.

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

**The vignette treatments are picked per role and could still be better.**
Measured across all 5×8 on 2026-08-23 — emoji-vs-ground contrast ranged **1.7 to
14.0** — and set at `townie:v1 · resident:v3 · guardian:v7 · keyholder:v2 ·
courier:v6`, worst cell **5.6**.

⛔ **The rule that was learned the hard way: one preset across all five makes the
set read uniform.** The eight are per-*emoji* treatments. ⛔ **And legibility
alone is NOT a sufficient rule either** — the per-cell maximum picks `v7` four
times out of five, which reproduces the uniformity. **Variety is the second
axis**, and the current set trades ~1 point of contrast for five distinct
treatments.

⭐ Licence from Jacob: *"I don't care about sticking close to the color brief;
the map itself and all the insets are very colorful."* The muted ground governs
the page, not these objects — which also **reopens 🕯️ for Guardian**, rejected
earlier only on the reserved-amber rule.

**Still open:** designing a **ninth preset** aimed at this job is in scope and
untried; ☕ at `v1` is the palest badge and may want a warmer emoji or its own
treatment; and the four green/warm roles have not been tested against a
colour-blind simulation.

▶ Re-run the comparison any time: the 5×8 grid and the contrast scoring are a
~30-line snippet against the product's own `emojiColor` + `vignettePresets` —
see `git show` on this commit for it.

**`?embed=masthead` under "There is no account."** Built on the product side and
unplaced here. The four live counts — Townies · Residents · Guardians · Couriers
— are proof the roles are a working system rather than four paragraphs. ⭐ And
couriers reading **0** is honest in a way worth keeping, not hiding.

**The observer half of the throttle on jacobhenderson.studio.** That site frames
the same build, so the Ward already answers `ward-perf`; it needs about fifteen
lines of `IntersectionObserver` and no product work at all. Copy from
`js/site.js`.

**`/host` as a standalone page.** Section 07 exists only inside the scroll. Sales
happens in fragments — this is the page you send cold.

**The QR that reaches Jacob**, replacing the hatched placeholder in `/host`.
⛔ Never a scannable *check‑in* code: publishing one lets anyone anywhere earn a
townie's standing without visiting, which empties the only credential the
neighborhood has.

**Privacy and terms pages.** Absent. Note that the product's own are hard‑wired
in `LegalPage.jsx` and state the courier fee schedule — so this page would be a
*fourth* place that number lives.

**A favicon.** The mark's 16 px cousin — a thick ring with a bright notch — is
the intended asset. The gate mark stops reading as a gate below about 20 px.

---

## Needs a decision from Jacob

**The courier rate.** The copy is written **without figures** because the
product says 22 % (cart math, the public legal page, and the Cary brief all
agree) and Jacob said 25 %. Whichever is right, it must move in all four places
at once, and the legal page is the canonical public statement.

**Whether the overhead capture keeps its title block.** The image names the city
and state in small type. Illegible at the size it renders, but it is the one
place this page names the town.

**The season ramp.** Autumn leaves are genuinely unbuilt in the Arborist — the
backlog there says the fall pack is still unprocessed. Summer green works today.
⛔ **The copy claimed otherwise and has been fixed** — *"the leaves know what
season it is"* shipped in the trees panel while this very file recorded the
feature as unbuilt. **Two files, two rooms apart, disagreeing.** Removed in
`git show` below; kept here as the reason the audit should learn to catch it.

---

## Not yet started

**Deployment.** The site has never been deployed. `CNAME` is in place;
GitHub Pages from `main`, same as the studio. No CI exists yet.

**All copy is a first draft** and expected to be rewritten. The structure is the
part that has been argued through.

---

## ⛔ Standing rules, so they are not re-litigated

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
- ⛔ **The page may not promise what the product does not do**, and the tell is
  that this file already says so. Two live cases: **wind** — the diorama does not
  sway, because wind is authored by the meteorologist and almost no directive
  carries one; and **season** — the autumn pack is unprocessed. ⭐ Both are
  *aspiration*, not rot: they are owed features, so the copy waits rather than
  the backlog being quietly corrected.
- ⛔ **Deleting an element means grepping its class name.** Removing the tree left
  its declarations behind with no selector, and CSS **fails open** — no error, no
  console, just a silently mis-parsed cascade that dropped the whole
  `.skyband-sun, .skyband-moon` rule and blew the moon's maria up to the size of
  the band. Dead CSS is dead code. `git show 442bc8a` has the measurement.
