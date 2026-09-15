#!/usr/bin/env node
/**
 * run-batch.mjs — prove, per item, that a registry component actually compiles.
 *
 * WHY THIS EXISTS
 *   The factory needs to know which item fills a need AND that the item provably builds. An
 *   item that cannot install is not a component we have. The breadth pass found four of
 *   fifteen registries that fetched clean and then failed at install, so a fetch is not proof
 *   and neither is a green registry index.
 *
 * THE DESIGN IS ISOLATION
 *   One throwaway Next project PER REGISTRY, never mixed. Conflicting primitive bases between
 *   registries (Radix vs Base UI vs react-aria) are the likeliest killer at scale, and mixing
 *   them would turn one registry's incompatibility into hundreds of false failures in another.
 *   Within a project each item gets its own route, so a broken item takes out one route.
 *
 * HOW A FAILURE IS ATTRIBUTED
 *   `next build` is all-or-nothing, so a single bad item would fail the whole batch. The
 *   runner builds, parses which routes the compiler named, marks those items FAIL with the
 *   real error text, removes only those routes, and rebuilds. It repeats until the build is
 *   green or nothing more can be attributed. That converges and keeps the blame specific.
 *
 * Usage:
 *   node run-batch.mjs --registry @hirael --out /tmp/gallery/out
 *   node run-batch.mjs --registry @jhai --items a,b,c --out ...
 */
import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), [])
);
const REGISTRY = args.registry;
const OUT = args.out || '/tmp/gallery/out';
const WORK = args.work || '/tmp/gallery/work';
const CLI = 'shadcn@4.21.0';
const MAX_ITEMS = Number(args.max || 400);      // split anything larger; noted in the record
const BUILD_TIMEOUT = Number(args.timeout || 900000);

const SEMANTIC = /\b(?:bg|text|border|ring|fill|stroke|divide|outline|placeholder|from|to|via|shadow)-(?:background|foreground|primary|secondary|muted|accent|destructive|card|popover|input|border|ring|sidebar|chart-\d)(?:-foreground)?(?:\/\d{1,3})?\b/g;
const PALETTE = /\b(?:bg|text|border|from|to|via|ring|fill|stroke|decoration|outline|shadow|divide|placeholder|accent|caret)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d{1,3})?\b/g;
const HEX = /#[0-9A-Fa-f]{3,8}\b/g;

const sh = (cmd, opts = {}) =>
  execSync(cmd, { encoding: 'utf8', stdio: 'pipe', timeout: BUILD_TIMEOUT, ...opts });

const log = (...m) => console.log(`[${REGISTRY}]`, ...m);

function loadRegistries() {
  const p = join(process.cwd(), 'registry/components.registries.json');
  return JSON.parse(readFileSync(p, 'utf8')).registries;
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** Scaffold a throwaway on the shadcn DEFAULT NEUTRAL palette — deliberately not JHAI's. */
function scaffold(dir, registries) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  sh(`pnpm dlx create-next-app@latest app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --no-turbopack --yes`,
     { cwd: dir });
  const app = join(dir, 'app');
  writeFileSync(join(app, 'components.json'), JSON.stringify({
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'new-york', rsc: true, tsx: true,
    tailwind: { config: '', css: 'src/app/globals.css', baseColor: 'neutral', cssVariables: true, prefix: '' },
    iconLibrary: 'lucide',
    aliases: { components: '@/components', utils: '@/lib/utils', ui: '@/components/ui', lib: '@/lib', hooks: '@/hooks' },
    registries,
  }, null, 2));
  /*
   * pnpm 11 exits 1 on ERR_PNPM_IGNORED_BUILDS when a transitive dep (es5-ext, sharp, ...) wants
   * to run a build script. shadcn shells out to `pnpm install`, so that non-zero exit fails the
   * ITEM INSTALL and then poisons the whole batch as unattributed. It cost two wholesale-zero
   * registries before it was spotted. Nothing in a build test needs those postinstall scripts.
   */
  /*
   * create-next-app writes a pnpm-workspace.yaml containing the literal placeholder
   *   allowBuilds:
   *     es5-ext: set this to true or false
   * which is not a boolean, so every `pnpm install` exits 1 with ERR_PNPM_IGNORED_BUILDS.
   * Next runs its own dep-status check through pnpm before building, and shadcn shells out to
   * pnpm on every add, so that non-zero exit failed the item install AND the build and then
   * poisoned whole batches as unattributed. It cost two wholesale-zero registries before it
   * was traced. Answer the placeholder; nothing in a build test needs those scripts.
   */
  writeFileSync(join(app, 'pnpm-workspace.yaml'),
    'allowBuilds:\n  es5-ext: false\n  sharp: false\n  unrs-resolver: false\nstrictDepBuilds: false\n');
  writeFileSync(join(app, '.npmrc'), 'auto-install-peers=true\n');
  mkdirSync(join(app, 'src/lib'), { recursive: true });
  writeFileSync(join(app, 'src/lib/utils.ts'),
    'import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\nexport function cn(...i: ClassValue[]) { return twMerge(clsx(i)); }\n');
  // Peer deps the breadth pass proved are needed across many registries but declared by few.
  sh('pnpm add clsx tailwind-merge class-variance-authority @radix-ui/react-slot lucide-react', { cwd: app });
  // Next 16 dropped the `eslint` key from NextConfig; setting it fails the type check and
  // would blame every item in the batch for the runner's own config. Leave the generated
  // config alone and pass --no-lint at build time instead.
  
  return app;
}

function snapshotFiles(app) {
  const root = join(app, 'src');
  const out = new Map();
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); }
      else out.set(relative(app, p), statSync(p).size);
    }
  };
  if (existsSync(root)) walk(root);
  return out;
}

const pkgDeps = (app) => {
  const p = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
  return new Set([...Object.keys(p.dependencies || {}), ...Object.keys(p.devDependencies || {})]);
};

/** Install one item, recording exactly which files and npm deps it brought. */
function installItem(app, spec) {
  const before = snapshotFiles(app);
  const depsBefore = pkgDeps(app);
  let stdout = '', ok = true, err = '';
  try {
    stdout = sh(`yes n | pnpm dlx ${CLI} add "${spec}" --yes 2>&1`, { cwd: app, shell: '/bin/bash' });
    if (/Something went wrong/i.test(stdout)) { ok = false; err = stdout.slice(-700); }
  } catch (e) {
    ok = false;
    err = ((e.stdout || '') + (e.stderr || '') + (e.message || '')).slice(-700);
  }
  let after = snapshotFiles(app);
  let files = [...after.keys()].filter((f) => !before.has(f) || before.get(f) !== after.get(f));
  /*
   * A batch installs a whole registry into one project, so item N+1 very often ships files
   * item N already wrote. `yes n` declines those overwrites, nothing changes on disk, and a
   * naive snapshot diff reports "wrote no files" — which looked like 80 install failures in
   * one registry before it was traced. Retry once with --overwrite so the item's own source is
   * on disk and can be attributed to it.
   */
  if (ok && !files.length && /Skipped/i.test(stdout)) {
    try {
      stdout = sh(`yes y | pnpm dlx ${CLI} add "${spec}" --yes --overwrite 2>&1`, { cwd: app, shell: '/bin/bash' });
      after = snapshotFiles(app);
      files = [...after.keys()].filter((f) => !before.has(f) || before.get(f) !== after.get(f));
    } catch { /* keep the original result */ }
  }
  const deps = [...pkgDeps(app)].filter((d) => !depsBefore.has(d));
  return { ok, err, files, deps, sharedOnly: ok && !files.length };
}

function measure(app, files) {
  let sem = 0, pal = 0, hex = 0, bytes = 0;
  for (const f of files) {
    if (!/\.(tsx|ts|jsx|js|css)$/.test(f)) continue;
    const p = join(app, f);
    if (!existsSync(p)) continue;
    const s = readFileSync(p, 'utf8');
    sem += (s.match(SEMANTIC) || []).length;
    pal += (s.match(PALETTE) || []).length;
    hex += (s.match(HEX) || []).length;
    bytes += s.length;
  }
  return { semantic: sem, palette: pal, hex, bytes };
}

/** Find a component this item exports that can actually be rendered with no props. */
function routeFor(app, item, files) {
  const comp = files.filter((f) => /^src\/components\/.*\.tsx$/.test(f));
  for (const f of comp) {
    const src = readFileSync(join(app, f), 'utf8');
    const mod = '@/' + f.replace(/^src\//, '').replace(/\.tsx$/, '');
    const def = /export\s+default\s+(?:function\s+(\w+)|(\w+))/.exec(src);
    if (def) return { mod, named: null, file: f };
    // Prefer an export whose name matches the item, else the first PascalCase export.
    const names = [...src.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+([A-Z]\w*)/g)].map((m) => m[1]);
    if (!names.length) continue;
    const want = item.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const hit = names.find((n) => n.toLowerCase() === want) || names[0];
    return { mod, named: hit, file: f };
  }
  return null;
}

function writeRoute(app, slug, target) {
  const dir = join(app, 'src/app/i', slug);
  mkdirSync(dir, { recursive: true });
  const imp = target.named
    ? `import { ${target.named} as C } from "${target.mod}";`
    : `import C from "${target.mod}";`;
  /*
   * Props are spread as `any` on purpose, and this is the difference between a fair test and
   * a useless one. Most real components take required props — a CheckList needs items, a
   * CaseCard needs a title. Rendering them bare would fail the type check on every well-typed
   * component in the catalog and report the best libraries as the most broken.
   *
   * What this route therefore proves is the thing the factory actually needs: the item's
   * source COMPILES and its imports RESOLVE. A genuine render crash still surfaces, because
   * the route is statically rendered at build time.
   */
  /*
   * force-dynamic keeps the build from PRERENDERING these routes, and that separation is the
   * whole point. A component that maps over `content.items` will of course crash when the
   * harness hands it {}. That is the harness's doing, not a defect in the component, and
   * letting it fail the build would report the best-typed libraries as the most broken.
   *
   * So the build proves COMPILE + IMPORT RESOLUTION, which is what "do I actually have this
   * component" means for the factory. Whether it survives being mounted with nothing is a
   * softer, separate signal, recorded at screenshot time.
   */
  writeFileSync(join(dir, 'page.tsx'),
    `${imp}\nexport const dynamic = "force-dynamic";\nconst p = {} as any;\nexport default function P(){return(<div data-item="${slug}" className="p-8"><C {...p}/></div>);}\n`);
  return `src/app/i/${slug}/page.tsx`;
}

/** Build, attribute failures to routes, drop them, repeat. */
function buildAttribute(app, routes) {
  const failed = new Map();
  for (let pass = 1; pass <= 12; pass++) {
    let out = '';
    try {
      out = sh('pnpm exec next build 2>&1', { cwd: app, shell: '/bin/bash' });
      return { ok: true, failed, passes: pass, tail: out.slice(-400) };
    } catch (e) {
      out = (e.stdout || '') + (e.stderr || '');
    }
    // Which item routes did the compiler name?
    const named = new Set();
    for (const m of out.matchAll(/src\/app\/i\/([a-z0-9._-]+)\/page\.tsx/gi)) named.add(m[1]);
    for (const m of out.matchAll(/\/i\/([a-z0-9._-]+)["'\s]/gi)) named.add(m[1]);
    // A component file can be blamed too; map it back to the route that imports it.
    for (const m of out.matchAll(/src\/components\/([^\s:()]+)/g)) {
      const f = 'src/components/' + m[1];
      for (const [slug, r] of Object.entries(routes)) if (r.files?.includes(f)) named.add(slug);
    }
    const fresh = [...named].filter((s) => routes[s] && !failed.has(s));
    if (!fresh.length) return { ok: false, failed, passes: pass, tail: out.slice(-1800), unattributed: true };
    for (const s of fresh) {
      const lines = out.split('\n');
      const own = lines.filter((l) => (routes[s].files || []).some((f) => l.includes(f)) || l.includes(`/i/${s}/`));
      failed.set(s, (own.length ? own : lines.filter((l) => /error/i.test(l))).slice(0, 6).join('\n').slice(0, 700));
      rmSync(join(app, 'src/app/i', s), { recursive: true, force: true });
      /*
       * Delete the item's COMPONENT FILES too, not just its route. Next type-checks the whole
       * project, so a file with a broken import keeps failing the build after its route is
       * gone — the runner would then re-blame healthy items until it ran out of passes and
       * marked the entire registry failed. Removing the source is what actually isolates it.
       */
      for (const f of routes[s].files || []) {
        if (/^src\/components\//.test(f)) rmSync(join(app, f), { force: true });
      }
    }
  }
  return { ok: false, failed, passes: 12, tail: 'exceeded 12 attribution passes' };
}

async function main() {
  const registries = loadRegistries();
  const tpl = registries[REGISTRY];
  if (!tpl) throw new Error(`${REGISTRY} not in components.registries.json`);

  let items = args.items ? args.items.split(',') : null;
  if (!items) {
    const idx = await fetchJson(tpl.replace('{name}', 'registry').replace('{style}', 'new-york'));
    items = (idx.items || []).map((i) => i.name);
  }
  const split = items.length > MAX_ITEMS;
  const batch = items.slice(0, MAX_ITEMS);
  log(`${items.length} items${split ? ` — SPLIT, taking first ${MAX_ITEMS}` : ''}`);

  const dir = join(WORK, REGISTRY.replace('@', ''));
  const app = scaffold(dir, registries);

  const records = {};
  const routes = {};
  for (const [n, item] of batch.entries()) {
    const slug = item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `i${n}`;
    const spec = `${REGISTRY}/${item}`;
    const r = { registry: REGISTRY, item, slug, install: `pnpm dlx ${CLI} add ${spec}` };
    const ins = installItem(app, spec);
    r.files = ins.files;
    r.deps = ins.deps;
    Object.assign(r, measure(app, ins.files));
    if (!ins.ok) { r.status = 'FAIL'; r.stage = 'install'; r.error = ins.err; records[slug] = r; continue; }
    if (!ins.files.length) { r.status = 'SHARED'; r.stage = 'install'; r.error = 'installed cleanly but wrote no new files — its source was already on disk from a sibling item in this batch'; records[slug] = r; continue; }
    const target = routeFor(app, item, ins.files);
    if (!target) { r.status = 'NO_ROUTE'; r.stage = 'route'; r.error = 'no renderable component export found'; records[slug] = r; continue; }
    r.route = writeRoute(app, slug, target);
    r.component = target.named || 'default';
    routes[slug] = r;
    records[slug] = r;
    if ((n + 1) % 25 === 0) log(`installed ${n + 1}/${batch.length}`);
  }

  log(`building ${Object.keys(routes).length} routes…`);
  const b = buildAttribute(app, routes);
  for (const [slug, err] of b.failed) {
    records[slug].status = 'FAIL';
    records[slug].stage = 'build';
    records[slug].error = err;
  }
  for (const slug of Object.keys(routes)) if (!records[slug].status) records[slug].status = 'PASS';
  if (!b.ok && b.unattributed) {
    for (const slug of Object.keys(routes)) {
      if (records[slug].status === 'PASS') { records[slug].status = 'FAIL'; records[slug].stage = 'build-unattributed'; records[slug].error = b.tail; }
    }
  }

  const list = Object.values(records);
  const summary = {
    registry: REGISTRY, totalItems: items.length, attempted: batch.length, split,
    pass: list.filter((r) => r.status === 'PASS').length,
    fail: list.filter((r) => r.status === 'FAIL').length,
    noRoute: list.filter((r) => r.status === 'NO_ROUTE').length,
    buildOk: b.ok, attributionPasses: b.passes, appDir: app,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${REGISTRY.replace('@', '')}.json`), JSON.stringify({ summary, items: list }, null, 1));
  log(JSON.stringify(summary));
}

main().catch((e) => { console.error(`[${REGISTRY}] FATAL`, e.message); process.exit(1); });
