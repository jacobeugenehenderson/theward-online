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
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const args = CHECK ? ['--check'] : []

for (const tool of ['build-sources.mjs', 'build-sky.mjs']) {
  execFileSync('node', [resolve(ROOT, 'tools', tool), ...args], { stdio: 'inherit', cwd: ROOT })
}

const indexPath = resolve(ROOT, 'index.html')
let html = readFileSync(indexPath, 'utf8')

const stamped = html.replace(
  /(href|src)="((?:css|js)\/[a-z0-9._-]+)(?:\?v=\d+)?"/gi,
  (_, attr, path) => `${attr}="${path}?v=${Math.floor(statSync(resolve(ROOT, path)).mtimeMs)}"`
)

if (CHECK) {
  if (stamped !== html) { console.error('\n  asset stamps are STALE. Run: node tools/build.mjs\n'); process.exit(1) }
  console.log('asset stamps: up to date')
} else {
  writeFileSync(indexPath, stamped)
  const n = (stamped.match(/\?v=\d+/g) || []).length
  console.log(`asset stamps: ${n} local assets versioned`)
}
