#!/usr/bin/env node
/*
 * Guards the one failure mode of a raw-file namespace that produces no error.
 *
 * `search` and `list` resolve the catalog by substituting {name} with the literal string
 * "registry", so they read r/registry.json. Without that file, or with it out of step with
 * the flattened items beside it, `add` keeps working and `search` returns nothing — silently,
 * with no warning. Nobody notices until someone asks Claude Code for a JHAI component and
 * gets third-party results.
 *
 *   node scripts/check-registry-index.mjs
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rDir = join(root, "r");
const indexPath = join(rDir, "registry.json");

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
};

if (!existsSync(indexPath)) {
  fail("r/registry.json is missing. `search @jhai` and `list @jhai` will return nothing, with no error. Run: pnpm dlx shadcn@4.21.0 build --output r");
  process.exit(1);
}

const index = JSON.parse(readFileSync(indexPath, "utf8"));
const declared = new Set((index.items ?? []).map((i) => i.name));
const onDisk = new Set(
  readdirSync(rDir)
    .filter((f) => f.endsWith(".json") && f !== "registry.json")
    .map((f) => f.replace(/\.json$/, ""))
);

const missingFromIndex = [...onDisk].filter((n) => !declared.has(n));
const missingOnDisk = [...declared].filter((n) => !onDisk.has(n));

if (missingFromIndex.length)
  fail(`served but absent from r/registry.json, so unsearchable: ${missingFromIndex.join(", ")}`);
if (missingOnDisk.length)
  fail(`listed in r/registry.json but not served, so search finds them and add 404s: ${missingOnDisk.join(", ")}`);
if (!index.homepage) fail("r/registry.json has no homepage field.");

if (process.exitCode) {
  console.error("\nRebuild with: pnpm dlx shadcn@4.21.0 build --output r");
  process.exit(1);
}

console.log(`✓ r/registry.json is in step with r/ — ${declared.size} items, all served and all searchable.`);
