#!/usr/bin/env node
/**
 * claims-pages-agree — The Ask and The Split model the same order. Where they
 * name the same number, it must be the same number.
 *
 * ⛔ THIS EXACT DRIFT HAPPENED ON 2026-09-13, INSIDE ONE DAY. The Local Host's
 * share was declared independently in both scripts (HOSTSHARE in ask.js, HOST in
 * split.js, both 0.40). The Ask's model changed in the morning; The Split went on
 * dividing the pot "40% of the rest" until the afternoon. Neither page errored,
 * neither check fired, and each was internally consistent — they were only wrong
 * about each other. That term is now gone from The Split entirely, which is the
 * better fix; these three remain genuinely shared and can drift the same way.
 *
 * ⭐ IT READS THE DECLARATIONS, it does not restate them. No rate is written into
 * this file. If a name changes the extractor fails LOUDLY rather than skipping,
 * because a cross-page check that silently matches nothing is worse than none.
 *
 *   node tools/claims-pages-agree.mjs
 */
import { readFileSync } from 'node:fs'

const read = p => readFileSync(p, 'utf8')
const askJs = read('js/ask.js'), splitJs = read('js/split.js')
const askHtml = read('works/ask/index.html'), splitHtml = read('works/split/index.html')

function pick(src, re, what) {
  const m = re.exec(src)
  if (!m) { console.log(`✘ cannot find ${what} — the extractor is stale, not the pages`); process.exitCode = 1; return null }
  return Number(m[1])
}
const slider = (html, id, what) =>
  pick(html, new RegExp(`id="${id}"[^>]*value="([0-9.]+)"`), `the ${what} slider default`)

const TERMS = [
  { name: "courier's share of the service charge",
    ask:   pick(askJs,   /var COURIER=([0-9.]+)/,  'COURIER in ask.js'),
    split: pick(splitJs, /var COUR=([0-9.]+)/,     'COUR in split.js') },
  { name: 'service charge, on food',
    ask:   slider(askHtml,   'svc',  'service charge on The Ask'),
    split: slider(splitHtml, 'svc',  'service charge on The Split') },
  { name: 'food through Cary, per restaurant per month',
    // \u26d4 THE SAME RESTAURANT, AND THEY WERE 3.6x APART. The Split assumed 40 orders
    // a month at $55 \u2014 $2,200 of trade \u2014 while The Ask, which actually models volume,
    // assumed $8,000. The Split was underselling its own best sentence by that factor.
    // The Ask's slider is in dollars; The Split holds it in cents.
    ask:   slider(askHtml, 'perrest', 'food per restaurant on The Ask'),
    split: (() => { const m = /var MONTHLY=(\d+)/.exec(splitJs)
                    if (!m) { console.log('\u2718 cannot find MONTHLY in split.js \u2014 the extractor is stale, not the pages'); process.exitCode = 1; return null }
                    return Number(m[1]) / 100 })() },
  { name: 'commission the restaurant pays',
    ask:   slider(askHtml,   'comm', 'commission on The Ask'),
    split: slider(splitHtml, 'keep', 'fee the restaurant pays on The Split') },
]

let bad = 0
for (const t of TERMS) {
  if (t.ask === null || t.split === null) continue
  if (t.ask === t.split) continue
  bad++
  console.log(`✘ ${t.name}\n    The Ask   ${t.ask}\n    The Split ${t.split}`)
}
// \u26d4 A STALE EXTRACTOR MUST NOT PRINT REASSURANCE. The first version said
// "cannot find COURIER" and then "agree on every shared term" in the same breath.
// The exit code was right and the sentence was a lie, which is the one thing a
// check may never do \u2014 a reader takes the last line.
if (process.exitCode) console.log('\ncould not read every shared term \u2014 this check proved NOTHING')
else console.log(bad ? `\n${bad} term(s) the two pages disagree about`
                     : 'The Ask and The Split agree on every shared term')
process.exit(bad || process.exitCode ? 1 : 0)
