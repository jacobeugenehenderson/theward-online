#!/usr/bin/env node
/**
 * build-license — renders each licence page from its own source file.
 *
 * ⭐ THE AGREEMENT LIVES IN ONE FILE AND THE PAGE IS DERIVED FROM IT. A legal
 * instrument under review is revised repeatedly; hand-marking-up HTML each time
 * guarantees the published text and the working text drift apart, and on this
 * document a drift is not a typo — it is a term nobody agreed to.
 * ⛔ SO DO NOT EDIT works/license/index.html. Edit the source and re-run.
 * `--check` fails if the page on disk is not what the source renders, which is
 * how tools/build.mjs catches an edit made in the wrong place.
 *
 * Source format, deliberately small:
 *   # title          the document title
 *   >> line          the kicker above the title
 *   > line           the standing notice under it
 *   ## N. HEADING    a numbered section (also the contents list)
 *   ### N.N Heading  a subsection
 *   - item           a list item
 *   = key: value     a Ward Schedule field
 *   anything else    a paragraph
 *
 * ⭐ ONE GENERATOR, TWO DOCUMENTS. The Developer agreement is a sibling of the
 * Platform one and they share every rule of presentation; a second copy of this
 * file would drift the way duplicated commitments drift, which is the failure
 * §9.1 of the Developer agreement exists to avoid.
 *
 *   node tools/build-license.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const DOCS = [
  {
    src: 'tools/license-source.md',
    out: 'works/license/index.html',
    dir: 'license',
    title: 'Platform License Agreement',
    desc: "A working draft of The Ward's Platform License Agreement: the Local Host relationship, the platform commitments, operating responsibilities, and commercial structure.",
    sibling: { slug: 'developer-license', name: 'Developer License Agreement',
               text: 'The licence for an organization authorized to develop, provision, or deploy Wards using designated portions of the Platform.' },
  },
  {
    src: 'tools/developer-license-source.md',
    out: 'works/developer-license/index.html',
    dir: 'developer-license',
    title: 'Developer License Agreement',
    desc: 'A working draft of The Ward\u2019s Developer License Agreement: Developer Materials, authorized deployment, the incorporated platform commitments, and downstream operation.',
    sibling: { slug: 'license', name: 'Platform License Agreement',
               text: 'The licence under which a Local Host operates a single Ward, and the home of the Platform Commitments this agreement incorporates.' },
  },
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ⭐ ONE INLINE FORM ONLY: [text](href). The Developer agreement incorporates
// the Platform Commitments by reference, and a reader hitting that sentence
// should be able to go and read them rather than be told where they live.
const inline = (t) => esc(t).replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

function render(doc) {
  const lines = readFileSync(resolve(ROOT, doc.src), 'utf8').split('\n')
  let kicker = '', notice = ''
  const sections = []
  let cur = { label: '', id: 'preamble', blocks: [] }
  sections.push(cur)
  let list = null, fields = null

  const closeRuns = () => {
    if (list)   { cur.blocks.push(`<ul class="lic-list">${list.join('')}</ul>`); list = null }
    if (fields) { cur.blocks.push(`<dl class="lic-fields">${fields.join('')}</dl>`); fields = null }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { closeRuns(); continue }
    if (line.startsWith('# '))   { continue }
    if (line.startsWith('>> '))  { kicker = line.slice(3); continue }
    if (line.startsWith('> '))   { notice = line.slice(2); continue }
    if (line.startsWith('## ')) {
      closeRuns()
      const label = line.slice(3)
      cur = { label, id: slug(label), blocks: [] }
      sections.push(cur)
      continue
    }
    if (line.startsWith('### ')) {
      closeRuns()
      cur.blocks.push(`<h3 class="lic-sub" id="${slug(line.slice(4))}">${inline(line.slice(4))}</h3>`)
      continue
    }
    if (line.startsWith('- ')) { (list ??= []).push(`<li>${inline(line.slice(2))}</li>`); continue }
    if (line.startsWith('= ')) {
      const [, k, v] = /^= ([^:]+):\s*(.*)$/.exec(line) ?? []
      if (k) { (fields ??= []).push(`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`) }
      continue
    }
    closeRuns()
    cur.blocks.push(`<p>${inline(line)}</p>`)
  }
  closeRuns()

  const preamble = sections.shift()

  const contents = sections
    .filter(s => /^\d/.test(s.label))
    .map(s => {
      const [, n, rest] = /^(\d+)\.\s*(.*)$/.exec(s.label) ?? []
      return `      <a href="#${s.id}"><span class="pro-index-n">${n}</span><span class="pro-index-t">${esc(rest)}</span></a>`
    }).join('\n')

  const body = sections.map(s =>
    `  <section class="sec lic-sec" id="${s.id}">\n` +
    `    <h2 class="lic-h">${esc(s.label)}</h2>\n` +
    s.blocks.map(b => '    ' + b).join('\n') + '\n  </section>'
  ).join('\n\n')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${doc.title} &mdash; The Ward</title>
<meta name="description" content="${doc.desc}">
<!-- ⛔ GENERATED BY tools/build-license.mjs FROM ${doc.src}.
     Do not edit this file; edit the source and re-run. tools/build.mjs
     --check fails if the two disagree.
     ⛔ NOINDEX, on the same grounds as the rest of /works — and more so here:
     an unexecuted draft agreement is a document sent to a person for review,
     not a published set of terms. -->
<meta name="robots" content="noindex, nofollow">
<meta property="og:type" content="article">
<meta property="og:site_name" content="The Ward">
<meta property="og:url" content="https://theward.online/works/${doc.dir}/">
<meta property="og:title" content="${doc.title} &mdash; The Ward">
<meta property="og:description" content="${doc.desc}">
<meta property="og:image" content="https://theward.online/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Ward's mark: a heavy ring open at the top, a faint street grid across its centre, and an amber light in the gap.">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">
<link rel="stylesheet" href="../../css/tokens.css">
<link rel="stylesheet" href="../../css/site.css">
<link rel="icon" href="../../assets/favicon.svg" type="image/svg+xml">
</head>
<body>

<a class="skip" href="#main">Skip to content</a>

<header class="shell">
  <div class="band">
    <svg class="band-mark" viewBox="0 0 120 120" role="img" aria-label="The Ward">
      <defs><clipPath id="mark-clip"><circle cx="60" cy="60" r="40"/></clipPath></defs>
      <path d="M76.8 14 A 49 49 0 1 1 43.2 14" fill="none" stroke="currentColor" stroke-width="11"/>
      <g clip-path="url(#mark-clip)" stroke="currentColor" stroke-width="2.5" opacity="0.5">
        <path d="M38 8 V112 M82 8 V112 M8 38 H112 M8 82 H112"/>
      </g>
      <circle cx="60" cy="14" r="9.5" fill="var(--live)"/>
    </svg>
    <span class="band-text">
      <span class="band-name">The Ward</span>
      <span class="band-meta"><a href="../../">Digital presence for real neighborhoods</a></span>
    </span>
    <!-- ⭐ THE TWO AGREEMENTS FACE EACH OTHER, the guide↔handbook shape: one
         governs operating a Ward, the other developing and deploying them, and
         a reader evaluating either immediately asks about the other. -->
    <span class="band-links">
      <a class="band-cta" href="../${doc.sibling.slug}/">${doc.sibling.name}</a>
    </span>
  </div>
</header>

<main class="shell lic" id="main">

  <section class="sec pro-head">
    <p class="pro-kicker">${esc(kicker)}</p>
    <h1>${esc(doc.title)}</h1>
    <p class="lede">${inline(notice)}</p>
  </section>

  <section class="sec">
${preamble.blocks.map(b => '    ' + b).join('\n')}

    <nav class="pro-index" aria-label="Sections">
${contents}
    </nav>
  </section>

${body}

</main>

<footer class="shell">
  <div class="colophon">
    <div class="colophon-row">
      <span class="colophon-k">${doc.sibling.name}</span>
      <span>${doc.sibling.text} <a href="../${doc.sibling.slug}/">Read the draft &rarr;</a></span>
    </div>
    <div class="colophon-row">
      <span class="colophon-k">Works</span>
      <span>How a neighborhood is actually constructed &mdash; the sources, the pipeline, and the instruments that build a Ward. <a href="../">See the works &rarr;</a></span>
    </div>
    <div class="colophon-row">
      <span class="colophon-k">The Ask</span>
      <span>What it would cost to staff and run this properly, under each of the three shapes the money could take. <a href="../ask/">Open the tool &rarr;</a></span>
    </div>
    <div class="colophon-row">
      <span class="colophon-k">The Split</span>
      <span>Where a single delivery order&rsquo;s money goes, and what the same order costs on the incumbents. <a href="../split/">Open the tool &rarr;</a></span>
    </div>
    <div class="colophon-row">
      <span class="colophon-k">Legal</span>
      <span>What you may and may not rely on here, what belongs to whom, and what visiting or discussing The Ward does and does not establish. <a href="../../legal.html">Read the terms &rarr;</a></span>
    </div>
    <div class="colophon-foot">
      <span>&copy; 2026 <a href="https://jacobhenderson.studio">Jacob Henderson</a> LLC</span>
    </div>
  </div>
</footer>

</body>
</html>
`
}

// ⛔ build.mjs stamps `?v=<hash>` onto every local css/js link AFTER this runs,
// so a literal comparison is guaranteed to fail. The claim is about the TEXT of
// the document, not the cache stamp.
const bare = (s) => s.replace(/\?v=[0-9a-f]+/g, '')
let bad = 0
for (const doc of DOCS) {
  const page = render(doc)
  const out = resolve(ROOT, doc.out)
  if (CHECK) {
    let onDisk = ''
    try { onDisk = readFileSync(out, 'utf8') } catch {}
    if (bare(onDisk) !== bare(page)) {
      console.error(`license: ${doc.out} is not what ${doc.src} renders — run node tools/build-license.mjs`)
      bad++
    }
  } else {
    writeFileSync(out, page)
    console.log(`license: ${doc.title} rendered from ${doc.src}`)
  }
}
if (CHECK) {
  if (bad) process.exit(1)
  console.log('license: every page matches its source')
}
