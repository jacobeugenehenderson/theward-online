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
  var GEO  = { lat: 38.6, lon: -90.2 }
  var mode = 'auto'

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

  function applyClock() {
    var night = mode === 'night' ||
      (mode === 'auto' && solarElevation(new Date(), GEO.lat, GEO.lon) < -6)

    isNight = night
    document.documentElement.setAttribute('data-theme', night ? 'dark' : 'light')
    post()   // the product cannot read our ground from inside a cross-origin frame

    var state = document.querySelector('[data-clock-state]')
    if (state) state.textContent = night ? 'Night' : 'Day'

    var btns = document.querySelectorAll('[data-clock]')
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', String(btns[i].getAttribute('data-clock') === mode))
    }
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
    // clock
    applyClock()
    var clockBtns = document.querySelectorAll('[data-clock]')
    for (var i = 0; i < clockBtns.length; i++) {
      clockBtns[i].addEventListener('click', function () {
        mode = this.getAttribute('data-clock')
        applyClock()
      })
    }
    setInterval(function () { if (mode === 'auto') applyClock() }, 60000)

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
