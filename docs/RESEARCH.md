# JHAI Component Sourcing — Research

**Status:** Phases 0, 1, 2, 3 and 4a executed 2026-09-12. `@jhai` is public, tagged **v1.0.0**, serving **24 items**. The C.6 theming gate **passed** — see the box in C.6.
**Date of research:** 2026-09-12. Every price and license claim below was fetched on that date.

> **Amended 2026-09-12 after Phase 0 + 1 execution.** Findings that changed are marked
> **[AMENDED]** inline and summarized in section 0.0 below. Where the original research was
> wrong, the original claim is left visible with the correction beside it rather than
> silently overwritten.

**Repo:** `~/Code/jhai-registry/` — this repo becomes the `@jhai` shadcn registry in Phase 3. Research lives in `docs/`; registry JSON and component source will live in `registry/`.

## How to read this document

This file is written to be self-contained. A Claude Code session in an unrelated repo, with no memory of this one, should be able to open it and act.

Three layers are in scope:

1. **Sourcing** — third-party shadcn registries wired once, reachable from any project through the shadcn MCP server.
2. **Curation** — a vetted index recording which component was chosen for each recurring need, and why.
3. **Publication** — `@jhai`, a private-or-public shadcn registry serving in-house components into any client project.

**Verification convention.** Every registry URL below is marked:

- **VERIFIED** — an HTTP GET returned `200` and a body that parsed as a valid shadcn registry item or registry index. The exact item fetched is named.
- **GATED** — the endpoint exists and returned a structured auth error (`401` / `403`) rather than a page. The gate itself is the verified fact.
- **UNVERIFIED** — could not be confirmed by fetch. The reason is stated. Do not treat these as working.

No URL below was inferred from another library's pattern. Where a shape could not be confirmed, it is marked UNVERIFIED rather than guessed.

---

## 0.0 Phase 0 + 1 execution log — what changed [AMENDED]

Executed 2026-09-12 with `shadcn@4.21.0`. Ten findings, in order of how much they change the plan.

**1. Hosting for `@jhai` is settled, and it is not a GitHub item address.** The shadcn skill spec ([`skills/shadcn/mcp.md`](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/mcp.md)) states that in the `components.json` `registries` map, *"Names must start with `@`"* and *"URLs must contain `{name}`"*. `"@jhai": "jhai/registry"` satisfies neither. The working form, **verified end to end**, is a raw-file namespace over the same repo:

```json
{ "registries": { "@jhai": "https://raw.githubusercontent.com/JustinHarrisAI/jhai-registry/main/r/{name}.json" } }
```

Proven against a real public registry (`ephraimduncan/blocks`, whose repo carries `public/r/*.json`): **`add`, `search`, and `list` all work** behind a raw-file namespace. Same repo, same git tags for versioning, no build step, no domain, $0. The repo is public (C.5), so the raw host serves it anonymously — **no token in any consuming project**, verified after the visibility flip.

**2. The index mechanism.** Search and list resolve the catalog by substituting `{name}` with `registry` — i.e. `…/r/registry.json`, which must be a valid `registry.json` carrying `{name, homepage, items[]}`. **`@jhai` therefore needs both a flattened `r/{item}.json` per item and an `r/registry.json` index.** Without the index, `add` works but `search` returns nothing.

**3. `owner/repo` registries are not dead — just not via `components.json`.** The same spec says public GitHub repos with a root `registry.json` *"can also be used directly as `owner/repo` registry sources … they do not need `components.json` configuration"*, and the MCP `search`/`list` tools accept them in their `registries` argument. So a GitHub-address registry **is** enumerable when named explicitly, but it will never appear in the default "search everything configured" sweep, which is the behavior we actually want. The raw-file namespace is still the right call.

**4. Motion Primitives and Cult UI FAIL with the real CLI.** Task 0.1 run in a throwaway project:

```
pnpm dlx shadcn@4 add "https://motion-primitives.com/c/in-view.json"
  → Failed to fetch from registry (429): https://motion-primitives.com/c/in-view.json

pnpm dlx shadcn@4 add "https://www.cult-ui.com/r/texture-card.json"
  → Failed to fetch from registry (429): https://www.cult-ui.com/r/texture-card.json
```

The CLI hits the same Vercel Security Checkpoint as automated fetch. **Neither is eligible for the registries block.** Both remain MIT and installable by copying from their docs pages in a browser. Caveat: this is one machine on one network; a different IP may not be challenged.

**5. There is an official community registry index, and the original research missed it.** [`https://ui.shadcn.com/r/registries.json`](https://ui.shadcn.com/r/registries.json) — **344 registries**, each with a canonical namespace, URL template, and a health score. Selected entries as of 2026-09-12:

| Namespace | Canonical URL | Health |
|---|---|---|
| `@magicui` | `https://magicui.design/r/{name}` | healthy 98.1 |
| `@ui-layouts` | `https://ui-layouts.com/r/{name}.json` | healthy 98.1 |
| `@intentui` | `https://intentui.com/r/{name}` | healthy 98.2 |
| `@react-bits` | `https://reactbits.dev/r/{name}.json` | healthy 98.2 |
| `@8bitcn` | `https://www.8bitcn.com/r/{name}.json` | healthy 97.9 |
| `@hextaui` | `https://hextaui.com/r/{name}.json` | healthy 97.9 |
| `@smoothui` | `https://smoothui.dev/r/{name}.json` | healthy 95.5 |
| `@kibo-ui` | `https://www.kibo-ui.com/r/{name}.json` | healthy 95.0 |
| `@retroui` | `https://retroui.dev/r/{name}.json` | healthy 95.0 |
| `@kokonutui` | `https://kokonutui.com/r/{name}.json` | healthy 95.0 |
| `@blocks-so` | `https://blocks.so/r/{name}.json` | healthy 92.7 |
| `@shadcn-studio` | `https://shadcnstudio.com/r/{style}/{name}.json` | healthy 92.5 |
| `@aceternity` | `https://ui.aceternity.com/registry/{name}.json` | **degraded** 88.9 |
| `@shadcn-space` | `https://shadcnspace.com/r/{name}.json` | **degraded** 87.7 |
| `@cult-ui` | `https://cult-ui.com/r/{name}.json` | **observing** 84.8 |
| `@motion-primitives` | `https://motion-primitives.com/c/{name}.json` | **observing** 84.8 |
| `@tailark` | `https://tailark.com/r/{name}.json` | **degraded** 84.7 |
| `@shadcnblocks` | `https://shadcnblocks.com/r/{name}.json` | **degraded** 81.1 |

Two things this confirms independently: the Motion Primitives and Cult UI URL shapes in section A.2 were right (both are listed), and both are flagged `observing` rather than `healthy` — the index's own monitoring is seeing the same failures. **Absent from the index: `@tailark-oss`, `@fancy`, `@seraui`, `@relume`, `@21st`.** Absence is not a quality signal; `@tailark-oss` and `@fancy` are both verified working.

**6. Three curation answers in section E.1 were wrong.** Grepping all 789 items across the five wired indexes:

| Need | E.1 said | Reality |
|---|---|---|
| Count-up stats | "build it, nothing better exists" | **Wrong.** `@magicui/number-ticker` and `@fancy/basic-number-ticker` both exist |
| Drag rail | "Embla directly, no component" | **Wrong.** `@fancy/drag-elements`, `@fancy/box-carousel`, `@fancy/simple-carousel`, `@kibo-ui/deck`, `@tailark-oss/motion-primitives-infinite-slider` |
| Hero with video | "build it, nothing handles it well" | **Wrong.** `@tailark-oss/dusk-hero-section-5-video`, `@tailark-oss/dusk-landing-1-hero-video`, `@tailark-oss/dusk-landing-5-hero-video`, `@magicui/hero-video-dialog` |

**7. Masonry is confirmed as the one real gap.** Zero hits for `masonry`, `mosaic`, `pinterest`, or `waterfall` across all 789 items, and three separate fuzzy-search phrasings returned nothing relevant. Testimonial *content* is well covered (11 Tailark OSS blocks) — it is the masonry *layout* that does not exist. CSS `columns-*` or `react-masonry-css` stands.

**8. The CLI must be pinned through `pnpm dlx`, not `npx`.** Current latest is **4.21.0**. On this machine `npx` cannot resolve a pinned spec at all:

```
npx -y shadcn@4.21.0 info   → Unknown command: "shadcn@4.21.0"
npx shadcn@4 info           → npm error Missing script: "shadcn@4"
npx shadcn@latest info      → works (installs 4.21.0)
pnpm dlx shadcn@4.21.0 info → works
```

Only `@latest` works under `npx` here, which is exactly the unpinned behavior Correction 3 exists to prevent. **Every JHAI invocation uses `pnpm dlx shadcn@4.21.0`**, including `.mcp.json`, which `shadcn mcp init` otherwise writes as `npx shadcn@latest mcp`.

**9. Install-time hazards found in Task 1.4.** All five test installs landed with **zero hardcoded colour**, so the palette test passed — each renders in the JHAI palette with no edit to the component. But:

- **`@magicui/marquee` rewrites `globals.css`.** It prepends `@custom-variant dark (&:is(.dark *));` *above the file header* and appends marquee keyframes into the theme block. In a 4,450-line hand-authored stylesheet that already has its own `.dark` handling, that is a real collision risk. Diff `globals.css` after any Magic UI install.
- **Blocks prompt to overwrite existing primitives.** `@tailark-oss/veil-pricing-1` and `@blocks-so/login-01` both asked to overwrite `button.tsx` (and `input`, `label`, `separator`). `--yes` does **not** cover this prompt. Decline — the block installs correctly against the existing JHAI primitives.
- **A stray `cn` npm package** was installed into a project that already has `src/lib/utils.ts`. No item declares it directly.

**10. 21st.dev's logo and theme retrieval are free, and the logo source is upstream-free.** See A.3.

---

## 0. The mechanism (verify this before anything else)

The whole plan rests on shadcn's namespaced-registry feature. Confirmed from the shadcn docs on 2026-09-12:

**`components.json` registries block** ([docs](https://ui.shadcn.com/docs/registry/namespace)):

```json
{
  "registries": {
    "@acme": "https://registry.acme.com/{name}.json",
    "@private": {
      "url": "https://api.company.com/registry/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}",
        "X-API-Key": "${API_KEY}"
      },
      "params": { "version": "latest" }
    }
  }
}
```

- `{name}` is replaced with the item name at install time. `{style}` is an optional second placeholder that substitutes the configured style.
- `${VAR_NAME}` in a header or param is expanded from `process.env`. This is how paid registries are keyed without putting secrets in the repo.
- Install is then `npx shadcn@latest add @acme/button`.

**shadcn MCP server** ([docs](https://ui.shadcn.com/docs/mcp)) — the piece that makes "find me a masonry testimonial wall" work inside Claude Code:

```bash
pnpm dlx shadcn@latest mcp init --client claude
```

which writes to `.mcp.json`:

```json
{ "mcpServers": { "shadcn": { "command": "npx", "args": ["shadcn@latest", "mcp"] } } }
```

**[AMENDED] Do not ship that file as written.** `shadcn mcp init` emits the unpinned `npx` form above. On this machine `npx` cannot resolve a pinned spec at all (see 0.0 finding 8), so the only pinnable invocation is `pnpm dlx`. Every JHAI project uses:

```json
{ "mcpServers": { "shadcn": { "command": "pnpm", "args": ["dlx", "shadcn@4.21.0", "mcp"] } } }
```

The MCP server **reads its registry list from `components.json`**. It does not hold its own config. That is the single most important fact in this document: **wiring registries into `components.json` is what arms the MCP server**, so there is exactly one file to get right per project, and the bootstrap in section D is really just "put the right `components.json` in place."

The server exposes browse, search, install, and multi-registry access across namespaces.

**GitHub registries** ([docs](https://ui.shadcn.com/docs/registry/github)) — landed June 2026 (public) and August 2026 (private), per the [shadcn changelog](https://ui.shadcn.com/docs/changelog):

```bash
pnpm dlx shadcn@latest add <owner>/<repo>/<item>
pnpm dlx shadcn@latest add acme/toolkit/project-conventions#v1.0.0   # tag
pnpm dlx shadcn@latest add acme/toolkit/project-conventions#c0ffee2  # full SHA
```

- The first two path segments are owner and repo. Remaining segments are the **item name, not a file path**.
- Private repos: `gh auth login` locally, or `GH_TOKEN` / `GITHUB_TOKEN` in CI (`GH_TOKEN` wins). Use a fine-grained PAT scoped to the repo with **Contents: Read-only**. *(Documented for completeness only — `@jhai` is public and JHAI uses none of this. See C.5.)*
- Public repos are always read anonymously; credentials are only attempted when the root `registry.json` is not publicly readable.
- Limits: 5 MiB per source file, no GitHub Enterprise hosts, avoid symlinks.

This is the fact that decides section C. **Version pinning and private hosting are both free and built in, via GitHub, with no server to run.**

**[AMENDED] — but `owner/repo/item` is a CLI address, not a `components.json` entry.** Namespace URLs must contain `{name}` and names must start with `@`, so `"@jhai": "jhai/registry"` is invalid and the MCP server will not sweep it. `@jhai` uses a **raw-file namespace over the same repo** instead, which keeps every benefit above and works with search. See 0.0 findings 1–3 and section C.3.

**Schema** — `registry.json` ([docs](https://ui.shadcn.com/docs/registry/registry-json)) requires `$schema`, `name`, `homepage`, and at least one of `items` or `include`. `registry-item.json` ([docs](https://ui.shadcn.com/docs/registry/registry-item-json)) requires `$schema`, `name`, `type`. Type enum: `registry:base`, `registry:block`, `registry:component`, `registry:font`, `registry:lib`, `registry:hook`, `registry:ui`, `registry:page`, `registry:file`, `registry:style`, `registry:theme`, `registry:item`. Full field list is in section C.

---

## A. Registry assessment

### A.0 Method for the restylability column

Restylability was measured, not eyeballed. For each library a real registry item was fetched, the `files[].content` concatenated, and four counts taken:

| Signal | What it means |
|---|---|
| `tokens` | Tailwind utilities bound to shadcn semantic tokens (`bg-background`, `text-primary`, `border-border`, …). **Retheming happens for free.** |
| `named` | Hardcoded Tailwind palette utilities (`bg-zinc-900`, `text-blue-500`, …). **Each one is a manual edit per client.** |
| `hex` | Literal `#rrggbb` in source. Worst case. |
| `cssVars` | Whether the item ships its own `cssVars` block, which the CLI writes into the host stylesheet. |

Raw measurements (one to two items per library — directional, not exhaustive; re-run before relying on any single number):

| Library | Item measured | tokens | named | hex | cssVars |
|---|---|---:|---:|---:|---|
| Tailark OSS | `veil-pricing-1` | 8 | 0 | 0 | no |
| Tailark OSS | `veil-faqs-1` | 5 | 0 | 0 | no |
| Tailark OSS | `veil-hero-section-1` | 3 | 0 | 0 | no |
| 8bitcn UI | `login-form` | 55 | 0 | 0 | no |
| 8bitcn UI | `dialog` | 5 | 0 | 0 | no |
| Retro UI | `accordion` | 9 | 0 | 0 | no |
| Blocks.so | `login-01` | 5 | 0 | 0 | no |
| Shadcnblocks (free) | `hero1` | 4 | 0 | 0 | no |
| Kibo UI | `kanban` | 3 | 0 | 0 | no |
| Kibo UI | `marquee` | 1 | 0 | 0 | no |
| Hexta UI | `accordion` | 3 | 0 | 0 | no |
| Intent UI | `combo-box` | 1 | 0 | 0 | no |
| Magic UI | `marquee` | 0 | 0 | 0 | **yes** |
| Magic UI | `animated-beam` | 0 | 0 | 2 | no |
| Fancy Components | `marquee-along-svg-path` | 0 | 0 | 0 | no |
| Kokonut UI | `particle-button` | 0 | 2 | 0 | no |
| UI-Layouts | `marquee` | 0 | 0 | 0 | no |
| UI-Layouts | `accordion` | 0 | **17** | 0 | no |
| Shadcnspace | `accordion-01` | 3 | 8 | 0 | no |
| SmoothUI | `dynamic-island` | 2 | **32** | 0 | no |
| Sera UI | `accordion` | 0 | **70** | 2 | yes |
| Aceternity UI | `bento-grid` | 1 | 8 | 0 | no |
| Aceternity UI | `infinite-moving-cards` | 0 | 8 | 4 | no |
| ReactBits | `SplitText-TS-CSS` | 0 | 0 | 0 | no |

Reading: a zero in `tokens` is not automatically bad — `marquee`-style behavior components and headless animation wrappers legitimately paint nothing (Fancy, ReactBits, UI-Layouts `marquee`). **The red flag is a high `named` or `hex` count on a component that does paint**: Sera UI (70), SmoothUI (32), UI-Layouts accordion (17), Aceternity (8 named + 4 hex). Those are per-client find-and-replace jobs, ten times over.

The counter-intuitive result, and the one that answers the explicit question about keeping 8bit and retro in scope: **8bitcn UI and Retro UI are among the most restylable libraries in the set.** 8bitcn's `login-form` scored 55 semantic tokens and zero hardcoded colors. The look is carried by borders, pixel fonts, and shadows, not by baked colors, so it retokens cleanly onto a client palette. "Opinionated" and "rigid" turn out to be independent axes.

### A.1 Blocks

| Library | Registry URL template | Status | Cost | Account | Posture | Restylability |
|---|---|---|---|---|---|---|
| **Tailark OSS** | `https://oss.tailark.com/r/{name}` (Base UI, default) and `https://oss.tailark.com/r/radix/{name}` (Radix) | **VERIFIED** — index `/r/registry.json` returned `{"name":"Tailark Base"}` with **259 items**; `veil-hero-section-1`, `veil-pricing-1`, `veil-faqs-1`, `core-use-media` all returned valid items | **Free**, MIT | No | Layout-first, marketing | **Excellent.** Zero hardcoded color across three sampled blocks |
| **Tailark (paid)** | `https://tailark.com/r/{name}.json` | **GATED** — `hero-section-1` returned `401 {"error":"Sign in with a plan that includes blocks to access this resource.","reason":"unauthenticated","required":"blocks"}`. Index `/r/registry.json` is public and lists **469 items** (`"Tailark Base UI"`) | Free tier exists but is account-gated; Essentials **$249**, Complete **$299**, Team **$499** (10 seats), all one-time ([pricing](https://tailark.com/pricing)) | **Yes, even for the free tier** | Layout-first, marketing | Assume same as OSS |
| **UI-Layouts** | `https://www.ui-layouts.com/r/{name}.json` | **VERIFIED** — `marquee`, `accordion` | Free; repo `ui-layouts/uilayouts` is **MIT** | No | Mixed; strong on scroll/motion layouts | **Mixed.** `marquee` clean, `accordion` had 17 hardcoded palette utilities |
| **Shadcn Blocks** (shadcnblocks.com) | `https://www.shadcnblocks.com/r/{style}/{name}` (documented). Flat `https://www.shadcnblocks.com/r/{name}` also resolves | **VERIFIED** — `hero1` and `radix/hero1` both `200` | Free tier real (`hero1` served unauthenticated). Pro **$149**, Premium **$299**, Elite **$399**, all one-time, **single user** ([pricing](https://www.shadcnblocks.com/pricing)) | Free blocks no; Pro needs `SHADCNBLOCKS_API_KEY` as `Authorization: Bearer` | Layout-first, marketing | **Good.** `hero1` token-bound, no hardcoded color |
| **Shadcn Studio** | `https://shadcnstudio.com/r/{category}/{style}/{name}.json` where category ∈ `components`, `blocks`, `pages`, plus `https://shadcnstudio.com/r/themes/{name}.json` | **VERIFIED** — `r/components/new-york-v4/button-01.json` returned a valid item. Valid styles enumerated by the server's own error: `new-york-v4, radix-vega, radix-nova, radix-maia, radix-lyra, radix-mira, radix-luma, radix-sera, radix-rhea, base-vega, base-nova, base-maia, base-lyra, base-mira, base-luma, base-sera, base-rhea` | Free tier real; Pro requires a license key | Free no; Pro passes `params: { email: "${EMAIL}", license_key: "${LICENSE_KEY}" }` | Layout-first | Sample too small to score (154 bytes) |
| **Blocks.so** | `https://blocks.so/r/{name}.json` | **VERIFIED** — `login-01` | **Free**, MIT (`ephraimduncan/blocks`) | No | App-shaped blocks: login, dialog, sidebar, table, stats, file upload, AI chatbox | **Good.** Token-bound, no hardcoded color |
| **Intent UI** | `https://intentui.com/r/{name}.json` | **VERIFIED** — `combo-box` | **Free**, MIT (`irsyadadl/intentui`) | No | Behavior-first — built on `react-aria-components`, so accessibility is the product | **Good.** Token-bound. Note: pulls in React Aria, a different primitive stack from Radix/Base |
| **Smooth UI** | `https://smoothui.dev/r/{name}.json` | **VERIFIED** — `dynamic-island` | **Free**, MIT (`educlopez/smoothui`) | No | Behavior-first, micro-interaction showcase | **Poor.** 32 hardcoded palette utilities in one component |
| **Shadcnspace** | `https://shadcnspace.com/r/{name}.json` | **VERIFIED** — `accordion-01` | Free tier real; Pro requires a plan + API key in `components.json` (shape not directly verified) | Free no; Pro yes | Layout-first | **Mediocre.** 3 tokens against 8 hardcoded |
| **Kibo UI** | `https://www.kibo-ui.com/r/{name}.json`, namespace `@kibo-ui` | **VERIFIED** — `marquee`, `kanban` | **Free**, MIT. Repo is `shadcnblocks/kibo` (formerly `haydenbleasel/kibo`), described "Free and open source, forever" | No | **Behavior-first, and the strongest in the set.** Kanban, Gantt, dropzone, data table, AI chat primitives, marquee | **Excellent.** Token-bound. Docs state it supports **CSS Variables mode only**, which is exactly what we want |
| **8bitcn Blocks** | `https://www.8bitcn.com/r/{name}.json` (same namespace as components) | **VERIFIED** — `login-form`, `main-menu` | **Free**, MIT (`TheOrcDev/8bitcn-ui`) | No | Layout-first, heavily themed | **Excellent, surprisingly.** `login-form` = 55 semantic tokens, 0 hardcoded |

### A.2 Components

| Library | Registry URL template | Status | Cost | Account | Posture | Restylability |
|---|---|---|---|---|---|---|
| **Aceternity UI** | `https://ui.aceternity.com/registry/{name}.json` | **VERIFIED (free tier)** — `bento-grid`, `infinite-moving-cards`, `text-generate-effect`, `sparkles`. **GATED (pro)** — non-free names return `401 {"error":"Unauthorized - Please provide a valid API token or sign in"}` | Free tier free. Annual **$169/yr** (list $249), Lifetime **$199** one-time (list $299), both **1 seat**; Team **$1,590** one-time for 10 ([pricing](https://ui.aceternity.com/pricing)) | Free no; Pro yes | Component-level, decorative/motion-heavy | **Poor.** 8 hardcoded palette utilities plus 4 hex literals across two free components |
| **Magic UI** | `https://magicui.design/r/{name}.json` | **VERIFIED** — `marquee`, `animated-beam` | **Free**, MIT (`magicuidesign/magicui`), 150+ components. Magic UI **Pro $199 one-time** for sections/templates; single template $49 | No (free) | Component-level, motion and text effects | **Good.** `marquee` ships a `cssVars` block, which is the correct pattern. `animated-beam` carries 2 hex (gradient stops — legitimate, but check per client) |
| **Motion Primitives** | `https://motion-primitives.com/c/{name}.json` | **[AMENDED] FAILED — URL shape correct, endpoint unreachable.** The shape is confirmed twice over: their own docs, and the official community index, which lists `@motion-primitives` at exactly this template. But Task 0.1 ran the real CLI and it failed the same way automation did: `Failed to fetch from registry (429)`. The index flags it `observing`, not `healthy`, so the monitoring sees it too. **Not eligible for the registries block.** Still MIT and copyable from their docs in a browser. | **Free**, MIT (`ibelick/motion-primitives`) | No | Component-level, motion primitives | Not measured (blocked) |
| **UI-Layouts** | see A.1 | | | | | |
| **Fancy Components** | `https://www.fancycomponents.dev/r/{name}.json` | **VERIFIED** — `marquee-along-svg-path` | **Free**, MIT (`danielpetho/fancy`) | No | Component-level, physics and text experiments | **Excellent for its class.** Zero color of any kind — it manipulates geometry and type, not paint |
| **Align UI** | **None found.** `alignui.com/r/*` and `www.alignui.com/r/*` return `404` HTML; no docs route found at `/docs/getting-started/installation` (`404`) | **UNVERIFIED — likely no public shadcn registry.** Distributed as a purchased code library, not a CLI registry | Base components **MIT and free**; AlignUI Code Library **$299.99–$399.99** seat-tiered, Figma file **$119.99–$349.99**, bundle **$339.99–$599.99** (Lemon Squeezy listings) | Yes, purchase | Design-system-first, dashboard/SaaS | Not assessable without access |
| **ReactBits** | `https://reactbits.dev/r/{Name}-{TS\|JS}-{CSS\|TW}.json` — e.g. `SplitText-TS-CSS` | **VERIFIED** — `SplitText-TS-CSS`. Note the unusual naming: PascalCase component, language suffix, styling suffix. `Marquee-TS-CSS` does **not** exist (returns the SPA shell at `200`, which is a trap — always parse the body, never trust the status code here) | Free to use | No | Component-level, animation showcase | Clean source, but see section B — **the license, not the styling, is the problem** |
| **Kibo UI** | see A.1 | | | | | |
| **Cult UI** | `https://cult-ui.com/r/{name}.json` | **[AMENDED] FAILED — same as Motion Primitives.** Shape now confirmed by the official community index (`@cult-ui`, flagged `observing`), and the repo `nolly-studio/cult-ui` is MIT with `apps/www/registry.json` carrying `text-animate` and similar. But the real CLI returned `Failed to fetch from registry (429)`. **Not eligible for the registries block.** | **Free**, MIT | No | Component-level, texture/depth-heavy | Not measured (blocked) |
| **Sera UI** | `https://seraui.com/registry/{name}.json` — note `/registry/`, **not** `/r/` | **VERIFIED** — `marquee`, `accordion` | **Free**, MIT (`seraui/seraui`) | No | Component-level | **Worst in the set.** 70 hardcoded palette utilities plus 2 hex in a single accordion. Every client restyle is a rewrite |
| **8bitcn UI** | `https://www.8bitcn.com/r/{name}.json` | **VERIFIED** — `button`, `dialog` | **Free**, MIT | No | Full retro theme over shadcn primitives; 121 registry items | **Excellent.** See A.0 |
| **Retro UI** | `https://retroui.dev/r/{name}.json` | **VERIFIED** — `accordion`. (`button.json` returned `301`; item names vary — read their docs rather than guessing) | **Free**, **BSD-3-Clause** (`Dksie09/retroui`) — not MIT; the 3-clause notice must be preserved on redistribution | No | Neobrutalist theme | **Good.** 9 semantic tokens, zero hardcoded color, 1 `var()` |
| **Kokonut UI** | `https://kokonutui.com/r/{name}.json` | **VERIFIED** — `utils`, `particle-button`. Namespace `@kokonutui` | **Free**, MIT (`kokonut-labs/kokonutui`) | No | Component-level, decorative | **Good.** 2 hardcoded utilities only |
| **Hexta UI** | `https://hextaui.com/r/{name}.json` | **VERIFIED** — `button`, `accordion` | **Free**, MIT (`preetsuthar17/HextaUI`) | No | Component-level | **Good.** Token-bound, no hardcoded color |

### A.3 Bonus — 21st.dev

- **Registry URL:** `https://21st.dev/r/{author}/{component}.json` — **GATED**. `21st.dev/r/serafim/marquee.json` returned `403 {"error":"Authentication required","reason":"authentication_required"}`. Note the two-segment `{author}/{name}` shape, which differs from every other library here.
- **Cost** ([pricing](https://21st.dev/pricing)): Free tier includes unlimited marketplace browsing, component installation, template downloads, SVG logo search, and **component code retrieval via MCP**, with no AI credits. Builder **$6/mo billed yearly**. Builder + AI **$15/mo billed yearly** (500–2,000 monthly AI credits, +100 for $5). Team **$7.50/seat/mo billed yearly**, 2–50 seats.
- **Assessment:** the existing connection already covers the discovery job. The paid tiers buy AI generation, not access. Treat the current connection as the paid slot already spent and do not extend it.

#### A.3.1 [AMENDED] Logo search and theme retrieval — both free, and better than credited

The original assessment credited 21st.dev only for browse and install. Two capabilities were missed, both verified by calling the tools directly on 2026-09-12.

**Account state.** `get_usage` returns `{"tier":"paid","aiGenerationEnabled":false}`. So the connection carries **paid component access but no AI generation**. That is the correct shape — it means nothing further needs buying.

**Logo search — free, unlimited, and upstream-free.** The tool's own description states: *"FREE, no retrieval limit."* A live call for `vercel` returned title, category, `svgUrl`, `darkSvgUrl` (a separate dark-mode variant), and `websiteUrl`.

**The material finding is where those SVGs come from: [svgl.app](https://svgl.app), which is MIT-licensed** (`pheralb/svgl`) **and has a public keyless API.** Verified:

```
https://svgl.app/library/vercel.svg        → 200, raw SVG
https://api.svgl.app?search=stripe         → 200, JSON with route + wordmark variants
```

So client-logo walls need neither a 21st.dev account nor any paid library — hit svgl.app directly, under MIT, with wordmark and dark variants included. 21st.dev is a convenience wrapper over a free source.

**Theme retrieval — free, and it is a working template for `@jhai/theme-{client}`.** `get_theme` is documented *"Free."* A live call returned a **complete, drop-in token set**: a full `:root` block, a full `.dark` block, and an `@theme inline` alias block — every shadcn semantic token plus `--chart-1..5`, the full `--sidebar-*` set, `--font-sans/serif/mono`, the six `--shadow-*` primitives, `--radius`, `--letter-spacing`, and `--spacing`.

**Is that usable as a `registry:theme` item, or only as reference?** Both, but the honest answer is **reference plus a mechanical conversion, not a drop-in.**

- What comes back is **raw CSS text**, not registry JSON. There is no `$schema`, `name`, or `type` — so it cannot be handed to `shadcn add` as-is.
- Converting it is trivial and scriptable: the `:root` block becomes `cssVars.light`, the `.dark` block becomes `cssVars.dark`, and the `@theme inline` block is discarded because the shadcn CLI regenerates those aliases itself. Wrap in `{"$schema": …, "name": "theme-x", "type": "registry:theme", "cssVars": {…}}` and it installs.
- **The reason it matters more as reference:** it is a complete, correct enumeration of every token a theme item should set. That includes the ones easy to forget — all five `--chart-*`, the eight `--sidebar-*`, the six `--shadow-*` primitives, `--letter-spacing`, `--spacing`. A JHAI theme item that sets only `--background` / `--foreground` / `--primary` will look right until the first chart or sidebar appears.
- **What it will not give us:** the JHAI values. These are community themes on someone else's palette. `@jhai/theme-{client}` still gets authored per client; this just settles the field list.

Practical use in Task 3.6: pull one theme, keep it as the checklist, author JHAI's values against it.

Note the theme **search** index is thin — `type: "theme"` with a descriptive query returned zero results, while a bare `"theme"` query sorted by popular returned results. Browse rather than search.

**Net:** 21st.dev's free tier is worth more than section A.3 credited — but it *strengthens* the "do not extend the subscription" call rather than weakening it, and the logo capability is fully replaceable by svgl.app directly.

*(Relume was considered and dropped without further assessment — see the skip list in section G.)*

---

## B. Licensing — the gate on layer 3

The question that matters is narrower than "can I use this." It is: **can I take this source, modify it, and re-serve it from `@jhai`?** That is redistribution, and it is where the permissive assumption breaks.

### B.1 Safe to fork, modify, and re-serve through `@jhai`

MIT permits use, copy, modify, merge, publish, distribute, sublicense, and sell, on the sole condition that the copyright notice and permission notice travel with substantial portions. Verified MIT via the GitHub licenses API on 2026-09-12:

`magicuidesign/magicui`, `shadcnblocks/kibo` (Kibo UI), `ibelick/motion-primitives`, `nolly-studio/cult-ui`, `educlopez/smoothui`, `ephraimduncan/blocks` (Blocks.so), `TheOrcDev/8bitcn-ui`, `kokonut-labs/kokonutui`, `danielpetho/fancy`, `irsyadadl/intentui`, `ui-layouts/uilayouts`, `seraui/seraui`, `preetsuthar17/HextaUI`, `tailark/blocks` (Tailark OSS — `LICENCE.md`, MIT, "Copyright (c) 2025 Irung").

**Compliance pattern for `@jhai`:** any registry item whose source derives from one of these carries a `meta.upstream` field naming the project, its license, and the commit or version taken, and the MIT notice is preserved in a header comment in the file content. That is the entire obligation. Cheap, and it must actually be done.

**Retro UI is BSD-3-Clause, not MIT.** Same practical freedom, plus a no-endorsement clause: do not use "Retro UI" or the author's name to promote a JHAI derivative. Preserve the three-clause notice.

### B.2 Redistribution barred — pointer-only entries required

**ReactBits — MIT + Commons Clause.** Quoting `LICENSE.md` verbatim:

> "You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves—whether alone, in a bundle, or as a ported version.**"

Serving ReactBits source from `@jhai` is redistribution in a bundle, and a modified copy is a ported version. **Both are barred.** Using ReactBits inside a client site is explicitly fine. The compliant pattern is a **pointer-only** curation entry: `@jhai` records *that* ReactBits `SplitText-TS-CSS` is the house answer for a given need, with the upstream install command, and the project installs it directly from `reactbits.dev`. No source is copied into this repo.

**Shadcnblocks.com.** The license grants use of components "to build unlimited **End Products** for themselves, their company, or their **Clients**" — so WebVegas volume is fine on the usage axis. But it prohibits:

> "Resell or redistribute the **Components** or their derivatives separate from an **End Product**"

plus publishing components in public repositories, and building UI libraries or design kits based on the components, for sale **or for free**. A private JHAI registry serving shadcnblocks-derived items is redistribution separate from an End Product, and is also "building a UI library based on the Components." **Barred.** Seats: Standard is one individual; Team covers "up to 10 Employees and Contractors."

**Magic UI Pro.** Components are MIT and free. Pro ($199 one-time, lifetime) permits commercial use but **re-selling of code is not allowed**. Pro *sections and templates* therefore do not belong in `@jhai`; the free MIT components do.

**Aceternity, Align UI, Tailark paid, Shadcn Studio Pro, Shadcnspace Pro.** All keyed or purchased distributions. Absent a license grant that explicitly permits redistribution — and none of them offer one — treat all of them as **pointer-only**. Where a key is required, the key belongs in the consuming project's environment, never in `@jhai`.

### B.3 WebVegas volume — what actually breaks

Per-seat pricing is survivable: Justin is one seat, and every one of these licenses permits unlimited client end products from that seat. **Per-project or per-domain licensing would be fatal at spec-site volume, and none of the libraries assessed here charge that way.**

The real volume hazards are two, and neither is price:

1. **Key distribution.** Any paid registry requires its key present at install time in every project that pulls from it. Across dozens of throwaway spec sites that is dozens of `.env` files carrying a credential with no rotation story. Free unkeyed registries have none of this cost. This alone justifies weighting free options heavily.
2. **The redistribution bar.** Because shadcnblocks, ReactBits, and every paid library are pointer-only, none of them can ever become part of the `@jhai` asset. Money spent there buys per-project convenience, not a reusable asset. Money spent on time spent tokenizing MIT source *does* compound.

**Unusable at WebVegas volume:** nothing outright, but **ReactBits and shadcnblocks are permanently excluded from `@jhai` itself** and must stay pointer-only.

---

## C. The `@jhai` registry — build plan

### C.1 What was found on disk

Before designing anything: the current state of the JHAI codebase was inspected on 2026-09-12.

> **[AMENDED] Seed target confirmed — this is settled, do not reopen.** `@jhai` seeds from **`~/Code/jhai-new-website/src/components/v2/`**. The accent is **`#87a6a6` (Bjarmi)** with **Schibsted Grotesk**. The `DESIGN-SYSTEM.md` in `~/Code/justinharris-ai-website/` — `#7F9590`, Helvetica Now, IBM Plex Sans — is **stale** and should not be used as a palette or type reference for any registry work.

**`~/Code/jhai-new-website/`** — 79 `.tsx` files under `src/components/v2/`, ~493 KB, organized as `core/`, `cards/`, `sections/`, `page/`, `interior/`, `chrome/`, `motion/`, `templates/`. (The working figure of 87 likely includes files outside that tree; the v2 tree itself is 79.)

Measured across all 79 files:

| Signal | Count |
|---|---:|
| `var(--*)` references | 84 |
| Custom Tailwind brand utilities (`bg-near-black`, `text-accent`, …) | 88 |
| shadcn semantic-token utilities | 21 |
| Hardcoded hex | 41 |
| Hardcoded palette utilities | 15 |
| **Files with zero hardcoded color** | **56 of 79** |

**`components.json` already exists** and is already shaped for this work:

```json
{ "style": "base-nova", "tailwind": { "cssVariables": true, ... }, "registries": {} }
```

`registries` is an empty object. Layer 1 is a one-line edit away.

**The theming layer already exists, and it is better than expected.** `src/app/globals.css` maps shadcn's semantic tokens onto a `--jh-*` brand layer — 22 such mappings, including:

```css
--background: var(--jh-bg);
--foreground: var(--jh-text);
--primary:    var(--jh-accent);
--border:     var(--jh-border);
/* and the .dark variants: --background: var(--jh-invert-bg); etc. */
```

`--jh-*` is itself declared in `:root` with the stated contract, in the file's own words, that "a restyle rewrites that block."

**This is the single most important finding in section C.** A third-party registry item that paints with `bg-background` / `text-primary` already resolves through `--jh-*` and already restyles per client by rewriting one block. **The theming layer is not something to build. It is something to finish.**

The gap runs the other way. The v2 components paint from a **second, unmapped vocabulary**: `var(--ease)` ×19, `var(--accent)` ×19, `var(--dur-fast)` ×9, `var(--ink-950)`, `var(--paper-0)`, `var(--line-light)`, declared in `src/styles/v2-theme.css`. That file carries an explicit and binding name contract:

> "Every custom property below carries the export's own name, verbatim. `--ink-800` is `--ink-800`. […] a rename is not a refactor, it is 200 silent rendering failures."

It also states there is deliberately no `@theme` block and no `--color-*` alias set, and says where one would go if wanted:

> "`@theme inline { --color-ink-800: var(--ink-800); }` — aliases pointing AT these names, never a second vocabulary."

So: **do not rename v2 tokens.** Add a one-directional alias layer mapping `--ink-*` / `--paper-*` / `--accent` / `--line-*` onto the shadcn semantic names, so a `@jhai` item exported from v2 source restyles through the same single block as everything else. That alias file is the deliverable, and it is small.

### C.2 Schema for the JHAI case

`registry.json` at the repo root:

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

`include` (shipped May 2026) lets each category own its own manifest, so adding a component touches one small file instead of one growing one. `shadcn registry validate` (same release) checks it before publishing.

A representative `registry-item.json`, showing every field that matters here:

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "stat-tile",
  "type": "registry:component",
  "title": "Stat Tile",
  "description": "Count-up statistic tile with eyebrow, figure, and caption.",
  "author": "Justin Harris <justin@justinharris.ai>",
  "categories": ["stats", "marketing"],
  "registryDependencies": ["@jhai/eyebrow"],
  "dependencies": ["motion"],
  "files": [
    {
      "path": "registry/core/stat-tile/stat-tile.tsx",
      "type": "registry:component",
      "target": "@components/jhai/stat-tile.tsx"
    }
  ],
  "cssVars": {
    "theme": { "font-heading": "Schibsted Grotesk, sans-serif" },
    "light": { "jhai-stat-rule": "var(--border)" },
    "dark":  { "jhai-stat-rule": "var(--border)" }
  },
  "css": { "@layer components": {} },
  "docs": "Requires the @jhai/theme base item for token aliases.",
  "meta": {
    "upstream": null,
    "upstreamLicense": null,
    "jhaiVersion": "1.0.0"
  }
}
```

Rules specific to this registry:

- **`target` is required** for `registry:page` and `registry:file`. Placeholders `@components/`, `@ui/`, `@lib/` resolve against the consuming project's `components.json` aliases — which is what makes one item land correctly in a flagship build and a spec site with different folder conventions.
- **`registryDependencies` address forms:** bare name = shadcn core (`button`); `@namespace/item` = another registry; `owner/repo/item#v1.2.0` = a pinned GitHub item; a full URL; or a relative `./item.json`. **Refs are not inherited** — every GitHub dependency that must be reproducible pins its own tag or full SHA.
- **`dependencies` pin npm versions** with `name@version`, e.g. `motion@^11.0.0`.
- **`meta.upstream` / `meta.upstreamLicense`** are the license-compliance hook from section B.1. Every item derived from third-party MIT source fills them in, and the MIT notice is preserved in the file header. This field is how a future session knows what it is allowed to do with an item.
- **A `registry:theme` item** carries the client palette (see C.6).

### C.3 Hosting

| Option | Cost | Versioning | Private | Verdict |
|---|---|---|---|---|
| **GitHub registry** (this repo, **public**) | **$0** on any GitHub plan | **Built in** — git tag in the raw URL path | **Not used.** Public, read anonymously, zero keys — see C.5 | **Chosen** |
| Vercel static JSON | $0 on Hobby. **But** Hobby forbids commercial use, and client work is commercial — a Pro seat is ~$20/mo | Manual: version in the path or a `params` version | Only via a custom auth route, which means owning an endpoint | Optional mirror, not the primary |
| Private registry with auth headers | Hosting cost plus an endpoint to maintain | Manual | Yes | **Rejected.** Every consuming project would carry a key — the exact cost B.3 identifies as the real hazard of paid registries |

**Decided: a public GitHub repo, served over `raw.githubusercontent.com`, is the only thing built in Phase 3. Annual cost $0, zero keys.**

Why this wins and it is not close:

- No deploy step. A merge to `main` publishes. No build, no cache invalidation, no domain.
- Version pinning is the feature, not a workaround. `jhai/registry/stat-tile#v1.2.0` is reproducible by construction.
- The public/private decision becomes per-repo rather than per-architecture, and can be changed later without touching a single consuming project's `components.json` — the address stays `owner/repo/item`.
- It removes the Vercel Hobby licensing question entirely. Hobby is non-commercial; client sites are commercial; a registry serving client work on Hobby is the kind of quiet violation that only surfaces at a bad moment.

**[AMENDED] The caveat above is resolved, and the answer is better than the mirror.** The concern was real: `components.json` namespace names must start with `@` and URLs must contain `{name}`, so `"@jhai": "jhai/registry"` is invalid and the MCP server cannot sweep a GitHub item address. But **no mirror is needed**. Serve flattened item JSON from an `r/` directory in this same repo and point the namespace at raw GitHub:

```json
{ "registries": { "@jhai": "https://raw.githubusercontent.com/JustinHarrisAI/jhai-registry/main/r/{name}.json" } }
```

Verified end to end against `ephraimduncan/blocks` (which already serves `public/r/*.json` from its repo): **`add`, `search`, and `list` all work** behind a raw-file namespace. Same repo, same git tags, no build step, no domain, no Vercel, no GitHub Pages, **$0**.

> ### ⚠️ BUILD REQUIREMENT — `r/registry.json` is not optional
>
> **A raw-file namespace supports `search` and `list` ONLY if `r/registry.json` sits alongside the flattened items**, because the CLI resolves the catalog by substituting `{name}` with the literal string `registry`.
>
> **Without it, `add` works and `search` returns nothing — silently, with no error.** That is the worst possible failure mode: the registry looks installed and correct, and the MCP server simply never surfaces a single `@jhai` item in any search. Nobody notices until someone asks Claude Code for a JHAI component and gets third-party results instead.
>
> This is a Phase 3 build requirement, not a note. `r/registry.json` must be a valid `registry.json` carrying `{name, homepage, items[]}`, and it must be regenerated and committed every time an item is added.

**Versioning swaps the ref in the URL**, not a `#tag` suffix: `…/jhai-registry/v1.2.0/r/{name}.json`. Git tags still do the work; the address form differs from the `owner/repo/item#tag` documented in section 0.

> ### ⏱ `raw.githubusercontent.com` CACHES — measured, and it will fool you
>
> A pushed registry fix continued serving the **old** JSON for several minutes. Observed twice on 2026-09-12: `comparison-table.json` served its pre-fix `registryDependencies` well after the push landed, and a `theme-base` change needed a ~45-second wait before an install picked it up.
>
> **The ritual after pushing any registry change:**
>
> 1. Confirm the built file on disk is right — `git show HEAD:r/<item>.json`.
> 2. **Wait, then re-fetch** before concluding anything: `curl -sL .../r/<item>.json`.
> 3. Only then re-run the install and judge the result.
>
> **Do not "fix" a fix that already worked.** The failure mode is a session pushing a correct change, seeing stale content, assuming it failed, and pushing a second speculative change on top of it. A pinned tag URL has the same behaviour on first fetch.

**No auth variant is needed, and none should be built.** `@jhai` is public (C.5), so `raw.githubusercontent.com` serves it anonymously. **Verified 2026-09-12:** after flipping the repo public, `https://raw.githubusercontent.com/JustinHarrisAI/jhai-registry/main/registry/components.registries.json` returned `200` with no credential of any kind.

That is the property the whole design rests on: **zero keys in any consuming project.** A private registry would put a `GH_TOKEN` in every spec site, which is precisely the operational cost that section B.3 identifies as the real hazard of paid registries. Choosing a private `@jhai` would have reintroduced that cost against our own registry, for nothing.

**Also note:** Registry Health (the monitoring behind the community index) does not monitor GitHub registries consumed through `owner/repo/item` addresses. A raw-file namespace is likewise unmonitored. Neither matters for a registry we own and can probe ourselves.

### C.4 Versioning

Git tags on this repo, consumed as `#ref`:

- Unpinned (`jhai/registry/stat-tile`) resolves to the default branch — correct for internal work and throwaway spec sites, which should ride latest.
- Pinned (`jhai/registry/stat-tile#v1.4.0`) for delivered client builds.
- Full SHA where exactness matters more than readability.

A fix reaching past client projects is therefore deliberate, not automatic: re-run `npx shadcn add jhai/registry/stat-tile#v1.4.1` in that project. CLI v4 (March 2026) added `--diff` to check a project against registry updates and surface drift, which is what turns "which of my client sites have the old card" from an audit into a command.

Because components are copied into the consuming project, **there is no such thing as a silent fix**. That is a feature at WebVegas volume — a bad `@jhai` release cannot break 30 live sites at once — but it means the update ritual has to be written down, not remembered.

### C.5 Repo posture — **[AMENDED] `@jhai` is PUBLIC. Settled, do not reopen.**

`github.com/JustinHarrisAI/jhai-registry` is public as of 2026-09-12.

**The rationale, which is also a design constraint on every future item:**

- **No client-specific code ever enters this registry.** Client palettes live as theme items **in the client's own repo**, not here.
- **Structural client forks stay in the client repo.** A fork returns to `@jhai` only when a second client needs the same shape, and only as a generalized prop.

So there is nothing to protect. And the payoff is the property the whole design depends on: **a public repo is read anonymously, so no consuming project ever carries a `GH_TOKEN`.** Zero keys, everywhere.

**Consequences — all of this work is now deleted, not deferred:**

- No `gh auth login` step.
- No `GH_TOKEN` / `GITHUB_TOKEN` in any project, CI job, or spec site.
- No fine-grained PAT to issue, scope, or rotate.
- No GitHub Contents API variant. `raw.githubusercontent.com` is the only address form.

Cost: **$0**, with one fewer moving part than the private design.

### C.6 Theming — one component set, many client brands

The architecture is already 80% present (C.1). The full shape:

```
Client brand palette                 →  registry:theme item, one per client
  --jh-bg / --jh-text / --jh-accent …
        ↓ (already exists in globals.css, 22 mappings)
shadcn semantic tokens
  --background / --foreground / --primary / --border …
        ↓ (to be built — the alias layer)
v2 vocabulary
  --ink-950 / --paper-0 / --accent / --line-light …
```

**[AMENDED] Two moves, not three. Client theme items do NOT live in `@jhai`.**

1. **`@jhai/theme-base`** — a `registry:base` item carrying the `--jh-*` → shadcn mapping that currently lives inline in `globals.css`, **with JHAI's default values**, so every new project inherits it in one install instead of by copy-paste. This is the only theme item `@jhai` ever ships.
2. **The alias layer** — `@theme inline { --color-ink-800: var(--ink-800); … }` in `globals.css`, pointing *at* the v2 names, per the contract quoted in C.1. **No v2 token is renamed.** This is what lets a `@jhai` component built from v2 source restyle through the same block as a Kibo or Tailark component.

**Per-client theming is a client-repo concern.** A client project installs `theme-base` once, then overwrites the `--jh-*` block in its own `globals.css`. That is already exactly how `jhai-new-website` works today, so it is the existing mechanism rather than a new one.

**Why no `theme-{client}` items:** `@jhai` is public (C.5). A public list of client names and their brand palettes is not something JHAI publishes. That constraint is what keeps the registry publishable at all, and it is worth more than the convenience of a one-command client restyle.

*(This removes Task 3.6 from the implementation plan entirely. The 3.2 theming gate still runs — tested against a hand-written palette block in a throwaway project, which is a truer test anyway, since it proves a stranger's palette works rather than one we authored inside the registry.)*

**This is the test of whether the registry is worth building.** If a `@jhai` section cannot land in a client project and take that client's palette without editing the component, the registry is just a slower `git clone` and should not be built.

> ### ✅ [AMENDED] THE GATE PASSED — measured 2026-09-12
>
> A fresh Next.js project, `@jhai/theme-base` installed, then **ten `--jh-*` values hand-written** as a terracotta-on-warm-paper palette. Nothing else touched, **zero edits to any component.** Computed styles read off the rendered page:
>
> | Probe | Rendered | Expected from the client palette |
> |---|---|---|
> | page ground | `#fdfbf7` | `--jh-light-bg` ✓ |
> | eyebrow | `#7a6a60` | `--jh-ink-eyebrow` ✓ |
> | accent eyebrow | `#8a4a22` | `--jh-primary-deep` via `--bjarmi-ink` ✓ |
> | heading | `#1a1614` @ weight 500 | `--jh-light-text` ✓ |
> | side note | `#6f635c` | `--jh-light-text-faint` ✓ |
> | primary button | `#1a1614` on `#fffdf9`, 50px | `--ink-800` / `--paper-0` / `--button-h` ✓ |
> | check mark | `#8a4a22` | `--bjarmi-ink` ✓ |
> | dark band | `#14100e` | `--jh-invert-bg` ✓ |
> | dark eyebrow | `#c2703d` | `--jh-primary` via `--bjarmi-glow` ✓ |
> | shadcn `--background` | `#fdfbf7` | third-party items inherit it too ✓ |
> | eyebrow recipe | 9.5px / 2.28px tracking | invariant survived ✓ |
>
> The whole chain resolves. **The registry is worth building.**
>
> It also proved the `@components/` target placeholder: installed into a project whose alias was deliberately `@/widgets`, files landed in `src/widgets/jhai/`.

The disk evidence predicted this: 56 of 79 v2 files already carried zero hardcoded color, and the semantic mapping already existed. **The work was finishing a handful of files and writing one token chain, not architecting a system.**

### C.7 Seed set — what goes in first

Selection rule: generic in shape, zero hardcoded color, and used more than once already. From the 79:

**Tier 1 — seed these first (primitives; high reuse, low risk):**
`core/Eyebrow.tsx`, `core/SectionHeader.tsx`, `core/Button.tsx`, `core/CheckList.tsx`, `core/StatTile.tsx`, `core/ImageSlot.tsx` (4 hex to clear first), `sections/icons.tsx`.

**Tier 2 — sections with clean color and obvious cross-client value:**
`sections/Ticker.tsx` (marquee), `sections/LogoWall.tsx`, `sections/Questions.tsx` (FAQ), `sections/Compare.tsx`, `sections/Problem.tsx`, `sections/Answer.tsx`, `sections/CtaBandSection.tsx`, `sections/RecordBand.tsx`, `page/CTABand.tsx`, `page/FAQItem.tsx`, `page/ProofDeck.tsx`, `cards/CaseCard.tsx`, `cards/BlogCard.tsx`, `cards/ToolCard.tsx`.

**Tier 3 — [AMENDED] DEFERRED, do not clear the colour now:**
`chrome/Header.tsx` (3 named + 6 hex), `cards/PricingCard.tsx`, `sections/Aesir.tsx`, `sections/IndexRail.tsx`, `sections/Close.tsx`, `chrome/Megamenu.tsx`, `page/DemoFrame.tsx`.

These seven stay project code until a client actually needs one of them. Clearing 41 hex literals and 15 palette utilities speculatively is work against a demand that may never arrive, and the components would sit unused in the registry meanwhile. When a client needs one, clear that one.

**Stay project code, do not registry-ize:**
`templates/*` (14 files — they encode JHAI's own information architecture and page composition, not reusable UI), `interior/*` mostly (article and case-study furniture tied to JHAI content shapes), `motion/MotionRuntime.tsx` (an app-level runtime, not a component), `chrome/Footer.tsx` and `SiteChromeHeader.tsx` (brand-specific by nature).

**[AMENDED] Seed scope is settled: 21 items, Tiers 1 and 2 only.** Not 79, and not Tier 3. The right first registry is small and correct.

---

## D. Project bootstrap

**Recommended mechanism: a Claude Code skill, `/jhai-project-init`, backed by a checked-in `components.json` fragment in this repo.**

Why a skill and not the alternatives:

| Mechanism | Why not |
|---|---|
| Template repo | Forks the config. Every registry URL change means N stale repos and no way to find them. Fatal at spec-site volume. |
| CLI script (`jhai-cli`) | Works, and `packages/jhai-cli` already exists — but it is a second install surface to keep current, and it cannot reason about an existing project's `components.json`. |
| **Claude skill** | **Recommended.** Already the invocation surface for every project. Can read an existing `components.json` and merge rather than overwrite. Version-controlled in `dot-claude`. Costs one line to run. |
| Plugin | More machinery than a config merge warrants. |

The whole ritual, for a throwaway spec site:

```bash
pnpm dlx shadcn@4.21.0 init                      # if not already initialized
# skill merges the registries block into components.json
pnpm dlx shadcn@4.21.0 mcp init --client claude  # arms the MCP server
# then rewrite .mcp.json to the pinned pnpm dlx form — mcp init emits unpinned npx
```

**[AMENDED] Pin the CLI, and use `pnpm dlx` to do it.** Current latest is **4.21.0**. `npx` on this machine cannot resolve a pinned spec (`npx -y shadcn@4.21.0` → `Unknown command`), so `pnpm dlx` is the only invocation that both works and pins. One breaking release must not be able to reach every spec site at once.

The `components.json` fragment the skill merges — canonical copy at [`registry/components.registries.json`](../registry/components.registries.json), so there is exactly one place to update a URL:

```json
{
  "registries": {
    "@jhai":        "https://raw.githubusercontent.com/JustinHarrisAI/jhai-registry/main/r/{name}.json",
    "@tailark-oss": "https://oss.tailark.com/r/{name}",
    "@kibo-ui":     "https://www.kibo-ui.com/r/{name}.json",
    "@magicui":     "https://magicui.design/r/{name}.json",
    "@blocks-so":   "https://blocks.so/r/{name}.json",
    "@fancy":       "https://www.fancycomponents.dev/r/{name}.json"
  }
}
```

**[AMENDED] The `@jhai` entry is now settled** (see C.3) — a raw-file namespace over this repo, not a GitHub item address, because namespace URLs must contain `{name}`. It is shown greyed here because the `r/` directory does not exist until Phase 3; **the five third-party entries ship now** and are already live in `jhai-new-website`.

**Env vars: none. Not one, anywhere in the design.** The five third-party registries are unkeyed, and `@jhai` is public so it is read anonymously. There is no `GH_TOKEN`, no PAT, no `.env` entry in any project or CI job. Any future proposal that adds one is a change to the core property of this system, not a detail.

Time cost per new project: one skill invocation plus one MCP init. That is fast enough for a spec site.

---

## E. The curation index

**[BUILT 2026-09-12 — see [CURATION.json](CURATION.json) and [CURATION.md](CURATION.md).]** 13 entries, generated by `scripts/build-curation-md.mjs`. The entries below were the proposals; **the built index uses the Task 1.5 raw returns instead**, because three of these proposals turned out to be wrong.

**Doctrine, settled:** the built entries are house doctrine as written, each carrying a `lastVerified` date. **Any future session that re-litigates an entry must update `CURATION.json` rather than silently picking differently.** An undocumented divergence is the failure this index exists to prevent.

**Format: one JSON file, `docs/CURATION.json`, plus a generated `docs/CURATION.md` for reading.** JSON because a fresh Claude session should be able to answer "what do we use for a drag rail" without parsing prose, and because the MCP-driven flow benefits from exact install strings. Markdown because Justin should be able to skim it.

Entry shape:

```json
{
  "need": "drag-rail",
  "decision": "library",
  "choice": "embla-carousel-react",
  "install": "pnpm add embla-carousel-react",
  "why": "Drag physics is a library problem, not a component problem. Every shadcn 'carousel' item wraps Embla anyway; wrapping it ourselves keeps the API ours and drops a layer.",
  "rejected": [
    { "what": "@kibo-ui/marquee", "because": "Auto-scroll, not user-draggable. Different need." }
  ],
  "restyle": "Unstyled. Paint the slides with semantic tokens.",
  "license": "MIT",
  "lastVerified": "2026-09-12"
}
```

`decision` is one of `registry-item`, `library`, `primitive` (build from shadcn core), or `build` (in-house, becomes an `@jhai` item).

**The `why` and `rejected` fields are the whole point.** A name alone gets re-litigated; a name plus the rejected alternative and its reason does not.

### E.1 Proposed first entries

These are research findings, not decisions. Anything marked **PROPOSED** needs confirmation against a real brief before it is written into the index as house doctrine.

| Need | Decision | Choice | Why |
|---|---|---|---|
| **Marquee** | registry-item | `@kibo-ui/marquee` | Verified, MIT, token-bound, behavior-first. Magic UI's `marquee` is the alternative and ships a proper `cssVars` block — either is defensible; Kibo wins on the rest of the library coming with it. |
| **Count-up stats** | ~~build~~ **[AMENDED] registry-item** | `@magicui/number-ticker` or `@fancy/basic-number-ticker` | **The original "nothing better exists" was wrong** — both exist and were found by grepping the wired indexes. `core/StatTile.tsx` is still the shell; the ticker is the numeral inside it. Decide which, do not rebuild it. |
| **Drag rail** | ~~library~~ **[AMENDED] registry-item or library** | `@fancy/drag-elements`, `@fancy/box-carousel`, `@fancy/simple-carousel`, `@kibo-ui/deck`, `@tailark-oss/motion-primitives-infinite-slider` — or still Embla | **The original "no component exists, use Embla" was wrong.** Five real options across three namespaces. Embla remains defensible for a production rail with a11y requirements; this is now a live choice, not a foregone one. |
| **Masonry wall** | primitive — **[AMENDED] gap now confirmed, not just proposed** | CSS `columns-*` for static, `react-masonry-css` only if ordered reflow is required | **Confirmed by index grep across all 789 wired items:** zero hits for `masonry`, `mosaic`, `pinterest`, or `waterfall`, and three fuzzy-search phrasings returned nothing relevant. Testimonial *content* is well covered (11 Tailark OSS blocks); the masonry *layout* does not exist in the free set. CSS multi-column costs nothing and restyles perfectly; it just cannot do ordered left-to-right flow. |
| **Accordion** | primitive | shadcn `accordion` | Core, free, perfectly tokenized. Retro UI's (9 tokens, 0 hardcoded) is the pick when a brief wants a neobrutalist look. **Do not use Sera UI's** — 70 hardcoded utilities. |
| **Tabs** | primitive | shadcn `tabs` | Same reasoning. |
| **Scroll reveal** | build → `@jhai/scroll-reveal` | in-house over Motion `whileInView` | A `ScrollReveal.tsx` already exists in the older site repo. This is 15 lines around a Motion primitive; a registry dependency for it is not worth the coupling. Motion Primitives' `in-view` is the alternative **if** its registry URL verifies (see A.2). |
| **Text reveal** | registry-item | `@magicui/text-animate` family, or `@fancy/*` for the unusual ones | Magic UI for standard staggered reveals. Fancy Components for anything on a path or physics-driven — it scored zero color of any kind, so it restyles free. |
| **Hero with video** | ~~build~~ **[AMENDED] registry-item** | `@tailark-oss/dusk-hero-section-5-video`, `@tailark-oss/dusk-landing-1-hero-video`, `@tailark-oss/dusk-landing-5-hero-video`, `@magicui/hero-video-dialog` | **The original "nothing handles it well" was wrong** — four options, three of them in the token-pure Tailark OSS set. The brand-specific part (poster, preload, `prefers-reduced-motion`) is still ours to add, but the shell is not worth rebuilding. |
| **Pricing table** | registry-item | `@tailark-oss/veil-pricing-1` (and siblings) | Verified, MIT, **8 semantic tokens and zero hardcoded color**. Best measured restylability of any pricing block found. |
| **FAQ** | registry-item | `@tailark-oss/veil-faqs-1` (and siblings) | Same — 5 tokens, 0 hardcoded. `page/FAQItem.tsx` is the in-house alternative already on disk. |
| **Form inputs** | primitive | shadcn `input`, `select`, `textarea`, `form` | Core. `@intentui/*` is the pick **only** where accessibility is a stated client requirement — it is built on `react-aria-components`, which is a second primitive stack and should be a deliberate choice, not a default. |

---

## F. Recommended starter set

Wire these five now. **Total annual cost: $0.** All MIT. None require an account, a key, or an env var.

1. **`@tailark-oss`** — `https://oss.tailark.com/r/{name}` — 259 marketing blocks, the best measured restylability in the set, and the closest match to the editorial/restrained direction. This is the workhorse for spec sites.
2. **`@kibo-ui`** — `https://www.kibo-ui.com/r/{name}.json` — the only genuinely behavior-first library here: kanban, Gantt, dropzone, data table, AI chat primitives. CSS-variables-only by design, which is exactly the theming contract we want.
3. **`@magicui`** — `https://magicui.design/r/{name}.json` — 150+ MIT motion and text components, and the one library that ships `cssVars` blocks correctly.
4. **`@blocks-so`** — `https://blocks.so/r/{name}.json` — app-shaped blocks (login, dialog, sidebar, stats, table, file upload) that the marketing-focused libraries do not cover.
5. **`@fancy`** — `https://www.fancycomponents.dev/r/{name}.json` — geometry and type experiments with zero paint, so it restyles free and gives an editorial site its one distinctive move.

Plus `@shadcn` core, already present, and the existing 21st.dev MCP connection for discovery.

**Hold in reserve, wire on demand:** `@8bitcn` and `@retroui` — both verified, free, and measurably retokenable (8bitcn's `login-form`: 55 semantic tokens, 0 hardcoded). They are not in the first five because the look is niche, not because they are rigid. When a client brief wants that register, they are a one-line addition.

### What the starter set does not cover

State this plainly rather than discovering it mid-build:

- **Masonry wall** — nothing free and good. CSS columns or `react-masonry-css`. **[AMENDED] The only surviving gap**, now confirmed by grepping all 789 wired items rather than inferred.
- ~~**Video hero** — build it.~~ **[AMENDED] covered** — four options, see E.1.
- ~~**Count-up numerals** — build it.~~ **[AMENDED] covered** — `@magicui/number-ticker`, `@fancy/basic-number-ticker`.
- ~~**Drag/swipe rails** — Embla directly, not a registry.~~ **[AMENDED] covered** — five options across `@fancy`, `@kibo-ui`, `@tailark-oss`. Embla is now a choice, not the only path.
- **Dashboard and data-dense SaaS UI** — the assessed free set is marketing-first. Kibo covers tables and boards; nothing covers a full admin shell. Not currently a JHAI need; revisit if it becomes one.
- **Anything requiring 21st.dev's generative flow** — that is the existing connection's job and stays there.

---

## G. Skip list

| Skipped | Why |
|---|---|
| **ReactBits** | MIT **+ Commons Clause**. May not be redistributed "alone, in a bundle, or as a ported version," which permanently bars it from `@jhai`. Usable in a client site; pointer-only entry at most. Also has a trap: nonexistent item names return `200` with an SPA shell. Not worth the care it demands. |
| **Aceternity UI (paid)** | $169/yr or $199 lifetime for one seat, and the free components already measure poorly on restylability (8 hardcoded utilities + 4 hex across two samples). Paying for more of the same problem. The free tier stays available for a one-off decorative need. |
| **Shadcnblocks Pro** | $149–$399 one-time, single user. License bars building any UI library or registry from it, so it can never become an asset. The free tier is real and already reachable. |
| **Align UI** | $299.99–$399.99 seat-tiered for the code library, **and no public shadcn registry could be found at all** — `/r/*` returns 404. Dashboard-oriented, which is not the current need. Highest cost, worst fit. |
| **Tailark (paid)** | $249–$499 one-time, **and the free tier still requires an account**. The OSS registry at `oss.tailark.com` is MIT, unkeyed, 259 items, and measured best-in-class. Buying the paid tier is paying for an account requirement. |
| **Shadcn Studio Pro / Shadcnspace Pro** | Both gate the good material behind a license key passed as URL params or headers. Per-project key distribution across spec sites is the exact operational cost identified in B.3. Free tiers are reachable if a specific block is wanted. |
| **Sera UI** | Free and MIT, so no license objection — **skipped on measurement**. 70 hardcoded palette utilities and 2 hex literals in a single accordion. Every client restyle is a rewrite. This is the concrete example of "opinionated is fine, rigid is not." |
| **SmoothUI** | Same reasoning, less severe: 32 hardcoded utilities in one component. Nice micro-interactions, expensive to rebrand. |
| **21st.dev paid tiers** | Free tier already covers browsing, install, and MCP code retrieval. Paid buys AI generation credits, which is not the sourcing problem. Treat the existing connection as the paid slot already spent. |
| **Relume** | **[AMENDED] Considered and dropped.** It is a purchased code library with **no redistribution grant**, so it can never enter `@jhai` — and its coverage overlaps the free five anyway. Two supporting facts found before the assessment was stopped: it publishes **no shadcn registry at all** (four endpoint probes returned `404`; absent from the 344-entry community index), so it cannot join Layer 1 on any terms, and its npm package `@relume_io/relume-ui` carries **no `license` field**, which is all-rights-reserved by default. Not assessed further. |
| **Cult UI, Motion Primitives** | **[AMENDED] Now skipped, not deferred.** Both MIT and genuinely good, and both URL shapes are confirmed correct by the official community index. But Task 0.1 ran the real shadcn CLI against each and both returned `Failed to fetch from registry (429)` — the same Vercel Security Checkpoint that blocked automated fetch. The index itself flags both `observing` rather than `healthy`. **Not eligible for the registries block.** Copy from their docs in a browser if a specific component is wanted. Worth re-testing from a different network before writing them off permanently. |

---

## Sources

All fetched 2026-09-12.

**shadcn documentation**
- [Namespaced registries](https://ui.shadcn.com/docs/registry/namespace)
- [registry.json schema](https://ui.shadcn.com/docs/registry/registry-json)
- [registry-item.json schema](https://ui.shadcn.com/docs/registry/registry-item-json)
- [GitHub registries](https://ui.shadcn.com/docs/registry/github)
- [MCP server](https://ui.shadcn.com/docs/mcp)
- [Changelog](https://ui.shadcn.com/docs/changelog) — CLI v4 (March 2026), registry include and validate (May 2026), GitHub registries (June 2026), dynamic search (July 2026), private GitHub registries (August 2026)

**Pricing and licensing**
- [Aceternity UI pricing](https://ui.aceternity.com/pricing)
- [Tailark pricing](https://tailark.com/pricing)
- [Shadcnblocks pricing](https://www.shadcnblocks.com/pricing) · [Shadcnblocks license](https://www.shadcnblocks.com/license) · [Shadcnblocks CLI docs](https://www.shadcnblocks.com/docs/shadcn-cli/overview)
- [21st.dev pricing](https://21st.dev/pricing)
- [Shadcn Studio CLI docs](https://shadcnstudio.com/docs/getting-started/how-to-use-shadcn-cli)
- [Shadcnspace CLI docs](https://shadcnspace.com/docs/getting-started/how-to-use-shadcn-cli) · [Shadcnspace pricing](https://shadcnspace.com/pricing)
- [Magic UI Pro](https://pro.magicui.design/)
- [AlignUI license](https://www.alignui.com/license) · [AlignUI store](https://alignui.lemonsqueezy.com/)

**Repositories (licenses read via the GitHub API, 2026-09-12)**
- [magicuidesign/magicui](https://github.com/magicuidesign/magicui) MIT · [shadcnblocks/kibo](https://github.com/shadcnblocks/kibo) MIT · [ibelick/motion-primitives](https://github.com/ibelick/motion-primitives) MIT · [nolly-studio/cult-ui](https://github.com/nolly-studio/cult-ui) MIT · [educlopez/smoothui](https://github.com/educlopez/smoothui) MIT · [ephraimduncan/blocks](https://github.com/ephraimduncan/blocks) MIT · [TheOrcDev/8bitcn-ui](https://github.com/TheOrcDev/8bitcn-ui) MIT · [kokonut-labs/kokonutui](https://github.com/kokonut-labs/kokonutui) MIT · [danielpetho/fancy](https://github.com/danielpetho/fancy) MIT · [irsyadadl/intentui](https://github.com/irsyadadl/intentui) MIT · [ui-layouts/uilayouts](https://github.com/ui-layouts/uilayouts) MIT · [seraui/seraui](https://github.com/seraui/seraui) MIT · [preetsuthar17/HextaUI](https://github.com/preetsuthar17/HextaUI) MIT · [tailark/blocks](https://github.com/tailark/blocks) MIT · [Dksie09/retroui](https://github.com/Dksie09/retroui) BSD-3-Clause · [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) MIT + Commons Clause
- [Motion Primitives issue #112](https://github.com/ibelick/motion-primitives/issues/112) — documents the `motion-primitives.com/c/{name}.json` install form

**Discovery**
- **[AMENDED] [`https://ui.shadcn.com/r/registries.json`](https://ui.shadcn.com/r/registries.json) — the official community registry index.** 344 registries with canonical namespaces, URL templates, and health scores. This is the primary discovery source and the original research missed it. Use it before assessing any new library.
- [shadcn skill spec — MCP](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/mcp.md) — the binding rules for the `registries` map (`@` prefix, `{name}` required) and the full MCP tool list
- [registry.directory](https://registry.directory/) · [shadcnregistry.com](https://shadcnregistry.com/) — third-party aggregators, unverified
- **[AMENDED] [svgl.app](https://svgl.app)** — MIT brand-logo library (`pheralb/svgl`), keyless public API at `https://api.svgl.app`. The free source behind 21st.dev's logo search.

**Local inspection (this machine, 2026-09-12)**
- `~/Code/jhai-new-website/src/components/v2/` — 79 `.tsx`, token analysis in C.1
- `~/Code/jhai-new-website/src/app/globals.css` — 22 shadcn→`--jh-*` mappings
- `~/Code/jhai-new-website/src/styles/v2-theme.css` — v2 token name contract
- `~/Code/jhai-new-website/components.json` — `"registries": {}`, style `base-nova`
- `~/Code/justinharris-ai-website/DESIGN-SYSTEM.md` — older brand spec (different palette; note the two repos are not aligned)
