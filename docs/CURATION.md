# JHAI Curation Index

> **GENERATED FILE — do not edit.** Source of truth is [CURATION.json](CURATION.json). Regenerate with `node scripts/build-curation-md.mjs`.

Last full pass **2026-09-12** · 789 items indexed across `@shadcn`, `@tailark-oss`, `@kibo-ui`, `@magicui`, `@blocks-so`, `@fancy` · shadcn@4.21.0 via pnpm dlx

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
| **masonry wall** | primitive | CSS columns-* utilities | none — Tailwind core, e.g. columns-1 md:columns-2 lg:columns-3 gap-6, with break-inside-avoid on each child | [preview](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_multicol_layout) |
| **accordion** | primitive | shadcn core accordion | `pnpm dlx shadcn@4.21.0 add @shadcn/accordion` | [preview](https://ui.shadcn.com/docs/components/accordion) |
| **tabs** | primitive | shadcn core tabs | `pnpm dlx shadcn@4.21.0 add @shadcn/tabs` | [preview](https://ui.shadcn.com/docs/components/tabs) |
| **scroll reveal** | build in-house | @jhai/scroll-reveal — thin wrapper over Motion whileInView | pending Phase 3; today, hand-write it over the existing motion dependency | [preview](https://magicui.design/docs/components/text-reveal) |
| **text reveal** | registry item | @magicui/text-reveal | `pnpm dlx shadcn@4.21.0 add @magicui/text-reveal` | [preview](https://magicui.design/docs/components/text-reveal) |
| **hero with video** | registry item | @tailark-oss/dusk-hero-section-5-video | `pnpm dlx shadcn@4.21.0 add @tailark-oss/dusk-hero-section-5-video` | [preview](https://tailark.com/blocks/dusk/hero-section) ⚠︎ |
| **pricing table** | registry item | @tailark-oss/veil-pricing-1 | `pnpm dlx shadcn@4.21.0 add @tailark-oss/veil-pricing-1` | [preview](https://tailark.com/blocks/veil/pricing) ⚠︎ |
| **FAQ** | registry item | @tailark-oss/veil-faqs-1 | `pnpm dlx shadcn@4.21.0 add @tailark-oss/veil-faqs-1` | [preview](https://tailark.com/blocks/veil/faqs) ⚠︎ |
| **form inputs** | primitive | shadcn core input, select, textarea, form, label | `pnpm dlx shadcn@4.21.0 add @shadcn/input @shadcn/select @shadcn/textarea @shadcn/form @shadcn/label` | [preview](https://ui.shadcn.com/docs/components/input) |
| **logo wall** | library | svgl.app — fetch SVGs directly from the keyless public API | none — GET https://api.svgl.app?search=<brand>, then fetch the returned route (and wordmark / dark variant if present) | [preview](https://svgl.app) |

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

CORRECTS the original E.1 answer, which said to build this because nothing better existed. Wrong: the fuzzy search missed it and a grep of the indexes found it immediately. Chosen over Fancy's because it demos decimal handling, which the JHAI stat tiles need. Compose it INSIDE the existing core/StatTile.tsx rather than replacing that component — the tile is the shell, the ticker is the numeral.

*Restyling:* Paints nothing — it animates a number. Inherits whatever the parent sets.

Rejected:

- **@fancy/basic-number-ticker** — Equally clean and equally free. Loses only on decimal support being less obviously covered. Swap to it without argument if Magic UI's version turns out to rewrite globals.css the way its marquee does — check that on first install.
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

**primitive — CSS columns-* utilities** · n/a (CSS) / MIT (react-masonry-css, paulcollett/react-masonry-css) · verified 2026-09-12

This is the one genuine gap in the wired set and it was measured, not assumed. Zero of 789 indexed items matched across four index-grep terms (masonry, mosaic, pinterest, waterfall) and three separate fuzzy-search phrasings (masonry, masonry grid, testimonial wall). Nothing exists. CSS multi-column costs nothing, adds no dependency, and restyles perfectly. Note the distinction that trips people up: testimonial CONTENT is well covered — there are 11 Tailark OSS testimonial blocks — it is the masonry LAYOUT that does not exist.

*Restyling:* No colour. Layout utilities only.

Rejected:

- **react-masonry-css** — The option ONLY when ordered left-to-right reflow is required. CSS columns fill top-to-bottom per column, so item order reads down then across. If the wall is chronological or ranked and reading order matters, take the dependency. If it is a decorative testimonial wall, it does not.
- **CSS grid with row spans** — Gives true ordered flow without a dependency, but every tile needs a known or measured height. Fine for fixed-size cards, wrong for variable-length testimonials, which is the actual use case.

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

IMPORTANT — record the reason precisely: the SEARCH FAILED, which is not the same as nothing existing. The query 'tabs' across all six namespaces returned an SVG logo (@tailark-oss/core-bolt) and three unrelated table blocks. That is a ranking failure in the shadcn fuzzy search, not evidence of absence. Core tabs is the right answer regardless — it is tokenised and accessible — but if a richer tabs component is ever wanted, grep the indexes rather than re-running this search and concluding nothing is there.

*Restyling:* Fully token-bound out of the box.

Rejected:

- **nothing — search returned no real candidate** — No tabs component surfaced from any of the five third-party namespaces. Recorded as a search failure rather than a finding: the indexes were not exhaustively grepped for this need, so absence is unproven.

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

*Preview caveat: tailark.com returns HTTP 200 for any path including bogus ones, so the 200 here proves the host is up, not that the page exists. oss.tailark.com has no per-item preview pages — its own homepage links 404. Confirm visually before quoting this URL to a client.*

*Restyling:* Token-bound. Tailark OSS measured 0 hardcoded colour across sampled blocks.

Rejected:

- **@magicui/hero-video-dialog** — A click-to-play modal player, not a video hero. Different need — it is the right answer when the video is a demo behind a thumbnail.
- **@tailark-oss/dusk-landing-1-hero-video and dusk-landing-5-hero-video** — Whole landing pages rather than a hero section. Too much surface to inherit when we only want the hero.

### pricing table

**registry item — @tailark-oss/veil-pricing-1** · MIT (tailark/blocks) · verified 2026-09-12

Best measured restylability of any pricing block found: 8 semantic tokens, 0 hardcoded colour, 0 hex. Verified by real install in Task 1.4 — it landed and rendered in the JHAI palette with no edit to the component. Seven Tailark OSS pricing blocks came back across three families; veil is the most restrained, which suits the editorial direction.

*Preview caveat: tailark.com is a catch-all that returns 200 for any path. Status is not proof the page exists.*

*Restyling:* 8 semantic tokens, 0 hardcoded. Verified by install.

Rejected:

- **@tailark-oss/veil-pricing-2 and veil-pricing-3** — Same family, more surface — comparison columns and feature matrices. Pick these when the client actually sells tiers that need comparing.
- **@tailark-oss/dusk-pricing-1/2 and mist-pricing-1/2** — The Dusk and Mist families carry heavier decoration than the JHAI direction wants. Equally token-clean, so they are live options for client brands.
- **in-house cards/PricingCard.tsx** — Already exists, but carries 2 hardcoded palette utilities and 2 hex literals, so it is Tier 3 in the seed plan and needs colour work before it could be a registry item.

### FAQ

**registry item — @tailark-oss/veil-faqs-1** · MIT (tailark/blocks) · verified 2026-09-12

Measured 5 semantic tokens, 0 hardcoded colour. Nine Tailark OSS FAQ blocks came back — the densest coverage of any need after pricing — and veil-faqs-1 is the plainest. Composes over the shadcn core accordion chosen above rather than bringing its own disclosure primitive.

*Preview caveat: tailark.com is a catch-all that returns 200 for any path. Status is not proof the page exists.*

*Restyling:* 5 semantic tokens, 0 hardcoded.

Rejected:

- **@tailark-oss/veil-faqs-2 through 5** — Same family with more layout — two-column, categorised, with a contact CTA. Live options when the FAQ carries more than six questions.
- **@tailark-oss/dusk-faqs-1 and mist-faqs-1/2/3** — Heavier families. Same reasoning as pricing.
- **in-house page/FAQItem.tsx** — Already on disk with zero hardcoded colour, so it is a Tier 2 seed candidate. Use it when the FAQ needs JHAI-specific behaviour; use the Tailark block for a standard section on a spec site.

### form inputs

**primitive — shadcn core input, select, textarea, form, label** · MIT (shadcn/ui) · verified 2026-09-12

IMPORTANT — as with tabs, record this precisely: the SEARCH FAILED. The query 'form input' returned @kibo-ui/dialog-stack, @kibo-ui/gantt and @magicui/ripple-button. That is a ranking failure, not evidence of absence. Core primitives are the right answer anyway — they are tokenised, accessible, and every block we install already depends on them — but do not cite this pass as proof that nothing else exists.

*Restyling:* Fully token-bound out of the box.

Rejected:

- **@intentui/* form components** — Built on react-aria-components, so accessibility is the product rather than an afterthought. Rejected as a default only because it introduces a SECOND primitive stack alongside Radix/Base. That should be a deliberate choice on a client with a stated accessibility requirement, never a silent default.
- **@blocks-so/login-01 and the other form blocks** — Whole assembled forms rather than inputs. Useful as a starting layout — verified installing clean in Task 1.4 with 5 semantic tokens and 0 hardcoded colour — but they compose the core primitives rather than replacing them. Note they prompt to overwrite button, input, label and separator on install; decline.

### logo wall

**library — svgl.app — fetch SVGs directly from the keyless public API** · MIT (pheralb/svgl). Individual brand marks remain the property of their owners — usage is governed by each brand's own trademark policy, not by svgl's licence. · verified 2026-09-12

Thirteenth entry, added because the Task 0.4 pass found the source behind 21st.dev's logo search. svgl.app is MIT (pheralb/svgl) with a public API that needs no key and no account. Verified: https://svgl.app/library/vercel.svg returns raw SVG, and https://api.svgl.app?search=stripe returns JSON carrying both route and wordmark variants. Client logo walls therefore need no paid library and no 21st.dev subscription. Many brands also ship a dark-mode variant, which is what makes this better than scraping favicons.

*Restyling:* SVGs carry brand colour by definition. Use currentColor variants or the mono/wordmark route where a monochrome wall is wanted.

Rejected:

- **21st.dev search_logo via MCP** — Free and unlimited, and convenient inside Claude Code — but it is a wrapper over exactly this source. Fine to use interactively; do not build a client site's asset pipeline on it when the upstream is MIT and keyless.
- **@tailark-oss/core-* logo items** — Tailark OSS ships a handful of SVG brand logos as registry items (core-figma, core-clerk, core-vercel and similar). Far narrower coverage than svgl.app, and it puts brand marks in the component tree rather than in public assets.

