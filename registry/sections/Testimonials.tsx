/**
 * Testimonials — the social proof band.
 *
 * The registry had nothing for this, which is the largest hole jhai-composer found: social
 * proof is on every service-business page and the eleven third-party testimonial blocks are
 * all content-locked.
 *
 * ONE HONESTY RULE, and it is the reason `rating` is optional rather than defaulted.
 * A star mark is a factual claim about a real review. A component that defaults `rating` to 5
 * invents evidence every time a caller omits it, which is how a fabricated five-star row ends
 * up on a client's page with nobody having decided to put it there. Omit it and no mark is
 * drawn. `RatingMark` exists so the one that IS real has a house recipe to draw with.
 *
 * `single` is not `grid` with one item. A lone quote wants the display scale and the width of
 * a statement; three want card measure. Same content, two layouts, and the variant says which.
 */

import { Eyebrow } from './Eyebrow';
import { RatingMark } from './RatingMark';
import { Container, Section } from './shell';
import type { Ground } from './shell';
import type { TestimonialEntry, TestimonialsContent } from './content-types';

export type TestimonialsVariant = 'grid' | 'single';

/**
 * 1 to 6. Past three the grid is three-up and wraps; past six it is a wall, not a band.
 *
 * These are Tailwind utilities and NOT the `v2-grid-*` classes the older sections use. Those
 * live in `HomeStyles`, a stylesheet a consuming page has to remember to render, and a section
 * that silently loses its columns when nobody mounted a stylesheet is a section that cannot be
 * dropped into an arbitrary page. Measured: this band rendered as one stacked column in
 * jhai-composer for exactly that reason. Self-sufficient is the requirement.
 */
const COLUMNS: Record<number, string> = {
  1: 'grid grid-cols-1',
  2: 'grid grid-cols-1 md:grid-cols-2',
  3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid grid-cols-1 sm:grid-cols-2',
  5: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  6: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

function Quote({ entry, large = false }: { entry: TestimonialEntry; large?: boolean }) {
  return (
    <figure
      className={[
        'v2-card-h m-0 flex h-full flex-col justify-between gap-6 border border-border p-8',
        large ? 'items-center text-center' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <blockquote
        className={[
          'm-0 font-sans text-foreground',
          large
            ? 'max-w-ui-measure-statement text-ui-feature leading-[1.18] tracking-[-0.03em]'
            : 'text-ui-body leading-[1.62]',
        ].join(' ')}
      >
        {entry.quote}
      </blockquote>
      <figcaption
        className={['flex flex-col gap-2', large ? 'items-center' : 'items-start'].join(' ')}
      >
        {/* Nothing is drawn when the caller has no real rating. See the header. */}
        {typeof entry.rating === 'number' ? <RatingMark value={entry.rating} /> : null}
        <span className="font-mono text-ui-caption text-muted-foreground">
          {entry.author}
          {entry.role ? ` · ${entry.role}` : ''}
        </span>
      </figcaption>
    </figure>
  );
}

export function Testimonials({
  content,
  variant = 'grid',
  ground = 'paper',
}: {
  content: TestimonialsContent;
  variant?: TestimonialsVariant;
  ground?: Ground;
}) {
  const { number, label, title, quotes } = content;
  const shown = quotes.slice(0, 6);
  const single = variant === 'single' || shown.length === 1;

  return (
    <Section id="testimonials" label="Social proof" ground={ground}>
      <Container>
        {label || title ? (
          <div className="flex flex-col gap-ui-eyebrow-gap">
            {label ? <Eyebrow number={number}>{label}</Eyebrow> : null}
            {title ? (
              <h2 className="m-0 max-w-ui-measure-heading font-sans text-ui-section leading-[1.06] [font-weight:var(--ui-weight-heading)] tracking-[-0.035em] text-foreground">
                {title}
              </h2>
            ) : null}
          </div>
        ) : null}

        <div
          className={[
            label || title ? 'mt-ui-gap-grid' : '',
            single ? 'flex justify-center' : `${COLUMNS[shown.length] ?? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-ui-gap-card`,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {single ? (
            <Quote entry={shown[0]} large />
          ) : (
            shown.map((entry, i) => <Quote key={`${entry.author}-${i}`} entry={entry} />)
          )}
        </div>
      </Container>
    </Section>
  );
}
