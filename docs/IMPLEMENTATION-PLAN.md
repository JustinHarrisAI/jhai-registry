# JHAI Component Sourcing — Implementation Plan

**Goal:** Turn component sourcing from a per-project scavenger hunt into a house capability: multiple vetted shadcn registries reachable from any Claude Code project, a curation index that records decisions, and `@jhai` — a registry serving JHAI's own components into any client build.

**Architecture:** Three layers, built in order. Layer 1 is configuration (registries in `components.json`, which is also what arms the shadcn MCP server). Layer 2 is a JSON index in this repo. Layer 3 is this repo becoming a GitHub-hosted shadcn registry, versioned by git tag, costing nothing to host.

**Tech stack:** shadcn CLI v4+, shadcn MCP server, GitHub as registry host, Next.js + Tailwind + React on the consuming side.

**Companion document:** [RESEARCH.md](RESEARCH.md) — verified registry URLs, licensing, restylability measurements, and the disk inventory this plan depends on. Read it first; this plan assumes its findings.

**Status:** awaiting approval. Nothing below has been executed.

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

## Phase 0 — Decisions and spikes

**Depends on:** Justin answering the open questions at the end of this document.
**Runs:** one session, well under an hour of work once the answers exist.
**Everything downstream is blocked on this.** Two of these are genuine unknowns, not formalities.

### Task 0.1 — Verify the two blocked registries

Motion Primitives and Cult UI sit behind a Vercel Security Checkpoint that returned `429` to every automated fetch. The shadcn CLI is a different client and will probably pass, but "probably" is not a plan.

In a throwaway directory:

```bash
npx shadcn@latest init
npx shadcn@latest add "https://motion-primitives.com/c/in-view.json"
```

**Expected:** the component lands in `components/ui/`.
**If it fails:** both libraries drop to "install manually from docs" and never enter the registries block. Record the outcome in `docs/CURATION.json`.

### Task 0.2 — Spike: does the MCP server see a GitHub registry?

This is the one architectural unknown in the whole plan. `components.json` `registries` takes a **URL template**; GitHub registries are addressed `owner/repo/item` at the CLI. Whether MCP search enumerates a GitHub-hosted registry cleanly was **not verified**.

Stand up a two-item throwaway GitHub registry, wire it, restart Claude Code, and ask the MCP server to search it.

- **Works:** GitHub is the whole hosting story. Phase 3 is simple.
- **Does not work:** add a **GitHub Pages** static mirror serving `https://registry.justinharris.ai/r/{name}.json` for discovery, with GitHub remaining the versioned source of truth. GitHub Pages, not Vercel Hobby — Hobby forbids commercial use, and client work is commercial.

**Do not skip this.** Discovering it during Phase 3 means rebuilding the publication layer.

### Task 0.3 — Confirm the repo's public/private posture

Affects Phase 3's auth work and nothing else, but must be settled before the first commit that contains client-derived patterns.

**What could go wrong in Phase 0:** 0.2 comes back negative and adds a mirror to Phase 3. That is an afternoon, not a redesign. Budget for it.

---

## Phase 1 — Sourcing (Layer 1)

**Depends on:** Phase 0.
**Runs:** one session, roughly 1–2 hours including a real test install per registry.
**Deliverable:** any JHAI project can reach five vetted registries through the shadcn MCP server.

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

### Task 1.3 — Arm the MCP server

```bash
cd ~/Code/jhai-new-website
pnpm dlx shadcn@latest mcp init --client claude
```

Restart Claude Code. Verify with `/mcp`.

### Task 1.4 — Prove it end to end

One real install per registry, on a branch, reverted after:

```bash
npx shadcn@latest add @kibo-ui/marquee
npx shadcn@latest add @tailark-oss/veil-pricing-1
npx shadcn@latest add @magicui/marquee
npx shadcn@latest add @blocks-so/login-01
```

**Verify:** files land in the right aliases, dependencies install, and — the actual test — **each renders in JHAI's palette without editing the component**, because the semantic tokens already resolve through `--jh-*` (RESEARCH.md C.1).

Then ask Claude Code, inside the project: *"find me a pricing table."* If the MCP server returns real installable options across namespaces, Layer 1 is done.

### Task 1.5 — Commit

**What could go wrong:** a registry URL rotates. The mitigation is 1.1 — one file to fix. Second risk: an item installs but paints wrong because JHAI's `--jh-*` values do not cover a token the component expects. That is information, not failure; record it in the curation index.

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

### Task 3.1 — Scaffold

`git init`, `package.json`, root `registry.json` using `include` (May 2026 feature) so each category owns its own manifest:

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "jhai",
  "homepage": "https://registry.justinharris.ai",
  "include": [
    "registry/core/registry.json",
    "registry/sections/registry.json",
    "registry/blocks/registry.json"
  ]
}
```

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

### Task 3.8 — Publish, tag, and verify from outside

Push. Tag `v1.0.0`. Then, from an **unrelated** project, run both:

```bash
npx shadcn@latest add jhai/registry/stat-tile
npx shadcn@latest add jhai/registry/stat-tile#v1.0.0
```

Unpinned must resolve to the default branch; pinned must resolve to the tag. If `@jhai` is private, also verify `gh auth login` locally and a `GH_TOKEN` fine-grained PAT (Contents: Read-only) in CI.

**What could go wrong in Phase 3, in order of likelihood:**

1. **The theming gate fails at 3.2.** Most likely cause: a v2 component paints from a token with no semantic equivalent. Fix by extending `--jh-*`, not by hardcoding in the component.
2. **Registry item paths do not resolve** in a project with different `components.json` aliases. Mitigation: always set `target` with `@components/` placeholders; test in a project with deliberately different aliases.
3. **Scope creep to all 79 components.** The plan is ~21 items. Templates and interior furniture encode JHAI's own information architecture and stay project code. Adding them makes the registry harder to use, not more useful.
4. **Phase 0.2 came back negative** and the mirror is needed. Adds roughly half a day.

---

## Phase 4 — Bootstrap (Layer 0, the ritual)

**Depends on:** Phases 1 and 3.
**Runs:** half a session.
**Deliverable:** `/jhai-project-init` — one invocation arms a new project with every registry plus `@jhai`.

### Task 4.1 — Author the skill

`~/.claude/skills/jhai-project-init/SKILL.md`. It must **merge** into an existing `components.json` rather than overwrite — spec sites arrive in varying states of initialization. It reads the canonical fragment from Task 1.1 so registry URLs live in exactly one place.

### Task 4.2 — Commit to `dot-claude` with an explicit pathspec

```bash
cd ~/.claude && git add -- skills/jhai-project-init && git commit && git push
```

The explicit pathspec matters: `~/.claude` carries roughly 1,100 unrelated pending deletions, and a bare `git add -A` sweeps them in.

### Task 4.3 — Time it on a throwaway

Target: under two minutes from empty Next.js app to working MCP-backed component search. If it is slower than that, it will not get used on spec sites, which is the whole constraint.

**What could go wrong:** the skill overwrites a project's existing `components.json` customizations. Mitigation is 4.1's merge requirement plus a dry-run flag.

---

## Phase 5 — Operate

**Runs:** continuous.

- **Registry URL drift.** Quarterly: re-fetch one item per registry and confirm `200` plus a valid item body. Update `lastVerified` in the curation index. RESEARCH.md documents the exact probe method.
- **`@jhai` updates reaching past client projects.** Deliberate, never automatic — components are copied, not linked. Use CLI v4's `--diff` to find drift, then re-add the pinned item in a branch and review. **This is a feature at spec-site volume:** a bad `@jhai` release cannot break 30 live sites at once.
- **New registries.** Assess against the same bar: verified URL, permissive license, and measured restylability (the token-vs-hardcoded method in RESEARCH.md A.0). Do not add on aesthetics.
- **License re-check** before any new library enters `@jhai`. Commons Clause and "no UI library" clauses are not visible from a repo badge — read the actual LICENSE file. ReactBits' badge says MIT.

---

## Rough timeline

| Phase | Effort | Blocks |
|---|---|---|
| 0 — Decisions and spikes | ~1 session | everything |
| 1 — Sourcing | 1–2 hours | Phase 2 |
| 2 — Curation | 2–3 hours, then continuous | Phase 3 backlog |
| 3 — Publication | 1–2 days | Phase 4 |
| 4 — Bootstrap | half a session | — |
| 5 — Operate | continuous | — |

**Layer 1 delivers value on day one.** Layers 2 and 3 compound. If time runs short, Phase 1 alone already removes the scavenger hunt.

**Total annual cost of the recommended path: $0.**
