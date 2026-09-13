#!/usr/bin/env node
/**
 * claims-static-readouts — every `.dial-val` written into the markup must equal
 * what the page's script computes on load.
 *
 * ⛔ THE SOURCE IS DOCUMENTATION. A readout that says $14.85 while the script
 * writes $17.24 is corrected too fast for a reader to see and never corrected
 * at all for a reader of the FILE — and the file is how the defaults are read
 * (Jacob, 2026-09-12: "there's no reason for source and control state to
 * disagree").
 *
 * ⭐ IT DOES NOT COMPARE A SLIDER'S value TO ITS READOUT, and must not: the
 * neighborhoods slider is log-scaled, so value="16" and a readout of "3" are
 * the same state. The claim is about the READOUT, not the control.
 *
 *   node tools/claims-static-readouts.mjs
 */
import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'

const PAGES = [
  ['works/ask/index.html',   'js/ask.js'],
  ['works/split/index.html', 'js/split.js'],
]

let bad = 0
for (const [pagePath, scriptPath] of PAGES) {
  const html = readFileSync(pagePath, 'utf8')
  const src  = readFileSync(scriptPath, 'utf8')

  const statics = {}
  for (const m of html.matchAll(/<span class="dial-val"[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/span>\s*<\/div>/g))
    statics[m[1]] = m[2]

  // \u2b50 AND EVERY INLINE READOUT, not just the ones beside a slider. A rate
  // quoted mid-sentence is a readout too \u2014 `<span id="pf-1">6.3%</span> of food
  // sold` is written by the script on every dial move, and the literal in the
  // file is what a reader of the SOURCE believes. Until 2026-09-13 these were
  // outside the net, so 6.3% and 4.2% could drift from what foodRate() computes
  // and nothing would say a word (Jacob: "6.3 is fake and should either be
  // connected to the knob that generates it or omitted").
  // \u2b50 HARVESTED BY SHAPE, NOT BY NAME. Matching `pf-*` would cover today's
  // three and miss the fourth the day it lands \u2014 the same silent-gap failure
  // tools/audit.py's filesystem glob was written to avoid.
  // \u26d4 AND NOT WIDER THAN A SPAN, which was tried and reverted the same hour:
  // harvesting every id'd element flagged 52, because the reading panel's `\u2014`
  // placeholders and the empty `#flow`/`#sentence` containers are FILLED at
  // runtime BY DESIGN \u2014 nobody writes "$1,867k" into markup. The claim this
  // file makes is about a readout that MIRRORS CONTROL STATE, not about every
  // element a script touches. Any bare `<span id>` is a
  // candidate; the `if (!live) continue` below drops the ones
  // the script never writes to, so a span that is pure markup costs nothing.
  for (const m of html.matchAll(/<(span|p|dt|b|em)[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)) {
    const id = m[2], body = m[3]
    // \u2b50 EMPTY OR AN EM DASH IS A PLACEHOLDER, NOT A CLAIM. The reading panel is
    // FILLED at runtime by design \u2014 nobody writes "$1,867k" into markup \u2014 so those
    // are skipped. What is left is an element carrying REAL TEXT that the script
    // also writes, which is a readout whether it sits in a span or a paragraph.
    if (!(id in statics) && body.replace(/<[^>]+>/g,'').trim().replace(/\u2014/,'') !== '')
      statics[id] = body
  }

  const vals = {}
  for (const m of html.matchAll(/<input[^>]*>/g)) {
    const id = /id="([^"]+)"/.exec(m[0])?.[1]
    if (id) vals[id] = /value="([^"]+)"/.exec(m[0])?.[1] ?? '0'
  }

  const byId = {}
  const mk = (id) => {
    const e = {
      _t: '', _h: '', className: '', hidden: false, open: true, checked: true,
      style: {}, dataset: {}, value: (id && vals[id] !== undefined) ? vals[id] : '0',
      addEventListener() {}, setAttribute() {}, getAttribute: () => null, appendChild() {},
      querySelector: (s) => byId[s.replace('#', '')] || null,
      querySelectorAll() { return this.buttons || [] },
    }
    Object.defineProperty(e, 'textContent', { get: () => e._t, set: (v) => { e._t = String(v) } })
    Object.defineProperty(e, 'innerHTML', { get: () => e._h, set: (v) => {
      e._h = String(v)
      for (const m of e._h.matchAll(/id="([^"]+)"/g)) if (!byId[m[1]]) mk(m[1])
    } })
    if (id) byId[id] = e
    return e
  }
  for (const m of html.matchAll(/id="([^"]+)"/g)) mk(m[1])
  for (const k of ['topo','modes','tier','pourpayer','ownersel','spreadsel','procsel'])
    if (byId[k]) byId[k].buttons = []

  // ⛔ The stub must answer every DOM call the page makes, not the ones it made
  // when this was written. A page that grows a querySelectorAll crashes the
  // check, and a crashed check reads exactly like a failing one.
  const ctx = {
    document: {
      // \u26d4 NULL FOR AN ID THE PAGE DOES NOT HAVE. This returned a freshly minted
      // element for ANY id, so a script reaching for something the markup no longer
      // carries got an object instead of null and sailed past. That is exactly how a
      // removed control took the page down twice on 2026-09-13 \u2014 #hostshare in the
      // morning, #markup in the afternoon \u2014 with this check green both times.
      // Elements the script CREATES are registered by the innerHTML setter above, so
      // they are in byId by the time anything looks for them.
      getElementById: (i) => (i in byId) ? byId[i] : null,
      createElement: () => mk(null),
      querySelectorAll: () => [],
      querySelector: () => null,
    },
    location: { search: '' }, console: { log() {}, error() {} },
  }
  ctx.window = ctx
  createContext(ctx)
  // \u26d4 A CRASHED CHECK READS LIKE A FAILING ONE, which this file's own header warns
  // about. Now that getElementById returns null for an id the markup does not carry,
  // a script reaching for a removed control throws HERE \u2014 which is the point, and is
  // a real defect worth naming rather than a stack trace worth deciphering.
  try {
    runInContext(src, ctx)
  } catch (e) {
    const m = /Cannot read properties of null \(reading '([^']+)'\)/.exec(e.message)
    console.log(`\u2718 ${scriptPath} threw on load: ${e.message}`)
    if (m) console.log(`    it reached for .${m[1]} on an element ${pagePath} does not have` +
                       ` \u2014 a control was removed and its reference left behind`)
    bad++
    continue
  }

  const norm = (x) => String(x).replace(/<[^>]+>/g, '').replace(/&middot;/g, '·')
                        .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

  // \u26d4 WHAT THIS CHECK CANNOT SEE, stated so its silence is not read as coverage.
  // It compares markup against what the script writes ON LOAD. An element the script
  // only writes on INTERACTION \u2014 #proc-note on The Split is written inside the
  // owner-scenario click handler and never at load \u2014 has no live value to compare
  // against, so it is skipped, not passed. Mutating that paragraph on 2026-09-13 was
  // NOT caught, and the widening above did not close it. Those few are verified by
  // hand; driving the scenario buttons and re-comparing would close it properly.

  for (const [id, source] of Object.entries(statics)) {
    const live = norm(byId[id]._t || byId[id]._h)
    if (!live) continue
    if (norm(source) !== live) {
      bad++
      console.log(`✘ ${pagePath} #${id}\n    source "${norm(source)}"\n    live   "${live}"`)
    }
  }
}

console.log(bad ? `\n${bad} stale readout(s)` : 'every static readout matches what the script writes')
process.exit(bad ? 1 : 0)
