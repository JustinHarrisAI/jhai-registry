#!/usr/bin/env node
// Generates docs/CURATION.md from docs/CURATION.json.
// One source of truth: edit the JSON, run this, commit both.
//
//   node scripts/build-curation-md.mjs
//   node scripts/build-curation-md.mjs --check   # exit 1 if the markdown is stale

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = join(root, "docs", "CURATION.json");
const mdPath = join(root, "docs", "CURATION.md");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));

const DECISION_LABEL = {
  "registry-item": "registry item",
  library: "library",
  primitive: "primitive",
  build: "build in-house",
};

/** Escape pipes and newlines so a cell cannot break the table. */
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");

const previewCell = (e) => {
  if (!e.preview) return "—";
  const flag = e.previewStatus === "soft-200" ? " ⚠︎" : "";
  return `[preview](${e.preview})${flag}`;
};

const lines = [];

lines.push("# JHAI Curation Index");
lines.push("");
lines.push(
  "> **GENERATED FILE — do not edit.** Source of truth is [CURATION.json](CURATION.json). " +
    "Regenerate with `node scripts/build-curation-md.mjs`."
);
lines.push("");
lines.push(
  `Last full pass **${data.$meta.lastFullPass}** · ${data.$meta.itemsIndexed} items indexed across ` +
    data.$meta.registriesSearched.map((r) => `\`${r}\``).join(", ") +
    ` · ${data.$meta.cli}`
);
lines.push("");
lines.push("## Read this before you search");
lines.push("");
lines.push(
  "**The shadcn fuzzy search is weak. Grep the registry indexes instead when the question is " +
    '"does X exist."** Measured in the Task 1.5 pass: the query `count up stats` returned a striped ' +
    "background pattern, `tabs` returned an SVG logo, and `drag rail carousel` returned a globe. " +
    "Single words beat phrases, but a direct grep of each namespace's `registry.json` beat both and is " +
    "what found the three options the search had missed."
);
lines.push("");
lines.push("```bash");
lines.push("# every wired index, one grep — the reliable way to answer \"does X exist\"");
lines.push("for u in \\");
lines.push('  https://oss.tailark.com/r/registry \\');
lines.push('  https://www.kibo-ui.com/r/registry.json \\');
lines.push('  https://magicui.design/r/registry.json \\');
lines.push('  https://blocks.so/r/registry.json \\');
lines.push('  https://www.fancycomponents.dev/r/registry.json; do');
lines.push('  curl -sL "$u" | grep -io "\\"name\\":\\"[^\\"]*masonry[^\\"]*\\"";');
lines.push("done");
lines.push("```");
lines.push("");
lines.push(
  "A ⚠︎ on a preview link means the host returns HTTP 200 for any path, so the link was not " +
    "provable by status code. Open it before quoting it to a client."
);
lines.push("");
lines.push("## The index");
lines.push("");
lines.push("| Need | Decision | Choice | Install | Preview |");
lines.push("|---|---|---|---|---|");

for (const e of data.entries) {
  const install =
    e.install && e.install.startsWith("pnpm") ? `\`${e.install}\`` : cell(e.install);
  lines.push(
    `| **${cell(e.need)}** | ${DECISION_LABEL[e.decision] ?? e.decision} | ${cell(
      e.choice
    )} | ${install} | ${previewCell(e)} |`
  );
}

lines.push("");
lines.push("## Why, and what was rejected");
lines.push("");
lines.push(
  "The reason is the load-bearing part. A name alone gets re-argued on the next project; a name " +
    "plus the rejected option and its reason does not. **Any session that disagrees with a call here " +
    "must update [CURATION.json](CURATION.json) rather than silently choosing differently.**"
);
lines.push("");

for (const e of data.entries) {
  lines.push(`### ${e.need}`);
  lines.push("");
  lines.push(
    `**${DECISION_LABEL[e.decision] ?? e.decision} — ${e.choice}** · ${e.license} · verified ${e.lastVerified}`
  );
  lines.push("");
  lines.push(e.why);
  lines.push("");
  if (e.previewNote) {
    lines.push(`*Preview caveat: ${e.previewNote}*`);
    lines.push("");
  }
  lines.push(`*Restyling:* ${e.restyle}`);
  lines.push("");
  if (e.rejected?.length) {
    lines.push("Rejected:");
    lines.push("");
    for (const r of e.rejected) lines.push(`- **${r.what}** — ${r.because}`);
    lines.push("");
  }
}

const out = lines.join("\n") + "\n";

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(mdPath, "utf8");
  } catch {
    /* missing counts as stale */
  }
  if (current !== out) {
    console.error("CURATION.md is stale. Run: node scripts/build-curation-md.mjs");
    process.exit(1);
  }
  console.log("CURATION.md is up to date.");
  process.exit(0);
}

writeFileSync(mdPath, out);
console.log(`Wrote docs/CURATION.md — ${data.entries.length} entries.`);
