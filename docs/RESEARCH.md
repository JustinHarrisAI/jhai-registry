# JHAI Component Sourcing — Research

**Status:** Research and planning only. Nothing has been installed, configured, or built.
**Date of research:** 2026-09-12. Every price and license claim below was fetched on that date.
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

The MCP server **reads its registry list from `components.json`**. It does not hold its own config. That is the single most important fact in this document: **wiring registries into `components.json` is what arms the MCP server**, so there is exactly one file to get right per project, and the bootstrap in section D is really just "put the right `components.json` in place."

The server exposes browse, search, install, and multi-registry access across namespaces.

**GitHub registries** ([docs](https://ui.shadcn.com/docs/registry/github)) — landed June 2026 (public) and August 2026 (private), per the [shadcn changelog](https://ui.shadcn.com/docs/changelog):

```bash
pnpm dlx shadcn@latest add <owner>/<repo>/<item>
pnpm dlx shadcn@latest add acme/toolkit/project-conventions#v1.0.0   # tag
pnpm dlx shadcn@latest add acme/toolkit/project-conventions#c0ffee2  # full SHA
```

- The first two path segments are owner and repo. Remaining segments are the **item name, not a file path**.
- Private repos: `gh auth login` locally, or `GH_TOKEN` / `GITHUB_TOKEN` in CI (`GH_TOKEN` wins). Use a fine-grained PAT scoped to the repo with **Contents: Read-only**.
- Public repos are always read anonymously; credentials are only attempted when the root `registry.json` is not publicly readable.
- Limits: 5 MiB per source file, no GitHub Enterprise hosts, avoid symlinks.

This is the fact that decides section C. **Version pinning and private hosting are both free and built in, via GitHub, with no server to run.**

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
| **Motion Primitives** | `https://motion-primitives.com/c/{name}.json` | **UNVERIFIED BY FETCH.** Every attempt (curl and server-side fetch, with and without a browser UA) returned `429` with `<title>Vercel Security Checkpoint</title>` — bot protection, not a missing endpoint. The shape is documented on their own docs pages (e.g. `npx shadcn add "https://motion-primitives.com/c/in-view.json"`) and appears in their [issue #112](https://github.com/ibelick/motion-primitives/issues/112). **The shadcn CLI will very likely pass where automation did not — confirm by running one install before trusting it.** | **Free**, MIT (`ibelick/motion-primitives`) | No | Component-level, motion primitives | Not measured (blocked) |
| **UI-Layouts** | see A.1 | | | | | |
| **Fancy Components** | `https://www.fancycomponents.dev/r/{name}.json` | **VERIFIED** — `marquee-along-svg-path` | **Free**, MIT (`danielpetho/fancy`) | No | Component-level, physics and text experiments | **Excellent for its class.** Zero color of any kind — it manipulates geometry and type, not paint |
| **Align UI** | **None found.** `alignui.com/r/*` and `www.alignui.com/r/*` return `404` HTML; no docs route found at `/docs/getting-started/installation` (`404`) | **UNVERIFIED — likely no public shadcn registry.** Distributed as a purchased code library, not a CLI registry | Base components **MIT and free**; AlignUI Code Library **$299.99–$399.99** seat-tiered, Figma file **$119.99–$349.99**, bundle **$339.99–$599.99** (Lemon Squeezy listings) | Yes, purchase | Design-system-first, dashboard/SaaS | Not assessable without access |
| **ReactBits** | `https://reactbits.dev/r/{Name}-{TS\|JS}-{CSS\|TW}.json` — e.g. `SplitText-TS-CSS` | **VERIFIED** — `SplitText-TS-CSS`. Note the unusual naming: PascalCase component, language suffix, styling suffix. `Marquee-TS-CSS` does **not** exist (returns the SPA shell at `200`, which is a trap — always parse the body, never trust the status code here) | Free to use | No | Component-level, animation showcase | Clean source, but see section B — **the license, not the styling, is the problem** |
| **Kibo UI** | see A.1 | | | | | |
| **Cult UI** | `https://www.cult-ui.com/r/{name}.json` — **UNVERIFIED**. Same Vercel Security Checkpoint `429` as Motion Primitives. What *is* confirmed: the repo is `nolly-studio/cult-ui`, **MIT**, and `apps/www/registry.json` exists with items named `text-animate` and similar, homepage `https://cult-ui.com` | **UNVERIFIED shape** | **Free**, MIT | No | Component-level, texture/depth-heavy | Not measured (blocked) |
| **Sera UI** | `https://seraui.com/registry/{name}.json` — note `/registry/`, **not** `/r/` | **VERIFIED** — `marquee`, `accordion` | **Free**, MIT (`seraui/seraui`) | No | Component-level | **Worst in the set.** 70 hardcoded palette utilities plus 2 hex in a single accordion. Every client restyle is a rewrite |
| **8bitcn UI** | `https://www.8bitcn.com/r/{name}.json` | **VERIFIED** — `button`, `dialog` | **Free**, MIT | No | Full retro theme over shadcn primitives; 121 registry items | **Excellent.** See A.0 |
| **Retro UI** | `https://retroui.dev/r/{name}.json` | **VERIFIED** — `accordion`. (`button.json` returned `301`; item names vary — read their docs rather than guessing) | **Free**, **BSD-3-Clause** (`Dksie09/retroui`) — not MIT; the 3-clause notice must be preserved on redistribution | No | Neobrutalist theme | **Good.** 9 semantic tokens, zero hardcoded color, 1 `var()` |
| **Kokonut UI** | `https://kokonutui.com/r/{name}.json` | **VERIFIED** — `utils`, `particle-button`. Namespace `@kokonutui` | **Free**, MIT (`kokonut-labs/kokonutui`) | No | Component-level, decorative | **Good.** 2 hardcoded utilities only |
| **Hexta UI** | `https://hextaui.com/r/{name}.json` | **VERIFIED** — `button`, `accordion` | **Free**, MIT (`preetsuthar17/HextaUI`) | No | Component-level | **Good.** Token-bound, no hardcoded color |

### A.3 Bonus — 21st.dev

- **Registry URL:** `https://21st.dev/r/{author}/{component}.json` — **GATED**. `21st.dev/r/serafim/marquee.json` returned `403 {"error":"Authentication required","reason":"authentication_required"}`. Note the two-segment `{author}/{name}` shape, which differs from every other library here.
- **Cost** ([pricing](https://21st.dev/pricing)): Free tier includes unlimited marketplace browsing, component installation, template downloads, SVG logo search, and **component code retrieval via MCP**, with no AI credits. Builder **$6/mo billed yearly**. Builder + AI **$15/mo billed yearly** (500–2,000 monthly AI credits, +100 for $5). Team **$7.50/seat/mo billed yearly**, 2–50 seats.
- **Assessment:** the existing connection already covers the discovery job. The paid tiers buy AI generation, not access. Treat the current connection as the paid slot already spent and do not extend it.

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
  "homepage": "https://registry.justinharris.ai",
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
| **GitHub registry** (this repo) | **$0** on any GitHub plan | **Built in** — `#tag` or `#sha` per item address | **Yes** — `gh auth login` locally, `GH_TOKEN` (fine-grained PAT, Contents: Read-only) in CI | **Recommended primary** |
| Vercel static JSON | $0 on Hobby. **But** Hobby forbids commercial use, and client work is commercial — a Pro seat is ~$20/mo | Manual: version in the path or a `params` version | Only via a custom auth route, which means owning an endpoint | Optional mirror, not the primary |
| Private registry with auth headers | Hosting cost plus an endpoint to maintain | Manual | Yes | **Not warranted.** GitHub private repos deliver this for free |

**Recommendation: GitHub registry as the only thing built in Phase 3. Annual cost $0.**

Why this wins and it is not close:

- No deploy step. A merge to `main` publishes. No build, no cache invalidation, no domain.
- Version pinning is the feature, not a workaround. `jhai/registry/stat-tile#v1.2.0` is reproducible by construction.
- The public/private decision becomes per-repo rather than per-architecture, and can be changed later without touching a single consuming project's `components.json` — the address stays `owner/repo/item`.
- It removes the Vercel Hobby licensing question entirely. Hobby is non-commercial; client sites are commercial; a registry serving client work on Hobby is the kind of quiet violation that only surfaces at a bad moment.

**Caveat to check before committing:** the shadcn MCP server's discovery is documented around `components.json` `registries` entries, which take a **URL template**. GitHub item addresses (`owner/repo/item`) are a CLI address form. Whether an MCP-driven search enumerates a GitHub-hosted registry as cleanly as a URL-template one was **not verified** and is a Phase 2 spike, not an assumption. If it does not, the answer is a Vercel or GitHub Pages static mirror serving `https://registry.justinharris.ai/r/{name}.json` purely for discovery, with GitHub remaining the versioned source of truth. GitHub Pages is free and carries no commercial-use restriction, which makes it the better mirror than Vercel Hobby.

### C.4 Versioning

Git tags on this repo, consumed as `#ref`:

- Unpinned (`jhai/registry/stat-tile`) resolves to the default branch — correct for internal work and throwaway spec sites, which should ride latest.
- Pinned (`jhai/registry/stat-tile#v1.4.0`) for delivered client builds.
- Full SHA where exactness matters more than readability.

A fix reaching past client projects is therefore deliberate, not automatic: re-run `npx shadcn add jhai/registry/stat-tile#v1.4.1` in that project. CLI v4 (March 2026) added `--diff` to check a project against registry updates and surface drift, which is what turns "which of my client sites have the old card" from an audit into a command.

Because components are copied into the consuming project, **there is no such thing as a silent fix**. That is a feature at WebVegas volume — a bad `@jhai` release cannot break 30 live sites at once — but it means the update ritual has to be written down, not remembered.

### C.5 Auth for private entries

Only if some items stay private: keep this repo private, and

- Local: `gh auth login` once. The CLI prints `✔ Using gh credentials.`
- CI / spec-site automation: `GH_TOKEN=github_pat_xxx`, fine-grained PAT scoped to `jhai-registry`, **Contents: Read-only**. `GH_TOKEN` takes precedence over `GITHUB_TOKEN`.

Cost: $0. No secret ever enters a client repo, because the token is JHAI's and lives in JHAI's automation.

**Open judgement call, not answered here:** a public `@jhai` is free marketing and simpler auth; a private one keeps client-derived patterns out of public view. This is in section H.

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

Three moves, in order:

1. **`@jhai/theme-base`** — a `registry:base` item carrying the `--jh-*` → shadcn mapping that currently lives inline in `globals.css`, so every new project inherits it in one install instead of by copy-paste.
2. **The alias layer** — `@theme inline { --color-ink-800: var(--ink-800); … }` in `globals.css`, pointing *at* the v2 names, per the contract quoted in C.1. **No v2 token is renamed.** This is what lets a `@jhai` component built from v2 source restyle through the same block as a Kibo or Tailark component.
3. **`@jhai/theme-{client}`** — a `registry:theme` item per client, carrying only that client's `--jh-*` values. Restyling a spec site becomes `npx shadcn add jhai/registry/theme-acme`, one command, no forks.

**This is the test of whether the registry is worth building.** If a `@jhai` section cannot land in a client project and take that client's palette without editing the component, the registry is just a slower `git clone` and should not be built. The disk evidence says it can: 56 of 79 v2 files already carry zero hardcoded color, and the semantic mapping already exists. **The work is finishing 23 files and writing one alias block, not architecting a system.**

### C.7 Seed set — what goes in first

Selection rule: generic in shape, zero hardcoded color, and used more than once already. From the 79:

**Tier 1 — seed these first (primitives; high reuse, low risk):**
`core/Eyebrow.tsx`, `core/SectionHeader.tsx`, `core/Button.tsx`, `core/CheckList.tsx`, `core/StatTile.tsx`, `core/ImageSlot.tsx` (4 hex to clear first), `sections/icons.tsx`.

**Tier 2 — sections with clean color and obvious cross-client value:**
`sections/Ticker.tsx` (marquee), `sections/LogoWall.tsx`, `sections/Questions.tsx` (FAQ), `sections/Compare.tsx`, `sections/Problem.tsx`, `sections/Answer.tsx`, `sections/CtaBandSection.tsx`, `sections/RecordBand.tsx`, `page/CTABand.tsx`, `page/FAQItem.tsx`, `page/ProofDeck.tsx`, `cards/CaseCard.tsx`, `cards/BlogCard.tsx`, `cards/ToolCard.tsx`.

**Tier 3 — needs color work before it can ship:**
`chrome/Header.tsx` (3 named + 6 hex), `cards/PricingCard.tsx`, `sections/Aesir.tsx`, `sections/IndexRail.tsx`, `sections/Close.tsx`, `chrome/Megamenu.tsx`, `page/DemoFrame.tsx`.

**Stay project code, do not registry-ize:**
`templates/*` (14 files — they encode JHAI's own information architecture and page composition, not reusable UI), `interior/*` mostly (article and case-study furniture tied to JHAI content shapes), `motion/MotionRuntime.tsx` (an app-level runtime, not a component), `chrome/Footer.tsx` and `SiteChromeHeader.tsx` (brand-specific by nature).

That is roughly **21 items to seed**, not 79. The right first registry is small and correct.

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
npx shadcn@latest init                          # if not already initialized
# skill merges the registries block into components.json
pnpm dlx shadcn@latest mcp init --client claude  # arms the MCP server
```

The `components.json` fragment the skill merges (the canonical copy lives in this repo, so there is exactly one place to update a URL):

```json
{
  "registries": {
    "@jhai":        "jhai/registry",
    "@tailark-oss": "https://oss.tailark.com/r/{name}",
    "@kibo-ui":     "https://www.kibo-ui.com/r/{name}.json",
    "@magicui":     "https://magicui.design/r/{name}.json",
    "@blocks-so":   "https://blocks.so/r/{name}.json",
    "@fancy":       "https://www.fancycomponents.dev/r/{name}.json"
  }
}
```

*(The `@jhai` entry's exact form depends on the C.3 GitHub-vs-mirror spike — a GitHub registry is addressed `owner/repo/item` at the CLI, and whether that belongs in the `registries` map as written above is one of the two things Phase 2 must confirm.)*

Env vars: **none required** for the recommended set. That is the point. The only env var in the whole design is `GH_TOKEN` in CI, and only if `@jhai` is private.

Time cost per new project: one skill invocation plus one MCP init. That is fast enough for a spec site.

---

## E. The curation index

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
| **Count-up stats** | build → `@jhai/stat-tile` | in-house | `core/StatTile.tsx` already exists with zero hardcoded color. No third-party count-up in the assessed set is better than what is on disk. Animate with Motion's spring, not a dedicated count-up dependency. |
| **Drag rail** | library | `embla-carousel-react` | See above. Record the library, not a component. |
| **Masonry wall** | **PROPOSED** primitive | CSS `columns-*` for static, `react-masonry-css` only if ordered reflow is required | **No free registry item in this assessment covers a true masonry testimonial wall.** This is the largest genuine gap in the recommended set. CSS multi-column costs nothing and restyles perfectly; it just cannot do ordered left-to-right flow. |
| **Accordion** | primitive | shadcn `accordion` | Core, free, perfectly tokenized. Retro UI's (9 tokens, 0 hardcoded) is the pick when a brief wants a neobrutalist look. **Do not use Sera UI's** — 70 hardcoded utilities. |
| **Tabs** | primitive | shadcn `tabs` | Same reasoning. |
| **Scroll reveal** | build → `@jhai/scroll-reveal` | in-house over Motion `whileInView` | A `ScrollReveal.tsx` already exists in the older site repo. This is 15 lines around a Motion primitive; a registry dependency for it is not worth the coupling. Motion Primitives' `in-view` is the alternative **if** its registry URL verifies (see A.2). |
| **Text reveal** | registry-item | `@magicui/text-animate` family, or `@fancy/*` for the unusual ones | Magic UI for standard staggered reveals. Fancy Components for anything on a path or physics-driven — it scored zero color of any kind, so it restyles free. |
| **Hero with video** | build | in-house | Nothing assessed handles a video hero well enough to be worth the dependency, and poster/preload/`prefers-reduced-motion` behavior is brand-specific. Compose from `@jhai/section-header` plus a plain `<video>`. |
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

- **Masonry wall** — nothing free and good. CSS columns or `react-masonry-css`. The real gap.
- **Video hero** — build it.
- **Count-up numerals** — build it; `StatTile` is already there.
- **Drag/swipe rails** — Embla directly, not a registry.
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
| **Cult UI, Motion Primitives** | **Not skipped — deferred.** Both MIT and genuinely good. Both sit behind a Vercel Security Checkpoint that blocked every automated fetch, so their registry URLs are UNVERIFIED. Confirm with one manual `npx shadcn add` each before wiring. |

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

**Discovery aggregators (unverified, useful for finding more registries later)**
- [registry.directory](https://registry.directory/) · [shadcnregistry.com](https://shadcnregistry.com/)

**Local inspection (this machine, 2026-09-12)**
- `~/Code/jhai-new-website/src/components/v2/` — 79 `.tsx`, token analysis in C.1
- `~/Code/jhai-new-website/src/app/globals.css` — 22 shadcn→`--jh-*` mappings
- `~/Code/jhai-new-website/src/styles/v2-theme.css` — v2 token name contract
- `~/Code/jhai-new-website/components.json` — `"registries": {}`, style `base-nova`
- `~/Code/justinharris-ai-website/DESIGN-SYSTEM.md` — older brand spec (different palette; note the two repos are not aligned)
