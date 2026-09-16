import type { CSSProperties } from 'react';
import { SEVERITY, type SeverityLevel } from './SeverityMark';

/**
 * RatioBar — "115 of 150 pages", drawn at the proportion it actually is.
 *
 * WHY THE RATIO IS WORTH A COMPONENT
 *
 * "115 of your 150 pages have no meta description" and "8 of your 150 pages
 * share a title" are the same sentence shape carrying completely different
 * news, and a reader skimming a list of them does not stop to divide. Three
 * quarters of a site against one twentieth of it is the difference between a
 * rewrite and an afternoon, and in a sentence that difference is buried in the
 * middle.
 *
 * THE DENOMINATOR RULE, WHICH IS THE ONLY THING THIS MUST GET RIGHT
 *
 * `total` must be the denominator belonging to the thing being counted, never
 * a convenient larger number from the surrounding context. The failure is
 * specific and was live in production: a count of affected services was drawn
 * against the site's total page count, so "3 of your 150 services" appeared on
 * a site with twenty services. The numerator was right, the denominator was a
 * different quantity entirely, and the sentence was arithmetically false.
 *
 * A bar drawn against the wrong denominator does not merely mislabel. It draws
 * 2% where the truth is 15%, and a picture of a false number is worse than the
 * false number alone, because the picture is what gets believed.
 *
 * So this renders nothing at all unless it has a positive total and a count
 * that fits inside it. A caller who cannot supply both keeps its sentence and
 * loses its bar, which is the correct degradation.
 *
 * THE NUMBERS ARE ALWAYS TEXT
 *
 * Both numbers and the percentage render as text under the bar. The bar adds
 * proportion to a fact that is fully readable without it.
 */

export interface RatioBarProps {
  /** How many items are affected. */
  count: number;
  /** What they are affected out of. The count's OWN total. */
  total: number;
  /** Plural noun for what is counted, e.g. "pages", "services", "orders". */
  subject: string;
  /** Tints the bar to match the finding it belongs to. */
  level?: SeverityLevel;
  className?: string;
  style?: CSSProperties;
}

export function RatioBar({
  count,
  total,
  subject,
  level = 'low',
  className,
  style,
}: RatioBarProps) {
  /*
   * Each of these is a reason to draw nothing rather than draw something wrong.
   * A zero total is a division by zero, and a count above its own total means
   * the two numbers came from different quantities, which is the precise bug
   * the denominator rule above exists to catch.
   */
  if (!Number.isFinite(count) || !Number.isFinite(total)) return null;
  if (total <= 0 || count < 0 || count > total) return null;

  const spec = SEVERITY[level] ?? SEVERITY.low;
  const share = (count / total) * 100;

  /*
   * A true 0.7% is a third of a pixel on a 380px track, which rounds away and
   * reads as "no bar drawn" rather than as "almost none". The floor keeps a
   * hairline visible. It only ever applies to a non-zero count, so it can never
   * invent a problem that does not exist.
   */
  const drawn = count === 0 ? 0 : Math.max(share, 0.8);

  return (
    <div className={className} style={style}>
      <div
        className="relative h-1.5 overflow-hidden rounded-ui-pill"
        style={{
          background: spec.tint,
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
        }}
        aria-hidden
      >
        <div
          className="absolute inset-y-0 left-0 rounded-ui-pill"
          style={{
            width: `${drawn}%`,
            background: spec.color,
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact',
          }}
        />
      </div>
      <p className="mt-1.5 font-mono text-ui-micro tracking-[0.16em] uppercase text-muted-foreground">
        {count.toLocaleString('en-US')} of {total.toLocaleString('en-US')} {subject}
        {' · '}
        {/*
         * Rounded to a whole percent, and never to 0% while anything is
         * affected. "0%" beside "8 of 150" is a contradiction the reader has to
         * resolve, and they resolve it in favour of the percentage.
         */}
        {count === 0 ? '0%' : `${Math.max(1, Math.round(share))}%`}
      </p>
    </div>
  );
}
