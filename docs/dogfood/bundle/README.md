# JHAI registry dogfood — evidence bundle

Self-contained. You need no other context, no access to the machine that produced it, and no
trust in whoever assembled it. Everything asserted here is re-derivable from what is in this
directory.

**Produced:** 2026-09-12 · **Registry:** `@jhai` v1.0.1 · **CLI:** shadcn 4.21.0
**Published summary:** https://justinharrisai.github.io/jhai-registry/dogfood/
**Registry source:** https://github.com/JustinHarrisAI/jhai-registry

---

## The question

JHAI built a shadcn component registry (`@jhai`) plus a curated set of five third-party
registries, and a bootstrap skill that wires them into a new project. The registry cost real
time to build. **Does a project that has it produce better work than one that does not?**

"Better" was defined in advance as two things, in this order:

1. **Reusable across clients** — can the page take a different brand palette without editing
   component source? JHAI builds many small sites, so a page that needs a find-and-replace per
   client is not reusable at that volume.
2. **Less code to own** — fewer hand-written lines is less to maintain, test and get wrong.

Speed was measured but was not a success criterion.

---

## Method

Two throwaway Next.js 15 + React 19 + Tailwind v4 applications. Identical brief. Two
**separate agent sessions**, neither able to see the other's work or output, so the first could
not contaminate the second.

**The brief, given verbatim to both, with no mention of registries, components, or where to
look:**

> "Build a pricing page with a hero, a three-tier pricing table, an FAQ section, a logo wall,
> and a stats band."

| | repo-a — baseline | repo-b — wired |
|---|---|---|
| Setup | bare `shadcn init` | six registries in `components.json`, shadcn MCP server armed, `@jhai/theme-base` installed |
| Registries reachable | `@shadcn` only | `@shadcn`, `@jhai`, `@tailark-oss`, `@kibo-ui`, `@magicui`, `@blocks-so`, `@fancy` |
| Told about registries? | no | no — the wiring was present, the brief said nothing |

Both repos were required to pass `tsc --noEmit` and `next build`. Both did.

---

## What is in here

```
README.md                    this file
ANALYSIS-BRIEF.md            what to check if you are auditing this — read it second
measure.mjs                  the measurement, re-runnable
measurements.json            its output, deliverable scope
measurements-whole-tree.txt  its output, whole tree, for comparison
reports/                     each agent's own self-report, verbatim and unedited
repo-a/                      baseline source, node_modules and .next stripped
repo-b/                      wired source, same
repo-a/PROVENANCE.json       which files were typed and which a registry installed
repo-b/PROVENANCE.json       same, plus which registry item each file came from
```

---

## Re-verify it yourself

```bash
node measure.mjs              # the numbers below
node measure.mjs --all        # including create-next-app boilerplate, for comparison
node measure.mjs --json       # machine-readable
```

Node 18+. No dependencies, no network, no install.

---

## Results

Scope is **the deliverable**: the pricing route and the components built or installed for it.
`create-next-app`'s demo home page is excluded — it is byte-identical in both repos, neither
agent wrote it, and it is not part of the brief. `--all` includes it.

| | repo-a | repo-b |
|---|---:|---:|
| Wall clock | 2.5 min | 12 min |
| Hand-written lines | 352 | **187** |
| Installed lines | 58 | 1,501 |
| Sections installed | 0 / 5 | **4 / 5** |
| **Hardcoded palette utilities** | **58** | **0** |
| **Semantic tokens** | **0** | **13** |
| Hex literals | 0 | 0 |
| Hex inside brand logo SVGs | 0 | 11 |
| Registry searches run | 0 | 5 |
| `tsc --noEmit` | pass | pass |
| `next build` | pass | pass |
| **Rebrandable by CSS variables alone** | **NO** | **YES** |

### The finding

**repo-a cannot be rebranded.** Its 352 hand-written lines contain 58 utilities bound to fixed
Tailwind colours — `bg-white`, `text-slate-900`, `bg-blue-600` — and zero semantic tokens.
Changing a CSS variable moves nothing. Every client would be a find-and-replace across five
component files.

**repo-b restyles from the token block.** Zero palette utilities in hand-written code, 13
semantic tokens, and every installed component resolves through `--jh-*`.

The line count is the smaller half of the result.

### Where each section came from

| Section | repo-a | repo-b |
|---|---|---|
| Hero | hand, 17 lines | installed — `@tailark-oss/mist-hero-section-1` |
| Pricing table, 3-tier | hand, 116 lines | **hand** — see below |
| FAQ | hand, 84 lines | installed — `@tailark-oss/mist-faqs-1` |
| Logo wall | hand, 37 lines | installed — `@jhai/logo-wall` |
| Stats band | hand, 49 lines | installed — `@jhai/record-band` |

Two of repo-b's four installs came from `@jhai` — the house set being reused on the project
after the one that built it, which is the entire thesis.

---

## What went against the registry

Reported because a bundle that only contains the flattering half is not evidence.

- **repo-b took 12 minutes to repo-a's 2.5.** Searching, installing and reconciling four
  blocks costs more wall-clock on the first page than typing 320 lines of throwaway JSX. On a
  genuinely one-off page, the baseline wins on time.

- **The pricing table — the centre of the brief — still had to be hand-written.** The installed
  `@tailark-oss/mist-pricing-1` turned out to be single-tier enterprise, not three-tier. Seven
  Tailark pricing blocks are indexed and none matched the commonest shape a pricing page needs.
  The unused install is left in repo-b's tree on purpose; see `repo-b/PROVENANCE.json`.

- **Three friction points cost repo-b minutes:** SVG components missing a `<SVGSVGElement>`
  type argument; a hero block importing a header module it does not ship, which needed a
  one-line re-export shim; and block installs prompting to overwrite `button.tsx`, which
  `--yes` does not cover.

- **Two hairline literals were still baked into JHAI's own components** — `border-black/20` in
  Button and `border-black/8` in StatTile. Found by measuring repo-b's output, not by review.
  Both are tokenised in registry v1.0.1; repo-b here carries the pre-fix copies, which is why
  `--all` still shows a few palette hits in its installed files.

---

## One edit was made to the captured source, and it is not a measurement

Assembling this bundle surfaced something unrelated to the experiment: **two `@jhai` components
carried doc comments naming real clients and internal build paths** — a logo-wall comment
naming three clients by name, and an FAQ comment citing internal audit file paths. `@jhai` is a
public repository, and the stated reason it can be public is that no client-specific content
enters it. That was not holding.

Both were rewritten in registry v1.0.1, along with 34 other files carrying internal lane codes
and decision references, and the two affected files were re-synced into `repo-b/` here so the
published bundle does not leak them either. **Only doc comments changed. Not one line of
executable code differs, and no measured number moves** — re-run `measure.mjs` against the
pre-scrub copies if you want to confirm that.

It is recorded because an auditor comparing `repo-b/src/components/jhai/*.tsx` against the
published registry would otherwise find a mismatch and be right to ask about it.

## The one thing worth taking away

**repo-a's own agent reported that its page "reskins via CSS variables alone — no component
edits needed."** It had written 58 hardcoded palette utilities and zero semantic tokens. The
claim was false, stated confidently, and caught only by measuring.

An agent's self-assessment of its own output is not evidence. `reports/` contains both
self-reports unedited so you can compare what each agent claimed against what `measure.mjs`
finds.
