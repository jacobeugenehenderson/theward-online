/* ═══════════════════════════════════════════════════════════════════════════
   theward.online

   Four jobs, no framework:
     1  the day       — the neighborhood's clock, shared with the product
     2  the sky band  — the neighborhood's own sky, and the control for the day
     3  the layers    — the running product swaps payload BY MESSAGE
     4  the pill, the ticker

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
     staging build and production. `?layer=` is framed-only, and at the time of
     writing it is on the trunk but NOT on production — check before flipping:
       git show origin/main:src/App.jsx | grep -c 'layer=slab'   → 0 means no. */
  var EMBED_URL       = 'https://jacobeugenehenderson.github.io/lafayette-square-staging/'
  var EMBED_URL_LOCAL = 'http://localhost:5173/'

  var isLocal  = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  var embedUrl = isLocal ? EMBED_URL_LOCAL : EMBED_URL
  /* postMessage wants an ORIGIN, never a URL with a path on it. */
  var embedOrigin = new URL(embedUrl, location.href).origin

  var GEO = { lat: 38.6, lon: -90.2 }

  /* ⭐ ONE PLACE, TWO FRAMES. The directory opens on it and the card shows it,
     so the pair reads as one instrument rather than two things that happen to
     be near each other.
     ⛔ TO CHANGE THE PLACE: this line. The id comes from the directory. */
  var FEATURED_PLACE = 'lmk-028'

  /* ═══ 1. THE DAY ═══════════════════════════════════════════════════════
     `held` is the scrubbed minute, or null for the neighborhood's own.

     ⭐ ONE DAY, TWO SURFACES. The page and the product share it: dragging the
     sky posts `ward-time` in, and the Almanac's own slider posts `ward-time`
     back out. Both sides compare before acting, so adopt → announce → adopt
     cannot loop. Two controls are fine; two clocks are not. */
  var held = null
  var isNight = false

  function solarElevation(date, lat, lon) {
    var rad = Math.PI / 180
    var start = Date.UTC(date.getUTCFullYear(), 0, 0)
    var doy = (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000
    var frac = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
    var g = (357.529 + 0.98560028 * (doy + frac / 24)) * rad
    var decl = 23.44 * rad * Math.sin((280.46 + 0.9856474 * doy) * rad + 0.0334 * Math.sin(g))
    var eqt = 4 * (-1.9148 * Math.sin(g))
    var solarTime = frac + lon / 15 + eqt / 60
    var H = (solarTime - 12) * 15 * rad
    var s = Math.sin(lat * rad) * Math.sin(decl) + Math.cos(lat * rad) * Math.cos(decl) * Math.cos(H)
    return Math.asin(Math.max(-1, Math.min(1, s))) / rad
  }

  /* ⚠ Low-precision astronomy, deliberately: the abridged lunar series is good
     to a fraction of a degree, which is invisible on a band this size. The
     PRODUCT computes the real thing with SunCalc for the sky it renders; this
     is the page's echo of it and must never be quoted as the authority. */
  var RAD = Math.PI / 180
  var OBLIQ = 23.4397 * RAD

  function moonAt(date, lat, lon) {
    var d = date.valueOf() / 86400000 - 10957.5
    var L = (218.316 + 13.176396 * d) * RAD
    var M = (134.963 + 13.064993 * d) * RAD
    var F = (93.272 + 13.229350 * d) * RAD
    var lam = L + 6.289 * RAD * Math.sin(M)
    var bet = 5.128 * RAD * Math.sin(F)
    var ra = Math.atan2(Math.sin(lam) * Math.cos(OBLIQ) - Math.tan(bet) * Math.sin(OBLIQ), Math.cos(lam))
    var dec = Math.asin(Math.sin(bet) * Math.cos(OBLIQ) + Math.cos(bet) * Math.sin(OBLIQ) * Math.sin(lam))
    var lst = (280.16 + 360.9856235 * d) * RAD + lon * RAD
    var alt = Math.asin(Math.sin(lat * RAD) * Math.sin(dec) +
                        Math.cos(lat * RAD) * Math.cos(dec) * Math.cos(lst - ra)) / RAD
    var age = (((date.valueOf() - 947182440000) / 86400000) % 29.530588853 + 29.530588853) % 29.530588853
    var phase = age / 29.530588853
    return { alt: alt, phase: phase, lit: (1 - Math.cos(2 * Math.PI * phase)) / 2 }
  }

  function dayOfYear(d) {
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) -
                       Date.UTC(d.getFullYear(), 0, 0)) / 86400000)
  }

  function localMinuteNow() {
    var d = new Date()
    return (d.getUTCHours() * 60 + d.getUTCMinutes() + Math.round(GEO.lon / 15 * 60) + 1440) % 1440
  }

  /* A real Date at the shown minute, in the neighborhood's own time. */
  function dateAt(minute) {
    var d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCMinutes(minute - Math.round(GEO.lon / 15 * 60))
    return d
  }

  /* ═══ 2. THE SKY ═══════════════════════════════════════════════════════
     Four season anchors × 24 hours × five bands of the neighborhood's OWN
     authored sky, extracted from the product by tools/build-sky.mjs. */
  var SKY = null
  try {
    var tableEl = document.getElementById('sky-table')
    if (!tableEl) throw new Error('no #sky-table — run: node tools/build.mjs')
    SKY = JSON.parse(tableEl.textContent)
    if (!SKY || !SKY.bands || !SKY.cards) throw new Error('parsed, but not a sky table')
  } catch (e) {
    console.error('[ward] the sky band has no data:', e.message)
    SKY = null
  }

  function hexRGB(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
  }
  function mix(a, b, t) {
    return a.map(function (v, i) { return Math.round(v + (b[i] - v) * t) })
  }
  function css(c) { return 'rgb(' + c.join(',') + ')' }

  /* Between the two flanking season anchors and the two flanking hours — the
     same interpolation the product does, rather than snapping to a slot. */
  function skyAt(minute, doy) {
    if (!SKY) return null
    var names = Object.keys(SKY.doy).sort(function (a, b) { return SKY.doy[a] - SKY.doy[b] })
    var lo = names[names.length - 1], hi = names[0], t = 0
    for (var i = 0; i < names.length; i++) {
      var d0 = SKY.doy[names[i]], d1 = SKY.doy[names[(i + 1) % names.length]]
      var span = (d1 - d0 + 365) % 365
      var into = (doy - d0 + 365) % 365
      if (into <= span) { lo = names[i]; hi = names[(i + 1) % names.length]; t = span ? into / span : 0; break }
    }
    var h = minute / 60, h0 = Math.floor(h) % 24, h1 = (h0 + 1) % 24, ht = h - Math.floor(h)
    return SKY.bands.map(function (_, band) {
      var a = mix(hexRGB(SKY.cards[lo][h0][band]), hexRGB(SKY.cards[lo][h1][band]), ht)
      var b = mix(hexRGB(SKY.cards[hi][h0][band]), hexRGB(SKY.cards[hi][h1][band]), ht)
      return t === 0 ? a : mix(a, b, t)
    })
  }

  /* ⭐ PORTED FROM THE SKY BUILDER'S OWN "now" PREVIEW
     (cartograph/SkyGradientGrid.jsx). Three things it does that my version did
     not, and each is better:

       · a body BELOW about -3° is simply not drawn, rather than faded
       · the moon's opacity AND glow radius scale with its illuminated
         fraction, and under 5% lit it is not drawn at all — that is how the
         preview shows a phase without drawing a terminator
       · sunGlow is a HORIZON WASH peaking as the sun crosses the horizon,
         not a halo on the sun

     The x axis is this band's own idea — a whole day laid flat — so only the
     vertical mapping and the treatment come across. */
  var HIDE_BELOW = -2.9   // degrees; the Sky Builder's -0.05 rad

  function altToTopPct(altDeg) {
    if (altDeg < HIDE_BELOW) return null
    var t = Math.max(0, Math.min(1, altDeg / 90))
    return (1 - t) * 100
  }

  function placeBody(el, altDeg, xPct) {
    if (!el) return null
    var top = altToTopPct(altDeg)
    if (top === null) { el.style.opacity = '0'; return null }
    el.style.left = xPct + '%'
    el.style.top = top + '%'
    return top
  }

  function paintSky(minute, at) {
    var band = document.querySelector('[data-sky-strip]')
    if (!band) return
    var stops = skyAt(minute, dayOfYear(at))
    if (!stops) { console.error('[ward] no sky for minute', minute); return }

    var names = ['horizon', 'low', 'mid', 'high', 'sunGlow']
    for (var i = 0; i < stops.length; i++) band.style.setProperty('--sky-' + names[i], css(stops[i]))

    var xPct = (minute / 1439) * 100
    var sunAlt = solarElevation(at, GEO.lat, GEO.lon)

    var sun = band.querySelector('[data-sky-sun]')
    if (sun) sun.style.opacity = placeBody(sun, sunAlt, xPct) === null ? '0' : '1'

    /* The wash peaks as the sun crosses the horizon and falls away either
       side — the Sky Builder's own curve, in degrees rather than radians. */
    var wash = band.querySelector('[data-sky-wash]')
    if (wash) {
      var a = Math.max(0, Math.min(1, 1 - Math.abs(sunAlt) / 17.2))
      wash.style.background = a > 0.05
        ? 'linear-gradient(to top, ' + css(stops[4]) + ' 0%, rgba(0,0,0,0) 30%)'
        : 'none'
      wash.style.opacity = a > 0.05 ? String(a) : '0'
    }

    var m = moonAt(at, GEO.lat, GEO.lon)
    var moon = band.querySelector('[data-sky-moon]')
    if (moon) {
      /* the moon keeps its own hour — it leads or trails the sun by its age */
      var mTop = placeBody(moon, m.alt, ((minute / 1439 + (1 - m.phase)) % 1) * 100)
      if (mTop === null || m.lit <= 0.05) {
        moon.style.opacity = '0'
      } else {
        moon.style.opacity = String(0.4 + m.lit * 0.6)
        moon.style.boxShadow = '0 0 ' + (4 + m.lit * 6).toFixed(1) + 'px 2px var(--moon-glow)'
      }
    }

    var mark = band.querySelector('[data-sky-mark]')
    if (mark) mark.style.left = xPct + '%'

    var range = band.querySelector('[data-sky-range]')
    if (range && document.activeElement !== range) range.value = String(minute)
    var nowBtn = band.querySelector('[data-sky-now]')
    if (nowBtn) nowBtn.hidden = (held === null)
  }

  function applyDay() {
    var minute = held === null ? localMinuteNow() : held
    var at = dateAt(minute)
    isNight = solarElevation(at, GEO.lat, GEO.lon) < -6
    document.documentElement.setAttribute('data-theme', isNight ? 'dark' : 'light')
    postLayer()   // the product cannot read our ground across the frame
    paintSky(minute, at)
  }

  function moveDay(minute) {
    held = minute === null ? null : Math.max(0, Math.min(1439, Math.round(minute)))
    applyDay()
    postTime()
  }

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
        w.postMessage({ type: 'ward-layer', layer: layer, ground: isNight ? 'plate' : 'paper' }, embedOrigin)
      } catch (e) { /* not ready; the next post catches up */ }
    })
  }

  /* ⚠ COALESCED TO ONE PER FRAME. A drag fires pointermove ~60×/s and every
     post re-times the product's whole scene; sending them raw froze the
     renderer during testing. The page repaints at full rate — that is local
     and cheap — and the product hears at most one message per frame. */
  var timePending = false
  function postTime() {
    if (timePending) return
    timePending = true
    requestAnimationFrame(function () {
      timePending = false
      var w = frameWin()
      if (!w) return
      try { w.postMessage({ type: 'ward-time', minute: held }, embedOrigin) } catch (e) { /* not ready */ }
    })
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

    // ── the day, and the band that controls it ──────────────────────────
    applyDay()

    var band = document.querySelector('[data-sky-strip]')
    if (band) {
      var dragging = false
      var minuteFromX = function (clientX) {
        var r = band.getBoundingClientRect()
        return ((clientX - r.left) / r.width) * 1439
      }
      band.addEventListener('pointerdown', function (e) {
        if (e.target.closest('[data-sky-now]')) return
        dragging = true
        try { band.setPointerCapture(e.pointerId) } catch (err) { /* fine */ }
        moveDay(minuteFromX(e.clientX))
      })
      band.addEventListener('pointermove', function (e) { if (dragging) moveDay(minuteFromX(e.clientX)) })
      band.addEventListener('pointerup', function () { dragging = false })
      band.addEventListener('pointercancel', function () { dragging = false })

      var range = band.querySelector('[data-sky-range]')
      if (range) range.addEventListener('input', function () { moveDay(Number(this.value)) })
      var nowBtn = band.querySelector('[data-sky-now]')
      if (nowBtn) nowBtn.addEventListener('click', function () { moveDay(null) })
    }

    setInterval(function () { if (held === null) applyDay() }, 60000)

    // ── the view ────────────────────────────────────────────────────────
    var f = document.querySelector('[data-ward-frame]')
    if (f) {
      f.src = embedUrl
      // the product mounts before it can listen; sync once it is up
      f.addEventListener('load', function () {
        setTimeout(function () { postLayer(); postTime() }, 400)
      })
      var layerBtns = document.querySelectorAll('[data-layer]')
      for (var j = 0; j < layerBtns.length; j++) {
        layerBtns[j].addEventListener('click', function () { setLayer(this.getAttribute('data-layer')) })
      }
    }

    /* The Almanac's slider, coming back the other way. */
    window.addEventListener('message', function (e) {
      if (e.origin !== embedOrigin) return
      var m = e.data
      if (!m || m.type !== 'ward-time') return
      var next = m.isLive ? null : m.minute
      if (next === held) return
      if (next !== null && held !== null && Math.abs(next - held) < 1) return
      held = next
      applyDay()
    })

    // ── the panel embeds: the product's own parts, mounted alone ─────────
    var embeds = document.querySelectorAll('[data-embed]')
    for (var ei = 0; ei < embeds.length; ei++) {
      embeds[ei].src = embedUrl + '?embed=' + embeds[ei].getAttribute('data-embed') +
        '&place=' + encodeURIComponent(FEATURED_PLACE)
    }

    // ── the card in the tablet ───────────────────────────────────────────
    var cardFrame = document.querySelector('[data-card-frame]')
    if (cardFrame) {
      cardFrame.src = embedUrl + '?embed=card&place=' + encodeURIComponent(FEATURED_PLACE)
    }

    // ── the instruments pill: one figure area, two things to say about it ─
    var pills = document.querySelectorAll('[data-inst]')
    for (var pi = 0; pi < pills.length; pi++) {
      pills[pi].addEventListener('click', function () {
        var want = this.getAttribute('data-inst')
        var all = document.querySelectorAll('[data-inst]')
        for (var k = 0; k < all.length; k++) {
          all[k].setAttribute('aria-selected', String(all[k].getAttribute('data-inst') === want))
        }
        /* ⚠ setAttribute, NOT `.hidden`. `hidden` is a property of HTMLElement
           and NOT of SVGElement, so `svg.hidden = true` silently sets a plain
           JS property and the figure keeps rendering. Two figures were showing
           at once and my own check missed it, because I read back the same
           property I had just written. Set the ATTRIBUTE and verify against
           COMPUTED DISPLAY. */
        var figs = document.querySelectorAll('[data-fig]')
        for (var q = 0; q < figs.length; q++) {
          if (figs[q].getAttribute('data-fig') === want) figs[q].removeAttribute('hidden')
          else figs[q].setAttribute('hidden', '')
        }
        var panels = document.querySelectorAll('[data-inst-panel]')
        for (var p2 = 0; p2 < panels.length; p2++) {
          panels[p2].hidden = panels[p2].getAttribute('data-inst-panel') !== want
        }
      })
    }

    // ── the ticker, ticking. Slow enough to read; still if asked. ────────
    var slot = document.querySelector('[data-ticker]')
    if (slot && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var lines = slot.children, at = 0
      setInterval(function () {
        lines[at].hidden = true
        at = (at + 1) % lines.length
        lines[at].hidden = false
      }, 3200)
    }

    // ── courier intake: the button is real; where it goes is a decision ──
    var courier = document.querySelector('[data-courier]')
    if (courier && COURIER_INTAKE === 'live') {
      courier.setAttribute('href', embedUrl + 'cary/apply')
      courier.textContent = 'Sign up to carry'
    }
  })
})()
