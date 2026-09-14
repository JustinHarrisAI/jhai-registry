#!/usr/bin/env node
/**
 * check-no-private-names.mjs — publication constraint, enforced.
 *
 * No JHAI-private name may enter a registry item. Not a brand word, not a client name, not an
 * internal lane code, path or decision reference. A client dev reading installed source should
 * never learn anything about JHAI.
 *
 * This sits alongside the ReactBits / shadcnblocks redistribution bar: those say what may not
 * be SERVED, this says what may not be NAMED. Both are publication constraints and both are
 * checked by `pnpm run preflight`.
 *
 * It exists because review did not catch this. Two components shipped publicly with doc
 * comments naming three real clients, and 34 more carried internal lane codes; the leak was
 * found by diffing an installed file against its registry item, not by reading the diff.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const BANNED = [
  [/\bbjarmi\b/i, 'brand colour name'],
  [/--jh-/, 'JHAI-private token prefix'],
  [/(?<!ui-)\b(?:ink|paper)-\d{2,3}\b/, 'pre-v2 ramp name (use --ui-ink-*)'],
  [/\bdark-text-\d\b/, 'pre-v2 dark vocabulary (use a .dark scope)'],
  [/\b(?:UFC|Caesars|City of Las Vegas|Giostar|Nurse ?Forward|WebVegas|Quotible|Viverano)\b/i, 'client name'],
  [/\bValhalla\b/i, 'internal build name'],
  [/\b(?:builds|clients)\/[a-z0-9-]/i, 'internal repo path'],
  [/\bLane W\d/, 'internal lane code'],
  [/\(D-\d{2}\)/, 'internal decision code'],
  [/\broster section \d/i, 'internal doc reference'],
  [/\bCEO\b/, 'internal role reference'],
  [/\bjustinharris\.ai\b(?!>)/i, 'JHAI domain outside an author field'],
];

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|css|json)$/.test(e.name)) out.push(p);
  }
  return out;
}

const root = process.cwd();
const files = walk(join(root, 'registry')).concat(walk(join(root, 'r')));
const findings = [];

for (const f of files) {
  const rel = relative(root, f);
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      // The author field is a deliberate, expected exception.
      if (/"author"\s*:/.test(line)) return;
      for (const [re, why] of BANNED) {
        const m = line.match(re);
        if (m) findings.push({ file: rel, line: i + 1, match: m[0].slice(0, 60), why });
      }
    });
}

if (findings.length) {
  console.error(`\n✗ ${findings.length} private name(s) in registry items:\n`);
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  "${f.match}"  — ${f.why}`);
  }
  console.error('\nA registry item is published source. Rewrite the name, do not suppress the check.\n');
  process.exit(1);
}
console.log('✓ no JHAI-private names in any registry item.');
