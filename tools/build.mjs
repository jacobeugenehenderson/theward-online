#!/usr/bin/env node
/**
 * build — run every generator, then stamp the local assets.
 *
 * ⚠ THE STAMP EXISTS BECAUSE CACHING LIES. A browser will happily keep running
 * a stylesheet or script it fetched ten edits ago, and every symptom then looks
 * like a bug in code that is already correct — a whole debugging session was
 * lost to exactly this: the page executed 16,015 bytes while the server served
 * 14,871. Stamping `?v=<mtime>` on every local css/js link makes a stale copy
 * impossible rather than merely unlikely.
 *
 *   node tools/build.mjs [--check]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const args = CHECK ? ['--check'] : []

/* ⛔ `build-sky.mjs` LEFT THIS LIST on 2026-09-05, and the tool went with it.
   It extracted the product's authored sky table into index.html; the only thing
   that ever read it was the diorama's gradient band, which was removed with the
   whole day/time apparatus. A generator that writes a block nothing reads is the
   exact drift `--check` exists to catch, so it is deleted rather than disabled.
   ⭐ To restore: git show HEAD:tools/build-sky.mjs, put the SKY markers back in
   index.html, and add it to this array again. */
for (const tool of ['build-sources.mjs', 'build-vignettes.mjs']) {
  execFileSync('node', [resolve(ROOT, 'tools', tool), ...args], { stdio: 'inherit', cwd: ROOT })
}

/* ⛔⛔ EVERY PAGE, NOT JUST THE FRONT ONE — and this was a live bug, not a
   tidy-up. The stamper read `index.html` alone while `tools/audit.py` had long
   since been generalised to the whole filesystem, so `legal.html` was shipping
   `css/site.css?v=23e1c57863ac` — a hash from an older build. The stamp exists
   to make a stale cached copy IMPOSSIBLE, and on that page it was doing the
   exact opposite: pinning returning visitors to whatever CSS they had cached
   under that URL, for ever, with the audit reporting green.
   ⭐ The page list is the FILESYSTEM now, the same rule the audit already
   follows, so the page added tomorrow is covered on the day it lands. */
const pages = readdirSync(ROOT, { recursive: true, withFileTypes: true })
  .filter(d => d.isFile() && d.name.endsWith('.html'))
  .map(d => relative(ROOT, resolve(d.parentPath ?? d.path, d.name)))
  .filter(p => !p.split(sep).some(seg => seg.startsWith('.') || seg === 'node_modules'))
  .sort()

/* ⛔ THE STAMP IS A CONTENT HASH, NOT AN MTIME, AND THAT IS THE WHOLE POINT.
   It was `?v=<mtimeMs>` until 2026-08-23, which is not a fact about the file's
   CONTENT — it is a fact about the filesystem. Any git operation that rewrites
   the working tree (rebase, checkout, a fresh clone, stash pop) reset it with
   zero bytes changed. Two costs, and both were live: `--check` failed
   spuriously right after a rebase, teaching us to push past a red audit; and
   every visitor re-downloaded unchanged CSS on every deploy, which is the exact
   thing the stamp exists to avoid. A hash changes when, and only when, the file
   does. */
const stamp = path => createHash('sha256')
  .update(readFileSync(resolve(ROOT, path))).digest('hex').slice(0, 12)

/* ⚠️ A PAGE IN A SUBDIRECTORY REACHES THE ASSETS RELATIVELY — `works/index.html`
   links `../css/site.css`. The `../` prefix is captured and handed straight back,
   while the hash is taken from the path RESOLVED against the page's own folder,
   so one regex serves both depths and neither has to be special-cased. */
let stale = 0, count = 0
for (const page of pages) {
  const file = resolve(ROOT, page)
  const html = readFileSync(file, 'utf8')
  const dir = dirname(file)
  const next = html.replace(
    /(href|src)="((?:\.\.\/)*)((?:css|js)\/[a-z0-9._-]+)(?:\?v=[a-z0-9]+)?"/gi,
    (_, attr, up, path) => {
      count++
      return `${attr}="${up}${path}?v=${stamp(relative(ROOT, resolve(dir, up + path)))}"`
    }
  )
  if (next === html) continue
  stale++
  if (!CHECK) writeFileSync(file, next)
}

if (CHECK) {
  if (stale) { console.error(`\n  asset stamps are STALE in ${stale} page(s). Run: node tools/build.mjs\n`); process.exit(1) }
  console.log(`asset stamps: up to date (${pages.length} pages)`)
} else {
  console.log(`asset stamps: ${count} links versioned across ${pages.length} pages`)
}
