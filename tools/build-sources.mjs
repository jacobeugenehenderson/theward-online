#!/usr/bin/env node
/**
 * build-sources — the public sources block, generated from the product.
 *
 * READS the Sources panel's own GROUPS array. It never restates it, so it
 * cannot drift. Everything about the public block is a RULE applied to that
 * data, never a hand-kept copy:
 *
 *   · a source marked `unverified` NEVER ships          (BRIEF §6)
 *   · a row whose action is OWED never ships            (internal work state)
 *   · `steps` never ship                                (operator register)
 *   · every (row :: source) pair must be CLASSIFIED here, and an unknown one
 *     THROWS — a new row in the panel breaks this build rather than silently
 *     publishing something unverified or silently dropping something real.
 *
 * Usage:  node tools/build-sources.mjs [--check]
 *         WARD_SOURCES_PANEL=/path/to/SourcesPanel.jsx node tools/build-sources.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')

const PANEL = process.env.WARD_SOURCES_PANEL ||
  resolve(ROOT, '../../lafayette-square.nosync/src/cartograph/SourcesPanel.jsx')

const CHECK = process.argv.includes('--check')

/* ── the classification, keyed "row :: source" ─────────────────────────────
   ship:false  — deliberately not public (non-US, or a claim we don't make)
   note        — replaces the panel's note when that note is operator-register
                 or names a place this site does not name
   Anything not listed throws. That is the point.                          */
const CLASSIFY = {
  'Street & building base :: OpenStreetMap':            { ship: true },
  'Building footprints :: Microsoft Global ML Footprints': { ship: true, note: 'free · no account' },
  'Building footprints :: OpenStreetMap':               { ship: false },   // the note is a Europe claim
  'Ground elevation :: USGS 3DEP':                      { ship: true },
  'Ground elevation :: any GeoTIFF':                    { ship: true },
  'Parcels, zoning, year built :: the county assessor': { ship: true, note: 'public record · per jurisdiction' },
  'Tree census :: OpenStreetMap':                       { ship: true, note: 'free · real trunk positions' },
  'Tree census :: city forestry inventory':             { ship: true, note: 'free · no key' },
  'Tree census :: authored park census':                { ship: true, note: 'hand-curated for a signature park' },
  'Tree census :: a public-records request':            { ship: true },
  'Canopy raster :: NLCD Tree Canopy (USDA)':           { ship: true },
  'Canopy raster :: ESA WorldCover':                    { ship: true },
  'Historic designation :: NID rejestr zabytków':       { ship: false },   // not a US source
  'Historic designation :: National Register (NPS)':    { ship: true, note: 'public record · free' },
  'Street lamps :: OpenStreetMap':                      { ship: true, note: 'free · no account' },
  'Facade imagery :: Mapillary':                        { ship: true },
  'Species dossiers :: USDA PLANTS':                    { ship: true },
  'Species dossiers :: Silvics of North America':       { ship: true },
  'Species dossiers :: i-Tree Species':                 { ship: true },
  'Species routing :: the city planting list':          { ship: true, note: 'free · with hardiness zone' },
  'Businesses & hours :: Overture Places':              { ship: true, note: 'free' },
  'Businesses & hours :: OpenStreetMap POIs':           { ship: true },
  'Menus :: the restaurant':                            { ship: true },
  'Photographs & logos :: the business':                { ship: true, note: 'credit their domain · never hotlink' },
  'Photographs & logos :: Wikimedia Commons':           { ship: true, note: 'free · for landmarks' },
}

/* One line per tier, written here rather than generated: it is the only prose
   in this block, and the panel's own tier comments are dev-register. */
const TIER_SAY = {
  'Automatic': 'Some of the foundation is already there. Streets, buildings, elevation, land cover, and other large-scale geographic data can be drawn from open datasets.',
  'Public records': 'Other information belongs to the place. Parcels, zoning, trees, historic designations, and similar records come from the agencies and institutions that maintain them.',
  'Local knowledge': 'The rest comes from the neighborhood itself. Businesses, menus, photographs, landmarks, names, habits, and the details that distinguish one place from another.',
}

/* A note may not name a place this site does not name. */
const FORBIDDEN = /europe|łódź|lodz|poland|polish|lafayette|st\.? ?louis|missouri|altadena|england|inspire/i

/* Licence / cost tokens are lifted out of the note into the terms column.
   Recognition is a rule; an unrecognised fragment simply stays descriptive. */
const TERM_TOKENS = [
  'ODbL', 'CC BY-SA', 'CC-BY-SA', 'CC BY',
  'public domain', 'public record', 'free account', 'no account',
  'no key', 'API key', 'free',
]

function die(msg) {
  console.error('\n  build-sources FAILED\n  ' + msg + '\n')
  process.exit(1)
}

// ── read the panel and lift GROUPS out of it ────────────────────────────────
let src
try { src = readFileSync(PANEL, 'utf8') }
catch { die(`cannot read the Sources panel at\n    ${PANEL}\n  Set WARD_SOURCES_PANEL to its path.`) }

const head = src.indexOf('const GROUPS = [')
if (head < 0) die(`no "const GROUPS = [" in ${PANEL}. The panel changed shape; this generator must be updated, not bypassed.`)

let i = src.indexOf('[', head), depth = 0, end = -1
for (; i < src.length; i++) {
  const c = src[i]
  if (c === '[') depth++
  else if (c === ']') { depth--; if (depth === 0) { end = i + 1; break } }
}
if (end < 0) die('unbalanced brackets in GROUPS')

let GROUPS
try {
  GROUPS = new Function('FETCH', 'DOC', 'OWED', 'NONE',
    'return ' + src.slice(src.indexOf('[', head), end))('fetch', 'doc', 'owed', 'none')
} catch (e) { die('could not evaluate GROUPS: ' + e.message) }

// ── apply the rules ─────────────────────────────────────────────────────────
const unknown = [], leaked = []
const tiers = []

for (const g of GROUPS) {
  if (!(g.title in TIER_SAY)) { unknown.push(`TIER "${g.title}"`); continue }
  const rows = []
  for (const row of g.rows) {
    if (row.act === 'owed') continue                       // internal work state
    const sources = []
    for (const s of row.sources) {
      if (s.unverified) continue                            // never ships
      const key = `${row.name} :: ${s.name}`
      const rule = CLASSIFY[key]
      if (!rule) { unknown.push(key); continue }
      if (!rule.ship) continue
      const note = rule.note ?? s.note ?? ''
      if (FORBIDDEN.test(note)) leaked.push(`${key} → "${note}"`)
      sources.push({ name: s.name, note })
    }
    if (!sources.length) continue
    const terms = []
    for (const s of sources) {
      for (const part of s.note.split('·').map(t => t.trim())) {
        const hit = TERM_TOKENS.find(t => part.toLowerCase() === t.toLowerCase())
        if (hit && !terms.includes(hit)) terms.push(hit)
      }
    }
    rows.push({
      name: row.name,
      auto: row.act === 'fetch',
      sources: sources.map(s => ({
        name: s.name,
        note: s.note.split('·').map(t => t.trim())
          .filter(p => p && !TERM_TOKENS.some(t => p.toLowerCase() === t.toLowerCase()))
          .join(' · '),
      })),
      terms: terms.join(' · ') || '—',
    })
  }
  tiers.push({ title: g.title, say: TIER_SAY[g.title], rows })
}

if (unknown.length) die(
  'unclassified rows — the panel has changed.\n  Classify each in tools/build-sources.mjs, then rebuild:\n\n' +
  unknown.map(u => '    · ' + u).join('\n'))

if (leaked.length) die(
  'a public note names a place this site does not name.\n  Give it a `note` override in CLASSIFY:\n\n' +
  leaked.map(l => '    · ' + l).join('\n'))

// ── emit ────────────────────────────────────────────────────────────────────
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const html = tiers.map(t => `        <div class="tier">
          <span class="tier-name">${esc(t.title)}</span>
          <p class="tier-say">${esc(t.say)}</p>
${t.rows.map(r => `          <div class="row">
            <span class="r-name"><span class="dot${r.auto ? ' dot-on' : ''}"></span>${esc(r.name)}</span>
            <span class="r-src">${r.sources.map(s =>
              `<span>${esc(s.name)}${s.note ? ` <em>— ${esc(s.note)}</em>` : ''}</span>`).join('')}</span>
            <span class="r-terms">${esc(r.terms)}</span>
          </div>`).join('\n')}
        </div>`).join('\n')

const BEGIN = '<!-- SOURCES:BEGIN — generated by tools/build-sources.mjs. Do not edit by hand. -->'
const END   = '<!-- SOURCES:END -->'

/* ⛔ THE TARGET MOVED (2026-09-05), and it is a constant here rather than a
   search because a generator that hunts for its own markers will happily write
   into the wrong file the day a second page grows a copy of them. The sources
   table was on the front page; it is now the Intake stop of /works, where it is
   evidence in a technical document rather than a fourteen-row provenance audit
   in the middle of a pitch. ⭐ Point it elsewhere with WARD_SOURCES_PAGE. */
const indexPath = resolve(ROOT, process.env.WARD_SOURCES_PAGE || 'works/index.html')
let index
try { index = readFileSync(indexPath, 'utf8') } catch { die(`no page to write into at\n    ${indexPath}`) }
const a = index.indexOf(BEGIN), b = index.indexOf(END)
if (a < 0 || b < 0) die(`${indexPath} is missing the SOURCES markers:\n    ${BEGIN}\n    ${END}`)

const next = index.slice(0, a + BEGIN.length) + '\n' + html + '\n        ' + index.slice(b)

if (CHECK) {
  if (next !== index) die('the sources block is STALE. Run: node tools/build-sources.mjs')
  console.log('sources block: up to date')
} else {
  writeFileSync(indexPath, next)
  writeFileSync(resolve(ROOT, 'data/sources.json'), JSON.stringify({ tiers }, null, 2) + '\n')
  const n = tiers.reduce((k, t) => k + t.rows.length, 0)
  console.log(`sources block: ${tiers.length} tiers, ${n} rows written from`)
  console.log(`  ${PANEL}`)
}
