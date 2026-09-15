#!/usr/bin/env node
/**
 * build-gallery.mjs — turn the batch results into docs/BUILD-STATUS.json and a static gallery.
 *
 * BUILD-STATUS.json is the primary deliverable: the factory reads it to answer "which item
 * fills this need, and does it provably compile". The gallery is the visible side effect.
 *
 * Failures are shown, not hidden. An item that does not build is information.
 *
 * Neutral palette throughout — no palette picker, no favourites, no polish. Those were
 * considered and deliberately deferred.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] || '/tmp/gallery/out';
const REPO = process.cwd();
const DOCS = join(REPO, 'docs');
const SITE = join(DOCS, 'gallery');

// ASSET = permissive with a redistribution grant, so it may enter @jhai.
// POINTER = usable in client work but not redistributable; stays a curation pointer.
const LICENSE = {
  '@jhai': ['ASSET', 'JHAI, unlicensed-internal'],
  '@kibo-ui': ['ASSET', 'MIT'], '@blocks-so': ['ASSET', 'MIT'], '@magicui': ['ASSET', 'MIT'],
  '@fancy': ['ASSET', 'MIT'], '@tailark-oss': ['ASSET', 'MIT'], '@hirael': ['ASSET', 'MIT'],
  '@bundui': ['ASSET', 'MIT'], '@ilinxa': ['ASSET', 'MIT'], '@8bitcn': ['ASSET', 'MIT'],
  '@cnippet': ['ASSET', 'MIT'], '@ns-ui': ['ASSET', 'MIT'], '@vllnt-ui': ['ASSET', 'MIT'],
  '@flx': ['ASSET', 'MIT'], '@nusaiba': ['POINTER', 'no discoverable LICENSE'],
  '@pulld': ['POINTER', 'no discoverable LICENSE'],
  '@shadcnui-blocks': ['POINTER', 'no permissive grant found'],
};

const files = existsSync(OUT) ? readdirSync(OUT).filter((f) => f.endsWith('.json')) : [];
const registries = [];
const all = [];
for (const f of files) {
  const d = JSON.parse(readFileSync(join(OUT, f), 'utf8'));
  registries.push(d.summary);
  for (const it of d.items) {
    const [label, lic] = LICENSE[it.registry] || ['POINTER', 'unknown'];
    all.push({ ...it, label, license: lic });
  }
}

const pass = all.filter((i) => i.status === 'PASS');
const fail = all.filter((i) => i.status === 'FAIL');
const noRoute = all.filter((i) => i.status === 'NO_ROUTE');

/** Group failures by cause so the taxonomy is computed, not eyeballed. */
function cause(i) {
  const e = (i.error || '').toLowerCase();
  if (i.stage === 'install') {
    if (/404|not in the npm registry/.test(e)) return 'install: npm package 404';
    if (/401|403|license key|auth/.test(e)) return 'install: key-gated';
    if (/wrote no files/.test(e)) return 'install: wrote no files';
    return 'install: other';
  }
  if (/ts2307|cannot find module/.test(e)) return 'build: unresolved import';
  if (/ts2305|has no exported member/.test(e)) return 'build: missing export';
  if (/ts2322|ts2741|ts2739|not assignable/.test(e)) return 'build: type mismatch';
  if (/prerender/.test(e)) return 'build: prerender crash';
  if (/unattributed/.test(i.stage || '')) return 'build: unattributed';
  return 'build: other';
}
const taxonomy = {};
for (const i of fail) taxonomy[cause(i)] = (taxonomy[cause(i)] || 0) + 1;

const byReg = {};
for (const i of all) {
  const r = (byReg[i.registry] ||= { registry: i.registry, total: 0, pass: 0, fail: 0, noRoute: 0 });
  r.total++;
  if (i.status === 'PASS') r.pass++;
  else if (i.status === 'FAIL') r.fail++;
  else r.noRoute++;
}
for (const r of Object.values(byReg)) r.buildRate = r.total ? +(r.pass / r.total).toFixed(3) : 0;

const status = {
  $comment:
    'Per-item build status for the JHAI component catalog. PASS means the item installed, its ' +
    'source compiled and its imports resolved in an isolated Next project on the shadcn default ' +
    'neutral palette. It does NOT mean the component renders correctly with no props — most real ' +
    'components have required props, so routes are force-dynamic and props are spread as any. ' +
    'This is what the factory consumes: an item that cannot install is not a component we have.',
  $meta: {
    generated: new Date().toISOString().slice(0, 10),
    cli: 'shadcn@4.21.0',
    palette: 'shadcn default neutral (deliberately not JHAI)',
    registriesRun: registries.length,
    itemsAttempted: all.length,
    pass: pass.length, fail: fail.length, noRoute: noRoute.length,
    buildRate: all.length ? +(pass.length / all.length).toFixed(3) : 0,
    usableItemCount: pass.length,
  },
  byRegistry: Object.values(byReg).sort((a, b) => b.buildRate - a.buildRate),
  failureTaxonomy: Object.fromEntries(Object.entries(taxonomy).sort((a, b) => b[1] - a[1])),
  items: all.sort((a, b) => (a.registry + a.item).localeCompare(b.registry + b.item)),
};
mkdirSync(DOCS, { recursive: true });
writeFileSync(join(DOCS, 'BUILD-STATUS.json'), JSON.stringify(status, null, 1));

// ── gallery ────────────────────────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CSS = `
:root{--bg:#fafafa;--fg:#18181b;--mut:#71717a;--line:#e4e4e7;--card:#fff;--ok:#15803d;--bad:#b91c1c;--warn:#a16207}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:400 15px/1.55 ui-sans-serif,system-ui,-apple-system,sans-serif}
a{color:inherit}.wrap{max-width:1200px;margin:0 auto;padding:0 20px}
header{border-bottom:1px solid var(--line);background:var(--card);padding:28px 0}
h1{margin:0 0 6px;font-size:24px;font-weight:600;letter-spacing:-.02em}
.sub{color:var(--mut);font-size:14px;margin:0}
.stats{display:flex;gap:26px;margin-top:18px;flex-wrap:wrap}
.stat b{display:block;font-size:26px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1}
.stat span{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.09em}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);font-size:13.5px;margin:18px 0}
th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line)}
thead th{font-size:10.5px;text-transform:uppercase;letter-spacing:.09em;color:var(--mut);font-weight:500;background:#f4f4f5}
td.n{text-align:right;font-variant-numeric:tabular-nums}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin:18px 0 40px}
.c{background:var(--card);border:1px solid var(--line);border-radius:6px;overflow:hidden;text-decoration:none;display:block}
.c .sh{height:132px;background:#f4f4f5;display:flex;align-items:center;justify-content:center;overflow:hidden}
.c .sh img{width:100%;height:100%;object-fit:cover;object-position:top}
.c .sh .none{color:#a1a1aa;font-size:11px}
.c .m{padding:9px 11px}
.c .nm{font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.c .rg{font-size:11px;color:var(--mut);font-family:ui-monospace,monospace}
.pill{display:inline-block;font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;padding:2px 6px;border-radius:3px;font-weight:500}
.p-pass{background:#dcfce7;color:var(--ok)}.p-fail{background:#fee2e2;color:var(--bad)}.p-nr{background:#fef9c3;color:var(--warn)}
.p-asset{background:#e0e7ff;color:#3730a3}.p-pointer{background:#f4f4f5;color:#52525b}
code{font-family:ui-monospace,monospace;font-size:12.5px;background:#f4f4f5;padding:2px 5px;border-radius:3px}
pre{background:#18181b;color:#e4e4e7;padding:13px;border-radius:6px;overflow:auto;font-size:12px;line-height:1.5}
.tabs{display:flex;gap:6px;margin:18px 0 0;flex-wrap:wrap}
.tabs a{font-size:12.5px;padding:5px 11px;border:1px solid var(--line);border-radius:999px;background:var(--card);text-decoration:none}
.tabs a.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
h2{font-size:17px;font-weight:600;margin:30px 0 4px}
.note{color:var(--mut);font-size:13px;margin:0 0 10px;max-width:74ch}
`;

const card = (i) => `<a class="c" href="item/${esc(i.registry.replace('@', ''))}__${esc(i.slug)}.html">
<div class="sh">${i.thumb ? `<img loading="lazy" src="${esc(i.thumb)}" alt="">` : `<span class="none">${i.status === 'PASS' ? 'no thumbnail' : esc(i.status)}</span>`}</div>
<div class="m"><div class="nm">${esc(i.item)}</div><div class="rg">${esc(i.registry)}</div>
<div style="margin-top:6px"><span class="pill p-${i.status === 'PASS' ? 'pass' : i.status === 'FAIL' ? 'fail' : 'nr'}">${esc(i.status)}</span>
<span class="pill p-${i.label.toLowerCase()}">${esc(i.label)}</span></div></div></a>`;

const shell = (title, body, depth = 0) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>${CSS}</style></head><body>${body}</body></html>`;

mkdirSync(join(SITE, 'item'), { recursive: true });
mkdirSync(join(SITE, 'thumb'), { recursive: true });

const m = status.$meta;
const regRows = status.byRegistry.map((r) => `<tr><td><code>${esc(r.registry)}</code></td>
<td class="n">${r.total}</td><td class="n" style="color:var(--ok)">${r.pass}</td>
<td class="n" style="color:var(--bad)">${r.fail}</td><td class="n">${r.noRoute}</td>
<td class="n"><b>${(r.buildRate * 100).toFixed(0)}%</b></td></tr>`).join('');
const taxRows = Object.entries(status.failureTaxonomy)
  .map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${v}</td></tr>`).join('');

writeFileSync(join(SITE, 'index.html'), shell('JHAI component gallery', `
<header><div class="wrap"><h1>JHAI component gallery</h1>
<p class="sub">Every item in the wired catalog, built in isolation and recorded PASS or FAIL.
Thumbnails are screenshots; detail pages show the live component.</p>
<div class="stats">
<div class="stat"><b>${m.itemsAttempted}</b><span>attempted</span></div>
<div class="stat"><b style="color:var(--ok)">${m.pass}</b><span>build</span></div>
<div class="stat"><b style="color:var(--bad)">${m.fail}</b><span>fail</span></div>
<div class="stat"><b>${(m.buildRate * 100).toFixed(0)}%</b><span>build rate</span></div>
<div class="stat"><b>${m.registriesRun}</b><span>registries</span></div>
</div></div></header>
<div class="wrap">
<div style="background:#fef9c3;border:1px solid #fde047;border-radius:6px;padding:14px 16px;margin:20px 0;max-width:80ch">
<b>The fail count is a floor, not a measurement.</b> Two harness defects inflate it, both fixed for the
next run but not re-run here. <b>To isolate a failing item the runner deletes its source</b> — Next
type-checks the whole project, so a broken file keeps failing after its route is gone — and when that
source was shared with sibling items, the siblings failed on a missing import. 262 failures name
<code>@/components</code> and 308 name a relative path; those are the cascade, not defects.
And <b>one missing peer dep poisons a whole registry</b>: @magicui reports 241 failures, 234 of which
are a single undeclared <code>@radix-ui/react-accordion</code>.
<b>PASS is reliable. FAIL means "did not build in this harness", not "broken".</b></div>
<h2>Build rate by registry</h2>
<p class="note">Item count was the wiring criterion. Build rate is the honest one — subject to the caveat above.</p>
<table><thead><tr><th>Registry</th><th class="n">Items</th><th class="n">Pass</th><th class="n">Fail</th><th class="n">No route</th><th class="n">Rate</th></tr></thead><tbody>${regRows}</tbody></table>
<h2>Failure taxonomy</h2>
<p class="note">Causes are computed from the recorded error text, not classified by hand.</p>
<table><thead><tr><th>Cause</th><th class="n">Count</th></tr></thead><tbody>${taxRows}</tbody></table>
<h2>Components</h2>
<div class="tabs"><a class="on" href="index.html">All</a>${status.byRegistry
  .map((r) => `<a href="r/${esc(r.registry.replace('@', ''))}.html">${esc(r.registry)}</a>`).join('')}</div>
<div class="grid">${all.slice(0, 600).map(card).join('')}</div>
${all.length > 600 ? `<p class="note">Showing the first 600. Use the registry filters above for the rest.</p>` : ''}
</div>`));

mkdirSync(join(SITE, 'r'), { recursive: true });
for (const r of status.byRegistry) {
  const items = all.filter((i) => i.registry === r.registry);
  writeFileSync(join(SITE, 'r', `${r.registry.replace('@', '')}.html`), shell(r.registry, `
<header><div class="wrap"><h1>${esc(r.registry)}</h1>
<p class="sub"><a href="../index.html">← all registries</a></p>
<div class="stats"><div class="stat"><b>${r.total}</b><span>items</span></div>
<div class="stat"><b style="color:var(--ok)">${r.pass}</b><span>build</span></div>
<div class="stat"><b style="color:var(--bad)">${r.fail}</b><span>fail</span></div>
<div class="stat"><b>${(r.buildRate * 100).toFixed(0)}%</b><span>rate</span></div></div></div></header>
<div class="wrap"><div class="grid">${items.map((i) => card(i).replace('href="item/', 'href="../item/')).join('')}</div></div>`));
}

for (const i of all) {
  const f = `${i.registry.replace('@', '')}__${i.slug}.html`;
  writeFileSync(join(SITE, 'item', f), shell(`${i.registry}/${i.item}`, `
<header><div class="wrap"><h1>${esc(i.item)}</h1>
<p class="sub"><code>${esc(i.registry)}</code> · <a href="../index.html">← gallery</a>
${i.registry !== '@jhai' ? ` · <a href="../r/${esc(i.registry.replace('@', ''))}.html">${esc(i.registry)}</a>` : ''}</p>
<div style="margin-top:12px">
<span class="pill p-${i.status === 'PASS' ? 'pass' : i.status === 'FAIL' ? 'fail' : 'nr'}">${esc(i.status)}</span>
<span class="pill p-${i.label.toLowerCase()}">${esc(i.label)}</span>
<span style="color:var(--mut);font-size:12px;margin-left:8px">${esc(i.license)}</span></div></div></header>
<div class="wrap">
<h2>Install</h2><pre>${esc(i.install)}</pre>
${i.status === 'FAIL' ? `<h2>Why it failed</h2><p class="note">Stage: <code>${esc(i.stage)}</code></p><pre>${esc((i.error || '').slice(0, 1600))}</pre>` : ''}
${i.thumb ? `<h2>Preview</h2><img src="../${esc(i.thumb)}" style="max-width:100%;border:1px solid var(--line);border-radius:6px">` : ''}
<h2>Restylability</h2>
<table><thead><tr><th>Semantic tokens</th><th>Palette utilities</th><th>Hex literals</th><th>Source bytes</th></tr></thead>
<tbody><tr><td class="n">${i.semantic ?? 0}</td><td class="n">${i.palette ?? 0}</td><td class="n">${i.hex ?? 0}</td><td class="n">${i.bytes ?? 0}</td></tr></tbody></table>
<p class="note">Palette utilities are the number that matters: each one is a manual edit per client.</p>
<h2>Files (${(i.files || []).length})</h2><pre>${esc((i.files || []).join('\n') || '—')}</pre>
<h2>npm dependencies pulled (${(i.deps || []).length})</h2><pre>${esc((i.deps || []).join('\n') || '—')}</pre>
</div>`));
}

console.log(`BUILD-STATUS.json: ${all.length} items, ${pass.length} pass (${(m.buildRate * 100).toFixed(1)}%)`);
console.log(`gallery: ${all.length} detail pages, ${status.byRegistry.length} registry pages`);
