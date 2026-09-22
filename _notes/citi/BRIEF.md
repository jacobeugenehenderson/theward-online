> **BUILT — 2026-09-22.** The page is `works/citi/index.html`, and
> the decisions that turned out to be load-bearing are written into its own
> comments, where the next person edits. This file is kept as the record of what
> was decided before it was drawn; `SOURCES.md` is the one that stays live,
> because every Citi claim on the page still has to trace to a line in it.
> ⚠ Two things below were overruled during the build: the phase step now reads
> "Prove it travels" rather than naming a second neighborhood (there are already
> several under way), and the correspondence figure's first node is Spring by
> Citi rather than Consumer Collections — the floating sublabel collided with
> the rank label, and folding it into the box was better than moving it.

# /works/citi/ — build brief

**One claim, and the page exists to make it survive a skeptical reader at a
bank:** The Ward's commerce layer is being built to fit infrastructure Citi has
already published, and the remaining distance between the two is a list of
answerable questions rather than a pitch.

**Posture.** Not a partnership announcement. Not a proposal. A **specification
of an interface** between one system that exists and one that is being built,
written so that either party could read it and find nothing to correct. Every
Citi statement is Citi's own, linked. Everything else is ours, and is marked as
proposed. ⛔ Read `SOURCES.md` beside this file before writing a single
sentence about Citi; it records what is quotable, what is trade press, and three
claims from the original sketch that do not survive checking.

**Audience.** Two readers, both arriving by forwarded link. A Citi Services
person who wants to know what would have to be true technically, and a Citi
Impact person who wants to know what the thing is for. The page does not switch
voice between them; it puts the technical argument first and lets the second
reader keep going, the same descending register the front page uses.

---

## 0 · Shell, gates, conventions

Copy the head of `works/split/index.html` and change the strings. Specifically:

- **`<meta name="robots" content="noindex, nofollow">`** — same grounds as the
  rest of `/works`: an unlisted URL sent to a person. ⭐ **OG tags stay**, for
  the same reason they stay everywhere else: the use of an unlisted link is that
  somebody forwards it, and the card a text message renders is exactly the thing
  that has to be right. `og:image` absolute, `assets/og.png`, never the SVG.
- **No `loading="lazy"`, anywhere.** `tools/audit.py` fails on it.
- **No `style=` attributes, no `<style>` block, no `!important`, no literal
  colours or sizes.** All CSS lives in `css/`, scoped under a page class —
  `main.shell.tool--citi`, exactly as The Split scopes `.tool--split`.
- **Both themes.** Anything new must be written for day and night; the audit
  diffs the two blocks.
- **Unused CSS fails the build.** Do not stage classes ahead of markup.
- ⛔ **The town rule applies here** — this page is *not* in `TOWN_EXEMPT_PAGES`.
  Any sentence naming Lafayette Square must sit on an element carrying
  `data-names-instance`, or be written without the name.
- **Run `node tools/build.mjs`** after the markup exists, or the asset stamps are
  stale and the audit fails. Then `python3 tools/audit.py`.

**Header band.** Same as The Split's, with one filled `.band-cta`. The Split is
the right neighbour: this page is about who moves the money and that one is
about where it goes. `<a class="band-cta" href="../split/">The Split</a>`

**Colophon.** Four rows — The Split, The Ask, Works, Legal — following the
pattern already in `works/split/index.html`.

**Page footer disclaimer** (inside `main`, the `<footer>` idiom The Split uses,
and it is load-bearing):

> Citi, Spring by Citi and the Citi Impact Fund are Citigroup's, and every Citi
> statement on this page is quoted from Citi's own published material and linked
> to it. The Ward has no relationship with Citigroup, has made no approach, and
> claims none. Everything described here as ours is proposed and not yet built.
> Not legal, tax, or financial advice.

⛔ **No Citi logo, wordmark or arc.** Citi is set in the page's own type.

---

## 1 · Layer one — the case

`.pro-head` block, then a short `.copy`, then the figure. This layer should be
readable in under a minute and should be the whole argument in miniature.

```
.pro-kicker   An interface, described from our side
h1            Built toward Citi
.lede         The Ward is independent infrastructure for real neighborhoods.
              As its commerce layer is built, it is being built to fit what
              Citi has already published.
```

Body, three paragraphs, no more:

> The reason is practical rather than aspirational. A neighborhood delivery
> order needs someone to take the customer's payment, hold it apart until the
> order is done, pay the business, pay the courier, and reconcile all of it.
> Citi's e-commerce business names five of those six on one page: consumer
> collections, virtual accounts that segregate funds, merchant payouts, gig
> economy pay outs, and reconciliation and reporting.
>
> We are not proposing that architecture. We are pointing at it.
>
> What The Ward supplies is the part a processor does not: the place, the
> neighborhood's own network of businesses and couriers, and the operating
> system that decides what an order means before any money moves.

Then the figure, immediately. **It is the strongest thing on the page and it
should arrive before the reader has been asked to believe anything.**

### 1a · The correspondence figure

Reuse `figure.diagram > .dia-box > svg`, exactly as `works/index.html` does at
line 396 — same drafting-sheet treatment, and read that file's production notes
before drawing, because the ruled-ground geometry was solved there the hard way
and should not be re-solved:

- `viewBox="-20 -20 680 340"`, whole-cell dimensions, 20-unit grid pattern
  drawn at the **cell centre** (`M10 0 V20 M0 10 H20`), pattern origin pinned to
  the viewBox origin, so the sheet's edge is exact on all four sides and needs
  no border drawn around it.
- `.dia-k` for the two rank labels, `.dia-t` for node names, `.dia-s` for
  anything written on a connector. Colour from tokens only —
  `var(--ground-2)` fills, `var(--sign-soft)` for Citi's rank, the structural
  rule for ours. ⛔ **No `--live`.** Amber is for what is running; none of this
  is running. The Split makes the same refusal and for the same reason.
- ⭐ **The courier node takes `--cary-rule`**, the verdigris the product itself
  paints a courier with. The Split already does this; the two pages should
  agree.
- Mobile: `.dia-box` scrolls, the caption sits outside it.

**Structure — two ranks and four ties.** Citi's rank on top, because the
argument is that we are answering something that already exists; ours beneath.

```
CITI PUBLISHES
 Consumer Collections   Virtual accounts,      Merchant            Gig Economy
 · Spring by Citi       funds segregated       payouts             Pay Outs
        │                      │                   │                   │
        │                      │                   │                   │
THE WARD RUNS
 Neighbor pays          Cary holds the order   Local business      Courier
                                               is paid             is paid

            ── Reconciliation and Reporting ── / ── The Split ──
                 (one band spanning all four, tying the ranks)
```

The spanning band at the foot is the reconciliation pair, and it is what makes
the drawing a correspondence rather than two lists.

**Caption** — a plain `<figcaption>` inside the `.diagram` figure, which is
already styled globally. ⚠ `.note` is **not** a site-wide class: it is declared
separately under `.tool--split` and `.tool--ask`, so any use of it here needs
its own `.tool--citi .note` rule rather than inheriting one.

> Left to right, a single delivery order. The upper rank is Citi's own naming,
> from its e-commerce page. The lower rank is ours. Nothing in the lower rank
> requires Citi; everything in it has a place for Citi to stand.

⚠ **The caption is the honesty of the whole page.** Do not cut it for length.

---

## 2 · Layer two — the build plan

Register changes here: this is documentation, not argument. `.plate` mile marker
(`<span class="plate-n">02</span><span class="plate-t">The Build</span>`), one
line of lede, then `.steps` / `.step` — the same component the front page uses
for the standing ladder. Five steps. The left column of `.step` is 62px, which
holds **NOW / NEXT / THEN / THEN / LATER** set in `.step-t` weight; the body is
one paragraph each. ⛔ No numbers: two of the steps are the same distance away
and numbering them would claim an order we do not have.

**NOW — Build compatible.**
Keep The Ward's commerce authority independent of whoever moves the money. The
system decides what an order is, who is owed, and what the rules are; the
processor executes. Document what Spring requires. Design the payment layer so
that a processor sits underneath it rather than inside it. Settle the
merchant-of-record and sub-merchant structure. Write down what courier payout
actually demands.

**NEXT — Prove one Ward.**
Real businesses, real orders, real couriers, in one neighborhood. Record
transaction volume, merchant retention, courier economics, fulfillment rates,
repeat use — and the failures: refunds, chargebacks, disputes, and what it
actually costs to run.

**THEN — Prove the pour.**
Put the same commerce system into a materially different community. The second
installation is the one that demonstrates that what is being scaled is The Ward
rather than one neighborhood that happened to work.

**THEN — A defined pilot.**
The ask at that point is not whether Citi would like to partner with a
neighborhood website. It is: here is the operating system, here are the
transactions, here is the correspondence to your infrastructure, and here is a
bounded deployment to put Spring underneath.

**LATER — Institutional host.**
A Citi-backed deployment becomes one available host model: financial
infrastructure and institutional scale from one side, the neighborhood layer
from the other.

▶ **Open ruling for Jacob:** the sketch names *Huron* as the second pour. That
name appears nowhere else in this repo or on this site, and naming a second
neighborhood on a forwarded page commits us to it. **Recommend the step stays
unnamed** — "a materially different community" — until it is real. If it should
be named, say so and it goes in with `data-names-instance`.

---

## 3 · Layer three — why Citi

`.plate` 03, `The Two Doors`. This is the section that could most easily become
mush, so it is built as **two facing columns that are not allowed to blend**.
Use the `.beyond` / `.beyond-col` pair already in `css/site.css`, or scope a
two-column grid under `.tool--citi` if that component fights the content.

**Lede, one line:**
> Two Citi propositions arrive at the same place from opposite directions.

**Column one — Citi Services sees a commerce platform.**
> Citi's e-commerce business is organised around a continuum: accept the
> payment, hold the funds, pay everyone owed, and finance the gap. Its own page
> lists consumer collections, Spring by Citi for acceptance, virtual accounts
> that segregate funds, gig economy pay outs and reconciliation. A neighborhood
> delivery order is a small instance of exactly that shape — a two-sided
> marketplace where the seller is not the operator, which Citi's own research
> puts at roughly a third of online purchases.

**Column two — Citi Impact sees community infrastructure.**
> The Citi Impact Fund invests Citi's own balance sheet in U.S. companies
> working on affordability, access and resilience, across four areas that
> include financial resilience and social infrastructure — "solutions that
> expand access to essential services including housing, healthcare and
> transportation for underserved communities." Beyond capital, it says it helps
> companies "reach new markets, increase demand for their offerings or build
> long-term resilience." As of June 30, 2026: 58 companies and funds, more than
> $215 million allocated.

**The join, set apart — `.pull`:**
> Services sees a commerce platform. Impact sees community infrastructure.
> The Ward is both, and that is the entire reason this page exists.

**Then the quote, and it should be given room.** Meredith Shields, Head of the
Citi Impact Fund, 8 September 2026, linked:

> "In past moments of technological leaps, such as the internet and broadband
> infrastructure, many underserved communities have been the last to benefit."
> … "We can invest in solutions that help meet essential community needs while
> the technology is evolving, not after the groundwork has been laid."

One sentence of ours underneath, no more:
> A neighborhood's commerce layer is being built right now, in the places that
> can afford consultants and the platforms that extract from the rest. This is
> the version that is built while the groundwork is being laid.

⛔ **Citi Social Finance stays off the page.** See `SOURCES.md` §C: it is an
emerging-markets unit, and citing it tells the first informed reader that we
cited the wrong desk.

---

## 4 · What we need from Citi

`.plate` 04. **This is the section that changes the posture of the whole
document, and it works by being unusually plain.**

```
h2      What we need from Citi
.lede   Not money. Not yet. Answers.
```

One paragraph:
> Every item below is a question whose answer changes what we build. We would
> rather design against a real constraint now than discover it during a pilot.

Then `.terms` / `.term` — `.term-k` is a 132px key column, `.term-v` the
explanation. One line each; the discipline of the narrow key is what keeps this
from becoming a wish list.

| key | value |
| --- | --- |
| Merchant of record | Who is the merchant of record for a neighborhood order — the business, The Ward, or both under a sub-merchant structure. |
| Spring eligibility | What a platform at our stage must be to use Spring, and what disqualifies one. |
| Onboarding | Marketplace and sub-merchant onboarding: what the path looks like for a business with one location and no payments staff. |
| KYB and KYC | What is required of a local business, and of a courier who is an individual. |
| Settlement | Timing, batching, and what the business and courier can be told about when money arrives. |
| Courier payouts | Whether gig economy pay outs reach an individual courier at our volume, and at what cost per payout. |
| Tips | Whether a tip can be routed whole to a courier without passing through platform revenue. |
| Refunds and chargebacks | Where liability sits when the order is prepared by one party and delivered by another. |
| Payment methods | Card, wallet, pay-by-bank, instant debit — what is available in the U.S. and what a neighborhood should expect people to use. |
| Reconciliation | What the reporting gives us, and whether it can be reconciled against our own ledger without a manual step. |
| Pricing | What this costs at small volume, honestly, including whether small volume is servable at all. |
| POS coexistence | What happens where a business already has a terminal and a processor it likes. |
| Data boundaries | What Citi would see, what it would retain, and what we would be required to share. |
| Pilot requirements | What Citi would need to be true before supporting a live deployment. |

▶ Fourteen rows is long but the length is the argument — it reads as engineering
rather than enthusiasm. If it must be cut, cut from the middle (payment methods,
POS coexistence), never the first three or the last one.

---

## 5 · Close — the independence clause

Short. `.coda` or a final `.copy` block, no heading larger than the section
needs. **This is the paragraph that makes the page safe to send.**

> None of this makes The Ward dependent on Citi. Building to this interface
> means a documented marketplace architecture, a payment layer a processor plugs
> into rather than owns, and a commerce system that is portable by
> construction — which is worth building whoever ends up underneath it. If Citi
> says no, another institution can occupy the same interface, and we have lost
> nothing but a page.
>
> If Citi says yes, we have not handed over an idea. We have handed over the
> beginning of an integration.

⛔ **The page ends there.** No call to action, no contact button, no form. The
document is the approach; adding an ask undoes the posture the whole thing was
built to hold.

---

## 6 · Meta strings

```
<title>        Built Toward Citi — The Ward
description    The Ward's commerce layer, built to fit infrastructure Citi has
               already published: what corresponds, what is being built in what
               order, and the questions still open between the two.
og:title       Built Toward Citi
og:description A neighborhood commerce layer, mapped against Citi's published
               e-commerce infrastructure — and the list of questions still open
               between them.
og:url         https://theward.online/works/citi/
```

---

## 7 · Order of work

1. Read `SOURCES.md`. It contains three corrections to the original sketch.
2. Shell + head, copied from `works/split/index.html`.
3. Layer 1 copy, then the correspondence SVG. **Draw it early** — if the figure
   does not hold, the page does not, and everything after it is cheaper to cut.
4. Layers 2–5, all on existing components (`.plate`, `.steps`, `.terms`,
   `.pull`, `.beyond`). Add CSS under `.tool--citi` only where an existing
   component genuinely fights the content, and write both themes when you do.
5. `node tools/build.mjs` → `python3 tools/audit.py` → both must be clean.
6. Add the `/works/citi/` row to the `/works` colophon, and to The Split's, only
   if Jacob rules that it joins the set. Until then it is an unlisted page
   reachable by link alone.
