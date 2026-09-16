#!/usr/bin/env node
/**
 * build-gallery.mjs — turn the run's per-registry records into the two deliverables.
 *
 *   docs/BUILD-STATUS.json        the primary artefact, consumed by the site factory. Every item,
 *                                 its verdict, and enough to install and judge it. Error text is
 *                                 truncated to its first line so the file stays queryable.
 *   docs/build-errors-<date>.json the full error text, separated so a multi-megabyte blob is never
 *                                 in the loop when the factory only wants the taxonomy.
 *   docs/gallery/                 a static browse surface on the existing Pages site. Neutral
 *                                 palette. Screenshots for what renders; failures listed with
 *                                 their reason, because a catalogue that hides its failures is how
 *                                 run 1's numbers went unquestioned for a whole pass.
 *
 * VERDICTS, and what each one means for the factory
 *   USABLE        built, mounted in a real browser, and rendered something visible. Countable.
 *   NEEDS_PROPS   built, but crashed under the harness's invented props. Almost certainly fine with
 *                 real content; not counted as usable, because that has not been proven here.
 *   BUILDS_BLANK  built and rendered nothing. Worse than a failure: it would be picked and ship empty.
 *   RENDER_CRASH  built, then crashed for a reason that is not the harness's prop guess.
 *   FAIL          attributed to this item's own source.
 *   UNATTRIBUTED  something in the batch was broken and the blame could not be pinned on one item.
 *   NO_ROUTE      installed, but exports nothing mountable — hooks, CSS, themes, utilities.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), [])
);
const ROOT = args.root || process.cwd();
const IN = args.in || '/tmp/gallery2/out';
const SHOTS = args.shots || '/tmp/gallery2/shots';
const DOCS = join(ROOT, 'docs');
const GAL = join(DOCS, 'gallery');
const DATE = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const firstLine = (s) => String(s || '').split('\n').map((l) => l.trim()).filter(Boolean)[0]?.slice(0, 240) || '';

const licenses = existsSync(join(DOCS, 'LICENSES.json'))
  ? JSON.parse(readFileSync(join(DOCS, 'LICENSES.json'), 'utf8')).registries : {};
const curation = existsSync(join(DOCS, 'CURATION.json'))
  ? JSON.parse(readFileSync(join(DOCS, 'CURATION.json'), 'utf8')) : { entries: [] };
const curatedSpecs = new Set((curation.entries || []).map((e) => e.choice).filter(Boolean));

/** Merge a registry's chunks back together; the chunking was a build-time concern only. */
function load() {
  const byReg = new Map();
  for (const f of readdirSync(IN)) {
    if (!f.endsWith('.json') || f.endsWith('.render.json')) continue;
    const rec = JSON.parse(readFileSync(join(IN, f), 'utf8'));
    const renderPath = join(IN, f.replace(/\.json$/, '.render.json'));
    const render = existsSync(renderPath) ? JSON.parse(readFileSync(renderPath, 'utf8')) : { rendered: {} };
    const reg = rec.summary.registry;
    if (!byReg.has(reg)) {
      byReg.set(reg, { registry: reg, items: [], chunks: [], clobbers: [], palette: [], totalItems: 0 });
    }
    const g = byReg.get(reg);
    g.chunks.push(rec.summary);
    g.totalItems = Math.max(g.totalItems, rec.summary.totalItems || 0);
    g.clobbers.push(...(rec.clobbers || []));
    if (render.palette) g.palette.push(render.palette);
    for (const it of rec.items) g.items.push({ ...it, render: render.rendered?.[it.slug] });
  }
  return [...byReg.values()];
}

function verdictOf(it) {
  if (it.status !== 'BUILT') return it.status;
  const r = it.render?.render;
  if (r === 'RENDERS') return 'USABLE';
  if (r === 'BLANK') return 'BUILDS_BLANK';
  if (r === 'CRASH_PROPS') return 'NEEDS_PROPS';
  if (r === 'CRASH') return 'RENDER_CRASH';
  return 'BUILT_NOT_RENDERED';
}

const primitiveOf = (it) => {
  const p = it.primitives || {};
  const on = [p.baseUi && 'base-ui', p.radix && 'radix', p.reactAria && 'react-aria', p.arkUi && 'ark-ui'].filter(Boolean);
  return on.length ? on.join('+') : 'none';
};

const groups = load();
const errors = {};
const statusRank = ['USABLE', 'NEEDS_PROPS', 'BUILDS_BLANK', 'RENDER_CRASH', 'BUILT_NOT_RENDERED',
                    'FAIL', 'UNATTRIBUTED', 'NO_ROUTE', 'NO_FILES'];

const registries = [];
for (const g of groups) {
  const lic = licenses[g.registry] || { label: 'UNVERIFIED' };
  const counts = Object.fromEntries(statusRank.map((s) => [s, 0]));
  const prim = { 'base-ui': 0, radix: 0, 'react-aria': 0, 'ark-ui': 0, none: 0, mixed: 0 };
  for (const it of g.items) {
    it.verdict = verdictOf(it);
    counts[it.verdict] = (counts[it.verdict] || 0) + 1;
    const p = primitiveOf(it);
    if (p.includes('+')) prim.mixed++; else prim[p] = (prim[p] || 0) + 1;
    if (it.error) {
      errors[`${g.registry}/${it.item}`] = it.error;
      it.errorFirstLine = firstLine(it.error);
      delete it.error;
    }
  }
  const attempted = g.items.length;
  registries.push({
    registry: g.registry,
    license: lic.label || 'UNVERIFIED',
    licenseWhy: lic.why,
    repo: lic.repo || null,
    totalItems: g.totalItems || attempted,
    attempted,
    counts,
    usableRate: attempted ? +(counts.USABLE / attempted).toFixed(3) : 0,
    primitiveBase: prim,
    dominantBase: Object.entries(prim).filter(([k, v]) => k !== 'none' && v > 0)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
    writesSharedUi: g.items.filter((i) => i.writesSharedUi).length,
    primitiveClobbers: g.clobbers,
    paletteChecks: g.palette,
    chunks: g.chunks.map((c) => ({ tag: c.tag, offset: c.offset, attempted: c.attempted,
                                   buildOk: c.buildOk, typecheckOk: c.typecheckOk,
                                   deadlineHit: c.deadlineHit, sharedFiles: c.sharedFiles })),
  });
}
registries.sort((a, b) => b.usableRate - a.usableRate);

const allItems = groups.flatMap((g) => g.items.map((it) => ({
  registry: g.registry,
  item: it.item,
  slug: it.slug,
  verdict: it.verdict,
  stage: it.stage || null,
  title: it.title || null,
  description: it.description || null,
  itemType: it.itemType || null,
  install: it.install,
  license: (licenses[g.registry] || {}).label || 'UNVERIFIED',
  primitiveBase: primitiveOf(it),
  writesSharedUi: !!it.writesSharedUi,
  curated: curatedSpecs.has(`${g.registry}/${it.item}`),
  files: it.files || [],
  deps: it.deps || [],
  registryDeps: it.registryDeps || [],
  semantic: it.semantic ?? 0,
  palette: it.palette ?? 0,
  hex: it.hex ?? 0,
  bytes: it.bytes ?? 0,
  retokenRisk: (it.palette ?? 0) + (it.hex ?? 0) > 3 * ((it.semantic ?? 0) + 1) ? 'HIGH-RETOKEN' : 'ok',
  shot: it.render?.shot || null,
  visibleNodes: it.render?.visible ?? null,
  error: it.errorFirstLine || null,
})));

const totals = Object.fromEntries(statusRank.map((s) => [s, allItems.filter((i) => i.verdict === s).length]));
const status = {
  $comment: 'Primary artefact of the run-2 build verification. One record per catalogue item. '
    + 'USABLE means the item installed, compiled, and rendered something visible in a real browser '
    + 'on the shadcn default neutral palette. Error text is the first line only; the full text is in '
    + `build-errors-${DATE}.json keyed by "<registry>/<item>".`,
  $verdicts: {
    USABLE: 'built and rendered visibly — countable as a component we actually have',
    NEEDS_PROPS: 'built, but crashed under the harness’s invented props; almost certainly fine with real content, not proven here',
    BUILDS_BLANK: 'built and rendered nothing — worse than a failure, because it would be picked and ship empty',
    RENDER_CRASH: 'built, then crashed at render for a reason that is not the harness’s prop guess',
    FAIL: 'attributed to this item’s own source',
    UNATTRIBUTED: 'something in the batch was broken and the blame could not be pinned on one item',
    NO_ROUTE: 'installed, but exports nothing mountable — hooks, CSS, themes and utilities land here',
    NO_FILES: 'install reported success but no file could be attributed to this item',
  },
  $method: {
    date: DATE,
    cli: 'shadcn@4.21.0',
    scaffold: 'create-next-app, Next 16, React 19, Tailwind v4, shadcn new-york, baseColor neutral',
    peers: 'the ordinary peer surface pre-installed before any item — see scripts/gallery/lib/peers.mjs',
    isolation: 'one throwaway project per registry, chunked at 400 items, one route per item',
    typeErrors: 'attributed by a single tsc --noEmit pass, by file, with no deletion',
    render: 'next start plus headless Chromium; two fixture passes, string-shaped then list-shaped',
    palette: 'per-registry sample re-rendered with the semantic tokens overridden to absurd values',
  },
  $totals: { registries: registries.length, items: allItems.length, ...totals },
  registries,
  items: allItems,
};

mkdirSync(DOCS, { recursive: true });
writeFileSync(join(DOCS, 'BUILD-STATUS.json'), JSON.stringify(status, null, 1));
writeFileSync(join(DOCS, `build-errors-${DATE}.json`), JSON.stringify({
  $comment: 'Full error text for every non-usable item, keyed by "<registry>/<item>". Split out of '
    + 'BUILD-STATUS.json so the taxonomy stays queryable without loading a multi-megabyte blob.',
  $date: DATE, errors,
}, null, 1));

/* ---------------------------------------------------------------- gallery */

const CSS = `
:root{--bg:#f6f6f5;--paper:#fff;--ink:#1c1c1b;--ink-2:#55554f;--ink-3:#7a7a73;
  --line-soft:rgba(0,0,0,.055);--ok:#2f6b4f;--warn:#8a6d1f;--bad:#9c3b32;
  --mono:ui-monospace,SFMono-Regular,Menlo,monospace}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:400 15px/1.55 ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
header{background:#111110;color:#eceae6;padding:46px 0 40px}
.eyebrow{font-family:var(--mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#9fb3ad;margin:0 0 14px}
h1{font-size:clamp(26px,3.4vw,38px);line-height:1.08;letter-spacing:-.03em;font-weight:500;margin:0 0 14px}
.lede{color:#b3b1ab;max-width:72ch;margin:0;font-size:15px}
section{padding:34px 0}
h2{font-size:22px;font-weight:500;letter-spacing:-.02em;margin:0 0 4px}
.sub{color:var(--ink-3);margin:0 0 20px;font-size:14px;max-width:88ch}
a{color:#3c6360;text-underline-offset:.22em}
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line-soft);border:1px solid var(--line-soft);margin:0 0 6px}
.stats div{background:var(--paper);padding:16px}
.stats .n{font-size:26px;font-weight:500;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1}
.stats .k{font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);margin-top:8px}
table{width:100%;border-collapse:collapse;background:var(--paper);border:1px solid var(--line-soft);font-size:14px}
th,td{text-align:left;padding:10px 13px;border-bottom:1px solid var(--line-soft);vertical-align:top}
thead th{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);font-weight:500;background:#fafaf9;white-space:nowrap}
td.num{font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}
code{font-family:var(--mono);font-size:12px;background:#eeedeb;padding:1px 5px;border-radius:3px}
.tag{display:inline-block;font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;padding:2px 6px;border-radius:3px;white-space:nowrap}
.t-USABLE{background:#e4efe9;color:var(--ok)}
.t-NEEDS_PROPS{background:#f3eddd;color:var(--warn)}
.t-BUILDS_BLANK,.t-RENDER_CRASH,.t-FAIL{background:#f6e6e3;color:var(--bad)}
.t-UNATTRIBUTED,.t-NO_ROUTE,.t-NO_FILES,.t-BUILT_NOT_RENDERED{background:#eeecea;color:var(--ink-3)}
.t-ASSET{background:#e4efe9;color:var(--ok)}.t-POINTER{background:#f3eddd;color:var(--warn)}
.t-OWN{background:#e7ecf3;color:#3a5877}.t-UNVERIFIED{background:#eeecea;color:var(--ink-3)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:14px}
.card{background:var(--paper);border:1px solid var(--line-soft);overflow:hidden;display:block;text-decoration:none;color:inherit}
.card .shot{height:150px;background:#fbfbfa;display:block;overflow:hidden;border-bottom:1px solid var(--line-soft)}
.card .shot img{width:100%;display:block}
.card .meta{padding:9px 11px}
.card .nm{font-size:13px;font-weight:500;word-break:break-word;display:block}
.card .rg{font-family:var(--mono);font-size:10px;color:var(--ink-3);margin-top:3px;display:block}
.note{border-left:2px solid #8a6d1f;background:#fdfaf1;padding:12px 16px;margin:0 0 22px;font-size:14px;max-width:88ch}
footer{padding:36px 0 60px;color:var(--ink-3);font-size:13px}
.shotbox{background:var(--paper);border:1px solid var(--line-soft);padding:10px}
.shotbox img{max-width:100%;display:block}
pre{background:#f1f0ee;padding:12px;overflow:auto;font-size:12px;border:1px solid var(--line-soft)}
`;

const page = (title, body, depth = 0) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${CSS}</style></head><body>${body}
<footer><div class="wrap">Built ${DATE} by <code>scripts/gallery/run-all.sh</code> on the shadcn default
neutral palette. <a href="${'../'.repeat(depth)}index.html">gallery index</a> ·
<a href="https://github.com/JustinHarrisAI/jhai-registry">jhai-registry</a></div></footer>
</body></html>`;

mkdirSync(join(GAL, 'shots'), { recursive: true });
mkdirSync(join(GAL, 'i'), { recursive: true });
mkdirSync(join(GAL, 'r'), { recursive: true });

// The median screenshot is under 4 KB, so the whole set fits in the repo and Pages serves it with
// no build step. Anything whose file did not survive loses its thumbnail rather than 404ing.
let copied = 0;
for (const it of allItems) {
  if (!it.shot) continue;
  const src = join(SHOTS, it.shot);
  if (!existsSync(src)) { it.shot = null; continue; }
  const dst = join(GAL, 'shots', it.shot);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  copied++;
}

const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
const tag = (v) => `<span class="tag t-${v}">${String(v).replace(/_/g, ' ')}</span>`;
const href = (i) => `${i.registry.replace('@', '')}--${i.slug}.html`;

const t = status.$totals;
const rows = registries.map((r) => {
  const c = r.counts;
  const pal = [...new Set(r.paletteChecks.map((p) => p.verdict).filter(Boolean))];
  return `<tr>
    <td><a href="r/${r.registry.replace('@', '')}.html"><code>${esc(r.registry)}</code></a>
        ${r.primitiveClobbers.length ? ' <span class="tag t-FAIL">clobbers ui/</span>' : ''}</td>
    <td><span class="tag t-${r.license}">${r.license}</span></td>
    <td><code>${esc(r.dominantBase)}</code></td>
    <td class="num">${r.attempted}</td>
    <td class="num"><strong>${c.USABLE}</strong></td>
    <td class="num">${pct(c.USABLE, r.attempted)}%</td>
    <td class="num">${c.NEEDS_PROPS}</td>
    <td class="num">${c.BUILDS_BLANK + c.RENDER_CRASH}</td>
    <td class="num">${c.FAIL}</td>
    <td class="num">${c.UNATTRIBUTED}</td>
    <td class="num">${c.NO_ROUTE + c.NO_FILES}</td>
    <td>${pal.length ? esc(pal.join(', ')) : '—'}</td>
  </tr>`;
}).join('\n');

const featured = allItems.filter((i) => i.verdict === 'USABLE' && i.shot).slice(0, 60);
writeFileSync(join(GAL, 'index.html'), page('JHAI registry — build status', `
<header><div class="wrap">
  <p class="eyebrow">jhai-registry · build verification · ${DATE}</p>
  <h1>${t.items.toLocaleString()} catalogue items, installed, compiled and mounted.</h1>
  <p class="lede">Every item in all ${registries.length} wired registries was installed into a throwaway
  Next.js 16 project on the shadcn default neutral palette, typechecked, built, and then mounted in a
  headless browser. <strong>USABLE</strong> means it rendered something visible. Failures are listed with
  their reason rather than hidden.</p>
</div></header>

<section><div class="wrap">
  <div class="stats">
    <div><div class="n">${t.items.toLocaleString()}</div><div class="k">items attempted</div></div>
    <div><div class="n">${t.USABLE.toLocaleString()}</div><div class="k">usable · rendered</div></div>
    <div><div class="n">${pct(t.USABLE, t.items)}%</div><div class="k">usable rate</div></div>
    <div><div class="n">${(t.FAIL + t.UNATTRIBUTED).toLocaleString()}</div><div class="k">failed or unattributed</div></div>
    <div><div class="n">${t.NO_ROUTE.toLocaleString()}</div><div class="k">nothing to mount</div></div>
  </div>
  <p class="sub">NEEDS PROPS (${t.NEEDS_PROPS.toLocaleString()}) built cleanly and crashed only on the
  props this harness invented for them; they are not counted as usable because that was not proven.
  BUILDS BLANK (${t.BUILDS_BLANK}) compiled and drew nothing, which is the failure mode that would
  otherwise reach a client site unnoticed. NO MOUNT is mostly hooks, CSS and theme items, which are
  real catalogue entries with nothing for a screenshot to show.</p>
</div></section>

<section><div class="wrap">
  <h2>By registry</h2>
  <p class="sub">Sorted by usable rate. “Clobbers ui/” marks a registry that overwrote a shared
  <code>components/ui/*</code> file with a different primitive base.</p>
  <table><thead><tr>
    <th>registry</th><th>licence</th><th>base</th><th>items</th><th>usable</th><th>rate</th>
    <th>needs props</th><th>blank/crash</th><th>fail</th><th>unattr</th><th>no mount</th><th>palette</th>
  </tr></thead><tbody>${rows}</tbody></table>
</div></section>

<section><div class="wrap">
  <h2>A sample of what renders</h2>
  <p class="sub">First ${featured.length} usable items. Neutral palette, no styling applied by this page.</p>
  <div class="grid">
    ${featured.map((i) => `<a class="card" href="i/${href(i)}">
      <span class="shot"><img loading="lazy" src="shots/${esc(i.shot)}" alt=""></span>
      <span class="meta"><span class="nm">${esc(i.item)}</span><span class="rg">${esc(i.registry)}</span></span>
    </a>`).join('\n')}
  </div>
</div></section>
`));

for (const r of registries) {
  const items = allItems.filter((i) => i.registry === r.registry)
    .sort((a, b) => statusRank.indexOf(a.verdict) - statusRank.indexOf(b.verdict) || a.item.localeCompare(b.item));
  const shots = items.filter((i) => i.verdict === 'USABLE' && i.shot);
  const clobNote = r.primitiveClobbers.length ? `<div class="note"><strong>Primitive clobber.</strong>
    This registry overwrote a shared <code>components/ui/*</code> file with a different primitive base:
    ${r.primitiveClobbers.slice(0, 4).map((c) => `<code>${esc(c.file)}</code> ${esc(c.from)} to ${esc(c.to)}`).join(', ')}.
    Installing it into a project built on the other base changes that project’s primitives underneath it.</div>` : '';
  writeFileSync(join(GAL, 'r', `${r.registry.replace('@', '')}.html`), page(`${r.registry} — build status`, `
<header><div class="wrap">
  <p class="eyebrow"><a href="../index.html" style="color:#9fb3ad">gallery</a> · ${DATE}</p>
  <h1><code style="background:none;color:inherit;font-size:.8em">${esc(r.registry)}</code></h1>
  <p class="lede">${r.counts.USABLE} of ${r.attempted} items rendered.
  Licence <strong>${r.license}</strong> — ${esc(r.licenseWhy || '')}${r.repo ? ` (<code>${esc(r.repo)}</code>)` : ''}.
  Dominant primitive base: <strong>${esc(r.dominantBase)}</strong>.</p>
</div></header>
<section><div class="wrap">
  ${clobNote}
  <div class="grid">${shots.map((i) => `<a class="card" href="../i/${href(i)}">
    <span class="shot"><img loading="lazy" src="../shots/${esc(i.shot)}" alt=""></span>
    <span class="meta"><span class="nm">${esc(i.item)}</span><span class="rg">${esc(i.itemType || '')}</span></span></a>`).join('\n')}</div>
</div></section>
<section><div class="wrap">
  <h2>Every item</h2>
  <p class="sub">Including what failed and why. The first line of the error is shown; the full text is in
  <code>docs/build-errors-${DATE}.json</code>.</p>
  <table><thead><tr><th>item</th><th>verdict</th><th>base</th><th>tokens</th><th>reason</th></tr></thead><tbody>
  ${items.map((i) => `<tr>
    <td>${i.shot ? `<a href="../i/${href(i)}">${esc(i.item)}</a>` : esc(i.item)}
        ${i.curated ? ' <span class="tag t-OWN">curated</span>' : ''}</td>
    <td>${tag(i.verdict)}</td>
    <td><code>${esc(i.primitiveBase)}</code></td>
    <td class="num">${i.semantic}/${i.palette}/${i.hex}${i.retokenRisk === 'HIGH-RETOKEN' ? ' <span class="tag t-NEEDS_PROPS">retoken</span>' : ''}</td>
    <td>${esc(i.error || '')}</td></tr>`).join('\n')}
  </tbody></table>
  <p class="sub">The tokens column is semantic / palette / hex occurrences in the installed source.
  A high palette or hex count against few semantic tokens means the item resists a client palette.</p>
</div></section>
`, 1));
}

let detail = 0;
for (const i of allItems) {
  if (i.verdict !== 'USABLE' || !i.shot) continue;
  writeFileSync(join(GAL, 'i', href(i)), page(`${i.registry}/${i.item}`, `
<header><div class="wrap">
  <p class="eyebrow"><a href="../index.html" style="color:#9fb3ad">gallery</a> ·
     <a href="../r/${i.registry.replace('@', '')}.html" style="color:#9fb3ad">${esc(i.registry)}</a></p>
  <h1>${esc(i.title || i.item)}</h1>
  <p class="lede">${esc(i.description || '')}</p>
</div></header>
<section><div class="wrap">
  <div class="shotbox"><img src="../shots/${esc(i.shot)}" alt="${esc(i.item)} rendered on the neutral palette"></div>
  <p class="sub">Rendered on the shadcn default neutral palette with harness-generated props.</p>
  <h2>Install</h2>
  <pre>${esc(i.install)}</pre>
  <table><tbody>
    <tr><th>licence</th><td><span class="tag t-${i.license}">${i.license}</span></td></tr>
    <tr><th>primitive base</th><td><code>${esc(i.primitiveBase)}</code></td></tr>
    <tr><th>type</th><td><code>${esc(i.itemType || '—')}</code></td></tr>
    <tr><th>files</th><td>${i.files.map((f) => `<code>${esc(f)}</code>`).join('<br>') || '—'}</td></tr>
    <tr><th>npm deps pulled</th><td>${i.deps.map((d) => `<code>${esc(d)}</code>`).join(' ') || 'none beyond the pre-installed peer set'}</td></tr>
    <tr><th>registry deps</th><td>${(i.registryDeps || []).map((d) => `<code>${esc(d)}</code>`).join(' ') || '—'}</td></tr>
    <tr><th>semantic / palette / hex</th><td>${i.semantic} / ${i.palette} / ${i.hex} ${i.retokenRisk === 'HIGH-RETOKEN' ? '<span class="tag t-NEEDS_PROPS">high retoken cost</span>' : ''}</td></tr>
    <tr><th>writes shared ui/</th><td>${i.writesSharedUi ? 'yes — can overwrite the project’s own primitives' : 'no'}</td></tr>
  </tbody></table>
</div></section>
`, 1));
  detail++;
}

console.log(`BUILD-STATUS.json: ${allItems.length} items, ${totals.USABLE} usable across ${registries.length} registries`);
console.log(`gallery: ${copied} screenshots, ${detail} detail pages, ${registries.length} registry pages`);
console.log(Object.entries(totals).map(([k, v]) => `${k}=${v}`).join(' '));
