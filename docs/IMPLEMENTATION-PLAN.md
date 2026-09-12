# JHAI Component Sourcing — Implementation Plan

**Goal:** Turn component sourcing from a per-project scavenger hunt into a house capability: multiple vetted shadcn registries reachable from any Claude Code project, a curation index that records decisions, and `@jhai` — a registry serving JHAI's own components into any client build.

**Architecture:** Three layers, built in order. Layer 1 is configuration (registries in `components.json`, which is also what arms the shadcn MCP server). Layer 2 is a JSON index in this repo. Layer 3 is this repo becoming a GitHub-hosted shadcn registry, versioned by git tag, costing nothing to host.

**Tech stack:** shadcn CLI v4+, shadcn MCP server, GitHub as registry host, Next.js + Tailwind + React on the consuming side.

**Companion document:** [RESEARCH.md](RESEARCH.md) — verified registry URLs, licensing, restylability measurements, and the disk inventory this plan depends on. Read it first; this plan assumes its findings.

**Status:** **Phases 0 and 1 executed 2026-09-12 and merged to `main`.** `@jhai` is public; the auth work is deleted. Phase 4a is unblocked and next. Phases 2 and 3 are gated on open questions 3, 4, 5 and 6 — question 1 is answered.

> Sections amended after execution are marked **[DONE]** or **[AMENDED]**. Execution findings live in [RESEARCH.md § 0.0](RESEARCH.md).

---

## Where the free path and the paid path diverge

**They diverge exactly once, at the end of Phase 1, and the divergence is small.**

Everything in Phases 0 through 5 is free. The recommended set — Tailark OSS, Kibo UI, Magic UI, Blocks.so, Fancy Components — is MIT, unkeyed, accountless, and costs **$0/year**. `@jhai` hosted on GitHub costs **$0/year**. There is no point in this plan where the free path stops working.

The paid path is a **narrow, optional branch at Phase 1.5**, taken only if a specific brief needs something the free set does not cover:

| If the need is | Free answer | Paid answer | Annual cost |
|---|---|---|---|
| More marketing blocks | Tailark OSS (259 items) | Tailark Essentials **$249 one-time**, or Shadcnblocks Pro **$149 one-time** | one-time, not recurring |
| Heavy decorative motion | Magic UI + Fancy (MIT) | Aceternity Lifetime **$199 one-time**, 1 seat | one-time |
| Generative component search | existing 21st.dev connection | 21st.dev Builder+AI **$15/mo billed yearly** = $180/yr | recurring — the only recurring cost anywhere in this plan |

**Three consequences of taking the paid branch, all of which argue against it:**

1. **Nothing paid can enter `@jhai`.** Shadcnblocks explicitly bars building a UI library or registry from its components; Aceternity, Tailark paid, and Align UI carry no redistribution grant. Every paid item is a pointer-only curation entry forever. Money spent there buys per-project convenience, never a compounding asset.
2. **Every paid registry adds a key to every project that uses it** (`SHADCNBLOCKS_API_KEY`, or Shadcn Studio's `email` + `license_key` params). At WebVegas spec-site volume that is dozens of `.env` files carrying a credential with no rotation story. This operational cost is larger than the license fee.
3. **A one-time license beats a subscription** on every axis here. If the branch is ever taken, prefer Tailark Essentials ($249 once) or Aceternity Lifetime ($199 once) over 21st.dev's $180/yr recurring — and note the 21st.dev free tier already covers browse, install, and MCP code retrieval, so the recurring spend buys AI credits, not access.

**Recommended: do not take the branch. Target cost $0/year. Revisit only when a specific client brief is blocked, and then only for a one-time license.**

---

## Phase 0 — Decisions and spikes **[DONE 2026-09-12]**

Ran in one session with `shadcn@4.21.0`. Full evidence in [RESEARCH.md § 0.0](RESEARCH.md).

### Task 0.1 — Verify the two blocked registries **[DONE — both FAILED]**

```
pnpm dlx shadcn@4 add "https://motion-primitives.com/c/in-view.json"
  → Failed to fetch from registry (429)
pnpm dlx shadcn@4 add "https://www.cult-ui.com/r/texture-card.json"
  → Failed to fetch from registry (429)
```

The real CLI hits the same Vercel Security Checkpoint that blocked automated fetch. **Neither is eligible for the registries block.** The official community index independently flags both `observing` rather than `healthy`, so its monitoring sees the same thing. Both stay MIT and copyable from their docs in a browser. Worth one retest from a different network before writing them off permanently.

### Task 0.2 — GitHub registry hosting **[DONE — resolved, no mirror needed]**

The concern was real and the original plan's answer was wrong. Namespace names must start with `@` and URLs must contain `{name}`, so `"@jhai": "jhai/registry"` is invalid and the MCP server cannot sweep it. But the fix is not a GitHub Pages mirror — it is a **raw-file namespace over the same repo**:

```json
{ "registries": { "@jhai": "https://raw.githubusercontent.com/JustinHarrisAI/jhai-registry/main/r/{name}.json" } }
```

Verified end to end against `ephraimduncan/blocks`: **`add`, `search`, and `list` all work.** Same repo, same git tags, no build step, no domain, **$0**.

Two consequences for Phase 3, both cheap:

1. The repo must carry **`r/registry.json`** as well as `r/{item}.json`. Search resolves the catalog by substituting `{name}` with `registry`; without that file, `add` works and `search` silently returns nothing.
2. **Versioning swaps the ref in the URL** (`…/jhai-registry/v1.2.0/r/{name}.json`), not a `#tag` suffix.

No auth variant is needed — see Task 0.3.

### Task 0.3 — Repo posture **[DONE — PUBLIC]**

`github.com/JustinHarrisAI/jhai-registry` was flipped public on 2026-09-12 and the anonymous raw fetch verified immediately after (`200`, no credential).

**This deletes work rather than deferring it.** Phase 3 no longer contains any auth task: no `gh auth login`, no `GH_TOKEN`, no fine-grained PAT, no Contents API variant. The zero-key property now holds for `@jhai` as well as for the five third-party registries.

The constraint that makes it safe, and which every future item must respect: **no client-specific code enters this repo.** Client palettes are theme items in the client's own repo. A structural client fork stays in the client repo and returns only as a generalized prop, once a second client needs the same shape.

### Task 0.4 — 21st.dev logo and theme retrieval **[DONE]**

**Both are on the free tier.** Account state is `tier: paid, aiGenerationEnabled: false`.

- **Logo search: free, explicitly unlimited.** The material finding is the source — it wraps **[svgl.app](https://svgl.app), MIT (`pheralb/svgl`), with a keyless public API**. Client logo walls need no 21st.dev account and no paid library; hit `api.svgl.app` directly. Wordmark and dark variants included.
- **Theme retrieval: free, and usable as a `registry:theme` item after a mechanical conversion.** `get_theme` returns raw CSS, not registry JSON — no `$schema`, `name`, or `type`, so it will not install as-is. Converting is trivial: `:root` → `cssVars.light`, `.dark` → `cssVars.dark`, discard `@theme inline` (the CLI regenerates it). **Its real value is as the field checklist** — it enumerates every token a theme item should set, including the easily-forgotten five `--chart-*`, eight `--sidebar-*`, and six `--shadow-*`. A JHAI theme that sets only background/foreground/primary looks correct until the first chart or sidebar renders. The values are someone else's palette; only the field list transfers.

Both strengthen the "do not extend the 21st.dev subscription" call.

**Relume: dropped without further assessment.** Purchased code library with no redistribution grant, so it can never enter `@jhai`, and its coverage overlaps the free five. Recorded in RESEARCH.md section G.

---

## Phase 1 — Sourcing (Layer 1) **[DONE 2026-09-12]**

**Ran in:** one session. **Delivered:** `jhai-new-website` reaches five vetted registries — **789 items** plus shadcn core — through the shadcn MCP server.

Branches, both unmerged in `~/Code/jhai-new-website/`:
- `chore/jhai-registries-phase1` — `components.json` merge and `.mcp.json`. **Mergeable now.**
- `test/jhai-registry-installs` — the five evidence installs. **Do not merge.**

### Task 1.1 — Write the canonical registries fragment

**Create:** `registry/components.registries.json` in this repo — the single source of truth for registry URLs, so a URL change is one edit, not N.

```json
{
  "registries": {
    "@tailark-oss": "https://oss.tailark.com/r/{name}",
    "@kibo-ui":     "https://www.kibo-ui.com/r/{name}.json",
    "@magicui":     "https://magicui.design/r/{name}.json",
    "@blocks-so":   "https://blocks.so/r/{name}.json",
    "@fancy":       "https://www.fancycomponents.dev/r/{name}.json"
  }
}
```

Note `@tailark-oss` has **no `.json` suffix** — its endpoints are `/r/{name}`, verified. Do not normalize it to match the others.

### Task 1.2 — Wire the pilot project

**Modify:** `~/Code/jhai-new-website/components.json` — the `registries` key already exists and is `{}`, so this is a merge, not a restructure.

### Task 1.3 — Arm the MCP server **[DONE, with one fix]**

```bash
cd ~/Code/jhai-new-website
pnpm dlx shadcn@4.21.0 mcp init --client claude
```

**[AMENDED] `mcp init` writes the wrong thing.** It emits `{"command":"npx","args":["shadcn@latest","mcp"]}` — unpinned, and `npx` on this machine cannot resolve a pinned spec at all. `.mcp.json` was rewritten to:

```json
{ "mcpServers": { "shadcn": { "command": "pnpm", "args": ["dlx", "shadcn@4.21.0", "mcp"] } } }
```

**Do this rewrite every time `mcp init` runs.** It is folded into Phase 4a.

`shadcn info` confirms all six namespaces resolve: `@shadcn`, `@tailark-oss`, `@kibo-ui`, `@magicui`, `@blocks-so`, `@fancy`. Each namespace's index was fetched directly to confirm it is searchable, not just installable: Tailark OSS 259 items, Magic UI 250, Fancy 158, Blocks.so 81, Kibo UI 41.

### Task 1.4 — Prove it end to end **[DONE — five of five installed]**

| Item | Landed at | npm deps pulled | tokens / named / hex |
|---|---|---|---|
| `@kibo-ui/marquee` | `src/components/kibo-ui/marquee/index.tsx` | `react-fast-marquee` | 1 / 0 / 0 |
| `@tailark-oss/veil-pricing-1` | `src/components/pricing-1.tsx` + `ui/card.tsx` | — | 8 / 0 / 0 |
| `@magicui/marquee` | `src/components/ui/marquee.tsx` | — | 0 / 0 / 0 |
| `@blocks-so/login-01` | `src/components/login-01.tsx` | — | 5 / 0 / 0 |
| `@fancy/marquee-along-svg-path` | `src/components/fancy/blocks/marquee-along-svg-path.tsx` | `motion` | 0 / 0 / 0 |

**The palette test passed: zero hardcoded colour in all five.** Each renders in the JHAI palette with no edit to the component, because the semantic tokens resolve through `--jh-*` exactly as RESEARCH.md C.1 predicted.

**Three hazards found, none fatal:**

1. **`@magicui/marquee` rewrites `globals.css`** — prepends `@custom-variant dark (&:is(.dark *));` *above the file header* and appends marquee keyframes into the theme block. In a 4,450-line hand-authored stylesheet with its own `.dark` handling that is a real collision risk. **Diff `globals.css` after any Magic UI install.**
2. **Blocks prompt to overwrite existing primitives.** `@tailark-oss/veil-pricing-1` and `@blocks-so/login-01` both asked to overwrite `button.tsx` (plus `input`, `label`, `separator`). **`--yes` does not cover this prompt** — it blocks on stdin. Decline; the block installs correctly against the existing JHAI primitives. Pipe `yes n` for non-interactive runs.
3. **A stray `cn` npm package** was installed into a project that already has `src/lib/utils.ts`. No item declares it directly.

### Task 1.5 — Search the twelve curation needs **[DONE — raw returns handed back, nothing written]**

Ran as CLI `search` (the same engine the MCP tools wrap) plus a direct grep of all 789 index entries, which is more reliable than the fuzzy search. Results are in the report, not written to `CURATION.json` — those calls are Justin's with his copilot.

**Three E.1 answers were wrong** and are corrected in RESEARCH.md: count-up stats, drag rail, and hero-with-video all have real registry options. **Masonry is confirmed as the only genuine gap** — zero hits for `masonry`, `mosaic`, `pinterest`, or `waterfall` across 789 items.

**Also worth knowing: the fuzzy search is weak.** `"count up stats"` returned `striped-pattern`; `"tabs"` returned an SVG logo. Single-word queries work far better than phrases, and grepping the index beats both.

### Task 1.6 — Commit **[DONE]**

**What could go wrong:** a registry URL rotates. The mitigation is 1.1 — one file to fix. Second risk: an item installs but paints wrong because JHAI's `--jh-*` values do not cover a token the component expects. That did not happen in five of five installs.

---

## Phase 2 — Curation (Layer 2)

**Depends on:** Phase 1 (you cannot record a decision you have not tested).
**Runs:** 2–3 hours for the first twelve needs; then continuous, a few minutes per new decision.
**Deliverable:** `docs/CURATION.json` plus a generated `docs/CURATION.md`.

### Task 2.1 — Schema and one worked entry

Use the shape in RESEARCH.md section E. Non-negotiable fields: `need`, `decision`, `choice`, `install`, `why`, `rejected[]`, `restyle`, `license`, `lastVerified`.

**`why` and `rejected` are the entire value.** A bare name gets re-litigated on the next project; a name plus the rejected alternative and the reason does not. An entry without them is not done.

### Task 2.2 — Fill the twelve needs

marquee, count-up stats, drag rail, masonry wall, accordion, tabs, scroll reveal, text reveal, hero with video, pricing table, FAQ, form inputs. RESEARCH.md section E.1 carries proposed answers with reasoning — **treat them as proposals to confirm against a real brief, not as settled doctrine.**

Where the answer is a library, record the library (Embla for drag rails). Where it is "build it," record that plus the `@jhai` item it becomes — that is Phase 3's backlog.

### Task 2.3 — Generator script

**Create:** `scripts/build-curation-md.mjs` — JSON to a readable table. Keeps one source of truth.

### Task 2.4 — Commit

**What could go wrong:** the index goes stale and quietly becomes lying documentation. Mitigation: `lastVerified` on every entry, and a rule that any session which re-litigates a decision must update the entry rather than just picking differently.

---

## Phase 3 — Publication (Layer 3)

**Depends on:** Phases 0.2, 0.3, and 2. This is the actual asset and the largest phase.
**Runs:** 1–2 days across sessions.
**Deliverable:** `npx shadcn add jhai/registry/stat-tile` works in any project.

### Task 3.1 — Scaffold **[AMENDED — two-directory layout]**

`git init` is already done. Add `package.json` and the source-side root `registry.json`, using `include` (May 2026 feature) so each category owns its own manifest:

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "jhai",
  "homepage": "https://github.com/JustinHarrisAI/jhai-registry",
  "include": [
    "registry/core/registry.json",
    "registry/sections/registry.json",
    "registry/blocks/registry.json"
  ]
}
```

**[AMENDED] The repo needs two directories, not one**, because the namespace is a raw-file URL (Task 0.2):

| Directory | Contents | Role |
|---|---|---|
| `registry/` | component source + per-category `registry.json` | authored by hand |
| `r/` | flattened `{item}.json` per item, **plus `r/registry.json`** | emitted by `shadcn build`, committed |

`r/registry.json` is not optional. Search and list resolve the catalog by substituting `{name}` with `registry`; without that file `add` works and `search` silently returns nothing. Run `shadcn registry validate` on `registry/` before every build.

### Task 3.2 — Theme base and the alias layer

**This decides whether the registry is worth building, so it comes before any component.**

Build `@jhai/theme-base` (a `registry:base` item) carrying the `--jh-*` → shadcn semantic mapping that currently lives inline in `~/Code/jhai-new-website/src/app/globals.css` (22 mappings, already correct).

Then add the v2 alias layer in `globals.css`:

```css
@theme inline {
  --color-ink-800: var(--ink-800);
  /* … aliases pointing AT the v2 names */
}
```

**Hard constraint, quoted from `src/styles/v2-theme.css` itself:** "Every custom property below carries the export's own name, verbatim. […] a rename is not a refactor, it is 200 silent rendering failures." **Do not rename a single v2 token.** The alias layer points at those names in one direction only.

**Gate:** a `@jhai` component must land in a project carrying a different `--jh-*` palette and take that palette with zero edits to the component. **If this gate fails, stop and reconsider Phase 3 entirely** — a registry that needs a fork per client is a slower `git clone`. The disk evidence says it will pass (56 of 79 v2 files already have zero hardcoded color), but the gate is the point.

### Task 3.3 — Seed Tier 1 (7 primitives)

`Eyebrow`, `SectionHeader`, `Button`, `CheckList`, `StatTile`, `ImageSlot` (clear its 4 hex first), `icons`. One registry item each. Validate with `shadcn registry validate`.

### Task 3.4 — Seed Tier 2 (14 sections and cards)

Ticker, LogoWall, Questions, Compare, Problem, Answer, CtaBandSection, RecordBand, CTABand, FAQItem, ProofDeck, CaseCard, BlogCard, ToolCard. All already carry zero hardcoded color.

### Task 3.5 — Tier 3 colour cleanup, then seed

Header, PricingCard, Aesir, IndexRail, Close, Megamenu, DemoFrame — 41 hex and 15 named utilities to clear across 23 files total. **Deliberately last**, because Tiers 1 and 2 deliver value without it.

### Task 3.6 — Client theme items

`@jhai/theme-{client}` per active client — a `registry:theme` item carrying only that client's `--jh-*` values. This is what makes a spec site a one-command restyle.

### Task 3.7 — License compliance pass

Every item derived from third-party MIT source fills `meta.upstream`, `meta.upstreamLicense`, and preserves the upstream notice in a file header.

**Nothing derived from ReactBits or shadcnblocks may enter this registry, at any tier, ever.** ReactBits' Commons Clause bars redistribution "alone, in a bundle, or as a ported version"; shadcnblocks bars building a UI library from its components. Both stay pointer-only entries in `docs/CURATION.json`. This is a legal constraint, not a preference — see RESEARCH.md section B.2 for the quoted text.

### Task 3.8 — Publish, tag, and verify from outside **[AMENDED — raw namespace, not item address]**

Push `r/`. Tag `v1.0.0`. Add the namespace to `registry/components.registries.json` and to the pilot project:

```json
{ "registries": { "@jhai": "https://raw.githubusercontent.com/JustinHarrisAI/jhai-registry/main/r/{name}.json" } }
```

Then, from an **unrelated** project, verify all three verbs — `add` alone is not proof, because search needs the index:

```bash
pnpm dlx shadcn@4.21.0 add @jhai/stat-tile
pnpm dlx shadcn@4.21.0 search @jhai -q "stat"
pnpm dlx shadcn@4.21.0 list @jhai
```

Pinning swaps the ref in the URL rather than appending `#tag`:

```
https://raw.githubusercontent.com/JustinHarrisAI/jhai-registry/v1.0.0/r/{name}.json
```

**No auth step.** The repo is public, so the raw host serves it anonymously — verified. Nothing in this task issues, stores, or reads a token.

**What could go wrong in Phase 3, in order of likelihood:**

1. **The theming gate fails at 3.2.** Most likely cause: a v2 component paints from a token with no semantic equivalent. Fix by extending `--jh-*`, not by hardcoding in the component.
2. **Registry item paths do not resolve** in a project with different `components.json` aliases. Mitigation: always set `target` with `@components/` placeholders; test in a project with deliberately different aliases.
3. **Scope creep to all 79 components.** The plan is ~21 items. Templates and interior furniture encode JHAI's own information architecture and stay project code. Adding them makes the registry harder to use, not more useful.
4. **Phase 0.2 came back negative** and the mirror is needed. Adds roughly half a day.

---

## Phase 4 — Bootstrap (Layer 0, the ritual) **[AMENDED — split into 4a and 4b]**

**The split:** the registries-merge half depends only on Phase 1 and ships now. Waiting for Phase 3 would leave every new spec site started in the meantime doing the scavenger hunt by hand, for no reason — the five third-party namespaces are already verified and live.

### Phase 4a — the registries merge **[ships with Phase 1, depends on Phase 1 only]**

**Runs:** half a session. **Deliverable:** `/jhai-project-init` arms any new project with the five verified namespaces and a correctly pinned MCP server.

**Task 4a.1 — Author the skill.** `~/.claude/skills/jhai-project-init/SKILL.md`. Three requirements:

1. **Merge, never overwrite** `components.json` — spec sites arrive in varying states of initialization.
2. Read the canonical block from `jhai-registry/registry/components.registries.json` so registry URLs live in exactly one place.
3. **Rewrite `.mcp.json` after `mcp init`.** The CLI emits `{"command":"npx","args":["shadcn@latest","mcp"]}`; the skill must replace it with `{"command":"pnpm","args":["dlx","shadcn@4.21.0","mcp"]}`. Unpinned is the failure mode Correction 3 exists to prevent, and `npx` cannot pin on this machine at all.

**Task 4a.2 — Commit to `dot-claude` with an explicit pathspec.**

```bash
cd ~/.claude && git add -- skills/jhai-project-init && git commit && git push
```

The explicit pathspec matters: `~/.claude` carries roughly 1,100 unrelated pending deletions, and a bare `git add -A` sweeps them in.

**Task 4a.3 — Time it on a throwaway.** Target: under two minutes from empty Next.js app to working MCP-backed component search. Slower than that and it will not get used on spec sites, which is the whole constraint.

### Phase 4b — add `@jhai` **[depends on Phase 3]**

One line added to the canonical fragment once `r/` exists and Task 3.8 passes. The skill itself does not change — that is the point of keeping the URL list in one file.

**What could go wrong:** the skill clobbers a project's existing `components.json` customizations. Mitigation is 4a.1's merge requirement plus a dry-run flag. Second risk: the pinned version in the skill goes stale. Bump it deliberately, in one place, and let one spec site prove it before the rest follow.

---

## Phase 5 — Operate

**Runs:** continuous.

- **Registry URL drift.** Quarterly: re-fetch one item per registry and confirm `200` plus a valid item body. Update `lastVerified` in the curation index. RESEARCH.md documents the exact probe method.
- **`@jhai` updates reaching past client projects.** Deliberate, never automatic — components are copied, not linked. Use CLI v4's `--diff` to find drift, then re-add the pinned item in a branch and review. **This is a feature at spec-site volume:** a bad `@jhai` release cannot break 30 live sites at once.
- **New registries.** Assess against the same bar: verified URL, permissive license, and measured restylability (the token-vs-hardcoded method in RESEARCH.md A.0). Do not add on aesthetics.
- **License re-check** before any new library enters `@jhai`. Commons Clause and "no UI library" clauses are not visible from a repo badge — read the actual LICENSE file. ReactBits' badge says MIT.

---

## Rough timeline

| Phase | Effort | Status | Blocks |
|---|---|---|---|
| 0 — Decisions and spikes | ~1 session | **DONE** | — |
| 1 — Sourcing | 1–2 hours | **DONE, merged to `main`** | Phase 2 |
| 4a — Bootstrap, registries half | half a session | **next, unblocked** | — |
| 2 — Curation | 2–3 hours, then continuous | gated on Q5, Q6 | Phase 3 backlog |
| 3 — Publication | 1–2 days, **minus the auth work** | gated on Q3, Q6 | Phase 4b |
| 4b — Bootstrap, `@jhai` half | minutes | gated on Phase 3 | — |
| 5 — Operate | continuous | — | — |

**Layer 1 delivered value on day one and is live.** Layers 2 and 3 compound. 4a is the only unblocked work left and should ship before the next spec site starts.

**Total annual cost of the recommended path: $0.**
