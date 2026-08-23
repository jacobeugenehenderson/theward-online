# Backlog

Open work on theward.online. **Resolved items leave this file** — they do not
move to a "done" section. Rules live in `README.md`; how the page links to the
product lives in `INTEGRATION.md`.

---

## Blocked on the product

**The diorama's tree.** The figure area is already shaped for it and the pill
already says *The trees*. **One blocker, and it is not the site's:** `?embed=`
with a Canvas does not size (see below). Full brief:
`BRIEF-tree-and-sky-embed.md` in the lafayette‑square repo.

⭐ **The tree that deploys is `/baked/<look>/trees/…`, it is tracked, and staging
serves it today.** An earlier version of this line claimed the GLBs were missing
from the build and invented a size limit as the reason. Both were wrong:
`public/trees/` is the Arborist's authoring source pool and is gitignored on
purpose. ⛔ **Do not treat a 404 there as a defect** — it is the architecture.

**`?embed=sky`.** Mounts, creates a WebGL context, throws no errors, every
ancestor measures correctly — and the canvas sits at R3F's default 300×150. The
site's overlay was **reverted rather than left half‑built**, so the CSS band
still works here. What is already ruled out is in the brief; do not re‑test it.

**The moon.** Stays the CSS one until the sky embed lands. The product has a
real moon — a photographed surface with its terminator derived from the sun's
direction — and drawing a worse one beside it is the whole mistake this page
exists not to make.

---

## Ready to do

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
