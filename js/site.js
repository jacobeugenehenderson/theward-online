/* ═══════════════════════════════════════════════════════════════════════════
   theward.online

   Four jobs, no framework:
     1  the day       — the neighborhood's clock, shared with the product
     2  the sky band  — the neighborhood's own sky; the ALMANAC is the control
     3  the layers    — the running product swaps payload BY MESSAGE
     4  the ticker

   ⚠ Traps this file exists to avoid, every one already paid for:
     · Changing an embed's `src` rebuilds the product's WebGL context and
       resets its camera. Post a message instead.
     · Never hide a live canvas — see css/site.css §3.
     · Caching lies. `tools/build.mjs` stamps every asset; if a symptom makes
       no sense, check that what RAN is what is on disk before believing it.
     · No silent bail. An empty sky band looks like a design choice, so a
       failure has to say so out loud.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict'

  /* ── config ─────────────────────────────────────────────────────────────
     COURIER_INTAKE
       'interest'  a note of interest; touches no backend.   ← today
       'live'      routes into courier onboarding.
     ⚠ Do not flip to 'live' until the courier backend close-out has landed:
       an applicant submits identity documents, a background check, licence,
       insurance and a payout account. Until then 'interest' is the only
       honest setting, and it is the reason this site links nowhere near it. */
  var COURIER_INTAKE = 'interest'

  /* Where the embedded product is served from. One line to move between the
     staging build and production.

     ⭐ PRODUCTION SINCE 2026-08-31. It framed the staging build for a month
     because `?layer=` lived on the trunk and prod was ~1,750 commits behind;
     promoting the embed alone would have shipped an unrelated job. That work
     was promoted, origin/main and the trunk are now the same commit, and the
     gate this comment used to name passes:
       git show origin/main:src/App.jsx | grep -c 'layer=slab'   → 2, not 0.
     ⛔ Re-run that before ever pointing this back at staging. */
  var EMBED_URL       = 'https://lafayette-square.com/'
  var EMBED_URL_LOCAL = 'http://localhost:5173/'

  var isLocal  = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  var embedUrl = isLocal ? EMBED_URL_LOCAL : EMBED_URL
  /* postMessage wants an ORIGIN, never a URL with a path on it. */
  var embedOrigin = new URL(embedUrl, location.href).origin

  /* ⭐ ONE PLACE, TWO FRAMES. The directory opens on it and the card shows it,
     so the pair reads as one instrument rather than two things that happen to
     be near each other.
     ⛔ TO CHANGE THE PLACE: this line. The id comes from the directory. */
  /* ⛔ THE SOURCE IS `data-place` ON THE CARD FRAME, and this is only the
     fallback for when that attribute is missing. index.html and README both
     say "to swap the place, change data-place and nothing else" — that was
     true, then a constant here quietly took over and the attribute became
     dead markup describing a contract nothing honoured. Restored 2026-08-23:
     read the attribute, and both frames boot on the same id. */
  var FEATURED_PLACE = 'lmk-028'

  /* ⛔⛔ §1 THE DAY AND §2 THE SKY ARE GONE (2026-09-05), and with them every
     line of astronomy this file used to carry: `solarElevation`, `moonAt`, the
     dawn-window arithmetic, the four-season × twenty-four-hour × five-band sky
     table extracted from the product, `paintSky`, `applyDay`, `moveDay`, the
     `ward-time` relay between three frames, the keyboard range and the `now`
     button. The Slab section no longer demonstrates a day, so the page no
     longer keeps one. Jacob, 2026-09-05: "get rid of the diorama, time slider,
     light/dark maker, everything."

     ⛔ THE PAGE'S GROUND IS THE READER'S NOW, NOT THE NEIGHBORHOOD'S. This file
     used to stamp `data-theme` from the sun over the installation, which meant a
     viewer whose system asked for light got a dark page all evening — recorded
     at the time as a deliberate override rather than a bug. With the day gone
     there is nothing to override with, so `tokens.css` decides: bare `:root`,
     the guarded `prefers-color-scheme` block, and `[data-theme]` for an explicit
     choice. All three were already declared and audited.

     ⚠ ONE THING STILL NEEDS TO KNOW WHICH GROUND WE ARE ON: `ward-layer` carries
     `ground: 'paper'|'plate'` because the product cannot see across the frame.
     It is read from `prefers-color-scheme` below instead of from the sun.
     Archived: git show HEAD:js/site.js */

  /* ═══ 3. THE LAYERS ════════════════════════════════════════════════════
     The product's own address is the API: no param is the composite,
     ?layer=slab is the ground with no commons over it, ?layer=player the
     commons with no ground under it.

     The message contract is the product's and it is exact — App.jsx ignores
     anything whose `type` is not `ward-layer`, and takes `ground`
     ('paper'/'plate') because it cannot see this page's day across the frame.
     Those two words are its wire protocol; do not "correct" them to this
     site's vocabulary. */
  var layer = null

  /* ⚠️ `paper` / `plate` are the PRODUCT'S wire protocol — retired words in this
     site's own vocabulary. Do not "correct" them. */
  function ground() {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'plate' : 'paper'
    } catch (e) { return 'paper' }
  }

  function frameWin() {
    var f = document.querySelector('[data-ward-frame]')
    return (f && f.contentWindow) ? f.contentWindow : null
  }

  var layerPending = false
  function postLayer() {
    if (layerPending) return
    layerPending = true
    requestAnimationFrame(function () {
      layerPending = false
      var w = frameWin()
      if (!w) return
      try {
        w.postMessage({ type: 'ward-layer', layer: layer, ground: ground() }, embedOrigin)
      } catch (e) { /* not ready; the next post catches up */ }
    })
  }

  /* ⚠ COALESCED TO ONE PER FRAME. A drag fires pointermove ~60×/s and every
     post re-times the product's whole scene; sending them raw froze the
     renderer during testing. The page repaints at full rate — that is local
     and cheap — and the product hears at most one message per frame. */
  /* ⭐ THE PAGE'S HALF OF THE BARGAIN. The Ward cannot see where it sits in
     this page — a framed document's IntersectionObserver measures against its
     OWN viewport, and cross-origin it can see nothing of ours. So we watch,
     and we tell it. It decides what to do about it; that part is the Ward's.

     Threshold at half: mostly visible is worth full rate, mostly gone is not.
     The frames it drops go straight back into scrolling. */
  var presence = null
  function postPresence(next) {
    if (next === presence) return
    presence = next
    var w = frameWin()
    if (!w) return
    try { w.postMessage({ type: 'ward-perf', presence: next }, embedOrigin) } catch (e) { /* not ready */ }
  }

  function setLayer(next) {
    layer = next || null
    postLayer()
    var btns = document.querySelectorAll('[data-layer]')
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed',
        String((btns[i].getAttribute('data-layer') || '') === (layer || '')))
    }
  }

  /* ═══ boot ═════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {

    // ── the view ────────────────────────────────────────────────────────
    var f = document.querySelector('[data-ward-frame]')
    if (f) {
      f.src = embedUrl
      // the product mounts before it can listen; sync once it is up
      f.addEventListener('load', function () {
        setTimeout(function () { postLayer(); presence = null; postPresence('active') }, 400)
      })
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          postPresence(entries[0].intersectionRatio >= 0.5 ? 'active' : 'idle')
        }, { threshold: [0, 0.5, 1] }).observe(f)
      }

      var layerBtns = document.querySelectorAll('[data-layer]')
      for (var j = 0; j < layerBtns.length; j++) {
        layerBtns[j].addEventListener('click', function () { setLayer(this.getAttribute('data-layer')) })
      }
    }

    // ── which place both frames start on ─────────────────────────────────
    var cardFrame = document.querySelector('[data-card-frame]')
    var shownPlace = (cardFrame && cardFrame.getAttribute('data-place')) || FEATURED_PLACE

    // ── the panel embeds: the product's own parts, mounted alone ─────────
    var embeds = document.querySelectorAll('[data-embed]')
    for (var ei = 0; ei < embeds.length; ei++) {
      embeds[ei].src = embedUrl + '?embed=' + embeds[ei].getAttribute('data-embed') +
        '&place=' + encodeURIComponent(shownPlace)
    }

    /* ⛔ THE TREE AND THE ALMANAC FRAMES ARE GONE (2026-09-05) — `?embed=tree`
       and `?embed=almanac`, the diorama and the product's own time control that
       sat across the foot of it. §03 is prose about what a Slab is now, and it
       demonstrates nothing, so there is nothing here to mount.
       ⚠️ BOTH ROUTES STILL EXIST IN THE PRODUCT and are worth knowing about:
       `?embed=almanac` mounts the real `AlmanacTab` and speaks `ward-size` and
       `ward-cue`; `?embed=tree` takes `&species=` and MUST be given one, because
       bare it resolves through the Meteorologist's canary and frames whatever
       specimen an operator last parked that tool on. See INTEGRATION.md §1.
       Archived: git show HEAD:js/site.js */

    // ── the card in the tablet ───────────────────────────────────────────
    if (cardFrame) {
      cardFrame.src = embedUrl + '?embed=card&place=' + encodeURIComponent(shownPlace)
    }

    /* ── the directory and the card, agreeing ─────────────────────────────
       Pick a place in the directory above and the card below turns to it —
       which is how this page shows that a bar, a church and a laundry are the
       same object with different contents, rather than saying so.

       ⛔ THE TWO FRAMES CANNOT SEE EACH OTHER. They are cross-origin, so
       neither can read or call the other; this page is the only thing that can
       carry a selection across, and it is a RELAY — it does not decide
       anything. The product posts what was picked and the product renders it.

       ⛔ POST, NEVER RE-SRC. Setting the card's src would reload the whole app
       inside it — the same rule the hero's layer switch is built on. */
    window.addEventListener('message', function (e) {
      if (e.origin !== embedOrigin) return
      var m = e.data
      if (!m || m.type !== 'ward-place' || !m.id) return
      if (m.id === shownPlace) return
      shownPlace = m.id
      if (cardFrame && cardFrame.contentWindow) {
        cardFrame.contentWindow.postMessage({ type: 'ward-place', id: m.id }, embedOrigin)
      }
    })

    /* ⛔ THE INSTRUMENTS PILL IS GONE (2026-09-05) — three tabs captioning one
       picture three ways. One thing from its handler is worth keeping if
       anything like it returns: it set `hidden` as an ATTRIBUTE on the figures,
       never as a property, because `hidden` is a property of HTMLElement and
       NOT of SVGElement — `svg.hidden = true` silently sets a plain JS property
       and the figure keeps rendering. Two figures showed at once and the check
       missed it, because it read back the same property it had just written.
       Set the attribute; verify against computed display.
       Archived: git show HEAD:js/site.js */

    /* ⛔ THE /works RAIL IS GONE (2026-09-05). Six stages behind six tabs, with
       every panel shipped visible and collapsed here so the page without
       JavaScript was long rather than broken. The prospectus walks its reader
       through the pipeline linearly now, so there is nothing to collapse.
       ⭐ Keep the pattern in mind rather than the code: the markup ships in its
       working state and the script REDUCES it. A stylesheet that hid the panels
       by default would have hidden them for good the day this file failed to
       run. Archived: git show HEAD:js/site.js */

    // ── the ticker, ticking. Slow enough to read; still if asked. ────────
    var slot = document.querySelector('[data-ticker]')
    if (slot && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var lines = slot.children
      /* ⭐ START SOMEWHERE NEW EACH VISIT. Fifteen phrases at 3.2s is 48 seconds
         to see them all, and nobody reads this page for 48 seconds — always
         starting at the first means most visitors only ever meet "who's open
         late". A random entry point costs one line and shows the range.
         ⛔ It picks a START, it does not shuffle: the order is authored.
         ⚠️ Under prefers-reduced-motion this whole block is skipped, so that
         reader sees whichever phrase is unhidden in the markup — which is why
         the first one has to stand on its own. */
      var at = Math.floor(Math.random() * lines.length)
      if (at !== 0) { lines[0].hidden = true; lines[at].hidden = false }
      setInterval(function () {
        lines[at].hidden = true
        at = (at + 1) % lines.length
        lines[at].hidden = false
      }, 3200)
    }

    /* ── the scroll guards ────────────────────────────────────────────────
       An iframe eats the wheel. Each guard belongs to THIS document and sits
       over its embed, so a reader scrolling down sails past instead of being
       captured. Click to dismiss; leaving the frame re-arms it.
       ⛔ Re-arming on mouseleave is the load-bearing half. Dismiss-once-forever
       would mean the reader is trapped on every subsequent pass down the page —
       the exact problem, just deferred to the second scroll. */
    var guards = document.querySelectorAll('[data-scrollguard]')
    for (var gi = 0; gi < guards.length; gi++) {
      (function (guard) {
        var frame = guard.parentNode
        guard.addEventListener('click', function () { guard.hidden = true })
        frame.addEventListener('mouseleave', function () { guard.hidden = false })
      })(guards[gi])
    }

    // ── courier intake: the button is real; where it goes is a decision ──
    var courier = document.querySelector('[data-courier]')
    if (courier && COURIER_INTAKE === 'live') {
      courier.setAttribute('href', embedUrl + 'cary/apply')
      courier.textContent = 'Sign up to cary'
    }
  })
})()
