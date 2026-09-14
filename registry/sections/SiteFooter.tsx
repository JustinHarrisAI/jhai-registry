/**
 * SiteFooter — brand, standfirst, link columns, legal line.
 *
 * `columns` is capped at four and rendered from the authored array, so a footer with two
 * columns is a two-column footer rather than four with two empty. The cap is a layout fact:
 * past four, the columns are narrower than their own headings at container width.
 *
 * It is NOT a Section. A footer sits outside the band rhythm — it takes its own padding and
 * its own top hairline, and wrapping it in `Section` would give it the section's vertical
 * scale, which is roughly twice what a footer wants.
 *
 * `minimal` drops the columns entirely: brand, standfirst and legal on one line. That is the
 * shape a one-page site needs, and building it as a variant stops a caller from faking it by
 * passing `columns: []` and getting an empty grid.
 */

import { Container } from './shell';
import type { Ground } from './shell';
import type { SiteFooterContent } from './content-types';

export type SiteFooterVariant = 'columns' | 'minimal';

/*
 * Tailwind utilities, not the `v2-grid-*` classes from HomeStyles. A footer that loses its
 * columns because the page did not mount a stylesheet is a footer that cannot be dropped into
 * an arbitrary page — measured in jhai-composer, where all three columns stacked into one list.
 */
const COLUMN_GRID: Record<number, string> = {
  1: 'grid grid-cols-1',
  2: 'grid grid-cols-1 sm:grid-cols-2',
  3: 'grid grid-cols-1 sm:grid-cols-3',
  4: 'grid grid-cols-2 lg:grid-cols-4',
};

const GROUNDS: Record<Ground, string> = {
  paper: 'bg-background',
  white: 'bg-card',
  ink: 'dark bg-background text-foreground',
};

export function SiteFooter({
  content,
  variant = 'columns',
  ground = 'paper',
}: {
  content: SiteFooterContent;
  variant?: SiteFooterVariant;
  ground?: Ground;
}) {
  const { brand, blurb, columns, legal } = content;
  const shown = columns.slice(0, 4);
  const minimal = variant === 'minimal' || shown.length === 0;

  return (
    <footer
      data-screen-label="Site footer"
      className={`border-t border-border ${GROUNDS[ground]}`}
    >
      <Container>
        <div className="py-16">
          <div
            className={
              minimal
                ? 'flex flex-col gap-8 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between'
                : 'grid grid-cols-1 gap-ui-gap-grid lg:grid-cols-[2fr_3fr]'
            }
          >
            <div>
              <p className="m-0 font-sans text-ui-card-title-lg [font-weight:var(--ui-weight-heading)] tracking-[-0.02em] text-foreground">
                {brand}
              </p>
              {blurb ? (
                <p className="mt-3 m-0 max-w-ui-measure-lede font-sans text-ui-small leading-[1.6] text-muted-foreground">
                  {blurb}
                </p>
              ) : null}
            </div>

            {minimal ? null : (
              <div className={`${COLUMN_GRID[shown.length] ?? 'grid grid-cols-1 sm:grid-cols-3'} gap-ui-gap-card`}>
                {shown.map((col) => (
                  <div key={col.heading}>
                    <p className="m-0 font-mono text-ui-eyebrow tracking-[0.24em] text-muted-foreground uppercase">
                      {col.heading}
                    </p>
                    <ul className="mt-4 m-0 flex list-none flex-col gap-2.5 p-0">
                      {col.links.map((link) => (
                        <li key={link.href + link.label}>
                          <a
                            href={link.href}
                            className="v2-link font-sans text-ui-small text-muted-foreground hover:text-foreground"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {legal ? (
            <p
              className={`m-0 font-mono text-ui-caption text-muted-foreground ${
                minimal ? 'mt-8' : 'mt-14'
              }`}
            >
              {legal}
            </p>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}
