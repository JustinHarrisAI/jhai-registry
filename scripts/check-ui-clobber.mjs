#!/usr/bin/env node
/**
 * check-ui-clobber.mjs — fail loudly when a registry install changed the project's primitives.
 *
 * THE FAILURE THIS CATCHES
 * A shadcn project is compiled against one primitive base. Registry items are free to ship their
 * own `components/ui/*` files, and 1,022 of the 4,452 items measured on 2026-09-15 do. When one
 * of those files imports a different base than the rest of the project, `shadcn add` overwrites
 * the project's button with a foreign one and everything compiled against the old one breaks —
 * silently, because the install reports success.
 *
 * Run it in a consuming project, after installing and before committing:
 *
 *     node check-ui-clobber.mjs            # or: --dir path/to/project
 *
 * Exit 0 when every ui/ file agrees on one base. Exit 1, with the offending files named, when
 * they do not. It is a guard, not a fixer: which base a site uses is a decision, and the fix is
 * either to reinstall the odd file from a matching source or to migrate the project deliberately.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), [])
);
const DIR = args.dir || process.cwd();

const BASES = [
  { name: 'base-ui', re: /from\s+["']@base-ui(-components)?\/react/ },
  { name: 'radix', re: /from\s+["']@radix-ui\/react-/ },
  { name: 'react-aria', re: /from\s+["']react-aria-components?["']/ },
  { name: 'ark-ui', re: /from\s+["']@ark-ui\/react/ },
];

/** The ui directory, wherever components.json says it is. */
function uiDir(root) {
  const cj = join(root, 'components.json');
  let alias = '@/components/ui';
  if (existsSync(cj)) {
    try { alias = JSON.parse(readFileSync(cj, 'utf8')).aliases?.ui || alias; } catch { /* default */ }
  }
  const rel = alias.replace(/^@\//, '');
  for (const candidate of [join(root, 'src', rel), join(root, rel)]) {
    if (existsSync(candidate) && statSync(candidate).isDirectory()) return candidate;
  }
  return null;
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const dir = uiDir(DIR);
if (!dir) {
  console.log('check-ui-clobber: no ui/ directory found — nothing to check.');
  process.exit(0);
}

const byBase = new Map();
for (const file of walk(dir)) {
  const src = readFileSync(file, 'utf8');
  for (const b of BASES) {
    if (!b.re.test(src)) continue;
    if (!byBase.has(b.name)) byBase.set(b.name, []);
    byBase.get(b.name).push(file.replace(`${DIR}/`, ''));
  }
}

if (byBase.size <= 1) {
  const only = [...byBase.keys()][0];
  console.log(`✓ ui/ is consistent — ${only ? `every primitive import is ${only}` : 'no primitive imports at all'}.`);
  process.exit(0);
}

/*
 * More than one base in one ui/ directory. Report the SMALLER group as the intruder: a single
 * overwritten button among thirty Radix files is an accident, and naming it is more useful than
 * announcing that the directory is mixed.
 */
const groups = [...byBase.entries()].sort((a, b) => b[1].length - a[1].length);
const [dominant, ...rest] = groups;
console.error(`✗ ui/ mixes primitive bases. ${dominant[1].length} file(s) import ${dominant[0]}, and:`);
for (const [name, files] of rest) {
  console.error(`\n  ${files.length} file(s) import ${name}:`);
  for (const f of files) console.error(`    ${f}`);
}
console.error(`
A registry item overwrote a shared primitive. Everything compiled against the previous one is
now compiled against a different API — Base UI takes \`render\`, Radix takes \`asChild\` — and the
install reported success.

Fix one of two ways:
  1. Reinstall the named file from a source that matches ${dominant[0]}, or restore it from git.
  2. Migrate the whole project to ${rest[0][0]} deliberately. The primitive base is a per-project
     decision; shadcn takes it at init time as \`-b radix\` or \`-b base\`.
`);
process.exit(1);
