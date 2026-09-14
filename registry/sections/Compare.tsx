/**
 * The comparison. Four honest options, ours in the dark column with the accent hairline
 * flagging it, which is the pattern the design system documents for this table.
 *
 * Rendered through the wave-1 ComparisonTable so the comparison page and the homepage
 * cannot drift into two different tables. Each cell carries its own mark, so a row where
 * DIY genuinely wins renders a tick against DIY.
 *
 * Inline styles became Tailwind utilities. The table itself
 * belongs to `page/ComparisonTable`, so only what this file writes changed; its 56px offset
 * moved onto the wrapper this file already renders, which is where a utility can carry it.
 */

import { ComparisonTable, comparisonMarkClass, type ComparisonRow } from './ComparisonTable';
import { Eyebrow } from './Eyebrow';
import { Container, Section } from './shell';
import type { CompareContent } from './content-types';

export function Compare({ content }: { content: CompareContent }) {
  const rows: ComparisonRow[] = content.rows.map((row) => ({
    label: row.label,
    values: row.cells.map((cell, i) =>
      cell.mark ? (
        /* The mark takes its colour from the COLUMN's ground, via the table's own recipe.
           This file used to hard-code `text-primary` / `text-muted-foreground` for every column,
           which put the teal tick on the dark column at 3.69:1 and the cross on white at
           2.17:1 — 19 WCAG 2.2 AA failures from one copied recipe missing its ground branch. */
        <span className="inline-flex items-baseline gap-2.5">
          <span
            aria-hidden="true"
            className={`flex-none font-mono text-ui-caption ${comparisonMarkClass(
              cell.mark === 'check',
              Boolean(content.columns[i]?.highlight)
            )}`}
          >
            {cell.mark === 'check' ? '✓' : '✕'}
          </span>
          <span className={cell.strong ? '[font-weight:var(--ui-weight-heading)]' : undefined}>{cell.text}</span>
        </span>
      ) : (
        <span className={cell.strong ? '[font-weight:var(--ui-weight-heading)]' : undefined}>{cell.text}</span>
      )
    ),
  }));

  return (
    <Section id="compare" label="Comparison" ground="white">
      <Container>
        <div className="v2-stack-sm flex flex-wrap items-end justify-between gap-12">
          <div>
            <Eyebrow number={content.number}>{content.label}</Eyebrow>
            <h2
              data-rv=""
              className="mt-ui-eyebrow-gap mr-0 mb-0 ml-0 max-w-[620px] font-sans text-ui-section leading-[1.06] [font-weight:var(--ui-weight-heading)] tracking-[-0.035em] text-foreground"
            >
              {content.title}
            </h2>
          </div>
          <p className="m-0 max-w-ui-measure-side font-sans text-[15px] leading-[1.6] text-muted-foreground">
            {content.side}
          </p>
        </div>
        <div data-rv="" className="mt-14">
          <ComparisonTable
            rowHeading=""
            caption={content.title}
            columns={content.columns.map((col) => ({ label: col.label, highlight: col.highlight }))}
            rows={rows}
          />
        </div>
      </Container>
    </Section>
  );
}
