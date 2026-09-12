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

  const ctx = {
    document: { getElementById: (i) => byId[i] || mk(i), createElement: () => mk(null) },
    location: { search: '' }, console: { log() {}, error() {} },
  }
  ctx.window = ctx
  createContext(ctx)
  runInContext(src, ctx)

  const norm = (x) => String(x).replace(/<[^>]+>/g, '').replace(/&middot;/g, '·')
                        .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

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
