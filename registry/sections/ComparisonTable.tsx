import type { CSSProperties, ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * ComparisonTable — the tick/cross comparison grid.
 *
 * SYSTEM EXTENSION. The export documents this as a page pattern, not a
 * component: "The tick/cross table IS the centerpiece: short hero → full
 * comparison table (tinted header, dark Justin column, bjarmi hairline flag)"
 * (`Design System.dc.html`, comparison page recipe). No component was extracted,
 * so this is built from the system's own parts and nothing else:
 *   · header tint  = --bjarmi-tint, the token whose comment reads "table header tint"
 *   · highlighted column = --ink-950 ground, the same dark card as PricingCard featured
 *   · flag hairline = --accent-on-dark, 2px, on the highlighted column only
 *   · marks = the CheckList tick/cross recipe, mono 12px
 * Logged in `tasks/2026-08-10-wireframe-v2/GAP-LEDGER.md`.
 *
 * A real <table> on purpose. The tick/cross grid is data, so it gets row and
 * column headers a screen reader can navigate, and every glyph carries a text
 * equivalent instead of leaving a blind reader with an unlabelled symbol.
 *
 * Lane W1-0, 2026-08-11: inline styles became Tailwind utilities and the bjarmi flag
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
const MONO_LABEL = 'font-mono text-type-eyebrow tracking-[0.24em] uppercase';

/** every cell shares one box; only the ground and the hairline colour differ */
const CELL = 'px-6 py-[18px] font-sans leading-[1.5] border-t';

/**
 * The tick/cross recipe, exported because one caller renders the mark itself when it needs
 * the mark AND text in the same cell (`sections/Compare.tsx`). That caller had copied the
 * recipe WITHOUT its ground branch, which is how the homepage shipped a teal tick on the
 * dark column and an `--ink-300` cross on white: 19 nodes failing WCAG 2.2 AA at 3.69:1
 * and 2.17:1. One recipe, two grounds, no second copy.
 *
 * The colours are the ramp's own on-light / on-dark twins and nothing new:
 *   tick  · light `--bjarmi-ink` 5.68:1 on white · dark `--bjarmi-glow` 7.54:1 on `--ink-950`
 *   cross · light `--ink-400`    5.11:1 on white · dark `--dark-text-3` 7.54:1 on `--ink-950`
 * `--ink-300` stays the disabled/muted step; it is simply not legible enough to carry a mark
 * a reader scans. The brand accent is untouched on both sides.
 */
export function comparisonMarkClass(value: boolean, dark: boolean): string {
  if (value) return dark ? 'text-bjarmi-glow' : 'text-bjarmi-ink';
  return dark ? 'text-dark-text-3' : 'text-ink-400';
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
      className="overflow-x-auto rounded-(--radius-card) border border-line-light"
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
                'min-w-[220px] bg-bjarmi-tint px-6 py-[18px] align-bottom font-normal text-bjarmi-ink'
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
                  col.highlight ? 'relative bg-ink-950 pt-5' : 'bg-bjarmi-tint pt-[18px]'
                )}
              >
                {col.highlight ? (
                  <Separator
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 bg-bjarmi-glow data-horizontal:h-0.5"
                  />
                ) : null}
                <span
                  className={cn(
                    'block font-sans text-[15px] [font-weight:var(--weight-heading)] tracking-[-0.01em]',
                    col.highlight ? 'text-paper-0' : 'text-text-heading'
                  )}
                >
                  {col.label}
                </span>
                {col.note ? (
                  <span
                    className={cn(
                      MONO_LABEL,
                      'mt-2 block font-normal',
                      col.highlight ? 'text-bjarmi-glow' : 'text-ink-500'
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
                  'border-line-light-soft text-type-body font-normal text-text-body'
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
                  dark
                    ? 'border-line-dark-soft bg-ink-950 text-dark-text-2'
                    : 'border-line-light-soft bg-transparent text-text-secondary'
                );

                if (typeof value === 'boolean') {
                  const mark = comparisonMarkClass(value, dark);
                  return (
                    <td key={c} className={cell}>
                      <span
                        aria-hidden="true"
                        className={cn('font-mono text-type-caption', mark)}
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
