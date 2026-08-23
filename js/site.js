/* ═══════════════════════════════════════════════════════════════════════════
   theward.online

   Three jobs, no framework:
     1  the clock          — day or night, decided by the neighborhood's sun
     2  the layer switch   — the running product swaps payload BY MESSAGE
     3  nothing else

   ⚠ Two traps this file exists to avoid, both paid for elsewhere:
     · Changing the frame's src rebuilds the product's WebGL context and
       resets its camera, so three layers become three unrelated pictures
       instead of one stack having its ground taken away. Post a message.
     · Never hide a live canvas. See css/site.css §3.
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

  /* ── 1. the clock ──────────────────────────────────────────────────────
     The page is in day or night because the NEIGHBORHOOD is. Solar elevation
     at the installation's own latitude; civil twilight (-6°) is the line,
     which is also when its lamps come on. A manual choice always wins. */
  var GEO = { lat: 38.6, lon: -90.2 }

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

  var isNight = false

  /* ── the sky ───────────────────────────────────────────────────────────
     Four season anchors × 24 hours × four bands of the neighborhood's OWN
     authored sky, extracted from the product by tools/build-sky.mjs. The
     strip is not a decorative gradient; it is the table the map is lit by.

     Scrubbing the hour moves the strip, the page's day, and the readout
     together — one clock, shown rather than announced. That is why there is
     no clock widget: a band of sky says "it is dusk there" without a label. */
  var SKY = null
  try { SKY = JSON.parse(document.getElementById('sky-table').textContent) } catch (e) { SKY = null }

  function mix(a, b, t) {
    function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)] }
    var x = rgb(a), y = rgb(b)
    return 'rgb(' + x.map(function (v, i) { return Math.round(v + (y[i] - v) * t) }).join(',') + ')'
  }

  /* Between the two flanking season anchors and between the two flanking
     hours — the same interpolation the product does, rather than snapping. */
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
      var a = mix(SKY.cards[lo][h0][band], SKY.cards[lo][h1][band], ht)
      var b = mix(SKY.cards[hi][h0][band], SKY.cards[hi][h1][band], ht)
      // the season blend runs on already-blended hours, so mix in rgb space
      return t === 0 ? a : mixRGB(a, b, t)
    })
  }

  function mixRGB(a, b, t) {
    function n(s) { return s.match(/\d+/g).map(Number) }
    var x = n(a), y = n(b)
    return 'rgb(' + x.map(function (v, i) { return Math.round(v + (y[i] - v) * t) }).join(',') + ')'
  }

  function dayOfYear(d) {
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000)
  }

  function localMinuteNow() {
    var d = new Date()
    return (d.getUTCHours() * 60 + d.getUTCMinutes() + Math.round(GEO.lon / 15 * 60) + 1440) % 1440
  }

  function sayHour(m) {
    var h = Math.floor(m / 60), mm = m % 60
    var ap = h < 12 ? 'am' : 'pm', hh = h % 12 === 0 ? 12 : h % 12
    return hh + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap
  }

  function paintSky(minute) {
    var strip = document.querySelector('[data-sky-strip]')
    if (!strip || !SKY) return
    var stops = skyAt(minute, dayOfYear(new Date()))
    if (!stops) return
    var names = ['horizon', 'low', 'mid', 'high']
    for (var i = 0; i < stops.length; i++) strip.style.setProperty('--sky-' + names[i], stops[i])
    var hr = strip.querySelector('[data-sky-hour]')
    if (hr) hr.textContent = sayHour(minute)
  }

  /* ⚠ There is no time control on this page, deliberately. The Almanac inside
     the product already owns the day slider, and two sliders that do not drive
     each other is worse than one. If the page should ever move with the hour,
     the right shape is the PRODUCT posting its time outward and this page
     following — one slider, two surfaces — not a second slider here. */
  function applyClock() {
    var minute = localMinuteNow()
    var d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCMinutes(minute - Math.round(GEO.lon / 15 * 60))

    isNight = solarElevation(d, GEO.lat, GEO.lon) < -6
    document.documentElement.setAttribute('data-theme', isNight ? 'dark' : 'light')
    post()   // the product cannot read our ground from inside a cross-origin frame
    paintSky(minute)
  }

  /* ── 2. the layer switch ───────────────────────────────────────────────
     The product's own address is the API: no param is the composite,
     ?layer=slab is the ground with no commons over it, ?layer=player the
     commons with no ground under it. Switching posts a message so the
     running context survives. */
  var layer = null

  /* The product's contract, read from its own handler — it ignores anything
     without this exact `type`, and `ground` is how it learns which way this
     page has gone, since it cannot see us across the frame.
       src/App.jsx: m.type !== 'ward-layer' → return                        */
  function post() {
    var frame = document.querySelector('[data-ward-frame]')
    if (!frame || !frame.contentWindow) return
    try {
      frame.contentWindow.postMessage(
        { type: 'ward-layer', layer: layer, ground: isNight ? 'plate' : 'paper' },
        embedOrigin
      )
    } catch (e) { /* not ready yet; the next post catches up */ }
  }

  function setLayer(next) {
    layer = next || null
    post()
    var btns = document.querySelectorAll('[data-layer]')
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed',
        String((btns[i].getAttribute('data-layer') || '') === (layer || '')))
    }
  }

  /* ── boot ──────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    // the sky, and the day it carries
    applyClock()
    setInterval(applyClock, 60000)

    // the view
    var frame = document.querySelector('[data-ward-frame]')
    if (frame) {
      frame.src = embedUrl
      // the product mounts before it can listen; sync once it is up
      frame.addEventListener('load', function () { setTimeout(post, 400) })
      var layerBtns = document.querySelectorAll('[data-layer]')
      for (var j = 0; j < layerBtns.length; j++) {
        layerBtns[j].addEventListener('click', function () {
          setLayer(this.getAttribute('data-layer'))
        })
      }
    }

    // courier intake — the button is real; where it goes is a decision
    var courier = document.querySelector('[data-courier]')
    if (courier && COURIER_INTAKE === 'live') {
      courier.setAttribute('href', embedUrl + 'cary/apply')
      courier.textContent = 'Sign up to carry'
    }
  })
})()
