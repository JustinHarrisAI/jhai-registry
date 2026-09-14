# The content-prop convention

**Decided 2026-09-14. Applies to SECTIONS.**

> Every section component takes its content through a single `content` object prop whose keys
> are the content field names. No positional props for content, no loose top-level content
> props. Layout and behaviour flags stay as separate top-level props.

```tsx
// the shape
<Testimonials
  content={{ label, title, quotes }}   // content: one object, keys are field names
  variant="grid"                        // layout: top-level
  ground="paper"                        // layout: top-level
/>
```

## Why

A composition-driven consumer hand-writes an adapter per component to map its slots onto that
component's props. When every section takes the same shape, that adapter is a pass-through:

```tsx
// uniform content prop — the adapter is one line
;<Section content={slots} variant={variant} />

// loose props — the adapter is bespoke, per component, forever
;<LogoWall logos={readList(slots, 'logos')} label={readText(slots, 'label') ?? ''} />
```

The second form is why jhai-composer needed 400 lines of adapter code to render eleven section
types, and why a new registry item cannot become usable there without someone editing the
consumer. The convention is what makes "publish an item, the consumer picks it up on its next
sync" true rather than aspirational.

## What the convention does NOT cover

**Atoms and cards legitimately take loose props**, and forcing `content` on them would be
cargo-culting. `Button` takes `href` and `children`. `ToolCard` takes `title`, `description`,
`cta`. These are parts, assembled by a section; they are not the thing a composition points at.

The line is: **does a composition name this item as a section target?** If yes, it takes
`content`. If it is a part that a section assembles, it takes whatever reads best.

`CTABand` is the clearest case of the split working correctly. The card takes loose props
(`title`, `subline`, `field`, `link`) because it is a card. `CtaBandSection`, the section that
wraps it, takes `content`. One item in the registry per role, and the section is the composable
one.

## Audit — where the registry stands today

Measured 2026-09-14 across all 30 items. **Nothing below is retrofitted in this pass**; this is
the list, as asked for.

### Sections that comply (10)

| Item | Content type |
|---|---|
| `@jhai/answer` | `AnswerContent` |
| `@jhai/compare` | `CompareContent` |
| `@jhai/cta-band-section` | `CtaBandContent` (+ `field` render prop) |
| `@jhai/hero` | `HeroContent` — new |
| `@jhai/pricing` | `PricingContent` — new |
| `@jhai/problem` | `ProblemContent` |
| `@jhai/questions` | `QuestionsContent` |
| `@jhai/site-footer` | `SiteFooterContent` — new |
| `@jhai/site-header` | `SiteHeaderContent` — new |
| `@jhai/testimonials` | `TestimonialsContent` — new |

Every one of the five new items was built to the convention, so the compliant half of the
registry is now the majority of its sections.

### Sections that do NOT comply (4)

These name themselves as bands a composition would point at, and take loose top-level props.
They are the retrofit queue.

| Item | Takes | Note |
|---|---|---|
| `@jhai/logo-wall` | `logos`, `label` | Two props, both content. The smallest retrofit in the list. |
| `@jhai/ticker` | `text` | One content prop. Trivial to wrap, trivial to leave. |
| `@jhai/record-band` | `stats` (+ `ground`, `standalone`) | `stats` is content; the other two are correctly top-level layout flags. |
| `@jhai/comparison-table` | `rowHeading`, `columns`, `rows`, `caption`, `yesLabel`, `noLabel` | The largest. Also the one with the strongest case for staying as it is — see below. |

**`comparison-table` is a judgment call, not an oversight.** It is used as a part by both
`@jhai/compare` and `@jhai/pricing`, which is card-shaped usage, and it is also reachable
directly as a section. If it is retrofitted it should GAIN a `content` prop rather than lose the
loose ones, so its two internal callers do not have to change.

### Cards and parts — convention does not apply (5)

`@jhai/blog-card`, `@jhai/case-card`, `@jhai/cta-band`, `@jhai/faq-item`, `@jhai/tool-card`.

Assembled by sections, never named by a composition. Loose props are correct here.

### Atoms, layout and types — convention does not apply (11)

`@jhai/button`, `@jhai/check-list`, `@jhai/eyebrow`, `@jhai/icons`, `@jhai/image-slot`,
`@jhai/rating-mark`, `@jhai/section-header`, `@jhai/shell`, `@jhai/stat-tile`,
`@jhai/content-types`, `@jhai/theme-base`.

`@jhai/section-header` is worth naming explicitly because it reads like a section and is not: it
is the eyebrow-plus-heading block *inside* a band. The page's own header is `@jhai/site-header`.

## Rule for new items

A new section ships with a `*Content` type in `content-types.ts` and takes it through `content`.
A new part ships with whatever props read best. If you cannot tell which you are building, ask
whether a composition would name it directly — that is the whole test.
