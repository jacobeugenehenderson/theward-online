#!/usr/bin/env node
/**
 * claims-slider-steps — every position of every slider must move its readout.
 *
 * ⛔ A DEAD POSITION READS AS A BROKEN CONTROL. The neighborhoods dial was 101
 * linear positions laid over a log curve: EIGHT consecutive steps all read
 * "1 neighborhood", and one step at the top was worth 67 of them. Three more
 * dials stepped in $500 while K() rounds to the nearest $1k, so every other
 * position was dead. Nothing errored; the sliders simply did not respond, which
 * is indistinguishable from the page being broken (Jacob, 2026-09-13: "I can
 * only slide the neighborhoods on the rails slider in odd increments").
 *
 * ⭐ IT DRIVES THE REAL SCRIPT AND READS THE REAL READOUT. An earlier version
 * restated each dial's formatter in a lookup table, which is the thing this
 * repo's own rule forbids — a check that copies the source cannot detect the
 * source changing. This one dispatches `input` into the page's own handlers and
 * reads what the page actually wrote, so a new dial is covered on the day it
 * lands and a changed formatter is caught by construction.
 *
 *   node tools/claims-slider-steps.mjs
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

  const vals = {}
  for (const m of html.matchAll(/<input[^>]*>/g)) {
    const id = /id="([^"]+)"/.exec(m[0])?.[1]
    if (id) vals[id] = /value="([^"]+)"/.exec(m[0])?.[1] ?? '0'
  }

  const byId = {}
  const mk = (id) => {
    const e = {
      _t: '', _h: '', _on: {}, className: '', hidden: false, open: true, checked: true,
      style: {}, dataset: {}, value: (id && vals[id] !== undefined) ? vals[id] : '0',
      addEventListener(t, f) { (this._on[t] = this._on[t] || []).push(f) },
      dispatchEvent(ev) { (this._on[ev.type] || []).forEach(f => f({ target: this, type: ev.type })) },
      setAttribute() {}, getAttribute: () => null, appendChild() {},
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
  for (const k of ['topo', 'modes', 'tier', 'takepayer', 'pourpayer', 'ownersel', 'spreadsel', 'procsel'])
    if (byId[k]) byId[k].buttons = []

  const ctx = {
    document: {
      getElementById: (i) => byId[i] || mk(i),
      createElement: () => mk(null),
      querySelectorAll: () => [], querySelector: () => null,
    },
    location: { search: '' }, console: { log() {}, error() {} },
    Event: class { constructor(t) { this.type = t } },
  }
  ctx.window = ctx
  createContext(ctx)
  runInContext(src, ctx)

  for (const m of html.matchAll(/<input type="range"[^>]*>/g)) {
    const tag  = m[0]
    const id   = /id="([^"]+)"/.exec(tag)?.[1]
    const min  = +/min="([^"]+)"/.exec(tag)[1]
    const max  = +/max="([^"]+)"/.exec(tag)[1]
    const step = +/step="([^"]+)"/.exec(tag)[1]
    const el = byId[id]
    if (!el) continue
    // ⭐ the readout is whichever element the page's own handler writes to
    const out = byId[id + '-v']
    if (!out) continue

    const seq = []
    for (let v = min; v <= max; v += step) {
      el.value = String(v)
      el.dispatchEvent(new ctx.Event('input'))
      seq.push(out._t)
    }
    // restore, so one dial's sweep cannot colour the next
    el.value = vals[id]
    el.dispatchEvent(new ctx.Event('input'))

    const dead = seq.length - new Set(seq).size
    if (!dead) continue
    let run = 1, worst = 1
    for (let i = 1; i < seq.length; i++) { if (seq[i] === seq[i-1]) { run++; worst = Math.max(worst, run) } else run = 1 }
    bad++
    console.log(`✘ ${pagePath} #${id}\n    ${seq.length} positions, ${new Set(seq).size} distinct` +
                ` — ${dead} move nothing, up to ${worst} in a row`)
  }
}

console.log(bad ? `\n${bad} slider(s) with dead positions` : 'every slider position moves its readout')
process.exit(bad ? 1 : 0)
