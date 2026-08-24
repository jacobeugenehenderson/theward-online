# Backlog

Open work on theward.online. **Resolved items leave this file** — they do not
move to a "done" section. Rules live in `README.md`; how the page links to the
product lives in `INTEGRATION.md`.

---

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

**The badges are settled; what is left is which emoji.** They are one authored
master — cream field, deep rim, a halo on the glyph — so every emoji reads and
any emoji can be swapped in. ⛔ **Do not re-derive the ground from the emoji.**
That was tried and it guarantees the worst case: a blue bicycle got a blue ground
and 16% of its ink cleared 3:1. Measured across a neutral sweep from black to
white, **no single flat value serves them all** — mid-tones take the worst glyph
to ~0% legible ink, white kills 🔑 and ☕, black kills 🚲. The halo is what
removed the variable instead of tuning around it.

⭐ Size and centring are generated per glyph from its measured ink, so a new
emoji is corrected by its own geometry rather than by a hand fudge.

⛔ **An outline on the glyph was built and cut — it read as a sticker.** Only a
whisper of drop-shadow remains, for relief rather than legibility. ⚠️ **So
checking a new emoji is a STEP now, not a guarantee:** a glyph with no dark
contour of its own has nothing to read against a pale field — 🥚 ☁️ 🦢 clear 3:1
on 0–1% of their ink. ⚠️ And do not rank candidates by that number: 🔑 scores 6%
and looks perfectly clear, because its 6% is a continuous outline. It answers
"is there a contour at all", nothing finer.

**⚠️ An audit gap found while wiring the courier's rim:** `site.css` referenced
`--vig-rim-accent` before `tokens.css` declared it, and **the audit passed.** It
checks for tokens declared-but-unused, and for classes used-but-undefined — but
not for a **token used but never declared**, which silently drops the whole
declaration to its initial value. One more regex in `tools/audit.py`, and it is
the same shape as the `undefined css` check already there.

**Open:** 🚲 is still the least characterful of the five and 📦 / 🛵 were the
better-measuring candidates — but that is now purely a choice of emoji, not of
treatment, and it is Jacob's. No colour-blind simulation has been run.

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

**The QR that reaches Jacob**, replacing the hatched placeholder — now in the ask section at the foot of the page, not in `/host`.
⛔ Never a scannable *check‑in* code: publishing one lets anyone anywhere earn a
townie's standing without visiting, which empties the only credential the
neighborhood has.

**Privacy and terms pages.** Absent. Note that the product's own are hard‑wired
in `LegalPage.jsx` and state the courier fee schedule — so this page would be a
*fourth* place that number lives.

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

**Copy the rewrite did not cover, KEPT rather than cut.** Absence from a draft is
not an instruction to delete, so these stayed and are Jacob's to remove: the
**"What it costs"** term (*no licence per view, no meter, no key anyone can
revoke* — the page's only statement on pricing), **"Stewardship, not
ownership"**, the **place-card tablet** and its copy, and the courier CTA
**"Tell me when couriers open"** with its *not open yet* note.


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

**Deployment.** The site is **pushed but not served.** `origin` is
`git@github.com:jacobeugenehenderson/theward-online.git` and `main` is in sync
(`cd16429`, 2026-08-23); `CNAME` is in place; GitHub Pages from `main`, same as
the studio. No CI exists yet. ⚠ What is missing is the Pages source being turned
on and DNS — `curl -s -o /dev/null -w "%{http_code}" https://theward.online/`
returns **000**, and it is the only check worth trusting here: a green push says
nothing about whether anyone can read the page. This entry said "has never been
deployed" through the session that added the remote and pushed it.

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
