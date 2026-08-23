#!/usr/bin/env node
/**
 * build-vignettes — the five participant vignettes, generated from the product.
 *
 * The Ward gives every person an avatar: an emoji on a vignette whose colours
 * are pulled OUT OF THE EMOJI ITSELF. This block puts the five participant
 * types on the page wearing that same treatment, so the roles are shown in the
 * product's own visual language rather than in a set of swatches invented here.
 *
 * ⭐ IT READS THE PRESET MATH, IT NEVER RESTATES IT. `src/lib/vignettePresets.js`
 * is imported from the product at every build, so if a preset is retuned there,
 * this page follows. The one thing held still is the PALETTE CAPTURE
 * (`data/vignette-palettes.json`) — extractEmojiColors needs a canvas to render
 * the emoji and read its pixels back, and node has none. That file says so, says
 * when and on what it was measured, and says how to re-measure.
 *
 * ⛔ A ROLE WITH NO CAPTURED PALETTE THROWS. Adding a sixth type breaks this
 * build rather than quietly publishing a guessed colour — the same discipline
 * build-sources.mjs applies to an unclassified source.
 *
 * Writes ONE block — css/tokens.css, VIGNETTES:BEGIN/END — carrying four tokens
 * per role: the emoji, the gradient, the inset edge, the border.
 *
 * ⚠ THE EMOJI IS A TOKEN, AND THAT IS DELIBERATE. The badges sit inside the
 * ladder's hand-written copy, so there is no generated markup block to put them
 * in — and a `☕` typed into index.html would be a second copy of a fact this
 * file owns, free to drift from the palette measured beside it. So the markup
 * carries an EMPTY span and `content: var(--vig-<role>-emoji)` fills it. One
 * source, no copy.
 *
 * ⭐ AND THE COUPLING IS AUDITED, NOT TRUSTED. Because the markup names classes
 * rather than roles, nothing here can check that the page uses what this writes
 * — but audit.py already does it from both ends: a token no rule references
 * fails `unused token`, and a class no rule defines fails `undefined css`. Add a
 * sixth role and the build stays green only once the page actually wears it.
 *
 * ⚠ THE COLOURS MUST LAND IN tokens.css AND NOWHERE ELSE. Rule 1 forbids a
 * literal colour in site.css and the audit enforces it, so site.css carries the
 * .role-vig rules in var() form only and every actual colour arrives from here.
 *
 * Usage:  node tools/build-vignettes.mjs [--check]
 *         WARD_VIGNETTE_PRESETS=/path/to/vignettePresets.js node tools/build-vignettes.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const CHECK = process.argv.includes('--check')

const PRESETS_SRC = process.env.WARD_VIGNETTE_PRESETS ||
  resolve(ROOT, '../../lafayette-square.nosync/src/lib/vignettePresets.js')

function die(msg) {
  console.error(`\n  build-vignettes: ${msg}\n`)
  process.exit(1)
}

/* ── the product's preset math, imported as source ──────────────────────────
   vignettePresets.js imports extractEmojiColors purely to serve its two public
   helpers, both of which take an EMOJI. We want the layer underneath — the
   generators, which take a PALETTE — so the import is stripped and `generators`
   is exposed. Nothing else about the file is touched, which is the point: the
   gradients, the shadows and the border rules stay the product's.             */
let presetSrc
try { presetSrc = readFileSync(PRESETS_SRC, 'utf8') }
catch { die(`cannot read vignettePresets.js at\n    ${PRESETS_SRC}\n  Set WARD_VIGNETTE_PRESETS to its path.`) }

if (!/const generators = \{/.test(presetSrc))
  die(`vignettePresets.js no longer declares \`const generators = {\`.\n` +
      `  The product changed shape; read it before changing this generator.`)

const shimmed = presetSrc
  .replace(/^\s*import\s+\{[^}]*\}\s+from\s+['"]\.\/emojiColor['"].*$/m, '')
  + '\nexport { generators as __generators }\n'

const { __generators: generators } =
  await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(shimmed))

/* ── the capture ───────────────────────────────────────────────────────────*/
const capture = JSON.parse(readFileSync(resolve(ROOT, 'data/vignette-palettes.json'), 'utf8'))

/* ⭐ THE PRESET IS PER-ROLE, AND THAT IS THE WHOLE POINT. The eight presets are
   per-EMOJI treatments — each one flatters a different kind of artwork — so one
   preset across all five guarantees the set reads uniform, which is exactly the
   failure that got the first pass reverted. `capture.preset` is only the
   fallback for a role that does not name its own.                             */
const fallbackPreset = capture.preset
const inkTarget = typeof capture.inkTarget === 'number' ? capture.inkTarget : 0.70
if (!generators[fallbackPreset])
  die(`the capture's fallback preset "${fallbackPreset}" has no generator in the product.\n` +
      `  Available: ${Object.keys(generators).join(', ')}`)

const roles = capture.order.map(key => {
  const r = capture.roles[key]
  if (!r) die(`role "${key}" is in \`order\` but has no entry in \`roles\`.`)
  if (!Array.isArray(r.palette) || r.palette.length !== 3)
    die(`role "${key}" has no captured 3-colour palette. Re-capture it — see the\n` +
        `  _comment in data/vignette-palettes.json. A guessed colour never ships.`)
  const preset = r.preset || fallbackPreset
  if (!generators[preset])
    die(`role "${key}" asks for preset "${preset}" and the product has no such\n` +
        `  generator. Available: ${Object.keys(generators).join(', ')}`)

  /* ⭐ SIZE AND CENTRE THE GLYPH BY ITS OWN INK, not by one font-size for all.
     A flex box centres the LINE BOX; every emoji fills its box differently, so a
     single size leaves some badges small and some hanging low. Both were real,
     measured complaints. `inkH` and `inkDy` come from the capture; the arithmetic
     is here so re-measuring one emoji is the only manual step. */
  if (!r.ink || typeof r.ink.inkH !== 'number' || typeof r.ink.inkDy !== 'number')
    die(`role "${key}" has no measured \`ink\` block. Re-measure it — see the\n` +
        `  _comment in data/vignette-palettes.json. An unmeasured glyph is not centred.`)
  if (!(r.ink.inkH > 0.05))
    die(`role "${key}" measured inkH ${r.ink.inkH}, which is not a glyph.\n` +
        `  A near-zero ink height means the emoji did not render when captured.`)

  const scale = Math.min(1.8, Math.max(0.6, inkTarget / r.ink.inkH))
  // the capture rendered at 0.72 of the box, so a box fraction becomes this many em
  const nudgeEm = -r.ink.inkDy / 0.72

  return { key, ...r, preset, scale, nudgeEm, style: generators[preset](r.palette) }
})

const fellBack = roles.filter(r => r.fallback).map(r => r.key)
if (fellBack.length)
  console.warn(`  ⚠ codepoint-fallback palettes (not measured from artwork): ${fellBack.join(', ')}`)

/* ── block 1 · the tokens ──────────────────────────────────────────────────*/
const tokenLines = roles.flatMap(r => [
  `  --vig-${r.key}-emoji:  "${r.emoji}";`,
  `  --vig-${r.key}-scale:  ${r.scale.toFixed(3)};`,
  `  --vig-${r.key}-nudge:  ${r.nudgeEm.toFixed(3)}em;`,
  `  --vig-${r.key}-bg:     ${r.style.background};`,
  `  --vig-${r.key}-edge:   ${r.style.boxShadow};`,
  `  --vig-${r.key}-border: ${r.style.borderColor};`,
])

const tokenBlock = [
  '',
  `  /* ${capture.order.length} participant vignettes — generated by tools/build-vignettes.mjs.`,
  '     Do not edit by hand; the colours come out of the emoji, in the product.',
  `     Preset is PER ROLE — ${roles.map(r => `${r.key}:${r.preset}`).join(' · ')}`,
  `     Each glyph is scaled toward ink height ${inkTarget} and centred on its own ink.`,
  `     Captured ${capture.capturedOn} on ${capture.capturedWith}. */`,
  ...tokenLines,
  '',
].join('\n')

/* ── write, or verify ──────────────────────────────────────────────────────*/
const TOK_BEGIN = '  /* VIGNETTES:BEGIN — generated by tools/build-vignettes.mjs. Do not edit by hand. */'
const TOK_END   = '  /* VIGNETTES:END */'

function splice(text, begin, end, block, what) {
  const a = text.indexOf(begin), b = text.indexOf(end)
  if (a < 0 || b < 0) die(`${what} is missing the VIGNETTES markers:\n    ${begin}\n    ${end}`)
  if (b < a) die(`${what} has the VIGNETTES markers in the wrong order.`)
  return text.slice(0, a + begin.length) + block + text.slice(b)
}

const targets = [
  { path: resolve(ROOT, 'css/tokens.css'), begin: TOK_BEGIN, end: TOK_END, block: tokenBlock, what: 'css/tokens.css' },
]

let stale = false
for (const t of targets) {
  const cur = readFileSync(t.path, 'utf8')
  const next = splice(cur, t.begin, t.end, t.block, t.what)
  if (CHECK) {
    if (next !== cur) { console.error(`\n  ${t.what}'s vignette block is STALE. Run: node tools/build-vignettes.mjs\n`); stale = true }
  } else if (next !== cur) {
    writeFileSync(t.path, next)
  }
}

if (CHECK) {
  if (stale) process.exit(1)
  console.log(`vignettes: up to date (${roles.length} roles, ${new Set(roles.map(r => r.preset)).size} presets)`)
} else {
  console.log(`vignettes: ${roles.length} roles → ${tokenLines.length} tokens (${roles.map(r => `${r.key}:${r.preset}`).join(' ')})`)
}
