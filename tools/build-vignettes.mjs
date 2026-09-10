#!/usr/bin/env node
/**
 * build-vignettes — the participant badges' per-glyph geometry.
 *
 * ⛔ THIS NO LONGER READS THE PRODUCT, AND THAT IS A DELIBERATE DEMOTION.
 * It used to import `src/lib/vignettePresets.js` and derive each badge's ground
 * from its own emoji's colours. That guaranteed the worst case — a blue bicycle
 * got a blue ground, and 16% of its ink cleared 3:1. Swept across a neutral
 * ground from black to white, NO single flat ground serves all five: mid-tones
 * take the worst glyph to ~0% legible ink, white kills 🔑 and ☕, black kills 🚲.
 *
 * ⭐ SO THE BADGE IS NOW ONE AUTHORED MASTER — `--vig-field` / `--vig-rim` /
 * `--vig-halo` in css/tokens.css — doing what a real merit badge does: a
 * constant field, and a HALO on the emblem. The halo clears 16.5:1 against the
 * field, so every glyph has a guaranteed edge whatever its own colours are.
 * That is what lets ANY emoji be dropped in.
 *
 * ⚠️ CONSEQUENCE, STATED RATHER THAN LEFT TO BE DISCOVERED: the badges are no
 * longer "generated from the product". They are site design now. README's list
 * of product-generated blocks is the sources table and the sky strip — those
 * two only. Do not re-add this one to that claim.
 *
 * What still HAS to be generated is the part that is a measurement:
 *   · the emoji itself, as a token, so no copy of it lives in the markup
 *   · a per-role SCALE and NUDGE, because a flex box centres the line box and
 *     not the glyph, and every emoji fills its box differently
 *
 * ⛔ A ROLE WITH NO MEASURED INK THROWS. Adding a sixth type breaks this build
 * rather than shipping a glyph that is the wrong size and off-centre.
 *
 * Writes ONE block — css/tokens.css, VIGNETTES:BEGIN/END.
 *
 * Usage:  node tools/build-vignettes.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')

function die(msg) {
  console.error(`\n  build-vignettes: ${msg}\n`)
  process.exit(1)
}

let capture
try { capture = JSON.parse(readFileSync(resolve(ROOT, 'data/vignette-glyphs.json'), 'utf8')) }
catch (e) { die(`cannot read data/vignette-glyphs.json — ${e.message}`) }

const inkTarget = typeof capture.inkTarget === 'number' ? capture.inkTarget : 0.70
if (!Array.isArray(capture.order) || !capture.order.length) die('`order` is missing or empty.')

const roles = capture.order.map(key => {
  const r = capture.roles[key]
  if (!r) die(`role "${key}" is in \`order\` but has no entry in \`roles\`.`)
  if (!r.emoji) die(`role "${key}" has no emoji.`)
  const ink = r.ink
  for (const f of ['inkH', 'inkW', 'nudgeY'])
    if (!ink || typeof ink[f] !== 'number')
      die(`role "${key}" has no measured \`${f}\`. Re-measure it — the _comment\n` +
          `  in data/vignette-glyphs.json says how, and says why the raster has to\n` +
          `  be taken from the BASELINE rather than from a 'middle' anchor.`)
  if (!(ink.inkH > 0.05) || !(ink.inkW > 0.05))
    die(`role "${key}" measured ${ink.inkW}×${ink.inkH} em, which is not a glyph.\n` +
        `  Near-zero ink means the emoji did not render when it was captured —\n` +
        `  re-measure rather than shipping a blank.`)

  const scale = Math.min(1.8, Math.max(0.6, inkTarget / ink.inkH))

  /* ⚠️ WIDE GLYPHS: scale is driven by HEIGHT, so a short wide graphic can be
     magnified past the disc. Warn rather than silently clamp — a clamp would
     quietly ship a badge at the wrong size and call it a success. */
  const scaledW = ink.inkW * scale
  if (scaledW > 1.45)
    console.warn(`  ⚠ ${key} (${r.emoji}) scales to ${scaledW.toFixed(2)}em wide against a` +
                 ` ${(ink.inkH * scale).toFixed(2)}em height.\n    Short and wide — it will` +
                 ` crowd the rim before it fills the disc. Consider a squarer glyph.`)

  return { key, emoji: r.emoji, scale, nudgeY: ink.nudgeY }
})

/* ═══ SQUARE PORTRAITS ═══════════════════════════════════════════════════════
   The second shape. Round is who you are; square is something in the Ward.

   ⛔ THE SAME RULE APPLIES, ONE LEVEL UP: a portrait is a SUBJECT whose picture
   cycles, so EVERY frame needs its own measured scale and nudge. A portrait is
   only as good as its least well-centred glyph, and an unmeasured one throws
   here exactly as an unmeasured role does.
   ⭐ WHAT IS NEW IS THE FIELD. The badges share one authored master because any
   emoji may be dropped in. A portrait cannot: its field must clear EVERY glyph
   in its own vocabulary, which is a per-subject measurement and lives beside
   the frames in data/vignette-glyphs.json. */
const portraits = (() => {
  const P = capture.portraits
  if (!P) return []
  if (!Array.isArray(P.order)) die('`portraits.order` is missing.')
  return P.order.map(key => {
    const sub = P.subjects && P.subjects[key]
    if (!sub) die(`portrait "${key}" is in \`portraits.order\` but has no entry in \`subjects\`.`)
    if (!/^#[0-9a-fA-F]{6}$/.test(sub.field || ''))
      die(`portrait "${key}" has no 6-digit hex \`field\`. The field is a MEASUREMENT for a\n` +
          `  cycling portrait, not a preference — it has to clear every glyph in the family.`)
    if (!Array.isArray(sub.frames) || !sub.frames.length)
      die(`portrait "${key}" has no frames.`)
    const frames = sub.frames.map((f, i) => {
      const ink = f.ink
      if (!f.emoji) die(`portrait "${key}" frame ${i} has no emoji.`)
      for (const k of ['inkH', 'inkW', 'nudgeY'])
        if (!ink || typeof ink[k] !== 'number')
          die(`portrait "${key}" frame ${i} (${f.emoji}) has no measured \`${k}\`.\n` +
              `  ⛔ A cycling portrait is only as good as its least well-centred frame.\n` +
              `  Measure it the way the _comment in data/vignette-glyphs.json describes —\n` +
              `  from the BASELINE, never from a 'middle' anchor.`)
      if (!(ink.inkH > 0.05) || !(ink.inkW > 0.05))
        die(`portrait "${key}" frame ${i} (${f.emoji}) measured ${ink.inkW}×${ink.inkH} em,\n` +
            `  which is not a glyph — it did not render when it was captured.`)
      const scale = Math.min(1.8, Math.max(0.6, inkTarget / ink.inkH))
      const scaledW = ink.inkW * scale
      if (scaledW > 1.45)
        console.warn(`  ⚠ ${key} frame ${i} (${f.emoji}) scales to ${scaledW.toFixed(2)}em wide.`)
      /* ⚠️ NARROW GLYPHS ARE THE CYCLING-ONLY HAZARD, and the badges never met it:
         height drives the scale, so a tall thin picture matches its neighbours in
         height and still reads as half the MASS when it fades in beside them. */
      if (scaledW < 0.62)
        console.warn(`  ⚠ ${key} frame ${i} (${f.emoji}) scales to ${scaledW.toFixed(2)}em wide against` +
                     ` ${(ink.inkH * scale).toFixed(2)}em tall.\n    Tall and narrow — it will read as` +
                     ` lighter than the rest of the sequence even though it is the same height.`)
      return { emoji: f.emoji, scale, nudgeY: ink.nudgeY }
    })
    return { key, field: sub.field, frames }
  })
})()

const portraitLines = portraits.flatMap(p => [
  `  --pt-${p.key}-field: ${p.field};`,
  `  --pt-${p.key}-n: ${p.frames.length};`,
  ...p.frames.flatMap((f, i) => [
    `  --pt-${p.key}-${i}-emoji: "${f.emoji}";`,
    `  --pt-${p.key}-${i}-scale: ${f.scale.toFixed(3)};`,
    `  --pt-${p.key}-${i}-nudge: ${f.nudgeY.toFixed(4)}em;`,
  ]),
])

const tokenLines = roles.flatMap(r => [
  `  --vig-${r.key}-emoji: "${r.emoji}";`,
  `  --vig-${r.key}-scale: ${r.scale.toFixed(3)};`,
  `  --vig-${r.key}-nudge: ${r.nudgeY.toFixed(4)}em;`,
])

const block = [
  '',
  `  /* ${roles.length} participant badges — generated by tools/build-vignettes.mjs.`,
  '     Do not edit by hand. ⛔ COLOUR IS NOT HERE: the field, rim and halo are one',
  '     authored master above, deliberately, so any emoji can be dropped in.',
  `     Scaled toward an inked height of ${inkTarget}em, and nudged so the GRAPHIC`,
  '     lands centred — a flex box only ever centres the line box, and this font',
  '     puts its baseline at 0.84em, not 0.5em. See data/vignette-glyphs.json.',
  `     Measured ${capture.capturedOn} on ${capture.capturedWith}. */`,
  ...tokenLines,
  ...(portraits.length ? [
    '',
    `  /* ${portraits.length} square portrait(s) — round is who you are, square is something`,
    '     in the Ward. Same measured scale and nudge per frame; the FIELD is the new part,',
    '     and it is per-subject because a cycling picture has to stay legible on every turn.',
    '     See the portraits._comment in data/vignette-glyphs.json for the sweep. */',
    ...portraitLines,
  ] : []),
  '',
].join('\n')

const BEGIN = '  /* VIGNETTES:BEGIN — generated by tools/build-vignettes.mjs. Do not edit by hand. */'
const END   = '  /* VIGNETTES:END */'
const path  = resolve(ROOT, 'css/tokens.css')
const cur   = readFileSync(path, 'utf8')
const a = cur.indexOf(BEGIN), b = cur.indexOf(END)
if (a < 0 || b < 0) die(`css/tokens.css is missing the VIGNETTES markers:\n    ${BEGIN}\n    ${END}`)
if (b < a) die('css/tokens.css has the VIGNETTES markers in the wrong order.')
const next = cur.slice(0, a + BEGIN.length) + block + cur.slice(b)

if (CHECK) {
  if (next !== cur) { console.error('\n  the vignette block is STALE. Run: node tools/build-vignettes.mjs\n'); process.exit(1) }
  console.log(`vignettes: up to date (${roles.length} badge glyphs, ${portraits.length} portrait(s))`)
} else {
  if (next !== cur) writeFileSync(path, next)
  console.log(`vignettes: ${roles.length} badge glyphs → ${tokenLines.length} tokens (one master field)` +
    (portraits.length ? ` · ${portraits.length} portrait(s), ${portraits.reduce((n,p)=>n+p.frames.length,0)} frames → ${portraitLines.length} tokens` : ''))
}
