#!/usr/bin/env node
/**
 * check-installed-deps.mjs — the dep guard, pointed at a CONSUMING project.
 *
 * check-item-deps.mjs scans @jhai's own items. That is why shadcn's own `badge` shipping an
 * undeclared `class-variance-authority` passed silently: it is not our item, so nothing looked
 * at it. This walks an installed tree instead and reports every import that resolves to
 * neither a declared package.json dependency nor a local path.
 *
 * Usage:  node check-installed-deps.mjs /path/to/project
 *
 * An undeclared dependency passes shadcn's own `validate` and `build` and only surfaces as a
 * TS2307 in the consuming repo, which is exactly the failure mode this exists to front-run.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.argv[2] || process.cwd();
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const declared = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
]);
// Always available in a Next app without being named in package.json.
const BUILTIN = new Set(['react', 'react-dom', 'next', 'node', 'fs', 'path', 'url']);

const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build']);
function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(join(dir, e.name), out); }
    else if (/\.(tsx|ts|jsx|js)$/.test(e.name)) out.push(join(dir, e.name));
  }
  return out;
}

/** "@scope/pkg/sub" -> "@scope/pkg";  "pkg/sub" -> "pkg" */
const rootOf = (s) => (s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0]);

const IMPORT = /(?:^|\n)\s*import\s[^;]*?from\s+['"]([^'"]+)['"]|(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;
const findings = [];
const src = join(root, 'src');
if (!existsSync(src)) { console.error(`no src/ under ${root}`); process.exit(2); }

for (const f of walk(src)) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(IMPORT)) {
    const spec = m[1] || m[2];
    if (!spec) continue;
    if (spec.startsWith('.') || spec.startsWith('@/') || spec.startsWith('~/')) continue; // local
    const r = rootOf(spec);
    if (BUILTIN.has(r) || r.startsWith('node:')) continue;
    if (!declared.has(r)) findings.push({ file: relative(root, f), spec, pkg: r });
  }
}

if (!findings.length) {
  console.log(`✓ every import under ${relative(process.cwd(), src) || 'src'} resolves to a declared dependency or a local path.`);
  process.exit(0);
}
const byPkg = new Map();
for (const f of findings) {
  if (!byPkg.has(f.pkg)) byPkg.set(f.pkg, []);
  byPkg.get(f.pkg).push(f);
}
console.error(`\n✗ ${byPkg.size} undeclared package(s) imported by installed components:\n`);
for (const [p, fs_] of [...byPkg].sort((a, b) => b[1].length - a[1].length)) {
  console.error(`  ${p}  (${fs_.length} import${fs_.length > 1 ? 's' : ''})`);
  for (const f of fs_.slice(0, 4)) console.error(`      ${f.file}  <- "${f.spec}"`);
}
console.error('\nEach of these is a TS2307 waiting to happen. Declare it, or drop the item.\n');
process.exit(1);
