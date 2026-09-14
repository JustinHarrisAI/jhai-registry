#!/usr/bin/env node
/**
 * measure.mjs — the whole measurement, re-runnable.
 *
 * Every number in README.md and in the published comparison page came out of this script.
 * Nothing was counted by hand and nothing was taken from either agent's self-report. Run it
 * yourself and check:
 *
 *     node measure.mjs                 # both repos, summary table
 *     node measure.mjs --json          # machine-readable, for diffing
 *     node measure.mjs --repo repo-b   # one repo
 *
 * WHAT IT COUNTS, AND WHY THESE CATEGORIES
 *
 *   palette   Tailwind utilities bound to a fixed colour in Tailwind's own palette —
 *             bg-white, text-slate-900, bg-blue-600. These CANNOT be moved by changing a
 *             CSS variable. Each one is a manual edit per client. This is the number that
 *             decides whether a page is reusable.
 *
 *   semantic  Utilities bound to a shadcn semantic token — bg-background, text-foreground,
 *             bg-primary, border-border. These resolve through --jh-* and reskin for free.
 *
 *   v2        Utilities bound to the JHAI v2 vocabulary — text-bjarmi-ink, bg-paper-0,
 *             text-type-section. Also free to reskin; counted separately so the house
 *             vocabulary is visible rather than hidden inside "semantic".
 *
 *   hex       Literal #rrggbb anywhere in source. Worst case, EXCEPT inside brand logo
 *             SVGs, which are supposed to carry their own colour. The script reports those
 *             separately rather than holding them against the repo.
 *
 * THE TRAP THIS SCRIPT EXISTS TO AVOID
 *   Repo A's own agent reported that its page "reskins via CSS variables alone — no
 *   component edits needed." It measured 58 palette utilities and 0 semantic tokens, so the
 *   claim is false. An agent's self-assessment of its own output is not evidence. Measure.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const PALETTE =
  /\b(?:bg|text|border|from|to|via|ring|fill|stroke|decoration|outline|shadow|divide|placeholder|accent|caret)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d{1,3})?\b/g;

const SEMANTIC =
  /\b(?:bg|text|border|ring|fill|stroke|divide|outline|placeholder|from|to|via)-(?:background|foreground|primary|secondary|muted|accent|destructive|card|popover|input|border|ring|sidebar)(?:-foreground)?(?:\/\d{1,3})?\b/g;

const V2 =
  /\b(?:bg|text|border|ring|fill|from|to|via)-(?:ink-\d{3}|paper-\d{1,2}|bjarmi-(?:ink|glow|tint)|dark-text-\d|line-(?:light|dark)(?:-soft)?|edge-(?:light|dark)|rule-light|text-(?:heading|body|secondary|eyebrow)|surface-(?:page|raised|dark))\b|\btext-type-[a-z-]+\b/g;

const HEX = /#[0-9A-Fa-f]{3,8}\b/g;
const IMPORT = /^\s*import\s[^;]*?from\s+['"]([^'"]+)['"]/gm;

const SKIP_DIR = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo']);
const CODE = /\.(tsx|ts|jsx|js|mjs)$/;

/** A file is treated as a brand mark if it lives under an svgs/ dir or is named like a logo. */
const isBrandMark = (p) => /\/svgs?\//.test(p) || /(^|\/)logo[\w.-]*\.(tsx|ts|jsx|js)$/i.test(p);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIR.has(e.name)) walk(join(dir, e.name), out);
    } else if (CODE.test(e.name)) {
      out.push(join(dir, e.name));
    }
  }
  return out;
}

const count = (s, re) => (s.match(re) ?? []).length;
const uniq = (s, re) => [...new Set(s.match(re) ?? [])].sort();

/**
 * Hand-written vs installed.
 *
 * Installed files are the ones a registry put there. We do not guess: each repo ships a
 * PROVENANCE.json naming exactly which paths came from which registry item. If it is absent
 * every file counts as hand-written, which is the conservative direction — it can only make
 * the wired repo look worse, never better.
 */
function loadProvenance(root) {
  try {
    return JSON.parse(readFileSync(join(root, 'PROVENANCE.json'), 'utf8'));
  } catch {
    return { installed: [] };
  }
}

/**
 * BOILERPLATE EXCLUSION — read this before trusting any number.
 *
 * `create-next-app` writes a demo home page at src/app/page.tsx carrying 17 palette
 * utilities and 3 hex literals. It is byte-identical in both repos, neither agent wrote a
 * line of it, and it is not part of the brief. Counting it added the same noise to both
 * sides and buried the actual signal: an early pass reported repo-b at 17 palette
 * utilities when every one of them was Vercel's template.
 *
 * So the default scope is THE DELIVERABLE — the pricing route and the components built or
 * installed for it. Pass --all to score the whole tree instead and see for yourself.
 */
const BOILERPLATE = [/^src\/app\/page\.tsx$/, /^src\/app\/layout\.tsx$/, /^src\/app\/globals\.css$/];
const isBoilerplate = (rel) => BOILERPLATE.some((re) => re.test(rel));

function measureRepo(root, { includeBoilerplate = false } = {}) {
  const prov = loadProvenance(root);
  const installed = new Set(prov.installed ?? []);
  const files = walk(root).sort();

  const acc = {
    root: basename(root),
    scope: includeBoilerplate ? 'whole tree' : 'deliverable only (create-next-app boilerplate excluded)',
    boilerplateSkipped: [],
    files: 0,
    handWritten: { files: 0, lines: 0, palette: 0, semantic: 0, v2: 0, hex: 0 },
    installed: { files: 0, lines: 0, palette: 0, semantic: 0, v2: 0, hex: 0 },
    brandMarkHex: 0,
    paletteUtilities: [],
    semanticUtilities: [],
    perFile: [],
  };

  const pal = new Set();
  const sem = new Set();

  for (const abs of files) {
    const rel = relative(root, abs);
    if (!includeBoilerplate && isBoilerplate(rel)) {
      acc.boilerplateSkipped.push(rel);
      continue;
    }
    const src = readFileSync(abs, 'utf8');
    const lines = src.split('\n').length;
    const bucket = installed.has(rel) ? acc.installed : acc.handWritten;

    const p = count(src, PALETTE);
    const s = count(src, SEMANTIC);
    const v = count(src, V2);
    const h = count(src, HEX);

    acc.files++;
    bucket.files++;
    bucket.lines += lines;
    bucket.palette += p;
    bucket.semantic += s;
    bucket.v2 += v;

    // Hex inside a brand mark is legitimate; report it, do not score it.
    if (isBrandMark(rel)) acc.brandMarkHex += h;
    else bucket.hex += h;

    uniq(src, PALETTE).forEach((x) => pal.add(x));
    uniq(src, SEMANTIC).forEach((x) => sem.add(x));

    acc.perFile.push({
      file: rel,
      origin: installed.has(rel) ? 'installed' : 'hand',
      lines,
      palette: p,
      semantic: s,
      v2: v,
      hex: h,
      brandMark: isBrandMark(rel),
      imports: [...src.matchAll(IMPORT)].map((m) => m[1]),
    });
  }

  acc.paletteUtilities = [...pal].sort();
  acc.semanticUtilities = [...sem].sort();

  // The headline judgement, computed rather than asserted.
  const hw = acc.handWritten;
  acc.verdict = {
    rebrandableByCssVarsAlone: hw.palette === 0,
    reason:
      hw.palette === 0
        ? 'No hardcoded palette utilities in hand-written code. Every colour resolves through a CSS variable.'
        : `${hw.palette} hardcoded palette utilities in hand-written code. These cannot be moved by changing a CSS variable; each is a manual edit per client.`,
  };

  return acc;
}

// ── run ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const only = args.includes('--repo') ? args[args.indexOf('--repo') + 1] : null;
const includeBoilerplate = args.includes('--all');
const repos = (only ? [only] : ['repo-a', 'repo-b']).map((r) =>
  measureRepo(join(process.cwd(), r), { includeBoilerplate })
);

if (asJson) {
  console.log(
    JSON.stringify(
      { measuredAt: new Date().toISOString(), scope: repos[0]?.scope, repos },
      null,
      2
    )
  );
  process.exit(0);
}

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);

console.log('\nJHAI dogfood — measured, not reported');
console.log(`scope: ${repos[0]?.scope}\n`);
console.log(pad('', 34) + repos.map((r) => num(r.root, 12)).join(''));
console.log('─'.repeat(34 + repos.length * 12));

const rows = [
  ['files scanned', (r) => r.files],
  ['hand-written files', (r) => r.handWritten.files],
  ['hand-written lines', (r) => r.handWritten.lines],
  ['installed files', (r) => r.installed.files],
  ['installed lines', (r) => r.installed.lines],
  ['— hand-written code only —', () => ''],
  ['palette utilities (bad)', (r) => r.handWritten.palette],
  ['semantic tokens (good)', (r) => r.handWritten.semantic],
  ['v2 tokens (good)', (r) => r.handWritten.v2],
  ['hex literals', (r) => r.handWritten.hex],
  ['— whole tree —', () => ''],
  ['hex in brand marks (ok)', (r) => r.brandMarkHex],
];

for (const [label, fn] of rows) {
  console.log(pad(label, 34) + repos.map((r) => num(fn(r), 12)).join(''));
}

console.log('\nVerdict — rebrandable by CSS variables alone:\n');
for (const r of repos) {
  console.log(`  ${r.root}: ${r.verdict.rebrandableByCssVarsAlone ? 'YES' : 'NO'}`);
  console.log(`    ${r.verdict.reason}`);
  if (r.handWritten.palette > 0) {
    console.log(`    offenders: ${r.paletteUtilities.slice(0, 12).join(', ')}`);
  }
}
console.log('');
