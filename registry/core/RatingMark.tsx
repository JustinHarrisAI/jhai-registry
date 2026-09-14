import type { CSSProperties } from 'react';

/**
 * RatingMark — the one star recipe.
 *
 * The registry had no rating or review mark at all, which is how a testimonial's `rating`
 * field ended up declared and never drawn in jhai-composer. This is that mark, built as an
 * atom rather than inside Testimonials, because a rating belongs beside a product card and a
 * review row too, and a second copy is how two of them drift.
 *
 * TWO RULES, both load-bearing.
 *
 * 1. It draws with CHARACTERS, not an icon font or an SVG sprite. A star glyph inherits the
 *    current text colour and the current font size, so the mark grays out with the page under
 *    a wireframe theme and scales with its caption. An SVG would need its own fill token and a
 *    size prop, which is two more things to keep in step for no gain at this size.
 *
 * 2. It is accessible as a NUMBER, not as five shapes. The glyphs are aria-hidden and a single
 *    visually-hidden string carries "4.5 out of 5". A screen reader that announced five
 *    separate stars would be reading decoration aloud.
 *
 * Halves round to the nearest half star, which is what every review platform shows and what a
 * scraped Google rating actually contains.
 */

export interface RatingMarkProps {
  /** 0 to `outOf`. Rounded to the nearest half. */
  value: number;
  /** the scale, almost always 5 */
  outOf?: number;
  /** appended after the numeric label, e.g. "Google" */
  source?: string;
  /** show the number beside the stars */
  showValue?: boolean;
  style?: CSSProperties;
}

const FULL = '★';
const EMPTY = '☆';
/* A half star has no reliable single glyph across fonts, so it is a full star at half opacity
   layered over an empty one. Opacity carries no colour of its own, so this stays token-clean. */

export function RatingMark({
  value,
  outOf = 5,
  source,
  showValue = false,
  style,
}: RatingMarkProps) {
  const clamped = Math.max(0, Math.min(outOf, value));
  const halves = Math.round(clamped * 2);
  const full = Math.floor(halves / 2);
  const half = halves % 2 === 1;
  const empty = outOf - full - (half ? 1 : 0);

  /* One decimal, and only when there is one: 5 reads better than 5.0 on a card. */
  const label = Number.isInteger(clamped) ? String(clamped) : clamped.toFixed(1);

  return (
    <span className="inline-flex items-center gap-2" style={style}>
      <span aria-hidden="true" className="font-mono text-ui-caption leading-none text-primary">
        {FULL.repeat(full)}
        {half ? (
          <span className="relative inline-block">
            <span className="opacity-40">{FULL}</span>
          </span>
        ) : null}
        <span className="text-muted-foreground">{EMPTY.repeat(Math.max(0, empty))}</span>
      </span>
      {showValue ? (
        <span className="font-mono text-ui-caption leading-none text-muted-foreground">
          {label}
          {source ? ` · ${source}` : ''}
        </span>
      ) : null}
      <span className="sr-only">
        {label} out of {outOf}
        {source ? `, ${source}` : ''}
      </span>
    </span>
  );
}
