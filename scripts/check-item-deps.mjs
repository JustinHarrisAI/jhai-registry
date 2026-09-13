#!/usr/bin/env node
/*
 * Guards the failure mode that passes every other check.
 *
 * An undeclared registryDependency survives `shadcn registry validate` AND `shadcn build`.
 * The item installs fine. It only surfaces as a TS2307 in the CONSUMING repo, after someone
 * else has already run the install. Phase 3 shipped 23 files under manual review and one
 * still slipped through (comparison-table, @shadcn/separator), so the next one will too.
 *
 * This reads the BUILT items in r/ — the flattened JSON with file content inlined, which is
 * exactly what a consumer receives — parses every import out of that content, and resolves
 * each one against what the item actually declares.
 *
 *   node scripts/check-item-deps.mjs
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rDir = join(root, "r");

/** Framework and runtime imports every Next + React project already has. */
const AMBIENT = [/^react$/, /^react\//, /^react-dom$/, /^react-dom\//, /^next$/, /^next\//];

/**
 * Baseline modules a `shadcn init` project always has. @/lib/utils is created by init itself;
 * the rest are the shadcn runtime deps. Anything else under @/ must be declared.
 */
const BASELINE_ALIAS = [/^@\/lib\/utils$/, /^@\/hooks\/use-mobile$/];

const isBuiltin = (s) => s.startsWith("node:");

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g;
const SIDE_EFFECT_RE = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;

/** `lucide-react/foo` and `@scope/pkg/sub` both belong to a package we may have declared. */
function packageName(spec) {
  if (spec.startsWith("@")) return spec.split("/").slice(0, 2).join("/");
  return spec.split("/")[0];
}

const items = readdirSync(rDir)
  .filter((f) => f.endsWith(".json") && f !== "registry.json")
  .map((f) => JSON.parse(readFileSync(join(rDir, f), "utf8")));

/** name -> the basenames that item drops into the project, so relative imports can resolve. */
const providedBy = new Map();
for (const it of items) {
  providedBy.set(
    `@jhai/${it.name}`,
    (it.files ?? []).map((f) => basename(f.target ?? f.path).replace(/\.(tsx?|jsx?)$/, ""))
  );
}

let problems = 0;
const note = (item, msg) => {
  console.error(`✗ ${item}: ${msg}`);
  problems++;
};

for (const it of items) {
  const declaredNpm = new Set((it.dependencies ?? []).map((d) => d.replace(/@[\^~]?[\d.].*$/, "")));
  const declaredReg = it.registryDependencies ?? [];

  // Every basename this item's own files provide, plus everything its @jhai deps provide.
  const localNames = new Set(
    (it.files ?? []).map((f) => basename(f.target ?? f.path).replace(/\.(tsx?|jsx?)$/, ""))
  );
  for (const dep of declaredReg) {
    for (const n of providedBy.get(dep) ?? []) localNames.add(n);
  }

  // @shadcn/x and bare "x" registryDependencies both land in the ui alias directory.
  const shadcnUi = new Set(
    declaredReg
      .filter((d) => d.startsWith("@shadcn/") || !d.includes("/"))
      .map((d) => d.replace(/^@shadcn\//, ""))
  );

  for (const file of it.files ?? []) {
    const content = file.content ?? "";
    const specs = new Set();
    for (const re of [IMPORT_RE, SIDE_EFFECT_RE]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content))) specs.add(m[1]);
    }

    for (const spec of specs) {
      if (isBuiltin(spec)) continue;
      if (AMBIENT.some((r) => r.test(spec))) continue;
      if (BASELINE_ALIAS.some((r) => r.test(spec))) continue;

      if (spec.startsWith(".")) {
        const name = basename(spec).replace(/\.(tsx?|jsx?)$/, "");
        if (!localNames.has(name))
          note(
            it.name,
            `relative import '${spec}' resolves to nothing this item ships or declares. Add the item that provides ${name} to registryDependencies.`
          );
        continue;
      }

      if (spec.startsWith("@/components/ui/") || spec.startsWith("@/ui/")) {
        const name = basename(spec);
        if (!shadcnUi.has(name))
          note(
            it.name,
            `imports the shadcn primitive '${name}' but does not declare '@shadcn/${name}'. This passes validate and build, and fails as TS2307 in the consuming repo.`
          );
        continue;
      }

      if (spec.startsWith("@/")) {
        note(
          it.name,
          `imports '${spec}' from the consuming project's own source tree. A registry item cannot reach into a project's lib — inline the type or ship it as its own item.`
        );
        continue;
      }

      const pkg = packageName(spec);
      if (!declaredNpm.has(pkg))
        note(it.name, `imports the npm package '${pkg}' but does not declare it in dependencies.`);
    }
  }
}

if (problems) {
  console.error(`\n${problems} unaccounted import${problems === 1 ? "" : "s"} across ${items.length} items.`);
  process.exit(1);
}
console.log(`✓ every import in all ${items.length} items is accounted for.`);
