# JHAI Curation Index

> **GENERATED FILE — do not edit.** Source of truth is [CURATION.json](CURATION.json). Regenerate with `node scripts/build-curation-md.mjs`.

Last full pass **2026-09-14** · 4585 items indexed across `@shadcn`, `@jhai`, `@tailark-oss`, `@kibo-ui`, `@magicui`, `@blocks-so`, `@fancy`, `@hirael`, `@bundui`, `@flx`, `@ilinxa`, `@8bitcn`, `@cnippet`, `@ns-ui`, `@pulld`, `@vllnt-ui`, `@shadcnui-blocks`, `@nusaiba` · shadcn@4.21.0 via pnpm dlx

## Read this before you search

**The shadcn fuzzy search is weak. Grep the registry indexes instead when the question is "does X exist."** Measured in the Task 1.5 pass: the query `count up stats` returned a striped background pattern, `tabs` returned an SVG logo, and `drag rail carousel` returned a globe. Single words beat phrases, but a direct grep of each namespace's `registry.json` beat both and is what found the three options the search had missed.

```bash
# every wired index, one grep — the reliable way to answer "does X exist"
for u in \
  https://oss.tailark.com/r/registry \
  https://www.kibo-ui.com/r/registry.json \
  https://magicui.design/r/registry.json \
  https://blocks.so/r/registry.json \
  https://www.fancycomponents.dev/r/registry.json; do
  curl -sL "$u" | grep -io "\"name\":\"[^\"]*masonry[^\"]*\"";
done
```

A ⚠︎ on a preview link means the host returns HTTP 200 for any path, so the link was not provable by status code. Open it before quoting it to a client.

## The index

| Need | Decision | Choice | Install | Preview |
|---|---|---|---|---|
| **marquee** | registry item | @kibo-ui/marquee | `pnpm dlx shadcn@4.21.0 add @kibo-ui/marquee` | [preview](https://www.kibo-ui.com/components/marquee) |
| **count-up stats** | registry item | @magicui/number-ticker | `pnpm dlx shadcn@4.21.0 add @magicui/number-ticker` | [preview](https://magicui.design/docs/components/number-ticker) |
| **drag rail** | registry item | @fancy/box-carousel | `pnpm dlx shadcn@4.21.0 add @fancy/box-carousel` | [preview](https://www.fancycomponents.dev/docs/components/carousel/box-carousel) |
| **masonry wall** | registry item | @hirael/masonry | `pnpm dlx shadcn@4.21.0 add @hirael/masonry` | [preview](https://hirael.com) |
| **accordion** | primitive | shadcn core accordion | `pnpm dlx shadcn@4.21.0 add @shadcn/accordion` | [preview](https://ui.shadcn.com/docs/components/accordion) |
| **tabs** | primitive | shadcn core tabs | `pnpm dlx shadcn@4.21.0 add @shadcn/tabs` | [preview](https://ui.shadcn.com/docs/components/tabs) |
| **scroll reveal** | build in-house | @jhai/scroll-reveal — thin wrapper over Motion whileInView | pending Phase 3; today, hand-write it over the existing motion dependency | [preview](https://magicui.design/docs/components/text-reveal) |
| **text reveal** | registry item | @magicui/text-reveal | `pnpm dlx shadcn@4.21.0 add @magicui/text-reveal` | [preview](https://magicui.design/docs/components/text-reveal) |
| **hero with video** | registry item | @tailark-oss/dusk-hero-section-5-video | `pnpm dlx shadcn@4.21.0 add @tailark-oss/dusk-hero-section-5-video` | — |
| **pricing table** | registry item | @bundui/pricing-sections-01 | `pnpm dlx shadcn@4.21.0 add @bundui/pricing-sections-01` | [preview](https://bundui.io) |
| **FAQ** | registry item | @tailark-oss/veil-faqs-1 | `pnpm dlx shadcn@4.21.0 add @tailark-oss/veil-faqs-1` | — |
| **form inputs** | primitive | shadcn core input, select, textarea, form, label | `pnpm dlx shadcn@4.21.0 add @shadcn/input @shadcn/select @shadcn/textarea @shadcn/form @shadcn/label` | [preview](https://ui.shadcn.com/docs/components/input) |
| **logo wall** | library | svgl.app — fetch SVGs directly from the keyless public API | none — GET https://api.svgl.app?search=<brand>, then fetch the returned route (and wordmark / dark variant if present) | [preview](https://svgl.app) |
| **site header** | registry item | @jhai/site-header | `pnpm dlx shadcn@4.21.0 add @jhai/site-header` | — |
| **testimonials** | registry item | @jhai/testimonials | `pnpm dlx shadcn@4.21.0 add @jhai/testimonials` | — |
| **site footer** | registry item | @jhai/site-footer | `pnpm dlx shadcn@4.21.0 add @jhai/site-footer` | — |
| **hero** | registry item | @jhai/hero | `pnpm dlx shadcn@4.21.0 add @jhai/hero` | — |
| **pricing section** | registry item | @jhai/pricing | `pnpm dlx shadcn@4.21.0 add @jhai/pricing` | — |

## Why, and what was rejected

The reason is the load-bearing part. A name alone gets re-argued on the next project; a name plus the rejected option and its reason does not. **Any session that disagrees with a call here must update [CURATION.json](CURATION.json) rather than silently choosing differently.**

### marquee

**registry item — @kibo-ui/marquee** · MIT (shadcnblocks/kibo) · verified 2026-09-12

Behaviour-first and token-bound, and it installs clean: one file, one npm dep, no stylesheet edits. Kibo is also the library we want the rest of (kanban, gantt, dropzone, table), so standardising on it here avoids a second marquee vocabulary later. Verified by real install in Task 1.4: 1 semantic token, 0 hardcoded colour.

*Restyling:* Token-bound. Paints from semantic tokens, resolves through --jh-*. No per-client edit.

Rejected:

- **@magicui/marquee** — Genuinely good and it ships a correct cssVars block, but the Task 1.4 install rewrote src/app/globals.css: it prepended '@custom-variant dark (&:is(.dark *));' ABOVE the file header and appended keyframes into the theme block. In a 4,450-line hand-authored stylesheet that already has its own .dark handling, that is a collision risk we would take on every project for no gain over Kibo.
- **@fancy/simple-marquee** — Paints nothing, so it restyles perfectly, but it is a lower-level primitive. Reach for it only when the brief needs drag or easing behaviour Kibo does not expose.

### count-up stats

**registry item — @magicui/number-ticker** · MIT (magicuidesign/magicui) · verified 2026-09-12

CORRECTS the original E.1 answer, which said to build this because nothing better existed. Wrong: the fuzzy search missed it and a grep of the indexes found it immediately. Chosen over Fancy's because it demos decimal handling, which the JHAI stat tiles need. Compose it INSIDE @jhai/stat-tile rather than replacing it — the tile is the shell, the ticker is the numeral. VERIFIED 2026-09-12: unlike @magicui/marquee, number-ticker does NOT touch globals.css. It installs one file and nothing else. The marquee hazard is specific to items carrying a css block of keyframes; this is not one.

*Restyling:* Paints nothing — it animates a number. Inherits whatever the parent sets.

Rejected:

- **@fancy/basic-number-ticker** — Equally clean and equally free. Loses only on decimal support being less obviously covered. The globals.css concern that used to sit here is resolved: Magic UI's version was checked and leaves the stylesheet alone.
- **Hand-rolled Motion useSpring counter** — This was the original plan. About 20 lines, so not expensive, but it is 20 lines to own, test and get the reduced-motion behaviour right on, against zero for an item that already exists.

### drag rail

**registry item — @fancy/box-carousel** · MIT (danielpetho/fancy) · verified 2026-09-12

CORRECTS the original E.1 answer, which said no component existed and to use Embla directly. Five real options came back. Box carousel wins for a marketing rail because it has autoplay and video variants already demoed, and Fancy paints nothing at all, so it restyles free. Escalate to Embla the moment the rail carries interactive content and needs real keyboard and screen-reader support.

*Restyling:* Zero colour of any kind. Geometry only.

Rejected:

- **embla-carousel-react** — Still the right answer for a production rail with accessibility requirements — it is what most shadcn carousels wrap anyway. Rejected as the DEFAULT only because it is a dependency plus wiring, where the registry item is one command. This is an escalation path, not a dead option.
- **@fancy/drag-elements** — Free-floating draggable objects with momentum, not a rail. Different need — reach for it for a playful scatter layout.
- **@fancy/simple-carousel** — Simpler and lighter, but no momentum or autoplay. Use when the rail is three items and the motion should be plain.
- **@kibo-ui/deck** — Stacked swipeable cards, Tinder-shaped. Not a horizontal rail.
- **@tailark-oss/motion-primitives-infinite-slider** — Auto-scrolls rather than responding to drag. That is the marquee need, already answered above.

### masonry wall

**registry item — @hirael/masonry** · MIT (ASSET) · verified 2026-09-14

GAP CLOSED 2026-09-14. The old answer was CSS columns-*, because zero of 789 wired items matched masonry across four grep terms. Widening to the full 344-entry community index found 23 registries carrying a masonry item. @hirael/masonry wins on being real and self-contained: responsive column counts, round-robin assignment, one file, no external dependency, cn from local utils, and it installed clean with zero palette utilities. It does ordered left-to-right reflow, which CSS multi-column cannot do — the exact reason the primitive was a compromise.

*Restyling:* No colour. Layout utilities only.

Rejected:

- **CSS columns-* utilities** — Still correct for a purely decorative wall where order does not matter, and it costs nothing. Loses because it cannot do ordered left-to-right reflow, which is what a testimonial wall usually wants.
- **@diceui/masonry** — The best-looking option on paper — a proper headless primitive from sadmann7, MIT, 2k stars. UNWIRED because it does not install: its registry item declares an npm dependency '@diceui/masonry' that returns 404 on npm. The scope is real (@diceui/mention publishes fine), that package is not. Retest later.
- **@react-bits/Masonry-TS-TW** — Real and free, but ReactBits carries MIT + Commons Clause, which bars redistributing components. Usable in client work, never copyable into @jhai. Pointer-only, so it loses to an MIT equivalent.
- **react-masonry-css** — A dependency where a component will do, now that a component exists.

### accordion

**primitive — shadcn core accordion** · MIT (shadcn/ui) · verified 2026-09-12

Core, free, perfectly tokenised, and already the base every alternative wraps. The registry options add styling we would immediately have to strip to hit a client palette.

*Restyling:* Fully token-bound out of the box.

Rejected:

- **@tailark-oss/dusk-accordion and @tailark-oss/mist-accordion** — Both are Tailark's own styling over the same underlying primitive. Token-clean, so no objection on restylability — they just add a layer that buys nothing when we are going to restyle anyway.
- **@retroui/accordion** — Measured well (9 semantic tokens, 0 hardcoded) and is the correct pick when a brief actually wants neobrutalist. Wrong as a default.
- **@seraui/accordion** — Hard no on measurement, not licence. 70 hardcoded palette utilities and 2 hex literals in one component. Every client restyle would be a rewrite.

### tabs

**primitive — shadcn core tabs** · MIT (shadcn/ui) · verified 2026-09-12

GREPPED 789 ITEMS, ABSENT. The first pass recorded this as a search failure because the fuzzy query 'tabs' returned an SVG logo and three table blocks. A direct grep of all five wired indexes on terms tab, segmented, toggle-group and switcher returned 13 hits and NOT ONE is a tabs component — they are tables, theme switchers, and a segmented progress bar. No tabs component exists in the wired set. Core tabs is the answer on merit anyway: tokenised, accessible, and the base anything else would wrap.

*Restyling:* Fully token-bound out of the box.

Rejected:

- **@tailark-oss/mist-toggle-group** — The nearest neighbour in the whole wired set, and it is not close. A toggle group is single-select chrome for filtering; tabs swap panels and carry the roving-tabindex and aria-controls semantics that go with that. Reach for it for a filter row, never for tabs.
- **nothing else — 789 items grepped on tab, segmented, toggle-group, switcher** — Genuine absence, now measured rather than assumed. If a richer tabs component is wanted later, it will have to come from a registry not currently wired.

### scroll reveal

**build in-house — @jhai/scroll-reveal — thin wrapper over Motion whileInView** · in-house / MIT (motion) · verified 2026-09-12

The returns for this need were all TEXT reveals, not the generic 'fade any block in as it enters the viewport' that JHAI actually uses everywhere. Motion's whileInView plus a once flag and a reduced-motion guard is about 15 lines, and jhai-new-website already depends on motion. Owning it means the reduced-motion behaviour is consistent across every client site instead of varying per component.

*Restyling:* Paints nothing. Motion only.

Rejected:

- **@magicui/text-reveal** — Text-specific — it fades words in on scroll. That is the separate 'text reveal' need below, not a generic block reveal.
- **@fancy/vertical-cut-reveal-scroll-demo** — A demo item, not a component. Fancy publishes demos into its registry alongside real items; installing one gives you example code, not a reusable wrapper.
- **@magicui/progressive-blur** — A blur gradient on scrollable content. Different effect entirely.
- **@motion-primitives/in-view** — Would have been the closest match, and is MIT. Ineligible: the registry endpoint fails with 429 from a Vercel Security Checkpoint via the real CLI. See the skip list in RESEARCH.md section G.

### text reveal

**registry item — @magicui/text-reveal** · MIT (magicuidesign/magicui) · verified 2026-09-12

Fades text in on scroll — the restrained version, which matches the justinharris.ai direction of one white ground and a single accent. Densest returns of any need in the pass, so this is a real choice rather than a default.

*Restyling:* Inherits type colour from the parent. No hardcoded colour.

Rejected:

- **@magicui/dia-text-reveal** — A gradient colour band sweeping across the headline. Well built, four demo variants, but it needs a gradient to read, and the JHAI direction is explicitly no gradients. Keep it available for client brands that want more surface.
- **@magicui/hyper-text** — Scrambles letters before settling. Reads as a gimmick on an editorial page; fine for a dev-tool or AI client brand.
- **@fancy/vertical-cut-reveal** — Sharper, more art-directed cut reveal. Genuinely good and paints nothing. Rejected only because Magic UI's is the calmer default; reach for this when a brief wants the type to perform.

### hero with video

**registry item — @tailark-oss/dusk-hero-section-5-video** · MIT (tailark/blocks) · verified 2026-09-12

CORRECTS the original E.1 answer, which said to build this because nothing handled it well. Four options came back. This one is a hero SECTION with video, which is the actual need, and Tailark OSS measured best-in-class on restylability across three sampled blocks (zero hardcoded colour). The brand-specific work — poster frame, preload policy, prefers-reduced-motion fallback — is still ours to add on top, but the shell is not worth rebuilding.

*Preview caveat: oss.tailark.com has no per-item preview pages — its own homepage links 404 — and tailark.com returns HTTP 200 for every path including bogus ones, so any link there proves nothing. Preview a Tailark block by installing it, or browse https://oss.tailark.com/r/registry.json for item names.*

*Restyling:* Token-bound. Tailark OSS measured 0 hardcoded colour across sampled blocks.

Rejected:

- **@magicui/hero-video-dialog** — A click-to-play modal player, not a video hero. Different need — it is the right answer when the video is a demo behind a thumbnail.
- **@tailark-oss/dusk-landing-1-hero-video and dusk-landing-5-hero-video** — Whole landing pages rather than a hero section. Too much surface to inherit when we only want the hero.

### pricing table

**registry item — @bundui/pricing-sections-01** · MIT (ASSET) · verified 2026-09-14

GAP CLOSED 2026-09-14. The dogfood exposed this: every Tailark pricing block indexed was single-tier, so the three-tier table at the centre of a pricing brief had to be hand-written. 26 registries in the community index carry an explicitly multi-tier pricing item. bundui installed clean — 4 files, zero palette utilities, zero hex — and ships three pricing-sections variants so there is a fallback shape without leaving the namespace.

*Preview caveat: oss.tailark.com has no per-item preview pages — its own homepage links 404 — and tailark.com returns HTTP 200 for every path including bogus ones, so any link there proves nothing. Preview a Tailark block by installing it, or browse https://oss.tailark.com/r/registry.json for item names.*

*Restyling:* 8 semantic tokens, 0 hardcoded. Verified by install.

Rejected:

- **@tailark-oss/veil-pricing-1 (the old pick)** — Kept for single-tier and enterprise shapes, where it is still good. Demoted because it is single-tier: the dogfood installed it against a three-tier brief and the block had to be discarded.
- **@hirael/pricing-01..04** — Four variants, MIT, clean measurements. A close second and the right escalation if bundui's shapes do not fit. Loses only on bundui's sections being more obviously marketing-page furniture.
- **@nusaiba/pricing-1..8** — Eight variants, the widest single set found. Loses on measurement: 65 semantic against 16 palette utilities, so it needs per-client edits the others do not.
- **@ilinxa/pricing-table** — The most capable — comparison rows, tier features, tooltips, 12 files. Overkill for a marketing page and it pulls a tooltip dependency. Reach for it when the brief is a real feature-comparison matrix.

### FAQ

**registry item — @tailark-oss/veil-faqs-1** · MIT (tailark/blocks) · verified 2026-09-12

Measured 5 semantic tokens, 0 hardcoded colour. Nine Tailark OSS FAQ blocks came back — the densest coverage of any need after pricing — and veil-faqs-1 is the plainest. Composes over the shadcn core accordion chosen above rather than bringing its own disclosure primitive.

*Preview caveat: oss.tailark.com has no per-item preview pages — its own homepage links 404 — and tailark.com returns HTTP 200 for every path including bogus ones, so any link there proves nothing. Preview a Tailark block by installing it, or browse https://oss.tailark.com/r/registry.json for item names.*

*Restyling:* 5 semantic tokens, 0 hardcoded.

Rejected:

- **@tailark-oss/veil-faqs-2 through 5** — Same family with more layout — two-column, categorised, with a contact CTA. Live options when the FAQ carries more than six questions.
- **@tailark-oss/dusk-faqs-1 and mist-faqs-1/2/3** — Heavier families. Same reasoning as pricing.
- **in-house page/FAQItem.tsx** — Already on disk with zero hardcoded colour, so it is a Tier 2 seed candidate. Use it when the FAQ needs JHAI-specific behaviour; use the Tailark block for a standard section on a spec site.

### form inputs

**primitive — shadcn core input, select, textarea, form, label** · MIT (shadcn/ui) · verified 2026-09-12

GREPPED 789 ITEMS — and unlike tabs, this one CORRECTS the first pass. The fuzzy query 'form input' returned dialog-stack, gantt and a ripple button, so the first pass recorded a search failure. The grep (terms: input, textarea, select, checkbox, radio, combobox, form, otp, slider, switch, date-picker, dropzone) returned 37 hits and several are real. Core primitives remain the BASE — tokenised, accessible, and what every installed block already depends on — but Kibo covers the inputs shadcn core does not ship, so this is now a two-part answer rather than a fallback.

*Restyling:* Fully token-bound out of the box.

Rejected:

- **@intentui/* form components** — Built on react-aria-components, so accessibility is the product rather than an afterthought. Rejected as a default only because it introduces a SECOND primitive stack alongside Radix/Base. That should be a deliberate choice on a client with a stated accessibility requirement, never a silent default.
- **@blocks-so/form-layout-01 through 05, login-05, login-09** — Whole assembled forms rather than inputs — workspace fields, side labels, checkbox settings, plan selection. Genuinely useful as a starting layout, and verified installing clean in Task 1.4 (5 semantic tokens, 0 hardcoded colour). They compose the core primitives rather than replacing them, so they answer 'build me a signup form', not 'what is our input'. Note they prompt to overwrite button, input, label and separator on install; decline.

### logo wall

**library — svgl.app — fetch SVGs directly from the keyless public API** · MIT (pheralb/svgl). Individual brand marks remain the property of their owners — usage is governed by each brand's own trademark policy, not by svgl's licence. · verified 2026-09-12

Thirteenth entry, added because the Task 0.4 pass found the source behind 21st.dev's logo search. svgl.app is MIT (pheralb/svgl) with a public API that needs no key and no account. Verified: https://svgl.app/library/vercel.svg returns raw SVG, and https://api.svgl.app?search=stripe returns JSON carrying both route and wordmark variants. Client logo walls therefore need no paid library and no 21st.dev subscription. Many brands also ship a dark-mode variant, which is what makes this better than scraping favicons.

*Restyling:* SVGs carry brand colour by definition. Use currentColor variants or the mono/wordmark route where a monochrome wall is wanted.

Rejected:

- **21st.dev search_logo via MCP** — Free and unlimited, and convenient inside Claude Code — but it is a wrapper over exactly this source. Fine to use interactively; do not build a client site's asset pipeline on it when the upstream is MIT and keyless.
- **@tailark-oss/core-* logo items** — Tailark OSS ships a handful of SVG brand logos as registry items (core-figma, core-clerk, core-vercel and similar). Far narrower coverage than svgl.app, and it puts brand marks in the component tree rather than in public assets.

### site header

**registry item — @jhai/site-header** · UNLICENSED (in-house) · verified 2026-09-14

Built in-house 2026-09-14 because nothing prop-driven existed anywhere. Eighteen @tailark-oss *-header items came back and every one hardcodes its nav array. @jhai/section-header is a heading block inside a band, not a page header, and was repeatedly mistaken for one. Mobile disclosure is a native <details>, so it needs no runtime.

*Restyling:* Token-only. No colour literals; renders correctly with every semantic token grayscale and radius zero.

Rejected:

- **@tailark-oss/mist-hero-section-1-header** — content-locked — hardcoded nav array, zero props, and 17 siblings identical in shape
- **@jhai/section-header** — a heading block inside a band; different component, confusingly similar name

### testimonials

**registry item — @jhai/testimonials** · UNLICENSED (in-house) · verified 2026-09-14

Built in-house 2026-09-14. The largest single hole the composer found: social proof is on every service-business page and @jhai had nothing at all. Eleven @tailark-oss testimonial blocks, every one content-locked. Ships with @jhai/rating-mark, since the registry had no rating or review mark either.

*Restyling:* Token-only. No colour literals; renders correctly with every semantic token grayscale and radius zero.

Rejected:

- **@tailark-oss/veil-testimonials-1** — content-locked, and so are the other ten

### site footer

**registry item — @jhai/site-footer** · UNLICENSED (in-house) · verified 2026-09-14

Built in-house 2026-09-14. Sixteen @tailark-oss footers, all content-locked, and @jhai had none. Two to four columns from the authored array; `minimal` is a real variant rather than passing an empty columns list.

*Restyling:* Token-only. No colour literals; renders correctly with every semantic token grayscale and radius zero.

Rejected:

- **@tailark-oss/veil-footer-1** — content-locked, and so are the other fifteen

### hero

**registry item — @jhai/hero** · UNLICENSED (in-house) · verified 2026-09-14

Built in-house 2026-09-14. Distinct from the 'hero with video' entry, which is a content-locked block for hand-installing. This one takes content through props and, critically, treats MISSING MEDIA as a first-class state: omit media.src and it draws a correctly proportioned empty plate. A section that hard-requires a live URL cannot be placed in a wireframe, which is what forced jhai-composer to fork @jhai/answer's layout locally.

*Restyling:* Token-only. No colour literals; renders correctly with every semantic token grayscale and radius zero.

Rejected:

- **@tailark-oss/dusk-hero-section-1** — content-locked; excellent structure, unusable as a slot target
- **composer-local hero assembled from atoms** — worked, but every consumer rebuilding the same hero out of Eyebrow/Button/ImageSlot is the duplication the registry exists to stop

### pricing section

**registry item — @jhai/pricing** · UNLICENSED (in-house) · verified 2026-09-14

Built in-house 2026-09-14. @jhai/comparison-table is a feature grid with no slot for a price, a billing period or a per-plan CTA, so every consumer rendered those three as local markup above it. `cards-with-comparison` reuses ComparisonTable for the grid half rather than growing a second table, so the two halves cannot drift.

*Restyling:* Token-only. No colour literals; renders correctly with every semantic token grayscale and radius zero.

Rejected:

- **@jhai/comparison-table** — the comparison half only; carries no price, note or CTA
- **@bundui/pricing-sections-01** — content-locked — the right shape for a hand-install, not a composition target

