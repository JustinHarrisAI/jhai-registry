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
 * WHAT RUN 2 CHANGED, AND WHY EACH CHANGE WAS FORCED
 *   1. The ordinary peer surface is installed BEFORE any item. Run 1 reported @magicui at 0 of
 *      250 because every failure named one undeclared package. See lib/peers.mjs.
 *   2. The scaffold is built and proven green BEFORE the first item install. Run 1 shipped a
 *      scaffold whose `pnpm install` exited 1 on a create-next-app placeholder, which silently
 *      zeroed two whole registries.
 *   3. Attribution is shared-file aware. Run 1 isolated a failure by deleting the item's source,
 *      which broke every sibling importing it: 262 of its failures named `@/components` and 308
 *      named a relative path. A file claimed by more than one item is never deleted; items that
 *      can only be blamed through a shared file are marked UNATTRIBUTED, not FAIL.
 *   4. Installs are batched. Run 1 spent ~10s per item, which is why 4,585 items did not fit.
 *      Per-item file attribution survives batching because each item's registry JSON declares
 *      the files it ships, so the batch's snapshot diff can be split by declared path.
 *
 * WHAT A PASS HERE MEANS
 *   The item's source compiles and its imports resolve. Whether it renders anything visible is
 *   a separate, stronger question answered by verify-render.mjs against the built app.
 *
 * Usage:
 *   node run-batch.mjs --registry @hirael --out /tmp/gallery/out
 *   node run-batch.mjs --registry @tailark-oss --base base-ui --out ...
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { peersFor } from './lib/peers.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), [])
);
const REGISTRY = args.registry;
const OUT = args.out || '/tmp/gallery2/out';
const WORK = args.work || '/tmp/gallery2/work';
const BASE = args.base || 'both';
const CLI = 'shadcn@4.21.0';
const INSTALL_BATCH = Number(args.batch || 12);
const MAX_ITEMS = Number(args.max || 400);
const OFFSET = Number(args.offset || 0);
const TAG = args.tag || '';
const BUILD_TIMEOUT = Number(args.timeout || 1800000);
/*
 * A hard per-registry deadline. Attribution is iterative and a pathological registry can spend
 * hours discovering one new failure per rebuild. When the deadline passes, everything still
 * standing is UNATTRIBUTED with the boundary recorded — a partial result that says so beats a
 * complete-looking one that quietly ate the run's remaining time.
 */
const DEADLINE = args.deadline ? Number(args.deadline) : Date.now() + Number(args.budget || 75) * 60000;
const BASE_UI_IMPORT = /@base-ui(-components)?\/react/;
const RADIX_IMPORT = /@radix-ui\/react-/;

const SEMANTIC = /\b(?:bg|text|border|ring|fill|stroke|divide|outline|placeholder|from|to|via|shadow)-(?:background|foreground|primary|secondary|muted|accent|destructive|card|popover|input|border|ring|sidebar|chart-\d)(?:-foreground)?(?:\/\d{1,3})?\b/g;
const PALETTE = /\b(?:bg|text|border|from|to|via|ring|fill|stroke|decoration|outline|shadow|divide|placeholder|accent|caret)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d{1,3})?\b/g;
const HEX = /#[0-9A-Fa-f]{3,8}\b/g;

const sh = (cmd, opts = {}) =>
  execSync(cmd, { encoding: 'utf8', stdio: 'pipe', timeout: BUILD_TIMEOUT, maxBuffer: 64 * 1024 * 1024, ...opts });

const log = (...m) => console.log(`[${REGISTRY}]`, ...m);
const ROOT = args.root || process.cwd();

function loadRegistries() {
  return JSON.parse(readFileSync(join(ROOT, 'registry/components.registries.json'), 'utf8')).registries;
}

const resolveTpl = (tpl, name) => tpl.replace('{name}', name).replace('{style}', 'new-york');

async function fetchJson(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) { last = e; await new Promise((s) => setTimeout(s, 400 * (i + 1))); }
  }
  throw last;
}

async function mapLimit(list, limit, fn) {
  const out = new Array(list.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (i < list.length) { const n = i++; out[n] = await fn(list[n], n); }
  }));
  return out;
}

/**
 * Where shadcn will land a registry file, given its declared type and target.
 * Used only to split a batch's snapshot diff back into per-item ownership; the snapshot is
 * still the source of truth for what actually landed.
 */
function expectedPath(f, aliasBase = 'src') {
  if (f.target) {
    /*
     * A target is written relative to the project in some registries and relative to the
     * components alias in others. Normalising it matters more than it looks: when the path did
     * not match, attribution fell back to the bare basename, and every @kibo-ui item ships a
     * file called index.tsx — so all twelve items in a batch were credited with all twelve
     * files and the whole registry collapsed into one shared blob.
     */
    /*
     * Alias-prefixed targets are a third dialect. @tailark-oss writes `@components/header.tsx`,
     * which is neither project-relative nor alias-relative in the usual sense; unhandled, every
     * one of its 259 items resolved to a path that does not exist and the whole registry came
     * back as "installed but wrote nothing".
     */
    const t = f.target
      .replace(/^~\//, '').replace(/^\.\//, '')
      .replace(/^@ui\//, 'components/ui/')
      .replace(/^@(components|hooks|lib)\//, '$1/')
      .replace(/^@\//, '');
    if (t.startsWith('src/') || t.startsWith('app/') || t.startsWith('public/')) return t;
    if (t.startsWith('components/') || t.startsWith('hooks/') || t.startsWith('lib/')) return `${aliasBase}/${t}`;
    return `${aliasBase}/components/${t}`;
  }
  const b = basename(f.path || '');
  switch (f.type) {
    case 'registry:ui': return `${aliasBase}/components/ui/${b}`;
    case 'registry:hook': return `${aliasBase}/hooks/${b}`;
    case 'registry:lib': return `${aliasBase}/lib/${b}`;
    case 'registry:block':
    case 'registry:component':
    default: return `${aliasBase}/components/${b}`;
  }
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
   * create-next-app writes a pnpm-workspace.yaml containing the literal placeholder
   *   allowBuilds:
   *     es5-ext: set this to true or false
   * which is not a boolean, so every `pnpm install` exits 1 with ERR_PNPM_IGNORED_BUILDS.
   * Next runs its own dep-status check through pnpm before building and shadcn shells out to
   * pnpm on every add, so that non-zero exit failed the item install AND the build and then
   * poisoned whole batches as unattributed. It cost two wholesale-zero registries in run 1.
   */
  writeFileSync(join(app, 'pnpm-workspace.yaml'),
    'allowBuilds:\n  es5-ext: false\n  sharp: false\n  unrs-resolver: false\n  "@tailwindcss/oxide": true\nstrictDepBuilds: false\n');
  writeFileSync(join(app, '.npmrc'), 'auto-install-peers=true\nstrict-peer-dependencies=false\n');

  mkdirSync(join(app, 'src/lib'), { recursive: true });
  writeFileSync(join(app, 'src/lib/utils.ts'),
    'import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\nexport function cn(...i: ClassValue[]) { return twMerge(clsx(i)); }\n');
  writeFileSync(join(app, 'src/lib/harness-fixture.ts'), FIXTURE_RUNTIME);

  /*
   * Type errors are attributed by a SEPARATE `tsc --noEmit` pass, which reports every file's
   * errors at once and needs no deletion to isolate them. Leaving them enabled here would make
   * `next build` all-or-nothing again: one bad file fails the batch, and the only way to find
   * out which was to delete sources and rebuild, which is precisely what manufactured 262
   * collateral failures in run 1. The build is still run, and still catches what tsc cannot —
   * unresolved modules, bad JSX output, server/client boundary violations.
   */
  rmSync(join(app, 'next.config.ts'), { force: true });
  writeFileSync(join(app, 'next.config.mjs'),
    'const nextConfig = { typescript: { ignoreBuildErrors: true }, images: { unoptimized: true } };\n'
    + 'export default nextConfig;\n');

  // One install of the whole ordinary peer surface, plus a local shadcn so item installs do not
  // pay `pnpm dlx` resolution 250 times over.
  sh(`pnpm add ${peersFor(BASE).join(' ')}`, { cwd: app });
  sh(`pnpm add -D ${CLI}`, { cwd: app });

  /*
   * A component that maps over a prop will of course crash when the harness mounts it with {}.
   * That is the harness's doing, so item routes are dynamic and never prerendered, and the
   * build proves COMPILE + IMPORT RESOLUTION. Whether anything renders is measured separately
   * against the running app, where a crash is attributable to one route instead of the batch.
   */
  return app;
}

/** The scaffold must be green before a single item lands, or every failure is the harness's. */
function validateScaffold(app) {
  try {
    sh('pnpm exec next build 2>&1', { cwd: app, shell: '/bin/bash' });
    return { ok: true };
  } catch (e) {
    return { ok: false, err: ((e.stdout || '') + (e.stderr || '')).slice(-2500) };
  }
}

function snapshotFiles(app) {
  const out = new Map();
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.next') continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p); else out.set(relative(app, p), statSync(p).size);
    }
  };
  for (const sub of ['src', 'components', 'hooks', 'lib']) {
    const r = join(app, sub);
    if (existsSync(r)) walk(r);
  }
  return out;
}

const pkgDeps = (app) => {
  const p = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
  return new Set([...Object.keys(p.dependencies || {}), ...Object.keys(p.devDependencies || {})]);
};

/**
 * Install a batch of items in ONE shadcn call, then split the resulting file diff back to the
 * items that declared each file. A file two items both declare is SHARED and is never deleted
 * during attribution — that deletion is exactly what turned 262 run-1 failures into collateral.
 */
/** What primitive base a source file imports, for the clobber guard. */
function baseOf(app, rel) {
  const p = join(app, rel);
  if (!existsSync(p)) return null;
  const s = readFileSync(p, 'utf8');
  if (BASE_UI_IMPORT.test(s)) return 'base-ui';
  if (RADIX_IMPORT.test(s)) return 'radix';
  return null;
}

function installBatch(app, specs, metas) {
  const before = snapshotFiles(app);
  const depsBefore = pkgDeps(app);
  /*
   * @tailark-oss ships a `ui/button.tsx` importing Base UI, and installing it silently replaces
   * the Radix button every other component in the project is compiled against. Run 1 saw the
   * downstream breakage and could not name the cause. The base of every shared ui/ file is
   * recorded before and after each batch so a switch is a finding, not a mystery.
   */
  const uiBefore = new Map();
  for (const f of before.keys()) if (/^src\/components\/ui\/.*\.tsx$/.test(f)) uiBefore.set(f, baseOf(app, f));
  let stdout = '', ok = true, err = '';
  const quoted = specs.map((s) => `"${s}"`).join(' ');
  try {
    stdout = sh(`yes y | pnpm exec shadcn add ${quoted} --yes --overwrite 2>&1`, { cwd: app, shell: '/bin/bash' });
    if (/Something went wrong/i.test(stdout) && !/Success/i.test(stdout)) { ok = false; err = stdout.slice(-1200); }
  } catch (e) {
    ok = false;
    err = ((e.stdout || '') + (e.stderr || '') + (e.message || '')).slice(-1200);
  }
  const after = snapshotFiles(app);
  const changed = [...after.keys()].filter((f) => !before.has(f) || before.get(f) !== after.get(f));
  const deps = [...pkgDeps(app)].filter((d) => !depsBefore.has(d));

  // Claim map: declared path (and bare basename) -> the items that ship it.
  const claims = new Map();      // exact landing path -> items
  const bySuffix = new Map();    // last two path segments -> items
  const byName = new Map();      // bare basename -> items
  const add = (map, key, name) => { if (!key) return; if (!map.has(key)) map.set(key, new Set()); map.get(key).add(name); };
  const tail2 = (p) => p.split('/').slice(-2).join('/');
  for (const m of metas) {
    for (const f of m.files || []) {
      const path = expectedPath(f);
      const src = f.path || f.target || '';
      add(claims, path, m.name);
      add(bySuffix, tail2(path || src), m.name);
      add(byName, basename(src), m.name);
    }
  }
  /*
   * Fallbacks are used only when they are UNAMBIGUOUS. An ambiguous basename is worthless —
   * every @kibo-ui item ships an index.tsx — and treating it as a claim credited twelve items
   * with one file and marked the whole registry shared.
   */
  const unique = (map, key) => { const s = map.get(key); return s && s.size === 1 ? s : null; };
  const byItem = Object.fromEntries(metas.map((m) => [m.name, []]));
  const shared = new Set();
  const orphan = [];
  for (const f of changed) {
    const owners = claims.get(f) || bySuffix.get(tail2(f)) || unique(byName, basename(f));
    if (!owners || !owners.size) { orphan.push(f); continue; }
    if (owners.size > 1) shared.add(f);
    for (const o of owners) byItem[o]?.push(f);
  }
  /*
   * An item whose file was already on disk with identical content shows no diff, because the
   * snapshot compares sizes. @tailark-oss ships 190 items that re-publish a shared header or
   * footer, so nearly the whole registry was recorded as "installed but wrote nothing" — a
   * false zero of exactly the kind run 1 was full of. Ownership does not depend on having
   * changed the file: if the item declares it and it is on disk, the item owns it.
   */
  for (const m of metas) {
    if (byItem[m.name]?.length) continue;
    for (const f of m.files || []) {
      const p = expectedPath(f);
      if (p && existsSync(join(app, p))) { byItem[m.name].push(p); shared.add(p); }
    }
  }

  const clobbers = [];
  for (const [f, wasBase] of uiBefore) {
    if (!changed.includes(f)) continue;
    const nowBase = baseOf(app, f);
    if (wasBase && nowBase && wasBase !== nowBase) {
      clobbers.push({ file: f, from: wasBase, to: nowBase, by: [...(claims.get(f) || bySuffix.get(tail2(f)) || [])] });
    }
  }
  return { ok, err, stdout, byItem, shared, orphan, deps, changed, clobbers };
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

/** Find a component this item exports that can be mounted. */
function routeFor(app, item, files) {
  const comp = files.filter((f) => /^src\/components\/.*\.(tsx|jsx)$/.test(f) && !/^src\/components\/ui\//.test(f));
  const uiOnly = files.filter((f) => /^src\/components\/ui\/.*\.(tsx|jsx)$/.test(f));
  for (const f of [...comp, ...uiOnly]) {
    const p = join(app, f);
    if (!existsSync(p)) continue;
    const src = readFileSync(p, 'utf8');
    const mod = '@/' + f.replace(/^src\//, '').replace(/\.(tsx|jsx)$/, '');
    if (/export\s+default\s+/.test(src)) return { mod, named: null, file: f };
    const names = [...src.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+([A-Z]\w*)/g)].map((m) => m[1]);
    /*
     * `export { Button }` at the bottom of the file is as common as an inline export, and
     * missing it marked 43 perfectly good @8bitcn items as having no renderable component.
     */
    for (const g of src.matchAll(/export\s*\{([^}]+)\}/g)) {
      for (const part of g[1].split(',')) {
        const n = part.trim().split(/\s+as\s+/).pop().trim();
        if (/^[A-Z]\w*$/.test(n) && new RegExp(`(function|const|class)\\s+${n}\\b`).test(src)) names.push(n);
      }
    }
    if (!names.length) continue;
    const want = item.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const hit = names.find((n) => n.toLowerCase() === want)
      || names.find((n) => want.includes(n.toLowerCase()))
      || names[0];
    return { mod, named: hit, file: f };
  }
  return null;
}

/**
 * Guess plausible props from the component's own source.
 *
 * WHY THIS IS NOT OPTIONAL
 *   Mounting every component with {} is what run 1 did. It compiles — the route casts to any —
 *   but at render time a CheckList that maps over `content.items` throws, and the harness would
 *   record a perfectly good component as broken. On the 30 items of @jhai, all of them known
 *   good, bare mounting produced 14 crashes. The prop names are right there in the source, so
 *   the fixture is derived from them rather than guessed globally.
 */
const ARRAYISH = /(items|list|data|rows|cards|links|tabs|options|features|plans|steps|logos|images|columns|slides|testimonials|entries|posts|faqs|questions|answers|stats|metrics|points|children_?items|nav|menu|tiers|content)$/i;
const STRINGISH = /(title|label|heading|name|text|description|subtitle|caption|cta|href|src|alt|placeholder|id|value|badge|eyebrow|kicker|quote|author|role|email|url|slug|variant|size|align|color|className)$/i;
const NUMBERISH = /(count|index|num|number|duration|delay|speed|width|height|size|columns?|rows?|min|max|step|total|progress|percent|score|year)$/i;
const BOOLISH = /^(is|has|show|can|should|enable|allow)[A-Z]|^(open|disabled|checked|active|selected|loading|reverse|loop|autoplay|muted|inverted|dark)$/;

const OBJECTISH = /^(content|config|section|block|copy|settings|theme|meta|item|card|user|author|post|product|plan|tier|hero|header|footer|cta)$/i;

/*
 * A fixture VALUE has to survive being reached through a path the harness cannot see —
 * `content.items[0].title` is a perfectly ordinary shape and a flat sample object dies on it.
 * So nested values are Proxies that answer any key by NAME CLASS: an array for `items`, a
 * string for `title`, a number for `count`. That turned the last eleven @jhai crashes, all of
 * them known-good components, into real renders.
 */
const FIXTURE_RUNTIME = `/* generated by scripts/gallery/run-batch.mjs — harness only */
const A = ${'/(items|list|data|rows|cards|links|tabs|options|features|plans|steps|logos|images|columns|slides|testimonials|entries|posts|faqs|questions|answers|stats|metrics|points|nav|menu|tiers|children)$/i'};
const N = ${'/(count|index|num|number|duration|delay|speed|width|height|min|max|step|total|progress|percent|score|year|price|rating)$/i'};
const B = ${'/^(is|has|show|can|should|enable|allow)[A-Z]|^(open|disabled|checked|active|selected|loading|reverse|loop|autoplay|muted|inverted|dark|featured|popular)$/'};
/*
 * HARNESS_FX=arr flips the fallback for an unrecognised prop name from a string to a list.
 * Neither default can be right for every component: \`a.faq.map\` needs a list, \`{subtitle}\`
 * needs a string, and the name alone does not say which. So the render pass runs strings first
 * and retries only the components that crashed with lists, which is how a component gets
 * credited for rendering instead of blamed for the harness's guess.
 */
const ARR_FALLBACK = process.env.HARNESS_FX === "arr";
export function fval(k: string, d = 0): any {
  if (d > 4) return "Sample";
  if (B.test(k)) return false;
  if (N.test(k)) return 3;
  if (k === "href" || k === "url" || k === "link") return "#";
  if (k === "src" || k === "image" || k === "img" || k === "avatar" || k === "logo") return "/next.svg";
  if (A.test(k)) return [fobj(d + 1), fobj(d + 1), fobj(d + 1)];
  if (ARR_FALLBACK && !/^(title|label|name|heading|text|description|subtitle|caption|eyebrow|kicker|quote|author|role|email|slug|variant|size|align|color|id)$/i.test(k)) {
    return [fobj(d + 1), fobj(d + 1), fobj(d + 1)];
  }
  return "Sample " + k;
}
export function fobj(d = 0): any {
  return new Proxy({}, {
    get(_t, k) {
      if (typeof k !== "string") return undefined;
      if (k === "$$typeof" || k === "then" || k === "toJSON" || k === "_owner") return undefined;
      if (k === "toString" || k === "valueOf") return () => "Sample";
      if (k === "id" || k === "key") return "1";
      return fval(k, d);
    },
    has() { return true; },
  });
}
`;

function fixtureFor(app, target) {
  const p = join(app, target.file);
  if (!existsSync(p)) return { fixture: '{}', wantsChildren: false };
  const src = readFileSync(p, 'utf8');
  const names = new Set();

  // The component's own destructuring is the most reliable source of prop names.
  const fnRe = new RegExp(String.raw`(?:function|const)\s+${target.named || '\\w+'}[^({]*\(\s*\{([^}]*)\}`, 's');
  const m = fnRe.exec(src) || /(?:export\s+default\s+function\s*\w*|=>)\s*\(?\s*\{([^}]{2,400})\}\s*(?::|\))/s.exec(src);
  if (m) {
    for (const part of m[1].split(',')) {
      const n = part.trim().split(/[:=]/)[0].trim().replace(/^\.\.\./, '');
      if (/^[A-Za-z_]\w*$/.test(n)) names.add(n);
    }
  }
  // A props interface or type alias covers components that take `props` whole.
  for (const t of src.matchAll(/(?:interface|type)\s+\w*Props\w*\s*=?\s*\{([^}]{0,900})\}/gs)) {
    for (const line of t[1].split(/[;\n]/)) {
      const n = /^\s*(?:readonly\s+)?([A-Za-z_]\w*)\??\s*:/.exec(line);
      if (n) names.add(n[1]);
    }
  }
  names.delete('className');
  const wantsChildren = names.delete('children');
  if (!names.size) return { fixture: '{}', wantsChildren };

  const parts = [];
  for (const n of [...names].slice(0, 30)) {
    if (OBJECTISH.test(n)) parts.push(`${n}:fobj(1)`);
    else if (BOOLISH.test(n)) parts.push(`${n}:false`);
    else if (ARRAYISH.test(n) || NUMBERISH.test(n) || STRINGISH.test(n)) parts.push(`${n}:fval(${JSON.stringify(n)})`);
    // Anything unrecognised is left out on purpose so the component's own default applies.
  }
  return { fixture: `{${parts.join(',')}}`, wantsChildren };
}

function writeRoute(app, slug, target) {
  const dir = join(app, 'src/app/i', slug);
  mkdirSync(dir, { recursive: true });
  const imp = target.named
    ? `import { ${target.named} as C } from "${target.mod}";`
    : `import C from "${target.mod}";`;
  /*
   * Props are cast to `any` on purpose. Most real components take required props, and failing
   * the type check on a well-typed component would report the best libraries as the most broken.
   * The VALUES come from the component's own prop names so the render is a fair test too.
   */
  const { fixture, wantsChildren } = fixtureFor(app, target);
  const needsRuntime = /fobj\(|fval\(/.test(fixture);
  const runtimeImport = needsRuntime ? 'import { fobj, fval } from "@/lib/harness-fixture";\n' : '';
  // Children are passed only when the component asks for them: handing children to a wrapper
  // around a void element (input, img, hr) throws at render and would look like a broken item.
  const el = wantsChildren ? `<C {...p}>Sample content</C>` : `<C {...p}/>`;
  writeFileSync(join(dir, 'page.tsx'),
    `${runtimeImport}${imp}\nexport const dynamic = "force-dynamic";\nconst p = ${fixture} as any;\nexport default function P(){return(<div data-item="${slug}" className="p-8">${el}</div>);}\n`);
  return `src/app/i/${slug}/page.tsx`;
}

/**
 * A file is SHARED if more than one item declares it, or if a file belonging to one item
 * imports a file belonging to another.
 *
 * The declaration map alone is not enough: registries routinely ship a block that imports a
 * sibling's component by relative path without declaring it, and deleting that file to isolate
 * a failure is what broke 308 items in run 1 with errors naming a relative path.
 */
function computeShared(app, ownerOf, declaredShared) {
  const shared = new Set(declaredShared);
  const resolve = (from, spec) => {
    let rel;
    if (spec.startsWith('@/')) rel = 'src/' + spec.slice(2);
    else if (spec.startsWith('.')) rel = relative(app, join(app, dirname(from), spec));
    else return null;
    for (const ext of ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts']) {
      if (existsSync(join(app, rel + ext))) return rel + ext;
    }
    return null;
  };
  for (const [file, owners] of ownerOf) {
    if (!/\.(tsx|ts|jsx|js)$/.test(file) || !existsSync(join(app, file))) continue;
    const src = readFileSync(join(app, file), 'utf8');
    for (const m of src.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)) {
      const dep = resolve(file, m[1]);
      if (!dep) continue;
      const depOwners = ownerOf.get(dep);
      if (!depOwners) continue;
      if (depOwners.size > 1 || [...depOwners].some((o) => !owners.has(o))) shared.add(dep);
    }
  }
  return shared;
}

/**
 * Attribute TYPE errors without deleting anything.
 *
 * `tsc --noEmit` reports every file's errors in one pass, each anchored to a path. That is a
 * complete attribution map for free, and it replaces run 1's delete-and-rebuild loop — the loop
 * that could only isolate a failure by breaking its siblings. An item fails here when one of its
 * OWN files does not typecheck; an item whose only bad file is shared is UNATTRIBUTED, because
 * this harness cannot tell whether it or the file's author is at fault.
 */
function typecheck(app) {
  try {
    sh('pnpm exec tsc --noEmit -p tsconfig.json 2>&1', { cwd: app, shell: '/bin/bash' });
    return { ok: true, byFile: new Map() };
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const byFile = new Map();
    for (const line of out.split('\n')) {
      const m = /^(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.*)$/.exec(line.trim());
      if (!m) continue;
      const f = m[1].replace(/^\.\//, '');
      if (!byFile.has(f)) byFile.set(f, []);
      if (byFile.get(f).length < 5) byFile.get(f).push(`${m[4]}: ${m[5]}`.slice(0, 300));
    }
    return { ok: false, byFile, raw: out.slice(-2000) };
  }
}

/**
 * Build, attribute failures to routes, drop them, repeat.
 *
 * With type errors handled by the tsc pass and ignored by next.config, what reaches this loop is
 * module resolution and bundling: rarer, and usually genuinely fatal to the item.
 *
 * SHARED-FILE RULE: an item's own component source is deleted only when no other installed item
 * declares OR imports that file. When the compiler blames a shared file, every item that ships it
 * is marked UNATTRIBUTED and only its ROUTE is removed, so the file stays on disk for its
 * siblings. Run 1 deleted unconditionally and manufactured 262 collateral failures.
 */
const errorTail = (out, needle) =>
  out.split('\n').filter((l) => l.includes(needle) || /error|Error|Module not found/.test(l))
     .slice(0, 6).join('\n').slice(0, 1200);

function buildAttribute(app, routes, shared, ownerOf) {
  const failed = new Map();
  const unattributed = new Map();
  for (let pass = 1; pass <= 25; pass++) {
    if (Date.now() > DEADLINE) {
      for (const s of Object.keys(routes)) {
        if (!failed.has(s) && !unattributed.has(s)) unattributed.set(s, 'per-registry time budget reached before this item could be attributed');
      }
      return { ok: false, failed, unattributed, passes: pass, deadlineHit: true };
    }
    let out = '';
    try {
      out = sh('pnpm exec next build 2>&1', { cwd: app, shell: '/bin/bash' });
      return { ok: true, failed, unattributed, passes: pass };
    } catch (e) {
      out = (e.stdout || '') + (e.stderr || '');
    }
    const direct = new Set();   // compiler named this item's route or its exclusive source
    const viaShared = new Set(); // compiler named a file several items ship
    for (const m of out.matchAll(/src\/app\/i\/([a-z0-9._-]+)\/page\.tsx/gi)) direct.add(m[1]);
    for (const m of out.matchAll(/\/i\/([a-z0-9._-]+)["'\s]/gi)) direct.add(m[1]);
    /*
     * Any src/ path, not just component directories. @shadcnui-blocks ships API route files under
     * src/app/api/og/* whose imports do not resolve; those break the bundler, live outside every
     * component directory, and belong to items that never got a route of their own — so nothing
     * could be named and 352 items in one chunk went UNATTRIBUTED behind them.
     */
    const badFiles = new Set();
    for (const m of out.matchAll(/(?:\.\/)?(src\/[^\s:()"'`]+\.(?:tsx|ts|jsx|js|css))/g)) {
      const full = m[1].replace(/[.,;]+$/, '');
      if (full.startsWith('src/app/i/')) continue;
      if (!ownerOf.has(full)) continue;
      badFiles.add(full);
      const sole = ownerOf.get(full).size === 1;
      for (const slug of ownerOf.get(full)) (sole ? direct : viaShared).add(slug);
    }
    /*
     * A file that breaks the bundler and belongs to no route still has to go, or every later pass
     * finds the same error and the loop converges on nothing.
     */
    let removed = 0;
    for (const f of badFiles) {
      if (shared.has(f)) continue;
      const owners = [...(ownerOf.get(f) || [])];
      if (owners.some((s) => routes[s])) continue;   // handled below, with its route
      if (!existsSync(join(app, f))) continue;
      for (const s of owners) if (!failed.has(s)) failed.set(s, `${f}\n${errorTail(out, f)}`);
      rmSync(join(app, f), { force: true });
      removed++;
    }
    const errLines = out.split('\n').filter((l) => /error|Error|Failed to compile|Module not found/.test(l));
    const freshDirect = [...direct].filter((s) => routes[s] && !failed.has(s) && !unattributed.has(s));
    const freshShared = [...viaShared].filter((s) => routes[s] && !failed.has(s) && !unattributed.has(s));

    if (!freshDirect.length && !freshShared.length && !removed) {
      // Nothing new can be named. Everything still standing is UNATTRIBUTED, never FAIL: the
      // build is red for a reason this harness could not pin on a specific item.
      for (const s of Object.keys(routes)) {
        if (!failed.has(s) && !unattributed.has(s)) unattributed.set(s, out.slice(-1200));
      }
      return { ok: false, failed, unattributed, passes: pass, exhausted: true };
    }

    const own = (s) => {
      const lines = out.split('\n');
      const mine = lines.filter((l) => (routes[s].files || []).some((f) => l.includes(f)) || l.includes(`/i/${s}/`));
      return (mine.length ? mine : errLines).slice(0, 8).join('\n').slice(0, 1500);
    };

    for (const s of freshDirect) {
      failed.set(s, own(s));
      rmSync(join(app, 'src/app/i', s), { recursive: true, force: true });
      for (const f of routes[s].files || []) {
        if (!/^src\/(components|hooks|lib)\//.test(f)) continue;
        if (shared.has(f)) continue;                    // a sibling imports it; leave it alone
        rmSync(join(app, f), { force: true });
      }
    }
    for (const s of freshShared) {
      unattributed.set(s, own(s));
      rmSync(join(app, 'src/app/i', s), { recursive: true, force: true }); // route only
    }
  }
  return { ok: false, failed, unattributed, passes: 25, exhausted: true };
}

async function main() {
  const registries = loadRegistries();
  const tpl = registries[REGISTRY];
  if (!tpl) throw new Error(`${REGISTRY} not in components.registries.json`);
  mkdirSync(OUT, { recursive: true });

  const idx = await fetchJson(resolveTpl(tpl, 'registry'));
  let all = (idx.items || []).map((i) => i.name);
  if (args.items) all = args.items.split(',');
  /*
   * Large registries are chunked into separate scaffolds. A single Next project with 1,100
   * routes rebuilds too slowly for iterative attribution to converge inside any sane budget,
   * and chunking bounds the blast radius of one pathological item.
   */
  const names = all.slice(OFFSET, OFFSET + MAX_ITEMS);
  const split = all.length > names.length;
  log(`${names.length} of ${all.length} items (offset ${OFFSET}), base=${BASE}`);

  // Item metadata up front: declared files, deps, type. This is what makes batched installs
  // attributable per item and what builds the shared-file map before anything is deleted.
  const metas = (await mapLimit(names, 10, async (n) => {
    try {
      const j = await fetchJson(resolveTpl(tpl, n));
      /*
       * The registry item JSON already carries every file's source, so the primitive base can be
       * read directly instead of inferred from declared dependencies — which do not identify it:
       * @tailark-oss declares neither Radix nor Base UI and uses Base UI anyway. This is the
       * measurement that answers whether a registry can be mixed into a Radix project.
       */
      const src = (j.files || []).map((f) => f.content || '').join('\n');
      return { name: n, ok: true, files: j.files || [], dependencies: j.dependencies || [],
               registryDependencies: j.registryDependencies || [], type: j.type, title: j.title,
               description: j.description,
               primitives: {
                 baseUi: BASE_UI_IMPORT.test(src),
                 radix: RADIX_IMPORT.test(src),
                 reactAria: /react-aria|@react-stately/.test(src),
                 arkUi: /@ark-ui\//.test(src),
               },
               writesSharedUi: (j.files || []).some((f) => /(^|\/)components\/ui\//.test(expectedPath(f))) };
    } catch (e) { return { name: n, ok: false, err: String(e.message || e), files: [] }; }
  }));
  const fetchFailed = metas.filter((m) => !m.ok);
  const live = metas.filter((m) => m.ok);
  log(`metadata: ${live.length} ok, ${fetchFailed.length} unfetchable`);

  const slugReg = REGISTRY.replace('@', '') + (TAG ? `-${TAG}` : '');
  const dir = join(WORK, slugReg);
  const app = scaffold(dir, registries);
  // Kept verbatim so an item that overwrites the app shell can be undone rather than allowed to
  // fail the whole build on an import of something it did not install.
  const appShell = new Map(['src/app/page.tsx', 'src/app/layout.tsx']
    .filter((f) => existsSync(join(app, f)))
    .map((f) => [f, readFileSync(join(app, f), 'utf8')]));
  const v = validateScaffold(app);
  if (!v.ok) {
    writeFileSync(join(OUT, `${slugReg}.json`), JSON.stringify({
      summary: { registry: REGISTRY, tag: TAG, base: BASE, totalItems: all.length, attempted: 0,
                 scaffoldGreen: false, scaffoldError: v.err }, items: [] }, null, 1));
    log('SCAFFOLD FAILED — no items attempted');
    return;
  }
  log('scaffold green');

  const records = {};
  for (const m of fetchFailed) {
    const slug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    records[slug] = { registry: REGISTRY, base: BASE, item: m.name, slug, status: 'FAIL',
                      stage: 'fetch', error: m.err, files: [], deps: [] };
  }

  const sharedAll = new Set();
  const batchNotes = [];
  const clobbers = [];
  for (let i = 0; i < live.length; i += INSTALL_BATCH) {
    const group = live.slice(i, i + INSTALL_BATCH);
    const specs = group.map((m) => `${REGISTRY}/${m.name}`);
    const r = installBatch(app, specs, group);
    for (const f of r.shared) sharedAll.add(f);
    if (!r.ok) batchNotes.push({ at: i, err: r.err.slice(0, 400) });
    clobbers.push(...(r.clobbers || []));
    for (const m of group) {
      const slug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `i${i}`;
      const files = r.byItem[m.name] || [];
      records[slug] = {
        registry: REGISTRY, base: BASE, item: m.name, slug, title: m.title, description: m.description,
        itemType: m.type, install: `pnpm dlx ${CLI} add ${REGISTRY}/${m.name}`,
        declaredDeps: m.dependencies, registryDeps: m.registryDependencies,
        primitives: m.primitives, writesSharedUi: m.writesSharedUi,
        files, deps: r.deps, ...measure(app, files),
      };
      if (!files.length) {
        records[slug].status = r.ok ? 'NO_FILES' : 'FAIL';
        records[slug].stage = 'install';
        records[slug].error = r.ok
          ? 'install reported success but no file on disk could be attributed to this item'
          : r.err;
      }
    }
    if ((i / INSTALL_BATCH) % 4 === 0) log(`installed ${Math.min(i + INSTALL_BATCH, live.length)}/${live.length}`);
  }

  /*
   * Registry items routinely ship a demo `src/app/page.tsx` that imports the whole showcase.
   * @tailark-oss does, and the resulting unresolved import failed the ENTIRE build with one
   * error that named no item this harness could blame — 192 items unattributed behind a demo
   * page. The harness owns the app shell, so it takes it back after installing and records who
   * tried to replace it, because shipping an app route is worth knowing about.
   */
  const shellOverwrites = [];
  for (const [rel, original] of appShell) {
    const cur = existsSync(join(app, rel)) ? readFileSync(join(app, rel), 'utf8') : null;
    if (cur !== original) {
      shellOverwrites.push(rel);
      writeFileSync(join(app, rel), original);
    }
    for (const rec of Object.values(records)) {
      if ((rec.files || []).includes(rel)) {
        rec.files = rec.files.filter((f) => f !== rel);
        rec.overwritesAppShell = true;
      }
    }
  }
  if (shellOverwrites.length) log(`restored app shell: ${shellOverwrites.join(', ')}`);

  // Everything landed. Now the ownership map is complete, so sharing can be computed from the
  // real import graph rather than from declarations alone.
  const ownerOf = new Map();
  for (const rec of Object.values(records)) {
    for (const f of rec.files || []) {
      if (!ownerOf.has(f)) ownerOf.set(f, new Set());
      ownerOf.get(f).add(rec.slug);
    }
  }
  const shared = computeShared(app, ownerOf, sharedAll);
  log(`${shared.size} shared files of ${ownerOf.size}`);

  const routes = {};
  for (const rec of Object.values(records)) {
    if (rec.status) continue;
    const target = routeFor(app, rec.item, rec.files);
    if (!target) { rec.status = 'NO_ROUTE'; rec.stage = 'route'; rec.error = 'no renderable component export found'; continue; }
    rec.route = writeRoute(app, rec.slug, target);
    rec.component = target.named || 'default';
    rec.sourceFile = target.file;
    routes[rec.slug] = rec;
  }

  /*
   * Type errors first, in one pass, attributed by path. Anything blamed here is removed from the
   * build set before `next build` runs, so the build is left to answer the question only it can:
   * do the modules resolve and bundle.
   */
  log(`typechecking ${Object.keys(routes).length} routes…`);
  const tc = typecheck(app);
  let tsFail = 0, tsUnattr = 0;
  if (!tc.ok) {
    for (const [slug, rec] of Object.entries(routes)) {
      const mine = [rec.route, ...(rec.files || [])].filter((f) => f && tc.byFile.has(f));
      if (!mine.length) continue;
      /*
       * Blame follows DECLARATION, not import. @tailark-oss ships one SVG per item and its blocks
       * import them, so every one of those SVGs counts as shared — and blaming by sharing left
       * 221 items unattributed behind a type error that exactly one item published. A file with a
       * single declaring owner is that owner's defect even when half the registry imports it;
       * sharing still governs DELETION, because deleting it would break those importers.
       */
      const exclusive = mine.filter((f) => f === rec.route || (ownerOf.get(f)?.size ?? 0) === 1);
      const errs = mine.map((f) => `${f}\n  ${tc.byFile.get(f).join('\n  ')}`).join('\n').slice(0, 1500);
      if (exclusive.length) { rec.status = 'FAIL'; rec.stage = 'typecheck'; tsFail++; }
      else { rec.status = 'UNATTRIBUTED'; rec.stage = 'typecheck'; tsUnattr++; }
      rec.error = errs;
      rmSync(join(app, 'src/app/i', slug), { recursive: true, force: true });
      delete routes[slug];
    }
    // Files nobody installed a route for can still be red; that is recorded, not blamed.
    log(`typecheck: ${tc.byFile.size} files with errors, ${tsFail} FAIL, ${tsUnattr} UNATTRIBUTED`);
  }

  log(`building ${Object.keys(routes).length} routes…`);
  const b = buildAttribute(app, routes, shared, ownerOf);
  for (const [slug, err] of b.failed) { records[slug].status = 'FAIL'; records[slug].stage = 'build'; records[slug].error = err; }
  for (const [slug, err] of b.unattributed) { records[slug].status = 'UNATTRIBUTED'; records[slug].stage = 'build'; records[slug].error = err; }
  for (const slug of Object.keys(routes)) if (!records[slug].status) records[slug].status = 'BUILT';

  const list = Object.values(records);
  const count = (s) => list.filter((r) => r.status === s).length;
  const summary = {
    registry: REGISTRY, tag: TAG, base: BASE, totalItems: all.length,
    attempted: names.length, offset: OFFSET, split, scaffoldGreen: true,
    built: count('BUILT'), fail: count('FAIL'), unattributed: count('UNATTRIBUTED'),
    noRoute: count('NO_ROUTE'), noFiles: count('NO_FILES'),
    buildOk: b.ok, typecheckOk: tc.ok, typeErrorFiles: tc.byFile.size,
    attributionPasses: b.passes, sharedFiles: shared.size, declaredShared: sharedAll.size,
    batchInstallErrors: batchNotes.length, deadlineHit: !!b.deadlineHit,
    primitiveClobbers: clobbers.length, appShellOverwrites: shellOverwrites.length, appDir: app,
  };
  writeFileSync(join(OUT, `${slugReg}.json`),
    JSON.stringify({ summary, sharedFiles: [...shared], clobbers, batchNotes, items: list }, null, 1));
  log(JSON.stringify(summary));
}

main().catch((e) => { console.error(`[${REGISTRY}] FATAL`, e.message); process.exit(1); });
