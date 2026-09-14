# Token map — v1.0.1 → v2.0.0

Breaking. Every JHAI-private token name leaves the registry. A client dev reading installed
source never sees a brand name, a lane code, or a vocabulary they have to learn.

Two destinations, and the rule for choosing between them:

- **A colour that names a ROLE** — "this is the page ground", "this is secondary text" — becomes
  a **shadcn semantic**. Every third-party registry already speaks these, so a consuming project
  learns nothing.
- **A value with no shadcn equivalent** — a ramp step, a duration, a control height — becomes a
  **`--ui-` token**. Descriptive, unbranded, and namespaced so it cannot collide with a host
  project's own variables.

---

## 1. Colour roles → shadcn semantics

| v1.0.1 | v2.0.0 | Note |
|---|---|---|
| `bg-paper-50` | `bg-background` | the page ground |
| `bg-paper-0` | `bg-card` | a raised reading surface |
| `text-text-heading` | `text-foreground` | |
| `text-text-body` | `text-foreground` | **collapse — see §4.1** |
| `text-text-secondary` | `text-muted-foreground` | |
| `text-text-eyebrow` | `text-muted-foreground` | **collapse — see §4.1** |
| `border-line-light` | `border-border` | |
| `border-line-light-soft` | `border-border/60` | |
| `border-rule-light` | `border-border` | |
| `border-edge-light` | `border-border` | |
| `text-bjarmi-ink` | `text-primary` | the one accent |
| `text-bjarmi-glow` | `text-primary` | **collapse — see §4.4** |
| `bg-bjarmi-tint` | `bg-primary/10` | |
| `text-accent` / `text-accent-on-dark` | `text-primary` | v2's `--accent` was the brand accent, which is shadcn's `--primary`, NOT shadcn's `--accent` (a surface). See §4.3. |
| `ring-ring` | `ring-ring` | already semantic, unchanged |

## 2. The dark band → a nested `.dark` scope

**This is the significant judgment call.** See §4.2.

| v1.0.1 | v2.0.0 |
|---|---|
| `bg-ink-950` (dark section ground) | `bg-background`, inside a `.dark` scope |
| `text-dark-text-1` | `text-foreground`, inside a `.dark` scope |
| `text-dark-text-2` | `text-foreground`, inside a `.dark` scope |
| `text-dark-text-3` | `text-muted-foreground`, inside a `.dark` scope |
| `border-line-dark` | `border-border`, inside a `.dark` scope |
| `border-line-dark-soft` | `border-border/60`, inside a `.dark` scope |
| `border-edge-dark` | `border-border`, inside a `.dark` scope |

`ground="dark"` now emits `className="dark"` on its own wrapper. Everything inside resolves
against the client's dark palette automatically. The entire parallel dark vocabulary disappears.

## 3. Structural values → `--ui-`

No shadcn equivalent exists for any of these. Names are descriptive and carry no brand.

| v1.0.1 | v2.0.0 |
|---|---|
| `--ink-950 / 900 / 800 / 600 / 500 / 400 / 300` | `--ui-ink-950 … --ui-ink-300` (step semantics preserved) |
| `--type-hero / display / feature / section` | `--ui-text-hero / display / feature / section` |
| `--type-card-title / card-title-lg` | `--ui-text-card-title / card-title-lg` |
| `--type-lede / body / small / caption / eyebrow / micro` | `--ui-text-lede / body / small / caption / eyebrow / micro` |
| `--weight-heading` | `--ui-weight-heading` |
| `--eyebrow-gap` | `--ui-eyebrow-gap` |
| `--measure-*` (8 tokens) | `--ui-measure-*` |
| `--container / gutter` | `--ui-container / --ui-gutter` |
| `--section-y / section-y-display / header-offset` | `--ui-section-y / -display / --ui-header-offset` |
| `--gap-heading-block / grid / card / inline` | `--ui-gap-*` |
| `--radius-card / inner / pill` | `--ui-radius-card / inner / pill` |
| `--button-h / button-h-nav / field-h` | `--ui-button-h / --ui-button-h-nav / --ui-field-h` |
| `--ease / dur-fast / dur-med / dur-slow` | `--ui-ease / --ui-dur-fast / --ui-dur-med / --ui-dur-slow` |
| `--hover-img-scale / hover-arrow-shift` | `--ui-hover-img-scale / --ui-hover-arrow-shift` |
| `--shadow-field / shadow-lift` | `--ui-shadow-field / --ui-shadow-lift` |
| `--jh-grain` | `--ui-grain` |

**Every `--jh-*` token is gone from the registry.** `theme-base` ships shadcn semantic defaults
plus `--ui-*` and nothing else. JHAI becomes just another consumer of its own registry.

---

## 4. Judgment calls, named rather than resolved silently

### 4.1 The four-step text ramp collapses to two

v1 carried four text colours as distinct roles: heading `#222222`, body `#4a4a48`, secondary
`#6b6b68`, eyebrow `#6e6e6b`. shadcn ships exactly two text roles, `--foreground` and
`--muted-foreground`.

**Called: collapse to two.** Heading and body both take `text-foreground`; secondary and eyebrow
both take `text-muted-foreground`. Inventing a third colour role would be exactly the private
vocabulary this pass exists to remove, and every third-party block already installs against two.

**What is lost:** body copy renders at the heading's colour rather than one step lighter, and
eyebrow is no longer separable from secondary. On the JHAI palette that is a visible but small
change, `#222222` against `#4a4a48`.

**Mitigation that keeps the option open:** the ramp steps still exist as `--ui-ink-600` and
`--ui-ink-400`. Any project wanting the four-step ramp back can set
`--muted-foreground: var(--ui-ink-500)` and paint body copy with `text-(--ui-ink-600)`. Nothing
is destroyed, only removed from the default.

### 4.2 The dark band becomes a nested `.dark` scope rather than an inverted vocabulary

The `ground` prop is an explicit per-section choice, independent of the page theme: a
`<Section ground="dark">` renders a dark band on a light page and must keep doing so. That is
why the v1 dark tokens deliberately did **not** invert under `.dark` — `ground="dark"` paths read
them to paint their own dark side.

Three options were available:

1. **`--ui-invert-*` colour tokens.** Preserves behaviour exactly, but reintroduces a private
   colour vocabulary under a new prefix, which is the thing being removed.
2. **Delete `ground` and let `.dark` do it.** Idiomatic, but destroys the design: a dark band on
   a light page is the whole point of the pattern.
3. **`ground="dark"` emits `className="dark"` on its own wrapper.** Everything inside then
   resolves against the client's own dark palette through ordinary shadcn semantics.

**Called: option 3.** It is what `.dark` being a class selector is for, it removes seven tokens
rather than renaming them, and a client's dark palette drives JHAI's dark bands for free instead
of needing a second set of overrides.

**The behavioural difference, stated plainly:** in v1 a dark band's colours were fixed. In v2
they follow the consuming project's `.dark` block. For JHAI the rendered result is identical
because those values were already the same. For a client whose dark palette differs from their
inverted light palette, the band follows their dark palette — almost certainly what they want,
and in any case now their decision rather than ours.

### 4.3 `--accent` collided and is now `--primary`

v2's `--accent` meant the brand accent. shadcn's `--accent` means a muted interactive *surface*,
and its brand colour is `--primary`. The two names meant opposite things, and the old
`theme-base` mapped around the collision with a comment. Registry items now use `text-primary`,
so anyone reading installed source gets the shadcn meaning with no footnote.

### 4.4 The accent's two sides collapse to one token

v1 had `--bjarmi-ink` (accent on light) and `--bjarmi-glow` (accent on dark), because one accent
value cannot carry contrast on both grounds. Under §4.2 the dark band is a `.dark` scope, so
`--primary` already has a dark-side value and `text-primary` resolves correctly on both grounds
under one name. Both tokens collapse.

---

## 5. The rule going forward

**No JHAI-private name enters a registry item, ever.** Not a brand word, not a client name, not
an internal lane code, path or decision reference. This is now a publication constraint of the
same standing as the ReactBits and shadcnblocks redistribution bar: those say what may not be
*served*, this says what may not be *named*.

Enforced by `scripts/check-no-private-names.mjs`, wired into `pnpm run preflight`.

## 6. jhai-new-website is not touched

`src/styles/v2-theme.css` carries a binding no-rename contract — *"a rename is not a refactor,
it is 200 silent rendering failures."* That contract protects that repo, and this pass does not
touch it. It keeps `--ink-*`, `--paper-*` and `--bjarmi-*` exactly as they are and declares
whatever aliases it needs locally to consume `@jhai`, the same as any client would.

## 7. v1.0.1 stays installable

The tag is immutable and the raw URL takes a ref, so anything already on v1 keeps working:

```
https://raw.githubusercontent.com/JustinHarrisAI/jhai-registry/v1.0.1/r/{name}.json
```

Nothing had installed from the registry in anger when this ran, which is the whole reason it ran
now rather than after the first client project.
