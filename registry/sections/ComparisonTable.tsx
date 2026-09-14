import type { CSSProperties, ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * ComparisonTable — the tick/cross comparison grid.
 *
 * SYSTEM EXTENSION. The export documents this as a page pattern, not a
 * component: "The tick/cross table IS the centerpiece: short hero → full
 * comparison table (tinted header, dark Justin column, accent hairline flag)"
 * (`Design System.dc.html`, comparison page recipe). No component was extracted,
 * so this is built from the system's own parts and nothing else:
 *   · header tint  = --accent-tint, the token whose comment reads "table header tint"
 *   · highlighted column = --ui-ink-950 ground, the same dark card as PricingCard featured
 *   · flag hairline = --accent-on-dark, 2px, on the highlighted column only
 *   · marks = the CheckList tick/cross recipe, mono 12px
 * Logged in `tasks/2026-08-10-wireframe-v2/GAP-LEDGER.md`.
 *
 * A real <table> on purpose. The tick/cross grid is data, so it gets row and
 * column headers a screen reader can navigate, and every glyph carries a text
 * equivalent instead of leaving a blind reader with an unlabelled symbol.
 *
 * Inline styles became Tailwind utilities and the accent flag
 * became a `separator`. The table stays a <table>, the scopes stay scopes, and the
 * text equivalents stay text — the markup a screen reader walks is byte-identical.
 */

export interface ComparisonColumn {
  /** column label, e.g. "Justin Harris" or "A cheap agency" */
  label: string;
  /** optional mono sub-label under the name */
  note?: string;
  /** the dark column — exactly one per table */
  highlight?: boolean;
}

export interface ComparisonRow {
  /** the row's criterion, left column */
  label: ReactNode;
  /** one entry per column: true = tick · false = cross · node = literal text */
  values: (boolean | ReactNode)[];
}

export interface ComparisonTableProps {
  /** header cell above the criteria column, mono lowercase */
  rowHeading?: string;
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  /** table caption — read by screen readers, hidden visually */
  caption?: string;
  /** text equivalents for the marks */
  yesLabel?: string;
  noLabel?: string;
  style?: CSSProperties;
}

/** the mono eyebrow recipe: 9.5px / 0.24em / uppercase */
const MONO_LABEL = 'font-mono text-ui-eyebrow tracking-[0.24em] uppercase';

/** every cell shares one box; only the ground and the hairline colour differ */
const CELL = 'px-6 py-[18px] font-sans leading-[1.5] border-t';

/**
 * The tick/cross recipe, exported because one caller renders the mark itself when it needs
 * the mark AND text in the same cell (`sections/Compare.tsx`). That caller had copied the
 * recipe WITHOUT its ground branch, which is how the homepage shipped a teal tick on the
 * dark column and an `--ui-ink-300` cross on white: 19 nodes failing WCAG 2.2 AA at 3.69:1
 * and 2.17:1. One recipe, two grounds, no second copy.
 *
 * The marks paint in semantics, so they carry on both grounds without branching:
 *   tick  · `text-primary`          — the accent, which has a dark-side value of its own
 *   cross · `text-muted-foreground` — muted, never a red cross and never a coloured fill
 * Contrast was checked at the old fixed values and cleared 5:1 on both grounds; a consuming
 * project picking a low-contrast --muted-foreground owns that outcome, as it does everywhere
 * else on its page.
 */
/**
 * `dark` no longer selects a colour, and that is the fix rather than an oversight.
 *
 * The highlighted column now opens a nested `.dark` scope (see the header and body cells
 * below), so `text-primary` and `text-muted-foreground` already resolve to their dark-side
 * values inside one. Both branches collapsing to the same token is the point: one recipe,
 * and the scope inverts it. The parameter is kept because `Compare.tsx` calls this with the
 * column's highlight flag and the signature is public.
 */
export function comparisonMarkClass(value: boolean, _dark: boolean): string {
  return value ? 'text-primary' : 'text-muted-foreground';
}

export function ComparisonTable({
  rowHeading = 'what you get',
  columns,
  rows,
  caption,
  yesLabel = 'Yes',
  noLabel = 'No',
  style,
}: ComparisonTableProps) {
  return (
    /* `style` is the caller's own override, computed at their call site rather than here. */
    <div
      className="overflow-x-auto rounded-(--ui-radius-card) border border-border"
      style={style}
    >
      {/*
       * border-separate + border-spacing-0, not collapse. Under border-collapse the hairline
       * between the header row and the first body row is painted by the TABLE rather than by
       * the cell, so it composites over the table's light background and renders as a pure
       * white line straight across the dark highlighted column. Separate lets each cell paint
       * its own top border over its own ground, which is the only way the dark column reads as
       * one unbroken block. Only the top border is ever set, so nothing doubles up.
       */}
      <table className="w-full border-separate border-spacing-0 text-left font-sans">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            <th
              scope="col"
              className={cn(
                MONO_LABEL,
                'min-w-[220px] bg-primary/10 px-6 py-[18px] align-bottom font-normal text-primary'
              )}
            >
              {rowHeading}
            </th>
            {columns.map((col, i) => (
              <th
                key={i}
                scope="col"
                className={cn(
                  'min-w-[150px] px-6 pb-[18px] align-bottom',
                  /*
                   * The flag used to be a 2px borderTop, which added 2px to this cell's box and
                   * therefore 2px to the whole header row. The separator paints over the cell
                   * instead of inside its box, so the highlighted column takes 20px of top
                   * padding to give that 2px back. Row height is unchanged either way.
                   */
                  /*
                   * `dark` opens a nested dark scope on the cell, which is the same device
                   * shell.tsx uses for an ink Section. Before v2.0.0 the highlight column was
                   * an explicit --ui-ink-950 ground; the rename pointed it at `bg-background`
                   * with `text-card` on the label, and on any light palette that is white text
                   * on a white cell. Found by rendering, not by review: jhai-composer's visual
                   * QA caught the column label invisible. Opening the scope restores the
                   * documented dark column without reintroducing a private token, and it
                   * follows the consuming project's own dark palette.
                   */
                  col.highlight
                    ? 'dark relative bg-background pt-5'
                    : 'bg-primary/10 pt-[18px]'
                )}
              >
                {col.highlight ? (
                  <Separator
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 bg-primary data-horizontal:h-0.5"
                  />
                ) : null}
                <span
                  className={cn(
                    'block font-sans text-[15px] [font-weight:var(--ui-weight-heading)] tracking-[-0.01em]',
                    /* Inside the dark scope above, `text-foreground` IS the light ink. One
                       token for both columns; the scope does the inverting. */
                    'text-foreground'
                  )}
                >
                  {col.label}
                </span>
                {col.note ? (
                  <span
                    className={cn(
                      MONO_LABEL,
                      'mt-2 block font-normal',
                      /* Same story: muted resolves against whichever scope the cell is in. */
                      'text-muted-foreground'
                    )}
                  >
                    {col.note}
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              <th
                scope="row"
                className={cn(
                  CELL,
                  'border-border/60 text-ui-body font-normal text-foreground'
                )}
              >
                {row.label}
              </th>
              {columns.map((col, c) => {
                const value = row.values[c];
                const dark = Boolean(col.highlight);
                const cell = cn(
                  CELL,
                  'text-[14px]',
                  /* The body cells of the highlighted column open the same dark scope as its
                     header, so the column reads as one dark band top to bottom. */
                  dark
                    ? 'dark border-border/60 bg-background text-foreground'
                    : 'border-border/60 bg-transparent text-muted-foreground'
                );

                if (typeof value === 'boolean') {
                  const mark = comparisonMarkClass(value, dark);
                  return (
                    <td key={c} className={cell}>
                      <span
                        aria-hidden="true"
                        className={cn('font-mono text-ui-caption', mark)}
                      >
                        {value ? '✓' : '✕'}
                      </span>
                      <span className="sr-only">{value ? yesLabel : noLabel}</span>
                    </td>
                  );
                }

                return (
                  <td key={c} className={cell}>
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
